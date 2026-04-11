const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../src/utils/AR15-AC-DATA.md');
const outputPath = path.join(__dirname, '../src/utils/ac-specs.json');

function parseACData() {
  const content = fs.readFileSync(mdPath, 'utf8');
  const lines = content.split('\n');

  const result = {
    types: {},
    floors: {}
  };

  let currentSection = null;
  let currentFloor = null;
  let currentRoom = null;
  let currentAC = null;
  let currentType = null;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine === 'AR15-AC-DATA') return;

    const indent = line.match(/^(\s*)/)[0].length;
    
    if (trimmedLine === '- TYPE') {
      currentSection = 'TYPE';
      return;
    }
    if (trimmedLine.startsWith('- FLOOR-')) {
      currentSection = 'FLOOR';
      const floorMatch = trimmedLine.match(/- FLOOR-(\d+)/);
      if (floorMatch) {
        currentFloor = floorMatch[1];
        result.floors[currentFloor] = {};
      }
      return;
    }

    if (currentSection === 'TYPE') {
      if (trimmedLine.startsWith('- [') && trimmedLine.endsWith(']')) {
        currentType = trimmedLine.match(/\[(.*?)\]/)[1];
        result.types[currentType] = { id: currentType };
      } else if (currentType && trimmedLine.startsWith('- ')) {
        const parts = trimmedLine.substring(2).split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim().toLowerCase();
          const value = parts.slice(1).join(':').trim().replace(/"/g, '');
          result.types[currentType][key] = value;
        }
      }
    }

    if (currentSection === 'FLOOR') {
      if (indent === 4 && trimmedLine.startsWith('- ')) {
        currentRoom = trimmedLine.substring(2).trim();
        if (currentRoom === 'no-AC') return;
        if (!result.floors[currentFloor]) result.floors[currentFloor] = {};
        result.floors[currentFloor][currentRoom] = {};
      } 
      else if (indent === 8 && trimmedLine.startsWith('- ')) {
        currentAC = trimmedLine.substring(2).trim();
        if (currentRoom && result.floors[currentFloor][currentRoom]) {
          result.floors[currentFloor][currentRoom][currentAC] = {
            units: []
          };
        }
      }
      else if (indent === 12 && trimmedLine.startsWith('- ')) {
        if (!currentAC || !currentRoom || !result.floors[currentFloor][currentRoom][currentAC]) return;

        const content = trimmedLine.substring(2).trim();
        if (content.includes(':')) {
          const parts = content.split(':');
          const key = parts[0].trim().toLowerCase();
          const value = parts.slice(1).join(':').trim().replace(/"/g, '');
          
          // Map key name to match what App.tsx expects (install-date -> installDate)
          const finalKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          result.floors[currentFloor][currentRoom][currentAC][finalKey] = value;
        } else {
          result.floors[currentFloor][currentRoom][currentAC].units.push(content);
        }
      }
    }
  });

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log('✅ Updated ac-specs.json with Install Date.');
}

parseACData();
