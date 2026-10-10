# GSA Reliability — Detailed Execution Plan and Review Record
Date: 2026-10-08
Status: **PLANNER REVISED AFTER HUMAN-INVOKED CR — AWAITING INDEPENDENT RE-REVIEW; NO IMPLEMENTATION APPROVAL**
Production baseline: `gsa-mcp` v44; `main` is production source; new implementation branch is **not created** by this plan.

## 0. Decision and guardrails
- Single canonical implementation branch `upgrade/gsa-reliability`, forked from latest reviewed `main` **after this plan is approved**.
- `main` remains open only for reviewed production hotfixes and low-risk documentation; *no* partially completed runtime/lifecycle migration enters main.
- Every completed, reviewed Job Pack merges promptly to the integration branch. Main-only hotfixes are cherry-picked/reconciled after impact review at the next checkpoint. No force-push, competing long-lived integration branches or mass commit archaeology.
- Separate Human approvals: implementation start; final main merge; production deploy. Old Jobs remain V2_STABLE; no bulk migration, no unrelated source updates.
- Distinguish verification categories: TYPECHECK / HELPER_SIMULATION / REPO_INTEGRATION / LIVE_E2E. Unsupported paths remain UNVERIFIED, never PASS.

### 0.1 Runtime ownership and resumption contract (CR-01)

**Confirmed from source:** `get_runtime_status` identifies `M2_AUTONOMOUS_SAME_TURN_ORCHESTRATION`; ChatGPT's orchestration invokes MCP tools and external GitHub actions. Supabase `gsa-mcp` is a request/response runtime, and GitHub Project Memory + source Git refs are durable authorities. **No always-on GSA job supervisor, background timer, daemon, or durable chat stream is demonstrated.**

| Trigger/boundary | Responsible component | Required action | Evidence / stop rule |
|---|---|---|---|
| New or resumed chat / explicit project open | ChatGPT Orchestrator guided by shared harness | Re-ground active Project, authorized source, Job/Run snapshots and canonical Git branch *before* proposing source mutation | current Project SHA + Job/Run revision + Git head; absent snapshots → BLOCKED, not inferred progress |
| `run_begin`, `job_transition`, `run_complete`, checkpoint tool call | Existing MCP handler (where that handler actually owns the gate) | Check Job/Run/revision, valid lifecycle, exact snapshot and CAS prerequisites; emit fail-closed prepared records only | explicit allowed/denied tool result; later persisted Git read-back is separate |
| External GitHub source/Memory write | ChatGPT Orchestrator + GitHub connector | Obtain authoritative target/head SHA; write once; independently read back content/SHA. When response is lost, classify APPLIED / NOT_APPLIED / UNKNOWN_CONFLICT before any retry | exact returned or re-fetched Git SHA/tree/blob; UNKNOWN_CONFLICT pauses |
| Same-chat repeated work without progress | Orchestrator's bounded loop, optionally assisted by MCP preflight helper | Compare meaningful fingerprint only after authoritative fetch; stop at 3 no-progress cycles; never count tool-call success as progress | terminal user-visible PAUSED_NO_PROGRESS **orchestration disposition** and next-resume instruction |
| Chat/stream closed, disconnected, or interrupted | **No component runs automatically** | Wait until next user/tool invocation; then reconstruct from durable Project Memory and Git source truth | no promises of automatic recovery while no request is executing |

**Enforcement limit:** MCP may enforce only its own registered handler boundaries. It cannot intercept arbitrary GitHub connector calls, ChatGPT context loss, or host authorization denials. Harness rules govern external actions; stage tests must prove that exact call chain rather than assert global enforcement. A new background worker is **out of scope**; implementing one requires separate architecture/Human approval.

At JP-00, record for each resume trigger: public entrypoint, handler vs harness owner, authoritative record, precondition, concrete failure injection, evidence and missing capabilities. Prefer reconstructing cursor from existing Job/Run/Verification/source refs; do not add a shadow lifecycle.

### 0.2 Isolated staging and exact-version test contract (CR-03)

