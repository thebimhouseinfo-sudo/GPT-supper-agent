# Post-release Lessons Remediation Plan — 2026-10-08

Status: **PLANNED / not implemented**. Release baseline: `main` merge `0b079583`, production `gsa-mcp` v44. README update does not activate these rules. This plan is a bounded, reviewed intake for the next change cycle—not a retroactive declaration that candidate lessons passed.

## Objective and scope

Resolve *new* lessons without rebuilding CP0–CP7 or slowing every Job with continuous review. Work proceeds in one canonical integration branch created from the latest `main` when implementation is authorized, with short-lived Task work and early checkpoint merges; merge to `main` and production deploy are separately Human-gated. Existing V2_STABLE Jobs and NEXT control/evidence paths must remain compatible.

### Lessons and ownership matrix

| Cluster | Lessons / evidence | Current gap | Proposed owner | Acceptance evidence |
|---|---|---|---|---|
| Admission + scope | WL-023/024 (already correction-implemented), WL-031 (candidate) | fresh chat may jump from problem report to Coder without re-grounded plan; prevent cross-project drift | Planner harness/skill; project-open/admission eval | cold-chat defaults to Planner, wrong-frame stops, explicit directed read allowed, cross-project mutation denied; do not duplicate WL-023/024 |
| Debug quality | WL-032, WL-033; `BUG-FIX-ROOT-CAUSE-SIMULATION-2026-10-05.md` | symptom-level repeated hotfix and false confidence from CI | **Coder Debugging skill**, not new permanent role | failure-surface map before edits; test with caller→runtime→state chain, simulated restart if applicable, live acceptance label, failed retest forces full scan |
| Test trust | `TEST-VALIDITY-AND-REVIEW-2026-10-08.md`, WL-028 | test or harness can go green while not proving behavior | testing-evidence / coding-loop + context-isolated Reviewer | negative mutation turns RED; changed-test review at meaningful checkpoint; mock boundary disclosed; exact SHA evidence; skipped/unavailable never PASS |
| Interruption and progress | `INTERRUPTION-CHECKPOINT-LIVELOCK-2026-10-08.md`, WL-025 | tool-call livelock, repeated coding after interruption, prepared-vs-persisted confusion | execution orchestration + lightweight Job cursor | pause/resume from durable last-good SHA; idempotent operation IDs; max 3 no-progress cycles; at most 2 reconciled retries; terminal state never loops; denied persistence never counted complete |
| Drift and canonical line | WL-026/027/029/030; existing correction trace | side branches, forgotten requirement owners, incomplete cutover | Planner roadmap/traceability, Reviewer release checklist | requirement→owner→surface→eval; reviewed semantic diff; exact branch absorption; KEEP/REPLACE/REMOVE coverage; no orphan commits |

## Delivery phases and checkpoints

### P0 — Baseline and requirement mapping (docs only)

1. Read current `main`, exact deployed source/version, harnesses, skills and canonical schema/evals; differentiate **already implemented** from actual delta. Compare WL-023/024, WL-026–030 correction work before editing.
2. Make a minimal traceability matrix per lesson (current owner, missing invariant, affected call path, negative scenario, evaluation, disposition). Keep unknown runtime facts explicit rather than guessing.
3. Produce bounded Task/Job Packs, stable IDs and last-good SHA. Reviewer checks the **plan and tests planned**, not source changes yet.

**Gate P0:** no duplicate implementation work; every accepted candidate has one canonical owner and test target; plan review PASS before coding.

### P1 — Resume, bounded retries and lifecycle durability (highest reliability priority)

- Design lightweight per-Job execution cursor, using existing durable record ownership when possible. Minimal fields: job/revision, canonical branch, expected head SHA, last_good_sha, last checkpoint, pending action, stable operation id, retry count and progress fingerprint.
- A checkpoint records a **proven durable transition**, never a prepared API response. Read-before-retry + CAS + write/read-back. Reconcile branch drift before code or repeat write.
- No-progress fingerprint unchanged across **3 cycles** → `PAUSED_NO_PROGRESS` or equivalent explicit resumable state; consequential mutations at most 2 retries after authoritative refetch.
- Terminal `COMPLETED`, `FAILED`, `CANCELLED`, `SUPERSEDED` do not re-enter active loops. Do not introduce a redundant second state machine if the existing Job/Run records can safely store cursor information.

**Tests:** interrupted write after server commit before client response; CAS conflict/rebase; resumed Job after side-branch advanced; persistent write denied; unchanged fingerprint livelock; terminal no retry; V2 compatibility.

**Gate P1:** real runtime call-chain simulation, Reviewer code+test review at checkpoint, bounded Tester evidence and exact SHA; checkpoint merged to canonical integration line.

