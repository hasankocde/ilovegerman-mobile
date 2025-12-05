import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Link } from '@mui/material';
import { openExternal } from '../services/WebIntegration';

interface SecurityIssuesDialogProps {
    open: boolean;
    onClose: () => void;
}

const SecurityIssuesDialog: React.FC<SecurityIssuesDialogProps> = ({ open, onClose }) => {
    const handleLinkClick = (url: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        openExternal(url);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Security Issues</DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    The developer of this software is not responsible for information security issues.
                    Responsibility for information security lies with the API service providers (
                    <Link
                        href="#"
                        onClick={handleLinkClick('https://ai.google.dev/gemini-api/terms')}
                        sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
                    >
                        Gemini
                    </Link>
                    {' '}and{' '}
                    <Link
                        href="#"
                        onClick={handleLinkClick('https://groq.com/privacy-policy/')}
                        sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
                    >
                        Groq
                    </Link>
                    ).
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SecurityIssuesDialog;
