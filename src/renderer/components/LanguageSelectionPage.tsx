import React, { useState, useEffect } from 'react';
import { List, ListItem, ListItemButton, ListItemText, TextField, Box, InputAdornment, Paper, Typography } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { LANGUAGES } from '../constants/languages';
import { useToast } from '../contexts/ToastContext';
import { webStore } from '../services/WebIntegration';

interface LanguageSelectionPageProps {
    onLanguageSelected?: (language: string) => void;
}

const LanguageSelectionPage: React.FC<LanguageSelectionPageProps> = ({ onLanguageSelected }) => {
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
    const [currentMode, setCurrentMode] = useState<'both' | 'single'>('both');

    // Reset state when page loads
    useEffect(() => {
        setSearchQuery('');
        // Fetch current language to highlight it
        // Fetch current language to highlight it
        const settings = webStore.get('translation-settings');
        if (settings) {
            if (settings.language) {
                setSelectedLanguage(settings.language);
            }
            if (settings.mode) {
                setCurrentMode(settings.mode);
            }
        }
    }, []);

    const filteredLanguages = LANGUAGES.filter(lang =>
        lang.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleLanguageSelect = async (language: string) => {
        try {
            setSelectedLanguage(language);

            // Save immediately
            // Save immediately
            // Preserve the current mode, only update the language
            webStore.set('translation-settings', {
                mode: currentMode,
                language: language
            });

            showToast(`Language set to ${language}`, 'success');
            if (onLanguageSelected) {
                onLanguageSelected(language);
            }
        } catch (error: any) {
            showToast('Failed to save language selection.', 'error');
            console.error(error);
        }
    };

    return (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'transparent' }}>
                <Typography variant="h5" component="h2">
                    Select Your Language
                </Typography>
            </Paper>

            <Paper elevation={1} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ p: 2, pb: 1 }}>
                    <TextField
                        fullWidth
                        placeholder="Search language..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                        variant="outlined"
                        size="small"
                    />
                </Box>
                <List sx={{ flex: 1, overflow: 'auto' }}>
                    {filteredLanguages.map((lang) => (
                        <ListItem key={lang} disablePadding>
                            <ListItemButton
                                onClick={() => handleLanguageSelect(lang)}
                                selected={selectedLanguage === lang}
                                sx={{
                                    '&.Mui-selected': {
                                        backgroundColor: 'primary.light',
                                        '&:hover': {
                                            backgroundColor: 'primary.light',
                                        }
                                    }
                                }}
                            >
                                <ListItemText primary={lang} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                    {filteredLanguages.length === 0 && (
                        <ListItem>
                            <ListItemText primary="No languages found" sx={{ color: 'text.secondary', textAlign: 'center' }} />
                        </ListItem>
                    )}
                </List>
            </Paper>
        </Box>
    );
};

export default LanguageSelectionPage;
