import React from 'react';
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import {
    Key as KeyIcon,
    Settings as SettingsIcon,
    Image as ImageIcon,
    Tune as TuneIcon,
    Style as StyleIcon,
    History as HistoryIcon,
    BookmarkBorder as BookmarkIcon,
    Security as SecurityIcon,
    Info as InfoIcon,
    Person as PersonIcon,
} from '@mui/icons-material';

interface OptionsGridProps {
    onApiKeyClick: () => void;
    onOpenPromptSettings: () => void;
    onOpenImageProviders: () => void;
    onOpenDefaultSettings: () => void;
    onOpenFlashcards: () => void;
    onOpenHistory: () => void;
    onShowAbout: () => void;
    onShowSecurity: () => void;
}

const OptionsGrid: React.FC<OptionsGridProps> = ({
    onApiKeyClick,
    onOpenPromptSettings,
    onOpenImageProviders,
    onOpenDefaultSettings,
    onOpenFlashcards,
    onOpenHistory,
    onShowAbout,
    onShowSecurity,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const options = [
        { label: 'API Key', icon: <KeyIcon />, onClick: onApiKeyClick, color: '#e3f2fd', textColor: '#1565c0' },
        { label: 'Prompt Settings', icon: <SettingsIcon />, onClick: onOpenPromptSettings, color: '#f3e5f5', textColor: '#7b1fa2' },
        { label: 'Image Providers', icon: <ImageIcon />, onClick: onOpenImageProviders, color: '#e8f5e9', textColor: '#2e7d32' },
        { label: 'Default Settings', icon: <TuneIcon />, onClick: onOpenDefaultSettings, color: '#fff3e0', textColor: '#ef6c00' },
        { label: 'Flashcards', icon: <StyleIcon />, onClick: onOpenFlashcards, color: '#fce4ec', textColor: '#c2185b' },
        { label: 'History', icon: <HistoryIcon />, onClick: onOpenHistory, color: '#e0f7fa', textColor: '#006064' },
        { label: 'About Me', icon: <PersonIcon />, onClick: onShowAbout, color: '#efebe9', textColor: '#5d4037' },
        { label: 'Security Issues', icon: <SecurityIcon />, onClick: onShowSecurity, color: '#ffebee', textColor: '#c62828' },
    ];

    const visibleOptions = options;

    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px', // approx 2mm
            width: '90%', // Match ManualInput width
            maxWidth: '580px', // Match ManualInput maxWidth
            mx: 'auto', // Center horizontally
            mt: 2,
        }}>
            {visibleOptions.map((option, index) => (
                <Button
                    key={index}
                    onClick={option.onClick}
                    variant="contained"
                    sx={{
                        bgcolor: option.color,
                        color: option.textColor,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                        height: '100px',
                        textTransform: 'none',
                        // Center the last two items if they are on a new row with only 2 items
                        // Logic: 8 items total. 3 per row. 3, 3, 2.
                        // Index 6 (About Me) and 7 (Security) are on the last row.
                        // We want them centered.
                        // Grid is 3 columns.
                        // About Me (index 6) should start at column 1? No, we want them centered.
                        // If we have 2 items in the last row of a 3-column grid, we can't easily center them with simple grid-column unless we use flexbox for the container or complex grid logic.
                        // However, the user asked for "About Me" and "Security Issues" side-by-side.
                        // Let's try to make the last row look good.
                        // If we set gridColumn for index 6 to '1' and index 7 to '2', they will be left-aligned.
                        // If we want them centered, we might need a different approach or just accept left/center alignment.
                        // The previous code centered the single "About Me" item with `gridColumn: '2'`.
                        // Now we have 2 items. We can put them in col 1 and 2, or try to center them.
                        // Let's just let them flow naturally for now, or maybe make the last row a flex container?
                        // Actually, with 8 items:
                        // Row 1: 0, 1, 2
                        // Row 2: 3, 4, 5
                        // Row 3: 6, 7
                        // If we want 6 and 7 to be centered, we could wrap them in a separate container, but that breaks the grid.
                        // Let's try to set grid-column for them.
                        // If we make the grid 6 columns? No.
                        // Let's just leave them as is (left aligned) or try to center the whole grid content if possible.
                        // Wait, the user said "About Me'nin sagina ... ekle". So About Me is left, Security is right (or next to it).
                        // So standard flow is fine.
                        '&:hover': {
                            bgcolor: option.color,
                            filter: 'brightness(0.95)',
                            boxShadow: '0 6px 8px rgba(0,0,0,0.15)',
                        },
                    }}
                >
                    <Box sx={{ mb: 1 }}>{option.icon}</Box>
                    <Typography variant="caption" align="center" sx={{ lineHeight: 1.2, fontWeight: 'bold' }}>
                        {option.label}
                    </Typography>
                </Button>
            ))}
        </Box>
    );
};

export default OptionsGrid;
