# GPT Super Agent — Architecture v0.4

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

Each direct child folder under `SUPER_AGENT_DRIVE_ROOT` with `PROJECT.md` is a Project.

```text
OWNED → writable within approved scope
REFERENCED → read-only
```

Structured ownership claims include repo-specific review-sensitive path metadata.

## 4. Project Memory

Drive is not treated as a relational DB.

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

Independent Reviewer uses fresh chat.

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
→ Handoff PENDING
→ human dispatches next Run
```

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

Reviewer independently evaluates required criteria.

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
HELP / INSTRUCTION
```

Names/aliases are not frozen identity.

## 17. Phase-1 close

Required:
```text
Claude round 1 disposition/fix
→ Claude round 2 challenge
→ round-2 fixes
→ MUST platform probes
→ final consistency review
→ Phase 1 closed / Phase 2 may begin
```

Claude is challenge evidence, not product authority.
