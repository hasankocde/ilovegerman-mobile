import React, { useEffect, useRef } from 'react';
import { Box, IconButton, Typography, Button } from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon, ContentCopy as CopyIcon } from '@mui/icons-material';

interface LogEntry {
    type: 'log' | 'warn' | 'error' | 'info';
    message: string;
    timestamp: string;
}

interface ConsoleViewerProps {
    logs: LogEntry[];
    onClose: () => void;
    onClear: () => void;
    isOpen: boolean;
}

const ConsoleViewer: React.FC<ConsoleViewerProps> = ({ logs, onClose, onClear, isOpen }) => {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && endRef.current) {
            endRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isOpen]);

    if (!isOpen) return null;

    const handleCopy = () => {
        const text = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
        navigator.clipboard.writeText(text);
    };

    return (
        <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '12px',
        }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                borderBottom: '1px solid #333',
                bgcolor: '#1e1e1e'
            }}>
                <Typography variant="subtitle2" sx={{ color: '#aaa' }}>In-App Console</Typography>
                <Box>
                    <IconButton size="small" onClick={handleCopy} title="Copy All" sx={{ color: '#aaa' }}>
                        <CopyIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={onClear} title="Clear" sx={{ color: '#aaa' }}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={onClose} title="Close" sx={{ color: '#fff' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            {/* Logs */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                {logs.map((log, index) => (
                    <Box key={index} sx={{
                        mb: 0.5,
                        color: log.type === 'error' ? '#ff5252' : log.type === 'warn' ? '#ffb74d' : '#81c784',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        pb: 0.5
                    }}>
                        <span style={{ color: '#666', marginRight: '8px' }}>[{log.timestamp}]</span>
                        <span style={{ fontWeight: 'bold', marginRight: '8px' }}>[{log.type.toUpperCase()}]</span>
                        <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{log.message}</span>
                    </Box>
                ))}
                <div ref={endRef} />
            </Box>
        </Box>
    );
};

export default ConsoleViewer;
