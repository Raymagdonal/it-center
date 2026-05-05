
import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, AlertCircle, Clock, CheckCircle2, Ticket, Server, Zap, Activity,
  Plus, TrendingUp, AlertTriangle, ChevronRight, PieChart, CalendarDays, Filter,
  Cpu, Hash, MapPin, Ship, Anchor, Box, HardDrive, Wifi, Package, Wrench, BarChart2, ShoppingCart,
  Calendar, ChevronLeft, X, TableProperties, ExternalLink
} from 'lucide-react';

import { AppMode, MaintenanceTicket, TrackedAsset, ProcurementFolder, THAI_MONTHS } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface LandingProps {
  onNavigate: (mode: AppMode, filter?: string) => void;
  tickets: MaintenanceTicket[];
  assets: TrackedAsset[];
  procurementFolders: ProcurementFolder[];
  onNavigateToFolder?: (folderId: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate, tickets, assets, procurementFolders, onNavigateToFolder }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'MONTHLY' | 'WEEKLY' | 'DAILY'>('ALL');

  // Stats Calculation
  const assetStats = useMemo(() => ({
    total: assets.length,
    active: assets.filter(a => (a.status || 'ACTIVE') === 'ACTIVE').length,
    broken: assets.filter(a => a.status === 'BROKEN').length,
    spare: assets.filter(a => a.status === 'SPARE').length,
    claim: assets.filter(a => a.status === 'SEND_CLAIM').length,
  }), [assets]);

  const assetTypeStats = useMemo(() => {
    let pos = 0, cctv = 0, power = 0;
    assets.forEach(a => {
      const text = (a.name + ' ' + (a.model || '')).toLowerCase();
      if (text.includes('famoco') || text.includes('ticket') || text.includes('pos') || text.includes('kiosk') || text.includes('printer')) pos++;
      else if (text.includes('cctv') || text.includes('camera')) cctv++;
      else if (text.includes('charger') || text.includes('power') || text.includes('cable')) power++;
    });
    return { pos, cctv, power };
  }, [assets]);

  const filteredTickets = useMemo(() => {
    // Logic simplified for display
    return tickets;
  }, [tickets]);

  // Flatten and sort procurement items
  const recentPurchases = useMemo(() => {
    if (!procurementFolders) return [];
    const allItems = procurementFolders.flatMap(f => f.items.map(item => ({ ...item, folderId: f.id, folderName: f.name, locationName: f.locationName })));
    return allItems.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()).slice(0, 5);
  }, [procurementFolders]);

  const pendingTickets = filteredTickets.filter(t => t.status === 'PENDING').length;
  const inProgressTickets = filteredTickets.filter(t => t.status === 'IN_PROGRESS').length;
  const completedTickets = filteredTickets.filter(t => t.status === 'COMPLETED').length;
  const totalTickets = filteredTickets.length;

  const assetsByLocation = useMemo(() => {
    const counts: Record<string, { count: number; type: string }> = {};
    assets.forEach(a => {
      if (!counts[a.location]) counts[a.location] = { count: 0, type: a.locationType };
      counts[a.location].count++;
    });
    return Object.entries(counts).sort((a, b) => b[1].count - a[1].count).slice(0, 4);
  }, [assets]);

  return (
    <div className="p-8 max-w-[1920px] mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-700">

      {/* COMMAND CENTER HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b-2 border-cyan-900/50 pb-8 relative">
        <div className="absolute bottom-0 left-0 w-1/3 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent shadow-[0_0_10px_#00f2ff]"></div>
        <div>
          <h1 className="text-5xl font-black text-white font-display uppercase tracking-widest flex items-center gap-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <LayoutDashboard className="h-10 w-10 text-cyan-400 animate-pulse-fast" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-500">IT CENTER</span>
          </h1>
          <p className="text-cyan-500 font-mono mt-3 text-xs font-bold flex items-center gap-3 tracking-[0.4em] uppercase">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            สถานะระบบ: ออนไลน์ // ความสมบูรณ์ทรัพย์สิน: 98%
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <a 
            href="https://docs.google.com/spreadsheets/d/1M6f-xHA9E0mqdTbvIFkROLbL4d6gJaC0JC8QRhHYmh0/edit?pli=1&gid=2077750642#gid=2077750642" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 hover:bg-green-500 hover:text-black transition-all group h-14"
          >
            <TableProperties className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-tighter opacity-70">External Link</span>
              <span className="text-xs font-bold uppercase tracking-widest">Google Sheets Log</span>
            </div>
            <ExternalLink className="w-3 h-3 opacity-50 ml-1" />
          </a>

          <div className="bg-black/40 border border-cyan-500/30 px-6 py-2 rounded-sm clip-corner flex items-center gap-4 h-14">
            <div className="text-right">
              <div className="text-[10px] text-cyan-600 font-mono uppercase tracking-widest">เวลาเซิร์ฟเวอร์</div>
              <div className="text-xl font-display font-bold text-white">{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <Activity className="w-8 h-8 text-cyan-500 animate-pulse" />
          </div>
          <Button onClick={() => onNavigate('ADMIN')} className="h-14">
            <HardDrive className="mr-2 h-4 w-4" /> เข้าถึงฐานข้อมูลอุปกรณ์
          </Button>
        </div>

      </div>

      {/* STATS ROW - POWER CELLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PowerCell
          label="รายการแจ้งซ่อมทั้งหมด"
          value={totalTickets}
          icon={Ticket}
          color="cyan"
          subtext="รายการแจ้งซ่อมทั้งหมด"
          onClick={() => onNavigate('TRACK', 'ALL')}
        />
        <PowerCell
          label="รอซ่อม"
          value={pendingTickets}
          icon={Clock}
          color="red"
          subtext="รอซ่อม"
          onClick={() => onNavigate('TRACK', 'PENDING')}
        />
        <PowerCell
          label="กำลังซ่อม"
          value={inProgressTickets}
          icon={Wrench}
          color="purple"
          subtext="กำลังซ่อม"
          onClick={() => onNavigate('TRACK', 'IN_PROGRESS')}
        />
        <PowerCell
          label="ซ่อมเสร็จแล้ว"
          value={completedTickets}
          icon={CheckCircle2}
          color="green"
          subtext="ซ่อมเสร็จแล้ว"
          onClick={() => onNavigate('TRACK', 'COMPLETED')}
        />
      </div>

      {/* MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* COLUMN 1: PROCUREMENT SUMMARY */}
        <div className="xl:col-span-2 space-y-8">
          <Card className="h-full border-cyan-500/20 bg-black/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold font-display uppercase tracking-widest text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-cyan-400" />
                สรุปรายการจัดซื้อล่าสุด
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('PROCUREMENT')} className="text-[10px]">ดูทั้งหมด</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-mono text-cyan-500 uppercase tracking-wider">
                      <th className="py-3 pl-2">รายการจัดซื้อ (Item)</th>
                      <th className="py-3">สถานที่ (Location)</th>
                      <th className="py-3 text-center">จำนวน (Qty)</th>
                      <th className="py-3 text-right pr-2">สต๊อก (Stock)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentPurchases.length > 0 ? recentPurchases.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-cyan-900/10 transition-colors cursor-pointer"
                        onClick={() => onNavigateToFolder?.(item.folderId)}
                      >
                        <td className="py-3 pl-2">
                          <div className="font-bold text-slate-200 text-sm">{item.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.purchaseDate}</div>
                        </td>
                        <td className="py-3">
                          <div className="text-xs text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-cyan-600" />
                            {item.locationName || item.folderName}
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span className="font-mono text-cyan-400 font-bold">{item.quantity}</span>
                          <span className="text-[9px] text-slate-500 ml-1">{item.unit}</span>
                        </td>
                        <td className="py-3 text-right pr-2">
                          <div className="flex flex-col items-end gap-1">
                            {item.usageStatus === 'ACTIVE' ? (
                              <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 uppercase font-bold">
                                ใช้งาน
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-600 uppercase font-bold">
                                สำรอง
                              </span>
                            )}
                            <span className="text-[9px] text-slate-500 font-mono">
                              จำนวน {item.quantity} {item.unit}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500 font-mono text-xs">
                          ไม่พบข้อมูลการจัดซื้อ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* COLUMN 2: INVENTORY & ACTIONS */}
        <div className="space-y-8">
          <MiniCalendar tickets={tickets} procurementFolders={procurementFolders} onNavigate={onNavigate} />

          <div className="space-y-4">
            <ActionButton
              label="เปิดใบงานแจ้งซ่อม"
              sub="สร้างคำร้องซ่อมบำรุงใหม่"
              icon={Wrench}
              onClick={() => onNavigate('REPORT')}
              color="cyan"
            />
            <ActionButton
              label="เข้าถึงฐานข้อมูลอุปกรณ์"
              sub="ดูทะเบียนทรัพย์สินทั้งหมด"
              icon={Hash}
              onClick={() => onNavigate('ADMIN')}
              color="purple"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB COMPONENTS FOR SCI-FI LOOK ---

