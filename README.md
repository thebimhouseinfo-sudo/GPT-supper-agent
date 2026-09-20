# GPT Super Agent

A persistent coding-agent harness for ChatGPT.

The project turns ChatGPT from a conversation-driven coding assistant into an orchestrated software-development system with durable project memory, explicit agent roles, knowledge preparation, capability-aware planning, execution QA/QC, and independent review.

## Core model

```text
ChatGPT
   |
Orchestrator
   |
   +-- Planner  -> writes Project Memory only
   +-- Coder    -> writes source repositories only
   +-- Reviewer -> writes Project Memory only
```

Source code remains in GitHub or an approved local workspace. Google Drive is used as durable Project Memory and does not contain source code.

## Design principles

- Conversation is UI, not memory.
- Each Job owns a separate Google Drive Project Memory folder.
- Shared project knowledge lives once at project level; repositories reference it instead of duplicating it.
- Planner prepares all material reasonably knowable before implementation begins.
- Planner plans only work that has a known executor and verified capabilities.
- Coder pulls approved materials, details the execution plan, self-QA/QCs continuously, and writes only to the repo.
- Reviewer audits the detailed execution plan before coding and independently reviews implementation afterward.
- Multi-repo changes begin with a master plan, not independent repo-local plans.
- No agent may claim an action that its active executor cannot physically perform.

## Architecture documents

- [Architecture v0.1](docs/architecture/ARCHITECTURE-v0.1.md)
- [Project Memory & Knowledge](docs/architecture/PROJECT-MEMORY-v0.1.md)
- [Agent Harnesses](docs/architecture/AGENT-HARNESSES-v0.1.md)
- [Execution & Review Model](docs/architecture/EXECUTION-AND-REVIEW-v0.1.md)
- [Implementation Plan v0.1](docs/plans/IMPLEMENTATION-PLAN-v0.1.md)

## Status

Current phase: architecture/specification.

The first implementation should focus on durable Project Memory, Planner Harness, agent write boundaries, capability resolution, and execution/review gates before adding more advanced executors or MCP features.
