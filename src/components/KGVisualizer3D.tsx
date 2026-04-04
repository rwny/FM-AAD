import React, { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { RotateCw, Pause, Search, Layers, Palette } from 'lucide-react';
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
  const [visualMode, setVisualMode] = useState<'color' | 'monochrome'>('color');
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
        '1': 200, '2': 150, '3': 100, '4': 50, '5': 0, '6': -50, '7': -100, '8': -150, '9': -200
      };

      graphData.nodes.forEach(node => {
        if (layoutMode === 'hierarchy') node.fy = levelHeights[node.level] || 0; 
        else node.fy = undefined; 
      });

      const chargeForce = fgRef.current.d3Force('charge');
      if (chargeForce && typeof chargeForce.strength === 'function') {
        chargeForce.strength(layoutMode === 'hierarchy' ? -40 : -100); 
      }

      const linkForce = fgRef.current.d3Force('link');
      if (linkForce && typeof linkForce.distance === 'function') {
        linkForce.distance(layoutMode === 'hierarchy' ? 20 : 35);
      }

      const scene = fgRef.current.scene();
      const oldPlanes = scene.children.filter((c: any) => c.name === 'tacticalPlane');
      oldPlanes.forEach((p: any) => scene.remove(p));

      if (layoutMode === 'hierarchy') {
        const planeColors: { [key: string]: string } = visualMode === 'monochrome' 
          ? { '1': '#ffffff', '2': '#dddddd', '3': '#bbbbbb', '4': '#999999', '5': '#777777', '6': '#555555' }
          : { '1': '#4A007B', '2': '#0000ff', '3': '#00ccff', '4': '#00ffaa', '5': '#00ff00', '6': '#aaff00' };

        Object.entries(levelHeights).forEach(([lvl, height]) => {
          if (planeColors[lvl]) {
            const geometry = new THREE.RingGeometry(250, 251, 64);
            const material = new THREE.MeshBasicMaterial({ color: planeColors[lvl], transparent: true, opacity: 0.1, side: THREE.DoubleSide });
            const plane = new THREE.Mesh(geometry, material);
            plane.rotation.x = Math.PI / 2; plane.position.y = height; plane.name = 'tacticalPlane';
            scene.add(plane);
            const grid = new THREE.GridHelper(500, 10, material.color, material.color);
            grid.position.y = height; grid.material.opacity = 0.05; grid.material.transparent = true; grid.name = 'tacticalPlane';
            scene.add(grid);
          }
        });
      }

      if (fgRef.current.d3Alpha) fgRef.current.d3Alpha(1);
      if (fgRef.current.d3ReheatSimulation) fgRef.current.d3ReheatSimulation();

      const controls = fgRef.current.controls();
      if (layoutMode === 'hierarchy') {
        fgRef.current.cameraPosition({ x: 0, y: 150, z: 800 }, { x: 0, y: 0, z: 0 }, 1200);
        if (controls) {
          controls.minPolarAngle = Math.PI / 2.5; controls.maxPolarAngle = Math.PI / 1.8;
          controls.minAzimuthAngle = -Math.PI / 12; controls.maxAzimuthAngle = Math.PI / 12;
          controls.enablePan = false; controls.minDistance = 200; controls.maxDistance = 1200;
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
  }, [graphData, layoutMode, visualMode]);

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
        const graphGroup = scene.children.find((child: any) => child.type === 'Group');
        if (graphGroup) {
          const targetVelocity = isRotating ? 0.0025 : 0;
          rotationVelocityRef.current += (targetVelocity - rotationVelocityRef.current) * 0.05;
          if (Math.abs(rotationVelocityRef.current) > 0.00001) graphGroup.rotation.y += rotationVelocityRef.current;
        }
        scene.traverse((obj: any) => {
          if (obj.name === 'radarMark') {
            obj.rotation.z += 0.02;
            const pulse = 15 + Math.sin(Date.now() * 0.008) * 2;
            obj.scale.set(pulse, pulse, 1);
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
          .select('asset_id, status')
          .order('date', { ascending: false });

        // --- 3. FETCH GENERAL LOGS ---
        const { data: genLogs } = await supabase
          .from('maintenance_logs')
          .select('status, assets!inner(asset_id)')
          .order('date', { ascending: false });

        const statusMap: { [key: string]: string } = {};
        
        // Map Assets status (Matches n.name or n.metadata.asset_id)
        if (assetsData) {
          assetsData.forEach(a => {
            const status = a.status || 'Normal';
            if (a.asset_id) statusMap[a.asset_id.toUpperCase()] = status;
            if (a.metadata?.id) statusMap[String(a.metadata.id).toUpperCase()] = status;
          });
        }

        // Overlay with AC Logs (Specific for AC-XXX IDs)
        if (acLogs) {
          acLogs.forEach(log => {
            const id = log.asset_id?.toUpperCase();
            if (id && !statusMap[id]) statusMap[id] = log.status;
          });
        }

        // Overlay with General Logs
        if (genLogs) {
          genLogs.forEach((log: any) => {
            const id = log.assets?.asset_id?.toUpperCase();
            if (id && !statusMap[id]) statusMap[id] = log.status;
          });
        }

        if (nodesData && edgesData) {
          const mappedNodes = nodesData.map((n: any) => {
            let color = '#64748b'; let level = '9'; let val = 4;
            const t = n.type.toLowerCase();
            const nodeNameUC = n.name.toUpperCase();
            const metaAssetID = n.metadata?.asset_id?.toUpperCase();
            
            // AGGRESSIVE STATUS MATCHING
            const currentStatus = statusMap[nodeNameUC] || statusMap[metaAssetID] || n.metadata?.status || 'Normal';
            const mergedMetadata = { ...n.metadata, status: currentStatus };

            if (t === 'building') { color = '#4A007B'; val = 25; level = '1'; }
            else if (t === 'floor') { color = '#0000ff'; val = 20; level = '2'; }
            else if (t === 'room') { color = '#00ccff'; val = 15; level = '3'; }
            else if (t === 'system_group') { color = '#00ffaa'; val = 12; level = '4'; }
            else if (t === 'ac_set' || t === 'nvr' || t === 'load_panel') { color = '#00ff00'; val = 10; level = '5'; }
            else if (t === 'fcu' || t === 'cdu') { color = '#aaff00'; val = 9; level = '6'; }
            else if (t === 'cctv_camera') { color = '#ffcc00'; val = 8; level = '7'; }
            else if (t.includes('power') || t.includes('switch') || t.includes('light')) { color = '#ff7700'; val = 7; level = '8'; }
            else if (t === 'pipe' || t === 'unknown') { color = '#ff0000'; val = 6; level = '9'; }
            const displayName = n.metadata?.display_name || n.name;
            return { id: n.id, name: displayName, fullName: n.name, type: n.type, level, val, color, metadata: mergedMetadata };
          });
          setGraphData({ nodes: mappedNodes, links: edgesData.map((e: any) => ({ source: e.subject_id, target: e.object_id, name: e.predicate })) });
          addLog('[SYSTEM] TOPOLOGY SYNC COMPLETE.');
        }
      } catch (err) { console.error('Failed to load KG 3D:', err); }
    }
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNodeClick = (node: any) => {
    if (!node) return;
    setFocusedNodeId(node.id); setSelectedNode(node);
    addLog(`[TARGET] ACQUIRED: ${node.name.toUpperCase()}`);
    if (fgRef.current) {
      const distance = 120; const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
      fgRef.current.cameraPosition({ x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio }, { x: node.x, y: node.y, z: node.z }, 2000);
    }
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

  return (
    <div className="absolute inset-0 bg-[#010409] overflow-hidden font-mono">
      {/* LEFT HEADING & LOGS */}
      <div className="absolute top-8 left-24 z-10 text-white flex flex-col gap-0.5">
        <h2 className="text-3xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] font-mono pointer-events-none">AR15 TOPOLOGY 3D</h2>
        <p className="text-white text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-4 font-mono pointer-events-none">Tactical Network Environment</p>
        
        {/* SEARCH BOX UNDER HEADING */}
        <div className="relative w-64 mb-4">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#00f2ff]/40 group-focus-within:text-[#00f2ff] transition-colors" />
            <input
              type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
              onFocus={() => setShowSearchResults(true)} placeholder="SEARCH NETWORK..."
              className="w-full bg-black/40 backdrop-blur-md border border-[#00f2ff]/20 rounded-xl py-2 pl-10 pr-4 text-xs font-mono text-white focus:outline-none focus:border-[#00f2ff]/60"
            />
          </div>
          {showSearchResults && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl border border-[#00f2ff]/30 rounded-xl overflow-hidden shadow-2xl z-50">
              {searchResults.length === 0 ? <div className="p-4 text-[10px] text-white/40 text-center uppercase">No Assets</div> : 
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {searchResults.map((node) => (
                    <button key={node.id} onClick={() => { handleNodeClick(node); setShowSearchResults(false); setSearchQuery(''); }}
                      className="w-full px-4 py-3 flex flex-col items-start hover:bg-[#00f2ff]/10 border-b border-white/5 transition-colors text-left"
                    >
                      <span className="text-[10px] font-black text-[#00f2ff] uppercase">{node.name}</span>
                      <span className="text-[8px] font-bold text-white/30 uppercase">{node.type}</span>
                    </button>
                  ))}
                </div>
              }
            </div>
          )}
        </div>

        {/* TERMINAL LOGS */}
        <div className="flex flex-col gap-0.5 font-mono text-[9px] text-[#00f2ff] tracking-tight leading-none opacity-80 pointer-events-none">
          {terminalLogs.map((log) => (<div key={log.id} className="animate-in fade-in duration-300 h-[11px] flex items-center"><span className="opacity-30 mr-2">::</span>{log.text}</div>))}
        </div>
      </div>

      {/* TACTICAL ACQUISITION: TEXT TERMINAL MODE (RIGHT ALIGNED) */}
      {selectedNode && (
        <div className="absolute top-32 right-8 z-50 w-[380px] bg-black/95 border border-[#00f2ff]/40 rounded-none shadow-[0_0_40px_rgba(0,242,255,0.1)] flex flex-col font-mono animate-in slide-in-from-right-4 duration-300 max-h-[70vh]">
          {/* TERMINAL HEADER */}
          <div className="bg-[#00f2ff]/10 border-b border-[#00f2ff]/20 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[#00f2ff] text-xs font-bold tracking-widest">RAW_DATA_ACQUISITION.EXE</span>
              <span className="w-1.5 h-3 bg-[#00f2ff] animate-pulse" />
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-[#00f2ff]/60 hover:text-[#ff0000] transition-colors text-xs">[X]</button>
          </div>
          
          <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-[11px] leading-relaxed">
            {/* SUBJECT IDENTIFICATION */}
            <div>
              <div className="text-[#00f2ff]/40 mb-1">// SUBJECT_IDENTIFICATION</div>
              <div className="text-white font-bold text-lg tracking-tighter uppercase">{`> ${selectedNode.name}`}</div>
              <div className="text-[#00f2ff] opacity-80">{`CLASS: ${selectedNode.type.toUpperCase()}`}</div>
              <div className="text-[#00f2ff]/60">{`UUID: ${selectedNode.id}`}</div>
            </div>

            {/* METADATA BLOCK */}
            <div className="space-y-1">
              <div className="text-[#00f2ff]/40 mb-2">// LOCAL_REGISTRY_DATA</div>
              {selectedNode.metadata ? Object.entries(selectedNode.metadata).map(([key, val]: [string, any]) => (
                <div key={key} className="flex gap-4 border-l border-[#00f2ff]/20 pl-3 py-0.5">
                  <span className="text-[#00f2ff]/50 uppercase w-32 shrink-0">{key.replace(/_/g, '_')}:</span>
                  <span className="text-white font-medium break-all">{String(val)}</span>
                </div>
              )) : (
                <div className="text-rose-500 italic px-3">! NO_METADATA_FOUND</div>
              )}
            </div>

            {/* TOPOLOGY / NETWORK LINKS AS COMMANDS */}
            <div className="space-y-2">
              <div className="text-[#00f2ff]/40 mb-2">// NETWORK_TOPOLOGY_VECTORS</div>
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

                  const renderNodeLink = (r: any, i: number) => {
                    const isUp = upward.includes(r);
                    
                    return (
                      <button 
                        key={i} 
                        onClick={() => handleNodeClick(r.otherNode)}
                        className="w-full text-left hover:bg-[#00f2ff]/10 group flex items-start gap-2 py-1 px-2 border border-transparent hover:border-[#00f2ff]/30 transition-all"
                      >
                        <span className="text-[#00f2ff] group-hover:translate-x-1 transition-transform opacity-50">{isUp ? 'UPLINK^' : 'DNLINK_'}</span>
                        <div className="flex flex-col">
                          <span className="text-white font-bold uppercase">{`[ ${r.otherNode?.name || r.otherId} ]`}</span>
                          <span className="text-[#00f2ff]/40 text-[9px] uppercase">{`${r.link.name.toUpperCase()} (LVL-${r.otherNode?.level || '?'})`}</span>
                        </div>
                      </button>
                    );
                  };

                  return (
                    <>
                      {upward.map((r, i) => renderNodeLink(r, i))}
                      
                      <div className="py-3 flex flex-col items-start opacity-80 pl-2">
                        <div className="text-[#00f2ff] font-black tracking-[0.1em] flex items-center gap-2">
                          <span className="text-[12px] animate-pulse">{`< ${selectedNode.name.toUpperCase()} >`}</span>
                          <span className="text-[10px] opacity-40">-----------------------</span>
                        </div>
                        <div className="text-[7px] text-[#00f2ff]/40 uppercase tracking-[0.2em] mt-0.5 ml-7">
                          Subject_Acquired_In_Current_Sector
                        </div>
                      </div>

                      {downward.map((r, i) => renderNodeLink(r, i + 100))}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          
          {/* TERMINAL FOOTER BUTTONS */}
          <div className="p-4 bg-black border-t border-[#00f2ff]/20 space-y-2 shrink-0 text-[10px]">
             <button 
                onClick={() => handleNodeClick(selectedNode)}
                className="w-full border border-[#00f2ff] text-[#00f2ff] hover:bg-[#00f2ff] hover:text-black py-2 transition-all flex items-center justify-center gap-2 group"
              >
                {`>> RE_INITIALIZE_NODE_FOCUS <<`}
              </button>
              <div className="text-center text-[#00f2ff]/30 animate-pulse tracking-widest uppercase">
                -- SYSTEM_READY_FOR_INPUT --
              </div>
          </div>
        </div>
      )}

      {/* TACTICAL CONTROLS (BOTTOM CENTER) - FLOATING BUTTONS */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
        <button 
          onClick={() => setVisualMode(prev => prev === 'color' ? 'monochrome' : 'color')} 
          className={`px-4 py-2.5 rounded-xl border transition-all shadow-2xl flex items-center gap-3 shrink-0 ${visualMode === 'monochrome' ? 'bg-white/10 border-white/30 text-white' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'}`}
        >
          <Palette className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Visual: {visualMode === 'color' ? 'Full' : 'Mono'}</span>
        </button>

        <button 
          onClick={() => setLayoutMode(prev => prev === 'hierarchy' ? 'radial' : 'hierarchy')} 
          className="px-4 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-3 shrink-0 shadow-2xl"
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Mode: {layoutMode === 'hierarchy' ? 'Hierarchy' : 'Radial'}</span>
        </button>

        <button 
          onClick={toggleRotation} 
          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-3 shrink-0 shadow-2xl ${isRotating ? 'bg-[#00f2ff]/10 border-[#00f2ff]/30 text-[#00f2ff]' : 'bg-black/40 border-white/10 text-white/40 hover:text-white'}`}
        >
          {isRotating ? <Pause className="w-4 h-4 animate-pulse" /> : <RotateCw className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{isRotating ? "Active" : "Paused"}</span>
        </button>
      </div>

      {/* LEGEND (BOTTOM CENTER) - HIDDEN BUT PRESERVED */}
      <div className="hidden absolute bottom-10 left-1/2 -translate-x-1/2 z-10 bg-black/40 backdrop-blur-2xl px-10 py-5 rounded-full border border-white/5 shadow-2xl flex items-center gap-5">
        {legendItems.map((item, idx) => {
          const grayVal = Math.round(255 - (parseInt(item.id) * 20));
          const displayColor = visualMode === 'monochrome' ? `rgb(${grayVal}, ${grayVal}, ${grayVal})` : item.color;
          const glowColor = visualMode === 'monochrome' ? `rgba(${grayVal}, ${grayVal}, ${grayVal}, 0.5)` : `${item.color}88`;
          return (
            <React.Fragment key={item.id}>
              <button onClick={() => triggerHighlight(item.id)} className="flex flex-col items-center outline-none group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black shadow-lg transition-all duration-300 ${highlightLevel === item.id ? 'scale-125 brightness-150 animate-pulse' : 'hover:scale-125'}`} style={{ backgroundColor: displayColor, color: '#000', boxShadow: `0 0 25px ${glowColor}`, border: highlightLevel === item.id ? '3px solid #ffffff' : '3px solid rgba(255,255,255,0.3)' }}>{item.id}</div>
              </button>
              {idx < legendItems.length - 1 && <div className="text-white/20 font-black text-lg mx-1">{'>'}</div>}
            </React.Fragment>
          );
        })}
      </div>

      <ForceGraph3D
        ref={fgRef} width={dimensions.width} height={dimensions.height} graphData={graphData} backgroundColor="#010409"
        nodeColor={(node: any) => {
          const isSelected = selectedNode?.id === node.id; const isRelated = relatedNodeIds.has(node.id);
          
          // Improved Status Detection
          const status = (node.metadata?.status || '').toLowerCase();
          
          let base = node.color;
          if (visualMode === 'monochrome') { 
            if (status === 'faulty') {
              base = '#ff0000'; // Critical Red
            } else if (['maintenance', 'warning', 'pending', 'in progress'].includes(status)) {
              base = '#ff8800'; // Warning Orange
            } else {
              const g = Math.round(255 - (parseInt(node.level) * 20)); 
              base = `rgb(${g},${g},${g})`; 
            }
          }
          
          if (highlightLevel && node.level === highlightLevel) return '#ffffff';
          if (hoverNodeId === node.id || isSelected) return '#ffffff';
          if (isRelated) return '#00f2ff';
          return base;
        }}
        nodeRelSize={1.5} nodeResolution={24} onNodeHover={triggerNodeHover} onNodeClick={handleNodeClick} nodeLabel={(node: any) => `${node.name} (${node.type})`}
        nodeVal={(node: any) => {
          const isSelected = selectedNode?.id === node.id;
          if (highlightLevel && node.level === highlightLevel || hoverNodeId === node.id) return node.val * 3;
          if (isSelected) return node.val * 4;
          return node.val;
        }}
        linkDirectionalParticles={8} linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={() => '#ffffff'}
        linkWidth={(link: any) => {
          const s = typeof link.source === 'object' ? link.source.id : link.source;
          const t = typeof link.target === 'object' ? link.target.id : link.target;
          return (focusedNodeId === s || focusedNodeId === t) ? 4 : 2;
        }}
        linkOpacity={0.4} 
        linkColor={(link: any) => {
          const s = typeof link.source === 'object' ? link.source.id : link.source;
          const t = typeof link.target === 'object' ? link.target.id : link.target;
          return (focusedNodeId === s || focusedNodeId === t) ? 'rgba(0, 242, 255, 0.8)' : 'rgba(255, 255, 255, 0.2)';
        }}
        nodeThreeObjectExtend={true}
        nodeThreeObject={(node: any) => {
          const group = new THREE.Group();
          const isT = (highlightLevel && node.level === highlightLevel) || (hoverNodeId === node.id) || (focusedNodeId === node.id) || (selectedNode?.id === node.id);
          if (isT) {
            const rC = document.createElement('canvas'); rC.width = 128; rC.height = 128; const rX = rC.getContext('2d');
            if (rX) {
              rX.strokeStyle = '#ffffff'; rX.lineWidth = 6; const s = 30; const p = 20;
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
            let tC = node.color; if (visualMode === 'monochrome') { const g = Math.round(255 - (parseInt(node.level) * 20)); tC = `rgb(${g},${g},${g})`; }
            ctx.fillStyle = isT ? '#ffffff' : tC; ctx.shadowBlur = 6; ctx.shadowColor = 'black';
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
