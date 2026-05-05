
export type DeviceType = 'TICKET_MACHINE' | 'CCTV' | 'CHARGER' | 'OTHER' | string;

export type TicketStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface MaintenanceTicket {
  id: string;
  deviceType: DeviceType;
  deviceId?: string;
  issueDescription: string;
  location: string;
  imageUrls?: string[];
  fixedImageUrl?: string; // Deprecated, use fixedImageUrls
  fixedImageUrls?: string[];
  completedDate?: string; // Date when the repair was completed
  status: TicketStatus;
  timestamp: string;
  contactName?: string;
  contactPhone?: string;
  aiAnalysis?: {
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    suggestedAction: string;
    technicalNotes: string;
  };
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ORDERING';

export interface StockUsage {
  id: string;
  location: string;
  locationType: 'PORT' | 'VESSEL';
  installedDate: string;
  serialNumber?: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  status: StockStatus;
  lastPurchaseDate: string;
  pricePerUnit?: number;
  supplier?: string;
  usage?: StockUsage[];
  // New Procurement Fields
  imageUrl?: string | null;
  serialNumber?: string;
  startUseDate?: string;
  location?: string;
  usageStatus?: 'ACTIVE' | 'SPARE';
}

export type AssetStatus = 'ACTIVE' | 'SPARE' | 'BROKEN' | 'SEND_CLAIM';

export interface TrackedAsset {
  id: string;
  sn: string;
  name: string;
  imageUrl?: string;
  location: string;
  locationType: 'PORT' | 'VESSEL';
  username: string;
  installedDate: string;
  coordinates?: { x: number; y: number };
  // Extended fields for Device List
  model?: string;
  price?: number;
  source?: string;
  purchaseDate?: string;
  status?: AssetStatus;
  notes?: string;
  // Spare stock fields
  quantity?: number;
  unit?: string;
}

export type MaritimeStatus = 'NORMAL' | 'BROKEN' | 'LOST' | 'CLAIMING' | 'PENDING_PURCHASE';

export interface MaritimeImage {
  id: string;
  label: string; // e.g., "Monitor CCTV"
  url: string | null;
  status: MaritimeStatus;
  description: string;
}

export interface MaritimeItem {
  id: string;
  name: string; // Vessel or Port name
  type: 'VESSEL' | 'PORT';
  location: string;
  status: MaritimeStatus;
  recordDate: string;
  images: MaritimeImage[];
  notes?: string;
}

export interface AgendaMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
}

export interface AgendaItem {
  id: string;
  time: string;
  duration: string;
  topic: string;
  description: string;
  owner: string;
  media?: AgendaMedia[];
}

export interface MeetingAgenda {
  title: string;
  date: string;
  summary: string;
  stakeholders: string[];
  items: AgendaItem[];
}

export interface ProjectActivity {
  id: string;
  type: 'INSTALL' | 'REPAIR' | 'PURCHASE';
  date: string;
  deviceName: string;
  location: string;
  owner: string;
  details: string;
  beforeImages?: string[];
  afterImages?: string[];
}

export interface MeetingReport {
  id: string;
  title: string;
  date: string;
  activities: ProjectActivity[];
}

// SIM AIS Types
export interface SimCard {
  id: string;
  phoneNumber: string;
  promotion: string;
  deviceName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BROKEN';
  location: string;
  notes?: string;
  email?: string;
  kShopName?: string;
  provider: 'AIS';
}

// Ticket Machine Types
export interface TicketMachine {
  id: string;
  serialNumber: string;
  purchaseDate: string;
  notes: string;
  deviceName: string;
  location: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export type AppMode = 'HOME' | 'REPORT' | 'TRACK' | 'ADMIN' | 'PROCUREMENT' | 'ASSET_TRACKING' | 'MARITIME' | 'BACKUP' | 'ALL_DEVICES' | 'MEETING_REPORT' | 'SIM_AIS' | 'CALENDAR';


export type LoadingState = 'idle' | 'analyzing' | 'submitting' | 'error' | 'success' | 'generating';

// Procurement Folder Structure Types
export type ProcurementLocationType = 'BOAT' | 'PIER' | 'OFFICE';

export interface ProcurementFolderItem {
  id: string;
  name: string;
  imageUrl?: string | null;
  serialNumber?: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  startUseDate?: string;
  usageStatus: 'ACTIVE' | 'SPARE';
  notes?: string;
  supplier?: string;
}

export interface ProcurementFolder {
  id: string;
  name: string;
  locationType: ProcurementLocationType;
  locationName: string; // e.g., "CTB1", "พระอาทิตย์", "สำนักงาน"
  year: number;
  month: number; // 0-11 (January = 0)
  items: ProcurementFolderItem[];
}

export interface InventorySelection {
  year: number;
  category: ProcurementLocationType;
  location: string;
  month: number;
}

// Procurement Folder Constants
export const BOAT_LOCATIONS = ['CTB1', 'CTB2', 'CTB3', 'R1', 'R2', 'R3', 'R4'] as const;
export const PIER_LOCATIONS = ['พระอาทิตย์', 'พรานนก', 'มหาราช', 'ท่าช้าง', 'วัดอรุณฯ', 'ราชินี', 'ราชวงศ์', 'ไอคอนสยาม', 'สาทร', 'BTS', 'เอเชียทีค'] as const;
export const OFFICE_LOCATIONS = ['สำนักงาน'] as const;
export const PROCUREMENT_YEARS = [2026, 2027, 2028, 2029, 2030] as const;
export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
] as const;

