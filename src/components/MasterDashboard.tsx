import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildings } from '../utils/buildings'
import { supabase } from '../utils/supabase'

interface BldStats {
  code: string
  name: string
  hasModel: boolean
  floors: number
  acTotal: number
  acFaulty: number
  acMaintenance: number
  acNormal: number
}

export function MasterDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<BldStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllStats()
  }, [])

  async function loadAllStats() {
    setLoading(true)
    try {
      // Fetch all KG nodes (contains AC type nodes per building)
      const { data: nodes } = await supabase.from('kg_nodes').select('*')
      const { data: logsData } = await supabase.from('ac_maintenance_logs').select('*')

      const allNodes = nodes || []
      const allLogs: any[] = logsData || []

      const result: BldStats[] = buildings.map(b => {
        // Count AC nodes for this building
        const bldNodes = allNodes.filter(n =>
          (n.name || '').toLowerCase().startsWith(`${b.code.toLowerCase()}-`) &&
          (n.type || '').toLowerCase() === 'ac'
        )
        // Count logs for this building (match asset_id with building's AC prefix)
        const bldLogs = allLogs.filter(l => {
          const aid = (l.asset_id || '').toLowerCase()
          // Try match fcu-xxx or cdu-xxx patterns from building data
          return bldNodes.some(n => {
            const nid = (n.name || '').toLowerCase().replace(/^[a-z0-9]+-ac-/, '')
            return aid.includes(nid) || nid.includes(aid)
          })
        })

        // Aggregate status
        const statusMap: Record<string, number> = {}
        for (const log of bldLogs) {
          const s = log.status || 'Normal'
          statusMap[s] = (statusMap[s] || 0) + 1
        }

        return {
          code: b.code,
          name: b.name === 'x' ? '' : b.name,
          hasModel: b.hasModel,
          floors: b.floors,
          acTotal: bldNodes.length,
          acFaulty: statusMap['Faulty'] || 0,
          acMaintenance: (statusMap['Maintenance'] || 0) + (statusMap['In Progress'] || 0) + (statusMap['Pending'] || 0),
          acNormal: (statusMap['Normal'] || 0) + (statusMap['Completed'] || 0),
        }
      })

      setStats(result)
      console.log('[Master] stats loaded:', result.length, 'buildings, total AC:', result.reduce((s, b) => s + b.acTotal, 0))
    } catch (e) {
      console.warn('[Master] Supabase query failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const totalAC = stats.reduce((s, b) => s + b.acTotal, 0)
  const totalFaulty = stats.reduce((s, b) => s + b.acFaulty, 0)
  const totalMaint = stats.reduce((s, b) => s + b.acMaintenance, 0)
  const totalNormal = stats.reduce((s, b) => s + b.acNormal, 0)
  const buildingsWithData = stats.filter(b => b.acTotal > 0).length

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans select-none overflow-y-auto">
      {/* Header */}
      <header className="border-b border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-stone-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">📊 Master Dashboard</h1>
            <p className="text-xs text-stone-500 dark:text-zinc-500 mt-0.5">
              ภาพรวมระบบปรับอากาศ · {buildings.length} อาคาร
            </p>
          </div>
        </div>
        {loading && (
          <span className="text-xs text-stone-400 dark:text-zinc-600 animate-pulse">กำลังโหลด...</span>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="อาคารที่มีข้อมูล" value={buildingsWithData} color="text-blue-600 dark:text-blue-400" />
          <SummaryCard label="AC ทั้งหมด" value={totalAC} color="text-slate-700 dark:text-zinc-300" />
          <SummaryCard label="Normal" value={totalNormal} color="text-emerald-600 dark:text-emerald-400" />
          <SummaryCard label="Faulty / Maint" value={`${totalFaulty} / ${totalMaint}`} color="text-rose-600 dark:text-rose-400" />
        </div>

        {/* Buildings Table */}
        <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950 text-xs uppercase tracking-wider text-stone-500 dark:text-zinc-500">
                <th className="text-left px-4 py-3">อาคาร</th>
                <th className="text-center px-3 py-3 w-14">ชั้น</th>
                <th className="text-center px-3 py-3 w-14">3D</th>
                <th className="text-center px-3 py-3 w-20">AC</th>
                <th className="text-center px-3 py-3 hidden sm:table-cell">🟢</th>
                <th className="text-center px-3 py-3 hidden sm:table-cell">🟡</th>
                <th className="text-center px-3 py-3 hidden sm:table-cell">🔴</th>
                <th className="text-right px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {stats.map((b, i) => (
                <tr
                  key={b.code}
                  className={`border-b border-stone-50 dark:border-zinc-800/50 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors ${i % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-stone-50/30 dark:bg-zinc-900/50'}`}
                >
                  <td className="px-4 py-2.5">
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{b.code}</span>
                      {b.name && <span className="text-stone-400 dark:text-zinc-500 ml-2 text-xs">{b.name}</span>}
                    </div>
                  </td>
                  <td className="text-center px-3 py-2.5 text-xs text-stone-400 dark:text-zinc-600 font-mono">{b.floors > 0 ? b.floors : ''}</td>
                  <td className="text-center px-3 py-2.5">
                    {b.hasModel ? (
                      <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">3D</span>
                    ) : (
                      <span className="text-stone-300 dark:text-zinc-700">-</span>
                    )}
                  </td>
                  <td className="text-center px-3 py-2.5 font-mono text-xs font-bold text-slate-600 dark:text-zinc-300">
                    {b.acTotal > 0 ? b.acTotal : <span className="text-stone-300 dark:text-zinc-700 font-normal">-</span>}
                  </td>
                  <td className="text-center px-3 py-2.5 hidden sm:table-cell">
                    {b.acNormal > 0 ? <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{b.acNormal}</span> : <span className="text-stone-300 dark:text-zinc-700">-</span>}
                  </td>
                  <td className="text-center px-3 py-2.5 hidden sm:table-cell">
                    {b.acMaintenance > 0 ? <span className="text-xs font-mono text-amber-600 dark:text-amber-400">{b.acMaintenance}</span> : <span className="text-stone-300 dark:text-zinc-700">-</span>}
                  </td>
                  <td className="text-center px-3 py-2.5 hidden sm:table-cell">
                    {b.acFaulty > 0 ? <span className="text-xs font-mono text-rose-600 dark:text-rose-400">{b.acFaulty}</span> : <span className="text-stone-300 dark:text-zinc-700">-</span>}
                  </td>
                  <td className="text-right px-4 py-2.5">
                    <button
                      onClick={() => navigate(`/${b.code}/ac`)}
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                    >
                      ดู →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-stone-400 dark:text-zinc-600 mb-1">{label}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  )
}
