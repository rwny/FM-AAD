import { Text } from '@react-three/drei'
import { getBuilding } from '../../utils/buildings'
import { useAppStore } from '../../store'
import * as THREE from 'three'

export function BuildingPlaceholder() {
  const buildingCode = useAppStore(s => s.buildingCode)
  const building = getBuilding(buildingCode)
  const displayName = building?.name === 'x' ? '' : (building?.name || '')

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#292524" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Grid helper */}
      <gridHelper args={[10, 10, '#44403c', '#292524']} position={[0, 0, 0]} />

      {/* Building code — big text */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={1.2}
        fontWeight={900}
        color="#d97706"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
      >
        {buildingCode}
      </Text>

      {/* Building name — smaller text below */}
      {displayName && (
        <Text
          position={[0, 1.0, 0]}
          fontSize={0.4}
          color="#a8a29e"
          anchorX="center"
          anchorY="middle"
        >
          {displayName}
        </Text>
      )}

      {/* Status badge */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.2}
        color="#57534e"
        anchorX="center"
        anchorY="middle"
      >
        ยังไม่มีโมเดล 3D
      </Text>

      {/* Info at bottom */}
      <Text
        position={[0, -1.2, 0]}
        fontSize={0.18}
        color="#57534e"
        anchorX="center"
        anchorY="middle"
      >
        {building?.floors || '?'} ชั้น
      </Text>

      {/* Subtle ambient glow */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} />
    </group>
  )
}
