# Planner Scope & Specialist Readiness v1.1

## 1. Purpose

Planner prepares work so downstream roles do not invent material product, architecture, workflow or readiness rules during implementation.

Planner owns orchestration of readiness, not every specialist methodology.

## 2. Planner responsibilities

Planner resolves applicable:
- intent/scope;
- target users/use cases;
- product behavior;
- architecture/system impact;
- repo/dependency impact;
- Job/Task/milestone topology;
- role ordering;
- parallelism/conflicts;
- Human Gates;
- review/test checkpoints;
- acceptance criteria;
- verification strategy;
- capability/executor feasibility;
- release/migration sequencing.

Planner does not modify source.

## 3. Review-floor responsibility

Planner may choose normal review topology, but must also apply mandatory mechanically triggered review classes defined by Foundation F13.

A planned required review may not be silently removed.

## 4. UI/UX readiness

For material user-facing work Planner ensures known product flows/states are identified before dependent implementation.

Applicable readiness may require:
- Design Coverage;
- DESIGN_READY;
- representative shell/pilot;
- practical verification checkpoint;
- responsive/accessibility requirements;
- Asset Requirements;
- objective visual/behavior acceptance where possible.

Practical verification may be performed by Tester only when capability is AVAILABLE; otherwise use human Retest.

## 5. Specialist delegation

```text
Planner
→ identifies specialist need
→ defines readiness/output contract
→ routes to specialist

Designer / specialist skill
→ performs detailed design methodology
```

## 6. Product/UX vs visual ownership

Planner owns functional intent:
- user goal;
- information architecture;
- navigation/flow;
- state semantics;
- content hierarchy;
- responsive priority/behavior;
- accessibility behavior;
- acceptance.

Designer owns visual interpretation where not fixed:
- composition;
- visual hierarchy;
- palette/type;
- artwork/icon language;
- background;
- visual tokens;
- concept;
- visual Asset Requirements.

Coder implements approved intent.

## 7. Causal planning model

```text
intent
→ context/evidence
→ material gaps
→ dependency/impact
→ decisions
→ work decomposition
→ topology
→ acceptance/verification
→ consistency check
```

No mandatory P0–P11 ceremony.

## 8. Detailed Execution Plan split

Planner owns:
- objective;
- scope;
- architecture;
- dependencies;
- milestone topology;
- Task boundaries;
- review/test/Human Gate placement;
- mandatory review-trigger application;
- acceptance/verification constraints.

Coder owns exact file/symbol/helper HOW after live-source inspection.

## 9. Design Coverage / DESIGN_READY

```text
requirements
→ Design Coverage
→ design
→ DESIGN_READY
→ implementation
```

DESIGN_READY means known applicable design decisions are mature enough for implementation without routine redesign.

Final production binary assets need not all exist if stable contracts/placeholders suffice.

## 10. SHELL_READY

For content-driven apps:

```text
design-ready shell
→ representative real-content pilot
→ practical verification
→ SHELL_READY
→ scale-out
```

Practical verification:
- Tester when runtime capability exists;
- otherwise human Retest with durable evidence.

## 11. Acceptance / capability

Unavailable runtime/device capability is not pass.

Planner records capability requirements and degraded evidence path.

Use PASS_RETEST_REQUIRED when required online evidence is sufficient but practical verification remains.

## 12. Small-task scaling

Scale artifact count, not reasoning obligations.

No fixed physical design file tree is mandated.

## 13. Core boundary

> Planner makes product/system/workflow intent implementation-ready. Designer owns detailed visual design methodology. Coder owns exact source-level HOW.
