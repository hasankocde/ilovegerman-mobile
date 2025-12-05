
apk -- >  npm run build && npx cap sync android && cd android && .\gradlew assembleDebug



# ILoveGerman

**ILoveGerman** is a comprehensive, AI-powered language learning assistant designed to transform the way you interact with and understand foreign languages. Unlike traditional translation tools that simply swap words from one language to another, this application acts as a personal tutor. It leverages advanced Large Language Models (LLMs) like **Google Gemini** and **Groq** to provide deep grammatical analysis, context-aware corrections, and interactive study aids. Whether you are struggling with complex German sentence structures or trying to master Turkish suffixes, ILoveGerman breaks down every sentence to explain the "why" behind the "what," helping you internalize the rules of the language naturally.

---

## 🚀 Installation & Setup Guide

Getting started with ILoveGerman is designed to be straightforward, but it requires a few technical prerequisites since it is a modern web application built with React and Vite.

### Prerequisites
Before you begin, you must have **Node.js** installed on your computer. Node.js is a runtime environment that allows us to run JavaScript outside of a web browser, which is essential for managing the project's dependencies and running the development server. You will also need **Git** to download the project files from the repository.

### Step-by-Step Installation

1.  **Clone the Repository**:
    First, you need to get the project code onto your local machine. Open your terminal or command prompt and run the `git clone` command followed by the repository URL. This creates a local copy of the entire project history and files in a folder named `ai-learn-language`.
    ```bash
    git clone <repository-url>
    cd ai-learn-language
    ```

2.  **Install Dependencies**:
    Modern web applications rely on various third-party libraries (packages) to function—for example, libraries for UI components, routing, and AI integration. The `npm install` command reads the `package.json` file in the project directory and automatically downloads and installs all these necessary libraries into a `node_modules` folder. This step is crucial; without it, the app will not run.
    ```bash
    npm install
    ```

3.  **Start the Application (Development Mode)**:
    To run the app, use the `npm run dev` command. This starts a local development server using **Vite**, a next-generation frontend build tool. Vite is incredibly fast and allows you to see changes in real-time. Once the server starts, it will provide a local URL (usually `http://localhost:5173`). Simply open this URL in your preferred web browser (Chrome, Edge, etc.) to access the application.
    ```bash
    npm run dev
    ```

4.  **Build for Production**:
    If you want to deploy the application or run it as a standalone static site, you need to build it. The `npm run build` command compiles your code, optimizes images, and minifies JavaScript files to ensure the app runs as fast as possible. The resulting "production-ready" files are placed in the `dist` folder, which can then be served by any web server.
    ```bash
    npm run build
    ```

---

## 🎯 Purpose & Core Philosophy

The core philosophy of **ILoveGerman** is "Learning through Understanding." Many language learners get stuck because they can memorize vocabulary but fail to grasp the underlying grammar and structure. This application solves that problem by treating every translation request as a teaching moment.

When you enter a sentence, the app doesn't just give you the translation. It performs a **Grammar Analysis**, identifying the subject, object, verb, and tense. It explains *why* a specific case (like the Accusative or Dative in German) was used. It corrects your mistakes and, crucially, explains the grammatical rule you violated. This turns passive reading into an active learning session, rapidly accelerating your mastery of the language.

---

## 🔑 API Keys & Service Configuration

This application is a frontend interface that connects to powerful AI services in the cloud. To make these connections, you need "keys"—unique passwords that authorize the app to use these services on your behalf.

