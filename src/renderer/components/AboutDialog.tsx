import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Divider } from '@mui/material';

interface AboutDialogProps {
    open: boolean;
    onClose: () => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ open, onClose }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>About ILoveGerman</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">ILoveGerman Version 2.4.2</Typography>
                    <Typography variant="body2" color="text.secondary">Developer: hasankocoglu.de@gmail.com</Typography>
                    <Typography variant="body2" color="text.secondary">Copyright © 2025 All rights reserved</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontStyle: 'italic', fontWeight: 'medium' }}>
                    Greetings to all heroes running tirelessly in the language learning marathon and overcoming obstacles with perseverance!
                </Typography>

                <Typography variant="body1" paragraph>
                    Hello! I am Dr. Hasan Kocoglu. I was working as an Associate Professor of Urology in Turkey. Now I am in Germany trying to improve my German. In my own journey, I experienced firsthand how challenging it is to learn a new language - especially a rich and complex one like German - in a short time and with maximum efficiency. After years of effort, I discovered three key methods to overcome the biggest obstacles in language learning.
                </Typography>

                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>1. The Power of English</Typography>
                <Typography variant="body2" paragraph>
                    Since English belongs to the Germanic language family, it is a known fact that those who already know English have an advantage when learning German. Understanding this connection can significantly speed up the learning process.
                </Typography>

                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>2. AI-Powered Contextual Translation</Typography>
                <Typography variant="body2" paragraph>
                    One of the biggest challenges in language learning is identifying the correct meaning of a word in a specific sentence among countless dictionary definitions! This is where AI-powered translation makes a huge difference. By feeling the sentence, grasping its context, and instantly understanding the most accurate meaning of a word, learning becomes incredibly fluid and efficient.
                </Typography>

                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>3. Effective Repetition and Personalized Flashcards</Typography>
                <Typography variant="body2" paragraph>
                    Frequent repetition of learned words and sentences is essential! However, the key factor here is using flashcards that you create yourself. Flashcards made by others often do not contribute effectively to the learning process.
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body1" paragraph fontWeight="bold">
                    Based on these three basic principles, I developed ILoveGerman!
                </Typography>

                <Typography variant="body1" paragraph>
                    And most importantly! <span style={{ color: '#1976d2', fontWeight: 'bold' }}>ILoveGerman</span> is the first and only program of its kind! I have dedicated my years, effort, and passion to this project. If you find the program useful and would like to support it, please consider making a donation.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary">
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AboutDialog;
