import React, { useMemo, useState } from 'react'
import { 
  House, Box, ChevronDown, ChevronRight, Wind
} from 'lucide-react'
import type { Room, ACAsset } from '../../types/bim'
import { useAppStore } from '../../store'

interface ArchModeProps {
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
  finalACAssets: ACAsset[];
  setShowDashboard: (show: boolean) => void;
}

export const ArchLeftPanel: React.FC<ArchModeProps> = ({
  selectedRoomId, setSelectedRoomId, rooms, searchQuery, 
  expandedFloors, setExpandedFloors, clipFloor, setClipFloor,
  selectedFloor, setSelectedFloor, finalACAssets
}) => {
  const [expandedRooms, setExpandedRooms] = useState<{[key: string]: boolean}>({})

  const filteredFloors = useMemo(() => {
    const floorGroups: { [key: number]: Room[] } = {}
    rooms.forEach(room => {
      if (!floorGroups[room.floor]) floorGroups[room.floor] = []
      if (room.name.toLowerCase().includes(searchQuery.toLowerCase()) || room.number.includes(searchQuery)) {
        floorGroups[room.floor].push(room)
      }
    })
    return floorGroups
  }, [rooms, searchQuery])

  const getAssetsInRoom = (roomId: string) => {
    const roomNum = roomId.replace('rm-', '');
    return finalACAssets.filter(a => a.id.toLowerCase().includes(roomNum.toLowerCase()));
  }

  return (
    <div className="space-y-1">
      {Object.keys(filteredFloors).sort().map((floorStr) => {
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
                {filteredFloors[floorNum].map((room) => {
                  const isRoomSelected = selectedRoomId === room.id;
                  const isRoomExpanded = expandedRooms[room.id];
                  const assets = getAssetsInRoom(room.id);

                  return (
                    <div key={room.id} className="space-y-0.5">
                      <div 
                        onClick={() => { 
                          setSelectedRoomId(room.id); 
                          setSelectedFloor(null);
                          setExpandedRooms(prev => ({...prev, [room.id]: !prev[room.id]}));
                        }} 
                        className={`px-2 py-1.5 rounded-[4px] flex items-center justify-between cursor-pointer transition-all ${isRoomSelected ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-200 dark:ring-zinc-700' : 'hover:bg-slate-100/50 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Box className={`w-3.5 h-3.5 shrink-0 ${isRoomSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-300 dark:text-zinc-700'}`} />
                          <span className={`text-[12px] font-bold tracking-tight truncate ${isRoomSelected ? 'font-black' : ''}`}>{room.name}</span>
                        </div>
                        <ChevronRight className={`w-3 h-3 text-slate-300 dark:text-zinc-700 transition-transform ${isRoomExpanded ? 'rotate-90' : ''}`} />
                      </div>

                      {isRoomExpanded && assets.length > 0 && (
                        <div className="ml-3 pl-3 border-l border-slate-100 dark:border-zinc-800 space-y-0.5 py-0.5">
                          {assets.map(asset => {
                            const isAssetSelected = selectedRoomId === asset.id;
                            return (
                              <div 
                                key={asset.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedRoomId(asset.id); setSelectedFloor(null); }}
                                className={`flex items-center gap-2 px-2 py-1 rounded-[4px] cursor-pointer transition-all ${isAssetSelected ? 'bg-zinc-50 dark:bg-zinc-950/50 text-orange-600 dark:text-orange-400 ring-1 ring-zinc-200 dark:ring-zinc-800' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
                              >
                                <Wind className="w-2.5 h-2.5" />
                                <span className="text-[10px] font-black uppercase truncate">{asset.id}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export const ArchRightPanel: React.FC<{ finalACAssets: any[] }> = ({
  finalACAssets
}) => {
  const selectedRoomId = useAppStore(s => s.selectedRoomId)
  const rooms = useAppStore(s => s.rooms)
  const selectedFloor = useAppStore(s => s.selectedFloor)
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedAsset = useMemo(() => {
    if (!selectedRoomId) return null;
    return finalACAssets.find(a => a.id === selectedRoomId);
  }, [selectedRoomId, finalACAssets]);

  if (selectedAsset) {
    return (
      <div className="flex-1 flex flex-col gap-px overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-zinc-900/30">
        <div className="p-6 bg-zinc-800 dark:bg-zinc-950 text-white space-y-1">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 mb-2">Equipment Detail</div>
          <h3 className="text-3xl font-black tracking-tighter leading-tight">{selectedAsset.id.toUpperCase()}</h3>
          <p className="text-xs font-bold text-amber-500 mt-1 uppercase tracking-widest">{selectedAsset.type}</p>
        </div>

        <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800">
          <div className="p-5 bg-white dark:bg-zinc-900">
            <div className="text-[9px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1.5">Status</div>
            <div className="text-slate-800 dark:text-zinc-100 text-lg font-black">{selectedAsset.status || 'Active'}</div>
          </div>
          <div className="p-5 bg-white dark:bg-zinc-900">
            <div className="text-[9px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1.5">Brand</div>
            <div className="text-slate-800 dark:text-zinc-100 text-lg font-black">{selectedAsset.brand || '---'}</div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedRoom) {
    return (
      <div className="flex-1 flex flex-col gap-px overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-zinc-900/30">
        <div className="p-6 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <House className="w-5 h-5 text-amber-800 dark:text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-zinc-500">Architectural Data</span>
          </div>
          <h3 className="text-4xl font-black tracking-tighter leading-tight text-slate-900 dark:text-zinc-100">{selectedRoom.name}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800">
          <div className="p-6 bg-white dark:bg-zinc-900">
            <div className="text-[9px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-2">BIM ID</div>
            <div className="text-slate-800 dark:text-zinc-100 text-xl font-black">{selectedRoom.number}</div>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900">
            <div className="text-[9px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-2">Level</div>
            <div className="text-slate-800 dark:text-zinc-100 text-xl font-black italic">Level 0{selectedRoom.floor}</div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedFloor) {
    return (
      <div className="flex-1 flex flex-col gap-px overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-zinc-900/30">
        <div className="p-8 bg-slate-100 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-zinc-100 uppercase">FLOOR 0{selectedFloor}</h3>
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-zinc-600 mt-2">Level Summary Index</p>
        </div>
        <div className="grid grid-cols-1 gap-px bg-slate-200 dark:bg-zinc-800">
           <div className="p-6 bg-white dark:bg-zinc-900 flex justify-between items-center">
              <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Total Rooms at Level</div>
              <div className="text-3xl font-black text-slate-800 dark:text-zinc-100">{rooms.filter(r => r.floor === selectedFloor).length}</div>
           </div>
           <div className="p-6 bg-white dark:bg-zinc-900 flex justify-between items-center">
              <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Connected Assets</div>
              <div className="text-3xl font-black text-orange-600 dark:text-orange-500">
                {finalACAssets.filter(a => a.id.split('-')[1]?.startsWith(selectedFloor.toString())).length}
              </div>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40 grayscale">
      <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4"><House className="w-8 h-8 text-slate-400 dark:text-zinc-500" /></div>
      <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-relaxed">Select Floor, Room or Asset<br/>to view details</p>
    </div>
  );
}
