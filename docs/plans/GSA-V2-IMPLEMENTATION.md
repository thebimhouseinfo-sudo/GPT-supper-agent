# GSA V2 — Coding Super Agent Implementation Plan

## Status

```text
PURPOSE = V2 implementation plan
SCOPE = coding-agent quality / Super-Agent evolution
AUTHORITY = PROPOSED / REVIEW REQUIRED
BASELINE = current Phase-2 runtime
CURRENT_SOURCE_OF_TRUTH = docs/plans/PHASE2-IMPLEMENTATION.md
```

This plan does not replace the current Phase-2 implementation authority until it is reviewed and explicitly promoted.

## 1. Objective

Turn the current working GSA into a high-quality sequential coding-agent system that can organize complex work, control context, self-review before Human handoff, and handle brownfield/multi-repo relationships correctly.

Out of scope for this phase:
- parallel agents;
- agent swarm;
- IDE plugins;
- multi-provider/API abstraction;
- local background daemons;
- filesystem watchers;
- autonomous background work.

GSA remains a sequential orchestration system running through ChatGPT Web/plugin infrastructure.

---

## 2. Preserve before extend

Keep and improve the mechanisms that already work:

- Project → Job → Task → Run;
- L0 structure scan → L1 selective read;
- Job DRAFT → planning review → repair → READY;
- Coder diff inspection;
- Goal Recheck;
- Reviewer read-only behavior;
- Tester evidence;
- durable Handoff;
- CR Human-only.

Do not introduce a second workflow hierarchy that duplicates these mechanisms.

---

## 3. Two parallel improvement tracks

### Track A — External Benchmark → Migration

Study strong coding agents for mechanisms that improve:
- context selection;
- repository understanding;
- planning/decomposition;
- edit-test-repair loops;
- self-review;
- code review;
- recovery;
- evidence;
- completion discipline;
- tool/interface design.

Classify each mechanism as:

```text
DIRECT_MIGRATION
PARTIAL_EMULATION
INFRA_LIMITATION
OUT_OF_SCOPE
```

Do not copy local runtime triggers literally.

Translate the invariant protected by a local trigger into:

```text
Trigger
→ Required action
→ Evidence
→ Exit condition
```

inside the appropriate GSA harness/skill when feasible.

### Track B — Real Project Pilot → GSA-specific Gap Discovery

Continue real work on:
- CadGPT;
- Kid eSchool;
- cleanup/refactor work;
- other real coding Jobs.

Pilot findings are used to:
- validate migrated external mechanisms;
- discover GSA-specific gaps not already covered.

Do not invent a GSA-specific mechanism when a selected external migration already solves the same problem adequately.

---

## 4. Phase 0 — Current Runtime Baseline

### Goal

Map every V2 requirement onto the real implementation before changing behavior.

Current runtime implementation is primarily in:

```text
supabase/functions/gsa-mcp/index.ts
skills/gsa-job-runtime/SKILL.md
docs/plans/PHASE2-IMPLEMENTATION.md
evals/*
```

The planned `harness/roles/*` layout is not currently the real runtime surface and must not be treated as the implementation target unless later extraction is justified.

### Work

Audit:
- `BASE_AGENT_HARNESS`;
- `ROLE_HARNESSES`;
- `RUNTIME_SKILLS`;
- `job_prepare`;
- `job_revise_plan`;
- `plan_review_record`;
- `run_begin`;
- `goal_recheck_record`;
- `run_complete`;
- Project repository registry handling;
- current Job serialization.

Produce a matrix:

```text
V2 requirement
→ already covered
→ partially covered
→ missing
→ current owning layer
→ intended migration
```

### Gate

No new behavior is implemented before its current owning layer is identified.

---

## 5. Phase 1 — Planner: Adaptive Work Decomposition

Current Planner already performs:

```text
L0
→ L1
→ Frame
→ Tasks
→ dependencies
→ gates
→ planning review
```

V2 extends planning top-down:

```text
Objective
→ Phase
→ Task
→ Job Pack
→ Milestone
```

### No new persistent entities initially

For the first implementation:
- Phase = planning concept;
- Job Pack = Planner grouping decision;
- Milestone = validated progress grouping.

Represent these with existing Jobs, Tasks, dependencies, knowledge and verification where possible.

Only create new schema/entity types if real pilots prove the existing representation is insufficient.

