import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Tooltip,
} from '@mui/material';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface HeaderProps {
    onOpenPromptModal: () => void;
    onOpenSettingsModal: () => void;
    onClose?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    onOpenPromptModal,
    onOpenSettingsModal,
    onClose,
}) => {
    return (
        <AppBar
            position="static"
            color="default"
            sx={{ borderBottom: '1px solid #e0e0e0', backgroundColor: 'white' }}
        >
            <Toolbar sx={{ minHeight: '70px', px: { xs: 2, md: 3 } }}>
                {onClose && (
                    <IconButton onClick={onClose} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
                <Box sx={{ flexGrow: 1 }}>
                    <Typography
                        variant="subtitle1"
                        component="h1"
                        sx={{ fontWeight: 'bold', color: '#424242', letterSpacing: 'tight' }}
                    >
                        Audio-Correction
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#757575' }}>
                        Real-time Audio-Correction
                    </Typography>
                </Box>

                <Tooltip title="Manage Prompts">
                    <IconButton onClick={onOpenPromptModal} sx={{ mr: 1 }}>
                        <SettingsSuggestIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="AI Behavior Settings">
                    <IconButton onClick={onOpenSettingsModal} sx={{ mr: 1 }}>
                        <PsychologyIcon />
                    </IconButton>
                </Tooltip>
            </Toolbar>
        </AppBar>
    );
};
