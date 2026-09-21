# DOMAIN DETAIL — Project v0.1

## Status

```text
PHASE = THEORY DETAIL
DOMAIN = PROJECT
STATUS = WORKING_DRAFT
CANONICAL = false
```

This document is the first domain-detail pass under the theory-construction meta-loop:

```text
DETAIL
→ COLLECT
→ REVIEW
→ SYNTHESIZE
→ FIX
→ repeat
```

It does not yet rewrite the older canonical architecture files that still use the obsolete Job-as-Drive-root model.

Those older files must be reconciled in a later COLLECT/REVIEW/FIX pass.

---

## 1. Project definition

A Project is the long-lived durable product/system context managed by GPT Super Agent.

```text
Project
= one durable Google Drive Project root
= persistent product/system memory + control plane
= owner of 1..N writable GitHub repositories when repositories exist
= parent context for many finite Jobs
= survives chats, Runs, Jobs, releases, pauses and later reactivation
```

A Project is NOT:

- a chat;
- a Job;
- a Task;
- a Run;
- a GitHub repository;
- a branch;
- a pull request;
- a release;
- a temporary agent session.

A Project may continue for months or years and may contain many completed and active Jobs.

---

## 2. Project hierarchy

The current domain hierarchy is:

```text
Project
└── Job
    └── Task
        └── Run
```

Semantics:

```text
Project
= durable product/system context

Job
= finite unit of work inside the Project

Task
= smaller work package inside a Job

Run
= one execution attempt/session for one Job/Task context
  with one active role for attribution
```

A Project can have many Jobs over time.

A Job does not own the Project.

Completing a Job does not complete the Project.

---

## 3. Project as Drive-root entity

GPT Super Agent has one configured Google Drive root:

```text
SUPER_AGENT_DRIVE_ROOT
```

Each Project is one direct child folder of that configured root.

Conceptually:

```text
SUPER_AGENT_DRIVE_ROOT/
├── Project-A/
│   └── PROJECT.md
├── Project-B/
│   └── PROJECT.md
└── Project-C/
    └── PROJECT.md
```

The Project folder is the durable memory/control-plane root for that Project.

Conversation remains the interaction UI, not durable Project memory.

---

## 4. Project marker

Every valid Project folder has:

```text
PROJECT.md
```

`PROJECT.md` is a bootstrap artifact intrinsic to Project identity.

It serves as:

- Project marker;
- Project identity document;
- human-readable entry point;
- compact machine-readable metadata source where appropriate.

The exact final schema is intentionally deferred until the storage/model synthesis pass.

The existence and role of `PROJECT.md` are already justified and do not depend on later storage-layout decisions.

---

## 5. Project discovery

Project discovery is Drive-first.

Conceptually:

```text
SUPER_AGENT_DRIVE_ROOT
→ enumerate direct child folders
→ detect valid PROJECT.md
→ recognize Project
```

A GitHub repository is not used as the discovery root for an existing Project.

A chat is not used as the discovery root.

No GitHub scan is required to discover Projects.

Whether a separate Project index/cache is useful is intentionally deferred until the storage/access-pattern COLLECT pass. The Drive folder + marker model remains the semantic source of Project existence.

---

## 6. Project open

Opening a Project means re-entering its durable context.

Current outer CLI semantics:

```text
project open
→ show active working Projects only
→ user chooses Project
→ load Project durable context first
→ then determine which Job/work context to resume
→ selectively read live GitHub evidence only when needed
```

Archived Projects do not appear in the everyday Open list.

The purpose is to keep the normal working set short even when the user has accumulated many historical Projects.

Core load principle:

```text
DRIVE PROJECT CONTEXT FIRST
→ CURRENT REQUEST / CURRENT JOB
→ RELEVANT REPO
→ RELEVANT SOURCE AREA
→ SELECTIVE LIVE GITHUB READ
```

Opening a Project must not trigger a broad scan of every owned/reference repository by default.

---

## 7. Project status/history view

`project status` is the complete Project-management/history view.

Conceptually:

```text
project status
→ list all Projects
→ include archived Projects
→ show lifecycle state
→ user selects Project
→ inspect/change lifecycle state when allowed
```

This is the path for restoring an old Project to the active working set.

Therefore:

```text
OPEN
= short current working set

STATUS
= complete Project registry/history view
```

---

## 8. Project lifecycle vs release completion

Project lifecycle and product/release completion are separate dimensions.

### 8.1 Lifecycle

Current accepted lifecycle vocabulary:

```text
ACTIVE
PAUSED
ARCHIVED
```

Semantics:

```text
ACTIVE
= part of the current working set and may receive/continue Jobs

PAUSED
= intentionally not progressing for now but retained as live durable context

ARCHIVED
= removed from normal active work while preserving Project memory/history
```

A Project may return from PAUSED or ARCHIVED to ACTIVE.

The exact UI treatment of PAUSED in `project open` is a remaining semantic decision to confirm during review if not already implied by the final CLI UX.

