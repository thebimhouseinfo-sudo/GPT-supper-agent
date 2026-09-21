# Concept Measurement & UI Normalization — Specialist Skill Reference v1

## 1. Status

This document is **specialist UI Coder methodology**, not a universal GSA core workflow requirement.

Use it when:
- approved Concept Artwork exists;
- visual fidelity matters;
- image/reference analysis is useful;
- the specialist UI harness selects this technique.

Do not require it for every UI change.

---

## 2. Principle

```text
concept pixels
= measurement evidence
≠ production CSS units
```

Useful flow:

```text
inspect concept
→ identify visual relationships
→ measure when capability permits
→ normalize ratios/constraints
→ reconcile with approved design system
→ implement responsively
```

---

## 3. Preferred relationships

Prefer:
- content width / viewport;
- artwork share / card;
- gap / component;
- repeated spacing/radius patterns;
- relative type hierarchy;
- max-width and composition relationships.

Avoid blind pixel copying.

---

## 4. Existing design-system precedence

When approved tokens already exist:

```text
concept measurement
→ evidence for mapping
→ existing token system wins unless design change explicitly approved
```

Do not infer a duplicate design system from raster noise.

---

## 5. Geometry capability

Two useful capability levels:

```text
CONCEPT_VISUAL_ANALYSIS
→ qualitative/approximate relationships

CONCEPT_PIXEL_GEOMETRY
→ image dimensions + explicit bounding-box/ratio measurement
```

If only qualitative analysis is available, do not pretend exact pixel precision.

---

## 6. Responsive normalization

One concept normally represents one layout mode/range.

It does not automatically define tablet/desktop composition.

Responsive behavior must also come from approved design intent/coverage.

Useful process:

```text
measure
→ normalize
→ project
→ snap/clamp to approved tokens/constraints
→ validate usability
```

---

## 7. Property classes

Possible specialist classification:

```text
PROPORTIONAL
TOKEN_BOUNDED
FIXED_OR_SEMANTIC
```

Examples:

PROPORTIONAL:
- component/artwork width relationships;
- gutters;
- decorative geometry.

TOKEN_BOUNDED:
- typography;
- touch target;
- radii;
- icon sizes.

FIXED_OR_SEMANTIC:
- accessibility minimums;
- safe-area constraints;
- platform-specific fixed semantics.

---

## 8. Typography

Raster imagery cannot prove exact font family/metrics without metadata.

UI Coder may infer hierarchy/relative scale but must use approved Designer/design-system data for exact typography where available.

---

## 9. Art vs UI

Distinguish:

```text
UI geometry
Artwork geometry
Composition relationship
```

Do not recreate artwork silhouettes as code merely because they appear in a concept.

---

## 10. Ephemeral analysis artifacts

Optional specialist artifacts may include:
- concept metrics;
- normalized layout notes;
- implementation constraints.

They are not automatically durable Project Memory.

Persistence occurs only when useful to downstream review/reuse.

---

## 11. Verification

Rendered compare is a separate capability-gated step.

Concept measurement alone does not prove implementation fidelity.

---

## 12. Core invariant

> Measure when it helps, reason in relationships, implement through approved responsive constraints—not literal concept pixels.
