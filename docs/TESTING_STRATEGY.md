# Testing Strategy

## Primary Invariants Under Test
1. **Deterministic Schedule Allocation**:
   - Verify schedule outputs exactly $N$ days for any $N \in [1, 60]$.
   - Verify every `must` requirement's questions appear in the schedule.
   - Verify integer minutes (no floats).
   - Verify zero questions edge case outputs $N$ days with 0 minutes and honest focus.
2. **Coverage Checker**:
   - Verify detection of covered vs uncovered requirement IDs.
   - Verify loop terminates at pass limit (max 2 passes).
3. **Appendix A Schema Validation**:
   - Verify Zod schema strictly validates generated kits.
   - Verify exact field names and value constraints (difficulty 1..3, priority must|nice, category types, kind types).
4. **Regeneration Preservation**:
   - Verify user-edited questions (`user_edited: true`) are preserved when regenerating a question category.
5. **SSRF Guard**:
   - Verify private IP addresses (127.0.0.1, 10.0.0.1, 192.168.1.1, 169.254.169.254) are rejected in production URL validator mode, while permitting localhost when `ALLOW_LOCAL_URLS=true` for batch evaluation tests.
6. **Batch Evaluator**:
   - Verify `evaluate.ts` handles partial errors cleanly without crashing batch execution.
