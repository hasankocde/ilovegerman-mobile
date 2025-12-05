import { GoogleGenerativeAI } from '@google/generative-ai';
import { webStore } from './WebIntegration';

export class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;

    private getApiKey(): string | null {
        // 1. Try to get the list of keys
        const keys: string[] = webStore.get('gemini-api-keys') || [];

        // 2. Fallback to single key if list is empty
        if (!keys || keys.length === 0) {
            return webStore.get('gemini-api-key');
        }

        // 3. Get current index
        let currentIndex = webStore.get('gemini-key-index') || 0;

        // 4. Validate index
        if (currentIndex >= keys.length) {
            currentIndex = 0;
        }

        const keyToUse = keys[currentIndex];

        // 5. Rotate for NEXT time (so next call uses next key)
        let nextIndex = currentIndex + 1;
        if (nextIndex >= keys.length) {
            nextIndex = 0;
        }
        webStore.set('gemini-key-index', nextIndex);

        console.log(`[GeminiService] Rotating Key. Used index: ${currentIndex}. Next index: ${nextIndex}`);
        return keyToUse;
    }

    private getGroqApiKey(): string | null {
        return webStore.get('groq-api-key');
    }

    private init() {
        const apiKey = this.getApiKey();
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        } else {
            this.genAI = null;
        }
    }

    private async callGroqApi(prompt: string, model: string): Promise<string> {
        const apiKey = this.getGroqApiKey();
        if (!apiKey) {
            throw new Error('Groq API Key not found. Please set it in Settings.');
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: model,
                temperature: 0.1 // Low temperature for consistent analysis
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Groq API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }

    async translate(text: string, targetLanguage: string = 'Turkish'): Promise<{ status: string; message: string }> {
        const groqModel = webStore.get('groq-model');
        const geminiModel = webStore.get('gemini-model');

        const targetLangLabel = targetLanguage === 'Turkish' ? 'Tr' : 'YL';
        const prompt = `I want you to act as an exceptionally meticulous and consistent German language analyst for learners. Your analysis must be flawless and always adhere to the same output format, regardless of whether the input is a single word or a full sentence.

**--- CRITICAL: Consistent Output Format ---**
You MUST ALWAYS use the full analysis format for your output. The format must contain these sections in this order: \`Source:\`, \`En:\`, \`${targetLangLabel}:\`, \`Word Meanings:\`, \`Verb Infinitives:\`, \`Articles (der, die, das):\`.

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
${targetLangLabel}: Gruplar yola koyulur ve yaklaşan deneyler hakkında düşünürler.
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

* Your Language (YL): "${targetLanguage}" *

Text: ${text}
            `;

        try {
            // Check for Groq Model first
            if (groqModel) {
                const message = await this.callGroqApi(prompt, groqModel);
                return { status: 'success', message };
            }

            // Fallback to Gemini
            this.init(); // Re-init to get a fresh key
            if (!this.genAI) {
                return { status: 'error', message: 'Gemini API Key not found. Please set it in Settings.' };
            }

            const model = this.genAI.getGenerativeModel({ model: geminiModel || 'gemini-pro' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const translation = response.text();

            return { status: 'success', message: translation };
        } catch (error: any) {
            console.error('Translation Error:', error);
            return { status: 'error', message: error.message || 'Translation failed.' };
        }
    }

    async correctText(prompt: string): Promise<{ status: string; message: string }> {
        const groqModel = webStore.get('groq-model');
        const geminiModel = webStore.get('gemini-model');

        try {
            if (groqModel) {
                const message = await this.callGroqApi(prompt, groqModel);
                return { status: 'success', message };
            }

            this.init();
            if (!this.genAI) {
                return { status: 'error', message: 'Gemini API Key not found.' };
            }

            const model = this.genAI.getGenerativeModel({ model: geminiModel || 'gemini-pro' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return { status: 'success', message: response.text() };
        } catch (error: any) {
            console.error("Correction Error:", error);
            return { status: 'error', message: error.message || "Correction failed." };
        }
    }

    async conjugateVerb(verb: string): Promise<{ status: string; message: string }> {
        const groqModel = webStore.get('groq-model');
        const geminiModel = webStore.get('gemini-model');

        const prompt = `Generate a comprehensive German verb conjugation table for the verb \`${verb}\`. The entire output MUST be a single block of Markdown text.

**CRITICAL FORMATTING RULES:**
1.  **Main Sections:** Use Markdown H3 headings (e.g., \`### INDIKATIV\`) for major moods: \`INDIKATIV\`, \`KONJUNKTIV\`, \`IMPERATIV\`, and \`PARTIZIP & INFINITIV\`.
2.  **Tense/Form Sections:** Use Markdown H4 headings (e.g., \`#### Präsens\`) for each tense and form.
3.  **Conjugation List (ABSOLUTELY CRITICAL):**
    *   For each tense, list every personal pronoun conjugation on its **own separate line**.
    *   Do NOT use tables or any horizontal separators like \`|\` or \`||\`.
    *   The personal pronoun (\`ich\`, \`du\`, \`er/sie/es\`, etc.) MUST be in **Markdown bold**. The verb form must follow it on the same line.
4.  **Top Information (ABSOLUTELY CRITICAL):**
    *   The top information (Infinitive, Partizip, Hilfsverb) must be listed on **separate lines**.
    *   The labels (\`Infinitive:\`, \`Partizip Präsens:\`, etc.) MUST be in **Markdown bold**.
5.  **Spacing:** Use only a single empty line between sections for readability. Do not add excessive empty lines.
6.  **Strict Adherence:** Do NOT use any introductory text, concluding text, or any formatting other than what is described here. The response must start directly with the "**Infinitive:**" line.

**--- PERFECT EXAMPLE OUTPUT FOR "gehen" ---**

**Infinitive:** gehen
**Partizip Präsens:** gehend
**Partizip Perfekt:** gegangen
**Hilfsverb:** sein

### INDIKATIV

#### Präsens
**ich** gehe
**du** gehst
**er/sie/es** geht
**wir** gehen
**ihr** geht
**Sie** gehen

#### Präteritum
**ich** ging
**du** gingst
**er/sie/es** ging
**wir** gingen
**ihr** gingt
**Sie** gingen

#### Perfekt
**ich** bin gegangen
**du** bist gegangen
**er/sie/es** ist gegangen
**wir** sind gegangen
**ihr** seid gegangen
**Sie** sind gegangen

... (and so on for all other tenses and moods following the same pattern) ...

### IMPERATIV

#### Imperativ
**(du)** Geh!
**(wir)** Gehen wir!
**(ihr)** Geht!
**(Sie)** Gehen Sie!

---
Now, generate the complete and correctly formatted table for the verb I provide.`;

        try {
            if (groqModel) {
                const message = await this.callGroqApi(prompt, groqModel);
                return { status: 'success', message };
            }

            this.init();
            if (!this.genAI) {
                return { status: 'error', message: 'Gemini API Key not found.' };
            }

            const model = this.genAI.getGenerativeModel({ model: geminiModel || 'gemini-pro' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return { status: 'success', message: response.text() };
        } catch (error: any) {
            console.error("Conjugation Error:", error);
            return { status: 'error', message: error.message || "Conjugation failed." };
        }
    }
    async processAudio(base64Audio: string, mimeType: string, prompt: string): Promise<{ status: string; message: string }> {
        this.init();
        if (!this.genAI) {
            return { status: 'error', message: 'Gemini API Key not found.' };
        }

        const geminiModel = webStore.get('gemini-model');
        // Use gemini-1.5-flash as default if not set, as it handles multimodal well
        const model = this.genAI.getGenerativeModel({ model: geminiModel || 'gemini-1.5-flash' });

        try {
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Audio
                    }
                }
            ]);
            const response = await result.response;
            return { status: 'success', message: response.text() };
        } catch (error: any) {
            console.error("Gemini Audio Processing Error:", error);
            return { status: 'error', message: error.message || "Audio processing failed." };
        }
    }
}

export const geminiService = new GeminiService();
