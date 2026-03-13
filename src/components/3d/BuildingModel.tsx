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
}

interface RoomLabelData extends Room {
  position: THREE.Vector3;
  isVisible: boolean;
}

interface ACLabelData {
  id: string;
  position: THREE.Vector3;
}

export function BuildingModel({ url, activeMode, selectedRoomId, clipFloor, onRoomsFound, onACFound, onRoomClick }: BuildingModelProps) {
  const { scene } = useGLTF(url)
  const clonedScene = useMemo(() => scene.clone(), [scene])
  const [roomLabels, setRoomLabels] = useState<RoomLabelData[]>([])
  const [selectedACLabel, setSelectedACLabel] = useState<ACLabelData | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Maintenance': return '#f59e0b'
      case 'Faulty': return '#ef4444'
      case 'Warning': return '#facc15'
      default: return '#0ea5e9'
    }
  }

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
              roomBox.getCenter(center) // Using a temp vector is safer but reusing 'center' here is okay as it's just for center
              roomBox.getCenter(roomCenter)
              const roomData = { id: nameLower, number: roomNumberStr, floor: parseInt(roomNumberStr.charAt(0)), name: `Room ${roomNumberStr}` }
              foundRooms.push(roomData)
              labels.push({ ...roomData, position: roomCenter, isVisible: true })
            }
          }

          if (nameLower.startsWith('xr-')) {
            child.material = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9, metalness: 0 })
          }
        }
      })

      // Sync status for FCU/CDU pairs
      const STATUS_PRIORITY: Record<string, number> = { 'Faulty': 3, 'Warning': 2, 'Maintenance': 1, 'Normal': 0 };
      const groupStatus: Record<string, string> = {};
      
      // 1. Assign random statuses first if none exist, and find the worst for each group
      foundACRaw.forEach(item => {
        if (!item.mesh.userData.status) {
          const rand = Math.random()
          item.mesh.userData.status = rand > 0.85 ? 'Faulty' : rand > 0.7 ? 'Maintenance' : 'Normal'
        }
        const currentStatus = item.mesh.userData.status;
        if (STATUS_PRIORITY[currentStatus] > (STATUS_PRIORITY[groupStatus[item.suffix]] || 0)) {
          groupStatus[item.suffix] = currentStatus;
        }
      });

      // 2. Re-apply the worst status to all meshes in each group and prepare data for parent
      const foundACFinal: ACAsset[] = foundACRaw.map(item => {
        item.mesh.userData.status = groupStatus[item.suffix];
        return {
          id: item.nameLower,
          name: `${item.type} ${item.suffix || ''}`,
          type: item.type as 'FCU' | 'CDU',
          brand: 'System Default',
          model: 'BIM-Model-V1',
          capacity: 'Auto-detected',
          status: item.mesh.userData.status,
          lastService: '2026-03-10',
          nextService: 'Pending'
        }
      });

      setRoomLabels(labels)
      if (onRoomsFound) onRoomsFound(foundRooms.sort((a, b) => a.number.localeCompare(b.number)))
      if (onACFound) onACFound(foundACFinal)
    }
  }, [clonedScene, onRoomsFound, onACFound])

  useEffect(() => {
    let activeACLabel: ACLabelData | null = null
    
    // Create clipping plane based on selected floor
    let clippingPlane: THREE.Plane | null = null;
    let clipHeight: number | null = null;
    if (clipFloor) {
      // Floor 1 -> y=2.4, Floor 2 -> y=5.4
      clipHeight = clipFloor === 1 ? 2.4 : (clipFloor === 2 ? 5.4 : (clipFloor * 3.0) - 0.6)
      clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), clipHeight)
    }

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const nameLower = child.name.toLowerCase()
        const isSelected = nameLower === selectedRoomId?.toLowerCase()
        const isAC = nameLower.startsWith('fcu-') || nameLower.startsWith('cdu-')
        const isRoom = nameLower.startsWith('rm-')

        // Calculate if this mesh is above the clipping plane
        let isAboveClip = false;
        if (clipHeight !== null) {
          const meshBox = new THREE.Box3().setFromObject(child);
          const meshCenter = new THREE.Vector3();
          meshBox.getCenter(meshCenter);
          if (meshCenter.y > clipHeight) {
            isAboveClip = true;
          }
        }

        if (isAC) {
          const statusColor = getStatusColor(child.userData.status)
          if (isSelected) {
            const acBox = new THREE.Box3().setFromObject(child)
            const acCenter = new THREE.Vector3()
            acBox.getCenter(acCenter)
            activeACLabel = { id: child.name.toUpperCase(), position: acCenter }
          }
          child.material = new THREE.MeshStandardMaterial({
            roughness: 0.5, metalness: 0.2, transparent: activeMode !== 'AC',
            opacity: activeMode === 'AC' ? 1.0 : 0.1,
            color: statusColor,
            emissive: isSelected ? statusColor : '#000000',
            emissiveIntensity: isSelected ? 0.8 : (activeMode === 'AC' ? 0.2 : 0),
            clippingPlanes: clippingPlane ? [clippingPlane] : [],
            clipShadows: true,
            side: THREE.DoubleSide
          })
          child.raycast = (activeMode === 'AC' && !isAboveClip) ? THREE.Mesh.prototype.raycast : () => null
        }

        else if (isRoom) {
          const roomNumber = parseInt(nameLower.replace('rm-', ''))
          if (roomNumber >= 1000) { child.visible = false; return; }
          child.material = new THREE.MeshStandardMaterial({
            transparent: true, roughness: 0.9, metalness: 0, depthWrite: false,
            color: isSelected ? '#f97316' : '#e2e8f0',
            opacity: activeMode === 'AR' ? (isSelected ? 0.9 : 0.7) : (isSelected ? 0.9 : 0.55),
            emissive: isSelected ? '#f97316' : '#000000',
            emissiveIntensity: isSelected ? 0.2 : 0,
            clippingPlanes: clippingPlane ? [clippingPlane] : [],
            clipShadows: true,
            side: THREE.DoubleSide
          })
          child.raycast = (activeMode === 'AR' && !isAboveClip) ? THREE.Mesh.prototype.raycast : () => null
        }

        // Apply clipping to architectural elements (xr- prefix)
        else if (nameLower.startsWith('xr-')) {
          child.material = new THREE.MeshStandardMaterial({ 
            color: '#475569', 
            roughness: 0.9, 
            metalness: 0,
            clippingPlanes: clippingPlane ? [clippingPlane] : [],
            clipShadows: true,
            side: THREE.DoubleSide
          })
          child.raycast = !isAboveClip ? THREE.Mesh.prototype.raycast : () => null
        }
      }
    })
    setSelectedACLabel(activeACLabel)
  }, [clonedScene, selectedRoomId, activeMode, clipFloor])

  return (
    <group onPointerDown={(e) => { e.stopPropagation(); onRoomClick?.(e.object.name.toLowerCase()); }}>
      <primitive object={clonedScene} />
      {activeMode === 'AR' && roomLabels.filter(r => !clipFloor || r.floor === clipFloor).map((room) => {
        const isSelected = room.id === selectedRoomId
        return (
          <Html key={room.id} position={room.position} className="pointer-events-none transition-all duration-300">
            <div 
              className={`px-2 py-1 rounded-[4px] text-[10px] font-black shadow-xl whitespace-nowrap transition-all -translate-x-1/2 ${isSelected ? 'text-slate-900 bg-white scale-110 z-50 ring-2 ring-indigo-500' : 'text-slate-800 bg-white/95 border border-slate-200'}`} 
            >
              {room.number}
            </div>
          </Html>
        )
      })}
      {activeMode === 'AC' && selectedACLabel && (
        <Html position={selectedACLabel.position} className="pointer-events-none">
          <div className="px-2 py-1 bg-white text-slate-900 text-[10px] font-black rounded-[4px] shadow-xl whitespace-nowrap transition-all -translate-x-1/2 scale-110 z-50 ring-2 ring-indigo-500">
            {selectedACLabel.id}
          </div>
        </Html>
      )}
    </group>
  )
}

useGLTF.preload('/models/ar15-301.glb')
