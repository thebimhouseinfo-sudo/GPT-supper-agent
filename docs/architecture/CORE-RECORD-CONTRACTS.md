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
owned_repo_claims[]
referenced_repos[]
created_at?
updated_at?
```

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
kind = REVIEW | EVIDENCE | TEST | RETEST | GOAL_RECHECK
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

See `ATTRIBUTION-AND-SCOPE-CLAIMS-v1.md`.

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
