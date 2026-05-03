# 📈 Project Progress: FM_AR15 BIM Digital Twin

ไฟล์นี้บันทึกความคืบหน้าการพัฒนาและแผนงานในอนาคต (Update: 3 พฤษภาคม 2026)

---

## ✅ Session ล่าสุด (2-3 พฤษภาคม 2026)

### Architecture Refactor (branch: `refactor/architecture-cleanup` → merged to `main`)
- [x] **Split App.tsx** 575→270 บรรทัด (-52%) — แยก hooks: `useDatabase`, `useAssetMerger`, `useKeyboardShortcuts`
- [x] **Zustand** state management — 13 state + `switchMode` action, แทน prop drilling
- [x] **React Router** — `/ar15/ac/fcu-101-1` deep link, รองรับ 30 อาคาร
- [x] **Type Safety** — `any` ลด 33 จุด, สร้าง `src/types/database.ts` (ACLogRow, KGNodeRow, MergedACAsset, etc.)
- [x] **Code Splitting** — Vite manualChunks: three, r3f, supabase, graph (4 chunks)
- [x] **Error Boundary** — ครอบ 3D Canvas, กัน crash
- [x] **RLS on Supabase** — public read, auth write
- [x] **Remove Dynamic Import** — static import แทน `import('./supabase')`
- [x] **Tests** — 29 cases (`determineStatus`, `getPeerId`, `computeACStats`, `extractFurniture`, next-service logic)
- [x] **Remove `.claude/`** — -50,291 lines dead code
- [x] **BIMMode** — เพิ่ม `'Admin'`

### Design & FM Features (branch: `0503design`)
- [x] **Floating Top Bar** — Search แยกซ้าย, Mode icons + Dashboard + Toggle ขวา (ออกจาก sidebar)
- [x] **Clean Sidebar** — เหลือ header + data panel, ไม่มี mode/search/dashboard
- [x] **AC Card Redesign** — Brand:Model + Capacity ตัวใหญ่, ID card พื้นน้ำเงิน
- [x] **Timeline in Spec Card** — ฝังในแถว Install, ไม่แยกกล่อง
- [x] **Next Service Auto-Notify** — 🟠 90 วันก่อน due, 🔴 overdue (อัตโนมัติจาก install date +1 ปี)
- [x] **1-Click Mark Serviced** — ปุ่มใน spec card สร้าง Completed log ทันที
- [x] **Service Log Edit** — Edit จาก sidebar, pre-fill ฟอร์ม
- [x] **Latest Log Highlight** — แถวล่าสุดพื้นหลังตามสถานะ (emerald/amber/rose) + ขอบซ้าย 3px
- [x] **Clean Badges** — ตัวหนังสือไม่มีพื้นหลัง
- [x] **SystemTimeline Tooltip** — hover จุด → popup วันที่+อายุ+รายการ
- [x] **IFC Data Collapsible** — ล่างสุด กดเปิด
- [x] **AddLogModal Center Popup** — `createPortal` กลางจอ ไม่อยู่ใน sidebar
- [x] **Work Order Number** — auto-gen `WO-YYYY-NNN` ทุก log
- [x] **Cost Tracking** — ฟิลด์ cost (THB) ใน log
- [x] **Warranty Tracking** — `warranty_until` แสดงใน spec card
- [x] **Vendor Contact** — `contractor_contact` ใน log
- [x] **Planned Maintenance Calendar** — Dashboard toggle 📅, กลุ่มตามเดือน, สีตามสถานะ
- [x] **WO Search** — ค้นหาจาก WO number ใน global search + dashboard
- [x] **KG Cleanup** — ลบ `KGVisualizer.tsx` (2D dead code), ลบ `visualMode`, props แทน fetch ซ้ำ

### Theme Redesign (branch: `re-design-sidebar`)
- [x] **Dual-Theme System** — รองรับ Light (Ptolemaios White) และ Dark (Tactical Zinc/Black)
- [x] **Class-based Dark Mode** — Tailwind `darkMode: 'class'`, เปลี่ยนสถานะผ่าน `.dark` บน root
- [x] **Theme Toggle** — ปุ่ม Sun/Moon ใน top bar + shortcut 'T'
- [x] **Sidebar Theme** — Refactor sidebar + panels (Arch/AC) ให้เปลี่ยนตามโหมด (Neutral Dark Gray)
- [x] **Popups & Modals** — Refactor ProjectDashboard, Search, Report, AddLog ให้เป็น theme-aware (Zinc Palette)
- [x] **Global Styling** — ปรับ `index.css` (root bg, scrollbar) ให้ smooth ทุกโหมด

---

## ✅ สิ่งที่ทำเสร็จแล้วก่อนหน้านี้

### 1. Data Architecture
- [x] Static Specs (Markdown) → `ac-specs.json`
- [x] Automated Parser — `scripts/parse-ac-data.cjs`
- [x] Dynamic Logs (Supabase) — `ac_maintenance_logs`
- [x] FCU/CDU Peer matching — แชร์ประวัติซ่อมร่วมกัน
- [x] Data validation — `npm run data:check` (indent, brace, duplicate)

### 2. UI & UX
- [x] Standardized Typography — 3 ระดับ
- [x] Compact Log Format — 3 บรรทัด
- [x] Full-screen Modals — Detail View, Print Report
- [x] Enhanced Sidebar — Status Bullet ใหญ่

### 3. 3D Visualization & Status Logic
- [x] Live Status Mapping — 🟢 Normal / 🟠 Maintenance / 🔴 Faulty
- [x] Real-time color change เมื่อเพิ่ม log
- [x] Automatic Clipping Plane ตามชั้น

### 4. Database
- [x] Reporter Tracking
- [x] Precise Sorting by `created_at`

### 5. Knowledge Graph (v2.0)
- [x] Hierarchy + Radial layouts, 9 ระดับสี
- [x] Tactical Search + Fly-to
- [x] Terminal-based Navigation (Data Terminal + Acquisition EXE)
- [x] Status-aware coloring จาก maintenance logs
- [x] Transitive flow tracing สำหรับ sanitary

---

## 🚀 แผนการพัฒนาในอนาคต

### 🛠️ ระยะสั้น
1. **QR Code** — Gen QR สำหรับแอร์แต่ละเครื่อง
2. **Image Attachment** — แนบรูปใน log
3. **Bi-directional Sync** — คลิก KG → 3D focus, คลิก 3D → KG focus
4. **Multi-Building Compare** — เทียบ AR15 vs AR1 vs AR30

### 🌐 ระยะยาว
1. **CCTV Integration** — Live RTSP feed ใน 3D
2. **Predictive Maintenance** — Sensor อุณหภูมิ/กระแสไฟ
3. **X-Ray View** — ผนังโปร่งแสงเห็นงานระบบ
4. **Mobile App** — สำหรับช่างหน้างาน
