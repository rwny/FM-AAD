import { useEffect, useState } from 'react';
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
          const nodes = nodesData.map((n: any) => ({
            id: n.id,
            name: n.name,
            val: n.type === 'building' ? 20 : n.type === 'floor' ? 15 : n.type === 'room' ? 10 : 5,
            color: n.type === 'building' ? '#f43f5e' : n.type === 'floor' ? '#8b5cf6' : n.type === 'room' ? '#3b82f6' : '#10b981',
          }));
          
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

  return (
    <div className="absolute inset-0 bg-[#020617] overflow-hidden">
      <div className="absolute top-6 left-24 z-10 text-white pointer-events-none">
        <h2 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          3D Knowledge Graph
        </h2>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Visualizing BIM relationships in 3D Space
        </p>
      </div>

      <ForceGraph3D
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#020617"
        nodeAutoColorBy="group"
        linkDirectionalParticles={4}
        linkDirectionalParticleSpeed={0.005}
        linkWidth={0.5}
        linkOpacity={0.4}
        linkColor={() => 'rgba(255,255,255,0.4)'}
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
