import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Video, Plus, X, Save, Search, Edit, Trash2, AlertTriangle,
  CheckCircle, MapPin, Ship, User, Calendar, HardDrive,
  Camera, Eye, Layers, ShieldCheck, Database, Smartphone,
  Upload, Image as ImageIcon, Maximize2, ChevronLeft, ChevronRight, Loader2,
  WifiOff, LayoutGrid, ExternalLink, Tag, Hash
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { compressImage } from '../utils/storageUtils';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export const CCTV_PIERS = [
  'ท่าพระอาทิตย์',
  'ท่าพรานนก',
  'ท่ามหาราช',
  'ท่าช้าง',
  'ท่าวัดอรุณฯ',
  'ท่าราชินี',
  'ท่าราชวงศ์',
  'ท่าไอคอนสยาม',
  'ท่าสาทร',
  'BTS สะพานตากสิน',
  'ท่าเอเชียทีค',
] as const;

export const CCTV_VESSELS = ['CTB1', 'CTB2', 'CTB3', 'R1', 'R2', 'R3', 'R4'] as const;

export type PierName = typeof CCTV_PIERS[number];
export type VesselName = typeof CCTV_VESSELS[number];

export type CctvMemorySize = '32 GB' | '64 GB' | '128 GB' | '256 GB';
export type CctvLocationType = 'ท่าเรือ' | 'ในเรือ';
export type CctvStatus = 'ปกติ' | 'มีปัญหา' | 'ซ่อมบำรุง' | 'ออฟไลน์';
export type CctvAppType = 'EZVIZ' | 'DMSS';

export type CctvFaultCause =
  | 'กล้องดับ'
  | 'กระตุก'
  | 'ดู Online ไม่ได้'
  | 'กล้องไม่บันทึก'
  | 'ใช้งานได้ปกติ';

// Camera Registry Entry
export interface CctvCamera {
  id: string;
  locationType: CctvLocationType;
  locationName: string;           // pier name or vessel name
  brand: 'EZVIZ' | 'Dahua';
  cameraCount: number;            // 1-8 cameras
  serialNumbers?: string[];       // S/N for each camera (1 to cameraCount)
  serialNumber?: string;          // Combined or single S/N string
  storageType: 'SD Card' | 'NVR';
  memorySize?: CctvMemorySize;    // for EZVIZ (SD card)
  nvrCapacity?: '4TB';            // for Dahua
  installDate?: string;
  status: CctvStatus;
  appType?: CctvAppType;          // EZVIZ or DMSS
  notes?: string;
  images?: string[];              // Unlimited photos
  createdAt: string;
  updatedAt: string;
}

// Fault Log
export interface CctvFaultLog {
  id: string;
  cameraId?: string;
  locationType: CctvLocationType;
  locationName: string;
  reportDate: string;
  reporterName: string;
  faultCauses: CctvFaultCause[];
  fixedDate?: string;
  isFixed: boolean;
  causeDetails?: string;
  images?: string[];              // Unlimited photos for fault report
  createdAt: string;
}

export interface CctvData {
  cameras: CctvCamera[];
  faultLogs: CctvFaultLog[];
}

// ─────────────────────────────────────────────
// Default Mockup Cameras (11 Piers EZVIZ + 7 Vessels Dahua)
// ─────────────────────────────────────────────

