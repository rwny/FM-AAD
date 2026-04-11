import React, { useMemo, useState } from 'react'
import {
  Wind, Activity, ChevronDown, Box, ChevronRight, PlusCircle,
  ChevronLeft, Printer,
  ClipboardList, Clock
} from 'lucide-react'
import type { Room, ACAsset } from '../../types/bim'
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
  setReportAsset, setSelectedLog, setShowDashboard, setAddLogAsset
}) => {
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

    const statusColor = selectedAC.status === 'Faulty' ? 'text-rose-400' : selectedAC.status === 'Maintenance' ? 'text-amber-400' : 'text-emerald-400';
    const statusDot = selectedAC.status === 'Faulty' ? 'bg-rose-400' : selectedAC.status === 'Maintenance' ? 'bg-amber-400' : 'bg-emerald-400';

    return (
      <div className="flex flex-col text-slate-800 text-[11px]">
        {/* Asset header */}
        <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-2 mb-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${statusColor}`}>{selectedAC.status}</span>
          </div>
          <div className="text-slate-900 font-black tracking-tight text-[13px]">{selectedAC.name}</div>
          <div className="text-slate-400 text-[9px] uppercase tracking-widest mt-0.5">{(selectedAC as any).acType || selectedAC.type}</div>
        </div>

        {/* Life Cycle Timeline */}
        <div className="px-3 py-2 border-b border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 text-[9px] uppercase tracking-widest">
              <Clock className="w-3 h-3" /><span>Life Cycle</span>
            </div>
            <button onClick={() => setShowDashboard(true)} className="text-slate-300 hover:text-slate-600 transition-colors" title="View History">
              <ClipboardList className="w-3.5 h-3.5" />
            </button>
          </div>
          <SystemTimeline installDate={systemGroup.installDate} components={systemGroup.components} />
        </div>

        {/* IDs */}
        <div className="border-b border-slate-200">
          {[
            { label: 'GLB ID', value: selectedAC.id.toUpperCase(), cls: 'text-slate-800' },
            { label: 'Asset Tag', value: (selectedAC as any).assetId || 'N/A', cls: 'text-indigo-600' },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center px-3 py-1.5 border-b border-slate-100 last:border-0 hover:bg-white/60 transition-colors">
              <span className="text-slate-400 uppercase tracking-widest text-[9px]">{row.label}</span>
              <span className={`font-black text-[11px] ${row.cls}`}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Specs */}
        <div className="border-b border-slate-200">
          {[
            { label: 'Brand', value: selectedAC.brand },
            { label: 'Model', value: (selectedAC as any).model },
            { label: 'Capacity', value: (selectedAC as any).capacity },
            { label: 'Age', value: `${calculateAge(selectedAC.install)} mo` },
            { label: 'Install', value: selectedAC.install },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center px-3 py-1.5 border-b border-slate-100 last:border-0 hover:bg-white/60 transition-colors">
              <span className="text-slate-400 uppercase tracking-widest text-[9px]">{row.label}</span>
              <span className="text-slate-800 font-black text-[11px]">{row.value || '---'}</span>
            </div>
          ))}
        </div>

        {/* Service Logs header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50/40">
          <div className="flex items-center gap-1.5 text-slate-500 text-[9px] uppercase tracking-widest">
            <Activity className="w-3 h-3" /><span>Logs</span>
            {sortedLogs.length > 0 && <span className="text-slate-800 font-black">{sortedLogs.length}</span>}
          </div>
          <button onClick={() => setAddLogAsset(selectedAC)} className="flex items-center gap-1 px-2 py-0.5 border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-500 transition-all text-[9px] font-black uppercase tracking-widest rounded-[3px]">
            <PlusCircle className="w-3 h-3" /><span>Add</span>
          </button>
        </div>

        {/* Log entries */}
        <div className="divide-y divide-slate-100">
          {currentPageLogs.length > 0 ? currentPageLogs.map((log: any, i: number) => {
            const dot = log.status === 'Completed' ? 'bg-emerald-500' : log.status === 'Faulty' ? 'bg-rose-500' : 'bg-amber-500';
            const installMs = new Date(selectedAC.install || '2024-01-01').getTime();
            const ageAtLog = Math.round(Math.max(0, (new Date(log.date).getTime() - installMs) / (1000 * 60 * 60 * 24 * 30.4375)));
            return (
              <div key={log.id || i} className="px-3 py-2 hover:bg-white/60 transition-colors">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                    <span className="text-slate-700 text-[10px] font-black">{log.date}</span>
                    <span className="text-slate-400 text-[9px] bg-slate-100 px-1 rounded-[2px]">{ageAtLog}m</span>
                  </div>
                  <button onClick={() => setSelectedLog(log)} className="text-[8px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">detail</button>
                </div>
                <div className="pl-3 text-slate-600 text-[10px] leading-snug truncate">{log.issue}</div>
                {log.contractor && <div className="pl-3 text-amber-600 text-[9px] truncate">{log.contractor}</div>}
              </div>
            );
          }) : (
            <div className="px-3 py-4 text-center text-slate-300 text-[9px] uppercase tracking-widest">no logs recorded</div>
          )}
        </div>

        {/* Log pagination */}
        {sortedLogs.length > LOGS_PER_PAGE && (
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-200">
            <button onClick={() => setLogPage(p => Math.max(0, p - 1))} disabled={logPage === 0} className="text-slate-400 hover:text-slate-800 disabled:opacity-20 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <span className="text-[9px] font-black text-slate-400 uppercase">{logPage + 1} / {totalPages}</span>
            <button onClick={() => setLogPage(p => Math.min(totalPages - 1, p + 1))} disabled={logPage >= totalPages - 1} className="text-slate-400 hover:text-slate-800 disabled:opacity-20 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Print report */}
        <div className="px-3 py-2 border-t border-slate-200">
          <button onClick={() => setReportAsset(selectedAC)} className="w-full flex items-center justify-center gap-2 py-1.5 border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-500 transition-all text-[9px] font-black uppercase tracking-widest rounded-[3px]">
            <Printer className="w-3 h-3" /><span>Generate Report</span>
          </button>
        </div>

      </div>
    );
  }

  const selectedRoom = rooms.find((r: any) => r.id === selectedRoomId);
  if (selectedRoom) {
    return (
      <div className="flex flex-col text-[11px]">
        <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50/60">
          <div className="text-slate-400 text-[9px] uppercase tracking-widest mb-0.5">Room</div>
          <div className="text-slate-900 font-black tracking-tight text-[13px]">{selectedRoom.name}</div>
          <div className="text-slate-400 text-[9px] uppercase tracking-widest mt-0.5">Air Conditioning</div>
        </div>
        <div className="px-3 py-4 text-center text-slate-300 text-[9px] uppercase tracking-widest">
          select AC unit in 3D for details
        </div>
      </div>
    );
  }

  if (selectedFloor) {
    const floorACs = finalACAssets.filter((a: ACAsset) => a.id.split('-')[1]?.startsWith(selectedFloor.toString()));
    return (
      <div className="flex flex-col text-[11px]">
        <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50/60">
          <div className="text-slate-400 text-[9px] uppercase tracking-widest mb-0.5">Level</div>
          <div className="text-slate-900 font-black tracking-tight text-[13px]">FLOOR 0{selectedFloor}</div>
        </div>
        <div className="flex justify-between items-center px-3 py-2 border-b border-slate-100 hover:bg-white/60 transition-colors">
          <span className="text-slate-400 text-[9px] uppercase tracking-widest">Total Sets</span>
          <span className="text-slate-900 font-black text-[16px]">{Math.ceil(floorACs.length / 2)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-32 gap-2">
      <Wind className="w-5 h-5 text-slate-200" />
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Select unit in 3D</p>
    </div>
  );
}
