import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { supabase } from '../utils/supabase'
import { buildings } from '../utils/buildings'
import { determineStatus } from '../utils/asset-utils'
import type { ACAsset } from '../types/bim'

interface BldGroup {
  code: string
  name: string
  hasModel: boolean
  assets: ACAsset[]
}

export function MasterFullDashboard() {
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
        const acUnits = bldNodes.filter(n => ['fcu', 'cdu'].includes((n.type || '').toLowerCase()))

        if (acUnits.length === 0) continue

        const assets: ACAsset[] = []
        for (const unit of acUnits) {
          const name = (unit.name || '').replace(`${prefix}-`, '').toLowerCase()
          const acType: 'FCU' | 'CDU' = (unit.type || '').toLowerCase() === 'cdu' ? 'CDU' : 'FCU'

          let brand = 'Carrier', model = '', capacity = '', installDate = ''
          const parentEdges = allEdges.filter(e => e.object_id === unit.id && e.predicate === 'contains')
          for (const pe of parentEdges) {
            const parent = nodeMap.get(pe.subject_id)
            if (parent && ((parent.type === 'ac_set') || (parent.name || '').includes('AC-'))) {
              const pmeta = parent.metadata || {} as any
              brand = pmeta.brand || 'Carrier'
              model = pmeta.model || pmeta.ac_type || ''
              capacity = pmeta.capacity || ''
              installDate = pmeta.install_date || ''
              break
            }
          }

          const unitLogs = allLogs.filter(l => {
            const aid = (l.asset_id || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
            const nid = name.replace(/[^a-z0-9-]/g, '')
            return aid === nid || nid.includes(aid) || aid.includes(nid)
          })
          const status = determineStatus(unitLogs, installDate || undefined)
          const latestDate = unitLogs.length > 0 ? unitLogs.sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1))[0].date : ''

          assets.push({
            id: name,
            name: name.toUpperCase(),
            type: acType,
            brand,
            model,
            capacity,
            status,
            lastService: latestDate,
            nextService: installDate || '',
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
      console.warn('[MasterFull] load failed:', e)
    }

    setGroups(result)
    setLoading(false)
  }

  const totalUnits = groups.reduce((s, g) => s + g.assets.length, 0)
  const allFaulty = groups.reduce((s, g) => s + g.assets.filter(a => a.status === 'Faulty').length, 0)
  const allNormal = groups.reduce((s, g) => s + g.assets.filter(a => a.status === 'Normal').length, 0)
  const allMaint = totalUnits - allFaulty - allNormal

  const getStatusClass = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'normal' || s === 'completed') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950'
    if (s === 'faulty') return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950'
    return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950'
  }

  return (
    <div className="fixed inset-0 z-[110] bg-stone-50 dark:bg-zinc-950 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">📊 Master AC — Full View</h1>
          <p className="text-[10px] text-stone-500 dark:text-zinc-500 mt-0.5">
            {groups.length} อาคาร · {totalUnits} เครื่อง
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{allNormal} 🟢</span>
          <span className="text-stone-300 dark:text-zinc-700">|</span>
          <span className="text-amber-600 dark:text-amber-400 font-semibold">{allMaint} 🟡</span>
          <span className="text-stone-300 dark:text-zinc-700">|</span>
          <span className="text-rose-600 dark:text-rose-400 font-semibold">{allFaulty} 🔴</span>
          <button
            onClick={() => navigate('/')}
            className="ml-3 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">กำลังโหลด...</div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3">
          {groups.map(g => (
            <section key={g.code} className="mb-4">
              {/* Building Header */}
              <div className="sticky top-0 z-10 bg-stone-100 dark:bg-zinc-800/80 backdrop-blur rounded-lg px-4 py-2 mb-1 flex items-center gap-3">
                <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">{g.code}</span>
                {g.name && <span className="text-xs text-stone-600 dark:text-zinc-400 font-medium">{g.name}</span>}
                {g.hasModel && (
                  <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                    3D
                  </span>
                )}
                <span className="ml-auto text-[10px] text-stone-400 dark:text-zinc-600">
                  {g.assets.length} เครื่อง
                </span>
              </div>

              {/* Asset Table */}
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-stone-400 dark:text-zinc-600 border-b border-stone-100 dark:border-zinc-800/50">
                    <th className="text-left py-1.5 px-2 w-10">Type</th>
                    <th className="text-left py-1.5 px-2">Asset ID</th>
                    <th className="text-left py-1.5 px-2 hidden sm:table-cell">Brand/Model</th>
                    <th className="text-left py-1.5 px-2 hidden md:table-cell">Install</th>
                    <th className="text-center py-1.5 px-2 w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {g.assets.map(a => (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/${g.code}/ac/${a.id}`)}
                      className="border-b border-stone-50 dark:border-zinc-800/30 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 cursor-pointer transition-colors"
                    >
                      <td className="py-1.5 px-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${a.type === 'FCU' ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950' : 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950'}`}>
                          {a.type}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 font-mono font-semibold">{a.id.toUpperCase()}</td>
                      <td className="py-1.5 px-2 hidden sm:table-cell text-stone-500 dark:text-zinc-500">
                        {a.brand} {a.model ? `· ${a.model}` : ''}
                        {a.capacity && a.capacity !== '---' ? ` · ${a.capacity}` : ''}
                      </td>
                      <td className="py-1.5 px-2 hidden md:table-cell text-stone-400 dark:text-zinc-600">
                        {a.install || (a as any).nextService || '-'}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${getStatusClass(a.status)}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="shrink-0 border-t border-stone-200 dark:border-zinc-800 px-6 py-2 text-[10px] text-stone-400 dark:text-zinc-600 flex justify-between">
        <span>Master AC Dashboard</span>
        <span>{groups.length} buildings · {totalUnits} units</span>
      </footer>
    </div>
  )
}
