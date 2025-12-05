import React, { useMemo } from 'react';
import { Typography, IconButton, Tooltip, Box } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface Correction {
  incorrect: string;
  correct: string;
  explanations: string[];
}

interface CorrectionResultDisplayProps {
  correctionResult: string;
  sourceText: string;
  onRefresh: () => void;
}

const CorrectionResultDisplay: React.FC<CorrectionResultDisplayProps> = ({ correctionResult, sourceText, onRefresh }) => {
  const processedData = useMemo(() => {
    if (!correctionResult) return null;
    
    const analysisSeparator = /^\s*(?:🟨|🨨)\s*\*\*Fehleranalyse und Erklärungen:\*\*/m;
    const parts = correctionResult.split(analysisSeparator);
    
    const correctedBlock = parts[0] || '';
    const analysisRawText = parts[1]?.trim() || '';

    const correctedMarker = '✅ **Korrigierte Version:**';
    const enMarker = 'En:';
    const trMarker = 'Tr:';

    const correctedIndex = correctedBlock.indexOf(correctedMarker);
    const enIndex = correctedBlock.indexOf(enMarker);
    const trIndex = correctedBlock.indexOf(trMarker);

    let correctedVersionText = '';
    let englishTranslation = '';
    let turkishTranslation = '';

    if (correctedIndex !== -1) {
        const startGerman = correctedIndex + correctedMarker.length;
        const endGerman = enIndex !== -1 ? enIndex : (trIndex !== -1 ? trIndex : correctedBlock.length);
        correctedVersionText = correctedBlock.substring(startGerman, endGerman).trim();
    }
    if (enIndex !== -1) {
        const startEn = enIndex + enMarker.length;
        const endEn = trIndex !== -1 ? trIndex : correctedBlock.length;
        englishTranslation = correctedBlock.substring(startEn, endEn).trim();
    }
    if (trIndex !== -1) {
        const startTr = trIndex + trMarker.length;
        turkishTranslation = correctedBlock.substring(startTr).trim();
    }
    
    const correctionBlocks = analysisRawText.split('❌').filter(block => block.trim() !== '');
    const corrections: Correction[] = correctionBlocks.map(block => {
      const lines = block.trim().split('\n');
      const incorrectLine = lines.shift() || '';
      const correctLine = lines.shift() || '';
      const explanations = lines.map(line => line.replace(/^- /, '').trim()).filter(Boolean);
      return {
        incorrect: incorrectLine.replace(/"/g, '').trim(),
        correct: correctLine.replace(/✅ "/g, '').replace(/"$/, '').trim(),
        explanations,
      };
    });

    return { correctedVersionText, englishTranslation, turkishTranslation, corrections };
  }, [correctionResult]);

  if (!processedData) return null;

  const { correctedVersionText, englishTranslation, turkishTranslation, corrections } = processedData;

  return (
    <div className="result-container correction-view">
        {sourceText && (
          <div className="translated-section correction-source-section" style={{ position: 'relative' }}>
            <Typography variant="body1">
              <strong>Source:</strong> {sourceText}
            </Typography>
            <div style={{ position: 'absolute', right: 0, bottom: 0, cursor: 'pointer', opacity: 0.6 }}>
                <Tooltip title="Refresh Correction">
                    <IconButton size="small" onClick={onRefresh}><RefreshIcon fontSize="small" /></IconButton>
                </Tooltip>
            </div>
          </div>
        )}

        {correctedVersionText && (
          <div className="translated-section korrigierte-version-section">
            <Typography variant="h6" gutterBottom>✅ Korrigierte Version</Typography>
            <Typography variant="body1" sx={{ marginBottom: (englishTranslation || turkishTranslation) ? '12px' : '0' }}>
              {correctedVersionText}
            </Typography>

            {(englishTranslation || turkishTranslation) && (
              <>
                {englishTranslation && <Typography variant="body1"><strong>En:</strong> {englishTranslation}</Typography>}
                {turkishTranslation && <Typography variant="body1"><strong>Tr:</strong> {turkishTranslation}</Typography>}
              </>
            )}
          </div>
        )}

        {corrections.length > 0 && (
          <div className="translated-section fehleranalyse-section">
            <Typography variant="h6" gutterBottom>🟨 Fehleranalyse und Erklärungen</Typography>
            
            {corrections.map((correction, index) => (
              <div key={index} className="correction-block">
                <div className="correction-item">
                  <span className="correction-icon">❌</span>
                  <span className="correction-text">{`"${correction.incorrect}"`}</span>
                </div>
                <div className="correction-item">
                  <span className="correction-icon">✅</span>
                  <span className="correction-text">{`"${correction.correct}"`}</span>
                </div>
                
                {correction.explanations.length > 0 && (
                  <ul className="explanation-list">
                    {correction.explanations.map((exp, expIndex) => (
                      <li key={expIndex} className="explanation-item">{exp}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default CorrectionResultDisplay;
