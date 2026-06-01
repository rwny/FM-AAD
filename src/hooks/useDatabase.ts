import { useState, useEffect, useCallback } from 'react'
import { supabase, fetchBuildingData, fetchAllACLogs } from '../utils/supabase'
import acSpecsJson from '../utils/ac-specs.json'
import type { ACLogRow, KGNodeRow, KGEdgeRow } from '../types/database'

export function useDatabase(buildingCode: string) {
  const [buildingData, setBuildingData] = useState<Record<string, unknown>>(acSpecsJson)
  const [acDbLogs, setAcDbLogs] = useState<ACLogRow[]>([])
  const [kgNodes, setKgNodes] = useState<KGNodeRow[]>([])
  const [kgEdges, setKgEdges] = useState<KGEdgeRow[]>([])
  const [isLive, setIsLive] = useState(false)

  const loadData = useCallback(async () => {
    try {
      // Attempt to fetch building data — expects 406 for buildings not yet in DB
      let data: Record<string, unknown> | null = null
      try { data = await fetchBuildingData(buildingCode) } catch { /* building not in DB yet — expected */ }
      if (data) setBuildingData(data)

      let logs: ACLogRow[] = []
      let nodes: KGNodeRow[] = []
      let edges: KGEdgeRow[] = []

      try {
        logs = await fetchAllACLogs() || []
      } catch { /* ignore */ }

      try {
        const res = await supabase.from('kg_nodes').select('*')
        nodes = res.data || []
      } catch { /* ignore */ }

      try {
        const res = await supabase.from('kg_edges').select('*')
        edges = res.data || []
      } catch { /* ignore */ }

      setAcDbLogs(logs)
      setKgNodes(nodes)
      setKgEdges(edges)
      setIsLive(true)
    } catch (err: unknown) {
      // Network / auth error — app works with fallback data
      console.warn('⚠️ Supabase connection failed:', (err as Error).message)
    }
  }, [buildingCode])

  useEffect(() => {
    loadData()
    const handleRefresh = () => loadData()
    window.addEventListener('refresh-bim-data', handleRefresh)
    return () => window.removeEventListener('refresh-bim-data', handleRefresh)
  }, [loadData])

  return { buildingData, acDbLogs, kgNodes, kgEdges, isLive }
}