### Adaptive sizing

#### Small
One Job is enough:

```text
Plan
→ Execute
→ Self-review
→ Verify
→ Final
```

#### Medium
Several Tasks may stay inside one Job if they share one causal chain and manageable context.

#### Large
Multiple causal chains, subsystems, review domains or repository scopes should be split into multiple meaningful Jobs.

### Job Pack invariant

A good Job Pack has:

```text
one meaningful objective
one bounded causal chain
manageable context
clear completion
clear verification
```

Core invariant:

> **Job boundary = context boundary.**

Do not size Jobs by file count.

Do not automatically use one repo = one Job.

Do not keep a Job open merely because all discovered work is related somehow.

### Too-large signals

- multiple unrelated outcomes;
- unrelated causal chains;
- review needs substantially different perspectives;
- large cross-repo context must remain continuously loaded;
- completion cannot be stated clearly;
- execution/review starts drifting from the original objective.

### Too-small signals

- only a mechanical sub-step;
- no meaningful independent outcome;
- cannot be finalized without another Job;
- splitting adds ceremony without reducing context, risk or ambiguity.

### Planning Review extension

Planning Reviewer challenges:
- mega-Job scope;
- micro-Job fragmentation;
- wrong phase boundaries;
- unrelated Tasks grouped together;
- non-meaningful completion;
- likely context decay before Job completion.

---

## 6. Phase 2 — Progressive Context V2

Keep the existing L0/L1 behavior and extend it conceptually:

```text
L0 — Orientation
L1 — Planning / decision context
L2 — Execution context
L3 — Investigation context
```

### L0 — Orientation

Read:
- repository tree;
- filenames;
- package/build/config;
- tests;
- CI/deploy;
- README;
- architecture;
- specs;
- plans;
- ADRs;
- Project Memory;
- known relationship memory.

Do not read the entire repository.

### L1 — Planning / decision context

Selectively read:
- canonical contracts;
- architecture entry points;
- important implementation paths;
- relevant existing plans.

Goal: enough evidence to decide topology and Job decomposition.

### L2 — Execution context

Load only what the active Job/Task needs:
- exact files;
- callers;
- consumers;
- tests;
- relevant contracts.

### L3 — Investigation context

Expand only when evidence requires it:
- failing tests;
- unexpected behavior;
- Reviewer findings;
- hidden dependencies;
- cross-repo impact;
- stale assumptions.

Core principle:

> **Minimum sufficient context, progressively expanded by evidence.**

The optimization target is not minimum token usage.

The target is:

> **best practical result without unnecessary execution time.**

---

## 7. Phase 3 — Brownfield Relationship + Logic Review

Do not assume existing brownfield code is correct merely because it exists.

Before extending important existing behavior:

```text
Structure mapping
→ Relationship mapping
→ Relevant logic review
→ Authority / precedence decision
→ Implementation decision
```

Core invariant:

> **Brownfield source is evidence, not automatically authority.**

For relevant existing behavior determine where possible:

```text
CANONICAL
LEGACY
ACCIDENTAL
INCORRECT
UNKNOWN
```

Planning and review must inspect enough current logic to identify:
- incorrect logic;
- stale assumptions;
- workaround behavior;
- duplicate responsibility;
- wrong contract direction;
- dead/legacy paths.

---

## 8. Phase 4 — Relative Work / Repo Relationship Memory

Do not create a new database or record family initially.

Use existing durable KNOWLEDGE memory for a Relationship Map.

Minimum relationship payload:

```text
source
target
relationship
precedence / direction
reason
evidence
reread condition
```

Example:

```text
A affects B

authority:
A > B

reason:
A owns learner-profile contract

when editing A:
read B for impact

when editing B:
re-read current A and conform B to A
```

### Cross-repo behavior

Distinguish:

```text
READ
REVIEW
WRITE
```

#### READ
Allowed whenever needed to understand impact.

#### REVIEW
Required when a contract/integration may be affected.

#### WRITE
Only when the active Job scope actually includes that source change.

### Precedence rule

If:

```text
A > B
```

when editing A:
- read B enough to understand impact;
- do not distort A merely to preserve obsolete downstream B behavior.

When editing B later:
- re-read current A;
- migrate B according to current A.

The relationship is durable knowledge so later work does not need to rediscover it from scratch.

---

## 9. Phase 5 — Coder Closure / Self-review V2

