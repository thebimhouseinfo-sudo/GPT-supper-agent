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

Inside the configured Drive root, every direct Job subfolder is one Job:

```text
<configured Super Agent Drive root>/
├── kid-eschool/
│   └── JOB.json
├── stockmind/
│   └── JOB.json
├── another-project/
│   └── JOB.json
└── ...
```

There is no Job registry and no required `jobs/` wrapper folder.

The exact Drive root folder name chosen by the user does not matter. Super Agent treats its direct child folders as Job candidates.

A valid Job folder is identified by a readable, valid `JOB.json` marker inside that folder.

## 4. Job identity

A Job is the durable unit of work managed by Super Agent.

Its authoritative existence and state live in one Google Drive Job folder:

```text
<configured-root>/<job-id>/
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

Single-repo note:

- GitHub could technically persist much of the Job's planning material inside the repo.
- Super Agent still keeps the Job folder in Drive as the canonical Job identity/control plane.
- This guarantees zero storage-model migration when another repository is later attached.
- Once the Job is multi-repo, Drive becomes the neutral cross-repo memory layer.

Minimum identity:

```json
{
  "id": "kid-eschool",
  "name": "Kid eSchool",
  "status": "active",
  "memory_root": "kid-eschool",
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

Job id must be stable, folder-safe, and unique among direct Job subfolders of the configured Drive root.

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
Check direct Drive subfolders for Job id/name conflict
  ↓
Create Job subfolder with JOB.json status=bootstrapping
  ↓
Resolve GitHub code environment (1..N repos)
  ↓
Validate online read access for every attached repo
  ↓
Create standard subfolders/files inside the Job folder
  ↓
Profile repo/project topology
  ↓
Initialize capability matrix
  ↓
Write initial Job/State/Profile records
  ↓
Validate bootstrap
  ↓
Set JOB.json status=active
  ↓
Open Job
  ↓
Enter DISCOVERY
```

The user is not asked for a Drive link during this flow.

## 7. Standard Job bootstrap

A new Job root is created automatically under:

```text
<configured-root>/<job-id>/
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

Job creation is folder-driven and status-driven.

Recommended sequence:

```text
create <configured-root>/<job-id>/
  ↓
write JOB.json with status=bootstrapping
  ↓
create bootstrap files/subfolders
  ↓
validate attached GitHub code environment
  ↓
complete initial profiling
  ↓
set JOB.json status=active
```

A folder whose `JOB.json` is missing, invalid, `bootstrapping`, or `incomplete` is not treated as an active Job.

If creation fails and cleanup is not possible, set `JOB.json.status = "incomplete"` so `job list` can show or ignore it according to command options without confusing it with a usable Job.

## 10. Job list and selection

`job list` is Drive-first.

It enumerates the direct subfolders of the configured Super Agent Drive root, reads each folder's `JOB.json`, and lists the valid Jobs/projects persisted there.

The Drive folder tree itself is the Job index. There is no separate registry file. The list is therefore a view of Drive-managed Job folders, not a scan of GitHub repositories.

Selecting a Job from the list is equivalent to opening that Drive Job.

## 12. Job open

`job open <id>` always loads Drive state before reading source code:

```text
resolve selected Drive subfolder
→ validate JOB.json and Job memory root
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

The command only needs to enumerate direct child folders of the configured Drive root; it does not recursively scan arbitrary Drive content.

## 12. Job update

Job metadata may be updated for:

- display name
- repo membership
- project classification
- status
- selected online executor/configuration

Adding/removing a repo triggers impact analysis and repo-graph refresh.

## 13. Job archive

Archive preserves Project Memory but removes the Job from the normal active workflow.

```text
active → archived
```

Archive does not delete GitHub code and does not delete durable Project Memory.

Destructive Job deletion, if ever supported, is a separate explicit operation and is not equivalent to archive.

## 14. Job creation states

```text
JOB_CREATE_REQUESTED
ROOT_VALIDATED
FOLDER_CREATED
REPOS_RESOLVED
BOOTSTRAPPING
ACTIVE
```

Failure states:

```text
DRIVE_ROOT_UNAVAILABLE
DRIVE_ROOT_NOT_WRITABLE
JOB_ID_CONFLICT
REPO_ACCESS_BLOCKED
BOOTSTRAP_FAILED
JOB_FOLDER_CONFLICT
INCOMPLETE
```

## 15. Online execution scope

Every Super Agent Job defaults to:

```text
execution_mode = online
```

Super Agent owns online coding orchestration around GitHub, remote CI, remote preview/deployment evidence, and other connected online services.

It does not require or create a local filesystem workspace as part of Job bootstrap.

## 16. Core invariants

1. Drive root is configured once, not once per Job.
2. Each Job is one direct subfolder of the configured Drive root.
3. A Job is a durable work entity stored in Drive, not a repository.
4. Every active Job has an explicit GitHub code environment containing one or more attached repositories.
5. A Job is not active until its bootstrap succeeds and JOB.json is marked active.
6. Source code is never copied into Project Memory.
7. Job reopen depends on durable Drive state + live GitHub state, not chat history.
8. Job creation is online-first and does not assume a local executor.
9. Job selection/open always reads Drive Project Memory before deciding what GitHub source to inspect.
10. GitHub reads are demand-driven and scoped by the active request plus Drive context.
11. There is no global Job registry; the Drive root's direct Job folders are the source of Job discovery.
