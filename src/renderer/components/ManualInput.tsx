import React, { useState, useRef, useCallback } from 'react';
import { TextField, IconButton, Tooltip, Box, Menu, MenuItem } from '@mui/material';
import { Send as SendIcon, Mic as MicIcon, Stop as StopIcon, ContentPaste as ContentPasteIcon } from '@mui/icons-material';
import { Clipboard } from '@capacitor/clipboard';

interface ManualInputProps {
  onTranslate: (text: string, isCorrection: boolean) => void;
  onToggleRecording: (mode?: 'standard' | 'native' | 'others') => void;
  isRecording: boolean;
  micVolume: number;
  audioMode: 'standard' | 'native' | 'others';
  onAudioModeChange: (mode: 'standard' | 'native' | 'others') => void;
}

const ManualInput: React.FC<ManualInputProps> = ({
  onTranslate,
  onToggleRecording,
  isRecording,
  micVolume,
  audioMode,
  onAudioModeChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Long-press state for correction mode
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const LONG_PRESS_DURATION = 500; // 500ms for long press

  const triggerAction = (isCorrection: boolean) => {
    if (inputValue.trim()) {
      onTranslate(inputValue.trim(), isCorrection);
      setInputValue('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const isCorrection = event.ctrlKey || event.metaKey;
      triggerAction(isCorrection);
    }
  };

  // Long-press handlers for mobile
  const handleTouchStart = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      triggerAction(true); // Trigger correction on long press
    }, LONG_PRESS_DURATION);
  }, [inputValue]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // If it wasn't a long press, treat as normal click (translate)
    if (!isLongPress.current) {
      triggerAction(false);
    }
    isLongPress.current = false;
  }, [inputValue]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    isLongPress.current = false;
  }, []);

  // Desktop click handler (keep ctrl+click for desktop)
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // On touch devices, let touch handlers deal with it
    if (e.detail === 0) return; // Touch event triggers click with detail=0
    const isCorrection = e.ctrlKey || e.metaKey;
    triggerAction(isCorrection);
  };

  // Paste handler using Capacitor Clipboard
  const handlePaste = async () => {
    try {
      const result = await Clipboard.read();
      if (result.value) {
        setInputValue(result.value);
      }
    } catch (err) {
      console.error('Failed to read clipboard via Capacitor:', err);
      // Fallback to web API
      try {
        const text = await navigator.clipboard.readText();
        if (text) setInputValue(text);
      } catch (fallbackErr) {
        console.error('Fallback clipboard read failed:', fallbackErr);
      }
    }
  };

  const handleMicClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isRecording) {
      onToggleRecording();
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAudioCorrectionSelect = () => {
    handleMenuClose();
    onToggleRecording('audio-correction' as any);
  };

  const handleOthersSelect = () => {
    handleMenuClose();
    onToggleRecording('others' as any);
  };

  // Daha güçlü görsel efekt parametreleri (Google AI Studio stiline benzer)

  // 1. Ölçeklendirme (Vibrasyon etkisi): Ses arttıkça buton daha belirgin büyüsün.
  // Taban ölçek 1, ses en yüksekte 1.3'e kadar çıkabilir.
  const scale = isRecording ? 1 + (micVolume * 0.3) : 1;

  // 2. Gölge (Hale etkisi): Ses arttıkça halka genişlesin ve opaklığı değişsin.
  // İki katmanlı gölge ile daha yumuşak bir yayılma elde edebiliriz.
  const shadowBlur = isRecording ? 20 + (micVolume * 40) : 0;
  const shadowSpread = isRecording ? 5 + (micVolume * 10) : 0;

  // Kırmızımsı bir hale rengi
  const shadowColor = `rgba(244, 67, 54, ${isRecording ? 0.4 + (micVolume * 0.4) : 0})`;

  return (
    <Box className="manual-input-wrapper" sx={{ position: 'relative', p: 1, width: '90%', maxWidth: '580px', mx: 'auto', mt: 4 }}>
      <TextField
        fullWidth
        multiline
        minRows={1}
        maxRows={8}
        placeholder="Translate, correct, or use the microphone..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        variant="outlined"
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            paddingRight: '80px', // Space for buttons
            '& fieldset': {
              borderColor: '#e5e6eb',
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
              boxShadow: '0 0 0 3px rgba(22, 93, 255, 0.15)',
            },
          }
        }}
      />
      <Tooltip title={isRecording ? 'Stop Recording' : 'Start Recording'} placement="top">
        <IconButton
          color={isRecording ? 'error' : 'default'}
          onClick={handleMicClick}
          sx={{
            position: 'absolute',
            right: 50,
            top: '50%',
            // Transform ve shadow'u birleştirerek görsel geri bildirim sağlıyoruz
            transform: `translateY(-50%) scale(${scale})`,
            // Daha belirgin ve geniş bir gölge (halo)
            boxShadow: isRecording ? `0 0 ${shadowBlur}px ${shadowSpread}px ${shadowColor}` : 'none',
            zIndex: 5,
            // Geçişleri hızlandırarak sesle senkronize hissi verme (0.08s - 0.1s arası ideal)
            transition: 'transform 0.08s ease-out, box-shadow 0.08s ease-out, background-color 0.2s',
            // Kayıt sırasında arka planı hafif kırmızı yaparak aktifliği vurgula
            backgroundColor: isRecording ? 'rgba(255, 235, 238, 0.8)' : 'transparent',
            border: isRecording ? '1px solid rgba(244, 67, 54, 0.5)' : 'none',
            '&:hover': {
              backgroundColor: isRecording ? 'rgba(255, 205, 210, 1)' : 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Translate (Tap) or Correct Grammar (Long Press)" placement="top">
        <span>
          <IconButton
            color="primary"
            onClick={handleButtonClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            disabled={!inputValue.trim()}
            sx={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 5,
            }}
          >
            <SendIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Paste from Clipboard" placement="top">
        <IconButton
          onClick={handlePaste}
          sx={{
            position: 'absolute',
            right: 90,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 5,
            color: '#888',
            '&:hover': { color: 'primary.main' }
          }}
        >
          <ContentPasteIcon />
        </IconButton>
      </Tooltip>



      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem onClick={handleAudioCorrectionSelect}>Audio Correction with Live API</MenuItem>
        <MenuItem onClick={handleOthersSelect}>Audio Correction with Normal API</MenuItem>
      </Menu>
    </Box>
  );
};

export default ManualInput;
