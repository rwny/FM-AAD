import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase Environment Variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')

// --- BIM Data Fetching Helpers ---

export async function addMaintenanceLog(assetId: string, logData: {
  date: string
  issue: string
  note?: string
  status: 'Completed' | 'Pending' | 'In Progress'
}) {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .insert({
      asset_id: assetId,
      ...logData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// --- AC Data Fetching ---

export async function fetchACLogs(assetId: string) {
  const { data, error } = await supabase
    .from('ac_maintenance_logs')
    .select('*')
    .eq('asset_id', assetId)
    .order('date', { ascending: false })
  
  if (error) {
    console.error(`Error fetching logs for ${assetId}:`, error)
    return []
  }
  return data
}

export async function fetchAllACLogs() {
  const { data, error } = await supabase
    .from('ac_maintenance_logs')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching all AC logs:', error)
    return []
  }
  return data
}

export async function addACMaintenanceLog(assetId: string, logData: {
  date: string
  issue: string
  reporter?: string
  status: 'Completed' | 'Pending' | 'In Progress'
  note?: string
}) {
  const { data, error } = await supabase
    .from('ac_maintenance_logs')
    .insert({
      asset_id: assetId,
      ...logData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function ensureAssetExists(assetId: string, roomCode: string, category: string, typeName?: string) {
  // 1. Try to find the asset in ac_assets (by obj_name)
  const { data: asset } = await supabase
    .from('ac_assets')
    .select('id')
    .eq('obj_name', assetId)
    .maybeSingle()

  if (asset) return asset.id

  // 2. Create if not exists
  const { data: newAsset, error } = await supabase
    .from('ac_assets')
    .insert({
      obj_name: assetId,
      ar_id: assetId,
      brand: 'Unknown'
    })
    .select()
    .single()

  if (error) throw error
  return newAsset.id
}

export async function fetchACAssets() {
  const { data, error } = await supabase
    .from('ac_assets')
    .select('*')
  
  if (error) {
    console.error('Error fetching AC assets:', error)
    return []
  }
  return data // Returns array of { id, ar_id, brand, install_date, log }
}

export async function updateACAsset(arId: string, updateData: { brand?: string, install_date?: string, log?: string }) {
  // 1. Check if exists
  const { data: existing } = await supabase
    .from('ac_assets')
    .select('id')
    .eq('ar_id', arId)
    .maybeSingle()

  if (existing) {
    // Update
    const { error } = await supabase
      .from('ac_assets')
      .update(updateData)
      .eq('ar_id', arId)
    if (error) throw error
  } else {
    // Insert new
    const { error } = await supabase
      .from('ac_assets')
      .insert({ ar_id: arId, ...updateData })
    if (error) throw error
  }
}

export async function fetchBuildingData(buildingCode: string) {
  // 1. Fetch Building
  const { data: building, error: bErr } = await supabase
    .from('buildings')
    .select('*')
    .eq('code', buildingCode)
    .single()

  if (bErr) throw bErr

  // 2. Fetch Floors, Rooms, and Assets in one go (using Supabase relations)
  const { data: floors, error: fErr } = await supabase
    .from('floors')
    .select(`
      *,
      rooms (
        *,
        assets (
          *,
          maintenance_logs (*)
        )
      )
    `)
    .eq('building_id', building.id)
    .order('floor_number', { ascending: true })

  if (fErr) throw fErr

  return {
    building: building.code,
    name: building.name,
    floors: floors.map(f => ({
      floor: f.floor_number,
      name: f.name,
      rooms: f.rooms.map((r: any) => ({
        id: r.room_id,
        name: r.name,
        assets: r.assets.map((a: any) => ({
          ...a.metadata,
          id: a.metadata.id || a.asset_id,
          dbId: a.id, // THE REAL UUID FROM DATABASE
          assetId: a.asset_id,
          status: a.status,
          brand: a.brand,
          model: a.model,
          install: a.install_date,
          lastService: a.last_service,
          nextService: a.next_service,
          logs: a.maintenance_logs.map((l: any) => ({
            id: l.id,
            date: l.date,
            issue: l.issue,
            note: l.note,
            status: l.status
          }))
        }))
      }))
    }))
  }
}
