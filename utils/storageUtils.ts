// Storage utility functions for IT-Repair system

// All localStorage keys used in the application
export const STORAGE_KEYS = {
    TICKETS: 'techfix_tickets',
    STOCK: 'techfix_stock',
    TRACKED_ASSETS: 'techfix_tracked_assets',
    MARITIME: 'techfix_maritime',
    MEETING_REPORTS: 'techfix_meeting_reports',
    PROCUREMENT_FOLDERS: 'techfix_procurement_folders',
    SIM_CARDS: 'techfix_sim_cards',
    TICKET_MACHINES: 'techfix_ticket_machines',
    LAST_SAVED: 'techfix_last_saved',
    DATA_VERSION: 'techfix_data_version',
} as const;

// Current data schema version
export const CURRENT_DATA_VERSION = '4.0';

// Storage quota threshold for warning (80%)
export const STORAGE_WARNING_THRESHOLD = 0.8;

/**
 * Check storage quota and return usage information
 */
export const checkStorageQuota = async (): Promise<{
    usage: number;
    quota: number;
    percentUsed: number;
    isNearFull: boolean;
}> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        const { usage = 0, quota = 0 } = await navigator.storage.estimate();
        const percentUsed = quota > 0 ? usage / quota : 0;
        return {
            usage,
            quota,
            percentUsed,
            isNearFull: percentUsed > STORAGE_WARNING_THRESHOLD,
        };
    }
    // Fallback for browsers that don't support Storage API
    return { usage: 0, quota: 0, percentUsed: 0, isNearFull: false };
};

/**
 * Calculate total size of data in localStorage for this app
 */
export const getStorageUsage = (): { totalBytes: number; breakdown: Record<string, number> } => {
    const breakdown: Record<string, number> = {};
    let totalBytes = 0;

    Object.values(STORAGE_KEYS).forEach((key) => {
        const data = localStorage.getItem(key);
        if (data) {
            const size = new Blob([data]).size;
            breakdown[key] = size;
            totalBytes += size;
        }
    });

    return { totalBytes, breakdown };
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Safe localStorage setItem with error handling
 */
export const safeSetItem = (key: string, value: string): { success: boolean; error?: string } => {
    try {
        localStorage.setItem(key, value);
        return { success: true };
    } catch (error) {
        if (error instanceof DOMException) {
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                return { success: false, error: 'พื้นที่จัดเก็บเต็ม กรุณาสำรองข้อมูลและลบข้อมูลเก่าบางส่วน' };
            }
        }
        return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
    }
};

/**
 * Get data with type safety
 */
export const getStoredData = <T>(key: string, defaultValue: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch {
        return defaultValue;
    }
};

/**
 * Format relative time (e.g., "2 นาทีที่แล้ว")
 */
export const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 10) return 'เมื่อสักครู่';
    if (diffSec < 60) return `${diffSec} วินาทีที่แล้ว`;
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
    return date.toLocaleDateString('th-TH');
};

/**
 * Compress an image string (base64) to a smaller size
 */
export const compressImage = async (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(base64Str); // Fallback to original
    });
};

/**
 * Export all data for backup
 */
export const exportAllData = (): Record<string, unknown> => {
    return {
        tickets: getStoredData(STORAGE_KEYS.TICKETS, []),
        stock: getStoredData(STORAGE_KEYS.STOCK, []),
        maritime: getStoredData(STORAGE_KEYS.MARITIME, []),
        trackedAssets: getStoredData(STORAGE_KEYS.TRACKED_ASSETS, []),
        meetingReports: getStoredData(STORAGE_KEYS.MEETING_REPORTS, []),
        procurementFolders: getStoredData(STORAGE_KEYS.PROCUREMENT_FOLDERS, []),
        simCards: getStoredData(STORAGE_KEYS.SIM_CARDS, []),
        ticketMachines: getStoredData(STORAGE_KEYS.TICKET_MACHINES, []),
    };
};

/**
 * Clear all app data from localStorage
 */
export const clearAllData = (): void => {
    Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
    });
};

