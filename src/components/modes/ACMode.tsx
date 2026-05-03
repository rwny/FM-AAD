import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  AirVent, Activity, ChevronDown, Box, ChevronRight, PlusCircle, 
  Printer, Clock, Wrench, List, Pencil
} from 'lucide-react'
import type { Room, ACAsset } from '../../types/bim'
import { useAppStore } from '../../store'
import { supabase } from '../../utils/supabase'
import { AddLogModal } from '../ui/AddLogModal'
import { SystemTimeline } from '../ui/SystemTimeline'

interface ACModeProps {
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
  rooms: Room[];
  finalACAssets: ACAsset[];
  searchQuery: string;
  expandedFloors: {[key: number]: boolean};
  setExpandedFloors: React.Dispatch<React.SetStateAction<{[key: number]: boolean}>>;
  clipFloor: number | null;
  setClipFloor: (floor: number | null) => void;
  selectedFloor: number | null;
  setSelectedFloor: (floor: number | null) => void;
}

export const ACLeftPanel: React.FC<ACModeProps> = ({
  selectedRoomId, setSelectedRoomId, rooms, searchQuery, 
  expandedFloors, setExpandedFloors, clipFloor, setClipFloor, finalACAssets,
  selectedFloor, setSelectedFloor
}) => {
  const [expandedRooms, setExpandedRooms] = useState<{[key: string]: boolean}>({})

  const floors = useMemo(() => {
    const filtered = rooms.filter(room => room.name.toLowerCase().includes(searchQuery.toLowerCase()) || room.number.includes(searchQuery))
    const groups: { [key: number]: Room[] } = {}
    filtered.forEach(room => {
      if (!groups[room.floor]) groups[room.floor] = []
      groups[room.floor].push(room)
    })
    return groups
  }, [rooms, searchQuery])

  const getACInRoom = (roomId: string) => {
    const roomNum = roomId.replace('rm-', '');
    return finalACAssets.filter(a => a.id.toLowerCase().includes(roomNum.toLowerCase()));
  }

  const getRoomStats = (roomId: string) => {
    const assets = getACInRoom(roomId);
    const stats = { green: 0, orange: 0, red: 0, total: assets.length };
    assets.forEach(a => {
      if (a.status === 'Maintenance' || a.status === 'Warning') stats.orange++;
      else if (a.status === 'Faulty') stats.red++;
      else stats.green++;
    });
    return stats;
  }

  const getStatusBulletColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'normal') return 'bg-emerald-500'; 
    if (s === 'faulty') return 'bg-rose-500';   
    return 'bg-amber-500'; 
  }

  return (
    <div className="space-y-1">
      {Object.keys(floors).sort().map((floorStr) => {
        const floorNum = parseInt(floorStr);
        const isExpanded = !!expandedFloors[floorNum];
        const isClipped = clipFloor === floorNum;
        const isFloorSelected = selectedFloor === floorNum && !selectedRoomId;

        return (
          <div key={floorNum} className="space-y-0.5">
            <button 
              onClick={() => {
                const nextExpanded = !isExpanded;
                setExpandedFloors(prev => ({...prev, [floorNum]: nextExpanded}));
                setClipFloor(nextExpanded ? floorNum : null);
                setSelectedFloor(floorNum);
                setSelectedRoomId(null);
              }} 
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] transition-all ${isFloorSelected ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md' : isClipped ? 'bg-orange-50/50 dark:bg-orange-900/10 ring-1 ring-orange-200/50 dark:ring-orange-600/20 text-amber-800 dark:text-orange-400' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}

            >
              <div className="flex items-center gap-1.5 ">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'} ${isFloorSelected ? 'text-zinc-400 dark:text-zinc-500' : 'text-slate-400 dark:text-zinc-500'}`} />
                <span className={`text-[11px] font-black uppercase tracking-wider`}>Floor 0{floorNum}</span>
              </div>
              <span className={`text-[10px] font-bold ${isFloorSelected ? 'text-zinc-400 dark:text-zinc-500' : 'text-slate-400 dark:text-zinc-500'}`}>{rooms.filter(r => r.floor === floorNum).length}</span>
            </button>
            
            {isExpanded && (
              <div className="ml-1.5 pl-2.5 border-l border-slate-100 dark:border-zinc-800 space-y-1 py-1">
                {floors[floorNum].map((room) => {
                  const isRoomSelected = selectedRoomId === room.id;
                  const roomAssets = getACInRoom(room.id);
                  const isRoomExpanded = expandedRooms[room.id];
                  const stats = getRoomStats(room.id);

                  return (
                    <div key={room.id} className="space-y-0.5">
                      <div 
                        onClick={() => { setSelectedRoomId(room.id); setSelectedFloor(null); setExpandedRooms(prev => ({...prev, [room.id]: !prev[room.id]})); }} 
                        className={`px-2 py-1.5 rounded-[4px] flex items-center justify-between cursor-pointer transition-all ${isRoomSelected ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-200 dark:ring-zinc-700' : 'hover:bg-slate-100/50 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Box className={`w-3.5 h-3.5 shrink-0 ${isRoomSelected ? 'text-amber-800 dark:text-orange-500' : 'text-slate-300 dark:text-zinc-700'}`} />
                          <span className={`text-[12px] font-bold tracking-tight truncate ${isRoomSelected ? 'font-black' : ''}`}>{room.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {stats.total > 0 && (
                            <>
                              {stats.green > 0 && <span className="flex items-center gap-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1 rounded-sm border border-emerald-100 dark:border-emerald-900/50"><div className="w-2 h-2 rounded-full bg-emerald-500" />{stats.green}</span>}
                              {stats.orange > 0 && <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 rounded-sm border border-amber-100 dark:border-amber-900/50"><div className="w-2 h-2 rounded-full bg-amber-500" />{stats.orange}</span>}
                              {stats.red > 0 && <span className="flex items-center gap-0.5 text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1 rounded-sm border border-rose-100 dark:border-rose-900/50"><div className="w-2 h-2 rounded-full bg-rose-500" />{stats.red}</span>}
                            </>
                          )}
                          <ChevronRight className={`w-3 h-3 text-slate-300 dark:text-zinc-700 transition-transform ${isRoomExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {isRoomExpanded && roomAssets.length > 0 && (
                        <div className="ml-3 pl-3 border-l border-slate-100 dark:border-zinc-800 space-y-0.5 py-0.5">
                          {roomAssets.map(asset => (
                            <div 
                              key={asset.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedRoomId(asset.id); setSelectedFloor(null); }}
                              className={`flex items-center justify-between px-2 py-1 rounded-[4px] cursor-pointer transition-all ${selectedRoomId === asset.id ? 'bg-zinc-50 dark:bg-zinc-950/50 text-amber-800 dark:text-orange-500 ring-1 ring-zinc-200 dark:ring-zinc-800' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-3.5 h-3.5 rounded-full ${getStatusBulletColor(asset.status)}`} />
                                <span className="text-[10px] font-black">{asset.id.toUpperCase()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export const ACRightPanel: React.FC<{ finalACAssets: any[] }> = ({ 
  finalACAssets
}) => {
  const selectedRoomId = useAppStore(s => s.selectedRoomId)
  const rooms = useAppStore(s => s.rooms)
  const selectedFloor = useAppStore(s => s.selectedFloor)
  const setReportAsset = useAppStore(s => s.setReportAsset)
  const setSelectedLog = useAppStore(s => s.setSelectedLog)
  const [showAddLog, setShowAddLog] = useState(false)
  const [logToEdit, setLogToEdit] = useState<any>(null)
  const [logPage, _setLogPage] = useState(0)
  const [showIFC, setShowIFC] = useState(false)
  const [showResolveLog, setShowResolveLog] = useState(false)
  const LOGS_PER_PAGE = 5

  const selectedAC = finalACAssets.find((a: any) => a.id.toLowerCase() === selectedRoomId?.toLowerCase());

  const systemGroup = useMemo(() => {
    if (!selectedAC) return null;
    const parts = selectedAC.id.split('-');
    const systemId = parts.length >= 3 ? `AC-${parts[1]}-${parts[2]}` : `AC-${parts[1]}`;
    
    const components = finalACAssets.filter((a: any) => {
      const p = a.id.split('-');
      const sId = p.length >= 3 ? `AC-${p[1]}-${p[2]}` : `AC-${p[1]}`;
      return sId === systemId;
    });

    return { id: systemId, components, installDate: selectedAC.install || '2024-01-01' };
  }, [selectedAC, finalACAssets]);

  const getStatusBulletColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'normal') return 'bg-emerald-500';
    if (s === 'faulty') return 'bg-rose-500';
    return 'bg-amber-500';
  }

  const calculateAge = (installDate: string) => {
    if (!installDate || installDate === '---') return 0;
    const start = new Date(installDate);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const totalMonths = diffTime / (1000 * 60 * 60 * 24 * 30.4375);
    return Math.round(Math.max(0, totalMonths));
  };

  const getNextService = (installDate: string, logs: any[]) => {
    const install = new Date(installDate || '2024-01-01');
    let lastService = install;
    logs.forEach(log => {
      if (log.status === 'Completed') {
        const d = new Date(log.date);
        if (d > lastService) lastService = d;
      }
    });
    const next = new Date(lastService);
    next.setFullYear(next.getFullYear() + 1);
    return next;
  };

  const quickService = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('ac_maintenance_logs').insert({
      asset_id: selectedAC.id,
      date: today,
      issue: 'ซ่อมบำรุงประจำปี',
      status: 'Completed'
    })
    if (!error) window.dispatchEvent(new CustomEvent('refresh-bim-data'))
  }

  if (selectedAC && systemGroup) {
    const sortedLogs = selectedAC.logs || []; 
    const currentPageLogs = sortedLogs.slice(logPage * LOGS_PER_PAGE, (logPage + 1) * LOGS_PER_PAGE);

    return (
      <div className="flex-1 flex flex-col gap-px overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-zinc-900/30">
        {/* ID Card */}
        <div className="p-5 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-2xl text-slate-900 dark:text-white font-black tracking-tight">{selectedAC.id.toUpperCase()}</span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest">Asset ID</span>
          </div>
          <div className="text-sm font-black text-amber-800 dark:text-orange-500">
            {(selectedAC as any).assetId || 'N/A'}
          </div>
        </div>

        {/* Spec Card */}
        <div className="p-5 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 space-y-4">
          <div>
            <div className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-3">Specification</div>
            <div className="text-2xl font-black tracking-tighter uppercase text-slate-800 dark:text-zinc-100">
              {selectedAC.brand || '---'} : <span className="text-amber-800 dark:text-orange-500">{(selectedAC.capacity || (selectedAC as any).capacity || '---').replace('/hr', '')}</span>
            </div>
            <div className="text-sm font-black tracking-tight text-slate-500 dark:text-zinc-400 uppercase mt-1">
              {selectedAC.model || '---'}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50 dark:border-zinc-900">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-300 dark:text-zinc-700" />
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Installed {selectedAC.install}</span>
              <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 ml-auto bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 rounded">{calculateAge(selectedAC.install)} months old</span>
            </div>
            <SystemTimeline installDate={systemGroup.installDate} components={systemGroup.components} showLabels={false} />
            {(() => {
              const nextSvc = getNextService(selectedAC.install, sortedLogs)
              const daysLeft = Math.round((nextSvc.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const overdue = daysLeft < 0
              const soon = daysLeft <= 30 && daysLeft >= 0
              const color = overdue ? 'text-rose-500' : soon ? 'text-amber-500' : 'text-emerald-500'
              
              // Find latest problem log if asset is not Normal
              const latestProblemLog = sortedLogs.find((l: any) => l.status === 'Faulty' || l.status === 'In Progress' || l.status === 'Pending')

              return (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase">Next Service</span>
                      <span className={`text-xs font-black ${color}`}>{nextSvc.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {(overdue || soon) && (
                      <button onClick={quickService} className="text-[10px] font-black uppercase text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 rounded-lg">Mark Serviced</button>
                    )}
                  </div>

                  {showResolveLog && latestProblemLog && createPortal(
                    <AddLogModal
                      assetId={selectedAC.id}
                      assetDbId={selectedAC.dbId}
                      roomCode={selectedAC.id.split('-')[1] ? `rm-${selectedAC.id.split('-')[1]}` : 'rm-101'}
                      category="AC"
                      initialIssue={`แก้ไขปัญหา: ${latestProblemLog.issue}`}
                      initialWoNumber={latestProblemLog.wo_number}
                      onClose={() => setShowResolveLog(false)}
                      onSuccess={() => {
                        setShowResolveLog(false)
                        window.dispatchEvent(new CustomEvent('refresh-bim-data'))
                      }}
                    />,
                    document.body
                  )}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Service Logs */}
        <div className="p-5 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Service History</div>
            <button
              onClick={() => { setLogToEdit(null); setShowAddLog(true); }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 dark:text-zinc-500 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="divide-y divide-slate-100 dark:divide-zinc-900">
            {currentPageLogs.length > 0 ? (
              currentPageLogs.map((log: any, i: number) => {
                const statusKey = log.status === 'Completed' ? 'normal' : log.status === 'Faulty' ? 'faulty' : 'maintenance';
                const isLatest = i === 0
                return (
                  <div key={log.id || i} className="py-4 first:pt-0 last:pb-0 group">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusBulletColor(statusKey)}`} />
                        <span className="text-sm font-black text-slate-800 dark:text-zinc-100">{log.date}</span>
                      </div>
                      <div className="flex gap-2.5 items-center">
                        {isLatest && statusKey !== 'normal' && (
                          <button 
                            onClick={() => setShowResolveLog(true)} 
                            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded text-rose-500 transition-colors opacity-100"
                            title="Resolve Issue"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setSelectedLog(log)} 
                            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="View Details"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => { setLogToEdit(log); setShowAddLog(true); }} 
                            className="p-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded text-slate-400 hover:text-amber-600 transition-colors"
                            title="Edit Log"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 leading-relaxed pl-4 border-l-2 border-slate-100 dark:border-zinc-900 ml-1">
                      {log.issue}
                      {log.cost && <span className="block mt-1 text-[10px] font-black text-emerald-600">฿{Number(log.cost).toLocaleString()}</span>}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-slate-300 dark:text-zinc-800 text-[10px] font-black uppercase italic">No logs recorded</div>
            )}
          </div>

          <button
            onClick={() => setReportAsset(selectedAC)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest"
          >
            <Printer className="w-4 h-4" />
            <span>Full Maintenance Report</span>
          </button>
        </div>

        {/* IFC Data - fixed bottom, collapsible */}
        {selectedAC.metadata && (
          <div className="shrink-0">
            <button
              onClick={() => setShowIFC(!showIFC)}
              className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 dark:bg-black hover:bg-zinc-800 dark:hover:bg-zinc-900 text-slate-400 dark:text-zinc-500 rounded-[8px] transition-all border border-slate-700 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-wider">IFC Technical Data</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showIFC ? 'rotate-90' : ''}`} />
            </button>
            {showIFC && (
              <div className="mt-1 p-3 bg-zinc-900 dark:bg-black border border-slate-800 dark:border-zinc-900 rounded-[8px] space-y-2 text-slate-300 dark:text-zinc-400">
                {[
                  { label: 'GUID', value: selectedAC.metadata.guid },
                  { label: 'Voltage', value: selectedAC.metadata.specs?.voltage ? `${selectedAC.metadata.specs.voltage}V` : null },
                  { label: 'Frequency', value: selectedAC.metadata.specs?.frequency ? `${selectedAC.metadata.specs.frequency}Hz` : null },
                  { label: 'Phases', value: selectedAC.metadata.specs?.phases },
                  { label: 'Power', value: selectedAC.metadata.specs?.power ? `${selectedAC.metadata.specs.power}kW` : null },
                  { label: 'IFC Type', value: selectedAC.metadata.ifcType }
                ].filter(item => item.value !== null && item.value !== undefined).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-4 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <span className="text-[9px] font-black uppercase text-slate-500 dark:text-zinc-600 shrink-0 mt-0.5">{item.label}</span>
                    <span className="text-[11px] font-mono font-bold text-slate-200 dark:text-zinc-300 break-all text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(showAddLog || logToEdit) && createPortal(
          <AddLogModal
            assetId={selectedAC.id}
            assetDbId={selectedAC.dbId}
            roomCode={selectedAC.id.split('-')[1] ? `rm-${selectedAC.id.split('-')[1]}` : 'rm-101'}
            category="AC"
            logToEdit={logToEdit}
            onClose={() => { setShowAddLog(false); setLogToEdit(null); }}
            onSuccess={() => window.dispatchEvent(new CustomEvent('refresh-bim-data'))}
          />,
          document.body
        )}
      </div>
    );
  }

  const selectedRoom = rooms.find((r: any) => r.id === selectedRoomId);
  if (selectedRoom) {
    return (
      <div className="flex-1 flex flex-col gap-px overflow-y-auto custom-scrollbar bg-slate-100 dark:bg-zinc-800/50">
        <div className="p-6 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-zinc-500 mb-2">Room Summary</div>
          <h3 className="text-3xl font-black tracking-tighter leading-tight text-zinc-900 dark:text-zinc-100">{selectedRoom.name}</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 dark:text-orange-500 mt-2">Air Conditioning System</p>
        </div>
        <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-10 text-center">
          <AirVent className="w-12 h-12 text-slate-100 dark:text-zinc-800 mb-4" />
          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-relaxed">Select specific AC unit<br/>from the list below or map</p>
        </div>
      </div>
    );
  }

  if (selectedFloor) {
    const floorACs = finalACAssets.filter((a: ACAsset) => a.id.split('-')[1]?.startsWith(selectedFloor.toString()));
    return (
      <div className="flex-1 flex flex-col gap-px overflow-y-auto custom-scrollbar bg-slate-100 dark:bg-zinc-800/50">
        <div className="p-8 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800">
           <h3 className="text-4xl font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tighter">FLOOR 0{selectedFloor}</h3>
           <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em] mt-2">Air Conditioning Overview</p>
        </div>
        <div className="p-8 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center text-center">
           <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Total Capacity Sets</div>
           <div className="text-6xl font-black text-amber-800 dark:text-orange-500 tracking-tighter">
             {Math.ceil(floorACs.length / 2)}
           </div>
           <div className="text-[10px] font-black text-slate-300 dark:text-zinc-700 uppercase tracking-widest mt-2">Active Units</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40 grayscale">
      <AirVent className="w-16 h-16 text-slate-100 dark:text-zinc-800 mb-4" />
      <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-relaxed">Select Floor, Room or Unit</p>
    </div>
  );
}
