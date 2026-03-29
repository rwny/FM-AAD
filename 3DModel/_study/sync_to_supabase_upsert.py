import os
import re
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Load Environment Variables from .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
    exit(1)

supabase: Client = create_client(url, key)

def parse_md_hierarchy(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        raw_lines = f.readlines()

    # Combine multi-line structures (lines that don't start with a dash)
    lines = []
    for line in raw_lines:
        if re.match(r'^\s*-', line):
            lines.append(line.rstrip('\n'))
        else:
            if lines and line.strip():
                lines[-1] += " " + line.strip()

    triplets = []
    stack = []
    nodes = {} # dict of clean_name -> metadata

    for line in lines:
        match = re.match(r'^(\s*)-\s*(.*)', line)
        if not match:
            continue
            
        indentation = match.group(1)
        level = len(indentation)
        raw_text = match.group(2).strip()
        
        metadata = {}
        
        # 1. Parse loose bracket { Key: Value, ... }
        json_match = re.search(r'\{(.*?)\}', raw_text)
        if json_match:
            inner_text = json_match.group(1)
            pairs = inner_text.split(',')
            for pair in pairs:
                if ':' in pair:
                    k, v = pair.split(':', 1)
                    k_clean = k.strip().lower() # e.g. 'type', 'assetid', 'installdate'
                    if k_clean == 'assetid':
                        metadata['asset_id'] = v.strip()
                    elif k_clean == 'type':
                        metadata['ac_type'] = v.strip()
                    elif k_clean == 'installdate':
                        metadata['install_date'] = v.strip().strip('"\'')
                    elif k_clean == 'connectsto':
                        val = v.strip().strip('"\'')
                        metadata['connects_to'] = [x.strip() for x in val.split(',') if x.strip()]
                    elif k_clean == 'connectsfrom':
                        val = v.strip().strip('"\'')
                        metadata['connects_from'] = [x.strip() for x in val.split(',') if x.strip()]
                    else:
                        metadata[k_clean] = v.strip().strip('"\'')
            raw_text = raw_text.replace(json_match.group(0), '').strip()
            
        # 2. ค้นหาและดึง Type เดิม (เผื่อยังมีอันเก่า) (Type: 42TGF0361CP)
        type_match = re.search(r'\(Type:\s*([^)]+)\)', raw_text)
        if type_match:
            metadata['ac_type'] = type_match.group(1).strip()
            raw_text = raw_text.replace(type_match.group(0), '').strip()
            
        # 3. ค้นหาและดึง Asset ID เดิม [AssetID: ...]
        asset_match = re.search(r'\[(?:AssetID:\s*)?([^\]]+)\]', raw_text)
        if asset_match:
            metadata['asset_id'] = asset_match.group(1).strip()
            raw_text = raw_text.replace(asset_match.group(0), '').strip()
            
        # 4. ล้าง Tag ที่อาจจะตกค้าง เช่น (AC)
        tag_match = re.search(r'\(([^)]+)\)', raw_text)
        if tag_match:
            metadata['tag'] = tag_match.group(1).strip()
            raw_text = raw_text.replace(tag_match.group(0), '').strip()
            
        node_name = raw_text.strip()
        
        # จัดเก็บ Model Type ให้ดูง่าย
        node_category = "unknown"
        if "FCU" in node_name: node_category = "fcu"
        elif "CDU" in node_name: node_category = "cdu"
        elif "AC-" in node_name: node_category = "ac_set"
        elif "room" in node_name.lower() or node_name.isdigit(): node_category = "room"
        elif "floor" in node_name.lower(): node_category = "floor"
        elif "ar" in node_name.lower(): node_category = "building"
            
        nodes[node_name] = {
            "type": node_category,
            "metadata": metadata
        }

        # จัดการลำดับความสัมพันธ์ Parent-Child
        while stack and stack[-1][0] >= level:
            stack.pop()

        if stack:
            parent_level, parent_name = stack[-1]
            triplets.append((parent_name, "contains", node_name))

        stack.append((level, node_name))

    return nodes, triplets

def sync():
    md_file = os.path.join(os.path.dirname(__file__), "ac.md")
    print(f"Reading {md_file}...")
    
    nodes_data, triplets = parse_md_hierarchy(md_file)
    print(f"พบข้อมูล {len(nodes_data)} จุด และความเชื่อมโยง {len(triplets)} เส้นทาง")

    print("\n[1/2] กำลังอัปเดต Nodes รหัสครุภัณฑ์ & สเปค ขึ้น Supabase...")
    for name, data in nodes_data.items():
        supabase.table("kg_nodes").upsert(
            {
                "name": name, 
                "type": data["type"],
                "metadata": data["metadata"]
            },
            on_conflict="name"
        ).execute()

    # Get UUID mappings
    res = supabase.table("kg_nodes").select("id, name").execute()
    name_to_id = {item['name']: item['id'] for item in res.data}

    print("[2/2] กำลังขึงเส้นความเชื่อมโยง (Edges)...")
    # Additional cross-links for pipes
    for name, data in nodes_data.items():
        if 'connects_to' in data['metadata']:
            for target in data['metadata']['connects_to']:
                triplets.append((name, "connectsTo", target))
        if 'connects_from' in data['metadata']:
            for target in data['metadata']['connects_from']:
                # Connect FROM means target starts the connection to our current node
                triplets.append((target, "connectsTo", name))

    edge_data = []
    for sub, pred, obj in triplets:
        if sub in name_to_id and obj in name_to_id:
            edge_data.append({
                "subject_id": name_to_id[sub],
                "predicate": pred,
                "object_id": name_to_id[obj]
            })

    if edge_data:
        involved_ids = list(name_to_id.values())
        supabase.table("kg_edges").delete().in_("subject_id", involved_ids).execute()
        
        # ตัดแบ่งเซ็ตให้เซฟเร็วขึ้น (Batch) ในกรณีข้อมูลเยอะ
        batch_size = 50
        for i in range(0, len(edge_data), batch_size):
            supabase.table("kg_edges").insert(edge_data[i:i+batch_size]).execute()

    print("[3/3] กำลังค้นหาและทำความสะอาดโหนดขยะ (อุกกาบาตลอยคว้าง)...")
    # หา Node ทั้งหมดที่มีสายเชื่อมโยง
    all_edges = supabase.table("kg_edges").select("subject_id, object_id").execute()
    connected_ids = set()
    for e in all_edges.data:
        connected_ids.add(e["subject_id"])
        connected_ids.add(e["object_id"])

    # หา Node ทั้งหมดในระบบ
    all_nodes = supabase.table("kg_nodes").select("id, name").execute()
    orphan_ids = []
    
    for n in all_nodes.data:
        if n["id"] not in connected_ids:
            orphan_ids.append(n["id"])
            print(f"  🗑️ พบวงกลมไม่มีสายเชื่อม (ลบทิ้ง): {n['name']}")

    if orphan_ids:
        supabase.table("kg_nodes").delete().in_("id", orphan_ids).execute()
        print(f"ทำความสะอาดวงกลมเปล่าสำเร็จ {len(orphan_ids)} วง!")
    else:
        print("  ✨ ไม่พบวงกลมขยะ ทุกวงเกาะกลุ่มกันเรียบร้อยดี!")

    print("\n✅ ระบบอัปเดต Data เข้า Supabase เสร็จสมบูรณ์แล้ว!")

if __name__ == "__main__":
    sync()
