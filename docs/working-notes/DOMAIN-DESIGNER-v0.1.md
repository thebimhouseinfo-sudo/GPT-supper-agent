# DOMAIN DETAIL — Designer v0.1

## Status

```text
PHASE = THEORY DETAIL
DOMAIN = DESIGNER
STATUS = WORKING_DRAFT
CANONICAL = false
```

Designer is a specialist role for visual/interface design work. This document defines semantics, not the final Phase 2 harness prompt or methodology.

---

## 1. Purpose

Designer turns approved product/UX requirements into coherent visual design intent and implementation-ready visual artifacts.

```text
Planner
→ what the product must do / readiness requirements

Designer
→ how applicable user-facing surfaces should visually communicate that intent
```

Designer must not silently change product behavior, information architecture, navigation semantics, or approved functional priorities.

---

## 2. Inputs

Designer may consume:

- Project context;
- approved product intent;
- target audience;
- known UI tree / flow / states;
- design coverage requirements;
- existing design system;
- screenshots/references;
- responsive/device requirements;
- content constraints;
- existing assets;
- relevant specialist design skills;
- prior design findings.

Designer should inspect current repo/UI only as read-only evidence when needed.

---

## 3. Outputs

Depending on scope, Designer may produce:

- visual direction;
- concept artwork;
- design-system proposals/tokens;
- component visual rules;
- responsive visual behavior;
- state/variant treatment;
- artwork/icon language;
- asset requirements/contracts;
- asset prompts/specs;
- design acceptance references;
- gap/escalation notes.

Not every design Job requires all outputs.

---

## 4. Concept-first principle

### Nomination

Prefer:

```text
functional/design requirements
→ visual concept
→ critique/refine
→ derive concrete visual assets/components from concept
```

rather than inventing a large asset list before visual direction exists.

Rationale:

- preserves coherence;
- avoids disconnected asset generation;
- gives Coder a visual source of truth.

Alternative:
asset-first design for highly modular systems where style is already fully fixed.

Mark: `REVIEW_REQUIRED`.

---

## 5. Design methodology delegation

GSA core should not freeze one universal visual-design methodology.

Designer must instead:

```text
identify design problem
→ load appropriate specialist design skill/harness
→ satisfy GSA-level output/readiness contract
```

Examples of specialist concerns:

- responsive composition;
- visual hierarchy;
- accessibility-aware visual design;
- child-facing design;
- typography;
- iconography;
- artwork blending;
- component-state coverage.

The methodology can evolve empirically in Phase 2+.

---

## 6. Design Coverage

Designer must ensure the visual design covers the known states/surfaces required by the product.

Coverage may include:

- entry/empty/loading/error/success;
- selected/disabled/completed;
- responsive variants;
- modal/popover;
- long/short content;
- interactive/asset-heavy states.

Designer should not design only one attractive happy-path screen when known product flows require more.

---

## 7. DESIGN_READY

Designer contributes to `DESIGN_READY`.

### Nomination

`DESIGN_READY` means:

- known required surfaces/states are visually covered;
- shared visual system is coherent enough to implement;
- responsive intent is defined enough to avoid routine redesign;
- asset slots/contracts are known enough for implementation;
- major visual decisions are not left to Coder.

It does **not** require every final binary asset to already exist if placeholders/contracts are sufficient.

Alternative:
require all final assets before DESIGN_READY.

Cost:
unnecessarily blocks implementation.

Mark: `REVIEW_REQUIRED`.

---

## 8. Design and assets

Designer may define visual Asset Requirements.

Stable integration contract should precede final binary asset where possible:

```text
asset identity / intended role / target usage
→ stable implementation contract
→ placeholder permitted
→ final production asset later
```

Designer is not required to produce every final production asset itself.

Asset production may be separate work.

---

## 9. Designer and source code

Designer is source read-only.

Designer may inspect existing source/UI structure to understand constraints.

Designer must not:

- edit implementation source;
- silently change functional behavior;
- patch code because design is inconvenient;
- merge/deploy.

If design cannot fit approved behavior/architecture, emit a design/planning conflict for Causal Change Review.

---

## 10. Designer and human subjectivity

Visual direction often contains subjective judgement.

Designer may:

- propose;
- explain;
- compare against approved reference/rubric;
- identify objective violations.

Designer may not make binding subjective acceptance decisions on behalf of the human.

Where no objective rubric exists:

```text
→ HUMAN_REVIEW_REQUIRED
```

---

## 11. Design review

Design Review is topology-driven, not automatic for every design change.

When required, Reviewer checks against known objective requirements and evidence.

Subjective visual preference remains a Human Gate unless grounded by an approved concrete reference/rubric.

---

## 12. Responsive design

Designer defines intended behavior across meaningful device/space ranges.

Do not reduce responsive design to breakpoint numbers.

Relevant intent includes:

- hierarchy preservation;
- reflow;
- hide/show priority;
- crop/contain strategy;
- max-width behavior;
- density;
- touchability;
- optional decorative content.

Exact CSS/breakpoint implementation remains Coder territory.

---

## 13. Design-system relationship

### Nomination

Prefer inheritance/reuse of an existing Project design system before inventing new visual language.

If a new visual rule is needed:

```text
local exception?
→ keep local if truly local

shared pattern?
→ propose Project-level design-system update
```

Alternative:
allow each app/Job to freely establish its own visual system.

Cost:
visual fragmentation.

Mark: `REVIEW_REQUIRED`.

---

## 14. Direct Designer

Direct Designer may be used for small standalone work without Project creation.

### Nomination

Direct Designer output is ephemeral unless user explicitly asks to persist/promote it into a Project.

This mirrors Direct Planner.

Mark: `REVIEW_REQUIRED`.

---

## 15. Designer invariants

1. Designer owns visual interpretation, not product behavior.
2. Designer is source read-only.
3. Design must cover known required states/surfaces.
4. Designer uses specialist methodology rather than GSA hard-coding one design theory.
5. DESIGN_READY is about implementation readiness, not final asset completeness.
6. Subjective acceptance remains human-owned unless objective rubric exists.
7. Responsive intent is semantic, not just breakpoint numbers.
8. Physical storage layout is deferred.

---

## 16. COLLECT candidates

- design artifact lineage;
- selected concept/reference;
- design coverage state;
- design-system/tokens refs;
- asset requirement links;
- approval/human review refs;
- DESIGN_READY state/evidence;
- visual acceptance references.

### Nominated for REVIEW

1. Concept-first as default.
2. DESIGN_READY does not require all final binary assets.
3. Reuse inherited design system by default.
4. Direct Designer ephemeral unless promoted.
