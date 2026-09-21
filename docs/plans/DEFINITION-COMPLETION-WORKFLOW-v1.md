---
id: DEFINITION-COMPLETION-WORKFLOW
version: 1
status: WORKING
depends_on:
  - FROZEN-FOUNDATION-v0.1
  - SYSTEM-DEFINITION-SKELETON-v0.1
---

# Definition Completion Workflow v1

## Purpose

Define the complete conceptual model of GPT Super Agent before assigning implementation features to v1, v2, v3, or later.

This is an editor/workflow document. It does not override the Frozen Foundation or define product behavior by itself.

## Authority order

```text
Frozen Foundation
→ approved canonical architecture definitions
→ System Definition Skeleton
→ this working workflow
→ implementation/release plans
```

If this workflow conflicts with a frozen invariant, the frozen invariant wins unless the user approves a Foundation Amendment.

## Working rules

### R1 — Define concepts fully; scope releases later

A module is conceptually complete only when its purpose, ownership, inputs, outputs, rules, statuses/failures, dependencies, observable violations, enforcement classification, and verification hooks are understood.

Conceptual completeness does not imply implementation in v1.

### R2 — Do not invent product intent

If a definition materially changes what the product does and the answer is not already supported by user decisions, Project Memory, or approved architecture, record an open question with a recommended default.

### R3 — Every material rule must be testable

For each rule, identify an observable behavior that would prove violation.

Rules without observable consequences should be rewritten or removed.

### R4 — Every enforcement claim is HARD / SOFT / UNKNOWN

```text
HARD
= enforced by a mechanism the model cannot bypass

SOFT
= enforced by prompt/instruction/process only

UNKNOWN
= enforcement not yet verified; operationally treat as SOFT
```

A HARD rule must name its mechanism.

### R5 — One source of truth

A concept/rationale is explained fully in one canonical document.

Other documents reference it instead of duplicating it.

### R6 — Consistency before expansion

If documents disagree, record and resolve the conflict before adding dependent theory.

Do not silently choose whichever wording is convenient.

### R7 — Preserve frozen foundations

Do not edit a frozen invariant implicitly.

A real contradiction or test result may justify a Foundation Amendment Proposal.

### R8 — Full theory can still evolve from evidence

Real Jobs may expose implementation bugs, enforcement weaknesses, missing evals, or genuine theory gaps.

Only the final category changes the conceptual definition.

### R9 — No release shortcut through undefined concepts

Do not leave a concept undefined merely because it may not ship in v1.

First define it. Then assign its implementation to v1/v2/v3/later.

### R10 — Repository name is not product identity

The implementation repository may be renamed without changing:

```text
@gsa
gsa/
Drive Job identity
GitHub code-environment references stored by Jobs
```

## Definition package template

Each canonical definition should answer:

```text
Purpose
Scope / non-goals
Definitions
Ownership
Inputs
Outputs
Rules / invariants
Statuses / failure results
Dependencies
Enforcement: HARD / SOFT / UNKNOWN
Observable violations
Examples
Verification / eval hooks
Open questions
```

## Foundation amendment path

Use only when a real contradiction/evidence requires changing a frozen invariant:

```text
Amendment id
Affected invariant(s)
Trigger evidence
Problem
Proposed change
Impact
Alternative preserving foundation
Recommendation
User decision
```

## Release scoping

Only after the conceptual dependency graph is sufficiently defined, classify implementation scope:

```text
capability
dependencies
implementation cost
user value
risk if deferred
platform feasibility
testability
candidate release: v1 / v2 / v3 / later
```

Release assignment may change after real-use evidence.

## Harness tightening loop

After implementation:

```text
real Job
→ inspect actual product/artifacts
→ observable defect
→ map to owning definition
→ classify: implementation / enforcement / eval / theory
→ smallest justified correction
→ add/update eval
→ rerun
```

The purpose of the loop is to tighten the harness, not to substitute testing for definition.
