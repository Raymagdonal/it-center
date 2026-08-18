import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Video, Plus, X, Save, Search, Edit, Trash2, AlertTriangle,
  CheckCircle, MapPin, Ship, User, Calendar, HardDrive,
  Camera, Eye, Layers, ShieldCheck, Database, Smartphone,
  Upload, Image as ImageIcon, Maximize2, ChevronLeft, ChevronRight, Loader2,
  WifiOff, LayoutGrid, ExternalLink, Tag, Hash, Wifi, Radio, Phone
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { compressImage } from '../utils/storageUtils';

// โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// Types
// โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€

export const CCTV_PIERS = [
  'เธ—เนเธฒเธเธฃเธฐเธญเธฒเธ—เธดเธ•เธขเน',
  'เธ—เนเธฒเธเธฃเธฒเธเธเธ',
  'เธ—เนเธฒเธกเธซเธฒเธฃเธฒเธ',
  'เธ—เนเธฒเธเนเธฒเธ',
  'เธ—เนเธฒเธงเธฑเธ”เธญเธฃเธธเธ“เธฏ',
  'เธ—เนเธฒเธฃเธฒเธเธดเธเธต',
  'เธ—เนเธฒเธฃเธฒเธเธงเธเธจเน',
  'เธ—เนเธฒเนเธญเธเธญเธเธชเธขเธฒเธก',
  'เธ—เนเธฒเธชเธฒเธ—เธฃ',
  'BTS เธชเธฐเธเธฒเธเธ•เธฒเธเธชเธดเธ',
  'เธ—เนเธฒเน€เธญเน€เธเธตเธขเธ—เธตเธ',
] as const;

export const CCTV_VESSELS = [
  'CTB 1',
  'CTB 2',
  'CTB 3',
  'R 1',
  'R 2',
  'R 3',
  'R 4',
] as const;

export type PierName = typeof CCTV_PIERS[number];
export type VesselName = typeof CCTV_VESSELS[number];

export type CctvMemorySize = '32 GB' | '64 GB' | '128 GB' | '256 GB';
export type CctvLocationType = 'เธ—เนเธฒเน€เธฃเธทเธญ' | 'เนเธเน€เธฃเธทเธญ';
export type CctvStatus = 'เธเธเธ•เธด' | 'เธกเธตเธเธฑเธเธซเธฒ' | 'เธเนเธญเธกเธเธณเธฃเธธเธ' | 'เธญเธญเธเนเธฅเธเน';
export type CctvAppType = 'EZVIZ' | 'DMSS';

export type CctvFaultCause =
  | 'เนเธเธ”เธฑเธ'
  | 'เธซเธกเนเธญเนเธเธฅเธเน€เธชเธตเธข'
  | 'เธชเธฒเธขเนเธฅเธเธซเธฅเธธเธ”/เธเธฒเธ”'
  | 'เธเธฅเนเธญเธเธญเธญเธเนเธฅเธเน'
  | 'เธเธดเธกเน€เธเนเธ•เธซเธกเธ”เธญเธฒเธขเธธ/เนเธกเนเธกเธตเธชเธฑเธเธเธฒเธ“'
  | 'เธเธฒเธฃเนเธ”เธซเธเนเธงเธขเธเธงเธฒเธกเธเธณเน€เธชเธตเธข'
  | 'เน€เธเธฃเธทเนเธญเธเธเธฑเธเธ—เธถเธ NVR เน€เธชเธตเธข'
  | 'เธกเธธเธกเธเธฅเนเธญเธเน€เธเธฅเธทเนเธญเธ'
  | 'เธเธฅเนเธญเธเนเธกเนเธเธฑเธเธ—เธถเธ'
  | 'เนเธเนเธเธฒเธเนเธ”เนเธเธเธ•เธด';

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
  nvrModel?: string;              // NVR Model / Name e.g. "Dahua NVR 16CH (4TB)"
  nvrSerialNumber?: string;       // S/N เธเธญเธเน€เธเธฃเธทเนเธญเธ NVR 16CH
  nvrImages?: string[];           // เธฃเธนเธเธ เธฒเธเน€เธเธฃเธทเนเธญเธ NVR 16CH
  routerModel?: string;           // Router #1 4G Model / Name
  routerSerialNumber?: string;    // Router #1 4G S/N
  simPhoneNumber?: string;        // เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เนเธเธดเธก AIS #1
  routerImages?: string[];        // Router #1 4G Photos
  router2Model?: string;          // Router #2 4G Model / Name
  router2SerialNumber?: string;   // Router #2 4G S/N
  router2SimPhoneNumber?: string; // เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เนเธเธดเธก AIS #2
  router2Images?: string[];       // Router #2 4G Photos
  routerCount?: 1 | 2;           // เธเธณเธเธงเธ Router (1 เธซเธฃเธทเธญ 2)
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

// โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// Default Mockup Cameras (11 Piers EZVIZ + 7 Vessels Dahua)
// โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€

