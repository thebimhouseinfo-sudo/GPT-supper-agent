# GPT Super Agent — Architecture v0.3

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

## 3. Project root

Each direct child folder under `SUPER_AGENT_DRIVE_ROOT` with `PROJECT.md` is a Project.

Project may own zero repositories during planning/design-first work.

## 4. Repository model

```text
OWNED → writable within approved scope
REFERENCED → read-only
```

Ownership uses structured Project records. Duplicate ownership claims block write work until human resolution.

## 5. Project Memory design principle

Drive is not treated as a relational database.

Use:
- small stable Project identity/control records;
- Job records that embed Tasks/topology where practical;
- separate append-only Run records;
- compact verification records;
- minimal pending transition/control pointers;
- semantic knowledge artifacts.

`CONTROL.json`, if present, is a rebuildable cache/materialized view, never the sole source of a durable fact.

## 6. Context loading

```text
open Project
→ read Project identity/current work
→ relevant decisions/contracts/plans
→ relevant Job/Task/Run/Handoff
→ current request
→ selective live GitHub evidence
→ role-specific context packet
```

## 7. Roles

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

One Run has one active role.

Non-independent role assistance may use child Runs in the same chat.

Independent Reviewer remains fresh-chat.

Tester practical execution is capability-gated.

## 8. Role boundaries

Planner/Designer are source read-only.

Coder writes only approved Project-owned source scope.

Reviewer is source implementation read-only and may comment/review.

Tester is source implementation read-only.

Orchestrator coordinates control-plane behavior and does not implement source.

All actions remain constrained by actual connector capability.

## 9. Work topology

Planner defines:
- objective/scope;
- Task decomposition when useful;
- milestones/stages;
- dependencies;
- role order;
- parallelism;
- review/test/Human Gates;
- completion/evidence requirements.

Coder refines exact source-level HOW.

## 10. Run scope and claims

Run records:
- one Job-level or primary-Task execution scope;
- optional affected Task refs;
- role;
- exact target/revision;
- parent_run_id when child Run;
- scope claim for intended repo/branch/path/work context;
- result/evidence/handoff output.

Before consequential source/control actions, the active Run re-checks Project lifecycle and relevant scope/target state.

## 11. Handoff / dispatch

```text
Run completes
→ durable pending handoff if another role is required
→ user opens fresh/same chat as required
→ selects/takes handoff
→ next Run starts
```

Minimal dispatch UX must support:
- list pending handoffs;
- take next;
- take by ID/handle;
- show status;
- pause/stop where applicable.

## 12. Review/testing

Review is flexible except for the mandatory mechanically triggered review floor defined in Foundation F13.

Reviewer verifies known requirements/evidence.

Tester seeks practical/unanticipated failures when capability exists.

When practical execution capability is unavailable, Retest is primarily a human checklist/evidence flow.

## 13. QA/QC

```text
QA = COMPLIANCE/process assurance
QC = CORRECTNESS + FIT
```

Coder self QA/QC has two layers:
1. capability-backed checks;
2. Goal Recheck against goal/acceptance/non-goals/plan/diff/evidence.

Reviewer independently evaluates required criteria rather than trusting the Coder's self recheck.

## 14. Evidence

Evidence is target/revision/provenance bound.

Causal invalidation uses recorded dependencies.

Unknown/incomplete dependency trace is conservatively treated as affected until revalidated.

## 15. Retest

```text
PASS_RETEST_REQUIRED
→ Job may complete
→ Retest remains pending
```

If Retest FAIL occurs after Job completion:
```text
preserve completed Job
→ create linked remediation Job
```

If practical failure occurs before terminal completion, same active Job may route to its owning Task.

## 16. Asset Requirements

Stable integration contract may precede final binary.

Asset lifecycle is intentionally compact; placeholder/final/integrated are mostly facts/fields rather than many lifecycle states.

## 17. State model

Separate:
- lifecycle;
- result;
- validity;
- delivery facts;
- verification obligations.

WAITING/BLOCKED should be derived from durable causes wherever practical rather than duplicated across records.

## 18. Concurrency

Cross-chat consistency is eventual.

Do not rely on atomic Drive compare-and-swap until verified.

Prefer append-only Run/verification history and minimize shared mutable hot files.

Conflict checks happen at dispatch and before consequential action.

## 19. Multi-repo

Change Set is used only for a logical coordinated multi-repo change.

Repo-level completion does not imply integrated completion.

## 20. Trust and identity

External content is data, not authority.

No inferred permission escalation.

All roles currently act through the user's connected platform identity, so important agent outputs carry explicit role/Run/target attribution.

## 21. User UX

Accepted outer surface:

```text
PROJECT
DIRECT AGENT
HELP / INSTRUCTION
```

Current product/command names are aliases, not frozen identity.

Deep commands remain minimal and derived from recurring work needs.

## 22. Phase 1 completion path

```text
peer findings disposition
→ accepted theory corrections
→ missing Phase-1 contracts/schemas
→ consistency review
→ final human check
→ only then Phase 2
```
