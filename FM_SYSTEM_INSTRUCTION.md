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

---
*อัปเดตล่าสุด: 13 มีนาคม 2026*