### P2 — Trustworthy tests and targeted Reviewer test-script review

- Introduce test-writing floor for new/changed high-risk tests: behavioral oracle, reject path, positive/negative control, mocked-boundary disclosure, explicit skipped/unavailable and exact source SHA.
- Reviewer deep-reviews test files/harness/fixtures only on *triggers*: newly introduced/changed tests, escaped regression, boundary crossings, substantial harness change, or milestone/release dependence.
- Do **not** apply an expensive test-script review after every code change or every CI rerun. Previously validated unchanged tests are rerun, not continually re-reviewed.
- Keep `deno check` + current bounded helpers, but add representative integration tests that exercise durable snapshot validation and write/read-back boundaries instead of counting model CAS as GitHub CAS.

**Tests:** inject known regression and prove RED; demonstrate poor assertion rejected by Reviewer; unchanged trusted suite review skipped correctly; `UNAVAILABLE != PASS`; exact-revision mismatch rejected.

**Gate P2:** test-review triggers and negative-control evidence PASS; no false-green claims; merge.

### P3 — Coder debugging workflow

- Prefer new `debugging` skill or subflow of `coding-loop`, loaded only for non-trivial defects; do not add a persistent Bug Fixer role without later evidence.
- Required compact artifact: symptom/repro; relationship graph; ranked failure surfaces; proven root cause; changed surface; CI; executable call-chain simulation; host acceptance requirement/result.
- After first hotfix fails retest, stop repeated local patches and expand the complete surface before further mutation.
- Include connector/discovery, environment, multi-process, persistence/restart, legacy duplicate routes and generated manifest in the fault model when relevant.

**Tests:** two-fault scenario with first fix insufficient, loader/caller mismatch, registered-but-unexposed tool, persisted state lost across restart; reviewer confirms behavior does not close from CI alone.

**Gate P3:** Reviewer + meaningful Tester checkpoint; record live acceptance pending if host inaccessible; merge.

### P4 — Fresh-chat Planner admission + release reconciliation

- Cold session defaults to Planner/discussion; reconstruct active Project, memory records, scope and source before deciding to code. Carry forward existing cross-project boundary rather than loosening it.
- Final lesson coverage audit and canonical-source branch reconciliation. Inspect requirements omitted from specialist plans, obsolete cutover-only paths and old branch uniqueness.
- Re-run V2 legacy, NEXT happy/negative evidence gates, lost-response recovery, test script mutation, wrong project writes and tool discoverability. Maintain honest PASS/BLOCKED/UNVERIFIED labels.

**Gate P4:** exact-sha review and Tester evidence, Human merge approval. Separate deploy approval, production read-back, rollback version and smoke test. Full external-host E2E not auto-waived.

## Practical controls

- **Source of truth:** one active integration branch + exact SHA checkpoint at every completed Job Pack. Avoid multiple competing integration lines.
- **Selective cadence:** Planner/Reviewer at phase boundaries; extra review only for material contract/runtime/test changes; no mandatory review on every tool call.
- **No automatic feature expansion:** keep current runtime working; no bulk Job migration, no new always-on reviewer, no per-action heavy checkpoint database.
- **Risk order:** durable progress first (P1), test validity second (P2), debugging quality third (P3), Planner admission and release closure fourth (P4). P0 always precedes changes.
- **Rollback:** preserve v44 runtime/source identity until replacement verified; deploy only after intentional Human gate.

## Acceptance definition

An item moves from CANDIDATE/PLANNED to IMPLEMENTED only when its canonical owner, executable tests, exact-SHA code evidence and required Reviewer/Tester disposition have been checked. Documentation alone never closes a lesson. Record remaining host-only limitations as `UNVERIFIED`, not PASS.

## References

- `docs/process/GSA-WORKFLOW-LESSONS-LEDGER.md`
- `docs/process/lessons/INTERRUPTION-CHECKPOINT-LIVELOCK-2026-10-08.md`
- `docs/process/lessons/TEST-VALIDITY-AND-REVIEW-2026-10-08.md`
- `docs/process/lessons/BUG-FIX-ROOT-CAUSE-SIMULATION-2026-10-05.md`
- `docs/process/lessons/BRANCH-COMMIT-SPRAWL-2026-10-04.md`
- `docs/process/lessons/UPGRADE-IMPLEMENTATION-DRIFT-2026-10-04.md`
- GitHub PR #17 and production `gsa-mcp` v44 deployment/read-back.


---

## Planner architecture-overlap audit and release strategy — 2026-10-08

