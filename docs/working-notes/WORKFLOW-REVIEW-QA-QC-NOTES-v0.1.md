---
id: WORKFLOW-REVIEW-QA-QC-NOTES
version: 0.1
status: WORKING_NOTES
canonical: false
---

# Workflow, Review Loops, Work Units & QA/QC — Working Notes v0.1

## 0. Status of this file

This file captures the current theory discussion only.

It is intentionally **not canonical architecture yet**.

Do not automatically merge these ideas into:

- `FROZEN-FOUNDATION-v0.1.md`
- `SYSTEM-DEFINITION-SKELETON-v0.1.md`
- `STATE-MACHINE-v1.md`
- role contracts

until the user explicitly confirms the theory.

The purpose of this note is to preserve the full idea chain from:

```text
workflow
→ review loops
→ detailed planning
→ work allocation
→ review-unit sizing
→ implementation
→ Coder self-QA/QC
→ independent Reviewer QA/QC
→ correction / escalation
```

---

# 1. Core idea

The workflow is not a simple linear pipeline where Planner writes a plan, immediately assigns tasks, Coder codes everything, and Reviewer checks only at the end.

The current concept has **multiple maturation loops**.

Each major artifact becomes more concrete before the next organizational decision is made.

High-level shape:

```text
USER IDEA
  ↓
PLANNER
  ↔ REVIEWER
  ↓
ACCEPTED HIGH-LEVEL PLAN
  ↓
CODER ELABORATES IMPLEMENTATION REALITY
  ↔ REVIEWER
  ↓
ACCEPTED DETAILED EXECUTION PLAN
  ↓
BACK TO PLANNER
  ↔ REVIEWER
  ↔ HUMAN when useful
  ↓
WORK ALLOCATION + REVIEW TOPOLOGY
  ↓
IMPLEMENTATION
  ↓
CODER SELF-QA/QC
  ↓
INDEPENDENT REVIEW
  ↔ CORRECTION / ESCALATION
  ↓
CONTINUE TO NEXT ASSIGNED WORK
```

Important:

> Work assignment is not decided before the Detailed Execution Plan is mature enough to expose the real implementation topology.

---

# 2. Stage A — User idea → Planner plan

The process starts from a user idea, requirement, change request, or project goal.

Planner's first job is to turn that idea into a coherent plan at the product/project level.

Planner focuses on questions such as:

- what are we trying to achieve?
- what is in scope?
- what is out of scope?
- what system/product areas are affected?
- what architecture or contract constraints matter?
- what outcomes should exist when the work is complete?
- what important unknowns still need clarification?

Planner does **not** need to know every implementation detail yet.

The first plan is therefore not yet the staffing/work-assignment plan.

---

# 3. Loop 1 — Planner ↔ Reviewer

Planner and Reviewer work together until the high-level plan is sufficiently mature.

```text
Planner proposes plan
        ↓
Reviewer evaluates
   ├── problems found
   │      ↓
   │   Planner revises
   │      ↓
   └──── Reviewer evaluates again
        ↓
       PASS
```

Reviewer at this level looks primarily at:

- completeness of the idea
- contradictions
- missing scope
- architecture consequences
- missing dependencies
- whether acceptance can later be evaluated
- whether the plan is coherent enough to be elaborated technically

Reviewer does not take ownership of Planner's plan.

Planner remains the maker/owner.

Reviewer challenges and validates.

---

# 4. Stage B — Accepted plan → Coder detailed execution plan

After the high-level plan is accepted, Coder does **not immediately begin implementation**.

Coder first uses actual repository/source reality to elaborate HOW the accepted plan can be executed.

This produces a **Detailed Execution Plan**.

The Detailed Execution Plan may identify:

- actual repositories involved
- actual modules/files/components
- implementation entry points
- dependency order
- data flow
- interfaces/contracts touched
- migration steps
- technical risks
- test points
- likely implementation packages
- places where intermediate review may be valuable
- areas where the high-level plan does not map cleanly to real code

