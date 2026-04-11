const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const filesToCheck = [
    path.join(dataDir, 'ar15-common.md'),
    path.join(dataDir, 'ar15-floor-1.md'),
    path.join(dataDir, 'ar15-floor-2.md')
];

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

    console.log(`\n🔍 Checking: ${fileName}...`);

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();
        
        if (!trimmed || trimmed.startsWith('#')) return; 

        // 1. Count Nodes (lines starting with - at the beginning of the line's content)
        if (trimmed.startsWith('-')) {
            nodeCount++;
        }

        // 2. Check Indentation (Only for lines starting with '-')
        if (trimmed.startsWith('-')) {
            const leadingSpaces = line.match(/^(\s*)/)[0].length;
            if (leadingSpaces % 4 !== 0) {
                console.error(`   ❌ Line ${lineNum}: Indentation error (${leadingSpaces} spaces). Should be multiple of 4.`);
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
            openBraces = 0; // Reset
        }
        
        // 4. Check for properties without braces on node lines
        if (trimmed.startsWith('-') && opening === 0 && openBraces === 0) {
             // If it has a colon but no brace, it might be a missing property block
             // excluding common category names
             const plainCategories = ['ar15', 'floor-', 'room-', 'AC', 'EE', 'FUR', 'ARCH', 'CCTV'];
             const contentAfterDash = trimmed.substring(1).trim();
             const isCategory = plainCategories.some(cat => contentAfterDash.startsWith(cat));
             
             if (!isCategory && contentAfterDash.includes(':')) {
                 // Check if it's an asset instance pattern
                 const isLikelyAsset = /[A-Z0-9]+-[0-9]+/.test(contentAfterDash);
                 if (isLikelyAsset) {
                    console.warn(`   ⚠️  Line ${lineNum}: Node looks like an asset but has no properties block { }: "${contentAfterDash}"`);
                 }
             }
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
    console.log('🚀 Starting AR15 Data Validation...');
    let totalErrors = 0;
    let totalNodes = 0;

    filesToCheck.forEach(file => {
        const result = checkFile(file);
        totalErrors += result.errors;
        totalNodes += result.nodes;
    });

    console.log('\n--- SUMMARY ---');
    console.log(`Total Nodes Scanned: ${totalNodes}`);
    
    if (totalErrors > 0) {
        console.error(`❌ Total Errors Found: ${totalErrors}`);
        process.exit(1); 
    } else {
        console.log('✨ All checks passed! Data is ready for combination.');
    }
}

runAllChecks();
