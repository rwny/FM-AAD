// --- AC Maintenance Logs ---

export interface ACLogRow {
  id: string
  asset_id: string
  date: string
  created_at: string
  issue: string
  reporter?: string
  contractor?: string
  status: string
  note?: string
}

// --- Knowledge Graph ---

export interface KGNodeRow {
  id: string
  name: string
  type: string
  metadata: Record<string, unknown>
}

export interface KGEdgeRow {
  id: string
  subject_id: string
  object_id: string
  predicate: string
}

// --- Merged AC Asset (finalACAssets output) ---

export interface ACLogSummary {
  id: string
  date: string
  created_at: string
  issue: string
  reporter?: string
  contractor?: string
  status: 'Completed' | 'Pending' | 'In Progress' | 'Normal' | 'Faulty'
  note?: string
}

export interface MergedACAsset {
  id: string
  name: string
  type: 'FCU' | 'CDU'
  brand: string
  model: string
  capacity: string
  status: 'Normal' | 'Warning' | 'Maintenance' | 'Faulty'
  systemStatus: 'Normal' | 'Warning' | 'Maintenance' | 'Faulty'
  lastService: string
  nextService: string
  assetId: string
  acType: string
  install: string
  logs: ACLogSummary[]
  metadata?: {
    ifcType?: string
    guid?: string
    specs?: Record<string, unknown>
    manufacturer?: string
    model?: string
    systemId?: string
  }
  dbId?: string
}

// --- Extracted Furniture (useFurnitureData output) ---

export interface ExtractedFurniture {
  id?: string
  floor: number
  room: string
  status: string
  [key: string]: unknown
}

// --- AC Stats ---

export interface ACStats {
  green: number
  orange: number
  red: number
  total: number
}
