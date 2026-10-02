# Capability Catalog

## 1. Evidence state

```text
OBSERVED
SURFACE_PRESENT
UNAVAILABLE
UNKNOWN
```

Only OBSERVED may support an operational success claim.

## 2. Derived execution mode

```text
NORMAL
DEGRADED
BLOCKED
```

Capability evidence and policy authority are separate.

## 3. GitHub connector

Observed:

```text
repository metadata/read              OBSERVED
file fetch                            OBSERVED
text create                           OBSERVED
text update                           OBSERVED
text delete                           OBSERVED
branch create                         OBSERVED
blob/tree/commit                      OBSERVED
branch ref update                     OBSERVED
binary commit/read-back               OBSERVED
PR create/read                        OBSERVED
PR merge                              OBSERVED
branch delete action                  UNAVAILABLE
automatic branch cleanup              NOT OBSERVED
```

For shared mutable GSA memory files:
- fetch current file;
- capture current blob SHA;
- update/delete with that SHA;
- stale SHA must block and trigger refetch/reconcile.

## 4. GSA identity / OAuth

Observed:

```text
Supabase project health                OBSERVED
MCP deployment                         OBSERVED
MCP initialize                         OBSERVED
MCP tool discovery                     OBSERVED
protected-resource metadata            OBSERVED
HTTP OAuth challenge                   OBSERVED
Supabase OAuth server                  OBSERVED
dynamic client registration            OBSERVED
Google sign-in                         OBSERVED
OAuth consent / reconnect              OBSERVED
token exchange                         OBSERVED
authenticated MCP request              OBSERVED
auth.uid() resolution                  OBSERVED
```

Reconnect auto-approval is handled.

## 5. Per-user configuration

Current schema:

`public.user_memory_config`

Observed:
- table exists;
- RLS enabled;
- auth.uid()-scoped policies installed.

Current runtime:
- `get_memory_repo_config`;
- `set_memory_repo_config`;
- `authorize_memory_mutation`.

End-to-end user Memory Repo configuration remains TO_PROVE until a private writable repo is supplied and configured through ChatGPT.

## 6. Memory Repo runtime

GSA MCP v21 implements:

```text
exact configured Memory Repo boundary
projects/<uuid>/ path boundary
wrong-repo DENY
outside-prefix DENY
blob-SHA optimistic concurrency contract
Project lifecycle handlers
Direct Agent dispatcher
Help handlers
```

Project source repositories remain separate source-code truth.

## 7. Project lifecycle handlers

Implemented:
- project_list;
- project_create;
- project_open;
- project_status;
- project_pause;
- project_resume;
- project_archive;
- project_delete.

Pure manifest/parser/transition self-test exists in the deployed MCP.

Real source-repo pilot:
`thebimhouseinfo-sudo/KE-Math-Grade1`

Runtime self-test is OBSERVED PASS 7/7: UUIDv7 shape, manifest parse, pause transition, resume transition, allowed Memory path, rejected out-of-scope path, and GitHub repo normalization.

New persistence acceptance is pending configuration of the dedicated Memory Repo.

## 8. GitHub capability still surface-present/unproven

```text
PR diff / changed-file surface          SURFACE_PRESENT
review/comment surfaces                 SURFACE_PRESENT
Actions run/job/log inspection          SURFACE_PRESENT
workflow rerun                          SURFACE_PRESENT
protected/default branch behavior       UNKNOWN / permission-dependent
```

## 9. Runtime / testing

```text
public web fetch/search                  OBSERVED
general deployed-app interaction         SURFACE_PRESENT via Vercel Sandbox bridge
authenticated/private preview            UNKNOWN
localhost/private runtime                UNAVAILABLE by design for cloud browser QA
interactive screenshot testing          SURFACE_PRESENT via agent-browser + Vercel Sandbox
```

Browser QA surface is implemented through the authenticated Vercel Sandbox bridge documented in `BROWSER-QA.md`.

Tool presence is only SURFACE_PRESENT. A successful browser call against the exact target URL/revision upgrades that check to OBSERVED evidence for the current Run. Bridge/runtime failure remains an environment limitation.

Tester practical execution remains capability-gated; Human Retest is fallback.

### Tester evidence readiness refinement

Tester may use a finer per-check readiness ladder:

```text
DISCOVERED → REACHABLE → INVOCABLE → FUNCTIONAL → GOAL_MET
```

- `DISCOVERED`: capability/tool is visible.
- `REACHABLE`: required service/bridge/endpoint can be reached.
- `INVOCABLE`: required operation can be called from the active execution surface.
- `FUNCTIONAL`: operation behaves correctly against the intended target.
- `GOAL_MET`: the full declared test/checkpoint promise is verified.

Compatibility remains:

```text
SURFACE_PRESENT ≈ DISCOVERED
OBSERVED = evidence-backed at the tested level
```

This refinement does not replace the global `OBSERVED / SURFACE_PRESENT / UNAVAILABLE / UNKNOWN` states in CP3.

## 10. Media/design

```text
image generation                         SURFACE_PRESENT
image editing                            SURFACE_PRESENT
transparent-output request               SURFACE_PRESENT
direct generated-image persistence       UNKNOWN
```

## 11. Rule

Probe results update capability evidence only.

They do not expand role authority.
