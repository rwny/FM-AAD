import { Sky, Environment, ContactShadows } from '@react-three/drei'

export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[-20, 60, 40]} 
        intensity={1.2} 
        castShadow 
        shadow-bias={-0.001}
        shadow-mapSize={[4096, 4096]} 
        shadow-camera-left={-100} 
        shadow-camera-right={100} 
        shadow-camera-top={100} 
        shadow-camera-bottom={-100} 
      />
      <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0} azimuth={0.25} turbidity={0.05} rayleigh={0.3} />
      <Environment preset="apartment" />
      <ContactShadows position={[0, -0.01, 0]} opacity={0.2} scale={100} blur={2.5} far={15} color="#334155" />
    </>
  )
}
