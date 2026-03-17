# 📈 Project Progress: FM_AR15 BIM Digital Twin

ไฟล์นี้บันทึกความคืบหน้าการพัฒนาและแผนงานในอนาคต (Update: 17 มีนาคม 2026)

---

## ✅ สิ่งที่ทำเสร็จแล้ว (Completed)

### 1. Data Architecture (Hybrid Strategy)
- [x] **Static Specs (Markdown):** แยกข้อมูล Spec ของแอร์ออกจาก Database เพื่อให้มนุษย์แก้ไขได้ง่ายผ่านไฟล์ `src/utils/AR15-AC-DATA.md`
- [x] **Automated Parser:** สร้าง Script `scripts/parse-ac-data.cjs` สำหรับแปลง Markdown เป็น `ac-specs.json` โดยอัตโนมัติ
- [x] **Dynamic Logs (Supabase):** เชื่อมต่อระบบประวัติการซ่อมบำรุงเข้ากับ Supabase ตาราง `ac_maintenance_logs`
- [x] **Shared Intelligence:** พัฒนา Logic การรวมข้อมูลระหว่าง FCU และ CDU (Peer matching) โดยอ้างอิงเลขห้อง ทำให้ทั้งชุดแอร์เห็นประวัติการซ่อมร่วมกัน

### 2. UI & User Experience (AC Mode Focus)
- [x] **Standardized Typography:** ปรับปรุงขนาดตัวอักษรเป็น 3 ระดับมาตรฐาน (Large, Medium, Small) เพื่อความสบายตา
- [x] **Compact Log Format:** แสดงรายการประวัติการซ่อมแบบ 3 บรรทัด (สถานะ • วันที่ เวลา • ผู้รายงาน / หัวข้อ / บันทึกย่อ)
- [x] **Full-screen Modals:** 
  - **Detail View:** แสดงรายละเอียด Log ขนาดใหญ่กลางหน้าจอ
  - **Print Report:** ระบบ Preview รายงานขนาด A4 สำหรับพิมพ์หรือเซฟเป็น PDF
- [x] **Enhanced Sidebar:** ขยายขนาดจุดสีสถานะ (Status Bullet) ให้ใหญ่ขึ้น 0.8 เท่าของตัวหนังสือ เพื่อการระบุสถานะที่ชัดเจน

### 3. 3D Visualization & Status Logic
- [x] **Live Status Mapping:** ตัวแอร์ในโมเดล 3D จะเปลี่ยนสีตามสถานะล่าสุดใน Database ทันที
  - 🟢 **Normal:** งานล่าสุดสถานะ 'Completed'
  - 🟠 **Maintenance:** งานล่าสุดสถานะ 'In Progress' หรือ 'Pending'
  - 🔴 **Faulty:** งานล่าสุดสถานะ 'Faulty' หรือพบคำว่า 'พัง/เสีย' ในบันทึก
- [x] **Real-time Interaction:** เมื่อเพิ่ม Log ใหม่ผ่านเว็บ สีของโมเดลจะเปลี่ยนตามสถานะทันที

### 4. Database Optimization
- [x] **Reporter Tracking:** เพิ่มระบบบันทึกชื่อผู้รายงาน (Reporter) ในทุกรายการ Log
- [x] **Precise Sorting:** ปรับการเรียงลำดับ Log ให้ใช้ Timestamp (`created_at`) เพื่อให้รายการล่าสุดอยู่บนสุดเสมอ

---

## 🚀 แผนการพัฒนาในอนาคต (Roadmap)

### 🛠️ ระยะสั้น (Short-term)
1. **QR Code Generator:** ระบบเจน QR Code สำหรับแอร์แต่ละเครื่องเพื่อติดหน้างานจริง
2. **Mobile Quick-Log:** หน้าเว็บ/แอป สำหรับช่างสแกน QR แล้วกรอก Log ได้ทันทีโดยไม่ต้องเข้าหน้า 3D
3. **Image Attachment:** ระบบแนบรูปถ่ายประกอบการแจ้งซ่อมใน Log

### 🌐 ระยะยาว (Long-term)
1. **CCTV Integration:** วางตำแหน่งกล้องและดึงภาพสด (Live RTSP/WebRTC Feed) มาแสดงในระบบ 3D
2. **Predictive Maintenance:** เชื่อมต่อ Sensor อุณหภูมิ/กระแสไฟ เพื่อวิเคราะห์อาการเสียล่วงหน้า
3. **X-Ray / Structural View:** โหมดดูงานระบบท่อและโครงสร้างโดยทำให้ผนังโปร่งแสง

---
*หมายเหตุ: งานวันนี้มุ่งเน้นที่การทำให้ระบบ AC มีความสมบูรณ์ในการจัดการข้อมูลแบบ Hybrid และการออกรายงานที่สวยงาม*
