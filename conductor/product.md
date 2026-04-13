# Initial Concept
BIM Asset & Digital Twin System (React + TypeScript) for Facility Management (FM-AR15).

# Product Guide: FM-AR15 (BIM Digital Twin)

## 1. Vision & Strategy
### Goal
To bridge the gap between 3D Digital Twins (BIM) and real-world Facility Management (FM) operations, providing a single source of truth for asset health, maintenance history, and spatial relationships.

### Value Proposition
- **Spatial Context:** Visualizing asset status directly within a 3D building model.
- **Data Integrity:** Ensuring consistency between human-readable Markdown specs and a robust Supabase Knowledge Graph.
- **Operational Efficiency:** Streamlining maintenance logging and reporting for facility managers and technicians.

## 2. Core Features
- **3D Interactive Viewer:** Real-time visualization of building assets (AC, Furniture, Electrical) with status-based color coding.
- **Knowledge Graph Integration:** Hierarchical mapping of assets (Building -> Floor -> Room -> Component) with support for complex relationships (Contains, ConnectsTo, Monitors).
- **Maintenance Lifecycle Management:** Adding, tracking, and reporting maintenance logs (Daily Logs, Service History).
- **BIM-Centric Data Flow:** Converting Markdown/PDF data into a synced database and 3D model properties.
- **Multi-Mode Inspection:** Specialized views for Architecture, Furniture, AC, and Electrical systems.

## 3. Target Users
- **Facility Managers:** For oversight of asset health and maintenance planning.
- **Technicians/Contractors:** For logging repairs and accessing technical specifications.
- **Building Owners:** For long-term asset lifecycle tracking and reporting.

## 4. Key Success Metrics
- **Data Sync Accuracy:** 100% alignment between Markdown data and Supabase records.
- **User Engagement:** Frequency of log updates and report generation.
- **System Stability:** Low latency in 3D rendering and graph visualizations.
