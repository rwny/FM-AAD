import React, { useMemo, useState } from 'react'
import { 
  Building2, Box, ChevronDown, ListChecks, Armchair, 
  ShoppingCart, Calendar, Activity, Phone, Tag, ChevronRight
} from 'lucide-react'
import type { Room, FurnitureAsset } from '../../types/bim'

interface FurnitureModeProps {
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
  rooms: Room[];
  allFurniture: FurnitureAsset[];
  searchQuery: string;
  expandedFloors: {[key: number]: boolean};
  setExpandedFloors: React.Dispatch<React.SetStateAction<{[key: number]: boolean}>>;
  clipFloor: number | null;
  setClipFloor: (floor: number | null) => void;
}

// --- Shared Helper Functions ---
const getRoomStats = (allFurniture: FurnitureAsset[], roomId: string) => {
  // FILTER OUT RETIRED ASSETS FROM ACTIVE COUNT
  const assets = allFurniture.filter(a => a.room === roomId && !(a as any).isRetired);
  const stats = { green: 0, orange: 0, red: 0, total: assets.length };
  assets.forEach(a => {
    const s = (a.status || '').toLowerCase();
    if (s.includes('maintenance') || s.includes('warning')) stats.orange++;
    else if (s.includes('faulty') || s.includes('พัง') || s.includes('หัก')) stats.red++;
    else stats.green++;
  });
  return stats;
}

const getStatusColorClass = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('maintenance')) return 'text-amber-700 bg-amber-50 border-amber-200'
  if (s.includes('faulty') || s.includes('พัง') || s.includes('หัก')) return 'text-rose-700 bg-rose-50 border-rose-200'
  if (s.includes('เลิกใช้')) return 'text-slate-500 bg-slate-50 border-slate-200'
  return 'text-emerald-700 bg-emerald-50 border-emerald-200'
}

const getStatusBulletColor = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('maintenance')) return 'bg-amber-500';
  if (s.includes('faulty') || s.includes('พัง') || s.includes('หัก') || s.includes('เลิกใช้')) return 'bg-rose-500';
  return 'bg-emerald-500';
}

const getLogBulletColor = (issue: string) => {
  const s = (issue || '').toLowerCase();
  if (s.includes('normal') || s.includes('install') || s.includes('ปกติ')) return 'bg-emerald-500';
  if (s.includes('maintenance') || s.includes('ซ่อม') || s.includes('บำรุง')) return 'bg-amber-500';
  if (s.includes('พัง') || s.includes('หัก') || s.includes('faulty') || s.includes('broken')) return 'bg-rose-500';
  return 'bg-slate-300';
}

// --- Components ---

