# Trao — AI Interview Prep Kit Application

A single, full-stack Next.js App Router application (Next.js + TypeScript + Bun + MongoDB) that transforms a job description (JD), company website URL, and target preparation duration ($N$ days) into a personalized, structured interview preparation kit.

---

## Features
- **User Authentication**: Secure user registration, login, logout, and isolated kit ownership using JWT HTTP-only session cookies.
- **Company Website Scraper & Link Ranker**: Cheerio-based crawler with SSRF protection that discovers hiring, careers, and engineering culture pages.
- **Public Interview Process Research**: Dedicated external search module (`lib/retrieval/interviewSearch.ts`) that searches for public interview process discussions and engineering culture insights, handling zero results honestly.
- **LLM Abstraction & Retries**: Gemini API provider (`LLM_MODEL=gemini-3.6-flash`) with exponential backoff retries and structured schema validation. Strict error handling ensures missing API keys throw explicit errors when `MOCK_LLM=false`.
- **Multi-Stage Pipeline Orchestrator**: Shared pipeline orchestrator used identically by API Route Handlers and CLI batch evaluation.
- **Deterministic Domain Invariants**:
  - Deterministic requirement coverage checker (`must` vs `nice` requirements).
  - Deterministic schedule allocator across $N$ study days.
  - Granular builder state merger preserving user edits during single-category regeneration.
- **Reshapeable Kit Builder**: Edit prompts/outlines, reorder questions, move categories, add/delete questions/flashcards, and regenerate specific categories without losing edits.
- **Practice Mode**: Confidence-weighted flashcard review with dynamic weakness sorting.
- **Mandatory CLI Batch Evaluator**: CLI batch processor adhering strictly to Appendix B input/output contracts.

---

## Pipeline Execution Sequence

```
Job Description (JD) + Company URL + Target Days
  │
  ├── 1. Requirement Extraction (technical | behavioural | domain, must | nice)
  ├── 2. Company Site Crawl (homepage & candidate link discovery: careers/jobs/values)
  ├── 3. PUBLIC INTERVIEW RESEARCH (external search query for interview process discussions)
  ├── 4. Company Brief & Role Breakdown (integrates crawl text + public research + JD)
  ├── 5. Pass 1 Question & Flashcard Generation
  ├── 6. Deterministic Coverage Check (identifies uncovered MUST requirement IDs)
  ├── 7. Pass 2 Gap Question Generation (bounded gap fill for missing MUST items)
  ├── 8. Deterministic Schedule Allocation (partitions questions across N days)
  └── 9. Appendix A Schema Validation (Zod KitSchema contract verification)
```

---

## Directory Structure
```
trao/
├── app/
│   ├── api/
│   │   ├── auth/         # Auth Route Handlers (register, login, logout, me)
│   │   └── kits/         # Kit CRUD, practice, & async generation handlers
│   ├── (auth)/           # Authentication UI pages
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          # Dashboard UI
├── components/           # Reusable React components
├── lib/                  # Server-only domain & infrastructure modules
│   ├── db/               # Mongoose client & User/Kit models
│   ├── retrieval/        # SSRF guard, Cheerio crawler, link ranker, interview search
│   ├── llm/              # Gemini API client (gemini-3.6-flash) & backoff retries
│   ├── domain/           # Coverage checker, day scheduler, state merger, canonical mapper
│   └── pipeline/         # Shared multi-stage pipeline orchestrator
├── schemas/              # Appendix A KitSchema & Appendix B BatchOutputSchema
├── scripts/
│   └── evaluate.ts       # Mandatory CLI batch evaluator
├── tests/                # Unit and integration test suites
└── docs/                 # Engineering documentation
```

---

## Environment Variables Configuration

Create `.env.local` at project root for local development. Never commit `.env.local` to Git.

### Server-Only Environment Variables Table

| Variable | Purpose | Required? | Default / Example | Safe Example |
| :--- | :--- | :---: | :--- | :--- |
| `MONGODB_URI` | MongoDB connection string | Yes (Prod) | `mongodb://localhost:27017/trao` | `mongodb://localhost:27017/trao` |
| `JWT_SECRET` | Secret key for JWT session cookies | Yes | 32+ char secret string | `local-dev-jwt-secret-key-32-chars-min` |
| `GEMINI_API_KEY` | Google Gemini API Key | Yes (when `MOCK_LLM=false`) | Real Gemini API key | `""` |
| `LLM_PROVIDER` | LLM provider selection (`gemini` or `mock`) | No | `gemini` | `gemini` |
| `LLM_MODEL` | Gemini LLM model identifier | No | `gemini-3.6-flash` | `gemini-3.6-flash` |
| `MOCK_LLM` | Enable mock LLM mode for testing (`true`/`false`) | No | `false` | `false` |
| `ALLOW_LOCAL_URLS` | Permit loopback/localhost fetching in crawler | No (Prod: `false`) | `false` | `false` |

---

## Getting Started

### Installation
```bash
bun install
```

### Running Locally
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification Commands

### 1. TypeScript Typecheck
```bash
bun run typecheck
```

### 2. Code Linting
```bash
bun run lint
```

### 3. Unit & Integration Tests
```bash
bun test
```

### 4. Next.js Production Build
```bash
bun run build
```

---

## Mandatory CLI Batch Evaluator

Execute batch evaluation using the required command format:
```bash
npm run evaluate -- --input cases.json --output kits.json
```

### Batch Input Schema (`cases.json`)
```json
[
  {
    "id": "case_1",
    "jd": "Senior Full-Stack Engineer with React, Node.js, and MongoDB experience...",
    "company_url": "https://stripe.com",
    "days": 7
  }
]
```

### Batch Output Schema (`kits.json`)
```json
{
  "version": "1.0",
  "generated_at": "2026-09-23T19:44:46.000Z",
  "kits": [
    {
      "id": "case_1",
      "status": "ok",
      "kit": { /* Appendix A Compliant Kit */ },
      "error": null
    }
  ]
}
```

---

## Security Architecture
- **SSRF Defense**: `validateAndSanitizeUrl()` filters loopback (`127.0.0.1`), private IPv4 (`10.0.0.0/8`, `192.168.0.0/16`), and Cloud Metadata IP (`169.254.169.254`). Localhost is allowed only when `ALLOW_LOCAL_URLS=true`.
- **Prompt Injection Safeguards**: Untrusted web pages and job descriptions are delimited using `<untrusted_web_content>` and `<untrusted_job_description>` XML tags with strict system prompt boundaries.
- **Authentication**: Passwords are hashed with `bcryptjs`. Session tokens are stored in HTTP-only `JWT` cookies.

---

## Deployment
The application is deployed using standard Next.js App Router deployment conventions (Vercel / Railway / Node.js standalone):
```bash
bun run build
bun run start
```
Configure `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `LLM_MODEL=gemini-3.6-flash`, and `ALLOW_LOCAL_URLS=false` in the deployment platform's environment variables dashboard.
