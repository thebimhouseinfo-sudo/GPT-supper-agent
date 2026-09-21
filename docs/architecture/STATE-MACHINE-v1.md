---
id: STATE-MACHINE
version: 1
status: DEFINED
depends_on:
  - FROZEN-FOUNDATION-v0.1
---

# State Machine v1

## 1. Principle

GSA does not use one universal overloaded status field.

Separate:

```text
lifecycle state
result
artifact validity
delivery facts
verification obligations
```

---

## 2. Project lifecycle

```text
ACTIVE
PAUSED
ARCHIVED
```

Delete is an operation, not a state.

---

## 3. Job lifecycle

```text
DRAFT
READY
IN_PROGRESS
WAITING
BLOCKED
COMPLETED
CANCELLED
SUPERSEDED
```

Accepted successful Job results:

```text
PASS
PASS_RETEST_REQUIRED
```

Other evaluation/routing results may include:

```text
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

A Job may be COMPLETED + PASS_RETEST_REQUIRED while durable Retest remains pending.

---

## 4. Task lifecycle

```text
PLANNED
READY
IN_PROGRESS
WAITING
BLOCKED
COMPLETED
CANCELLED
SUPERSEDED
```

CHANGES_REQUIRED is an evaluation result/routing condition, not Task lifecycle state.

---

## 5. Run lifecycle

```text
CREATED
READY
IN_PROGRESS
WAITING_HUMAN
BLOCKED
COMPLETED
FAILED
CANCELLED
SUPERSEDED
```

WAITING_HANDOFF is not a Run state.

Once source execution ends, Run completes and a Handoff carries the pending transition.

---

## 6. Handoff lifecycle

```text
PENDING
BLOCKED
CONSUMED
SUPERSEDED
```

Consumed Handoff remains historical.

---

## 7. Retest lifecycle

```text
PENDING
BLOCKED
PASS
FAIL
SUPERSEDED
```

Retest attempt history is append-preserving.

---

## 8. Asset Requirement lifecycle

```text
DEFINED
PLACEHOLDER_READY
FINAL_PENDING
FINAL_AVAILABLE
INTEGRATED
VERIFIED
SUPERSEDED
```

Applicable intermediate states may be skipped.

---

## 9. Artifact validity

```text
CURRENT
REVALIDATED
STALE
SUPERSEDED
```

Validity changes through causal impact analysis, not blanket invalidation.

---

## 10. Delivery facts

Separate facts/events:

```text
accepted
merged
deployed
deployment_verified
```

These are not lifecycle states.

---

## 11. Transition ownership

```text
domain
→ defines semantic state meanings and valid transitions

Orchestrator
→ validates/applies transitions
→ persists control-plane state
```

---

## 12. Review topology

Review does not create a universal state-machine gate.

Detailed Execution Plan / milestone topology determines which checkpoints require:
- Reviewer;
- Tester;
- Human Gate;
- objective evidence;
- combinations.

There is no universal final Reviewer requirement for every Job.

---

## 13. Resume/retry

```text
same uninterrupted execution context
→ same Run may continue

meaningful new attempt/new chat after interruption
→ new linked Run
```

Completed historical records are not rewritten as though prior attempts never occurred.

---

## 14. Reopen after later failure

Examples:

```text
Retest FAIL
→ reopen smallest relevant Task or create remediation Task
→ preserve original Job/Run history

post-release material defect
→ normally create new linked Job
→ do not rewrite old completed Job history
```

---

## 15. Illegal semantic collapses

The following are invalid:

```text
merged = Job state
STALE = review verdict
Retest pending = Job must stay IN_PROGRESS
review required = every PR/Task/Job
delete = lifecycle state
```

---

## 16. State-machine invariants

1. Project/Job/Task/Run/Handoff/Retest have distinct state spaces.
2. Result is separate from lifecycle state.
3. Validity is separate from result.
4. Delivery facts are separate from lifecycle state.
5. Orchestrator enforces transitions.
6. Review topology determines gates.
7. Historical attempts/results remain traceable.
