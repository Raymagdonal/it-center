import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Tablet, Search, Plus, Edit, Trash2, X, Save,
  Hash, Calendar, FileText, MapPin,
  Filter, RefreshCcw, Loader2, CloudOff, Cloud, CheckSquare, Square,
  AlertTriangle, Check, Upload, Image as ImageIcon, Eye, ZoomIn,
  ChevronLeft, ChevronRight, Maximize2,
  GripVertical, ArrowUp, ArrowDown, ArrowUpDown, Move
} from 'lucide-react';
import { TicketMachine } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { compressImage } from '../utils/storageUtils';
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

// Helper to get a stable unique key for each item
const getItemKey = (item: TicketMachine, index?: number): string => {
  return item.id || (item as any)._id || item.serialNumber || `item_${index}`;
};

export const TicketMachineManager: React.FC<TicketMachineManagerProps> = ({ items, onUpdate, onReset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [filterDevice, setFilterDevice] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TicketMachine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Drag & drop reordering state
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | null>(null);
  const [jumpModalItem, setJumpModalItem] = useState<{ item: TicketMachine; currentIndex: number } | null>(null);
  const [jumpTargetIndex, setJumpTargetIndex] = useState<number>(1);

  // Lightbox & image upload state
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initialFormState = {
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    deviceName: 'Famoco FX205',
    location: '',
    status: 'ACTIVE' as const,
    images: [] as string[],
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch data from API
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

  // Get unique device names with counts
  const uniqueDevices = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(i => {
      const dev = (i.deviceName || '').trim() || 'ไม่ระบุ';
      map.set(dev, (map.get(dev) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  // Get unique locations from data with counts
  const uniqueLocations = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(i => {
      const loc = (i.location || '').trim() || 'ไม่ระบุ';
      map.set(loc, (map.get(loc) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'th'));
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
      const matchesDevice = filterDevice === 'ALL' || item.deviceName === filterDevice;
      return matchesSearch && matchesLocation && matchesDevice;
    });
  }, [items, searchTerm, filterLocation, filterDevice]);

  // Check if all currently visible filtered items are selected
  const isAllSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    return filteredItems.every(i => selectedKeys.has(getItemKey(i)));
  }, [filteredItems, selectedKeys]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all filtered items
      setSelectedKeys(prev => {
        const next = new Set(prev);
        filteredItems.forEach(i => next.delete(getItemKey(i)));
        return next;
      });
    } else {
      // Select all filtered items
      setSelectedKeys(prev => {
        const next = new Set(prev);
        filteredItems.forEach(i => next.add(getItemKey(i)));
        return next;
      });
    }
  };

  const toggleSelectItem = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedKeys(new Set());
  };

  // ── Reordering Handlers ──
  const moveItem = (sourceKey: string, targetKey: string, position: 'top' | 'bottom' = 'bottom') => {
    if (sourceKey === targetKey) return;
    const sourceIdx = items.findIndex((i, idx) => getItemKey(i, idx) === sourceKey);
    const targetIdx = items.findIndex((i, idx) => getItemKey(i, idx) === targetKey);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(sourceIdx, 1);
    
    let insertIdx = newItems.findIndex((i, idx) => getItemKey(i, idx) === targetKey);
    if (position === 'bottom') {
      insertIdx += 1;
    }
    newItems.splice(insertIdx, 0, movedItem);
    onUpdate(newItems);
  };

  const moveItemStep = (key: string, direction: 'up' | 'down') => {
    const idx = items.findIndex((i, index) => getItemKey(i, index) === key);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const newItems = [...items];
    const temp = newItems[idx];
    newItems[idx] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    onUpdate(newItems);
  };

  const jumpItemToIndex = (key: string, target1BasedIndex: number) => {
    const sourceIdx = items.findIndex((i, index) => getItemKey(i, index) === key);
    if (sourceIdx === -1) return;
    const clampedTarget = Math.max(0, Math.min(items.length - 1, target1BasedIndex - 1));
    if (sourceIdx === clampedTarget) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(sourceIdx, 1);
    newItems.splice(clampedTarget, 0, movedItem);
    onUpdate(newItems);
  };

  const moveSelectedItemsTo = (destination: 'top' | 'bottom') => {
    if (selectedKeys.size === 0) return;
    const selectedList: TicketMachine[] = [];
    const unselectedList: TicketMachine[] = [];
    items.forEach((item, idx) => {
      if (selectedKeys.has(getItemKey(item, idx))) {
        selectedList.push(item);
      } else {
        unselectedList.push(item);
      }
    });

    if (destination === 'top') {
      onUpdate([...selectedList, ...unselectedList]);
    } else {
      onUpdate([...unselectedList, ...selectedList]);
    }
  };

  const handleDragStart = (e: React.DragEvent, key: string) => {
    setDraggedKey(key);
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (!draggedKey || draggedKey === key) return;
    e.dataTransfer.dropEffect = 'move';
    
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'top' : 'bottom';
    
    if (dragOverKey !== key || dragOverPosition !== position) {
      setDragOverKey(key);
      setDragOverPosition(position);
    }
  };

  const handleDragLeave = (e: React.DragEvent, key: string) => {
    if (dragOverKey === key) {
      setDragOverKey(null);
      setDragOverPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (draggedKey && draggedKey !== targetKey) {
      moveItem(draggedKey, targetKey, dragOverPosition || 'bottom');
    }
    setDraggedKey(null);
    setDragOverKey(null);
    setDragOverPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedKey(null);
    setDragOverKey(null);
    setDragOverPosition(null);
  };

// Helper to filter out corrupted or invalid image strings
const sanitizeImages = (imgs?: any[]): string[] => {
  if (!Array.isArray(imgs)) return [];
  return imgs.filter(img => typeof img === 'string' && (img.startsWith('data:image') || img.startsWith('http') || img.startsWith('/')));
};

// Lightbox handlers
  const openLightbox = (images: string[], index = 0) => {
    const valid = sanitizeImages(images);
    if (valid.length === 0) return;
    setLightboxImages(valid);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImages(null);
    setLightboxIndex(0);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxImages) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setLightboxIndex(prev => (prev + 1) % lightboxImages.length);
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImages]);

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const comp = await compressImage(file, 800, 0.65);
        if (comp && comp.startsWith('data:image')) {
          compressedList.push(comp);
        }
      }
      setFormData(prev => ({
        ...prev,
        images: [...sanitizeImages(prev.images), ...compressedList],
      }));
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: sanitizeImages(prev.images).filter((_, idx) => idx !== indexToRemove),
    }));
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
      const rawImages = Array.isArray(item.images) ? item.images : (item.imageUrl ? [item.imageUrl] : []);
      const itemImages = sanitizeImages(rawImages);
      setFormData({
        serialNumber: item.serialNumber,
        purchaseDate: item.purchaseDate,
        notes: item.notes,
        deviceName: item.deviceName,
        location: item.location,
        status: item.status || 'ACTIVE',
        images: itemImages,
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
        const editingKey = getItemKey(editingItem);
        const updatedItems = items.map(i => getItemKey(i) === editingKey ? { ...i, ...formData } : i);
        onUpdate(updatedItems);
        updateTicketMachine(editingItem.id, formData).catch(() => {});
      } else {
        const newItem: TicketMachine = { id: `tm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, ...formData };
        onUpdate([...items, newItem]);
        createTicketMachine(formData).catch(() => {});
      }
    } finally {
      setIsLoading(false);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Single Delete Handler
  const handleDelete = (item: TicketMachine) => {
    const key = getItemKey(item);
    const label = `${item.deviceName} (${item.serialNumber})`;
    if (!confirm(`ยืนยันการลบ ${label} ใช่หรือไม่?`)) return;

    // Instant local state update
    const updatedItems = items.filter(i => getItemKey(i) !== key);
    onUpdate(updatedItems);

    // Remove from selected set
    setSelectedKeys(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    // Background API call
    if (item.id) {
      deleteTicketMachine(item.id).catch(() => {});
    }
  };

  // Batch Delete Handler
  const handleBatchDelete = () => {
    if (selectedKeys.size === 0) return;
    const count = selectedKeys.size;
    if (!confirm(`ยืนยันการลบเครื่องจำหน่ายตั๋วที่เลือกทั้งหมด ${count} รายการ ใช่หรือไม่?`)) return;

    // Filter out all items that match any selected key
    const updatedItems = items.filter(i => !selectedKeys.has(getItemKey(i)));
    const deletedItems = items.filter(i => selectedKeys.has(getItemKey(i)));

    // Instant local state update
    onUpdate(updatedItems);
    setSelectedKeys(new Set());

    // Background API calls
    deletedItems.forEach(i => {
      if (i.id) {
        deleteTicketMachine(i.id).catch(() => {});
      }
    });
  };

  const handleReset = async () => {
    if (!confirm('ต้องการรีเซ็ตข้อมูลทั้งหมดเป็นค่าเริ่มต้นใช่หรือไม่?')) return;
    setIsLoading(true);
    try {
      if (onReset) {
        onReset();
      }
      await resetTicketMachines();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto space-y-6 animate-in fade-in duration-500 pb-28">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-500/20 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-3">
            <Tablet className="h-8 w-8 text-cyan-400" />
            เครื่องจำหน่ายตั๋ว
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            Ticket Machine Management • Famoco FX205 & Printers
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400"><Cloud className="w-3 h-3" /> ออนไลน์</span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400"><CloudOff className="w-3 h-3" /> ออฟไลน์</span>
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
          กำลังดำเนินการ...
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-black/60 border border-cyan-900/30 p-3 rounded-lg flex flex-col gap-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:max-w-md group">
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
            {/* Quick Select All / Unselect All */}
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-3 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-mono font-bold text-slate-300 hover:text-white rounded-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                  ยกเลิกเลือกทั้งหมด
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-500" />
                  เลือกทั้งหมดในหน้านี้ ({filteredItems.length})
                </>
              )}
            </button>

            {/* Device Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Tablet className="w-4 h-4 text-cyan-400" />
              <select
                value={filterDevice}
                onChange={(e) => setFilterDevice(e.target.value)}
                className="bg-black border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-400 font-bold outline-none focus:border-cyan-500 cursor-pointer appearance-none pr-8"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
              >
                <option value="ALL">ทุกอุปกรณ์ ({items.length})</option>
                {uniqueDevices.map(([dev, count]) => (
                  <option key={dev} value={dev}>{dev} ({count})</option>
                ))}
              </select>
            </div>

            {/* Location Filter Dropdown */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="bg-black border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-400 font-bold outline-none focus:border-cyan-500 cursor-pointer appearance-none pr-8"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
              >
                <option value="ALL">ทุกสถานที่ ({items.length})</option>
                {uniqueLocations.map(([loc, count]) => (
                  <option key={loc} value={loc}>{loc} ({count})</option>
                ))}
              </select>
            </div>

            <div className="text-xs font-mono text-cyan-600 uppercase tracking-widest font-bold flex items-center gap-2">
              แสดง: <span className="text-white">{filteredItems.length}</span> / {items.length}
            </div>
          </div>
        </div>

        {/* Quick Device Filter Chips */}
        {uniqueDevices.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 border-t border-slate-800/60 scrollbar-none">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-cyan-500" /> อุปกรณ์:
            </span>
            <button
              type="button"
              onClick={() => setFilterDevice('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                filterDevice === 'ALL'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,242,255,0.4)]'
                  : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
              }`}
            >
              ทั้งหมด ({items.length})
            </button>
            {uniqueDevices.map(([dev, count]) => (
              <button
                key={dev}
                type="button"
                onClick={() => setFilterDevice(prev => prev === dev ? 'ALL' : dev)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  filterDevice === dev
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,242,255,0.4)]'
                    : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50'
                }`}
              >
                <span>{dev}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filterDevice === dev ? 'bg-black/40 text-black font-bold' : 'bg-black/60 text-cyan-400 font-bold'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Data Table */}
      <Card className="border-cyan-500/20 bg-black/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-cyan-900/50">
                  {/* Drag Handle Header */}
                  <th className="py-4 px-2 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest text-center w-14" title="ลากเพื่อสลับตำแหน่ง">
                    <div className="flex items-center justify-center gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5 text-cyan-500" />
                    </div>
                  </th>
                  {/* Select All Checkbox Header */}
                  <th className="py-4 pl-2 pr-2 w-10 text-center">
                    <div
                      onClick={toggleSelectAll}
                      className="cursor-pointer inline-flex items-center justify-center p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                      title={isAllSelected ? "ยกเลิกเลือกทั้งหมด" : "เลือกทั้งหมด"}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-2 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest w-14 text-center">
                    <span title="ลำดับ (คลิกเพื่อย้าย)"># ลำดับ</span>
                  </th>
                  <th className="py-4 px-4 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><Hash className="w-3 h-3" /> เลข SERIAL NO.</div>
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
                  <th className="py-4 px-3 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest text-center w-24">
                    <div className="flex items-center justify-center gap-1.5"><ImageIcon className="w-3 h-3" /> รูปภาพ</div>
                  </th>
                  <th className="py-4 px-4 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> สถานที่</div>
                  </th>
                  <th className="py-4 px-6 text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest text-right w-28">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <Tablet className="w-12 h-12 text-slate-800 mx-auto mb-3" />
                      <p className="text-slate-500 font-mono text-sm">ไม่พบข้อมูลเครื่องจำหน่ายตั๋ว</p>
                      <Button onClick={() => handleOpenModal()} className="mt-4" size="sm">
                        <Plus className="mr-2 h-4 w-4" /> เพิ่มเครื่อง
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => {
                    const key = getItemKey(item, index);
                    const isSelected = selectedKeys.has(key);
                    const rawImages = Array.isArray(item.images) ? item.images : (item.imageUrl ? [item.imageUrl] : []);
                    const itemImages = sanitizeImages(rawImages);
                    const fullListIndex = items.findIndex((it, idx) => getItemKey(it, idx) === key);
                    const displayIndex = fullListIndex >= 0 ? fullListIndex + 1 : index + 1;

                    return (
                      <tr
                        key={key}
                        draggable
                        onDragStart={(e) => handleDragStart(e, key)}
                        onDragOver={(e) => handleDragOver(e, key)}
                        onDragLeave={(e) => handleDragLeave(e, key)}
                        onDrop={(e) => handleDrop(e, key)}
                        onDragEnd={handleDragEnd}
                        className={`transition-all ${
                          draggedKey === key
                            ? 'opacity-30 bg-cyan-950/30 scale-[0.99] border-2 border-dashed border-cyan-500'
                            : dragOverKey === key
                            ? dragOverPosition === 'top'
                              ? 'border-t-4 border-t-cyan-400 bg-cyan-900/20 shadow-[0_-4px_12px_rgba(0,242,255,0.3)]'
                              : 'border-b-4 border-b-cyan-400 bg-cyan-900/20 shadow-[0_4px_12px_rgba(0,242,255,0.3)]'
                            : isSelected
                            ? 'bg-cyan-950/60 border-l-4 border-cyan-400'
                            : 'hover:bg-cyan-900/10'
                        }`}
                      >
                        {/* Drag Handle & Step Buttons */}
                        <td className="py-3.5 px-2 text-center select-none">
                          <div className="flex items-center justify-center gap-0.5">
                            <div
                              className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/60 rounded transition-all"
                              title="ลากเพื่อสลับตำแหน่งอย่างอิสระ"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <button
                                type="button"
                                disabled={fullListIndex <= 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveItemStep(key, 'up');
                                }}
                                className="text-slate-500 hover:text-cyan-400 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors p-0.5"
                                title="เลื่อนขึ้น 1 ตำแหน่ง"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={fullListIndex >= items.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveItemStep(key, 'down');
                                }}
                                className="text-slate-500 hover:text-cyan-400 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors p-0.5"
                                title="เลื่อนลง 1 ตำแหน่ง"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Row Checkbox */}
                        <td
                          className="py-3.5 pl-2 pr-2 text-center cursor-pointer select-none"
                          onClick={() => toggleSelectItem(key)}
                        >
                          <div className="inline-flex items-center justify-center">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-600 hover:text-slate-400 transition-colors" />
                            )}
                          </div>
                        </td>

                        {/* Order Number (Click to jump) */}
                        <td className="py-3.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setJumpModalItem({ item, currentIndex: displayIndex });
                              setJumpTargetIndex(displayIndex);
                            }}
                            className="group/num inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-black/40 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 font-mono text-sm font-bold transition-all cursor-pointer shadow-sm"
                            title="คลิกเพื่อย้ายไปลำดับที่ต้องการ"
                          >
                            <span>{displayIndex}</span>
                            <Move className="w-2.5 h-2.5 opacity-0 group-hover/num:opacity-100 text-cyan-400" />
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-cyan-300 font-mono text-sm tracking-wide font-medium">{item.serialNumber}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-300 text-sm">{formatDate(item.purchaseDate)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-400 text-sm">{item.notes || '-'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-white font-bold text-sm font-display">{item.deviceName}</span>
                        </td>

                        {/* Image Thumbnail Column */}
                        <td className="py-3.5 px-3 text-center">
                          {itemImages.length > 0 ? (
                            <div className="inline-flex items-center justify-center relative group/img">
                              <img
                                src={itemImages[0]}
                                alt={item.deviceName}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openLightbox(itemImages, 0);
                                }}
                                className="w-10 h-10 object-cover rounded-lg border border-cyan-500/40 hover:border-cyan-400 cursor-pointer shadow-md hover:scale-110 transition-all hover:shadow-[0_0_15px_rgba(0,242,255,0.5)]"
                              />
                              {itemImages.length > 1 && (
                                <span className="absolute -bottom-1 -right-1 bg-cyan-500 text-black text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border border-black shadow">
                                  +{itemImages.length - 1}
                                </span>
                              )}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openLightbox(itemImages, 0);
                                }}
                                className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover/img:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                              >
                                <Eye className="w-4 h-4 text-cyan-300" />
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(item);
                              }}
                              className="text-slate-600 hover:text-cyan-400 transition-colors text-xs font-mono inline-flex items-center gap-1 opacity-60 hover:opacity-100"
                              title="เพิ่มรูปภาพ"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getLocationColor(item.location)}`}>
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(item);
                              }}
                              className="p-2 bg-slate-900 border border-slate-700 text-cyan-400 hover:text-black hover:bg-cyan-400 rounded-lg transition-all shadow-sm"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item);
                              }}
                              className="p-2 bg-red-950/40 border border-red-700/60 text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-all shadow-sm"
                              title="ลบรายการนี้"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Floating Bottom Sticky Action Bar when items are selected */}
      {selectedKeys.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-950/95 border-2 border-cyan-500/80 rounded-2xl px-6 py-4 shadow-[0_0_50px_rgba(0,242,255,0.3)] backdrop-blur-xl flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-mono font-bold text-sm">
                {selectedKeys.size}
              </div>
              <div className="text-sm text-white font-display font-bold tracking-wide">
                เลือกเครื่องจำหน่ายตั๋วอยู่ <span className="text-cyan-400 font-mono">{selectedKeys.size}</span> รายการ
              </div>
            </div>

            <div className="h-6 w-[1px] bg-slate-800" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveSelectedItemsTo('top')}
                className="px-3.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="ย้ายรายการที่เลือกทั้งหมดไปไว้บนสุด"
              >
                <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
                ย้ายไปบนสุด
              </button>
              <button
                type="button"
                onClick={() => moveSelectedItemsTo('bottom')}
                className="px-3.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="ย้ายรายการที่เลือกทั้งหมดไปไว้ล่างสุด"
              >
                <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                ย้ายไปล่างสุด
              </button>
            </div>

            <div className="h-6 w-[1px] bg-slate-800" />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearSelection}
                className="px-4 py-2 text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
              >
                ยกเลิกการเลือก
              </button>
              <button
                type="button"
                onClick={handleBatchDelete}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(239,68,68,0.5)] active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                ลบ {selectedKeys.size} รายการที่เลือก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Position Jump Modal */}
      {jumpModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md border-cyan-500 bg-slate-950 shadow-[0_0_50px_rgba(0,242,255,0.25)]">
            <CardHeader className="flex flex-row justify-between items-center bg-cyan-900/20 border-b border-cyan-500/30 py-4 px-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Move className="w-4 h-4 text-cyan-400" /> ย้ายลำดับอุปกรณ์
              </CardTitle>
              <button
                onClick={() => setJumpModalItem(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-3 bg-black/50 border border-slate-800 rounded-lg space-y-1 text-xs font-mono">
                <p className="text-slate-400">
                  อุปกรณ์: <span className="text-white font-bold">{jumpModalItem.item.deviceName}</span>
                </p>
                <p className="text-slate-400 truncate">
                  S/N: <span className="text-cyan-300 font-bold">{jumpModalItem.item.serialNumber}</span>
                </p>
                <p className="text-slate-400">
                  สถานที่: <span className="text-amber-300 font-bold">{jumpModalItem.item.location}</span>
                </p>
                <p className="text-slate-400">
                  ลำดับปัจจุบัน: <span className="text-sky-400 font-bold">#{jumpModalItem.currentIndex}</span> จากทั้งหมด <span className="text-white">{items.length}</span>
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">
                  ย้ายไปลำดับที่ (1 - {items.length})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={items.length}
                    value={jumpTargetIndex}
                    onChange={(e) => setJumpTargetIndex(Math.max(1, Math.min(items.length, parseInt(e.target.value) || 1)))}
                    className="w-full bg-black border border-cyan-500/50 p-3 text-cyan-300 focus:border-cyan-400 outline-none font-mono text-base font-bold rounded text-center"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        jumpItemToIndex(getItemKey(jumpModalItem.item), jumpTargetIndex);
                        setJumpModalItem(null);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Quick shortcut buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setJumpTargetIndex(1)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-cyan-400" /> ไปบนสุด (#1)
                </button>
                <button
                  type="button"
                  onClick={() => setJumpTargetIndex(items.length)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-cyan-400" /> ไปท้ายสุด (#{items.length})
                </button>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setJumpModalItem(null)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    jumpItemToIndex(getItemKey(jumpModalItem.item), jumpTargetIndex);
                    setJumpModalItem(null);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono"
                >
                  <Check className="w-4 h-4 mr-1.5" /> ยืนยันการย้าย
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <Card className="w-full max-w-lg border-cyan-500 bg-slate-950 shadow-[0_0_50px_rgba(0,242,255,0.2)] my-8">
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

                {/* Photo Upload Section */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest flex items-center justify-between">
                    <span>รูปภาพอุปกรณ์ ({formData.images?.length || 0})</span>
                    {isUploading && (
                      <span className="text-cyan-400 font-mono text-xs flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> กำลังประมวลผลรูป...
                      </span>
                    )}
                  </label>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {/* Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-cyan-900/60 hover:border-cyan-500/80 bg-slate-900/40 hover:bg-cyan-950/20 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 group-hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 transition-colors">
                      <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-cyan-300 font-bold">คลิกเพื่ออัปโหลดรูปภาพอุปกรณ์</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">รองรับไฟล์ PNG, JPG (ระบบจะย่อขนาดให้อัตโนมัติ)</p>
                    </div>
                  </div>

                  {/* Uploaded Images Preview Grid */}
                  {formData.images && formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mt-3">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group/thumb rounded-lg overflow-hidden border border-cyan-500/40 bg-black aspect-square">
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLightbox(formData.images, idx);
                              }}
                              className="p-1.5 bg-cyan-500/80 hover:bg-cyan-400 text-black rounded-md transition-colors"
                              title="ดูรูปขยาย"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(idx);
                              }}
                              className="p-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-md transition-colors"
                              title="ลบรูปนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDelete(editingItem);
                        setIsModalOpen(false);
                      }}
                      className="px-4 py-2.5 bg-red-950/60 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/50 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
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

      {/* Lightbox Modal for Fullscreen Image Viewing */}
      {lightboxImages && lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-5 right-5 p-3 rounded-full bg-slate-900/80 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_20px_rgba(0,242,255,0.4)] z-10"
            title="ปิด (ESC)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-5 left-5 px-4 py-2 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-300 font-mono text-sm tracking-wider z-10">
            รูปที่ {lightboxIndex + 1} / {lightboxImages.length}
          </div>

          {/* Previous Button */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length);
              }}
              className="absolute left-5 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] z-10"
              title="รูปก่อนหน้า (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Button */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(prev => (prev + 1) % lightboxImages.length);
              }}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] z-10"
              title="รูปถัดไป (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Main Image */}
          <div
            className="max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImages[lightboxIndex]}
              alt={`Full view ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-cyan-500/50 shadow-[0_0_50px_rgba(0,242,255,0.25)] animate-in zoom-in-95 duration-200"
            />
          </div>
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

