import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dataPath = path.join(__dirname, '..', 'src', 'utils', 'AR15.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

async function seed() {
  console.log('🚀 Seeding Supabase...');

  // 1. Building
  const { data: bld, error: bldErr } = await supabase
    .from('buildings')
    .upsert({ code: data.building, name: `Building ${data.building}` }, { onConflict: 'code' })
    .select()
    .single();

  if (bldErr) {
    console.error('❌ Error seeding building:', bldErr.message);
    return;
  }
  const buildingId = bld.id;
  console.log(`✅ Building: ${data.building} (ID: ${buildingId})`);

  for (const floor of data.floors) {
    const floorNum = parseInt(floor.name.replace('FLOOR', '').trim()) || 0;
    
    // 2. Floor
    const { data: fl, error: flErr } = await supabase
      .from('floors')
      .upsert({ building_id: buildingId, floor_number: floorNum, name: floor.name }, { onConflict: 'building_id, floor_number' })
      .select()
      .single();

    if (flErr) {
      console.error(`❌ Error seeding floor ${floor.name}:`, flErr.message);
      continue;
    }
    const floorId = fl.id;
    console.log(`  🏢 Floor: ${floor.name}`);

    for (const room of floor.rooms) {
      // 3. Room
      const { data: rm, error: rmErr } = await supabase
        .from('rooms')
        .upsert({ floor_id: floorId, room_id: room.id, name: room.name }, { onConflict: 'floor_id, room_id' })
        .select()
        .single();

      if (rmErr) {
        console.error(`  ❌ Error seeding room ${room.id}:`, rmErr.message);
        continue;
      }
      const roomId = rm.id;
      console.log(`    🚪 Room: ${room.name} (${room.id})`);

      for (const asset of room.assets) {
        // 4. Asset
        const assetData = {
          room_id: roomId,
          asset_id: asset['Asset-ID'] || asset.id, // Fallback to id if Asset-ID is missing
          type_id: asset.typeId,
          type_name: asset.typeName,
          category: asset.typeId.split('-')[0], // e.g., 'LF'
          status: asset.currentStatus,
          brand: asset.brand,
          model: asset.model,
          install_date: asset.Install || null,
          last_service: asset.lastService || null,
          next_service: asset.nextService || null,
          metadata: {
             ...asset,
             logs: undefined, // Remove logs from metadata as they go to separate table
             history: undefined
          }
        };

        const { data: as, error: asErr } = await supabase
          .from('assets')
          .upsert(assetData, { onConflict: 'asset_id' })
          .select()
          .single();

        if (asErr) {
          console.error(`      ❌ Error seeding asset ${asset.id}:`, asErr.message);
          continue;
        }
        const assetId = as.id;
        console.log(`      🛋️ Asset: ${asset.id}`);

        // 5. Logs
        if (asset.logs && asset.logs.length > 0) {
          const logsToInsert = asset.logs.map(log => ({
            asset_id: assetId,
            date: log.date,
            issue: log.issue,
            note: log.note,
            status: 'Completed' // Default for historical logs
          }));

          const { error: logsErr } = await supabase
            .from('maintenance_logs')
            .insert(logsToInsert);

          if (logsErr) {
            console.error(`        ❌ Error seeding logs for ${asset.id}:`, logsErr.message);
          } else {
            console.log(`        📝 Added ${asset.logs.length} logs`);
          }
        }
      }
    }
  }

  console.log('✨ Seeding completed!');
}

seed();
