# UI Specification / Design Coverage Model v1

## 1. Status

This document defines **design coverage obligations and a specialist reference model**, not a mandatory fixed set of files that Planner must always produce.

GSA core asks:

```text
Are all known product surfaces/states covered enough for design/implementation?
```

Specialist UI design skills decide the detailed methodology and artifact shape.

---

## 2. Design Coverage Inventory

Before detailed UI design for material UI-first work:

```text
requirements
+ content model
+ product flows
+ feature list
→ Design Coverage Inventory
→ detailed design
→ DESIGN_READY
```

Coverage should identify known:
- screens/surfaces;
- flows;
- shared shell/components;
- loading/empty/error/success states;
- selected/disabled/completed states;
- responsive variants;
- assessment/report states where applicable;
- media/asset-heavy cases.

---

## 3. UI tree is a useful technique, not universal storage mandate

A UI Tree is strongly useful for many apps, especially content-driven products.

Example:

```text
App Shell
├── Home
├── Topic
├── Lesson
├── Exercise
└── Result
```

But GSA theory does not require every product to persist a file named UI-TREE.md.

The requirement is semantic coverage, not filename ceremony.

---

## 4. Node/surface specification obligations

Material surfaces should have enough definition for applicable:
- purpose;
- content;
- hierarchy;
- interaction;
- states;
- responsive behavior;
- accessibility;
- assets;
- acceptance.

These may live in one document, design tool, structured data, or specialist artifact set.

---

## 5. Functional vs visual ownership

Planner/product definition owns:
- user goal;
- flow/navigation;
- content hierarchy;
- behavioral state semantics;
- responsive priority;
- accessibility behavior;
- acceptance intent.

Designer owns:
- visual hierarchy;
- composition;
- concrete visual system/tokens when not inherited;
- artwork/icon language;
- visual variants;
- design coverage visualization.

Coder owns exact implementation HOW.

---

## 6. Design system

Prefer existing Project design system.

If absent or incomplete, Designer proposes shared visual language.

Do not require Planner to invent color/type/spacing values merely to fill a spec.

---

## 7. Responsive coverage

Specify intended behavior before implementation breakpoints.

Applicable questions:
- what reflows;
- what hides;
- what remains;
- what grows/shrinks;
- crop/contain strategy;
- max-width behavior;
- touchability;
- large-screen use of space.

Breakpoints remain implementation detail unless already fixed by design system.

---

## 8. Representative variation

Coverage should include materially different content/state cases, not only average happy path.

Examples:
- very short/long text;
- asset-heavy lesson;
- audio;
- interactive content;
- assessment;
- result/report;
- error/recovery;
- mobile/tablet/desktop where applicable.

---

## 9. DESIGN_READY

```text
DESIGN_READY
= known required design space covered enough that implementation should not routinely need redesign
```

Does not require:
- every final production asset;
- every pixel-perfect screen;
- one mandatory file package.

It does require:
- no known major visual/flow state left undefined for dependent code.

---

## 10. SHELL_READY

For content-driven apps:

```text
DESIGN_READY
→ shell implementation
→ representative real-content pilot
→ Tester
→ SHELL_READY
→ scale-out
```

SHELL_READY means normal future content should fit without routine shared-shell redesign.

---

## 11. Reopening design

After DESIGN_READY/SHELL_READY, design may reopen for:
- genuinely missing capability;
- extreme legitimate content case;
- new media interaction;
- accessibility/usability defect;
- device/platform constraint.

Shared redesign goes through Causal Change Review.

---

## 12. Traceability

Useful trace:

```text
product requirement
→ design coverage item
→ design artifact/reference
→ implementation Task
→ verification evidence
```

Exact IDs/files are implementation/storage detail.

---

## 13. Asset Requirements

Visual assets are derived from approved design where practical.

Stable Asset Requirement contracts may allow placeholder integration before final binaries are available.

---

## 14. Specialist delegation

Detailed UI methodology—component audits, token systems, responsive checklists, visual QA, concept generation—belongs to specialist Designer/UI skills.

This document provides GSA-level coverage/readiness constraints only.

---

## 15. Core principle

> Cover the known product space before coding, but do not confuse coverage obligations with a mandatory document tree or one universal UI methodology.