export const FurnitureLeftPanel: React.FC<FurnitureModeProps> = ({
  selectedRoomId, setSelectedRoomId, rooms, searchQuery, 
  expandedFloors, setExpandedFloors, clipFloor, setClipFloor, allFurniture
}) => {
  const [expandedRooms, setExpandedRooms] = useState<{[key: string]: boolean}>({})
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({})

  const floors = useMemo(() => {
    const filtered = rooms.filter(room => room.name.toLowerCase().includes(searchQuery.toLowerCase()) || room.number.includes(searchQuery))
    const groups: { [key: number]: Room[] } = {}
    filtered.forEach(room => {
      if (!groups[room.floor]) groups[room.floor] = []
      groups[room.floor].push(room)
    })
    return groups
  }, [rooms, searchQuery])

  const getGroupedAssets = (roomId: string) => {
    const assets = allFurniture.filter(a => a.room === roomId);
    const groups: {[key: string]: FurnitureAsset[]} = {};
    assets.forEach(a => {
      const cat = a.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    });
    return groups;
  }

  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  }

  const toggleCategory = (roomId: string, cat: string) => {
    const key = `${roomId}-${cat}`;
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
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
                  const stats = getRoomStats(allFurniture, room.id);
                  const groupedAssets = getGroupedAssets(room.id);
                  const isRoomExpanded = expandedRooms[room.id];

                  return (
                    <div key={room.id} className="space-y-0.5">
                      <div 
                        onClick={() => { setSelectedRoomId(room.id); toggleRoom(room.id); }} 
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

                      {isRoomExpanded && Object.keys(groupedAssets).length > 0 && (
                        <div className="ml-3 pl-3 border-l border-slate-100 space-y-0.5 py-0.5">
                          {Object.keys(groupedAssets).map(cat => {
                            const isCatExpanded = expandedCategories[`${room.id}-${cat}`];
                            return (
                              <div key={cat} className="space-y-0.5">
                                <div 
                                  onClick={(e) => { e.stopPropagation(); toggleCategory(room.id, cat); }}
                                  className="flex items-center justify-between px-2 py-0.5 hover:bg-slate-50 rounded cursor-pointer group"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <ChevronRight className={`w-2.5 h-2.5 text-slate-400 transition-transform ${isCatExpanded ? 'rotate-90' : ''}`} />
                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-500 uppercase">{cat}</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-300">{groupedAssets[cat].filter(a => !(a as any).isRetired).length}</span>
                                </div>

                                {isCatExpanded && (
                                  <div className="ml-2 pl-3 border-l border-slate-50 space-y-0.5">
                                    {groupedAssets[cat].map(asset => {
                                      const isAssetSelected = selectedRoomId?.toLowerCase().replace(/\./g, '') === asset.id.toLowerCase().replace(/\./g, '');
                                      const isRetired = (asset as any).isRetired;
                                      return (
                                        <div 
                                          key={asset.id}
                                          onClick={(e) => { e.stopPropagation(); setSelectedRoomId(asset.id); }}
                                          className={`flex items-center justify-between px-2 py-0.5 rounded-[4px] cursor-pointer transition-all ${isAssetSelected ? 'bg-indigo-50 text-indigo-600' : isRetired ? 'text-slate-300 line-through opacity-50' : 'hover:bg-slate-100/50 text-slate-400 hover:text-slate-600'}`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className={`w-1 h-1 rounded-full ${isRetired ? 'bg-slate-200' : getStatusBulletColor(asset.status)}`} />
                                            <span className="text-[10px] font-black">{asset.id}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
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

export const FurnitureRightPanel: React.FC<FurnitureModeProps> = ({
  selectedRoomId, setSelectedRoomId, rooms, allFurniture
}) => {
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({})
  
  const selectedFur = useMemo(() => {
    if (!selectedRoomId) return undefined;
    const targetId = selectedRoomId.toLowerCase().replace(/\./g, '');
    return allFurniture.find(a => a.id.toLowerCase().replace(/\./g, '') === targetId);
  }, [allFurniture, selectedRoomId])

  const contextRoom = useMemo(() => {
    if (selectedFur) return rooms.find(r => r.id === selectedFur.room);
    return rooms.find(r => r.id === selectedRoomId);
  }, [rooms, selectedFur, selectedRoomId]);

  const roomAssetGroups = useMemo(() => {
    if (!contextRoom) return {};
    const assets = allFurniture.filter(a => a.room === contextRoom.id && !(a as any).isRetired); // Only Active Assets
    const groups: {[key: string]: any[]} = {};
    assets.forEach(a => {
      if (!groups[a.typeId]) groups[a.typeId] = [];
      groups[a.typeId].push(a);
    });
    return groups;
  }, [allFurniture, contextRoom]);

  if (selectedFur) {
    const sortedLogs = [...(selectedFur.logs || [])].sort((a, b) => b.date.localeCompare(a.date));
    const isRetired = (selectedFur as any).isRetired;

    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-white/40">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1">
               <h3 className={`text-xl font-black tracking-tighter leading-tight ${isRetired ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{selectedFur?.id}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedFur?.typeName}</p>
            </div>
            <span className={`px-2 py-1 text-[9px] font-black rounded-full border uppercase shrink-0 shadow-sm ${getStatusColorClass(selectedFur?.status || 'Normal')}`}>
              {selectedFur?.status || 'Active'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-white/80 rounded-[8px] border border-slate-200 shadow-sm">
              <div className="text-[8px] text-slate-400 font-black uppercase mb-1">Asset ID</div>
              <div className="text-slate-800 text-[12px] font-black truncate">{selectedFur?.['Asset-ID'] || selectedFur?.assetId || '-'}</div>
            </div>
            <div className="p-2.5 bg-white/80 rounded-[8px] border border-slate-200 shadow-sm">
              <div className="text-[8px] text-slate-400 font-black uppercase mb-1">Level</div>
              <div className="text-slate-800 text-[12px] font-black truncate">Level 0{selectedFur?.floor}</div>
            </div>
          </div>

          <div className={`p-4 rounded-[12px] shadow-lg shadow-indigo-100 space-y-3 text-white ${isRetired ? 'bg-slate-400' : 'bg-indigo-600'}`}>
            <div className="flex justify-between items-center border-b border-white/20 pb-2">
              <div className="flex items-center gap-2"><ShoppingCart className="w-3 h-3 opacity-60" /><span className="text-[9px] font-black uppercase">Brand</span></div>
              <span className="text-[11px] font-black uppercase">{selectedFur?.brand}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/20 pb-2">
              <div className="flex items-center gap-2"><Box className="w-3 h-3 opacity-60" /><span className="text-[9px] font-black uppercase">Model</span></div>
              <span className="text-[11px] font-black uppercase">{selectedFur?.model}</span>
            </div>
            {(selectedFur?.Install || selectedFur?.install) && (
              <div className="flex justify-between items-center border-b border-white/20 pb-2">
                <div className="flex items-center gap-2"><Calendar className="w-3 h-3 opacity-60" /><span className="text-[9px] font-black uppercase">Installed</span></div>
                <span className="text-[11px] font-black uppercase">{selectedFur.Install || selectedFur.install}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-[9px] px-1"><Activity className="w-3.5 h-3.5" /> <span>Asset Logs (Latest First)</span></div>
          <div className="bg-white/80 rounded-[10px] border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
            {sortedLogs.length > 0 ? (
              sortedLogs.map((log, i) => (
                <div key={i} className="p-3 leading-tight">
                  <div className="flex gap-2.5 items-center">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${getLogBulletColor(log.issue)} shadow-sm`} />
                    <span className="text-[13px] font-black text-slate-900 shrink-0">{log.date}</span>
                    <span className="text-[14px] font-bold text-slate-800 tracking-tight">: {log.issue}</span>
                  </div>
                  {log.note && (
                    <div className="pl-7 mt-1.5 text-[12px] text-slate-500 font-bold italic leading-relaxed">
                      ↳ {log.note}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-300 text-[10px] font-black uppercase italic">No logs recorded</div>
            )}
          </div>
        </div>

        {selectedFur?.history && selectedFur.history.length > 0 && (
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[9px] px-1"><Calendar className="w-3.5 h-3.5" /> <span>Model History (Replaced Objects)</span></div>
            <div className="space-y-2">
              {selectedFur.history.sort((a: any, b: any) => b.date.localeCompare(a.date)).map((h: any, i: number) => (
                <div key={i} className="p-3 rounded-[10px] border border-slate-100 bg-slate-50/50 opacity-70">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-500">{h.date} (Retired)</span>
                    <span className={`text-[7px] px-1 font-black rounded-full border uppercase bg-white text-slate-400`}>{h.status}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-600">{h.brand} | {h.model}</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase mt-1">ID: {h.assetId}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (contextRoom) {
    const stats = getRoomStats(allFurniture, contextRoom.id);
    const totalAssetsCount = Object.values(roomAssetGroups).reduce((acc, curr) => acc + curr.length, 0);
    
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <div className="p-4 bg-indigo-600 rounded-[12px] text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-indigo-200" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Active Room Inventory</span>
            </div>
            <h3 className="text-2xl font-black tracking-tighter leading-tight">{contextRoom.name}</h3>
            <div className="mt-3 flex gap-4 border-t border-indigo-400/30 pt-3">
              <div>
                <div className="text-[8px] font-black uppercase text-indigo-200">Floor</div>
                <div className="text-lg font-black leading-none">{contextRoom.floor}</div>
              </div>
              <div>
                <div className="text-[8px] font-black uppercase text-indigo-200">BIM ID</div>
                <div className="text-lg font-black leading-none">{contextRoom.number}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-[9px] px-1"><ListChecks className="w-3.5 h-3.5" /> <span>Summary (Excl. Retired)</span></div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="p-4 bg-white border border-slate-200 rounded-[12px] shadow-sm text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Current Active Status</div>
                <div className="flex justify-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-emerald-600">{stats.green}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase">Normal</span>
                  </div>
                  <div className="w-px h-8 bg-slate-100 mt-2" />
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-amber-500">{stats.orange}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase">Maintenance</span>
                  </div>
                  <div className="w-px h-8 bg-slate-100 mt-2" />
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-rose-500">{stats.red}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase">Broken</span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-[10px]">
                <div className="text-[9px] font-black text-slate-400 uppercase mb-2">Active Assets by Type</div>
                <div className="space-y-2">
                  {Object.keys(roomAssetGroups).map(typeId => (
                    <div key={typeId} className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-600">{typeId} ({roomAssetGroups[typeId][0].typeName})</span>
                      <span className="text-[11px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100">{roomAssetGroups[typeId].length}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Armchair className="w-8 h-8 text-slate-400" /></div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Select Room or Asset<br/>from the left panel</p>
    </div>
  );
}
