export function determineStatus(logs: { status: string; issue?: string; date?: string }[], installDate?: string): string {
  if (logs.length === 0) {
    if (installDate) {
      const nextSvc = getNextServiceDate(installDate, logs)
      const daysLeft = Math.round((nextSvc.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysLeft < 0) return 'Faulty'
      if (daysLeft <= 90) return 'Maintenance'
    }
    return 'Normal'
  }

  const latest = logs[0]
  const issueText = (latest.issue || '').toLowerCase()

  if (issueText.includes('เสีย') || issueText.includes('พัง') || issueText.includes('faulty') || latest.status === 'Faulty')
    return 'Faulty'
  if (latest.status === 'Completed') {
    if (installDate) {
      const nextSvc = getNextServiceDate(installDate, logs)
      const daysLeft = Math.round((nextSvc.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysLeft < 0) return 'Faulty'
      if (daysLeft <= 90) return 'Maintenance'
    }
    return 'Normal'
  }
  if (['In Progress', 'Pending'].includes(latest.status)) return 'Maintenance'

  return 'Normal'
}

function getNextServiceDate(installDate: string, logs: { date?: string; status?: string }[]): Date {
  const install = new Date(installDate || '2024-01-01')
  let lastService = install
  logs.forEach(log => {
    if (log.status === 'Completed' && log.date) {
      const d = new Date(log.date)
      if (d > lastService) lastService = d
    }
  })
  lastService.setFullYear(lastService.getFullYear() + 1)
  return lastService
}

export function getPeerId(assetId: string): string | null {
  const prefix = assetId.split('-')[0]?.toLowerCase()
  const number = assetId.split('-').slice(1).join('-')
  const peerPrefix = prefix === 'fcu' ? 'cdu' : prefix === 'cdu' ? 'fcu' : null
  return peerPrefix ? `${peerPrefix}-${number}` : null
}

export function computeACStats(items: { status: string }[]): { green: number; orange: number; red: number; total: number } {
  const stats = { green: 0, orange: 0, red: 0, total: items.length }
  items.forEach((item) => {
    if (item.status === 'Maintenance' || item.status === 'Warning') stats.orange++
    else if (item.status === 'Faulty') stats.red++
    else stats.green++
  })
  return stats
}

export function extractFurnitureFromData(buildingData: Record<string, unknown>): Record<string, unknown>[] {
  const assets: Record<string, unknown>[] = []
  if (!buildingData || !buildingData.floors) return assets

  const rawFloors = buildingData.floors as Record<string, unknown>[] | Record<string, unknown>
  const floorsArray = Array.isArray(rawFloors)
    ? rawFloors as Record<string, unknown>[]
    : Object.entries(rawFloors as Record<string, Record<string, unknown>>).map(([num, data]) => ({
        floor: parseInt(num),
        rooms: Object.entries(data as Record<string, unknown>).map(([rId]) => ({
          id: `rm-${rId}`,
          name: `Room ${rId}`,
          assets: [] as unknown[]
        }))
      }))

  floorsArray.forEach((f, fIdx) => {
    const floorNum = (f.floor as number) || (fIdx + 1)
    const rooms = f.rooms as Record<string, unknown>[]
    if (rooms && Array.isArray(rooms)) {
      rooms.forEach((r) => {
        const rAssets = r.assets as Record<string, unknown>[]
        if (rAssets && Array.isArray(rAssets)) {
          rAssets.forEach((a) => {
            assets.push({
              ...a,
              floor: floorNum,
              room: r.id as string,
              status: (a.status || a.currentStatus || 'Normal') as string
            })
          })
        }
      })
    }
  })
  return assets
}
