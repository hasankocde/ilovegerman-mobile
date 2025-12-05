import React, { useEffect, useState } from 'react';
import {
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    IconButton,
    Typography,
    Box,
    Divider,
    Chip,
    Button,
    Paper
} from '@mui/material';
import { Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { HistoryItem } from '../types';
import { webStore } from '../services/WebIntegration';

interface HistoryPageProps {
    onLoadHistoryItem: (item: HistoryItem) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onLoadHistoryItem }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const fetchHistory = async () => {
        const items = webStore.get('history') || [];
        setHistory(items);
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const items = webStore.get('history') || [];
        const newItems = items.filter((item: HistoryItem) => item.id !== id);
        webStore.set('history', newItems);
        fetchHistory();
    };

    const handleClearAll = async () => {
        if (confirm('Are you sure you want to clear all history?')) {
            webStore.set('history', []);
            fetchHistory();
        }
    };

    const handleItemClick = (item: HistoryItem) => {
        onLoadHistoryItem(item);
    };

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Paper elevation={0} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'transparent' }}>
                <Typography variant="h5" component="h2">
                    Translation History
                </Typography>
                {history.length > 0 && (
                    <Button color="error" variant="outlined" size="small" onClick={handleClearAll}>
                        Clear All
                    </Button>
                )}
            </Paper>

            {history.length === 0 ? (
                <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 10 }}>
                    No history found.
                </Typography>
            ) : (
                <Paper elevation={1}>
                    <List>
                        {history.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <ListItem
                                    secondaryAction={
                                        <IconButton edge="end" aria-label="delete" onClick={(e) => handleDelete(e, item.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                    disablePadding
                                >
                                    <ListItemButton onClick={() => handleItemClick(item)}>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body1" noWrap>
                                                    {item.originalInput.length > 50 ? item.originalInput.substring(0, 50) + '...' : item.originalInput}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {new Date(item.timestamp).toLocaleString()}
                                                    </Typography>
                                                    <Chip
                                                        icon={<VisibilityIcon style={{ fontSize: 14 }} />}
                                                        label={item.viewCount}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                                                    />
                                                </Box>
                                            }
                                            // Ensure secondary text renders as div to allow nested components like Box/Chip
                                            secondaryTypographyProps={{ component: 'div' }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                                {index < history.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default HistoryPage;
