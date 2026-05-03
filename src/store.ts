import { create } from 'zustand'
import type { Room, ACAsset, BIMMode } from './types/bim'
import type { MergedACAsset, ACLogSummary } from './types/database'

interface AppState {
  buildingCode: string
  setBuildingCode: (code: string) => void

  activeMode: BIMMode
  setActiveMode: (mode: BIMMode) => void
  showRight: boolean
  setShowRight: (show: boolean) => void
  showDashboard: boolean
  setShowDashboard: (show: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void

  selectedRoomId: string | null
  setSelectedRoomId: (id: string | null) => void
  clipFloor: number | null
  setClipFloor: (floor: number | null) => void
  selectedFloor: number | null
  setSelectedFloor: (floor: number | null) => void
  expandedFloors: Record<number, boolean>
  setExpandedFloors: (floors: Record<number, boolean>) => void

  reportAsset: MergedACAsset | null
  setReportAsset: (asset: MergedACAsset | null) => void
  selectedLog: ACLogSummary | null
  setSelectedLog: (log: ACLogSummary | null) => void

  isDarkMode: boolean
  setDarkMode: (dark: boolean) => void

  fontOption: number
  setFontOption: (v: number) => void

  rooms: Room[]
  setRooms: (rooms: Room[]) => void
  acAssets: ACAsset[]
  setAcAssets: (assets: ACAsset[]) => void

  showDelete: boolean
  toggleShowDelete: () => void

  switchMode: (mode: BIMMode) => void
}

export const useAppStore = create<AppState>((set) => ({
  buildingCode: 'AR15',
  setBuildingCode: (buildingCode) => set({ buildingCode }),

  activeMode: 'AC',
  setActiveMode: (activeMode) => set({ activeMode }),
  showRight: true,
  setShowRight: (showRight) => set({ showRight }),
  showDashboard: false,
  setShowDashboard: (showDashboard) => set({ showDashboard }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  selectedRoomId: null,
  setSelectedRoomId: (selectedRoomId) => set({ selectedRoomId }),
  clipFloor: null,
  setClipFloor: (clipFloor) => set({ clipFloor }),
  selectedFloor: null,
  setSelectedFloor: (selectedFloor) => set({ selectedFloor }),
  expandedFloors: {},
  setExpandedFloors: (expandedFloors) => set({ expandedFloors }),

  reportAsset: null,
  setReportAsset: (reportAsset) => set({ reportAsset }),
  selectedLog: null,
  setSelectedLog: (selectedLog) => set({ selectedLog }),

  isDarkMode: localStorage.getItem('theme') === 'dark',
  setDarkMode: (isDarkMode) => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    set({ isDarkMode })
  },

  fontOption: parseInt(localStorage.getItem('fontOption') || '3'),
  setFontOption: (fontOption) => {
    localStorage.setItem('fontOption', String(fontOption))
    set({ fontOption })
  },

  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  acAssets: [],
  setAcAssets: (acAssets) => set({ acAssets }),

  showDelete: false,
  toggleShowDelete: () => set((s) => ({ showDelete: !s.showDelete })),

  switchMode: (mode) =>
    set({
      activeMode: mode,
      selectedRoomId: null,
      clipFloor: null,
      expandedFloors: {},
      selectedFloor: null,
      searchQuery: '',
      showRight: mode === 'KG' ? false : true,
    }),
}))
