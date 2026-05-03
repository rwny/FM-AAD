import { Sky, ContactShadows } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function DirectionalLightHelper({ position, intensity, color, castShadow, shadowConfig }: { 
  position: [number, number, number]
  intensity: number
  color?: string
  castShadow?: boolean
  shadowConfig?: any
}) {
  const lightRef = useRef<any>(null)
  
  return (
    <directionalLight 
      ref={lightRef}
      position={position} 
      intensity={intensity}
      color={color}
      castShadow={castShadow}
      {...shadowConfig}
    />
  )
}

export function SceneLighting() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      const now = new Date()
      const hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
      groupRef.current.rotation.y = ((hours % 12) / 12) * Math.PI * 2
    }
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      
      <group ref={groupRef}>
        {/* Key Light - Main light source */}
        <DirectionalLightHelper 
          position={[-20, 60, 40]} 
          intensity={1.5}
          castShadow
          shadowConfig={{
            'shadow-bias': -0.001,
            'shadow-mapSize': [8192, 8192],
            'shadow-camera-left': -100,
            'shadow-camera-right': 100,
            'shadow-camera-top': 100,
            'shadow-camera-bottom': -100,
          }}
        />
        
        {/* Fill Light - Softens shadows from opposite side */}
        <DirectionalLightHelper 
          position={[30, 40, -30]} 
          intensity={0.6}
          color="#e0f2fe"
        />
        
        {/* Back Light / Rim Light - Creates separation from background */}
        <DirectionalLightHelper 
          position={[0, 30, -50]} 
          intensity={0.4}
          color="#f0f9ff"
        />
      </group>
      
      <hemisphereLight args={['#87ceeb', '#f0f9ff', 0.4]} />
      <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0} azimuth={0.25} turbidity={0.05} rayleigh={0.3} />
      <ContactShadows position={[0, -0.01, 0]} opacity={0.2} scale={100} blur={2.5} far={15} color="#334155" />
    </>
  )
}