- Supabase project: `fbyqktduoqlpbbtkghkf`. **Staging Edge Function** `gsa-mcp-next`; expected MCP URL `https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp-next/mcp`. Production `gsa-mcp` remains independent.
- Code contract verified: `runtimeSurface(req)` recognizes `gsa-mcp-next` as `STAGING_NEXT`; `jobCreationExecutionContractDefault` is **V2_STABLE** in staging and **NEXT** in production; `nextMemoryNamespaceForRequest` uses **TEST_LAB** in staging. Consequently **all NEXT staging Jobs must explicitly declare `execution_contract=NEXT`** and must use `memory_namespace=TEST_LAB` with paths under `projects/<project-id>/TEST-LAB/NEXT/`.
- Before any staging test/deploy: record current production and staging versions, auth/JWT behavior and rollback source, review exact commit, separately authorize staging deployment, then fetch deployed `index.ts` from Supabase and compare **file bytes/source blob** with the intended reviewed revision. Static `GSA_SOURCE_BUILD_ID` is not a Git SHA and cannot substitute for read-back.
- Check current connector tool discovery (including refreshed chat after deploy if needed). Tests must prove `get_runtime_status` reports `STAGING_NEXT`, `execution_contract_default=V2_STABLE`, `next_memory_namespace=TEST_LAB`; assert the *test Job*, not the endpoint default, is NEXT.
- Use dedicated, authorized isolated Test Lab Project/Job with current durable identity and exact SHA. Staging endpoint must not access/write normal production namespace for these tests. Keep exact endpoint, authenticated connector binding and write-scope evidence in CP gate record.
- If stage code/endpoint/account/tooling is unavailable or mismatched, report ENVIRONMENT/INTEGRATION_BLOCKED; never silently run against production, use a synthetic UUID to write, or relabel helper simulation as stage E2E.

## 1. Inventory of existing architecture versus new work
| Requirement | Existing implementation/contract | Actual gap / intended decision |
|---|---|---|
| Cross-project write scope WL-023/024 | runtime `projectScopeDecision`, `authorize_project_scope`; `AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md` | regression only, do not redo |
| Fresh-chat Planner WL-031 | `AGENT-HARNESSES.md` already explicitly defaults new chat to Planner | confirm real admission/dispatch; only patch observed gap |
| Durable checkpoint/CAS | deterministic `checkpointClaimPath`, `checkpointLeaseExpired`, `parseDurableSnapshots`, revision-bound `checkpointVerificationApplicable`; `CORE-RECORD-CONTRACTS.md` | *general Job execution* resume cursor and explicit lost-response reconciliation; do not duplicate Tester claim state |
| Prepared ≠ persisted WL-025 | Memory Repo exact blob SHA and append-first Verification rules | explicit finalization/readback of prepared lifecycle transitions across interruptions and denied writes |
| Livelock/retry | Job/Run lifecycle, terminal guards in `STATE-MACHINE.md` | bounded nonprogress cycles + idempotent pending mutations + durable progress marker |
| False-green tests | `.github/workflows/gsa-next-logic.yml`, `test-lab/runtime-logic.test.cjs` and Reviewer/Tester contracts | real boundary-oriented tests, targeted Reviewer test-code review, mutation RED proof; helper tests remain named correctly |
| Bug fix WL-032/033 | coding-loop and Goal Recheck, normal Reviewer | opt-in debugging flow rooted in user-visible call-chain failures; no new agent role |
| Drift/branch WL-026–030 | requirement matrix and old upgrade roadmap | operational gate evidence and canonical branch reconciliation; no rewrite of completed CP0–CP7 |

All code-level locations are hypotheses until the implementation branch's fresh L0/L1 reread validates the runtime/source. **No requirement may be marked missing merely because its lesson is new.**

## 2. Work packages (Objective → Phase → Task → Job Pack → Milestone)
For each pack, use a separate bounded Job with one durable scope and accepted evidence; pack number denotes milestone ordering rather than separate branches.

