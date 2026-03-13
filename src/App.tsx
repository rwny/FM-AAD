import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Sky, OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei'
import { 
  Building2, Box, Search, Camera as CameraIcon, 
  ChevronDown, X, Info, User, Tag, 
  Armchair, Zap, Wind, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Activity
} from 'lucide-react'
import { Suspense, useRef, useEffect, useState, useMemo } from 'react'
import { BuildingModel } from './components/3d/BuildingModel'
import type { Room, ACAsset } from './types/bim'
import { mockACAssets as initialMockAC } from './utils/mockData'
import * as THREE from 'three'

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
}

function Scene({ selectedRoomId, onRoomsFound, onACFound, onRoomClick, leftVisible, rightVisible, activeMode }: SceneProps) {
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

  const finalACAssets = useMemo(() => {
    return acAssets.map(modelAsset => {
      const mockDetail = initialMockAC.find(m => m.id.toLowerCase() === modelAsset.id.toLowerCase())
      return mockDetail ? { ...modelAsset, ...mockDetail } : modelAsset
    })
  }, [acAssets])

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    if (val.trim() === '' && activeMode === 'AR') { setSelectedRoomId(null); return; }
    if (activeMode === 'AR') {
      const match = rooms.find(room => room.number.includes(val) || room.name.toLowerCase().includes(val.toLowerCase()))
      if (match) setSelectedRoomId(match.id)
    } else if (activeMode === 'AC') {
      const match = finalACAssets.find(a => a.id.includes(val.toLowerCase()) || a.name.toLowerCase().includes(val.toLowerCase()))
      if (match) setSelectedRoomId(match.id)
    }
  }

  const floors = useMemo(() => {
    const filtered = rooms.filter(room => room.name.toLowerCase().includes(searchQuery.toLowerCase()) || room.number.includes(searchQuery))
    const groups: { [key: number]: Room[] } = {}
    filtered.forEach(room => {
      if (!groups[room.floor]) groups[room.floor] = []
      groups[room.floor].push(room)
    })
    return groups
  }, [rooms, searchQuery])

  const filteredAC = useMemo(() => finalACAssets.filter(a => a.id.includes(searchQuery.toLowerCase()) || a.name.toLowerCase().includes(searchQuery.toLowerCase())), [finalACAssets, searchQuery])
  const selectedRoom = useMemo(() => rooms.find(r => r.id === selectedRoomId), [rooms, selectedRoomId])
  const selectedAC = useMemo(() => finalACAssets.find(a => a.id === selectedRoomId), [finalACAssets, selectedRoomId])

  const handleCapture = () => window.dispatchEvent(new CustomEvent('take-screenshot'))

  const modes = [
    { id: 'AR', label: 'Arch', icon: Building2 },
    { id: 'Fur', label: 'Fur', icon: Armchair },
    { id: 'EE', label: 'Elec', icon: Zap },
    { id: 'AC', label: 'Air', icon: Wind },
  ]

  return (
    <div className="relative h-screen w-screen bg-sky-50 overflow-hidden font-sans select-none flex text-slate-900 p-[10px] gap-[10px]">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#7dd3fc] to-[#f0f9ff]">
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }}>
          <color attach="background" args={['#bae6fd']} />
          <Scene 
            selectedRoomId={selectedRoomId} 
            onRoomsFound={setRooms} 
            onACFound={setAcAssets}
            onRoomClick={setSelectedRoomId}
            leftVisible={showLeft}
            rightVisible={showRight}
            activeMode={activeMode}
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
        
        <div className="grid grid-cols-4 gap-0.5 p-1.5 bg-slate-100/30 border-b border-slate-100">
          {modes.map((m) => (
            <button key={m.id} onClick={() => { setActiveMode(m.id as BIMMode); setSelectedRoomId(null); }} className={`flex flex-col items-center gap-0.5 p-1 rounded-[4px] transition-all ${activeMode === m.id ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
              <m.icon className="w-3 h-3" />
              <span className="text-[7px] font-black uppercase tracking-tighter">{m.label}</span>
            </button>
          ))}
        </div>

        <nav className="flex-1 p-2 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          <div className="relative group">
            <Search className="absolute left-2.5 top-2 w-3 h-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} placeholder={`Search...`} className="w-full bg-white/50 border border-slate-200 rounded-[6px] py-1.5 pl-8 pr-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all text-slate-700" />
          </div>

          <div className="space-y-2">
            {activeMode === 'AR' ? (
              <div className="space-y-1">
                {Object.keys(floors).sort().map((floorStr) => {
                  const floorNum = parseInt(floorStr);
                  const isExpanded = expandedFloors[floorNum] !== false;
                  return (
                    <div key={floorNum} className="space-y-0.5">
                      <button onClick={() => setExpandedFloors(prev => ({...prev, [floorNum]: !isExpanded}))} className={`w-full flex items-center justify-between px-2 py-1 rounded-[4px] transition-all ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-0 text-blue-500' : '-rotate-90'}`} />
                          <span className={`text-[9px] font-black uppercase tracking-wider ${isExpanded ? 'text-slate-800' : ''}`}>Floor 0{floorNum}</span>
                        </div>
                        <span className="text-[8px] font-bold text-slate-400">{floors[floorNum].length}</span>
                      </button>
                      {isExpanded && (
                        <div className="ml-1.5 pl-2.5 border-l border-slate-100 space-y-0.5 py-0.5">
                          {floors[floorNum].map((room) => (
                            <div key={room.id} onClick={() => setSelectedRoomId(room.id)} className={`px-2 py-1 rounded-[4px] flex items-center gap-2 cursor-pointer transition-all ${room.id === selectedRoomId ? 'bg-indigo-100 text-indigo-700 font-black' : 'hover:bg-slate-100/50 text-slate-500 hover:text-slate-800'}`}>
                              <Box className={`w-2.5 h-3.5 ${room.id === selectedRoomId ? 'text-indigo-600' : 'text-slate-300'}`} />
                              <span className="text-[10px] font-bold tracking-tight">{room.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : activeMode === 'AC' ? (
              <div className="space-y-0.5">
                {filteredAC.map((asset) => {
                  const isSelected = asset.id === selectedRoomId;
                  const statusBg = asset.status === 'Maintenance' ? 'bg-amber-50' : asset.status === 'Faulty' ? 'bg-rose-50' : 'bg-transparent';
                  const statusText = asset.status === 'Maintenance' ? 'text-amber-700' : asset.status === 'Faulty' ? 'text-rose-700' : 'text-slate-600';
                  
                  return (
                    <div key={asset.id} onClick={() => setSelectedRoomId(asset.id)} className={`px-2 py-1.5 rounded-[4px] flex items-center justify-between gap-2 cursor-pointer transition-all ${isSelected ? 'bg-indigo-100 ring-1 ring-indigo-200 z-10' : `${statusBg} hover:bg-slate-100/80`}`}>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Wind className={`w-3 h-3 shrink-0 ${isSelected ? 'text-indigo-600' : (asset.status === 'Normal' ? 'text-slate-300' : statusText)}`} />
                        <div className="truncate">
                          <div className={`text-[12px] font-black leading-tight ${isSelected ? 'text-indigo-900' : statusText}`}>{asset.name}</div>
                          <div className="text-[9px] font-bold opacity-60 uppercase truncate">{asset.brand}</div>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-1 rounded-sm ${isSelected ? 'bg-indigo-200 text-indigo-800' : (asset.status === 'Normal' ? 'hidden' : 'bg-white/50 border border-current')}`}>
                        {asset.status !== 'Normal' && asset.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center opacity-30 grayscale">
                <p className="text-[8px] font-black uppercase">Module Active: {activeMode}</p>
              </div>
            )}
          </div>
        </nav>
      </aside>

      <main className="flex-1 pointer-events-none relative" />

      {!showRight && (<button onClick={() => setShowRight(true)} className="absolute right-[20px] top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-md rounded-[8px] border border-slate-200 shadow-lg z-20 text-indigo-600 hover:bg-white transition-all"><PanelRight className="w-5 h-5" /></button>)}

      <aside className={`relative w-[240px] flex flex-col bg-white/80 backdrop-blur-xl z-10 rounded-[10px] border border-slate-200 shadow-xl pointer-events-auto shrink-0 transition-all duration-500 ease-in-out ${showRight ? 'translate-x-0 opacity-100' : 'translate-x-[260px] opacity-0'}`}>
        <header className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-50 rounded-[4px] flex items-center justify-center border border-indigo-100"><Info className="w-3.5 h-3.5 text-indigo-600" /></div>
            <h1 className="text-xs font-black tracking-tight text-slate-800 uppercase italic">Data</h1>
          </div>
          <div className="flex items-center gap-1">
            {selectedRoomId && <button onClick={() => setSelectedRoomId(null)} className="p-1 hover:bg-slate-200 rounded-[4px] text-slate-400 transition-colors"><X className="w-3 h-3" /></button>}
            <button onClick={() => setShowRight(false)} className="p-1 hover:bg-slate-200 rounded-[4px] text-slate-400 transition-colors"><PanelRightClose className="w-3.5 h-3.5" /></button>
          </div>
        </header>

        {selectedRoom || selectedAC ? (
          <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-lg font-black tracking-tighter leading-tight text-slate-900">{selectedRoom?.name || selectedAC?.name}</h3>
                <span className={`px-1.5 py-0.5 text-[7px] font-black rounded-full border uppercase shrink-0 ${ (selectedRoom || selectedAC?.status === 'Normal') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200' }`}> {selectedAC?.status || 'Active'} </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 rounded-[6px] border border-slate-100 shadow-sm text-center">
                  <div className="text-[7px] text-slate-400 font-black uppercase mb-0.5">{selectedAC ? 'Type' : 'Level'}</div>
                  <div className="text-slate-800 text-[11px] font-black truncate">{selectedAC ? selectedAC.type : `Floor 0${selectedRoom?.floor}`}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-[6px] border border-slate-100 shadow-sm text-center">
                  <div className="text-[7px] text-slate-400 font-black uppercase mb-0.5">BIM ID</div>
                  <div className="text-slate-800 text-[11px] font-black truncate">{selectedRoom?.number || selectedAC?.id}</div>
                </div>
              </div>
              {selectedAC && (
                <div className="p-2 bg-indigo-50/50 rounded-[6px] border border-indigo-100/50 space-y-1">
                  <div className="flex justify-between items-center text-[9px]"><span className="text-slate-400 font-bold uppercase">Brand</span><span className="text-indigo-700 font-black uppercase">{selectedAC.brand}</span></div>
                  <div className="flex justify-between items-center text-[9px]"><span className="text-slate-400 font-bold uppercase">Model</span><span className="text-indigo-700 font-black uppercase">{selectedAC.model}</span></div>
                </div>
              )}
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-[8px] px-1"><Activity className="w-3 h-3" /> <span>System Logs</span></div>
              <div className="space-y-1.5">
                {selectedAC?.logs?.map(log => (
                  <div key={log.id} className="p-2 bg-white border border-slate-100 rounded-[6px] shadow-sm">
                    <div className="flex justify-between items-center mb-1"><span className={`text-[7px] px-1 font-black rounded-full uppercase ${log.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{log.status}</span><span className="text-[7px] text-slate-400 font-mono">{log.date}</span></div>
                    <p className="text-[9px] text-slate-700 font-bold leading-tight">{log.issue}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[8px] text-slate-400 font-bold italic"><User className="w-2.5 h-2.5" /> {log.reporter}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[6px] font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 mt-auto"> <Tag className="w-3 h-3" /> Log Report </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-30">
            <Box className="w-6 h-6 text-slate-400 mb-2" />
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Select Object</p>
          </div>
        )}
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
