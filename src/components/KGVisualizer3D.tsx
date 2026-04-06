import React, { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { RotateCw, Pause, Search, Layers, Palette, Sun, Moon, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../utils/supabase';

export function KGVisualizer3D() {
  const fgRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [highlightLevel, setHighlightLevel] = useState<string | null>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<{ id: number, text: string }[]>([]);
  const logIdRef = useRef(0);
  const [isRotating, setIsRotating] = useState(true); 
  const [layoutMode, setLayoutMode] = useState<'hierarchy' | 'radial'>('radial');
  const [visualMode, setVisualMode] = useState<'color' | 'monochrome'>('monochrome');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const fadeTimeoutRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // LOG SYSTEM ENHANCED
  const addLog = (text: string) => {
    setTerminalLogs(prev => [...prev, { id: logIdRef.current++, text: text.toUpperCase() }].slice(-35));
  };

  // INFINITE STREAM EFFECT
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const coords = `VECTOR: [${(Math.random()*1000-500).toFixed(2)}, ${(Math.random()*1000-500).toFixed(2)}, ${(Math.random()*1000-500).toFixed(2)}]`;
        addLog(coords);
      }
      if (Math.random() > 0.9) {
        const statuses = ['SYNCING...', 'ENCRYPTING...', 'UPLINK_ACTIVE', 'BUFFER_READY', 'CORE_TEMP_STABLE'];
        addLog(`[SYSTEM] ${statuses[Math.floor(Math.random()*statuses.length)]}`);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // BURST DATA ON SELECTION
  useEffect(() => {
    if (selectedNode) {
      const burstData = [
        `>> ACQUIRING TARGET: ${selectedNode.name}`,
        `>> TYPE_ID: ${selectedNode.type}`,
        `>> GLOBAL_UUID: ${selectedNode.id.substring(0,8)}...`,
        `>> METADATA_PARSING_INITIATED`,
        ...Object.entries(selectedNode.metadata || {}).map(([k,v]) => `>> ${k}: ${v}`),
        `>> VECTOR_LOCK_CONFIRMED`
      ];
      burstData.forEach((msg, i) => {
        setTimeout(() => addLog(msg), i * 100);
      });
    }
  }, [selectedNode]);

  // PHYSICS & LAYOUT
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      const levelHeights: { [key: string]: number } = {
        '1': 300, '2': 220, '3': 140, '4': 60, '5': -20, '6': -100, '7': -180, '8': -260, '9': -340
      };

      graphData.nodes.forEach(node => {
        if (layoutMode === 'hierarchy') node.fy = levelHeights[node.level] || 0; 
        else node.fy = undefined; 
      });

      const chargeForce = fgRef.current.d3Force('charge');
      if (chargeForce && typeof chargeForce.strength === 'function') {
        chargeForce.strength(layoutMode === 'hierarchy' ? -80 : -150); 
        chargeForce.distanceMax(800);
      }

      const linkForce = fgRef.current.d3Force('link');
      if (linkForce && typeof linkForce.distance === 'function') {
        linkForce.distance(layoutMode === 'hierarchy' ? 60 : 100);
      }

      const scene = fgRef.current.scene();
      const oldPlanes = scene.children.filter((c: any) => c.name === 'tacticalPlane');
      oldPlanes.forEach((p: any) => scene.remove(p));

      if (layoutMode === 'hierarchy') {
        const planeColors: { [key: string]: string } = theme === 'light'
        ? { '1': '#000000', '2': '#333333', '3': '#666666', '4': '#999999', '5': '#cccccc', '6': '#eeeeee' }
        : visualMode === 'monochrome' 
          ? { '1': '#ffffff', '2': '#dddddd', '3': '#bbbbbb', '4': '#999999', '5': '#777777', '6': '#555555' }
          : { '1': '#4A007B', '2': '#0000ff', '3': '#00ccff', '4': '#00ffaa', '5': '#00ff00', '6': '#aaff00' };

        Object.entries(levelHeights).forEach(([lvl, height]) => {
          if (planeColors[lvl]) {
            const geometry = new THREE.RingGeometry(400, 402, 64);
            const material = new THREE.MeshBasicMaterial({ color: planeColors[lvl], transparent: true, opacity: 0.1, side: THREE.DoubleSide });
            const plane = new THREE.Mesh(geometry, material);
            plane.rotation.x = Math.PI / 2; plane.position.y = height; plane.name = 'tacticalPlane';
            scene.add(plane);
            const grid = new THREE.GridHelper(800, 10, material.color, material.color);
            grid.position.y = height; grid.material.opacity = 0.05; grid.material.transparent = true; grid.name = 'tacticalPlane';
            scene.add(grid);
          }
        });
      }

      // Reheat only when layout mode changes or data is fresh
      if (fgRef.current.d3Alpha) fgRef.current.d3Alpha(0.3);
      if (fgRef.current.d3ReheatSimulation) fgRef.current.d3ReheatSimulation();

      const controls = fgRef.current.controls();
      if (layoutMode === 'hierarchy') {
        fgRef.current.cameraPosition({ x: 0, y: 300, z: 1000 }, { x: 0, y: 0, z: 0 }, 1200);
        if (controls) {
          controls.minPolarAngle = Math.PI / 2.5; controls.maxPolarAngle = Math.PI / 1.8;
          controls.minAzimuthAngle = -Math.PI / 6; controls.maxAzimuthAngle = Math.PI / 6;
          controls.enablePan = true; controls.minDistance = 200; controls.maxDistance = 2000;
          controls.update();
        }
      } else {
        if (controls) {
          controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI;
          controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
          controls.enablePan = true; controls.minDistance = 10; controls.maxDistance = 5000;
          controls.update();
        }
      }
    }
  }, [graphData.nodes.length, layoutMode, theme]); // Reduced dependencies to prevent frequent reheating

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return graphData.nodes.filter(n => n.name.toLowerCase().includes(q) || n.fullName.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)).slice(0, 10);
  }, [searchQuery, graphData.nodes]);

  const rotationVelocityRef = useRef(0.0025);
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      if (fgRef.current) {
        const scene = fgRef.current.scene();
        
        // 1. Graph Rotation
        const graphGroup = scene.children.find((child: any) => child.type === 'Group');
        if (graphGroup) {
          const targetVelocity = isRotating ? 0.0025 : 0;
          rotationVelocityRef.current += (targetVelocity - rotationVelocityRef.current) * 0.05;
          if (Math.abs(rotationVelocityRef.current) > 0.00001) graphGroup.rotation.y += rotationVelocityRef.current;
        }

        // 2. Objects Animation (Radar marks and Pulsing nodes)
        const now = Date.now();
        scene.traverse((obj: any) => {
          if (obj.name === 'radarMark') {
            obj.rotation.z += 0.02;
            const pulse = 15 + Math.sin(now * 0.008) * 2;
            obj.scale.set(pulse, pulse, 1);
          }
          
          if (obj.userData?.isPulsing) {
            const freq = 0.005; // Same slow speed for both red and orange
            const amplitude = obj.userData.pulseType === 'faulty' ? 0.15 : 0.1;
            const s = 1.0 + Math.sin(now * freq) * amplitude;
            obj.scale.set(s, s, s);
          }
        });
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isRotating]);


  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    async function fetchData() {
      try {
        const { data: nodesData } = await supabase.from('kg_nodes').select('id, name, type, metadata');
        const { data: edgesData } = await supabase.from('kg_edges').select('subject_id, object_id, predicate');
        
        // --- 1. FETCH SOURCE OF TRUTH: ASSETS TABLE ---
        const { data: assetsData } = await supabase.from('assets').select('asset_id, status, metadata');
        
        // --- 2. FETCH AC LOGS ---
        const { data: acLogs } = await supabase
          .from('ac_maintenance_logs')
          .select('asset_id, status, issue')
          .order('date', { ascending: false });

        // --- 3. FETCH GENERAL LOGS ---
        const { data: genLogs } = await supabase
          .from('maintenance_logs')
          .select('status, issue, assets!inner(asset_id)')
          .order('date', { ascending: false });

        const statusMap: { [key: string]: string } = {};
        const logMap: { [key: string]: string } = {}; 
        
        // 1. Build a map of the absolute LATEST status for each asset ID
        // Because logs are sorted by date DESC, the first time we see an ID, it's the latest.
        
        if (acLogs) {
          acLogs.forEach(log => {
            const aid = log.asset_id?.toUpperCase();
            if (aid && !statusMap[aid]) {
              statusMap[aid] = log.status;
              logMap[aid] = log.issue || '';
            }
          });
        }

        if (genLogs) {
          genLogs.forEach((log: any) => {
            const aid = log.assets?.asset_id?.toUpperCase();
            if (aid && !statusMap[aid]) {
              statusMap[aid] = log.status;
              logMap[aid] = log.issue || '';
            }
          });
        }

        // 2. Fallback to assets table for basic status if no logs exist
        if (assetsData) {
          assetsData.forEach(a => {
            const aid = a.asset_id?.toUpperCase();
            if (aid && !statusMap[aid]) {
              statusMap[aid] = a.status || 'Normal';
            }
          });
        }

        if (nodesData && edgesData) {
          const mappedNodes = nodesData.map((n: any) => {
            let color = '#64748b'; let level = '9'; let val = 4;
            const t = (n.type || 'unknown').toLowerCase();
            const nodeNameUC = (n.name || '').toUpperCase();
            const metaAssetID = n.metadata?.asset_id?.toUpperCase();
            
            // --- INDEPENDENT STATUS CHECK ---
            // Each node checks its own latest log status from the map
            const currentStatus = statusMap[nodeNameUC] || (metaAssetID ? statusMap[metaAssetID] : 'Normal');
            const latestLog = logMap[nodeNameUC] || (metaAssetID ? logMap[metaAssetID] : '');
            
            const mergedMetadata = { ...n.metadata, status: currentStatus, latest_log: latestLog };
            
            // Base colors by type
            if (t === 'building') { color = '#4A007B'; val = 25; level = '1'; }
            else if (t === 'floor') { color = '#0000ff'; val = 20; level = '2'; }
            else if (t === 'room') { color = '#00ccff'; val = 15; level = '3'; }
            else if (t === 'system_group') { color = '#00ffaa'; val = 12; level = '4'; }
            else if (t === 'ac_set' || t === 'nvr' || t === 'load_panel') { color = '#00ff00'; val = 10; level = '5'; }
            else if (t === 'fcu' || t === 'cdu') { color = '#aaff00'; val = 9; level = '6'; }
            else if (t === 'cctv_camera') { color = '#ffcc00'; val = 8; level = '7'; }
            else if (t.includes('power') || t.includes('switch') || t.includes('light')) { color = '#ff7700'; val = 7; level = '8'; }
            else { color = '#64748b'; val = 4; level = '9'; }
            
            // --- OVERRIDE COLOR & BLINK BASED ON STATUS ---
            const statusLower = (currentStatus || 'normal').toLowerCase();
            if (statusLower === 'faulty') {
              color = '#ff0000'; // RED
            } else if (['maintenance', 'warning', 'pending', 'in progress', 'faulty_unit'].includes(statusLower)) {
              color = '#ff8800'; // ORANGE
            }
            
            const displayName = n.metadata?.display_name || n.name;
            return { id: n.id, name: displayName, fullName: n.name, type: n.type, level, val, color, metadata: mergedMetadata };
          });
          
          setGraphData({ nodes: mappedNodes, links: edgesData.map((e: any) => ({ source: e.subject_id, target: e.object_id, name: e.predicate })) });
          addLog('[DATABASE] INDEPENDENT SYNC COMPLETE.');
        }
      } catch (err) { console.error('Failed to load KG 3D:', err); }
    }
    fetchData();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Function to fetch latest log for a specific node
  const fetchLatestLogForNode = async (node: any) => {
    try {
      const nodeName = node.name?.toUpperCase();
      const metaAssetId = node.metadata?.asset_id?.toUpperCase();
      
      console.log('[DEBUG] Fetching logs for node:', nodeName, 'metaAssetId:', metaAssetId);
      
      // Fetch latest AC log for this node - EXACT MATCH ONLY
      const { data: acLogs, error: acError } = await supabase
        .from('ac_maintenance_logs')
        .select('asset_id, status, issue, date')
        .or(`asset_id.eq.${nodeName}${metaAssetId ? `,asset_id.eq.${metaAssetId}` : ''}`)
        .order('date', { ascending: false })
        .limit(1);
      
      if (acError) console.log('[DEBUG] AC log error:', acError.message);
      const acLog = acLogs && acLogs.length > 0 ? acLogs[0] : null;
      
      // Fetch latest general log for this node - EXACT MATCH ONLY
      const { data: genLogs, error: genError } = await supabase
        .from('maintenance_logs')
        .select('status, issue, date, assets!inner(asset_id)')
        .or(`assets.asset_id.eq.${nodeName}${metaAssetId ? `,assets.asset_id.eq.${metaAssetId}` : ''}`)
        .order('date', { ascending: false })
        .limit(1);
      
      if (genError) console.log('[DEBUG] Gen log error:', genError.message);
      const genLog = genLogs && genLogs.length > 0 ? genLogs[0] : null;
      
      console.log('[DEBUG] AC Log:', acLog, 'Gen Log:', genLog);
      
      // Determine which log is more recent
      let latestLog = null;
      if (acLog && genLog) {
        latestLog = new Date(acLog.date) > new Date(genLog.date) ? acLog : genLog;
      } else if (acLog) {
        latestLog = acLog;
      } else if (genLog) {
        latestLog = genLog;
      }
      
      if (latestLog) {
        const issueText = latestLog.issue || '';
        const newStatus = latestLog.status;
        
        console.log('[DEBUG] Found log - Status:', newStatus, 'Issue:', issueText);
        
        // Update the node's metadata with latest info
        setSelectedNode((prev: any) => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            status: newStatus,
            latest_log: issueText
          }
        }));
        
        // Also update the node in graphData
        setGraphData(prev => ({
          ...prev,
          nodes: prev.nodes.map((n: any) => 
            n.id === node.id 
              ? { ...n, metadata: { ...n.metadata, status: newStatus, latest_log: issueText } }
              : n
          )
        }));
      }
    } catch (err) {
      // No log found or error - silently ignore
    }
  };

  const handleNodeClick = (node: any) => {
    if (!node) return;
    setFocusedNodeId(node.id); setSelectedNode(node);
    addLog(`[TARGET] ACQUIRED: ${node.name.toUpperCase()}`);
    
    // Fetch latest log data for this node
    fetchLatestLogForNode(node);
    
    // Camera focus zoom disabled - view stays static
    // if (fgRef.current) {
    //   const distance = 120; const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
    //   fgRef.current.cameraPosition({ x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio }, { x: node.x, y: node.y, z: node.z }, 2000);
    // }
  };

  const triggerNodeHover = (node: any) => {
    if (!node) { setHoverNodeId(null); return; }
    setHoverNodeId(node.id);
  };

  const triggerHighlight = (level: string) => {
    setHighlightLevel(level);
    const levelNodes = graphData.nodes.filter(n => n.level === level);
    addLog(`[SCAN] LVL-0${level}: ${levelNodes.length} NODES FOUND`);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = setTimeout(() => setHighlightLevel(null), 5000);
  };

  const toggleRotation = () => {
    setIsRotating(!isRotating);
    addLog(`[SYSTEM] ROTATION: ${!isRotating ? 'ON' : 'OFF'}`);
  };

  const relatedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set();
    const set = new Set();
    graphData.links.forEach(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      if (s === selectedNode.id) set.add(t); if (t === selectedNode.id) set.add(s);
    });
    return set;
  }, [selectedNode, graphData.links]);

  const legendItems = [
    { id: '1', color: '#4A007B', label: 'Building' }, { id: '2', color: '#0000ff', label: 'Floor' }, { id: '3', color: '#00ccff', label: 'Room' }, 
    { id: '4', color: '#00ffaa', label: 'Sys Group' }, { id: '5', color: '#00ff00', label: 'Main Unit' }, { id: '6', color: '#aaff00', label: 'Critical' }, 
    { id: '7', color: '#ffcc00', label: 'CCTV' }, { id: '8', color: '#ff7700', label: 'Endpoint' }, { id: '9', color: '#ff0000', label: 'Infras' }
  ];

  const themeColors = theme === 'light' 
    ? {
        bg: '#FFFFFF',
        text: '#000000',
        textMuted: 'rgba(0,0,0,0.6)',
        accent: '#000000',
        border: 'rgba(0,0,0,0.2)',
        panelBg: 'rgba(255,255,255,0.95)',
        link: 'rgba(0,0,0,0.3)',
        linkHighlight: 'rgba(0,0,0,0.8)',
      }
    : {
        bg: '#010409',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.6)',
        accent: '#ffffff',
        border: 'rgba(0,242,255,0.2)',
        panelBg: 'rgba(0,0,0,0.95)',
        link: 'rgba(255,255,255,0.2)',
        linkHighlight: 'rgba(0,242,255,0.8)',
      };

  return (
    <div className={`absolute inset-0 overflow-hidden font-mono ${theme === 'light' ? 'bg-white' : 'bg-[#010409]'}`}>
      {/* LEFT HEADING & LOGS */}
      <div className="absolute top-8 left-24 z-10 flex flex-col gap-0.5" style={{ color: themeColors.text }}>
        <h2 className={`text-3xl font-black tracking-tighter font-mono pointer-events-none ${theme === 'light' ? '' : 'drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]'}`} style={{ color: themeColors.text }}>AR15 ASSET TOPOLOGY</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-4 font-mono pointer-events-none" style={{ color: themeColors.text }}>Tactical Network Environment</p>
        
        {/* SEARCH BOX UNDER HEADING */}
        <div className="relative w-64 mb-4">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 w-4 h-4 transition-colors" style={{ color: theme === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(0,242,255,0.4)' }} />
            <input
              type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
              onFocus={() => setShowSearchResults(true)} placeholder="SEARCH NETWORK..."
              className={`w-full border rounded-[5px] py-2 pl-10 pr-4 text-xs font-mono focus:outline-none ${theme === 'light' ? 'bg-white/80 border-black/20 text-black focus:border-black/60' : 'bg-black/40 backdrop-blur-md border-white/20 text-white focus:border-white/60'}`}
            />
          </div>
          {showSearchResults && searchQuery.length >= 2 && (
            <div className={`absolute top-full left-0 right-0 mt-2 border rounded-[5px] overflow-hidden shadow-2xl z-50 ${theme === 'light' ? 'bg-white/95 border-black/20' : 'bg-black/90 backdrop-blur-xl border-white/30'}`}>
              {searchResults.length === 0 ? <div className={`p-4 text-[10px] text-center uppercase ${theme === 'light' ? 'text-black/40' : 'text-white/40'}`}>No Assets</div> :
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {searchResults.map((node) => (
                    <button key={node.id} onClick={() => { handleNodeClick(node); setShowSearchResults(false); setSearchQuery(''); }}
                      className={`w-full px-4 py-3 flex flex-col items-start border-b transition-colors text-left ${theme === 'light' ? 'hover:bg-black/5 border-black/5' : 'hover:bg-white/10 border-white/5'}`}
                    >
                      <span className={`text-[10px] font-black uppercase ${theme === 'light' ? 'text-black' : 'text-white'}`}>{node.name}</span>
                      <span className={`text-[8px] font-bold uppercase ${theme === 'light' ? 'text-black/40' : 'text-white/50'}`}>{node.type}</span>
                    </button>
                  ))}
                </div>
              }
            </div>
          )}
        </div>

        {/* TERMINAL LOGS */}
        <div className="flex flex-col gap-0.5 font-mono text-[9px] tracking-tight leading-none opacity-80 pointer-events-none" style={{ color: themeColors.accent }}>
          {terminalLogs.map((log) => (<div key={log.id} className="animate-in fade-in duration-300 h-[11px] flex items-center"><span className="opacity-30 mr-2">::</span>{log.text}</div>))}
        </div>
      </div>

      {/* TACTICAL ACQUISITION: TEXT TERMINAL MODE (RIGHT ALIGNED) */}
      {selectedNode && (
        <div className={`absolute top-0 right-0 z-50 w-[380px] rounded-none flex flex-col font-mono animate-in slide-in-from-right-4 duration-300 h-screen ${theme === 'light' ? 'bg-white/10' : 'bg-black/10'}`}>
          {/* TERMINAL HEADER */}
          <div className={`border-b px-4 py-2 flex items-center justify-between shrink-0 ${theme === 'light' ? 'bg-black/5 border-black/20' : 'bg-white/10 border-white/20'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold tracking-widest ${theme === 'light' ? 'text-black' : 'text-white'}`}>RAW_DATA_ACQUISITION.EXE</span>
              <span className={`w-1.5 h-3 animate-pulse ${theme === 'light' ? 'bg-black' : 'bg-white'}`} />
            </div>
            <button onClick={() => setSelectedNode(null)} className={`transition-colors text-xs ${theme === 'light' ? 'text-black/60 hover:text-red-600' : 'text-white/60 hover:text-red-500'}`}>[X]</button>
          </div>
          
          <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-[11px] leading-relaxed">
            {/* SUBJECT IDENTIFICATION */}
            <div>
              <div className={`mb-1 ${theme === 'light' ? 'text-black/40' : 'text-white/40'}`}>// SUBJECT_IDENTIFICATION</div>
              {(() => {
                const nodeStatus = (selectedNode.metadata?.status || '').toLowerCase();
                const isNodeFaulty = nodeStatus === 'faulty';
                const isNodeWarning = ['maintenance', 'warning', 'pending', 'in progress'].includes(nodeStatus);
                const statusColor = isNodeFaulty ? 'text-red-500' : (isNodeWarning ? 'text-orange-500' : (theme === 'light' ? 'text-black' : 'text-white'));
                const latestLog = selectedNode.metadata?.latest_log || selectedNode.metadata?.last_maintenance_log || '';
                
                return (
                  <>
                    <div className={`font-bold text-lg tracking-tighter uppercase ${statusColor}`}>{`> ${selectedNode.name}`}</div>
                    <div className={`opacity-80 ${theme === 'light' ? 'text-black' : 'text-white'}`}>{`CLASS: ${selectedNode.type.toUpperCase()}`}</div>
                    <div className={`${theme === 'light' ? 'text-black/60' : 'text-white/60'}`}>{`UUID: ${selectedNode.id}`}</div>
                    {/* Latest Maintenance Log Symptom */}
                    {latestLog && (
                      <div className={`mt-2 text-[12px] uppercase tracking-wider px-3 py-2 rounded ${isNodeFaulty ? 'bg-red-500 text-white font-black' : (isNodeWarning ? 'bg-orange-500 text-white font-black' : (theme === 'light' ? 'text-black/60' : 'text-white/60'))}`}>
                        :: {latestLog}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* METADATA BLOCK */}
            <div className="space-y-1">
              <div className={`mb-2 ${theme === 'light' ? 'text-black/40' : 'text-white/40'}`}>// LOCAL_REGISTRY_DATA</div>
              {selectedNode.metadata ? Object.entries(selectedNode.metadata).map(([key, val]: [string, any]) => (
                <div key={key} className={`flex gap-4 border-l pl-3 py-0.5 ${theme === 'light' ? 'border-black/20' : 'border-white/20'}`}>
                  <span className={`uppercase w-32 shrink-0 ${theme === 'light' ? 'text-black/50' : 'text-white/50'}`}>{key.replace(/_/g, '_')}:</span>
                  <span className={`font-medium break-all ${theme === 'light' ? 'text-black' : 'text-white'}`}>{String(val)}</span>
                </div>
              )) : (
                <div className="text-rose-500 italic px-3">! NO_METADATA_FOUND</div>
              )}
            </div>

            {/* TOPOLOGY / NETWORK LINKS AS COMMANDS */}
            <div className="space-y-2">
              <div className={`mb-2 ${theme === 'light' ? 'text-black/40' : 'text-white/40'}`}>// NETWORK_TOPOLOGY_VECTORS</div>
              <div className="space-y-1">
                {(() => {
                  const related = graphData.links.filter(l => 
                    (typeof l.source === 'object' ? l.source.id : l.source) === selectedNode.id || 
                    (typeof l.target === 'object' ? l.target.id : l.target) === selectedNode.id
                  ).map(link => {
                    const s = typeof link.source === 'object' ? link.source.id : link.source;
                    const t = typeof link.target === 'object' ? link.target.id : link.target;
                    const otherId = s === selectedNode.id ? t : s;
                    const otherNode = graphData.nodes.find(n => n.id === otherId);
                    return { link, otherNode, otherId };
                  });

                  if (related.length === 0) return <div className="text-rose-500/50 italic pl-3">! NO_ACTIVE_UP_LINKS</div>;

                  // Split into UP and DOWN based on Hierarchy AND Flow Direction
                  const upward: any[] = [];
                  const downward: any[] = [];

                  related.forEach(r => {
                    const s = typeof r.link.source === 'object' ? r.link.source.id : r.link.source;
                    const isSubject = s === selectedNode.id;
                    const pred = r.link.name;

                    if (pred === 'contains') {
                      // Hierarchy: Parent is UP, Child is DOWN
                      if (isSubject) downward.push(r); // Selected node contains this -> it's below
                      else upward.push(r);             // This contains selected node -> it's above
                    } else if (pred === 'connectsTo' || pred === 'monitors') {
                      // Flow: Source is UP, Target is DOWN
                      if (isSubject) downward.push(r); // Selected node points to this -> it's downstream
                      else upward.push(r);             // This points to selected node -> it's upstream
                    } else {
                      // Fallback to Level logic
                      if (r.otherNode && parseInt(r.otherNode.level) < parseInt(selectedNode.level)) upward.push(r);
                      else downward.push(r);
                    }
                  });

                  // Helper function to check if a node has children with status issues
                  const getChildStatusIndicator = (nodeId: string) => {
                    const childLinks = graphData.links.filter(l => {
                      const s = typeof l.source === 'object' ? l.source.id : l.source;
                      return s === nodeId;
                    });
                    
                    let hasFaultyChild = false;
                    let hasWarningChild = false;
                    
                    childLinks.forEach(link => {
                      const t = typeof link.target === 'object' ? link.target.id : link.target;
                      const childNode = graphData.nodes.find(n => n.id === t);
                      if (childNode) {
                        const childStatus = (childNode.metadata?.status || '').toLowerCase();
                        if (childStatus === 'faulty') hasFaultyChild = true;
                        if (['maintenance', 'warning', 'pending', 'in progress'].includes(childStatus)) hasWarningChild = true;
                      }
                    });
                    
                    return { hasFaultyChild, hasWarningChild };
                  };

                  const renderNodeLink = (r: any, i: number, indentLevel: number) => {
                    const isUp = upward.includes(r);
                    const otherStatus = (r.otherNode?.metadata?.status || '').toLowerCase();
                    const isWarning = ['maintenance', 'warning', 'pending', 'in progress'].includes(otherStatus);
                    const isFaulty = otherStatus === 'faulty';
                    
                    // Calculate indent padding based on level
                    const indentPadding = indentLevel * 12; // 12px per level
                    
                    return (
                      <button 
                        key={i}
                        onClick={() => handleNodeClick(r.otherNode)}
                        style={{ paddingLeft: `${8 + indentPadding}px` }}
                        className={`w-full text-left group flex items-center gap-2 py-1 px-2 border transition-all ${theme === 'light' ? 'hover:bg-black/5 border-transparent hover:border-black/30' : 'hover:bg-white/10 border-transparent hover:border-white/30'}`}
                      >
                        <span className={`group-hover:translate-x-1 transition-transform opacity-50 flex items-center ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                          {isUp ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        </span>
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold uppercase ${isFaulty ? 'text-red-500' : (isWarning ? 'text-orange-500' : (theme === 'light' ? 'text-black' : 'text-white'))}`}>{`[ ${r.otherNode?.name || r.otherId} ]`}</span>
                            {/* Simple Status Indicator Dot */}
                            {isFaulty && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                            {isWarning && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
                          </div>
                          <span className={`text-[9px] uppercase ${theme === 'light' ? 'text-black/40' : 'text-white/40'}`}>{`${r.link.name.toUpperCase()} (LVL-${r.otherNode?.level || '?'})`}</span>
                        </div>
                      </button>
                    );
                  };

                  // Get current node status for color
                  const currentNodeStatus = (selectedNode.metadata?.status || '').toLowerCase();
                  const isCurrentFaulty = currentNodeStatus === 'faulty';
                  const isCurrentWarning = ['maintenance', 'warning', 'pending', 'in progress'].includes(currentNodeStatus);
                  const currentNodeTextColor = isCurrentFaulty ? 'text-red-500' : (isCurrentWarning ? 'text-orange-500' : (theme === 'light' ? 'text-black' : 'text-white'));
                  const currentNodeBorderColor = isCurrentFaulty ? 'border-red-500/60' : (isCurrentWarning ? 'border-orange-500/60' : (theme === 'light' ? 'border-black/40' : 'border-white/40'));
                  const currentNodeBgColor = isCurrentFaulty ? 'bg-red-500/10' : (isCurrentWarning ? 'bg-orange-500/10' : (theme === 'light' ? 'bg-black/5' : 'bg-white/5'));

                  return (
                    <>
                      {/* UPLINK Section - Grandparents (level -2) */}
                      {upward.filter(r => r.otherNode && parseInt(r.otherNode.level) <= parseInt(selectedNode.level) - 2).map((r, i) => renderNodeLink(r, i, 0))}
                      
                      {/* UPLINK Section - Parents (level -1) */}
                      {upward.filter(r => r.otherNode && parseInt(r.otherNode.level) === parseInt(selectedNode.level) - 1).map((r, i) => renderNodeLink(r, i + 50, 1))}
                      
                      {/* CURRENT NODE - With Border Frame (color based on status) */}
                      <div className={`my-2 py-2 px-3 border-2 rounded ${currentNodeBorderColor} ${currentNodeBgColor}`}>
                        <div className={`text-[9px] uppercase tracking-wider mb-1 ${isCurrentFaulty ? 'text-red-500/70' : (isCurrentWarning ? 'text-orange-500/70' : (theme === 'light' ? 'text-black/50' : 'text-white/50'))}`}>// CURRENT_TARGET</div>
                        <div className={`font-black tracking-[0.1em] flex items-center gap-2 ${currentNodeTextColor}`}>
                          <span className="text-[12px] animate-pulse">{`< ${selectedNode.name.toUpperCase()} >`}</span>
                        </div>
                        <div className={`text-[7px] uppercase tracking-[0.2em] mt-0.5 ${isCurrentFaulty ? 'text-red-500/60' : (isCurrentWarning ? 'text-orange-500/60' : (theme === 'light' ? 'text-black/40' : 'text-white/40'))}`}>
                          Subject_Acquired_In_Current_Sector
                        </div>
                      </div>

                      {/* DOWNLINK Section - Children (level +1) */}
                      {downward.filter(r => r.otherNode && parseInt(r.otherNode.level) === parseInt(selectedNode.level) + 1).map((r, i) => renderNodeLink(r, i + 100, 2))}
                      
                      {/* DOWNLINK Section - Grandchildren (level +2 and beyond) */}
                      {downward.filter(r => r.otherNode && parseInt(r.otherNode.level) >= parseInt(selectedNode.level) + 2).map((r, i) => renderNodeLink(r, i + 200, 3))}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          
          {/* TERMINAL FOOTER BUTTONS */}
          <div className={`p-4 border-t space-y-2 shrink-0 text-[10px] ${theme === 'light' ? 'bg-gray-50 border-black/20' : 'bg-black border-white/20'}`}>
             <button 
                onClick={() => handleNodeClick(selectedNode)}
                className={`w-full border py-2 transition-all flex items-center justify-center gap-2 group ${theme === 'light' ? 'border-black text-black hover:bg-black hover:text-white' : 'border-white text-white hover:bg-white hover:text-black'}`}
              >
                {`>> RE_INITIALIZE_NODE_FOCUS <<`}
              </button>
              <div className={`text-center animate-pulse tracking-widest uppercase ${theme === 'light' ? 'text-black/30' : 'text-white/30'}`}>
                -- SYSTEM_READY_FOR_INPUT --
              </div>
          </div>
        </div>
      )}

      {/* TACTICAL CONTROLS (BOTTOM CENTER) - FLOATING BUTTONS */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
        {/* THEME TOGGLE BUTTON */}
        <button 
          onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} 
          className={`px-4 py-2.5 rounded-[5px] border transition-all flex items-center gap-3 shrink-0 ${theme === 'light' ? 'bg-white border-black/30 text-black hover:bg-gray-100 shadow-md' : 'bg-black/40 border-white/30 text-white hover:bg-white/10 shadow-2xl'}`}
        >
          {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{theme === 'light' ? 'Light' : 'Dark'}</span>
        </button>

        {/* Visual mode button hidden - defaults to monochrome */}
        {/* <button 
          onClick={() => setVisualMode(prev => prev === 'color' ? 'monochrome' : 'color')} 
          className={`px-4 py-2.5 rounded-[5px] border transition-all flex items-center gap-3 shrink-0 ${theme === 'light' ? 'shadow-md' : 'shadow-2xl'} ${visualMode === 'monochrome' ? (theme === 'light' ? 'bg-black/10 border-black/30 text-black' : 'bg-white/10 border-white/30 text-white') : (theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20')}`}
        >
          <Palette className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Visual: {visualMode === 'color' ? 'Full' : 'Mono'}</span>
        </button> */}

        <button 
          onClick={() => setLayoutMode(prev => prev === 'hierarchy' ? 'radial' : 'hierarchy')} 
          className={`px-4 py-2.5 rounded-[5px] border transition-all flex items-center gap-3 shrink-0 ${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 shadow-md' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 shadow-2xl'}`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Mode: {layoutMode === 'hierarchy' ? 'Hierarchy' : 'Radial'}</span>
        </button>

        <button 
          onClick={toggleRotation} 
          className={`px-4 py-2.5 rounded-[5px] border transition-all flex items-center gap-3 shrink-0 ${theme === 'light' ? 'shadow-md' : 'shadow-2xl'} ${isRotating ? (theme === 'light' ? 'bg-black/10 border-black/30 text-black' : 'bg-white/10 border-white/30 text-white') : (theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-500 hover:text-black' : 'bg-black/40 border-white/10 text-white/40 hover:text-white')}`}
        >
          {isRotating ? <Pause className="w-4 h-4 animate-pulse" /> : <RotateCw className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{isRotating ? "Active" : "Paused"}</span>
        </button>
      </div>

      {/* LEGEND (BOTTOM CENTER) - HIDDEN BUT PRESERVED */}
      <div className="hidden absolute bottom-10 left-1/2 -translate-x-1/2 z-10 bg-black/40 backdrop-blur-2xl px-10 py-5 rounded-[5px] border border-white/5 shadow-2xl flex items-center gap-5">
        {legendItems.map((item, idx) => {
          const grayVal = Math.round(255 - (parseInt(item.id) * 20));
          const displayColor = visualMode === 'monochrome' ? `rgb(${grayVal}, ${grayVal}, ${grayVal})` : item.color;
          const glowColor = visualMode === 'monochrome' ? `rgba(${grayVal}, ${grayVal}, ${grayVal}, 0.5)` : `${item.color}88`;
          return (
            <React.Fragment key={item.id}>
              <button onClick={() => triggerHighlight(item.id)} className="flex flex-col items-center outline-none group">
                <div className={`w-8 h-8 rounded-[5px] flex items-center justify-center text-[12px] font-black shadow-lg transition-all duration-300 ${highlightLevel === item.id ? 'scale-125 brightness-150 animate-pulse' : 'hover:scale-125'}`} style={{ backgroundColor: displayColor, color: '#000', boxShadow: `0 0 25px ${glowColor}`, border: highlightLevel === item.id ? '3px solid #ffffff' : '3px solid rgba(255,255,255,0.3)' }}>{item.id}</div>
              </button>
              {idx < legendItems.length - 1 && <div className="text-white/20 font-black text-lg mx-1">{'>'}</div>}
            </React.Fragment>
          );
        })}
      </div>

      <ForceGraph3D
        ref={fgRef} width={dimensions.width} height={dimensions.height} graphData={graphData} backgroundColor={themeColors.bg}
        d3VelocityDecay={0.3}
        nodeColor={(node: any) => {
          const isSelected = selectedNode?.id === node.id; const isRelated = relatedNodeIds.has(node.id);
          
          // Improved Status Detection
          const status = (node.metadata?.status || '').toLowerCase();
          
          let base = node.color;
          if (theme === 'light') {
            // Light theme: black-based colors with varying opacity
            if (status === 'faulty') {
              base = '#cc0000'; // Critical Red (darker for light bg)
            } else if (['maintenance', 'warning', 'pending', 'in progress'].includes(status)) {
              base = '#cc6600'; // Warning Orange (darker for light bg)
            } else {
              const g = Math.round(30 + (parseInt(node.level) * 25)); 
              base = `rgb(${g},${g},${g})`; 
            }
          } else if (visualMode === 'monochrome') { 
            if (status === 'faulty') {
              base = '#ff0000'; // Critical Red
            } else if (['maintenance', 'warning', 'pending', 'in progress'].includes(status)) {
              base = '#ff8800'; // Warning Orange
            } else {
              const g = Math.round(255 - (parseInt(node.level) * 20)); 
              base = `rgb(${g},${g},${g})`; 
            }
          }
          
          if (highlightLevel && node.level === highlightLevel) return theme === 'light' ? '#000000' : '#ffffff';
          if (hoverNodeId === node.id || isSelected) return theme === 'light' ? '#000000' : '#ffffff';
          if (isRelated) return theme === 'light' ? '#000000' : '#ffffff';
          return base;
        }}
        nodeRelSize={1.5} 
        nodeResolution={24} 
        onNodeHover={triggerNodeHover} 
        onNodeClick={handleNodeClick} 
        nodeLabel={(node: any) => `${node.name} (${node.type})`}
        nodeVal={(node: any) => {
          const isSelected = selectedNode?.id === node.id;
          if (highlightLevel && node.level === highlightLevel || hoverNodeId === node.id) return node.val * 3;
          if (isSelected) return node.val * 4;
          return node.val;
        }}
        linkDirectionalParticles={8} linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={() => theme === 'light' ? '#000000' : '#ffffff'}
        linkWidth={(link: any) => {
          const s = typeof link.source === 'object' ? link.source.id : link.source;
          const t = typeof link.target === 'object' ? link.target.id : link.target;
          return (focusedNodeId === s || focusedNodeId === t) ? 4 : 2;
        }}
        linkOpacity={0.4} 
        linkColor={(link: any) => {
          const s = typeof link.source === 'object' ? link.source.id : link.source;
          const t = typeof link.target === 'object' ? link.target.id : link.target;
          if (theme === 'light') {
            return (focusedNodeId === s || focusedNodeId === t) ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.15)';
          }
          return (focusedNodeId === s || focusedNodeId === t) ? 'rgba(0, 242, 255, 0.8)' : 'rgba(255, 255, 255, 0.2)';
        }}
        nodeThreeObjectExtend={true}
        nodeThreeObject={(node: any) => {
          const group = new THREE.Group();
          const isT = (highlightLevel && node.level === highlightLevel) || (hoverNodeId === node.id) || (focusedNodeId === node.id) || (selectedNode?.id === node.id);
          
          // Set pulsing flags for animation
          const status = (node.metadata?.status || '').toLowerCase();
          const isFaulty = status === 'faulty';
          const isWarning = ['maintenance', 'warning', 'pending', 'in progress'].includes(status);
          
          if (isFaulty || isWarning) {
            group.userData.isPulsing = true;
            group.userData.pulseType = isFaulty ? 'faulty' : 'warning';
          }

          if (isT) {
            const rC = document.createElement('canvas'); rC.width = 128; rC.height = 128; const rX = rC.getContext('2d');
            if (rX) {
              rX.strokeStyle = theme === 'light' ? '#000000' : '#ffffff'; rX.lineWidth = 6; const s = 30; const p = 20;
              rX.beginPath(); rX.moveTo(p, p+s); rX.lineTo(p, p); rX.lineTo(p+s, p); rX.stroke();
              rX.beginPath(); rX.moveTo(128-p-s, p); rX.lineTo(128-p, p); rX.lineTo(128-p, p+s); rX.stroke();
              rX.beginPath(); rX.moveTo(p, 128-p-s); rX.lineTo(p, 128-p); rX.lineTo(p+s, 128-p); rX.stroke();
              rX.beginPath(); rX.moveTo(128-p-s, 128-p); rX.lineTo(128-p, 128-p); rX.lineTo(128-p, 128-p-s); rX.stroke();
              const rT = new THREE.CanvasTexture(rC); const rM = new THREE.SpriteMaterial({ map: rT, transparent: true, opacity: 0.6 });
              const rS = new THREE.Sprite(rM); rS.name = 'radarMark'; rS.scale.set(15, 15, 1); group.add(rS);
            }
          }
          const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
          if (ctx) {
            const label = node.name || ''; ctx.font = 'bold 24px ui-monospace, monospace';
            const tw = ctx.measureText(label).width; canvas.width = tw + 15; canvas.height = 30;
            ctx.font = 'bold 24px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            let tC = node.color; 
            if (theme === 'light') {
              const g = Math.round(30 + (parseInt(node.level) * 25)); 
              tC = `rgb(${g},${g},${g})`;
            } else if (visualMode === 'monochrome') { 
              const g = Math.round(255 - (parseInt(node.level) * 20)); 
              tC = `rgb(${g},${g},${g})`; 
            }
            ctx.fillStyle = isT ? (theme === 'light' ? '#000000' : '#ffffff') : tC; 
            ctx.shadowBlur = theme === 'light' ? 0 : 6; 
            ctx.shadowColor = theme === 'light' ? 'transparent' : 'black';
            ctx.fillText(label, canvas.width / 2, canvas.height / 2);
            const texture = new THREE.CanvasTexture(canvas); const sM = new THREE.SpriteMaterial({ map: texture, depthTest: false });
            const s = new THREE.Sprite(sM); s.scale.set(canvas.width / 4, canvas.height / 4, 1);
            s.position.set(0, 10, 0); group.add(s);
          }
          return group;
        }}
      />
    </div>
  );
}
