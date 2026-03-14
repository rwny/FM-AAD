import React, { useMemo } from 'react'
import { Zap, ChevronDown, Box, Activity } from 'lucide-react'
import type { Room } from '../../types/bim'

interface EEModeProps {
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
  rooms: Room[];
  searchQuery: string;
  expandedFloors: {[key: number]: boolean};
  setExpandedFloors: React.Dispatch<React.SetStateAction<{[key: number]: boolean}>>;
  clipFloor: number | null;
  setClipFloor: (floor: number | null) => void;
}

export const EELeftPanel: React.FC<EEModeProps> = ({
  selectedRoomId, setSelectedRoomId, rooms, searchQuery, 
  expandedFloors, setExpandedFloors, clipFloor, setClipFloor
}) => {
  const floors = useMemo(() => {
    const filtered = rooms.filter(room => room.name.toLowerCase().includes(searchQuery.toLowerCase()) || room.number.includes(searchQuery))
    const groups: { [key: number]: Room[] } = {}
    filtered.forEach(room => {
      if (!groups[room.floor]) groups[room.floor] = []
      groups[room.floor].push(room)
    })
    return groups
  }, [rooms, searchQuery])

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
                {floors[floorNum].map((room) => (
                  <div key={room.id} onClick={() => setSelectedRoomId(room.id)} className={`px-2 py-1.5 rounded-[4px] flex items-center gap-2 cursor-pointer transition-all ${room.id === selectedRoomId ? 'bg-indigo-100 text-indigo-700 font-black' : 'hover:bg-slate-100/50 text-slate-500 hover:text-slate-800'}`}>
                    <Box className={`w-3.5 h-3.5 ${room.id === selectedRoomId ? 'text-indigo-600' : 'text-slate-300'}`} />
                    <span className="text-[12px] font-bold tracking-tight">{room.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export const EERightPanel: React.FC<any> = ({ selectedRoomId, rooms }) => {
  const selectedRoom = rooms.find((r: any) => r.id === selectedRoomId);

  return (
    <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
      {selectedRoom ? (
        <div className="space-y-4">
          <div className="p-4 bg-amber-600 rounded-[12px] text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-200" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">Electrical System</span>
            </div>
            <h3 className="text-2xl font-black tracking-tighter leading-tight">{selectedRoom.name}</h3>
          </div>
          <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[12px] opacity-40">
            <Zap className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-[10px] font-black text-slate-400 uppercase">Electrical assets not yet populated</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40 grayscale">
          <Zap className="w-16 h-16 text-slate-100 mb-4" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Select Room to view<br/>Electrical Infrastructure</p>
        </div>
      )}
    </div>
  );
}
