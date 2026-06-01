import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, fetchBuildingData, fetchAllACLogs } from '../utils/supabase'
import acSpecsJson from '../utils/ac-specs.json'
import type { ACLogRow, KGNodeRow, KGEdgeRow } from '../types/database'

/** Extract all asset IDs from building data (for filtering logs by building) */
function extractAssetIds(data: Record<string, unknown> | null): Set<string> {
  const ids = new Set<string>()
  if (!data || !data.floors) return ids
  
  // floors can be array or object — handle both
  const floors: any[] = Array.isArray(data.floors)
    ? data.floors
    : Object.values(data.floors as object)
  
  for (const f of floors) {
    if (!f.rooms) continue
    for (const r of f.rooms) {
      if (!r.assets) continue
      for (const a of r.assets) {
        if (a.id) ids.add(a.id.toLowerCase())
        if (a.assetId) ids.add(a.assetId.toLowerCase())
      }
    }
  }
  return ids
}

export function useDatabase(buildingCode: string) {
  const [buildingData, setBuildingData] = useState<Record<string, unknown>>(acSpecsJson)
  const [allDbLogs, setAllDbLogs] = useState<ACLogRow[]>([])
  const [allKgNodes, setAllKgNodes] = useState<KGNodeRow[]>([])
  const [allKgEdges, setAllKgEdges] = useState<KGEdgeRow[]>([])
  const [isLive, setIsLive] = useState(false)

  const loadData = useCallback(async () => {
    try {
      let data: Record<string, unknown> | null = null
      try { data = await fetchBuildingData(buildingCode) } catch { /* expected */ }
      if (data) setBuildingData(data)

      let logs: ACLogRow[] = []
      let nodes: KGNodeRow[] = []
      let edges: KGEdgeRow[] = []

      try { logs = await fetchAllACLogs() || [] } catch { /* ignore */ }
      try {
        const res = await supabase.from('kg_nodes').select('*')
        nodes = res.data || []
      } catch { /* ignore */ }
      try {
        const res = await supabase.from('kg_edges').select('*')
        edges = res.data || []
      } catch { /* ignore */ }

      setAllDbLogs(logs)
      setAllKgNodes(nodes)
      setAllKgEdges(edges)
      setIsLive(true)
    } catch (err: unknown) {
      console.warn('⚠️ Supabase connection failed:', (err as Error).message)
    }
  }, [buildingCode])

  useEffect(() => {
    loadData()
    const handleRefresh = () => loadData()
    window.addEventListener('refresh-bim-data', handleRefresh)
    return () => window.removeEventListener('refresh-bim-data', handleRefresh)
  }, [loadData])

  // Filter logs by current building — only show logs for assets in this building
  const acDbLogs = useMemo(() => {
    const assetIds = extractAssetIds(buildingData)
    if (assetIds.size === 0) return allDbLogs  // no building data → show all (fallback)
    return allDbLogs.filter(log => {
      const aid = (log.asset_id || '').toLowerCase()
      return assetIds.has(aid) || assetIds.has(aid.replace(/[^a-z0-9-]/g, ''))
    })
  }, [allDbLogs, buildingData])

  // Filter KG nodes by building prefix (e.g., "AR15-")
  const kgNodes = useMemo(() => {
    return allKgNodes.filter(n => {
      const name = (n.name || '').toLowerCase()
      return name.startsWith(`${buildingCode.toLowerCase()}-`) || name === buildingCode.toLowerCase()
    })
  }, [allKgNodes, buildingCode])

  // Filter KG edges — keep edges where at least one endpoint is in this building
  const kgEdges = useMemo(() => {
    const nodeNames = new Set(kgNodes.map(n => n.name?.toLowerCase()))
    return allKgEdges.filter(e => {
      const src = (e.subject_id || '').toLowerCase()
      const tgt = (e.object_id || '').toLowerCase()
      return nodeNames.has(src) || nodeNames.has(tgt)
    })
  }, [allKgEdges, kgNodes])

  return { buildingData, acDbLogs, kgNodes, kgEdges, isLive }
}
