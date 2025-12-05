// src/ui/components/AudioVisualizers.tsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AudioVisualizersProps {
  isClientAudioActive: boolean;
  isServerAudioActive: boolean;
  clientCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  serverCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const AudioVisualizers: React.FC<AudioVisualizersProps> = ({
  isClientAudioActive,
  isServerAudioActive,
  clientCanvasRef,
  serverCanvasRef,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 4, width: '100%', maxWidth: '5xl', mb: 0.25 }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'semibold', color: 'primary.dark' }}>
          🎤 Your Voice
        </Typography>
        <Paper
          elevation={2}
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 80,
            width: '100%',
            borderRadius: 2,
            overflow: 'hidden',
            transition: 'all 0.3s',
            position: 'relative',
            p: 1,
            border: isClientAudioActive ? 2 : 0,
            borderColor: 'primary.main',
          }}
        >
          <canvas ref={clientCanvasRef} style={{ width: '100%', height: '100%' }} />
          {!isClientAudioActive && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Waiting for audio...
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'semibold', color: 'secondary.dark' }}>
          🤖 AI Response
        </Typography>
        <Paper
          elevation={2}
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 80,
            width: '100%',
            borderRadius: 2,
            overflow: 'hidden',
            transition: 'all 0.3s',
            position: 'relative',
            p: 1,
            border: isServerAudioActive ? 2 : 0,
            borderColor: 'secondary.main',
          }}
        >
          <canvas ref={serverCanvasRef} style={{ width: '100%', height: '100%' }} />
          {!isServerAudioActive && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                AI will respond here
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};