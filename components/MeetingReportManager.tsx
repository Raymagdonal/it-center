
import React, { useState, useRef, useMemo } from 'react';
import {
   FileText, Plus, Calendar, User, MapPin, Search, ArrowLeft,
   Trash2, Edit, Save, X, Image as ImageIcon, Camera, FolderOpen,
   Briefcase, Wrench, ShoppingBag, CheckCircle2, ChevronRight, Maximize2, Clock, Folder
} from 'lucide-react';
import { MeetingReport, ProjectActivity } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface MeetingReportManagerProps {
   reports: MeetingReport[];
   onUpdate: (reports: MeetingReport[]) => void;
}

// Sub-component for individual activity to handle delete state and logic
const ActivityCard: React.FC<{
   activity: ProjectActivity;
   onEdit: (activity: ProjectActivity) => void;
   onDelete: (id: string) => void;
   onZoom: (images: string[], index: number) => void;
   getActivityTypeInfo: (type: string) => any;
}> = ({ activity, onEdit, onDelete, onZoom, getActivityTypeInfo }) => {
   const [isDeleting, setIsDeleting] = useState(false);
   const timerRef = useRef<any>(null);
   const typeInfo = getActivityTypeInfo(activity.type);
   const TypeIcon = typeInfo.icon;

   const handlePressStart = (e: React.SyntheticEvent) => {
      e.stopPropagation();
      setIsDeleting(true);
      timerRef.current = setTimeout(() => {
         onDelete(activity.id);
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

   const getDateLabel = (type: string) => {
      switch (type) {
         case 'REPAIR': return 'วันที่แก้ไขเสร็จ';
         case 'INSTALL': return 'วันที่ติดตั้ง';
         case 'PURCHASE': return 'วันที่จัดซื้อ';
         default: return 'วันที่ดำเนินการ';
      }
   };

   return (
      <Card className="overflow-hidden border-slate-800 bg-slate-900/40">
         <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row">
               {/* Info Section */}
               <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${typeInfo.bg} ${typeInfo.border} ${typeInfo.color}`}>
                           <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-white font-display uppercase tracking-wide">{activity.deviceName}</h3>
                           <div className={`text-[10px] font-bold px-2 py-0.5 rounded border w-fit mt-1 uppercase ${typeInfo.bg} ${typeInfo.border} ${typeInfo.color}`}>
                              {typeInfo.label}
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => onEdit(activity)} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-all"><Edit className="w-4 h-4" /></button>

                        {/* Long Press Delete Button */}
                        <button
                           onMouseDown={handlePressStart}
                           onMouseUp={handlePressEnd}
                           onMouseLeave={handlePressEnd}
                           onTouchStart={handlePressStart}
                           onTouchEnd={handlePressEnd}
                           onContextMenu={(e) => e.preventDefault()}
                           className={`p-2 rounded transition-all relative overflow-hidden ${isDeleting ? 'bg-red-950 text-red-500' : 'text-slate-400 hover:text-red-400 hover:bg-slate-800'}`}
                        >
                           {isDeleting && (
                              <div className="absolute inset-0 flex flex-col justify-end">
                                 <div className="w-full bg-red-500/40 animate-delete-progress shadow-[0_0_10px_#ef4444]" />
                              </div>
                           )}
                           <Trash2 className={`w-4 h-4 relative z-10 ${isDeleting ? 'animate-pulse' : ''}`} />
                           {isDeleting && (
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] px-2 py-1 rounded whitespace-nowrap">
                                 Hold to Delete
                              </div>
                           )}
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> {getDateLabel(activity.type)}</label>
                        <div className="text-cyan-400 font-mono font-bold text-base">
                           {new Date(activity.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> สถานที่</label>
                        <div className="text-slate-300 font-mono">{activity.location}</div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><User className="w-3 h-3" /> ผู้รับผิดชอบ</label>
                        <div className="text-slate-300 font-mono">{activity.owner}</div>
                     </div>
                     <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><FileText className="w-3 h-3" /> รายละเอียด</label>
                        <div className="text-slate-300 font-mono bg-black/40 p-3 rounded border border-slate-800/50">
                           {activity.details || '-'}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Comparison Section */}
               <div className="lg:w-[500px] bg-black/40 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col justify-center">
                  <div className="grid grid-cols-2 gap-4 h-full">
                     {/* Before Images */}
                     <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest text-center border-b border-amber-500/20 pb-1">Before ({(activity.beforeImages || []).length} รูป)</div>
                        <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                           {(activity.beforeImages || []).length > 0 ? (
                              (activity.beforeImages || []).map((img, idx) => (
                                 <div
                                    key={idx}
                                    className="aspect-video bg-black rounded border border-slate-700 cursor-zoom-in overflow-hidden group relative"
                                    onClick={() => onZoom(activity.beforeImages || [], idx)}
                                 >
                                    <img src={img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={`before-${idx}`} />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                       <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                                    </div>
                                 </div>
                              ))
                           ) : (
                              <div className="col-span-2 aspect-video bg-black rounded border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-700">
                                 <ImageIcon className="w-6 h-6 mb-1 opacity-20" />
                                 <span className="text-[8px] uppercase">NO IMAGE</span>
                              </div>
                           )}
                        </div>
                     </div>
                     {/* After Images */}
                     <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest text-center border-b border-green-500/20 pb-1">After ({(activity.afterImages || []).length} รูป)</div>
                        <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                           {(activity.afterImages || []).length > 0 ? (
                              (activity.afterImages || []).map((img, idx) => (
                                 <div
                                    key={idx}
                                    className="aspect-video bg-black rounded border border-slate-700 cursor-zoom-in overflow-hidden group relative"
                                    onClick={() => onZoom(activity.afterImages || [], idx)}
                                 >
                                    <img src={img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={`after-${idx}`} />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                       <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                                    </div>
                                    {idx === 0 && (
                                       <div className="absolute bottom-1 right-1 bg-green-500 text-black text-[7px] font-bold px-1 py-0.5 rounded shadow-lg flex items-center gap-0.5">
                                          <CheckCircle2 className="w-2 h-2" /> FIXED
                                       </div>
                                    )}
                                 </div>
                              ))
                           ) : (
                              <div className="col-span-2 aspect-video bg-black rounded border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-700">
                                 <ImageIcon className="w-6 h-6 mb-1 opacity-20" />
                                 <span className="text-[8px] uppercase">NO IMAGE</span>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </CardContent>
      </Card>
   );
};

export const MeetingReportManager: React.FC<MeetingReportManagerProps> = ({ reports, onUpdate }) => {
   const [activeReportId, setActiveReportId] = useState<string | null>(null);
   const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [zoomState, setZoomState] = useState<{ images: string[], currentIndex: number } | null>(null);

   // Modal State for Report Creation
   const [isReportModalOpen, setIsReportModalOpen] = useState(false);
   const [newReportTitle, setNewReportTitle] = useState('');

   // State for Editing Activity within a Report
   const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
   const [editingActivity, setEditingActivity] = useState<ProjectActivity | null>(null);

   // Default Activity Form Data
   const initialActivityForm: Partial<ProjectActivity> = {
      type: 'INSTALL',
      date: new Date().toISOString().split('T')[0],
      deviceName: '',
      location: '',
      owner: '',
      details: '',
      beforeImages: [],
      afterImages: []
   };
   const [activityFormData, setActivityFormData] = useState<Partial<ProjectActivity>>(initialActivityForm);

   // Refs for File Inputs
   const beforeInputRef = useRef<HTMLInputElement>(null);
   const afterInputRef = useRef<HTMLInputElement>(null);

   // Grouping Logic
   const groupedFolders = useMemo(() => {
      const folders: Record<string, { id: string; title: string; date: Date; reports: MeetingReport[] }> = {};
      reports.forEach(r => {
         const d = new Date(r.date);
         const key = `${d.getFullYear()}-${d.getMonth()}`;
         if (!folders[key]) {
            folders[key] = {
               id: key,
               title: d.toLocaleString('th-TH', { month: 'short', year: 'numeric' }),
               date: d,
               reports: []
            };
         }
         folders[key].reports.push(r);
      });
      // Sort descending by date
      return Object.values(folders).sort((a, b) => b.date.getTime() - a.date.getTime());
   }, [reports]);

   const activeFolder = groupedFolders.find(f => f.id === activeFolderId);
   const activeReport = reports.find(r => r.id === activeReportId);

   // Filtering
   const getDisplayFolders = () => {
      return groupedFolders.filter(f => {
         if (!searchTerm) return true;
         // Show folder if name matches OR any report inside matches
         return f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.reports.some(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));
      });
   };

   const getDisplayReports = () => {
      const targetReports = activeFolder ? activeFolder.reports : reports; // Fallback to all if no folder (shouldn't happen in folder view)
      return targetReports.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));
   };

   // --- Report Handlers ---
   const handleCreateReport = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newReportTitle.trim()) return;

      const newReport: MeetingReport = {
         id: Math.random().toString(36).substr(2, 9),
         title: newReportTitle,
         date: new Date().toISOString().split('T')[0],
         activities: []
      };

      onUpdate([newReport, ...reports]);
      setNewReportTitle('');
      setIsReportModalOpen(false);
      setActiveReportId(newReport.id);
   };

   const handleDeleteReport = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('ยืนยันการลบรายงานการประชุมนี้? ข้อมูลภายในทั้งหมดจะหายไป')) {
         onUpdate(reports.filter(r => r.id !== id));
         if (activeReportId === id) setActiveReportId(null);
      }
   };

   // --- Activity Handlers ---
   const handleOpenActivityModal = (activity?: ProjectActivity) => {
      if (activity) {
         setEditingActivity(activity);
         setActivityFormData(activity);
      } else {
         setEditingActivity(null);
         setActivityFormData(initialActivityForm);
      }
      setIsActivityModalOpen(true);
   };

   const handleSaveActivity = (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeReport) return;

      const newActivity: ProjectActivity = {
         ...(activityFormData as ProjectActivity),
         id: editingActivity ? editingActivity.id : Math.random().toString(36).substr(2, 9),
      };

      const updatedActivities = editingActivity
         ? activeReport.activities.map(a => a.id === editingActivity.id ? newActivity : a)
         : [...activeReport.activities, newActivity];

      const updatedReport = { ...activeReport, activities: updatedActivities };

      onUpdate(reports.map(r => r.id === activeReport.id ? updatedReport : r));
      setIsActivityModalOpen(false);
   };

   const handleDeleteActivity = (id: string) => {
      if (!activeReport) return;
      const updatedActivities = activeReport.activities.filter(a => a.id !== id);
      const updatedReport = { ...activeReport, activities: updatedActivities };
      onUpdate(reports.map(r => r.id === activeReport.id ? updatedReport : r));
   };

   // --- Image Upload Helpers ---
   const handleImageUpload = (type: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      Array.from(files).forEach((file: File) => {
         const reader = new FileReader();
         reader.onloadend = () => {
            setActivityFormData(prev => {
               const key = type === 'before' ? 'beforeImages' : 'afterImages';
               const currentImages = prev[key] || [];
               return {
                  ...prev,
                  [key]: [...currentImages, reader.result as string]
               };
            });
         };
         reader.readAsDataURL(file);
      });
      // Clear input for re-upload
      e.target.value = '';
   };

   const handleRemoveImage = (type: 'before' | 'after', index: number) => {
      setActivityFormData(prev => {
         const key = type === 'before' ? 'beforeImages' : 'afterImages';
         const currentImages = prev[key] || [];
         return {
            ...prev,
            [key]: currentImages.filter((_, i) => i !== index)
         };
      });
   };

   const getActivityTypeInfo = (type: string) => {
      switch (type) {
         case 'INSTALL': return { label: 'ติดตั้งใหม่', color: 'text-cyan-400', bg: 'bg-cyan-950/30', border: 'border-cyan-500/50', icon: Wrench };
         case 'REPAIR': return { label: 'ซ่อมแซม', color: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-500/50', icon: Wrench };
         case 'PURCHASE': return { label: 'จัดซื้อ', color: 'text-green-400', bg: 'bg-green-950/30', border: 'border-green-500/50', icon: ShoppingBag };
         default: return { label: type, color: 'text-slate-400', bg: 'bg-slate-950', border: 'border-slate-700', icon: Briefcase };
      }
   };

   return (
      <div className="p-6 max-w-[1920px] mx-auto space-y-8 animate-in fade-in duration-500">

         {/* Zoom Modal with Navigation */}
         {zoomState && (
            <div
               className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-300 backdrop-blur-sm"
               onClick={() => setZoomState(null)}
               onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' && zoomState.currentIndex < zoomState.images.length - 1) {
                     setZoomState(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null);
                  }
                  if (e.key === 'ArrowLeft' && zoomState.currentIndex > 0) {
                     setZoomState(prev => prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : null);
                  }
                  if (e.key === 'Escape') setZoomState(null);
               }}
               tabIndex={0}
               ref={(el) => el?.focus()}
            >
               <button
                  className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-lg border border-white/10 z-50 pointer-events-auto"
                  onClick={() => setZoomState(null)}
               >
                  <X className="w-6 h-6" />
               </button>

               {/* Navigation Buttons */}
               {zoomState.currentIndex > 0 && (
                  <button
                     className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-cyan-500/80 text-white rounded-full transition-all border border-white/10 backdrop-blur-md group"
                     onClick={(e) => {
                        e.stopPropagation();
                        setZoomState(prev => prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : null);
                     }}
                  >
                     <ChevronRight className="w-8 h-8 rotate-180 group-hover:scale-110 transition-transform" />
                  </button>
               )}

               {zoomState.currentIndex < zoomState.images.length - 1 && (
                  <button
                     className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-cyan-500/80 text-white rounded-full transition-all border border-white/10 backdrop-blur-md group"
                     onClick={(e) => {
                        e.stopPropagation();
                        setZoomState(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null);
                     }}
                  >
                     <ChevronRight className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  </button>
               )}

               <div className="relative max-w-[95vw] max-h-[90vh] flex flex-col items-center">
                  <img
                     src={zoomState.images[zoomState.currentIndex]}
                     alt={`Zoomed ${zoomState.currentIndex + 1}`}
                     className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded border border-slate-700/50"
                     onClick={(e) => e.stopPropagation()}
                  />
                  <div className="mt-4 px-4 py-2 bg-black/60 rounded-full text-white text-sm font-mono border border-white/10 backdrop-blur-md">
                     {zoomState.currentIndex + 1} / {zoomState.images.length}
                  </div>
               </div>
            </div>
         )}

         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-500/20 pb-6">
            <div className="flex items-center gap-4">
               {(activeReportId || activeFolderId) && (
                  <button
                     onClick={() => {
                        if (activeReportId) setActiveReportId(null);
                        else if (activeFolderId) setActiveFolderId(null);
                     }}
                     className="p-2 bg-slate-900 border border-slate-800 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-all shadow-glow-sm"
                  >
                     <ArrowLeft className="w-5 h-5" />
                  </button>
               )}
               <div>
                  <h1 className="text-3xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-3">
                     {activeReportId ? (
                        <><FileText className="h-8 w-8 text-cyan-500" /> {activeReport?.title}</>
                     ) : activeFolderId ? (
                        <><FolderOpen className="h-8 w-8 text-cyan-500" /> {activeFolder?.title}</>
                     ) : (
                        <><Briefcase className="h-8 w-8 text-cyan-500" /> ระบบตรวจสอบเรือและท่าเรือ</>
                     )}
                  </h1>
                  <p className="text-slate-400 mt-1 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                     PROTOCOL: จัดกลุ่มรายงานตามสถานและเดือนอัตโนมัติ
                  </p>
               </div>
            </div>

            {!activeReportId && (
               <Button onClick={() => setIsReportModalOpen(true)} className="shadow-glow-cyan">
                  <Plus className="mr-2 h-4 w-4" /> สร้างรายงานใหม่
               </Button>
            )}
         </div>

         {activeReport ? (
            // --- Report Detail View (Activities) ---
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
               <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-4 text-sm text-slate-300">
                     <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-cyan-500" /> วันที่สร้าง: {new Date(activeReport.date).toLocaleDateString('th-TH')}</div>
                     <div className="w-px h-4 bg-slate-700"></div>
                     <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-cyan-500" /> รายการทั้งหมด: {activeReport.activities.length}</div>
                  </div>
                  <Button size="sm" onClick={() => handleOpenActivityModal()}>
                     <Plus className="w-4 h-4 mr-2" /> เพิ่มรายการกิจกรรม
                  </Button>
               </div>

               <div className="grid grid-cols-1 gap-6">
                  {activeReport.activities.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-24 text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                        <FileText className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-mono text-xs uppercase tracking-widest">ยังไม่มีรายการในรายงานนี้</p>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenActivityModal()} className="mt-4">
                           เพิ่มรายการแรก
                        </Button>
                     </div>
                  ) : (
                     activeReport.activities.map((activity) => (
                        <ActivityCard
                           key={activity.id}
                           activity={activity}
                           onEdit={handleOpenActivityModal}
                           onDelete={handleDeleteActivity}
                           onZoom={(images, index) => setZoomState({ images, currentIndex: index })}
                           getActivityTypeInfo={getActivityTypeInfo}
                        />
                     ))
                  )}
               </div>
            </div>
         ) : (
            // --- Dashboard / Folder View ---
            <div className="space-y-6">
               <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg flex items-center gap-4 sticky top-0 z-20 backdrop-blur-md">
                  <div className="relative flex-1 group">
                     <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                     <input
                        type="text"
                        placeholder="ค้นหาชื่อโฟลเดอร์/รายงาน..."
                        className="w-full bg-black/50 border border-slate-700 rounded pl-9 pr-4 py-2 text-sm text-slate-200 focus:border-cyan-500 outline-none transition-all placeholder-slate-600"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                     />
                  </div>
                  {/* Optional: Filter buttons could go here */}
               </div>

               <div className="min-h-[400px]">
                  {activeFolderId ? (
                     // --- Folder Content (List of Reports) ---
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-right duration-300">
                        {getDisplayReports().map(report => (
                           <div
                              key={report.id}
                              onClick={() => setActiveReportId(report.id)}
                              className="group cursor-pointer relative bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300"
                           >
                              <div className="flex justify-between items-start mb-4">
                                 <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg text-cyan-400 group-hover:text-white group-hover:bg-cyan-500 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-300">
                                    <FileText className="w-6 h-6" />
                                 </div>
                                 <button
                                    onClick={(e) => handleDeleteReport(report.id, e)}
                                    className="text-slate-600 hover:text-red-500 p-1.5 rounded hover:bg-slate-900 transition-colors"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>

                              <h3 className="text-lg font-bold text-white font-display uppercase truncate group-hover:text-cyan-400 transition-colors">{report.title}</h3>
                              <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-2">
                                 <Calendar className="w-3 h-3" /> {new Date(report.date).toLocaleDateString('th-TH')}
                              </div>

                              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-black px-2 py-1 rounded border border-slate-800">
                                    {report.activities.length} รายการ
                                 </div>
                                 <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-transform" />
                              </div>
                           </div>
                        ))}
                        {getDisplayReports().length === 0 && (
                           <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                              <FileText className="w-12 h-12 mb-2 opacity-20" />
                              <p>ไม่พบรายงานในโฟลเดอร์นี้</p>
                           </div>
                        )}
                     </div>
                  ) : (
                     // --- Root Level (List of Folders) ---
                     getDisplayFolders().length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
                           {getDisplayFolders().map(folder => (
                              <div
                                 key={folder.id}
                                 onClick={() => setActiveFolderId(folder.id)}
                                 className="group cursor-pointer relative"
                              >
                                 <div className="absolute inset-0 bg-cyan-500 rounded-lg blur-xl opacity-0 group-hover:opacity-10 transition-all duration-500"></div>
                                 <div className="relative bg-slate-900/60 border-2 border-slate-800 rounded-lg p-5 flex flex-col items-center gap-4 hover:border-cyan-500/50 hover:scale-105 transition-all duration-300">
                                    <div className="relative">
                                       <Folder className="w-16 h-16 text-slate-700 group-hover:hidden" />
                                       <FolderOpen className="w-16 h-16 text-cyan-400 hidden group-hover:block" />
                                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-2 text-slate-900 font-bold text-xs">
                                          {folder.date.getMonth() + 1}
                                       </div>
                                    </div>
                                    <div className="text-center w-full">
                                       <h3 className="text-white font-bold font-display uppercase tracking-widest truncate">{folder.title}</h3>
                                       <div className="text-[10px] font-mono text-cyan-500 uppercase font-bold mt-1">
                                          {folder.date.getFullYear() + 543} {/* Thai Year approximate display or just AD */}
                                       </div>
                                       <div className="mt-2 text-[10px] font-bold text-slate-500 border border-slate-800 px-2 py-1 rounded bg-black">
                                          {folder.reports.length} รายงาน
                                       </div>
                                    </div>
                                    <div className="mt-1 w-full flex justify-between items-center text-[9px] font-mono text-slate-600 uppercase border-t border-slate-800 pt-3">
                                       <span>เปิดโฟลเดอร์</span>
                                       <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                           <Folder className="w-12 h-12 mb-4 opacity-20" />
                           <p className="font-mono text-xs uppercase tracking-widest">ไม่พบข้อมูลรายงาน</p>
                           <Button variant="ghost" size="sm" onClick={() => setIsReportModalOpen(true)} className="mt-4">
                              สร้างรายงานแรก
                           </Button>
                        </div>
                     )
                  )}
               </div>
            </div>
         )}

         {/* Create Report Modal */}
         {isReportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
               <Card className="w-full max-w-md border-cyan-500/30">
                  <CardHeader className="flex flex-row justify-between items-center">
                     <CardTitle>สร้างรายงานการประชุมใหม่</CardTitle>
                     <button onClick={() => setIsReportModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                  </CardHeader>
                  <CardContent>
                     <form onSubmit={handleCreateReport} className="space-y-6">
                        <div>
                           <label className="block text-[10px] font-bold text-cyan-500 uppercase mb-2 tracking-widest">ชื่อหัวข้อรายงาน / การประชุม</label>
                           <input
                              autoFocus
                              className="w-full bg-black border border-slate-800 p-3 text-white focus:border-cyan-500 outline-none font-display tracking-wide rounded"
                              placeholder="เช่น รายงานประจำเดือนมกราคม..."
                              value={newReportTitle}
                              onChange={e => setNewReportTitle(e.target.value)}
                           />
                        </div>
                        <div className="flex gap-3 pt-2">
                           <Button type="button" variant="ghost" onClick={() => setIsReportModalOpen(false)} className="flex-1">ยกเลิก</Button>
                           <Button type="submit" className="flex-[2] shadow-glow-cyan">สร้างรายงาน</Button>
                        </div>
                     </form>
                  </CardContent>
               </Card>
            </div>
         )}

         {/* Activity Edit Modal */}
         {isActivityModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300 overflow-y-auto">
               <Card className="w-full max-w-2xl border-cyan-500/30 my-8">
                  <CardHeader className="flex flex-row justify-between items-center border-b border-slate-800 bg-slate-950/50">
                     <CardTitle>{editingActivity ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</CardTitle>
                     <button onClick={() => setIsActivityModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                  </CardHeader>
                  <CardContent className="p-6">
                     <form onSubmit={handleSaveActivity} className="space-y-6">
                        {/* Type Selection */}
                        <div className="grid grid-cols-3 gap-3">
                           {['INSTALL', 'REPAIR', 'PURCHASE'].map(type => {
                              const info = getActivityTypeInfo(type);
                              const Icon = info.icon;
                              const isSelected = activityFormData.type === type;
                              return (
                                 <button
                                    key={type}
                                    type="button"
                                    onClick={() => setActivityFormData({ ...activityFormData, type: type as any })}
                                    className={`p-3 rounded border flex flex-col items-center gap-2 transition-all ${isSelected ? `${info.bg} ${info.border} ${info.color}` : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
                                 >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] font-bold uppercase">{info.label}</span>
                                 </button>
                              )
                           })}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">วันที่ดำเนินการ</label>
                              <input type="date" className="w-full bg-black border border-slate-800 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none" value={activityFormData.date} onChange={e => setActivityFormData({ ...activityFormData, date: e.target.value })} />
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่ออุปกรณ์ / รายการ</label>
                              <input required className="w-full bg-black border border-slate-800 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none" placeholder="ระบุชื่ออุปกรณ์..." value={activityFormData.deviceName} onChange={e => setActivityFormData({ ...activityFormData, deviceName: e.target.value })} />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">สถานที่ / จุดติดตั้ง</label>
                              <input required className="w-full bg-black border border-slate-800 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none" placeholder="ระบุสถานที่..." value={activityFormData.location} onChange={e => setActivityFormData({ ...activityFormData, location: e.target.value })} />
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ผู้รับผิดชอบ / ดำเนินการ</label>
                              <input className="w-full bg-black border border-slate-800 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none" placeholder="ระบุชื่อ..." value={activityFormData.owner} onChange={e => setActivityFormData({ ...activityFormData, owner: e.target.value })} />
                           </div>
                        </div>

                        <div>
                           <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">รายละเอียดเพิ่มเติม</label>
                           <textarea rows={3} className="w-full bg-black border border-slate-800 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none resize-none font-mono" placeholder="รายละเอียดการซ่อม หรือ การติดตั้ง..." value={activityFormData.details} onChange={e => setActivityFormData({ ...activityFormData, details: e.target.value })} />
                        </div>

                        {/* Image Comparison Upload */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                           {/* Before Images */}
                           <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest text-center">รูปก่อนทำ (Before) - {(activityFormData.beforeImages || []).length} รูป</label>
                              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                 {(activityFormData.beforeImages || []).map((img, idx) => (
                                    <div key={idx} className="relative aspect-video bg-black rounded border border-slate-700 overflow-hidden group">
                                       <img src={img} className="w-full h-full object-cover" alt={`before-${idx}`} />
                                       <button
                                          type="button"
                                          onClick={() => handleRemoveImage('before', idx)}
                                          className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                       >
                                          <X className="w-3 h-3" />
                                       </button>
                                    </div>
                                 ))}
                                 <div
                                    className="aspect-video bg-slate-900 border-2 border-dashed border-slate-700 rounded flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition-all"
                                    onClick={() => beforeInputRef.current?.click()}
                                 >
                                    <Camera className="w-5 h-5 text-slate-600 mb-1" />
                                    <span className="text-[8px] text-slate-500 uppercase">เพิ่มรูป</span>
                                 </div>
                              </div>
                              <input type="file" ref={beforeInputRef} className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload('before', e)} />
                           </div>

                           {/* After Images */}
                           <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-green-500 uppercase tracking-widest text-center">รูปหลังทำ (After) - {(activityFormData.afterImages || []).length} รูป</label>
                              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                 {(activityFormData.afterImages || []).map((img, idx) => (
                                    <div key={idx} className="relative aspect-video bg-black rounded border border-slate-700 overflow-hidden group">
                                       <img src={img} className="w-full h-full object-cover" alt={`after-${idx}`} />
                                       <button
                                          type="button"
                                          onClick={() => handleRemoveImage('after', idx)}
                                          className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                       >
                                          <X className="w-3 h-3" />
                                       </button>
                                    </div>
                                 ))}
                                 <div
                                    className="aspect-video bg-slate-900 border-2 border-dashed border-slate-700 rounded flex flex-col items-center justify-center cursor-pointer hover:border-green-500/50 transition-all"
                                    onClick={() => afterInputRef.current?.click()}
                                 >
                                    <Camera className="w-5 h-5 text-slate-600 mb-1" />
                                    <span className="text-[8px] text-slate-500 uppercase">เพิ่มรูป</span>
                                 </div>
                              </div>
                              <input type="file" ref={afterInputRef} className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload('after', e)} />
                           </div>
                        </div>

                        <div className="pt-6 flex gap-3 border-t border-slate-800 mt-4">
                           <Button type="button" variant="ghost" onClick={() => setIsActivityModalOpen(false)} className="flex-1">ยกเลิก</Button>
                           <Button type="submit" className="flex-[2] shadow-glow-cyan">บันทึกข้อมูล</Button>
                        </div>
                     </form>
                  </CardContent>
               </Card>
            </div>
         )}
      </div>
   );
};
