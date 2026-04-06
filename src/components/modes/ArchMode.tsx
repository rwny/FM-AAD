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
    const statusDot = selectedAsset.status === 'Faulty' ? 'bg-rose-500' : selectedAsset.status === 'Maintenance' ? 'bg-amber-500' : 'bg-emerald-500';
    const statusColor = selectedAsset.status === 'Faulty' ? 'text-rose-600' : selectedAsset.status === 'Maintenance' ? 'text-amber-600' : 'text-emerald-600';
    return (
      <div className="flex flex-col text-[11px]">
        <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-2 mb-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${statusColor}`}>{selectedAsset.status || 'Active'}</span>
          </div>
          <div className="text-slate-900 font-black tracking-tight text-[13px]">{selectedAsset.id.toUpperCase()}</div>
          <div className="text-slate-400 text-[9px] uppercase tracking-widest mt-0.5">{selectedAsset.type}</div>
        </div>
        {[
          { label: 'Status', value: selectedAsset.status || 'Active' },
          { label: 'Brand', value: selectedAsset.brand },
        ].map((row, i) => (
          <div key={i} className="flex justify-between items-center px-3 py-1.5 border-b border-slate-100 last:border-0 hover:bg-white/60 transition-colors">
            <span className="text-slate-400 uppercase tracking-widest text-[9px]">{row.label}</span>
            <span className="text-slate-800 font-black text-[11px]">{row.value || '---'}</span>
          </div>
        ))}
      </div>
    );
  }

  // Case 2: Room Selected
  if (selectedRoom) {
    return (
      <div className="flex flex-col text-[11px]">
        <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400 text-[9px] uppercase tracking-widest">Room</span>
          </div>
          <div className="text-slate-900 font-black tracking-tight text-[13px]">{selectedRoom.name}</div>
        </div>
        {[
          { label: 'BIM ID', value: selectedRoom.number },
          { label: 'Level', value: `Level 0${selectedRoom.floor}` },
        ].map((row, i) => (
          <div key={i} className="flex justify-between items-center px-3 py-1.5 border-b border-slate-100 last:border-0 hover:bg-white/60 transition-colors">
            <span className="text-slate-400 uppercase tracking-widest text-[9px]">{row.label}</span>
            <span className="text-slate-800 font-black text-[11px]">{row.value}</span>
          </div>
        ))}
      </div>
    );
  }

  // Case 3: Floor Selected
  if (selectedFloor) {
    return (
      <div className="flex flex-col text-[11px]">
        <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50/60">
          <div className="text-slate-400 text-[9px] uppercase tracking-widest mb-0.5">Level</div>
          <div className="text-slate-900 font-black tracking-tight text-[13px]">FLOOR 0{selectedFloor}</div>
        </div>
        {[
          { label: 'Rooms', value: rooms.filter(r => r.floor === selectedFloor).length },
          { label: 'Assets', value: finalACAssets.filter(a => a.id.split('-')[1]?.startsWith(selectedFloor.toString())).length },
        ].map((row, i) => (
          <div key={i} className="flex justify-between items-center px-3 py-1.5 border-b border-slate-100 last:border-0 hover:bg-white/60 transition-colors">
            <span className="text-slate-400 uppercase tracking-widest text-[9px]">{row.label}</span>
            <span className="text-slate-900 font-black text-[16px]">{row.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-32 gap-2">
      <Building2 className="w-5 h-5 text-slate-200" />
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Select in 3D</p>
    </div>
  );
}
