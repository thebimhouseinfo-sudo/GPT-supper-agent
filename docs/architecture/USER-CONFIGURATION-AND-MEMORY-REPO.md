# User Configuration and Memory Repo

## 1. Purpose

GSA has one per-user runtime configuration record that identifies the GitHub repository used as durable Project Memory.

The boundaries are:

```text
Supabase Auth
= GSA application-user identity

Supabase user_memory_config
= authenticated user → configured Memory Repo

GitHub Memory Repo
= durable Project/Job/Run/Handoff/Gate/Verification/Knowledge records

GitHub source repositories
= source-code truth for Projects
```

Supabase is configuration only. It must never become the Project Memory database.

## 2. User identity

The user signs in to GSA through Supabase Auth with Google.

Authoritative database key:

`auth.users.id / auth.uid()`

Verified email is a human-readable account label, not the primary durable key.

No custom username/password or manually typed email is treated as identity proof.

## 3. Stable configuration record

Initial schema:

```text
user_memory_config
------------------
user_id
email
memory_repo_id
memory_repo_full_name
memory_repo_url
default_branch
created_at
updated_at
```

One authenticated user has one stable row.

Changing Memory Repo updates that same row in place. No config revision counter is required.

## 4. Memory Repo requirements

The configured Memory Repo must be:

- a GitHub repository reachable through the connected GitHub app;
- private;
- writable by the connected GitHub identity;
- selected explicitly by the user;
- separate in authority from Project source repositories.

Setup flow:

```text
SETTING → Memory Repo
→ user pastes GitHub repo URL
→ GitHub get_repo
→ verify repository identity / private visibility / push permission
→ set_memory_repo_config
→ Supabase stores stable mapping
```

GSA does not store GitHub access tokens.

## 5. Canonical repository identity

Store both:
- stable GitHub numeric repository ID;
- current `owner/name`;
- canonical repository URL;
- default branch.

The numeric repository ID is the stable identity anchor.

Before consequential memory writes, the GitHub connector should resolve the target repository and ensure it is the configured repository. A repository rename may update `memory_repo_full_name` in the same stable config row after the numeric ID is confirmed unchanged.

## 6. Hard mutation boundary

GSA Memory writes are allowed only when:

```text
target repository
= configured memory_repo_id / memory_repo_full_name

AND

target path
= projects/<project-id>/...
```

Everything else is denied.

The runtime guard `authorize_memory_mutation` fails closed on:
- wrong repository;
- path outside `projects/<uuid>/`;
- malformed Project ID;
- delete without the required Human Gate.

Source repositories are not inside this mutation boundary.

## 7. Project Memory layout

Logical layout inside the Memory Repo:

```text
projects/
└── <project-id>/
    ├── PROJECT.md
    ├── CONTROL.json
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

Git does not preserve empty directories. Directories materialize only when a record is created.

## 8. Concurrency

GitHub blob SHA is the write precondition.

```text
fetch file
→ current blob SHA
→ update_file/delete_file with exact SHA
→ stale SHA fails
→ refetch/reconcile
```

GSA must never force-overwrite a stale record merely to complete an operation.

Unique append records use unique IDs in paths, reducing shared-write contention.

## 9. Project source repository separation

Each Project's `PROJECT.md` declares OWNED/REFERENCED source repositories.

The Memory Repo stores governance/control records; it is not automatically an OWNED implementation repository for Project source work.

A Project source repo must not be silently substituted for the configured Memory Repo.

## 10. Missing configuration

If no Memory Repo is configured:

```text
MEMORY_REPO_REQUIRED
→ show SETTING → Memory Repo
→ block durable Project-memory work
```

Do not infer the repository from chat history or from a source-repo URL.

## 11. Invariants

1. Supabase Auth identifies the GSA user.
2. Supabase stores only per-user runtime configuration.
3. GitHub Memory Repo is the durable Project control plane.
4. Source repositories remain source-code truth.
5. Memory writes are confined to the exact configured repository and `projects/<project-id>/...`.
6. Blob SHA optimistic concurrency is mandatory for update/delete.
7. Changing Memory Repo updates the same stable user config row.
8. Chat history is never authoritative for the current Memory Repo.