export const DEFAULT_CCTV_CAMERAS: CctvCamera[] = [
  // 11 Piers (EZVIZ - SD Card)
  {
    id: 'cctv_pier_1',
    locationType: 'ท่าเรือ',
    locationName: 'ท่าพระอาทิตย์',
    brand: 'EZVIZ',
    cameraCount: 2,
    storageType: 'SD Card',
    memorySize: '64 GB',
    status: 'ปกติ',
    installDate: '2026-01-10',
    appType: 'EZVIZ',
    notes: 'กล้อง IP Camera EZVIZ ทางเข้า-ออกท่าเรือ',
    images: [],
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_2',
    locationType: 'ท่าเรือ',
    locationName: 'ท่าพรานนก',
    brand: 'EZVIZ',
    cameraCount: 3,
    storageType: 'SD Card',
    memorySize: '128 GB',
    status: 'ปกติ',
    installDate: '2026-01-12',
    appType: 'EZVIZ',
    notes: 'กล้อง EZVIZ ส่องโป๊ะเทียบเรือและจุดจำหน่ายตั๋ว',
    images: [],
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_3',
    locationType: 'ท่าเรือ',
    locationName: 'ท่ามหาราช',
    brand: 'EZVIZ',
    cameraCount: 2,
    storageType: 'SD Card',
    memorySize: '64 GB',
    status: 'ปกติ',
    installDate: '2026-01-15',
    appType: 'EZVIZ',
    notes: 'กล้อง EZVIZ ส่องทางเดินและโป๊ะเรือ',
    images: [],
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_4',
    locationType: 'ท่าเรือ',
    locationName: 'ท่าช้าง',
    brand: 'EZVIZ',
    cameraCount: 4,
    storageType: 'SD Card',
    memorySize: '128 GB',
    status: 'ปกติ',
    installDate: '2026-01-18',
    appType: 'EZVIZ',
    notes: 'กล้อง EZVIZ จุดต่อแถวผู้โดยสาร 4 มุม',
    images: [],
    createdAt: '2026-01-18T08:00:00.000Z',
    updatedAt: '2026-01-18T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_5',
    locationType: 'ท่าเรือ',
    locationName: 'ท่าวัดอรุณฯ',
    brand: 'EZVIZ',
    cameraCount: 2,
    storageType: 'SD Card',
    memorySize: '64 GB',
    status: 'ปกติ',
    installDate: '2026-01-20',
    appType: 'EZVIZ',
    notes: 'กล้อง EZVIZ หน้าวัดและโป๊ะเทียบเรือ',
    images: [],
    createdAt: '2026-01-20T08:00:00.000Z',
    updatedAt: '2026-01-20T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_6',
    locationType: 'ท่าเรือ',
    locationName: 'ท่าราชินี',
    brand: 'EZVIZ',
    cameraCount: 2,
    storageType: 'SD Card',
    memorySize: '64 GB',
    status: 'ปกติ',
    installDate: '2026-01-22',
    appType: 'EZVIZ',
    notes: 'กล้อง EZVIZ ทางเชื่อม MRT สนามไชย',
    images: [],
    createdAt: '2026-01-22T08:00:00.000Z',
    updatedAt: '2026-01-22T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_7',
    locationType: 'ท่าเรือ',
    locationName: 'ท่าราชวงศ์',
    brand: 'EZVIZ',
    cameraCount: 3,
    storageType: 'SD Card',
    memorySize: '128 GB',
    status: 'ปกติ',
    installDate: '2026-01-25',
    appType: 'EZVIZ',
    notes: 'กล้อง EZVIZ โซนเยาวราชและทางขึ้นเรือ',
    images: [],
    createdAt: '2026-01-25T08:00:00.000Z',
    updatedAt: '2026-01-25T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_8',
    locationType: 'ท่าเรือ',
    locationName: 'ท่าไอคอนสยาม',
    brand: 'EZVIZ',
    cameraCount: 4,
    storageType: 'SD Card',
    memorySize: '256 GB',
    status: 'ปกติ',
    installDate: '2026-01-28',
    appType: 'EZVIZ',
    notes: 'กล้อง EZVIZ หน้าห้างไอคอนสยาม 4 จุด',
    images: [],
    createdAt: '2026-01-28T08:00:00.000Z',
    updatedAt: '2026-01-28T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_9',
    locationType: 'ท่าเรือ',
    locationName: 'ท่าสาทร',
    brand: 'EZVIZ',
    cameraCount: 4,
    storageType: 'SD Card',
    memorySize: '256 GB',
    status: 'ปกติ',
    installDate: '2026-02-01',
    appType: 'EZVIZ',
    notes: 'ศูนย์กลางท่าเรือสาทร กล้อง EZVIZ 4 ตัว',
    images: [],
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_10',
    locationType: 'ท่าเรือ',
    locationName: 'BTS สะพานตากสิน',
    brand: 'EZVIZ',
    cameraCount: 2,
    storageType: 'SD Card',
    memorySize: '128 GB',
    status: 'ปกติ',
    installDate: '2026-02-03',
    appType: 'EZVIZ',
    notes: 'กล้อง EZVIZ บันไดทางเชื่อมสถานี BTS',
    images: [],
    createdAt: '2026-02-03T08:00:00.000Z',
    updatedAt: '2026-02-03T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_11',
    locationType: 'ท่าเรือ',
    locationName: 'ท่าเอเชียทีค',
    brand: 'EZVIZ',
    cameraCount: 3,
    storageType: 'SD Card',
    memorySize: '128 GB',
    status: 'ปกติ',
    installDate: '2026-02-05',
    appType: 'EZVIZ',
    notes: 'กล้อง EZVIZ โซนลานกิจกรรมและโป๊ะเรือ',
    images: [],
    createdAt: '2026-02-05T08:00:00.000Z',
    updatedAt: '2026-02-05T08:00:00.000Z',
  },

  // 7 Vessels (Dahua - NVR 4TB)
  {
    id: 'cctv_vessel_1',
    locationType: 'ในเรือ',
    locationName: 'CTB1',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'ปกติ',
    installDate: '2026-01-10',
    appType: 'DMSS',
    notes: 'ระบบกล้อง Dahua 4 จุด หัวเรือ, ท้ายเรือ, ห้องโดยสาร, ห้องกัปตัน พร้อมเครื่องบันทึก NVR 4TB',
    images: [],
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'cctv_vessel_2',
    locationType: 'ในเรือ',
    locationName: 'CTB2',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'ปกติ',
    installDate: '2026-01-12',
    appType: 'DMSS',
    notes: 'ระบบกล้อง Dahua 4 จุด พร้อมเครื่องบันทึก NVR 4TB',
    images: [],
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'cctv_vessel_3',
    locationType: 'ในเรือ',
    locationName: 'CTB3',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'ปกติ',
    installDate: '2026-01-15',
    appType: 'DMSS',
    notes: 'ระบบกล้อง Dahua 4 จุด พร้อมเครื่องบันทึก NVR 4TB',
    images: [],
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cctv_vessel_4',
    locationType: 'ในเรือ',
    locationName: 'R1',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'ปกติ',
    installDate: '2026-01-18',
    appType: 'DMSS',
    notes: 'ระบบกล้อง Dahua 4 จุด พร้อมเครื่องบันทึก NVR 4TB',
    images: [],
    createdAt: '2026-01-18T08:00:00.000Z',
    updatedAt: '2026-01-18T08:00:00.000Z',
  },
  {
    id: 'cctv_vessel_5',
    locationType: 'ในเรือ',
    locationName: 'R2',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'ปกติ',
    installDate: '2026-01-20',
    appType: 'DMSS',
    notes: 'ระบบกล้อง Dahua 4 จุด พร้อมเครื่องบันทึก NVR 4TB',
    images: [],
    createdAt: '2026-01-20T08:00:00.000Z',
    updatedAt: '2026-01-20T08:00:00.000Z',
  },
  {
    id: 'cctv_vessel_6',
    locationType: 'ในเรือ',
    locationName: 'R3',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'ปกติ',
    installDate: '2026-01-22',
    appType: 'DMSS',
    notes: 'ระบบกล้อง Dahua 4 จุด พร้อมเครื่องบันทึก NVR 4TB',
    images: [],
    createdAt: '2026-01-22T08:00:00.000Z',
    updatedAt: '2026-01-22T08:00:00.000Z',
  },
  {
    id: 'cctv_vessel_7',
    locationType: 'ในเรือ',
    locationName: 'R4',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'ปกติ',
    installDate: '2026-01-25',
    appType: 'DMSS',
    notes: 'ระบบกล้อง Dahua 4 จุด พร้อมเครื่องบันทึก NVR 4TB',
    images: [],
    createdAt: '2026-01-25T08:00:00.000Z',
    updatedAt: '2026-01-25T08:00:00.000Z',
  },
];

// ─────────────────────────────────────────────
// Constants & Colors
// ─────────────────────────────────────────────

const MEMORY_SIZES: CctvMemorySize[] = ['32 GB', '64 GB', '128 GB', '256 GB'];

const FAULT_CAUSES: CctvFaultCause[] = [
  'กล้องดับ',
  'กระตุก',
  'ดู Online ไม่ได้',
  'กล้องไม่บันทึก',
  'ใช้งานได้ปกติ',
];

