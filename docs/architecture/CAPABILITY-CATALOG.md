# Capability Catalog v1.4

## 1. Capability evidence state

```text
OBSERVED
= successful end-to-end execution has been observed for the relevant action class

SURFACE_PRESENT
= connector/tool action exists but end-to-end behavior for this use has not been proven

UNAVAILABLE
= action is absent or known unusable in the current environment

UNKNOWN
= surface/behavior has not yet been established
```

Only OBSERVED may be relied on as an operational guarantee.

## 2. Derived execution mode

```text
NORMAL
DEGRADED
BLOCKED
```

## 3. Enforcement

```text
HARD
SOFT
UNKNOWN
```

Capability evidence and policy enforcement are separate.

## 4. Current observed matrix

### Google Drive

Phase-1 raw-file round-trip probe completed successfully.

Observed:
```text
create folder                      OBSERVED
upload raw .md bytes               OBSERVED
read raw .md                       OBSERVED
replace raw bytes in place         OBSERVED
read-back updated bytes            OBSERVED
delete raw file                    OBSERVED
delete temporary folder            OBSERVED (via Drive file resource URL form)
conditional/revision-aware write   UNAVAILABLE in current raw update action schema
list My Drive root                  OBSERVED
create temporary folder in root     OBSERVED (2026-09-24 re-probe)
delete temporary folder              OBSERVED (Drive file resource URL form)
authenticated connector account ID  NOT EXPOSED AS RELIABLE CONTRACT
```

Probe evidence:
- temporary Drive folder created;
- `phase1-drive-probe.md` uploaded as raw `text/markdown`;
- v1 bytes read back exactly;
- same Drive file ID updated to v2 bytes;
- v2 bytes read back exactly;
- temporary file/folder deleted.

Therefore raw Drive Project-memory file round-trip is operationally OBSERVED.

2026-09-24 onboarding feasibility re-probe:
- current connected Google Drive connector listed My Drive root successfully;
- created `GSA-write-probe-2026-09-24` successfully;
- connector returned a concrete Drive folder ID;
- cleanup succeeded using the Drive file-resource URL form;
- folder URL form was rejected by the delete action, so cleanup must use the supported file-resource URL form;
- current tool surface does not provide a direct reliable "current Google account identity" contract suitable for enforcing equality with Supabase OAuth identity.

Governance result:
```text
Supabase Google OAuth identity = application-user proof
Drive connector write probe    = selected-folder resource-authority proof
cross-connector account equality = NOT REQUIRED / NOT CLAIMED
```

### GitHub

Observed during Phase 1:
```text
repo/file read                     OBSERVED
text create/update/delete          OBSERVED
branch create                      OBSERVED
create blob/tree/commit            OBSERVED
move/update branch ref             OBSERVED
binary blob/commit round-trip      OBSERVED
PR create/read                     OBSERVED
PR merge                           OBSERVED
binary read-back                   OBSERVED
different-model/account reviewer identity UNAVAILABLE under same connected user identity
branch delete action               UNAVAILABLE in current exposed connector surface
automatic branch cleanup on merge  NOT OBSERVED (probe branch remained)
```

Merge probe details:
- a 16-byte binary probe was committed on a temporary branch;
- binary bytes were fetched back exactly;
- PR #1 was opened and reported mergeable;
- connector merge succeeded;
- probe branch remained after merge;
- current connector exposes no branch-delete action;
- branch was force-reset to current main as cleanup fallback;
- merged binary probe file was then deleted from main.

Important governance result:
```text
merge capability = OBSERVED
connector-enforced human confirmation = NOT RELIED UPON
explicit human authorization = harness SOFT governance requirement
branch auto-cleanup = do not assume
```

### GitHub capability still surface-present/unproven

```text
PR diff/changed files              SURFACE_PRESENT
PR review/comment surfaces         SURFACE_PRESENT
Actions run/job/log inspection     SURFACE_PRESENT
workflow rerun                     SURFACE_PRESENT
protected/default branch behavior  UNKNOWN / permission-dependent
```

These are not Phase-1 entry blockers because the theory has safe fallbacks or they can be probed during Phase-2 bootstrap before first real use.

### Runtime / testing

```text
public web fetch/search            OBSERVED
general deployed-app interaction   UNKNOWN
authenticated/private preview      UNKNOWN
localhost/private runtime          UNAVAILABLE in ordinary connector chat unless another executor exists
desktop Revit/AutoCAD execution    UNAVAILABLE in ordinary online harness
interactive screenshot testing    UNKNOWN
```

