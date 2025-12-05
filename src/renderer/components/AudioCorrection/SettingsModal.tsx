import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Slider,
    IconButton,
    Tooltip,
    Button,
    TextField,
    Divider,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import RestoreIcon from '@mui/icons-material/Restore';

export interface AiSettings {
    temperature: number;
    thinkingBudget: number;
    longPauseDuration: number;
    shortPauseDuration: number;
    maxResponseTokens: number;
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AiSettings;
    onSettingsChange: (newSettings: AiSettings) => void;
    onResetToDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onSettingsChange,
    onResetToDefaults,
}) => {
    const handleSliderChange = (name: keyof AiSettings, value: number) => {
        onSettingsChange({ ...settings, [name]: value });
    };

    const handleFieldChange = <K extends keyof AiSettings>(name: K, value: AiSettings[K]) => {
        onSettingsChange({ ...settings, [name]: value });
    };

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                🧠 AI Behavior Settings
                <Box>
                    <Tooltip title="Reset to Defaults">
                        <IconButton aria-label="reset" onClick={onResetToDefaults}>
                            <RestoreIcon />
                        </IconButton>
                    </Tooltip>
                    <IconButton aria-label="close" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
                <Typography gutterBottom variant="body2" color="text.secondary">
                    Adjust these parameters to fine-tune the AI's translation behavior and response timing. Changes are applied live.
                </Typography>

                <Box sx={{ mt: 3 }}>
                    <Tooltip title="Controls randomness: Lower values make the AI more deterministic, higher values make it more creative. (Default: 1.0)">
                        <Typography gutterBottom>Temperature: {settings.temperature.toFixed(1)}</Typography>
                    </Tooltip>
                    <Slider
                        value={settings.temperature}
                        onChange={(_, value) => handleSliderChange('temperature', value as number)}
                        aria-labelledby="temperature-slider"
                        valueLabelDisplay="auto"
                        step={0.1}
                        marks
                        min={0.0}
                        max={2.0}
                    />
                </Box>

                <Box sx={{ mt: 3 }}>
                    <Typography gutterBottom>Thinking Budget (token)</Typography>
                    <TextField
                        type="number"
                        size="small"
                        fullWidth
                        inputProps={{ min: 0, step: 64 }}
                        value={settings.thinkingBudget}
                        onChange={(event) => handleFieldChange('thinkingBudget', Math.max(0, Number(event.target.value) || 0))}
                        helperText="0 = Gemini'nin varsayılan dynamic thinking davranışı. Daha yüksek değerler düşünme süresini uzatır."
                    />
                </Box>

                <Divider sx={{ my: 4 }} />

                <Box sx={{ mt: 3 }}>
                    <Tooltip title="The duration of silence (in seconds) the AI waits for before considering a long pause. (Default: 10s)">
                        <Typography gutterBottom>Long Pause Duration: {(settings.longPauseDuration / 1000).toFixed(1)}s</Typography>
                    </Tooltip>
                    <Slider
                        value={settings.longPauseDuration}
                        onChange={(_, value) => handleSliderChange('longPauseDuration', value as number)}
                        aria-labelledby="long-pause-slider"
                        valueLabelDisplay="auto"
                        step={500}
                        min={1000}
                        max={30000}
                    />
                </Box>

                <Box sx={{ mt: 3 }}>
                    <Tooltip title="The shorter silence duration used when 'Translate Now' is clicked. (Default: 0.5s)">
                        <Typography gutterBottom>Short Pause Duration: {(settings.shortPauseDuration / 1000).toFixed(1)}s</Typography>
                    </Tooltip>
                    <Slider
                        value={settings.shortPauseDuration}
                        onChange={(_, value) => handleSliderChange('shortPauseDuration', value as number)}
                        aria-labelledby="short-pause-slider"
                        valueLabelDisplay="auto"
                        step={100}
                        min={200}
                        max={5000}
                    />
                </Box>

                <Box sx={{ mt: 3 }}>
                    <Tooltip title="The maximum number of tokens (words/characters) the AI can generate in a single response. (Default: 4096)">
                        <Typography gutterBottom>Max Response Tokens: {settings.maxResponseTokens}</Typography>
                    </Tooltip>
                    <Slider
                        value={settings.maxResponseTokens}
                        onChange={(_, value) => handleSliderChange('maxResponseTokens', value as number)}
                        aria-labelledby="max-tokens-slider"
                        valueLabelDisplay="auto"
                        step={128}
                        min={256}
                        max={8192}
                    />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Button variant="contained" onClick={onClose} sx={{ textTransform: 'none', fontWeight: 'bold' }}>
                        Confirm Settings
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};