const PowerCell = ({ title, value, icon: Icon, color, subtext, onClick }: any) => {
  const colors: any = {
    cyan: "from-cyan-500/20 to-cyan-900/10 border-cyan-500/50 text-cyan-400",
    green: "from-green-500/20 to-green-900/10 border-green-500/50 text-green-400",
    red: "from-red-500/20 to-red-900/10 border-red-500/50 text-red-400",
    purple: "from-purple-500/20 to-purple-900/10 border-purple-500/50 text-purple-400",
  };

  return (
    <div onClick={onClick} className={`relative p-6 bg-gradient-to-br ${colors[color]} border rounded-sm overflow-hidden group cursor-pointer hover:scale-105 transition-all duration-300 clip-corner`}>
      <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-50 transition-opacity">
        <Icon className="w-16 h-16" />
      </div>
      <div className="relative z-10">
        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-2 text-white/70">{subtext}</div>
        <div className={`text-5xl font-display font-black tracking-tighter ${color === 'cyan' ? 'text-cyan-400' : color === 'red' ? 'text-red-500' : color === 'green' ? 'text-green-400' : 'text-purple-400'} drop-shadow-md`}>
          {value}
        </div>
        <div className="h-1 w-full bg-black/50 mt-4 rounded-full overflow-hidden">
          <div className={`h-full w-2/3 bg-current animate-pulse`}></div>
        </div>
      </div>
    </div>
  );
};

