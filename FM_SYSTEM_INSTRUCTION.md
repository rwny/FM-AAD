# 🏗️ Blueprint: BIM Asset & Digital Twin System (React + TypeScript)

ระบบเว็บแอปพลิเคชันสำหรับบริหารจัดการเฟอร์นิเจอร์และอุปกรณ์อาคาร (BIM Asset & Maintenance Tracking) โดยใช้โมเดล 3D จาก Blender เชื่อมต่อกับฐานข้อมูล Real-time และรองรับการแสดงผล Point Cloud เพื่อตรวจสอบหน้างานจริง

## 1. ข้อมูลภาพรวม (Project Overview)

ระบบบริหารจัดการสิ่งอำนวยความสะดวกที่ผสานรวมข้อมูล 3 ส่วนเข้าด้วยกัน:
* **Model:** โมเดลจำลอง 3D (GLB) จาก Blender
* **Database:** ฐานข้อมูล Real-time (Firebase/Supabase)
* **Point Cloud:** ข้อมูลสแกนจริง (.PLY) เพื่อการตรวจสอบ (Inspection)

## 2. โครงสร้างเทคโนโลยี (Tech Stack)

* **Frontend:** React.js + TypeScript (Vite)
* **3D Engine:** Three.js ผ่าน `@react-three/fiber` (R3F)
* **Helper Libraries:** `@react-three/drei` (สำหรับ Loader และ Tools ต่างๆ)
* **Database:** Firebase Realtime DB หรือ Supabase (NoSQL/PostgreSQL)
* **Styling:** Tailwind CSS (สำหรับ UI Dashboard)

## 3. โครงสร้างข้อมูล (Data Hierarchy - Tree Structure)

เพื่อให้เจ้าหน้าที่บันทึกได้ง่ายและระบบค้นหาได้เร็ว ข้อมูลจะถูกจัดเก็บในรูปแบบกิ่งก้าน (Nested Structure):

```typescript
{
  "Building_ID": "Ar01",
  "Rooms": [
    {
      "room_id": "101",
      "pointcloud_url": "/scans/room101_low.ply", // สำหรับดูเทียบหน้างานจริง
      "assets": [
        {
          "id": "AC_01",              // ต้องตรงกับชื่อ Object ใน Blender
          "type": "AirConditioner",
          "status": "normal",         // normal, broken, maintenance
          "metadata": {
            "install_date": "2026-01-10",
            "model": "Daikin-FTKC"
          },
          "maintenance_logs": [       // ประวัติการซ่อมบำรุง
            {
              "log_id": "L001",
              "date": "2026-03-12",
              "action": "ล้างฟิลเตอร์",
              "technician": "สมชาย"
            }
          ]
        },
        {
          "id": "CHAIR_01",
          "type": "Furniture",
          "status": "normal",
          "position": [10.5, 0, -5.2] // พิกัด Dynamic ที่ดึงมาทับไฟล์ GLB
        }
      ]
    }
  ]
}
```

## 4. ส่วนประกอบของระบบ (Core Modules)

### A. 3D Viewer Module (Three.js/R3F)
* **GLB Loader:** โหลดโมเดลอาคารและเฟอร์นิเจอร์ที่ทำจาก Blender
* **Point Cloud Layer:** โหลดไฟล์ `.ply` เพื่อแสดงผลทับซ้อน (Overlay) สำหรับดูเทียบหน้างาน
* **Interactive Logic:** เมื่อคลิกที่ Object จะดึง `id` ไป Query ข้อมูลใน Database

### B. Maintenance & Data Module
* **Real-time Sync:** เมื่อเจ้าหน้าที่แก้สถานะใน Form ตำแหน่งหรือสีของโมเดลในหน้าเว็บจะเปลี่ยนทันที
* **Status Highlighting:**
  - ⚪ สีขาว/ปกติ (Normal) - สถานะทั่วไป
  - 🔴 สีแดง (Broken) - อุปกรณ์เสีย (Broken)
  - 🟡 สีเหลือง (Pending Maintenance) - ถึงกำหนดซ่อมบำรุง

### C. UI / Dashboard Module (React)
* **Asset Tree View:** รายการอุปกรณ์แบบ Dropdown ตามลำดับ Building > Room > Asset
* **Log Form:** หน้าต่างสำหรับคีย์ประวัติการซ่อมและวันที่ติดตั้ง

## 5. ฟีเจอร์หลักและ UX/UI (Key Features)

1. **โหมดการตรวจสอบระบบ (Modular Inspection Mode)**
   - แบ่งหมวดหมู่การตรวจสอบ (❄️ แอร์, 🪑 เฟอร์นิเจอร์, ⚡ ไฟฟ้า) เมื่อเลือกโหมดใด อุปกรณ์ที่ไม่เกี่ยวข้องจะถูกซ่อนทันที
2. **ระบบป้ายชื่ออัจฉริยะ (Smart Persistent Labels)**
   - ป้ายชื่อจะแสดงผลจางๆ ในสถานะ Idle และจะโดดเด่นขึ้น (Highlight) เมื่อถูกเลือก พร้อมยกตำแหน่งขึ้นเหนือวัตถุ (Dynamic Lifting)
3. **แดชบอร์ดสรุปสถานะ (Summary Dashboard)**
   - สรุปจำนวนอุปกรณ์ตามสถานะ และสามารถคลิกการ์ดเพื่อกรอง (Filter) อุปกรณ์บน Scene 3D ได้ทันที
4. **ระบบค้นหาอัจฉริยะ (Fuzzy Search & Go)**
   - ค้นหาจาก ID, ชื่อ หรือ AR-Code เมื่อพบแล้วกล้องจะพุ่งไปหา (Focus) และเปิดรายละเอียดทันที
5. **UI แบบ Compact & Dynamic**
   - Sidebar ปรับเปลี่ยนตามประเภทอุปกรณ์ และสามารถซ่อน (Toggle) เพื่อเพิ่มพื้นที่การมองเห็นได้

## 6. ขั้นตอนการพัฒนา (Roadmap)

1. **Model Prep:** จัดระเบียบชื่อ Object ใน Blender ให้ตรงกับ ID และ Export เป็น `.glb`
2. **Setup Project:** สร้างโปรเจกต์ React + TypeScript และติดตั้ง R3F + Tailwind
3. **Database Integration:** สร้าง Mockup Data ตามโครงสร้าง Tree ด้านบน
4. **Point Cloud Testing:** ลองโหลดไฟล์ `.ply` เข้ามาวางใน Scene ทับซ้อนกับ Mesh
5. **UI Linking:** เขียนฟังก์ชันให้การคลิกใน 3D เชื่อมโยงกับข้อมูลใน Database

## 7. แผนพัฒนาในอนาคต (Future Vision)

* **The Living Twin:** เชื่อมต่อ IoT เพื่อแสดงอุณหภูมิหรือการใช้พลังงานแบบ Real-time
* **AI Predictive Maintenance:** ระบบคำนวณคะแนนสุขภาพอุปกรณ์เพื่อเตือนก่อนเสียจริง
* **X-Ray Vision:** ระบบมองทะลุกำแพงเพื่อดูตำแหน่งงานระบบที่ฝังอยู่ภายใน
* **Dynamic QR Code:** สร้าง QR ประจำชิ้นงานเพื่อให้เข้าถึงข้อมูลผ่าน Tablet ได้ทันที

---
*ความพร้อมในการพัฒนา: ทำได้จริง 100% ด้วย React + Three.js + Blender*
*อัปเดตล่าสุด: 13 มีนาคม 2026*
