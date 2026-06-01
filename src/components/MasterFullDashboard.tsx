import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { buildings } from '../utils/buildings'
import { ProjectDashboard } from './ui/ProjectDashboard'
import type { ACAsset, Room } from '../types/bim'

export function MasterFullDashboard() {
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
      const nodeMap = new Map<string, any>()
      for (const n of allNodes) nodeMap.set(n.id, n)

      // Collect buildings first, then sort
      const buildingAssets: Map<string, ACAsset[]> = new Map()

      for (const b of buildings) {
        const prefix = b.code.toUpperCase()
        const bldNodes = allNodes.filter(n => (n.name || '').toUpperCase().startsWith(`${prefix}-`))
        if (bldNodes.length === 0) continue

        const bldAssets: ACAsset[] = []

        for (const n of bldNodes) {
          if ((n.type || '').toLowerCase() === 'room') {
            const name = (n.name || '').replace(`${prefix}-`, '')
            rooms.push({
              id: name.toLowerCase(),
              number: name.replace(/[^0-9]/g, '') || '0',
              floor: parseInt(name.charAt(0)) || 1,
              name: ((n.metadata as any)?.room_name || name),
            })
          }
        }

        const acUnits = bldNodes.filter(n => ['fcu', 'cdu'].includes((n.type || '').toLowerCase()))
        for (const unit of acUnits) {
          const name = (unit.name || '').replace(`${prefix}-`, '').toLowerCase()
          const meta = unit.metadata || {} as any
          const acType: 'FCU' | 'CDU' = (unit.type || '').toLowerCase() === 'cdu' ? 'CDU' : 'FCU'

          let brand = 'Carrier', model = '---', capacity = '---', installDate = ''
          const parentEdges = allEdges.filter(e => e.object_id === unit.id && e.predicate === 'contains')
          for (const pe of parentEdges) {
            const parent = nodeMap.get(pe.subject_id)
            if (parent && ((parent.type === 'ac_set') || (parent.name || '').includes('AC-'))) {
              const pmeta = parent.metadata || {} as any
              brand = pmeta.brand || 'Carrier'
              model = pmeta.model || pmeta.ac_type || '---'
              capacity = pmeta.capacity || '---'
              installDate = pmeta.install_date || ''
              break
            }
          }

          const unitLogs = allLogs.filter(l => {
            const aid = (l.asset_id || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
            const nid = name.replace(/[^a-z0-9-]/g, '')
            return aid === nid || nid.includes(aid) || aid.includes(nid)
          })
          const status = unitLogs.length > 0 ? (unitLogs[0].status || 'Normal') : 'Normal'

          bldAssets.push({
            id: name,
            name: `${name.toUpperCase()}`,
            type: acType,
            brand, model, capacity,
            status,
            lastService: unitLogs.length > 0 ? unitLogs[0].date : '',
            nextService: unitLogs.length > 0 ? 'Serviced' : 'N/A',
            metadata: { buildingCode: b.code, installDate },
            install: installDate,
          } as any)
        }

        bldAssets.sort((a, b) => a.id.localeCompare(b.id))

        // Insert a divider row before each building group
        if (bldAssets.length > 0) {
          const separator: any = {
            id: `---divider-${b.code}`,
            name: `── ${b.code} · ${b.name === 'x' ? '' : b.name} · ${bldAssets.length} เครื่อง ──`,
            type: 'DIV' as any,
            brand: '',
            model: '',
            capacity: '',
            status: 'Divider',
            lastService: '',
            nextService: '',
            metadata: { isDivider: true, buildingCode: b.code },
            install: '',
          }
          bldAssets.unshift(separator)
        }

        if (bldAssets.length > 0) {
          buildingAssets.set(b.code, bldAssets)
        }
      }

      // Sort buildings by code, flatten with dividers
      const sortedCodes = Array.from(buildingAssets.keys()).sort()
      for (const code of sortedCodes) {
        assets.push(...buildingAssets.get(code)!)
      }
    } catch (e) {
      console.warn('[MasterFull] load failed:', e)
    }

    setAllAssets(assets)
    setAllRooms(rooms)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[110] bg-stone-50 dark:bg-zinc-950 overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-full text-stone-400 text-sm">กำลังโหลด...</div>
      ) : (
        <ProjectDashboard
          assets={allAssets}
          rooms={allRooms}
          onSelect={(id) => {
            const a = allAssets.find(x => x.id === id)
            navigate(`/${(a as any)?.metadata?.buildingCode || 'AR15'}/ac/${id}`)
          }}
          onSelectLog={(log: any) => {
            const a = allAssets.find(x => x.id === log.asset_id)
            navigate(`/${(a as any)?.metadata?.buildingCode || 'AR15'}/ac/${log.asset_id}`)
          }}
          onClose={() => navigate('/master')}
        />
      )}
    </div>
  )
}
