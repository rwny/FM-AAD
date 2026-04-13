const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../src/utils/data');

// Global maps
const globalNodes = new Map(); // PrefixedName -> { file, line, rawName, buildingId }
const globalReferences = []; // { sourcePrefixedName, targetRawName, targetPrefixedName, refType, file, line }

const genericNames = ['AC', 'EE', 'ARCH', 'FUR', 'CCTV', 'SAN'];const requiredAssetIDPrefixes = ['FCU-', 'CDU-', 'CCTV-'];

let totalErrors = 0;
let totalNodesCount = 0;

function checkFile(filePath, buildingId) {
    const fileName = path.basename(filePath);
    if (!fs.existsSync(filePath)) {
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const rawLines = content.split('\n');
    let openBraces = 0;

    // 1. First pass on raw lines for basic syntax
    rawLines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();
        
        if (!trimmed || trimmed.startsWith('#')) return; 

        if (trimmed.startsWith('-')) {
            const indent = line.match(/^(\s*)/)[0].length;
            if (indent % 4 !== 0) {
                console.error(`      ❌ Line ${lineNum} in ${buildingId}/${fileName}: Indentation error (${indent} spaces). Should be multiple of 4.`);
                totalErrors++;
            }
        }

        const opening = (line.match(/\{/g) || []).length;
        const closing = (line.match(/\}/g) || []).length;
        
        openBraces += opening;
        openBraces -= closing;

        if (openBraces < 0) {
            console.error(`      ❌ Line ${lineNum} in ${buildingId}/${fileName}: Unexpected closing brace '}'`);
            totalErrors++;
            openBraces = 0; 
        }
    });

    if (openBraces > 0) {
        console.error(`      ❌ End of file in ${buildingId}/${fileName}: Unclosed properties block (missing ${openBraces} '}')`);
        totalErrors++;
    }

    // 2. Normalize multi-line properties for hierarchy and node parsing
    const lines = [];
    const lineMapping = []; 
    
    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];
        if (line.match(/^\s*-/)) {
            lines.push(line.replace(/\r/g, ''));
            lineMapping.push(i + 1);
        } else {
            if (lines.length > 0 && line.trim() && !line.trim().startsWith('#')) {
                lines[lines.length - 1] += " " + line.trim().replace(/\r/g, '');
            }
        }
    }

    const stack = []; 

    lines.forEach((line, index) => {
        const originalLineNum = lineMapping[index];
        const match = line.match(/^(\s*)-\s*([^{]+)(?:\{([^}]*)\})?/);
        if (!match) return;

        const indent = match[1].length;
        let name = match[2].trim();
        const propsRaw = match[3];

        while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
            stack.pop();
        }
        const parent = stack.length > 0 ? stack[stack.length - 1] : null;

        const inSanTree = stack.some(s => s.rawName === 'SAN');
        const isSanTerminalRef = inSanTree && (propsRaw !== undefined && propsRaw.trim() === '');

        // Prefix logic
        let uniqueName = name;
        if (name.toLowerCase() === buildingId.toLowerCase()) {
            uniqueName = buildingId;
        } else if (genericNames.includes(name) && parent) {
            uniqueName = `${buildingId}-${parent.rawName}-${name}`;
        } else {
            uniqueName = `${buildingId}-${name}`;
        }

        if (isSanTerminalRef) {
            if (parent && parent.rawName !== 'SAN') {
                globalReferences.push({
                    sourcePrefixedName: parent.uniqueName,
                    targetRawName: name,
                    targetPrefixedName: `${buildingId}-${name}`,
                    refType: 'connectsto',
                    file: `${buildingId}/${fileName}`,
                    line: originalLineNum
                });
            }
            stack.push({ indent, uniqueName, rawName: name });
            return;
        }

        if (inSanTree && parent && parent.rawName !== 'SAN') {
            globalReferences.push({
                sourcePrefixedName: parent.uniqueName,
                targetRawName: name,
                targetPrefixedName: uniqueName,
                refType: 'connectsto',
                file: `${buildingId}/${fileName}`,
                line: originalLineNum
            });
        }

        totalNodesCount++;

        if (globalNodes.has(uniqueName)) {
            const original = globalNodes.get(uniqueName);
            console.error(`      ❌ Line ${originalLineNum} in ${buildingId}/${fileName}: Node Name "${uniqueName}" is not unique! (Original in ${original.file} line ${original.line})`);
            totalErrors++;
        } else {
            globalNodes.set(uniqueName, { 
                file: `${buildingId}/${fileName}`, 
                line: originalLineNum,
                rawName: name,
                buildingId
            });
        }

        stack.push({ indent, uniqueName, rawName: name });

        // Parse properties
        const metadata = {};
        if (propsRaw) {
            propsRaw.split(',').forEach(p => {
                const parts = p.split(':');
                if (parts.length >= 2) {
                    const k = parts[0].trim().toLowerCase();
                    const v = parts.slice(1).join(':').trim();
                    metadata[k] = v;
                }
            });
        }

        // Validate Required Fields
        const needsAssetID = requiredAssetIDPrefixes.some(prefix => name.startsWith(prefix));
        if (needsAssetID) {
            if (!metadata['assetid']) {
                metadata['assetid'] = uniqueName;
            }
        }

        // Collect references
        ['connectsto', 'connectsfrom', 'monitors', 'monitor'].forEach(refKey => {
            if (metadata[refKey]) {
                const targets = metadata[refKey].split(',').map(x => x.trim());
                targets.forEach(target => {
                    globalReferences.push({
                        sourcePrefixedName: uniqueName,
                        targetRawName: target,
                        targetPrefixedName: `${buildingId}-${target}`,
                        refType: refKey,
                        file: `${buildingId}/${fileName}`,
                        line: originalLineNum
                    });
                });
            }
        });
    });
}

