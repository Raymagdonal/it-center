// API Service for Ticket Machine - connects to Express backend on Render
import { TicketMachine } from '../types';

// ⚠️ เปลี่ยน URL นี้เป็น URL ของ Render หลัง deploy เสร็จ
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API_URL = `${API_BASE}/api/ticket-machines`;

// Helper: Convert MongoDB document to frontend TicketMachine format
const toTicketMachine = (doc: any): TicketMachine => ({
  id: doc._id,
  serialNumber: doc.serialNumber,
  purchaseDate: doc.purchaseDate,
  notes: doc.notes || '',
  deviceName: doc.deviceName,
  location: doc.location,
  status: doc.status || 'ACTIVE',
});

// GET all ticket machines
export const fetchTicketMachines = async (): Promise<TicketMachine[]> => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map(toTicketMachine);
  } catch (err) {
    console.error('❌ Failed to fetch ticket machines:', err);
    return [];
  }
};

// GET stats
export const fetchTicketMachineStats = async (): Promise<{
  total: number;
  locations: number;
  devices: number;
  locationList: string[];
  deviceList: string[];
}> => {
  try {
    const res = await fetch(`${API_URL}/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('❌ Failed to fetch stats:', err);
    return { total: 0, locations: 0, devices: 0, locationList: [], deviceList: [] };
  }
};

// POST create new ticket machine
export const createTicketMachine = async (data: Omit<TicketMachine, 'id'>): Promise<TicketMachine | null> => {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const doc = await res.json();
    return toTicketMachine(doc);
  } catch (err) {
    console.error('❌ Failed to create:', err);
    return null;
  }
};

// PUT update ticket machine
export const updateTicketMachine = async (id: string, data: Partial<TicketMachine>): Promise<TicketMachine | null> => {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const doc = await res.json();
    return toTicketMachine(doc);
  } catch (err) {
    console.error('❌ Failed to update:', err);
    return null;
  }
};

// DELETE ticket machine
export const deleteTicketMachine = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to delete:', err);
    return false;
  }
};

// POST reset ticket machines
export const resetTicketMachines = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/reset`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to reset:', err);
    return false;
  }
};
