import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { buildings } from '../utils/buildings'
import { ProjectDashboard } from './ui/ProjectDashboard'
import type { ACAsset, Room } from '../types/bim'

export function MasterDashboard() {
  const navigate = useNavigate()
  const [allAssets, setAllAssets] = useState<ACAsset[]>([])
  const [allRooms, setAllRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    const combinedAssets: ACAsset[] = []
    const combinedRooms: Room[] = []

    try {
      for (const b of buildings) {
        // Only fetch buildings that exist in Supabase
        const { data: bldRes } = await supabase
          .from('buildings')
          .select('id, code')
          .eq('code', b.code)
          .maybeSingle()

        if (!bldRes) continue

        // Fetch floors for this building
        const { data: floors } = await supabase
          .from('floors')
          .select('*, rooms(*)')
          .eq('building_id', bldRes.id)

        if (!floors || floors.length === 0) continue

        for (const f of floors) {
          const floorNum = f.floor_number || 1
          for (const room of f.rooms || []) {
            const roomId = room.room_id?.toLowerCase() || `rm-${room.name}`
            const roomNumber = (room.room_id || room.name || '').replace(/[^0-9]/g, '') || '0'

            combinedRooms.push({
              id: roomId,
              number: roomNumber,
              floor: floorNum,
              name: room.name || room.room_id || '',
            })

            // Fetch assets for this room
            const { data: assets } = await supabase
              .from('assets')
              .select('*')
              .eq('room_id', room.id)

            if (!assets) continue

            for (const a of assets) {
              const metadata = a.metadata || {}
              const assetId = (metadata.id || a.asset_id || '').toLowerCase()
              if (!assetId) continue

              const type: 'FCU' | 'CDU' = assetId.startsWith('cdu') ? 'CDU' : 'FCU'
              combinedAssets.push({
                id: assetId,
                name: assetId.toUpperCase(),
                type,
                brand: a.brand || 'Unknown',
                model: a.model || '---',
                capacity: metadata.capacity || '---',
                status: a.status || 'Normal',
                lastService: a.last_service || '',
                nextService: a.next_service || '',
                metadata: { buildingCode: b.code },
                install: a.install_date || '',
              } as any)
            }
          }
        }
        console.log(`[Master] ${b.code}: ${combinedAssets.length} total AC so far`)
      }
    } catch (e) {
      console.warn('[Master] load failed:', e)
    }

    combinedAssets.sort((a, b) => a.id.localeCompare(b.id))
    setAllAssets(combinedAssets)
    setAllRooms(combinedRooms)
    setLoading(false)
    console.log(`[Master] DONE: ${combinedAssets.length} AC units from all buildings`)
  }

  const handleSelect = (assetId: string) => {
    const asset = allAssets.find(a => a.id === assetId)
    const bldCode = (asset as any)?.metadata?.buildingCode || 'AR15'
    navigate(`/${bldCode}/ac/${assetId}`)
  }

  return (
    <div className="fixed inset-0 z-[110] bg-stone-50 dark:bg-zinc-950 overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-full text-stone-400 dark:text-zinc-600 text-sm">
          กำลังโหลดข้อมูลทุกอาคาร...
        </div>
      ) : allAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-5xl">📊</div>
          <p className="text-stone-400 dark:text-zinc-500 text-sm">ยังไม่มีข้อมูล AC ในระบบ</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm"
          >
            กลับหน้าแรก
          </button>
        </div>
      ) : (
        <ProjectDashboard
          assets={allAssets}
          rooms={allRooms}
          onSelect={handleSelect}
          onSelectLog={(log: any) => handleSelect(log.asset_id || '')}
          onClose={() => navigate('/')}
        />
      )}
    </div>
  )
}
