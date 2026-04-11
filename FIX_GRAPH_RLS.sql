-- ---------------------------------------------------------
-- FIX: Knowledge Graph RLS (Always True)
-- ---------------------------------------------------------
-- วิธีใช้: Copy ข้อความทั้งหมดในไฟล์นี้ ไปรันใน SQL Editor ของ Supabase Dashboard
-- ---------------------------------------------------------

-- 1. เปิดใช้งาน RLS (Row Level Security) สำหรับตารางกราฟ
ALTER TABLE kg_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_edges ENABLE ROW LEVEL SECURITY;

-- 2. ลบ Policy เก่าออกก่อน (เพื่อป้องกัน Error ตอนสร้างใหม่)
DROP POLICY IF EXISTS "Public Read Access" ON kg_nodes;
DROP POLICY IF EXISTS "Public Read Access" ON kg_edges;

-- 3. สร้าง Policy ใหม่แบบ "Always True" (USING true)
-- เพื่อให้ Anon Key (ที่แอปใช้) สามารถดึงข้อมูลไปโชว์ในกราฟได้
CREATE POLICY "Public Read Access" ON kg_nodes FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON kg_edges FOR SELECT USING (true);

-- 4. (ทางเลือก) เปิดให้ Insert ได้ด้วย (ถ้าแอปมีการเขียนข้อมูลลงกราฟ)
DROP POLICY IF EXISTS "Public Insert Access" ON kg_nodes;
DROP POLICY IF EXISTS "Public Insert Access" ON kg_edges;
CREATE POLICY "Public Insert Access" ON kg_nodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Access" ON kg_edges FOR INSERT WITH CHECK (true);

-- 5. สั่งให้ PostgREST รีโหลด Schema Cache ทันที
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------
-- ✅ เสร็จเรียบร้อย! ลอง Refresh หน้าเว็บแอปดูครับ
-- ---------------------------------------------------------
