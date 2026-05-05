
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Landing } from './components/Landing';
import { ReportForm } from './components/ReportForm';
import { TicketList } from './components/TicketList';
import { InventoryManager } from './components/InventoryManager';
import { MaritimeManager } from './components/MaritimeManager';
import { BackupManager } from './components/BackupManager';
import { Sathorn3D } from './components/Sathorn3D';
import { AssetTracker } from './components/AssetTracker';
import { AppMode, MaintenanceTicket, TrackedAsset, MaritimeItem, ProcurementFolder } from './types';

// Mock initial data
const INITIAL_TICKETS: MaintenanceTicket[] = [
  {
    id: '1',
    deviceType: 'TICKET_MACHINE',
    deviceId: 'TM-004',
    issueDescription: 'หน้าจอกระพริบและระบบสัมผัสไม่ทำงาน',
    location: 'สถานีกลาง ประตู 2',
    status: 'IN_PROGRESS',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    imageUrls: [],
    aiAnalysis: {
      severity: 'MEDIUM',
      suggestedAction: 'ตรวจสอบสายสัญญาณจอภาพ',
      technicalNotes: 'น่าจะเป็นที่สาย LVDS หลวมหรือพาเนลจอเสีย'
    }
  }
];

const INITIAL_PROCUREMENT: ProcurementFolder[] = [
  {
    id: 'folder1',
    name: 'สำนักงาน_มกราคม_2026',
    locationType: 'OFFICE',
    locationName: 'สำนักงาน',
    year: 2026,
    month: 0,
    items: [
      {
        id: 'item1',
        name: 'สายแลน CAT6 100m',
        quantity: 5,
        unit: 'กล่อง',
        purchaseDate: '2026-01-15',
        usageStatus: 'ACTIVE',
        status: 'IN_STOCK',
        minThreshold: 1,
        category: 'Network',
        supplier: 'Advice IT',
        notes: 'สำหรับเดินระบบชั้น 2'
      },
      {
        id: 'item2',
        name: 'กล้อง CCTV 4K',
        quantity: 2,
        unit: 'ตัว',
        purchaseDate: '2026-01-18',
        usageStatus: 'ACTIVE',
        status: 'IN_STOCK',
        minThreshold: 1,
        category: 'CCTV',
        supplier: 'Hikvision Thailand',
        notes: 'ติดตั้งจุดทางเข้าหลัก'
      },
      {
        id: 'item3',
        name: 'เครื่องสำรองไฟ 1000VA',
        quantity: 1,
        unit: 'เครื่อง',
        purchaseDate: '2026-01-10',
        usageStatus: 'SPARE',
        status: 'IN_STOCK',
        minThreshold: 1,
        category: 'Power',
        supplier: 'JIB Computer',
        notes: 'สำรองสำหรับ Server Room'
      }
    ]
  },
  {
    id: 'folder2',
    name: 'ท่าเรือสาทร_มกราคม_2026',
    locationType: 'PIER',
    locationName: 'สาทร',
    year: 2026,
    month: 0,
    items: [
      {
        id: 'item4',
        name: 'กระดาษความร้อน 80x80',
        quantity: 50,
        unit: 'ม้วน',
        purchaseDate: '2026-01-05',
        usageStatus: 'ACTIVE',
        status: 'LOW_STOCK',
        minThreshold: 20,
        category: 'Consumables',
        supplier: 'OfficeMate',
        notes: 'สำหรับตู้จำหน่ายตั๋ว'
      }
    ]
  }
];

const INITIAL_TRACKED_ASSETS: TrackedAsset[] = [
  {
    id: 't1',
    sn: 'SN-CB-001',
    name: 'สายชาร์จ Type-C (Fast)',
    location: 'ท่าสะพานพุทธ',
    locationType: 'PORT',
    username: 'สมชาย ไอที',
    installedDate: '2023-10-20'
  }
];

