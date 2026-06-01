import { Text } from '@react-three/drei'
import { useAppStore } from '../../store'
import * as THREE from 'three'

const GRID_COLOR = '#f59e0b'      // amber grid lines
const GRID_CENTER = '#1c1917'     // dark center
const TEXT_COLOR = '#facc15'      // bright yellow text
const BG_COLOR = '#1a1a2e'        // deep blue bg
const GLOW_COLOR = '#f59e0b'

export function BuildingPlaceholder() {
  const buildingCode = useAppStore(s => s.buildingCode)

  return (
    <group>
      {/* Dark base plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={BG_COLOR} />
      </mesh>

      {/* Neon grid helper */}
      <gridHelper args={[10, 10, GRID_COLOR, '#292524']} position={[0, 0, 0]} />

      {/* Glowing center pad */}
      <mesh position={[0, 0.01, 0]}>
        <planeGeometry args={[2.5, 1.8]} />
        <meshBasicMaterial color={GRID_CENTER} transparent opacity={0.6} />
      </mesh>

      {/* Building code — big bold */}
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

      {/* Lights */}
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 4, 3]} intensity={2} color={GLOW_COLOR} />
      <pointLight position={[0, 4, -3]} intensity={1} color="#6366f1" />
    </group>
  )
}
