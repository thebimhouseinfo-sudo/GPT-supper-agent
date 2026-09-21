# UI Specification Model v0.1

## 1. Purpose

For any app with a material user interface, Planner MUST produce a structured UI specification before Coder begins implementation.

The specification is not a loose collection of visual notes. It is a tree of user-facing surfaces with explicit requirements for every branch, governed by one shared visual system and one shared responsive/device model.

Invariant:

> Every material UI node must have requirements, states, responsive behavior, and acceptance criteria before implementation begins.

## 2. UI Tree is mandatory

Planner MUST first produce an application-level UI Tree.

Example for a primary-school Math learning app:

```text
Math App
│
├── App Shell
│   ├── Header
│   │   ├── Logo / Subject identity
│   │   ├── Back / navigation action
│   │   ├── Progress summary
│   │   └── Child profile
│   └── Global background / scene
│
├── Home
│   ├── Welcome / current grade
│   ├── Continue learning
│   ├── Topic grid
│   │   ├── Topic card
│   │   ├── Locked state
│   │   ├── In-progress state
│   │   └── Completed state
│   └── Optional secondary cards
│
├── Topic
│   ├── Topic header
│   ├── Lesson list
│   │   ├── Lesson card
│   │   ├── Progress
│   │   └── Completion state
│   └── Topic summary
│
├── Lesson
│   ├── Start state
│   ├── Learning Canvas
│   │   ├── Explanation
│   │   ├── Example
│   │   ├── Illustration / diagram
│   │   └── Lesson-specific interaction
│   ├── Previous / Next controls
│   └── End-of-theory state
│
├── Exercise
│   ├── Question
│   ├── Answer interaction
│   ├── Correct feedback
│   ├── Incorrect feedback
│   ├── Automatic progression
│   └── Progress indicator
│
├── Result
│   ├── Score / performance
│   ├── Mistake review
│   ├── Learning summary
│   └── Continue action
│
└── Shared States
    ├── Loading
    ├── Empty
    ├── Offline / network error
    ├── Permission / profile missing
    └── Fatal error / recovery
```

The exact tree differs by project. Planner derives it from product requirements and actual project architecture.

## 3. Every UI Tree node gets a Node Spec

Every material node in the UI Tree MUST have a corresponding requirement block.

Recommended schema:

```yaml
id: lesson.learning-canvas
type: screen-region
parent: lesson
purpose: Present theory and interactive learning content

users:
  - primary learner

entry_conditions:
  - lesson selected

content:
  required:
    - lesson title
    - learning content
  optional:
    - illustration
    - audio

layout:
  hierarchy:
    - content
    - illustration
    - controls

interaction:
  primary_action: next
  secondary_action: previous

states:
  - default
  - loading
  - content-error
  - final-step

responsive:
  phone: ...
  tablet: ...
  desktop: ...

assets:
  - lesson illustration where required

accessibility:
  - keyboard focus order
  - semantic heading structure

acceptance:
  - ...
```

Coder MUST be able to trace every implemented major screen/component back to a Node Spec or shared component spec.

## 4. Node requirement dimensions

For each node, Planner resolves applicable requirements in the following dimensions:

### 4.1 Purpose

- why the node exists
- user goal
- system goal

### 4.2 Content

- required text/content
- optional content
- content priority
- dynamic data
- fallback content

### 4.3 Layout

- hierarchy
- alignment
- grouping
- maximum/minimum width
- density
- scrolling behavior

### 4.4 Interaction

- primary action
- secondary action
- automatic behavior
- hover/focus/tap behavior
- disabled behavior
- error recovery

### 4.5 States

- default
- loading
- empty
- active
- selected
- disabled
- success
- warning
- error
- complete

### 4.6 Visual treatment

- component style
- typography role
- color role
- icon/artwork use
- emphasis
- background relationship

### 4.7 Responsive behavior

- phone
- tablet
- desktop
- wide desktop when material

### 4.8 Accessibility

- semantic role
- focus behavior
- target size
- contrast
- reduced motion where relevant

### 4.9 Acceptance

- observable success criteria
- screenshot/render expectations where useful
- interaction verification
- responsive verification

## 5. Design Foundation must be defined before screen specs

Planner MUST define functional Design Foundation constraints and inherited project tokens. If visual tokens are already approved, Designer inherits them. If they are not fixed, Designer proposes the concrete color/type/art treatment during concept design without changing functional requirements.

The foundation contains:

