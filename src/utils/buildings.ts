// ============================================================
// Building Registry — AAD FM Multi-Building Support
// ============================================================
// เพิ่มอาคารใหม่แค่เติม object ใน buildings array
// ไฟล์นี้ใช้เป็น source of truth สำหรับ:
//   - Landing page (แสดง card อาคาร)
//   - Building Selector (dropdown ที่ Header)
//   - Scene.tsx (โหลด GLB ตามอาคาร)
//   - Fallback UI (ถ้าไม่มี GLB)
// ============================================================

export interface Building {
  /** รหัสอาคาร เช่น "AR15", "AR19" */
  code: string
  /** ชื่อภาษาไทยเต็ม */
  name: string
  /** ชื่อไฟล์ GLB ใน public/models/ — ถ้าว่างแปลว่าไม่มี 3D model */
  glb: string
  /** จำนวนชั้น */
  floors: number
  /** มี 3D model หรือไม่ */
  hasModel: boolean
}

export const buildings: Building[] = [
  { code: "AR01", name: "อาคารทรงไทย",       glb: "", floors: 2, hasModel: false },
  { code: "AR02", name: "สำนักงานคณบดี",      glb: "", floors: 2, hasModel: false },
  { code: "AR03", name: "อาคารกลางน้ำ",       glb: "", floors: 2, hasModel: false },
  { code: "AR04", name: "อาคารเรียน ศอ.",     glb: "", floors: 2, hasModel: false },
  { code: "AR05", name: "อาคารเรียน สถ.",     glb: "", floors: 2, hasModel: false },
  { code: "AR06", name: "ตึก 4 ชั้น",          glb: "", floors: 4, hasModel: false },
  { code: "AR07", name: "อาคารเรียน สน.",     glb: "", floors: 2, hasModel: false },
  { code: "AR08", name: "หอประชุม, ผังเมือง",  glb: "", floors: 2, hasModel: false },
  { code: "AR09", name: "เรียนรวม",           glb: "", floors: 4, hasModel: false },
  { code: "AR10", name: "x",                  glb: "", floors: 0, hasModel: false },
  { code: "AR11", name: "วิจิตรศิลป์",         glb: "", floors: 4, hasModel: false },
  { code: "AR12", name: "shop พลังงาน",       glb: "", floors: 2, hasModel: false },
  { code: "AR13", name: "shop ไม้ สถ",        glb: "", floors: 2, hasModel: false },
  { code: "AR14", name: "x",                  glb: "", floors: 2, hasModel: false },
  { code: "AR15", name: "shop ดำ",            glb: "ar15-302.glb", floors: 2, hasModel: true },
  { code: "AR16", name: "shop ไม้ สน",        glb: "", floors: 2, hasModel: false },
  { code: "AR17", name: "shop ส้มเล็ก",        glb: "", floors: 2, hasModel: false },
  { code: "AR18", name: "x",                  glb: "", floors: 2, hasModel: false },
  { code: "AR19", name: "x",                  glb: "", floors: 2, hasModel: false },
  { code: "AR20", name: "shop ส้ม",           glb: "", floors: 2, hasModel: false },
  { code: "AR21", name: "x",                  glb: "", floors: 2, hasModel: false },
  { code: "AR22", name: "x",                  glb: "", floors: 2, hasModel: false },
  { code: "AR23", name: "shop พลาสติก",       glb: "", floors: 2, hasModel: false },
  { code: "AR24", name: "shop เหล็ก",         glb: "", floors: 2, hasModel: false },
  { code: "AR25", name: "shop ไม้",           glb: "", floors: 2, hasModel: false },
  { code: "AR26", name: "x",                  glb: "", floors: 1, hasModel: false },
  { code: "AR27", name: "โรงอาหาร",           glb: "", floors: 1, hasModel: false },
  { code: "AR28", name: "x",                  glb: "", floors: 1, hasModel: false },
  { code: "AR29", name: "โถงกลาง บูรณาการ",   glb: "", floors: 5, hasModel: false },
  { code: "AR30", name: "x",                  glb: "", floors: 1, hasModel: false },
  { code: "AR31", name: "โรงถ่ายภาพยนต์",     glb: "", floors: 1, hasModel: false },
]

/** ค้นหาอาคารจากรหัส */
export function getBuilding(code: string): Building | undefined {
  for (let i = 0; i < buildings.length; i++) {
    if (buildings[i].code === code) return buildings[i]
  }
  return undefined
}

/** รายชื่อรหัสอาคารทั้งหมด */
export const buildingCodes = buildings.map((b) => b.code)
