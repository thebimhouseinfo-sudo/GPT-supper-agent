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

A Job is the durable unit of work managed by Super Agent.

Its authoritative existence and state live in one Google Drive Job folder:

```text
<configured-root>/jobs/<job-id>/
```

A Job is NOT a GitHub repository and is NOT defined by where the code lives.

The code environment is a separate property of the Job and currently consists of one or more GitHub repositories attached to that Job.

Therefore:

```text
Job
= durable work state in Google Drive

Code Environment
= 1..N GitHub repositories

Project
= logical product/system context inferred or recorded for the Job
```

A Job may represent an ongoing project, a major change, a migration, a feature stream, or another coherent unit of work. Multiple Jobs may reference the same GitHub repository when governance permits.

Minimum identity:

```json
{
  "id": "kid-eschool",
  "name": "Kid eSchool",
  "status": "active",
  "memory_root": "jobs/kid-eschool",
  "execution_mode": "online",
  "code_environment": {
    "type": "github",
    "repositories": [
      "thebimhouseinfo-sudo/Kideschool",
      "thebimhouseinfo-sudo/KE-Math-Grade1"
    ]
  }
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

The minimum user-supplied information is the Job identity plus enough GitHub repository context to establish its code environment.

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
Resolve GitHub code environment (1..N repos)
  ↓
Validate online read access for every attached repo
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

## 8. GitHub code environment discovery during creation

For each supplied or discovered repo in the Job's code environment, Super Agent reads repository metadata and enough source structure to determine:

- repository identity
- likely role
- tech stack
- project relationship
- single-repo vs multi-repo status
- shared contracts/providers/consumers when discoverable
- online verification facilities such as CI/workflows and preview deployment hooks

Additional GitHub repos may be attached later to the same Job. Attaching a repo changes the Job's code environment and triggers repo-graph/impact refresh; it does not require creating a new Job.

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
      "code_environment": {
        "type": "github",
        "repositories": [
          "thebimhouseinfo-sudo/Kideschool"
        ]
      },
      "execution_mode": "online"
    }
  ]
}
```

## 11. Job list and selection

`job list` is Drive-first.

It reads `registry.json` from the configured Super Agent Drive root and lists the Jobs/projects persisted there.

The list is therefore a view of Drive-managed Jobs, not a scan of GitHub repositories.

Selecting a Job from the list is equivalent to opening that Drive Job.

## 12. Job open

`job open <id>` always loads Drive state before reading source code:

```text
resolve registry entry from Drive
→ validate Job memory root
→ read JOB.json
→ read STATE.json
→ read Project Profile
→ read Repo Graph
→ read relevant decisions/contracts/plans/tasks/reviews
→ understand current user request
→ determine which repo(s) are relevant
→ determine which paths/files/symbols in those repo(s) are relevant
→ read only the required GitHub evidence
→ refresh applicable online capabilities/evidence
→ revalidate stale artifacts
→ resume/work from durable state
```

Invariant:

> DRIVE FIRST, GITHUB SECOND, SELECTIVE SOURCE READ.

Super Agent MUST NOT begin by scanning all attached repositories when opening a Job.

Drive Memory determines which repository and which source area should be inspected for the current request.

Examples:

```text
User asks about shared child-profile contract
→ Drive says provider = Kideschool, consumers = Math/English/Typing
→ inspect relevant contract/provider/consumer code only

User asks to fix Math lesson UI
→ Drive identifies KE-Math-Grade1 + relevant UI plan/design
→ inspect only relevant Math repo paths/components first

User asks for Job status
→ answer from Drive state/reviews/tasks
→ GitHub read may be unnecessary unless freshness verification is needed
```

Chat history is not required to reopen a Job.

## 13. Job list command behavior

`job list` reads Drive `registry.json` and shows active/paused/archived Jobs plus their high-level state. Each entry may show attached GitHub repos as metadata, but GitHub is not the source of the Job list.

It does not recursively scan all Drive folders unless registry recovery is required.

## 14. Job update

Job metadata may be updated for:

- display name
- repo membership
- project classification
- status
- selected online executor/configuration

Adding/removing a repo triggers impact analysis and repo-graph refresh.

## 15. Job archive

Archive preserves Project Memory but removes the Job from the normal active workflow.

```text
active → archived
```

Archive does not delete GitHub code and does not delete durable Project Memory.

Destructive Job deletion, if ever supported, is a separate explicit operation and is not equivalent to archive.

## 16. Job creation states

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

## 17. Online execution scope

Every Super Agent Job defaults to:

```text
execution_mode = online
```

Super Agent owns online coding orchestration around GitHub, remote CI, remote preview/deployment evidence, and other connected online services.

It does not require or create a local filesystem workspace as part of Job bootstrap.

## 18. Core invariants

1. Drive root is configured once, not once per Job.
2. Job folders are created automatically below the configured root.
3. A Job is a durable work entity stored in Drive, not a repository.
4. Every active Job has an explicit GitHub code environment containing one or more attached repositories.
5. A Job is not active until bootstrap and registry update succeed.
6. Source code is never copied into Project Memory.
7. Job reopen depends on durable Drive state + live GitHub state, not chat history.
8. Job creation is online-first and does not assume a local executor.
9. Job selection/open always reads Drive Project Memory before deciding what GitHub source to inspect.
10. GitHub reads are demand-driven and scoped by the active request plus Drive context.
