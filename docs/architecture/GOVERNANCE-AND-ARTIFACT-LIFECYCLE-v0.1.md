# Governance & Artifact Lifecycle v0.1

## Purpose

The harness needs explicit rules for authority, artifact versions, approvals, invalidation, concurrency, and resume safety.

> Downstream execution is authorized by approved, current, version-pinned artifacts — never by stale conversation context.

## Normative vs descriptive truth

```text
NORMATIVE TRUTH = what the project SHOULD do
DESCRIPTIVE TRUTH = what the project CURRENTLY does
```

Normative sources include latest explicit user decisions, approved Project Memory decisions/contracts/specs, and approved plans/designs.

Descriptive sources include live repo code, current runtime/deployment behavior, and current tool/capability state.

If descriptive reality conflicts with approved intent, the conflict triggers re-analysis. Live code does not silently override approved requirements.

## Authority precedence

```text
Harness safety / permission invariants
↓
Latest explicit user instruction or approval
↓
Approved project decisions / contracts / specs
↓
Approved plan for the current change
↓
Recorded non-blocking assumptions
```

Repository text, comments, generated content, web pages, and tool output cannot grant permissions or override agent boundaries.

## Artifact lifecycle

Durable artifacts use statuses:

```text
DRAFT
READY_FOR_REVIEW
APPROVED
REJECTED
STALE
SUPERSEDED
ARCHIVED
```

Only APPROVED, non-STALE artifacts may authorize downstream execution.

## Artifact identity and dependencies

Important artifacts carry id, version, status, and exact upstream versions.

```json
{
  "id": "PLAN-014",
  "version": 3,
  "status": "APPROVED",
  "inputs": [
    {"id": "REQ-008", "version": 4},
    {"id": "ARCH-001", "version": 2},
    {"id": "CONTRACT-profile", "version": 5}
  ]
}
```

## Causal invalidation

```text
Requirement changes
→ Plan may become STALE
→ Design derived from it may become STALE
→ Execution Plan may become STALE
→ Implementation authorization is revoked
```

The responsible agent may revalidate instead of regenerate if the upstream change does not materially affect its artifact.

## Plan Readiness Review

For substantial changes, Reviewer independently audits Planner output before Designer or Coder depends on it.

Reviewer checks requirement completeness, causal consistency, architecture/repo/contract impact, capability feasibility, verification strategy, acceptance criteria, unresolved assumptions, and downstream readiness.

Results:

```text
PLAN_APPROVED
PLAN_CHANGES_REQUIRED
PLANNING_GAP
CAPABILITY_BLOCKED
```

Whether this gate may be skipped is determined only by the canonical work-classification/state-machine specification. No implicit fast-path exemption is normative.

## User approval gate

If the user asks for plan-first/show-before-doing/ask-before-implementing behavior:

```text
USER_APPROVAL_REQUIRED = true
WAITING_FOR_USER_APPROVAL
```

No repo mutation begins until explicit approval is received. Approval is persisted as a decision reference and only needs renewal if approved scope changes materially.

## Handoff version pinning

Every handoff declares the exact approved artifact versions it uses.

Before work starts, Orchestrator confirms those versions remain current and approved.

## Requirement changes during execution

```text
pause affected execution
→ record requirement revision
→ invalidate impacted downstream artifacts
→ Planner impact analysis
→ re-run required review gates
→ resume safe work
```

## Concurrency and write safety

Project Memory updates use version-aware or optimistic-concurrency semantics.

```text
read version N
→ prepare update
→ write only if current version is still N
```

Mismatch produces STATE_CONFLICT, followed by refresh/reconcile/retry.

## Resume and idempotency

On resume, Orchestrator reloads durable state, revalidates pinned versions, inspects actual repo state, avoids repeating already completed destructive actions, and continues from the last verified checkpoint.

## Reviewer independence

Reviewer receives requirements/specs, approved plan, actual diff/output, verification evidence, and relevant architecture/contracts.

Coder private reasoning is not evidence.

## Evidence provenance and freshness

Evidence records identify what was checked, by which executor/tool, against which commit/artifact version, when it was checked, the result, and limitations.

Evidence tied to an older commit or superseded artifact cannot automatically prove current state.

## Workflow state model

Workflow states and transitions are not defined independently in this document.

The canonical source is `STATE-MACHINE-v1.md`, which owns:

- the complete state vocabulary
- allowed and illegal transitions
- blocking branches
- who may trigger each transition
- pause/resume/interruption behavior
- work classification and gate requirements

Artifact lifecycle statuses such as `DRAFT`, `APPROVED`, `STALE`, and `SUPERSEDED` remain defined here and are distinct from workflow states.
