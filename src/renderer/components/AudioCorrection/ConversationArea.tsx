import React from 'react';
import { Box, Typography } from '@mui/material';
import AudioResultDisplay from '../AudioResultDisplay';

interface ConversationItem {
    id: string;
    role: 'user' | 'assistant';
    transcript: string;
}

interface ConversationAreaProps {
    items: ConversationItem[];
    conversationContentRef: React.RefObject<HTMLDivElement | null>;
    deleteConversationItem: (id: string) => void;
    liveAssistantText?: string;
}

export const ConversationArea: React.FC<ConversationAreaProps> = ({
    items,
    conversationContentRef,
    deleteConversationItem,
    liveAssistantText,
}) => {
    const filteredItems = items.filter(item => item.role !== 'user');
    const liveText = liveAssistantText?.trim();

    const shouldRenderPanel = filteredItems.length > 0 || !!liveText;

    if (!shouldRenderPanel) {
        return <Box sx={{ flexGrow: 1 }} />;
    }

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '4xl',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0,
                px: '2px',  // 2mm left-right margin
                mt: '2px',  // 2mm top margin (from audio bars)
                mb: '2px',  // 2mm bottom margin (from buttons)
            }}
        >
            <Box ref={conversationContentRef} sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {/* Live Text - Using AudioResultDisplay for consistent formatting */}
                {liveText && (
                    <Box sx={{ mb: 0.5 }}>
                        <AudioResultDisplay
                            resultText={liveText}
                            isLoading={true}
                            errorText=""
                            onCorrectText={() => { }}
                            compact={true}
                        />
                    </Box>
                )}

                {/* Completed Messages */}
                {filteredItems.map((item) => (
                    <Box
                        key={item.id}
                        sx={{
                            mb: 0.5,
                        }}
                    >
                        {item.role === 'assistant' ? (
                            <AudioResultDisplay
                                resultText={item.transcript}
                                isLoading={false}
                                errorText=""
                                onCorrectText={() => { }}
                                compact={true}
                            />
                        ) : (
                            <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                                <strong>You:</strong> {item.transcript}
                            </Typography>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
