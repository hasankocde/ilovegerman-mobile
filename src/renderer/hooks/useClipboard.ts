import { useState, useCallback } from 'react';

export const useClipboard = () => {
    const [clipboardText, setClipboardText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const readClipboard = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            setClipboardText(text);
            setError(null);
            return text;
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            setError('Failed to read clipboard. Please grant permission.');
            return null;
        }
    }, []);

    const writeClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setError(null);
        } catch (err) {
            console.error('Failed to write to clipboard:', err);
            setError('Failed to write to clipboard.');
        }
    }, []);

    return { clipboardText, readClipboard, writeClipboard, error };
};
