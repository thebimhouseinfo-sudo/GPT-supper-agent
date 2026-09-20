# GPT Super Agent — Implementation Plan v0.1

## Goal

Build the smallest useful version of the harness that can persist project memory, prepare grounded plans, enforce role boundaries, and coordinate GitHub coding with independent review.

## Phase 0 — Repository foundation

- Establish architecture/spec documents.
- Define JSON schemas for Job, Project Profile, State, Repo Graph, Knowledge Profile, Capability Matrix, Task, Review, and Change Set.
- Define plugin naming and packaging conventions.
- Define tests for harness state transitions.

Exit criterion: architecture and schemas are stable enough to implement without inventing storage semantics during coding.

## Phase 1 — Project Memory foundation

Implement:

- Job registry
- one Google Drive folder per Job
- Job bootstrap
- Project Memory folder creation
- Markdown/JSON templates
- Project/repo relationship lookup
- read/write abstraction for Project Memory
- state versioning and validation

Hard rule: Drive contains project memory only, never source code.

Exit criterion: a Job can be created, reopened in another conversation, and its structured state restored.

## Phase 2 — Project and repo profiling

Implement:

- single-repo / multi-repo classification
- repo metadata
- repo graph
- shared contract representation
- project architecture reference
- relevant-context resolution for child repos

Exit criterion: opening a child repo resolves the parent project and loads inherited shared context without duplicating files into every repo.

## Phase 3 — Knowledge and capability system

Implement:

- Knowledge Profile
- Knowledge requirement detection
- domain/platform/engineering knowledge categories
- provenance/freshness metadata
- knowledge-gap representation
- executor registry
- capability matrix
- negative capability knowledge
- session-level capability refresh

Hard rule: unknown capability is unavailable until verified.

Exit criterion: Planner can determine whether a proposed implementation step has enough knowledge and a valid executor.

## Phase 4 — Planner Harness

Implement Planner causal pipeline:

1. intent resolution
2. project classification
3. domain/stack detection
4. knowledge requirements
5. knowledge gap resolution
6. architecture reconstruction
7. dependency/contract analysis
8. capability resolution
9. impact analysis
10. execution design
11. plan compilation
12. plan validation

Planner writes only Project Memory.

Outputs:

- Project Start Package
- project delivery roadmap
- Master Plan where needed
- repo plans
- specialist skill routing record
- acceptance criteria
- verification strategy
- executor assignment
- impact report
- UI/UX Design Package for material user-facing changes
- responsive/interaction specs where applicable
- asset manifest where applicable

For UI/UX work, readiness additionally requires resolved product intent, user flow, screen hierarchy, responsive behavior, interaction states, design-system relationship, asset requirements, UI acceptance criteria, and a feasible UI verification path.

Exit criterion: PROJECT_READY_FOR_IMPLEMENTATION gate can be evaluated deterministically from structured artifacts.

## Phase 5 — Designer Harness

Implement:

- Planner-to-Designer Design Brief
- use-case and target-audience interpretation
- design-skill routing
- Concept Artwork
- selected visual direction
- key-screen concept artifacts where needed
- artwork/icon direction
- concept-derived asset decomposition
- numbered Asset Sheet
- asset specifications
- master style prompt
- per-asset generation prompts
- design QA
- Design Review Gate
- DESIGN_PLANNING_GAP escalation
- design executor/capability routing

Designer writes only to Project Memory / Design Workspace.

Exit criterion: material UI work cannot enter coding until the visual concept is approved and its reusable visual parts have been decomposed into a complete numbered Asset Sheet. Final individual assets do not need to be generated at this stage.

## Phase 6 — Coder Harness

Implement:

- UX Coder specialization
- UI Coder specialization
- UX/UI task ownership in execution plans
- Concept Artwork reading skill for UI Coder
- concept geometry measurement
- normalized layout model
- repeated-value/token inference
- measurement confidence model
- visual fidelity classification: MUST MATCH / INTENT MATCH / IMPLEMENTATION FLEXIBLE
- capability-gated render-and-compare loop
- visual comparison capability resolver (runtime + browser/renderer + screenshot + concept access + visual analysis)
- viewport-based visual QA
- UX/UI joint QA
- visual acceptance status/evidence
- UX_UI_CONFLICT escalation
- context packet pull
- live repo inspection
- detailed execution plan generation
- ephemeral execution checklist
- QA/QC loop
- deviation classification
- PLANNING_GAP escalation
- structured handoff

Coder writes only source repos.

Exit criterion: Coder can work from Planner/Designer material without modifying planning memory; UX Coder can satisfy behavior acceptance; UI Coder can interpret approved Concept Artwork and, only when the capability matrix supports it, demonstrate rendered visual fidelity at target device classes; both can stop correctly on planning/design conflicts.

## Phase 7 — Reviewer Harness

Implement reviewer modes:

1. Design Review Gate when applicable
2. Execution Plan Audit
3. Implementation Review

Execution Plan Audit decides:

- task grouping
- review units
- PR boundaries
- architectural checkpoints
- executor feasibility
- verification feasibility

Implementation Review records:

- critical/important/minor findings
- plan compliance
- architecture/contract compliance
- evidence quality
- cross-repo obligations

Reviewer writes only Project Memory.

Exit criterion: Coder cannot begin before audit approval and cannot complete before independent implementation review.

## Phase 8 — GitHub remote execution

Use GitHub as the first code executor.

Support:

- branch creation
- file changes
- commits
- draft PR
- PR diff inspection
- CI/workflow evidence
- fixes
- formal review
- merge decision

Do not infer shell/local-runtime capabilities from GitHub access.

Exit criterion: a repo with sufficient GitHub Actions can complete a full remote code/review loop.

## Phase 9 — Multi-repo Change Sets

Implement:

- master plan to repo-plan mapping
- coordinated PR tracking
- contract migration order
- cross-repo obligations
- integration review
- Change Set completion gate

Exit criterion: a project like Kid eSchool can change a shared contract without relying on the conversation to remember which repos are affected.

## Phase 10 — Additional executors

Add GPTWorker/local execution after the core harness is stable.

Route tasks by capability:

- local filesystem
- shell
- dev server
- desktop application runtime
- Revit/AutoCAD
- local integration testing

Do not duplicate planning logic in executor-specific code.

## Phase 11 — Plugin packaging and UX

Expose a concise user interaction model, for example:

```text
@SuperAgent job create ...
@SuperAgent job open ...
@SuperAgent status
@SuperAgent plan ...
@SuperAgent continue
@SuperAgent review
```

Natural-language requests remain supported; command grammar is an optional deterministic control surface.

## Initial non-goals

- Storing source code in Google Drive
- Dumping full chat history into Project Memory
- Building a universal shell before harness governance is stable
- Allowing Coder to update project plans directly
- Allowing Reviewer to fix source code
- Assuming one task equals one PR
- Assuming one repo equals one project

## First implementation milestone

The recommended first milestone is:

```text
Job creation
+ Drive Project Memory
+ repo/project profiling
+ Planner Harness
+ capability matrix
+ Designer Harness for UI work
+ Design Review Gate
+ Coder detailed execution plan
+ Reviewer execution-plan audit
+ GitHub source write
+ Reviewer final report
```

This is sufficient to validate the architecture before adding local execution or more advanced MCP functionality.
