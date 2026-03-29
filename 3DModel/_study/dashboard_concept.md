# Executive FM Dashboard Concept: AR15 Building Project

เอกสารฉบับนี้ร่างโครงสร้างหน้าจอ **Dashboard (One-Page Summary)** สำหรับผู้บริหารและผู้ดูแลระบบ เพื่อดูภาพรวมของโครงการโดยไม่ต้องใช้โมเดล 3D (Graphic-centric)

---

## 📊 1. ส่วนแสดงผลสถานะหลัก (Primary KPI Cards)
ส่วนบนสุดของหน้าจอ แสดงตัวเลขที่สำคัญที่สุด 4 ด้าน:

| KPI | คำอธิบาย | ข้อมูลที่ดึง (Data Source) |
| :--- | :--- | :--- |
| **System Availability** | เปอร์เซ็นต์แอร์ที่ใช้งานได้ปกติ (Target > 95%) | `kg_nodes` where status = Normal |
| **Active Faults** | จำนวนรายการที่เสีย และยังไม่ได้ซ่อม | `ac_maintenance_logs` where status = Faulty |
| **Maintenance Due** | จำนวนแอร์ที่ต้องล้างเครื่องในเดือนนี้ | `metadata.installDate` + 6 months interval |
| **Power Stability** | สถานะการเชื่อมต่อกับตู้ไฟหลัก (LP-123) | `kg_edges` connection to AC units |

---

## 🏢 2. ส่วนแสดงผลแบบโครงสร้างชั้น (Vertical Stack View)
วาดรูปสี่เหลี่ยมเรียงซ้อนกันแทนจำนวนชั้นของอาคาร (Simplified Building Structure)

### Floor 02 (2nd Level Overview)
- **จุดสี (Status Dots):** แสดงตำแหน่งแอร์แต่ละห้องเป็นจุดสี (🟢/🟡/🔴)
- **Stats:** Total: 8 Sets | Healthy: 7 | Faulty: 1

### Floor 01 (1st Level Overview)
- **จุดสี:** แสดงตำแหน่งแอร์ (🟢/🟡/🔴)
- **Stats:** Total: 6 Sets | Healthy: 6

---

## 📅 3. ส่วนแผนการดำเนินงาน (Operation Schedule)
แสดง Timeline ในรูปแบบปฏิทินหรือรายการเช็คลิสต์:

1. **Scheduled Maintenance:** รายชื่อแอร์ที่รอบซ่อมใกล้ถึง (ห่างจากปัจจุบันไม่เกิน 15 วัน)
2. **Warranty Check:** แสดงไอคอน 🛡️ สีเขียว (ในประกัน) หรือ 🛡️ สีแดง (นอกประกัน) คำนวณจาก `InstallDate`

---

## 🛠️ 4. ส่วนสรุปเหตุการณ์ล่าสุด (Recent Activity Log)
ตารางแสดง 5 รายการล่าสุดที่มีการอัปเดต:

| Date | Asset Name | Subject/Issue | Status |
| :--- | :--- | :--- | :--- |
| 2026-03-29 | FCU-101-1 | เปลี่ยนแผ่นกรองอากาศ | ✅ Completed |
| 2026-03-28 | PIPE-DRN-201-4 | ท่อน้ำทิ้งรั่วซึม | ⏳ In Progress |
| ... | ... | ... | ... |

---

## 💡 แนวทางการดึงข้อมูล (Future Implementation)
- **Frontend:** ใช้เทคโนโลยี `TailwindCSS` ร่วมกับ `Recharts` เพื่อวาดกราฟวงกลมและแท่งที่ดู Premium
- **Interactive:** เมื่อผู้ใช้กดที่รายการใดๆ ใน Dashboard ระบบจะส่งค่าไปที่ `App.tsx` เพื่อสั่งให้ Model 3D "บินไปหา (Fly-to)" จุดนั้นทันที!
- **Report Export:** มีปุ่ม **"Export PDF"** เพื่อพิมพ์รายงานหน้าเดียวนี้ส่งผู้บริหารในตอนเช้าของทุกสัปดาห์

---
*เอกสารนี้จะทำหน้าที่เป็น Blueprint สำหรับการพัฒนาหน้า UI Dashboard ในเฟสถัดไปหลังจากโมเดล 3D เสร็จสมบูรณ์*
