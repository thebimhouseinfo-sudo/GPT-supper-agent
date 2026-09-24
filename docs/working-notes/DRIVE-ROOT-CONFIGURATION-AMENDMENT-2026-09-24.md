# Drive Root Configuration Architecture Amendment — 2026-09-24

## Status

```text
DECISION = HUMAN-APPROVED
SCOPE = USER CONFIGURATION / DRIVE ROOT RESOLUTION
PHASE_1_FOUNDATION = AMENDED
IMPLEMENTATION = NOT YET PROVEN
```

## Decision

The shared GitHub repository must not contain a user's physical Google Drive root.

`SUPER_AGENT_DRIVE_ROOT` remains the stable logical name used by the harness.

The physical Google Drive folder is resolved from per-user runtime configuration.

Initial implementation choice:

```text
Supabase
→ one stable config record per user
→ drive_root_folder_id
→ SUPER_AGENT_DRIVE_ROOT
```

## Stable-record rule

One user has one stable root configuration record.

Changing Google Drive folder:

```text
same user_id
→ replace drive_root_folder_id
→ update display metadata/timestamp as needed
```

No configuration revision counter is used.

No new config identity is created merely because the selected folder changed.

## Authority and persistence

Authoritative:
- current per-user configuration store value;
- Google Drive folder ID as physical locator.

Non-authoritative:
- prior chat memory;
- prior context packets;
- human-readable Drive path/name;
- hardcoded value in GitHub.

The plugin/harness resolves the current root when root-scoped work is needed.

## Supabase boundary

Supabase is approved only as the initial per-user plugin/runtime configuration store.

It does not replace:

```text
Google Drive = Project memory/control plane
GitHub = source-code truth
```

Project/Job/Task/Run/Verification state remains outside Supabase unless a later explicit architecture decision changes that boundary.

## Security baseline

- enable Row Level Security;
- user may read/write only their own config row;
- do not commit privileged Supabase credentials;
- arbitrary prompt/repo content cannot override the authorized root setting.

## Canonical files amended

- `FROZEN-FOUNDATION-v0.1.md` internal version 0.5;
- `ARCHITECTURE-v0.1.md` internal version 0.5;
- `PROJECT-MEMORY-v0.1.md` internal version 1.3;
- `SECURITY-AND-TRUST-BOUNDARIES-v0.1.md` internal version 1.2;
- `DOCUMENT-INDEX-v1.md` internal version 1.4;
- new `USER-CONFIGURATION-AND-DRIVE-ROOT-v1.md`.

Phase-2 execution documents were aligned to include the Supabase root resolver, RLS/isolation checks and change-in-place behavior.

## Implementation proof still required

Before relying on this operationally, Phase 2 must prove:

1. create/read the current user's config;
2. update the same record to a different folder ID;
3. subsequent resolution uses the new folder;
4. user A cannot read/update user B's row;
5. missing config yields `CONFIG_REQUIRED` rather than inferred/hardcoded root.
