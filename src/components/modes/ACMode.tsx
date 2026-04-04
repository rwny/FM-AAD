import React, { useMemo, useState } from 'react'
import { 
  Wind, Activity, ChevronDown, Box, ChevronRight, PlusCircle, 
  ChevronLeft, ShoppingCart, Info, Printer, 
  ClipboardList, Clock
} from 'lucide-react'
import type { Room, ACAsset } from '../../types/bim'
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
  setShowDashboard: (show: boolean) => void;
  setReportAsset?: (asset: any) => void;
  setSelectedLog?: (log: any) => void;
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
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] transition-all ${isFloorSelected ? 'bg-indigo-600 text-white shadow-md' : isClipped ? 'bg-indigo-50 ring-1 ring-indigo-100 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              <div className="flex items-center gap-1.5 ">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'} ${isFloorSelected ? 'text-indigo-200' : 'text-slate-400'}`} />
                <span className={`text-[11px] font-black uppercase tracking-wider`}>Floor 0{floorNum}</span>
              </div>
              <span className={`text-[10px] font-bold ${isFloorSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{rooms.filter(r => r.floor === floorNum).length}</span>
            </button>
            
            {isExpanded && (
              <div className="ml-1.5 pl-2.5 border-l border-slate-100 space-y-1 py-1">
                {floors[floorNum].map((room) => {
                  const isRoomSelected = selectedRoomId === room.id;
                  const roomAssets = getACInRoom(room.id);
                  const isRoomExpanded = expandedRooms[room.id];
                  const stats = getRoomStats(room.id);

                  return (
                    <div key={room.id} className="space-y-0.5">
                      <div 
                        onClick={() => { setSelectedRoomId(room.id); setSelectedFloor(null); setExpandedRooms(prev => ({...prev, [room.id]: !prev[room.id]})); }} 
                        className={`px-2 py-1.5 rounded-[4px] flex items-center justify-between cursor-pointer transition-all ${isRoomSelected ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100/50 text-slate-500 hover:text-slate-800'}`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Box className={`w-3.5 h-3.5 shrink-0 ${isRoomSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
                          <span className={`text-[12px] font-bold tracking-tight truncate ${isRoomSelected ? 'font-black' : ''}`}>{room.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {stats.total > 0 && (
                            <>
                              {stats.green > 0 && <span className="flex items-center gap-0.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 rounded-sm border border-emerald-100"><div className="w-1 h-1 rounded-full bg-emerald-500" />{stats.green}</span>}
                              {stats.orange > 0 && <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600 bg-amber-50 px-1 rounded-sm border border-amber-100"><div className="w-1 h-1 rounded-full bg-amber-500" />{stats.orange}</span>}
                              {stats.red > 0 && <span className="flex items-center gap-0.5 text-[9px] font-black text-rose-600 bg-rose-50 px-1 rounded-sm border border-rose-100"><div className="w-1 h-1 rounded-full bg-rose-500" />{stats.red}</span>}
                            </>
                          )}
                          <ChevronRight className={`w-3 h-3 text-slate-300 transition-transform ${isRoomExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {isRoomExpanded && roomAssets.length > 0 && (
                        <div className="ml-3 pl-3 border-l border-slate-100 space-y-0.5 py-0.5">
                          {roomAssets.map(asset => (
                            <div 
                              key={asset.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedRoomId(asset.id); setSelectedFloor(null); }}
                              className={`flex items-center justify-between px-2 py-1 rounded-[4px] cursor-pointer transition-all ${selectedRoomId === asset.id ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${getStatusBulletColor(asset.status)}`} />
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

export const ACRightPanel: React.FC<any> = ({ 
  selectedRoomId, finalACAssets, rooms, selectedFloor, 
  setReportAsset, setSelectedLog, setShowDashboard 
}) => {
  const [showAddLog, setShowAddLog] = useState(false)
  const [logPage, setLogPage] = useState(0)
  const LOGS_PER_PAGE = 5

  const selectedAC = finalACAssets.find((a: any) => a.id.toLowerCase() === selectedRoomId?.toLowerCase());

  const systemGroup = useMemo(() => {
    if (!selectedAC) return null;
    const parts = selectedAC.id.split('-');
    const systemId = parts.length >= 3 ? `AC-${parts[1]}-${parts[2]}` : `AC-${parts[1]}`;
    
    // Find all components in this system
    const components = finalACAssets.filter((a: any) => {
      const p = a.id.split('-');
      const sId = p.length >= 3 ? `AC-${p[1]}-${p[2]}` : `AC-${p[1]}`;
      return sId === systemId;
    });

    return { id: systemId, components, installDate: selectedAC.install || '2024-01-01' };
  }, [selectedAC, finalACAssets]);

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

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

  // Asset Selected Logic
  if (selectedAC && systemGroup) {
    const sortedLogs = selectedAC.logs || []; 
    const totalPages = Math.max(1, Math.ceil(sortedLogs.length / LOGS_PER_PAGE));
    const currentPageLogs = sortedLogs.slice(logPage * LOGS_PER_PAGE, (logPage + 1) * LOGS_PER_PAGE);

    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-white/40">
        <div className="space-y-4">
          <div className="space-y-0.5">
             <h3 className="text-lg font-black tracking-tighter text-slate-900 leading-tight">{selectedAC.name}</h3>
             <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{(selectedAC as any).acType || selectedAC.type}</p>
          </div>

          {/* Life Cycle Timeline in Sidebar */}
          <div className="p-4 bg-white border border-slate-200 rounded-[12px] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-[9px]">
                <Clock className="w-3.5 h-3.5" /> <span>3-Year Life Cycle</span>
              </div>
              <button 
                onClick={() => {
                  setShowDashboard(true);
                }}
                className="p-1.5 bg-slate-50 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                title="View Detailed History"
              >
                <ClipboardList className="w-3.5 h-3.5" />
              </button>
            </div>
            <SystemTimeline 
              installDate={systemGroup.installDate} 
              components={systemGroup.components} 
            />
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-white border border-slate-200 rounded-[12px] shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Object ID (GLB)</span>
                <span className="text-sm text-slate-800 font-black">{selectedAC.id.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider">Asset ID (Tag)</span>
                <span className="text-sm text-indigo-600 font-black">{(selectedAC as any).assetId || 'N/A'}</span>
              </div>
            </div>

            <div className="p-4 bg-indigo-600 border border-indigo-500 rounded-[12px] space-y-3 text-white shadow-lg">
              {[
                { label: 'Brand', value: selectedAC.brand, icon: Box },
                { label: 'Model', value: (selectedAC as any).model, icon: Info },
                { label: 'Capacity', value: (selectedAC as any).capacity, icon: Wind },
                { label: 'Age', value: `${calculateAge(selectedAC.install)} mo`, icon: Clock },
                { label: 'Install Date', value: selectedAC.install, icon: ShoppingCart }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-white/20 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 text-indigo-200" />
                    <span className="text-[10px] font-black uppercase text-indigo-200">{item.label}</span>
                  </div>
                  <span className="text-sm font-black">{item.value || '---'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Service Logs Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-[10px]">
                <Activity className="w-4 h-4" /> <span>Service Logs</span>
              </div>
              <button
                onClick={() => setShowAddLog(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] transition-all shadow-md"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase">Add Log</span>
              </button>
            </div>
            
            <div className="bg-white/80 rounded-[10px] border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
              {currentPageLogs.length > 0 ? (
                currentPageLogs.map((log: any, i: number) => {
                  const statusKey = log.status === 'Completed' ? 'normal' : log.status === 'Faulty' ? 'faulty' : 'maintenance';
                  
                  // Calculate age at the time of log
                  const installMs = new Date(selectedAC.install || '2024-01-01').getTime();
                  const logMs = new Date(log.date).getTime();
                  const ageAtLog = Math.round(Math.max(0, (logMs - installMs) / (1000 * 60 * 60 * 24 * 30.4375)));

                  return (
                    <div key={log.id || i} className="p-2.5 leading-tight space-y-0.5 group">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusBulletColor(statusKey)}`} />
                          <div className="flex items-baseline gap-1.5 flex-nowrap overflow-hidden">
                            <span className="text-[11px] font-black text-slate-900 shrink-0">{log.date}</span>
                            <span className="text-[9px] font-bold text-indigo-500 shrink-0 bg-indigo-50 px-1 rounded-sm border border-indigo-100/50">Age: {ageAtLog}m</span>
                            <span className="text-[9px] font-bold text-slate-400 shrink-0">{formatTime(log.created_at)}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="text-[9px] font-black text-indigo-500 uppercase px-1.5 py-0.5 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors shrink-0"
                        >
                          Detail
                        </button>
                      </div>
                      <div className="ml-3.5 text-[11px] font-black text-slate-700 leading-snug truncate">{log.issue}</div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-300 text-[10px] font-black uppercase italic">No logs recorded</div>
              )}
            </div>

            {sortedLogs.length > LOGS_PER_PAGE && (
              <div className="flex items-center justify-between px-2">
                <button onClick={() => setLogPage(p => Math.max(0, p - 1))} disabled={logPage === 0} className="p-1 hover:bg-slate-100 rounded disabled:opacity-20"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
                <span className="text-[10px] font-black text-slate-400 uppercase">Page {logPage + 1} of {totalPages}</span>
                <button onClick={() => setLogPage(p => Math.min(totalPages - 1, p + 1))} disabled={logPage >= totalPages - 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-20"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
              </div>
            )}

            <button
              onClick={() => setReportAsset(selectedAC)}
              className="w-full flex items-center justify-center gap-2 py-2 mt-2 border border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-[8px] transition-all bg-white shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase">Generate Maintenance Report</span>
            </button>
          </div>
        </div>

        {showAddLog && (
          <AddLogModal
            assetId={selectedAC.id}
            assetDbId={selectedAC.dbId}
            roomCode={selectedAC.id.split('-')[1] ? `rm-${selectedAC.id.split('-')[1]}` : 'rm-101'}
            category="AC"
            onClose={() => setShowAddLog(false)}
            onSuccess={() => window.dispatchEvent(new CustomEvent('refresh-bim-data'))}
          />
        )}
      </div>
    );
  }

  const selectedRoom = rooms.find((r: any) => r.id === selectedRoomId);
  if (selectedRoom) {
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <div className="p-4 bg-indigo-600 rounded-[12px] text-white shadow-lg">
          <h3 className="text-lg font-black tracking-tighter leading-tight">{selectedRoom.name}</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mt-1">Air Conditioning Summary</p>
        </div>
        <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[12px] opacity-40">
          <p className="text-[10px] font-black text-slate-400 uppercase">Select AC unit for details</p>
        </div>
      </div>
    );
  }

  if (selectedFloor) {
    const floorACs = finalACAssets.filter((a: ACAsset) => a.id.split('-')[1]?.startsWith(selectedFloor.toString()));
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <div className="p-4 bg-slate-100 rounded-[12px] border border-slate-200">
           <h3 className="text-lg font-black text-slate-800 uppercase">FLOOR 0{selectedFloor}</h3>
           <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Air Conditioning Overview</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-[12px] shadow-sm text-center">
           <div className="text-[10px] font-black text-indigo-400 uppercase mb-2">Total Sets at Level 0{selectedFloor}</div>
           <div className="text-3xl font-black text-indigo-600">
             {Math.ceil(floorACs.length / 2)} <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sets</span>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40 grayscale">
      <Wind className="w-16 h-16 text-slate-100 mb-4" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Select Floor, Room or Unit</p>
    </div>
  );
}