const StatusRing = ({ count, label, color, borderColor }: any) => (
  <div className="flex flex-col items-center justify-center p-4 bg-black/40 rounded border border-slate-800 relative overflow-hidden group">
    <div className={`w-20 h-20 rounded-full border-4 ${borderColor} border-dashed flex items-center justify-center animate-spin-slow mb-3 relative`}>
      <div className={`w-16 h-16 rounded-full border-2 ${borderColor} opacity-30 absolute animate-ping`}></div>
      <span className={`text-2xl font-display font-bold ${color} animate-none`} style={{ animationDirection: 'reverse' }}>{count}</span>
    </div>
    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

const TechProgressBar = ({ label, count, total, color }: any) => {
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="group">
      <div className="flex justify-between text-[10px] mb-1 font-mono font-bold tracking-widest uppercase">
        <span className="text-cyan-100">{label}</span>
        <span className={color.replace('bg-', 'text-')}>{percent}%</span>
      </div>
      <div className="h-2 w-full bg-black border border-slate-800 relative">
        <div
          className={`h-full ${color} shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out`}
          style={{ width: `${percent}%` }}
        />
        {/* Grid lines over bar */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_2px,black_2px)] bg-[size:10px_100%] opacity-30"></div>
      </div>
    </div>
  );
};

