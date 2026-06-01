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
      const { data: nodes } = await supabase.from('kg_nodes').select('*')
      const { data: logs } = await supabase.from('ac_maintenance_logs').select('*')
      const { data: edges } = await supabase.from('kg_edges').select('*')
      const allNodes = nodes || []
      const allLogs: any[] = logs || []
      const allEdges: any[] = edges || []

      // Map: node id → node
      const nodeMap = new Map<string, any>()
      for (const n of allNodes) nodeMap.set(n.id, n)

      for (const b of buildings) {
        const prefix = b.code.toUpperCase()

        // Find all nodes for this building
        const bldNodes = allNodes.filter(n => (n.name || '').toUpperCase().startsWith(`${prefix}-`))
        if (bldNodes.length === 0) continue

        // Rooms: type === 'room' or type === 'floor'
        for (const n of bldNodes) {
          const type = (n.type || '').toLowerCase()
          if (type === 'room') {
            const name = (n.name || '').replace(`${prefix}-`, '')
            const roomNum = name.replace(/[^0-9]/g, '') || '0'
            const meta = n.metadata || {} as any
            rooms.push({
              id: name.toLowerCase(),
              number: roomNum,
              floor: parseInt(roomNum.charAt(0)) || 1,
              name: meta.room_name || meta.name || name,
            })
          }
        }

        // AC units: type === 'fcu' or type === 'cdu'
        const acUnits = bldNodes.filter(n => {
          const t = (n.type || '').toLowerCase()
          return t === 'fcu' || t === 'cdu'
        })

        for (const unit of acUnits) {
          const name = (unit.name || '').replace(`${prefix}-`, '').toLowerCase()
          const meta = unit.metadata || {} as any
          const acType: 'FCU' | 'CDU' = (unit.type || '').toLowerCase() === 'cdu' ? 'CDU' : 'FCU'

          // Find parent AC_SET to get brand/install info
          const parentEdges = allEdges.filter(e => e.object_id === unit.id && e.predicate === 'contains')
          let brand = 'Carrier'
          let model = '---'
          let capacity = '---'
          let installDate = ''

          for (const pe of parentEdges) {
            const parent = nodeMap.get(pe.subject_id)
            if (parent && (parent.type === 'ac_set' || (parent.name || '').includes('AC-'))) {
              const pmeta = parent.metadata || {} as any
              brand = pmeta.brand || 'Carrier'
              model = pmeta.model || pmeta.ac_type || '---'
              capacity = pmeta.capacity || '---'
              installDate = pmeta.install_date || ''
              break
            }
          }

          // Get logs for this unit
          const unitLogs = allLogs.filter(l => {
            const aid = (l.asset_id || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
            const nid = name.replace(/[^a-z0-9-]/g, '')
            return aid === nid || nid.includes(aid) || aid.includes(nid)
          })

          const status = unitLogs.length > 0
            ? (unitLogs[0].status || 'Normal')
            : 'Normal'

          assets.push({
            id: name,
            name: name.toUpperCase(),
            type: acType,
            brand,
            model,
            capacity,
            status,
            lastService: unitLogs.length > 0 ? unitLogs[0].date : '',
            nextService: unitLogs.length > 0 ? 'Serviced' : installDate ? 'Due' : 'N/A',
            metadata: { buildingCode: b.code, installDate },
            install: installDate,
          } as any)
        }

        console.log(`[Master] ${b.code}: ${acUnits.length} AC units (${assets.length} total)`)
      }

      // Dedup rooms
      const roomMap = new Map<string, Room>()
      for (const r of rooms) roomMap.set(r.id, r)
      setAllRooms(Array.from(roomMap.values()))
    } catch (e) {
      console.warn('[Master] load failed:', e)
    }

    setAllAssets(assets)
    setLoading(false)
    console.log(`[Master] DONE: ${assets.length} AC units, ${rooms.length} rooms`)
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
