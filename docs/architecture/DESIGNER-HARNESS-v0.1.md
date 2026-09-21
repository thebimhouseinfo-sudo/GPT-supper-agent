# Designer Harness v0.1

## 1. Purpose

Designer is a first-class visual design agent. Its primary job is NOT to generate dozens of separate production assets.

Designer deeply understands the use case, target audience, UI Tree, node requirements, responsive/device constraints, existing visual language, and relevant design skills; then turns them into a coherent Concept Artwork.

Only after the concept is accepted does Designer decompose the concept into a numbered Asset Sheet with specifications and generation prompts.

> Designer creates the visual concept first. The asset list is derived from the concept, not invented independently.

## 2. Separation from Planner

Planner owns functional and structural truth:
- product intent
- use cases
- target audience requirements
- UI Tree
- user flow
- content hierarchy
- responsive behavior
- interaction/state requirements
- acceptance criteria

Designer owns visual interpretation and, where not already fixed by an inherited design system, proposes the concrete visual tokens:
- visual direction
- composition
- visual hierarchy
- color and typography treatment / token proposal
- artwork language
- icon/illustration language
- background treatment
- UI/artwork blending
- concept artwork
- concept-derived asset decomposition
- generation prompts

Designer must not silently change product behavior.

Before concept generation, Designer applies the shared clarification protocol. If use case, target audience, hierarchy, device context, or visual constraints are missing in a way that would materially change the concept, Designer emits `DESIGN_CLARIFICATION_REQUIRED` instead of guessing.

## 3. Designer skill routing

Designer must load relevant design skills before producing a concept. Typical skills include:
- target-audience design
- visual storytelling
- UI composition
- visual hierarchy
- color design
- typography
- illustration direction
- responsive visual composition
- iconography
- artwork/UI blending
- accessibility-aware visual design
- child-friendly design when relevant
- asset decomposition
- generative-image prompt design
- concept critique

Example for a primary-school Math app:

```text
use-case understanding
+ child audience design
+ education UX
+ playful illustration direction
+ visual hierarchy
+ responsive composition
+ artwork/UI blending
+ asset decomposition
+ image prompt design
```

Designer must not behave like a generic image generator without this context.

## 4. Designer inputs

Designer receives a Design Brief assembled by Planner containing:
- project/product summary
- use cases
- target audience
- UI Tree
- node requirements
- UX flow
- Device Matrix
- responsive rules
- Design Foundation constraints
- current design system
- current screenshots/artwork when available
- user-provided references
- content hierarchy
- UI acceptance criteria

## 5. Designer causal flow

```text
READ USE CASE
  ↓
UNDERSTAND TARGET AUDIENCE
  ↓
READ UI TREE + REQUIREMENTS
  ↓
LOAD RELEVANT DESIGN SKILLS
  ↓
INSPECT CURRENT VISUAL LANGUAGE
  ↓
DEFINE VISUAL DIRECTION
  ↓
CREATE CONCEPT ARTWORK
  ↓
CRITIQUE / REFINE CONCEPT
  ↓
DECOMPOSE CONCEPT INTO ASSETS
  ↓
NUMBER ASSETS
  ↓
WRITE ASSET SPECS + PROMPTS
  ↓
BUILD ASSET SHEET
  ↓
DESIGN REVIEW
```

Concept always precedes asset decomposition.

## 6. Concept Artwork

The main Designer artifact is one coherent Concept Artwork or a very small set of key concepts when one view cannot explain the product.

The concept should communicate:
- overall mood
- target-age appropriateness
- color relationship
- typography feeling
- visual density
- card/component style
- artwork style
- icon style
- background treatment
- artwork/UI blending
- information hierarchy
- composition
- use of empty space
- phone/tablet/desktop visual priorities

For a Math learning app, a representative Home concept plus one Learning/Exercise concept may be enough to establish the visual system.

The concept is a visual source of truth, not necessarily a pixel-perfect implementation mockup.

