# Carrier HVAC IFC Data Project

## 1. Objective
Project นี้มีวัตถุประสงค์เพื่อเปลี่ยนข้อมูลทางเทคนิค (Technical Specifications) จากแคตตาล็อกเครื่องปรับอากาศ Carrier หลายซีรีส์ (TGF, TGV, TGEV Series) ให้กลายเป็นฐานข้อมูลที่พร้อมใช้งานสำหรับ **OpenBIM** โดยเน้นการแสดงผลข้อมูลตามมาตรฐาน **IFC (Industry Foundation Classes)** ผ่านเว็บแอปพลิเคชันและ Blender Add-on

## 2. Technical Scope
ฐานข้อมูลครอบคลุมเครื่องปรับอากาศหลายซีรีส์:

### TGF Series (Fix Speed)
- 1-Way Cassette, Under Ceiling, 4-Way Cassette, Ducted

### TGV Series (Inverter)
- XPower Inverter - Under Ceiling (TGV-CP)

### TGEV Series (New Inverter)
- XPower TGEV Series - Inverter Under Ceiling, 4-Way Cassette

### Data Details:
- **Performance:** Nominal Cooling Capacity (BTU/hr), SEER, Power Consumption (kW)
- **Electrical:** Voltage (V), Phase, Frequency (Hz), Operating Current (A)
- **Physical:** Dimensions (HxWxD mm), Net Weight (kg) ทั้ง Indoor และ Outdoor
- **Mechanical:** Refrigerant Type (R32), Compressor Type (Rotary/Inverter), Pipe Sizes

## 3. Project Structure

```text
carrier-hvac-bim-suite/
├── catalogs/               # ต้นฉบับ PDF Catalogs จาก Carrier
├── data/                   # ฐานข้อมูล .js (Single Source of Truth)
│   ├── data-tgf.js         # Fix Speed Series
│   ├── data-tgv.js         # Inverter Series
│   └── data-tgev.js        # New Inverter Series
├── docs/                   # เอกสารประกอบโครงการ
│   ├── catalog-to-ifc.md
│   └── create-blender-addon.md
├── src/                    # Source Code
│   ├── blender_addon/      # Blender Add-on (carrier_bim_tools.py)
│   ├── web_catalog/        # Web Catalog Viewer
│   └── extractor/          # PDF Data Extractor
├── blender_files/          # ไฟล์ตัวอย่าง .blend
└── README.md               # คู่มือการใช้งานภาพรวม
```

## 4. IFC Mapping Schema & Connectivity

ข้อมูลถูกจัดกลุ่มตามมาตรฐาน IFC และเพิ่มการเชื่อมโยงระบบ (System Connectivity):

### A. Identity & Linking
- **IfcEntityType:** `IfcUnitaryControlElement` (FCU) / `IfcCondensingUnit` (CDU)
- **IfcTag:** รหัสรุ่นสินค้า
- **System_ID:** รหัสรันสุ่ม (SYS-XXXX) ที่เหมือนกันทั้งใน FCU และ CDU เพื่อใช้ในการจับคู่ระบบ (Matching) ในซอฟต์แวร์ BIM อื่นๆ
- **Indoor_Model / Outdoor_Model:** การอ้างอิงรุ่นที่คู่กันแบบ Cross-Reference

### B. Property Sets (Pset_Carrier)
- **Identity:** Brand, Series, Model, Type
- **Performance:** Capacity (BTU), SEER, Power (kW)
- **Physical:** Dimensions (mm), Weight (kg)
- **Technical:** Refrigerant, Pipe Sizes, Compressor Type

## 6. How to Update Data
1. วางไฟล์ PDF ใหม่ใน `catalogs/`
2. แก้ไขไฟล์ `data/data-xxx.js` หรือสร้างไฟล์ใหม่ตามรูปแบบมาตรฐาน
3. ใน Blender ให้กดปุ่ม **Refresh Data** เพื่อโหลดข้อมูลใหม่
