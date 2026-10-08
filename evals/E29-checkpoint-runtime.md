# E29 — NEXT checkpoint runtime, recovery and EvidenceApplicability

Status: CP5 eval contract

## Purpose

Prove that CP4 planning structures can be executed safely in NEXT without changing V2_STABLE behavior.

## E29-01 deterministic single-live claim

Given one NEXT Job planning revision and checkpoint:

1. claimant A prepares a claim when no claim exists;
2. persist the deterministic claim path;
3. claimant B prepares from the same missing/stale snapshot.

Expected:
- the deterministic path is identical for both;
- only one create/exact-SHA update can win;
- the losing claimant must refetch;
- two random attempt IDs can never both become live authority.

## E29-02 replay by same claimant

Given a non-expired ACTIVE claim owned by the same Tester Run and target revision:

Expected:
- checkpoint_claim_prepare returns REUSE;
- same attempt_id and lease_token are returned;
- no second attempt record is created.

## E29-03 lease expiry / crash recovery

Given an ACTIVE claim whose lease expired before Verification:

Expected:
- a new exact-SHA claim update increments generation;
- new attempt_id/lease_token become current;
- the old token cannot prepare/finalize Verification.

## E29-04 orphan Verification is non-applicable

Persist TEST Verification but simulate claim CAS failure before terminal claim update.

Expected:
- downstream gate rejects it because current claim.last_verification_id/attempt/token do not point to that Verification.

## E29-05 VERIFY applicability

For VERIFY:
- terminal claim SATISFIED;
- matching TEST/RETEST Verification result PASS;
- same current planning_revision, checkpoint, attempt/token and target revision;
- Verification applicability status is CANDIDATE and covers checkpoint EvidenceNeed IDs;
- the current terminal claim finalizes that candidate by pointing to the same verification/attempt/token.

Expected: dependent EvidenceRequirement gate opens.

Any stale/mismatched field => blocked.

## E29-06 MEASURE/PROBE observation

For MEASURE or PROBE without an approved verdict threshold:

Expected:
- OBSERVED + evidence/measurement may become applicable;
- runtime does not require an invented PASS verdict.

VERIFY + OBSERVED => reject/non-applicable.

## E29-07 PRODUCT_FAILURE repair → Goal Recheck → RETEST

1. current attempt returns FAIL / PRODUCT_FAILURE;
2. terminal claim becomes FAILED_PRODUCT + retest_required;
3. RETEST on same target revision is rejected;
4. Coder repairs to new target revision;
5. exact GOAL_RECHECK for repaired revision is persisted;
6. RETEST references prior Verification and repaired Goal Recheck.

Expected: RETEST claim allowed only after steps 4–5.

## E29-08 PLAN_GAP / SPEC_GAP supersession

1. Tester returns PLAN_GAP or SPEC_GAP;
2. terminal claim becomes NEEDS_PLANNER_REVISION;
3. same-revision RETEST is rejected;
4. Planner revises the IN_PROGRESS NEXT Job using that terminal claim + Verification;
5. all CP4 collections are rebound to planning_revision N+1;
6. planning_review resets PENDING;
7. dispatch/claim is blocked until Reviewer PASS;
8. Reviewer CHANGES_REQUIRED may produce N+2 without a second Tester gap finding.

Expected: old revision claims/Verifications are automatically non-applicable.

## E29-09 mandatory EvidenceRequirement blocks consumer

Given a consumer Task with EvidenceRequirement and no applicable checkpoint evidence:

Expected:
- run_begin returns EVIDENCE_REQUIREMENT_BLOCKED.

After applicable terminal claim + Verification:

Expected:
- Task dispatch is allowed.

## E29-10 Milestone / Job completion guard

Missing, failed, blocked, stale or pending-retest mandatory checkpoint evidence:

Expected:
- Milestone gate evaluation is blocked;
- NEXT Job completion is blocked for both PASS and PASS_RETEST_REQUIRED.

PASS_RETEST_REQUIRED may close only explicitly non-blocking coverage.

## E29-11 V2_STABLE compatibility

Given V2_STABLE Job:
- run_begin uses legacy path;
- checkpoint claims/evidence are not required;
- job completion ordering/semantics remain unchanged.

Expected: CP5 helpers are inert for V2_STABLE.

## E29-12 CP6 non-activation

Inspect CP5 diff.

Expected:
- no screenshot/evidence artifact storage backend;
- no Human evidence manifest/presentation contract;
- no production main/gsa-mcp activation.


## E29-13 boundary readiness

