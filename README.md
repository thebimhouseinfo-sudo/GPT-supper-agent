# GPT Super Agent

GPT Super Agent is a thin ChatGPT orchestration/harness system for durable project work.

## Status

```text
PHASE 1 = GOVERNED BASELINE
M0      = PASS
PHASE 2 = STARTED
CURRENT = M1B / GITHUB MEMORY REPO CUTOVER
```

## Core model

```text
Conversation = UI
Supabase Auth = GSA user identity
Supabase = per-user Memory Repo configuration only
GitHub Memory Repo = durable Project memory/control plane
GitHub source repos = source-code truth
Harness / Skills / Loops = operational behavior
```

```text
Project → Job → Task → Run
```

## Memory Repo

Each user configures one private GitHub repository as GSA Memory Repo.

```text
Supabase auth.uid()
→ user_memory_config
→ memory_repo_id / owner/name / default branch
→ projects/<project-id>/...
```

GSA Project Memory is written only to the configured repository and only below `projects/<project-id>/`.

Project source repositories remain separate.

## Concurrency

Updates/deletes use current GitHub blob SHA as the optimistic write precondition.

```text
fetch current file + SHA
→ update/delete with exact SHA
→ stale SHA fails
→ refetch/reconcile
```

CONTROL is optional/rebuildable; durable records remain authoritative.

## Review

Normal review is topology-driven. Sensitive changes trigger context-isolated review from actual changed-file/operation evidence.

Merge requires Review Coverage Summary + explicit human authorization.

## Capability evidence

```text
OBSERVED
SURFACE_PRESENT
UNAVAILABLE
UNKNOWN
```

## Project Memory

```text
projects/<project-id>/
├── PROJECT.md
├── CONTROL.json
├── WORK/
├── KNOWLEDGE/
└── VERIFICATION/
```

Git directories are lazy; no empty-folder placeholders are required.

## Canonical architecture

See `docs/architecture/DOCUMENT-INDEX.md`.

Phase-2 implementation source of truth:

`docs/plans/PHASE2-IMPLEMENTATION.md`
