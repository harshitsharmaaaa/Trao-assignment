# Architectural Decisions Record (ADR)

## ADR-001: Single Next.js Full-Stack Application Architecture
- **Context**: The assessment prefers Next.js frontend + Node/Express backend, but permits equivalent tech stacks when justified.
- **Decision**: Build the entire system as a single Next.js App Router full-stack application using TypeScript and Bun.
- **Justification**: A single Next.js full-stack application reduces deployment, dependency, API-contract, and local-development complexity for a 2–3 day take-home while still providing clear separation of domain concerns through server-only modules in `lib/`.
- **Consequences**: No monorepo overhead, no cross-package workspace building, unified deployment target, and direct access to domain pipelines from both API Route Handlers (`app/api/`) and the CLI evaluator (`scripts/evaluate.ts`).

## ADR-002: Deterministic Invariants Outside LLM
- **Context**: LLMs are non-deterministic and can fail to allocate days correctly or check requirement coverage accurately.
- **Decision**: Arithmetic allocation of $N$ study days and requirement coverage checking are written in strict TypeScript functions (`lib/domain/scheduler.ts`, `lib/domain/coverage.ts`).
- **Rationale**: Guarantees 100% compliance with exact day counts and missing requirement identification.

## ADR-003: Internal Model vs Appendix A External Kit Schema
- **Context**: Users can edit questions, add flashcards, or regenerate single categories. Regenerating must NOT overwrite user-edited material.
- **Decision**: Store internal kit documents with metadata (`user_edited: true`, `is_custom: true`). Export to Appendix A schema via a canonical mapper function `toExternalKit(internalKit)`.
- **Rationale**: Isolates internal state management from the hard requirement of Appendix A schema compliance.

## ADR-004: Bounded 2-Pass Coverage Loop
- **Context**: Section 4 & 5 require gap identification and missing question generation for uncovered `must` requirements.
- **Decision**: Pass 1 generates initial questions. Coverage checker finds uncovered `must` requirement IDs. Pass 2 generates targeted gap questions. Final coverage recheck records remaining uncovered IDs without looping endlessly (max passes = 2).
- **Rationale**: Prevents infinite loops, respects free-tier token budgets, and ensures must-haves are covered.
