import React, { useMemo, useState } from 'react'
import { Wind, Activity, ChevronDown, Box, ChevronRight, PlusCircle, ChevronLeft, ShoppingCart, Info, Printer, LayoutDashboard, PieChart } from 'lucide-react'
import type { Room, ACAsset } from '../../types/bim'
import { AddLogModal } from '../ui/AddLogModal'

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
    if (s === 'normal') return 'bg-emerald-500'; // 🟢 Green
    if (s === 'faulty') return 'bg-rose-500';   // 🔴 Red
    return 'bg-amber-500'; // 🟠 Orange (Maintenance / In Progress / Pending)
  }

  const projectStats = useMemo(() => {
    const stats = { green: 0, orange: 0, red: 0, total: finalACAssets.length };
    finalACAssets.forEach(a => {
      if (a.status === 'Maintenance' || a.status === 'Warning') stats.orange++;
      else if (a.status === 'Faulty') stats.red++;
      else stats.green++;
    });
    return stats;
  }, [finalACAssets]);

  return (
    <div className="space-y-1">
      {/* Project Dashboard Button */}
      <button 
        onClick={() => {
          setSelectedRoomId(null);
          setSelectedFloor(null);
          setClipFloor(null);
          // Special ID to trigger Dashboard in Right Panel
          setSelectedRoomId('DASHBOARD_OVERVIEW');
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 mb-3 rounded-[10px] transition-all border ${
          selectedRoomId === 'DASHBOARD_OVERVIEW' 
            ? 'bg-indigo-600 text-white shadow-lg border-indigo-500' 
            : 'bg-white/50 border-slate-200 text-slate-700 hover:bg-white hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <LayoutDashboard className={`w-4 h-4 ${selectedRoomId === 'DASHBOARD_OVERVIEW' ? 'text-indigo-200' : 'text-indigo-600'}`} />
          <span className="text-[11px] font-black uppercase tracking-wider">Project Dashboard</span>
        </div>
        <div className="flex gap-1">
           {projectStats.red > 0 && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
           {projectStats.orange > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
           <ChevronRight className={`w-3 h-3 ${selectedRoomId === 'DASHBOARD_OVERVIEW' ? 'text-indigo-200' : 'text-slate-300'}`} />
        </div>
      </button>

      {/* Existing Floor List */}
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

export const ACRightPanel: React.FC<any> = ({ selectedRoomId, setSelectedRoomId, finalACAssets, rooms, selectedFloor, setReportAsset, setSelectedLog }) => {
  const [showAddLog, setShowAddLog] = useState(false)
  const [logPage, setLogPage] = useState(0)
  const LOGS_PER_PAGE = 5

  const selectedAC = finalACAssets.find((a: any) => a.id.toLowerCase() === selectedRoomId?.toLowerCase());
  const selectedRoom = rooms.find((r: any) => r.id === selectedRoomId);

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

  // NEW: Dashboard Overview Logic
  if (selectedRoomId === 'DASHBOARD_OVERVIEW') {
     const stats = { green: 0, orange: 0, red: 0, total: finalACAssets.length };
     const setsTotal = Math.ceil(finalACAssets.length / 2);
     finalACAssets.forEach((a: ACAsset) => {
       if (a.status === 'Maintenance' || a.status === 'Warning') stats.orange++;
       else if (a.status === 'Faulty') stats.red++;
       else stats.green++;
     });

     const faultyAssets = finalACAssets.filter((a: ACAsset) => a.status === 'Faulty' || a.status === 'Maintenance');

     return (
       <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-slate-50/50">
          <div className="space-y-1">
             <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Project Dashboard</h3>
             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">AR15 Building Master Summary</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <div className="text-[10px] font-black text-slate-400 uppercase">Operational</div>
                <div className="flex items-baseline gap-1">
                   <div className="text-3xl font-black text-emerald-500">{Math.round((stats.green/stats.total)*100)}%</div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase">Healty</div>
                </div>
             </div>
             <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <div className="text-[10px] font-black text-slate-400 uppercase">Inventory</div>
                <div className="flex items-baseline gap-1">
                   <div className="text-3xl font-black text-indigo-600">{setsTotal}</div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase">Air Sets</div>
                </div>
             </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center gap-2 px-1">
                <Activity className="w-4 h-4 text-rose-500" />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Priority Action Items</span>
             </div>
             <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                {faultyAssets.length > 0 ? faultyAssets.map((a: ACAsset) => (
                   <div 
                      key={a.id} 
                      onClick={() => setSelectedRoomId(a.id)}
                      className="p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
                   >
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full ${a.status === 'Faulty' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                         <div>
                            <div className="text-xs font-black text-slate-800">{a.id.toUpperCase()}</div>
                            <div className="text-[9px] font-bold text-slate-400 italic">Room: {a.id.split('-')[1]} • Floor: {a.id.split('-')[1]?.charAt(0)}</div>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-200" />
                   </div>
                )) : (
                   <div className="p-10 text-center space-y-2">
                       <PieChart className="w-8 h-8 text-emerald-100 mx-auto" />
                       <p className="text-[10px] font-black text-slate-300 uppercase italic">All Systems Operational</p>
                   </div>
                )}
             </div>
          </div>

          <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl flex items-center justify-between">
              <div className="space-y-0.5">
                  <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest leading-none">Next Service Window</div>
                  <div className="text-lg font-black">April 2026</div>
              </div>
              <ChevronRight className="w-5 h-5 text-indigo-300" />
          </div>
       </div>
     );
  }

  // Asset Selected Logic
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
                  return (
                    <div key={log.id || i} className="p-2.5 leading-tight space-y-0.5 group">
                      {/* Line 1: Status + Date + Time + Reporter + Detail Button */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusBulletColor(statusKey)}`} />
                          <div className="flex items-baseline gap-1.5 flex-nowrap overflow-hidden">
                            <span className="text-[11px] font-black text-slate-900 shrink-0">{log.date}</span>
                            <span className="text-[9px] font-bold text-slate-400 shrink-0">{formatTime(log.created_at)}</span>
                            {log.reporter && (
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tight truncate">
                                • {log.reporter}
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="text-[9px] font-black text-indigo-500 uppercase px-1.5 py-0.5 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors shrink-0"
                        >
                          Detail
                        </button>
                      </div>
                      
                      {/* Line 2: Issue */}
                      <div className="ml-3.5 text-[11px] font-black text-slate-700 leading-snug truncate">
                        {log.issue}
                      </div>
                      
                      {/* Line 3: Note */}
                      <div className="ml-3.5 text-[10px] font-bold text-slate-400 italic leading-snug truncate">
                        {log.note || '---'}
                      </div>
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

            {/* Print Report Button at the Bottom */}
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
