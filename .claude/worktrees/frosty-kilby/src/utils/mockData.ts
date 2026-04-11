import type { ACAsset } from '../types/bim';

export const mockACAssets: ACAsset[] = [
  {
    id: 'fcu-101',
    name: 'FCU Room 101',
    type: 'FCU',
    brand: 'Mitsubishi',
    model: 'MSY-JS18VF',
    capacity: '18,000 BTU',
    status: 'Normal',
    lastService: '2025-12-10',
    nextService: '2026-06-10',
    logs: [
      { id: 'L101-1', date: '2025-12-10', issue: 'Installation & Test', reporter: 'Tech Winai', status: 'Completed', note: 'System commissioned and running stable.' }
    ]
  },
  {
    id: 'cdu-101',
    name: 'CDU Room 101',
    type: 'CDU',
    brand: 'Mitsubishi',
    model: 'MUY-JS18VF',
    capacity: '18,000 BTU',
    status: 'Normal',
    lastService: '2025-12-10',
    nextService: '2026-06-10',
    logs: [
      { id: 'L101-2', date: '2025-12-10', issue: 'Initial Charge', reporter: 'Tech Winai', status: 'Completed', note: 'Refrigerant R32 charged to spec.' }
    ]
  },
  {
    id: 'fcu-201',
    name: 'FCU Room 201',
    type: 'FCU',
    brand: 'Daikin',
    model: 'FTKC24TV2S',
    capacity: '24,000 BTU',
    status: 'Normal',
    lastService: '2026-01-15',
    nextService: '2026-07-15',
    logs: [
      { id: 'L201-1', date: '2026-01-15', issue: 'Routine Cleaning', reporter: 'Tech Somchai', status: 'Completed', note: 'All filters replaced and coil cleaned.' }
    ]
  },
  {
    id: 'cdu-201',
    name: 'CDU Room 201',
    type: 'CDU',
    brand: 'Daikin',
    model: 'RKC24TV2S',
    capacity: '24,000 BTU',
    status: 'Faulty',
    lastService: '2026-01-15',
    nextService: '2026-03-15',
    logs: [
      { id: 'L201-2', date: '2026-03-12', issue: 'Compressor Failure', reporter: 'Supervisor Kittipong', status: 'Pending', note: 'Unusual loud noise detected during inspection. Suspect motor burnout.' }
    ]
  },
  {
    id: 'fcu-301',
    name: 'FCU Room 301',
    type: 'FCU',
    brand: 'Carrier',
    model: '42TVAA018',
    capacity: '18,000 BTU',
    status: 'Warning',
    lastService: '2026-02-20',
    nextService: '2026-08-20',
    logs: [
      { id: 'L301-1', date: '2026-03-10', issue: 'Water Leaking', reporter: 'Caretaker Malee', status: 'In Progress', note: 'Water dripping from the front panel. Drain pipe might be clogged.' }
    ]
  },
  {
    id: 'cdu-301',
    name: 'CDU Room 301',
    type: 'CDU',
    brand: 'Carrier',
    model: '38TVAA018',
    capacity: '18,000 BTU',
    status: 'Normal',
    lastService: '2026-02-20',
    nextService: '2026-08-20',
    logs: []
  }
];