### 8.2 Release/product milestones

A Project may record completed release milestones independently of lifecycle.

Examples:

```text
DONE_BETA
DONE_V1
DONE_WEB_V1
DONE_EXE_V1
DONE_MOBILE_V1
DONE_V2
```

This vocabulary is Project-specific, not a closed global enum.

Example:

```text
Project: CadGPT
lifecycle: ACTIVE

completed milestones:
- DONE_BETA
- DONE_EXE_V1

current work:
- V1.1 improvements
```

A completed release does not force Project lifecycle to ARCHIVED.

---

## 9. Project deletion

Project deletion is distinct from archive.

```text
ARCHIVE
= preserve Project memory
= remove from normal active working set

DELETE
= permanently delete the Project Drive folder/control-plane memory
```

The user explicitly wants true Project deletion for obsolete Projects.

Typical reason:

```text
old source/repository/version has been discarded
→ corresponding Project memory has no future value
→ delete Project
```

Project deletion applies to the Drive Project folder.

It must NOT be silently interpreted as permission to delete GitHub repositories, deployments, external accounts, or other external resources.

Those are separate destructive actions requiring their own explicit intent/capability.

The exact confirmation/recovery policy is deferred to the Project persistence/safety definition.

---

## 10. Repository relationship model

A Project may interact with GitHub repositories in two fundamentally different relationships:

```text
OWNED
REFERENCED
```

### 10.1 Owned repositories

```text
owned repository
= writable source-code environment of this Project
```

Rules:

- one Project may own one or many repositories;
- one repository may be owned by only one GSA Project at a time;
- only the owning Project may treat that repository as writable Project source;
- repository ownership change/transfer is a governance event requiring explicit human approval.

Conceptually:

```text
Project A
├── owns Repo 1
├── owns Repo 2
└── owns Repo 3
```

### 10.2 Referenced repositories

```text
referenced repository
= read-only external source/context
```

A referenced repository may be inspected for:

- contracts;
- APIs;
- dependency understanding;
- implementation patterns;
- examples;
- compatibility analysis;
- source context.

A referenced repository MUST NOT be modified in place by the referencing Project.

Many Projects may reference the same repository.

### 10.3 Deriving editable code from a reference

If a Project wants to adapt code from a referenced repository:

```text
referenced source
→ copy / fork / clone selected code
→ place it in a destination owned by this Project
→ preserve provenance
→ edit only the owned destination
```

If the original referenced repository itself must change:

```text
requesting Project
→ routes dependency/change need to owning Project
→ owning Project performs its own code-change workflow
→ requesting Project consumes resulting release/contract/outcome
```

---

## 11. Repository ownership is not Job ownership

Repositories belong to the Project, not to individual Jobs.

A Job operates within the Project's code environment.

Therefore:

```text
Project
owns Repo A + Repo B

Job J-001
→ may modify Repo A

Job J-002
→ may modify Repo B

Job J-003
→ may coordinate Repo A + Repo B
```

The Detailed Execution Plan determines the actual write scope of each Job/Task.

A Job does not gain ownership of a repository merely by touching it.

---

## 12. Multiple active Jobs

A Project may contain multiple active Jobs simultaneously.

This is an intentional capability because ChatGPT can support multiple conversations and different work streams can progress independently.

Examples:

```text
Chat A
→ Coder continues implementation Job

Chat B
→ Designer produces assets for another Job

Chat C
→ Reviewer reviews an already-completed milestone
```

Parallelism is controlled by dependency and conflict rules:

```text
parallel if independent
sequential if causally dependent
blocked/coordinate if write-conflicting
```

The Detailed Execution Plan/milestone topology must indicate when parallel work is permitted.

Separate chats do not automatically imply safety.

Potential conflicts include:

- same branch;
- same files/components;
- shared schema/contract;
- shared migration/data structure;
- one Job changing assumptions consumed by another;
- release-critical shared artifact.

Conflict handling belongs to the cross-Job coordination/Causal Change Review model.

---

## 13. Project relationship to Jobs

A Project is not "done" when one Job finishes.

Conceptually:

```text
Project: KE Math Grade 1

Job A
= shell/design readiness work
→ completed

Job B
= representative lesson pilot
→ completed

Job C
= asset production
→ active

Job D
= content scale-out
→ active
```

Jobs are finite execution/governance units.

Project is the durable parent context.

Exact Job lifecycle is defined in the Job domain pass, not here.

---

## 14. Project relationship to Runs/chats

A Project may be accessed from many chats over time.

Chat identity is not Project identity.

```text
Chat 1
→ Run R1 in Project P

Chat 2
→ Run R2 in Project P

Chat 3
→ Run R3 in Project P
```

The Project must be reopenable without relying on previous chat history.

Durable state needed for future work belongs to Project memory according to the eventual storage model.

Temporary tool chatter, hidden reasoning, conversational filler, and transient guesses do not become Project memory merely because they occurred in a Project chat.