### 1. Google Gemini API (The Brain)
Google's **Gemini** models serve as the primary intelligence for the application. They handle the complex tasks of translation, grammar explanation, and error correction. We use Gemini because of its large context window and superior reasoning capabilities.
*   **How to get it**: Visit [Google AI Studio](https://aistudio.google.com/), sign in, and create a free API key.
*   **Setup**: In the app, navigate to **Settings > API Key**. Paste your key into the "Gemini API Key" field. You can add multiple keys; the app will rotate through them to avoid hitting rate limits, ensuring uninterrupted study sessions.

### 2. Groq API (Speed & Transcription)
**Groq** provides incredibly fast inference speeds for open-source models like Llama 3, and it powers our **Whisper** integration for speech-to-text. While Gemini is the "brain," Groq is the "speedster," ideal for quick chat interactions and transcribing audio in real-time.
*   **How to get it**: Sign up at the [Groq Console](https://console.groq.com/) and generate an API key.
*   **Setup**: Paste this key into the "Groq API Key" field in the Settings menu. This enables the "Maverick" model and the "Transcription" feature.

### 3. Image Providers (Visual Learning)
To make flashcards more effective, the app associates images with your sentences. Instead of generic stock photos, we use the **Unsplash** and **Pexels** APIs to search for high-quality, relevant photography based on the context of your sentence.
*   **How to get it**: You need developer accounts on [Unsplash](https://unsplash.com/developers) and [Pexels](https://www.pexels.com/api/). Both offer free tiers for personal use.
*   **Setup**: Enter these keys in **Settings > Image Providers**. You can set the provider to "Auto," and the app will intelligently switch between them to find the best image.

---

## 🔖 The Bookmarklet (Your "Everywhere" Tool)

One of the most powerful features of ILoveGerman is the **Bookmarklet**. This is a special browser bookmark that contains a small piece of JavaScript code instead of a URL. It allows you to bring the power of the app to **any website** you visit.

**How it works**:
When you are reading a German news article or a Turkish blog post and encounter a sentence you don't understand, you simply select the text and click the "ILoveGerman" bookmark in your browser bar. The bookmarklet instantly injects a floating window into the current page, sending the selected text to your ILoveGerman app for analysis. This means you don't have to constantly copy-paste text back and forth between tabs. It creates a seamless immersion experience where help is always just one click away.

**Installation**:
1.  Click the **YL** button in the app header.
2.  Drag the **"ILoveGerman"** button directly onto your browser's bookmarks bar.
3.  That's it! You are ready to translate the web.

---

## 🧭 Detailed Feature Walkthrough

### **Header & Navigation**
The header is your command center.
*   **Translate Icon**: Opens a "Fast Translate" overlay. This is a lightweight mode for quick dictionary lookups without leaving your current context.
*   **YL Button**: Accesses the Bookmarklet installation page.
*   **Window Icon**: Detaches the application into a floating popup window. This is perfect for multitasking—you can keep the app open in a corner while watching a movie or reading a PDF.
*   **Undo**: Mistakes happen. If you accidentally cleared your text, this button restores the previous state instantly.

### **Home Screen (The Workspace)**
This is where the magic happens. The large text area allows you to input paragraphs of text.

### **Flashcard System**
Spaced repetition is key to memory. The Flashcard section allows you to review what you've learned.
*   **Visual Association**: Each card is automatically paired with an image fetched from Unsplash or Pexels. Visual cues significantly improve memory retention.
*   **Study Mode**: You can flip through cards, test yourself, and track your progress. The app supports multiple "Decks" (Files), so you can organize cards by topic (e.g., "Verbs," "Travel," "Business").
*   **Smart Parsing**: If your source text contains the separator `****`, the app intelligently splits the text. The sentence goes to the top of the card, and the target word (the answer) goes to the bottom, creating a "Fill in the blank" style challenge.

### **Settings & Customization**
ILoveGerman is highly configurable to suit your learning style.
*   **Models**: You can choose between **Gemini** (for deep reasoning) and **Groq** (for speed). The app enforces an "Exclusive Mode," meaning only one engine is active at a time to prevent conflicts and save resources.
*   **System Prompt**: For advanced users, the "Prompt" settings allow you to modify the instructions sent to the AI. You can tweak the persona of the AI—make it a strict grammar teacher or a casual conversation partner.
*   **Proxy Settings**: If you are in a region where Google or Groq services are restricted, you can configure a custom proxy server to route your traffic, ensuring you always have access to your learning tools.
*   **Default Settings**: Set your target language (German, Turkish, English, etc.) so you don't have to select it every time you open the app.

### **Transcription Page (Whisper)**
This feature is powered by the **Groq Whisper** model and is specifically tuned for challenging audio environments.
*   **Mixed Language Support**: It is designed to handle "code-switching"—for example, a speaker switching between German and Turkish in the same sentence, or speaking German with a heavy Turkish accent. Standard transcribers often fail here, but our tuned implementation captures the raw text accurately without attempting to translate it, giving you a faithful transcript of exactly what was said.