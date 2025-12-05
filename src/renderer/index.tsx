import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import './i18n';
import theme from './theme';
import { ToastProvider } from './contexts/ToastContext';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <ToastProvider>
      <App />
    </ToastProvider>
  </ThemeProvider>
);
