# Project / Job Lifecycle v1.2

## 1. Project lifecycle

```text
ACTIVE
PAUSED
ARCHIVED
```

Project Open shows ACTIVE + PAUSED and hides ARCHIVED.

Project delete removes Project Memory under the configured Memory Repo, not source repositories.

## 2. Project creation/open

Create:
```text
Project folder → PROJECT.md → optional control cache → ACTIVE
```

Open:
```text
Project identity/current work → relevant durable context → selective live source
```

## 3. Job semantics

Job = one finite objective/work unit.

A Job may contain many role Runs.

Job type classifies primary objective:
```text
plan
code
design
review
```

Job type is immutable.

Review checkpoint inside another Job is not a review Job.

### Scope growth rule

Task list may grow through planning-time or Planner-approved additions while the finite objective remains materially the same.

If a proposed Task:
- introduces a materially different objective; or
- would not reasonably have belonged inside the Job's originally approved objective/scope;

then Planner proposes a new linked Job rather than silently expanding the existing Job.

Causal Change Review handles ambiguous/material boundary changes.

## 4. Job lifecycle

```text
DRAFT
READY
IN_PROGRESS
COMPLETED
CANCELLED
SUPERSEDED
RETIRED
```

WAITING/BLOCKED are derived conditions.

Accepted terminal result:
```text
PASS
PASS_RETEST_REQUIRED
```

## 5. Task

Task is optional bounded work package embedded in Job by default.

```text
PLANNED
READY
IN_PROGRESS
COMPLETED
CANCELLED
SUPERSEDED
RETIRED
```

WAITING/BLOCKED are derived.

Completing Runs do not independently write Task completion back into the Job file; current progress is joined from Run/Verification records and finalized by explicit control action.

## 6. Run

A Run exists when execution begins.

Stored lifecycle:
```text
IN_PROGRESS
COMPLETED
FAILED
CANCELLED
SUPERSEDED
```

Derived condition:
```text
WAITING_HUMAN
BLOCKED
ABANDONED
```

Human Gate/blocker is the durable cause; do not duplicate it as authoritative Run lifecycle.

ABANDONED is derived when an IN_PROGRESS Run loses its execution/chat context without a terminal record. It is not the artifact-validity state STALE.

Meaningful retry/new chat creates linked Run.

Child Run may use `parent_run_id`.

## 7. Handoff

Source Run completes and creates an immutable Handoff.

Current Handoff state is derived:
```text
PENDING
BLOCKED
CONSUMED
CONFLICTED
SUPERSEDED
```

- consumption is a separate HandoffConsumption/successor Run record;
- blocker/Human Gate causes BLOCKED;
- multiple incompatible consumptions cause CONFLICTED;
- supersession is recorded separately;
- no PENDING → CONSUMED overwrite occurs in the original Handoff.

## 8. Completion topology

Normal topology is flexible.

Mandatory mechanically classified review floor applies where required.

Completion may require Goal Recheck, capability-backed evidence, Reviewer, Tester, Human Gate, or combinations.

## 9. PASS_RETEST_REQUIRED

Job may complete while Retest pending.

Merge needs explicit human authorization with visible pending Retest/UNVERIFIED coverage.

Post-completion Retest FAIL:
```text
preserve historical Job
→ linked remediation Job
```

## 10. Delivery facts

```text
accepted
merged
deployed
deployment_verified
```

Separate from lifecycle.

## 11. Project / Job delete behavior

No Job ARCHIVED state.

Project delete removes Project Memory only after explicit human confirmation; it never deletes source repositories.

Job hard delete is also explicit human action; show surviving references/consequences first.

## 12. PAUSED/ARCHIVED

No asynchronous cross-chat stop assumption.

Recheck lifecycle before consequential actions.

## 13. Direct Agent promotion

Promotion creates new Project/Job from promotion packet; no ephemeral lifecycle mutation.


## 14. CP5 NEXT checkpoint conditions

Checkpoint attempt liveness is not a new Job/Run lifecycle. It is controlled by the deterministic NEXT checkpoint claim:

```text
ACTIVE
SATISFIED
OBSERVED
FAILED_PRODUCT
BLOCKED
NEEDS_PLANNER_REVISION
```

`ACTIVE` is valid only until `lease_expires_at`. Reclaim increments claim generation and replaces the lease token. The previous claimant cannot finalize evidence afterward.

