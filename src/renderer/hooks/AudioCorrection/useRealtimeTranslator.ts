import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GeminiBlob } from '@google/genai';
// @ts-ignore
import { WavRecorder } from '@renderer/lib/wavtools/index.js';
// @ts-ignore
import { WavRenderer } from '@renderer/FastTranslate/ui/utils/wav_renderer';
import { createGeminiPcmBlob } from '@renderer/utils/gemini_audio';
import { AiSettings } from '@renderer/components/AudioCorrection/SettingsModal';
import { webStore } from '../../services/WebIntegration';

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



export const useRealtimeTranslator = (instructions: string, settings: AiSettings) => {
    const wavRecorderRef = useRef<any>(null);
    const conversationContentRef = useRef<HTMLDivElement | null>(null);
    const clientCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const settingsRef = useRef<AiSettings>(settings);
    const isWaitingToContinueRef = useRef(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const isSessionClosedRef = useRef(false);
    const isActivityActiveRef = useRef(false);
    const lastVoiceActivityRef = useRef<number>(0);
    const hasUserSpokenRef = useRef(false);
    const liveSessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const microphoneStreamRef = useRef<MediaStream | null>(null);
    const fullUserTranscriptRef = useRef('');
    const currentUserTurnTranscriptRef = useRef('');
    const currentAssistantTurnTranscriptRef = useRef('');
    const silenceMonitorIntervalRef = useRef<number | null>(null);
    const autoResumeTimeoutRef = useRef<number | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [isWaitingToContinue, setIsWaitingToContinue] = useState(false);
    const [isModelResponding, setIsModelResponding] = useState(false);
    const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>('');
    const [isClientAudioActive, setIsClientAudioActive] = useState(false);

    const [items, setItems] = useState<ConversationItem[]>([]);
    const [liveAssistantText, setLiveAssistantText] = useState('');
    const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedInputDevice, setSelectedInputDevice] = useState<string>('');
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

        // Use a blob URL for the worklet to avoid import.meta issues and path errors
        const workletCode = `
          class PCMProcessor extends AudioWorkletProcessor {
            constructor(options) {
              super();
              const opts = (options && options.processorOptions) || {};
              this.chunkSize = Number(opts.chunkSize || 4096);
              this._buffer = new Float32Array(0);
            }

            _appendBuffer(input) {
                if (!input || input.length === 0) return;
                const oldLen = this._buffer.length;
                const newBuf = new Float32Array(oldLen + input.length);
                newBuf.set(this._buffer, 0);
                newBuf.set(input, oldLen);
                this._buffer = newBuf;
            }

            _flushChunks() {
                while (this._buffer.length >= this.chunkSize) {
                    const chunk = this._buffer.subarray(0, this.chunkSize);
                    const copy = new Float32Array(chunk.length);
                    copy.set(chunk);

                    // Calculate volume (RMS)
                    let sum = 0;
                    for (let i = 0; i < copy.length; i++) {
                        sum += copy[i] * copy[i];
                    }
                    const rms = Math.sqrt(sum / copy.length);

                    this.port.postMessage({ type: 'audio', samples: copy, volume: rms }, [copy.buffer]);

                    const remaining = this._buffer.subarray(this.chunkSize);
                    const tail = new Float32Array(remaining.length);
                    tail.set(remaining);
                    this._buffer = tail;
                }
            }

            process(inputs) {
                const inputChannelData = (inputs[0] && inputs[0][0]) || null; // mono varsayıyoruz

                if (inputChannelData) {
                    this._appendBuffer(inputChannelData);
                    this._flushChunks();
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
                if (isSessionClosedRef.current || !isActivityActiveRef.current) {
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
                        if (!isSessionClosedRef.current) {
                            session.sendRealtimeInput({ media: blob });
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
        setIsClientAudioActive(false);
    }, []);

    const stopTranslation = useCallback(async () => {
        console.log('🛑 Disconnecting conversation...');
        isSessionClosedRef.current = true;
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
            const wavRecorder = wavRecorderRef.current;
            if (wavRecorder && wavRecorder.getStatus() === 'recording') {
                await wavRecorder.pause();
            }
            if (wavRecorder) {
                await wavRecorder.end();
            }
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

        fullUserTranscriptRef.current = '';
        currentUserTurnTranscriptRef.current = '';
        currentAssistantTurnTranscriptRef.current = '';
        hasUserSpokenRef.current = false;
        setLiveAssistantText('');
        setIsWaitingToContinue(false);
        setIsModelResponding(false);
        setIsClientAudioActive(false);

        console.log('🔚 Disconnection complete');
    }, [teardownAudioGraph]);

    const sendActivityStart = useCallback(async () => {
        if (!liveSessionPromiseRef.current || isActivityActiveRef.current || isSessionClosedRef.current) return;

        const session = await liveSessionPromiseRef.current;
        session.sendRealtimeInput({ activityStart: {} });
        isActivityActiveRef.current = true;
        lastVoiceActivityRef.current = Date.now();
        console.log('🎙️ Activity started');
    }, []);

    const sendActivityEnd = useCallback(async () => {
        if (!liveSessionPromiseRef.current || !isActivityActiveRef.current || isSessionClosedRef.current) return;

        const session = await liveSessionPromiseRef.current;
        session.sendRealtimeInput({ activityEnd: {} });
        isActivityActiveRef.current = false;
        console.log('⏹️ Activity ended');
    }, []);



    const startTranslation = useCallback(async () => {
        const apiKey = webStore.get('gemini-api-key');
        if (!apiKey) {
            alert('Gemini API key is required. Please set it in the settings.');
            return;
        }

        isSessionClosedRef.current = false;
        setIsConnected(true);
        setIsWaitingToContinue(false);
        setIsModelResponding(false);
        setItems([]);

        fullUserTranscriptRef.current = '';
        currentUserTurnTranscriptRef.current = '';
        currentAssistantTurnTranscriptRef.current = '';
        hasUserSpokenRef.current = false;
        lastVoiceActivityRef.current = Date.now();

        const wavRecorder = wavRecorderRef.current;

        await wavRecorder.begin();

        aiRef.current = new GoogleGenAI({ apiKey });

        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphoneStreamRef.current = micStream;

        const currentSettings = settingsRef.current;
        const safeTemperature = Math.min(2, Math.max(0, currentSettings.temperature ?? 1));
        const safeThinkingBudget = Number.isFinite(currentSettings.thinkingBudget)
            ? Math.max(0, Math.round(currentSettings.thinkingBudget))
            : 0;

        const config: Record<string, any> = {
            responseModalities: [Modality.TEXT],
            inputAudioTranscription: {},
            systemInstruction: instructions,
            temperature: safeTemperature,
            maxOutputTokens: currentSettings.maxResponseTokens,
            realtimeInputConfig: {
                automaticActivityDetection: {
                    disabled: true,
                },
            },
        };

        if (safeThinkingBudget > 0) {
            config.thinkingConfig = { thinkingBudget: safeThinkingBudget };
        }

        liveSessionPromiseRef.current = aiRef.current.live.connect({
            model: 'gemini-live-2.5-flash-preview',
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
                onmessage: (message: LiveServerMessage) => {
                    const inputText = message.serverContent?.inputTranscription?.text;
                    if (inputText) {
                        console.log('👤 User said:', inputText);
                        currentUserTurnTranscriptRef.current += inputText;
                    }

                    const modelTurnParts = (message.serverContent as any)?.modelTurn?.parts;
                    if (Array.isArray(modelTurnParts)) {
                        setIsModelResponding(true);
                        for (const part of modelTurnParts) {
                            if (typeof part?.text === 'string') {
                                const trimmed = part.text.trim();
                                if (!trimmed) continue;
                                const lower = trimmed.toLowerCase();
                                if (
                                    lower.includes('thought process') ||
                                    lower.includes("i've successfully") ||
                                    lower.startsWith('now that the request is fulfilled') ||
                                    lower.startsWith('processing ') ||
                                    lower.startsWith('analysis:') ||
                                    lower.startsWith('okay, ')
                                ) {
                                    continue;
                                }
                                console.log('📝 Assistant text part:', trimmed);
                                currentAssistantTurnTranscriptRef.current += (currentAssistantTurnTranscriptRef.current ? ' ' : '') + trimmed;
                            }
                        }
                    }

                    // Anında güncelle - efekt yok
                    const liveText = currentAssistantTurnTranscriptRef.current.trim();
                    setLiveAssistantText(liveText);

                    if (message.serverContent?.turnComplete) {
                        console.log('🔄 Turn complete');
                        setIsModelResponding(false);
                        const userTranscript = currentUserTurnTranscriptRef.current.trim();
                        const assistantTranscript = currentAssistantTurnTranscriptRef.current.trim();

                        if (userTranscript) {
                            fullUserTranscriptRef.current += (fullUserTranscriptRef.current ? ' ' : '') + userTranscript;
                        }

                        const newItems: ConversationItem[] = [];
                        if (fullUserTranscriptRef.current) {
                            newItems.push({
                                id: crypto.randomUUID(),
                                role: 'user',
                                transcript: fullUserTranscriptRef.current
                            });
                        }
                        if (assistantTranscript) {
                            newItems.push({
                                id: crypto.randomUUID(),
                                role: 'assistant',
                                transcript: assistantTranscript
                            });
                        }
                        setItems(newItems);

                        currentUserTurnTranscriptRef.current = '';
                        currentAssistantTurnTranscriptRef.current = '';
                        hasUserSpokenRef.current = false;
                        lastVoiceActivityRef.current = Date.now();
                        setLiveAssistantText('');
                        setIsWaitingToContinue(true);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('❌ Live session error:', e);
                    alert('Gemini Live session error: ' + e.message);
                    stopTranslation();
                },
                onclose: () => {
                    console.log('🔌 Session closed');
                    isSessionClosedRef.current = true;
                },
            },
            config,
        }) as unknown as Promise<LiveSession>;

        console.log('🚀 Connecting to Gemini Live...');
    }, [instructions, selectedInputDevice, sendActivityStart, setupAudioGraphWithWorklet, stopTranslation]);



    const triggerTranslation = useCallback(
        async (force = true) => {
            if (!liveSessionPromiseRef.current || isSessionClosedRef.current) return;

            const hasSpeechReady = isActivityActiveRef.current && currentUserTurnTranscriptRef.current.trim().length > 0;
            if (!force && !hasSpeechReady) {
                return;
            }

            setIsWaitingToContinue(false);

            if (isActivityActiveRef.current) {
                await sendActivityEnd();
            }

            const session = await liveSessionPromiseRef.current;
            if (!isSessionClosedRef.current) {
                session.sendRealtimeInput({ text: '', turnComplete: true });
            }
            lastVoiceActivityRef.current = Date.now();

            console.log('🔄 Translation triggered');
        },
        [sendActivityEnd]
    );

    const continueTranslation = useCallback(async () => {
        const wavRecorder = wavRecorderRef.current;
        if (!wavRecorder) return;

        setIsWaitingToContinue(false);
    }, []);

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
            if (isSessionClosedRef.current) return;
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
            if (isSessionClosedRef.current) return;
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
    }, [items, liveAssistantText]);

    useEffect(() => {
        wavRecorderRef.current = new WavRecorder({ sampleRate: 16000 });
    }, []);

    useEffect(() => {
        let isLoaded = true;
        let clientCtx: CanvasRenderingContext2D | null = null;

        const render = () => {
            if (!isLoaded) return;

            const wavRecorder = wavRecorderRef.current;
            const clientCanvas = clientCanvasRef.current;

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


            window.requestAnimationFrame(render);
        };

        render();
        return () => {
            isLoaded = false;
        };
    }, []);

    return {
        conversationContentRef,
        items,
        liveAssistantText,
        isConnected,
        isModelResponding,
        startTranslation,
        stopTranslation,
        triggerTranslation,
        continueTranslation,
        isWaitingToContinue,
        deleteConversationItem,
        availableDevices,
        selectedInputDevice,
        setSelectedInputDevice,
        selectedOutputDevice,
        setSelectedOutputDevice,
        getAudioDevices,
        clientCanvasRef,
        isClientAudioActive,
    };
};
