import { Suspense } from 'react'
import { SceneLighting } from './SceneLighting'
import { SceneControls } from './SceneControls'
import { BuildingModel } from './BuildingModel'
import { BuildingPlaceholder } from './BuildingPlaceholder'
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
          <BuildingPlaceholder />
        )}
      </Suspense>
    </>
  )
}
