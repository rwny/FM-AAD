# Master Dashboard — ดูทั้งคณะ 30 อาคาร

> idea: เราอยากเห็นภาพรวมระบบ AC + EE ทั้งคณะในหน้าเดียว

---

## 🎯 เป้าหมาย

- เห็นภาพรวม AC 30 อาคาร: กี่เครื่อง Normal / Maintenance / Faulty
- เห็นระบบไฟ: ตู้ไฟ DB, LoadPanel, จุดจ่ายไฟ
- เปรียบเทียบข้ามอาคารได้
- คลิกเข้าไปดูรายละเอียดอาคารนั้นได้

---

## 🧱 แนวทาง

### A. เพิ่มเป็น Mode ใหม่ — `Master`
มี 5 mode อยู่แล้ว (AC, AR, Fur, EE, KG) → เพิ่ม `Master`

### B. Page แยก `/master`
เข้าได้จาก Header หรือ Landing page

### C. ใช้ KG (Knowledge Graph)
ข้อมูลทุกอาคารอยู่ใน kg_nodes/kg_edges → query ทั้งหมด → แสดงภาพรวม

---

## 📋 งาน

### M1 — Master Dashboard component
- Grid/banner แสดง summary: รวม AC ทั้งหมด, Normal, Faulty
- ตาราง per-building: AR01–AR31 แถวละอาคาร แสดง AC status
- คลิกแถว → `/AR15/ac`

### M2 — ดึงข้อมูลทุกอาคาร
- ใช้ `fetchAllACLogs()` (มีอยู่แล้ว) + `kg_nodes` ฟิลเตอร์เป็น %
- หรือ query Supabase โดยตรง

### M3 — เพิ่ม route + link
- `/master` → MasterDashboard
- Link จาก Landing page + Header

---

## 🤔 คำถามก่อนเริ่ม

1. **Mode ใหม่ หรือ Page แยก?** Mode = เพิ่มใน sidebar/mode switcher. Page แยก = ง่ายกว่า

2. **เน้นอะไร?** AC overview อย่างเดียว? หรือรวม EE/FUR ด้วย?

3. **Source?** ใช้ Supabase อย่างเดียว (real data)? หรือรวม building registry?

---

## ⏱ ประมาณเวลา
- M1: 30 นาที (UI design + component)
- M2: 15 นาที (data query)
- M3: 10 นาที (routing)
- รวม ~1 ชม
