# UI Design System — AI Interview Prep Kit

> Authoritative UI planning document (see `AGENTS.md`). Normalized from all selected templates into ONE product identity.
> Stack: Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn-style primitives + lucide-react. Dark-first.

## Product identity
Serious, developer-focused study workspace. Current code already speaks slate-950/900 + indigo-600 — keep that
soul, formalize it into tokens. No gradients-as-decoration, no glassmorphism, no neon. One accent, used sparingly:
progress, current-step, primary actions, active nav.

## Color strategy (dark-first tokens)
- Background: `slate-950` app base, `slate-900` raised surfaces/cards, `slate-900/50` inset wells (answer outlines).
- Borders: `slate-800` default, `slate-700` on emphasis; error `red-500/30`, success `emerald-500/*`.
- Text: `white` headings/primary, `slate-300` body, `slate-400/500` secondary/meta.
- Accent: `indigo-500/600` primary actions + active states; `indigo-400` for eyebrow labels/links on dark.
- Status: ok/covered `emerald-400`; running/current `amber-400`; failed/uncovered `red-400`; info `indigo-400`;
  MUST `red` badge; NICE `slate` badge; `user_edited` `amber` badge. Status is never color-only — always with icon + text.
- Light mode: not in scope for assessment; tokens chosen from shadcn CSS-variable convention so a light theme can be added later without restructuring.

## Typography
- Font: system stack now (`font-sans`); adopt Inter or Geist at implementation time via `next/font` (single variable font, weights 400/500/600/700). Tabular numerals for minutes/counts.
- Hierarchy: page title 24/bold/tracking-tight; section 18/bold; card title 15–16/semibold; body 14/relaxed; meta/eyebrow 12/medium-uppercase-tracking-wider (`text-slate-400`); code/IDs 12 mono (`font-mono`, `text-indigo-400`).
- Measure: prose max ~70ch (brief, outlines); question prompts 15–16 semibold for scanability.

## Spacing system
- Base 4px; section rhythm `space-y-10` page / `p-6` cards / `gap-3–4` rows; page container `max-w-7xl` (workspace `max-w-5xl` for reading surfaces, `max-w-2xl` for practice/auth).
- Builder card internals: `p-4`, prompt→outline `space-y-2`, outline well `p-2.5`.

## Border radius
- Cards/sections `rounded-xl` (12–16px); nested wells/inputs `rounded-lg`; badges/pills `rounded-full`; buttons `rounded-lg`; practice card `rounded-2xl`. One radius family, no pill-buttons except badges.

## Shadows
- Restraint: `shadow-md` cards on hover only (accent glow `shadow-indigo-500/10` for primary hover); `shadow-2xl` dialogs/practice card; none on flat sections. Depth comes from borders, not shadows.

## Components
- Card: `rounded-xl border border-slate-800 bg-slate-950 p-6`; header row with title + contextual action, `border-b border-slate-800 pb-3`; nested item `bg-slate-900`.
- Buttons: primary `bg-indigo-600 hover:bg-indigo-500 text-white font-semibold` (+ `disabled:opacity-50`); secondary `border border-slate-800 bg-slate-900 hover:bg-slate-800`; danger-ghost (delete) `hover:text-red-400`; icon buttons `p-2` min 36px (44px on touch layouts); loading state = spinner + disabled + verb prefix ("Saving…").
- Inputs: `bg-slate-900 border-slate-800 rounded-lg`, focus `border-indigo-500 + ring-1 ring-indigo-500 + outline-none`; labels 14/medium `slate-300`; hints/errors 12px with `aria-describedby`; textarea JD min 6 rows + char counter.
- Dialogs: `max-w-2xl` (forms) / `max-w-md` (confirm), `bg-slate-950 border-slate-800 rounded-2xl`; focus trap + Esc (native); destructive confirms require explicit confirm button, never hover-delete.
- Badges: `text-[10–11px] font-bold uppercase rounded px-2 py-0.5`; MUST `bg-red-500/20 text-red-300`; NICE `bg-slate-700/60 text-slate-300`; kind `bg-slate-800 text-slate-400`; edited `bg-amber-500/20 text-amber-300`; difficulty = 3 dots, not numbers alone.
- Status indicators: badge + icon + text; running pulses (`animate-pulse` on badge only, never whole cards).
- Tabs: workspace section tabs (Overview/Brief/Role/Questions/Coverage/Flashcards/Schedule) as underline tabs desktop, horizontal scroll-snap row on mobile; `aria-selected`, keyboard arrows.
- Navigation: sidebar groups (Overview → My Kits, New Kit; Workspace → section anchors when in kit; Account → Profile, Sign out); icon-collapse on desktop; drawer on mobile; breadcrumb in header (Dashboard / Company / Section).
- Stepper (generation): vertical `ol`, states done (emerald check) / current (indigo spinner + `aria-current="step"`) / pending (muted number) / failed (red alert); live message under current; auto-scroll; mobile condenses to "Stage X of 11" + current card.
- Timeline (schedule): left rail + nodes; today = indigo ring + "Today" label; past = muted check; day card = focus + minutes chip + question links.
- Quiz/practice: progress bar (thin, top), stage counter text ("Card 3 of 12"), flip card min-height 300px, gated 1–5 rating with text labels, results screen with weak recap.
- Empty states: centered icon (`slate-600`, 40–48px) + 16 semibold title + 14 secondary description + primary action button. Mandatory everywhere lists can be empty.
- Error states: `border-red-500/30 bg-red-500/10` card, server message verbatim, Retry button (same action) + secondary escape hatch (dashboard link). Generation failure = full error card, never a toast alone.
- Loading states: `Skeleton` matching target shape (card rows for builder, grid for dashboard); spinners only inside buttons/current-step icon; practice/generation never show bare "Loading…" text without shape.
- Toasts (Sonner or equivalent, to add): success/fail confirmation for save/delete/move/regenerate — non-blocking; errors also inline.

## Animation principles
- Restrained: 150–250ms ease-out transitions; hover `scale-[1.01]` max on practice card only; `animate-spin` for active work; `animate-pulse` for running badges; page transitions none (App Router default); flip = opacity/translate crossfade, no 3D gimmick (readability first); `prefers-reduced-motion` respected (disable pulse/spin extras).

## Responsive breakpoints (Tailwind defaults)
- `base`: single column, drawer nav, scroll tabs, bottom-sheet dialogs, up/down reorder buttons, full-width CTAs.
- `md` (768): 2-col grids (kits, requirements), modal dialogs, tab bar full.
- `lg` (1024): sidebar icon-rail optional, auth split panel appears, 3-col kit grid.
- `xl` (1280): full sidebar, `max-w-7xl` workspace.
- Touch: ≥44px targets on mobile layouts; drag handle 40px; rating buttons full-width row wrap.

## Iconography
lucide-react only (already in use). Fixed mapping: question categories (technical `Code2`, system-design `Network`, behavioural `MessagesSquare`, company-fit `Building2`), actions (edit `Edit2`/`Pencil`, delete `Trash2`, regen `RotateCw`, practice `Play`, schedule `Clock`/`CalendarDays`, coverage `CheckCircle2`/`AlertCircle`, drag `GripVertical`). No emoji in UI.