### M0 / JP-00 — Admission, source snapshot and design lock (SMALL; Planner/Reviewer)
**Inputs:** current main SHA; Supabase v44 source/readback; lessons ledger WL-023–033; two 2026-10-08 lesson notes; current architecture and runtime.
**Tasks:**
- T00.1 L0 tree + L1 selective source discovery: inspect actual Job/Run/Verification write APIs, scope guards, auth/connector capability and code-host boundaries.
- T00.2 Trace each lesson to canonical owner, code function, invariant, test and expected mutation. Flag ALREADY_OWNED/PARTIAL/NEW and unknown facts.
- T00.3 Audit current persisted Run/Job/Verification/CONTROL fields and reproduce cursor reconstruction using isolated completed/in-progress fixtures. Document the minimal missing-state counterexample before proposing ANY new persistent record; derive from existing records by default. Reject redundant lifecycle design.
- T00.4 Lock one integration branch, hard compatibility boundaries, rollback baseline and evidence selection for later Jobs.
- T00.5 **Early test-quality floor (CR-02):** before JP-10 source changes, map each high-risk recovery invariant to an executable behavioral oracle, known-bad/negative mutation (must turn RED), positive check (GREEN), exact source SHA, and mock/host boundary. Reviewer checks these initial tests at CP-00. JP-20 later generalizes the policy; it is not a prerequisite to begin writing trustworthy JP-10 tests.
- T00.6 **Runtime and staging ownership (CR-01/03):** inspect actual served harness/tool handlers and external GitHub action boundaries, define invocation-triggered resume/no-background limitation, and capture staging endpoint + explicit NEXT/TEST_LAB Job + exact deployed-source readback and authorization plan. Include handler/harness owner and stop condition for each trigger.
**Exit:** requirement-to-source/test matrix with no orphan; trigger→owner→durable source→stop contract; reconstructed-cursor/no-schema decision; initial RED/GREEN test oracle reviewed; staging invocation/namespace/SHA contract; architecture diff sketch. Reviewer PASS required before JP-10; no runtime writes.
**Human gate:** any new durable record type or irreversible persistence contract requires explicit approval rather than presumed rollout.

### M1 / JP-10 — Durable resume cursor and mutation reconciliation (MEDIUM; Coder)
**Dependencies:** JP-00 PASS **including CP-00 early test-validity gate and staging contract**.
**Tasks:**
- T10.1 First implement a *derived execution cursor* using existing authoritative Job/Run/Verification/CONTROL information. Introduce one narrow new persisted cursor contract **only if** the M0 recovery-source decision record proves existing fields cannot reconstruct enough information and Reviewer accepts the minimal schema delta. Preferred representation is a small derived/resumable Job-owned record or extension, not a second lifecycle.
- T10.2 Minimum cursor: `job_id`, `planning_revision`, `branch`, `expected_head_sha`, `last_good_sha`, `last_completed_checkpoint`, `pending_action`, `last_operation_id`, `retry_count`, `progress_fingerprint`. Record a durable checkpoint **after** source/Git record readback, never after prepare alone.
- T10.3 Resume: read persisted cursor and Git/Memory SHA → compare canonical head → enumerate intervening changes → classify applied/conflicting/unapplied → invalidate stale Verification/Tester evidence → choose one next legal step. Never blindly recode or repeat a mutation.
- T10.4 Stable operation ID, write-ahead intent where needed, authoritative refetch before retry, at most 2 reconciled retries of consequential writes.
- T10.5 Define boundary when Git mutation succeeded but reply was lost: head/tree/blob readback proves success; otherwise stop with UNKNOWN_PENDING/CONFLICTED, never second commit by guess. Distinguish server-side mutation preparation from real persistence; no generic MCP interception of external GitHub connector writes.
- T10.6 Implement only request-triggered resume (next ChatGPT invocation). Add explicit recovery guidance/preflight to existing shared harness and appropriate MCP handlers, without adding background polling or promising auto-resume when the user leaves.
**Tests:** simulated interrupted response before/after durable commit; competing SHA CAS; advanced branch; stale exact-SHA review; permission-denied persistence; V2 legacy parsing/behavior; non-NEXT writes unaffected. Distinguish lost Git write reply (prove applied/absent by independent HEAD/blob readback) from denied Memory Repo lifecycle update (prepared is NOT persisted); no green from stub-only CAS. Real repo-write experiments require an explicitly authorized isolated Project/Job; otherwise their result is UNVERIFIED.
**Gate CP-M1:** Reviewer of source, negative test and schema + Tester boundary gate; merge JP-10 to integration only.

