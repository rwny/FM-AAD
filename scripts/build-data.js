import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'src', 'utils');

function parseIndent(line) {
  const match = line.match(/^(\s*)-/);
  if (!match) return -1;
  const spaces = match[1].replace(/\t/g, '    ');
  return Math.floor(spaces.length / 4);
}

function extractValue(line) {
  const match = line.match(/-\s*([^{]+)/);
  return match ? match[1].trim() : '';
}

function extractProps(line) {
    const match = line.match(/\{([^}]+)\}/);
    if (!match) return {};
    const props = {};
    match[1].split(',').forEach(p => {
        const parts = p.split(':');
        if (parts.length >= 2) {
            props[parts[0].trim().toLowerCase()] = parts.slice(1).join(':').trim();
        }
    });
    return props;
}

function processBuilding(buildingId) {
    const mdPath = path.join(dataDir, `${buildingId}-DATA.md`);
    if (!fs.existsSync(mdPath)) return;

    console.log(`\n📦 Generating JSON for ${buildingId}...`);
    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    const lines = mdContent.split('\n');

    const building = { building: buildingId, floors: {} };
    let currentFloor = null;
    let currentRoom = null;
    let currentSystem = null;

    for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const indent = parseIndent(line);
        const name = extractValue(line);
        const props = extractProps(line);

        if (name.startsWith('floor-')) {
            const floorNum = name.replace('floor-', '');
            building.floors[floorNum] = {};
            currentFloor = building.floors[floorNum];
            continue;
        }

        if (name.startsWith('room-') && currentFloor) {
            const roomId = name.replace('room-', '');
            currentFloor[roomId] = {};
            currentRoom = currentFloor[roomId];
            continue;
        }

        const systems = ['AC', 'EE', 'ARCH', 'FUR'];
        if (systems.includes(name) && currentRoom) {
            currentRoom[name] = {};
            currentSystem = currentRoom[name];
            continue;
        }

        // If it's an asset (like AC-101-1 or FCU-xxx)
        if (currentSystem && indent >= 3) {
            // Simplified logic for asset grouping
            // In a real scenario, this would be more complex to match the specific UI needs
            // Here we just store it to ensure the file is generated
            currentSystem[name] = { 
                id: name,
                ...props
            };
        }
    }

    const jsonPath = path.join(dataDir, `${buildingId}.json`);
    const tsPath = path.join(dataDir, `${buildingId}-data.ts`);

    fs.writeFileSync(jsonPath, JSON.stringify(building, null, 2), 'utf-8');
    fs.writeFileSync(tsPath, `// Auto-generated\nimport buildingDataJson from './${buildingId}.json';\nexport const buildingData = buildingDataJson;\n`, 'utf-8');
    
    console.log(`   ✅ Created ${buildingId}.json and ${buildingId}-data.ts`);
}

function run() {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('-DATA.md'));
    files.forEach(file => {
        const buildingId = file.replace('-DATA.md', '');
        processBuilding(buildingId);
    });
}

run();
