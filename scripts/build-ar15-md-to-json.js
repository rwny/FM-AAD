import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mdPath = path.join(__dirname, '..', 'src', 'utils', 'AR15.md');
const mdContent = fs.readFileSync(mdPath, 'utf-8');

function parseIndent(line) {
  const match = line.match(/^(\s*)-/);
  if (!match) return -1;
  const spaces = match[1].replace(/\t/g, '    ');
  return Math.floor(spaces.length / 4);
}

function extractValue(line) {
  const match = line.match(/-\s*(.+)/);
  return match ? match[1].trim() : '';
}

function parseKeyValue(line) {
  const withoutDash = line.replace(/^\s*-\s*/, '').trim();
  const match = withoutDash.match(/([A-Za-z][A-Za-z0-9-_]*)\s*:\s*(.+)/);
  if (match) {
    return { key: match[1].trim(), value: match[2].trim() };
  }
  return null;
}

const lines = mdContent.split('\n');
const building = {
  building: 'AR15',
  floors: []
};

let currentFloor = null;
let currentRoom = null;
let currentCategory = null;
let lfTypes = {}; 
let currentLFType = null;
let currentLFTypeHistory = null; 
let currentAsset = null;
let inStatusLog = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  const indent = parseIndent(line);
  const value = extractValue(line);
  
  if (indent === 1 && value.startsWith('FLOOR')) {
    currentFloor = { name: value, rooms: [] };
    building.floors.push(currentFloor);
    continue;
  }
  
  if (indent === 2 && value.startsWith('rm-')) {
    const [roomId, ...nameParts] = value.split(':');
    currentRoom = {
      id: roomId.trim(),
      name: nameParts.join(':').trim() || roomId.trim(),
      assets: []
    };
    currentFloor.rooms.push(currentRoom);
    continue;
  }
  
  if (indent === 4 && value.match(/^(BF|LF)$/)) {
    currentCategory = value.toUpperCase();
    continue;
  }
  
  if (indent === 5 && currentCategory === 'LF') {
    const typeMatch = value.match(/\[(LF-\d+)\]\s*(?::\s*(.+))?/);
    if (typeMatch) {
      currentLFType = { id: typeMatch[1], typeName: typeMatch[2] || '', history: [] };
      lfTypes[typeMatch[1]] = currentLFType;
      currentLFTypeHistory = null;
      currentAsset = null;
      continue;
    }

    const instanceMatch = value.match(/^(LF-\d+\.\d+)$/);
    if (instanceMatch) {
      const instanceId = instanceMatch[1];
      const typeId = instanceId.split('.')[0];
      const typeInfo = lfTypes[typeId] || {};
      let latestSpec = typeInfo.history?.[typeInfo.history.length - 1] || {};
      currentAsset = {
        id: instanceId,
        typeId: typeId,
        typeName: latestSpec.typeName || typeInfo.typeName,
        brand: latestSpec.brand || '',
        model: latestSpec.model || '',
        currentStatus: latestSpec.status || 'Normal',
        logs: [],
        history: typeInfo.history || []
      };
      currentRoom.assets.push(currentAsset);
      inStatusLog = false;
      continue;
    }
  }
  
  if (indent === 6 && currentLFType && !currentAsset) {
    const yearMatch = value.match(/^(\d{4})/);
    if (yearMatch) {
      currentLFTypeHistory = { year: yearMatch[1] };
      currentLFType.history.push(currentLFTypeHistory);
      continue;
    }
  }

  const kv = parseKeyValue(line);
  if (kv) {
    const target = currentAsset || currentLFTypeHistory || currentLFType;
    if (target) {
      target[kv.key] = kv.value; 
      if (kv.key.toLowerCase() === 'status-log') inStatusLog = true;
      if (kv.key.toLowerCase() === 'status') target.currentStatus = kv.value;
    }
    continue;
  }

  if (inStatusLog && indent >= 7 && currentAsset) {
    const logMatch = value.match(/(\d{4}-\d{2}-\d{2})\s*:\s*(.+)/);
    if (logMatch) {
      currentAsset.logs.push({ date: logMatch[1], issue: logMatch[2], note: '' });
    } else if (indent >= 8 && currentAsset.logs.length > 0) {
      const lastLog = currentAsset.logs[currentAsset.logs.length - 1];
      lastLog.note = (lastLog.note ? lastLog.note + ' ' : '') + value;
    }
  }
}

fs.writeFileSync(path.join(__dirname, '..', 'src', 'utils', 'AR15.json'), JSON.stringify(building, null, 2), 'utf-8');
fs.writeFileSync(path.join(__dirname, '..', 'src', 'utils', 'AR15-data.ts'), `// Auto-generated\nimport buildingDataJson from './AR15.json';\nexport const buildingData = buildingDataJson;\n`, 'utf-8');
console.log('✅ MD Database converted to AR15.json successfully!');
