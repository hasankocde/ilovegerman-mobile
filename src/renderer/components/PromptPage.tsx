import React, { useState, useEffect } from 'react';
import { Button, TextField, Tabs, Tab, Box, Radio, RadioGroup, FormControlLabel, IconButton, Typography, Paper } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useToast } from '../contexts/ToastContext';
import { webStore } from '../services/WebIntegration';
import { v4 as uuidv4 } from 'uuid';

interface Prompt { id: string; text: string; isDefault: boolean; }

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`prompt-tabpanel-${index}`}
            aria-labelledby={`prompt-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const PromptTabContent: React.FC<{ type: 'text' | 'audio' | 'correction' }> = ({ type }) => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
    const [newPromptText, setNewPromptText] = useState('');
    const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const { showToast } = useToast();

    const getStoreKeys = (t: 'text' | 'audio' | 'correction') => {
        switch (t) {
            case 'audio':
                return {
                    list: 'custom-audio-prompts',
                    selected: 'selected-audio-prompt-id'
                };
            case 'correction':
                return {
                    list: 'custom-correction-prompts',
                    selected: 'selected-correction-prompt-id'
                };
            case 'text':
            default:
                return {
                    list: 'custom-prompts',
                    selected: 'selected-prompt-id'
                };
        }
    };

    const storeKeys = getStoreKeys(type);

    // Default Prompts (Copied from reference config.ts and prompt-generator.ts)
    const defaultPrompt = `I want you to act as an exceptionally meticulous and consistent German language analyst for learners. Your analysis must be flawless and always adhere to the same output format, regardless of whether the input is a single word or a full sentence.

**--- CRITICAL: Consistent Output Format ---**
You MUST ALWAYS use the full analysis format for your output. The format must contain these sections in this order: \`Source:\`, \`En:\`, \`YL:\`, \`Word Meanings:\`, \`Verb Infinitives:\`, \`Articles (der, die, das):\`.

---
**Core Instructions (for all inputs):**

1.  **Word Meanings Section (NEW CRITICAL RULE):**
    *   **This is the most important rule.** You MUST provide a granular, word-by-word (or very small phrase) breakdown. Your goal is to list almost every word from the source text on its own line. Do NOT group words into large "meaningful chunks".
    *   The translation for each German word or small phrase MUST be its direct equivalent from the context of the full sentence's English and Your Language translation. For example, if the source has 'erklären' and the YL translation is 'açıklarken', you MUST use 'açıklarken' as the translation, not the infinitive 'açıklamak'.
    *   For separable verbs, list only the verb components separated by an ellipsis (e.g., \`hören...zu\`, \`sammeln...ein\`). Their translation should also be the conjugated form from the main sentence translation (e.g., 'dinliyorlar', 'toplar').
    *   Prepositional Verbs (Verben mit Präpositionen): This is a critical exception to the "word-by-word"  rule. You MUST group the verb with its fixed preposition to capture its specific meaning.
    *   If they appear together, list them as one unit: warten auf, sich ärgern über.
    *   If they are separated (e.g., in a subordinate clause or with a separable prefix), use an ellipsis: denken...nach über, freuen sich...auf.
    *   The translation must reflect the combined, idiomatic meaning (e.g., warten auf -> 'bekliyor', not 'bekliyor üzerinde').
    *   Each entry must be on a new line.

2.  **Verb Infinitives Section (ABSOLUTELY CRITICAL):**
    *   Identify **EVERY** verb in the source text, regardless of its type (simple, separable, reflexive).
    *   For **EACH** verb, create a new line in this section.
    *   Each line MUST follow this exact format: \`infinitive (from "original form"): translation\`.
    *   **Original Form:** The exact form as it appears in the source text (e.g., \`"hören zu"\`, \`"freuen sich"\`, \`"sammeln ein"\`, \`"fahren zurück"\`).

3.  **Articles (der, die, das) Section (CRITICAL):**
    *   List EVERY SINGLE NOUN with its nominative singular article (\`der\`, \`die\`, \`das\`).
    *   Each line MUST follow the exact format: \`article baseForm (from "originalForm"): translation\`. For example, \`das Kind (from "Kinder"): Child – [Child in YL]\`.

---
**Examples to Demonstrate the CRITICAL Rules:**

**--- EXAMPLE 1: Full Breakdown ---**
Source Text: "Die Gruppen machen sich auf den Weg und denken über die bevorstehenden Experimente nach."
*Expected Output:*
Source: Die Gruppen machen sich auf den Weg und denken über die bevorstehenden Experimente nach.
En: The groups set off and think about the upcoming experiments.
YL: Gruplar yola koyulur ve yaklaşan deneyler hakkında düşünürler.
Word Meanings:
Die Gruppen: The groups - Gruplar
machen sich auf den Weg: set off - yola koyulur
und: and - ve
denken...nach über: think about - hakkında düşünürler
die bevorstehenden: the upcoming - yaklaşan
Experimente:  experiments - deneyler
Verb Infinitives:
sich auf den Weg machen (from "machen sich auf den Weg"): to set off - yola koyulmak
nachdenken über (from "denken...nach über"): to think about - hakkında düşünmek
Articles (der, die, das):
die Gruppe (from "Gruppen"): Group - Grup
der Weg (from "Weg"): Way, path - Yol
das Experiment (from "Experimente"): Experiment - Deney

---
Now, using this consistent and complete formatting logic, analyze the text I provide.

* Your Language (YL): "Turkish" *`;

    const defaultAudioPrompt = `You are an expert German language teacher and analyst. The transcribed text you are about to process comes from a non-native German speaker with limited proficiency. The text may contain grammatical errors, spelling mistakes, and phrases in English or Turkish.

Your task is to provide a comprehensive, multi-part analysis.

*** CRITICAL: OUTPUT FORMAT ***
Your entire response MUST strictly follow this Markdown format. Do not add any introductory or concluding text.

**1. Verbatim Transcription:**
*   [The AI will place the raw, verbatim transcription of the audio here, as per system instructions.]

**2. Corrected and Meaningful German Text:**
*   [Provide the fully corrected, natural-sounding German version of the text here. Translate any English/Turkish phrases into appropriate German. If the topic is medical, use correct German medical terminology.]

**3. English and Turkish Translation:**
*   **En:** [Provide the English translation of the CORRECTED German text here.]
*   **Tr:** [Provide the Turkish translation of the CORRECTED German text here.]

**4. Hata Analizi ve Açıklamalar:**
*   [Analyze every significant error from the original transcription. For each error, provide the following structure on new lines:]

    *   **Hata:** "[The original incorrect phrase from the transcription]"
    *   **Correction:** "[The corrected German phrase]"
    *   **Explanation:** [Provide a clear, concise explanation **in TURKISH**. Provide a clear and concise explanation in **Turkish** about the grammar rule, word choice, or structural correction made.]`;

    const defaultCorrectionPrompt = `
You are an expert German language teacher and proofreader. Your task is to analyze the user's German text, which may contain grammatical errors, spelling mistakes, and expressions from other languages (like English or Turkish). You must provide a response in a consistent, structured format without any extra conversation.

*** CRITICAL: OUTPUT FORMAT ***
Your entire response MUST strictly follow this Markdown format. Do not add any introductory or concluding text.

1.  **Corrected Version (✅):** Start with the emoji "✅" followed by "**Korrigierte Version:**". Then provide the fully corrected, natural-sounding German version of the text.
    - **Immediately after this line, you MUST provide the English and Turkish translations of the corrected sentence.** These translations must be on new, separate lines, prefixed with \`En:\` and \`Tr:\` respectively.
2.  **Error Analysis (🟨):** Start with the emoji "🟨" followed by "**Fehleranalyse und Erklärungen:**". Below this, for each significant error from the original text:
    *   Start a new line with the "❌" emoji, followed by the incorrect phrase in quotes.
    *   On the very next line, start with the "✅" emoji, followed by the correct phrase in quotes.
    *   Immediately following the corrected phrase, provide a brief explanation of the correction using Markdown bullet points. Each explanation point MUST be a separate line starting with a hyphen '-' and a space. Do not add any characters, letters, or empty lines between the corrected phrase line and the first bullet point explanation.

*** COMPLETE EXAMPLE OF EXPECTED BEHAVIOR ***

User's Text: "frühen morgen stehen der Schülerinnen und Schüler aus obwohl sie sich nur ungern aus des Betts erheben. Nach dem sie sich anziehen haben, machen sie sich aus dem Weg zum Schule. Viele nehmen ihre Tasschen, Jacken und Bücher , während einigen vergessen, ihr Hausaufgaben einzupacken. In die Schule bereiten die Lehrerin und Lehrers verschiedenen Übungen und Ausgaben , den Unterricht spannend zum gestalten. Während die Pausen unterhalten mich die Jugendliche miteinander beschweren sich manchmal auf die vielen Test und freuen uns über die Wochenende. Nachdem Unterrichts ruft vielen ihrem Eltern auf, damit sagen das Sie jetzzt nach zu Häuse gekommen. Einiges setzen dich an dem Bus, andere gesteigen aus ihrer Fahrräder an. Zu hause entspannen mich die Kindern, ziehen sich bequemem Kleidungen auf und fangtst an, zu das nächster Prüfungen zur lernen."

*Expected Output:*
✅ **Korrigierte Version:**
Am frühen Morgen stehen die Schülerinnen und Schüler auf, obwohl sie sich nur ungern aus dem Bett erheben. Nachdem sie sich angezogen haben, machen sie sich auf den Weg zur Schule. Viele nehmen ihre Taschen, Jacken und Bücher mit, während einige vergessen, ihre Hausaufgaben einzupacken. In der Schule bereiten die Lehrerinnen und Lehrer verschiedene Übungen und Aufgaben vor, um den Unterricht spannend zu gestalten. Während der Pausen unterhalten sich die Jugendlichen miteinander, beschweren sich manchmal über die vielen Tests und freuen sich auf das Wochenende. Nach dem Unterricht rufen viele ihre Eltern an, um zu sagen, dass sie jetzt nach Hause gekommen sind. Einige setzen sich in den Bus, andere steigen auf ihre Fahrräder. Zuhause entspannen sich die Kinder, ziehen sich bequeme Kleidung an und fangen an, für die nächsten Prüfungen zu lernen.
En: In the early morning, the male and female students get up, although they reluctantly get out of bed. After they have gotten dressed, they make their way to school. Many take their bags, jackets, and books with them, while some forget to pack their homework. At school, the male and female teachers prepare various exercises and tasks to make the lessons exciting. During the breaks, the young people talk to each other, sometimes complain about the many tests, and look forward to the weekend. After class, many call their parents to say that they have now come home. Some get on the bus, others get on their bikes. At home, the children relax, put on comfortable clothes, and start studying for the next exams.
Tr: Sabahın erken saatlerinde, kız ve erkek öğrenciler, yataktan isteksizce kalkmalarına rağmen ayağa kalkarlar. Giyindikten sonra okula doğru yola çıkarlar. Birçoğu çantalarını, ceketlerini ve kitaplarını yanlarına alırken, bazıları ödevlerini toplamayı unutur. Okulda, kadın ve erkek öğretmenler dersi heyecanlı hale getirmek için çeşitli alıştırmalar ve görevler hazırlarlar. Teneffüslerde gençler birbirleriyle sohbet eder, bazen birçok sınavdan şikayet eder ve hafta sonunu dört gözle beklerler. Dersten sonra birçoğu, şimdi eve geldiklerini söylemek için ebeveynlerini arar. Bazıları otobüse biner, diğerleri bisikletlerine biner. Evde çocuklar rahatlar, rahat kıyafetler giyer ve bir sonraki sınavlar için çalışmaya başlarlar.

🟨 **Fehleranalyse und Erklärungen:**
❌ "frühen morgen stehen ... aus obwohl"
✅ "Am frühen Morgen stehen ... auf, obwohl"
- Zaman belirten ifadelerde genellikle "am" (an + dem) kullanılır: "am Morgen".
- "aufstehen" ayrılabilir bir fiildir, bu nedenle "auf" cümlenin sonuna gelir.
- "obwohl" ile başlayan yan cümleden önce virgül konulmalıdır.

❌ "aus des Betts"
✅ "aus dem Bett"
- "das Bett" nötr bir isimdir. "aus" edatı Dativ gerektirdiği için "dem Bett" olmalıdır.

❌ "Nach dem sie sich anziehen haben"
✅ "Nachdem sie sich angezogen haben"
- Geçmişte tamamlanmış bir eylemi belirten yan cümlelerde "Nachdem" bağlacı kullanılır.
- Perfekt zamanda "anziehen" fiilinin Partizip II hali "angezogen" şeklindedir.

❌ "aus dem Weg zum Schule"
✅ "auf den Weg zur Schule"
- "yola çıkmak" anlamındaki kalıp ifade "sich auf den Weg machen" şeklindedir (Akkusativ).
- "die Schule" feminen bir isimdir. "zu" edatı Dativ gerektirdiği için "zu der Schule" -> "zur Schule" olur.

❌ "Tasschen, Jacken und Bücher ,"
✅ "Taschen, Jacken und Bücher mit,"
- "Tasschen" kelimesinin doğru yazılışı "Taschen" şeklindedir.
- "mitnehmen" (yanına almak) ayrılabilir bir fiildir, bu nedenle "mit" cümlenin sonuna (yan cümleden önceye) eklenmelidir.

❌ "während einigen vergessen, ihr Hausaufgaben"
✅ "während einige vergessen, ihre Hausaufgaben"
- "einige" belgisiz zamiri burada yalın halde (Nominativ) kullanılır.
- "Hausaufgaben" (çoğul) ile birlikte iyelik zamiri "ihre" şeklinde çekimlenir.

❌ "In die Schule bereiten die Lehrerin und Lehrers ... Ausgaben , den Unterricht ... zum gestalten"
✅ "In der Schule bereiten die Lehrerinnen und Lehrer ... Aufgaben vor, um den Unterricht ... zu gestalten"
- "Nerede?" sorusuna cevap verildiği için "in" edatı Dativ gerektirir: "in der Schule".
- Çoğul isimlerin doğru hali "Lehrerinnen" ve "Lehrer" şeklindedir.
- "ödev" anlamındaki kelime "Aufgaben"dır. "Ausgaben" harcamalar demektir.
- "vorbereiten" (hazırlamak) ayrılabilir bir fiildir, "vor" cümlenin sonuna gelir.
- Bir amacı belirtmek için "um ... zu + Infinitiv" yapısı kullanılır: "um ... zu gestalten".

❌ "Während die Pausen"
✅ "Während der Pausen"
- "während" edatı Genitiv (tamlayan hali) gerektirir.

❌ "unterhalten mich die Jugendliche"
✅ "unterhalten sich die Jugendlichen"
- Fiilin dönüşlü hali "sich unterhalten"dır. Özne "die Jugendlichen" olduğu için dönüşlülük zamiri "sich" olmalıdır.
- "Jugendliche" ismi burada çoğul olduğu için "die Jugendlichen" şeklinde çekimlenir.

❌ "beschweren sich manchmal auf die vielen Test"
✅ "beschweren sich manchmal über die vielen Tests"
- Bir şey "hakkında" şikayet etmek için "sich über etwas beschweren" (Akkusativ) kullanılır.
- "Test" isminin çoğul hali "Tests"dir.

❌ "freuen uns über die Wochenende"
✅ "freuen sich auf das Wochenende"
- Özne "die Jugendlichen" (onlar) olduğu için dönüşlülük zamiri "sich" olmalıdır ("wir" için "uns" kullanılır).
- Gelecekteki bir şey için sevinmek "sich auf etwas freuen" ile ifade edilir.

❌ "Nachdem Unterrichts ruft vielen ihrem Eltern auf"
✅ "Nach dem Unterricht rufen viele ihre Eltern an"
- Burada bağlaç olan "Nachdem" yerine, edat olan "Nach dem" (dersten sonra) kullanılmalıdır.
- Özne "viele" (çoğul) olduğu için fiil "rufen" şeklinde çekimlenir.
- "die Eltern" (çoğul) ile iyelik zamiri "ihre" olmalıdır.
- "anrufen" (telefonla aramak) ayrılabilir bir fiildir, "an" sona gelir.

❌ "damit sagen das Sie jetzzt nach zu Häuse gekommen"
✅ "um zu sagen, dass sie jetzt nach Hause gekommen sind"
- Amaç bildiren "um ... zu" yapısı daha doğrudur. Yan cümleden önce virgül gerekir.
- Bağlaç "dass" olmalıdır. "Sie" (resmi) yerine "sie" (onlar) kullanılır. "jetzt" doğru yazılıştır.
- "nach Hause" kalıp ifadedir. "gekommen sind" Perfekt zamanın doğru halidir (yardımcı fiil eksik).

❌ "Einiges setzen dich an dem Bus"
✅ "Einige setzen sich in den Bus"
- "Bazıları" anlamında insanlar için çoğul "Einige" kullanılır. "Einiges" (bazı şeyler) yanlıştır.
- Fiil dönüşlüdür: "sich setzen". Zamir "dich" yerine "sich" olmalıdır.
- Yönelme belirtilirken "in den Bus" (Akkusativ) kullanılır.

❌ "andere gesteigen aus ihrer Fahrräder an"
✅ "andere steigen auf ihre Fahrräder"
- "steigen" fiilinin kökünde "ge-" yoktur.
- Bisiklete "binmek" anlamında "auf etwas steigen" kullanılır.
- "ansteigen" (yükselmek, artmak) fiili burada anlamsızdır.

❌ "Zu hause entspannen mich die Kindern"
✅ "Zuhause entspannen sich die Kinder"
- "Zuhause" kelimesi bitişik yazılır.
- Fiil dönüşlüdür: "sich entspannen". "mich" yerine "sich" gelmelidir.
- "Kinder" zaten çoğuldur, Dativ eki "-n" almaz.

❌ "ziehen sich bequemem Kleidungen auf"
✅ "ziehen sich bequeme Kleidung an"
- "Kleidung" sayılamayan bir isimdir, genellikle tekil kullanılır.
- Sıfat çekimi Akkusativ için "bequeme" olmalıdır.
- "anziehen" fiilinin ayrılabilir parçası "an"dır, "auf" değil.

❌ "fangtst an, zu das nächster Prüfungen zur lernen"
✅ "fangen an, für die nächsten Prüfungen zu lernen"
- Özne "die Kinder" (onlar) olduğu için fiil "fangen" şeklinde çekimlenir.
- Bir amaç için öğrenmek "für etwas lernen" ile ifade edilir.
- "für" Akkusativ gerektirir: "für die nächsten Prüfungen".
- Mastar hali "zu lernen" doğrudur, "zur lernen" değil.

---
Now, analyze the text I provide and generate the response in this exact format:
`;

    const fetchPrompts = () => {
        const customPrompts: string[] = webStore.get(storeKeys.list) || [];

        let defaultPromptText = '';
        let defaultPromptId = '';

        if (type === 'text') {
            defaultPromptText = defaultPrompt;
            defaultPromptId = 'default';
        } else if (type === 'audio') {
            defaultPromptText = defaultAudioPrompt;
            defaultPromptId = 'default-audio';
        } else if (type === 'correction') {
            defaultPromptText = defaultCorrectionPrompt;
            defaultPromptId = 'default-correction';
        }

        const allPrompts: Prompt[] = [
            { id: defaultPromptId, text: defaultPromptText, isDefault: true },
            ...customPrompts.map((text, index) => ({ id: `custom-${index}`, text, isDefault: false }))
        ];

        setPrompts(allPrompts);

        const selectedId = webStore.get(storeKeys.selected);
        setSelectedPromptId(selectedId || null);
    };

    useEffect(() => {
        fetchPrompts();
    }, [type]);

    const handleAction = (action: 'add' | 'edit' | 'delete', ...args: any[]) => {
        try {
            const currentPrompts: string[] = webStore.get(storeKeys.list) || [];
            let newPrompts = [...currentPrompts];

            if (action === 'add') {
                const text = args[0];
                newPrompts.push(text);
            } else if (action === 'edit') {
                const id = args[0]; // custom-INDEX
                const text = args[1];
                const index = parseInt(id.split('-')[1]);
                if (index >= 0 && index < newPrompts.length) {
                    newPrompts[index] = text;
                }
            } else if (action === 'delete') {
                const id = args[0]; // custom-INDEX
                const index = parseInt(id.split('-')[1]);
                if (index >= 0 && index < newPrompts.length) {
                    newPrompts.splice(index, 1);
                }
            }

            webStore.set(storeKeys.list, newPrompts);
            fetchPrompts();
            setNewPromptText('');
            setEditingPromptId(null);
        } catch (error: any) {
            showToast(error.message || 'Action failed', 'error');
        }
    };

    const handleSelectPrompt = (id: string) => {
        setSelectedPromptId(id);
        webStore.set(storeKeys.selected, id);
    };

    const handlePromptClick = (prompt: Prompt) => {
        // Populate the "Add New Prompt" field with cleaned text
        // Remove backticks and trim extra whitespace
        const text = String(prompt.text || '');
        const cleanText = text.replace(/`/g, '').trim();
        setNewPromptText(cleanText);

        // Also copy to clipboard as a convenience
        navigator.clipboard.writeText(cleanText).then(() => {
            showToast('Prompt copied to clipboard and added to "Add New Prompt" section.', 'success');
        }).catch(() => {
            // Ignore clipboard errors, just populate field
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {prompts.map(prompt => (
                    <Box
                        key={prompt.id}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: selectedPromptId === prompt.id ? 'action.selected' : 'transparent',
                            border: '1px solid',
                            borderColor: selectedPromptId === prompt.id ? 'primary.main' : 'divider',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => handleSelectPrompt(prompt.id)}
                    >
                        {/* Custom Radio Button */}
                        <Box
                            sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                border: '2px solid',
                                borderColor: selectedPromptId === prompt.id ? 'primary.main' : 'text.secondary',
                                mr: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}
                        >
                            {selectedPromptId === prompt.id && (
                                <Box
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                    }}
                                />
                            )}
                        </Box>

                        <Box sx={{ flexGrow: 1 }} onClick={(e) => { e.stopPropagation(); handlePromptClick(prompt); }}>
                            <Typography variant="body2">
                                {/* Display first 7-8 words */}
                                {String(prompt.text || '').split(/\s+/).slice(0, 8).join(' ')}...
                                {prompt.isDefault && <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1, fontWeight: 'bold' }}> (Default)</Typography>}
                            </Typography>
                        </Box>

                        {!prompt.isDefault && editingPromptId !== prompt.id && (
                            <Box sx={{ flexShrink: 0 }}>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingPromptId(prompt.id); setEditText(String(prompt.text || '')); }}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleAction('delete', prompt.id); }}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}
                    </Box>
                ))}
            </Box>

            {editingPromptId && (
                <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={6}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        label="Edit Prompt"
                        variant="outlined"
                        size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" size="small" onClick={() => handleAction('edit', editingPromptId, editText)}>Save</Button>
                        <Button variant="outlined" size="small" onClick={() => setEditingPromptId(null)}>Cancel</Button>
                    </Box>
                </Box>
            )}

            <Typography variant="subtitle1" sx={{ mt: 3 }}>Add New Prompt</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'flex-end' }}>
                <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={6}
                    placeholder="Enter new prompt..."
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    variant="outlined"
                    size="small"
                />
                <Button
                    variant="contained"
                    onClick={() => handleAction('add', newPromptText)}
                    disabled={!newPromptText.trim()}
                >
                    Add
                </Button>
            </Box>
        </Box>
    );
};

const PromptPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'transparent' }}>
                <Typography variant="h5" component="h2">
                    Manage Prompts
                </Typography>
            </Paper>

            <Paper elevation={1}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="Text Prompts" />
                        <Tab label="Audio Prompts" />
                        <Tab label="Correction Prompts" />
                    </Tabs>
                </Box>
                <TabPanel value={tabValue} index={0}>
                    <PromptTabContent type="text" />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <PromptTabContent type="audio" />
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                    <PromptTabContent type="correction" />
                </TabPanel>
            </Paper>
        </Box>
    );
};

export default PromptPage;
