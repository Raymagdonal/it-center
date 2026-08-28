import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { ProcurementFolderItem, ProcurementFolder, PROCUREMENT_YEARS } from '../types';
import {
    Calendar, MapPin, ShoppingBag, Package, Activity, Clock, X, ZoomIn, ZoomOut,
    ChevronLeft, ChevronRight, Ship, Anchor, Building2, Boxes, ChevronDown,
    RotateCw, RefreshCw, Layers
} from 'lucide-react';
import { Button } from './ui/Button';

// Extended type with location info
export interface EnrichedProcurementItem extends ProcurementFolderItem {
    locationName?: string;
    locationType?: 'BOAT' | 'PIER' | 'OFFICE';
}

interface EquipmentSummaryProps {
    items?: EnrichedProcurementItem[];
    folders?: ProcurementFolder[];
    onNavigate?: (mode: any) => void;
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

export const EquipmentSummary: React.FC<EquipmentSummaryProps> = ({ items = [], folders = [] }) => {
    const [selectedYear, setSelectedYear] = useState<number>(2026);
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'BOAT' | 'PIER' | 'OFFICE'>('ALL');
    const [selectedItem, setSelectedItem] = useState<EnrichedProcurementItem | null>(null);

    // Expand state for Sets
    const [expandedSetIds, setExpandedSetIds] = useState<Set<string>>(new Set());

    const toggleSetExpand = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setExpandedSetIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Lightbox & Zoom State
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [lightboxTitle, setLightboxTitle] = useState<string | null>(null);
    const [zoomScale, setZoomScale] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);

    const resetZoom = () => {
        setZoomScale(1);
        setPanOffset({ x: 0, y: 0 });
        setRotation(0);
        setIsPanning(false);
    };

    const openLightbox = (url: string, title?: string) => {
        setLightboxImage(url);
        setLightboxTitle(title || null);
        resetZoom();
    };

    const closeLightbox = () => {
        setLightboxImage(null);
        setLightboxTitle(null);
        resetZoom();
    };

    const handleZoomIn = () => {
        setZoomScale(prev => Math.min(6, Number((prev + 0.5).toFixed(1))));
    };

    const handleZoomOut = () => {
        setZoomScale(prev => {
            const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
            if (next === 1) setPanOffset({ x: 0, y: 0 });
            return next;
        });
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        if (e.deltaY < 0) {
            setZoomScale(prev => Math.min(6, Number((prev + 0.25).toFixed(2))));
        } else {
            setZoomScale(prev => {
                const next = Math.max(1, Number((prev - 0.25).toFixed(2)));
                if (next === 1) setPanOffset({ x: 0, y: 0 });
                return next;
            });
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomScale > 1) {
            e.preventDefault();
            setIsPanning(true);
            setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning && zoomScale > 1) {
            e.preventDefault();
            setPanOffset({
                x: e.clientX - startPan.x,
                y: e.clientY - startPan.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleDoubleClick = () => {
        if (zoomScale > 1) {
            resetZoom();
        } else {
            setZoomScale(2.5);
        }
    };

    // Keyboard shortcuts for Lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxImage) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === '+' || e.key === '=') handleZoomIn();
            if (e.key === '-' || e.key === '_') handleZoomOut();
            if (e.key === '0' || e.key === 'r' || e.key === 'R') resetZoom();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxImage]);

    // Generate Year Options
    const yearOptions = PROCUREMENT_YEARS;

    // Flatten all items from folders or use items directly
    const allItems = useMemo<EnrichedProcurementItem[]>(() => {
        if (Array.isArray(items) && items.length > 0) return items;
        if (Array.isArray(folders) && folders.length > 0) {
            return folders.flatMap(folder => {
                const folderItems = folder.items || [];
                return folderItems.map(item => {
                    const fallbackMonth = typeof folder.month === 'number' ? folder.month + 1 : 1;
                    const fallbackDate = `${folder.year || 2026}-${String(fallbackMonth).padStart(2, '0')}-01`;
                    return {
                        ...item,
                        locationName: folder.locationName,
                        locationType: folder.locationType,
                        purchaseDate: item.purchaseDate || fallbackDate
                    };
                });
            });
        }
        return [];
    }, [items, folders]);

    // Process Data - Group by purchase month
    const monthlyData = useMemo(() => {
        const data = Array(12).fill(null).map((_, index) => ({
            monthIndex: index,
            monthName: getThaiMonthName(index),
            items: [] as EnrichedProcurementItem[],
            totalQty: 0,
        }));

        allItems.forEach(item => {
            const date = item.purchaseDate ? new Date(item.purchaseDate) : null;
            const itemYear = date && !isNaN(date.getTime()) ? date.getFullYear() : selectedYear;
            if (itemYear !== selectedYear) return;
            if (selectedCategory !== 'ALL' && item.locationType !== selectedCategory) return;

            const monthIndex = date && !isNaN(date.getTime()) ? date.getMonth() : 0;
            if (monthIndex >= 0 && monthIndex < 12) {
                data[monthIndex].items.push(item);
                data[monthIndex].totalQty += (item.quantity || 1);
            }
        });

        return data;
    }, [allItems, selectedYear, selectedCategory]);

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

        allItems.forEach(item => {
            const date = item.purchaseDate ? new Date(item.purchaseDate) : null;
            const itemYear = date && !isNaN(date.getTime()) ? date.getFullYear() : selectedYear;
            if (itemYear !== selectedYear) return;
            if (selectedCategory !== 'ALL' && item.locationType !== selectedCategory) return;
            totalItems++;
            totalQty += (item.quantity || 1);
            if (item.usageStatus === 'ACTIVE') activeCount++;
            else spareCount++;
        });

        return { totalItems, totalQty, activeCount, spareCount };
    }, [allItems, selectedYear, selectedCategory]);

