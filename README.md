# GPT Super Agent

GPT Super Agent is a ChatGPT orchestration/harness design for durable project work using Google Drive as Project memory/control plane and GitHub as source-code truth.

## Current phase

```text
PHASE 1              = COMPLETE / CLOSED
CLAUDE ROUND 1       = DISPOSITIONED/FIXED
CLAUDE ROUND 2       = CONDITIONAL READY; CONDITIONS SATISFIED
MUST PLATFORM PROBES = COMPLETE
FINAL CONSISTENCY    = PASS
PHASE 2              = READY, NOT STARTED
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

## Concurrency

```text
stable Job planning/control record
+ append-preserving Run/Verification records
+ read-time joins
+ minimal shared mutation
+ consequential-action recheck
```

Completing Runs do not write progress/reference arrays back into parent Job.

## Review

Normal review is topology-driven.

Mechanically sensitive changes trigger independent review from actual changed-file/operation evidence against structured repo-sensitive paths + universal patterns.

Merge requires explicit human authorization + Review Coverage Summary.

## Capability evidence

```text
OBSERVED
SURFACE_PRESENT
UNAVAILABLE
UNKNOWN
```

Observed before Phase-2 entry:
- raw Drive file create/read/update/delete;
- GitHub binary blob/tree/commit/read-back;
- PR create/read/merge;
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

Phase-1 closure evidence:
- `docs/working-notes/CLAUDE-ROUND2-DISPOSITION.md`
- `docs/working-notes/PHASE1-PLATFORM-PROBES-v0.1.md`
- `docs/working-notes/FINAL-PHASE1-CONSISTENCY-REVIEW-PASS-03.md`

## Phase 2

Phase 2 is now permitted but has **not** started.

It should begin as a thin operational harness/skills/actions layer, not a heavyweight autonomous runtime.
