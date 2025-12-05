import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, CircularProgress, Paper } from '@mui/material';
import { Refresh as RefreshIcon, Image as ImageIcon } from '@mui/icons-material';

interface FlashcardItemProps {
    card: any;
    onRegenerateImage: (id: string, prompt: string) => void;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({ card, onRegenerateImage }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        setIsFlipped(false);
    }, [card.id]);

    if (!card) return <Typography>No card data</Typography>;

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleRegenerateClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        let prompt = "";
        // Prioritize English or top text for image generation prompt based on Android logic
        if (card.back.top && card.back.top !== card.back.bottom) {
            prompt = card.back.top;
        } else if (card.back.bottom) {
            prompt = card.back.bottom;
        } else {
            prompt = card.front.bottom;
        }

        onRegenerateImage(card.id, prompt);
    };

    // FIX: URL processing logic made more robust.
    const getImageSrc = (url: string) => {
        if (!url) return '';
        // Eğer internet adresi (https://), base64 veri (data:) veya yerel kaynak (local-resource:) ise olduğu gibi döndür
        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('local-resource:')) return url;
        // Eğer yerel dosya yoluysa ve başında 'file://' yoksa ekle
        if (!url.startsWith('file://')) {
            return `file://${url}`;
        }
        return url;
    };

    const highlightText = (text: string, highlight: string) => {
        if (!highlight) return text;

        // Clean the highlight word (remove asterisk if present)
        const cleanHighlight = highlight.replace(/^\*\s*/, '').trim();
        if (!cleanHighlight) return text;

        // Escape special regex characters
        const escapedHighlight = cleanHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Create regex for case-insensitive match
        const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));

        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === cleanHighlight.toLowerCase() ? (
                        <span key={i} style={{ borderBottom: '2px solid red', fontWeight: 'bold' }}>{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    const ImageSection = () => (
        <Box sx={{ position: 'relative', width: '100%', flex: 1, my: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f0f0f0', borderRadius: 1, overflow: 'hidden' }}>
            {card.imageIsLoading ? (
                <CircularProgress />
            ) : card.imageUrl ? (
                <img
                    src={getImageSrc(card.imageUrl)}
                    alt="Flashcard"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
                    // Hata durumunda kullanıcıya göstermek için onerror ekleyebiliriz ama şimdilik console log yeterli
                    onError={(e) => console.error("Image load error:", card.imageUrl)}
                />
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary' }}>
                    <ImageIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="caption" component="div">No Image</Typography>
                </Box>
            )}

            <IconButton
                size="small"
                sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.7)' }}
                onClick={handleRegenerateClick}
            >
                <RefreshIcon fontSize="small" />
            </IconButton>
        </Box>
    );

    return (
        <Box
            sx={{
                perspective: '1000px',
                width: '100%',
                height: '100%', // Fill parent container
                cursor: 'pointer',
                position: 'relative'
            }}
            onClick={handleFlip}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.6s',
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* Front Side */}
                <Paper
                    elevation={3}
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between', // Distribute space
                        alignItems: 'center',
                        p: 2, // Increased padding back to 2
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <Typography variant="h6" align="center" component="div" sx={{ fontSize: '1rem', lineHeight: 1.3, mt: 1 }}>
                        {highlightText(card.front.top, card.front.bottom)}
                    </Typography>

                    <ImageSection />

                    <Box sx={{ width: '100%', p: 1, bgcolor: '#e0f7fa', borderRadius: 1, mt: 1 }}>
                        <Typography variant="body1" align="center" color="text.primary" component="div" fontWeight="bold" sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                            {card.front.bottom.replace(/^\*\s*/, '')}
                        </Typography>
                    </Box>
                </Paper>

                {/* Back Side */}
                <Paper
                    elevation={3}
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between', // Distribute space
                        alignItems: 'center',
                        p: 2, // Increased padding back to 2
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <Typography variant="h6" align="center" component="div" sx={{ fontSize: '1rem', lineHeight: 1.3, mt: 1 }}>
                        {card.back.top}
                    </Typography>

                    <ImageSection />

                    <Box sx={{ width: '100%', p: 1, bgcolor: '#f5f5f5', borderRadius: 1, mt: 1 }}>
                        <Typography variant="body1" align="center" color="text.primary" component="div" fontWeight="bold" sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                            {card.back.bottom.replace(/^\*\s*/, '')}
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default FlashcardItem;
