import React, { useState } from 'react';
import { IconButton, Button, Menu, MenuItem, ListItemText, Box, Tooltip } from '@mui/material';
import { Settings as SettingsIcon, Check as CheckIcon, Home as HomeIcon, Reply as ReplyIcon, Style as StyleIcon, PushPin as PushPinIcon, Translate as TranslateIcon, AutoAwesome as AutoAwesomeIcon, PictureInPictureAlt as IconFloat, ExitToApp as ExitToAppIcon, Terminal as TerminalIcon } from '@mui/icons-material';

interface HeaderProps {
    onApiKeyClick: () => void;
    onModelsClick: () => void;
    onDonateClick: () => void;
    isAlwaysOnTop: boolean;
    isFollowMouse: boolean;
    onToggleAlwaysOnTop: () => void;
    onToggleFollowMouse: () => void;
    onShowAbout: () => void;
    onOpenPromptSettings: () => void;
    onOpenDefaultSettings: () => void;
    onOpenImageProviders: () => void;
    onOpenLanguageSelection: () => void;
    onHomeClick: () => void;
    onOpenHistory: () => void;
    onOpenFlashcards: () => void;
    showReturnButton?: boolean;
    onReturnClick?: () => void;
    onOpenFastTranslate: () => void;
    onOpenConsole: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
    const {
        onApiKeyClick,
        onModelsClick,
        onDonateClick,
        isAlwaysOnTop,
        isFollowMouse,
        onToggleAlwaysOnTop,
        onToggleFollowMouse,
        onShowAbout,
        onOpenPromptSettings,
        onOpenDefaultSettings,
        onOpenImageProviders,
        onOpenLanguageSelection,
        onHomeClick,
        onOpenHistory,
        onOpenFlashcards,
        showReturnButton,
        onReturnClick,
        onOpenFastTranslate,
        onOpenConsole,
    } = props;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (action: () => void) => {
        action();
        handleClose();
    };

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: '40px'
        }}>
            <style>
                {`
                @keyframes glowing {
                    0% { box-shadow: 0 0 3px #ffab91, 0 0 5px #ffab91, inset 0 0 3px #ffab91; }
                    50% { box-shadow: 0 0 8px #ff7043, 0 0 12px #ff7043, inset 0 0 6px #ff7043; }
                    100% { box-shadow: 0 0 3px #ffab91, 0 0 5px #ffab91, inset 0 0 3px #ffab91; }
                }
                `}
            </style>

            {/* Empty Box to balance the layout if needed, or just use flex-grow on the center box */}
            <Box sx={{ width: '80px' }} />

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                {/* Desktop-specific controls removed for web version */}

                <Tooltip title="Fast Translate" placement="bottom">
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={onOpenFastTranslate}
                        sx={{
                            minWidth: '40px',
                            px: 1,
                            borderColor: 'text.secondary',
                            color: 'text.secondary',
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                                borderColor: 'text.primary',
                            }
                        }}
                    >
                        <TranslateIcon fontSize="small" />
                    </Button>
                </Tooltip>

                <Button
                    variant="contained"
                    size="small"
                    onClick={onOpenLanguageSelection}
                    sx={{
                        minWidth: '40px', // Reduced from 60px
                        px: 1, // Reduced padding
                        bgcolor: '#2196f3', // Blue color for distinction
                        color: '#fff',
                        fontWeight: 'bold',
                        '&:hover': {
                            bgcolor: '#1976d2',
                        }
                    }}
                >
                    YL
                </Button>

                <Button
                    variant="contained"
                    size="small"
                    onClick={onDonateClick}
                    sx={{
                        bgcolor: '#ff7043',
                        color: '#fff',
                        fontWeight: 'bold',
                        animation: 'glowing 2.5s infinite ease-in-out',
                        '&:hover': {
                            bgcolor: '#ff5722',
                            transform: 'scale(1.05)',
                        }
                    }}
                >
                    Donate
                </Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {showReturnButton && (
                    <IconButton
                        onClick={onReturnClick}
                        size="small"
                        sx={{
                            mr: 1,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'scale(1.2)',
                                color: '#1976d2',
                                backgroundColor: 'rgba(25, 118, 210, 0.08)'
                            }
                        }}
                    >
                        <ReplyIcon />
                    </IconButton>
                )}
                <IconButton
                    onClick={onOpenConsole}
                    title="Console"
                    size="small"
                >
                    <TerminalIcon />
                </IconButton>
                <IconButton
                    onClick={onModelsClick}
                    title="Models"
                    size="small"
                >
                    <AutoAwesomeIcon />
                </IconButton>
                <IconButton
                    onClick={onHomeClick}
                    title="Home"
                    size="small"
                >
                    <HomeIcon />
                </IconButton>
            </Box>
        </Box >
    );
};

export default Header;
