const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../src/utils/data');

// Global map to track uniqueness across ALL buildings
const globalUniqueNodes = new Map(); // PrefixedName -> { file, line }

function checkFile(filePath, buildingId) {
    const fileName = path.basename(filePath);
    if (!fs.existsSync(filePath)) {
        return { errors: 0, nodes: 0 };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let errors = 0;
    let nodeCount = 0;
    let openBraces = 0;

    const stack = []; 
    const genericNames = ['AC', 'EE', 'ARCH', 'FUR', 'CCTV'];

    console.log(`   🔍 Checking ${buildingId}: ${fileName}...`);

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();
        
        if (!trimmed || trimmed.startsWith('#')) return; 

        if (trimmed.startsWith('-')) {
            nodeCount++;
            
            const indent = line.match(/^(\s*)/)[0].length;
            const nodeNameRaw = trimmed.substring(1).split('{')[0].trim();

            while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
                stack.pop();
            }
            const parent = stack.length > 0 ? stack[stack.length - 1] : null;

            let uniqueName = nodeNameRaw;
            if (genericNames.includes(nodeNameRaw) && parent) {
                uniqueName = `${parent.uniqueName}-${nodeNameRaw}`;
            }

            if (globalUniqueNodes.has(uniqueName)) {
                const original = globalUniqueNodes.get(uniqueName);
                console.error(`      ❌ Line ${lineNum}: Node Name "${uniqueName}" is not unique! (Original in ${original.file} line ${original.line})`);
                errors++;
            } else {
                globalUniqueNodes.set(uniqueName, { file: `${buildingId}/${fileName}`, line: lineNum });
            }

            stack.push({ indent, uniqueName });

            if (indent % 4 !== 0) {
                console.error(`      ❌ Line ${lineNum}: Indentation error (${indent} spaces). Should be multiple of 4.`);
                errors++;
            }
        }

        const opening = (line.match(/\{/g) || []).length;
        const closing = (line.match(/\}/g) || []).length;
        
        openBraces += opening;
        openBraces -= closing;

        if (openBraces < 0) {
            console.error(`      ❌ Line ${lineNum}: Unexpected closing brace '}'`);
            errors++;
            openBraces = 0; 
        }
    });

    if (openBraces > 0) {
        console.error(`      ❌ End of file: Unclosed properties block (missing ${openBraces} '}')`);
        errors++;
    }

    return { errors, nodes: nodeCount };
}

function checkBuilding(buildingId) {
    const buildingPath = path.join(dataDir, buildingId);
    let buildingErrors = 0;
    let buildingNodes = 0;

    const files = fs.readdirSync(buildingPath).filter(f => f.endsWith('.md'));
    
    files.forEach(file => {
        const result = checkFile(path.join(buildingPath, file), buildingId);
        buildingErrors += result.errors;
        buildingNodes += result.nodes;
    });

    return { errors: buildingErrors, nodes: buildingNodes };
}

function runAllChecks() {
    console.log('🚀 Starting Multi-Building Data Validation...');
    let totalErrors = 0;
    let totalNodes = 0;

    if (!fs.existsSync(dataDir)) {
        console.error('❌ Data directory not found');
        return;
    }

    const items = fs.readdirSync(dataDir);
    const buildings = items.filter(item => {
        return fs.statSync(path.join(dataDir, item)).isDirectory();
    });

    buildings.forEach(buildingId => {
        const result = checkBuilding(buildingId);
        totalErrors += result.errors;
        totalNodes += result.nodes;
    });

    console.log('\n--- GLOBAL SUMMARY ---');
    console.log(`Total Buildings Scanned: ${buildings.length}`);
    console.log(`Total Unique Nodes: ${globalUniqueNodes.size}`);
    
    if (totalErrors > 0) {
        console.error(`❌ Total Errors Found: ${totalErrors}`);
        process.exit(1); 
    } else {
        console.log('✨ All checks passed! All buildings are valid.');
    }
}

runAllChecks();
