# Execution, PR, and Review Model v0.1

## 1. Unit hierarchy

The system distinguishes a hierarchy of work units:

```text
Task
  < Review Unit
  < Pull Request
  < Change Set / Master Plan
  < Job
```

They are not interchangeable.

A higher-level unit is not complete merely because its children were implemented. Completion must be promoted upward through review.

### Task

Smallest meaningful execution unit with its own progress/check cycle.

### Review Unit

A group of tasks after which independent review is meaningful.

### Pull Request

The smallest change that can be understood, verified, approved, and rolled back as a coherent unit.

### Change Set

A project-level change that may coordinate multiple PRs across one or many repositories.

### Job

The top durable work unit selected from Drive.

A Job may contain one Change Set or several coherent work groups. It is the level at which Super Agent finally decides whether the requested work is accepted, must be reopened, or can be closed before the user moves on to another Job.

## 2. Hierarchical completion and review promotion

Core rule:

> IMPLEMENTED IS NOT THE SAME AS APPROVED, AND APPROVED CHILDREN DO NOT AUTOMATICALLY COMPLETE THEIR PARENT.

Every reviewable unit follows a maker/reviewer loop:

```text
OWNER WORKS
→ owner marks READY_FOR_REVIEW
→ Reviewer checks the artifact/result/evidence
   ├── CHANGES_REQUIRED → return to the owning level
   ├── ESCALATE → reopen a higher planning level
   └── APPROVED → promote completion upward
```

Typical nested execution:

```text
PLAN
↔ PLAN REVIEW

DETAILED EXECUTION PLAN
↔ EXECUTION PLAN REVIEW

TASK 1
↔ TASK REVIEW

TASK 2
↔ TASK REVIEW

...

REVIEW UNIT / PR
↔ PR-READY REVIEW

CHANGE SET
↔ INTEGRATION REVIEW

JOB
↔ FINAL JOB REVIEW
```

A child unit can be `APPROVED` while its parent remains incomplete.

A parent becomes eligible for its own review only when all required children are approved or explicitly waived by an approved rule.

### Failure routing

Review failure is routed to the lowest level that owns the defect:

```text
task implementation defect
→ reopen current Task

detailed execution-plan defect
→ reopen Detailed Execution Plan

plan / architecture / contract defect
→ PLANNING_GAP
→ reopen Planner level

cross-repo integration defect
→ reopen affected Change Set / repo work

final Job incompleteness
→ reopen the lowest affected unit(s)
```

Ancestors of a reopened unit can no longer remain `DONE`; they return to a non-final state until affected work is reviewed again.

### Job completion gate

A Job may be marked final only when:

- all required child work is approved;
- required integration/review gates have passed;
- completion evidence is fresh;
- no unresolved blocking finding remains;
- the final Job-level review returns approval.

The final Job review decides:

```text
JOB_APPROVED
→ mark Job complete / ready to leave
→ user may continue to another Job

JOB_CHANGES_REQUIRED
→ identify affected level
→ reopen that level
→ repeat the relevant review loop
```

Reviewer evaluates and routes; Reviewer does not repair the owner's work.

## 2. PR boundary rules

Do not use a hard rule such as one task equals one PR.

Split PRs when there are meaningful differences in:

- contract
- subsystem
- rollback boundary
- deployment order
- risk profile
- verification strategy
- repository

Do not split changes into tiny PRs that have no independent meaning.

Cognitive scope matters more than line count.

## 3. Multi-repo changes

A multi-repo change is represented as one Change Set with repository-specific PRs.

Example:

```text
PROFILE-V4 Change Set
  +-- Hub PR
  +-- Math PR
  +-- English PR
  +-- Typing PR
```

Project Memory tracks their coordination and integration state.

Individual PR approval does not imply Change Set approval.

## 4. Review gates

The default review topology contains five gate types.

### Gate 0 — Plan Readiness Review

For substantial changes, Reviewer audits Planner output before downstream design/execution depends on it.

### Gate 1 — Execution Plan Audit

Mandatory before coding.

Reviewer audits Coder's detailed execution plan and determines:

- task grouping
- review units
- PR boundaries
- stop points
- executor feasibility
- verification path

### Gate 2 — Architectural Checkpoint

Used when later work depends strongly on an earlier architectural or contract result.

Example:

```text
implement shared profile contract
-> STOP
-> reviewer audits API shape
-> migrate consumers
```

### Gate 3 — PR-Ready Review

Coder may complete several tasks continuously inside one review unit.

Before formal review, Coder performs full self QA/QC, verification, and diff inspection.

### Gate 4 — Integration / Change Set Review

Required when the change spans repositories or shared contracts.

Reviewer verifies:

- cross-repo compatibility
- contract versions
- deployment ordering
- remaining obligations
- integration evidence

## 5. GitHub connector as executor

When the repository has meaningful CI, GitHub can support a strong remote workflow:

```text
create branch
-> edit source
-> commit
-> open draft PR
-> CI
-> inspect logs
-> fix
-> formal review
-> merge
```

GitHub repository write capability does not imply local shell, localhost, desktop application, Revit, AutoCAD, or local filesystem capability.

Super Agent is online-first. If a task requires a local-only runtime, the Execution Plan Audit records `LOCAL_EXECUTION_REQUIRED` / `CAPABILITY_BLOCKED` for that step rather than silently routing it to a built-in local executor.

GPTWorker is a separate offline/local coding agent and is outside the Super Agent core execution lifecycle.

## 6. Draft PR model

A Draft PR can be opened early once there is a meaningful commit.

It provides:

- stable diff surface
- CI anchor
- change identity
- review history

Formal review begins only when Coder has completed self QA/QC and marks the work ready for review.

## 7. Capability-aware execution

Each execution step declares required capabilities.

Example:

```json
{
  "task": "TASK-0042",
  "repo": "KE-Math-Grade1",
  "requires": [
    "repo_read",
    "repo_write",
    "remote_ci"
  ],
  "executor": "github-online"
}
```

Planner and Reviewer must reject or scope-limit a plan when no configured online executor can provide the required capabilities. Local-only requirements are reported explicitly as outside the Super Agent execution boundary.

## 8. Completion evidence

No task, PR, or Change Set is complete merely because code was written.

Evidence may include:

- targeted tests
- full applicable test suite
- lint/type/build
- CI status
- original bug reproduction
- diff inspection
- acceptance checklist
- contract checks
- cross-repo integration checks

Completion claims must be based on fresh evidence.
