# Agent Harnesses v0.1

## 1. Planner Harness

Planner is responsible for preparing a project or change so that implementation can start safely.

Planner writes only to Google Drive Project Memory.

Planner may read:

- Project Memory
- Knowledge Base
- source repositories
- platform/tool metadata
- capability information

Planner may not modify source repositories.

### 1.1 Planner causal pipeline

```text
P0 Intent Resolution
P1 Project Classification
P2 Domain & Technology Detection
P3 Knowledge Requirements
P4 Knowledge Gap Resolution
P5 Architecture Reconstruction
P6 Dependency / Contract Analysis
P7 Tool & Capability Resolution
P8 Impact Analysis
P9 Execution Design
P10 Plan Compilation
P11 Plan Validation
```

The stages are causal. Missing upstream knowledge reduces or blocks downstream certainty.

Example:

```text
missing Revit 2026 API knowledge
  -> architecture assumptions unresolved
  -> verification design unresolved
  -> final implementation plan cannot be published
```

### 1.2 Planner responsibilities

Planner MUST prepare material that was reasonably knowable before implementation, including:

- project profile
- domain and platform knowledge requirements
- architecture
- repo graph
- shared contracts
- relevant decisions
- master plan when multi-repo
- repo-level plans
- acceptance criteria
- verification strategy
- executor assignment
- capability feasibility
- implementation ordering
- known risks and constraints
- project delivery roadmap
- required specialist skill routing
- product/UX/UI design package when the change is user-facing
- responsive and interaction specifications where applicable
- planned asset manifest where applicable

For user-facing work, Planner owns design readiness. See `PLANNER-SCOPE-AND-UIUX-v0.1.md`.

Principle:

> Coder should never be the first agent to discover information that was reasonably knowable before implementation began.

### 1.3 Planning evidence

Every planning decision should have:

- upstream evidence
- causal explanation
- downstream consequences

No unexplained architectural decisions.
No execution step without an executor.
No untracked dependency impact.
No material UI/UX decision deferred to Coder when it could be resolved during planning.

## 2. Designer Harness

Designer is the visual-production agent for user-facing work.

Designer reads approved Planner materials and existing product visuals, then creates visual concepts, art direction, key screen concepts, asset inventories, production-ready assets, and asset sheets.

Designer writes only to the Project Memory / Design Workspace and never modifies source repositories.

For details, see `DESIGNER-HARNESS-v0.1.md`.

Material UI work requires an independent Design Review Gate before Coder implementation begins.

## 3. Coder Harness

Coder writes only to the source repository or approved local source workspace.

Coder reads approved Project Memory materials but does not edit them.

### 4.1 Coder flow

```text
RECEIVE TASK
-> RESOLVE REQUIRED MATERIALS
-> PULL CONTEXT PACKET
-> INSPECT LIVE REPO
-> DETAIL EXECUTION PLAN
-> WAIT FOR EXEC PLAN AUDIT
-> IMPLEMENT
-> SELF QA/QC
-> UPDATE LOCAL CHECKLIST
-> VERIFY
-> HANDOFF TO REVIEWER
```

Planner decides WHAT, WHY, constraints, architecture, and acceptance.

Coder decides the exact HOW inside those boundaries.

### 4.2 Detailed Execution Plan

Coder translates an approved implementation plan into a concrete execution plan based on live source reality.

Typical steps include:

- locate actual implementation points
- identify tests
- create regression tests
- verify failing condition
- implement minimum change
- verify targeted checks
- migrate local consumers
- clean legacy path if approved
- run broader checks
- inspect diff
- verify acceptance criteria

This detailed plan is audited by Reviewer before source modifications begin.

### 4.3 Coder deviation levels

```text
Level 1 — implementation detail
Coder handles directly.

Level 2 — local plan adjustment
Coder handles and reports in handoff.

Level 3 — architecture / contract / scope change
Coder stops affected work and emits PLANNING_GAP.
```

Coder MUST NOT silently expand cross-repo scope or alter shared contracts.

### 4.4 Self QA/QC

Coder performs continuous checks, not only end-of-task verification.

QA asks:

- Did execution follow approved plan?
- Is scope still correct?
- Are required process rules followed?
- Were unrelated changes introduced?

QC asks:

- Does the implementation work?
- Do relevant tests/build/type/lint pass?
- Are contracts preserved?
- Are acceptance criteria satisfied?
- Were regressions introduced?

Coder maintains an ephemeral execution checklist for progress and resume. This checklist is not automatically part of durable Project Memory.

## 4. Reviewer Harness

Reviewer reads Project Memory, repo state, diffs, CI/test evidence, and relevant knowledge.

Reviewer writes only to Google Drive Project Memory.

Reviewer does not fix source code.

Reviewer has three distinct jobs when UI/design work is involved:

1. Design Review Gate after Designer.
2. Execution Plan Audit before coding.
3. Implementation Review after coding.

For non-visual work, the Design Review Gate is skipped.

### 4.1 Design Review Gate

Reviewer verifies that Designer outputs satisfy Planner requirements, that asset coverage is complete, and that unresolved visual decisions are not pushed onto Coder.

### 4.2 Execution Plan Audit

Reviewer checks:

- task size
- dependency order
- PR boundaries
- review checkpoints
- cross-repo impact
- capability feasibility
- verification feasibility
- missing evidence
- unnecessary scope

The result can approve the plan or require restructuring before coding begins.

### 4.3 Implementation review

Reviewer evaluates:

- plan compliance
- architecture compliance
- contract compatibility
- code quality
- QA/QC evidence
- test/build/CI evidence
- scope integrity
- completion claims
- cross-repo obligations

Reviewer records findings in durable Project Memory.

## 5. Orchestrator

Orchestrator owns workflow state, not technical implementation.

Typical states:

```text
IDLE
-> PREPARING
-> READY_TO_IMPLEMENT
-> EXEC_PLAN_AUDIT
-> IMPLEMENTING
-> READY_FOR_REVIEW
-> CHANGES_REQUIRED
-> IMPLEMENTING
-> APPROVED
-> DONE
```

Orchestrator may update state files but does not write source code or technical plans.
