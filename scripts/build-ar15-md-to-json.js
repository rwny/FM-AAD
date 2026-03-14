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

// Helper to get the most recent date from an asset's data
function getAssetEffectiveDate(asset) {
  let dates = [];
  if (asset.Install && asset.Install.match(/^\d{4}-\d{2}-\d{2}$/)) dates.push(asset.Install);
  if (asset.logs && asset.logs.length > 0) {
    asset.logs.forEach(l => { if (l.date) dates.push(l.date); });
  }
  if (dates.length === 0) return '0000-00-00';
  return dates.sort().reverse()[0]; // Return latest date
}

const lines = mdContent.split('\n');
const building = { building: 'AR15', floors: [] };

let currentFloor = null;
let currentRoom = null;
let currentLFType = null;
let currentLFTypeHistory = null;
let currentAsset = null;
let inStatusLog = false;
let lfTypes = {};
let rawAssets = []; // Temporary store for all assets found

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim() || line.startsWith('#')) continue;
  
  const indent = parseIndent(line);
  const value = extractValue(line);
  
  if (value.startsWith('FLOOR')) {
    currentFloor = { name: value, rooms: [] };
    building.floors.push(currentFloor);
    continue;
  }
  
  if (value.startsWith('rm-')) {
    const [roomId, ...nameParts] = value.split(':');
    currentRoom = {
      id: roomId.trim(),
      name: nameParts.join(':').trim() || roomId.trim(),
      assets: [] // Will be populated after post-processing
    };
    currentFloor.rooms.push(currentRoom);
    continue;
  }

  const typeMatch = value.match(/\[(LF-\d+)\]\s*(?::\s*(.+))?/);
  if (typeMatch) {
    currentLFType = { id: typeMatch[1], typeName: typeMatch[2] || '', history: [] };
    lfTypes[typeMatch[1]] = currentLFType;
    currentAsset = null;
    continue;
  }

  // Detect LF-X.X (Asset Instance)
  const instanceMatch = value.match(/^(LF-\d+\.\d+)$/);
  if (instanceMatch) {
    const instanceId = instanceMatch[1];
    const typeId = instanceId.split('.')[0];
    const typeInfo = lfTypes[typeId] || {};
    
    currentAsset = {
      id: instanceId,
      typeId: typeId,
      room: currentRoom.id, // Reference room
      typeName: typeInfo.typeName || '',
      brand: '',
      model: '',
      currentStatus: 'Normal',
      logs: [],
      history: []
    };
    rawAssets.push(currentAsset); // Store all instances
    inStatusLog = false;
    continue;
  }

  if (currentLFType && !currentAsset) {
    const yearMatch = value.match(/^(\d{4})$/);
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

  if (inStatusLog && currentAsset) {
    const logMatch = value.match(/(\d{4}-\d{2}-\d{2})\s*:\s*(.+)/);
    if (logMatch) {
      currentAsset.logs.push({ date: logMatch[1], issue: logMatch[2], note: '' });
    } else if (indent >= 8 && currentAsset.logs.length > 0) {
      const lastLog = currentAsset.logs[currentAsset.logs.length - 1];
      lastLog.note = (lastLog.note ? lastLog.note + ' ' : '') + value;
    }
  }
}

// POST-PROCESSING: Group by ID and find latest active version
building.floors.forEach(floor => {
  floor.rooms.forEach(room => {
    const roomAssets = rawAssets.filter(a => a.room === room.id);
    const idGroups = {};
    
    roomAssets.forEach(asset => {
      if (!idGroups[asset.id]) idGroups[asset.id] = [];
      idGroups[asset.id].push(asset);
    });

    Object.keys(idGroups).forEach(id => {
      const versions = idGroups[id];
      // Sort versions by their latest date
      versions.sort((a, b) => {
        return getAssetEffectiveDate(b).localeCompare(getAssetEffectiveDate(a));
      });

      const mainAsset = versions[0]; // The latest one
      const history = versions.slice(1); // Older ones

      // Merge history into main asset
      mainAsset.history = history.map(h => ({
        date: getAssetEffectiveDate(h),
        brand: h.brand,
        model: h.model,
        status: h.currentStatus,
        assetId: h['Asset-ID']
      }));

      // Check if retired
      if (mainAsset.currentStatus.includes('เลิกใช้')) {
        mainAsset.isRetired = true;
      }

      room.assets.push(mainAsset);
    });
  });
});

fs.writeFileSync(path.join(__dirname, '..', 'src', 'utils', 'AR15.json'), JSON.stringify(building, null, 2), 'utf-8');
fs.writeFileSync(path.join(__dirname, '..', 'src', 'utils', 'AR15-data.ts'), `// Auto-generated\nimport buildingDataJson from './AR15.json';\nexport const buildingData = buildingDataJson;\n`, 'utf-8');
console.log('✅ MD Database converted with Object Lifecycle support!');
