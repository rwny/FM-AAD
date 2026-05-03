import React, { useMemo } from 'react'
import { Calendar, ChevronRight, AlertCircle } from 'lucide-react'

interface PlannedMaintenanceProps {
  assets: any[]
  onSelect: (id: string) => void
}

export const PlannedMaintenance: React.FC<PlannedMaintenanceProps> = ({ assets, onSelect }) => {
  const schedule = useMemo(() => {
    const now = new Date()
    const grouped: Record<string, any[]> = {}

    assets.forEach(a => {
      const install = new Date(a.install || '2024-01-01')
      const logs = a.logs || []
      let lastService = install
      logs.forEach((l: any) => {
        if (l.status === 'Completed') {
          const d = new Date(l.date)
          if (d > lastService) lastService = d
        }
      })
      const next = new Date(lastService)
      next.setFullYear(next.getFullYear() + 1)

      const daysLeft = Math.round((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const monthKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
      const overdue = daysLeft < 0
      const soon = daysLeft <= 30 && daysLeft >= 0

      if (!grouped[monthKey]) grouped[monthKey] = []
      grouped[monthKey].push({
        id: a.id,
        name: a.name || a.id,
        brand: a.brand,
        nextDate: next,
        daysLeft,
        overdue,
        soon,
        status: a.status
      })
    })

    // Sort months
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
      .map(([month, items]) => ({
        month,
        label: new Date(month + '-01').toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
        items: items.sort((a, b) => a.daysLeft - b.daysLeft)
      }))
  }, [assets])

  const overdueCount = assets.reduce((sum, a) => {
    const install = new Date(a.install || '2024-01-01')
    const logs = a.logs || []
    let last = install
    logs.forEach((l: any) => { if (l.status === 'Completed') { const d = new Date(l.date); if (d > last) last = d } })
    last.setFullYear(last.getFullYear() + 1)
    return sum + (last < new Date() ? 1 : 0)
  }, 0)

  if (schedule.length === 0) {
    return (
      <div className="p-8 text-center text-slate-300 text-[11px] font-black uppercase">No maintenance data</div>
    )
  }

  return (
    <div className="space-y-4">
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase">{overdueCount} unit{overdueCount > 1 ? 's' : ''} overdue</span>
        </div>
      )}

      {schedule.map(({ month, label, items }) => (
        <div key={month} className="space-y-1">
          <div className="flex items-center gap-2 px-1">
            <Calendar className="w-3.5 h-3.5 text-orange-500 dark:text-orange-600" />
            <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{label}</span>
            <span className="text-[9px] text-slate-400 dark:text-zinc-600">({items.length})</span>
          </div>
          <div className="space-y-0.5">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all hover:scale-[1.01] ${
                  item.overdue ? 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/30' :
                  item.soon ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/30' :
                  'bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${item.overdue ? 'bg-rose-500' : item.soon ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-[11px] font-black text-slate-700 dark:text-zinc-200 truncate">{item.id.toUpperCase()}</span>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 truncate">{item.brand}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold ${item.overdue ? 'text-rose-500' : item.soon ? 'text-amber-500' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {item.nextDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className={`text-[9px] font-bold ${item.overdue ? 'text-rose-500' : item.soon ? 'text-amber-500' : 'text-slate-400 dark:text-zinc-500'}`}>
                    ({item.overdue ? `${Math.abs(item.daysLeft)}d late` : `${item.daysLeft}d`})
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300 dark:text-zinc-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}





