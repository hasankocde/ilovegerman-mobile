import { v4 as uuidv4 } from 'uuid';

// Mock Electron Store using LocalStorage
class WebStore {
    get(key: string, defaultValue?: any): any {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error getting key ${key} from localStorage`, error);
            return defaultValue;
        }
    }

    set(key: string, value: any): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting key ${key} to localStorage`, error);
        }
    }

    delete(key: string): void {
        localStorage.removeItem(key);
    }

    clear(): void {
        localStorage.clear();
    }
}

export const webStore = new WebStore();

// Mock IPC Renderer
export const webIpc = {
    on: (channel: string, func: (...args: any[]) => void) => {
        console.log(`[WebIPC] Listening on channel: ${channel}`);
        // In a real web app, we might use CustomEvents or other mechanisms
        // For now, this is just a placeholder to prevent crashes
        return {
            dispose: () => { }
        };
    },
    send: (channel: string, ...args: any[]) => {
        console.log(`[WebIPC] Sending to channel: ${channel}`, args);
        // Handle specific channels if needed
    },
    invoke: async (channel: string, ...args: any[]) => {
        console.log(`[WebIPC] Invoking channel: ${channel}`, args);
        // Mock responses for specific channels
        if (channel === 'get-version') return '1.0.0-web';
        return null;
    },
    removeAllListeners: (channel: string) => {
        console.log(`[WebIPC] Removing listeners for: ${channel}`);
    }
};

// Helper for opening external links
export const openExternal = (url: string) => {
    window.open(url, '_blank');
};
