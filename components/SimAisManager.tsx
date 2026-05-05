import React, { useState } from 'react';
import { SimCard } from '../types';
import { Search, Edit, Plus, Check, X, Smartphone, Signal, Calendar, MapPin, Hash, FileText, SmartphoneNfc, Tag, Phone, ArrowUpDown, ChevronUp, ChevronDown, ArrowUp, ArrowDown, Mail, Store } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface SimAisManagerProps {
    items: SimCard[];
    onUpdate: (items: SimCard[]) => void;
}

export const SimAisManager: React.FC<SimAisManagerProps> = ({ items, onUpdate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<SimCard | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof SimCard | null, direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc'
    });

    // Form State
    const [formData, setFormData] = useState<Partial<SimCard>>({});

    const filteredItems = React.useMemo(() => {
        return items.filter(item => {
            const phone = item.phoneNumber || (item as any).serialNumber || '';
            const loc = item.location || '';
            const notes = item.notes || '';
            const email = item.email || '';
            const kshop = item.kShopName || '';
            return phone.includes(searchTerm) ||
                loc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                kshop.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [items, searchTerm]);

    const sortedItems = React.useMemo(() => {
        const result = [...filteredItems];
        if (sortConfig.key) {
            result.sort((a, b) => {
                const aVal = (a[sortConfig.key!] || '').toString();
                const bVal = (b[sortConfig.key!] || '').toString();
                
                // Use numeric sort for phone numbers or strings that look like numbers
                const comparison = aVal.localeCompare(bVal, undefined, { 
                    numeric: true, 
                    sensitivity: 'base' 
                });
                
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }
        return result;
    }, [filteredItems, sortConfig]);

    const requestSort = (key: keyof SimCard) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof SimCard }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-green-400" /> : <ChevronDown className="w-3 h-3 text-green-400" />;
    };

    const handleMove = (id: string, direction: 'up' | 'down') => {
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return;

        const newItems = [...items];
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];

        // Clear sort to show manual order
        setSortConfig({ key: null, direction: 'asc' });
        onUpdate(newItems);
    };

    const handleEdit = (item: SimCard) => {
        setEditingItem(item);
        setFormData({ ...item });
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setFormData({
            id: Math.random().toString(36).substr(2, 9),
            deviceName: 'SIM AIS',
            promotion: '129 ฿',
            status: 'ACTIVE',
            provider: 'AIS'
        });
        setIsAdding(true);
    };

    const handleSave = () => {
        if (editingItem) {
            // Update existing
            const updated = items.map(item => item.id === editingItem.id ? { ...item, ...formData } as SimCard : item);
            onUpdate(updated);
        } else {
            // Add new
            onUpdate([formData as SimCard, ...items]);
        }
        setEditingItem(null);
        setIsAdding(false);
        setFormData({});
    };

    const handleDelete = (id: string) => {
        if (window.confirm('ยืนยันการลบข้อมูล?')) {
            onUpdate(items.filter(i => i.id !== id));
            setEditingItem(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-slate-900/50 backdrop-blur-xl border border-green-500/20 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-green-500/5 animate-pulse-slow"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-black border-2 border-green-500/30 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                        <Signal className="w-10 h-10 text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white font-display tracking-wider mb-1">SIM AIS MANAGER</h1>
                        <p className="text-slate-400 font-mono text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            TOTAL ACTIVE SIMS: {items.length}
                        </p>
                    </div>
                </div>
                <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-500 text-white border-none shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                    <Plus className="w-4 h-4 mr-2" /> REGISTER NEW SIM
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="ค้นหา เบอร์โทรศัพท์, สถานที่, หรือ Note..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all font-mono"
                    />
                </div>
            </div>

            {/* Table */}
            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700 bg-black/40 text-slate-400 text-xs uppercase tracking-wider font-mono whitespace-nowrap">
                                <th className="p-4 font-bold w-24 text-center">MOVE</th>
                                <th className="p-4 font-bold w-16 text-center">#</th>
                                <th 
                                    className="p-4 font-bold cursor-pointer hover:text-white transition-colors group/h"
                                    onClick={() => requestSort('kShopName')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Store className="w-4 h-4" /> K-Shop
                                        <SortIcon columnKey="kShopName" />
                                    </div>
                                </th>
                                <th 
                                    className="p-4 font-bold cursor-pointer hover:text-white transition-colors group/h"
                                    onClick={() => requestSort('email')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" /> Email
                                        <SortIcon columnKey="email" />
                                    </div>
                                </th>
                                <th 
                                    className="p-4 font-bold cursor-pointer hover:text-white transition-colors group/h"
                                    onClick={() => requestSort('phoneNumber')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" /> เบอร์โทรศัพท์
                                        <SortIcon columnKey="phoneNumber" />
                                    </div>
                                </th>
                                <th 
                                    className="p-4 font-bold cursor-pointer hover:text-white transition-colors group/h"
                                    onClick={() => requestSort('promotion')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4" /> โปรโมชั่น
                                        <SortIcon columnKey="promotion" />
                                    </div>
                                </th>
                                <th 
                                    className="p-4 font-bold cursor-pointer hover:text-white transition-colors group/h"
                                    onClick={() => requestSort('deviceName')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-4 h-4" /> ชื่ออุปกรณ์
                                        <SortIcon columnKey="deviceName" />
                                    </div>
                                </th>
                                <th 
                                    className="p-4 font-bold cursor-pointer hover:text-white transition-colors group/h"
                                    onClick={() => requestSort('location')}
                                >
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> สถานที่
                                        <SortIcon columnKey="location" />
                                    </div>
                                </th>
                                <th 
                                    className="p-4 font-bold cursor-pointer hover:text-white transition-colors group/h"
                                    onClick={() => requestSort('notes')}
                                >
                                    <div className="flex items-center gap-2">
                                        Notes
                                        <SortIcon columnKey="notes" />
                                    </div>
                                </th>
                                <th 
                                    className="p-4 font-bold cursor-pointer hover:text-white transition-colors group/h"
                                    onClick={() => requestSort('status')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Status
                                        <SortIcon columnKey="status" />
                                    </div>
                                </th>
                                <th className="p-4 text-right sticky right-0 bg-slate-900 z-10 border-l border-slate-800 shadow-[-10px_0_15px_rgba(0,0,0,0.3)]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {sortedItems.map((item, index) => {
                                // Handle legacy data migration
                                const phoneNumber = item.phoneNumber || (item as any).serialNumber || '-';
                                const promotion = item.promotion || (item as any).purchaseDate || '-';
                                return (
                                    <tr key={item.id} className="group hover:bg-slate-800/30 transition-all whitespace-nowrap">
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleMove(item.id, 'up')}
                                                    className="p-1 text-slate-600 hover:text-green-400 hover:bg-green-400/10 rounded transition-all disabled:opacity-10"
                                                    disabled={index === 0 && !sortConfig.key && !searchTerm}
                                                    title="เลื่อนขึ้น"
                                                >
                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleMove(item.id, 'down')}
                                                    className="p-1 text-slate-600 hover:text-green-400 hover:bg-green-400/10 rounded transition-all disabled:opacity-10"
                                                    disabled={index === filteredItems.length - 1 && !sortConfig.key && !searchTerm}
                                                    title="เลื่อนลง"
                                                >
                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-slate-500 text-center text-sm">{index + 1}</td>
                                        <td className="p-4">
                                            {item.kShopName ? (
                                                <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold whitespace-nowrap">
                                                    {item.kShopName}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-slate-400 text-xs font-mono">{item.email || '-'}</td>
                                        <td className="p-4 font-mono text-slate-300 group-hover:text-green-400 transition-colors">{phoneNumber}</td>
                                        <td className="p-4 text-slate-300 text-sm font-bold">
                                            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-400">{promotion}</span>
                                        </td>
                                        <td className="p-4 text-slate-300 text-sm whitespace-nowrap">{item.deviceName || 'SIM AIS'}</td>
                                        <td className="p-4">
                                            <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700 whitespace-nowrap">
                                                {item.location}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400 text-sm">{item.notes || '-'}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${item.status === 'ACTIVE'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                                                }`}>
                                                {item.status === 'ACTIVE' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right sticky right-0 bg-slate-900/80 backdrop-blur-sm z-10 border-l border-slate-800/50 shadow-[-10px_0_15px_rgba(0,0,0,0.2)] group-hover:bg-slate-800/90 transition-all">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 text-slate-500 hover:text-green-400 hover:bg-green-950/30 rounded-full transition-all"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Edit/Add Modal */}
            {(editingItem || isAdding) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg bg-slate-900 border-green-500/30 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-green-950/20">
                            <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                                <Edit className="w-5 h-5 text-green-400" />
                                {isAdding ? 'REGISTER NEW SIM' : 'EDIT SIM DETAILS'}
                            </h3>
                            <button onClick={() => { setEditingItem(null); setIsAdding(false); }} className="text-slate-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-green-400 uppercase tracking-widest font-mono">เบอร์โทรศัพท์ (Phone Number)</label>
                                <input
                                    type="text"
                                    value={formData.phoneNumber || ''}
                                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none font-mono"
                                    placeholder="093xxxxxxx"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">ชื่ออุปกรณ์ (Device Name)</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                    <input
                                        type="text"
                                        value={formData.deviceName || ''}
                                        onChange={e => setFormData({ ...formData, deviceName: e.target.value })}
                                        className="w-full bg-black/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-green-500 outline-none text-sm"
                                        placeholder="เช่น SIM AIS, Router, etc."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">โปรโมชั่น (Promotion)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['129 ฿', '499 ฿'].map((price) => (
                                        <button
                                            key={price}
                                            onClick={() => setFormData({ ...formData, promotion: price })}
                                            className={`px-4 py-3 rounded-lg border font-bold transition-all ${formData.promotion === price
                                                ? 'bg-green-600/20 border-green-500 text-green-400'
                                                : 'bg-black/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                                                }`}
                                        >
                                            {price}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location || ''}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Status</label>
                                    <select
                                        value={formData.status || 'ACTIVE'}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none appearance-none"
                                    >
                                        <option value="ACTIVE">ใช้งาน (Active)</option>
                                        <option value="INACTIVE">ไม่ใช้งาน (Inactive)</option>
                                        <option value="BROKEN">ชำรุด (Broken)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                        <input
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-black/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-green-500 outline-none font-mono text-sm"
                                            placeholder="example@ais.co.th"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">ชื่อ K-Shop</label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                        <input
                                            type="text"
                                            value={formData.kShopName || ''}
                                            onChange={e => setFormData({ ...formData, kShopName: e.target.value })}
                                            className="w-full bg-black/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-green-500 outline-none text-sm"
                                            placeholder="ระบุชื่อร้าน K-Shop"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Notes / Owner</label>
                                <input
                                    type="text"
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none"
                                    placeholder="ระบุชื่อผู้ใช้งาน หรือ หมายเหตุ"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                {editingItem && (
                                    <button
                                        onClick={() => handleDelete(editingItem.id)}
                                        className="px-4 py-2 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider border border-red-900/50 rounded-lg hover:bg-red-950/30 transition-all mr-auto"
                                    >
                                        DELETE
                                    </button>
                                )}
                                <Button variant="ghost" onClick={() => { setEditingItem(null); setIsAdding(false); }}>Cancel</Button>
                                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white w-32">Save Changes</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
