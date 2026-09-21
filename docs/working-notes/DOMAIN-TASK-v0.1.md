# DOMAIN DETAIL — Task v0.1

## Status

```text
PHASE = THEORY DETAIL
DOMAIN = TASK
STATUS = WORKING_DRAFT
CANONICAL = false
```

This document details the Task domain under the accepted hierarchy:

```text
Project
→ Job
→ Task
→ Run
```

It intentionally defines Task semantics before any physical Project Memory layout, file format, folder structure, or CLI grammar is nominated.

---

## 1. Task definition

A Task is a **bounded work package inside exactly one Job**.

```text
Task
= smaller executable work unit
+ scoped objective
+ owning Job
+ dependency context
+ expected output
+ completion criteria
```

A Task exists to make a finite Job easier to plan, execute, attribute, parallelize, review, resume, and verify.

A Task is NOT:

- a Project;
- a Job;
- a Run;
- a chat;
- an agent;
- a repository;
- a pull request;
- a milestone by definition;
- an Asset Requirement;
- a Retest;
- a finding;
- a Human Gate.

---

## 2. Task belongs to one Job

Every Task belongs to exactly one Job.

```text
Task
→ one owning Job
```

A Task never floats independently across Projects or Jobs.

If work must span multiple Jobs, that relationship is represented through Job dependencies or cross-Job coordination rather than making one Task belong to multiple Jobs.

---

## 3. Task creation is optional

A Job does not require Task decomposition when the work is trivially small.

Examples:

```text
small review Job
→ one Run
→ no explicit Task decomposition required

larger code Job
→ several independently executable work packs
→ Tasks useful
```

Therefore:

```text
Job may contain 0..N explicit Tasks
```

The absence of Tasks does not make a Job invalid.

When Tasks are used, they should have meaningful execution boundaries rather than being created mechanically for every conversational action.

---

## 4. Task objective

Every explicit Task needs a scoped objective.

The Task objective answers:

```text
What specific piece of the parent Job should this Task accomplish?
```

Examples:

```text
Job objective:
Implement new lesson flow.

Task 1:
Implement automatic advance after answer feedback.

Task 2:
Implement final exercise report.

Task 3:
Integrate lesson artwork assets.
```

A Task objective must remain subordinate to the parent Job objective.

Task scope must not silently expand the Job's architecture, repository ownership, or approved product semantics.

---

## 5. Task granularity

A Task should be large enough to produce a meaningful result and small enough to execute/review/resume coherently.

Bad over-fragmentation:

```text
Task: open file
Task: rename variable
Task: save file
```

Bad under-fragmentation:

```text
Task: build the whole platform
```

Useful granularity depends on:

- causal independence;
- ownership/handler;
- write scope;
- verification boundary;
- dependency structure;
- resumability;
- review usefulness;
- parallelization potential.

Exact numeric size limits are not appropriate.

---

## 6. Task and milestone are distinct concepts

A Task is a work package.

A milestone is a workflow/checkpoint boundary in the Job topology.

They may align, but they are not synonyms.

Examples:

```text
Milestone M2: Core implementation

Tasks:
- T1 implement state model
- T2 implement UI shell
- T3 integrate assets
```

Or:

```text
Task T3
→ spans M2 implementation
→ M3 review
→ M4 practical verification
```

Do not force a one-to-one mapping.

---

## 7. Task and role ownership

A Task may have a primary handler for its current stage, but Task identity is not permanently owned by one agent.

Example:

```text
Task T2
→ Coder Run implements
→ Reviewer Run reviews
→ Coder Run fixes
→ Tester Run exercises
```

Therefore:

```text
Task
≠ one agent
```

Run-level attribution remains the authoritative record of which role performed which execution attempt.

---

## 8. Task and Run relationship

A Task may have zero, one, or many Runs.

```text
Task T1
├── Run R1 role=coder
├── Run R2 role=reviewer
└── Run R3 role=coder
```

