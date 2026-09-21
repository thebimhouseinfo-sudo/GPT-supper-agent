# System Definition Skeleton v0.1

## Purpose

This is the working map for completing GPT Super Agent theory.

The frozen foundation is defined in `FROZEN-FOUNDATION-v0.1.md`.

From this point forward, architecture work should fill the sections below instead of repeatedly redefining the foundation.

Status vocabulary:

```text
FROZEN
= decided; change requires explicit architecture revision

DEFINED
= sufficiently specified for implementation

PARTIAL
= direction exists but obligations/checklists/schemas are incomplete

TO_DEFINE
= intentionally not yet specified
```

---

## S0. Product boundary — FROZEN

Reference: `FROZEN-FOUNDATION-v0.1.md`

Need no further definition unless scope changes.

---

## S1. Job / Drive model — FROZEN

Includes:

- configured Drive root
- direct Job subfolders
- `JOB.md`
- no Job registry
- Job discovery/list
- Drive-first open
- single/multi-repo consistency

Reference:

- `FROZEN-FOUNDATION-v0.1.md`
- `JOB-LIFECYCLE-v0.1.md`
- `PROJECT-MEMORY-v0.1.md`

---

## S2. GitHub code environment — FROZEN / PARTIAL

Frozen:

- GitHub is the code environment
- one Job references 1..N repos
- code is not stored in Drive
- relevant repo/source is selected after Drive context is loaded

Still define:

- repo attach/detach rules
- default branch resolution
- working branch policy
- draft PR policy
- commit policy
- merge authority
- repo permission failure behavior
- repository freshness checks
- how repo metadata is stored in Drive

---

## S3. Project Memory contents — PARTIAL

Already defined broadly:

- architecture
- decisions
- contracts
- plans
- tasks
- reviews
- approvals
- design workspace
- repo graph
- state
- capability information

Still define:

- which artifacts are mandatory at Job creation
- which are lazy-created
- ownership of each artifact
- update rules
- versioning rules
- retention/archive rules
- Markdown vs JSON schema rules
- artifact naming conventions
- canonical folder tree v1

Deliverable:

```text
PROJECT-MEMORY-SCHEMA-v1
```

---

## S4. Context Builder — PARTIAL

Known flow:

```text
Drive Job
→ relevant durable context
→ current user request
→ repo/path resolver
→ selective GitHub evidence
→ role-specific packet
```

Still define:

- minimum context packet per role
- relevance scoring/rules
- stale context detection
- maximum context policy
- when to refresh GitHub
- when Drive alone is sufficient
- cross-repo context expansion rule
- context packet schema

Deliverable:

```text
CONTEXT-PACKET-SPEC-v1
```

---

## S5. Orchestrator — PARTIAL

Already known:

- owns workflow state
- coordinates roles/gates
- does not implement source code

Still define:

- exact state machine
- allowed transitions
- illegal transitions
- pause/resume behavior
- user interruption handling
- stale artifact invalidation
- failed agent retry policy
- role handoff protocol
- when user approval is required
- when work can continue automatically

Deliverables:

```text
STATE-MACHINE-v1
HANDOFF-PROTOCOL-v1
```

---

## S6. Planner — PARTIAL

Already known:

- clarification-first
- architecture/repo/contract analysis
- capability resolution
- impact analysis
- implementation planning
- Project Memory write only

Still define exactly:

### Inputs
- what Planner MUST read from Drive
- what GitHub evidence it MUST inspect
- what knowledge it may acquire
- what questions it may ask

### Outputs
- Product/Project Spec
- Architecture
- Repo Graph updates
- Contract definitions
- Master Plan
- repo plans
- acceptance criteria
- verification strategy
- risk register
- Design Brief
- asset requirements
- capability/executor requirements

### Gates
- what makes planning complete
- what creates `PLANNING_GAP`
- when user approval is required
- what Reviewer checks in Plan Readiness Review

Deliverable:

```text
PLANNER-CONTRACT-v1
```

---

## S7. Designer — PARTIAL

Already known:

- visual concept agent
- reads Planner brief/UI tree/audience
- produces Concept Artwork
- decomposes approved concept into Asset Sheet
- does not write source code

