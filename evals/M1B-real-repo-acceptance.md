# M1B Real-Repo Acceptance Evidence — KE-Math-Grade1

## Status

```text
HANDLERS = IMPLEMENTED
RUNTIME = GSA MCP v19
PURE_SELFTEST = PASS
REAL_REPO_STORAGE_PATH = PASS
CHAT_PLUGIN_COMMAND_ACCEPTANCE = PENDING USER REFRESH/TEST
M1B_GATE = NOT YET DECLARED
```

## Runtime self-test

Observed through the deployed Edge Function:

```text
HTTP /selftest = 200
pass = true
uuidv7_shape = true
manifest_parse = true
pause_transition = true
resume_transition = true
repo_normalization = true
invalid_repo_rejected = true
```

Temporary PostgreSQL HTTP probe extension was removed after the check.

## Real repository

Target:

`thebimhouseinfo-sudo/KE-Math-Grade1`

Observed:
- repository accessible;
- default branch = `main`;
- connector reports push/admin access;
- no source mutation performed during this acceptance run.

## Real Project Memory

A Project folder for the real repository was created as a direct child of the selected Project Drive.

Security evidence:
- every mutation in this acceptance run targeted the selected Project Drive or descendants;
- no My Drive root mutation was used;
- no unrelated user item was deleted;
- Drive IDs are intentionally not persisted in this GitHub evidence file.

Verified structure:

```text
<Project>/
├── PROJECT.md
├── WORK/
│   ├── jobs/
│   ├── runs/
│   ├── handoffs/
│   ├── gates/
│   ├── assets/
│   └── releases/
├── KNOWLEDGE/
└── VERIFICATION/
```

`PROJECT.md` read-back verified:
- canonical UUIDv7-class Project ID;
- name = KE-Math-Grade1;
- lifecycle = ACTIVE;
- repo relation = OWNED;
- repo URL points to the real repository.

## Lifecycle evidence

Observed against the real Project Memory document:

```text
ACTIVE → PAUSED    PASS
read-back PAUSED   PASS
PAUSED → ACTIVE    PASS
read-back ACTIVE   PASS
```

The GitHub source repository was not modified.

## Handler coverage implemented

PROJECT:
- project_list
- project_create
- project_open
- project_status
- project_pause
- project_resume
- project_archive
- project_delete

DIRECT AGENT:
- start_direct_agent with planner/designer/coder/reviewer/tester roles

SETTING:
- get_profile
- get_drive_config
- set_drive_config
- authorize_drive_mutation

HELP:
- get_instruction
- get_command_help

## Remaining acceptance

The personal GSA plugin must be refreshed so ChatGPT discovers the new tool schemas. Then run E1 from the user-facing shortcuts.

The standing pilot should remain ACTIVE after the test unless the human explicitly chooses to test archive/delete.
