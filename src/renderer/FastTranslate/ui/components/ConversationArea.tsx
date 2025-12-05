// src/ui/components/ConversationArea.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

interface ConversationItem {
  id: string;
  role: 'user' | 'assistant';
  transcript: string;
  audioData?: Int16Array;
}

interface ConversationAreaProps {
  items: ConversationItem[];
  conversationContentRef: React.RefObject<HTMLDivElement | null>;
  createAudioUrl?: (audioData: Int16Array) => string;
  liveAssistantText?: string;
}

export const ConversationArea: React.FC<ConversationAreaProps> = ({
  items,
  conversationContentRef,
  createAudioUrl,
  liveAssistantText,
}) => {
  const surfaceBg = '#f4f6fb';
  const filteredItems = items.filter(item => item.role === 'assistant');
  const liveText = liveAssistantText?.trim();
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const previousLiveTextRef = useRef('');
  const highlightTimeoutRef = useRef<number | null>(null);

  const liveWords = useMemo(() => (liveText ? liveText.split(/\s+/) : []), [liveText]);

  useEffect(() => {
    if (!liveText) {
      previousLiveTextRef.current = '';
      setHighlightIndex(null);
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
      return;
    }

    if (liveText.length > previousLiveTextRef.current.length && liveWords.length > 0) {
      const newIndex = liveWords.length - 1;
      setHighlightIndex(newIndex);
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightIndex(null);
        highlightTimeoutRef.current = null;
      }, 1000);
    }

    previousLiveTextRef.current = liveText;

    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
    };
  }, [liveText, liveWords.length]);

  const shouldRenderPanel = filteredItems.length > 0 || !!liveText;

  if (!shouldRenderPanel) {
    return <Box sx={{ flexGrow: 1 }} />;
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '4xl',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        px: '1px',
        mt: '2px',
        mb: 0,
      }}
    >
      <Box
        ref={conversationContentRef}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {liveText && (
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-start',
              mb: 0.5,
              p: 1.5,
              borderRadius: 2,
              maxWidth: '100%',
              transition: 'all 0.3s',
              bgcolor: surfaceBg,
              color: 'text.primary',
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
              {liveWords.map((word, index) => (
                <Typography
                  component="span"
                  key={`${word}-${index}`}
                  sx={{
                    fontWeight: index === highlightIndex ? 800 : 500,
                    fontSize: index === highlightIndex ? '1rem' : '0.875rem',
                    lineHeight: 1.6,
                    transition: 'all 0.25s ease',
                    animation: index === highlightIndex ? 'pulseWord 0.8s ease' : 'none',
                    '@keyframes pulseWord': {
                      from: { transform: 'scale(1.18)' },
                      to: { transform: 'scale(1)' },
                    },
                  }}
                >
                  {word}
                </Typography>
              ))}
            </Box>
            <Typography variant="caption" sx={{ ml: 1, opacity: 0.8 }}>
              Live
            </Typography>
          </Box>
        )}
        {filteredItems.map((item) => (
          <Box
            key={item.id}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              mb: 0.5,
              p: 1.5,
              borderRadius: 2,
              maxWidth: '100%',
              transition: 'all 0.3s',
              bgcolor: surfaceBg,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography sx={{ flexGrow: 1, overflowWrap: 'break-word', color: 'text.primary', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {item.transcript}
            </Typography>

            {item.audioData && createAudioUrl && (
              <audio controls src={createAudioUrl(item.audioData)} style={{ width: '100%', maxWidth: 400, height: 35, marginTop: 10 }} />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};