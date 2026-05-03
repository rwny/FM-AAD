import React, { useMemo, useState } from 'react'
import { 
  X, Search, 
  ArrowUpRight, AlertCircle, 
  Download, Box, Layers,
  ClipboardList, Copy, Check, Calendar
} from 'lucide-react'
import type { ACAsset, Room } from '../../types/bim'
import { PlannedMaintenance } from './PlannedMaintenance'

interface ProjectDashboardProps {
  assets: ACAsset[];
  rooms: Room[];
  onSelect: (assetId: string) => void;
  onClose: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ 
  assets, rooms, onSelect, onClose 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Normal' | 'Maintenance' | 'Faulty'>('All')
  const [floorFilter] = useState<number | 'All'>('All')
  const [historySystem, setHistorySystem] = useState<any | null>(null)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [historyCopyFeedback, setHistoryCopyFeedback] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  const allSystems = useMemo(() => {
    const groups: { [key: string]: any } = {};

    assets.forEach(asset => {
      const parts = asset.id.split('-');
      let systemId = asset.id;
      if (parts.length >= 3) systemId = `AC-${parts[1]}-${parts[2]}`; 
      else if (parts.length === 2) systemId = `AC-${parts[1]}`; 
      
      const roomNum = asset.id.split('-')[1];
      const room = rooms.find(r => r.number === roomNum);
      const floor = room?.floor || parseInt(roomNum?.charAt(0) || '0');

      if (!groups[systemId]) {
        groups[systemId] = {
          id: systemId,
          floor,
          roomName: room?.name || `RM ${roomNum}`,
          brand: asset.brand,
          model: asset.model,
          installDate: asset.install || '2024-01-01',
          components: [],
          aggregatedStatus: 'Normal',
          lastService: asset.lastService || '',
          nextService: asset.nextService || ''
        };
      }
      groups[systemId].components.push(asset);
      if (asset.status === 'Faulty') groups[systemId].aggregatedStatus = 'Faulty';
      else if (asset.status === 'Maintenance' && groups[systemId].aggregatedStatus !== 'Faulty') groups[systemId].aggregatedStatus = 'Maintenance';
      if (asset.lastService && (!groups[systemId].lastService || asset.lastService > groups[systemId].lastService)) groups[systemId].lastService = asset.lastService;
    });

    return Object.values(groups);
  }, [assets, rooms]);

