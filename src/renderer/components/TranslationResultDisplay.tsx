// src/renderer/components/TranslationResultDisplay.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Typography, Button, Tooltip, IconButton, Box } from '@mui/material';
import { KeyboardArrowDown as IconDown, KeyboardArrowUp as IconUp, Refresh as IconRefresh, Visibility as IconEye, VisibilityOff as IconEyeInvisible } from '@mui/icons-material';
import { LANGUAGE_CODES } from '../constants/languages';
import { webStore } from '../services/WebIntegration';

interface TranslationSettings {
    mode: 'both' | 'single';
    language: string;
}

const filterTranslation = (fullText: string, settings: TranslationSettings): string => {
    if (settings.mode === 'both' || (!fullText.includes('–') && !fullText.includes('-'))) {
        return fullText.trim();
    }
    const parts = fullText.split(/–|—|-/);
    const englishPart = (parts[0] || '').trim();
    const targetPart = (parts[1] || '').trim();

    return settings.language === 'en' ? englishPart : targetPart;
};

interface TranslationResultDisplayProps {
    rawTextOutput: string;
    loading: boolean;
    isTranslationVisible: boolean;
    toggleTranslationVisibility: () => void;
    handleRefreshTranslation: () => void;
    handleExportToCSV: (source: string, combinedTranslation: string) => void;
    handleWordClick: (sourceText: string, word: string, fullTranslation: string) => void;
    handleVerbClick: (infinitiveVerb: string) => void;
}

type ProcessedVerb = {
    isRaw: false;
    infinitive: string;
    original: string;
    translation: string;
};
type RawVerb = { isRaw: true; line: string; };
type ProcessedArticle = {
    article: 'der' | 'das' | 'die';
    baseForm: string;
    originalForm: string;
    translation: string;
    fullLine: string;
};
type ProcessedDataType = {
    isRaw: false; sourceText: string; englishText: string;
    targetText: string; wordMeanings: string[];
    verbs: (ProcessedVerb | RawVerb)[];
    allArticles: ProcessedArticle[];
    hasFullTranslation: boolean; combinedTranslation: string;
} | { isRaw: true; rawContent: string; } | null;

// Helper to remove markdown bold/italic markers and leading bullets
const cleanText = (text: string): string => {
    return text
        .replace(/^[\s*]+/, '') // Remove leading whitespace and asterisks
        .replace(/\*\*/g, '')   // Remove bold markers
        .replace(/\*/g, '')     // Remove remaining asterisks
        .trim();
};

const parseAndCleanLines = (text: string): string[] => {
    return text
        .split('\n')
        .map(line => cleanText(line))
        .filter(line => line.length > 0);
};

