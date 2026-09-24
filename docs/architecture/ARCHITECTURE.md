# GPT Super Agent — Architecture

## 1. System model

```text
Conversation = interaction UI
Google Drive Project Memory = durable Project memory/control plane
GitHub = source-code truth
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

`SUPER_AGENT_DRIVE_ROOT` is a logical per-user root resolved at runtime.

Initial implementation resolves it from Supabase per-user configuration using the current `drive_root_folder_id`. GitHub does not store user-specific root IDs, and conversation context is not authoritative for the current root.

Changing the user's root updates the same configuration record in place; no config revision is required.

Each direct child folder under the currently resolved `SUPER_AGENT_DRIVE_ROOT` with `PROJECT.md` is a Project.

See `USER-CONFIGURATION-AND-DRIVE-ROOT.md`.

```text
OWNED → writable within approved scope
REFERENCED → read-only
```

Structured ownership claims include repo-specific review-sensitive path metadata.

## 4. Project Memory

Drive is not treated as a relational DB.

Supabase is used only for per-user plugin/runtime configuration such as the Drive root mapping. It is not Project Memory and is not source-code truth.

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
- no Project open → shallow root-wide Project scan using CONTROL caches where available.

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
- raw Drive file round-trip;
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

Phase 1 architecture is closed as a governed baseline. Phase 2 implementation is not started until M0 passes against the current repository state.