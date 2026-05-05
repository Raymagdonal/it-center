
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TrackedAsset } from '../types';
import { 
  Search, Map as MapIcon, Navigation, Locate, Monitor, Battery, Wifi, 
  MoreVertical, Ship, Anchor, Signal, User, Plus, Edit, Trash2, Move, Save, X, Settings, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';

interface MediaMapProps {
  assets: TrackedAsset[];
  targetedSn: string | null;
  onUpdate: (assets: TrackedAsset[]) => void;
}

interface MapLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'PIER' | 'OTHER';
}

// Initial Data
const INITIAL_LOCATIONS_DATA: MapLocation[] = [
  { id: 'loc_sathorn', name: "Sathorn", x: 55, y: 82, type: 'PIER' },
  { id: 'loc_iconsiam', name: "IconSiam", x: 45, y: 72, type: 'PIER' },
  { id: 'loc_ratchawong', name: "Ratchawong", x: 62, y: 55, type: 'PIER' },
  { id: 'loc_watarun', name: "Wat Arun", x: 32, y: 52, type: 'PIER' },
  { id: 'loc_thachang', name: "Tha Chang", x: 35, y: 35, type: 'PIER' },
  { id: 'loc_maharaj', name: "Maharaj", x: 34, y: 30, type: 'PIER' },
  { id: 'loc_prannok', name: "Prannok", x: 28, y: 25, type: 'PIER' },
  { id: 'loc_phraathit', name: "Phra Athit", x: 40, y: 15, type: 'PIER' },
  { id: 'loc_bts', name: "BTS", x: 60, y: 85, type: 'OTHER' },
];

const VESSEL_OPTIONS = ["CTB 1", "CTB 2", "CTB 3", "R1", "R2", "R3", "R4"];

