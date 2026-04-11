const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const outputFile = path.join(__dirname, 'AR15-DATA.md');

const commonFile = path.join(dataDir, 'ar15-common.md');
const floor1File = path.join(dataDir, 'ar15-floor-1.md');
const floor2File = path.join(dataDir, 'ar15-floor-2.md');

function combine() {
    console.log('🔄 Combining AR15 data files...');

    if (!fs.existsSync(commonFile)) {
        console.error('❌ Error: ar15-common.md not found');
        return;
    }

    const commonLines = fs.readFileSync(commonFile, 'utf8').split('\n');
    const floor1Content = fs.existsSync(floor1File) ? fs.readFileSync(floor1File, 'utf8') : '';
    const floor2Content = fs.existsSync(floor2File) ? fs.readFileSync(floor2File, 'utf8') : '';

    // We want to insert floors after LP-123 or before CCTV
    // Based on original AR15-DATA.md:
    // - ar15
    //     - CU-1-01
    //     - LP-123
    //     - floor-1
    //     ...
    //     - floor-2
    //     ...
    //     - CCTV

    let insertIndex = -1;
    for (let i = 0; i < commonLines.length; i++) {
        if (commonLines[i].includes('- LP-123')) {
            insertIndex = i + 1;
            break;
        }
    }

    if (insertIndex === -1) {
        // Fallback: search for CCTV and insert before it
        for (let i = 0; i < commonLines.length; i++) {
            if (commonLines[i].includes('- CCTV')) {
                insertIndex = i;
                break;
            }
        }
    }

    const resultLines = [...commonLines];
    const floorContent = (floor1Content ? floor1Content.trimEnd() + '\n' : '') + 
                         (floor2Content ? floor2Content.trimEnd() + '\n' : '');
    
    if (insertIndex !== -1) {
        resultLines.splice(insertIndex, 0, floorContent.trimEnd());
    } else {
        resultLines.push(floorContent.trimEnd());
    }

    fs.writeFileSync(outputFile, resultLines.join('\n'), 'utf8');
    console.log(`✅ Successfully combined data into ${outputFile}`);
}

combine();
