# Planner Scope, Skill Routing & UI/UX Design Package v0.1

## 1. Purpose

Planner is not merely an implementation-plan writer.

Planner owns project preparation. It must determine the scope of work, identify the knowledge and specialist skills required, prepare the development roadmap, and produce enough product/design/technical material for Coder to implement without inventing major product or UI/UX decisions during coding.

For interface work, a technically correct implementation plan is insufficient.

Invariant:

> UI implementation MUST NOT begin while material product, UX, visual, responsive, interaction, or asset decisions remain unknowable to Coder.

## 2. Planner responsibility layers

Planner preparation is divided into five layers:

```text
Intent
  ↓
Product / user experience
  ↓
Architecture / system impact
  ↓
Delivery roadmap
  ↓
Implementation-ready materials
```

Planner must reason across all applicable layers before publishing implementation plans.

### 2.1 Product scope

Planner resolves:

- target users
- user goal
- business/product goal
- in-scope behaviors
- explicitly out-of-scope behaviors
- success conditions
- user-visible changes
- compatibility expectations

### 2.2 UX scope

Planner resolves, when applicable:

- user journeys
- information architecture
- navigation
- screen hierarchy
- task flow
- empty/loading/error/success states
- progressive disclosure
- validation behavior
- recovery behavior
- keyboard/touch behavior
- responsive behavior
- accessibility requirements

### 2.3 UI scope

Planner resolves, when applicable:

- visual direction
- page composition
- layout hierarchy
- component selection
- visual priority
- spacing/density rules
- typography rules
- color/design-token usage
- icon and artwork strategy
- component variants
- interaction feedback
- animation/motion constraints
- platform-specific presentation

### 2.4 Technical scope

Planner resolves:

- affected repos
- affected modules
- architecture constraints
- shared contracts
- data requirements
- API/state implications
- target platforms
- executor requirements
- verification capabilities

### 2.5 Delivery scope

Planner resolves:

- master roadmap
- phases
- milestones
- implementation ordering
- repo plans
- PR/change-set strategy
- review gates
- rollout/migration order
- verification strategy

## 3. Skill routing

Planner MUST select specialist skills before producing the corresponding material.

Skills are not optional decoration. The Planner Harness determines which skills are required from task/project characteristics.

Example routing:

```text
New user-facing feature
  -> product-requirements
  -> ux-flow
  -> ui-design
  -> responsive-design
  -> accessibility
  -> architecture
  -> implementation-planning

Existing UI bug
  -> ui-diagnosis
  -> responsive-design if breakpoint-related
  -> accessibility if interaction-related
  -> implementation-planning

Multi-repo auth migration
  -> architecture
  -> contract-analysis
  -> multi-repo-impact
  -> migration-planning

Revit workflow tool
  -> revit-domain
  -> desktop-ux if UI is present
  -> architecture
  -> testing-strategy
  -> implementation-planning
```

Planner must record which skills were used and what artifacts each skill produced.

## 4. Skill categories

Initial Planner skill taxonomy:

### 4.1 Discovery and product

- intent-resolution
- requirements-analysis
- product-scope
- user-journey
- information-architecture

### 4.2 Design

- ux-flow-design
- ui-visual-design
- responsive-design
- design-system
- accessibility
- interaction-design
- content-design
- asset-planning

### 4.3 Engineering

- architecture
- api-contracts
- data-modeling
- migration-planning
- testing-strategy
- observability
- security-review
- performance-planning

### 4.4 Project topology

- multi-repo-analysis
- dependency-analysis
- impact-analysis
- release-planning
- capability-resolution

### 4.5 Domain and platform

Examples:

- react
- nextjs
- vite
- supabase
- vercel
- revit
- autocad
- autolisp
- pine-script

The list is extensible. Planner identifies missing knowledge/skills before plan compilation.

## 5. Roadmap obligation

Planner MUST distinguish roadmap from implementation plan.

The roadmap explains major project progression and dependency order.

Example:

```text
Milestone 1 — establish shared profile contract
Milestone 2 — update Hub provider
Milestone 3 — migrate subject apps
Milestone 4 — integration verification
Milestone 5 — remove legacy compatibility path
```

A roadmap should identify:

- milestone objective
- dependencies
- affected repositories
- required design/knowledge material
- readiness criteria
- review checkpoint
- exit criteria

For multi-repo projects, roadmap is project-level and repo implementation plans are derived from it.

## 6. UI/UX Design Package

Any task that creates or materially changes user interface MUST receive a UI/UX Design Package before implementation.

Suggested Project Memory structure:

```text
design/
  PRODUCT-SPEC.md
  UX-FLOW.md
  SCREEN-SPEC.md
  RESPONSIVE-SPEC.md
  INTERACTION-SPEC.md
  DESIGN-SYSTEM.md
  CONTENT-SPEC.md
  ASSET-MANIFEST.json
  UI-ACCEPTANCE.md
```

These may be combined for small tasks, but the information obligations remain.

## 7. Product Spec

`PRODUCT-SPEC.md` should answer:

- who is using this
- what they are trying to accomplish
- why the change exists
- primary use cases
- secondary use cases
- scope
- non-goals
- key constraints
- success conditions

Coder should not infer product intent from component names.

## 8. UX Flow

`UX-FLOW.md` specifies user flow and navigation.

For each flow:

```text
entry state
-> user action
-> system response
-> next state
-> completion / recovery
```

It must cover applicable branches:

- first use
- returning use
- empty state
- loading
- validation failure
- network/system error
- permission denial
- success
- cancellation/back navigation

