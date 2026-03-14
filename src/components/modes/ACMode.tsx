import React, { useMemo, useState } from 'react'
import { Wind, Activity, ChevronDown, Box, ChevronRight } from 'lucide-react'
import type { Room, ACAsset } from '../../types/bim'

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
}

export const ACLeftPanel: React.FC<ACModeProps> = ({
  selectedRoomId, setSelectedRoomId, rooms, searchQuery, 
  expandedFloors, setExpandedFloors, clipFloor, setClipFloor, finalACAssets
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
    return finalACAssets.filter(a => a.id.includes(roomNum));
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
    if (status === 'Maintenance' || status === 'Warning') return 'bg-amber-500';
    if (status === 'Faulty') return 'bg-rose-500';
    return 'bg-emerald-500';
  }

  return (
    <div className="space-y-1">
      {Object.keys(floors).sort().map((floorStr) => {
        const floorNum = parseInt(floorStr);
        const isExpanded = expandedFloors[floorNum] !== false;
        const isClipped = clipFloor === floorNum;
        return (
          <div key={floorNum} className="space-y-0.5">
            <button 
              onClick={() => {
                const nextExpanded = !isExpanded;
                setExpandedFloors(prev => ({...prev, [floorNum]: nextExpanded}));
                setClipFloor(nextExpanded ? floorNum : null);
              }} 
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] transition-all ${isClipped ? 'bg-indigo-50 ring-1 ring-indigo-200' : isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-1.5 text-slate-600">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-0 text-indigo-500' : '-rotate-90'}`} />
                <span className={`text-[11px] font-black uppercase tracking-wider ${isClipped ? 'text-indigo-700' : isExpanded ? 'text-slate-800' : ''}`}>Floor 0{floorNum}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{rooms.filter(r => r.floor === floorNum).length}</span>
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
                        onClick={() => { setSelectedRoomId(room.id); setExpandedRooms(prev => ({...prev, [room.id]: !prev[room.id]})); }} 
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
                              onClick={(e) => { e.stopPropagation(); setSelectedRoomId(asset.id); }}
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

export const ACRightPanel: React.FC<any> = ({ selectedRoomId, finalACAssets, rooms }) => {
  const selectedAC = finalACAssets.find((a: any) => a.id === selectedRoomId);
  const selectedRoom = rooms.find((r: any) => r.id === selectedRoomId);

  const getStatusColorClass = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('maintenance') || s.includes('warning')) return 'text-amber-700 bg-amber-50 border-amber-200'
    if (s.includes('faulty')) return 'text-rose-700 bg-rose-50 border-rose-200'
    return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  }

  if (selectedAC) {
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1">
               <h3 className="text-xl font-black tracking-tighter leading-tight text-slate-900">{selectedAC.name}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedAC.type}</p>
            </div>
            <span className={`px-2 py-1 text-[9px] font-black rounded-full border uppercase shrink-0 shadow-sm ${getStatusColorClass(selectedAC.status)}`}>
              {selectedAC.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white border border-slate-200 rounded-[10px] shadow-sm">
              <div className="text-[8px] text-slate-400 font-black uppercase mb-1">Asset ID</div>
              <div className="text-slate-800 text-[12px] font-black">{selectedAC.id.toUpperCase()}</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-[10px] shadow-sm">
              <div className="text-[8px] text-slate-400 font-black uppercase mb-1">Brand</div>
              <div className="text-slate-800 text-[12px] font-black">{selectedAC.brand}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-[9px] px-1"><Activity className="w-3.5 h-3.5" /> <span>Service Logs</span></div>
            <div className="space-y-2">
              {selectedAC.logs?.map((log: any, i: number) => (
                <div key={i} className="p-3 bg-white border border-slate-200 rounded-[10px] shadow-sm">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[8px] px-2 py-0.5 font-black rounded-full uppercase ${log.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{log.status}</span>
                    <span className="text-[8px] text-slate-400 font-mono font-bold">{log.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-800 font-black leading-tight mb-1">{log.issue}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedRoom) {
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <div className="p-4 bg-indigo-600 rounded-[12px] text-white shadow-lg">
          <h3 className="text-2xl font-black tracking-tighter leading-tight">{selectedRoom.name}</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mt-1">Air Conditioning Summary</p>
        </div>
        <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[12px] opacity-40">
          <Wind className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-[10px] font-black text-slate-400 uppercase">Select AC unit for details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40 grayscale">
      <Wind className="w-16 h-16 text-slate-100 mb-4" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Select Room or Unit</p>
    </div>
  );
}