The important distinction is:

```text
Planner plan
= WHAT / WHY / product-system intent

Coder detailed execution plan
= HOW this maps onto real implementation
```

Coder still operates inside the accepted plan boundaries.

If real code exposes an architecture/scope problem that invalidates the accepted plan, Coder should not silently redefine the project.

That becomes an escalation back toward Planner.

---

# 5. Loop 2 — Coder Detailed Plan ↔ Reviewer

The Detailed Execution Plan itself is reviewed.

```text
Coder creates Detailed Execution Plan
             ↓
Reviewer evaluates implementation topology
       ├── FAIL
       │     ↓
       │  Coder revises detail
       │     ↓
       └──── Reviewer again
             ↓
            PASS
```

Reviewer at this level can challenge:

- sequencing
- missing dependencies
- unrealistic implementation assumptions
- excessive scope
- wrong technical boundaries
- missing verification points
- bad grouping
- integration risks
- mismatch between accepted Planner intent and actual code path

This loop continues until the Detailed Execution Plan is sufficiently stable.

---

# 6. Stage C — Detailed plan returns to Planner for work allocation

Only after the Detailed Execution Plan is accepted does Planner have enough information to make a realistic work-allocation plan.

At this point Planner can see both:

```text
approved project intent
+
approved implementation reality
```

Planner can now decide:

- which role/person/agent handles which work
- what order work happens in
- which work can proceed continuously
- which work can happen in parallel
- where dependency boundaries exist
- where implementation should pause
- where Reviewer should enter
- which outputs are meaningful enough to review
- which outputs are too small and should be grouped
- which outputs are too large and should be split

This stage is analogous to staffing/scheduling a real project after the design and execution topology are understood.

---

# 7. Loop 3 — Work allocation & review-topology calibration

Review boundaries are not hard-coded in advance.

Planner proposes work packages and review points.

Reviewer evaluates whether those review points are meaningful.

The human may intervene to calibrate the granularity.

```text
Planner proposes allocation/review topology
              ↓
Reviewer evaluates reviewability
              ↓
Human may adjust practical granularity
       ├── package too large → split
       ├── package too small → combine
       └── meaningful size → accept
              ↓
work allocation + review topology accepted
```

This loop is important because review cost and review value depend on the actual project.

---

# 8. Work units

The current theory distinguishes **implementation units** from **review units**.

They are related but not identical.

## 8.1 Phase

A large project segment with a coherent objective.

A Phase may contain several work packages.

A Phase does not automatically imply a review point.

## 8.2 Work Package

A coherent block of implementation assigned to a role/person/agent.

A Work Package may contain several tasks.

A Work Package should have:

- clear goal
- scope
- dependencies
- expected output
- local acceptance conditions

## 8.3 Task

A smaller executable step inside a Work Package.

Tasks are useful for implementation tracking.

A Task is **not automatically a Review Unit**.

## 8.4 Review Unit

A Review Unit is a meaningful result worth independent evaluation before dependent work continues.

This is a separate concept from Task, file count, commit count, or line count.

A Review Unit may be:

```text
one Work Package
several Work Packages together
part of one very large Work Package
one important architectural checkpoint
one coherent user-visible feature slice
one integration boundary
```

Therefore:

> Review Unit is determined by meaning and risk, not by mechanical size.

---

# 9. Review Unit sizing rules — current theory

There should NOT be a universal rule such as:

```text
review every task
review every file
review every N files
review every X lines
review only after each phase
```

Instead, review granularity is planned after the Detailed Execution Plan is known.

## Split a Review Unit when

- it is too large to review coherently
- multiple unrelated risks are mixed
- later work depends on an intermediate result
- an architecture/contract decision becomes concrete partway through
- continuing without review would make rework expensive
- one portion is independently meaningful and reviewable

## Combine work into one Review Unit when

- individual tasks are too small to judge meaningfully
- review overhead would exceed review value
- several tasks only form a useful result together
- the reviewer needs the combined behavior to judge quality