export const DEFAULT_CCTV_CAMERAS: CctvCamera[] = [
  // 11 Piers (EZVIZ - SD Card)
  {
    id: 'cctv_pier_1',
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
    locationName: 'เธ—เนเธฒเธเธฃเธฐเธญเธฒเธ—เธดเธ•เธขเน',
    brand: 'EZVIZ',
    cameraCount: 2,
    storageType: 'SD Card',
    memorySize: '64 GB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-10',
    appType: 'EZVIZ',
    notes: 'เธเธฅเนเธญเธ IP Camera EZVIZ เธ—เธฒเธเน€เธเนเธฒ-เธญเธญเธเธ—เนเธฒเน€เธฃเธทเธญ',
    images: [],
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_2',
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
    locationName: 'เธ—เนเธฒเธเธฃเธฒเธเธเธ',
    brand: 'EZVIZ',
    cameraCount: 3,
    storageType: 'SD Card',
    memorySize: '128 GB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-12',
    appType: 'EZVIZ',
    notes: 'เธเธฅเนเธญเธ EZVIZ เธชเนเธญเธเนเธเนเธฐเน€เธ—เธตเธขเธเน€เธฃเธทเธญเนเธฅเธฐเธเธธเธ”เธเธณเธซเธเนเธฒเธขเธ•เธฑเนเธง',
    images: [],
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_3',
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
    locationName: 'เธ—เนเธฒเธกเธซเธฒเธฃเธฒเธ',
    brand: 'EZVIZ',
    cameraCount: 2,
    storageType: 'SD Card',
    memorySize: '64 GB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-15',
    appType: 'EZVIZ',
    notes: 'เธเธฅเนเธญเธ EZVIZ เธชเนเธญเธเธ—เธฒเธเน€เธ”เธดเธเนเธฅเธฐเนเธเนเธฐเน€เธฃเธทเธญ',
    images: [],
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_4',
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
    locationName: 'เธ—เนเธฒเธเนเธฒเธ',
    brand: 'EZVIZ',
    cameraCount: 4,
    storageType: 'SD Card',
    memorySize: '128 GB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-18',
    appType: 'EZVIZ',
    notes: 'เธเธฅเนเธญเธ EZVIZ เธเธธเธ”เธ•เนเธญเนเธ–เธงเธเธนเนเนเธ”เธขเธชเธฒเธฃ 4 เธกเธธเธก',
    images: [],
    createdAt: '2026-01-18T08:00:00.000Z',
    updatedAt: '2026-01-18T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_5',
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
    locationName: 'เธ—เนเธฒเธงเธฑเธ”เธญเธฃเธธเธ“เธฏ',
    brand: 'EZVIZ',
    cameraCount: 2,
    storageType: 'SD Card',
    memorySize: '64 GB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-20',
    appType: 'EZVIZ',
    notes: 'เธเธฅเนเธญเธ EZVIZ เธซเธเนเธฒเธงเธฑเธ”เนเธฅเธฐเนเธเนเธฐเน€เธ—เธตเธขเธเน€เธฃเธทเธญ',
    images: [],
    createdAt: '2026-01-20T08:00:00.000Z',
    updatedAt: '2026-01-20T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_6',
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
    locationName: 'เธ—เนเธฒเธฃเธฒเธเธดเธเธต',
    brand: 'EZVIZ',
    cameraCount: 2,
    storageType: 'SD Card',
    memorySize: '64 GB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-22',
    appType: 'EZVIZ',
    notes: 'เธเธฅเนเธญเธ EZVIZ เธ—เธฒเธเน€เธเธทเนเธญเธก MRT เธชเธเธฒเธกเนเธเธข',
    images: [],
    createdAt: '2026-01-22T08:00:00.000Z',
    updatedAt: '2026-01-22T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_7',
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
    locationName: 'เธ—เนเธฒเธฃเธฒเธเธงเธเธจเน',
    brand: 'EZVIZ',
    cameraCount: 3,
    storageType: 'SD Card',
    memorySize: '128 GB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-25',
    appType: 'EZVIZ',
    notes: 'เธเธฅเนเธญเธ EZVIZ เนเธเธเน€เธขเธฒเธงเธฃเธฒเธเนเธฅเธฐเธ—เธฒเธเธเธถเนเธเน€เธฃเธทเธญ',
    images: [],
    createdAt: '2026-01-25T08:00:00.000Z',
    updatedAt: '2026-01-25T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_8',
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
    locationName: 'เธ—เนเธฒเนเธญเธเธญเธเธชเธขเธฒเธก',
    brand: 'EZVIZ',
    cameraCount: 4,
    storageType: 'SD Card',
    memorySize: '256 GB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-28',
    appType: 'EZVIZ',
    notes: 'เธเธฅเนเธญเธ EZVIZ เธซเธเนเธฒเธซเนเธฒเธเนเธญเธเธญเธเธชเธขเธฒเธก 4 เธเธธเธ”',
    images: [],
    createdAt: '2026-01-28T08:00:00.000Z',
    updatedAt: '2026-01-28T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_9',
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
    locationName: 'เธ—เนเธฒเธชเธฒเธ—เธฃ',
    brand: 'EZVIZ',
    cameraCount: 4,
    storageType: 'SD Card',
    memorySize: '256 GB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-02-01',
    appType: 'EZVIZ',
    notes: 'เธจเธนเธเธขเนเธเธฅเธฒเธเธ—เนเธฒเน€เธฃเธทเธญเธชเธฒเธ—เธฃ เธเธฅเนเธญเธ EZVIZ 4 เธ•เธฑเธง',
    images: [],
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_10',
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
    locationName: 'BTS เธชเธฐเธเธฒเธเธ•เธฒเธเธชเธดเธ',
    brand: 'EZVIZ',
    cameraCount: 2,
    storageType: 'SD Card',
    memorySize: '128 GB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-02-03',
    appType: 'EZVIZ',
    notes: 'เธเธฅเนเธญเธ EZVIZ เธเธฑเธเนเธ”เธ—เธฒเธเน€เธเธทเนเธญเธกเธชเธ–เธฒเธเธต BTS',
    images: [],
    createdAt: '2026-02-03T08:00:00.000Z',
    updatedAt: '2026-02-03T08:00:00.000Z',
  },
  {
    id: 'cctv_pier_11',
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
    locationName: 'เธ—เนเธฒเน€เธญเน€เธเธตเธขเธ—เธตเธ',
    brand: 'EZVIZ',
    cameraCount: 3,
    storageType: 'SD Card',
    memorySize: '128 GB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-02-05',
    appType: 'EZVIZ',
    notes: 'เธเธฅเนเธญเธ EZVIZ เนเธเธเธฅเธฒเธเธเธดเธเธเธฃเธฃเธกเนเธฅเธฐเนเธเนเธฐเน€เธฃเธทเธญ',
    images: [],
    createdAt: '2026-02-05T08:00:00.000Z',
    updatedAt: '2026-02-05T08:00:00.000Z',
  },

  // 7 Vessels (Dahua - NVR 4TB)
  {
    id: 'cctv_vessel_1',
    locationType: 'เนเธเน€เธฃเธทเธญ',
    locationName: 'CTB1',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-10',
    appType: 'DMSS',
    notes: 'เธฃเธฐเธเธเธเธฅเนเธญเธ Dahua 4 เธเธธเธ” เธซเธฑเธงเน€เธฃเธทเธญ, เธ—เนเธฒเธขเน€เธฃเธทเธญ, เธซเนเธญเธเนเธ”เธขเธชเธฒเธฃ, เธซเนเธญเธเธเธฑเธเธ•เธฑเธ เธเธฃเนเธญเธกเน€เธเธฃเธทเนเธญเธเธเธฑเธเธ—เธถเธ NVR 4TB',
    images: [],
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'cctv_vessel_2',
    locationType: 'เนเธเน€เธฃเธทเธญ',
    locationName: 'CTB2',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-12',
    appType: 'DMSS',
    notes: 'เธฃเธฐเธเธเธเธฅเนเธญเธ Dahua 4 เธเธธเธ” เธเธฃเนเธญเธกเน€เธเธฃเธทเนเธญเธเธเธฑเธเธ—เธถเธ NVR 4TB',
    images: [],
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'cctv_vessel_3',
    locationType: 'เนเธเน€เธฃเธทเธญ',
    locationName: 'CTB3',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-15',
    appType: 'DMSS',
    notes: 'เธฃเธฐเธเธเธเธฅเนเธญเธ Dahua 4 เธเธธเธ” เธเธฃเนเธญเธกเน€เธเธฃเธทเนเธญเธเธเธฑเธเธ—เธถเธ NVR 4TB',
    images: [],
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'cctv_vessel_4',
    locationType: 'เนเธเน€เธฃเธทเธญ',
    locationName: 'R1',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-18',
    appType: 'DMSS',
    notes: 'เธฃเธฐเธเธเธเธฅเนเธญเธ Dahua 4 เธเธธเธ” เธเธฃเนเธญเธกเน€เธเธฃเธทเนเธญเธเธเธฑเธเธ—เธถเธ NVR 4TB',
    images: [],
    createdAt: '2026-01-18T08:00:00.000Z',
    updatedAt: '2026-01-18T08:00:00.000Z',
  },
  {
    id: 'cctv_vessel_5',
    locationType: 'เนเธเน€เธฃเธทเธญ',
    locationName: 'R2',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-20',
    appType: 'DMSS',
    notes: 'เธฃเธฐเธเธเธเธฅเนเธญเธ Dahua 4 เธเธธเธ” เธเธฃเนเธญเธกเน€เธเธฃเธทเนเธญเธเธเธฑเธเธ—เธถเธ NVR 4TB',
    images: [],
    createdAt: '2026-01-20T08:00:00.000Z',
    updatedAt: '2026-01-20T08:00:00.000Z',
  },
  {
    id: 'cctv_vessel_6',
    locationType: 'เนเธเน€เธฃเธทเธญ',
    locationName: 'R3',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-22',
    appType: 'DMSS',
    notes: 'เธฃเธฐเธเธเธเธฅเนเธญเธ Dahua 4 เธเธธเธ” เธเธฃเนเธญเธกเน€เธเธฃเธทเนเธญเธเธเธฑเธเธ—เธถเธ NVR 4TB',
    images: [],
    createdAt: '2026-01-22T08:00:00.000Z',
    updatedAt: '2026-01-22T08:00:00.000Z',
  },
  {
    id: 'cctv_vessel_7',
    locationType: 'เนเธเน€เธฃเธทเธญ',
    locationName: 'R4',
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'เธเธเธ•เธด',
    installDate: '2026-01-25',
    appType: 'DMSS',
    notes: 'เธฃเธฐเธเธเธเธฅเนเธญเธ Dahua 4 เธเธธเธ” เธเธฃเนเธญเธกเน€เธเธฃเธทเนเธญเธเธเธฑเธเธ—เธถเธ NVR 4TB',
    images: [],
    createdAt: '2026-01-25T08:00:00.000Z',
    updatedAt: '2026-01-25T08:00:00.000Z',
  },
];

// โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// Constants & Colors
// โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€

const MEMORY_SIZES: CctvMemorySize[] = ['32 GB', '64 GB', '128 GB', '256 GB'];

const FAULT_CAUSES: CctvFaultCause[] = [
  'เธเธฅเนเธญเธเธ”เธฑเธ',
  'เธเธฃเธฐเธ•เธธเธ',
  'เธ”เธน Online เนเธกเนเนเธ”เน',
  'เธเธฅเนเธญเธเนเธกเนเธเธฑเธเธ—เธถเธ',
  'เนเธเนเธเธฒเธเนเธ”เนเธเธเธ•เธด',
];

const FAULT_COLORS: Record<CctvFaultCause, string> = {
  'เธเธฅเนเธญเธเธ”เธฑเธ':          'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'เธเธฃเธฐเธ•เธธเธ':            'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'เธ”เธน Online เนเธกเนเนเธ”เน':   'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'เธเธฅเนเธญเธเนเธกเนเธเธฑเธเธ—เธถเธ':     'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'เนเธเนเธเธฒเธเนเธ”เนเธเธเธ•เธด':     'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

const STATUS_CONFIG: Record<CctvStatus, { label: string; color: string; icon: React.FC<any> }> = {
  'เธเธเธ•เธด':     { label: 'เธเธเธ•เธด',     color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: CheckCircle },
  'เธกเธตเธเธฑเธเธซเธฒ':  { label: 'เธกเธตเธเธฑเธเธซเธฒ', color: 'bg-red-500/15 text-red-300 border-red-500/30',             icon: AlertTriangle },
  'เธเนเธญเธกเธเธณเธฃเธธเธ':{ label: 'เธเนเธญเธกเธเธณเธฃเธธเธ',color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',       icon: AlertTriangle },
  'เธญเธญเธเนเธฅเธเน': { label: 'เธญเธญเธเนเธฅเธเน', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30',        icon: WifiOff },
};

// โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// Helper
// โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€

const todayDate = () => new Date().toISOString().split('T')[0];

const formatDateThai = (dt: string) => {
  if (!dt) return '-';
  return new Date(dt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
};

// โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// Props
// โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€

interface CctvManagerProps {
  data: CctvData;
  onUpdate: (data: CctvData) => void;
}

// โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// Component
// โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€

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
  const routerFileInputRef = useRef<HTMLInputElement | null>(null);
  const nvrFileInputRef = useRef<HTMLInputElement | null>(null);
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

  // โ”€โ”€ Camera form state โ”€โ”€
  const emptyCameraPier = (): Omit<CctvCamera, 'id' | 'createdAt' | 'updatedAt'> => ({
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
    locationName: CCTV_PIERS[0],
    brand: 'EZVIZ',
    cameraCount: 2,
    serialNumbers: ['', ''],
    serialNumber: '',
    storageType: 'SD Card',
    memorySize: '64 GB',
    routerModel: 'Router 4G',
    routerSerialNumber: '',
    simPhoneNumber: '',
    routerImages: [],
    routerCount: 1,
    router2Model: 'Router 4G',
    router2SerialNumber: '',
    router2SimPhoneNumber: '',
    router2Images: [],
    status: 'เธเธเธ•เธด',
    installDate: '',
    appType: 'EZVIZ',
    notes: '',
    images: [],
  });

  const emptyCameraVessel = (): Omit<CctvCamera, 'id' | 'createdAt' | 'updatedAt'> => ({
    locationType: 'เนเธเน€เธฃเธทเธญ',
    locationName: CCTV_VESSELS[0],
    brand: 'Dahua',
    cameraCount: 4,
    serialNumbers: ['', '', '', ''],
    serialNumber: '',
    storageType: 'NVR',
    nvrCapacity: '4TB',
    nvrModel: 'Dahua NVR 16CH (4TB)',
    nvrSerialNumber: '',
    nvrImages: [],
    routerModel: 'Router 4G',
    routerSerialNumber: '',
    simPhoneNumber: '',
    routerImages: [],
    routerCount: 1,
    router2Model: 'Router 4G',
    router2SerialNumber: '',
    router2SimPhoneNumber: '',
    router2Images: [],
    status: 'เธเธเธ•เธด',
    installDate: '',
    appType: 'DMSS',
    notes: '',
    images: [],
  });

  const [cameraForm, setCameraForm] = useState(
    registryTab === 'pier' ? emptyCameraPier() : emptyCameraVessel()
  );

  // โ”€โ”€ Fault form state โ”€โ”€
  const emptyFault = (): Omit<CctvFaultLog, 'id' | 'createdAt'> => ({
    locationType: 'เธ—เนเธฒเน€เธฃเธทเธญ',
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

  // โ”€โ”€ Cameras by type โ”€โ”€
  const pierCameras = useMemo(() =>
    cameras.filter(c => c.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ')
      .sort((a, b) => CCTV_PIERS.indexOf(a.locationName as PierName) - CCTV_PIERS.indexOf(b.locationName as PierName)),
    [cameras]
  );

  const vesselCameras = useMemo(() =>
    cameras.filter(c => c.locationType === 'เนเธเน€เธฃเธทเธญ')
      .sort((a, b) => CCTV_VESSELS.indexOf(a.locationName as VesselName) - CCTV_VESSELS.indexOf(b.locationName as VesselName)),
    [cameras]
  );

  const totalCameraCount = useMemo(() =>
    cameras.reduce((sum, c) => sum + c.cameraCount, 0),
    [cameras]
  );

  const faultyCameras = cameras.filter(c => c.status !== 'เธเธเธ•เธด').length;
  const activeFaults = faultLogs.filter(l => !l.isFixed).length;

  // โ”€โ”€ Image Upload Handlers โ”€โ”€
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

  const handleRouterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        console.error('Error compressing router image:', err);
      }
    }

    setCameraForm(prev => ({
      ...prev,
      routerImages: [...(prev.routerImages || []), ...newImages],
    }));

    setIsUploading(false);
    if (routerFileInputRef.current) {
      routerFileInputRef.current.value = '';
    }
  };

  const removeRouterImage = (indexToRemove: number) => {
    setCameraForm(prev => ({
      ...prev,
      routerImages: (prev.routerImages || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleNvrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        console.error('Error compressing NVR image:', err);
      }
    }

    setCameraForm(prev => ({
      ...prev,
      nvrImages: [...(prev.nvrImages || []), ...newImages],
    }));

    setIsUploading(false);
    if (nvrFileInputRef.current) {
      nvrFileInputRef.current.value = '';
    }
  };

  const removeNvrImage = (indexToRemove: number) => {
    setCameraForm(prev => ({
      ...prev,
      nvrImages: (prev.nvrImages || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const router2FileInputRef = useRef<HTMLInputElement | null>(null);

  const handleRouter2ImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        console.error('Error compressing router2 image:', err);
      }
    }

    setCameraForm(prev => ({
      ...prev,
      router2Images: [...(prev.router2Images || []), ...newImages],
    }));

    setIsUploading(false);
    if (router2FileInputRef.current) {
      router2FileInputRef.current.value = '';
    }
  };

  const removeRouter2Image = (indexToRemove: number) => {
    setCameraForm(prev => ({
      ...prev,
      router2Images: (prev.router2Images || []).filter((_, idx) => idx !== indexToRemove),
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

  // โ”€โ”€ Camera CRUD โ”€โ”€
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
      nvrModel: cam.nvrModel || 'Dahua NVR 16CH (4TB)',
      nvrSerialNumber: cam.nvrSerialNumber || '',
      nvrImages: cam.nvrImages || [],
      routerModel: cam.routerModel || 'Router 4G',
      routerSerialNumber: cam.routerSerialNumber || '',
      simPhoneNumber: cam.simPhoneNumber || '',
      routerImages: cam.routerImages || [],
      routerCount: cam.routerCount || 1,
      router2Model: cam.router2Model || 'Router 4G',
      router2SerialNumber: cam.router2SerialNumber || '',
      router2SimPhoneNumber: cam.router2SimPhoneNumber || '',
      router2Images: cam.router2Images || [],
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

  // โ”€โ”€ Fault CRUD โ”€โ”€
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
    if (!confirm('เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฅเธเธฃเธฒเธขเธเธฒเธฃเธเธตเน?')) return;
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

  // โ”€โ”€ Render camera card โ”€โ”€
  const renderCameraCard = (cam: CctvCamera) => {
    const isPier = cam.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ';
    const statusCfg = STATUS_CONFIG[cam.status] || STATUS_CONFIG['เธเธเธ•เธด'];
    const StatusIcon = statusCfg.icon;
    const hasImages = Array.isArray(cam.images) && cam.images.length > 0;
    const currentApp = cam.appType || (isPier ? 'EZVIZ' : 'DMSS');

    return (
      <div key={cam.id} className={`group relative bg-slate-900/60 border rounded-xl overflow-hidden transition-all hover:border-sky-500/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] flex flex-col justify-between ${
        cam.status !== 'เธเธเธ•เธด' ? 'border-red-500/40' : 'border-slate-700/60'
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
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-mono">เธเธณเธเธงเธเธเธฅเนเธญเธ</p>
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-sky-400" />
                  <p className="text-sky-300 font-bold font-mono text-sm">{cam.cameraCount} เธ•เธฑเธง</p>
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
                  เธ•เธดเธ”เธ•เธฑเนเธ: {formatDateThai(cam.installDate)}
                </p>
              )}
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <Smartphone className="w-3 h-3 text-cyan-400" />
                Application: <span className="font-bold text-cyan-300">{currentApp}</span>
              </p>
            </div>

            {/* Serial Numbers display โ€” show if any S/N recorded */}
            {cam.serialNumbers && cam.serialNumbers.some(Boolean) && (
              <div className="mt-2.5 p-2 bg-black/20 rounded-lg border border-slate-800/60">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5 text-cyan-500" /> Serial Numbers
                </p>
                <div className="space-y-0.5">
                  {cam.serialNumbers.map((sn, idx) => (
                    <p key={idx} className="text-[10px] font-mono flex items-center gap-1.5">
                      <span className="text-sky-500 font-bold w-5 shrink-0">#{idx + 1}</span>
                      <span className="text-slate-300 truncate">{sn || <span className="text-slate-600 italic">เนเธกเนเธฃเธฐเธเธธ</span>}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* NVR 16CH Display in Card (for vessels) */}
            {(cam.locationType === 'เนเธเน€เธฃเธทเธญ' || cam.nvrSerialNumber || (cam.nvrImages && cam.nvrImages.length > 0)) && (
              <div className="mt-2.5 p-2 bg-black/30 rounded-lg border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1 font-bold">
                    <HardDrive className="w-3 h-3 text-amber-400" /> {cam.nvrModel || 'Dahua NVR 16CH (4TB)'}
                  </p>
                  {cam.nvrImages && cam.nvrImages.length > 0 && (
                    <button
                      onClick={() => openLightbox(cam.nvrImages!, 0)}
                      className="text-[9px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-0.5"
                    >
                      <ImageIcon className="w-2.5 h-2.5" /> เธฃเธนเธ NVR ({cam.nvrImages.length})
                    </button>
                  )}
                </div>
                {cam.nvrSerialNumber && (
                  <p className="text-[10px] font-mono text-slate-300">
                    <span className="text-slate-500">S/N:</span> <span className="text-amber-300 font-bold">{cam.nvrSerialNumber}</span>
                  </p>
                )}
                {cam.nvrImages && cam.nvrImages.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pt-0.5 pb-0.5">
                    {cam.nvrImages.map((nImg, nIdx) => (
                      <div
                        key={nIdx}
                        onClick={() => openLightbox(cam.nvrImages!, nIdx)}
                        className="w-12 h-12 rounded-lg border border-amber-500/40 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shrink-0 relative group/nimg"
                      >
                        <img src={nImg} alt={`NVR-${nIdx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Router 4G Display in Card */}
            {(cam.routerSerialNumber || cam.simPhoneNumber || (cam.routerImages && cam.routerImages.length > 0)) && (
              <div className="mt-2.5 p-2 bg-black/30 rounded-lg border border-cyan-900/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1 font-bold">
                    <Wifi className="w-3 h-3 text-cyan-400" /> {cam.routerModel || 'Router 4G'}
                  </p>
                  {cam.routerImages && cam.routerImages.length > 0 && (
                    <button
                      onClick={() => openLightbox(cam.routerImages!, 0)}
                      className="text-[9px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-0.5"
                    >
                      <ImageIcon className="w-2.5 h-2.5" /> เธฃเธนเธ Router ({cam.routerImages.length})
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] font-mono">
                  {cam.routerSerialNumber && (
                    <p className="text-slate-300 truncate">
                      <span className="text-slate-500">S/N:</span> <span className="text-cyan-300 font-bold">{cam.routerSerialNumber}</span>
                    </p>
                  )}
                  {cam.simPhoneNumber && (
                    <p className="text-emerald-300 truncate flex items-center gap-1 font-bold">
                      <Phone className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span className="text-slate-400">เธเธดเธก AIS:</span> {cam.simPhoneNumber}
                    </p>
                  )}
                </div>
                {cam.routerImages && cam.routerImages.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pt-0.5 pb-0.5">
                    {cam.routerImages.map((rImg, rIdx) => (
                      <div
                        key={rIdx}
                        onClick={() => openLightbox(cam.routerImages!, rIdx)}
                        className="w-12 h-12 rounded-lg border border-cyan-900/60 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shrink-0 relative group/rimg"
                      >
                        <img src={rImg} alt={`Router-${rIdx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Router #2 Display in Card */}
            {(cam.routerCount || 1) >= 2 && (cam.router2SerialNumber || cam.router2SimPhoneNumber || (cam.router2Images && cam.router2Images.length > 0)) && (
              <div className="mt-2 p-2 bg-black/30 rounded-lg border border-cyan-800/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1 font-bold">
                    <Wifi className="w-3 h-3 text-cyan-400" /> {cam.router2Model || 'Router 4G'}
                    <span className="ml-1 text-[8px] bg-cyan-500/20 px-1 py-0.5 rounded">#2</span>
                  </p>
                  {cam.router2Images && cam.router2Images.length > 0 && (
                    <button onClick={() => openLightbox(cam.router2Images!, 0)} className="text-[9px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-0.5">
                      <ImageIcon className="w-2.5 h-2.5" /> รูป ({cam.router2Images.length})
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] font-mono">
                  {cam.router2SerialNumber && (
                    <p className="text-slate-300 truncate">
                      <span className="text-slate-500">S/N:</span> <span className="text-cyan-300 font-bold">{cam.router2SerialNumber}</span>
                    </p>
                  )}
                  {cam.router2SimPhoneNumber && (
                    <p className="text-emerald-300 truncate flex items-center gap-1 font-bold">
                      <Phone className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span className="text-slate-400">ซิม AIS:</span> {cam.router2SimPhoneNumber}
                    </p>
                  )}
                </div>
                {cam.router2Images && cam.router2Images.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pt-0.5 pb-0.5">
                    {cam.router2Images.map((rImg, rIdx) => (
                      <div key={rIdx} onClick={() => openLightbox(cam.router2Images!, rIdx)} className="w-12 h-12 rounded-lg border border-cyan-800/50 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shrink-0">
                        <img src={rImg} alt={`Router2-${rIdx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
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
                    <ImageIcon className="w-3 h-3 text-sky-400" /> เธฃเธนเธเธ เธฒเธเธเธฅเนเธญเธ ({cam.images!.length} เธฃเธนเธ)
                  </span>
                  <button
                    onClick={() => openLightbox(cam.images!, 0)}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-mono flex items-center gap-0.5"
                  >
                    <Maximize2 className="w-2.5 h-2.5" /> เธ”เธนเธ—เธฑเนเธเธซเธกเธ”
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
            title="เนเธเนเนเธเธเนเธญเธกเธนเธฅเธเธฅเนเธญเธ"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteCamera(cam.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-full transition-all"
            title="เธฅเธเธเธฅเนเธญเธ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-5 animate-in fade-in duration-500">

      {/* โ”€โ”€ Header โ”€โ”€ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-sky-500/20 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-3">
            <Video className="h-8 w-8 text-sky-400" />
            CCTV
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-[10px] uppercase tracking-widest">
            CCTV Surveillance System โ€ข 11 เธ—เนเธฒเน€เธฃเธทเธญ (EZVIZ) & 7 เนเธเน€เธฃเธทเธญ (Dahua)
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
              <div className="text-[9px] text-sky-600 uppercase font-bold tracking-wider">เธเธธเธ” CCTV</div>
            </div>
            <div className="bg-black border border-emerald-900/50 rounded-lg px-3.5 py-2 text-center">
              <div className="text-xl font-bold text-emerald-400 font-mono">{totalCameraCount}</div>
              <div className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider">เธเธฅเนเธญเธเธ—เธฑเนเธเธซเธกเธ”</div>
            </div>
            <div className="bg-black border border-cyan-900/50 rounded-lg px-3.5 py-2 text-center">
              <div className="text-xl font-bold text-cyan-400 font-mono">{pierCameras.length}</div>
              <div className="text-[9px] text-cyan-600 uppercase font-bold tracking-wider">เธ—เนเธฒเน€เธฃเธทเธญ</div>
            </div>
            <div className="bg-black border border-blue-900/50 rounded-lg px-3.5 py-2 text-center">
              <div className="text-xl font-bold text-blue-400 font-mono">{vesselCameras.length}</div>
              <div className="text-[9px] text-blue-600 uppercase font-bold tracking-wider">เนเธเน€เธฃเธทเธญ</div>
            </div>
            {faultyCameras > 0 && (
              <div className="bg-black border border-red-900/50 rounded-lg px-3.5 py-2 text-center animate-pulse">
                <div className="text-xl font-bold text-red-400 font-mono">{faultyCameras}</div>
                <div className="text-[9px] text-red-600 uppercase font-bold tracking-wider">เธกเธตเธเธฑเธเธซเธฒ</div>
              </div>
            )}
            {activeFaults > 0 && (
              <div className="bg-black border border-amber-900/50 rounded-lg px-3.5 py-2 text-center animate-pulse">
                <div className="text-xl font-bold text-amber-400 font-mono">{activeFaults}</div>
                <div className="text-[9px] text-amber-600 uppercase font-bold tracking-wider">เนเธเนเธเธเนเธฒเธเธญเธขเธนเน</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* โ”€โ”€ Main Tabs โ”€โ”€ */}
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
          เธ—เธณเน€เธเธตเธขเธเธเธฅเนเธญเธ ({cameras.length})
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
          เนเธเนเธเธเธฑเธเธซเธฒ CCTV ({faultLogs.length})
          {activeFaults > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-black text-[10px] font-bold rounded-full">{activeFaults}</span>
          )}
        </button>
      </div>

      {/* โ•โ•โ•โ• REGISTRY TAB โ•โ•โ•โ• */}
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
                เธ—เนเธฒเน€เธฃเธทเธญ โ€” EZVIZ ({pierCameras.length}/{CCTV_PIERS.length})
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
                เนเธเน€เธฃเธทเธญ โ€” Dahua ({vesselCameras.length}/{CCTV_VESSELS.length})
              </button>
            </div>
            <Button
              onClick={openAddCamera}
              className={`text-white border-none ${registryTab === 'pier' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              เน€เธเธดเนเธก{registryTab === 'pier' ? 'เธเธฅเนเธญเธเธ—เนเธฒเน€เธฃเธทเธญ (EZVIZ)' : 'เธเธฅเนเธญเธเนเธเน€เธฃเธทเธญ (Dahua)'}
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
                          ? cam.status !== 'เธเธเธ•เธด'
                            ? 'bg-red-500/15 text-red-300 border-red-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800/50 text-slate-500 border-slate-700'
                      }`}
                    >
                      {cam ? 'โ“ ' : 'โ€” '}{pier}
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
                          ? cam.status !== 'เธเธเธ•เธด'
                            ? 'bg-red-500/15 text-red-300 border-red-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800/50 text-slate-500 border-slate-700'
                      }`}
                    >
                      {cam ? 'โ“ ' : 'โ€” '}{vessel}
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

      {/* โ•โ•โ•โ• FAULTS TAB โ•โ•โ•โ• */}
      {activeTab === 'faults' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddFault} className="bg-red-600 hover:bg-red-500 text-white border-none">
              <Plus className="w-4 h-4 mr-2" /> เนเธเนเธเธเธฑเธเธซเธฒ CCTV
            </Button>
          </div>

          <Card className="border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-black/40 text-slate-400 text-xs uppercase tracking-wider font-mono whitespace-nowrap">
                    <th className="px-4 py-3 font-bold">เธชเธ–เธฒเธเธ—เธตเน</th>
                    <th className="px-4 py-3 font-bold">เธฃเธนเธเธ เธฒเธ</th>
                    <th className="px-4 py-3 font-bold">เธงเธฑเธเธ—เธตเนเนเธเนเธ</th>
                    <th className="px-4 py-3 font-bold">เธเธนเนเนเธเนเธ</th>
                    <th className="px-4 py-3 font-bold">เธชเธฒเน€เธซเธ•เธธ</th>
                    <th className="px-4 py-3 font-bold">เธชเธ–เธฒเธเธฐเนเธเนเนเธ</th>
                    <th className="px-4 py-3 font-bold text-right sticky right-0 bg-slate-900 border-l border-slate-800">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {faultLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-mono">
                        โ€” เธขเธฑเธเนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเนเธเนเธเธเธฑเธเธซเธฒ CCTV โ€”
                      </td>
                    </tr>
                  ) : [...faultLogs]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(log => (
                      <tr key={log.id} className={`group hover:bg-slate-800/30 transition-all whitespace-nowrap ${log.isFixed ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border w-fit ${
                              log.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ'
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
                            <span className="text-slate-600 text-xs">โ€”</span>
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
                              <CheckCircle className="w-3 h-3" /> เนเธเนเนเธเนเธฅเนเธง {log.fixedDate && <span className="text-slate-500 font-mono">({formatDateThai(log.fixedDate)})</span>}
                            </span>
                          ) : (
                            <span className="text-red-400 text-xs font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> เธขเธฑเธเนเธกเนเนเธเนเนเธ
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

      {/* โ•โ•โ•โ• CAMERA MODAL โ•โ•โ•โ• */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className={`w-full max-w-lg bg-slate-900 max-h-[90vh] overflow-y-auto ${
            cameraForm.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ'
              ? 'border-sky-500/30 shadow-[0_0_50px_rgba(56,189,248,0.2)]'
              : 'border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)]'
          }`}>
            <div className={`p-5 border-b border-slate-800 flex justify-between items-center ${
              cameraForm.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ'
                ? 'bg-gradient-to-r from-slate-900 to-sky-950/20'
                : 'bg-gradient-to-r from-slate-900 to-indigo-950/20'
            }`}>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera className={`w-5 h-5 ${cameraForm.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ' ? 'text-sky-400' : 'text-indigo-400'}`} />
                {editingCamera ? 'เนเธเนเนเธเธเนเธญเธกเธนเธฅเธเธฅเนเธญเธ' : 'เน€เธเธดเนเธกเธเธฅเนเธญเธ CCTV'}
              </h3>
              <button onClick={() => setShowCameraModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Location type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">เธเธฃเธฐเน€เธ เธ—เธชเธ–เธฒเธเธ—เธตเน</label>
                <div className="flex gap-2">
                  {(['เธ—เนเธฒเน€เธฃเธทเธญ', 'เนเธเน€เธฃเธทเธญ'] as CctvLocationType[]).map(lt => (
                    <button
                      key={lt}
                      type="button"
                      onClick={() => {
                        if (lt === 'เธ—เนเธฒเน€เธฃเธทเธญ') {
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
                          ? lt === 'เธ—เนเธฒเน€เธฃเธทเธญ'
                            ? 'bg-sky-500/20 border-sky-500/60 text-sky-300'
                            : 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300'
                          : 'bg-black/30 border-slate-700 text-slate-500'
                      }`}
                    >
                      {lt === 'เธ—เนเธฒเน€เธฃเธทเธญ' ? <MapPin className="w-3.5 h-3.5" /> : <Ship className="w-3.5 h-3.5" />}
                      {lt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand display */}
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                cameraForm.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ'
                  ? 'bg-sky-500/10 border-sky-500/30'
                  : 'bg-indigo-500/10 border-indigo-500/30'
              }`}>
                <Camera className={`w-5 h-5 ${cameraForm.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ' ? 'text-sky-400' : 'text-indigo-400'}`} />
                <div>
                  <p className={`font-black uppercase tracking-widest text-sm ${cameraForm.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ' ? 'text-sky-300' : 'text-indigo-300'}`}>
                    {cameraForm.brand}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {cameraForm.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ' ? 'IP Camera โ€” SD Card Storage' : 'CCTV Camera โ€” NVR 4TB Storage'}
                  </p>
                </div>
              </div>

              {/* Location select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {cameraForm.locationType === 'เธ—เนˆเธฒเน€เธฃเธทเธญ' ? 'เธ—เนˆเธฒเน€เธฃเธทเธญ (11 เธ—เนˆเธฒ)' : 'เนƒเธ™เน€เธฃเธทเธญ (7 เธฅเธณ)'}
                </label>
                <select
                  value={cameraForm.locationName}
                  onChange={e => setCameraForm(f => ({ ...f, locationName: e.target.value }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none text-sm font-bold"
                >
                  {cameraForm.locationType === 'เธ—เนˆเธฒเน€เธฃเธทเธญ'
                    ? CCTV_PIERS.map(p => <option key={p} value={p}>{p}</option>)
                    : CCTV_VESSELS.map(v => <option key={v} value={v}>เน€เธฃเธทเธญ {v}</option>)
                  }
                </select>
              </div>

              {/* 📶 อุปกรณ์ Router 4G Section */}
              <div className="space-y-4 p-3.5 bg-black/40 rounded-xl border border-cyan-900/60 shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-cyan-950/80 pb-2">
                  <label className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Wifi className="w-3.5 h-3.5 text-cyan-400" /> อุปกรณ์ Router 4G
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-cyan-600 font-mono font-bold">
                      {(cameraForm.routerCount || 1)} ตัว
                    </span>
                    {(cameraForm.routerCount || 1) < 2 ? (
                      <button
                        type="button"
                        onClick={() => setCameraForm(f => ({ ...f, routerCount: 2 }))}
                        className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 rounded transition-all flex items-center gap-1"
                      >
                        + เพิ่ม Router ที่ 2
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCameraForm(f => ({ ...f, routerCount: 1 }))}
                        className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded transition-all flex items-center gap-1"
                      >
                        ✕ ลบ Router ที่ 2
                      </button>
                    )}
                  </div>
                </div>

                {/* ─── Router #1 ─── */}
                <div className="space-y-3">
                  {(cameraForm.routerCount || 1) >= 2 && (
                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider font-mono flex items-center gap-1">
                      <Wifi className="w-3 h-3" /> Router #1
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                        ชื่อรุ่น / ยี่ห้อ Router 4G
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น Router 4G LTE, TP-Link..."
                        value={cameraForm.routerModel || ''}
                        onChange={e => setCameraForm(f => ({ ...f, routerModel: e.target.value }))}
                        className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                        Serial Number (S/N)
                      </label>
                      <input
                        type="text"
                        placeholder="ระบุ S/N Router 4G..."
                        value={cameraForm.routerSerialNumber || ''}
                        onChange={e => setCameraForm(f => ({ ...f, routerSerialNumber: e.target.value }))}
                        className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 focus:border-cyan-500 outline-none font-mono font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1 font-bold">
                        <Phone className="w-3 h-3 text-emerald-400" /> เบอร์โทรศัพท์ (ซิม AIS)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น 081-xxx-xxxx, 098-xxx-xxxx"
                        value={cameraForm.simPhoneNumber || ''}
                        onChange={e => setCameraForm(f => ({ ...f, simPhoneNumber: e.target.value }))}
                        className="w-full bg-black/60 border border-emerald-500/50 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-emerald-300 outline-none font-mono font-bold placeholder-slate-600"
                      />
                    </div>
                  </div>

                  {/* Router #1 Photo Upload */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-cyan-400" /> รูปภาพ Router 4G {(cameraForm.routerCount || 1) >= 2 && '#1'}
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">{cameraForm.routerImages?.length || 0} รูป</span>
                    </div>
                    <input ref={routerFileInputRef} type="file" multiple accept="image/*" onChange={handleRouterImageUpload} className="hidden" />
                    <div onClick={() => routerFileInputRef.current?.click()} className="w-full py-2.5 px-3 rounded-lg border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/10 hover:bg-cyan-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 text-center group/drop">
                      <Upload className="w-3.5 h-3.5 text-cyan-400 group-hover/drop:scale-110 transition-transform" />
                      <span className="text-xs font-mono text-cyan-300">คลิกเพื่ออัปโหลดรูปภาพ Router 4G {(cameraForm.routerCount || 1) >= 2 && '#1'}</span>
                    </div>
                    {cameraForm.routerImages && cameraForm.routerImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 pt-1 max-h-36 overflow-y-auto">
                        {cameraForm.routerImages.map((img, idx) => (
                          <div key={idx} className="relative group/thumb rounded-lg overflow-hidden border border-slate-700 aspect-square">
                            <img src={img} alt={`router-preview-${idx}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeRouterImage(idx)} className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-red-500" title="ลบรูป">
                              <X className="w-3 h-3" />
                            </button>
                            <button type="button" onClick={() => openLightbox(cameraForm.routerImages!, idx)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── Router #2 (แสดงเมื่อ routerCount = 2) ─── */}
                {(cameraForm.routerCount || 1) >= 2 && (
                  <div className="space-y-3 pt-3 border-t border-cyan-900/40">
                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider font-mono flex items-center gap-1">
                      <Wifi className="w-3 h-3" /> Router #2
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                          ชื่อรุ่น / ยี่ห้อ Router 4G #2
                        </label>
                        <input
                          type="text"
                          placeholder="เช่น Router 4G LTE, TP-Link..."
                          value={cameraForm.router2Model || ''}
                          onChange={e => setCameraForm(f => ({ ...f, router2Model: e.target.value }))}
                          className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                          Serial Number (S/N) #2
                        </label>
                        <input
                          type="text"
                          placeholder="ระบุ S/N Router 4G #2..."
                          value={cameraForm.router2SerialNumber || ''}
                          onChange={e => setCameraForm(f => ({ ...f, router2SerialNumber: e.target.value }))}
                          className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 focus:border-cyan-500 outline-none font-mono font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1 font-bold">
                          <Phone className="w-3 h-3 text-emerald-400" /> เบอร์โทรศัพท์ (ซิม AIS) #2
                        </label>
                        <input
                          type="text"
                          placeholder="เช่น 081-xxx-xxxx..."
                          value={cameraForm.router2SimPhoneNumber || ''}
                          onChange={e => setCameraForm(f => ({ ...f, router2SimPhoneNumber: e.target.value }))}
                          className="w-full bg-black/60 border border-emerald-500/50 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-emerald-300 outline-none font-mono font-bold placeholder-slate-600"
                        />
                      </div>
                    </div>

                    {/* Router #2 Photo Upload */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-cyan-400" /> รูปภาพ Router 4G #2
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">{cameraForm.router2Images?.length || 0} รูป</span>
                      </div>
                      <input ref={router2FileInputRef} type="file" multiple accept="image/*" onChange={handleRouter2ImageUpload} className="hidden" />
                      <div onClick={() => router2FileInputRef.current?.click()} className="w-full py-2.5 px-3 rounded-lg border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/10 hover:bg-cyan-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 text-center group/drop">
                        <Upload className="w-3.5 h-3.5 text-cyan-400 group-hover/drop:scale-110 transition-transform" />
                        <span className="text-xs font-mono text-cyan-300">คลิกเพื่ออัปโหลดรูปภาพ Router 4G #2</span>
                      </div>
                      {cameraForm.router2Images && cameraForm.router2Images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 pt-1 max-h-36 overflow-y-auto">
                          {cameraForm.router2Images.map((img, idx) => (
                            <div key={idx} className="relative group/thumb rounded-lg overflow-hidden border border-slate-700 aspect-square">
                              <img src={img} alt={`router2-preview-${idx}`} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeRouter2Image(idx)} className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-red-500" title="ลบรูป">
                                <X className="w-3 h-3" />
                              </button>
                              <button type="button" onClick={() => openLightbox(cameraForm.router2Images!, idx)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                <Eye className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Camera count */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-sky-400" /> เธˆเธณเธ™เธงเธ™เธ เธฅเน‰เธญเธ‡ (1-8 เธ•เธฑเธง)
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
                    <option key={n} value={n}>{n} เธ•เธฑเธง</option>
                  ))}
                </select>
              </div>

              {/* Serial Numbers โ€” one input per camera */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  Serial Number เธ เธฅเน‰เธญเธ‡ ({cameraForm.cameraCount} เธ•เธฑเธง)
                </label>
                <div className="p-3 bg-black/40 rounded-lg border border-slate-700/60 space-y-2 max-h-56 overflow-y-auto">
                  {Array.from({ length: cameraForm.cameraCount || 1 }, (_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-sky-400 font-bold w-8 shrink-0 flex items-center gap-0.5">
                        <Hash className="w-2.5 h-2.5" />{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={`S/N เธเธฅเนเธญเธเธ•เธฑเธงเธ—เธตเน ${idx + 1}...`}
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

              {/* Storage โ€” only show memory for pier */}
              {cameraForm.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-purple-400" /> เน€เธกเธกเนเธกเธฃเธตเนเธเธฒเธฃเนเธ” (SD Card)
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

              {/* ๐’พ เธญเธธเธเธเธฃเธ“เน NVR 16CH Section (เธชเธณเธซเธฃเธฑเธเนเธเน€เธฃเธทเธญ) */}
              {cameraForm.locationType === 'เนเธเน€เธฃเธทเธญ' && (
                <div className="space-y-3 p-3.5 bg-black/40 rounded-xl border border-amber-500/40 shadow-sm">
                  <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <HardDrive className="w-3.5 h-3.5 text-amber-400" /> เธญเธธเธเธเธฃเธ“เน NVR 16CH
                    </label>
                    <span className="text-[10px] text-amber-500 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      16 Channels โ€ข 4TB
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                        เธเธทเนเธญเธฃเธธเนเธ / เธญเธธเธเธเธฃเธ“เน NVR
                      </label>
                      <input
                        type="text"
                        placeholder="เน€เธเนเธ Dahua NVR 16CH (4TB)..."
                        value={cameraForm.nvrModel || ''}
                        onChange={e => setCameraForm(f => ({ ...f, nvrModel: e.target.value }))}
                        className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mb-1 font-bold">
                        Serial Number (S/N) เธเธญเธ NVR 16CH
                      </label>
                      <input
                        type="text"
                        placeholder="เธฃเธฐเธเธธ S/N เน€เธเธฃเธทเนเธญเธ NVR 16CH..."
                        value={cameraForm.nvrSerialNumber || ''}
                        onChange={e => setCameraForm(f => ({ ...f, nvrSerialNumber: e.target.value }))}
                        className="w-full bg-black/60 border border-amber-500/50 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-amber-300 outline-none font-mono font-bold placeholder-slate-600"
                      />
                    </div>
                  </div>

                  {/* NVR Photo Upload */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-amber-400" /> เธฃเธนเธเธ เธฒเธ NVR 16CH
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {cameraForm.nvrImages?.length || 0} เธฃเธนเธ
                      </span>
                    </div>

                    <input
                      ref={nvrFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleNvrImageUpload}
                      className="hidden"
                    />

                    <div
                      onClick={() => nvrFileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-lg border border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-950/10 hover:bg-amber-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 text-center group/drop"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400 group-hover/drop:scale-110 transition-transform" />
                      <span className="text-xs font-mono text-amber-300">เธเธฅเธดเธเน€เธเธทเนเธญเธญเธฑเธเนเธซเธฅเธ”เธฃเธนเธเธ เธฒเธ NVR 16CH</span>
                    </div>

                    {cameraForm.nvrImages && cameraForm.nvrImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 pt-1 max-h-36 overflow-y-auto">
                        {cameraForm.nvrImages.map((img, idx) => (
                          <div key={idx} className="relative group/thumb rounded-lg overflow-hidden border border-slate-700 aspect-square">
                            <img src={img} alt={`nvr-preview-${idx}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeNvrImage(idx)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-red-500"
                              title="เธฅเธเธฃเธนเธ"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openLightbox(cameraForm.nvrImages!, idx)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                            >
                              <Eye className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">เธชเธ–เธฒเธเธฐ</label>
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
                  <Calendar className="w-3.5 h-3.5" /> เธงเธฑเธเธ—เธตเนเธ•เธดเธ”เธ•เธฑเนเธ (เนเธกเนเธเธฑเธเธเธฑเธ)
                </label>
                <input
                  type="date"
                  value={cameraForm.installDate}
                  onChange={e => setCameraForm(f => ({ ...f, installDate: e.target.value }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none font-mono"
                />
              </div>

              {/* ๐“ถ เธญเธธเธเธเธฃเธ“เน Router 4G Section */}
              <div className="space-y-3 p-3.5 bg-black/40 rounded-xl border border-cyan-900/60 shadow-sm">
                <div className="flex items-center justify-between border-b border-cyan-950/80 pb-2">
                  <label className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Wifi className="w-3.5 h-3.5 text-cyan-400" /> เธญเธธเธเธเธฃเธ“เน Router 4G
                  </label>
                  <span className="text-[10px] text-cyan-600 font-mono font-bold">Network Device</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      เธเธทเนเธญเธฃเธธเนเธ / เธขเธตเนเธซเนเธญ Router 4G
                    </label>
                    <input
                      type="text"
                      placeholder="เน€เธเนเธ Router 4G LTE, TP-Link..."
                      value={cameraForm.routerModel || ''}
                      onChange={e => setCameraForm(f => ({ ...f, routerModel: e.target.value }))}
                      className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Serial Number (S/N)
                    </label>
                    <input
                      type="text"
                      placeholder="เธฃเธฐเธเธธ S/N Router 4G..."
                      value={cameraForm.routerSerialNumber || ''}
                      onChange={e => setCameraForm(f => ({ ...f, routerSerialNumber: e.target.value }))}
                      className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 focus:border-cyan-500 outline-none font-mono font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1 font-bold">
                      <Phone className="w-3 h-3 text-emerald-400" /> เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เน (เธเธดเธก AIS)
                    </label>
                    <input
                      type="text"
                      placeholder="เน€เธเนเธ 081-xxx-xxxx, 098-xxx-xxxx"
                      value={cameraForm.simPhoneNumber || ''}
                      onChange={e => setCameraForm(f => ({ ...f, simPhoneNumber: e.target.value }))}
                      className="w-full bg-black/60 border border-emerald-500/50 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-emerald-300 outline-none font-mono font-bold placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Router 4G Photo Upload */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-cyan-400" /> เธฃเธนเธเธ เธฒเธ Router 4G
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {cameraForm.routerImages?.length || 0} เธฃเธนเธ
                    </span>
                  </div>

                  <input
                    ref={routerFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleRouterImageUpload}
                    className="hidden"
                  />

                  <div
                    onClick={() => routerFileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-lg border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/10 hover:bg-cyan-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 text-center group/drop"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400 group-hover/drop:scale-110 transition-transform" />
                    <span className="text-xs font-mono text-cyan-300">เธเธฅเธดเธเน€เธเธทเนเธญเธญเธฑเธเนเธซเธฅเธ”เธฃเธนเธเธ เธฒเธ Router 4G</span>
                  </div>

                  {cameraForm.routerImages && cameraForm.routerImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 pt-1 max-h-36 overflow-y-auto">
                      {cameraForm.routerImages.map((img, idx) => (
                        <div key={idx} className="relative group/thumb rounded-lg overflow-hidden border border-slate-700 aspect-square">
                          <img src={img} alt={`router-preview-${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeRouterImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-red-500"
                            title="เธฅเธเธฃเธนเธ"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openLightbox(cameraForm.routerImages!, idx)}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ๐“ท Unlimited Photo Upload Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> เธฃเธนเธเธ เธฒเธเธเธฅเนเธญเธ / เธชเธ–เธฒเธเธ—เธตเนเธ•เธดเธ”เธ•เธฑเนเธ (เนเธกเนเธเธณเธเธฑเธ”เธเธณเธเธงเธ)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {cameraForm.images?.length || 0} เธฃเธนเธ
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
                      <span className="text-xs font-mono">เธเธณเธฅเธฑเธเธเธฃเธฐเธกเธงเธฅเธเธฅเธฃเธนเธเธ เธฒเธ...</span>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 rounded-full bg-sky-500/20 text-sky-400 group-hover/drop:scale-110 transition-transform">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-sky-300">เธเธฅเธดเธเน€เธเธทเนเธญเธญเธฑเธเนเธซเธฅเธ”เธฃเธนเธเธ เธฒเธ</p>
                      <p className="text-[10px] text-slate-500">เธฃเธญเธเธฃเธฑเธ JPG, PNG (เธญเธฑเธเนเธซเธฅเธ”เธเธฃเนเธญเธกเธเธฑเธเนเธ”เนเธซเธฅเธฒเธขเธฃเธนเธเนเธกเนเธเธณเธเธฑเธ”)</p>
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
                          title="เธฅเธเธฃเธนเธ"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openLightbox(cameraForm.images!, idx)}
                          className="absolute bottom-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-black/90"
                          title="เธเธขเธฒเธขเธฃเธนเธ"
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">เธซเธกเธฒเธขเน€เธซเธ•เธธ</label>
                <textarea
                  value={cameraForm.notes}
                  onChange={e => setCameraForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="เธซเธกเธฒเธขเน€เธซเธ•เธธเน€เธเธดเนเธกเน€เธ•เธดเธก..."
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none resize-none text-sm"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowCameraModal(false)}>เธขเธเน€เธฅเธดเธ</Button>
              <Button
                onClick={saveCamera}
                className={`text-white border-none ${cameraForm.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
              >
                <Save className="w-4 h-4 mr-2" /> เธเธฑเธเธ—เธถเธ
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* โ•โ•โ•โ• FAULT MODAL โ•โ•โ•โ• */}
      {showFaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-slate-900 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-red-950/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                {editingFault ? 'เนเธเนเนเธเธฃเธฒเธขเธเธฒเธฃเนเธเนเธเธเธฑเธเธซเธฒ' : 'เนเธเนเธเธเธฑเธเธซเธฒ CCTV'}
              </h3>
              <button onClick={() => setShowFaultModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Location type & name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">เธเธฃเธฐเน€เธ เธ—เธชเธ–เธฒเธเธ—เธตเน</label>
                <div className="flex gap-2">
                  {(['เธ—เนเธฒเน€เธฃเธทเธญ', 'เนเธเน€เธฃเธทเธญ'] as CctvLocationType[]).map(lt => (
                    <button
                      key={lt}
                      type="button"
                      onClick={() => setFaultForm(f => ({
                        ...f,
                        locationType: lt,
                        locationName: lt === 'เธ—เนเธฒเน€เธฃเธทเธญ' ? CCTV_PIERS[0] : CCTV_VESSELS[0],
                      }))}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        faultForm.locationType === lt
                          ? 'bg-red-500/20 border-red-500/60 text-red-300'
                          : 'bg-black/30 border-slate-700 text-slate-500'
                      }`}
                    >
                      {lt === 'เธ—เนเธฒเน€เธฃเธทเธญ' ? <MapPin className="w-3.5 h-3.5" /> : <Ship className="w-3.5 h-3.5" />}
                      {lt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">เธชเธ–เธฒเธเธ—เธตเน</label>
                <select
                  value={faultForm.locationName}
                  onChange={e => setFaultForm(f => ({ ...f, locationName: e.target.value }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none text-sm"
                >
                  {faultForm.locationType === 'เธ—เนเธฒเน€เธฃเธทเธญ'
                    ? CCTV_PIERS.map(p => <option key={p} value={p}>{p}</option>)
                    : CCTV_VESSELS.map(v => <option key={v} value={v}>เน€เธฃเธทเธญ {v}</option>)
                  }
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> เธงเธฑเธเธ—เธตเนเนเธเนเธ
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
                  <User className="w-3.5 h-3.5" /> เธเธทเนเธญเธเธนเนเนเธเนเธ
                </label>
                <input
                  type="text"
                  value={faultForm.reporterName}
                  onChange={e => setFaultForm(f => ({ ...f, reporterName: e.target.value }))}
                  placeholder="เธเธฃเธญเธเธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ"
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-red-400 uppercase tracking-widest">เธชเธฒเน€เธซเธ•เธธ (เน€เธฅเธทเธญเธเนเธ”เนเธซเธฅเธฒเธขเธญเธขเนเธฒเธ)</label>
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

              {/* ๐“ท Fault Photos */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> เนเธเธเธฃเธนเธเธ เธฒเธเธเธฑเธเธซเธฒ (เนเธกเนเธเธณเธเธฑเธ”เธเธณเธเธงเธ)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {faultForm.images?.length || 0} เธฃเธนเธ
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
                  <p className="text-xs font-bold text-red-300">เธเธฅเธดเธเน€เธเธทเนเธญเธญเธฑเธเนเธซเธฅเธ”เธฃเธนเธเธ เธฒเธเธเธฑเธเธซเธฒ</p>
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
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">เนเธเนเนเธเน€เธชเธฃเนเธเน€เธฃเธตเธขเธเธฃเนเธญเธข</span>
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเนเธกเน€เธ•เธดเธก</label>
                <textarea
                  value={faultForm.causeDetails}
                  onChange={e => setFaultForm(f => ({ ...f, causeDetails: e.target.value }))}
                  rows={2}
                  placeholder="เธญเธเธดเธเธฒเธขเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเนเธกเน€เธ•เธดเธก..."
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none resize-none text-sm"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowFaultModal(false)}>เธขเธเน€เธฅเธดเธ</Button>
              <Button onClick={saveFault} className="bg-red-600 hover:bg-red-500 text-white border-none">
                <Save className="w-4 h-4 mr-2" /> เธเธฑเธเธ—เธถเธ
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* โ•โ•โ•โ• LIGHTBOX IMAGE VIEWER MODAL โ•โ•โ•โ• */}
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
              เธฃเธนเธเธ—เธตเน {lightboxIndex + 1} เธเธฒเธเธ—เธฑเนเธเธซเธกเธ” {lightboxImages.length} เธฃเธนเธ
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