A NEXT Job may remain `IN_PROGRESS` while its plan is superseded after PLAN_GAP/SPEC_GAP:

```text
IN_PROGRESS + reviewed plan revision N
→ Tester PLAN_GAP/SPEC_GAP
→ Planner revision N+1 (planning_review=PENDING)
→ dispatch blocked
→ Reviewer PASS
→ IN_PROGRESS resumes on revision N+1
```

If Reviewer returns CHANGES_REQUIRED, Planner may create N+2 inside the same review-repair loop without requiring another Tester gap finding.

## 15. Mandatory evidence versus PASS_RETEST_REQUIRED

The general rule that a Job may complete with `PASS_RETEST_REQUIRED` does **not** override explicit NEXT dependencies.

If an `EvidenceRequirement`, required checkpoint, Milestone gate or Job-final checkpoint is still missing/stale/blocked, the dependent Task/Milestone/Job cannot advance. A superseding reviewed planning revision may legitimately replace or remove the old requirement.

## 16. LLC58 — Human Plan Change while Jobs are READY or IN_PROGRESS

Human can request a change to a wider approved Plan without first cancelling Jobs. The user request initiates Planner review; it **does not** immediately make every existing Job invalid.

After the revised Plan passes independent planning review, the orchestrator uses current Job readbacks to classify `KEEP`, `REVALIDATE`, `REPLACE` or `HUMAN_DECISION`. These are **decisions**, not new lifecycle values.

- `DRAFT/READY` with materially obsolete scope: transition to `SUPERSEDED` with exact current SHA, then create a new unique Job from a durable intent.
- `IN_PROGRESS` with obsolete scope: first read/settle active Run(s), pending source cursor, current branch/parent/target; transition to `SUPERSEDED` only after all unresolved activity is reconciled. Never revert source just because a Job is superseded.
- `COMPLETED`: preserve historical result/evidence; create a new linked remediation/follow-up Job if the new Plan needs more work.
- `CANCELLED/SUPERSEDED/RETIRED`: remain terminal, never reopen or overwrite.
- Unaffected Jobs remain `KEEP`; dependent Jobs are `REVALIDATE` or blocked until dependency and evidence applicability can be proved.

`SUPERSEDE Run` is not `SUPERSEDE Job`. `SUPERSEDE Job` is not `SUPERSEDE cursor`. An unavailable or inconsistent source readback is a stop condition, not permission to bypass the control plane.

A replacement Job uses a fresh globally collision-resistant canonical ID, a distinct display label containing full ID and immutable `replacement_of_job_id`/`plan_change_id` lineage. It begins `DRAFT`, requires planning review, and cannot inherit predecessor PASS evidence. Use the same persisted Plan reconciliation intent for interrupted retries; an existing replacement path is checked/read back, never overwritten.

Plan-change reconciliation is invoked on relevant Human changes and resumed pending decisions, not on normal tool reads or on every Run action.

## 17. LLC58 RETIRE — no successor

A Human-approved, Reviewer-PASS Plan revision may declare `RETIRE` for any nonterminal Job that is no longer needed, without inventing a replacement Job. It is different from `CANCELLED` (explicit interruption) and `SUPERSEDED` (replacement exists). The Planner impact matrix includes KEEP/REVALIDATE/REPLACE/RETIRE/HUMAN_DECISION. Intent is immutable, per reviewed Plan revision, and records reasons and optional retired Task IDs.

- Create/read back the exact immutable Plan reconciliation intent; place a Job fence with exact GitHub blob SHA before new execution. The fence blocks Run dispatch, cursor writes and normal plan changes.
- If `IN_PROGRESS`, settle active Runs with `CANCELLED` and explicit Plan-change result, and reconcile the source cursor and Git HEAD/tree. `PENDING` or `UNKNOWN` blocks RETIRED; never claim remote in-flight writes were stopped asynchronously.
- `job_transition(RETIRED)` must match the exact intent action `RETIRE`, have settled activity, and persist `retired_by_plan_change_id`, `retired_reason`, `retired_at` with no replacement. All nonterminal Tasks are marked RETIRED with the same plan attribution.
- For `REPLACE`, only explicit retired_task_ids in the predecessor are marked RETIRED; remaining historical Tasks are preserved. Further active-scope changes require a reviewed successor Job. Task retirement is terminal and must never be dispatched as work.
- `COMPLETED` Jobs and completed Tasks retain historical PASS/evidence. Retirement never rolls back Git source or transfers prior PASS to another Job.
