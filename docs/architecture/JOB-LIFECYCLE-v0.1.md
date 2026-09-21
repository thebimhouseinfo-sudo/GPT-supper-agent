# Job Lifecycle & Drive Root Model v0.1

## 1. Purpose

Super Agent uses one Google Drive root folder configured once for the installation/account.

Creating a Job MUST NOT require the user to provide or approve a new Google Drive link.

Core invariant:

> ONE CONFIGURED SUPER AGENT DRIVE ROOT; MANY AUTO-MANAGED JOB SUBFOLDERS.

## 2. One-time Drive configuration

Super Agent has a configured root reference:

```text
SUPER_AGENT_DRIVE_ROOT
```

This is established once through plugin/app configuration.

The configuration stores a stable Drive folder reference/id, not a per-Job URL supplied in chat.

Super Agent validates that the root is reachable and writable before Job operations.

The configured root is infrastructure state, not project state.

## 3. Root layout

Inside the configured Drive root:

```text
SuperAgent/
├── registry.json
├── knowledge/
│   ├── engineering/
│   ├── platforms/
│   ├── domains/
│   └── lessons/
└── jobs/
    ├── <job-id>/
    ├── <job-id>/
    └── ...
```

The exact Drive folder name chosen by the user does not matter. Super Agent treats the configured folder itself as the root.

## 4. Job identity

A Job represents one software project/change workspace and may contain one or many GitHub repositories.

Minimum identity:

```json
{
  "id": "kid-eschool",
  "name": "Kid eSchool",
  "status": "active",
  "memory_root": "jobs/kid-eschool",
  "execution_mode": "online"
}
```

Job id must be stable, URL/path safe, and unique within the registry.

## 5. Job creation inputs

A Job can be created from natural language or a deterministic command.

Examples:

```text
@SuperAgent job create Kid eSchool
@SuperAgent job create Kid eSchool repo thebimhouseinfo-sudo/Kideschool
@SuperAgent job create Kid eSchool repos <repo-a> <repo-b> ...
```

The minimum user-supplied information is the project/job identity plus enough GitHub repository context to discover the project.

If the current chat already contains the relevant repo/project identity, Super Agent should reuse it rather than asking again.

## 6. Job Create workflow

```text
JOB CREATE request
  ↓
Validate configured Drive root
  ↓
Resolve / normalize Job name + id
  ↓
Check registry for duplicate/conflict
  ↓
Resolve GitHub repo(s)
  ↓
Validate online read access
  ↓
Create temporary Job root
  ↓
Create standard subfolders/files
  ↓
Profile repo/project topology
  ↓
Initialize capability matrix
  ↓
Write initial Job/State/Profile records
  ↓
Register Job in registry.json
  ↓
Finalize Job root
  ↓
Open Job
  ↓
Enter DISCOVERY
```

The user is not asked for a Drive link during this flow.

## 7. Standard Job bootstrap

A new Job root is created automatically under:

```text
<configured-root>/jobs/<job-id>/
```

Initial structure:

```text
<job-id>/
├── JOB.json
├── PROJECT.md
├── PROJECT-PROFILE.json
├── ARCHITECTURE.md
├── STATE.json
├── REPO-GRAPH.json
├── KNOWLEDGE-PROFILE.json
├── CAPABILITY-MATRIX.json
├── decisions/
├── contracts/
├── plans/
├── tasks/
├── reviews/
├── approvals/
├── design/
│   ├── brief/
│   ├── concepts/
│   ├── asset-sheet/
│   └── reviews/
├── lessons/
└── repos/
```

Not every file needs complete content at creation. Unknown fields are initialized explicitly as unresolved rather than fabricated.

## 8. GitHub project discovery during creation

For each supplied or discovered repo, Super Agent reads repository metadata and enough source structure to determine:

- repository identity
- likely role
- tech stack
- project relationship
- single-repo vs multi-repo status
- shared contracts/providers/consumers when discoverable
- online verification facilities such as CI/workflows and preview deployment hooks

For multi-repo projects, additional repos may be attached later without creating a new Job.

## 9. Atomic creation behavior

Job creation should be effectively transactional.

Recommended sequence:

```text
jobs/<job-id>.creating/
  ↓ bootstrap succeeds
registry update succeeds
  ↓
rename/finalize as jobs/<job-id>/
```

If creation fails before registration, the Job is not considered active.

If cleanup is not possible, mark the temporary root as INCOMPLETE and exclude it from normal Job listing until repaired.

## 10. Registry update

Only after bootstrap succeeds is the Job added to `registry.json`.

Example:

```json
{
  "jobs": [
    {
      "id": "kid-eschool",
      "name": "Kid eSchool",
      "status": "active",
      "memory_root": "jobs/kid-eschool",
      "repos": [
        "thebimhouseinfo-sudo/Kideschool"
      ],
      "execution_mode": "online"
    }
  ]
}
```

## 11. Job open

`job open <id>`:

```text
resolve registry entry
→ validate memory root
→ load STATE
→ load project profile/repo graph
→ refresh current online capabilities
→ inspect relevant live GitHub state
→ revalidate stale artifacts
→ resume from durable state
```

Chat history is not required to reopen a Job.

## 12. Job list

`job list` reads `registry.json` and shows active/paused/archived Jobs plus their high-level state.

It does not recursively scan all Drive folders unless registry recovery is required.

## 13. Job update

Job metadata may be updated for:

- display name
- repo membership
- project classification
- status
- selected online executor/configuration

Adding/removing a repo triggers impact analysis and repo-graph refresh.

## 14. Job archive

Archive preserves Project Memory but removes the Job from the normal active workflow.

```text
active → archived
```

Archive does not delete GitHub code and does not delete durable Project Memory.

Destructive Job deletion, if ever supported, is a separate explicit operation and is not equivalent to archive.

## 15. Job creation states

```text
JOB_CREATE_REQUESTED
ROOT_VALIDATED
REPOS_RESOLVED
BOOTSTRAPPING
REGISTERING
ACTIVE
```

Failure states:

```text
DRIVE_ROOT_UNAVAILABLE
DRIVE_ROOT_NOT_WRITABLE
JOB_ID_CONFLICT
REPO_ACCESS_BLOCKED
BOOTSTRAP_FAILED
REGISTRY_CONFLICT
INCOMPLETE
```

## 16. Online execution scope

Every Super Agent Job defaults to:

```text
execution_mode = online
```

Super Agent owns online coding orchestration around GitHub, remote CI, remote preview/deployment evidence, and other connected online services.

It does not require or create a local filesystem workspace as part of Job bootstrap.

## 17. Core invariants

1. Drive root is configured once, not once per Job.
2. Job folders are created automatically below the configured root.
3. A Job is not active until bootstrap and registry update succeed.
4. Source code is never copied into Project Memory.
5. Job reopen depends on durable Drive state + live GitHub state, not chat history.
6. Job creation is online-first and does not assume a local executor.
