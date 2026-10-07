# Execution and Review Model

## 1. Work hierarchy

```text
Project → Job → Task → Run
```

Milestones/stages are topology elements, not hierarchy nodes.

Job is a finite primary objective, not one role.


### Active Project admission

The opened Project is the operational frame. Before consequential routing or mutation:

1. re-ground the exact Project from durable `PROJECT.md`;
2. require Project lifecycle to permit the action;
3. keep unrelated remembered Projects outside the operational frame unless the Human explicitly references them;
4. if the request belongs to another unrelated Project, surface the mismatch before continuing operational work;
5. external reads may be explicitly user-directed, but they do not widen write scope;
6. Project-owned writes must stay inside that Project's registered owned repository set or its own Memory path.

## 2. Topology

Planner defines:
```text
Milestone | Stage | Handler | Output | Depends on | Next | Review? | Tester? | Human Gate?
```

Coder refines exact source-level HOW.

Standalone `review` Job exists only when review itself is the objective.

### NEXT dispatch admission

For a NEXT Job, dispatch is valid only when all of the following are true:

- the supplied Job snapshot is still the immediate current blob SHA at Run persistence time;
- the requested planning revision equals the Job's current reviewed planning revision;
- every dispatched Task exists in current topology and the role matches its handler;
- every declared Task dependency is proven by a successful COMPLETED NEXT Run snapshot bound to the same Job and planning revision;
- mandatory evidence/checkpoint gates remain satisfied.

A stale Job SHA, stale planning revision, wrong role, or unmet Task prerequisite rejects dispatch. These guards are NEXT-only; historical V2_STABLE dispatch behavior is unchanged.

## 3. Review placement

Normal work is topology-driven; not every Task/PR/milestone/Job receives Reviewer.

## 4. Mandatory review floor

Context-isolated fresh-chat review is mandatory for mechanically sensitive changes:
- shared contracts/interfaces/schema;
- persisted-data migrations/formats;
- auth/permission/security-sensitive logic;
- CI/CD/workflow/deployment config;
- destructive operations;
- dependency manifests/lockfiles that alter runtime/build dependency state.

### Mechanical detection

At PR-ready/handoff:
1. obtain actual changed-file list/operations;
2. compare against Repo Claim sensitive/contract/migration/security path sets;
3. compare against universal patterns such as `.github/workflows/**` and known lockfile filenames;
4. include explicitly planned destructive operation class;
5. compute review-floor trigger independent of Coder self-declaration.

Coder scope claim hints may help early coordination but cannot disable the computed trigger.

Removing a previously planned review remains human-visible.

## 5. Review loop

```text
owner works
→ exact checkpoint target
→ Reviewer evaluates exact revision
→ PASS / PASS_RETEST_REQUIRED
   or CHANGES_REQUIRED / BLOCKED / HUMAN_REVIEW_REQUIRED
→ route by topology
```

Reviewer does not repair source.

## 6. Severity

```text
CRITICAL = always blocking
IMPORTANT = blocking unless explicit human waiver
MINOR = non-blocking
```

## 7. Coder Goal Recheck

Before handoff/PR-ready:
- map every approved current-Task criterion to actual diff/evidence;
- for NEXT, bind each entry to exact task_id and require exact current-Job criterion coverage;
- mark MET/PARTIAL/NOT_MET/UNVERIFIED;
- identify out-of-scope changes;
- fix/escalate applicable gaps.

Self recheck is not context-isolated proof.

## 8. Capability-backed evidence

Objective checks run only when capability is OBSERVED.

A connector action that is merely SURFACE_PRESENT is not relied on as successful operational evidence.

Unavailable/unproven checks remain UNVERIFIED unless another evidence path exists.

## 9. Tester

Tester practical execution is capability-gated and source-read-only.

For an attributed NEXT Reviewer or non-checkpoint Tester Run, PASS/PASS_RETEST_REQUIRED is not a chat-only verdict. The role persists an exact Run-bound `REVIEW` or `TEST` Verification first; `run_complete` consumes its durable snapshot and rejects missing, stale, wrong-run, wrong-target or wrong-planning-revision evidence. Closure revalidates success semantics too: evidence refs must exist, Reviewer success cannot retain CRITICAL/IMPORTANT findings, and Tester success cannot carry a failure class.

At NEXT Job completion, every Reviewer/Tester Task in current topology must be covered by one selected successful current-revision Run and one exact matching durable Verification, both listed in completion evidence. This is the executable Review Coverage Summary gate.


### Evidence modes

```text
VERIFY  = explicit requirement → observed behavior → verdict
MEASURE = observed value/state → measurement
PROBE   = uncertain runtime/tool/capability assumption → empirical fact
```

