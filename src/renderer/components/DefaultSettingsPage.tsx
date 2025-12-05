import React, { useState, useEffect } from 'react';
import { Button, Switch, FormControlLabel, Divider, Box, Typography, Radio, RadioGroup, FormControl, FormLabel, Paper } from '@mui/material';
import { useToast } from '../contexts/ToastContext';
import { webStore } from '../services/WebIntegration';

const DefaultSettingsPage: React.FC = () => {
    const { showToast } = useToast();

    const [showTranslation, setShowTranslation] = useState(false);
    const [showDieArticles, setShowDieArticles] = useState(false);
    const [translationMode, setTranslationMode] = useState('both');
    const [singleLanguageOutput, setSingleLanguageOutput] = useState('tr');

    useEffect(() => {
        const defaultSettings = webStore.get('default-settings');
        if (defaultSettings) {
            setShowTranslation(defaultSettings.showTranslation);
            setShowDieArticles(defaultSettings.showDieArticles);
        }

        const transSettings = webStore.get('translation-settings');
        if (transSettings) {
            setTranslationMode(transSettings.mode);
            if (transSettings.language) {
                setSingleLanguageOutput(transSettings.language);
            }
        }
    }, []);

    const handleSave = async () => {
        try {
            webStore.set('default-settings', {
                showTranslation,
                showDieArticles
            });

            const translationSettings: { mode: 'both' | 'single'; language?: string } = {
                mode: translationMode as 'both' | 'single',
                language: singleLanguageOutput // Ensure we save the current language too
            };
            webStore.set('translation-settings', translationSettings);

            showToast('Default settings saved.', 'success');
        } catch (error: any) {
            showToast(error.message || 'Could not save settings.', 'error');
        }
    };

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'transparent' }}>
                <Typography variant="h5" component="h2">
                    Default Settings
                </Typography>
            </Paper>

            <Paper elevation={1} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>Display Options</Typography>
                        <Divider sx={{ mb: 1 }} />
                        <FormControlLabel
                            control={<Switch checked={showTranslation} onChange={(e) => setShowTranslation(e.target.checked)} />}
                            label="Show Translations Section by Default"
                        />
                        <FormControlLabel
                            control={<Switch checked={showDieArticles} onChange={(e) => setShowDieArticles(e.target.checked)} />}
                            label="Show 'die' Articles by Default"
                        />
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>Translation Language Options</Typography>
                        <Divider sx={{ mb: 1 }} />

                        <FormControl component="fieldset">
                            <FormLabel component="legend">Translation Output</FormLabel>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                                Requesting fewer languages can speed up the response from the AI.
                            </Typography>
                            <RadioGroup value={translationMode} onChange={(e) => setTranslationMode(e.target.value)}>
                                <FormControlLabel value="both" control={<Radio />} label={`English and ${singleLanguageOutput} (Default)`} />
                                <FormControlLabel value="single" control={<Radio />} label={`Single Language (${singleLanguageOutput})`} />
                            </RadioGroup>
                        </FormControl>

                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                            To change the target language ({singleLanguageOutput}), use the "YL" button in the main header.
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleSave} variant="contained" size="large">Save</Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default DefaultSettingsPage;
