# Concept Measurement & UI Normalization v0.1

## 1. Purpose

UI Coder must not rely only on subjective visual imitation.

When an approved Concept Artwork is available, UI Coder should extract measurable geometry from the concept and convert it into a normalized UI model before implementation.

Pipeline:

```text
Concept Artwork
  ↓
Measure visual geometry
  ↓
Normalize coordinates and proportions
  ↓
Infer repeated layout relationships
  ↓
Map to design tokens / constraints
  ↓
Generate implementation rules
  ↓
Code
```

The goal is NOT to copy raw concept pixels into CSS.

> Measure in pixels, reason in ratios and constraints, implement in responsive units.

## 2. Required concept metadata

Designer should attach concept metadata whenever practical:

```yaml
concept_id: math-home-v2
canvas:
  width: 1600
  height: 1000
intended_layout_mode: WIDE
nominal_viewport:
  width: 1440
  height: 900
safe_area: none
```

The canvas size is the measurement coordinate system. The nominal viewport describes the intended product presentation and prevents treating decorative margins as browser space.

## 3. Geometry extraction

For each major visual region, UI Coder records a bounding box:

```text
x
y
width
height
```

Examples:
- app shell
- header
- main content container
- hero/artwork region
- cards
- card artwork
- text block
- primary button
- navigation region
- major gaps and gutters

Raw coordinates are evidence only.

## 4. Normalized geometry

For concept canvas width W and height H:

```text
nx = x / W
ny = y / H
nw = width / W
nh = height / H
```

Example:

```text
Concept canvas: 1600 × 1000
Main container: x=160, width=1280

normalized:
left = 0.10 W
width = 0.80 W
right = 0.10 W
```

Implementation conclusion may become:

```css
width: min(80vw, 1280px);
margin-inline: auto;
```

rather than hard-coding `left: 160px`.

## 5. Relative measurements

UI Coder should prefer relationships between elements over absolute dimensions.

Examples:

```text
header height / canvas height
card width / content width
artwork width / card width
gap / card width
title size / body size
button height / card height
```

Example:

```text
Artwork width = 42% of card
Text region = 50% of card
Internal gap = 8% of card
```

This preserves the concept relationship across responsive layouts.

## 6. Repeated-value inference

UI Coder should look for repeated values and infer a small token system.

Example measured gaps:

```text
15px, 16px, 17px, 31px, 32px, 33px
```

Likely normalized spacing system:

```text
base = 16
space-1 = 16
space-2 = 32
```

Do not preserve random raster noise as separate CSS values.

Similar normalization applies to:
- border radius
- card heights
- icon sizes
- section gaps
- side gutters
- typography scale

## 7. Token normalization

Raw measurements should be converted into semantic tokens.

Example:

```json
{
  "layout": {
    "contentMax": "72rem",
    "pageGutterCompact": "1rem",
    "pageGutterRegular": "1.5rem",
    "pageGutterWide": "2rem"
  },
  "spacing": {
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "2rem"
  },
  "radius": {
    "card": "1.5rem"
  }
}
```

Exact values must be reconciled with the existing project design system. Existing approved tokens override newly inferred duplicates.

## 8. Typography measurement

Raster concept art cannot reliably reveal an exact font family or exact CSS font metrics unless Designer metadata specifies them.

UI Coder may estimate:
- hierarchy
- relative font scale
- approximate line height
- text block width
- weight category
- alignment

But MUST use Designer/Planner typography metadata for exact family/weight when available.

Example normalization:

```text
Concept title appears ~1.6× body text
→ map to existing type scale nearest 1.5–1.7 ratio
```

Do not pretend raster estimation proves an exact font size.

## 9. Component geometry model

Each major component may produce a normalized record:

```json
{
  "id": "topic-card",
  "concept_bbox": {"x": 210, "y": 340, "w": 360, "h": 190},
  "normalized": {"x": 0.131, "y": 0.34, "w": 0.225, "h": 0.19},
  "relationships": {
    "artwork_share": 0.44,
    "text_share": 0.46,
    "internal_gap_share": 0.10
  },
  "implementation": {
    "aspect_ratio": 1.89,
    "artwork_basis": "44%",
    "layout": "horizontal"
  }
}
```

## 10. Responsive normalization

A single concept usually represents one layout mode, not every screen size.

UI Coder combines measured concept geometry with Planner's Responsive Spec.

Example:

```text
WIDE concept measurement:
card width = 22.5% content width

Planner says:
REGULAR = 2 columns
COMPACT = 1 column

Implementation:
WIDE    → 4-column grid near measured ratio
REGULAR → 2-column grid
COMPACT → 1-column grid
```

Measurements define proportions inside a mode; Responsive Spec defines how modes change.

## 11. Constraint extraction

UI Coder should translate concept geometry into constraints such as:

```text
content centered
content max-width
artwork must remain 35–45% of card
topic card aspect ratio near 1.8–2.0
header height approximately one card internal-spacing unit × N
hero cannot exceed one-third viewport height
primary CTA remains visually stronger than secondary actions
```

Constraints are more robust than raw pixel coordinates.

## 12. Measurement confidence

Every inferred metric should have a confidence class:

```text
HIGH
→ clear hard edge / explicit Designer metadata / repeated geometry

MEDIUM
→ visually clear but affected by artwork or anti-aliasing

LOW
→ typography estimate / ambiguous boundary / decorative overlap
```

Low-confidence values should not become hard requirements without corroboration.

## 13. Art vs UI separation

UI Coder must distinguish:

```text
UI geometry
→ code/CSS/layout

Artwork geometry
→ image itself

Composition relationship
→ how artwork is placed in UI
```

Example:

Concept contains a cloud extending outside a card.

Do not code the cloud silhouette in CSS.
Use the artwork asset, then reproduce its placement/overflow relationship.

## 14. Output artifacts

Before substantial UI coding, UI Coder may generate ephemeral or reviewable artifacts:

```text
CONCEPT-METRICS.json
NORMALIZED-LAYOUT.json
UI-MEASUREMENT-NOTES.md
```

Example structure:

```json
{
  "concept": "math-home-v2",
  "layoutMode": "WIDE",
  "regions": [],
  "tokens": {},
  "constraints": [],
  "confidence": {}
}
```

These are implementation-analysis artifacts. Whether they are persisted to Project Memory is decided by the plan; they do not automatically become product requirements.

## 15. Capability model

Concept measurement does NOT require the plugin to render the application.

It requires access to the Concept Artwork and sufficient image-analysis capability.

Two levels are recognized:

```text
CONCEPT_VISUAL_ANALYSIS
→ understand regions, hierarchy, approximate geometry

CONCEPT_PIXEL_GEOMETRY
→ access image dimensions and calculate explicit pixel bounding boxes/ratios
```

If only visual analysis is available, UI Coder may produce approximate normalized relationships and must mark confidence accordingly.

If pixel-geometry tooling is available, use actual image dimensions for stronger measurements.

## 16. Implementation rule

UI Coder should never translate a concept like:

```text
x=164px
width=358px
gap=27px
```

directly into fixed production CSS without normalization.

Instead:

```text
measure
→ normalize
→ cluster/reconcile
→ map to semantic tokens
→ encode responsive constraints
→ implement
```

## 17. Core invariant

> Concept pixels are measurement evidence, not production units.