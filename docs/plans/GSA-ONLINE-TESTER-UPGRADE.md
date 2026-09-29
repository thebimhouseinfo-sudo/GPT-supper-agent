# GSA Online Tester Agent Upgrade Plan

Status: PROPOSED
Scope: GPT-supper-agent / GSA Online
Primary goal: upgrade Tester from a thin capability-gated verifier into a checkpoint-level independent verification and empirical-evidence agent, while preserving lightweight orchestration and keeping browser runtimes replaceable.

## 1. Decision summary

The GSA Local TESTER_AGENT_SPEC.md is the semantic reference for this upgrade, but the Online implementation must not copy Local filesystem assumptions.

The target Online Tester must:

1. verify whether the product actually satisfies the checkpoint goal;
2. independently plan practical tests from approved goal/spec/acceptance criteria;
3. support VERIFY, MEASURE, and PROBE;
4. produce both verification evidence and empirical/design evidence;
5. run only at meaningful Planner-declared Test Checkpoints, not after every coding task;
6. keep product source read-only;
7. route product failures back to Coder, then apply the existing planned/mandatory review floor before Tester RETEST when review is actually required;
8. bind all evidence to the exact target revision/state;
9. persist evidence that later Planner/Coder work may consume as an explicit dependency;
10. treat browser/tool presence as discovery only, never proof of usability.

The existing GSA browser tools browser_ui_inspect and browser_test_flow are also not assumed usable merely because they are exposed. Their actual capability must first be established by explicit runtime PROBE checkpoints.

### CR review incorporation

This revision incorporates the independent CR findings against revision a6b12a94:

- binary screenshots are no longer assumed writable through the GitHub text connector;
- TEST/RETEST persistence gets an explicit Tester Verification MCP contract;
- Milestone completion becomes structured embedded planning metadata rather than a single descriptive string;
- checkpoint ordering/dependencies have one canonical source: typed topology edges;
- Tester FAIL no longer creates a universal Reviewer gate; existing planned/mandatory review rules remain authoritative;
- canonical Verification records remain flat under VERIFICATION/<verification-id>.json;
- binary UI evidence moves to a private evidence object store with a human evidence viewer;
- screenshot retention, privacy and size budgets are explicit;
- screenshot persistence moves into the browser-evidence milestone, while the final milestone remains regression-only.

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

Do not add checkpoint linkage fields to Embedded Task as a second source of truth.

Task remains focused on implementation work:

~~~json
{
  "task_id": "...",
  "objective": "...",
  "scope": ["..."],
  "dependencies": ["..."],
  "completion_criteria": ["..."]
}
~~~

Whether a Task is upstream/downstream of a Test Checkpoint is derived from the canonical typed topology.

Status/task-list UX may display derived labels such as:

~~~text
SELF CHECK ONLY
AWAITING CP-2
PROVIDES INPUT TO CP-3
~~~

but those labels are materialized views, not persisted Task authority.

### 9.4 Milestone impact

The current single planning_context.milestone string is not sufficient for checkpoint-aware completion.

Keep the existing milestone string as a backward-compatible human label, and add embedded structured milestone groups rather than creating a new top-level persistent record family:

~~~text
milestones[] {
  milestone_id
  name
  member_node_refs[]
  completion_requirements[]
  required_checkpoint_refs[]
}
~~~

Milestone groups reference canonical topology nodes; they do not duplicate ordering.

Example:

~~~text
M2 complete when:
- T3 and T4 completion criteria are satisfied;
- CP-2 VERIFY is PASS;
- CP-3 PROBE required outputs exist;
- no required node in M2 is BLOCKED or STALE.
~~~

Milestone state is derived from Task/Run/Review/Tester Verification state.

Old Jobs without milestones[] remain valid and continue using the legacy milestone label.

### 9.5 Planning review impact

Planning Reviewer must verify:

- checkpoints are meaningful rather than habitual;
- critical assumptions are not left unverified;
- later Tasks do not depend on guessed values when a feasible PROBE/MEASURE could produce them;
- checkpoint placement does not create excessive orchestration overhead;
- topology edges are the single ordering/dependency authority;
- Milestone completion requirements reference valid topology/checkpoint nodes;
- required Tester outputs have explicit downstream consumers through topology/Handoff requirements;
- final regression surface is adequate;
- capability assumptions are not falsely marked available.


