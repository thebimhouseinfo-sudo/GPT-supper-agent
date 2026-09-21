# GPT Super Agent — Implementation Plan v0.1

## Goal

Build the smallest useful version of the harness that can persist project memory, prepare grounded plans, enforce role boundaries, and coordinate GitHub coding with independent review.

## Phase 0 — Repository foundation

- Establish architecture/spec documents.
- Define JSON schemas for Job, Project Profile, State, Repo Graph, Knowledge Profile, Capability Matrix, Task, Review, and Change Set.
- Define plugin naming and packaging conventions.
- Define tests for harness state transitions.

Exit criterion: architecture and schemas are stable enough to implement without inventing storage semantics during coding.

## Phase 1 — Drive Root, Job Lifecycle & Project Memory

Implement:

- one-time configured Super Agent Google Drive root
- root validation and writeability check
- job create / open / list / update / archive lifecycle
- Drive-folder-driven job list/select/open semantics
- JOB.json marker/metadata validation
- automatic direct Job subfolder creation under <configured-root>/<job-id>
- status-driven Job bootstrap (`bootstrapping` → `active`, failure → `incomplete`)
- duplicate/id conflict handling
- explicit GitHub code-environment model
- attach 1..N GitHub repositories during Job creation
- Project Memory folder/file creation
- Markdown/JSON templates
- Project/repo relationship lookup
- request-driven repo/path relevance resolver
- read/write abstraction for Project Memory
- state versioning and validation

Hard rules:

- Drive contains project memory only, never source code.
- User configures the Super Agent Drive root once; normal Job creation never asks for a new Drive link.
- Every Job defaults to online execution.

Exit criterion: a Job can be created as one direct Drive subfolder without a per-Job Drive link or registry entry, appear in `job list` through folder enumeration + JOB.json validation, reopen Drive-first in another conversation, and use the current request plus Drive context to selectively read the relevant GitHub repo/path.

## Phase 2 — Job Code Environment, Project and Repo Profiling

Implement:

- Job ↔ GitHub code-environment relationship
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

## Phase 4 — Governance, Artifact Lifecycle & Trust

Implement:

- normative vs descriptive truth
- source-of-truth precedence
- artifact id/version/status
- dependency/version pinning
- causal invalidation / STALE propagation
- Plan Readiness Review
- explicit user approval gates
- optimistic concurrency / STATE_CONFLICT
- resume/idempotency
- reviewer evidence independence
- evidence provenance/freshness
- prompt-injection/trust boundaries
- secret handling
- GitHub repository/branch write-scope enforcement

Exit criterion: stale/conflicting artifacts cannot authorize execution and untrusted project content cannot elevate permissions.

## Phase 5 — Clarification & Causal Readiness

Implement:

- known / inferred / unknown classification
- blocking vs non-blocking ambiguity classification
- ask-or-infer rule
- grouped clarification packets
- assumption recording
- causal trace
- STRICT_CLARIFICATION_MODE
- FAST_PATH guardrails
- role-specific gap statuses

Exit criterion: agents stop on materially missing information without over-questioning harmless details.

## Phase 6 — Planner Harness

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
- asset requirements where applicable

For UI/UX work, readiness additionally requires resolved product intent, user flow, screen hierarchy, responsive behavior, interaction states, design-system relationship, asset requirements, UI acceptance criteria, and a feasible UI verification path.

Exit criterion: PROJECT_READY_FOR_IMPLEMENTATION gate can be evaluated deterministically from structured artifacts.

## Phase 7 — Designer Harness

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

## Phase 8 — Coder Harness

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

## Phase 9 — Reviewer Harness

Implement reviewer modes:

1. Plan Readiness Review for substantial changes
2. Design Review Gate when applicable
3. Execution Plan Audit
4. Implementation Review

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

## Phase 10 — GitHub remote execution

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

## Phase 11 — Multi-repo Change Sets

Implement:

- master plan to repo-plan mapping
- coordinated PR tracking
- contract migration order
- cross-repo obligations
- integration review
- Change Set completion gate

Exit criterion: a project like Kid eSchool can change a shared contract without relying on the conversation to remember which repos are affected.

## Phase 12 — Online executor integrations

Extend online execution only where useful, for example:

- richer GitHub CI/workflow evidence
- remote preview deployments
- hosted browser/preview verification when available
- other connected online coding/deployment services

Local filesystem/shell/desktop-runtime execution is intentionally outside the Super Agent core scope. GPTWorker remains a separate offline/local coding agent.

Do not duplicate planning logic in executor-specific integrations.

## Phase 13 — Plugin packaging and UX

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
- Building or owning a local shell/runtime
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

This is sufficient to validate the online architecture before adding richer online executor integrations or more advanced MCP functionality.
