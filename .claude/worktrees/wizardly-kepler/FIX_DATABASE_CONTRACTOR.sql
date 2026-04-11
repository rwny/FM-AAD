-- ---------------------------------------------------------
-- FIX: Missing 'contractor' column and 'Faulty' status
-- ---------------------------------------------------------
-- วิธีใช้: Copy ข้อความทั้งหมดในไฟล์นี้ ไปรันใน SQL Editor ของ Supabase Dashboard
-- ---------------------------------------------------------

-- 1. เพิ่มคอลัมน์ contractor ในตาราง logs (ถ้ายังไม่มี)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ac_maintenance_logs' AND column_name='contractor') THEN
        ALTER TABLE ac_maintenance_logs ADD COLUMN contractor TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maintenance_logs' AND column_name='contractor') THEN
        ALTER TABLE maintenance_logs ADD COLUMN contractor TEXT;
    END IF;
END $$;

-- 2. อัปเดตเงื่อนไข Status ให้รองรับ 'Faulty' (เพื่อให้กด Save ได้ไม่ Error)
ALTER TABLE ac_maintenance_logs DROP CONSTRAINT IF EXISTS ac_maintenance_logs_status_check;
ALTER TABLE ac_maintenance_logs ADD CONSTRAINT ac_maintenance_logs_status_check 
    CHECK (status IN ('Completed', 'Pending', 'In Progress', 'Faulty'));

ALTER TABLE maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_status_check;
ALTER TABLE maintenance_logs ADD CONSTRAINT maintenance_logs_status_check 
    CHECK (status IN ('Completed', 'Pending', 'In Progress', 'Faulty'));

-- 3. สร้างตาราง ac_assets (ถ้ายังไม่มี) เพื่อรองรับระบบ AC Mode
CREATE TABLE IF NOT EXISTS ac_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obj_name TEXT UNIQUE,
    ar_id TEXT UNIQUE,
    brand TEXT,
    install_date DATE,
    log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ตั้งค่า Security (RLS)
ALTER TABLE ac_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_maintenance_logs ENABLE ROW LEVEL SECURITY;

-- ลบ Policy เก่า (ถ้ามี) เพื่อป้องกัน Error ตอนสร้างใหม่
DROP POLICY IF EXISTS "Public Read Access" ON ac_assets;
DROP POLICY IF EXISTS "Public Insert Access" ON ac_assets;
DROP POLICY IF EXISTS "Public Read Access" ON ac_maintenance_logs;
DROP POLICY IF EXISTS "Public Insert Access" ON ac_maintenance_logs;
DROP POLICY IF EXISTS "Public Insert Access" ON maintenance_logs;

-- สร้าง Policy ใหม่
CREATE POLICY "Public Read Access" ON ac_assets FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON ac_assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Access" ON ac_maintenance_logs FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON ac_maintenance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Access" ON maintenance_logs FOR INSERT WITH CHECK (true);

-- 5. สั่งให้ PostgREST รีโหลด Schema Cache ทันที
NOTIFY pgrst, 'reload schema';
