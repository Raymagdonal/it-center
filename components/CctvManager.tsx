import React, { useState, useMemo } from 'react';
import {
  Video, Plus, X, Save, Search, Edit, Trash2, AlertTriangle,
  CheckCircle, MapPin, Ship, User, Calendar, HardDrive, Camera
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

// ─────────────────────────────────────────────
// Types & Constants
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

export type CctvLocationType = 'ท่าเรือ' | 'ในเรือ';

export type CctvMemorySize = '32 GB' | '64 GB' | '128 GB' | '256 GB';

export type CctvFaultCause =
  | 'กล้องดับ'
  | 'กระตุก'
  | 'ดู Online ไม่ได้'
  | 'กล้องไม่บันทึก'
  | 'ใช้งานได้ปกติ';

export interface CctvFaultLog {
  id: string;
  locationType: CctvLocationType;
  locationName: string;          // ชื่อท่าเรือ หรือ ชื่อเรือ
  cameraCount: number;           // จำนวนกล้อง (1-8 ตัว)
  memorySize: CctvMemorySize;    // ความจุเมมโมรี่การ์ด (32 GB-256 GB)
  reportDate: string;            // วันที่แจ้ง
  reporterName: string;          // ชื่อผู้แจ้ง
  faultCauses: CctvFaultCause[]; // เสีย: สาเหตุ (multiple)
  fixedDate?: string;            // วันที่แก้ไขเสร็จ
  isFixed: boolean;
  causeDetails?: string;         // สาเหตุเพิ่มเติม / หมายเหตุ
  createdAt: string;
}

export interface CctvData {
  faultLogs: CctvFaultLog[];
}

// ─────────────────────────────────────────────
// Constants & Colors
// ─────────────────────────────────────────────

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

const MEMORY_SIZES: CctvMemorySize[] = ['32 GB', '64 GB', '128 GB', '256 GB'];

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface CctvManagerProps {
  data: CctvData;
  onUpdate: (data: CctvData) => void;
}

// ─────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────

const todayDate = () => new Date().toISOString().split('T')[0];

const formatDateThai = (dt: string) => {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const CctvManager: React.FC<CctvManagerProps> = ({ data, onUpdate }) => {
  const [showFaultModal, setShowFaultModal] = useState(false);
  const [editingFault, setEditingFault] = useState<CctvFaultLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocationType, setFilterLocationType] = useState<CctvLocationType | ''>('');
  const [filterFaultCause, setFilterFaultCause] = useState<CctvFaultCause | ''>('');

  // ── Fault form state ──
  const emptyFault = (): Omit<CctvFaultLog, 'id' | 'createdAt'> => ({
    locationType: 'ท่าเรือ',
    locationName: CCTV_PIERS[0],
    cameraCount: 1,
    memorySize: '64 GB',
    reportDate: todayDate(),
    reporterName: '',
    faultCauses: [],
    fixedDate: '',
    isFixed: false,
    causeDetails: '',
  });

  const [faultForm, setFaultForm] = useState(emptyFault());

  // ── Stats ──
  const activeFaultsCount = useMemo(() => {
    return data.faultLogs.filter(l => !l.isFixed).length;
  }, [data.faultLogs]);

  const pierFaultsCount = useMemo(() => {
    return data.faultLogs.filter(l => l.locationType === 'ท่าเรือ' && !l.isFixed).length;
  }, [data.faultLogs]);

  const vesselFaultsCount = useMemo(() => {
    return data.faultLogs.filter(l => l.locationType === 'ในเรือ' && !l.isFixed).length;
  }, [data.faultLogs]);

  // ── Filtered fault logs ──
  const filteredFaultLogs = useMemo(() => {
    return data.faultLogs.filter(log => {
      const matchSearch = searchTerm === '' ||
        log.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.causeDetails || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterLocationType === '' || log.locationType === filterLocationType;
      const matchCause = filterFaultCause === '' || log.faultCauses.includes(filterFaultCause as CctvFaultCause);
      return matchSearch && matchType && matchCause;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data.faultLogs, searchTerm, filterLocationType, filterFaultCause]);

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
      cameraCount: log.cameraCount,
      memorySize: log.memorySize,
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
      alert('กรุณากรอกชื่อผู้แจ้ง และเลือกสาเหตุที่เสียอย่างน้อย 1 อย่าง');
      return;
    }
    let newFaultLogs: CctvFaultLog[];
    if (editingFault) {
      newFaultLogs = data.faultLogs.map(l =>
        l.id === editingFault.id ? { ...editingFault, ...faultForm } : l
      );
    } else {
      const newLog: CctvFaultLog = {
        id: `cctv_fault_${Date.now()}`,
        ...faultForm,
        createdAt: new Date().toISOString(),
      };
      newFaultLogs = [newLog, ...data.faultLogs];
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

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-sky-500/20 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-3">
            <Video className="h-8 w-8 text-sky-400" />
            CCTV
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-[10px] uppercase tracking-widest">
            CCTV Surveillance System • 11 ท่าเรือ & 7 ในเรือ (CTB1-3, R1-4)
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-black border border-sky-900/50 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-sky-400 font-mono">{data.faultLogs.length}</div>
            <div className="text-[9px] text-sky-600 uppercase font-bold tracking-wider">แจ้งทั้งหมด</div>
          </div>
          <div className="bg-black border border-red-900/50 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-red-400 font-mono">{activeFaultsCount}</div>
            <div className="text-[9px] text-red-600 uppercase font-bold tracking-wider">ยังไม่แก้ไข</div>
          </div>
          <div className="bg-black border border-cyan-900/50 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-cyan-400 font-mono">{pierFaultsCount}</div>
            <div className="text-[9px] text-cyan-600 uppercase font-bold tracking-wider">ท่าเรือมีปัญหา</div>
          </div>
          <div className="bg-black border border-blue-900/50 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-blue-400 font-mono">{vesselFaultsCount}</div>
            <div className="text-[9px] text-blue-600 uppercase font-bold tracking-wider">ในเรือมีปัญหา</div>
          </div>
        </div>
      </div>

      {/* ── Main Section ── */}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="ค้นหา ชื่อผู้แจ้ง / สถานที่ / สาเหตุ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500/50 font-mono text-sm"
            />
          </div>
          <select
            value={filterLocationType}
            onChange={e => setFilterLocationType(e.target.value as CctvLocationType | '')}
            className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-sky-500/50"
          >
            <option value="">สถานที่ทั้งหมด</option>
            <option value="ท่าเรือ">ท่าเรือ (11 ท่า)</option>
            <option value="ในเรือ">ในเรือ (7 ลำ)</option>
          </select>
          <select
            value={filterFaultCause}
            onChange={e => setFilterFaultCause(e.target.value as CctvFaultCause | '')}
            className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-sky-500/50"
          >
            <option value="">สาเหตุทั้งหมด</option>
            {FAULT_CAUSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Button onClick={openAddFault} className="bg-sky-600 hover:bg-sky-500 text-white border-none shrink-0">
            <Plus className="w-4 h-4 mr-2" /> แจ้ง CCTV เสีย
          </Button>
        </div>

        {/* Table */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-black/40 text-slate-400 text-xs uppercase tracking-wider font-mono whitespace-nowrap">
                  <th className="px-4 py-3 font-bold">สถานที่</th>
                  <th className="px-4 py-3 font-bold">จำนวนกล้อง</th>
                  <th className="px-4 py-3 font-bold">เมมโมรี่การ์ด</th>
                  <th className="px-4 py-3 font-bold">วันที่แจ้ง</th>
                  <th className="px-4 py-3 font-bold">ชื่อผู้แจ้ง</th>
                  <th className="px-4 py-3 font-bold">สาเหตุที่เสีย</th>
                  <th className="px-4 py-3 font-bold">สถานะแก้ไข</th>
                  <th className="px-4 py-3 font-bold text-right sticky right-0 bg-slate-900 border-l border-slate-800">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredFaultLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500 font-mono">
                      — ยังไม่มีรายการแจ้ง CCTV เสีย —
                    </td>
                  </tr>
                ) : filteredFaultLogs.map(log => (
                  <tr key={log.id} className={`group hover:bg-slate-800/30 transition-all whitespace-nowrap ${log.isFixed ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border w-fit flex items-center gap-1 ${
                          log.locationType === 'ท่าเรือ'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        }`}>
                          {log.locationType === 'ท่าเรือ' ? <MapPin className="w-3 h-3" /> : <Ship className="w-3 h-3" />}
                          {log.locationType}
                        </span>
                        <span className="text-slate-200 font-bold text-xs">{log.locationName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-sky-300 font-mono font-bold text-xs">
                        <Camera className="w-3 h-3 inline mr-1 text-sky-400" />
                        {log.cameraCount} ตัว
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-purple-300 font-mono font-bold text-xs">
                        <HardDrive className="w-3 h-3 inline mr-1 text-purple-400" />
                        {log.memorySize}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-xs">{formatDateThai(log.reportDate)}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{log.reporterName}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {log.faultCauses.map(c => (
                          <span key={c} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${FAULT_COLORS[c]}`}>
                            {c}
                          </span>
                        ))}
                      </div>
                      {log.causeDetails && (
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs truncate" title={log.causeDetails}>
                          {log.causeDetails}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.isFixed ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                            <CheckCircle className="w-3 h-3" /> แก้ไขเสร็จ
                          </span>
                          {log.fixedDate && (
                            <span className="text-slate-400 text-[10px] font-mono">{formatDateThai(log.fixedDate)}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-400 text-xs font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> ยังไม่แก้ไข
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right sticky right-0 bg-slate-900/80 backdrop-blur-sm border-l border-slate-800/50 group-hover:bg-slate-800/90 transition-all">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditFault(log)}
                          className="p-1.5 text-slate-500 hover:text-sky-400 hover:bg-sky-950/30 rounded-full transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFault(log.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-full transition-all"
                        >
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

      {/* ════════════ FAULT MODAL ════════════ */}
      {showFaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-slate-900 border-sky-500/30 shadow-[0_0_50px_rgba(56,189,248,0.2)] max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-sky-950/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-sky-400" />
                {editingFault ? 'แก้ไขรายการ CCTV เสีย' : 'แจ้ง CCTV เสีย'}
              </h3>
              <button onClick={() => setShowFaultModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Location Type & Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-sky-400 uppercase tracking-widest">ประเภทสถานที่</label>
                <div className="flex gap-2">
                  {(['ท่าเรือ', 'ในเรือ'] as CctvLocationType[]).map(locType => (
                    <button
                      key={locType}
                      type="button"
                      onClick={() => {
                        const defaultName = locType === 'ท่าเรือ' ? CCTV_PIERS[0] : CCTV_VESSELS[0];
                        setFaultForm(f => ({ ...f, locationType: locType, locationName: defaultName }));
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                        faultForm.locationType === locType
                          ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                          : 'bg-black/30 border-slate-700 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {locType === 'ท่าเรือ' ? <MapPin className="w-4 h-4" /> : <Ship className="w-4 h-4" />}
                      {locType}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Name Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  ระบุ{faultForm.locationType === 'ท่าเรือ' ? 'ท่าเรือ (11 ท่า)' : 'ในเรือ (7 ลำ)'}
                </label>
                <select
                  value={faultForm.locationName}
                  onChange={e => setFaultForm(f => ({ ...f, locationName: e.target.value }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none text-sm font-bold"
                >
                  {faultForm.locationType === 'ท่าเรือ'
                    ? CCTV_PIERS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))
                    : CCTV_VESSELS.map(v => (
                        <option key={v} value={v}>เรือ {v}</option>
                      ))
                  }
                </select>
              </div>

              {/* Camera Count (1-8) & Memory Size */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-sky-400" /> จำนวนกล้อง (1-8 ตัว)
                  </label>
                  <select
                    value={faultForm.cameraCount}
                    onChange={e => setFaultForm(f => ({ ...f, cameraCount: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none font-mono text-sm"
                  >
                    {Array.from({ length: 8 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num} ตัว</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" /> เมมโมรี่การ์ด
                  </label>
                  <select
                    value={faultForm.memorySize}
                    onChange={e => setFaultForm(f => ({ ...f, memorySize: e.target.value as CctvMemorySize }))}
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 outline-none font-mono text-sm"
                  >
                    {MEMORY_SIZES.map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Report date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> วันที่แจ้ง
                </label>
                <input
                  type="date"
                  value={faultForm.reportDate}
                  onChange={e => setFaultForm(f => ({ ...f, reportDate: e.target.value }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none font-mono"
                />
              </div>

              {/* Reporter name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> ชื่อผู้แจ้ง
                </label>
                <input
                  type="text"
                  value={faultForm.reporterName}
                  onChange={e => setFaultForm(f => ({ ...f, reporterName: e.target.value }))}
                  placeholder="กรอกชื่อ-นามสกุล"
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none"
                />
              </div>

              {/* Fault causes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-red-400 uppercase tracking-widest">เสีย : สาเหตุ (เลือกได้หลายอย่าง)</label>
                <div className="grid grid-cols-2 gap-2">
                  {FAULT_CAUSES.map((cause, idx) => (
                    <button
                      key={cause}
                      type="button"
                      onClick={() => toggleFaultCause(cause)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold border transition-all text-left ${
                        faultForm.faultCauses.includes(cause)
                          ? `${FAULT_COLORS[cause]} border-current`
                          : 'bg-black/30 border-slate-700 text-slate-500 hover:border-slate-600'
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

              {/* Fixed status & Date */}
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
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 uppercase tracking-wider">วันที่แก้ไขเสร็จ</label>
                    <input
                      type="date"
                      value={faultForm.fixedDate}
                      onChange={e => setFaultForm(f => ({ ...f, fixedDate: e.target.value }))}
                      className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Cause Details / Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">สาเหตุเพิ่มเติม / รายละเอียดการแก้ไข</label>
                <textarea
                  value={faultForm.causeDetails}
                  onChange={e => setFaultForm(f => ({ ...f, causeDetails: e.target.value }))}
                  placeholder="อธิบายรายละเอียดเพิ่มเติม..."
                  rows={3}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-sky-500 outline-none resize-none text-sm"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowFaultModal(false)}>ยกเลิก</Button>
              <Button onClick={saveFault} className="bg-sky-600 hover:bg-sky-500 text-white border-none">
                <Save className="w-4 h-4 mr-2" /> บันทึก
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
