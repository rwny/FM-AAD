# 🏛️ MASTER SYSTEM ARCHITECTURE: BIM-FM Knowledge Graph
## (The Authoritative Data Pipeline & System Blueprint)

เอกสารฉบับนี้คือ **"คัมภีร์หลัก" (Master Blueprint)** ของโครงการ Digital Twin (AR15) จัดทำขึ้นเพื่อบันทึกความสำเร็จ และ **อธิบายกลไกหัวใจสำคัญของระบบ** นั่นคือ "เส้นทางการไหลของข้อมูล" (Data Pipeline) และสถาปัตยกรรมการแสดงผลเชิงลึก (Visualization Architecture) ตั้งแต่ผู้ใช้อัปเดตข้อมูลแบบ Text ไปจนถึงการแสดงผลบน 3D Knowledge Graph และ Dashboard

การวางรากฐานข้อมูลที่ชัดเจนและมีกฎเกณฑ์ที่รัดกุม จะช่วยป้องกันไม่ให้ระบบ "พัง" เมื่อโครงการขยายตัว (Scale-up) ในอนาคต

---

## 📍 1. ความสำเร็จล่าสุด (Latest Milestones)

1. **3D Tactical Knowledge Graph (v2.0):**
   - **Dual-Layout Engine:** ระบบสลับการจัดวางระหว่าง **Hierarchy** (ลำดับชั้น 9 ระดับ ตามแนวดิ่ง) และ **Radial** (กระจายตัวแบบอิสระ)
   - **9-Level Color Hierarchy:** ไล่เฉดสีแบบ Full Spectrum (ม่วง -> แดง) เพื่อแยกแยะความสำคัญตั้งแต่โครงสร้างตึกไปจนถึงระบบท่อและอุปกรณ์ย่อย
   - **Tactical Navigation Window:** หน้าต่าง `RAW_DATA_ACQUISITION.EXE` สไตล์ Terminal ที่แสดงรายการเชื่อมโยงแบบ **UPLINK/DNLINK** ตามทิศทางการไหล (Flow) จริงของพลังงาน
   - **Live Data Stream Console:** ระบบ Log ฝั่งซ้ายที่ไหลข้อมูลพิกัดเวกเตอร์ XYZ และสถานะระบบแบบ Hacker Look พร้อมฟีเจอร์ Data Burst เมื่อมีการเลือกเป้าหมาย
   - **Monochrome Alert Mode:** โหมดลดสัญญาณรบกวนทางสายตา (Visual Noise) ที่จะแสดงผลเป็นสีเทา แต่จะคงสี **แดง/ส้ม** ไว้เฉพาะโหนดที่มีสถานะ Faulty หรือ Maintenance เท่านั้น

2. **System-Centric Dashboard & Age Logic:**
   - **Real-time Age Calculation:** ระบบคำนวณอายุเครื่องอัตโนมัติ (Rounded Months) แสดงผลในทุก UI ทั้งหน้า Dashboard, History Report และ Sidebar
   - **Dynamic Life Cycle Timeline:** พัฒนาแถบประวัติ Visual 3 ปี พร้อมจุด Marker ที่บอกอายุเครื่อง ณ วันที่เกิดเหตุการณ์ (Age-at-event) เมื่อนำเมาส์ไปชี้
   - **Aggressive Status Sync:** ระบบดึงข้อมูลสถานะล่าสุดจากตาราง `assets` และ `maintenance_logs` มาผสานกับ Knowledge Graph โดยตรง (Live Synchronization)

3. **Expanded Data Conventions:**
   - รองรับความสัมพันธ์แบบ **`Monitors`** สำหรับระบบความปลอดภัย (CCTV) และทิศทางพลังงานแบบ **`ConnectsTo / ConnectsFrom`**
   - พัฒนา **Flow-Aware Logic** ในตัว Graph ที่สามารถเข้าใจได้ว่าอุปกรณ์ไหนอยู่ "ต้นน้ำ" (Upstream) หรือ "ปลายน้ำ" (Downstream) แม้อยู่ในระดับชั้นเดียวกัน

---

## ⚙️ 2. หัวใจของโครงการ: เส้นทางการไหลของข้อมูล (Data Pipeline)

### 🔄 The Pipeline Flow:
`AR15-DATA.md` (Source) ➡️ `Sync Script` (Engine) ➡️ `Supabase` (Live DB) ➡️ `App.tsx` (3D/Web)

1. **Source of Truth (`AR15-DATA.md`):** ใช้ระบบ Indentation และ `{}` สำหรับเก็บ Metadata
2. **The Engine (`scripts/sync-ac-to-supabase.cjs`):** ทำหน้าที่ Parsing และสกัดลำดับชั้น (Containment) และเส้นทางเชื่อมต่อ (Connections)
3. **Visualization Logic:**
   - **Hierarchy Layering:** ล็อคค่าพิกัดแนวตั้ง (`fy`) ตาม Level ความสำคัญในโหมด Hierarchy
   - **Status-Aware Coloring:** ปรับสีโหนดตามสถานะซ่อมบำรุงใน Database เป็นอันดับแรก (Priority 1)
   - **Interactive Vectoring:** ระบบค้นหาและกระโดดข้ามโหนด (Target Acquisition) พร้อมการ Fly-to ที่มีความแม่นยำสูง (Precision Focus)

---

## 🛡️ 3. กฎทองคำเพื่อป้องกันระบบพัง (Golden Rules for Scale-up)

1. **Hierarchy is Logic:** ในโหมด Hierarchy ระยะห่างระหว่างชั้นถูกตั้งไว้ที่ 50 หน่วย การจัดกลุ่มโหนดจึงต้องแม่นยำผ่านไฟล์ `.md`
2. **Status Mapping:** โหนดในกราฟจะเปลี่ยนสีได้ก็ต่อเมื่อชื่อโหนด (`name`) ตรงกับรหัส `asset_id` ในตาราง `assets` หรือ `maintenance_logs` (Case-insensitive)
3. **Flow Direction:** การเขียน `ConnectsTo` จะทำให้โหนดปลายทางถูกจัดเป็น **DNLINK_** ในหน้าต่าง Acquisition เสมอ
4. **Age Logic Foundation:** การคำนวณเดือนใช้มาตรฐาน **30.4375 วันต่อเดือน** เพื่อความแม่นยำตลอดทั้งปี

---
*บันทึกเวอร์ชันล่าสุด: 4 เมษายน 2026 (3D Tactical Graph v2.0 & Hacker Terminal Integration)*
