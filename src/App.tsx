import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import {
  Building2,
  Wind, Share2,
  PanelRightClose, PanelRight, X,
  LayoutDashboard, ChevronRight
} from 'lucide-react'
import type { BIMMode } from './types/bim'
import { useAppStore } from './store'

// --- Hooks ---
import { useDatabase } from './hooks/useDatabase'
import { useMergedAssets, useFurnitureData, useACStats } from './hooks/useAssetMerger'
import { useAdminShortcut } from './hooks/useKeyboardShortcuts'
import { useGlobalSearch } from './hooks/useGlobalSearch'

// --- Mode Components ---
import { ArchRightPanel } from './components/modes/ArchMode'
import { ACRightPanel } from './components/modes/ACMode'
import { PrintReportModal } from './components/ui/PrintReportModal'
import { KGVisualizer3D } from './components/KGVisualizer3D'
import { GlobalSearch } from './components/search/GlobalSearch'
import { ProjectDashboard } from './components/ui/ProjectDashboard'
import { Scene } from './components/3d/Scene'
import { ErrorBoundary } from './components/ErrorBoundary'

const modes = [
  { id: 'AR' as BIMMode, label: 'Arch', icon: Building2 },
  { id: 'AC' as BIMMode, label: 'Air', icon: Wind },
  { id: 'KG' as BIMMode, label: 'Graph', icon: Share2 },
]

