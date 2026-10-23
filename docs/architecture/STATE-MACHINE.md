---
id: STATE-MACHINE
version: 1.4
status: DEFINED
depends_on:
  - FOUNDATION
---

# State Model v1.4

## 1. Principle

Separate:
```text
lifecycle state
result
artifact validity
delivery facts
verification obligations
derived work condition
```

## 2. Project lifecycle

```text
ACTIVE
PAUSED
ARCHIVED
```

Delete is operation, not state.

## 2A. Source branch lifecycle

```text
ACTIVE → RETIRED
```

`RETIRED` is a terminal, durable repository-branch decision. It forbids choosing that branch for new work, but **does not delete the Git ref**, merge commits, or alter Project/Job lifecycle. Retirement is recorded with exact repository/branch/head SHA and Human authorization. Git ref deletion is a separately verified destructive action, never inferred from RETIRED. A retired branch is never silently reactivated; new work starts from the current authorized integration branch. See [BRANCH-LIFECYCLE.md](BRANCH-LIFECYCLE.md).

## 3. Job lifecycle

```text
DRAFT
READY
IN_PROGRESS
COMPLETED
CANCELLED
SUPERSEDED
RETIRED
```

Derived:
```text
WAITING
BLOCKED
```

Accepted terminal result:
```text
PASS
PASS_RETEST_REQUIRED
```

## 4. Task lifecycle

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

Completed Task does not reopen after parent Job completion.

## 5. Run lifecycle

A Run exists when execution begins.

Stored:
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

WAITING_HUMAN derives from an unresolved Human Gate/confirmation condition.
BLOCKED derives from an explicit blocker.
ABANDONED derives when a Run remains IN_PROGRESS after its execution/chat context is no longer live and no terminal record was written.

Meaningful retry/new chat creates new linked Run.

Child Run has independent lifecycle + parent_run_id.

## 6. Handoff

Handoff has no mutable stored lifecycle after creation.

Derived state:
```text
PENDING
BLOCKED
CONSUMED
CONFLICTED
SUPERSEDED
```

Derivation:
- PENDING = immutable Handoff exists and no valid consumption/supersession/blocker prevents dispatch;
- BLOCKED = an applicable blocker/Human Gate prevents dispatch;
- CONSUMED = exactly one valid HandoffConsumption/successor Run references the handoff;
- CONFLICTED = multiple incompatible valid consumption/successor records exist;
- SUPERSEDED = a separate supersession/control record declares this Handoff no longer actionable.

The original Handoff record is not rewritten to store these states.

## 7. Retest

Retest Request is stable; Retest state is derived from append-preserving attempt/verification records.

Derived state:
```text
PENDING
BLOCKED
PASS
FAIL
SUPERSEDED
```

Prior attempts are never rewritten or erased.

## 8. Asset Requirement

```text
DEFINED
AVAILABLE
VERIFIED
SUPERSEDED
```

Placeholder/final/integrated are facts/fields.

## 9. Artifact validity

```text
CURRENT
REVALIDATED
STALE
SUPERSEDED
```

Unknown/incomplete dependency trace counts as affected until revalidated.

## 10. Delivery facts

```text
accepted
merged
deployed
deployment_verified
```

## 11. Transition ownership

Domain defines semantics.

Harness/Orchestrator applies transitions when invoked; no always-running engine.

## 12. Project legal transitions

```text
ACTIVE → PAUSED | ARCHIVED
PAUSED → ACTIVE | ARCHIVED
ARCHIVED → ACTIVE | PAUSED
```

## 13. Job legal transitions

```text
DRAFT → READY | CANCELLED | SUPERSEDED | RETIRED
READY → IN_PROGRESS | CANCELLED | SUPERSEDED | RETIRED
IN_PROGRESS → COMPLETED | CANCELLED | SUPERSEDED | RETIRED
```

WAITING/BLOCKED are display/work conditions based on durable causes.

## 14. Smaller-domain safety

Task:
- terminal CANCELLED/SUPERSEDED/RETIRED do not reactivate;
- COMPLETED does not reopen under terminal parent Job.

Run:
- terminal states do not reactivate;
- retry = new linked Run.

Handoff:
- derived CONSUMED/SUPERSEDED do not silently return to PENDING;
- CONFLICTED blocks dispatch until reconciled;
- the immutable Handoff itself is never state-mutated.

Retest:
- prior results never erased.

Asset:
- SUPERSEDED does not reactivate.

## 15. Retest failure

```text
Job nonterminal + failure
→ active Task/work routing

Job COMPLETED + later Retest FAIL
→ preserve Job
→ new linked remediation Job
```

## 16. PAUSED/ARCHIVED realism

Before consequential action re-read Project lifecycle.

Already-issued indivisible action may settle.

Cross-chat consistency is eventual.

## 17. Consequential actions

- source write;
- destructive operation;
- Handoff consumption;
- merge/deploy;
- material shared control mutation.

## 18. Evaluation vocabulary

```text
PASS
PASS_RETEST_REQUIRED
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

## 19. Criterion vocabulary

```text
MET
PARTIAL
NOT_MET
UNVERIFIED
```


## 20. NEXT checkpoint claim state (CP5)

Checkpoint claim state is a separate runtime control domain, not Job/Run lifecycle:

```text
ACTIVE
→ SATISFIED | OBSERVED | FAILED_PRODUCT | BLOCKED | NEEDS_PLANNER_REVISION

ACTIVE --lease expires--> reclaim with new generation/token
FAILED_PRODUCT / BLOCKED --valid RETEST claim--> ACTIVE
NEEDS_PLANNER_REVISION --new reviewed planning revision--> old claim becomes non-applicable
```

Only the deterministic claim's current lease token is live. Attempt/Verification records are append-preserving evidence and cannot revive a stale token.

A terminal TEST/RETEST Verification is evidence-applicable only while its planning revision is current and the terminal claim points to its exact verification/attempt/token.

## 21. NEXT planning-review suspension during execution

For NEXT only:

```text
IN_PROGRESS reviewed revision
→ PLAN_GAP/SPEC_GAP
→ new planning_revision + planning_review=PENDING
→ dispatch/checkpoint claim blocked
→ Reviewer PASS
→ IN_PROGRESS dispatch resumes
```

This is a planning validity suspension inside `IN_PROGRESS`, not a new lifecycle state.

## 22. Plan-change retirement (LLC58)

`RETIRED` for a Job means the reviewed new Plan no longer needs it and no successor Job is created; `SUPERSEDED` requires a replacement. Both are terminal. A reviewed `PLAN_RECONCILIATION_INTENT` with `decision=RETIRE` and exact active Job SHA is required, followed by a persisted Job fence, settlement of active Runs and pending source cursor, and exact-SHA terminal transition/readback. `COMPLETED` Jobs are historical and are not retired retroactively. A retiring Run uses `CANCELLED` with Plan-change provenance; Run does not gain RETIRED.

Task `RETIRED` means a Task no longer needs work under the reviewed Plan. At parent Job retirement, all unfinished Tasks become RETIRED. Under `REPLACE`, individually listed obsolete Task IDs become RETIRED in predecessor history. An active Job whose partial scope changes is replaced using the existing review workflow; no retired Task may dispatch again. Dependencies/evidence must be revalidated independently and prior PASS evidence is not transferred to a successor.
