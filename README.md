# GPT Super Agent

GPT Super Agent is a ChatGPT orchestration/harness design for durable project work using Google Drive as Project memory/control plane and GitHub as source-code truth.

## Current phase

```text
PHASE 1 THEORY       = FIX PASS AFTER PEER REVIEW
PEER REVIEW          = DISPOSITIONED
ACCEPTED FIXES       = APPLIED
PLATFORM PROBES      = PARTIALLY CLASSIFIED / SOME STILL PENDING
CONSISTENCY REVIEW   = IN PROGRESS
PHASE 2              = BLOCKED
```

Phase 2 has intentionally not started.

## Core model

```text
Conversation = interaction UI
Google Drive = durable Project memory/control plane
GitHub = source-code truth
Harness / Skills / Loops = operational behavior
```

Durable hierarchy:

```text
Project → Job → Task → Run
```

Job is a finite objective and may contain multiple role Runs.

## Repository relationships

```text
OWNED = writable within approved scope
REFERENCED = read-only
```

Ownership is recorded structurally. Duplicate ownership claims block write routing until human resolution.

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

One Run has one active role.

Non-independent specialist calls may use child Runs.

Independent Reviewer uses a fresh chat.

Tester practical execution is capability-gated.

## Review model

Normal review placement is topology-driven.

A mandatory independent review floor applies to mechanically sensitive changes such as shared contracts/schema, migrations, auth/security, CI/CD configuration, destructive operations, and material dependency-state changes.

Merge always requires explicit human authorization and a review-coverage summary.

## Project Memory

Drive storage is intentionally simple rather than database-like:

```text
<Project>/
├── PROJECT.md
├── CONTROL.json        # optional/rebuildable cache
├── WORK/
│   ├── jobs/           # Tasks/topology embedded by default
│   └── runs/           # separate append-preserving Runs
├── KNOWLEDGE/
└── VERIFICATION/       # review/evidence/test/retest/goal-recheck records
```

No durable fact may exist only in CONTROL.

Cross-chat consistency is eventual; consequential actions re-check lifecycle/scope/target.

## User-facing naming

Current product handles/command namespaces are aliases only and are **not frozen product identity**.

Natural language remains valid.

Outer control surface remains conceptually:

```text
PROJECT
DIRECT AGENT
HELP / INSTRUCTION
```

Human dispatch additionally requires minimal intents for pending handoffs/status/pause/resume.

## Canonical architecture

The active theory lives in `docs/architecture/`.

Core reading order:

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
11. `IDENTITY-AND-HANDLES-v1.md`
12. `ATTRIBUTION-AND-SCOPE-CLAIMS-v1.md`
13. `CAPABILITY-CATALOG-v1.md`
14. `DISPATCH-AND-HANDOFF-v1.md`
15. `CODER-GOAL-RECHECK-v1.md`
16. `CORE-RECORD-CONTRACTS-v1.md`
17. `THEORY-PROCESS-v1.md`

Specialist UI/design documents remain supporting architecture/methodology references.

## Phase 1 close gate

Before Phase 2:

```text
accepted peer fixes
→ missing contracts
→ platform capability classification/probes
→ consistency review
→ human Phase-1 confirmation
→ Phase 2
```

Do not begin Phase 2 while these gates remain open.
