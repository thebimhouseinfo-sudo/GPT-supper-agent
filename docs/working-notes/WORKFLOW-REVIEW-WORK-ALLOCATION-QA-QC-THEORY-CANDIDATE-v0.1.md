---
id: WORKFLOW-REVIEW-WORK-ALLOCATION-QA-QC-THEORY-CANDIDATE
version: 0.1
status: THEORY_CANDIDATE
canonical: false
purpose: debate
---

# Workflow, Review, Work Allocation & QA/QC — Theory Candidate v0.1

## 0. Status

This is a theory candidate for debate. It attempts to complete the workflow theory that has emerged from discussion.

It is not canonical and must not silently override Frozen Foundation, System Definition Skeleton, State Machine, role contracts, or QA/QC protocols.

After human + Claude debate, accepted parts can be promoted into canonical documents.

## 1. Central thesis

GPT Super Agent should behave less like one autonomous coder with a long checklist and more like a small software team whose work matures through distinct loops.

~~~text
IDEA
→ PROJECT PLAN
↔ REVIEW

→ OPTIONAL SPECIALIST ELABORATION

→ DETAILED EXECUTION PLAN
↔ REVIEW

→ WORK ALLOCATION + REVIEW TOPOLOGY
↔ REVIEW / HUMAN CALIBRATION

→ IMPLEMENTATION
↔ CODER SELF-QA/QC

→ INDEPENDENT REVIEW
↔ CORRECTION / ESCALATION

→ INTEGRATION / FINAL REVIEW
→ COMPLETE
~~~

Three principles dominate the model:

1. Planning matures before staffing/allocation.
2. Review boundaries are designed from the real execution topology, not hard-coded by file/task count.
3. Coder self-QA/QC and independent Reviewer review are different quality systems with different scopes.

## 2. Why work allocation comes late

The initial plan does not know enough to allocate work well. Before repository inspection, many implementation facts are unknown: real code boundaries, hidden dependencies, provider/consumer relationships, migration order, testing surfaces, implementation coupling, safe parallelism, and natural review checkpoints.

Therefore:

~~~text
high-level plan
≠ sufficient basis for final work allocation
~~~

The intended order is:

~~~text
understand what must be built
→ understand how it can actually be built
→ then assign people/agents, work packages and review points
~~~

## 3. Artifact maturity model

### 3.1 Project Plan

Owner: Planner.

Purpose: define intent at product/system level.

It answers: goal, scope, non-goals, affected system areas, architecture/contract constraints, desired outcomes, important unknowns, and acceptance intent.

It intentionally does not prescribe every implementation move.

### 3.2 Detailed Execution Plan

Owner: Coder, constrained by the approved Project Plan.

Purpose: translate approved intent into repository-level implementation reality.

It identifies actual repos/modules/components, implementation entry points, dependency order, data flow, interfaces/contracts touched, migration steps, technical risks, verification surfaces, likely implementation slices, and useful intermediate checkpoints.

Core distinction:

~~~text
Planner Project Plan
= WHAT / WHY / product-system intent

Coder Detailed Execution Plan
= HOW that intent maps onto live implementation
~~~

### 3.3 Work Allocation & Review Topology

Owner: Planner.

Inputs: approved Project Plan + approved Detailed Execution Plan + capabilities/resources + Reviewer feedback + Human preference when useful.

Purpose: decide who does what, in what order, and where independent review enters.

It defines assignment, dependencies, parallelism, stop points, Review Units, downstream unlock conditions, and which packages should be split or grouped.

## 4. Loop A — Planner ↔ Reviewer: Project Plan maturation

~~~text
Planner drafts Project Plan
          ↓
Reviewer checks project/system coherence
   ├── CHANGES_REQUIRED
   │        ↓
   │    Planner revises
   │        ↓
   └──── Reviewer checks again
          ↓
        ACCEPTED
~~~

Reviewer checks goal clarity, scope completeness, contradictions, missing dependencies, architecture/contract implications, risks, and whether later success can be evaluated.

Human enters when the issue is a genuine product decision, preference, tradeoff, or authority decision.

Reviewer does not rewrite Planner's artifact. The maker remains responsible for correction.

## 5. Optional specialist elaboration

Some approved plans require specialist artifacts before Coder can produce a credible Detailed Execution Plan.

Examples: Designer concept, domain constraint analysis, migration mapping, API interface expectation.

This stage is conditional, not universal.

~~~text
Project Plan accepted
    ↓
