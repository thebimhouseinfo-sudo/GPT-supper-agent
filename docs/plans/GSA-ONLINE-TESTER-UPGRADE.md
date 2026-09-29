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
10. treat browser/tool presence as discovery only, never proof of usability;
11. preserve unknown runtime facts as first-class EvidenceNeed records from planning through execution;
12. support checkpoints whose prerequisites span multiple Tasks/Job Packs or a Milestone boundary;
13. make checkpoint attempts crash/resume-safe and duplicate-resistant;
14. reuse evidence only when its declared applicability dimensions still match;
15. route newly discovered PLAN_GAP/SPEC_GAP through replanning; Tester never mutates topology itself.

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

### Local GSA CR cross-port findings

The GSA Local architecture review exposed five additional invariants that also apply to Online GSA, adapted to Online's different control plane:

- unknown runtime facts must survive planning as first-class evidence needs rather than prose;
- checkpoints may guard a boundary created by multiple upstream work nodes, not only one Task;
- checkpoint execution must be resume-safe and lease/attempt-bound;
- evidence validity must be dimension-aware rather than "exact revision only" or unconstrained reuse;
- Tester-discovered planning/specification gaps must force a Planner-owned plan revision and superseding topology; Tester never rewrites the graph.

Online GSA does not copy Local's PlanArtifact/Job Builder/SQLite implementation literally. The equivalent Online contracts are Job planning_revision + evidence_needs[], normalized TestCheckpoint/EvidenceRequirement records, typed topology, GitHub-CAS checkpoint control, Run/Verification records and Planner revision flow.

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
- PLAN_GAP

Rules:

- failing test != automatically product bug;
- broken locator/fixture/test logic is TEST_FAILURE;
- unavailable hosted browser is ENVIRONMENT_FAILURE, not PASS;
- tool discovered but not callable is INTEGRATION_NOT_READY;
- unclear expected behavior is SPEC_GAP;
- missing/insufficient approved execution structure or newly discovered architectural uncertainty is PLAN_GAP;
- neither SPEC_GAP nor PLAN_GAP authorizes Tester to add/change checkpoints;
- UNVERIFIED != PASS.


## 8. Test Checkpoint contract

A Test Checkpoint is an explicit topology/gate contract. It is not an ordinary coding Task and is not assumed to belong to exactly one upstream Task.

Checkpoint semantics are stored in the Job; ordering is stored only in typed topology.

Proposed normalized shape:

~~~text
TestCheckpointSpec {
  checkpoint_id
  name?
  modes[] = VERIFY | MEASURE | PROBE
  source_evidence_need_ids[]
  goal
  acceptance_criteria[]
  required_capabilities[]
  required_outputs[]
  blocking_policy
  regression_scope?
  repair_review_policy = TOPOLOGY | REQUIRED

  boundary {
    kind = AFTER_NODE_SET | BEFORE_NODE | MILESTONE_GATE | JOB_FINAL
    prerequisite_node_refs[]
    before_node_ref?
    milestone_id?
  }
}
~~~

Boundary rules:

- AFTER_NODE_SET: checkpoint becomes due only after every prerequisite node is satisfied.
- BEFORE_NODE: checkpoint must be satisfied before the named downstream node can become READY.
- MILESTONE_GATE: checkpoint guards Milestone completion and may integrate outputs from several upstream Tasks/Job Packs.
- JOB_FINAL: checkpoint belongs to final Job acceptance/regression.

The same checkpoint may therefore integrate multiple implementation slices.

Do not encode a second ordering source such as after_task_refs on Task records. The normalized boundary is compiled into canonical topology edges.

## 9. Planner changes

Planner is the largest non-Tester impact.

### 9.1 First-class EvidenceNeed / UnknownRuntimeFact

Planner must not leave required runtime facts only in prose.

Add first-class planning data under the Job planning artifact:

