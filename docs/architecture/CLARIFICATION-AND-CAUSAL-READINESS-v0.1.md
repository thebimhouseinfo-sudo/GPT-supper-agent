# Clarification & Causal Readiness Protocol v0.1

## Purpose

Planner, Designer, UX Coder, and UI Coder must not jump directly from a vague request to execution.

Before committing to a path, each role determines:

- what is known
- what is inferred
- what is unknown
- what causally depends on each unknown
- whether missing information is blocking
- whether evidence can safely resolve it
- whether the user must be asked

> Clarify causes and constraints before optimizing solutions.

## Shared reasoning order

```text
User intent
  ↓
Known facts
  ↓
Causal dependencies
  ↓
Unknowns / ambiguities
  ↓
Blocking vs non-blocking
  ↓
Clarify only what matters
  ↓
State assumptions
  ↓
Plan
  ↓
Execute
```

No agent may move from a materially ambiguous requirement to irreversible implementation when a missing fact could change the result.

## Missing-information ledger

```yaml
known:
  - target users are primary-school learners
  - app is mobile-first

inferred:
  - touch is the primary interaction mode

unknown:
  - whether tablet landscape is a primary target

blocking:
  - none

assumptions:
  - tablet landscape uses REGULAR layout mode
```

Material unknowns affecting architecture, contracts, design direction, execution scope, or acceptance must be recorded.

## Blocking vs non-blocking

BLOCKING means different answers would materially change:

- architecture
- data model
- repo scope
- API/contract
- user flow
- audience treatment
- visual direction
- device strategy
- security/privacy
- migration
- acceptance
- executor/tool needs

Non-blocking details should be inferred from evidence instead of interrupting the user.

## Ask-or-infer rule

Ask only when all are true:

```text
information is missing
AND materially decision-changing
AND unavailable from conversation / Project Memory / repo / specs
AND safe inference creates meaningful risk
```

Otherwise infer from evidence and state the assumption when useful.

## Question quality

Questions must be specific, causal, minimal, grouped, and understandable to a non-developer.

Bad:

> What do you want?

Better:

> The lesson can either start exercises immediately or require theory completion first. This changes the state model and screen flow. Which behavior do you want?

Explain why the answer matters.

## Do not re-ask known information

Before asking, inspect current conversation, Project Memory, repo evidence, contracts, approved decisions, and relevant files.

If the answer exists, do not ask again.

## Causal trace

```text
Requirement
  ↓ causes
Constraint
  ↓ determines
Design / architecture choice
  ↓ creates
Implementation obligations
  ↓ verified by
Acceptance evidence
```

## Planner clarification gate

Planner resolves or records:

- objective
- target user
- use cases
- scope/non-goals
- affected repos
- constraints
- target platforms/devices
- domain assumptions
- data/API dependencies
- success criteria
- rollout/migration expectations

Planner may publish `PLANNING_INPUT_COMPLETE` only when blocking unknowns are resolved or explicitly accepted as assumptions.

## Designer clarification gate

Designer verifies use case, target audience, UI Tree, hierarchy, device context, visual constraints, existing design language, tone, and artwork role.

If a missing answer would materially change the concept:

```text
DESIGN_CLARIFICATION_REQUIRED
```

Non-blocking visual choices may be explored as controlled alternatives.

## UX Coder clarification gate

UX Coder verifies flow, state transitions, entry/exit conditions, error/recovery behavior, progression rules, responsive semantics, and accessibility behavior.

Material incompleteness emits:

```text
UX_PLANNING_GAP
```

UX Coder must not invent product behavior.

## UI Coder clarification gate

UI Coder verifies Concept Artwork, reference viewport/layout mode, design tokens, Asset Sheet references, MUST MATCH requirements, and responsive rules.

Material visual ambiguity emits:

```text
UI_DESIGN_GAP
```

Low-risk implementation details may be inferred.

## Plan-before-action rule

Substantial work must have a causally coherent plan first.

```text
tiny local fix
→ compact execution checklist

single-screen feature
→ screen plan + acceptance

multi-screen feature
→ UI/UX plan + execution units

multi-repo change
→ Master Plan + repo plans + review topology
```

This does not require long documents for trivial work.

## Strict Clarification Mode

If the user explicitly asks to clarify first, ask before assuming, explain cause/effect, plan before doing, or not implement until requirements are clear:

```text
STRICT_CLARIFICATION_MODE = true
```

Then:

1. surface all unresolved material assumptions;
2. ask blocking questions before execution;
3. summarize causal reasoning in the plan;
4. do not execute until blocking answers are resolved;
5. list inferred non-blocking assumptions explicitly.

## Fast Path

If the user explicitly requests fast best-effort execution and risk is low:

```text
FAST_PATH = true
```

Still never guess architecture, contracts, security-sensitive behavior, or silently expand cross-repo scope.

## Clarification packet

When questions are needed, group them where possible:

```text
Need clarification before planning:

1. Target user: ...
   Why it matters: ...

2. Required behavior: ...
   Why it matters: ...

3. Device scope: ...
   Why it matters: ...
```

Avoid one-question-at-a-time interruptions unless new dependencies emerge.

## Readiness statuses

```text
INPUT_READY
CLARIFICATION_REQUIRED
ASSUMPTION_ACCEPTED
PLANNING_READY
DESIGN_READY
EXECUTION_READY

PLANNING_GAP
DESIGN_CLARIFICATION_REQUIRED
UX_PLANNING_GAP
UI_DESIGN_GAP
CAPABILITY_BLOCKED
```

## Core invariants

1. Do not ask what is already known.
2. Do not guess what would materially change the project.
3. Do not block on harmless details that can be safely inferred.
4. Explain why a blocking question matters.
5. Resolve causes and constraints before selecting solutions.
6. Plan before substantial execution.
7. Record material assumptions so downstream agents inherit them.
8. If the user requests clarification-first behavior, treat it as a hard workflow constraint.
