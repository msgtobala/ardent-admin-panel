---
name: Ardent Admin System
colors:
  surface: '#fff8f6'
  surface-dim: '#e0d8d6'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2f0'
  surface-container: '#f4ecea'
  surface-container-high: '#eee7e5'
  surface-container-highest: '#e8e1df'
  on-surface: '#1e1b1a'
  on-surface-variant: '#5d4038'
  inverse-surface: '#33302f'
  inverse-on-surface: '#f7efed'
  outline: '#916f66'
  outline-variant: '#e6bdb2'
  surface-tint: '#b03000'
  primary: '#ab2e00'
  on-primary: '#ffffff'
  primary-container: '#d63c00'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb59f'
  secondary: '#7643b6'
  on-secondary: '#ffffff'
  secondary-container: '#bb88fe'
  on-secondary-container: '#4c118b'
  tertiary: '#785600'
  on-tertiary: '#ffffff'
  tertiary-container: '#976d00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb59f'
  on-primary-fixed: '#3b0a00'
  on-primary-fixed-variant: '#862200'
  secondary-fixed: '#eedcff'
  secondary-fixed-dim: '#d9b9ff'
  on-secondary-fixed: '#2a0054'
  on-secondary-fixed-variant: '#5d289c'
  tertiary-fixed: '#ffdea4'
  tertiary-fixed-dim: '#fcbc21'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#fff8f6'
  on-background: '#1e1b1a'
  surface-variant: '#e8e1df'
  app-bg: '#FDF5ED'
  surface-white: '#FFFFFF'
  border-subtle: '#D9D9D9'
  success-green: '#2E7414'
  error-red: '#B80019'
  success-bg: '#DBFFCE'
  error-bg: '#FFECEC'
  warning-bg: '#FFF6D9'
  info-bg: '#F2E6FF'
  primary-action: '#FF4900'
  primary-action-hover: '#DE3F00'
  focus-ring: '#FFBEA4'
  row-hover: '#FFF4F0'
typography:
  h1:
    fontFamily: General Sans
    fontSize: 34px
    fontWeight: '500'
    lineHeight: '1.2'
  h2:
    fontFamily: General Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.2'
  h3:
    fontFamily: General Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: '1.3'
  section-title:
    fontFamily: General Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  card-title:
    fontFamily: General Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: General Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: General Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: General Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  caption:
    fontFamily: General Sans
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
  h1-mobile:
    fontFamily: General Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 260px
  sidebar-collapsed: 80px
  topbar-height: 64px
  container-max: 1440px
  gutter: 24px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 12px
  stack-lg: 20px
---

# Ardent Admin Design System

> **Primary color note:** YAML `primary` (`#ab2e00`) is the MD3 material token. Brand hero actions use `primary-action` (`#FF4900`) with hover `#DE3F00`. Both are exposed in `src/styles/theme.css`.

## Brand & Style

The brand personality is **utilitarian, professional, and efficient**, designed for internal operations where speed and clarity are paramount. It balances a high-energy brand color (`#FF4900`) with a calm, sophisticated background palette to reduce eye strain during long working sessions.

The design style is **Corporate / Modern** with a focus on high-density information architecture. It utilizes a structured "Surface-on-Surface" approach:

- **Minimalism:** Clean layouts with significant whitespace in headers to provide breathing room.
- **Functional Clarity:** Dense data tables and property panels that prioritize scanability.
- **Safety-First UI:** Destructive actions are gated by high-contrast visual cues and modal confirmation patterns.

## Colors

The palette is centered around **Ardent Orange** as the primary action color. To ensure the interface is suitable for an admin dashboard, the background uses a warm, low-contrast off-white (`primary25`) instead of pure white to reduce glare.

- **Primary Action:** `#FF4900` is reserved for "Hero" actions and primary buttons (`primary-action` token).
- **MD3 Primary:** `#ab2e00` for material surfaces and tints (`primary` token).
- **Semantic Feedback:** Uses standard traffic-light patterns (Green/Red/Gold) for status chips and validation, paired with low-saturation background tints for better readability.
- **Neutral Scale:** A rich range of grays from `#262322` (Black Neutral) for text to `#EDF1F3` (Grey 100) for UI elements.
- **Surface Strategy:** Cards and main content containers use `#FFFFFF` to pop against the `#FDF5ED` application background.

