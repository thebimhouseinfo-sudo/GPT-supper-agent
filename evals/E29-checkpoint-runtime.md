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
- applicability covers checkpoint EvidenceNeed IDs.

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
