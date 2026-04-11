const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const dataDir = path.join(__dirname, '../src/utils');

function parseMDHierarchy(filePath, buildingId) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rawLines = content.split('\n');

  // Normalize multi-line properties
  const lines = [];
  for (let line of rawLines) {
    if (line.match(/^\s*-/)) {
      lines.push(line.replace(/\r/g, ''));
    } else {
      if (lines.length > 0 && line.trim()) {
        lines[lines.length - 1] += " " + line.trim();
      }
    }
  }

  const nodes = {};
  const triplets = [];
  const stack = [];
  const genericNames = ['AC', 'EE', 'ARCH', 'FUR', 'CCTV'];

  for (let line of lines) {
    const match = line.match(/^(\s*)-\s*([^{]+)(?:\{([^}]+)\})?/);
    if (!match) continue;

    const indent = match[1].length;
    let name = match[2].trim();
    const propsRaw = match[3] || '';
    const metadata = { building_id: buildingId }; // Tag building context

    if (propsRaw) {
      propsRaw.split(',').forEach(p => {
        const parts = p.split(':');
        if (parts.length >= 2) {
          const k = parts[0].trim().toLowerCase();
          const v = parts.slice(1).join(':').trim();

          if (k === 'assetid') metadata.asset_id = v;
          else if (k === 'type') metadata.ac_type = v;
          else if (k === 'installdate') metadata.install_date = v;
          else if (k === 'connectsto') metadata.connects_to = v.split(',').map(x => x.trim());
          else if (k === 'connectsfrom') metadata.connects_from = v.split(',').map(x => x.trim());
          else if (k === 'monitors' || k === 'monitor') metadata.monitors = v.split(',').map(x => x.trim());
          else metadata[k] = v;
        }
      });
    }

    // Determine category
    let type = 'unknown';
    if (genericNames.includes(name)) type = 'system_group';
    else if (name.includes('FCU')) type = 'fcu';
    else if (name.includes('CDU')) type = 'cdu';
    else if (name.startsWith('AC-')) type = 'ac_set';
    else if (name.startsWith('PIPE-')) type = 'pipe';
    else if (name.startsWith('LP-') || name.startsWith('CU-')) type = 'load_panel';
    else if (name.startsWith('PG-')) type = 'power_outlet';
    else if (name.startsWith('SW-')) type = 'switch';
    else if (name.startsWith('LI-')) type = 'light_fixture';
    else if (name.startsWith('room-')) type = 'room';
    else if (name.startsWith('floor-')) type = 'floor';
    else if (name.startsWith('NVR-')) type = 'nvr';
    else if (name.startsWith('CCTV-')) type = 'cctv_camera';
    else if (name.toLowerCase() === buildingId.toLowerCase()) type = 'building';

    // Hierarchy Logic: Find parent
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack.length > 0 ? stack[stack.length - 1] : null;

    // --- GLOBAL UNIQUE PREFIX LOGIC ---
    // Rule: Prefix everything with BuildingId unless it's the building node itself
    let uniqueName = name;
    if (type === 'building') {
        uniqueName = buildingId;
    } else {
        // For generic headers, include parent in name before building prefix
        if (genericNames.includes(name) && parent) {
            uniqueName = `${buildingId}-${parent.rawName}-${name}`;
        } else {
            uniqueName = `${buildingId}-${name}`;
        }
    }
    
    metadata.display_name = name; // UI will still show the short name

    nodes[uniqueName] = { type, metadata, rawName: name };

    if (parent) {
      triplets.push({ sub: parent.uniqueName, pred: 'contains', obj: uniqueName });
    }
    stack.push({ indent, name, uniqueName, rawName: name });
  }

  return { nodes, triplets };
}

async function syncBuilding(buildingId) {
    const mdPath = path.join(dataDir, `${buildingId}-DATA.md`);
    if (!fs.existsSync(mdPath)) return;

    console.log(`\n📖 Syncing Building ${buildingId} from ${mdPath}...`);
    const { nodes, triplets } = parseMDHierarchy(mdPath, buildingId);

    // 1. Filter and Sync Nodes
    const acNodes = Object.entries(nodes).filter(([_, data]) => data.type !== 'unknown');
    console.log(`🚀 Sending ${acNodes.length} nodes to Supabase...`);

    for (const [name, data] of acNodes) {
        const { error } = await supabase
            .from('kg_nodes')
            .upsert({
                name: name,
                type: data.type,
                metadata: data.metadata
            }, { onConflict: 'name' });
        if (error) console.error(`❌ Node Error: ${name}`, error.message);
    }

    // Get UUIDs for building-specific nodes
    const { data: dbNodes, error: fetchErr } = await supabase.from('kg_nodes').select('id, name');
    if (fetchErr) throw fetchErr;
    const nameToId = {};
    dbNodes.forEach(n => nameToId[n.name] = n.id);

    // 2. Process Relationships
    const edgeData = [];
    triplets.forEach(t => {
        if (nameToId[t.sub] && nameToId[t.obj]) {
            edgeData.push({ subject_id: nameToId[t.sub], predicate: 'contains', object_id: nameToId[t.obj] });
        }
    });

    // Handle Connection edges with Prefix support
    for (const [uniqueName, data] of acNodes) {
        ['connects_to', 'connects_from', 'monitors'].forEach(key => {
            if (data.metadata[key]) {
                data.metadata[key].forEach(targetName => {
                    const fullTargetName = `${buildingId}-${targetName}`;
                    const source = key === 'connects_from' ? fullTargetName : uniqueName;
                    const target = key === 'connects_from' ? uniqueName : fullTargetName;
                    
                    if (nameToId[source] && nameToId[target]) {
                        edgeData.push({ 
                            subject_id: nameToId[source], 
                            predicate: key === 'monitors' ? 'monitors' : 'connectsTo', 
                            object_id: nameToId[target] 
                        });
                    }
                });
            }
        });
    }

    console.log(`🔗 Syncing ${edgeData.length} relationships for ${buildingId}...`);
    
    // Cleanup old edges for this building only
    const buildingNodeIds = acNodes.map(([name]) => nameToId[name]).filter(id => id);
    if (buildingNodeIds.length > 0) {
        await supabase.from('kg_edges').delete().in('subject_id', buildingNodeIds);
    }

    if (edgeData.length > 0) {
        const { error } = await supabase.from('kg_edges').insert(edgeData);
        if (error) console.error(`❌ Edge Sync Error:`, error.message);
    }
}

async function run() {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('-DATA.md'));
    if (files.length === 0) {
        console.log("⚠️ No *-DATA.md files found to sync.");
        return;
    }

    for (const file of files) {
        const buildingId = file.replace('-DATA.md', '');
        await syncBuilding(buildingId);
    }
    console.log("\n✨ Multi-Building Sync Complete!");
}

run().catch(err => console.error("💥 Global Sync Failed:", err));
