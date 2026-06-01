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
    // 1. Fetch building data
    let data: Record<string, unknown> | null = null
    try {
      data = await fetchBuildingData(buildingCode)
    } catch (e) {
      console.warn(`[DB] building "${buildingCode}" not found in DB — using fallback`)
    }
    if (data) {
      setBuildingData(data)
      console.log(`[DB] ✅ building data loaded for ${buildingCode}`)
    }

    // 2. Fetch AC logs
    let logs: ACLogRow[] = []
    try {
      const raw = await fetchAllACLogs()
      logs = raw || []
      console.log(`[DB] AC logs count: ${logs.length}`)
    } catch (e) {
      console.warn('[DB] fetchAllACLogs failed:', e)
    }

    // 3. Fetch KG nodes
    let nodes: KGNodeRow[] = []
    try {
      const res = await supabase.from('kg_nodes').select('*')
      nodes = res.data || []
      console.log(`[DB] KG nodes count: ${nodes.length}`)
    } catch (e) {
      console.warn('[DB] kg_nodes fetch failed:', e)
    }

    // 4. Fetch KG edges
    let edges: KGEdgeRow[] = []
    try {
      const res = await supabase.from('kg_edges').select('*')
      edges = res.data || []
      console.log(`[DB] KG edges count: ${edges.length}`)
    } catch (e) {
      console.warn('[DB] kg_edges fetch failed:', e)
    }

    setAllDbLogs(logs)
    setAllKgNodes(nodes)
    setAllKgEdges(edges)
    setIsLive(true)
    console.log(`[DB] 📡 Connected — bld=${buildingCode} logs=${logs.length} nodes=${nodes.length} edges=${edges.length}`)
  }, [buildingCode])

  useEffect(() => {
    loadData()
    const handleRefresh = () => loadData()
    window.addEventListener('refresh-bim-data', handleRefresh)
    return () => window.removeEventListener('refresh-bim-data', handleRefresh)
  }, [loadData])

  // AC logs — pass through unfiltered
  const acDbLogs = allDbLogs

  // Filter KG nodes by building prefix
  const kgNodes = useMemo(() => {
    return allKgNodes.filter(n => {
      const name = (n.name || '').toLowerCase()
      return name.startsWith(`${buildingCode.toLowerCase()}-`) || name === buildingCode.toLowerCase()
    })
  }, [allKgNodes, buildingCode])

  // Filter KG edges
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
