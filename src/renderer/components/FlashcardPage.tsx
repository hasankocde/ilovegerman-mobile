import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Button, IconButton, Paper, Container, List, ListItem, ListItemButton, ListItemText, ListItemSecondaryAction, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { ArrowBack, Delete as DeleteIcon, PlayArrow, Edit as EditIcon, InsertDriveFile as FileIcon } from '@mui/icons-material';
import FlashcardItem from './FlashcardItem';
import { useTranslation } from 'react-i18next';
import { webStore } from '../services/WebIntegration';
import { v4 as uuidv4 } from 'uuid';

interface Flashcard {
    id: string;
    front: { top: string; bottom: string };
    back: { top: string; bottom: string };
    imageUrl?: string;
    imageIsLoading?: boolean;
    imageFetchFailed?: boolean;
}

interface FlashcardFile {
    name: string;
    path: string;
    lastModified: number;
}

type ViewMode = 'files' | 'cards' | 'study';

const FlashcardPage: React.FC = () => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<ViewMode>('files');
    const [files, setFiles] = useState<FlashcardFile[]>([]);
    const [currentFile, setCurrentFile] = useState<string | null>(null);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Rename Dialog State
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [fileToRename, setFileToRename] = useState<string | null>(null);
    const [newFileName, setNewFileName] = useState('');

    // Jump to Card Dialog
    const [jumpDialogOpen, setJumpDialogOpen] = useState(false);
    const [jumpToPage, setJumpToPage] = useState('');

    // Edit Dialog State
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editFrontTop, setEditFrontTop] = useState('');
    const [editFrontBottom, setEditFrontBottom] = useState('');
    const [editBackTop, setEditBackTop] = useState('');
    const [editBackBottom, setEditBackBottom] = useState('');

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        try {
            const fileList = webStore.get('flashcard-files') || [];
            setFiles(fileList);
        } catch (error) {
            console.error('Failed to load flashcard files:', error);
        }
    };

    const handleFileClick = async (filename: string) => {
        setCurrentFile(filename);
        try {
            const cards = webStore.get(`flashcards-${filename}`) || [];
            setFlashcards(cards);
            // Go directly to study mode
            if (cards.length > 0) {
                setCurrentIndex(0);
                setViewMode('study');
            } else {
                setViewMode('study');
            }
        } catch (error) {
            console.error('Failed to load flashcards:', error);
        }
    };

    const handleDeleteFile = async (filename: string) => {
        if (confirm(`Are you sure you want to delete ${filename}?`)) {
            try {
                const currentFiles: FlashcardFile[] = webStore.get('flashcard-files') || [];
                const newFiles = currentFiles.filter(f => f.name !== filename);
                webStore.set('flashcard-files', newFiles);
                webStore.delete(`flashcards-${filename}`);
                loadFiles();
            } catch (error) {
                console.error('Failed to delete file:', error);
            }
        }
    };

    const openRenameDialog = (filename: string) => {
        setFileToRename(filename);
        setNewFileName(filename.replace('.csv', ''));
        setRenameDialogOpen(true);
    };

    const handleRenameFile = async () => {
        if (fileToRename && newFileName) {
            try {
                const currentFiles: FlashcardFile[] = webStore.get('flashcard-files') || [];
                const fileExists = currentFiles.some(f => f.name === newFileName);
                if (fileExists) {
                    alert('File with this name already exists.');
                    return;
                }

                const newFiles = currentFiles.map(f => f.name === fileToRename ? { ...f, name: newFileName } : f);
                webStore.set('flashcard-files', newFiles);

                const cards = webStore.get(`flashcards-${fileToRename}`) || [];
                webStore.set(`flashcards-${newFileName}`, cards);
                webStore.delete(`flashcards-${fileToRename}`);

                setRenameDialogOpen(false);
                loadFiles();
            } catch (error) {
                console.error('Failed to rename file:', error);
                alert('Failed to rename file');
            }
        }
    };

    const handleDeleteCard = async (id: string) => {
        if (!currentFile) return;
        if (!confirm('Are you sure you want to delete this flashcard?')) return;

        try {
            const cards = webStore.get(`flashcards-${currentFile}`) || [];
            const newCards = cards.filter((c: Flashcard) => c.id !== id);
            webStore.set(`flashcards-${currentFile}`, newCards);

            setFlashcards(newCards);

            if (newCards.length === 0) {
                // If no cards left, maybe go back to files or stay empty
                // Staying empty is fine
            } else if (currentIndex >= newCards.length) {
                setCurrentIndex(newCards.length - 1);
            }
        } catch (error) {
            console.error('Failed to delete flashcard:', error);
        }
    };

    const handleEditCard = () => {
        const card = flashcards[currentIndex];
        if (!card) return;
        setEditFrontTop(card.front.top);
        setEditFrontBottom(card.front.bottom);
        setEditBackTop(card.back.top);
        setEditBackBottom(card.back.bottom);
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!currentFile) return;
        const card = flashcards[currentIndex];
        if (!card) return;

        const newFront = { top: editFrontTop, bottom: editFrontBottom };
        const newBack = { top: editBackTop, bottom: editBackBottom };

        try {
            const cards = webStore.get(`flashcards-${currentFile}`) || [];
            const updatedCards = cards.map((c: Flashcard) => c.id === card.id ? { ...c, front: newFront, back: newBack } : c);
            webStore.set(`flashcards-${currentFile}`, updatedCards);

            setFlashcards(updatedCards);
            setEditDialogOpen(false);
        } catch (error) {
            console.error('Failed to update card:', error);
            alert('Failed to update card');
        }
    };

    // Helper to determine prompt
    const getPromptForCard = (card: Flashcard) => {
        if (card.back.top && card.back.top !== card.back.bottom) {
            return card.back.top;
        } else if (card.back.bottom) {
            return card.back.bottom;
        } else {
            return card.front.bottom;
        }
    };

    // Auto-fetch effect
    useEffect(() => {
        if (viewMode === 'study' && flashcards.length > 0) {
            const currentCard = flashcards[currentIndex];
            // Only auto-fetch if no image, not loading, and hasn't failed before
            if (!currentCard.imageUrl && !currentCard.imageIsLoading && !currentCard.imageFetchFailed) {
                const prompt = getPromptForCard(currentCard);
                handleRegenerateImage(currentCard.id, prompt, true);
            }
        }
    }, [currentIndex, viewMode, flashcards]);

    // --- FIX: Show image immediately, then save ---
    const handleRegenerateImage = async (id: string, prompt: string, isAuto: boolean = false, force: boolean = false) => {
        // 1. If not force and image already exists (or is loading), skip.
        // However, for 'isAuto' calls we check in useEffect, but we can double check here.
        const currentCard = flashcards.find(c => c.id === id);
        if (!force && currentCard?.imageUrl && !currentCard.imageUrl.startsWith('error')) {
            console.log("Image already exists, skipping auto-fetch.");
            return;
        }

        // 2. Set to loading state and clear error flag
        setFlashcards(prev => prev.map(c => c.id === id ? { ...c, imageIsLoading: true, imageFetchFailed: false } : c));

        try {
            // 3. Fetch image from internet (returns URL)
            // Force parameter is not sent to backend but affects logic here.
            // Backend always fetches.
            const provider = webStore.get('image-provider') || 'auto';
            const unsplashKey = webStore.get('unsplash-api-key');
            const pexelsKey = webStore.get('pexels-api-key');
            let remoteUrl = '';

            // Helper for Unsplash
            const fetchUnsplash = async () => {
                if (!unsplashKey) throw new Error('Unsplash API Key missing');
                // Fetch more results from page 1 to ensure we get something, then pick random
                const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(prompt)}&per_page=20&page=1&client_id=${unsplashKey}`);
                if (!res.ok) throw new Error('Unsplash API Error');
                const data = await res.json();
                const results = data.results || [];
                if (results.length === 0) return null;
                // Pick random image from results
                const randomIndex = Math.floor(Math.random() * results.length);
                return results[randomIndex]?.urls?.regular;
            };

            // Helper for Pexels
            const fetchPexels = async () => {
                if (!pexelsKey) throw new Error('Pexels API Key missing');
                // Fetch more results from page 1
                const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(prompt)}&per_page=20&page=1`, {
                    headers: { Authorization: pexelsKey }
                });
                if (!res.ok) throw new Error('Pexels API Error');
                const data = await res.json();
                const photos = data.photos || [];
                if (photos.length === 0) return null;
                // Pick random image from results
                const randomIndex = Math.floor(Math.random() * photos.length);
                return photos[randomIndex]?.src?.large;
            };

            if (provider === 'unsplash') {
                remoteUrl = await fetchUnsplash() || '';
            } else if (provider === 'pexels') {
                remoteUrl = await fetchPexels() || '';
            } else {
                // Auto: Try Unsplash first, then Pexels
                try {
                    remoteUrl = await fetchUnsplash() || '';
                } catch (e) {
                    console.log('Unsplash failed in auto mode (error), trying Pexels...');
                }

                // If Unsplash returned null (no results) or threw error, try Pexels
                if (!remoteUrl) {
                    try {
                        console.log('Trying Pexels fallback...');
                        remoteUrl = await fetchPexels() || '';
                    } catch (e) {
                        console.log('Pexels failed in auto mode');
                    }
                }
            }

            if (!remoteUrl) {
                // Fallback to placeholder if both fail or no results
                remoteUrl = `https://via.placeholder.com/600x400?text=${encodeURIComponent(prompt)}`;
            }

            // 4. SHOW IMMEDIATELY: Update state with URL without waiting for disk save.
            setFlashcards(prev => prev.map(c => c.id === id ? { ...c, imageUrl: remoteUrl, imageIsLoading: false } : c));

            // 5. Save to disk in background (for persistence)
            if (currentFile) {
                const cards = webStore.get(`flashcards-${currentFile}`) || [];
                const updatedCards = cards.map((c: Flashcard) => c.id === id ? { ...c, imageUrl: remoteUrl } : c);
                webStore.set(`flashcards-${currentFile}`, updatedCards);
            }

        } catch (error) {
            console.error('Error in handleRegenerateImage:', error);
            setFlashcards(prev => prev.map(c => c.id === id ? { ...c, imageIsLoading: false, imageFetchFailed: true } : c));
            if (!isAuto) {
                alert('An error occurred while fetching the image. Please check your API keys.');
            }
        }
    };

    const nextCard = () => {
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const prevCard = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleJumpToCard = () => {
        const page = parseInt(jumpToPage, 10);
        if (!isNaN(page) && page >= 1 && page <= flashcards.length) {
            setCurrentIndex(page - 1);
            setJumpDialogOpen(false);
        }
    };

    // --- RENDERERS ---

    if (viewMode === 'files') {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>Flashcard Files</Typography>
                <Paper>
                    <List>
                        {files.map((file) => (
                            <ListItem key={file.name} disablePadding>
                                <ListItemButton onClick={() => handleFileClick(file.name)}>
                                    <Box mr={2} display="flex" alignItems="center">
                                        <FileIcon color="primary" />
                                    </Box>
                                    <ListItemText
                                        primary={file.name}
                                        secondary={new Date(file.lastModified).toLocaleString()}
                                    />
                                </ListItemButton>
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" aria-label="edit" onClick={(e) => { e.stopPropagation(); openRenameDialog(file.name); }}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.name); }}>
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                        {files.length === 0 && (
                            <ListItem>
                                <ListItemText primary="No flashcard files found." />
                            </ListItem>
                        )}
                    </List>
                </Paper>

                {/* Rename Dialog */}
                <Dialog
                    open={renameDialogOpen}
                    onClose={() => setRenameDialogOpen(false)}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    <DialogTitle>Rename File</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="New Filename"
                            fullWidth
                            variant="outlined"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                    handleRenameFile();
                                }
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRenameFile} variant="contained">Rename</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        );
    }

    if (viewMode === 'study') {
        return (
            <Container maxWidth="md" sx={{ mt: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Box display="flex" alignItems="center">
                        <IconButton onClick={() => { setViewMode('files'); setCurrentFile(null); }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography
                            variant="h5"
                            sx={{ ml: 2, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            onClick={() => {
                                setJumpToPage((currentIndex + 1).toString());
                                setJumpDialogOpen(true);
                            }}
                        >
                            {currentFile} ({currentIndex + 1}/{flashcards.length})
                        </Typography>
                    </Box>
                    <Box>
                        <IconButton onClick={handleEditCard} title="Edit Card">
                            <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteCard(flashcards[currentIndex]?.id)} title="Delete Card" color="error">
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                </Box>

                <Box flex={1} display="flex" justifyContent="center" alignItems="center">
                    {flashcards.length > 0 ? (
                        <FlashcardItem
                            card={flashcards[currentIndex]}
                            onRegenerateImage={(id, prompt) => handleRegenerateImage(id, prompt, false, true)}
                        />
                    ) : (
                        <Typography>No cards in this file.</Typography>
                    )}
                </Box>

                <Box display="flex" justifyContent="space-between" mt={3} mb={4}>
                    <Button variant="contained" onClick={prevCard} disabled={currentIndex === 0}>
                        Previous
                    </Button>
                    <Button variant="contained" onClick={nextCard} disabled={currentIndex === flashcards.length - 1}>
                        Next
                    </Button>
                </Box>

                {/* Jump Dialog */}
                <Dialog
                    open={jumpDialogOpen}
                    onClose={() => setJumpDialogOpen(false)}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    <DialogTitle>Jump to Card</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label={`Card Number (1-${flashcards.length})`}
                            fullWidth
                            type="number"
                            variant="outlined"
                            value={jumpToPage}
                            onChange={(e) => setJumpToPage(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                    handleJumpToCard();
                                }
                            }}
                            inputProps={{ min: 1, max: flashcards.length }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setJumpDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleJumpToCard} variant="contained">Go</Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Edit Flashcard</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Typography variant="subtitle2">Front Side</Typography>
                            <TextField
                                label="Top Text"
                                fullWidth
                                multiline
                                rows={2}
                                value={editFrontTop}
                                onChange={(e) => setEditFrontTop(e.target.value)}
                            />
                            <TextField
                                label="Bottom Text"
                                fullWidth
                                multiline
                                rows={2}
                                value={editFrontBottom}
                                onChange={(e) => setEditFrontBottom(e.target.value)}
                            />

                            <Typography variant="subtitle2" sx={{ mt: 2 }}>Back Side</Typography>
                            <TextField
                                label="Top Text"
                                fullWidth
                                multiline
                                rows={2}
                                value={editBackTop}
                                onChange={(e) => setEditBackTop(e.target.value)}
                            />
                            <TextField
                                label="Bottom Text"
                                fullWidth
                                multiline
                                rows={2}
                                value={editBackBottom}
                                onChange={(e) => setEditBackBottom(e.target.value)}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit} variant="contained">Save</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        );
    }

    return null;
};

export default FlashcardPage;
