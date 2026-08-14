import React, { useState, useMemo } from 'react';
import {
  Radio, Plus, X, Save, Search, Edit, Trash2, AlertTriangle,
  CheckCircle, MapPin, User, Calendar, Clock, ChevronDown, Filter
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type RadioLocationType = 'ท่าเรือ' | 'ในเรือ';

export type RadioFaultCause =
  | 'ไมค์เสีย'
  | 'ลำโพงเสีย'
  | 'เครื่องร้อน'
  | 'เปิดเครื่องไม่ติด'
  | 'สัญญาณขาดๆหายๆ'
  | 'แบตเสื่อม'
  | 'จอไม่ติด'
  | 'ตกน้ำ/สูญหาย';

export interface RadioFaultLog {
  id: string;
  radioId: string;             // Radio number 1-55
  reportDate: string;          // วันที่แจ้ง
  reporterName: string;        // ชื่อผู้แจ้ง
  locationType: RadioLocationType;
  locationDetail: string;      // ชื่อท่าเรือ / ชื่อเรือ
  faultCauses: RadioFaultCause[];  // เสีย: สาเหตุ (multiple)
  replacedDate?: string;       // เปลี่ยน: วันที่เปลี่ยน
  isReplaced: boolean;
  createdAt: string;
}

export interface RadioSignalLog {
  id: string;
  issueStartDatetime: string;  // วัน/เวลาที่ระบบสัญญาณมีปัญหา
  issueEndDatetime?: string;   // วัน/เวลาที่แก้ไขระบบเสร็จ
  cause: string;               // สาเหตุ
  isResolved: boolean;
  createdAt: string;
}

export interface RadioData {
  faultLogs: RadioFaultLog[];
  signalLogs: RadioSignalLog[];
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const TOTAL_RADIOS = 55;

const FAULT_CAUSES: RadioFaultCause[] = [
  'ไมค์เสีย',
  'ลำโพงเสีย',
  'เครื่องร้อน',
  'เปิดเครื่องไม่ติด',
  'สัญญาณขาดๆหายๆ',
  'แบตเสื่อม',
  'จอไม่ติด',
  'ตกน้ำ/สูญหาย',
];

const FAULT_COLORS: Record<RadioFaultCause, string> = {
  'ไมค์เสีย':          'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'ลำโพงเสีย':         'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  'เครื่องร้อน':        'bg-red-500/15 text-red-300 border-red-500/30',
  'เปิดเครื่องไม่ติด':  'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'สัญญาณขาดๆหายๆ':   'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'แบตเสื่อม':         'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'จอไม่ติด':          'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'ตกน้ำ/สูญหาย':      'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface RadioManagerProps {
  data: RadioData;
  onUpdate: (data: RadioData) => void;
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

const nowDatetimeLocal = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

const todayDate = () => new Date().toISOString().split('T')[0];

const formatDateTimeThai = (dt: string) => {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDateThai = (dt: string) => {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const RadioManager: React.FC<RadioManagerProps> = ({ data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'fault' | 'signal'>('fault');
  const [showFaultModal, setShowFaultModal] = useState(false);
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [editingFault, setEditingFault] = useState<RadioFaultLog | null>(null);
  const [editingSignal, setEditingSignal] = useState<RadioSignalLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRadioId, setFilterRadioId] = useState('');
  const [filterFaultCause, setFilterFaultCause] = useState<RadioFaultCause | ''>('');

  // ── Fault form state ──
  const emptyFault = (): Omit<RadioFaultLog, 'id' | 'createdAt'> => ({
    radioId: '1',
    reportDate: todayDate(),
    reporterName: '',
    locationType: 'ท่าเรือ',
    locationDetail: '',
    faultCauses: [],
    replacedDate: '',
    isReplaced: false,
  });

  const [faultForm, setFaultForm] = useState(emptyFault());

  // ── Signal form state ──
  const emptySignal = (): Omit<RadioSignalLog, 'id' | 'createdAt'> => ({
    issueStartDatetime: nowDatetimeLocal(),
    issueEndDatetime: '',
    cause: '',
    isResolved: false,
  });

  const [signalForm, setSignalForm] = useState(emptySignal());

  // ── Stats ──
  const brokenRadios = useMemo(() => {
    const radioIds = new Set(data.faultLogs.filter(l => !l.isReplaced).map(l => l.radioId));
    return radioIds.size;
  }, [data.faultLogs]);

  const activeSignalIssues = data.signalLogs.filter(l => !l.isResolved).length;

  // ── Filtered fault logs ──
  const filteredFaultLogs = useMemo(() => {
    return data.faultLogs.filter(log => {
      const matchSearch = searchTerm === '' ||
        log.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.locationDetail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.radioId.toString().includes(searchTerm);
      const matchRadio = filterRadioId === '' || log.radioId === filterRadioId;
      const matchCause = filterFaultCause === '' || log.faultCauses.includes(filterFaultCause as RadioFaultCause);
    }).sort((a, b) => {
      const numA = parseInt(a.radioId, 10) || 0;
      const numB = parseInt(b.radioId, 10) || 0;
      if (numA !== numB) {
        return numA - numB;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data.faultLogs, searchTerm, filterRadioId, filterFaultCause]);

  // ── Fault CRUD ──
  const openAddFault = () => {
    setEditingFault(null);
    setFaultForm(emptyFault());
    setShowFaultModal(true);
  };

  const openEditFault = (log: RadioFaultLog) => {
    setEditingFault(log);
    setFaultForm({
      radioId: log.radioId,
      reportDate: log.reportDate,
      reporterName: log.reporterName,
      locationType: log.locationType,
      locationDetail: log.locationDetail,
      faultCauses: log.faultCauses,
      replacedDate: log.replacedDate || '',
      isReplaced: log.isReplaced,
    });
    setShowFaultModal(true);
  };

  const saveFault = () => {
    if (!faultForm.reporterName.trim() || faultForm.faultCauses.length === 0) {
      alert('กรุณากรอกชื่อผู้แจ้ง และเลือกสาเหตุที่เสียอย่างน้อย 1 อย่าง');
      return;
    }
    let newFaultLogs: RadioFaultLog[];
    if (editingFault) {
      newFaultLogs = data.faultLogs.map(l =>
        l.id === editingFault.id ? { ...editingFault, ...faultForm } : l
      );
    } else {
      const newLog: RadioFaultLog = {
        id: `fault_${Date.now()}`,
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

  const toggleFaultCause = (cause: RadioFaultCause) => {
    setFaultForm(f => ({
      ...f,
      faultCauses: f.faultCauses.includes(cause)
        ? f.faultCauses.filter(c => c !== cause)
        : [...f.faultCauses, cause],
    }));
  };

  // ── Signal CRUD ──
  const openAddSignal = () => {
    setEditingSignal(null);
    setSignalForm(emptySignal());
    setShowSignalModal(true);
  };

  const openEditSignal = (log: RadioSignalLog) => {
    setEditingSignal(log);
    setSignalForm({
      issueStartDatetime: log.issueStartDatetime,
      issueEndDatetime: log.issueEndDatetime || '',
      cause: log.cause,
      isResolved: log.isResolved,
    });
    setShowSignalModal(true);
  };

  const saveSignal = () => {
    if (!signalForm.cause.trim()) {
      alert('กรุณากรอกสาเหตุระบบสัญญาณมีปัญหา');
      return;
    }
    let newSignalLogs: RadioSignalLog[];
    if (editingSignal) {
      newSignalLogs = data.signalLogs.map(l =>
        l.id === editingSignal.id ? { ...editingSignal, ...signalForm } : l
      );
    } else {
      const newLog: RadioSignalLog = {
        id: `signal_${Date.now()}`,
        ...signalForm,
        isResolved: !!signalForm.issueEndDatetime,
        createdAt: new Date().toISOString(),
      };
      newSignalLogs = [newLog, ...data.signalLogs];
    }
    onUpdate({ ...data, signalLogs: newSignalLogs });
    setShowSignalModal(false);
  };

  const deleteSignal = (id: string) => {
    if (!confirm('ยืนยันการลบรายการนี้?')) return;
    onUpdate({ ...data, signalLogs: data.signalLogs.filter(l => l.id !== id) });
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-violet-500/20 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-3">
            <Radio className="h-8 w-8 text-violet-400" />
            วิทยุสื่อสาร
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-[10px] uppercase tracking-widest">
            Radio Communication Management • เช่าทั้งหมด {TOTAL_RADIOS} เครื่อง
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-black border border-violet-900/50 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-violet-400 font-mono">{TOTAL_RADIOS}</div>
            <div className="text-[9px] text-violet-600 uppercase font-bold tracking-wider">ทั้งหมด</div>
          </div>
          <div className="bg-black border border-red-900/50 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-red-400 font-mono">{brokenRadios}</div>
            <div className="text-[9px] text-red-600 uppercase font-bold tracking-wider">เสีย</div>
          </div>
          <div className="bg-black border border-emerald-900/50 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-emerald-400 font-mono">{TOTAL_RADIOS - brokenRadios}</div>
            <div className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider">ใช้งานได้</div>
          </div>
          {activeSignalIssues > 0 && (
            <div className="bg-black border border-amber-900/50 rounded-lg px-4 py-2 text-center animate-pulse">
              <div className="text-2xl font-bold text-amber-400 font-mono">{activeSignalIssues}</div>
              <div className="text-[9px] text-amber-600 uppercase font-bold tracking-wider">สัญญาณมีปัญหา</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('fault')}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'fault'
              ? 'border-violet-400 text-violet-300'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> แจ้งวิทยุเสีย ({data.faultLogs.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('signal')}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'signal'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Radio className="w-4 h-4" /> ระบบสัญญาณมีปัญหา ({data.signalLogs.length})
            {activeSignalIssues > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                {activeSignalIssues}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* ════════════ FAULT TAB ════════════ */}
      {activeTab === 'fault' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="ค้นหา ชื่อผู้แจ้ง / สถานที่ / เลขวิทยุ..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500/50 font-mono text-sm"
              />
            </div>
            <select
              value={filterRadioId}
              onChange={e => setFilterRadioId(e.target.value)}
              className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-violet-500/50"
            >
              <option value="">วิทยุทุกเครื่อง</option>
              {Array.from({ length: TOTAL_RADIOS }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>วิทยุเครื่องที่ {i + 1}</option>
              ))}
            </select>
            <select
              value={filterFaultCause}
              onChange={e => setFilterFaultCause(e.target.value as RadioFaultCause | '')}
              className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-violet-500/50"
            >
              <option value="">สาเหตุทั้งหมด</option>
              {FAULT_CAUSES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Button onClick={openAddFault} className="bg-violet-600 hover:bg-violet-500 text-white border-none shrink-0">
              <Plus className="w-4 h-4 mr-2" /> แจ้งวิทยุเสีย
            </Button>
          </div>

          {/* Table */}
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-black/40 text-slate-400 text-xs uppercase tracking-wider font-mono whitespace-nowrap">
                    <th className="px-4 py-3 font-bold">#วิทยุ</th>
                    <th className="px-4 py-3 font-bold">วันที่แจ้ง</th>
                    <th className="px-4 py-3 font-bold">ชื่อผู้แจ้ง</th>
                    <th className="px-4 py-3 font-bold">สถานที่</th>
                    <th className="px-4 py-3 font-bold">สาเหตุที่เสีย</th>
                    <th className="px-4 py-3 font-bold">เปลี่ยนแล้ว</th>
                    <th className="px-4 py-3 font-bold text-right sticky right-0 bg-slate-900 border-l border-slate-800">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredFaultLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-mono">
                        — ยังไม่มีรายการแจ้งเสีย —
                      </td>
                    </tr>
                  ) : filteredFaultLogs.map(log => (
                    <tr key={log.id} className={`group hover:bg-slate-800/30 transition-all whitespace-nowrap ${log.isReplaced ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold text-xs font-mono">
                          {log.radioId}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300 text-xs">{formatDateThai(log.reportDate)}</td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{log.reporterName}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border w-fit ${
                            log.locationType === 'ท่าเรือ'
                              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                              : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          }`}>
                            {log.locationType}
                          </span>
                          <span className="text-slate-400 text-xs">{log.locationDetail}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {log.faultCauses.map(c => (
                            <span key={c} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${FAULT_COLORS[c]}`}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {log.isReplaced ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                              <CheckCircle className="w-3 h-3" /> เปลี่ยนแล้ว
                            </span>
                            {log.replacedDate && (
                              <span className="text-slate-400 text-[10px] font-mono">{formatDateThai(log.replacedDate)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-400 text-xs font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> ยังไม่เปลี่ยน
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right sticky right-0 bg-slate-900/80 backdrop-blur-sm border-l border-slate-800/50 group-hover:bg-slate-800/90 transition-all">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditFault(log)}
                            className="p-1.5 text-slate-500 hover:text-violet-400 hover:bg-violet-950/30 rounded-full transition-all"
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
      )}

      {/* ════════════ SIGNAL TAB ════════════ */}
      {activeTab === 'signal' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddSignal} className="bg-amber-600 hover:bg-amber-500 text-white border-none">
              <Plus className="w-4 h-4 mr-2" /> แจ้งปัญหาสัญญาณ
            </Button>
          </div>

          <div className="space-y-3">
            {data.signalLogs.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500 font-mono">
                — ยังไม่มีรายการปัญหาระบบสัญญาณ —
              </Card>
            ) : [...data.signalLogs]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(log => (
                <Card key={log.id} className={`border bg-slate-900/40 p-4 ${
                  log.isResolved ? 'border-slate-800' : 'border-amber-500/30 bg-amber-500/5'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.isResolved ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                            <CheckCircle className="w-3 h-3" /> แก้ไขแล้ว
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> มีปัญหาอยู่
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-0.5">วัน/เวลาที่มีปัญหา</p>
                          <p className="text-amber-300 font-mono text-xs">{formatDateTimeThai(log.issueStartDatetime)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-0.5">วัน/เวลาที่แก้ไขเสร็จ</p>
                          <p className={`font-mono text-xs ${log.issueEndDatetime ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {log.issueEndDatetime ? formatDateTimeThai(log.issueEndDatetime) : '— ยังไม่แก้ไข —'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-0.5">ระยะเวลา</p>
                          <p className="text-slate-400 text-xs font-mono">
                            {log.issueEndDatetime ? (() => {
                              const diff = new Date(log.issueEndDatetime).getTime() - new Date(log.issueStartDatetime).getTime();
                              const h = Math.floor(diff / 3600000);
                              const m = Math.floor((diff % 3600000) / 60000);
                              return `${h}ชม. ${m}นาที`;
                            })() : '—'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-0.5">สาเหตุ</p>
                        <p className="text-slate-200 text-sm">{log.cause}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => openEditSignal(log)}
                        className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-950/30 rounded-full transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSignal(log.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* ════════════ FAULT MODAL ════════════ */}
      {showFaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-slate-900 border-violet-500/30 shadow-[0_0_50px_rgba(139,92,246,0.2)] max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-violet-950/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-violet-400" />
                {editingFault ? 'แก้ไขรายการวิทยุเสีย' : 'แจ้งวิทยุเสีย'}
              </h3>
              <button onClick={() => setShowFaultModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Radio number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-violet-400 uppercase tracking-widest">เลขวิทยุ (1-{TOTAL_RADIOS})</label>
                <select
                  value={faultForm.radioId}
                  onChange={e => setFaultForm(f => ({ ...f, radioId: e.target.value }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 outline-none font-mono"
                >
                  {Array.from({ length: TOTAL_RADIOS }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>วิทยุเครื่องที่ {i + 1}</option>
                  ))}
                </select>
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
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 outline-none font-mono"
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
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 outline-none"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> สถานที่
                </label>
                <div className="flex gap-2">
                  {(['ท่าเรือ', 'ในเรือ'] as RadioLocationType[]).map(loc => (
                    <button
                      key={loc}
                      onClick={() => setFaultForm(f => ({ ...f, locationType: loc }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                        faultForm.locationType === loc
                          ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                          : 'bg-black/30 border-slate-700 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={faultForm.locationDetail}
                  onChange={e => setFaultForm(f => ({ ...f, locationDetail: e.target.value }))}
                  placeholder={faultForm.locationType === 'ท่าเรือ' ? 'ชื่อท่าเรือ เช่น สาทร, ราชวงศ์' : 'ชื่อเรือ เช่น CTB1, CTB2'}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 outline-none mt-2"
                />
              </div>

              {/* Fault causes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-red-400 uppercase tracking-widest">เสีย: สาเหตุ (เลือกได้หลายอย่าง)</label>
                <div className="grid grid-cols-2 gap-2">
                  {FAULT_CAUSES.map((cause, idx) => (
                    <button
                      key={cause}
                      onClick={() => toggleFaultCause(cause)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold border transition-all text-left ${
                        faultForm.faultCauses.includes(cause)
                          ? `${FAULT_COLORS[cause]} border-current`
                          : 'bg-black/30 border-slate-700 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      {cause}
                    </button>
                  ))}
                </div>
              </div>

              {/* Replaced */}
              <div className="space-y-2 p-3 rounded-lg bg-black/30 border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={faultForm.isReplaced}
                    onChange={e => setFaultForm(f => ({ ...f, isReplaced: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">เปลี่ยนวิทยุแล้ว</span>
                </label>
                {faultForm.isReplaced && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 uppercase tracking-wider">วันที่เปลี่ยน</label>
                    <input
                      type="date"
                      value={faultForm.replacedDate}
                      onChange={e => setFaultForm(f => ({ ...f, replacedDate: e.target.value }))}
                      className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowFaultModal(false)}>ยกเลิก</Button>
              <Button onClick={saveFault} className="bg-violet-600 hover:bg-violet-500 text-white border-none">
                <Save className="w-4 h-4 mr-2" /> บันทึก
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ════════════ SIGNAL MODAL ════════════ */}
      {showSignalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-slate-900 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-amber-950/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                {editingSignal ? 'แก้ไขปัญหาระบบสัญญาณ' : 'แจ้งปัญหาระบบสัญญาณ'}
              </h3>
              <button onClick={() => setShowSignalModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> วัน/เวลาที่ระบบสัญญาณมีปัญหา
                </label>
                <input
                  type="datetime-local"
                  value={signalForm.issueStartDatetime}
                  onChange={e => setSignalForm(f => ({ ...f, issueStartDatetime: e.target.value }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-amber-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> วัน/เวลาที่แก้ไขระบบเสร็จ (เว้นว่างถ้ายังไม่แก้ไข)
                </label>
                <input
                  type="datetime-local"
                  value={signalForm.issueEndDatetime}
                  onChange={e => setSignalForm(f => ({
                    ...f,
                    issueEndDatetime: e.target.value,
                    isResolved: !!e.target.value,
                  }))}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">สาเหตุ</label>
                <textarea
                  value={signalForm.cause}
                  onChange={e => setSignalForm(f => ({ ...f, cause: e.target.value }))}
                  placeholder="อธิบายสาเหตุที่ระบบสัญญาณมีปัญหา..."
                  rows={3}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-amber-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowSignalModal(false)}>ยกเลิก</Button>
              <Button onClick={saveSignal} className="bg-amber-600 hover:bg-amber-500 text-white border-none">
                <Save className="w-4 h-4 mr-2" /> บันทึก
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
