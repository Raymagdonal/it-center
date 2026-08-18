import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Tablet, Search, Plus, Edit, Trash2, X, Save,
  Hash, Calendar, FileText, MapPin,
  Filter, RefreshCcw, Loader2, CloudOff, Cloud, CheckSquare, Square
} from 'lucide-react';
import { TicketMachine } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import {
  fetchTicketMachines,
  createTicketMachine,
  updateTicketMachine,
  deleteTicketMachine,
  resetTicketMachines
} from '../services/ticketMachineApi';

interface TicketMachineManagerProps {
  items: TicketMachine[];
  onUpdate: (items: TicketMachine[]) => void;
  onReset?: () => void;
}

// Location color mapping for badges
const LOCATION_COLORS: Record<string, string> = {
  'IT': 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  'พรานนก1': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'พรานนก2': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'มหาราช': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'ท่าช้าง': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  'ราชินี': 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  'ราชวงศ์': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  'ไอคอนสยาม': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  'สาทร': 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  'สาทร1': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  'สาทร2': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  'BTS': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'CTB1': 'bg-yellow-400/25 text-yellow-200 border-yellow-400/50',
  'CTB2': 'bg-yellow-400/25 text-yellow-200 border-yellow-400/50',
  'CTB3': 'bg-yellow-400/25 text-yellow-200 border-yellow-400/50',
  'CTB4': 'bg-yellow-400/25 text-yellow-200 border-yellow-400/50',
  'R1': 'bg-orange-400/25 text-orange-200 border-orange-400/50',
  'R2': 'bg-green-400/25 text-green-200 border-green-400/50',
  'R3': 'bg-orange-400/25 text-orange-200 border-orange-400/50',
  'R4': 'bg-green-400/25 text-green-200 border-green-400/50',
  'พระอาทิตย์': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  'วัดอรุณฯ': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  'เอเชียทีค': 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
  'พรานนก': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'นายตรวจเด': 'bg-red-500/20 text-red-300 border-red-500/40',
  'นายตรวจต้อม': 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  'นายตรวจเบน': 'bg-lime-500/20 text-lime-300 border-lime-500/40',
  'นายตรวจต๋อ': 'bg-amber-400/25 text-amber-200 border-amber-400/50',
};

const getLocationColor = (location: string): string => {
  return LOCATION_COLORS[location] || 'bg-slate-500/20 text-slate-300 border-slate-500/40';
};

const ALL_LOCATIONS = [
  'IT', 'สาทร', 'สาทร1', 'สาทร2',
  'พรานนก1', 'พรานนก2', 'พรานนก', 'มหาราช', 'ท่าช้าง',
  'ราชินี', 'ราชวงศ์', 'ไอคอนสยาม', 'พระอาทิตย์',
  'วัดอรุณฯ', 'เอเชียทีค', 'BTS',
  'CTB1', 'CTB2', 'CTB3', 'CTB4',
  'R1', 'R2', 'R3', 'R4',
  'นายตรวจเด', 'นายตรวจต้อม', 'นายตรวจเบน', 'นายตรวจต๋อ',
];

