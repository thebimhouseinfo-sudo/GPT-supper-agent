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

Supabase Edge Functions:

```text
gsa-mcp  = ACTIVE / version 3
gsa-auth = ACTIVE / version 1
```

MCP endpoint:
`https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp/mcp`

Protected-resource metadata:
`https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp/oauth-protected-resource`

Authorization UI:
`https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-auth`

Supabase OAuth issuer:
`https://fbyqktduoqlpbbtkghkf.supabase.co/auth/v1`

Observed:
- both Edge Functions deployed ACTIVE;
- MCP server declares one anonymous bootstrap tool;
- MCP server declares OAuth-protected `get_profile`, `get_drive_config`, `set_drive_config`;
- protected-resource metadata is implemented;
- authenticated handlers forward the Bearer token into Supabase so RLS applies;
- `set_drive_config` requires `write_probe_passed = true`;
- OAuth scopes are `email profile`; GSA does not request `openid`, so an ID token/asymmetric signing key is not required for this flow.

Important:
deployment ACTIVE does not yet prove ChatGPT has initialized the MCP protocol or completed OAuth.

## Current package bootstrap

Portable plugin files:
- `plugin.json`;
- `mcp.json`;
- `skills/gsa-bootstrap/SKILL.md`.

The skill contains only bootstrap truth and does not duplicate full architecture/harness contracts.

## Manual UI gates still required

These settings cannot be changed by the currently exposed Supabase/ChatGPT connector actions and must be configured in their product UIs:

1. Supabase Dashboard → Authentication → Providers → Google:
   - enable Google;
   - provide Google OAuth Client ID and Client Secret.
2. Google Cloud OAuth client:
   - authorized redirect URI = `https://fbyqktduoqlpbbtkghkf.supabase.co/auth/v1/callback`.
3. Supabase Auth URL Configuration:
   - allow redirect to `https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-auth`.
4. Supabase Dashboard → Authentication → OAuth Server:
   - enable OAuth 2.1 server;
   - authorization path = `https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-auth`;
   - enable Dynamic Client Registration.
5. ChatGPT → Settings → Security and login:
   - enable Developer mode.
6. ChatGPT → Plugins → +:
   - MCP URL = `https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp/mcp`.

## Still TO_PROVE before M1A PASS

1. ChatGPT initializes the MCP endpoint and discovers all four tools.
2. Anonymous `get_runtime_status` call succeeds.
3. First protected-tool call launches the OAuth linking UI.
4. Google sign-in returns to `gsa-auth`.
5. Consent approval returns control to ChatGPT.
6. `get_profile` returns the authenticated Supabase `auth.uid()` and verified email.
7. `get_drive_config` is empty before setup.
8. ChatGPT Google Drive connector write/delete probe succeeds in a chosen folder.
9. `set_drive_config` writes the same user's row through RLS.
10. `get_drive_config` reads the saved folder in a fresh call/chat.
11. A second identity cannot read/update the first identity's row.
12. Only then mark M1A PASS.

## Existing unrelated security warning

Supabase Security Advisor currently reports a pre-existing `public.rls_auto_enable()` SECURITY DEFINER function callable by anon/authenticated roles.

It predates this GSA POC and was not modified by M1A. It should be reviewed separately rather than silently changed as part of GSA.
