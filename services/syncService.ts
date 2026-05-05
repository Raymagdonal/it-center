// Universal Sync Service - Connects Frontend State to Backend Storage
const API_BASE = import.meta.env.VITE_API_URL || 'https://it-center-i291.onrender.com';

export interface AppData {
  tickets: any[];
  stock: any[];
  assets: any[];
  maritime: any[];
  reports: any[];
  folders: any[];
  simCards: any[];
  ticketMachines: any[];
}

// Fetch all data from server
export const fetchAllData = async (): Promise<AppData | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/sync`);
    if (!res.ok) throw new Error('Sync failed');
    return await res.json();
  } catch (err) {
    console.error('❌ Sync Fetch Error:', err);
    return null;
  }
};

// Save all data to server (Bulk Sync)
export const saveAllData = async (data: AppData): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.error('❌ Sync Save Error:', err);
    return false;
  }
};
