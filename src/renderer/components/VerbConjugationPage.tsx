import React, { useMemo } from 'react';
import { Button, CircularProgress, Box, Typography, Paper, Grid, Divider } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { openExternal } from '../services/WebIntegration';

interface VerbConjugationPageProps {
    content: string;
    loading: boolean;
    verb: string;
}

interface ConjugationSection {
    title: string;
    tenses: ConjugationTense[];
}

interface ConjugationTense {
    name: string;
    forms: string[];
}

interface ParsedConjugation {
    headerInfo: string[];
    sections: ConjugationSection[];
}

const parseConjugationContent = (content: string): ParsedConjugation => {
    const lines = content.split('\n');
    const headerInfo: string[] = [];
    const sections: ConjugationSection[] = [];

    let currentSection: ConjugationSection | null = null;
    let currentTense: ConjugationTense | null = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('**Infinitive:**') ||
            trimmed.startsWith('**Partizip') ||
            trimmed.startsWith('**Hilfsverb:')) {
            headerInfo.push(trimmed);
        } else if (trimmed.startsWith('### ')) {
            // New Section (Mood)
            if (currentTense && currentSection) {
                currentSection.tenses.push(currentTense);
                currentTense = null;
            }
            if (currentSection) {
                sections.push(currentSection);
            }
            currentSection = { title: trimmed.replace('### ', ''), tenses: [] };
        } else if (trimmed.startsWith('#### ')) {
            // New Tense
            if (currentTense && currentSection) {
                currentSection.tenses.push(currentTense);
            }
            currentTense = { name: trimmed.replace('#### ', ''), forms: [] };
        } else if (trimmed.startsWith('**')) {
            // Conjugation line
            if (currentTense) {
                currentTense.forms.push(trimmed);
            }
        }
    }

    // Push remaining
    if (currentTense && currentSection) {
        currentSection.tenses.push(currentTense);
    }
    if (currentSection) {
        sections.push(currentSection);
    }

    return { headerInfo, sections };
};

const VerbConjugationPage: React.FC<VerbConjugationPageProps> = ({
    content,
    loading,
    verb,
}) => {
    const loadingFallback = (
        <Box sx={{ textAlign: 'center', p: 4 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ mt: 2 }}>Loading conjugation table...</Typography>
        </Box>
    );

    const reversoLink = `https://konjugator.reverso.net/konjugation-deutsch-verb-${verb}.html`;

    const handleLinkClick = () => {
        openExternal(reversoLink);
    };

    const parsedData = useMemo(() => {
        if (!content || loading) return null;
        return parseConjugationContent(content);
    }, [content, loading]);

    if (loading) {
        return (
            <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'transparent' }}>
                    <Typography variant="h5" component="h2">Conjugation for "{verb}"</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 3 }}>{loadingFallback}</Paper>
            </Box>
        );
    }

    if (!parsedData) return null;

    return (
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }} className="result-container">
            <Paper elevation={0} sx={{ p: 2, mb: 1, bgcolor: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#333' }}>
                    Conjugation for "{verb}"
                </Typography>
                <Button
                    startIcon={<LinkIcon />}
                    onClick={handleLinkClick}
                    variant="outlined"
                    size="small"
                >
                    View on Reverso
                </Button>
            </Paper>

            {/* Header Info Section */}
            {parsedData.headerInfo.length > 0 && (
                <div className="translated-section word-meanings-section">
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Verb Details</Typography>
                    <Grid container spacing={2}>
                        {parsedData.headerInfo.map((info, index) => {
                            const [label, value] = info.split(':');
                            return (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                                    <Typography variant="body2">
                                        <span dangerouslySetInnerHTML={{ __html: label + ':' }} /> {value}
                                    </Typography>
                                </Grid>
                            );
                        })}
                    </Grid>
                </div>
            )}

            {/* Mood Sections */}
            {parsedData.sections.map((section, secIndex) => {
                // Determine style based on section title
                let sectionClass = 'translated-section';
                if (section.title.includes('INDIKATIV')) {
                    sectionClass += ' verb-infinitives-section';
                } else if (section.title.includes('KONJUNKTIV') || section.title.includes('IMPERATIV')) {
                    sectionClass += ' articles-section';
                } else {
                    sectionClass += ' direct-translations-section';
                }

                return (
                    <div key={secIndex} className={sectionClass} style={{ marginTop: '16px' }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8 }}>
                            {section.title}
                        </Typography>

                        <Grid container spacing={3}>
                            {section.tenses.map((tense, tenseIndex) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={tenseIndex}>
                                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.5)', height: '100%' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, borderBottom: '1px solid rgba(0,0,0,0.1)', pb: 0.5 }}>
                                            {tense.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {tense.forms.map((form, formIndex) => (
                                                <Typography key={formIndex} variant="body2" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                                                    <span dangerouslySetInnerHTML={{ __html: form.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                                                </Typography>
                                            ))}
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </div>
                );
            })}
        </Box>
    );
};

export default VerbConjugationPage;
