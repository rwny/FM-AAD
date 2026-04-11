import React from 'react'

interface SystemTimelineProps {
  installDate: string;
  components: any[];
  width?: string;
  showLabels?: boolean;
}

export const SystemTimeline: React.FC<SystemTimelineProps> = ({ 
  installDate, components, width = '100%', showLabels = true 
}) => {
  const TIMELINE_DAYS = 365 * 3;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const windowDuration = TIMELINE_DAYS * MS_PER_DAY;
  const todayMs = new Date().getTime();
  const startWindowMs = todayMs - windowDuration;
  const installMs = new Date(installDate).getTime();
  
  const installOffset = ((installMs - startWindowMs) / windowDuration) * 100;
  const activeWidth = 100 - Math.max(0, installOffset);

  const markers = components.flatMap(c => (c.logs || []).map((log: any) => ({ ...log, assetId: c.id })))
    .map(log => {
      const logDate = new Date(log.date).getTime();
      const pos = ((logDate - startWindowMs) / windowDuration) * 100;
      return { ...log, pos };
    }).filter(m => m.pos >= 0);

  return (
    <div className="flex flex-col w-full gap-1">
      {showLabels && (
        <div className="flex justify-between w-full text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">
          <span>{new Date(startWindowMs).toLocaleDateString()}</span>
          <span className="text-indigo-500 italic">Today</span>
        </div>
      )}
      
      <div className="relative h-4 flex items-center" style={{ width }}>
        {/* Base Track */}
        <div className="absolute w-full h-1 bg-slate-100 rounded-full" />
        
        {/* Active Age Line */}
        <div 
          className="absolute h-1 bg-indigo-100 rounded-full shadow-sm" 
          style={{ 
            left: `${Math.max(0, installOffset)}%`, 
            width: `${activeWidth}%` 
          }} 
        />
        
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
            className={`absolute w-2.5 h-2.5 rounded-full border border-white shadow-sm z-30 ${
              m.status === 'Faulty' ? 'bg-rose-500' : 
              m.status === 'Normal' || m.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'
            } cursor-help hover:scale-150 transition-transform`} 
            style={{ left: `${m.pos}%` }} 
            title={`Date: ${m.date}\nComp: ${m.assetId}\nIssue: ${m.issue}`} 
          />
        ))}
        
        {/* Today Indicator */}
        <div className="absolute right-0 w-0.5 h-3 bg-indigo-300 z-10" />
      </div>
      
      {installMs < startWindowMs && showLabels && (
        <div className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">
          Installed {installDate} (Pre-3Y)
        </div>
      )}
    </div>
  );
}
