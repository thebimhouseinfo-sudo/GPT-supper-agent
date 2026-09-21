# Core Record Contracts v1

## Purpose

Define semantic fields/relationships enough that Phase 2 does not invent architecture.

Exact JSON Schema/YAML syntax is implementation detail after these contracts.

## Project

Required:
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
```

Duplicate OWNED claims = governance conflict.

## Job

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
state
result?
linked_job_ids[]
verification_refs[]
asset_requirement_refs[]
retest_refs[]
```

## Embedded Task

```text
task_id
handle?
objective
scope
dependencies[]
completion_criteria[]
state
```

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
state
result?
output_refs[]
verification_refs[]
handoff_ref?
started_at?
ended_at?
```

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
state
successor_run_id?
```

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

Retest extension:
```text
retest_id
steps[]
expected
reason_practical_verification_needed
status = PENDING | BLOCKED | PASS | FAIL | SUPERSEDED
attempt_history[]
originating_job_id
remediation_job_id?
```

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

Only materially consequential gates require durable persistence.

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
human_authorization_ref?
```

## Scope Claim

See ATTRIBUTION-AND-SCOPE-CLAIMS-v1.md.

## CONTROL materialized view

Optional/rebuildable:
```text
project_id
lifecycle
active_job_handles[]
pending_handoff_handles[]
pending_gate_handles[]
pending_retest_handles[]
generated_from_revision/time?
```

No authoritative fact may exist only here.