~~~text
evidence_needs[] {
  evidence_need_id
  kind = EVIDENCE_NEED | UNKNOWN_RUNTIME_FACT
  question
  purpose
  requirement = REQUIRED | OPTIONAL
  preferred_modes[] = VERIFY | MEASURE | PROBE
  expected_outputs[]
  consumer_refs[]
  measurement_or_acceptance_intent
  applicability_intent {
    source_dimensions[]
    config_dimensions[]
    runtime_dimensions[]
    time_sensitivity?
  }
}
~~~

Meaning:

- question = the fact that is not yet known;
- purpose = why the project needs to know it;
- consumer_refs = planned Task/Milestone/outcome that cannot safely proceed without it;
- measurement_or_acceptance_intent states whether the output is a raw fact, threshold comparison, behavioral proof, etc.;
- applicability_intent tells later execution what dimensions are expected to determine whether evidence can be reused.

evidence_needs[] is part of planning_revision and therefore reviewed exactly like objective/scope/tasks.

Backward compatibility:

~~~text
legacy Job without evidence_needs
→ evidence_needs = []
~~~

### 9.2 Planner → execution transform invariant

Online GSA currently has no separate Job Builder agent. Therefore job_prepare/job_revise_plan perform the equivalent normalization step.

They MUST:

~~~text
read first-class evidence_needs[]
→ normalize TestCheckpointSpec
→ normalize EvidenceRequirement
→ build typed topology
~~~

They MUST NOT:

- infer a required empirical need from arbitrary prose;
- invent a threshold;
- invent a measured value;
- silently drop a REQUIRED evidence need;
- create a checkpoint with no trace back to its source evidence need when the checkpoint exists to satisfy that need.

For every REQUIRED EvidenceNeed, normalization must produce either:

~~~text
a satisfiable checkpoint + EvidenceRequirement mapping
OR
PLAN_GAP
~~~

No third state.

### 9.3 Planning decomposition

At Phase/Task/Milestone boundaries Planner asks:

~~~text
What is still unknown?
Does later work depend on knowing it?
Is it already represented as EvidenceNeed?
When does it become testable/measureable?
Does the checkpoint require one upstream node or a set?
Is it VERIFY, MEASURE or PROBE?
What downstream work consumes the output?
What dimensions determine evidence validity?
~~~

### 9.4 Checkpoint placement rule

Planner SHOULD add a Test Checkpoint when one or more is true:

- a functional slice becomes executable;
- multiple implementation slices now form a meaningful integration boundary;
- later work materially depends on behavior just implemented;
- a protocol/state/integration boundary changed;
- a user flow is now testable end-to-end;
- an unverified assumption could invalidate substantial later work;
- the next phase needs a measured runtime value;
- a Milestone should not close without integration verification;
- final Job verification requires accumulated regression.

Planner SHOULD NOT add a checkpoint:

- after every mechanical task;
- only because Tester exists;
- where Coder build/lint/self-smoke is sufficient;
- where no meaningful independent verification is possible.

### 9.5 Task list impact

Do not add checkpoint linkage fields to Embedded Task as a second source of truth.

Task remains focused on implementation work:

~~~text
task_id
objective
scope[]
dependencies[]
completion_criteria[]
~~~

Whether a Task is upstream/downstream of a checkpoint is derived from canonical topology.

Status UX may display derived labels such as AWAITING_CP / PROVIDES_INPUT_TO_CP, but those labels are not persisted authority.

### 9.6 Milestone impact

Keep planning_context.milestone as a backward-compatible human label and add structured milestone groups:

~~~text
milestones[] {
  milestone_id
  name
  member_node_refs[]
  completion_requirements[]
  required_checkpoint_refs[]
}
~~~

A Milestone checkpoint may have multiple prerequisite nodes.

Example:

~~~text
M2:
  T3 + T4 + T5 complete
  → CP-INTEGRATION-2 due
  → CP-INTEGRATION-2 SATISFIED
  → M2 complete
~~~

