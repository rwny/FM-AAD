import React, { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { RotateCw, Pause, Search, Target, X } from 'lucide-react';
import { supabase } from '../utils/supabase';

export function KGVisualizer3D() {
  const fgRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [highlightLevel, setHighlightLevel] = useState<string | null>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isRotating, setIsRotating] = useState(true); 
  const fadeTimeoutRef = useRef<any>(null);
  const streamIntervalRef = useRef<any>(null);

  useEffect(() => {
    let frameId: number;
    const animate = () => {
      if (fgRef.current) {
        const scene = fgRef.current.scene();
        const graphGroup = scene.children.find((child: any) => child.type === 'Group');
        if (graphGroup) {
          if (isRotating) graphGroup.rotation.y += 0.0025; 
          else {
            graphGroup.rotation.y *= 0.95; 
            if (Math.abs(graphGroup.rotation.y) < 0.001) graphGroup.rotation.y = 0;
          }
        }
        
        // Update radar marks for focused or hovered nodes
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
        if (nodesData && edgesData) {
          const nodes = nodesData.map((n: any) => {
            let color = '#64748b'; let level = '7'; let val = 4;
            const t = n.type.toLowerCase();
            if (t === 'building') { color = '#ff0000'; val = 25; level = '1'; }
            else if (t === 'floor') { color = '#ff8800'; val = 20; level = '2'; }
            else if (t === 'room') { color = '#ffff00'; val = 15; level = '3'; }
            else if (t === 'system_group') { color = '#00ff00'; val = 12; level = '4'; }
            else if (t === 'ac_set' || t === 'nvr') { color = '#0ea5e9'; val = 10; level = '5'; }
            else if (t === 'fcu' || t === 'cdu' || t === 'load_panel' || t === 'cctv_camera' || t.includes('power') || t.includes('switch') || t.includes('light')) { color = '#0066ff'; val = 8; level = '6'; }
            else if (t === 'pipe') { color = '#444444'; val = 6; level = '7'; }
            
            const displayName = n.metadata?.display_name || n.name;
            return { id: n.id, name: displayName, fullName: n.name, type: n.type, level, val, color };
          });
          const links = edgesData.map((e: any) => ({ source: e.subject_id, target: e.object_id, name: e.predicate }));
          setGraphData({ nodes, links });
        }
      } catch (err) { console.error('Failed to load KG 3D:', err); }
    }
    fetchData();
    return () => {
      window.removeEventListener('resize', handleResize);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return graphData.nodes.filter(n => 
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery, graphData.nodes]);

  const handleSearchSelect = (node: any) => {
    if (!node) return;
    setFocusedNodeId(node.id);
    setSearchQuery('');
    setTerminalLogs(prev => [...prev, `[TARGET] ACQUIRED: ${node.name.toUpperCase()}`, `[TACTICAL] VECTORING CAMERA TO SOURCE...`].slice(-25));
    
    if (fgRef.current) {
      // Aim at node from a distance of 150 units
      const distance = 150;
      const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1);

      fgRef.current.cameraPosition(
        { 
          x: (node.x || 0) * distRatio, 
          y: (node.y || 0) * distRatio, 
          z: (node.z || 0) * distRatio 
        }, 
        node, 
        2000
      );
    }
  };

  const triggerNodeHover = (node: any) => {
    if (!node) {
      setHoverNodeId(null);
      return;
    }
    setHoverNodeId(node.id);
    const nodeLogs = [`[HOVER] ID: ${node.name.toUpperCase()}`, `[TYPE] ${node.type.toUpperCase()}`];
    setTerminalLogs(prev => [...prev, ...nodeLogs].slice(-25));
  };

  const toggleRotation = () => {
    setIsRotating(!isRotating);
    setTerminalLogs(prev => [...prev, `[SYSTEM] ROTATION: ${!isRotating ? 'ON' : 'OFF'}`].slice(-25));
  };

  const triggerHighlight = (level: string) => {
    setHighlightLevel(level);
    const levelNodes = graphData.nodes.filter(n => n.level === level);
    setTerminalLogs(prev => [...prev, `[SCAN] LVL-0${level}: ${levelNodes.length} NODES FOUND`].slice(-25));
    
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = setTimeout(() => setHighlightLevel(null), 5000);
  };

  const legendItems = [{ id: '1', color: '#ff0000' }, { id: '2', color: '#ff8800' }, { id: '3', color: '#ffff00' }, { id: '4', color: '#00ff00' }, { id: '5', color: '#0ea5e9' }, { id: '6', color: '#0066ff' }, { id: '7', color: '#444444' }];

  return (
    <div className="absolute inset-0 bg-[#010409] overflow-hidden font-mono">
      {/* TACTICAL OVERLAY UI */}
      <div className="absolute top-8 left-24 z-10 text-white pointer-events-none flex flex-col gap-0.5">
        <h2 className="text-3xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] font-mono">AR15 TOPOLOGY 3D</h2>
        <p className="text-white text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-4 font-mono">Tactical Network Environment</p>
        <div className="flex flex-col gap-0.5 font-mono text-[9px] text-white tracking-tight leading-none opacity-80">
          {terminalLogs.map((log, i) => (
            <div key={i} className="animate-in fade-in slide-in-from-left-1 duration-150 h-[11px]">
              {log && <><span className="opacity-30 mr-2">::</span>{log}</>}
            </div>
          ))}
        </div>
      </div>

      {/* SEARCH BOX 3D */}
      <div className="absolute top-8 right-8 z-50 flex flex-col gap-2">
        <div className="relative group w-64">
           <div className="absolute inset-0 bg-[#00f2ff]/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
           <div className="relative flex items-center bg-black/60 backdrop-blur-2xl border border-white/10 rounded-xl p-1 shadow-2xl overflow-hidden">
             <div className="p-2.5 text-slate-400">
               <Search className="w-4 h-4" />
             </div>
             <input 
               type="text"
               placeholder="TARGET SEARCH..."
               className="bg-transparent border-none outline-none text-white text-[10px] font-black tracking-widest w-full py-2 placeholder:text-white/20 uppercase"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
             {searchQuery && (
               <button onClick={() => setSearchQuery('')} className="p-2 text-white/40 hover:text-white transition-colors">
                 <X className="w-3 h-3" />
               </button>
             )}
           </div>
           
           {/* SEARCH RESULTS */}
           {searchResults.length > 0 && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
               {searchResults.map((node, i) => (
                 <button
                   key={i}
                   onClick={() => handleSearchSelect(node)}
                   className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-none group/item"
                 >
                   <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
                   <div className="flex flex-col">
                     <span className="text-[10px] font-black text-white tracking-widest uppercase">{node.name}</span>
                     <span className="text-[8px] font-bold text-white/40 uppercase">{node.type}</span>
                   </div>
                   <Target className="w-3 h-3 ml-auto text-white/20 group-hover/item:text-[#00f2ff] transition-colors" />
                 </button>
               ))}
             </div>
           )}
        </div>

        <button onClick={toggleRotation} className={`p-2.5 rounded-xl border backdrop-blur-xl transition-all shadow-2xl flex items-center justify-center gap-2 group ${isRotating ? 'bg-[#00f2ff]/10 border-[#00f2ff]/30 text-[#00f2ff]' : 'bg-black/40 border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}>
          {isRotating ? <Pause className="w-4 h-4 animate-pulse" /> : <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />}
          <span className="text-[9px] font-black uppercase tracking-widest">{isRotating ? "Rotation: ON" : "Rotation: OFF"}</span>
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 bg-black/40 backdrop-blur-2xl px-10 py-5 rounded-full border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-5">
        {legendItems.map((item, idx) => (
          <React.Fragment key={item.id}>
            <button onClick={() => triggerHighlight(item.id)} className="flex flex-col items-center group relative outline-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black shadow-lg transition-all duration-300 ${highlightLevel === item.id ? 'scale-125 brightness-150 animate-pulse' : 'hover:scale-125'}`} style={{ backgroundColor: item.color, color: '#000', boxShadow: `0 0 25px ${item.color}88`, border: highlightLevel === item.id ? '3px solid #ffffff' : '3px solid rgba(255,255,255,0.3)' }}>{item.id}</div>
            </button>
            {idx < legendItems.length - 1 && <div className="text-white/20 font-black text-lg mx-1">{'>'}</div>}
          </React.Fragment>
        ))}
      </div>

      <ForceGraph3D
        ref={fgRef} width={dimensions.width} height={dimensions.height} graphData={graphData} backgroundColor="#010409"
        nodeColor={(node: any) => (highlightLevel && node.level === highlightLevel) || (hoverNodeId === node.id) || (focusedNodeId === node.id) ? '#ffffff' : node.color}
        nodeRelSize={1.5} nodeResolution={24} onNodeHover={triggerNodeHover} nodeLabel={(node: any) => `${node.name} (${node.type})`}
        nodeVal={(node: any) => (highlightLevel && node.level === highlightLevel) || (hoverNodeId === node.id) || (focusedNodeId === node.id) ? node.val * 3 : node.val}
        linkDirectionalParticles={8} linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={(link: any) => {
          const sourceNode = graphData.nodes.find(n => n.id === (link.source.id || link.source));
          if ((highlightLevel && sourceNode?.level === highlightLevel) || (hoverNodeId === sourceNode?.id) || (focusedNodeId === sourceNode?.id)) return '#ffffff';
          return sourceNode ? sourceNode.color : '#ffffff';
        }}
        linkWidth={1.2} linkOpacity={0.2} linkColor={() => 'rgba(255,255,255,0.1)'} nodeThreeObjectExtend={true}
        nodeThreeObject={(node: any) => {
          const group = new THREE.Group();
          const isTargeted = (highlightLevel && node.level === highlightLevel) || (hoverNodeId === node.id) || (focusedNodeId === node.id);
          
          if (isTargeted) {
            const radarCanvas = document.createElement('canvas'); radarCanvas.width = 128; radarCanvas.height = 128;
            const rCtx = radarCanvas.getContext('2d');
            if (rCtx) {
              rCtx.strokeStyle = '#ffffff'; rCtx.lineWidth = 6; const size = 30; const pad = 20;
              rCtx.beginPath(); rCtx.moveTo(pad, pad+size); rCtx.lineTo(pad, pad); rCtx.lineTo(pad+size, pad); rCtx.stroke();
              rCtx.beginPath(); rCtx.moveTo(128-pad-size, pad); rCtx.lineTo(128-pad, pad); rCtx.lineTo(128-pad, pad+size); rCtx.stroke();
              rCtx.beginPath(); rCtx.moveTo(pad, 128-pad-size); rCtx.lineTo(pad, 128-pad); rCtx.lineTo(pad+size, 128-pad); rCtx.stroke();
              rCtx.beginPath(); rCtx.moveTo(128-pad-size, 128-pad); rCtx.lineTo(128-pad, 128-pad); rCtx.lineTo(128-pad, 128-pad-size); rCtx.stroke();
              const radarTexture = new THREE.CanvasTexture(radarCanvas);
              const radarMaterial = new THREE.SpriteMaterial({ map: radarTexture, transparent: true, opacity: 0.6 });
              const radarSprite = new THREE.Sprite(radarMaterial); radarSprite.name = 'radarMark'; radarSprite.scale.set(15, 15, 1); group.add(radarSprite);
            }
          }
          const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
          if (ctx) {
            const label = node.name || ''; ctx.font = 'bold 32px ui-monospace, monospace';
            const textWidth = ctx.measureText(label).width; canvas.width = textWidth + 20; canvas.height = 40;
            ctx.font = 'bold 32px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = isTargeted ? '#ffffff' : node.color; ctx.shadowBlur = 8; ctx.shadowColor = 'black';
            ctx.fillText(label, canvas.width / 2, canvas.height / 2);
            const texture = new THREE.CanvasTexture(canvas); const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
            const sprite = new THREE.Sprite(spriteMaterial); sprite.scale.set(canvas.width / 6, canvas.height / 6, 1);
            sprite.position.set(0, 12, 0); group.add(sprite);
          }
          return group;
        }}
      />
    </div>
  );
}
