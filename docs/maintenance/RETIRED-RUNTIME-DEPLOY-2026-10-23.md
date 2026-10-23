# RETIRED Job/Task — Runtime rollout (2026-10-23)

## GOAL
Add Plan-driven terminal retirement without fabricating replacement Jobs and without registering or refreshing Super Power/other ChatGPT plugins.

## Production delivery
- Source code commit on `main`: `82ee0def44c98968ec8e8ddcc79a102b27c5d300`
- Supabase project: `fbyqktduoqlpbbtkghkf`
- Edge Function: `gsa-mcp` **v54 ACTIVE**
- `verify_jwt=false` preserved from v53 (existing runtime OAuth handling is unchanged).
- Read back the deployed `index.ts` and verified its bytes exactly equal `main` at the code commit. No Super Power or other plugin registration/change was performed.

## Behavior delivered
- LLC58 Plan impact supports `RETIRE` alongside KEEP, REVALIDATE, REPLACE and HUMAN_DECISION.
- Reviewed immutable Plan reconciliation intent can contain `decision=RETIRE` and **must** have `replacement=null`; no new replacement ID is minted.
- Existing exact-SHA Job fence and resume pathway handles RETIRE with Run/cursor/HEAD reconciliation. PENDING/UNKNOWN cursor or ACTIVE/UNKNOWN Run must settle before terminal transition.
- `job_transition(target_lifecycle=RETIRED)` requires the exact intent and settled activity; writes `lifecycle=RETIRED`, `result=RETIRED`, `retired_by_plan_change_id`, reason and timestamp, with no successor.
- All unfinished Task records under RETIRED Job are RETIRED. REPLACE can mark explicitly obsolete `retired_task_ids` in the terminal predecessor history. RETIRED Tasks are not dispatchable.
- Run lifecycle is unchanged: settle active Run via CANCELLED with Plan-change provenance; no fake RETIRED Run or rollback.
- Cursor recovery recognizes RETIRED as terminal; existing V2_STABLE/NEXT and REPLACE paths remain supported.

## Verification observed
- Supabase first rejected a syntax defect in resume fence condition before deployment; fixed on `main`. Second bundle/deploy succeeded (v54).
- Authenticated, no-write production GSA `job_plan_change_fence_prepare`: RETIRE → allowed UPDATE with null replacement.
- Authenticated, no-write production `job_plan_change_resume_evaluate`: safe RETIRE → `RETIRE_PREDECESSOR_BY_EXACT_SHA`; pending cursor → `RECONCILE_PENDING_SOURCE_CURSOR`.
- Existing REPLACE fence and resume smoke remains valid: `SUPERSEDE_PREDECESSOR_BY_EXACT_SHA`.
- Forged RETIRE action with a replacement is rejected.
- Vercel commit status was success. The independent Node/Deno regression suite is **not** certified PASS solely by that status or by successful Supabase bundling; test sources were committed for subsequent CI review.
- No real Project Job was retired as part of this smoke test; synthetic IDs/records were supplied only to no-write prepare/evaluate tools.

## Connector compatibility boundary
The already-connected ChatGPT GSA plugin still advertises **old** enum schemas for `job_plan_change_assess`, `job_plan_change_prepare` and `job_transition`; the client rejects `RETIRE`/`RETIRED` before network invocation. The deployed MCP runtime implements the new tool schemas, but existing client registrations may require a later schema refresh/reconnect. Per Human instruction, do **not** register Super Power or any other plugin now.

## Outstanding quality gate
Run the committed `test-lab/llc58-plan-change.test.cjs`, `test-lab/llc58-plan-intent.test.cjs` and the full runtime Node/Deno checks on a usable runner, plus a test-namespace Job lifecycle E2E after client schema refresh. Do not misrepresent missing evidence as PASS.
