# Supabase Database Schema

## Table: `kg_nodes`
Stores entities (Buildings, Floors, Rooms, Assets).

| Column | Type | Description |
| :--- | :--- | :--- |
| `name` | `TEXT` (PK) | Global Unique ID (e.g., `AR15-FCU-101`) |
| `type` | `TEXT` | Entity category (e.g., `Building`, `Room`, `FCU`) |
| `metadata` | `JSONB` | Properties (e.g., `{ "Brand": "Carrier", "Status": "Normal" }`) |
| `building_id` | `TEXT` | ID of the building (e.g., `AR15`) |

## Table: `kg_edges`
Stores relationships between nodes.

| Column | Type | Description |
| :--- | :--- | :--- |
| `source` | `TEXT` | Source node name |
| `target` | `TEXT` | Target node name |
| `relation` | `TEXT` | `contains` or `connectsTo` |
| `building_id` | `TEXT` | ID of the building |
