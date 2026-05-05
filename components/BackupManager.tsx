import React, { useState, useRef, useEffect } from 'react';
import { Database, Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, Package, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { MaintenanceTicket, StockItem, MaritimeItem, TrackedAsset, MeetingReport, ProcurementFolder, SimCard } from '../types';
import { STORAGE_KEYS, CURRENT_DATA_VERSION, getStorageUsage, formatBytes, getStoredData } from '../utils/storageUtils';

interface BackupData {
  tickets?: MaintenanceTicket[];
  stock?: StockItem[];
  maritime?: MaritimeItem[];
  trackedAssets?: TrackedAsset[];
  meetingReports?: MeetingReport[];
  procurementFolders?: ProcurementFolder[];
  simCards?: SimCard[];
}

interface BackupManagerProps {
  onRestore: (data: BackupData) => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ onRestore }) => {
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
      // Export ALL 7 data types
      const tickets = getStoredData<MaintenanceTicket[]>(STORAGE_KEYS.TICKETS, []);
      const stock = getStoredData<StockItem[]>(STORAGE_KEYS.STOCK, []);
      const maritime = getStoredData<MaritimeItem[]>(STORAGE_KEYS.MARITIME, []);
      const trackedAssets = getStoredData<TrackedAsset[]>(STORAGE_KEYS.TRACKED_ASSETS, []);
      const meetingReports = getStoredData<MeetingReport[]>(STORAGE_KEYS.MEETING_REPORTS, []);
      const procurementFolders = getStoredData<ProcurementFolder[]>(STORAGE_KEYS.PROCUREMENT_FOLDERS, []);
      const simCards = getStoredData<SimCard[]>(STORAGE_KEYS.SIM_CARDS, []);

      const backupData = {
        version: CURRENT_DATA_VERSION,
        timestamp: new Date().toISOString(),
        data: {
          tickets,
          stock,
          maritime,
          trackedAssets,
          meetingReports,
          procurementFolders,
          simCards
        },
        metadata: {
          ticketsCount: tickets.length,
          stockCount: stock.length,
          maritimeCount: maritime.length,
          trackedAssetsCount: trackedAssets.length,
          meetingReportsCount: meetingReports.length,
          procurementFoldersCount: procurementFolders.length,
          simCardsCount: simCards.length
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
      setMessage(`สำรองข้อมูลเรียบร้อยแล้ว (${formatBytes(blob.size)})`);
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
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        // Validate backup file structure
        if (!json.data) {
          throw new Error("รูปแบบไฟล์ไม่ถูกต้อง: ไม่พบ data");
        }

        // Show confirmation with data summary
        const dataTypes = [];
        if (json.data.tickets?.length) dataTypes.push(`รายการแจ้งซ่อม: ${json.data.tickets.length}`);
        if (json.data.stock?.length) dataTypes.push(`สต็อกอุปกรณ์: ${json.data.stock.length}`);
        if (json.data.maritime?.length) dataTypes.push(`ข้อมูลเรือ/ท่า: ${json.data.maritime.length}`);
        if (json.data.trackedAssets?.length) dataTypes.push(`อุปกรณ์ติดตาม: ${json.data.trackedAssets.length}`);
        if (json.data.meetingReports?.length) dataTypes.push(`รายงานประชุม: ${json.data.meetingReports.length}`);
        if (json.data.procurementFolders?.length) dataTypes.push(`โฟลเดอร์จัดซื้อ: ${json.data.procurementFolders.length}`);
        if (json.data.simCards?.length) dataTypes.push(`SIM Cards: ${json.data.simCards.length}`);

        const confirmMessage = `ไฟล์สำรอง v${json.version || 'ไม่ระบุ'} (${new Date(json.timestamp).toLocaleString('th-TH')})\n\nข้อมูลที่จะนำเข้า:\n${dataTypes.join('\n')}\n\nการคืนค่าข้อมูลจะทับข้อมูลปัจจุบันทั้งหมด คุณแน่ใจหรือไม่?`;

        if (confirm(confirmMessage)) {
          onRestore(json.data);
          setStatus('success');
          setMessage('คืนค่าข้อมูลสำเร็จ ระบบจะอัปเดตข้อมูลทันที');
          setStorageInfo(getStorageUsage()); // Update storage info
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
      // Trigger a reload or state update in App if needed, but App.tsx usually syncs from state to storage.
      // Actually, if we delete from localStorage, App.tsx might overwrite it back if it's still in state.
      // So we should probably reload the page or tell the user to reload.
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
          <p className="text-cyan-500 font-mono text-[10px] mt-2 tracking-[0.2em] font-bold uppercase">PROTOCOL: IT_PERSISTENCE_MANAGEMENT</p>
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
              <ul className="mt-4 space-y-2 text-[10px] font-mono text-slate-500 uppercase">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-500"></div> รายการแจ้งซ่อมทั้งหมด (Tickets)</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-500"></div> ข้อมูลคลังอุปกรณ์ (Stock)</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-500"></div> ข้อมูลเรือและท่าเรือ (Maritime)</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-500"></div> อุปกรณ์ติดตาม (Tracked Assets)</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-500"></div> รายงานการประชุม (Meeting Reports)</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-500"></div> โฟลเดอร์จัดซื้อ (Procurement)</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-500"></div> ข้อมูล SIM Cards</li>
              </ul>
            </div>
            <Button
              className="w-full h-14"
              onClick={handleExport}
              disabled={status === 'processing'}
            >
              <Download className="mr-2 h-5 w-5" /> สร้างไฟล์สำรองข้อมูล
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