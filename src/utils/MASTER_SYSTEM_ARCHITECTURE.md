# 🏛️ MASTER SYSTEM ARCHITECTURE: BIM-FM Knowledge Graph
## (The Authoritative Data Pipeline & System Blueprint)

เอกสารฉบับนี้คือ **"คัมภีร์หลัก" (Master Blueprint)** ของโครงการ Digital Twin (AR15) จัดทำขึ้นเพื่อบันทึกความสำเร็จ และ **อธิบายกลไกหัวใจสำคัญของระบบ** นั่นคือ "เส้นทางการไหลของข้อมูล" (Data Pipeline) ตั้งแต่ผู้ใช้อัปเดตข้อมูลแบบ Text ไปจนถึงการแสดงผลบน 3D และ Dashboard

การวางรากฐานข้อมูลที่ชัดเจนและมีกฎเกณฑ์ที่รัดกุม จะช่วยป้องกันไม่ให้ระบบ "พัง" เมื่อโครงการขยายตัว (Scale-up) ในอนาคต

---

## 📍 1. ความสำเร็จล่าสุด (Latest Milestones)

1. **System-Centric Architecture (v0.3.2):**
   - เปลี่ยนมุมมองการบริหารจัดการจาก "รายชิ้นส่วน" เป็น **"รายระบบ" (System-based)** เช่น จัดกลุ่ม FCU และ CDU ให้อยู่ภายใต้ `AC-101-1`
   - พัฒนา **Life Cycle Timeline (3 Years)**: แถบประวัติแบบ Visual ย้อนหลัง 3 ปี แสดงสัดส่วนอายุการใช้งานจริง พร้อมจุด Diamond สีเขียวระบุวันติดตั้ง
   - **Chronological History:** ระบบประวัติการซ่อมบำรุงแบบตารางเดียว เรียงตามลำดับเวลาจริง (Oldest to Newest) และแยกแยะชิ้นส่วน (Component-aware)

2. **Automated Database Synchronization:**
   - พัฒนาสคริปต์ `sync-ac-to-supabase.cjs` (Node.js) สำหรับการสกัดข้อมูล Hierarchy และ Metadata จาก Markdown เข้าสู่ Supabase `kg_nodes` และ `kg_edges` โดยตรง
   - **DB-First Priority:** ปรับปรุงแอปพลิเคชันให้เชื่อถือข้อมูลจาก Live Database เป็นอันดับ 1 เพื่อความเป็น Digital Twin ที่แท้จริง

3. **3D Intelligence & User Experience:**
   - **Peer Highlighting:** เมื่อเลือก FCU ระบบจะ Highlight CDU คู่ของมันโดยอัตโนมัติ (และในทางกลับกัน)
   - **Selection Outlines:** เพิ่มระบบกรองแสงรอบวัตถุ (Blender-style Outline) เพื่อระบุตำแหน่งวัตถุที่ถูกเลือกได้ชัดเจน
   - **Contextual Sidebar:** นำ Timeline และปุ่ม History เข้าไปฝังใน Sidebar ของหน้า 3D เพื่อการตรวจสอบประวัติแบบ Real-time

---

## ⚙️ 2. หัวใจของโครงการ: เส้นทางการไหลของข้อมูล (Data Pipeline)

### 🔄 The Pipeline Flow:
`AR15-DATA.md` (Source) ➡️ `Sync Script` (Engine) ➡️ `Supabase` (Live DB) ➡️ `App.tsx` (3D/Web)

1. **Source of Truth (`AR15-DATA.md`):** ใช้ระบบ Indentation แสดงลำดับชั้น และ `{}` สำหรับเก็บ Metadata (เช่น `InstallDate`, `ConnectsTo`)
2. **The Engine (`scripts/sync-ac-to-supabase.cjs`):** ทำหน้าที่ Parsing, Categorization และสร้างความสัมพันธ์ข้ามระบบ (Edges) ขึ้นสู่ Cloud
3. **Visualization Logic:**
   - **Aggregated Health:** สุขภาพของระบบแม่ ตัดสินจากชิ้นส่วนที่แย่ที่สุด (Red > Orange > Green)
   - **Status Propagation:** สีของวัตถุใน 3D จะสะท้อนสถานะล่าสุดจาก Database เสมอ
   - **Data Export:** รองรับการคัดลอกข้อมูล (Copy) และการส่งออก CSV เพื่อการทำรายงานภายนอก

---

## 🛡️ 3. กฎทองคำเพื่อป้องกันระบบพัง (Golden Rules for Scale-up)

เมื่อโครงการนี้ขยายไปสู่ระบบไฟฟ้า (EE) สุขาภิบาล (SN) หรือเพิ่มอาคารใหม่ ให้ยึดหลักการเหล่านี้:

1. **ห้ามเปลี่ยน Naming Convention กลางคัน:** สคริปต์ Sync ยึดติดกับชื่อ Prefix (`AC-`, `FCU-`, `PIPE-`) หากจะเพิ่มระบบใหม่ **ต้องไปเพิ่มเงื่อนไขใน Parser เสมอ**
2. **Indentation is King:** ในไฟล์ `.md` ย่อหน้าผิด = ความสัมพันธ์ผิด การย่อหน้าต้องสม่ำเสมอ (แนะนำให้ใช้ 4 Spaces)
3. **ห้ามเปลี่ยนชื่อ Node (`name`) มั่วซั่ว:** ชื่อคือ Primary Key ในฐานข้อมูล หากแก้ไขชื่อใน `.md` ระบบจะมองว่าเป็น Node ใหม่ทันที
4. **Metadata Keys ต้องมาตรฐาน:** `InstallDate`, `Type`, `AssetID`, `ConnectsTo` คือคำสงวน ห้ามสะกดผิดเด็ดขาด

---
*บันทึกเวอร์ชันล่าสุด: 3 เมษายน 2026 (System-Centric & 3D Intelligence Update)*
