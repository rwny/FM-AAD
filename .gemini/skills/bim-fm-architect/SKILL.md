name: bim-fm-architect
description: Expert in BIM-FM Knowledge Graph data management. Use when modifying Building/Asset Markdown data, designing plumbing (SAN) flow systems, or syncing data to Supabase to ensure strict adherence to DATA_CONVENTION and 3D mapping.

# BIM-FM Architect

This skill provides specialized procedural guidance for managing the bridge between human-readable Markdown data and the Supabase Knowledge Graph for the FM AAD project.

## Core Mandates
- **Indentation:** Use EXACTLY 4 spaces for hierarchy. Never use tabs or 2-space indents.
- **Prefixing:** Names in `.md` files are short (e.g., `FCU-1`). The system automatically prepends `[BuildingID]-` (e.g., `AR15-FCU-1`) in the database.
- **SAN System Logic:** Indentation represents flow (`ConnectsTo`), not containment.
- **Terminal Nodes:** Use `NodeName {}` for references to existing nodes (like Manholes) to prevent duplicate creation.

## Workflow: Data Modification
1.  **Edit:** Modify `src/utils/data/[BuildingID]/floor-x.md`.
2.  **Combine:** Run `npm run data:combine` to generate master `.md`.
3.  **Generate:** Run `npm run data:generate` for local JSON/TS.
4.  **Sync:** Run `npm run data:sync` to update Supabase.

## Reference Materials
- **Core Convention:** See `src/utils/DATA_CONVENTION.md` for strict data formatting rules.
- **System Architecture:** See `src/utils/MASTER_SYSTEM_ARCHITECTURE.md` for overall logic.
- **Database Schema:** See `references/database-schema.md` for `kg_nodes` and `kg_edges` structure.
- **System Templates:** See `references/system-templates.md` for AC and SAN structural patterns.
- **3D Mapping:** Asset names in `.md` MUST match Object names in `.glb` files for the 3D visualizer to work.

## Validation Checklist
- [ ] Is indentation a multiple of 4 spaces?
- [ ] Are all `{}` blocks closed correctly?
- [ ] Are SAN flows pointing to the correct terminal nodes using `{}`?
- [ ] Is the BuildingID consistent throughout the folder?
