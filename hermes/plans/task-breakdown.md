# AAD FM — Multi-Building Expansion: Task Breakdown

> แบ่งงานขยายระบบจาก 1 อาคาร (AR15) → รองรับ 30+ อาคาร
> อ้างอิงจาก codebase ที่มีอยู่

---

## 📊 สรุป Dependency Graph

```
Phase 0 — Foundation (ไม่มี dependencies)
  A1: buildings.json
  A2: Building type

Phase 1 — UI + Routing (ขึ้นกับ A1, A2)
  B1: Landing page (/)
  B2: Building Selector ใน Header
  B3: Dashboard filter by building

Phase 2 — 3D Model (ขึ้นกับ A1)
  C1: ปรับ Scene.tsx GLB path
  C2: ปรับ BuildingModel.tsx preload
  C3: AR19 GLB model

Phase 3 — Data (ขึ้นกับ A1)
  D1: AR19 data เต็ม
  D2: AC Logs filter by building
  D3: KG nodes filter by building

Phase 4 — Polish
  E1: State cleanup ตอน switch building
  E2: Fallback UI เมื่อไม่มี GLB
  E3: 404 / building not found
```

---

## ✅ Phase 0 — Foundation (Base)

### A1: สร้าง buildings registry
**ไฟล์:** `src/utils/buildings.ts`  
**รายละเอียด:** ลงทะเบียนอาคารทั้งหมดที่มี

```typescript
export interface Building {
  code: string;        // "AR15"
  name: string;        // "อาคารเรียนรวม 15"
  glb: string;         // "ar15-302.glb"
  floors: number;      // 4
  hasModel: boolean;   // true = มี 3D, false = ใช้ fallback
}

export const buildings: Building[] = [
  { code: "AR15", name: "อาคารเรียนรวม 15", glb: "ar15-302.glb", floors: 4, hasModel: true },
  { code: "AR19", name: "อาคารเรียนรวม 19", glb: "", floors: 4, hasModel: false },
]
```

**ความอิสระ:** ไม่ขึ้นกับใคร ✅ ทำพร้อมงานอื่นได้  
**ไฟล์ที่กระทบ:** 1 ไฟล์ใหม่เท่านั้น

### A2: สร้าง Building type
**ไฟล์:** `src/types/bim.ts` (หรือไฟล์ใหม่ `src/types/building.ts`)  
**รายละเอียด:** ถ้ายังไม่มี type สำหรับ Building โดยเฉพาะ ให้เพิ่มเข้าไป

**ความอิสระ:** ขึ้นกับ A1 เล็กน้อย ✅

---

## 🚧 Phase 1 — UI + Routing

### B1: Landing page
**รายละเอียด:** เส้นทาง `/` → แสดง card อาคารทั้งหมด คลิกเลือก → ไป `/ar15/ac`

**ไฟล์ที่ต้องสร้าง/แก้:**
- `src/components/LandingPage.tsx` ← ใหม่
- `src/main.tsx` ← เพิ่ม Route `/` → LandingPage, `/*` → App
- `src/App.tsx` ← เช็คว่าถ้าไม่มี buildingCode ให้ redirect

**ความอิสระ:** ขึ้นกับ A1 ✅ — แต่**ห้ามทำพร้อม B2** (อาจชนกันที่ routing)

### B2: Building Selector ใน Header
**รายละเอียด:** dropdown เลือกอาคารที่ Top Bar (ข้างๆ "AAD · AR15")

**ไฟล์ที่ต้องแก้:**
- ค้นหา header component → เพิ่ม dropdown
- เรียก `setBuildingCode()` เมื่อเปลี่ยน

**ความอิสระ:** ขึ้นกับ A1 ✅ — แต่**ห้ามทำพร้อม B1**

### B3: Dashboard filter by building
**รายละเอียด:** ปัจจุบัน Dashboard แสดง AC logs ของทุกอาคาร → ควร filter เฉพาะอาคารที่เลือก

**ไฟล์ที่ต้องแก้:**
- `src/hooks/useDatabase.ts` — filter `fetchAllACLogs()` by buildingCode
- `src/utils/supabase.ts` — เพิ่ม `fetchACLogsByBuilding(buildingCode)`

**ความอิสระ:** ✅ ทำพร้อม B1, B2 ได้

---

## 🎮 Phase 2 — 3D Model

### C1: ปรับ Scene.tsx GLB path
**รายละเอียด:** เปลี่ยนจาก hardcode pattern `/models/${code}-302.glb` เป็นอ่านจาก buildings registry

**ไฟล์ที่ต้องแก้:**
- `src/components/3d/Scene.tsx` บรรทัด 21 — อ่าน glb path จาก `buildings.ts`

