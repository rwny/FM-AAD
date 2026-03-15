export interface Room {
  id: string;      // rm-101
  number: string;  // 101
  floor: number;   // 1
  name: string;    // Room 101
  systems?: string[];
  assets?: FurnitureAsset[];
}

export interface MaintenanceLog {
  id: string;
  date: string;
  issue: string;
  reporter?: string;
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
  logs?: MaintenanceLog[];
}

export interface FurnitureAsset {
  id: string;        // LF-1.1
  assetId: string;   // สถ.2568-1109
  typeId: string;    // LF-1
  typeName: string;  // โต๊ะ 4 ขา
  category: 'LF' | 'BF';
  floor: number;
  room: string;
  status: string;
  brand: string;
  model: string;
  sale?: string;
  tel?: string;
  install: string;
  lastService: string;
  nextService: string;
  logs: MaintenanceLog[];
  name: string;
  history?: any[];
}

export type BIMMode = 'AR' | 'Fur' | 'EE' | 'AC';

export interface BuildingData {
  building: string;
  name: string;
  floors: {
    floor: number;
    rooms: Room[];
  }[];
}