## 10. Job record / job_prepare changes

Current job_prepare persists planning context, tasks, generated topology, verification requirements and review triggers.

The upgrade keeps backward compatibility but makes topology expressive enough for Tester checkpoints.

### 10.1 Input schema

Add optional Planner-declared test_checkpoints[] and milestones[].

Checkpoint semantic contract:

~~~text
test_checkpoints[] {
  checkpoint_id?
  name?
  modes[] = VERIFY | MEASURE | PROBE
  goal
  acceptance_criteria[]
  required_capabilities[]
  planned_evidence[]
  required_outputs[]
  blocking_policy
  regression_scope?
  repair_review_policy = TOPOLOGY | REQUIRED
}
~~~

Milestone contract:

~~~text
milestones[] {
  milestone_id?
  name
  member_node_refs[]
  completion_requirements[]
  required_checkpoint_refs[]
}
~~~

Do NOT persist after_task_refs, downstream_consumers, task.checkpoint_refs or task.verification_class as independent ordering authorities.

### 10.2 Typed topology is the ordering authority

Upgrade topology from a linear Task-only list into typed nodes:

~~~text
topology[] {
  node_id
  kind = TASK | REVIEW_CHECKPOINT | TEST_CHECKPOINT | HUMAN_GATE
  ref
  depends_on[]
  next[]
}
~~~

Checkpoint definitions own checkpoint semantics.
Topology owns ordering/dependencies.
Tasks own implementation scope/completion criteria.
Milestone groups own grouping/completion requirements.

Example:

~~~text
T1
 ↓
T2
 ↓
CP1:TESTER
 ├─ satisfied → T3
 ├─ product failure → repair route
 └─ blocked → blocking-policy route
~~~

No second persisted edge set should be introduced.

### 10.3 Plan revision

job_revise_plan must support revision of:
- test_checkpoints[];
- milestones[];
- typed topology.

Material changes to checkpoint goal/mode/evidence/output/blocking/review policy or topology dependency increment planning_revision and require planning review.

### 10.4 Existing Job compatibility

Old Jobs without test_checkpoints/milestones and with Task-only topology remain valid.

Compatibility defaults:

~~~text
test_checkpoints = []
milestones = []
legacy Task-only topology remains readable
~~~

No migration rewrites historical Job files merely to adopt the new schema.

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
→ Coder repair
→ Coder self-check + Goal Recheck
→ if topology or mandatory review floor requires review: Reviewer
→ Tester RETEST same checkpoint on the new target revision
~~~

Important: Tester FAIL does not create a universal Reviewer gate. Reviewer is used only when already planned by topology, required by repair_review_policy=REQUIRED, or triggered by the mechanically computed mandatory review floor.

### 11.4 BLOCKED

If capability/environment prevents valid execution:

~~~text
Tester BLOCKED
→ do not PASS checkpoint
→ route according to blocking policy:
   - Human Retest;
   - capability remediation;
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

Current Verification common envelope remains the canonical durable family and stays flat at:

~~~text
projects/<project-id>/VERIFICATION/<verification-id>.json
~~~

Do not move canonical Verification JSON into UI subfolders.

### 13.1 Explicit Tester Verification MCP contract

Add a dedicated MCP tool, provisionally named tester_verification_record, analogous to goal_recheck_record and plan_review_record.

Minimum input:

~~~text
tester_verification_record {
  project_id
  job_id
  run_id?
  task_id?
  checkpoint_id
  kind = TEST | RETEST | EVIDENCE
  modes[] = VERIFY | MEASURE | PROBE
  target_ref
  target_revision
  result = PASS | FAIL | BLOCKED | NOT_APPLICABLE
  planned_cases[]
  executed_cases[]
  failures[]
  measurements[]
  probe_outputs[]
  capability_observations[]
  limitations[]
  unverified[]
  evidence_bundle_ref?
  next_phase_inputs[]
}
~~~

Rules:

- VERIFY normally requires PASS/FAIL/BLOCKED.
- MEASURE-only or PROBE-only checkpoints may use NOT_APPLICABLE for product verdict when required outputs were successfully produced.
- checkpoint satisfaction is mode-specific: VERIFY requires its verdict condition; MEASURE/PROBE require their declared outputs to exist and not be blocked.
- result and outputs are bound to target_revision.
- tool prepares one append-preserving Verification record and returns external_steps for guarded Memory Repo persistence/read-back.
- no TEST/RETEST PASS exists only in chat.

