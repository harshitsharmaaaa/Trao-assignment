# UI Design System — AI Interview Prep Kit

> Authoritative UI planning document (see `AGENTS.md`).
> Stack: Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn-style primitives + lucide-react.
> **Theme: Cyberpunk/Tactical Dark with Neon Blue Accents**

## Product identity
Professional, developer-focused interview preparation workspace with a tactical command-center aesthetic.
The design features dark steel surfaces (#0a0a0f to #1a1a28), neon blue accents (#0ea5e9 / #38bdf8),
and subtle glow effects. Frosted glass effects are used for authentication pages.

## Color strategy (cyberpunk theme)

### Backgrounds
- `cyber-bg` (#0a0a0f): App base, deepest black
- `cyber-surface` (#12121a): Cards, panels, sidebar
- `cyber-elevated` (#1a1a28): Modals, dropdowns, hover states
- `cyber-well` (#0d0d12): Inset wells, code blocks

### Borders
- `border-white/5` to `border-white/10`: Default borders
- `border-neon/30`: Active/focus borders with glow
- Error: `border-red-500/30`
- Success: `border-emerald-500/30`

### Text
- `text-white`: Headings, primary text
- `text-slate-300`: Body text
- `text-slate-400`: Secondary text
- `text-slate-500`: Tertiary, muted text
- `text-neon-bright` (#38bdf8): Accent text, links, IDs

### Accent (Neon Blue)
- `bg-neon` (#0ea5e9): Primary buttons, active states
- `text-neon-bright` (#38bdf8): Bright accent for text
- `shadow-neon`: Glow effects (0 0 20px rgba(14, 165, 233, 0.3))
- Used sparingly: progress indicators, current step, primary actions, active nav

### Status Colors
- Success/Covered: `text-emerald-400`, `bg-emerald-500/15`
- Running/Current: `text-neon-bright`, `bg-neon/15`, animated pulse
- Failed/Uncovered: `text-red-400`, `bg-red-500/15`
- Warning: `text-amber-400`, `bg-amber-500/15`
- MUST: `text-red-300`, `bg-red-500/20`
- NICE: `text-slate-300`, `bg-slate-700/60`
- Edited: `text-amber-300`, `bg-amber-500/20`

### Frosted Glass (Auth pages only)
- `bg-white/[0.05]` with `backdrop-blur-3xl`
- `border-white/10`
- Inner glow gradient overlay

## Typography
- Font: Inter via `next/font` (variable font, weights 400/500/600/700)
- Hierarchy:
  - Page title: 24-32px / bold / tracking-tight
  - Section: 18-20px / bold
  - Card title: 16px / semibold
  - Body: 14px / relaxed
  - Meta/eyebrow: 11-12px / medium / uppercase / tracking-wider
  - Code/IDs: 11-12px / font-mono / text-neon-bright

## Spacing system
- Base 4px
- Section rhythm: `space-y-8` page / `p-6` cards / `gap-4` rows
- Page container: `max-w-7xl`
- Workspace: `max-w-5xl` for reading surfaces
- Practice/Auth: `max-w-2xl`

## Border radius
- Cards/sections: `rounded-2xl` (16px)
- Buttons/inputs: `rounded-lg` (8px) to `rounded-xl` (12px)
- Badges/pills: `rounded-full`
- Practice card: `rounded-2xl`

## Shadows & Effects
- Cards: `shadow-lg` on hover with glow
- Primary button: `shadow-lg shadow-neon/30`
- Neon glow: `shadow-neon` (0 0 20px rgba(14, 165, 233, 0.3))
- Frosted glass: `backdrop-blur-3xl saturate-180`

## Components

### Card (Cyberpunk)
```
rounded-2xl border border-white/5 bg-cyber-surface/50 backdrop-blur p-6
hover:border-neon/30 hover:shadow-neon transition-all duration-300
```

### Buttons
- Primary: `bg-neon text-white font-semibold hover:bg-neon-bright shadow-lg shadow-neon/30`
- Secondary: `border border-white/10 bg-white/[0.05] backdrop-blur text-slate-300 hover:bg-white/[0.08]`
- Ghost: `text-slate-400 hover:text-white hover:bg-white/[0.05]`
- Icon buttons: `p-2` min 36px (44px on touch)

### Inputs
- Default: `bg-cyber-bg/50 border border-white/10 rounded-xl backdrop-blur`
- Focus: `border-neon ring-2 ring-neon/30`
- Glass (auth): `bg-white/[0.05] backdrop-blur-xl border-white/10`

### Badges
- `text-[10-11px] font-bold uppercase rounded-full px-2 py-0.5 border`
- MUST: `bg-red-500/20 text-red-300 border-red-500/30`
- NICE: `bg-slate-700/60 text-slate-300 border-slate-600/50`

### Status Indicators
- Running: `status-pulse` animation (2s infinite)
- Current step: Neon blue glow + spinner
- Done: Emerald check

### Tabs
- Underline style with neon blue active indicator
- `aria-selected`, keyboard arrows
- Scrollable on mobile

### Navigation
- Sidebar: Dark steel background, neon blue active glow, collapsible
- Mobile: Drawer with backdrop blur
- Header: Breadcrumb with chevron separators

### Stepper (Generation)
- Vertical list with done/current/pending/failed states
- Current: Neon blue glow + spinner + `aria-current="step"`
- Auto-scroll to current

### Timeline (Schedule)
- Vertical rail with gradient connector
- Today: Neon blue glow ring + "Today" badge
- Past: Grayed with check
- Day cards: Dark surface with question chips

### Practice Card
- Flip card with fade crossfade (not 3D)
- Progress bar at top
- 1-5 rating buttons with color coding

### Empty/Error States
- Centered icon + title + description + action
- Error: Red border + server message verbatim + retry

### Loading States
- Skeleton with shimmer animation matching target shape

## Animation principles
- Durations: 150-400ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for smooth feel
- Hover: Scale/glow transitions
- Page load: Staggered fade-in with slide-up
- Pulse: 2s infinite for running status
- Neon glow: Alternate animation for current step
- Respect `prefers-reduced-motion`

## Responsive breakpoints
- Base (0-767px): Mobile, drawer nav, stacked layouts
- md (768px+): Tablet, 2-col grids
- lg (1024px+): Desktop, sidebar expanded, full layouts
- xl (1280px+): Large desktop, max-width containers

## Iconography
lucide-react only. Fixed mapping for question categories and actions. No emoji in UI.
