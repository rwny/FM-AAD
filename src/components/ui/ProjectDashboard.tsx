import React, { useMemo, useState } from 'react'
import { 
  X, Search, 
  Box, Layers, Home,
  ClipboardList, Copy, Check, Calendar, ListTodo, Download, CalendarCheck, AirVent
} from 'lucide-react'
import type { ACAsset, Room } from '../../types/bim'
import { PlannedMaintenance } from './PlannedMaintenance'
import * as XLSX from 'xlsx'

interface ProjectDashboardProps {
  assets: ACAsset[];
  rooms: Room[];
  onSelect: (assetId: string) => void;
  onSelectLog: (log: any) => void;
  onClose: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ 
  assets, rooms, onSelect, onSelectLog, onClose 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Normal' | 'Maintenance' | 'Faulty'>('All')
  const [floorFilter] = useState<number | 'All'>('All')
  const [historySystem, setHistorySystem] = useState<any | null>(null)
  const [historyCopyFeedback, setHistoryCopyFeedback] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'wo' | 'appt'>('table')

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (historySystem) setHistorySystem(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, historySystem])

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
          || (sys.components[0]?.capacity || '').toLowerCase().includes(searchQuery.toLowerCase())
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

  const woList = useMemo(() => {
    const wos: any[] = []
    allSystems.forEach(sys => {
      const allLogs = sys.components.flatMap((c: any) => (c.logs || []).filter((l: any) => l.wo_number))
      allLogs.forEach((log: any) => {
        wos.push({
          wo_number: log.wo_number,
          date: log.date,
          issue: log.issue,
          status: log.status,
          system: sys.id,
          room: sys.roomName,
          floor: sys.floor,
          log: log,
        })
      })
    })
    wos.sort((a, b) => b.wo_number.localeCompare(a.wo_number))
    return wos
  }, [allSystems])

  const systemPrimaryAsset = useMemo(() => {
    const map: Record<string, string> = {}
    allSystems.forEach(sys => {
      const primary = sys.components.find((c: any) => c.id.startsWith('fcu')) || sys.components[0]
      if (primary) map[sys.id] = primary.id
    })
    return map
  }, [allSystems])

  const filteredWOList = useMemo(() => {
    if (!searchQuery) return woList
    const q = searchQuery.toLowerCase()
    return woList.filter(w =>
      w.wo_number.toLowerCase().includes(q) ||
      w.system.toLowerCase().includes(q) ||
      w.room.toLowerCase().includes(q) ||
      w.issue.toLowerCase().includes(q)
    )
  }, [woList, searchQuery])

  const apptList = useMemo(() => {
    const appts: any[] = []
    allSystems.forEach(sys => {
      const allLogs = sys.components.flatMap((c: any) => (c.logs || []).filter((l: any) => l.appointment_date))
      allLogs.forEach((log: any) => {
        appts.push({
          appointment_date: log.appointment_date,
          date: log.date,
          issue: log.issue,
          status: log.status,
          reporter: log.reporter,
          contractor: log.contractor,
          system: sys.id,
          room: sys.roomName,
          floor: sys.floor,
          log: log,
        })
      })
    })
    appts.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
    return appts
  }, [allSystems])

  const filteredApptList = useMemo(() => {
    if (!searchQuery) return apptList
    const q = searchQuery.toLowerCase()
    return apptList.filter(a =>
      a.system.toLowerCase().includes(q) ||
      a.room.toLowerCase().includes(q) ||
      a.issue.toLowerCase().includes(q) ||
      a.contractor?.toLowerCase().includes(q) ||
      a.reporter?.toLowerCase().includes(q)
    )
  }, [apptList, searchQuery])

  const hoverSummaries = useMemo(() => {
    const brand: Record<string, number> = {}
    const btu: Record<string, number> = {}
    const age: Record<string, number> = {}
    allSystems.forEach(sys => {
      const b = sys.brand || '-'
      brand[b] = (brand[b] || 0) + 1
      const c = (sys.components[0]?.capacity || '-').replace(/[^0-9]/g, '') || '-'
      btu[c] = (btu[c] || 0) + 1
      const a = (() => {
        const install = sys.installDate
        if (!install || install === '---') return 0
        return Math.round((Date.now() - new Date(install).getTime()) / (1000 * 60 * 60 * 24 * 30.4375))
      })()
      const aLabel = a >= 60 ? `${Math.floor(a/12)}y+` : a >= 36 ? `3-5y` : a >= 24 ? `2-3y` : a >= 12 ? `1-2y` : `<1y`
      age[aLabel] = (age[aLabel] || 0) + 1
    })
    const top = (obj: Record<string, number>) => Object.entries(obj).sort((a,b) => b[1]-a[1]).slice(0,10).map(([k,v]) => `${k}: ${v}`).join('\n')
    return { brand: top(brand), btu: top(btu), age: top(age) }
  }, [allSystems])

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

  const buildViewData = () => {
    if (viewMode === 'wo') {
      const headers = ['WO Number', 'Date', 'Status', 'System', 'Floor', 'Location', 'Issue']
      const rows = woList.map(w => [w.wo_number, w.date, w.status, w.system, `Floor ${w.floor}`, w.room, w.issue])
      return [headers, ...rows]
    }
    if (viewMode === 'appt') {
      const headers = ['Appointment Date', 'Status', 'System', 'Floor', 'Location', 'Issue', 'Contractor', 'Reporter']
      const rows = apptList.map(a => [a.appointment_date, a.status, a.system, `Floor ${a.floor}`, a.room, a.issue, a.contractor || '', a.reporter || ''])
      return [headers, ...rows]
    }
    const headers = [
      'Location', 'System Group', 'Floor',
      'Brand', 'Model', 'Capacity',
      'System Status', 'Install Date', 'Age (mo)',
      'Last Service', 'Next Service',
      'Total Logs', 'Latest WO',
      'FCU (Status)', 'CDU (Status)'
    ]
    const rows = systemData.map(sys => {
      const fcu = sys.components.filter((c: any) => c.id.toLowerCase().startsWith('fcu'))
      const cdu = sys.components.filter((c: any) => c.id.toLowerCase().startsWith('cdu'))
      const fcuIds = fcu.map((c: any) => `${c.id} [${c.status}]`).join(' | ') || '-'
      const cduIds = cdu.map((c: any) => `${c.id} [${c.status}]`).join(' | ') || '-'
      const allLogs = sys.components.flatMap((c: any) => c.logs || [])
      const latestWO = allLogs.find((l: any) => l.wo_number)?.wo_number || '-'
      return [
        sys.roomName, sys.id, `Floor ${sys.floor}`,
        sys.brand || '-', sys.model || '-', sys.components[0]?.capacity || '-',
        sys.aggregatedStatus, sys.installDate, calculateAge(sys.installDate),
        sys.lastService || '-', sys.nextService || '-',
        allLogs.length, latestWO, fcuIds, cduIds,
      ]
    })
    return [headers, ...rows]
  }

  const exportToXLSX = () => {
    const data = buildViewData()
    const ws = XLSX.utils.aoa_to_sheet(data)
    if (viewMode === 'wo') {
      ws['!cols'] = [
        { wch: 16 }, { wch: 12 }, { wch: 12 },
        { wch: 14 }, { wch: 8 }, { wch: 24 }, { wch: 50 },
      ]
    } else if (viewMode === 'appt') {
      ws['!cols'] = [
        { wch: 14 }, { wch: 10 }, { wch: 14 },
        { wch: 8 }, { wch: 24 }, { wch: 40 },
        { wch: 20 }, { wch: 16 },
      ]
    } else {
      ws['!cols'] = [
        { wch: 20 }, { wch: 14 }, { wch: 8 },
        { wch: 14 }, { wch: 14 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 8 },
        { wch: 12 }, { wch: 12 },
        { wch: 10 }, { wch: 14 },
        { wch: 26 }, { wch: 26 },
      ]
    }
    const wb = XLSX.utils.book_new()
    const label = viewMode === 'wo' ? 'WO_List' : viewMode === 'appt' ? 'Appointments' : viewMode === 'calendar' ? 'Service_Calendar' : 'Asset_Master'
    XLSX.utils.book_append_sheet(wb, ws, label)
    XLSX.writeFile(wb, `AR15_${label.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

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
    <div className="fixed inset-0 bg-white dark:bg-zinc-950 z-[100] shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200">
      <header className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
        {/* Top Row: Title + Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-800 dark:text-orange-500" />
              <h1 className="text-base font-black text-slate-800 dark:text-zinc-100 tracking-tight uppercase">{viewMode === 'wo' ? 'Work Orders' : viewMode === 'appt' ? 'Appointments' : viewMode === 'calendar' ? 'Service Calendar' : 'Asset Master'}</h1>
            </div>
            <div className="max-w-[320px] relative ml-4">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 dark:text-zinc-700" />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded text-[11px] font-bold outline-none transition-all focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-amber-500/30 shadow-inner text-amber-900 dark:text-amber-200 placeholder:text-amber-400 dark:placeholder:text-amber-700"
              />
            </div>

            {/* Appointment Timeline — visible when appt view active */}
            <div className="flex-1 flex items-center">
              <div className="relative w-full h-10 flex items-center">
                <div className="absolute w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full" />
                {(() => {
                  const now = new Date()
                  const DAY_MS = 86400000
                  const startMs = now.getTime() - 30 * DAY_MS
                  const endMs = now.getTime() + 30 * DAY_MS
                  const range = endMs - startMs
                  const todayPos = ((now.getTime() - startMs) / range) * 100
                  return (
                    <>
                      <div className="absolute h-2 bg-amber-400 dark:bg-amber-500 rounded-full" style={{ left: 0, width: `${todayPos}%`, opacity: 0.4 }} />
                      <div className="absolute h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full" style={{ left: `${todayPos}%`, width: `${100 - todayPos}%`, opacity: 0.4 }} />
                      <div className="absolute w-0.5 h-6 bg-orange-500 z-20" style={{ left: `${todayPos}%` }} />
                      <span className="absolute text-[8px] font-black text-orange-500 uppercase -top-1" style={{ left: `${todayPos}%`, transform: 'translateX(-50%)' }}>Now</span>
                      {filteredApptList.map((a: any, i: number) => {
                        const apptMs = new Date(a.appointment_date).getTime()
                        const pos = ((apptMs - startMs) / range) * 100
                        if (pos < 0 || pos > 100) return null
                        const isOverdue = apptMs < now.getTime()
                        return (
                          <div key={i} className="absolute group z-10" style={{ left: `${pos}%`, top: '50%', marginTop: '-6px' }}>
                            <div className={`w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-800 shadow-md cursor-pointer hover:scale-150 transition-transform ${isOverdue ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-[60] hidden group-hover:block">
                              <div className="bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-[9px] font-bold rounded-lg px-2.5 py-1.5 shadow-xl border border-slate-200 dark:border-zinc-700 whitespace-nowrap leading-relaxed">
                                {a.system}<br/>{a.appointment_date}<br/>{a.issue}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-rose-500 hover:text-white rounded text-slate-400 dark:text-zinc-500 transition-all"><X className="w-5 h-5" /></button>
        </div>

        {/* Bottom Row: Function Buttons + Stats (expandable under Home) */}
        <div className="flex items-center gap-2 mt-1.5 relative">
          <button
            onClick={() => { setViewMode('table'); setStatusFilter('All') }}
            className={`p-1.5 rounded transition-all active:scale-95 ${viewMode === 'table' ? 'bg-orange-200 dark:bg-orange-900/50 text-amber-800 dark:text-orange-500' : 'hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500'}`}
            title="Home"
          >
            <Home className="w-4 h-4" />
          </button>

          {/* Stats sub-buttons — always visible */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight">
            <button onClick={() => { setViewMode('table'); setStatusFilter('All') }} className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap w-14 ${statusFilter === 'All' ? 'bg-amber-800 text-white border-orange-600' : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700 hover:border-orange-400'}`}>
              <Box className="w-3.5 h-3.5" /> {stats.total}
            </button>
            <button onClick={() => { setViewMode('table'); setStatusFilter('Normal') }} className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap w-14 ${statusFilter === 'Normal' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700 hover:border-emerald-300'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${statusFilter === 'Normal' ? 'bg-white' : 'bg-emerald-500'}`} /> {stats.health}%
            </button>
            <button onClick={() => { setViewMode('table'); setStatusFilter('Maintenance') }} className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap w-14 ${statusFilter === 'Maintenance' ? 'bg-amber-600 text-white border-amber-500' : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700 hover:border-amber-300'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${statusFilter === 'Maintenance' ? 'bg-white' : 'bg-amber-500'}`} /> {stats.maintenance}
            </button>
            <button onClick={() => { setViewMode('table'); setStatusFilter('Faulty') }} className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap w-14 ${statusFilter === 'Faulty' ? 'bg-rose-600 text-white border-rose-500' : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700 hover:border-rose-300'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${statusFilter === 'Faulty' ? 'bg-white' : 'bg-rose-500'}`} /> {stats.faulty}
            </button>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'wo' ? 'table' : 'wo')}
            className={`p-1.5 rounded transition-all active:scale-95 ${viewMode === 'wo' ? 'bg-orange-200 dark:bg-orange-900/50 text-amber-800 dark:text-orange-500' : 'hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500'}`}
            title="WO List"
          >
            <ListTodo className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'appt' ? 'table' : 'appt')}
            className={`p-1.5 rounded transition-all active:scale-95 ${viewMode === 'appt' ? 'bg-emerald-200 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500'}`}
            title="Appointments"
          >
            <CalendarCheck className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'table' : 'calendar')}
            className={`p-1.5 rounded transition-all active:scale-95 ${viewMode === 'calendar' ? 'bg-orange-200 dark:bg-orange-900/50 text-amber-800 dark:text-orange-500' : 'hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500'}`}
            title="Service Calendar"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button onClick={exportToXLSX} className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-400 dark:text-zinc-500 transition-all active:scale-95" title="Download Excel"><Download className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {viewMode === 'calendar' ? (
          <div className="p-4">
            <PlannedMaintenance assets={assets} onSelect={onSelect} />
          </div>
        ) : viewMode === 'appt' ? (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-900 z-10 border-b border-slate-200 dark:border-zinc-800 shadow-sm">
              <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                <th className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 w-28">Appointment</th>
                <th className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 w-32">WO</th>
                <th className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 w-14 text-center">Status</th>
                <th className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 w-36">System</th>
                <th className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800">Location</th>
                <th className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800">Issue / Task</th>
                <th className="px-4 py-2">Contractor / Reporter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
              {filteredApptList.map((a: any, idx: number) => {
                const isOverdue = a.appointment_date < new Date().toISOString().split('T')[0]
                const isToday = a.appointment_date === new Date().toISOString().split('T')[0]
                return (
                <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                  <td className="px-4 py-2.5 border-r border-slate-100 dark:border-zinc-800">
                    <span className={`text-[11px] font-black ${isOverdue ? 'text-rose-600' : isToday ? 'text-emerald-600' : 'text-slate-700 dark:text-zinc-200'}`}>{a.appointment_date}</span>
                    {isOverdue && <span className="text-[11px] font-black text-rose-400 ml-1">OVERDUE</span>}
                    {isToday && <span className="text-[11px] font-black text-emerald-500 ml-1">TODAY</span>}
                  </td>
                  <td className="px-4 py-2.5 border-r border-slate-100 dark:border-zinc-800">
                    {a.log?.wo_number ? (
                      <span onClick={() => onSelectLog(a.log)} className={`text-[11px] font-mono font-black text-slate-800 dark:text-zinc-100 px-2 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity ${a.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-800/50' : a.status === 'Faulty' ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-800/50' : 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800/50'}`}>{a.log.wo_number}</span>
                    ) : <span className="text-[11px] font-bold text-slate-300 dark:text-zinc-700">-</span>}
                  </td>
                  <td className="px-4 py-2.5 border-r border-slate-100 dark:border-zinc-800 text-center">
                    <AirVent className={`w-5 h-5 stroke-[2.5] mx-auto ${
                      a.status === 'Completed' ? 'text-emerald-500' :
                      a.status === 'Faulty' ? 'text-rose-500' : 'text-amber-500'
                    }`} />
                  </td>
                  <td className="px-4 py-2.5 border-r border-slate-100 dark:border-zinc-800 text-[11px] font-black text-slate-700 dark:text-zinc-200 uppercase">
                    <div className="flex items-center gap-1.5">
                      {a.system}
                      <button
                        onClick={() => { const aid = systemPrimaryAsset[a.system]; if (aid) onSelect(aid) }}
                        className="p-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded text-orange-500 dark:text-orange-400 hover:text-amber-800 dark:hover:text-orange-300 transition-colors"
                        title="Locate in 3D Model"
                      >
                        <Box className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 border-r border-slate-100 dark:border-zinc-800 text-[11px] font-bold text-slate-500 dark:text-zinc-400">F{a.floor} · {a.room}</td>
                  <td className="px-4 py-2.5 border-r border-slate-100 dark:border-zinc-800 text-[11px] font-bold text-slate-700 dark:text-zinc-200">{a.issue}</td>
                  <td className="px-4 py-2.5 text-[11px] font-bold text-slate-500 dark:text-zinc-400">{a.contractor || a.reporter || '-'}</td>
                </tr>
              )})}
              {filteredApptList.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center text-slate-300 dark:text-zinc-700 text-[11px] font-black uppercase">No appointments scheduled</td></tr>
              )}
            </tbody>
          </table>
        ) : viewMode === 'wo' ? (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-900 z-10 border-b border-slate-200 dark:border-zinc-800 shadow-sm">
              <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                <th className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 w-36">WO Number</th>
                <th className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 w-14 text-center">Status</th>
                <th className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 w-40">System</th>
                <th className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 w-28">Date</th>
                <th className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800">Location</th>
                <th className="px-4 py-2">Issue / Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
              {filteredWOList.map((wo: any, idx: number) => (
                <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                  <td className="px-4 py-2.5 border-r border-slate-100 dark:border-zinc-800">
                    <span onClick={() => onSelectLog(wo.log)} className={`text-[11px] font-mono font-black text-slate-800 dark:text-zinc-100 px-2 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity ${wo.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-800/50' : wo.status === 'Faulty' ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-800/50' : 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800/50'}`}>{wo.wo_number}</span>
                  </td>
                  <td className="px-4 py-2.5 border-r border-slate-100 dark:border-zinc-800 text-center">
                    <AirVent className={`w-5 h-5 stroke-[2.5] mx-auto ${
                      wo.status === 'Completed' ? 'text-emerald-500' :
                      wo.status === 'Faulty' ? 'text-rose-500' : 'text-amber-500'
                    }`} />
                  </td>
                  <td className="px-4 py-2.5 border-r border-slate-100 dark:border-zinc-800 text-[11px] font-black text-slate-700 dark:text-zinc-200 uppercase">
                    <div className="flex items-center gap-1.5">
                      {wo.system}
                      <button
                        onClick={() => { const aid = systemPrimaryAsset[wo.system]; if (aid) onSelect(aid) }}
                        className="p-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded text-orange-500 dark:text-orange-400 hover:text-amber-800 dark:hover:text-orange-300 transition-colors"
                        title="Locate in 3D Model"
                      >
                        <Box className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 border-r border-slate-100 dark:border-zinc-800 text-[11px] font-bold text-slate-500 dark:text-zinc-400">{wo.date}</td>
                  <td className="px-4 py-2.5 border-r border-slate-100 dark:border-zinc-800 text-[11px] font-bold text-slate-600 dark:text-zinc-300">F{wo.floor} • {wo.room}</td>
                  <td className="px-4 py-2.5 text-[11px] font-bold text-slate-700 dark:text-zinc-200 leading-tight">{wo.issue}</td>
                </tr>
              ))}
              {filteredWOList.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center text-slate-300 dark:text-zinc-700 text-[11px] font-black uppercase">No work orders found</td></tr>
              )}
            </tbody>
          </table>
        ) : (
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-900 z-10 border-b border-slate-200 dark:border-zinc-800 shadow-sm">
            <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-[140px]">Location</th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-32">System Group</th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-20 group relative cursor-default">
                Brand
                <div className="absolute top-full left-0 mt-1 z-50 hidden group-hover:block min-w-[160px]">
                  <div className="bg-slate-700 dark:bg-zinc-200 text-white dark:text-zinc-800 text-[10px] font-bold rounded-lg px-3 py-2 shadow-xl whitespace-pre leading-relaxed">{hoverSummaries.brand}</div>
                </div>
              </th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-24 text-center group relative cursor-default">
                BTU
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 hidden group-hover:block min-w-[160px]">
                  <div className="bg-slate-700 dark:bg-zinc-200 text-white dark:text-zinc-800 text-[10px] font-bold rounded-lg px-3 py-2 shadow-xl whitespace-pre leading-relaxed">{hoverSummaries.btu}</div>
                </div>
              </th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-14 text-center">Health</th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-32 text-center">WO</th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-[380px]">
                Life Cycle
              </th>
              <th className="px-4 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-14 text-center group relative cursor-default">
                AGE
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 hidden group-hover:block min-w-[120px]">
                  <div className="bg-slate-700 dark:bg-zinc-200 text-white dark:text-zinc-800 text-[10px] font-bold rounded-lg px-3 py-2 shadow-xl whitespace-pre leading-relaxed">{hoverSummaries.age}</div>
                </div>
              </th>
              <th className="px-2 py-1.5 border-r border-slate-100 dark:border-zinc-800 w-8 text-center">H</th>
              <th className="px-4 py-2 border-r border-slate-100 dark:border-zinc-800 w-[260px]">Components</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
            {systemData.map((sys, index) => {
              const isFirstInRoom = index === 0 || systemData[index - 1].roomName !== sys.roomName;
              return (
                <tr key={sys.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors border-b border-slate-50 dark:border-zinc-900">
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-zinc-800 min-w-[140px]">
                    {isFirstInRoom ? (
                      <><div className="text-[11px] font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-tight">{sys.roomName}</div></>
                    ) : (
                      <div className="w-full h-4 border-l-2 border-slate-50 dark:border-zinc-900 ml-2" />
                    )}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5"><span className="text-[11px] font-black text-slate-700 dark:text-zinc-200 uppercase">{sys.id}</span>
                    <button
                      onClick={() => { 
                        const primary = sys.components.find((c: any) => c.id.startsWith('fcu')) || sys.components[0]; 
                        if (primary) onSelect(primary.id); 
                      }} 
                      className="p-1 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded text-orange-500 dark:text-orange-400 hover:text-amber-800 dark:hover:text-orange-300 transition-colors"
                      title="Locate in 3D Model"
                    >
                      <Box className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100 dark:border-zinc-800">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-200 uppercase">{sys.brand || '-'}</span>
                  </td>
                  <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-zinc-800">
                    <span className="text-[11px] font-black text-slate-700 dark:text-zinc-200">{sys.components[0]?.capacity || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-zinc-800">
                    <AirVent className={`w-5 h-5 stroke-[2.5] mx-auto ${
                      sys.aggregatedStatus === 'Normal' || sys.aggregatedStatus === 'Completed' ? 'text-emerald-500' :
                      sys.aggregatedStatus === 'Faulty' ? 'text-rose-500' : 'text-amber-500'
                    }`} />
                  </td>
                  <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-zinc-800">
                    {(() => {
                      const allLogs = sys.components.flatMap((c: any) => c.logs || [])
                      const latestWOLog = allLogs.find((l: any) => l.wo_number)
                      return latestWOLog ? (
                        <button
                          onClick={() => onSelectLog(latestWOLog)}
                          className={`text-[11px] font-mono font-black text-slate-800 dark:text-zinc-100 px-2 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity ${latestWOLog.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-800/50' : latestWOLog.status === 'Faulty' ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-800/50' : 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800/50'}`}
                        >
                          {latestWOLog.wo_number}
                        </button>
                      ) : <span className="text-[11px] font-bold text-slate-300 dark:text-zinc-700">-</span>
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
                            {installMs < startWindowMs && <div className="absolute -bottom-4 left-0 text-[11px] font-black text-slate-300 dark:text-zinc-600 uppercase tracking-tighter">Installed {sys.installDate}</div>}
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
                    <div className="text-[11px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis">
                      {sys.components.map((comp: any) => comp.id).join(', ')}
                    </div>
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
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700"><span className="text-orange-600 dark:text-orange-400">WO: {woList.length}</span></div>
        </div>
        <div className="flex items-center gap-3"><span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black tracking-widest"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> GRAPH_ALIGNED</span><span className="opacity-30">|</span><span className="tracking-widest">rw-03.40</span></div>
      </footer>

      {historySystem && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-8 animate-in fade-in duration-200" onClick={() => setHistorySystem(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-950 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <header className="px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className="p-2 bg-amber-800 dark:bg-amber-800 rounded-lg text-white"><ClipboardList className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] leading-tight">System Life Cycle History</h2>
                  <p className="text-lg font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tight">{historySystem.id} - {historySystem.roomName}</p>
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





