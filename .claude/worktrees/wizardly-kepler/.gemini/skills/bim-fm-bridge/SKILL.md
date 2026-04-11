---
name: bim-fm-bridge
description: Bridging BIM (Building Information Modeling) and FM (Facility Management) data. Use when working with 3D models (GLB/IFC), maintenance logs in Supabase, and mapping between physical assets and digital twins using GlobalId and standardized data conventions.
---

# BIM-FM Bridge

## Overview
This skill provides procedural knowledge for managing a Digital Twin system that bridges 3D BIM models with Facility Management (FM) databases. It ensures consistency between physical assets, their digital representations in Blender/Three.js, and their operational history in Supabase.

## Core Concepts

### 1. The Bridge Mechanism (GlobalId)
The primary link between the 3D Model and the Database is the `GlobalId` (GUID).
- **Blender/IFC Side:** Assets are tagged with a unique `GlobalId` using BlenderBonsai or custom properties.
- **GLB/Three.js Side:** This ID is preserved in `mesh.userData.GlobalId`.
- **Database Side:** Supabase tables use `asset_guid` (or `GlobalId`) to reference specific 3D objects.

### 2. Data Convention (Hierarchy)
Information is organized in a Top-Down approach:
- **Building** -> **Floor** -> **Room** (RM-xxx) -> **Asset/Component**
- **Naming Convention:**
  - `RM-` : Architectural Spaces (Rooms)
  - `FCU-` / `CDU-` : Air Conditioning Units
  - `LF-` / `BF-` : Furniture
  - `DB-` : Electrical Panels

### 3. Maintenance Logic (AC System Focus)
- **Peer Matching:** FCU (Indoor) and CDU (Outdoor) units are linked via a `System_ID` or room matching.
- **Status Mapping:**
  - `Normal` (Green)
  - `Maintenance` (Orange)
  - `Faulty` (Red)

## Workflow: BIM-Centric Update (v3)

When updating the system or adding new assets, follow this "Extractor -> Injection -> Sync" workflow:

### Phase 1: Data Extraction
1. **Source:** PDF Catalogs (e.g., in `3DModel/catalog2ifc/catalogs/`).
2. **Process:** Use extraction scripts to convert PDF data to JSON specs (BTU, SEER, dimensions).
3. **Output:** Standardized JSON in `src/utils/ac-specs.json`.

### Phase 2: BIM Injection (Blender)
1. **Import:** Use the JSON specs to populate Blender objects.
2. **IFC Tagging:** Assign `IfcEntityType` (e.g., `IfcUnitaryEquipment`).
3. **Export:** Generate `ar15-xxx-bim.glb` with full `userData` metadata.

### Phase 3: Web & DB Sync
1. **Loader:** Update `BuildingModel.tsx` to read `userData`.
2. **Registry Sync:** Automated script to ensure all `GlobalId`s in the GLB exist in Supabase `assets` table.
3. **UI Integration:** Display technical specs directly from the model's metadata in the Sidebar.

## Bundled Resources

### scripts/
- `parse-ac-data.cjs`: Extracts AC technical specifications from Markdown to JSON.
- `build-ar15-md-to-json.js`: Converts the full AR15 building data hierarchy from MD to JSON.

### references/
- `DATA_CONVENTION.md`: Guidelines for Markdown-based data entry (Indentation rules, Asset IDs).
- `FM_BLUEPRINT.md`: Full system architecture and hierarchy (Building -> Floor -> Room -> Asset).
- `v3.md`: Implementation plan for the BIM-Centric (IFC/GlobalId) workflow.

## Common Tasks
- **"Map a new asset":** Ensure the Blender object name matches the Supabase `asset_id` or has the correct `GlobalId`.
- **"Update AC status":** Add a new entry to `ac_maintenance_logs` in Supabase; the 3D model will auto-reflect the color based on the latest log.
- **"Parse legacy data":** Run `node scripts/build-ar15-md-to-json.js` (inside the skill or project) to convert Markdown specs to JSON.
