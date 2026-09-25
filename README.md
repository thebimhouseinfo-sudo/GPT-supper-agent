# GPT Super Agent

GPT Super Agent is a thin ChatGPT orchestration/harness system for durable project work.

## Status

```text
PHASE 1 = GOVERNED BASELINE
M0      = PASS
PHASE 2 = STARTED
CURRENT = M2 / REAL JOB PILOT
RUNTIME = GSA MCP v28
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


## Minimal Job runtime

The first durable Job vertical slice is now available with layered role harnesses and progressive task skills:

```text
Planner harness
→ job_prepare
→ run_begin
→ specialist harness loop
→ Verification / Goal Recheck
→ optional Handoff
→ run_complete
```

Runtime role contracts are loaded through `get_agent_harness`; task skills are discovered with `get_skill_catalog` and loaded on demand with `load_skill`.
See `skills/gsa-job-runtime/SKILL.md`, `evals/E17-minimal-job-runtime.md`, and `evals/E18-real-job-pilot.md`.


## Product workflow planning

For UI/UX-bearing application Jobs, Planner classifies both repository maturity and product workflow:

```text
GREENFIELD | BROWNFIELD
UI_FIRST   | UX_FIRST
```

UI_FIRST derives a stable shell from the UX execution contract before UI implementation.
UX_FIRST may use Human-approved provisional UI to execute UX, while durable UI needs accumulate into larger UI Update Packs.
See `docs/architecture/PRODUCT-WORKFLOW-CLASSIFICATION.md`.

## Real Job pilot

A new durable objective enters through Planner. For UX_FIRST temporary UI, material user-facing choices must be explicitly approved before a Coder Run can begin. `run_begin` requires the current owning Job snapshot and fails closed when the temporary-UI Human Gate is pending.

Use E18 for the first bounded real Project test. Merge and deployment remain explicit Human actions.
