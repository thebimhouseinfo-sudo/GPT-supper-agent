---
id: SYSTEM-THEORY-OPTIONS
version: 0.1
status: THEORY_OPTIONS
canonical: false
purpose: human-claude-debate
mirrors: SYSTEM-DEFINITION-SKELETON-v0.1
---

# GPT Super Agent — System Theory Options v0.1

## 0. Purpose

This file mirrors the System Definition Skeleton section-by-section and drafts theory options for every unresolved area.

It is a debate document, not canonical architecture.

Rules for this file:

- FROZEN sections are recorded as constraints, not reopened casually.
- PARTIAL / TO_DEFINE sections receive explicit options.
- Each option includes tradeoffs.
- A candidate recommendation is provided, but is NOT a final decision.
- Human and Claude should challenge the recommendation.
- Accepted decisions will later be promoted into canonical documents.
- Release scope (v1/v2/v3) is NOT decided here.

Status vocabulary in this note:

~~~text
FIXED
= already frozen elsewhere

OPTION SET
= alternatives are intentionally open

CANDIDATE
= current recommended direction for debate, not approved
~~~

---

# S0. Product Boundary — FIXED

Current frozen direction:

~~~text
GPT Super Agent
= online coding / orchestration harness

GitHub
= code environment

Google Drive
= durable Job / Project Memory

GPTWorker
= separate offline/local agent
~~~

No option set here unless a Foundation Amendment is explicitly proposed.

Debate only if evidence shows the online/offline boundary is unworkable.

---

# S1. Job / Drive Model — FIXED

Current frozen direction:

- one configured Drive root
- one direct subfolder per Job
- JOB.md marks the Job
- no Job registry
- Drive-first Job loading
- same Job model for single- and multi-repo
- GitHub repos are attached code environments

No option set here without Foundation Amendment.

---

# S2. GitHub Code Environment — OPTION SET

## Question

How should a Job map approved work onto GitHub branches/PRs and repository attachment?

## Option A — Repo-local workflow

Each repo independently creates branches/PRs.

Pros:
- simple
- matches normal GitHub practice
- easy for single-repo Jobs

Cons:
- weak cross-repo coordination
- change-set identity may fragment
- harder to reason about one Job-level workflow

## Option B — One Change Set controls repo-local branches

The Job creates a logical Change Set in Drive.

Each affected repo has its own branch/PR linked to that Change Set.

Pros:
- natural for multi-repo
- preserves GitHub-native PRs
- Drive remains project-level control plane
- supports cross-repo integration review

Cons:
- more metadata
- requires coordination state

## Option C — One branch per Review Unit

Every meaningful Review Unit gets a separate branch/PR.

Pros:
- very explicit checkpoints
- rollback/review isolation

Cons:
- branch explosion
- review topology becomes Git topology
- inappropriate for small/internal Review Units

## Candidate

**Option B.**

Review Unit should remain a semantic quality concept, not automatically a Git branch.

Branch/PR boundaries are chosen by Work Topology, but all repo PRs belong to a Job-level Change Set when coordination is needed.

## Still open

- attach/detach repo rules
- default branch resolution
- branch naming
- whether draft PR is opened early or only at Review Unit boundary
- merge authority

---

# S3. Project Memory Contents — OPTION SET

## Question

How much Project Memory should exist eagerly?

## Option A — Fully scaffold every Job

Create all folders/files at Job creation.

Pros:
- predictable structure
- easy discovery

Cons:
- lots of empty noise
- premature artifact model
- harder evolution

## Option B — Minimal core + lazy artifacts

Create only:

~~~text
JOB.md
STATE.json
PROJECT.md
~~~

Everything else appears only when needed.

Pros:
- clean
- easy evolution
- less empty scaffolding

Cons:
- consumers must tolerate missing optional artifacts

## Option C — Hybrid scaffold

Create core files plus empty canonical directories.

Example:

~~~text
JOB.md
STATE.json
PROJECT.md
plans/
reviews/
decisions/
design/
~~~

