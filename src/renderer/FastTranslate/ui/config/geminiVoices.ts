export const GEMINI_VOICE_OPTIONS = [
  'Kore',
  'Puck',
  'Charon',
  'Fenrir',
  'Aoede',
  'Leda',
  'Orus',
  'Zephyr',
] as const;

export type GeminiVoiceName = (typeof GEMINI_VOICE_OPTIONS)[number];

export const DEFAULT_GEMINI_VOICE: GeminiVoiceName = 'Kore';
