import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export function ScreenshotHandler() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    const takeScreenshot = () => {
      gl.render(scene, camera)
      const dataUrl = gl.domElement.toDataURL('image/png')
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      link.download = `BIM_AR15_Capture_${timestamp}.png`
      link.href = dataUrl
      link.click()
    }
    const handleCustomEvent = () => takeScreenshot()
    window.addEventListener('take-screenshot', handleCustomEvent)
    return () => window.removeEventListener('take-screenshot', handleCustomEvent)
  }, [gl, scene, camera])
  return null
}

export function CameraOffset({ leftVisible, rightVisible, sidebarWidth = 300 }: { leftVisible: boolean, rightVisible: boolean, sidebarWidth?: number }) {
  const { camera, size } = useThree()
  const currentOffset = useRef(0)
  useFrame(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const l = leftVisible ? sidebarWidth : 0
      const r = rightVisible ? sidebarWidth : 0
      const targetOffset = (r - l) / 2
      currentOffset.current = THREE.MathUtils.lerp(currentOffset.current, targetOffset, 0.1)
      camera.setViewOffset(size.width, size.height, currentOffset.current, 0, size.width, size.height)
      camera.updateProjectionMatrix()
    }
  })
  return null
}

export function SceneControls({ leftVisible, rightVisible }: { leftVisible: boolean, rightVisible: boolean }) {
  return (
    <>
      <ScreenshotHandler />
      <CameraOffset leftVisible={leftVisible} rightVisible={rightVisible} sidebarWidth={300} />
      <PerspectiveCamera makeDefault position={[-30, 20, 30]} fov={35} />
      <OrbitControls 
        target={[0, 2, 0]} 
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={10} 
        maxDistance={80}
        makeDefault
      />
    </>
  )
}