- AFTER_NODE_SET requires all explicit prerequisite nodes.
- MILESTONE_GATE expands prerequisites to the current milestone node set.
- JOB_FINAL expands prerequisites to all current typed planning nodes except itself.
- BEFORE_NODE is rejected if the boundary Task is already durably completed.

Expected: a checkpoint cannot be claimed before its semantic boundary is ready, even when its explicit prerequisite_node_ids are incomplete/empty.

## E29-14 prerequisite evidence source

Supply a prerequisite Task ID without durable completion evidence, or a prerequisite checkpoint without a current applicable terminal claim/Verification.

Expected: claim is blocked. completed_task_ids must be derived from durable current-revision progress rather than conversation memory.


## E29-15 Tester Run ownership

Try to claim or finalize a checkpoint using:
- a nonexistent/fabricated claimant_run_id;
- a Coder/Reviewer Run;
- a terminal Tester Run;
- a Tester Run for another Job/target.

Expected: reject.

With an IN_PROGRESS NEXT Tester Run for the exact target, deterministic claim acquisition may proceed. Before persistence, the caller must read back the Run and require the exact blob SHA supplied to claim/verification preparation.


## E29-16 reclaim preserves attempt kind

Start a RETEST, let its ACTIVE lease expire, then attempt to reclaim it as TEST.

Expected: reject. Expired-lease recovery must preserve the original attempt_kind; an expired RETEST may only be reclaimed as the same RETEST target/originating Verification.

## E29-17 deterministic claim snapshot uniqueness

Supply two claim snapshots for the same project/job/planning_revision/checkpoint to a gate/prerequisite evaluation.

Expected: blocked rather than selecting one by caller-controlled array order. Runtime evidence evaluation accepts exactly one current deterministic claim and exactly one referenced Verification.

## E29-18 applicability identity consistency

Mismatches in claim/Verification mode, attempt_kind, producer, terminal state/result, attempt ID, lease token or last_result make evidence non-applicable.

Expected: no field-order or partially matching record can open a mandatory evidence gate.


## E29-19 fabricated raw evidence cannot open a gate

Attempt to satisfy a consumer or Job gate using only JSON with matching IDs/tokens but without a durable snapshot path/blob SHA.

Expected: rejected by tool schema / snapshot parser. Gate inputs require `{path, sha, record_text}`.

Use a valid-looking claim record under the wrong path.

Expected: rejected because the path is not the deterministic current-revision claim path.

## E29-20 prerequisite Task completion is revision-bound

Provide a COMPLETED PASS NEXT Run for the prerequisite Task from planning revision N while the Job is at revision N+1.

Expected: checkpoint claim is blocked.

Provide a current-revision COMPLETED Run whose role does not match the current topology handler.

Expected: blocked.

Only an exact current-revision successful Run snapshot at the deterministic NEXT Run path may satisfy the Task prerequisite.

## E29-21 exact snapshot read-back before consequential write

For Run dispatch, checkpoint claim preparation and NEXT Job completion, supply valid snapshots but mutate one durable record before the prepared write.

Expected: external persistence contract detects blob-SHA mismatch on immediate read-back and must refetch/re-evaluate rather than persisting the stale prepared transition.

## E29-22 nested applicability binding

Change only `verification.applicability.planning_revision` or `verification.applicability.checkpoint_id` while all outer Verification fields still match.

Expected: evidence is non-applicable and the mandatory gate stays blocked.


## E29-23 affected-task evidence-gate bypass

Create a NEXT Coder/Designer Run with:
- an unblocked primary Task;
- an affected Task whose EvidenceRequirement/checkpoint is unsatisfied.

Expected: run_begin rejects the Run and identifies the affected Task as evidence-blocked.

Also supply an affected_task_ref that is not a current Task.

Expected: NEXT_TASK_BINDING_REJECTED.

## E29-24 typed checkpoint dependency gate

Create a Task node whose typed planning_topology directly depends on a TEST_CHECKPOINT or MILESTONE_GATE, but omit a duplicate EvidenceRequirement.

Expected: Task dispatch is blocked until that checkpoint has one current applicable terminal claim + Verification.

## E29-25 execution-topology coherence during supersession

For a NEXT planning revision:
- change tasks while omitting topology;
- provide duplicate/missing Task stages;
- mismatch Task.dependencies versus topology.depends_on;
- use an invalid handler or stale Task ID.

Expected: job revision/planning review rejects the plan. A coherent tasks+topology pair is required before Reviewer PASS and runtime resume.
