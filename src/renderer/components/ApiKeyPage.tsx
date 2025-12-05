import React, { useState } from 'react';
import { Button, TextField, Tabs, Tab, Box, Typography, Paper } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { useToast } from '../contexts/ToastContext';
import { webStore, openExternal } from '../services/WebIntegration';

interface ApiKeyPageProps {
    currentApiKeyDisplay: string;
    setCurrentApiKeyDisplay: React.Dispatch<React.SetStateAction<string>>;
    currentGroqApiKeyDisplay: string;
    setCurrentGroqApiKeyDisplay: React.Dispatch<React.SetStateAction<string>>;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const ApiKeyPage: React.FC<ApiKeyPageProps> = ({
    currentApiKeyDisplay,
    setCurrentApiKeyDisplay,
    currentGroqApiKeyDisplay,
    setCurrentGroqApiKeyDisplay
}) => {
    const [geminiApiKeys, setGeminiApiKeys] = useState<string[]>([]);
    const [groqApiKeys, setGroqApiKeys] = useState<string[]>([]);
    const [newGeminiKey, setNewGeminiKey] = useState('');
    const [newGroqKey, setNewGroqKey] = useState('');
    const [geminiKeyIndex, setGeminiKeyIndex] = useState(0);
    const [groqKeyIndex, setGroqKeyIndex] = useState(0);
    const [tabValue, setTabValue] = useState(0);
    const { showToast } = useToast();

    const fetchKeysAndIndices = () => {
        const geminiKeys = webStore.get('gemini-api-keys') || [];
        setGeminiApiKeys(geminiKeys);

        const groqKeys = webStore.get('groq-api-keys') || [];
        setGroqApiKeys(groqKeys);

        const geminiIndex = webStore.get('gemini-key-index') || 0;
        setGeminiKeyIndex(geminiIndex);

        const groqIndex = webStore.get('groq-key-index') || 0;
        setGroqKeyIndex(groqIndex);
    };

    React.useEffect(() => {
        fetchKeysAndIndices();
        // Poll for updates every 2 seconds to show rotation in real-time
        const interval = setInterval(fetchKeysAndIndices, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // --- Gemini Handlers ---
    const handleAddGeminiKey = () => {
        if (!newGeminiKey.trim()) return;
        if (geminiApiKeys.length >= 20) {
            showToast('Maximum 20 Gemini API keys allowed.', 'error');
            return;
        }
        const updatedKeys = [...geminiApiKeys, newGeminiKey.trim()];
        saveGeminiKeys(updatedKeys);
        setNewGeminiKey('');
    };

    const handleRemoveGeminiKey = (index: number) => {
        const updatedKeys = geminiApiKeys.filter((_, i) => i !== index);
        saveGeminiKeys(updatedKeys);
    };

    const saveGeminiKeys = (keys: string[]) => {
        try {
            webStore.set('gemini-api-keys', keys);
            setGeminiApiKeys(keys);
            showToast('Gemini API Keys updated.', 'success');
            // Update legacy display prop for compatibility if needed, or just use first key
            setCurrentApiKeyDisplay(keys.length > 0 ? keys[0] : '');
            // Also set the single key for GeminiService
            if (keys.length > 0) webStore.set('gemini-api-key', keys[0]);
        } catch (error: any) {
            showToast(`Save failed: ${error.message}`, 'error');
        }
    };

    // --- Groq Handlers ---
    const handleAddGroqKey = () => {
        if (!newGroqKey.trim()) return;
        if (groqApiKeys.length >= 20) {
            showToast('Maximum 20 Groq API keys allowed.', 'error');
            return;
        }
        const updatedKeys = [...groqApiKeys, newGroqKey.trim()];
        saveGroqKeys(updatedKeys);
        setNewGroqKey('');
    };

    const handleRemoveGroqKey = (index: number) => {
        const updatedKeys = groqApiKeys.filter((_, i) => i !== index);
        saveGroqKeys(updatedKeys);
    };

    const saveGroqKeys = (keys: string[]) => {
        try {
            webStore.set('groq-api-keys', keys);
            setGroqApiKeys(keys);
            showToast('Groq API Keys updated.', 'success');
            setCurrentGroqApiKeyDisplay(keys.length > 0 ? keys[0] : '');
            if (keys.length > 0) webStore.set('groq-api-key', keys[0]);
        } catch (error: any) {
            showToast(`Save failed: ${error.message}`, 'error');
        }
    };

    const maskKey = (key: string) => {
        if (key.length <= 8) return '********';
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    };

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'transparent' }}>
                <Typography variant="h5" component="h2">
                    API Key Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Add multiple keys (max 20) to distribute usage. Keys are rotated automatically.
                </Typography>
            </Paper>

            <Paper elevation={1}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="api key tabs" variant="scrollable" scrollButtons="auto">
                        <Tab label={`Gemini (${geminiApiKeys.length})`} />
                        <Tab label={`Groq (${groqApiKeys.length})`} />
                    </Tabs>
                </Box>

                {/* Gemini Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            margin="dense"
                            label="Add New Gemini API Key"
                            type="password"
                            fullWidth
                            variant="outlined"
                            value={newGeminiKey}
                            onChange={(e) => setNewGeminiKey(e.target.value)}
                            placeholder="Paste new key here"
                        />
                        <Button
                            variant="contained"
                            onClick={handleAddGeminiKey}
                            disabled={!newGeminiKey.trim() || geminiApiKeys.length >= 20}
                            sx={{ mt: 1 }}
                        >
                            Add Key
                        </Button>
                        <Button
                            startIcon={<LinkIcon />}
                            onClick={() => openExternal('https://aistudio.google.com/apikey')}
                            sx={{ mt: 1, ml: 1 }}
                        >
                            Get Key
                        </Button>
                    </Box>

                    <Typography variant="h6" gutterBottom>Stored Keys</Typography>
                    {geminiApiKeys.length === 0 ? (
                        <Typography color="text.secondary">No keys stored.</Typography>
                    ) : (
                        geminiApiKeys.map((key, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    mb: 1,
                                    p: 1,
                                    border: '1px solid #eee',
                                    borderRadius: 1,
                                    bgcolor: index === geminiKeyIndex ? 'action.selected' : 'transparent',
                                    borderLeft: index === geminiKeyIndex ? '4px solid #1976d2' : '1px solid #eee'
                                }}
                            >
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', flexGrow: 1, fontWeight: index === geminiKeyIndex ? 'bold' : 'normal' }}>
                                    {index + 1}. {maskKey(key)} {index === geminiKeyIndex && '(Active)'}
                                </Typography>
                                <Button
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveGeminiKey(index)}
                                >
                                    Remove
                                </Button>
                            </Box>
                        ))
                    )}
                </TabPanel>

                {/* Groq Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            margin="dense"
                            label="Add New Groq API Key"
                            type="password"
                            fullWidth
                            variant="outlined"
                            value={newGroqKey}
                            onChange={(e) => setNewGroqKey(e.target.value)}
                            placeholder="Paste new key here"
                        />
                        <Button
                            variant="contained"
                            onClick={handleAddGroqKey}
                            disabled={!newGroqKey.trim() || groqApiKeys.length >= 20}
                            sx={{ mt: 1 }}
                        >
                            Add Key
                        </Button>
                        <Button
                            startIcon={<LinkIcon />}
                            onClick={() => openExternal('https://console.groq.com/keys')}
                            sx={{ mt: 1, ml: 1 }}
                        >
                            Get Key
                        </Button>
                    </Box>

                    <Typography variant="h6" gutterBottom>Stored Keys</Typography>
                    {groqApiKeys.length === 0 ? (
                        <Typography color="text.secondary">No keys stored.</Typography>
                    ) : (
                        groqApiKeys.map((key, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    mb: 1,
                                    p: 1,
                                    border: '1px solid #eee',
                                    borderRadius: 1,
                                    bgcolor: index === groqKeyIndex ? 'action.selected' : 'transparent',
                                    borderLeft: index === groqKeyIndex ? '4px solid #1976d2' : '1px solid #eee'
                                }}
                            >
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', flexGrow: 1, fontWeight: index === groqKeyIndex ? 'bold' : 'normal' }}>
                                    {index + 1}. {maskKey(key)} {index === groqKeyIndex && '(Active)'}
                                </Typography>
                                <Button
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveGroqKey(index)}
                                >
                                    Remove
                                </Button>
                            </Box>
                        ))
                    )}
                </TabPanel>
            </Paper>
        </Box>
    );
};

export default ApiKeyPage;
