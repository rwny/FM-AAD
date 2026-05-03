import React, { useMemo } from 'react'
import { Zap, ChevronDown, Box } from 'lucide-react'
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
  selectedFloor: number | null;
  setSelectedFloor: (floor: number | null) => void;
}

export const EELeftPanel: React.FC<EEModeProps> = ({
  selectedRoomId, setSelectedRoomId, rooms, searchQuery, 
  expandedFloors, setExpandedFloors, clipFloor, setClipFloor,
  selectedFloor, setSelectedFloor
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
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] transition-all ${isFloorSelected ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md' : isClipped ? 'bg-orange-50/50 dark:bg-orange-900/10 ring-1 ring-orange-100/50 dark:ring-orange-500/20 text-orange-700 dark:text-orange-300' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}
            >
              <div className="flex items-center gap-1.5">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'} ${isFloorSelected ? 'text-zinc-400 dark:text-zinc-500' : 'text-slate-400 dark:text-zinc-500'}`} />
                <span className={`text-[11px] font-black uppercase tracking-wider`}>Floor 0{floorNum}</span>
              </div>
              <span className={`text-[10px] font-bold ${isFloorSelected ? 'text-zinc-400 dark:text-zinc-500' : 'text-slate-400 dark:text-zinc-500'}`}>{rooms.filter(r => r.floor === floorNum).length}</span>
            </button>
            {isExpanded && (
              <div className="ml-1.5 pl-2.5 border-l border-slate-100 dark:border-zinc-800 space-y-1 py-1">
                {floors[floorNum].map((room) => (
                  <div 
                    key={room.id} 
                    onClick={() => { setSelectedRoomId(room.id); setSelectedFloor(null); }} 
                    className={`px-2 py-1.5 rounded-[4px] flex items-center gap-2 cursor-pointer transition-all ${room.id === selectedRoomId ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-200 dark:ring-zinc-700 font-black' : 'hover:bg-slate-100/50 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                  >
                    <Box className={`w-3.5 h-3.5 ${room.id === selectedRoomId ? 'text-orange-600 dark:text-orange-400' : 'text-slate-300 dark:text-zinc-700'}`} />
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

export const EERightPanel: React.FC<any> = ({ selectedRoomId, rooms, selectedFloor }) => {
  const selectedRoom = rooms.find((r: any) => r.id === selectedRoomId);

  if (selectedRoom) {
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-white/40 dark:bg-zinc-950/40">
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">Electrical System</span>
            </div>
            <h3 className="text-2xl font-black tracking-tighter leading-tight text-zinc-900 dark:text-zinc-100">{selectedRoom.name}</h3>
          </div>
          <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-[12px] opacity-40">
            <Zap className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase">Electrical assets not yet populated</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedFloor) {
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-white/40 dark:bg-zinc-950/40">
        <div className="p-4 bg-slate-100 dark:bg-zinc-900 rounded-[12px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
           <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 uppercase">FLOOR 0{selectedFloor}</h3>
           <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase mt-1">Electrical Overview</p>
        </div>
        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] shadow-sm text-center">
           <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase mb-2">Power Source Status</div>
           <div className="text-2xl font-black text-orange-600 dark:text-orange-400">ONLINE</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40 grayscale">
      <Zap className="w-16 h-16 text-slate-100 dark:text-zinc-800 mb-4" />
      <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-relaxed">Select Floor or Room</p>
    </div>
  );
}
