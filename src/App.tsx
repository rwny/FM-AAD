import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Sky, OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei'
import { 
  Building2, Box, Search, Camera as CameraIcon, 
  ChevronDown, X, Info, User, Tag, Phone, ShoppingCart, ListChecks,
  Armchair, Zap, Wind, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Activity, Calendar
} from 'lucide-react'
import { Suspense, useRef, useEffect, useState, useMemo } from 'react'
import { BuildingModel } from './components/3d/BuildingModel'
import type { Room, ACAsset, FurnitureAsset } from './types/bim'
import { mockACAssets as initialMockAC } from './utils/mockData'
import buildingJson from './utils/AR15.json'
import * as THREE from 'three'

// Import Mode Components
import { ArchLeftPanel, ArchRightPanel } from './components/modes/ArchMode'
import { FurnitureLeftPanel, FurnitureRightPanel } from './components/modes/FurnitureMode'
import { ACLeftPanel, ACRightPanel } from './components/modes/ACMode'
import { EELeftPanel, EERightPanel } from './components/modes/EEMode'

// --- Components ---

function ScreenshotHandler() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    const takeScreenshot = () => {
      gl.render(scene, camera)
      const dataUrl = gl.domElement.toDataURL('image/png')
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      link.download = `BIM_AR15_Capture_${timestamp}.png`
      link.href = dataUrl
      link.click()
    }
    const handleCustomEvent = () => takeScreenshot()
    window.addEventListener('take-screenshot', handleCustomEvent)
    return () => window.removeEventListener('take-screenshot', handleCustomEvent)
  }, [gl, scene, camera])
  return null
}

function CameraOffset({ leftVisible, rightVisible, sidebarWidth }: { leftVisible: boolean, rightVisible: boolean, sidebarWidth: number }) {
  const { camera, size } = useThree()
  const currentOffset = useRef(0)
  useFrame(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const l = leftVisible ? sidebarWidth : 0
      const r = rightVisible ? sidebarWidth : 0
      const targetOffset = (r - l) / 2
      currentOffset.current = THREE.MathUtils.lerp(currentOffset.current, targetOffset, 0.1)
      camera.setViewOffset(size.width, size.height, currentOffset.current, 0, size.width, size.height)
      camera.updateProjectionMatrix()
    }
  })
  return null
}

interface SceneProps {
  selectedRoomId: string | null;
  onRoomsFound: (rooms: Room[]) => void;
  onACFound: (assets: ACAsset[]) => void;
  onRoomClick: (roomId: string | null) => void;
  leftVisible: boolean;
  rightVisible: boolean;
  activeMode: string;
  clipFloor: number | null;
}

function Scene({ selectedRoomId, onRoomsFound, onACFound, onRoomClick, leftVisible, rightVisible, activeMode, clipFloor }: SceneProps) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[-26.1, 14.766, 17.229]} fov={45} />
      <CameraOffset leftVisible={leftVisible} rightVisible={rightVisible} sidebarWidth={240} />
      <OrbitControls makeDefault minDistance={2} maxDistance={150} enableDamping={true} target={[0, 0, 0]} maxPolarAngle={Math.PI / 2.05} />
      <ScreenshotHandler />
      <ambientLight intensity={0.8} />
      <directionalLight position={[40, 60, 40]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-100} shadow-camera-right={100} shadow-camera-top={100} shadow-camera-bottom={-100} />
      <Suspense fallback={null}>
        <BuildingModel 
          url="/models/ar15-301.glb" 
          selectedRoomId={selectedRoomId} 
          onRoomsFound={onRoomsFound} 
          onACFound={onACFound}
          onRoomClick={onRoomClick} 
          activeMode={activeMode}
          clipFloor={clipFloor}
        />
        <Environment preset="apartment" />
        <ContactShadows position={[0, -0.01, 0]} opacity={0.2} scale={100} blur={2.5} far={15} color="#334155" />
      </Suspense>
    </>
  )
}

// --- Main App ---

type BIMMode = 'AR' | 'Fur' | 'EE' | 'AC';

