# GSA Reliability — Detailed Execution Plan and Review Record
Date: 2026-10-08
Status: **PLAN DRAFT / REVIEW LOOP**
Production baseline: `gsa-mcp` v44; `main` is production source; new implementation branch is **not created** by this plan.

## 0. Decision and guardrails
- Single canonical implementation branch `upgrade/gsa-reliability`, forked from latest reviewed `main` **after this plan is approved**.
- `main` remains open only for reviewed production hotfixes and low-risk documentation; *no* partially completed runtime/lifecycle migration enters main.
- Every completed, reviewed Job Pack merges promptly to the integration branch. Main-only hotfixes are cherry-picked/reconciled after impact review at the next checkpoint. No force-push, competing long-lived integration branches or mass commit archaeology.
- Separate Human approvals: implementation start; final main merge; production deploy. Old Jobs remain V2_STABLE; no bulk migration, no unrelated source updates.
- Distinguish verification categories: TYPECHECK / HELPER_SIMULATION / REPO_INTEGRATION / LIVE_E2E. Unsupported paths remain UNVERIFIED, never PASS.

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
**Exit:** requirement-to-source/test matrix with no orphan, architecture diff sketch, explicit schema decision; Reviewer PASS; no runtime writes.
**Human gate:** any new durable record type or irreversible persistence contract requires explicit approval rather than presumed rollout.

### M1 / JP-10 — Durable resume cursor and mutation reconciliation (MEDIUM; Coder)
**Dependencies:** JP-00 PASS.
**Tasks:**
- T10.1 First implement a *derived execution cursor* using existing authoritative Job/Run/Verification/CONTROL information. Introduce one narrow new persisted cursor contract **only if** the M0 recovery-source decision record proves existing fields cannot reconstruct enough information and Reviewer accepts the minimal schema delta. Preferred representation is a small derived/resumable Job-owned record or extension, not a second lifecycle.
- T10.2 Minimum cursor: `job_id`, `planning_revision`, `branch`, `expected_head_sha`, `last_good_sha`, `last_completed_checkpoint`, `pending_action`, `last_operation_id`, `retry_count`, `progress_fingerprint`. Record a durable checkpoint **after** source/Git record readback, never after prepare alone.
- T10.3 Resume: read persisted cursor and Git/Memory SHA → compare canonical head → enumerate intervening changes → classify applied/conflicting/unapplied → invalidate stale Verification/Tester evidence → choose one next legal step. Never blindly recode or repeat a mutation.
- T10.4 Stable operation ID, write-ahead intent where needed, authoritative refetch before retry, at most 2 reconciled retries of consequential writes.
- T10.5 Define boundary when Git mutation succeeded but reply was lost: head/tree/readback proves success; otherwise stop with UNKNOWN_PENDING, never second commit by guess.
**Tests:** simulated interrupted response before/after durable commit; competing SHA CAS; advanced branch; stale exact-SHA review; permission-denied persistence; V2 legacy parsing/behavior; non-NEXT writes unaffected. Distinguish lost Git write reply (prove applied/absent by independent HEAD/blob readback) from denied Memory Repo lifecycle update (prepared is NOT persisted); no green from stub-only CAS. Real repo-write experiments require an explicitly authorized isolated Project/Job; otherwise their result is UNVERIFIED.
**Gate CP-M1:** Reviewer of source, negative test and schema + Tester boundary gate; merge JP-10 to integration only.

### M2 / JP-11 — No-progress and terminal guard (SMALL–MEDIUM; Coder)
**Dependencies:** JP-10 verified persisted cursor.
**Tasks:** T11.1 define fingerprint as (checkpoint, source SHA, run state, pending action, approved evidence). T11.2 count only durable progress (not successful tool calls). T11.3 if 3 unchanged cycles, return PAUSED_NO_PROGRESS style *resumable control status* without inventing a new terminal Job lifecycle. T11.4 disallow normal mutation retries from COMPLETED/FAILED/CANCELLED/SUPERSEDED; align existing allowed terminal semantics rather than changing historical Job states.
**Tests:** repeated successful no-op tools eventually pause; legitimate SHA/checkpoint progress resets counter; terminal and superseded flows do not revive; recovery resumes once.
**Gate CP-M2:** no-livelock negative control, V2/NEXT regression, Reviewer PASS; merge into integration.

