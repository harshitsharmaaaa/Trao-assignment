# API Contracts (Next.js Route Handlers)

## Authentication Route Handlers
- `POST /api/auth/register` -> `{ user: { id, email }, message }`
- `POST /api/auth/login` -> `{ user: { id, email }, message }`
- `POST /api/auth/logout` -> `{ message }`
- `GET /api/auth/me` -> `{ user: { id, email } }`

## Kit Generation & Management Route Handlers
- `POST /api/kits/generate` -> `202 Accepted` `{ kitId, status: "queued" }`
- `GET /api/kits/[id]` -> `{ kitId, status: "queued"|"running"|"ok"|"failed", progress: { stage, message }, kit: KitSchema | null, error: ErrorSchema | null }`
- `GET /api/kits` -> `{ kits: Array<{ id, role, company, createdAt, status }> }`
- `PUT /api/kits/[id]` -> Update internal kit document (inline edits, reordering, additions, deletions).
- `POST /api/kits/[id]/regenerate` -> Body: `{ section: "company_brief" | "schedule" | "technical" | "behavioural" | "system-design" | "company-fit" }`. Retains user edits.
- `DELETE /api/kits/[id]` -> `{ success: true }`

## Practice Route Handlers
- `GET /api/kits/[id]/practice` -> `{ flashcards: Array<{ id, front, back, confidence: number, lastReviewedAt: string }> }` (sorted lowest-confidence first)
- `POST /api/kits/[id]/practice` -> Body: `{ flashcardId: string, confidence: number }` (1 to 5)
