import React from 'react';
import { TranslatorUI } from '@/ui/components/TranslatorUI';
import '@/ui/App.css'; // Import styles

export const FastTranslateWrapper: React.FC = () => {
    // We don't need onKeySubmit anymore as it's managed by the main app
    const handleKeySubmit = (key: string) => {
        console.warn('Manual key submission is disabled in Fast Translate mode.');
    };

    return (
        <div className="fast-translate-container" style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
            <TranslatorUI onKeySubmit={handleKeySubmit} />
        </div>
    );
};

export default FastTranslateWrapper;
