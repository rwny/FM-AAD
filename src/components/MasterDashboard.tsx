import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { buildings } from '../utils/buildings'
import { determineStatus } from '../utils/asset-utils'
import type { ACAsset } from '../types/bim'

interface BldGroup {
  code: string
  name: string
  hasModel: boolean
  assets: ACAsset[]
  summary: { normal: number; maint: number; faulty: number }
}

export function MasterDashboard() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<BldGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => { loadAllData() }, [])

  async function loadAllData() {
    setLoading(true)
    const result: BldGroup[] = []

    try {
      const { data: nodes } = await supabase.from('kg_nodes').select('*')
      const { data: logs } = await supabase.from('ac_maintenance_logs').select('*')
      const { data: edges } = await supabase.from('kg_edges').select('*')
      const allNodes = nodes || []
      const allLogs: any[] = logs || []
      const allEdges: any[] = edges || []
      const nodeMap = new Map<string, any>()
      for (const n of allNodes) nodeMap.set(n.id, n)

      for (const b of buildings) {
        const prefix = b.code.toUpperCase()
        const bldNodes = allNodes.filter(n => (n.name || '').toUpperCase().startsWith(`${prefix}-`))
        const acUnits = bldNodes.filter(n => ['fcu', 'cdu'].includes((n.type || '').toLowerCase()))
        if (acUnits.length === 0) continue

        const assets: ACAsset[] = []
        for (const unit of acUnits) {
          const name = (unit.name || '').replace(`${prefix}-`, '').toLowerCase()
          const acType: 'FCU' | 'CDU' = (unit.type || '').toLowerCase() === 'cdu' ? 'CDU' : 'FCU'
          let installDate = ''
          // Try parent AC_SET first, then unit's own metadata
          const parentEdges = allEdges.filter(e => e.object_id === unit.id && e.predicate === 'contains')
          for (const pe of parentEdges) {
            const parent = nodeMap.get(pe.subject_id)
            if (parent && ((parent.type === 'ac_set') || (parent.name || '').includes('AC-'))) {
              const pm = (parent.metadata || {}) as any
              installDate = pm.install_date || pm.InstallDate || ''
              if (installDate) break
            }
          }
          // Fallback: unit's own metadata
          if (!installDate) {
            const um = (unit.metadata || {}) as any
            installDate = um.install_date || um.InstallDate || ''
          }
          const unitLogs = allLogs.filter(l => {
            const aid = (l.asset_id || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
            const nid = name.replace(/[^a-z0-9-]/g, '')
            return aid === nid
          })
          // Debug: show actual formats
          if (name.includes('204-1') && unitLogs.length === 0) {
            const sample = allLogs.filter(l => (l.asset_id || '').toLowerCase().includes('204-1')).slice(0, 3)
            console.log('[Master] fcu-204-1: name=', name, 'nid=', name.replace(/[^a-z0-9-]/g, ''))
            console.log('[Master] fcu-204-1 log sample:', sample.map((l: any) => ({ asset_id: l.asset_id, aid: l.asset_id?.toLowerCase().replace(/[^a-z0-9-]/g, '') })))
          }
          const status = determineStatus(unitLogs, installDate || undefined)
          if (name.includes('204-1')) console.log('[Master] fcu-204-1 logs:', unitLogs.length, 'install:', installDate, 'status:', status)

          assets.push({
            id: name, name: name.toUpperCase(), type: acType,
            brand: '', model: '', capacity: '',
            status,
            lastService: '', nextService: '',
            metadata: { buildingCode: b.code }, install: installDate,
          } as any)
        }
        assets.sort((a, b) => a.id.localeCompare(b.id))
        result.push({
          code: b.code, name: b.name === 'x' ? '' : b.name, hasModel: b.hasModel, assets,
          summary: {
            normal: assets.filter(a => a.status === 'Normal').length,
            maint: assets.filter(a => a.status === 'Maintenance').length,
            faulty: assets.filter(a => a.status === 'Faulty').length,
          }
        })
      }
      result.sort((a, b) => a.code.localeCompare(b.code))
    } catch (e) { console.warn('[Master] load failed:', e) }
    setGroups(result)
    setLoading(false)
  }

  const totalUnits = groups.reduce((s, g) => {
    const keys = new Set(g.assets.map(a => { const p = a.id.split('-'); return p.length >= 3 ? `${p[1]}-${p[2]}` : a.id }))
    return s + keys.size
  }, 0)
  const totalFaulty = groups.reduce((s, g) => s + g.summary.faulty, 0)
  const totalMaint = groups.reduce((s, g) => s + g.summary.maint, 0)

  const blockColor = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'faulty') return 'bg-rose-500 dark:bg-rose-600'
    if (s === 'maintenance') return 'bg-amber-500 dark:bg-amber-600'
    return 'bg-emerald-500 dark:bg-emerald-600'
  }

  const groupByFloor = (assets: ACAsset[]) => {
    // Merge FCU+CDU pairs into one "system" block per room
    const systems = new Map<string, { id: string; fcu?: ACAsset; cdu?: ACAsset }>()
    for (const a of assets) {
      const parts = a.id.split('-')
      const key = parts.length >= 3 ? `${parts[1]}-${parts[2]}` : a.id
      if (!systems.has(key)) systems.set(key, { id: key })
      const entry = systems.get(key)!
      if (a.type === 'FCU') entry.fcu = a
      else entry.cdu = a
    }

    const map = new Map<number, Array<{ id: string; status: string; name: string }>>()
    for (const [, sys] of systems) {
      const asset = sys.fcu || sys.cdu!
      const fcuStatus = sys.fcu?.status || 'Normal'
      const cduStatus = sys.cdu?.status || 'Normal'
      // Worst status wins
      const status = fcuStatus === 'Faulty' || cduStatus === 'Faulty' ? 'Faulty'
        : fcuStatus === 'Maintenance' || cduStatus === 'Maintenance' ? 'Maintenance'
        : 'Normal'
      const parts = asset.id.split('-')
      const room = parts.length >= 2 ? parts[1] : ''
      const floor = parseInt(room.charAt(0)) || 1
      const label = `AC-${sys.id}`
      if (!map.has(floor)) map.set(floor, [])
      map.get(floor)!.push({ id: label, status, name: label })
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0])
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans select-none overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-stone-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-stone-400 dark:text-zinc-500 hover:text-amber-600 text-lg">←</button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">📊 Master Dashboard</h1>
            <p className="text-[10px] text-stone-500 dark:text-zinc-500">{groups.length} อาคาร · {totalUnits} เครื่อง</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> {groups.reduce((s,g) => s + g.summary.normal, 0)}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> {totalMaint}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> {totalFaulty}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-16">
        {loading ? (
          <div className="text-center py-12 text-stone-400">กำลังโหลด...</div>
        ) : (
          <div className="space-y-2">
            {groups.map(g => {
              const floors = groupByFloor(g.assets)
              return (
                <div key={g.code}>
                  {/* Building label */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400">{g.code}</span>
                    {g.name && <span className="text-[9px] text-stone-400 dark:text-zinc-600 truncate">{g.name}</span>}
                    <span className="ml-auto text-[9px] text-stone-400 dark:text-zinc-600 font-mono">
                      {new Set(g.assets.map(a => { const p = a.id.split('-'); return p.length >= 3 ? `${p[1]}-${p[2]}` : a.id })).size}
                    </span>
                  </div>
                  {/* Floor rows */}
                  {floors.map(([floor, assets]) => (
                    <div key={floor} className="flex items-center gap-1 mb-0.5">
                      <span className="text-[8px] text-stone-400 dark:text-zinc-600 w-8 text-right font-mono shrink-0">F{floor}</span>
                      <div className="flex gap-0.5 flex-wrap">
                        {assets.map(a => {
                          const id = `${g.code}-${a.id}`
                          return (
                            <button
                              key={a.id}
                              onClick={() => navigate(`/${g.code}/ac/${a.id}`)}
                              onMouseEnter={() => setHovered(id)}
                              onMouseLeave={() => setHovered(null)}
                              className={`w-3.5 h-3.5 rounded-[2px] transition-all cursor-pointer
                                ${blockColor(a.status)}
                                ${hovered === id ? 'scale-125 ring-1 ring-white dark:ring-zinc-800 shadow-sm' : ''}`}
                              title={`${a.id.toUpperCase()} · ${a.status}`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 border-t border-stone-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-6 py-2 flex items-center justify-center gap-4 text-[10px] text-stone-500 dark:text-zinc-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Normal</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Maintenance</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Faulty</span>
      </footer>
    </div>
  )
}