function App() {
  const [activeMode, setActiveMode] = useState<BIMMode>('AR')
  const [rooms, setRooms] = useState<Room[]>([])
  const [acAssets, setAcAssets] = useState<ACAsset[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [expandedFloors, setExpandedFloors] = useState<{[key: number]: boolean}>({ 1: true, 2: true })
  const [showLeft, setShowLeft] = useState(true)
  const [showRight, setShowRight] = useState(true)
  const [clipFloor, setClipFloor] = useState<number | null>(null)

  const finalACAssets = useMemo(() => {
    const STATUS_PRIORITY: Record<string, number> = { 'Faulty': 3, 'Warning': 2, 'Maintenance': 1, 'Normal': 0 };
    const merged = acAssets.map(modelAsset => {
      const mockDetail = initialMockAC.find(m => m.id.toLowerCase() === modelAsset.id.toLowerCase())
      return mockDetail ? { ...modelAsset, ...mockDetail } : modelAsset
    });
    const groupStatus: Record<string, string> = {};
    merged.forEach(asset => {
      const suffix = asset.id.split('-')[1];
      if (suffix) {
        const currentStatus = asset.status || 'Normal';
        const existingStatus = groupStatus[suffix] || 'Normal';
        if (STATUS_PRIORITY[currentStatus] > STATUS_PRIORITY[existingStatus]) groupStatus[suffix] = currentStatus;
      }
    });
    return merged.map(asset => {
      const suffix = asset.id.split('-')[1];
      if (suffix && groupStatus[suffix]) return { ...asset, status: groupStatus[suffix] as any };
      return asset;
    });
  }, [acAssets])

  const allFurniture = useMemo(() => {
    const assets: any[] = [];
    buildingJson.floors.forEach((f: any, fIdx: number) => {
      const floorNum = parseInt(f.name.replace('FLOOR ', '')) || (fIdx + 1);
      f.rooms.forEach((r: any) => {
        r.assets.forEach((a: any) => {
          assets.push({
            ...a,
            floor: floorNum,
            room: r.id,
            status: a.currentStatus || 'Normal'
          });
        });
      });
    });
    return assets;
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    if (val.trim() === '') {
      if (activeMode === 'AR') setSelectedRoomId(null);
      return;
    }
    
    if (activeMode === 'AR') {
      const match = rooms.find(room => room.number.includes(val) || room.name.toLowerCase().includes(val.toLowerCase()))
      if (match) setSelectedRoomId(match.id)
    } else if (activeMode === 'AC') {
      const match = finalACAssets.find(a => a.id.includes(val.toLowerCase()) || a.name.toLowerCase().includes(val.toLowerCase()))
      if (match) setSelectedRoomId(match.id)
    } else if (activeMode === 'Fur') {
      const match = allFurniture.find(a => a.id.toLowerCase().includes(val.toLowerCase()) || (a.typeName || '').toLowerCase().includes(val.toLowerCase()))
      if (match) setSelectedRoomId(match.id)
    }
  }

  const handleCapture = () => window.dispatchEvent(new CustomEvent('take-screenshot'))

  const modes = [
    { id: 'AR', label: 'Arch', icon: Building2 },
    { id: 'Fur', label: 'Fur', icon: Armchair },
    { id: 'EE', label: 'Elec', icon: Zap },
    { id: 'AC', label: 'Air', icon: Wind },
  ]

  // --- Render Helpers ---
  const renderLeftPanel = () => {
    const commonProps = { selectedRoomId, setSelectedRoomId, rooms, searchQuery, expandedFloors, setExpandedFloors, clipFloor, setClipFloor };
    switch (activeMode) {
      case 'AR': return <ArchLeftPanel {...commonProps} />;
      case 'Fur': return <FurnitureLeftPanel {...commonProps} allFurniture={allFurniture} />;
      case 'AC': return <ACLeftPanel {...commonProps} finalACAssets={finalACAssets} />;
      case 'EE': return <EELeftPanel {...commonProps} />;
      default: return null;
    }
  }

  const renderRightPanel = () => {
    const commonProps = { selectedRoomId, setSelectedRoomId, rooms, searchQuery, expandedFloors, setExpandedFloors, clipFloor, setClipFloor };
    switch (activeMode) {
      case 'AR': return <ArchRightPanel {...commonProps} />;
      case 'Fur': return <FurnitureRightPanel {...commonProps} allFurniture={allFurniture} />;
      case 'AC': return <ACRightPanel {...commonProps} finalACAssets={finalACAssets} />;
      case 'EE': return <EERightPanel {...commonProps} />;
      default: return null;
    }
  }

  return (
    <div className="relative h-screen w-screen bg-sky-50 overflow-hidden font-sans select-none flex text-slate-900 p-[10px] gap-[10px]">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#7dd3fc] to-[#f0f9ff]">
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
          />
          <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0} azimuth={0.25} turbidity={0.05} rayleigh={0.3} />
        </Canvas>
      </div>

      {!showLeft && (<button onClick={() => setShowLeft(true)} className="absolute left-[20px] top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md rounded-[10px] border border-slate-200 shadow-lg z-20 text-indigo-600 hover:bg-white transition-all"><PanelLeft className="w-6 h-6" /></button>)}

      <aside className={`relative w-[240px] flex flex-col bg-white/80 backdrop-blur-xl z-10 rounded-[10px] border border-slate-200 shadow-xl overflow-hidden pointer-events-auto shrink-0 transition-all duration-500 ease-in-out ${showLeft ? 'translate-x-0 opacity-100' : '-translate-x-[260px] opacity-0'}`}>
        <header className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-[4px] flex items-center justify-center shadow-md"><Building2 className="w-3.5 h-3.5 text-white" /></div>
            <h1 className="text-xs font-black tracking-tight leading-none text-slate-800 uppercase italic">FM_AR15</h1>
          </div>
          <button onClick={() => setShowLeft(false)} className="p-1 hover:bg-slate-200 rounded-[4px] text-slate-400 transition-colors"><PanelLeftClose className="w-3.5 h-3.5" /></button>
        </header>
        
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/30 border-b border-slate-100">
          {modes.map((m) => (
            <button 
              key={m.id} 
              onClick={() => { setActiveMode(m.id as BIMMode); setSelectedRoomId(null); setClipFloor(null); }} 
              className={`flex flex-col items-center justify-center gap-1 py-4 rounded-[12px] transition-all ${
                activeMode === m.id 
                  ? 'bg-white shadow-md text-indigo-600 ring-1 ring-slate-200' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              <m.icon className="w-10 h-10" />
              <span className="text-[10px] font-black uppercase tracking-tight">{m.label}</span>
            </button>
          ))}
        </div>

        <nav className="flex-1 p-2 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          <div className="relative group">
            <Search className="absolute left-2.5 top-2 w-3 h-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} placeholder={`Search...`} className="w-full bg-white/50 border border-slate-200 rounded-[6px] py-2 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all text-slate-700" />
          </div>
          {renderLeftPanel()}
        </nav>
      </aside>

      <main className="flex-1 pointer-events-none relative" />

      {!showRight && (<button onClick={() => setShowRight(true)} className="absolute right-[20px] top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-md rounded-[8px] border border-slate-200 shadow-lg z-20 text-indigo-600 hover:bg-white transition-all"><PanelRight className="w-5 h-5" /></button>)}

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

      <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2 flex gap-3 z-10 pointer-events-none items-center">
        <button onClick={handleCapture} className="p-2.5 bg-white/95 border border-slate-200 rounded-[6px] shadow-xl text-slate-400 hover:text-indigo-600 transition-all pointer-events-auto flex items-center justify-center" title="Capture Screenshot"><CameraIcon className="w-4 h-4" /></button>
        <div className="px-4 py-2.5 bg-white/95 border border-slate-200 rounded-[6px] shadow-xl flex items-center gap-4 pointer-events-auto text-[8px] font-black text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1 text-blue-500">Orbit <span className="text-slate-300 italic">L-Click</span></div>
          <div className="w-0.5 h-0.5 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-1 text-blue-500">Pan <span className="text-slate-300 italic">R-Click</span></div>
          <div className="w-0.5 h-0.5 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-1 text-indigo-500">Zoom <span className="text-slate-300 italic">Scroll</span></div>
        </div>
      </div>
    </div>
  )
}

export default App
