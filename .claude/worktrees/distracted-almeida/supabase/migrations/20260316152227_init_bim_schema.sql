-- Supabase Schema for BIM Asset Management (Migration)

-- Enable extension if needed (Supabase usually has this but to be safe)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Buildings
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL -- e.g., 'AR15'
);

-- 2. Floors
CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(building_id, floor_number)
);

-- 3. Rooms
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID REFERENCES floors(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL, -- e.g., 'rm-101'
    name TEXT NOT NULL,
    UNIQUE(floor_id, room_id)
);

-- 4. Assets
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    asset_id TEXT UNIQUE, -- e.g., 'สถ.2568-1109'
    type_id TEXT, -- e.g., 'LF-1'
    type_name TEXT,
    category TEXT, -- 'LF', 'BF', 'FCU', 'CDU', etc.
    status TEXT DEFAULT 'Normal',
    brand TEXT,
    model TEXT,
    install_date DATE,
    last_service DATE,
    next_service DATE,
    metadata JSONB DEFAULT '{}'::jsonb -- For extra fields like 'sale', 'tel'
);

-- 5. Maintenance Logs
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    issue TEXT NOT NULL,
    reporter TEXT,
    status TEXT CHECK (status IN ('Completed', 'Pending', 'In Progress')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (SELECT only)
CREATE POLICY "Public Read Access" ON buildings FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON floors FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON rooms FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON assets FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON maintenance_logs FOR SELECT USING (true);
