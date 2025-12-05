import { useState, useRef, useCallback, useEffect } from 'react';
// @ts-ignore
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';
// @ts-ignore
import { WavRenderer } from '../utils/wav_renderer.ts';
import { createGeminiPcmBlob, b64ToInt16 } from '../utils/gemini_audio';
import { AiSettings } from '../components/SettingsModal';
import { DEFAULT_GEMINI_VOICE, GEMINI_VOICE_OPTIONS, GeminiVoiceName } from '../config/geminiVoices';
import { webStore } from '../../../services/WebIntegration';

// Type definitions for Google GenAI types that we need to use before the dynamic import
type GeminiBlob = {
  mimeType?: string;
  data?: string;
};

export type LiveWord = {
  id: string;
  text: string;
};

type ConversationItem = {
  id: string;
  role: 'user' | 'assistant';
  transcript: string;
};

type LiveSession = {
  sendRealtimeInput: (p: {
    media?: GeminiBlob;
    activityStart?: Record<string, never>;
    activityEnd?: Record<string, never>;
    text?: string;
    turnComplete?: boolean;
  }) => void;
  close: () => void;
};

type StartTranslationOptions = {
  forceInputMode?: 'mic' | 'system';
};

export const useRealtimeTranslator = (instructions: string, settings: AiSettings) => {
  const wavRecorderRef = useRef<any>(null);
  const wavStreamPlayerRef = useRef<any>(null);
  const clientCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const conversationContentRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<ConversationItem[]>([]);
  const [liveAssistantText, setLiveAssistantText] = useState('');
  const [liveAssistantWords, setLiveAssistantWords] = useState<LiveWord[]>([]);
  const [activeLiveWordId, setActiveLiveWordId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isClientAudioActive, setIsClientAudioActive] = useState(false);
  const [isServerAudioActive, setIsServerAudioActive] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState<string>('');
  const [inputMode, setInputMode] = useState<'mic' | 'system'>('mic');
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>('');
  const [isRecordingPausedBySystem, setIsRecordingPausedBySystem] = useState(false);
  const [isWaitingToContinue, setIsWaitingToContinue] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const aiRef = useRef<any>(null);
  const liveSessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);

  const isMutedRef = useRef(false);

  const currentUserTurnTranscriptRef = useRef<string>('');
  const currentAssistantTurnTranscriptRef = useRef<string>('');
  const assistantAudioReceivedRef = useRef(false);
  const currentTrackIdRef = useRef<string>('');
  const isActivityActiveRef = useRef(false);
  const hasUserSpokenRef = useRef(false);
  const lastVoiceActivityRef = useRef<number>(Date.now());
  const silenceMonitorIntervalRef = useRef<number | null>(null);
  const autoResumeTimeoutRef = useRef<number | null>(null);
  const isWaitingToContinueRef = useRef(false);
  const liveAssistantTextRef = useRef('');
  const liveAssistantWordsRef = useRef<LiveWord[]>([]);
  const lastInputModeRef = useRef<'mic' | 'system'>('mic');

  const sendText = useCallback(async (text: string) => {
    if (!liveSessionPromiseRef.current) return;

    // If we are not connected, we might want to connect first? 
    // For now assume connected.

    const session = await liveSessionPromiseRef.current;
    session.sendRealtimeInput({ text, turnComplete: true });

    // Add to user transcript for display immediately
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        transcript: text,
      },
    ]);

    console.log('📤 Text sent:', text);
  }, []);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    isWaitingToContinueRef.current = isWaitingToContinue;
  }, [isWaitingToContinue]);

  const getAudioDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const allDevices = await navigator.mediaDevices.enumerateDevices();

      const filteredDevices = allDevices.filter(
        device => !device.label.toLowerCase().includes('communications')
      );

      setAvailableDevices(filteredDevices);
      return filteredDevices;
    } catch (error) {
      console.error('Error getting audio devices:', error);
      setAvailableDevices([]);
      return [];
    }
  }, []);

  const setupAudioGraphWithWorklet = useCallback(async (stream: MediaStream) => {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx({ sampleRate: 16000 });
    audioContextRef.current = ctx;

    // Use a blob URL for the worklet to avoid import.meta issues
    const workletCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        constructor(options) {
          super();
          this.chunkSize = options.processorOptions.chunkSize || 4096;
          this.buffer = new Float32Array(this.chunkSize);
          this.index = 0;
        }

        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (!input || !input.length) return true;
          
          const channelData = input[0];
          for (let i = 0; i < channelData.length; i++) {
            this.buffer[this.index++] = channelData[i];
            if (this.index >= this.chunkSize) {
              this.port.postMessage({ type: 'audio', samples: this.buffer.slice() });
              this.index = 0;
            }
          }
          return true;
        }
      }
      registerProcessor('pcm-processor', PCMProcessor);
    `;
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);

    await ctx.audioWorklet.addModule(workletUrl);

    const source = ctx.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(ctx, 'pcm-processor', {
      processorOptions: { chunkSize: 4096 },
    });

    workletNodeRef.current = node;

    node.port.onmessage = (event: MessageEvent) => {
      const { type, samples } = (event.data || {}) as { type: string; samples?: Float32Array };
      if (type === 'audio' && samples) {
        if (!isActivityActiveRef.current) {
          if (process.env.NODE_ENV === 'development') {
            console.info('[Gemini] Dropping mic chunk because no manual activity is active.');
          }
          return;
        }

        let hasVoice = false;
        for (let i = 0; i < samples.length; i++) {
          if (Math.abs(samples[i]) > 0.01) {
            hasVoice = true;
            break;
          }
        }
        if (hasVoice) {
          lastVoiceActivityRef.current = Date.now();
          hasUserSpokenRef.current = true;
        }

        const blob: GeminiBlob = createGeminiPcmBlob(samples);
        if (liveSessionPromiseRef.current) {
          liveSessionPromiseRef.current.then((session: LiveSession) => {
            session.sendRealtimeInput({ media: blob });
            if (process.env.NODE_ENV === 'development') {
              console.info('[Gemini] Uploaded mic chunk (manual activity mode).');
            }
          });
        }
      }
    };

    source.connect(node);
  }, []);

  const teardownAudioGraph = useCallback(async () => {
    if (workletNodeRef.current) {
      try {
        workletNodeRef.current.port.onmessage = null as any;
        workletNodeRef.current.disconnect();
      } catch { }
      workletNodeRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        await audioContextRef.current.close();
      } catch { }
      audioContextRef.current = null;
    }
  }, []);

  const stopTranslation = useCallback(async () => {
    console.log('🛑 Disconnecting conversation...');
    setIsConnected(false);

    try {
      if (liveSessionPromiseRef.current) {
        const session = await liveSessionPromiseRef.current;
        session.close();
        console.log('✅ Live session closed');
      }
    } catch (e) {
      console.error('Error closing session:', e);
    }
    liveSessionPromiseRef.current = null;
    isActivityActiveRef.current = false;

    try {
      const wavStreamPlayer = wavStreamPlayerRef.current;
      await wavStreamPlayer.interrupt();
      console.log('✅ Audio playback interrupted');
    } catch (e) {
      console.error('Error interrupting audio:', e);
    }

    try {
      const wavRecorder = wavRecorderRef.current;
      if (wavRecorder.getStatus() === 'recording') {
        await wavRecorder.pause();
      }
      await wavRecorder.end();
      console.log('✅ Recorder stopped');
    } catch (e) {
      console.error('Error stopping recorder:', e);
    }

    try {
      await teardownAudioGraph();
      console.log('✅ Audio graph cleaned');
    } catch (e) {
      console.error('Error cleaning audio graph:', e);
    }

    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((t) => t.stop());
      microphoneStreamRef.current = null;
      console.log('✅ Microphone stream stopped');
    }

    if (lastInputModeRef.current === 'system' && wavRecorderRef.current?.stream) {
      wavRecorderRef.current.stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    }

    currentUserTurnTranscriptRef.current = '';
    currentAssistantTurnTranscriptRef.current = '';
    assistantAudioReceivedRef.current = false;
    currentTrackIdRef.current = '';
    lastInputModeRef.current = 'mic';
    hasUserSpokenRef.current = false;
    liveAssistantTextRef.current = '';
    liveAssistantWordsRef.current = [];
    setLiveAssistantText('');
    setLiveAssistantWords([]);
    setActiveLiveWordId(null);
    setIsRecordingPausedBySystem(false);
    setIsWaitingToContinue(false);
    setInputMode('mic');

    console.log('🔚 Disconnection complete');
  }, [teardownAudioGraph]);

  const sendActivityStart = useCallback(async () => {
    if (!liveSessionPromiseRef.current || isActivityActiveRef.current) return;

    const session = await liveSessionPromiseRef.current;
    session.sendRealtimeInput({ activityStart: {} });
    isActivityActiveRef.current = true;
    lastVoiceActivityRef.current = Date.now();
    if (process.env.NODE_ENV === 'development') {
      console.info('[Gemini] activityStart sent.');
    }
    console.log('🎙️ Activity started');
  }, []);

  const sendActivityEnd = useCallback(async () => {
    if (!liveSessionPromiseRef.current || !isActivityActiveRef.current) return;

    const session = await liveSessionPromiseRef.current;
    session.sendRealtimeInput({ activityEnd: {} });
    isActivityActiveRef.current = false;
    if (process.env.NODE_ENV === 'development') {
      console.info('[Gemini] activityEnd sent.');
    }
    console.log('⏹️ Activity ended');
  }, []);

  const pauseInputCapture = useCallback(async () => {
    const wavRecorder = wavRecorderRef.current;
    if (!wavRecorder || !isConnected) return;

    setIsWaitingToContinue(false);

    try {
      if (wavRecorder.getStatus() === 'recording') {
        await wavRecorder.pause();
      }
    } catch (err) {
      console.error('Error pausing recorder:', err);
    }

    setIsRecordingPausedBySystem(true);
  }, [isConnected]);

  const startTranslation = useCallback(async (options?: StartTranslationOptions) => {
    const effectiveInputMode = options?.forceInputMode ?? inputMode;

    // Fetch the API key from webStore
    const apiKey = webStore.get('gemini-api-key');

    if (!apiKey) {
      alert('Gemini API key is required. Please set it in the settings.');
      return;
    }

    // Dynamically import GoogleGenAI
    let GoogleGenAI;
    let Modality;
    try {
      const genAIModule = await import('@google/genai');
      GoogleGenAI = genAIModule.GoogleGenAI;
      Modality = genAIModule.Modality;
    } catch (error) {
      console.error('Failed to load @google/genai:', error);
      alert('Failed to load Gemini SDK.');
      return;
    }

    setIsConnected(true);
    setIsRecordingPausedBySystem(false);
    setIsWaitingToContinue(false);
    setItems([]);

    currentUserTurnTranscriptRef.current = '';
    currentAssistantTurnTranscriptRef.current = '';
    assistantAudioReceivedRef.current = false;
    currentTrackIdRef.current = '';
    hasUserSpokenRef.current = false;
    lastVoiceActivityRef.current = Date.now();

    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    if (effectiveInputMode === 'system') {
      const systemStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: { frameRate: 5 },
      });
      if (!systemStream.getAudioTracks().length) {
        throw new Error('Unable to capture system audio. Please ensure "Share tab/system audio" is enabled.');
      }
      await wavRecorder.beginWithStream(systemStream);
    } else {
      if (selectedInputDevice) {
        await wavRecorder.begin(selectedInputDevice);
      } else {
        await wavRecorder.begin();
      }
    }

    // @ts-ignore
    if (selectedOutputDevice && wavStreamPlayer.setSinkId) {
      try {
        // @ts-ignore
        await wavStreamPlayer.setSinkId(selectedOutputDevice);
      } catch (err) {
        console.warn('Unable to set output device:', err);
      }
    }

    await wavStreamPlayer.connect();

    aiRef.current = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });

    const micStream = effectiveInputMode === 'system'
      ? (wavRecorderRef.current?.stream as MediaStream)
      : await navigator.mediaDevices.getUserMedia({ audio: true });
    microphoneStreamRef.current = micStream;
    lastInputModeRef.current = effectiveInputMode;

    const currentSettings = settingsRef.current;
    const safeTemperature = Math.min(2, Math.max(0, currentSettings.temperature ?? 1));
    const safeThinkingBudget = Number.isFinite(currentSettings.thinkingBudget)
      ? Math.max(0, Math.round(currentSettings.thinkingBudget))
      : 0;
    const rawVoice = currentSettings.voiceName?.trim() || DEFAULT_GEMINI_VOICE;
    const normalizedVoice = GEMINI_VOICE_OPTIONS.includes(rawVoice as GeminiVoiceName)
      ? (rawVoice as GeminiVoiceName)
      : DEFAULT_GEMINI_VOICE;
    const styleInstruction = currentSettings.styleInstruction?.trim();

    let systemInstruction = instructions;
    if (styleInstruction) {
      systemInstruction += `\n\nSpeaking style preference (very important):\n${styleInstruction}`;
    }

    const config: Record<string, any> = {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction,
      temperature: safeTemperature,
      maxOutputTokens: currentSettings.maxResponseTokens,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: normalizedVoice },
        },
      },
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: true,
        },
      },
    };

    if (safeThinkingBudget > 0) {
      config.thinkingConfig = { thinkingBudget: safeThinkingBudget };
    }

    if (currentSettings.enableAffectiveDialog) {
      config.enableAffectiveDialog = true;
    }

    if (currentSettings.proactiveAudio) {
      config.proactivity = { proactiveAudio: true };
    }

    liveSessionPromiseRef.current = aiRef.current.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: async () => {
          console.log('✅ Live session opened');
          try {
            await setupAudioGraphWithWorklet(micStream);
            await wavRecorder.record(() => { });
            await sendActivityStart();
            console.log('🎤 Recording started');
          } catch (e) {
            console.error('Audio pipeline error:', e);
            alert('Audio pipeline error. Please check microphone permissions.');
            stopTranslation();
          }
        },
        onmessage: (message: any) => {
          // Kullanıcının konuşma transkripsiyonu
          const inputText = message.serverContent?.inputTranscription?.text;
          if (inputText) {
            console.log('👤 User said:', inputText);
            currentUserTurnTranscriptRef.current += inputText;
          }

          // Asistanın konuşma transkripsiyonu
          const outputText = message.serverContent?.outputTranscription?.text;
          if (outputText) {
            console.log('🤖 Assistant transcription:', outputText);
            currentAssistantTurnTranscriptRef.current += outputText;
          }

          const modelTurnParts = (message.serverContent as any)?.modelTurn?.parts;
          if (Array.isArray(modelTurnParts)) {
            for (const part of modelTurnParts) {
              if (typeof part?.text === 'string') {
                const trimmed = part.text.trim();
                if (!trimmed) continue;
                const lower = trimmed.toLowerCase();
                if (
                  trimmed.startsWith('**') ||
                  lower.includes('thought process') ||
                  lower.includes("i've successfully") ||
                  lower.startsWith('now that the request is fulfilled') ||
                  lower.startsWith('processing ')
                ) {
                  continue;
                }
                console.log('📝 Assistant text part:', trimmed);
                currentAssistantTurnTranscriptRef.current += (currentAssistantTurnTranscriptRef.current ? ' ' : '') + trimmed;
              }

              const inlineData = (part as any)?.inlineData;
              if (inlineData?.data) {
                const mimeType = inlineData?.mimeType || inlineData?.type || inlineData?.mime_type;
                if (typeof mimeType === 'string' && mimeType.includes('audio')) {
                  try {
                    console.log('🔊 Found audio in inlineData, base64 length:', inlineData.data.length);
                    const int16 = b64ToInt16(inlineData.data);
                    if (int16 && int16.length) {
                      const trackId = currentTrackIdRef.current || crypto.randomUUID();
                      if (!isMutedRef.current) {
                        wavStreamPlayer.add16BitPCM(int16, trackId);
                      }
                      assistantAudioReceivedRef.current = true;
                      console.log('✅ Audio added to track:', trackId, 'samples:', int16.length);
                    }
                  } catch (err) {
                    console.error('❌ Failed to decode audio:', err);
                  }
                }
              }
            }
          }

          const serverInlineData = (message.serverContent as any)?.inlineData;
          if (serverInlineData?.data) {
            const serverMime = serverInlineData?.mimeType || serverInlineData?.type || serverInlineData?.mime_type;
            if (typeof serverMime === 'string' && serverMime.includes('audio')) {
              try {
                console.log('🔊 Found audio in inlineData, base64 length:', serverInlineData.data.length);
                const int16 = b64ToInt16(serverInlineData.data);
                if (int16 && int16.length) {
                  const trackId = currentTrackIdRef.current || crypto.randomUUID();
                  wavStreamPlayer.add16BitPCM(int16, trackId);
                  assistantAudioReceivedRef.current = true;
                  console.log('✅ Audio added to track:', trackId, 'samples:', int16.length);
                }
              } catch (err) {
                console.error('❌ Failed to decode audio:', err);
              }
            }
          }

          const rawAssistantText = currentAssistantTurnTranscriptRef.current;
          const trimmedLiveText = rawAssistantText.trim();
          if (trimmedLiveText.length) {
            setLiveAssistantText(trimmedLiveText);
            liveAssistantTextRef.current = rawAssistantText;

            const tokens = trimmedLiveText.split(/\s+/);
            const nextWords: LiveWord[] = [];
            const prevWords = liveAssistantWordsRef.current;

            for (let i = 0; i < tokens.length; i += 1) {
              const token = tokens[i];
              const prevWord = prevWords[i];
              if (prevWord && prevWord.text === token) {
                nextWords.push(prevWord);
              } else {
                nextWords.push({ id: crypto.randomUUID(), text: token });
              }
            }

            liveAssistantWordsRef.current = nextWords;
            setLiveAssistantWords(nextWords);

            const lastWordId = nextWords[nextWords.length - 1]?.id ?? null;
            setActiveLiveWordId(lastWordId ?? null);
          } else {
            liveAssistantTextRef.current = '';
            liveAssistantWordsRef.current = [];
            setLiveAssistantText('');
            setLiveAssistantWords([]);
            setActiveLiveWordId(null);
          }

          // Turn başladığında yeni trackId oluştur
          if (message.serverContent?.generationComplete === true && !currentTrackIdRef.current) {
            currentTrackIdRef.current = crypto.randomUUID();
            console.log('🆕 New turn started, trackId:', currentTrackIdRef.current);
          }

          // Turn tamamlandığında konuşmaları kaydet
          if (message.serverContent?.turnComplete) {
            console.log('🔄 Turn complete');
            const userTranscript = currentUserTurnTranscriptRef.current.trim();
            const assistantTranscript = currentAssistantTurnTranscriptRef.current.trim();

            if (userTranscript) {
              setItems((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: 'user',
                  transcript: userTranscript,
                },
              ]);
            }

            const hasAssistantAudio = assistantAudioReceivedRef.current;
            if (assistantTranscript || hasAssistantAudio) {
              setItems((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  transcript: assistantTranscript || '(Audio response)',
                },
              ]);
            }

            currentUserTurnTranscriptRef.current = '';
            currentAssistantTurnTranscriptRef.current = '';
            assistantAudioReceivedRef.current = false;
            currentTrackIdRef.current = '';
            hasUserSpokenRef.current = false;
            lastVoiceActivityRef.current = Date.now();
            liveAssistantTextRef.current = '';
            liveAssistantWordsRef.current = [];
            setLiveAssistantText('');
            setLiveAssistantWords([]);
            setActiveLiveWordId(null);
          }
        },
        onerror: (e: ErrorEvent) => {
          console.error('❌ Live session error:', e);
          alert('Gemini Live session error: ' + e.message);
          stopTranslation();
        },
        onclose: () => {
          console.log('🔌 Session closed');
        },
      },
      config,
    }) as unknown as Promise<LiveSession>;

    console.log('🚀 Connecting to Gemini Live...');
  }, [instructions, selectedInputDevice, selectedOutputDevice, inputMode, sendActivityStart, setupAudioGraphWithWorklet, stopTranslation]);

  // AI konuşurken mikrofonu yöneten effect
  useEffect(() => {
    const wavRecorder = wavRecorderRef.current;
    if (!wavRecorder || !isConnected) return;

    if (isServerAudioActive && !isRecordingPausedBySystem) {
      pauseInputCapture();
      if (process.env.NODE_ENV === 'development') {
        console.info('[Gemini] Server speaking -> mic paused.');
      }
    } else if (!isServerAudioActive && isRecordingPausedBySystem) {
      setIsWaitingToContinue(true);
      if (process.env.NODE_ENV === 'development') {
        console.info('[Gemini] Server finished -> waiting for Continue button.');
      }
    }
  }, [isServerAudioActive, isConnected, isRecordingPausedBySystem, pauseInputCapture]);

  const triggerTranslation = useCallback(
    async (force = true) => {
      if (!liveSessionPromiseRef.current) return;

      const hasSpeechReady = isActivityActiveRef.current && currentUserTurnTranscriptRef.current.trim().length > 0;
      if (!force && !hasSpeechReady) {
        return;
      }

      setIsWaitingToContinue(false);
      await pauseInputCapture();

      if (isActivityActiveRef.current) {
        await sendActivityEnd();
      }

      const session = await liveSessionPromiseRef.current;
      session.sendRealtimeInput({ text: '', turnComplete: true });
      lastVoiceActivityRef.current = Date.now();

      if (process.env.NODE_ENV === 'development') {
        console.info('[Gemini] Translate Now command dispatched.');
      }
      console.log('🔄 Translation triggered');
    },
    [sendActivityEnd, pauseInputCapture]
  );

  const continueTranslation = useCallback(async () => {
    const wavRecorder = wavRecorderRef.current;
    if (!wavRecorder) return;

    setIsWaitingToContinue(false);

    if (isRecordingPausedBySystem) {
      if (!liveSessionPromiseRef.current) return;

      await wavRecorder.record(() => { });
      setIsRecordingPausedBySystem(false);
      await sendActivityStart();
      if (process.env.NODE_ENV === 'development') {
        console.info('[Gemini] Continue button pressed -> mic resumed.');
      }
      console.log('🎤 Recording resumed');
    }
  }, [isRecordingPausedBySystem, sendActivityStart]);

  useEffect(() => {
    if (silenceMonitorIntervalRef.current) {
      window.clearInterval(silenceMonitorIntervalRef.current);
      silenceMonitorIntervalRef.current = null;
    }

    const checkSilence = () => {
      const longPauseMs = settingsRef.current.longPauseDuration;
      if (!longPauseMs || longPauseMs <= 0) return;
      if (!isActivityActiveRef.current) return;
      if (isWaitingToContinueRef.current) return;
      if (!hasUserSpokenRef.current) return;
      const idleMs = Date.now() - lastVoiceActivityRef.current;
      if (idleMs >= longPauseMs) {
        console.log('⏱️ Long pause detected -> auto translate.');
        triggerTranslation(false);
        lastVoiceActivityRef.current = Date.now();
      }
    };

    silenceMonitorIntervalRef.current = window.setInterval(checkSilence, 250);

    return () => {
      if (silenceMonitorIntervalRef.current) {
        window.clearInterval(silenceMonitorIntervalRef.current);
        silenceMonitorIntervalRef.current = null;
      }
    };
  }, [triggerTranslation]);

  useEffect(() => {
    if (!isWaitingToContinue) {
      if (autoResumeTimeoutRef.current) {
        window.clearTimeout(autoResumeTimeoutRef.current);
        autoResumeTimeoutRef.current = null;
      }
      return;
    }

    const shortPause = settingsRef.current.shortPauseDuration;
    if (!shortPause || shortPause <= 0) {
      return;
    }

    autoResumeTimeoutRef.current = window.setTimeout(() => {
      if (!isWaitingToContinueRef.current) return;
      console.log('⏯️ Short pause elapsed -> auto continue.');
      continueTranslation();
    }, shortPause);

    return () => {
      if (autoResumeTimeoutRef.current) {
        window.clearTimeout(autoResumeTimeoutRef.current);
        autoResumeTimeoutRef.current = null;
      }
    };
  }, [isWaitingToContinue, continueTranslation]);

  const deleteConversationItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    if (conversationContentRef.current) {
      conversationContentRef.current.scrollTop = conversationContentRef.current.scrollHeight;
    }
  }, [items]);

  useEffect(() => {
    const setupDevicesAndClient = async () => {
      const devices = await getAudioDevices();

      if (devices.length > 0 && !selectedInputDevice && !selectedOutputDevice) {
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

        const defaultInput = audioInputs.find(d => !d.label.toLowerCase().includes('cable') && d.deviceId !== 'default');
        if (defaultInput) {
          setSelectedInputDevice(defaultInput.deviceId);
        } else if (audioInputs.length > 0) {
          setSelectedInputDevice(audioInputs[0].deviceId);
        }

        const defaultOutput = audioOutputs.find(d => d.label.toLowerCase().includes('speaker') || d.label.toLowerCase().includes('lautsprecher'));
        if (defaultOutput) {
          setSelectedOutputDevice(defaultOutput.deviceId);
        } else if (audioOutputs.length > 0) {
          setSelectedOutputDevice(audioOutputs[0].deviceId);
        }
      }

      wavRecorderRef.current = new WavRecorder({ sampleRate: 16000 });
      wavStreamPlayerRef.current = new WavStreamPlayer({ sampleRate: 24000 });
    };

    setupDevicesAndClient();
  }, [getAudioDevices, selectedInputDevice, selectedOutputDevice]);

  useEffect(() => {
    let isLoaded = true;
    let clientCtx: CanvasRenderingContext2D | null = null;
    let serverCtx: CanvasRenderingContext2D | null = null;

    const render = () => {
      if (!isLoaded) return;

      const wavRecorder = wavRecorderRef.current;
      const wavStreamPlayer = wavStreamPlayerRef.current;
      const clientCanvas = clientCanvasRef.current;
      const serverCanvas = serverCanvasRef.current;

      if (clientCanvas && wavRecorder) {
        if (!clientCanvas.width || !clientCanvas.height) {
          clientCanvas.width = clientCanvas.offsetWidth;
          clientCanvas.height = clientCanvas.offsetHeight;
        }
        clientCtx = clientCtx || clientCanvas.getContext('2d');
        if (clientCtx) {
          clientCtx.clearRect(0, 0, clientCanvas.width, clientCanvas.height);
          const isRecording = !!wavRecorder.recording;
          const result = isRecording
            ? wavRecorder.getFrequencies('voice')
            : { values: new Float32Array([0]) };
          WavRenderer.drawBars(clientCanvas, clientCtx, result.values, '#0099ff', 10, 0, 8);
          setIsClientAudioActive(isRecording);
        }
      } else {
        setIsClientAudioActive(false);
      }

      if (serverCanvas && wavStreamPlayer) {
        if (!serverCanvas.width || !serverCanvas.height) {
          serverCanvas.width = serverCanvas.offsetWidth;
          serverCanvas.height = serverCanvas.offsetHeight;
        }
        serverCtx = serverCtx || serverCanvas.getContext('2d');
        if (serverCtx) {
          serverCtx.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
          const serverPlaying = !!wavStreamPlayer.stream;
          const result = wavStreamPlayer.analyser && serverPlaying
            ? wavStreamPlayer.getFrequencies('voice')
            : { values: new Float32Array([0]) };
          WavRenderer.drawBars(serverCanvas, serverCtx, result.values, '#fff700', 10, 0, 8);
          setIsServerAudioActive(serverPlaying);
        }
      } else {
        setIsServerAudioActive(false);
      }

      window.requestAnimationFrame(render);
    };

    render();
    return () => {
      isLoaded = false;
    };
  }, []);

  return {
    clientCanvasRef,
    serverCanvasRef,
    conversationContentRef,
    items,
    liveAssistantText,
    liveAssistantWords,
    activeLiveWordId,
    isConnected,
    isClientAudioActive,
    isServerAudioActive,
    startTranslation,
    stopTranslation,
    triggerTranslation,
    continueTranslation,
    isWaitingToContinue,
    deleteConversationItem,
    availableDevices,
    selectedInputDevice,
    setSelectedInputDevice,
    inputMode,
    setInputMode,
    selectedOutputDevice,
    setSelectedOutputDevice,
    getAudioDevices,
    isMuted,
    toggleMute: useCallback(() => {
      isMutedRef.current = !isMutedRef.current;
      setIsMuted(isMutedRef.current);
    }, []),
    sendText,
  };
};
