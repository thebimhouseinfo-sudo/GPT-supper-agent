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
gsa-mcp  = ACTIVE / version 5
gsa-auth = DEPRECATED / API-only 410 response
```

MCP endpoint:
`https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp/mcp`

Protected-resource metadata:
`https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp/oauth-protected-resource`

Authorization UI source of truth:
`auth-ui/`

Supabase Edge Functions cannot serve HTML; the former `gsa-auth` Edge Function is intentionally deprecated. The static frontend must be deployed on a real frontend host such as Vercel.

Supabase OAuth issuer:
`https://fbyqktduoqlpbbtkghkf.supabase.co/auth/v1`

Observed:
- `gsa-mcp` deployed ACTIVE; the former `gsa-auth` Edge Function is intentionally deprecated because Edge Functions cannot serve HTML;
- MCP server declares one anonymous bootstrap tool;
- MCP server declares OAuth-protected `get_profile`, `get_drive_config`, `set_drive_config`;
- protected-resource metadata is implemented;
- authenticated handlers forward the Bearer token into Supabase so RLS applies;
- `set_drive_config` requires `write_probe_passed = true`;
- OAuth scopes are `email profile`; GSA does not request `openid`, so an ID token/asymmetric signing key is not required for this flow.

Protocol probes completed through the Supabase database HTTP extension:

```text
GET /health                                 PASS / 200
POST /mcp initialize                        PASS / protocol 2025-11-25
POST /mcp tools/list                        PASS / 4 tools discovered
POST /mcp get_runtime_status                PASS
GET /.well-known/oauth-protected-resource   PASS / 200
POST /mcp get_profile without token         PASS / OAuth challenge emitted
```

The remaining unproven layer is the real ChatGPT client OAuth/linking session.

## Corrected identity / Drive boundary

User-visible setup is intentionally simple:

```text
Connect GSA
→ Continue with Google
→ Supabase Auth resolves auth.uid() + verified email
→ GSA account connected
```

This authentication is only for GSA identity and per-user configuration.

Google Drive is NOT authenticated through GSA:

```text
ChatGPT Google Drive plugin
= separate existing ChatGPT connection
= outside GSA

GSA Supabase config
= auth.uid() + verified email + selected drive_root_folder_id
```

GSA never requests Google Drive scopes, never stores Drive credentials, and never tries to reproduce ChatGPT's Google Drive connection.

The selected folder ID is saved only after ChatGPT's external Drive connector successfully probes write/delete authority on that folder.

The internal MCP OAuth 2.1 exchange remains necessary only so ChatGPT can carry the same authenticated GSA identity across tool calls. It is transport/session plumbing, not a second user account and not a Google Drive connection.

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
3. Deploy repository directory `auth-ui/` as a static frontend (Vercel recommended).
4. Supabase Auth URL Configuration:
   - add the deployed `auth-ui` URL as an allowed redirect URL.
5. Supabase Dashboard → Authentication → OAuth Server:
   - current probe result: `feature_disabled / OAuth server is disabled`;
   - enable OAuth 2.1 server;
   - authorization path = the deployed `auth-ui` URL;
   - enable Dynamic Client Registration.
6. ChatGPT → Settings → Security and login:
   - enable Developer mode.
7. ChatGPT → Plugins → +:
   - MCP URL = `https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp/mcp`.

## Still TO_PROVE before M1A PASS

1. ChatGPT initializes the MCP endpoint and discovers all four tools.
2. Anonymous `get_runtime_status` call succeeds.
3. First protected-tool call launches the OAuth linking UI.
4. Google sign-in returns to the deployed `auth-ui` frontend.
5. Consent approval returns control to ChatGPT.
6. `get_profile` returns the authenticated Supabase `auth.uid()` and verified email.
7. `get_drive_config` is empty before setup.
8. Separately connected ChatGPT Google Drive capability can write/delete probe a chosen folder.
9. GSA does not perform any Google Drive authentication; `set_drive_config` only stores the resulting folder ID in the same user's row through RLS.
10. `get_drive_config` reads the saved folder in a fresh call/chat.
11. A second identity cannot read/update the first identity's row.
12. Only then mark M1A PASS.

## Existing unrelated security warning

Supabase Security Advisor currently reports a pre-existing `public.rls_auto_enable()` SECURITY DEFINER function callable by anon/authenticated roles.

It predates this GSA POC and was not modified by M1A. It should be reviewed separately rather than silently changed as part of GSA.


### OAuth builder repair

Observed after enabling Supabase OAuth Server:

```text
OAuth discovery                             PASS / 200
registration_endpoint                       PRESENT
Google provider                             ENABLED
JWKS                                        ES256 public key present
MCP unauthenticated initialize              401
WWW-Authenticate                            PRESENT
resource_metadata                           points to GSA protected-resource metadata
```

The initial ChatGPT plugin-builder error "MCP server does not implement OAuth" was traced to the MCP transport returning protocol responses before exposing an HTTP-level OAuth challenge. On path-based hosting such as Supabase Edge Functions, deterministic RFC 9728 metadata discovery does not land inside the function path automatically.

Repair:
- require OAuth at the MCP transport boundary;
- unauthenticated MCP requests return HTTP 401;
- `WWW-Authenticate` explicitly advertises the working protected-resource metadata URL;
- protected-resource metadata points to the enabled Supabase OAuth issuer.

This is now OBSERVED server behavior. The remaining proof is the real ChatGPT builder/linking flow.
