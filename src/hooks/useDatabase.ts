import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, fetchBuildingData, fetchAllACLogs } from '../utils/supabase'
import acSpecsJson from '../utils/ac-specs.json'
import type { ACLogRow, KGNodeRow, KGEdgeRow } from '../types/database'

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

  // AC logs — pass through unfiltered (filtering happens in useMergedAssets)
  const acDbLogs = allDbLogs

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