## Human role

The human may explicitly decide:

- split this review unit
- combine these units
- insert a review point here
- skip an unnecessary micro-review

The system should support this without requiring theory changes.

---

# 10. Implementation flow after allocation

Once assignment and review topology are accepted:

```text
Assigned Work Package / Task
        ↓
Coder implementation
        ↓
Coder self-QA/QC
        ↓
Is this a planned review boundary?
   ├── NO → continue assigned work
   └── YES
          ↓
      Reviewer
       ├── PASS → continue next assigned work
       └── FAIL → correction / escalation loop
```

This means Reviewer does not necessarily enter after every small Task.

Reviewer enters at planned Review Units or when an unexpected risk/gap forces escalation.

---

# 11. Coder self-QA/QC is a distinct harness

Coder needs its own internal quality harness.

This is separate from independent Reviewer code review.

The two harnesses have different scopes and questions.

```text
Coder self-QA/QC
= local correctness and readiness to submit

Reviewer code/product review
= broader system/product correctness and coherence
```

---

# 12. Coder self-QA

Coder self-QA is primarily local, technical, and task/work-package oriented.

Primary question:

> Is my implementation clean enough and technically sane enough to submit for independent review?

Typical checks:

- syntax
- formatting
- obvious code presentation problems
- imports/references
- obvious stack misuse
- obvious type errors
- lint where applicable
- build where available
- obvious runtime errors where executable
- accidental unrelated edits
- basic code hygiene
- obvious missing edge handling visible from the assigned work
- no incomplete placeholder accidentally presented as finished

Purpose:

Remove small/local defects before consuming Reviewer attention.

---

# 13. Coder self-QC

Coder self-QC checks whether the local implementation actually satisfies the assigned goal.

Primary question:

> Did I produce the result this assigned Work Package/Task asked for?

Examples:

- required function exists
- function behaves as requested
- page/feature is present
- required UI controls exist
- requested workflow works locally
- expected data is handled
- local acceptance points appear satisfied
- implementation is runnable/testable where capability exists

Coder self-QC is still bounded by the assigned work.

It does not replace broader product/system review.

---

# 14. Coder self-QA/QC loop

Coder should not submit immediately after writing code.

Internal loop:

```text
IMPLEMENT
   ↓
SELF-QA
   ├── local defect → fix
   └── pass
        ↓
SELF-QC
   ├── assigned goal not met → fix
   └── pass
        ↓
READY FOR INDEPENDENT REVIEW
```

This loop may repeat many times internally without invoking Reviewer.

---

# 15. Independent Reviewer code review is a different harness

Reviewer looks at a wider picture than Coder self-QA/QC.

Primary question:

> Is this implementation correct and good enough in the context of the approved plan, architecture, surrounding product, and already accepted work?

Reviewer is not merely a second lint pass.

Reviewer should spend attention on higher-level risks that the local implementer can easily miss.

---

# 16. Reviewer QA — broader process/system alignment

Reviewer QA may examine:

- alignment with approved Planner intent
- alignment with Detailed Execution Plan
- scope integrity
- architecture consistency
- contract compatibility
- dependency handling
- migration consistency
- integration with prior accepted work
- whether implementation sequencing remains valid
- whether the implementation introduces unplanned coupling
- whether review evidence is sufficient
- whether the current result invalidates later planned work
- whether the work unit was actually ready to be reviewed

Primary question:

> Was this result produced in a way that still fits the larger approved system and workflow?

---

# 17. Reviewer QC — broader product/result quality

Reviewer QC examines the actual outcome from the product/system perspective.

Possible concerns:

- does the result serve the original product goal?
- does it integrate coherently with adjacent features?
- does behavior remain consistent?
- is UX consistent with the rest of the product?
- is UI visually coherent with previous screens/components?
- does the new work feel bolted-on or patched together?
- do interactions follow established patterns?
- does the solution create obvious future maintenance problems?
- are acceptance criteria satisfied at the broader level?
- is the result genuinely ready for dependent work?

