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

const mdPath = path.join(__dirname, '../src/utils/AR15-DATA.md');

function parseMDHierarchy(filePath) {
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

  for (let line of lines) {
    const match = line.match(/^(\s*)-\s*([^{]+)(?:\{([^}]+)\})?/);
    if (!match) continue;

    const indent = match[1].length;
    let name = match[2].trim();
    const propsRaw = match[3] || '';
    const metadata = {};

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
          else metadata[k] = v;
        }
      });
    }

    // Determine category
    let type = 'unknown';
    if (name === 'AC' || name === 'EE') type = 'system_group';
    else if (name.includes('FCU')) type = 'fcu';
    else if (name.includes('CDU')) type = 'cdu';
    else if (name.startsWith('AC-')) type = 'ac_set';
    else if (name.startsWith('PIPE-')) type = 'pipe';
    else if (name.startsWith('LP-')) type = 'load_panel';
    else if (name.startsWith('room-')) type = 'room';
    else if (name.startsWith('floor-')) type = 'floor';
    else if (name.toLowerCase() === 'ar15') type = 'building';

    nodes[name] = { type, metadata };

    // Hierarchy Logic
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length > 0) {
      triplets.push({ sub: stack[stack.length - 1].name, pred: 'contains', obj: name });
    }
    stack.push({ indent, name });
  }

  return { nodes, triplets };
}

async function sync() {
  console.log(`📖 Reading ${mdPath}...`);
  const { nodes, triplets } = parseMDHierarchy(mdPath);
  
  // Filter for AC-related nodes only as requested (building, floor, room, ac_set, fcu, cdu, pipe, load_panel linked to AC)
  // Actually the user said "เน้นเรื่อง แอร์ก่อน ... เอาแอร์อย่างเดียวกัน"
  const acNodes = {};
  const acNodeNames = new Set();

  for (const [name, data] of Object.entries(nodes)) {
    if (data.type !== 'unknown' && !name.startsWith('SW-') && !name.startsWith('LI-') && !name.startsWith('PG-')) {
        acNodes[name] = data;
        acNodeNames.add(name);
    }
  }

  console.log(`🚀 Syncing ${Object.keys(acNodes).length} AC-related nodes...`);

  // 1. Upsert Nodes
  for (const [name, data] of Object.entries(acNodes)) {
    const { error } = await supabase
      .from('kg_nodes')
      .upsert({
        name: name,
        type: data.type,
        metadata: data.metadata
      }, { onConflict: 'name' });
    
    if (error) console.error(`❌ Error upserting node ${name}:`, error.message);
  }

  // Get UUIDs
  const { data: dbNodes, error: fetchErr } = await supabase.from('kg_nodes').select('id, name');
  if (fetchErr) throw fetchErr;
  const nameToId = {};
  dbNodes.forEach(n => nameToId[n.name] = n.id);

  // 2. Process Edges
  const edgeData = [];
  
  // Containment edges
  triplets.forEach(t => {
    if (nameToId[t.sub] && nameToId[t.obj]) {
      edgeData.push({
        subject_id: nameToId[t.sub],
        predicate: t.pred,
        object_id: nameToId[t.obj]
      });
    }
  });

  // Connection edges from metadata
  for (const [name, data] of Object.entries(acNodes)) {
    if (data.metadata.connects_to) {
      data.metadata.connects_to.forEach(target => {
        if (nameToId[name] && nameToId[target]) {
          edgeData.push({ subject_id: nameToId[name], predicate: 'connectsTo', object_id: nameToId[target] });
        }
      });
    }
    if (data.metadata.connects_from) {
      data.metadata.connects_from.forEach(source => {
        if (nameToId[source] && nameToId[name]) {
          edgeData.push({ subject_id: nameToId[source], predicate: 'connectsTo', object_id: nameToId[name] });
        }
      });
    }
  }

  console.log(`🔗 Syncing ${edgeData.length} relationships...`);

  if (edgeData.length > 0) {
    // Delete old edges for AC nodes to avoid duplicates/stale data
    const involvedIds = Object.values(nameToId);
    await supabase.from('kg_edges').delete().in('subject_id', involvedIds);

    // Insert new edges in batches
    const batchSize = 50;
    for (let i = 0; i < edgeData.length; i += batchSize) {
      const batch = edgeData.slice(i, i + batchSize);
      const { error } = await supabase.from('kg_edges').insert(batch);
      if (error) console.error(`❌ Error inserting edges batch:`, error.message);
    }
  }

  console.log("✅ AC Data Sync Complete!");
}

sync().catch(err => console.error("💥 Sync Failed:", err));
