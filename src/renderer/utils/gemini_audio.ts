// src/ui/utils/gemini_audio.ts
import { Content } from '@google/generative-ai';

// Define Blob type locally if not exported from @google/generative-ai in the same way
interface GeminiBlob {
    mimeType: string;
    data: string;
}

/** Float32 (-1..1) -> Int16 PCM -> base64; Gemini Live Blob */
export function createGeminiPcmBlob(data: Float32Array): GeminiBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        const s = Math.max(-1, Math.min(1, data[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const b64 = uint8ToBase64(new Uint8Array(int16.buffer));
    return {
        data: b64,
        mimeType: 'audio/pcm;rate=16000',
    };
}

/** base64 PCM -> Int16Array */
export function b64ToInt16(b64: string): Int16Array {
    const bytes = base64ToUint8(b64);
    return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
}

function uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
    const bin = atob(b64);
    const len = bin.length;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
    return out;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}
