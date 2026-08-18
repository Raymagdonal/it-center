import React, { useState, useRef, useEffect } from 'react';
import { Database, Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, Package, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { MaintenanceTicket, StockItem, MaritimeItem, TrackedAsset, ProcurementFolder, SimCard, TicketMachine, RadioData, ViabusData, CctvData, MeetingReport } from '../types';
import { STORAGE_KEYS, CURRENT_DATA_VERSION, getStorageUsage, formatBytes, getStoredData } from '../utils/storageUtils';

export interface BackupData {
  tickets?: MaintenanceTicket[];
  stock?: StockItem[];
  maritime?: MaritimeItem[];
  trackedAssets?: TrackedAsset[];
  assets?: TrackedAsset[]; // Alias
  procurementFolders?: ProcurementFolder[];
  folders?: ProcurementFolder[]; // Alias
  simCards?: SimCard[];
  ticketMachines?: TicketMachine[];
  radioData?: RadioData;
  viabusData?: ViabusData;
  cctvData?: CctvData;
  meetingReports?: MeetingReport[];
  reports?: MeetingReport[]; // Alias
}

interface BackupManagerProps {
  currentData?: {
    tickets: MaintenanceTicket[];
    stock: StockItem[];
    maritime: MaritimeItem[];
    trackedAssets: TrackedAsset[];
    procurementFolders: ProcurementFolder[];
    simCards: SimCard[];
    ticketMachines: TicketMachine[];
    radioData: RadioData;
    viabusData: ViabusData;
    cctvData: CctvData;
    meetingReports?: MeetingReport[];
  };
  onRestore: (data: BackupData) => Promise<void> | void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ currentData, onRestore }) => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [storageInfo, setStorageInfo] = useState<{ totalBytes: number; breakdown: Record<string, number> }>({ totalBytes: 0, breakdown: {} });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get storage usage on mount
  useEffect(() => {
    setStorageInfo(getStorageUsage());
  }, []);

  const handleExport = () => {
    setStatus('processing');
    try {
      // Export ALL active data types from live props or fallback to localStorage
      const tickets = currentData?.tickets ?? getStoredData<MaintenanceTicket[]>(STORAGE_KEYS.TICKETS, []);
      const stock = currentData?.stock ?? getStoredData<StockItem[]>(STORAGE_KEYS.STOCK, []);
      const maritime = currentData?.maritime ?? getStoredData<MaritimeItem[]>(STORAGE_KEYS.MARITIME, []);
      const trackedAssets = currentData?.trackedAssets ?? getStoredData<TrackedAsset[]>(STORAGE_KEYS.TRACKED_ASSETS, []);
      const procurementFolders = currentData?.procurementFolders ?? getStoredData<ProcurementFolder[]>(STORAGE_KEYS.PROCUREMENT_FOLDERS, []);
      const simCards = currentData?.simCards ?? getStoredData<SimCard[]>(STORAGE_KEYS.SIM_CARDS, []);
      const ticketMachines = currentData?.ticketMachines ?? getStoredData<TicketMachine[]>(STORAGE_KEYS.TICKET_MACHINES, []);
      const radioData = currentData?.radioData ?? getStoredData<RadioData>(STORAGE_KEYS.RADIO_DATA, { faultLogs: [], signalLogs: [] });
      const viabusData = currentData?.viabusData ?? getStoredData<ViabusData>(STORAGE_KEYS.VIABUS_DATA, { faultLogs: [], signalLogs: [] });
      const cctvData = currentData?.cctvData ?? getStoredData<CctvData>(STORAGE_KEYS.CCTV_DATA, { cameras: [], faultLogs: [] });
      const meetingReports = currentData?.meetingReports ?? getStoredData<MeetingReport[]>(STORAGE_KEYS.MEETING_REPORTS, []);

      const backupData = {
        version: CURRENT_DATA_VERSION,
        timestamp: new Date().toISOString(),
        data: {
          tickets,
          stock,
          maritime,
          trackedAssets,
          procurementFolders,
          simCards,
          ticketMachines,
          radioData,
          viabusData,
          cctvData,
          meetingReports,
        },
        metadata: {
          ticketsCount: tickets.length,
          stockCount: stock.length,
          maritimeCount: maritime.length,
          trackedAssetsCount: trackedAssets.length,
          procurementFoldersCount: procurementFolders.length,
          simCardsCount: simCards.length,
          ticketMachinesCount: ticketMachines.length,
          radioFaultLogsCount: radioData?.faultLogs?.length ?? 0,
          radioSignalLogsCount: radioData?.signalLogs?.length ?? 0,
          viabusFaultLogsCount: viabusData?.faultLogs?.length ?? 0,
          viabusSignalLogsCount: viabusData?.signalLogs?.length ?? 0,
          cctvCamerasCount: cctvData?.cameras?.length ?? 0,
          cctvFaultLogsCount: cctvData?.faultLogs?.length ?? 0,
          meetingReportsCount: meetingReports.length,
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ctb_backup_v${CURRENT_DATA_VERSION}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus('success');
      setMessage(`สำรองข้อมูลครบทุกหัวข้อเรียบร้อยแล้ว (${formatBytes(blob.size)})`);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('เกิดข้อผิดพลาดในการสำรองข้อมูล');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('processing');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        // Validate backup file structure (support both wrapped { data: ... } or raw data)
        const payload = json.data ? json.data : json;
        if (!payload || typeof payload !== 'object') {
          throw new Error("รูปแบบไฟล์ไม่ถูกต้อง: ไม่พบโครงสร้างข้อมูล");
        }

        // Normalize all keys to ensure 100% data recovery
        const normalizedData: BackupData = {
          tickets: Array.isArray(payload.tickets) ? payload.tickets : undefined,
          stock: Array.isArray(payload.stock) ? payload.stock : undefined,
          maritime: Array.isArray(payload.maritime) ? payload.maritime : undefined,
          trackedAssets: Array.isArray(payload.trackedAssets) ? payload.trackedAssets : (Array.isArray(payload.assets) ? payload.assets : undefined),
          procurementFolders: Array.isArray(payload.procurementFolders) ? payload.procurementFolders : (Array.isArray(payload.folders) ? payload.folders : undefined),
          simCards: Array.isArray(payload.simCards) ? payload.simCards : undefined,
          ticketMachines: Array.isArray(payload.ticketMachines) ? payload.ticketMachines : undefined,
          radioData: payload.radioData ? {
            faultLogs: Array.isArray(payload.radioData.faultLogs) ? payload.radioData.faultLogs : [],
            signalLogs: Array.isArray(payload.radioData.signalLogs) ? payload.radioData.signalLogs : [],
          } : undefined,
          viabusData: payload.viabusData ? {
            faultLogs: Array.isArray(payload.viabusData.faultLogs) ? payload.viabusData.faultLogs : [],
            signalLogs: Array.isArray(payload.viabusData.signalLogs) ? payload.viabusData.signalLogs : [],
          } : undefined,
          cctvData: payload.cctvData ? {
            cameras: Array.isArray(payload.cctvData.cameras) ? payload.cctvData.cameras : [],
            faultLogs: Array.isArray(payload.cctvData.faultLogs) ? payload.cctvData.faultLogs : [],
          } : undefined,
          meetingReports: Array.isArray(payload.meetingReports) ? payload.meetingReports : (Array.isArray(payload.reports) ? payload.reports : undefined),
        };

        // Show confirmation with data summary
        const dataTypes = [];
        if (normalizedData.tickets) dataTypes.push(`• แจ้งซ่อมบำรุง / ปฏิทิน: ${normalizedData.tickets.length} รายการ`);
        if (normalizedData.procurementFolders) dataTypes.push(`• จัดซื้ออุปกรณ์: ${normalizedData.procurementFolders.length} โฟลเดอร์`);
        if (normalizedData.ticketMachines) dataTypes.push(`• เครื่องจำหน่ายตั๋ว: ${normalizedData.ticketMachines.length} เครื่อง`);
        if (normalizedData.radioData) dataTypes.push(`• วิทยุสื่อสาร: แจ้งเสีย ${normalizedData.radioData.faultLogs.length} / สัญญาณ ${normalizedData.radioData.signalLogs.length} รายการ`);
        if (normalizedData.viabusData) dataTypes.push(`• Viabus: แจ้งเสีย ${normalizedData.viabusData.faultLogs.length} / สัญญาณ ${normalizedData.viabusData.signalLogs.length} รายการ`);
        if (normalizedData.cctvData) dataTypes.push(`• กล้องวงจรปิด CCTV: ทำเนียบ ${normalizedData.cctvData.cameras.length} / แจ้งเสีย ${normalizedData.cctvData.faultLogs.length} รายการ`);
        if (normalizedData.maritime) dataTypes.push(`• ตรวจอุปกรณ์ในเรือ/บนท่า: ${normalizedData.maritime.length} รายการ`);
        if (normalizedData.simCards) dataTypes.push(`• SIM AIS (ซิมการ์ด): ${normalizedData.simCards.length} เบอร์`);
        if (normalizedData.stock) dataTypes.push(`• คลังอุปกรณ์: ${normalizedData.stock.length} รายการ`);
        if (normalizedData.trackedAssets) dataTypes.push(`• อุปกรณ์ติดตาม: ${normalizedData.trackedAssets.length} รายการ`);
        if (normalizedData.meetingReports) dataTypes.push(`• รายงานการประชุม: ${normalizedData.meetingReports.length} รายการ`);

        const confirmMessage = `ไฟล์สำรอง v${json.version || '4.0'} (${json.timestamp ? new Date(json.timestamp).toLocaleString('th-TH') : 'ไม่ระบุเวลา'})\n\nข้อมูลที่จะนำเข้าครบถ้วนทุกหัวข้อ:\n${dataTypes.join('\n')}\n\nการคืนค่าข้อมูลจะอัปเดตและบันทึกลงสู่ระบบทันที คุณแน่ใจหรือไม่?`;

        if (confirm(confirmMessage)) {
          await onRestore(normalizedData);
          setStatus('success');
          setMessage('คืนค่าข้อมูลสำเร็จ ระบบอัปเดตข้อมูลครบทุกหัวข้อทันที');
          setStorageInfo(getStorageUsage());
          setTimeout(() => setStatus('idle'), 3000);
        } else {
          setStatus('idle');
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage('ไฟล์ที่เลือกไม่ใช่ไฟล์สำรองข้อมูลที่ถูกต้อง');
      }
    };
    reader.readAsText(file);
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearKey = (key: string, label: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล "${label}" ทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
      localStorage.removeItem(key);
      setStorageInfo(getStorageUsage());
      setMessage(`ลบข้อมูล ${label} เรียบร้อยแล้ว`);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
      alert('ข้อมูลถูกลบออกจาก Storage แล้ว โปรดรีโหลดหน้าเว็บเพื่อให้ผลลัพธ์แสดงผลสมบูรณ์');
      window.location.reload();
    }
  };

  const handleClearAll = () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมดในระบบ? ทุกอย่างจะถูกลบถาวร!')) {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      setStorageInfo(getStorageUsage());
      setMessage('ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว');
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        window.location.reload();
      }, 2000);
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-500/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-4 hover-glow cursor-default">
            <Database className="h-10 w-10 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            Backup_Center
          </h1>
          <p className="text-cyan-500 font-mono text-[10px] mt-2 tracking-[0.2em] font-bold uppercase">PROTOCOL: IT_PERSISTENCE_MANAGEMENT • FULL_SYSTEM_BACKUP</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Card */}
        <Card className="hover:border-cyan-500/50 transition-all group">
          <CardHeader>
            <CardTitle className="text-lg">สำรองข้อมูล (Export)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-black/40 border border-slate-800 rounded-lg">
              <p className="text-sm text-slate-400 leading-relaxed">
                ดาวน์โหลดข้อมูลทั้งหมดในระบบออกมาเป็นไฟล์ <span className="text-cyan-400 font-mono">.json</span> เพื่อใช้เก็บรักษาไว้นอกระบบ หรือย้ายไปใช้งานในเครื่องอื่น
              </p>
              <ul className="mt-4 space-y-2 text-[10px] font-mono text-slate-400 uppercase">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> รายการแจ้งซ่อมทั้งหมด (Tickets / ซ่อมบำรุง)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> จัดซื้ออุปกรณ์ (Procurement Folders)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> เครื่องจำหน่ายตั๋ว (Ticket Machines)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> วิทยุสื่อสาร (Radio Data)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> Viabus (Viabus Data)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> กล้องวงจรปิด CCTV (CCTV Data)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> ตรวจอุปกรณ์ในเรือ/บนท่า (Maritime)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> ปฏิทินกิจกรรม (Calendar / Work Schedule)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> SIM AIS (จัดการซิมการ์ด)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> ข้อมูลคลังอุปกรณ์ (Stock)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> อุปกรณ์ติดตาม (Tracked Assets)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> รายงานการประชุม (Meeting Reports)</li>
              </ul>
            </div>
            <Button
              className="w-full h-14"
              onClick={handleExport}
              disabled={status === 'processing'}
            >
              <Download className="mr-2 h-5 w-5" /> สร้างไฟล์สำรองข้อมูล (ครบทุกหัวข้อ)
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card className="hover:border-amber-500/50 transition-all group">
          <CardHeader>
            <CardTitle className="text-lg text-amber-400 before:text-amber-600">คืนค่าข้อมูล (Import)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-black/40 border border-slate-800 rounded-lg">
              <p className="text-sm text-slate-400 leading-relaxed">
                อัปโหลดไฟล์สำรองข้อมูลที่คุณเคย Export ไว้ เพื่อนำข้อมูลกลับคืนมายังระบบ <span className="text-amber-500 font-bold underline decoration-amber-500/30">ระวัง: ข้อมูลปัจจุบันจะถูกเขียนทับ</span>
              </p>
              <div className="mt-4 flex items-center gap-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-500 font-bold uppercase animate-pulse">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                คำเตือน: โปรดตรวจสอบไฟล์ให้ถูกต้องก่อนยืนยัน
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
            <Button
              variant="secondary"
              className="w-full h-14 border-amber-500/40 text-amber-400 hover:border-amber-400 hover:text-white hover:bg-amber-500/10"
              onClick={() => fileInputRef.current?.click()}
              disabled={status === 'processing'}
            >
              <Upload className="mr-2 h-5 w-5" /> เลือกไฟล์เพื่อคืนค่า
            </Button>
          </CardContent>
        </Card>

        {/* Storage Management Card */}
        <Card className="md:col-span-2 border-red-500/30 bg-red-950/5">
          <CardHeader>
            <CardTitle className="text-lg text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> การจัดการพื้นที่จัดเก็บ (Storage Management)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="p-4 bg-black/60 border border-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">พื้นที่ใช้งาน (Cloud + Local Cache)</div>
                  <div className="text-3xl font-bold text-white font-mono">{formatBytes(storageInfo.totalBytes)}</div>
                  <div className="w-full bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${storageInfo.totalBytes > 45 * 1024 * 1024 ? 'bg-red-500' : 'bg-cyan-500'}`}
                      style={{ width: `${Math.min(100, (storageInfo.totalBytes / (50 * 1024 * 1024)) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-[9px] text-cyan-600 mt-2 font-mono uppercase font-bold">ขีดจำกัดขยายเป็น: 50.00 MB (Render Cloud)</div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
                  onClick={handleClearAll}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> ล้างข้อมูลทั้งหมด
                </Button>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-black/40 border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px] font-mono">
                    <thead>
                      <tr className="bg-slate-900/80 text-slate-500 border-b border-slate-800">
                        <th className="p-3 text-left">ประเภทข้อมูล</th>
                        <th className="p-3 text-right">ขนาด</th>
                        <th className="p-3 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {Object.entries(STORAGE_KEYS).map(([label, key]) => (
                        <tr key={key} className="hover:bg-white/5">
                          <td className="p-3 text-slate-300">{label}</td>
                          <td className="p-3 text-right text-cyan-500 font-bold">{formatBytes(storageInfo.breakdown[key] || 0)}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleClearKey(key, label)}
                              className="text-red-500 hover:text-red-400 p-1"
                              title="ล้างข้อมูลนี้"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Status Overlay */}
      {status !== 'idle' && (
        <div className="fixed bottom-10 right-10 z-50 animate-in slide-in-from-right duration-300">
          <div className={`flex items-center gap-4 p-4 rounded-lg border-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl ${status === 'processing' ? 'border-cyan-500 bg-cyan-950/90 text-cyan-100' :
            status === 'success' ? 'border-green-500 bg-green-950/90 text-green-100' :
              'border-red-500 bg-red-950/90 text-red-100'
            }`}>
            {status === 'processing' ? <RefreshCw className="h-6 w-6 animate-spin" /> :
              status === 'success' ? <CheckCircle2 className="h-6 w-6" /> :
                <AlertTriangle className="h-6 w-6" />}
            <div className="font-bold tracking-wide uppercase text-xs">
              {message}
            </div>
          </div>
        </div>
      )}

      {/* Security Info */}
      <div className="flex items-center gap-4 p-6 bg-slate-900/40 border border-slate-800 rounded-lg">
        <div className="p-3 bg-black rounded border border-cyan-500/30">
          <ShieldCheck className="h-8 w-8 text-cyan-400" />
        </div>
        <div>
          <h4 className="text-white font-bold font-display uppercase tracking-widest">ความปลอดภัยและพื้นที่จัดเก็บ</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            ข้อมูลของคุณถูกขยายพื้นที่เป็น <span className="text-cyan-400 font-mono">50MB</span> และจัดเก็บอย่างปลอดภัยบน <span className="text-cyan-600 font-mono">Render Cloud Backend</span> เพื่อให้เข้าถึงได้จากทุกที่และป้องกันข้อมูลสูญหาย โดยระบบยังคงเก็บ Cache ไว้ในเครื่องเพื่อให้ใช้งานออฟไลน์ได้ชั่วคราว
          </p>
        </div>
      </div>
    </div>
  );
};