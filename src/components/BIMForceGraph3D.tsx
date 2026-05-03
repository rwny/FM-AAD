import React, { useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';

interface Node {
  id: string;
  name: string;
  group: number;
}

interface Link {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

const BIMForceGraph3D: React.FC = () => {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });

  // à¸ˆà¸³à¸¥à¸­à¸‡à¸à¸²à¸£à¸”à¸¶à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ˆà¸²à¸ Markdown (à¹ƒà¸™à¸‡à¸²à¸™à¸ˆà¸£à¸´à¸‡à¸­à¸²à¸ˆà¸ˆà¸°à¸”à¸¶à¸‡à¸ˆà¸²à¸ API à¸«à¸£à¸·à¸­ JSON à¸—à¸µà¹ˆà¸Ÿà¸­à¸£à¹Œà¹à¸¡à¸•à¹à¸¥à¹‰à¸§)
  useEffect(() => {
    // à¹‚à¸„à¸£à¸‡à¸ªà¸£à¹‰à¸²à¸‡à¸ˆà¸³à¸¥à¸­à¸‡à¸ˆà¸²à¸ FM_BIM_Structure.md
    const rawNodes = [
      { id: 'AAD', name: 'AAD', group: 1 },
      { id: 'AR13', name: 'AR13 Shop à¹„à¸¡à¹‰', group: 2 },
      { id: 'AR15', name: 'AR15 Shop à¸”à¸³', group: 2 },
      { id: 'AR13-L1', name: 'Floor 1 (AR13)', group: 3 },
      { id: 'AR13-R101', name: 'Room 101 (AR13)', group: 4 },
      { id: 'AR13-FURNITURE', name: 'Furniture', group: 5 },
      { id: 'AR13-MEP', name: 'MEP', group: 5 },
      { id: 'AR15-L1', name: 'Floor 1 (AR15)', group: 3 },
      { id: 'AR15-R101', name: 'Room 101 (AR15)', group: 4 },
    ];

    const rawLinks = [
      { source: 'AAD', target: 'AR13' },
      { source: 'AAD', target: 'AR15' },
      { source: 'AR13', target: 'AR13-L1' },
      { source: 'AR13-L1', target: 'AR13-R101' },
      { source: 'AR13-R101', target: 'AR13-FURNITURE' },
      { source: 'AR13-R101', target: 'AR13-MEP' },
      { source: 'AR15', target: 'AR15-L1' },
      { source: 'AR15-L1', target: 'AR15-R101' },
    ];

    setData({ nodes: rawNodes, links: rawLinks });
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <ForceGraph3D
        graphData={data}
        nodeAutoColorBy="group"
        nodeLabel={(node: any) => `${node.name}`}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="#000"
      />
    </div>
  );
};

export default BIMForceGraph3D;





