import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import {
  Building2,
  Wind, Share2,
  PanelRightClose, PanelRight, X,
  LayoutDashboard
} from 'lucide-react'
import type { BIMMode } from './types/bim'
import { useAppStore } from './store'

import { useDatabase } from './hooks/useDatabase'
import { useMergedAssets, useFurnitureData, useACStats } from './hooks/useAssetMerger'
import { useAdminShortcut } from './hooks/useKeyboardShortcuts'
import { useGlobalSearch } from './hooks/useGlobalSearch'

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

  useEffect(() => {
    const knownModes = ['AR', 'AC', 'KG', 'Admin']
    let bld = 'AR15'
    let mode: BIMMode = 'AR'
    let itemId: string | null = null

    if (segments.length > 0) {
      const first = segments[0].toUpperCase()
      if (knownModes.includes(first)) {
        mode = first as BIMMode
        itemId = segments[1] || null
      } else {
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

  useEffect(() => {
    const idSlug = selectedRoomId ? `/${selectedRoomId}` : ''
    navigate(`/${buildingCode}/${activeMode}${idSlug}`, { replace: true })
  }, [buildingCode, activeMode, selectedRoomId, navigate])

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
    <div className="relative h-screen w-screen bg-sky-50 overflow-hidden font-sans select-none text-slate-900">
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

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#7dd3fc] to-[#f0f9ff]">
        {activeMode === 'KG' && <KGVisualizer3D />}

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

      {/* Floating Top Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-start gap-2">
        {/* Search */}
        <div className="flex-1 max-w-[360px]">
          <GlobalSearch
            query={searchQuery}
            onQueryChange={setSearchQuery}
            results={globalSearchResults}
            onSelect={handleGlobalSearchSelect}
          />
        </div>

        {/* Mode Icons + Dashboard + Sidebar Toggle */}
        <div className="flex items-center gap-1.5 ml-auto">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              title={m.label}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all backdrop-blur-md ${
                activeMode === m.id
                  ? 'bg-white shadow-lg text-indigo-600 ring-1 ring-slate-200/50'
                  : 'bg-white/60 text-slate-400 hover:text-slate-700 hover:bg-white/90'
              }`}
            >
              <m.icon className="w-[18px] h-[18px]" />
            </button>
          ))}

          {/* Dashboard button */}
          {activeMode === 'AC' && (
            <button
              onClick={() => setShowDashboard(true)}
              title="Dashboard"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-white/60 backdrop-blur-md text-slate-500 hover:text-indigo-600 hover:bg-white/90 relative"
            >
              <LayoutDashboard className="w-[18px] h-[18px]" />
              {(acStats.red > 0 || acStats.orange > 0) && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
              )}
            </button>
          )}

          {/* Sidebar toggle */}
          <button
            onClick={() => setShowRight(!showRight)}
            title={showRight ? 'Close panel' : 'Open panel'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all backdrop-blur-md ${
              showRight
                ? 'bg-white shadow-lg text-indigo-600 ring-1 ring-slate-200/50'
                : 'bg-white/60 text-slate-400 hover:text-slate-700 hover:bg-white/90'
            }`}
          >
            {showRight ? <PanelRightClose className="w-[18px] h-[18px]" /> : <PanelRight className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </div>

      {/* Data Sidebar */}
      <aside className={`absolute right-3 top-3 bottom-3 w-[320px] flex flex-col bg-white/80 backdrop-blur-xl z-20 rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden transition-all duration-400 ease-in-out ${
        showRight ? 'translate-x-0 opacity-100' : 'translate-x-[340px] opacity-0 pointer-events-none'
      }`}>
        {/* Header */}
        <header className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-600 rounded-[4px] flex items-center justify-center shadow-md shrink-0">
              <Building2 className="w-3 h-3 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="text-[11px] font-black tracking-tight text-slate-800 uppercase italic">FM_{buildingCode}</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{isLive ? 'Live' : 'Local'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Data Panel */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeMode === 'AR' && <ArchRightPanel finalACAssets={finalACAssets} />}
          {activeMode === 'AC' && <ACRightPanel finalACAssets={finalACAssets} />}
        </div>
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
