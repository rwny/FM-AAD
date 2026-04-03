import React, { useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { supabase } from '../utils/supabase';

export function KGVisualizer3D() {
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);

    async function fetchData() {
      try {
        const { data: nodesData } = await supabase.from('kg_nodes').select('id, name, type');
        const { data: edgesData } = await supabase.from('kg_edges').select('subject_id, object_id, predicate');
        
        if (nodesData && edgesData) {
          const nodes = nodesData.map((n: any) => {
            // New High-Contrast Neon Palette
            let color = '#ff00ff'; // Default: L7 (Magenta)
            let val = 4;
            
            const t = n.type.toLowerCase();
            if (t === 'building') { color = '#ff0000'; val = 25; }      // L1: Bright Red
            else if (t === 'floor') { color = '#ff8800'; val = 20; }     // L2: Vivid Orange
            else if (t === 'room') { color = '#ffff00'; val = 15; }      // L3: Electric Yellow
            else if (t === 'system_group') { color = '#00ff00'; val = 12; } // L4: Neon Green
            else if (t === 'ac_set') { color = '#00ffff'; val = 10; }     // L5: Electric Cyan
            else if (t === 'fcu' || t === 'cdu' || t === 'load_panel') { color = '#0066ff'; val = 8; } // L6: Azure Blue
            else if (t === 'pipe') { color = '#aa00ff'; val = 6; }      // L7: Deep Purple

            return {
              id: n.id,
              name: n.name,
              type: n.type,
              val,
              color
            };
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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const legendItems = [
    { id: '1', color: '#ff0000' },
    { id: '2', color: '#ff8800' },
    { id: '3', color: '#ffff00' },
    { id: '4', color: '#00ff00' },
    { id: '5', color: '#00ffff' },
    { id: '6', color: '#0066ff' },
    { id: '7', color: '#aa00ff' },
  ];

  return (
    <div className="absolute inset-0 bg-[#010409] overflow-hidden">
      <div className="absolute top-6 left-24 z-10 text-white pointer-events-none">
        <h2 className="text-3xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
          3D Knowledge Graph
        </h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">
          High-Contrast Hierarchical BIM Intel
        </p>
      </div>

      {/* Horizontal Sequential Legend with High Contrast */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 bg-black/40 backdrop-blur-2xl px-10 py-5 rounded-full border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {legendItems.map((item, idx) => (
          <React.Fragment key={item.id}>
            <div className="flex flex-col items-center group cursor-default">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black text-black shadow-lg transition-all duration-300 group-hover:scale-125" 
                style={{ 
                  backgroundColor: item.color, 
                  boxShadow: `0 0 25px ${item.color}88`,
                  border: '3px solid rgba(255,255,255,0.3)'
                }}
              >
                {item.id}
              </div>
            </div>
            {idx < legendItems.length - 1 && (
              <div className="text-white/20 font-black text-lg mx-1">
                {'>'}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <ForceGraph3D
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#010409"
        nodeColor={(node: any) => node.color}
        nodeRelSize={1.5}
        nodeLabel={(node: any) => `${node.name} (${node.type})`}
        linkDirectionalParticles={6}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={(link: any) => {
          const sourceNode = graphData.nodes.find(n => n.id === (link.source.id || link.source));
          return sourceNode ? sourceNode.color : '#ffffff';
        }}
        linkWidth={0.8}
        linkOpacity={0.2}
        linkColor={() => 'rgba(255,255,255,0.1)'}
        nodeThreeObjectExtend={true}
        nodeThreeObject={(node: any) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return new THREE.Group();
          const label = node.name || '';
          ctx.font = 'bold 32px sans-serif';
          const textWidth = ctx.measureText(label).width;
          canvas.width = textWidth + 20;
          canvas.height = 40;
          ctx.font = 'bold 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = node.color; // Match text color to node level!
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'black';
          ctx.fillText(label, canvas.width / 2, canvas.height / 2);

          const texture = new THREE.CanvasTexture(canvas);
          texture.minFilter = THREE.LinearFilter;
          const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
          const sprite = new THREE.Sprite(spriteMaterial);
          sprite.scale.set(canvas.width / 6, canvas.height / 6, 1);
          sprite.position.set(0, 12, 0); 
          return sprite;
        }}
      />
    </div>
  );
}
