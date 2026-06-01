import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { buildings } from '../utils/buildings'
import type { ACAsset } from '../types/bim'

interface BldGroup {
  code: string
  name: string
  hasModel: boolean
  assets: ACAsset[]
}

export function MasterDashboard() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<BldGroup[]>([])
  const [loading, setLoading] = useState(true)

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
        const acUnits = bldNodes.filter(n => {
          const t = (n.type || '').toLowerCase()
          return t === 'fcu' || t === 'cdu'
        })

        if (acUnits.length === 0) continue

        const assets: ACAsset[] = []
        for (const unit of acUnits) {
          const name = (unit.name || '').replace(`${prefix}-`, '').toLowerCase()
          const meta = unit.metadata || {} as any
          const acType: 'FCU' | 'CDU' = (unit.type || '').toLowerCase() === 'cdu' ? 'CDU' : 'FCU'

          let brand = 'Carrier'
          let model = '---'
          let capacity = '---'
          let installDate = ''

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
            metadata: { buildingCode: b.code },
            install: installDate,
          } as any)
        }

        assets.sort((a, b) => a.id.localeCompare(b.id))
        result.push({
          code: b.code,
          name: b.name === 'x' ? '' : b.name,
          hasModel: b.hasModel,
          assets,
        })
      }

      result.sort((a, b) => a.code.localeCompare(b.code))
    } catch (e) {
      console.warn('[Master] load failed:', e)
    }

    setGroups(result)
    setLoading(false)
    console.log(`[Master] ${result.length} buildings, ${result.reduce((s, g) => s + g.assets.length, 0)} AC units`)
  }

  const totalUnits = groups.reduce((s, g) => s + g.assets.length, 0)

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'normal' || s === 'completed') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950'
    if (s === 'faulty') return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950'
    return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950'
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans select-none overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-stone-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-stone-400 dark:text-zinc-500 hover:text-amber-600 text-lg">←</button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">📊 Master AC Dashboard</h1>
            <p className="text-[10px] text-stone-500 dark:text-zinc-500">{groups.length} อาคาร · {totalUnits} เครื่อง</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/master/full')}
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-800 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5"
        >
          📋 Full View
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-6 pb-12">
        {loading ? (
          <div className="text-center py-12 text-stone-400">กำลังโหลด...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 text-stone-400">ยังไม่มีข้อมูล</div>
        ) : (
          groups.map(g => (
            <section key={g.code}>
              {/* Building Header */}
              <div className="flex items-center gap-3 mb-2 pb-2 border-b border-stone-200 dark:border-zinc-800">
                <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">{g.code}</span>
                {g.name && <span className="text-xs text-stone-500 dark:text-zinc-500">{g.name}</span>}
                {g.hasModel && <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">3D</span>}
                <span className="ml-auto text-[10px] text-stone-400 dark:text-zinc-600">{g.assets.length} เครื่อง</span>
              </div>

              {/* Asset List */}
              <div className="space-y-1">
                {g.assets.map(a => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/${g.code}/ac/${a.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800/50 transition-colors text-left group"
                  >
                    {/* Type badge */}
                    <span className={`text-[10px] font-bold w-9 text-center px-1.5 py-0.5 rounded ${a.type === 'FCU' ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950' : 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950'}`}>
                      {a.type}
                    </span>

                    {/* ID + Model */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-mono font-semibold truncate">{a.id.toUpperCase()}</div>
                      <div className="text-[10px] text-stone-400 dark:text-zinc-600 truncate">{a.brand} · {a.model} · {a.capacity}</div>
                    </div>

                    {/* Status */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${getStatusColor(a.status)} shrink-0`}>
                      {a.status}
                    </span>

                    <span className="text-stone-300 dark:text-zinc-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  )
}
