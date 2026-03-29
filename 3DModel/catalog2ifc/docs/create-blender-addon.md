# Carrier HVAC Blender Add-on

Add-on สำหรับ Blender นี้ถูกออกแบบมาเพื่อช่วยวิศวกรและสถาปนิกในการสร้างแบบจำลอง 3D ของเครื่องปรับอากาศ Carrier พร้อมข้อมูลทางเทคนิคที่ถูกต้อง (Digital Twin) และพร้อมสำหรับการส่งออกในรูปแบบ OpenBIM (IFC)

## 1. คุณสมบัติหลัก (Key Features)
- **Dynamic Data Loading:** โหลดข้อมูลจาก `/data/*.js` อัตโนมัติ รองรับหลาย Series
- **Auto-Geometry Generation:** สร้างโมเดลตามขนาดจริง (W x D x H)
- **Smart Positioning:** วาง FCU ที่ระดับเพดาน (2.5m) และ CDU ที่ระดับพื้นอัตโนมัติ
- **BIM Linking (System ID):** สร้างรหัสจับคู่ระบบเพื่อให้ FCU และ CDU เชื่อมโยงกันได้ในโปรแกรม BIM เช่น Revit หรือ Navisworks

## 2. การติดตั้ง (Installation)
1. เปิด Blender
2. ไปที่ `Edit > Preferences > Add-ons`
3. กดปุ่ม `Install...`
4. เลือกไฟล์ `src/blender_addon/carrier_bim_tools.py`
5. เปิดใช้งาน Add-on และกดปุ่ม **Refresh Data** ใน Sidebar

## 3. การใช้งาน (Usage)
1. **Sidebar:** กดปุ่ม `N` เลือกแถบ **Carrier**
2. **Reload:** กดปุ่ม **Refresh Data** เพื่อโหลดไฟล์จากโฟลเดอร์ `data/`
3. **Select:** เลือก **Series** และ **Model** ที่ต้องการ
4. **Create:** กด **Create AC Units** 
   - ระบบจะสร้าง `FCU_...` และ `CDU_...`
   - ทั้งคู่จะมี `System_ID` เดียวกันใน Custom Properties

## 4. ข้อมูล IFC ที่ได้รับ
วัตถุที่สร้างขึ้นจะมี Custom Properties ดังนี้:
- `IfcEntityType`: เช่น `IfcUnitaryEquipment`
- `ObjectType`: ประเภทเครื่องปรับอากาศ
- `Pset_Carrier.NominalCoolingCapacity`: ค่า BTU
- `Pset_Carrier.SEER`: ค่าประสิทธิภาพพลังงาน
- ข้อมูลอื่นๆ เช่น ขนาดท่อน้ำยา, น้ำหนัก และชนิดคอมเพรสเซอร์

## 5. การพัฒนาต่อยอด
- เชื่อมต่อกับ BlenderBIM Add-on เพื่อแปลงเป็นไฟล์ .ifc โดยตรง
- เพิ่มโมเดล 3D แบบละเอียด (Mesh) แทนกล่องสี่เหลี่ยม
- เพิ่มการคำนวณระยะห่างในการติดตั้ง (Installation Clearance)
