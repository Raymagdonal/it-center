import React, { useState, useMemo } from 'react';
import {
  Video, Plus, X, Save, Search, Edit, Trash2, AlertTriangle,
  CheckCircle, MapPin, Ship, User, Calendar, HardDrive,
  Camera, Eye, Layers, ShieldCheck, Database, Wifi, WifiOff
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

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
  // Pier: SD card memory size; Vessel: NVR 4TB
  storageType: 'SD Card' | 'NVR';
  memorySize?: CctvMemorySize;    // for EZVIZ (SD card)
  nvrCapacity?: '4TB';            // for Dahua
  installDate?: string;
  status: CctvStatus;
  ipAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Fault Log
export interface CctvFaultLog {
  id: string;
  cameraId?: string;              // linked camera id
  locationType: CctvLocationType;
  locationName: string;
  reportDate: string;
  reporterName: string;
  faultCauses: CctvFaultCause[];
  fixedDate?: string;
  isFixed: boolean;
  causeDetails?: string;
  createdAt: string;
}

export interface CctvData {
  cameras: CctvCamera[];
  faultLogs: CctvFaultLog[];
}

// ─────────────────────────────────────────────
// Constants
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
  const [searchTerm, setSearchTerm] = useState('');

  // ── Camera form ──
  const emptyCameraPier = (): Omit<CctvCamera, 'id' | 'createdAt' | 'updatedAt'> => ({
    locationType: 'ท่าเรือ',
    locationName: CCTV_PIERS[0],
    brand: 'EZVIZ',
    cameraCount: 2,
    storageType: 'SD Card',
    memorySize: '64 GB',
    status: 'ปกติ',
    installDate: '',
    ipAddress: '',
    notes: '',
  });

  const emptyCameraVessel = (): Omit<CctvCamera, 'id' | 'createdAt' | 'updatedAt'> => ({
    locationType: 'ในเรือ',
    locationName: CCTV_VESSELS[0],
    brand: 'Dahua',
    cameraCount: 4,
    storageType: 'NVR',
    nvrCapacity: '4TB',
    status: 'ปกติ',
    installDate: '',
    ipAddress: '',
    notes: '',
  });

  const [cameraForm, setCameraForm] = useState(
    registryTab === 'pier' ? emptyCameraPier() : emptyCameraVessel()
  );

  // ── Fault form ──
  const emptyFault = (): Omit<CctvFaultLog, 'id' | 'createdAt'> => ({
    locationType: 'ท่าเรือ',
    locationName: CCTV_PIERS[0],
    reportDate: todayDate(),
    reporterName: '',
    faultCauses: [],
    fixedDate: '',
    isFixed: false,
    causeDetails: '',
  });

  const [faultForm, setFaultForm] = useState(emptyFault());

  // ── Cameras by type ──
  const pierCameras = useMemo(() =>
    data.cameras.filter(c => c.locationType === 'ท่าเรือ')
      .sort((a, b) => CCTV_PIERS.indexOf(a.locationName as PierName) - CCTV_PIERS.indexOf(b.locationName as PierName)),
    [data.cameras]
  );

  const vesselCameras = useMemo(() =>
    data.cameras.filter(c => c.locationType === 'ในเรือ')
      .sort((a, b) => CCTV_VESSELS.indexOf(a.locationName as VesselName) - CCTV_VESSELS.indexOf(b.locationName as VesselName)),
    [data.cameras]
  );

  const totalCameraCount = useMemo(() =>
    data.cameras.reduce((sum, c) => sum + c.cameraCount, 0),
    [data.cameras]
  );

  const faultyCameras = data.cameras.filter(c => c.status !== 'ปกติ').length;
  const activeFaults = data.faultLogs.filter(l => !l.isFixed).length;

  // ── Camera CRUD ──
  const openAddCamera = () => {
    setEditingCamera(null);
    setCameraForm(registryTab === 'pier' ? emptyCameraPier() : emptyCameraVessel());
    setShowCameraModal(true);
  };

  const openEditCamera = (cam: CctvCamera) => {
    setEditingCamera(cam);
    setCameraForm({
      locationType: cam.locationType,
      locationName: cam.locationName,
      brand: cam.brand,
      cameraCount: cam.cameraCount,
      storageType: cam.storageType,
      memorySize: cam.memorySize,
      nvrCapacity: cam.nvrCapacity,
      status: cam.status,
      installDate: cam.installDate || '',
      ipAddress: cam.ipAddress || '',
      notes: cam.notes || '',
    });
    setShowCameraModal(true);
  };

  const saveCamera = () => {
    if (!cameraForm.locationName) return;
    const now = new Date().toISOString();
    let newCameras: CctvCamera[];
    if (editingCamera) {
      newCameras = data.cameras.map(c =>
        c.id === editingCamera.id ? { ...editingCamera, ...cameraForm, updatedAt: now } : c
      );
    } else {
      const newCam: CctvCamera = {
        id: `cctv_cam_${Date.now()}`,
        ...cameraForm,
        createdAt: now,
        updatedAt: now,
      };
      newCameras = [...data.cameras, newCam];
    }
    onUpdate({ ...data, cameras: newCameras });
    setShowCameraModal(false);
  };

  const deleteCamera = (id: string) => {
    if (!confirm('ยืนยันการลบกล้องนี้?')) return;
    onUpdate({ ...data, cameras: data.cameras.filter(c => c.id !== id) });
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
      newFaultLogs = data.faultLogs.map(l =>
        l.id === editingFault.id ? { ...editingFault, ...faultForm } : l
      );
    } else {
      newFaultLogs = [{ id: `cctv_fault_${Date.now()}`, ...faultForm, createdAt: new Date().toISOString() }, ...data.faultLogs];
    }
    onUpdate({ ...data, faultLogs: newFaultLogs });
    setShowFaultModal(false);
  };

  const deleteFault = (id: string) => {
    if (!confirm('ยืนยันการลบรายการนี้?')) return;
    onUpdate({ ...data, faultLogs: data.faultLogs.filter(l => l.id !== id) });
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
    const statusCfg = STATUS_CONFIG[cam.status];
    const StatusIcon = statusCfg.icon;

    return (
      <div key={cam.id} className={`group relative bg-slate-900/60 border rounded-xl overflow-hidden transition-all hover:border-sky-500/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] ${
        cam.status !== 'ปกติ' ? 'border-red-500/40' : 'border-slate-700/60'
      }`}>
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

          {/* Install date & IP */}
          {(cam.installDate || cam.ipAddress) && (
            <div className="mt-2 space-y-1">
              {cam.installDate && (
                <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  ติดตั้ง {formatDateThai(cam.installDate)}
                </p>
              )}
              {cam.ipAddress && (
                <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  {cam.ipAddress}
                </p>
              )}
            </div>
          )}

          {cam.notes && (
            <p className="mt-2 text-[11px] text-slate-400 line-clamp-2">{cam.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-3 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={() => openEditCamera(cam)}
            className="p-1.5 text-slate-500 hover:text-sky-400 hover:bg-sky-950/30 rounded-full transition-all"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteCamera(cam.id)}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-full transition-all"
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

        {/* Stats */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-black border border-sky-900/50 rounded-lg px-3.5 py-2 text-center">
            <div className="text-xl font-bold text-sky-400 font-mono">{data.cameras.length}</div>
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
          ทำเนียบกล้อง ({data.cameras.length})
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
          แจ้งปัญหา CCTV ({data.faultLogs.length})
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
                {pierCameras.length === 0 ? (
                  <div className="col-span-full py-16 text-center">
                    <Camera className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 font-mono">ยังไม่มีข้อมูลกล้อง EZVIZ ท่าเรือ</p>
                    <p className="text-slate-600 text-sm mt-1">กด "เพิ่มกล้องท่าเรือ" เพื่อเพิ่มข้อมูล</p>
                  </div>
                ) : pierCameras.map(renderCameraCard)}
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
                {vesselCameras.length === 0 ? (
                  <div className="col-span-full py-16 text-center">
                    <Camera className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 font-mono">ยังไม่มีข้อมูลกล้อง Dahua ในเรือ</p>
                    <p className="text-slate-600 text-sm mt-1">กด "เพิ่มกล้องในเรือ" เพื่อเพิ่มข้อมูล</p>
                  </div>
                ) : vesselCameras.map(renderCameraCard)}
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
                    <th className="px-4 py-3 font-bold">วันที่แจ้ง</th>
                    <th className="px-4 py-3 font-bold">ผู้แจ้ง</th>
                    <th className="px-4 py-3 font-bold">สาเหตุ</th>
                    <th className="px-4 py-3 font-bold">สถานะแก้ไข</th>
                    <th className="px-4 py-3 font-bold text-right sticky right-0 bg-slate-900 border-l border-slate-800">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.faultLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500 font-mono">
                        — ยังไม่มีรายการแจ้งปัญหา CCTV —
                      </td>
                    </tr>
                  ) : [...data.faultLogs]
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
                        <td className="px-4 py-3 font-mono text-slate-300 text-xs">{formatDateThai(log.reportDate)}</td>
                        <td className="px-4 py-3 text-slate-200">{log.reporterName}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {log.faultCauses.map(c => (
                              <span key={c} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${FAULT_COLORS[c]}`}>{c}</span>
                            ))}
                          </div>
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
          <Card className={`w-full max-w-md bg-slate-900 max-h-[90vh] overflow-y-auto ${
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
                          setCameraForm({ ...emptyCameraPier() });
                        } else {
                          setCameraForm({ ...emptyCameraVessel() });
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
                  onChange={e => setCameraForm(f => ({ ...f, cameraCount: parseInt(e.target.value) }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none font-mono text-sm"
                >
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} ตัว</option>
                  ))}
                </select>
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

              {/* IP Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" /> IP Address (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={cameraForm.ipAddress}
                  onChange={e => setCameraForm(f => ({ ...f, ipAddress: e.target.value }))}
                  placeholder="192.168.1.x"
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none font-mono text-sm"
                />
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
          <Card className="w-full max-w-md bg-slate-900 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] max-h-[90vh] overflow-y-auto">
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
                          ? `${FAULT_COLORS[cause]} border-current`
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
    </div>
  );
};
