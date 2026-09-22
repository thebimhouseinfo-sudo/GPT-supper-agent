# System Definition Skeleton v1.4

## Purpose

Current system map at Phase-1 close after Claude peer-review rounds 1 and 2, all accepted fix passes, mandatory platform probes, and final consistency review.

Status:
```text
FROZEN = accepted foundation
DEFINED = semantic contract exists
SYNTHESIZED = implementation-relevant relationships specified
OBSERVED = required platform behavior tested
CALIBRATION = Phase-2+ operational tuning
```

## S0 Product boundary — FROZEN
Conversation UI; Drive durable Project memory/control plane; GitHub source truth.

## S1 Project/Drive — FROZEN / OBSERVED
Raw Drive Project-memory file create/read/update/delete path observed.

## S2 Work hierarchy — FROZEN
```text
Project → Job → Task → Run
```
Multi-role Job; one active role per Run.

## S3 Repository model — SYNTHESIZED
Structured OWNED/REFERENCED claims + sensitive path metadata.

## S4 Project Memory — SYNTHESIZED / OBSERVED
Read-time join model; no Run write-back hot file.

## S5 State — SYNTHESIZED
Lifecycle/result/validity/facts separated; waiting/blocking primarily derived.

## S6 Orchestrator — DEFINED
Implicit harness responsibility set.

## S7 Planner — DEFINED
Planning/topology/readiness + repo review-sensitive metadata.

## S8 Designer — DEFINED
Visual/design specialist; child Run supported.

## S9 Coder — DEFINED
Source HOW + scope claim + Goal Recheck.

## S10 Reviewer — SYNTHESIZED
Fresh-chat independent Reviewer where topology or mechanically computed floor requires it.

## S11 Tester — DEFINED / CALIBRATION
Runtime capability-gated; human Retest fallback complete.

## S12 QA/QC — SYNTHESIZED
Observed capability checks + Goal Recheck + independent evaluation.

## S13 Handoff — SYNTHESIZED
Current-Project default; shallow cross-Project discovery when none open.

## S14 Context Builder — DEFINED
Minimum sufficient context.

## S15 Human Gate — DEFINED
Explicit human authority.

## S16 Verification/Evidence — SYNTHESIZED
Target/revision/provenance + fail-safe causal validity.

## S17 Capability — SYNTHESIZED / OBSERVED
Evidence states:
```text
OBSERVED
SURFACE_PRESENT
UNAVAILABLE
UNKNOWN
```
Phase-1 MUST probes complete.

## S18 Multi-repo — DEFINED
Change Set only for coordinated change.

## S19 Governance — SYNTHESIZED
Identity, attribution, scope claims, read-time joins, merge coverage, causal validity.

## S20 Security — SYNTHESIZED
Untrusted external content; consequential-action recheck.

## S21 Asset — SYNTHESIZED
Stable asset contract; GitHub binary commit path observed.

## S22 Retest — SYNTHESIZED
Post-completion FAIL → linked remediation Job.

## S23 Release/Completion — SYNTHESIZED
Topology + computed review floor + explicit human merge authorization.

## S24 UX/Dispatch — SYNTHESIZED
Deterministic Handoff discovery and selection.

## S25 Failure/Recovery — DEFINED
Smallest causal recovery.

## S26 Harness Quality — DEFINED / CALIBRATION
Phase-2 behavioral eval loop.

## S27 Schemas — SYNTHESIZED
Knowledge Artifact + Review Coverage Summary included.

## S28 Implementation architecture — READY FOR PHASE 2

Phase 2 may implement the thin harness/skills/actions without inventing material product/architecture/governance semantics.

## S29 Theory process
See THEORY-PROCESS-v1.md.

## S30 Phase-1 gate

```text
PEER_REVIEW_ROUND_1 = COMPLETE
PEER_REVIEW_ROUND_2 = COMPLETE
ROUND_2_FIX_PASS = COMPLETE
MISSING_CONTRACTS = COMPLETE
MUST_PLATFORM_PROBES = COMPLETE
FINAL_CONSISTENCY_REVIEW = PASS
PHASE_1 = CLOSED
PHASE_2_ENTRY = READY
PHASE_2_STARTED = NO
```

Phase-2 bootstrap/calibration probes still apply before first use of capability areas not yet OBSERVED.
