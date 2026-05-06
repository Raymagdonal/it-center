import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MaintenanceTicket, TicketStatus } from '../types';
import {
  Clock, CheckCircle2, AlertCircle, MapPin, Ticket, Video, Tablet, Printer,
  Smartphone, Monitor, Cable, Plug, Speaker, Mic, Radio, HelpCircle, Server, Zap,
  LayoutList, LayoutGrid, Table as TableIcon, Search, Filter,
  X, Maximize2, Camera, Folder, FolderOpen, ArrowLeft, Calendar, Trash2, FileSpreadsheet, ChevronRight, ChevronLeft, Edit, User
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface TicketListProps {
  tickets: MaintenanceTicket[];
  isAdmin?: boolean;
  onStatusUpdate?: (id: string, status: TicketStatus, completedDate?: string) => void;
  onDelete?: (id: string) => void;
  onFixedImageUpdate?: (id: string, fixedImageUrl: string | string[]) => void;
  onEdit?: (ticket: MaintenanceTicket) => void;
  onBatchDateUpdate?: (ticketIds: string[], newDate: string) => void;
}

interface GroupedTicketFolder {
  id: string;
  day: number;
  month: number;
  year: number;
  tickets: MaintenanceTicket[];
}

// --- Helpers ---

const getDeviceVisuals = (type: string) => {
  switch (type) {
    case 'TICKET_MACHINE': return { icon: Ticket, text: 'text-cyan-400', border: 'border-cyan-500/30', label: 'ตู้ขายตั๋ว', bg: 'bg-cyan-950/20' };
    case 'CCTV': return { icon: Video, text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', label: 'CCTV', bg: 'bg-fuchsia-950/20' };
    case 'CHARGER': return { icon: Zap, text: 'text-amber-400', border: 'border-amber-500/30', label: 'จุดชาร์จ', bg: 'bg-amber-950/20' };
    case 'MOBILE_TICKET': return { icon: Tablet, text: 'text-blue-400', border: 'border-blue-500/30', label: 'Mobile Ticket', bg: 'bg-blue-950/20' };
    case 'MOBILE_PRINTER': return { icon: Printer, text: 'text-indigo-400', border: 'border-indigo-500/30', label: 'Mobile Printer', bg: 'bg-indigo-950/20' };
    case 'SMARTPHONE': return { icon: Smartphone, text: 'text-sky-400', border: 'border-sky-500/30', label: 'Smartphone', bg: 'bg-sky-950/20' };
    case 'KIOSK': return { icon: Monitor, text: 'text-purple-400', border: 'border-purple-500/30', label: 'Kiosk', bg: 'bg-purple-950/20' };
    case 'CABLE_TYPE_C': return { icon: Cable, text: 'text-teal-400', border: 'border-teal-500/30', label: 'Type-C', bg: 'bg-teal-950/20' };
    case 'ADAPTER_5V': return { icon: Plug, text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'Adapter 5V', bg: 'bg-yellow-950/20' };
    case 'AMPLIFIER': return { icon: Speaker, text: 'text-orange-400', border: 'border-orange-500/30', label: 'Amplifier', bg: 'bg-orange-950/20' };
    case 'MICROPHONE': return { icon: Mic, text: 'text-rose-400', border: 'border-rose-500/30', label: 'Mic', bg: 'bg-rose-950/20' };
    case 'RADIO': return { icon: Radio, text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'วิทยุ', bg: 'bg-emerald-950/20' };
    case 'OTHER': return { icon: HelpCircle, text: 'text-slate-400', border: 'border-slate-500/30', label: 'อื่นๆ', bg: 'bg-slate-950/20' };
    default: return { icon: HelpCircle, text: 'text-blue-400', border: 'border-blue-500/30', label: type, bg: 'bg-slate-900' };
  }
};

const statusConfig = {
  PENDING: { color: 'text-amber-500 border-amber-500/50 bg-amber-950/20', icon: AlertCircle, label: 'รอ' },
  IN_PROGRESS: { color: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/20', icon: Clock, label: 'กำลังซ่อม' },
  COMPLETED: { color: 'text-green-500 border-green-500/50 bg-green-950/20', icon: CheckCircle2, label: 'เสร็จ' },
};

// Define shared props for ticket item sub-components to ensure type safety
interface TicketItemComponentProps {
  ticket: MaintenanceTicket;
  isAdmin?: boolean;
  onStatusUpdate?: (id: string, status: TicketStatus) => void;
  onDelete?: (id: string) => void;
  onZoom: (images: string[], index: number) => void;
  onFixedImageUpload: (ticketId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit?: (ticket: MaintenanceTicket) => void;
}

export const TicketList: React.FC<TicketListProps> = ({ tickets, isAdmin, onStatusUpdate, onDelete, initialFilter, onFixedImageUpdate, onEdit, onBatchDateUpdate }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID' | 'TABLE'>('LIST');
  const [isGrouped, setIsGrouped] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>(initialFilter || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'SEVERITY'>('NEWEST');
  const [zoomState, setZoomState] = useState<{ images: string[], currentIndex: number } | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isEditingBatchDate, setIsEditingBatchDate] = useState(false);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!zoomState) return;

      if (e.key === 'ArrowLeft') {
        setZoomState(prev => prev ? { ...prev, currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length } : null);
      } else if (e.key === 'ArrowRight') {
        setZoomState(prev => prev ? { ...prev, currentIndex: (prev.currentIndex + 1) % prev.images.length } : null);
      } else if (e.key === 'Escape') {
        setZoomState(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomState]);

  const handleZoom = (images: string[], index: number) => {
    setZoomState({ images, currentIndex: index });
  };

  useEffect(() => {
    if (initialFilter) {
      setFilterStatus(initialFilter);
    }
  }, [initialFilter]);

  // Basic Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets
      .filter(t => {
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
        const matchesSearch =
          (t.deviceId?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
          t.issueDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.location.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        if (sortBy === 'OLDEST') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        return 0;
      });
  }, [tickets, filterStatus, searchTerm, sortBy]);

  // Grouped Folders (Group strictly by Date)
  const groupedFolders = useMemo(() => {
    const folders: Record<string, GroupedTicketFolder> = {};

    filteredTickets.forEach(t => {
      const date = new Date(t.timestamp);
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const folderKey = `${year}-${month}-${day}`;

      if (!folders[folderKey]) {
        folders[folderKey] = {
          id: folderKey,
          day,
          month,
          year,
          tickets: []
        };
      }
      folders[folderKey].tickets.push(t);
    });

    // Sort folders by date descending
    return Object.values(folders).sort((a, b) => {
      const dateA = new Date(a.year, a.month, a.day).getTime();
      const dateB = new Date(b.year, b.month, b.day).getTime();
      return dateB - dateA;
    });
  }, [filteredTickets]);

  const activeFolder = useMemo(() =>
    groupedFolders.find(f => f.id === activeFolderId),
    [groupedFolders, activeFolderId]
  );

  // Safety Effect: If active folder disappears (e.g. filtered out), reset selection
  useEffect(() => {
    if (activeFolderId && !activeFolder) {
      setActiveFolderId(null);
    }
  }, [activeFolderId, activeFolder]);

  // Added explicit type union to handle switching between folder view and direct list view
  const displayedItems: (GroupedTicketFolder[] | MaintenanceTicket[]) = isGrouped && !activeFolderId ? groupedFolders : (activeFolderId ? activeFolder?.tickets || [] : filteredTickets);

  const exportToExcel = () => {
    if (!(window as any).XLSX) {
      alert("กำลังโหลดโมดูล Export กรุณาลองใหม่สักครู่");
      return;
    }
    const data = filteredTickets.map(t => ({
      'ID': t.id,
      'Device Type': t.deviceType,
      'Device ID': t.deviceId || '-',
      'Issue': t.issueDescription,
      'Location': t.location,
      'Status': t.status,
      'Reported Date': new Date(t.timestamp).toLocaleString('th-TH'),
      'Reporter': t.contactName || '-'
    }));
    const worksheet = (window as any).XLSX.utils.json_to_sheet(data);
    const workbook = (window as any).XLSX.utils.book_new();
    (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, "Maintenance Tickets");
    (window as any).XLSX.utils.writeFile(workbook, `TechFix_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleFixedImageChange = (ticketId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      let processedCount = 0;

      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            newImages.push(reader.result as string);
          }
          processedCount++;
          if (processedCount === files.length) {
            if (onFixedImageUpdate) {
              // If single file, pass strings for compat, or just pass array?
              // The prop is string | string[]. Let's pass array if multiple?
              // Actually App.tsx expects (id, img). I should update App.tsx first or handle it here.
              // Let's pass array always if I change App.tsx. Or pass the new images.
              // For now, let's pass the array of new images.
              onFixedImageUpdate(ticketId, newImages);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">

      {/* Zoom Modal with Navigation */}
      {zoomState && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-300"
          onClick={() => setZoomState(null)}
        >
          <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-20">
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Buttons */}
          {zoomState.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomState(prev => prev ? { ...prev, currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length } : null);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-20 hover:scale-110"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomState(prev => prev ? { ...prev, currentIndex: (prev.currentIndex + 1) % prev.images.length } : null);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-20 hover:scale-110"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="relative max-w-full max-h-full flex flex-col items-center">
            <img
              src={zoomState.images[zoomState.currentIndex]}
              alt="Zoomed"
              className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            {zoomState.images.length > 1 && (
              <div className="mt-4 px-4 py-1 bg-black/50 backdrop-blur rounded-full border border-white/10 text-white font-mono text-sm">
                {zoomState.currentIndex + 1} / {zoomState.images.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compact Header */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 shadow-sm">
        <div className="flex items-center gap-3">
          {activeFolderId ? (
            <button
              onClick={() => setActiveFolderId(null)}
              className="p-2 bg-black border border-cyan-500/50 text-cyan-400 rounded hover:bg-cyan-500/10 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className={`p-2 rounded bg-black border ${isAdmin ? 'border-cyan-500/50 text-cyan-400' : 'border-fuchsia-500/50 text-fuchsia-400'}`}>
              {isAdmin ? <Server className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight font-['Rajdhani'] uppercase leading-none">
                {activeFolderId && activeFolder ? (
                  <div className="flex items-center gap-2">
                    <span>วันที่:</span>
                    {isEditingBatchDate ? (
                      <input
                        type="date"
                        autoFocus
                        defaultValue={`${activeFolder.year}-${String(activeFolder.month + 1).padStart(2, '0')}-${String(activeFolder.day).padStart(2, '0')}`}
                        onBlur={() => setIsEditingBatchDate(false)}
                        onChange={(e) => {
                          if (onBatchDateUpdate && activeFolder) {
                            onBatchDateUpdate(activeFolder.tickets.map(t => t.id), e.target.value);
                            setIsEditingBatchDate(false);
                            // The folder ID will change, so we might want to clear or update it.
                            // But usually the parent update will trigger a re-grouping.
                            setActiveFolderId(null); 
                          }
                        }}
                        className="bg-black border border-cyan-500/50 text-cyan-400 text-xs px-2 py-1 rounded outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    ) : (
                      <button 
                        onClick={() => setIsEditingBatchDate(true)}
                        className="hover:text-cyan-400 transition-colors flex items-center gap-2 group/date"
                      >
                        {new Date(activeFolder.year, activeFolder.month, activeFolder.day).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <Edit className="w-3.5 h-3.5 opacity-0 group-hover/date:opacity-100" />
                      </button>
                    )}
                  </div>
                ) : (isAdmin ? 'System_Admin' : 'Status_Tracker')}
              </h2>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">
              {activeFolderId && activeFolder ? `BATCH_RECORDS_FOUND: ${activeFolder.tickets.length}` : (isAdmin ? 'TICKET_MANAGEMENT_CONSOLE' : 'USER_HISTORY_LOGS')}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!activeFolderId && (
            <button
              onClick={() => setIsGrouped(!isGrouped)}
              className={`h-8 px-3 rounded border text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${isGrouped ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
            >
              <Folder className="w-3.5 h-3.5" /> {isGrouped ? 'จัดกลุ่มตามวันที่' : 'ปิดจัดกลุ่ม'}
            </button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={exportToExcel}
            className="h-8 text-xs flex gap-2 bg-green-950/30 text-green-400 border-green-900/50 hover:bg-green-900/40 hover:border-green-500"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Excel Export</span>
          </Button>
        </div>
      </div>

      {/* Toolbar - Only show when not in folder view */}
      {!activeFolderId && (
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex flex-1 gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:max-w-xs group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหา ID, ปัญหา, สถานที่..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-black/50 border border-slate-700 rounded pl-9 pr-3 py-2 text-xs text-slate-200 focus:border-cyan-500 outline-none transition-all placeholder-slate-600"
              />
            </div>

            <div className="flex items-center gap-2 bg-black/50 border border-slate-700 rounded px-2">
              <Filter className="w-3 h-3 text-slate-500" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs text-slate-300 outline-none py-2 cursor-pointer"
              >
                <option value="ALL">สถานะ: ทั้งหมด</option>
                <option value="PENDING">รอซ่อม (Pending)</option>
                <option value="IN_PROGRESS">กำลังซ่อม (Fixing)</option>
                <option value="COMPLETED">เสร็จสิ้น (Done)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
              SHOWING: <span className="text-white font-bold">{isGrouped ? (displayedItems as GroupedTicketFolder[]).length : (displayedItems as MaintenanceTicket[]).length}</span> {isGrouped ? 'DAYS' : 'RECORDS'}
            </div>

            {!isGrouped && (
              <div className="flex bg-black rounded border border-slate-700 p-1 shrink-0">
                <button onClick={() => setViewMode('LIST')} className={`p-1.5 rounded transition-colors ${viewMode === 'LIST' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutList className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('GRID')} className={`p-1.5 rounded transition-colors ${viewMode === 'GRID' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('TABLE')} className={`p-1.5 rounded transition-colors ${viewMode === 'TABLE' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><TableIcon className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="min-h-[300px]">
        {displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 font-mono border border-dashed border-slate-800/50 rounded-lg">
            <Search className="w-8 h-8 mb-2 opacity-20" />
            <span>NO_MATCHING_RECORDS</span>
          </div>
        ) : (
          <>
            {isGrouped && !activeFolderId ? (
              /* Folder Grid View: Group by Date only */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(displayedItems as GroupedTicketFolder[]).map((folder: GroupedTicketFolder) => (
                  <TicketFolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={() => setActiveFolderId(folder.id)}
                  />
                ))}
              </div>
            ) : (
              /* Standard Item Views (Drill-down or No Grouping) */
              <>
                {viewMode === 'LIST' && (
                  <div className="space-y-2">
                    {(displayedItems as MaintenanceTicket[]).map((ticket: MaintenanceTicket) => (
                      <TicketListItem
                        key={ticket.id}
                        ticket={ticket}
                        isAdmin={isAdmin}
                        onStatusUpdate={onStatusUpdate}
                        onDelete={onDelete}
                        onZoom={handleZoom}
                        onFixedImageUpload={handleFixedImageChange}
                        onEdit={onEdit}
                      />
                    ))}
                  </div>
                )}

                {viewMode === 'GRID' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(displayedItems as MaintenanceTicket[]).map((ticket: MaintenanceTicket) => (
                      <TicketGridItem
                        key={ticket.id}
                        ticket={ticket}
                        isAdmin={isAdmin}
                        onStatusUpdate={onStatusUpdate}
                        onDelete={onDelete}
                        onZoom={handleZoom}
                        onFixedImageUpload={handleFixedImageChange}
                        onEdit={onEdit}
                      />
                    ))}
                  </div>
                )}

                {viewMode === 'TABLE' && (
                  <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-black/40 text-slate-500 uppercase tracking-wider font-mono">
                          <th className="p-3 pl-4">ID / Device</th>
                          <th className="p-3">Issue</th>
                          <th className="p-3">Location</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-center">Photos</th>
                          {isAdmin && <th className="p-3 text-right pr-4">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {(displayedItems as MaintenanceTicket[]).map((ticket: MaintenanceTicket) => (
                          <TicketTableRow
                            key={ticket.id}
                            ticket={ticket}
                            isAdmin={isAdmin}
                            onStatusUpdate={onStatusUpdate}
                            onDelete={onDelete}
                            onZoom={handleZoom}
                            onFixedImageUpload={handleFixedImageChange}
                            onEdit={onEdit}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- Sub Components ---

const TicketFolderCard: React.FC<{ folder: GroupedTicketFolder, onClick: () => void }> = ({ folder, onClick }) => {
  const dateObj = new Date(folder.year, folder.month, folder.day);
  const fullDateThai = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  const hasInProgress = folder.tickets.some(t => t.status === 'IN_PROGRESS');
  const hasPending = folder.tickets.some(t => t.status === 'PENDING');

  const uniqueTypes = Array.from(new Set(folder.tickets.map(t => t.deviceType)));
  const typeLabel = uniqueTypes.length > 1 ? `อุปกรณ์ ${uniqueTypes.length} ประเภท` : getDeviceVisuals(uniqueTypes[0] as string).label;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer relative"
    >
      <div className="absolute inset-0 bg-cyan-500 rounded-lg blur-xl opacity-0 group-hover:opacity-20 transition-all duration-500"></div>
      <div className={`relative bg-slate-900/60 border-2 ${hasPending ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : hasInProgress ? 'border-cyan-500/40' : 'border-slate-800'} rounded-lg p-5 flex flex-col items-center gap-3 hover:scale-105 transition-all duration-300 backdrop-blur-md hover:border-cyan-500/50`}>
        <div className="relative">
          <Folder className={`w-16 h-16 text-slate-700 group-hover:hidden transition-all duration-300 ${hasPending ? 'text-amber-500/60' : hasInProgress ? 'text-cyan-500/60' : ''}`} />
          <FolderOpen className={`w-16 h-16 text-cyan-400 hidden group-hover:block drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]`} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-2">
            <Calendar className="w-5 h-5 text-slate-950" />
          </div>
          {hasPending && (
            <div className="absolute -top-1 -right-1">
              <AlertCircle className="w-5 h-5 text-amber-500 fill-black" />
            </div>
          )}
        </div>

        <div className="text-center w-full">
          <h3 className="text-white font-bold text-lg font-display uppercase tracking-wider group-hover:text-cyan-300 transition-colors truncate">{fullDateThai}</h3>
          <div className="flex flex-col items-center gap-1 mt-1">
            <span className="text-[10px] font-mono font-bold uppercase text-cyan-500">{typeLabel}</span>
            <div className="mt-1">
              <span className={`text-[10px] px-2 py-1 rounded font-bold border bg-slate-950 border-slate-800 text-slate-400`}>
                {folder.tickets.length} รายการ
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 w-full pt-3 border-t border-slate-800/50 flex justify-between items-center">
          <span className="text-[8px] font-mono text-slate-600 uppercase">View Daily Batch</span>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
};

// Use properly typed props to prevent unknown type errors during function calls
const TicketListItem: React.FC<TicketItemComponentProps> = ({ ticket, isAdmin, onStatusUpdate, onDelete, onZoom, onFixedImageUpload, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const timerRef = useRef<any>(null);

  const visuals = getDeviceVisuals(ticket.deviceType);
  const status = statusConfig[ticket.status as keyof typeof statusConfig];
  const Icon = visuals.icon;

  const handlePressStart = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    timerRef.current = setTimeout(() => {
      if (onDelete) onDelete(ticket.id);
      setIsDeleting(false);
    }, 2000);
  };

  const handlePressEnd = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsDeleting(false);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusUpdate?.(ticket.id, e.target.value as TicketStatus);
  };

  return (
    <div className={`relative group border-l-[3px] ${visuals.border.replace('border', 'border-l')} bg-slate-900/40 border-y border-r border-slate-800/50 rounded-r-md hover:bg-slate-900 transition-all overflow-hidden`}>
      {onDelete && (
        <button
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onContextMenu={(e) => e.preventDefault()}
          className={`absolute top-0 bottom-0 right-0 w-8 flex items-center justify-center z-20 transition-all overflow-hidden ${isDeleting ? 'bg-red-500/10' : 'hover:bg-red-900/10'}`}
        >
          {isDeleting && (
            <div className="absolute inset-0 bg-red-500/10 flex flex-col justify-end">
              <div className="w-full bg-red-500/60 animate-delete-progress shadow-[0_0_10px_#ef4444]" />
            </div>
          )}
          <Trash2 className={`w-3 h-3 text-slate-600 group-hover:text-red-400 relative z-10 ${isDeleting ? 'text-red-500 animate-pulse' : ''}`} />
          {isDeleting && (
            <div className="absolute -left-20 bg-red-500 text-[8px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-right-2">
              กดค้าง 2 วิเพื่อลบ
            </div>
          )}
        </button>
      )}

      <div className="p-3 flex items-center gap-3 pr-8 relative z-10">
        <div className={`w-10 h-10 rounded bg-black border ${visuals.border} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${visuals.text}`} />
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
          <div className="md:col-span-4 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-200 truncate font-['Rajdhani'] uppercase">{visuals.label}</span>
              <span className="text-[10px] text-slate-500 font-mono">#{ticket.deviceId}</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 truncate">
                <MapPin className="h-2.5 w-2.5 text-cyan-600" /> {ticket.location}
              </div>
              <span className="text-[10px] text-slate-600">|</span>
              <div className="text-[10px] text-slate-500 truncate">
                {new Date(ticket.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {ticket.contactName && (
                <>
                  <span className="text-[10px] text-slate-600">|</span>
                  <div className="text-[10px] text-slate-400 font-mono truncate flex items-center gap-1">
                    <User className="h-2.5 w-2.5 text-slate-500" /> {ticket.contactName}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-5 min-w-0">
            <p className="text-xs text-slate-400 line-clamp-2 md:line-clamp-1 border-l-2 border-slate-800 pl-2 font-['Sarabun']">
              {ticket.issueDescription}
            </p>
          </div>

          <div className="md:col-span-3 flex items-center justify-end gap-3">
            {onEdit && (
              <button
                onClick={() => onEdit(ticket)}
                className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/30 rounded transition-all"
                title="แก้ไข"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {isAdmin && onStatusUpdate && (
              <div className="flex items-center gap-2">
                <select
                  value={ticket.status}
                  onChange={handleStatusChange}
                  className="text-[10px] h-6 bg-black border border-slate-700 text-cyan-400 rounded px-1 focus:border-cyan-500 outline-none cursor-pointer uppercase font-bold max-w-[90px]"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">FIXING</option>
                  <option value="COMPLETED">DONE</option>
                </select>
                {ticket.status === 'COMPLETED' && (
                  <input
                    type="date"
                    value={ticket.completedDate || ''}
                    onChange={(e) => onStatusUpdate(ticket.id, ticket.status, e.target.value)}
                    className="text-[10px] h-6 bg-black border border-green-500/30 text-green-400 rounded px-1 focus:border-green-500 outline-none cursor-pointer w-28"
                    title="วันที่ซ่อมเสร็จ"
                  />
                )}
              </div>
            )}

            {/* Separated Image Sections */}
            <div className="flex items-center gap-2">
              {/* BEFORE Section */}
              {ticket.imageUrls && ticket.imageUrls.length > 0 && (
                <ImageScrollGallery
                  images={ticket.imageUrls}
                  onZoom={onZoom}
                  theme="cyan"
                  label="Before"
                />
              )}

              {/* AFTER Section */}
              <ImageScrollGallery
                images={ticket.fixedImageUrls || (ticket.fixedImageUrl ? [ticket.fixedImageUrl] : [])}
                onZoom={onZoom}
                theme="green"
                label="After"
              >
                {isAdmin && ticket.status === 'COMPLETED' && (
                  <>
                    <input type="file" id={`fixed-${ticket.id}`} className="hidden" accept="image/*" multiple onChange={(e) => onFixedImageUpload(ticket.id, e)} />
                    <button
                      onClick={() => document.getElementById(`fixed-${ticket.id}`)?.click()}
                      className="w-7 h-7 flex items-center justify-center bg-green-500/10 text-green-500 border border-green-500/30 rounded hover:bg-green-500/20 transition-all shrink-0"
                      title="เพิ่มรูปภาพหลังซ่อม"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </>
                )}
              </ImageScrollGallery>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ImageScrollGalleryProps {
  images: string[];
  onZoom: (images: string[], index: number) => void;
  theme: 'cyan' | 'green';
  label: string;
  children?: React.ReactNode;
}

const ImageScrollGallery: React.FC<ImageScrollGalleryProps> = ({ images, onZoom, theme, label, children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalItems = images.length + (children ? 1 : 0);
  const showArrows = totalItems > 2;
  const isCyan = theme === 'cyan';
  const colorClass = isCyan ? 'text-cyan-500 border-cyan-500/20 bg-cyan-950/10' : 'text-green-500 border-green-500/20 bg-green-950/10';
  const arrowHoverClass = isCyan ? 'hover:bg-cyan-500/20 hover:text-cyan-400' : 'hover:bg-green-500/20 hover:text-green-400';
  const borderClass = isCyan ? 'border-cyan-500/30 hover:border-cyan-400' : 'border-green-500/30 hover:border-green-400';

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 60;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  if (totalItems === 0 && !children) return null;

  return (
    <div className="flex flex-col items-center gap-1 relative group/gallery">
      <span className={`text-[8px] font-bold uppercase tracking-wider ${isCyan ? 'text-cyan-500' : 'text-green-500'}`}>{label}</span>

      <div className="relative flex items-center">
        {showArrows && (
          <button
            onClick={() => scroll('left')}
            className={`absolute -left-3 z-10 w-4 h-full flex items-center justify-center text-slate-500 ${arrowHoverClass} transition-colors opacity-0 group-hover/gallery:opacity-100`}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        )}

        <div
          ref={scrollRef}
          className={`flex gap-1 shrink-0 items-center overflow-x-auto max-w-[65px] custom-scrollbar-hidden p-0.5 border rounded scroll-smooth ${colorClass} ${showArrows ? 'px-1' : ''}`}
          style={{ scrollbarWidth: 'none' }}
        >
          {images.map((url, idx) => (
            <div
              key={idx}
              onClick={() => onZoom(images, idx)}
              className={`w-7 h-7 rounded border overflow-hidden relative shrink-0 cursor-pointer bg-black ${borderClass}`}
            >
              <img src={url} alt={`${label}-${idx}`} className="w-full h-full object-cover" />
            </div>
          ))}
          {children}
        </div>

        {showArrows && (
          <button
            onClick={() => scroll('right')}
            className={`absolute -right-3 z-10 w-4 h-full flex items-center justify-center text-slate-500 ${arrowHoverClass} transition-colors opacity-0 group-hover/gallery:opacity-100`}
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

// Apply properly typing to TicketGridItem
const TicketGridItem: React.FC<TicketItemComponentProps> = ({ ticket, isAdmin, onStatusUpdate, onDelete, onZoom, onFixedImageUpload, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const timerRef = useRef<any>(null);
  const visuals = getDeviceVisuals(ticket.deviceType);
  const status = statusConfig[ticket.status as keyof typeof statusConfig];
  const Icon = visuals.icon;

  const handlePressStart = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    timerRef.current = setTimeout(() => {
      if (onDelete) onDelete(ticket.id);
      setIsDeleting(false);
    }, 2000);
  };

  const handlePressEnd = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsDeleting(false);
  };

  return (
    <Card className="flex flex-col h-full border-t-[3px] overflow-hidden group/card" style={{ borderTopColor: visuals.text.includes('cyan') ? '#22d3ee' : visuals.text.includes('fuchsia') ? '#e879f9' : '#fbbf24' }}>
      <div className="relative h-40 bg-slate-950 border-b border-slate-800">
        <div className="flex h-full">
          {ticket.imageUrls && ticket.imageUrls.length > 0 ? (
            <div className="flex-1 relative cursor-zoom-in" onClick={() => {
              if (ticket.imageUrls && ticket.imageUrls.length > 0) onZoom(ticket.imageUrls, 0);
            }}>
              <img src={ticket.imageUrls[0]} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" alt="before" />
              <div className="absolute bottom-1 left-1 bg-black/60 px-1 rounded text-[8px] text-white font-mono">BEFORE {ticket.imageUrls.length > 1 ? `(+${ticket.imageUrls.length - 1})` : ''}</div>
            </div>
          ) : (
            <div className={`flex-1 flex items-center justify-center ${visuals.bg}`}>
              <Icon className={`w-10 h-10 ${visuals.text} opacity-50`} />
            </div>
          )}

          {(ticket.fixedImageUrl || (ticket.fixedImageUrls && ticket.fixedImageUrls.length > 0)) && (
            /* Use guard for optional string */
            <div className="flex-1 relative border-l border-slate-800 cursor-zoom-in" onClick={() => {
              const images = ticket.fixedImageUrls || (ticket.fixedImageUrl ? [ticket.fixedImageUrl] : []);
              if (images.length > 0) onZoom(images, 0);
            }}>
              <img src={ticket.fixedImageUrls?.[0] || ticket.fixedImageUrl} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" alt="after" />
              <div className="absolute bottom-1 left-1 bg-green-900/60 px-1 rounded text-[8px] text-white font-mono">
                AFTER {ticket.fixedImageUrls && ticket.fixedImageUrls.length > 1 ? `(+${ticket.fixedImageUrls.length - 1})` : ''}
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(ticket); }}
                className="px-2 py-1 rounded text-[10px] font-bold uppercase shadow-lg bg-black/80 backdrop-blur-sm text-slate-300 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/50 transition-all"
              >
                EDIT
              </button>
            )}
            <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase shadow-lg ${status.color} bg-black/80 backdrop-blur-sm`}>
              {status.label}
            </span>
          </div>
          {isAdmin && ticket.status === 'COMPLETED' && (
            <>
              <input type="file" id={`fixed-grid-${ticket.id}`} className="hidden" accept="image/*" multiple onChange={(e) => onFixedImageUpload(ticket.id, e)} />
              <button
                onClick={() => document.getElementById(`fixed-grid-${ticket.id}`)?.click()}
                className="p-2 bg-green-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                title="เพิ่มรูปซ่อมเสร็จ"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {onDelete && (
          <button
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onContextMenu={(e) => e.preventDefault()}
            className={`absolute top-2 left-2 p-1.5 rounded transition-all border overflow-hidden ${isDeleting ? 'bg-red-950 border-red-500' : 'bg-black/50 hover:bg-red-900/80 border-slate-700 opacity-0 group-hover/card:opacity-100'}`}
          >
            {isDeleting && (
              <div className="absolute inset-0 flex flex-col justify-end">
                <div className="w-full bg-red-500/60 animate-delete-progress" />
              </div>
            )}
            <Trash2 className={`w-3 h-3 text-white relative z-10 ${isDeleting ? 'animate-pulse' : ''}`} />
          </button>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-bold text-slate-200 font-['Rajdhani'] uppercase tracking-wide">{visuals.label}</h4>
            <div className="text-[10px] text-cyan-600 font-mono">#{ticket.deviceId}</div>
          </div>
        </div>
        <p className="text-xs text-slate-400 line-clamp-3 mb-4 flex-1 font-['Sarabun']">{ticket.issueDescription}</p>

        <div className="mt-auto space-y-2 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            <MapPin className="w-3 h-3 text-slate-600" /> {ticket.location}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Apply properly typing to TicketTableRow
const TicketTableRow: React.FC<TicketItemComponentProps> = ({ ticket, isAdmin, onStatusUpdate, onDelete, onZoom, onFixedImageUpload, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const timerRef = useRef<any>(null);
  const visuals = getDeviceVisuals(ticket.deviceType);
  const status = statusConfig[ticket.status as keyof typeof statusConfig];

  const handlePressStart = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    timerRef.current = setTimeout(() => {
      if (onDelete) onDelete(ticket.id);
      setIsDeleting(false);
    }, 2000);
  };

  const handlePressEnd = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsDeleting(false);
  };

  return (
    <tr className="hover:bg-slate-800/30 transition-colors group">
      <td className="p-3 pl-4">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${visuals.text.replace('text', 'bg')}`}></div>
          <div>
            <div className="font-bold text-slate-300 text-xs uppercase font-['Rajdhani']">{visuals.label}</div>
            <div className="text-[10px] text-slate-500 font-mono">#{ticket.deviceId}</div>
          </div>
        </div>
      </td>
      <td className="p-3">
        <div className="text-xs text-slate-400 truncate max-w-[150px]" title={ticket.issueDescription}>{ticket.issueDescription}</div>
      </td>
      <td className="p-3">
        <div className="text-xs text-slate-500 font-mono truncate max-w-[100px]">{ticket.location}</div>
      </td>
      <td className="p-3">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase ${status.color} bg-transparent`}>
          {status.label}
        </span>
      </td>
      <td className="p-3">
        <div className="flex justify-center gap-2">
          {ticket.imageUrls && ticket.imageUrls.length > 0 ? (
            <button onClick={() => {
              if (ticket.imageUrls && ticket.imageUrls.length > 0) onZoom(ticket.imageUrls, 0);
            }} className="text-slate-500 hover:text-cyan-400 relative">
              <Maximize2 className="w-3.5 h-3.5" />
              {ticket.imageUrls.length > 1 && <span className="absolute -top-1 -right-1 bg-cyan-500 text-black text-[7px] font-bold rounded-full w-2.5 h-2.5 flex items-center justify-center">{ticket.imageUrls.length}</span>}
            </button>
          ) : '-'}
          {(ticket.fixedImageUrl || (ticket.fixedImageUrls && ticket.fixedImageUrls.length > 0)) ? (
            /* Use guard for optional string */
            <button onClick={() => {
              const images = ticket.fixedImageUrls || (ticket.fixedImageUrl ? [ticket.fixedImageUrl] : []);
              if (images.length > 0) onZoom(images, 0);
            }} className="text-slate-500 hover:text-green-400 relative">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {ticket.fixedImageUrls && ticket.fixedImageUrls.length > 1 && <span className="absolute -top-1 -right-1 bg-green-500 text-black text-[7px] font-bold rounded-full w-2.5 h-2.5 flex items-center justify-center">{ticket.fixedImageUrls.length}</span>}
            </button>
          ) : (isAdmin && ticket.status === 'COMPLETED' && (
            <>
              <input type="file" id={`fixed-table-${ticket.id}`} className="hidden" accept="image/*" multiple onChange={(e) => onFixedImageUpload(ticket.id, e)} />
              <button onClick={() => document.getElementById(`fixed-table-${ticket.id}`)?.click()} className="text-slate-600 hover:text-green-500">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </>
          ))}
          {/* Allow adding more even if exists in table view logic? Table is compact. Maybe just show list if clicked? For now, if images exist, click zooms. If admin wants to add MORE, they need a way. */}
          {/* In table view, adding more after one exists is harder with current UI. Let's just allow adding if NONE exist, OR if user is admin and wants to append. But the icon changes to CheckCircle if exists. */}
          {/* Let's keep it simple: if exists, show View. If absent, show Add. To add MORE, use List/Grid view. */}
        </div>
      </td>
      {isAdmin && (
        <td className="p-3 pr-4 text-right">
          <div className="flex justify-end gap-2">
            {onEdit && (
              <button onClick={() => onEdit(ticket)} className="text-slate-500 hover:text-cyan-400 p-1">
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                onContextMenu={(e) => e.preventDefault()}
                className={`relative p-2 rounded transition-all overflow-hidden ${isDeleting ? 'bg-red-950 text-red-500' : 'text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100'}`}
                title="Hold to Delete"
              >
                {isDeleting && (
                  <div className="absolute inset-0 flex flex-col justify-end">
                    <div className="w-full bg-red-500/40 animate-delete-progress" />
                  </div>
                )}
                <Trash2 className={`w-3.5 h-3.5 relative z-10 ${isDeleting ? 'animate-pulse' : ''}`} />
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}