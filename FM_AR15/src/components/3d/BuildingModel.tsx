import { useGLTF, Html } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Room, ACAsset } from '../../types/bim'

interface BuildingModelProps {
  url: string;
  activeMode: string;
  selectedRoomId?: string | null;
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

export function BuildingModel({ url, activeMode, selectedRoomId, onRoomsFound, onACFound, onRoomClick }: BuildingModelProps) {
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
      const foundAC: ACAsset[] = []
      const labels: RoomLabelData[] = []

      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
          const nameLower = child.name.toLowerCase()

          if (nameLower.startsWith('fcu-') || nameLower.startsWith('cdu-')) {
            const type = nameLower.startsWith('fcu-') ? 'FCU' : 'CDU'
            if (!child.userData.status) {
              const rand = Math.random()
              child.userData.status = rand > 0.85 ? 'Faulty' : rand > 0.7 ? 'Maintenance' : 'Normal'
            }
            foundAC.push({
              id: nameLower,
              name: `${type} ${nameLower.split('-')[1] || ''}`,
              type: type, brand: 'System Default', model: 'BIM-Model-V1', capacity: 'Auto-detected',
              status: child.userData.status, lastService: '2026-03-10', nextService: 'Pending'
            })
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

          if (nameLower.startsWith('xr-')) {
            child.material = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9, metalness: 0 })
          }
        }
      })
      setRoomLabels(labels)
      if (onRoomsFound) onRoomsFound(foundRooms.sort((a, b) => a.number.localeCompare(b.number)))
      if (onACFound) onACFound(foundAC)
    }
  }, [clonedScene, onRoomsFound, onACFound])

  useEffect(() => {
    let activeACLabel: ACLabelData | null = null
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const nameLower = child.name.toLowerCase()
        const isSelected = nameLower === selectedRoomId?.toLowerCase()
        const isAC = nameLower.startsWith('fcu-') || nameLower.startsWith('cdu-')
        const isRoom = nameLower.startsWith('rm-')

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
            emissiveIntensity: isSelected ? 0.8 : (activeMode === 'AC' ? 0.2 : 0)
          })
          child.raycast = activeMode === 'AC' ? THREE.Mesh.prototype.raycast : () => null
        }

        if (isRoom) {
          const roomNumber = parseInt(nameLower.replace('rm-', ''))
          if (roomNumber >= 1000) { child.visible = false; return; }
          child.material = new THREE.MeshStandardMaterial({
            transparent: true, roughness: 0.9, metalness: 0, depthWrite: false,
            color: isSelected ? '#f97316' : '#e2e8f0',
            opacity: activeMode === 'AR' ? (isSelected ? 0.9 : 0.7) : (isSelected ? 0.9 : 0.05),
            emissive: isSelected ? '#f97316' : '#000000',
            emissiveIntensity: isSelected ? 0.2 : 0
          })
          child.raycast = activeMode === 'AR' ? THREE.Mesh.prototype.raycast : () => null
        }
      }
    })
    setSelectedACLabel(activeACLabel)
  }, [clonedScene, selectedRoomId, activeMode])

  return (
    <group onPointerDown={(e) => { e.stopPropagation(); onRoomClick?.(e.object.name.toLowerCase()); }}>
      <primitive object={clonedScene} />
      
      {/* ROOM LABELS - Increased Font Size */}
      {activeMode === 'AR' && roomLabels.map((room) => {
        const isSelected = room.id === selectedRoomId
        return (
          <Html key={room.id} position={room.position} center distanceFactor={25} className="pointer-events-none transition-all duration-300">
            <div 
              className={`px-3 py-1.5 rounded-[6px] text-[12px] font-black shadow-xl whitespace-nowrap transition-all ${isSelected ? 'text-white scale-125 z-50 shadow-indigo-500/20' : 'text-slate-800 bg-white/95 border border-slate-200'}`} 
              style={{ backgroundColor: isSelected ? '#f97316' : undefined }}
            >
              {room.number}
            </div>
          </Html>
        )
      })}

      {/* SELECTED AC LABEL - Increased Font Size & Boldness */}
      {activeMode === 'AC' && selectedACLabel && (
        <Html position={selectedACLabel.position} center distanceFactor={20} className="pointer-events-none">
          <div className="px-4 py-2 bg-indigo-600 text-white text-[14px] font-black rounded-[8px] shadow-2xl border border-indigo-400 whitespace-nowrap ring-4 ring-indigo-600/20">
            {selectedACLabel.id}
          </div>
        </Html>
      )}
    </group>
  )
}

useGLTF.preload('/src/assets/models/ar15-301.glb')