Pros:
- predictable navigation
- less file clutter than A

Cons:
- still some empty structure

## Candidate

**Option C, leaning toward B if Drive APIs make empty folders cumbersome.**

Important theory:

- artifact existence should mean something
- missing optional artifact is valid
- Project Memory should contain durable truth, not chat transcript or scratch reasoning

---

# S4. Context Builder — OPTION SET

## Question

How much context does each role receive?

## Option A — Full Job preload

Load all Drive artifacts and all relevant repos.

Pros:
- low risk of missing context

Cons:
- expensive
- noisy
- weak scalability
- encourages irrelevant reasoning

## Option B — Strict role packet

Each role gets a fixed predefined packet.

Pros:
- deterministic
- compact

Cons:
- brittle
- unusual Jobs may need more context

## Option C — Layered adaptive context

Start with:

~~~text
JOB.md
STATE
current request
relevant accepted parent artifacts
~~~

Then resolve:

~~~text
relevant repo(s)
→ relevant path(s)
→ dependencies
→ expand only when needed
~~~

Pros:
- scalable
- preserves Drive-first
- role-aware
- supports Reviewer broader context without loading everything

Cons:
- requires a relevance resolver
- can miss context if resolver is weak

## Candidate

**Option C.**

Principle:

> Minimum sufficient context, with controlled expansion.

Reviewer gets broader context than Coder Self-QA, but not the whole Job by default.

---

# S5. Orchestrator — OPTION SET

## Question

Who controls workflow transitions and prevents stages from being skipped?

## Option A — Roles self-route

Planner/Coder/Reviewer decide what happens next.

Pros:
- simple prompts
- low machinery

Cons:
- weak enforcement
- easy state divergence
- roles may skip required gates

## Option B — Central Orchestrator state machine

Roles emit structured results.

Orchestrator owns:

- state
- routing
- stop/unlock conditions
- dependency gates
- durable transition recording

Pros:
- strongest consistency
- easier resume
- easier HARD enforcement later

Cons:
- more orchestration complexity

## Option C — Hybrid

Normal progression can be suggested by roles, but Orchestrator validates every transition.

Pros:
- flexible
- centralized truth

Cons:
- still needs central state machine

## Candidate

**Option C implemented on top of B's authority model.**

Roles may recommend next action; only Orchestrator commits workflow state.

---

# S6. Planner — OPTION SET

## Question

What exactly does Planner own?

## Option A — Planner owns only initial Project Plan

Coder or Orchestrator later assigns work.

Pros:
- narrow Planner role

Cons:
- loses user idea that work allocation should happen after Detailed Execution Plan
- assignment logic becomes fragmented

## Option B — Planner owns both Project Plan and later Work Allocation

Sequence:

~~~text
Planner Project Plan
↔ Reviewer
→ Coder Detailed Execution Plan
↔ Reviewer
→ back to Planner
→ Work Allocation + Review Topology
↔ Reviewer/Human
~~~

Pros:
- matches real project management
- Planner sees both intent and implementation reality
- coherent assignment/review topology

Cons:
- Planner is a two-stage role
- requires re-entry later

## Option C — Separate Project Manager role

Planner creates intent; PM assigns work.

Pros:
- real-world specialization

Cons:
- new role
- likely unnecessary complexity

## Candidate

**Option B.**

No new PM role unless later evidence justifies it.

---

# S7. Designer — OPTION SET

## Question

When is Designer used and reviewed?

## Option A — Mandatory Designer for every UI change

Pros:
- consistent visual thinking

Cons:
- heavy
- wasteful for tiny fixes

## Option B — Conditional specialist

Planner marks design need based on product/design risk.

Designer creates artifact only when useful.

Its output becomes a Review Unit only when topology says review value justifies it.

Pros:
- adaptive
- supports both tiny and major UI work
- compatible with current review theory

Cons:
- requires good classification

## Option C — Designer embedded in UI Coder

Pros:
- low handoff cost

