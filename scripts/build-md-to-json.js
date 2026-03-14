import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// อ่านไฟล์ MD
const mdPath = path.join(__dirname, 'building-tree.md');
const mdContent = fs.readFileSync(mdPath, 'utf-8');

// Parse MD Content
const buildingData = {
  building: 'AR15',
  name: 'Shop ดำ',
  floors: [] as Floor[]
};

interface Asset {
  id: string;
  name: string;
  type: string;
  category: string;
  floor: number;
  room: string;
  brand?: string;
  model?: string;
  status: 'Normal' | 'Warning' | 'Maintenance' | 'Faulty';
  details?: string;
}

interface Room {
  id: string;
  number: string;
  name: string;
  floor: number;
  assets: Asset[];
}

interface Floor {
  floor: number;
  rooms: Room[];
}

// Helper: Parse each section
function parseRoom(section: string, floorNum: number): Room | null {
  const roomMatch = section.match(/#### Room (\d+)/);
  if (!roomMatch) return null;

  const roomNumber = roomMatch[1];
  const nameMatch = section.match(/\*\*Room Name:\*\*\s*\[([^\]]+)\]/);
  const roomName = nameMatch && nameMatch[1] !== '...' ? nameMatch[1] : `Room ${roomNumber}`;

  const assets: Asset[] = [];

  // Parse Furniture
  const furnitureSection = section.match(/\*\*Furniture:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|$)/);
  if (furnitureSection) {
    const lines = furnitureSection[1].split('\n').filter(l => l.trim().startsWith('-'));
    lines.forEach(line => {
      const match = line.match(/-\s*([a-zA-Z0-9-]+):\s*([^-]+)\s*-\s*([^-]+)\s*-\s*(\w+)/);
      if (match) {
        assets.push({
          id: match[1].toLowerCase(),
          name: match[2].trim(),
          type: 'Furniture',
          category: 'Furniture',
          floor: floorNum,
          room: roomNumber,
          brand: match[3].trim(),
          model: '',
          status: match[4] as any || 'Normal',
          details: match[3].trim()
        });
      }
    });
  }

  // Parse AC (FCU)
  const acSection = section.match(/\*\*AC:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|$)/);
  if (acSection) {
    const lines = acSection[1].split('\n').filter(l => l.trim().startsWith('-'));
    lines.forEach(line => {
      const fcuMatch = line.match(/FCU-(\d+):\s*([^-]+)\s*-\s*([^-]+)\s*-\s*(\w+)/);
      const cduMatch = line.match(/CDU-(\d+):\s*([^-]+)\s*-\s*([^-]+)\s*-\s*(\w+)/);
      
      if (fcuMatch) {
        assets.push({
          id: `fcu-${fcuMatch[1]}`,
          name: fcuMatch[2].trim(),
          type: 'FCU',
          category: 'AC',
          floor: floorNum,
          room: roomNumber,
          brand: fcuMatch[3].trim(),
          model: '',
          status: fcuMatch[4] as any || 'Normal'
        });
      } else if (cduMatch) {
        assets.push({
          id: `cdu-${cduMatch[1]}`,
          name: cduMatch[2].trim(),
          type: 'CDU',
          category: 'AC',
          floor: floorNum,
          room: roomNumber,
          brand: cduMatch[3].trim(),
          model: '',
          status: cduMatch[4] as any || 'Normal'
        });
      }
    });
  }

  return {
    id: `rm-${roomNumber}`,
    number: roomNumber,
    name: roomName,
    floor: floorNum,
    assets
  };
}

// Parse floors
const floorRegex = /### ชั้น (\d+)\n([\s\S]*?)(?=### ชั้น |### หลังคา|$)/g;
let floorMatch;

while ((floorMatch = floorRegex.exec(mdContent)) !== null) {
  const floorNum = parseInt(floorMatch[1]);
  const floorContent = floorMatch[2];
  
  const rooms: Room[] = [];
  const roomSections = floorContent.split('#### Room');
  
  roomSections.forEach(section => {
    if (!section.trim()) return;
    const room = parseRoom('#### Room' + section, floorNum);
    if (room && room.assets.length > 0) {
      rooms.push(room);
    }
  });

  if (rooms.length > 0) {
    buildingData.floors.push({ floor: floorNum, rooms });
  }
}

// Generate TypeScript file
const tsContent = `// Auto-generated from building-tree.md
// Run: node scripts/build-md-to-json.js

export interface BuildingAsset {
  id: string;
  name: string;
  type: string;
  category: string;
  floor: number;
  room: string;
  brand?: string;
  model?: string;
  status: 'Normal' | 'Warning' | 'Maintenance' | 'Faulty';
  details?: string;
}

export interface RoomData {
  id: string;
  number: string;
  name: string;
  floor: number;
  assets: BuildingAsset[];
}

export interface FloorData {
  floor: number;
  rooms: RoomData[];
}

export interface BuildingData {
  building: string;
  name: string;
  floors: FloorData[];
}

export const buildingData: BuildingData = ${JSON.stringify(buildingData, null, 2)};

// Helper: Get all assets as flat array
export const getAllAssets = (): BuildingAsset[] => {
  return buildingData.floors.flatMap(floor => 
    floor.rooms.flatMap(room => room.assets)
  );
};

// Helper: Get assets by room
export const getAssetsByRoom = (roomId: string): BuildingAsset[] => {
  return getAllAssets().filter(asset => asset.room === roomId);
};

// Helper: Get assets by floor
export const getAssetsByFloor = (floor: number): BuildingAsset[] => {
  return getAllAssets().filter(asset => asset.floor === floor);
};

// Helper: Get assets by status
export const getAssetsByStatus = (status: BuildingAsset['status']): BuildingAsset[] => {
  return getAllAssets().filter(asset => asset.status === status);
};
`;

// Write output
const outputPath = path.join(__dirname, 'building-data.ts');
fs.writeFileSync(outputPath, tsContent, 'utf-8');

console.log('✅ Generated building-data.ts successfully!');
console.log(`📊 Found ${buildingData.floors.length} floors`);
buildingData.floors.forEach(floor => {
  console.log(`   Floor ${floor.floor}: ${floor.rooms.length} rooms`);
});