Milestone state is derived from Tasks/Runs/Reviews/Checkpoint/Verification records.

### 9.7 Planning review impact

Planning Reviewer must verify:

- every REQUIRED evidence need is represented structurally, not only in prose;
- every REQUIRED evidence need maps to checkpoint/evidence requirement or explicit PLAN_GAP;
- checkpoints are meaningful rather than habitual;
- multi-node integration boundaries include all real prerequisites;
- later Tasks do not depend on guessed values when a feasible PROBE/MEASURE could produce them;
- topology edges are the single ordering authority;
- Milestone completion requirements reference valid topology/checkpoint nodes;
- applicability intent is sufficient for important reusable evidence;
- final regression surface is adequate;
- capability assumptions are not falsely marked available.

## 10. Job record / job_prepare changes

Current job_prepare persists planning context, tasks, generated topology, verification requirements and review triggers.

The upgrade adds first-class empirical planning and normalized checkpoint/evidence contracts.

### 10.1 Input / planning schema

Add:

~~~text
evidence_needs[]
test_checkpoints[]
milestones[]
~~~

Planner may provide checkpoint intent explicitly, but any checkpoint satisfying an EvidenceNeed must reference source_evidence_need_ids[].

Add normalized EvidenceRequirement:

~~~text
EvidenceRequirement {
  evidence_requirement_id
  evidence_need_id
  checkpoint_id
  required_outputs[]
  consumer_node_refs[]
  applicability_requirement
}
~~~

### 10.2 Typed topology is the ordering authority

Upgrade topology into typed nodes:

~~~text
topology[] {
  node_id
  kind = TASK | REVIEW_CHECKPOINT | TEST_CHECKPOINT | HUMAN_GATE
  ref
  depends_on[]
  next[]
}
~~~

Checkpoint boundary compiles into these edges. Multiple depends_on entries are valid and expected for integration checkpoints.

Authority split:

~~~text
EvidenceNeed        = why a runtime fact/evidence is required
TestCheckpointSpec  = what Tester must establish and at what boundary
EvidenceRequirement = which output downstream work requires
Topology            = ordering/dependency
Task                = implementation scope
Milestone           = grouping/completion gate
~~~

### 10.3 Normalization validation

job_prepare/job_revise_plan must reject:

- REQUIRED EvidenceNeed with no checkpoint/evidence requirement and no PLAN_GAP;
- EvidenceRequirement referencing unknown need/checkpoint/output;
- checkpoint boundary referencing missing topology node;
- MILESTONE_GATE with missing milestone;
- consumer node that is reachable before its required checkpoint;
- conflicting duplicate ordering declarations.

### 10.4 Plan revision and supersession binding

job_revise_plan must support revision of:
- evidence_needs[];
- test_checkpoints[];
- evidence_requirements[];
- milestones[];
- typed topology.

Runs, checkpoint attempts and Tester Verification created under the plan must carry planning_revision.

A material plan revision produces a new topology revision bound to the new planning_revision. Pending/running nodes from the old topology cannot silently continue.

Completed evidence from an older revision may be reused only through EvidenceApplicability checks; revision mismatch alone is neither automatic reuse nor automatic invalidation.

### 10.5 Existing Job compatibility

Old Jobs remain valid:

~~~text
evidence_needs = []
test_checkpoints = []
evidence_requirements = []
milestones = []
legacy Task-only topology remains readable
~~~

No migration rewrites historical Jobs merely to adopt the new schema.

## 11. Execution topology / Orchestrator changes

The Orchestrator must treat checkpoints as resumable execution boundaries, not one-shot function calls.

### 11.1 Dispatch

Checkpoint readiness is derived from its normalized boundary/topology.

Examples:

~~~text
AFTER_NODE_SET:
T2 PASS + T3 PASS + T4 PASS
→ CP1 DUE

BEFORE_NODE:
CP2 SATISFIED
→ T7 READY