Rules:
- VERIFY needs an explicit expected behavior; unclear expectation is a `SPEC_GAP`, not an invented acceptance rule.
- MEASURE with no approved threshold returns the measurement and evidence only; it does not invent PASS/FAIL.
- PROBE primarily supplies empirical planning/design evidence and does not by itself change architecture or topology.
- Tester runs at meaningful Planner-declared checkpoints; do not insert Tester after every Task by default.

### Tester readiness

For a concrete capability/check, Tester may record:

```text
DISCOVERED
→ REACHABLE
→ INVOCABLE
→ FUNCTIONAL
→ GOAL_MET
```

This is a finer evidence model layered over the existing global capability states. `SURFACE_PRESENT` remains discovery-only; `OBSERVED` means evidence-backed at the tested level.

### Failure classification

Before routing, Tester distinguishes:

```text
PRODUCT_FAILURE
TEST_FAILURE
ENVIRONMENT_FAILURE
NOT_READY
INTEGRATION_NOT_READY
SPEC_GAP
PLAN_GAP
```

A failing test is not automatically a product bug. Broken test logic is `TEST_FAILURE`; unavailable execution infrastructure is `ENVIRONMENT_FAILURE`; a visible-but-not-callable integration is `INTEGRATION_NOT_READY`; unclear expected behavior is `SPEC_GAP`; missing planning/dependency logic is `PLAN_GAP`.

Tester may state evidence-supported implications, but does not repair product source or mutate topology. Product failures route to the owning implementation work; specification/planning gaps route to Planner/Human as applicable.

### Structured report and Retest

Tester records:
- exact target/ref/revision or state identity;
- mode(s) and planned checks;
- readiness/capability state;
- observations and measurements;
- verdicts only where criteria/thresholds exist;
- failure classification;
- evidence refs;
- limitations and untested areas;
- Retest status / next step.

Retest evidence is revision/state-bound. If relevant source/config/runtime state changes, prior Retest evidence does not silently transfer to the changed scope.

If practical capability is not OBSERVED:

```text
GSA prepares precise Retest
→ human executes
→ GSA records result/evidence
```

Unavailable/unproven execution remains UNVERIFIED or RETEST_REQUIRED, never a fabricated PASS.

## 10. Completion

Job completion follows approved topology + computed mandatory review floor.

No universal final Reviewer gate.

PASS_RETEST_REQUIRED may complete Job while Retest remains pending.

Post-completion Retest FAIL creates linked remediation Job.

## 10A. Trigger-to-invariant translation

When a useful mechanism from another runtime depends on local hooks, watchers, background workers or other unavailable infrastructure, do not copy the trigger literally.

Translate the protected invariant into:

```text
Trigger
→ Required action
→ Evidence
→ Exit condition
```

This translation must preserve the behavioral obligation without inventing unsupported infrastructure.

## 10B. Lessons Learned collection

Lessons Learned collection is continuous.

The shorthand collector is `LLC`. In the current contract LLC is a collector responsibility, not an autonomous workflow mutator.

When real work reveals a workaround, missing contract, repeated ambiguity, unusually hard-to-detect defect or reusable Reviewer/CR/Tester finding:

```text
observe
→ record candidate + evidence + candidate owner
→ dedupe/classify
→ reviewed checkpoint decides implementation
→ eval/pilot/review
→ MERGE into canonical owner
```

LLC never fixes the workflow merely because it recorded the problem. A temporary Human-approved workaround may be evidence of a gap, but does not become canonical by use.

The ownership/disposition ledger is `docs/process/GSA-WORKFLOW-LESSONS-LEDGER.md`.

## 11. Merge authorization coverage

Before requesting merge authorization, generate Review Coverage Summary:
```text
Context-isolated review
CI/checks
Tester
Retest
Self-recheck-only scopes
UNVERIFIED
Waivers
Blockers
Target revision
```

Human then explicitly authorizes merge.

Immediately before merge:
1. re-read the PR/change-set head revision;
2. require it to equal the exact revision covered by the accepted review/evidence and the human authorization;
3. if head changed, invalidate merge authorization for that revision and re-run the required review/coverage path.

Never merge a newer head under authorization granted for an older revision.

## 12. PR / Change Set

PR is delivery surface.

Change Set only for genuine coordinated multi-repo change.

## 13. Run attribution

```text
one execution scope
= Job-level OR one primary Task
+ affected_task_refs[]
```

Child Run has `parent_run_id`.

Source-writing Run includes scope claim.

## 14. Causal routing

```text
implementation defect → active owning Task/work
design defect → Designer/design artifact
architecture/contract/scope defect → Causal Change Review
post-completion Retest FAIL → linked remediation Job
```

## 15. Handoff

```text
Run completes
→ pending Handoff if needed
→ user selects/takes
→ next Run starts
```


