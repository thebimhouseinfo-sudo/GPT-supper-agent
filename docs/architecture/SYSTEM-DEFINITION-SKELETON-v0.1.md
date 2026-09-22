# System Definition Skeleton v1.3

## Purpose

Current Phase-1 map after Claude peer-review rounds 1 and 2, accepted fix passes, and mandatory platform probes.

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
Project raw Drive file create/read/update round-trip observed.

## S2 Work hierarchy — FROZEN
```text
Project → Job → Task → Run
```
Multi-role Job; one active role per Run.

## S3 Repository model — SYNTHESIZED
Structured OWNED/REFERENCED claims + review-sensitive path sets.

## S4 Project Memory — SYNTHESIZED / OBSERVED
Read-time join:
- stable Job planning/control record;
- completing Runs do not write back progress/reference arrays;
- Runs/Verification append-preserving;
- Knowledge artifacts structured;
- CONTROL rebuildable cache.
Raw Drive persistence path observed.

## S5 State — SYNTHESIZED
Lifecycle/result/validity/facts separated.
WAITING/BLOCKED/WAITING_HUMAN derived where applicable.

## S6 Orchestrator — DEFINED
Implicit harness responsibility set; no always-running engine.

## S7 Planner — DEFINED
Planning/topology/readiness + review-sensitive metadata.

## S8 Designer — DEFINED
Visual/design specialist; child Run supported.

## S9 Coder — DEFINED
Source HOW, scope claim, Goal Recheck; cannot self-disable review floor.

## S10 Reviewer — SYNTHESIZED
Fresh-chat independent Reviewer when topology or computed floor requires it.

## S11 Tester — DEFINED / CALIBRATION
Practical execution remains runtime-capability-gated; human Retest fallback is complete.

## S12 QA/QC — SYNTHESIZED
Capability-backed evidence + Goal Recheck + independent evaluation where required.

## S13 Handoff — SYNTHESIZED
Current-Project default; root-wide shallow discovery when no Project open.

## S14 Context Builder — DEFINED
Minimum sufficient context.

## S15 Human Gate — DEFINED
Explicit human authority.

## S16 Verification/Evidence — SYNTHESIZED
Provenance/target/revision + fail-safe causal validity.

## S17 Capability — SYNTHESIZED / MUST PROBES COMPLETE
Evidence states:
```text
OBSERVED
SURFACE_PRESENT
UNAVAILABLE
UNKNOWN
```
Required Phase-1 Drive/binary/merge probes completed.

## S18 Multi-repo — DEFINED
Change Set only when coordinated.

## S19 Governance — SYNTHESIZED
Identity, attribution, scope claims, read-time joins, merge coverage, causal revalidation.

## S20 Security — SYNTHESIZED
External content untrusted; consequential-action recheck.

## S21 Asset — SYNTHESIZED
Stable integration contract; binary GitHub persistence path observed.

## S22 Retest — SYNTHESIZED
Post-completion FAIL → linked remediation Job.

## S23 Release/Completion — SYNTHESIZED
Topology + computed review floor + explicit human merge authorization.

## S24 UX/Dispatch — SYNTHESIZED
Deterministic Handoff discovery/selection.

## S25 Failure/Recovery — DEFINED
Smallest causal recovery.

## S26 Harness Quality — DEFINED / CALIBRATION
Phase-2 behavioral eval loop.

## S27 Schemas — SYNTHESIZED
Includes Knowledge Artifact and Review Coverage Summary.

## S28 Implementation architecture — READY SUBJECT TO FINAL CONSISTENCY REVIEW

No unresolved mandatory platform probe remains.

## S29 Theory process
See THEORY-PROCESS-v1.md.

## S30 Current gate

```text
PEER_REVIEW_ROUND_1 = COMPLETE
PEER_REVIEW_ROUND_2 = COMPLETE
ROUND_2_FIX_PASS = COMPLETE
MISSING_CONTRACTS = COMPLETE
MUST_PLATFORM_PROBES = COMPLETE
FINAL_CONSISTENCY_REVIEW = PENDING
PHASE_2_ENTRY = BLOCKED UNTIL FINAL CONSISTENCY REVIEW
```