### 13.2 Test extension

Representative durable record:

~~~json
{
  "verification_id": "...",
  "kind": "TEST",
  "checkpoint_id": "CP-...",
  "modes": ["VERIFY"],
  "project_id": "...",
  "job_id": "...",
  "target_ref": "...",
  "target_revision": "...",
  "producer": "tester",
  "result": "FAIL",
  "planned_cases": 8,
  "executed_cases": 8,
  "failures": [
    {
      "case_id": "...",
      "expected": "...",
      "actual": "...",
      "classification": "PRODUCT_FAILURE",
      "evidence_refs": []
    }
  ],
  "measurements": [],
  "probe_outputs": [],
  "limitations": [],
  "unverified": [],
  "evidence_bundle_ref": "bundle:...",
  "next_phase_inputs": []
}
~~~

For MEASURE/PROBE, next_phase_inputs and required outputs are first-class and may be consumed by later topology/Handoff requirements.


## 14. Persistence and Project Memory

Project Memory remains the durable control plane.

Canonical text/control records remain in the configured GitHub Memory Repo:

~~~text
projects/<project-id>/
  VERIFICATION/
    <verification-id>.json
~~~

Do not embed large screenshots/base64 into Verification JSON.

Binary browser evidence uses a separate private evidence object store because the current GitHub connector only creates/updates UTF-8 text files.

The canonical Verification record must reference the binary bundle by stable bundle ID and artifact manifest references.

If the binary bundle is unavailable, the Verification record remains readable but must expose the evidence limitation; missing binary evidence cannot be silently treated as present.

The binary store is ancillary evidence storage, not a replacement Project control plane.

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


## 17. UI Test Evidence Bundle and screenshot persistence

UI/browser checkpoints produce a human-viewable evidence bundle in addition to the canonical Verification JSON.

### 17.1 Storage decision

Use a private Supabase Storage bucket dedicated to GSA evidence, provisionally:

~~~text
gsa-evidence
~~~

Logical object prefix:

~~~text
<user-id>/<project-id>/<evidence-bundle-id>/
  report.md
  result.json
  screenshots/
    01-desktop-initial.png
    02-desktop-after.png
    03-mobile-failure.png
  snapshots/
    initial.txt
    final.txt
  console.txt
  page-errors.txt
  manifest.json
~~~

The exact artifact set is test-dependent; do not create empty files.

This resolves the binary-write gap without assuming the GitHub text connector can upload PNG data.

### 17.2 Auth and write boundary

The browser bridge already receives an authenticated GSA bearer token.

Add a narrow evidence persistence path in the GSA/Vercel browser bridge that:

1. validates the authenticated user;
2. validates project_id/evidence context against the active GSA Project boundary;
3. writes only under that user's private gsa-evidence prefix;
4. uses Supabase Storage RLS/private-bucket policy so users cannot read/write another user's prefix;
5. returns artifact IDs/paths + hashes/sizes, not raw base64, after persistence;
6. verifies upload success before returning an artifact as durable evidence.

Do not grant Tester arbitrary Supabase Storage paths or source-repository write authority.

### 17.3 Evidence bundle identity

Browser capture may allocate an evidence_bundle_id before the final Verification record exists.

tester_verification_record then persists:

~~~text
evidence_bundle_ref
artifact_manifest_refs[]
~~~

The bundle and Verification record are joined by those refs; they do not require the same ID.

### 17.4 Human evidence viewer

Add an authenticated GSA evidence viewer in auth-ui.

User-facing behavior:

~~~text
Tester result
→ compact PASS/FAIL/measurement summary
→ "Open evidence"
→ authenticated folder-like viewer
   - report
   - screenshots
   - snapshots
   - console/page errors
   - artifact metadata
~~~

The viewer generates short-lived signed reads internally. Do not make evidence objects public by default.

Because screenshots are private, GitHub report.md is no longer required to embed public image URLs. The authoritative user-facing visual surface is the authenticated evidence viewer.

### 17.5 Evidence rules

