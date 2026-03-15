import fs from 'fs';
import path from 'path';

const mdPath = './src/utils/AR15-DATA.md';
const outputPath = './src/utils/AR15.json';

function parseMD(content) {
    const lines = content.split('\n');
    const result = {
        building: "AR15",
        floors: []
    };

    let currentFloor = null;
    let currentRoom = null;
    let currentAsset = null;
    let inStatusLog = false;
    let lfTypes = {};
    let currentTypeContext = null;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const indent = line.search(/\S/);
        const value = trimmed.replace(/^- /, '').trim();

        // Floor: (indent 4)
        if (indent === 4 && value.startsWith('FLOOR')) {
            currentFloor = { name: value, rooms: [] };
            result.floors.push(currentFloor);
            return;
        }

        // Room: (indent 8)
        if (indent === 8 && value.startsWith('rm-')) {
            const [id, name] = value.split(':').map(s => s.trim());
            currentRoom = { id, name: name || id, assets: [] };
            currentFloor.rooms.push(currentRoom);
            return;
        }

        // LF Type Definition: (indent 20, e.g., [LF-1])
        if (indent === 20 && value.startsWith('[LF-')) {
            const typeId = value.match(/\[(LF-\d+)\]/)[1];
            lfTypes[typeId] = { id: typeId };
            currentTypeContext = lfTypes[typeId];
            currentAsset = null;
            return;
        }

        // LF Instance: (indent 20, e.g., LF-1.1)
        if (indent === 20 && value.match(/^LF-\d+\.\d+$/)) {
            const instanceId = value;
            const typeId = instanceId.split('.')[0];
            const typeData = lfTypes[typeId] || {};
            
            currentAsset = {
                id: instanceId,
                typeId: typeId,
                typeName: typeData.Type || '',
                brand: typeData.Brand || '',
                model: typeData.Model || typeData.odel || '', // handle typo
                logs: [],
                currentStatus: 'Unknown' // Default
            };
            currentRoom.assets.push(currentAsset);
            currentTypeContext = null;
            inStatusLog = false;
            return;
        }

        // Property / Key-Value: (indent 24)
        if (indent === 24) {
            if (value === 'Status-log') {
                inStatusLog = true;
                return;
            }
            
            const [key, ...valParts] = value.split(':').map(s => s.trim());
            const val = valParts.join(':').trim();

            if (currentTypeContext) {
                currentTypeContext[key] = val;
            } else if (currentAsset) {
                currentAsset[key] = val;
            }
            return;
        }

        // Logs: (indent 28)
        if (indent === 28 && inStatusLog && currentAsset) {
            const [date, ...issueParts] = value.split(':').map(s => s.trim());
            const issue = issueParts.join(':').trim();
            if (date.match(/^\d{4}/)) { // Starts with date
                currentAsset.logs.push({ date, issue, note: '' });
                // อัปเดตสถานะปัจจุบันจาก Log ล่าสุด
                currentAsset.currentStatus = issue;
            } else if (currentAsset.logs.length > 0) { // Sub-note
                currentAsset.logs[currentAsset.logs.length - 1].note = value;
            }
            return;
        }
        
        // Deep Note: (indent 32)
        if (indent === 32 && inStatusLog && currentAsset && currentAsset.logs.length > 0) {
            const lastLog = currentAsset.logs[currentAsset.logs.length - 1];
            lastLog.note = (lastLog.note ? lastLog.note + ' ' : '') + value;
            return;
        }
    });

    return result;
}

try {
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const jsonData = parseMD(mdContent);
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Success! Updated JSON created at ${outputPath}`);
} catch (err) {
    console.error('❌ Error:', err.message);
}