### M2 / JP-11 — No-progress and terminal guard (SMALL–MEDIUM; Coder)
**Dependencies:** JP-10 verified durable recovery behavior **using derived state if sufficient; a new persisted cursor is not mandatory**.
**Tasks:** T11.1 define fingerprint as (checkpoint, source SHA, **Job lifecycle + Run lifecycle separately**, pending action, approved evidence). T11.2 count only durable progress (not successful tool calls). T11.3 if 3 unchanged cycles, return a user-visible `PAUSED_NO_PROGRESS` **derived orchestration disposition**, not a new persisted Job/Run lifecycle enum; store a resumable marker only where already-authorized storage is available. T11.4 enforce distinct lifecycle sets: Job = DRAFT/READY/IN_PROGRESS/COMPLETED/CANCELLED/SUPERSEDED; Run = IN_PROGRESS/COMPLETED/FAILED/CANCELLED/SUPERSEDED. `FAILED` is a Run terminal state, **not a Job state**. Terminal states never revive through ordinary retry; ABANDONED and blocked/waiting remain derived. T11.5 confirm no-progress cycles are observed only while a ChatGPT turn is executing; after disconnection, resume checks occur on the *next* invocation, never via hypothetical background worker.
**Tests:** repeated successful no-op tools eventually pause; legitimate SHA/checkpoint progress resets counter; terminal and superseded flows do not revive; recovery resumes once.
**Gate CP-M2:** no-livelock negative control, V2/NEXT regression, Reviewer PASS; merge into integration.

### M3 / JP-20 — Test validity contract and selective Reviewer inspection (SMALL–MEDIUM)
**Dependencies:** JP-00. Can be coded after M1 without impacting M1 state.
**Tasks:** T20.1 extend the **JP-00/CP-00** already-reviewed initial test floor into a reusable policy; map changed test/harness and claim to exact behavior plus source/build SHA. T20.2 test-writing standard: behavior oracle, negative/positive controls when risk warrants, failure propagation and mock boundary explanation; treat skipped as UNVERIFIED. T20.3 Reviewer deep-check triggers: new/materially changed tests, escaped false-green bug, harness/mock/fixture/CI changes, high-risk lifecycle/persistence/release check; unchanged trusted tests rerun without deep rereview. T20.4 strengthen integration fixture for `validateCompletedTaskRunSnapshots` and deterministic claim write/read-back without counting mock CAS as GitHub CAS.
**Tests:** deliberately injected defect turns test RED; test with swallowed failure rejected; unchanged trust reused; wrong artifact SHA blocks PASS; actual GitHub boundary test isolated and separately labeled.
**Gate CP-M3:** Reviewer reviews the test script itself, test red/green evidence, build check and Tester scope; merge to integration.

### M4 / JP-30 — Opt-in Coder Debugging flow (SMALL–MEDIUM)
**Dependencies:** JP-20 test validity gate, or explicit reviewed dependency waiver.
**Tasks:** T30.1 implement an opt-in Coder `debugging` skill/subflow, **not a role**: prefer a new `RUNTIME_SKILLS['debugging']` entry, make `get_skill_catalog` advertise it, extend the `load_skill` input `z.enum` to accept it, and add a conditional trigger to the existing Coder `coding-loop`/harness. Do **not** put it into default `ROLE_SKILLS.coder` or modify default skill behavior for normal feature Jobs. T30.2 activation condition is a reported nontrivial bug with reproduction evidence, or a failed hotfix retest; Coder discovers via catalog and loads on-demand before editing. A requirement to force-load through Task `required_skills` would be a **separate schema change** requiring explicit JP-00 justification/review because its current allowed specialization is frontend-only. T30.3 require symptom/repro, entrypoint→caller→callee→config→durability→host interaction map, ranked failure causes and smallest shared fix. T30.4 run CI and executable call-chain simulation; test process restart/reload when root cause depends on lifecycle; live external-host acceptance remains mandatory for host-specific claim. T30.5 after first failed hotfix retest force full failure-surface scan before next patch. T30.6 verify routine feature coding unaffected and that ChatGPT tool discovery reflects the served `load_skill` schema after reconnect.
**Tests:** duplicate caller path, fake green CI, registered-but-not-exposed plugin, restart persistence, fail-again escalation; `get_skill_catalog` advertises `debugging`, authenticated `load_skill('debugging')` succeeds after tool refresh, and an ordinary Coder Job does **not** automatically load the debugging skill.
**Gate CP-M4:** Reviewer/Tester check both opt-in activation and normal Coder behavior; merge.

