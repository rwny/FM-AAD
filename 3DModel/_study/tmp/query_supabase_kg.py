import os
from dotenv import load_dotenv
from supabase import create_client, Client

# โหลด Environment Variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

def preview_data():
    print("🔍 กำลังดึงข้อมูล Knowledge Graph จาก Supabase...\n")
    
    # ดึงข้อมูล Nodes
    nodes_res = supabase.table("kg_nodes").select("id, name, type, metadata").execute()
    nodes = nodes_res.data
    id_to_name = {n['id']: f"{n['name']} ({n['type']})" for n in nodes}
    
    print(f"📦 พบ Node ทั้งหมด: {len(nodes)} รายการ (ตัวอย่างตึก, ชั้น, ห้อง, แอร์)")
    
    # ดึงข้อมูล Edges
    edges_res = supabase.table("kg_edges").select("subject_id, predicate, object_id").execute()
    edges = edges_res.data
    
    print(f"🔗 พบความสัมพันธ์ทั้งหมด: {len(edges)} เส้นทาง\n")
    
    print("=== ตัวอย่างโครงสร้าง (15 รายการแรก) ===")
    for edge in edges[:15]:
        subject_name = id_to_name.get(edge['subject_id'], "Unknown")
        object_name = id_to_name.get(edge['object_id'], "Unknown")
        predicate = edge['predicate']
        
        print(f"[{subject_name}] --({predicate})--> [{object_name}]")
        
    if len(edges) > 15:
        print(f"... และความสัมพันธ์อื่นๆ อีก {len(edges) - 15} รายการ")
        
    print("\n✅ คุณสามารถนำข้อมูลโครงสร้างนี้ไปใช้ Response เป็น JSON หรือวาด Graph Visualization กราฟิกได้เลยครับ")

if __name__ == "__main__":
    preview_data()
