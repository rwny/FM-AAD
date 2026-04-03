import React, { useEffect, useState, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { 
  RotateCw, Pause
} from 'lucide-react';
import { supabase } from '../utils/supabase';

export function KGVisualizer3D() {
  const fgRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [highlightLevel, setHighlightLevel] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isFading, setIsFading] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const fadeTimeoutRef = useRef<any>(null);
  const streamIntervalRef = useRef<any>(null);

  // Animation Loop for Rotation and Tactical Marks
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      if (fgRef.current) {
        const scene = fgRef.current.scene();
        
        // 1. Handle Graph Group Rotation
        if (isRotating) {
          const graphGroup = scene.children.find((child: any) => child.type === 'Group');
          if (graphGroup) {
            graphGroup.rotation.y += 0.0025; 
          }
        }

        // 2. Handle Tactical Radar Animations
        if (highlightLevel) {
          scene.traverse((obj: any) => {
            if (obj.name === 'radarMark') {
              obj.rotation.z += 0.02; // Rotate crosshair
              const pulse = 15 + Math.sin(Date.now() * 0.008) * 2; // Subtle breathing effect
              obj.scale.set(pulse, pulse, 1);
            }
          });
        }
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isRotating, highlightLevel]);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);

    async function fetchData() {
      try {
        const { data: nodesData } = await supabase.from('kg_nodes').select('id, name, type');
        const { data: edgesData } = await supabase.from('kg_edges').select('subject_id, object_id, predicate');
        
        if (nodesData && edgesData) {
          const nodes = nodesData.map((n: any) => {
            let color = '#64748b'; 
            let level = '7';
            let val = 4;
            
            const t = n.type.toLowerCase();
            if (t === 'building') { color = '#ff0000'; val = 25; level = '1'; }
            else if (t === 'floor') { color = '#ff8800'; val = 20; level = '2'; }
            else if (t === 'room') { color = '#ffff00'; val = 15; level = '3'; }
            else if (t === 'system_group') { color = '#00ff00'; val = 12; level = '4'; }
            else if (t === 'ac_set') { color = '#0ea5e9'; val = 10; level = '5'; }
            else if (t === 'fcu' || t === 'cdu' || t === 'load_panel') { color = '#0066ff'; val = 8; level = '6'; }
            else if (t === 'pipe') { color = '#444444'; val = 6; level = '7'; }

            return { id: n.id, name: n.name, type: n.type, level, val, color };
          });
          
          const links = edgesData.map((e: any) => ({
            source: e.subject_id,
            target: e.object_id,
            name: e.predicate
          }));
          setGraphData({ nodes, links });
        }
      } catch (err) {
        console.error('Failed to load KG 3D:', err);
      }
    }
    fetchData();
    return () => {
      window.removeEventListener('resize', handleResize);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  const toggleRotation = () => {
    const nextState = !isRotating;
    setIsRotating(nextState);
    const statusMsg = nextState ? "OBJECT_ROTATION_START" : "OBJECT_ROTATION_STOP";
    setTerminalLogs(prev => [`[SYSTEM] ${statusMsg}`, ...prev].slice(0, 20));
  };

  const triggerHighlight = (level: string) => {
    setHighlightLevel(level);
    setIsFading(false);
    setTerminalLogs([]);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

    const levelNodes = graphData.nodes.filter(n => n.level === level);
    const logsToStream = [
      `[SYSTEM] INITIATING DEEP SCAN: L${level}`,
      `[PROCESS] LOCATING ALL HIERARCHY NODES...`,
      `------------------------------------------`,
      ...levelNodes.map(n => `DATA_LINK: ${n.name.toUpperCase()} [${n.type.toUpperCase()}]`),
      `------------------------------------------`,
      `[INFO] ${levelNodes.length} NODES IDENTIFIED IN SCOPE.`,
      `[SUCCESS] SCAN_LEVEL_0${level}_COMPLETE`
    ];

    let currentIdx = 0;
    streamIntervalRef.current = setInterval(() => {
      if (currentIdx < logsToStream.length) {
        setTerminalLogs(prev => [...prev, logsToStream[currentIdx]].slice(-25));
        currentIdx++;
      } else {
        clearInterval(streamIntervalRef.current);
        fadeTimeoutRef.current = setTimeout(() => {
          setIsFading(true);
          fadeTimeoutRef.current = setTimeout(() => {
            setTerminalLogs([]);
            setHighlightLevel(null);
          }, 1000);
        }, 4500);
      }
    }, 40);
  };

  const legendItems = [
    { id: '1', color: '#ff0000' },
    { id: '2', color: '#ff8800' },
    { id: '3', color: '#ffff00' },
    { id: '4', color: '#00ff00' },
    { id: '5', color: '#0ea5e9' },
    { id: '6', color: '#0066ff' },
    { id: '7', color: '#444444' },
  ];

  return (
    <div className="absolute inset-0 bg-[#010409] overflow-hidden">
      <div className="absolute top-8 left-24 z-10 text-white pointer-events-none flex flex-col gap-0.5">
        <h2 className="text-3xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          AR15 ASSET TOPOLOGY
        </h2>
        <p className="text-white text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-4">
          Hierarchical Infrastructure Intelligence
        </p>

        <div className={`flex flex-col gap-0.5 font-mono text-[9px] text-white tracking-tight leading-none transition-all duration-1000 ${isFading ? 'opacity-0 translate-y-[-10px]' : 'opacity-80'}`}>
          {terminalLogs.map((log, i) => (
            <div key={i} className="animate-in fade-in slide-in-from-left-1 duration-150">
              <span className="opacity-30 mr-2">::</span>{log}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-8 right-8 z-20 flex gap-2">
        <button 
          onClick={toggleRotation}
          className={`p-3 rounded-xl border backdrop-blur-xl transition-all shadow-2xl flex items-center gap-2 group ${isRotating ? 'bg-[#00f2ff]/20 border-[#00f2ff]/50 text-[#00f2ff]' : 'bg-black/40 border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}
        >
          {isRotating ? <Pause className="w-5 h-5 animate-pulse" /> : <RotateCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{isRotating ? "Rotating" : "Idle"}</span>
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 bg-black/40 backdrop-blur-2xl px-10 py-5 rounded-full border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {legendItems.map((item, idx) => (
          <React.Fragment key={item.id}>
            <button onClick={() => triggerHighlight(item.id)} className="flex flex-col items-center group relative outline-none">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black shadow-lg transition-all duration-300 ${highlightLevel === item.id ? 'scale-125 brightness-150 animate-pulse' : 'hover:scale-125'}`} 
                style={{ backgroundColor: item.color, color: '#000', boxShadow: `0 0 25px ${item.color}88`, border: highlightLevel === item.id ? '3px solid #ffffff' : '3px solid rgba(255,255,255,0.3)' }}
              >
                {item.id}
              </div>
            </button>
            {idx < legendItems.length - 1 && <div className="text-white/20 font-black text-lg mx-1">{'>'}</div>}
          </React.Fragment>
        ))}
      </div>

      <ForceGraph3D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#010409"
        nodeColor={(node: any) => highlightLevel && node.level === highlightLevel ? '#ffffff' : node.color}
        nodeRelSize={1.5}
        nodeResolution={24}
        nodeLabel={(node: any) => `${node.name} (${node.type})`}
        nodeVal={(node: any) => highlightLevel && node.level === highlightLevel ? node.val * 3 : node.val}
        linkDirectionalParticles={8}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={(link: any) => {
          const sourceNode = graphData.nodes.find(n => n.id === (link.source.id || link.source));
          if (highlightLevel && sourceNode?.level === highlightLevel) return '#ffffff';
          return sourceNode ? sourceNode.color : '#ffffff';
        }}
        linkWidth={1.2}
        linkOpacity={0.2}
        linkColor={() => 'rgba(255,255,255,0.1)'}
        nodeThreeObjectExtend={true}
        nodeThreeObject={(node: any) => {
          const group = new THREE.Group();
          if (highlightLevel && node.level === highlightLevel) {
            const radarCanvas = document.createElement('canvas');
            radarCanvas.width = 128; radarCanvas.height = 128;
            const rCtx = radarCanvas.getContext('2d');
            if (rCtx) {
              rCtx.strokeStyle = '#ffffff'; rCtx.lineWidth = 6;
              const size = 30; const pad = 20;
              rCtx.beginPath(); rCtx.moveTo(pad, pad+size); rCtx.lineTo(pad, pad); rCtx.lineTo(pad+size, pad); rCtx.stroke();
              rCtx.beginPath(); rCtx.moveTo(128-pad-size, pad); rCtx.lineTo(128-pad, pad); rCtx.lineTo(128-pad, pad+size); rCtx.stroke();
              rCtx.beginPath(); rCtx.moveTo(pad, 128-pad-size); rCtx.lineTo(pad, 128-pad); rCtx.lineTo(pad+size, 128-pad); rCtx.stroke();
              rCtx.beginPath(); rCtx.moveTo(128-pad-size, 128-pad); rCtx.lineTo(128-pad, 128-pad); rCtx.lineTo(128-pad, 128-pad-size); rCtx.stroke();
              const radarTexture = new THREE.CanvasTexture(radarCanvas);
              const radarMaterial = new THREE.SpriteMaterial({ map: radarTexture, transparent: true, opacity: 0.6 });
              const radarSprite = new THREE.Sprite(radarMaterial);
              radarSprite.name = 'radarMark';
              radarSprite.scale.set(15, 15, 1);
              group.add(radarSprite);
            }
          }
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const label = node.name || '';
            ctx.font = 'bold 32px sans-serif';
            const textWidth = ctx.measureText(label).width;
            canvas.width = textWidth + 20; canvas.height = 40;
            ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = (highlightLevel && node.level === highlightLevel) ? '#ffffff' : node.color;
            ctx.shadowBlur = 8; ctx.shadowColor = 'black';
            ctx.fillText(label, canvas.width / 2, canvas.height / 2);
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(canvas.width / 6, canvas.height / 6, 1);
            sprite.position.set(0, 12, 0); 
            group.add(sprite);
          }
          return group;
        }}
      />
    </div>
  );
}
