# Current State — Frontend Redesign Complete

## Redesign Summary (2026-09-26)
The frontend has been redesigned with a cyberpunk/tactical theme featuring:
- **Frosted glass authentication pages** (login/register) with animated gradient backgrounds
- **Engineering product aesthetic landing page** with animations and hover effects
- **Cyberpunk dashboard design** for all authenticated pages with neon blue accents

## Visual Changes
- Color palette shifted to deep blacks (#0a0a0f to #1a1a28) with neon blue (#0ea5e9) accents
- Glow effects on buttons, cards, and active navigation elements
- Frosted glass effect (`backdrop-blur`) for authentication pages
- Animated gradient backgrounds for auth and landing pages
- Status pulse animations for running/active states
- Neon glow on current step in generation progress
- Timeline with glowing "today" node for schedule

## Files Modified
- `tailwind.config.js` — Added cyberpunk theme extensions (colors, shadows, animations)
- `app/globals.css` — Added CSS variables and utility classes for the new theme
- `components/ui/frosted-glass-card.tsx` — New component for auth pages
- `components/ui/button.tsx` — Updated with neon glow effects
- `components/ui/badge.tsx` — Updated with cyberpunk colors and borders
- `components/ui/empty-state.tsx` — Restyled for cyberpunk theme
- `components/ui/error-card.tsx` — Restyled for cyberpunk theme
- `components/ui/skeleton.tsx` — Updated with shimmer effect
- `components/generation/stage-steps.tsx` — Added neon glow to current step
- `components/schedule/schedule-timeline.tsx` — Cyberpunk timeline with glow effects
- `components/layout/app-shell.tsx` — Cyberpunk sidebar with neon accents
- `components/landing/landing-page.tsx` — Redesigned with animations
- `app/(auth)/login/page.tsx` — Frosted glass centered card design
- `app/(auth)/register/page.tsx` — Frosted glass centered card design
- `app/page.tsx` — Dashboard with cyberpunk styling
- `app/kits/[id]/practice/page.tsx` — Practice mode with neon accents
- `docs/UI_DESIGN_SYSTEM.md` — Updated documentation

## Verification
- `bun run typecheck`: 0 errors
- `bun run build`: Success
- `bun test`: 37/37 tests passing

## Completed
- **Architecture**: Single Next.js App Router Full-Stack Application (Next.js 14 + TypeScript + Bun + MongoDB).
- **Backend & Database**:
  - Mongoose connection manager (`lib/db/client.ts`)
  - User model with bcrypt password hashing (`lib/db/models/User.ts`)
  - Kit model storing internal domain state (`lib/db/models/Kit.ts`)
  - JWT session cookie authentication (`lib/auth/session.ts`)
  - Route Handlers (`app/api/auth/*` and `app/api/kits/*`)
- **Retrieval & Security**:
  - SSRF guard (`lib/retrieval/ssrf.ts`) protecting loopback (`127.0.0.1`), private IPv4, metadata IP (`169.254.169.254`), and non-HTTP protocols.
  - Cheerio web scraper (`lib/retrieval/crawler.ts`) with keyword link ranking, timeout limits, and 500KB page bounds.
  - Public interview research module (`lib/retrieval/interviewSearch.ts`) querying external search feeds for company interview process discussions.
- **LLM Abstraction & Environment**:
  - Model configured to `LLM_MODEL=gemini-3.6-flash`.
  - Strict error handling in `lib/llm/client.ts` enforces that missing `GEMINI_API_KEY` when `MOCK_LLM=false` throws an explicit configuration error rather than silently defaulting to mock generation.
- **Deterministic Invariants & Pipeline Sequence**:
  - Requirement coverage checker (`lib/domain/coverage.ts`)
  - Deterministic study schedule allocator (`lib/domain/scheduler.ts`)
  - Builder state merger preserving user edits (`lib/domain/merger.ts`)
  - Canonical mapper to Appendix A Kit schema (`lib/domain/toExternalKit.ts`)
  - Single source pipeline orchestrator (`lib/pipeline/orchestrator.ts`) executing:
    JD -> Requirement Extraction -> Company Site Crawl -> PUBLIC INTERVIEW RESEARCH -> Company/Role Analysis -> Question/Flashcard Gen -> Coverage Check -> Pass 2 Gap Fill -> Deterministic Scheduling -> Appendix A Validation.
- **CLI Batch Evaluator**:
  - `scripts/evaluate.ts` handling `npm run evaluate -- --input <cases.json> --output <kits.json>`.
  - Tested on 5 representative test cases with full Appendix B & Appendix A compliance.
- **Frontend App Router UI**:
  - Auth pages (`/login`, `/register`)
  - Dashboard (`/`) with kit creation & list view
  - Reshapeable Builder UI (`/kits/[id]`) with editing, reordering, moving categories, adding/deleting questions, and edit-preserving single-category regeneration
  - Practice Mode UI (`/kits/[id]/practice`) with card flip, confidence rating, and weakness sorting

## Verification Results (independently re-verified 2026-09-24)
- **bun run typecheck**: Code 0 (0 errors)
- **bun run lint**: Code 0 (0 errors, 3 pre-existing useEffect warnings)
- **bun test**: Code 0 (18/18 unit & integration tests passed across 7 test files)
- **Mock batch evaluation**: 5/5 cases processed in measured 13.1s. `BatchOutputSchema.safeParse` = true; all 5 kits `KitSchema` = true, exact day counts, no dangling requirement/question refs, integer minutes, difficulty 1..3, `uncovered_requirement_ids` = [].
- **Real Gemini batch evaluation**: PARTIAL (honest status). Live calls confirmed (`provider=gemini`, `model=gemini-3.6-flash`, `MOCK_LLM=false`; model existence confirmed via `models.list`). Successful live generation calls observed: requirement extraction (4 cases) and company brief + role (2 cases), including after the exact-key prompt fixes. Zero full end-to-end kits completed live. Blocker: ALL FOUR provided Google Cloud project keys report daily-exhausted free-tier quota (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, quota 20) — slots 1, 3, 4 failed on the very first generate call; slot 2 yielded 1 live success then exhausted. Additional pressure from 5 req/min per-project limit and recurring 503 demand spikes on `gemini-3.6-flash`. Next step: re-run the subset/merge protocol after the daily reset; no code changes needed. `kits.json` failure entries prove per-case failure isolation (entries written despite individual failures).
- **E2E API audit (dev server + MongoDB)**: register/login/me/logout, kit generate (202) + poll-to-ok, PUT edit, category regenerate with user-edit survival verified true, practice rate + weak-first ordering — all pass.
- **SSRF runtime audit**: loopback/private/metadata/unspecified IPs blocked; direct fetch and redirect-to-private (localhost -> 169.254.169.254) blocked via `fetchWithSsrfProtection`.
- **Deployment**: no public URL yet (pending hosting auth).
- **LLM call budget**: `runPipeline()` makes 3 Gemini calls per case (requirement extraction, company brief + role, pass-1 questions/flashcards) plus 1 conditional gap-fill call — i.e. 3–4 calls/case, 15–20 calls minimum for the 5-case batch with zero retries (`LLM_PROVIDER=gemini`, `LLM_MODEL=gemini-3.6-flash`, `MOCK_LLM=false`).
- **Multi-project local verification pool**: local real-Gemini runs use a 4-slot pool (`GEMINI_API_KEY_1..4`, Slot 1 = pre-existing project key; legacy single `GEMINI_API_KEY` accepted as one-slot fallback). Deterministic `Slot 1 -> 2 -> 3 -> 4` rotation happens ONLY on daily project-quota exhaustion (`GenerateRequestsPerDay*`); 503s, per-minute 429s, network errors, malformed JSON, and schema failures stay on the same slot with existing retry/backoff. Production still uses a single project key (no rotation). Keys live only in gitignored `.env`/`.env.local`, never committed, never printed; logs/stats carry slot numbers and counts only. Every run uses the same canonical `runPipeline()`.
- **Provider rate limiter** (`lib/llm/client.ts`): process-wide sliding 60s window, every real HTTP attempt (including retries) gated via `acquireRateSlot()`; limit from `LLM_REQUESTS_PER_MINUTE` (default 5). Exponential backoff (1s doubling, max 3 attempts) retained. Safe counters via `getLlmStats()` (`successful_calls/failed_calls/failed_attempts/retries/http_requests/runtime_ms` plus `configuredKeySlots/keysUsed/keyRotations/exhaustedKeys`); the evaluator prints them as `[LLM Stats]` with provider/model/mock flags. Mock path makes zero HTTP requests and bypasses limiter/counters. Deterministic daily-quota-only key rotation across `GEMINI_API_KEY_1..4` (legacy `GEMINI_API_KEY` fallback retained).

## Environment Setup & Secrets
- `.env.local`: Configured at project root for local testing (gitignored).
- `.env.example`: Committed template with placeholder non-secret values.

## UI Implementation (Phases 1–7 complete, verified + live-audited)
- **Phase 1 — tokens + shell**: `lib/utils.ts` (`cn`, `daysRemaining`), `components/ui/` (button, badge, skeleton, empty-state, error-card, save-state), `components/layout/app-shell.tsx` (collapsible sidebar, mobile drawer, breadcrumb header, sign-out footer), token CSS (`globals.css`: focus rings, reduced-motion, scrollbars), Sonner `<Toaster>` in layout. Dashboard migrated onto shell (behavior unchanged + char counter, days stepper, toasts).
- **Phase 2 — question builder**: `components/builder/` (types, `use-kit-builder` optimistic state + 800ms debounced PUT + saving/saved/failed + stale-response guard, sortable `QuestionCard` with drag handle + up/down + move-to-category menu + inline editor, `CategorySection` with empty drop zones, add dialog, delete/regen confirms with preserved-count messaging, cross-category dnd-kit DnD with keyboard sensor). Kit page restructured to tabbed workspace (Overview/Brief/Role/Questions/Coverage/Flashcards/Schedule); flashcards editable in place; coverage/role/schedule rows deep-link to questions. Regen backend/merger untouched.
- **Phase 3 — regen UX**: category regen confirm ("N edited/custom protected") + post summary ("X new · Y preserved") + inline error/retry + honest empty-result toast ("existing questions unchanged"); brief regen confirm + inline error/retry. Schedule regen intentionally NOT buttoned: `PUT` already recomputes the schedule deterministically on every save, so a separate control would be redundant (backend `schedule` section support unchanged).
- **Phase 4 — generation progress**: `components/generation/stage-steps.tsx` renders the REAL stages (`queued/validation/extraction/retrieval/public_research/research/generation_pass1/coverage_check/generation_pass2(if needed)/scheduling/complete`, unknown stages humanized) with done/current/pending states, step X-of-N counts (never fake percentages), `aria-current="step"`, auto-scroll, condensed mobile disclosure. Failure view keeps the verbatim server error.
- **Phase 5 — practice**: rewritten distraction-free flow (slim header, progress bar + counter, flip via tap/Space/Enter/button, 1–5 ratings with text labels + number keys, covered/uncovered requirement chips from authoritative kit data, results with weak recap + weak-only drill + restart). GENUINE BUG FIXED (client-only): page posted ratings to non-existent `/practice/rate` (404, silently dropped) — now uses documented `POST /api/kits/[id]/practice`. Ranking stays server-side (weak-first).
- **Phase 6 — dashboard/coverage/schedule**: dashboard stat strip (in-prep count, next-interview countdown, avg MUST coverage), per-card MUST progress + resume labels + two-step delete; coverage rows show question counts; schedule is a vertical timeline with calendar dates, Today ring (`aria-current="date"`), past/today states, client-only done toggles (localStorage). Additive API fields (documented in `API_CONTRACTS.md`): list `summary` counts, detail `createdAt`. No existing field changed.
- **Phase 7 — auth/landing**: `components/auth/auth-split.tsx` (login-02 pattern; panel teaches the real pipeline); login/register share it with labeled inputs, inline errors, loading buttons; `/` renders compact landing (hero + 3 steps + capabilities + CTA) for logged-out users instead of redirecting.
- **Final audit additions**: explicit `[ Rebuild schedule ]` button (existing deterministic `POST regenerate {section:"schedule"}` path — no LLM, edits untouched, loading + toast + inline retry); mobile drawer now closes on any nav tap (same-path taps previously left it open); pluralization nit fixed.
- **Real browser audit (headless Chromium via pre-installed ms-playwright build, playwright-core in out-of-repo temp sandbox — repo deps untouched)**: 20/20 scripted checks PASS with 18 screenshots. Desktop: landing hero, register split, dashboard title/empty, 7 workspace tabs, schedule rebuild toast, inline edit→Edited badge→Saved state, keyboard reorder via Enter (order verifiably changed), move-to-category menu→card landed in Behavioural, add→Custom badge, delete→toast, regen confirm preservation text→post summary, practice flip via Space→rate via "4"→results screen. Generation progress captured via stubbed mid-pipeline stage: 6 done checks + highlighted current + "Step 7 of 11" (visual proof). Mobile 390px: dashboard, drawer open/close, builder, schedule. States seen live: loading skeletons, empty states, toasts, regen summary, practice results. NOT live-triggered (mock LLM never fails): save-failure toast, regen-failure inline error, generation-failure card — code paths exist and share the tested error components, but remain unexercised end-to-end.
- **Verification-state ledger**: API/E2E verified (flows above + prior SSRF/pipeline audits) · browser verified (headless Chromium, desktop + 390px mobile, 18 screenshots in out-of-repo temp) · keyboard verified (Tab focus, Enter reorder, Space flip, 1–5 rating, Esc closes dialogs/drawer, arrow-key tabs) · drag-and-drop pointer interaction NOT exercised (up/down + menu alternatives were) · screen-reader NOT tested (semantic roles/labels/live-regions in place, no AT pass) · save/regen/generation failure toasts NOT live-triggered (see above).
- **New deps only**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `sonner`, `clsx`, `tailwind-merge`. No pipeline/LLM/schema/database changes.
- **Verification**: typecheck 0 errors; lint 0 errors (1 remaining exhaustive-deps warning, same pre-existing category); `bun test` 22/22; `bun run build` success; mock 5-case batch 5/5 post-change.
- **Live audit (dev server + MongoDB, mock LLM)**: register/me/generate→ok; list `summary` exact; PUT reorder+edited persisted; category regen replaced generated but preserved edited; brief regen ok; practice GET weak-first + rating persisted via fixed route (old `/rate` confirmed 404); DELETE + 404-after; landing/login/register/kit/practice pages all 200. NOT verifiable headless: real browser rendering, touch gestures, screen-reader pass — owed before claiming full UI-complete.
