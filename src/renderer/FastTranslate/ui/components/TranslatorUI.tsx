import React, { useState, useEffect } from 'react';
import { useRealtimeTranslator } from '../hooks/useRealtimeTranslator';
import { Header } from './Header';
import { AudioVisualizers } from './AudioVisualizers';
import { ConversationArea } from './ConversationArea';
import { Controls } from './Controls';
import { PromptModal, Prompt } from './PromptModal';
import { SettingsModal, AiSettings } from './SettingsModal';
import { DEFAULT_PROMPT_TEMPLATE } from '../config/prompts';
import { Box, Container } from '@mui/material';

interface TranslatorUIProps {
  onKeySubmit: (key: string) => void;
}

const DEFAULT_AI_SETTINGS: AiSettings = {
  temperature: 1.1,
  thinkingBudget: 0,
  voiceName: 'Kore',
  enableAffectiveDialog: false,
  proactiveAudio: false,
  styleInstruction: '',
  longPauseDuration: 10000,
  shortPauseDuration: 0,
  maxResponseTokens: 4096,
};

export const TranslatorUI: React.FC<TranslatorUIProps> = ({ onKeySubmit }) => {
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('English');
  const defaultPrompt: Prompt = { id: 'default', text: DEFAULT_PROMPT_TEMPLATE };
  const [savedPrompts, setSavedPrompts] = useState<Prompt[]>([]);
  const [activePromptId, setActivePromptId] = useState<string>('default');
  const [aiSettings, setAiSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);

  useEffect(() => {
    try {
      const storedPrompts = localStorage.getItem('custom_prompts');
      const storedActiveId = localStorage.getItem('active_prompt_id');

      if (storedPrompts) {
        setSavedPrompts(JSON.parse(storedPrompts));
      }
      if (storedActiveId) {
        setActivePromptId(storedActiveId);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const activePromptTemplate =
    ([defaultPrompt, ...savedPrompts].find(p => p.id === activePromptId) || defaultPrompt).text;
  const finalInstructions = activePromptTemplate.replace(/\${targetLanguage}/g, targetLanguage);

  const {
    clientCanvasRef,
    serverCanvasRef,
    conversationContentRef,
    items,
    isConnected,
    isClientAudioActive,
    isServerAudioActive,
    startTranslation,
    stopTranslation,
    triggerTranslation,
    continueTranslation,
    isWaitingToContinue,
    liveAssistantText,
    deleteConversationItem,
    isMuted,
    toggleMute,
    sendText,
  } = useRealtimeTranslator(finalInstructions, aiSettings);

  const handleSavePrompts = (prompts: Prompt[], activeId: string) => {
    setSavedPrompts(prompts);
    setActivePromptId(activeId);
    localStorage.setItem('custom_prompts', JSON.stringify(prompts));
    localStorage.setItem('active_prompt_id', activeId);
  };

  return (
    <Box sx={{ height: '93dvh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        defaultPrompt={defaultPrompt}
        savedPrompts={savedPrompts}
        activePromptId={activePromptId}
        onSavePrompts={handleSavePrompts}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={aiSettings}
        onSettingsChange={setAiSettings}
        onResetToDefaults={() => setAiSettings(DEFAULT_AI_SETTINGS)}
      />

      <Header
        onOpenPromptModal={() => setIsPromptModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      <Container component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1, px: '1px', overflow: 'hidden', maxWidth: 'xl' }}>
        <AudioVisualizers
          isClientAudioActive={isClientAudioActive}
          isServerAudioActive={isServerAudioActive}
          clientCanvasRef={clientCanvasRef}
          serverCanvasRef={serverCanvasRef}
        />
        <ConversationArea
          items={items}
          conversationContentRef={conversationContentRef}
          liveAssistantText={liveAssistantText}
        />
        <Controls
          isConnected={isConnected}
          isServerAudioActive={isServerAudioActive}
          isWaitingToContinue={isWaitingToContinue}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          startTranslation={startTranslation}
          stopTranslation={stopTranslation}
          triggerTranslation={triggerTranslation}
          continueTranslation={continueTranslation}
          isMuted={isMuted}
          toggleMute={toggleMute}
          sendText={sendText}
        />
      </Container>
    </Box>
  );
};
