# SYNTHESIS — Core Schemas v1

## Status

```text
LOOP_STAGE = SYNTHESIZE
PASS = 01
DOMAIN = CORE SCHEMAS
STATUS = SYNTHESIZED_DRAFT
CANONICAL = false
```

Schemas below define semantic fields. Exact serialization validation may be implemented later.

---

## 1. Common metadata

Durable entities intended for detached durable reference use globally unique IDs.

Durable entities SHOULD include:

```text
id
type
version
created_at?
updated_at?
created_by_run?
validity
revision_token
```

Timestamps are optional where platform cannot provide reliable values.

---

## 2. Project

```yaml
id:
name:
lifecycle: ACTIVE | PAUSED | ARCHIVED
purpose:
owned_repositories: []
referenced_repositories: []
current_release_milestones: []
```

Repository relation:

```yaml
repo:
relation: OWNED | REFERENCED
role:
provenance:
attached_at:
detached_at:
transfer_ref:
```

---

## 3. Job

```yaml
id:
project_id:
type: plan | code | design | review | <future>
state:
result:
objective:
scope:
non_goals: []
dependencies: []
task_refs: []
milestones: []
participant_roles: []
review_requirements: []
tester_requirements: []
human_gate_refs: []
asset_requirement_refs: []
retest_refs: []
delivery_refs: []
supersedes_job_id:
derived_from_job_id:
```

Job type immutable after creation.

---

## 4. Task

```yaml
id:
project_id:
job_id:
state:
objective:
scope:
dependencies: []
repo_scope: []
path_scope: []
completion_criteria: []
run_refs: []
findings: []
asset_requirement_refs: []
retest_refs: []
cancel_reason:
supersedes_task_id:
```

---

## 5. Run

```yaml
id:
project_id:
job_id:
role:
state:
primary_task_id:
affected_task_refs: []
input_refs: []
target:
  type:
  ref:
  revision:
result:
evidence_refs: []
previous_run_id:
next_handoff_id:
blocker:
started_at:
ended_at:
```

Execution scope:
- Job-level when `primary_task_id = null`;
- Task-level when one primary Task exists.

---

## 6. Handoff

```yaml
id:
project_id:
job_id:
source_run_id:
state: PENDING | BLOCKED | CONSUMED | SUPERSEDED
target_role:
primary_task_id:
affected_task_refs: []
target:
  type:
  ref:
  revision:
completed_summary:
remaining_work:
required_inputs: []
blocker:
human_gate_ref:
successor_run_id:
superseded_by_handoff_id:
```

---

## 7. Human Gate / Approval

```yaml
id:
project_id:
job_id:
type:
target:
decision_required:
options: []
decision:
scope:
waiver_for_finding_id:
dependent_refs: []
approved_by: human
```

Only persist when materially consequential.

---

## 8. Review

```yaml
id:
project_id:
job_id:
reviewer_run_id:
mode:
target:
  type:
  ref:
  revision:
result:
finding_refs: []
evidence_refs: []
previous_review_id:
```

Finding is embedded in Review by default but retains a globally unique ID:

```yaml
id:
review_id:
severity: CRITICAL | IMPORTANT | MINOR
scope:
rule_or_acceptance:
evidence_refs: []
description:
required_action:
subjective: true | false
waiver_ref:
resolved_by_run_id:
```

---

## 9. Evidence

```yaml
id:
type:
producer_run_id:
source:
target:
  type:
  ref:
  revision:
environment:
observation:
provenance: OBSERVED | INFERRED | USER_CONFIRMED | PARTIAL | UNAVAILABLE
validity:
related_refs: []
```

No numeric confidence required.

---

## 10. Retest

```yaml
id:
project_id:
job_id:
primary_task_id:
related_task_refs: []
status: PENDING | BLOCKED | PASS | FAIL | SUPERSEDED
source_revision:
merged_revision:
environment:
what_to_test:
steps: []
expected:
why_required:
related_refs: []
attempts: []
superseded_by_retest_id:
```

Attempt:

```yaml
attempt_no:
result: PENDING | BLOCKED | PASS | FAIL
reported_by:
observed:
evidence_refs: []
revision:
```

---

## 11. Asset Requirement

```yaml
id:
project_id:
job_id:
task_id:
type:
state:
purpose:
final_filename:
final_path:
format:
dimensions:
source_text:
prompt:
placeholder_strategy:
acceptance:
dependencies: []
final_asset_ref:
integration_refs: []
retest_refs: []
```

---

## 12. Capability

```yaml
capability:
state: AVAILABLE | UNAVAILABLE | UNKNOWN
executor:
scope:
verified_at:
source:
enforcement: HARD | SOFT | UNKNOWN
limitations: []
last_observed_only: true
```

Derived execution mode may be:
```text
NORMAL
DEGRADED
BLOCKED
```

but is not capability state.

---

## 13. Release milestone

```yaml
id:
project_id:
name:
date:
scope:
revision_refs: []
tag_or_release:
accepted_result:
delivery_facts:
  merged:
  deployed:
  deployment_verified:
known_limitations: []
pending_retest_refs: []
human_gate_ref:
```

---

## 14. CONTROL.json conceptual schema

```yaml
project_id:
project_lifecycle:
revision_token:
active_job_refs: []
waiting_job_refs: []
blocked_job_refs: []
pending_handoff_refs: []
pending_human_gate_refs: []
pending_retest_refs: []
current_release_refs: []
last_updated_at:
```

This is a current snapshot/index, not historical truth by itself.


---

## 15. Job tombstone

Used only when deletion must preserve identity for surviving durable references:

```yaml
id:
project_id:
type: job_tombstone
deleted_at:
deletion_reason:
former_job_type:
former_objective_summary:
surviving_reference_refs: []
```

Do not preserve ordinary Job content in the tombstone.

---

## 16. Milestone / stage

Milestones/stages remain embedded inside Job `milestones[]`.

They may have local IDs for intra-Job references but are not promoted to top-level durable entities initially.

---

## 17. Direct Agent promotion

Promotion does not serialize the whole prior conversation.

Persist only:
- useful accepted outputs;
- relevant target/source refs;
- decisions that must survive;
- new Project/Job relationship created by promotion.

---

## 18. Capability freshness

Stored capability data represents last observed state.

Before consequential execution, refresh capability when permissions/runtime/tool availability may have changed.


---

## 19. Cross-Project reference

Cross-Project references are weak/provenance records:

```yaml
target_project_id:
target_entity_id:
summary:
repo_ref:
revision:
captured_at:
```

They must not require the target Project's internal record to remain available forever.

---

## 20. CONTROL rebuild invariant

Any field in CONTROL.json must be derivable from durable Project records or current Project lifecycle metadata.

CONTROL must not be the sole source of a historical fact.

---

## 21. BLOCKED semantics

```text
entity.state = BLOCKED
```
means current workflow cannot progress.

```text
result = BLOCKED
```
means an evaluation/execution could not complete judgement.

Do not mirror one automatically into the other.
