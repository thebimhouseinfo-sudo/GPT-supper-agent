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
- work decomposition: Job → Phase → Task
- delivery units: Review Unit / PR / Change Set
- Work Map / Review Topology generated only after phases, task list, dependencies, owners, and outputs are known
- dynamic review checkpoint placement; no fixed rule that every Task/Phase/PR must be reviewed
- reviewer mode selection per checkpoint
- checkpoint insertion/removal when risk/dependency topology changes
- review-failure routing to the lowest owning work level
- escalation from implementation/detail-plan defects to Planner/Designer when scope, architecture, contract, or design changes are required
- downstream invalidation when a rejected result already has dependents
- final independent Job acceptance before Job completion
- JOB_ACCEPTED / JOB_CHANGES_REQUIRED outcomes
- terminal/completion states
- observable transition violations
- enforcement classification
- eval hooks

## Non-goal

This draft intentionally does not choose the states before the dedicated definition step.
