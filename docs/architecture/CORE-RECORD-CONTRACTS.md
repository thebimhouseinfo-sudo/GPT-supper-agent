# Core Record Contracts

## Purpose

Define semantic fields/relationships enough that Phase 2 does not invent architecture.

Exact serialization/validation syntax is implementation detail.

## Project

```text
project_id
name
lifecycle
purpose?
repository_mode = SINGLE | MULTI
repo_registry_status
primary_repo
owned_repo_claims[]
referenced_repos[]
created_at?
updated_at?
```

A Project may contain multiple source repositories.

The Project repository registry is durable Project Memory and is Human-confirmed when additional owned/dependent repositories are discovered.

For brownfield work, if live structure/configuration reveals likely sibling/dependent repositories that are missing from the registry, Planner must stop at a Human Gate and request confirmation before finalizing the Job plan.

Every executable Job selects exactly one working_repository, while planning/review still evaluates cross-repository impact across the complete registered Project repo set.

## Repo Claim

```text
repo_ref
relation = OWNED | REFERENCED
project_id
provenance
claimed_at?
sensitive_paths[]?
contract_paths[]?
migration_paths[]?
security_sensitive_paths[]?
```

The declared path sets support mechanical review-floor classification. They are Project/Planner-governed metadata, not Coder self-declaration.

Duplicate OWNED claims = governance conflict.

## Job

Job is a relatively stable planning/control record, not a Run write-back aggregate.

```text
job_id
handle?
project_id
type
objective
scope
non_goals?
tasks[]
topology[]
dependencies[]
completion_requirements
verification_requirements
review_triggers[]
repository_context {
  project_repository_mode
  registered_repositories[]
  working_repository
  cross_repo_impact[]
}
planning_revision
lifecycle
result?
linked_job_ids[]
```

Do **not** store authoritative:
```text
verification_refs[]
asset_requirement_refs[]
retest_refs[]
ordinary Run completion append data
```

These are discovered by querying/joining records carrying job_id/task_id.

Job lifecycle/result updates are performed only by explicit serialized Planner/control/dispatch actions, not independently by completing Runs.

## Embedded Task

```text
task_id
handle?
objective
scope
dependencies[]
required_skills[]?
completion_criteria[]
lifecycle
```

Task progress/completion view may be derived from Runs/Verification rather than every Run mutating the Job record.

## Run

```text
run_id
handle?
project_id
job_id
primary_task_id?
affected_task_refs[]
parent_run_id?
role
target_ref?
target_revision?
scope_claim
input_refs[]
loaded_skills[]?
lifecycle
derived_condition?
result?
output_refs[]
verification_refs[]
handoff_ref?
started_at?
ended_at?
```

`derived_condition` may display WAITING_HUMAN/BLOCKED from Human Gate/blocker records; it is not an authoritative lifecycle state.

## Handoff

```text
handoff_id
project_id
job_id
source_run_id
next_role
primary_task_id?
target_ref?
target_revision?
completed_summary
remaining
required_inputs[]
evidence_bundle_refs[]?
evidence_bundle_attestation_refs[]?
evidence_verification_ref?
evidence_claim_ref?
blocker_or_gate?
expected_next_outcome
created_at?
```

Handoff is immutable after creation.

## Handoff Consumption

```text
consumption_id
handoff_id
project_id
job_id
successor_run_id
consumed_by_role
created_at?
```

Current Handoff state is derived:
- no valid consumption → PENDING;
- one valid consumption → CONSUMED;
- multiple conflicting consumptions → CONFLICTED.

## Verification Record

Common envelope:

```text
verification_id
kind = REVIEW | EVIDENCE | EVIDENCE_BUNDLE | TEST | RETEST | GOAL_RECHECK
project_id
job_id
task_id?
run_id?
target_ref
target_revision
producer
environment?
result
limitations?
evidence_refs[]
evidence_bundle_refs[]?
evidence_bundle_attestation_refs[]?
created_at?
```

Review extension:

```text
review_mode
findings[]
coverage_summary?
```

Finding:

```text
finding_id
severity = CRITICAL | IMPORTANT | MINOR
claim
evidence
rule_or_criterion
routing
waiver_ref?
```

Retest Request:

```text
retest_id
project_id
job_id
task_id?
steps[]
expected
reason_practical_verification_needed
originating_job_id
created_at?
```

Retest attempts are separate append-preserving Verification records with `kind = RETEST` and `retest_id`.

Derived Retest state is computed from those attempt records:
`PENDING | BLOCKED | PASS | FAIL | SUPERSEDED`.

Do not maintain mutable `attempt_history[]` in a shared Retest record.

## Knowledge Artifact

A compact structured envelope may be front matter on a Markdown knowledge file.

```text
knowledge_id
project_id
kind = DECISION | CONTRACT | PLAN | ARCHITECTURE_NOTE | DESIGN
title
revision
validity = CURRENT | REVALIDATED | STALE | SUPERSEDED
depends_on[]
supersedes?
approved_by_or_source?
updated_at?
```

The document body carries human-readable content.

## Asset Requirement

