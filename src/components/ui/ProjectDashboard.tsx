import React, { useMemo, useState } from 'react'
import { 
  X, Search, 
  ArrowUpRight, AlertCircle, 
  Download, Box, Layers,
  ClipboardList, Copy, Check
} from 'lucide-react'
import type { ACAsset, Room } from '../../types/bim'

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

  const systemData = useMemo(() => {
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

    return Object.values(groups)
      .filter(sys => {
        const matchesSearch = sys.id.toLowerCase().includes(searchQuery.toLowerCase()) || sys.roomName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || sys.aggregatedStatus === statusFilter;
        const matchesFloor = floorFilter === 'All' || sys.floor === floorFilter;
        return matchesSearch && matchesStatus && matchesFloor;
      })
      .sort((a, b) => {
        if (a.floor !== b.floor) return a.floor - b.floor;
        return a.id.localeCompare(b.id);
      });
  }, [assets, rooms, searchQuery, statusFilter, floorFilter]);

  const stats = useMemo(() => {
    const total = systemData.length;
    const faulty = systemData.filter(s => s.aggregatedStatus === 'Faulty').length;
    const healthy = total - faulty;
    return { total, faulty, health: total > 0 ? Math.round((healthy / total) * 100) : 100 };
  }, [systemData]);

  const getHistoryData = (sys: any) => {
    const allLogs = sys.components.flatMap((c: any) => (c.logs || []).map((l: any) => ({ ...l, assetId: c.id })));
    const uniqueLogs = Array.from(new Map(allLogs.map((l: any) => [l.id || `${l.date}-${l.issue}`, l])).values());
    const sortedLogs = uniqueLogs.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const headers = ['Date', 'Component', 'Status', 'Activity', 'Notes'];
    const rows = [
      [sys.installDate, 'System Master', 'Activated', 'Initial system deployment', `Project deployment to ${sys.roomName}`],
      ...sortedLogs.map((l: any) => [l.date, l.assetId || sys.id, l.status, l.issue, l.note || ''])
    ];
    return { headers, rows };
  };

  const exportToCSV = () => {
    const headers = ['Location', 'System Group', 'Floor', 'Status', 'Install Date', 'Components'];
    const rows = systemData.map(sys => [sys.roomName, sys.id, `Floor ${sys.floor}`, sys.aggregatedStatus, sys.installDate, sys.components.map((c: any) => c.id).join(' | ')]);
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
    const headers = ['Location', 'System Group', 'Floor', 'Status', 'Install Date', 'Components'];
    const rows = systemData.map(sys => [sys.roomName, sys.id, `Floor ${sys.floor}`, sys.aggregatedStatus, sys.installDate, sys.components.map((c: any) => c.id).join(' | ')]);
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

  return (
    <div className="fixed inset-[10px] bg-white z-[100] rounded-[12px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200">
      <header className="px-4 py-1.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h1 className="text-base font-black text-slate-800 tracking-tight">SYSTEM-CENTRIC ASSET MASTER</h1>
          <div className="h-4 w-px bg-slate-200 mx-2" />
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-tight">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> <span className="text-slate-400">Health:</span> <span className="text-slate-900">{stats.health}%</span></div>
            <div className="flex items-center gap-1.5"><Box className="w-4 h-4 text-indigo-500" /> <span className="text-slate-400">Systems:</span> <span className="text-slate-900">{stats.total}</span></div>
            <div className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-rose-500" /> <span className="text-slate-400">Alerts:</span> <span className="text-rose-600">{stats.faulty}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {copyFeedback && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500 text-white rounded text-[10px] font-black animate-in fade-in slide-in-from-right-2">
              <Check className="w-3 h-3" /> COPIED!
            </div>
          )}
          <button onClick={copyToClipboard} className="p-1.5 hover:bg-slate-200 rounded text-slate-400 transition-all active:scale-95" title="Copy to Clipboard"><Copy className="w-4 h-4" /></button>
          <button onClick={exportToCSV} className="p-1.5 hover:bg-slate-200 rounded text-slate-400 transition-all active:scale-95" title="Download CSV"><Download className="w-4 h-4" /></button>
          <button onClick={onClose} className="p-1.5 hover:bg-rose-500 hover:text-white rounded text-slate-400 transition-all"><X className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="px-4 py-1.5 bg-white border-b border-slate-100 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input 
            type="text" 
            placeholder="Search System, Room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1 bg-slate-50 border border-slate-100 rounded text-[12px] font-bold outline-none transition-all focus:bg-white focus:ring-1 focus:ring-indigo-500/20 shadow-inner"
          />
        </div>
        <div className="flex items-center gap-1">
          {['All', 'Normal', 'Maintenance', 'Faulty'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f as any)}
              className={`px-3 py-0.5 rounded text-[10px] font-black uppercase border transition-all ${statusFilter === f ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 shadow-sm">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-4 py-1.5 border-r border-slate-100">Location</th>
              <th className="px-4 py-1.5 border-r border-slate-100 w-40">System Group</th>
              <th className="px-4 py-1.5 border-r border-slate-100 w-32 text-center">System Health</th>
              <th className="px-4 py-1.5 border-r border-slate-100 w-[550px]">
                <div className="flex flex-col items-center">
                  <span className="text-slate-600 mb-1 font-black">Life Cycle Timeline (3 Years)</span>
                  <div className="flex justify-between w-full text-[8px] font-black text-slate-400 px-1 uppercase tracking-tighter">
                    <span>{new Date(new Date().getTime() - (3 * 365 * 24 * 60 * 60 * 1000)).toLocaleDateString()}</span>
                    <span className="text-indigo-500 italic">Today</span>
                  </div>
                </div>
              </th>
              <th className="px-2 py-1.5 border-r border-slate-100 w-10 text-center">Hist.</th>
              <th className="px-4 py-1.5 border-r border-slate-100">Functional Components</th>
              <th className="px-2 py-1.5 text-right w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {systemData.map((sys, index) => {
              const isFirstInRoom = index === 0 || systemData[index - 1].roomName !== sys.roomName;
              return (
                <tr key={sys.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50">
                  <td className="px-4 py-3 border-r border-slate-100 min-w-[140px]">
                    {isFirstInRoom ? (
                      <><div className="text-[13px] font-black text-slate-800 tracking-tight leading-tight">{sys.roomName}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">BIM LEVEL 0{sys.floor}</div></>
                    ) : (
                      <div className="w-full h-4 border-l-2 border-slate-50 ml-2" />
                    )}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <div className="flex items-center gap-2"><div className="p-1 bg-indigo-50 rounded text-indigo-600 border border-indigo-100"><Layers className="w-3.5 h-3.5" /></div><span className="text-[13px] font-black text-slate-900 uppercase">{sys.id}</span></div>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-slate-100">
                    <div className={`px-2 py-0.5 rounded-md border text-[11px] font-black uppercase tracking-tighter flex items-center justify-center gap-2 ${getStatusBg(sys.aggregatedStatus)}`}><div className={`w-2 h-2 rounded-full fill-current ${sys.aggregatedStatus === 'Faulty' ? 'animate-pulse' : ''} bg-current`} />{sys.aggregatedStatus}</div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <div className="relative w-full h-4 flex items-center">
                      <div className="absolute w-full h-1 bg-slate-100 rounded-full" />
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
                          return { ...log, pos };
                        }).filter((m: any) => m.pos >= 0);
                        return (
                          <>
                            <div className="absolute h-1 bg-indigo-100 rounded-full shadow-sm" style={{ left: `${Math.max(0, installOffset)}%`, width: `${activeWidth}%` }} />
                            {installMs >= startWindowMs && <div className="absolute w-2 h-2 bg-emerald-500 rotate-45 z-20 border border-white shadow-sm" style={{ left: `calc(${installOffset}% - 4px)`, top: '50%', marginTop: '-4px' }} title={`Install: ${sys.installDate}`} />}
                            {markers.map((m: any, i: number) => {
                               const mColor = m.status === 'Faulty' ? 'bg-rose-500' : (m.status === 'Normal' || m.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500');
                               return (
                                <div key={i} className={`absolute w-2.5 h-2.5 rounded-full border border-white shadow-sm z-30 ${mColor} cursor-help hover:scale-150 transition-transform`} style={{ left: `${m.pos}%` }} title={`Date: ${m.date}\nComp: ${m.assetId}\nIssue: ${m.issue}`} />
                               );
                            })}
                            <div className="absolute right-0 w-0.5 h-3 bg-indigo-300 z-10" title="Today" />
                            {installMs < startWindowMs && <div className="absolute -bottom-4 left-0 text-[7px] font-black text-slate-300 uppercase tracking-tighter">Installed {sys.installDate}</div>}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-2 py-3 border-r border-slate-100 text-center">
                    <button onClick={() => setHistorySystem(sys)} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-600 transition-all active:scale-95" title="Full History"><ClipboardList className="w-4 h-4" /></button>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-50/50 rounded-lg border border-slate-100 shadow-inner">
                      {sys.components.map((comp: any) => (
                        <div key={comp.id} onClick={() => onSelect(comp.id)} className="flex items-center gap-2 px-2.5 py-1 bg-white hover:bg-indigo-600 rounded border border-slate-200 transition-all cursor-pointer group/comp shadow-sm hover:scale-105 active:scale-95 group/btn" title={`${comp.id} [${comp.status}]\nLast: ${comp.logs?.[0]?.date || 'N/A'}`}>
                          <div className={`w-2 h-2 rounded-full ${getCompStatusColor(comp.status)} group-hover/btn:bg-white`} />
                          <span className="text-[10px] font-black text-slate-500 group-hover/btn:text-white uppercase tracking-tighter">{comp.id}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button onClick={() => { const primary = sys.components.find((c: any) => c.id.startsWith('fcu')) || sys.components[0]; if (primary) onSelect(primary.id); }} className="p-1.5 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-all shadow-sm border border-transparent hover:border-indigo-500"><ArrowUpRight className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-slate-200"><span className="text-indigo-600">SYS: {systemData.length}</span></div>
          <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-slate-200"><span className="text-slate-500">ASSETS: {assets.length}</span></div>
        </div>
        <div className="flex items-center gap-3"><span className="flex items-center gap-1 text-emerald-600 font-black tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> GRAPH_ALIGNED</span><span className="opacity-30">|</span><span className="tracking-widest">AR15-BIM-v3.2</span></div>
      </footer>

      {historySystem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 animate-in zoom-in-95 duration-200">
            <header className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg text-white"><ClipboardList className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">System Life Cycle History</h2>
                  <p className="text-lg font-black text-slate-800 uppercase tracking-tight">{historySystem.id} • {historySystem.roomName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {historyCopyFeedback && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500 text-white rounded text-[10px] font-black animate-in fade-in slide-in-from-right-2">
                    <Check className="w-3 h-3" /> COPIED!
                  </div>
                )}
                <button onClick={() => copyHistoryToClipboard(historySystem)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all active:scale-95" title="Copy History"><Copy className="w-5 h-5" /></button>
                <button onClick={() => exportHistoryToCSV(historySystem)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all active:scale-95" title="Download History CSV"><Download className="w-5 h-5" /></button>
                <button onClick={() => setHistorySystem(null)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"><X className="w-6 h-6" /></button>
              </div>
            </header>
            <div className="flex-1 overflow-auto p-0 custom-scrollbar bg-white">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-600" /><span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">System Setup & Deployment</span></div>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{historySystem.id}</span>
              </div>
              <table className="w-full text-left border-collapse mb-4">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-emerald-50/30">
                    <td className="px-4 py-2 border-r border-slate-100 w-32"><div className="flex items-center gap-1.5 whitespace-nowrap"><span className="text-[11px] font-black text-slate-700">{historySystem.installDate}</span><div className="w-2 h-2 bg-emerald-500 rotate-45 shrink-0 ml-auto" /></div></td>
                    <td className="px-4 py-2 border-r border-slate-100 w-32 text-[10px] font-black text-indigo-600 uppercase tracking-tighter">System Master</td>
                    <td className="px-4 py-2 border-r border-slate-100 w-36"><div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Deploy</div></td>
                    <td className="px-4 py-2 border-r border-slate-100 text-[11px] font-bold text-slate-600 italic">Initial system deployment to {historySystem.roomName}</td>
                    <td className="px-4 py-2 text-[10px] text-slate-400">Standard activation</td>
                  </tr>
                  {(() => {
                    const allLogs = historySystem.components.flatMap((c: any) => (c.logs || []).map((l: any) => ({ ...l, assetId: c.id })));
                    const uniqueLogs = Array.from(new Map(allLogs.map((l: any) => [l.id || `${l.date}-${l.issue}`, l])).values());
                    return uniqueLogs.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 border-r border-slate-100 text-[11px] font-bold text-slate-500">{log.date}</td>
                        <td className="px-4 py-2 border-r border-slate-100 text-[10px] font-black text-slate-600 uppercase">{log.assetId || historySystem.id}</td>
                        <td className="px-4 py-2 border-r border-slate-100">
                          <div className={`flex items-center justify-center gap-1.5 text-[10px] font-black uppercase whitespace-nowrap ${log.status === 'Completed' || log.status === 'Normal' ? 'text-emerald-600' : (log.status === 'Faulty' ? 'text-rose-600' : 'text-amber-600')}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'Completed' || log.status === 'Normal' ? 'bg-emerald-500' : (log.status === 'Faulty' ? 'bg-rose-500' : 'bg-amber-500')}`} />{log.status}
                          </div>
                        </td>
                        <td className="px-4 py-2 border-r border-slate-100 text-[11px] font-bold text-slate-700 leading-tight">{log.issue}</td>
                        <td className="px-4 py-2 text-[10px] text-slate-500 italic leading-tight">{log.note || '-'}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            <footer className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end"><button onClick={() => setHistorySystem(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-slate-800 transition-all">Close History</button></footer>
          </div>
        </div>
      )}
    </div>
  )
}
