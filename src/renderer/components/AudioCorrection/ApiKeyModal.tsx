// src/ui/components/ApiKeyModal.tsx
import React, { useState, useEffect } from 'react';
import {
    DialogContent,
    DialogTitle,
    DialogContentText,
    TextField,
    Button,
    Box,
    Avatar,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import FlashOnIcon from '@mui/icons-material/FlashOn';

interface ApiKeyModalProps {
    onKeySubmit: (key: string) => void;
    currentApiKey: string | null;
}

const maskApiKey = (key: string | null) => {
    if (!key) return '';
    const visibleChars = 6;
    if (key.length <= visibleChars) return key;
    const maskedLength = key.length - visibleChars;
    return key.substring(0, visibleChars) + '*'.repeat(maskedLength);
};

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onKeySubmit, currentApiKey }) => {
    const [inputKey, setInputKey] = useState('');
    const [displayKey, setDisplayKey] = useState('');

    useEffect(() => {
        setInputKey(currentApiKey || '');
        setDisplayKey(maskApiKey(currentApiKey));
    }, [currentApiKey]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputKey(newValue);
        setDisplayKey(newValue);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputKey.trim()) {
            onKeySubmit(inputKey.trim());
        }
    };

    return (
        <DialogContent sx={{ maxWidth: 400, textAlign: 'center', p: 4 }}>
            <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 2, bgcolor: 'primary.light' }}>
                <VpnKeyIcon sx={{ color: 'primary.main' }} />
            </Avatar>
            <DialogTitle sx={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                Update your Gemini API Key
            </DialogTitle>
            <DialogContentText sx={{ textAlign: 'center', mb: 3 }}>
                Your key is stored securely in your browser.
            </DialogContentText>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <TextField
                    type="text"
                    value={displayKey}
                    onChange={handleInputChange}
                    placeholder="Enter your Gemini API key"
                    variant="outlined"
                    fullWidth
                />
                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    endIcon={<FlashOnIcon />}
                    sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                    Save & Initialize
                </Button>
            </Box>
        </DialogContent>
    );
};
