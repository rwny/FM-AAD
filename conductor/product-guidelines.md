# Product Guidelines: FM-AR15 (BIM Digital Twin)

## 1. Prose & Communication Style
### Tone
Technical, information-dense, and objective. We prioritize accuracy over conversational filler. 

### Guidelines
- **Labels & Values:** Use precise technical identifiers (e.g., `AssetID`, `GlobalId`, `BTU`). 
- **Log Entries:** Encourage brief, high-signal reports (e.g., "CDU-301: Condenser leak repaired; re-pressurized to 400psi").
- **Error Messages:** Provide technical context and potential remediation steps rather than generic warnings.

## 2. Branding & Aesthetic
### Visual Identity
**Terminal/Tactical:** The interface should evoke a high-tech "command center" or "hacker terminal" aesthetic, especially within the Knowledge Graph views.

### Design Standards
- **Color Palette:** Deep dark backgrounds (Slate-900/950) with high-contrast accent colors:
  - 🟢 Emerald-500 (Active/Normal)
  - 🟠 Amber-500 (Maintenance/Warning)
  - 🔴 Rose-600 (Faulty/Error)
  - 🔵 Indigo-400 (Technical/Neutral)
- **Typography:** Use monospaced fonts (e.g., JetBrains Mono, Fira Code) for IDs and technical data. Use Noto Sans Thai for readable descriptions.
- **Glassmorphism:** Employ subtle backdrop blurs (bg-white/10 or bg-black/40) for floating panels.

## 3. User Experience (UX) Principles
- **Visual Density:** Maximize the information presented at a glance. Use compact tables, dense timelines, and nested sidebars to allow power users to scan large datasets quickly.
- **Guided Navigation:** Ensure users never get lost in the 3D space. Use persistent breadcrumbs (Building > Floor > Room), interactive 3D labels, and "Fly-to" animations for asset selection.
- **Reactive Feedback:** Every interaction must yield an immediate visual response. Hovering over a 3D asset should highlight it; clicking a node in the graph should update the sidebar instantaneously.
- **BIM-Centric Focus:** The 3D model (IFC/Three.js) is the primary interface. All building data, maintenance logs, and relationships must be accessible directly by interacting with the 3D geometry.

## 4. Design Patterns
- **Sidebars:** Width 240px-300px with collapsible sections.
- **3D Labels:** Constant-size HTML labels that don't obscure the geometry.
- **Modals:** Use full-screen or centered overlays with a "Tactical" look (borders, glowing edges).
