import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    TextField,
    Button,
    RadioGroup,
    FormControlLabel,
    Radio,
    IconButton,
    Tooltip,
    Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export interface Prompt {
    id: string;
    text: string;
}

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultPrompt: Prompt;
    savedPrompts: Prompt[];
    activePromptId: string;
    onSavePrompts: (prompts: Prompt[], activeId: string) => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
    isOpen,
    onClose,
    defaultPrompt,
    savedPrompts,
    activePromptId,
    onSavePrompts,
}) => {
    const [prompts, setPrompts] = useState<Prompt[]>(savedPrompts);
    const [selectedPromptId, setSelectedPromptId] = useState(activePromptId);
    const [newPromptText, setNewPromptText] = useState('');
    const [editingPromptId, setEditingPromptId] = useState<string | null>(null);

    useEffect(() => {
        setPrompts(savedPrompts);
        setSelectedPromptId(activePromptId);
    }, [isOpen, savedPrompts, activePromptId]);

    const handleSaveAndClose = () => {
        onSavePrompts(prompts, selectedPromptId);
        onClose();
    };

    const handleAddOrUpdatePrompt = () => {
        if (!newPromptText.trim()) return;

        if (editingPromptId) {
            const updatedPrompts = prompts.map(p =>
                p.id === editingPromptId ? { ...p, text: newPromptText } : p
            );
            setPrompts(updatedPrompts);
        } else {
            const newPrompt: Prompt = { id: `custom-${Date.now()}`, text: newPromptText };
            setPrompts([...prompts, newPrompt]);
        }
        setNewPromptText('');
        setEditingPromptId(null);
    };

    const handleEditClick = (prompt: Prompt) => {
        setEditingPromptId(prompt.id);
        setNewPromptText(prompt.text);
    };

    const handleDeleteClick = (id: string) => {
        const filteredPrompts = prompts.filter(p => p.id !== id);
        setPrompts(filteredPrompts);
        if (selectedPromptId === id) {
            setSelectedPromptId(defaultPrompt.id);
        }
    };

    const handlePromptTextClick = (text: string) => {
        setNewPromptText(text);
    };

    const allPrompts = [defaultPrompt, ...prompts];

    return (
        <Dialog open={isOpen} onClose={handleSaveAndClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Manage Prompts
                <IconButton aria-label="close" onClick={handleSaveAndClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Typography gutterBottom>Select an active prompt or add a new one.</Typography>
                <RadioGroup value={selectedPromptId} onChange={(e) => setSelectedPromptId(e.target.value)}>
                    {allPrompts.map(prompt => (
                        <Paper key={prompt.id} variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                            <FormControlLabel value={prompt.id} control={<Radio />} label="" sx={{ mr: 0 }} />
                            <Typography
                                variant="body2"
                                sx={{ flexGrow: 1, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                                onClick={() => handlePromptTextClick(prompt.text)}
                            >
                                {prompt.text.substring(0, 100)}{prompt.text.length > 100 ? '...' : ''}
                                {prompt.id === 'default' && (
                                    <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                        (Default)
                                    </Typography>
                                )}
                            </Typography>
                            {prompt.id !== 'default' && (
                                <Box>
                                    <Tooltip title="Edit">
                                        <IconButton size="small" onClick={() => handleEditClick(prompt)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" onClick={() => handleDeleteClick(prompt.id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )}
                        </Paper>
                    ))}
                </RadioGroup>

                <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" gutterBottom>
                        {editingPromptId ? 'Edit Prompt' : 'Add New Prompt'}
                    </Typography>
                    <TextField
                        multiline
                        rows={6}
                        fullWidth
                        variant="outlined"
                        placeholder="Enter your custom prompt here..."
                        value={newPromptText}
                        onChange={(e) => setNewPromptText(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        startIcon={editingPromptId ? null : <AddIcon />}
                        onClick={handleAddOrUpdatePrompt}
                        sx={{ mt: 2 }}
                    >
                        {editingPromptId ? 'Save Changes' : 'Add Prompt'}
                    </Button>
                    {editingPromptId && (
                        <Button variant="text" onClick={() => { setEditingPromptId(null); setNewPromptText(''); }} sx={{ mt: 2, ml: 1 }}>
                            Cancel
                        </Button>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};