Zero Runs is valid for a Task that has been created/planned but not yet executed.

A Run may operate on:

- one specific Task;
- multiple Tasks in one coherent execution attempt;
- Job-level scope when no explicit Tasks exist.

Whether one Run may formally bind to multiple Tasks is a semantic point that must be confirmed during Run-domain detail.

This Task pass does not silently decide it.

---

## 9. Task dependencies

Tasks may depend on other Tasks in the same Job.

Conceptually:

```text
T1 → T2
```

means T2 depends on T1.

Dependencies should express real causal constraints such as:

- output dependency;
- contract dependency;
- source/write dependency;
- design dependency;
- verification dependency;
- environment dependency.

Do not create dependency edges merely because one Task was listed earlier.

---

## 10. Task parallelism

Tasks may execute in parallel when dependencies and write scopes allow.

```text
parallel
= no causal dependency
+ no unsafe write conflict
+ no shared unresolved assumption
```

Examples:

```text
T1 implement frontend shell
T2 generate stable asset binaries

→ may run in parallel if asset contract/path is already frozen
```

But:

```text
T1 define schema
T2 implement consumer of schema

→ sequential until schema contract is stable
```

Task parallelism must respect Job-level topology and Project-level cross-Job coordination.

---

## 11. Task source scope

A Task may be constrained to:

- specific owned repo(s);
- path(s);
- component(s);
- contract(s);
- data/schema area;
- design artifact(s);
- non-code artifact scope.

Task scope is subordinate to the Job's approved scope.

Conceptually:

```text
Project ownership
≥ Job write scope
≥ Task write scope
```

A Task may not expand repository ownership or write into referenced repos.

---

## 12. Task completion criteria

An explicit Task should define what it means for that work package to be complete enough to hand off.

Completion may depend on:

- implementation finished;
- artifact produced;
- acceptance criteria met;
- required local/remote checks completed;
- review completed when assigned;
- evidence attached;
- blocker resolved;
- output ready for downstream Task/stage.

Task completion is not automatically Job completion.

```text
Task PASS
≠ Job PASS
```

The Job aggregates the state of relevant Tasks, stages, review, Human Gates, Retests, and delivery requirements.

---

## 13. Task result vs Task state

This pass distinguishes two ideas:

```text
state
= where the Task currently is in its lifecycle

result
= outcome of completed evaluation/work
```

Exact state/result vocabularies are not frozen here.

Candidate semantic conditions include:

- planned/not started;
- ready;
- in progress;
- waiting/dependent;
- blocked;
- completed;
- changes required;
- superseded;
- cancelled.

These are COLLECT candidates only.

Do not convert them into a final enum yet.

---

## 14. Task review

Review may target:

- one Task;
- multiple Tasks;
- one milestone;
- whole Job;
- exact commit/PR/revision that contains Task work.

Task existence does not imply mandatory review.

The Detailed Execution Plan determines whether and where Task-level review is required.

When reviewed, evidence must bind to the exact target/revision rather than merely saying the Task was reviewed "sometime".

---

## 15. Task and findings

Review findings may point to one or more Tasks.

A finding is not a Task by default.

Example:

```text
Finding F-17
→ affects Task T2
→ requires change
```

Whether remediation becomes:

- continuation of T2;
- a new Task;
- a new Job;

depends on scope and causal impact.

Minor fixes within the same objective normally remain under the same Task unless separate tracking materially helps.

---

## 16. Task and Causal Change Review

When upstream approved decisions change, Task impact must be traced causally.

Possible outcomes for an existing Task:

```text
UNCHANGED
REVALIDATED
STALE
SUPERSEDED
```

These labels describe change impact, not necessarily the Task lifecycle enum itself.

Do not mark every downstream Task stale automatically.

The system must identify why the Task is or is not affected.

---

## 17. Task and Asset Requirements

An Asset Requirement may belong to a Task.

Example:

```text
Task T4
= integrate topic artwork

Asset Requirements:
- AR-0012
- AR-0013
```

