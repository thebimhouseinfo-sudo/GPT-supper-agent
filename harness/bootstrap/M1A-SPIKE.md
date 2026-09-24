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


### End-to-end ChatGPT OAuth success

Observed from Supabase Auth and Edge logs after creating the GSA personal plugin in ChatGPT:

```text
ChatGPT reads OAuth discovery                 PASS
ChatGPT dynamic client registration           PASS / 201
Google PKCE sign-in                           PASS / 200
Authorization consent                         PASS / approve
OAuth authorization-code token exchange       PASS / 200
ChatGPT authenticated MCP request             PASS / 200
MCP JWT role                                  authenticated
MCP token issuer                              Supabase Auth
MCP auth-context user lookup                  PASS / /auth/v1/user 200
```

This proves the real runtime identity chain:

```text
ChatGPT
→ Supabase OAuth 2.1
→ Google sign-in
→ consent
→ access token
→ GSA MCP
→ Supabase auth user
```

No Google Drive scope or credential participates in this chain.

Remaining M1A proof:
1. call/read the authenticated GSA profile through the plugin;
2. verify `get_drive_config` returns not configured before setup;
3. paste a Google Drive folder URL and let ChatGPT auto-route it to the already-connected Drive app;
4. pass a write/delete probe on that folder;
5. save the URL through `set_drive_config`, which extracts/stores the canonical folder ID;
6. read it back through RLS in a fresh call/chat;
7. verify cross-user RLS isolation when a second test identity is available.


### CLI root and Drive cleanup correction

Observed issue from the real personal-plugin test:
- a plugin created directly from an MCP Server URL does not automatically consume repository `skills/` files as user-facing CLI policy;
- without an explicit MCP-side menu contract, the model exposed raw MCP tool names as fake CLI commands.

Repair in `gsa-mcp` v8:
- server instructions now define the authoritative root:
  `PROJECT / DIRECT AGENT / SETTING / HELP`;
- new `get_cli_root` tool is explicitly triggered by `gsa/`;
- raw MCP tool names must not be presented as CLI commands;
- URL-first routing remains the user-facing contract.

Drive probe cleanup was also re-tested against the actual selected Project Drive folder.

Observed connector quirk:
- `create_folder` returns a normal folder URL `/drive/folders/<ID>`;
- `delete_file` rejects that folder URL form;
- deletion succeeds when the same Drive item ID is expressed as:
  `https://drive.google.com/file/d/<ID>/view`.

Verified end-to-end against the selected target folder:

```text
create child probe in target folder   PASS
delete probe with file-resource URL   PASS
list target folder after delete       probe absent
```

The earlier leaked root probe was also removed successfully.

Operational rule:
1. create probe inside the pasted target folder;
2. capture returned probe ID;
3. delete using `https://drive.google.com/file/d/<PROBE_ID>/view`;
4. optionally list target folder to verify absence;
5. only then set `write_probe_passed=true`.


### Reinstall / reconnect auto-approval fix

Observed on plugin reinstall:

```text
OAuth authorize request                  PASS
existing user/client consent             auto_approved = true
getAuthorizationDetails                  returned redirect_url without pending authorization_id
old auth-ui behavior                     called approveAuthorization again
result                                   400 authorization request is no longer pending
```

Supabase documents this as a valid reconnect case: when authorization details no longer contain an `authorization_id`, the user has previously consented and the UI must redirect directly to `redirect_url`.

Repair in `auth-ui/index.html`:
- after `getAuthorizationDetails()`, test whether `authorization_id` is present;
- if absent and `redirect_url` exists, redirect immediately back to ChatGPT;
- do not call `approveAuthorization()` a second time.

Production Vercel deployment for commit `8eb7cff0c9b56450a69be8b3978717f30cdedfbb` reached READY.
