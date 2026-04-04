import { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { supabase } from '../utils/supabase';


export function KGVisualizer() {
  const fgRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [focusedNode, setFocusedNode] = useState<any | null>(null);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);

    async function fetchData() {
      try {
        const { data: nodesData } = await supabase.from('kg_nodes').select('id, name, type, metadata');
        const { data: edgesData } = await supabase.from('kg_edges').select('subject_id, object_id, predicate');
        
        if (nodesData && edgesData) {
          const nodes = nodesData.map((n: any) => ({
            id: n.id,
            name: n.metadata?.display_name || n.name,
            fullName: n.name,
            val: n.type === 'building' ? 20 : n.type === 'floor' ? 15 : n.type === 'room' ? 10 : 5,
            color: n.type === 'building' ? '#f43f5e' : n.type === 'floor' ? '#8b5cf6' : n.type === 'room' ? '#3b82f6' : '#10b981',
            type: n.type
          }));
          
          const links = edgesData.map((e: any) => ({
            source: e.subject_id,
            target: e.object_id,
            name: e.predicate
          }));
          
          setGraphData({ nodes, links });
        }
      } catch (err) {
        console.error('Failed to load KG:', err);
      }
    }
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNodeClick = (node: any) => {
    setFocusedNode(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(2.5, 1000);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950 overflow-hidden cursor-crosshair">
      {/* Overlay UI */}
      <div className="absolute top-6 left-24 z-10 text-white pointer-events-none select-none">
        <h2 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Knowledge Graph Explorer
        </h2>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Visualizing {graphData.nodes.length} nodes and {graphData.links.length} relationships
        </p>
      </div>



      {/* LEGEND */}
      <div className="absolute bottom-8 left-8 z-10 flex flex-col gap-3 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md bg-white/5 p-5 rounded-3xl border border-white/10 select-none">
        {[
          { color: '#f43f5e', label: 'Building' },
          { color: '#8b5cf6', label: 'Floor' },
          { color: '#3b82f6', label: 'Room' },
          { color: '#10b981', label: 'AC/Assets' }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: item.color }} />
            <span className="text-slate-300">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="w-full h-full">
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          linkColor={() => 'rgba(255,255,255,0.08)'}
          nodeRelSize={6}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={0.003}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            if (node.x === undefined || node.y === undefined) return;
            const label = node.name || '';
            const fontSize = 11/globalScale;
            const size = node.val || 5;
            
            // --- TACTICAL MARK (FOCUS EFFECT) ---
            if (focusedNode && focusedNode.id === node.id) {
              const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
              ctx.beginPath();
              ctx.arc(node.x, node.y, size * (1.5 + pulse * 0.5), 0, 2 * Math.PI, false);
              ctx.strokeStyle = '#f43f5e';
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
              
              // Crosshair effect
              const crossSize = size * 2.5;
              ctx.beginPath();
              ctx.moveTo(node.x - crossSize, node.y); ctx.lineTo(node.x + crossSize, node.y);
              ctx.moveTo(node.x, node.y - crossSize); ctx.lineTo(node.x, node.y + crossSize);
              ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
              ctx.stroke();
            }

            // Draw core circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color || '#fff';
            ctx.fill();
            
            // Glow
            ctx.shadowColor = node.color || '#fff';
            ctx.shadowBlur = (focusedNode?.id === node.id ? 20 : 10) / globalScale;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw text
            ctx.font = `${fontSize}px "Inter", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = focusedNode?.id === node.id ? '#fff' : 'rgba(255,255,255,0.6)';
            ctx.fillText(label, node.x, node.y + size + (fontSize * 1.5));
          }}
          onNodeClick={(node) => handleNodeClick(node)}
        />
      </div>
    </div>
  );
}
