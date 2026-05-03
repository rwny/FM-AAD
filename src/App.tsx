import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import {
  House,
  AirVent, Share2,
  PanelRightClose, PanelRight,
  LayoutDashboard, Sun, Moon, Armchair, Lightbulb, Printer, X, ClipboardList
} from 'lucide-react'
import type { BIMMode } from './types/bim'
import { useAppStore } from './store'

import { useDatabase } from './hooks/useDatabase'
import { useMergedAssets, useFurnitureData, useACStats } from './hooks/useAssetMerger'
import { useDeleteShortcut } from './hooks/useKeyboardShortcuts'
import { useGlobalSearch } from './hooks/useGlobalSearch'

import { ArchLeftPanel, ArchRightPanel } from './components/modes/ArchMode'
import { ACLeftPanel, ACRightPanel } from './components/modes/ACMode'
import { EELeftPanel, EERightPanel } from './components/modes/EEMode'
import { FurnitureLeftPanel, FurnitureRightPanel } from './components/modes/FurnitureMode'
import { PrintReportModal } from './components/ui/PrintReportModal'
import { KGVisualizer3D } from './components/KGVisualizer3D'
import { GlobalSearch } from './components/search/GlobalSearch'
import { ProjectDashboard } from './components/ui/ProjectDashboard'
import { Scene } from './components/3d/Scene'
import { ErrorBoundary } from './components/ErrorBoundary'

