# Designer Harness v0.1

## 1. Purpose

Designer is a first-class agent responsible for converting approved product/UI requirements into concrete visual direction, concept artwork, reusable visual assets, and an implementation-ready asset package.

Designer is not a substitute for Planner.

Planner defines:
- product intent
- UI Tree
- per-node requirements
- UX flow
- responsive intent
- content hierarchy
- design constraints
- acceptance criteria

Designer turns those constraints into:
- visual concepts
- key-screen concept art
- component visual language
- artwork system
- icon/illustration direction
- asset inventory
- approved production-ready assets

Core principle:

> Planner defines what the interface must accomplish and how it must behave. Designer defines how that approved intent should look and prepares the visual materials required to build it.

## 2. Write boundary

Designer MUST NOT modify source repositories.

Designer may write only to the Job's design workspace in Google Drive / Project Memory.

```text
Designer
  Project Memory / Design Workspace: write
  Repo: read-only
```

Coder is the agent that moves approved production assets into the source repository at the paths specified by the approved asset manifest.

## 3. Designer inputs

Designer receives a Design Brief assembled by Planner.

Minimum inputs for major UI work:

- product goal
- target users
- UI Tree
- node requirements
- UX flow
- Design Foundation constraints
- Device Matrix
- responsive behavior
- existing product design system
- existing approved assets
- user-provided visual references
- content hierarchy
- asset requirements
- UI acceptance criteria

Designer should inspect existing product visuals before creating a new direction.

## 4. Designer flow

```text
RECEIVE DESIGN BRIEF
  ↓
INSPECT EXISTING VISUAL LANGUAGE
  ↓
RESOLVE VISUAL GAPS
  ↓
CREATE VISUAL DIRECTIONS
  ↓
SELECT / REFINE CONCEPT
  ↓
CREATE KEY SCREEN CONCEPTS
  ↓
DEFINE ART / ICON / COMPONENT LANGUAGE
  ↓
BUILD ASSET INVENTORY
  ↓
GENERATE / PREPARE ASSETS
  ↓
BUILD ASSET SHEET
  ↓
SELF DESIGN QA
  ↓
DESIGN REVIEW GATE
  ↓
APPROVED DESIGN PACKAGE
```

## 5. Visual Concept Package

For major UI work, Designer produces a Visual Concept Package.

Recommended structure:

```text
design/
  brief/
    DESIGN-BRIEF.md

  concepts/
    CONCEPT-DIRECTIONS.md
    concept-a/
    concept-b/
    selected/

  screens/
    HOME/
    TOPIC/
    LESSON/
    EXERCISE/
    RESULT/

  system/
    VISUAL-DIRECTION.md
    ART-DIRECTION.md
    ICON-DIRECTION.md
    COMPONENT-VISUALS.md

  assets/
    ASSET-MANIFEST.json
    ASSET-SHEET.md
    ASSET-SHEET.png
    source/
    approved/

  reviews/
    DESIGN-REVIEW.md
```

Binary visual files may exist in the design workspace. Source code remains in GitHub/local source repositories.

## 6. Concept directions

Designer may explore multiple visual directions when the visual language is not already fixed.

Each direction should identify:

- mood
- visual hierarchy
- composition
- color treatment
- typography treatment
- illustration/artwork style
- icon style
- card/component treatment
- background treatment
- relationship to existing product design
- strengths
- risks

Exploration should be limited to meaningful alternatives, not arbitrary style variation.

Once a direction is approved, later assets must inherit it.

## 7. Key screen concept art

Designer creates concept art for screens with high visual or structural importance.

For a Math learning app, likely key concepts include:

- Home
- Topic
- Lesson / Learning Canvas
- Exercise
- Result

Not every minor state requires a full illustration. Shared design rules and component specs can cover repetitive states.

Concept art must respect the UI Tree and node requirements. It must not silently change product flow.

## 8. Artwork system

Designer should determine whether the product needs:

- background scene
- subject icons
- topic artwork
- lesson illustrations
- decorative characters
- badges
- progress illustrations
- empty-state artwork
- success/reward artwork
- diagrams
- educational figures

Artwork should form a coherent family.

For each artwork category Designer defines:

- style
- perspective
- shape language
- palette relationship
- edge/blending behavior
- background/transparent requirements
- text/no-text rule
- aspect ratio
- safe area
- intended UI placement

## 9. Asset Inventory

Designer converts UI requirements into an explicit asset inventory before generating assets.

Example:

```text
Math App Assets

Global
- app background
- math subject icon

Home
- continue-learning artwork
- topic icons x N

Lesson
- lesson illustration categories
- geometry diagram family

Exercise
- correct feedback artwork
- incorrect feedback artwork

Result
- completion celebration
- achievement badge
```

This prevents the project from discovering missing visual assets halfway through coding.

## 10. Asset Manifest

Every production candidate asset MUST have stable metadata.

Example:

