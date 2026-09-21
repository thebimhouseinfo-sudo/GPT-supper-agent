# Execution, PR, and Review Model v0.1

## 1. Work decomposition and delivery units

Super Agent separates **work decomposition** from **review/delivery packaging**.

Work decomposition:

```text
Job
└── Phase
    └── Task
        └── optional subtask/detail step
```

### Job

The durable work entity selected from Drive.

### Phase

A coherent stage of the Job with a meaningful objective, dependency position, or delivery boundary.

### Task

The smallest planned unit that is assigned to an owner and has a concrete output/acceptance target.

The Planner may define phases and initial tasks. Coder may refine implementation detail after inspecting live source, without silently changing approved scope/architecture.

Delivery/review packaging is a separate layer:

```text
Tasks
→ may be grouped into Review Units
→ may be packaged into Pull Requests
→ may participate in a Change Set
```

### Review Unit

A dynamically chosen group of work for which independent review is meaningful.

A Review Unit is NOT required to equal one Task, one Phase, or one PR.

### Pull Request

A GitHub delivery unit that should be understandable, verifiable, and reversible as a coherent change.

### Change Set

A coordinated project-level change that may span multiple PRs and repositories.

## 2. Work Map and dynamic Review Topology

Review placement is NOT hard-coded into the hierarchy.

The system first needs enough execution structure:

```text
approved intent / plan
→ phases
→ task list
→ dependencies / owners / outputs
→ live-repo implementation detail where needed
```

Only then can the system compile a Work Map / Review Topology showing where independent review adds value.

Conceptual example:

```text
Phase | Task | Owner | Depends on | Output | Review checkpoint | Reviewer mode
------|------|-------|------------|--------|-------------------|--------------
P1    | T1   | Coder | Plan       | API    | YES               | architecture/code
P1    | T2   | Coder | T1         | tests  | NO                | -
P1    | T3   | Coder | T1,T2      | impl   | YES               | implementation
P2    | T4   | UI    | concept    | UI     | YES               | UX/UI
...
FINAL | -    | -     | all needed | Job    | YES               | final acceptance
```

The exact schema/owner of this table is defined later by the Orchestrator/Reviewer contracts.

Core rule:

> REVIEW IS PLACED WHERE IT IS USEFUL, NOT WHERE THE HIERARCHY HAPPENS TO HAVE A NODE.

Therefore:

- not every Task requires independent review;
- not every Phase requires independent review;
- several Tasks may be completed before one review checkpoint;
- one critical Task may justify its own checkpoint;
- a checkpoint may be inserted before downstream work depends on a risky result;
- review density may change after new risk or dependency information appears.

## 3. Review checkpoint selection

Review checkpoints should be selected from actual work topology.

Typical reasons to insert one include:

- downstream tasks depend strongly on the result;
- architecture/API/contract/schema is being fixed;
- migration or irreversible change is about to propagate;
- a high-risk or high-uncertainty decision is reached;
- a meaningful Review Unit/PR is ready;
- UI/UX output needs independent visual/behavioral judgment;
- cross-repo integration is about to begin;
- evidence is incomplete or confidence is low;
- user approval is required;
- the Job is about to be marked complete.

This list guides placement; it is not a fixed gate sequence.

The Work Map may be revised if execution reveals new dependencies or risks.

## 4. Review loops and failure routing

Where a review checkpoint exists, the loop is:

```text
OWNER WORKS
→ checkpoint reached
→ Reviewer checks output + evidence
   ├── PASS → continue according to Work Map
   ├── CHANGES_REQUIRED → return to the lowest owning work item
   └── ESCALATE → reopen the appropriate upstream planning/design level
```

Examples:

```text
implementation defect
→ affected Task / Task group

detailed execution-plan defect
→ Coder planning/detail level

design defect
→ Designer / design definition

architecture / contract / scope defect
→ PLANNING_GAP
→ Planner

cross-repo integration defect
→ affected repo/Change Set work
```

Reviewer evaluates and routes. Reviewer does not repair the owner's work.

A failed checkpoint may invalidate downstream work that depended on the rejected result.

## 5. Final Job acceptance

Intermediate review placement is dynamic.

Job closure is different: a Job MUST NOT be marked complete merely because the current owner says the work is finished.

Before closing the Job, there must be an independent final acceptance step performed by the appropriate reviewer mode(s) selected from the actual Job topology.

Final acceptance checks whether:

- required phases/tasks are complete;
- required earlier review checkpoints passed;
- unresolved blocking findings remain;
- fresh evidence supports completion;
- cross-repo obligations are satisfied where applicable;
- the requested outcome is actually delivered.

Result:

```text
JOB_ACCEPTED
→ Job may be marked complete / archived when appropriate
→ user may move to another Job

JOB_CHANGES_REQUIRED
→ identify the lowest affected work level
→ reopen that work
→ continue through the relevant loop
```

The final review may reuse valid earlier evidence; it does not imply re-reviewing every Task.

## 6. PR boundary rules

Do not use a hard rule such as one Task equals one PR.

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

## 7. Multi-repo changes

A multi-repo change is represented as one coordinated Change Set with repository-specific work/PRs when appropriate.

Example:

```text
PROFILE-V4 Change Set
  +-- Hub work / PR
  +-- Math work / PR
  +-- English work / PR
  +-- Typing work / PR
```

Project Memory tracks coordination and integration state.

A repo-level pass does not automatically imply Change Set or Job acceptance.

Review checkpoints for multi-repo work are placed from dependency and integration topology, not from a fixed number of gates.

## 8. Review modes

Reviewer has reusable review modes. These are **capabilities/types of review**, not mandatory positions in every workflow.

Possible modes include:

- Plan Readiness Review
- Design Review
- Detailed Execution Plan Review
- Architecture / Contract Review
- Implementation Review
- PR-Ready Review
- Integration / Change Set Review
- Final Job Acceptance

The Work Map decides which modes are used and where.

A simple Job may use few checkpoints.

A risky multi-repo Job may use many.

## 9. GitHub connector as executor

When the repository has meaningful CI, GitHub can support a strong remote workflow:

```text
create branch
→ edit source
→ commit
→ open draft PR
→ CI
→ inspect evidence
→ fix
→ review when scheduled
→ merge when authorized
```

GitHub repository write capability does not imply local shell, localhost, desktop application, Revit, AutoCAD, or local filesystem capability.

Super Agent is online-first. If a task requires a local-only runtime, the work topology records `LOCAL_EXECUTION_REQUIRED` / `CAPABILITY_BLOCKED` rather than pretending the runtime exists.

GPTWorker remains a separate offline/local coding agent.

## 10. Draft PR model

A Draft PR can be opened once useful code/diff exists.

It can provide:

- stable diff surface
- CI anchor
- change identity
- review history

Opening a Draft PR does not automatically trigger review. Review occurs at checkpoints selected by the Work Map.

## 11. Capability-aware execution

Each executable work item declares required capabilities.

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

Planner/Orchestrator/Reviewer must block or rescope work when no configured online executor can provide a required capability.

## 12. Completion evidence

No Task, Phase, PR, Change Set, or Job is complete merely because code was written.

Evidence may include:

- targeted tests
- applicable test suite
- lint/type/build
- CI status
- original bug reproduction
- diff inspection
- acceptance checklist
- contract checks
- UI/UX evidence
- cross-repo integration checks
- user-supplied verification where automated verification is unavailable

Completion claims must rely on fresh evidence appropriate to the selected review topology.
