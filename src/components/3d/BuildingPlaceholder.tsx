import { Text } from '@react-three/drei'
import { useAppStore } from '../../store'
import { useEffect } from 'react'
import type { Room, ACAsset } from '../../types/bim'
import * as THREE from 'three'

const GRID_COLOR = '#f59e0b'
const GRID_CENTER = '#1c1917'
const TEXT_COLOR = '#facc15'
const BG_COLOR = '#1a1a2e'
const GLOW_COLOR = '#f59e0b'

interface Props {
  buildingData?: Record<string, unknown>
  acDbLogs?: any[]
}

/** Extract rooms + AC assets from buildingData (Supabase) when no 3D model exists */
function extractFromData(data: Record<string, unknown> | undefined): { rooms: Room[]; acAssets: ACAsset[] } {
  const rooms: Room[] = []
  const acAssets: ACAsset[] = []

  if (!data || !data.floors) return { rooms, acAssets }

  const floors: any[] = Array.isArray(data.floors)
    ? data.floors
    : Object.values(data.floors as object)

  for (const f of floors) {
    const floorNum = f.floor || (parseInt(f.name?.replace('FLOOR ', '')) || 1)
    if (!f.rooms) continue
    for (const r of f.rooms) {
      const roomId = r.id || `rm-${r.name}` || ''
      const roomNumber = roomId.replace(/[^0-9]/g, '') || '0'
      rooms.push({
        id: roomId.toLowerCase(),
        number: roomNumber,
        floor: floorNum,
        name: r.name || roomId,
      })
      if (!r.assets) continue
      for (const a of r.assets) {
        const assetId = a.id || a.assetId || ''
        acAssets.push({
          id: assetId.toLowerCase(),
          name: a.name || assetId,
          type: (assetId.toLowerCase().startsWith('fcu') ? 'FCU' : 'CDU') as 'FCU' | 'CDU',
          brand: a.brand || 'Unknown',
          model: a.model || '---',
          capacity: a.capacity || '---',
          status: a.status || 'Normal',
          lastService: a.lastService || '',
          nextService: a.nextService || '',
          metadata: a.metadata || {},
        })
      }
    }
  }
  return { rooms, acAssets }
}

export function BuildingPlaceholder({ buildingData }: Props) {
  const buildingCode = useAppStore(s => s.buildingCode)
  const setRooms = useAppStore(s => s.setRooms)
  const setAcAssets = useAppStore(s => s.setAcAssets)

  // Populate rooms + AC assets from buildingData (no 3D model to extract from)
  useEffect(() => {
    const { rooms, acAssets } = extractFromData(buildingData)
    setRooms(rooms)
    setAcAssets(acAssets)
  }, [buildingData, setRooms, setAcAssets])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={BG_COLOR} />
      </mesh>

      <gridHelper args={[10, 10, GRID_COLOR, '#292524']} position={[0, 0, 0]} />

      <mesh position={[0, 0.01, 0]}>
        <planeGeometry args={[2.5, 1.8]} />
        <meshBasicMaterial color={GRID_CENTER} transparent opacity={0.6} />
      </mesh>

      <Text
        position={[0, 1.2, 0.1]}
        fontSize={1.0}
        fontWeight={900}
        color={TEXT_COLOR}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
        outlineWidth={0.04}
        outlineColor="#000000"
      >
        {buildingCode}
      </Text>

      <ambientLight intensity={0.5} />
      <pointLight position={[0, 4, 3]} intensity={2} color={GLOW_COLOR} />
      <pointLight position={[0, 4, -3]} intensity={1} color="#6366f1" />
    </group>
  )
}
