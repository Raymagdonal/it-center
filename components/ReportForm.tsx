
import React, { useState, useRef } from 'react';
import {
  Camera, MapPin, Upload, X, ChevronLeft, Trash2, Plus, Check,
  Video, Tablet, Printer, Smartphone, Monitor, Cable, Plug, Speaker, Mic, Radio, MoreHorizontal,
  Laptop, Zap, Ship, Anchor, Calendar, ChevronRight, ExternalLink, TableProperties
} from 'lucide-react';

import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { DeviceType, MaintenanceTicket } from '../types';
import { compressImage } from '../utils/storageUtils';


interface ReportFormProps {
  onSubmit: (ticket: Omit<MaintenanceTicket, 'id' | 'status'>) => void;
  onCancel: () => void;
  initialData?: MaintenanceTicket | null;
}

interface FormScrollGalleryProps {
  label: string;
  count: number;
  theme: 'cyan' | 'green';
  images: string[];
  onRemove: (index: number) => void;
  onAdd: () => void;
}

const FormScrollGallery: React.FC<FormScrollGalleryProps> = ({ label, count, theme, images, onRemove, onAdd }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isCyan = theme === 'cyan';
  const colorClass = isCyan ? 'text-cyan-400' : 'text-green-400';
  const bgClass = isCyan ? 'bg-cyan-500' : 'bg-green-500';
  const borderClass = isCyan ? 'border-cyan-500/20' : 'border-green-500/20';
  const containerClass = isCyan ? 'bg-cyan-950/10' : 'bg-green-950/10';

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-5 ${bgClass} rounded-sm`}></span>
        <h3 className={`text-sm font-bold uppercase tracking-wider font-['Rajdhani'] ${colorClass}`}>{label}</h3>
      </div>

      <div className={`relative group/gallery p-3 border ${borderClass} rounded-lg ${containerClass}`}>
        {/* Arrows */}
        {images.length > 2 && (
          <>
            <button
              type="button"
              onClick={() => scroll('left')}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/60 text-white border border-slate-700 rounded-full hover:bg-black/80 hover:scale-110 transition-all opacity-0 group-hover/gallery:opacity-100 shadow-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/60 text-white border border-slate-700 rounded-full hover:bg-black/80 hover:scale-110 transition-all opacity-0 group-hover/gallery:opacity-100 shadow-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto custom-scrollbar-hidden pb-1 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
          {images.map((img, index) => (
            <div key={index} className={`relative shrink-0 w-24 h-24 group/item rounded-lg overflow-hidden border ${isCyan ? 'border-cyan-500/30' : 'border-green-500/30'} bg-black`}>
              <img src={img} alt={`${theme}-${index}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 p-1 bg-black/80 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all z-10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Add Button */}
          <button
            type="button"
            onClick={onAdd}
            className={`shrink-0 w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed ${isCyan ? 'border-cyan-500/30 hover:border-cyan-500/50' : 'border-green-500/30 hover:border-green-500/50'} rounded-lg bg-slate-900/40 hover:bg-${isCyan ? 'cyan' : 'green'}-500/5 transition-all group/btn`}
          >
            <div className={`w-8 h-8 rounded-full bg-slate-800 border ${isCyan ? 'border-cyan-500/30' : 'border-green-500/30'} flex items-center justify-center mb-1 group-hover/btn:scale-110 transition-transform`}>
              <Plus className={`w-4 h-4 ${colorClass}`} />
            </div>
            <span className={`text-[9px] font-bold ${colorClass} uppercase tracking-widest`}>เพิ่มรูป</span>
          </button>
        </div>
      </div>

      <div className={`text-[10px] font-mono ${isCyan ? 'text-cyan-600' : 'text-green-600'} uppercase tracking-widest`}>
        {label.split(' ')[0]}: {count} รูป
      </div>
    </div>
  );
};

