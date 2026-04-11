# 🌐 Supabase Database Setup Guide

คู่มือการตั้งค่าฐานข้อมูล Supabase สำหรับโปรเจกต์ FM_AR15

---

## 1. สร้าง Table ใน Supabase
Copy SQL ด้านล่างนี้ไปรันใน **SQL Editor** ของ Supabase Dashboard ตามลำดับ:

### 1.1 ตารางสำหรับแอร์ (AC Maintenance)
```sql
-- สร้างตารางเก็บ Log ของแอร์โดยเฉพาะ
CREATE TABLE IF NOT EXISTS ac_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id TEXT NOT NULL, -- เก็บ ID เช่น 'fcu-101.1'
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    issue TEXT NOT NULL,
    reporter TEXT,
    contractor TEXT, -- ชื่อบริษัท/ช่างผู้ดำเนินการ
    status TEXT CHECK (status IN ('Completed', 'Pending', 'In Progress', 'Faulty')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่มตัวอย่างข้อมูล
INSERT INTO ac_maintenance_logs (asset_id, issue, status, note, reporter) 
VALUES ('fcu-101.1', 'Initial System Check', 'Completed', 'Ready for use', 'Admin');
```

### 1.2 ตารางอื่นๆ (Furniture & General)
```sql
-- (ใช้โครงสร้างเดิมสำหรับงาน Furniture)
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL
);

-- ... (ตารางอื่นๆ ตาม schema มาตรฐาน)
```

---

## 2. การอัปเดตสถานะ (Maintenance Status)
หากต้องการเพิ่มสถานะใหม่ในอนาคต สามารถรัน SQL นี้เพื่อแก้ไขเงื่อนไข:
```sql
ALTER TABLE ac_maintenance_logs 
DROP CONSTRAINT IF EXISTS ac_maintenance_logs_status_check;

ALTER TABLE ac_maintenance_logs 
ADD CONSTRAINT ac_maintenance_logs_status_check 
CHECK (status IN ('Completed', 'Pending', 'In Progress', 'Faulty'));
```

---

## 3. ตั้งค่า Environment Variables
สร้างหรือแก้ไขไฟล์ `.env` ที่ Root Project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 4. วิธีอัปเดตข้อมูล Spec จาก Markdown
เมื่อมีการแก้ไขไฟล์ `src/utils/AR15-AC-DATA.md` ให้รันคำสั่งนี้เพื่อแปลงข้อมูลเข้าสู่ระบบ:
```bash
node scripts/parse-ac-data.cjs
```

---
*อัปเดตล่าสุด: 17 มีนาคม 2026 (เพิ่มระบบ AC Hybrid Data)*