    // Location Summary
    const locationSummary = useMemo(() => {
        const summary: { [key: string]: { locationType: string; count: number; qty: number } } = {};

        allItems.forEach(item => {
            const date = item.purchaseDate ? new Date(item.purchaseDate) : null;
            const itemYear = date && !isNaN(date.getTime()) ? date.getFullYear() : selectedYear;
            if (itemYear !== selectedYear) return;
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
            summary[locationName].qty += (item.quantity || 1);
        });

        return Object.entries(summary)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.qty - a.qty);
    }, [allItems, selectedYear, selectedCategory]);

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
                            <CardContent className="p-4 space-y-3 min-h-[160px] max-h-[420px] overflow-y-auto custom-scrollbar">
                                {!hasItems ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-2 min-h-[120px]">
                                        <ShoppingBag className="w-8 h-8 opacity-20" />
                                        <span className="text-[10px] uppercase font-mono">ไม่มีการจัดซื้อ</span>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {month.items.map((item) => {
                                            const isSet = Boolean(item.isSet || (item.subItems && item.subItems.length > 0));
                                            const isExpanded = expandedSetIds.has(item.id);
                                            const itemSNs = item.serialNumbers && item.serialNumbers.length > 0
                                                ? item.serialNumbers
                                                : (item.serialNumber ? item.serialNumber.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : []);

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`rounded-lg p-3 border transition-all cursor-pointer ${
                                                        isSet && isExpanded
                                                            ? 'bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_15px_rgba(0,242,255,0.15)]'
                                                            : 'bg-black/40 border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/10'
                                                    }`}
                                                    onClick={() => setSelectedItem(item)}
                                                >
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            {item.imageUrl ? (
                                                                <img
                                                                    src={item.imageUrl}
                                                                    className="w-11 h-11 rounded-lg object-cover border border-slate-700 hover:border-cyan-400 transition-colors shrink-0 cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openLightbox(item.imageUrl!, item.name);
                                                                    }}
                                                                    alt={item.name}
                                                                />
                                                            ) : (
                                                                <div className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                                                    {isSet ? <Boxes className="w-5 h-5 text-cyan-400" /> : <Package className="w-5 h-5 text-slate-500" />}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-slate-100 font-bold text-sm block group-hover:text-cyan-400 transition-colors truncate">
                                                                        {item.name}
                                                                    </span>
                                                                    {isSet && (
                                                                        <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold uppercase rounded flex items-center gap-1 font-mono shrink-0">
                                                                            <Boxes className="w-2.5 h-2.5 text-cyan-400" /> ชุดอุปกรณ์ ({item.subItems?.length || 0} ชิ้น)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {!isSet && item.serialNumber && (
                                                                    <span className="text-[9px] text-cyan-400 font-mono block truncate">
                                                                        S/N: {item.serialNumber}
                                                                    </span>
                                                                )}
                                                                {item.locationName && (
                                                                    <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                                                        <MapPin className="w-2.5 h-2.5 text-cyan-500" /> {item.locationName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="bg-cyan-950/40 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold text-[10px] border border-cyan-500/30 shrink-0">
                                                            x{item.quantity} {item.unit || (isSet ? 'ชุด' : 'ชิ้น')}
                                                        </div>
                                                    </div>

                                                    {/* Set Toggle Button */}
                                                    {isSet && (
                                                        <div className="pt-2">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => toggleSetExpand(item.id, e)}
                                                                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1.5 px-3 py-1.5 bg-black/80 rounded-lg border border-cyan-900/60 hover:border-cyan-500/60 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(0,242,255,0.2)]"
                                                            >
                                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-cyan-300' : ''}`} />
                                                                <span>{isExpanded ? 'ซ่อนรายการในชุด' : `ดูรายการในชุด (${item.subItems?.length || 0})`}</span>
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Expanded Sub-items Grid */}
                                                    {isSet && isExpanded && (
                                                        <div
                                                            className="mt-2.5 p-3 bg-slate-950/95 rounded-lg border border-cyan-500/40 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 font-bold uppercase border-b border-slate-800 pb-1.5">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                                                                    รายการในชุด: {item.name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-500 font-mono">รวม {item.subItems?.length || 0} รายการ</span>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-2">
                                                                {item.subItems?.map((sub, sIdx) => {
                                                                    const subSNs = sub.serialNumbers && sub.serialNumbers.length > 0
                                                                        ? sub.serialNumbers
                                                                        : (sub.serialNumber ? sub.serialNumber.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : []);

                                                                    return (
                                                                        <div key={sub.id || sIdx} className="p-2.5 bg-black/70 rounded-lg border border-slate-800 flex items-start gap-2.5 hover:border-slate-700 transition-colors">
                                                                            {/* Thumbnail */}
                                                                            <div className="w-10 h-10 bg-slate-900 rounded border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                                                                                {sub.imageUrl ? (
                                                                                    <img
                                                                                        src={sub.imageUrl}
                                                                                        className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-200"
                                                                                        onClick={() => openLightbox(sub.imageUrl!, `${item.name} - ${sub.name}`)}
                                                                                        alt={sub.name}
                                                                                    />
                                                                                ) : (
                                                                                    <Package className="w-4 h-4 text-slate-600" />
                                                                                )}
                                                                            </div>

                                                                            {/* Info */}
                                                                            <div className="flex-1 min-w-0 space-y-1">
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <span className="font-bold text-xs text-slate-200 truncate">{sub.name}</span>
                                                                                    <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-900/40 shrink-0">
                                                                                        {sub.quantity} {sub.unit || 'ชิ้น'}
                                                                                    </span>
                                                                                </div>

                                                                                {/* S/N list */}
                                                                                {subSNs.length > 0 && (
                                                                                    <div className="flex flex-wrap gap-1">
                                                                                        {subSNs.map((sn, snIdx) => (
                                                                                            <span key={snIdx} className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-[9px] font-mono text-cyan-300 rounded">
                                                                                                {subSNs.length > 1 ? `#${snIdx + 1}: ` : 'S/N: '}{sn}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {item.notes && (
                                                                <div className="text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/60 bg-black/40 p-2 rounded">
                                                                    <span className="text-cyan-500 font-bold">หมายเหตุชุด:</span> {item.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Usage Status & Duration */}
                                                    <div className="flex flex-wrap items-center gap-2 text-[9px] pt-1">
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
                                                        {item.supplier && (
                                                            <span className="text-slate-500 font-mono">
                                                                จาก: {item.supplier}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                    <div className="bg-slate-900 border border-cyan-500/30 rounded-xl max-w-3xl w-full max-h-[90vh] shadow-[0_0_50px_rgba(0,242,255,0.15)] relative overflow-hidden flex flex-col">
                        {/* Header Background Effect */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none"></div>

                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-black/40 hover:bg-red-500/20 hover:border-red-500/50 p-2 rounded-full border border-slate-700 transition-all z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 md:p-8 relative flex-1 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Image Section */}
                                <div className="w-full md:w-1/2 flex items-center justify-center bg-black/50 rounded-lg p-2 relative group">
                                    <div className="aspect-square w-full rounded overflow-hidden relative">
                                        {selectedItem.imageUrl ? (
                                            <img
                                                src={selectedItem.imageUrl}
                                                className="w-full h-full object-contain cursor-pointer"
                                                onClick={() => openLightbox(selectedItem.imageUrl!, selectedItem.name)}
                                                alt={selectedItem.name}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-3 bg-slate-900/50">
                                                {selectedItem.isSet ? <Boxes className="w-16 h-16 opacity-30 text-cyan-400" /> : <Package className="w-16 h-16 opacity-30" />}
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
                                <div className="w-full md:w-1/2 space-y-5 flex flex-col justify-center">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div className="text-xs font-mono text-cyan-500 mb-1 uppercase tracking-widest">
                                                {selectedItem.isSet ? 'IT Equipment Set' : 'IT Equipment'}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono">
                                                {orderedItems.findIndex(i => i.id === selectedItem.id) + 1} / {orderedItems.length}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-bold text-white font-display leading-tight">{selectedItem.name}</h2>
                                            {selectedItem.isSet && (
                                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold uppercase rounded font-mono">
                                                    ชุด ({selectedItem.subItems?.length || 0} ชิ้น)
                                                </span>
                                            )}
                                        </div>
                                        {selectedItem.serialNumber && !selectedItem.isSet && (
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

                                    <div className="space-y-3 pt-3 border-t border-slate-800 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">วันที่จัดซื้อ (Purchased):</span>
                                            <span className="font-mono text-white">{selectedItem.purchaseDate}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">จำนวน (Quantity):</span>
                                            <span className="font-mono text-cyan-400 font-bold">{selectedItem.quantity} {selectedItem.unit || (selectedItem.isSet ? 'ชุด' : 'ชิ้น')}</span>
                                        </div>
                                        {selectedItem.supplier && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400">ผู้จัดจำหน่าย (Supplier):</span>
                                                <span className="font-mono text-white">{selectedItem.supplier}</span>
                                            </div>
                                        )}
                                        {selectedItem.startUseDate && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400">ระยะเวลาใช้งาน (Duration):</span>
                                                <span className="font-mono text-amber-500 font-bold">{calculateDaysUsed(selectedItem.startUseDate)} วัน</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sub-items list in Detail Modal for Sets */}
                            {selectedItem.isSet && selectedItem.subItems && selectedItem.subItems.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold uppercase">
                                        <span className="flex items-center gap-2">
                                            <Boxes className="w-4 h-4 text-cyan-400" />
                                            รายการอุปกรณ์ย่อยในชุด: {selectedItem.name}
                                        </span>
                                        <span className="text-slate-500 text-[10px] font-mono">รวม {selectedItem.subItems.length} รายการ</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                        {selectedItem.subItems.map((sub, sIdx) => {
                                            const subSNs = sub.serialNumbers && sub.serialNumbers.length > 0
                                                ? sub.serialNumbers
                                                : (sub.serialNumber ? sub.serialNumber.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : []);

                                            return (
                                                <div key={sub.id || sIdx} className="p-3 bg-black/60 rounded-lg border border-slate-800 flex items-start gap-3 hover:border-slate-700 transition-colors">
                                                    <div className="w-12 h-12 bg-slate-900 rounded border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                                                        {sub.imageUrl ? (
                                                            <img
                                                                src={sub.imageUrl}
                                                                className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                                                                onClick={() => openLightbox(sub.imageUrl!, `${selectedItem.name} - ${sub.name}`)}
                                                                alt={sub.name}
                                                            />
                                                        ) : (
                                                            <Package className="w-5 h-5 text-slate-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <span className="font-bold text-xs text-white truncate">{sub.name}</span>
                                                            <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-900/40 shrink-0">
                                                                {sub.quantity} {sub.unit || 'ชิ้น'}
                                                            </span>
                                                        </div>
                                                        {subSNs.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {subSNs.map((sn, snIdx) => (
                                                                    <span key={snIdx} className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-[9px] font-mono text-cyan-300 rounded">
                                                                        {subSNs.length > 1 ? `#${snIdx + 1}: ` : 'S/N: '}{sn}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ════ LIGHTBOX IMAGE VIEWER MODAL ════ */}
            {lightboxImage && (
                <div
                    onClick={closeLightbox}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none overflow-hidden"
                >
                    {/* Top Bar */}
                    <div className="w-full flex items-center justify-between z-20 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                            {lightboxTitle && (
                                <div className="px-4 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs md:text-sm font-mono font-bold shadow-lg max-w-md truncate">
                                    {lightboxTitle}
                                </div>
                            )}
                            {zoomScale > 1 && (
                                <div className="px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 font-mono text-xs font-bold animate-pulse">
                                    ซูม {(zoomScale * 100).toFixed(0)}% (คลิกลากเพื่อเลื่อนดู S/N)
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={closeLightbox}
                            className="p-2.5 rounded-full bg-slate-800/90 hover:bg-red-600 text-white transition-all shadow-lg hover:scale-105 cursor-pointer"
                            title="ปิด (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Image Container with Zoom & Pan */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onDoubleClick={handleDoubleClick}
                        className="flex-1 w-full flex items-center justify-center overflow-hidden my-2 cursor-default relative"
                        style={{
                            cursor: zoomScale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in'
                        }}
                    >
                        <div
                            className="transition-transform duration-100 ease-out will-change-transform flex items-center justify-center"
                            style={{
                                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale}) rotate(${rotation}deg)`
                            }}
                        >
                            <img
                                src={lightboxImage}
                                alt={lightboxTitle || "Equipment"}
                                className="max-w-[85vw] max-h-[70vh] object-contain rounded-lg shadow-2xl border border-slate-800 pointer-events-none select-none"
                                draggable={false}
                            />
                        </div>
                    </div>

                    {/* Bottom Floating Toolbar */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="z-20 pointer-events-auto flex flex-col items-center gap-2"
                    >
                        <div className="bg-slate-950/90 border border-cyan-500/50 rounded-2xl px-4 py-2 backdrop-blur-xl shadow-[0_0_30px_rgba(0,242,255,0.3)] flex items-center gap-2 md:gap-3">
                            <button
                                type="button"
                                onClick={handleZoomOut}
                                disabled={zoomScale <= 1}
                                className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 disabled:opacity-30 transition-all cursor-pointer"
                                title="ซูมออก (-)"
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>

                            <button
                                type="button"
                                onClick={resetZoom}
                                className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold hover:bg-cyan-900 transition-all cursor-pointer min-w-[70px] text-center"
                                title="คลิกเพื่อรีเซ็ตขนาด 100%"
                            >
                                {(zoomScale * 100).toFixed(0)}%
                            </button>

                            <button
                                type="button"
                                onClick={handleZoomIn}
                                disabled={zoomScale >= 6}
                                className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 disabled:opacity-30 transition-all cursor-pointer"
                                title="ซูมเข้า (+)"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>

                            <div className="h-5 w-[1px] bg-slate-800" />

                            <button
                                type="button"
                                onClick={handleRotate}
                                className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
                                title="หมุนภาพ 90°"
                            >
                                <RotateCw className="w-5 h-5" />
                            </button>

                            <button
                                type="button"
                                onClick={resetZoom}
                                className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
                                title="รีเซ็ตตำแหน่งและขนาดเดิม"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-[11px] font-mono text-slate-400 tracking-wide text-center">
                            💡 เลื่อนลูกกลิ้งเมาส์เพื่อซูม • ดับเบิ้ลคลิกเพื่อซูมด่วน • ลากเมาส์เพื่อเลื่อนดู S/N
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
};