function App() {
  const activeMode = useAppStore(s => s.activeMode)
  const setActiveMode = useAppStore(s => s.setActiveMode)
  const switchMode = useAppStore(s => s.switchMode)
  const showRight = useAppStore(s => s.showRight)
  const setShowRight = useAppStore(s => s.setShowRight)
  const showDashboard = useAppStore(s => s.showDashboard)
  const setShowDashboard = useAppStore(s => s.setShowDashboard)
  const searchQuery = useAppStore(s => s.searchQuery)
  const setSearchQuery = useAppStore(s => s.setSearchQuery)
  const selectedRoomId = useAppStore(s => s.selectedRoomId)
  const setSelectedRoomId = useAppStore(s => s.setSelectedRoomId)
  const clipFloor = useAppStore(s => s.clipFloor)
  const rooms = useAppStore(s => s.rooms)
  const acAssets = useAppStore(s => s.acAssets)
  const reportAsset = useAppStore(s => s.reportAsset)
  const setReportAsset = useAppStore(s => s.setReportAsset)
  const selectedLog = useAppStore(s => s.selectedLog)
  const setSelectedLog = useAppStore(s => s.setSelectedLog)
  const buildingCode = useAppStore(s => s.buildingCode)
  const setBuildingCode = useAppStore(s => s.setBuildingCode)

  const navigate = useNavigate()
  const params = useParams()
  const segments = (params['*'] || '').split('/').filter(Boolean)

  // Init store from URL on mount
  useEffect(() => {
    const knownModes = ['AR', 'AC', 'KG', 'Admin']
    let bld = 'AR15'
    let mode: BIMMode = 'AR'
    let itemId: string | null = null

    if (segments.length > 0) {
      const first = segments[0].toUpperCase()
      if (knownModes.includes(first)) {
        // Old format: /ac/fcu-101-1
        mode = first as BIMMode
        itemId = segments[1] || null
      } else {
        // New format: /ar15/ac/fcu-101-1
        bld = segments[0]
        mode = (segments[1]?.toUpperCase() || 'AR') as BIMMode
        if (knownModes.includes(mode)) {
          itemId = segments[2] || null
        }
      }
    }

    if (bld !== buildingCode) setBuildingCode(bld)
    if (mode !== activeMode) setActiveMode(mode)
    if (itemId) setSelectedRoomId(itemId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync URL when store changes
  useEffect(() => {
    const idSlug = selectedRoomId ? `/${selectedRoomId}` : ''
    navigate(`/${buildingCode}/${activeMode}${idSlug}`, { replace: true })
  }, [buildingCode, activeMode, selectedRoomId, navigate])

  const handleModeSwitch = (mode: BIMMode) => {
    switchMode(mode)
  }

  const { buildingData, acDbLogs, kgNodes, kgEdges, isLive } = useDatabase(buildingCode)
  const finalACAssets = useMergedAssets(acAssets, acDbLogs, kgNodes, kgEdges)
  const allFurniture = useFurnitureData(buildingData)
  const acStats = useACStats(finalACAssets)

  useAdminShortcut()

  const globalSearchResults = useGlobalSearch(
    searchQuery, rooms, finalACAssets, allFurniture, kgNodes, kgEdges
  )

  const handleGlobalSearchSelect = (result: { mode: BIMMode; type: string; data: { id: string } }) => {
    if (result.type === 'connection') {
      setActiveMode('KG')
    } else {
      if (result.mode !== activeMode) setActiveMode(result.mode)
      setSelectedRoomId(result.data.id)
    }
  }

  return (
    <div className="relative h-screen w-screen bg-sky-50 overflow-hidden font-sans select-none flex text-slate-900 p-[10px]">
      {showDashboard && (
        <ProjectDashboard
          assets={finalACAssets}
          rooms={rooms}
          onSelect={(id) => {
            setSelectedRoomId(id)
            setShowDashboard(false)
            if (id.startsWith('fcu') || id.startsWith('cdu')) setActiveMode('AC')
          }}
          onClose={() => setShowDashboard(false)}
        />
      )}

      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#7dd3fc] to-[#f0f9ff]">
        {activeMode === 'KG' && <KGVisualizer3D />}

        {activeMode === 'KG' && !showRight && (
          <button
            onClick={() => setShowRight(true)}
            className="absolute top-[10px] right-[10px] z-[100] p-3 bg-white shadow-lg rounded-[5px] hover:bg-slate-50 transition-all group border border-slate-200"
          >
            <PanelRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
          </button>
        )}

        <div style={{ display: activeMode === 'KG' ? 'none' : 'block', width: '100%', height: '100%' }}>
          <ErrorBoundary>
            <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}>
              <color attach="background" args={['#bae6fd']} />
              <Scene
                selectedRoomId={selectedRoomId}
                rightVisible={showRight}
                activeMode={activeMode}
                clipFloor={clipFloor}
                buildingData={buildingData}
                finalACAssets={finalACAssets}
              />
            </Canvas>
          </ErrorBoundary>
        </div>
      </div>

      {!showRight && activeMode !== 'KG' && (
        <button
          onClick={() => setShowRight(true)}
          className="absolute right-[20px] top-[24px] p-2 bg-white/90 backdrop-blur-md rounded-[5px] border border-slate-200 shadow-lg z-20 text-indigo-600 hover:bg-white transition-all hover:scale-110 active:scale-95"
        >
          <PanelRight className="w-5 h-5" />
        </button>
      )}

      <aside className={`absolute right-[10px] top-[10px] bottom-[10px] w-[320px] flex flex-col bg-white/80 backdrop-blur-xl z-10 rounded-[5px] border border-slate-200 shadow-xl overflow-hidden pointer-events-auto shrink-0 transition-all duration-500 ease-in-out ${showRight ? 'translate-x-0 opacity-100' : 'translate-x-[340px] opacity-0'}`}>
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
          <button onClick={() => setShowRight(false)} className="p-1 hover:bg-slate-200 rounded-[4px] text-slate-400 transition-colors"><PanelRightClose className="w-3.5 h-3.5" /></button>
        </header>

        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/30 border-b border-slate-100">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeSwitch(m.id)}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-[10px] transition-all ${
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

        <div className="p-2 border-b border-slate-100">
          {activeMode === 'AC' && (
            <button
              onClick={() => setShowDashboard(true)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] transition-all border bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 group"
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
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] transition-all border bg-slate-800 border-slate-700 text-white hover:bg-slate-900 shadow-lg shadow-slate-100 group"
              onClick={() => {/* ARCH Dashboard Placeholder */}}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-wider italic">ARCH-DASHBOARD</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          )}
        </div>

        <nav className="flex-1 flex flex-col overflow-hidden">
          {activeMode !== 'KG' && (
            <div className="p-2 border-b border-slate-100">
              <GlobalSearch
                query={searchQuery}
                onQueryChange={setSearchQuery}
                results={globalSearchResults}
                onSelect={handleGlobalSearchSelect}
              />
            </div>
          )}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeMode === 'AR' && <ArchRightPanel finalACAssets={finalACAssets} />}
            {activeMode === 'AC' && <ACRightPanel finalACAssets={finalACAssets} />}
          </div>
        </nav>
      </aside>

      {reportAsset && (
        <PrintReportModal asset={reportAsset} onClose={() => setReportAsset(null)} />
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

      <div className="absolute bottom-3 left-4 z-[100] text-[10px] font-mono font-bold text-slate-400/80 pointer-events-none select-none mix-blend-difference">
        rw-03.40
      </div>
    </div>
  )
}

export default App
