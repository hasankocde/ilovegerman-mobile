import React, { useState, useEffect } from 'react';
import { useRealtimeTranslator } from '../../hooks/AudioCorrection/useRealtimeTranslator';
import { Header } from './Header';
import { ConversationArea } from './ConversationArea';
import { Controls } from './Controls';
import { PromptModal, Prompt } from './PromptModal';
import { SettingsModal, AiSettings } from './SettingsModal';
import { DEFAULT_PROMPT_TEMPLATE } from '../../config/AudioCorrection/prompts';
import { Box, Container } from '@mui/material';
import { AudioVisualizers } from './AudioVisualizers';

interface TranslatorUIProps {
    onKeySubmit: (key: string) => void;
    onClose?: () => void;
}

const DEFAULT_AI_SETTINGS: AiSettings = {
    temperature: 1.0,
    thinkingBudget: 0,
    longPauseDuration: 10000,
    shortPauseDuration: 0,
    maxResponseTokens: 4096,
};

export const TranslatorUI: React.FC<TranslatorUIProps> = ({ onKeySubmit, onClose }) => {
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const defaultPrompt: Prompt = { id: 'default', text: DEFAULT_PROMPT_TEMPLATE };
    const [savedPrompts, setSavedPrompts] = useState<Prompt[]>([]);
    const [activePromptId, setActivePromptId] = useState<string>('default');
    const [aiSettings, setAiSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);

    useEffect(() => {
        try {
            localStorage.removeItem('custom_prompts');
            localStorage.removeItem('active_prompt_id');
            setSavedPrompts([]);
            setActivePromptId('default');
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
    }, []);

    const activePromptTemplate =
        ([defaultPrompt, ...savedPrompts].find(p => p.id === activePromptId) || defaultPrompt).text;
    const finalInstructions = activePromptTemplate;

    const {
        conversationContentRef,
        items,
        isConnected,
        isModelResponding,
        startTranslation,
        stopTranslation,
        triggerTranslation,
        continueTranslation,
        isWaitingToContinue,
        liveAssistantText,
        deleteConversationItem,
        getAudioDevices,
        clientCanvasRef,
        isClientAudioActive,
    } = useRealtimeTranslator(finalInstructions, aiSettings);

    const handleSavePrompts = (prompts: Prompt[], activeId: string) => {
        setSavedPrompts(prompts);
        setActivePromptId(activeId);
        localStorage.setItem('custom_prompts', JSON.stringify(prompts));
        localStorage.setItem('active_prompt_id', activeId);
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
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

            <Container component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.5, px: '2px', overflow: 'hidden', maxWidth: 'xl' }}>
                <AudioVisualizers
                    isClientAudioActive={isClientAudioActive}
                    clientCanvasRef={clientCanvasRef}
                />
                <ConversationArea
                    items={items}
                    conversationContentRef={conversationContentRef}
                    deleteConversationItem={deleteConversationItem}
                    liveAssistantText={liveAssistantText}
                />
                <Controls
                    isConnected={isConnected}
                    isModelResponding={isModelResponding}
                    isWaitingToContinue={isWaitingToContinue}
                    startTranslation={startTranslation}
                    stopTranslation={stopTranslation}
                    triggerTranslation={triggerTranslation}
                    continueTranslation={continueTranslation}
                />
            </Container>
        </Box>
    );
};
