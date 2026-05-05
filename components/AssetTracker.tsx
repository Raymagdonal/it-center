import React, { useState, useMemo, useRef } from 'react';
import {
  Package, Anchor, Ship, Search, Plus, Edit, Trash2, X, Camera,
  ChevronRight, ArrowLeft, Box, Cpu, Signal, User, Calendar, Image as ImageIcon,
  Save, Filter, Layers, MoreVertical, Globe, CheckCircle, PlayCircle, Building2, MapPin
} from 'lucide-react';
import { TrackedAsset, AssetStatus, ProcurementFolder, ProcurementFolderItem, ProcurementLocationType, BOAT_LOCATIONS, PIER_LOCATIONS, OFFICE_LOCATIONS, THAI_MONTHS } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';

interface AssetTrackerProps {
  assets: TrackedAsset[];
  onUpdate: (assets: TrackedAsset[]) => void;
  onLocate?: (sn: string) => void;
  // Procurement integration
  procurementFolders?: ProcurementFolder[];
  onUpdateProcurement?: (folders: ProcurementFolder[]) => void;
}

const VESSEL_OPTIONS = ["CTB 1", "CTB 2", "CTB 3", "R1", "R2", "R3", "R4"];
const PORT_OPTIONS = ["BTS", "สาทร", "ไอคอนสยาม", "ราชวงศ์", "ราชินี", "วัดอรุณฯ", "ท่าช้าง", "มหาราช", "พรานนก", "พระอาทิตย์"];
const OFFICE_OPTIONS = ["สำนักงาน"];