Primary question:

> Is the result good enough as part of the whole product, not merely correct in isolation?

---

# 18. Example — Coder passes, Reviewer fails

Goal:

```text
Create a new page containing functions A, B, and C.
```

Coder implements:

- page exists
- A works
- B works
- C works
- syntax is correct
- build/tests available to Coder pass
- local UI matches the task description

Coder self-QA/QC may legitimately pass.

Reviewer then compares the result with the existing product.

Reviewer may find:

- layout language differs from the previous page
- spacing is inconsistent
- navigation feels unrelated
- visual hierarchy breaks the existing pattern
- new behavior conflicts with surrounding flows
- the page looks like it was patched onto another product

Reviewer therefore fails the Review Unit.

This is not a contradiction.

It demonstrates the intended separation:

```text
Coder:
"my assigned implementation works"

Reviewer:
"the implementation does not yet work well as part of the larger product"
```

---

# 19. Loop 4 — Coder correction loop after independent review

When Reviewer finds an implementation-level issue:

```text
Reviewer finding
      ↓
Coder receives actionable finding
      ↓
Coder fixes affected work
      ↓
Coder self-QA/QC again
      ↓
Reviewer re-checks
      ├── FAIL → repeat
      └── PASS → continue
```

Reviewer should not directly fix Coder's work.

The maker remains responsible for correction.

---

# 20. Escalation — not every review failure belongs to Coder

Reviewer may discover that the defect is not actually an implementation defect.

Failure must be routed to the level that owns the problem.

Working model:

```text
local implementation defect
→ Coder fixes current work

Detailed Execution Plan defect
→ return to Coder planning loop

work allocation / review-boundary defect
→ return to Planner + Reviewer allocation loop

product scope / architecture / contract defect
→ return to Planner loop

unclear product decision
→ involve human
```

This prevents Coder from silently solving planning or architecture problems that belong upstream.

---

# 21. Nested loops — combined view

The overall workflow is therefore a set of nested loops:

```text
USER IDEA
   ↓
┌────────────────────────────────────────────┐
│ LOOP A — PRODUCT / PROJECT PLAN            │
│ Planner ↔ Reviewer                         │
└────────────────────────────────────────────┘
   ↓ accepted
┌────────────────────────────────────────────┐
│ LOOP B — DETAILED EXECUTION PLAN           │
│ Coder ↔ Reviewer                           │
└────────────────────────────────────────────┘
   ↓ accepted
┌────────────────────────────────────────────┐
│ LOOP C — WORK ALLOCATION / REVIEW TOPOLOGY │
│ Planner ↔ Reviewer ↔ Human                 │
└────────────────────────────────────────────┘
   ↓ accepted
┌────────────────────────────────────────────┐
│ LOOP D — CODER INTERNAL QUALITY            │
│ Implement ↔ Self-QA ↔ Self-QC              │
└────────────────────────────────────────────┘
   ↓ review boundary
┌────────────────────────────────────────────┐
│ LOOP E — INDEPENDENT REVIEW                │
│ Reviewer ↔ Coder correction                │
└────────────────────────────────────────────┘
   ↓ pass
NEXT ASSIGNED WORK / NEXT REVIEW UNIT
```

If Loop E exposes an upstream defect, execution escalates back to Loop B, C, or A as appropriate.

---

# 22. QA/QC unit model — current working concept

Quality checks exist at different scopes.

They should not all use one giant checklist.

## Unit Q1 — Coder Self-QA

Scope:

```text
current Task / Work Package
```

Focus:

- syntax
- code hygiene
- stack correctness
- obvious technical defects
- submission readiness

## Unit Q2 — Coder Self-QC

Scope:

```text
current Task / Work Package goal
```

Focus:

- requested output exists
- requested behavior works
- local acceptance is met

## Unit Q3 — Reviewer QA

Scope:

```text
current Review Unit
+ relevant surrounding architecture/plan
+ relevant previously accepted work
```

Focus:

- plan alignment
- architecture/contracts
- scope
- integration/process correctness
- dependencies
- evidence sufficiency

## Unit Q4 — Reviewer QC

Scope:

```text
current Review Unit
+ surrounding product/system experience
```

Focus:

- actual result quality
- integration coherence
- UX/UI consistency
- product goal
- readiness for downstream work

## Unit Q5 — Higher-level integration/final quality

Potential scope:

```text
Phase / PR / multi-package result / Job
```

Purpose:

Check that individually accepted Review Units still form a coherent whole.

Exact placement and mandatory rules are NOT yet finalized in this note.

---

# 23. Important distinction: implementation unit vs quality unit

The system should avoid assuming:

```text
Task = Review Unit = QA Unit = QC Unit
```

Instead:

```text
Task
= implementation tracking unit

Work Package
= assignment unit

Review Unit
= independent-review boundary

QA/QC Unit
= scope against which a specific quality harness evaluates
```

These may align in simple work but do not have to.

Example:

```text
Tasks:
T1 + T2 + T3

Assignment:
one Coder Work Package

Coder self-QA/QC:
runs continuously across T1/T2/T3

Review Unit:
T1+T2+T3 together

Reviewer:
reviews the combined meaningful result
```

Or:

```text
One very large Work Package

Planner/Reviewer decide:
review checkpoint after architectural slice A
then continue slice B

Review Units:
A
B
```

---

# 24. Review cost vs review value

Review is not free.

Too little review can allow bad foundations to propagate.

Too much review can create unnecessary friction and slow work without increasing product quality.

Therefore the review topology should optimize:

```text
expected quality/risk reduction
vs
review overhead / interruption cost
```

This balance is project-specific and should be adjustable by Planner, Reviewer, and Human after the Detailed Execution Plan is understood.

---

# 25. Current theory that appears relatively stable

The following ideas were explicitly agreed during discussion:

1. Planner and Reviewer loop on the initial/high-level plan.
2. After that, Coder develops a Detailed Execution Plan before implementation.
3. Reviewer loops with Coder until the Detailed Execution Plan is acceptable.
4. Only then does the plan return to Planner for work allocation.
5. Review boundaries are planned after implementation detail is known.
6. Review Unit is not mechanically equal to one Task/file/size threshold.
7. Planner proposes work/review boundaries; Reviewer and Human may split/combine them.
8. Coder has its own internal self-QA/QC harness.
9. Coder self-QA/QC is narrower and more local than independent Reviewer review.
10. Reviewer code/product review looks at the broader plan/system/product context.
11. Reviewer may reject work that locally functions but does not integrate coherently.
12. Reviewer does not directly fix the maker's work; findings return to the appropriate owner.
13. Review failures may escalate upstream when the real defect is planning, detailed planning, allocation, architecture, or product intent.

---

# 26. Not yet finalized

The following should remain open until further theory discussion:

- exact workflow state names
- exact status vocabulary
- exact Definition of Done
- whether every Phase/PR/Job needs an explicit final review
- exact Reviewer sub-modes
- exact Planner staffing artifact format
- exact Review Unit metadata/schema
- exact QA/QC checklist per technology stack
- exact evidence requirements
- whether some reviews may be automatic
- rules for parallel workers/coders
- multi-repo assignment/review topology
- exact human approval points
- how review cost/value should be represented
- how these concepts map into v1/v2/v3 implementation

---

# 27. Intended later use

Once the theory is explicitly approved, selected parts of this note may be incorporated into:

```text
SYSTEM-DEFINITION-SKELETON
STATE-MACHINE
PLANNER-CONTRACT
CODER-CONTRACT
REVIEWER-CONTRACT
QA-PROTOCOL
QC-PROTOCOL
DEFINITION-OF-DONE
HANDOFF-PROTOCOL
```

Until then, this file remains a discussion reference only.
