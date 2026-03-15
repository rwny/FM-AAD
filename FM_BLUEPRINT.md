# 🏗️ Blueprint: BIM Asset & Digital Twin System (React + TypeScript)

ระบบเว็บแอปพลิเคชันสำหรับบริหารจัดการเฟอร์นิเจอร์และอุปกรณ์อาคาร (BIM Asset & Maintenance Tracking) โดยใช้โมเดล 3D จาก Blender เชื่อมต่อกับฐานข้อมูล Real-time และรองรับการแสดงผล Point Cloud เพื่อตรวจสอบหน้างานจริง

## 1. ข้อมูลภาพรวม (Project Overview)

ระบบบริหารจัดการสิ่งอำนวยความสะดวกที่ผสานรวมข้อมูล 3 ส่วนเข้าด้วยกัน:
* **Model:** โมเดลจำลอง 3D (GLB) จาก Blender
* **Database:** ฐานข้อมูล Real-time (Firebase/Supabase)
* **Point Cloud:** ข้อมูลสแกนจริง (.PLY) เพื่อการตรวจสอบ (Inspection)

## 2. โครงสร้างลำดับชั้นการทำงาน (Hierarchy of Workflow)

การทำงานจะเรียงลำดับจากระดับบนสุดลงไปหาระดับย่อยที่สุด (Top-Down Approach):

1.  **🏫 Building (ระดับอาคาร):** โหลดโมเดลรวมของอาคาร (เช่น `ar15-301.glb`) แสดงภาพรวมภายนอกและโครงสร้างหลัก
2. **📶 Floor (ระดับชั้น):** ให้ 3d object แ่ละตัว มีชื่อที่ระบุชั้น เพื่อกรอง วัตถุที่จะแสดง ถ้าทำงานชั้น 1 ชั้นที่สูงกว่า ก็ไม่ต้องแสดง แต่ถ้าทำงานที่ชั้น 2 วัตถุที่อยู่ชั้นสูงกว่าก็จะไม่แสดง แต่ชั้นที่อยู่ต้ำกว่า ให้แสดงเหมือนปกติ 
3.  **🚪 Room (ระดับห้อง):** ระบุตำแหน่งด้วย Room ID (เช่น `RM-101`) มีป้ายกำกับ (HTML Labels) แสดงชื่อห้อง และสามารถคลิกเพื่อ Focus ได้
4.  **🛋️ Asset / Component (ระดับอุปกรณ์):** หน่วยที่เล็กที่สุดในระบบ แบ่งตามประเภท (Furniture, AC, EE) พร้อมข้อมูลทางเทคนิคและสถานะการซ่อมบำรุง

---

## 3. รายละเอียดโหมดการทำงาน (Modular Inspection Modes)

ระบบแบ่งการแสดงผลตามประเภทของงาน (Context-Aware Rendering):

- ในทุกๆ Mode เส้นทางในเวป ให้ left side panel เป็นตัวพา User ไป ด้วย expand menu กดที่รายการแล้วขยายรายการย่อยไปจนสุด ทำงานแบบนี้

   - for each MODE [AR, FUR, ELEC, AC] left side  bar (navigate bar)
      - FLOOR 01 : {
         show : all floor 1
         hilight : no
         [Right side bar] : show floor data{}
      }
         - Room 01 : {
            show : all floor 1
            hilight : room 1
            [Right side bar] : show room data{}
         }
            - Equipment : {
               show : all equipment
               hilight : clicl selected equiptment
               [Right side bar] : show equipment data{}
            }

### **A. 🏛️ ARCH Mode (Architectural)**
*   **เป้าหมาย:** ใช้สำหรับการนำชมสถานที่และการจัดการพื้นที่ (Space Management)
*   **ฟังก์ชันหลัก:**
    - แสดงป้ายชื่อห้อง (Room Labels) ทั้งหมด
    - ระบบเจาะชั้น (Clipping) อัตโนมัติเมื่อเลือกห้อง
    - ผนังและโครงสร้างอาคารแสดงผลแบบทึบ (Solid) เพื่อให้เห็นขอบเขตที่ชัดเจน
*   **Data Key:** วัตถุที่ขึ้นต้นด้วย `RM-` (Rooms) และ `XR-` (Arch)

### **B. 🛋️ FURNITURE Mode**
*   **เป้าหมาย:** บริหารจัดการครุภัณฑ์และเฟอร์นิเจอร์ (Inventory Tracking)
*   **ฟังก์ชันหลัก:**
    - เน้นสีสันที่ตัวเฟอร์นิเจอร์ (Highlighted) และทำโครงสร้างอาคารให้จางลง (Transparent) 
    - แสดงสถานะแยกตามชิ้นงาน (Normal, Faulty, Maintenance)
    - รายการ Sidebar แสดงผลรวมจำนวนชิ้นแยกตามชั้นและห้อง