specialist artifact required?
    ├── no → Coder detailed planning
    └── yes → specialist artifact
                ↓
             review only when meaningful/risky enough
                ↓
             Coder detailed planning
~~~

The theory does not hard-code a mandatory Design Review for every design artifact. Review topology determines whether specialist output itself is a Review Unit.

## 6. Loop B — Coder ↔ Reviewer: Detailed Execution Plan maturation

~~~text
Coder inspects live implementation
        ↓
Detailed Execution Plan
        ↓
Reviewer checks technical topology
   ├── CHANGES_REQUIRED
   │       ↓
   │   Coder revises
   │       ↓
   └── Reviewer checks again
        ↓
      ACCEPTED
~~~

Reviewer checks implementation plausibility, dependency ordering, missing migrations, testability, integration risk, cross-repo effects, unnecessary complexity, and alignment with the accepted Project Plan.

If implementation reality reveals an architecture/scope/contract problem, Coder must not silently solve it inside this loop.

~~~text
implementation-detail problem
→ stay in Loop B

architecture / contract / product-scope problem
→ escalate to Planner / Loop A
~~~

## 7. Loop C — Planner ↔ Reviewer ↔ Human: work allocation and review topology

Only after both plans are accepted does Planner create the real work topology.

Planner decides phases, Work Packages, Tasks, owners, dependencies, parallel branches, review boundaries, stop points, and downstream unlock conditions.

Reviewer evaluates reviewability and risk: whether packages are too large, too small, reviewed too late, reviewed too early, or hide important architectural checkpoints.

Human may calibrate practical granularity:

~~~text
too large → split
too small → combine
meaningful + manageable → keep
high-risk boundary → insert review point
low-value interruption → remove micro-review
~~~

Human is available as authority/calibration, not required in every cycle.

## 8. Work topology is a graph

A real project can contain sequential work, parallel work, fan-out, fan-in, cross-repo dependencies and review gates.

~~~text
WP-A
 ↓
REVIEW-A
 ├────────────┐
 ↓            ↓
WP-B        WP-C
 ↓            ↓
REVIEW-B    REVIEW-C
 └──────┬─────┘
        ↓
   INTEGRATION-D
        ↓
   REVIEW-D
~~~

A review can unlock one or many dependent branches. A failed upstream Review Unit can invalidate dependent downstream work.

## 9. Implementation units

### 9.1 Phase

A large planning segment with a coherent objective. Useful for roadmap and sequencing. Not automatically a review boundary.

### 9.2 Work Package

Primary assignment unit. A coherent body of work owned by one role/agent at a time.

A Work Package should define goal, scope, dependencies, expected output, local acceptance, owner, and downstream consumers.

### 9.3 Task

A smaller executable tracking unit inside a Work Package. Useful for implementation progress. Not automatically a Review Unit.

### 9.4 Review Unit

An independent quality-evaluation unit. Orthogonal to Task and Work Package.

A Review Unit can be one Task, several Tasks, one Work Package, several small Work Packages, a slice of a large package, an architectural checkpoint, a vertical product slice, or an integration result.

Core rule:

~~~text
Task
≠ Work Package
≠ Review Unit
~~~

## 10. Review Unit definition

A Review Unit is the smallest currently useful result whose independent evaluation can materially reduce downstream risk or validate readiness for dependent work.

It is not defined by file count, lines changed, tokens, commits, task count, or fixed duration.

A good Review Unit is meaningful, coherent, independently judgeable, bounded enough for Reviewer context, large enough to justify review cost, and early enough to prevent expensive propagation.

Split when concerns/risk are mixed, context becomes unwieldy, downstream work depends on an intermediate result, or failure would create expensive rework.

Combine when individual tasks have little standalone meaning, review overhead dominates value, or only combined behavior demonstrates quality.

## 11. Dynamic review topology

Review topology may evolve during execution if new information appears.

~~~text
unit too large → propose split
units too small → propose combine
new risk → insert checkpoint
obsolete low-value review → propose removal
~~~

Topology changes must not be silent. They go through the appropriate Planner/Reviewer/Human governance path.

## 12. Coder internal quality harness

Coder runs an internal quality loop before independent review.

~~~text
IMPLEMENT
   ↓
SELF-QA
   ├── defect → FIX
   └── pass
        ↓
SELF-QC
   ├── assigned goal not met → FIX
   └── pass
        ↓
READY_FOR_REVIEW
~~~

Self-QA/QC may run continuously during implementation.

## 13. Coder Self-QA

Primary question: Is the implementation technically clean and submission-ready inside the assigned scope?

