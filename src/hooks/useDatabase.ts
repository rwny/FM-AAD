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
      const data = await fetchBuildingData(buildingCode)
      if (data) setBuildingData(data)

      const [logs, nodesRes, edgesRes] = await Promise.all([
        fetchAllACLogs(),
        supabase.from('kg_nodes').select('*'),
        supabase.from('kg_edges').select('*')
      ])

      setAcDbLogs(logs || [])
      setKgNodes(nodesRes.data || [])
      setKgEdges(edgesRes.data || [])
      setIsLive(true)
      console.log('📡 Connected to Supabase DBs')
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

  return { buildingData, acDbLogs, kgNodes, kgEdges, isLive }
}
