# GSA Online Tester Agent Upgrade Plan

Status: PROPOSED
Scope: GPT-supper-agent / GSA Online
Primary goal: upgrade Tester from a thin capability-gated verifier into a checkpoint-level independent verification and empirical-evidence agent, while preserving lightweight orchestration and keeping browser providers replaceable.

## 1. Decision summary

The GSA Local TESTER_AGENT_SPEC.md is the semantic reference for this upgrade, but the Online implementation must not copy Local filesystem assumptions.

The target Online Tester must:

1. verify whether the product actually satisfies the checkpoint goal;
2. independently plan practical tests from approved goal/spec/acceptance criteria;
3. support VERIFY, MEASURE, and PROBE;
4. produce both verification evidence and empirical/design evidence;
5. run only at meaningful Planner-declared Test Checkpoints, not after every coding task;
6. keep product source read-only;
7. route product failures back to Coder, then require Reviewer PASS before Tester RETEST;
8. bind all evidence to the exact target revision/state;
9. persist evidence that later Planner/Coder work may consume as an explicit dependency;
10. treat browser/tool presence as discovery only, never proof of usability.

TinyFish is an OPTIONAL browser provider. It is not a required dependency and must not be built into the Tester contract.

The existing GSA browser tools browser_ui_inspect and browser_test_flow are also not assumed usable merely because they are exposed. Their actual capability must first be established by explicit runtime PROBE checkpoints.

## 2. Why this is an architecture change, not a Tester-prompt change

Current Online GSA already contains several correct foundations:

- Tester source is read-only.
- Browser capability uses SURFACE_PRESENT vs OBSERVED.
- Planner is expected to place review/test/human gates.
- Verification records are durable.
- Run/Handoff records are append-preserving.
- Review and Retest concepts already exist.
- Job completion already requires durable evidence.
- Browser tools already exist in the GSA MCP surface.

However, the current implementation is substantially narrower than the intended Tester role.

Today the Tester harness mainly does:

~~~text
GROUND
→ CAPABILITY
→ EXECUTE
→ INTERPRET
→ RECORD
→ ROUTE
~~~

It does not yet model:

~~~text
GROUND
→ PLAN
→ CAPABILITY
→ AUTHOR
→ EXECUTE
→ ANALYZE
→ ADAPT
→ REPORT
→ RETEST
~~~

More importantly, the current Job topology does not persist a real Test Checkpoint contract. job_prepare receives phase, milestone, tasks, verification requirements and review triggers, but currently creates a mostly linear topology from the task list:

~~~text
task 1 → task 2 → task 3 ...
~~~

A Tester checkpoint therefore exists mainly as planning prose rather than as a first-class execution dependency.

The upgrade must modify Planner, Job planning, topology, Verification, orchestration, Handoff and completion behavior together.

## 3. Non-goals

This upgrade must NOT:

- insert Tester after every Coder task;
- replace Coder lightweight self-checks;
- replace Reviewer;
- let Tester modify product implementation;
- make TinyFish mandatory;
- assume the existing Vercel Sandbox browser works before probing it;
- create a general-purpose browser agent;
- require a new persistent entity for every planning concept;
- force every Job to have browser testing;
- force every checkpoint to be a PASS/FAIL gate;
- invent thresholds for measurements where no approved threshold exists;
- turn subjective UI taste into an automated PASS/FAIL verdict.

## 4. Target role boundary

### Coder owns

- source implementation;
- implementation fixes;
- syntax/parse/type/build/lint checks as appropriate;
- lightweight smoke checks;
- self-review closure;
- Goal Recheck.

### Reviewer owns

- source/plan review;
- contract/diff/relationship correctness;
- planning-review gate;
- source-change review after Tester-discovered failures are repaired.

### Tester owns

- independent checkpoint test planning;
- Tester-owned test definitions/experiments;
- practical verification;
- bounded runtime experiments;
- measurements;
- probes;
- UI/browser verification when capability is proven usable;
- evidence capture;
- failure classification;
- checkpoint verdict;
- retest;
- checkpoint regression surface.