Typical checks: syntax, parse/compile/type issues, lint/format where applicable, imports/references, stack/framework misuse, obvious broken paths, obvious error-handling omissions, accidental unrelated changes, incomplete placeholders, trivial consistency problems, and basic test/build readiness.

Purpose: remove local technical noise before consuming Reviewer attention.

## 14. Coder Self-QC

Primary question: Does my implementation achieve the assigned Work Package/Task goal?

Typical checks: requested feature exists, required behavior works, local acceptance is met, requested controls/functions/data paths exist, relevant local UX/UI constraints are met, and local tests demonstrate requested behavior where possible.

Coder Self-QC is bounded by the assignment. A local pass does not imply product-level approval.

## 15. Independent Reviewer harness

Reviewer evaluates a broader context than Coder.

Primary question: Is this result correct, coherent, and safe as part of the approved project/system/product?

Reviewer loads the current Review Unit plus the minimum surrounding context needed to judge integration: accepted Project Plan, Detailed Execution Plan, Work Topology, architecture/contracts, relevant previous accepted work, dependencies, actual diff, objective evidence, and product/design context.

## 16. Reviewer QA

Reviewer QA focuses on larger process/system correctness.

Typical concerns: plan alignment, scope integrity, architecture consistency, contract compatibility, dependency correctness, migration coherence, unplanned coupling, whether the review boundary remains valid, evidence sufficiency, stale assumptions, and hidden downstream obligations.

Primary question: Does this work still fit the approved system and process?

## 17. Reviewer QC

Reviewer QC focuses on broader product/output quality.

Typical concerns: original product goal, behavior in context, product consistency, UX continuity, visual continuity, coherent interaction patterns, integration quality, maintainability, regression risk, patchwork feel, and readiness for dependent work.

Primary question: Is this result good enough as part of the whole product, not merely correct in isolation?

## 18. Why Coder can pass while Reviewer fails

Example: Coder builds a page with functions A/B/C. The page exists, functions work, build passes, and local UI requirements are present. Coder Self-QA/QC may legitimately pass.

Reviewer may still fail it because layout language differs from neighboring screens, navigation is inconsistent, spacing feels unrelated, component behavior violates established patterns, or the feature feels bolted onto another product.

~~~text
Coder pass
= locally correct

Reviewer pass
= contextually acceptable
~~~

## 19. Reviewer is one role with multiple modes

One Reviewer role can operate in Project Plan Review, Specialist Artifact Review when needed, Detailed Execution Plan Review, Work Topology Review, Code/Product Review, Integration Review, and Final Completion Review.

Different modes load different context and checklists; the Reviewer role itself need not be duplicated.

## 20. Review findings have two dimensions

Severity candidate:

~~~text
BLOCKING
IMPORTANT
MINOR
~~~

Routing/ownership candidate:

~~~text
LOCAL_IMPLEMENTATION
DETAIL_PLAN
WORK_TOPOLOGY
PROJECT_PLAN
SPECIALIST_ARTIFACT
INTEGRATION
HUMAN_DECISION
~~~

Severity answers how serious the defect is. Routing answers which loop owns correction. They should not be conflated.

## 21. Failure routing

Reviewer returns work to the lowest correct owning level.

~~~text
syntax / local code defect
→ Coder current work

implementation structure problem
→ Coder current work

Detailed Execution Plan wrong
→ Coder Detailed Plan loop

review boundary / assignment bad
→ Planner Work Topology loop

product scope / architecture / contract wrong
→ Planner Project Plan loop

specialist artifact wrong
→ specialist owner

true product choice unclear
→ Human

integration failure
→ affected upstream Review Unit(s)
~~~

Reviewer does not directly repair maker-owned work.

## 22. Downstream invalidation

When an upstream accepted artifact reopens, dependent downstream approval cannot automatically remain valid.

~~~text
Project Plan changes
→ Detailed Execution Plan may become stale
→ Work Allocation may become stale
→ Review topology may become stale
→ affected implementation/reviews may need revalidation
~~~

Invalidation should be impact-based, not blanket destruction. Only affected branches reopen.

## 23. Parallel work

Parallel work is allowed when accepted topology establishes sufficient independence.

Independent branches may continue while another branch is under review if no dependency is violated.

When parallel branches converge, the convergence point normally becomes an integration-oriented Review Unit.

## 24. Quality scopes

