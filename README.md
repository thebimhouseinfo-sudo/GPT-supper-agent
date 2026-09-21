# GPT Super Agent

GPT Super Agent (GSA) is a ChatGPT orchestration/harness design for durable project work using Google Drive as Project memory/control plane and GitHub as source-code truth.

## Current phase

```text
PHASE 1 INTERNAL THEORY = COMPLETE
CLAUDE PEER REVIEW = PENDING
PHASE 2 = BLOCKED UNTIL PEER REVIEW DISPOSITION
```

Phase 2 has intentionally not started.

## Core model

```text
Conversation = interaction UI
Google Drive = durable Project memory/control plane
GitHub = source-code truth
Harness / Skills / Loops = operational behavior
```

Durable work hierarchy:

```text
Project
→ Job
→ Task
→ Run
```

Current execution is:

```text
pull-based
+ human-dispatched
+ durable-state persistent
```

## Repository relationships

A Project may:

- own 0..N GitHub repositories;
- reference 0..N repositories read-only.

```text
OWNED
= writable within approved Project/Job/Task scope

REFERENCED
= read-only context/dependency/example
```

One repository may have at most one GSA owning Project at a time.

## Roles

```text
Orchestrator
Planner
Designer
Coder
  ├── UX Coder
  └── UI Coder
Reviewer
Tester
```

Review placement is topology-driven. There is no universal Reviewer gate for every PR, Task, milestone, or Job.

## Project Memory

Synthesized Project structure:

```text
<Project>/
├── PROJECT.md
├── CONTROL.json
├── WORK/
│   ├── jobs/
│   ├── tasks/
│   ├── runs/
│   └── handoffs/
├── KNOWLEDGE/
│   ├── architecture/
│   ├── decisions/
│   ├── contracts/
│   ├── plans/
│   └── design/
└── ARTIFACTS/
    ├── reviews/
    ├── evidence/
    ├── retests/
    ├── assets/
    ├── approvals/
    └── releases/
```

`CONTROL.json` is a rebuildable materialized current-state view, not historical truth.

## User-facing identity

```text
Plugin handle:     @gsa
Command namespace: gsa/
```

Natural language remains valid.

Outer control surface:

```text
PROJECT
- new
- open
- status
- delete

DIRECT AGENT
- Planner
- Designer
- Coder
- Reviewer

HELP / INSTRUCTION
```

## Canonical architecture

The active theory lives in `docs/architecture/`.

Recommended reading order:

1. `FROZEN-FOUNDATION-v0.1.md`
2. `ARCHITECTURE-v0.1.md`
3. `SYSTEM-DEFINITION-SKELETON-v0.1.md`
4. `PROJECT-MEMORY-v0.1.md`
5. `JOB-LIFECYCLE-v0.1.md`
6. `STATE-MACHINE-v1.md`
7. `GOVERNANCE-AND-ARTIFACT-LIFECYCLE-v0.1.md`
8. `SECURITY-AND-TRUST-BOUNDARIES-v0.1.md`
9. `AGENT-HARNESSES-v0.1.md`
10. `EXECUTION-AND-REVIEW-v0.1.md`
11. `PLANNER-SCOPE-AND-UIUX-v0.1.md`
12. `DESIGNER-HARNESS-v0.1.md`
13. `CODER-UIUX-HARNESS-v0.1.md`
14. `CLARIFICATION-AND-CAUSAL-READINESS-v0.1.md`
15. `UI-SPEC-MODEL-v0.1.md`
16. `CONCEPT-MEASUREMENT-NORMALIZATION-v0.1.md`

## Final review gate

Internal theory completion is documented in:

`docs/working-notes/FINAL-THEORY-COMPLETENESS-REVIEW.md`

The next required step is independent Claude peer review using:

`docs/working-notes/CLAUDE-PEER-REVIEW-HANDOFF.md`

Peer findings are advisory evidence and must be dispositioned before Phase 2:

```text
ACCEPT
ACCEPT_WITH_MODIFICATION
REJECT_WITH_REASON
DEFER_TO_PHASE_2_CALIBRATION
```

## Phase 2 boundary

After peer review and final reconciliation, Phase 2 should begin as a thin operational harness:

```text
role instructions/contracts
→ specialist skills
→ Drive/GitHub actions
→ state/persistence helpers
→ fake CLI/control UX
→ pilot Project
→ calibration
```

Do not begin by building a heavyweight autonomous orchestration server.
