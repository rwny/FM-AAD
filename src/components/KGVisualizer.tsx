import { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { supabase } from '../utils/supabase';

export function KGVisualizer() {
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    // Handle Window Resize
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    // Fetch Data from Supabase
    async function fetchData() {
      try {
        const { data: nodesData } = await supabase.from('kg_nodes').select('id, name, type');
        const { data: edgesData } = await supabase.from('kg_edges').select('subject_id, object_id, predicate');
        
        if (nodesData && edgesData) {
          const nodes = nodesData.map((n: any) => ({
            id: n.id,
            name: n.name,
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

  return (
    <div className="absolute inset-0 bg-slate-900 overflow-hidden cursor-crosshair">
      {/* Overlay UI */}
      <div className="absolute top-6 left-24 z-10 text-white pointer-events-none">
        <h2 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Knowledge Graph Explorer
        </h2>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Visualizing {graphData.nodes.length} nodes and {graphData.links.length} relationships
        </p>
        
        <div className="mt-6 flex flex-col gap-3 text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-white/5 p-4 rounded-2xl border border-white/10 inline-block">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-[#f43f5e] shadow-[0_0_15px_rgba(244,63,94,0.5)]"></span> 
            <span>Building</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.5)]"></span> 
            <span>Floor</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.5)]"></span> 
            <span>Room</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span> 
            <span>AC Unit</span>
          </div>
        </div>
      </div>

      <div className="w-full h-full">
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          linkColor={() => 'rgba(255,255,255,0.15)'}
          nodeRelSize={6}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            if (node.x === undefined || node.y === undefined) return;
            const label = node.name || '';
            const fontSize = 12/globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            
            // Draw circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val || 5, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color || '#fff';
            ctx.fill();
            
            // Outer glow effect
            ctx.shadowColor = node.color || '#fff';
            ctx.shadowBlur = 10 / globalScale;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillText(label, node.x, node.y + (node.val || 5) + (fontSize));
          }}
        />
      </div>
{/* 
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} /> */}
    </div>
  );
}