export const AssetTracker: React.FC<AssetTrackerProps> = ({ assets, onUpdate, onLocate, procurementFolders = [], onUpdateProcurement }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PORT' | 'VESSEL'>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<TrackedAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Activation Modal State
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [activatingAsset, setActivatingAsset] = useState<TrackedAsset | null>(null);
  const initialActivationForm = {
    locationType: 'BOAT' as ProcurementLocationType,
    locationName: '',
    quantity: 1,
    activationDate: new Date().toISOString().split('T')[0]
  };
  const [activationForm, setActivationForm] = useState(initialActivationForm);

  // Form State
  const initialForm: Partial<TrackedAsset> = {
    sn: '',
    name: '',
    location: '',
    locationType: 'PORT',
    username: '',
    installedDate: new Date().toISOString().split('T')[0],
    imageUrl: '',
    status: 'SPARE',
    quantity: 1,
    unit: 'ชิ้น'
  };
  const [formData, setFormData] = useState(initialForm);

  // Filter assets to show only SPARE status
  const spareAssets = useMemo(() =>
    assets.filter(asset => asset.status === 'SPARE'),
    [assets]
  );

  // Process data for grouping view - only show SPARE items
  const locationSummaries = useMemo(() => {
    const map: Record<string, { location: string; type: 'PORT' | 'VESSEL'; assets: TrackedAsset[] }> = {};

    spareAssets.forEach(asset => {
      if (!map[asset.location]) {
        map[asset.location] = {
          location: asset.location,
          type: asset.locationType,
          assets: []
        };
      }
      map[asset.location].assets.push(asset);
    });

    return Object.values(map).filter(loc => {
      const matchesSearch = loc.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.assets.some(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.sn.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'ALL' || loc.type === filterType;
      return matchesSearch && matchesType;
    }).sort((a, b) => a.location.localeCompare(b.location));
  }, [spareAssets, searchTerm, filterType]);

  const activeLocation = useMemo(() =>
    locationSummaries.find(l => l.location === selectedLocation),
    [locationSummaries, selectedLocation]
  );

  // Handlers
  const handleOpenModal = (asset?: TrackedAsset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData(asset);
    } else {
      setEditingAsset(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newAsset: TrackedAsset = {
      ...(formData as TrackedAsset),
      id: editingAsset ? editingAsset.id : Math.random().toString(36).substr(2, 9),
    };

    if (editingAsset) {
      onUpdate(assets.map(a => a.id === editingAsset.id ? newAsset : a));
    } else {
      onUpdate([...assets, newAsset]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบอุปกรณ์นี้ออกจากระบบติดตาม?')) {
      onUpdate(assets.filter(a => a.id !== id));
      if (activeLocation && activeLocation.assets.length <= 1) setSelectedLocation(null);
    }
  };

  // Handler to open activation modal
  const handleActivate = (asset: TrackedAsset) => {
    setActivatingAsset(asset);
    setActivationForm({
      ...initialActivationForm,
      quantity: 1
    });
    setIsActivationModalOpen(true);
  };

  // Get location options based on location type
  const getLocationOptions = (locationType: ProcurementLocationType) => {
    switch (locationType) {
      case 'BOAT': return [...BOAT_LOCATIONS];
      case 'PIER': return [...PIER_LOCATIONS];
      case 'OFFICE': return [...OFFICE_LOCATIONS];
    }
  };

  // Handler to submit activation and add to procurement
  const handleActivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activatingAsset || !onUpdateProcurement) return;

    const { locationType, locationName, quantity, activationDate } = activationForm;
    if (!locationName) {
      alert('กรุณาเลือกสถานที่');
      return;
    }

    const assetQty = activatingAsset.quantity || 1;
    if (quantity > assetQty) {
      alert(`จำนวนที่ต้องการใช้มากกว่าจำนวนสำรอง (มี ${assetQty} ${activatingAsset.unit || 'ชิ้น'})`);
      return;
    }

    // Get month from activation date
    const activationMonth = new Date(activationDate).getMonth();
    const activationYear = new Date(activationDate).getFullYear();

    // Create new procurement item
    const newProcurementItem: ProcurementFolderItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: activatingAsset.name,
      imageUrl: activatingAsset.imageUrl || null,
      serialNumber: activatingAsset.sn,
      quantity: quantity,
      unit: activatingAsset.unit || 'ชิ้น',
      purchaseDate: activatingAsset.purchaseDate || activatingAsset.installedDate,
      startUseDate: activationDate,
      usageStatus: 'ACTIVE',
      notes: `นำออกจากสต๊อกสำรอง เมื่อ ${activationDate}`
    };

    // Find or create procurement folder
    let updatedFolders = [...procurementFolders];
    let folderIndex = updatedFolders.findIndex(
      f => f.year === activationYear && f.locationType === locationType && f.locationName === locationName && f.month === activationMonth
    );

    if (folderIndex === -1) {
      // Create new folder
      const newFolder: ProcurementFolder = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${locationName}_${THAI_MONTHS[activationMonth]}_${activationYear}`,
        locationType: locationType,
        locationName: locationName,
        year: activationYear,
        month: activationMonth,
        items: [newProcurementItem]
      };
      updatedFolders.push(newFolder);
    } else {
      // Add to existing folder
      updatedFolders[folderIndex].items.push(newProcurementItem);
    }

    onUpdateProcurement(updatedFolders);

    // Update asset quantity or remove if all used
    const remainingQty = assetQty - quantity;
    if (remainingQty <= 0) {
      // Remove asset from spare stock (mark as ACTIVE)
      const updatedAssets = assets.map(a =>
        a.id === activatingAsset.id ? { ...a, status: 'ACTIVE' as AssetStatus, quantity: 0 } : a
      );
      onUpdate(updatedAssets);
      // Go back if this was the last item in location
      if (activeLocation && activeLocation.assets.filter(a => a.id !== activatingAsset.id).length === 0) {
        setSelectedLocation(null);
      }
    } else {
      // Reduce quantity
      const updatedAssets = assets.map(a =>
        a.id === activatingAsset.id ? { ...a, quantity: remainingQty } : a
      );
      onUpdate(updatedAssets);
    }

    setIsActivationModalOpen(false);
    setActivatingAsset(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          {selectedLocation && (
            <button
              onClick={() => setSelectedLocation(null)}
              className="p-2 bg-slate-900 border border-slate-800 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-all shadow-glow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white font-['Rajdhani'] uppercase tracking-wider flex items-center gap-3">
              <Package className="h-8 w-8 text-cyan-500" />
              {selectedLocation ? `สต๊อกสำรอง: ${selectedLocation}` : 'สต๊อกสำรอง'}
            </h1>
            <p className="text-slate-400 mt-1 font-mono text-[10px] uppercase tracking-widest">
              {selectedLocation ? `Location Type: ${activeLocation?.type}` : 'จัดการอุปกรณ์สำรอง พร้อมนำไปใช้งานเมื่อต้องการ'}
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenModal()} className="shadow-glow-cyan">
          <Plus className="mr-2 h-4 w-4" /> เพิ่มอุปกรณ์สำรอง
        </Button>
      </div>

      {!selectedLocation && (
        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-sm">
          <div className="relative w-full md:max-w-md group">
            <input
              type="text"
              placeholder="ค้นหา S/N, ชื่ออุปกรณ์, หรือสถานที่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 focus:border-cyan-500 outline-none transition-all placeholder-slate-600"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-black rounded p-1 border border-slate-800">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${filterType === 'ALL' ? 'bg-cyan-500 text-black shadow-glow-sm' : 'text-slate-500'}`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterType('PORT')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${filterType === 'PORT' ? 'bg-amber-500 text-black' : 'text-slate-500'}`}
              >
                ท่าเรือ
              </button>
              <button
                onClick={() => setFilterType('VESSEL')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${filterType === 'VESSEL' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}
              >
                ในเรือ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-[400px]">
        {selectedLocation && activeLocation ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right duration-300">
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-cyan-500/20">
                <CardHeader>
                  <CardTitle>ข้อมูลสถานที่</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-black/40 rounded-lg border border-slate-800">
                    <div className={`p-3 rounded-lg ${activeLocation.type === 'VESSEL' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-500'}`}>
                      {activeLocation.type === 'VESSEL' ? <Ship className="w-8 h-8" /> : <Anchor className="w-8 h-8" />}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">{activeLocation.location}</div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{activeLocation.type === 'VESSEL' ? 'เรือโดยสาร' : 'ท่าเรือโดยสาร'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded text-center">
                      <div className="text-2xl font-bold text-cyan-400">{activeLocation.assets.length}</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">จำนวนอุปกรณ์สำรอง</div>
                    </div>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded text-center">
                      <div className="text-2xl font-bold text-amber-400">สำรอง</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">สถานะอุปกรณ์</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                Spare_Equipment_List
              </div>
              <div className="space-y-3">
                {activeLocation.assets.map((asset) => (
                  <div key={asset.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-lg group hover:border-cyan-500/30 transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded bg-black flex items-center justify-center border border-slate-800 text-slate-400 group-hover:text-cyan-400 transition-colors overflow-hidden shrink-0">
                        {asset.imageUrl ? (
                          <img src={asset.imageUrl} className="w-full h-full object-cover" alt={asset.name} />
                        ) : (
                          <Box className="w-8 h-8 opacity-20" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white uppercase">{asset.name}</div>
                        <div className="text-[10px] font-mono text-cyan-500 flex items-center gap-1 mb-1">
                          <Signal className="w-3 h-3" /> S/N: {asset.sn}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <User className="w-3 h-3 text-slate-500" /> {asset.username}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Calendar className="w-3 h-3" /> {asset.installedDate}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <div className="text-right mr-2">
                        <div className="text-lg font-bold text-amber-400">{asset.quantity || 1}</div>
                        <div className="text-[9px] text-slate-500 uppercase">{asset.unit || 'ชิ้น'}</div>
                      </div>
                      <button
                        onClick={() => handleActivate(asset)}
                        className="px-3 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition-all border border-green-500/30 flex items-center gap-2 font-bold text-xs uppercase"
                        title="นำอุปกรณ์ออกใช้งาน"
                      >
                        <PlayCircle className="w-4 h-4" />
                        ใช้งาน
                      </button>
                      {onLocate && (
                        <button
                          onClick={() => onLocate(asset.sn)}
                          className="p-2 bg-slate-800 text-slate-400 hover:text-cyan-400 rounded transition-all border border-transparent hover:border-cyan-500/30"
                          title="ดูตำแหน่งบน 3D"
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleOpenModal(asset)} className="p-2 bg-slate-800 text-slate-400 hover:text-cyan-400 rounded transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(asset.id)} className="p-2 bg-slate-800 text-slate-400 hover:text-red-400 rounded transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {locationSummaries.map(summary => (
              <LocationCard
                key={summary.location}
                summary={summary}
                onClick={() => setSelectedLocation(summary.location)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Asset Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-xl border-cyan-500/30">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>{editingAsset ? 'แก้ไขข้อมูลอุปกรณ์สำรอง' : 'เพิ่มอุปกรณ์สำรองใหม่'}</CardTitle>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                {/* Photo Upload */}
                <div className="flex flex-col items-center justify-center p-4 bg-black/40 border border-slate-800 rounded-lg">
                  <div className="relative w-32 h-32 mb-4 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center group/photo overflow-hidden">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-10 h-10 text-slate-700 group-hover/photo:text-cyan-500 transition-colors" />
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white uppercase">เปลี่ยนรูป</button>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest Device_Visual_Identification">Device_Visual_Identification</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-cyan-500 uppercase mb-1">Serial Number (S/N)</label>
                    <input required className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none font-mono" value={formData.sn} onChange={e => setFormData({ ...formData, sn: e.target.value })} placeholder="เช่น SN-X12345" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อเรียกอุปกรณ์</label>
                    <input required className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น จอ CCTV 32นิ้ว" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อสถานที่ติดตั้ง</label>
                    <select
                      required
                      className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                    >
                      <option value="">-- เลือกสถานที่ --</option>
                      {formData.locationType === 'VESSEL' ? (
                        VESSEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)
                      ) : (
                        PORT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ประเภทสถานที่</label>
                    <select
                      className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none"
                      value={formData.locationType}
                      onChange={e => setFormData({ ...formData, locationType: e.target.value as any, location: '' })}
                    >
                      <option value="PORT">ท่าเรือ</option>
                      <option value="VESSEL">ในเรือ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">จำนวน</label>
                    <input type="number" min="1" required className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none font-mono" value={formData.quantity || 1} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">หน่วย</label>
                    <input className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none" value={formData.unit || 'ชิ้น'} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="ชิ้น, อัน, เส้น..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อผู้ใช้งาน / ผู้รับผิดชอบ</label>
                    <input required className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="ระบุชื่อเจ้าหน้าที่" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">วันที่รับเข้าสต๊อก</label>
                    <input type="date" className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none" value={formData.installedDate} onChange={e => setFormData({ ...formData, installedDate: e.target.value })} />
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 uppercase">ยกเลิก</Button>
                  <Button type="submit" className="flex-[2] uppercase shadow-glow-cyan">บันทึกอุปกรณ์สำรอง</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activation Modal */}
      {isActivationModalOpen && activatingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md border-green-500/30">
            <CardHeader className="flex flex-row justify-between items-center bg-green-900/20 border-b border-green-500/30">
              <CardTitle className="text-green-400">นำอุปกรณ์ออกใช้งาน</CardTitle>
              <button onClick={() => setIsActivationModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </CardHeader>
            <CardContent className="p-6">
              {/* Asset Preview */}
              <div className="flex items-center gap-4 p-4 bg-black/40 rounded-lg border border-slate-800 mb-6">
                <div className="w-14 h-14 rounded bg-slate-900 flex items-center justify-center border border-slate-700 overflow-hidden">
                  {activatingAsset.imageUrl ? (
                    <img src={activatingAsset.imageUrl} className="w-full h-full object-cover" alt={activatingAsset.name} />
                  ) : (
                    <Package className="w-6 h-6 text-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold">{activatingAsset.name}</div>
                  <div className="text-[10px] text-cyan-500 font-mono">S/N: {activatingAsset.sn}</div>
                  <div className="text-xs text-amber-400 mt-1">
                    คงเหลือ: <span className="font-bold">{activatingAsset.quantity || 1}</span> {activatingAsset.unit || 'ชิ้น'}
                  </div>
                </div>
              </div>

              <form onSubmit={handleActivateSubmit} className="space-y-4">
                {/* Location Type */}
                <div>
                  <label className="block text-[10px] font-bold text-green-500 uppercase mb-2">ประเภทสถานที่</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['BOAT', 'PIER', 'OFFICE'] as ProcurementLocationType[]).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setActivationForm({ ...activationForm, locationType: type, locationName: '' })}
                        className={`p-3 rounded border transition-all flex flex-col items-center gap-1 ${activationForm.locationType === type
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : 'bg-black border-slate-700 text-slate-500 hover:border-slate-600'
                          }`}
                      >
                        {type === 'BOAT' && <Ship className="w-5 h-5" />}
                        {type === 'PIER' && <Anchor className="w-5 h-5" />}
                        {type === 'OFFICE' && <Building2 className="w-5 h-5" />}
                        <span className="text-[9px] font-bold uppercase">
                          {type === 'BOAT' ? 'เรือ' : type === 'PIER' ? 'ท่าเรือ' : 'สำนักงาน'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Name */}
                <div>
                  <label className="block text-[10px] font-bold text-green-500 uppercase mb-2">ชื่อสถานที่</label>
                  <select
                    required
                    className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-green-500 outline-none"
                    value={activationForm.locationName}
                    onChange={e => setActivationForm({ ...activationForm, locationName: e.target.value })}
                  >
                    <option value="">-- เลือกสถานที่ --</option>
                    {getLocationOptions(activationForm.locationType).map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[10px] font-bold text-green-500 uppercase mb-2">จำนวนที่ต้องการใช้</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max={activatingAsset.quantity || 1}
                      required
                      className="flex-1 bg-black border border-slate-700 rounded p-3 text-white focus:border-green-500 outline-none font-mono text-lg"
                      value={activationForm.quantity}
                      onChange={e => setActivationForm({ ...activationForm, quantity: parseInt(e.target.value) || 1 })}
                    />
                    <span className="text-slate-400">{activatingAsset.unit || 'ชิ้น'}</span>
                    <span className="text-[10px] text-slate-500">(มี {activatingAsset.quantity || 1} {activatingAsset.unit || 'ชิ้น'})</span>
                  </div>
                </div>

                {/* Activation Date */}
                <div>
                  <label className="block text-[10px] font-bold text-green-500 uppercase mb-2">วันที่นำออกใช้</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-green-500 outline-none"
                    value={activationForm.activationDate}
                    onChange={e => setActivationForm({ ...activationForm, activationDate: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsActivationModalOpen(false)} className="flex-1">ยกเลิก</Button>
                  <Button type="submit" className="flex-[2] bg-green-600 hover:bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    ยืนยันการใช้งาน
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

const LocationCard: React.FC<{
  summary: { location: string; type: 'PORT' | 'VESSEL'; assets: TrackedAsset[] };
  onClick: () => void
}> = ({ summary, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer relative"
    >
      <div className="absolute inset-0 bg-cyan-500 rounded-lg blur-xl opacity-0 group-hover:opacity-10 transition-all duration-500"></div>
      <div className="relative bg-slate-900/60 border-2 border-slate-800 rounded-lg p-5 flex flex-col items-center gap-4 hover:border-cyan-500/50 hover:scale-105 transition-all duration-300">
        <div className="relative">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${summary.type === 'VESSEL' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-500' : 'border-amber-500/30 bg-amber-500/10 text-amber-500'}`}>
            {summary.type === 'VESSEL' ? <Ship className="w-8 h-8" /> : <Anchor className="w-8 h-8" />}
          </div>
        </div>
        <div className="text-center w-full">
          <h3 className="text-white font-bold font-display uppercase tracking-widest truncate">{summary.location}</h3>
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold mt-1">{summary.type === 'VESSEL' ? 'Onboard Vessel' : 'Port Station'}</div>
          <div className="mt-3 flex justify-center gap-2">
            <div className="text-[10px] font-bold text-slate-300 border border-slate-700 px-2 py-1 rounded bg-black flex items-center gap-2">
              <Box className="w-3 h-3 text-cyan-500" /> {summary.assets.length} Assets
            </div>
          </div>
        </div>
        <div className="mt-1 w-full flex justify-between items-center text-[9px] font-mono text-slate-600 uppercase border-t border-slate-800 pt-3">
          <span>View Details</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};