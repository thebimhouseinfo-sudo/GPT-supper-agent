# GPT Super Agent

A persistent coding-agent harness for ChatGPT.

The project turns ChatGPT from a conversation-driven coding assistant into an orchestrated software-development system with durable project memory, explicit agent roles, knowledge preparation, capability-aware planning, execution QA/QC, and independent review.

## Core model

```text
ChatGPT
   |
Orchestrator
   |
   +-- Planner  -> prepares project/specs; writes Project Memory
   +-- Designer -> creates visual concepts + crop-ready asset sheet; writes Design Workspace
   +-- Coder
   |   +-- UX Coder -> behavior/flow/state
   |   +-- UI Coder -> visual implementation/fidelity
   |   -> writes source repositories only
   +-- Reviewer -> audits design/plan/code; writes Project Memory
```

Each Job is a durable work entity stored in Google Drive. Its code environment is GitHub and may contain one or more repositories. Source code never moves into Drive. Super Agent is designed primarily for online coding/orchestration.

## Core entity model

```text
Job
= durable work state in Google Drive

Code Environment
= one or more GitHub repositories attached to the Job

Project
= logical product/system context inferred or recorded for planning
```

**Job ≠ Repo.** A Job may use one repo or many repos.

Drive is redundant for some single-repo Jobs because GitHub could technically store most planning/state artifacts there. Super Agent still keeps Drive as the canonical Job root so the same Job model continues to work unchanged when the project becomes multi-repo.

## Invocation

The user-facing identity is intentionally short and independent of the repository name:

```text
Plugin handle:     @gsa
Command namespace: gsa/
```

Examples:

```text
@gsa
gsa/job list
gsa/job create ...
gsa/status
```

The GitHub repository name is an implementation detail and may be renamed later without changing the user-facing command contract.

## Design principles

- Conversation is UI, not memory.
- **Drive first, GitHub second:** selecting/opening a Job always loads its Drive memory before deciding which repo/path to inspect.
- **No Job registry:** `job list` enumerates the Drive root's direct Job subfolders and reads each folder's `JOB.md`. `JOB.md` uses YAML front matter for machine-readable metadata and Markdown body for humans/agents.
- Super Agent is configured once with one Google Drive root; each Job is one direct subfolder of that root.
- Shared project knowledge lives once at project level; repositories reference it instead of duplicating it.
- Planner prepares all material reasonably knowable before implementation begins.
- Planner plans only work that has a known executor and verified capabilities.
- Coder pulls approved materials, details the execution plan, self-QA/QCs continuously, and writes only to the repo.
- Reviewer audits the detailed execution plan before coding and independently reviews implementation afterward.
- Multi-repo changes begin with a master plan, not independent repo-local plans.
- No agent may claim an action that its active executor cannot physically perform.

## Definition and release model

The architecture should define the full conceptual model before implementation versions are scoped.

```text
complete concepts
→ resolve contradictions
→ make rules testable
→ classify HARD / SOFT / UNKNOWN
→ choose implementation scope for v1
→ run real Jobs
→ inspect product quality
→ tighten harness
→ choose/adjust v2, v3 ...
```

"Fully defined" does not mean "fully implemented in v1".

A concept may be completely specified while its implementation is assigned to a later version.

The harness is then tightened iteratively from real output quality:

```text
real run
→ observable defect
→ identify owning concept/rule
→ strengthen prompt/gate/enforcement/eval
→ rerun
```

Release scope is decided after conceptual dependencies are understood, not by leaving concepts undefined.

## Architecture documents

- [Frozen Foundation v0.1](docs/architecture/FROZEN-FOUNDATION-v0.1.md)
- [System Definition Skeleton v0.1](docs/architecture/SYSTEM-DEFINITION-SKELETON-v0.1.md)
- [Architecture v0.1](docs/architecture/ARCHITECTURE-v0.1.md)
- [Clarification & Causal Readiness](docs/architecture/CLARIFICATION-AND-CAUSAL-READINESS-v0.1.md)
- [Governance & Artifact Lifecycle](docs/architecture/GOVERNANCE-AND-ARTIFACT-LIFECYCLE-v0.1.md)
- [Security & Trust Boundaries](docs/architecture/SECURITY-AND-TRUST-BOUNDARIES-v0.1.md)
- [Project Memory & Knowledge](docs/architecture/PROJECT-MEMORY-v0.1.md)
- [Job Lifecycle & Drive Root](docs/architecture/JOB-LIFECYCLE-v0.1.md)
- [Agent Harnesses](docs/architecture/AGENT-HARNESSES-v0.1.md)
- [Planner Scope, Skill Routing & UI/UX](docs/architecture/PLANNER-SCOPE-AND-UIUX-v0.1.md)
- [UI Specification Model](docs/architecture/UI-SPEC-MODEL-v0.1.md)
- [Designer Harness](docs/architecture/DESIGNER-HARNESS-v0.1.md)
- [Coder UI/UX Harness](docs/architecture/CODER-UIUX-HARNESS-v0.1.md)
- [Concept Measurement & UI Normalization](docs/architecture/CONCEPT-MEASUREMENT-NORMALIZATION-v0.1.md)
- [Execution & Review Model](docs/architecture/EXECUTION-AND-REVIEW-v0.1.md)
- [Implementation Plan v0.1](docs/plans/IMPLEMENTATION-PLAN-v0.1.md)

## Status

Current phase: foundation frozen; remaining behavioral modules are being defined against the System Definition Skeleton.

The first implementation should focus on durable Project Memory, Planner Harness, agent write boundaries, capability resolution, and execution/review gates before adding more advanced executors or MCP features.
