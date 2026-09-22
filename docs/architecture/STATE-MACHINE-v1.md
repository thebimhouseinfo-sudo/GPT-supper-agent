---
id: STATE-MACHINE
version: 1.2
status: DEFINED
depends_on:
  - FROZEN-FOUNDATION-v0.1
---

# State Model v1.2

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

## 3. Job lifecycle

```text
DRAFT
READY
IN_PROGRESS
COMPLETED
CANCELLED
SUPERSEDED
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
```

WAITING_HUMAN derives from unresolved Human Gate/confirmation condition; BLOCKED derives from explicit blocker.

Meaningful retry/new chat creates new linked Run.

Child Run has independent lifecycle + parent_run_id.

## 6. Handoff

```text
PENDING
BLOCKED
CONSUMED
SUPERSEDED
```

## 7. Retest

```text
PENDING
BLOCKED
PASS
FAIL
SUPERSEDED
```

Attempt history append-preserving.

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
DRAFT → READY | CANCELLED | SUPERSEDED
READY → IN_PROGRESS | CANCELLED | SUPERSEDED
IN_PROGRESS → COMPLETED | CANCELLED | SUPERSEDED
```

WAITING/BLOCKED are display/work conditions based on durable causes.

## 14. Smaller-domain safety

Task:
- terminal CANCELLED/SUPERSEDED do not reactivate;
- COMPLETED does not reopen under terminal parent Job.

Run:
- terminal states do not reactivate;
- retry = new linked Run.

Handoff:
- CONSUMED/SUPERSEDED do not return PENDING.

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
