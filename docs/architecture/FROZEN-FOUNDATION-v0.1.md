# Frozen Foundation v0.2

## Status

```text
FOUNDATION_STATUS = FROZEN
```

This document replaces the obsolete Job-as-Drive-root foundation.

A change to these invariants requires an explicit architecture revision.

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

---

## F2. Configured Drive root

GSA is configured once with:

```text
SUPER_AGENT_DRIVE_ROOT
```

Each direct child Project folder is one Project.

There is no mandatory global registry and no required jobs/ wrapper.

---

## F3. Project definition

A Project is the durable top-level product/system context.

```text
Project
= one direct child folder under SUPER_AGENT_DRIVE_ROOT
= durable memory/control-plane root
= parent of Jobs
= owner of 0..N writable GitHub repositories
= may reference 0..N read-only repositories
```

A Project may exist before any owned repository exists.

---

## F4. Project marker

Every valid Project folder contains:

```text
PROJECT.md
```

PROJECT.md is the Project marker and human-readable identity entry point.

The exact physical Project Memory schema is defined separately.

---

## F5. Hierarchy

```text
Project
→ Job
→ Task
→ Run
```

Semantics:

```text
Project
= long-lived durable context

Job
= finite work unit inside one Project

Task
= optional bounded work package inside a Job

Run
= one bounded execution attempt/session
  with one active role
```

---

## F6. Repository ownership/reference

Repository relation is explicit:

```text
OWNED
= writable source belonging to one Project only

REFERENCED
= strictly read-only context/dependency/example
```

Rules:

- one repository may be owned by exactly one GSA Project at a time;
- many Projects may reference the same repository;
- referenced repositories are never modified in place by the referencing Project;
- code derived from a reference must be copied/forked into Project-owned source before editing.

---

## F7. Drive-first context loading

Opening an existing Project follows:

```text
Project Memory
→ current work/request
→ relevant owned/reference repo
→ relevant source area
→ selective live GitHub evidence
```

GSA does not broad-scan every repository by default.

---

## F8. Project lifecycle

```text
ACTIVE
PAUSED
ARCHIVED
```

Project Open shows ACTIVE + PAUSED and hides ARCHIVED.

Release/product milestones are separate from lifecycle.

---

## F9. Job semantics

A Job is finite and belongs to exactly one Project.

Baseline Job types:

```text
plan
code
design
review
```

These are extensible after real evidence.

Job ID is globally unique.

All durable entities intended for detached reference use globally unique identity, including Project, Task, Run, Handoff, Review/Finding, Evidence, Retest, Asset Requirement, Human Gate, and Release records.

Completed Jobs remain in Project history unless explicitly deleted.

No Job-level ARCHIVED state is required.

---

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

---

## F11. Roles

Current system roles:

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

Role policy boundaries may be HARD, SOFT, or UNKNOWN depending on actual platform enforcement.

---

## F12. Role authority

Tool capability does not grant role authority.

Effective authority is constrained by:

```text
Project policy
∩ Job scope
∩ Task scope
∩ role boundary
∩ Run target
∩ human approvals
∩ actual executor capability
```

---

## F13. Review topology

Review placement is topology-driven.

There is no universal rule that every PR, Task, milestone, or Job must receive Reviewer.

The Detailed Execution Plan / milestone topology determines required Reviewer, Tester, Human Gate, and evidence checkpoints.

---

## F14. Accepted result model

Successful accepted results:

```text
PASS
PASS_RETEST_REQUIRED
```

PASS_RETEST_REQUIRED means implementation/review evidence is sufficient for acceptance while practical real-world verification remains outstanding.

---

## F15. Merge authority

Merge requires explicit human authorization.

```text
accepted result
→ explicit human merge authorization
→ merge
```

Reviewer PASS does not merge by itself.

---

## F16. Human decisions

```text
semantic / product / architecture decision
→ Human

mechanical / structural detailing after semantics fixed
→ GPT
```

Planned Human Gate and Runtime Confirmation are distinct.

Runtime Confirmation is never a durable approval log.

---

## F17. Causal Change Review

Upstream change does not blanket-invalidate downstream work.

```text
change
→ trace causal effect
→ affected/unaffected with reasons
→ options/trade-offs
→ human decides material choice
→ revalidate/stale/supersede exact artifacts
```

---

## F18. State separation

```text
lifecycle state
≠ result
≠ validity
≠ delivery facts/events
```

Delivery facts such as accepted/merged/deployed/deployment_verified remain separate.

---

## F19. Current platform handoff

Current orchestration is:

```text
pull-based
+ human-dispatched
+ durable-state persistent
```

Future automatic handoff is an extension point over the same durable state model.

---

## F20. Theory-construction meta-rule

```text
DETAIL
→ COLLECT
→ REVIEW
→ SYNTHESIZE
→ FIX
→ repeat
```

During DETAIL, unresolved theory decisions are normally nominated with alternatives and deferred to REVIEW rather than interrupting the user.

---

## F21. Phase maturity

```text
Phase 1
→ complete coherent theory

Phase 2
→ reference-informed initial harness/skills/loops/actions

Phase 3+
→ real-world calibration and hardening
```

GSA is not treated as a standalone coded runtime whose behavioral quality can be inferred from internal logs.

---

## F22. User-facing identity

```text
Plugin handle     = @gsa
Command namespace = gsa/
```

Exact deep command grammar is defined separately.

---

## F23. Foundation invariants

1. Conversation is UI, not durable memory.
2. Project is the top-level durable Drive entity.
3. PROJECT.md marks Project identity.
4. Job is finite work inside Project.
5. Task is optional work decomposition.
6. Run is one execution attempt with one active role.
7. GitHub is source-code truth.
8. Owned and referenced repositories have different authority.
9. Opening existing work is Drive-first and GitHub-selective.
10. Review placement is topology-driven.
11. Merge requires explicit human authorization.
12. State/result/validity/delivery facts remain separate.
13. GPTWorker remains separate offline/local tooling.


---

## F24. Control-plane materialized view

`CONTROL.json` is a rebuildable current-state index/materialized view.

Durable entity/history records remain the source for historical reconstruction.

---

## F25. Milestone/stage topology

Milestones/stages are Job topology structures, not a new ownership hierarchy between Job and Task.

The durable hierarchy remains:

```text
Project → Job → Task → Run
```


---

## F26. External peer review before Phase 2

After internal Phase 1 theory completeness:

```text
Claude peer review
→ disposition findings
→ reconcile accepted material issues
→ only then enter Phase 2
```

Peer review does not replace human authority and does not automatically change frozen theory.

The human retains final acceptance of material architecture/product/governance changes.