MILESTONE_GATE:
all required M2 nodes complete
→ CP-M2 DUE
→ CP-M2 SATISFIED
→ M2 complete
~~~

Tester must not be auto-inserted outside declared checkpoints, except explicit Human direct Tester invocation.

### 11.2 PASS / satisfaction

~~~text
Tester produces required Verification/output
→ persist evidence
→ applicability metadata persisted
→ checkpoint SATISFIED
→ downstream evidence requirements resolve
→ topology continues
~~~

MEASURE/PROBE checkpoints may become SATISFIED by producing required outputs even when no product PASS/FAIL verdict applies.

### 11.3 Product FAIL

~~~text
Tester PRODUCT_FAILURE
→ persist exact evidence
→ route to owning Coder work
→ Coder repair
→ Coder self-check + Goal Recheck
→ Reviewer only if topology / repair policy / mandatory floor requires
→ RETEST same checkpoint on new target
~~~

### 11.4 BLOCKED / environment limitation

~~~text
Tester BLOCKED
→ persist evidence/limitation
→ checkpoint BLOCKED
→ do not satisfy dependent EvidenceRequirement
→ Human Retest / capability remediation / Planner decision as declared
~~~

### 11.5 PLAN_GAP / SPEC_GAP replanning path

Tester may discover that the approved plan/spec is materially insufficient, but Tester never mutates the graph.

The only legal path is:

~~~text
Tester observes architectural/spec uncertainty
→ persist TEST/EVIDENCE with PLAN_GAP or SPEC_GAP classification
→ checkpoint becomes BLOCKED / NEEDS_HUMAN
→ pause current execution graph for dependent work
→ Planner/Human evaluates the gap
→ job_revise_plan creates planning_revision N+1
→ planning Reviewer reviews N+1
→ Human may invoke CR on N+1; CR remains human-only in Online GSA
→ revised topology supersedes old pending graph
→ resume from new topology
~~~

Rules:

- Tester may adapt test cases inside the current checkpoint scope.
- Tester may not add/remove/move checkpoints.
- Tester may not weaken acceptance criteria to unblock work.
- old running/pending checkpoint attempts are marked SUPERSEDED or STALE when their topology binding is replaced;
- completed old evidence is considered separately through EvidenceApplicability.

### 11.6 Checkpoint attempt + execution lease

Introduce a narrow checkpoint execution control record, provisionally:

~~~text
projects/<project-id>/WORK/CHECKPOINTS/<checkpoint-id>.json
~~~

Minimum control fields:

~~~text
checkpoint_id
job_id
planning_revision
topology_revision
state = DUE | RUNNING | BLOCKED | NEEDS_HUMAN | SATISFIED | SUPERSEDED
current_attempt_id?
lease_token?
lease_owner?
lease_expires_at?
target_ref?
target_revision?
updated_at
~~~

Tester attempts remain append-preserving records/Runs and reference:

~~~text
checkpoint_id
attempt_id
planning_revision
topology_revision
lease_token
~~~

Claim protocol:

1. read current checkpoint control + exact blob SHA;
2. CAS update DUE → RUNNING with a fresh attempt_id + lease token/expiry;
3. only the holder may persist terminal state for that attempt;
4. Verification/evidence is persisted before terminal control update;
5. terminal update must CAS the same lease token;
6. another dispatcher seeing a live RUNNING lease must not start a duplicate attempt.

This is the Online equivalent of Local latest_checkpoint + execution lease. The per-checkpoint CAS record is authority; CONTROL.json may cache current/pending checkpoint handles but remains rebuildable.

### 11.7 Crash/restart/resume

On any new chat/orchestration resume:

~~~text
resolve current Job + planning/topology revision
→ inspect unsatisfied checkpoint controls before dispatching later nodes
→ if RUNNING with live lease: do not duplicate
→ if RUNNING with stale lease: recover according to replay safety
→ if BLOCKED/NEEDS_HUMAN: preserve block
→ if SATISFIED: validate evidence applicability before consuming it
~~~

