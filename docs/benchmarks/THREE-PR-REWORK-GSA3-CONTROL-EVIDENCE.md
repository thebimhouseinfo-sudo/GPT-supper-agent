# GSA3 CONTROL — three-PR GSA4 pack rework evidence

**Arm:** CONTROL (Direct Coding Agent, GSA3 Harness from pinned source).  
**Status:** Implementation and source-bound CI GREEN on product-code SHA; final evidence-inclusive HEAD CI follows this file. **Draft PR only; not merged, not deployed, not retired.**  
**Date:** 2026-11-04. **Observation timestamp UTC:** 2026-11-04T12:38:16.779Z.

## 1. Immutable scope and independent-arm fairness

- Repository: `thebimhouseinfo-sudo/GPT-supper-agent`.
- Work branch: `experiment/gsa4-pack-rework-gsa3-control`.
- Original HEAD and common product source SHA: `fb5b2427cba5908963a198b154345c775321b635` (verified exact match before source edits).
- Agent's GSA3 Harness pinned from `main` SHA `0b5cf875402c7735e1ef573ab95df5858c6ac5e8` / `supabase/functions/gsa-mcp/harness-catalog.ts`. Target code is **GSA4 current product source**, not old GSA3 runtime.
- Protocol: `docs/benchmarks/GSA3-GSA4-THREE-PR-BENCH-PROTOCOL-20261104.md` on `review/gsa4-a4-unmerged-update-packs`.
- Original diff references only: [PR #34](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/34), [PR #38](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/38), [PR #40](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/40). No blind cherry-pick.
- No GSA plugin, Bootstrap, new Job, deploy or branch retirement. No reads of the GSA4 candidate branch or competing agent evidence.
- [Draft PR #58](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/58) targets `upgrade/gsa-context-efficiency`.

## 2. PREPARE (excluded from benchmark)

**PREPARE_COMPLETE** was declared before the first edit; the first write began at `2026-11-04T12:20:37.944Z`, after PREPARE. Read the benchmark protocol; all three original PRs and diffs; pinned GSA3 Harness; GSA4 owner modules, schemas, original golden/parity tests and Node/Deno CI workflow. Created owner map and positive/negative case inventory before EXECUTE. PREPARE tool usage, downloads, source-read bytes and time **excluded** from comparative measurements; no source edits in PREPARE.

### Source-to-module owner map

| Legacy pack / location | Current owner actually edited or verified | Boundary |
|---|---|---|
| #34 `plan-change-decisions.ts` | `supabase/functions/gsa-mcp/plan-change-decisions.ts` | Pure impact classifier, approved boundary and deterministic, idempotent intent/resume |
| #34 `plan-change-tools.ts` | `.../plan-change-tools.ts` | Optional scope input on existing LLC58 `job_plan_change_prepare` and `job_plan_change_assess` only |
| #34 `job-prepare-tool.ts` | `.../job-prepare-tool.ts` | Reserved successor identity and fresh Job/Task/Milestone topology after full retirement |
| #34 `job-transition-tool.ts` | `.../job-transition-tool.ts` | Atomic retirement of unfinished Tasks/Milestones, completed evidence preserved |
| #34 old monolithic `run-execution-tools.ts` | `.../run/complete.ts`, facade `run-execution-tools.ts` read-only | Actual A0 extracted `run_complete` owner; late NEXT success fenced |
| #38 old `harness-catalog.ts` Skill | `.../harness/skills/coding-loop.ts` | Coder Skill body only, eight Role modules untouched |
| #40 old ledger and bootstrap validator | `docs/process/GSA-WORKFLOW-LESSONS-LEDGER.md`, `.../bootstrap.ts` **read-only** | Unique LLC61 candidate, no validator rewrite without reproduced defect |
| Cross-cutting checks | `test-lab/ub-gsa4-scope-rework.test.cjs`, `uc-coder-operational-context.test.cjs`, `llc61-assetgen-candidate.test.cjs`, golden tests and CI | Real source-executed fixtures, readbacks marked external |

Other actual source/tests inspected during implementation: `index.ts`, `planning-schemas.ts`, `harness-catalog.ts`, `harness-skill-tools.ts`, `harness/roles/coder.ts`, `test-lab/gsa4-integration-parity.test.cjs`, `gsa4-run-extraction.test.cjs`, `gsa2-harness-dedup.test.cjs`, `gsa1-module-boundary.test.cjs`, `runtime-logic.test.cjs`, `llc58-plan-change.test.cjs`, `llc58-plan-intent.test.cjs`, `bootstrap-checklist.test.cjs`, `bootstrap-workflow-simulation.test.cjs`, and `.github/workflows/gsa-next-logic.yml`. This is a **non-exhaustive list of observed file reads**; exact tool-read call count and cumulative source bytes were not instrumented.

## 3. Three delivered packs

### U-B — PR #34

- Optional Human-reviewed Plan/Phase scope: complete caller-provided Job index, plan-member mapping, phase owner and transitive unfinished cross-boundary dependencies; preserve completed, unrelated Jobs and historical evidence.
- `assessScopeWidePlanChange` returns decisions and `mutation_authorized=false`; **external independent inventory, Human approval and source SHA readback remain mandatory**. A Human approval *reference string* is not independent proof.
- Existing LLC58 Plan reconciliation intent reserves bounded successor IDs one time, with deterministic path and existing-intent reuse; no 1:1 replacement assumption and no new control-plane tool.
- Current Job transition retires unfinished Tasks/Milestones; current `job_prepare` requires complete retired predecessor lineage, fresh ID/topology and new DRAFT Review.
- Existing Plan fences, exact CAS instructions, cursor/active Run reconciliation remain in force; `run/complete.ts` guards **all successful NEXT roles** against pending/retired/stale owning Jobs, while failure settlement remains available.
- Tests include positive PHASE and PLAN classifications, cross-scope dependencies, completed immutable evidence, retry/reuse of intent, missing/duplicate inventory, missing approval marker, incomplete phase mapping, incorrect supplied decision, Run/Cursor active/unknown/missing fence, retirement zombie, lineage and fresh successor acceptance/negative controls.
- Limitation: Pure tool/handler PREPARE simulations **do not independently perform live Memory Repo Job/Run CAS** or prove a real Human approved a historical target. Those remain external acceptance gates.

### U-C — PR #38

- Added Engineering Context and Human Domain/Host decision boundary **only** in `harness/skills/coding-loop.ts`.
- Ordinary engineering HOW remains Coder-owned. Consequential unresolved professional/Host decisions require evidence/targeted Human question; do not re-ask answered requirements.
- Preserve DEV source scope, branch authority, Run/Cursor, SHA/CAS, Reviewer/Tester; operation artifacts (Temp/Custom JOB.md, LISP/Python, DWG/DOCX/DWF/DWT) respect actual Host/file authorization, without invented universal UUID/Registry/promotion or lock/BAK retention rules.
- Source-bound positive and negative tests. Eight Roles and eleven skills preserved; OAuth and fallback/tool-shape parity remain tested.
- **Intentional change exception:** `coding-loop` Skill body and `run_complete` registration must no longer be byte-equal to GSA3; golden checks verify remaining roles, skills and unmodified registrations and check these scoped changes explicitly. No claim of byte-identical 17 handler bodies after U-B.

### LLC61 — PR #40

- Unique `LLC61` candidate; existing `WL-034` and `WL-035` not overwritten, no duplication of original #40's `WL-034`.
- AssetGen incident P-3637: approved source Criteria was missing canonical Memory counterpart (404); subsequent matching blob SHA `d102ec550d8255720a8a8d4ef64efa9f80cdfa63`; caller variants reported `PLAN_CRITERIA_MISMATCH`, source permission reported `BOOTSTRAP_REQUIRED`. Exact conflicting request/actual canonical matcher evidence unavailable; **ROOT_CAUSE_UNVERIFIED**.
- Reproduced **normal** current-source brownfield Plan readiness and genuine negative stale-criteria, missing-Human-approval and typed-Plan binding mismatch. No incorrect rejection reproduced, so **no runtime validator patch** and no bypass of source authorization.

## 4. EXECUTE measured telemetry

- **START UTC:** `2026-11-04T12:20:37.944Z`, captured by runtime immediately before first coding/test/lesson change.
- **Measured execution includes:** 26 commits through source-code SHA `898bb792affe5f66cb00a87780cadbb19c584bb0`; GitHub compare from base confirmed **14 changed files, +780/-21 lines**, of which source vs test lines are visible in compare endpoint. This count is **before the evidence document and final CI-specific bookkeeping**; reread PR metadata for final totals.
- **First owner/edit mistake:** no writes to old monolithic Run file or old Harness catalog; first actual changed owners were current leaves. Exact number of *navigation guesses* was not independently instrumented; do not convert this observation into a global read-precision percentage.
- **Source files read:** paths enumerated above; read call count, bytes and per-call exact timing **NOT_MEASURED** (GitHub connector did not expose a consolidated telemetry trace).
- **Model token usage, model input/output and host cache usage:** **UNKNOWN / NOT EXPOSED**. No estimates recorded as fact.
- **Hosted CI rounds observed:** 4, three initial RED rounds, followed by GREEN. Changes were made after inspection of each actual failed job log. **Three CI repair/retest iterations**; these are hosted test loops, not independent Reviewer/Tester LLM cycles.
- **Human handoffs requested for implementation:** 0. **Unresolved test errors at code-green SHA:** 0. **Independent Host acceptance:** NOT_EXECUTED.
- **Product code CI-green observation:** `2026-11-04T12:33:20Z` (GitHub run #41830224035 updated_at); execution clock remains open until evidence-containing HEAD has a valid CI result and Draft PR is independently inspectable.

### RED → repair → GREEN (actual workflow evidence)

| Source HEAD | GSA NEXT runtime gate | A0-R scoped parity | Evidence-based repair |
|---|---|---|---|
| `734e6433b77120d773a82bbc600a4085db7e7fed` | RED: Node **218/220**, Deno TS2339 | RED: Deno TS2339, Run source parity PASS | Fix test expectations/fixtures and TypeScript union narrowing |
| `14c063d24fbaf800dc03722b0f4b04a86a768f90` | RED: Node **220/220** PASS, Deno TS18047 | RED: Deno nullability, Run parity PASS | Narrow nullable scope summary; preserve valid Task/topology identity |
| `bd4537c06fd0717446ac82fa2037c3e30c0035c8` | RED: Node **220/221**, Deno PASS | PASS | Supply the required planning schemas to the new executable `job_prepare` fixture |
| `898bb792affe5f66cb00a87780cadbb19c584bb0` | **GREEN: Node 221/221, Deno PASS, navigation benchmark PASS** | **GREEN: Deno PASS, scoped Run parity PASS** | Initial end-to-end source-bound GREEN |

Links:
- [First runtime CI #41829414818](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41829414818)
- [Second runtime CI #41829772591](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41829772591)
- [Third runtime CI #41830073628](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41830073628)
- [Code-green runtime CI #41830224035](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41830224035)
- [Code-green scoped parity #41830224316](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41830224316)

## 5. Hard-gate status and limitations

| Gate | Evidence / status |
|---|---|
| Same exact GSA4 base; pinned GSA3 Harness agent process | Verified repository branch original HEAD/base and pinned commit; no candidate-arm access |
| All three packs on current owners | Changed modules + three scoped new test files + LLC61 ledger |
| Human/Criteria/CAS/Run/Cursor boundary | Source-bound positive/negative tested; external live authorized CAS **NOT_EXECUTED** |
| 58 MCP names/order | `test-lab/gsa1-module-boundary.test.cjs` explicitly asserts `names.length === 58`; executed and PASS in 221-test suite |
| 8 Roles/11 Skills and golden parity | GSA3/A0 golden response tests PASS with explicit two scoped intended differences; no Role added |
| Node, Deno and A0-R leaf parity | **PASS on `898bb792...`** via two GitHub Actions runs |
| LLC61 bug claim | **ROOT_CAUSE_UNVERIFIED**, no speculative fix; source-bound negatives PASS |
| Actual Tool/LLM token latency | UNMEASURED; CI host run duration only, not a proxy for model latency |
| Independent production/AssetGen E2E | NOT_EXECUTED; no deploy or unauthorized GitHub Memory writes |
| Competing arm comparison / winner | NOT_OBSERVED; do not infer winner or score against unseen candidate |

**Final verification convention:** On reviewing PR #58, obtain current `head.sha` and its `pull_request` GitHub Actions runs from GitHub. A successful earlier commit is **not** grounds to claim that a later differing HEAD passed unless verified. Draft PR remains unmerged; all reference branches untouched.

## 6. Evidence-inclusive HEAD check and benchmark clock

At **2026-11-04T12:39:16Z**, the first evidence-inclusive HEAD `43e3bd25b43f0b88a01be3d9fb13e9ea311d9735` had **both GitHub Actions workflows completed successfully**, following the source-code GREEN checkpoint:

- [GSA NEXT runtime gate #41831060001](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41831060001), completed GitHub timestamp `2026-11-04T12:39:16Z`: **PASS Node 221/221, Deno typecheck, navigation benchmark**.
- [GSA4 A0-R Run scoped parity #41831060029](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41831060029), completed `2026-11-04T12:39:05Z`: **PASS Run source parity, Deno typecheck**.
- Compare from immutable base to this evidence-inclusive HEAD: **29 commits, 15 changed files, +887/-22 lines**. Actual workflow path was amended to include this benchmark evidence file so that subsequent evidence-only updates are also checked on their exact HEAD.
- **Execution UTC start:** `2026-11-04T12:20:37.944Z`. **Observed first evidence-inclusive GREEN checkpoint UTC:** `2026-11-04T12:39:16Z`. Continuous wall-clock interval **18 min 38.056 s** to that checkpoint (PREPARE excluded, hosted CI time included). This is a timestamp difference, **not agent inference/model compute latency**.
- The act of appending this section creates a newer documentation-only HEAD. **Terminal execution end** is the `updated_at` timestamp of the *latest* successful GitHub Actions runtime-gate run for the final PR #58 `head_sha`. Resolve it on GitHub rather than falsely treating this earlier SHA's success as success for the later HEAD. Preserve CI history as actual evidence; no fixed user-token or tool-call measurement is claimed.
