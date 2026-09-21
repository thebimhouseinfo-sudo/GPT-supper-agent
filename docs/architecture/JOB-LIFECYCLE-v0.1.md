# Project / Job Lifecycle v1.1

## 1. Project lifecycle

```text
ACTIVE
PAUSED
ARCHIVED
```

Project Open shows ACTIVE + PAUSED and hides ARCHIVED.

Project delete removes Drive Project memory, not repositories.

## 2. Project creation/open

Create:
```text
Project folder
→ PROJECT.md
→ optional rebuildable control view
→ ACTIVE
```

Open:
```text
Project identity/current work
→ relevant durable context
→ selective live source
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

Example:
- code Job may include Coder → Reviewer → Tester;
- review Job means the objective itself is standalone review.

Job type is immutable.

## 4. Job lifecycle

```text
DRAFT
READY
IN_PROGRESS
COMPLETED
CANCELLED
SUPERSEDED
```

WAITING/BLOCKED are derived work conditions from Handoff/Human Gate/dependency/blocker records.

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

WAITING/BLOCKED are derived conditions.

Task deletion is allowed only before durable references exist.

## 6. Run

A Run begins when execution begins.

```text
IN_PROGRESS
WAITING_HUMAN
BLOCKED
COMPLETED
FAILED
CANCELLED
SUPERSEDED
```

Meaningful retry/new chat creates new linked Run.

Non-independent specialist assistance may create a child Run with `parent_run_id`.

## 7. Handoff

```text
PENDING
BLOCKED
CONSUMED
SUPERSEDED
```

Source Run is completed; Handoff represents pending transition.

## 8. Completion topology

There is no universal Reviewer requirement.

Normal topology is flexible, but mandatory review floor applies to mechanically sensitive change classes defined in Foundation F13.

Completion may require:
- Goal Recheck/self QA;
- capability-backed evidence;
- Reviewer;
- Tester;
- Human Gate;
- combinations.

## 9. PASS_RETEST_REQUIRED

Job may become COMPLETED + PASS_RETEST_REQUIRED while practical Retest remains pending.

Merge is allowed only after explicit human authorization with pending Retest/unverified coverage shown.

If later Retest FAIL occurs after Job completion:
```text
preserve completed Job
→ create linked remediation Job
```

Do not reopen a Task inside terminal Job.

## 10. Delivery facts

```text
accepted
merged
deployed
deployment_verified
```

Separate from lifecycle.

## 11. Job history/delete

Completed Job remains history.

No Job ARCHIVED state.

Hard delete is explicit human action.

Initial model does not require tombstones. Before deleting referenced Job data, show references/consequences and obtain explicit decision.

## 12. PAUSED/ARCHIVED execution

No chat can be asynchronously stopped by another chat.

Therefore lifecycle is rechecked before consequential actions.

PAUSED/ARCHIVED blocks new consequential work once observed.

## 13. Direct Agent promotion

Promotion does not mutate an ephemeral Direct Agent lifecycle.

It creates a new Project/Job from a promotion packet containing objective, outputs, assumptions, repo target and remaining work.
