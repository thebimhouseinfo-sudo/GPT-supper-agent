# Execution, PR, and Review Model v0.1

## 1. Unit hierarchy

The system distinguishes four units:

```text
Task
  < Review Unit
  < Pull Request
  < Change Set / Master Plan
```

They are not interchangeable.

### Task

Smallest meaningful execution unit with its own progress/check cycle.

### Review Unit

A group of tasks after which independent review is meaningful.

### Pull Request

The smallest change that can be understood, verified, approved, and rolled back as a coherent unit.

### Change Set

A project-level change that may coordinate multiple PRs across one or many repositories.

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
