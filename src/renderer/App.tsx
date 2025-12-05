import '../styles/app.css';
import OptionsGrid from './components/OptionsGrid';

// ... (existing imports)

// ... (inside App component)

const handleShowIntro = () => {
  // Logic to show intro (maybe reset a flag or show a dialog)
  // For now, let's just show the IntroGifDisplay if that's what it is, or a toast
  // The user said "Introduction of the App", maybe they mean the IntroGifDisplay?
  // Let's assume it triggers the IntroGifDisplay.
  // Looking at IntroGifDisplay usage (not visible in previous view_file), let's see if we can toggle it.
  // If not, I'll add a placeholder or simple alert for now, or check if there is an intro state.
  // Wait, I see IntroGifDisplay import.
  // Let's check how it's used.
  // Actually, I'll just add the handler and log it for now or show a toast if I'm unsure.
  // Better: create a state for it if needed.
  // Let's look at the file content again or just add the component.
  // I will add the component in the JSX.
};

// ... (inside return JSX)
// Find where ManualInput is rendered for 'home' view.

// ...

import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { CircularProgress, IconButton, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ArrowBack as IconArrowLeft } from '@mui/icons-material';
import { useToast } from './contexts/ToastContext';
import { v4 as uuidv4 } from 'uuid';

import Header from './components/Header';
import TranslationResultDisplay from './components/TranslationResultDisplay';
import CorrectionResultDisplay from './components/CorrectionResultDisplay';
import ManualInput from './components/ManualInput';
import AudioResultDisplay from './components/AudioResultDisplay';
import HistoryPage from './components/HistoryPage';
import ApiKeyPage from './components/ApiKeyPage';
import ModelsPage from './components/ModelsPage';
import PromptPage from './components/PromptPage';
import DefaultSettingsPage from './components/DefaultSettingsPage';
import LanguageSelectionPage from './components/LanguageSelectionPage';
import VerbConjugationPage from './components/VerbConjugationPage';
import FlashcardPage from './components/FlashcardPage';
import ImageProvidersPage from './components/ImageProvidersPage';
import AboutDialog from './components/AboutDialog'; // NEW
import SecurityIssuesDialog from './components/SecurityIssuesDialog';
import ConsoleViewer from './components/ConsoleViewer';

import { HistoryItem } from './types';
import { FastTranslateWrapper } from './FastTranslate/FastTranslateWrapper';
import { AudioCorrectionWrapper } from './components/AudioCorrection/AudioCorrectionWrapper';
import { webStore, openExternal } from './services/WebIntegration';
import { geminiService } from './services/GeminiService';
import { SendIntent } from 'capacitor-plugin-send-intent';
import { App as CapacitorApp } from '@capacitor/app';

const addToHistory = (source: string, result: string) => {
  let history = webStore.get('history') || [];

  // Filter to keep max 1 existing entry for this source (so adding new one makes max 2)
  const sameSourceItems = history.filter((item: HistoryItem) => item.originalInput === source);
  if (sameSourceItems.length > 0) {
    // Keep the most recent one (index 0), remove others
    const idsToRemove = new Set(sameSourceItems.slice(1).map((i: HistoryItem) => i.id));
    history = history.filter((item: HistoryItem) => !idsToRemove.has(item.id));
  }

  const newItem: HistoryItem = {
    id: uuidv4(),
    originalInput: source,
    rawResult: result,
    timestamp: Date.now(),
    viewCount: 1
  };
  webStore.set('history', [newItem, ...history]);
};

type ViewState =
  | 'home'
  | 'history'
  | 'api-key'
  | 'models'
  | 'prompt'
  | 'default-settings'
  | 'language-selection'
  | 'verb-conjugation'
  | 'flashcards'
  | 'image-providers'