Designer SHOULD attach concept canvas dimensions, intended layout mode, and nominal target viewport when known. This allows UI Coder to normalize measured geometry correctly rather than treating decorative canvas margins as browser layout.

## 7. Concept-first asset derivation

Designer must NOT begin by guessing a fixed list such as 12 icons, 4 banners, and 3 illustrations.

Instead:

```text
Planner UI requirements
  ↓
Concept Artwork
  ↓
Identify non-code visual elements visible in the concept
  ↓
Group reusable visual families
  ↓
Derive the actual asset list
```

This reveals which visuals are truly required, which are better implemented as UI/CSS, which can be reused, which belong to one style family, and which require transparency or variants.

## 8. Numbered Asset Sheet

Designer creates one actual image file, normally `ASSET-SHEET.png`, containing the visual assets extracted from the approved concept and laid out separately on a single canvas.

This is NOT merely a metadata list or a screenshot of the original UI concept.

The required process is:

```text
Approved Concept Artwork
  ↓
Identify reusable visual elements
  ↓
Extract / redraw each visual element as an isolated asset candidate
  ↓
Remove surrounding UI chrome and unrelated elements
  ↓
Place each asset separately on one large sheet
  ↓
Add crop-safe spacing
  ↓
Number every asset outside its crop bounds
  ↓
Save as ASSET-SHEET.png
```

The sheet should look approximately like:

```text
+---------------------------------------------------------+
| [01] Background scene                                  |
|       <isolated wide background artwork>               |
|                                                         |
| [02] Math icon       [03] Continue artwork              |
|     <asset>                <asset>                      |
|                                                         |
| [04] Addition        [05] Subtraction   [06] Geometry  |
|     <asset>               <asset>            <asset>   |
|                                                         |
| [07] Complete badge   [08] Lesson illustration         |
|     <asset>                <asset>                      |
+---------------------------------------------------------+
```

Rules:

- every visual item is already visually separated from the UI composition;
- assets MUST NOT overlap each other;
- leave generous crop-safe padding around every item;
- numbering/labels sit outside the intended crop area;
- preserve the selected concept's style, palette, lighting, perspective, and shape language;
- do not embed accidental UI text inside assets unless the asset itself intentionally contains text;
- prefer a transparent PNG canvas when transparent extraction is useful;
- opaque scene/background assets may keep their own full rectangular background;
- the sheet should be generated at the highest practical resolution because it is also a usable extraction source.

The user can download `ASSET-SHEET.png`, crop individual numbered regions, use those crops directly as provisional assets, or feed a crop back into image generation to regenerate that single asset at higher quality.

The numbered sidecar specs and prompts explain each region, but the image sheet itself is the primary extraction artifact.

## 9. Crop and regeneration workflow

The expected downstream workflow is:

```text
ASSET-SHEET.png
   ↓ download
crop asset [NN]
   ↓
use crop directly if quality is sufficient
OR
   ↓
use crop as visual reference + asset prompt
   ↓
regenerate one high-quality isolated asset
   ↓
place in repo using stable asset id/path
```

This intentionally avoids requiring the image model to generate dozens of independent final assets in one unattended process.

A crop should preserve enough visual identity that a later regeneration can match the concept more reliably than a text-only prompt.

## 10. Asset record

Each numbered item must define:
- number and stable id
- human-readable name
- concept/source region
- intended screen/component
- purpose
- visual description
- style-family membership
- aspect ratio
- transparent/opaque background rule
- safe area
- embedded-text rule
- recommended format
- target usage
- generation prompt
- negative constraints
- implementation notes

Example:

```yaml
number: 04
id: math-topic-addition
name: Addition Topic Artwork
source_region: home.topic-card-addition
used_by: home.topic-grid
aspect_ratio: 1:1
background: transparent
style_family: topic-icons
prompt:
  master_style: same as approved Math concept
  subject: friendly counting blocks with a simple plus motif
  constraints:
    - no text
    - no border
    - readable at small size
```

