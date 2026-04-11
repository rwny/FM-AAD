import { useGLTF, Html } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useState, useRef } from 'react'
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
  floorY: number;
  isVisible: boolean;
}

// ─── Mesh reference data (NO pre-computed positions) ───────────────────────────
interface IssueMeshData {
  id: string;
  mesh: THREE.Mesh;
  status: string;
  isVisible: boolean;
  isSelfIssue: boolean;
}

// ─── IssueMarker ───────────────────────────────────────────────────────────────
// Reads mesh world-position every frame via getWorldPosition → no timing issues
function IssueMarker({ data }: { data: IssueMeshData }) {
  const groupRef = useRef<THREE.Group>(null)
  const _wp = useRef(new THREE.Vector3())

  // Set initial position right after mount (before first frame) to avoid flash
  useEffect(() => {
    if (!groupRef.current) return
    data.mesh.getWorldPosition(_wp.current)
    groupRef.current.position.set(
      _wp.current.x,
      _wp.current.y + (data.isSelfIssue ? 0.5 : 0),
      _wp.current.z
    )
    groupRef.current.updateMatrixWorld()
  }, [data.mesh, data.isSelfIssue])

  useFrame(() => {
    if (!groupRef.current) return
    data.mesh.getWorldPosition(_wp.current)
    groupRef.current.position.set(
      _wp.current.x,
      _wp.current.y + (data.isSelfIssue ? 0.5 : 0),
      _wp.current.z
    )
    groupRef.current.updateMatrixWorld()
  })

  if (!data.isVisible) return null

  return (
    <group ref={groupRef}>
      <Html className="pointer-events-none">
        <div style={{ transform: 'translate(-50%, -100%)', marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {data.isSelfIssue ? (
            <div className="relative flex flex-col items-center animate-bounce">
              <div className={`absolute -top-1 w-8 h-8 rounded-full animate-ping opacity-40 ${data.status === 'Faulty' ? 'bg-rose-500' : 'bg-amber-500'}`} />
              <svg width="22" height="20" viewBox="0 0 22 20" className="drop-shadow-xl overflow-visible">
                <path
                  d="M2 2 L20 2 L11 17 Z"
                  fill={data.status === 'Faulty' ? '#e11d48' : '#d97706'}
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : (
            <div className={`w-2 h-2 rounded-full border border-white shadow-lg opacity-80 ${
              data.status === 'Faulty' ? 'bg-rose-400' : 'bg-amber-400'
            }`} />
          )}
        </div>
      </Html>
    </group>
  )
}

// ─── SelectedMarker ────────────────────────────────────────────────────────────
// Tracks selected mesh position every frame
function SelectedMarker({ mesh, id }: { mesh: THREE.Mesh; id: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const _wp = useRef(new THREE.Vector3())

  useEffect(() => {
    if (!groupRef.current) return
    mesh.getWorldPosition(_wp.current)
    groupRef.current.position.copy(_wp.current)
    groupRef.current.updateMatrixWorld()
  }, [mesh])

  useFrame(() => {
    if (!groupRef.current) return
    mesh.getWorldPosition(_wp.current)
    groupRef.current.position.copy(_wp.current)
    groupRef.current.updateMatrixWorld()
  })

  return (
    <group ref={groupRef}>
      <Html className="pointer-events-none">
        <div className="px-2 py-1 bg-white text-slate-900 text-[10px] font-black rounded-[4px] shadow-xl whitespace-nowrap -translate-x-1/2 scale-110 z-50 ring-2 ring-indigo-500">
          {id}
        </div>
      </Html>
    </group>
  )
}

// ─── BuildingModel ─────────────────────────────────────────────────────────────
export function BuildingModel({ url, activeMode, selectedRoomId, clipFloor, onRoomsFound, onACFound, onRoomClick, buildingData, finalACAssets }: BuildingModelProps) {
  const { scene } = useGLTF(url)
  const clonedScene = useMemo(() => scene.clone(), [scene])
  const [roomLabels, setRoomLabels] = useState<RoomLabelData[]>([])

  // Mesh references — no pre-computed positions
  const [issueMeshes, setIssueMeshes] = useState<IssueMeshData[]>([])
  const [selectedMesh, setSelectedMesh] = useState<{ mesh: THREE.Mesh; id: string } | null>(null)

  const { camera } = useThree()
  const cameraYRef = useRef(camera.position.y)
  useFrame(() => { cameraYRef.current = camera.position.y })
  const [clickedPipe, setClickedPipe] = useState<{ name: string; position: THREE.Vector3 } | null>(null)

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
    if (s === 'normal') return '#10b981'
    if (s === 'faulty') return '#f43f5e'
    if (s === 'maintenance') return '#f59e0b'
    return '#0ea5e9'
  }

  // ── Initial Scene Setup ──────────────────────────────────────────────────────
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
              labels.push({ ...roomData, position: roomCenter, floorY: roomBox.min.y, isVisible: true })
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

  // ── Issue Mesh Collection (separate from material updates, no selectedRoomId dep) ──
  useEffect(() => {
    if (activeMode !== 'AC') { setIssueMeshes([]); return; }

    const issues: IssueMeshData[] = [];
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const nameLower = child.name.toLowerCase();
      const cleanName = nameLower.replace(/\./g, '');
      if (!nameLower.startsWith('fcu-') && !nameLower.startsWith('cdu-')) return;

      const liveAsset = (finalACAssets || []).find(a => a.id.toLowerCase() === cleanName);
      const status = liveAsset?.status || child.userData.status || 'Normal';
      const systemStatus = (liveAsset as any)?.systemStatus || status;
      if (systemStatus !== 'Faulty' && systemStatus !== 'Maintenance') return;

      // Floor visibility check
      const parts = nameLower.split(/[-.]/);
      let meshFloor = 1;
      if (parts.length > 1) {
        const floorChar = parts[1].charAt(0);
        if (floorChar === '1' || floorChar === '2') meshFloor = parseInt(floorChar);
      }
      const isVisible = (clipFloor !== null && clipFloor !== undefined) ? (meshFloor <= clipFloor) : true;

      issues.push({ id: cleanName, mesh: child, status: systemStatus, isVisible, isSelfIssue: status !== 'Normal' });
    });
    setIssueMeshes(issues);
  }, [clonedScene, activeMode, finalACAssets, clipFloor]);

  // ── Material Update + Selected Mesh ─────────────────────────────────────────
  useEffect(() => {
    let activeSelectedMesh: { mesh: THREE.Mesh; id: string } | null = null
    const cleanSelectedId = selectedRoomId?.toLowerCase().replace(/\./g, '');

    let peerId: string | null = null;
    if (cleanSelectedId && (cleanSelectedId.startsWith('fcu-') || cleanSelectedId.startsWith('cdu-'))) {
      const parts = cleanSelectedId.split('-');
      const prefix = parts[0] === 'fcu' ? 'cdu' : 'fcu';
      peerId = `${prefix}-${parts.slice(1).join('-')}`;
    }

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const nameLower = child.name.toLowerCase()
        const cleanName = nameLower.replace(/\./g, '');

        const isSelected = !!(cleanSelectedId && cleanName === cleanSelectedId);
        const isPeerSelected = !!(peerId && cleanName === peerId);
        const isPartofSelection = isSelected || isPeerSelected;

        const isAC = nameLower.startsWith('fcu-') || nameLower.startsWith('cdu-')
        const isRoom = nameLower.startsWith('rm-')
        const isFur = nameLower.startsWith('lf-') || nameLower.startsWith('bf-')
        const isStruc = nameLower.startsWith('xr-struc') || nameLower.startsWith('st-')
        const isArch = nameLower.startsWith('xr-') && !isStruc
        const isPipe = nameLower.startsWith('pipe-ref-') || nameLower.startsWith('pipe-ele-') || nameLower.startsWith('pipe-drn-')

        const selectedACRoom = cleanSelectedId?.startsWith('fcu-') || cleanSelectedId?.startsWith('cdu-')
          ? cleanSelectedId?.split('-')[1] ?? null
          : null
        const isPipeOfSelectedRoom = isPipe && selectedACRoom
          ? nameLower.split('-')[2] === selectedACRoom
          : false

        if (child.userData.isOutline) {
          child.visible = false;
          return;
        }

        const existingOutline = child.children.find(c => c.userData.isOutline);
        if (existingOutline) {
          existingOutline.visible = isPartofSelection;
        } else if (isPartofSelection && (isAC || isFur || (isPipe && isPipeOfSelectedRoom))) {
          const outlineGeo = child.geometry.clone();
          const box = new THREE.Box3().setFromObject(child);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const outlineScale = 1 + (10 / maxDim);
          const outlineMat = new THREE.MeshBasicMaterial({
            color: '#ffffff',
            side: THREE.BackSide,
            transparent: true,
            opacity: isPipe ? 0.8 : 0.5
          });
          const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
          outlineMesh.scale.multiplyScalar(outlineScale);
          outlineMesh.userData.isOutline = true;
          child.add(outlineMesh);
        }

        const meshBox = new THREE.Box3().setFromObject(child);
        const meshCenter = new THREE.Vector3();
        meshBox.getCenter(meshCenter);
        const yFloor = meshCenter.y > 2.8 ? 2 : 1;

        let meshFloor = yFloor;
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
          const parts = nameLower.split(/[-.]/);
          if (parts.length > 1) {
            const floorChar = parts[1].charAt(0);
            if (floorChar === '1' || floorChar === '2') meshFloor = parseInt(floorChar);
          }
        }

        const isVisible = (clipFloor !== null && clipFloor !== undefined) ? (meshFloor <= clipFloor) : true;
        child.visible = isVisible;

        const materialConfig = { side: THREE.DoubleSide }

        if (isAC) {
          const liveAsset = (finalACAssets || []).find(a => a.id.toLowerCase() === cleanName);
          const status = liveAsset?.status || child.userData.status || 'Normal';
          const statusColor = getStatusColor(status);

          if (isSelected) {
            activeSelectedMesh = { mesh: child, id: child.name.toUpperCase() }
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
            activeSelectedMesh = { mesh: child, id: (assetData?.id || child.name).toUpperCase() }
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
            color: '#71797E', roughness: 0.8, metalness: 0.2, transparent: false, opacity: 1.0
          })
          child.raycast = child.visible ? THREE.Mesh.prototype.raycast : () => null
        }

        else if (isArch) {
          child.material = new THREE.MeshStandardMaterial({
            ...materialConfig,
            color: '#475569', roughness: 0.9, metalness: 0, transparent: true,
            opacity: (activeMode === 'Fur' || activeMode === 'AC') ? 0.3 : 1.0
          })
          child.raycast = child.visible ? THREE.Mesh.prototype.raycast : () => null
        }

        else if (isPipe) {
          const pipeType = nameLower.startsWith('pipe-ref-') ? 'ref'
            : nameLower.startsWith('pipe-ele-') ? 'ele'
            : nameLower.startsWith('pipe-drn-') ? 'drn'
            : 'unknown'
          const pipeColor = isPipeOfSelectedRoom
            ? pipeType === 'ref' ? '#3b82f6'
            : pipeType === 'ele' ? '#ef4444'
            : pipeType === 'drn' ? '#92400e'
            : '#22c55e'
            : '#71797E'
          child.material = new THREE.MeshStandardMaterial({
            ...materialConfig,
            roughness: 0.5, metalness: 0.3,
            color: pipeColor,
            emissive: isPipeOfSelectedRoom ? pipeColor : '#000000',
            emissiveIntensity: isPipeOfSelectedRoom ? 3.0 : 0,
            transparent: !isPipeOfSelectedRoom,
            opacity: isPipeOfSelectedRoom ? 1.0 : 0.25,
          })

          if (isPipeOfSelectedRoom && !child.userData.glowMesh) {
            const glowGeo = child.geometry.clone()
            const glowMat = new THREE.MeshBasicMaterial({
              color: pipeColor, transparent: true, opacity: 0.3, side: THREE.BackSide, fog: false
            })
            const glowMesh = new THREE.Mesh(glowGeo, glowMat)
            glowMesh.scale.multiplyScalar(1.2)
            glowMesh.userData.isGlow = true
            child.add(glowMesh)
            child.userData.glowMesh = true
          }

          const glowChild = child.children.find(c => c.userData.isGlow)
          if (glowChild) glowChild.visible = isPipeOfSelectedRoom

          child.raycast = THREE.Mesh.prototype.raycast
        }
      }
    })
    setSelectedMesh(activeSelectedMesh)
  }, [clonedScene, selectedRoomId, activeMode, clipFloor, allFurniture, finalACAssets])

  return (
    <group
      onPointerDown={(e) => {
        e.stopPropagation();
        const name = e.object.name.toLowerCase();
        if (name.startsWith('pipe-')) {
          const box = new THREE.Box3().setFromObject(e.object as THREE.Mesh);
          const center = new THREE.Vector3();
          box.getCenter(center);
          setClickedPipe(prev => prev?.name === e.object.name.toUpperCase() ? null : { name: e.object.name.toUpperCase(), position: center });
          return;
        }
        const isAsset = /^(rm-|fcu-|cdu-|lf-|bf-|db-|ac-)/.test(name);
        if (isAsset) { setClickedPipe(null); onRoomClick?.(name); }
      }}
    >
      <primitive object={clonedScene} />

      {/* Room number labels */}
      {(activeMode === 'AR' || activeMode === 'AC') && roomLabels
        .filter(room => {
          const camY = cameraYRef.current
          return room.floor === 2 ? camY > 8 : camY <= 8
        })
        .map((room) => (
          <Html key={room.id} position={[room.position.x, room.floorY + 1.0, room.position.z]} className="pointer-events-none">
            <div
              className={`-translate-x-1/2 text-[32px] font-black whitespace-nowrap select-none tracking-widest ${
                activeMode === 'AR' ? 'text-slate-800/40' : 'text-white/20'
              }`}
              style={{ textShadow: activeMode === 'AR' ? '0 2px 16px rgba(255,255,255,0.6)' : '0 2px 12px rgba(0,0,0,0.15)' }}
            >
              {room.number}
            </div>
          </Html>
        ))
      }

      {/* Pipe name tooltip */}
      {clickedPipe && (
        <Html position={clickedPipe.position} className="pointer-events-none">
          <div className="-translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900/90 text-white text-[10px] font-black rounded-[3px] whitespace-nowrap tracking-wider border border-white/20">
            {clickedPipe.name}
          </div>
        </Html>
      )}

      {/* Selected label — tracked via useFrame */}
      {(activeMode === 'AC' || activeMode === 'Fur') && selectedMesh && (
        <SelectedMarker key={selectedMesh.id} mesh={selectedMesh.mesh} id={selectedMesh.id} />
      )}

      {/* Issue markers — tracked via useFrame, NOT pre-computed positions */}
      {activeMode === 'AC' && issueMeshes.map(data => (
        <IssueMarker key={data.id} data={data} />
      ))}
    </group>
  )
}

useGLTF.preload('/models/ar15-302.glb?v=2')