```json
{
  "id": "math-topic-addition-icon",
  "type": "image",
  "role": "topic-icon",
  "status": "approved",
  "format": "webp",
  "aspect_ratio": "1:1",
  "background": "transparent",
  "source_file": "design/assets/approved/math-topic-addition-icon.webp",
  "target_repo_path": "assets/images/topics/math-topic-addition-icon.webp",
  "used_by": [
    "home.topic-grid",
    "topic.header"
  ],
  "rules": [
    "no embedded UI text",
    "do not stretch",
    "preserve transparent padding"
  ]
}
```

Coder MUST use the approved target path/id instead of inventing a new asset identity.

## 11. Asset Sheet

Designer MUST build an Asset Sheet for non-trivial asset sets.

The Asset Sheet is both:

1. a visual contact sheet for human/reviewer inspection
2. a structured inventory linked to `ASSET-MANIFEST.json`

It should show:

- asset id
- preview
- role
- intended screen/component
- status
- variants
- dimensions/aspect ratio
- background rule

This makes missing, inconsistent, duplicated, or stylistically divergent assets obvious before coding.

## 12. Asset generation prompts

When generative image tools are used, Designer should preserve a reusable prompt recipe for each asset family.

Prompt recipes should capture:

- shared style
- subject
- composition
- palette relationship
- background/alpha requirement
- prohibited embedded text
- aspect ratio
- variation rules

The prompt recipe is design metadata, not source code.

## 13. Production-ready asset criteria

An asset is not approved merely because the image looks attractive.

Designer self-QA checks applicable items:

- correct visual style
- matches selected concept
- correct role
- correct aspect ratio
- correct transparency/background
- no unwanted text
- no accidental crop
- adequate safe area
- blends with surrounding UI
- reusable at target sizes
- no duplicated identity
- naming/path matches manifest
- variants are complete
- accessibility implications considered

## 14. Designer capability routing

Designer may require specialized executors/tools such as:

- image generation
- image editing
- Figma/design workspace
- screenshot inspection
- existing asset libraries

The same capability rule applies:

> Designer may only promise artifacts that an available design executor can actually produce.

If image generation is unavailable, the package may define the asset specification and generation prompt, but status must remain `PENDING_ASSET_GENERATION`, not `APPROVED`.

## 15. Design Review Gate

After Designer finishes the package, Reviewer runs an independent Design Review before Coder begins UI implementation.

Reviewer checks:

- concept matches Planner requirements
- UI Tree has adequate visual coverage
- visual direction is coherent
- shared design tokens are respected
- responsive intent has not been contradicted
- artwork hierarchy is appropriate
- asset set is complete
- asset manifest is consistent
- filenames/ids/target paths are stable
- production assets are technically usable
- no unresolved visual decision is being pushed onto Coder

Possible results:

```text
DESIGN_APPROVED
DESIGN_CHANGES_REQUIRED
DESIGN_BLOCKED_BY_MISSING_ASSETS
DESIGN_BLOCKED_BY_CAPABILITY
```

## 16. Updated UI delivery pipeline

For material UI work:

```text
User Intent
  ↓
Planner
  ├─ Product Spec
  ├─ UI Tree
  ├─ Node Requirements
  ├─ UX / Responsive Spec
  └─ Design Brief
  ↓
Designer
  ├─ Visual Concept
  ├─ Key Screen Concepts
  ├─ Art Direction
  ├─ Asset Inventory
  ├─ Production Assets
  └─ Asset Sheet
  ↓
Reviewer
  DESIGN REVIEW GATE
  ↓
Coder
  Detailed Execution Plan
  ↓
Reviewer
  EXECUTION PLAN AUDIT
  ↓
Coder
  Implementation + QA/QC
  ↓
Reviewer
  UI / Code / Integration Review
```

## 17. Boundary between Planner and Designer

Planner owns functional truth.

Designer owns visual realization.

Examples:

```text
"Exercise advances automatically"
→ Planner

"Correct feedback uses a celebratory green motion treatment"
→ Designer within design constraints

"Phone hides secondary artwork"
→ Planner / Responsive Spec

"Which secondary artwork is used and how it blends into the card"
→ Designer

"TopicCard has completed/locked/in-progress states"
→ Planner

"Exact visual treatment of those states"
→ Designer
```

If Designer discovers that the planned UI cannot be visually resolved without changing product behavior, Designer emits:

```text
DESIGN_PLANNING_GAP
```

and returns the issue to Planner rather than silently changing the flow.

## 18. Boundary between Designer and Coder

Designer does not choose implementation architecture.

Coder does not redesign approved visual intent.

Coder may decide:

- component implementation details
- CSS organization
- image loading technique
- exact breakpoint values when not fixed by shared design system

Coder may not silently change:

- approved artwork
- visual hierarchy
- visual language
- asset identity
- major composition
- state appearance semantics

Any required design deviation becomes a Design Gap and returns to Designer/Planner as appropriate.

## 19. Core invariant

> Planner makes the product designable. Designer makes the design buildable. Coder makes the approved design real.
