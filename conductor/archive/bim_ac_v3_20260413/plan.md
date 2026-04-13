# Implementation Plan: Transition to BIM-Centric AC System (v3)

## Phase 1: Data Extraction (Extractor)

- [x] Task: Extract Carrier Catalog Data (Skipped PDF extraction; using existing data in `/data/*.js`)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Data Extraction' (Protocol in workflow.md)

## Phase 2: BIM Injection (Blender Workflow)

- [x] Task: Prepare BIM-Ready GLB Model
    - [x] Define standardized IFC Property Sets (Psets) for AC units.
    - [x] Inject `GlobalId` and Pset metadata into the `ar15-302-bim.glb` model. (Logic added to Blender addon; user must run in Blender)
    - [x] Write failing tests for a metadata validation script.
    - [x] Implement the validation script to verify GLB `userData` integrity.
- [x] Task: Conductor - User Manual Verification 'Phase 2: BIM Injection' (Protocol in workflow.md)

## Phase 3: Web & Database Integration

- [x] Task: Update Model Loader for IFC Metadata
    - [x] Write failing unit tests for the `userData` extraction logic in `BuildingModel.tsx`.
    - [x] Modify the model loader to expose IFC Psets from mesh `userData` to the application state.
    - [x] Verify coverage >80% for the updated loader logic.
- [x] Task: Enhance AC Mode UI with Technical Specs
    - [x] Write failing unit tests for the new Spec Viewer component.
    - [x] Implement UI updates in the AC Sidebar to display extracted technical specs (BTU, SEER, etc.).
    - [x] Refactor and ensure reactive feedback on asset selection.
- [x] Task: Implement Model-to-DB Sync
    - [x] Write failing tests for the Supabase sync utility (mapping `GlobalId` to `kg_nodes`).
    - [x] Create a utility to synchronize asset metadata from the GLB model to the Supabase database.
    - [x] Verify that all AC assets are correctly linked via GUID.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Web & Database Integration' (Protocol in workflow.md)