### Planner owns

- where Test Checkpoints exist;
- what must be true at the checkpoint;
- what downstream work consumes Tester evidence;
- whether a checkpoint is VERIFY, MEASURE, PROBE, or a combination;
- architecture/product decisions made from Tester evidence.

Tester may state evidence-supported implications but does not silently make architecture decisions.

## 5. Tester modes

### VERIFY

Question:

> Does the exact current product state satisfy the declared checkpoint goal?

Produces a checkpoint verdict.

### MEASURE

Question:

> What is the real observed value or runtime behavior?

Examples:

- readiness time;
- page render stability;
- API/tool latency;
- retry/recovery time;
- payload/limit behavior;
- repeated-run reliability.

If the Planner/spec did not define a threshold, MEASURE records values and does not invent PASS/FAIL criteria.

### PROBE

Question:

> Is an important technical assumption true in the real environment?

Examples:

- does the hosted browser actually start?
- can it open the real deployment?
- can it render JS?
- does screenshot capture actually return usable evidence?
- does click/fill work?
- is a runtime identifier stable within one chat?
- does it change in a new chat?
- is a dynamically exposed tool actually invocable?

PROBE output is primarily design/planning evidence.

## 6. Readiness / capability model

Replace overly coarse reasoning with the following conceptual progression where applicable:

~~~text
DISCOVERED
    ↓
REACHABLE
    ↓
INVOCABLE
    ↓
FUNCTIONAL
    ↓
GOAL_MET
~~~

Definitions:

- DISCOVERED: tool/capability is visible in a surface.
- REACHABLE: its service/bridge/endpoint can actually be reached.
- INVOCABLE: the required operation can be called from the active execution surface.
- FUNCTIONAL: the operation behaves correctly against the intended target.
- GOAL_MET: the complete checkpoint promise/user flow is verified.

Compatibility mapping:

~~~text
SURFACE_PRESENT ≈ DISCOVERED
OBSERVED        = evidence-backed capability at the tested level
~~~

Do not delete SURFACE_PRESENT/OBSERVED immediately if they are used by existing runtime logic. First make the finer readiness model a Tester evidence concept, then migrate runtime vocabulary only if it produces a real benefit.

## 7. Failure classification

Tester must classify execution before routing:

- PRODUCT_FAILURE
- TEST_FAILURE
- ENVIRONMENT_FAILURE
- NOT_READY
- INTEGRATION_NOT_READY
- SPEC_GAP

Rules:

- failing test != automatically product bug;
- broken locator/fixture/test logic is TEST_FAILURE;
- unavailable hosted browser is ENVIRONMENT_FAILURE, not PASS;
- tool discovered but not callable is INTEGRATION_NOT_READY;
- unclear expected behavior is SPEC_GAP;
- UNVERIFIED != PASS.

## 8. Test Checkpoint contract

A Test Checkpoint should become an explicit topology/gate contract declared by Planner.

It does not need to become a new top-level hierarchy entity. It can be represented as a typed topology node / embedded checkpoint record in the Job.

Proposed minimum shape:

~~~json
{
  "checkpoint_id": "CP-UI-02",
  "kind": "TEST_CHECKPOINT",
  "mode": ["VERIFY"],
  "after_task_refs": ["<task-id>"],
  "goal": "Lesson shell renders correctly at required viewports",
  "acceptance_criteria": [
    "header visible",
    "learning canvas fully visible",
    "no horizontal overflow"
  ],
  "required_capabilities": [
    "browser.open_public_url",
    "browser.render_js",
    "browser.screenshot"
  ],
  "target": {
    "ref_source": "current reviewed revision",
    "runtime_url_source": "deployment evidence"
  },
  "downstream_consumers": [
    {
      "task_ref": "<later-task-id>",
      "required_output": "ui-shell-verification"
    }
  ],
  "blocking_policy": "BLOCK_DOWNSTREAM_ON_UNVERIFIED"
}
~~~

Not every field must be persisted exactly in this shape, but these semantics must survive.

