# GPT Super Agent

GPT Super Agent is a ChatGPT orchestration/harness design for durable project work using Google Drive as Project memory/control plane and GitHub as source-code truth.

## Current phase

```text
PHASE 1 THEORY       = ROUND-2 FIX PASS COMPLETE
CLAUDE ROUND 1       = DISPOSITIONED/FIXED
CLAUDE ROUND 2       = COMPLETE; FINDINGS ACCEPTED/FIXED
PLATFORM PROBES      = 3 MUST PROBES PENDING
CONSISTENCY REVIEW   = PENDING AFTER PROBES
PHASE 2              = BLOCKED
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

Job is a finite objective with potentially multiple role Runs.

## Concurrency model

```text
stable Job planning/control record
+ append-preserving Run/Verification records
+ read-time joins
+ minimal shared mutation
+ consequential-action recheck
```

Completing Runs do not append progress/reference arrays into the parent Job file.

## Review model

Normal review remains topology-driven.

Mechanically sensitive changes trigger an independent review floor based on actual changed-file/operation evidence against declared repo-sensitive paths + universal patterns.

Coder self-report cannot disable the floor.

Merge requires explicit human authorization + Review Coverage Summary.

## Capability model

```text
OBSERVED
SURFACE_PRESENT
UNAVAILABLE
UNKNOWN
```

Only OBSERVED capability can be relied on as operationally proven.

## Roles

```text
Orchestrator
Planner
Designer
Coder
Reviewer
Tester
```

One active role per Run; child Run allowed when independence is not required.

Tester practical execution requires OBSERVED runtime capability; otherwise human Retest is fallback.

## Project Memory

```text
<Project>/
├── PROJECT.md
├── CONTROL.json        # optional/rebuildable cache
├── WORK/
│   ├── jobs/
│   └── runs/
├── KNOWLEDGE/          # structured front matter + human-readable bodies
└── VERIFICATION/
```

Current Job progress is joined from append-preserving records by job_id/task_id rather than parallel write-back.

## Dispatch

```text
Project open
→ pending Handoffs default to current Project

No Project open
→ shallow root-wide Project scan
→ use CONTROL cache where available
→ fall back to durable records
```

## User-facing naming

Current handles/command namespace names are aliases, not frozen identity.

Natural language remains valid.

## Canonical architecture

See `docs/architecture/DOCUMENT-INDEX-v1.md` for authoritative internal document versions/status.

## Phase 1 close gate

```text
Claude round-2 fixes
→ 3 MUST platform probes
→ final consistency review
→ Phase 2
```

Phase 2 has not started.
