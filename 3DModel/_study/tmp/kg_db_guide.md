# คู่มือการเปลี่ยนจาก JSON เป็น "Real Database" สำหรับ Knowledge Graph

หากคุณต้องการขยับจากการใช้ JSON ไฟล์เดียว ไปเป็นระบบฐานข้อมูล (Database) จริงๆ จะมีการเลือกใช้ได้ 2 แนวทางหลักที่นิยมในปัจจุบัน ดังนี้:

## 1. แนวทางที่ 1: Graph Database (เช่น Neo4j)
นี่คือความหมายตรงตัวของ "Knowledge Graph" เพราะข้อมูลเก็บในรูปแบบ Node และ Relation จริงๆ

*   **ข้อดี:** ค้นหาความสัมพันธ์ที่ซับซ้อนได้รวดเร็วมาก (เช่น "หา AC ทุกตัวที่อยู่ในตึกนี้ โดยไม่ต้อง Join ตาราง")
*   **ภาษาที่ใช้:** Cypher Query Language (CQL)
*   **คำสั่งตัวอย่าง:**
    ```cypher
    CREATE (f:Floor {name: 'floor-1'})-[:CONTAINS]->(r:Room {name: 'room-101'})
    ```

## 2. แนวทางที่ 2: Relational Database (เช่น SQLite / PostgreSQL)
ใช้ตารางแบบปกติ แต่ใช้เทคนิค **Parent-Child Mapping** (Adjacency List) แทน

*   **ข้อดี:** ง่าย, ไม่ต้องติดตั้ง Server (ถ้าใช้ SQLite), ใช้งานร่วมกับ Web App (React/Node.js) ที่มีอยู่ได้ง่าย
*   **โครงสร้างตาราง:**
    | id | name | parent_id | type |
    |---|---|---|---|
    | 1 | ar15 | NULL | building |
    | 2 | floor-1 | 1 | floor |
    | 3 | room-101 | 2 | room |

---

## ขั้นตอนที่ต้องทำต่อ (Next Steps) สำหรับคุณ:

### ✅ ขั้นที่ 1: ติดตั้ง SQLite และแปลงข้อมูลลง DB
ผมจะสร้าง Script `migrate_to_sqlite.py` ให้คุณเพื่อนำข้อมูลจาก `kg_output.json` เข้าสู่ไฟล์ฐานข้อมูล `building_kg.db` จริงๆ

### ✅ ขั้นที่ 2: สร้าง API หรือตัวเชื่อมต่อ
เมื่อข้อมูลอยู่ใน DB แล้ว คุณจะสามารถเขียนโค้ด SQL เพื่อดึงข้อมูลเฉพาะส่วนได้ เช่น:
```sql
SELECT * FROM nodes WHERE parent_id = (SELECT id FROM nodes WHERE name = 'room-101')
```

### ✅ ขั้นที่ 3: เชื่อมต่อกับ React (ถ้าต้องการ)
สร้าง API (Express.js) เพื่อให้หน้าเว็บของคุณสามารถ Query ข้อมูลจาก DB นี้มาแสดงผลแบบ Dynamic ได้

---

**คุณต้องการให้ผมสร้าง `migrate_to_sqlite.py` เพื่อลองสร้าง SQLite DB ของจริงเลยไหมครับ?**
