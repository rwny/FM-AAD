import React, { useMemo } from 'react'
import { 
  Building2, Box, ChevronDown, Info
} from 'lucide-react'
import type { Room } from '../../types/bim'

interface ArchModeProps {
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
  rooms: Room[];
  searchQuery: string;
  expandedFloors: {[key: number]: boolean};
  setExpandedFloors: React.Dispatch<React.SetStateAction<{[key: number]: boolean}>>;
  clipFloor: number | null;
  setClipFloor: (floor: number | null) => void;
}

export const ArchLeftPanel: React.FC<ArchModeProps> = ({
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
                  <div 
                    key={room.id} 
                    onClick={() => setSelectedRoomId(room.id)} 
                    className={`px-2 py-1.5 rounded-[4px] flex items-center gap-2 cursor-pointer transition-all ${room.id === selectedRoomId ? 'bg-indigo-100 text-indigo-700 font-black' : 'hover:bg-slate-100/50 text-slate-500 hover:text-slate-800'}`}
                  >
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

export const ArchRightPanel: React.FC<ArchModeProps> = ({
  selectedRoomId, rooms
}) => {
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
      {selectedRoom ? (
        <div className="space-y-4">
          <div className="p-4 bg-slate-800 rounded-[12px] text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Architectural Data</span>
            </div>
            <h3 className="text-2xl font-black tracking-tighter leading-tight">{selectedRoom.name}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white border border-slate-200 rounded-[10px] shadow-sm">
              <div className="text-[8px] text-slate-400 font-black uppercase mb-1">BIM ID</div>
              <div className="text-slate-800 text-[14px] font-black">{selectedRoom.number}</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-[10px] shadow-sm">
              <div className="text-[8px] text-slate-400 font-black uppercase mb-1">Area</div>
              <div className="text-slate-800 text-[14px] font-black">-- m²</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40 grayscale">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Building2 className="w-8 h-8 text-slate-400" /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Select Room to view<br/>Architectural Details</p>
        </div>
      )}
    </div>
  );
}
