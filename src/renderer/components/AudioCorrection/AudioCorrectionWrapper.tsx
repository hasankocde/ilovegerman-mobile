import React from 'react';
import { TranslatorUI } from './TranslatorUI';
import { Box } from '@mui/material';

interface AudioCorrectionWrapperProps {
    onClose: () => void;
}

export const AudioCorrectionWrapper: React.FC<AudioCorrectionWrapperProps> = ({ onClose }) => {
    const handleKeySubmit = (key: string) => {
        // This might not be needed anymore if we strictly use global key, 
        // but keeping it for now to satisfy TranslatorUI prop requirement temporarily.
        // Ideally we should update the global key here if we wanted to support editing,
        // but the user wants to remove the edit button.
    };

    return (
        <Box sx={{ height: '100%', width: '100%', bgcolor: 'background.paper', overflow: 'hidden' }}>
            <TranslatorUI onKeySubmit={handleKeySubmit} onClose={onClose} />
        </Box>
    );
};
