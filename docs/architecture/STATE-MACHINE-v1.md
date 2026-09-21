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


---

## 17. Legal transition matrix

### Project

```text
ACTIVE → PAUSED
ACTIVE → ARCHIVED
PAUSED → ACTIVE
PAUSED → ARCHIVED
ARCHIVED → ACTIVE
ARCHIVED → PAUSED
```

Delete is permitted only through explicit destructive operation and is not a lifecycle transition.

### Job

```text
DRAFT → READY
DRAFT → CANCELLED
DRAFT → SUPERSEDED

READY → IN_PROGRESS
READY → WAITING
READY → BLOCKED
READY → CANCELLED
READY → SUPERSEDED

IN_PROGRESS → WAITING
IN_PROGRESS → BLOCKED
IN_PROGRESS → COMPLETED
IN_PROGRESS → CANCELLED
IN_PROGRESS → SUPERSEDED

WAITING → READY
WAITING → IN_PROGRESS
WAITING → BLOCKED
WAITING → COMPLETED
WAITING → CANCELLED
WAITING → SUPERSEDED

BLOCKED → READY
BLOCKED → IN_PROGRESS
BLOCKED → CANCELLED
BLOCKED → SUPERSEDED
```

`COMPLETED`, `CANCELLED`, and `SUPERSEDED` are historical terminal states. Later work normally uses a new linked Job rather than moving the historical Job backward.

### Task

```text
PLANNED → READY
PLANNED → CANCELLED
PLANNED → SUPERSEDED

READY → IN_PROGRESS
READY → WAITING
READY → BLOCKED
READY → CANCELLED
READY → SUPERSEDED

IN_PROGRESS → WAITING
IN_PROGRESS → BLOCKED
IN_PROGRESS → COMPLETED
IN_PROGRESS → CANCELLED
IN_PROGRESS → SUPERSEDED

WAITING → READY
WAITING → IN_PROGRESS
WAITING → BLOCKED
WAITING → COMPLETED
WAITING → CANCELLED
WAITING → SUPERSEDED

BLOCKED → READY
BLOCKED → IN_PROGRESS
BLOCKED → CANCELLED
BLOCKED → SUPERSEDED
```

A completed Task may be explicitly reopened only when the remediation is still semantically the same bounded Task.

The only direct reopen transition is:

```text
COMPLETED → READY
```

This forces current inputs/acceptance to be re-evaluated before new execution starts.

Do not use `COMPLETED → IN_PROGRESS` directly.

If remediation introduces materially new scope/type/objective, create a new linked remediation Task instead.

### Run

```text
CREATED → READY
CREATED → CANCELLED
CREATED → SUPERSEDED

READY → IN_PROGRESS
READY → CANCELLED
READY → SUPERSEDED

IN_PROGRESS → WAITING_HUMAN
IN_PROGRESS → BLOCKED
IN_PROGRESS → COMPLETED
IN_PROGRESS → FAILED
IN_PROGRESS → CANCELLED
IN_PROGRESS → SUPERSEDED

WAITING_HUMAN → IN_PROGRESS
WAITING_HUMAN → CANCELLED
WAITING_HUMAN → SUPERSEDED

BLOCKED → IN_PROGRESS
BLOCKED → FAILED
BLOCKED → CANCELLED
BLOCKED → SUPERSEDED
```

`COMPLETED`, `FAILED`, `CANCELLED`, and `SUPERSEDED` Runs are historical terminal attempts. Retry creates a new linked Run.

### Handoff

```text
PENDING → CONSUMED
PENDING → BLOCKED
PENDING → SUPERSEDED

BLOCKED → PENDING
BLOCKED → SUPERSEDED
```

`CONSUMED` and `SUPERSEDED` are terminal historical Handoff states.

### Retest

```text
PENDING → BLOCKED
PENDING → PASS
PENDING → FAIL
PENDING → SUPERSEDED

BLOCKED → PENDING
BLOCKED → PASS
BLOCKED → FAIL
BLOCKED → SUPERSEDED
```

PASS/FAIL results are preserved in attempt history. A later practical verification attempt does not erase the earlier result.

---

## 18. Transition triggers / authority

Typical trigger ownership:

```text
Human
→ Project lifecycle changes
→ destructive delete
→ material approval/waiver
→ merge/release authorization

Orchestrator
→ validates/applies ordinary workflow transitions
→ derives WAITING/BLOCKED from durable causes
→ creates/consumes Handoffs

Planner
→ may propose Job/Task readiness/topology changes

Coder / Designer / Reviewer / Tester
→ emit structured results that request transition
→ do not unilaterally override governance
```

A role result may request a transition; Orchestrator validates it against current durable state and topology.

---

## 19. BLOCKED state vs BLOCKED result

```text
lifecycle BLOCKED
= work currently cannot progress

evaluation/result BLOCKED
= an evaluator/execution could not complete judgement or required verification
```

One does not automatically imply the other.

---

## 20. Invalid transition examples

Invalid without explicit new-work semantics:

```text
COMPLETED Job → IN_PROGRESS
COMPLETED Run → IN_PROGRESS
CONSUMED Handoff → PENDING
CANCELLED Job → READY
SUPERSEDED Task → IN_PROGRESS
```

Use new linked Job/Task/Run when new work is actually being performed.


---

## 21. Project PAUSED semantics

```text
Project PAUSED
→ Project Memory remains readable
→ no new Job/Task/Run execution begins
→ no pending Handoff is consumed
→ active work stops at earliest safe boundary
→ resume execution requires Project ACTIVE
```

A currently issued indivisible external action may finish if the executor cannot cancel it safely.

Its observed result must be persisted before stopping.

PAUSED is therefore an execution freeze, not deletion or archive.

---

## 22. Project ARCHIVED semantics

```text
Project ARCHIVED
→ visible in Project Status
→ hidden from normal Project Open
→ history/read inspection allowed
→ ordinary work execution prohibited
```

To resume ordinary work, reactivate the Project, normally:

```text
ARCHIVED → ACTIVE
```

---

## 23. WAITING vs BLOCKED

```text
WAITING
= a valid continuation path exists,
  but a known condition / handler / event has not occurred yet

BLOCKED
= no safe/current continuation path exists
  until a blocker is actively resolved
```

Examples:

```text
WAITING
→ next human-dispatched role is known
→ known external completion is pending
→ expected event has not occurred yet

BLOCKED
→ required permission unavailable
→ architecture decision unresolved
→ source inaccessible
→ concurrency conflict unresolved
```

---

## 24. Shared evaluation vocabulary scope

Shared evaluation vocabulary:

```text
PASS
PASS_RETEST_REQUIRED
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

is contextual and is not a mandatory enum for every durable entity.

For a completed accepted Job, the terminal accepted result is normally:

```text
PASS
or
PASS_RETEST_REQUIRED
```

Other values are normally nonterminal evaluation/routing outcomes.

---

## 25. Lifecycle change during active execution

When a Project changes from ACTIVE to PAUSED or ARCHIVED while a Run is active:

```text
record lifecycle change
→ do not begin another consequential action
→ allow already-issued indivisible action to settle if cancellation is unavailable
→ persist observed result
→ stop at earliest safe boundary
→ keep subsequent Handoff/work pending
```

Do not claim an external action was cancelled unless the executor confirms cancellation.
