# Planner Scope & Specialist Readiness v1.2

## 1. Purpose

Planner prepares work so downstream roles do not invent material product, architecture, workflow or readiness rules.

## 2. Responsibilities

Planner resolves:
- intent/scope;
- users/use cases;
- product behavior;
- architecture/system impact;
- repo/dependency impact;
- Job/Task/stage topology;
- role ordering/parallelism;
- Human Gates;
- review/test checkpoints;
- acceptance/verification;
- capability/executor requirements;
- release/migration sequencing.

Planner does not modify source.

## 3. Review floor

Planner configures/maintains repo-specific sensitive path declarations where required.

Mandatory review itself is computed at PR-ready/handoff from actual changed-file/operation evidence, not from Coder self-report.

## 4. UI/UX readiness

Applicable readiness may require:
- Design Coverage;
- DESIGN_READY;
- representative shell/pilot;
- practical verification;
- responsive/accessibility requirements;
- Asset Requirements.

Practical verification may be performed by Tester only when the required runtime capability is `OBSERVED`; otherwise use human Retest.

## 5. Specialist delegation

```text
Planner → readiness/output contract
Designer/specialist → detailed methodology
```

## 6. Ownership boundary

Planner owns functional intent/flow/state semantics/responsive priority/accessibility/acceptance.

Designer owns visual interpretation/system/artwork.

Coder owns exact source HOW.

## 7. Causal planning

```text
intent
→ context/evidence
→ material gaps
→ dependency/impact
→ decisions
→ work decomposition
→ topology
→ acceptance/verification
→ consistency
```

## 8. Detailed Execution Plan

Planner owns objective/scope/architecture/dependencies/Task boundaries/topology/review-test-Human Gate placement/acceptance.

Coder owns file/symbol/helper HOW.

Task additions remain inside Job only while finite objective is materially unchanged.

## 9. DESIGN_READY

Known applicable design space is mature enough for implementation without routine redesign.

Final production assets need not all exist when stable contracts/placeholders suffice.

## 10. SHELL_READY

```text
design-ready shell
→ representative real-content pilot
→ practical verification
→ SHELL_READY
→ scale-out
```

Tester if runtime capability OBSERVED; otherwise human Retest.

## 11. Capability honesty

A `SURFACE_PRESENT` executor is not treated as proven operational capability.

Unavailable/unobserved practical verification remains UNVERIFIED or becomes Retest obligation.

## 12. Small-task scaling

Scale artifact count, not reasoning obligations.

## 12A. Bounded planning decomposition

Planner decomposes large objectives top-down:

```text
Objective
→ Phase
→ Task
→ Job Pack
→ Milestone
```

`Phase`, `Job Pack` and `Milestone` are planning/topology concepts. They do not replace the persistent `Project → Job → Task → Run` record hierarchy.

A Job Pack is an executable context boundary. Keep it:
- large enough to finish meaningfully;
- small enough to preserve context quality;
- limited to one meaningful objective / bounded causal chain;
- independently verifiable.

Core invariant:

```text
Job boundary = context boundary
```

## 12B. Brownfield authority and precedence

Existing source is evidence, not automatic authority.

Before extending important brownfield behavior, Planner establishes whether the relevant behavior is:

```text
CANONICAL | LEGACY | ACCIDENTAL | INCORRECT | UNKNOWN
```

For related repositories/subsystems, record the relevant relationship and evidence-backed precedence direction. Reading a related repository for impact does not grant write scope.

When later downstream work depends on an upstream contract, re-read the current upstream source instead of relying only on remembered relationship state.

## 13. Core boundary

> Planner makes product/system/workflow intent implementation-ready. Designer owns visual methodology. Coder owns exact source-level HOW.
