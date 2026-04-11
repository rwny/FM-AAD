import React, { useMemo, useState } from 'react'
import { 
  Building2, Box, ChevronDown, ChevronRight, Wind
} from 'lucide-react'
import type { Room, ACAsset } from '../../types/bim'

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
    // Only include AC assets in Arch mode for now
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
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] transition-all ${isFloorSelected ? 'bg-indigo-600 text-white shadow-md' : isClipped ? 'bg-indigo-50 ring-1 ring-indigo-100 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              <div className="flex items-center gap-1.5">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'} ${isFloorSelected ? 'text-indigo-200' : 'text-slate-400'}`} />
                <span className={`text-[11px] font-black uppercase tracking-wider`}>Floor 0{floorNum}</span>
              </div>
              <span className={`text-[10px] font-bold ${isFloorSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{rooms.filter(r => r.floor === floorNum).length}</span>
            </button>
            
            {isExpanded && (
              <div className="ml-1.5 pl-2.5 border-l border-slate-100 space-y-1 py-1">
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
                        className={`px-2 py-1.5 rounded-[4px] flex items-center justify-between cursor-pointer transition-all ${isRoomSelected ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'}`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Box className={`w-3.5 h-3.5 shrink-0 ${isRoomSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
                          <span className={`text-[12px] font-bold tracking-tight truncate ${isRoomSelected ? 'font-black' : ''}`}>{room.name}</span>
                        </div>
                        <ChevronRight className={`w-3 h-3 text-slate-300 transition-transform ${isRoomExpanded ? 'rotate-90' : ''}`} />
                      </div>

                      {isRoomExpanded && assets.length > 0 && (
                        <div className="ml-3 pl-3 border-l border-slate-100 space-y-0.5 py-0.5">
                          {assets.map(asset => {
                            const isAssetSelected = selectedRoomId === asset.id;
                            return (
                              <div 
                                key={asset.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedRoomId(asset.id); setSelectedFloor(null); }}
                                className={`flex items-center gap-2 px-2 py-1 rounded-[4px] cursor-pointer transition-all ${isAssetSelected ? 'bg-white shadow-sm ring-1 ring-slate-200 text-indigo-600' : 'hover:bg-slate-50 text-slate-400 hover:text-slate-600'}`}
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

export const ArchRightPanel: React.FC<ArchModeProps> = ({
  selectedRoomId, rooms, selectedFloor, finalACAssets
}) => {
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedAsset = useMemo(() => {
    if (!selectedRoomId) return null;
    return finalACAssets.find(a => a.id === selectedRoomId);
  }, [selectedRoomId, finalACAssets]);

  // Case 1: Asset Selected
  if (selectedAsset) {
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <div className="p-4 bg-slate-800 rounded-[12px] text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Equipment Detail</span>
            </div>
            <h3 className="text-xl font-black tracking-tighter leading-tight">{selectedAsset.id.toUpperCase()}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{selectedAsset.type}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white border border-slate-200 rounded-[10px] shadow-sm">
              <div className="text-[8px] text-slate-400 font-black uppercase mb-1">Status</div>
              <div className="text-slate-800 text-[12px] font-black">{selectedAsset.status || 'Active'}</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-[10px] shadow-sm">
              <div className="text-[8px] text-slate-400 font-black uppercase mb-1">Brand</div>
              <div className="text-slate-800 text-[12px] font-black">{selectedAsset.brand}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Case 2: Room Selected
  if (selectedRoom) {
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <div className="p-4 bg-indigo-600 rounded-[12px] text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-indigo-200" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Architectural Data</span>
            </div>
            <h3 className="text-2xl font-black tracking-tighter leading-tight">{selectedRoom.name}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white border border-slate-200 rounded-[10px] shadow-sm">
              <div className="text-[8px] text-slate-400 font-black uppercase mb-1">BIM ID</div>
              <div className="text-slate-800 text-[14px] font-black">{selectedRoom.number}</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-[10px] shadow-sm">
              <div className="text-[8px] text-slate-400 font-black uppercase mb-1">Level</div>
              <div className="text-slate-800 text-[14px] font-black">Level 0{selectedRoom.floor}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Floor Selected
  if (selectedFloor) {
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <div className="p-4 bg-slate-100 rounded-[12px] border border-slate-200 shadow-sm">
            <h3 className="text-2xl font-black tracking-tighter text-slate-800">FLOOR 0{selectedFloor}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Level Summary</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="p-4 bg-white rounded-[10px] border border-slate-200 shadow-sm">
                <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Rooms</div>
                <div className="text-2xl font-black text-slate-800">{rooms.filter(r => r.floor === selectedFloor).length}</div>
             </div>
             <div className="p-4 bg-white rounded-[10px] border border-slate-200 shadow-sm">
                <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Assets</div>
                <div className="text-2xl font-black text-indigo-600">
                  {finalACAssets.filter(a => a.id.split('-')[1]?.startsWith(selectedFloor.toString())).length}
                </div>
             </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40 grayscale">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Building2 className="w-8 h-8 text-slate-400" /></div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Select Floor, Room or Asset<br/>to view details</p>
    </div>
  );
}