### M5 / JP-40 — Fresh-chat admission regression and release reconciliation (SMALL–MEDIUM)
**Dependencies:** M1–M4 merged in the one integration line.
**Tasks:** T40.1 verify fresh chat Planner default; wrong-frame warnings and denied cross-project mutations. Only create a small correction patch if negative test proves real gap. T40.2 compare integration HEAD to current main; accept/reject hotfix drift by semantic diff. T40.3 complete WL traceability dispositions and KEEP/REPLACE/REMOVE inventory of replaced workflow mechanisms. T40.4 run Deno typecheck, helper+negative tests, lifecycle/resume snapshots, V2 fixtures, NEXT checkpoint applicability, auth/tool discovery, **explicit staging NEXT Job in TEST_LAB** and staged-source exact byte readback. T40.5 update docs/README after acceptance; produce release manifest with last-good SHA, rollback source, missing host test.
**Gate CP-M5:** exact-tree/ancestry, Reviewer+Tester evidence, Human decision for merge. After main merge, separately Human-approve production deploy; read back exact deployed source, smoke, retain rollback v44 or replacement baseline.

## 3. Test checkpoints and acceptance oracle

| CP | Boundary | Evidence required | Failure policy |
|---|---|---|---|
| CP-00-PLAN-AND-TEST-FLOOR | BEFORE M1 | plan matrix; entrypoint/runtime owner map; cursor necessity check; **known-bad RED + correct GREEN** for recovery contract; Reviewer test-script review; exact stage URL/source/contract/TEST_LAB plan | missing owner, invalid negative control or unauthorized stage setup → CHANGES_REQUIRED/BLOCKED |
| CP-10-RESUME | AFTER JP-10 | lost-response simulation at real Git boundary where authorized, independent blob readback, **request-triggered resume only**, V2 safe; exact staged NEXT Job/source SHA | absent real durable boundary proof → BLOCKED/UNVERIFIED (not PASS) |
| CP-11-NOPROGRESS | AFTER JP-11 | 3-cycle same-turn no-progress; **PAUSED_NO_PROGRESS is derived only**; Job vs Run terminal guards; fingerprint reset; next-invocation resume | false wake/retry or invented background worker → PRODUCT_FAILURE |
| CP-20-TEST-VALIDITY | AFTER JP-20 | mutation RED/normal GREEN, Reviewer test-script review | false-green → FAIL |
| CP-30-DEBUG | AFTER JP-30 | call-chain trace, escalation; `RUNTIME_SKILLS` + catalog + `load_skill` schema + actual tool invocation; unchanged default Coder behavior | registration-only or helper-only test → UNVERIFIED until callable |
| CP-40-FINAL | JOB_FINAL | branch diff/ancestry, lessons coverage, runtime smoke, exact SHA | unverified mandatory boundary → do not promote |

Only the final Human gate authorizes merge/deploy. Evidence thresholds and tool environment availability should be locked in JP-00 to avoid moving the goalposts. CR findings CR-01 through CR-05 must each have a corresponding Reviewer-tested acceptance row, and only observed/verified behavior can be labeled PASS.

## 4. Main branch policy and deployment risk
- **Allowed directly on main:** docs-only corrections, and isolated emergency production hotfixes after separate review, exact-sha CI and rollback. Integrate approved hotfixes into upgrade branch at next checkpoint.
- **Never direct-main before full release:** Job/Run schema, checkpoint recovery/CAS, retry and terminal guards, Planner dispatch/admission, test gating that can block runtime.
- **Main is not globally locked:** default protected/live; production runs remain supported. Integration is sole in-progress upgrade truth.
- **Drift procedure:** at every CP compare `main` HEAD with last integrated main SHA; if diverged, read changed-file semantic diff, merge accepted changes to integration, rerun affected tests and source-bound Reviewer; no force-push or bulk branch archaeology.
- **Rollback:** record source blob SHA and Supabase version before any deployment, confirm exact deployed file bytes and auth behavior afterward; reject runtime source identity mismatch.

## 5. Review log / loop
**Round 0 — Planner:** initial decomposition committed at `634c1a9b`.

