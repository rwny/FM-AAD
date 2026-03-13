export interface Room {
  id: string;      // rm-101
  number: string;  // 101
  floor: number;   // 1
  name: string;    // Room 101
}

export interface MaintenanceLog {
  id: string;
  date: string;
  issue: string;
  reporter: string;
  status: 'Completed' | 'Pending' | 'In Progress';
  note?: string;
}

export interface ACAsset {
  id: string;      // fcu-101, cdu-01
  name: string;    // Fan Coil Unit 101
  type: 'FCU' | 'CDU';
  brand: string;
  model: string;
  capacity: string;
  status: 'Normal' | 'Warning' | 'Maintenance' | 'Faulty';
  lastService: string;
  nextService: string;
  logs?: MaintenanceLog[]; // Added Logs
}

export interface BuildingData {
  id: string;
  name: string;
  rooms: Room[];
}
