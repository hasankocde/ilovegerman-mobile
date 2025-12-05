import React, { useMemo } from 'react';
import { Typography, CircularProgress, Box, Tooltip, IconButton } from '@mui/material';
import { Refresh as IconRefresh } from '@mui/icons-material';

interface AudioResultDisplayProps {
  resultText: string;
  isLoading: boolean;
  errorText: string;
  onCorrectText: (text: string) => void;
  compact?: boolean;
}

const AudioResultDisplay: React.FC<AudioResultDisplayProps> = ({
  resultText,
  isLoading,
  errorText,
  onCorrectText,
  compact = false,
}) => {
  const processedData = useMemo(() => {
    if (!resultText) return null;

    // Pre-process text to fix common split keywords caused by stream accumulation
    // e.g. "Ver batim" -> "Verbatim"
    let cleanText = resultText
      .replace(/Ver\s+batim/gi, 'Verbatim')
      .replace(/Trans\s+cription/gi, 'Transcription')
      .replace(/Cor\s+rected/gi, 'Corrected')
      .replace(/Trans\s+lations/gi, 'Translations')
      .replace(/Meaning\s+ful/gi, 'Meaningful');

    // Helper to find the best match for a section header
    const findHeader = (text: string, patterns: RegExp[]) => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match.index !== undefined) {
          return { index: match.index, length: match[0].length, end: match.index + match[0].length };
        }
      }
      return null;
    };

    // Define flexible patterns for each section
    // We use non-capturing groups for optional prefixes like "**1. " to ensure we match the whole header
    const verbatimPatterns = [
      /(?:\*\*|)?(?:1\.)?\s*Verbatim Transcription[:*]*/i,
      /(?:\*\*|)?(?:1\.)?\s*Verbatim[:*]*/i
    ];
    const correctedPatterns = [
      /(?:\*\*|)?(?:2\.)?\s*Corrected and Meaningful German Text[:*]*/i,
      /(?:\*\*|)?(?:2\.)?\s*Corrected Version[:*]*/i,
      /(?:\*\*|)?(?:2\.)?\s*Corrected[:*]*/i
    ];
    const translationPatterns = [
      /(?:\*\*|)?(?:3\.)?\s*English and Turkish Translation[:*]*/i,
      /(?:\*\*|)?(?:3\.)?\s*Translations[:*]*/i
    ];
    const errorPatterns = [
      /(?:\*\*|)?(?:4\.)?\s*Hata Analizi ve Açıklamalar[:*]*/i,
      /(?:\*\*|)?(?:4\.)?\s*Error Analysis[:*]*/i,
      /(?:\*\*|)?(?:4\.)?\s*Hata Analizi[:*]*/i
    ];

    // Find all headers
    const verbatim = findHeader(cleanText, verbatimPatterns);
    const corrected = findHeader(cleanText, correctedPatterns);
    const translation = findHeader(cleanText, translationPatterns);
    const error = findHeader(cleanText, errorPatterns);

    // Sort found sections by index to determine order and content boundaries
    const foundSections = [
      { type: 'transcription', ...verbatim },
      { type: 'correctedGerman', ...corrected },
      { type: 'translations', ...translation },
      { type: 'errorAnalysis', ...error }
    ].filter(s => s.index !== undefined).sort((a, b) => (a.index as number) - (b.index as number));

    const sections = {
      transcription: '',
      correctedGerman: '',
      translations: { en: '', tr: '' },
      errorAnalysis: [] as string[]
    };

    // Helper to clean extracted content
    const cleanContent = (text: string) => {
      return text
        .replace(/^[:*.\s]+/, '') // Remove leading colons, stars, dots, spaces
        .replace(/[:*.\s]+$/, '') // Remove trailing colons, stars, dots, spaces
        .trim();
    };

    // Extract content based on sorted sections
    foundSections.forEach((section, i) => {
      const start = section.end;
      const end = foundSections[i + 1] ? foundSections[i + 1].index : cleanText.length;
      const rawContent = cleanText.slice(start, end).trim();
      const content = cleanContent(rawContent);

      if (section.type === 'transcription') {
        sections.transcription = content;
      } else if (section.type === 'correctedGerman') {
        sections.correctedGerman = content;
      } else if (section.type === 'translations') {
        const enMatch = content.match(/(?:\*\*|)?En[:*]*\s*(.*)/i);
        const trMatch = content.match(/(?:\*\*|)?Tr[:*]*\s*(.*)/i);
        if (enMatch) sections.translations.en = cleanContent(enMatch[1]);
        if (trMatch) sections.translations.tr = cleanContent(trMatch[1]);
      } else if (section.type === 'errorAnalysis') {
        sections.errorAnalysis = content.split('\n').filter(l => l.trim() !== '');
      }
    });

    // Fallback: if no sections found but text exists, treat as raw
    const isParsed = foundSections.length > 0;

    return { isParsed, sections, raw: cleanText };
  }, [resultText]);



  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', p: 6 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>Processing Audio...</Typography>
      </Box>
    );
  }

  if (errorText) {
    return (
      <div className="result-container">
        <div className="translated-section" style={{ backgroundColor: '#ffebee', borderLeft: '4px solid #f44336' }}>
          <Typography variant="h6" color="error" gutterBottom>Error</Typography>
          <Typography variant="body1">{errorText}</Typography>
        </div>
      </div>
    )
  }

  if (!processedData?.isParsed) {
    // Fallback to raw display if structure isn't found
    return (
      <div className="result-container">
        <div className="translated-section">
          <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>{resultText}</Typography>
        </div>
      </div>
    );
  }

  const { sections } = processedData;

  // Font sizes based on compact mode
  const headingSize = compact ? '0.85rem' : '1rem';
  const bodySize = compact ? '0.75rem' : undefined;
  const body2Size = compact ? '0.7rem' : undefined;

  return (
    <div className="result-container" id="audio-result-container">
      {/* 1. Verbatim Transcription */}
      {sections.transcription && (
        <div className="translated-section sentence-section" style={{ position: 'relative' }}>
          <Typography variant="body1" component="div" sx={{ fontSize: bodySize }}>
            <strong>Verbatim Transcription:</strong><br />
            {sections.transcription}
          </Typography>
        </div>
      )}

      {/* 2. Corrected German */}
      {sections.correctedGerman && (
        <div className="translated-section korrigierte-version-section">
          <Typography variant="h6" gutterBottom style={{ fontSize: headingSize, fontWeight: 'bold' }}>✅ Corrected Version</Typography>
          <Typography variant="body1" sx={{ fontSize: bodySize }}>{sections.correctedGerman}</Typography>
        </div>
      )}

      {/* 3. Translations */}
      {(sections.translations.en || sections.translations.tr) && (
        <div className="translated-section direct-translations-section">
          {sections.translations.en && <Typography variant="body1" sx={{ fontSize: bodySize }}><strong>En:</strong> {sections.translations.en}</Typography>}
          {sections.translations.tr && <Typography variant="body1" sx={{ fontSize: bodySize }}><strong>Tr:</strong> {sections.translations.tr}</Typography>}
        </div>
      )}

      {/* 4. Error Analysis */}
      {sections.errorAnalysis.length > 0 && (
        <div className="translated-section fehleranalyse-section">
          <Typography variant="h6" gutterBottom style={{ fontSize: headingSize, fontWeight: 'bold' }}>🟨 Error Analysis</Typography>
          <Box>
            {sections.errorAnalysis.map((line, idx) => {
              // Simple formatting for bold parts
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return (
                <Typography key={idx} variant="body2" style={{ marginBottom: '4px', paddingLeft: line.trim().startsWith('*') ? '10px' : '0', fontSize: body2Size }}>
                  {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </Typography>
              )
            })}
          </Box>
        </div>
      )}
    </div>
  );
};

export default AudioResultDisplay;