| Scope | Owner | Primary question |
| --- | --- | --- |
| Q1 Coder Self-QA | Coder | Is my code technically clean enough to submit? |
| Q2 Coder Self-QC | Coder | Does my assigned work achieve its local goal? |
| Q3 Reviewer QA | Reviewer | Does this Review Unit fit the approved plan/system/process? |
| Q4 Reviewer QC | Reviewer | Is this result good enough in wider product context? |
| Q5 Integration/Final Quality | Reviewer + Human when needed | Do accepted units form a coherent complete result? |

These scopes may share evidence but should not collapse into one giant checklist.

## 25. Objective evidence vs judgement

Objective evidence includes builds, tests, typecheck, lint, CI, diffs, screenshots, runtime behavior, contract checks, and commit identity. Use it whenever it can answer the question.

Evaluative judgement is still needed for UX coherence, UI consistency, architectural quality, patchwork feel, meaningful Review Unit sizing, and product coherence.

Reviewer judgement should be grounded in visible artifacts and explicit criteria. The theory should not pretend every quality dimension can be reduced to a mechanical test.

## 26. Candidate status semantics

Exact canonical state names remain open, but these semantic distinctions are needed:

~~~text
PLANNED
ASSIGNED
IN_PROGRESS
SELF_CHECKING
READY_FOR_REVIEW
CHANGES_REQUIRED
APPROVED
BLOCKED
STALE
~~~

Important distinctions:

~~~text
IMPLEMENTED ≠ READY_FOR_REVIEW
READY_FOR_REVIEW ≠ APPROVED
APPROVED child ≠ parent complete
~~~

## 27. Completion theory

Completion propagates upward; it is not declared locally.

Task: locally implementation-complete when assigned acceptance is satisfied, but may belong to an unreviewed Review Unit.

Work Package: required Tasks complete and Self-QA/QC passed; if it is a Review Unit it still needs Reviewer approval.

Review Unit: complete only after Reviewer accepts the result and required evidence.

Phase: complete when required Review Units/Work Packages are approved or explicitly waived.

Change/Job: complete when all required branches are approved, integration/final review passes, no blocking findings remain, and evidence is sufficiently current.

Core principle: a maker cannot unilaterally declare the Job done.

## 28. Final review

Final review catches failures invisible when units are reviewed separately.

It asks whether accepted pieces work together, whether gaps exist between them, whether combined behavior is coherent, whether original intent is still met, whether obligations remain, and whether parallel work diverged.

Final review should focus on integration and overall coherence rather than re-review every line.

## 29. Human role

Human is especially useful for product intent, subjective preference, risk acceptance, review granularity, priority tradeoffs, destructive decisions, major scope changes, ambiguous Reviewer disagreement, and final subjective product judgement.

Reviewer should escalate a true human decision instead of fabricating one.

## 30. Review cost vs review value

Review has cost: context loading, interruption, latency and duplicated analysis.

Review has value: risk reduction, early defect detection, architectural consistency, integration safety and product coherence.

The topology should seek maximum useful risk reduction with minimum unnecessary interruption. This is why fixed review-per-task rules are rejected.

## 31. Harness separation

Planner harness owns Project Plan, Work Allocation/Review Topology and upstream resolution.

Coder planning harness owns Detailed Execution Plan and technical sequencing.

Coder Self-QA/QC harness owns local technical quality, local goal satisfaction and readiness to submit.

Reviewer harness owns independent challenge, broader system/product evaluation, finding severity/routing and approval.

Orchestrator harness owns routing artifacts between loops, preserving state, enforcing stop/unlock conditions and preventing required reviews from being skipped.

These concerns should not collapse into one prompt.

## 32. Reviewer context principle

Reviewer should receive neither too little nor the entire Job by default.

~~~text
current Review Unit
+ artifact/result being reviewed
+ accepted parent intent
+ directly relevant dependencies/contracts
+ relevant already-approved neighboring work
+ evidence
~~~

Context expands only when dependencies/findings require it.

## 33. Unexpected review during execution

Execution may stop before a planned review point when major risk, scope mismatch, failed architecture assumption, unexpected dependency, low confidence, or Human request appears.

This creates an ad-hoc checkpoint and should update the evolving topology rather than being treated as a model failure.

## 34. Designer / UX / UI relationship

Designer and UX/UI specialization fit into the same work-topology theory.

Designer is a specialist whose artifact may be needed before technical detailing.

UX/UI may be separate Work Packages, skills inside one Coder, sequential subpackages, or parallel packages where safe.

The project need + risk + dependency + Detailed Execution Plan decide the topology. The theory does not require a fixed Designer→Review→UX→Review→UI→Review chain for every UI change.

