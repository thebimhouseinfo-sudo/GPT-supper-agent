# Project Memory Model v1.3

## 1. Purpose

Google Drive Project Memory is the durable Project control plane.

It stores enough durable state to reopen work without chat history while avoiding database-style over-normalization and shared mutable hot files.

GitHub remains source-code truth.

## 2. Root resolution

Project Memory begins only after the current user's logical `SUPER_AGENT_DRIVE_ROOT` has been resolved from per-user runtime configuration.

Initial implementation stores that mapping in Supabase. The Supabase row is not part of Project Memory.

```text
user config
→ drive_root_folder_id
→ SUPER_AGENT_DRIVE_ROOT
→ Project discovery
```

The current Drive folder ID must not be reconstructed from chat history or GitHub source.

Changing root updates the stable user's config record in place; no config revision counter is required.

See `USER-CONFIGURATION-AND-DRIVE-ROOT-v1.md`.

## 3. Minimal logical layout

```text
<Project>/
├── PROJECT.md
├── CONTROL.json              # optional/rebuildable current-state cache
├── WORK/
│   ├── jobs/
│   └── runs/
├── KNOWLEDGE/
└── VERIFICATION/
```

Physical folders may be created lazily.

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

## 7. Derived Job view

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
- blocker/gate;
- successor Run when consumed.

Consumed history remains traceable.

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

Default:

```text
append unique Run/Verification records
+ read-time join
+ minimal shared mutable Job/Project records
+ consequential-action recheck
```

Drive conditional writes are not assumed.

## 14. Cross-chat consistency

Consistency is eventual.

Before source write, handoff consumption, destructive action, merge/deploy or material shared mutation:
- re-read Project lifecycle;
- re-read scope/current target;
- detect conflict;
- block/reconcile when necessary.

## 15. Retest

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

Project discovery remains resolved per-user Drive root + Project folders.

The Supabase per-user settings table is configuration storage, not a global Project registry.

Cross-Project status/handoff discovery may use shallow Project CONTROL caches; stale/missing cache falls back to the durable Project records.

## 19. Job deletion

No initial tombstone machinery.

Before hard delete, show surviving references/consequences and obtain explicit user decision.

## 20. Cross-Project references

Cross-Project refs are provenance references, not database-like strong foreign keys.

## 21. Direct Agent promotion

Promotion creates new Project/Job state from a compact packet:
- objective;
- produced output;
- assumptions/decisions;
- repo target;
- remaining work;
- references.
