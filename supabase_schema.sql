-- Supabase Schema for BIM Asset Management

-- 1. Buildings
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL -- e.g., 'AR15'
);

-- 2. Floors
CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(building_id, floor_number)
);

-- 3. Rooms
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_id UUID REFERENCES floors(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL, -- e.g., 'rm-101'
    name TEXT NOT NULL,
    UNIQUE(floor_id, room_id)
);

-- 4. Assets
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    issue TEXT NOT NULL,
    reporter TEXT,
    contractor TEXT, -- e.g., 'ModernForm Service Team'
    status TEXT CHECK (status IN ('Completed', 'Pending', 'In Progress')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - Optional but recommended
-- ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (for now)
-- CREATE POLICY "Public Read Access" ON buildings FOR SELECT USING (true);
-- CREATE POLICY "Public Read Access" ON floors FOR SELECT USING (true);
-- CREATE POLICY "Public Read Access" ON rooms FOR SELECT USING (true);
-- CREATE POLICY "Public Read Access" ON assets FOR SELECT USING (true);
-- CREATE POLICY "Public Read Access" ON maintenance_logs FOR SELECT USING (true);