function App() {
  // Console Log State
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<{ type: 'log' | 'warn' | 'error' | 'info', message: string, timestamp: string }[]>([]);

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    const formatMessage = (args: any[]) => {
      return args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
    };

    console.log = (...args) => {
      originalLog(...args);
      setConsoleLogs(prev => [...prev, { type: 'log', message: formatMessage(args), timestamp: new Date().toLocaleTimeString() }]);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      setConsoleLogs(prev => [...prev, { type: 'warn', message: formatMessage(args), timestamp: new Date().toLocaleTimeString() }]);
    };

    console.error = (...args) => {
      originalError(...args);
      setConsoleLogs(prev => [...prev, { type: 'error', message: formatMessage(args), timestamp: new Date().toLocaleTimeString() }]);
    };

    console.info = (...args) => {
      originalInfo(...args);
      setConsoleLogs(prev => [...prev, { type: 'info', message: formatMessage(args), timestamp: new Date().toLocaleTimeString() }]);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, []);

  const handleOpenConsole = () => setIsConsoleOpen(true);
  const handleCloseConsole = () => setIsConsoleOpen(false);
  const handleClearConsole = () => setConsoleLogs([]);

  const { showToast } = useToast();
  const Notification = {
    error: (props: { id?: string; title?: string; content: string; duration?: number }) => showToast(props.content, 'error'),
    success: (props: { id?: string; title?: string; content: string; duration?: number }) => showToast(props.content, 'success'),
  };

  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [rawTextOutput, setRawTextOutput] = useState('');
  const [correctionResult, setCorrectionResult] = useState('');
  const [sourceTextForDisplay, setSourceTextForDisplay] = useState('');
  const [previousRawTextOutput, setPreviousRawTextOutput] = useState<string | null>(null);
  const [sessionSourceText, setSessionSourceText] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const [audioResult, setAudioResult] = useState('');
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioMode, setAudioMode] = useState<'standard' | 'native' | 'others'>('standard');
  const [audioError, setAudioError] = useState('');
  const [micVolume, setMicVolume] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  const rawTextOutputRef = useRef(rawTextOutput);
  const sessionSourceTextRef = useRef(sessionSourceText);
  const lastProcessedTextRef = useRef<string | null>(null);
  const lastProcessedTimeRef = useRef<number>(0);

  useEffect(() => { rawTextOutputRef.current = rawTextOutput; }, [rawTextOutput]);
  useEffect(() => { sessionSourceTextRef.current = sessionSourceText; }, [sessionSourceText]);

  // State for Pages
  const [currentApiKeyDisplay, setCurrentApiKeyDisplay] = useState('');
  const [currentGroqApiKeyDisplay, setCurrentGroqApiKeyDisplay] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedGroqModel, setSelectedGroqModel] = useState('');
  const [availableGroqModels, setAvailableGroqModels] = useState<string[]>([]);

  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [isTranslationVisible, setIsTranslationVisible] = useState(true);

  const [conjugationContent, setConjugationContent] = useState('');
  const [isConjugationLoading, setIsConjugationLoading] = useState(false);
  const [selectedVerb, setSelectedVerb] = useState('');
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isFollowMouse, setIsFollowMouse] = useState(false);

  // View Management
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [isFromHistory, setIsFromHistory] = useState(false);

  // Fast Translate State
  const [isFastTranslateVisible, setIsFastTranslateVisible] = useState(false);
  const [isAudioCorrectionVisible, setIsAudioCorrectionVisible] = useState(false);

  // Transcription Result State


  const normalizeSpaces = (text: string): string => text.replace(/\s+/g, ' ').trim();

  const applyDefaultSettings = async () => {
    const settings = webStore.get('default-settings');
    if (settings) {
      setIsTranslationVisible(settings.showTranslation);
    }
  };

  const visualizeMic = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedVolume = Math.min(average / 128, 1);
    setMicVolume(normalizedVolume);
    animationFrameRef.current = requestAnimationFrame(visualizeMic);
  };

  const recordingAudioModeRef = useRef<'standard' | 'native' | 'others'>('standard');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      handleResetToInput();
      setIsRecording(true);
      audioChunksRef.current = [];
      const options = MediaRecorder.isTypeSupported('audio/ogg; codecs=opus') ? { mimeType: 'audio/ogg; codecs=opus' } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceNodeRef.current.connect(analyserRef.current);
      visualizeMic();

      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setMicVolume(0);
        cancelAnimationFrame(animationFrameRef.current);
        setIsAudioLoading(true);
        const mimeType = mediaRecorder.mimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });



        // Check for 'Others' mode (Gemini Audio)
        if (recordingAudioModeRef.current === 'others') {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = (reader.result as string).split(',')[1];
            try {
              // Get Audio Prompt
              const customAudioPrompts = webStore.get('custom-audio-prompts') || [];
              const defaultAudioPrompt = `You are an expert German language teacher and analyst. The transcribed text you are about to process comes from a non-native German speaker with limited proficiency. The text may contain grammatical errors, spelling mistakes, and phrases in English or Turkish.

Your task is to provide a comprehensive, multi-part analysis.

*** CRITICAL: OUTPUT FORMAT ***
Your entire response MUST strictly follow this Markdown format. Do not add any introductory or concluding text.

**1. Verbatim Transcription:**
*   [The AI will place the raw, verbatim transcription of the audio here, as per system instructions.]

**2. Corrected and Meaningful German Text:**
*   [Provide the fully corrected, natural-sounding German version of the text here. Translate any English/Turkish phrases into appropriate German. If the topic is medical, use correct German medical terminology.]

**3. English and Turkish Translation:**
*   **En:** [Provide the English translation of the CORRECTED German text here.]
*   **Tr:** [Provide the Turkish translation of the CORRECTED German text here.]

**4. Hata Analizi ve Açıklamalar:**
*   [Analyze every significant error from the original transcription. For each error, provide the following structure on new lines:]

    *   **Hata:** "[The original incorrect phrase from the transcription]"
    *   **Düzeltme:** "[The corrected German phrase]"
    *   **Açıklama:** [Provide a clear, concise explanation **in TURKISH**. Yapılan dilbilgisi kuralı, kelime seçimi veya yapısal düzeltme hakkında **Türkçe**, net ve kısa bir açıklama yap.]`;

              const selectedAudioPromptId = webStore.get('selected-audio-prompt-id');

              let userPrompt = defaultAudioPrompt;

              if (selectedAudioPromptId && selectedAudioPromptId.startsWith('custom-')) {
                const index = parseInt(selectedAudioPromptId.split('-')[1], 10);
                if (index >= 0 && index < customAudioPrompts.length) {
                  userPrompt = customAudioPrompts[index];
                }
              }

              const systemInstruction = `You are an advanced audio processing AI. You will be given an audio file and a set of instructions called "User Prompt".
Your task is to follow these steps precisely:
1.  First, create a verbatim, raw transcription of the audio file. Include all filler words (like "eee", "uhm"), stutters, and pauses as best you can.
2.  Then, carefully analyze the User Prompt to understand the user's final goal.
3.  Apply the instructions from the User Prompt to the raw transcription you created in step 1.
4.  Produce a final response that STRICTLY adheres to the formatting and requirements of the User Prompt. Do not mention these steps in your final output.

Here is the User Prompt:
---
${userPrompt}
---
Now, process the provided audio file based on these instructions.`;

              const result = await geminiService.processAudio(base64data, mimeType, systemInstruction);

              if (result.status === 'success') {
                setAudioResult(result.message);
              } else {
                setAudioError(result.message);
              }
            } catch (err: any) {
              setAudioError(err.message || 'An unexpected error occurred during audio processing.');
              setAudioResult('');
            } finally {
              setIsAudioLoading(false);
            }
          };
          stream.getTracks().forEach(track => track.stop());
          sourceNodeRef.current?.disconnect();
          audioContextRef.current?.close();
          return;
        }

        // Standard Audio Processing (Placeholder for now in Web)
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          try {
            // Placeholder for web audio processing if not Whisper
            setAudioError('Standard audio processing not implemented in web version yet. Use Whisper for transcription.');
          } catch (err: any) {
            setAudioError(err.message || 'An unexpected error occurred during audio processing.');
            setAudioResult('');
          } finally {
            setIsAudioLoading(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
        sourceNodeRef.current?.disconnect();
        audioContextRef.current?.close();
      };
      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      Notification.error({ title: 'Microphone Error', content: 'Could not access the microphone. Please check permissions.' });
      setIsRecording(false);
    }
  };

  const handleResetToInput = () => {
    setRawTextOutput('');
    setCorrectionResult('');
    setLoading(false);
    setSourceTextForDisplay('');
    setPreviousRawTextOutput(null);
    setSessionSourceText('');
    setAudioResult('');
    setAudioError('');
    setIsAudioLoading(false);
    setCurrentView('home');
    setIsFromHistory(false);
    setIsFastTranslateVisible(false);
    setIsAudioCorrectionVisible(false);
  };

  const directTranslate = async (textToTranslate: string, isRefresh: boolean = false) => {
    if (textToTranslate.length > 0) {
      setLoading(true);
      if (!isRefresh) {
        setRawTextOutput('');
      }
      setCorrectionResult('');
      setSourceTextForDisplay('');
      setAudioResult('');
      setAudioError('');
      try {
        const settings = webStore.get('translation-settings');
        const targetLanguage = settings?.language || 'Turkish';
        const result = await geminiService.translate(textToTranslate, targetLanguage);
        if (result.status === 'success') {
          setRawTextOutput(result.message);
          addToHistory(textToTranslate, result.message);
          await applyDefaultSettings();
        } else {
          Notification.error({ id: 'translation-failed', title: t('notification.error') || 'Error', content: result.message });
          if (!isRefresh) setRawTextOutput('');
        }
      } catch (error: any) {
        Notification.error({ id: 'translation-error', title: 'Error', content: 'An error occurred during translation.' });
        if (!isRefresh) setRawTextOutput('');
      } finally {
        setLoading(false);
      }
    } else {
      setRawTextOutput('');
    }
  };

  const handleManualTranslate = async (text: string, isCorrection: boolean) => {
    console.log('handleManualTranslate started with text:', text);

    // Manually reset state to avoid race conditions with handleResetToInput
    setRawTextOutput('');
    setCorrectionResult('');
    setAudioResult('');
    setAudioError('');
    setIsAudioLoading(false);
    setPreviousRawTextOutput(null);
    setIsFromHistory(false);
    setIsFastTranslateVisible(false);
    setIsAudioCorrectionVisible(false);

    // Set new state
    setCurrentView('home');
    setSessionSourceText(text);
    setSourceTextForDisplay(text);
    setLoading(true);

    try {
      let result: { status: string; message: string };
      if (isCorrection) {
        // --- CORRECTION PROMPT LOGIC ---
        const defaultCorrectionPrompt = `
You are an expert German language teacher and proofreader. Your task is to analyze the user's German text, which may contain grammatical errors, spelling mistakes, and expressions from other languages (like English or Turkish). You must provide a response in a consistent, structured format without any extra conversation.

*** CRITICAL: OUTPUT FORMAT ***
Your entire response MUST strictly follow this Markdown format. Do not add any introductory or concluding text.

1.  **Corrected Version (✅):** Start with the emoji "✅" followed by "**Korrigierte Version:**". Then provide the fully corrected, natural-sounding German version of the text.
    - **Immediately after this line, you MUST provide the English and Turkish translations of the corrected sentence.** These translations must be on new, separate lines, prefixed with \`En:\` and \`Tr:\` respectively.
2.  **Error Analysis (🟨):** Start with the emoji "🟨" followed by "**Fehleranalyse und Erklärungen:**". Below this, for each significant error from the original text:
    *   Start a new line with the "❌" emoji, followed by the incorrect phrase in quotes.
    *   On the very next line, start with the "✅" emoji, followed by the correct phrase in quotes.
    *   Immediately following the corrected phrase, provide a brief explanation of the correction using Markdown bullet points. Each explanation point MUST be a separate line starting with a hyphen '-' and a space. Do not add any characters, letters, or empty lines between the corrected phrase line and the first bullet point explanation.

*** COMPLETE EXAMPLE OF EXPECTED BEHAVIOR ***

User's Text: "frühen morgen stehen der Schülerinnen und Schüler aus obwohl sie sich nur ungern aus des Betts erheben. Nach dem sie sich anziehen haben, machen sie sich aus dem Weg zum Schule. Viele nehmen ihre Tasschen, Jacken und Bücher , während einigen vergessen, ihr Hausaufgaben einzupacken. In die Schule bereiten die Lehrerin und Lehrers verschiedenen Übungen und Ausgaben , den Unterricht spannend zum gestalten. Während die Pausen unterhalten mich die Jugendliche miteinander beschweren sich manchmal auf die vielen Test und freuen uns über die Wochenende. Nachdem Unterrichts ruft vielen ihrem Eltern auf, damit sagen das Sie jetzzt nach zu Häuse gekommen. Einiges setzen dich an dem Bus, andere gesteigen aus ihrer Fahrräder an. Zu hause entspannen mich die Kindern, ziehen sich bequemem Kleidungen auf und fangtst an, zu das nächster Prüfungen zur lernen."

*Expected Output:*
✅ **Korrigierte Version:**
Am frühen Morgen stehen die Schülerinnen und Schüler auf, obwohl sie sich nur ungern aus dem Bett erheben. Nachdem sie sich angezogen haben, machen sie sich auf den Weg zur Schule. Viele nehmen ihre Taschen, Jacken und Bücher mit, während einige vergessen, ihre Hausaufgaben einzupacken. In der Schule bereiten die Lehrerinnen und Lehrer verschiedene Übungen und Aufgaben vor, um den Unterricht spannend zu gestalten. Während der Pausen unterhalten sich die Jugendlichen miteinander, beschweren sich manchmal über die vielen Tests und freuen sich auf das Wochenende. Nach dem Unterricht rufen viele ihre Eltern an, um zu sagen, dass sie jetzt nach Hause gekommen sind. Einige setzen sich in den Bus, andere steigen auf ihre Fahrräder. Zuhause entspannen sich die Kinder, ziehen sich bequeme Kleidung an und fangen an, für die nächsten Prüfungen zu lernen.
En: In the early morning, the male and female students get up, although they reluctantly get out of bed. After they have gotten dressed, they make their way to school. Many take their bags, jackets, and books with them, while some forget to pack their homework. At school, the male and female teachers prepare various exercises and tasks to make the lessons exciting. During the breaks, the young people talk to each other, sometimes complain about the many tests, and look forward to the weekend. After class, many call their parents to say that they have now come home. Some get on the bus, others get on their bikes. At home, the children relax, put on comfortable clothes, and start studying for the next exams.
Tr: Sabahın erken saatlerinde, kız ve erkek öğrenciler, yataktan isteksizce kalkmalarına rağmen ayağa kalkarlar. Giyindikten sonra okula doğru yola çıkarlar. Birçoğu çantalarını, ceketlerini ve kitaplarını yanlarına alırken, bazıları ödevlerini toplamayı unutur. Okulda, kadın ve erkek öğretmenler dersi heyecanlı hale getirmek için çeşitli alıştırmalar ve görevler hazırlarlar. Teneffüslerde gençler birbirleriyle sohbet eder, bazen birçok sınavdan şikayet eder ve hafta sonunu dört gözle beklerler. Dersten sonra birçoğu, şimdi eve geldiklerini söylemek için ebeveynlerini arar. Bazıları otobüse biner, diğerleri bisikletlerine biner. Evde çocuklar rahatlar, rahat kıyafetler giyer ve bir sonraki sınavlar için çalışmaya başlarlar.

🟨 **Fehleranalyse und Erklärungen:**
❌ "frühen morgen stehen ... aus obwohl"
✅ "Am frühen Morgen stehen ... auf, obwohl"
- Zaman belirten ifadelerde genellikle "am" (an + dem) kullanılır: "am Morgen".
- "aufstehen" ayrılabilir bir fiildir, bu nedenle "auf" cümlenin sonuna gelir.
- "obwohl" ile başlayan yan cümleden önce virgül konulmalıdır.

❌ "aus des Betts"
✅ "aus dem Bett"
- "das Bett" nötr bir isimdir. "aus" edatı Dativ gerektirdiği için "dem Bett" olmalıdır.

❌ "Nach dem sie sich anziehen haben"
✅ "Nachdem sie sich angezogen haben"
- Geçmişte tamamlanmış bir eylemi belirten yan cümlelerde "Nachdem" bağlacı kullanılır.
- Perfekt zamanda "anziehen" fiilinin Partizip II hali "angezogen" şeklindedir.

❌ "aus dem Weg zum Schule"
✅ "auf den Weg zur Schule"
- "yola çıkmak" anlamındaki kalıp ifade "sich auf den Weg machen" şeklindedir (Akkusativ).
- "die Schule" feminen bir isimdir. "zu" edatı Dativ gerektirdiği için "zu der Schule" -> "zur Schule" olur.

❌ "Tasschen, Jacken und Bücher ,"
✅ "Taschen, Jacken und Bücher mit,"
- "Tasschen" kelimesinin doğru yazılışı "Taschen" şeklindedir.
- "mitnehmen" (yanına almak) ayrılabilir bir fiildir, bu nedenle "mit" cümlenin sonuna (yan cümleden önceye) eklenmelidir.

❌ "während einigen vergessen, ihr Hausaufgaben"
✅ "während einige vergessen, ihre Hausaufgaben"
- "einige" belgisiz zamiri burada yalın halde (Nominativ) kullanılır.
- "Hausaufgaben" (çoğul) ile birlikte iyelik zamiri "ihre" şeklinde çekimlenir.

❌ "In die Schule bereiten die Lehrerin und Lehrers ... Ausgaben , den Unterricht ... zum gestalten"
✅ "In der Schule bereiten die Lehrerinnen und Lehrer ... Aufgaben vor, um den Unterricht ... zu gestalten"
- "Nerede?" sorusuna cevap verildiği için "in" edatı Dativ gerektirir: "in der Schule".
- Çoğul isimlerin doğru hali "Lehrerinnen" ve "Lehrer" şeklindedir.
- "ödev" anlamındaki kelime "Aufgaben"dır. "Ausgaben" harcamalar demektir.
- "vorbereiten" (hazırlamak) ayrılabilir bir fiildir, "vor" cümlenin sonuna gelir.
- Bir amacı belirtmek için "um ... zu + Infinitiv" yapısı kullanılır: "um ... zu gestalten".

❌ "Während die Pausen"
✅ "Während der Pausen"
- "während" edatı Genitiv (tamlayan hali) gerektirir.

❌ "unterhalten mich die Jugendliche"
✅ "unterhalten sich die Jugendlichen"
- Fiilin dönüşlü hali "sich unterhalten"dır. Özne "die Jugendlichen" olduğu için dönüşlülük zamiri "sich" olmalıdır.
- "Jugendliche" ismi burada çoğul olduğu için "die Jugendlichen" şeklinde çekimlenir.

❌ "beschweren sich manchmal auf die vielen Test"
✅ "beschweren sich manchmal über die vielen Tests"
- Bir şey "hakkında" şikayet etmek için "sich über etwas beschweren" (Akkusativ) kullanılır.
- "Test" isminin çoğul hali "Tests"dir.

❌ "freuen uns über die Wochenende"
✅ "freuen sich auf das Wochenende"
- Özne "die Jugendlichen" (onlar) olduğu için dönüşlülük zamiri "sich" olmalıdır ("wir" için "uns" kullanılır).
- Gelecekteki bir şey için sevinmek "sich auf etwas freuen" ile ifade edilir.

❌ "Nachdem Unterrichts ruft vielen ihrem Eltern auf"
✅ "Nach dem Unterricht rufen viele ihre Eltern an"
- Burada bağlaç olan "Nachdem" yerine, edat olan "Nach dem" (dersten sonra) kullanılmalıdır.
- Özne "viele" (çoğul) olduğu için fiil "rufen" şeklinde çekimlenir.
- "die Eltern" (çoğul) ile iyelik zamiri "ihre" olmalıdır.
- "anrufen" (telefonla aramak) ayrılabilir bir fiildir, "an" sona gelir.

❌ "damit sagen das Sie jetzzt nach zu Häuse gekommen"
✅ "um zu sagen, dass sie jetzt nach Hause gekommen sind"
- Amaç bildiren "um ... zu" yapısı daha doğrudur. Yan cümleden önce virgül gerekir.
- Bağlaç "dass" olmalıdır. "Sie" (resmi) yerine "sie" (onlar) kullanılır. "jetzt" doğru yazılıştır.
- "nach Hause" kalıp ifadedir. "gekommen sind" Perfekt zamanın doğru halidir (yardımcı fiil eksik).

❌ "Einiges setzen dich an dem Bus"
✅ "Einige setzen sich in den Bus"
- "Bazıları" anlamında insanlar için çoğul "Einige" kullanılır. "Einiges" (bazı şeyler) yanlıştır.
- Fiil dönüşlüdür: "sich setzen". Zamir "dich" yerine "sich" olmalıdır.
- Yönelme belirtilirken "in den Bus" (Akkusativ) kullanılır.

❌ "andere gesteigen aus ihrer Fahrräder an"
✅ "andere steigen auf ihre Fahrräder"
- "steigen" fiilinin kökünde "ge-" yoktur.
- Bisiklete "binmek" anlamında "auf etwas steigen" kullanılır.
- "ansteigen" (yükselmek, artmak) fiili burada anlamsızdır.

❌ "Zu hause entspannen mich die Kindern"
✅ "Zuhause entspannen sich die Kinder"
- "Zuhause" kelimesi bitişik yazılır.
- Fiil dönüşlüdür: "sich entspannen". "mich" yerine "sich" gelmelidir.
- "Kinder" zaten çoğuldur, Dativ eki "-n" almaz.

❌ "ziehen sich bequemem Kleidungen auf"
✅ "ziehen sich bequeme Kleidung an"
- "Kleidung" sayılamayan bir isimdir, genellikle tekil kullanılır.
- Sıfat çekimi Akkusativ için "bequeme" olmalıdır.
- "anziehen" fiilinin ayrılabilir parçası "an"dır, "auf" değil.

❌ "fangtst an, zu das nächster Prüfungen zur lernen"
✅ "fangen an, für die nächsten Prüfungen zu lernen"
- Özne "die Kinder" (onlar) olduğu için fiil "fangen" şeklinde çekimlenir.
- Bir amaç için öğrenmek "für etwas lernen" ile ifade edilir.
- "für" Akkusativ gerektirir: "für die nächsten Prüfungen".
- Mastar hali "zu lernen" doğrudur, "zur lernen" değil.
`;

        const customCorrectionPrompts = webStore.get('custom-correction-prompts') || [];
        const selectedCorrectionPromptId = webStore.get('selected-correction-prompt-id');

        let activePrompt = defaultCorrectionPrompt;

        if (selectedCorrectionPromptId && selectedCorrectionPromptId.startsWith('custom-')) {
          const index = parseInt(selectedCorrectionPromptId.split('-')[1], 10);
          if (index >= 0 && index < customCorrectionPrompts.length) {
            activePrompt = customCorrectionPrompts[index];
          }
        }

        const fullPrompt = `${activePrompt}\n\nUser's Text: "${text}"\n`;

        result = await geminiService.correctText(fullPrompt);
        if (result.status === 'success') setCorrectionResult(result.message);
      } else {
        const settings = webStore.get('translation-settings');
        const targetLanguage = settings?.language || 'Turkish';
        result = await geminiService.translate(text, targetLanguage);
        if (result.status === 'success') {
          setRawTextOutput(result.message);
          addToHistory(text, result.message);
          await applyDefaultSettings();
        }
      }
      if (result.status === 'error') Notification.error({ id: 'api-error', title: t('notification.error') || 'Error', content: result.message });
    } catch (error: any) {
      Notification.error({ id: 'request-error', title: 'Error', content: error.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  // Debug Log State
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const addDebugLog = (msg: string) => {
    console.log('[DEBUG]', msg);
    setDebugLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  // Immediate log to verify render
  useEffect(() => {
    addDebugLog('App Component Mounted');
  }, []);

  // Ref to hold the latest handleManualTranslate function to avoid stale closures
  const handleManualTranslateRef = useRef(handleManualTranslate);
  useEffect(() => {
    handleManualTranslateRef.current = handleManualTranslate;
  }, [handleManualTranslate]);

  useEffect(() => {
    const setupListeners = () => {
      addDebugLog('Setup listeners called');
      const searchParams = new URLSearchParams(window.location.search);
      const textParam = searchParams.get('text');
      if (textParam) {
        // Add a small delay to ensure app is fully ready (fixes first-run issue)
        setTimeout(() => {
          handleManualTranslateRef.current(textParam, false);
          window.history.replaceState({}, '', window.location.pathname);
        }, 100);
      }

      const isPopup = window.name === 'ai_learn_language_singleton' ||
        window.name === 'ai_translate_popup' ||
        !!textParam;

      if (isPopup) {
        // const channel = new BroadcastChannel('ai-learn-language-float-channel');
        // channel.postMessage({ type: 'POPUP_OPENED' });
        // channel.onmessage = (event) => {
        //   if (event.data && event.data.type === 'FLOAT_OPENED') {
        //     console.log('Closing Popup because Float was opened.');
        //     window.close();
        //   }
        // };
      }

      const settings = webStore.get('initial-settings');
      if (settings) { setIsAlwaysOnTop(settings.isAlwaysOnTop); setIsFollowMouse(settings.isFollowMouse); }

      const geminiKey = webStore.get('gemini-api-key');
      if (geminiKey) setCurrentApiKeyDisplay('Set');

      const groqKey = webStore.get('groq-api-key');
      if (groqKey) setCurrentGroqApiKeyDisplay('Set');

      const geminiModel = webStore.get('gemini-model');
      if (geminiModel) setSelectedModel(geminiModel);

      const availableModels = webStore.get('available-models');
      if (availableModels && availableModels.length > 0) {
        setAvailableModels(availableModels);
      } else {
        const defaultModels = ['gemini-flash-lite-latest', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
        setAvailableModels(defaultModels);
        webStore.set('available-models', defaultModels);
      }

      // Initialize Groq models - Enforce specific list as per user request
      // Initialize Groq models - Enforce specific list as per user request
      const targetGroqModels = ['meta-llama/llama-4-maverick-17b-128e-instruct'];
      setAvailableGroqModels(targetGroqModels);
      webStore.set('available-groq-models', targetGroqModels);

      // Exclusive Model Selection Logic
      const storedGeminiModel = webStore.get('gemini-model');
      const storedGroqModel = webStore.get('groq-model');

      if (storedGeminiModel) {
        // If Gemini was last used, select it and ensure Groq is cleared
        setSelectedModel(storedGeminiModel);
        setSelectedGroqModel('');
        webStore.set('groq-model', '');
      } else if (storedGroqModel && targetGroqModels.includes(storedGroqModel)) {
        // If Groq was last used (and is valid), select it and ensure Gemini is cleared
        setSelectedGroqModel(storedGroqModel);
        setSelectedModel('');
        webStore.set('gemini-model', '');
      } else {
        // Default fallback (Gemini)
        const defaultModel = 'gemini-2.0-flash';
        setSelectedModel(defaultModel);
        webStore.set('gemini-model', defaultModel);
        setSelectedGroqModel('');
        webStore.set('groq-model', '');
      }

      applyDefaultSettings();

      // Listen for SYNC_STATE from popup
      const channelSync = new BroadcastChannel('ai-learn-language-float-channel');
      channelSync.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_STATE') {
          const state = event.data.payload;
          if (state) {
            handleResetToInput();
            if (state.sessionSourceText) {
              setSessionSourceText(state.sessionSourceText);
              setSourceTextForDisplay(state.sessionSourceText);
              if (state.rawTextOutput) {
                setRawTextOutput(state.rawTextOutput);
                // Ensure we are in home view to see result
                setCurrentView('home');
              }
            }
            // Bring window to front if possible
            window.focus();
          }
        }
      };

      // Check for pending sync state in localStorage (fallback/init)
      const pendingState = localStorage.getItem('pending-sync-state');
      if (pendingState) {
        try {
          const state = JSON.parse(pendingState);
          // Only apply if recent (e.g. within last 10 seconds)
          if (Date.now() - state.timestamp < 10000) {
            handleResetToInput();
            if (state.sessionSourceText) {
              setSessionSourceText(state.sessionSourceText);
              setSourceTextForDisplay(state.sessionSourceText);
              if (state.rawTextOutput) {
                setRawTextOutput(state.rawTextOutput);
                setCurrentView('home');
              }
            }
            localStorage.removeItem('pending-sync-state');
          }
        } catch (e) {
          console.error('Failed to parse pending state', e);
        }
      }

      return () => {
        channelSync.close();
      };
    };
    const cleanupListeners = setupListeners();

    // Check for Share Intent (Android)
    let intentListenerPromise: Promise<any> | null = null;
    try {
      addDebugLog('Initializing SendIntent listener...');
      intentListenerPromise = SendIntent.addListener('appSendActionIntent', (data: any) => {
        console.log('Shared content received via Plugin Listener:', data);
        addDebugLog('Plugin Listener fired');
        if (data && data.extras) {
          const sharedText = data.extras['android.intent.extra.TEXT'] || data.extras['android.intent.extra.PROCESS_TEXT'] || data.extras['android.intent.extra.SUBJECT'];
          if (sharedText) {
            addDebugLog('Plugin: Text found');
            setTimeout(() => {
              handleManualTranslateRef.current(sharedText, false);
            }, 500);
          }
        }
      });
      addDebugLog('SendIntent listener initialized');
    } catch (e: any) {
      addDebugLog('Error init SendIntent: ' + e.message);
      console.error('Error init SendIntent', e);
    }

    // Fallback: Listen for window event directly (for MainActivity.java trigger)
    const handleWindowEvent = (event: any) => {
      console.log('Shared content received via Window Event:', event);
      addDebugLog('Window Event fired');

      // Try to get data from detail (CustomEvent) or use event itself
      let data = event.detail || event;

      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse window event data', e);
          addDebugLog('JSON Parse Error');
        }
      }

      if (data && data.extras) {
        const sharedText = data.extras['android.intent.extra.TEXT'] || data.extras['android.intent.extra.PROCESS_TEXT'];
        if (sharedText) {
          const now = Date.now();
          // Debounce: Check if same text processed recently (within 2 seconds)
          if (lastProcessedTextRef.current === sharedText && (now - lastProcessedTimeRef.current) < 2000) {
            addDebugLog('Window: Duplicate text ignored');
            return;
          }

          lastProcessedTextRef.current = sharedText;
          lastProcessedTimeRef.current = now;

          addDebugLog('Window: Text found');
          setTimeout(() => {
            handleManualTranslateRef.current(sharedText, false);
          }, 500);
        } else {
          addDebugLog('Window: No text in extras');
        }
      } else {
        addDebugLog('Window: No data/extras');
      }
    };
    // Listen for BOTH the plugin event AND our custom event
    try {
      window.addEventListener('appSendActionIntent', handleWindowEvent);
      window.addEventListener('customShareEvent', handleWindowEvent);
      addDebugLog('EventListeners added');
    } catch (e: any) {
      addDebugLog('Error adding event listeners: ' + e.message);
    }

    // Check for initial intent (Cold Start)
    try {
      // Using type assertion because checkSendIntentReceived exists on Android but not web
      (SendIntent as any).checkSendIntentReceived?.()?.then((data: any) => {
        console.log('Initial shared content checked:', data);
        if (data && data.extras) {
          const sharedText = data.extras['android.intent.extra.TEXT'] || data.extras['android.intent.extra.PROCESS_TEXT'] || data.extras['android.intent.extra.SUBJECT'];
          if (sharedText) {
            addDebugLog('Cold Start: Text found');
            setTimeout(() => {
              handleManualTranslateRef.current(sharedText, false);
            }, 500);
          }
        }
      }).catch((err: Error) => {
        console.log('Check intent failed or no intent', err);
        addDebugLog('Check intent error: ' + err.message);
      });
    } catch (e: any) {
      addDebugLog('Error checking intent: ' + e.message);
    }

    // Android Hardware Back Button Handler
    let backPressCount = 0;
    let backPressTimer: ReturnType<typeof setTimeout> | null = null;

    const backButtonListener = CapacitorApp.addListener('backButton', () => {
      // Priority 1: Close console if open
      if (isConsoleOpen) {
        setIsConsoleOpen(false);
        return;
      }

      // Priority 2: Close AudioCorrection if visible
      if (isAudioCorrectionVisible) {
        setIsAudioCorrectionVisible(false);
        return;
      }

      // Priority 3: Close FastTranslate if visible
      if (isFastTranslateVisible) {
        setIsFastTranslateVisible(false);
        return;
      }

      // Priority 4: Navigate back if not on home view
      if (currentView !== 'home') {
        setCurrentView('home');
        setIsFromHistory(false);
        return;
      }

      // Priority 5: If there's translation result, go back to input
      if (rawTextOutput || correctionResult || audioResult) {
        handleResetToInput();
        return;
      }

      // Priority 6: Double/Triple tap to exit
      backPressCount++;

      if (backPressCount === 1) {
        // First press - start timer
        backPressTimer = setTimeout(() => {
          backPressCount = 0;
        }, 2000);
      } else if (backPressCount === 2) {
        // Second press - show warning
        Notification.success({ content: 'Çıkmak için bir kez daha basın' });
      } else if (backPressCount >= 3) {
        // Third press - exit app
        if (backPressTimer) {
          clearTimeout(backPressTimer);
        }
        CapacitorApp.exitApp();
      }
    });

    return () => {
      if (cleanupListeners) cleanupListeners();
      window.removeEventListener('appSendActionIntent', handleWindowEvent);
      window.removeEventListener('customShareEvent', handleWindowEvent);
      if (intentListenerPromise) {
        intentListenerPromise.then(handle => handle.remove());
      }
      backButtonListener.then(handle => handle.remove());
    };
  }, [currentView, isConsoleOpen, isAudioCorrectionVisible, isFastTranslateVisible, rawTextOutput, correctionResult, audioResult]);

  const handleDonateClick = () => {
    const paypalUrl = "https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=kocogluhasan20@gmail.com&currency_code=EUR&amount=3.00";
    openExternal(paypalUrl);
  };
  const handleToggleAlwaysOnTop = () => { /* No-op in web */ };
  const handleToggleFollowMouse = () => { /* No-op in web */ };

  const handleShowAbout = () => {
    setIsAboutDialogOpen(true);
  };
  const handleShowSecurity = () => {
    setIsSecurityDialogOpen(true);
  };
  const handleExportToCSV = (source: string, combined: string) => {
    try {
      const defaultFileName = 'flashcards.csv';
      const fileList = webStore.get('flashcard-files') || [];
      let targetFile = fileList.find((f: any) => f.name === defaultFileName);

      if (!targetFile) {
        targetFile = { name: defaultFileName, path: defaultFileName, lastModified: Date.now() };
        webStore.set('flashcard-files', [...fileList, targetFile]);
      } else {
        const updatedFiles = fileList.map((f: any) => f.name === defaultFileName ? { ...f, lastModified: Date.now() } : f);
        webStore.set('flashcard-files', updatedFiles);
      }

      const cards = webStore.get(`flashcards-${defaultFileName}`) || [];
      const [top, bottom] = combined.split(' *** ');

      // Parse source for front side splitting (e.g. "Sentence **** Word")
      let frontTop = source;
      let frontBottom = '';
      if (source.includes('****')) {
        const parts = source.split('****');
        frontTop = parts[0].trim();
        frontBottom = parts[1].trim();
      }

      const newCard = {
        id: uuidv4(),
        front: { top: frontTop, bottom: frontBottom },
        back: { top: top || '', bottom: bottom || '' },
        imageUrl: '',
        imageIsLoading: false,
        imageFetchFailed: false
      };

      webStore.set(`flashcards-${defaultFileName}`, [...cards, newCard]);
      Notification.success({ content: 'Flashcard added successfully!' });
    } catch (error) {
      console.error('Failed to add flashcard:', error);
      Notification.error({ content: 'Failed to add flashcard.' });
    }
  };

  const handleWordClick = (source: string, word: string, fullTranslation: string) => {
    const cleanSource = source.replace(/[:.]\s*$/, '').replace(/\s+/g, ' ');
    const [eng, tur] = fullTranslation.split(/–|—|-/);
    const cleanEng = (eng || '').trim().replace(/\s+/g, ' ');
    const cleanTur = (tur || '').trim().replace(/\s+/g, ' ');
    const combined = `${cleanEng} *** ${cleanTur}`;
    handleExportToCSV(`"${cleanSource}". **** ${word}`, combined);
  };

  const handleVerbClick = async (infinitiveVerb: string) => {
    setSelectedVerb(infinitiveVerb);
    setCurrentView('verb-conjugation');
    setIsConjugationLoading(true);
    setConjugationContent('');
    try {
      const result = await geminiService.conjugateVerb(infinitiveVerb);
      if (result.status === 'success') {
        setConjugationContent(result.message);
      } else {
        setConjugationContent(`### Error\n\nCould not fetch conjugation table:\n\n\`\`\`\n${result.message}\n\`\`\``);
      }
    } catch (error: any) {
      setConjugationContent(`### Error\n\nAn unexpected error occurred:\n\n\`\`\`\n${error.message}\n\`\`\``);
    } finally {
      setIsConjugationLoading(false);
    }
  };

  const handleToggleRecording = (mode?: 'standard' | 'native' | 'fast-translate-2' | 'audio-correction' | 'others') => {
    if (mode === 'audio-correction') {
      setIsAudioCorrectionVisible(true);
      return;
    }

    if (mode === 'others') {
      const currentGroqModel = webStore.get('groq-model');
      // Block all Groq models for 'others' mode (only Gemini supported)
      if (currentGroqModel) {
        alert('Please select a Gemini model from the Gemini section to use this feature.');
        return;
      }
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      if (mode) {
        setAudioMode(mode as 'standard' | 'native' | 'others');
        recordingAudioModeRef.current = mode as 'standard' | 'native' | 'others';
      } else {
        recordingAudioModeRef.current = audioMode;
      }
      startRecording();
    }
  };



  const handleGoBack = () => {
    if (previousRawTextOutput) {
      setRawTextOutput(previousRawTextOutput);
      setPreviousRawTextOutput(null);
      setCorrectionResult('');
      setAudioResult('');
      setAudioError('');
    }
  };

  const handleLoadHistoryItem = (item: HistoryItem) => {
    handleResetToInput();
    setSessionSourceText(item.originalInput);
    setSourceTextForDisplay(item.originalInput);
    setRawTextOutput(item.rawResult);
    applyDefaultSettings();
    setCurrentView('home');
    setIsFromHistory(true);
  };

  const handleReturn = () => {
    if (isFromHistory) {
      setCurrentView('history');
      setIsFromHistory(false);
    } else {
      setCurrentView('home');
    }
  };

  const handleOpenFastTranslate = () => {
    setIsFastTranslateVisible(true);
  };

  const handleCloseFastTranslate = () => {
    setIsFastTranslateVisible(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'history':
        return <HistoryPage onLoadHistoryItem={handleLoadHistoryItem} />;
      case 'flashcards':
        return <FlashcardPage />;
      case 'api-key':
        return (
          <ApiKeyPage
            currentApiKeyDisplay={currentApiKeyDisplay}
            setCurrentApiKeyDisplay={setCurrentApiKeyDisplay}
            currentGroqApiKeyDisplay={currentGroqApiKeyDisplay}
            setCurrentGroqApiKeyDisplay={setCurrentGroqApiKeyDisplay}
          />
        );
      case 'models':
        return (
          <ModelsPage
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            availableModels={availableModels}
            setAvailableModels={setAvailableModels}
            setCurrentModelDisplay={setSelectedModel}
            selectedGroqModel={selectedGroqModel}
            setSelectedGroqModel={setSelectedGroqModel}
            availableGroqModels={availableGroqModels}
            setAvailableGroqModels={setAvailableGroqModels}
            setCurrentGroqModelDisplay={setSelectedGroqModel}
          />
        );
      case 'image-providers':
        return <ImageProvidersPage />;
      case 'default-settings':
        return <DefaultSettingsPage />;
      case 'language-selection':
        return <LanguageSelectionPage onLanguageSelected={() => setCurrentView('home')} />;
      case 'prompt':
        return <PromptPage />;
      case 'verb-conjugation':
        return <VerbConjugationPage content={conjugationContent} loading={isConjugationLoading} verb={selectedVerb} />;

      case 'home':
      default:
        if (loading || isAudioLoading) return <div className="loading-container-top"><Box display="flex" flexDirection="column" alignItems="center"><CircularProgress size={32} /><div style={{ marginTop: 10 }}>{isAudioLoading ? "Processing Audio..." : "Loading..."}</div></Box></div>;
        if (audioResult || audioError) {
          return (
            <AudioResultDisplay
              isLoading={isAudioLoading}
              resultText={audioResult}
              errorText={audioError}
              onCorrectText={(text) => handleManualTranslate(text, true)}
            />
          );
        }
        if (correctionResult) return <CorrectionResultDisplay correctionResult={correctionResult} sourceText={sourceTextForDisplay} onRefresh={() => handleManualTranslate(sourceTextForDisplay, true)} />;
        if (rawTextOutput) {
          return (
            <TranslationResultDisplay
              rawTextOutput={rawTextOutput}
              loading={loading}
              isTranslationVisible={isTranslationVisible}
              toggleTranslationVisibility={() => setIsTranslationVisible(!isTranslationVisible)}
              handleRefreshTranslation={() => sessionSourceText && directTranslate(sessionSourceText, true)}
              handleExportToCSV={handleExportToCSV}
              handleWordClick={handleWordClick}
              handleVerbClick={handleVerbClick}
            />
          );
        }
        return (
          <Box sx={{ pb: 10 }}>
            <ManualInput
              onTranslate={handleManualTranslate}
              onToggleRecording={handleToggleRecording}
              isRecording={isRecording}
              micVolume={micVolume}
              audioMode={audioMode}
              onAudioModeChange={setAudioMode}
            />
            <OptionsGrid
              onApiKeyClick={() => setCurrentView('api-key')}
              onOpenPromptSettings={() => setCurrentView('prompt')}
              onOpenImageProviders={() => setCurrentView('image-providers')}
              onOpenDefaultSettings={() => setCurrentView('default-settings')}
              onOpenFlashcards={() => setCurrentView('flashcards')}
              onOpenHistory={() => setCurrentView('history')}
              onShowAbout={handleShowAbout}
              onShowSecurity={handleShowSecurity}
            />
          </Box>
        );
    }
  };

  const isPopup = window.name === 'ai_learn_language_singleton' || window.name === 'ai_translate_popup' || (new URLSearchParams(window.location.search).get('text') !== null);

  if (isAudioCorrectionVisible) {
    return (
      <div className="main-container">
        <AboutDialog open={isAboutDialogOpen} onClose={() => setIsAboutDialogOpen(false)} />
        <Header
          onApiKeyClick={() => setCurrentView('api-key')}
          onModelsClick={() => setCurrentView('models')}
          onDonateClick={handleDonateClick}
          isAlwaysOnTop={isAlwaysOnTop}
          isFollowMouse={isFollowMouse}
          onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
          onToggleFollowMouse={handleToggleFollowMouse}
          onShowAbout={handleShowAbout}
          onOpenPromptSettings={() => setCurrentView('prompt')}
          onOpenDefaultSettings={() => setCurrentView('default-settings')}
          onOpenImageProviders={() => setCurrentView('image-providers')}
          onOpenLanguageSelection={() => setCurrentView('language-selection')}
          onHomeClick={handleResetToInput}
          onOpenHistory={() => setCurrentView('history')}
          onOpenFlashcards={() => setCurrentView('flashcards')}
          showReturnButton={true}
          onReturnClick={() => setIsAudioCorrectionVisible(false)}
          onOpenFastTranslate={handleOpenFastTranslate}
          onOpenConsole={handleOpenConsole}
        />
        <div className="content-area" style={{ height: 'calc(100dvh - 60px)', overflow: 'hidden' }}>
          <AudioCorrectionWrapper onClose={() => setIsAudioCorrectionVisible(false)} />
        </div>
      </div>
    );
  }

  if (isFastTranslateVisible) {
    return (
      <div className="main-container">
        <AboutDialog open={isAboutDialogOpen} onClose={() => setIsAboutDialogOpen(false)} />
        <Header
          onApiKeyClick={() => setCurrentView('api-key')}
          onModelsClick={() => setCurrentView('models')}
          onDonateClick={handleDonateClick}
          isAlwaysOnTop={isAlwaysOnTop}
          isFollowMouse={isFollowMouse}
          onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
          onToggleFollowMouse={handleToggleFollowMouse}
          onShowAbout={handleShowAbout}
          onOpenPromptSettings={() => setCurrentView('prompt')}
          onOpenDefaultSettings={() => setCurrentView('default-settings')}
          onOpenImageProviders={() => setCurrentView('image-providers')}
          onOpenLanguageSelection={() => setCurrentView('language-selection')}
          onHomeClick={handleResetToInput}
          onOpenHistory={() => setCurrentView('history')}
          onOpenFlashcards={() => setCurrentView('flashcards')}
          showReturnButton={true}
          onReturnClick={handleCloseFastTranslate}
          onOpenFastTranslate={handleOpenFastTranslate}
          onOpenConsole={handleOpenConsole}
        />
        <div className="content-area" style={{ height: 'calc(100dvh - 60px)', overflow: 'hidden' }}>
          <FastTranslateWrapper />
        </div>
      </div>
    );
  }

  const mainContent = (
    <div className="main-container">
      <AboutDialog open={isAboutDialogOpen} onClose={() => setIsAboutDialogOpen(false)} />
      <SecurityIssuesDialog open={isSecurityDialogOpen} onClose={() => setIsSecurityDialogOpen(false)} />
      <Header
        onApiKeyClick={() => setCurrentView('api-key')}
        onModelsClick={() => setCurrentView('models')}
        onDonateClick={handleDonateClick}
        isAlwaysOnTop={isAlwaysOnTop}
        isFollowMouse={isFollowMouse}
        onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
        onToggleFollowMouse={handleToggleFollowMouse}
        onShowAbout={handleShowAbout}
        onOpenPromptSettings={() => setCurrentView('prompt')}
        onOpenDefaultSettings={() => setCurrentView('default-settings')}
        onOpenImageProviders={() => setCurrentView('image-providers')}
        onOpenLanguageSelection={() => setCurrentView('language-selection')}
        onHomeClick={handleResetToInput}
        onOpenHistory={() => setCurrentView('history')}
        onOpenFlashcards={() => setCurrentView('flashcards')}
        showReturnButton={currentView !== 'home' || isFromHistory}
        onReturnClick={handleReturn}
        onOpenFastTranslate={handleOpenFastTranslate}
        onOpenConsole={handleOpenConsole}
      />
      {(rawTextOutput || correctionResult || audioResult || audioError) && !loading && !isAudioLoading && currentView === 'home' && (
        <div className="reset-button-container">
          {previousRawTextOutput && <IconButton onClick={handleGoBack}><IconArrowLeft /></IconButton>}
        </div>
      )}
      <div className="content-area">{renderContent()}</div>
      <ConsoleViewer
        isOpen={isConsoleOpen}
        onClose={handleCloseConsole}
        onClear={handleClearConsole}
        logs={consoleLogs}
      />
    </div>
  );

  return mainContent;
}

export default function RootApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
      </Routes>
    </Router>
  );
}
