# UI Template Research — AI Interview Prep Kit

> Authoritative UI planning document (see `AGENTS.md`).
> Phase: RESEARCH + DESIGN PLANNING ONLY. No implementation code was written for these selections.
> Note: `software-engineer-assignment.pdf` is not present in the repository, so selections are grounded in
> the task brief, the existing code (`app/`, `docs/API_CONTRACTS.md`, `schemas/`), and live template sources below.

## Decision summary

| Experience | Selected Template | Source | Why it fits | What we reuse |
|------------|-------------------|--------|-------------|---------------|
| App shell (Dashboard + Kit workspace) | shadcn Dashboard Sidebar block (`SidebarProvider` + `AppSidebar` + `SidebarInset` + header) | https://ui.shadcn.com/blocks | Collapsible sidebar, mobile drawer, breadcrumb header; one shell for the whole app; copy-paste shadcn primitives, zero new deps | Sidebar nav groups, icon-collapse, mobile drawer, header + breadcrumb, content container |
| Landing | Tailark marketing blocks (hero + logo/feature grid + CTA + footer) | https://github.com/tailark/blocks | MIT, shadcn/Tailwind/Next.js native, restrained marketing sections; minimal investment as instructed | Hero layout, 3-step "JD + Research = Kit" feature grid, CTA band, footer |
| Login / Register | shadcn Auth block `login-02` (two-column: form + product panel) | https://ui.shadcn.com/blocks/authentication | Same design system as app; panel side re-used for product explanation instead of stock photo; login/register share it | Split layout, `LoginForm`/`SignupForm` structure, validation states |
| Dashboard (kit list) | shadcn `SectionCards`-style stat strip + card grid (from dashboard block) | https://ui.shadcn.com/blocks | Answers "what should I work on next"; status-badged cards map directly to kit `queued/running/ok/failed` | Stat cards (Active kits, Interviews this week, MUST coverage), kit card layout, status badges |
| Create Kit | shadcn Dialog + Form (large textarea variant) | https://ui.shadcn.com/blocks | Existing modal works; needs comfort upgrades: char count, URL validation hint, days stepper | Dialog shell, form primitives; add JD char counter, inline validation |
| Generation Progress | HyperUI "Grouped steps with title + description, highlighted current step" | https://hyperui.dev/components/application/steps/ | 13-stage pipeline needs a real stage visualization, not a spinner; vertical steps with done/current/pending/failed states map 1:1 to `progress.stage/message` | Vertical step list, state icons (check/spinner/pending/alert), progress bar, failure card with retry |
| Company Brief | Workspace content card (app-shell pattern, two-panel summary) | shell-native (no external template) | Research brief is read/scan UI; no template needed beyond design-system cards | Summary/what-they-do panels, source link list |
| Role / Requirements | Requirement rows with MUST/NICE badges + coverage links (design-system list) | shell-native + shadcn `Badge`/`Progress` | Requirement→question traceability is product-specific; badges + per-req covering-question chips beat any generic template | Priority/kind badges, covering-question chips, filter by must/nice |
| Question Builder | Grouped vertical lists + dnd-kit `Sortable` (ReUI Sortable / sadmann7 headless pattern) | https://reui.io/components/sortable + https://github.com/dnd-kit/docs (presets/sortable) | 15-point editing/reorder/regen criterion; dnd-kit KeyboardSensor gives WCAG-compliant keyboard reorder free; drag handle keeps card buttons interactive; grouped-by-category lists beat kanban for scanability | `SortableContext` + `useSortable` + `arrayMove`, drag handle, `DragOverlay`, keyboard sensor, move up/down + move-to-category menu as non-drag alternative |
| Coverage View | Per-requirement coverage list + `Progress` summary (design-system composition) | shell-native + shadcn `Progress` | Must answer "what am I actually preparing for"; matrix/table templates hide the question links; list keeps req→questions visible | MUST coverage bar, per-req status rows, uncovered-callout, deep links to builder |
| Flashcards (deck) | Dashboard card-grid pattern reused (deck = card with due/count) | shell-native (same as Dashboard) | Coherence over novelty; deck management is list work, not a new interaction | Same card component, confidence distribution chip |
| Practice Mode | shadcnexamples Quiz-App one-at-a-time flow | https://shadcnexamples.com/quiz-apps | Distraction-free pacing is pre-solved: progress indicator → card → reveal → rate → results screen; maps exactly to front/reveal/rate-1-5/weak-first API | Step flow, progress bar, reveal gate on rating, results screen with weak-area summary |
| Schedule | Flowbite vertical Timeline adapted to day cards | https://v3.flowbite.com/docs/components/timeline/ | "What should I study today" = chronological agenda; vertical timeline with today-highlight + per-day question links | Timeline rail, day nodes, today ring, minutes chip, question deep-links |
| Settings / Profile | Minimal shadcn form card (account + sign out + danger zone) | https://ui.shadcn.com/blocks | Trivial surface; do not import a settings template | Card form, inputs, sign-out/danger actions |
| Error / Empty / Loading | shadcn empty-state convention (icon + title + description + action) + `Skeleton` | https://ui.shadcn.com/blocks | Already close to current code; standardize, add retry actions + skeleton list for builder | Empty-state block, error card w/ retry, skeleton rows/cards |
| Mobile nav | shadcn Sidebar mobile drawer + horizontally scrolling tabs | https://ui.shadcn.com/blocks | Drawer is built into the sidebar block; tabs scroll natively; builder reorder falls back to buttons | Drawer, scrollable tab bar, min 44px touch targets |

