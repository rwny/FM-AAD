import { Canvas } from '@react-three/fiber'
import {
  Building2, Info,
  Wind, Share2,
  PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, X,
  LayoutDashboard, ChevronRight
} from 'lucide-react'
import { Suspense, useState, useMemo, useEffect } from 'react'
import { BuildingModel } from './components/3d/BuildingModel'
import { SceneLighting } from './components/3d/SceneLighting'
import { SceneControls } from './components/3d/SceneControls'
import type { Room, ACAsset, BIMMode } from './types/bim'
import acSpecsJson from './utils/ac-specs.json'
import { tgfData } from './data/carrier-tgf'

// --- Mode Components ---
import { ArchLeftPanel, ArchRightPanel } from './components/modes/ArchMode'
import { FurnitureLeftPanel, FurnitureRightPanel } from './components/modes/FurnitureMode'
import { ACLeftPanel, ACRightPanel } from './components/modes/ACMode'
import { EELeftPanel, EERightPanel } from './components/modes/EEMode'
import { PrintReportModal } from './components/ui/PrintReportModal'
import { KGVisualizer3D } from './components/KGVisualizer3D'
import { GlobalSearch } from './components/search/GlobalSearch'
import { useGlobalSearch } from './hooks/useGlobalSearch'

// --- Scene Component ---

interface SceneProps {
  selectedRoomId: string | null;
  onRoomsFound: (rooms: Room[]) => void;
  onACFound: (assets: ACAsset[]) => void;
  onRoomClick: (id: string | null) => void;
  leftVisible: boolean;
  rightVisible: boolean;
  activeMode: BIMMode;
  clipFloor: number | null;
  buildingData: any;
  finalACAssets: ACAsset[];
}

function Scene({ selectedRoomId, onRoomsFound, onACFound, onRoomClick, leftVisible, rightVisible, activeMode, clipFloor, buildingData, finalACAssets }: SceneProps) {
  return (
    <>
      <SceneControls leftVisible={leftVisible} rightVisible={rightVisible} />
      
      <Suspense fallback={null}>
        <SceneLighting />
        <BuildingModel 
          url="/models/ar15-302.glb" 
          selectedRoomId={selectedRoomId} 
          onRoomsFound={onRoomsFound} 
          onACFound={onACFound}
          onRoomClick={onRoomClick} 
          activeMode={activeMode}
          clipFloor={clipFloor}
          buildingData={buildingData}
          finalACAssets={finalACAssets}
        />
      </Suspense>
    </>
  )
}

import { ProjectDashboard } from './components/ui/ProjectDashboard'

// --- Main App ---