**Decision:** incremental, reviewed upgrade on **one new integration branch** after P0 plan approval; do **not** merge unfinished Job/Run/checkpoint changes into production main. Do **not** freeze main against critical production hotfixes. Source of truth during development: integration branch for upgrade, main for production; reconcile approved main-only hotfixes into integration before each next checkpoint and prior to promotion. The branch name is chosen at implementation start, not created by this document.

### Existing architecture versus real delta

| Lesson / cluster | Already in source/architecture | Remaining delta | Classification |
|---|---|---|---|
| WL-023/024 cross-project isolation | AGENT-HARNESSES + EXECUTION-AND-REVIEW + runtime scope guards; correction matrix marks implemented | regression/host enforcement validation, not redo | **ALREADY OWNED; test only** |
| WL-031 fresh-chat Planner default | AGENT-HARNESSES already explicitly states a newly opened chat/Project defaults to Planner/discussion, and allows explicitly invoked Direct Coder | prove router/admission behavior across fresh sessions; tighten only if observed mismatch | **ALREADY DESIGNED; verify before patch** |
| WL-025 prepared record vs persisted lifecycle | JOB-LIFECYCLE + CORE-RECORD-CONTRACTS already distinguish Run/Verification and exact-SHA authoritative read-back | interrupted post-write-before-reply recovery, explicit finalization evidence, denied-write route | **PARTIAL** |
| 2026-10-08 interruption / livelock | Deterministic checkpoint lease, claim and revision-bound evidence already exist; STATE-MACHINE has terminal/superseded non-reactivation | general-purpose lightweight Job execution cursor; no-progress fingerprint, bounded retries, lost-response idempotency; no extra parallel lifecycle | **MATERIAL NEW DELTA** |
| WL-028 / false-green tests | Reviewer is source read-only, meaningful checkpoint review; bounded helper tests + Deno CI exist | targeted test-script validity contract, mutation oracle, durable snapshot/integration tests and explicit UNVERIFIED labeling | **PARTIAL; test-quality delta** |
| WL-032/033 root-cause debugger | Coder self-review, Goal Recheck and coding-loop behaviors exist; planning relationships already present | opt-in Coder debugging skill/branch with failure-surface graph and call-chain simulation after CI | **PARTIAL; new skill behavior** |
| WL-026/027/029/030 drift / branches | correction requirement matrix, approved plan review, cutover inventory and one-branch upgrade policy are already canonical | operational release/checkpoint traceability and continuous reconciliation (avoid re-implementing completed correction program) | **MOSTLY OWNED; procedural verification** |

**Repository observation:** canonical documentation already describes the existing behaviors. The source repository currently has only a small `skills/` stub for `gsa-job-runtime`; operational Planner/Coder/Reviewer skills may be served by the runtime harness rather than mirrored in standalone repository skill files. Therefore inspect `supabase/functions/gsa-mcp/index.ts` and relevant runtime skill text before specifying a file path for implementation. Do not presume a nonexistent `skills/debugging` already exists.

### Practical scope reductions from the overlap audit

- P0 must enumerate exact **implemented-vs-missing** runtime branches before any code task; only missing deltas become tasks.
- WL-023/024 and WL-031 are **not** invitations to redesign the admission/authorization layer. First exercise its actual cold-chat and wrong-project paths.
- Reuse existing checkpoint claim and Job/Run schemas for resume state if possible. Add small durable cursor fields or artifact only when reconstruction from existing records is demonstrably insufficient.
- Prefer a **Coder-specific debugging skill/subflow**, not a new persistent agent.
- Limit Reviewer test-code review to changed/high-risk tests, escaped regression and release/critical checkpoint gates. Trusted unchanged tests get rerun only.
- Distinguish mock-only CAS from real GitHub CAS and avoid treating UI/tool discovery as successful end-to-end Job completion.

### Main vs integration impact assessment

| Change group | Runtime risk | Safe direct-main? | Why |
|---|---|---|---|
| README, ledger, plan, documentation-only corrections | LOW | **Yes**, with review | no running Job semantics changed |
| New independent test fixtures / non-invasive CI checks | LOW–MEDIUM | **Conditional** | CI trigger/cost and false gate risk; keep checks honest |
| Debugging skill and targeted Reviewer test-validity harness | MEDIUM | **Prefer integration** | shifts agent decision behavior; regression against normal Coder flow required |
| Fresh-chat admission / routing | MEDIUM–HIGH | **Integration required** | can change what role/Project executes user requests |
| Cursor, CAS recovery, retry/livelock, terminal-state guards | HIGH | **Integration required** | touches persistence, lifecycle and live Job convergence |

