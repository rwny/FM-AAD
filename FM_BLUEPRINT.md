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
* **Styling:** Tailwind CSS + **Font: Noto Sans Thai (Google Fonts)**
* **Rendering Options:** Enabled `localClippingEnabled` ใน Three.js Renderer

## 3. มาตรฐานการออกแบบ UI (Design Standards)

* **Typography:** ใช้ "Noto Sans Thai" (Loop) เป็น Font หลักเพื่อความอ่านง่ายและทันสมัย
* **Color Scheme:** เน้น Light Mode สะอาดตา (Background: `#f8fafc`, Text: `#1e293b`)
* **Mode Switcher (Sidebar):** 
  - ใช้ Grid 4 คอลัมน์
  - ไอคอนขนาดใหญ่ `w-10 h-10` เพื่อความชัดเจน
  - มุมมน `rounded-[12px]` และ Gap เล็กน้อยเพื่อความสวยงาม
* **Layout:** Sidebar กว้าง 240px, ขอบโค้งมน, ใช้ Backdrop Blur (Glassmorphism)

## 4. โครงสร้างข้อมูล (Data Hierarchy & Mockup)

* **Fixed Mockup Data:** ข้อมูลอุปกรณ์ (AC Assets) จะถูก Fix ไว้ที่ `src/utils/mockData.ts` เพื่อความเป็นระเบียบและไม่เปลี่ยนค่าแบบ Random ทุกครั้งที่รัน
* **Mapping:** ID ใน JSON (เช่น `fcu-101`) ต้องตรงกับชื่อ Object ในไฟล์ Blender (Case-insensitive)

```typescript
// ตัวอย่างโครงสร้างที่ Fix ไว้
{
  "id": "fcu-101",
  "name": "FCU Room 101",
  "status": "Normal",
  "model": "MSY-JS18VF"
}
```

## 5. ส่วนประกอบและเทคนิคพิเศษ (Core Modules & Logic)

### A. 3D Viewer & Clipping Logic
* **Automatic Clipping Plane:** เมื่อเลือกห้องในโหมด AR (เช่น RM-101) ระบบจะคำนวณระดับความสูงของชั้น (Floor Height) และสร้าง `THREE.Plane` เพื่อตัด (Clip) ส่วนที่อยู่เหนือขึ้นไปออกทันที เพื่อให้เห็นภายในชั้นนั้นๆ ได้ชัดเจน
  - ชั้น 1: Clip ที่ระดับ Y ≈ 2.5
  - ชั้นอื่นๆ: คำนวณตามสูตร `(floor * 3.0) - 0.5`
* **Local Clipping:** ต้องเปิด `localClippingEnabled: true` ที่ `gl` prop ของ `<Canvas />`

### B. Maintenance & Data Module
* **Status Highlighting:**
  - 🔵 สีฟ้า (Normal) - สถานะปกติ
  - 🔴 สีแดง (Faulty) - อุปกรณ์เสีย
  - 🟡 สีส้ม/เหลือง (Maintenance/Warning) - รอการซ่อมบำรุง

### C. UI / Dashboard Module
* **Interactive Labels:** ใช้ `<Html />` จาก `@react-three/drei` ในการติดป้ายชื่อห้องและอุปกรณ์ โดยจะขยายใหญ่ (Scale Up) และมีเส้นขอบ (Ring) เมื่อถูกเลือก

## 6. ฟีเจอร์หลัก (Key Features)

1. **โหมดการตรวจสอบระบบ (Modular Inspection Mode):** สลับระหว่าง Arch, Furniture, Electric, Air (AC)
2. **ระบบ X-Ray & Clipping:** มองทะลุชั้นได้อัตโนมัติเมื่อเจาะจงเลือกพื้นที่
3. **Smart Search:** ค้นหา Room หรือ Asset ID แล้วกล้องจะ Focus พร้อมแสดง Clipping Plane ที่เหมาะสม
4. **Capture System:** ปุ่มบันทึกภาพหน้าจอพร้อม UI (Screenshot)

## 7. ขั้นตอนการพัฒนาที่ทำไปแล้ว (Accomplishments)