*   **Data Key:** วัตถุที่ขึ้นต้นด้วย `LF-` หรือ `BF-`

### **C. ❄️ AC Mode (Air Conditioning)**
*   **เป้าหมาย:** ตรวจสอบระบบปรับอากาศและงานซ่อมบำรุงเครื่องจักร
*   **ฟังก์ชันหลัก:**
    - ระบบ **FCU/CDU Sync:** หากตัวใดตัวหนึ่งเสีย ระบบจะแจ้งเตือนทั้งคู่ที่ลิ้งก์กัน
    - แสดงข้อมูลทางเทคนิคเบื้องต้น (BTU, Brand, Model)
    - เปลี่ยนสีอุปกรณ์ตามสถานะการทำงาน (Normal: ฟ้า, Warning: ส้ม, Faulty: แดง)
*   **Data Key:** วัตถุที่ขึ้นต้นด้วย `FCU-` และ `CDU-`

### **D. ⚡ EE Mode (Electrical)**
*   **เป้าหมาย:** ตรวจสอบระบบไฟฟ้าและแผงควบคุม (กำลังพัฒนา)
*   **ฟังก์ชันหลัก:**
    - แสดงตำแหน่งตู้ไฟ (DB) และจุดจ่ายไฟสำคัญ
    - (Coming Soon) ระบบจำลองการจ่ายไฟ (Power Circuit Path)
*   **Data Key:** วัตถุที่เกี่ยวข้องกับระบบไฟฟ้า

---

## 4. โครงสร้างเทคโนโลยี (Tech Stack)

* **Frontend:** React.js + TypeScript (Vite)
* **3D Engine:** Three.js ผ่าน `@react-three/fiber` (R3F)
* **Helper Libraries:** `@react-three/drei` (สำหรับ Loader และ Tools ต่างๆ)
* **Database:** Firebase Realtime DB หรือ Supabase (NoSQL/PostgreSQL)
* **Styling:** Tailwind CSS + **Font: Noto Sans Thai (Google Fonts)**
* **Rendering Options:** Enabled `localClippingEnabled` ใน Three.js Renderer

## 5. มาตรฐานการออกแบบ UI (Design Standards)

* **Typography:** ใช้ "Noto Sans Thai" (Loop) เป็น Font หลักเพื่อความอ่านง่ายและทันสมัย
* **Color Scheme:** เน้น Light Mode สะอาดตา (Background: `#f8fafc`, Text: `#1e293b`)
* **Mode Switcher (Sidebar):** 
  - ใช้ Grid 4 คอลัมน์
  - ไอคอนขนาดใหญ่ `w-10 h-10` เพื่อความชัดเจน
  - มุมมน `rounded-[12px]` และ Gap เล็กน้อยเพื่อความสวยงาม
* **Layout:** Sidebar กว้าง 240px, ขอบโค้งมน, ใช้ Backdrop Blur (Glassmorphism)

## 6. โครงสร้างข้อมูล (Data Hierarchy & Mockup)

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

## 7. ส่วนประกอบและเทคนิคพิเศษ (Core Modules & Logic)

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

## 8. ขั้นตอนการพัฒนาที่ทำไปแล้ว (Accomplishments)

1. ✅ **Setup UI Base:** Sidebar, Mode Switch, Font Noto Sans Thai
2. ✅ **3D Integration:** โหลด GLB, Traverse เพื่อใส่ Material และ Logic
3. ✅ **Clipping System:** ระบบตัดชั้นอัตโนมัติเมื่อเลือกห้อง
4. ✅ **Mock Data Fix:** ปรับจูนข้อมูล AC ให้คงที่และสัมพันธ์กับชั้น
5. ✅ **Smart Clipping & Raycast:** ระบบตัดชั้นอัจฉริยะพร้อม Raycast Filtering
6. ✅ **Fixed HTML Labels:** ป้ายชื่อขนาดคงที่ ไม่อ่านยากเวลาซูม
7. ✅ **FCU/CDU Status Sync:** ระบบ Synchronize สถานะคู่แอร์
8. ✅ **Status Colors Update:** ปรับปรุงสีสถานะ (Normal=เขียว, Maintenance=ส้ม, Faulty=แดง)

---

## 9. แผนการพัฒนาในอนาคต (Future Roadmap)

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

## 10. ลำดับความสำคัญในการพัฒนา (Implementation Priority)

**แนะนำ:** เริ่มจาก **Asset Details Panel** + **Work Order System**
- ✅ คุณค่าสูงต่อผู้ใช้
- ✅ ใช้งานไม่ซับซ้อน
- ✅ ไม่ต้องใช้ Backend ในระยะเริ่มต้น (ใช้ localStorage)

---
*อัปเดตล่าสุด: 15 มีนาคม 2026*