  const systemData = useMemo(() => {
    return allSystems
      .filter(sys => {
        const woNumbers = sys.components.flatMap((c: any) => (c.logs || []).map((l: any) => l.wo_number)).filter(Boolean)
        const matchesSearch = sys.id.toLowerCase().includes(searchQuery.toLowerCase()) 
          || sys.roomName.toLowerCase().includes(searchQuery.toLowerCase())
          || sys.brand?.toLowerCase().includes(searchQuery.toLowerCase())
          || sys.model?.toLowerCase().includes(searchQuery.toLowerCase())
          || woNumbers.some((wo: string) => wo.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'All' || sys.aggregatedStatus === statusFilter;
        const matchesFloor = floorFilter === 'All' || sys.floor === floorFilter;
        return matchesSearch && matchesStatus && matchesFloor;
      })
      .sort((a, b) => {
        if (a.floor !== b.floor) return a.floor - b.floor;
        return a.id.localeCompare(b.id);
      });
  }, [allSystems, searchQuery, statusFilter, floorFilter]);

  const stats = useMemo(() => {
    const total = allSystems.length;
    const faulty = allSystems.filter(s => s.aggregatedStatus === 'Faulty').length;
    const maintenance = allSystems.filter(s => s.aggregatedStatus === 'Maintenance').length;
    const normal = allSystems.filter(s => s.aggregatedStatus === 'Normal').length;
    const healthPercent = total > 0 ? Math.round((normal / total) * 100) : 100;
    return { total, faulty, maintenance, normal, health: healthPercent };
  }, [allSystems]);

  const getHistoryData = (sys: any) => {
    const allLogs = sys.components.flatMap((c: any) => (c.logs || []).map((l: any) => ({ ...l, assetId: c.id })));
    const uniqueLogs = Array.from(new Map(allLogs.map((l: any) => [l.id || `${l.date}-${l.issue}`, l])).values());
    const sortedLogs = uniqueLogs.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const headers = ['Date', 'Age (mo)', 'Component', 'Status', 'Activity', 'Notes'];
    const rows = [
      [sys.installDate, '0', 'System Master', 'Activated', 'Initial system deployment', `Project deployment to ${sys.roomName}`],
      ...sortedLogs.map((l: any) => {
        const installMs = new Date(sys.installDate).getTime();
        const logMs = new Date(l.date).getTime();
        const ageAtLog = Math.round(Math.max(0, (logMs - installMs) / (1000 * 60 * 60 * 24 * 30.4375)));
        return [l.date, ageAtLog.toString(), l.assetId || sys.id, l.status, l.issue, l.note || ''];
      })
    ];
    return { headers, rows };
  };

  const exportToCSV = () => {
    const headers = ['Location', 'System Group', 'Floor', 'Status', 'Install Date', 'Age', 'Components'];
    const rows = systemData.map(sys => [
      sys.roomName, 
      sys.id, 
      `Floor ${sys.floor}`, 
      sys.aggregatedStatus, 
      sys.installDate, 
      calculateAge(sys.installDate),
      sys.components.map((c: any) => c.id).join(' | ')
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `AR15_Asset_Master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    const headers = ['Location', 'System Group', 'Floor', 'Status', 'Install Date', 'Age', 'Components'];
    const rows = systemData.map(sys => [
      sys.roomName, 
      sys.id, 
      `Floor ${sys.floor}`, 
      sys.aggregatedStatus, 
      sys.installDate, 
      calculateAge(sys.installDate),
      sys.components.map((c: any) => c.id).join(' | ')
    ]);
    const textContent = [headers, ...rows].map(e => e.join("\t")).join("\n");
    navigator.clipboard.writeText(textContent).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const exportHistoryToCSV = (sys: any) => {
    const { headers, rows } = getHistoryData(sys);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `History_${sys.id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyHistoryToClipboard = (sys: any) => {
    const { headers, rows } = getHistoryData(sys);
    const textContent = [headers, ...rows].map(e => e.join("\t")).join("\n");
    navigator.clipboard.writeText(textContent).then(() => {
      setHistoryCopyFeedback(true);
      setTimeout(() => setHistoryCopyFeedback(false), 2000);
    });
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Normal': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Faulty': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Maintenance': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  }

  const getCompStatusColor = (status: string) => {
     switch (status) {
      case 'Normal': return 'bg-emerald-500';
      case 'Faulty': return 'bg-rose-500 animate-pulse';
      case 'Maintenance': return 'bg-amber-500';
      default: return 'bg-slate-300';
    }
  }

  const calculateAge = (installDate: string) => {
    if (!installDate || installDate === '---') return 0;
    const start = new Date(installDate);
    const now = new Date();
    
    // Calculate rounded total months
    const diffTime = now.getTime() - start.getTime();
    const totalMonths = diffTime / (1000 * 60 * 60 * 24 * 30.4375); // Average days in month
    
    return Math.round(totalMonths);
  };

  return (
    <div className="fixed inset-[10px] bg-white dark:bg-zinc-950 z-[100] rounded-[12px] shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200">
      <header className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-amber-800 dark:text-orange-500" />
            <h1 className="text-base font-black text-slate-800 dark:text-zinc-100 tracking-tight">SYSTEM-CENTRIC ASSET MASTER</h1>
          </div>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800" />
          
          {/* Interactive Summary Stats as Filters */}
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight">
            <button 
              onClick={() => setStatusFilter('All')}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all active:scale-95 ${statusFilter === 'All' ? 'bg-amber-800 text-white border-orange-600 shadow-md' : 'bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-700 hover:border-orange-400 dark:hover:border-orange-600'}`}
            >
              <Box className={`w-4 h-4 ${statusFilter === 'All' ? 'text-white' : 'text-orange-600'}`} /> 
              <span>Systems: <span className={statusFilter === 'All' ? 'text-white' : 'text-slate-900 dark:text-zinc-100'}>{stats.total}</span></span>
            </button>

            <button 
              onClick={() => setStatusFilter('Normal')}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all active:scale-95 ${statusFilter === 'Normal' ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' : 'bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-500'}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full ${statusFilter === 'Normal' ? 'bg-white' : 'bg-emerald-500'}`} /> 
              <span>Health: <span className={statusFilter === 'Normal' ? 'text-white' : 'text-slate-900 dark:text-zinc-100'}>{stats.health}%</span></span>
            </button>

            <button 
              onClick={() => setStatusFilter('Maintenance')}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all active:scale-95 ${statusFilter === 'Maintenance' ? 'bg-amber-600 text-white border-amber-500 shadow-md' : 'bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-500'}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full ${statusFilter === 'Maintenance' ? 'bg-white' : 'bg-amber-500'}`} />
              <span>Maintenance: <span className={statusFilter === 'Maintenance' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}>{stats.maintenance}</span></span>
            </button>

            <button 
              onClick={() => setStatusFilter('Faulty')}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all active:scale-95 ${statusFilter === 'Faulty' ? 'bg-rose-600 text-white border-rose-500 shadow-md' : 'bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-700 hover:border-rose-300 dark:hover:border-rose-500'}`}
            >
              <AlertCircle className={`w-4 h-4 ${statusFilter === 'Faulty' ? 'text-white' : 'text-rose-500'}`} /> 
              <span>Faulty: <span className={statusFilter === 'Faulty' ? 'text-white' : 'text-rose-600 dark:text-rose-400'}>{stats.faulty}</span></span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {copyFeedback && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500 text-white rounded text-[10px] font-black animate-in fade-in slide-in-from-right-2">
              <Check className="w-3 h-3" /> COPIED!
            </div>
          )}
          <button onClick={copyToClipboard} className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-400 transition-all active:scale-95" title="Copy to Clipboard"><Copy className="w-4 h-4" /></button>
          <button onClick={exportToCSV} className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-400 transition-all active:scale-95" title="Download CSV"><Download className="w-4 h-4" /></button>
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'calendar' : 'table')}
            className={`p-1.5 rounded transition-all active:scale-95 ${viewMode === 'calendar' ? 'bg-orange-200 dark:bg-orange-900/50 text-amber-800 dark:text-orange-500' : 'hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500'}`}
            title={viewMode === 'table' ? 'Calendar View' : 'Table View'}
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-rose-500 hover:text-white rounded text-slate-400 dark:text-zinc-500 transition-all"><X className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="px-4 py-1.5 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-zinc-700" />
          <input 
            type="text" 
            placeholder="Search System, Room, Brand, WO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded text-[12px] font-bold outline-none transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-1 focus:ring-orange-600/20 shadow-inner"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {viewMode === 'calendar' ? (
          <div className="p-4">
            <PlannedMaintenance assets={assets} onSelect={onSelect} />
          </div>
        ) : (
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-900 z-10 border-b border-slate-200 dark:border-zinc-800 shadow-sm">
            <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800">Location</th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-40">System Group</th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-32 text-center">System Health</th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-28 text-center">Last WO</th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-[550px]">
                <div className="flex flex-col items-center">
                  <span className="text-slate-600 dark:text-zinc-300 mb-1 font-black">Life Cycle Timeline (3 Years)</span>
                  <div className="flex justify-between w-full text-[8px] font-black text-slate-400 dark:text-zinc-500 px-1 uppercase tracking-tighter">
                    <span>{new Date(new Date().getTime() - (3 * 365 * 24 * 60 * 60 * 1000)).toLocaleDateString()}</span>
                    <span className="text-orange-600 dark:text-orange-500 italic">Today</span>
                  </div>
                </div>
              </th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-16 text-center uppercase tracking-tighter text-[9px] font-black text-slate-400 dark:text-zinc-500">AGE(mo)</th>
              <th className="px-2 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-10 text-center">Hist.</th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800">Functional Components</th>
              <th className="px-2 py-1.5 text-right w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
            {systemData.map((sys, index) => {
              const isFirstInRoom = index === 0 || systemData[index - 1].roomName !== sys.roomName;
              return (
                <tr key={sys.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors border-b border-slate-50 dark:border-zinc-900">
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-zinc-800 min-w-[140px]">
                    {isFirstInRoom ? (
                      <><div className="text-[13px] font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-tight">{sys.roomName}</div><div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-tighter leading-none">BIM LEVEL 0{sys.floor}</div></>
                    ) : (
                      <div className="w-full h-4 border-l-2 border-slate-50 dark:border-zinc-900 ml-2" />
                    )}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2"><div className="p-1 bg-orange-50 dark:bg-orange-900/30 rounded text-amber-800 dark:text-orange-500 border border-orange-200 dark:border-orange-600/30"><Layers className="w-3.5 h-3.5" /></div><span className="text-[13px] font-black text-slate-900 dark:text-zinc-100 uppercase">{sys.id}</span></div>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-zinc-800">
                    <div className={`px-2 py-0.5 rounded-md border text-[11px] font-black uppercase tracking-tighter flex items-center justify-center gap-2 ${getStatusBg(sys.aggregatedStatus)}`}><div className={`w-3 h-3 rounded-full fill-current ${sys.aggregatedStatus === 'Faulty' ? 'animate-pulse' : ''} bg-current`} />{sys.aggregatedStatus}</div>
                  </td>
                  <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-zinc-800">
                    {(() => {
                      const allLogs = sys.components.flatMap((c: any) => c.logs || [])
                      const latestWO = allLogs.find((l: any) => l.wo_number)?.wo_number
                      return latestWO ? (
                        <span className="text-[9px] font-mono font-bold text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-950/50 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-900/50">{latestWO}</span>
                      ) : <span className="text-[9px] text-slate-300 dark:text-zinc-700">-</span>
                    })()}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-zinc-800">
                    <div className="relative w-full h-4 flex items-center">
                      <div className="absolute w-full h-1 bg-slate-100 dark:bg-zinc-900 rounded-full" />
                      {(() => {
                        const TIMELINE_DAYS = 365 * 3;
                        const windowDuration = TIMELINE_DAYS * (24 * 60 * 60 * 1000);
                        const todayMs = new Date().getTime();
                        const startWindowMs = todayMs - windowDuration;
                        const installMs = new Date(sys.installDate).getTime();
                        const installOffset = ((installMs - startWindowMs) / windowDuration) * 100;
                        const activeWidth = 100 - Math.max(0, installOffset);
                        const markers = sys.components.flatMap((c: any) => (c.logs || []).map((log: any) => ({ ...log, assetId: c.id }))).map((log: any) => {
                          const logDate = new Date(log.date).getTime();
                          const pos = ((logDate - startWindowMs) / windowDuration) * 100;
                          
                          // Calculate age at the time of this log
                          const ageAtLog = Math.round(Math.max(0, (logDate - installMs) / (1000 * 60 * 60 * 24 * 30.4375)));
                          
                          return { ...log, pos, ageAtLog };
                        }).filter((m: any) => m.pos >= 0);
                        return (
                          <>
                            <div className="absolute h-1 bg-zinc-200 dark:bg-white rounded-full shadow-sm" style={{ left: `${Math.max(0, installOffset)}%`, width: `${activeWidth}%` }} />

                            {installMs >= startWindowMs && <div className="absolute w-2 h-2 bg-emerald-500 rotate-45 z-20 border border-white dark:border-zinc-800 shadow-sm" style={{ left: `calc(${installOffset}% - 4px)`, top: '50%', marginTop: '-4px' }} title={`Install: ${sys.installDate}`} />}
                            {markers.map((m: any, i: number) => {
                               const mColor = m.status === 'Faulty' ? 'bg-rose-500' : (m.status === 'Normal' || m.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500');
                               return (
                                <div key={i} className={`absolute w-3.5 h-3.5 rounded-full border border-white dark:border-zinc-800 shadow-sm z-30 ${mColor} cursor-help hover:scale-150 transition-transform`} style={{ left: `${m.pos}%` }} title={`Date: ${m.date}\nAge: ${m.ageAtLog} mo\nComp: ${m.assetId}\nIssue: ${m.issue}`} />
                               );
                            })}
                            <div className="absolute right-0 w-0.5 h-3 bg-orange-400 dark:bg-orange-600 z-10" title="Today" />
                            {installMs < startWindowMs && <div className="absolute -bottom-4 left-0 text-[7px] font-black text-slate-300 dark:text-zinc-600 uppercase tracking-tighter">Installed {sys.installDate}</div>}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-zinc-800 text-center">
                    {(() => {
                      const totalMonths = calculateAge(sys.installDate);
                      const years = Math.floor(totalMonths / 12);
                      const months = totalMonths % 12;
                      const yymm = years > 0 ? `${years}y${months}m` : `${months}m`;
                      return (
                        <div 
                          className="text-[11px] font-black text-slate-700 dark:text-zinc-300 whitespace-nowrap bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-800 cursor-help"
                          title={`Precise Age: ${yymm}`}
                        >
                          {totalMonths}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-2 py-3 border-r border-slate-100 dark:border-zinc-800 text-center">
                    <button onClick={() => setHistorySystem(sys)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md text-slate-400 dark:text-zinc-500 hover:text-amber-800 dark:hover:text-orange-500 transition-all active:scale-95" title="Full History"><ClipboardList className="w-4 h-4" /></button>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-zinc-800">
                    <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 shadow-inner">
                      {sys.components.map((comp: any) => (
                        <div 
                          key={comp.id} 
                          onClick={() => setHistorySystem({ ...sys, id: comp.id, components: [comp] })} 
                          className="flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-zinc-800 hover:bg-amber-800 dark:hover:bg-amber-800 rounded border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer group/comp shadow-sm hover:scale-105 active:scale-95 group/btn" 
                          title={`View History for ${comp.id}\nStatus: ${comp.status}\nLast: ${comp.logs?.[0]?.date || 'N/A'}`}
                        >
                          <div className={`w-3 h-3 rounded-full ${getCompStatusColor(comp.status)} group-hover/btn:bg-white`} />
                          <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400 group-hover/btn:text-white uppercase tracking-tighter">{comp.id}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button 
                      onClick={() => { 
                        const primary = sys.components.find((c: any) => c.id.startsWith('fcu')) || sys.components[0]; 
                        if (primary) onSelect(primary.id); 
                      }} 
                      className="p-1.5 hover:bg-amber-800 dark:hover:bg-amber-800 hover:text-white text-amber-800 dark:text-orange-500 rounded-lg transition-all shadow-sm border border-transparent hover:border-orange-600"
                      title="Locate in 3D Model"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      <footer className="px-4 py-2 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700"><span className="text-amber-800 dark:text-orange-500">SYS: {systemData.length}</span></div>
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700"><span className="text-slate-500 dark:text-zinc-400">ASSETS: {assets.length}</span></div>
        </div>
        <div className="flex items-center gap-3"><span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black tracking-widest"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> GRAPH_ALIGNED</span><span className="opacity-30">|</span><span className="tracking-widest">AR15-BIM-v0.3.29</span></div>
      </footer>

      {historySystem && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <header className="px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-800 dark:bg-amber-800 rounded-lg text-white"><ClipboardList className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] leading-tight">System Life Cycle History</h2>
                  <p className="text-lg font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tight">{historySystem.id} â€¢ {historySystem.roomName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {historyCopyFeedback && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500 text-white rounded text-[10px] font-black animate-in fade-in slide-in-from-right-2">
                    <Check className="w-3 h-3" /> COPIED!
                  </div>
                )}
                <button onClick={() => copyHistoryToClipboard(historySystem)} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-amber-800 dark:hover:text-orange-500 transition-all active:scale-95" title="Copy History"><Copy className="w-5 h-5" /></button>
                <button onClick={() => exportHistoryToCSV(historySystem)} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-amber-800 dark:hover:text-orange-500 transition-all active:scale-95" title="Download History CSV"><Download className="w-5 h-5" /></button>
                <button onClick={() => setHistorySystem(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
              </div>
            </header>
            <div className="flex-1 overflow-auto p-0 custom-scrollbar bg-white dark:bg-zinc-950">
              <div className="bg-slate-50 dark:bg-zinc-900 px-4 py-2 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-amber-800 dark:text-orange-500" /><span className="text-[11px] font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">System Setup & Deployment</span></div>
                <span className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-tighter">{historySystem.id}</span>
              </div>
              <table className="w-full text-left border-collapse mb-4">
                <thead className="sticky top-0 bg-slate-100 dark:bg-zinc-800 z-10 border-b border-slate-200 dark:border-zinc-700">
                  <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    <th className="px-4 py-2 border-r border-slate-200 dark:border-zinc-700 w-32">Date</th>
                    <th className="px-4 py-2 border-r border-slate-200 dark:border-zinc-700 w-24 text-center">Age (mo)</th>
                    <th className="px-4 py-2 border-r border-slate-200 dark:border-zinc-700 w-32">Component</th>
                    <th className="px-4 py-2 border-r border-slate-200 dark:border-zinc-700 w-32 text-center">Status</th>
                    <th className="px-4 py-2 border-r border-slate-200 dark:border-zinc-700">Activity</th>
                    <th className="px-4 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {(() => {
                    const { rows } = getHistoryData(historySystem);
                    return rows.map((row: any, idx: number) => (
                      <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors ${idx === 0 ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''}`}>
                        <td className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 text-[11px] font-bold text-slate-500 dark:text-zinc-400">{row[0]}</td>
                        <td className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 text-center text-[11px] font-black text-slate-700 dark:text-zinc-200 bg-slate-50/50 dark:bg-zinc-900/50">{row[1]}</td>
                        <td className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 text-[10px] font-black text-slate-600 dark:text-zinc-300 uppercase">{row[2]}</td>
                        <td className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800">
                          <div className={`flex items-center justify-center gap-1.5 text-[10px] font-black uppercase whitespace-nowrap ${row[3] === 'Completed' || row[3] === 'Normal' || row[3] === 'Activated' ? 'text-emerald-600 dark:text-emerald-400' : (row[3] === 'Faulty' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400')}`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${row[3] === 'Completed' || row[3] === 'Normal' || row[3] === 'Activated' ? 'bg-emerald-500' : (row[3] === 'Faulty' ? 'bg-rose-500' : 'bg-amber-500')}`} />{row[3]}
                          </div>
                        </td>
                        <td className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 text-[11px] font-bold text-slate-700 dark:text-zinc-200 leading-tight">{row[4]}</td>
                        <td className="px-4 py-2 text-[10px] text-slate-500 dark:text-zinc-400 italic leading-tight">{row[5] || '-'}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            <footer className="px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex justify-end"><button onClick={() => setHistorySystem(null)} className="px-6 py-2 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all">Close History</button></footer>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDashboard;





