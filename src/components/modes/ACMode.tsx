import React, { useMemo, useState } from 'react'
import { Wind, Activity, ChevronDown, Box, ChevronRight, PlusCircle, ChevronLeft, ShoppingCart, Info } from 'lucide-react'
import type { Room, ACAsset } from '../../types/bim'
import { supabase, ensureAssetExists } from '../../utils/supabase'
import { AddLogModal } from '../ui/AddLogModal'
import { PrintReportModal } from '../ui/PrintReportModal'

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
    if (s.includes('maintenance') || s.includes('warning')) return 'bg-amber-500';
    if (s.includes('faulty')) return 'bg-rose-500';
    return 'bg-emerald-500';
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
                                <div className={`w-1 h-1 rounded-full ${getStatusBulletColor(asset.status)}`} />
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

export const ACRightPanel: React.FC<any> = ({ selectedRoomId, finalACAssets, rooms, selectedFloor }) => {
  const [showAddLog, setShowAddLog] = useState(false)
  const [logPage, setLogPage] = useState(0)
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set())
  const LOGS_PER_PAGE = 5

  const selectedAC = finalACAssets.find((a: any) => a.id.toLowerCase() === selectedRoomId?.toLowerCase());
  const selectedRoom = rooms.find((r: any) => r.id === selectedRoomId);

  // Toggle log expansion
  const toggleLogExpansion = (id: string) => {
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  // Asset Selected
  if (selectedAC) {
    const sortedLogs = selectedAC.logs || []; 
    const totalPages = Math.max(1, Math.ceil(sortedLogs.length / LOGS_PER_PAGE));
    const currentPageLogs = sortedLogs.slice(logPage * LOGS_PER_PAGE, (logPage + 1) * LOGS_PER_PAGE);

    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-white/40">
        <div className="space-y-4">
          {/* Header Section */}
          <div className="space-y-0.5">
             <h3 className="text-lg font-black tracking-tighter text-slate-900 leading-tight">{selectedAC.name}</h3>
             <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{(selectedAC as any).acType || selectedAC.type}</p>
          </div>

          <div className="space-y-2">
            {/* ID Section */}
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

            {/* Technical Specs List */}
            <div className="p-4 bg-indigo-600 border border-indigo-500 rounded-[12px] space-y-3 text-white shadow-lg">
              {[
                { label: 'Brand', value: selectedAC.brand, icon: Box },
                { label: 'Model', value: (selectedAC as any).model, icon: Info },
                { label: 'Capacity', value: (selectedAC as any).capacity, icon: Wind },
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

              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-indigo-200" />
                  <span className="text-[10px] font-black uppercase text-indigo-200">Quick Note</span>
                </div>
                <p className="text-[10px] font-bold text-indigo-50 leading-tight italic bg-black/10 p-2 rounded-lg border border-white/10">
                  {selectedAC.log || 'No additional notes'}
                </p>
              </div>
            </div>
          </div>

          {/* Service Logs Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-[10px]">
                <Activity className="w-4 h-4" /> <span>Service Logs</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPrintReport(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-[8px] transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase">Report</span>
                </button>
                <button
                  onClick={() => setShowAddLog(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] transition-all shadow-md"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase">Add Log</span>
                </button>
              </div>
            </div>
            
            <div className="bg-white/80 rounded-[10px] border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
              {currentPageLogs.length > 0 ? (
                currentPageLogs.map((log: any, i: number) => {
                  const isExpanded = expandedLogIds.has(log.id);
                  return (
                    <div key={log.id || i} className="p-3 leading-tight space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2 items-center">
                          <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'Completed' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900">{log.date}</span>
                            <span className="text-[10px] font-bold text-slate-400">{formatTime(log.created_at)}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleLogExpansion(log.id || i.toString())}
                          className="text-[10px] font-black text-indigo-500 uppercase hover:text-indigo-700 transition-colors"
                        >
                          {isExpanded ? 'Show Less' : 'Detail'}
                        </button>
                      </div>
                      
                      <div className="ml-3.5 space-y-1">
                        <div className={`text-sm font-black text-slate-800 ${!isExpanded ? 'truncate' : ''}`}>
                          <span className="text-[10px] text-slate-400 uppercase mr-1.5">Issue:</span>
                          {log.issue}
                        </div>
                        <div className={`text-[10px] font-bold text-slate-500 italic ${!isExpanded ? 'truncate' : ''}`}>
                          <span className="text-[10px] text-slate-400 uppercase not-italic mr-1.5">Note:</span>
                          {log.note || '---'}
                        </div>
                      </div>
                      
                      {isExpanded && log.reporter && (
                        <div className="ml-3.5 pt-1 text-[10px] font-black text-slate-400 uppercase">
                          Reporter: <span className="text-slate-600">{log.reporter}</span>
                        </div>
                      )}
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

        {showPrintReport && (
          <PrintReportModal
            asset={selectedAC}
            onClose={() => setShowPrintReport(false)}
          />
        )}
      </div>
    );
  }

  // Room Selected State
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

  // Floor Selected State
  if (selectedFloor) {
    const floorACs = finalACAssets.filter((a: ACAsset) => a.id.split('-')[1]?.startsWith(selectedFloor.toString()));
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <div className="p-4 bg-slate-100 rounded-[12px] border border-slate-200">
           <h3 className="text-lg font-black text-slate-800 uppercase">FLOOR 0{selectedFloor}</h3>
           <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Air Conditioning Overview</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-[12px] shadow-sm text-center">
           <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Units at Level 0{selectedFloor}</div>
           <div className="text-3xl font-black text-indigo-600">{floorACs.length}</div>
        </div>
      </div>
    )
  }

  // Default Empty State
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40 grayscale">
      <Wind className="w-16 h-16 text-slate-100 mb-4" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Select Floor, Room or Unit</p>
    </div>
  );
}