### M3 / JP-20 — Test validity contract and selective Reviewer inspection (SMALL–MEDIUM)
**Dependencies:** JP-00. Can be coded after M1 without impacting M1 state.
**Tasks:** T20.1 map changed test/harness and claim to exact behavior plus source/build SHA. T20.2 test-writing standard: behavior oracle, negative/positive controls when risk warrants, failure propagation and mock boundary explanation; treat skipped as UNVERIFIED. T20.3 Reviewer deep-check triggers: new/materially changed tests, escaped false-green bug, harness/mock/fixture/CI changes, high-risk lifecycle/persistence/release check; unchanged trusted tests rerun without deep rereview. T20.4 strengthen integration fixture for `validateCompletedTaskRunSnapshots` and deterministic claim write/read-back without counting mock CAS as GitHub CAS.
**Tests:** deliberately injected defect turns test RED; test with swallowed failure rejected; unchanged trust reused; wrong artifact SHA blocks PASS; actual GitHub boundary test isolated and separately labeled.
**Gate CP-M3:** Reviewer reviews the test script itself, test red/green evidence, build check and Tester scope; merge to integration.

### M4 / JP-30 — Opt-in Coder Debugging flow (SMALL–MEDIUM)
**Dependencies:** JP-20 test validity gate, or explicit reviewed dependency waiver.
**Tasks:** T30.1 add/debug Coder subflow/skill, not role; load only for nontrivial bugs. T30.2 require symptom/repro, entrypoint→caller→callee→config→durability→host interaction map, ranked failure causes and smallest shared fix. T30.3 run CI and executable call-chain simulation; test process restart/reload when root cause depends on lifecycle; live external-host acceptance remains mandatory for host-specific claim. T30.4 after first failed hotfix retest force full failure-surface scan before next patch. T30.5 verify routine feature coding unaffected.
**Tests:** duplicate caller path, fake green CI, registered-but-not-exposed plugin, restart persistence, fail-again escalation.
**Gate CP-M4:** Reviewer/Tester check both opt-in activation and normal Coder behavior; merge.

### M5 / JP-40 — Fresh-chat admission regression and release reconciliation (SMALL–MEDIUM)
**Dependencies:** M1–M4 merged in the one integration line.
**Tasks:** T40.1 verify fresh chat Planner default; wrong-frame warnings and denied cross-project mutations. Only create a small correction patch if negative test proves real gap. T40.2 compare integration HEAD to current main; accept/reject hotfix drift by semantic diff. T40.3 complete WL traceability dispositions and KEEP/REPLACE/REMOVE inventory of replaced workflow mechanisms. T40.4 run Deno typecheck, helper+negative tests, lifecycle/resume snapshots, V2 fixtures, NEXT checkpoint applicability, auth/tool discovery, stage readback. T40.5 update docs/README after acceptance; produce release manifest with last-good SHA, rollback source, missing host test.
**Gate CP-M5:** exact-tree/ancestry, Reviewer+Tester evidence, Human decision for merge. After main merge, separately Human-approve production deploy; read back exact deployed source, smoke, retain rollback v44 or replacement baseline.

## 3. Test checkpoints and acceptance oracle

| CP | Boundary | Evidence required | Failure policy |
|---|---|---|---|
| CP-00-PLAN | BEFORE M1 | plan matrix, source/contract overlap, Reviewer review | missing scope/unknown architecture → CHANGES_REQUIRED |
| CP-10-RESUME | AFTER JP-10 | lost-response simulation + real Git CAS where authorized; persisted readback; V2 safe | no durable proof → BLOCKED/UNVERIFIED (not PASS) |
| CP-11-NOPROGRESS | AFTER JP-11 | 3-cycle no-progress test; terminal guards; fingerprint reset | false wake/retry → PRODUCT_FAILURE |
| CP-20-TEST-VALIDITY | AFTER JP-20 | mutation RED/normal GREEN, Reviewer test-script review | false-green → FAIL |
| CP-30-DEBUG | AFTER JP-30 | call-chain trace, escalation and unchanged Coder behavior | helper-only simulation → limited evidence |
| CP-40-FINAL | JOB_FINAL | branch diff/ancestry, lessons coverage, runtime smoke, exact SHA | unverified mandatory boundary → do not promote |

Only the final Human gate authorizes merge/deploy. Evidence thresholds and tool environment availability should be locked in JP-00 to avoid moving the goalposts.

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
