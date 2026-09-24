# Implementation Plan

## Phase 0 — Environment + Single-App Bootstrap (as built)
- Initialize single Next.js App Router application (`package.json`, `tsconfig.json`, `next.config.mjs`).
- No monorepo, no workspace packages, no separate Express server (see ADR-001).
- Verify Bun install, typecheck, tests, and production build.

## Phase 1 — Shared Contracts & Schemas
- Define Appendix A Kit schema and Appendix B Batch output schema using Zod.
- Define internal domain state model, API request/response schemas.

## Phase 2 — Backend Foundation & Database
- Express app setup with error handling middleware and environment validation.
- MongoDB connection setup with Mongoose models (User, Kit, Session).

## Phase 3 — Authentication
- Register, login, logout HTTP endpoints and password hashing with bcrypt.
- Session middleware and route authorization checks.

## Phase 4 — Retrieval & Security Engine
- URL validation & SSRF protection filter.
- HTML scraper, Cheerio page cleaner, dynamic link ranker for hiring/about pages.
- Public interview discussion search module.
- Respect robots.txt & rate limiting backoff.

## Phase 5 — LLM Abstraction Layer
- Unified LLM provider interface (`extractRequirements`, `generateCompanyBrief`, `generateRoleAnalysis`, `generateQuestions`, `generateFlashcards`, `generateGapQuestions`).
- Structured Zod JSON validation, exponential backoff retries, rate-limit handler.

## Phase 6 — Core Pipeline & Deterministic Logic
- Pipeline orchestrator chaining research, generation, deterministic coverage check, gap fill, schedule allocation.
- Deterministic coverage checker & deterministic scheduler.
- Up to 2-pass gap filling loop.

## Phase 7 — Builder & State Preservation
- Implement internal model vs canonical external mapper.
- Section-level regeneration logic preserving user edits (`user_edited`, `is_custom`, `pinned` flags).

## Phase 8 — Practice Mode Logic
- Confidence rating recording and adaptive confidence-weighted card sorting algorithm.

## Phase 9 — Batch Evaluator CLI
- Root script `scripts/evaluate.ts` exposed via `npm run evaluate -- --input <cases.json> --output <kits.json>`.
- Full isolated processing per case, matching Appendix B contract.

## Phase 10 — Frontend UI (Next.js + Tailwind CSS)
- Auth screens, Dashboard, Kit Generation with progress polling, Kit Builder UI, Practice Mode UI, Error & Empty states.

## Phase 11 — Testing & Hardening
- Automated unit tests for coverage checking, scheduling arithmetic, schema validation, SSRF guard, state merger, batch evaluator.

## Phase 12 — Final Documentation & Deployment
- Deployment setup, README update, final walkthrough preparation.