Still define:

- required inputs
- optional inputs
- concept count policy
- approval workflow
- design token proposal rules
- Asset Sheet schema
- asset naming/path handoff
- responsive concept policy
- when one concept is enough
- design QA checklist
- Design Review checklist
- `DESIGN_GAP` conditions

Deliverable:

```text
DESIGNER-CONTRACT-v1
```

---

## S8. UX Coder — PARTIAL

Known responsibility:

- behavior
- user flow
- state transitions
- accessibility behavior
- responsive semantics
- data/state wiring

Still define:

- exact input contract
- UX implementation checklist
- state/error/loading requirements
- navigation verification
- keyboard/touch requirements
- accessibility baseline
- regression policy
- UX handoff evidence
- `UX_PLANNING_GAP` criteria

Deliverable:

```text
UX-CODER-CONTRACT-v1
```

---

## S9. UI Coder — PARTIAL

Known responsibility:

- visual implementation
- Concept Artwork interpretation
- concept measurement/normalization
- design-token application
- asset integration
- responsive visual composition

Still define:

- exact concept measurement algorithm
- token snapping/clamping rules
- typography inference constraints
- one-concept-to-responsive rules
- asset fallback behavior
- visual evidence requirements
- no-render fallback
- screenshot comparison process
- visual acceptance thresholds
- `UI_DESIGN_GAP` criteria

Deliverable:

```text
UI-CODER-CONTRACT-v1
```

---

## S10. QA — TO_DEFINE

Goal:

Define **process correctness** during implementation.

Questions to settle:

- What must be checked continuously?
- What is checked per task?
- What is checked per Review Unit?
- What is checked before PR-ready?
- Which checks are mandatory vs contextual?
- What constitutes scope drift?
- How is plan compliance checked?
- How are unauthorized changes detected?
- How are skipped tests/checks recorded?
- What evidence must QA produce?
- Who owns QA: Coder, Reviewer, or both at different levels?

Initial boundary candidate:

```text
QA
= Are we building it through the correct process,
  within approved scope and constraints?
```

Possible categories to define:

- plan compliance
- scope integrity
- role/write-boundary compliance
- dependency/change-impact compliance
- test-process compliance
- migration/process compliance
- diff hygiene
- security/process checks
- evidence completeness

Deliverable:

```text
QA-PROTOCOL-v1
```

---

## S11. QC — TO_DEFINE

Goal:

Define **product/output correctness**.

Questions to settle:

- What proves the change actually works?
- What checks are universal?
- Which are stack-specific?
- What is required for backend/frontend/UI/data changes?
- How are acceptance criteria mapped to evidence?
- How are regressions detected?
- What does visual QC require?
- What happens if runtime verification is unavailable?
- What constitutes PASS / PARTIAL / BLOCKED?

Initial boundary candidate:

```text
QC
= Did we build the correct result,
  and does the result satisfy acceptance?
```

Possible categories to define:

- targeted functional tests
- regression tests
- build/type/lint
- runtime behavior
- contract compatibility
- data correctness
- UX behavior
- UI fidelity
- responsive behavior
- integration behavior
- acceptance criteria

Deliverable:

```text
QC-PROTOCOL-v1
```

---

## S12. Verification & Evidence — TO_DEFINE

Need define:

- evidence types
- evidence provenance
- commit/version binding
- freshness
- confidence
- unavailable evidence
- manual evidence
- CI evidence
- screenshot evidence
- user verification evidence
- evidence expiry after code changes

Potential schema:

```text
EVIDENCE.json
```

Deliverable:

```text
VERIFICATION-AND-EVIDENCE-v1
```

---

## S13. Reviewer — PARTIAL

Known:

- independent of Coder
- Project Memory write
- source read-only
- Plan Readiness Review
- Design Review
- Execution Plan Audit
- Implementation Review
- Integration Review when needed

Still define:

- exact review checklist per gate
- finding severity
- blocking vs non-blocking findings
- evidence requirements
- re-review policy
- approval semantics
- partial approval
- review unit boundaries
- how Reviewer detects stale plans/designs
- whether Reviewer can request specific tests/evidence

