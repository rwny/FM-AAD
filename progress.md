# 📈 Project Progress: FM_AR15 BIM Digital Twin

ไฟล์นี้บันทึกความคืบหน้าการพัฒนาและแผนงานในอนาคต (Update: 13 มีนาคม 2026)

---

## ✅ สิ่งที่ทำเสร็จแล้ว (Completed)

### 1. UI & Aesthetics
- [x] **Typography:** ติดตั้ง Font "Noto Sans Thai" (แบบมีหัว - Loop) ทั่วทั้งระบบ
- [x] **Mode Switcher:** ปรับขนาดไอคอนโหมดหลักเป็นขนาดใหญ่ (w-10) 4 ปุ่มเรียงกันใน Sidebar
- [x] **Theme:** ปรับเป็น Light Mode (Clean Look) ใช้โทนสี Slate/Indigo/Emerald
- [x] **Status Colors:** ปรับปรุงระบบสีสถานะให้สื่อสารชัดเจน:
  - 🟢 **Normal/Active:** สีเขียว (Emerald)
  - 🟡 **Maintenance:** สีส้ม (Amber)
  - 🔴 **Faulty:** สีแดง (Rose)

### 2. 3D & Interactive Logic
- [x] **Smart Clipping System:**
  - เชื่อมต่อการ Expand/Collapse ชั้นใน Sidebar กับระบบ Clipping Plane
  - เมื่อเปิดดูห้องใน Floor 1 ระบบจะตัดโมเดลที่ความสูง y=2.4 อัตโนมัติ
  - เมื่อย่อ (Collapse) ระบบจะยกเลิกการ Clip
- [x] **Raycast Filtering:** แก้ไขปัญหาการคลิกติดยาก โดยการ Disable Raycast สำหรับวัตถุที่อยู่เหนือ Clipping Plane (มองทะลุและคลิกทะลุชั้นที่ถูกตัดได้)
- [x] **DoubleSide Rendering:** ตั้งค่าให้เห็น Backface ของโมเดลเมื่อถูกตัด (Clip)
- [x] **Fixed HTML Labels:** ป้ายชื่อห้องและอุปกรณ์มีขนาดคงที่ (Fixed Screen Size) ไม่อ่านยากเวลาซูมเข้า-ออก
- [x] **Label Filtering:** แสดงเฉพาะป้ายชื่อของชั้นที่กำลังเปิดดูอยู่ (Active Floor)

### 3. Asset & Data
- [x] **Fixed Mockup Data:** จัดระเบียบข้อมูลอุปกรณ์ (AC Assets) ไว้ที่ `src/utils/mockData.ts`
- [x] **FCU/CDU Status Sync:** ระบบ Synchronize สถานะคู่แอร์ หากตัวใดตัวหนึ่งเสีย (Faulty/Warning) อีกตัวจะแสดงสถานะวิกฤตตามไปด้วยโดยอัตโนมัติ

### 4. Database & Connectivity (WIP)
- [x] **Supabase Client:** ตั้งค่า Supabase Client พร้อมระบบ Fallback เป็น Local JSON หากเชื่อมต่อไม่ได้
- [x] **Database Schema:** ออกแบบโครงสร้างตาราง (Buildings, Floors, Rooms, Assets, Logs) ใน Supabase
- [x] **Seeding Script:** สร้างสคริปต์ `seed-supabase.js` สำหรับนำเข้าข้อมูลจาก Markdown เข้าสู่ Database
- [x] **UI Live Status:** เพิ่มตัวบ่งชี้ "Live DB" / "Local Data" ใน Header ของแอป
- [ ] **Real-time Updates:** ระบบอัปเดตสถานะแบบ Real-time เมื่อมีการบันทึกข้อมูลใหม่ (Future)

---

## 🚀 สิ่งที่จะทำต่อไป (Next Steps)

### 🛠️ ระยะสั้น (Short-term)
1. **Detailed Sidebar:** เพิ่มข้อมูลเชิงลึกใน Sidebar ขวา เช่น Maintenance History, รูปภาพอุปกรณ์จริง และฟอร์มสำหรับกดแจ้งซ่อม
2. **Floor 2 Clipping:** เพิ่ม Logic การตัดชั้นสำหรับ Floor 2 และชั้นอื่นๆ ตามความเหมาะสม
3. **Multi-Select & Compare:** ระบบเลือกอุปกรณ์หลายชิ้นพร้อมกันเพื่อเปรียบเทียบข้อมูล

### 🌐 ระยะยาว (Long-term)
1. **Real-time Database:** เชื่อมต่อกับ Firebase หรือ Supabase เพื่อเก็บข้อมูลจริงแทน Mockup
2. **Point Cloud Integration:** ระบบโหลดไฟล์ .PLY เพื่อดูเทียบหน้างานจริง (Digital Twin Inspection)
3. **X-Ray Mode:** โหมดดูเฉพาะงานระบบ (Pipe/Duct) โดยทำให้ผนังอาคารจางลงทั้งหมด

---
*หมายเหตุ: ระบบ Focus & Fly (Camera Animation) ถูกยกเลิกชั่วคราวเพื่อให้ User มีอิสระในการ Orbit กล้องด้วยตัวเอง*