function App() {
  const [activeMode, setActiveMode] = useState<BIMMode>('AR')
  const [rooms, setRooms] = useState<Room[]>([])
  const [acAssets, setAcAssets] = useState<ACAsset[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [expandedFloors, setExpandedFloors] = useState<{[key: number]: boolean}>({})
  const [showLeft, setShowLeft] = useState(true)
  const [showRight, setShowRight] = useState(true)
  const [clipFloor, setClipFloor] = useState<number | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [reportAsset, setReportAsset] = useState<any>(null)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [showDashboard, setShowDashboard] = useState(false)

  // Database State
  const [buildingData, setBuildingData] = useState<any>(acSpecsJson)
  const [acDbLogs, setAcDbLogs] = useState<any[]>([])
  const [kgNodes, setKgNodes] = useState<any[]>([])
  const [kgEdges, setKgEdges] = useState<any[]>([])
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        import('./utils/supabase').then(async ({ fetchBuildingData, fetchAllACLogs, supabase }) => {
            const data = await fetchBuildingData('AR15')
            if (data) setBuildingData(data)
    
            // Fetch logs & KG from Supabase
            const [logs, nodesRes, edgesRes] = await Promise.all([
                fetchAllACLogs(),
                supabase.from('kg_nodes').select('*'),
                supabase.from('kg_edges').select('*')
            ])
            
            setAcDbLogs(logs || [])
            setKgNodes(nodesRes.data || [])
            setKgEdges(edgesRes.data || [])
    
            setIsLive(true)
            console.log('📡 Connected to Supabase DBs')
        });
      } catch (err: any) {
        console.warn('⚠️ Supabase connection failed:', err.message)
      }
    }
    loadData()

    const handleRefresh = () => loadData()
    window.addEventListener('refresh-bim-data', handleRefresh)
    return () => window.removeEventListener('refresh-bim-data', handleRefresh)
  }, [])

  const finalACAssets = useMemo(() => {
    return acAssets.map(modelAsset => {
      const modelIdLow = modelAsset.id.toLowerCase();
      
      // 1. Look up in MD (ac-specs.json) - NEW PRIMARY SOURCE
      let mdMatch: any = null;
      let mdTypeInfo: any = null;
      
      for (const floorNum in acSpecsJson.floors) {
        const floorRooms = (acSpecsJson.floors as any)[floorNum];
        for (const roomNum in floorRooms) {
          const roomACs = floorRooms[roomNum];
          for (const acId in roomACs) {
            const acData = roomACs[acId];
            if (acData.units && acData.units.some((u: string) => {
              const uNormalized = u.toLowerCase().replace(/\./g, '-');
              const modelNormalized = modelIdLow.replace(/\./g, '-');
              return uNormalized === modelNormalized;
            })) {
              mdMatch = { ...acData, systemId: acId };
              mdTypeInfo = (acSpecsJson.types as any)[acData.type];
              break;
            }
          }
          if (mdMatch) break;
        }
        if (mdMatch) break;
      }

      // 2. Look up in KG (Supabase) - PREFER LIVE DATA
      const node = kgNodes.find(n => n.name.toLowerCase() === modelIdLow);
      let acType = mdMatch?.type || '';
      let assetIdStr = mdMatch?.assetId || modelAsset.id;
      let installDate = mdMatch?.installedDate || '';
      let matchedAcId = mdMatch?.systemId || '';

      if (node) {
         const edge = kgEdges.find(e => e.object_id === node.id && e.predicate === 'contains');
         const parentNode = edge ? kgNodes.find(n => n.id === edge.subject_id) : null;
         
         const meta = node.metadata || parentNode?.metadata || {};
         // Override with DB data if present
         if (meta.ac_type) acType = meta.ac_type;
         if (meta.asset_id) assetIdStr = meta.asset_id;
         if (meta.install_date) installDate = meta.install_date;
         if (parentNode) matchedAcId = parentNode.name;
      }

      // 3. Identify the Peer unit
      const currentPrefix = modelAsset.id.split('-')[0]?.toLowerCase();
      const currentNumber = modelAsset.id.split('-').slice(1).join('-'); // e.g. 101-1
      const peerPrefix = currentPrefix === 'fcu' ? 'cdu' : currentPrefix === 'cdu' ? 'fcu' : null;
      const peerId = peerPrefix ? `${peerPrefix}-${currentNumber}` : null;

      // 4. Collect Logs (Self only for precise history)
      const selfLogs = acDbLogs.filter(l => l.asset_id.toLowerCase() === modelIdLow);
      
      // 5. Collect Logs (System-wide for status/color propagation)
      const systemWideLogs = acDbLogs.filter(l => {
        const dbId = l.asset_id.toLowerCase();
        return dbId === modelIdLow || 
               (peerId && dbId === peerId.toLowerCase()) || 
               (matchedAcId && dbId === matchedAcId.toLowerCase());
      });
      
      // 6. Sort logs
      const sortedSelfLogs = [...selfLogs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      const sortedSystemLogs = [...systemWideLogs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

      // Status based on SYSTEM-WIDE state (Color propagation)
      let status = 'Normal';
      if (sortedSystemLogs.length > 0) {
        const latestLog = sortedSystemLogs[0];
        const issueText = (latestLog.issue || '').toLowerCase();
        const noteText = (latestLog.note || '').toLowerCase();
        
        if (latestLog.status === 'Completed') status = 'Normal';
        else if (latestLog.status === 'In Progress' || latestLog.status === 'Pending' || noteText.includes('พอใช้')) status = 'Maintenance';
        
        if (issueText.includes('เสีย') || issueText.includes('พัง') || issueText.includes('faulty') || latestLog.status === 'Faulty') status = 'Faulty';
      }

      // Specs lookup logic: MD Priority -> TGF Lookup -> Fallback
      let brand = mdTypeInfo?.brand || 'Carrier';
      let model = mdTypeInfo?.model || acType || '---';
      let capacity = mdTypeInfo?.capacity || '---';

      if (!mdTypeInfo && acType) {
        const typeInfo = (tgfData.models as any)[acType];
        if (typeInfo) {
          brand = typeInfo.Brand || brand;
          model = acType;
          capacity = typeInfo.NominalCoolingCapacity ? `${typeInfo.NominalCoolingCapacity} BTU/hr` : capacity;
        }
      }

      return {
        ...modelAsset,
        assetId: assetIdStr,
        acType: acType || 'Unknown',
        brand,
        model,
        capacity,
        install: installDate || '---',
        logs: sortedSelfLogs.map(l => ({
          id: l.id,
          date: l.date,
          created_at: l.created_at,
          issue: l.issue,
          reporter: l.reporter,
          status: l.status,
          note: l.note
        })),
        status: status as any,
        lastService: sortedSelfLogs.length > 0 ? sortedSelfLogs[0].date : ''
      }
    })
  }, [acAssets, acDbLogs, kgNodes, kgEdges])

  const allFurniture = useMemo(() => {
    const assets: any[] = [];
    if (!buildingData || !buildingData.floors) return assets;

    const floorsArray = Array.isArray(buildingData.floors) 
      ? buildingData.floors 
      : Object.entries(buildingData.floors).map(([num, data]: [string, any]) => ({ 
          floor: parseInt(num), 
          rooms: Object.entries(data).map(([rId]: [string, any]) => ({
            id: `rm-${rId}`,
            name: `Room ${rId}`,
            assets: [] // Furniture assets not in ac.md yet
          }))
        }));

    floorsArray.forEach((f: any, fIdx: number) => {
      const floorNum = f.floor || (fIdx + 1);
      if (f.rooms && Array.isArray(f.rooms)) {
        f.rooms.forEach((r: any) => {
          if (r.assets && Array.isArray(r.assets)) {
            r.assets.forEach((a: any) => {
              assets.push({
                ...a,
                floor: floorNum,
                room: r.id,
                status: a.status || a.currentStatus || 'Normal'
              });
            });
          }
        });
      }
    });
    return assets;
  }, [buildingData]);

  // Global Search
  const globalSearchResults = useGlobalSearch(
    searchQuery,
    rooms,
    finalACAssets,
    allFurniture,
    kgNodes,
    kgEdges
  )

  const handleGlobalSearchSelect = (result: any) => {
    // Switch to the mode of the result
    if (result.mode !== activeMode) {
      setActiveMode(result.mode)
    }
    
    // Select the item - resolve correct ID for highlighting + right panel
    if (result.type === 'room') {
      setSelectedRoomId(result.data.id)
    } else if (result.type === 'ac') {
      // Set selectedRoomId to the AC asset ID (e.g., "fcu-101-1") for 3D highlight
      setSelectedRoomId(result.data.id)
    } else if (result.type === 'furniture') {
      setSelectedRoomId(result.data.id)
    } else if (result.type === 'connection') {
      setActiveMode('KG')
    }
  }

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
  }

  const acStats = useMemo(() => {
    const stats = { green: 0, orange: 0, red: 0, total: finalACAssets.length };
    finalACAssets.forEach(a => {
      if (a.status === 'Maintenance' || a.status === 'Warning') stats.orange++;
      else if (a.status === 'Faulty') stats.red++;
      else stats.green++;
    });
    return stats;
  }, [finalACAssets]);


  const modes = [
    { id: 'AR', label: 'Arch', icon: Building2 },
    // { id: 'Fur', label: 'Fur', icon: Armchair }, // Hidden for now
    // { id: 'EE', label: 'Elec', icon: Zap }, // Hidden for now
    { id: 'AC', label: 'Air', icon: Wind },
    { id: 'KG', label: 'Graph', icon: Share2 },
  ]

  // --- Render Helpers ---
  const renderLeftPanel = () => {
    const commonProps = { 
      selectedRoomId, setSelectedRoomId, rooms, searchQuery, 
      expandedFloors, setExpandedFloors, clipFloor, setClipFloor,
      selectedFloor, setSelectedFloor, setShowDashboard
    };
    switch (activeMode) {
      case 'AR': return <ArchLeftPanel {...commonProps} finalACAssets={finalACAssets} />;
      case 'Fur': return <FurnitureLeftPanel {...commonProps} allFurniture={allFurniture} />;
      case 'AC': return <ACLeftPanel {...commonProps} finalACAssets={finalACAssets} />;
      case 'EE': return <EELeftPanel {...commonProps} />;
      default: return null;
    }
  }

  const renderRightPanel = () => {
    const commonProps = { 
      selectedRoomId, setSelectedRoomId, rooms, searchQuery, 
      expandedFloors, setExpandedFloors, clipFloor, setClipFloor,
      selectedFloor, setSelectedFloor, setReportAsset, setSelectedLog,
      setShowDashboard
    };
    switch (activeMode) {
      case 'AR': return <ArchRightPanel {...commonProps} finalACAssets={finalACAssets} />;
      case 'Fur': return <FurnitureRightPanel {...commonProps} allFurniture={allFurniture} />;
      case 'AC': return <ACRightPanel {...commonProps} finalACAssets={finalACAssets} />;
      case 'EE': return <EERightPanel {...commonProps} />;
      default: return null;
    }
  }

  return (
    <div className="relative h-screen w-screen bg-sky-50 overflow-hidden font-sans select-none flex text-slate-900 p-[10px] gap-[10px]">
      {/* Dashboard Overlay */}
      {showDashboard && (
        <ProjectDashboard 
          assets={finalACAssets}
          rooms={rooms}
          onSelect={(id) => {
            setSelectedRoomId(id);
            setShowDashboard(false);
            // Also ensure we are in AC mode if it's an AC asset
            if (id.startsWith('fcu') || id.startsWith('cdu')) {
              setActiveMode('AC');
            }
          }}
          onClose={() => setShowDashboard(false)}
        />
      )}

      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#7dd3fc] to-[#f0f9ff]">
        {activeMode === 'KG' && <KGVisualizer3D />}
        <div style={{ display: activeMode === 'KG' ? 'none' : 'block', width: '100%', height: '100%' }}>
          <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}>
          <color attach="background" args={['#bae6fd']} />
          <Scene 
            selectedRoomId={selectedRoomId} 
            onRoomsFound={setRooms} 
            onACFound={setAcAssets}
            onRoomClick={setSelectedRoomId}
            leftVisible={showLeft}
            rightVisible={showRight}
            activeMode={activeMode}
            clipFloor={clipFloor}
            buildingData={buildingData}
            finalACAssets={finalACAssets}
          />
        </Canvas>
        </div>
      </div>

      {!showLeft && (
        <button 
          onClick={() => setShowLeft(true)} 
          className="absolute left-[20px] top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md rounded-[10px] border border-slate-200 shadow-lg z-20 text-indigo-600 hover:bg-white transition-all"
        >
          <PanelLeft className="w-6 h-6" />
        </button>
      )}

      <aside className={`relative w-[280px] flex flex-col bg-white/80 backdrop-blur-xl z-10 rounded-[10px] border border-slate-200 shadow-xl overflow-hidden pointer-events-auto shrink-0 transition-all duration-500 ease-in-out ${showLeft ? 'translate-x-0 opacity-100' : '-translate-x-[300px] opacity-0'}`}>
        <header className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded-[4px] flex items-center justify-center shadow-md"><Building2 className="w-3.5 h-3.5 text-white" /></div>
              <h1 className="text-xs font-black tracking-tight leading-none text-slate-800 uppercase italic">FM_AR15</h1>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                {isLive ? 'Live DB' : 'Local Data'}
              </span>
            </div>
          </div>
          <button onClick={() => setShowLeft(false)} className="p-1 hover:bg-slate-200 rounded-[4px] text-slate-400 transition-colors"><PanelLeftClose className="w-3.5 h-3.5" /></button>
        </header>

        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/30 border-b border-slate-100">
          {modes.map((m) => (
            <button 
              key={m.id} 
              onClick={() => { 
                setActiveMode(m.id as BIMMode); 
                setSelectedRoomId(null); 
                setClipFloor(null); 
                setExpandedFloors({}); 
                setSelectedFloor(null);
                setSearchQuery('');
                if (m.id === 'KG') {
                  setShowLeft(false);
                  setShowRight(false);
                } else {
                  setShowLeft(true);
                }
              }} 
              className={`flex flex-col items-center justify-center gap-1 py-4 rounded-[12px] transition-all ${
                activeMode === m.id 
                  ? 'bg-white shadow-md text-indigo-600 ring-1 ring-slate-200' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              <m.icon className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-tight">{m.label}</span>
            </button>
          ))}
        </div>

        <nav className="flex-1 p-2 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          {/* Dashboard Trigger Section - Position Consistent across modes */}
          {activeMode === 'AC' && (
            <button 
              onClick={() => setShowDashboard(true)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] transition-all border bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 group shrink-0"
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-wider italic">AC-DASHBOARD</span>
              </div>
              <div className="flex gap-1">
                {acStats.red > 0 && <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
                {acStats.orange > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                <ChevronRight className="w-3 h-3 text-indigo-300 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          )}

          {activeMode === 'AR' && (
            <button 
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] transition-all border bg-slate-800 border-slate-700 text-white hover:bg-slate-900 shadow-lg shadow-slate-100 group shrink-0"
              onClick={() => {/* ARCH Dashboard Placeholder */}}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-wider italic">ARCH-DASHBOARD</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          )}
          
          <GlobalSearch
            query={searchQuery}
            onQueryChange={handleSearchChange}
            results={globalSearchResults}
            onSelect={handleGlobalSearchSelect}
          />
          {renderLeftPanel()}
        </nav>
      </aside>

      <main className="flex-1 pointer-events-none" />

      {!showRight && (
        <button 
          onClick={() => setShowRight(true)} 
          className="absolute right-[20px] top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-md rounded-[8px] border border-slate-200 shadow-lg z-20 text-indigo-600 hover:bg-white transition-all"
        >
          <PanelRight className="w-5 h-5" />
        </button>
      )}

      <aside className={`relative w-[300px] flex flex-col bg-white/80 backdrop-blur-xl z-10 rounded-[10px] border border-slate-200 shadow-xl pointer-events-auto shrink-0 transition-all duration-500 ease-in-out ${showRight ? 'translate-x-0 opacity-100' : 'translate-x-[320px] opacity-0'}`}>
        <header className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-50 rounded-[4px] flex items-center justify-center border border-indigo-100"><Info className="w-3.5 h-3.5 text-indigo-600" /></div>
            <h1 className="text-xs font-black tracking-tight text-slate-800 uppercase italic">BIM Explorer</h1>
          </div>
          <button onClick={() => setShowRight(false)} className="p-1 hover:bg-slate-200 rounded-[4px] text-slate-400 transition-colors"><PanelRightClose className="w-3.5 h-3.5" /></button>
        </header>
        {renderRightPanel()}
      </aside>


      {reportAsset && (
        <PrintReportModal 
          asset={reportAsset} 
          onClose={() => setReportAsset(null)} 
        />
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  selectedLog.status === 'Completed' ? 'bg-emerald-500' : 
                  selectedLog.status === 'Faulty' ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Maintenance Activity Detail</h2>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Date & Time</div>
                  <div className="text-xl font-black text-slate-900">{selectedLog.date} <span className="text-indigo-400 ml-2">{new Date(selectedLog.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span></div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reporter</div>
                  <div className="text-xl font-black text-indigo-600">{selectedLog.reporter || '---'}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Issue / Activity</div>
                <div className="text-2xl font-black text-slate-800 leading-tight">{selectedLog.issue}</div>
              </div>
              <div className="space-y-2 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Notes & Remarks</div>
                <div className="text-lg font-bold text-slate-600 leading-relaxed italic">{selectedLog.note || 'No additional notes provided for this record.'}</div>
              </div>
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex justify-end">
              <button onClick={() => setSelectedLog(null)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-slate-800 transition-all">Close Detail</button>
            </div>
          </div>
        </div>
      )}
      {/* Version Tag */}
      <div className="absolute bottom-3 right-4 z-[100] text-[10px] font-mono font-bold text-slate-400/80 pointer-events-none select-none mix-blend-difference">
        rw-0.3.24
      </div>
    </div>
  )
}

export default App