Keep the current Coder loop:

```text
OBSERVE
ACT
INSPECT
VERIFY
GOAL RECHECK
ADAPT
```

Strengthen its completion semantics.

Before success:

```text
re-read original Job objective
→ re-read active Task criteria
→ inspect actual diff
→ inspect affected relationships
→ identify ordinary findings
→ repair within-scope findings
→ verify again
→ Goal Recheck
→ handoff
```

### Finding routing

#### Within scope
Coder fixes it autonomously.

#### Material scope / contract change
Route to Planner or applicable Human Gate.

#### Related downstream work
Record relationship/follow-up.

Do not drift into another Job merely because the relationship was discovered.

### Completion guard

`run_complete(success)` must not rely only on:

```text
build PASS
tests PASS
```

Success requires evidence that:
- Goal Recheck exists;
- actual diff was inspected;
- current objective has no unresolved NOT_MET criterion;
- unresolved scope drift does not remain.

Do not add a new SELF_REVIEW state unless pilots prove it is needed.

Prefer strengthening the existing completion contract.

---

## 10. Phase 6 — Review V2

Review itself may be small or large.

### Small review

One bounded pass is sufficient.

### Large review

Use:

```text
review map
→ bounded review sections
→ findings per section
→ consolidation
→ verdict
```

Possible sections include:
- architecture;
- dependencies/relationships;
- implementation logic;
- tests;
- runtime/integration.

These are not mandatory fixed sections. Reviewer chooses the minimum useful decomposition.

### Planning Review

Add explicit review of:
- decomposition;
- Job sizing;
- context burden;
- relationship awareness;
- precedence;
- acceptance boundary.

### Code Review ordering

Prefer:

```text
requirements
→ contract
→ actual diff
→ relationship impact
→ relevant surrounding logic
→ evidence
```

Do not review only from Coder narrative.

### CR

No semantic change:

```text
Human invokes CR
→ CR runs independently
```

GSA may suggest CR after a meaningful checkpoint/final handoff, but must never call CR automatically.

---

## 11. Phase 7 — Lifecycle Obligations / Anti-drift

Translate useful local-agent hooks into lifecycle obligations rather than generic reminders.

Every promoted obligation should be representable as:

```text
TRIGGER
ACTION
EVIDENCE
EXIT
```

Example:

```text
TRIGGER
meaningful implementation boundary reached

ACTION
inspect diff + relevant verification + goal comparison

EVIDENCE
diff evidence + verification + Goal Recheck

EXIT
no unresolved within-scope finding
```

Placement rule:
- universal invariants → `BASE_AGENT_HARNESS`;
- role-specific behavior → `ROLE_HARNESSES`;
- task methodology → `RUNTIME_SKILLS`.

Avoid expanding the base prompt with long generic reminders.

---

## 12. Phase 8 — External Migration Queue

Benchmark by capability, not by product feature list.

### Pack A — Context & repository understanding
Research:
- repo maps;
- selective context;
- read-only related context;
- symbol/dependency selection.

Output for each mechanism:

```text
mechanism
benefit
infra dependency
GSA equivalent
migration decision
```

### Pack B — Coding execution
Research:
- edit-test-repair;
- diagnosis after failure;
- scope control;
- recovery;
- completion discipline.

### Pack C — Review & verification
Research:
- self-review;
- code-review organization;
- proof/evidence;
- learned review rules.

### Pack D — Agent interface
Research:
- tool ergonomics;
- bounded output;
- context interfaces;
- failure feedback.

Do not spend research effort on:
- IDE marketplaces;
- provider API configuration;
- parallel workers;
- swarm architectures;
- cloud coding workspaces;

unless a contained mechanism can be migrated independently.

---

## 13. Phase 9 — Evals

Add four focused evals first.

### E21 — Adaptive Job Decomposition

Scenario: one objective with multiple causal chains.

PASS when Planner:
- creates sensible phases/tasks;
- forms meaningful Job boundaries;
- avoids mega-Jobs;
- avoids micro-Jobs;
- produces clear milestone topology.

### E22 — Brownfield Relationship / Precedence

Scenario: repo A and B are related and A owns the source-of-truth contract.

PASS when:
- structure of both repos is inspected at an appropriate level;
- current logic is reviewed before extension;
- A > B is established from evidence;
- B is not modified outside scope;
- durable relationship knowledge is recorded;
- later B work re-reads A.

