# Project Memory Model

## 1. Purpose

GitHub Memory Repo is the durable Project control plane.

It stores enough durable state to reopen work without chat history while avoiding database-style over-normalization and shared mutable hot files.

GitHub remains source-code truth.

## 2. Memory Repo resolution

Project Memory begins only after the authenticated user's Memory Repo has been resolved from per-user runtime configuration.

```text
auth.uid()
→ user_memory_config
→ memory_repo_id / memory_repo_full_name / default_branch
→ projects/<project-id>/
```

The Memory Repo must not be reconstructed from chat history or from a Project source repository.

Changing it updates the stable user's config row in place; no config revision counter is required.

See `USER-CONFIGURATION-AND-MEMORY-REPO.md`.

## 3. Minimal logical layout

```text
projects/<project-id>/
├── PROJECT.md
├── CONTROL.json              # optional/rebuildable current-state cache
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

Git directories materialize lazily when files are created; empty placeholder folders are not required.

### NEXT cutover namespaces

NEXT execution has two durable memory namespaces after P3:

```text
memory_namespace = TEST_LAB
→ projects/<project-id>/TEST-LAB/NEXT/**

memory_namespace = PRODUCTION
→ projects/<project-id>/WORK/**
→ projects/<project-id>/VERIFICATION/**
```

A NEXT Job owns the namespace for its execution chain. Runs, Handoffs, checkpoint claims/attempts and Verification-family records inherit that namespace and must not cross-link durable evidence from the other namespace.

Compatibility rules:
- historical records with no `execution_contract` remain `V2_STABLE`;
- historical NEXT records with no `memory_namespace` remain `TEST_LAB`;
- therefore the P3 cutover does not move or reinterpret existing lab evidence.

The staging `gsa-mcp-next` request surface continues to create explicit NEXT work in `TEST_LAB`. The production `gsa-mcp` source is prepared to create new NEXT Jobs in `PRODUCTION` only after the later Human-approved production release.

## 4. PROJECT.md

PROJECT.md is:
- Project marker;
- stable human-readable identity entry point;
- high-level lifecycle/repository summary.

Structured identity/ownership fields must not exist only as prose.

## 5. Repository claims

Each repo relationship is structured.

OWNED claim includes at least:
- project_id;
- repo_ref;
- relation = OWNED;
- provenance;
- optional declared sensitive path/pattern sets used by mandatory review detection.

REFERENCED relationships are structured and read-only.

Duplicate OWNED claims:
```text
detected
→ block write routing
→ show conflicts
→ human resolves
```

## 6. Job record — planning/control record, not Run write-back target

The Job record is intentionally **not** a completion write-back sink for every Run.

It stores relatively stable/planning-owned information:
- Job identity/type/objective;
- scope/non-goals;
- embedded Tasks;
- milestone/stage topology;
- dependencies;
- completion/evidence requirements;
- review triggers;
- planning revision;
- Job lifecycle/result only when changed by an explicit serialized control/dispatch/planning action.

Rules:

```text
Run completion
≠ mutate parent Job tasks[]
≠ append verification refs into parent Job
≠ append Retest/Asset refs into parent Job
```

Instead, Run/Verification/Retest/Asset records carry `job_id` / `task_id` back-references and are joined at read/status time.

Tasks/topology are rewritten only through an explicit Planner/control action, not independently by completing Runs.

This is the read-time join model.

## 7. Current view and read-time reconstruction

Normal UX may read `CONTROL.json` first as a compact rebuildable cache to avoid repeatedly scanning every Run.

```text
fresh CONTROL
→ use compact current view

CONTROL missing/stale/conflicted
→ reconstruct from durable records
→ optionally refresh CONTROL
```

CONTROL is never the sole authority.

Current Job view may be derived from:
- stable Job planning record;
- Run records by job_id;
- Handoff records by job_id;
- Verification/Retest records by job_id;
- Asset Requirements by job_id;
- Human Gates/blockers;
- terminal control transition if explicitly recorded.

Therefore:
- verification_refs are not authoritative Job fields;
- retest_refs are not authoritative Job fields;
- asset refs are not authoritative Job fields;
- ordinary Task completion/progress is derived from execution/verification records rather than parallel Run write-back.

## 8. Run records

Runs are separate unique append-preserving records.

A Run includes:
- Run ID/handle;
- Job;
- primary Task or Job-level scope;
- affected Task refs;
- role;
- parent_run_id if any;
- target/revision;
- scope claim;
- inputs;
- result;
- output/evidence/handoff refs;
- timestamps where available.

Executed Run records are not normally overwritten/deleted.

## 9. Handoff representation

Handoff is a compact durable transition contract.

Preserve:
- source Run;
- target role;
- target/revision;
- completed/remaining work;
- blocker/gate.

Handoff records are immutable. Successor/consumption is recorded separately and joined by `handoff_id`.

Consumed history remains traceable without mutating the original Handoff.

## 10. Verification storage

Review, Evidence, Test, Retest and Goal Recheck remain semantically distinct but may share one verification record family:

```text
kind = REVIEW | EVIDENCE | TEST | RETEST | GOAL_RECHECK
```

Findings remain embedded in Review.

Records carry job_id/task_id back-references for read-time joins.

## 11. KNOWLEDGE

KNOWLEDGE stores durable semantic truth:
- architecture;
- decisions;
- contracts;
- plans;
- design intent;
- other Project knowledge.

Knowledge artifacts use compact structured front matter/record metadata so causal dependency/validity rules can operate:
- knowledge_id;
- kind;
- project_id;
- revision;
- validity;
- depends_on[];
- supersedes?.

The body may remain Markdown/human-readable.

## 12. CONTROL.json

CONTROL.json is optional/rebuildable materialized view.

It may cache:
- Project lifecycle;
- active Job handles;
- pending Handoffs;
- pending Human Gates;
- pending Retests;
- release refs.

No unique durable fact may exist only in CONTROL.

Correctness does not depend on atomic conditional update.

## 13. Concurrency model

Normal status path:

```text
fresh CONTROL
→ compact current view
```

Durable fallback / reconciliation path:

```text
append unique Run/Verification/Handoff-consumption records
+ read-time reconstruction
+ minimal shared mutable Job/Project records
+ consequential-action recheck
```

Shared mutable file updates/deletes require the current GitHub blob SHA. A stale SHA must fail and trigger refetch/reconciliation.

## 14. Cross-chat consistency

Consistency is eventual.

Before source write, handoff consumption, destructive action, merge/deploy or material shared mutation:
- re-read Project lifecycle;
- re-read scope/current target;
- detect conflict;
- block/reconcile when necessary.

## 15. Retest

Retest Request is stable. Each Retest attempt is a separate Verification record.

Pending/current Retest state is derived from attempts.

Pending Retests remain visible even when originating Job is COMPLETED.

Later Retest FAIL after completion creates linked remediation Job.

## 16. Assets

Asset Requirement is separately addressable when durable, carries job_id/task_id, and is joined at read time rather than appended into Job file.

Final binaries normally live in Project-owned source.

## 17. Persistence exclusions

Do not persist by default:
- raw chats;
- hidden reasoning;
- transient tool chatter;
- Runtime Confirmations;
- redundant source copies;
- ephemeral Direct Agent work before promotion.

## 18. No global registry

Project discovery scans `projects/` in the configured Memory Repo and reads each `projects/<project-id>/PROJECT.md`.

The Supabase per-user settings table is configuration storage, not a global Project registry.

Cross-Project status/handoff discovery may use shallow Project CONTROL caches; stale/missing cache falls back to the durable Project records.

## 19. Job deletion

No initial tombstone machinery.

Before hard delete, show surviving references/consequences and obtain explicit user decision.

## 20. Cross-Project references

Cross-Project refs are provenance references, not database-like strong foreign keys.

## 21. Git record lookup and concurrency rule

Paths are deterministic and Project IDs are globally collision-resistant.

Rules:
- Project marker: `projects/<project-id>/PROJECT.md`;
- append records use stable IDs in filenames;
- create uses GitHub create-file semantics and must fail if the exact path already exists;
- update/delete first fetch the current file and use its exact blob SHA;
- stale SHA = conflict; refetch and reconcile;
- never force overwrite merely to complete an operation;
- CONTROL may cache record paths/SHAs but is rebuildable.

## 22. Abandoned Runs

A Run left `IN_PROGRESS` without a terminal record after its chat/execution context is gone is displayed as `ABANDONED`, a derived condition.

Do not auto-complete or silently retry it.

User/Orchestrator may:
- resume when scope/target is still valid;
- supersede with a new Run;
- cancel/close through an explicit control action.

## 23. Run finalization order

When a Run completes:

```text
write outputs/evidence
→ write Verification records
→ write Handoff if needed
→ write/finish Run terminal record last
→ refresh CONTROL best-effort
```

A terminal Run must not point to evidence/handoff records that were merely planned but never persisted.

## 24. Direct Agent promotion

Promotion creates new Project/Job state from a compact packet:
- objective;
- produced output;
- assumptions/decisions;
- repo target;
- remaining work;
- references.
