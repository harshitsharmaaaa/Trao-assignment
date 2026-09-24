# Architecture Overview — Single Next.js Application

## Repository Layout
The application is structured as a clean, single Next.js App Router project:

```
Trao/
├── app/
│   ├── api/
│   │   ├── auth/         # Session auth route handlers (register, login, logout)
│   │   └── kits/         # Kit CRUD & asynchronous generation endpoints
│   ├── (auth)/           # Frontend authentication pages
│   ├── (dashboard)/      # Frontend dashboard, builder, & practice pages
│   ├── globals.css
│   └── layout.tsx
├── components/           # Reusable UI components (builder, practice, forms)
├── lib/                  # Server-only domain and infrastructure modules
│   ├── db/               # MongoDB client & Mongoose models
│   ├── retrieval/        # SSRF security guard, Cheerio page crawler, link ranker
│   ├── llm/              # Gemini LLM provider abstraction & retry logic
│   ├── domain/           # Deterministic coverage, day scheduler, state merger
│   └── pipeline/         # Multi-stage orchestrator (used by API & CLI evaluator)
├── schemas/              # Appendix A KitSchema & Appendix B BatchOutputSchema
├── scripts/
│   └── evaluate.ts       # Mandatory CLI batch evaluator (npm run evaluate)
├── tests/                # Automated unit & integration tests
├── docs/                 # Living engineering documentation
└── AGENTS.md
```

## Core Boundaries
1. **Next.js Route Handlers (`app/api/*`)**: Thin API controllers that handle HTTP validation, authentication, and delegate work to `lib/`.
2. **Server-Only Domain Modules (`lib/*`)**: Isolated business logic (retrieval, LLM interaction, deterministic invariants, persistence).
3. **Canonical Pipeline Entry (`lib/pipeline/orchestrator.ts`)**: Single-source pipeline logic shared directly between API Route Handlers and `scripts/evaluate.ts`.
4. **Schemas (`schemas/*`)**: Strictly typed Zod definitions guaranteeing Appendix A and Appendix B contract compliance.
