# BUG FIX REPORT: PRINT VISIBILITY (STITCHLYX SYNCORE V2)
**Date:** 2026-04-16

## 1. Description of Problem
The application experienced an issue where content appeared correctly in the browser's Print Preview but failed to render (showing blank or clipped content) on the actual printed document.

**Identified Causes:**
- **Aggressive Global CSS:** A rule in `globals.css` hid everything on the `body` except an element with ID `#print-area`. Since this element is often deeply nested inside Next.js layout wrappers, the parent wrappers being hidden also hid the content.
- **Inconsistent Markup:** Several modules used CSS classes (e.g., `.printArea`) instead of the required ID (`#print-area`).
- **Layout Clipping:** Containers with `min-height: 100vh` or `overflow: hidden` were not being reset during printing.

---

## 2. Changes Summary

### Global Styling
**Filename:** `src/app/globals.css`
- **BEFORE:** Used `body > *:not(#print-area)` which hid the entire layout.
- **AFTER:** Switched to a "Hide Chrome" strategy. Specifically hides `aside` (Sidebar), `header` (MobileHeader), `nav`, and `button`.
- **AFTER:** Forced `main` and layout wrappers to `overflow: visible` and `height: auto` to prevent clipping.

### Layout Components
**Sidebar & MobileHeader**
- **LOGIC:** Now automatically hidden via tag-level rules (`aside`, `header`) in `globals.css`.
- **RESULT:** Clean reports without navigation UI.

### Feature Modules

#### [Standardized] SlipGajiView.tsx
- **BEFORE:** Printed filters and dashboard lists along with the slip.
- **AFTER:** Added `.no-print` to filters and list panels. Standardized visibility of the `#print-area`.

#### [Standardized] TiketBarcode.tsx
- **BEFORE:** Used `.printArea` (class).
- **AFTER:** Switched to `id="print-area"`. Added `.no-print` to the back/print button bar.

#### [Fixed] DetailSuratJalan.tsx & .module.css
- **BEFORE:** Used `body * { visibility: hidden }` which caused blank spaces and layout issues.
- **AFTER:** Removed aggressive visibility rule. Switched to `id="print-area"` and `.no-print` markers.

#### [Cleaned] LaporanRejectView.tsx & LaporanPerPOView.tsx
- **BEFORE:** Printed everything including interactive dashboards.
- **AFTER:** Added `.no-print` to dashboard cards and expanded detail rows to focus the printout on the main data table.

---

## 3. Verification Result
The system now uses a standard marker (`#print-area`) for specific reports, while naturally hiding UI elements for full-page reports. This ensures multi-page printing works without layout clipping.

> [!TIP]
> Users should ensure that their browser print settings (Margins) are set to **"Default"** or **"Minimum"** for the best result on A4 paper.
