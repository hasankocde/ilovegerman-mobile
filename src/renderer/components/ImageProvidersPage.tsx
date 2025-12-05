import React, { useState, useEffect } from 'react';
import { Button, TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Box, Typography, Paper } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';
import { webStore, openExternal } from '../services/WebIntegration';

const ImageProvidersPage: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();

    const [activeProvider, setActiveProvider] = useState<'auto' | 'pexels' | 'unsplash'>('auto');
    const [unsplashKey, setUnsplashKey] = useState('');
    const [pexelsKey, setPexelsKey] = useState('');

    useEffect(() => {
        const provider = webStore.get('image-provider') || 'auto';
        if (provider === 'pexels' || provider === 'unsplash') {
            setActiveProvider(provider);
        } else {
            setActiveProvider('auto');
        }
        setUnsplashKey(webStore.get('unsplash-api-key') || '');
        setPexelsKey(webStore.get('pexels-api-key') || '');
    }, []);

    const handleSave = async () => {
        try {
            if (activeProvider === 'unsplash' && !unsplashKey.trim()) {
                showToast(t('imageProvider.missingKey'), 'warning');
            } else if (activeProvider === 'pexels' && !pexelsKey.trim()) {
                showToast(t('imageProvider.missingKey'), 'warning');
            }

            // Using the exposed methods from preload
            // Using the exposed methods from preload
            webStore.set('unsplash-api-key', unsplashKey);
            webStore.set('pexels-api-key', pexelsKey);
            webStore.set('image-provider', activeProvider);

            showToast(t('imageProvider.saveSuccess'), 'success');
        } catch (error: any) {
            showToast(`Error saving settings: ${error.message}`, 'error');
        }
    };

    const openUrl = (url: string) => {
        openExternal(url);
    };

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'transparent' }}>
                <Typography variant="h5" component="h2">
                    {t('imageProvider.title')}
                </Typography>
            </Paper>

            <Paper elevation={1} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">{t('imageProvider.activeProvider')}</FormLabel>
                        <RadioGroup
                            value={activeProvider}
                            onChange={(e) => setActiveProvider(e.target.value as any)}
                        >
                            <FormControlLabel value="auto" control={<Radio />} label={t('imageProvider.automatic')} />
                            <FormControlLabel value="unsplash" control={<Radio />} label={t('imageProvider.unsplash')} />
                            <FormControlLabel value="pexels" control={<Radio />} label={t('imageProvider.pexels')} />
                        </RadioGroup>
                    </FormControl>

                    <Box>
                        <TextField
                            label={t('imageProvider.unsplashKey')}
                            type="password"
                            fullWidth
                            variant="outlined"
                            value={unsplashKey}
                            onChange={(e) => setUnsplashKey(e.target.value)}
                            size="small"
                        />
                        <Button
                            size="small"
                            startIcon={<LinkIcon />}
                            onClick={() => openUrl('https://unsplash.com/developers')}
                            sx={{ mt: 0.5, textTransform: 'none' }}
                        >
                            {t('imageProvider.getUnsplashKey')}
                        </Button>
                    </Box>

                    <Box>
                        <TextField
                            label={t('imageProvider.pexelsKey')}
                            type="password"
                            fullWidth
                            variant="outlined"
                            value={pexelsKey}
                            onChange={(e) => setPexelsKey(e.target.value)}
                            size="small"
                        />
                        <Button
                            size="small"
                            startIcon={<LinkIcon />}
                            onClick={() => openUrl('https://www.pexels.com/api/')}
                            sx={{ mt: 0.5, textTransform: 'none' }}
                        >
                            {t('imageProvider.getPexelsKey')}
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button onClick={handleSave} variant="contained" size="large">
                            {t('button.save')}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default ImageProvidersPage;