- Screenshot artifacts are tied to project_id + evidence_bundle_id + target_revision in the manifest.
- Canonical TEST/RETEST Verification remains VERIFICATION/<verification-id>.json.
- result.json/report.md are human/debug artifacts, not lifecycle authority.
- Retest creates a new bundle for the new revision; never overwrite prior failing evidence.
- a PASS cannot depend on screenshots alone when interaction/state verification is required;
- a FAIL screenshot maps to a case/step in result.json/manifest.
- source repositories are not the default screenshot store.
- historical bundles are append-preserving until retention policy expires them; if expired, Verification retains metadata and notes the missing binary artifact.

### 17.6 Capture budget and privacy

Initial hard limits:

~~~text
max screenshots per verification: 12
max single screenshot: 5 MiB
max evidence bundle: 50 MiB
video/recording: disabled by default
~~~

Security/privacy rules:

- never persist passwords, auth tokens, cookies, Authorization headers or raw secret values;
- avoid screenshot capture while a secret/password field is populated;
- do not persist localStorage/sessionStorage contents unless a specific non-secret value is the subject of an approved PROBE;
- login/protected pages default to metadata/text-only evidence unless screenshot is necessary and safe;
- artifact manifest records size, MIME type and SHA-256;
- exceeding limits yields an explicit evidence limitation, not silent truncation.

Retention policy must be configurable; initial implementation may keep bundles until explicit Project cleanup, but the architecture must support later age/size cleanup without deleting Verification records.

### 17.7 Current browser implementation implication

The current browser bridge already:
1. creates PNG files inside the Vercel Sandbox;
2. reads them as base64;
3. returns inline MCP image content;
4. destroys the sandbox.

Upgrade it so persisted mode uploads screenshot bytes to the private evidence bucket before sandbox teardown and returns artifact refs.

Inline image return may remain useful for immediate chat inspection, but it is not considered durable evidence.

### 17.8 User-facing result

Example:

~~~text
CP-UI-02: FAIL
Revision: <sha>
Cases: 5/6 passed
Failure: mobile lesson canvas clipped at 390x844

Evidence bundle: <bundle-id>
Open evidence: <authenticated GSA evidence viewer link>
~~~

## 18. Native browser capability architecture

Browser execution is a native GSA capability layer, not the Tester architecture itself.

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

Current provider:

1. GSA_NATIVE_SANDBOX
   - current browser_ui_inspect
   - current browser_test_flow
   - each primitive is trusted only after the corresponding probe succeeds

The Tester contract remains capability-based so the browser implementation can evolve without changing checkpoint semantics.

## 19. Mandatory browser bootstrap probes

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

## 20. UI verification policy

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

## 21. Browser QA document changes

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

Do not introduce an external browser runtime into this document unless a later architecture decision explicitly requires one.

## 22. Reviewer changes

Reviewer needs two additions.

### Planning review

Check:
- missing high-value checkpoints;
- too many low-value checkpoints;
- checkpoint/downstream dependency correctness;
- missing MEASURE/PROBE where later design depends on unknown runtime behavior;
- unjustified capability assumptions;
- incomplete final regression requirement.

### Source review after Tester FAIL when review is required

When topology, repair_review_policy or the mandatory review floor requires a Reviewer, Reviewer reviews the Coder repair against:
- original requirement;
- Tester failure evidence;
- actual diff;
- regression risk.

Reviewer does not modify Tester-owned expected behavior to make the repair appear successful.

## 23. Coder changes

Coder harness needs explicit rules:

- Tester evidence is read-only input.
- Coder fixes product source, not Tester evidence.
- Coder cannot weaken a checkpoint/test expectation unless Planner/Human changes the approved requirement.
- If a Tester measurement is declared as required input, Coder consumes that observed value rather than inventing a replacement.
- After repair, normal self-check + Reviewer occurs before Tester RETEST.

Coder self-check remains deliberately shallow compared with Tester.

## 24. Direct Tester

Direct Agent Tester remains useful for ad-hoc diagnosis.

Direct Tester should support:
- VERIFY;
- MEASURE;
- PROBE;

but direct work is ephemeral by default unless the user explicitly promotes/persists the evidence into Project work.

Direct Tester must not mutate durable Job topology.

## 25. Capability registry strategy

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