```text
asset_requirement_id
project_id
job_id
task_id?
type
purpose
stable_target_path?
spec
placeholder_ref?
final_asset_ref?
availability
integration_fact?
verification_ref?
state = DEFINED | AVAILABLE | VERIFIED | SUPERSEDED
```

## Human Gate

```text
gate_id
project_id
job_id
target_ref?
decision_required
options?
decision?
human_attribution
state
dependent_work_refs[]
```

## Review Coverage Summary

Required before merge authorization:

```text
context_isolated_review_status
ci_check_status
tester_status
retest_status
self_recheck_only_scopes[]
unverified[]
waivers[]
blockers[]
target_revision
```

May be generated from Verification records rather than permanently embedded in Job.

## Release Record

```text
release_id
project_id
milestone
scope
source_revision?
accepted
merged
deployed
deployment_verified
known_limitations[]
pending_retests[]
review_coverage_summary?
human_authorization_ref?
```

## Scope Claim

See `ATTRIBUTION-AND-SCOPE-CLAIMS.md`.

## CONTROL materialized view

Optional/rebuildable:

```text
project_id
lifecycle
active_job_handles[]
pending_handoff_handles[]
pending_gate_handles[]
pending_retest_handles[]
generated_at?
```

No authoritative fact may exist only here.


## NEXT Checkpoint Claim

CP5 uses one mutable serialization record per Job planning revision + checkpoint. It exists only in NEXT memory.

```text
kind = CHECKPOINT_CLAIM
project_id
job_id
execution_contract = NEXT
planning_revision
checkpoint_id
mode
state
generation
attempt_id
attempt_kind = TEST | RETEST
lease_token
claimant_run_id
lease_expires_at?
target_ref
target_revision
prior_verification_id?
last_verification_id?
last_result?
last_failure_class?
last_target_revision?
retest_required
updated_at
```

The deterministic claim path is the sole authority for the current live lease token. Exact-SHA create/update is the concurrency gate. Random attempt records are never used as a lock.

## NEXT Checkpoint Attempt

Attempt start records are append-preserving children:

```text
kind = CHECKPOINT_ATTEMPT
attempt_id
project_id
job_id
execution_contract = NEXT
planning_revision
checkpoint_id
mode
attempt_kind
lease_token
claimant_run_id
target_ref
target_revision
state = STARTED
retest_of_verification_id?
started_at
```

The attempt child does not store mutable live/terminal authority; the deterministic claim does.

## Tester Verification applicability extension

NEXT TEST/RETEST Verification adds:

```text
planning_revision
checkpoint_id
attempt_id
attempt_kind
lease_token
mode
failure_class?
evidence_bundle_refs[]
evidence_bundle_attestation_refs[]
measurements[]
retest_of_verification_id?
applicability {
  status = CANDIDATE | NON_APPLICABLE
  planning_revision
  checkpoint_id
  evidence_need_ids[]
  target_revision
}
route =
  CONTINUE |
  CODER_REPAIR_GOAL_RECHECK_RETEST |
  PLANNER_REVISION_SUPERSEDE |
  RETEST_WHEN_READY
```

A successful/observed Verification is persisted as `CANDIDATE`, never self-authoritative `APPLICABLE`. Applicability is derived only when the current terminal claim points to the same Verification/attempt/token, target identity and current planning revision. If terminal claim CAS loses, the candidate remains orphaned/non-applicable.

### P2 closure integrity

For NEXT source execution, Goal Recheck criteria are keyed by `task_id + exact completion_criterion` and must exactly cover every approved criterion in the Coder Run Task scope. Reviewer/Tester success is represented by append-preserving `REVIEW` / `TEST` Verification records bound to the exact Run, planning revision and target revision. NEXT Run completion consumes the durable Verification snapshot, not only a path string.

When the Job topology contains Reviewer or Tester Tasks, NEXT Job completion requires selected successful current-revision Run snapshots plus their exact matching `REVIEW` / `TEST` Verification snapshots. Historical `V2_STABLE` Jobs do not activate these P2 guards.

Frontend/UI Coder Tasks declare `required_skills = [ui-coder-frontend]`; dispatch records the loaded skills and rejects the Task when the specialization is not loaded. Non-UI Coder Tasks keep `required_skills=[]`.


### CP6 durable EvidenceBundle applicability

Binary/browser bundle objects are not authority by themselves. CP6 uses an append-only `EVIDENCE_BUNDLE` attestation before a bundle may participate in TEST/RETEST Verification.

Canonical route:

```text
PRIVATE_SUPABASE
→ browser persistence verifies uploads + writes manifest
→ evidence_bundle_attestation_prepare
→ authenticated Supabase manifest row read-back
→ exact manifest SHA + binding/artifact/size validation
→ append-only EVIDENCE_BUNDLE / PUBLISHED attestation

REPOSITORY_GIT
→ bounded PUBLISH prepare/external mutation/finalize
→ evidence_repository_publish_finalize
→ exact source/evidence read-back + append-only/non-force/automation checks
→ append-only EVIDENCE_BUNDLE / PUBLISHED attestation
```

