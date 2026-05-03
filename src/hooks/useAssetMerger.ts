import { useMemo } from 'react'
import type { ACAsset } from '../types/bim'
import type { ACLogRow, KGNodeRow, KGEdgeRow, MergedACAsset, ExtractedFurniture, ACStats } from '../types/database'
import acSpecsJson from '../utils/ac-specs.json'
import { tgfData } from '../data/carrier-tgf'
import { determineStatus, getPeerId, computeACStats, extractFurnitureFromData } from '../utils/asset-utils'

const tgfModels: Record<string, Record<string, any>> = (tgfData as any).models || {};

function enrichMetadataFromCatalog(modelAsset: ACAsset, acType: string, mdMatch: any): any {
  const originalMeta = (modelAsset as any).metadata || {};
  const enriched: Record<string, any> = { ...originalMeta };

  const catalogModel = tgfModels[acType];
  if (catalogModel) {
    enriched.catalogModel = acType;
    enriched.catalogSpecs = { ...catalogModel };
  }

  return enriched;
}

export function useMergedAssets(
  acAssets: ACAsset[],
  acDbLogs: ACLogRow[],
  kgNodes: KGNodeRow[],
  kgEdges: KGEdgeRow[]
): MergedACAsset[] {
  return useMemo(() => {
    const specsMap: Record<string, { spec: Record<string, unknown>; typeInfo: Record<string, unknown>; systemId: string }> = {}
    if ((acSpecsJson as Record<string, unknown>).floors) {
      Object.values((acSpecsJson as Record<string, unknown>).floors as Record<string, unknown>).forEach((floorRooms) => {
        Object.values(floorRooms as Record<string, unknown>).forEach((roomACs) => {
          Object.entries(roomACs as Record<string, unknown>).forEach(([acId, acData]) => {
            const data = acData as Record<string, unknown>
            if (data.units) {
              (data.units as string[]).forEach((u: string) => {
                const normalizedU = u.toLowerCase().replace(/\./g, '-')
                specsMap[normalizedU] = {
                  spec: data,
                  typeInfo: ((acSpecsJson as Record<string, unknown>).types as Record<string, unknown>)[data.type as string] as Record<string, unknown>,
                  systemId: acId
                }
              })
            }
          })
        })
      })
    }

    return acAssets.map(modelAsset => {
      const modelIdLow = modelAsset.id.toLowerCase()
      const modelNormalized = modelIdLow.replace(/\./g, '-')

      const mdMatchData = specsMap[modelNormalized]
      const mdMatch = mdMatchData?.spec
      const mdTypeInfo = mdMatchData?.typeInfo
      let matchedAcId = mdMatchData?.systemId || ''

      const node = kgNodes.find(n => n.name.toLowerCase() === modelIdLow)
      let acType = (mdMatch?.type as string) || ''
      let assetIdStr = (mdMatch?.assetId as string) || modelAsset.id
      let installDate = (mdMatch?.installedDate as string) || ''

      if (node) {
        const edge = kgEdges.find(e => e.object_id === node.id && e.predicate === 'contains')
        const parentNode = edge ? kgNodes.find(n => n.id === edge.subject_id) : null

        const meta = node.metadata || parentNode?.metadata || {}
        if (meta.ac_type) acType = meta.ac_type as string
        if (meta.asset_id) assetIdStr = meta.asset_id as string
        if (meta.install_date) installDate = meta.install_date as string
        if (parentNode) matchedAcId = parentNode.name
      }

      const peerId = getPeerId(modelAsset.id)

      const normalizedModelId = modelIdLow.replace(/[^a-z0-9]/g, '')
      const selfLogs = acDbLogs.filter(
        (l) => l.asset_id.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedModelId
      )

      const systemWideLogs = acDbLogs.filter((l) => {
        const dbId = l.asset_id.toLowerCase().replace(/[^a-z0-9]/g, '')
        const pId = peerId ? peerId.toLowerCase().replace(/[^a-z0-9]/g, '') : null
        const sId = matchedAcId ? matchedAcId.toLowerCase().replace(/[^a-z0-9]/g, '') : null
        return dbId === normalizedModelId || (pId && dbId === pId) || (sId && dbId === sId)
      })

      const sortedSelfLogs = [...selfLogs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      const sortedSystemLogs = [...systemWideLogs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

      const status = determineStatus(sortedSelfLogs, installDate)
      const systemStatus = determineStatus(sortedSystemLogs)

      let brand = mdTypeInfo?.brand || 'Carrier'
      let model = mdTypeInfo?.model || acType || '---'
      let capacity = mdTypeInfo?.capacity || '---'

      if (!mdTypeInfo && acType) {
        const typeInfo = tgfModels[acType]
        if (typeInfo) {
          brand = typeInfo.Brand || brand
          model = acType
          capacity = typeInfo.NominalCoolingCapacity ? `${typeInfo.NominalCoolingCapacity} BTU/hr` : capacity
        }
      }

      const enrichedMetadata = enrichMetadataFromCatalog(modelAsset, acType, mdMatch)

      return {
        ...modelAsset,
        metadata: enrichedMetadata,
        assetId: assetIdStr,
        acType: acType || 'Unknown',
        brand,
        model,
        capacity,
        install: installDate || '---',
        logs: sortedSelfLogs.map((l) => ({
          id: l.id,
          date: l.date,
          created_at: l.created_at,
          issue: l.issue,
          reporter: l.reporter,
          contractor: l.contractor,
          contractor_contact: l.contractor_contact,
          status: l.status,
          note: l.note,
          wo_number: l.wo_number,
          cost: l.cost,
          appointment_date: l.appointment_date
        })),
        status,
        systemStatus,
        lastService: sortedSelfLogs.length > 0 ? sortedSelfLogs[0].date : ''
      } as MergedACAsset
    })
  }, [acAssets, acDbLogs, kgNodes, kgEdges])
}

export function useFurnitureData(buildingData: Record<string, unknown>): ExtractedFurniture[] {
  return useMemo(() => extractFurnitureFromData(buildingData) as ExtractedFurniture[], [buildingData])
}

export function useACStats(finalACAssets: MergedACAsset[]): ACStats {
  return useMemo(() => computeACStats(finalACAssets), [finalACAssets])
}
