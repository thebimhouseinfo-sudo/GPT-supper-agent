---
id: STATE-MACHINE
version: 1
status: DRAFT
depends_on:
  - FROZEN-FOUNDATION-v0.1
---

# State Machine v1

## Purpose

This file is the single canonical home for GPT Super Agent workflow states, transitions, blocking branches, work classification, and gate requirements.

## Current status

```text
TO DEFINE
```

No workflow state list is normative until this document is completed and approved.

Older state lists in `AGENT-HARNESSES-v0.1.md` and `GOVERNANCE-AND-ARTIFACT-LIFECYCLE-v0.1.md` are superseded as state-machine sources.

## Must define

- complete state vocabulary
- state x event -> next-state table
- allowed transitions
- illegal transitions
- blocking branches
- who may trigger each transition
- user interruption behavior
- pause/resume
- retry behavior
- work classification / tiers
- gate requirements by work class
- upward reclassification rules
- stale/drift transitions
- hierarchical work levels: Task → Review Unit → PR → Change Set → Job
- nested owner/reviewer loops at each applicable level
- READY_FOR_REVIEW vs APPROVED vs DONE semantics
- upward completion promotion rules
- child-approved / parent-incomplete behavior
- review-failure routing to the lowest owning level
- escalation from task/detail-plan defects to Planner when architecture/scope changes
- ancestor reopening/invalidation when a child is reopened
- final Job review and JOB_APPROVED / JOB_CHANGES_REQUIRED outcomes
- terminal/completion states
- observable transition violations
- enforcement classification
- eval hooks

## Non-goal

This draft intentionally does not choose the states before the dedicated definition step.
