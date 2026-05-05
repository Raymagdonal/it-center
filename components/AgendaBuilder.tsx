import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Loader2, Calendar, File, RefreshCw, Plus, 
  Trash2, Image as ImageIcon, Video as VideoIcon, X, MoveUp, MoveDown, Save, ChevronUp, ChevronDown
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Timeline } from './Timeline';
import { generateMeetingAgenda } from '../services/geminiService';
import { MeetingAgenda, AgendaItem, AgendaMedia } from '../types';

export const AgendaBuilder: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'EDIT' | 'PREVIEW'>('EDIT');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Agenda State
  const [agenda, setAgenda] = useState<MeetingAgenda>({
    title: 'วาระการประชุมใหม่',
    date: new Date().toLocaleDateString('th-TH'),
    summary: '',
    stakeholders: [],
    items: [
      {
        id: Math.random().toString(36).substr(2, 9),
        time: '09:00',
        duration: '15 นาที',
        topic: 'เริ่มการประชุม',
        description: 'กล่าวเปิดการประชุมและสรุปภาพรวม',
        owner: 'ประธานที่ประชุม',
        media: []
      }
    ]
  });

  const handleAIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGenerating(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const result = await generateMeetingAgenda(base64Data, file.type);
        // Inject IDs for local management
        const formattedResult = {
          ...result,
          items: result.items.map(item => ({
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            media: []
          }))
        };
        setAgenda(formattedResult);
        setViewMode('EDIT');
      } catch (error) {
        console.error("Failed to generate agenda:", error);
        alert("ไม่สามารถวิเคราะห์เอกสารได้");
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateAgendaField = (field: keyof MeetingAgenda, value: any) => {
    setAgenda(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: AgendaItem = {
      id: Math.random().toString(36).substr(2, 9),
      time: '',
      duration: '',
      topic: '',
      description: '',
      owner: '',
      media: []
    };
    setAgenda(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    setAgenda(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...agenda.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setAgenda(prev => ({ ...prev, items: newItems }));
  };

  const updateItemField = (id: string, field: keyof AgendaItem, value: any) => {
    setAgenda(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleMediaUpload = (itemId: string, e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newMedia: AgendaMedia = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        url: reader.result as string
      };
      setAgenda(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId 
            ? { ...item, media: [...(item.media || []), newMedia] } 
            : item
        )
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = (itemId: string, mediaId: string) => {
    setAgenda(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, media: (item.media || []).filter(m => m.id !== mediaId) } 
          : item
      )
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white font-display uppercase tracking-widest flex items-center gap-3">
            <Calendar className="h-8 w-8 text-cyan-500 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            ระบบจัดการวาระการประชุม
          </h2>
          <p className="text-slate-500 font-mono text-[10px] mt-1 tracking-widest text-glow uppercase">PROTOCOL: จัดทำวาระการประชุมอัตโนมัติ</p>
        </div>

        <div className="flex gap-2">
           <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAIUpload} 
            className="hidden" 
            accept=".pdf,image/*" 
          />
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} isLoading={isGenerating}>
             <RefreshCw className="w-3 h-3 mr-1" /> วิเคราะห์จากเอกสาร (AI)
          </Button>
          <Button variant={viewMode === 'PREVIEW' ? 'primary' : 'outline'} size="sm" onClick={() => setViewMode(viewMode === 'EDIT' ? 'PREVIEW' : 'EDIT')}>
             {viewMode === 'EDIT' ? 'ดูภาพรวมไทม์ไลน์' : 'กลับไปที่ตัวแก้ไข'}
          </Button>
        </div>
      </div>

      {viewMode === 'EDIT' ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Main Info */}
          <div className="xl:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ข้อมูลการประชุม</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-cyan-600 uppercase font-bold tracking-widest">ชื่อหัวข้อการประชุม</label>
                  <input 
                    className="w-full bg-black border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none"
                    value={agenda.title}
                    onChange={e => updateAgendaField('title', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-cyan-600 uppercase font-bold tracking-widest">วันที่</label>
                  <input 
                    className="w-full bg-black border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none"
                    value={agenda.date}
                    onChange={e => updateAgendaField('date', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-cyan-600 uppercase font-bold tracking-widest">สรุปย่อ/เป้าหมาย</label>
                  <textarea 
                    className="w-full bg-black border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none h-24 resize-none"
                    value={agenda.summary}
                    onChange={e => updateAgendaField('summary', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agenda Items */}
          <div className="xl:col-span-3 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">รายการวาระทั้งหมด: {agenda.items.length} รายการ</span>
               <Button variant="secondary" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" /> เพิ่มวาระใหม่
               </Button>
            </div>

            <div className="space-y-4">
              {agenda.items.map((item, index) => (
                <Card key={item.id} className="border-l-4 border-l-cyan-500">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex flex-wrap gap-4 items-start">
                      <div className="flex-1 min-w-[150px] space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                            <label className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">เวลา</label>
                            <input 
                              placeholder="09:00"
                              className="w-full bg-black border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none"
                              value={item.time}
                              onChange={e => updateItemField(item.id, 'time', e.target.value)}
                            />
                           </div>
                           <div>
                            <label className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">ระยะเวลา</label>
                            <input 
                              placeholder="15 นาที"
                              className="w-full bg-black border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none"
                              value={item.duration}
                              onChange={e => updateItemField(item.id, 'duration', e.target.value)}
                            />
                           </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">หัวข้อวาระ</label>
                          <input 
                            placeholder="ระบุชื่อหัวข้อ..."
                            className="w-full bg-black border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none font-bold"
                            value={item.topic}
                            onChange={e => updateItemField(item.id, 'topic', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex-[2] min-w-[250px]">
                        <label className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">รายละเอียดวาระ</label>
                        <textarea 
                          placeholder="รายละเอียดประกอบวาระ..."
                          className="w-full bg-black border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none h-20 resize-none"
                          value={item.description}
                          onChange={e => updateItemField(item.id, 'description', e.target.value)}
                        />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">ผู้รับผิดชอบ</label>
                          <input 
                            placeholder="ชื่อผู้รับผิดชอบ..."
                            className="w-full bg-black border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none"
                            value={item.owner}
                            onChange={e => updateItemField(item.id, 'owner', e.target.value)}
                          />
                        </div>
                        <div className="flex gap-1 justify-end">
                           <button 
                             onClick={() => moveItem(index, 'up')}
                             disabled={index === 0}
                             className="p-1.5 bg-slate-800 rounded hover:text-cyan-400 transition-colors disabled:opacity-30"
                             title="เลื่อนขึ้น"
                           >
                              <ChevronUp className="w-3.5 h-3.5" />
                           </button>
                           <button 
                             onClick={() => moveItem(index, 'down')}
                             disabled={index === agenda.items.length - 1}
                             className="p-1.5 bg-slate-800 rounded hover:text-cyan-400 transition-colors disabled:opacity-30"
                             title="เลื่อนลง"
                           >
                              <ChevronDown className="w-3.5 h-3.5" />
                           </button>
                           <label className="cursor-pointer p-1.5 bg-slate-800 rounded hover:text-cyan-400 transition-colors" title="เพิ่มรูปภาพ">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <input type="file" className="hidden" accept="image/*" onChange={e => handleMediaUpload(item.id, e, 'image')} />
                           </label>
                           <label className="cursor-pointer p-1.5 bg-slate-800 rounded hover:text-cyan-400 transition-colors" title="เพิ่มวิดีโอ">
                              <VideoIcon className="w-3.5 h-3.5" />
                              <input type="file" className="hidden" accept="video/*" onChange={e => handleMediaUpload(item.id, e, 'video')} />
                           </label>
                           <button onClick={() => removeItem(item.id)} className="p-1.5 bg-red-950/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      </div>
                    </div>

                    {/* Media Previews */}
                    {item.media && item.media.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 border-t border-slate-800/50 pt-2">
                         {item.media.map(m => (
                           <div key={m.id} className="relative w-16 h-16 rounded border border-slate-700 bg-black shrink-0 overflow-hidden group/media">
                              {m.type === 'image' ? (
                                <img src={m.url} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <VideoIcon className="w-4 h-4 text-cyan-500" />
                                </div>
                              )}
                              <button 
                                onClick={() => removeMedia(item.id, m.id)}
                                className="absolute top-0 right-0 p-0.5 bg-red-500 text-white opacity-0 group-hover/media:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                           </div>
                         ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-500">
           <div className="bg-slate-950/50 rounded-xl border border-cyan-500/20 shadow-[0_0_50px_-20px_rgba(34,211,238,0.3)]">
              <Timeline agenda={agenda} />
           </div>
        </div>
      )}
    </div>
  );
};
