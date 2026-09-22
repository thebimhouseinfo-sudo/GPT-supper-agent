# GPT Super Agent

GPT Super Agent is a ChatGPT orchestration/harness design for durable project work using Google Drive as Project memory/control plane and GitHub as source-code truth.

## Current phase

```text
PHASE 1 THEORY       = ROUND-2 FIX PASS COMPLETE
CLAUDE ROUND 1       = DISPOSITIONED/FIXED
CLAUDE ROUND 2       = COMPLETE; FINDINGS ACCEPTED/FIXED
MUST PLATFORM PROBES = COMPLETE
FINAL CONSISTENCY    = PENDING
PHASE 2              = BLOCKED UNTIL FINAL CONSISTENCY REVIEW
```

## Core model

```text
Conversation = UI
Google Drive = durable Project memory/control plane
GitHub = source-code truth
Harness / Skills / Loops = operational behavior
```

```text
Project → Job → Task → Run
```

## Concurrency model

```text
stable Job planning/control record
+ append-preserving Run/Verification records
+ read-time joins
+ minimal shared mutation
+ consequential-action recheck
```

Completing Runs do not append progress/reference arrays into parent Job.

## Review model

Normal review is topology-driven.

Mechanically sensitive changes trigger independent review based on actual changed-file/operation evidence against declared repo-sensitive paths + universal patterns.

Coder self-report cannot suppress the floor.

Merge requires explicit human authorization + Review Coverage Summary.

## Capability evidence

```text
OBSERVED
SURFACE_PRESENT
UNAVAILABLE
UNKNOWN
```

Phase-1 MUST probes now observed/classified:
- raw Drive file create/read/update;
- GitHub binary commit/read-back;
- PR merge behavior;
- branch cleanup limitation.

## Project Memory

```text
<Project>/
├── PROJECT.md
├── CONTROL.json        # optional/rebuildable cache
├── WORK/
│   ├── jobs/
│   └── runs/
├── KNOWLEDGE/
└── VERIFICATION/
```

## Dispatch

```text
Project open → current-Project Handoffs
No Project open → shallow root-wide Project scan
```

## Canonical architecture

See `docs/architecture/DOCUMENT-INDEX-v1.md`.

## Phase 1 close gate

```text
Claude round-2 fixes
→ MUST platform probes
→ final consistency review
→ Phase 2
```

Phase 2 has not started yet.