const modes = [
  { id: 'AC' as BIMMode, label: 'Air', icon: AirVent },
  { id: 'AR' as BIMMode, label: 'Arch', icon: House },
  { id: 'Fur' as BIMMode, label: 'FUR', icon: Armchair },
  { id: 'EE' as BIMMode, label: 'EN', icon: Lightbulb },
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
  const isDarkMode = useAppStore(s => s.isDarkMode)
  const setDarkMode = useAppStore(s => s.setDarkMode)
  const fontOption = useAppStore(s => s.fontOption)

  const prevModeRef = useRef<BIMMode>('AR')

  useEffect(() => {
    if (activeMode !== 'KG') prevModeRef.current = activeMode
  }, [activeMode])

  const navigate = useNavigate()
  const params = useParams()
  const segments = (params['*'] || '').split('/').filter(Boolean)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    const fonts: Record<number, string> = {
      1: '"Noto Sans Thai Looped", "Noto Sans Thai", Inter, system-ui, sans-serif',
      2: '"Noto Sans Thai", "Noto Sans Thai Looped", Inter, system-ui, sans-serif',
      3: '"IBM Plex Sans Thai", "Noto Sans Thai", Inter, system-ui, sans-serif',
      4: '"Kanit", "Noto Sans Thai", Inter, system-ui, sans-serif',
      5: '"Sarabun", "Noto Sans Thai", Inter, system-ui, sans-serif',
    }
    document.documentElement.style.setProperty('font-family', fonts[fontOption] || fonts[1], 'important')
  }, [fontOption])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
          setDarkMode(!isDarkMode)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDarkMode, setDarkMode])

  useEffect(() => {
    const knownModes = ['AR', 'AC', 'KG', 'Fur', 'EE', 'Admin']
    let bld = 'AR15'
    let mode: BIMMode = 'AC'
    let itemId: string | null = null

    if (segments.length > 0) {
      const first = segments[0].toUpperCase()
      if (knownModes.some(m => m.toUpperCase() === first)) {
        mode = first as BIMMode
        const sid = segments[1] || null
        if (sid && !['dashboard', 'wo', 'appt', 'cal'].includes(sid.toLowerCase())) {
          itemId = sid
        }
      } else {
        bld = segments[0]
        const modeSegment = segments[1]?.toUpperCase() || 'AC'
        mode = modeSegment as BIMMode
        if (knownModes.some(m => m.toUpperCase() === modeSegment)) {
          const tid = segments[2] || null
          if (tid && !['dashboard', 'wo', 'appt', 'cal'].includes(tid.toLowerCase())) {
            itemId = tid
          }
        }
      }
    }

    if (bld !== buildingCode) setBuildingCode(bld)
    if (mode !== activeMode) setActiveMode(mode)
    if (itemId) setSelectedRoomId(itemId)

    // Open dashboard if URL has /dashboard segment
    const joined = segments.join('/').toLowerCase()
    if (joined.includes('dashboard')) {
      setShowDashboard(true)
    }
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

  // Auto-select a random AC or restore last selected when entering AC mode
  useEffect(() => {
    if (activeMode === 'AC' && finalACAssets.length > 0) {
      const storageKey = `last_selected_ac_${buildingCode}`;
      const savedId = localStorage.getItem(storageKey);
      
      if (!selectedRoomId) {
        if (savedId && finalACAssets.some(a => a.id === savedId)) {
          // Restore last selected
          setSelectedRoomId(savedId);
        } else {
          // Select a random one if nothing saved or saved asset not found
          const randomIndex = Math.floor(Math.random() * finalACAssets.length);
          const randomAsset = finalACAssets[randomIndex];
          setSelectedRoomId(randomAsset.id);
          localStorage.setItem(storageKey, randomAsset.id);
        }
      } else {
        // If an ID is selected (manually or via search), save it
        // Check if the selected ID is actually an AC asset
        if (finalACAssets.some(a => a.id === selectedRoomId)) {
          localStorage.setItem(storageKey, selectedRoomId);
        }
      }
    }
  }, [activeMode, selectedRoomId, finalACAssets, setSelectedRoomId, buildingCode])

  const [expandedFloors, setExpandedFloors] = useState<{[key: number]: boolean}>({})

  useDeleteShortcut()

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
    <div className="relative h-screen w-screen bg-stone-50 dark:bg-zinc-950 overflow-hidden font-sans select-none text-slate-900 dark:text-zinc-100">
      {showDashboard && (
        <ProjectDashboard
          assets={finalACAssets}
          rooms={rooms}
          onSelect={(id) => {
            setSelectedRoomId(id)
            setShowDashboard(false)
            if (id.startsWith('fcu') || id.startsWith('cdu')) setActiveMode('AC')
          }}
          onSelectLog={(log) => {
            setSelectedLog(log)
          }}
          onClose={() => {
            setShowDashboard(false)
            window.history.replaceState(null, '', window.location.pathname.replace(/\/dashboard.*$/, ''))
          }}
        />
      )}

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#d6d3d1] to-[#fafaf9] dark:from-zinc-900 dark:to-zinc-950">
        {activeMode === 'KG' && <KGVisualizer3D kgNodes={kgNodes} kgEdges={kgEdges} acDbLogs={acDbLogs} />}

        <div style={{ display: activeMode === 'KG' ? 'none' : 'block', width: '100%', height: '100%' }}>
          <ErrorBoundary>
            <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}>
              <color attach="background" args={['#d6d3d1']} />
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
      <div className={`absolute top-3 left-3 z-30 flex items-start gap-2 transition-all duration-400 ease-in-out ${
        showRight ? 'right-[344px]' : 'right-3'
      }`}>
        {/* Search */}
        <div className="flex-1 max-w-[360px]">
          {activeMode !== 'KG' && (
            <GlobalSearch
              query={searchQuery}
              onQueryChange={setSearchQuery}
              results={globalSearchResults}
              onSelect={handleGlobalSearchSelect}
            />
          )}
        </div>

        {/* Mode Icons + Dashboard + Sidebar Toggle */}
        <div className="flex items-start gap-4 ml-auto">
          {/* Column A: Main Modes & Dashboard */}
          <div className="flex flex-col gap-1.5 relative">
            {/* 1.1: 4 Main Modes */}
            <div className="flex items-center gap-1.5">
              {modes.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  title={m.label}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    activeMode === m.id
                      ? 'bg-white dark:bg-zinc-800 shadow-lg text-amber-800 dark:text-orange-500 ring-1 ring-slate-200/50 dark:ring-zinc-700/50'
                      : 'bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-300 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <m.icon className="w-[18px] h-[18px]" />
                </button>
              ))}
            </div>

            {/* 1.2: Sub Dashboard (Sliding under active mode if applicable) */}
            <div 
              className="absolute top-[42px] transition-all duration-300 ease-out flex justify-center"
              style={{ 
                left: `${modes.slice(0, 4).findIndex(m => m.id === activeMode) !== -1 
                  ? modes.findIndex(m => m.id === activeMode) * 42 
                  : 0
                }px`,
                width: '36px',
                // Show only for main 4 modes, but full opacity only for AC
                opacity: activeMode === 'AC' ? 1 : (modes.slice(0, 4).some(m => m.id === activeMode) ? 0.2 : 0),
                pointerEvents: activeMode === 'AC' ? 'auto' : 'none'
              }}
            >
              <button
                onClick={() => activeMode === 'AC' && (
                  setShowDashboard(true),
                  window.history.pushState(null, '', window.location.pathname.replace(/\/dashboard.*$/, '').replace(/\/(fcu-[\w-]+|cdu-[\w-]+|rm-[\w-]+)$/, '') + '/dashboard')
                )}
                disabled={activeMode !== 'AC'}
                title={activeMode === 'AC' ? "System Dashboard" : "Dashboard only available in Air mode"}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 relative ${
                  activeMode === 'AC'
                    ? 'text-slate-500 dark:text-zinc-300 hover:text-amber-800 dark:hover:text-orange-500 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-md'
                    : 'text-slate-300 dark:text-zinc-700 cursor-default'
                }`}
              >
                <LayoutDashboard className="w-[18px] h-[18px]" />
                {activeMode === 'AC' && (acStats.red > 0 || acStats.orange > 0) && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-zinc-950 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Column B: System Controls & Graph */}
          <div className="flex flex-col items-center gap-1.5 w-9">
            {/* 2.1: Sidebar Toggle */}
            <button
              onClick={() => {
                if (activeMode === 'KG') {
                  switchMode(prevModeRef.current)
                } else {
                  setShowRight(!showRight)
                }
              }}
              title={activeMode === 'KG' ? 'Back to previous mode' : showRight ? 'Close panel' : 'Open panel'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                showRight
                  ? 'bg-white dark:bg-zinc-800 shadow-lg text-amber-800 dark:text-orange-500 ring-1 ring-slate-200/50 dark:ring-zinc-700/50'
                  : 'bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-300 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              {showRight ? <PanelRightClose className="w-[18px] h-[18px]" /> : <PanelRight className="w-[18px] h-[18px]" />}
            </button>

            {/* Dark/Light Switch */}
            <button
              onClick={() => setDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-300 hover:text-amber-800 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              {isDarkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </div>
    </div>

    {/* Bottom Right: Graph Mode Toggle */}
    <div className={`absolute bottom-3 z-30 transition-all duration-400 ease-in-out ${
      showRight ? 'right-[344px]' : 'right-3'
    }`}>
      {modes.slice(4).map((m) => (
        <button
          key={m.id}
          onClick={() => switchMode(m.id)}
          title={m.label}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            activeMode === m.id
              ? 'bg-white dark:bg-zinc-800 shadow-lg text-amber-800 dark:text-orange-500 ring-1 ring-slate-200/50 dark:ring-zinc-700/50'
              : 'bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-300 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800'
          }`}
        >
          <m.icon className="w-[18px] h-[18px]" />
        </button>
      ))}
    </div>

    {/* Data Sidebar */}
      <aside className={`absolute right-0 top-0 bottom-0 w-[320px] flex flex-col bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl z-20 border-l border-slate-200/60 dark:border-zinc-800/60 shadow-xl overflow-hidden transition-all duration-400 ease-in-out ${
        showRight ? 'translate-x-0 opacity-100' : 'translate-x-[340px] opacity-0 pointer-events-none'
      }`}>
        {/* Header */}
        <header className="px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 uppercase leading-none">AAD · {buildingCode}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[8px] font-mono font-bold ${isLive ? 'text-emerald-500' : 'text-slate-300 dark:text-zinc-600'}`}>aad FM rw 0.35</span>
          </div>
        </header>

        {/* Data Panel */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeMode === 'AR' && (
            selectedRoomId ? <ArchRightPanel finalACAssets={finalACAssets} /> : 
            <ArchLeftPanel 
              rooms={rooms} selectedRoomId={selectedRoomId} setSelectedRoomId={setSelectedRoomId} 
              searchQuery={searchQuery} expandedFloors={expandedFloors} setExpandedFloors={setExpandedFloors} 
              clipFloor={clipFloor} setClipFloor={useAppStore.getState().setClipFloor}
              selectedFloor={useAppStore.getState().selectedFloor} setSelectedFloor={useAppStore.getState().setSelectedFloor}
              finalACAssets={finalACAssets} setShowDashboard={setShowDashboard}
            />
          )}
          {activeMode === 'AC' && (
            selectedRoomId ? <ACRightPanel finalACAssets={finalACAssets} /> :
            <ACLeftPanel 
              rooms={rooms} selectedRoomId={selectedRoomId} setSelectedRoomId={setSelectedRoomId} 
              searchQuery={searchQuery} expandedFloors={expandedFloors} setExpandedFloors={setExpandedFloors} 
              clipFloor={clipFloor} setClipFloor={useAppStore.getState().setClipFloor}
              selectedFloor={useAppStore.getState().selectedFloor} setSelectedFloor={useAppStore.getState().setSelectedFloor}
              finalACAssets={finalACAssets}
            />
          )}
          {activeMode === 'Fur' && (
            selectedRoomId ? <FurnitureRightPanel 
              rooms={rooms} selectedRoomId={selectedRoomId} setSelectedRoomId={setSelectedRoomId} 
              allFurniture={allFurniture as any} searchQuery={searchQuery} expandedFloors={expandedFloors} 
              setExpandedFloors={setExpandedFloors} clipFloor={clipFloor} setClipFloor={useAppStore.getState().setClipFloor}
              selectedFloor={useAppStore.getState().selectedFloor} setSelectedFloor={useAppStore.getState().setSelectedFloor}
            /> :
            <FurnitureLeftPanel 
              rooms={rooms} selectedRoomId={selectedRoomId} setSelectedRoomId={setSelectedRoomId} 
              allFurniture={allFurniture as any} searchQuery={searchQuery} expandedFloors={expandedFloors} 
              setExpandedFloors={setExpandedFloors} clipFloor={clipFloor} setClipFloor={useAppStore.getState().setClipFloor}
              selectedFloor={useAppStore.getState().selectedFloor} setSelectedFloor={useAppStore.getState().setSelectedFloor}
            />
          )}
          {activeMode === 'EE' && (
            selectedRoomId ? <EERightPanel selectedRoomId={selectedRoomId} rooms={rooms} selectedFloor={useAppStore.getState().selectedFloor} /> :
            <EELeftPanel 
              rooms={rooms} selectedRoomId={selectedRoomId} setSelectedRoomId={setSelectedRoomId} 
              searchQuery={searchQuery} expandedFloors={expandedFloors} setExpandedFloors={setExpandedFloors} 
              clipFloor={clipFloor} setClipFloor={useAppStore.getState().setClipFloor}
              selectedFloor={useAppStore.getState().selectedFloor} setSelectedFloor={useAppStore.getState().setSelectedFloor}
            />
          )}
        </div>
      </aside>

      {reportAsset && (
        <PrintReportModal asset={reportAsset} onClose={() => setReportAsset(null)} />
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[110] flex items-center justify-center p-4" onClick={() => setSelectedLog(null)} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setSelectedLog(null) } }} tabIndex={-1} ref={el => el?.focus()}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <ClipboardList className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <h1 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-zinc-100">Service Report</h1>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">{buildingCode} · AIR CONDITIONING</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-mono font-black text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">{selectedLog.wo_number || '---'}</span>
                <button onClick={() => setSelectedLog(null)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors print:hidden">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-zinc-900">
              {/* Status + Date Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-3 border border-slate-100 dark:border-zinc-800">
                  <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Status</span>
                  <div className={`mt-1 text-[11px] font-black uppercase inline-flex items-center gap-1.5 ${
                    selectedLog.status === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' :
                    selectedLog.status === 'Faulty' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      selectedLog.status === 'Completed' ? 'bg-emerald-500' :
                      selectedLog.status === 'Faulty' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    {selectedLog.status}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-3 border border-slate-100 dark:border-zinc-800">
                  <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Service Date</span>
                  <div className="mt-1 text-[12px] font-bold text-slate-700 dark:text-zinc-200">{selectedLog.date}</div>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-3 border border-slate-100 dark:border-zinc-800">
                  <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Recorded</span>
                  <div className="mt-1 text-[11px] font-bold text-slate-600 dark:text-zinc-300">{new Date(selectedLog.created_at).toLocaleString('th-TH')}</div>
                </div>
              </div>

              {/* Issue */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
                <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Subject / Activity</span>
                <p className="mt-1.5 text-[15px] font-bold text-slate-800 dark:text-zinc-100 leading-snug">{selectedLog.issue}</p>
              </div>

              {/* Personnel + Cost Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-3 border border-slate-100 dark:border-zinc-800">
                  <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Reporter</span>
                  <div className="mt-1 text-[11px] font-bold text-slate-700 dark:text-zinc-200 italic">{selectedLog.reporter || '---'}</div>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-3 border border-slate-100 dark:border-zinc-800">
                  <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Contractor</span>
                  <div className="mt-1 text-[11px] font-bold text-slate-700 dark:text-zinc-200">{selectedLog.contractor || 'Internal Team'}</div>
                  {selectedLog.contractor_contact && (
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">{selectedLog.contractor_contact}</div>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-3 border border-slate-100 dark:border-zinc-800 text-right">
                  <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Fee (THB)</span>
                  <div className="mt-1 text-[15px] font-black text-slate-800 dark:text-zinc-100">
                    {selectedLog.cost ? Number(selectedLog.cost).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-4 border border-slate-100 dark:border-zinc-800">
                <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Remarks & Observations</span>
                <p className="mt-1.5 text-[12px] font-bold text-slate-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                  {selectedLog.note || 'No additional remarks recorded by the onsite engineer.'}
                </p>
              </div>

              {/* Signature */}
              <div className="grid grid-cols-2 gap-8 pt-6">
                <div className="border-t border-slate-200 dark:border-zinc-800 pt-2 text-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-zinc-500">Inspector Signature</span>
                </div>
                <div className="border-t border-slate-200 dark:border-zinc-800 pt-2 text-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-zinc-500">Authorized Receiver</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center shrink-0 print:hidden">
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase">{new Date().toLocaleDateString()} · System Generated</span>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-1.5 bg-amber-700 dark:bg-amber-700 text-white rounded-lg font-bold uppercase text-[10px] hover:bg-amber-800 transition-colors flex items-center gap-1.5">
                  <Printer className="w-3 h-3" />
                  Print PDF
                </button>
                <button onClick={() => setSelectedLog(null)} className="px-4 py-1.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg font-bold uppercase text-[10px] hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * { visibility: hidden; }
              .fixed.inset-0.z-\\[110\\] { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white !important; }
              .fixed.inset-0.z-\\[110\\] * { visibility: visible; }
              .fixed.inset-0.z-\\[110\\] .max-w-2xl { max-width: 100%; border: none; shadow: none; margin: 0; padding: 0; }
              .print\\:hidden { display: none !important; }
              @page { size: A4; margin: 20mm; }
              .custom-scrollbar { overflow: visible !important; height: auto !important; max-height: none !important; }
              .overflow-y-auto { overflow: visible !important; height: auto !important; max-height: none !important; }
            }
          `}} />
        </div>
      )}

    </div>
  )
}

export default App