Each executable Tester case/step should have:

~~~text
replay_safety = OBSERVE_ONLY | IDEMPOTENT | NON_IDEMPOTENT
~~~

For stale lease recovery:

- OBSERVE_ONLY/IDEMPOTENT may resume/retry under a new lease when target binding still matches;
- uncertain NON_IDEMPOTENT work is not auto-replayed; route BLOCKED/NEEDS_HUMAN or a dedicated recovery adapter.

Even though native browser tests are intended to be non-destructive, the generic Tester architecture must not assume every future checkpoint action is replay-safe.

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

Current Verification common envelope remains the canonical durable family:

~~~text
projects/<project-id>/VERIFICATION/<verification-id>.json
~~~

### 13.1 Explicit Tester Verification MCP contract

Add tester_verification_record analogous to goal_recheck_record and plan_review_record.

Minimum input:

~~~text
tester_verification_record {
  project_id
  job_id
  run_id?
  checkpoint_id
  attempt_id?
  planning_revision
  topology_revision
  kind = TEST | RETEST | EVIDENCE
  modes[] = VERIFY | MEASURE | PROBE
  target_ref
  target_revision
  result = PASS | FAIL | BLOCKED | NOT_APPLICABLE
  classifications[]
  planned_cases[]
  executed_cases[]
  failures[]
  measurements[]
  probe_outputs[]
  capability_observations[]
  evidence_applicability
  limitations[]
  unverified[]
  evidence_bundle_ref?
  next_phase_inputs[]
}
~~~

No TEST/RETEST PASS exists only in chat.

### 13.2 EvidenceApplicability

Evidence validity must not be reduced to exact commit equality, and it must not be reused merely because it is "recent".

Persist explicit applicability:

~~~text
EvidenceApplicability {
  reuse_policy = EXACT_REVISION | DIMENSION_MATCH | NEVER_REUSE

  source_dimensions[] {
    ref
    path_or_contract?
    fingerprint
  }

  config_dimensions[] {
    key_or_contract
    nonsecret_fingerprint
  }

  runtime_dimensions[] {
    name
    observed_value_or_fingerprint
  }

  environment_dimensions[] {
    name
    value_or_fingerprint
  }

  observed_at
  valid_until?
  invalidation_conditions[]
}
~~~

Rules:

- VERIFY defaults to EXACT_REVISION unless the checkpoint explicitly defines a narrower safe applicability model.
- MEASURE/PROBE may use DIMENSION_MATCH when the planning EvidenceNeed declares which dimensions govern reuse.
- NEVER_REUSE is allowed for highly time-sensitive observations.
- source revision mismatch alone does not automatically invalidate DIMENSION_MATCH evidence if all declared dimensions can be proven unchanged.
- same source revision does not prove evidence remains valid when runtime/config/environment dimensions changed.
- if a required dimension cannot be checked, evidence is STALE/INCOMPATIBLE for that consumer and must be re-probed.
- secrets are never stored as raw applicability values; only identifiers/non-secret fingerprints.

### 13.3 Evidence applicability resolution

Before Run start, Milestone completion or Job completion consumes prior Tester evidence:

~~~text
load EvidenceRequirement
→ load candidate Verification
→ compare required applicability dimensions to current dimensions
→ VALID / STALE / INCOMPATIBLE / UNKNOWN
~~~

Only VALID satisfies a required dependency.

UNKNOWN fails closed and routes to re-probe or Human decision.

### 13.4 Representative record

