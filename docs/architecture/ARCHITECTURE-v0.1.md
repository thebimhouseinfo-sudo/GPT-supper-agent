# GPT Super Agent — Architecture v0.1

## 0. Foundation status

The foundational Job/Drive/GitHub/product-boundary decisions are frozen in `FROZEN-FOUNDATION-v0.1.md`.

All remaining theory work should be tracked through `SYSTEM-DEFINITION-SKELETON-v0.1.md`.

A later module must not silently redefine a frozen foundation invariant.


## 1. Purpose

GPT Super Agent is a coding-agent harness for ChatGPT. Its purpose is not merely to add coding skills. It provides persistent project state, grounded planning, execution routing, multi-repository awareness, agent separation, QA/QC, and review governance.

The system must continue to understand a project across new chats, model changes, context compaction, and long-running multi-repository development.

## 2. Sources of truth

The system separates four concerns:

```text
GitHub
= source-code truth

Google Drive Project Memory
= durable project-state truth

Knowledge Base
= reusable engineering/platform/domain knowledge

Plugin / Harness
= workflow, role, capability, and quality-gate truth
```

Chat history is not a source of truth. It is an interaction surface.

## 3. Top-level architecture

```text
                         ChatGPT
                            |
                      Orchestrator
                            |
          +-----------------+-----------------+
          |                                   |
   Knowledge Base                      Project Memory
          |                                   |
          +-----------------+-----------------+
                            |
                         Planner
                            |
                  Implementation Plan
                            |
                         Designer
                    (when UI/visual)
                            |
                    Design Review Gate
                            |
                           Coder
                     ┌──────┴──────┐
                  UX Coder      UI Coder
                     └──────┬──────┘
                            |
                Detailed Execution Plan
                            |
                         Reviewer
                   Execution Plan Audit
                            |
                           Coder
                     Implementation
                    Self QA/QC loop
                            |
                         Reviewer
               PR / integration review
                            |
                           DONE
```

## 4. Job model

Super Agent is configured once with a Google Drive root. Every new Job automatically receives one dedicated direct subfolder under `<configured-root>/<job-id>/`, identified by a `JOB.md` file, before project work starts.

Invariant:

> NO JOB WITHOUT AN AUTO-CREATED MEMORY ROOT.

A Job is a durable work entity stored in its Google Drive Job folder. It is separate from its code environment.

Each Job references a GitHub code environment containing one or more repositories. A Job is therefore not identical to a repo and does not have to equal the logical Project context inferred by Planner.

The Drive folder tree is the Job index; no registry file is required. `JOB.md` is the Job marker and human-readable entry point; structured runtime state remains in JSON files where appropriate. The user does not provide a new Drive link per Job. See `JOB-LIFECYCLE-v0.1.md` for creation/open/list/update/archive flow.

Example:

```text
<configured Super Agent Drive root>/
  kid-eschool/
  revit-mep-tools/
  cad-mcp/
```

## 5. Code environment and multi-repo model

Each Job has an explicit code environment:

```text
Job (Drive)
  ↓ references
Code Environment (GitHub)
  ├── Repo A
  ├── Repo B
  └── ...
```

When the code environment contains multiple related repositories, they are treated as one coordinated project context rather than unrelated repositories.

Shared architecture, contracts, decisions, and master plans live at project level.

Repositories reference project-level knowledge rather than duplicating it.

Example:

```text
Kid eSchool
  |
  +-- Project Architecture
  +-- Repo Graph
  +-- Shared Contracts
  +-- Project Decisions
  +-- Master Plans
  |
  +-- Kideschool
  +-- KE-Math-Grade1
  +-- Ke-kidenglish
  +-- Ke-typing
  +-- ...
```

When a Job is selected/opened, context resolution MUST begin from its Drive memory. Drive determines the relevant project/repo relationships before live GitHub source is read.

A repository is never the entry point for an existing Job; the Job in Drive is.

Required load order:

```text
JOB (Drive)
-> STATE
-> PROJECT PROFILE
-> ARCHITECTURE
-> REPO GRAPH
-> RELEVANT CONTRACTS / DECISIONS / PLANS / TASKS
-> CURRENT USER REQUEST
-> RELEVANT REPO(S)
-> RELEVANT SOURCE AREA(S)
-> SELECTIVE LIVE GITHUB EVIDENCE
```

## 6. Why Drive exists above GitHub

For a single-repo Job, GitHub can technically store much of the same planning material inside that repository:

```text
repo/
├── docs/
├── plans/
├── decisions/
└── ...
```

In that narrow case, GitHub can cover most of the persistence role that Drive provides.

However, Super Agent intentionally keeps the Job in Drive for two reasons:

