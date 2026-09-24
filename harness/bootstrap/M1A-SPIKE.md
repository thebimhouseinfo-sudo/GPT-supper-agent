# M1A Bootstrap / Memory Repo Cutover Evidence

## Status

```text
M0 = PASS
M1A IDENTITY/OAUTH = OBSERVED
MEMORY BACKEND = GITHUB MEMORY REPO
M1B MEMORY-REPO ACCEPTANCE = PENDING USER-SUPPLIED MEMORY REPO
```

## Observed identity chain

Real ChatGPT personal-plugin flow has been observed:

```text
ChatGPT
→ Supabase OAuth discovery
→ dynamic client registration
→ Google sign-in
→ consent / auto-approved reconnect
→ OAuth token exchange
→ authenticated GSA MCP request
→ Supabase auth user
```

The reconnect auto-approval case is handled by redirecting immediately when Supabase returns a redirect URL without a pending authorization ID.

## Current runtime

GSA MCP v20 changed the durable control plane to a per-user private GitHub Memory Repo.

Current configuration table:

`public.user_memory_config`

Fields:
- user_id;
- email;
- memory_repo_id;
- memory_repo_full_name;
- memory_repo_url;
- default_branch;
- created_at;
- updated_at.

RLS uses `auth.uid()`.

## Memory Repo setup contract

```text
paste private GitHub repo URL
→ GitHub get_repo
→ verify numeric repo ID
→ verify private visibility
→ verify push permission
→ resolve default branch
→ set_memory_repo_config
```

Supabase stores configuration only.

## Hard memory boundary

GSA memory mutations are allowed only when:

```text
repository = configured Memory Repo
path = projects/<uuid>/...
```

Runtime guard:

`authorize_memory_mutation`

Shared mutable files require current blob SHA for update/delete.

## Project command backend

Implemented handlers:
- project_list;
- project_create;
- project_open;
- project_status;
- project_pause;
- project_resume;
- project_archive;
- project_delete;
- start_direct_agent;
- get_instruction;
- get_command_help.

## Source-repo pilot

`thebimhouseinfo-sudo/KE-Math-Grade1` remains the real source-repository target for the vertical-slice pilot.

The previous storage acceptance is superseded by the Memory Repo cutover. New M1B persistence acceptance must be rerun after a dedicated private Memory Repo is configured.

## Remaining M1A/M1B proof

1. user supplies a private GitHub Memory Repo;
2. `set_memory_repo_config` succeeds through OAuth/RLS;
3. fresh chat resolves the same repo;
4. create `projects/<uuid>/PROJECT.md`;
5. read it back;
6. update lifecycle using exact blob SHA;
7. deliberately attempt stale-SHA update and observe conflict;
8. verify wrong-repo and outside-prefix mutation guards DENY;
9. verify source repo remains separate and unchanged.