~~~json
{
  "verification_id": "...",
  "kind": "EVIDENCE",
  "checkpoint_id": "CP-session-lifetime",
  "planning_revision": 4,
  "topology_revision": 4,
  "modes": ["PROBE"],
  "target_revision": "abc123",
  "result": "NOT_APPLICABLE",
  "probe_outputs": [
    {
      "name": "session_identifier_lifetime",
      "value": "stable_within_chat_changes_across_new_chat"
    }
  ],
  "evidence_applicability": {
    "reuse_policy": "DIMENSION_MATCH",
    "runtime_dimensions": [
      {"name":"runtime_build","observed_value_or_fingerprint":"..."}
    ],
    "invalidation_conditions": [
      "runtime bridge version changes",
      "session identity contract changes"
    ]
  },
  "next_phase_inputs": ["session_identifier_lifetime"]
}
~~~

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
    "evidence_requirement:ER-session-lifetime",
    "verification:<CP-session-probe>",
    "output:session_identifier_lifetime"
  ]
}
~~~

A downstream Run must not silently replace a missing required measurement with a guessed value.

Add a guard in Run start/orchestration:

~~~text
if required Tester evidence is missing OR EvidenceApplicability != VALID:
  do not dispatch dependent work as ready
~~~


## 16. Completion, checkpoint state and supersession

### 16.1 Semantic checkpoint state

Checkpoint state is reconstructed from:
- normalized CheckpointSpec/topology;
- CheckpointControl claim/lease;
- Tester Run/attempt;
- Verification/evidence;
- current planning/topology revision;
- EvidenceApplicability.

Primary states:

~~~text
PLANNED
DUE
RUNNING
SATISFIED
FAIL
BLOCKED
NEEDS_HUMAN
STALE
SUPERSEDED
~~~

DUE means every prerequisite is satisfied but no valid current attempt/evidence has satisfied the checkpoint.

### 16.2 Revision supersession

When job_revise_plan creates a material planning/topology revision:

- old pending topology is superseded;
- stale RUNNING checkpoint attempts cannot terminalize the new topology;
- CAS terminal update requires matching planning_revision/topology_revision/lease_token;
- prior completed evidence remains append-preserving;
- reusable prior evidence must pass EvidenceApplicability against the new consumer context.

### 16.3 Job/Milestone completion

A Milestone/Job cannot complete when a required checkpoint/evidence requirement is:
- missing;
- FAIL;
- BLOCKED;
- NEEDS_HUMAN;
- STALE/INCOMPATIBLE/UNKNOWN;
- bound to a superseded topology unless independently revalidated.

PASS_RETEST_REQUIRED remains valid only where approved topology explicitly permits deferred Retest/Human verification.

Do not use PASS_RETEST_REQUIRED as a generic escape hatch for missing required Tester evidence.

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

Later, if repeated lookup cost becomes significant, introduce a rebuildable capability/evidence materialized view. It is never authoritative and must carry EvidenceApplicability. Suggested key dimensions:
- provider;
- environment/runtime version;
- capability;
- tested target class;
- evidence ref;
- observed_at;
- expiration/reread condition;
- planning/topology revision provenance;
- applicability fingerprints.

A stale historical browser success must not prove current capability forever.

## 26. Changes by subsystem

| Subsystem | Change |
|---|---|
| Tester harness | Major: full independent Tester loop, modes, classification |
| testing-evidence skill | Major |
| Planner harness | Major: first-class EvidenceNeed/UnknownRuntimeFact + checkpoint placement + replanning on PLAN_GAP/SPEC_GAP |
| job-planning skill | Major |
| job_prepare | Major: evidence_needs normalization + checkpoint/evidence requirements + typed topology |
| job_revise_plan | Add EvidenceNeed/checkpoint/topology revision + supersession semantics |
| planning Reviewer | Add checkpoint quality/coverage review |
| Job record | Add checkpoint definitions/topology references |
| Embedded Task | No new checkpoint authority fields; checkpoint status is derived from typed topology |
| Milestone planning | Add embedded milestones[] groups referencing topology/checkpoint nodes |
| Orchestrator | Dispatch/resume checkpoint attempts; lease guard; route FAIL/RETEST/PLAN_GAP |
| Run begin | Validate required checkpoint evidence inputs |
| Run complete/Handoff | Carry Tester Verification/output refs as required inputs |
| Verification records | Add tester_verification_record + EvidenceApplicability + planning/topology provenance |
| Checkpoint execution control | CAS claim/lease record + append-preserving attempt/Run binding |
| State machine | DUE/RUNNING/SATISFIED/BLOCKED/STALE/SUPERSEDED + revision supersession |
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
- first-class job planning evidence_needs[] / UnknownRuntimeFact;
- job_prepare normalization into TestCheckpointSpec + EvidenceRequirement;
- multi-prerequisite checkpoint boundary kinds;
- job_prepare.milestones[];
- job_revise_plan support;
- typed topology nodes/edges;
- checkpoint/milestone planning-review checks;
- backward compatibility for historical Jobs.

