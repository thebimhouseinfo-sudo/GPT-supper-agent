# GSA4 A3 — Read-only failure → dependency → regression context

**Status:** experimental source-aware repair navigation, **not** an automatic bug fixer, product failure classifier, write permission, MCP tool, retry runner or independent Tester.

**Code:** `supabase/functions/gsa-mcp/repair-context-route.ts` exports `buildRepairContextRoute(input)`.  
**Source-grounded graph:** [GSA4-A3-REPAIR-EDGES.json](./GSA4-A3-REPAIR-EDGES.json) records a bounded set of caller/consumer links from existing A0 TypeScript modules. Edges cover Run dispatch, Cursor reconciliation, Checkpoint/Evidence, callback-owned repository probe and OAuth. Their source symbol ownership is checked by tests.  
**Prior layers:** A1 [Source Locator](./GSA4-A1-SOURCE-LOCATOR.md), A2 [Task Context Recipe](./GSA4-A2-TASK-CONTEXT-RECIPE.md). Original A0/A2 development HEAD: `e0eb5eddd661548681d865bc1ba6046a701e2a58`.

## What the function actually does

1. Receives a classified *claim* about a failure, original observed/reproduction references, actual test/source target SHA, A1 locator at that SHA, A3 edge graph at that SHA and optionally the A2 Job/Task context. **Caller data is not authenticated by the pure function**.
2. Looks up only existing error tokens and exact MCP tool names. Returns possible error-emitter owners, tool handler/facade owners, related dependencies and candidate regression tests; **never claims the emitting file is the root cause**.
3. Adds one hop of source-grounded caller/consumer links; on `failed_retest`, widens to two hops and requires fresh evidence instead of silently trying another patch.
4. Returns `decision: STOP | PROBE | READ_MORE | REVIEW_REFERENCES`, `source_candidates`, `test_candidates`, `findings` and `review_and_retest`. All pointers require current Git/blob and test-oracle verification.
5. Always returns `advisory_only=true`, `repair_authorized=false`, `test_pass_claimed=false`, `root_cause_confirmed=false`. It does not call an MCP tool, alter a Job/Run/Cursor, write Git files or synthesize Host evidence.

## Negative controls

| Input class | A3 response | Cannot do |
| --- | --- | --- |
| `ENVIRONMENT_FAILURE` or missing Host capability | `PROBE` with actual execution capability recheck | Infer product defect, issue automatic Coder repair or claim PASS |
| `SPEC_GAP` / conflicting acceptance | `STOP` to Planner/Human | Implement a guessed product behavior |
| `UNKNOWN` / unobserved failure | `READ_MORE` and locate fresh failure proof | Use a paper simulation as test evidence |
| Product repro with exact failure code, target SHA, expected/actual and observed evidence | Source + test candidates; still `READ_MORE` if A2 has unmet readback | Conflate reproduced error emitter with verified root cause |
| Stale A1/A3 ref, missing/blocked Task or mismatched A2 identity | `STOP` or `READ_MORE` depending on blocker | Follow a forged or stale owner path |
| Failed retest | Expand to related callers/consumers; demand independent Reviewer/Tester evidence | Loop repair without scope bound |
| Checkpoint verification or evidence publish failure | Include Evidence validation, Checkpoint gate and/or nested root callback as applicable | Assume handler leaf is the only source of error |

**Example:** `checkpoint_verification_prepare` calls `validateEvidenceBundleAttestationSnapshot` through existing injected dependencies. `evidence_repository_publish_finalize` calls `validateRepositoryProbeSnapshot` implemented **inside** root `createServer`. Small A modules help navigation but do not eliminate cross-module root causes.

## Acceptance and measurement

`test-lab/gsa4-a3-repair-context.test.cjs` executes the real TypeScript source using the current A2 source and catalog. It checks nine cases: graph source symbols/tests, source candidates, environment probe, specification STOP, unknown/unobserved evidence, failed retest expansion, repository probe callback, stale/forged references and non-mutation. Added to existing GSA NEXT Node + Deno CI.

**No measured repair benefit yet.** For a meaningful next experiment compare identical frozen defects at GSA3 KEEP, A0, A1, A1+A2 and A1+A2+A3. Measure initial wrong-file reads, full source+test bytes, extra calls/latency, actual root-cause discovery, changed-file breadth, edit→review→retest iterations, negative regression outcomes and correct ASK/STOP. Source/test execution proving the helper works is **not** a benchmark proving fewer bugs.

**Scope:** this PR does not wire A3 automatically into `run_begin`, change the 58 registered tools, alter approval/Criteria/Skill delivery, merge `main` or deploy.
