// src/ui/components/Controls.tsx
import React from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Typography,
    CircularProgress,
    IconButton,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import CloseIcon from '@mui/icons-material/Close';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { languages } from '../config/languages';

interface ControlsProps {
    isConnected: boolean;
    isServerAudioActive: boolean;
    isWaitingToContinue: boolean;
    targetLanguage: string;
    setTargetLanguage: (language: string) => void;
    startTranslation: () => void;
    stopTranslation: () => void;
    triggerTranslation: () => void;
    continueTranslation: () => void;
    isMuted: boolean;
    toggleMute: () => void;
    sendText: (text: string) => void;
}

export const Controls: React.FC<ControlsProps> = ({
    isConnected,
    isServerAudioActive,
    isWaitingToContinue,
    targetLanguage,
    setTargetLanguage,
    startTranslation,
    stopTranslation,
    triggerTranslation,
    continueTranslation,
    isMuted,
    toggleMute,
}) => {

    const handleLanguageChange = (event: SelectChangeEvent<string>) => {
        setTargetLanguage(event.target.value);
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
                    Continue
                </Button>
            );
        }

        if (isServerAudioActive) {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: 48 }}>
                    <CircularProgress size={20} />
                    <Typography sx={{ ml: 1, color: 'text.secondary', fontSize: '0.9rem' }}>Speaking...</Typography>
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
                Translate
            </Button>
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 'auto', width: '100%', pb: '2px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0, width: '100%', justifyContent: 'center' }}>
                {!isConnected ? (
                    <>
                        <FormControl variant="outlined" sx={{ width: 140 }} disabled={isConnected} size="small">
                            <InputLabel id="language-select-label">Target</InputLabel>
                            <Select
                                labelId="language-select-label"
                                id="language-select"
                                value={targetLanguage}
                                onChange={handleLanguageChange}
                                label="Target"
                            >
                                {languages.map((lang) => (
                                    <MenuItem key={lang.name} value={lang.name}>
                                        {lang.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            size="small"
                            sx={{ width: { xs: '100%', sm: 220 }, height: 48, fontWeight: 'bold', textTransform: 'none', fontSize: '0.9rem', borderRadius: 2 }}
                            onClick={startTranslation}
                            startIcon={<FlashOnIcon />}
                        >
                            Start
                        </Button>
                        <IconButton onClick={toggleMute} color={isMuted ? 'error' : 'primary'} title={isMuted ? "Unmute Audio" : "Mute Audio"}>
                            {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                        </IconButton>
                    </>
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
                            Cancel
                        </Button>
                        <IconButton onClick={toggleMute} color={isMuted ? 'error' : 'primary'} title={isMuted ? "Unmute Audio" : "Mute Audio"}>
                            {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                        </IconButton>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
