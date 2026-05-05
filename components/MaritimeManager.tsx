
import React, { useState, useMemo, useRef } from 'react';
import {
  Anchor, Search, Plus, Ship, Container, AlertCircle,
  X, Edit, Trash2, Calendar, LayoutGrid, LayoutList,
  Table as TableIcon, Image as ImageIcon, Camera, Folder, ChevronRight, Filter, Clock, FolderOpen, ArrowLeft, Maximize2,
  Info, CheckCircle2, ShieldAlert, PackageSearch, History, ChevronLeft
} from 'lucide-react';
import { MaritimeItem, MaritimeStatus, MaritimeImage } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface MaritimeManagerProps {
  items: MaritimeItem[];
  onUpdate: (items: MaritimeItem[]) => void;
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const VESSEL_TEMPLATE = ["หน้าจอ CCTV (Monitor)", "Famoco - Viabus", "โทรทัศน์ (TV)", "เครื่องขยายเสียง (Amplifier)"];
const PORT_TEMPLATE = ["หน้าจอ CCTV (Monitor)", "Famoco - Viabus", "ตู้คีออส (Kiosk)"];

const VESSEL_OPTIONS = ["CTB 1", "CTB 2", "CTB 3", "R1", "R2", "R3", "R4"];
const PORT_OPTIONS = ["BTS", "สาทร", "ไอคอนสยาม", "ราชวงศ์", "ราชินี", "วัดอรุณฯ", "ท่าช้าง", "มหาราช", "พรานนก", "พระอาทิตย์"];

interface GroupedFolder {
  id: string;
  name: string; // Month Name
  monthIndex: number;
  year: number;
  items: MaritimeItem[];
}

export const MaritimeManager: React.FC<MaritimeManagerProps> = ({ items, onUpdate }) => {
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST' | 'TABLE'>('GRID');
  const [searchTerm, setSearchTerm] = useState('');

  // Drill-down State
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Gallery/Detail View State
  const [activeInspectionItem, setActiveInspectionItem] = useState<MaritimeItem | null>(null);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState<number>(0);

  // Filter States
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterType, setFilterType] = useState<'ALL' | 'VESSEL' | 'PORT'>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaritimeItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<MaritimeItem>>({
    name: '',
    type: 'VESSEL',
    location: '',
    recordDate: new Date().toISOString().split('T')[0],
    images: []
  });

  // Year Options (2024 - 2030)
  const yearOptions = useMemo(() => {
    const startYear = 2024;
    const endYear = 2030;
    const years = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // Grouping Logic: Fixed 12 months for selectedYear
  const monthFolders = useMemo(() => {
    return THAI_MONTHS.map((monthName, index) => {
      const folderId = `${selectedYear}-${index}`;

      const folderItems = items.filter(item => {
        const d = new Date(item.recordDate);
        const matchesYear = d.getFullYear() === selectedYear;
        const matchesMonth = d.getMonth() === index;
        const matchesType = filterType === 'ALL' || item.type === filterType;
        const matchesSearch = searchTerm ? (
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location.toLowerCase().includes(searchTerm.toLowerCase())
        ) : true;

        return matchesYear && matchesMonth && matchesType && matchesSearch;
      });

      return {
        id: folderId,
        name: monthName,
        monthIndex: index,
        year: selectedYear,
        items: folderItems
      };
    });
  }, [items, selectedYear, filterType, searchTerm]);

  const activeFolder = useMemo(() =>
    monthFolders.find(f => f.id === activeFolderId),
    [monthFolders, activeFolderId]
  );

  const getDisplayFolders = () => {
    // Return all months, but functionality (like click) might depend on content if desired.
    // Current requirement: "create 12 folders permanently".
    // We can visually dim empty ones if we want, but they should exist.
    return monthFolders;
  };

  // Gallery Navigation
  const handleNextDevice = () => {
    if (activeInspectionItem) {
      setActiveDeviceIndex((prev) => (prev + 1) % activeInspectionItem.images.length);
    }
  };

  const handlePrevDevice = () => {
    if (activeInspectionItem) {
      setActiveDeviceIndex((prev) => (prev - 1 + activeInspectionItem.images.length) % activeInspectionItem.images.length);
    }
  };

  const handleOpenModal = (item?: MaritimeItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      const defaultType = 'VESSEL';
      const template = defaultType === 'VESSEL' ? VESSEL_TEMPLATE : PORT_TEMPLATE;

      // Default date logic
      let defaultDate = new Date();
      if (activeFolder) {
        defaultDate.setFullYear(activeFolder.year);
        defaultDate.setMonth(activeFolder.monthIndex);
        // Set to 1st if current date doesn't match folder month/year
        const now = new Date();
        if (now.getMonth() !== activeFolder.monthIndex || now.getFullYear() !== activeFolder.year) {
          defaultDate.setDate(1);
        }
      } else {
        defaultDate.setFullYear(selectedYear);
      }

      // ISO String handling for timezone offset
      const offset = defaultDate.getTimezoneOffset() * 60000;
      const localISODate = new Date(defaultDate.getTime() - offset).toISOString().split('T')[0];

      setFormData({
        name: '',
        type: defaultType,
        location: '',
        recordDate: localISODate,
        images: template.map(label => ({
          id: Math.random().toString(36).substr(2, 9),
          label,
          url: null,
          status: 'NORMAL' as MaritimeStatus,
          description: ''
        }))
      });
    }
    setIsModalOpen(true);
  };

  const handleTypeChange = (type: 'VESSEL' | 'PORT') => {
    const template = type === 'VESSEL' ? VESSEL_TEMPLATE : PORT_TEMPLATE;
    setFormData(prev => ({
      ...prev,
      type,
      name: '', // Reset name when type changes
      images: template.map(label => ({
        id: Math.random().toString(36).substr(2, 9),
        label,
        url: null,
        status: 'NORMAL' as MaritimeStatus,
        description: ''
      }))
    }));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: prev.images?.map(img => img.id === id ? { ...img, url: reader.result as string } : img)
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.map(img => img.id === id ? { ...img, url: null } : img)
    }));
  };

  const handleUpdateItemStatus = (id: string, status: MaritimeStatus) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.map(img => img.id === id ? { ...img, status } : img)
    }));
  };

  const handleUpdateItemDescription = (id: string, description: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.map(img => img.id === id ? { ...img, description } : img)
    }));
  };

  // --- Dynamic Item Handlers ---
  const handleAddItem = () => {
    const newItem: MaritimeImage = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'อุปกรณ์ใหม่ (ระบุชื่อ)',
      url: null,
      status: 'NORMAL',
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), newItem]
    }));
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('ยืนยันลบรายการนี้?')) {
      setFormData(prev => ({
        ...prev,
        images: prev.images?.filter(img => img.id !== id)
      }));
    }
  };

  const handleUpdateItemLabel = (id: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.map(img => img.id === id ? { ...img, label } : img)
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: MaritimeItem = {
      ...(formData as MaritimeItem),
      id: editingItem ? editingItem.id : Math.random().toString(36).substr(2, 9),
      status: 'NORMAL'
    };

    if (editingItem) {
      onUpdate(items.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      onUpdate([newItem, ...items]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(items.filter(i => i.id !== id));
  };

  const getStatusColor = (status: MaritimeStatus) => {
    switch (status) {
      case 'NORMAL': return 'text-green-400 border-green-500/50 bg-green-500/10';
      case 'BROKEN': return 'text-red-400 border-red-500/50 bg-red-500/10';
      case 'LOST': return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
      case 'CLAIMING': return 'text-purple-400 border-purple-500/50 bg-purple-500/10';
      case 'PENDING_PURCHASE': return 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10';
      default: return 'text-slate-400 border-slate-700 bg-slate-800';
    }
  };

  const getStatusLabel = (status: MaritimeStatus) => {
    switch (status) {
      case 'NORMAL': return 'ปกติ (Working)';
      case 'BROKEN': return 'ชำรุด (Broken)';
      case 'LOST': return 'สูญหาย (Lost)';
      case 'CLAIMING': return 'ส่งเคลม (Claiming)';
      case 'PENDING_PURCHASE': return 'รอจัดซื้อ (Pending)';
      default: return 'ไม่ระบุ';
    }
  };

  const statusOptions: { label: string, value: MaritimeStatus }[] = [
    { label: 'ปกติ', value: 'NORMAL' },
    { label: 'ชำรุด', value: 'BROKEN' },
    { label: 'สูญหาย', value: 'LOST' },
    { label: 'ส่งเคลม', value: 'CLAIMING' },
    { label: 'รอจัดซื้อ', value: 'PENDING_PURCHASE' }
  ];

  const currentGalleryDevice = activeInspectionItem?.images[activeDeviceIndex];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">

      {/* Gallery / Detail Preview Modal */}
      {activeInspectionItem && currentGalleryDevice && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={() => setActiveInspectionItem(null)}
        >
          <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-glow-sm z-[110]">
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-5xl w-full bg-slate-900 border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Navigation Arrows */}
            <button
              onClick={handlePrevDevice}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/60 text-white rounded-full hover:bg-cyan-500 hover:text-black transition-all z-20 hidden md:block border border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNextDevice}
              className="absolute right-[33.3%] top-1/2 -translate-y-1/2 p-4 bg-black/60 text-white rounded-full hover:bg-cyan-500 hover:text-black transition-all z-20 hidden md:block border border-white/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Left: Image Display */}
            <div className="flex-[2] bg-black flex items-center justify-center relative group min-h-[350px]">
              {currentGalleryDevice.url ? (
                <img
                  src={currentGalleryDevice.url}
                  alt={currentGalleryDevice.label}
                  className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-500"
                  key={currentGalleryDevice.id}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-700">
                  <ImageIcon className="w-20 h-20 opacity-20" />
                  <span className="font-mono text-xs uppercase tracking-widest">NO_IMAGE_DATA</span>
                </div>
              )}

              {/* Mobile Navigation */}
              <div className="absolute inset-x-0 bottom-4 flex justify-between px-4 md:hidden">
                <button onClick={handlePrevDevice} className="p-3 bg-black/80 text-white rounded-full border border-white/20"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={handleNextDevice} className="p-3 bg-black/80 text-white rounded-full border border-white/20"><ChevronRight className="w-5 h-5" /></button>
              </div>

              <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-full border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold flex items-center gap-2">
                <Maximize2 className="w-3 h-3" /> PREVIEW_DEVICE_{activeDeviceIndex + 1}/{activeInspectionItem.images.length}
              </div>
            </div>

            {/* Right: Info Display */}
            <div className="flex-1 p-6 space-y-6 border-l border-slate-800 bg-slate-950/50 overflow-y-auto">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-cyan-500 mb-2">
                  {activeInspectionItem.type === 'VESSEL' ? <Ship className="w-4 h-4" /> : <Container className="w-4 h-4" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest">{activeInspectionItem.name}</span>
                </div>
                <h2 className="text-2xl font-bold text-white font-display uppercase tracking-widest leading-tight truncate" title={currentGalleryDevice.label}>
                  {currentGalleryDevice.label}
                </h2>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] font-bold">BATCH_TIMESTAMP: {new Date(activeInspectionItem.recordDate).toLocaleDateString('th-TH')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-cyan-500" />
                    Inspection Status
                  </label>
                  <div className={`inline-flex px-3 py-1.5 rounded border text-xs font-bold uppercase transition-all duration-300 ${getStatusColor(currentGalleryDevice.status)}`}>
                    {getStatusLabel(currentGalleryDevice.status)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3 h-3 text-cyan-500" />
                    Report Narrative
                  </label>
                  <div className="p-4 bg-black/40 border border-slate-800 rounded-lg text-sm text-slate-300 font-['Sarabun'] leading-relaxed whitespace-pre-wrap min-h-[100px] shadow-inner">
                    {currentGalleryDevice.description || 'เจ้าหน้าที่ไม่ได้ระบุรายละเอียดเพิ่มเติม'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-6 border-t border-slate-800">
                  <Button variant="outline" size="sm" className="text-[10px]" onClick={handlePrevDevice}>
                    <ChevronLeft className="w-3 h-3 mr-1" /> ก่อนหน้า
                  </Button>
                  <Button variant="outline" size="sm" className="text-[10px]" onClick={handleNextDevice}>
                    ถัดไป <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                <Button variant="secondary" size="sm" className="w-full text-[10px] bg-slate-900 border-slate-800" onClick={() => setActiveInspectionItem(null)}>
                  ปิดหน้าต่างแกลเลอรี
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          {activeFolderId && (
            <button
              onClick={() => setActiveFolderId(null)}
              className="p-2 bg-slate-900 border border-slate-800 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-all shadow-glow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-4xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-4 hover-glow cursor-default text-glow">
              <Anchor className="h-10 w-10 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              {activeFolderId ? `โฟลเดอร์: ${activeFolder?.name}` : 'ระบบตรวจสอบเรือและท่าเรือ'}
            </h1>
            <p className="text-cyan-500 font-mono text-[10px] mt-2 tracking-[0.2em] font-bold uppercase">
              {activeFolderId ? `ชุดข้อมูลเดือน ${activeFolder?.name} ${activeFolder?.year}` : 'PROTOCOL: จัดกลุ่มรายงานตามสถานและเดือนอัตโนมัติ'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          {!activeFolderId && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-black border border-slate-800 rounded px-3 py-2 text-sm text-cyan-400 focus:border-cyan-500 outline-none font-bold cursor-pointer hover:border-cyan-500/50 transition-colors"
            >
              {yearOptions.map(y => <option key={y} value={y}>ปี {y}</option>)}
            </select>
          )}
          <Button onClick={() => handleOpenModal()} className="shadow-cyan-500/20">
            <Plus className="mr-2 h-4 w-4" /> สร้างรายงานใหม่
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      {!activeFolderId && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-cyan-500/20 p-3 rounded-lg flex flex-col xl:flex-row items-center gap-4 sticky top-0 z-30 shadow-2xl">
          <div className="relative flex-1 w-full xl:max-w-xs group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อเรือ/ท่าเรือ..."
              className="w-full bg-black/50 border border-slate-700 rounded-md py-2 pl-9 pr-3 text-xs text-slate-200 focus:border-cyan-500 outline-none transition-all placeholder-slate-600"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full xl:w-auto">
            <div className="flex items-center gap-2 bg-black/50 border border-slate-700 rounded px-2 h-9">
              <Filter className="w-3 h-3 text-slate-500" />
              <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-transparent text-[10px] text-cyan-400 outline-none font-bold uppercase cursor-pointer">
                <option value="ALL">ประเภท: ทั้งหมด</option>
                <option value="VESSEL">ในเรือเท่านั้น</option>
                <option value="PORT">บนท่าเรือเท่านั้น</option>
              </select>
            </div>
          </div>

          <div className="flex bg-black rounded border border-slate-700 p-1 ml-auto">
            {[{ id: 'GRID', icon: LayoutGrid }, { id: 'LIST', icon: LayoutList }, { id: 'TABLE', icon: TableIcon }].map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id as any)} className={`p-1.5 rounded transition-all ${viewMode === v.id ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}>
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeFolderId ? (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {activeFolder?.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-600 border border-dashed border-slate-800 rounded-xl">
                <PackageSearch className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-mono text-xs uppercase tracking-widest uppercase">ไม่พบรายการตรวจสอบในเดือนนี้</p>
                <Button variant="ghost" size="sm" onClick={() => handleOpenModal()} className="mt-4">
                  สร้างรายงาน
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeFolder?.items.map(item => (
                  <InspectionGridCard
                    key={item.id}
                    item={item}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                    getStatusColor={getStatusColor}
                    onShowDetail={(index: number) => {
                      setActiveInspectionItem(item);
                      setActiveDeviceIndex(index);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {monthFolders.map(folder => (
              <FolderCard key={folder.id} folder={folder} onClick={() => setActiveFolderId(folder.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
          <Card className="w-full max-w-5xl bg-slate-900 border-cyan-500/30 shadow-[0_0_100px_rgba(34,211,238,0.1)] overflow-hidden flex flex-col max-h-[95vh]">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="text-slate-500">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <CardHeader className="border-b border-slate-800 bg-slate-950/50">
              <CardTitle className="text-xl">
                {editingItem ? 'แก้ไขบันทึกการตรวจสอบ' : 'สร้างรายงานการตรวจสอบใหม่'}
              </CardTitle>
              <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">โหมดความปลอดภัย: บันทึกข้อมูลเข้าสู่ระบบส่วนกลาง</p>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-cyan-500 font-bold tracking-widest uppercase">ประเภทการตรวจสอบ</label>
                    <div className="grid grid-cols-2 gap-2 h-10">
                      <button type="button" onClick={() => handleTypeChange('VESSEL')} className={`rounded border text-[10px] font-bold uppercase transition-all ${formData.type === 'VESSEL' ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'}`}>ในเรือ</button>
                      <button type="button" onClick={() => handleTypeChange('PORT')} className={`rounded border text-[10px] font-bold uppercase transition-all ${formData.type === 'PORT' ? 'bg-amber-500 text-black border-amber-400' : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'}`}>บนท่าเรือ</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-cyan-500 font-bold tracking-widest uppercase">ชื่อสถานที่ (เลือกจากรายการ)</label>
                    <select
                      required
                      className="w-full bg-black border border-slate-800 rounded px-3 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition-all h-10"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    >
                      <option value="">-- กรุณาเลือกสถานที่ --</option>
                      {formData.type === 'VESSEL' ? (
                        VESSEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)
                      ) : (
                        PORT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)
                      )}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-cyan-500 font-bold tracking-widest uppercase">วันที่ตรวจสอบ</label>
                    <input type="date" className="w-full bg-black border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none transition-all h-10" value={formData.recordDate} onChange={e => setFormData({ ...formData, recordDate: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                    <ImageIcon className="w-4 h-4 text-cyan-500" />
                    ภาพถ่ายยืนยันสถานะอุปกรณ์ (.JPG, .PNG)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {formData.images?.map((img, idx) => (
                      <div key={img.id} className="space-y-3 group/img bg-slate-950/40 p-3 rounded-lg border border-slate-800 relative">
                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(img.id)}
                          className="absolute top-2 right-2 p-1.5 text-slate-600 hover:text-red-500 hover:bg-slate-900 rounded-lg transition-all z-10"
                          tabIndex={-1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="pr-8">
                          <input
                            type="text"
                            className="w-full bg-transparent border-b border-transparent hover:border-cyan-500/50 focus:border-cyan-500 text-[10px] font-mono text-cyan-400 font-bold uppercase truncate pl-2 outline-none transition-all"
                            value={img.label}
                            onChange={(e) => handleUpdateItemLabel(img.id, e.target.value)}
                            placeholder="ระบุชื่ออุปกรณ์..."
                          />
                        </div>

                        <div className="relative aspect-video rounded border-2 border-dashed border-slate-800 bg-black overflow-hidden hover:border-cyan-500/50 transition-all flex items-center justify-center">
                          {img.url ? (
                            <>
                              <img src={img.url} className="w-full h-full object-cover opacity-80" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button type="button" onClick={() => {
                                  // Special view mode for editing images? Actually just reuse gallery preview logic if needed
                                  setActiveInspectionItem(formData as MaritimeItem);
                                  setActiveDeviceIndex(idx);
                                }} className="p-2 bg-cyan-500/20 text-cyan-400 rounded-full hover:bg-cyan-500 hover:text-white transition-all"><Maximize2 className="w-4 h-4" /></button>
                                <button type="button" onClick={() => handleRemoveImage(img.id)} className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                              </div>
                            </>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-cyan-500/5 transition-colors">
                              <Camera className="w-6 h-6 text-slate-700 mb-2 group-hover/img:text-cyan-500 group-hover/img:animate-pulse" />
                              <span className="text-[9px] font-mono text-slate-700 group-hover/img:text-cyan-700 uppercase">อัปโหลดภาพ</span>
                              <input type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={e => handleImageUpload(img.id, e)} />
                            </label>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">สถานะอุปกรณ์</label>
                          <select
                            value={img.status}
                            onChange={e => handleUpdateItemStatus(img.id, e.target.value as MaritimeStatus)}
                            className={`w-full text-[10px] font-bold px-2 py-1.5 rounded border outline-none cursor-pointer transition-all ${getStatusColor(img.status)}`}
                          >
                            {statusOptions.map(opt => (
                              <option key={opt.value} value={opt.value} className="bg-slate-900 text-white font-bold">{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">รายละเอียด (2 บรรทัด)</label>
                          <textarea
                            rows={2}
                            placeholder="ระบุรายละเอียดเพิ่มเติม..."
                            value={img.description}
                            onChange={e => handleUpdateItemDescription(img.id, e.target.value)}
                            className="w-full bg-black border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:border-cyan-500 outline-none transition-all resize-none font-['Sarabun']"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Add Device Button */}
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-slate-600 hover:text-cyan-400 transition-all group min-h-[350px]"
                    >
                      <div className="p-3 bg-slate-900 group-hover:bg-cyan-500/20 rounded-full transition-colors">
                        <Plus className="w-8 h-8" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest">เพิ่มอุปกรณ์ใหม่</span>
                    </button>
                  </div>
                </div>
                <div className="pt-8 flex gap-4 border-t border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 uppercase tracking-[0.2em]">ยกเลิกขั้นตอน</Button>
                  <Button type="submit" className="flex-1 shadow-[0_0_20px_rgba(34,211,238,0.3)] uppercase tracking-[0.2em]">บันทึกข้อมูลเข้าระบบ</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const FolderCard: React.FC<{ folder: GroupedFolder; onClick: () => void }> = ({ folder, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer relative"
    >
      <div className="absolute inset-0 bg-cyan-500 rounded-lg blur-xl opacity-0 group-hover:opacity-10 transition-all duration-500"></div>
      <div className="relative bg-slate-900/60 border-2 border-slate-800 rounded-lg p-5 flex flex-col items-center gap-4 hover:border-cyan-500/50 hover:scale-105 transition-all duration-300">
        <div className="relative">
          <Folder className="w-16 h-16 text-slate-700 group-hover:hidden" />
          <FolderOpen className="w-16 h-16 text-cyan-400 hidden group-hover:block" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-2 text-slate-900 font-bold text-xs">
            {folder.monthIndex + 1}
          </div>
        </div>
        <div className="text-center w-full">
          <h3 className="text-white font-bold font-display uppercase tracking-widest truncate">{folder.name}</h3>
          <div className="text-[10px] font-mono text-cyan-500 uppercase font-bold mt-1">
            {folder.year}
          </div>
          <div className={`mt-2 text-[10px] font-bold ${folder.items.length > 0 ? 'text-white bg-cyan-950/50 border-cyan-500/50' : 'text-slate-600 bg-black border-slate-800'} border px-2 py-1 rounded transition-colors`}>
            {folder.items.length} รายงาน
          </div>
        </div>
        <div className="mt-1 w-full flex justify-between items-center text-[9px] font-mono text-slate-600 uppercase border-t border-slate-800 pt-3">
          <span>เปิดโฟลเดอร์</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

const InspectionGridCard: React.FC<{
  item: MaritimeItem;
  onEdit: (item: MaritimeItem) => void;
  onDelete: (id: string) => void;
  getStatusColor: (status: MaritimeStatus) => string;
  onShowDetail: (index: number) => void;
}> = ({ item, onEdit, onDelete, getStatusColor, onShowDetail }) => {
  const brokenCount = item.images.filter(i => i.status === 'BROKEN').length;
  const normalCount = item.images.filter(i => i.status === 'NORMAL').length;

  // Long press logic
  const [isDeleting, setIsDeleting] = useState(false);
  const timerRef = useRef<any>(null);

  const handlePressStart = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    timerRef.current = setTimeout(() => {
      onDelete(item.id);
      setIsDeleting(false);
    }, 2000);
  };

  const handlePressEnd = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsDeleting(false);
  };

  return (
    <Card className="hover:border-cyan-500/30 transition-all group overflow-hidden border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {item.type === 'VESSEL' ? <Ship className="w-5 h-5 text-cyan-500" /> : <Anchor className="w-5 h-5 text-amber-500" />}
              {item.name}
            </CardTitle>
            <div className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              {new Date(item.recordDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          {brokenCount > 0 && (
            <div className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[10px] font-bold animate-pulse flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {brokenCount} ชำรุด
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {item.images.slice(0, 4).map((img, idx) => (
            <div
              key={img.id}
              className={`aspect-square rounded bg-black border ${img.status === 'NORMAL' ? 'border-slate-800' : 'border-red-500/50'} relative overflow-hidden group/thumb cursor-pointer`}
              onClick={() => onShowDetail(idx)}
            >
              {img.url ? (
                <img src={img.url} className="w-full h-full object-cover opacity-70 group-hover/thumb:opacity-100 transition-opacity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-slate-700" />
                </div>
              )}
              <div className={`absolute bottom-0 inset-x-0 h-1 ${getStatusColor(img.status).split(' ')[2]}`}></div>
            </div>
          ))}
          {item.images.length > 4 && (
            <div className="aspect-square rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
              +{item.images.length - 4}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-800">
          <div className="text-[10px] font-mono text-slate-500">
            ID: {item.id.substring(0, 8)}...
          </div>
          <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 rounded"><Edit className="w-4 h-4" /></button>
            <button
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              onContextMenu={(e) => e.preventDefault()}
              className={`p-1.5 rounded relative overflow-hidden transition-all ${isDeleting ? 'bg-red-950 text-red-500' : 'hover:bg-red-500/10 text-slate-400 hover:text-red-400'}`}
            >
              {isDeleting && (
                <div className="absolute inset-0 flex flex-col justify-end">
                  <div className="w-full bg-red-500/40 animate-delete-progress shadow-[0_0_10px_#ef4444]" />
                </div>
              )}
              <Trash2 className={`w-4 h-4 relative z-10 ${isDeleting ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