## 9. Planner changes

Planner is the largest non-Tester impact.

### 9.1 Planning decomposition

Current planning already uses:

~~~text
Objective → Phase → Task → Job Pack → Milestone
~~~

Upgrade this to explicitly ask at Phase/Task/Milestone boundaries:

~~~text
What assumption becomes testable here?
Would later work become expensive or invalid if this assumption is wrong?
Is this a meaningful checkpoint?
If yes:
  VERIFY?
  MEASURE?
  PROBE?
What downstream work consumes the result?
~~~

### 9.2 Checkpoint placement rule

Planner SHOULD add a Test Checkpoint when one or more is true:

- a functional slice becomes executable;
- later work materially depends on behavior just implemented;
- a protocol/state/integration boundary changed;
- a user flow is now testable end-to-end;
- an unverified assumption could invalidate substantial later work;
- the next phase needs a measured runtime value;
- the foundation should be proven before significant additional coding;
- final Job verification requires accumulated regression.

Planner SHOULD NOT add a checkpoint:

- after every mechanical task;
- only because Tester exists;
- where Coder build/lint/self-smoke is sufficient;
- where no meaningful independent verification is possible.

### 9.3 Task list impact

Tasks need to expose which completion criteria are locally self-checkable and which require downstream checkpoint verification.

Recommended extension:

~~~json
{
  "task_id": "...",
  "objective": "...",
  "completion_criteria": ["..."],
  "verification_class": "SELF_CHECK_ONLY | CHECKPOINT_REQUIRED | CHECKPOINT_INPUT",
  "checkpoint_refs": ["CP-..."]
}
~~~

This allows the task list to show meaningful Tester dependencies without turning Test Checkpoints into ordinary coding Tasks.

### 9.4 Milestone impact

Milestone planning must include checkpoint boundaries.

A Milestone should be able to mean:

~~~text
M2 complete when:
- tasks T3/T4 are reviewed;
- CP-2 VERIFY is PASS;
- CP-3 PROBE evidence exists;
- CP-3 output is available to Phase 3.
~~~

Therefore Milestone completion may depend on:
- task completion;
- review verification;
- Test Checkpoint result;
- required empirical evidence;
- Human Gate where applicable.

### 9.5 Planning review impact

Planning Reviewer must verify:

- checkpoints are meaningful rather than habitual;
- critical assumptions are not left unverified;
- later Tasks do not depend on guessed values when a feasible PROBE/MEASURE could produce them;
- checkpoint placement does not create excessive orchestration overhead;
- downstream consumers explicitly identify required Tester outputs;
- final regression surface is adequate;
- capability assumptions are not falsely marked available.

## 10. Job record / job_prepare changes

Current job_prepare persists:

- planning context with phase/milestone;
- tasks;
- generated topology;
- verification requirements;
- review triggers.

Required changes:

### 10.1 Input schema

Add optional Planner-declared test_checkpoints[].

Proposed contract:

~~~text
test_checkpoints[] {
  checkpoint_id?
  name?
  modes[] = VERIFY | MEASURE | PROBE
  after_task_refs[]
  goal
  acceptance_criteria[]
  required_capabilities[]
  planned_evidence[]
  downstream_consumers[]
  blocking_policy
  regression_scope?
}
~~~

### 10.2 Topology generation

Do not keep generating only:

~~~text
T1 → T2 → T3
~~~

Generate topology that can express:

~~~text
T1
 ↓
T2
 ↓
Reviewer if required
 ↓
CP1 Tester
 ├─ PASS → T3
 ├─ FAIL → Coder repair → Reviewer → CP1 RETEST
 └─ BLOCKED → capability/Human route
~~~

A checkpoint can sit between Tasks or at Milestone/Job-final boundaries.

### 10.3 Plan revision

job_revise_plan must be able to revise checkpoint definitions.

Material changes to:
- checkpoint goal;
- checkpoint modes;
- required evidence;
- blocking policy;
- downstream dependency;