## 16. Human-invoked Critic Reviewer

The normal Reviewer remains topology-driven and may be automatically used by the planning loop.

Critic Reviewer (CR) is separate:

```text
Human invokes cr
→ ignore conversation history as evidence
→ reconstruct from durable records + live source
→ independent blind review
→ independent verdict
→ read prior Reviewer result last
→ record CRITIC_REVIEW
→ Human decides next action
```

CR must not be auto-dispatched.

CR is stateless-by-contract. Conversation history is non-authoritative and must not be used as review evidence. **Same-chat invocation is valid**, including after Planner/Reviewer/Coder work in that conversation; CR never blocks merely because the invoking chat previously discussed the target.

CR does not repair source, revise the plan, promote/block/complete the Job, or otherwise mutate Job lifecycle.


## 17. CP4 NEXT empirical planning model

Unknown runtime facts are planning dependencies, not values for Planner/Coder to guess.

For a NEXT Job:

```text
EvidenceNeed / UnknownRuntimeFact
→ TestCheckpointSpec (VERIFY | MEASURE | PROBE)
→ EvidenceRequirement
→ downstream Task
```

A checkpoint may wait for multiple prerequisite nodes and may be placed at `BEFORE_NODE`, `AFTER_NODE_SET`, `MILESTONE_GATE` or `JOB_FINAL`.

Planning-review validates, before READY:
- unique IDs;
- owner/consumer/checkpoint references resolve in the current plan;
- each EvidenceNeed is actually produced by its declared checkpoint and every declared consumer has a matching EvidenceRequirement;
- prerequisite node sets resolve and typed topology has no self-reference or cycle;
- milestone and gate references resolve;
- every Task and checkpoint appears in typed `planning_topology`;
- every CP4 structure is bound to the current `planning_revision`;
- V2_STABLE Jobs carry no active CP4 planning structures.

Once a NEXT Job has an active CP4 evidence graph, no later planning revision may silently inherit it. Planner must explicitly resupply/rebind all CP4 collections for every new planning revision.

CP4 does **not** execute checkpoints. Runtime attempts, claims/leases, replay, crash/restart recovery, RETEST orchestration and EvidenceApplicability enforcement remain CP5.


## 18. CP5 NEXT checkpoint execution and EvidenceApplicability

### Claim / attempt serialization

Each NEXT checkpoint revision has one deterministic claim record. The claim path—not the random attempt ID—is the concurrency serialization point.

```text
deterministic claim
  state = ACTIVE | SATISFIED | OBSERVED | FAILED_PRODUCT | BLOCKED | NEEDS_PLANNER_REVISION
  generation
  attempt_id
  lease_token
  lease_expires_at
  target_revision
  last_verification_id
```

Creating or reclaiming a lease uses exact-SHA optimistic concurrency. Only the current token may produce terminal Tester evidence. An expired lease can be reclaimed; after reclaim, the previous token is stale and its completion is rejected.

The attempt child is append-preserving evidence that execution started. Live/terminal authority comes from the current deterministic claim plus its matching Verification.

### EvidenceApplicability

A TEST/RETEST Verification is applicable only when all are true:
- execution contract is NEXT;
- Job/planning revision and checkpoint match the current plan;
- terminal claim state is satisfying for the checkpoint mode;
- claim `last_verification_id`, `attempt_id` and `lease_token` match the Verification;
- target revision/state identity matches;
- Verification applicability covers the checkpoint EvidenceNeed IDs;
- VERIFY requires PASS; MEASURE/PROBE may use OBSERVED when no verdict threshold exists.

A successful/observed Verification carries `applicability.status=CANDIDATE`. Derived EvidenceApplicability becomes true only when the current terminal claim points to that exact Verification/attempt/token and all revision/target/EvidenceNeed checks match. If terminal claim CAS loses, the candidate is orphaned/non-applicable.

### Runtime gates

Before a NEXT consumer Task starts, every matching `EvidenceRequirement` must have applicable evidence. Milestone gates require their declared gate checkpoints. Job completion requires all planned checkpoint obligations to be applicable.

`PASS_RETEST_REQUIRED` cannot bypass a mandatory evidence/checkpoint gate. It may close only coverage that is explicitly non-blocking.

### Failure and Retest routing

```text
PRODUCT_FAILURE
→ owning Coder repair
→ exact Goal Recheck for repaired target revision
→ RETEST claim
→ Tester

PLAN_GAP / SPEC_GAP
→ terminal claim NEEDS_PLANNER_REVISION
→ Planner revises NEXT IN_PROGRESS Job
→ complete CP4 graph rebound to new planning_revision
→ planning Reviewer
→ PASS resumes dispatch

TEST_FAILURE / ENVIRONMENT_FAILURE / NOT_READY / INTEGRATION_NOT_READY
→ BLOCKED evidence
→ Retest when condition is ready
```