## Typography

The system uses **General Sans** exclusively to maintain brand continuity with the mobile experience while providing a clean, geometric look for the web.

- **Hierarchy:** Large headlines (H1-H3) use medium to semi-bold weights to establish clear landmarks.
- **Data Density:** Body text defaults to 14px for tables and forms to allow more information to be displayed on screen without sacrificing legibility.
- **Functional Labels:** Captions and labels use 10px-12px sizes with slightly increased weights (500-600) to ensure they remain legible at small scales.

Fonts are self-hosted from `public/fonts/general-sans/` (`.otf`) — see `src/styles/fonts.css`.

## Layout & Spacing

The layout uses a **Fixed-Fluid Hybrid Grid** model. The sidebar and top bar are fixed elements, while the main content area expands to a maximum width of 1440px.

- **Grid:** 12-column layout for main dashboard views.
- **Sidebar:** Fixed at 260px for navigation clarity, collapsing to 80px for power users who prefer more workspace.
- **Rhythm:** An 8px-based spacing system (`stack-sm`, `stack-md`, etc.) ensures consistent alignment across components.
- **Responsive Behavior:**
  - **Desktop:** Full sidebar + breadcrumb navigation.
  - **Tablet:** Sidebar collapses to icons; tables may introduce horizontal scroll for dense data.
  - **Mobile:** Sidebar becomes a bottom-sheet or hamburger drawer.

## Elevation & Depth

Depth is communicated through **Tonal Layering** and subtle ambient shadows rather than heavy skeuomorphism.

- **Tier 0 (Background):** `#FDF5ED` (app-bg) acts as the canvas.
- **Tier 1 (Surfaces):** Cards and white containers sit on Tier 0 with a 1px border (`#D9D9D9`) and `shadow-tier-1`.
- **Tier 2 (Overlays):** Modals and dropdown menus use `shadow-tier-2`.
- **Focus States:** High-visibility 2px outlines using `#FFBEA4` (focus-ring) ensure accessibility for keyboard navigation.

## Shapes

The shape language follows a **Rounded** philosophy (8px/0.5rem base) to balance the clinical nature of an admin panel with a friendly, approachable brand voice.

- **Containers:** Standard cards and toast notifications use 16px (`rounded-lg`) corner radii.
- **Interactive Elements:** Buttons and inputs use 8px (`rounded-md`).
- **Status Indicators:** Chips and toggles use "Full Pill" rounding (`rounded-full`) to distinguish them from actionable buttons.
- **Selection:** Checkboxes use a 4px radius (`rounded-sm`) to maintain a square-like functional appearance while avoiding sharp corners.

## Components

### Buttons

- **Primary:** Filled `#FF4900` with white text. Hover state: `#DE3F00`.
- **Secondary:** Outline with `#FF4900` border and text.
- **Danger:** Filled `#B80019` for destructive actions, always preceded by a confirmation modal.
- **Standard Height:** 40px (md) for general UI; 32px (sm) for table actions.

### Data Tables

- **Header:** Sticky with `#666666` text and a subtle bottom border.
- **Rows:** Alternating hover state with a `#FFF4F0` (row-hover) tint.
- **Density:** Allow users to toggle between "Comfortable" (16px padding) and "Compact" (8px padding).

### Form Inputs

- **Default:** White background with `#D9D9D9` border.
- **Focus:** 2px border of `#FF4900`.
- **Error:** `#FFECEC` background with `#B80019` text and border.

### Status Chips

- **Success:** Green text on `#DBFFCE`.
- **Warning:** Gold text on `#FFF6D9`.
- **Error:** Red text on `#FFECEC`.
- **Info:** Purple text on `#F2E6FF`.

### Navigation

- **Sidebar:** Use active indicators with a vertical 4px line in `#FF4900` on the left edge of the active menu item.
- **Breadcrumbs:** Use `#666666` for inactive links and `#262322` Bold for the current page.

## Implementation

Tailwind v4 tokens live in [`src/styles/theme.css`](../src/styles/theme.css). Entry point: [`src/index.css`](../src/index.css).