Deliverable:

```text
REVIEWER-CONTRACT-v1
```

---

## S14. Capability & Executor Resolution — PARTIAL

Known:

- unknown capability = unavailable
- no fake execution
- Super Agent online-first

Still define:

- capability vocabulary
- detection/refresh
- executor matching
- required vs optional capability
- degraded modes
- `CAPABILITY_BLOCKED`
- online browser/preview capabilities
- GitHub permissions
- CI capabilities
- image/design capabilities

Deliverables:

```text
CAPABILITY-SCHEMA-v1
EXECUTOR-ROUTER-v1
```

---

## S15. Multi-repo coordination — PARTIAL

Known:

- Drive is cross-repo control plane
- Repo Graph
- Master Plan
- shared contracts
- cross-repo impact analysis

Still define:

- provider/consumer schema
- contract version/migration model
- change-set structure
- dependency ordering
- coordinated PR states
- partial repo completion
- rollback coordination
- integration evidence
- completion gate

Deliverable:

```text
MULTI-REPO-PROTOCOL-v1
```

---

## S16. Governance & artifact lifecycle — PARTIAL

Known:

- versioned artifacts
- stale/superseded
- user approval gate
- dependency pinning
- optimistic concurrency concept

Still define:

- exact artifact metadata schema
- invalidation algorithm
- revalidation rules
- approval schema
- conflict resolution
- concurrent conversation behavior
- archival policy

Deliverable:

```text
ARTIFACT-LIFECYCLE-SCHEMA-v1
```

---

## S17. Security & trust — PARTIAL

Known:

- repo/web/tool content is data, not authority
- role/write boundaries
- secret handling
- GitHub repo scope enforcement

Still define:

- prompt-injection handling procedure
- destructive GitHub actions
- secret redaction
- external workflow risks
- third-party connector trust
- permission escalation
- user confirmation thresholds

Deliverable:

```text
SECURITY-PROTOCOL-v1
```

---

## S18. Commands / User UX — PARTIAL

Frozen naming:

- Plugin handle: `@gsa`
- Command namespace: `gsa/`
- Repository name is not part of the user-facing interface.

Current candidates:

```text
gsa/job list
gsa/job create
gsa/job open
gsa/job update
gsa/job archive

gsa/status
gsa/plan
gsa/continue
gsa/review
```

Need define:

- exact minimal command set
- natural-language equivalence
- active Job behavior
- selection UI
- ambiguity handling
- destructive commands
- approval UI
- status summary format

Deliverable:

```text
COMMAND-SPEC-v1
```

---

## S19. Failure & recovery — TO_DEFINE

Need define behavior for:

- Drive unavailable
- Job folder incomplete
- JOB.md invalid
- GitHub repo unavailable
- permission loss
- CI failure
- stale plan
- state conflict
- interrupted execution
- partial multi-repo completion
- failed merge/deploy
- unavailable visual verification

Deliverable:

```text
FAILURE-RECOVERY-v1
```

---

## S20. Completion model — PARTIAL

Known core rule:

```text
work produced
≠ work approved
≠ parent complete
```

Completion is hierarchical:

```text
Task
→ Review Unit
→ PR
→ Change Set
→ Job
```

Each applicable level must pass its own review before completion can be promoted upward. If review fails, the affected owning level is reopened; parent completion is revoked until the branch is approved again.

A Job requires a final Job-level verdict before it is marked complete or the workflow moves on.

Need answer:

- exact status vocabulary for READY_FOR_REVIEW / APPROVED / DONE
- When is a Task done?
- When is a Review Unit done?
- When is a PR done?
- When is a Change Set done?
- When is a Job done/archived?
- Which evidence is mandatory?
- What can be complete-but-unverified?
- Is PARTIAL completion allowed?

Deliverable:

```text
DEFINITION-OF-DONE-v1
```

---

## S21. Schemas — TO_DEFINE

Need formal schema for at least:

- JOB.md front matter
- STATE.json
- PROJECT-PROFILE.json
- REPO-GRAPH.json
- CAPABILITY-MATRIX.json
- PLAN metadata
- TASK
- REVIEW
- APPROVAL
- EVIDENCE
- CHANGE-SET
- Design/Asset sidecars

