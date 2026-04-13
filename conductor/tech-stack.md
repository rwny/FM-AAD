# Technology Stack: FM-AR15 (BIM Digital Twin)

## 1. Core Frameworks
- **React (v19):** Primary UI framework for building interactive components.
- **TypeScript:** Ensuring type safety across the application, particularly for complex 3D and Graph data.
- **Vite (v8):** Modern build tool and development server for high-performance HMR.

## 2. 3D & Data Visualization
- **Three.js:** The foundational 3D engine for rendering building models.
- **React Three Fiber (R3F):** React reconciler for Three.js.
- **React Three Drei:** Collection of helper components and abstractions for R3F.
- **React Force Graph (2D/3D):** For visualizing the Knowledge Graph relationships.

## 3. Backend & Data
- **Supabase:** Backend-as-a-Service providing PostgreSQL, Real-time subscriptions, and Authentication.
- **Supabase-js:** Client library for interacting with the Supabase backend.
- **Markdown (Data Pipeline):** Human-readable format for defining initial asset specifications and hierarchical data.

## 4. Styling & UI
- **Tailwind CSS:** Utility-first CSS framework for rapid styling.
- **PostCSS & Autoprefixer:** For modern CSS processing and browser compatibility.
- **Lucide React:** Icon set for professional and consistent UI iconography.

## 5. Deployment & Tools
- **Vercel:** Optimized hosting platform for Vite applications.
- **ESLint & Prettier:** For code quality and consistent formatting.
