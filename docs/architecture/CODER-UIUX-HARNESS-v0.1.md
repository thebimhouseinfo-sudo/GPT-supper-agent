# Coder UI/UX Execution Harness v0.1

## 1. Purpose

For material user-facing work, Coder is split into two specialized execution roles:

```text
UX Coder
+ UI Coder
```

They share the same source-repository write boundary but have different responsibilities, skills, evidence, and acceptance criteria.

> UX Coder makes the product behave correctly. UI Coder makes the approved visual concept appear correctly.

## 2. Shared boundary

Both roles may write only to the approved source repository/workspace. Neither may edit Planner specs, Designer concept artifacts, Project Memory decisions, or Reviewer findings.

Both inherit the approved implementation plan, execution plan, architecture/contracts, UI Tree, node requirements, responsive specification, and acceptance criteria.

UI Coder additionally receives the approved Concept Artwork, Design Foundation, design tokens, Asset Sheet, asset specs/prompts, and visual references.

## 3. UX Coder

UX Coder implements the functional experience:
- route/navigation behavior
- user flow
- state transitions
- loading/empty/error/success states
- validation
- keyboard/touch behavior
- accessibility behavior
- responsive behavior semantics
- automatic/manual progression
- focus behavior
- data/state wiring
- recovery behavior

UX acceptance is about behavior, not visual similarity.

UX Coder verifies that flows, state transitions, disabled/selected/loading/error states, touch/keyboard paths, responsive behavior, automatic progression, and recovery behavior match the Planner spec.

## 4. UI Coder

UI Coder implements the visual layer from approved design artifacts.

UI Coder must be capable of reading Concept Artwork as a design reference, not treating it as decorative inspiration.

Required interpretation includes:
- composition
- hierarchy
- relative scale
- spacing rhythm
- density
- alignment
- card geometry
- typography hierarchy
- color relationships
- background/artwork blending
- icon and artwork placement
- visual weight
- whitespace use
- state appearance
- responsive visual priorities

## 5. Visual fidelity classes

UI Coder classifies design requirements as:

```text
MUST MATCH
INTENT MATCH
IMPLEMENTATION FLEXIBLE
```

### MUST MATCH

Contractual visual requirements:
- information hierarchy
- component ordering
- approved design tokens
- typography roles
- key spacing relationships
- artwork identity
- asset usage
- state semantics
- responsive priority
- major composition

Material deviation requires a Design Gap.

### INTENT MATCH

Preserve the approved visual feeling even if exact pixels differ:
- balance
- density
- overall scale relationships
- artwork/UI blending
- visual emphasis
- whitespace
- age/tone appropriateness

### IMPLEMENTATION FLEXIBLE

UI Coder may choose non-material details such as CSS technique, grid vs flex, small interpolation between breakpoints, technical image loading method, or small spacing adjustments for real content.

## 6. UI Coder workflow

```text
READ CONCEPT ARTWORK
  ↓
READ UI TREE + NODE SPECS
  ↓
READ DESIGN TOKENS
  ↓
READ ASSET SHEET
  ↓
IDENTIFY MUST-MATCH VISUALS
  ↓
IMPLEMENT
  ↓
RENDER
  ↓
COMPARE AGAINST CONCEPT
  ↓
ADJUST
  ↓
RESPONSIVE CHECK
  ↓
VISUAL QA
```

UI Coder must not stop because the code compiles.

## 7. Concept-reading skill

UI Coder requires a dedicated concept-reading skill that converts visual evidence into implementation constraints.

Examples:

```text
Concept: artwork occupies about 40% of card
→ artwork remains visually dominant

Concept: card blends into scene
→ avoid isolated hard-edged image block

Concept: narrow centered desktop content
→ use max-width composition instead of stretching mobile layout

Concept: icon nearly fills card height
→ do not reduce it to generic glyph size
```

The goal is faithful visual relationships, not blind pixel copying.

## 8. Render-and-compare loop

When runtime/browser capability exists, UI Coder MUST use rendered evidence:

```text
implementation
→ render target viewport
→ capture screenshot
→ compare with concept/spec
→ identify mismatch
→ adjust
```

Viewport classes come from Device Matrix, normally phone, tablet, desktop, and wide desktop when material.

If screenshot/runtime capability is unavailable, visual verification must be marked incomplete rather than assumed to pass.

## 9. Visual QA

UI Coder checks:
- hierarchy matches concept
- major proportions are credible
- artwork is not stretched
- artwork is not visually detached from its surface
- colors follow tokens/concept
- typography roles are correct
- font sizes are not arbitrary
- spacing rhythm is coherent
- desktop cards do not become unnaturally large
- responsive reflow matches spec
- optional artwork hides/shows according to priority
- states remain visually distinguishable
- stable asset ids/paths are used
- no accidental placeholder remains

## 10. UX/UI execution ordering

Typical screen implementation:

```text
UX Coder
→ structure, state, flow, behavior

UI Coder
→ visual system, concept fidelity, artwork integration

Joint UX/UI QA
→ verify styling did not break behavior
```

For large apps, execute by meaningful screen/review unit rather than finishing all UX before any UI:

```text
Home: UX pass → UI pass → joint QA
Lesson: UX pass → UI pass → joint QA
Exercise: UX pass → UI pass → joint QA
```

## 11. Execution Plan ownership

Coder's detailed execution plan labels tasks:

```yaml
- id: UX-01
  owner: ux-coder
  goal: implement lesson progression

- id: UI-01
  owner: ui-coder
  goal: implement lesson canvas from approved concept

- id: UXUI-QA-01
  owner: joint
  goal: verify behavior and visual acceptance together
```

Reviewer audits the split and ordering before implementation.

## 12. UI acceptance evidence

Where capability permits, UI Coder handoff includes rendered screenshots, viewport labels, visual checklist result, known deviations, asset substitution status, and responsive evidence.

Statuses:

```text
VISUAL_ACCEPTANCE_PASS
VISUAL_ACCEPTANCE_PARTIAL
VISUAL_BLOCKED_BY_MISSING_ASSET
VISUAL_BLOCKED_BY_RUNTIME
DESIGN_GAP
```

## 13. Missing final assets

UI Coder may use cropped/provisional assets only when the plan explicitly permits it. Final visual acceptance cannot pass if a missing final asset materially affects the result.

## 14. UX/UI conflict handling

If UI implementation would break approved UX behavior, UI Coder may not silently change behavior. If UX implementation makes the approved concept materially impossible, UX Coder may not silently simplify the design.

Such conflicts emit:

```text
UX_UI_CONFLICT
```

and return to Coder orchestration / Planner / Designer depending on whether the conflict is functional or visual.

## 15. Reviewer split

Reviewer evaluates UX and UI separately.

UX review covers functional flow, state, interaction, accessibility behavior, and responsive semantics.

UI review covers visual fidelity, concept interpretation, token compliance, asset integration, responsive visual composition, and screenshot/render evidence.

Combined approval requires both applicable tracks to pass.

## 16. Core invariant

> A user-facing feature is not complete merely because it works. It must behave according to the UX specification and visually satisfy the approved concept at the required level of fidelity.