const FAULT_COLORS: Record<CctvFaultCause, string> = {
  'กล้องดับ':          'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'กระตุก':            'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'ดู Online ไม่ได้':   'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'กล้องไม่บันทึก':     'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'ใช้งานได้ปกติ':     'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

const STATUS_CONFIG: Record<CctvStatus, { label: string; color: string; icon: React.FC<any> }> = {
  'ปกติ':     { label: 'ปกติ',     color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: CheckCircle },
  'มีปัญหา':  { label: 'มีปัญหา', color: 'bg-red-500/15 text-red-300 border-red-500/30',             icon: AlertTriangle },
  'ซ่อมบำรุง':{ label: 'ซ่อมบำรุง',color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',       icon: AlertTriangle },
  'ออฟไลน์': { label: 'ออฟไลน์', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30',        icon: WifiOff },
};

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

const todayDate = () => new Date().toISOString().split('T')[0];

const formatDateThai = (dt: string) => {
  if (!dt) return '-';
  return new Date(dt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface CctvManagerProps {
  data: CctvData;
  onUpdate: (data: CctvData) => void;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const CctvManager: React.FC<CctvManagerProps> = ({ data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'registry' | 'faults'>('registry');
  const [registryTab, setRegistryTab] = useState<'pier' | 'vessel'>('pier');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showFaultModal, setShowFaultModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CctvCamera | null>(null);
  const [editingFault, setEditingFault] = useState<CctvFaultLog | null>(null);

  // Uploading status & Lightbox viewer state
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const cameraFileInputRef = useRef<HTMLInputElement | null>(null);
  const faultFileInputRef = useRef<HTMLInputElement | null>(null);

  // Safe references
  const rawCameras = data?.cameras;
  const cameras: CctvCamera[] = useMemo(() => {
    if (Array.isArray(rawCameras) && rawCameras.length > 0) {
      return rawCameras;
    }
    return DEFAULT_CCTV_CAMERAS;
  }, [rawCameras]);

  const faultLogs: CctvFaultLog[] = useMemo(() => {
    return Array.isArray(data?.faultLogs) ? data.faultLogs : [];
  }, [data?.faultLogs]);

  // Auto-initialize default cameras if empty in data
  useEffect(() => {
    if (!Array.isArray(data?.cameras) || data.cameras.length === 0) {
      onUpdate({
        cameras: DEFAULT_CCTV_CAMERAS,
        faultLogs: Array.isArray(data?.faultLogs) ? data.faultLogs : [],
      });
    }
  }, []);

  // ── Camera form state ──
  const emptyCameraPier = (): Omit<CctvCamera, 'id' | 'createdAt' | 'updatedAt'> => ({
    locationType: 'ท่าเรือ',
    locationName: CCTV_PIERS[0],
    brand: 'EZVIZ',
    cameraCount: 2,
    serialNumbers: ['', ''],
    serialNumber: '',
    storageType: 'SD Card',
    memorySize: '64 GB',
    status: 'ปกติ',
    installDate: '',
    appType: 'EZVIZ',
    notes: '',
    images: [],
  });

  const emptyCameraVessel = (): Omit<CctvCamera, 'id' | 'createdAt' | 'updatedAt'> => ({
    locationType: 'ในเรือ',
    locationName: CCTV_VESSELS[0],
    brand: 'Dahua',
    cameraCount: 4,
    serialNumbers: ['', '', '', ''],
    serialNumber: '',
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'ปกติ',
    installDate: '',
    appType: 'DMSS',
    notes: '',
    images: [],
  });

  const [cameraForm, setCameraForm] = useState(
    registryTab === 'pier' ? emptyCameraPier() : emptyCameraVessel()
  );

  // ── Fault form state ──
  const emptyFault = (): Omit<CctvFaultLog, 'id' | 'createdAt'> => ({
    locationType: 'ท่าเรือ',
    locationName: CCTV_PIERS[0],
    reportDate: todayDate(),
    reporterName: '',
    faultCauses: [],
    fixedDate: '',
    isFixed: false,
    causeDetails: '',
    images: [],
  });

  const [faultForm, setFaultForm] = useState(emptyFault());

  // ── Cameras by type ──
  const pierCameras = useMemo(() =>
    cameras.filter(c => c.locationType === 'ท่าเรือ')
      .sort((a, b) => CCTV_PIERS.indexOf(a.locationName as PierName) - CCTV_PIERS.indexOf(b.locationName as PierName)),
    [cameras]
  );

  const vesselCameras = useMemo(() =>
    cameras.filter(c => c.locationType === 'ในเรือ')
      .sort((a, b) => CCTV_VESSELS.indexOf(a.locationName as VesselName) - CCTV_VESSELS.indexOf(b.locationName as VesselName)),
    [cameras]
  );

  const totalCameraCount = useMemo(() =>
    cameras.reduce((sum, c) => sum + c.cameraCount, 0),
    [cameras]
  );

  const faultyCameras = cameras.filter(c => c.status !== 'ปกติ').length;
  const activeFaults = faultLogs.filter(l => !l.isFixed).length;

  // ── Image Upload Handlers ──
  const handleCameraImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const compressed = await compressImage(base64, 1024, 0.75);
        newImages.push(compressed);
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }

    setCameraForm(prev => ({
      ...prev,
      images: [...(prev.images || []), ...newImages],
    }));

    setIsUploading(false);
    if (cameraFileInputRef.current) {
      cameraFileInputRef.current.value = '';
    }
  };

  const removeCameraImage = (indexToRemove: number) => {
    setCameraForm(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleFaultImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const compressed = await compressImage(base64, 1024, 0.75);
        newImages.push(compressed);
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }

    setFaultForm(prev => ({
      ...prev,
      images: [...(prev.images || []), ...newImages],
    }));

    setIsUploading(false);
    if (faultFileInputRef.current) {
      faultFileInputRef.current.value = '';
    }
  };

  const removeFaultImage = (indexToRemove: number) => {
    setFaultForm(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const openLightbox = (images: string[], startIndex = 0) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
  };

  // ── Camera CRUD ──
  const openAddCamera = () => {
    setEditingCamera(null);
    setCameraForm(registryTab === 'pier' ? emptyCameraPier() : emptyCameraVessel());
    setShowCameraModal(true);
  };

  const openEditCamera = (cam: CctvCamera) => {
    setEditingCamera(cam);
    const count = cam.cameraCount || 1;
    let sns: string[] = [];
    if (Array.isArray(cam.serialNumbers) && cam.serialNumbers.length > 0) {
      sns = [...cam.serialNumbers];
    } else if (cam.serialNumber) {
      sns = cam.serialNumber.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    }
    const normalizedSNs: string[] = [];
    for (let i = 0; i < count; i++) {
      normalizedSNs.push(sns[i] || '');
    }

    setCameraForm({
      locationType: cam.locationType,
      locationName: cam.locationName,
      brand: cam.brand,
      cameraCount: count,
      serialNumbers: normalizedSNs,
      serialNumber: normalizedSNs.filter(Boolean).join(', ') || cam.serialNumber || '',
      storageType: cam.storageType,
      memorySize: cam.memorySize,
      nvrCapacity: cam.nvrCapacity,
      status: cam.status,
      installDate: cam.installDate || '',
      appType: cam.appType || (cam.brand === 'EZVIZ' ? 'EZVIZ' : 'DMSS'),
      notes: cam.notes || '',
      images: cam.images || [],
    });
    setShowCameraModal(true);
  };

  const saveCamera = () => {
    if (!cameraForm.locationName) return;
    const now = new Date().toISOString();
    let newCameras: CctvCamera[];
    if (editingCamera) {
      newCameras = cameras.map(c =>
        c.id === editingCamera.id ? { ...editingCamera, ...cameraForm, updatedAt: now } : c
      );
    } else {
      const newCam: CctvCamera = {
        id: `cctv_cam_${Date.now()}`,
        ...cameraForm,
        createdAt: now,
        updatedAt: now,
      };
      newCameras = [...cameras, newCam];
    }
    onUpdate({ ...data, cameras: newCameras, faultLogs });
    setShowCameraModal(false);
  };

  const deleteCamera = (id: string) => {
    if (!confirm('ยืนยันการลบกล้องนี้?')) return;
    onUpdate({ ...data, cameras: cameras.filter(c => c.id !== id), faultLogs });
  };

  // ── Fault CRUD ──
  const openAddFault = () => {
    setEditingFault(null);
    setFaultForm(emptyFault());
    setShowFaultModal(true);
  };

  const openEditFault = (log: CctvFaultLog) => {
    setEditingFault(log);
    setFaultForm({
      locationType: log.locationType,
      locationName: log.locationName,
      reportDate: log.reportDate,
      reporterName: log.reporterName,
      faultCauses: log.faultCauses,
      fixedDate: log.fixedDate || '',
      isFixed: log.isFixed,
      causeDetails: log.causeDetails || '',
      images: log.images || [],
    });
    setShowFaultModal(true);
  };

  const saveFault = () => {
    if (!faultForm.reporterName.trim() || faultForm.faultCauses.length === 0) {
      alert('กรุณากรอกชื่อผู้แจ้ง และเลือกสาเหตุ');
      return;
    }
    let newFaultLogs: CctvFaultLog[];
    if (editingFault) {
      newFaultLogs = faultLogs.map(l =>
        l.id === editingFault.id ? { ...editingFault, ...faultForm } : l
      );
    } else {
      newFaultLogs = [{ id: `cctv_fault_${Date.now()}`, ...faultForm, createdAt: new Date().toISOString() }, ...faultLogs];
    }
    onUpdate({ ...data, cameras, faultLogs: newFaultLogs });
    setShowFaultModal(false);
  };

  const deleteFault = (id: string) => {
    if (!confirm('ยืนยันการลบรายการนี้?')) return;
    onUpdate({ ...data, cameras, faultLogs: faultLogs.filter(l => l.id !== id) });
  };

  const toggleFaultCause = (cause: CctvFaultCause) => {
    setFaultForm(f => ({
      ...f,
      faultCauses: f.faultCauses.includes(cause)
        ? f.faultCauses.filter(c => c !== cause)
        : [...f.faultCauses, cause],
    }));
  };

  // ── Render camera card ──
  const renderCameraCard = (cam: CctvCamera) => {
    const isPier = cam.locationType === 'ท่าเรือ';
    const statusCfg = STATUS_CONFIG[cam.status] || STATUS_CONFIG['ปกติ'];
    const StatusIcon = statusCfg.icon;
    const hasImages = Array.isArray(cam.images) && cam.images.length > 0;
    const currentApp = cam.appType || (isPier ? 'EZVIZ' : 'DMSS');

    return (
      <div key={cam.id} className={`group relative bg-slate-900/60 border rounded-xl overflow-hidden transition-all hover:border-sky-500/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] flex flex-col justify-between ${
        cam.status !== 'ปกติ' ? 'border-red-500/40' : 'border-slate-700/60'
      }`}>
        <div>
          {/* Brand banner */}
          <div className={`px-4 py-2.5 flex items-center justify-between ${
            isPier
              ? 'bg-gradient-to-r from-sky-900/40 to-slate-900/20 border-b border-sky-800/30'
              : 'bg-gradient-to-r from-indigo-900/40 to-slate-900/20 border-b border-indigo-800/30'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isPier ? 'bg-sky-500/20' : 'bg-indigo-500/20'}`}>
                <Camera className={`w-4 h-4 ${isPier ? 'text-sky-400' : 'text-indigo-400'}`} />
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-widest font-mono ${isPier ? 'text-sky-300' : 'text-indigo-300'}`}>
                  {cam.brand}
                </p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">
                  {isPier ? 'IP Camera' : 'CCTV Camera'}
                </p>
              </div>
            </div>
            {/* Status badge */}
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusCfg.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
          </div>

          {/* Location */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              {isPier
                ? <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                : <Ship className="w-4 h-4 text-blue-400 shrink-0" />
              }
              <div>
                <p className="text-white font-bold text-sm">{cam.locationName}</p>
                <p className={`text-[10px] font-mono uppercase tracking-wider ${isPier ? 'text-cyan-600' : 'text-blue-600'}`}>
                  {cam.locationType}
                </p>
              </div>
            </div>

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Camera count */}
              <div className="bg-black/30 rounded-lg p-2.5 border border-slate-800">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-mono">จำนวนกล้อง</p>
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-sky-400" />
                  <p className="text-sky-300 font-bold font-mono text-sm">{cam.cameraCount} ตัว</p>
                </div>
              </div>

              {/* Storage */}
              <div className="bg-black/30 rounded-lg p-2.5 border border-slate-800">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  {isPier ? 'SD Card' : 'NVR Storage'}
                </p>
                <div className="flex items-center gap-1.5">
                  {isPier
                    ? <Database className="w-3.5 h-3.5 text-purple-400" />
                    : <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  }
                  <p className={`font-bold font-mono text-sm ${isPier ? 'text-purple-300' : 'text-amber-300'}`}>
                    {isPier ? cam.memorySize : cam.nvrCapacity || '4TB'}
                  </p>
                </div>
              </div>
            </div>

            {/* Install date & Application */}
            <div className="mt-2.5 space-y-1 bg-black/20 p-2 rounded-lg border border-slate-800/60">
              {cam.installDate && (
                <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  ติดตั้ง: {formatDateThai(cam.installDate)}
                </p>
              )}
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <Smartphone className="w-3 h-3 text-cyan-400" />
                Application: <span className="font-bold text-cyan-300">{currentApp}</span>
              </p>
            </div>

            {/* Serial Numbers display — show if any S/N recorded */}
            {cam.serialNumbers && cam.serialNumbers.some(Boolean) && (
              <div className="mt-2.5 p-2 bg-black/20 rounded-lg border border-slate-800/60">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5 text-cyan-500" /> Serial Numbers
                </p>
                <div className="space-y-0.5">
                  {cam.serialNumbers.map((sn, idx) => (
                    <p key={idx} className="text-[10px] font-mono flex items-center gap-1.5">
                      <span className="text-sky-500 font-bold w-5 shrink-0">#{idx + 1}</span>
                      <span className="text-slate-300 truncate">{sn || <span className="text-slate-600 italic">ไม่ระบุ</span>}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {cam.notes && (
              <p className="mt-2 text-[11px] text-slate-400 line-clamp-2">{cam.notes}</p>
            )}

            {/* Photo Gallery on Card */}
            {hasImages && (
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-sky-400" /> รูปภาพกล้อง ({cam.images!.length} รูป)
                  </span>
                  <button
                    onClick={() => openLightbox(cam.images!, 0)}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-mono flex items-center gap-0.5"
                  >
                    <Maximize2 className="w-2.5 h-2.5" /> ดูทั้งหมด
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {cam.images!.slice(0, 4).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => openLightbox(cam.images!, idx)}
                      className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700/80 cursor-pointer hover:opacity-80 transition-opacity shrink-0 group/img"
                    >
                      <img src={img} alt={`cctv-${idx}`} className="w-full h-full object-cover" />
                      {idx === 3 && cam.images!.length > 4 && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] text-white font-bold font-mono">
                          +{cam.images!.length - 3}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-2.5 border-t border-slate-800/50 bg-black/20 flex gap-2 justify-end">
          <button
            onClick={() => openEditCamera(cam)}
            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-950/30 rounded-full transition-all"
            title="แก้ไขข้อมูลกล้อง"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteCamera(cam.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-full transition-all"
            title="ลบกล้อง"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-5 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-sky-500/20 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-3">
            <Video className="h-8 w-8 text-sky-400" />
            CCTV
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-[10px] uppercase tracking-widest">
            CCTV Surveillance System • 11 ท่าเรือ (EZVIZ) & 7 ในเรือ (Dahua)
          </p>
        </div>

        {/* Action & Stats */}
        <div className="flex items-center gap-4 flex-wrap">
          <a
            href="https://docs.google.com/spreadsheets/d/1TzfuqNEnQRiCM2TevgbThnN037VujFQ4KOZkLjYKAkI/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 h-12 px-5 bg-green-950/20 hover:bg-green-950/40 border border-green-500/30 hover:border-green-500/60 rounded-xl text-green-400 transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.05)] hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] group shrink-0"
          >
            <LayoutGrid className="w-5 h-5 text-green-400 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold tracking-widest text-green-500/70 font-mono leading-none mb-1">EXTERNAL LINK</span>
              <span className="text-xs font-black tracking-wider text-green-400 leading-none">GOOGLE SHEETS LOG</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-green-500/50 group-hover:text-green-400 transition-colors ml-1" />
          </a>

          {/* Stats */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="bg-black border border-sky-900/50 rounded-lg px-3.5 py-2 text-center">
              <div className="text-xl font-bold text-sky-400 font-mono">{cameras.length}</div>
              <div className="text-[9px] text-sky-600 uppercase font-bold tracking-wider">จุด CCTV</div>
            </div>
            <div className="bg-black border border-emerald-900/50 rounded-lg px-3.5 py-2 text-center">
              <div className="text-xl font-bold text-emerald-400 font-mono">{totalCameraCount}</div>
              <div className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider">กล้องทั้งหมด</div>
            </div>
            <div className="bg-black border border-cyan-900/50 rounded-lg px-3.5 py-2 text-center">
              <div className="text-xl font-bold text-cyan-400 font-mono">{pierCameras.length}</div>
              <div className="text-[9px] text-cyan-600 uppercase font-bold tracking-wider">ท่าเรือ</div>
            </div>
            <div className="bg-black border border-blue-900/50 rounded-lg px-3.5 py-2 text-center">
              <div className="text-xl font-bold text-blue-400 font-mono">{vesselCameras.length}</div>
              <div className="text-[9px] text-blue-600 uppercase font-bold tracking-wider">ในเรือ</div>
            </div>
            {faultyCameras > 0 && (
              <div className="bg-black border border-red-900/50 rounded-lg px-3.5 py-2 text-center animate-pulse">
                <div className="text-xl font-bold text-red-400 font-mono">{faultyCameras}</div>
                <div className="text-[9px] text-red-600 uppercase font-bold tracking-wider">มีปัญหา</div>
              </div>
            )}
            {activeFaults > 0 && (
              <div className="bg-black border border-amber-900/50 rounded-lg px-3.5 py-2 text-center animate-pulse">
                <div className="text-xl font-bold text-amber-400 font-mono">{activeFaults}</div>
                <div className="text-[9px] text-amber-600 uppercase font-bold tracking-wider">แจ้งค้างอยู่</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Tabs ── */}
      <div className="flex gap-1 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('registry')}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'registry'
              ? 'border-sky-400 text-sky-300'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          ทำเนียบกล้อง ({cameras.length})
        </button>
        <button
          onClick={() => setActiveTab('faults')}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'faults'
              ? 'border-red-400 text-red-300'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          แจ้งปัญหา CCTV ({faultLogs.length})
          {activeFaults > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-black text-[10px] font-bold rounded-full">{activeFaults}</span>
          )}
        </button>
      </div>

      {/* ════ REGISTRY TAB ════ */}
      {activeTab === 'registry' && (
        <div className="space-y-4">
          {/* Sub tabs: pier / vessel */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1.5">
              <button
                onClick={() => setRegistryTab('pier')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold border transition-all ${
                  registryTab === 'pier'
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-600'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                ท่าเรือ — EZVIZ ({pierCameras.length}/{CCTV_PIERS.length})
              </button>
              <button
                onClick={() => setRegistryTab('vessel')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold border transition-all ${
                  registryTab === 'vessel'
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                    : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-600'
                }`}
              >
                <Ship className="w-3.5 h-3.5" />
                ในเรือ — Dahua ({vesselCameras.length}/{CCTV_VESSELS.length})
              </button>
            </div>
            <Button
              onClick={openAddCamera}
              className={`text-white border-none ${registryTab === 'pier' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่ม{registryTab === 'pier' ? 'กล้องท่าเรือ (EZVIZ)' : 'กล้องในเรือ (Dahua)'}
            </Button>
          </div>

          {/* Pier list */}
          {registryTab === 'pier' && (
            <>
              {/* Coverage indicator */}
              <div className="flex gap-2 flex-wrap">
                {CCTV_PIERS.map(pier => {
                  const cam = pierCameras.find(c => c.locationName === pier);
                  return (
                    <span
                      key={pier}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                        cam
                          ? cam.status !== 'ปกติ'
                            ? 'bg-red-500/15 text-red-300 border-red-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800/50 text-slate-500 border-slate-700'
                      }`}
                    >
                      {cam ? '✓ ' : '— '}{pier}
                    </span>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pierCameras.map(renderCameraCard)}
              </div>
            </>
          )}

          {/* Vessel list */}
          {registryTab === 'vessel' && (
            <>
              {/* Coverage indicator */}
              <div className="flex gap-2 flex-wrap">
                {CCTV_VESSELS.map(vessel => {
                  const cam = vesselCameras.find(c => c.locationName === vessel);
                  return (
                    <span
                      key={vessel}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        cam
                          ? cam.status !== 'ปกติ'
                            ? 'bg-red-500/15 text-red-300 border-red-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800/50 text-slate-500 border-slate-700'
                      }`}
                    >
                      {cam ? '✓ ' : '— '}{vessel}
                    </span>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {vesselCameras.map(renderCameraCard)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════ FAULTS TAB ════ */}
      {activeTab === 'faults' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddFault} className="bg-red-600 hover:bg-red-500 text-white border-none">
              <Plus className="w-4 h-4 mr-2" /> แจ้งปัญหา CCTV
            </Button>
          </div>

          <Card className="border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-black/40 text-slate-400 text-xs uppercase tracking-wider font-mono whitespace-nowrap">
                    <th className="px-4 py-3 font-bold">สถานที่</th>
                    <th className="px-4 py-3 font-bold">รูปภาพ</th>
                    <th className="px-4 py-3 font-bold">วันที่แจ้ง</th>
                    <th className="px-4 py-3 font-bold">ผู้แจ้ง</th>
                    <th className="px-4 py-3 font-bold">สาเหตุ</th>
                    <th className="px-4 py-3 font-bold">สถานะแก้ไข</th>
                    <th className="px-4 py-3 font-bold text-right sticky right-0 bg-slate-900 border-l border-slate-800">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {faultLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-mono">
                        — ยังไม่มีรายการแจ้งปัญหา CCTV —
                      </td>
                    </tr>
                  ) : [...faultLogs]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(log => (
                      <tr key={log.id} className={`group hover:bg-slate-800/30 transition-all whitespace-nowrap ${log.isFixed ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border w-fit ${
                              log.locationType === 'ท่าเรือ'
                                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            }`}>
                              {log.locationType}
                            </span>
                            <span className="text-slate-200 font-bold text-xs">{log.locationName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {log.images && log.images.length > 0 ? (
                            <div className="flex gap-1 items-center">
                              <div
                                onClick={() => openLightbox(log.images!, 0)}
                                className="w-10 h-10 rounded border border-slate-700 overflow-hidden cursor-pointer hover:opacity-80"
                              >
                                <img src={log.images[0]} alt="fault" className="w-full h-full object-cover" />
                              </div>
                              {log.images.length > 1 && (
                                <span className="text-[10px] text-slate-400 font-mono">+{log.images.length - 1}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300 text-xs">{formatDateThai(log.reportDate)}</td>
                        <td className="px-4 py-3 text-slate-200">{log.reporterName}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {log.faultCauses.map(c => (
                              <span key={c} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${FAULT_COLORS[c] || 'bg-slate-800 text-white'}`}>{c}</span>
                            ))}
                          </div>
                          {log.causeDetails && (
                            <p className="text-[11px] text-slate-400 mt-1 max-w-xs truncate" title={log.causeDetails}>{log.causeDetails}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {log.isFixed ? (
                            <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                              <CheckCircle className="w-3 h-3" /> แก้ไขแล้ว {log.fixedDate && <span className="text-slate-500 font-mono">({formatDateThai(log.fixedDate)})</span>}
                            </span>
                          ) : (
                            <span className="text-red-400 text-xs font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> ยังไม่แก้ไข
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right sticky right-0 bg-slate-900/80 border-l border-slate-800/50 group-hover:bg-slate-800/90 transition-all">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditFault(log)} className="p-1.5 text-slate-500 hover:text-sky-400 hover:bg-sky-950/30 rounded-full transition-all">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteFault(log.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-full transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ════ CAMERA MODAL ════ */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className={`w-full max-w-lg bg-slate-900 max-h-[90vh] overflow-y-auto ${
            cameraForm.locationType === 'ท่าเรือ'
              ? 'border-sky-500/30 shadow-[0_0_50px_rgba(56,189,248,0.2)]'
              : 'border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)]'
          }`}>
            <div className={`p-5 border-b border-slate-800 flex justify-between items-center ${
              cameraForm.locationType === 'ท่าเรือ'
                ? 'bg-gradient-to-r from-slate-900 to-sky-950/20'
                : 'bg-gradient-to-r from-slate-900 to-indigo-950/20'
            }`}>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera className={`w-5 h-5 ${cameraForm.locationType === 'ท่าเรือ' ? 'text-sky-400' : 'text-indigo-400'}`} />
                {editingCamera ? 'แก้ไขข้อมูลกล้อง' : 'เพิ่มกล้อง CCTV'}
              </h3>
              <button onClick={() => setShowCameraModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Location type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ประเภทสถานที่</label>
                <div className="flex gap-2">
                  {(['ท่าเรือ', 'ในเรือ'] as CctvLocationType[]).map(lt => (
                    <button
                      key={lt}
                      type="button"
                      onClick={() => {
                        if (lt === 'ท่าเรือ') {
                          setCameraForm(prev => ({
                            ...emptyCameraPier(),
                            images: prev.images || [],
                          }));
                        } else {
                          setCameraForm(prev => ({
                            ...emptyCameraVessel(),
                            images: prev.images || [],
                          }));
                        }
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        cameraForm.locationType === lt
                          ? lt === 'ท่าเรือ'
                            ? 'bg-sky-500/20 border-sky-500/60 text-sky-300'
                            : 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300'
                          : 'bg-black/30 border-slate-700 text-slate-500'
                      }`}
                    >
                      {lt === 'ท่าเรือ' ? <MapPin className="w-3.5 h-3.5" /> : <Ship className="w-3.5 h-3.5" />}
                      {lt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand display */}
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                cameraForm.locationType === 'ท่าเรือ'
                  ? 'bg-sky-500/10 border-sky-500/30'
                  : 'bg-indigo-500/10 border-indigo-500/30'
              }`}>
                <Camera className={`w-5 h-5 ${cameraForm.locationType === 'ท่าเรือ' ? 'text-sky-400' : 'text-indigo-400'}`} />
                <div>
                  <p className={`font-black uppercase tracking-widest text-sm ${cameraForm.locationType === 'ท่าเรือ' ? 'text-sky-300' : 'text-indigo-300'}`}>
                    {cameraForm.brand}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {cameraForm.locationType === 'ท่าเรือ' ? 'IP Camera — SD Card Storage' : 'CCTV Camera — NVR 4TB Storage'}
                  </p>
                </div>
              </div>

              {/* Location select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {cameraForm.locationType === 'ท่าเรือ' ? 'ท่าเรือ (11 ท่า)' : 'ในเรือ (7 ลำ)'}
                </label>
                <select
                  value={cameraForm.locationName}
                  onChange={e => setCameraForm(f => ({ ...f, locationName: e.target.value }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none text-sm font-bold"
                >
                  {cameraForm.locationType === 'ท่าเรือ'
                    ? CCTV_PIERS.map(p => <option key={p} value={p}>{p}</option>)
                    : CCTV_VESSELS.map(v => <option key={v} value={v}>เรือ {v}</option>)
                  }
                </select>
              </div>

              {/* Camera count */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-sky-400" /> จำนวนกล้อง (1-8 ตัว)
                </label>
                <select
                  value={cameraForm.cameraCount}
                  onChange={e => {
                    const newCount = parseInt(e.target.value);
                    const prevSNs = cameraForm.serialNumbers || [];
                    const newSNs: string[] = [];
                    for (let i = 0; i < newCount; i++) {
                      newSNs.push(prevSNs[i] || '');
                    }
                    setCameraForm(f => ({
                      ...f,
                      cameraCount: newCount,
                      serialNumbers: newSNs,
                      serialNumber: newSNs.filter(Boolean).join(', ')
                    }));
                  }}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none font-mono text-sm"
                >
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} ตัว</option>
                  ))}
                </select>
              </div>

              {/* Serial Numbers — one input per camera */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  Serial Number กล้อง ({cameraForm.cameraCount} ตัว)
                </label>
                <div className="p-3 bg-black/40 rounded-lg border border-slate-700/60 space-y-2 max-h-56 overflow-y-auto">
                  {Array.from({ length: cameraForm.cameraCount || 1 }, (_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-sky-400 font-bold w-8 shrink-0 flex items-center gap-0.5">
                        <Hash className="w-2.5 h-2.5" />{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={`S/N กล้องตัวที่ ${idx + 1}...`}
                        value={(cameraForm.serialNumbers || [])[idx] || ''}
                        onChange={e => {
                          const count = cameraForm.cameraCount || 1;
                          const prevSNs = cameraForm.serialNumbers || [];
                          const newSNs: string[] = [];
                          for (let i = 0; i < count; i++) {
                            newSNs.push(prevSNs[i] || '');
                          }
                          newSNs[idx] = e.target.value;
                          setCameraForm(f => ({
                            ...f,
                            serialNumbers: newSNs,
                            serialNumber: newSNs.filter(Boolean).join(', ')
                          }));
                        }}
                        className="flex-1 bg-black/60 border border-slate-700 rounded px-3 py-1.5 text-xs text-white focus:border-sky-500 outline-none font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage — only show memory for pier */}
              {cameraForm.locationType === 'ท่าเรือ' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-purple-400" /> เมมโมรี่การ์ด (SD Card)
                  </label>
                  <select
                    value={cameraForm.memorySize || '64 GB'}
                    onChange={e => setCameraForm(f => ({ ...f, memorySize: e.target.value as CctvMemorySize }))}
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 outline-none font-mono text-sm"
                  >
                    {MEMORY_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                  </select>
                </div>
              )}

              {/* NVR display for vessel */}
              {cameraForm.locationType === 'ในเรือ' && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-amber-300 font-bold font-mono">NVR — 4TB</p>
                    <p className="text-[10px] text-amber-700 uppercase tracking-wider">Network Video Recorder</p>
                  </div>
                </div>
              )}

              {/* Application Selector (EZVIZ / DMSS) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Application
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['EZVIZ', 'DMSS'] as CctvAppType[]).map(app => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => setCameraForm(f => ({ ...f, appType: app }))}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold font-mono border transition-all flex items-center justify-center gap-2 ${
                        cameraForm.appType === app
                          ? app === 'EZVIZ'
                            ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                            : 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                          : 'bg-black/30 border-slate-700 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      {app}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">สถานะ</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STATUS_CONFIG) as CctvStatus[]).map(s => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCameraForm(f => ({ ...f, status: s }))}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                          cameraForm.status === s
                            ? cfg.color + ' border-current'
                            : 'bg-black/30 border-slate-700 text-slate-500'
                        }`}
                      >
                        <cfg.icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Install date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> วันที่ติดตั้ง (ไม่บังคับ)
                </label>
                <input
                  type="date"
                  value={cameraForm.installDate}
                  onChange={e => setCameraForm(f => ({ ...f, installDate: e.target.value }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none font-mono"
                />
              </div>

              {/* 📷 Unlimited Photo Upload Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> รูปภาพกล้อง / สถานที่ติดตั้ง (ไม่จำกัดจำนวน)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {cameraForm.images?.length || 0} รูป
                  </span>
                </div>

                {/* Upload Button Box */}
                <input
                  ref={cameraFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleCameraImageUpload}
                  className="hidden"
                />

                <div
                  onClick={() => cameraFileInputRef.current?.click()}
                  className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-sky-500/30 hover:border-sky-400 bg-sky-950/10 hover:bg-sky-950/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center group/drop"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2 text-sky-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs font-mono">กำลังประมวลผลรูปภาพ...</span>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 rounded-full bg-sky-500/20 text-sky-400 group-hover/drop:scale-110 transition-transform">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-sky-300">คลิกเพื่ออัปโหลดรูปภาพ</p>
                      <p className="text-[10px] text-slate-500">รองรับ JPG, PNG (อัปโหลดพร้อมกันได้หลายรูปไม่จำกัด)</p>
                    </>
                  )}
                </div>

                {/* Thumbnail Grid */}
                {cameraForm.images && cameraForm.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2 max-h-48 overflow-y-auto">
                    {cameraForm.images.map((img, idx) => (
                      <div key={idx} className="relative group/thumb rounded-lg overflow-hidden border border-slate-700 aspect-square">
                        <img src={img} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeCameraImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-red-500"
                          title="ลบรูป"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openLightbox(cameraForm.images!, idx)}
                          className="absolute bottom-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-black/90"
                          title="ขยายรูป"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1 rounded bg-black/70 text-[9px] font-mono text-slate-300">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">หมายเหตุ</label>
                <textarea
                  value={cameraForm.notes}
                  onChange={e => setCameraForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="หมายเหตุเพิ่มเติม..."
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none resize-none text-sm"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowCameraModal(false)}>ยกเลิก</Button>
              <Button
                onClick={saveCamera}
                className={`text-white border-none ${cameraForm.locationType === 'ท่าเรือ' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
              >
                <Save className="w-4 h-4 mr-2" /> บันทึก
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ════ FAULT MODAL ════ */}
      {showFaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-slate-900 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-red-950/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                {editingFault ? 'แก้ไขรายการแจ้งปัญหา' : 'แจ้งปัญหา CCTV'}
              </h3>
              <button onClick={() => setShowFaultModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Location type & name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ประเภทสถานที่</label>
                <div className="flex gap-2">
                  {(['ท่าเรือ', 'ในเรือ'] as CctvLocationType[]).map(lt => (
                    <button
                      key={lt}
                      type="button"
                      onClick={() => setFaultForm(f => ({
                        ...f,
                        locationType: lt,
                        locationName: lt === 'ท่าเรือ' ? CCTV_PIERS[0] : CCTV_VESSELS[0],
                      }))}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        faultForm.locationType === lt
                          ? 'bg-red-500/20 border-red-500/60 text-red-300'
                          : 'bg-black/30 border-slate-700 text-slate-500'
                      }`}
                    >
                      {lt === 'ท่าเรือ' ? <MapPin className="w-3.5 h-3.5" /> : <Ship className="w-3.5 h-3.5" />}
                      {lt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">สถานที่</label>
                <select
                  value={faultForm.locationName}
                  onChange={e => setFaultForm(f => ({ ...f, locationName: e.target.value }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none text-sm"
                >
                  {faultForm.locationType === 'ท่าเรือ'
                    ? CCTV_PIERS.map(p => <option key={p} value={p}>{p}</option>)
                    : CCTV_VESSELS.map(v => <option key={v} value={v}>เรือ {v}</option>)
                  }
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> วันที่แจ้ง
                </label>
                <input
                  type="date"
                  value={faultForm.reportDate}
                  onChange={e => setFaultForm(f => ({ ...f, reportDate: e.target.value }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> ชื่อผู้แจ้ง
                </label>
                <input
                  type="text"
                  value={faultForm.reporterName}
                  onChange={e => setFaultForm(f => ({ ...f, reporterName: e.target.value }))}
                  placeholder="กรอกชื่อ-นามสกุล"
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-red-400 uppercase tracking-widest">สาเหตุ (เลือกได้หลายอย่าง)</label>
                <div className="grid grid-cols-2 gap-2">
                  {FAULT_CAUSES.map((cause, idx) => (
                    <button
                      key={cause}
                      type="button"
                      onClick={() => toggleFaultCause(cause)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold border transition-all text-left ${
                        faultForm.faultCauses.includes(cause)
                          ? `${FAULT_COLORS[cause] || 'bg-slate-800 text-white'} border-current`
                          : 'bg-black/30 border-slate-700 text-slate-500'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px] shrink-0 font-mono">
                        {idx + 1}
                      </span>
                      {cause}
                    </button>
                  ))}
                </div>
              </div>

              {/* 📷 Fault Photos */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> แนบรูปภาพปัญหา (ไม่จำกัดจำนวน)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {faultForm.images?.length || 0} รูป
                  </span>
                </div>

                <input
                  ref={faultFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFaultImageUpload}
                  className="hidden"
                />

                <div
                  onClick={() => faultFileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-red-500/30 hover:border-red-400 bg-red-950/10 hover:bg-red-950/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center"
                >
                  <Upload className="w-4 h-4 text-red-400" />
                  <p className="text-xs font-bold text-red-300">คลิกเพื่ออัปโหลดรูปภาพปัญหา</p>
                </div>

                {faultForm.images && faultForm.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2 max-h-36 overflow-y-auto">
                    {faultForm.images.map((img, idx) => (
                      <div key={idx} className="relative group/thumb rounded-lg overflow-hidden border border-slate-700 aspect-square">
                        <img src={img} alt={`fault-thumb-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFaultImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 p-3 rounded-lg bg-black/30 border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={faultForm.isFixed}
                    onChange={e => setFaultForm(f => ({ ...f, isFixed: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">แก้ไขเสร็จเรียบร้อย</span>
                </label>
                {faultForm.isFixed && (
                  <input
                    type="date"
                    value={faultForm.fixedDate}
                    onChange={e => setFaultForm(f => ({ ...f, fixedDate: e.target.value }))}
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none font-mono"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">รายละเอียดเพิ่มเติม</label>
                <textarea
                  value={faultForm.causeDetails}
                  onChange={e => setFaultForm(f => ({ ...f, causeDetails: e.target.value }))}
                  rows={2}
                  placeholder="อธิบายรายละเอียดเพิ่มเติม..."
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none resize-none text-sm"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowFaultModal(false)}>ยกเลิก</Button>
              <Button onClick={saveFault} className="bg-red-600 hover:bg-red-500 text-white border-none">
                <Save className="w-4 h-4 mr-2" /> บันทึก
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ════ LIGHTBOX IMAGE VIEWER MODAL ════ */}
      {lightboxImages && lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <button
            onClick={() => setLightboxImages(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {lightboxImages.length > 1 && (
            <>
              <button
                onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition-all z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition-all z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="flex flex-col items-center max-w-4xl max-h-[85vh] w-full">
            <img
              src={lightboxImages[lightboxIndex]}
              alt={`cctv-full-${lightboxIndex}`}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl border border-slate-800"
            />
            <div className="mt-3 px-4 py-1.5 rounded-full bg-black/60 border border-slate-800 text-slate-300 text-xs font-mono">
              รูปที่ {lightboxIndex + 1} จากทั้งหมด {lightboxImages.length} รูป
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
