# Foundation

## Status

```text
FOUNDATION_STATUS = GOVERNED_BASELINE
```

Product/system invariants only.

`GOVERNED_BASELINE` means these invariants are protected by architecture governance, not immutable forever. A human-approved architecture amendment may change them; Git history is the version record.

## F1. Product boundary

```text
Conversation = UI, not durable memory
Supabase = per-user runtime configuration only
GitHub Memory Repo = durable Project memory/control plane
GitHub source repositories = source-code truth
Harness / skills / loops = workflow and quality logic
```

GPTWorker remains separate offline/local tooling.

## F2. Configured Memory Repo

One private GitHub repository is resolved from per-user runtime configuration.

Initial implementation stores:

```text
auth.uid()
→ user_memory_config
→ memory_repo_id
→ memory_repo_full_name
→ default_branch
```

The Memory Repo is configuration-selected, not inferred from chat history or from a Project source repository.

Changing the Memory Repo updates the same user's configuration row in place; no configuration revision counter is required.

Durable Project Memory is stored under:

`projects/<project-id>/...`

Supabase is not Project Memory and is not a Project registry.

See `USER-CONFIGURATION-AND-MEMORY-REPO.md`.

## F3. Project

Project is long-lived durable context, parent of Jobs, owner of 0..N writable repos and may reference 0..N read-only repos.

## F4. Hierarchy

```text
Project → Job → Task → Run
```

Job = finite objective/work unit and may contain multiple role Runs.

Task = optional bounded work package.

Run = one execution attempt with one active role.

## F5. Repository authority

```text
OWNED = writable by one Project within approved scope
REFERENCED = read-only
```

Ownership is structured.

Duplicate OWNED claims block write routing until human resolution.

## F6. Context loading

```text
Project Memory
→ current work/request
→ relevant repo/source
→ selective live evidence
```

No broad-scan default.

## F7. Project lifecycle

```text
ACTIVE
PAUSED
ARCHIVED
```

Open shows ACTIVE + PAUSED, hides ARCHIVED.

## F8. Job semantics

Baseline types:
```text
plan
code
design
review
```

Type = primary objective classification, not active role.

Review checkpoint inside another Job is not a review Job.

Job type immutable.

Task growth remains inside Job only while finite objective remains materially the same; materially different objective becomes a linked Job.

## F9. Identity

Durable detached-reference entities use globally collision-resistant IDs plus optional short human handles.

No central allocation counter is required.

## F10. Run semantics

```text
one execution scope
= Job-level OR one primary Task
+ affected_task_refs[]
```

One active role per Run.

Non-independent specialist assistance may use child Run with own ID/role/attribution/parent_run_id.

## F11. Roles

```text
Orchestrator
Planner
Designer
Coder
  ├── UX Coder
  └── UI Coder
Reviewer
Tester
```

Tester practical execution is capability-gated.

## F12. Authority

```text
tool surface ≠ observed capability ≠ role authority
```

Effective authority is constrained by Project/Job/Task/role/Run/human/capability boundaries.

## F13. Review topology and mandatory floor

Normal review is topology-driven; not every PR/Task/milestone/Job requires Reviewer.

Context-isolated review is mandatory for mechanically detectable sensitive classes:
- shared contracts/interfaces/schema;
- persisted-data migration/format;
- auth/permission/security-sensitive logic;
- CI/CD/workflow/deployment configuration;
- destructive operations;
- dependency manifest/lockfile changes altering runtime/build dependency state.

Detection is based on actual changed-file/operation evidence against Project/Repo Claim sensitive path declarations plus universal patterns; Coder self-declaration cannot suppress it.

Removing planned review remains human-visible.

## F14. Accepted result

```text
PASS
PASS_RETEST_REQUIRED
```

PASS_RETEST_REQUIRED may complete Job while practical Retest remains pending.

## F15. Merge authority

```text
accepted result
→ review-coverage summary
→ explicit human merge authorization
→ merge
```

## F16. Human decisions

```text
semantic / product / architecture decision → Human
mechanical detailing after semantics fixed → GPT
```

Runtime Confirmation is not durable approval.

## F17. Causal Change Review

```text
change
→ trace recorded dependencies
→ known affected/unaffected with evidence
→ unknown/incomplete trace counts as affected
→ human resolves material trade-off
→ revalidate/stale/supersede exact artifacts
```

## F18. State separation

```text
lifecycle ≠ result ≠ validity ≠ delivery facts
```

WAITING/BLOCKED are derived where practical.

## F19. Handoff

Current orchestration:
```text
pull-based + human-dispatched + durable-state persistent
```

Handoff contracts are append-preserving. Consumption is recorded as a separate durable event/Run reference; the original Handoff is not mutated from PENDING to CONSUMED.

## F20. Shared identity

Connected account identity does not prove agent role or human approval.

Important agent outputs carry role + Run + owning work + target/revision attribution.

## F21. Concurrency realism

Cross-chat consistency is eventual.

Correctness uses GitHub blob-SHA optimistic concurrency for shared mutable records and must not depend on silent last-write-wins.

Normal status path:
```text
fresh CONTROL
→ compact current view
```

Durable fallback/reconciliation path:
```text
append-preserving Run/Verification/Handoff-consumption records
+ read-time reconstruction
+ minimal shared mutation
+ recheck before consequential action
```

CONTROL is rebuildable and never sole authority.

Completing Runs do not write progress/reference arrays back into shared Job records.

## F22. User-facing naming

Current handles/namespaces are aliases, not frozen product identity.

Internal IDs/signatures are product-name-neutral.

## F23. Foundation invariants

1. Conversation is UI, not durable memory.
2. Project is a top-level durable entity under the configured GitHub Memory Repo.
3. Job is finite objective and may contain multiple role Runs.
4. Task is optional decomposition.
5. One active role per Run; child Runs preserve attribution.
6. GitHub is source truth.
7. OWNED/REFERENCED have different authority.
8. Opening existing work is Memory-Repo-first and source-repo-selective.
9. Review is topology-driven with a mechanically computed mandatory floor.
10. Merge requires explicit human authorization + coverage visibility.
11. State/result/validity/delivery facts remain separate.
12. Cross-chat consistency is eventual.
13. Account identity is not role identity or human approval.
14. Shared Job progress is served from fresh CONTROL when available and reconstructed from durable records when CONTROL is missing/stale/conflicted; completing Runs never parallel-write aggregate progress into the Job record.
15. User-specific Memory Repo is resolved from per-user runtime configuration and is never authoritative from chat/source.
16. Changing Memory Repo updates the stable per-user config record in place; no revision counter is required.