For child-facing software, flows should additionally consider accidental input, reading ability, touch target size, and low-friction recovery where relevant.

## 9. Screen Spec

`SCREEN-SPEC.md` is an implementation oracle, not a mood board.

Each screen or major surface specifies:

- purpose
- entry conditions
- layout regions
- visual hierarchy
- components
- content
- component states
- data dependencies
- primary action
- secondary actions
- navigation behavior
- empty/loading/error behavior
- accessibility semantics
- associated assets

Example:

```text
Screen: Lesson Topic

Purpose:
Allow learner to choose a lesson topic.

Hierarchy:
1. Shared header
2. Topic title / progress
3. Topic cards
4. Secondary information

Topic card:
- artwork occupies dominant visual area
- title is secondary
- entire card is clickable
- completed state has explicit visual indication
- card dimensions may respond; artwork must not be stretched
```

## 10. Responsive Spec

Responsive behavior MUST be specified as behavior, not only breakpoint numbers.

`RESPONSIVE-SPEC.md` defines:

- supported device classes
- content priority
- what may resize
- what may reflow
- what may hide
- what must remain visible
- minimum touch targets
- maximum content width where applicable
- card/grid behavior
- artwork crop/contain behavior
- modal/dialog behavior
- header behavior

Example:

```text
Phone:
- preserve primary learning action
- hide optional promotional artwork
- one-column cards
- do not stretch artwork

Tablet:
- allow 2-column content
- preserve secondary cards when space permits

Desktop:
- use width for additional useful content
- do not merely stretch mobile cards to fill viewport
```

A breakpoint is an implementation detail. The specification focuses on intended behavior across ranges.

## 11. Interaction Spec

`INTERACTION-SPEC.md` defines behavior for:

- click/tap
- hover where applicable
- focus
- keyboard
- disabled state
- selected state
- progress
- loading
- transition
- automatic advance
- confirmation
- destructive actions
- retry/recovery

The spec must resolve whether progression is manual or automatic rather than leaving Coder to choose.

## 12. Design System

Planner should reuse existing project design systems before inventing new visual language.

`DESIGN-SYSTEM.md` references or defines:

- typography
- spacing scale
- radii
- elevation
- color tokens
- component conventions
- icon conventions
- artwork integration
- backgrounds
- layout container rules
- animation principles

When a parent project already owns shared UI architecture, child repos inherit it.

Do not duplicate design-system files into every repo merely to give Coder context.

## 13. Asset Planning

Planner must decide whether UI requires:

- icons
- illustrations
- backgrounds
- characters
- screenshots
- diagrams
- audio/video assets

`ASSET-MANIFEST.json` should provide stable asset identities before code is written when possible.

Example:

```json
{
  "assets": [
    {
      "id": "math-grade-1-icon",
      "type": "image",
      "path": "assets/images/math-grade-1.webp",
      "usage": "subject card icon",
      "status": "required"
    }
  ]
}
```

Coder should consume planned asset identities rather than inventing filenames or placeholders that later break integration.

## 14. UI acceptance criteria

`UI-ACCEPTANCE.md` defines observable outcomes.

Acceptance should cover applicable areas:

- user flow correctness
- layout hierarchy
- responsive behavior
- states
- assets
- keyboard/touch interaction
- accessibility
- visual regression
- content correctness
- loading/error handling

Avoid criteria such as:

> Make it look good.

Prefer:

> On phone widths the optional scene artwork is hidden, the primary action remains above the fold, cards become one column, and subject artwork retains its native aspect ratio without stretch.

## 15. Design evidence and references

Planner may use:

- existing screens in the same product
- parent project design system
- supplied screenshots
- Figma/design files
- approved artwork
- competitor/reference research when requested
- generated design assets when appropriate

References must be captured in Project Memory sufficiently for Coder and Reviewer to understand the intended result.

## 16. UI/UX readiness gate

For material interface changes, `PROJECT_READY_FOR_IMPLEMENTATION` additionally requires:

```text
Product intent resolved
UX flow resolved
Screen hierarchy resolved
Responsive behavior resolved
Interaction states resolved
Design-system relationship resolved
Asset requirements resolved
UI acceptance criteria resolved
Verification path resolved
```

If a material UI decision remains unknown, implementation is not ready.

## 17. Coder boundary for UI work

Coder may choose implementation details such as component decomposition, CSS organization, or exact DOM structure when architecture permits.

Coder may NOT silently choose:

- different navigation flow
- different primary action
- different responsive priority
- materially different artwork strategy
- new visual language
- changed content hierarchy
- unplanned interaction behavior

Those are Planner/design decisions and require PLANNING_GAP escalation if unresolved.

## 18. Reviewer UI audit

Execution Plan Audit checks that Coder's proposed work maps to the design package.

Implementation Review checks:

- screen spec compliance
- responsive spec compliance
- design-system compliance
- asset correctness
- interaction/state behavior
- accessibility requirements
- visual regressions
- acceptance criteria evidence

When runtime/browser capability exists, UI review should include rendered evidence rather than code inspection alone.

## 19. Small-task scaling

The harness should scale the artifact count, not the reasoning obligations.

A small button-alignment fix may use a single compact design note.

A new learning application may require the full package.

The Planner Harness decides document granularity based on complexity, but cannot omit material decisions merely because a task is called "small."

## 20. Core invariant

> Planner owns design readiness. Coder implements approved design intent; Coder does not become the product/UX designer by accident.