const INITIAL_MARITIME: MaritimeItem[] = [
  {
    id: 'm_pier_sathorn',
    name: 'Sathorn Pier (ท่าเรือสาทร)',
    type: 'PORT',
    location: 'แม่น้ำเจ้าพระยา (Sathorn)',
    status: 'NORMAL',
    recordDate: '2025-12-22',
    images: []
  }
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('HOME');
  const [ticketFilter, setTicketFilter] = useState<string>('ALL');
  const [targetedAssetSn, setTargetedAssetSn] = useState<string | null>(null);

  // State initialization
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => {
    const saved = localStorage.getItem('techfix_tickets');
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  const [procurementFolders, setProcurementFolders] = useState<ProcurementFolder[]>(() => {
    const saved = localStorage.getItem('techfix_procurement');
    // If saved matches INITIAL but empty, or just empty array, use INITIAL
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed : INITIAL_PROCUREMENT;
    }
    return INITIAL_PROCUREMENT;
  });

  const [trackedAssets, setTrackedAssets] = useState<TrackedAsset[]>(() => {
    const saved = localStorage.getItem('techfix_tracked_assets');
    return saved ? JSON.parse(saved) : INITIAL_TRACKED_ASSETS;
  });

  const [maritimeItems, setMaritimeItems] = useState<MaritimeItem[]>(() => {
    const saved = localStorage.getItem('techfix_maritime');
    return saved ? JSON.parse(saved) : INITIAL_MARITIME;
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('techfix_tickets', JSON.stringify(tickets));
    localStorage.setItem('techfix_procurement', JSON.stringify(procurementFolders));
    localStorage.setItem('techfix_tracked_assets', JSON.stringify(trackedAssets));
    localStorage.setItem('techfix_maritime', JSON.stringify(maritimeItems));
  }, [tickets, procurementFolders, trackedAssets, maritimeItems]);

  // Handlers
  const handleNavigate = (newMode: AppMode, filter: string = 'ALL') => {
    setTicketFilter(filter);
    setMode(newMode);
    if (newMode !== 'BOAT_PIER_3D') setTargetedAssetSn(null);
  };

  const handleTicketSubmit = (ticketData: Omit<MaintenanceTicket, 'id' | 'status' | 'timestamp'>) => {
    const newTicket: MaintenanceTicket = {
      ...ticketData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'PENDING',
      timestamp: new Date().toISOString(),
    };
    setTickets([newTicket, ...tickets]);
    handleNavigate('TRACK', 'ALL');
  };

  const handleLocateAsset = (sn: string) => {
    setTargetedAssetSn(sn);
    setMode('BOAT_PIER_3D');
  };

  const handleRestore = (data: any) => {
    if (data.tickets) setTickets(data.tickets);
    if (data.procurement) setProcurementFolders(data.procurement);
    if (data.maritime) setMaritimeItems(data.maritime);
    if (data.trackedAssets) setTrackedAssets(data.trackedAssets);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 font-sans text-slate-200">
      <Sidebar
        currentMode={mode}
        onModeChange={(newMode) => handleNavigate(newMode, 'ALL')}
      />

      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-slate-950 to-purple-900/10 pointer-events-none fixed" />

        <div className="relative z-10 h-full">
          {mode === 'HOME' && <Landing onNavigate={handleNavigate} tickets={tickets} assets={trackedAssets} procurementFolders={procurementFolders} />}
          {mode === 'BOAT_PIER_3D' && <Sathorn3D targetedSn={targetedAssetSn} onClearTarget={() => setTargetedAssetSn(null)} />}
          {mode === 'REPORT' && (
            <div className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ReportForm onSubmit={handleTicketSubmit} onCancel={() => handleNavigate('HOME')} />
            </div>
          )}
          {mode === 'TRACK' && (
            <div className="py-8 animate-in fade-in duration-500">
              <TicketList
                tickets={tickets}
                onDelete={(id) => setTickets(tickets.filter(t => t.id !== id))}
                initialFilter={ticketFilter}
                onFixedImageUpdate={(id, img) => setTickets(tickets.map(t => t.id === id ? { ...t, fixedImageUrl: img, status: 'COMPLETED' } : t))}
              />
            </div>
          )}
          {mode === 'PROCUREMENT' && (
            <div className="py-8 animate-in fade-in duration-500">
              <InventoryManager folders={procurementFolders} onUpdate={setProcurementFolders} />
            </div>
          )}
          {mode === 'ASSET_TRACKING' && (
            <div className="py-8 animate-in fade-in duration-500">
              <AssetTracker assets={trackedAssets} onUpdate={setTrackedAssets} onLocate={handleLocateAsset} />
            </div>
          )}
          {mode === 'MARITIME' && (
            <div className="py-8 animate-in fade-in duration-500">
              <MaritimeManager items={maritimeItems} onUpdate={setMaritimeItems} />
            </div>
          )}
          {mode === 'BACKUP' && (
            <div className="py-8 animate-in fade-in duration-500">
              <BackupManager onRestore={handleRestore} />
            </div>
          )}
          {mode === 'ADMIN' && (
            <div className="py-8 animate-in fade-in duration-500">
              <TicketList
                tickets={tickets}
                isAdmin={true}
                onStatusUpdate={(id, status) => setTickets(tickets.map(t => t.id === id ? { ...t, status } : t))}
                onDelete={(id) => setTickets(tickets.filter(t => t.id !== id))}
                initialFilter={ticketFilter}
                onFixedImageUpdate={(id, img) => setTickets(tickets.map(t => t.id === id ? { ...t, fixedImageUrl: img, status: 'COMPLETED' } : t))}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
