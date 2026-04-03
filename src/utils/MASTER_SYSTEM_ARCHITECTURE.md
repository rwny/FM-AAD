# 🏛️ MASTER SYSTEM ARCHITECTURE: BIM-FM Knowledge Graph
## (The Authoritative Data Pipeline & System Blueprint)

เอกสารฉบับนี้คือ **"คัมภีร์หลัก" (Master Blueprint)** ของโครงการ Digital Twin (AR15) จัดทำขึ้นเพื่อบันทึกความสำเร็จ และ **อธิบายกลไกหัวใจสำคัญของระบบ** นั่นคือ "เส้นทางการไหลของข้อมูล" (Data Pipeline) และสถาปัตยกรรมการแสดงผลเชิงลึก (Visualization Architecture) ตั้งแต่ผู้ใช้อัปเดตข้อมูลแบบ Text ไปจนถึงการแสดงผลบน 3D Knowledge Graph และ Dashboard

การวางรากฐานข้อมูลที่ชัดเจนและมีกฎเกณฑ์ที่รัดกุม จะช่วยป้องกันไม่ให้ระบบ "พัง" เมื่อโครงการขยายตัว (Scale-up) ในอนาคต

---

## 📍 1. ความสำเร็จล่าสุด (Latest Milestones)

1. **System-Centric Architecture (v0.3.2):**
   - เปลี่ยนมุมมองการบริหารจัดการจาก "รายชิ้นส่วน" เป็น **"รายระบบ" (System-based)** เช่น จัดกลุ่ม FCU และ CDU ให้อยู่ภายใต้ `AC-101-1`
   - พัฒนา **Life Cycle Timeline (3 Years)**: แถบประวัติแบบ Visual ย้อนหลัง 3 ปี แสดงสัดส่วนอายุการใช้งานจริง พร้อมจุด Diamond สีเขียวระบุวันติดตั้ง
   - **Chronological History:** ระบบประวัติการซ่อมบำรุงแบบตารางเดียว เรียงตามลำดับเวลาจริง (Oldest to Newest) และแยกแยะชิ้นส่วน (Component-aware) ขจัดข้อมูลที่ซ้ำซ้อนกันอย่างสมบูรณ์

2. **Automated Database Synchronization:**
   - พัฒนาสคริปต์ `sync-ac-to-supabase.cjs` (Node.js) สำหรับการสกัดข้อมูล Hierarchy และ Metadata จาก Markdown เข้าสู่ Supabase `kg_nodes` และ `kg_edges` โดยตรง
   - **DB-First Priority:** ปรับปรุงแอปพลิเคชันให้เชื่อถือข้อมูลจาก Live Database เป็นอันดับ 1 เพื่อความเป็น Digital Twin ที่แท้จริง
   - รองรับ **Virtual Grouping Nodes** (เช่น กลุ่ม `- AC` หรือ `- EE`) ให้ถูกสร้างเป็น Node ประเภท `system_group` อย่างถูกต้องใน Knowledge Graph

3. **AR15 ASSET TOPOLOGY (Advanced 3D Intelligence):**
   - **7-Level Color Hierarchy:** สร้างลำดับชั้นข้อมูล 7 ระดับด้วยคู่สีแบบ **High-Contrast Neon Palette** (แดง -> ส้ม -> เหลือง -> เขียว -> ฟ้า -> น้ำเงิน -> เทา) เพื่อแยกแยะหมวดหมู่ข้อมูลในหน้า 3D Graph อย่างชัดเจน
   - **Tactical Radar Markers:** เมื่อทำการ Focus ไปที่กลุ่มข้อมูล จะแสดงผลเป้าหมายด้วย "กรอบเรดาร์สีขาว" (Tactical Crosshairs) ที่หมุนและกะพริบ (Pulse Animation) แบบ Real-time
   - **Hacker Terminal Console:** ระบบ "Live Analytics Stream" สไตล์ Hacker ที่ทำหน้าที่พ่น Log รายชื่อ Node อย่างรวดเร็ว พร้อม Effect การจางหาย (Fade-out) อัตโนมัติเมื่อสิ้นสุดการสแกน
   - **Interactive Object Rotation:** ระบบหมุนกราฟ 3D แบบสมูทด้วยการควบคุมแบบแมนนวล (Play/Pause Toggle) พร้อมระบบ Damping ที่จะหมุนวัตถุกลับคืนสู่ตำแหน่งเริ่มต้น (y=0) อย่างนุ่มนวลเมื่อหยุดทำงาน
   - **Contextual Sidebar Integration:** นำ Timeline 3 ปีและปุ่ม History เข้าไปฝังใน Sidebar ของหน้า 3D Model หลัก ทำให้สามารถวิเคราะห์ประวัติได้ทันทีที่คลิกวัตถุ

