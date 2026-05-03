# Implementation Plan: UI Theme Redesign

## Phase 1: Infrastructure
1. Update `tailwind.config.js` to enable class-based dark mode.
2. Create `useTheme` hook or update `store.ts` to manage theme state.
3. Add theme toggle functionality (keyboard shortcut 'T' or UI button).

## Phase 2: Sidebar Refactor
1. Identify all hardcoded colors in the Sidebar component.
2. Replace with theme-aware classes (`bg-white dark:bg-slate-950`, etc.).
3. Update Sidebar header and content panels.

## Phase 3: Popups & Modals Refactor
1. Refactor `ProjectDashboard.tsx`.
2. Refactor `GlobalSearch.tsx` dropdowns.
3. Refactor `PrintReportModal.tsx`.
4. Refactor Maintenance Detail modal in `App.tsx`.

## Phase 4: Refinement & Validation
1. Ensure transition animations are smooth.
2. Verify readability in both themes.
3. Test persistence across reloads.