Cons:
- weak separation between design intent and implementation
- Coder may invent visuals

## Candidate

**Option B.**

Designer remains a distinct specialist concept, but not a mandatory stage for every user-facing edit.

---

# S8. UX Coder — OPTION SET

## Question

Is UX Coder always a separate agent?

## Option A — Always separate role instance

Pros:
- strong behavioral specialization

Cons:
- too heavy for many tasks
- extra handoffs

## Option B — Coder specialization/mode

Coder invokes UX skill/harness when assigned UX-heavy work.

Pros:
- flexible
- low overhead

Cons:
- weaker separation

## Option C — Work Topology decides

UX can be:

- separate Work Package/agent
- specialization within one Coder
- joint UX/UI package

depending on risk and dependency.

## Candidate

**Option C.**

The theory defines UX ownership clearly, while Work Allocation chooses the runtime shape.

---

# S9. UI Coder — OPTION SET

Same structural choice as UX.

## Option A — always separate
## Option B — skill/mode inside Coder
## Option C — Work Topology decides

## Candidate

**Option C.**

UI responsibility remains distinct even when the same model instance performs it.

Important:

- visual implementation should not silently redesign product intent
- approved concept/design constraints remain upstream truth
- visual QC may require broader Reviewer judgement

---

# S10. QA — OPTION SET

## Question

How should QA be structured?

## Option A — One universal QA checklist

Pros:
- simple

Cons:
- either too vague or enormous
- ignores role/scope differences

## Option B — Layered QA

~~~text
Coder Self-QA
Reviewer QA
Integration/Final QA
~~~

Each layer has a different context.

Pros:
- matches current theory
- avoids duplicated effort
- supports escalation

Cons:
- needs clear ownership

## Option C — Stack-specific QA only

Pros:
- technically relevant

Cons:
- misses plan/scope/system QA

## Candidate

**Option B + stack-specific overlays.**

Core QA semantics stay stable; stack rules extend local checks.

---

# S11. QC — OPTION SET

## Option A — One acceptance checklist

Pros:
- simple

Cons:
- local and global quality get mixed

## Option B — Layered QC

~~~text
Coder Self-QC
Reviewer QC
Integration/Final QC
~~~

Pros:
- local goal and broader product quality are separated
- supports cases where code works but product feels patched together

## Option C — Reviewer-only QC

Pros:
- strong independence

Cons:
- wastes Reviewer time on obvious local defects

## Candidate

**Option B.**

Coder proves local result; Reviewer judges contextual product/system quality.

---

# S12. Verification & Evidence — OPTION SET

## Question

What proof is required?

## Option A — fixed universal evidence list

Pros:
- deterministic

Cons:
- impossible across all stacks
- overkill for some work, insufficient for others

## Option B — risk-tier evidence

Evidence requirements depend on work class.

Pros:
- practical

Cons:
- work tiers may become crude

## Option C — Evidence Contract per Review Unit

Each Review Unit declares:

- what claim must be proven
- required objective evidence where available
- allowed judgement evidence
- commit/artifact version
- freshness rule
- limitations

Pros:
- precise
- aligns evidence to review meaning

Cons:
- more planning metadata

## Candidate

**Option C with a small universal baseline.**

Baseline:

- exact artifact/commit identity
- checks performed
- result
- limitations
- freshness

Objective evidence is primary where applicable; judgement is explicit where mechanical proof is impossible.

---

# S13. Reviewer — OPTION SET

## Option A — Review every Task

Pros:
- tight control

Cons:
- high friction
- ignores semantic work size

## Option B — Planned Review Units

Review topology defines meaningful checkpoints after Detailed Execution Plan.

Pros:
- matches user concept
- balances review cost/value

Cons:
- topology must be planned well

## Option C — Only final review

Pros:
- low friction

Cons:
- defects propagate too far

## Candidate

**Option B + dynamic ad-hoc checkpoints.**

Reviewer is one role with modes:

- Project Plan Review
- specialist review when needed
- Detailed Execution Plan Review
- Work Topology Review
- code/product Review Unit review
- Integration Review
- Final Review