must increment planning revision and therefore be covered by planning review.

### 10.4 Existing Job compatibility

Old Jobs without test_checkpoints remain valid.

Default:

~~~text
test_checkpoints = []
~~~

No migration should require rewriting historical Job files.

## 11. Execution topology / Orchestrator changes

The Orchestrator must understand a declared Test Checkpoint as executable topology.

### 11.1 Dispatch

When prerequisites are satisfied:

~~~text
reviewed prerequisite work
→ checkpoint ready
→ Tester Run
~~~

Tester must not be auto-inserted outside declared checkpoints, except explicit Human direct Tester invocation.

### 11.2 PASS

~~~text
Tester PASS
→ persist Verification/Evidence
→ mark checkpoint satisfied via read-time join
→ dispatch downstream topology
~~~

### 11.3 FAIL

~~~text
Tester FAIL
→ route to owning Coder work
→ Coder fix
→ Coder self-check
→ Reviewer PASS on changed source
→ Tester RETEST same checkpoint
~~~

Important: Tester FAIL does not require Reviewer to repeat the diagnosis before repair. Reviewer reviews the resulting source change.

### 11.4 BLOCKED

If capability/environment prevents valid execution:

~~~text
Tester BLOCKED
→ do not PASS checkpoint
→ route according to blocking policy:
   - Human Retest;
   - capability remediation;
   - optional alternate provider;
   - Planner decision if architecture assumption must change.
~~~

### 11.5 PROBE/MEASURE output

A checkpoint may complete successfully without a product PASS/FAIL verdict if its required output is empirical evidence.

Example:

~~~text
CP-session-lifetime
mode: PROBE
required output: identifier stability table
~~~

The next Planner/Coder stage waits for that evidence rather than for a fabricated PASS condition.

## 12. Tester Run lifecycle

Target loop:

~~~text
GROUND
→ PLAN
→ CAPABILITY
→ AUTHOR
→ EXECUTE
→ ANALYZE
→ ADAPT
→ REPORT
→ RETEST when applicable
~~~

### GROUND

Load only:
- checkpoint goal;
- Job goal;
- acceptance criteria;
- relevant spec/contracts;
- exact target revision/state;
- relevant reviewed Coder output/diff;
- prior still-valid Tester evidence.

Implementation is an object under test, not the source of expected behavior.

### PLAN

Create independent test cases:
- positive;
- negative;
- boundary;
- regression;
- integration;
- state transition;
- failure/recovery;
- browser/UI;
- measurement/probe.

### CAPABILITY

Resolve which planned checks are actually executable.

A surface-listed tool is not enough.

### AUTHOR

Online Tester does not need Local filesystem semantics.

Persist a declarative test definition when useful:

~~~text
VERIFICATION or TEST_ARTIFACT
- checkpoint
- cases
- fixtures/data references
- planned steps
- expected observations
~~~

Do not write product source.

A dedicated TEST_ARTIFACT family can be added later only if Verification becomes too overloaded. Prefer minimum schema change first.

### EXECUTE

Run bounded verification with explicit limits/timeouts.

### ANALYZE

Classify results before routing.

### ADAPT

Tester may add tests within checkpoint scope if execution reveals a hidden risk.

Material scope/requirement change routes to Planner/Human.

### REPORT

Persist structured result.

### RETEST

After source changes:
1. rerun failing cases;
2. rerun relevant checkpoint regression;
3. bind evidence to the new revision.

## 13. Verification record upgrade

Current Verification common envelope is already the right durable family.

Extend TEST/RETEST/EVIDENCE semantics instead of creating many new record families.

Recommended Test extension:

~~~json
{
  "kind": "TEST",
  "checkpoint_id": "CP-...",
  "mode": ["VERIFY"],
  "target_ref": "...",
  "target_revision": "...",
  "producer": "tester",
  "planned": 8,
  "executed": 8,
  "passed": 7,
  "failed": 1,
  "blocked": 0,
  "observations": [],
  "failures": [
    {
      "case_id": "...",
      "expected": "...",
      "actual": "...",
      "classification": "PRODUCT_FAILURE",
      "evidence_refs": []
    }
  ],
  "measurements": {},
  "capability_observations": [],
  "limitations": [],
  "unverified": [],
  "result": "FAIL",
  "next_phase_inputs": []
}
~~~

