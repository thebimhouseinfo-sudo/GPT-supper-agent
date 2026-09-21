# Agent Harnesses v0.1

## Shared clarification rule

Planner, Designer, UX Coder, and UI Coder apply `CLARIFICATION-AND-CAUSAL-READINESS-v0.1.md` before their own stage. They distinguish known facts, evidence-backed inference, blocking unknowns, and harmless implementation details.

## 1. Planner Harness

Planner is responsible for preparing a project or change so that implementation can start safely.

Planner writes only to Google Drive Project Memory.

Planner may read:

- Project Memory
- Knowledge Base
- GitHub source repositories, read-only and scoped to the current request
- platform/tool metadata
- capability information

Planner may not modify source repositories.

Planner owns the broadest clarification pass and resolves blocking product/scope/architecture unknowns before publishing a plan.

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
- product/UX functional specification and Design Brief when the change is user-facing
- responsive and interaction specifications where applicable
- planned asset requirements where applicable

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

Designer is the visual-concept agent for user-facing work.

Designer reads use cases, target audience, UI Tree, Planner requirements, existing visuals, and relevant design skills; then creates Concept Artwork and derives a numbered Asset Sheet with specifications and generation prompts.

Designer writes only to the Project Memory / Design Workspace and never modifies source repositories.

For details, see `DESIGNER-HARNESS-v0.1.md`.

Material UI work may receive an independent Design Review when the Work Map places a checkpoint there. Review placement is determined from the actual phase/task/dependency topology rather than by a universal fixed gate. Designer is not required to generate a complete production asset library.

Designer requests clarification when missing use-case, audience, hierarchy, or visual constraints would materially change the concept.

## 3. Coder Harness

For material user-facing work, Coder is internally split into two specialized execution roles:

```text
UX Coder
+ UI Coder
```

UX Coder owns functional experience, interaction, state, accessibility behavior, and responsive semantics. UX Coder must not invent unresolved product behavior.

UI Coder owns visual implementation and must interpret the approved Concept Artwork, design tokens, and Asset Sheet to achieve the required visual fidelity. Material visual ambiguity becomes a design gap.

See `CODER-UIUX-HARNESS-v0.1.md`.

Coder writes only to the GitHub repositories and branches/PR surfaces explicitly attached to the active Job.

Coder reads approved Project Memory materials but does not edit them.

When Coder needs to report a durable event such as `PLANNING_GAP`, deviation, completion handoff, or verification result, Coder emits a structured role result. Orchestrator is responsible for persisting that result into Project Memory/state when persistence is required. The exact transport/schema is owned by the future `HANDOFF-PROTOCOL-v1`.

### 3.1 Coder flow

```text
RECEIVE ASSIGNED WORK
→ RESOLVE REQUIRED MATERIALS
→ PULL CONTEXT PACKET
→ INSPECT LIVE REPO
→ REFINE IMPLEMENTATION DETAIL
→ FOLLOW WORK MAP / REVIEW TOPOLOGY
→ IMPLEMENT UNTIL NEXT CHECKPOINT
→ SELF QA/QC
→ VERIFY
→ HANDOFF WHEN A SCHEDULED CHECKPOINT IS REACHED
```

Planner decides WHAT, WHY, constraints, architecture, and acceptance.

Coder decides the exact HOW inside those boundaries.

### 3.2 Detailed Execution Plan

Coder translates an approved implementation plan into a concrete execution plan based on live source reality.

For user-facing work, the detailed plan MUST label tasks as UX, UI, or joint UX/UI QA and establish their execution order.

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

The detailed execution information feeds the Work Map / Review Topology. Reviewer may audit it before coding when the selected topology requires that checkpoint; this is not universally hard-coded.

### 3.3 Coder deviation levels

```text
Level 1 — implementation detail
Coder handles directly.

Level 2 — local plan adjustment
Coder handles and reports in handoff.

Level 3 — architecture / contract / scope change
Coder stops affected work and emits PLANNING_GAP.
```

Coder MUST NOT silently expand cross-repo scope or alter shared contracts.

### 3.4 Self QA/QC

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
- For UX work, do flow/state/interaction requirements pass?
- For UI work, does rendered output satisfy approved visual acceptance?

Coder maintains an ephemeral execution checklist for progress and resume. This checklist is not automatically part of durable Project Memory.

## 4. Reviewer Harness

Reviewer reads Project Memory, repo state, diffs, CI/test evidence, and relevant knowledge.

Reviewer writes only to Google Drive Project Memory.

Reviewer does not fix source code.

Reviewer provides reusable review modes rather than a universal fixed gate sequence.

The Work Map / Review Topology decides which review modes are needed and where they occur.

Possible modes include:

1. Plan Readiness Review.
2. Design Review.
3. Detailed Execution Plan Review.
4. Architecture / Contract Review.
5. Implementation / PR Review.
6. Integration Review.
7. Final Job Acceptance.

A simple Job may use only a few checkpoints; a risky multi-repo Job may use many.

Final Job Acceptance is the only universal completion requirement: the current work owner cannot mark the Job complete without independent acceptance.

### 4.1 Plan Readiness Review

Reviewer checks Planner output for requirement completeness, causal consistency, architecture/contract impact, capability feasibility, verification strategy, acceptance criteria, and unresolved assumptions.

### 4.2 Design Review Gate

Reviewer verifies that the concept satisfies Planner requirements and target audience needs, and that the numbered Asset Sheet completely decomposes the visual elements Coder will depend on.

### 4.3 Execution Plan Audit

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

When this review mode is scheduled, the result can approve the detailed execution topology or require restructuring before dependent work continues.

### 4.4 Implementation review

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

The single canonical workflow state list, allowed transitions, blocking branches, pause/resume behavior, and work classification are owned by `STATE-MACHINE-v1.md`.

This document MUST NOT maintain a second workflow state list.

Until `STATE-MACHINE-v1.md` is approved, any state names found in older documents are non-normative.

Orchestrator may update state/governance records but does not write source implementation.
