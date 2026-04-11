const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../src/utils/data');
const outputDir = path.join(__dirname, '../src/utils');

function combineBuilding(buildingId) {
    const buildingPath = path.join(dataDir, buildingId);
    const outputFile = path.join(outputDir, `${buildingId}-DATA.md`);
    
    console.log(`\n🔄 Combining data for ${buildingId}...`);

    const commonFile = path.join(buildingPath, 'common.md');
    if (!fs.existsSync(commonFile)) {
        console.error(`   ❌ Error: common.md not found in ${buildingId}`);
        return;
    }

    const commonLines = fs.readFileSync(commonFile, 'utf8').split('\n');
    
    // Get all floor files in the directory
    const floorFiles = fs.readdirSync(buildingPath)
        .filter(f => f.startsWith('floor-') && f.endsWith('.md'))
        .sort(); // Sort to ensure floor-1 comes before floor-2

    const floorContents = floorFiles.map(f => {
        const content = fs.readFileSync(path.join(buildingPath, f), 'utf8');
        return content.trimEnd() + '\n';
    }).join('');

    let insertIndex = -1;
    for (let i = 0; i < commonLines.length; i++) {
        // Look for common insertion points like LP or CCTV
        if (commonLines[i].includes('- LP-') || commonLines[i].includes('- CCTV')) {
            insertIndex = i;
            break;
        }
    }

    const resultLines = [...commonLines];
    if (insertIndex !== -1) {
        resultLines.splice(insertIndex, 0, floorContents.trimEnd());
    } else {
        resultLines.push(floorContents.trimEnd());
    }

    fs.writeFileSync(outputFile, resultLines.join('\n'), 'utf8');
    console.log(`   ✅ Successfully combined into ${outputFile}`);
}

function run() {
    console.log('🚀 Multi-Building Data Combiner Starting...');
    
    if (!fs.existsSync(dataDir)) {
        console.error('❌ Data directory not found');
        return;
    }

    const items = fs.readdirSync(dataDir);
    const buildings = items.filter(item => {
        return fs.statSync(path.join(dataDir, item)).isDirectory();
    });

    if (buildings.length === 0) {
        console.log('⚠️ No building directories found in src/utils/data/');
        return;
    }

    buildings.forEach(combineBuilding);
    console.log('\n✨ All building combinations complete!');
}

run();
