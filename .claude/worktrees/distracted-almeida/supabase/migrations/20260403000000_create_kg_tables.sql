-- Knowledge Graph Tables for BIM/FM

-- 1. Nodes Table
CREATE TABLE IF NOT EXISTS kg_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- e.g., 'fcu-101-1'
    type TEXT NOT NULL, -- 'building', 'floor', 'room', 'ac_set', 'fcu', 'cdu', 'pipe', 'load_panel'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Edges Table (Relationships)
CREATE TABLE IF NOT EXISTS kg_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES kg_nodes(id) ON DELETE CASCADE,
    predicate TEXT NOT NULL, -- 'contains', 'connectsTo'
    object_id UUID REFERENCES kg_nodes(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_id, predicate, object_id)
);

-- Enable RLS
ALTER TABLE kg_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_edges ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public Read Access" ON kg_nodes FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON kg_edges FOR SELECT USING (true);