For MEASURE/PROBE, next_phase_inputs is first-class.

Example:

~~~json
{
  "name": "browser.render_js",
  "observed_value": "functional",
  "conditions": {
    "provider": "gsa-native-sandbox",
    "target": "...",
    "revision": "..."
  },
  "confidence": "3/3 repeated runs",
  "consumed_by": ["task:T-..."]
}
~~~

## 14. Persistence and Project Memory

Do not reproduce Local's writable filesystem workspace literally.

Recommended first implementation:

~~~text
projects/<project-id>/
  VERIFICATION/
    <verification-id>.json
~~~

Checkpoint plans/cases can initially be embedded/referenced from Verification artifacts.

If test artifacts become too large or reusable, introduce later:

~~~text
projects/<project-id>/
  TESTER/
    <job-id>/
      <checkpoint-id>/
        ...
~~~

This should be a later evidence-driven schema promotion, not a prerequisite for M1.

## 15. Handoff changes

Handoff already has required_inputs[].

Use it explicitly for Tester evidence dependencies.

Example:

~~~json
{
  "next_role": "coder",
  "required_inputs": [
    "verification:<CP-session-probe>",
    "measurement:session_identifier_lifetime"
  ]
}
~~~

A downstream Run must not silently replace a missing required measurement with a guessed value.

Add a guard in Run start/orchestration:

~~~text
if required Tester evidence declared by topology is missing/stale:
  do not dispatch dependent work as ready
~~~

## 16. Completion and state-machine impact

### Checkpoint state

Do not immediately create a large mutable checkpoint lifecycle table.

Derive checkpoint state from:
- Job checkpoint definition;
- prerequisite Runs/Reviews;
- Tester Verification records;
- target revision validity.

Suggested derived states:

~~~text
PLANNED
READY
RUNNING
PASS
FAIL
BLOCKED
NEEDS_HUMAN
STALE
SUPERSEDED
~~~

### Job completion

A Job cannot complete PASS when a required blocking Test Checkpoint is:
- missing;
- FAIL;
- BLOCKED;
- stale for the accepted target revision.

PASS_RETEST_REQUIRED remains valid only where the approved topology explicitly permits a deferred Retest/Human verification path.

Do not use PASS_RETEST_REQUIRED as a generic escape hatch for missing mandatory Tester evidence.

## 17. Browser provider architecture

Browser is an execution provider, not Tester architecture.

Logical capabilities:

~~~text
browser.open_public_url
browser.render_js
browser.snapshot
browser.screenshot
browser.console
browser.page_errors
browser.click
browser.fill
browser.keyboard
browser.viewport
browser.session_profile
~~~

Providers may include:

1. GSA_NATIVE_SANDBOX
   - current browser_ui_inspect
   - current browser_test_flow
   - actual capability status UNKNOWN until probe succeeds

2. TINYFISH
   - OPTIONAL
   - external hosted provider
   - must be capability-probed before being trusted
   - absence must not break GSA core behavior

3. future providers
   - allowed without changing Tester semantics

Selection policy should be capability-based, not provider-name based.

## 18. Mandatory browser bootstrap probes

Before treating the existing native sandbox as a reliable Tester backend, run explicit experiments.

### PROBE-BROWSER-01 — static observation

Target: simple public page.

Verify:
- session starts;
- URL loads;
- page snapshot is returned;
- screenshot is returned.

### PROBE-BROWSER-02 — real JS deployment

Target: public Vercel app.

Verify:
- client JS renders;
- meaningful post-render DOM/snapshot is observable;
- console/page error collection works;
- screenshot represents final rendered state.

### PROBE-BROWSER-03 — bounded interaction

Target: simple non-destructive app flow.

