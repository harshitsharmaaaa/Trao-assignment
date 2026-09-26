# UI Page Map — AI Interview Prep Kit

> Authoritative UI planning document (see `AGENTS.md`). Route → purpose → pattern → components → interactions → responsive.
> Shell for all authenticated routes: shadcn sidebar (drawer on mobile) + header w/ breadcrumb. Tab bar for kit workspace sections on mobile.

| Route | Purpose | Pattern | Primary components | Key interactions | Responsive |
|-------|---------|---------|-------------------|------------------|-----------|
| `/login` | Sign in | shadcn login-02 split (form + product panel) | Form, Input, Button, inline error | Submit→`POST /api/auth/login`→`/`; loading + error states | Panel hidden <lg; centered form |
| `/register` | Create account | Same split shell, SignupForm | Same | Submit→login→`/` | Same |
| `/` Dashboard | Kit inventory + next action | Stat strip + status card grid + New Kit dialog | Sidebar, StatCards, KitCard, EmptyState, CreateKitDialog | Create (modal), open, delete menu, resume running | 1→2→3 col grid; full-width CTA |
| `/` modal: Create Kit | JD + URL + days input | Dialog form w/ char counter + stepper | Textarea, URL input, days stepper, validation | Validate inline; POST generate→`/kits/[id]` (poll there) | Bottom sheet on mobile |
| `/kits/[id]` (running) | Generation progress | HyperUI grouped steps | StepList, ProgressBar, FailureCard | 2s poll; auto-scroll; failure→retry/exit | Condensed "X of 11" disclosure |
| `/kits/[id]` Overview tab | Research summary at a glance | Stat + source cards | SourceCards, status chips | Link out to company URL; jump to sections | Stack |
| `/kits/[id]` Brief tab | Scannable company research | Two-panel summary + sources | BriefPanels, SourceList, RegenButton | Regenerate brief (edit-safe) | Stack panels |
| `/kits/[id]` Role tab | Requirements + traceability | Badge rows + covering chips | ReqRow, Badge, Filter | Filter must/nice; chip→jump to question | 1→2 col |
| `/kits/[id]` Questions tab | Builder (edit/reorder/move/add/delete/regen) | Grouped dnd-kit Sortable lists | SortableCard, DragHandle, InlineEditor, CategoryMenu, RegenButton, AddDialog | Drag + keyboard reorder; inline edit; move category; add/delete; per-category regen w/ preserved-badge | Buttons replace drag; scroll tabs |
| `/kits/[id]` Coverage tab | "What am I preparing for" | Coverage bar + per-req rows | Progress, CoverageRow, UncoveredCallout | Row→deep link to builder question | Stack |
| `/kits/[id]` Flashcards tab | Deck management | Reused card grid + edit dialog | DeckTable/Grid, CardEditor | Inline edit, delete, jump to practice | Same as dashboard |
| `/kits/[id]/practice` | Distraction-free drill | Quiz one-at-a-time flow | ProgressBar, FlipCard, RateRow, ResultsScreen | Flip (Space), rate 1–5 (keys), weak-only recap, restart | Full-height card; big targets |
| `/kits/[id]` Schedule tab | Day-by-day plan | Vertical timeline day cards | Timeline, DayCard, TodayRing | Question deep-links; client-side done toggles | Single rail |
| `/profile` (new, only if API allows) | Account | Minimal form card | AccountCard, SignOut | View email; sign out | Stack |
| `*` error/empty | Failure handling | Error card / empty block / skeleton | ErrorCard, EmptyState, Skeleton | Retry same action; escape to dashboard | Centered, full-width actions |

## Notes
- Kit workspace = ONE route with tabs (Overview/Brief/Role/Questions/Coverage/Flashcards/Schedule), not 7 pages — preserves context, enables deep links (`#q3`), keeps sidebar stable. Practice stays a separate route for distraction-free mode.
- `/profile`: implement only what `GET /api/auth/me` supports (email display + sign out). Do NOT invent profile editing without an API.
- Create Kit stays a modal on Dashboard (current behavior, assessment-neutral); promote to page only if JD comfort demands it.
- Generation polling stays at 2s (current); progress UI is presentation-only over `progress.stage/message`.
- Every list surface (kits, categories, deck, schedule, coverage) has a designed empty state; every mutation has toast + inline error; every drag has a button alternative.
