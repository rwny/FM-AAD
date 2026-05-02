import { Suspense } from 'react'
import { SceneLighting } from './SceneLighting'
import { SceneControls } from './SceneControls'
import { BuildingModel } from './BuildingModel'
import { useAppStore } from '../../store'
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
  const glbUrl = `/models/${buildingCode.toLowerCase()}-302.glb`

  return (
    <>
      <SceneControls leftVisible={false} rightVisible={rightVisible} />
      <Suspense fallback={null}>
        <SceneLighting />
        <BuildingModel
          url={glbUrl}
          selectedRoomId={selectedRoomId}
          activeMode={activeMode}
          clipFloor={clipFloor}
          buildingData={buildingData}
          finalACAssets={finalACAssets}
        />
      </Suspense>
    </>
  )
}