Asset Requirements remain separate entities because they have their own stable integration contracts, filenames/paths/specs and practical verification needs.

A Task may finish implementation using placeholders while final assets remain pending if the Job's accepted workflow permits PASS_RETEST_REQUIRED.

---

## 18. Task and Retest

A Retest may reference one or more Tasks as owning scope.

```text
RT-0042-01
→ Job J-0042
→ Task T3
```

Retest is not a Task type.

A practical failure may reopen the smallest relevant Task scope or create a new remediation Task depending on the size and causal boundary of the fix.

Exact reopen semantics should be synthesized after Run/Retest lifecycle detail.

---

## 19. Task and Human Gates

A Human Gate may block progress on a Task or stage.

Examples:

- choose design direction before Task continues;
- approve destructive migration;
- accept subjective visual decision;
- approve waiver.

Human Gate is not itself a Task unless the human decision is packaged inside a broader finite work objective.

A Task waiting on Human Gate must preserve enough durable context to resume correctly later.

---

## 20. Task interruption / resume

A Task may pause across chats or Runs.

Durable state must be sufficient to answer:

```text
What was being done?
What is already complete?
What remains?
What target/revision was used?
What assumptions/contracts apply?
What blocker or next action exists?
```

This requirement does not yet imply one Task file or a Task folder.

Storage form will be synthesized later.

---

## 21. Task reassignment

Because Task identity is not tied to one agent, a later Run may use a different role when the Job topology requires it.

Example:

```text
Task T5
→ Coder implementation
→ Reviewer inspection
→ Coder remediation
```

No special "ownership transfer" is needed merely because the active role changes.

However, if responsibility changes the Task's actual objective/scope, Causal Change Review may be required.

---

## 22. Task cancellation / supersession

Task-level cancellation/supersession may be useful when planned work becomes unnecessary.

Examples:

```text
T4 planned
→ upstream design changes
→ T4 no longer needed
→ superseded/cancelled
```

The distinction between CANCELLED and SUPERSEDED is semantically useful:

```text
CANCELLED
= intentionally stopped with no replacement implied

SUPERSEDED
= replaced by newer work/decision
```

This distinction is currently a nominated candidate and must be reviewed against the full state model later.

---

## 23. Task deletion

Hard deletion is potentially different from cancellation.

Because Tasks may be referenced by:

- Runs;
- review findings;
- Retests;
- evidence;
- approvals;
- release history;
- other Tasks;

deletion can destroy referential integrity.

Therefore Task hard-delete semantics are intentionally not nominated yet.

This requires a human/governance decision after Run/evidence/retest relationships are fully detailed.

---

## 24. Task identity

Task identity must be durable and unambiguous enough to support:

- Run attribution;
- dependencies;
- findings;
- Retests;
- handoffs;
- later chat resume;
- evidence linkage.

Exact syntax is mechanical and deferred.

A semantic decision remains:

```text
Should Task ID be globally unique across GSA,
or only unique within its globally unique Job?
```

Because Job IDs are already universally unique, both models are technically workable.

This is a human-facing identity/governance choice rather than a storage-only choice.

---

## 25. Task creation timing

A Task may be created during:

- initial Detailed Execution Plan;
- later decomposition of a known Job stage;
- Causal Change Review;
- remediation after review/test failure.

Task creation during execution is allowed only when it does not silently change approved product/architecture intent.

If a newly discovered Task represents a material scope expansion, it must be surfaced through the relevant human/plan/change-review boundary.

---

## 26. Task invariants — current detail pass

