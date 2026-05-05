import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { ProcurementFolderItem, PROCUREMENT_YEARS } from '../types';
import { Calendar, MapPin, ShoppingBag, Package, Activity, Clock, X, ZoomIn, ChevronLeft, ChevronRight, Ship, Anchor, Building2 } from 'lucide-react';
import { Button } from './ui/Button';

// Extended type with location info
export interface EnrichedProcurementItem extends ProcurementFolderItem {
    locationName?: string;
    locationType?: 'BOAT' | 'PIER' | 'OFFICE';
}

interface EquipmentSummaryProps {
    items: EnrichedProcurementItem[];
}

const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const getThaiMonthName = (monthIndex: number) => THAI_MONTHS[monthIndex];

// Helper to calculate days used
const calculateDaysUsed = (startDate?: string) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const EquipmentSummary: React.FC<EquipmentSummaryProps> = ({ items }) => {
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'BOAT' | 'PIER' | 'OFFICE'>('ALL');
    const [selectedItem, setSelectedItem] = useState<EnrichedProcurementItem | null>(null);

    // Generate Year Options
    // Use constant years
    const yearOptions = PROCUREMENT_YEARS;

    // Process Data - Group by purchase month
    const monthlyData = useMemo(() => {
        const data = Array(12).fill(null).map((_, index) => ({
            monthIndex: index,
            monthName: getThaiMonthName(index),
            items: [] as EnrichedProcurementItem[],
            totalQty: 0,
        }));

        items.forEach(item => {
            const date = new Date(item.purchaseDate);
            if (date.getFullYear() !== selectedYear) return;
            if (selectedCategory !== 'ALL' && item.locationType !== selectedCategory) return;

            const monthIndex = date.getMonth();
            data[monthIndex].items.push(item);
            data[monthIndex].totalQty += item.quantity;
        });

        return data;
    }, [items, selectedYear, selectedCategory]);

    // Flattened items for navigation
    const orderedItems = useMemo(() => {
        return monthlyData.flatMap(m => m.items);
    }, [monthlyData]);

    // Navigation Logic
    const handleNext = () => {
        if (!selectedItem) return;
        const currentIndex = orderedItems.findIndex(i => i.id === selectedItem.id);
        if (currentIndex < orderedItems.length - 1) {
            setSelectedItem(orderedItems[currentIndex + 1]);
        }
    };

    const handlePrev = () => {
        if (!selectedItem) return;
        const currentIndex = orderedItems.findIndex(i => i.id === selectedItem.id);
        if (currentIndex > 0) {
            setSelectedItem(orderedItems[currentIndex - 1]);
        }
    };

    // Calculate annual summary
    const annualStats = useMemo(() => {
        let totalItems = 0;
        let totalQty = 0;
        let activeCount = 0;
        let spareCount = 0;

        items.forEach(item => {
            const date = new Date(item.purchaseDate);
            if (date.getFullYear() !== selectedYear) return;
            if (selectedCategory !== 'ALL' && item.locationType !== selectedCategory) return;
            totalItems++;
            totalQty += item.quantity;
            if (item.usageStatus === 'ACTIVE') activeCount++;
            else spareCount++;
        });

        return { totalItems, totalQty, activeCount, spareCount };
    }, [items, selectedYear, selectedCategory]);

    // Location Summary
    const locationSummary = useMemo(() => {
        const summary: { [key: string]: { locationType: string; count: number; qty: number } } = {};

        items.forEach(item => {
            const date = new Date(item.purchaseDate);
            if (date.getFullYear() !== selectedYear) return;
            if (selectedCategory !== 'ALL' && item.locationType !== selectedCategory) return;

            const locationName = item.locationName || 'ไม่ระบุสถานที่';
            if (!summary[locationName]) {
                summary[locationName] = {
                    locationType: item.locationType || 'OFFICE',
                    count: 0,
                    qty: 0
                };
            }
            summary[locationName].count++;
            summary[locationName].qty += item.quantity;
        });

        return Object.entries(summary)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.qty - a.qty);
    }, [items, selectedYear, selectedCategory]);

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-cyan-500/20 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-3">
                        <ShoppingBag className="h-8 w-8 text-cyan-400" />
                        สรุปข้อมูลจัดซื้ออุปกรณ์
                    </h1>
                    <p className="text-slate-400 mt-1 font-mono text-xs uppercase tracking-widest">
                        ภาพรวมการจัดซื้ออุปกรณ์ประจำปี {selectedYear} (อ้างอิงจากวันที่ซื้อ)
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Category Filter */}
                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                        <button
                            onClick={() => setSelectedCategory('ALL')}
                            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${selectedCategory === 'ALL' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-400 hover:text-white'}`}
                        >
                            ทั้งหมด
                        </button>
                        <button
                            onClick={() => setSelectedCategory('BOAT')}
                            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${selectedCategory === 'BOAT' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Ship className="w-3 h-3" /> ในเรือ
                        </button>
                        <button
                            onClick={() => setSelectedCategory('PIER')}
                            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${selectedCategory === 'PIER' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Anchor className="w-3 h-3" /> บนท่า
                        </button>
                        <button
                            onClick={() => setSelectedCategory('OFFICE')}
                            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${selectedCategory === 'OFFICE' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Building2 className="w-3 h-3" /> สำนักงาน
                        </button>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-lg border border-slate-800 h-[42px]">
                        <span className="text-xs font-bold text-slate-500 uppercase">เลือกปี:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent border-none rounded px-3 py-1 text-sm text-cyan-400 font-bold outline-none cursor-pointer"
                        >
                            {yearOptions.map(y => <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Annual Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-500">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">รายการจัดซื้อ</p>
                            <h2 className="text-2xl font-bold text-white font-display">{annualStats.totalItems} <span className="text-sm text-slate-500 font-mono">รายการ</span></h2>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-500">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">จำนวนรวม</p>
                            <h2 className="text-2xl font-bold text-white font-display">{annualStats.totalQty} <span className="text-sm text-slate-500 font-mono">ชิ้น</span></h2>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-500/10 border border-green-500/30 text-green-500">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ใช้งาน (Active)</p>
                            <h2 className="text-2xl font-bold text-white font-display">{annualStats.activeCount}</h2>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">สำรอง (Spare)</p>
                            <h2 className="text-2xl font-bold text-white font-display">{annualStats.spareCount}</h2>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Location Summary */}
            {locationSummary.length > 0 && (
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardHeader className="pb-2 border-b border-slate-800/50 flex flex-row justify-between items-center">
                        <CardTitle className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-cyan-500" />
                            {selectedCategory === 'ALL' ? 'สรุปตามสถานที่ใช้งาน' : 
                             selectedCategory === 'BOAT' ? 'สรุปข้อมูลรายเรือ' : 
                             selectedCategory === 'PIER' ? 'สรุปข้อมูลรายท่าเรือ' : 'สรุปข้อมูลสำนักงาน'}
                        </CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-[10px] text-slate-500 uppercase">สถานที่</div>
                                <div className="text-lg font-bold text-cyan-400 font-mono">{locationSummary.length}</div>
                            </div>
                            <div className="text-right border-l border-slate-700 pl-4">
                                <div className="text-[10px] text-slate-500 uppercase">รวม</div>
                                <div className="text-lg font-bold text-white font-mono">{locationSummary.reduce((sum, loc) => sum + loc.qty, 0)} <span className="text-xs text-slate-500">ชิ้น</span></div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {locationSummary.map((loc) => (
                                <div
                                    key={loc.name}
                                    className="bg-black/40 rounded-lg p-3 border border-slate-800 hover:border-cyan-500/30 transition-colors flex items-center gap-3"
                                >
                                    <div className={`p-2 rounded-lg border ${loc.locationType === 'BOAT'
                                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                        : loc.locationType === 'PIER'
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                            : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
                                        }`}>
                                        {loc.locationType === 'BOAT' ? <Ship className="w-4 h-4" /> :
                                            loc.locationType === 'PIER' ? <Anchor className="w-4 h-4" /> :
                                                <Building2 className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-white truncate">{loc.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                            {loc.count} รายการ
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-cyan-400 font-mono">{loc.qty}</div>
                                        <div className="text-[9px] text-slate-500 uppercase">ชิ้น</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Monthly Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {monthlyData.map((month) => {
                    const hasItems = month.items.length > 0;

                    return (
                        <Card
                            key={month.monthIndex}
                            className={`border-slate-800 transition-all ${hasItems ? 'bg-slate-900/60 hover:border-cyan-500/30' : 'bg-slate-950/30 opacity-60'}`}
                        >
                            <CardHeader className="pb-3 border-b border-slate-800/50 flex flex-row justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Calendar className={`w-4 h-4 ${hasItems ? 'text-cyan-500' : 'text-slate-600'}`} />
                                    <span className={`font-bold uppercase tracking-widest ${hasItems ? 'text-white' : 'text-slate-500'}`}>
                                        {month.monthName}
                                    </span>
                                </div>
                                {hasItems && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-cyan-400">{month.items.length} รายการ</span>
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="p-4 space-y-3 min-h-[160px] max-h-[300px] overflow-y-auto custom-scrollbar">
                                {!hasItems ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-2 min-h-[120px]">
                                        <ShoppingBag className="w-8 h-8 opacity-20" />
                                        <span className="text-[10px] uppercase font-mono">ไม่มีการจัดซื้อ</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {month.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="bg-black/40 rounded p-3 border border-slate-800 space-y-2 group hover:border-cyan-500/50 cursor-pointer transition-all hover:bg-cyan-950/20"
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} className="w-10 h-10 rounded object-cover border border-slate-700 group-hover:border-cyan-500/50 transition-colors" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                                                                <Package className="w-5 h-5 text-slate-600 group-hover:text-cyan-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-slate-200 font-bold text-sm block group-hover:text-cyan-400 transition-colors">{item.name}</span>
                                                            {item.serialNumber && <span className="text-[9px] text-cyan-500 font-mono">S/N: {item.serialNumber}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="bg-cyan-950/30 text-cyan-400 px-2 py-0.5 rounded font-mono font-bold text-[10px] border border-cyan-500/20">
                                                        x{item.quantity}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 text-[9px]">
                                                    {/* Location is not directly on item anymore, unless passed or we omit it for now */}
                                                    {/* item.location doesn't exist on ProcurementFolderItem by default, checking... */}
                                                    {/* Actually I will remove location display for now or check if it can be inferred. 
                                                        For simplicity, I will remove the location display here as the item type changed 
                                                        and location is on the folder level. */}
                                                    {/* But wait, I might need to format the items before passing to include location? 
                                                        Let's just remove it for now to avoid errors. */}
                                                    {/* Re-reading the plan: "Flatten folders to get all items". 
                                                        I should probably assume location is lost unless I extend the type locally.
                                                        Let's keep it simple and comment out location for now or use optional chaining safely if I decided to extend it later.
                                                    */}
                                                    {/* Error: Property 'location' does not exist on type 'ProcurementFolderItem' */}
                                                    {/* I will remove this block */}
                                                    {item.usageStatus === 'ACTIVE' ? (
                                                        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded uppercase font-bold">ใช้งาน</span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 bg-slate-700/50 text-slate-400 border border-slate-600 rounded uppercase font-bold">สำรอง</span>
                                                    )}
                                                    {item.startUseDate && (
                                                        <span className="flex items-center gap-1 text-amber-500 font-mono">
                                                            <Clock className="w-3 h-3" /> {calculateDaysUsed(item.startUseDate)} วัน
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Item Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-cyan-500/30 rounded-xl max-w-3xl w-full shadow-[0_0_50px_rgba(0,242,255,0.15)] relative overflow-hidden flex flex-col">
                        {/* Header Background Effect */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none"></div>

                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-black/40 hover:bg-red-500/20 hover:border-red-500/50 p-2 rounded-full border border-slate-700 transition-all z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8 relative flex-1">
                            <div className="flex flex-col md:flex-row gap-8 h-full">
                                {/* Image Section */}
                                <div className="w-full md:w-1/2 flex items-center justify-center bg-black/50 rounded-lg p-2 relative group">

                                    <div className="aspect-square w-full rounded overflow-hidden relative">
                                        {selectedItem.imageUrl ? (
                                            <img src={selectedItem.imageUrl} className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-3 bg-slate-900/50">
                                                <Package className="w-16 h-16 opacity-30" />
                                                <span className="text-xs uppercase font-bold tracking-widest opacity-50">No Image</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation Buttons (Image Overlay) */}
                                    <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                            disabled={orderedItems.findIndex(i => i.id === selectedItem.id) === 0}
                                            className="pointer-events-auto p-2 rounded-full bg-black/60 text-white hover:bg-cyan-500 hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-black/60 disabled:hover:text-white transform active:scale-95"
                                        >
                                            <ChevronLeft className="w-8 h-8" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                            disabled={orderedItems.findIndex(i => i.id === selectedItem.id) === orderedItems.length - 1}
                                            className="pointer-events-auto p-2 rounded-full bg-black/60 text-white hover:bg-cyan-500 hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-black/60 disabled:hover:text-white transform active:scale-95"
                                        >
                                            <ChevronRight className="w-8 h-8" />
                                        </button>
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div className="w-full md:w-1/2 space-y-6 flex flex-col justify-center">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div className="text-xs font-mono text-cyan-500 mb-1 uppercase tracking-widest">IT Equipment</div>
                                            <div className="text-[10px] text-slate-500 font-mono">
                                                {orderedItems.findIndex(i => i.id === selectedItem.id) + 1} / {orderedItems.length}
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-bold text-white font-display leading-tight">{selectedItem.name}</h2>
                                        {selectedItem.serialNumber && (
                                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-black rounded border border-slate-800">
                                                <span className="text-[10px] text-slate-500 uppercase font-bold">Serial No.</span>
                                                <span className="text-sm font-mono text-cyan-400">{selectedItem.serialNumber}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-950/50 p-3 rounded border border-slate-800/50">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status</div>
                                            {selectedItem.usageStatus === 'ACTIVE' ? (
                                                <div className="flex items-center gap-2 text-green-400 font-bold uppercase text-sm">
                                                    <Activity className="w-4 h-4" /> ใช้งาน (Active)
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-sm">
                                                    <Package className="w-4 h-4" /> สำรอง (Spare)
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-slate-950/50 p-3 rounded border border-slate-800/50">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Location</div>
                                            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                                                <MapPin className="w-4 h-4" /> {selectedItem.locationName || 'ไม่ระบุ'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-slate-800">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400">วันที่จัดซื้อ (Purchased):</span>
                                            <span className="font-mono text-white">{selectedItem.purchaseDate}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400">วันที่เริ่มใช้ (Start Use):</span>
                                            <span className="font-mono text-white">{selectedItem.startUseDate || '-'}</span>
                                        </div>
                                        {selectedItem.startUseDate && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">ระยะเวลาใช้งาน (Duration):</span>
                                                <span className="font-mono text-amber-500 font-bold">{calculateDaysUsed(selectedItem.startUseDate)} days</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation Buttons (Bottom - Mobile Friendly) */}
                                    <div className="flex md:hidden gap-4 mt-4">
                                        <Button variant="outline" onClick={handlePrev} disabled={orderedItems.findIndex(i => i.id === selectedItem.id) === 0} className="flex-1">
                                            <ChevronLeft className="w-4 h-4 mr-2" /> Prev
                                        </Button>
                                        <Button variant="outline" onClick={handleNext} disabled={orderedItems.findIndex(i => i.id === selectedItem.id) === orderedItems.length - 1} className="flex-1">
                                            Next <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