---

## ⚙️ 2. หัวใจของโครงการ: เส้นทางการไหลของข้อมูล (Data Pipeline)

### 🔄 The Pipeline Flow:
`AR15-DATA.md` (Source) ➡️ `Sync Script` (Engine) ➡️ `Supabase` (Live DB) ➡️ `App.tsx` (3D/Web)

1. **Source of Truth (`AR15-DATA.md`):** ใช้ระบบ Indentation แสดงลำดับชั้น และ `{}` สำหรับเก็บ Metadata (เช่น `InstallDate`, `ConnectsTo`)
2. **The Engine (`scripts/sync-ac-to-supabase.cjs`):** ทำหน้าที่ Parsing, Categorization และสร้างความสัมพันธ์ข้ามระบบ (Edges) ขึ้นสู่ Cloud
3. **Visualization Logic:**
   - **Aggregated Health:** สุขภาพของระบบแม่ ตัดสินจากชิ้นส่วนที่แย่ที่สุด (Red > Orange > Green)
   - **Status Propagation:** สีของวัตถุใน 3D Model จะสะท้อนสถานะล่าสุดจาก Database เสมอ และสามารถสร้าง Peer Highlighting (คลิกตัวหนึ่ง เรืองแสงทั้งคู่) ได้
   - **Data Export:** รองรับการคัดลอกข้อมูลลง Clipboard (Excel Ready) และการส่งออก CSV เพื่อการนำไปทำรายงานภายนอก

---

## 🛡️ 3. กฎทองคำเพื่อป้องกันระบบพัง (Golden Rules for Scale-up)

เมื่อโครงการนี้ขยายไปสู่ระบบไฟฟ้า (EE) สุขาภิบาล (SN) หรือเพิ่มอาคารใหม่ ให้ยึดหลักการเหล่านี้:

1. **ห้ามเปลี่ยน Naming Convention กลางคัน:** สคริปต์ Sync ยึดติดกับชื่อ Prefix (`AC-`, `FCU-`, `PIPE-`) หากจะเพิ่มระบบใหม่ **ต้องไปเพิ่มเงื่อนไขการจัดหมวดหมู่ (Categorization) ใน Parser เสมอ**
2. **Indentation is King:** ในไฟล์ `.md` ย่อหน้าผิด = ความสัมพันธ์ผิด การย่อหน้าต้องสม่ำเสมอ (ใช้ 4 Spaces สำหรับแต่ละระดับชั้น)
3. **ห้ามเปลี่ยนชื่อ Node (`name`) มั่วซั่ว:** ชื่อคือ Primary Key ในฐานข้อมูล หากแก้ไขชื่อใน `.md` ระบบจะมองว่าเป็น Node ใหม่ทันที (ทำให้ข้อมูล Log เก่ากลายเป็น Orphan)
4. **Metadata Keys ต้องมาตรฐาน:** `InstallDate`, `Type`, `AssetID`, `ConnectsTo` คือคำสงวน (Reserved Keywords) ห้ามสะกดผิดหรือผิด Case เด็ดขาดเพื่อความเสถียรในการดึงข้อมูลไปคำนวณ Life Cycle
5. **UI Consistency:** ฟอนต์ Monospace ในหน้า Topology สงวนไว้สำหรับบริบทของ "ระบบวิเคราะห์ข้อมูลเบื้องหลัง" (Backend Analysis) เท่านั้น เพื่อสร้างความแตกต่างทางความรู้สึกจากหน้า 3D Model ที่เป็นมิตรกับผู้ใช้งานทั่วไป

---
*บันทึกเวอร์ชันล่าสุด: 3 เมษายน 2026 (Asset Topology & Interactive Terminal Update)*