import { useMemo } from 'react'
import type { Room, ACAsset, BIMMode } from '../types/bim'

interface SearchResult {
  id: string
  type: 'room' | 'ac' | 'ee' | 'furniture' | 'connection'
  label: string
  sublabel?: string
  mode: BIMMode
  data: any
}

// Global Search Hook
export function useGlobalSearch(
  query: string,
  rooms: Room[],
  acAssets: ACAsset[],
  furniture: any[],
  kgNodes: any[],
  kgEdges: any[]
): SearchResult[] {
  return useMemo(() => {
    if (!query || query.trim().length < 1) return []
    
    const q = query.toLowerCase().trim()
    const results: SearchResult[] = []
    
    // 1. Search Rooms
    rooms.forEach(room => {
      if (
        room.id.toLowerCase().includes(q) ||
        room.number.includes(q) ||
        room.name.toLowerCase().includes(q)
      ) {
        results.push({
          id: room.id,
          type: 'room',
          label: `Room ${room.number}`,
          sublabel: `Floor ${room.floor}`,
          mode: 'AR',
          data: room
        })
      }
    })
    
    // 2. Search AC Assets
    acAssets.forEach(asset => {
      const idLower = asset.id.toLowerCase()
      const nameLower = (asset.name || '').toLowerCase()
      const brandLower = (asset.brand || '').toLowerCase()
      const modelLower = (asset.model || '').toLowerCase()
      const acTypeLower = (asset.acType || '').toLowerCase()
      const assetIdLower = (asset.assetId || '').toLowerCase()
      
      // Normalize query - "AC-101-1" -> "101-1" to match "fcu-101-1"
      // Also "101-1" alone should match
      const normalizedQ = q.replace(/^ac-/, '').replace(/^fcu-/, '').replace(/^cdu-/, '')
      
      if (
        idLower.includes(q) ||
        nameLower.includes(q) ||
        brandLower.includes(q) ||
        modelLower.includes(q) ||
        acTypeLower.includes(q) ||
        assetIdLower.includes(q) ||
        // Also check with normalized query (handles "AC-101-1" -> "101-1")
        idLower.includes(normalizedQ) ||
        idLower.replace(/fcu-/g, '').includes(normalizedQ) ||
        idLower.replace(/cdu-/g, '').includes(normalizedQ) ||
        // Check if query matches the room number part
        (idLower.includes('fcu-') && idLower.includes(q.replace(/[^0-9]/g, ''))) ||
        (idLower.includes('cdu-') && idLower.includes(q.replace(/[^0-9]/g, '')))
      ) {
        results.push({
          id: asset.id,
          type: 'ac',
          label: asset.id.toUpperCase(),
          sublabel: `${asset.brand || ''} ${asset.model || ''} ${asset.capacity || ''}`.trim() || asset.acType || 'AC',
          mode: 'AC',
          data: asset
        })
      }
    })
    
    // 3. Search by Status (e.g., "faulty", "maintenance", "normal")
    const statusKeywords: Record<string, string> = {
      'faulty': 'Faulty', 'เสีย': 'Faulty', 'พัง': 'Faulty',
      'maintenance': 'Maintenance', 'ซ่อม': 'Maintenance', 'กำลังซ่อม': 'Maintenance',
      'normal': 'Normal', 'ปกติ': 'Normal', 'ดี': 'Normal'
    }
    
    Object.entries(statusKeywords).forEach(([keyword, status]) => {
      if (q.includes(keyword)) {
        acAssets.forEach(asset => {
          if (asset.status === status) {
            // Avoid duplicates
            if (!results.find(r => r.id === asset.id)) {
              results.push({
                id: asset.id,
                type: 'ac',
                label: asset.id.toUpperCase(),
                sublabel: `Status: ${asset.status}`,
                mode: 'AC',
                data: asset
              })
            }
          }
        })
      }
    })
    
    // 4. Search by Type/Capacity (e.g., "36000", "36", "24000")
    if (q.includes('36') || q.includes('24') || q.includes('btu')) {
      acAssets.forEach(asset => {
        if ((asset.capacity || '').includes(q) || (asset.model || '').includes(q)) {
          if (!results.find(r => r.id === asset.id)) {
            results.push({
              id: asset.id,
              type: 'ac',
              label: asset.id.toUpperCase(),
              sublabel: `${asset.brand} ${asset.capacity}`,
              mode: 'AC',
              data: asset
            })
          }
        }
      })
    }
    
    // 5. Search Furniture
    furniture.forEach(item => {
      if (
        (item.id || '').toLowerCase().includes(q) ||
        (item.typeName || '').toLowerCase().includes(q) ||
        (item.brand || '').toLowerCase().includes(q) ||
        (item.model || '').toLowerCase().includes(q)
      ) {
        results.push({
          id: item.id,
          type: 'furniture',
          label: item.typeName || item.id,
          sublabel: `${item.brand || ''} ${item.model || ''}`.trim(),
          mode: 'Fur',
          data: item
        })
      }
    })
    
    // 6. Search Knowledge Graph (connections)
    kgNodes.forEach(node => {
      if (
        (node.name || '').toLowerCase().includes(q) ||
        (node.label || '').toLowerCase().includes(q)
      ) {
        // Find connected nodes
        const connectedEdges = (kgEdges || []).filter(
          (e: any) => e.subject_id === node.id || e.object_id === node.id
        )
        const connectedNames = connectedEdges.map((e: any) => {
          const otherId = e.subject_id === node.id ? e.object_id : e.subject_id
          const otherNode = (kgNodes || []).find((n: any) => n.id === otherId)
          return otherNode?.name || otherId
        })
        
        results.push({
          id: node.id,
          type: 'connection',
          label: node.name || node.label || 'Unknown',
          sublabel: connectedNames.length > 0 
            ? `Connected: ${connectedNames.slice(0, 3).join(', ')}${connectedNames.length > 3 ? '...' : ''}`
            : 'No connections',
          mode: 'KG',
          data: { node, edges: connectedEdges }
        })
      }
    })
    
    // 7. Search by Connection (LP-123, etc.)
    if (q.includes('lp') || q.includes('pgee') || q.includes('sw-') || q.includes('pipes')) {
      (kgEdges || []).forEach((edge: any) => {
        if (
          (edge.predicate || '').toLowerCase().includes('connect') ||
          (edge.subject_id || '').toLowerCase().includes(q) ||
          (edge.object_id || '').toLowerCase().includes(q)
        ) {
          const fromNode = (kgNodes || []).find((n: any) => n.id === edge.subject_id)
          const toNode = (kgNodes || []).find((n: any) => n.id === edge.object_id)
          
          results.push({
            id: edge.id,
            type: 'connection',
            label: `${fromNode?.name || edge.subject_id} → ${toNode?.name || edge.object_id}`,
            sublabel: edge.predicate || 'connected',
            mode: 'KG',
            data: edge
          })
        }
      })
    }
    
    // Limit results
    return results.slice(0, 20)
  }, [query, rooms, acAssets, furniture, kgNodes, kgEdges])
}
