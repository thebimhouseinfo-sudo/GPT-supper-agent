# Frozen Foundation v0.3

## Status

```text
FOUNDATION_STATUS = FROZEN
```

This document contains product/system invariants only. Theory-construction process rules live in `THEORY-PROCESS-v1.md`.

A change to these invariants requires explicit architecture revision.

---

## F1. Product boundary

GPT Super Agent is a ChatGPT-based orchestration/harness system for online project work.

```text
Conversation = UI, not durable memory
Google Drive = durable Project memory/control plane
GitHub = source-code truth
Harness / skills / loops = workflow and quality logic
```

GPTWorker remains a separate offline/local agent.

## F2. Configured Drive root

GSA is configured once with `SUPER_AGENT_DRIVE_ROOT`.

Each direct child Project folder is one Project.

There is no mandatory global registry and no required jobs/ wrapper.

## F3. Project definition

```text
Project
= one direct child folder under SUPER_AGENT_DRIVE_ROOT
= durable memory/control-plane root
= parent of Jobs
= owner of 0..N writable GitHub repositories
= may reference 0..N read-only repositories
```

A Project may exist before any owned repository exists.

## F4. Project marker

Every valid Project folder contains `PROJECT.md`.

PROJECT.md is the Project marker and human-readable identity entry point.

## F5. Hierarchy

```text
Project → Job → Task → Run
```

```text
Project = long-lived durable context
Job = finite objective/work unit inside one Project
Task = optional bounded work package inside a Job
Run = one bounded execution attempt with one active role
```

A Job may contain multiple roles/Runs. Job type classifies the Job's primary objective; it is not the active role.

## F6. Repository ownership/reference

```text
OWNED = writable source belonging to one Project only
REFERENCED = strictly read-only context/dependency/example
```

Rules:
- one repository may be owned by exactly one GSA Project at a time;
- many Projects may reference the same repository;
- referenced repositories are never modified in place by the referencing Project;
- code derived from a reference must be copied/forked into Project-owned source before editing;
- ownership claims are structured durable records;
- duplicate OWNED claims are a governance conflict and require human resolution.

## F7. Drive-first context loading

```text
Project Memory
→ current work/request
→ relevant owned/reference repo
→ relevant source area
→ selective live GitHub evidence
```

GSA does not broad-scan every repository by default.

## F8. Project lifecycle

```text
ACTIVE
PAUSED
ARCHIVED
```

Project Open shows ACTIVE + PAUSED and hides ARCHIVED.

Release/product milestones are separate from lifecycle.

## F9. Job semantics

A Job is finite and belongs to exactly one Project.

Baseline Job types:

```text
plan
code
design
review
```

Job type is immutable after creation and classifies the primary objective.

A review checkpoint inside another Job is not automatically a `review` Job; a `review` Job exists when independent review itself is the finite objective.

All durable entities intended for detached reference use globally collision-resistant identity plus optional short human handles.

Completed Jobs remain in Project history unless explicitly deleted.

No Job-level ARCHIVED state is required.

## F10. Task and Run semantics

Task creation is optional for small Jobs.

Run attribution uses:

```text
one execution scope
= Job-level
  OR one primary Task

+ optional affected_task_refs[]
```

One Run has one active role.

A non-independent specialist call may use a child Run in the same chat:

```text
parent Run
→ child Run with different role
→ child completes
→ parent resumes
```

Each child Run has its own ID, role, attribution, and parent_run_id.

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

Tester is capability-gated for practical execution.

Role policy boundaries may be HARD, SOFT, or UNKNOWN depending on actual platform enforcement.

## F12. Role authority

Tool capability does not grant role authority.

Effective authority:

```text
Project policy
∩ Job scope
∩ Task scope
∩ role boundary
∩ Run target
∩ human approvals
∩ actual executor capability
```

## F13. Review topology and mandatory floor

Review placement is topology-driven for normal work.

There is no universal rule that every PR, Task, milestone, or Job must receive Reviewer.

However, an independent review checkpoint is mandatory when mechanically detectable change classes include:
- shared contracts/interfaces/schema;
- persisted-data migration/format;
- authentication/permissions/security-sensitive logic;
- CI/CD/workflow/deployment configuration;
- destructive operations;
- dependency manifest/lockfile changes that alter runtime/build dependency state.

This floor is a harness policy boundary and may be SOFT unless the platform enforces it.

Removing a previously planned review checkpoint must be visible to the human.

## F14. Accepted result model

```text
PASS
PASS_RETEST_REQUIRED
```

PASS_RETEST_REQUIRED means required online evidence is sufficient for acceptance while practical real-world verification remains outstanding.

## F15. Merge authority

Merge requires explicit human authorization.

```text
accepted result
→ review-coverage summary
→ explicit human merge authorization
→ merge
```

Reviewer PASS does not merge by itself.

## F16. Human decisions

```text
semantic / product / architecture decision
→ Human

mechanical / structural detailing after semantics fixed
→ GPT
```

Planned Human Gate and Runtime Confirmation are distinct.

Runtime Confirmation is never a durable approval log.

## F17. Causal Change Review

```text
change
→ trace recorded dependencies
→ known affected/unaffected with evidence
→ unknown/incomplete dependency trace counts as affected
→ options/trade-offs
→ human decides material choice
→ revalidate/stale/supersede exact artifacts
```

No blanket stale propagation, but uncertainty fails safe toward revalidation.

## F18. State separation

```text
lifecycle state
≠ result
≠ validity
≠ delivery facts/events
```

## F19. Current platform handoff

```text
pull-based
+ human-dispatched
+ durable-state persistent
```

Future automatic handoff is an extension point over the same durable handoff model.

## F20. Shared identity / attribution

Current connectors act through the user's connected GitHub/Google identity.

Therefore account identity does not prove agent role or independent approval.

Important agent-authored durable/external outputs carry product-neutral attribution:

```text
role + Run ID + owning work context + exact target/revision
```

Human approval counts only when explicitly given by the human through the authorized interaction surface.

## F21. Concurrency realism

Cross-chat consistency is eventual unless platform capabilities prove stronger enforcement.

Correctness must not depend on atomic conditional Drive writes.

Prefer append-only unique records for execution history.

Before consequential actions, re-read relevant lifecycle/scope/current-target state.

## F22. User-facing naming

Current handles/namespaces are aliases, not frozen product identity.

Internal IDs/signatures are product-name-neutral.

## F23. Foundation invariants

1. Conversation is UI, not durable memory.
2. Project is the top-level durable Drive entity.
3. PROJECT.md marks Project identity.
4. Job is finite work inside Project and may contain multiple role Runs.
5. Task is optional work decomposition.
6. Run is one execution attempt with one active role; child Runs preserve role attribution.
7. GitHub is source-code truth.
8. Owned and referenced repositories have different authority.
9. Opening existing work is Drive-first and GitHub-selective.
10. Review placement is topology-driven with a mechanical mandatory floor for specified sensitive changes.
11. Merge requires explicit human authorization with review-coverage visibility.
12. State/result/validity/delivery facts remain separate.
13. GPTWorker remains separate offline/local tooling.
14. Cross-chat consistency is eventual unless stronger enforcement is observed.
15. Account identity is not role identity or human approval.