```text
DESIGN FOUNDATION
├── Visual direction
├── Color system
├── Typography system
├── Spacing system
├── Radius / shape system
├── Elevation system
├── Icon / artwork language
├── Motion rules
├── Layout container rules
└── Device / responsive model
```

Screens consume this foundation; they do not invent their own unrelated style.

## 6. Color specification

Planner MUST specify colors by semantic role, not by scattered hard-coded values.

Example:

```yaml
color:
  background:
    app: <token>
    surface: <token>
    elevated: <token>

  text:
    primary: <token>
    secondary: <token>
    muted: <token>
    inverse: <token>

  action:
    primary: <token>
    primary-hover: <token>
    primary-disabled: <token>

  feedback:
    success: <token>
    warning: <token>
    error: <token>

  learning:
    current: <token>
    completed: <token>
    locked: <token>
```

For an existing product, Planner SHOULD derive these tokens from the current shared design system rather than inventing a new palette.

If artwork is used, Planner must specify how surrounding surfaces visually blend with the artwork rather than allowing isolated image blocks to appear unrelated to the UI.

## 7. Typography specification

Planner MUST specify:

- font family
- fallback stack
- supported font weights
- type scale
- line heights
- letter spacing where relevant
- allowed responsive scaling

Example:

```yaml
font:
  family: <project-font>
  fallback: <fallback-stack>

type:
  display:
    size: ...
    weight: ...
    line_height: ...

  page_title:
    size: ...
    weight: ...

  section_title:
    size: ...
    weight: ...

  body:
    size: ...
    weight: ...

  label:
    size: ...
    weight: ...

  caption:
    size: ...
    weight: ...
```

For child-facing apps, typography requirements should explicitly consider reading ability, visual clarity, short line lengths, and minimum usable text size.

Coder MUST NOT choose arbitrary font sizes screen by screen.

## 8. Spacing and sizing specification

Planner defines a shared spacing scale and component sizing rules.

Example:

```yaml
spacing:
  xs: ...
  sm: ...
  md: ...
  lg: ...
  xl: ...

controls:
  min_touch_target: ...
  button_height:
    compact: ...
    default: ...
    large: ...

container:
  max_content_width: ...
  page_gutter:
    phone: ...
    tablet: ...
    desktop: ...
```

Exact values may come from the existing project design system or be introduced by the design skill.

## 9. Device Matrix is mandatory

Planner MUST define which device classes the app is designed for.

Example:

```text
DEVICE MATRIX

Phone portrait
- primary target: yes
- touch: yes
- expected use: learner

Phone landscape
- supported: yes
- special layout: only where necessary

Tablet portrait
- primary target: yes

Tablet landscape
- primary target: yes

Laptop / small desktop
- supported: yes

Large desktop
- supported: yes
- must use extra space intentionally rather than stretching mobile layouts
```

Device support is a product decision, not an implementation guess.

## 10. Responsive behavior is specified per UI Tree branch

A global Responsive Spec is necessary but insufficient.

Every major UI node MUST declare how it changes across device classes.

Example:

```text
Topic Grid

Phone
- 1 column
- artwork remains large enough to identify topic
- title remains readable
- optional secondary card hidden if vertical space is constrained

Tablet
- 2 columns
- card artwork preserved
- larger gutters

Desktop
- 3 or 4 columns based on available content width
- content centered inside max-width container
- do not stretch cards unnaturally

Large desktop
- may introduce an additional informational/artwork region
- do not scale primary cards indefinitely
```

Responsive rules should define behavior first. Breakpoints are then chosen by Coder to satisfy that behavior unless the project design system already defines exact breakpoints.

## 11. Layout mode vs breakpoint

Planner specifies semantic layout modes:

```text
COMPACT
REGULAR
WIDE
```

Each layout mode defines intended UI behavior.

Implementation may map these modes to breakpoints.

This avoids specs that only say:

```css
@media (max-width: 768px)
```

without defining what should actually change.

## 12. Shared component specifications

Repeated UI elements get one shared component spec.

Example:

```text
COMPONENT: TopicCard

Purpose:
Represent one learning topic.

Variants:
- available
- in-progress
- completed
- locked

Required content:
- artwork
- topic name

Optional content:
- progress

Interaction:
- entire card is interactive when available
- locked variant is non-interactive

Visual:
- artwork is dominant
- text is secondary
- artwork must never be stretched
- card must visually blend with page background

Responsive:
- dimensions may change
- aspect relationship remains controlled
```