1. ✅ **Setup UI Base:** Sidebar, Mode Switch, Font Noto Sans Thai
2. ✅ **3D Integration:** โหลด GLB, Traverse เพื่อใส่ Material และ Logic
3. ✅ **Clipping System:** ระบบตัดชั้นอัตโนมัติเมื่อเลือกห้อง
4. ✅ **Mock Data Fix:** ปรับจูนข้อมูล AC ให้คงที่และสัมพันธ์กับชั้น
5. ✅ **Smart Clipping & Raycast:** ระบบตัดชั้นอัจฉริยะพร้อม Raycast Filtering
6. ✅ **Fixed HTML Labels:** ป้ายชื่อขนาดคงที่ ไม่อ่านยากเวลาซูม
7. ✅ **FCU/CDU Status Sync:** ระบบ Synchronize สถานะคู่แอร์
8. ✅ **Status Colors Update:** ปรับปรุงสีสถานะ (Normal=เขียว, Maintenance=ส้ม, Faulty=แดง)

---

## 8. แผนการพัฒนาในอนาคต (Future Roadmap)

### 🛠️ ระยะสั้น (Short-term - Quick Wins)

1. **Asset Details Panel**
   - คลิกที่ FCU/CDU → แสดงข้อมูลละเอียด (Brand, Model, Capacity, Service Dates)
   - แสดง Maintenance History Timeline
   - ปุ่ม "Report Issue" สำหรับแจ้งซ่อม

2. **Work Order / Ticket System**
   - ฟอร์มแจ้งซ่อม: ประเภทปัญหา, รายละเอียด, รูปถ่าย
   - ติดตามสถานะ: Open → In Progress → Completed
   - เก็บข้อมูลด้วย localStorage (ก่อน migrate ไป Database)

3. **Filter & Search Enhancement**
   - กรองตามสถานะ (Normal/Faulty/Maintenance)
   - ค้นหาด้วย Room Number หรือ Asset ID
   - Toggle "Show only faulty assets"

4. **Export/Report Feature**
   - Export รายการครุภัณฑ์เป็น CSV/PDF
   - สร้างรายงาน Maintenance Summary
   - แผนภูมิแสดง Status Distribution

### 🚀 ระยะกลาง (Medium-term - High Value)

5. **Preventive Maintenance Scheduler**
   - ปฏิทินแสดงกำหนดการซ่อมบำรุง
   - แจ้งเตือนอัตโนมัติเมื่อใกล้ถึง `nextService` date
   - งานซ่อมบำรุงซ้ำ (รายเดือน/รายไตรมาส)

6. **QR Code Integration**
   - สร้าง QR Code สำหรับแต่ละครุภัณฑ์
   - สแกน QR → เปิดข้อมูลครุภัณฑ์บนมือถือ
   - ช่างเทคนิคเข้าถึงข้อมูลหน้างานได้รวดเร็ว

7. **Photo Gallery per Asset**
   - รูปภาพติดตั้ง/ก่อน-หลังซ่อมบำรุง
   - แนบ Technical Diagrams/Manuals

8. **Dashboard Analytics**
   - Pie Chart: การกระจายสถานะครุภัณฑ์
   - Bar Chart: ปัญหาแยกตามชั้น/โซน
   - KPI Cards: Total Assets, Faulty %, Avg Response Time

### 🌟 ระยะยาว (Long-term - Advanced)

9. **Real-time Database (Firebase/Supabase)**
   - Multi-user Collaboration
   - Live Status Updates
   - User Authentication (Admin/Technician Roles)

10. **AR Mobile View**
    - ใช้กล้องอุปกรณ์ + 3D Overlay
    - เล็งกล้องที่อุปกรณ์ → แสดงข้อมูล
    - Navigation ไปยังห้อง/ครุภัณฑ์ที่ต้องการ

11. **IoT Sensor Integration**
    - เชื่อมต่อเซ็นเซอร์จริง (อุณหภูมิ/แรงดัน)
    - แสดงข้อมูล Live บนโมเดล 3D
    - แจ้งเตือนอัตโนมัติเมื่อค่าผิดปกติ

12. **Point Cloud Comparison**
    - โหลดไฟล์ `.ply` จากงานสแกน
    - เปรียบเทียบ As-built vs BIM Model
    - Highlight จุดที่แตกต่างกัน

13. **Energy Monitoring**
    - ติดตามการใช้พลังงานต่อหน่วย AC
    - ประมาณการค่าใช้จ่ายต่อชั้น
    - คำแนะนำด้านประสิทธิภาพพลังงาน

---

## 9. ลำดับความสำคัญในการพัฒนา (Implementation Priority)

**แนะนำ:** เริ่มจาก **Asset Details Panel** + **Work Order System**
- ✅ คุณค่าสูงต่อผู้ใช้
- ✅ ใช้งานไม่ซับซ้อน
- ✅ ไม่ต้องใช้ Backend ในระยะเริ่มต้น (ใช้ localStorage)

---
*อัปเดตล่าสุด: 13 มีนาคม 2026*
