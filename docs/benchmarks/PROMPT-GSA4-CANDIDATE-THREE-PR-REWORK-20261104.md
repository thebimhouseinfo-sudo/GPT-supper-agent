# PROMPT — GSA4 CANDIDATE | Direct Coding Agent

**MODE:** `DIRECT_AGENT — IMPLEMENTATION & EXPERIMENT`. **Do NOT call GSA plugin, GSA Bootstrap or create a GSA Job.** You are the **GSA4 A0+A1+A2+A3+A4 CANDIDATE** arm. Complete source-grounded implementation and tests on your isolated branch; **no merge to development/main and no deploy**.

## Repository and frozen refs

- Repository: `thebimhouseinfo-sudo/GPT-supper-agent`.
- Work exclusively on `experiment/gsa4-pack-rework-gsa4-candidate`, created from **the same GSA4 product source SHA** as GSA3 Control: `fb5b2427cba5908963a198b154345c775321b635`. Check exact branch head before the first edit.
- **Harness GSA4 pinned:** common development source SHA `fb5b2427cba5908963a198b154345c775321b635`. Load real A0 `harness/shared.ts`, current Role and Skill leaves via `harness-catalog.ts`; consult `selective-harness-preview.ts`, A1 `docs/architecture/GSA4-A1-SOURCE-LOCATOR.json`, A2 `task-context-recipe.ts`, A3 `repair-context-route.ts` and `GSA4-A3-REPAIR-EDGES.json`. Use actual source; these pure selectors do **not** grant execution rights or automatically run inside MCP.
- **A4 current constraint:** For any new `MATERIAL_UPDATE`, `REFACTOR`, `BOOTSTRAP`, unknown Human message, Reviewer/Tester or Planner work, load **FULL original GSA4 Harness**. Use the narrow A4 Coder repair preview only for an explicitly classified `SAME_APPROVED_TASK` product-defect repair with coherent A2/A3/Job/ref checks; otherwise FULL fallback. Never shorten mandatory authorization/Human/branch/CAS/Tester/review rules. A4 read-only preview is not a new Tool #59.
- **Read-only source PRs:** #34 @ `2f320f6d41e32d2807079230c18673494537eddf`, #38 @ `1907e9bc3c697c966b92373a6fc5dacd181080ba`, #40 from `main` @ `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`.
- **Common frozen protocol:** `docs/benchmarks/GSA3-GSA4-THREE-PR-BENCH-PROTOCOL-20261104.md` on `review/gsa4-a4-unmerged-update-packs`. Read full contract, same acceptance and negative tests as GSA3 Control.

## SAME TASK for both arms — rework three legacy packs for current GSA4 physical source

**A. PR #34 / U-B:** Port the *behavior* of **scope-wide Plan supersession** into correct current Job/Plan/Run/Checkpoint modules, not the old monolithic file layout. Cover Phase/Plan multi-Job inventory, reviewed Human boundary, KEEP/REVALIDATE/RETIRE/REPLACE, completed work preservation, pending cursor/Run fence, stale SHA, idempotent successor reservations, zero terminal zombie Tasks/Milestones and no inherited unreviewed PASS. Add exact positive/negative source tests. This is not license to change Project Criteria or approve the Plan yourself.

**B. PR #38 / U-C:** Port accepted on-demand coding-loop engineering/operational artifact guidance from the old `harness-catalog.ts` edit to current `harness/skills/coding-loop.ts`; keep 8 Roles, 11 Skills, auth and existing Skill response shape. Engineering HOW belongs to Coder; consequential unresolved domain/Host choice requires narrowly scoped Human clarification. Distinguish DEV Project source Git/CAS/approval from user-owned operational JOB.md/LISP/Python/DWG/etc while respecting actual Host/folder permissions. No invented UUID/Registry gates or permission bypass. Add tests.

**C. PR #40 / Bootstrap lesson:** Do not merge old `main` or duplicate `WL-034`. Add unique **LLC61** candidate incident for AssetGen `PLAN_CRITERIA_MISMATCH` / `BOOTSTRAP_REQUIRED`, keeping `ROOT_CAUSE_UNVERIFIED` until backed by current code/fixture evidence. Preserve current WL-034/035 and existing four-item brownfield Bootstrap. Only implement a bounded Bootstrap runtime fix if a current source-derived failure is reproduced; otherwise keep as candidate lesson + diagnostic test.

All three packs must be addressed on **this one branch**, not three branches. No unrelated refactor, no new User approval gate and no reliance on an unverified Host simulation.

## PREPARE — NOT MEASURED

Before first source edit: read original PR patches, current code/tests, pinned GSA4 Full Harness + Role/Skill sources, common protocol. Locate current leaf owner using A1 and verify current Git ref/blob; construct A2 current Task references if relevant and follow A3 cross-module dependencies on high-risk/failed-retest paths. Freeze expected tests and source mutation scope. Output `PREPARE_COMPLETE` with exact SHAs, owner/dependency map and implementation plan. **Exclude all preparation, setup, baseline reads and baseline test time** from performance measurement. Never inspect competitor branch or result.

## EXECUTE — MEASURED from first edit

Log `execution_start_utc` **immediately before first product/test/lesson edit**, only if reliably clock-observed. Do not reset across repair/retest loops. Log `execution_end_utc` after a reviewable final changeset and exact-head tests. Count source/tool calls and source bytes if available, first wrong-file choices, A3 expansions on retest, edit→test→repair rounds, final critical defects, changed files, CI run IDs and current regressions. Report model input/output tokens only when actually measured. Exclude PREPARE time/calls/tokens.

Run all applicable U-B/U-C/LLC61 positive & negative tests, existing 58 MCP registration parity, 8 Role/11 Skill golden parity, Node/Deno and current A0–A4 regression, and exact branch CI. A1 first owner does not prove root cause; use bounded A3 dependency scan before risky edits and when retest fails, not as compulsory massive context dump for every call. Preserve Human/Criteria/approved Plan/readback/Run and Cursor gates; no invented PASS or Host access.

Write `docs/benchmarks/THREE-PR-REWORK-GSA4-CANDIDATE-EVIDENCE.md` in your **own** branch with per-pack results, actual measured data, SHA and remaining risks. Open exactly one **DRAFT PR** from this branch to `upgrade/gsa-context-efficiency`, **do not merge**. Finish with exact PR URL, head SHA, checks/CI, hard gates, blockers and measurement limits.

## Isolation and winner selection

Your competitor has the **same** GSA4 code base and tasks but uses GSA3 pinned Harness/process instructions. Do not inspect/control/read the competitor's work or PR until independent evaluation; no shared repair hints. Winner is selected by independently demonstrated correctness, safe negative behavior, reproducible evidence and then execution metrics, not by apparent prompt brevity. Do not retire loser or original PR branches now.
