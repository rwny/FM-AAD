# Implementation Plan: Transition to BIM-Centric AC System (v3)

## Phase 1: Data Extraction (Extractor)

- [ ] Task: Extract Carrier Catalog Data
    - [ ] Write failing unit tests for the PDF-to-JSON catalog extractor.
    - [ ] Implement the extractor to parse technical specs (BTU, SEER, Dimensions) for TGF/TGV/TGEV series.
    - [ ] Refactor and verify coverage >80% for the extraction utility.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Data Extraction' (Protocol in workflow.md)

## Phase 2: BIM Injection (Blender Workflow)

- [ ] Task: Prepare BIM-Ready GLB Model
    - [ ] Define standardized IFC Property Sets (Psets) for AC units.
    - [ ] Inject `GlobalId` and Pset metadata into the `ar15-302-bim.glb` model.
    - [ ] Write failing tests for a metadata validation script.
    - [ ] Implement the validation script to verify GLB `userData` integrity.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: BIM Injection' (Protocol in workflow.md)

## Phase 3: Web & Database Integration

- [ ] Task: Update Model Loader for IFC Metadata
    - [ ] Write failing unit tests for the `userData` extraction logic in `BuildingModel.tsx`.
    - [ ] Modify the model loader to expose IFC Psets from mesh `userData` to the application state.
    - [ ] Verify coverage >80% for the updated loader logic.
- [ ] Task: Enhance AC Mode UI with Technical Specs
    - [ ] Write failing unit tests for the new Spec Viewer component.
    - [ ] Implement UI updates in the AC Sidebar to display extracted technical specs (BTU, SEER, etc.).
    - [ ] Refactor and ensure reactive feedback on asset selection.
- [ ] Task: Implement Model-to-DB Sync
    - [ ] Write failing tests for the Supabase sync utility (mapping `GlobalId` to `kg_nodes`).
    - [ ] Create a utility to synchronize asset metadata from the GLB model to the Supabase database.
    - [ ] Verify that all AC assets are correctly linked via GUID.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Web & Database Integration' (Protocol in workflow.md)
