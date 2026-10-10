# LLC58 — Human Plan Change, Job Reconciliation and Cursor Compatibility

Status: IMPLEMENTATION-IN-PROGRESS; source of truth is `upgrade/gsa-reliability`, no main mutation.
Source lesson: `docs/process/lessons/LLC-058-EXECUTION-CURSOR-LEGACY-JOB-2026-10-10.md`.

## Safety invariants

1. Plan **proposal** does not invalidate Jobs by itself. A reviewed/approved new intent requires an impact classification before consequential execution proceeds.
2. A Job's `planning_revision` is **local to that Job**. Do not reinterpret it as a global project Plan revision. A multi-Job Plan Change has its own immutable `change_id`, approved plan artifact identity and explicit affected Job set.
3. `DRAFT/READY/IN_PROGRESS` Job decision: KEEP, REVALIDATE, REPLACE, CREATE, or HUMAN_DECISION. Terminal Jobs are never reopened; COMPLETED PASS history is not rewritten.
4. A `REPLACE` decision must retain immutable predecessor identity and produce a **fresh collision-resistant Job ID**; the new display label must include the unique handle. Existing `linked_job_ids` may carry bidirectional links only by separately authorized exact-SHA CAS; immutable reconciliation intent remains the canonical lineage if one side has not yet updated.
5. A currently running Run is not a Job; superseding Run does not supersede Job. Pending source mutation is reconciled using authentic source HEAD/parent/target before any transition.
6. No implicit legacy Job `V2_STABLE` -> `NEXT` conversion. NEXT cursor is optional for historical V2_STABLE; ineligible cursor calls return a specific route, never a success or fake cursor.
7. Every consequential Memory mutation uses registered project authorization, exact current blob SHA (or CREATE collision check) and independent readback. No raw Git bypass after denied canonical mutation.
8. No same-Job PASS reuse across changed Plan revisions without explicit applicability proof; evidence attached to old target SHA remains historical.
9. Multi-record reconciliation is **not atomic**. Never claim it is. An append-preserving plan-change intent with deterministic action keys and readback-based operation reconciliation makes it idempotent and restartable. A pending intent fences affected Job dispatch when GSA is invoked and has fetched that authorized intent; no background stop guarantee.
10. Ordinary read/think/tool calls do not trigger per-Job scans or cursor writes. Plan changes are rare explicit events.

## CP0 — source/root-cause baseline (partially inspected)

Current served-source candidate on integration branch:
- `prepareExecutionCursorDecision` checks `job.execution_contract === 'NEXT'` before namespace/branch and bundles identity, contract, revision and lifecycle into `JOB_IDENTITY_OR_LIFECYCLE_MISMATCH`.
- `job_revise_plan` permits NEXT IN_PROGRESS supersession after a Tester PLAN_GAP/SPEC_GAP claim (or its review-repair loop); **Human Plan Change across Jobs** is not a first-class path.
- `job_transition` already accepts SUPERSEDED; `job_prepare` already generates fresh UUID-class ID/handle; `linked_job_ids` already exists.
- Exact J-9067 Job JSON, Memory Repo blob/served runtime BUILD ID still need authorized readback; do not infer that `type=plan` is the failure.

## CP1 — Planner Impact Matrix

Input: Human change request; exact Project ID; reviewed Plan artifact ID/SHA/revision; affected current Job snapshots; upstream/downstream dependencies; source HEAD and Run/cursor evidence when relevant.

Result, before any Job writes: explicit rows `{job_id, expected_job_sha, old_lifecycle, old_plan_identity, decision, rationale, affected_dependencies, evidence_to_revalidate, replacement_action_key?}`.
Missing or ambiguous scope -> HUMAN_DECISION; an untouched Job remains KEEP. Reviewer evaluates impact matrix and new intent, not only prose Plan.

## CP2 — durable reconciliation intent and replacement

Preferred initial shape (schema review required before runtime activation):
`projects/<project_id>/WORK/PLAN_RECONCILIATIONS/<change_id>.json`
with `kind=PLAN_RECONCILIATION, version=1, project_id, change_id, reviewed_plan_ref, reviewed_plan_sha, source_branch, affected_jobs[]` and prepared action table. Each action has stable `action_key`, predecessor Job ID/blob, effect, reserved replacement Job ID/handle (when relevant), dependency rewiring and proof refs. A completed action is derived from authoritative Job/Run/Verification records and CREATE-path readback, not an unchecked status flag. Only one intent per Human-approved Plan Change; retries do not allocate new Job IDs.

Implementation steps: authorize/read Job & Run/cursor; resolve outstanding source write; persist reviewed intent via CREATE/readback; supersede active Runs as appropriate; terminal-transition obsolete Job by CAS; create new DRAFT Job using reserved ID and the revised plan; planning-review PASS => READY; update affected dependency records only after accepted scope; verify action convergence. If interrupted after any step, reread intent+durable records and resume the first unsatisfied action. Reconciler must refuse foreign collisions and unchanged dependents continue.

## CP3 — naming/lineage

Fresh canonical UUIDv7-class Job ID; no reuse of predecessor ID and no central counter. UI display:
`<work objective> / Plan <revision or change short-ref> / <unique Job handle>`.
Do not change the canonical historical handle; ambiguous short-handle resolution requires disambiguation.

## CP4 — cursor admission/compatibility

Split `JOB_IDENTITY_OR_LIFECYCLE_MISMATCH` into:
`JOB_RECORD_KIND_INVALID, PROJECT_ID_MISMATCH, JOB_ID_MISMATCH, JOB_EXECUTION_CONTRACT_INCOMPATIBLE, JOB_PLAN_REVISION_INVALID, JOB_LIFECYCLE_INVALID`.
Existing namespace, cursor and HEAD guards remain unchanged. For V2_STABLE explicitly signal `LEGACY_JOB_CURSOR_NOT_APPLICABLE` with route to legacy execution contract or explicit reviewed rebaseline; no automatic rewrite or NEXT cursor persisted. A valid NEXT Job with pending Plan Change must not be admitted as though Plan were unchanged.

## CP5 — orchestration, diagnostics and performance

Human Change Request -> Planner diff -> Reviewer PASS -> intent CREATE/readback -> Job reconciliation -> affected dispatch block/unblock -> selected Runner resumes. No polling. For normal work zero added cursor/plan scans; Plan-change boundaries incur authorized extra Memory Repo calls and should be timed on real Jobs.

## CP6 — test matrix

Functional: original LLC58 8 cases, separate guard predicates, legacy NEXT mismatch, lifecycle, wrong identity/revision/namespace/source tree, idempotent retry with same action key, concurrent writer stale SHA, terminal Job reactivation reject, independent KEEP, READY replacement, IN_PROGRESS with pending cursor, COMPLETED historical PASS, dependency rebind validation, interrupted after each write.

Runtime: test against exact source code path and Node/Deno checks; red negative controls must prove mutated broken predicates fail. Do not report unavailable CI as PASS.

Field acceptance: authorized exact durable J-9067 evidence, using Gsa-local only as an explicitly referenced **read-only source** until the user opens that project separately for mutation. No hidden cross-project writes.

## CP7 — release gates

Reviewer checks contract and test scripts; Tester checks actual external GitHub persistence/CAS/readback and interruption; record exact target commit, source blob, CI run and latency. Full implementation and real Job acceptance must precede release readiness. Historical PR #18 was already merged into main 2026-10-10; subsequent LLC58 work is isolated to `upgrade/gsa-reliability` pending future explicit merge authority.
