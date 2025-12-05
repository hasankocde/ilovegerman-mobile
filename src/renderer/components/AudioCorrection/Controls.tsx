import React from 'react';
import {
    Box,
    Button,
    Typography,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface ControlsProps {
    isConnected: boolean;
    isModelResponding: boolean;
    isWaitingToContinue: boolean;
    startTranslation: () => void;
    stopTranslation: () => void;
    triggerTranslation: () => void;
    continueTranslation: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
    isConnected,
    isModelResponding,
    isWaitingToContinue,
    startTranslation,
    stopTranslation,
    triggerTranslation,
    continueTranslation,
}) => {
    const handleStartClick = () => {
        startTranslation();
    };

    const renderActiveButtons = () => {
        if (isWaitingToContinue) {
            return (
                <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    sx={{ flex: 1, height: 48, fontWeight: 'bold', textTransform: 'none', fontSize: '0.9rem', borderRadius: 2 }}
                    onClick={continueTranslation}
                    startIcon={<PlayArrowIcon />}
                >
                    Devam Et
                </Button>
            );
        }

        if (isModelResponding) {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: 48 }}>
                    <CircularProgress size={20} />
                    <Typography sx={{ ml: 1, color: 'text.secondary', fontSize: '0.9rem' }}>AI Yanıt Veriyor...</Typography>
                </Box>
            );
        }

        return (
            <Button
                variant="contained"
                size="small"
                color="primary"
                sx={{ flex: 1, height: 48, fontWeight: 'bold', textTransform: 'none', fontSize: '0.9rem', borderRadius: 2 }}
                onClick={triggerTranslation}
            >
                Konuşmayı Sonlandır
            </Button>
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 'auto', width: '100%', pb: '2px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0, width: '100%', justifyContent: 'center' }}>
                {!isConnected ? (
                    <Button
                        variant="contained"
                        size="small"
                        sx={{ width: { xs: '100%', sm: 220 }, height: 48, fontWeight: 'bold', textTransform: 'none', fontSize: '0.9rem', borderRadius: 2 }}
                        onClick={handleStartClick}
                        startIcon={<FlashOnIcon />}
                    >
                        Konuşmaya Başla
                    </Button>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1, width: '100%', maxWidth: 400 }}>
                        {renderActiveButtons()}
                        <Button
                            variant="contained"
                            size="small"
                            color="error"
                            sx={{ flex: 1, height: 48, fontWeight: 'bold', textTransform: 'none', fontSize: '0.9rem', borderRadius: 2 }}
                            onClick={stopTranslation}
                            startIcon={<CloseIcon />}
                        >
                            İptal Et
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