## 35. Multi-repo extension

The same theory extends to multi-repo Jobs.

~~~text
Project Plan
→ Detailed Execution Plan across repos
→ Work Allocation

Repo A work → Review A
Repo B work → Review B
Repo C work → Review C

cross-repo integration
→ Integration Review
→ final result
~~~

A Repo is not automatically a Review Unit. One repo can contain multiple Review Units; one integration Review Unit can span multiple repos.

## 36. Candidate invariants

1. Work allocation follows accepted Detailed Execution Planning.
2. Reviewer does not own or repair maker artifacts.
3. Review Unit is semantic/risk-based, not size-based.
4. Task and Review Unit are independent concepts.
5. Coder self-QA/QC precedes planned independent review.
6. Coder Self-QA/QC and Reviewer review use different scopes.
7. Reviewer considers relevant broader context, not only local task correctness.
8. Review failure routes to the lowest correct owning level.
9. Upstream changes invalidate only affected downstream branches.
10. Dependent work may be blocked until required upstream review passes.
11. Review topology can evolve, but not silently.
12. Human may calibrate review granularity and resolve true product decisions.
13. Completion propagates upward; maker completion alone cannot close the Job.
14. Parallel execution is allowed only where dependency topology permits it.
15. Final/integration review evaluates combined coherence, not merely repeated local correctness.

## 37. Observable violations

Examples that future harness/evals can detect:

- Planner assigns final implementation packages before a Detailed Execution Plan exists.
- Coder begins implementation before a required Detail Plan review passes.
- Every Task triggers review merely because it is a Task.
- Reviewer ignores relevant adjacent context and approves a visibly inconsistent result.
- Coder claims Job completion immediately after local tests pass.
- Reviewer directly edits source instead of returning findings.
- Coder silently changes product scope to solve a planning defect.
- Failed upstream contract review does not block dependent work.
- Review Units are silently split/combined.
- Coder submits without required local self-checks.
- Reviewer trusts only Coder self-report instead of inspecting independent evidence.
- Job is marked complete while an affected Review Unit remains unapproved.

## 38. HARD / SOFT / UNKNOWN implication

The theory defines desired behavior but does not automatically make it HARD.

~~~text
Coder must stop at review boundary
→ SOFT unless Orchestrator/tooling blocks continuation

Reviewer cannot write source
→ SOFT unless credentials/tool permissions enforce it

dependent work cannot unlock before review
→ potentially HARD if Orchestrator state/dependency gate enforces it
~~~

Canonical implementation must classify each important rule by actual mechanism. UNKNOWN behaves operationally as SOFT until verified.

## 39. Debate points

DP1 — Must every meaningful development Job have final independent review? Candidate default: yes; trivial administrative Jobs may differ.

DP2 — Can Reviewer approve with non-blocking MINOR findings? Candidate default: yes if acceptance/downstream safety is unaffected.

DP3 — Can Planner + Reviewer change review topology without Human? Candidate default: yes unless user-visible scope, risk acceptance, or user-pinned checkpoints change.

DP4 — Can Reviewer request an unplanned Review Unit? Candidate default: yes when new risk justifies it.

DP5 — Can independent branches continue while another branch is under review? Candidate default: yes if topology/dependencies allow it.

DP6 — Who authors the first Detailed Execution Plan when multiple specialist Coders exist? Candidate default: one coordinating Coder/planning role creates the integrated detail plan; specialist ownership is assigned afterward.

DP7 — Is Designer review globally mandatory? Candidate default: no; review it when risk/meaning/topology justify it.

DP8 — Must Human approve final Job completion? Candidate default: not always; require Human only where product/risk policy demands it.

## 40. Proposed promotion path after debate

If accepted, split this theory into canonical documents rather than keeping one giant file:

~~~text
STATE-MACHINE-v1
← stages, loops, transitions, escalation, unlock rules

WORK-TOPOLOGY-v1
← Phase / Work Package / Task / Review Unit / dependencies / allocation

PLANNER-CONTRACT-v1
← Project Plan + Work Allocation ownership

CODER-CONTRACT-v1
← Detailed Execution Plan + implementation ownership

QA-QC-v1
← Coder Self-QA/QC + Reviewer QA/QC scopes

REVIEWER-CONTRACT-v1
← review modes, findings, routing, independence

DEFINITION-OF-DONE-v1
← upward completion semantics

HANDOFF-PROTOCOL-v1
← artifact/result transport between loops
~~~

Do not promote until the user explicitly approves the theory after debate.