### C2: ปรับ BuildingModel.tsx preload
**ไฟล์:**
- `src/components/3d/BuildingModel.tsx` บรรทัด 789 — เปลี่ยน `useGLTF.preload('/models/ar15-302.glb')` ให้ preload ทุก model

### C3: AR19 GLB model
**รายละเอียด:** ต้องมี GLB ของ AR19 ด้วย — งาน Blender ไม่ใช่ code

**ความอิสระ:** ✅ ทำพร้อม Code tasks ได้

---

## 📦 Phase 3 — Data

### D1: AR19 data content
**รายละเอียด:** ปัจจุบัน AR19 มี floor-1.md แค่ 11 บรรทัด (AR15 มี 172) — ต้องเพิ่ม room/asset data

### D2: AC Logs filter by building
**รายละเอียด:** สร้างฟังก์ชัน `fetchACLogsByBuilding(buildingCode)` ใน supabase.ts

**วิธีทำ:** Query `ac_maintenance_logs` JOIN `ac_assets` WHERE `ar_id` LIKE `${buildingCode}-%`  
หรือเพิ่ม `building_code` column ลงใน `ac_maintenance_logs`

**ไฟล์:**
- `src/utils/supabase.ts`
- `src/hooks/useDatabase.ts`

### D3: KG nodes filter by building
**รายละเอียด:** `supabase.from('kg_nodes').select('*')` ปัจจุบันดึงทุก node  
เปลี่ยนเป็น `.ilike('name', '${buildingCode}-%')`

**ไฟล์:**
- `src/hooks/useDatabase.ts`

---

## ✨ Phase 4 — Polish

### E1: State cleanup ตอน switch building
**รายละเอียด:** เมื่อเปลี่ยนอาคาร ต้อง reset state พวกนี้:
- `rooms: []`
- `acAssets: []`
- `selectedRoomId: null`
- `selectedLog: null`
- `clipFloor: null`

**ไฟล์:**
- `src/store.ts` — เพิ่ม action `resetState()` หรือ `switchBuilding(code)`

### E2: Fallback UI เมื่อไม่มี GLB
**รายละเอียด:** ถ้า `hasModel: false` → แสดง floor plan, ข้อความ, หรือแค่ side panel + KG

**ไฟล์:**
- `src/components/3d/Scene.tsx`
- `src/components/3d/BuildingModel.tsx`

### E3: 404 / building not found
**รายละเอียด:** URL `/ar99/ac` → หน้าบอกว่าไม่มีอาคารนี้ พร้อมลิงก์กลับไปหน้าแรก

**ไฟล์:**
- `src/components/NotFoundPage.tsx` ← ใหม่

---

## 🗺️ แผนการรัน (Execution Order)

### เส้นทาง A — ทำทีละงาน (Manual sequential)
```
A1 → A2 → B1 → B2 → B3 → C1 → C2 → D2 → D3 → E1 → E2 → E3
                                                            แล้วค่อย D1 + C3
```
**ใช้เวลา:** ~2-3 วัน (งานละ 20-40 นาที)

### เส้นทาง B — Multi-Agent (parallel batches)
```
Batch 1 (พร้อมกัน):
  Agent 1: A1 buildings.json
  Agent 2: D2 AC Logs filter
  Agent 3: D3 KG filter
  Agent 4: C1 Scene.tsx GLB path
  ✅ ไม่มีไฟล์ซ้ำกัน

Batch 2 (พร้อมกัน):
  Agent 1: B1 Landing page + routing
  Agent 2: B2 Building Selector
  Agent 3: C2 Preload fix
  ✅ B1 กับ B2 แก้ routing คนละส่วน

Batch 3 (ตามลำดับ):
  Agent 1: B3 Dashboard filter (ต่อจาก D2)
  Agent 2: E1 State cleanup
  Agent 3: E2 Fallback UI
  Agent 4: E3 Not found page

Batch 4 (แยก):
  Agent 1: D1 AR19 data content
  Agent 2: C3 AR19 GLB model (Blender)
```
**ใช้เวลา:** ~วันครึ่ง (ทำงาน 4 ตัวพร้อมกัน)

---

## 🛑 ข้อควรระวัง

| ห้ามทำพร้อมกัน | เพราะ |
|---------------|-------|
| B1 + B2 | แก้ routing (main.tsx) ไฟล์เดียวกัน |
| D2 + B3 | ใช้ไฟล์ useDatabase.ts ร่วมกัน |
| C1 + C2 | Scene.tsx + BuildingModel.tsx import กัน |
| 2 Agents แก้ App.tsx | ไฟล์ใหญ่ ชนกันง่าย |
