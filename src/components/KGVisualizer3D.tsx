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
            let color = '#64748b'; // Default: L7
            let val = 4;
            
            const t = n.type.toLowerCase();
            if (t === 'building') { color = '#f43f5e'; val = 22; } // L1: Rose
            else if (t === 'floor') { color = '#f59e0b'; val = 18; } // L2: Amber
            else if (t === 'room') { color = '#fbbf24'; val = 14; } // L3: Yellow
            else if (t === 'system_group') { color = '#10b981'; val = 11; } // L4: Emerald
            else if (t === 'ac_set') { color = '#06b6d4'; val = 9; } // L5: Cyan
            else if (t === 'fcu' || t === 'cdu' || t === 'load_panel') { color = '#3b82f6'; val = 7; } // L6: Blue
            else if (t === 'pipe') { color = '#8b5cf6'; val = 5; } // L7: Violet

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
    { id: '1', color: '#f43f5e' },
    { id: '2', color: '#f59e0b' },
    { id: '3', color: '#fbbf24' },
    { id: '4', color: '#10b981' },
    { id: '5', color: '#06b6d4' },
    { id: '6', color: '#3b82f6' },
    { id: '7', color: '#8b5cf6' },
  ];

  return (
    <div className="absolute inset-0 bg-[#020617] overflow-hidden">
      <div className="absolute top-6 left-24 z-10 text-white pointer-events-none">
        <h2 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          3D Knowledge Graph
        </h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1 opacity-60">
          7-Level Hierarchical BIM Intelligence
        </p>
      </div>

      {/* Horizontal Sequential Legend */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 bg-slate-900/60 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {legendItems.map((item, idx) => (
          <React.Fragment key={item.id}>
            <div className="flex flex-col items-center group cursor-default">
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-lg transition-all duration-300 group-hover:scale-125" 
                style={{ 
                  backgroundColor: item.color, 
                  boxShadow: `0 0 20px ${item.color}66`,
                  border: '2px solid rgba(255,255,255,0.2)'
                }}
              >
                {item.id}
              </div>
            </div>
            {idx < legendItems.length - 1 && (
              <div className="text-slate-600 font-black text-sm mx-1 opacity-40">
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
        backgroundColor="#020617"
        nodeColor={(node: any) => node.color}
        nodeLabel={(node: any) => `${node.name} (${node.type})`}
        linkDirectionalParticles={4}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={(link: any) => {
          // Match particle color to source node's hierarchy level
          const sourceNode = graphData.nodes.find(n => n.id === (link.source.id || link.source));
          return sourceNode ? sourceNode.color : '#ffffff';
        }}
        linkWidth={0.5}
        linkOpacity={0.4}
        linkColor={() => 'rgba(255,255,255,0.2)'}
        nodeThreeObjectExtend={true}
        nodeThreeObject={(node: any) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return new THREE.Group();
          const label = node.name || '';
          ctx.font = '28px sans-serif';
          const textWidth = ctx.measureText(label).width;
          canvas.width = textWidth + 16;
          canvas.height = 36;
          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(label, canvas.width / 2, canvas.height / 2);

          const texture = new THREE.CanvasTexture(canvas);
          texture.minFilter = THREE.LinearFilter;
          const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
          const sprite = new THREE.Sprite(spriteMaterial);
          sprite.scale.set(canvas.width / 5, canvas.height / 5, 1);
          sprite.position.set(0, 10, 0); // Offset text above the node
          return sprite;
        }}
      />
    </div>
  );
}
