const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../src/utils/AR15-DATA.md');
const outputPath = path.join(__dirname, '../src/utils/ac-specs.json');

function parseACData() {
  if (!fs.existsSync(mdPath)) {
    console.error(`❌ Source file not found: ${mdPath}`);
    return;
  }
  
  const content = fs.readFileSync(mdPath, 'utf8');
  // Normalize multi-line properties into single line for easier parsing
  // This converts "- Name { \n Key: Val \n }" into "- Name { Key: Val }"
  const normalizedContent = content.replace(/\{([\s\S]*?)\}/g, (match) => {
    return match.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  });

  const lines = normalizedContent.split('\n');
  const result = {
    types: {}, 
    floors: {},
    raw: [] 
  };

  const stack = [];

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;

    const indent = line.match(/^(\s*)/)[0].length;
    const valueMatch = trimmedLine.match(/^-\s*([^{]+)(?:\{([^}]+)\})?/);
    
    if (!valueMatch) return;

    const name = valueMatch[1].trim();
    const propsRaw = valueMatch[2] || '';
    const properties = {};

    if (propsRaw) {
      propsRaw.split(',').forEach(p => {
        const parts = p.split(':');
        if (parts.length >= 2) {
          const k = parts[0].trim();
          const v = parts.slice(1).join(':').trim();
          properties[k] = v;
        }
      });
    }

    const node = {
      name,
      indent,
      properties,
      children: []
    };

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node);
    } else {
      result.raw.push(node);
    }

    stack.push(node);
  });

  const buildingRoot = result.raw.find(n => n.name.toLowerCase().includes('ar15'));
  
  if (buildingRoot) {
    buildingRoot.children.forEach(floorNode => {
      if (floorNode.name.toLowerCase().startsWith('floor-')) {
        const floorNum = floorNode.name.replace('floor-', '').trim();
        result.floors[floorNum] = {};

        floorNode.children.forEach(roomNode => {
          if (roomNode.name.toLowerCase().startsWith('room-')) {
            const roomNum = roomNode.name.replace('room-', '').trim();
            result.floors[floorNum][roomNum] = {};

            const findACNodes = (parentNode) => {
              parentNode.children.forEach(child => {
                if (child.name.toLowerCase().startsWith('ac-')) {
                  const acId = child.name;
                  const units = [];
                  
                  child.children.forEach(unitNode => {
                    units.push(unitNode.name);
                  });

                  result.floors[floorNum][roomNum][acId] = {
                    units: units,
                    type: child.properties.Type || '',
                    assetId: child.properties.AssetID || '',
                    installedDate: child.properties.InstallDate || '',
                    systemId: acId,
                    metadata: child.properties
                  };
                } else if (child.children.length > 0) {
                  // Recursively look deeper (for AC/EE group nodes)
                  findACNodes(child);
                }
              });
            };

            findACNodes(roomNode);
          }
        });
      }
    });
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`✅ Fixed Parser: Processed ac.md -> ac-specs.json`);
}

parseACData();