Verify:
- click;
- fill/type;
- wait/assert state;
- navigation or state transition;
- final screenshot/snapshot.

### PROBE-BROWSER-04 — repeatability

Repeat representative flow 3-5 times.

Measure:
- startup success rate;
- execution success rate;
- startup latency;
- render latency;
- flaky behavior;
- inconsistent screenshot/snapshot evidence.

Only after these probes should capabilities be marked evidence-backed.

## 19. UI verification policy

Observation-only UI testing is first-class and useful even if full interaction automation is unreliable.

Example checkpoint:

~~~text
open deployment
→ render laptop/tablet/mobile
→ capture screenshot
→ inspect accessibility/DOM snapshot
→ inspect console/page errors
→ verify objective layout constraints
~~~

Automatable objective checks include:
- navigation;
- visible/hidden states;
- focus when observable;
- viewport overflow;
- clipping/covering;
- breakpoint behavior;
- missing/broken assets;
- console/page errors;
- required flow completion.

Subjective aesthetic quality remains NEEDS_HUMAN unless objective design criteria exist.

## 20. Browser QA document changes

docs/architecture/BROWSER-QA.md should be revised after capability probes.

Current wording describes a concrete Vercel Sandbox + agent-browser runtime. Treat that as intended implementation, not proven runtime capability until evidence exists.

The revised document should distinguish:

~~~text
declared provider
surface availability
observed capability
known limitations
last probe evidence
~~~

Do not hard-code TinyFish into this document except as an optional external provider example.

## 21. Reviewer changes

Reviewer needs two additions.

### Planning review

Check:
- missing high-value checkpoints;
- too many low-value checkpoints;
- checkpoint/downstream dependency correctness;
- missing MEASURE/PROBE where later design depends on unknown runtime behavior;
- unjustified capability assumptions;
- incomplete final regression requirement.

### Source review after Tester FAIL

Reviewer reviews the Coder repair against:
- original requirement;
- Tester failure evidence;
- actual diff;
- regression risk.

Reviewer does not modify Tester-owned expected behavior to make the repair appear successful.

## 22. Coder changes

Coder harness needs explicit rules:

- Tester evidence is read-only input.
- Coder fixes product source, not Tester evidence.
- Coder cannot weaken a checkpoint/test expectation unless Planner/Human changes the approved requirement.
- If a Tester measurement is declared as required input, Coder consumes that observed value rather than inventing a replacement.
- After repair, normal self-check + Reviewer occurs before Tester RETEST.

Coder self-check remains deliberately shallow compared with Tester.

## 23. Direct Tester

Direct Agent Tester remains useful for ad-hoc diagnosis.

Direct Tester should support:
- VERIFY;
- MEASURE;
- PROBE;

but direct work is ephemeral by default unless the user explicitly promotes/persists the evidence into Project work.

Direct Tester must not mutate durable Job topology.

## 24. Capability registry strategy

Do not build a global mutable capability database first.

M1/M2:
- store capability observations in Tester Verification records;
- use current Run/checkpoint evidence.

Later, if repeated lookup cost becomes significant, introduce a rebuildable capability materialized view keyed by:
- provider;
- environment/runtime version;
- capability;
- tested target class;
- evidence ref;
- observed_at;
- expiration/reread condition.

A stale historical browser success must not prove current capability forever.

## 25. Changes by subsystem

| Subsystem | Change |
|---|---|
| Tester harness | Major: full independent Tester loop, modes, classification |
| testing-evidence skill | Major |
| Planner harness | Major: checkpoint placement + downstream evidence dependencies |
| job-planning skill | Major |
| job_prepare | Major schema/topology extension |
| job_revise_plan | Add checkpoint revision support |
| planning Reviewer | Add checkpoint quality/coverage review |
| Job record | Add checkpoint definitions/topology references |
| Embedded Task | Add verification classification/checkpoint refs or equivalent topology linkage |
| Milestone planning | Completion may require checkpoint/evidence |
| Orchestrator | Dispatch Tester from topology; route FAIL/RETEST |
| Run begin | Validate required checkpoint evidence inputs |
| Run complete/Handoff | Carry Tester evidence refs as required inputs |
| Verification records | Major TEST/RETEST/MEASURE/PROBE extensions |
| State machine | Add derived checkpoint state semantics |
| Job completion | Enforce required checkpoint evidence |
| Browser QA | Convert provider assumptions into capability-probed behavior |
| TinyFish | Optional adapter only |
| Review Coverage Summary | Derive checkpoint/Test/Retest coverage by exact revision |
| Evals | Add planning/checkpoint/tester/browser-probe scenarios |