The attestation is persisted under NEXT `VERIFICATION/` and is consumed only as an exact durable snapshot:

```text
{ path, sha, record_text }
```

`checkpoint_verification_prepare` accepts `evidence_bundle_attestation_snapshots[]`, validates every attestation against the current Project/Job/checkpoint/attempt/Tester Run/working repository/target revision, and only then derives:
- `evidence_bundle_refs[]` for Human-facing immutable identity;
- `evidence_bundle_attestation_refs[]` for durable provenance.

Raw caller-supplied `evidence_bundle_refs[]` cannot authorize PASS/OBSERVED.

Tester Handoff does not accept raw bundle authority either. It consumes both the exact successful TEST/RETEST Verification snapshot and the current terminal checkpoint claim snapshot. The claim must be the canonical deterministic claim for the same planning revision/checkpoint and must currently point to the same Verification/attempt/lease token/target with a satisfying terminal state. The Verification must also be included in the Run's `verification_refs[]`. Only then may Handoff derive bundle/attestation refs. The Handoff records both `evidence_verification_ref` and `evidence_claim_ref`.

Backend identity remains immutable:

```text
PRIVATE_SUPABASE
→ evidence_bundle_id
→ db:gsa_evidence_bundles/<bundle-id>
→ manifest_sha256
→ authenticated stable viewer URL
→ signed object URLs are transport only

REPOSITORY_GIT
→ publication_mode = PUBLISH
→ dedicated gsa-evidence/<project-id> ref
→ immutable evidence_commit_sha
→ manifest_sha256 + commit-pinned Human URL
→ durable successful PROBE-GIT-EVIDENCE-01 Verification path + blob SHA
```

A stale, mutable, target/attempt/run-mismatched, unauthenticated, unpublished, orphaned or automation-side-effecting bundle/attestation is non-applicable. RETEST creates a new attempt and therefore a new immutable bundle + attestation identity; prior Verification/Handoff refs remain resolvable.

V2_STABLE does not require or interpret CP6 EvidenceBundle attestations.

## NEXT in-progress planning supersession

A NEXT `IN_PROGRESS` Job may create a new planning revision only from a persisted current-revision PLAN_GAP/SPEC_GAP Tester Verification whose terminal claim points to that Verification, or as a direct repair of a `CHANGES_REQUIRED` review on that already-superseding revision.

The Job remains `IN_PROGRESS`; the new revision resets `planning_review=PENDING` and blocks further NEXT dispatch until Reviewer PASS.


### Tester Run ownership of checkpoint attempts

A checkpoint lease is not valid from an arbitrary `claimant_run_id`. Claim preparation must receive the exact durable NEXT Tester Run snapshot and blob SHA, and external persistence must read it back before mutating the claim.

Required claimant facts:

```text
role = tester
lifecycle = IN_PROGRESS
execution_contract = NEXT
same project_id / job_id / run_id
same exact target_ref / target_revision when bound
```

Terminal TEST/RETEST Verification repeats the same Run-ownership read-back before persistence. This keeps checkpoint execution attributed to a real Tester Run rather than an invented UUID.


### Durable checkpoint evidence snapshots

CP5 gate evaluation never treats caller-supplied record JSON or bare Task IDs as durable evidence.

Every claim/Verification/Run consumed by a consequential NEXT gate is supplied as:

```text
DurableRecordSnapshot {
  path
  sha
  record_text
}
```

The snapshot must satisfy both semantic identity and deterministic path identity. Before the prepared consequential mutation (Run creation, checkpoint claim mutation, Job completion), the caller must read back the exact path and require the current Git blob SHA and record bytes to match the supplied snapshot.

For checkpoint evidence:
- claim path must equal `checkpointClaimPath(project, job, planning_revision, checkpoint)`;
- TEST/RETEST Verification path must equal the deterministic NEXT Verification path;
- a gate accepts exactly one current deterministic claim and exactly one referenced Verification.

For prerequisite Tasks, completion is not a bare Task ID. It is derived from a durable NEXT Run snapshot that is:
- for the same Project/Job;
- bound to the current `planning_revision`;
- `COMPLETED` with `PASS | PASS_RETEST_REQUIRED`;
- bound to the prerequisite `primary_task_id`;
- produced by the handler declared by the current topology.

NEXT Run records therefore carry `planning_revision`. Historical V2_STABLE Run shape remains unchanged.


## NEXT execution-topology coherence

CP5 runtime still consumes the Job's execution `topology[]` for handler attribution while CP4 typed `planning_topology[]` expresses Task/checkpoint dependency semantics. Both must remain coherent.

For NEXT:
- every current Task appears exactly once in execution topology;
- stage numbers and topology Task IDs are unique;
- handler is one of Planner/Designer/Coder/Reviewer/Tester;
- Task dependencies reference current Tasks, are unique, and do not self-reference;
- topology `depends_on` matches the owning Task dependencies;
- `next`, when present, points to another current Task;
- revising `tasks` requires resupplying execution `topology`.

Planning review validates this mechanically before a NEXT revision can dispatch.