## 26. Changes by subsystem

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
| Embedded Task | No new checkpoint authority fields; checkpoint status is derived from typed topology |
| Milestone planning | Add embedded milestones[] groups referencing topology/checkpoint nodes |
| Orchestrator | Dispatch Tester from topology; route FAIL/RETEST |
| Run begin | Validate required checkpoint evidence inputs |
| Run complete/Handoff | Carry Tester Verification/output refs as required inputs |
| Verification records | Add explicit tester_verification_record MCP contract for TEST/RETEST/EVIDENCE |
| State machine | Add derived checkpoint state semantics |
| Job completion | Enforce required checkpoint evidence |
| Browser QA | Convert runtime assumptions into capability-probed behavior |
| UI evidence bundle | Persist private binary evidence in Supabase Storage and expose authenticated folder-like viewer |
| Review Coverage Summary | Derive checkpoint/Test/Retest coverage by exact revision |
| Evals | Add planning/checkpoint/tester/browser-probe scenarios |

## 27. Implementation milestones

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

Goal: make Tester placement and outputs explicit without creating duplicate task/checkpoint authority.

Change:
- job_prepare.test_checkpoints[];
- job_prepare.milestones[];
- job_revise_plan support;
- typed topology nodes/edges;
- checkpoint/milestone planning-review checks;
- backward compatibility for historical Task-only topology.

Acceptance:
- Planner can produce T2 → CP1 → T3 through typed topology;
- Task records do not duplicate checkpoint edges;
- planning review detects orphaned checkpoint output/milestone references;
- old Jobs without checkpoints/milestones remain readable.

### M3 — Tester Verification persistence + routing

Goal: make checkpoint evidence durable and actionable.

Change:
- add tester_verification_record;
- TEST/RETEST/EVIDENCE mode-specific records;
- next-phase inputs/required outputs;
- derived checkpoint state;
- Orchestrator dispatch;
- FAIL → Coder repair → Goal Recheck → planned/mandatory review if required → RETEST;
- Handoff required evidence inputs;
- Job completion guard against missing/stale required checkpoint evidence.

Acceptance:
- a failed checkpoint routes to repair;
- Reviewer is not universally inserted when topology/mandatory floor does not require it;
- stale evidence from old revision is rejected;
- downstream Task is blocked when declared Tester input is missing;
- no TEST/RETEST PASS exists only in chat.

### M4 — Native browser capability probes

Goal: discover what the existing hosted sandbox really does.

Run:
- PROBE-BROWSER-01..04 plus remaining fill/keyboard/persistence/repeatability checks.

Output:
- observed capability matrix;
- reliability measurements;
- environment limitations;
- design implications.

Acceptance:
- no capability marked functional without successful real execution;
- failures are classified without blaming application code prematurely;
- observed capability is conditioned on environment/target/run evidence.

### M5 — Native browser durable evidence

Goal: persist browser evidence safely and make it inspectable by the user.

Change:
- private Supabase gsa-evidence bucket + RLS/prefix policies;
- persisted evidence mode in browser bridge;
- evidence_bundle_id + artifact manifest;
- upload/read-back verification with hashes/sizes;
- capture budget/privacy rules;
- authenticated auth-ui evidence viewer;
- tester_verification_record evidence_bundle_ref integration.

Acceptance:
- screenshot survives sandbox teardown;
- Tester receives stable artifact refs rather than only base64;
- another user cannot read/write the bundle;
- bundle oversize/secret-risk cases fail safely with explicit limitation;
- user can open one evidence viewer link and inspect report + screenshots + logs.

### M6 — Regression accumulation and final checkpoint

Goal: make final Tester verification include only relevant prior checkpoint regression.

Change:
- checkpoint regression references;
- final Job Tester surface;
- Review Coverage Summary integration;
- regression selection by affected behavior/dependency rather than "all tests forever".

Acceptance:
- final evidence identifies which prior checkpoint surfaces were rerun;
- unrelated tests are not accumulated indefinitely;
- regression evidence is bound to the accepted target revision.


## 28. Required evals

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

### E-Tester-03 — product failure repair without universal review

Tester FAIL on revision A; repair does not hit mandatory review floor and topology does not require Reviewer.

Expected:
- route to Coder;
- source revision B;
- Coder Goal Recheck;
- RETEST B without inserting an unplanned Reviewer;
- revision A evidence not reused as PASS for B.

A paired case with mandatory/planned review must insert Reviewer before RETEST.

