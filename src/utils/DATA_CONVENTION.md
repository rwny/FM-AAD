# 🏗 BIM Data Convention (v3.0) - Multi-Building Edition
คู่มือมาตรฐานการจัดการข้อมูลสินทรัพย์หลายอาคาร เพื่อความปลอดภัยในระบบ Knowledge Graph และ 3D Digital Twin

---

## 📂 1. โครงสร้างโฟลเดอร์ (Multi-Building Structure)
ข้อมูลต้องถูกแยกเก็บตามโฟลเดอร์ชื่ออาคารใน `src/utils/data/`:
*   `src/utils/data/AR15/` (อาคาร 15)
*   `src/utils/data/AR12/` (อาคาร 12)
*   ภายในแต่ละโฟลเดอร์ต้องมีไฟล์: `common.md`, `floor-1.md`, `floor-2.md`, ...

---

## 🆔 2. ระบบรหัสประจำตัว (Global Unique ID)
เพื่อให้ข้อมูลไม่ทับซ้อนกันในฐานข้อมูลส่วนกลาง (Supabase) ระบบจะใช้กฎ **Building Prefix** ดังนี้:

### **2.1 ในไฟล์ Markdown (Human-Friendly)**
คุณสามารถเขียนชื่อโหนดสั้นๆ ได้ตามปกติ เพื่อความสะดวกในการพิมพ์:
*   `- FCU-101-1`
*   `- LP-123`

### **2.2 ในระบบฐานข้อมูล (System-Friendly)**
ตัว Parser จะทำการเติมชื่ออาคารนำหน้าให้โดยอัตโนมัติ (Prefixing):
*   **รูปแบบ:** `[Building]-[NodeName]`
*   **ตัวอย่าง:** 
    *   AR15: `AR15-FCU-101-1`
    *   AR12: `AR12-FCU-101-1`
*   **ประโยชน์:** แม้คุณจะตั้งชื่อแอร์ว่า `FCU-1` เหมือนกันในทุึกอาคาร ข้อมูลในฐานข้อมูลก็จะไม่ทับกัน (No Collision)

---

## 🏛 3. ลำดับชั้นข้อมูลและการเชื่อมโยง 3D (Hierarchy & 3D Mapping)
ชื่อโหนดทุกตัวต้อง **ตรงกันทุกตัวอักษร** กับชื่อ Object ในไฟล์ `.glb` และต้องเป็น **Unique Name** ทั่วทั้งอาคาร:

### **3.1 โครงสร้างลำดับชั้น (Standard Hierarchy)**
```text
- ar15 (Building Node)
    - floor-x (Floor Node)
        - room-xxx (Room Node)
            - [Room-ID]-AC / EE / FUR / ARCH (System Headers - Auto Prefixed)
                - AC-xxx (Asset Set Group)
                    - FCU-xxx (Physical Object in 3D)
                    - CDU-xxx (Physical Object in 3D)
```

### **3.2 กลไกชื่อไม่ซ้ำอัตโนมัติ (Auto-Prefix Logic)**
เพื่อให้การเขียนใน Markdown ทำได้ง่าย แต่ยังคงความเป็น Unique ในระดับสากล:
*   **Generic Headers:** ชื่อกลุ่มระบบ (`AC`, `EE`, `ARCH`, `FUR`, `CCTV`) ระบบจะเติมชื่อ Parent (เช่น ชื่อห้อง) ไว้ข้างหน้าให้อัตโนมัติในฐานข้อมูล (เช่น `room-101-AC`)
*   **Specific Assets:** ชื่ออุปกรณ์จริง (`FCU-xxx`, `CDU-xxx`, `LP-xxx`) **ต้องตั้งชื่อให้ไม่ซ้ำกันเลยตั้งแต่ต้น** ห้ามซ้ำกันข้ามห้องหรือข้ามชั้นเด็ดขาด

---

## 🔄 4. ขั้นตอนการแปลงข้อมูล (Data Conversion Workflow)
ทุกครั้งที่มีการแก้ไขข้อมูลใน `src/utils/data/` ให้ใช้คำสั่งดังนี้เพื่ออัปเดตระบบ:

### **Step 1: ตรวจสอบและรวมไฟล์ (Check & Combine)**
รันคำสั่งเพื่อเช็คความถูกต้องของ Syntax และรวมไฟล์ย่อยทุกอาคารออกมาเป็นไฟล์ Master:
```bash
npm run data:combine
```
*   *สิ่งที่ได้:* ไฟล์ `src/utils/AR15-DATA.md`, `src/utils/AR12-DATA.md`, ...

### **Step 2: สร้างไฟล์สำหรับแอปพลิเคชัน (Generate JSON)**
แปลงไฟล์ Master เป็น JSON และ TypeScript เพื่อให้ Frontend นำไปแสดงผล:
```bash
npm run data:generate
```
*   *สิ่งที่ได้:* ไฟล์ `src/utils/AR15.json`, `src/utils/AR15-data.ts`, ...

### **Step 3: ส่งข้อมูลขึ้นฐานข้อมูล (Sync to Supabase)**
(เฉพาะเมื่อต้องการอัปเดต Live Data) ส่งข้อมูล Knowledge Graph ขึ้นระบบ Cloud:
```bash
npm run data:sync
```
*   *สิ่งที่ได้:* ข้อมูลในตาราง `kg_nodes` และ `kg_edges` บน Supabase จะถูกอัปเดต

---

## 🔍 5. กฎการตรวจสอบ (Validation Logic)
ระบบ `npm run data:check` จะตรวจสอบสิ่งเหล่านี้โดยอัตโนมัติ:
1.  **Indent Check:** บรรทัดที่ขึ้นต้นด้วย `-` ต้องเยื้องเป็นทวีคูณของ 4 เท่านั้น
2.  **Brace Balance:** ตรวจสอบปีกกา `{ }` ว่าเปิด-ปิดคู่กันครบไหม
3.  **Duplicate Name Check:** ตรวจสอบชื่ออุปกรณ์จริงห้ามซ้ำกันข้ามอาคาร (Global Unique)

---

## 🎨 6. สถานะและสี (Status & Keywords)
ระบบจะตรวจจับคำสำคัญในฟิลด์ `status` เพื่อเปลี่ยนสีใน 3D และ UI:

| สถานะ | ตัวอย่าง Keyword | สีใน 3D Graph |
| :--- | :--- | :--- |
| **ปกติ** | `Normal`, `Completed`, `ปกติ` | 🟢 เขียว / ฟ้า |
| **รอซ่อม** | `Maintenance`, `Warning`, `Pending`, `ซ่อม` | 🟡 ส้ม |
| **ชำรุด** | `Faulty`, `Broken`, `พัง`, `เสีย` | 🔴 แดง |