---

## Per-page research notes

### 1. App shell — SELECTED: shadcn Dashboard Sidebar block
Purpose: one coherent frame for Dashboard and the entire Kit workspace.

Selected template: shadcn Dashboard Sidebar (`SidebarProvider`, `AppSidebar`, `SidebarInset`, header with `SidebarTrigger` + breadcrumb).
Source: https://ui.shadcn.com/blocks (+ variants at https://www.shadcn.io/blocks/sidebar-admin-panel)

Why this fits: collapsible to icon rail (space for the builder), mobile drawer out of the box, breadcrumb header fits kit context (Dashboard / Stripe / Questions), copy-paste primitives compatible with Next.js 14 + Tailwind as-is. Rejected Flowbite admin (`https://github.com/themesberg/flowbite-admin-dashboard`) — full template, heavier, non-shadcn primitives would fork the design system. Rejected TailAdmin — marketing-chart-heavy admin look, wrong product feel.

Key patterns to reuse: nav groups (Kits, Workspace sections, Account), sidebar footer with user + sign out, `variant="inset"` content container.
What to remove: charts, data tables, e-commerce widgets, notifications feed.
What to customize: dark slate/indigo tokens (see `UI_DESIGN_SYSTEM.md`); nav items = product routes.
Mobile behavior: hamburger → drawer (`Sheet`); same nav tree.
Accessibility: `SidebarTrigger` is a real button; nav uses landmarks; focus-visible ring from tokens.
Implementation complexity: Medium (new `components/ui/sidebar` primitives + layout restructure; no backend touch).

Candidates:
- Candidate 1 (SELECTED): shadcn sidebar block — native stack, drawer + collapse built in.
- Candidate 2: Flowbite admin dashboard — complete pages but foreign component model, chart-heavy.
- Candidate 3: Hand-rolled top-nav (current code) — cheapest but no mobile story, no workspace frame.

### 2. Landing — SELECTED: Tailark marketing blocks
Purpose: explain JD + Research = Kit; get the user to login/dashboard. Explicitly low investment.

Selected template: Tailark blocks (hero, feature grid, CTA, footer).
Source: https://github.com/tailark/blocks (MIT)

Why this fits: shadcn-native so tokens carry over; restrained sections (no neon clichés); copy-paste without adopting a second design system. Rejected Aceternity (`https://ui.aceternity.com/components`) for landing — beautiful motion but violates "restrained animation" and product-over-decoration. Rejected Magic UI (`https://magicui.design/`) hero effects — same reason; reserve at most one subtle effect.

Key patterns to reuse: centered hero with product shot placeholder (real pipeline diagram, not mock dashboard), 3-step explainer grid (Paste JD → We research → You prepare), single CTA band.
What to remove: pricing, testimonials, logos cloud, animated beams.
What to customize: copy only; pipeline diagram built from real stage names.
Mobile behavior: Tailark blocks are responsive by default; stack grid.
Accessibility: semantic headings, real links, contrast-checked tokens.
Implementation complexity: Low.

### 3. Login / Register — SELECTED: shadcn `login-02` two-column
Purpose: fast credential auth that feels like the product.

Selected template: shadcn auth block login-02 (form column + side panel).
Source: https://ui.shadcn.com/blocks/authentication

Why this fits: same component library as the app; side panel becomes a quiet product explainer (pipeline stages) instead of a stock photo; register reuses the identical shell with `SignupForm`. Rejected centered-card only (current) — fine but misses the chance to orient new users; rejected ShadcnShip split+OAuth (`https://shadcnship.com/blocks/login-01`) — we have no OAuth, don't import dead UI.

