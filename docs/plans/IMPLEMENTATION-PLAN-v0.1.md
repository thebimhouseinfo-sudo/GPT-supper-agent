# GPT Super Agent — Definition & Implementation Plan v0.3

## Goal

First complete the conceptual definition of GPT Super Agent. Then decide which already-defined capabilities belong in v1, v2, v3, or later.

The theory and the release scope are separate concerns.

```text
Concept definition
≠
Release implementation scope
```

A concept can be fully specified even when its implementation is deferred.

## Principle

```text
FULL CONCEPT MODEL
→ dependency map
→ testable rules
→ enforcement classification
→ release-scope decision
→ implementation
→ real Jobs
→ product-quality inspection
→ harness tightening
→ next release
```

The quality loop refines the harness after real use. It does not justify leaving core concepts undefined.

## Stage A — Consistency pass — COMPLETE

The initial consistency defects have been normalized:

- workflow states now point to one canonical `STATE-MACHINE-v1.md` definition instead of competing lists;
- Job Lifecycle section numbering is unique;
- duplicate capability example entry is fixed;
- Designer file/header version mismatch is fixed;
- role/write scopes are explicitly separated from enforcement strength;
- implicit Fast Path wording is removed pending formal work classification;
- Drive-over-GitHub rationale is canonicalized in `ARCHITECTURE-v0.1.md` §6;
- Coder handoff/gap reporting is separated from durable Project Memory writes.

Further contradictions found during definition work are handled as normal consistency fixes.

## Stage B — Complete conceptual definitions

Bring every relevant section in `SYSTEM-DEFINITION-SKELETON-v0.1.md` from PARTIAL/TO_DEFINE to DEFINED.

At minimum, every component definition answers:

```text
purpose
scope / non-goals
ownership
inputs
outputs
rules / invariants
statuses / failures
dependencies
observable violations
enforcement classification
verification / eval hooks
```

Definition order follows dependency order, not release priority.

### B1. Workflow foundations

Define:

- one state machine
- work classification / tiers
- pause/resume/interruption
- role handoffs
- stale/drift transitions

### B2. Memory and context

Define:

- canonical Project Memory model
- mandatory vs lazy artifacts
- artifact ownership
- schemas
- Context Builder
- selective GitHub reading
- freshness/drift behavior

### B3. Capability and enforcement

Define:

- capability vocabulary
- executor resolution
- unknown capability rule
- role permission/enforcement matrix
- HARD / SOFT / UNKNOWN semantics
- destructive-action approval behavior

### B4. Quality model

Define completely:

- QA
- QC
- Verification/Evidence
- evidence freshness
- evidence invalidation
- PASS / PARTIAL / BLOCKED semantics
- objective evidence vs model judgement

### B5. Role contracts

Define complete contracts for:

- Orchestrator
- Planner
- Designer
- Coder
- UX Coder
- UI Coder
- Reviewer

A role may be omitted from v1 implementation later, but its conceptual boundary must still be understood before release scoping.

### B6. Multi-repo model

Define:

- Repo Graph semantics
- provider/consumer contracts
- cross-repo impact
- Master Plan / repo plan relationship
- coordinated change-state model
- integration review
- multi-repo completion semantics

### B7. Governance and safety

Define:

- artifact lifecycle
- invalidation/revalidation
- approvals
- concurrency
- trust boundaries
- secrets
- prompt injection handling
- destructive actions

### B8. User interaction and recovery

Define:

- command model under `@gsa` / `gsa/`
- active Job semantics
- status output
- ambiguity behavior
- failure/recovery
- Definition of Done

### B9. Harness quality loop

Define how observed product-quality defects feed back into:

- prompts
- rules
- gates
- enforcement
- evals
- future versions

Exit criterion for Stage B:

```text
all required conceptual sections = DEFINED or FROZEN
no unresolved contradiction blocks implementation scoping
every material rule has an observable violation
every enforcement claim is HARD / SOFT / UNKNOWN
```

## Stage C — Release-scope matrix

Only after Stage B is sufficiently complete, assign implementation scope.

For each capability:

```text
name
dependencies
implementation complexity
user value
risk if deferred
testability
platform capability
candidate release
```

Candidate release labels:

```text
v1
v2
v3
later
```

No capability is assigned to a release merely because it was defined early.

No release contents are frozen in this document yet.

## Stage D — Implement selected v1

Implement only the capabilities selected for v1.

The harness must reflect the complete theory where relevant, but may leave later capabilities unimplemented behind explicit extension boundaries.

No silent partial implementation.

## Stage E — Evals

Before and during implementation, derive positive/negative evals from each implemented contract.

Every important rule should have an observable violation and at least one test hook where practical.

## Stage F — Real Job validation

Run real Jobs representative of the v1 scope.

Inspect:

- planning quality
- scope accuracy
- implementation quality
- QA/QC quality
- evidence quality
- review quality
- user-visible product quality
- unnecessary friction
- false confidence
- recovery behavior

## Stage G — Harness tightening

For each meaningful defect:

```text
observed defect
→ map to owner definition
→ decide: implementation bug / enforcement weakness / eval gap / theory gap
→ smallest justified correction
→ add/update eval
→ rerun
```

If a theory gap appears, update the conceptual definition.

If a frozen invariant is contradicted by evidence, use a Foundation Amendment Proposal.

## Stage H — Select v2 / v3 scope

Use evidence from v1 plus the full conceptual model to select the next implementation scope.

Version contents remain adaptable.

```text
v1 findings
+ user priorities
+ platform capabilities
+ dependency graph
→ v2 scope

v2 findings
→ v3 scope
```

## Frozen assumptions

- Plugin handle: `@gsa`
- Command namespace: `gsa/`
- one configured Drive root
- one direct Drive folder per Job
- `JOB.md` identifies a Job
- Drive-first Job loading
- GitHub is the online code environment
- Job references 1..N repos
- same Job model for single- and multi-repo
- GPTWorker is separate offline/local agent

## Current next step

Continue Stage B definitions against the System Definition Skeleton, using the Definition Completion Workflow. The next canonical definition package is the workflow state machine and work classification.

Do not decide v1/v2/v3 contents until enough of the conceptual model is DEFINED to make that decision coherently.