1. Task is a bounded work package inside exactly one Job.
2. Task creation is optional for trivially small Jobs.
3. Explicit Tasks require a meaningful scoped objective.
4. Task scope is subordinate to Job scope.
5. Task does not own a repository.
6. Task may constrain work to specific repos/paths/components/artifacts.
7. Task may have dependencies on other Tasks.
8. Tasks may run in parallel only when causally and write-scope safe.
9. Task is not permanently owned by one agent.
10. Run-level attribution records who executed work.
11. Task completion does not imply Job completion.
12. Task review is topology-driven, not automatic.
13. Asset Requirement and Retest are separate entities, not Task types.
14. Upstream changes affect Tasks through Causal Change Review.
15. Physical Task storage is deferred.
16. Task interruption/resume requires durable reconstructable context.
17. Task state enum is not frozen yet.
18. Task ID syntax is deferred.
19. Cancellation vs supersession is nominated for later review.
20. Hard Task deletion semantics remain unresolved.

---

## 27. DETAIL output — candidates for later COLLECT

### Lifecycle candidates

- PLANNED / NOT_STARTED semantic state;
- READY;
- IN_PROGRESS;
- WAITING;
- BLOCKED;
- COMPLETED;
- CHANGES_REQUIRED;
- CANCELLED;
- SUPERSEDED;
- stale/revalidated impact annotations.

These are candidates, not final enum values.

### Persistence/access candidates

- Task identity;
- owning Job;
- objective;
- scope;
- repo/path/component constraints;
- dependencies;
- expected output;
- completion criteria;
- current stage/handler if useful;
- Run linkage;
- review/finding linkage;
- Asset Requirement linkage;
- Retest linkage;
- blocker/next-action context;
- creation/update provenance;
- cancellation/supersession reason.

### Cross-domain dependencies

Need later detail from:

- Run;
- Handoff;
- Reviewer;
- Tester;
- Evidence;
- Retest;
- Human Gate;
- state machine;
- storage model;
- CLI/user UX.

### Nominated decisions for later COLLECT/REVIEW

#### 1. Task ID uniqueness scope

**Nomination: globally unique Task ID.**

Preferred:

```text
Task ID
→ globally unique across GSA
```

Rationale:

- Task references may appear outside the immediate Job context;
- review, Retest, evidence, handoff and future cross-Project tooling become unambiguous;
- users can quote one Task ID without also supplying Job ID;
- the exact syntax can still encode or derive Job relationship if useful.

Alternative:

```text
Task ID unique only within globally unique Job
```

Benefit:
- shorter/local identifiers may be easier to read.

Cost:
- any detached reference must carry both Job ID + Task ID.

Mark:
```text
REVIEW_REQUIRED
```

#### 2. Task hard-delete policy

**Nomination: hard-delete allowed only while no durable references depend on the Task; otherwise preserve and cancel/supersede instead.**

Preferred:

```text
unreferenced planned Task
→ may hard-delete

Task with Run/evidence/retest/review/approval/dependency history
→ do not hard-delete normally
→ use CANCELLED / SUPERSEDED / retained history
```

Rationale:

- preserves referential integrity;
- avoids orphaning Runs, Retests, evidence and findings;
- still allows cleanup of accidental/empty Tasks created before execution.

Alternative A:

```text
hard-delete always allowed
```

Benefit:
- simplest user control.

Cost:
- can destroy causal/audit history and orphan references.

Alternative B:

```text
hard-delete never allowed
```

Benefit:
- strongest historical integrity.

Cost:
- unnecessary clutter from accidental/unstarted Tasks.

Mark:
```text
REVIEW_REQUIRED
```

#### 3. CANCELLED vs SUPERSEDED

**Nomination: keep them distinct.**

```text
CANCELLED
= intentionally stopped; no replacement implied

SUPERSEDED
= replaced by newer work/decision
```

Rationale:
- they carry different causal meaning;
- SUPERSEDED supports lineage to replacement work;
- CANCELLED cleanly represents intentional abandonment.

Alternative:

```text
single terminal state: CANCELLED
```

Benefit:
- simpler lifecycle.

Cost:
- loses replacement lineage semantics.

Mark:
```text
REVIEW_REQUIRED
```

Do not freeze the final Task lifecycle until related Run/Review/Test/Evidence domains are detailed, collected and reviewed.
