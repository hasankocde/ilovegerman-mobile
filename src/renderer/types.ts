export type MonitoringMode = 'off' | 'auto' | 'icon' | 'clipboard' | 'mouse';

export interface HistoryItem {
    id: string;
    originalInput: string;
    rawResult: string;
    timestamp: number;
    viewCount: number;
}
