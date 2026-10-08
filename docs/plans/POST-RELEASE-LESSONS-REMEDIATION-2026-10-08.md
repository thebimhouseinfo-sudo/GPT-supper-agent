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