Tester practical execution remains capability-gated; human Retest is the fallback.

### Media/design

```text
image generation                   SURFACE_PRESENT
image editing                      SURFACE_PRESENT
transparent-output request         SURFACE_PRESENT
direct generated-image persistence UNKNOWN
```

## 5. Repo readiness baseline

Each coding Job records observed/surface-present status for applicable:
- CI;
- tests;
- build;
- lint;
- typecheck;
- preview;
- runtime/browser;
- domain-specific checks.

A criterion is not verified by a capability unless that capability is OBSERVED for the relevant action/environment.

## 6. Phase-1 probe gate

### MUST_BE_PROBED_BEFORE_PHASE_2

```text
raw Drive create/update/read round-trip   PASS / OBSERVED
GitHub binary commit round-trip           PASS / OBSERVED
merge + branch cleanup/confirmation       PASS AS CLASSIFICATION
  merge                                  OBSERVED
  automatic branch cleanup               NOT OBSERVED
  connector branch delete                UNAVAILABLE
  fallback                               preserve/reset branch; never assume deletion
```

All MUST probes have been executed and classified.

### CAN_BE_PROBED_DURING PHASE-2 BOOTSTRAP BEFORE FIRST REAL USE
- protected/default branch behavior;
- direct generated-image persistence;
- practical runtime/browser Tester capability.

### NOT NEEDED FOR PHASE-2 ENTRY
- Google Drive comment workflow unless later selected as load-bearing.

## 6A. Phase-2 M1A bootstrap observations

Observed on 2026-09-24:

```text
Supabase project health                  OBSERVED / ACTIVE_HEALTHY
user_drive_config table creation         OBSERVED
RLS enabled on user_drive_config         OBSERVED
M1A gsa-mcp Edge Function deployment     OBSERVED / ACTIVE v5
M1A auth-ui source                         IMPLEMENTED / NOT YET DEPLOYED
gsa-auth Edge Function                    DEPRECATED / 410 API response
MCP health endpoint                      OBSERVED / HTTP 200
MCP initialize                            OBSERVED / protocol 2025-11-25
MCP tools/list                            OBSERVED / 4 tools
MCP anonymous tool call                   OBSERVED / get_runtime_status
MCP protected-resource metadata           OBSERVED / HTTP 200
MCP OAuth challenge                       OBSERVED / mcp/www_authenticate
MCP transport OAuth challenge               OBSERVED / HTTP 401 + WWW-Authenticate
Supabase dynamic client registration        OBSERVED / registration_endpoint published
ChatGPT dynamic OAuth client registration    OBSERVED / client register 201
ChatGPT OAuth consent approval               OBSERVED
ChatGPT OAuth token exchange                  OBSERVED / 200
ChatGPT authenticated MCP request             OBSERVED / openai-mcp + authenticated JWT
auth.uid() resolution inside MCP              OBSERVED / Supabase /user 200
Supabase JWT public signing key             OBSERVED / ES256 JWKS
ChatGPT Developer Mode connection         UNKNOWN / UI GATE
Supabase OAuth 2.1 server enablement      OBSERVED / ENABLED
Google provider                          OBSERVED / ENABLED
Google end-user OAuth session               OBSERVED
per-user RLS CRUD under auth.uid()        TO_PROVE
```

The deployed MCP surface has now been protocol-probed from inside Supabase:
- health = HTTP 200;
- MCP initialize = PASS;
- tools/list = PASS with four tools;
- anonymous get_runtime_status = PASS;
- protected-resource metadata = PASS;
- unauthenticated get_profile returns the expected OAuth challenge.

This proves MCP server/protocol/auth signaling, but not end-user OAuth or Project Drive configuration.

Supabase Edge Functions cannot serve HTML; GET text/html is rewritten to text/plain. Therefore the login/consent frontend moved to `auth-ui/` and must be deployed on a frontend host.

Do not promote MCP protocol, OAuth, or per-user configuration to OBSERVED until an actual ChatGPT/MCP client completes the corresponding end-to-end flow.

GSA Drive mutation guard                   IMPLEMENTED / MCP v12
Project Drive outside-scope mutation          DENY BY GSA POLICY/GUARD
Automatic pre-existing-item delete            DENY WITHOUT HUMAN GATE

## 7. Rule

Probe results update capability evidence only.

They do not expand role authority.

Unavailable branch cleanup or Tester runtime capability does not block Phase 2 because coherent fallbacks exist.