Screens reference this shared spec instead of redefining the card repeatedly.

## 13. Example requirement map for a Math app

```text
Math App
│
├── Home
│   ├── REQ-HOME-001: learner sees current grade
│   ├── REQ-HOME-002: learner can continue most recent lesson
│   ├── REQ-HOME-003: all available topics are visible
│   └── REQ-HOME-004: layout adapts without stretching topic artwork
│
├── Topic
│   ├── REQ-TOPIC-001: all lessons in topic are visible
│   ├── REQ-TOPIC-002: lesson progress is visible
│   └── REQ-TOPIC-003: locked/completed states are distinguishable
│
├── Lesson
│   ├── REQ-LESSON-001: one learning step is visually primary
│   ├── REQ-LESSON-002: previous/next navigation is clear
│   ├── REQ-LESSON-003: exercise CTA appears only at correct stage
│   └── REQ-LESSON-004: learning canvas remains usable on phone/tablet/desktop
│
└── Exercise
    ├── REQ-EX-001: question starts immediately when exercise begins
    ├── REQ-EX-002: answer is graded immediately
    ├── REQ-EX-003: feedback is shown clearly
    ├── REQ-EX-004: next question advances automatically when specified
    └── REQ-EX-005: final report appears automatically on completion
```

Each REQ id links to acceptance criteria and relevant Node Spec.

## 14. Recommended UI design artifacts

For a significant app or redesign, Planner should produce:

```text
design/
  UI-TREE.md
  UI-REQUIREMENTS.json
  DESIGN-FOUNDATION.md
  DESIGN-TOKENS.json
  DEVICE-MATRIX.md
  RESPONSIVE-SPEC.md
  COMPONENT-SPECS.md
  SCREEN-SPECS/
    HOME.md
    TOPIC.md
    LESSON.md
    EXERCISE.md
    RESULT.md
  UX-FLOW.md
  INTERACTION-SPEC.md
  UI-ACCEPTANCE.md
```

Small changes may combine artifacts, but the same information obligations remain.

## 15. Traceability

Planner MUST establish:

```text
Product requirement
  ↓
UI Tree node
  ↓
Node requirement
  ↓
Screen/component spec
  ↓
Coder execution task
  ↓
Reviewer acceptance check
```

This allows Reviewer to detect:

- implemented UI with no requirement
- requirement with no implementation
- responsive branch not implemented
- component inconsistent with shared design tokens
- screen state missing from test/review

## 16. UI readiness gate

For a new app or major UI redesign, implementation readiness requires:

```text
UI Tree complete
Node requirements complete
Design Foundation complete
Color tokens resolved
Typography resolved
Spacing/sizing system resolved
Device Matrix resolved
Global responsive behavior resolved
Per-node responsive behavior resolved
Shared component specs resolved
Asset strategy resolved
Interaction states resolved
UI acceptance criteria resolved
Verification capability resolved
```

If any material branch of the UI Tree remains unspecified, Planner must not mark the UI implementation ready.

## 17. Designer handoff

For material UI work, Planner compiles a Design Brief from this UI specification. Designer uses that brief to create Concept Artwork, then decomposes the selected concept into a single crop-ready numbered `ASSET-SHEET.png`: each visual asset is isolated on the sheet with spacing for manual cropping. Sidecar specifications and prompts support later high-quality regeneration of each cropped asset, as defined in `DESIGNER-HARNESS-v0.1.md`.

UI implementation readiness therefore requires both:

```text
PLANNER_UI_SPEC_READY
AND
DESIGN_CONCEPT_APPROVED
```

before Coder begins the visual implementation.

## 18. Coder UI/UX split

After Planner and Designer artifacts are approved, implementation is divided into:

```text
UX Coder
→ flow, state, interaction, accessibility behavior, responsive semantics

UI Coder
→ visual hierarchy, layout fidelity, typography, spacing, artwork integration, responsive visual composition
```

UI Coder must treat Concept Artwork as an implementation reference. Before coding, it should measure and normalize concept geometry into proportions, constraints, and design-token candidates; render-and-compare verification is a separate capability-gated step after implementation.

See `CODER-UIUX-HARNESS-v0.1.md`.

## 19. Core principle

> Planner defines the product and UI requirements; Designer establishes the visual concept; UX Coder makes it behave correctly; UI Coder makes it visually match the approved intent.

A screen is not an isolated page. It is one branch of a product-wide UI tree governed by shared tokens, shared components, device rules, interaction rules, and traceable requirements.
