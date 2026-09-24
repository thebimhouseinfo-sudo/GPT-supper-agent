# GPT Super Agent

GPT Super Agent is a ChatGPT orchestration/harness design for durable project work using Google Drive as Project memory/control plane and GitHub as source-code truth.

## Status

```text
PHASE 1 = GOVERNED BASELINE
PHASE 2 = READY FOR M0 / NOT STARTED
```

Git history records review/amendment history; README does not duplicate peer-review chronology.

## Core model

```text
Conversation = UI
Google Drive = durable Project memory/control plane
Supabase = per-user plugin configuration (initially Drive root mapping only)
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

Mechanically sensitive changes trigger context-isolated review from actual changed-file/operation evidence against structured repo-sensitive paths + universal patterns.

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

## Per-user Drive root

`SUPER_AGENT_DRIVE_ROOT` is a logical root resolved from the current user's runtime configuration.

Initial implementation uses Supabase Auth with Google OAuth for application-user identity, then stores `user_id → drive_root_folder_id` in Supabase. Changing folder updates the same user's record in place; no config revision is used.

The ChatGPT Google Drive plugin/connector is a separate prerequisite. Project Drive becomes READY only after the selected folder passes a temporary write/delete probe. User-specific folder IDs are not stored in GitHub or treated as authoritative from chat history.

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

See `docs/architecture/DOCUMENT-INDEX.md`.

## Phase 2

Phase 2 is now permitted but has **not** started.

Single implementation source of truth:
`docs/plans/PHASE2-IMPLEMENTATION.md`

It should begin as a thin operational harness/skills/actions layer, not a heavyweight autonomous runtime.
