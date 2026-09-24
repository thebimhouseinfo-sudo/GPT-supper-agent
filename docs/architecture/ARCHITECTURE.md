# GPT Super Agent — Architecture

## 1. System model

```text
Conversation = interaction UI
Supabase = per-user runtime configuration only
GitHub Memory Repo = durable Project memory/control plane
GitHub source repositories = source-code truth
Harness / Skills / Loops = workflow, role, quality and tool-use logic
```

GSA is not a heavy standalone runtime.

## 2. Hierarchy

```text
Project → Job → Task → Run
```

Job is a finite objective and may use many role Runs.

Task is optional bounded work decomposition.

Milestone/stage is topology, not ownership hierarchy.

## 3. Project / repository model

Each authenticated user configures one private GitHub Memory Repo.

```text
auth.uid()
→ user_memory_config
→ memory_repo_id / owner-name / default branch
→ projects/<project-id>/
```

The Memory Repo is never inferred from chat context or from a Project source repository.

See `USER-CONFIGURATION-AND-MEMORY-REPO.md`.

```text
OWNED → writable within approved Project source scope
REFERENCED → read-only
```

Structured ownership claims include repo-specific review-sensitive path metadata.

## 4. Project Memory

Project Memory is Git-native Markdown/JSON under the configured Memory Repo.

Supabase is used only for per-user plugin/runtime configuration. It is not Project Memory and is not source-code truth.

Updates/deletes use the current GitHub blob SHA so stale writes fail instead of silently overwriting newer state.

Use:
- stable Project/Job planning-control records;
- Tasks/topology embedded in Job by default;
- separate append-preserving Run records;
- Verification records joined by job_id/task_id;
- compact Handoffs;
- structured Knowledge artifacts;
- optional rebuildable CONTROL cache.

Completing Runs do not write progress/reference arrays back into parent Job.

## 5. Context loading

```text
open Project
→ identity/current work
→ relevant knowledge/work records
→ current request
→ selective live GitHub evidence
→ role-specific context
```

## 6. Roles

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

One active role per Run.

Child Runs support non-independent specialist assistance.

Context-Isolated Reviewer uses a fresh chat. This means context isolation, not a different model/account identity.

## 7. Work topology

Planner defines objective/scope/dependencies/Tasks/stages/role order/review/test/Human Gates/completion/evidence.

Coder refines exact source-level HOW.

Materially different objective becomes linked Job rather than silent Task growth.

## 8. Run scope / concurrency

Run carries:
- Job or primary Task scope;
- affected Tasks;
- role;
- target/revision;
- scope claim;
- outputs/evidence/handoff.

Concurrency model:
```text
append-preserving Run/Verification records
+ read-time joins
+ minimal shared mutable records
+ recheck before consequential action
```

Cross-chat consistency is eventual.

## 9. Handoff / dispatch

```text
Run completes
→ immutable Handoff is created
→ human dispatches next Run
→ successor Run / consumption record references handoff_id
```

Pending/consumed state is derived from append-preserving records. The Handoff itself is not mutated to mark consumption.

Default discovery:
- Project open → current Project;
- no Project open → shallow `projects/` scan in the configured Memory Repo using CONTROL caches where available.

## 10. Review / QA

Normal review is topology-driven.

Mandatory review floor is mechanically computed from actual changed files/operations against:
- Project/Repo sensitive path metadata;
- universal workflow/lockfile patterns;
- destructive operation classification.

Coder self-report cannot suppress the floor.

Coder self QA/QC:
- capability-backed checks;
- Goal Recheck.

Context-Isolated Reviewer independently evaluates required criteria within a fresh context.

## 11. Capability truth

```text
OBSERVED
SURFACE_PRESENT
UNAVAILABLE
UNKNOWN
```

Only OBSERVED may support an operational success claim.

Phase-1 MUST probes confirmed:
- GitHub text create/update/delete with blob SHA;
- GitHub binary commit/read-back;
- PR merge behavior.

Branch auto-delete is not observed and branch delete is unavailable in the current connector; never assume cleanup.

## 12. Tester / Retest

Tester practical execution requires the relevant runtime capability to be OBSERVED.

Otherwise human Retest is the durable fallback.

```text
COMPLETED Job + later Retest FAIL
→ linked remediation Job
```

## 13. Evidence / Knowledge validity

Evidence is target/revision/provenance bound.

Knowledge artifacts carry structured identity/revision/validity/dependency metadata.

Unknown/incomplete dependency trace counts as affected until revalidated.

## 14. State model

Separate:
- lifecycle;
- result;
- validity;
- delivery facts;
- verification obligations;
- derived conditions.

## 15. Human authority

Account identity is not role identity or human approval.

Merge requires:
```text
accepted result
→ Review Coverage Summary
→ explicit human authorization
→ merge
```

## 16. User UX

Outer control surface:
```text
PROJECT
DIRECT AGENT
SETTING
HELP / INSTRUCTION
```

Names/aliases are not frozen identity.

## 17. Harness delivery boundary

The architecture does not assume that Markdown files are automatically loaded into ChatGPT.

Phase 2 must prove the actual delivery chain:

```text
ChatGPT interaction
→ plugin/action invocation
→ authoritative harness/policy selection
→ minimum role context packet
→ connector/tool execution
```

Until this is observed, harness injection/loading remains an implementation capability to prove, not an assumed platform behavior.

## 18. Current implementation boundary

Phase 1 remains the governed semantic baseline. Phase 2 is active; the physical Project Memory backend is the configured GitHub Memory Repo.