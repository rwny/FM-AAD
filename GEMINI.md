# Project Context: FM AAD (Facility Management - AR3D).

## 📌 Project Overview
This project is a Facility Management (FM) application that bridges 3D Digital Twins with a Supabase-backed Knowledge Graph. 

## 🏗 Data Architecture & Workflow
The core data pipeline focuses on converting human-readable Markdown files into a robust, scalable database structure.

1. **Authoring (Markdown):** 
   - Data is stored in `src/utils/data/[BuildingID]/` (e.g., `AR15/floor-1.md`).
   - Uses indentation (multiples of 4 spaces) to define hierarchical relationships (`contains`).
   - Uses curly braces `{}` to define metadata and properties (e.g., `AssetID: 1234, Type: Split`).
2. **Processing Pipeline:**
   - `npm run data:combine`: Merges individual floor/room files into a master building file (`[BuildingID]-DATA.md`).
   - `npm run data:generate`: Parses the master Markdown into JSON/TypeScript for the frontend.
   - `npm run data:sync`: Uploads nodes and relationships to Supabase.
3. **Database (Supabase):**
   - **`kg_nodes`**: Stores entities. The system automatically applies a `[BuildingID]-` prefix to node names (except the building root) to ensure Global Unique IDs (preventing collisions across buildings).
   - **`kg_edges`**: Stores relationships (e.g., `contains`, `connectsTo`, `monitors`).

## 🎯 Current Focus & Goals
- Continuously strengthen the `.md` to Supabase data pipeline.
- Implement strict validation logic to prevent errors before syncing to the database.
- Expand graph relationships and metadata handling to support more complex building systems (Electrical, Plumbing, etc.).
- Ensure data integrity and scalability as more buildings and assets are added.

## 🛠 Project Specific Instructions
- Always respect the `DATA_CONVENTION.md` rules when modifying or parsing data.
- When expanding the parser or database schema, prioritize robustness and data integrity.
- **Auto-Prefixing & AssetID Logic:** To simplify Markdown authoring, users do not need to manually specify an `AssetID` for devices. The parsers (`check-data.cjs`, `parse-data.cjs`, `sync-data.cjs`) must automatically apply the `[BuildingID]-` prefix to node names.
- **Metadata Scope (`{}` Blocks):** 
  - **Large Systems** (e.g., Air Conditioners `FCU-`/`CDU-`, CCTV cameras) *should* utilize `{}` blocks to store metadata (like `Type`, `InstallDate`, or a specific `AssetID`). If `AssetID` is omitted, the parser defaults to the prefixed node name.
  - **Minor Components** (e.g., Light bulbs `LI-`, Switches `SW-`, Outlets `PG-`) generally *do not* use `{}` blocks and do not require an `AssetID` to be tracked in the database.
- **Data Generation & Sync Policy:** Do NOT run `npm run data:generate` or `npm run data:sync` automatically after modifying data files. Always wait for an explicit user directive to execute these commands to manage resource/computation costs.
- **Sanitary (SAN) Flow via Indentation:** For plumbing and sanitary systems (`SAN`), indentation represents flow direction (`ConnectsTo`), not physical containment (`Contains`). 
  - Example: `LAV-1` -> `P-WASTE-2in` implies `LAV-1` connects to `P-WASTE-2in`.
  - **Terminal Nodes (Convergence Points):** Nodes that receive multiple connections (e.g., Manholes `Manhole-`, Septic Tanks `SEPT-`) must be written with an empty `{}` block when referenced at the end of a flow branch to indicate they are references to an existing central node, not a duplicate declaration. (e.g., `- Manhole-1 {}`).

## 🛠 Specialized Tools & Skills
- **`bim-fm-architect` Skill:** Use this skill for all data authoring, validation, and syncing tasks. It contains specialized procedural logic for SAN systems, auto-prefixing, and graph-to-3D mapping. Activate this skill whenever you are modifying `.md` files in `src/utils/data/` or running the data sync pipeline.

## 📚 Knowledge Map (Reference Index)
Whenever deep technical context is needed, refer to these primary manuals:
- **Data Standards:** `src/utils/DATA_CONVENTION.md` (Rules for MD format, Prefixing, and Hierarchy).
- **Architecture:** `src/utils/MASTER_SYSTEM_ARCHITECTURE.md` (High-level system design and data flow).
- **Graph Schema:** `.gemini/skills/bim-fm-architect/references/database-schema.md` (Supabase table structures).
- **Roadmap:** `src/utils/FUTURE_EXPANSION_ROADMAP.md` (Upcoming features and scaling strategies).
