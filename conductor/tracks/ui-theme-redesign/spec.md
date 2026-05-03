# Specification: UI Theme Redesign

## Objective
Implement a robust theme switching system for the Sidebar and Informational Popups.

## Requirements
- **Theme Support:** Dark and Light modes.
- **Toggle:** User should be able to switch themes (e.g., via a keyboard shortcut or UI button).
- **Target Components:**
    - Sidebar (`aside` in `App.tsx`)
    - Project Dashboard (`ProjectDashboard.tsx`)
    - Global Search Result Popups
    - Asset Detail Modals (`PrintReportModal.tsx`)
    - Maintenance Activity Detail Modal (in `App.tsx`)
- **Aesthetic (Light Mode):**
    - Based on `light-theme-concept.md`.
    - Background: Solid white.
    - Text/Lines: Crisp black.
    - Minimalist, tactical look.
- **Aesthetic (Dark Mode):**
    - Deep neutral dark gray background (e.g., zinc-950 or black).
    - High-contrast text (white or cyan/amber tactical highlights).
    - Clear boundaries and crisp lines using neutral grays (zinc-800).

## Technical Approach
- Tailwind CSS `darkMode: 'class'`.
- React state for theme management (persisted in `localStorage`).
- CSS variables for core semantic colors (optional but recommended for consistency).
