import React, { useState, useMemo } from 'react';
import { MaintenanceTicket, ProcurementFolder, THAI_MONTHS } from '../types';
import { Calendar, ChevronLeft, ChevronRight, ShoppingCart, Wrench, X, Package, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface CalendarManagerProps {
    tickets: MaintenanceTicket[];
    procurementFolders: ProcurementFolder[];
}

// Month color themes
const MONTH_COLORS = [
    { bg: 'bg-cyan-950/30', border: 'border-cyan-500/30', text: 'text-cyan-400', accent: 'bg-cyan-500', glow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]' },
    { bg: 'bg-pink-950/30', border: 'border-pink-500/30', text: 'text-pink-400', accent: 'bg-pink-500', glow: 'shadow-[0_0_10px_rgba(236,72,153,0.3)]' },
    { bg: 'bg-lime-950/30', border: 'border-lime-500/30', text: 'text-lime-400', accent: 'bg-lime-500', glow: 'shadow-[0_0_10px_rgba(132,204,22,0.3)]' },
    { bg: 'bg-amber-950/30', border: 'border-amber-500/30', text: 'text-amber-400', accent: 'bg-amber-500', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]' },
    { bg: 'bg-emerald-950/30', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: 'bg-emerald-500', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
    { bg: 'bg-rose-950/30', border: 'border-rose-500/30', text: 'text-rose-400', accent: 'bg-rose-500', glow: 'shadow-[0_0_10px_rgba(244,63,94,0.3)]' },
    { bg: 'bg-sky-950/30', border: 'border-sky-500/30', text: 'text-sky-400', accent: 'bg-sky-500', glow: 'shadow-[0_0_10px_rgba(14,165,233,0.3)]' },
    { bg: 'bg-orange-950/30', border: 'border-orange-500/30', text: 'text-orange-400', accent: 'bg-orange-500', glow: 'shadow-[0_0_10px_rgba(249,115,22,0.3)]' },
    { bg: 'bg-violet-950/30', border: 'border-violet-500/30', text: 'text-violet-400', accent: 'bg-violet-500', glow: 'shadow-[0_0_10px_rgba(139,92,246,0.3)]' },
    { bg: 'bg-teal-950/30', border: 'border-teal-500/30', text: 'text-teal-400', accent: 'bg-teal-500', glow: 'shadow-[0_0_10px_rgba(20,184,166,0.3)]' },
    { bg: 'bg-fuchsia-950/30', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400', accent: 'bg-fuchsia-500', glow: 'shadow-[0_0_10px_rgba(217,70,239,0.3)]' },
    { bg: 'bg-indigo-950/30', border: 'border-indigo-500/30', text: 'text-indigo-400', accent: 'bg-indigo-500', glow: 'shadow-[0_0_10px_rgba(99,102,241,0.3)]' },
];

const YEARS = [2026, 2027, 2028, 2029, 2030];
const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

interface DayData {
    date: Date;
    dayOfWeek: number;
    reportedTickets: MaintenanceTicket[];
    completedTickets: MaintenanceTicket[];
    procurementItems: { folderName: string; itemName: string; quantity: number; unit: string }[];
}

// Helper to format date as DD/MM/YYYY
const formatDateThai = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Helper to get local date string (YYYY-MM-DD) without timezone issues
const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const CalendarManager: React.FC<CalendarManagerProps> = ({ tickets, procurementFolders }) => {
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

    // Get days in month
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Get first day of month (0 = Sunday)
    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    // Build calendar data for selected month
    const calendarData = useMemo(() => {
        const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
        const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
        const days: (DayData | null)[] = [];

        // Add empty cells for days before the first day
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days with data
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(selectedYear, selectedMonth, day);
            const dateStr = getLocalDateString(date);

            // Find tickets REPORTED on this day
            const reportedTickets = tickets.filter(t => {
                const ticketDate = new Date(t.timestamp);
                return getLocalDateString(ticketDate) === dateStr;
            });

            // Find tickets COMPLETED on this day
            const completedTickets = tickets.filter(t => {
                if (!t.completedDate || t.status !== 'COMPLETED') return false;
                return t.completedDate === dateStr;
            });

            // Find procurement items for this day
            const dayProcurement: DayData['procurementItems'] = [];
            procurementFolders.forEach(folder => {
                if (folder.year === selectedYear && folder.month === selectedMonth) {
                    folder.items.forEach(item => {
                        const itemDate = new Date(item.purchaseDate);
                        if (getLocalDateString(itemDate) === dateStr) {
                            dayProcurement.push({
                                folderName: folder.name,
                                itemName: item.name,
                                quantity: item.quantity,
                                unit: item.unit
                            });
                        }
                    });
                }
            });

            days.push({
                date,
                dayOfWeek: date.getDay(),
                reportedTickets,
                completedTickets,
                procurementItems: dayProcurement
            });
        }

        return days;
    }, [selectedYear, selectedMonth, tickets, procurementFolders]);

    const monthColor = MONTH_COLORS[selectedMonth];

    // Get weekend background class
    const getWeekendBg = (dayOfWeek: number): string => {
        if (dayOfWeek === 0) return 'bg-red-950/20'; // Sunday
        if (dayOfWeek === 6) return 'bg-blue-950/20'; // Saturday
        return '';
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className={`flex items-center justify-between p-6 ${monthColor.bg} backdrop-blur-xl border ${monthColor.border} rounded-2xl ${monthColor.glow} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shine pointer-events-none"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className={`p-4 bg-black border-2 ${monthColor.border} rounded-2xl shadow-lg`}>
                        <Calendar className={`w-10 h-10 ${monthColor.text}`} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white font-display tracking-wider mb-1">ปฏิทินกิจกรรม</h1>
                        <p className="text-slate-400 font-mono text-sm">ACTIVITY CALENDAR • {selectedYear}</p>
                    </div>
                </div>

                {/* Year Selector */}
                <div className="flex gap-2">
                    {YEARS.map(year => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${selectedYear === year
                                ? `${monthColor.accent} text-black shadow-lg`
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <button
                    onClick={() => setSelectedMonth(m => m === 0 ? 11 : m - 1)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="flex gap-2 flex-wrap justify-center">
                    {THAI_MONTHS.map((month, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedMonth(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedMonth === idx
                                ? `${MONTH_COLORS[idx].accent} text-black`
                                : `bg-slate-800 ${MONTH_COLORS[idx].text} hover:opacity-80`
                                }`}
                        >
                            {month}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setSelectedMonth(m => m === 11 ? 0 : m + 1)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Calendar Grid */}
            <Card className={`${monthColor.bg} border-2 ${monthColor.border} ${monthColor.glow} overflow-hidden`}>
                <div className={`p-4 border-b-2 ${monthColor.border} flex items-center justify-between`}>
                    <h2 className={`text-xl font-bold ${monthColor.text} font-display`}>
                        {THAI_MONTHS[selectedMonth]} {selectedYear}
                    </h2>
                    <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                            <span className="text-slate-400">แจ้งซ่อม</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="text-slate-400">ซ่อมเสร็จ</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                            <span className="text-slate-400">จัดซื้อ</span>
                        </div>
                    </div>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7">
                    {WEEKDAYS.map((day, idx) => (
                        <div
                            key={idx}
                            className={`p-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 ${monthColor.border} ${idx === 0 ? 'text-red-400 bg-red-950/30' : idx === 6 ? 'text-blue-400 bg-blue-950/30' : 'text-slate-500'
                                }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                    {calendarData.map((day, idx) => {
                        const colIndex = idx % 7;
                        const isWeekend = colIndex === 0 || colIndex === 6;
                        const weekendBg = isWeekend ? (colIndex === 0 ? 'bg-red-950/15' : 'bg-blue-950/15') : '';

                        return (
                            <div
                                key={idx}
                                onClick={() => day && (day.reportedTickets.length > 0 || day.completedTickets.length > 0 || day.procurementItems.length > 0) && setSelectedDay(day)}
                                className={`min-h-[100px] p-2 border-r border-b border-slate-700/50 transition-all ${weekendBg} ${day ? 'hover:bg-slate-800/50 cursor-pointer' : ''
                                    } ${day && (day.reportedTickets.length > 0 || day.completedTickets.length > 0 || day.procurementItems.length > 0) ? `ring-2 ring-inset ${monthColor.border}` : ''}`}
                            >
                                {day && (
                                    <>
                                        <div className={`text-sm font-bold mb-2 ${day.dayOfWeek === 0 ? 'text-red-400' : day.dayOfWeek === 6 ? 'text-blue-400' : 'text-slate-300'
                                            }`}>
                                            {day.date.getDate()}
                                        </div>

                                        {/* Reported Tickets indicator */}
                                        {day.reportedTickets.length > 0 && (
                                            <div className="flex items-center gap-1 mb-1 bg-amber-500/20 rounded px-1.5 py-0.5 border border-amber-500/30">
                                                <Wrench className="w-3 h-3 text-amber-400" />
                                                <span className="text-[10px] text-amber-300 font-bold">{day.reportedTickets.length} แจ้ง</span>
                                            </div>
                                        )}

                                        {/* Completed Tickets indicator */}
                                        {day.completedTickets.length > 0 && (
                                            <div className="flex items-center gap-1 mb-1 bg-emerald-500/20 rounded px-1.5 py-0.5 border border-emerald-500/30">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                <span className="text-[10px] text-emerald-300 font-bold">{day.completedTickets.length} เสร็จ</span>
                                            </div>
                                        )}

                                        {/* Procurement indicator */}
                                        {day.procurementItems.length > 0 && (
                                            <div className="flex items-center gap-1 bg-cyan-500/20 rounded px-1.5 py-0.5 border border-cyan-500/30">
                                                <ShoppingCart className="w-3 h-3 text-cyan-400" />
                                                <span className="text-[10px] text-cyan-300 font-bold">{day.procurementItems.length} ซื้อ</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Day Detail Popup */}
            {selectedDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedDay(null)}>
                    <Card className={`w-full max-w-2xl bg-slate-900 border-2 ${monthColor.border} ${monthColor.glow} max-h-[80vh] overflow-hidden`} onClick={e => e.stopPropagation()}>
                        <div className={`p-6 ${monthColor.bg} border-b-2 ${monthColor.border} flex justify-between items-center`}>
                            <div>
                                <h3 className={`text-2xl font-bold ${monthColor.text} font-display`}>
                                    {selectedDay.date.getDate()} {THAI_MONTHS[selectedDay.date.getMonth()]} {selectedDay.date.getFullYear()}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">รายละเอียดกิจกรรมในวันนี้</p>
                            </div>
                            <button onClick={() => setSelectedDay(null)} className="p-2 rounded-full hover:bg-slate-800 transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                            {/* Reported Tickets Section */}
                            {selectedDay.reportedTickets.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-bold text-amber-400 flex items-center gap-2 mb-4">
                                        <Wrench className="w-5 h-5" /> แจ้งซ่อมในวันนี้ ({selectedDay.reportedTickets.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedDay.reportedTickets.map(ticket => (
                                            <div key={ticket.id} className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <span className="text-amber-300 font-bold">{ticket.deviceType}</span>
                                                        {ticket.deviceId && <span className="text-slate-500 ml-2">#{ticket.deviceId}</span>}
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${ticket.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                                                        ticket.status === 'IN_PROGRESS' ? 'bg-cyan-500/20 text-cyan-400' :
                                                            'bg-amber-500/20 text-amber-400'
                                                        }`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 text-sm mt-2">{ticket.issueDescription}</p>
                                                <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-amber-500/20">
                                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                        <Clock className="w-3 h-3" />
                                                        <span>วันที่แจ้ง: {formatDateThai(ticket.timestamp)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>สถานที่: {ticket.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Completed Tickets Section */}
                            {selectedDay.completedTickets.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-4">
                                        <CheckCircle2 className="w-5 h-5" /> ซ่อมเสร็จในวันนี้ ({selectedDay.completedTickets.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedDay.completedTickets.map(ticket => (
                                            <div key={ticket.id} className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <span className="text-emerald-300 font-bold">{ticket.deviceType}</span>
                                                        {ticket.deviceId && <span className="text-slate-500 ml-2">#{ticket.deviceId}</span>}
                                                    </div>
                                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                                        COMPLETED
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 text-sm mt-2">{ticket.issueDescription}</p>
                                                <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-emerald-500/20">
                                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                        <Clock className="w-3 h-3" />
                                                        <span>วันที่ซ่อมเสร็จ: {ticket.completedDate ? formatDateThai(ticket.completedDate) : '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>สถานที่: {ticket.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Procurement Section */}
                            {selectedDay.procurementItems.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-bold text-cyan-400 flex items-center gap-2 mb-4">
                                        <ShoppingCart className="w-5 h-5" /> การจัดซื้อ ({selectedDay.procurementItems.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedDay.procurementItems.map((item, idx) => (
                                            <div key={idx} className="bg-cyan-950/30 border border-cyan-500/30 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-cyan-300 font-bold flex items-center gap-2">
                                                        <Package className="w-4 h-4" /> {item.itemName}
                                                    </span>
                                                    <span className="text-slate-400 text-sm">{item.quantity} {item.unit}</span>
                                                </div>
                                                <p className="text-slate-500 text-xs mt-2">📁 {item.folderName}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {selectedDay.reportedTickets.length === 0 && selectedDay.completedTickets.length === 0 && selectedDay.procurementItems.length === 0 && (
                                <div className="text-center text-slate-500 py-8">
                                    <Calendar className="w-12 h-12 mx-auto opacity-30 mb-4" />
                                    <p>ไม่มีกิจกรรมในวันนี้</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