export const MediaMap: React.FC<MediaMapProps> = ({ assets, targetedSn, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(targetedSn || null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VESSEL' | 'PORT'>('ALL');
  
  // Locations State
  const [locations, setLocations] = useState<MapLocation[]>(INITIAL_LOCATIONS_DATA);

  // Viewport State (Zoom & Pan)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Edit Mode States
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  const [editingAsset, setEditingAsset] = useState<TrackedAsset | null>(null);
  const [editingLocation, setEditingLocation] = useState<MapLocation | null>(null);
  
  // Dragging States
  const [draggingAssetId, setDraggingAssetId] = useState<string | null>(null);
  const [draggingLocationId, setDraggingLocationId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);

  // Initial forms
  const initialAssetForm: Partial<TrackedAsset> = {
    sn: '',
    name: '',
    location: '',
    locationType: 'PORT',
    username: '',
    installedDate: new Date().toISOString().split('T')[0],
    coordinates: { x: 50, y: 50 }
  };
  const [assetFormData, setAssetFormData] = useState<Partial<TrackedAsset>>(initialAssetForm);

  const initialLocationForm: Partial<MapLocation> = {
    name: '',
    type: 'PIER',
    x: 50, 
    y: 50
  };
  const [locationFormData, setLocationFormData] = useState<Partial<MapLocation>>(initialLocationForm);

  useEffect(() => {
    if (targetedSn) {
      setSelectedAssetId(targetedSn);
      // Optional: Auto-center or reset view when targeted
      setZoom(1.5);
      setPan({ x: 0, y: 0 }); 
    }
  }, [targetedSn]);

  // Derived Options
  const portOptions = useMemo(() => locations.map(l => l.name), [locations]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        asset.sn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = activeFilter === 'ALL' || asset.locationType === activeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [assets, searchTerm, activeFilter]);

  // --- Zoom Handlers ---
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedAssetId(null);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    const scaleAmount = -e.deltaY * 0.001;
    setZoom(prev => Math.min(Math.max(0.5, prev + scaleAmount), 4));
  };

  // --- Asset CRUD Handlers ---
  const handleOpenAssetModal = (asset?: TrackedAsset) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetFormData({ ...asset });
    } else {
      setEditingAsset(null);
      setAssetFormData(initialAssetForm);
    }
    setIsAssetModalOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const newAsset: TrackedAsset = {
      ...(assetFormData as TrackedAsset),
      id: editingAsset ? editingAsset.id : Math.random().toString(36).substr(2, 9),
      coordinates: assetFormData.coordinates || { x: 50, y: 50 }
    };

    if (editingAsset) {
      onUpdate(assets.map(a => a.id === editingAsset.id ? newAsset : a));
    } else {
      onUpdate([...assets, newAsset]);
    }
    setIsAssetModalOpen(false);
  };

  const handleDeleteAsset = (id: string, skipConfirm = false) => {
    if (skipConfirm || confirm('ยืนยันการลบอุปกรณ์นี้ออกจากแผนที่?')) {
      onUpdate(assets.filter(a => a.id !== id));
      if (selectedAssetId === id) setSelectedAssetId(null);
    }
  };

  // --- Location CRUD Handlers ---
  const handleOpenLocationModal = (loc?: MapLocation) => {
    if (loc) {
      setEditingLocation(loc);
      setLocationFormData({ ...loc });
    } else {
      setEditingLocation(null);
      setLocationFormData({ ...initialLocationForm, x: 50, y: 50 });
    }
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const newLoc: MapLocation = {
      ...(locationFormData as MapLocation),
      id: editingLocation ? editingLocation.id : `loc_${Math.random().toString(36).substr(2, 9)}`,
    };

    if (editingLocation) {
      setLocations(locations.map(l => l.id === editingLocation.id ? newLoc : l));
    } else {
      setLocations([...locations, newLoc]);
    }
    setIsLocationModalOpen(false);
  };

  const handleDeleteLocation = (id: string) => {
    if (confirm('ยืนยันการลบสถานที่นี้? (ตำแหน่งอุปกรณ์ที่ผูกไว้อาจได้รับผลกระทบ)')) {
      setLocations(locations.filter(l => l.id !== id));
      setIsLocationModalOpen(false);
    }
  };

  // --- Mouse & Drag Handlers ---
  const handleMouseDownAsset = (e: React.MouseEvent, assetId: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setDraggingAssetId(assetId);
    setSelectedAssetId(assetId);
  };

  const handleMouseDownLocation = (e: React.MouseEvent, locId: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setDraggingLocationId(locId);
  };

  const handleMouseDownMap = (e: React.MouseEvent) => {
    // Start panning if we aren't dragging an item
    if (!draggingAssetId && !draggingLocationId) {
       setIsPanning(true);
       dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mapRef.current) return;
    
    // Handle Panning
    if (isPanning) {
      setPan(prev => ({ 
        x: prev.x + e.movementX, 
        y: prev.y + e.movementY 
      }));
      return;
    }

    // Handle Item Dragging
    if (draggingAssetId || draggingLocationId) {
      const rect = mapRef.current.getBoundingClientRect();
      
      // Calculate mouse position relative to container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust for Pan and Zoom to get 'local' map percentage coordinates
      // Formula: (MousePos - PanOffset) / ZoomLevel
      const adjustedX = (mouseX - pan.x) / zoom;
      const adjustedY = (mouseY - pan.y) / zoom;

      // Convert to percentage
      const x = Math.min(100, Math.max(0, (adjustedX / rect.width) * 100));
      const y = Math.min(100, Math.max(0, (adjustedY / rect.height) * 100));

      if (draggingAssetId) {
        const updatedAssets = assets.map(a => 
          a.id === draggingAssetId ? { ...a, coordinates: { x, y } } : a
        );
        onUpdate(updatedAssets);
      } else if (draggingLocationId) {
        setLocations(locations.map(l => 
          l.id === draggingLocationId ? { ...l, x, y } : l
        ));
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingAssetId(null);
    setDraggingLocationId(null);
    setIsPanning(false);
    dragStartRef.current = null;
  };

  // Click handler to deselect, but only if we didn't drag/pan significantly
  const handleMapClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      // Logic to prevent deselect on drag release handled by separate state if needed
      // For now, simple click deselects
      setSelectedAssetId(null);
    }
  };

  return (
    <div 
      className="flex flex-col md:flex-row h-full max-h-screen bg-slate-950 overflow-hidden animate-in fade-in duration-500"
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      
      {/* LEFT PANEL: Fleet & Devices */}
      <div className="w-full md:w-[400px] flex flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-xl z-20 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white font-display tracking-widest flex items-center gap-3">
                <Navigation className="w-6 h-6 text-cyan-500" />
                NAVIGATOR
              </h2>
              <p className="text-[10px] text-cyan-600 font-mono font-bold tracking-[0.3em] uppercase mt-1">Network Explorer</p>
            </div>
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`p-2 rounded transition-all ${isEditMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 animate-pulse' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-white'}`}
              title="Toggle Edit Mode"
            >
               <Settings className="w-5 h-5" />
            </button>
          </div>
          
          {isEditMode && (
             <div className="flex items-center gap-2 p-2 bg-amber-950/30 border border-amber-500/20 rounded text-[10px] text-amber-400 font-mono uppercase font-bold">
                <Move className="w-3 h-3 animate-bounce" /> Edit Mode: Drag items to move
             </div>
          )}

          <div className="relative group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search devices, boats, stations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:border-cyan-500 outline-none transition-all placeholder-slate-600 font-mono"
            />
          </div>

          <div className="flex gap-2">
             {['ALL', 'VESSEL', 'PORT'].map((type) => (
               <button
                 key={type}
                 onClick={() => setActiveFilter(type as any)}
                 className={`flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${activeFilter === type ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'}`}
               >
                 {type}
               </button>
             ))}
          </div>
        </div>

        {/* Device List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
           <div className="flex justify-between items-center px-2 mb-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fleet & Boats ({filteredAssets.length})</span>
              {isEditMode && (
                <button 
                  onClick={() => handleOpenAssetModal()} 
                  className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-white transition-colors bg-cyan-950/50 px-2 py-1 rounded border border-cyan-500/30 hover:bg-cyan-500/20"
                >
                  <Plus className="w-3 h-3" /> ADD DEVICE
                </button>
              )}
           </div>
           
           {filteredAssets.map(asset => (
             <AssetListItem
               key={asset.id}
               asset={asset}
               isSelected={selectedAssetId === asset.id}
               isEditMode={isEditMode}
               onSelect={setSelectedAssetId}
               onEdit={handleOpenAssetModal}
               onDelete={(id) => handleDeleteAsset(id, true)}
             />
           ))}
        </div>
      </div>

      {/* RIGHT PANEL: Map View */}
      <div 
        className="flex-1 relative bg-slate-900 overflow-hidden cursor-grab active:cursor-grabbing" 
        ref={mapRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownMap}
      >
         {/* Transform Container for Zoom/Pan */}
         <div 
           className="w-full h-full origin-top-left transition-transform duration-75 ease-linear"
           style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
         >
           
           {/* Map Background Layer */}
           <div className="absolute inset-0 z-0 bg-[#0a0f1e]" onClick={handleMapClick}>
              {/* Grid Pattern */}
              <div className="absolute inset-0" style={{ 
                 backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px)', 
                 backgroundSize: '40px 40px' 
              }}></div>
              
              {/* Stylized River Path (SVG) & Route Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                 {/* Chao Phraya River Abstraction */}
                 <path d="M 40 0 Q 30 20 45 40 Q 60 60 30 80 Q 20 90 30 100" fill="none" stroke="#22d3ee" strokeWidth="8" strokeLinecap="round" className="opacity-20 blur-xl" />
                 <path d="M 40 0 Q 30 20 45 40 Q 60 60 30 80 Q 20 90 30 100" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="1 2" />
                 
                 {/* Dynamic Route Connections based on locations array */}
                 {locations.map((loc, i, arr) => {
                    if (i === 0) return null;
                    const prev = arr[i-1];
                    return (
                      <line key={`line-${i}`} x1={prev.x} y1={prev.y} x2={loc.x} y2={loc.y} stroke="#3b82f6" strokeWidth="0.2" className="opacity-40" />
                    )
                 })}
              </svg>
           </div>

           {/* Pins Layer (Locations/Piers) */}
           <div className="absolute inset-0 z-10">
              {locations.map((loc) => {
                 const isDragging = draggingLocationId === loc.id;
                 return (
                   <div 
                     key={loc.id}
                     className={`absolute transform -translate-x-1/2 -translate-y-1/2 group pointer-events-auto transition-transform ${isEditMode ? 'cursor-move' : ''} ${isDragging ? 'scale-125 z-50' : 'hover:scale-110 z-10'}`}
                     style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                     onMouseDown={(e) => handleMouseDownLocation(e, loc.id)}
                     onClick={(e) => { 
                        if(isEditMode) {
                           e.stopPropagation();
                           handleOpenLocationModal(loc);
                        }
                     }}
                   >
                      {/* Pier Marker */}
                      <div className={`w-3 h-3 rounded-full border-2 ${loc.type === 'PIER' ? 'border-cyan-500 bg-cyan-950' : 'border-slate-500 bg-slate-900'} relative z-10 transition-all ${isEditMode ? 'animate-pulse' : ''}`}>
                         {isEditMode && <div className="absolute inset-0 -m-1 border border-amber-500/50 rounded-full animate-ping"></div>}
                      </div>
                      {/* Label */}
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold text-slate-500 uppercase tracking-wider bg-black/50 px-1 rounded backdrop-blur-sm border border-slate-800 opacity-60 group-hover:opacity-100 transition-opacity">
                         {loc.name}
                      </div>
                   </div>
                 );
              })}

              {/* Render Assets */}
              {filteredAssets.map(asset => {
                 // Position Logic: Use stored coordinates OR fallback to mapped location OR fallback to center
                 let x, y;
                 
                 if (asset.coordinates) {
                   x = asset.coordinates.x;
                   y = asset.coordinates.y;
                 } else {
                   // Backward compatibility / Auto-placement logic: Find matching location object
                   const mappedLoc = locations.find(l => asset.location.includes(l.name));
                   const pos = mappedLoc ? { x: mappedLoc.x, y: mappedLoc.y } : { x: 50, y: 50 };
                   
                   // Add slight jitter
                   const jitterX = (asset.id.charCodeAt(0) % 5) - 2.5; 
                   const jitterY = (asset.id.charCodeAt(asset.id.length-1) % 5) - 2.5;
                   x = pos.x + jitterX;
                   y = pos.y + jitterY;
                 }
                 
                 const isSelected = selectedAssetId === asset.id;
                 const isDraggingThis = draggingAssetId === asset.id;

                 return (
                    <div 
                      key={asset.id}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 group z-20 pointer-events-auto ${isSelected ? 'z-30 scale-110' : 'hover:scale-110'} ${isDraggingThis ? 'scale-125 cursor-grabbing' : isEditMode ? 'cursor-grab' : 'cursor-pointer'}`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      onMouseDown={(e) => handleMouseDownAsset(e, asset.id)}
                      onClick={(e) => { e.stopPropagation(); setSelectedAssetId(asset.id); }}
                    >
                       {/* Pulse Effect for Selected */}
                       {isSelected && !isEditMode && (
                          <div className="absolute inset-0 -m-4 border-2 border-cyan-400 rounded-full animate-ping opacity-50"></div>
                       )}
                       
                       {/* Drag Handle Ring */}
                       {isEditMode && isSelected && (
                          <div className="absolute inset-0 -m-3 border border-dashed border-amber-400 rounded-full animate-spin-slow opacity-80 pointer-events-none"></div>
                       )}
                       
                       {/* Asset Icon Pin */}
                       <div className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg backdrop-blur-md ${isSelected ? 'bg-cyan-500 text-black border-white shadow-cyan-500/50' : asset.locationType === 'VESSEL' ? 'bg-slate-900/80 text-cyan-400 border-cyan-500/50' : 'bg-slate-900/80 text-amber-400 border-amber-500/50'}`}>
                          {asset.locationType === 'VESSEL' ? <Ship className="w-4 h-4" /> : <Anchor className="w-4 h-4" />}
                          
                          {/* Status Dot */}
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                       </div>

                       {/* Floating Tooltip */}
                       {!isDraggingThis && (
                         <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-slate-900/90 border border-slate-700 rounded-lg p-3 shadow-2xl backdrop-blur-xl transition-all pointer-events-none z-50 ${isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                            <div className="flex items-center justify-between mb-1">
                               <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{asset.locationType}</span>
                               <Signal className="w-3 h-3 text-green-400" />
                            </div>
                            <div className="text-white font-bold text-xs truncate mb-1">{asset.name}</div>
                            <div className="text-[9px] text-slate-400 font-mono border-t border-slate-700 pt-1 mt-1">
                               <div className="truncate">LOC: {asset.location}</div>
                               <div className="flex items-center gap-1 mt-1 text-slate-500 truncate">
                                  <User className="w-3 h-3" /> {asset.username}
                               </div>
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
                         </div>
                       )}
                    </div>
                 );
              })}
           </div>
         </div>

         {/* Map Controls / HUD */}
         <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30 pointer-events-auto">
            {isEditMode && (
               <button onClick={() => handleOpenLocationModal()} className="w-10 h-10 bg-amber-900/80 border border-amber-600 rounded text-amber-400 hover:text-white hover:bg-amber-800 transition-all flex items-center justify-center mb-2" title="Add Location">
                  <MapPin className="w-5 h-5" />
               </button>
            )}
            <button 
              onClick={handleZoomIn}
              className="w-10 h-10 bg-slate-900/80 border border-slate-700 rounded text-slate-300 hover:text-white hover:border-cyan-500 hover:bg-cyan-900/20 transition-all flex items-center justify-center"
            >
               <Plus className="w-5 h-5" />
            </button>
            <button 
              onClick={handleZoomOut}
              className="w-10 h-10 bg-slate-900/80 border border-slate-700 rounded text-slate-300 hover:text-white hover:border-cyan-500 hover:bg-cyan-900/20 transition-all flex items-center justify-center"
            >
               <span className="text-lg font-bold leading-none">-</span>
            </button>
            <button 
              onClick={handleResetView}
              className="w-10 h-10 bg-slate-900/80 border border-slate-700 rounded text-cyan-400 hover:text-white hover:border-cyan-500 hover:bg-cyan-900/20 transition-all flex items-center justify-center mt-2" 
              title="Reset View"
            >
               <Locate className="w-5 h-5" />
            </button>
         </div>

         <div className="absolute top-6 right-6 z-30 pointer-events-none">
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded px-4 py-2 backdrop-blur text-right">
               <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">System Status</div>
               <div className="text-cyan-400 font-mono font-bold text-sm flex items-center justify-end gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> {isEditMode ? 'EDITING MAP' : 'LIVE TRACKING'}
               </div>
            </div>
         </div>
      </div>

      {/* Asset Edit/Add Modal */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <Card className="w-full max-w-xl border-cyan-500/30">
              <CardHeader className="flex flex-row justify-between items-center">
                 <CardTitle>{editingAsset ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</CardTitle>
                 <button onClick={() => setIsAssetModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveAsset} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-cyan-500 uppercase mb-1">Serial Number (S/N)</label>
                      <input required className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none font-mono" value={assetFormData.sn} onChange={e => setAssetFormData({...assetFormData, sn: e.target.value})} placeholder="เช่น SN-X12345" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อเรียกอุปกรณ์</label>
                      <input required className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none" value={assetFormData.name} onChange={e => setAssetFormData({...assetFormData, name: e.target.value})} placeholder="เช่น จอ CCTV 32นิ้ว" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อสถานที่ติดตั้ง</label>
                      <select 
                        required 
                        className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none"
                        value={assetFormData.location} 
                        onChange={e => setAssetFormData({...assetFormData, location: e.target.value})}
                      >
                         <option value="">-- เลือกสถานที่ --</option>
                         {assetFormData.locationType === 'VESSEL' ? (
                            VESSEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)
                         ) : (
                            portOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)
                         )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ประเภทสถานที่</label>
                      <select 
                        className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none" 
                        value={assetFormData.locationType} 
                        onChange={e => setAssetFormData({...assetFormData, locationType: e.target.value as any, location: ''})}
                      >
                        <option value="PORT">ท่าเรือ</option>
                        <option value="VESSEL">ในเรือ</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อผู้ใช้งาน / ผู้รับผิดชอบ</label>
                      <input required className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none" value={assetFormData.username} onChange={e => setAssetFormData({...assetFormData, username: e.target.value})} placeholder="ระบุชื่อเจ้าหน้าที่" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">วันที่ติดตั้ง</label>
                      <input type="date" className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-cyan-500 outline-none" value={assetFormData.installedDate} onChange={e => setAssetFormData({...assetFormData, installedDate: e.target.value})} />
                    </div>
                  </div>

                  <div className="pt-6 flex gap-3">
                     <Button type="button" variant="ghost" onClick={() => setIsAssetModalOpen(false)} className="flex-1 uppercase">ยกเลิก</Button>
                     <Button type="submit" className="flex-[2] uppercase shadow-glow-cyan">บันทึกข้อมูล</Button>
                  </div>
                </form>
              </CardContent>
           </Card>
        </div>
      )}

      {/* Location Edit/Add Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <Card className="w-full max-w-sm border-amber-500/30">
              <CardHeader className="flex flex-row justify-between items-center">
                 <CardTitle className="text-amber-400 before:text-amber-600">{editingLocation ? 'แก้ไขจุดพิกัด' : 'เพิ่มจุดพิกัดใหม่'}</CardTitle>
                 <button onClick={() => setIsLocationModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveLocation} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อสถานที่ (Location Name)</label>
                    <input required className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-amber-500 outline-none font-bold" value={locationFormData.name} onChange={e => setLocationFormData({...locationFormData, name: e.target.value})} placeholder="เช่น ท่าเรือ..." />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ประเภท</label>
                    <select 
                      className="w-full bg-black border border-slate-700 rounded p-2.5 text-sm text-white focus:border-amber-500 outline-none" 
                      value={locationFormData.type} 
                      onChange={e => setLocationFormData({...locationFormData, type: e.target.value as any})}
                    >
                      <option value="PIER">ท่าเรือ (Pier)</option>
                      <option value="OTHER">อื่นๆ (Other)</option>
                    </select>
                  </div>

                  <div className="pt-4 flex gap-3">
                     {editingLocation && (
                        <Button type="button" variant="danger" onClick={() => handleDeleteLocation(editingLocation.id)} className="px-3">
                           <Trash2 className="w-4 h-4" />
                        </Button>
                     )}
                     <Button type="button" variant="ghost" onClick={() => setIsLocationModalOpen(false)} className="flex-1 uppercase">ยกเลิก</Button>
                     <Button type="submit" className="flex-[2] uppercase border-amber-500/50 text-amber-400 hover:bg-amber-500 hover:text-black">บันทึก</Button>
                  </div>
                </form>
              </CardContent>
           </Card>
        </div>
      )}
    </div>
  );
};

const AssetListItem: React.FC<{
  asset: TrackedAsset;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: (id: string) => void;
  onEdit: (asset: TrackedAsset) => void;
  onDelete: (id: string) => void;
}> = ({ asset, isSelected, isEditMode, onSelect, onEdit, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const timerRef = useRef<any>(null);

  const handlePressStart = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    timerRef.current = setTimeout(() => {
      onDelete(asset.id);
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
    <div 
      onClick={() => onSelect(asset.id)}
      className={`p-4 rounded-lg border transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'bg-cyan-950/30 border-cyan-500/50' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900 hover:border-slate-700'}`}
    >
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 animate-pulse"></div>}
      
      <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded flex items-center justify-center border ${asset.locationType === 'VESSEL' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                {asset.locationType === 'VESSEL' ? <Ship className="w-4 h-4" /> : <Anchor className="w-4 h-4" />}
            </div>
            <div>
                <div className={`text-sm font-bold font-display uppercase ${isSelected ? 'text-white' : 'text-slate-300'}`}>{asset.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">{asset.sn}</div>
            </div>
          </div>
          {isEditMode ? (
            <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); onEdit(asset); }} className="p-1.5 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 rounded"><Edit className="w-3 h-3" /></button>
                <button 
                  onMouseDown={handlePressStart}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchStart={handlePressStart}
                  onTouchEnd={handlePressEnd}
                  className={`p-1.5 rounded relative overflow-hidden transition-all ${isDeleting ? 'bg-red-950 text-red-500' : 'hover:bg-red-500/20 text-slate-500 hover:text-red-400'}`}
                >
                  {isDeleting && (
                    <div className="absolute inset-0 flex flex-col justify-end">
                      <div className="w-full bg-red-500/40 animate-delete-progress" />
                    </div>
                  )}
                  <Trash2 className={`w-3 h-3 relative z-10 ${isDeleting ? 'animate-pulse' : ''}`} />
                </button>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-[9px] font-bold text-green-400 bg-green-950/30 px-1.5 py-0.5 rounded border border-green-500/20">
                  <Wifi className="w-3 h-3" /> ONLINE
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                  <Battery className="w-3 h-3" /> 85%
                </div>
            </div>
          )}
      </div>
      
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/50 text-[10px] text-slate-400">
          <Monitor className="w-3 h-3 text-cyan-600" />
          <span className="truncate">{asset.location}</span>
          <span className="ml-auto flex items-center gap-1 text-slate-500"><User className="w-3 h-3" /> {asset.username}</span>
      </div>
    </div>
  );
};
