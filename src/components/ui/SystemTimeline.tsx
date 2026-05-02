import React, { useState } from 'react'

interface SystemTimelineProps {
  installDate: string
  components: any[]
  width?: string
  showLabels?: boolean
}

export const SystemTimeline: React.FC<SystemTimelineProps> = ({
  installDate, components, width = '100%', showLabels = true
}) => {
  const TIMELINE_DAYS = 365 * 3
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const MONTH_MS = 1000 * 60 * 60 * 24 * 30.4375
  const windowDuration = TIMELINE_DAYS * MS_PER_DAY
  const todayMs = new Date().getTime()
  const startWindowMs = todayMs - windowDuration
  const installMs = new Date(installDate).getTime()

  const installOffset = ((installMs - startWindowMs) / windowDuration) * 100
  const activeWidth = 100 - Math.max(0, installOffset)

  const [tooltip, setTooltip] = useState<{ x: number; text: string; date: string; issue: string; age: number } | null>(null)

  const markers = components.flatMap(c => (c.logs || []).map((log: any) => ({ ...log, assetId: c.id })))
    .map(log => {
      const logDate = new Date(log.date).getTime()
      const pos = ((logDate - startWindowMs) / windowDuration) * 100
      const ageAtEvent = Math.round(Math.max(0, (logDate - installMs) / MONTH_MS))
      return { ...log, pos, ageAtEvent }
    }).filter(m => m.pos >= 0)

  return (
    <div className="flex flex-col w-full gap-1 relative">
      {showLabels && (
        <div className="flex justify-between w-full text-[8px] font-black text-slate-400 uppercase tracking-tighter">
          <span>3Y</span>
          <span className="text-indigo-500 italic">Today</span>
        </div>
      )}

      <div className="relative h-5 flex items-center" style={{ width }}>
        {/* Base Track */}
        <div className="absolute w-full h-1 bg-slate-100 rounded-full" />

        {/* Active Age Line */}
        {installMs >= startWindowMs && (
          <div
            className="absolute h-1 bg-indigo-300 rounded-full"
            style={{
              left: `${Math.max(0, installOffset)}%`,
              width: `${activeWidth}%`
            }}
          />
        )}

        {/* Install Point (Diamond) */}
        {installMs >= startWindowMs && (
          <div
            className="absolute w-2 h-2 bg-emerald-500 rotate-45 z-20 border border-white shadow-sm"
            style={{ left: `calc(${installOffset}% - 4px)`, top: '50%', marginTop: '-4px' }}
            title={`Install: ${installDate}`}
          />
        )}

        {/* Event Markers */}
        {markers.map((m, i) => (
          <div
            key={i}
            className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-sm z-30 cursor-pointer hover:scale-150 transition-transform ${
              m.status === 'Faulty' ? 'bg-rose-500' :
              m.status === 'Normal' || m.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ left: `${m.pos}%`, top: '50%', marginTop: '-6px' }}
            onMouseEnter={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect()
              setTooltip({
                x: rect.left,
                text: m.assetId,
                date: m.date,
                issue: m.issue || '',
                age: m.ageAtEvent
              })
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* Today Indicator */}
        <div className="absolute right-0 w-0.5 h-3 bg-indigo-300 z-10 rounded" />
      </div>

      {tooltip && (
        <div
          className="fixed z-[200] bg-slate-900 text-white rounded-xl px-3.5 py-2.5 shadow-xl pointer-events-none text-sm leading-tight"
          style={{ left: tooltip.x - 60, top: 'auto', bottom: 'auto', transform: 'translateY(-100%) translateY(-8px)' }}
        >
          <div className="font-black text-base">{tooltip.text.toUpperCase()}</div>
          <div className="text-slate-400 mt-0.5">{tooltip.date} · age {tooltip.age}mo</div>
          {tooltip.issue && <div className="text-slate-300 mt-0.5">{tooltip.issue}</div>}
        </div>
      )}

      {installMs < startWindowMs && showLabels && (
        <div className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">
          Installed {installDate} (Pre-3Y)
        </div>
      )}
    </div>
  )
}