Reviewer returns findings to maker; it does not repair maker artifacts.

---

# S14. Capability & Executor Resolution — OPTION SET

## Option A — static registry

Declare capabilities once.

Pros:
- simple

Cons:
- stale quickly
- platform connections change

## Option B — probe everything every time

Pros:
- fresh

Cons:
- expensive
- noisy

## Option C — declared capability + freshness + verification on demand

Capability record contains:

- capability
- executor
- last verified
- confidence
- scope
- limitations

Unknown is unavailable.

Critical/stale capability is reverified before use.

## Candidate

**Option C.**

Never infer:

~~~text
GitHub write → shell
repo access → browser
plugin installed → runtime verification
~~~

---

# S15. Multi-Repo Coordination — OPTION SET

## Option A — repo-centric

Each repo has an independent plan/PR.

Pros:
- simple

Cons:
- weak project coherence

## Option B — master linear plan

One Master Plan lists repo order.

Pros:
- easy to read

Cons:
- weak for parallel/fan-in work

## Option C — project Work Topology graph

Nodes may be repo-specific or cross-repo Review Units.

Edges represent dependencies/unlock conditions.

Pros:
- supports parallelism
- supports integration review
- matches current work-topology theory

Cons:
- more sophisticated

## Candidate

**Option C**, with human-readable Master Plan generated from the graph.

Repo is a location, not necessarily a Review Unit.

---

# S16. Governance & Artifact Lifecycle — OPTION SET

## Option A — blanket downstream invalidation

Any upstream change invalidates all descendants.

Pros:
- safe
- simple

Cons:
- expensive
- destroys useful accepted work

## Option B — manual revalidation

Human/Reviewer decides case-by-case.

Pros:
- flexible

Cons:
- inconsistent
- hard to automate

## Option C — impact-based invalidation graph

Artifacts record dependencies.

Upstream change computes affected descendants.

Unaffected branches stay valid.

Reviewer can confirm revalidation.

## Candidate

**Option C.**

Important distinction:

- artifact lifecycle status
- workflow state
- work-unit status

should not be collapsed into one enum.

---

# S17. Security & Trust — OPTION SET

## Option A — prompt-only role boundaries

Pros:
- easiest

Cons:
- SOFT only

## Option B — central Orchestrator permission gate

All writes go through an authorization layer.

Pros:
- can become HARD
- clear audit point

Cons:
- implementation complexity

## Option C — separate credentials/permissions per role where platform supports it

Pros:
- strongest isolation

Cons:
- platform-dependent
- operational overhead

## Candidate

**Layered B + C where possible, A only as fallback.**

Every rule is tagged HARD / SOFT / UNKNOWN.

Repository/readme/tool output remains data, never permission authority.

---

# S18. Commands / User UX — OPTION SET

Frozen:

~~~text
@gsa
gsa/
~~~

## Option A — rich CLI command surface

Many deterministic commands.

Pros:
- explicit
- scriptable

Cons:
- harder to learn
- duplicates natural language

## Option B — minimal commands + natural language

Commands only for durable control:

Candidate family:

~~~text
gsa/job list
gsa/job create
gsa/job open
gsa/job update
gsa/job archive

gsa/status
gsa/continue
gsa/review
~~~

Planning/coding instructions can remain natural language.

Pros:
- concise
- user-friendly

## Option C — natural language only

Pros:
- easiest UX

Cons:
- ambiguous lifecycle control

## Candidate

**Option B.**

Exact verb set remains open.

---

# S19. Failure & Recovery — OPTION SET

## Option A — restart current stage

Simple failure resets stage.

Pros:
- simple

Cons:
- loses valid work

## Option B — checkpoint/resume

Persist last accepted artifact and work state.

Resume from last safe checkpoint.

Pros:
- robust

Cons:
- requires good state tracking

## Option C — branch-local recovery

Combine checkpointing with impact graph:

- preserve unaffected branches
- reopen only affected units

