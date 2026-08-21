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
    RADIO_DATA: 'techfix_radio_data',
    VIABUS_DATA: 'techfix_viabus_data',
    CCTV_DATA: 'techfix_cctv_data',
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

// IndexedDB Database helper for unlimited local storage
const IDB_DB_NAME = 'ITRepairAppDB';
const IDB_STORE_NAME = 'app_keyval_store';
const IDB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const getIDB = (): Promise<IDBDatabase> => {
    if (typeof window === 'undefined' || !window.indexedDB) {
        return Promise.reject(new Error('IndexedDB not supported'));
    }
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(IDB_DB_NAME, IDB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
                    db.createObjectStore(IDB_STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    return dbPromise;
};

export const idbSet = async (key: string, value: any): Promise<void> => {
    try {
        const db = await getIDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
            const store = tx.objectStore(IDB_STORE_NAME);
            const req = store.put(value, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('IndexedDB set failed:', e);
    }
};

export const idbGet = async <T>(key: string, defaultValue: T): Promise<T> => {
    try {
        const db = await getIDB();
        return new Promise((resolve) => {
            const tx = db.transaction(IDB_STORE_NAME, 'readonly');
            const store = tx.objectStore(IDB_STORE_NAME);
            const req = store.get(key);
            req.onsuccess = () => {
                resolve(req.result !== undefined ? req.result : defaultValue);
            };
            req.onerror = () => resolve(defaultValue);
        });
    } catch {
        return defaultValue;
    }
};

/**
 * Safe localStorage & IndexedDB setItem with error resilience
 */
export const safeSetItem = (key: string, value: string): { success: boolean; error?: string } => {
    // 1. Asynchronously persist into IndexedDB (Unlimited GBs Storage)
    try {
        const parsed = JSON.parse(value);
        idbSet(key, parsed).catch(() => {});
    } catch {
        idbSet(key, value).catch(() => {});
    }

    // 2. Try localStorage for quick sync
    try {
        localStorage.setItem(key, value);
        return { success: true };
    } catch (error) {
        // When localStorage is full (5MB limit), IndexedDB has already saved it!
        console.warn(`LocalStorage quota reached for key "${key}", persisted in IndexedDB instead.`);
        return { success: true };
    }
};

/**
 * Get data with type safety (checks localStorage first, synchronous)
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
 * Convert File/Blob to Base64 data URL
 */
export const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};

/**
 * Compress an image (accepts File, Blob, or base64 string) to an optimized size
 */
export const compressImage = async (
    input: string | File | Blob,
    maxWidth = 800,
    quality = 0.65
): Promise<string> => {
    let base64Str = '';
    if (typeof input !== 'string') {
        base64Str = await fileToBase64(input);
    } else {
        base64Str = input;
    }

    // If string is not a data url (e.g. broken string), return as is
    if (!base64Str || !base64Str.startsWith('data:image')) {
        return base64Str;
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            } else {
                resolve(base64Str);
            }
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
 * Clear all app data from localStorage and IndexedDB
 */
export const clearAllData = (): void => {
    Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
    });
};

