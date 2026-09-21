# UI Specification / Design Coverage Model v1.1

## 1. Status

This document defines design coverage obligations and a specialist reference model, not a mandatory fixed file set.

## 2. Design Coverage Inventory

For material UI-first work:

```text
requirements
+ content model
+ product flows
+ feature list
→ Design Coverage
→ detailed design
→ DESIGN_READY
```

Cover known:
- surfaces/screens;
- flows;
- shared shell/components;
- loading/empty/error/success;
- selected/disabled/completed;
- responsive variants;
- assessment/report;
- media/asset-heavy cases.

## 3. UI tree

UI Tree is useful but not mandatory storage.

Semantic coverage matters more than filename ceremony.

## 4. Surface obligations

Material surfaces should define enough applicable:
- purpose;
- content;
- hierarchy;
- interaction;
- states;
- responsive behavior;
- accessibility;
- assets;
- acceptance.

## 5. Ownership

Planner/product definition owns functional intent/flow/state semantics/responsive priority/accessibility/acceptance.

Designer owns visual hierarchy/composition/visual system/artwork/variants.

Coder owns exact implementation HOW.

## 6. Design system

Prefer existing Project design system.

Designer proposes missing shared visual language.

## 7. Responsive coverage

Specify behavior before breakpoint numbers:
- reflow;
- hide/show;
- sizing;
- crop/contain;
- max-width;
- touchability;
- large-screen use.

## 8. Representative variation

Include materially different cases, not only happy path:
- short/long text;
- assets/audio;
- interactive content;
- assessment/result;
- errors;
- device classes.

## 9. DESIGN_READY

```text
DESIGN_READY
= known required design space covered enough that implementation should not routinely redesign it
```

Does not require every final asset/pixel-perfect screen/mandatory file package.

## 10. SHELL_READY

For content-driven apps:

```text
DESIGN_READY
→ shell implementation
→ representative real-content pilot
→ practical verification
→ SHELL_READY
→ scale-out
```

Practical verification is:
- Tester when runtime capability is AVAILABLE;
- otherwise human Retest/evidence.

## 11. Reopening design

Legitimate reopen reasons:
- new missing capability;
- extreme valid content case;
- new media interaction;
- accessibility/usability defect;
- device/platform constraint.

Shared redesign uses Causal Change Review.

## 12. Traceability

```text
product requirement
→ design coverage
→ design artifact/reference
→ implementation Task
→ verification record
```

## 13. Asset Requirements

Stable Asset Requirement contracts may support placeholder integration before final binary availability.

## 14. Specialist delegation

Detailed UI methodology belongs to specialist design/UI skills.

## 15. Core principle

> Cover the known product space before coding, but do not confuse coverage obligations with a mandatory document tree or unavailable practical verification.
