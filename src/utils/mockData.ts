import type { ACAsset } from '../types/bim';

export const mockACAssets: ACAsset[] = [
  {
    id: 'fcu-201',
    name: 'FCU Room 201',
    type: 'FCU',
    brand: 'Daikin',
    model: 'FCTV-24',
    capacity: '24,000 BTU',
    status: 'Normal',
    lastService: '2026-01-15',
    nextService: '2026-07-15',
    logs: [
      { id: 'L001', date: '2026-01-15', issue: 'Routine Cleaning', reporter: 'Tech Somchai', status: 'Completed', note: 'All filters replaced and coil cleaned.' }
    ]
  },
  {
    id: 'cdu-201',
    name: 'CDU Room 201',
    type: 'CDU',
    brand: 'Daikin',
    model: 'RZQ-Series',
    capacity: '24,000 BTU',
    status: 'Faulty',
    lastService: '2026-01-15',
    nextService: '2026-03-15',
    logs: [
      { id: 'L002', date: '2026-03-12', issue: 'Compressor Failure', reporter: 'Supervisor Kittipong', status: 'Pending', note: 'Unusual loud noise detected during inspection. Suspect motor burnout.' },
      { id: 'L003', date: '2026-01-15', issue: 'Refrigerant Check', reporter: 'Tech Somchai', status: 'Completed', note: 'Refilled gas to 75 psi.' }
    ]
  },
  {
    id: 'fcu-101',
    name: 'FCU Room 101',
    type: 'FCU',
    brand: 'Mitsubishi',
    model: 'MSY-JS',
    capacity: '18,000 BTU',
    status: 'Warning',
    lastService: '2025-12-10',
    nextService: '2026-06-10',
    logs: [
      { id: 'L004', date: '2026-03-10', issue: 'Water Leaking', reporter: 'Caretaker Malee', status: 'In Progress', note: 'Water dripping from the front panel. Drain pipe might be clogged.' }
    ]
  },
  {
    id: 'cdu-101',
    name: 'CDU Room 101',
    type: 'CDU',
    brand: 'Mitsubishi',
    model: 'MUY-JS',
    capacity: '18,000 BTU',
    status: 'Normal',
    lastService: '2025-12-10',
    nextService: '2026-06-10',
    logs: [
      { id: 'L005', date: '2025-12-10', issue: 'Installation & Test', reporter: 'Tech Winai', status: 'Completed', note: 'System commissioned and running stable.' }
    ]
  }
];
