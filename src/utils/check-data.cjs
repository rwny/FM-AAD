const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const filesToCheck = [
    path.join(dataDir, 'ar15-common.md'),
    path.join(dataDir, 'ar15-floor-1.md'),
    path.join(dataDir, 'ar15-floor-2.md')
];

// Global set to track all unique node names (prefixed names)
const globalUniqueNodes = new Map(); // PrefixedName -> { file, line }

function checkFile(filePath) {
    const fileName = path.basename(filePath);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping: ${fileName} (File not found)`);
        return { errors: 0, nodes: 0 };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let errors = 0;
    let nodeCount = 0;
    let openBraces = 0;

    // Stack to track hierarchy and generate unique names
    const stack = []; // Array of { indent, uniqueName }
    const genericNames = ['AC', 'EE', 'ARCH', 'FUR', 'CCTV'];

    console.log(`\n🔍 Checking: ${fileName}...`);

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();
        
        if (!trimmed || trimmed.startsWith('#')) return; 

        // 1. Process Nodes
        if (trimmed.startsWith('-')) {
            nodeCount++;
            
            const indent = line.match(/^(\s*)/)[0].length;
            const nodeNameRaw = trimmed.substring(1).split('{')[0].trim();

            // Hierarchy Logic: Find parent in stack
            while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
                stack.pop();
            }
            const parent = stack.length > 0 ? stack[stack.length - 1] : null;

            // Determine Unique Name (Matches Parser Logic)
            let uniqueName = nodeNameRaw;
            if (genericNames.includes(nodeNameRaw) && parent) {
                uniqueName = `${parent.uniqueName}-${nodeNameRaw}`;
            }

            // Check Global Uniqueness
            if (globalUniqueNodes.has(uniqueName)) {
                const original = globalUniqueNodes.get(uniqueName);
                console.error(`   ❌ Line ${lineNum}: Node Name "${uniqueName}" is not unique! (Already exists in ${original.file} line ${original.line})`);
                errors++;
            } else {
                globalUniqueNodes.set(uniqueName, { file: fileName, line: lineNum });
            }

            // Update stack for children
            stack.push({ indent, uniqueName });

            // 2. Check Indentation (Must be multiple of 4 spaces)
            if (indent % 4 !== 0) {
                console.error(`   ❌ Line ${lineNum}: Indentation error (${indent} spaces). Should be multiple of 4.`);
                errors++;
            }
        }

        // 3. Brace Tracking (Multi-line support)
        const opening = (line.match(/\{/g) || []).length;
        const closing = (line.match(/\}/g) || []).length;
        
        openBraces += opening;
        openBraces -= closing;

        if (openBraces < 0) {
            console.error(`   ❌ Line ${lineNum}: Unexpected closing brace '}'`);
            errors++;
            openBraces = 0; 
        }
    });

    if (openBraces > 0) {
        console.error(`   ❌ End of file: Unclosed properties block (missing ${openBraces} '}')`);
        errors++;
    }

    console.log(`   ✅ Done: Found ${nodeCount} nodes.`);
    return { errors, nodes: nodeCount };
}

function runAllChecks() {
    console.log('🚀 Starting AR15 Data Validation (Context-Aware Hierarchy)...');
    let totalErrors = 0;
    let totalNodes = 0;

    filesToCheck.forEach(file => {
        const result = checkFile(file);
        totalErrors += result.errors;
        totalNodes += result.nodes;
    });

    console.log('\n--- SUMMARY ---');
    console.log(`Total Unique Nodes (after prefixing): ${globalUniqueNodes.size}`);
    
    if (totalErrors > 0) {
        console.error(`❌ Total Errors Found: ${totalErrors}`);
        process.exit(1); 
    } else {
        console.log('✨ All checks passed! Structure is valid and unique IDs are confirmed.');
    }
}

runAllChecks();
