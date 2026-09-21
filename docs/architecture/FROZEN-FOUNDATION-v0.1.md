# Frozen Foundation v0.1

## Status

```text
FOUNDATION_STATUS = FROZEN
```

This document freezes the foundational decisions that define what GPT Super Agent is and how a Job is represented.

These decisions MUST NOT be changed implicitly while defining later modules such as Planner, QA/QC, Reviewer, schemas, or execution details.

A change requires an explicit architecture revision.

---

## F1. Product boundary

GPT Super Agent is primarily an **online coding/orchestration agent**.

Its current code environment is GitHub.

Core online execution surfaces include:

- GitHub repositories
- branches / commits / pull requests
- GitHub CI/workflows
- remote preview/deployment evidence when available
- other explicitly connected online coding services

Local filesystem, local shell, localhost-only runtime, Revit/AutoCAD desktop runtime, and other offline execution are not part of the Super Agent core.

GPTWorker remains a separate offline/local coding agent.

```text
Super Agent = online
GPTWorker   = offline/local
```

---

## F2. One configured Google Drive root

Super Agent is configured once with one Google Drive root.

The user does not provide a new Drive link for each Job.

```text
SUPER_AGENT_DRIVE_ROOT
```

Every Job is created as one direct child folder of that root.

There is:

- no Job registry file
- no mandatory `jobs/` wrapper folder
- no GitHub scan to discover Jobs

---

## F3. Job definition

A Job is a durable work entity stored in Google Drive.

```text
Job
= one direct Drive subfolder
= durable work state / project memory
```

A Job is NOT:

- a GitHub repository
- a chat conversation
- a GitHub Project
- a branch
- a pull request

A Job may represent a long-running project, migration, major change stream, or another coherent unit of work.

---

## F4. Job marker and entry point

Every valid Job folder contains:

```text
JOB.md
```

`JOB.md` is:

- the Job marker
- the human-readable Job entry point
- the compact machine-readable metadata source through YAML front matter

Example:

```markdown
---
id: kid-eschool
name: Kid eSchool
status: active
execution_mode: online
repositories:
  - thebimhouseinfo-sudo/Kideschool
  - thebimhouseinfo-sudo/KE-Math-Grade1
---

# Kid eSchool

Durable Super Agent Job memory for Kid eSchool.
```

`ARCHITECTURE.md` is an architecture document, not the Job marker.

JSON remains appropriate for strongly structured runtime/state artifacts such as:

- `STATE.json`
- `REPO-GRAPH.json`
- `CAPABILITY-MATRIX.json`

---

## F5. Job discovery

`job list` reads the configured Drive root.

```text
SUPER_AGENT_DRIVE_ROOT
→ enumerate direct child folders
→ find JOB.md
→ parse valid front matter
→ list Jobs
```

The Drive folder tree itself is the Job index.

Folders without a valid `JOB.md` are not active Jobs.

---

## F6. Job creation

`job create` automatically creates a new direct subfolder under the configured Drive root.

The Job bootstrap is status-driven:

```text
create folder
→ JOB.md status: bootstrapping
→ create initial Project Memory
→ attach GitHub code environment
→ initial profiling
→ validate
→ JOB.md status: active
```

If creation fails and cleanup cannot complete:

```text
status: incomplete
```

The user is not asked for a per-Job Drive link.

---

## F7. Code environment

The Job and the code environment are separate concepts.

```text
Job
= Drive

Code Environment
= GitHub
= 1..N repositories
```

A Job may contain:

```text
1 repo
or
many repos
```

Repositories are references from the Job; source code is not copied into Drive.

---

## F8. Single-repo and multi-repo consistency

Super Agent uses exactly one Job model for both single-repo and multi-repo work.

There is no separate single-repo storage mode.

Drive remains the canonical Job root in both cases. The full rationale is canonical in `ARCHITECTURE-v0.1.md` §6 and MUST NOT be duplicated here.

---

## F9. Drive-first context loading

When an existing Job is selected/opened, Super Agent reads Drive first.

```text
select Job
→ JOB.md
→ state / architecture / plans / decisions / repo graph
→ understand current user request
→ determine relevant repository
→ determine relevant source area
→ selectively read GitHub
```

Core rule:

> DRIVE FIRST, GITHUB SECOND, SELECTIVE SOURCE READ.

Super Agent does not scan every attached repository by default.

For status/history/planning questions, GitHub may not need to be read at all.

---

## F10. Project vs Job vs Repo

These terms are distinct:

```text
Job
= durable work entity in Drive

Project
= logical product/system context used for planning

Repo
= a GitHub source repository in the Job's code environment
```

A Job can operate across a multi-repo Project.

A Project is a logical model, not another storage root.

---

## F11. Agent role boundaries

The high-level role split is frozen:

```text
Orchestrator
Planner
Designer
Coder
  ├── UX Coder
  └── UI Coder
Reviewer
```

High-level role ownership boundaries are also frozen as policy intent.

Their enforcement mechanism is NOT frozen here. A later capability/enforcement definition must classify each boundary as `HARD`, `SOFT`, or `UNKNOWN`; until verified, `UNKNOWN` is treated operationally as `SOFT`.

Target ownership:

```text
Planner
→ Project Memory write
→ GitHub source read-only

Designer
→ Design Workspace / Project Memory write
→ GitHub source read-only

Coder
→ Project Memory read-only
→ approved GitHub source write

Reviewer
→ Project Memory write
→ GitHub source read-only

Orchestrator
→ workflow/state governance
→ no source implementation
```

Detailed responsibilities and enforcement mechanisms remain subject to later definition.

---

## F12. Clarification-before-execution principle

Material ambiguity must be resolved before substantial execution.

Shared causal order:

```text
intent
→ known facts
→ unknowns
→ causal impact
→ ask or infer
→ assumptions
→ plan
→ execute
```

Agents do not ask about information already available in:

- current conversation
- Drive Job memory
- relevant GitHub evidence
- approved decisions/specs

They also do not invent material product/architecture/design intent.

---

## F13. Foundation invariants

1. Conversation is UI, not durable memory.
2. A Job always has a Drive folder.
3. One direct Drive subfolder equals one Job.
4. `JOB.md` identifies the Job.
5. `job list` is derived from Drive folders, not GitHub.
6. GitHub is the code environment.
7. A Job has one or many GitHub repositories.
8. Single-repo and multi-repo use the same Job lifecycle.
9. Existing Job context is always loaded Drive-first.
10. GitHub source reading is selective and request-driven.
11. Super Agent remains online-first.
12. GPTWorker remains a separate offline/local agent.
13. Later module design must preserve these invariants.

---

## F14. User-facing invocation identity

The user-facing invocation identity is independent of the repository name.

```text
Plugin handle     = @gsa
Command namespace = gsa/
```

The repository that contains the Super Agent implementation may be renamed later without requiring a user-facing command migration.

Only the namespace is frozen here. The full command grammar remains to be defined.

---

## F15. Not frozen by this document

The following still need detailed definition and may evolve without revising the frozen foundation:

- exact Planner inputs/outputs
- exact Designer inputs/outputs
- QA responsibilities
- QC responsibilities
- Reviewer checklist/severity model
- verification/evidence policy details
- exact state machine
- exact schemas
- exact command grammar
- failure/recovery behavior
- capability resolution details
- PR/branch strategy details
- observability/audit model
- completion definition