---

## 15. Project memory responsibility

Project Memory answers:

```text
What is this Project?
What has it decided?
What work exists?
What is currently active?
What durable obligations remain?
What source environments does it own/reference?
What releases/milestones have been completed?
What context must survive chat boundaries?
```

Project Memory is not source-code storage.

```text
Google Drive
= durable Project state/control-plane truth

GitHub
= source-code truth
```

The exact Project Memory physical tree must NOT be nominated during this Project domain pass.

Storage layout will be synthesized only after the Agent/Job/Task/Run/Test/Asset/Release domains expose their real read/write/persistence requirements.

Bootstrap exception:

```text
PROJECT.md
```

is already justified as the Project identity marker.

---

## 16. Project initialization — semantic responsibilities

`project new` creates a new durable Project context.

At semantic level, initialization must establish enough information to answer:

- Project identity;
- Project purpose/intent at a useful initial level;
- lifecycle state;
- repository ownership/reference relationships known at creation time;
- Project marker validity.

It must not fabricate unknown architecture, plans, Jobs, contracts, or domain facts merely to fill templates.

The exact bootstrap files/folders/fields are deferred to the later storage synthesis pass.

---

## 17. Project source-environment cardinality

Accepted:

```text
Project
→ may own 0..N repositories
→ may reference 0..N repositories
```

A Project may legitimately exist before it owns any repository.

Typical case:

```text
project new
→ planning / product definition / design work
→ no GitHub write required yet
→ repository may be created/attached later
```

This is especially valid because planning itself does not require writing to GitHub.

A Project with zero owned repositories is therefore not incomplete merely for lacking a code environment.

When implementation later requires source writes, the necessary owned repository relationship must exist before the corresponding Code Job can execute.

---

## 18. Project open visibility

Accepted behavior:

```text
project open
→ show every Project except ARCHIVED
```

Therefore:

```text
ACTIVE
→ visible

PAUSED
→ visible

ARCHIVED
→ hidden from Open
```

`PAUSED` means work is intentionally not progressing right now, but the Project remains directly accessible from the everyday Open surface.

`ARCHIVED` is the state used to remove a Project from that everyday list.

The complete Project registry/history remains available through `project status`.

---

## 19. Project invariants — current detail pass

1. Project is the durable top-level product/system context.
2. Project is stored as one direct child folder of the configured Drive root.
3. `PROJECT.md` is the Project marker/identity artifact.
4. Project survives Jobs, Tasks, Runs, chats and releases.
5. Project lifecycle is separate from release-completion milestones.
6. Archive preserves Project memory; delete removes the Project Drive folder.
7. Project deletion does not imply repository deletion.
8. Repositories are Project-level resources, not Job-owned resources.
9. A repository has at most one owning Project.
10. Referenced repositories are read-only.
11. Referenced source may be copied/forked into Project-owned source with provenance.
12. Project may own zero, one, or multiple repositories.
13. Project may have multiple Jobs active in parallel when topology/dependencies allow.
14. Opening an existing Project is Drive-first and GitHub-selective.
15. Chat history is not durable Project state.
16. Physical Project Memory layout beyond bootstrap identity must be derived later from domain requirements.
17. Release completion does not automatically archive the Project.
18. Theory must not invent missing repository/lifecycle semantics during implementation.

---

## 20. DETAIL output — candidates discovered for later COLLECT

The Project detail pass has discovered requirements that must be collected later, but they are NOT yet physical-structure decisions.

### Storage/access candidates

- Project identity marker requirement;
- lifecycle state persistence;
- owned-repository relationship persistence;
- referenced-repository relationship persistence;
- release milestone history;
- active/archived discovery/query needs;
- cross-chat durable Project state;
- cross-Job coordination state;
- deletion/audit needs if required;
- provenance for derived code copied from referenced repositories.

### CLI candidates already accepted at outer layer

- Project new;
- Project open;
- Project status;
- Project delete.

Do not derive additional Project commands yet.

### Cross-domain dependencies

Project definition depends on later detail of:

- Job lifecycle;
- Task/Run attribution;
- Agent memo/write behavior;
- release records;
- Causal Change Review;
- Test/Retest;
- asset requirements;
- storage schema;
- security/destructive-action policy.

These candidates move to COLLECT only after enough additional domains have been detailed.

---

## 21. Known canonical inconsistency to repair later

Several existing architecture documents still encode the superseded model:

```text
Job
= direct Drive child folder
= durable top-level memory root
= JOB.md marker
```

The accepted model is now:

```text
Project
= direct Drive child folder
= durable top-level memory/control-plane root
= PROJECT.md marker

Job
= finite work unit inside Project
```

Do not patch these older documents piecemeal during this DETAIL pass.

Record the inconsistency now.

The later COLLECT → REVIEW → SYNTHESIZE → FIX cycle must reconcile all affected canonical documents in one consistency pass.