### E-Tester-04 — environment failure

Native browser is surface-present but fails to start.

Expected:
- ENVIRONMENT_FAILURE/BLOCKED;
- no product FAIL;
- no PASS.

### E-Tester-05 — native browser partial capability

Static load/screenshot succeeds but interaction fails.

Expected capability matrix:
- open/render/screenshot = observed;
- failed interaction primitive remains unverified/failed;
- observation-only UI checkpoints remain usable.

### E-Tester-06 — durable binary evidence

Browser creates a screenshot and sandbox terminates.

Expected:
- screenshot remains readable from private evidence storage;
- manifest hash/size/MIME match persisted object;
- Verification references the bundle;
- no base64 blob is embedded in Verification JSON.

### E-Tester-07 — checkpoint overuse

Planner creates Tester checkpoint after every trivial Task.

Expected:
- planning Reviewer returns CHANGES_REQUIRED.

### E-Tester-08 — no invented threshold

MEASURE returns render time 2.4s with no approved performance threshold.

Expected:
- measurement persisted;
- no automatic product-performance PASS/FAIL conclusion.

### E-Tester-09 — canonical topology authority

A malformed plan tries to persist conflicting Task checkpoint refs and topology edges.

Expected:
- task checkpoint refs are not accepted as authority;
- topology/checkpoint definitions determine ordering.

### E-Tester-10 — milestone gate

Milestone M2 requires CP-2 PASS and CP-3 probe output.

Expected:
- M2 remains incomplete while either requirement is missing/stale;
- no duplicate mutable Milestone status record is required.

### E-Tester-11 — evidence privacy boundary

A test reaches a password/auth-sensitive screen.

Expected:
- secret-bearing frame is not persisted by default;
- Viewer requires authenticated user;
- cross-user bundle access is denied.

### E-Tester-12 — evidence budget

Capture attempts exceed screenshot or bundle limit.

Expected:
- excess persistence stops safely;
- Tester records an explicit evidence limitation;
- existing valid artifacts remain intact.

## 29. Migration order

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
→ private evidence storage + browser persistence
→ authenticated evidence viewer
→ evals/regression
~~~


Do not start by assuming the native sandbox succeeds.

The first executable browser work should itself be a Tester PROBE that produces evidence for the following implementation phase.

## 30. Concrete source files expected to change

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

## 31. Important implementation cautions

1. Do not make Test Checkpoints ordinary coding Tasks just to avoid topology work.
2. Do not let Tester become a second Reviewer.
3. Do not let Reviewer become a second Tester.
4. Do not let Coder edit/degrade test expectations to get green.
5. Do not make every failure a product failure.
6. Do not turn browser runtime names into architecture contracts.
7. Do not make one historical capability probe permanent truth.
8. Do not let downstream phases invent missing empirical values.
9. Do not allow stale revision evidence to satisfy a new target.
10. Do not create excessive checkpoint ceremony; checkpoints must be sparse and meaningful.
11. Do not make PROBE/MEASURE outputs informal chat context when later work depends on them.
12. Do not force a new persistent record family until existing Verification/Handoff topology proves insufficient.

## 32. CR finding resolution matrix

| CR finding | Resolution in this plan |
|---|---|
| Binary screenshot path undefined | Private Supabase Storage evidence bucket + authenticated browser-bridge upload path |
| No Tester TEST/RETEST persistence tool | Add explicit tester_verification_record MCP contract |
| Milestone too weak as one string | Add embedded milestones[] groups referencing topology/checkpoints; keep legacy label for compatibility |
| Multiple checkpoint sources of truth | Checkpoint definitions own semantics; typed topology owns ordering; Task checkpoint labels are derived only |
| Universal Reviewer-before-Retest conflicts with topology-driven review | Use existing planned/mandatory review floor; repair_review_policy can explicitly require review |
| Verification storage path conflict | Keep canonical JSON flat at VERIFICATION/<verification-id>.json |
| Screenshot retention/security unspecified | Add private bucket, RLS, no-secret capture rules, 12 screenshot / 5 MiB each / 50 MiB bundle limits |
| M5/M6 responsibilities drifted | M5 owns durable browser evidence + viewer; M6 owns regression/final checkpoint only |

## 33. Target end-state example

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
→ self-check + Goal Recheck
→ Reviewer only if planned/required
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
