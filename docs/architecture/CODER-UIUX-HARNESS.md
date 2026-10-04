# Coder UX/UI Specialization v1.1

## 1. Purpose

UX Coder and UI Coder are Coder specializations for behavioral and visual implementation focus.

They are not separate Jobs by default.

## 2. Shared authority

Both write only approved Project-owned source within Job/Task scope.

Every source-writing Run declares a scope claim and rechecks Project lifecycle/target before consequential writes.

## 3. UX Coder

Focus:
- navigation/flow;
- state transitions;
- loading/empty/error/success;
- validation;
- keyboard/touch;
- accessibility behavior;
- responsive semantics;
- progression/recovery;
- data/state wiring.

No unresolved product behavior may be invented.

## 4. UI Coder

Focus:
- composition;
- hierarchy;
- scale;
- spacing/density;
- typography;
- visual tokens;
- artwork/icon placement;
- blending;
- state appearance;
- responsive visual composition.

Approved design is implementation constraint, not decorative inspiration.

## 5. Runtime activation

UI Coder frontend methodology is exposed through the task-specific runtime skill `ui-coder-frontend`.

Activation is explicit:

```text
Planner/Orchestrator classifies frontend / UI Coder work
→ Coder handoff names ui-coder-frontend
→ Coder loads ui-coder-frontend before frontend implementation
```

The specialization is not part of default Coder skills. Normal non-UI Coder work remains on the base Coder harness/skills.

UI Coder implements directly in the target repository source. A separate provider/design workspace is not part of the generic frontend workflow.

## 6. Ordering

No fixed UX→UI or UI→UX order.

Detailed Execution Plan chooses causal order.

## 7. Design fidelity

Specialist harness may classify:
```text
MUST MATCH
INTENT MATCH
IMPLEMENTATION FLEXIBLE
```

Material design gaps escalate.

## 8. Render/compare capability

Autonomous visual verification requires actual:
- runnable app/preview;
- browser/renderer;
- screenshot capture;
- reference access;
- visual analysis.

If unavailable:
```text
criterion/result = UNVERIFIED where applicable
verification mode = DEGRADED or BLOCKED
```

Do not claim visual runtime verification without capability.

## 9. Missing assets / child Designer

Stable placeholder integration is allowed:

```text
stable asset contract
→ placeholder
→ source integration
→ final asset
→ practical verification
```

If Coder needs non-independent Designer assistance:
```text
Coder parent Run
→ Designer child Run
→ attributed design/asset output
→ Coder parent resumes
```

## 10. UX/UI conflict

Material conflict:
```text
do not silently compromise
→ Causal Change Review / Planner / Designer
```

## 11. Self QA/QC

UX/UI Coder performs:
- scope/plan compliance;
- applicable behavioral/visual/static checks;
- capability-backed checks;
- regression/diff inspection;
- Coder Goal Recheck per `CODER-GOAL-RECHECK.md`.

Self QA/QC does not replace mandatory or topology-scheduled context-isolated review.

## 12. Evidence

Handoff records only evidence actually available.

Unavailable checks remain explicit UNVERIFIED.

Practical UI verification may become human Retest when Tester/runtime capability is unavailable.

UI Coder may use browser inspection against the runnable target for bounded development/self-QA only when the browser capability succeeds for that exact target. This observation does not replace independent Tester verification or Human subjective acceptance.

## 13. Core invariant

> UX/UI specialization improves implementation focus without inventing unavailable verification or turning specialist methodology into universal Job topology.