## 26. Implementation milestones

### M1 — Tester semantic foundation

Goal: upgrade role behavior without depending on browser success.

Change:
- Tester harness;
- testing-evidence skill;
- VERIFY/MEASURE/PROBE;
- failure classification;
- readiness model;
- structured Tester report semantics;
- revision-bound RETEST rules.

Acceptance:
- Tester can plan and report a non-browser PROBE from durable goal/criteria;
- UNVERIFIED cannot become PASS;
- Tester does not modify source;
- MEASURE without threshold produces measurement, not invented verdict.

### M2 — Test Checkpoint planning model

Goal: make Tester placement and outputs explicit in Job planning.

Change:
- job_prepare.test_checkpoints[];
- job_revise_plan;
- Job record;
- topology generation;
- task/checkpoint linkage;
- milestone completion semantics;
- planning-review checks.

Acceptance:
- Planner can produce a Job where T2 → CP1 → T3;
- planning review detects an orphaned downstream dependency;
- old Jobs without checkpoints remain readable.

### M3 — Tester Verification persistence + routing

Goal: make checkpoint evidence durable and actionable.

Change:
- TEST/RETEST Verification extensions;
- next-phase inputs;
- derived checkpoint state;
- Orchestrator dispatch;
- FAIL → Coder → Reviewer → RETEST;
- Handoff required evidence inputs.

Acceptance:
- a failed checkpoint routes to repair;
- repaired source cannot go directly to checkpoint PASS without Reviewer;
- stale evidence from old revision is rejected;
- downstream Task is blocked when declared Tester input is missing.

### M4 — Native browser capability probes

Goal: discover what the existing hosted sandbox really does.

Run:
- PROBE-BROWSER-01..04.

Do not modify product/browser architecture to fit expected results before measurements exist.

Output:
- observed capability matrix;
- reliability measurements;
- environment limitations;
- design implications.

Acceptance:
- no capability marked functional without successful real execution;
- failures are classified without blaming application code prematurely.

### M5 — Browser adapter integration

Goal: let Tester select an execution provider by observed capability.

First:
- native GSA browser if proven usable for the required primitive.

Optional:
- TinyFish when connected and separately proven usable.

Acceptance:
- Tester semantics do not change when provider changes;
- provider absence can yield BLOCKED/NEEDS_HUMAN, never fabricated PASS.

### M6 — Regression accumulation and final checkpoint

Goal: make final Tester verification include relevant prior checkpoint regression.

Change:
- checkpoint regression references;
- final Job Tester surface;
- Review Coverage Summary integration.

Acceptance:
- final evidence identifies which prior checkpoint surfaces were rerun;
- unrelated tests are not automatically accumulated forever.

## 27. Required evals

Add at least:

### E-Tester-01 — sparse checkpoint planning

Planner receives 8 coding Tasks but only 2 meaningful verification boundaries.

Expected:
- 2 checkpoints, not 8.

### E-Tester-02 — empirical dependency

Next phase needs a runtime identifier lifetime.

Expected:
- PROBE checkpoint;
- downstream Task consumes measured evidence;
- missing evidence blocks the dependent Task.

### E-Tester-03 — product failure repair

Tester FAIL on exact revision A.

Expected:
- route to Coder;
- source revision B;
- Reviewer PASS B;
- RETEST B;
- revision A evidence not reused as PASS for B.

### E-Tester-04 — environment failure

Browser provider is surface-present but fails to start.