Acceptance:
- a REQUIRED EvidenceNeed cannot disappear between planning and execution;
- normalization returns checkpoint/evidence dependency or PLAN_GAP;
- Planner can express {T2,T3,T4} → CP1 → T5 and Milestone gates;
- Task records do not duplicate checkpoint edges;
- planning review detects orphaned checkpoint output/milestone references;
- old Jobs without new fields remain readable.

### M3 — Tester Verification persistence + routing

Goal: make checkpoint evidence durable and actionable.

Change:
- add tester_verification_record;
- TEST/RETEST/EVIDENCE mode-specific records;
- EvidenceApplicability and consumer-side validation;
- checkpoint control + CAS execution lease + attempt identity;
- resume/stale-lease recovery with replay-safety class;
- next-phase inputs/required outputs;
- Orchestrator dispatch/resume;
- FAIL → Coder repair → Goal Recheck → planned/mandatory review if required → RETEST;
- PLAN_GAP/SPEC_GAP → pause → Planner revision → Reviewer → optional Human-invoked CR → superseding topology;
- Handoff required evidence inputs;
- Milestone/Job completion guards.

Acceptance:
- a failed checkpoint routes to repair;
- Reviewer is not universally inserted when topology/mandatory floor does not require it;
- crash/restart cannot create a second live attempt for the same checkpoint claim;
- dimension-valid evidence may survive unrelated source revisions;
- dimension-stale evidence cannot satisfy a consumer;
- Tester cannot mutate topology after PLAN_GAP/SPEC_GAP;
- downstream Task is blocked when declared Tester input is missing/invalid;
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

### E-Tester-13 — evidence need preservation

Planner declares a REQUIRED UnknownRuntimeFact consumed by a later Task.

Expected:
- evidence_need_id survives planning revision;
- normalized checkpoint references source_evidence_need_ids;
- EvidenceRequirement references the same need;
- dropping the need during normalization yields PLAN_GAP, not guessed work.

### E-Tester-14 — multi-prerequisite integration checkpoint

CP-INTEGRATION depends on T2, T3 and T4 within one Milestone.

Expected:
- CP stays PLANNED until all three prerequisites are satisfied;
- only one CP attempt becomes DUE/RUNNING;
- downstream T5 cannot activate first.

### E-Tester-15 — crash/resume and duplicate attempt

Tester checkpoint is RUNNING when execution context disappears.

Expected:
- live lease prevents duplicate attempt;
- stale lease invokes replay-safety recovery;
- NON_IDEMPOTENT uncertainty does not auto-replay;
- terminal write from an old lease/token is rejected.

### E-Tester-16 — evidence applicability across revisions

A PROBE measured value depends only on runtime bridge version and one contract file. An unrelated README changes.

Expected:
- source commit changes but declared dimensions remain equal;
- evidence remains VALID and can be reused.

Then change the runtime bridge version.

Expected:
- evidence becomes STALE/INCOMPATIBLE;
- consumer blocks until re-probe.

### E-Tester-17 — Tester-discovered plan gap

Tester discovers an architectural unknown not represented in approved topology.

