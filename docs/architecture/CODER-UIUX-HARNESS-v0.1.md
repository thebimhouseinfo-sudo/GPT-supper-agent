# Coder UX/UI Specialization v1

## 1. Purpose

UX Coder and UI Coder are specializations of Coder used when user-facing work benefits from distinct behavioral and visual implementation focus.

They are not automatically separate Jobs.

---

## 2. Shared authority

Both may write only approved Project-owned source within Job/Task scope.

They read Planner/Designer artifacts but do not edit durable Project theory/spec/review history directly.

---

## 3. UX Coder

UX Coder focuses on:
- navigation/flow;
- state transitions;
- loading/empty/error/success;
- validation;
- keyboard/touch;
- accessibility behavior;
- responsive semantics;
- progression/recovery;
- data/state wiring.

UX Coder must not invent unresolved product behavior.

---

## 4. UI Coder

UI Coder focuses on:
- composition;
- hierarchy;
- relative scale;
- spacing/density;
- typography;
- visual tokens;
- artwork/icon placement;
- blending;
- state appearance;
- responsive visual composition.

UI Coder treats approved design artifacts as implementation constraints, not decorative inspiration.

---

## 5. Ordering

There is no fixed UX→UI or UI→UX sequence.

Detailed Execution Plan chooses causal ordering.

Examples:

```text
UI-first content app
→ shell/composition first
→ UX behavior on shell
→ joint verification

interaction-first system
→ UX/state model first
→ visual treatment later
```

---

## 6. Design fidelity

Applicable requirements may be classified as:

```text
MUST MATCH
INTENT MATCH
IMPLEMENTATION FLEXIBLE
```

Exact classification belongs to specialist harness and approved design context.

Coder may choose implementation-flexible details but must escalate material design gaps.

---

## 7. Render/compare capability

Autonomous visual verification requires actual capabilities such as:
- runnable app/preview;
- browser/renderer;
- screenshot capture;
- design reference access;
- visual analysis.

Capability state is:

```text
AVAILABLE
UNAVAILABLE
UNKNOWN
```

If required capabilities are missing, verification mode becomes DEGRADED or BLOCKED.

Do not claim render comparison without actual capability.

---

## 8. Missing assets

Stable placeholder integration is allowed when approved.

```text
stable asset contract
→ placeholder
→ source integration
→ final asset later
→ Retest
```

Missing final asset does not automatically block implementation or DESIGN_READY.

---

## 9. UX/UI conflict

If visual implementation would break approved behavior, or behavior makes approved design impossible:

```text
do not silently compromise
→ identify conflict
→ route through Causal Change Review / Planner / Designer as appropriate
```

---

## 10. Self QA/QC

UX/UI Coder performs:
- scope/plan compliance;
- behavioral checks;
- visual checks where possible;
- responsive checks;
- asset integration checks;
- regression checks;
- diff inspection.

Independent Reviewer/Tester only where topology requires them.

---

## 11. Evidence

Where capability exists, handoff may include:
- screenshots;
- viewport labels;
- behavior test evidence;
- known deviations;
- asset status;
- CI/build/test refs.

Unavailable evidence must be stated honestly.

---

## 12. Core invariant

> UX/UI specializations improve implementation focus without turning their preferred internal method into a universal Job topology.
