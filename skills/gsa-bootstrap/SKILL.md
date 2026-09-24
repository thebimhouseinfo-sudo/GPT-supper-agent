---
name: gsa-bootstrap
description: Bootstrap and verify the GPT Super Agent runtime before Project work.
---

# GPT Super Agent bootstrap

Use this skill only for Phase-2 M1A bootstrap and runtime verification.

1. When GSA runtime availability is unknown, call `get_runtime_status`.
2. Treat the current public bootstrap MCP endpoint as read-only.
3. Do not infer or claim a signed-in application user from this bootstrap tool.
4. Do not infer a Project Drive root from chat memory or from the MCP endpoint.
5. Until OAuth is observed end to end, report authentication as unproven.
6. GSA authentication is only for GSA identity/configuration. Never present Google Drive connection as part of GSA account setup.
7. Google Drive is an external ChatGPT connector. Use it only to select/probe the user's chosen Project Drive folder.
8. Project work requiring a Drive root remains blocked until both GSA identity is known and write authority for the selected folder has been verified. Prefer permission metadata; create/delete probe is fallback only.

This bootstrap skill is intentionally small. Full Orchestrator/role workflows are added only after M1A proves the loading and authentication path.


## URL-first routing

When the user provides a recognized connected-app URL, treat the URL as the target and use the matching connected app automatically.

Examples:
- Google Drive folder/document URL → use Google Drive;
- GitHub repository/PR/file URL → use GitHub.

Do not require the user to type `@Google Drive` or `@GitHub` when the provider is already identifiable from the URL.

The connector may still be invoked internally; this rule concerns user-facing syntax only.

For Project Drive setup:
1. pick up the pasted Google Drive folder URL;
2. use Google Drive `get_profile` to resolve the actual connected Drive account;
3. use `get_file_metadata` on the target folder and inspect permissions;
4. if the connected Drive email has role `owner`, `writer`, `organizer`, or `fileOrganizer`, write authority is verified without a destructive probe;
5. only if permission metadata is insufficient, use the create/delete probe fallback;
6. never assume the GSA/Supabase email equals the Google Drive connector email;
7. call GSA `set_drive_config` only after authority is verified.


## Hard Drive mutation sandbox

The configured Project Drive folder is the absolute boundary for every Google Drive mutation initiated by GSA.

Before create/update/move/delete:
1. call GSA `get_drive_config`;
2. obtain the canonical Project Drive root ID;
3. resolve the target item or parent by exact Drive ID;
4. prove the target is the root itself or a descendant by following parent IDs;
5. if ancestry is missing, ambiguous, or outside the root: STOP.

Forbidden:
- using Google Drive literal `root` as a mutation parent;
- creating anything outside Project Drive;
- moving anything across the Project Drive boundary;
- deleting by filename/title;
- deleting pre-existing user content automatically.

Automatic delete is allowed only when:
- the item was created by GSA in the same Run;
- its exact returned Drive ID was recorded;
- its ancestry is still inside Project Drive.

Any deletion of pre-existing user content requires an explicit Human Gate naming the exact Drive item ID.

Fallback Project Drive probe:
- create one direct child under the configured Project Drive;
- record returned ID;
- delete only that exact ID;
- never create at My Drive root and never move the probe afterward.


## CLI shortcuts

Root groups have no shortcuts:

```text
PROJECT
DIRECT AGENT
SETTING
HELP
```

Stable subcommand aliases:

```text
PROJECT:
list=ls, open=op, create=new, status=st,
pause=pa, resume=rs, archive=ar, delete=rm

DIRECT AGENT:
planner=pl, designer=ds, coder=cd, reviewer=rv, tester=ts

SETTING:
GSA Account=acct, Project Drive=drive

HELP:
instruction=guide, command help=help
```

Display each subcommand as:

```text
command [shortcut] — short description
```

Treat the shortcut exactly as its canonical subcommand. Do not invent extra aliases.