Pros:
- best for large/multi-repo work

Cons:
- more logic

## Candidate

**Option C built on B.**

Recovery should be proportional to impact.

---

# S20. Completion Model — OPTION SET

## Option A — maker marks done

Pros:
- simple

Cons:
- weak governance

## Option B — hierarchical completion propagation

~~~text
Task
→ Work Package
→ Review Unit approval
→ Phase/Change Set
→ Integration/Final Review
→ Job complete
~~~

Pros:
- matches current theory
- supports loops and dependencies

## Option C — always require Human final approval

Pros:
- strongest human control

Cons:
- unnecessary for routine work

## Candidate

**Option B with conditional Human approval.**

Important semantics:

~~~text
IMPLEMENTED ≠ READY_FOR_REVIEW
READY_FOR_REVIEW ≠ APPROVED
APPROVED child ≠ parent complete
~~~

---

# S21. Schemas — OPTION SET

## Option A — JSON everywhere

Pros:
- machine-friendly

Cons:
- poor human editing
- awkward plans/architecture

## Option B — Markdown everywhere

Pros:
- readable

Cons:
- weak state validation

## Option C — hybrid

~~~text
Markdown + YAML front matter
→ plans, reviews, decisions, Job entry docs

JSON
→ strongly structured runtime/state/graphs/capabilities/evidence where useful
~~~

## Candidate

**Option C.**

Schema strictness should focus on fields required for orchestration, not over-structure narrative reasoning.

---

# S22. Implementation Architecture — OPTION SET

## Option A — one giant system prompt/plugin file

Pros:
- fast prototype

Cons:
- hard to maintain
- role leakage
- weak testability

## Option B — modular harness package

~~~text
orchestrator
roles/
rules/
skills/
schemas/
templates/
evals/
adapters/
~~~

Pros:
- separable contracts
- testable
- versionable

## Option C — full distributed service architecture immediately

Pros:
- strongest isolation potential

Cons:
- premature complexity

## Candidate

**Option B first.**

Architecture can later introduce stronger runtime isolation without rewriting conceptual contracts.

---

# S23. Harness Quality Loop — OPTION SET

## Option A — fixed rulebook

Define once and rarely change.

Pros:
- predictable

Cons:
- blind to real failure modes

## Option B — purely reactive

Only add rules after failures.

Pros:
- lean

Cons:
- known high-risk failures may be preventable

## Option C — hybrid evidence-driven tightening

Start with justified invariants and known risks.

Then:

~~~text
real Job
→ inspect artifacts/product
→ observable defect
→ classify owner
→ implementation vs enforcement vs eval vs theory gap
→ smallest justified fix
→ add eval
→ rerun
~~~

## Candidate

**Option C.**

A real run can improve implementation or expose theory gaps, but testing does not replace conceptual definition.

---

# Cross-cutting Option A — Work Classification

The skeleton currently needs a work-classification concept, but exact tiers are not frozen.

## Option A1 — fixed T0/T1/T2 tiers

Pros:
- simple gate matrix

Cons:
- coarse
- risk may not correlate with size

## Option A2 — multidimensional risk profile

Dimensions:

- scope
- number of repos
- contract impact
- user-facing impact
- reversibility
- data risk
- verification difficulty
- dependency depth

Pros:
- accurate

Cons:
- more complex

## Option A3 — hybrid

Use multidimensional assessment internally, then map to a small operational class.

Example:

~~~text
LOW
STANDARD
HIGH
~~~

## Candidate

**A3.**

Operational classes stay simple; classification reasoning remains richer.

---

# Cross-cutting Option B — Review Granularity

## Option B1 — automatic threshold rules

Size/lines/files trigger review.

Rejected candidate because semantic meaning is lost.

## Option B2 — Planner chooses Review Units alone

Simple, but weak challenge.

## Option B3 — Planner proposes, Reviewer challenges, Human calibrates when useful

Matches current discussion.

## Candidate

**B3.**

---

