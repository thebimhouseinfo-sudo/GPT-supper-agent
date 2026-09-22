# System Definition Skeleton v1.2

## Purpose

Current map after peer-review rounds 1 and 2 plus accepted fix passes.

Status:
```text
FROZEN = accepted foundation
DEFINED = semantic contract exists
SYNTHESIZED = implementation-relevant relationships specified
PROBE_REQUIRED = platform evidence still required
CALIBRATION = Phase-2+ operational tuning
```

## S0 Product boundary — FROZEN
Foundation/Architecture.

## S1 Project/Drive — FROZEN
Project root, PROJECT.md, lifecycle, ownership/reference.

## S2 Work hierarchy — FROZEN
```text
Project → Job → Task → Run
```
Multi-role Job; one active role per Run.

## S3 Repository model — SYNTHESIZED
Structured repo claims + declared review-sensitive path sets; duplicate OWNED claim = human-governed conflict.

## S4 Project Memory — SYNTHESIZED
Read-time join model:
- stable Job planning/control record;
- Tasks/topology embedded by default;
- completing Runs never write progress/reference arrays back into Job;
- Runs/Verification append-preserving;
- Knowledge artifacts have structured metadata;
- CONTROL rebuildable cache.

## S5 State — SYNTHESIZED
Lifecycle/result/validity/facts separated.
WAITING/BLOCKED/WAITING_HUMAN primarily derived conditions.

## S6 Orchestrator — DEFINED
Implicit harness responsibility set; no always-running engine.

## S7 Planner — DEFINED
Finite-work planning/topology/capability/readiness + review-sensitive repo metadata.

## S8 Designer — DEFINED
Visual/design specialist; may use child Run.

## S9 Coder — DEFINED
Source HOW, scope claim, Goal Recheck; cannot self-disable mechanical review floor.

## S10 Reviewer — SYNTHESIZED
Fresh-chat independent review where topology or computed mandatory floor requires it.

## S11 Tester — DEFINED / PROBE_REQUIRED
Practical execution only when runtime capability OBSERVED; otherwise human Retest.

## S12 QA/QC — SYNTHESIZED
Capability-backed checks + Goal Recheck + independent Reviewer/Tester paths.

## S13 Handoff — SYNTHESIZED
Current-Project dispatch by default; root-wide shallow discovery when no Project is open.

## S14 Context Builder — DEFINED
Minimum sufficient context.

## S15 Human Gate — DEFINED
Explicit human authority; shared identity never substitutes.

## S16 Verification/Evidence — SYNTHESIZED
Target/revision/provenance; causal fail-safe invalidation.

## S17 Capability — PROBE_REQUIRED
Capability evidence states:
```text
OBSERVED
SURFACE_PRESENT
UNAVAILABLE
UNKNOWN
```
MUST probes remain before Phase 2.

## S18 Multi-repo — DEFINED
Change Set only when logically coordinated.

## S19 Governance — SYNTHESIZED
Global identity, attribution, scope claims, read-time joins, merge coverage, fail-safe causal revalidation.

## S20 Security — SYNTHESIZED
External content untrusted; consequential-action recheck.

## S21 Asset — SYNTHESIZED
Compact lifecycle and stable integration contract.

## S22 Retest — SYNTHESIZED
Post-completion FAIL creates linked remediation Job.

## S23 Release/Completion — SYNTHESIZED
Topology + computed review floor + human merge authorization.

## S24 UX/Dispatch — SYNTHESIZED
Outer PROJECT / DIRECT AGENT / HELP plus deterministic Handoff discovery/selection.

## S25 Failure/Recovery — DEFINED
Smallest causal recovery; append observed partial effects.

## S26 Harness Quality — DEFINED / CALIBRATION
Behavioral eval loop in Phase 2+.

## S27 Schemas — SYNTHESIZED
Includes Knowledge Artifact + Review Coverage Summary.

## S28 Implementation architecture — BLOCKED

Do not enter Phase 2 until:
- Round-2 fixes complete;
- MUST platform probes execute/classify;
- final consistency review passes.

## S29 Theory process
See THEORY-PROCESS-v1.md.

## S30 Current gate

```text
PEER_REVIEW_ROUND_1 = COMPLETE
PEER_REVIEW_ROUND_2 = COMPLETE / FINDINGS ACCEPTED
ROUND_2_FIX_PASS = COMPLETE
MISSING_CONTRACTS = COMPLETE
PLATFORM_PROBES = MUST PROBES PENDING
CONSISTENCY_REVIEW = PENDING AFTER PROBES
PHASE_2_ENTRY = BLOCKED
```
