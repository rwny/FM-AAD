import React, { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { RotateCw, Pause, Target, X } from 'lucide-react';
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
  const fadeTimeoutRef = useRef<any>(null);
  const streamIntervalRef = useRef<any>(null);

  // Auto-expire logs
  useEffect(() => {
    if (terminalLogs.length > 0) {
      const timer = setTimeout(() => {
        setTerminalLogs(prev => prev.slice(1));
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [terminalLogs]);

  const addLog = (text: string) => {
    setTerminalLogs(prev => [...prev, { id: logIdRef.current++, text }].slice(-25));
  };

  const rotationVelocityRef = useRef(0.0025);

  useEffect(() => {
    let frameId: number;
    const animate = () => {
      if (fgRef.current) {
        const scene = fgRef.current.scene();
        const graphGroup = scene.children.find((child: any) => child.type === 'Group');
        if (graphGroup) {
          const targetVelocity = isRotating ? 0.0025 : 0;
          // Smoothly interpolate velocity towards target (roughly 1s to stop)
          rotationVelocityRef.current += (targetVelocity - rotationVelocityRef.current) * 0.05;
          
          if (Math.abs(rotationVelocityRef.current) > 0.00001) {
            graphGroup.rotation.y += rotationVelocityRef.current;
            graphGroup.rotation.x += rotationVelocityRef.current * 0.1;
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
          // ... (node mapping)
          const mappedNodes = nodesData.map((n: any) => {
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
            return { id: n.id, name: displayName, fullName: n.name, type: n.type, level, val, color, metadata: n.metadata };
          });
          const links = edgesData.map((e: any) => ({ source: e.subject_id, target: e.object_id, name: e.predicate }));
          setGraphData({ nodes: mappedNodes, links });

          // Start Live Stream effect
          addLog('[SYSTEM] INITIALIZING TOPOLOGY SCAN...');
          let count = 0;
          streamIntervalRef.current = setInterval(() => {
            if (count < 5) {
              const randomNode = mappedNodes[Math.floor(Math.random() * mappedNodes.length)];
              addLog(`[SCAN] DISCOVERED: ${randomNode.name.toUpperCase()}`);
              count++;
            } else {
              clearInterval(streamIntervalRef.current);
            }
          }, 800);
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

  const handleNodeClick = (node: any) => {
    if (!node) return;
    setFocusedNodeId(node.id);
    setSelectedNode(node);
    addLog(`[TARGET] ACQUIRED: ${node.name.toUpperCase()}`);
    addLog(`[TACTICAL] VECTORING CAMERA TO SOURCE...`);
    
    if (fgRef.current) {
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
  };

  const relatedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set();
    const set = new Set();
    graphData.links.forEach(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      if (sourceId === selectedNode.id) set.add(targetId);
      if (targetId === selectedNode.id) set.add(sourceId);
    });
    return set;
  }, [selectedNode, graphData.links]);

  const toggleRotation = () => {
    setIsRotating(!isRotating);
    addLog(`[SYSTEM] ROTATION: ${!isRotating ? 'ON' : 'OFF'}`);
  };

  const triggerHighlight = (level: string) => {
    setHighlightLevel(level);
    const levelNodes = graphData.nodes.filter(n => n.level === level);
    addLog(`[SCAN] LVL-0${level}: ${levelNodes.length} NODES FOUND`);
    
    // BURST ALL NODES TO TERMINAL
    levelNodes.forEach((n, i) => {
      setTimeout(() => {
        addLog(`[TARGET] ${n.name.toUpperCase()}`);
      }, i * 50); // Fast burst
    });
    
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
        <div className="flex flex-col gap-0.5 font-mono text-[9px] text-[#00f2ff] tracking-tight leading-none opacity-80">
          {terminalLogs.map((log) => (
            <div key={log.id} className="animate-in fade-in slide-out-to-top-2 slide-in-from-left-1 duration-300 h-[11px] flex items-center">
              <span className="opacity-30 mr-2">::</span>{log.text}
            </div>
          ))}
        </div>
      </div>

      {/* TACTICAL DETAIL PANEL (LEFT) */}
      {selectedNode && (
        <div className="absolute top-32 right-8 z-50 w-[360px] bg-black/80 backdrop-blur-3xl border border-[#00f2ff]/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,242,255,0.15)] animate-in slide-in-from-right-4 duration-500 max-h-[70vh] flex flex-col">
          <div className="bg-[#00f2ff]/10 border-b border-[#00f2ff]/20 px-5 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse" />
              <span className="text-[10px] font-black text-[#00f2ff] tracking-[0.2em] uppercase">Tactical Acquisition</span>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-white/40 hover:text-[#00f2ff] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            <div>
              <h3 className="text-[22px] font-black text-white leading-tight tracking-tight uppercase">{selectedNode.name}</h3>
              <p className="text-[10px] font-bold text-[#00f2ff]/60 tracking-widest mt-1 uppercase">{selectedNode.type} // {selectedNode.fullName}</p>
            </div>

            <div className="space-y-3">
              <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Asset Configuration</div>
              <div className="grid grid-cols-1 gap-2">
                {selectedNode.metadata ? Object.entries(selectedNode.metadata).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center py-2.5 px-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-[9px] font-bold text-white/40 uppercase">{key.replace(/_/g, ' ')}</span>
                    <span className="text-[9px] font-black text-[#00f2ff]">{String(val)}</span>
                  </div>
                )) : (
                  <div className="text-[10px] italic text-white/20">NO LOCAL DATA DETECTED</div>
                )}
              </div>
            </div>

            {/* RELATIONSHIPS SECTION */}
            <div className="space-y-3">
              <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Network Topology / Relationships</div>
              <div className="space-y-1.5">
                {(() => {
                  const related = graphData.links.filter(l => 
                    (typeof l.source === 'object' ? l.source.id : l.source) === selectedNode.id || 
                    (typeof l.target === 'object' ? l.target.id : l.target) === selectedNode.id
                  );

                  if (related.length === 0) return <div className="text-[10px] italic text-white/20 py-2">NO ACTIVE LINKS DETECTED</div>;

                  return related.map((link, i) => {
                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                    const isSubject = sourceId === selectedNode.id;
                    const otherNodeId = isSubject ? targetId : sourceId;
                    const otherNode = graphData.nodes.find(n => n.id === otherNodeId);
                    
                    return (
                      <button 
                        key={i} 
                        onClick={() => handleNodeClick(otherNode)}
                        className="w-full flex items-center justify-between p-3 bg-[#00f2ff]/5 hover:bg-[#00f2ff]/10 border border-[#00f2ff]/10 hover:border-[#00f2ff]/30 rounded-xl transition-all group/link"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">{link.name}</span>
                          <span className="text-[11px] font-black text-[#00f2ff] uppercase tracking-tight">{otherNode?.name || otherNodeId}</span>
                        </div>
                        <div className="text-[9px] font-bold text-white/20 uppercase group-hover/link:text-white/60 transition-colors">Vector {'>'}</div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-black/40 border-t border-white/10 shrink-0">
             <button 
                onClick={() => handleNodeClick(selectedNode)}
                className="w-full bg-[#00f2ff] hover:bg-[#00d2ff] text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)] active:scale-95 flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4" /> Recenter Network Vector
              </button>
          </div>
        </div>
      )}

      {/* ROTATION CONTROL (BOTTOM RIGHT) */}
      <div className="absolute bottom-8 right-8 z-50">
        <button onClick={toggleRotation} className={`px-4 py-2.5 rounded-xl border backdrop-blur-xl transition-all shadow-2xl flex items-center justify-center gap-3 group ${isRotating ? 'bg-[#00f2ff]/10 border-[#00f2ff]/30 text-[#00f2ff]' : 'bg-black/40 border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}>
          {isRotating ? <Pause className="w-4 h-4 animate-pulse" /> : <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRotating ? "Active" : "Paused"}</span>
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
        nodeColor={(node: any) => {
          const isSelected = selectedNode?.id === node.id;
          const isRelated = relatedNodeIds.has(node.id);
          if (highlightLevel && node.level === highlightLevel) return '#ffffff';
          if (hoverNodeId === node.id) return '#ffffff';
          if (isSelected) return '#ffffff';
          if (isRelated) return '#00f2ff';
          return node.color;
        }}
        nodeRelSize={1.5} nodeResolution={24} onNodeHover={triggerNodeHover} onNodeClick={handleNodeClick} nodeLabel={(node: any) => `${node.name} (${node.type})`}
        nodeVal={(node: any) => {
          const isSelected = selectedNode?.id === node.id;
          const isRelated = relatedNodeIds.has(node.id);
          if (highlightLevel && node.level === highlightLevel) return node.val * 3;
          if (hoverNodeId === node.id) return node.val * 3;
          if (isSelected) return node.val * 4;
          if (isRelated) return node.val * 2;
          return node.val;
        }}
        linkDirectionalParticles={8} linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={(link: any) => {
          const sourceNode = graphData.nodes.find(n => n.id === (link.source.id || link.source));
          if ((highlightLevel && sourceNode?.level === highlightLevel) || (hoverNodeId === sourceNode?.id) || (focusedNodeId === sourceNode?.id)) return '#ffffff';
          return sourceNode ? sourceNode.color : '#ffffff';
        }}
        linkWidth={1.2} linkOpacity={0.2} linkColor={() => 'rgba(255,255,255,0.1)'} nodeThreeObjectExtend={true}
        nodeThreeObject={(node: any) => {
          const group = new THREE.Group();
          const isTargeted = (highlightLevel && node.level === highlightLevel) || (hoverNodeId === node.id) || (focusedNodeId === node.id) || (selectedNode?.id === node.id);
          
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