export const TicketMachineManager: React.FC<TicketMachineManagerProps> = ({ items, onUpdate, onReset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TicketMachine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const initialFormState = {
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    deviceName: 'Famoco FX205',
    location: '',
    status: 'ACTIVE' as const,
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch data from MongoDB on mount
  const loadFromApi = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTicketMachines();
      if (data.length > 0) {
        onUpdate(data);
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [onUpdate]);

  // Get unique locations from data
  const uniqueLocations = useMemo(() => {
    const locs = new Set(items.map(i => i.location));
    return Array.from(locs).sort();
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = searchTerm === '' ||
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = filterLocation === 'ALL' || item.location === filterLocation;
      return matchesSearch && matchesLocation;
    });
  }, [items, searchTerm, filterLocation]);

  // Select all matching filter toggle
  const isAllSelected = useMemo(() => {
    return filteredItems.length > 0 && filteredItems.every(i => selectedIds.has(i.id));
  }, [filteredItems, selectedIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all filtered items
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredItems.forEach(i => next.delete(i.id));
        return next;
      });
    } else {
      // Select all filtered items
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredItems.forEach(i => next.add(i.id));
        return next;
      });
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Stats
  const stats = useMemo(() => ({
    total: items.length,
    locations: new Set(items.map(i => i.location)).size,
    devices: new Set(items.map(i => i.deviceName)).size,
  }), [items]);

  // CRUD Handlers
  const handleOpenModal = (item?: TicketMachine) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        serialNumber: item.serialNumber,
        purchaseDate: item.purchaseDate,
        notes: item.notes,
        deviceName: item.deviceName,
        location: item.location,
        status: item.status || 'ACTIVE',
      });
    } else {
      setEditingItem(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serialNumber || !formData.location) {
      alert('กรุณากรอกหมายเลข Serial No. และสถานที่');
      return;
    }

    setIsLoading(true);
    try {
      if (editingItem) {
        const updated = await updateTicketMachine(editingItem.id, formData);
        if (updated) {
          onUpdate(items.map(i => i.id === editingItem.id ? updated : i));
        } else {
          onUpdate(items.map(i => i.id === editingItem.id ? { ...i, ...formData } : i));
        }
      } else {
        const created = await createTicketMachine(formData);
        if (created) {
          onUpdate([...items, created]);
        } else {
          const newItem: TicketMachine = { id: Math.random().toString(36).substr(2, 9), ...formData };
          onUpdate([...items, newItem]);
        }
      }
    } finally {
      setIsLoading(false);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Single Delete Handler
  const handleDelete = async (id: string) => {
    const target = items.find(i => i.id === id);
    const targetName = target ? `${target.deviceName} (${target.serialNumber})` : 'รายการนี้';
    if (!confirm(`ยืนยันการลบ ${targetName} ใช่หรือไม่?`)) return;

    // Optimistic local update
    onUpdate(items.filter(i => i.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    try {
      await deleteTicketMachine(id);
    } catch (err) {
      console.warn('API delete warning:', err);
    }
  };

  // Batch Delete Handler
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`ยืนยันการลบเครื่องจำหน่ายตั๋วที่เลือกทั้งหมด ${count} รายการ ใช่หรือไม่?`)) return;

    const toDeleteIds = Array.from(selectedIds);
    // Optimistic local update
    onUpdate(items.filter(i => !selectedIds.has(i.id)));
    setSelectedIds(new Set());

    try {
      await Promise.allSettled(toDeleteIds.map(id => deleteTicketMachine(id)));
    } catch (err) {
      console.warn('API batch delete warning:', err);
    }
  };

  const handleReset = async () => {
    if (!confirm('ต้องการรีเซ็ตข้อมูลทั้งหมดเป็นค่าเริ่มต้น (102 รายการ) ใช่หรือไม่?')) return;
    setIsLoading(true);
    try {
      const success = await resetTicketMachines();
      if (success) {
        await loadFromApi();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-500/20 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-3">
            <Tablet className="h-8 w-8 text-cyan-400" />
            เครื่องจำหน่ายตั๋ว
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            Ticket Machine Management • Famoco FX205 Fleet
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400"><Cloud className="w-3 h-3" /> API Server</span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400"><CloudOff className="w-3 h-3" /> Offline</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="bg-black border border-cyan-900/50 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-cyan-400 font-mono">{stats.total}</div>
              <div className="text-[9px] text-cyan-600 uppercase font-bold tracking-wider">เครื่อง</div>
            </div>
            <div className="bg-black border border-cyan-900/50 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-cyan-400 font-mono">{stats.locations}</div>
              <div className="text-[9px] text-cyan-600 uppercase font-bold tracking-wider">สถานที่</div>
            </div>
          </div>

          {/* Reload from API */}
          <Button variant="ghost" onClick={loadFromApi} disabled={isLoading} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            โหลดข้อมูล
          </Button>

          {/* Reset Data */}
          <Button variant="ghost" onClick={handleReset} disabled={isLoading} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
            <RefreshCcw className="mr-2 h-4 w-4" /> รีเซ็ตข้อมูล
          </Button>

          <Button onClick={() => handleOpenModal()} disabled={isLoading} className="shadow-[0_0_20px_rgba(0,242,255,0.3)]">
            <Plus className="mr-2 h-4 w-4" /> เพิ่มเครื่อง
          </Button>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-3 text-cyan-400 font-mono text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          กำลังโหลดข้อมูล...
        </div>
      )}

      {/* Search & Filter & Bulk Actions Bar */}
      <div className="bg-black/60 border border-cyan-900/30 p-3 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="relative w-full md:max-w-lg group">
          <input
            type="text"
            placeholder="ค้นหา Serial No. / ชื่ออุปกรณ์ / สถานที่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-cyan-300 focus:border-cyan-500 outline-none transition-all placeholder-slate-600 font-mono"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Bulk Delete Button when items selected */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleBatchDelete}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/50 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-in fade-in duration-200"
            >
              <Trash2 className="w-4 h-4" />
              ลบที่เลือก ({selectedIds.size} รายการ)
            </button>
          )}

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="bg-black border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-400 font-bold outline-none focus:border-cyan-500 cursor-pointer appearance-none pr-8"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
            >
              <option value="ALL">ทุกสถานที่</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="text-xs font-mono text-cyan-600 uppercase tracking-widest font-bold flex items-center gap-2">
            แสดง: <span className="text-white">{filteredItems.length}</span> / {items.length}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <Card className="border-cyan-500/20 bg-black/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-cyan-900/50">
                  {/* Select All Checkbox */}
                  <th className="py-4 pl-4 pr-2 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-cyan-400 transition-colors"
                      title={isAllSelected ? "ยกเลิกเลือกทั้งหมด" : "เลือกทั้งหมด"}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-2 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest w-12">#</th>
                  <th className="py-4 px-4 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><Hash className="w-3 h-3" /> เลข Serial No.</div>
                  </th>
                  <th className="py-4 px-4 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> วันที่ซื้ออุปกรณ์</div>
                  </th>
                  <th className="py-4 px-4 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><FileText className="w-3 h-3" /> หมายเหตุ</div>
                  </th>
                  <th className="py-4 px-4 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><Tablet className="w-3 h-3" /> ชื่ออุปกรณ์</div>
                  </th>
                  <th className="py-4 px-4 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> สถานที่</div>
                  </th>
                  <th className="py-4 px-6 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest text-right w-28">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Tablet className="w-12 h-12 text-slate-800 mx-auto mb-3" />
                      <p className="text-slate-500 font-mono text-sm">ไม่พบข้อมูลเครื่องจำหน่ายตั๋ว</p>
                      <Button onClick={() => handleOpenModal()} className="mt-4" size="sm">
                        <Plus className="mr-2 h-4 w-4" /> เพิ่มเครื่อง
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`group transition-colors ${
                          isSelected
                            ? 'bg-cyan-950/40 border-l-2 border-cyan-400'
                            : 'hover:bg-cyan-900/10'
                        }`}
                      >
                        {/* Row Checkbox */}
                        <td className="py-3 pl-4 pr-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectItem(item.id)}
                            className="text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-slate-500 font-mono text-sm font-bold">{index + 1}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-cyan-300 font-mono text-sm tracking-wide font-medium">{item.serialNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-300 text-sm">{formatDate(item.purchaseDate)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-400 text-sm">{item.notes || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white font-bold text-sm font-display">{item.deviceName}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getLocationColor(item.location)}`}>
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <div className="flex justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenModal(item)}
                              className="p-1.5 bg-slate-900 border border-slate-700 text-cyan-400 hover:text-black hover:bg-cyan-400 rounded transition-all"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 bg-slate-900 border border-slate-700 text-red-400 hover:text-white hover:bg-red-600 rounded transition-all"
                              title="ลบรายการนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg border-cyan-500 bg-slate-950 shadow-[0_0_50px_rgba(0,242,255,0.2)]">
            <CardHeader className="flex flex-row justify-between items-center bg-cyan-900/20 border-b border-cyan-500/30">
              <CardTitle>{editingItem ? 'แก้ไขข้อมูลเครื่อง' : 'เพิ่มเครื่องจำหน่ายตั๋วใหม่'}</CardTitle>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">เลข Serial No.</label>
                  <input required className="w-full bg-black border border-slate-800 p-3 text-cyan-300 focus:border-cyan-500 outline-none font-mono text-sm rounded" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} placeholder="(01)03770004396818(21)XXXXX" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">ชื่ออุปกรณ์</label>
                  <input required className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none font-display tracking-wide rounded" value={formData.deviceName} onChange={e => setFormData({ ...formData, deviceName: e.target.value })} placeholder="Famoco FX205" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">วันที่ซื้อ</label>
                    <input type="date" required className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none rounded" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">สถานที่</label>
                    <input required list="location-options" className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none rounded" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="เลือกหรือพิมพ์สถานที่" />
                    <datalist id="location-options">
                      {ALL_LOCATIONS.map(loc => (<option key={loc} value={loc} />))}
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">หมายเหตุ</label>
                  <input className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none rounded" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="เช่น ซื้อจาก BSS" />
                </div>
                <div className="pt-4 flex gap-3">
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDelete(editingItem.id);
                        setIsModalOpen(false);
                      }}
                      className="px-4 py-2.5 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/50 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                      title="ลบเครื่องนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                      ลบเครื่องนี้
                    </button>
                  )}
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">ยกเลิก</Button>
                  <Button type="submit" className="flex-[2] shadow-[0_0_20px_rgba(0,242,255,0.4)]" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มเครื่อง'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}
