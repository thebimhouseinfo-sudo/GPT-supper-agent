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
