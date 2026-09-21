# GPT Super Agent — Architecture v0.1

## 1. Purpose

GPT Super Agent is a coding-agent harness for ChatGPT. Its purpose is not merely to add coding skills. It provides persistent project state, grounded planning, execution routing, multi-repository awareness, agent separation, QA/QC, and review governance.

The system must continue to understand a project across new chats, model changes, context compaction, and long-running multi-repository development.

## 2. Sources of truth

The system separates four concerns:

```text
GitHub / approved local workspace
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

Every new Job MUST have a dedicated Project Memory root on Google Drive before implementation work starts.

Invariant:

> NO JOB WITHOUT A MEMORY ROOT.

A Job may represent a single repo or a multi-repo software project.

Example:

```text
CodeAgent/
  jobs/
    kid-eschool/
    revit-mep-tools/
    cad-mcp/
```

## 5. Multi-repo model

A multi-repo project is treated as one project with many repositories, not as unrelated repositories.

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

When an agent opens a child repository, context resolution MUST first determine whether the repo belongs to a known project. If it does, project-level context is loaded before repo-local context.

Required load order:

```text
PROJECT
-> ARCHITECTURE
-> REPO GRAPH
-> RELEVANT CONTRACTS
-> RELEVANT DECISIONS
-> REPO METADATA
-> LIVE SOURCE CODE
-> CURRENT TASK
```

## 6. Change propagation

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

## 7. Master plan and repo plans

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

## 8. Agent write boundaries

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
  Repo: write

Reviewer
  Drive: write
  Repo: read-only

Orchestrator
  Drive state: write
  Repo: no write
```

This prevents one role from defining the rule, implementing the rule, and grading itself.

## 9. Clarification and causal readiness

Before planning, design, or implementation, each role applies `CLARIFICATION-AND-CAUSAL-READINESS-v0.1.md`. Blocking unknowns are resolved before the downstream stage; safe non-blocking assumptions may be inferred and recorded.

## 10. Project readiness gate

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
  AND design package approved when required
  AND verification strategy prepared
  AND acceptance criteria prepared
```

## 11. Core invariants

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
