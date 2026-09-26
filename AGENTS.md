# AGENTS.md — Instructions for AI Agents

Before implementing any feature or modifying any code in this repository:

1. Read `AGENTS.md` (this file).
2. Read `docs/PROJECT_CONTEXT.md`.
3. Read `docs/CURRENT_STATE.md`.
4. Read `docs/IMPLEMENTATION_PLAN.md`.
5. Read relevant domain docs (`docs/ARCHITECTURE.md`, `docs/GENERATION_PIPELINE.md`, `docs/API_CONTRACTS.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/TESTING_STRATEGY.md`).
6. Inspect actual code files.
7. Verify whether documentation matches reality.
8. For any frontend/UI work, treat `docs/UI_TEMPLATE_RESEARCH.md`, `docs/UI_DESIGN_SYSTEM.md`, and `docs/UI_PAGE_MAP.md` as the authoritative UI planning documents.

## Source of Truth Rules
- If code and documentation disagree, determine actual status, update documentation in the SAME task, and then proceed.
- Never invent requirements not in the authoritative spec (`software-engineer-assignment.pdf`).
- Keep all external contracts strictly adhering to Appendix A (`KitSchema`) and Appendix B (`BatchOutputSchema`).
- Do NOT bypass deterministic steps (coverage check, schedule allocation, requirement mapping) by delegating them to LLMs.
