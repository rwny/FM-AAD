import { Canvas } from '@react-three/fiber'
import {
  Building2,
  Wind, Share2,
  PanelLeftClose, PanelLeft, X,
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
import { ProjectDashboard } from './components/ui/ProjectDashboard'

// --- Scene Component ---

interface SceneProps {
  selectedRoomId: string | null;
  onRoomsFound: (rooms: Room[]) => void;
  onACFound: (assets: ACAsset[]) => void;
  onRoomClick: (id: string | null) => void;
  leftVisible: boolean;
  activeMode: BIMMode;
  clipFloor: number | null;
  buildingData: any;
  finalACAssets: ACAsset[];
}

function Scene({ selectedRoomId, onRoomsFound, onACFound, onRoomClick, leftVisible, activeMode, clipFloor, buildingData, finalACAssets }: SceneProps) {
  return (
    <>
      <SceneControls leftVisible={leftVisible} rightVisible={false} />
      
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

// --- Main App ---

function App() {
  const [activeMode, setActiveMode] = useState<BIMMode>('AR')
  const [rooms, setRooms] = useState<Room[]>([])
  const [acAssets, setAcAssets] = useState<ACAsset[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [expandedFloors, setExpandedFloors] = useState<{[key: number]: boolean}>({})
  const [showLeft, setShowLeft] = useState(true)
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
    // 0. Pre-calculate Specification Map for O(1) lookup
    const specsMap: { [key: string]: { spec: any, typeInfo: any, systemId: string } } = {};
    if (acSpecsJson.floors) {
      Object.values(acSpecsJson.floors).forEach((floorRooms: any) => {
        Object.values(floorRooms).forEach((roomACs: any) => {
          Object.entries(roomACs).forEach(([acId, acData]: [string, any]) => {
            if (acData.units) {
              acData.units.forEach((u: string) => {
                const normalizedU = u.toLowerCase().replace(/\./g, '-');
                specsMap[normalizedU] = { 
                  spec: acData, 
                  typeInfo: (acSpecsJson.types as any)[acData.type],
                  systemId: acId
                };
              });
            }
          });
        });
      });
    }

    return acAssets.map(modelAsset => {
      const modelIdLow = modelAsset.id.toLowerCase();
      const modelNormalized = modelIdLow.replace(/\./g, '-');
      
      // 1. Look up in Spec Map (Extremely Fast)
      const mdMatchData = specsMap[modelNormalized];
      const mdMatch = mdMatchData?.spec;
      const mdTypeInfo = mdMatchData?.typeInfo;
      let matchedAcId = mdMatchData?.systemId || '';

      // 2. Look up in KG (Supabase) - PREFER LIVE DATA
      const node = kgNodes.find(n => n.name.toLowerCase() === modelIdLow);
      let acType = mdMatch?.type || '';
      let assetIdStr = mdMatch?.assetId || modelAsset.id;
      let installDate = mdMatch?.installedDate || '';

      if (node) {
         const edge = kgEdges.find(e => e.object_id === node.id && e.predicate === 'contains');
         const parentNode = edge ? kgNodes.find(n => n.id === edge.subject_id) : null;
         
         const meta = node.metadata || parentNode?.metadata || {};
         if (meta.ac_type) acType = meta.ac_type;
         if (meta.asset_id) assetIdStr = meta.asset_id;
         if (meta.install_date) installDate = meta.install_date;
         if (parentNode) matchedAcId = parentNode.name;
      }

      // 3. Identify the Peer unit
      const currentPrefix = modelAsset.id.split('-')[0]?.toLowerCase();
      const currentNumber = modelAsset.id.split('-').slice(1).join('-');
      const peerPrefix = currentPrefix === 'fcu' ? 'cdu' : currentPrefix === 'cdu' ? 'fcu' : null;
      const peerId = peerPrefix ? `${peerPrefix}-${currentNumber}` : null;

      // 4. Collect Logs (Self only)
      const normalizedModelId = modelIdLow.replace(/[^a-z0-9]/g, '');
      const selfLogs = acDbLogs.filter(l => l.asset_id.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedModelId);
      
      // 5. Collect Logs (System-wide)
      const systemWideLogs = acDbLogs.filter(l => {
        const dbId = l.asset_id.toLowerCase().replace(/[^a-z0-9]/g, '');
        const pId = peerId ? peerId.toLowerCase().replace(/[^a-z0-9]/g, '') : null;
        const sId = matchedAcId ? matchedAcId.toLowerCase().replace(/[^a-z0-9]/g, '') : null;
        return dbId === normalizedModelId || (pId && dbId === pId) || (sId && dbId === sId);
      });
      
      const sortedSelfLogs = [...selfLogs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      const sortedSystemLogs = [...systemWideLogs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

      let status = 'Normal';
      if (sortedSelfLogs.length > 0) {
        const latestLog = sortedSelfLogs[0];
        const issueText = (latestLog.issue || '').toLowerCase();
        if (latestLog.status === 'Completed') status = 'Normal';
        else if (['In Progress', 'Pending'].includes(latestLog.status)) status = 'Maintenance';
        if (issueText.includes('เสีย') || issueText.includes('พัง') || issueText.includes('faulty') || latestLog.status === 'Faulty') status = 'Faulty';
      } 

      let systemStatus = 'Normal';
      if (sortedSystemLogs.length > 0) {
        const latestSysLog = sortedSystemLogs[0];
        const sysIssueText = (latestSysLog.issue || '').toLowerCase();
        if (latestSysLog.status === 'Completed') systemStatus = 'Normal';
        else if (['In Progress', 'Pending'].includes(latestSysLog.status)) systemStatus = 'Maintenance';
        if (sysIssueText.includes('เสีย') || sysIssueText.includes('พัง') || sysIssueText.includes('faulty') || latestSysLog.status === 'Faulty') systemStatus = 'Faulty';
      }

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
        brand, model, capacity,
        install: installDate || '---',
        logs: sortedSelfLogs.map(l => ({ id: l.id, date: l.date, created_at: l.created_at, issue: l.issue, reporter: l.reporter, contractor: l.contractor, status: l.status, note: l.note })),
        status: status as any,
        systemStatus: systemStatus as any,
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
        {activeMode === 'KG' && (
          <KGVisualizer3D />
        )}
        <div style={{ display: activeMode === 'KG' ? 'none' : 'block', width: '100%', height: '100%' }}>
          <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}>
          <color attach="background" args={['#bae6fd']} />
          <Scene 
            selectedRoomId={selectedRoomId} 
            onRoomsFound={setRooms} 
            onACFound={setAcAssets}
            onRoomClick={setSelectedRoomId}
            leftVisible={showLeft}
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
          className="absolute left-[20px] top-[20px] px-2.5 py-1.5 bg-[#0f1117] border border-white/10 rounded-[5px] shadow-xl z-20 text-white/40 hover:text-white/80 transition-all font-mono flex items-center gap-1.5"
        >
          <PanelLeft className="w-3.5 h-3.5" />
          <span className="text-[8px] font-black uppercase tracking-widest">Menu</span>
        </button>
      )}

      <aside className={`relative w-[280px] flex flex-col bg-[#0f1117] z-10 rounded-[8px] border border-white/10 shadow-2xl overflow-hidden pointer-events-auto shrink-0 font-mono transition-all duration-500 ease-in-out ${showLeft ? 'translate-x-0 opacity-100' : '-translate-x-[300px] opacity-0'}`}>

        {/* ── Header ── */}
        <header className="px-3 py-2 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-black tracking-widest text-white uppercase">FM_AR15</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-white/20'}`} />
          </div>
          <button onClick={() => setShowLeft(false)} className="text-white/20 hover:text-white/60 transition-colors">
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </header>

        {/* ── Mode switcher ── */}
        <div className="flex border-b border-white/10 shrink-0">
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
                if (m.id === 'KG') setShowLeft(false);
                else setShowLeft(true);
              }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all border-r border-white/10 last:border-r-0 ${
                activeMode === m.id
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-white/25 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              <m.icon className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
            </button>
          ))}
        </div>

        {/* ── Dashboard button ── */}
        {(activeMode === 'AC' || activeMode === 'AR') && (
          <div className="border-b border-white/10 shrink-0">
            {activeMode === 'AC' && (
              <button
                onClick={() => setShowDashboard(true)}
                className="w-full flex items-center justify-between px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-3 h-3 text-indigo-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest">AC_DASHBOARD</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {acStats.red > 0 && <span className="text-[8px] font-black text-rose-400">{acStats.red}F</span>}
                  {acStats.orange > 0 && <span className="text-[8px] font-black text-amber-400">{acStats.orange}M</span>}
                  <ChevronRight className="w-3 h-3 opacity-30 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            )}
            {activeMode === 'AR' && (
              <button
                onClick={() => {}}
                className="w-full flex items-center justify-between px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-3 h-3 text-slate-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest">ARCH_DASHBOARD</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-30 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all" />
              </button>
            )}
          </div>
        )}

        {/* ── Data panel ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          {selectedRoomId || selectedFloor !== null
            ? renderRightPanel()
            : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
                <Building2 className="w-5 h-5 text-white/10" />
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-relaxed">
                  Click 3D<br />to explore
                </p>
              </div>
            )
          }
        </div>
      </aside>

      <main className="flex-1 pointer-events-none" />


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
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Contractor</div>
                  <div className="text-xl font-black text-amber-600">{selectedLog.contractor || '---'}</div>
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
        rw-0.3.29
      </div>
    </div>
  )
}

export default App
