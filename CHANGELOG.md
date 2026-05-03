# CHANGELOG — 2026-05-03

## Dashboard Redesign
- Reorder mode icons: AC → AR → FUR → EE
- Sidebar header: `AAD · AR15` (text-2xl)
- Dashboard titles by view: Asset Master / Work Orders / Appointments / Service Calendar
- Stats buttons (Systems/Health/Maintenance/Faulty) always visible
- Appointment timeline visible on all dashboard pages
- Fullscreen dashboard (no padding/border-radius)
- WO columns plain text, no wrap
- Status columns widened to `w-36` (fits "In Progress")
- Components column: text mode, `w-[260px]`

## CSV/XLSX Export
- 15 columns: Brand, BTU, Capacity, FCU/CDU status
- Download adapts to current view, filenames vary by view
- XLSX export via `xlsx` library

## WO Number System
- Sequential: `WO-2026-0001`, `WO-2026-0002`...
- DB-backed via Supabase RPC (atomic, multi-user)
- Generated on Save (no gaps from cancelled modals)
- Auto-reset per year

## AC Sidebar
- Merged ID + Spec into one card
- Shows ALL logs, no page limit
- Issue text on first line, date secondary
- Next Service: one-line + day countdown (35d)
- Hover date shows reason (overdue/soon/normal)

## Service Log
- Appointment Date field added to AddLogModal
- Delete button (Ctrl+Alt+A to show/hide)
- Status determined by dropdown selection, not keyword matching
- RLS DELETE policy added for log deletion

## Report (Print/PDF)
- Organization header: คณะสถาปัตยกรรม ศิลปะและการออกแบบ / School of Architecture, Art and Design
- WO number top-right
- Report popup overlays dashboard (ESC 3-layer)
- X button hidden on print

## Misc
- Vercel Analytics integration
- 3D directional lights rotate slowly (0.001 rad/s)
- Search placeholder: "Search..."
- Search box: amber-tinted background
- WO list rows clickable → view report
- `getStatusBg()` handles all statuses (Completed, In Progress, Pending, etc.)
- AR19 building data added
