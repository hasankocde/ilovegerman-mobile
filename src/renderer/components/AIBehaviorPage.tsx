import React, { useState, useEffect } from 'react';
import { Box, Typography, Slider, TextField, Paper, Divider, Alert, Button, CircularProgress } from '@mui/material';
import { useToast } from '../contexts/ToastContext';
import { webStore } from '../services/WebIntegration';

interface AiBehaviorSettings {
    temperature: number;
    thinkingBudget: number;
}

const AIBehaviorPage: React.FC = () => {
    const [settings, setSettings] = useState<AiBehaviorSettings>({ temperature: 1.0, thinkingBudget: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const storedSettings = webStore.get('ai-behavior');
                if (storedSettings) {
                    setSettings(storedSettings);
                }
            } catch (error) {
                console.error('Failed to load AI behavior settings:', error);
                showToast('Failed to load settings', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [showToast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            webStore.set('ai-behavior', settings);
            showToast('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Failed to save AI behavior settings:', error);
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
                AI Behavior Settings
            </Typography>

            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Alert severity="info" sx={{ mb: 4 }}>
                    These settings affect how the Gemini AI models generate responses.
                    Adjusting them can change the creativity and reasoning depth of the AI.
                </Alert>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Temperature ({settings.temperature})
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Controls the randomness of the output. Lower values mean less random completions (more deterministic).
                        Higher values mean more random and creative completions.
                    </Typography>
                    <Slider
                        value={settings.temperature}
                        min={0.0}
                        max={2.0}
                        step={0.1}
                        onChange={(_, value) => setSettings({ ...settings, temperature: value as number })}
                        valueLabelDisplay="auto"
                        marks={[
                            { value: 0.0, label: 'Precise' },
                            { value: 1.0, label: 'Balanced' },
                            { value: 2.0, label: 'Creative' },
                        ]}
                    />
                </Box>

                <Divider sx={{ my: 4 }} />

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Thinking Budget (Tokens)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Allocates a token budget for the model's internal reasoning process (Thinking).
                        <strong> Note:</strong> This feature is primarily supported by Gemini 2.5 and newer models.
                        Set to <strong>0</strong> to disable thinking (or use default behavior).
                    </Typography>
                    <TextField
                        type="number"
                        label="Token Budget"
                        value={settings.thinkingBudget}
                        onChange={(e) => setSettings({ ...settings, thinkingBudget: Math.max(0, parseInt(e.target.value) || 0) })}
                        fullWidth
                        helperText="Recommended values: 0 (Disabled), 1024 (Low), 4096 (High)"
                        InputProps={{ inputProps: { min: 0 } }}
                    />
                </Box>

                <Box display="flex" justifyContent="flex-end" mt={4}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleSave}
                        disabled={saving}
                        sx={{ minWidth: 120 }}
                    >
                        {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Settings'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default AIBehaviorPage;