Key patterns to reuse: split layout, form with inline errors, loading button state.
What to remove: OAuth buttons, cover image.
What to customize: side panel content = "How your kit gets built" (5 condensed stages); dark tokens.
Mobile behavior: panel hidden below `lg`, centered form (block's built-in behavior).
Accessibility: labeled inputs, `aria-invalid` + error association, visible focus.
Implementation complexity: Low.

### 4. Dashboard — SELECTED: shadcn dashboard block (stat strip + card grid)
Purpose: "What kits do I have, what do I work on next?"

Selected template: SectionCards-style stat strip + status-badged card grid from the shadcn dashboard block.
Source: https://ui.shadcn.com/blocks

Why this fits: maps directly to API data (`status`, `daysRequested`, `createdAt`); "up next" sort (running → due-soon → recent) answers the core question; reuse keeps it coherent with the shell. Rejected chart-heavy dashboards (Flowbite demo `https://flowbite.com/application-ui/demo/`) — "dashboard overload", no charts needed for this product.

Key patterns to reuse: 3 stat cards (Kits in prep, Next interview countdown, Avg MUST coverage), kit card (company eyebrow, role title, status badge, days plan, updated date), empty state.
What to remove: charts, tables, revenue widgets.
What to customize: status badge per `queued/running/ok/failed` (+ progress message inline for running); delete action menu.
Mobile behavior: stats stack, cards single column, full-width New Kit button.
Accessibility: cards are real links with discernible names; status also in text, not color-only.
Implementation complexity: Low/Medium.

### 5. Create Kit — SELECTED: shadcn Dialog + Form (comfort upgrades)
Purpose: make the long JD textarea + URL + days input effortless.

Selected template: shadcn Dialog + Form primitives (evolution of current modal, not a new template).
Source: https://ui.shadcn.com/blocks

Why this fits: no template solves "paste a 4-page JD" better than a well-built form: large textarea with char counter, URL format hint + validation message, days stepper (1–60), resumable draft. A dedicated page vs modal: keep modal on desktop, full-sheet on mobile.

Key patterns to reuse: dialog shell, labeled fields, inline errors, submit loading state.
What to remove: nothing (already minimal).
What to customize: char counter, "paste tips" hint, days stepper buttons, error → field mapping from API 400s.
Mobile behavior: bottom-sheet dialog, textarea min-height preserved.
Accessibility: labels, describedby hints, focus trap (native to Dialog), Esc closes.
Implementation complexity: Low.

### 6. Generation Progress — SELECTED: HyperUI grouped steps
Purpose: make a 13-stage, minutes-long pipeline legible; handle partial/failure states.

Selected template: HyperUI "Grouped with title and description, with highlighted current step" + progress bar.
Source: https://hyperui.dev/components/application/steps/

Why this fits: stage list (Extraction → Crawl → Public research → Brief → Role → Questions → Flashcards → Coverage → Gap fill → Schedule → Validation) maps 1:1 to `progress.stage`; done/current/pending/failed icon states replace the current generic spinner + 3/4 bar; polling already exists, only presentation changes. Rejected shadcn stepper-in-card — horizontal steppers overflow with 11+ stages on mobile. Rejected decorative "AI thinking" animations (Aceternity/Magic) — hide information.

Key patterns to reuse: vertical step rows (icon + title + live message), auto-scroll to current, elapsed-time note, failure card with error message + "Back to dashboard" + "Retry" (if API supports it).
What to remove: marketing decorations.
What to customize: stage metadata map (stage key → title, description, icon); condensed mode on mobile (current + count).
Mobile behavior: collapse completed stages behind "X of 11 done" disclosure.
Accessibility: `ol` + `aria-current="step"`, live region for stage messages, no information by color alone.
Implementation complexity: Low (pure presentation over existing polling).

### 7. Company Brief — SELECTED: shell-native content cards (no external template)
Purpose: scannable research brief with sources.

Why no external template: reading UI; any marketing/research template adds chrome without function. Two-panel summary/what-they-do + source list with favicons + hiring/interview research block (when present) is sufficient.

### 8. Role / Requirements — SELECTED: shell-native requirement rows (Badge + covering-question chips)
Purpose: show requirement → priority → kind → covering questions at a glance.

Why this fits: traceability is product-specific. MUST (red/rose solid) vs NICE (muted outline) badges + kind chip + "covered by q3, q7" chips (deep links) + must/nice filter. No generic template models this relationship.

### 9. Question Builder — SELECTED: grouped lists + dnd-kit Sortable (NOT kanban)
Purpose: the 15-point criterion — edit, reorder, move category, add, delete, regenerate with edit preservation.

Selected pattern: category-grouped vertical lists; each card has drag handle + `useSortable`; dnd-kit `KeyboardSensor` + `sortableKeyboardCoordinates`; `DragOverlay`; non-drag alternative = move up/down buttons + "move to category" menu (the current `<select>` upgraded to a menu).
Sources: https://reui.io/components/sortable, https://github.com/dnd-kit/docs (presets/sortable), https://github.com/sadmann7/sortable

Why NOT kanban: categories are fixed lanes (no workflow), kanban columns crush card width for long prompts/outlines, cross-column drag is fiddly on touch, and reference kanbans (e.g. `mehrdadrafiee/recursive-dnd-kanban-board`) optimize for task cards, not long-form editable content. Grouped lists preserve scanability and make inline editing natural.

Key patterns to reuse: `SortableContext` per category, `verticalListSortingStrategy`, drag handle (rest of card stays interactive), `arrayMove` + optimistic PUT, inline expand-edit (prompt + outline + Save/Cancel), `user_edited` preserved-badge (keep current concept, restyle), per-category Regenerate with spinner + preserved-edit guarantee note, Add-question dialog.
What to remove: kanban columns, swimlanes, story points.
What to customize: card = id + requirement chips + difficulty dots + prompt + outline + actions; empty-category drop zone.
Mobile behavior: drag handle stays but primary reorder = up/down buttons; category move via menu; full-width cards.
Accessibility: keyboard reorder via dnd-kit sensor; buttons for every drag op; `aria-live` announcements on move; focus returns to card after edit save.
Implementation complexity: High (new dep `@dnd-kit/*`, optimistic updates, cross-category move, empty states) — biggest builder risk, implement first.

Candidates:
- Candidate 1 (SELECTED): grouped sortable lists + dnd-kit — best scan + edit + keyboard story.
- Candidate 2: kanban board — familiar DnD but wrong information shape for long Q&A cards.
- Candidate 3: current static lists + select — zero drag, weakest assessment fit.

### 10. Coverage View — SELECTED: shell-native coverage list + Progress
Purpose: "Which requirements am I actually preparing for?"

Why this fits: MUST coverage bar (x/y + `Progress`), per-requirement rows (status icon, badges, covering-question links), uncovered callout on top when non-empty. Table/matrix templates obscure the question links; a list keeps the action (jump to builder) one click away.

### 11. Flashcards — SELECTED: shell-native deck grid (Dashboard card reuse)
Purpose: manage the deck; learning happens in Practice.

Why no new template: deck list = same card-grid component as Dashboard (title, card count, weak-count chip, Edit action). Inline front/back edit via dialog. Coherence > novelty.

### 12. Practice Mode — SELECTED: shadcnexamples Quiz-App flow
Purpose: distraction-free one-card-at-a-time session with confidence + weak-area feedback.

Selected template: Quiz App block (one question at a time → progress → results screen).
Source: https://shadcnexamples.com/quiz-apps

Why this fits: pacing pre-solved (transitions, reveal-gated rating, results reveal); our API already returns weak-first ordering and accepts 1–5 ratings; results screen shows session summary + weakest cards + "practice weak only" action. Current page is structurally close — restyle into this flow, add keyboard shortcuts (Space flip, 1–5 rate).

Key patterns to reuse: progress indicator, flip card, gated rating row, results screen.
What to remove: multiple-choice options, scoring/leaderboard concepts.
What to customize: 1–5 confidence scale with labels (Shaky → Solid), weak-card recap list.
Mobile behavior: full-height card, large tap targets, swipe optional (buttons primary).
Accessibility: Space/Enter flip, 1–5 keys rate, `aria-live` card counter, focus management on advance.
Implementation complexity: Medium.

### 13. Schedule — SELECTED: Flowbite vertical Timeline → day cards
Purpose: "What exactly should I study today?"

Selected template: Flowbite vertical timeline.
Source: https://v3.flowbite.com/docs/components/timeline/

Why this fits: chronological agenda with a "today" ring, per-day focus/minutes/question links, past-day check state; calendar-grid alternatives (FullCalendar-style) overcomplicate a simple N-day plan. Rejected calendar templates — fixed grids waste space for 3–7 day plans and complicate linking questions.

Key patterns to reuse: timeline rail + day nodes, today highlight, minutes chip, question deep-links, mark-done affordance (client-side progress).
Mobile behavior: single rail, full-width day cards.
Accessibility: list semantics, today via text + `aria-current`, links have names.
Implementation complexity: Low/Medium.

### 14. Settings / Profile — SELECTED: minimal shadcn form card
Account email (read-only), change-password (if API adds it — do NOT invent), sign out, delete-account danger zone only if API supports it. No settings template; keep it a single card. Complexity: Low.

### 15. Error / Empty / Loading — SELECTED: shadcn conventions
Empty: icon + title + description + primary action (current dashboard empty state already matches — standardize everywhere: builder categories, flashcards, schedule, kits list). Error: message + Retry + "back to dashboard"; generation failure keeps server message verbatim. Loading: `Skeleton` rows/cards for builder/dashboard; progress steps for generation; skeletons must match final layout shape. Complexity: Low.

### 16. Mobile navigation — SELECTED: shadcn sidebar drawer + scroll tabs
Drawer for global nav; kit workspace sections as scrollable tab bar under header on mobile; bottom nav NOT selected (conflicts with practice tap targets and adds a second nav model). Complexity: Low (mostly built into shell choice).
