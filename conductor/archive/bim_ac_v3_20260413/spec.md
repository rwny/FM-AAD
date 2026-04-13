# Track Specification: Transition to BIM-Centric AC System (v3)

## 1. Goal
Implement the BIM-Centric workflow (v3) for the Air Conditioning (AC) system, transitioning from manual Markdown-based specifications to IFC-standard metadata and GlobalId-based data embedded directly within 3D GLB models.

## 2. Objectives
- **Data Extraction:** Automate the extraction of technical specifications from Carrier PDF catalogs into a standardized JSON format.
- **BIM Injection:** Embed IFC-compliant metadata (Property Sets) and unique `GlobalId` (GUID) identifiers into the 3D meshes using Blender.
- **Web Integration:** Update the React/Three.js application to read and display this embedded metadata.
- **Database Sync:** Synchronize the 3D model's `GlobalId` and properties with the Supabase Knowledge Graph to ensure a robust link between the physical asset and its digital twin.

## 3. Technical Scope
- **Input:** Carrier PDF Catalogs (TGF, TGV, TGEV series), `ar15-302.glb`.
- **Output:** `ar15-302-bim.glb` (with IFC extras), updated Supabase `kg_nodes`.
- **Tools:** Node.js (Extraction scripts), Blender (IFC Injection via BlenderBonsai or custom scripts), React/Three.js (Frontend visualization).

## 4. Acceptance Criteria
- Technical specs (BTU, SEER, etc.) are correctly extracted and stored in JSON.
- 3D assets in the GLB model contain the correct `GlobalId` and `userData` properties.
- Clicking an AC unit in the web app displays full technical specs retrieved from the model's `userData`.
- Assets in Supabase are correctly mapped to their 3D counterparts via `GlobalId`.
