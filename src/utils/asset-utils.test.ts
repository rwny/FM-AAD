import { describe, it, expect } from 'vitest'
import { determineStatus, getPeerId, computeACStats, extractFurnitureFromData } from '../utils/asset-utils'

describe('determineStatus', () => {
  it('returns Normal when no logs', () => {
    expect(determineStatus([])).toBe('Normal')
  })

  it('returns Normal for Completed status', () => {
    expect(determineStatus([{ status: 'Completed', issue: 'ล้างแอร์' }])).toBe('Normal')
  })

  it('returns Maintenance for Pending status', () => {
    expect(determineStatus([{ status: 'Pending', issue: 'รออะไหล่' }])).toBe('Maintenance')
  })

  it('returns Maintenance for In Progress status', () => {
    expect(determineStatus([{ status: 'In Progress', issue: 'กำลังซ่อม' }])).toBe('Maintenance')
  })

  it('returns Faulty for Faulty status', () => {
    expect(determineStatus([{ status: 'Faulty', issue: 'คอมเพรสเซอร์เสีย' }])).toBe('Faulty')
  })

  it('returns Faulty when issue contains "เสีย" regardless of status', () => {
    expect(determineStatus([{ status: 'Completed', issue: 'แอร์เสีย' }])).toBe('Faulty')
  })

  it('returns Faulty when issue contains "พัง"', () => {
    expect(determineStatus([{ status: 'Pending', issue: 'มอเตอร์พัง' }])).toBe('Faulty')
  })

  it('returns Faulty when issue contains "faulty" (English)', () => {
    expect(determineStatus([{ status: 'In Progress', issue: 'Unit faulty' }])).toBe('Faulty')
  })

  it('uses only the latest log', () => {
    expect(determineStatus([
      { status: 'Faulty', issue: 'พัง' },
      { status: 'Completed', issue: 'ซ่อมแล้ว' },
    ])).toBe('Faulty')
  })
})

describe('getPeerId', () => {
  it('returns CDU peer for FCU', () => {
    expect(getPeerId('fcu-101-1')).toBe('cdu-101-1')
  })

  it('returns FCU peer for CDU', () => {
    expect(getPeerId('cdu-302-2')).toBe('fcu-302-2')
  })

  it('returns null for non-AC ids', () => {
    expect(getPeerId('rm-101')).toBeNull()
    expect(getPeerId('lf-1')).toBeNull()
  })

  it('handles multi-segment numbers', () => {
    expect(getPeerId('fcu-101-1')).toBe('cdu-101-1')
    expect(getPeerId('cdu-101-1')).toBe('fcu-101-1')
  })
})

describe('computeACStats', () => {
  it('counts all normal as green', () => {
    const items = [
      { status: 'Normal' },
      { status: 'Normal' },
    ]
    expect(computeACStats(items)).toEqual({ green: 2, orange: 0, red: 0, total: 2 })
  })

  it('counts Maintenance as orange', () => {
    const items = [{ status: 'Maintenance' }]
    expect(computeACStats(items)).toEqual({ green: 0, orange: 1, red: 0, total: 1 })
  })

  it('counts Warning as orange', () => {
    const items = [{ status: 'Warning' }]
    expect(computeACStats(items)).toEqual({ green: 0, orange: 1, red: 0, total: 1 })
  })

  it('counts Faulty as red', () => {
    const items = [{ status: 'Faulty' }]
    expect(computeACStats(items)).toEqual({ green: 0, orange: 0, red: 1, total: 1 })
  })

  it('mixed status counts correctly', () => {
    const items = [
      { status: 'Normal' },
      { status: 'Normal' },
      { status: 'Maintenance' },
      { status: 'Faulty' },
      { status: 'Normal' },
    ]
    expect(computeACStats(items)).toEqual({ green: 3, orange: 1, red: 1, total: 5 })
  })

  it('returns zero totals for empty array', () => {
    expect(computeACStats([])).toEqual({ green: 0, orange: 0, red: 0, total: 0 })
  })
})

describe('extractFurnitureFromData', () => {
  it('returns empty array when no buildingData', () => {
    expect(extractFurnitureFromData({} as any)).toEqual([])
  })

  it('extracts from array-format floors', () => {
    const data = {
      floors: [
        {
          floor: 1,
          rooms: [
            {
              id: 'rm-101',
              name: 'Room 101',
              assets: [
                { id: 'LF-1.1', status: 'Normal', brand: 'SB' },
              ]
            }
          ]
        }
      ]
    }
    const result = extractFurnitureFromData(data as any)
    expect(result).toHaveLength(1)
    expect(result[0].floor).toBe(1)
    expect(result[0].room).toBe('rm-101')
    expect(result[0].status).toBe('Normal')
  })

  it('extracts from object-format floors (acSpecsJson fallback)', () => {
    const data = {
      floors: {
        '1': {
          '101': { type: 'AC', units: [] },
          '102': { type: 'FUR', units: [] }
        }
      }
    }
    const result = extractFurnitureFromData(data as any)
    expect(result).toHaveLength(0) // No assets in AC format
  })

  it('uses default floor index when floor prop missing', () => {
    const data = {
      floors: [
        {
          rooms: [
            {
              id: 'rm-101',
              assets: [{ id: 'BF-1', status: 'Faulty' }]
            }
          ]
        }
      ]
    }
    const result = extractFurnitureFromData(data as any)
    expect(result).toHaveLength(1)
    expect(result[0].floor).toBe(1) // fIdx + 1 = 0 + 1
  })
})
