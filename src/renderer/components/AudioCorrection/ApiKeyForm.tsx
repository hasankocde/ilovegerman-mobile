// src/ui/components/ApiKeyForm.tsx
import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    InputAdornment,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import FlashOnIcon from '@mui/icons-material/FlashOn';

interface ApiKeyFormProps {
    onKeySubmit: (key: string) => void;
}

export const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onKeySubmit }) => {
    const [inputKey, setInputKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputKey.trim()) {
            onKeySubmit(inputKey.trim());
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '25%',
                        left: '25%',
                        width: 384,
                        height: 384,
                        bgcolor: 'rgba(79, 70, 229, 0.15)',
                        borderRadius: '50%',
                        filter: 'blur(72px)',
                        animation: 'pulse 4s infinite',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: '25%',
                        right: '25%',
                        width: 384,
                        height: 384,
                        bgcolor: 'rgba(139, 92, 246, 0.15)',
                        borderRadius: '50%',
                        filter: 'blur(72px)',
                        animation: 'pulse 4s infinite 1s',
                    }}
                />
            </Box>

            <Paper
                elevation={12}
                sx={{
                    p: { xs: 4, md: 6 },
                    borderRadius: 6,
                    textAlign: 'center',
                    maxWidth: 'lg',
                    width: '100%',
                    mx: 2,
                    position: 'relative',
                    zIndex: 1,
                    background: 'linear-gradient(135deg, rgba(22, 28, 49, 0.6), rgba(30, 30, 60, 0.6))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(128, 128, 255, 0.2)',
                    color: 'white',
                }}
            >
                <Box sx={{ mb: 4 }}>
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            mb: 3,
                            background: 'linear-gradient(to bottom right, #4f46e5, #8b5cf6)',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 3,
                        }}
                    >
                        <VpnKeyIcon sx={{ color: 'white', fontSize: 40 }} />
                    </Box>
                    <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                            fontWeight: 900,
                            mb: 2,
                            background: 'linear-gradient(to right, #a5b4fc, #c084fc, #f0abfc)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Gemini Translator
                    </Typography>
                    <Typography
                        sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '1.125rem',
                            lineHeight: 1.75,
                            maxWidth: 'md',
                            mx: 'auto',
                        }}
                    >
                        Unlock the power of real-time translation with your Gemini API key
                    </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        type="password"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="Enter your Gemini API key"
                        variant="outlined"
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <VpnKeyIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                </InputAdornment>
                            ),
                            sx: {
                                color: 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#a5b4fc',
                                },
                            },
                        }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        endIcon={<FlashOnIcon />}
                        sx={{
                            py: 1.5,
                            fontWeight: 'bold',
                            fontSize: '1.125rem',
                            textTransform: 'none',
                            background: 'linear-gradient(to right, #a5b4fc, #c084fc)',
                            color: 'black',
                        }}
                    >
                        Initialize Translation
                    </Button>
                </Box>

                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                        Your API key is stored locally and never transmitted
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};
