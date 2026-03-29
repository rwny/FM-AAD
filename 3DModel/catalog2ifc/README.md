# Carrier HVAC BIM Suite

ชุดเครื่องมือบริหารจัดการข้อมูลและสร้างโมเดล BIM สำหรับเครื่องปรับอากาศ Carrier โดยแบ่งการทำงานออกเป็น 3 ส่วนหลักที่เชื่อมโยงกันด้วยข้อมูลมาตรฐานเดียวกัน

## 1. ข้อมูล Catalog (Data Layer)
*   **Location:** `/data/*.js`
*   **หน้าที่:** เป็นแหล่งข้อมูลกลาง (Single Source of Truth) ในรูปแบบ JSON/JavaScript Object
*   **รายละเอียด:** เก็บค่าทางเทคนิคทั้งหมด เช่น ขนาด (W/D/H), ประสิทธิภาพ (BTU/SEER), ข้อมูลไฟฟ้า และรหัสรุ่นจับคู่ระหว่าง Indoor (FCU) และ Outdoor (CDU)

## 2. ระบบสกัดข้อมูล (Extraction Tools)
*   **Location:** `/src/extractor/`
*   **เครื่องมือ:** `extract_pdf.py`, `check_pdf_content.py`
*   **การทำงาน:** ใช้ Python สแกนไฟล์ PDF Catalog เพื่อดึงข้อมูลตารางสเปคออกมาโดยอัตโนมัติ แล้วแปลงให้อยู่ในรูปแบบไฟล์ข้อมูลในข้อที่ 1 ช่วยลดความผิดพลาดจากการพิมพ์ข้อมูลเอง (Manual Entry)

## 3. โปรแกรมเลือกสินค้าหน้าเว็บ (Web Catalog Viewer)
*   **Location:** `/src/web_catalog/`
*   **เครื่องมือ:** HTML5, Vanilla CSS, JavaScript
*   **การทำงาน:** เป็น UI สำหรับฝ่ายขายหรือวิศวกรเพื่อใช้ค้นหาและเปรียบเทียบสเปคแอร์แต่ละรุ่นผ่าน Browser โดยดึงข้อมูลจากข้อที่ 1 มาแสดงผลแบบ Interactive พร้อมคำนวณค่าทางเทคนิคเบื้องต้น

## 4. เครื่องมือสร้างโมเดล 3D (Blender BIM Addon)
*   **Location:** `/src/blender_addon/`
*   **เครื่องมือ:** Python (Blender API)
*   **การทำงาน:** 
    *   เป็นปลั๊กอินติดตั้งใน Blender เพื่อให้สถาปนิก/วิศวกรเลือกโมเดลแอร์จาก Catalog 
    *   **Automated Modeling:** สร้างวัตถุ 3D ตามขนาดจริง (Real Dimension) ทันที
    *   **BIM Injection:** ฉีดข้อมูล IFC (Industry Foundation Classes) และ Custom Properties ลงในโมเดลอัตโนมัติ
    *   **System Linking:** สร้างรหัส `System_ID` เพื่อจับคู่ระหว่างเครื่องภายในและภายนอกอาคาร ทำให้เมื่อนำออก (Export) ไปยังซอฟต์แวร์ BIM อื่นๆ (เช่น Revit) ข้อมูลจะยังคงเชื่อมโยงกัน

---

### Workflow การทำงานรวม (End-to-End)
1.  **Extract:** รันสคริปต์สกัดข้อมูลจาก PDF ได้ไฟล์ `data-xxx.js`
2.  **Verify:** ตรวจสอบความถูกต้องของข้อมูลผ่าน Web Catalog
3.  **Generate:** เปิด Blender แล้วใช้ Addon เลือกโมเดลเพื่อวางในอาคาร ข้อมูล BIM จะถูกบรรจุลงในไฟล์ 3D ทันที
