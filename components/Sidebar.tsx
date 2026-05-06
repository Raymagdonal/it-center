
import React from 'react';
import { Activity, ShieldCheck, PlusCircle, LayoutDashboard, ShoppingCart, Map as MapIcon, Database, MapPin, Anchor, Cpu, List, HardDrive, FileText, ClipboardList, Package, Smartphone, Calendar, Tablet } from 'lucide-react';
import { AppMode } from '../types';

interface SidebarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  badges?: Partial<Record<AppMode, number>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onModeChange,
  badges = {}
}) => {
  const navItems = [
    { mode: 'HOME', label: 'แดชบอร์ด', subLabel: 'ภาพรวมระบบ', icon: LayoutDashboard },
    { mode: 'PROCUREMENT', label: 'จัดซื้ออุปกรณ์', subLabel: 'โซ่อุปทาน', icon: ShoppingCart },
    { mode: 'ASSET_TRACKING', label: 'เครื่องจำหน่ายตั๋ว', subLabel: 'Ticket Machine', icon: Tablet },
    { mode: 'REPORT', label: 'แจ้งซ่อมใหม่', subLabel: 'เริ่มกระบวนการ', icon: PlusCircle },
    { mode: 'ADMIN', label: 'ติดตาม/จัดการซ่อม', subLabel: 'ตรวจสอบ & อัปเดต', icon: Activity },
    { mode: 'MARITIME', label: 'ตรวจอุปกรณ์ในเรือ/บนท่า', subLabel: 'ตรวจกองเรือ', icon: Anchor },

    { mode: 'MEETING_REPORT', label: 'รายงานการประชุม', subLabel: 'ติดตามงานติดตั้ง/ซ่อม', icon: FileText },
    { mode: 'CALENDAR', label: 'ปฏิทิน', subLabel: 'กิจกรรมรายวัน', icon: Calendar },
    { mode: 'SIM_AIS', label: 'SIM AIS', subLabel: 'จัดการซิมการ์ด', icon: Smartphone },
  ];

  return (
    <aside className="w-full md:w-80 h-auto md:h-screen sticky top-0 z-40 flex flex-col bg-[#050b14]/80 backdrop-blur-xl border-r border-cyan-900/50 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">

      {/* Brand Header */}
      <div className="p-8 relative overflow-hidden group border-b border-cyan-900/30">
        <div className="absolute inset-0 bg-cyan-500/5 animate-pulse-fast"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
            <div className="absolute -inset-2 bg-cyan-500 blur-lg opacity-20 group-hover:opacity-50 transition-opacity"></div>
            <div className="w-14 h-14 bg-black border-2 border-cyan-400 clip-corner flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)]">
              <img
                src="https://i.postimg.cc/76W5mC6G/Logo-CTB.png"
                alt="CTB Logo"
                className="w-10 h-10 object-contain drop-shadow-[0_0_5px_rgba(0,242,255,1)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://i.postimg.cc/mzKcBTrd/Logo-CTB.png';
                }}
              />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-widest leading-none font-display glitch-hover cursor-default">
              IT <span className="text-cyan-500 text-[10px] block tracking-[0.1em] mt-1 uppercase font-bold">Chaophrayatouristboat</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 py-6 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-4 flex items-center gap-2 text-cyan-700">
          <Cpu className="w-4 h-4 animate-spin-slow" />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold text-cyan-600">โมดูลที่ทำงานอยู่</p>
        </div>

        {navItems.map((item) => {
          const isActive = currentMode === item.mode;
          const Icon = item.icon;
          return (
            <button
              key={item.mode}
              onClick={() => onModeChange(item.mode as AppMode)}
              className={`w-full flex items-center justify-between px-5 py-4 border-l-4 transition-all duration-300 group relative overflow-hidden clip-corner ${isActive
                ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[inset_0_0_20px_rgba(0,242,255,0.1)]'
                : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-900/80 hover:text-cyan-300 hover:border-cyan-500/30'
                }`}
            >
              {/* Hover sweep effect */}
              <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent translate-x-[-100%] transition-transform duration-300 ${isActive ? 'translate-x-0' : 'group-hover:translate-x-0'}`} />

              <div className="flex items-center gap-4 relative z-10">
                <div className={`p-2 rounded bg-black/50 border border-slate-800 transition-all duration-300 ${isActive ? 'border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.4)]' : 'group-hover:border-cyan-500/50 group-hover:text-cyan-300'}`}>
                  <Icon className={`h-5 w-5`} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold tracking-widest font-display transition-all ${isActive ? 'text-white text-shadow-glow' : ''}`}>{item.label}</p>
                  <p className="text-[8px] font-mono opacity-60 font-bold uppercase tracking-wide text-cyan-700 group-hover:text-cyan-500">{item.subLabel}</p>
                </div>
              </div>

              {isActive ? (
                <div className="relative">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping absolute"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full relative z-10"></div>
                </div>
              ) : (
                badges[item.mode as AppMode] && badges[item.mode as AppMode]! > 0 && (
                  <div className="relative animate-in zoom-in duration-300">
                    <div className="absolute -inset-1 bg-red-500 blur-sm opacity-50 animate-pulse"></div>
                    <div className="min-w-[18px] h-[18px] px-1 bg-red-600 rounded-full flex items-center justify-center relative z-10 border border-red-400 shadow-[0_0_10px_#ef4444]">
                      <span className="text-[10px] font-bold text-white leading-none font-mono">
                        {badges[item.mode as AppMode]}
                      </span>
                    </div>
                  </div>
                )
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer - ศูนย์ข้อมูล */}
      <button
        onClick={() => onModeChange('BACKUP')}
        className={`m-4 p-4 border rounded-lg transition-all duration-300 group relative overflow-hidden ${currentMode === 'BACKUP'
          ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,242,255,0.3)]'
          : 'bg-black/40 border-cyan-900/50 text-slate-400 hover:bg-cyan-950/30 hover:border-cyan-500/50'
          }`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,242,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-shine pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-3">
          <div className={`p-2 rounded border transition-all duration-300 ${currentMode === 'BACKUP'
            ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.4)]'
            : 'bg-slate-900 border-cyan-500/40'
            }`}>
            <Database className={`w-5 h-5 ${currentMode === 'BACKUP' ? 'text-cyan-300' : 'text-cyan-400'}`} />
          </div>
          <div className="text-left">
            <p className={`text-sm font-bold tracking-widest font-display ${currentMode === 'BACKUP' ? 'text-white' : ''}`}>ศูนย์ข้อมูล</p>
            <p className="text-[8px] font-mono text-cyan-600 uppercase mt-0.5">สำรอง/กู้คืน</p>
          </div>
          {currentMode === 'BACKUP' && (
            <div className="ml-auto relative">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping absolute"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full relative z-10"></div>
            </div>
          )}
        </div>
      </button>
    </aside>
  );
};
