import { syncBimMetadata } from '../3DModel/catalog2ifc/src/extractor/bim_sync.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const buildingId = process.argv[2] || 'AR15';
  const glbPath = process.argv[3] || path.join(__dirname, '../public/models/ar15-302.glb');

  console.log(`\n🔄 Syncing BIM Metadata from ${glbPath} to Supabase [Building: ${buildingId}]...`);

  try {
    const result = await syncBimMetadata(buildingId, glbPath);
    if (result.success) {
      console.log(`\n✨ Sync Complete!`);
      console.log(`✅ Nodes updated: ${result.syncedCount}`);
    } else {
      console.error(`\n❌ Sync Failed: ${result.error}`);
    }
  } catch (err) {
    console.error(`\n💥 Fatal Error:`, err);
  }
}

run();
