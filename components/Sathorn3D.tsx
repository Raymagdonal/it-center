
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Button } from './ui/Button';
import { X, Info, Ship, Anchor, Box, Monitor, DoorOpen } from 'lucide-react';
import { TrackedAsset } from '../types';

interface Sathorn3DProps {
  targetedSn: string | null;
  onClearTarget: () => void;
  assets?: TrackedAsset[];
}

export const Sathorn3D: React.FC<Sathorn3DProps> = ({ targetedSn, onClearTarget, assets = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [selectedAssetData, setSelectedAssetData] = useState<TrackedAsset | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); 
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

    // Camera adjustment for Booth View
    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 15, 20); // Higher angle to see inside layout
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Spotlight for the booth interior
    const spotLight = new THREE.SpotLight(0xffaa00, 0.5);
    spotLight.position.set(0, 10, 0);
    spotLight.angle = Math.PI / 4;
    scene.add(spotLight);

    // --- Materials ---
    const wallRedMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.2 }); // Deep Red
    const floorGrayMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.8 }); // Concrete Gray
    const counterTopMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2 }); // White/Gray Top
    const counterBodyMat = new THREE.MeshStandardMaterial({ color: 0x334155 }); // Dark Slate Base
    const glassMat = new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.3, 
      roughness: 0, 
      metalness: 0.1 
    });
    const monitorBlackMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.2 });
    const doorPurpleMat = new THREE.MeshStandardMaterial({ color: 0x7e22ce }); // Purple
    const signMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0xf8fafc, emissiveIntensity: 0.2 });

    // --- Booth Group ---
    const boothGroup = new THREE.Group();
    scene.add(boothGroup);

    // 1. Floor
    const floorGeo = new THREE.BoxGeometry(16, 0.5, 12);
    const floor = new THREE.Mesh(floorGeo, floorGrayMat);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    boothGroup.add(floor);

    // 2. Walls (Red)
    const wallHeight = 5;
    const wallThickness = 0.5;

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(16, wallHeight, wallThickness), wallRedMat);
    backWall.position.set(0, wallHeight/2, -6 + wallThickness/2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    boothGroup.add(backWall);

    // Side Wall Left
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 12), wallRedMat);
    leftWall.position.set(-8 + wallThickness/2, wallHeight/2, 0);
    leftWall.castShadow = true;
    boothGroup.add(leftWall);

    // Side Wall Right
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 12), wallRedMat);
    rightWall.position.set(8 - wallThickness/2, wallHeight/2, 0);
    rightWall.castShadow = true;
    boothGroup.add(rightWall);

    // Front Wall (Partial - Top Header)
    const frontHeader = new THREE.Mesh(new THREE.BoxGeometry(16, 1.5, wallThickness), wallRedMat);
    frontHeader.position.set(0, wallHeight - 0.75, 6 - wallThickness/2);
    frontHeader.castShadow = true;
    boothGroup.add(frontHeader);

    // Front Wall (Bottom/Side Pillars)
    const frontPillarL = new THREE.Mesh(new THREE.BoxGeometry(4, wallHeight, wallThickness), wallRedMat);
    frontPillarL.position.set(-6, wallHeight/2, 6 - wallThickness/2);
    boothGroup.add(frontPillarL);

    const frontPillarR = new THREE.Mesh(new THREE.BoxGeometry(4, wallHeight, wallThickness), wallRedMat);
    frontPillarR.position.set(6, wallHeight/2, 6 - wallThickness/2);
    boothGroup.add(frontPillarR);

    // 3. Service Counters
    const createCounter = (xPos: number, zPos: number) => {
        const counterGroup = new THREE.Group();
        counterGroup.position.set(xPos, 0, zPos);

        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 1.5), counterBodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        counterGroup.add(body);

        // Top
        const top = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.1, 1.7), counterTopMat);
        top.position.y = 1.25;
        counterGroup.add(top);

        // Monitor
        const monitorBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.4), monitorBlackMat);
        monitorBase.position.set(0, 1.3, 0.3);
        counterGroup.add(monitorBase);

        const monitorStand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), monitorBlackMat);
        monitorStand.position.set(0, 1.45, 0.3);
        counterGroup.add(monitorStand);

        const monitorScreen = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.1), monitorBlackMat);
        monitorScreen.position.set(0, 1.8, 0.3);
        monitorScreen.rotation.x = -Math.PI / 12;
        counterGroup.add(monitorScreen);

        return counterGroup;
    };

    // Tourist Service Area (Left)
    const counterL = createCounter(-3, 2);
    boothGroup.add(counterL);

    // Express Service Area (Right)
    const counterR = createCounter(3, 2);
    boothGroup.add(counterR);

    // 4. Central Divider & Sign
    const divider = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 4), wallRedMat);
    divider.position.set(0, 2.5, 4);
    boothGroup.add(divider);

    const centralSign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 0.2), signMat);
    centralSign.position.set(0, 2.5, 6.1); // Stick out front
    boothGroup.add(centralSign);

    // 5. Staff Entrance (Purple Door)
    // Placed on the back right side based on image logic
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.7, 0.3), doorPurpleMat);
    doorFrame.position.set(5.5, 1.85, -6 + 0.4); // slightly inside back wall
    boothGroup.add(doorFrame);
    
    const doorHandle = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshStandardMaterial({color: 0xffd700}));
    doorHandle.position.set(5.5 - 0.7, 1.8, -6 + 0.6);
    boothGroup.add(doorHandle);

    // 6. Boat (Optional - Context)
    const boatGroup = new THREE.Group();
    boatGroup.position.set(0, 0, 15);
    // Simple boat shape for context
    const boatHull = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 14), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    boatHull.position.y = -0.5;
    boatGroup.add(boatHull);
    const boatCabin = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    boatCabin.position.y = 1;
    boatGroup.add(boatCabin);
    scene.add(boatGroup);

    // --- Assets Placement ---
    const assetMeshes: THREE.Mesh[] = [];
    
    assets.forEach((asset, i) => {
      const assetGroup = new THREE.Group();
      
      // Smart Placement Logic
      const loc = asset.location.toLowerCase();
      const name = asset.name.toLowerCase();
      
      let x = 0, z = 0, y = 1.35; // Default on counter height
      
      if (loc.includes('tourist') || loc.includes('left')) {
          // Left Counter Area
          x = -3 + (Math.random() * 1.5 - 0.75);
          z = 2 + (Math.random() * 0.5 - 0.25);
      } else if (loc.includes('express') || loc.includes('right')) {
          // Right Counter Area
          x = 3 + (Math.random() * 1.5 - 0.75);
          z = 2 + (Math.random() * 0.5 - 0.25);
      } else if (loc.includes('back') || loc.includes('office')) {
          // Back Office Area
          x = (Math.random() * 6 - 3);
          z = -2 + (Math.random() * 2 - 1);
          y = 0.5; // On floor or lower shelf
      } else if (loc.includes('staff') || loc.includes('door')) {
          // Near Door
          x = 5.5;
          z = -4;
          y = 1;
      } else if (asset.locationType === 'VESSEL') {
          // On the boat
          x = (Math.random() * 4 - 2);
          z = 15 + (Math.random() * 6 - 3);
          y = 1;
      } else {
          // Generic floor placement in booth
          x = (Math.random() * 8 - 4);
          z = (Math.random() * 6 - 2);
          y = 0.5;
      }

      assetGroup.position.set(x, y, z);
      
      // Determine rotation (face forward mostly)
      if (asset.locationType !== 'VESSEL') {
        assetGroup.rotation.y = Math.PI; // Face entrance
      }

      // Add to scene (Booth or World)
      if (asset.locationType === 'VESSEL') {
         // scene.add(assetGroup); // already calc absolute pos
      } else {
         // scene.add(assetGroup);
      }
      scene.add(assetGroup); // Add all to scene root for simplicity with calculated coords

      // Asset Visual
      const isCCTV = name.includes('camera') || name.includes('cctv');
      const isPOS = name.includes('pos') || name.includes('ticket');
      
      let mesh;
      if (isCCTV) {
         mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.5), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      } else {
         mesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x22d3ee }));
      }
      
      mesh.userData = { sn: asset.sn };
      assetGroup.add(mesh);
      assetMeshes.push(mesh);

      // Status Indicator
      const statusInd = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      statusInd.position.y = 0.4;
      assetGroup.add(statusInd);

      // Target Highlight
      if (asset.sn === targetedSn) {
          const arrow = new THREE.Mesh(
              new THREE.ConeGeometry(0.3, 0.8, 8),
              new THREE.MeshBasicMaterial({ color: 0xeab308 })
          );
          arrow.position.y = 1.5;
          arrow.rotation.z = Math.PI;
          assetGroup.add(arrow);

          // Pulse effect ring
          const ring = new THREE.Mesh(
             new THREE.RingGeometry(0.5, 0.6, 16),
             new THREE.MeshBasicMaterial({ color: 0xeab308, side: THREE.DoubleSide })
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.y = -0.2;
          assetGroup.add(ring);

          if (!selectedObject) {
              setSelectedObject(asset.sn);
              setSelectedAssetData(asset);
          }
      }
    });

    // --- Interaction ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraAngle = Math.PI / 6; // Start slightly angled
    let cameraHeight = 15;
    let cameraRadius = 22;

    const updateCamera = () => {
        camera.position.x = Math.sin(cameraAngle) * cameraRadius;
        camera.position.z = Math.cos(cameraAngle) * cameraRadius;
        camera.position.y = cameraHeight;
        camera.lookAt(0, 2, 0);
    };
    updateCamera();

    const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };

            cameraAngle -= deltaMove.x * 0.01;
            cameraHeight += deltaMove.y * 0.1;
            cameraHeight = Math.max(5, Math.min(30, cameraHeight)); // Limit height
            updateCamera();

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    };

    const onMouseUp = () => {
        isDragging = false;
    };

    const onClick = (event: MouseEvent) => {
        if (isDragging) return;
        
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(assetMeshes);

        if (intersects.length > 0) {
            const obj = intersects[0].object;
            const sn = obj.userData.sn;
            setSelectedObject(sn);
            const asset = assets.find(a => a.sn === sn);
            if (asset) setSelectedAssetData(asset);
        } else {
            setSelectedObject(null);
            setSelectedAssetData(null);
        }
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);

    // --- Animation ---
    const animate = () => {
        requestAnimationFrame(animate);
        
        // Gentle Boat Rocking
        boatGroup.position.y = Math.sin(Date.now() * 0.001) * 0.2;
        boatGroup.rotation.z = Math.sin(Date.now() * 0.0005) * 0.02;

        if (!isDragging && !selectedObject) {
             cameraAngle += 0.0005; // Slow rotation
             updateCamera();
        }

        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        if (!containerRef.current) return;
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('click', onClick);
        if (containerRef.current && renderer.domElement) {
            containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
    };
  }, [assets, targetedSn]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-slate-900 overflow-hidden rounded-lg border border-slate-800">
      <div ref={containerRef} className="w-full h-full cursor-move" />
      
      {/* HUD Header */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-3xl font-bold text-white font-display uppercase tracking-widest text-shadow-lg flex items-center gap-3">
            <Box className="w-8 h-8 text-red-500" />
            Sathorn Pier Booth
        </h2>
        <div className="flex items-center gap-2 mt-1">
           <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
           <p className="text-cyan-400 font-mono text-xs tracking-wider">LIVE DIGITAL TWIN v2.0</p>
        </div>
      </div>

      {/* Location Labels Overlay (Mocked positions) */}
      <div className="absolute top-20 left-10 pointer-events-none opacity-60 hidden md:block">
         <div className="flex items-center gap-2 text-white text-xs font-bold uppercase mb-2">
            <Monitor className="w-4 h-4 text-cyan-400" /> Tourist Service Area
         </div>
         <div className="flex items-center gap-2 text-white text-xs font-bold uppercase mb-2">
            <Monitor className="w-4 h-4 text-cyan-400" /> Express Service Area
         </div>
      </div>
      
      <div className="absolute top-20 right-10 pointer-events-none opacity-60 text-right hidden md:block">
         <div className="flex items-center justify-end gap-2 text-white text-xs font-bold uppercase mb-2">
            Staff Entrance <DoorOpen className="w-4 h-4 text-purple-400" />
         </div>
      </div>

      {/* Targeted Asset HUD */}
      {targetedSn && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 animate-bounce">
           <div className="bg-black/80 text-white px-6 py-3 rounded-full border border-yellow-500 flex items-center gap-4 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
             <span className="font-mono font-bold text-yellow-400">LOCATING: {targetedSn}</span>
             <Button size="sm" variant="danger" onClick={onClearTarget} className="rounded-full h-8 w-8 p-0 flex items-center justify-center"><X className="w-4 h-4" /></Button>
           </div>
        </div>
      )}

      {/* Asset Detail Popup */}
      {selectedAssetData && (
        <div className="absolute top-20 right-6 z-20 animate-in slide-in-from-right duration-300 w-72">
           <div className="bg-slate-900/95 border-l-4 border-l-cyan-500 border-y border-r border-slate-700 p-5 rounded-r-lg shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-3">
                 <span className="text-cyan-400 font-bold uppercase text-sm flex items-center gap-2">
                    <Info className="w-4 h-4" /> Asset Details
                 </span>
                 <button onClick={() => { setSelectedObject(null); setSelectedAssetData(null); }} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                 <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Device Name</span>
                    <span className="text-white font-bold text-sm block">{selectedAssetData.name}</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Serial No.</span>
                        <span className="text-cyan-300 font-mono text-xs block">{selectedAssetData.sn}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Type</span>
                        <span className="text-slate-300 text-xs block">{selectedAssetData.locationType}</span>
                    </div>
                 </div>
                 <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Installed Location</span>
                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-slate-800">
                        <Box className="w-3 h-3 text-cyan-500" />
                        <span className="text-white text-xs truncate">{selectedAssetData.location}</span>
                    </div>
                 </div>
                 <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active / Online
                    </span>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