const DeviceStatBar = ({ label, count, total, icon: Icon, color }: any) => {
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);
  const colorClass = color === 'cyan' ? 'bg-cyan-500' : color === 'purple' ? 'bg-purple-500' : 'bg-amber-500';

  return (
    <div className="flex items-center gap-4 group">
      <div className="p-3 bg-black border border-slate-800 text-slate-400 group-hover:text-white group-hover:border-cyan-500/50 transition-all clip-corner shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 tracking-widest uppercase font-display">{label}</span>
          <span className="text-[10px] font-mono text-cyan-500 font-bold uppercase">{count} หน่วย</span>
        </div>
        <div className="flex h-1.5 w-full bg-slate-900 gap-0.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-all duration-300 ${i < (percent / 5) ? colorClass : 'bg-slate-800'} ${i < (percent / 5) ? 'shadow-[0_0_5px_currentColor]' : ''}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ label, sub, icon: Icon, onClick, color }: any) => (
  <button
    onClick={onClick}
    className={`w-full group relative overflow-hidden bg-black/60 border-l-4 ${color === 'cyan' ? 'border-cyan-500' : 'border-purple-500'} p-5 text-left hover:bg-slate-900 transition-all`}
  >
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r ${color === 'cyan' ? 'from-cyan-500' : 'from-purple-500'} to-transparent transition-opacity`}></div>
    <div className="relative z-10 flex justify-between items-center">
      <div>
        <div className={`font-display font-bold text-white text-sm tracking-widest group-hover:translate-x-2 transition-transform duration-300`}>{label}</div>
        <div className="text-[10px] font-mono text-slate-500 uppercase mt-1">{sub}</div>
      </div>
      <Icon className={`h-6 w-6 ${color === 'cyan' ? 'text-cyan-500' : 'text-purple-500'} group-hover:scale-125 transition-transform`} />
    </div>
  </button>
);

// Mini Calendar Component for Dashboard
const MiniCalendar = ({ tickets, procurementFolders, onNavigate }: { tickets: MaintenanceTicket[], procurementFolders: ProcurementFolder[], onNavigate: (mode: AppMode) => void }) => {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calendarData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const days: any[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = getLocalDateString(date);

      const reportedTickets = tickets.filter(t => getLocalDateString(new Date(t.timestamp)) === dateStr);
      const completedTickets = tickets.filter(t => t.completedDate === dateStr && t.status === 'COMPLETED');

      const procurementItems: any[] = [];
      procurementFolders.forEach(folder => {
        if (folder.year === currentYear && folder.month === currentMonth) {
          folder.items.forEach(item => {
            if (getLocalDateString(new Date(item.purchaseDate)) === dateStr) {
              procurementItems.push({ folderName: folder.name, itemName: item.name, quantity: item.quantity, unit: item.unit });
            }
          });
        }
      });

      days.push({ date, dayOfWeek: date.getDay(), reportedTickets, completedTickets, procurementItems });
    }
    return days;
  }, [currentYear, currentMonth, tickets, procurementFolders]);

  const formatDateThai = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <>
      <Card className="border-cyan-500/20 bg-black/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            ปฏิทินกิจกรรม
          </CardTitle>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentMonth(m => m === 0 ? (setCurrentYear(y => y - 1), 11) : m - 1)} className="p-1 hover:bg-slate-800 rounded">
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <span className="text-xs font-mono text-cyan-400 min-w-[100px] text-center">{THAI_MONTHS[currentMonth]} {currentYear}</span>
            <button onClick={() => setCurrentMonth(m => m === 11 ? (setCurrentYear(y => y + 1), 0) : m + 1)} className="p-1 hover:bg-slate-800 rounded">
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className={`text-[9px] text-center font-bold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-500'}`}>{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarData.map((day, idx) => {
              const hasData = day && (day.reportedTickets.length > 0 || day.completedTickets.length > 0 || day.procurementItems.length > 0);
              const isWeekend = day && (day.dayOfWeek === 0 || day.dayOfWeek === 6);
              return (
                <div
                  key={idx}
                  onClick={() => hasData && setSelectedDay(day)}
                  className={`min-h-[32px] text-center text-[10px] py-1 rounded transition-all ${!day ? '' :
                      hasData ? 'cursor-pointer hover:bg-cyan-900/30 ring-1 ring-cyan-500/30' :
                        isWeekend ? 'bg-slate-800/30' : ''
                    }`}
                >
                  {day && (
                    <>
                      <div className={`font-bold ${day.dayOfWeek === 0 ? 'text-red-400' : day.dayOfWeek === 6 ? 'text-blue-400' : 'text-slate-300'}`}>
                        {day.date.getDate()}
                      </div>
                      {hasData && (
                        <div className="flex justify-center gap-0.5 mt-0.5">
                          {day.reportedTickets.length > 0 && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>}
                          {day.completedTickets.length > 0 && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
                          {day.procurementItems.length > 0 && <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-3 mt-3 text-[8px]">
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full"></div><span className="text-slate-500">แจ้งซ่อม</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span className="text-slate-500">เสร็จ</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-cyan-500 rounded-full"></div><span className="text-slate-500">จัดซื้อ</span></div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('CALENDAR')} className="w-full mt-3 text-[10px]">ดูปฏิทินเต็ม</Button>
        </CardContent>
      </Card>

      {/* Day Detail Popup */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedDay(null)}>
          <Card className="w-full max-w-lg bg-slate-900 border-cyan-500/30 max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between border-b border-cyan-500/20 pb-4">
              <div>
                <CardTitle className="text-cyan-400">{selectedDay.date.getDate()} {THAI_MONTHS[selectedDay.date.getMonth()]} {selectedDay.date.getFullYear()}</CardTitle>
                <p className="text-xs text-slate-500 mt-1">รายละเอียดกิจกรรม</p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto max-h-[50vh] pt-4">
              {selectedDay.reportedTickets.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-2"><Wrench className="w-4 h-4" /> แจ้งซ่อม ({selectedDay.reportedTickets.length})</h4>
                  {selectedDay.reportedTickets.map((t: MaintenanceTicket) => (
                    <div key={t.id} className="bg-amber-950/30 border border-amber-500/20 rounded p-3 mb-2 text-xs">
                      <div className="font-bold text-amber-300">{t.deviceType} {t.deviceId && `#${t.deviceId}`}</div>
                      <div className="text-slate-400 mt-1">{t.issueDescription}</div>
                      <div className="text-slate-500 mt-1 text-[10px]">📍 {t.location}</div>
                    </div>
                  ))}
                </div>
              )}
              {selectedDay.completedTickets.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4" /> ซ่อมเสร็จ ({selectedDay.completedTickets.length})</h4>
                  {selectedDay.completedTickets.map((t: MaintenanceTicket) => (
                    <div key={t.id} className="bg-emerald-950/30 border border-emerald-500/20 rounded p-3 mb-2 text-xs">
                      <div className="font-bold text-emerald-300">{t.deviceType} {t.deviceId && `#${t.deviceId}`}</div>
                      <div className="text-slate-400 mt-1">{t.issueDescription}</div>
                      <div className="text-slate-500 mt-1 text-[10px]">✅ เสร็จเมื่อ: {t.completedDate ? formatDateThai(t.completedDate) : '-'}</div>
                    </div>
                  ))}
                </div>
              )}
              {selectedDay.procurementItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2 mb-2"><ShoppingCart className="w-4 h-4" /> จัดซื้อ ({selectedDay.procurementItems.length})</h4>
                  {selectedDay.procurementItems.map((item: any, idx: number) => (
                    <div key={idx} className="bg-cyan-950/30 border border-cyan-500/20 rounded p-3 mb-2 text-xs">
                      <div className="font-bold text-cyan-300">{item.itemName}</div>
                      <div className="text-slate-500 mt-1">📁 {item.folderName} • {item.quantity} {item.unit}</div>
                    </div>
                  ))}
                </div>
              )}
              {selectedDay.reportedTickets.length === 0 && selectedDay.completedTickets.length === 0 && selectedDay.procurementItems.length === 0 && (
                <div className="text-center text-slate-500 py-6">ไม่มีกิจกรรม</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