export const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [images, setImages] = useState<string[]>([]);  // Before images
  const [afterImages, setAfterImages] = useState<string[]>([]);  // After images
  const [formData, setFormData] = useState({
    deviceType: 'OTHER' as DeviceType,
    deviceId: '',
    location: '',
    description: '',
    contactName: '',
  });

  // New state fields
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [locationType, setLocationType] = useState<'PORT' | 'VESSEL'>('PORT');

  const [customTypes, setCustomTypes] = useState<{ id: string, label: string, icon: any }[]>([]);
  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialData) {
      // Parse Location Type
      let loc = initialData.location;
      let type: 'PORT' | 'VESSEL' = 'PORT';
      if (loc.includes('[ท่าเรือ]')) {
        type = 'PORT';
        loc = loc.replace('[ท่าเรือ]', '').trim();
      } else if (loc.includes('[ในเรือ]')) {
        type = 'VESSEL';
        loc = loc.replace('[ในเรือ]', '').trim();
      }

      // Parse Description (remove date prefix if exists)
      let desc = initialData.issueDescription;
      desc = desc.replace(/^\[วันที่:.*?\]\s*/, '');

      setFormData({
        deviceType: initialData.deviceType,
        deviceId: initialData.deviceId || '',
        location: loc,
        description: desc,
        contactName: initialData.contactName || '',
      });
      setIncidentDate(initialData.timestamp.split('T')[0]);
      setLocationType(type);
      if (initialData.imageUrls) {
        setImages(initialData.imageUrls);
      }
      // Load after images
      if (initialData.fixedImageUrls) {
        setAfterImages(initialData.fixedImageUrls);
      } else if (initialData.fixedImageUrl) {
        setAfterImages([initialData.fixedImageUrl]);
      }

      // Check if device type is custom
      const isDefault = defaultTypes.some(t => t.id === initialData.deviceType);
      if (!isDefault && initialData.deviceType) {
        setCustomTypes(prev => {
          if (!prev.some(t => t.id === initialData.deviceType)) {
            return [...prev, { id: initialData.deviceType, label: initialData.deviceType, icon: MoreHorizontal }];
          }
          return prev;
        });
      }
    }
  }, [initialData]);

  const defaultTypes = [
    { id: 'CCTV', label: 'กล้อง CCTV', icon: Video },
    { id: 'MOBILE_TICKET', label: 'เครื่องขายตั๋ว Mobile', icon: Tablet },
    { id: 'MOBILE_PRINTER', label: 'Printer Mobile', icon: Printer },
    { id: 'PRINTER_DESKTOP', label: 'Printer Desktop', icon: Printer },
    { id: 'SMARTPHONE', label: 'Smartphone', icon: Smartphone },
    { id: 'PC_NOTEBOOK', label: 'PC/Notebook', icon: Laptop },
    { id: 'KIOSK', label: 'Kiosk', icon: Monitor },
    { id: 'CABLE_TYPE_C', label: 'สายชาร์จ Type C', icon: Cable },
    { id: 'ADAPTER_5V', label: 'Adapter 5v', icon: Plug },
    { id: 'POWER_STRIP', label: 'ปลั๊กไฟต่อพ่วง', icon: Zap },
    { id: 'AMPLIFIER', label: 'Amplifier', icon: Speaker },
    { id: 'MICROPHONE', label: 'Microphone', icon: Mic },
    { id: 'RADIO', label: 'วิทยุสื่อสาร', icon: Radio },
    { id: 'OTHER', label: 'อื่นๆ', icon: MoreHorizontal }
  ];

  const allTypes = [...defaultTypes, ...customTypes];

  const handleAddCustomType = () => {
    if (newTypeLabel.trim()) {
      const newId = newTypeLabel.trim();
      setCustomTypes([...customTypes, { id: newId, label: newId, icon: MoreHorizontal }]);
      setFormData({ ...formData, deviceType: newId });
      setNewTypeLabel("");
      setIsAddingType(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressed = await compressImage(reader.result as string);
          setImages(prev => [...prev, compressed]);
        };
        reader.readAsDataURL(file);
      });
    }
  };


  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAfterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressed = await compressImage(reader.result as string);
          setAfterImages(prev => [...prev, compressed]);
        };
        reader.readAsDataURL(file);
      });
    }
  };


  const handleRemoveAfterImage = (index: number) => {
    setAfterImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Format date for description
    const dateStr = new Date(incidentDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    // Prepend date to description to persist it
    const fullDescription = `[วันที่: ${dateStr}] ${formData.description}`;

    // Format location with type prefix
    const typePrefix = locationType === 'PORT' ? '[ท่าเรือ]' : '[ในเรือ]';
    const fullLocation = `${typePrefix} ${formData.location || 'ไม่ระบุ'}`;

    onSubmit({
      deviceType: formData.deviceType,
      deviceId: formData.deviceId || `DEV-${Math.floor(Math.random() * 1000)}`,
      issueDescription: fullDescription,
      location: fullLocation,
      imageUrls: images.length > 0 ? images : undefined,
      fixedImageUrls: afterImages.length > 0 ? afterImages : undefined,
      contactName: formData.contactName,
      timestamp: new Date(incidentDate).toISOString(),
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={onCancel} className="rounded-lg w-10 h-10 p-0 border border-slate-700 hover:border-cyan-500">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white font-['Rajdhani'] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-8 bg-cyan-500 rounded-sm"></span>
              {initialData ? 'แก้ไขใบแจ้งซ่อม' : 'สร้างใบแจ้งซ่อม'}
            </h2>
            <p className="text-slate-500 text-sm font-mono uppercase">{initialData ? 'Edit Maintenance Ticket' : 'New Maintenance Request Ticket'}</p>
          </div>
          
          <a 
            href="https://docs.google.com/spreadsheets/d/1M6f-xHA9E0mqdTbvIFkROLbL4d6gJaC0JC8QRhHYmh0/edit?pli=1&gid=2077750642#gid=2077750642" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 hover:bg-green-500 hover:text-black transition-all group"
          >
            <TableProperties className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest font-['Rajdhani']">Google Sheets Log</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Upload Area */}
        <div className="lg:col-span-4 space-y-6">
          {/* BEFORE Images Section */}
          <FormScrollGallery
            label="Before (ก่อนซ่อม)"
            count={images.length}
            theme="cyan"
            images={images}
            onRemove={handleRemoveImage}
            onAdd={() => fileInputRef.current?.click()}
          />
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />

          {/* AFTER Images Section */}
          <FormScrollGallery
            label="After (หลังซ่อม)"
            count={afterImages.length}
            theme="green"
            images={afterImages}
            onRemove={handleRemoveAfterImage}
            onAdd={() => afterFileInputRef.current?.click()}
          />
          <input type="file" ref={afterFileInputRef} className="hidden" accept="image/*" multiple onChange={handleAfterImageUpload} />
        </div>

        {/* Right Column: Form Fields */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="space-y-2">
                  <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest font-['Rajdhani'] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                    ประเภทอุปกรณ์ (DEVICE CATEGORY)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto custom-scrollbar p-1">
                    {allTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <div
                          key={type.id}
                          onClick={() => setFormData({ ...formData, deviceType: type.id as DeviceType })}
                          className={`cursor-pointer px-2 py-3 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center gap-2 text-center group ${formData.deviceType === type.id
                            ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                          <Icon className={`w-6 h-6 ${formData.deviceType === type.id ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                          <span className="line-clamp-2 leading-tight uppercase font-['Rajdhani']">{type.label}</span>
                        </div>
                      );
                    })}

                    {!isAddingType ? (
                      <div
                        onClick={() => setIsAddingType(true)}
                        className="cursor-pointer px-2 py-3 rounded-lg text-xs font-medium border border-dashed border-slate-700 text-slate-600 hover:border-cyan-500/50 hover:text-cyan-500 hover:bg-cyan-950/10 transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <Plus className="w-6 h-6" />
                        <span>เพิ่มประเภท</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 px-2 py-2 rounded-lg border border-cyan-500/50 bg-slate-900 col-span-1">
                        <input
                          type="text"
                          autoFocus
                          className="w-full text-xs outline-none bg-transparent text-cyan-100 placeholder-slate-600 text-center uppercase"
                          placeholder="ระบุ..."
                          value={newTypeLabel}
                          onChange={(e) => setNewTypeLabel(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomType())}
                        />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleAddCustomType(); }}
                            className="p-1 bg-cyan-900/50 text-cyan-400 rounded hover:bg-cyan-800/50"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingType(false)}
                            className="p-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Date Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-['Rajdhani']">วันที่แจ้ง</label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full pl-4 pr-3 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all font-mono"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                      />
                      <Calendar className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-['Rajdhani']">ตำแหน่ง / รหัสจุดติดตั้ง</label>
                    <input
                      type="text"
                      placeholder="ระบุตำแหน่ง/รหัสจุดติดตั้ง"
                      className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all placeholder-slate-600 font-mono"
                      value={formData.deviceId}
                      onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-['Rajdhani']">ผู้แจ้ง</label>
                    <input
                      type="text"
                      placeholder="ชื่อ-สกุล"
                      className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all placeholder-slate-600"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-['Rajdhani']">สถานที่ / จุดที่ตั้ง</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="ระบุพิกัด / โซน"
                      className="flex-1 px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all placeholder-slate-600 font-mono h-[46px]"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                    <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1 shrink-0 h-[46px]">
                      <button
                        type="button"
                        onClick={() => setLocationType('PORT')}
                        className={`flex-1 sm:flex-none px-4 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${locationType === 'PORT' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        <Anchor className="w-4 h-4" /> ท่าเรือ
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocationType('VESSEL')}
                        className={`flex-1 sm:flex-none px-4 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${locationType === 'VESSEL' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        <Ship className="w-4 h-4" /> ในเรือ
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-['Rajdhani']">รายละเอียดปัญหา</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all resize-none placeholder-slate-600 font-mono"
                    placeholder="ระบุอาการเสีย..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-slate-400 hover:text-slate-200"
                    onClick={onCancel}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-[2]"
                  >
                    {initialData ? 'บันทึกการแก้ไข' : 'ส่งใบแจ้งซ่อม'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
