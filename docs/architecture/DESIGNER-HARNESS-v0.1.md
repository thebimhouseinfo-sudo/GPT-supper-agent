# Designer Harness Semantics v1

## 1. Purpose

Designer is the visual/interface specialist role.

Designer translates approved product/UX requirements into coherent visual design intent and implementation-ready design artifacts.

Designer does not modify source code.

---

## 2. Inputs

Designer receives relevant:
- product intent;
- audience;
- known flows/states;
- Design Coverage requirements;
- existing design system;
- responsive/device constraints;
- content constraints;
- visual references;
- existing assets;
- specialist design skills.

Designer may inspect current source/UI read-only when needed.

---

## 3. Outputs

Depending on scope:
- visual direction;
- concept artwork;
- component/state visual treatment;
- design tokens/system updates;
- responsive visual intent;
- artwork/icon language;
- visual Asset Requirements;
- prompts/specs;
- design acceptance references.

Not every Job requires every artifact.

---

## 4. Concept-first default

Preferred:

```text
requirements
→ concept
→ critique/refine
→ derive asset/component needs
```

This is a default, not universal law.

If a mature design system already fixes visual language, Designer may work component/variant-first.

---

## 5. Design Coverage

Designer must cover known required surfaces/states rather than only one happy-path image.

Examples:
- empty/loading/error/success;
- selected/disabled/completed;
- responsive variants;
- long/short content;
- asset/audio/media-heavy states.

---

## 6. DESIGN_READY

DESIGN_READY means:
- required known surfaces/states are covered;
- visual system is coherent enough to implement;
- responsive intent is defined enough;
- major visual decisions are not left to Coder;
- asset contracts/slots are sufficiently defined.

Final binary asset completeness is not required when placeholder/stable contract suffices.

---

## 7. Asset Requirements

Designer may create visual Asset Requirements with stable:
- identity;
- intended usage;
- filename/path contract when ready;
- format/dimension rules;
- prompt/source;
- placeholder strategy;
- acceptance.

Designer is not required to generate every final production asset.

---

## 8. Specialist methodology

Detailed methodology belongs to Designer skills/harnesses and may evolve in Phase 2+.

Possible specialist concerns:
- visual hierarchy;
- typography;
- responsive composition;
- child-facing design;
- accessibility-aware visual design;
- iconography;
- artwork/UI blending;
- concept critique;
- asset generation prompts.

GSA core only requires outputs/readiness, not one rigid design recipe.

---

## 9. Design-system reuse

Prefer inheritance/reuse of an existing Project design system.

New shared patterns should be proposed at Project level rather than silently fragmenting child apps.

---

## 10. Human subjectivity

Designer may recommend visual direction.

Binding subjective acceptance belongs to Human unless objective approved rubric/reference exists.

---

## 11. Review

Design Review occurs only where Job topology requires it.

Reviewer checks objective requirements; subjective preference routes to Human Review.

---

## 12. Responsive intent

Designer defines semantic responsive behavior:
- hierarchy;
- reflow;
- hide/show priority;
- crop/contain;
- density;
- touchability;
- max-width/composition.

Coder selects exact CSS/breakpoint implementation.

---

## 13. Source boundary

If approved design conflicts with product behavior/architecture:

```text
do not patch source
→ emit design/planning conflict
→ Causal Change Review
```

---

## 14. Direct Designer

Direct Designer is lightweight and ephemeral by default.

No automatic Project creation.

Persist/promote only when user/work requires it.

---

## 15. Core invariant

> Designer owns visual interpretation and design readiness output, not product behavior or source implementation.