## 11. Prompt architecture

Designer should not write dozens of unrelated prompts. Use:

```text
MASTER STYLE PROMPT
      +
ASSET-SPECIFIC PROMPT
      +
OUTPUT CONSTRAINTS
```

Assets belonging to the same family share palette, shape language, light direction, perspective, padding, background rule, and output conventions.

## 12. Asset families

Related assets should be grouped into families, for example:

```text
Family A — Topic artwork
  04 Addition
  05 Subtraction
  06 Geometry

Family B — Feedback artwork
  20 Correct
  21 Try again
  22 Completion
```

Each family has one shared style recipe plus item-specific subject prompts.

## 13. What Designer is NOT required to do

Designer is NOT required to generate every final asset individually.

For a concept requiring dozens of images, the normal output is:

```text
Concept Artwork
+ Numbered Asset Sheet
+ Asset Specifications
+ Master Style Prompt
+ Per-asset Prompts
```

Actual asset generation may happen later manually, one-by-one with image generation, through another workflow, or with a future dedicated asset-production agent.

The harness must not assume that large unattended batches of generated images will remain sufficiently consistent.

## 14. Optional image generation

If image-generation capability exists, Designer should prioritize it for:
- concept artwork
- focused visual exploration
- selected key-screen visualization
- occasional asset proof-of-concept

It should not be forced to generate the complete asset library merely because image generation is available.

## 15. Designer workspace

Designer writes no source code. Recommended Job workspace:

```text
design/
  brief/
  concepts/
    selected/
  asset-sheet/
    ASSET-SHEET.png      # primary visual extraction sheet
    ASSET-SPECS.json     # numbered sidecar metadata
    PROMPTS.md           # master style + per-asset prompts
    ASSET-SHEET.md       # optional human-readable index
  reviews/
```

No production asset directory is required at this phase.

## 16. Design Review Gate

Reviewer checks:
- concept reflects the use case
- concept fits the target audience
- UI Tree is represented faithfully
- hierarchy matches Planner requirements
- responsive intent remains compatible
- visual direction is coherent
- concept does not invent product behavior
- visual elements are completely decomposed into isolated crop-ready regions on ASSET-SHEET.png
- assets do not overlap and have adequate crop-safe spacing
- number labels sit outside intended crop bounds
- asset numbering is unambiguous
- every numbered asset has a usable spec
- prompt families preserve consistency
- Coder is not being asked to invent visual decisions

Possible results:

```text
DESIGN_CONCEPT_APPROVED
DESIGN_CHANGES_REQUIRED
ASSET_SHEET_INCOMPLETE
DESIGN_PLANNING_GAP
```

## 17. UI delivery pipeline

```text
User idea
  ↓
Planner
  ├─ Use cases
  ├─ Target audience
  ├─ UI Tree
  ├─ Node requirements
  ├─ Responsive spec
  └─ Design Brief
  ↓
Designer
  ├─ Design skill routing
  ├─ Concept Artwork
  ├─ Visual direction
  ├─ Asset decomposition
  ├─ Numbered Asset Sheet
  └─ Per-asset prompts
  ↓
Reviewer
  DESIGN CONCEPT REVIEW
  ↓
Coder
  Detailed Execution Plan
  ↓
Reviewer
  EXECUTION PLAN AUDIT
  ↓
Coder
  UI implementation
```

## 18. Boundary with Coder

Coder receives the UI specs, approved concept, numbered Asset Sheet, stable asset ids, target usage, and asset prompts/specifications.

Coder does not reinterpret the concept. If a visual element is missing or impossible to implement without a design change, Coder emits a Design Gap.

## 19. Core invariant

> Planner explains the product. Designer visualizes the product. The Concept Artwork becomes the visual source of truth, and the Asset Sheet explains how to reconstruct its reusable visual parts.