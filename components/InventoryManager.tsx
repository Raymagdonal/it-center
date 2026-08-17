import React, { useState, useMemo } from 'react';
import {
  Package, Plus, Search, AlertTriangle, ShoppingCart, Edit, Trash2, X,
  Calendar, Save, Folder, FolderOpen, ArrowLeft, Layers, Ship, Anchor, Building2,
  Camera, Clock, Activity, ChevronDown, ChevronRight, Boxes, ListPlus, CheckCircle2,
  Layers as LayersIcon, Tag
} from 'lucide-react';
import {
  ProcurementFolder, ProcurementFolderItem, ProcurementSubItem, ProcurementLocationType,
  BOAT_LOCATIONS, PIER_LOCATIONS, OFFICE_LOCATIONS, PROCUREMENT_YEARS, THAI_MONTHS,
  AppMode, InventorySelection
} from '../types';
import { Button } from './ui/Button';
import { compressImage } from '../utils/storageUtils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { EquipmentSummary } from './EquipmentSummary';

interface InventoryManagerProps {
  folders: ProcurementFolder[];
  onUpdate: (folders: ProcurementFolder[]) => void;
  onNavigate?: (mode: AppMode) => void;
  initialSelection?: InventorySelection | null;
}

type ViewLevel = 'year' | 'category' | 'location' | 'month' | 'items';
type InventoryViewMode = 'LIST' | 'SUMMARY';
type EntryMode = 'SINGLE' | 'SET' | 'BATCH';

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  folders,
  onUpdate,
  onNavigate,
  initialSelection
}) => {
  // View Mode State
  const [viewMode, setViewMode] = useState<InventoryViewMode>('LIST');
  // Navigation State
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedCategory, setSelectedCategory] = useState<ProcurementLocationType | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Expand state for Sets in table
  const [expandedSetIds, setExpandedSetIds] = useState<Set<string>>(new Set());

  const toggleSetExpand = (id: string) => {
    setExpandedSetIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Sync initial selection
  React.useEffect(() => {
    if (initialSelection) {
      setSelectedYear(initialSelection.year);
      setSelectedCategory(initialSelection.category);
      setSelectedLocation(initialSelection.location);
      setSelectedMonth(initialSelection.month);
      setViewMode('LIST');
    }
  }, [initialSelection]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<EntryMode>('SINGLE');
  const [editingItem, setEditingItem] = useState<ProcurementFolderItem | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Form State for Single Item & Set
  const initialFormState: Partial<ProcurementFolderItem> = {
    name: '',
    imageUrl: null,
    serialNumber: '',
    quantity: 1,
    unit: 'อัน',
    purchaseDate: new Date().toISOString().split('T')[0],
    startUseDate: '',
    usageStatus: 'ACTIVE',
    notes: '',
    supplier: '',
    isSet: false,
    subItems: []
  };
  const [formData, setFormData] = useState<Partial<ProcurementFolderItem>>(initialFormState);

  // Sub-items for "รวมเป็นชุดเดียวกัน (SET)" mode
  const [subItems, setSubItems] = useState<ProcurementSubItem[]>([
    { id: '1', name: '', serialNumber: '', quantity: 1, unit: 'ชิ้น' }
  ]);

  // Rows for "เพิ่มหลายชิ้นพร้อมกัน (BATCH)" mode
  const [batchItems, setBatchItems] = useState<Array<{
    id: string;
    name: string;
    serialNumber: string;
    quantity: number;
    unit: string;
    notes: string;
  }>>([
    { id: '1', name: '', serialNumber: '', quantity: 1, unit: 'อัน', notes: '' },
    { id: '2', name: '', serialNumber: '', quantity: 1, unit: 'อัน', notes: '' },
    { id: '3', name: '', serialNumber: '', quantity: 1, unit: 'อัน', notes: '' },
  ]);

  // Sub-items helper
  const handleAddSubItem = () => {
    setSubItems(prev => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 7), name: '', serialNumber: '', quantity: 1, unit: 'ชิ้น' }
    ]);
  };

  const handleUpdateSubItem = (id: string, field: keyof ProcurementSubItem, value: any) => {
    setSubItems(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleRemoveSubItem = (id: string) => {
    if (subItems.length <= 1) return;
    setSubItems(prev => prev.filter(s => s.id !== id));
  };

  // Batch items helper
  const handleAddBatchRow = () => {
    setBatchItems(prev => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 7), name: '', serialNumber: '', quantity: 1, unit: 'อัน', notes: '' }
    ]);
  };

  const handleUpdateBatchRow = (id: string, field: string, value: any) => {
    setBatchItems(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleRemoveBatchRow = (id: string) => {
    if (batchItems.length <= 1) return;
    setBatchItems(prev => prev.filter(r => r.id !== id));
  };

  // Get current view level
  const getViewLevel = (): ViewLevel => {
    if (selectedMonth !== null) return 'items';
    if (selectedLocation) return 'month';
    if (selectedCategory) return 'location';
    return 'category';
  };

  // Get current folder based on selection
  const currentFolder = useMemo(() => {
    if (!selectedCategory || !selectedLocation || selectedMonth === null) return null;
    return folders.find(
      f => f.year === selectedYear &&
        f.locationType === selectedCategory &&
        f.locationName === selectedLocation &&
        f.month === selectedMonth
    );
  }, [folders, selectedYear, selectedCategory, selectedLocation, selectedMonth]);

  // Filter items by search term
  const filteredItems = useMemo(() => {
    if (!currentFolder) return [];
    if (!searchTerm) return currentFolder.items;
    const lower = searchTerm.toLowerCase();
    return currentFolder.items.filter(item =>
      item.name.toLowerCase().includes(lower) ||
      item.serialNumber?.toLowerCase().includes(lower) ||
      item.subItems?.some(s => s.name.toLowerCase().includes(lower) || s.serialNumber?.toLowerCase().includes(lower))
    );
  }, [currentFolder, searchTerm]);

  // Get locations based on category
  const getLocationsForCategory = (category: ProcurementLocationType) => {
    switch (category) {
      case 'BOAT': return [...BOAT_LOCATIONS];
      case 'PIER': return [...PIER_LOCATIONS];
      case 'OFFICE': return [...OFFICE_LOCATIONS];
    }
  };

  // Get folder item count for a location
  const getFolderItemCount = (locationType: ProcurementLocationType, locationName: string) => {
    const folder = folders.find(
      f => f.year === selectedYear && f.locationType === locationType && f.locationName === locationName
    );
    return folder?.items.length || 0;
  };

  // Get total items for a category
  const getCategoryItemCount = (category: ProcurementLocationType) => {
    return folders
      .filter(f => f.year === selectedYear && f.locationType === category)
      .reduce((sum, f) => sum + f.items.length, 0);
  };

  // Navigation handlers
  const handleBack = () => {
    if (selectedMonth !== null) {
      setSelectedMonth(null);
      setSearchTerm('');
    } else if (selectedLocation) {
      setSelectedLocation(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const handleCategorySelect = (category: ProcurementLocationType) => {
    setSelectedCategory(category);
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
  };

  // Open Modal Handler
  const handleOpenModal = (item?: ProcurementFolderItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
      if (item.isSet && item.subItems && item.subItems.length > 0) {
        setEntryMode('SET');
        setSubItems(item.subItems);
      } else {
        setEntryMode('SINGLE');
      }
    } else {
      setEditingItem(null);
      setFormData(initialFormState);
      setEntryMode('SINGLE');
      setSubItems([
        { id: '1', name: '', serialNumber: '', quantity: 1, unit: 'ชิ้น' },
        { id: '2', name: '', serialNumber: '', quantity: 1, unit: 'ชิ้น' }
      ]);
      setBatchItems([
        { id: '1', name: '', serialNumber: '', quantity: 1, unit: 'อัน', notes: '' },
        { id: '2', name: '', serialNumber: '', quantity: 1, unit: 'อัน', notes: '' },
        { id: '3', name: '', serialNumber: '', quantity: 1, unit: 'อัน', notes: '' },
      ]);
    }
    setIsModalOpen(true);
  };

  // Save Handler (Handles Single, Set, and Batch)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !selectedLocation || selectedMonth === null) return;

    let itemsToAdd: ProcurementFolderItem[] = [];

    if (entryMode === 'SINGLE') {
      const singleItem: ProcurementFolderItem = {
        ...(formData as ProcurementFolderItem),
        id: editingItem ? editingItem.id : Math.random().toString(36).substr(2, 9),
        isSet: false,
        subItems: []
      };
      itemsToAdd = [singleItem];
    } else if (entryMode === 'SET') {
      const validSubItems = subItems.filter(s => s.name.trim() !== '');
      const setItem: ProcurementFolderItem = {
        ...(formData as ProcurementFolderItem),
        id: editingItem ? editingItem.id : Math.random().toString(36).substr(2, 9),
        isSet: true,
        unit: formData.unit || 'ชุด',
        subItems: validSubItems
      };
      itemsToAdd = [setItem];
    } else if (entryMode === 'BATCH') {
      const validBatch = batchItems.filter(b => b.name.trim() !== '');
      if (validBatch.length === 0) {
        alert('โปรดระบุชื่ออุปกรณ์อย่างน้อย 1 รายการ');
        return;
      }
      itemsToAdd = validBatch.map(b => ({
        id: Math.random().toString(36).substr(2, 9),
        name: b.name.trim(),
        serialNumber: b.serialNumber.trim() || undefined,
        quantity: b.quantity || 1,
        unit: b.unit.trim() || 'อัน',
        purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
        startUseDate: formData.startUseDate || undefined,
        usageStatus: formData.usageStatus || 'ACTIVE',
        notes: b.notes ? b.notes.trim() : (formData.notes || ''),
        supplier: formData.supplier || '',
        imageUrl: formData.imageUrl || null,
        isSet: false,
        subItems: []
      }));
    }

    // Update folders
    let updatedFolders = [...folders];
    let folderIndex = updatedFolders.findIndex(
      f => f.year === selectedYear && f.locationType === selectedCategory && f.locationName === selectedLocation && f.month === selectedMonth
    );

    if (folderIndex === -1) {
      // Create new folder with items
      const newFolder: ProcurementFolder = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${selectedLocation}_${THAI_MONTHS[selectedMonth]}_${selectedYear}`,
        locationType: selectedCategory,
        locationName: selectedLocation,
        year: selectedYear,
        month: selectedMonth,
        items: itemsToAdd
      };
      updatedFolders.push(newFolder);
    } else {
      // Update existing folder
      if (editingItem && itemsToAdd.length === 1) {
        updatedFolders[folderIndex].items = updatedFolders[folderIndex].items.map(
          i => i.id === editingItem.id ? itemsToAdd[0] : i
        );
      } else {
        updatedFolders[folderIndex].items = [...updatedFolders[folderIndex].items, ...itemsToAdd];
      }
    }

    onUpdate(updatedFolders);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('ยืนยันการลบรายการนี้?')) return;
    if (!selectedCategory || !selectedLocation || selectedMonth === null) return;

    const updatedFolders = folders.map(f => {
      if (f.year === selectedYear && f.locationType === selectedCategory && f.locationName === selectedLocation && f.month === selectedMonth) {
        return { ...f, items: f.items.filter(i => i.id !== id) };
      }
      return f;
    });

    onUpdate(updatedFolders);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData(prev => ({ ...prev, imageUrl: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateDaysUsed = (startDate?: string) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Get category icon
  const getCategoryIcon = (category: ProcurementLocationType) => {
    switch (category) {
      case 'BOAT': return <Ship className="w-8 h-8" />;
      case 'PIER': return <Anchor className="w-8 h-8" />;
      case 'OFFICE': return <Building2 className="w-8 h-8" />;
    }
  };

  // Get category display name
  const getCategoryName = (category: ProcurementLocationType) => {
    switch (category) {
      case 'BOAT': return 'เรือ';
      case 'PIER': return 'ท่าเรือ';
      case 'OFFICE': return 'สำนักงาน';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-500/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-4 hover-glow cursor-default">
            <ShoppingCart className="h-10 w-10 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            Procurement_Folder
          </h1>
          <p className="text-cyan-500 font-mono text-[10px] mt-2 tracking-[0.2em] font-bold uppercase">
            ระบบจัดเก็บอุปกรณ์ตามโฟลเดอร์ • {selectedYear} • {getCategoryName(selectedCategory || 'BOAT')} {selectedLocation && `• ${selectedLocation}`} {selectedMonth !== null && `• ${THAI_MONTHS[selectedMonth]}`}
          </p>
        </div>

        {/* View Mode Switcher & Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-4 py-2 rounded text-xs font-bold font-mono transition-all ${
                viewMode === 'LIST'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              มุมมองโฟลเดอร์
            </button>
            <button
              onClick={() => setViewMode('SUMMARY')}
              className={`px-4 py-2 rounded text-xs font-bold font-mono transition-all ${
                viewMode === 'SUMMARY'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              สรุปอุปกรณ์รวม
            </button>
          </div>

          {viewMode === 'LIST' && getViewLevel() !== 'category' && (
            <Button
              variant="secondary"
              onClick={handleBack}
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> ย้อนกลับ
            </Button>
          )}
        </div>
      </div>

      {/* Render based on view mode */}
      {viewMode === 'SUMMARY' ? (
        <EquipmentSummary folders={folders} onNavigate={onNavigate} />
      ) : (
        <>
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-black/40 p-3 rounded-lg border border-slate-800">
            <span
              className={`cursor-pointer hover:text-cyan-400 transition-colors ${!selectedCategory ? 'text-cyan-400 font-bold' : ''}`}
              onClick={() => { setSelectedCategory(null); setSelectedLocation(null); setSelectedMonth(null); }}
            >
              ปี {selectedYear}
            </span>
            {selectedCategory && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-700" />
                <span
                  className={`cursor-pointer hover:text-cyan-400 transition-colors ${!selectedLocation ? 'text-cyan-400 font-bold' : ''}`}
                  onClick={() => { setSelectedLocation(null); setSelectedMonth(null); }}
                >
                  {getCategoryName(selectedCategory)}
                </span>
              </>
            )}
            {selectedLocation && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-700" />
                <span
                  className={`cursor-pointer hover:text-cyan-400 transition-colors ${selectedMonth === null ? 'text-cyan-400 font-bold' : ''}`}
                  onClick={() => setSelectedMonth(null)}
                >
                  {selectedLocation}
                </span>
              </>
            )}
            {selectedMonth !== null && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-700" />
                <span className="text-cyan-400 font-bold">{THAI_MONTHS[selectedMonth]}</span>
              </>
            )}
          </div>

          {/* LEVEL 1: Category Selection */}
          {getViewLevel() === 'category' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {(['BOAT', 'PIER', 'OFFICE'] as ProcurementLocationType[]).map((category) => {
                const count = getCategoryItemCount(category);
                return (
                  <Card
                    key={category}
                    className="hover:border-cyan-500/50 transition-all cursor-pointer group bg-gradient-to-b from-slate-900/50 to-black/50 border-slate-800"
                    onClick={() => handleCategorySelect(category)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="p-3 bg-cyan-950/40 rounded-lg border border-cyan-500/30 text-cyan-400 group-hover:scale-110 group-hover:border-cyan-400 transition-all">
                        {getCategoryIcon(category)}
                      </div>
                      <span className="text-2xl font-bold font-mono text-cyan-400">{count}</span>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-xl text-white font-display uppercase tracking-wider">
                        {getCategoryName(category)}
                      </CardTitle>
                      <p className="text-xs text-slate-500 mt-2 font-mono">
                        {category === 'BOAT' && 'เรือ CTB1-CTB3, R1-R4'}
                        {category === 'PIER' && 'ท่าเรือพระอาทิตย์, พรานนก ฯลฯ'}
                        {category === 'OFFICE' && 'สำนักงานส่วนกลาง'}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* LEVEL 2: Location Selection */}
          {getViewLevel() === 'location' && selectedCategory && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
              {getLocationsForCategory(selectedCategory).map((location) => {
                const count = getFolderItemCount(selectedCategory, location);
                return (
                  <Card
                    key={location}
                    className="hover:border-cyan-500/50 transition-all cursor-pointer group bg-slate-900/30 border-slate-800"
                    onClick={() => handleLocationSelect(location)}
                  >
                    <CardContent className="p-6 text-center space-y-3">
                      <Folder className="w-12 h-12 text-cyan-500/50 group-hover:text-cyan-400 mx-auto transition-colors" />
                      <div>
                        <h3 className="font-bold text-white font-display text-lg">{location}</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">{count} รายการ</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* LEVEL 3: Month Selection */}
          {getViewLevel() === 'month' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
              {THAI_MONTHS.map((monthName, idx) => {
                const folder = folders.find(
                  f => f.year === selectedYear &&
                    f.locationType === selectedCategory &&
                    f.locationName === selectedLocation &&
                    f.month === idx
                );
                const count = folder?.items.length || 0;
                return (
                  <Card
                    key={monthName}
                    className={`hover:border-cyan-500/50 transition-all cursor-pointer group border-slate-800 ${
                      count > 0 ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-slate-900/20'
                    }`}
                    onClick={() => handleMonthSelect(idx)}
                  >
                    <CardContent className="p-6 text-center space-y-3">
                      {count > 0 ? (
                        <FolderOpen className="w-12 h-12 text-cyan-400 mx-auto" />
                      ) : (
                        <Folder className="w-12 h-12 text-slate-700 group-hover:text-cyan-500/50 mx-auto transition-colors" />
                      )}
                      <div>
                        <h3 className="font-bold text-white font-display text-base">{monthName}</h3>
                        <p className={`text-[10px] font-mono mt-1 ${count > 0 ? 'text-cyan-400 font-bold' : 'text-slate-600'}`}>
                          {count} รายการ
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* LEVEL 4: Items in Selected Folder */}
          {getViewLevel() === 'items' && (
            <>
              {/* Actions & Search */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/40 p-4 rounded-lg border border-slate-800">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่ออุปกรณ์, Serial Number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-black/60 border border-slate-800 rounded text-sm text-white focus:border-cyan-500 outline-none font-mono"
                  />
                </div>
                <Button onClick={() => handleOpenModal()} className="shadow-[0_0_20px_rgba(0,242,255,0.3)]">
                  <Plus className="mr-2 h-4 w-4" /> เพิ่มอุปกรณ์ใหม่ / รวมเป็นชุด
                </Button>
              </div>

              {/* Items Table */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-lg">
                  <Package className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-mono">ยังไม่มีอุปกรณ์ในโฟลเดอร์นี้</p>
                  <Button onClick={() => handleOpenModal()} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> เพิ่มอุปกรณ์ใหม่
                  </Button>
                </div>
              ) : (
                <Card className="animate-in slide-in-from-bottom-4 duration-500 border-cyan-500/30 bg-black/80">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/80 text-cyan-600 uppercase tracking-widest font-mono text-[10px] border-b border-cyan-900/50">
                            <th className="py-4 pl-6">รายละเอียดอุปกรณ์</th>
                            <th className="py-4">Serial Number / รายการในชุด</th>
                            <th className="py-4">จำนวน</th>
                            <th className="py-4">สถานะ / ระยะเวลาใช้งาน</th>
                            <th className="py-4 pr-6 text-right">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {filteredItems.map((item) => {
                            const isSet = item.isSet || (item.subItems && item.subItems.length > 0);
                            const isExpanded = expandedSetIds.has(item.id);
                            return (
                              <React.Fragment key={item.id}>
                                <tr className={`group hover:bg-cyan-900/10 transition-colors ${isSet ? 'bg-cyan-950/10' : ''}`}>
                                  <td className="py-4 pl-6">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-slate-900 rounded border border-slate-700 overflow-hidden shrink-0">
                                        {item.imageUrl ? (
                                          <img
                                            src={item.imageUrl}
                                            className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300"
                                            onClick={() => setZoomedImage(item.imageUrl || null)}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-slate-700">
                                            {isSet ? <Boxes className="w-6 h-6 text-cyan-500/60" /> : <Package className="w-6 h-6" />}
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <div className="font-bold text-white text-sm font-display tracking-wide">{item.name}</div>
                                          {isSet && (
                                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold uppercase rounded flex items-center gap-1 font-mono">
                                              <Boxes className="w-3 h-3 text-cyan-400" /> ชุดอุปกรณ์ ({item.subItems?.length || 0} ชิ้น)
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                                          ซื้อ: {item.purchaseDate} {item.supplier && ` | จาก: ${item.supplier}`}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4">
                                    {isSet ? (
                                      <div>
                                        <button
                                          onClick={() => toggleSetExpand(item.id)}
                                          className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded border border-cyan-900/50 hover:border-cyan-500/50 transition-all"
                                        >
                                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                          <span>{isExpanded ? 'ซ่อนรายการในชุด' : `ดูรายการในชุด (${item.subItems?.length || 0})`}</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="text-xs font-mono text-slate-300">{item.serialNumber || '-'}</div>
                                    )}
                                  </td>
                                  <td className="py-4">
                                    <span className="font-mono text-xl font-bold text-cyan-400">{item.quantity}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase ml-2">{item.unit}</span>
                                  </td>
                                  <td className="py-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        {item.usageStatus === 'ACTIVE' ? (
                                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-bold uppercase rounded">ใช้งาน</span>
                                        ) : (
                                          <span className="px-2 py-0.5 bg-slate-700/50 text-slate-400 border border-slate-600 text-[9px] font-bold uppercase rounded">สำรอง</span>
                                        )}
                                      </div>
                                      {item.startUseDate && (
                                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-mono font-bold">
                                          <Clock className="w-3 h-3" />
                                          ใช้งาน {calculateDaysUsed(item.startUseDate)} วัน
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-4 pr-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleOpenModal(item)}
                                        className="p-2 bg-slate-900 border border-slate-700 text-cyan-400 hover:text-black hover:bg-cyan-500 rounded transition-all"
                                        title="แก้ไข"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 bg-slate-900 border border-slate-700 text-red-500 hover:text-black hover:bg-red-500 rounded transition-all"
                                        title="ลบ"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* Expanded Sub-items Row for Sets */}
                                {isSet && isExpanded && (
                                  <tr className="bg-black/60 border-y border-cyan-900/30">
                                    <td colSpan={5} className="py-4 px-8">
                                      <div className="p-4 bg-slate-950/80 rounded-lg border border-cyan-900/40 space-y-3">
                                        <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold uppercase border-b border-slate-800 pb-2">
                                          <span className="flex items-center gap-2">
                                            <Boxes className="w-4 h-4 text-cyan-400" />
                                            รายการอุปกรณ์ย่อยในชุด: {item.name}
                                          </span>
                                          <span className="text-[10px] text-slate-500">รวม {item.subItems?.length || 0} ชิ้น</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                          {item.subItems?.map((sub, sIdx) => (
                                            <div key={sub.id || sIdx} className="p-3 bg-black/60 rounded border border-slate-800 flex flex-col justify-between">
                                              <div>
                                                <div className="font-bold text-white text-xs font-display">{sub.name}</div>
                                                {sub.serialNumber && (
                                                  <div className="text-[10px] font-mono text-cyan-500 mt-1">S/N: {sub.serialNumber}</div>
                                                )}
                                              </div>
                                              <div className="text-right mt-2 text-xs font-mono text-slate-400">
                                                จำนวน: <span className="text-cyan-400 font-bold">{sub.quantity}</span> {sub.unit || 'ชิ้น'}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        {item.notes && (
                                          <div className="text-xs text-slate-400 font-mono pt-2 border-t border-slate-800/80">
                                            <span className="text-slate-500">หมายเหตุชุด:</span> {item.notes}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Add/Edit Modal (Supports Single, Set Bundle, and Batch Entry) */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
              <Card className="w-full max-w-2xl border-cyan-500 bg-slate-950 shadow-[0_0_50px_rgba(0,242,255,0.25)] my-8">
                <CardHeader className="flex flex-row justify-between items-center bg-cyan-900/20 border-b border-cyan-500/30">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      {editingItem ? 'แก้ไขอุปกรณ์' : 'เพิ่มข้อมูลอุปกรณ์'}
                    </CardTitle>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </CardHeader>

                <CardContent className="p-6 md:p-8 space-y-6">
                  {/* Mode Selector (When creating new item) */}
                  {!editingItem && (
                    <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/60 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEntryMode('SINGLE')}
                        className={`py-2.5 px-3 rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                          entryMode === 'SINGLE'
                            ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Package className="w-4 h-4" /> ชิ้นเดี่ยว
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryMode('SET')}
                        className={`py-2.5 px-3 rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                          entryMode === 'SET'
                            ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Boxes className="w-4 h-4" /> รวมเป็นชุด
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryMode('BATCH')}
                        className={`py-2.5 px-3 rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                          entryMode === 'BATCH'
                            ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <ListPlus className="w-4 h-4" /> หลายชิ้นพร้อมกัน
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSave} className="space-y-6">
                    {/* Common Image Upload */}
                    <div className="flex justify-center">
                      <label className="relative w-28 h-28 bg-slate-900 border-2 border-dashed border-cyan-900 hover:border-cyan-500 rounded-lg flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all">
                        {formData.imageUrl ? (
                          <img src={formData.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Camera className="w-7 h-7 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                            <span className="text-[9px] mt-1.5 text-slate-500 uppercase font-bold group-hover:text-cyan-500">อัพโหลดรูป</span>
                          </>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </div>

                    {/* Common Metadata Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-1.5 tracking-widest">ร้านค้า / ตัวแทนจำหน่าย</label>
                        <input
                          className="w-full bg-black border border-slate-800 p-2.5 text-white focus:border-cyan-500 outline-none font-display text-sm tracking-wide rounded"
                          value={formData.supplier || ''}
                          onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                          placeholder="ระบุร้านค้า..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-1.5 tracking-widest">สถานะการใช้งาน</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, usageStatus: 'ACTIVE' })}
                            className={`p-2.5 border rounded transition-all font-bold uppercase text-xs flex items-center justify-center gap-2 ${
                              formData.usageStatus === 'ACTIVE'
                                ? 'bg-green-500/20 border-green-500 text-green-400'
                                : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'
                            }`}
                          >
                            <Activity className="w-3.5 h-3.5" /> ใช้งาน
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, usageStatus: 'SPARE' })}
                            className={`p-2.5 border rounded transition-all font-bold uppercase text-xs flex items-center justify-center gap-2 ${
                              formData.usageStatus === 'SPARE'
                                ? 'bg-slate-700/50 border-white/50 text-white'
                                : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'
                            }`}
                          >
                            <Package className="w-3.5 h-3.5" /> สำรอง
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-1.5 tracking-widest">วันที่ซื้อ</label>
                        <input
                          type="date"
                          className="w-full bg-black border border-slate-800 p-2.5 text-white focus:border-cyan-500 outline-none rounded text-sm font-mono"
                          value={formData.purchaseDate}
                          onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-1.5 tracking-widest">วันที่เริ่มใช้งาน</label>
                        <input
                          type="date"
                          className="w-full bg-black border border-slate-800 p-2.5 text-white focus:border-cyan-500 outline-none rounded text-sm font-mono"
                          value={formData.startUseDate || ''}
                          onChange={e => setFormData({ ...formData, startUseDate: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* ════ MODE 1: SINGLE ITEM ════ */}
                    {entryMode === 'SINGLE' && (
                      <div className="space-y-4 pt-2 border-t border-slate-800">
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-1.5 tracking-widest">ชื่ออุปกรณ์</label>
                          <input
                            required
                            className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none font-display tracking-wide rounded"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="ระบุชื่ออุปกรณ์..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-1.5 tracking-widest">Serial Number</label>
                            <input
                              className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none font-mono text-sm rounded"
                              value={formData.serialNumber || ''}
                              onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                              placeholder="S/N..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-1.5 tracking-widest">จำนวน</label>
                              <input
                                type="number"
                                min="1"
                                className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none font-mono rounded"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-1.5 tracking-widest">หน่วย</label>
                              <input
                                className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none rounded"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                placeholder="อัน / ชิ้น"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-1.5 tracking-widest">หมายเหตุ</label>
                          <textarea
                            className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none resize-none h-16 rounded text-sm"
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="หมายเหตุเพิ่มเติม..."
                          />
                        </div>
                      </div>
                    )}

                    {/* ════ MODE 2: SET / BUNDLE ════ */}
                    {entryMode === 'SET' && (
                      <div className="space-y-4 pt-2 border-t border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-mono font-bold text-cyan-400 uppercase mb-1.5 tracking-widest flex items-center gap-1.5">
                              <Boxes className="w-3.5 h-3.5" /> ชื่อชุดอุปกรณ์ (Set Name)
                            </label>
                            <input
                              required
                              className="w-full bg-black border border-cyan-500/50 p-3 text-white focus:border-cyan-400 outline-none font-display tracking-wide rounded"
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              placeholder="เช่น ชุดคอมพิวเตอร์สำนักงาน, ชุดกล้อง CCTV ท่าพระอาทิตย์..."
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-1.5 tracking-widest">จำนวนชุด</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none font-mono rounded"
                                value={formData.quantity || 1}
                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1, unit: 'ชุด' })}
                              />
                              <span className="text-xs font-mono text-cyan-400 font-bold shrink-0">ชุด</span>
                            </div>
                          </div>
                        </div>

                        {/* Sub-items in Set */}
                        <div className="p-4 bg-black/60 rounded-xl border border-cyan-900/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5" /> รายการอุปกรณ์ย่อยในชุด ({subItems.length} รายการ)
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={handleAddSubItem}
                              className="text-[10px] h-8 px-3 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 font-mono"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> เพิ่มอุปกรณ์ในชุด
                            </Button>
                          </div>

                          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                            {subItems.map((sub, sIdx) => (
                              <div key={sub.id} className="grid grid-cols-12 gap-2 p-2.5 bg-slate-900/60 rounded border border-slate-800 items-center">
                                <span className="col-span-1 text-[11px] font-mono text-slate-500 font-bold text-center">#{sIdx + 1}</span>
                                <input
                                  required
                                  className="col-span-5 bg-black border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 outline-none rounded font-display"
                                  placeholder="ชื่ออุปกรณ์ย่อย..."
                                  value={sub.name}
                                  onChange={e => handleUpdateSubItem(sub.id, 'name', e.target.value)}
                                />
                                <input
                                  className="col-span-3 bg-black border border-slate-800 px-2 py-1.5 text-xs text-white focus:border-cyan-500 outline-none rounded font-mono"
                                  placeholder="S/N (ถ้ามี)..."
                                  value={sub.serialNumber || ''}
                                  onChange={e => handleUpdateSubItem(sub.id, 'serialNumber', e.target.value)}
                                />
                                <input
                                  type="number"
                                  min="1"
                                  className="col-span-1 bg-black border border-slate-800 px-1.5 py-1.5 text-xs text-center text-white focus:border-cyan-500 outline-none rounded font-mono"
                                  value={sub.quantity}
                                  onChange={e => handleUpdateSubItem(sub.id, 'quantity', parseInt(e.target.value) || 1)}
                                />
                                <input
                                  className="col-span-1 bg-black border border-slate-800 px-1 py-1.5 text-[11px] text-center text-white focus:border-cyan-500 outline-none rounded"
                                  placeholder="ชิ้น"
                                  value={sub.unit || 'ชิ้น'}
                                  onChange={e => handleUpdateSubItem(sub.id, 'unit', e.target.value)}
                                />
                                <div className="col-span-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubItem(sub.id)}
                                    disabled={subItems.length <= 1}
                                    className="text-slate-600 hover:text-red-400 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-1.5 tracking-widest">หมายเหตุชุด</label>
                          <textarea
                            className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none resize-none h-16 rounded text-sm"
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="หมายเหตุเพิ่มเติมสำหรับชุดนี้..."
                          />
                        </div>
                      </div>
                    )}

                    {/* ════ MODE 3: BATCH MULTI-ITEM ════ */}
                    {entryMode === 'BATCH' && (
                      <div className="space-y-4 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                            <ListPlus className="w-4 h-4 text-cyan-400" /> ตารางกรอกหลายอุปกรณ์พร้อมกัน ({batchItems.length} แถว)
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAddBatchRow}
                            className="text-xs h-8 px-3 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 font-mono"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> เพิ่มแถวรายการ
                          </Button>
                        </div>

                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                          {batchItems.map((row, rIdx) => (
                            <div key={row.id} className="p-3 bg-black/60 rounded-lg border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono font-bold text-cyan-500">อุปกรณ์ #{rIdx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBatchRow(row.id)}
                                  disabled={batchItems.length <= 1}
                                  className="text-slate-600 hover:text-red-400 p-1 disabled:opacity-30"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-12 gap-2">
                                <input
                                  required={rIdx === 0}
                                  className="col-span-5 bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 outline-none rounded font-display"
                                  placeholder="ชื่ออุปกรณ์..."
                                  value={row.name}
                                  onChange={e => handleUpdateBatchRow(row.id, 'name', e.target.value)}
                                />
                                <input
                                  className="col-span-3 bg-slate-900 border border-slate-800 px-2 py-1.5 text-xs text-white focus:border-cyan-500 outline-none rounded font-mono"
                                  placeholder="Serial Number..."
                                  value={row.serialNumber}
                                  onChange={e => handleUpdateBatchRow(row.id, 'serialNumber', e.target.value)}
                                />
                                <input
                                  type="number"
                                  min="1"
                                  className="col-span-2 bg-slate-900 border border-slate-800 px-1.5 py-1.5 text-xs text-center text-white focus:border-cyan-500 outline-none rounded font-mono"
                                  value={row.quantity}
                                  onChange={e => handleUpdateBatchRow(row.id, 'quantity', parseInt(e.target.value) || 1)}
                                />
                                <input
                                  className="col-span-2 bg-slate-900 border border-slate-800 px-1.5 py-1.5 text-xs text-center text-white focus:border-cyan-500 outline-none rounded"
                                  placeholder="หน่วย"
                                  value={row.unit}
                                  onChange={e => handleUpdateBatchRow(row.id, 'unit', e.target.value)}
                                />
                              </div>

                              <input
                                className="w-full bg-slate-900/60 border border-slate-800 px-2.5 py-1 text-[11px] text-slate-300 focus:border-cyan-500 outline-none rounded"
                                placeholder="หมายเหตุเฉพาะรายการนี้ (ถ้ามี)..."
                                value={row.notes}
                                onChange={e => handleUpdateBatchRow(row.id, 'notes', e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 flex gap-4 border-t border-slate-800">
                      <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
                        ยกเลิก
                      </Button>
                      <Button type="submit" className="flex-[2] shadow-[0_0_20px_rgba(0,242,255,0.4)]">
                        {entryMode === 'BATCH'
                          ? `บันทึกทั้งหมด (${batchItems.filter(b => b.name.trim()).length} รายการ)`
                          : entryMode === 'SET'
                          ? `บันทึกเป็นชุด (${subItems.filter(s => s.name.trim()).length} ชิ้นในชุด)`
                          : 'บันทึกข้อมูล'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Image Zoom Modal */}
          {zoomedImage && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300 cursor-zoom-out"
              onClick={() => setZoomedImage(null)}
            >
              <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomedImage(null);
                  }}
                  className="absolute -top-12 right-0 md:-right-12 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>
                <img
                  src={zoomedImage}
                  className="max-w-full max-h-[90vh] object-contain rounded border border-cyan-500/20 shadow-[0_0_100px_rgba(0,242,255,0.1)] cursor-default animate-in zoom-in-50 duration-300"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
