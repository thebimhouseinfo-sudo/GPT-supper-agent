# Planner Scope & Specialist Readiness v1

## 1. Purpose

Planner prepares work so downstream roles do not need to invent material product, architecture, workflow, or readiness rules during implementation.

Planner owns orchestration of readiness, not every specialist methodology.

---

## 2. Planner responsibilities

Planner resolves applicable:
- intent and scope;
- target users/use cases;
- product behavior;
- architecture/system impact;
- repository/dependency impact;
- Job/Task/milestone topology;
- role ordering;
- parallelism/conflicts;
- Human Gates;
- review/test checkpoints;
- acceptance criteria;
- verification strategy;
- capability/executor feasibility;
- release/migration sequencing.

Planner does not modify source code.

---

## 3. UI/UX readiness

For material user-facing work, Planner must ensure known product flows/states are identified before dependent implementation.

Planner should require applicable:
- Design Coverage;
- DESIGN_READY;
- representative pilot/shell readiness;
- Tester checkpoint;
- responsive/accessibility requirements;
- Asset Requirements;
- objective visual/behavior acceptance where possible.

Planner does NOT need to perform detailed visual design methodology itself.

---

## 4. Specialist delegation

```text
Planner
→ identifies that specialist work is required
→ defines required readiness/output contract
→ routes to specialist harness/skill

Designer / specialist skill
→ performs detailed design methodology
```

This prevents GSA core from accumulating one homemade UI methodology.

---

## 5. Product/UX vs visual ownership

Planner owns functional intent:
- user goal;
- information architecture;
- navigation/flow;
- state semantics;
- content hierarchy;
- responsive priority/behavior intent;
- accessibility behavior;
- acceptance.

Designer owns visual interpretation where not already fixed:
- composition;
- visual hierarchy;
- palette/type treatment;
- artwork/icon language;
- background treatment;
- concrete visual tokens;
- concept;
- visual Asset Requirements.

Coder implements approved intent and may not silently redesign either.

---

## 6. Causal planning model

Planner uses causal reasoning, not mandatory P0–P11 ceremony.

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

Exact internal steps belong to the Phase 2 harness.

---

## 7. Detailed Execution Plan split

Planner owns:
- objective;
- scope;
- architecture;
- dependencies;
- milestone topology;
- Task boundaries;
- review/test/Human Gate placement;
- acceptance/verification constraints.

Coder owns:
- exact file/symbol/helper-level HOW;
- local implementation sequencing after inspecting live source.

Material mismatch routes through Causal Change Review.

---

## 8. Design Coverage

Before detailed design/implementation of UI-first products:

```text
requirements
→ Design Coverage inventory
→ design work
→ DESIGN_READY
→ implementation
```

Coverage means known surfaces/states/variants are not accidentally discovered during coding.

Exact checklist belongs to specialist design skill.

---

## 9. DESIGN_READY

DESIGN_READY means applicable design decisions are mature enough for implementation without routine redesign.

It does not require every final production asset binary to exist if stable asset contracts/placeholders are sufficient.

---

## 10. SHELL_READY

For content-driven apps, Planner may define:

```text
design-ready shell
→ representative real-content pilot
→ Tester
→ SHELL_READY
→ scale-out
```

UI may reopen later only for legitimate newly discovered capabilities/constraints through Causal Change Review.

---

## 11. Acceptance and verification

Planner defines observable criteria and how they can be verified.

Unavailable runtime/device capability must not be treated as pass.

Use PASS_RETEST_REQUIRED when online evidence is sufficient but practical verification remains.

---

## 12. Small-task scaling

Scale artifact count, not reasoning obligations.

Small work may use one compact planning note rather than a large document package.

No fixed physical design file tree is mandated here.

---

## 13. Core boundary

> Planner makes product/system/workflow intent implementation-ready. Designer owns detailed visual design methodology. Coder owns exact source-level implementation HOW.
