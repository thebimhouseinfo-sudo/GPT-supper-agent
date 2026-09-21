# SYNTHESIS — State Model v1

## Status

```text
LOOP_STAGE = SYNTHESIZE
PASS = 01
DOMAIN = STATE MODEL
STATUS = SYNTHESIZED_DRAFT
CANONICAL = false
```

This synthesis applies REVIEW PASS 01.

---

## 1. Separation rule

The system MUST keep these dimensions separate:

```text
lifecycle state
result
validity
delivery facts/events
verification obligations
```

No single overloaded `status` field should represent all of them.

---

## 2. Project lifecycle

Accepted:

```text
ACTIVE
PAUSED
ARCHIVED
```

Transitions:

```text
ACTIVE ↔ PAUSED
ACTIVE ↔ ARCHIVED
PAUSED ↔ ARCHIVED
```

Delete is not a lifecycle state. It is a destructive operation.

---

## 3. Job lifecycle

Synthesized Job lifecycle:

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

Semantics:

- `DRAFT`: Job defined but not yet executable.
- `READY`: prerequisites/topology sufficient to start.
- `IN_PROGRESS`: at least one active execution path exists.
- `WAITING`: intentionally waiting on dependency, Human Gate, next handler, external event, or scheduled continuation.
- `BLOCKED`: cannot progress until a concrete blocker is resolved.
- `COMPLETED`: Job completion topology satisfied and accepted result recorded.
- `CANCELLED`: intentionally stopped with no replacement implied.
- `SUPERSEDED`: replaced by newer Job/work.

Job result is separate:

```text
PASS
PASS_RETEST_REQUIRED
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

Normally a terminal accepted Job uses `COMPLETED + PASS` or `COMPLETED + PASS_RETEST_REQUIRED`.

A Job may be deleted explicitly, but deletion is not a state.

---

## 4. Task lifecycle

Synthesized Task lifecycle:

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

`CHANGES_REQUIRED` is not Task lifecycle state. It is a review/result condition that normally routes the Task back to `READY` or `IN_PROGRESS`.

Task hard-delete is allowed only before durable references depend on it.

---

## 5. Run lifecycle

Synthesized Run lifecycle:

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

Important:

```text
WAITING_HANDOFF
→ not a Run state
```

Once execution is done, the Run becomes `COMPLETED`; pending transition is represented by Handoff.

Meaningful new attempt/new chat after interruption creates a new linked Run.

---

## 6. Handoff lifecycle

```text
PENDING
BLOCKED
CONSUMED
SUPERSEDED
```

A Handoff remains historical after `CONSUMED`.

---

## 7. Retest lifecycle

Accepted:

```text
PENDING
BLOCKED
PASS
FAIL
SUPERSEDED
```

Attempt history is append-preserving.

---

## 8. Asset Requirement lifecycle

Synthesized:

```text
DEFINED
PLACEHOLDER_READY
FINAL_PENDING
FINAL_AVAILABLE
INTEGRATED
VERIFIED
SUPERSEDED
```

A Project may skip some intermediate states where not applicable.

Example:

```text
DEFINED
→ FINAL_AVAILABLE
→ INTEGRATED
→ VERIFIED
```

---

## 9. Artifact validity

Synthesized validity dimension:

```text
CURRENT
REVALIDATED
STALE
SUPERSEDED
```

Validity is causal, not automatically changed by every upstream edit.

---

## 10. Review/evaluation results

Shared evaluation result vocabulary:

```text
PASS
PASS_RETEST_REQUIRED
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

Not every domain must use every result.

`STALE` belongs to validity, not review verdict.

---

## 11. Delivery facts

Independent event/fact dimension:

```text
accepted
merged
deployed
deployment_verified
```

These should be recorded as facts/events with revision/target when relevant.

---

## 12. Transition ownership

```text
Domain
→ defines state semantics and valid transitions

Orchestrator
→ evaluates/apply transition requests
→ prevents illegal transition
→ persists resulting state
```

---

## 13. Reopen rules

Examples:

```text
Task COMPLETED
+ Retest FAIL
→ create remediation Task or reopen smallest owning Task
→ preserve original completion history

Job COMPLETED
+ pending Retest
→ remains COMPLETED
→ Retest remains outstanding obligation

Job COMPLETED
+ material post-release defect
→ normally create new linked Job
→ do not rewrite historical Job as if it never completed
```

---

## 14. Derived Project status summary

Project status views may derive:

- active Jobs;
- waiting Jobs;
- blockers;
- pending Human Gates;
- pending Retests;
- recent delivery facts;
- release milestones.

These are views, not new lifecycle states.

---

## 15. State-model invariants

1. State, result, validity, and delivery facts are separate.
2. Handoff owns inter-Run waiting after source Run completes.
3. Retest does not keep accepted Job artificially open.
4. Historical terminal records are not silently rewritten.
5. Orchestrator enforces transitions but does not redefine domain meaning.
6. Deletion is an operation, not a lifecycle state.