1. one uniform Job lifecycle regardless of whether the code environment has one repo or many;
2. a Job can later expand from one repo to multiple repos without migrating its control state out of a source repository.

For multi-repo work, Drive becomes the cross-repository control plane:

```text
                    Job (Drive)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     Repo A           Repo B           Repo C
     GitHub           GitHub           GitHub
```

Drive owns the project-wide material that has no natural canonical home in any one code repository:

- master architecture
- repo graph
- shared contracts
- cross-repo decisions
- master plans
- change-set state
- design concepts
- asset sheets
- project-level reviews
- approvals
- cross-repo obligations

GitHub may provide cross-repository work-tracking mechanisms, but these do not replace the Job's durable project-memory/control-plane role.

Therefore:

```text
Single repo:
GitHub can technically cover most persistence,
but Drive remains the canonical Job root for consistency.

Multi repo:
Drive is the canonical cross-repo coordination/memory layer.
```

## 7. Change propagation

A change to a shared contract or provider must trigger impact analysis.

Example:

```text
child-profile changed
  -> provider identified
  -> all consumers identified
  -> affected repos identified
  -> single-repo plan may become invalid
  -> master change set required
```

The system MUST track downstream obligations rather than relying on chat memory.

## 8. Master plan and repo plans

Cross-repo work begins with a Master Plan.

```text
Master Plan
  +-- repo plan: Hub
  +-- repo plan: Math
  +-- repo plan: English
  +-- repo plan: Typing
  +-- integration verification
```

A repo-level plan MUST declare its parent master plan when one exists.

## 9. Agent write boundaries

Write permissions are architectural boundaries, not prompt suggestions.

```text
Planner
  Drive: write
  Repo: read-only

Designer
  Drive Design Workspace: write
  Repo: read-only

Coder
  Drive: read-only
  GitHub repo: write

Reviewer
  Drive: write
  Repo: read-only

Orchestrator
  Drive state: write
  Repo: no write
```

This prevents one role from defining the rule, implementing the rule, and grading itself.

## 10. Governance, lifecycle, and trust

Artifact authority, versioning, invalidation, approvals, concurrency, and trust boundaries are defined in `GOVERNANCE-AND-ARTIFACT-LIFECYCLE-v0.1.md` and `SECURITY-AND-TRUST-BOUNDARIES-v0.1.md`.

## 11. Clarification and causal readiness

Before planning, design, or implementation, each role applies `CLARIFICATION-AND-CAUSAL-READINESS-v0.1.md`. Blocking unknowns are resolved before the downstream stage; safe non-blocking assumptions may be inferred and recorded.

## 12. Project readiness gate

Coder MUST NOT start until the project or change is ready for implementation.

```text
PROJECT_READY_FOR_IMPLEMENTATION =
  knowledge sufficient
  AND architecture understood
  AND repo graph resolved
  AND contracts identified
  AND capabilities resolved
  AND executors assigned
  AND impact analysis complete
  AND implementation plan prepared
  AND design concept + asset sheet approved when required
  AND verification strategy prepared
  AND acceptance criteria prepared
```

## 13. Core invariants

1. Conversation is UI, not memory.
2. Shared project knowledge lives once at project level.
3. Planner must prepare all reasonably knowable implementation material before coding starts.
4. Unknown capability is unavailable until verified.
5. Every executable plan step must have a known executor.
6. Coder may not silently expand architecture, contract, or project scope.
7. Reviewer independently audits execution topology before code is written.
8. A repository passing its own checks does not imply a multi-repo change set is complete.
9. No completion claim without fresh evidence.
10. No agent may claim an action its active executor cannot physically perform.
11. For material UI work, Coder may not begin before required Designer outputs pass Design Review.
12. User-facing coding separates UX behavior from UI visual implementation while preserving one coordinated execution plan.
13. UI Coder must interpret approved Concept Artwork; autonomous render-and-compare is permitted only when the capability matrix confirms runtime/URL, browser or renderer, screenshot capture, concept access, and visual analysis.
14. Plugin presence alone never implies render capability. Missing visual-verification capabilities must be reported explicitly rather than assumed to pass.
15. Existing Job context is always Drive-first; GitHub source reads are selected from Drive state plus current request.
16. Job list is sourced by enumerating direct Job subfolders in the configured Drive root, not from a registry file and not from GitHub.


## 14. Online-first execution boundary

Super Agent is primarily an online coding agent.

Core execution targets are GitHub repository operations, remote CI/workflows, PRs, and connected online preview/deployment evidence.

Local filesystem editing, local shell/dev-server ownership, and desktop application runtimes are not part of the Super Agent core execution model.

GPTWorker is a separate offline/local coding agent and is not treated as a built-in Super Agent executor.

If a task fundamentally requires local-only execution, Super Agent records the verification/execution limitation instead of pretending to own that runtime.
