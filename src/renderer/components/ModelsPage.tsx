import React, { useState } from 'react';
import { Button, TextField, Tabs, Tab, Box, Typography, IconButton, MenuItem, List, ListItem, ListItemText, ListItemSecondaryAction, Paper, ListItemButton } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, DragIndicator } from '@mui/icons-material';
import { useToast } from '../contexts/ToastContext';
import { webStore } from '../services/WebIntegration';

interface ModelsPageProps {
    selectedModel: string;
    setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
    availableModels: string[];
    setAvailableModels: React.Dispatch<React.SetStateAction<string[]>>;
    setCurrentModelDisplay: React.Dispatch<React.SetStateAction<string>>;
    selectedGroqModel: string;
    setSelectedGroqModel: React.Dispatch<React.SetStateAction<string>>;
    availableGroqModels: string[];
    setAvailableGroqModels: React.Dispatch<React.SetStateAction<string[]>>;
    setCurrentGroqModelDisplay: React.Dispatch<React.SetStateAction<string>>;
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
            id={`models-tabpanel-${index}`}
            aria-labelledby={`models-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const ModelsPage: React.FC<ModelsPageProps> = ({
    selectedModel,
    setSelectedModel,
    availableModels,
    setAvailableModels,
    setCurrentModelDisplay,
    selectedGroqModel,
    setSelectedGroqModel,
    availableGroqModels,
    setAvailableGroqModels,
    setCurrentGroqModelDisplay
}) => {
    const [newModelName, setNewModelName] = useState('');
    const [isAddingModel, setIsAddingModel] = useState(false);
    const [newGroqModelName, setNewGroqModelName] = useState('');
    const [isAddingGroqModel, setIsAddingGroqModel] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const { showToast } = useToast();

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleAddModel = async () => {
        if (!newModelName.trim()) {
            showToast('Please enter a model name.', 'warning');
            return;
        }

        if (availableModels.includes(newModelName.trim())) {
            showToast('This model is already in the list.', 'warning');
            return;
        }

        setIsAddingModel(true);
        setIsAddingModel(true);
        try {
            const currentModels = webStore.get('available-models') || [];
            if (currentModels.includes(newModelName.trim())) {
                showToast('This model is already in the list.', 'warning');
            } else {
                const updatedModels = [...currentModels, newModelName.trim()];
                webStore.set('available-models', updatedModels);
                setAvailableModels(updatedModels);
                setNewModelName('');
                showToast('Model added successfully.', 'success');
            }
        } catch (error: any) {
            showToast(`Failed to add model: ${error.message}`, 'error');
        } finally {
            setIsAddingModel(false);
        }
    };

    const handleRemoveModel = async (modelToRemove: string) => {
        if (!window.confirm(`Are you sure you want to remove "${modelToRemove}"?`)) return;
        try {
            const currentModels = webStore.get('available-models') || [];
            const newModels = currentModels.filter((model: string) => model !== modelToRemove);
            webStore.set('available-models', newModels);

            if (selectedModel === modelToRemove) {
                const nextModel = newModels.length > 0 ? newModels[0] : '';
                setSelectedModel(nextModel);
                if (nextModel) {
                    webStore.set('gemini-model', nextModel);
                    setCurrentModelDisplay(nextModel);
                }
            }
            setAvailableModels(newModels);
            showToast('Model removed successfully.', 'success');
        } catch (error: any) {
            showToast(`Failed to remove model: ${error.message}`, 'error');
        }
    };

    const handleAddGroqModel = async () => {
        if (!newGroqModelName.trim()) {
            showToast('Please enter a model name.', 'warning');
            return;
        }

        if ((availableGroqModels || []).includes(newGroqModelName.trim())) {
            showToast('This model is already in the list.', 'warning');
            return;
        }

        setIsAddingGroqModel(true);
        setIsAddingGroqModel(true);
        try {
            const currentModels = webStore.get('available-groq-models') || [];
            if (currentModels.includes(newGroqModelName.trim())) {
                showToast('This model is already in the list.', 'warning');
            } else {
                const updatedModels = [...currentModels, newGroqModelName.trim()];
                webStore.set('available-groq-models', updatedModels);
                setAvailableGroqModels(updatedModels);
                setNewGroqModelName('');
                showToast('Groq model added successfully.', 'success');
            }
        } catch (error: any) {
            showToast(`Failed to add Groq model: ${error.message}`, 'error');
        } finally {
            setIsAddingGroqModel(false);
        }
    };

    const handleRemoveGroqModel = async (modelToRemove: string) => {
        if (!window.confirm(`Are you sure you want to remove "${modelToRemove}"?`)) return;
        try {
            const currentModels = webStore.get('available-groq-models') || [];
            const newModels = currentModels.filter((model: string) => model !== modelToRemove);
            webStore.set('available-groq-models', newModels);

            if (selectedGroqModel === modelToRemove) {
                const nextModel = newModels.length > 0 ? newModels[0] : '';
                setSelectedGroqModel(nextModel);
                if (nextModel) {
                    webStore.set('groq-model', nextModel);
                    setCurrentGroqModelDisplay(nextModel);
                }
            }
            setAvailableGroqModels(newModels);
            showToast('Groq model removed successfully.', 'success');
        } catch (error: any) {
            showToast(`Failed to remove Groq model: ${error.message}`, 'error');
        }
    };

    const handleUnifiedModelChange = async (newModel: string) => {
        if (availableModels.includes(newModel)) {
            setSelectedModel(newModel);
            setSelectedGroqModel('');
            try {
                webStore.set('groq-model', '');
                webStore.set('gemini-model', newModel);
                setCurrentModelDisplay(newModel);
                showToast(`Gemini model updated to: ${newModel}`, 'success');
            } catch (error: any) {
                showToast(`Failed to update Gemini model: ${error.message}`, 'error');
            }
        } else if ((availableGroqModels || []).includes(newModel)) {
            setSelectedGroqModel(newModel);
            setSelectedModel('');
            try {
                webStore.set('gemini-model', '');
                webStore.set('groq-model', newModel);
                setCurrentGroqModelDisplay(newModel);
                showToast(`Groq model updated to: ${newModel}`, 'success');
            } catch (error: any) {
                showToast(`Failed to update Groq model: ${error.message}`, 'error');
            }
        }
    };

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'transparent' }}>
                <Typography variant="h5" component="h2">
                    Model Management
                </Typography>
            </Paper>

            <Paper elevation={1} sx={{ p: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="Gemini" />
                        <Tab label="Groq" />
                    </Tabs>
                </Box>

                {/* Gemini Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                        <TextField
                            label="Add New Gemini Model"
                            value={newModelName}
                            onChange={(e) => setNewModelName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddModel()}
                            fullWidth
                            size="small"
                        />
                        <Button variant="contained" onClick={handleAddModel} disabled={isAddingModel} startIcon={<AddIcon />}>
                            Add
                        </Button>
                    </Box>
                    <List dense sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                        {availableModels.map((model, index) => (
                            <ListItem key={model}
                                disablePadding
                                sx={{ bgcolor: selectedModel === model ? 'action.selected' : 'transparent' }}
                            >
                                <ListItemButton onClick={() => handleUnifiedModelChange(model)}>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            border: '2px solid',
                                            borderColor: selectedModel === model ? 'primary.main' : 'text.secondary',
                                            mr: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {selectedModel === model && (
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    bgcolor: 'primary.main',
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <ListItemText primary={model} />
                                </ListItemButton>
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleRemoveModel(model); }}>
                                        <DeleteIcon color="error" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </TabPanel>

                {/* Groq Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                        <TextField
                            label="Add New Groq Model"
                            value={newGroqModelName}
                            onChange={(e) => setNewGroqModelName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddGroqModel()}
                            fullWidth
                            size="small"
                        />
                        <Button variant="contained" onClick={handleAddGroqModel} disabled={isAddingGroqModel} startIcon={<AddIcon />}>
                            Add
                        </Button>
                    </Box>
                    <List dense sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                        {(availableGroqModels || []).map((model, index) => (
                            <ListItem key={model}
                                disablePadding
                                sx={{ bgcolor: selectedGroqModel === model ? 'action.selected' : 'transparent' }}
                            >
                                <ListItemButton onClick={() => handleUnifiedModelChange(model)}>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            border: '2px solid',
                                            borderColor: selectedGroqModel === model ? 'primary.main' : 'text.secondary',
                                            mr: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {selectedGroqModel === model && (
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    bgcolor: 'primary.main',
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <ListItemText primary={model} />
                                </ListItemButton>
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleRemoveGroqModel(model); }}>
                                        <DeleteIcon color="error" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </TabPanel>
            </Paper>
        </Box>
    );
};

export default ModelsPage;
