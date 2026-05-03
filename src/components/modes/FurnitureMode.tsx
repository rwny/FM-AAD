import React, { useMemo, useState } from 'react'
import {
  Box, ChevronDown, Armchair,
  ShoppingCart, Activity, ChevronRight, PlusCircle, Trash2
} from 'lucide-react'
import type { Room, FurnitureAsset } from '../../types/bim'
import { useAppStore } from '../../store'
import { AddLogModal } from '../ui/AddLogModal'
import { supabase, deleteMaintenanceLog } from '../../utils/supabase'

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
  selectedFloor: number | null;
  setSelectedFloor: (floor: number | null) => void;
}

// --- Shared Helper Functions ---
const getRoomStats = (allFurniture: FurnitureAsset[], roomId: string) => {
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

const getStatusBulletColor = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('maintenance')) return 'bg-amber-500';
  if (s.includes('faulty') || s.includes('พัง') || s.includes('หัก') || s.includes('เลิกใช้งาน')) return 'bg-rose-500';
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
  expandedFloors, setExpandedFloors, clipFloor, setClipFloor, allFurniture,
  selectedFloor, setSelectedFloor
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
              <div className="flex items-center gap-1.5 ">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'} ${isFloorSelected ? 'text-zinc-400 dark:text-zinc-500' : 'text-slate-400 dark:text-zinc-500'}`} />
                <span className={`text-[11px] font-black uppercase tracking-wider`}>Floor 0{floorNum}</span>
              </div>
              <span className={`text-[10px] font-bold ${isFloorSelected ? 'text-zinc-400 dark:text-zinc-500' : 'text-slate-400 dark:text-zinc-500'}`}>{rooms.filter(r => r.floor === floorNum).length}</span>
            </button>
            
            {isExpanded && (
              <div className="ml-1.5 pl-2.5 border-l border-slate-100 dark:border-zinc-800 space-y-1 py-1">
                {floors[floorNum].map((room) => {
                  const isRoomSelected = selectedRoomId === room.id;
                  const stats = getRoomStats(allFurniture, room.id);
                  const groupedAssets = getGroupedAssets(room.id);
                  const isRoomExpanded = expandedRooms[room.id];

                  return (
                    <div key={room.id} className="space-y-0.5">
                      <div 
                        onClick={() => { setSelectedRoomId(room.id); setSelectedFloor(null); toggleRoom(room.id); }} 
                        className={`px-2 py-1.5 rounded-[4px] flex items-center justify-between cursor-pointer transition-all ${isRoomSelected ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-200 dark:ring-zinc-700' : 'hover:bg-slate-100/50 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Box className={`w-3.5 h-3.5 shrink-0 ${isRoomSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-300 dark:text-zinc-700'}`} />
                          <span className={`text-[12px] font-bold tracking-tight truncate ${isRoomSelected ? 'font-black' : ''}`}>{room.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {stats.total > 0 && (
                            <>
                              {stats.green > 0 && <span className="flex items-center gap-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1 rounded-sm border border-emerald-100 dark:border-emerald-900/50"><div className="w-2 h-2 rounded-full bg-emerald-500" />{stats.green}</span>}
                              {stats.orange > 0 && <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 rounded-sm border border-amber-100 dark:border-amber-900/50"><div className="w-2 h-2 rounded-full bg-amber-500" />{stats.orange}</span>}
                              {stats.red > 0 && <span className="flex items-center gap-0.5 text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1 rounded-sm border border-rose-100 dark:border-rose-900/50"><div className="w-2 h-2 rounded-full bg-rose-500" />{stats.red}</span>}
                            </>
                          )}
                          <ChevronRight className={`w-3 h-3 text-slate-300 dark:text-zinc-700 transition-transform ${isRoomExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {isRoomExpanded && Object.keys(groupedAssets).length > 0 && (
                        <div className="ml-3 pl-3 border-l border-slate-100 dark:border-zinc-800 space-y-0.5 py-0.5">
                          {Object.keys(groupedAssets).map(cat => {
                            const isCatExpanded = expandedCategories[`${room.id}-${cat}`];
                            return (
                              <div key={cat} className="space-y-0.5">
                                <div 
                                  onClick={(e) => { e.stopPropagation(); toggleCategory(room.id, cat); }}
                                  className="flex items-center justify-between px-2 py-0.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded cursor-pointer group"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <ChevronRight className={`w-2.5 h-2.5 text-slate-400 dark:text-zinc-600 transition-transform ${isCatExpanded ? 'rotate-90' : ''}`} />
                                    <span className="text-[10px] font-black text-slate-400 dark:text-zinc-600 group-hover:text-orange-600 dark:group-hover:text-orange-400 uppercase">{cat}</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-300 dark:text-zinc-700">{groupedAssets[cat].filter(a => !(a as any).isRetired).length}</span>
                                </div>

                                {isCatExpanded && (
                                  <div className="ml-2 pl-3 border-l border-slate-50 dark:border-zinc-800 space-y-0.5">
                                    {groupedAssets[cat].map(asset => {
                                      const isAssetSelected = selectedRoomId?.toLowerCase().replace(/\./g, '') === asset.id.toLowerCase().replace(/\./g, '');
                                      const isRetired = (asset as any).isRetired;
                                      return (
                                        <div 
                                          key={asset.id}
                                          onClick={(e) => { e.stopPropagation(); setSelectedRoomId(asset.id); setSelectedFloor(null); }}
                                          className={`flex items-center justify-between px-2 py-0.5 rounded-[4px] cursor-pointer transition-all ${isAssetSelected ? 'bg-zinc-50 dark:bg-zinc-950/50 text-orange-600 dark:text-orange-400 ring-1 ring-zinc-200 dark:ring-zinc-800' : isRetired ? 'text-slate-300 dark:text-zinc-700 line-through opacity-50' : 'hover:bg-slate-100/50 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className={`w-3.5 h-3.5 rounded-full ${isRetired ? 'bg-slate-200 dark:bg-zinc-800' : getStatusBulletColor(asset.status)}`} />
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
  selectedRoomId, rooms, allFurniture, selectedFloor
}) => {
  const showDelete = useAppStore(s => s.showDelete)
  const [showAddLog, setShowAddLog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Delete this service log? This cannot be undone.')) return
    try {
      await deleteMaintenanceLog(logId)
      window.dispatchEvent(new CustomEvent('refresh-bim-data'))
    } catch (err: any) {
      alert('Failed to delete: ' + err.message)
    }
  }

  const selectedFur = useMemo(() => {
    if (!selectedRoomId) return undefined;
    const targetId = selectedRoomId.toLowerCase().replace(/\./g, '').trim();
    return allFurniture.find(a => {
      const assetId = a.id.toLowerCase().replace(/\./g, '').trim();
      return assetId === targetId;
    });
  }, [allFurniture, selectedRoomId])

  // Form State
  const [editForm, setEditForm] = useState({
    brand: '',
    model: '',
    status: ''
  })

  // Sync Form when asset changes or edit starts
  React.useEffect(() => {
    if (selectedFur && isEditing) {
      setEditForm({
        brand: selectedFur.brand || '',
        model: selectedFur.model || '',
        status: selectedFur.status || 'Normal'
      })
    }
  }, [selectedFur, isEditing])

  const handleSave = async () => {
    if (!selectedFur) return;
    setIsSaving(true);
    try {
      const assetDbId = (selectedFur as any).dbId;
      if (!assetDbId) throw new Error('Database ID (UUID) missing for this asset.');

      const { error } = await supabase
        .from('assets')
        .update({
          brand: editForm.brand,
          model: editForm.model,
          status: editForm.status,
          metadata: {
            ...(selectedFur as any).metadata,
            brand: editForm.brand,
            model: editForm.model,
            status: editForm.status
          }
        })
        .eq('id', assetDbId);

      if (error) throw error;
      
      setIsEditing(false);
      window.dispatchEvent(new CustomEvent('refresh-bim-data'));
    } catch (err: any) {
      alert('Error saving: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  const contextRoom = useMemo(() => {
    if (selectedFur) return rooms.find(r => r.id === selectedFur.room);
    return rooms.find(r => r.id === selectedRoomId);
  }, [rooms, selectedFur, selectedRoomId]);

  if (selectedFur) {
    const sortedLogs = [...(selectedFur.logs || [])].sort((a, b) => b.date.localeCompare(a.date));
    const currentPageLogs = sortedLogs;
    const isRetired = (selectedFur as any).isRetired;

    const handleLogAdded = () => {
      window.dispatchEvent(new CustomEvent('refresh-bim-data'));
    }

    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-white/40 dark:bg-zinc-950/40">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1">
               <h3 className={`text-xl font-black tracking-tighter leading-tight ${isRetired ? 'text-slate-400 dark:text-zinc-600 line-through' : 'text-zinc-900 dark:text-zinc-100'}`}>{selectedFur?.id}</h3>
               <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{selectedFur?.typeName}</p>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-2 py-1 text-[9px] font-black rounded-full border border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors uppercase shrink-0"
              >
                Edit Details
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3 p-3 bg-white/80 dark:bg-zinc-900 rounded-[12px] border border-orange-200 dark:border-zinc-800 shadow-inner">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-orange-500 dark:text-orange-400 uppercase tracking-wider">Brand Name</label>
                <input 
                  type="text" 
                  value={editForm.brand}
                  onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
                  className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[6px] text-xs font-bold focus:ring-2 focus:ring-orange-600/20 outline-none text-zinc-800 dark:text-zinc-100"
                  placeholder="e.g. ModernForm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-orange-500 dark:text-orange-400 uppercase tracking-wider">Model / Serial</label>
                <input 
                  type="text" 
                  value={editForm.model}
                  onChange={(e) => setEditForm({...editForm, model: e.target.value})}
                  className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[6px] text-xs font-bold focus:ring-2 focus:ring-orange-600/20 outline-none text-zinc-800 dark:text-zinc-100"
                  placeholder="e.g. MD-1565465"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-orange-500 dark:text-orange-400 uppercase tracking-wider">Status</label>
                <select 
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[6px] text-xs font-bold focus:ring-2 focus:ring-orange-600/20 outline-none text-zinc-800 dark:text-zinc-100"
                >
                  <option value="Normal">Normal (Active)</option>
                  <option value="Maintenance">Maintenance (Waiting)</option>
                  <option value="Faulty">Faulty (Broken)</option>
                  <option value="เลิกใช้งาน">Retired (Not counted)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-[6px] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-1.5 text-[10px] font-black uppercase bg-orange-700 dark:bg-orange-600 text-white rounded-[6px] shadow-md hover:bg-orange-800 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-[8px] border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <div className="text-[8px] text-slate-400 dark:text-zinc-500 font-black uppercase mb-1">Asset ID</div>
                  <div className="text-zinc-800 dark:text-zinc-100 text-[12px] font-black truncate">{selectedFur?.assetId || '-'}</div>
                </div>
                <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-[8px] border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <div className="text-[8px] text-slate-400 dark:text-zinc-500 font-black uppercase mb-1">Status</div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded-full ${getStatusBulletColor(selectedFur?.status || 'Normal')}`} />
                    <div className="text-zinc-800 dark:text-zinc-100 text-[11px] font-black uppercase truncate">{selectedFur?.status || 'Normal'}</div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-[12px] shadow-lg space-y-3 text-white ${isRetired ? 'bg-zinc-400 dark:bg-zinc-700' : 'bg-zinc-800 dark:bg-zinc-900 border border-zinc-700 dark:border-zinc-800'}`}>
                <div className="flex justify-between items-center border-b border-white/10 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2"><ShoppingCart className="w-3 h-3 opacity-60" /><span className="text-[9px] font-black uppercase">Brand</span></div>
                  <span className="text-[11px] font-black uppercase">{selectedFur?.brand || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2"><Box className="w-3 h-3 opacity-60" /><span className="text-[9px] font-black uppercase">Model</span></div>
                  <span className="text-[11px] font-black uppercase">{selectedFur?.model || '-'}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-black uppercase tracking-widest text-[9px]">
              <Activity className="w-3.5 h-3.5" /> 
              <span>Asset Logs</span>
            </div>
            <button
              onClick={() => setShowAddLog(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 dark:bg-zinc-700 hover:bg-black dark:hover:bg-zinc-600 text-white rounded-[6px] transition-all shadow-md"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase">Add Log</span>
            </button>
          </div>
          
          <div className="bg-white/80 dark:bg-zinc-900/80 rounded-[10px] border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 shadow-sm">
            {currentPageLogs.length > 0 ? (
              currentPageLogs.map((log, i) => (
                <div key={i} className={`p-3 leading-tight group ${i === 0 ? 'border-l-[3px] border-zinc-300 dark:border-zinc-600' : ''}`}>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex gap-2.5 items-center justify-between">
                      <div className="flex gap-2.5 items-center">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getLogBulletColor(log.issue)} shadow-sm`} />
                        <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 shrink-0">{log.date}</span>
                        <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 tracking-tight">: {log.issue}</span>
                      </div>
                      {showDelete && (
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-0.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded text-zinc-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Log"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      )}
                    </div>
                    {log.contractor && (
                      <div className="ml-5 pl-2 border-l border-zinc-200 dark:border-zinc-700">
                        <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">BY: {log.contractor}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-300 dark:text-zinc-700 text-[10px] font-black uppercase italic">No logs recorded</div>
            )}
          </div>

          {sortedLogs.length > 0 && (
            <div className="text-center">
              <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                {sortedLogs.length} log{sortedLogs.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {showAddLog && (
          <AddLogModal
            assetId={selectedFur.id}
            assetDbId={(selectedFur as any).dbId}
            onClose={() => setShowAddLog(false)}
            onSuccess={handleLogAdded}
          />
        )}
      </div>
    );
  }

  if (contextRoom) {
    const stats = getRoomStats(allFurniture, contextRoom.id);
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-white/40 dark:bg-zinc-950/40">
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-[12px] border border-zinc-200 dark:border-zinc-800 shadow-md">
            <h3 className="text-2xl font-black tracking-tighter leading-tight text-zinc-900 dark:text-zinc-100">{contextRoom.name}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400 mt-1">Room Furniture Inventory</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
             <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[12px] shadow-sm text-center">
                <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase mb-2">Furniture Status</div>
                <div className="flex justify-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.green}</span>
                    <span className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase">Normal</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-rose-500 dark:text-rose-400">{stats.red}</span>
                    <span className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase">Broken</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedFloor) {
    const floorAssets = allFurniture.filter(f => f.floor === selectedFloor);
    return (
      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-white/40 dark:bg-zinc-950/40">
        <div className="p-4 bg-slate-100 dark:bg-zinc-900 rounded-[12px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
           <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100">FLOOR 0{selectedFloor}</h3>
           <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase mt-1">Furniture Overview</p>
        </div>
        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] shadow-sm">
           <div className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase mb-2 text-center">Total Furniture at Level 0{selectedFloor}</div>
           <div className="text-4xl font-black text-orange-700 dark:text-orange-500 text-center">{floorAssets.length}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
      <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4"><Armchair className="w-8 h-8 text-slate-400 dark:text-zinc-500" /></div>
      <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-relaxed">Select Floor, Room or Asset</p>
    </div>
  );
}
