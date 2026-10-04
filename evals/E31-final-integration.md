# E31 — CP7 Final Integration Matrix

## Purpose

Prove the integrated CP0–CP6 NEXT line behaves coherently before final production promotion, while preserving V2_STABLE compatibility and keeping production main/runtime untouched.

## Scenario matrix

| CP7 scenario | Existing coverage | CP7 integration assertion |
|---|---|---|
| 1. Brownfield coding Job with no Tester checkpoint | E25 compatibility, runtime evidence gate | A reviewed NEXT Task with no EvidenceRequirement/checkpoint dependency remains dispatchable. |
| 2. Job with VERIFY checkpoint | E29-05, E29-09 | Applicable PASS Verification opens only the declared consumer gate. |
| 3. MEASURE/PROBE feeds later Task | E28-01, E29-06 | OBSERVED evidence may satisfy downstream empirical dependency without inventing PASS. |
| 4. Frontend Job using ui-coder-frontend | E27/runtime skill catalog | Frontend specialization exists but is not part of default Coder skills. |
| 5. PRODUCT_FAILURE → repair → RETEST | E29-07 | RETEST requires repaired revision + Goal Recheck and preserves prior evidence. |
| 6. PLAN_GAP → Planner revision | E29-08 | Same-revision execution blocks until reviewed superseding plan exists. |
| 7. Crash/resume around checkpoint | E29-02, E29-03, E29-16 | One deterministic live claim survives replay/reclaim rules. |
| 8. Multi-prerequisite checkpoint | E28-01, E29-13, E29-17 | Integration checkpoint waits for every semantic prerequisite. |
| 9. Legacy V2_STABLE read/resume/complete | E25, E29-11 | NEXT additions remain inert for legacy Jobs. |
| 10. Lessons-learned closure | E26 + canonical ledger | Accepted lessons have canonical owners/evidence; unresolved candidates stay explicitly non-canonical. |

## New CP7 guards

The runtime selftest adds:

- `cp7_next_no_checkpoint_dispatch_allowed`
- `cp7_ui_coder_frontend_remains_opt_in`

These are cross-feature integration guards, not replacements for E25–E30.

## Gate

PASS when:

1. all ten scenarios have explicit executable or capability-bound evidence;
2. the two new CP7 guards are true;
3. no prior E25–E30 regression is weakened;
4. exact reviewed CP7 source is deployed only to `gsa-mcp-next`;
5. production `main` and `gsa-mcp` remain unchanged;
6. accepted workflow lessons are canonically owned;
7. the known CP6 Memory persistence mismatch remains explicit until the authorized durable update succeeds.
