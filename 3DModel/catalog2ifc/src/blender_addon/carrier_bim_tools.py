bl_info = {
    "name": "Carrier HVAC Generator",
    "author": "Gemini CLI",
    "version": (1, 2),
    "blender": (3, 0, 0),
    "location": "View3D > Sidebar > Carrier HVAC",
    "description": "Generate Indoor and Outdoor AC units with IFC Data from JS catalogs",
    "category": "Mesh",
}

import bpy
import json
import re
import os

# --- 1. GLOBAL DATA LOADING ---

ALL_CATALOG_DATA = {}

def load_catalogs():
    """Load and parse JS data files into the global dictionary."""
    global ALL_CATALOG_DATA
    ALL_CATALOG_DATA = {}
    
    # Use the directory where the .blend file is saved
    base_path = bpy.path.abspath("//")
    if not base_path or not os.path.exists(base_path):
        base_path = os.getcwd()
    
    # Also look in ../../data/ relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    
    search_paths = [base_path, data_path]
    print(f"Searching for catalogs in: {search_paths}")
    
    found_files = []
    for path in search_paths:
        if not os.path.exists(path): continue
        try:
            files = [f for f in os.listdir(path) if f.startswith("data-") and f.endswith(".js")]
            for filename in files:
                filepath = os.path.join(path, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Robust regex to find the object assignment
                    match = re.search(r"=\s*(\{.*\});", content, re.DOTALL)
                    if match:
                        js_obj = match.group(1)
                        
                        # Clean up comments (simple)
                        js_obj = re.sub(r'//.*', '', js_obj)
                        
                        # Convert JS to JSON
                        # 1. Quote keys
                        json_str = re.sub(r'(\n\s*|\{\s*|,\s*)(\w+)\s*:', r'\1"\2":', js_obj)
                        # 2. Replace single quotes
                        json_str = json_str.replace("'", '"')
                        # 3. Remove trailing commas
                        json_str = re.sub(r",\s*([\]}])", r"\1", json_str)
                        
                        data = json.loads(json_str)
                        series_name = data.get("name", filename)
                        ALL_CATALOG_DATA[series_name] = data
                        found_files.append(filename)
                except Exception as e:
                    print(f"Error loading {filename}: {e}")
        except Exception as e:
            print(f"Error listing directory: {e}")
        
    print(f"Loaded {len(ALL_CATALOG_DATA)} catalogs: {', '.join(ALL_CATALOG_DATA.keys())}")
    return found_files

# --- 2. PROPERTY GROUPS ---

def get_series_items(self, context):
    if not ALL_CATALOG_DATA:
        load_catalogs()
    
    items = []
    for name in sorted(ALL_CATALOG_DATA.keys()):
        items.append((name, name, ""))
    
    if not items:
        items.append(("NONE", "No Data Found", ""))
    return items

def get_model_items(self, context):
    props = context.scene.carrier_hvac_props
    series = props.series
    
    items = []
    if series in ALL_CATALOG_DATA:
        models = ALL_CATALOG_DATA[series].get('models', {})
        for m_id in sorted(models.keys()):
            type_name = models[m_id].get("Type", "")
            items.append((m_id, m_id, type_name))
            
    if not items:
        items.append(("NONE", "No Models Found", ""))
    return items

class CarrierHVACProperties(bpy.types.PropertyGroup):
    series: bpy.props.EnumProperty(
        name="Series",
        items=get_series_items
    )
    model: bpy.props.EnumProperty(
        name="Model",
        items=get_model_items
    )

# --- 3. OPERATORS ---

class MESH_OT_carrier_create(bpy.types.Operator):
    """Generate Indoor and Outdoor AC Units"""
    bl_idname = "mesh.carrier_create"
    bl_label = "Create AC Units"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        props = context.scene.carrier_hvac_props
        series = props.series
        model_id = props.model
        
        if series == "NONE" or model_id == "NONE":
            self.report({'ERROR'}, "Please select a valid series and model.")
            return {'CANCELLED'}
            
        data = ALL_CATALOG_DATA[series]['models'][model_id]
        
        # สร้าง System ID สั้นๆ เพื่อใช้จับคู่ (เช่น SYS-8A2C)
        import uuid
        system_id = f"SYS-{str(uuid.uuid4())[:4].upper()}"
        
        # 1. INDOOR (FCU)
        fcu_name = f"FCU_{model_id}"
        idu_h = data.get("Indoor_Height_mm", 300)
        idu_dims = (data.get("Indoor_Width_mm", 800), 
                    data.get("Indoor_Depth_mm", 800), 
                    idu_h)
        idu_loc = context.scene.cursor.location.copy()
        idu_loc.z += 2.5 - (idu_h / 1000.0 * 0.5)
        fcu_obj = self.create_unit(fcu_name, idu_dims, idu_loc, "IfcUnitaryEquipment", data, "Indoor")
        fcu_obj["Pset_Carrier.System_ID"] = system_id
        
        # 2. OUTDOOR (CDU)
        odu_model = data.get("Outdoor_Model", "UNKNOWN")
        cdu_name = f"CDU_{odu_model}"
        odu_h = data.get("Outdoor_Height_mm", 700)
        odu_dims = (data.get("Outdoor_Width_mm", 900), 
                    data.get("Outdoor_Depth_mm", 350), 
                    odu_h)
        odu_loc = context.scene.cursor.location.copy()
        odu_loc.x += 1.5
        odu_loc.z += (odu_h / 1000.0 * 0.5)
        cdu_obj = self.create_unit(cdu_name, odu_dims, odu_loc, "IfcCondensingUnit", data, "Outdoor")
        cdu_obj["Pset_Carrier.System_ID"] = system_id
        cdu_obj["Pset_Carrier.Indoor_Model"] = model_id # ใส่ข้อมูล FCU ลงใน CDU
        
        self.report({'INFO'}, f"Created System {system_id}: FCU + CDU")
        return {'FINISHED'}

    def create_unit(self, name, dims, location, ifc_type, model_data, unit_type):
        w, d, h = dims
        bpy.ops.mesh.primitive_cube_add(size=1, location=location)
        obj = bpy.context.active_object
        obj.name = name
        obj.dimensions = (w/1000.0, d/1000.0, h/1000.0)
        bpy.ops.object.transform_apply(scale=True)
        
        # Set IFC Metadata
        obj["IfcEntityType"] = ifc_type
        obj["IfcTag"] = model_data.get("Outdoor_Model") if unit_type == "Outdoor" else name.replace("FCU_", "")
        obj["ObjectType"] = f"{model_data.get('Type')} ({unit_type})"

        # Inject all other catalog data
        for k, v in model_data.items():
            if not isinstance(v, (dict, list)):
                obj[f"Pset_Carrier.{k}"] = v
        return obj

class MESH_OT_carrier_refresh(bpy.types.Operator):
    """Reload JS Catalogs"""
    bl_idname = "mesh.carrier_refresh"
    bl_label = "Refresh Data"
    
    def execute(self, context):
        load_catalogs()
        return {'FINISHED'}

# --- 4. UI PANEL ---

class VIEW3D_PT_carrier_hvac(bpy.types.Panel):
    bl_label = "Carrier HVAC Tools"
    bl_idname = "VIEW3D_PT_carrier_hvac"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Carrier'

    def draw(self, context):
        layout = self.layout
        props = context.scene.carrier_hvac_props
        
        layout.operator("mesh.carrier_refresh", icon='FILE_REFRESH')
        
        col = layout.column(align=True)
        col.prop(props, "series")
        col.prop(props, "model")
        
        layout.separator()
        layout.operator("mesh.carrier_create", icon='MESH_CUBE', text="Generate AC Units")

# --- 5. REGISTRATION ---

classes = (
    CarrierHVACProperties,
    MESH_OT_carrier_create,
    MESH_OT_carrier_refresh,
    VIEW3D_PT_carrier_hvac,
)

def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.Scene.carrier_hvac_props = bpy.props.PointerProperty(type=CarrierHVACProperties)
    load_catalogs()

def unregister():
    for cls in classes:
        bpy.utils.unregister_class(cls)
    del bpy.types.Scene.carrier_hvac_props

if __name__ == "__main__":
    register()
