import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { openExternal } from '../services/WebIntegration';

const SecurityFooter: React.FC = () => {
    const handleLinkClick = (url: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        openExternal(url);
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                p: 1,
                pb: '2mm', // 2mm from bottom
                textAlign: 'center',
                bgcolor: 'background.default',
                borderTop: '1px solid',
                borderColor: 'divider',
                zIndex: 1000,
            }}
        >
            <Typography
                variant="caption"
                sx={{
                    fontStyle: 'italic',
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    display: 'block',
                    lineHeight: 1.2,
                }}
            >
                The developer of this software is not responsible for information security issues.
                Responsibility for information security lies with the API service providers (
                <Link
                    href="#"
                    onClick={handleLinkClick('https://ai.google.dev/gemini-api/terms')}
                    sx={{ cursor: 'pointer', color: 'inherit', textDecoration: 'underline' }}
                >
                    Gemini
                </Link>
                {' '}and{' '}
                <Link
                    href="#"
                    onClick={handleLinkClick('https://groq.com/privacy-policy/')}
                    sx={{ cursor: 'pointer', color: 'inherit', textDecoration: 'underline' }}
                >
                    Groq
                </Link>
                ).
            </Typography>
        </Box >
    );
};

export default SecurityFooter;
