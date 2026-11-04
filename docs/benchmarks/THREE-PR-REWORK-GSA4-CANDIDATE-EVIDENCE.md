# THREE-PR REWORK — GSA4 A4 CANDIDATE Evidence

**Benchmark protocol:** `docs/benchmarks/GSA3-GSA4-THREE-PR-BENCH-PROTOCOL-20261104.md` on `review/gsa4-a4-unmerged-update-packs`, read before writing.  
**Arm:** GSA4 CANDIDATE / Direct Coding Agent, no GSA plugin, GSA Bootstrap or GSA Job.  
**Repository:** `thebimhouseinfo-sudo/GPT-supper-agent`.  
**Own branch:** `experiment/gsa4-pack-rework-gsa4-candidate`; **exact common working product base:** `fb5b2427cba5908963a198b154345c775321b635`.  
**Draft PR:** [#57](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/57) into `upgrade/gsa-context-efficiency`.  
**Legacy reference PRs only:** #34 at `2f320f6d41e32d2807079230c18673494537eddf`, #38 at `1907e9bc3c697c966b92373a6fc5dacd181080ba`, #40 (`main`); none merged/cherry-picked. **No CONTROL branch/result consulted.**

## PREPARE — excluded from performance

`PREPARE_COMPLETE` before the first source/test/lesson mutation. Inspected protocol, original three PR patches, common-base source and tests, all 8 GSA4 Role leaf files/11 Skill leaf files, complete Shared Harness, A1 source owner locator, A2 Task recipe, A3 dependency graph, A4 Full/Selective policy, Run/Job/Plan/Bootstrap source, NEXT Cursor/Run/verification guards and CI contracts. Original branch HEAD was verified identical to exact common base. No work on another arm.

**A1 source owner map:**

| Legacy pack | Current GSA4 owners, not obsolete monoliths |
| --- | --- |
| PR #34 / U-B | `plan-change-decisions.ts`, `plan-change-tools.ts`, `job-prepare-tool.ts`, `job-transition-tool.ts`, **`run/complete.ts`** (facade `run-execution-tools.ts` unchanged) |
| PR #38 / U-C | `harness/skills/coding-loop.ts` only for policy body; no Shared Harness, Role or public-tool schema edits |
| PR #40 / LLC61 | `docs/process/GSA-WORKFLOW-LESSONS-LEDGER.md`; source-executed `test-lab/llc61-assetgen-bootstrap.test.cjs`; validator inspected, no guessed runtime repair |

**A4 selection:** FULL current Harness for this new Human material Update/Refactor/Review/Brownfield incident task. Selective A4 Coder repair preview not invoked as authority. A1/A2/A3 provide navigation/read decisions, never write authorization.

## Measured EXECUTE provenance

- **execution_start_utc:** `2026-11-04T12:19:29Z` (user-local `2026-11-04T19:19:29+07:00`, observed local-time widget immediately before first change).
- **START commit — test-only RED:** `d755c5688a14be1b51d1ff4ed81db5bfb67fdc42`. This installed U-B, U-C and LLC61 executable test oracles before production code, plus Node CI inclusion.
- **U-B feature:** `693d21a779f61ebe809a3a7ddfce8b77cdaca24e`.
- **U-C Skill + LLC61 lesson:** `2cde690adfa1e7ab6710bd5dc7056be35c4c0f73`.
- **Approved exact-delta golden normalization helper:** `209de061025c5ecb9b390f8d38843ab510b505c8`.
- **Scoped parity test repairs:** `6117ff106ba4c11be03398b795475bf70a715f02` — last verified product/test-code SHA before this evidence-only commit.
- **execution_end_utc:** to be closed against the final **evidence-bearing PR HEAD** CI in the PR conversation; do not mistake product-code PASS or a queued CI as exact-final-HEAD PASS. Last verified code-only CI completed `2026-11-04T12:30:04Z`, approximately 10m35s from START. Final observed wall time including this report and final-head CI must be recorded separately once observed.
- **Source/test code diff up to `6117ff1`:** 15 changed files; GitHub compare reports 949 additions, 22 deletions (before this evidence file). Includes six feature/Skill source modules, one lesson, CI script, and seven changed/new test-related files.
- **Tool-call count / actual model token telemetry:** `UNMEASURED` — connector session does not expose trustworthy per-phase count/model token receipt; no guessed cost or token numbers. Source-read bytes are also `UNMEASURED` as an aggregate despite concrete selected file reads.
- **A3 expansion:** source-grounded manual one-hop Run/Plan/Cursor/Bootstrap/Host dependency check during PREPARE, one extra expansion during repair of changed golden test contracts. **A3 pure-helper automated invocations = 0**; the assistant used A3 navigation guidance, not an authorization or repair gate. No unrelated source owner selected; reported wrong-first-owner = 0 (agent trace not independently audited).
- **Correction rounds after source implementation:** one evidence-driven parity-test repair round, with intermediate CI red from staged commits. No repeated blind source hotfix. GitHub queue/runner time is separate from the wall clock; see runs below.

## Pack results — source-verified, no live Host claims

| Pack | Implemented behavior and negative oracle | Result on code SHA `6117ff1` |
| --- | --- | --- |
| U-B / #34 | Plan/Phase full Job inventory; transitive impacted dependencies; preserve completed and unaffected evidence; Human review, immutable intent, idempotent reserved successor IDs; pending Run/Cursor gates; stale Job SHA, Plan-fenced late successful Run, complete Task/Milestone retirement; direct negative mutation proving the Task-coverage guard matters. `test-lab/ub-scope-wide-plan-change.test.cjs`, LLC58 suite, NEXT/Cursor gates. Ported Run completion into **A0 leaf**. | PASS source/fixture tests; no durable external Memory CAS E2E |
| U-C / #38 | On-demand Coder `coding-loop` engineering context; engineering HOW vs material Domain/Host decisions; DEV Job/Run/branch/CAS protections; user-owned operational JOB.md/LISP/Python/DWG etc without invented registry/UUID/promotion; same-name collision, BAK vs DWL semantics; explicit user/Host file/program permission check. `test-lab/gsa3-tool-skill-payload.test.cjs` UC-01/02/03 and exact legacy Skill behavior comparison. | PASS positive/negative and auth-denial tests |
| LLC61 / #40 | Appended unique LLC61 **CANDIDATE / ROOT_CAUSE_UNVERIFIED / NO_SOURCE_FIX** without reusing `WL-034` (preserving current WL-034 NEXT Task ID and WL-035). Recorded AssetGen `P-3637` observed Criteria SHA `d102ec550d8255720a8a8d4ef64efa9f80cdfa63`, mismatch, denied `MUTATE_SOURCE` and capability observation. Fixture reproduces `PLAN_CRITERIA_MISMATCH` when typed PROJECT_PLAN binding absent, verifies source-plan alternative + precise canonical binding, mismatched SHA, missing Human approval and no Bootstrap write authority. **Actual historical root cause not proven.** | PASS deterministic current-runtime fixture; no live AssetGen reproduction or authorized source mutation |

## CI source runs and failure classification

| Stage / SHA | GitHub Actions | Observed result |
| --- | --- | --- |
| RED test-first `d755c56` | [NEXT #41828615642](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41828615642) | Node 214/227 PASS, 13 expected RED before implementation; Deno and navigation PASS |
| U-B `693d21a` | [NEXT #41828918313](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41828918313), [Run #41828918351](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41828918351) | Staged RED; golden extraction mismatch expected until adapted |
| U-C+LLC61 `2cde690` | [NEXT #41829022488](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41829022488), [Run #41829022449](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41829022449) | 223/227 Node PASS; 4 original A0 byte-golden comparisons fail solely on intentional scoped U-B/U-C deltas; Deno and navigation PASS |
| Exact-delta helper `209de06` | [NEXT #41829618704](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41829618704), [Run #41829618674](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41829618674) | Expected RED until tests wired to helper |
| **Repaired code `6117ff1`** | **[NEXT #41829751750](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41829751750)**, **[Run #41829751972](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41829751972)** | **Both completed SUCCESS; Node 227/227, Run extraction 2/2, two Deno typechecks PASS, navigation benchmark PASS** |

Golden procedure keeps **all original GSA3 fingerprints**. `test-lab/helpers/three-pr-approved-deltas.cjs` must find exact U-B/U-C inserted bytes **once**, fail closed on missing/duplicated/altered delta, restore only those exact approved bytes for original byte-golden comparison, and test the public Skill structuredContent + JSON fallback. This is not suppressing unrelated drift. Source CI continues to check all 58 MCP registrations, 8 Roles, 11 Skills, A0 modules and A1–A4 checks.

## Remaining gates and restrictions

- Real multi-Job Project Memory immutable intent/CAS readback, Host Run callback race, canonical AssetGen source-to-GSA-Memory case, and actual Human/Host E2E: **UNVERIFIED**. Test fixtures do not claim to authenticate external evidence.
- Independent separate Reviewer/Tester decision on exact PR SHA: **NOT PERFORMED** in this direct coding session; hosted CI is not an independent product review.
- No GSA plugin/Bootstrap, GSA Job, fourth feature, Shared Harness/public API expansion, production deployment, source authorization bypass, merge, branch retirement or main mutation.
- Draft PR deliberately awaits separate Human comparative winner selection; no conclusion about CONTROL or claimed speed advantage without independent arm measurements.