const TranslationResultDisplay: React.FC<TranslationResultDisplayProps> = ({
    rawTextOutput, loading, isTranslationVisible, toggleTranslationVisibility,
    handleRefreshTranslation, handleExportToCSV, handleWordClick, handleVerbClick,
}) => {
    const [showAllArticles, setShowAllArticles] = useState(false);
    const [translationSettings, setTranslationSettings] = useState<TranslationSettings>({ mode: 'both', language: 'Turkish' });

    useEffect(() => {
        const defaultSettings = webStore.get('default-settings');
        if (defaultSettings) setShowAllArticles(defaultSettings.showDieArticles);

        const transSettings = webStore.get('translation-settings');
        if (transSettings) setTranslationSettings(transSettings);
    }, [rawTextOutput]);

    const processedData: ProcessedDataType = useMemo(() => {
        if (!rawTextOutput) return null;

        const sections: { [key: string]: string } = {};
        const markers = [
            'Source:', 'En:', 'Tr:', 'YL:',
            'Word Meanings:',
            'Verb Infinitives:',
            'Articles (der, die, das):'
        ];

        // Pre-clean the raw output to remove markdown bold markers from headers for easier matching
        // Also handle potential markdown headers like ### Source:
        let remainingText = rawTextOutput.replace(/\*\*/g, '').replace(/###\s*/g, '');

        const sourceIndex = remainingText.indexOf('Source:');
        if (sourceIndex === -1) {
            // Try case-insensitive match for Source:
            const sourceMatch = remainingText.match(/Source:/i);
            if (!sourceMatch) return { isRaw: true, rawContent: rawTextOutput };
            remainingText = remainingText.substring(sourceMatch.index!);
        } else {
            remainingText = remainingText.substring(sourceIndex);
        }

        const foundMarkers: { key: string, index: number }[] = [];
        markers.forEach(marker => {
            // Escape special chars for regex
            const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Create regex to match marker with optional colon and whitespace
            const regex = new RegExp(`${escapedMarker}\\s*`, 'i');
            const match = remainingText.match(regex);

            if (match) {
                foundMarkers.push({ key: marker, index: match.index! });
            }
        });

        foundMarkers.sort((a, b) => a.index - b.index);

        if (foundMarkers.length === 0) {
            return { isRaw: true, rawContent: rawTextOutput };
        }

        for (let i = 0; i < foundMarkers.length; i++) {
            const currentMarker = foundMarkers[i];
            const nextMarker = foundMarkers[i + 1];

            // Find the end of the marker string itself in the text to start capturing content after it
            const markerRegex = new RegExp(`${currentMarker.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
            const match = remainingText.substring(currentMarker.index).match(markerRegex);
            const markerLength = match ? match[0].length : currentMarker.key.length;

            const start = currentMarker.index + markerLength;
            const end = nextMarker ? nextMarker.index : remainingText.length;

            const content = remainingText.substring(start, end).trim();
            sections[currentMarker.key] = content;
        }

        const sourceText = cleanText(sections['Source:'] || '');
        const englishText = cleanText(sections['En:'] || '');
        // Support both Tr: and YL: markers
        const targetText = cleanText(sections['YL:'] || sections['Tr:'] || '');
        const wordMeaningsText = sections['Word Meanings:'] || '';
        const verbInfinitivesText = sections['Verb Infinitives:'] || '';
        const articlesText = sections['Articles (der, die, das):'] || '';

        if (!sourceText) {
            return { isRaw: true, rawContent: rawTextOutput };
        }

        const allArticles = parseAndCleanLines(articlesText)
            .map((line): ProcessedArticle | null => {
                // Regex updated to be more lenient with spaces after cleaning
                const match = line.match(/^(der|das|die)\s+(.+?)\s+\(from "(.+?)"\)\s*:\s*(.*)/i);
                if (!match) return null;
                const [_, article, baseForm, originalForm, translation] = match;
                return {
                    article: article.toLowerCase() as 'der' | 'das' | 'die',
                    baseForm: baseForm.trim(),
                    originalForm: originalForm.trim(),
                    translation: filterTranslation(translation, translationSettings),
                    fullLine: line,
                };
            }).filter((item): item is ProcessedArticle => item !== null);

        const verbs: (ProcessedVerb | RawVerb)[] = parseAndCleanLines(verbInfinitivesText)
            .map(line => {
                const verbRegex = /^(.*?)\s+\(from\s+"(.*?)"\)\s*:\s*(.*)$/i;
                const match = line.match(verbRegex);
                if (!match) return { isRaw: true, line };
                const [, infinitive, original, translation] = match;
                if (!infinitive || !original) return { isRaw: true, line };
                return {
                    isRaw: false, infinitive: infinitive.trim(), original: original.trim(),
                    translation: filterTranslation(translation || '', translationSettings),
                };
            });

        return {
            isRaw: false,
            sourceText,
            englishText,
            targetText,
            wordMeanings: parseAndCleanLines(wordMeaningsText),
            verbs,
            allArticles,
            hasFullTranslation: !!(englishText || targetText),
            combinedTranslation: `${englishText} *** ${targetText}`.replace(/\s*–\s*/g, ' *** '),
        };
    }, [rawTextOutput, translationSettings]);

    const nounMapForHighlight = useMemo(() => {
        if (!processedData || processedData.isRaw) return new Map();
        const articlesToHighlight = showAllArticles
            ? processedData.allArticles
            : processedData.allArticles.filter(n => n.article !== 'die');
        return new Map(articlesToHighlight.map(n => [n.originalForm, n.article]));
    }, [processedData, showAllArticles]);

    if (loading || !processedData) return null;
    if (processedData.isRaw) {
        return <div className="result-container"><div className="translated-section"><Typography variant="body1">{processedData.rawContent}</Typography></div></div>;
    }

    const { sourceText, englishText, targetText, wordMeanings, verbs, allArticles, hasFullTranslation, combinedTranslation } = processedData;

    const enrichedSourceHTML = sourceText.split(/(\s+|[.,;!?()"“»«])/g).map((part, i) => {
        const cleanPart = part.replace(/[.,;!?()"“»«]/g, '');
        const article = nounMapForHighlight.get(cleanPart);
        return article ? `<span key=${i} class="article-${article}">${part}</span>` : part;
    }).join('');

    const articlesToDisplay = showAllArticles
        ? allArticles
        : allArticles.filter(noun => noun.article !== 'die');

    return (
        <div className="result-container" id="translated-container">
            {sourceText && (
                <div className="translated-section sentence-section" style={{ position: 'relative' }}>
                    <Typography variant="body1" component="div">
                        <strong onClick={() => hasFullTranslation && handleExportToCSV(sourceText, combinedTranslation)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Source:</strong>{' '}
                        <span dangerouslySetInnerHTML={{ __html: enrichedSourceHTML }} />
                    </Typography>
                    <div style={{ position: 'absolute', right: 0, bottom: 0, cursor: 'pointer', opacity: 0.6, display: 'flex' }}>
                        <Tooltip title="Refresh Translation"><IconButton size="small" onClick={handleRefreshTranslation}><IconRefresh fontSize="small" /></IconButton></Tooltip>
                        {(englishText || targetText) && (
                            <Tooltip title={isTranslationVisible ? "Hide Translations" : "Show Translations"}><IconButton size="small" onClick={toggleTranslationVisibility}>{isTranslationVisible ? <IconUp fontSize="small" /> : <IconDown fontSize="small" />}</IconButton></Tooltip>
                        )}
                    </div>
                </div>
            )}

            {isTranslationVisible && (englishText || targetText) && (
                <div className="translated-section direct-translations-section">
                    {(translationSettings.mode === 'both' || translationSettings.language === 'en') && englishText && <Typography variant="body1"><strong>En:</strong> {englishText}</Typography>}
                    {(translationSettings.mode === 'both' || translationSettings.language !== 'en') && targetText && <Typography variant="body1"><strong>{LANGUAGE_CODES[translationSettings.language] || translationSettings.language.substring(0, 2)}:</strong> {targetText}</Typography>}
                </div>
            )}

            {wordMeanings.length > 0 && (
                <div className="translated-section word-meanings-section">
                    <Typography variant="body1" component="div">
                        <strong>Word Meanings:</strong><br />
                        {wordMeanings.map((line, index) => {
                            const parts = line.split(/:(.*)/s);
                            const german = parts[0]?.trim();
                            const translation = (parts[1] || '').trim();
                            if (!german) return null;
                            return (
                                <div key={index}>
                                    <strong onClick={() => handleWordClick(sourceText, german, translation)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{german}</strong>: {filterTranslation(translation, translationSettings)}
                                </div>
                            );
                        })}
                    </Typography>
                </div>
            )}

            {verbs.length > 0 && (
                <div className="translated-section verb-infinitives-section">
                    <Typography variant="body1" component="div">
                        <strong>Verb Infinitives:</strong><br />
                        {verbs.map((verb, index) => {
                            if (verb.isRaw) {
                                return <div key={index}>{verb.line}</div>;
                            }
                            return (
                                <div key={index}>
                                    <strong onClick={() => handleWordClick(sourceText, `${verb.infinitive} (from "${verb.original}")`, verb.translation)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                                        {verb.infinitive}
                                    </strong>
                                    {' (from "'}
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleVerbClick(verb.infinitive); }} style={{ cursor: 'pointer', textDecoration: 'underline', color: '#1a73e8' }}>
                                        {verb.original}
                                    </a>
                                    {'")'}
                                    {`: ${verb.translation}`}
                                </div>
                            );
                        })}
                    </Typography>
                </div>
            )}

            {articlesToDisplay.length > 0 && (
                <div className="translated-section articles-section">
                    <div className="articles-section-header" style={{ marginBottom: 0 }}>
                        <strong className="articles-title">Articles:</strong>
                        <Tooltip title={showAllArticles ? "Hide 'die' articles" : "Show all articles"}>
                            <IconButton
                                size="small"
                                onClick={() => setShowAllArticles(!showAllArticles)}
                                style={{ color: '#888' }}
                            >
                                {showAllArticles ? <IconEyeInvisible fontSize="small" /> : <IconEye fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    </div>
                    <Typography variant="body1" component="div" sx={{ mt: 0 }}>
                        {articlesToDisplay.map((noun, index) => {
                            return (
                                <div key={index}>
                                    <strong onClick={() => handleWordClick(sourceText, `${noun.article} ${noun.baseForm} (from "${noun.originalForm}")`, noun.translation)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                                        {`${noun.article} ${noun.baseForm}`}
                                    </strong>
                                    {` (from "${noun.originalForm}"): ${noun.translation}`}
                                </div>
                            );
                        })}
                    </Typography>
                </div>
            )}
        </div>
    );
};

export default TranslationResultDisplay;
