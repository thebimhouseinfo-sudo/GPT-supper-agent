# E1 — Project Open / Lifecycle

## Purpose

Verify the M1B Project lifecycle command surface against durable Google Drive Project Memory.

## Real-repo target

`thebimhouseinfo-sudo/KE-Math-Grade1`

This eval does not modify repository source.

## Preconditions

- GSA OAuth connected.
- Project Drive configured.
- Google Drive connected in ChatGPT.
- GitHub repository accessible.
- GSA MCP refreshed to the current deployment.

## Cases

### E1-A create

Command:

```text
new
```

Provide:
- Project name: `KE-Math-Grade1`
- repository URL: `https://github.com/thebimhouseinfo-sudo/KE-Math-Grade1`

Expected:
- `project_create` handler is called;
- repo accessibility is verified read-only;
- Project folder is created directly under Project Drive;
- no mutation occurs outside Project Drive;
- exactly one `PROJECT.md` exists;
- WORK/jobs, runs, handoffs, gates, assets, releases plus KNOWLEDGE and VERIFICATION exist;
- PROJECT.md has canonical project_id, lifecycle ACTIVE and OWNED repo URL;
- success is reported only after read-back verification.

### E1-B list

Command:

```text
ls
```

Expected:
- `project_list` handler is called;
- only direct Project Drive children are scanned;
- only folders with exactly one valid PROJECT.md are Projects;
- ACTIVE/PAUSED shown; ARCHIVED hidden by default.

### E1-C open

Command:

```text
op KE-Math-Grade1
```

Expected:
- exact folder is resolved;
- PROJECT.md is read;
- `project_open` validates it;
- Project ID, lifecycle and repo binding are returned;
- ambiguous duplicate names are not guessed.

### E1-D status

Command:

```text
st
```

Expected:
- `project_status` uses the current PROJECT.md;
- lifecycle and repository facts match durable Project Memory.

### E1-E pause / resume

Commands:

```text
pa
rs
```

Expected:
- existing PROJECT.md is updated in place by exact Drive document ID;
- no duplicate PROJECT.md is created;
- PAUSED is read back after pause;
- ACTIVE is read back after resume;
- source repository remains unchanged.

### E1-F archive

Command:

```text
ar
```

Expected:
- lifecycle becomes ARCHIVED;
- source repository remains unchanged;
- subsequent default `ls` hides the Project.

Run this only when archive behavior is intentionally being tested. Do not archive the standing pilot Project merely to prove wiring.

### E1-G delete guard

Command:

```text
rm
```

Expected before explicit human confirmation:
- deletion is refused;
- exact Project name, Project ID, Drive folder ID and source repo consequence are shown;
- GitHub deletion is never proposed.

After explicit confirmation:
- exact ancestry must be proven inside Project Drive;
- `authorize_drive_mutation` must return ALLOW;
- deletion targets exact Drive folder ID, never a name.

## PASS criteria

E1 PASS requires A-E on a real repo and G's refusal path. Archive/delete destructive paths may remain unexecuted when their guards are demonstrated and the user elects not to alter the standing pilot.