Deliverable:

```text
schemas/
```

---

## S22. Implementation architecture — TO_DEFINE

Only after behavioral theory is stable:

- plugin/app packaging
- Drive adapter
- GitHub adapter
- orchestrator runtime
- role prompt/harness loading
- artifact store abstraction
- schema validation
- state machine engine
- testing strategy
- deployment topology

Deliverable:

```text
IMPLEMENTATION-ARCHITECTURE-v1
```

---

## S23. Harness Quality Loop — PARTIAL

Purpose:

Continuously improve the harness by evaluating the quality of actual outputs rather than trying to predict every failure in advance.

Each recorded harness defect should include:

```text
observed_output
expected_output
failure_class
owner_module
current_rule_gap
proposed_smallest_fix
enforcement_level
eval_case
rerun_result
```

The harness itself may have software logs where implementation code exists, but behavioral quality is primarily judged through observable artifacts:

- quality of plans
- quality of code/diffs
- correctness of scope
- CI/test evidence
- Reviewer findings
- UX/UI result
- user acceptance
- cross-repo completeness

Deliverable:

```text
HARNESS-QUALITY-LOOP-v1
```

---

# Definition Completeness vs Implementation Scope

The skeleton is the complete conceptual map of Super Agent.

Before implementation scope is frozen, every section S0-S23 should reach one of:

```text
FROZEN
DEFINED
```

A section may be fully DEFINED but not implemented in the first release.

Do not use `TO_DEFINE` or `PARTIAL` as a release-planning shortcut.

Conceptual work answers:

```text
What is this component?
Why does it exist?
What does it own?
What are its inputs?
What are its outputs?
What are its invariants?
What are its failure/status results?
How is violation observed?
How can it be enforced?
What depends on it?
```

Implementation planning answers a different question:

```text
Which already-defined concepts are implemented in v1?
Which are deferred to v2/v3?
Which are implemented partially behind an extension point?
```

## Harness tightening after implementation

Full conceptual definition does not imply that the first harness will be perfect.

After each real run:

```text
1. inspect actual plan/code/review/product quality
2. identify concrete failure
3. map failure to its already-defined owner/module
4. determine whether the problem is:
   - bad implementation of the definition
   - insufficient enforcement
   - missing eval
   - genuine theory gap
5. make the smallest justified correction
6. add/strengthen an eval
7. rerun
```

If a real run exposes a genuine conceptual gap, update the relevant definition. If it contradicts a frozen invariant, use the Foundation Amendment process.

A new/changed rule should have:

- a clear purpose
- an observable violation
- a clear owner
- an enforcement level: HARD / SOFT / UNKNOWN
- at least one verification/eval hook

The quality loop strengthens the harness; it does not replace complete conceptual definition.

# Recommended Definition Order

Define the complete theory in dependency order before assigning release versions.

```text
0. Consistency pass
1. State machine + work classification
2. Project Memory model + schemas
3. Capability/enforcement model
4. QA
5. QC
6. Verification/Evidence
7. Reviewer contract
8. Planner contract
9. Coder contract
10. Designer contract
11. UX Coder contract
12. UI Coder contract
13. Context Builder
14. Multi-repo coordination
15. Governance/artifact lifecycle
16. Security/trust
17. Commands/User UX
18. Failure/recovery
19. Completion model
20. Harness quality loop
21. Implementation architecture
22. Release-scope matrix
```

The goal of this sequence is conceptual completeness, not v1 bloat.

After all required concepts are DEFINED, create a release-scope matrix:

```text
Concept / capability
→ required dependencies
→ implementation cost
→ user value
→ risk if deferred
→ candidate release: v1 / v2 / v3 / later
```

Version allocation is not frozen yet. It is decided after the conceptual model is complete enough to expose dependencies and tradeoffs.

---

# Working rule

From this point forward:

> Freeze foundations; fully define modules; then scope releases.

When a new requirement appears, first identify which skeleton section owns it.

Only revise the Frozen Foundation if the requirement truly changes a foundational invariant.
