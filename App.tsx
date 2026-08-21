
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Landing } from './components/Landing';
import { ReportForm } from './components/ReportForm';
import { TicketList } from './components/TicketList';
import { InventoryManager } from './components/InventoryManager';
import { MaritimeManager } from './components/MaritimeManager';
import { MeetingReportManager } from './components/MeetingReportManager';
import { BackupManager } from './components/BackupManager';
import { Sathorn3D } from './components/Sathorn3D';
import { AssetTracker } from './components/AssetTracker';
import { TicketMachineManager } from './components/TicketMachineManager';
import { MediaMap } from './components/MediaMap';
import { SimAisManager } from './components/SimAisManager';
import { CalendarManager } from './components/CalendarManager';
import { RadioManager, RadioData } from './components/RadioManager';
import { ViabusManager, ViabusData } from './components/ViabusManager';
import { CctvManager, CctvData } from './components/CctvManager';
import { SaveIndicator } from './components/SaveIndicator';
import { Activity } from 'lucide-react';
import { safeSetItem, STORAGE_KEYS, checkStorageQuota, idbGet } from './utils/storageUtils';
import { fetchAllData, saveAllData, AppData } from './services/syncService';

import { AppMode, MaintenanceTicket, StockItem, MaritimeItem, TrackedAsset, MeetingReport, ProcurementFolder, InventorySelection, SimCard, TicketMachine } from './types';
import {
  INITIAL_TICKETS,
  INITIAL_STOCK,
  INITIAL_TRACKED_ASSETS,
  INITIAL_MARITIME,
  INITIAL_REPORTS,
  INITIAL_PROCUREMENT_FOLDERS,
  INITIAL_SIM_CARDS,
  INITIAL_TICKET_MACHINES,
  INITIAL_RADIO_DATA,
  INITIAL_VIABUS_DATA,
  INITIAL_CCTV_DATA,
} from './initialData';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('HOME');
  const [ticketFilter, setTicketFilter] = useState<string>('ALL');
  const [targetedAssetSn, setTargetedAssetSn] = useState<string | null>(null);
  const [inventorySelection, setInventorySelection] = useState<InventorySelection | null>(null);
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);

  // Save indicator state
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newTicketsCount, setNewTicketsCount] = useState(0);
  const prevTicketsCountRef = React.useRef<number>(0);
  const isIncomingSyncRef = React.useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // State initialization
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => {
    const saved = localStorage.getItem('techfix_tickets');
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('techfix_stock');
    return saved ? JSON.parse(saved) : INITIAL_STOCK;
  });

  const [trackedAssets, setTrackedAssets] = useState<TrackedAsset[]>(() => {
    const saved = localStorage.getItem('techfix_tracked_assets');
    return saved ? JSON.parse(saved) : INITIAL_TRACKED_ASSETS;
  });

  const [maritimeItems, setMaritimeItems] = useState<MaritimeItem[]>(() => {
    const saved = localStorage.getItem('techfix_maritime');
    return saved ? JSON.parse(saved) : INITIAL_MARITIME;
  });

  const [meetingReports, setMeetingReports] = useState<MeetingReport[]>(() => {
    const saved = localStorage.getItem('techfix_meeting_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [procurementFolders, setProcurementFolders] = useState<ProcurementFolder[]>(() => {
    const saved = localStorage.getItem('techfix_procurement_folders');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate legacy folders and use defaults if empty
      if (parsed.length === 0) return INITIAL_PROCUREMENT_FOLDERS;
      return parsed.map((folder: any) => ({
        ...folder,
        month: folder.month !== undefined ? folder.month : 0
      }));
    }
    return INITIAL_PROCUREMENT_FOLDERS;
  });

  const [simCards, setSimCards] = useState<SimCard[]>(() => {
    const saved = localStorage.getItem('techfix_sim_cards');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_SIM_CARDS;
  });

  const [ticketMachines, setTicketMachines] = useState<TicketMachine[]>(() => {
    const saved = localStorage.getItem('techfix_ticket_machines');
    return saved ? JSON.parse(saved) : INITIAL_TICKET_MACHINES;
  });

  const [radioData, setRadioData] = useState<RadioData>(() => {
    const saved = localStorage.getItem('techfix_radio_data');
    return saved ? JSON.parse(saved) : INITIAL_RADIO_DATA;
  });

  const [viabusData, setViabusData] = useState<ViabusData>(() => {
    const saved = localStorage.getItem('techfix_viabus_data');
    return saved ? JSON.parse(saved) : INITIAL_VIABUS_DATA;
  });

  const [cctvData, setCctvData] = useState<CctvData>(() => {
    const saved = localStorage.getItem('techfix_cctv_data');
    return saved ? JSON.parse(saved) : INITIAL_CCTV_DATA;
  });


  const syncWithGoogleSheetsDirect = async () => {
    try {
      const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1M6f-xHA9E0mqdTbvIFkROLbL4d6gJaC0JC8QRhHYmh0/export?format=csv&gid=2077750642';
      const response = await fetch(SHEET_CSV_URL);
      if (!response.ok) return [];
      const csv = await response.text();
      const lines = csv.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length <= 1) return [];

      const newTickets: MaintenanceTicket[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, ''));
        const [timestamp, reporter, message, , , , rawStatus] = parts;
        if (!message || !reporter) continue;
        
        let status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' = 'PENDING';
        if (rawStatus) {
          if (rawStatus.includes('กำลังแก้ไข')) status = 'IN_PROGRESS';
          else if (rawStatus.includes('เสร็จ') || rawStatus.includes('เรียบร้อย')) status = 'COMPLETED';
        }

        newTickets.push({
          id: `sheet_direct_${reporter}_${i}`, // Using a stable ID base if possible
          deviceType: 'EXTERNAL',
          deviceId: 'SHEET_FORM',
          issueDescription: message,
          contactName: reporter,
          status,
          timestamp: new Date(timestamp || Date.now()).toISOString(),
          location: 'แจ้งผ่าน Google Form',
          // We can attach the raw status if needed, but standard status is fine
        });
      }
      return newTickets;
    } catch (e) {
      return [];
    }
  };

  // 🔄 Initial Sync from Backend (Render)
  const syncFromBackend = useCallback(async (isPolling = false) => {
    isIncomingSyncRef.current = true;
    const remoteData = await fetchAllData();
    const sheetTickets = await syncWithGoogleSheetsDirect();

    setTickets(prevTickets => {
      const remoteTickets = remoteData?.tickets || [];
      let combinedTickets = [...prevTickets];
      let changesDetected = 0;
      
      // 1. Update from remote backend data
      remoteTickets.forEach(rt => {
        const idx = combinedTickets.findIndex(t => t.id === rt.id);
        if (idx >= 0) {
          if (combinedTickets[idx].status !== rt.status) {
            combinedTickets[idx] = { ...combinedTickets[idx], ...rt };
            changesDetected++;
          }
        } else {
          combinedTickets = [rt, ...combinedTickets];
          changesDetected++;
        }
      });

      // 2. Merge sheet tickets
      sheetTickets.forEach(st => {
        const existingIndex = combinedTickets.findIndex(t => 
          t.issueDescription === st.issueDescription && t.contactName === st.contactName
        );
        
        if (existingIndex >= 0) {
          // Check if status changed
          if (combinedTickets[existingIndex].status !== st.status && combinedTickets[existingIndex].deviceId === 'SHEET_FORM') {
            combinedTickets[existingIndex] = { ...combinedTickets[existingIndex], status: st.status };
            changesDetected++;
          }
        } else {
          // New ticket from sheet
          combinedTickets = [st, ...combinedTickets];
          changesDetected++;
        }
      });

      // Avoid showing notification popup again as requested
      // The notification popup was removed, but we keep the logical counter just in case
      const currentCount = prevTickets.length;
      if (changesDetected > 0 && currentCount > 0) {
        setNewTicketsCount(prev => prev + changesDetected);
      }
      
      return combinedTickets;
    });

    if (remoteData) {
      if (remoteData.stock?.length) setStockItems(remoteData.stock);
      if (remoteData.assets?.length) setTrackedAssets(remoteData.assets);
      if (remoteData.maritime?.length) setMaritimeItems(remoteData.maritime);
      if (remoteData.reports?.length) setMeetingReports(remoteData.reports);
      if (remoteData.folders?.length) setProcurementFolders(remoteData.folders);
      if (Array.isArray(remoteData.simCards) && remoteData.simCards.length > 0) setSimCards(remoteData.simCards);
      if (Array.isArray(remoteData.ticketMachines) && remoteData.ticketMachines.length > 0) setTicketMachines(remoteData.ticketMachines);
      if (remoteData.radioData) setRadioData(remoteData.radioData);
      if (remoteData.viabusData) setViabusData(remoteData.viabusData);
      if (remoteData.cctvData) setCctvData(remoteData.cctvData);
      
      if (!isPolling) console.log('✅ Backend + Sheet Data Sync Complete');
    }
    
    setIsInitialized(true);
    // Wait for state updates to settle before allowing saves
    setTimeout(() => {
      isIncomingSyncRef.current = false;
    }, 1000);
  }, []);

  useEffect(() => {
    // Initial sync
    syncFromBackend();

    // Setup Socket.IO for real-time updates
    import('socket.io-client').then(({ io }) => {
      const SERVER_URL = import.meta.env.VITE_API_URL || 'https://it-center-i291.onrender.com';
      console.log(`🔌 Connecting Socket.IO to: ${SERVER_URL}`);
      
      const socket = io(SERVER_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('✅ Socket.IO connected:', socket.id);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket.IO disconnected:', reason);
      });

      socket.on('database_updated', (remoteData) => {
        console.log('⚡ Real-time update received from server');
        isIncomingSyncRef.current = true;

        // Sync all data (including empty arrays to clear stale data)
        if (remoteData.stock !== undefined) setStockItems(remoteData.stock);
        if (remoteData.assets !== undefined) setTrackedAssets(remoteData.assets);
        if (remoteData.maritime !== undefined) setMaritimeItems(remoteData.maritime);
        if (remoteData.reports !== undefined) setMeetingReports(remoteData.reports);
        if (remoteData.folders !== undefined) setProcurementFolders(remoteData.folders);
        if (Array.isArray(remoteData.simCards) && remoteData.simCards.length > 0) setSimCards(remoteData.simCards);
        if (Array.isArray(remoteData.ticketMachines) && remoteData.ticketMachines.length > 0) setTicketMachines(remoteData.ticketMachines);
        if (remoteData.radioData !== undefined) setRadioData(remoteData.radioData);
        if (remoteData.viabusData !== undefined) setViabusData(remoteData.viabusData);
        if (remoteData.cctvData !== undefined) setCctvData(remoteData.cctvData);
        
        // Merge tickets (keep local tickets not yet on server)
        setTickets(prevTickets => {
          const remoteTickets: any[] = remoteData.tickets || [];
          let combinedTickets = [...prevTickets];
          
          remoteTickets.forEach((rt: any) => {
            const idx = combinedTickets.findIndex(t => t.id === rt.id);
            if (idx >= 0) {
              combinedTickets[idx] = { ...combinedTickets[idx], ...rt };
            } else {
              combinedTickets = [rt, ...combinedTickets];
            }
          });
          return combinedTickets;
        });

        setTimeout(() => {
          isIncomingSyncRef.current = false;
        }, 1000);
      });

      return () => {
        socket.disconnect();
      };
    }).catch(err => console.error('Failed to load socket.io-client', err));

    // Poll Google Sheets specifically every 30 seconds since it doesn't emit websockets
    const pollInterval = setInterval(() => {
      syncWithGoogleSheetsDirect().then(sheetTickets => {
        if (sheetTickets.length === 0) return;
        setTickets(prevTickets => {
          let combinedTickets = [...prevTickets];
          let changed = false;
          sheetTickets.forEach(st => {
            const existingIndex = combinedTickets.findIndex(t => 
              t.issueDescription === st.issueDescription && t.contactName === st.contactName
            );
            if (existingIndex >= 0) {
              if (combinedTickets[existingIndex].status !== st.status && combinedTickets[existingIndex].deviceId === 'SHEET_FORM') {
                combinedTickets[existingIndex] = { ...combinedTickets[existingIndex], status: st.status };
                changed = true;
              }
            } else {
              combinedTickets = [st, ...combinedTickets];
              changed = true;
            }
          });
          return changed ? combinedTickets : prevTickets;
        });
      });
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [syncFromBackend]);

  // Persistence with error handling and save indicator
  useEffect(() => {
    const saveData = async () => {
      // Don't save until we've fetched the latest from the server
      // and don't save if the change came from a remote sync
      if (!isInitialized || isIncomingSyncRef.current) return;

      setIsSaving(true);
      setSaveError(null);

      try {
        // 1. Save to LocalStorage & IndexedDB (for offline cache)
        const results = [
          safeSetItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets)),
          safeSetItem(STORAGE_KEYS.STOCK, JSON.stringify(stockItems)),
          safeSetItem(STORAGE_KEYS.TRACKED_ASSETS, JSON.stringify(trackedAssets)),
          safeSetItem(STORAGE_KEYS.MARITIME, JSON.stringify(maritimeItems)),
          safeSetItem(STORAGE_KEYS.MEETING_REPORTS, JSON.stringify(meetingReports)),
          safeSetItem(STORAGE_KEYS.PROCUREMENT_FOLDERS, JSON.stringify(procurementFolders)),
          safeSetItem(STORAGE_KEYS.SIM_CARDS, JSON.stringify(simCards)),
          safeSetItem(STORAGE_KEYS.TICKET_MACHINES, JSON.stringify(ticketMachines)),
          safeSetItem(STORAGE_KEYS.RADIO_DATA, JSON.stringify(radioData)),
          safeSetItem(STORAGE_KEYS.VIABUS_DATA, JSON.stringify(viabusData)),
          safeSetItem(STORAGE_KEYS.CCTV_DATA, JSON.stringify(cctvData)),
        ];

        // 2. Save to Backend (Render) - Expanded Storage
        const appData: AppData = {
          tickets,
          stock: stockItems,
          assets: trackedAssets,
          maritime: maritimeItems,
          reports: meetingReports,
          folders: procurementFolders,
          simCards,
          ticketMachines,
          radioData,
          viabusData,
          cctvData
        } as any;
        const backendSuccess = await saveAllData(appData);

        // Check for any errors
        const errors = results.filter(r => !r.success);
        if (errors.length > 0 && !backendSuccess) {
          setSaveError(errors[0].error || 'เกิดข้อผิดพลาดในการบันทึก');
          console.error('Storage errors:', errors);
        } else {
          setLastSavedTime(new Date());
        }

        // Check storage quota
        const quotaInfo = await checkStorageQuota();
        if (quotaInfo.isNearFull) {
          console.warn('Storage is near full:', quotaInfo);
        }
      } catch (error) {
        console.error('Failed to save data:', error);
        setSaveError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce saving to avoid too frequent writes
    const timeoutId = setTimeout(saveData, 300);
    return () => clearTimeout(timeoutId);
  }, [tickets, stockItems, trackedAssets, maritimeItems, meetingReports, procurementFolders, simCards, ticketMachines, radioData, viabusData, cctvData]);

  // Handlers
  const handleNavigate = (newMode: AppMode, filter: string = 'ALL') => {
    setTicketFilter(filter);
    setMode(newMode);
    setEditingTicket(null); // Clear editing state on navigation
    if (newMode !== 'ASSET_TRACKING') setTargetedAssetSn(null);
  };

  const handleEditTicket = (ticket: MaintenanceTicket) => {
    setEditingTicket(ticket);
    setMode('REPORT');
  };

  const handleTicketSubmit = (ticketData: Omit<MaintenanceTicket, 'id' | 'status'>, editId?: string) => {
    if (editId) {
      setTickets(tickets.map(t => t.id === editId ? { ...t, ...ticketData } : t));
      setEditingTicket(null);
    } else {
      const newTicket: MaintenanceTicket = {
        ...ticketData,
        id: Math.random().toString(36).substr(2, 9),
        status: 'PENDING',
        timestamp: ticketData.timestamp || new Date().toISOString(),
      };
      setTickets([newTicket, ...tickets]);
    }
    handleNavigate('TRACK', 'ALL');
  };

  const handleBatchDateUpdate = (ticketIds: string[], newDateStr: string) => {
    const [y, m, d] = newDateStr.split('-').map(Number);
    setTickets(prevTickets => prevTickets.map(t => {
      if (ticketIds.includes(t.id)) {
        const oldDate = new Date(t.timestamp);
        const newDate = new Date(oldDate);
        newDate.setFullYear(y);
        newDate.setMonth(m - 1);
        newDate.setDate(d);
        return { ...t, timestamp: newDate.toISOString() };
      }
      return t;
    }));
  };

  const handleLocateAsset = (sn: string) => {
    const asset = trackedAssets.find(a => a.sn === sn);
    if (asset) {
      setTargetedAssetSn(asset.id);
      setMode('ASSET_TRACKING');
    }
  };

  const handleStockToAsset = (item: StockItem) => {
    const newAsset: TrackedAsset = {
      id: Math.random().toString(36).substr(2, 9),
      sn: `STOCK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: item.name,
      location: 'คลังพัสดุ (Stock Room)',
      locationType: 'PORT',
      username: 'เจ้าหน้าที่คลัง',
      installedDate: item.lastPurchaseDate,
      status: 'SPARE',
      purchaseDate: item.lastPurchaseDate,
      price: item.pricePerUnit,
      source: item.supplier,
      model: item.category,
      notes: `Imported from Procurement. Qty: ${item.quantity}`
    };
    setTrackedAssets(prev => [newAsset, ...prev]);
    alert(`เพิ่มรายการ "${item.name}" เข้าสู่ระบบเช็คตำแหน่งแล้ว (Tracking ID: ${newAsset.sn})`);
  };

  const handleRestore = async (data: any) => {
    isIncomingSyncRef.current = true; // Lock incoming sync during restoration
    
    // Normalize every module with robust fallbacks
    const newTickets = data.tickets || tickets;
    const newStock = data.stock || stockItems;
    const newMaritime = data.maritime || maritimeItems;
    const newAssets = data.trackedAssets || data.assets || trackedAssets;
    const newFolders = data.procurementFolders || data.folders || procurementFolders;
    const newSimCards = data.simCards || simCards;
    const newTicketMachines = data.ticketMachines || ticketMachines;
    const newRadioData = data.radioData ? {
      faultLogs: Array.isArray(data.radioData.faultLogs) ? data.radioData.faultLogs : (radioData.faultLogs || []),
      signalLogs: Array.isArray(data.radioData.signalLogs) ? data.radioData.signalLogs : (radioData.signalLogs || [])
    } : radioData;
    const newViabusData = data.viabusData ? {
      faultLogs: Array.isArray(data.viabusData.faultLogs) ? data.viabusData.faultLogs : (viabusData.faultLogs || []),
      signalLogs: Array.isArray(data.viabusData.signalLogs) ? data.viabusData.signalLogs : (viabusData.signalLogs || [])
    } : viabusData;
    const newCctvData = data.cctvData ? {
      cameras: Array.isArray(data.cctvData.cameras) ? data.cctvData.cameras : (cctvData.cameras || []),
      faultLogs: Array.isArray(data.cctvData.faultLogs) ? data.cctvData.faultLogs : (cctvData.faultLogs || [])
    } : cctvData;
    const newReports = data.meetingReports || data.reports || meetingReports;

    // 1. Immediately update React state
    if (data.tickets) setTickets(newTickets);
    if (data.stock) setStockItems(newStock);
    if (data.maritime) setMaritimeItems(newMaritime);
    if (data.trackedAssets || data.assets) setTrackedAssets(newAssets);
    if (data.procurementFolders || data.folders) setProcurementFolders(newFolders);
    if (data.simCards) setSimCards(newSimCards);
    if (data.ticketMachines) setTicketMachines(newTicketMachines);
    if (data.radioData) setRadioData(newRadioData);
    if (data.viabusData) setViabusData(newViabusData);
    if (data.cctvData) setCctvData(newCctvData);
    if (data.meetingReports || data.reports) setMeetingReports(newReports);

    // 2. Immediately write to LocalStorage
    safeSetItem(STORAGE_KEYS.TICKETS, JSON.stringify(newTickets));
    safeSetItem(STORAGE_KEYS.STOCK, JSON.stringify(newStock));
    safeSetItem(STORAGE_KEYS.TRACKED_ASSETS, JSON.stringify(newAssets));
    safeSetItem(STORAGE_KEYS.MARITIME, JSON.stringify(newMaritime));
    safeSetItem(STORAGE_KEYS.MEETING_REPORTS, JSON.stringify(newReports));
    safeSetItem(STORAGE_KEYS.PROCUREMENT_FOLDERS, JSON.stringify(newFolders));
    safeSetItem(STORAGE_KEYS.SIM_CARDS, JSON.stringify(newSimCards));
    safeSetItem(STORAGE_KEYS.TICKET_MACHINES, JSON.stringify(newTicketMachines));
    safeSetItem(STORAGE_KEYS.RADIO_DATA, JSON.stringify(newRadioData));
    safeSetItem(STORAGE_KEYS.VIABUS_DATA, JSON.stringify(newViabusData));
    safeSetItem(STORAGE_KEYS.CCTV_DATA, JSON.stringify(newCctvData));

    // 3. Immediately persist to Backend Database
    const appData: AppData = {
      tickets: newTickets,
      stock: newStock,
      assets: newAssets,
      maritime: newMaritime,
      reports: newReports,
      folders: newFolders,
      simCards: newSimCards,
      ticketMachines: newTicketMachines,
      radioData: newRadioData,
      viabusData: newViabusData,
      cctvData: newCctvData
    };
    await saveAllData(appData);
    setLastSavedTime(new Date());

    // Release sync lock after settling
    setTimeout(() => {
      isIncomingSyncRef.current = false;
    }, 2500);
  };

  const handleNavigateToFolder = (folderId: string) => {
    const folder = procurementFolders.find(f => f.id === folderId);
    if (folder) {
      setInventorySelection({
        year: folder.year,
        category: folder.locationType,
        location: folder.locationName,
        month: folder.month
      });
      setMode('PROCUREMENT');
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 font-sans text-slate-200">
      <Sidebar
        currentMode={mode}
        onModeChange={(newMode) => handleNavigate(newMode, 'ALL')}
        badges={{
          TRACK: tickets.filter(t => t.status !== 'COMPLETED').length,
          ADMIN: tickets.filter(t => t.status !== 'COMPLETED').length,
        }}
      />

      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-slate-950 to-purple-900/10 pointer-events-none fixed" />

        <div className="relative z-10 h-full">
          {mode === 'HOME' && <Landing onNavigate={handleNavigate} tickets={tickets} assets={trackedAssets} procurementFolders={procurementFolders} onNavigateToFolder={handleNavigateToFolder} newTicketsCount={newTicketsCount} onClearNewTickets={() => setNewTicketsCount(0)} />}
          {mode === 'REPORT' && (
            <div className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ReportForm
                onSubmit={(data) => handleTicketSubmit(data, editingTicket?.id)}
                onCancel={() => handleNavigate('HOME')}
                initialData={editingTicket}
                newTicketsCount={newTicketsCount}
                onClearNewTickets={() => setNewTicketsCount(0)}
              />
            </div>
          )}
          {mode === 'TRACK' && (
            <div className="py-8 animate-in fade-in duration-500">
              <TicketList
                tickets={tickets}
                onDelete={(id) => setTickets(tickets.filter(t => t.id !== id))}
                initialFilter={ticketFilter}
                onFixedImageUpdate={(id, data) => setTickets(tickets.map(t => {
                  if (t.id !== id) return t;
                  const newImages = Array.isArray(data) ? data : [data];
                  const existingImages = t.fixedImageUrls || (t.fixedImageUrl ? [t.fixedImageUrl] : []);
                  return {
                    ...t,
                    fixedImageUrls: [...existingImages, ...newImages],
                    fixedImageUrl: t.fixedImageUrl || newImages[0],
                    status: 'COMPLETED'
                  };
                }))}
                onEdit={handleEditTicket}
                onBatchDateUpdate={handleBatchDateUpdate}
              />
            </div>
          )}
          {mode === 'PROCUREMENT' && (
            <div className="py-8 animate-in fade-in duration-500">
              <InventoryManager
                folders={procurementFolders}
                onUpdate={setProcurementFolders}
                onNavigate={(m) => handleNavigate(m)}
                initialSelection={inventorySelection}
              />
            </div>
          )}
          {mode === 'ASSET_TRACKING' && (
            <div className="py-8 animate-in fade-in duration-500">
              <TicketMachineManager 
                items={ticketMachines} 
                onUpdate={setTicketMachines}
                onReset={() => setTicketMachines(INITIAL_TICKET_MACHINES)}
              />
            </div>
          )}
          {mode === 'MARITIME' && (
            <div className="py-8 animate-in fade-in duration-500">
              <MaritimeManager items={maritimeItems} onUpdate={setMaritimeItems} />
            </div>
          )}
          {mode === 'MEETING_REPORT' && (
            <div className="py-8 animate-in fade-in duration-500">
              <MeetingReportManager reports={meetingReports} onUpdate={setMeetingReports} />
            </div>
          )}
          {mode === 'BACKUP' && (
            <div className="py-8 animate-in fade-in duration-500">
              <BackupManager
                currentData={{
                  tickets,
                  stock: stockItems,
                  maritime: maritimeItems,
                  trackedAssets,
                  procurementFolders,
                  simCards,
                  ticketMachines,
                  radioData,
                  viabusData,
                  cctvData,
                  meetingReports
                }}
                onRestore={handleRestore}
              />
            </div>
          )}
          {mode === 'CALENDAR' && (
            <div className="py-8 animate-in fade-in duration-500">
              <CalendarManager tickets={tickets} procurementFolders={procurementFolders} />
            </div>
          )}
          {mode === 'SIM_AIS' && (
            <div className="py-8 animate-in fade-in duration-500">
              <SimAisManager items={simCards} onUpdate={setSimCards} />
            </div>
          )}
          {mode === 'RADIO' && (
            <div className="animate-in fade-in duration-500">
              <RadioManager data={radioData} onUpdate={setRadioData} />
            </div>
          )}
          {mode === 'VIABUS' && (
            <div className="animate-in fade-in duration-500">
              <ViabusManager data={viabusData} onUpdate={setViabusData} />
            </div>
          )}
          {mode === 'CCTV_MANAGEMENT' && (
            <div className="animate-in fade-in duration-500">
              <CctvManager data={cctvData} onUpdate={setCctvData} />
            </div>
          )}
          {mode === 'ADMIN' && (
            <div className="py-8 animate-in fade-in duration-500">
              <TicketList
                tickets={tickets}
                isAdmin={true}
                onStatusUpdate={(id, status, completedDate) => setTickets(tickets.map(t => {
                  if (t.id !== id) return t;
                  return {
                    ...t,
                    status,
                    completedDate: status === 'COMPLETED' ? (completedDate || new Date().toISOString().split('T')[0]) : t.completedDate
                  };
                }))}
                onDelete={(id) => setTickets(tickets.filter(t => t.id !== id))}
                initialFilter={ticketFilter}
                onFixedImageUpdate={(id, data) => setTickets(tickets.map(t => {
                  if (t.id !== id) return t;
                  const newImages = Array.isArray(data) ? data : [data];
                  const existingImages = t.fixedImageUrls || (t.fixedImageUrl ? [t.fixedImageUrl] : []);
                  return {
                    ...t,
                    fixedImageUrls: [...existingImages, ...newImages],
                    fixedImageUrl: t.fixedImageUrl || newImages[0],
                    status: 'COMPLETED',
                    completedDate: t.completedDate || new Date().toISOString().split('T')[0]
                  };
                }))}
                onEdit={handleEditTicket}
                onBatchDateUpdate={handleBatchDateUpdate}
              />
            </div>
          )}
        </div>
      </main>

      <SaveIndicator lastSavedTime={lastSavedTime} isSaving={isSaving} />

      {/* Error Toast */}
      {saveError && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-red-950/90 border border-red-500/50 rounded-lg text-red-200 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{saveError}</span>
              <span className="text-[10px] text-red-400 mt-0.5 uppercase tracking-wider font-bold">โปรดไปที่เมนู Backup เพื่อจัดการพื้นที่</span>
            </div>
            <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-white transition-colors ml-2">✕</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
