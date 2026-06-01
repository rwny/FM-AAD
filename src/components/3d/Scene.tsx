import { Suspense } from 'react'
import { SceneLighting } from './SceneLighting'
import { SceneControls } from './SceneControls'
import { BuildingModel } from './BuildingModel'
import { useAppStore } from '../../store'
import { getBuilding } from '../../utils/buildings'
import type { BIMMode, ACAsset } from '../../types/bim'

interface SceneProps {
  selectedRoomId: string | null
  rightVisible: boolean
  activeMode: BIMMode
  clipFloor: number | null
  buildingData: Record<string, unknown>
  finalACAssets: ACAsset[]
}

export function Scene({
  selectedRoomId, rightVisible, activeMode, clipFloor, buildingData, finalACAssets
}: SceneProps) {
  const buildingCode = useAppStore(s => s.buildingCode)
  const building = getBuilding(buildingCode)
  const hasModel = building?.hasModel && building?.glb
  const glbUrl = hasModel ? `/models/${building!.glb}` : null

  return (
    <>
      <SceneControls leftVisible={false} rightVisible={rightVisible} />
      <Suspense fallback={null}>
        <SceneLighting />
        {glbUrl ? (
          <BuildingModel
            url={glbUrl}
            selectedRoomId={selectedRoomId}
            activeMode={activeMode}
            clipFloor={clipFloor}
            buildingData={buildingData}
            finalACAssets={finalACAssets}
          />
        ) : (
          /* Fallback: show a centered message when no 3D model */
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[4, 0.1, 3]} />
            <meshStandardMaterial color="#292524" transparent opacity={0.3} />
          </mesh>
        )}
      </Suspense>
    </>
  )
}