function checkBuilding(buildingId) {
    const buildingPath = path.join(dataDir, buildingId);
    if (!fs.existsSync(buildingPath)) return;

    const files = fs.readdirSync(buildingPath).filter(f => f.endsWith('.md'));
    console.log(`\n🔍 Scanning Building: ${buildingId}`);
    
    files.forEach(file => {
        console.log(`   📄 Checking ${file}...`);
        checkFile(path.join(buildingPath, file), buildingId);
    });
}

function runAllChecks() {
    console.log('🚀 Starting Multi-Building Data Validation...');

    if (!fs.existsSync(dataDir)) {
        console.error('❌ Data directory not found');
        return;
    }

    const items = fs.readdirSync(dataDir);
    const buildings = items.filter(item => {
        return fs.statSync(path.join(dataDir, item)).isDirectory();
    });

    buildings.forEach(buildingId => {
        checkBuilding(buildingId);
    });

    console.log('\n🔗 Validating Connections...');
    let brokenConnections = 0;
    
    globalReferences.forEach(ref => {
        if (!globalNodes.has(ref.targetPrefixedName)) {
            console.error(`      ❌ Line ${ref.line} in ${ref.file}: Broken connection! Source node "${ref.sourcePrefixedName}" references target "${ref.targetRawName}" (resolved as "${ref.targetPrefixedName}"), which does not exist.`);
            totalErrors++;
            brokenConnections++;
        }
    });
    
    if (brokenConnections === 0) {
        console.log(`   ✅ All ${globalReferences.length} connections are valid.`);
    }

    console.log('\n--- GLOBAL SUMMARY ---');
    console.log(`Total Buildings Scanned: ${buildings.length}`);
    console.log(`Total Unique Nodes: ${globalNodes.size}`);
    
    if (totalErrors > 0) {
        console.error(`❌ Total Errors Found: ${totalErrors}`);
        process.exit(1); 
    } else {
        console.log('✨ All checks passed! All buildings are valid.');
    }
}

runAllChecks();
