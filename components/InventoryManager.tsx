
import React, { useState, useMemo } from 'react';
import {
  Package, Plus, Search, AlertTriangle, ShoppingCart, Edit, Trash2, X,
  Calendar, Save, Folder, FolderOpen, ArrowLeft, Layers, Ship, Anchor, Building2,
  Camera, Clock, Activity, ChevronDown
} from 'lucide-react';
import { ProcurementFolder, ProcurementFolderItem, ProcurementLocationType, BOAT_LOCATIONS, PIER_LOCATIONS, OFFICE_LOCATIONS, PROCUREMENT_YEARS, THAI_MONTHS, AppMode, InventorySelection } from '../types';
import { Button } from './ui/Button';
import { compressImage } from '../utils/storageUtils';

import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface InventoryManagerProps {
  folders: ProcurementFolder[];
  onUpdate: (folders: ProcurementFolder[]) => void;
  onNavigate?: (mode: AppMode) => void;
  initialSelection?: InventorySelection | null;
}

type ViewLevel = 'year' | 'category' | 'location' | 'month' | 'items';

// Import EquipmentSummary
import { EquipmentSummary } from './EquipmentSummary';

type InventoryViewMode = 'LIST' | 'SUMMARY';

export const InventoryManager: React.FC<InventoryManagerProps> = ({ folders, onUpdate, onNavigate, initialSelection }) => {
  // View Mode State
  const [viewMode, setViewMode] = useState<InventoryViewMode>('LIST');
  // Navigation State
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedCategory, setSelectedCategory] = useState<ProcurementLocationType | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
  const [editingItem, setEditingItem] = useState<ProcurementFolderItem | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Form State
  const initialFormState: Partial<ProcurementFolderItem> = {
    name: '',
    imageUrl: null,
    serialNumber: '',
    quantity: 1,
    unit: 'อัน',
    purchaseDate: new Date().toISOString().split('T')[0],
    startUseDate: '',
    usageStatus: 'ACTIVE',
    notes: ''
  };
  const [formData, setFormData] = useState(initialFormState);

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
      item.serialNumber?.toLowerCase().includes(lower)
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

  // CRUD Handlers
  const handleOpenModal = (item?: ProcurementFolderItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !selectedLocation || selectedMonth === null) return;

    const newItem: ProcurementFolderItem = {
      ...(formData as ProcurementFolderItem),
      id: editingItem ? editingItem.id : Math.random().toString(36).substr(2, 9),
    };

    // Find or create folder
    let updatedFolders = [...folders];
    let folderIndex = updatedFolders.findIndex(
      f => f.year === selectedYear && f.locationType === selectedCategory && f.locationName === selectedLocation && f.month === selectedMonth
    );

    if (folderIndex === -1) {
      // Create new folder
      const newFolder: ProcurementFolder = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${selectedLocation}_${THAI_MONTHS[selectedMonth]}_${selectedYear}`,
        locationType: selectedCategory,
        locationName: selectedLocation,
        year: selectedYear,
        month: selectedMonth,
        items: [newItem]
      };
      updatedFolders.push(newFolder);
    } else {
      // Update existing folder
      if (editingItem) {
        updatedFolders[folderIndex].items = updatedFolders[folderIndex].items.map(
          i => i.id === editingItem.id ? newItem : i
        );
      } else {
        updatedFolders[folderIndex].items.push(newItem);
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

  // Get breadcrumb path
  const getBreadcrumb = () => {
    const parts = [`ปี ${selectedYear}`];
    if (selectedCategory) parts.push(getCategoryName(selectedCategory));
    if (selectedLocation) parts.push(selectedLocation);
    if (selectedMonth !== null) parts.push(THAI_MONTHS[selectedMonth]);
    return parts;
  };

  // Get item count for a specific month in a location
  const getMonthItemCount = (month: number) => {
    const folder = folders.find(
      f => f.year === selectedYear && f.locationType === selectedCategory && f.locationName === selectedLocation && f.month === month
    );
    return folder?.items.length || 0;
  };

  return (
    <div className="p-8 max-w-[1920px] mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-6">
          {(selectedCategory || selectedLocation) && (
            <button
              onClick={handleBack}
              className="p-3 bg-black border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all clip-corner"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-4xl font-black text-white font-display uppercase tracking-widest flex items-center gap-4 text-neon">
              <ShoppingCart className="h-10 w-10 text-cyan-500" />
              จัดซื้ออุปกรณ์
            </h1>
            <div className="text-cyan-600 mt-2 font-mono text-xs uppercase tracking-[0.3em] font-bold flex items-center gap-2">
              {getBreadcrumb().map((part, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-slate-600">/</span>}
                  <span className={i === getBreadcrumb().length - 1 ? 'text-cyan-400' : ''}>{part}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 border border-slate-700/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'LIST' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-400 hover:text-white'}`}
            >
              รายการจัดซื้อ
            </button>
            <button
              onClick={() => setViewMode('SUMMARY')}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'SUMMARY' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-400 hover:text-white'}`}
            >
              สรุปจัดซื้อรายเดือน
            </button>
          </div>

          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value));
                setSelectedCategory(null);
                setSelectedLocation(null);
                setSelectedMonth(null);
              }}
              className="appearance-none bg-black border border-cyan-900 text-cyan-400 py-3 px-4 pr-10 font-mono font-bold text-sm cursor-pointer hover:border-cyan-500 transition-colors focus:outline-none focus:border-cyan-400"
            >
              {PROCUREMENT_YEARS.map(year => (
                <option key={year} value={year}>ปี {year}</option>
              ))}
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600 pointer-events-none" />
          </div>

          {selectedMonth !== null && (
            <Button onClick={() => handleOpenModal()} className="shadow-[0_0_20px_rgba(0,242,255,0.3)]">
              <Plus className="mr-2 h-4 w-4" /> เพิ่มอุปกรณ์
            </Button>
          )}
        </div>
      </div>


      {
        viewMode === 'SUMMARY' ? (
          <EquipmentSummary items={folders.flatMap(f => f.items.map(item => ({
            ...item,
            locationName: f.locationName,
            locationType: f.locationType
          })))} />
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['BOAT', 'PIER', 'OFFICE'] as ProcurementLocationType[]).map(category => (
                <div
                  key={category}
                  onClick={() => !selectedCategory && handleCategorySelect(category)}
                  className={`bg-black/60 border p-6 relative overflow-hidden group transition-all ${selectedCategory === category
                    ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                    : selectedCategory
                      ? 'border-slate-800 opacity-50'
                      : 'border-cyan-900/50 cursor-pointer hover:border-cyan-500'
                    }`}
                >
                  <div className="absolute inset-0 bg-cyan-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-cyan-950/30 border border-cyan-500 flex items-center justify-center text-cyan-500 shadow-[0_0_15px_rgba(0,242,255,0.4)] clip-corner">
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <div className="text-4xl font-display font-bold text-white">{getCategoryItemCount(category)}</div>
                      <div className="text-[10px] text-cyan-500 font-mono font-bold uppercase tracking-widest">{getCategoryName(category)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Category Selection View */}
            {!selectedCategory && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {(['BOAT', 'PIER', 'OFFICE'] as ProcurementLocationType[]).map(category => (
                  <div
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className="group cursor-pointer relative h-64"
                  >
                    <div className="absolute inset-0 bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 clip-corner"></div>
                    <div className="absolute inset-0 p-6 flex flex-col items-center justify-center gap-4 z-10">
                      <div className="w-20 h-20 border border-cyan-500 flex items-center justify-center text-cyan-500 bg-black group-hover:bg-cyan-500 group-hover:text-black transition-all clip-corner">
                        {getCategoryIcon(category)}
                      </div>
                      <div className="text-center w-full space-y-2">
                        <h3 className="text-white font-bold font-display uppercase tracking-widest text-lg group-hover:text-cyan-300 transition-colors">
                          {getCategoryName(category)}
                        </h3>
                        <div className="inline-block px-3 py-1 bg-black border border-cyan-900 rounded text-[10px] text-cyan-500 font-mono font-bold">
                          {getLocationsForCategory(category).length} สถานที่
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Location Selection View */}
            {selectedCategory && !selectedLocation && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {getLocationsForCategory(selectedCategory).map(location => {
                  const itemCount = getFolderItemCount(selectedCategory, location);
                  return (
                    <div
                      key={location}
                      onClick={() => handleLocationSelect(location)}
                      className="group cursor-pointer relative h-64"
                    >
                      <div className="absolute inset-0 bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 clip-corner"></div>
                      <div className="absolute inset-0 p-6 flex flex-col items-center justify-center gap-4 z-10">
                        <div className="relative">
                          <Folder className="w-20 h-20 text-slate-800 group-hover:hidden transition-all" />
                          <FolderOpen className="w-20 h-20 text-cyan-400 hidden group-hover:block drop-shadow-[0_0_15px_rgba(0,242,255,0.6)] transition-all" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-2">
                            {getCategoryIcon(selectedCategory)}
                          </div>
                        </div>
                        <div className="text-center w-full space-y-2">
                          <h3 className="text-white font-bold font-display uppercase tracking-widest truncate text-sm group-hover:text-cyan-300 transition-colors">
                            {location}
                          </h3>
                          <div className="inline-block px-3 py-1 bg-black border border-cyan-900 rounded text-[10px] text-cyan-500 font-mono font-bold">
                            {itemCount} รายการ
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Month Selection View */}
            {selectedLocation && selectedMonth === null && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {THAI_MONTHS.map((monthName, monthIndex) => {
                  const itemCount = getMonthItemCount(monthIndex);
                  return (
                    <div
                      key={monthIndex}
                      onClick={() => handleMonthSelect(monthIndex)}
                      className="group cursor-pointer relative"
                    >
                      <div className={`bg-slate-900/80 border p-4 rounded-lg transition-all duration-300 ${itemCount > 0
                        ? 'border-cyan-500/50 hover:border-cyan-400'
                        : 'border-slate-800 hover:border-slate-600'
                        }`}>
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${itemCount > 0
                            ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                            : 'bg-slate-800/50 border border-slate-700 text-slate-500'
                            }`}>
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <h3 className={`font-bold text-sm ${itemCount > 0 ? 'text-white' : 'text-slate-500'
                              }`}>
                              {monthName}
                            </h3>
                            <div className={`text-[10px] font-mono mt-1 ${itemCount > 0 ? 'text-cyan-500' : 'text-slate-600'
                              }`}>
                              {itemCount} รายการ
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Items List View */}
            {selectedMonth !== null && (
              <>
                {/* Search Bar */}
                <div className="bg-black/80 border border-cyan-900/50 p-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md shadow-2xl">
                  <div className="relative w-full md:max-w-xl group">
                    <input
                      type="text"
                      placeholder="ค้นหาอุปกรณ์..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 py-3 pl-12 pr-4 text-sm text-cyan-300 focus:border-cyan-500 focus:bg-slate-900 outline-none transition-all font-mono tracking-wide placeholder-slate-600"
                    />
                    <Search className="absolute left-4 top-3 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400" />
                  </div>
                  <div className="text-xs font-mono text-cyan-600 uppercase tracking-widest font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    อุปกรณ์ทั้งหมด: <span className="text-white">{currentFolder?.items.length || 0}</span>
                  </div>
                </div>

                {/* Items Grid */}
                {filteredItems.length === 0 ? (
                  <div className="text-center py-20">
                    <Package className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-mono">ยังไม่มีอุปกรณ์ใน folder นี้</p>
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
                              <th className="py-4 pl-6">รายละเอียด</th>
                              <th className="py-4">หมายเหตุ</th>
                              <th className="py-4">จำนวน</th>
                              <th className="py-4">สถานะ / ระยะเวลาใช้งาน</th>
                              <th className="py-4 pr-6 text-right">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {filteredItems.map((item) => (
                              <tr key={item.id} className="group hover:bg-cyan-900/10 transition-colors">
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
                                        <div className="w-full h-full flex items-center justify-center text-slate-700"><Package className="w-6 h-6" /></div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-bold text-white text-sm font-display tracking-wide">{item.name}</div>
                                      <div className="text-[10px] text-slate-500 font-mono mt-1">ซื้อ: {item.purchaseDate} {item.supplier && ` | จาก: ${item.supplier}`}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div className="text-xs text-slate-400">{item.notes || '-'}</div>
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
                                  <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(item)} className="p-2 bg-slate-900 border border-slate-700 text-cyan-400 hover:text-black hover:bg-cyan-500 rounded transition-all"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 bg-slate-900 border border-slate-700 text-red-500 hover:text-black hover:bg-red-500 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <Card className="w-full max-w-lg border-cyan-500 bg-slate-950 shadow-[0_0_50px_rgba(0,242,255,0.2)]">
                  <CardHeader className="flex flex-row justify-between items-center bg-cyan-900/20 border-b border-cyan-500/30">
                    <CardTitle>{editingItem ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</CardTitle>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form onSubmit={handleSave} className="space-y-6">
                      {/* Image Upload */}
                      <div className="flex justify-center mb-6">
                        <label className="relative w-32 h-32 bg-slate-900 border-2 border-dashed border-cyan-900 hover:border-cyan-500 rounded-lg flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all">
                          {formData.imageUrl ? (
                            <img src={formData.imageUrl} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <Camera className="w-8 h-8 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                              <span className="text-[9px] mt-2 text-slate-500 uppercase font-bold group-hover:text-cyan-500">อัพโหลดรูป</span>
                            </>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">ชื่ออุปกรณ์</label>
                        <input required className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none font-display tracking-wide" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="ระบุชื่ออุปกรณ์..." />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">ร้านค้า / ตัวแทนจำหน่าย</label>
                        <input className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none font-display tracking-wide" value={formData.supplier || ''} onChange={e => setFormData({ ...formData, supplier: e.target.value })} placeholder="ระบุร้านค้า..." />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">Serial Number</label>
                          <input className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none font-mono" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} placeholder="S/N..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">จำนวน</label>
                            <input type="number" min="0" className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none font-mono" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">หน่วย</label>
                            <input className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="อัน" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">วันที่ซื้อ</label>
                          <input type="date" className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">วันที่เริ่มใช้งาน</label>
                          <input type="date" className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none" value={formData.startUseDate || ''} onChange={e => setFormData({ ...formData, startUseDate: e.target.value })} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">สถานะการใช้งาน</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, usageStatus: 'ACTIVE' })}
                            className={`p-3 border rounded transition-all font-bold uppercase text-xs flex items-center justify-center gap-2 ${formData.usageStatus === 'ACTIVE' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'}`}
                          >
                            <Activity className="w-4 h-4" /> ใช้งาน
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, usageStatus: 'SPARE' })}
                            className={`p-3 border rounded transition-all font-bold uppercase text-xs flex items-center justify-center gap-2 ${formData.usageStatus === 'SPARE' ? 'bg-slate-700/50 border-white/50 text-white' : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'}`}
                          >
                            <Package className="w-4 h-4" /> สำรอง
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase mb-2 tracking-widest">หมายเหตุ</label>
                        <textarea className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none resize-none h-20" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="หมายเหตุเพิ่มเติม..." />
                      </div>

                      <div className="pt-6 flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">ยกเลิก</Button>
                        <Button type="submit" className="flex-[2] shadow-[0_0_20px_rgba(0,242,255,0.4)]">บันทึกข้อมูล</Button>
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
