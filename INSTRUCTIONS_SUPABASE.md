# 🌐 Supabase Database Setup Guide

คู่มือการตั้งค่าฐานข้อมูล Supabase สำหรับโปรเจกต์ FM_AR15

---

## 1. สร้าง Table ใน Supabase
Copy SQL ด้านล่างนี้ไปรันใน **SQL Editor** ของ Supabase Dashboard:

```sql
-- 1. Buildings
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL
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
    room_id TEXT NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(floor_id, room_id)
);

-- 4. Assets
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    asset_id TEXT UNIQUE,
    type_id TEXT,
    type_name TEXT,
    category TEXT,
    status TEXT DEFAULT 'Normal',
    brand TEXT,
    model TEXT,
    install_date DATE,
    last_service DATE,
    next_service DATE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 5. Maintenance Logs
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    issue TEXT NOT NULL,
    reporter TEXT,
    status TEXT CHECK (status IN ('Completed', 'Pending', 'In Progress')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2. ตั้งค่า Environment Variables
สร้างหรือแก้ไขไฟล์ `.env` ที่ Root Project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
*(หมายเหตุ: `SUPABASE_SERVICE_ROLE_KEY` ใช้สำหรับรัน Script Seed ข้อมูลเท่านั้น ไม่ควรเปิดเผยในฝั่ง Client)*

---

## 3. Seed ข้อมูลจาก JSON เข้า Database
รันสคริปต์เพื่อนำเข้าข้อมูลจาก `AR15.json` (ที่ได้จาก Markdown):

```bash
# ติดตั้ง dotenv เพื่อรัน script
npm install -D dotenv

# รัน script seed
node scripts/seed-supabase.js
```

---

## 4. ตรวจสอบผลลัพธ์
1. เปิดหน้าเว็บ ระบบจะพยายามดึงข้อมูลจาก Supabase (สังเกตสถานะ **"Live DB"** ที่มุมซ้ายบน)
2. หากเชื่อมต่อไม่ได้ ระบบจะสลับไปใช้ `AR15.json` อัตโนมัติ (**"Local Data"**)

---
*อัปเดต: 16 มีนาคม 2026*