Expected:
- Tester persists PLAN_GAP evidence;
- checkpoint/graph pauses;
- Tester cannot add a new checkpoint;
- Planner creates planning_revision N+1;
- planning Reviewer must review N+1;
- Human-invoked CR may review N+1 without being auto-dispatched;
- revised topology supersedes old pending graph;
- only applicable prior evidence may carry forward.

## 29. Migration order

Recommended implementation order:

~~~text
docs/contracts
→ first-class EvidenceNeed planning schema
→ harness/skills
→ checkpoint/evidence normalization + typed topology
→ planning-review
→ Verification + EvidenceApplicability
→ checkpoint CAS lease/resume
→ PLAN_GAP/SPEC_GAP replanning/supersession
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
- auth-ui/api/browser.ts
- authenticated auth-ui evidence viewer route/page (new)
- Supabase migration/policies for private gsa-evidence Storage bucket (new)
- docs/architecture/AGENT-HARNESSES.md
- docs/architecture/CORE-RECORD-CONTRACTS.md
- docs/architecture/EXECUTION-AND-REVIEW.md
- docs/architecture/JOB-LIFECYCLE.md
- docs/architecture/STATE-MACHINE.md
- docs/architecture/PROJECT-MEMORY.md
- docs/architecture/DISPATCH-AND-HANDOFF.md
- docs/architecture/BROWSER-QA.md
- skills/gsa-job-runtime/SKILL.md
- relevant evals/ files plus new Tester evals.

Potentially add a dedicated architecture document after M1, e.g.:
- docs/architecture/TESTER-AGENT.md

Do not duplicate Local's spec verbatim. Online canonical documentation should describe the shared semantics plus Online persistence and native-browser runtime differences.

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
13. Do not let required empirical needs live only in prose; REQUIRED EvidenceNeed must have a structural mapping or PLAN_GAP.
14. Do not bind integration checkpoints to one Task when the real boundary needs a prerequisite set/Milestone gate.
15. Do not dispatch a second Tester attempt while a valid checkpoint lease is RUNNING.
16. Do not invalidate reusable evidence solely because an unrelated commit changed; validate declared applicability dimensions.
17. Do not reuse evidence when a required applicability dimension is unknown or changed.
18. Tester may report PLAN_GAP/SPEC_GAP but must never mutate checkpoint/topology; replanning belongs to Planner/Human.

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
| Local CR: empirical need can disappear between Planner and execution | Add first-class evidence_needs[]/UnknownRuntimeFact and require normalization to TestCheckpointSpec + EvidenceRequirement or PLAN_GAP |
| Local CR: checkpoint bound too narrowly | Add AFTER_NODE_SET / BEFORE_NODE / MILESTONE_GATE / JOB_FINAL boundaries with prerequisite node sets |
| Local CR: resume can skip/duplicate Tester | Add per-checkpoint CAS control, execution lease, attempt identity, replay safety and resume recovery |
| Local CR: exact revision evidence validity too rigid/too loose | Add EvidenceApplicability with source/config/runtime/environment dimensions and explicit reuse policy |
| Local CR: no replanning path for new uncertainty | PLAN_GAP/SPEC_GAP pauses dependent graph → Planner revision → Reviewer → optional Human-invoked CR → superseding topology; Tester never mutates graph |

## 33. Target end-state example

~~~text
Planner
  EN1 REQUIRED UnknownRuntimeFact: real readiness/session behavior
  T1 foundation
  T2 integration-a
  T3 integration-b
  CP1 PROBE boundary AFTER_NODE_SET{T2,T3}: satisfies EN1
  T4 implementation consumes EvidenceRequirement(EN1)
  T5 UI shell
  Reviewer
  CP2 VERIFY: deployed UI observation
  T5 remaining feature work
  Reviewer
  CP3 VERIFY: end-to-end flow + relevant regression

Execution:

Coder T1/T2/T3
→ self-check
→ Reviewer where planned/required
→ Tester CP1 PROBE
→ empirical evidence persisted
→ T4 consumes applicability-valid evidence
→ Coder T5
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
