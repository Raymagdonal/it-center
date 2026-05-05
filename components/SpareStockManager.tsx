import React, { useState, useMemo } from 'react';
import { Package, Search, Activity, Box, Calendar, MapPin, Ship, Anchor, Building2, ArrowRight, Check, X, PlayCircle } from 'lucide-react';
import { ProcurementFolder, ProcurementFolderItem, ProcurementLocationType, BOAT_LOCATIONS, PIER_LOCATIONS, OFFICE_LOCATIONS, THAI_MONTHS } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';

interface SpareStockManagerProps {
    folders: ProcurementFolder[];
    onUpdate: (folders: ProcurementFolder[]) => void;
}

// Enriched item with location info
interface EnrichedSpareItem extends ProcurementFolderItem {
    folderId: string;
    locationName: string;
    locationType: 'BOAT' | 'PIER' | 'OFFICE';
    year: number;
    month: number;
}

export const SpareStockManager: React.FC<SpareStockManagerProps> = ({ folders, onUpdate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLocation, setFilterLocation] = useState<'ALL' | 'BOAT' | 'PIER' | 'OFFICE'>('ALL');

    // Activation Modal State
    const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
    const [activatingItem, setActivatingItem] = useState<EnrichedSpareItem | null>(null);
    const initialActivationForm = {
        locationType: 'BOAT' as ProcurementLocationType,
        locationName: '',
        quantity: 1,
        activationDate: new Date().toISOString().split('T')[0]
    };
    const [activationForm, setActivationForm] = useState(initialActivationForm);

    // Get all spare items from all folders
    const spareItems = useMemo(() => {
        const items: EnrichedSpareItem[] = [];

        folders.forEach(folder => {
            folder.items.forEach(item => {
                if (item.usageStatus === 'SPARE') {
                    items.push({
                        ...item,
                        folderId: folder.id,
                        locationName: folder.locationName,
                        locationType: folder.locationType,
                        year: folder.year,
                        month: folder.month
                    });
                }
            });
        });

        // Apply filters
        return items.filter(item => {
            const matchesSearch = searchTerm === '' ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.locationName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesLocation = filterLocation === 'ALL' || item.locationType === filterLocation;

            return matchesSearch && matchesLocation;
        });
    }, [folders, searchTerm, filterLocation]);

    // Group by location
    const groupedByLocation = useMemo(() => {
        const groups: Record<string, { items: EnrichedSpareItem[]; locationType: 'BOAT' | 'PIER' | 'OFFICE' }> = {};

        spareItems.forEach(item => {
            if (!groups[item.locationName]) {
                groups[item.locationName] = { items: [], locationType: item.locationType };
            }
            groups[item.locationName].items.push(item);
        });

        return Object.entries(groups).map(([location, data]) => ({
            location,
            locationType: data.locationType,
            items: data.items,
            totalQty: data.items.reduce((sum, i) => sum + i.quantity, 0)
        })).sort((a, b) => b.totalQty - a.totalQty);
    }, [spareItems]);

    // Get location options based on location type
    const getLocationOptions = (locationType: ProcurementLocationType) => {
        switch (locationType) {
            case 'BOAT': return [...BOAT_LOCATIONS];
            case 'PIER': return [...PIER_LOCATIONS];
            case 'OFFICE': return [...OFFICE_LOCATIONS];
        }
    };

    // Open activation modal
    const handleOpenActivationModal = (item: EnrichedSpareItem) => {
        setActivatingItem(item);
        setActivationForm({
            ...initialActivationForm,
            quantity: Math.min(1, item.quantity)
        });
        setIsActivationModalOpen(true);
    };

    // Handle activation submit
    const handleActivateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activatingItem) return;

        const { locationType, locationName, quantity, activationDate } = activationForm;
        if (!locationName) {
            alert('กรุณาเลือกสถานที่');
            return;
        }

        if (quantity > activatingItem.quantity) {
            alert(`จำนวนที่ต้องการใช้มากกว่าจำนวนสำรอง (มี ${activatingItem.quantity} ${activatingItem.unit})`);
            return;
        }

        // Get month from activation date
        const activationMonth = new Date(activationDate).getMonth();
        const activationYear = new Date(activationDate).getFullYear();

        // Create new item for target location with ACTIVE status
        const newItem: ProcurementFolderItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: activatingItem.name,
            imageUrl: activatingItem.imageUrl,
            serialNumber: activatingItem.serialNumber,
            quantity: quantity,
            unit: activatingItem.unit,
            purchaseDate: activatingItem.purchaseDate,
            startUseDate: activationDate,
            usageStatus: 'ACTIVE',
            notes: `นำมาจากสต๊อกสำรอง (${activatingItem.locationName}) เมื่อ ${activationDate}`
        };

        // Update folders
        let updatedFolders = [...folders];

        // 1. Find or create target folder
        let targetFolderIndex = updatedFolders.findIndex(
            f => f.year === activationYear && f.locationType === locationType && f.locationName === locationName && f.month === activationMonth
        );

        if (targetFolderIndex === -1) {
            // Create new folder
            const newFolder: ProcurementFolder = {
                id: Math.random().toString(36).substr(2, 9),
                name: `${locationName}_${THAI_MONTHS[activationMonth]}_${activationYear}`,
                locationType: locationType,
                locationName: locationName,
                year: activationYear,
                month: activationMonth,
                items: [newItem]
            };
            updatedFolders.push(newFolder);
        } else {
            // Add to existing folder
            updatedFolders[targetFolderIndex].items.push(newItem);
        }

        // 2. Update source item (reduce quantity or remove)
        const remainingQty = activatingItem.quantity - quantity;
        updatedFolders = updatedFolders.map(folder => {
            if (folder.id === activatingItem.folderId) {
                if (remainingQty <= 0) {
                    // Remove item completely
                    return {
                        ...folder,
                        items: folder.items.filter(i => i.id !== activatingItem.id)
                    };
                } else {
                    // Reduce quantity
                    return {
                        ...folder,
                        items: folder.items.map(i =>
                            i.id === activatingItem.id ? { ...i, quantity: remainingQty } : i
                        )
                    };
                }
            }
            return folder;
        });

        onUpdate(updatedFolders);
        setIsActivationModalOpen(false);
        setActivatingItem(null);
    };

    const getLocationIcon = (type: 'BOAT' | 'PIER' | 'OFFICE') => {
        switch (type) {
            case 'BOAT': return <Ship className="w-5 h-5" />;
            case 'PIER': return <Anchor className="w-5 h-5" />;
            case 'OFFICE': return <Building2 className="w-5 h-5" />;
        }
    };

    const getLocationColor = (type: 'BOAT' | 'PIER' | 'OFFICE') => {
        switch (type) {
            case 'BOAT': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
            case 'PIER': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            case 'OFFICE': return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white font-['Rajdhani'] uppercase tracking-wider flex items-center gap-3">
                        <Package className="h-8 w-8 text-slate-400" />
                        สต๊อกสำรอง
                    </h1>
                    <p className="text-slate-400 mt-1 font-mono text-[10px] uppercase tracking-widest">
                        อุปกรณ์สำรองจากการจัดซื้อ • พร้อมนำไปใช้งาน
                    </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                    <div className="bg-black border border-slate-800 rounded-lg px-4 py-2 text-center">
                        <div className="text-2xl font-bold text-slate-400 font-mono">{spareItems.length}</div>
                        <div className="text-[9px] text-slate-600 uppercase font-bold">รายการ</div>
                    </div>
                    <div className="bg-black border border-slate-800 rounded-lg px-4 py-2 text-center">
                        <div className="text-2xl font-bold text-slate-400 font-mono">
                            {spareItems.reduce((sum, i) => sum + i.quantity, 0)}
                        </div>
                        <div className="text-[9px] text-slate-600 uppercase font-bold">ชิ้น</div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-sm">
                <div className="relative w-full md:max-w-md group">
                    <input
                        type="text"
                        placeholder="ค้นหาอุปกรณ์สำรอง..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 focus:border-cyan-500 outline-none transition-all placeholder-slate-600"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400" />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-black rounded p-1 border border-slate-800">
                        <button
                            onClick={() => setFilterLocation('ALL')}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${filterLocation === 'ALL' ? 'bg-slate-500 text-white' : 'text-slate-500'}`}
                        >
                            ทั้งหมด
                        </button>
                        <button
                            onClick={() => setFilterLocation('BOAT')}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${filterLocation === 'BOAT' ? 'bg-blue-500 text-white' : 'text-slate-500'}`}
                        >
                            เรือ
                        </button>
                        <button
                            onClick={() => setFilterLocation('PIER')}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${filterLocation === 'PIER' ? 'bg-amber-500 text-black' : 'text-slate-500'}`}
                        >
                            ท่าเรือ
                        </button>
                        <button
                            onClick={() => setFilterLocation('OFFICE')}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${filterLocation === 'OFFICE' ? 'bg-slate-600 text-white' : 'text-slate-500'}`}
                        >
                            สำนักงาน
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {spareItems.length === 0 ? (
                <div className="text-center py-20">
                    <Package className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600">ไม่มีอุปกรณ์สำรอง</h3>
                    <p className="text-slate-700 text-sm mt-2">อุปกรณ์ที่มีสถานะ "สำรอง" จากหน้าจัดซื้อจะแสดงที่นี่</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {groupedByLocation.map(group => (
                        <Card key={group.location} className="border-slate-800 bg-slate-900/40">
                            <CardHeader className="pb-3 border-b border-slate-800/50 flex flex-row justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg border ${getLocationColor(group.locationType)}`}>
                                        {getLocationIcon(group.locationType)}
                                    </div>
                                    <div>
                                        <CardTitle className="text-white">{group.location}</CardTitle>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                            {group.items.length} รายการ • {group.totalQty} ชิ้น
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    {group.items.map(item => (
                                        <div
                                            key={item.id}
                                            className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/40 border border-slate-800 rounded-lg group hover:border-slate-600 transition-all gap-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Image */}
                                                <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                                                    ) : (
                                                        <Box className="w-6 h-6 text-slate-700" />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div>
                                                    <div className="text-sm font-bold text-white">{item.name}</div>
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        {item.serialNumber && (
                                                            <div className="text-[10px] font-mono text-cyan-500">
                                                                S/N: {item.serialNumber}
                                                            </div>
                                                        )}
                                                        <div className="text-[10px] text-slate-500">
                                                            {item.quantity} {item.unit}
                                                        </div>
                                                        <div className="text-[10px] text-slate-600 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {THAI_MONTHS[item.month]} {item.year}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="px-2 py-1 bg-slate-800 rounded text-[10px] font-bold text-slate-400 uppercase">
                                                    สำรอง
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleOpenActivationModal(item)}
                                                    className="bg-green-600 hover:bg-green-500 text-white shadow-none"
                                                >
                                                    <PlayCircle className="w-4 h-4 mr-1" />
                                                    ใช้งาน
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Activation Modal */}
            {isActivationModalOpen && activatingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md border-green-500/30">
                        <CardHeader className="flex flex-row justify-between items-center bg-green-900/20 border-b border-green-500/30">
                            <CardTitle className="text-green-400">นำอุปกรณ์ออกใช้งาน</CardTitle>
                            <button onClick={() => setIsActivationModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Item Preview */}
                            <div className="flex items-center gap-4 p-4 bg-black/40 rounded-lg border border-slate-800 mb-6">
                                <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                                    {activatingItem.imageUrl ? (
                                        <img src={activatingItem.imageUrl} className="w-full h-full object-cover" alt={activatingItem.name} />
                                    ) : (
                                        <Package className="w-6 h-6 text-slate-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="text-white font-bold">{activatingItem.name}</div>
                                    {activatingItem.serialNumber && (
                                        <div className="text-[10px] text-cyan-500 font-mono">S/N: {activatingItem.serialNumber}</div>
                                    )}
                                    <div className="text-xs text-amber-400 mt-1">
                                        คงเหลือ: <span className="font-bold">{activatingItem.quantity}</span> {activatingItem.unit}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleActivateSubmit} className="space-y-4">
                                {/* Target Location Type */}
                                <div>
                                    <label className="block text-[10px] font-bold text-green-500 uppercase mb-2">ประเภทสถานที่ปลายทาง</label>
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
                                                {getLocationIcon(type)}
                                                <span className="text-[9px] font-bold uppercase">
                                                    {type === 'BOAT' ? 'เรือ' : type === 'PIER' ? 'ท่าเรือ' : 'สำนักงาน'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Target Location Name */}
                                <div>
                                    <label className="block text-[10px] font-bold text-green-500 uppercase mb-2">ชื่อสถานที่ปลายทาง</label>
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
                                            max={activatingItem.quantity}
                                            required
                                            className="flex-1 bg-black border border-slate-700 rounded p-3 text-white focus:border-green-500 outline-none font-mono text-lg"
                                            value={activationForm.quantity}
                                            onChange={e => setActivationForm({ ...activationForm, quantity: parseInt(e.target.value) || 1 })}
                                        />
                                        <span className="text-slate-400">{activatingItem.unit}</span>
                                        <span className="text-[10px] text-slate-500">(มี {activatingItem.quantity} {activatingItem.unit})</span>
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
                                    <div className="text-[10px] text-slate-500 mt-1">
                                        * ข้อมูลจะถูกเพิ่มใน folder ของเดือน {THAI_MONTHS[new Date(activationForm.activationDate).getMonth()]} {new Date(activationForm.activationDate).getFullYear()}
                                    </div>
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