### E23 — Self-review Closure

Scenario: initial implementation passes tests but still misses a requirement or contains an ordinary logic defect.

PASS when Coder:
- detects the problem before Human handoff;
- fixes it;
- re-verifies;
- records successful Goal Recheck only after repair.

### E24 — Large Review Drift

Scenario: review scope is large enough that one unbounded pass is likely to drift.

PASS when Reviewer:
- decomposes review into useful bounded scopes;
- closes each review scope;
- consolidates findings;
- does not start source implementation;
- binds the verdict to the exact revision.

---

## 14. Phase 10 — Real Pilots

Do not use one mega-pilot for all V2 behavior.

### Pilot A — CadGPT

Primary coverage:
- Coder closure;
- CLI/runtime correctness;
- self-review;
- review segmentation;
- drift control.

### Pilot B — Kid eSchool

Primary coverage:
- multi-repo;
- Job decomposition;
- relationship/precedence;
- progressive context;
- later UI/UX planning improvements.

Each pilot should itself be a meaningful Job Pack.

---

## 15. Implementation order

```text
P0  baseline audit
↓
P1  Planner sizing + decomposition
↓
P2  progressive context + brownfield logic review
↓
P3  relationship / precedence memory
↓
P4  Coder self-review closure
↓
P5  Reviewer phased review
↓
P6  lifecycle obligation cleanup
↓
P7  evals
↓
P8  real pilots
↓
P9  calibration
```

Track A external benchmark runs in parallel from P0 onward.

A benchmark migration may enter the matching implementation phase as soon as it has enough evidence; the full benchmark program does not need to finish first.

---

## 16. File-level implementation targets

### Primary runtime target

```text
supabase/functions/gsa-mcp/index.ts
```

Likely improvement areas:
- `BASE_AGENT_HARNESS`;
- Planner `ROLE_HARNESSES`;
- Coder `ROLE_HARNESSES`;
- Reviewer `ROLE_HARNESSES`;
- Orchestrator completion/routing obligations;
- `job-planning`;
- `coding-loop`;
- `planning-review`;
- `review-evidence`;
- Job planning/runtime guards only where necessary.

### Secondary operational documentation

```text
skills/gsa-job-runtime/SKILL.md
```

Keep it synchronized with real runtime behavior.

### Current implementation authority

```text
docs/plans/PHASE2-IMPLEMENTATION.md
```

Do not modify its authority semantics until this V2 plan is reviewed and accepted.

### Research / working knowledge

```text
docs/research/*
docs/plans/GSA-V2-IMPROVEMENT-NOTES.md
```

### Evals

```text
evals/E21-...
evals/E22-...
evals/E23-...
evals/E24-...
```

---

## 17. Do not change initially

Do not create these merely because V2 uses the concepts:

```text
Phase record
JobPack record
Milestone database
Relationship database
new lifecycle state machine
```

First use:
- existing Job;
- embedded Tasks;
- dependencies;
- KNOWLEDGE;
- Verification;
- Handoff.

Promote to an architecture/schema change only if real evidence proves persistence is insufficient.

---

## 18. V2 checkpoints

Implement and validate incrementally.

```text
CP1 Planner / context
CP2 relationship / brownfield
CP3 Coder closure
CP4 Reviewer closure
CP5 end-to-end pilot
```

At each checkpoint:

```text
implement
→ self-review
→ eval
→ real pilot where applicable
→ close checkpoint
```

Preserve passing behavior.

Fix causal failures without redesigning unrelated passing areas.

---

## 19. MVP completion

V2 MVP passes when a complex brownfield coding objective can reliably:

```text
understand project
→ map structure / relationships
→ decompose meaningful work
→ create correctly sized Jobs
→ execute one Job at a time
→ progressively deepen context
→ review existing logic before extending it
→ implement
→ self-review / fix
→ verify actual goal
→ preserve cross-job / cross-repo relationships
→ final a meaningful Job
→ continue later work without carrying the entire old context
```

Human should primarily provide:

```text
material decisions
acceptance
optional CR
merge / release authority
```

Human should not routinely need to:
- re-scope the agent;
- catch ordinary implementation defects;
- remind Coder to review;
- pull long Runs back from context drift.

That is the acceptance target for the GSA V2 coding Super Agent MVP.