**Round 1 — Reviewer (plan-document audit; CHANGES_REQUIRED):**
1. **IMPORTANT: unproven schema necessity.** JP-10 risked creating a cursor record before proving existing `WORK/RUNS`, deterministic claim, and optional rebuildable `CONTROL.json` insufficient. Require an M0 reconstruction experiment and a no-new-schema fallback.
2. **IMPORTANT: insufficiently explicit durable recovery boundary.** A lost Git write response and a denied Memory Repo lifecycle write require separate oracles; code must never mark completion from tool prepare.
3. **IMPORTANT: incomplete scoped evidence gates.** A synthetic in-memory CAS collision and helper-only tests cannot claim real CAS, restart or repository readback; specify which exact authorized test Job and what unavailability means.
4. **MINOR: acceptance order and impact.** Multiple reviewers on every trivial change would slow workflow. Review only at meaningful CPs; ensure M5 cannot promote if active V2 behavior diverges.

**Planner revision in response (Round 1 repair):**
- JP-00 now has a **mandatory recovery-source decision record**: actual available persisted Job/Run/Verification/CONTROL fields; sampled completed/in-progress synthetic fixtures; missing state proven with minimal counterexample. Preferred outcome is **derive cursor from existing durable records**, with new persisted fields permitted only if the counterexample demonstrates necessity and Reviewer approves the schema change.
- JP-10's write protocol distinguishes: (A) Git commit succeeded but reply lost → independent HEAD/tree/blob readback detects applied action; (B) Memory lifecycle prepare succeeded but update denied → authoritative state stays old and action remains unresolved; never move lifecycle forward.
- At CP-10, repository CAS/restart tests run only in an **explicitly authorized isolated test Project/Job**; when unavailable, label `UNVERIFIED`, retain the blocker and avoid reporting the relevant gate PASS. No synthetic UUID write to production.
- Review cadence is limited to significant CP boundaries, with unchanged proven tests rerun rather than re-reviewed.

**Round 2 — Reviewer (plan-document review after repair): PASS_WITH_LIMITATIONS.** Scope is finite, major risk boundaries have fail-closed evidence, tests target both test validity and real behavior, Job Packs are meaningful and integration branch policy preserves production. Remaining pre-implementation obligation: P0 must inspect actual served harness/skills and current durable Memory Repo before deciding any persisted state shape. This is a documented plan-review assessment, **not an official persisted `PLAN_REVIEW` Verification** (no authorized durable Project Job/record SHA has been supplied/created by this docs-only planning task).

**Plan review disposition:** `PASS_WITH_LIMITATIONS` for the execution proposal only; implementation, Job creation, branch creation, main merge and production deploy remain unstarted. Next gate is approved JP-00/M0 evidence before source implementation.


## 6. Human-invoked CR round — Planner remediation (2026-10-10)

**CR verdict:** CHANGES_REQUIRED on the 2026-10-08 detailed plan. This is the independent review requested by Human; no durable CRITIC_REVIEW Verification was persisted because this plan has no dedicated durable Job/record SHA. The previous section's PASS_WITH_LIMITATIONS is the *earlier non-CR plan review*, **not** the current verdict.

| CR finding | Planner repair location | Pre-implementation acceptance |
|---|---|---|
| **CR-01** request-driven runtime ownership missing | §0.1; JP-00 T00.6; JP-10 T10.6; JP-11 T11.5; CP-10/11 | handler-vs-harness responsibility, next-invocation-only recovery, no hypothetical background daemon; adversarial lost-response scenario |
| **CR-02** test-validity gate too late | JP-00 T00.5; CP-00; JP-20 T20.1 | deliberately broken recovery assertion turns RED before JP-10 code; meaningful GREEN and exact-SHA recorded |
| **CR-03** staging scope/version ambiguous | §0.2; JP-00 T00.6; CP-00/10; JP-40 T40.4 | `gsa-mcp-next` exact URL, explicit NEXT + TEST_LAB, source readback and authenticated tool discovery, not staging default/V2 or production |
| **CR-04** Job/Run state conflated | JP-11 T11.1/T11.3/T11.4; CP-11 | FAILED restricted to Run; PAUSED_NO_PROGRESS derived orchestration disposition; no state-machine enum expansion |
| **CR-05** Debugging skill activation unspecified | JP-30 T30.1–T30.6; CP-30 | register/serve `debugging` through catalog and `load_skill` schema; conditional Coder activation, ordinary Coder unchanged |

**Self-check:** All five CR finding IDs map to concrete changes and acceptance tests. The plan is now **PLANNER_REVISED / CR_REVIEW_PENDING**, **not PASS**. The independent CR must be explicitly invoked by Human again; do not auto-run CR or invent a persisted approval. No new production source/runtime, branch or Job changes are authorized by this document.