# Cross-cutting Option C — Human Involvement

## Option C1 — Human at every gate

High control, high friction.

## Option C2 — Human only on explicit user request

Low friction, but product choices can be fabricated.

## Option C3 — Human on authority decisions

Human is required when:

- product intent is genuinely unresolved
- subjective preference materially changes outcome
- scope/risk acceptance changes
- destructive action needs approval
- Reviewer/Planner cannot resolve a policy choice
- user pinned an approval point

## Candidate

**C3.**

---

# Cross-cutting Option D — Reviewer Independence

## Option D1 — same context as Coder

Pros:
- easy

Cons:
- anchoring on Coder reasoning

## Option D2 — clean Reviewer context

Reviewer gets plan, artifacts, diff, evidence, but not Coder private reasoning.

Pros:
- more independent

Cons:
- requires context packaging

## Option D3 — dual pass

First independent review; second pass may inspect Coder explanation for disputed findings.

## Candidate

**D3** for important reviews, **D2** as baseline.

---

# Cross-cutting Option E — Final Job Review

## Option E1 — no final review if all units passed

Pros:
- low overhead

Cons:
- local passes may not compose globally

## Option E2 — always final review

Pros:
- catches integration coherence issues

Cons:
- unnecessary for trivial Jobs

## Option E3 — final review required when the Job has more than one meaningful Review Unit, parallel branches, integration surface, or user-facing coherence risk

## Candidate

**E3**, with Human/Reviewer able to force a final review.

---

# Cross-cutting Option F — Designer Position

## Option F1 — before Detailed Execution Plan

Best when visual concept determines implementation topology.

## Option F2 — after Detailed Execution Plan

Best when code constraints must shape feasible design.

## Option F3 — iterative Designer ↔ Coder planning loop

Designer establishes concept; Coder exposes feasibility; Designer adjusts only if needed; then Detail Plan locks.

Pros:
- highest realism for complex UI

Cons:
- extra loop

## Candidate

**F3 for substantial UI, F1 for ordinary design work, skip Designer for trivial visual edits.**

This suggests Designer placement itself may be topology-dependent rather than globally fixed.

---

# Current Coverage Map

| Skeleton | Theory drafted here? | Separate deep note? |
| --- | --- | --- |
| S0 Product boundary | fixed reference | yes, frozen docs |
| S1 Job/Drive | fixed reference | yes, frozen docs |
| S2 GitHub environment | yes | partial existing docs |
| S3 Project Memory | yes | existing Project Memory doc |
| S4 Context Builder | yes | existing Project Memory doc |
| S5 Orchestrator | yes | workflow note |
| S6 Planner | yes | workflow note |
| S7 Designer | yes | Designer doc + workflow note |
| S8 UX Coder | yes | existing UI/UX docs |
| S9 UI Coder | yes | existing UI/UX docs |
| S10 QA | yes | deep workflow/QA note |
| S11 QC | yes | deep workflow/QA note |
| S12 Evidence | yes | partial governance docs |
| S13 Reviewer | yes | deep workflow/review note |
| S14 Capability | yes | partial existing docs |
| S15 Multi-repo | yes | deep note + architecture |
| S16 Governance | yes | governance doc |
| S17 Security | yes | security doc |
| S18 Commands | yes | partial current docs |
| S19 Failure/Recovery | yes | new option set |
| S20 Completion | yes | deep workflow note |
| S21 Schemas | yes | option set |
| S22 Implementation architecture | yes | option set |
| S23 Harness Quality Loop | yes | implementation plan + option set |

---

# Debate Protocol Suggestion

For each section, Claude should respond in this shape:

~~~text
SECTION:
Preferred option:
Reject:
Missing option:
Reason:
Failure mode:
Suggested modification:
Would this affect Frozen Foundation? yes/no
~~~

After debate, the human can choose:

~~~text
ACCEPT candidate
ACCEPT modified option
CHOOSE alternate option
KEEP OPEN
~~~

No canonical document should change until those decisions are explicitly approved.