**Recommended workflow:**
1. Keep `main` as live v44 baseline. Short docs-only changes may merge directly after review; permit emergency hotfixes only with exact SHA and explicit rollback.
2. Complete P0 on main (this review) and obtain Reviewer plan verdict. Then create **one** integration branch from latest main, e.g. `upgrade/gsa-reliability`. This is the only canonical upgrade line; optional small child branches are immediately integrated/deleted after review.
3. Implement minimal high-risk P1 first, then P2/P3; treat P4 primarily as verification unless an actual admission gap is reproduced. At each meaningful checkpoint: test → Coder self-review → selective Reviewer code/test review → merge into the integration branch → record SHA/evidence. Do not accumulate unmerged side branches.
4. If production main advances for a hotfix, classify semantic impact and reconcile to integration at the **next checkpoint**, not only at release. Never force-push main or silently overwrite production.
5. Once all approved checkpoint gates PASS, verify production/main delta, existing V2 Jobs, active NEXT Jobs, restart/lost-response conditions and source/runtime tool exposure; seek Human approval to merge integration into main.
6. **Deploy separately**, with versioned rollback point, exact source read-back, smoke and honest external-host/E2E coverage. Production main merge is not automatic deploy.

**Why not lock main:** a strict freeze prevents urgent fixes for active production Jobs and creates a second drift problem. Why not merge each runtime checkpoint directly to main: unproven cursor/authorization changes could change durable operations of live NEXT Jobs. The integration branch is the safety boundary, while short-lived reviewed hotfixes may still enter main.

### Updated checkpoint gates

- **P0:** evidence-grounded overlap/ownership inventory, exact missing contracts, no duplicate work, Reviewer plan PASS.
- **P1:** interrupted response, CAS conflict, real persistence-readback or clearly labeled simulated substitute, stalled progress, terminal state, V2 legacy regression. No new redundant lifecycle.
- **P2:** known old bug makes test RED; changed test scripts reviewed at relevant checkpoint; no misleading PASS from stubs/skips.
- **P3:** debugging opt-in activation, root-cause map, executable caller-chain simulation, unchanged normal Coder Job.
- **P4:** existing fresh-chat Planner safety verified; full source/lesson coverage, main drift reconciliation and release gate; only code for proven missing behavior.

**Status:** PLANNER REVIEW PROPOSAL. No implementation branch created, runtime modified or deployment performed by this audit. Reviewer approval and Human instruction are required before starting source implementation.


## 2026-10-10 Planner revision after independent CR findings

**Status: CR_REVIEW_PENDING (not PASS; not implementation authorization).** The detailed plan was revised against CR-01..CR-05 in [`GSA-RELIABILITY-DETAILED-EXECUTION-2026-10-08.md`](GSA-RELIABILITY-DETAILED-EXECUTION-2026-10-08.md).

- **P0 / JP-00 now owns an early test validity gate:** positive/negative behavioral oracle (known-bad must be RED), exact SHA and mock disclosure **before** high-risk P1 source work. P2 still owns later generalization/selective Reviewer test-script standards.
- **No background resume is promised:** request-driven ChatGPT Orchestrator plus MCP handlers own the supported boundaries; retry/reconstruction happens only in a running or renewed chat invocation from durable Git/Project Memory. External GitHub connector writes are not globally intercepted by MCP.
- **Staging is explicit:** `gsa-mcp-next` at `https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp-next/mcp` defaults to V2_STABLE, so NEXT tests must set `execution_contract=NEXT` and `memory_namespace=TEST_LAB`, with exact deployed-source read-back and scoped Job identity.
- **Lifecycle is unchanged:** Job and Run terminal states are distinct (`FAILED` belongs to Run); `PAUSED_NO_PROGRESS` is a derived orchestration disposition, not a new stored lifecycle enum.
- **Debugging skill is opt-in:** register with runtime catalog and `load_skill` schema, conditionally load from Coder debugging workflow; do not add to default Coder skills or introduce a new role.

This section supersedes any earlier sequencing sentence that appears to put *all* test-quality work after P1. A dedicated authorized Job, persisted plan review and Human implementation approval have not yet been recorded. Production remains at v44; `main` continues to accept docs-only changes/hotfixes, with a single new integration branch planned only after the plan gate.

## Detailed execution and review handoff

The reviewed Job Pack decomposition, acceptance checkpoints, risks and documented Planner → Reviewer → Planner repair → Reviewer recheck loop are in [`GSA-RELIABILITY-DETAILED-EXECUTION-2026-10-08.md`](GSA-RELIABILITY-DETAILED-EXECUTION-2026-10-08.md). Status: plan-level PASS_WITH_LIMITATIONS; no official durable PLAN_REVIEW Verification, no implementation branch or runtime changes. Begin with JP-00 and re-ground actual persisted state before selecting any new schema.
