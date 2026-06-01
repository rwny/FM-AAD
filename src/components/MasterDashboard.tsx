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
  const [allLogs, setAllLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    const combinedAssets: ACAsset[] = []
    const combinedRooms: Room[] = []
    const allLogList: any[] = []

    try {
      for (const b of buildings) {
        try {
          // Fetch building data from Supabase
          const { data: bldRes } = await supabase
            .from('buildings')
            .select('*')
            .eq('code', b.code)
            .maybeSingle()

          if (!bldRes) continue

          const { data: floors } = await supabase
            .from('floors')
            .select('*, rooms(*, assets(*, maintenance_logs(*)))')
            .eq('building_id', bldRes.id)
            .order('floor_number', { ascending: true })

          if (!floors) continue

          for (const f of floors) {
            const floorNum = f.floor_number || 1
            for (const room of f.rooms || []) {
              const roomId = room.room_id?.toLowerCase() || `rm-${room.name}`
              const roomNumber = (room.room_id || room.name || '').replace(/[^0-9]/g, '') || '0'
              const roomName = room.name || room.room_id || ''

              combinedRooms.push({
                id: roomId,
                number: roomNumber,
                floor: floorNum,
                name: roomName,
              })

              for (const a of room.assets || []) {
                const assetId = (a.metadata?.id || a.asset_id || '').toLowerCase()
                const type: 'FCU' | 'CDU' = assetId.startsWith('cdu') ? 'CDU' : 'FCU'
                combinedAssets.push({
                  id: assetId,
                  name: assetId.toUpperCase(),
                  type,
                  brand: a.brand || 'Unknown',
                  model: a.model || '---',
                  capacity: a.metadata?.capacity || '---',
                  status: a.status || 'Normal',
                  lastService: a.last_service || '',
                  nextService: a.next_service || '',
                  metadata: { buildingCode: b.code, installDate: a.install_date || '' },
                  install: a.install_date || '',
                } as any)

                for (const log of a.maintenance_logs || []) {
                  allLogList.push({ ...log, _buildingCode: b.code })
                }
              }
            }
          }
        } catch { /* building has no data — skip */ }
      }
    } catch { /* ignore */ }

    // Sort assets by building code then id
    combinedAssets.sort((a, b) => {
      const ca = (a as any).metadata?.buildingCode || ''
      const cb = (b as any).metadata?.buildingCode || ''
      return ca.localeCompare(cb) || a.id.localeCompare(b.id)
    })
    combinedRooms.sort((a, b) => a.number.localeCompare(b.number))

    setAllAssets(combinedAssets)
    setAllRooms(combinedRooms)
    setAllLogs(allLogList)
    setLoading(false)
  }

  const handleSelect = (assetId: string) => {
    const asset = allAssets.find(a => a.id === assetId)
    const bldCode = (asset as any)?.metadata?.buildingCode || 'AR15'
    navigate(`/${bldCode}/ac/${assetId}`)
  }

  const handleSelectLog = (log: any) => {
    const bldCode = log._buildingCode || 'AR15'
    const assetId = log.asset_id || ''
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
          onSelectLog={handleSelectLog}
          onClose={() => navigate('/')}
        />
      )}
    </div>
  )
}
