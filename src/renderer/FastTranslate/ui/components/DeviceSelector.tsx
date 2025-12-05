// src/ui/components/DeviceSelector.tsx
import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Paper } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

interface DeviceSelectorProps {
  availableDevices: MediaDeviceInfo[];
  selectedInputDevice: string;
  selectedOutputDevice: string;
  inputMode: 'mic' | 'system';
  onInputDeviceChange: (deviceId: string) => void;
  onOutputDeviceChange: (deviceId: string) => void;
  onInputModeChange: (mode: 'mic' | 'system') => void;
  isConnected: boolean;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  availableDevices,
  selectedInputDevice,
  selectedOutputDevice,
  inputMode,
  onInputDeviceChange,
  onOutputDeviceChange,
  onInputModeChange,
  isConnected,
}) => {

  const inputDevices = availableDevices.filter(d => d.kind === 'audioinput');
  const outputDevices = availableDevices.filter(d => d.kind === 'audiooutput');

  const handleInputChange = (event: SelectChangeEvent<string>) => {
    onInputDeviceChange(event.target.value);
  };

  const handleOutputChange = (event: SelectChangeEvent<string>) => {
    onOutputDeviceChange(event.target.value);
  };

  const handleModeChange = (event: SelectChangeEvent<string>) => {
    onInputModeChange(event.target.value as 'mic' | 'system');
  };

  return (
    <Paper elevation={0} sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
        <FormControl variant="outlined" sx={{ minWidth: 200, flex: 1 }} disabled={isConnected}>
          <InputLabel id="input-mode-label">Input Source</InputLabel>
          <Select
            labelId="input-mode-label"
            value={inputMode}
            onChange={handleModeChange}
            label="Input Source"
          >
            <MenuItem value="mic">Microphone</MenuItem>
            <MenuItem value="system">System / Zoom Audio</MenuItem>
          </Select>
        </FormControl>

        <FormControl variant="outlined" sx={{ minWidth: 200, flex: 1 }} disabled={isConnected || inputMode === 'system'}>
          <InputLabel id="input-device-label">Input Device (Microphone)</InputLabel>
          <Select
            labelId="input-device-label"
            value={selectedInputDevice}
            onChange={handleInputChange}
            label="Input Device (Microphone)"
          >
            {inputDevices.map((device) => (
              <MenuItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.substring(0, 8)}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" sx={{ minWidth: 200, flex: 1 }} disabled={isConnected}>
          <InputLabel id="output-device-label">Output Device (Speaker)</InputLabel>
          <Select
            labelId="output-device-label"
            value={selectedOutputDevice}
            onChange={handleOutputChange}
            label="Output Device (Speaker)"
          >
            {outputDevices.map((device) => (
              <MenuItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Output ${device.deviceId.substring(0, 8)}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
};