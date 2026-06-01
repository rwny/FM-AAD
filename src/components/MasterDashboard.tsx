import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { buildings } from '../utils/buildings'
import { ProjectDashboard } from './ui/ProjectDashboard'
import type { ACAsset, Room } from '../types/bim'

export function MasterDashboard() {
  const navigate = useNavigate()
  const [allAssets, setAllAssets] = useState<ACAsset[]>([])
  const [allRooms, setAllRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAllData() }, [])

  async function loadAllData() {
    setLoading(true)
    const assets: ACAsset[] = []
    const rooms: Room[] = []

    try {
      // Fetch ALL KG nodes at once (AC type nodes have room/floor info in metadata)
      const { data: nodes } = await supabase.from('kg_nodes').select('*')
      const allNodes = nodes || []
      console.log('[Master] Raw kg_nodes sample:', allNodes.slice(0, 5).map(n => ({ name: n.name, type: n.type, meta: n.metadata })))
      console.log('[Master] Total kg_nodes:', allNodes.length)

      // Debug: show AR15 nodes structure
      console.log('[Master] AR15 nodes count:', allNodes.filter(n => (n.name || '').toUpperCase().startsWith('AR15-')).length)
      console.log('[Master] AR15 node types:', [...new Set(allNodes.filter(n => (n.name || '').toUpperCase().startsWith('AR15-')).map(n => n.type || JSON.stringify(n.metadata)))].slice(0, 20))
      console.log('[Master] AR15 node names (first 15):', allNodes.filter(n => (n.name || '').toUpperCase().startsWith('AR15-')).slice(0, 15).map(n => n.name))
      const { data: logs } = await supabase.from('ac_maintenance_logs').select('*')
      const allLogs: any[] = logs || []

      // Group by building
      for (const b of buildings) {
        const prefix = b.code.toUpperCase()
        const bldNodes = allNodes.filter(n => {
          const name = (n.name || '').toUpperCase()
          return name.startsWith(`${prefix}-`)
        })

        if (bldNodes.length === 0) continue

        // Find AC type nodes and their parent rooms
        const acNodes = bldNodes.filter(n => {
          const type = ((n.metadata as any)?.type || n.type || '').toLowerCase()
          return type === 'ac' || (n.name || '').toLowerCase().includes('ac-')
        })

        // Find room nodes (ARCH, FUR, AC parents)
        const roomNodes = bldNodes.filter(n => {
          const name = (n.name || '').toUpperCase()
          return name.includes('ROOM-') || (name.match(/-AC-/) && !name.endsWith('-AC'))
        })

        // Map rooms
        for (const rn of roomNodes) {
          const name = (rn.name || '').replace(`${prefix}-`, '')
          const roomNum = name.replace(/[^0-9]/g, '') || '0'
          let floor = parseInt(roomNum.charAt(0)) || 1
          const meta = (rn.metadata || {}) as any
          if (meta.floor) floor = parseInt(meta.floor) || floor

          rooms.push({
            id: name.toLowerCase(),
            number: roomNum,
            floor,
            name: meta.room_name || name,
          })
        }

        // Map AC assets
        for (const an of acNodes) {
          const name = (an.name || '').replace(`${prefix}-`, '')
          const meta = (an.metadata || {}) as any
          const acType = meta.ac_type || '42TGF0361CP'

          // Extract AC unit IDs from this node's children or metadata
          const childNodes = bldNodes.filter(n => {
            const parent = (n.metadata as any)?.parent_id
            return parent === an.id
          })

          for (const cn of childNodes) {
            const cnName = (cn.name || '').replace(`${prefix}-`, '').toLowerCase()
            if (cnName.startsWith('fcu-') || cnName.startsWith('cdu-')) {
              const type: 'FCU' | 'CDU' = cnName.startsWith('cdu') ? 'CDU' : 'FCU'
              // Get logs for this asset
              const assetLogs = allLogs.filter(l => {
                const aid = (l.asset_id || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
                const nid = cnName.replace(/[^a-z0-9-]/g, '')
                return aid === nid || nid.includes(aid)
              })

              const latestStatus = assetLogs.length > 0 ? assetLogs[0].status : 'Normal'
              const installDate = meta.install_date || ''

              assets.push({
                id: cnName,
                name: cnName.toUpperCase(),
                type,
                brand: meta.brand || 'Carrier',
                model: acType,
                capacity: meta.capacity || '---',
                status: latestStatus,
                lastService: assetLogs.length > 0 ? assetLogs[0].date : '',
                nextService: assetLogs.length > 0 ? 'Serviced' : 'Pending',
                metadata: { buildingCode: b.code, installDate },
                install: installDate,
              } as any)
            }
          }
        }
        console.log(`[Master] ${b.code}: ${assets.length} total AC so far`)
      }
    } catch (e) {
      console.warn('[Master] load failed:', e)
    }

    // Deduplicate rooms
    const roomMap = new Map<string, Room>()
    for (const r of rooms) roomMap.set(r.id, r)

    setAllAssets(assets)
    setAllRooms(Array.from(roomMap.values()))
    setLoading(false)
    console.log(`[Master] DONE: ${assets.length} AC units, ${roomMap.size} rooms`)
  }

  const handleSelect = (assetId: string) => {
    const asset = allAssets.find(a => a.id === assetId)
    const bldCode = (asset as any)?.metadata?.buildingCode || 'AR15'
    navigate(`/${bldCode}/ac/${assetId}`)
  }

  return (
    <div className="fixed inset-0 z-[110] bg-stone-50 dark:bg-zinc-950 overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-full text-stone-400 dark:text-zinc-600 text-sm">
          กำลังโหลดข้อมูลทุกอาคาร...
        </div>
      ) : allAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-5xl">📊</div>
          <p className="text-stone-400 dark:text-zinc-500 text-sm">ยังไม่มีข้อมูล AC ในระบบ</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm">
            กลับหน้าแรก
          </button>
        </div>
      ) : (
        <ProjectDashboard
          assets={allAssets}
          rooms={allRooms}
          onSelect={handleSelect}
          onSelectLog={(log: any) => handleSelect(log.asset_id || '')}
          onClose={() => navigate('/')}
        />
      )}
    </div>
  )
}