A PRODUCT_FAILURE Retest on the same target revision is rejected. Review-repair revisions after the first PLAN_GAP/SPEC_GAP supersession do not require a duplicate Tester finding; they remain in the same planning-review loop.

V2_STABLE does not read or enforce CP5 claims, checkpoint evidence gates or superseding-plan runtime behavior.

### CP6 durable evidence binding

When Tester produces binary/browser evidence, the bundle object returned by a persistence surface is presentation metadata until publication is attested.

For `PRIVATE_SUPABASE`, `evidence_bundle_attestation_prepare` reads the authenticated manifest row from Supabase and verifies exact manifest SHA, Project/Job/checkpoint/attempt/Tester Run/repository/target binding, artifact bounds and total bundle size.

For `REPOSITORY_GIT`, `evidence_repository_publish_finalize` validates the dedicated evidence ref, exact source revision, append-only parent, immutable commit/manifest/artifact read-back, successful repository capability probe and absence of CI/deploy/release side effects; successful PUBLISH directly emits the canonical `EVIDENCE_BUNDLE / PUBLISHED` attestation record.

The attestation must be persisted append-only and read back as exact `{path,sha,record_text}` before `checkpoint_verification_prepare` can derive bundle refs. Raw `evidence_bundle_refs[]` never authorize TEST/RETEST PASS.

EvidenceApplicability still requires the terminal claim to point to the exact TEST/RETEST Verification. That Verification records both immutable bundle identities and their attestation refs. A mismatch in count/path/SHA/bundle binding keeps the gate closed.

Tester Handoff derives evidence only from the exact successful TEST/RETEST Verification snapshot **and** its current terminal checkpoint claim snapshot. The terminal claim must canonically match the same planning revision/checkpoint, satisfying state, last Verification id, attempt id, lease token and target. An orphan candidate Verification whose claim CAS lost cannot populate Handoff evidence. RETEST uses a new attempt/bundle/attestation identity; previous evidence remains immutable.

V2_STABLE remains inert with respect to CP6 EvidenceBundle rules.

### Boundary readiness

Checkpoint claim readiness is derived from the current reviewed plan, not only from caller timing:

- `AFTER_NODE_SET`: every declared prerequisite node must be durably complete/applicable.
- `MILESTONE_GATE`: runtime prerequisites expand to the milestone's current `node_ids` (excluding the gate checkpoint itself), in addition to explicit prerequisites.
- `JOB_FINAL`: runtime prerequisites expand to all current typed planning nodes except the final checkpoint itself.
- `BEFORE_NODE`: the checkpoint is rejected once its boundary Task is already durably completed.

Task completion IDs supplied to claim preparation must be reconstructed from durable current-revision Run/Verification progress; prerequisite checkpoint state comes from current NEXT claim + applicable Verification records. Chat history or an unverified caller assertion is not completion evidence.


### Durable snapshot consumption

Evidence gate inputs are revision-bound durable snapshots, not free-form JSON:

```text
{ path, sha, record_text }
```

Preparation validates the record contents and deterministic path. The returned external persistence contract requires exact path/SHA/byte read-back immediately before the consequential write.

This applies to:
- consumer Task dispatch;
- prerequisite checkpoint claims;
- Milestone / Job-final readiness;
- NEXT Job completion.

Task prerequisite readiness uses completed current-planning-revision NEXT Run snapshots, not `completed_task_ids`. Old-revision Runs cannot satisfy a new superseding plan.

A nested Verification applicability claim is also revision/checkpoint-bound:
`applicability.planning_revision` and `applicability.checkpoint_id` must equal the current Job/checkpoint before candidate evidence can become applicable.


### CP5 repair — execution-scope and topology hard guards

For NEXT source/design Runs, evidence gating applies to the full attributed execution scope:

- `primary_task_id` must be a current Task;
- every `affected_task_ref` must also be a current Task;
- the Task evidence/checkpoint gate is evaluated for the primary Task and every affected Task before Run creation.

For a Task target, required checkpoint IDs are the union of:
- explicit `EvidenceRequirement.checkpoint_id` values for that consumer Task; and
- direct checkpoint dependencies of the Task node in typed `planning_topology`.

This prevents a Task after a TEST_CHECKPOINT/MILESTONE_GATE from bypassing that checkpoint merely because no duplicate EvidenceRequirement was declared.

NEXT execution topology is mechanically validated alongside the CP4 typed planning graph. Every current Task must appear exactly once with a valid handler; Task dependencies and topology `depends_on` must agree; topology stage/task IDs must be unique. If a NEXT plan revision changes `tasks`, it must resupply coherent execution `topology`; planning review cannot PASS a stale mapping.
