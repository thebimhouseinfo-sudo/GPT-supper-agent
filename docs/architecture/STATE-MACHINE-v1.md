---
id: STATE-MACHINE
version: 1.1
status: DEFINED
depends_on:
  - FROZEN-FOUNDATION-v0.1
---

# State Model v1.1

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

Do not use one universal status field.

## 2. Project lifecycle

```text
ACTIVE
PAUSED
ARCHIVED
```

Delete is an operation, not a state.

Project transition rules remain explicit because wrong transitions have governance impact.

## 3. Job lifecycle

```text
DRAFT
READY
IN_PROGRESS
COMPLETED
CANCELLED
SUPERSEDED
```

Derived work condition may be:
```text
WAITING
BLOCKED
```

WAITING/BLOCKED should be derived from a durable cause such as Handoff, Human Gate, dependency or blocker instead of duplicated as authoritative Job lifecycle whenever practical.

Accepted terminal successful result:
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
```

WAITING/BLOCKED are derived conditions.

A completed Task may be reactivated only while its parent Job is still nonterminal and remediation remains the same bounded objective.

If parent Job is COMPLETED, later remediation uses a new linked Job.

## 5. Run lifecycle

A Run exists when execution starts; avoid pre-execution CREATED/READY ceremony.

```text
IN_PROGRESS
WAITING_HUMAN
BLOCKED
COMPLETED
FAILED
CANCELLED
SUPERSEDED
```

A meaningful new attempt/new chat after interruption creates a new linked Run.

Child Run:
- has separate lifecycle;
- may execute in same chat when independence is not required;
- preserves parent_run_id.

## 6. Handoff lifecycle

```text
PENDING
BLOCKED
CONSUMED
SUPERSEDED
```

Consumed handoff remains historical.

## 7. Retest lifecycle

```text
PENDING
BLOCKED
PASS
FAIL
SUPERSEDED
```

Attempt history is append-preserving.

## 8. Asset Requirement lifecycle

Keep compact:

```text
DEFINED
AVAILABLE
VERIFIED
SUPERSEDED
```

Placeholder/final/integrated status are fields/facts, not separate lifecycle states unless future evidence proves otherwise.

## 9. Artifact validity

```text
CURRENT
REVALIDATED
STALE
SUPERSEDED
```

Unknown/incomplete dependency trace is treated as affected until revalidated.

## 10. Delivery facts

```text
accepted
merged
deployed
deployment_verified
```

These are not lifecycle states.

## 11. Transition ownership

Domains define semantic state meaning.

Orchestrator/harness applies transition rules when invoked; there is no always-running state engine.

## 12. Project legal transitions

```text
ACTIVE → PAUSED
ACTIVE → ARCHIVED
PAUSED → ACTIVE
PAUSED → ARCHIVED
ARCHIVED → ACTIVE
ARCHIVED → PAUSED
```

Delete remains explicit destructive operation.

## 13. Job legal transitions

```text
DRAFT → READY | CANCELLED | SUPERSEDED
READY → IN_PROGRESS | CANCELLED | SUPERSEDED
IN_PROGRESS → COMPLETED | CANCELLED | SUPERSEDED
```

A Job may display WAITING/BLOCKED while its lifecycle remains READY/IN_PROGRESS according to the blocking cause.

COMPLETED/CANCELLED/SUPERSEDED are historical terminal states.

## 14. Smaller-domain safety rules

Rather than large transition matrices:

Task:
- terminal CANCELLED/SUPERSEDED do not reactivate;
- COMPLETED does not reopen after parent Job completion.

Run:
- terminal COMPLETED/FAILED/CANCELLED/SUPERSEDED do not reactivate;
- retry creates new linked Run.

Handoff:
- CONSUMED/SUPERSEDED do not return to PENDING.

Retest:
- prior PASS/FAIL attempt history is never erased.

Asset:
- SUPERSEDED does not reactivate; create/revise current requirement explicitly.

## 15. Retest failure

```text
Job not terminal
+ practical/test failure
→ route to smallest relevant Task/work scope

Job COMPLETED + PASS_RETEST_REQUIRED
+ later Retest FAIL
→ preserve historical Job
→ create linked remediation Job
```

Status views must surface pending/failed Retests adjacent to completed Jobs.

## 16. PAUSED/ARCHIVED realism

A running chat cannot be externally interrupted by another chat.

Therefore:

```text
before consequential action
→ re-read Project lifecycle
→ if PAUSED/ARCHIVED, do not start that action
```

Already-issued indivisible external actions may settle if they cannot be cancelled.

Cross-chat consistency is eventual.

## 17. Consequential actions

Include:
- owned source write;
- destructive operation;
- handoff consumption;
- merge/deploy action;
- material shared control-plane mutation.

## 18. Evaluation vocabulary

```text
PASS
PASS_RETEST_REQUIRED
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

These are contextual evaluation/routing results, not lifecycle states.

## 19. Criterion verification vocabulary

For Goal Recheck / criterion mapping:

```text
MET
PARTIAL
NOT_MET
UNVERIFIED
```

UNVERIFIED is not equivalent to PASS.
