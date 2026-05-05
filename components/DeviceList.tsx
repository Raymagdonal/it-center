
import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, Table as TableIcon, Search, 
  Smartphone, Monitor, Printer, Wifi, Camera, Tablet,
  CheckCircle2, AlertTriangle, PenLine, Save, X, Box, HardDrive, Cpu, MoreHorizontal
} from 'lucide-react';
import { TrackedAsset, AssetStatus } from '../types';
import { Card, CardContent } from './ui/Card';

interface DeviceListProps {
  assets: TrackedAsset[];
  onUpdate: (assets: TrackedAsset[]) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({ assets, onUpdate }) => {
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<TrackedAsset>>({});

  // --- Grouping Logic for Card View ---
  const groupedAssets = useMemo(() => {
    const groups: Record<string, { 
      name: string; 
      model: string; 
      count: number; 
      image: string; 
      serials: string[]; 
      type: string;
      statusCounts: Record<string, number>;
    }> = {};

    assets.forEach(asset => {
      // Group by Model first, fallback to Name
      const key = asset.model || asset.name;
      
      if (!groups[key]) {
        // Determine type based on name keywords
        let type = 'Device';
        const lowerName = (asset.name + asset.model).toLowerCase();
        if (lowerName.includes('printer')) type = 'Printer';
        else if (lowerName.includes('camera') || lowerName.includes('cctv')) type = 'Camera';
        else if (lowerName.includes('wifi') || lowerName.includes('router')) type = 'Network';
        else if (lowerName.includes('pad') || lowerName.includes('tablet')) type = 'Tablet';
        else if (lowerName.includes('cable') || lowerName.includes('charge')) type = 'Accessory';

        groups[key] = {
          name: asset.name,
          model: asset.model || asset.name,
          count: 0,
          image: asset.imageUrl || '',
          serials: [],
          type,
          statusCounts: {}
        };
      }
      
      groups[key].count++;
      groups[key].serials.push(asset.sn);
      if (asset.imageUrl && !groups[key].image) groups[key].image = asset.imageUrl;
      
      const status = asset.status || 'ACTIVE';
      groups[key].statusCounts[status] = (groups[key].statusCounts[status] || 0) + 1;
    });

    return Object.values(groups).filter(g => 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      g.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assets, searchTerm]);

  // --- Handlers ---

  const handleEditClick = (asset: TrackedAsset) => {
    setEditingId(asset.id);
    setEditFormData({ ...asset });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = () => {
    if (editingId && editFormData) {
      const updatedAssets = assets.map(a => a.id === editingId ? { ...a, ...editFormData } : a);
      onUpdate(updatedAssets);
      setEditingId(null);
      setEditFormData({});
    }
  };

  const handleInputChange = (field: keyof TrackedAsset, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDelete = (id: string) => {
    if (confirm('ยืนยันการลบรายการนี้?')) {
        const updatedAssets = assets.filter(a => a.id !== id);
        onUpdate(updatedAssets);
    }
  }

  // --- Visual Helpers ---

  const getStatusBadge = (status: AssetStatus = 'ACTIVE') => {
    switch (status) {
      case 'ACTIVE': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30 text-[10px] font-bold uppercase w-fit"><CheckCircle2 className="w-3 h-3"/> ใช้งานปกติ</span>;
      case 'SPARE': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase w-fit"><Box className="w-3 h-3"/> สำรอง</span>;
      case 'BROKEN': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase w-fit"><AlertTriangle className="w-3 h-3"/> ชำรุด</span>;
      case 'SEND_CLAIM': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase w-fit">ส่งเคลม</span>;
      default: return <span className="text-slate-500">-</span>;
    }
  };

  const getDeviceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('printer')) return <Printer className="w-4 h-4" />;
    if (n.includes('camera') || n.includes('cctv')) return <Camera className="w-4 h-4" />;
    if (n.includes('router') || n.includes('wifi')) return <Wifi className="w-4 h-4" />;
    if (n.includes('tablet') || n.includes('ipad')) return <Tablet className="w-4 h-4" />;
    if (n.includes('monitor') || n.includes('screen')) return <Monitor className="w-4 h-4" />;
    return <Smartphone className="w-4 h-4" />;
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-500/20 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-3">
            <HardDrive className="h-8 w-8 text-cyan-500" />
            รายการอุปกรณ์ทั้งหมด
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            MASTER_DEVICE_REGISTRY // ฐานข้อมูลทรัพย์สิน
          </p>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('GRID')}
                className={`p-2 rounded transition-all flex items-center gap-2 text-xs font-bold ${viewMode === 'GRID' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LayoutGrid className="w-4 h-4" /> มุมมองการ์ด
              </button>
              <button 
                onClick={() => setViewMode('TABLE')}
                className={`p-2 rounded transition-all flex items-center gap-2 text-xs font-bold ${viewMode === 'TABLE' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <TableIcon className="w-4 h-4" /> มุมมองตาราง
              </button>
           </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60 p-3 rounded-lg border border-slate-800 backdrop-blur-md sticky top-0 z-20 shadow-xl">
         <div className="relative w-full sm:max-w-sm group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่ออุปกรณ์, รุ่น, หรือ S/N..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:border-cyan-500 outline-none transition-all placeholder-slate-600 font-mono"
            />
         </div>
         <div className="flex items-center gap-4">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold bg-black/40 px-3 py-1.5 rounded border border-slate-800">
                จำนวนทั้งหมด: <span className="text-cyan-400 text-base ml-1">{assets.length}</span>
            </div>
         </div>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {groupedAssets.map((group, idx) => (
               <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden hover:border-cyan-500/50 transition-all duration-300 group shadow-lg flex flex-col h-full relative">
                  
                  {/* Card Badge */}
                  <div className="absolute top-3 right-3 z-10">
                     <span className="bg-slate-950/80 backdrop-blur text-slate-400 border border-slate-700 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider shadow-sm">
                        {group.type}
                     </span>
                  </div>

                  {/* Card Image Area */}
                  <div className="h-40 bg-gradient-to-b from-slate-800/50 to-slate-900 p-4 flex items-center justify-center relative">
                     {group.image ? (
                        <img src={group.image} className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500" alt={group.name} />
                     ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                           <Box className="w-8 h-8 text-slate-600" />
                        </div>
                     )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col">
                     <div className="mb-4">
                        <h3 className="font-bold text-lg text-white truncate font-display tracking-wide" title={group.model}>
                           {group.model}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-slate-400 text-xs">
                           {getDeviceIcon(group.name)}
                           <span className="truncate">{group.name}</span>
                        </div>
                     </div>

                     <div className="mt-auto">
                        <div className="flex justify-between items-end border-t border-slate-800 pt-3 pb-3">
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">จำนวนที่เหลือ</span>
                           <span className="text-3xl font-bold text-cyan-400 font-mono leading-none">{group.count}</span>
                        </div>
                        
                        <div className="space-y-2 bg-slate-950/50 p-2 rounded border border-slate-800/50">
                           <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">รายการหมายเลขซีเรียล</span>
                           <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                              {group.serials.map(sn => (
                                <span key={sn} className="px-1.5 py-0.5 bg-slate-900 text-slate-400 text-[9px] font-mono rounded border border-slate-800 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors cursor-default">
                                   {sn}
                                </span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left text-xs border-collapse">
                  <thead>
                     <tr className="bg-slate-950 text-slate-500 border-b border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4 w-12 text-center">#</th>
                        <th className="p-4">หมายเลขซีเรียล (S/N)</th>
                        <th className="p-4">วันที่ซื้อ</th>
                        <th className="p-4">ที่มา/ร้านค้า</th>
                        <th className="p-4">ราคา</th>
                        <th className="p-4">รุ่น (Model)</th>
                        <th className="p-4">ชื่อเรียก</th>
                        <th className="p-4 text-center">รูปภาพ</th>
                        <th className="p-4">สถานะ</th>
                        <th className="p-4">สถานที่ติดตั้ง</th>
                        <th className="p-4">หมายเหตุ</th>
                        <th className="p-4 text-center">จัดการ</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                     {assets.filter(a => 
                        a.sn.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        a.name.toLowerCase().includes(searchTerm.toLowerCase())
                     ).map((asset, index) => {
                        const isEditing = editingId === asset.id;
                        return (
                           <tr key={asset.id} className="hover:bg-slate-800/50 transition-colors group">
                              <td className="p-4 text-center text-slate-600 font-mono">{index + 1}</td>
                              
                              {/* Serial Number */}
                              <td className="p-4">
                                 {isEditing ? (
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white focus:border-cyan-500 outline-none font-mono" value={editFormData.sn} onChange={e => handleInputChange('sn', e.target.value)} />
                                 ) : (
                                    <div className="font-mono font-bold text-cyan-400 group-hover:text-cyan-300">{asset.sn}</div>
                                 )}
                              </td>

                              {/* Purchase Date */}
                              <td className="p-4">
                                 {isEditing ? (
                                    <input type="date" className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white focus:border-cyan-500 outline-none" value={editFormData.purchaseDate} onChange={e => handleInputChange('purchaseDate', e.target.value)} />
                                 ) : (
                                    <div className="text-slate-400">{asset.purchaseDate || '-'}</div>
                                 )}
                              </td>

                              {/* Source */}
                              <td className="p-4">
                                 {isEditing ? (
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white focus:border-cyan-500 outline-none" value={editFormData.source} onChange={e => handleInputChange('source', e.target.value)} placeholder="ระบุที่มา..." />
                                 ) : (
                                    <div className="text-slate-400 truncate max-w-[100px]">{asset.source || '-'}</div>
                                 )}
                              </td>

                              {/* Price */}
                              <td className="p-4">
                                 {isEditing ? (
                                    <input type="number" className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white focus:border-cyan-500 outline-none" value={editFormData.price} onChange={e => handleInputChange('price', Number(e.target.value))} />
                                 ) : (
                                    <div className="font-mono text-slate-300">{asset.price ? `฿${asset.price.toLocaleString()}` : '-'}</div>
                                 )}
                              </td>

                              {/* Item / Model */}
                              <td className="p-4">
                                 {isEditing ? (
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white focus:border-cyan-500 outline-none" value={editFormData.model} onChange={e => handleInputChange('model', e.target.value)} />
                                 ) : (
                                    <div className="text-white font-bold">{asset.model || asset.name}</div>
                                 )}
                              </td>

                              {/* Device Name */}
                              <td className="p-4">
                                 {isEditing ? (
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white focus:border-cyan-500 outline-none" value={editFormData.name} onChange={e => handleInputChange('name', e.target.value)} />
                                 ) : (
                                    <div className="text-slate-400 flex items-center gap-2">
                                       {getDeviceIcon(asset.name)}
                                       {asset.name}
                                    </div>
                                 )}
                              </td>

                              {/* Image */}
                              <td className="p-4 text-center">
                                 {asset.imageUrl ? (
                                    <div className="w-8 h-8 rounded bg-white mx-auto border border-slate-700 overflow-hidden">
                                       <img src={asset.imageUrl} className="w-full h-full object-contain" alt="device" />
                                    </div>
                                 ) : (
                                    <div className="w-8 h-8 rounded bg-slate-800 mx-auto flex items-center justify-center text-slate-600"><Camera className="w-4 h-4"/></div>
                                 )}
                              </td>

                              {/* Status */}
                              <td className="p-4">
                                 {isEditing ? (
                                    <select 
                                       className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white focus:border-cyan-500 outline-none cursor-pointer" 
                                       value={editFormData.status || 'ACTIVE'} 
                                       onChange={e => handleInputChange('status', e.target.value)}
                                    >
                                       <option value="ACTIVE">ใช้งานปกติ (Active)</option>
                                       <option value="SPARE">สำรอง (Spare)</option>
                                       <option value="BROKEN">ชำรุด (Broken)</option>
                                       <option value="SEND_CLAIM">ส่งเคลม (Claim)</option>
                                    </select>
                                 ) : (
                                    getStatusBadge(asset.status)
                                 )}
                              </td>

                              {/* Location */}
                              <td className="p-4">
                                 {isEditing ? (
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white focus:border-cyan-500 outline-none" value={editFormData.location} onChange={e => handleInputChange('location', e.target.value)} />
                                 ) : (
                                    <div className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[10px] border border-slate-700 inline-block">{asset.location}</div>
                                 )}
                              </td>

                              {/* Notes */}
                              <td className="p-4">
                                 {isEditing ? (
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white focus:border-cyan-500 outline-none" value={editFormData.notes} onChange={e => handleInputChange('notes', e.target.value)} placeholder="ระบุหมายเหตุ..." />
                                 ) : (
                                    <div className="text-slate-500 italic text-[10px] truncate max-w-[100px]">{asset.notes}</div>
                                 )}
                              </td>

                              {/* Action */}
                              <td className="p-4 text-center">
                                 {isEditing ? (
                                    <div className="flex justify-center gap-2">
                                       <button onClick={handleSaveEdit} className="p-1.5 bg-green-500/20 text-green-400 border border-green-500/50 rounded hover:bg-green-500 hover:text-white transition-all"><Save className="w-4 h-4"/></button>
                                       <button onClick={handleCancelEdit} className="p-1.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded hover:bg-red-500 hover:text-white transition-all"><X className="w-4 h-4"/></button>
                                    </div>
                                 ) : (
                                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button onClick={() => handleEditClick(asset)} className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-all">
                                          <PenLine className="w-4 h-4" />
                                       </button>
                                       <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all">
                                          <X className="w-4 h-4" />
                                       </button>
                                    </div>
                                 )}
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
