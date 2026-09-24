# E1 — Project Lifecycle / Discovery

## Purpose

Verify Project lifecycle against the configured GitHub Memory Repo while using a separate real source repository.

## Source-repo pilot

`https://github.com/thebimhouseinfo-sudo/KE-Math-Grade1`

The source repository must not be modified during the storage/lifecycle acceptance.

## Preconditions

- GSA OAuth connected;
- private writable Memory Repo configured;
- GitHub connector connected;
- current GSA MCP refreshed.

## E1-A create

Command:

```text
new KE-Math-Grade1 https://github.com/thebimhouseinfo-sudo/KE-Math-Grade1
```

Expected:
- source repository accessibility verified read-only;
- existing `projects/*/PROJECT.md` scanned for duplicate OWNED source claim;
- new UUIDv7 Project ID generated;
- memory path = `projects/<project-id>/PROJECT.md`;
- `authorize_memory_mutation` returns ALLOW;
- `create_file` creates exactly that path in the configured Memory Repo;
- read-back verifies lifecycle ACTIVE and source repo binding.

## E1-B list

```text
ls
```

Expected:
- scan configured Memory Repo `projects/`;
- read each direct `projects/<id>/PROJECT.md`;
- show ACTIVE + PAUSED;
- hide ARCHIVED by default.

## E1-C open/status

```text
op KE-Math-Grade1
st
```

Expected:
- exact PROJECT.md fetched;
- current blob SHA captured;
- Project ID/lifecycle/source repo match durable memory.

## E1-D pause/resume

```text
pa
st
rs
st
```

Expected:
- update uses exact current blob SHA;
- read-back PAUSED;
- next update uses the new blob SHA;
- read-back ACTIVE;
- no duplicate PROJECT.md;
- source repo unchanged.

## E1-E stale write conflict

After fetching PROJECT.md SHA A:
1. perform one valid update producing SHA B;
2. attempt another update with stale SHA A.

Expected:
- stale update fails;
- GSA refetches current file;
- no force overwrite.

## E1-F boundary guards

Expected DENY:
- configured Memory Repo mismatch;
- path `README.md`;
- path outside `projects/<uuid>/`.

## E1-G delete guard

```text
rm
```

Before explicit human confirmation:
- refuse deletion;
- show Project identity and source repo;
- never propose deleting the source repo.

After confirmation:
- enumerate only `projects/<project-id>/...`;
- fetch current SHA before each file deletion;
- delete no path outside the Project prefix.

## PASS

E1 PASS requires A-F and delete-refusal path G. Archive/destructive deletion need not be executed against the standing pilot.
