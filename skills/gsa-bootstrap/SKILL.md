---
name: gsa-bootstrap
description: Initialize GSA account/runtime connection, identity and Memory Repo; route project-level Bootstrap to gsa-job-runtime.
---

# GPT Super Agent bootstrap

## Scope: platform setup vs Project Bootstrap

This skill only establishes the **GSA platform connection** (authentication, Memory Repo configuration and CLI routing). It does **not** define a separate Criteria/Plan/Milestone approval workflow.

When a Human asks to **Bootstrap a Project**, first perform only the minimal Project open/identity checks, then follow `skills/gsa-job-runtime/SKILL.md` → **Autonomous Bootstrap checklist**, with the active Orchestrator role harness and `project_bootstrap_checklist_prepare`.

That Project workflow must inspect and complete exactly four evidence-backed items: Human-approved Criteria, Plan aligned with Criteria, Milestones aligned with Plan, and relevant Coder/Tester skills/knowledge. Preserve already valid brownfield artifacts. Automatically handle planning/CRL/role skills; ask Human only for Criteria approval/changes or genuinely irreconcilable source-of-truth decisions. Technical SHA/CAS/readback is a tool operation, not another Bootstrap gate. Product code execution and release still require their proper Human authorization.

Do not confuse a lightweight `PROJECT OPEN` or this platform setup skill with completion of `BOOTSTRAP READY`.

## Identity

GSA authentication is application-user identity/configuration only.

```text
Google sign-in
→ Supabase Auth
→ auth.uid()
→ user_memory_config
```

Do not treat a manually typed email as identity proof.

## Memory Repo

Project Memory lives only in the configured private GitHub Memory Repo.

Setup:

```text
SETTING → Memory Repo
→ user pastes GitHub repo URL
→ use GitHub get_repo
→ verify repository ID
→ verify visibility = private
→ verify push permission = true
→ resolve default branch
→ call set_memory_repo_config
```

Do not store GitHub credentials in GSA.
Do not infer Memory Repo from chat history or from a Project source repository.

## Hard Memory Repo sandbox

Before any Project-memory create/update/delete:

1. call `get_memory_repo_config`;
2. target the exact configured repository;
3. target only `projects/<project-id>/...`;
4. call `authorize_memory_mutation`;
5. continue only on `allowed=true`.

Forbidden:
- writing Project Memory to another repo;
- writing arbitrary repo-root files;
- using a Project source repo as Memory Repo without explicit configuration;
- force-overwriting a stale file.

Update/delete:

```text
fetch current file
→ current blob SHA
→ update_file/delete_file with exact SHA
→ SHA conflict
→ refetch/reconcile
```

Project-memory deletion requires explicit Human Gate.

## URL routing

A pasted GitHub URL is sufficient provider context. Do not require `@GitHub`.

## CLI shortcuts

Root groups have no shortcuts:

```text
PROJECT
DIRECT AGENT
SETTING
HELP
```

Stable aliases:

```text
PROJECT:
list=ls, open=op, create=new, status=st,
pause=pa, resume=rs, archive=ar, delete=rm

DIRECT AGENT:
planner=pl, designer=ds, coder=cd, reviewer=rv, tester=ts

SETTING:
GSA Account=acct, Memory Repo=repo

HELP:
instruction=guide, command help=help
```

Treat each shortcut exactly as its canonical command. Do not invent aliases.

## Root menu rendering

For `gsa/`:
- call `get_cli_root`;
- return `menu_text` verbatim as the entire answer.

Do not translate, paraphrase, summarize, compress, reorder or add commentary.