Expected:
- ENVIRONMENT_FAILURE/BLOCKED;
- no product FAIL;
- no PASS.

### E-Tester-05 — native browser probe

Successful static load but interaction fails.

Expected capability matrix:
- open/render/screenshot = observed;
- click/fill = unverified/failed;
- observation-only UI checkpoints remain usable.

### E-Tester-06 — optional provider

TinyFish unavailable/not connected.

Expected:
- core Tester still works for non-TinyFish capabilities;
- no architecture failure.

### E-Tester-07 — checkpoint overuse

Planner creates Tester checkpoint after every trivial Task.

Expected:
- planning Reviewer returns CHANGES_REQUIRED.

### E-Tester-08 — no invented threshold

MEASURE returns render time 2.4s with no approved performance threshold.

Expected:
- measurement persisted;
- no automatic PASS/FAIL performance conclusion.

## 28. Migration order

Recommended implementation order:

~~~text
docs/contracts
→ harness/skills
→ Job/checkpoint schema
→ planning-review
→ Verification persistence
→ orchestration/routing
→ state/completion guards
→ browser probes
→ browser adapters
→ evals/regression
~~~

Do not start by wiring TinyFish.

Do not start by assuming the native sandbox succeeds.

The first executable browser work should itself be a Tester PROBE that produces evidence for the following implementation phase.

## 29. Concrete source files expected to change

Likely primary files:

- supabase/functions/gsa-mcp/index.ts
- docs/architecture/AGENT-HARNESSES.md
- docs/architecture/CORE-RECORD-CONTRACTS.md
- docs/architecture/EXECUTION-AND-REVIEW.md
- docs/architecture/JOB-LIFECYCLE.md
- docs/architecture/STATE-MACHINE.md
- docs/architecture/DISPATCH-AND-HANDOFF.md
- docs/architecture/BROWSER-QA.md
- skills/gsa-job-runtime/SKILL.md
- relevant evals/ files plus new Tester evals.

Potentially add a dedicated architecture document after M1, e.g.:
- docs/architecture/TESTER-AGENT.md

Do not duplicate Local's spec verbatim. Online canonical documentation should describe the shared semantics plus Online persistence/provider differences.

## 30. Important implementation cautions

1. Do not make Test Checkpoints ordinary coding Tasks just to avoid topology work.
2. Do not let Tester become a second Reviewer.
3. Do not let Reviewer become a second Tester.
4. Do not let Coder edit/degrade test expectations to get green.
5. Do not make every failure a product failure.
6. Do not turn browser provider names into architecture contracts.
7. Do not make one historical capability probe permanent truth.
8. Do not let downstream phases invent missing empirical values.
9. Do not allow stale revision evidence to satisfy a new target.
10. Do not create excessive checkpoint ceremony; checkpoints must be sparse and meaningful.
11. Do not make PROBE/MEASURE outputs informal chat context when later work depends on them.
12. Do not force a new persistent record family until existing Verification/Handoff topology proves insufficient.

## 31. Target end-state example

~~~text
Planner
  T1 foundation
  T2 integration
  CP1 PROBE: measure real readiness/session behavior
  T3 implementation consumes CP1 evidence
  T4 UI shell
  Reviewer
  CP2 VERIFY: deployed UI observation
  T5 remaining feature work
  Reviewer
  CP3 VERIFY: end-to-end flow + relevant regression

Execution:

Coder T1/T2
→ self-check
→ Reviewer where planned/required
→ Tester CP1 PROBE
→ empirical evidence persisted
→ T3 consumes evidence
→ Coder T4
→ Reviewer
→ Tester CP2
   FAIL
→ Coder repair
→ self-check
→ Reviewer PASS
→ Tester CP2 RETEST PASS
→ continue
→ final CP3
~~~

This is the intended distinction:

~~~text
Coder verifies that the change is technically sane.
Reviewer verifies the implementation/change reasoning.
Tester verifies that the product really behaves as required at meaningful checkpoints.
Tester also measures reality when the next phase must not guess.
~~~
