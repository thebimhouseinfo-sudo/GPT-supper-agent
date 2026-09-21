# Project / Job Lifecycle v1

## 1. Project lifecycle

```text
ACTIVE
PAUSED
ARCHIVED
```

Project Open shows ACTIVE + PAUSED and hides ARCHIVED.

Project Delete is a destructive operation that removes Project Drive memory/control-plane state and does not imply GitHub repository deletion.

Deleting a Project releases its GSA ownership associations for previously OWNED repositories. The repositories remain untouched and may later be explicitly attached to another Project.

---

## 2. Project creation

```text
project new
→ create Project folder
→ write PROJECT.md
→ initialize CONTROL.json
→ Project lifecycle = ACTIVE
→ owned repos may still be 0
```

Planning/design may begin before any owned repo exists.

---

## 3. Project open

```text
resolve Project
→ read PROJECT.md
→ read CONTROL
→ identify active/waiting work
→ load relevant durable context
→ resolve current request
→ selectively read GitHub only when needed
```

---

## 4. Job lifecycle

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

Job result is separate:

```text
PASS
PASS_RETEST_REQUIRED
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

---

## 5. Job identity

Job ID is globally unique.

Job type is immutable after creation.

Baseline types:

```text
plan
code
design
review
```

A materially different workflow creates a new linked Job.

---

## 6. Job creation

A Job is created when a finite objective requires its own workflow/completion boundary.

Job creation does not require:
- a new chat;
- a new agent;
- a new PR;
- a Retest;
- an Asset Requirement.

---

## 7. Task lifecycle

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

Task deletion is allowed only before durable references depend on it.

---

## 8. Run lifecycle

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

A meaningful new attempt/context creates a new linked Run.

---

## 9. Handoff lifecycle

```text
PENDING
BLOCKED
CONSUMED
SUPERSEDED
```

Pending next-role transition is represented by Handoff, not by keeping the source Run alive.

---

## 10. Completion

A Job becomes COMPLETED when its own approved completion topology is satisfied.

There is no universal Reviewer requirement.

Possible completion paths may involve:
- objective evidence/self QA;
- Reviewer;
- Tester;
- Human Gate;
- combinations.

Accepted successful results:

```text
PASS
PASS_RETEST_REQUIRED
```

PASS_RETEST_REQUIRED permits completed/accepted Job while practical Retest remains outstanding.

---

## 11. Merge/deploy facts

Separate recorded facts:

```text
accepted
merged
deployed
deployment_verified
```

Merge requires explicit human authorization.

---

## 12. Job history/delete

Completed Job remains in Project history.

No Job ARCHIVED state exists.

Hard Job deletion is allowed as explicit user action.

Deletion semantics:

```text
no surviving durable external references
→ full deletion

surviving durable external references
→ delete detailed Job-owned records
→ preserve minimal tombstone identity required by surviving references
```

The tombstone is not Job ARCHIVED state and does not retain ordinary Job contents.


---

## 13. PAUSED execution semantics

```text
PAUSED
→ durable state readable
→ no new execution begins
→ no pending Handoff consumed
→ active Run stops at earliest safe boundary
→ ACTIVE required to resume
```

---

## 14. ARCHIVED execution semantics

```text
ARCHIVED
→ history/status read allowed
→ ordinary execution prohibited
→ reactivate before work resumes
```

Normal work resume is `ARCHIVED → ACTIVE`.

---

## 15. WAITING vs BLOCKED

```text
WAITING
= valid continuation path exists but known condition/handler/event is pending

BLOCKED
= no safe continuation path exists until blocker is resolved
```

---

## 16. Result vocabulary

Shared evaluation terms are contextual.

A completed accepted Job normally records only:

```text
PASS
PASS_RETEST_REQUIRED
```

`CHANGES_REQUIRED`, `BLOCKED`, and `HUMAN_REVIEW_REQUIRED` normally route nonterminal work rather than define accepted terminal Job result.
