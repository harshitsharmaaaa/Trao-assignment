# Current State — Final Pre-Submission Verification Complete

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
- **Real Gemini batch evaluation**: PARTIAL. Live calls confirmed (`provider=gemini`, `model=gemini-3.6-flash`, `MOCK_LLM=false`; model existence confirmed via `models.list`). Requirement extraction and company-brief steps succeeded live after prompt-shape fixes. Full-kit success blocked by free-tier limits: 20 generate requests/day + 5/min + recurring 503 demand spikes on `gemini-3.6-flash`. `kits.json` failure entries prove per-case failure isolation (5 entries written despite individual failures).
- **E2E API audit (dev server + MongoDB)**: register/login/me/logout, kit generate (202) + poll-to-ok, PUT edit, category regenerate with user-edit survival verified true, practice rate + weak-first ordering — all pass.
- **SSRF runtime audit**: loopback/private/metadata/unspecified IPs blocked; direct fetch and redirect-to-private (localhost -> 169.254.169.254) blocked via `fetchWithSsrfProtection`.
- **Deployment**: no public URL yet (pending hosting auth).
- **LLM call budget**: `runPipeline()` makes 3 Gemini calls per case (requirement extraction, company brief + role, pass-1 questions/flashcards) plus 1 conditional gap-fill call — i.e. 3–4 calls/case, 15–20 calls minimum for the 5-case batch with zero retries (`LLM_PROVIDER=gemini`, `LLM_MODEL=gemini-3.6-flash`, `MOCK_LLM=false`).
- **Multi-project local verification methodology**: production uses a single `GEMINI_API_KEY` (no rotation). For local real-Gemini proofs only, the 5 cases may be split across runs, each run using a different Google Cloud project's key supplied via process environment (keys never written to disk, never committed, never printed). Per-run outputs are merged with an out-of-repo script that validates Appendix B, rejects duplicate case IDs, and reports only `cases/ok/failed` counts. Every run uses the same canonical `runPipeline()`.

## Environment Setup & Secrets
- `.env.local`: Configured at project root for local testing (gitignored).
- `.env.example`: Committed template with placeholder non-secret values.
