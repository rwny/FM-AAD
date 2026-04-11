-- Fix schema for maintenance logs (Add contractor column and Faulty status)

-- 1. Ensure ac_assets table exists (used in AC mode)
CREATE TABLE IF NOT EXISTS ac_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obj_name TEXT UNIQUE,
    ar_id TEXT UNIQUE,
    brand TEXT,
    install_date DATE,
    log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add contractor column if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ac_maintenance_logs' AND column_name='contractor') THEN
        ALTER TABLE ac_maintenance_logs ADD COLUMN contractor TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maintenance_logs' AND column_name='contractor') THEN
        ALTER TABLE maintenance_logs ADD COLUMN contractor TEXT;
    END IF;
END $$;

-- 3. Update status constraints to include 'Faulty'
-- For ac_maintenance_logs
ALTER TABLE ac_maintenance_logs DROP CONSTRAINT IF EXISTS ac_maintenance_logs_status_check;
ALTER TABLE ac_maintenance_logs ADD CONSTRAINT ac_maintenance_logs_status_check 
    CHECK (status IN ('Completed', 'Pending', 'In Progress', 'Faulty'));

-- For maintenance_logs
ALTER TABLE maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_status_check;
ALTER TABLE maintenance_logs ADD CONSTRAINT maintenance_logs_status_check 
    CHECK (status IN ('Completed', 'Pending', 'In Progress', 'Faulty'));

-- 4. Enable RLS and add public access (consistent with other tables)
ALTER TABLE ac_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON ac_assets FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON ac_maintenance_logs FOR SELECT USING (true);

-- Allow public insert for testing/demo purposes (if needed by current logic)
CREATE POLICY "Public Insert Access" ON ac_maintenance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Access" ON maintenance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Access" ON ac_assets FOR INSERT WITH CHECK (true);
