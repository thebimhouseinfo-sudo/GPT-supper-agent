# M1A Bootstrap Spike

## Status

```text
M1A = IN_PROGRESS
M0 = PASS
```

This file records observed implementation evidence, not new architecture theory.

## Observed

### Plugin delivery model

Current OpenAI plugin architecture supports:
- MCP servers for live tools/auth/actions;
- skills for packaged workflow instructions;
- plugins combining both.

Therefore the selected GSA implementation shape is:

```text
GSA plugin
├── skills
└── MCP server
```

Repository Markdown under `docs/` or `harness/` is not assumed to load into ChatGPT automatically.

### Supabase configuration store

Project:
`fbyqktduoqlpbbtkghkf`

Observed:
- project = ACTIVE_HEALTHY;
- `public.user_drive_config` created;
- RLS enabled;
- PK = `user_id` referencing `auth.users(id)`;
- own-row SELECT/INSERT/UPDATE/DELETE policies use `auth.uid()`.

OAuth-authenticated CRUD is not yet observed because no end-user OAuth session has been completed.

### MCP bootstrap hosting

Supabase Edge Function:
`gsa-mcp`

Observed:
- deployment status = ACTIVE;
- version = 1;
- public bootstrap mode = read-only;
- tool declared = `get_runtime_status`.

Endpoint:
`https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp`

Important:
deployment ACTIVE does not prove an MCP client has successfully initialized/called the endpoint.

## Current package bootstrap

Portable plugin files:
- `plugin.json`;
- `mcp.json`;
- `skills/gsa-bootstrap/SKILL.md`.

The skill contains only bootstrap truth and does not duplicate full architecture/harness contracts.

## Still TO_PROVE before M1A PASS

1. Enable/configure Supabase OAuth 2.1 server.
2. Configure Google as a Supabase Auth provider.
3. Provide the OAuth consent route.
4. Ensure asymmetric Supabase JWT signing suitable for MCP OAuth middleware.
5. Protect the MCP function with Supabase OAuth protected-resource middleware.
6. Connect the MCP URL in ChatGPT Developer Mode.
7. Observe ChatGPT initialization/tool discovery and call `get_runtime_status`.
8. Complete Google sign-in/consent from ChatGPT.
9. Observe `auth.uid()` through the authenticated MCP call.
10. Create/read/update the same `user_drive_config` row through RLS.
11. Verify a second identity cannot read/update the first identity's row.
12. Only then mark M1A PASS.

## Existing unrelated security warning

Supabase Security Advisor currently reports a pre-existing `public.rls_auto_enable()` SECURITY DEFINER function callable by anon/authenticated roles.

It predates this GSA POC and was not modified by M1A. It should be reviewed separately rather than silently changed as part of GSA.
