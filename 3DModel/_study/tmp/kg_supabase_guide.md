# การใช้งาน Supabase สำหรับ Knowledge Graph ในโปรเจกต์นี้

เนื่องจากโปรเจกต์คุณมี **Supabase (PostgreSQL)** อยู่แล้ว คุณสามารถสร้างตารางเพื่อเก็บข้อมูล Knowledge Graph ได้เลยครับ ผมแนะนำให้สร้างตารางแบบ **Nodes & Edges** เพื่อความยืดหยุ่นสูงสุดในการทำ Graph

คุณสามารถ Copy คำสั่ง SQL ด้านล่างนี้ไปรันใน **Supabase SQL Editor** ได้เลยครับ:

### SQL สำหรับสร้างตาราง (Run in Supabase Dashboard)

```sql
-- 1. สร้างตาราง Nodes (เก็บสิ่งของ/สถานที่ เช่น ตึก, ชั้น, ห้อง, แอร์)
CREATE TABLE IF NOT EXISTS kg_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type TEXT, -- เช่น 'building', 'floor', 'room', 'ac'
    metadata JSONB, -- เผื่อไว้เก็บข้อมูลเพิ่มเติม เช่น BTU, สถานะ
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. สร้างตาราง Edges (เก็บความสัมพันธ์ เช่น 'contains', 'powered_by', 'serves')
CREATE TABLE IF NOT EXISTS kg_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES kg_nodes(id) ON DELETE CASCADE,
    predicate TEXT NOT NULL DEFAULT 'contains',
    object_id UUID REFERENCES kg_nodes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- (Optional) สร้าง Index เพื่อให้ Query เร็วขึ้น
CREATE INDEX idx_nodes_name ON kg_nodes(name);
CREATE INDEX idx_edges_subject ON kg_edges(subject_id);
```

---

### วิธีการนำข้อมูลเข้า (Importing Data)

เมื่อรัน SQL ด้านบนแล้ว คุณมี 2 ทางเลือกในการนำข้อมูลจาก `ac.md` เข้า Supabase:

1.  **ใช้ Script Python:** ปรับแต่งไฟล์ `migrate_to_supabase.py` (เดี๋ยวผมเขียนให้) โดยใช้ไลบรารี `vecs` หรือ `supabase-py`
2.  **ใช้ Dashboard:** Export ข้อมูลจาก JSON เป็น CSV แล้ว Upload เข้า Table โดยตรง

---

### ข้อดีเมื่อใช้ Supabase แทนไฟล์ JSON:
1.  **Search & Filter:** สามารถเขียน SQL เพื่อหาความสัมพันธ์ที่ซับซ้อนได้ทันที
2.  **Real-time:** หากมีการอัปเดตสถานะของแอร์ (เช่น แอร์เสีย) หน้าเว็บ React ของคุณจะได้รับการแจ้งเตือนทันที
3.  **Scalability:** รองรับข้อมูลได้มหาศาล และเชื่อมต่อกับระบบ Login (RLS) ได้

**คุณต้องการให้ผมเขียน Python Script สำหรับยิงข้อมูลจาก `ac.md` เข้าสู่ Supabase โดยตรงเลยไหมครับ?** (ใช้ URL และ Service Key จากไฟล์ `.env` ของคุณ)
