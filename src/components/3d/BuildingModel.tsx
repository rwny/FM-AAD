import { useGLTF, Html } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { Room, ACAsset } from '../../types/bim'

interface BuildingModelProps {
  url: string;
  activeMode: string;
  selectedRoomId?: string | null;
  clipFloor?: number | null;
  onRoomsFound?: (rooms: Room[]) => void;
  onACFound?: (assets: ACAsset[]) => void;
  onRoomClick?: (roomId: string | null) => void;
  buildingData: any;
  finalACAssets: ACAsset[];
}

interface RoomLabelData extends Room {
  position: THREE.Vector3;
  isVisible: boolean;
}

interface ACLabelData {
  id: string;
  position: THREE.Vector3;
  status?: string;
  isVisible?: boolean;
  isSelfIssue?: boolean;
}

export function BuildingModel({ url, activeMode, selectedRoomId, clipFloor, onRoomsFound, onACFound, onRoomClick, buildingData, finalACAssets }: BuildingModelProps) {
  const { scene } = useGLTF(url)
  const clonedScene = useMemo(() => scene.clone(), [scene])
  const [roomLabels, setRoomLabels] = useState<RoomLabelData[]>([])
  const [selectedLabel, setSelectedLabel] = useState<ACLabelData | null>(null)
  const [issueIcons, setIssueIcons] = useState<ACLabelData[]>([])

  const allFurniture = useMemo(() => {
    const assets: any[] = [];
    if (!buildingData || !buildingData.floors) return assets;
    
    const floorsArray = Array.isArray(buildingData.floors) 
      ? buildingData.floors 
      : Object.entries(buildingData.floors).map(([num, data]: [string, any]) => ({ floor: parseInt(num), ...data }));

    floorsArray.forEach((f: any) => {
      const floorNum = f.floor || (parseInt(f.name?.replace('FLOOR ', '')) || 1);
      if (f.rooms && Array.isArray(f.rooms)) {
        f.rooms.forEach((r: any) => {
          if (r.assets && Array.isArray(r.assets)) {
            r.assets.forEach((a: any) => {
              assets.push({ ...a, room: r.id, floor: floorNum });
            });
          }
        });
      }
    });
    return assets;
  }, [buildingData]);

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'normal') return '#10b981' // 🟢 Emerald 500
    if (s === 'faulty') return '#f43f5e' // 🔴 Rose 500
    if (s === 'maintenance') return '#f59e0b' // 🟡 Amber 500
    return '#0ea5e9' // Default Blue
  }

  // Initial Scene Setup
  useEffect(() => {
    if (clonedScene) {
      clonedScene.position.set(0, 0, 0)
      clonedScene.updateMatrixWorld(true)
      const box = new THREE.Box3().setFromObject(clonedScene)
      const center = new THREE.Vector3()
      box.getCenter(center)
      clonedScene.position.x = -center.x
      clonedScene.position.z = -center.z
      clonedScene.updateMatrixWorld(true)

      const foundRooms: Room[] = []
      const foundACRaw: { mesh: THREE.Mesh, nameLower: string, suffix: string, type: string }[] = []
      const labels: RoomLabelData[] = []

      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
          const nameLower = child.name.toLowerCase()

          if (nameLower.startsWith('fcu-') || nameLower.startsWith('cdu-')) {
            const suffix = nameLower.split('-')[1] || ''
            const type = nameLower.startsWith('fcu-') ? 'FCU' : 'CDU'
            
            // Initial status check
            let status = 'Normal';
            if (buildingData && buildingData.floors) {
               const floorsArray = Array.isArray(buildingData.floors) 
                 ? buildingData.floors 
                 : Object.values(buildingData.floors);

               floorsArray.forEach((f: any) => {
                 if (f.rooms && Array.isArray(f.rooms)) {
                   f.rooms.forEach((r: any) => {
                     if (r.assets && Array.isArray(r.assets)) {
                       r.assets.forEach((a: any) => {
                         if (a.id && a.id.toLowerCase() === nameLower) {
                           status = a.status || a.currentStatus || 'Normal';
                         }
                       });
                     }
                   });
                 }
               });
            }
            child.userData.status = status;
            foundACRaw.push({ mesh: child, nameLower, suffix, type })
          }

          if (nameLower.startsWith('rm-')) {
            const roomNumberStr = child.name.replace('rm-', '')
            const roomNumber = parseInt(roomNumberStr)
            if (roomNumber >= 1000) {
              child.visible = false
              child.raycast = () => null
            } else if (!isNaN(roomNumber)) {
              const roomBox = new THREE.Box3().setFromObject(child)
              const roomCenter = new THREE.Vector3()
              roomBox.getCenter(roomCenter)
              const roomData = { id: nameLower, number: roomNumberStr, floor: parseInt(roomNumberStr.charAt(0)), name: `Room ${roomNumberStr}` }
              foundRooms.push(roomData)
              labels.push({ ...roomData, position: roomCenter, isVisible: true })
            }
          }
        }
      })

      const foundACFinal: ACAsset[] = foundACRaw.map(item => ({
        id: item.nameLower,
        name: `${item.type} ${item.suffix || ''}`,
        type: item.type as 'FCU' | 'CDU',
        brand: 'System Default',
        model: 'BIM-Model-V1',
        capacity: 'Auto-detected',
        status: item.mesh.userData.status as any,
        lastService: '2026-03-10',
        nextService: 'Pending'
      }));

      setRoomLabels(labels)
      if (onRoomsFound) onRoomsFound(foundRooms.sort((a, b) => a.number.localeCompare(b.number)))
      if (onACFound) onACFound(foundACFinal)
    }
  }, [clonedScene, onRoomsFound, onACFound, buildingData])

  // Update Materials and Visibility
  useEffect(() => {
    let activeLabel: ACLabelData | null = null
    const cleanSelectedId = selectedRoomId?.toLowerCase().replace(/\./g, '');
    
    // Resolve Peer ID if AC is selected
    let peerId: string | null = null;
    if (cleanSelectedId && (cleanSelectedId.startsWith('fcu-') || cleanSelectedId.startsWith('cdu-'))) {
      const parts = cleanSelectedId.split('-');
      const prefix = parts[0] === 'fcu' ? 'cdu' : 'fcu';
      peerId = `${prefix}-${parts.slice(1).join('-')}`;
    }

    const issues: ACLabelData[] = []

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const nameLower = child.name.toLowerCase()
        const cleanName = nameLower.replace(/\./g, '');
        
        // Match either primary or peer
        const isSelected = !!(cleanSelectedId && cleanName === cleanSelectedId);
        const isPeerSelected = !!(peerId && cleanName === peerId);
        const isPartofSelection = isSelected || isPeerSelected;
        
        const isAC = nameLower.startsWith('fcu-') || nameLower.startsWith('cdu-')
        const isRoom = nameLower.startsWith('rm-')
        const isFur = nameLower.startsWith('lf-') || nameLower.startsWith('bf-')
        const isStruc = nameLower.startsWith('xr-struc') || nameLower.startsWith('st-')
        const isArch = nameLower.startsWith('xr-') && !isStruc

        // Remove old selection outlines if any
        if (child.userData.isOutline) {
          child.visible = false;
          return;
        }

        // Handle Selection Visual (Outline Mesh)
        const existingOutline = child.children.find(c => c.userData.isOutline);
        if (existingOutline) {
          existingOutline.visible = isPartofSelection;
        } else if (isPartofSelection && (isAC || isFur)) {
          // Create Selection Frame (Blender-like)
          const outlineGeo = child.geometry.clone();
          const outlineMat = new THREE.MeshBasicMaterial({ 
            color: '#ffffff', 
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.5
          });
          const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
          outlineMesh.scale.multiplyScalar(1.05); // Slightly larger
          outlineMesh.userData.isOutline = true;
          child.add(outlineMesh);
        }

        // Floor Visibility Logic
        const meshBox = new THREE.Box3().setFromObject(child);
        const meshCenter = new THREE.Vector3();
        meshBox.getCenter(meshCenter);
        const yFloor = meshCenter.y > 2.8 ? 2 : 1;

        let meshFloor = yFloor; // Use Y-coordinate as baseline
        
        if (isRoom) {
          meshFloor = parseInt(nameLower.replace('rm-', '').charAt(0));
        } else if (nameLower.startsWith('st-')) {
          const numPart = nameLower.replace('st-', '').split(/[^0-9]/)[0];
          const num = parseInt(numPart);
          if (!isNaN(num)) {
            meshFloor = Math.floor(num / 1000);
            if (meshFloor === 0) meshFloor = 1; 
          }
        } else if (isFur) {
          const asset = allFurniture.find(a => a.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanName);
          if (asset) meshFloor = asset.floor;
        } else if (isAC) {
          // Robust AC floor detection: Check hyphen or dot
          const parts = nameLower.split(/[-.]/);
          if (parts.length > 1) {
            const possibleRoom = parts[1];
            const floorChar = possibleRoom.charAt(0);
            if (floorChar === '1' || floorChar === '2') {
              meshFloor = parseInt(floorChar);
            }
          }
        }

        const isVisible = (clipFloor !== null && clipFloor !== undefined) ? (meshFloor <= clipFloor) : true;
        child.visible = isVisible;

        const materialConfig = {
          side: THREE.DoubleSide,
        }

        if (isAC) {
          // Dynamic status color from finalACAssets
          const liveAsset = (finalACAssets || []).find(a => a.id.toLowerCase() === cleanName);
          const status = liveAsset?.status || child.userData.status || 'Normal';
          const systemStatus = (liveAsset as any)?.systemStatus || status;
          const statusColor = getStatusColor(status);
          
          if (systemStatus === 'Faulty' || systemStatus === 'Maintenance') {
            const acBox = new THREE.Box3().setFromObject(child)
            const acCenter = new THREE.Vector3()
            acBox.getCenter(acCenter)
            
            const isSelf = status !== 'Normal';
            const iconPos = acCenter.clone();
            
            // If it's the actual faulty unit, float the triangle above
            if (isSelf) {
              iconPos.y += 0.5;
            }
            // Otherwise (peer unit), keep the small dot at the object center/origin
            
            issues.push({ 
              id: cleanName, 
              position: iconPos, 
              status: systemStatus,
              isVisible: isVisible,
              isSelfIssue: isSelf
            })
          }

          if (isSelected) {
            const acBox = new THREE.Box3().setFromObject(child)
            const acCenter = new THREE.Vector3()
            acBox.getCenter(acCenter)
            activeLabel = { id: child.name.toUpperCase(), position: acCenter }
          }
          child.material = new THREE.MeshStandardMaterial({
            ...materialConfig,
            roughness: 0.5, metalness: 0.2, transparent: activeMode !== 'AC',
            opacity: activeMode === 'AC' ? 1.0 : 0.1,
            color: statusColor,
            emissive: isPartofSelection ? statusColor : '#000000',
            emissiveIntensity: isPartofSelection ? 1.2 : (activeMode === 'AC' ? 0.2 : 0),
          })
          child.raycast = (activeMode === 'AC' && child.visible) ? THREE.Mesh.prototype.raycast : () => null
        }
        
        else if (isFur) {
          const assetData = allFurniture.find(a => a.id.toLowerCase().replace(/\./g, '') === cleanName)
          const statusColor = getStatusColor(assetData?.status || assetData?.currentStatus || 'Normal')
          
          if (isSelected) {
            const furBox = new THREE.Box3().setFromObject(child)
            const furCenter = new THREE.Vector3()
            furBox.getCenter(furCenter)
            activeLabel = { id: (assetData?.id || child.name).toUpperCase(), position: furCenter }
          }

          child.material = new THREE.MeshStandardMaterial({
            ...materialConfig,
            roughness: 0.7, metalness: 0.1, transparent: activeMode !== 'Fur',
            opacity: activeMode === 'Fur' ? 1.0 : 0.05,
            color: isSelected ? '#f97316' : statusColor,
            emissive: isSelected ? '#f97316' : '#000000',
            emissiveIntensity: isSelected ? 0.5 : 0,
          })
          child.raycast = (activeMode === 'Fur' && child.visible) ? THREE.Mesh.prototype.raycast : () => null
          
          if (activeMode !== 'Fur' && !isSelected) {
             child.visible = child.visible && activeMode === 'AR';
          }
        }

        else if (isRoom) {
          child.material = new THREE.MeshStandardMaterial({
            ...materialConfig,
            transparent: true, roughness: 0.9, metalness: 0, depthWrite: false,
            color: isSelected ? '#f97316' : '#e2e8f0',
            opacity: activeMode === 'AR' ? (isSelected ? 0.9 : 0.7) : (isSelected ? 0.9 : 0.1),
            emissive: isSelected ? '#f97316' : '#000000',
            emissiveIntensity: isSelected ? 0.2 : 0,
          })
          child.raycast = (activeMode === 'AR' && child.visible) ? THREE.Mesh.prototype.raycast : () => null
        }

        else if (isStruc) {
          child.material = new THREE.MeshStandardMaterial({ 
            ...materialConfig,
            color: '#71797E',
            roughness: 0.8, 
            metalness: 0.2,
            transparent: false,
            opacity: 1.0
          })
          child.raycast = child.visible ? THREE.Mesh.prototype.raycast : () => null
        }

        else if (isArch) {
          child.material = new THREE.MeshStandardMaterial({ 
            ...materialConfig,
            color: '#475569', 
            roughness: 0.9, 
            metalness: 0,
            transparent: true,
            opacity: (activeMode === 'Fur' || activeMode === 'AC') ? 0.3 : 1.0
          })
          child.raycast = child.visible ? THREE.Mesh.prototype.raycast : () => null
        }
      }
    })
    setSelectedLabel(activeLabel)
    setIssueIcons(activeMode === 'AC' ? issues : [])
  }, [clonedScene, selectedRoomId, activeMode, clipFloor, allFurniture, finalACAssets])

  return (
    <group onPointerDown={(e) => { 
      e.stopPropagation(); 
      const clickedName = e.object.name.toLowerCase();
      onRoomClick?.(clickedName); 
    }}>
      <primitive object={clonedScene} />
      {activeMode === 'AR' && roomLabels.filter(r => !clipFloor || r.floor === clipFloor || (clipFloor === 2 && r.floor <= 2)).map((room) => (
        <Html key={room.id} position={room.position} className="pointer-events-none transition-all duration-300">
          <div className={`px-2 py-1 rounded-[4px] text-[10px] font-black shadow-xl whitespace-nowrap transition-all -translate-x-1/2 ${room.id === selectedRoomId ? 'text-slate-900 bg-white scale-110 z-50 ring-2 ring-indigo-50' : 'text-slate-800 bg-white/95 border border-slate-200'}`}>
            {room.number}
          </div>
        </Html>
      ))}
      {(activeMode === 'AC' || activeMode === 'Fur') && selectedLabel && (
        <Html position={selectedLabel.position} className="pointer-events-none">
          <div className="px-2 py-1 bg-white text-slate-900 text-[10px] font-black rounded-[4px] shadow-xl whitespace-nowrap transition-all -translate-x-1/2 scale-110 z-50 ring-2 ring-indigo-500">
            {selectedLabel.id}
          </div>
        </Html>
      )}

      {activeMode === 'AC' && issueIcons.filter(issue => issue.isVisible).map((issue) => (
        <Html key={issue.id} position={issue.position} className="pointer-events-none">
          <div className="flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-full mb-2">
            <div className={`relative flex items-center justify-center`}>
              {issue.isSelfIssue ? (
                /* 🔻 Triangle with White Border for self-issue */
                <div className="relative flex flex-col items-center animate-bounce">
                   {/* Outer Pulse */}
                   <div className={`absolute -top-1 w-8 h-8 rounded-full animate-ping opacity-40 ${issue.status === 'Faulty' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                   
                   {/* Downward Triangle SVG */}
                   <svg width="22" height="20" viewBox="0 0 22 20" className="drop-shadow-xl overflow-visible">
                     <path 
                       d="M2 2 L20 2 L11 17 Z" 
                       fill={issue.status === 'Faulty' ? '#e11d48' : '#d97706'} 
                       stroke="white" 
                       strokeWidth="2.5"
                       strokeLinejoin="round"
                     />
                   </svg>
                </div>
              ) : (
                /* 🟠 Small static dot for peer-issue */
                <div className={`relative w-2 h-2 rounded-full border border-white shadow-lg opacity-80 ${
                  issue.status === 'Faulty' ? 'bg-rose-400' : 'bg-amber-400'
                }`} />
              )}
            </div>
          </div>
        </Html>
      ))}
    </group>
  )
}

useGLTF.preload('/models/ar15-302.glb')
