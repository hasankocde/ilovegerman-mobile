// src/ui/App.tsx
import { useState } from 'react';
import { TranslatorUI } from './components/TranslatorUI';

function App() {
  const [apiKey, setApiKey] = useState<string | null>(() => {
    try {
      return localStorage.getItem('gemini_api_key');
    } catch {
      return null;
    }
  });

  const handleKeySubmit = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
  };

  return <TranslatorUI onKeySubmit={handleKeySubmit} />;
}

export default App;