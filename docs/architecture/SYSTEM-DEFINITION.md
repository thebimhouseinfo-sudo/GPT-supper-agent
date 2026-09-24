# System Definition

## Purpose

Current concise system map. Git history contains prior review chronology; this file describes only the current governed architecture.

Status:
```text
GOVERNED_BASELINE = architecture-protected foundation
DEFINED = semantic contract exists
SYNTHESIZED = implementation-relevant relationships specified
OBSERVED = required platform behavior tested
CALIBRATION = Phase-2+ operational tuning
```

## S0 Product boundary — GOVERNED_BASELINE
Conversation UI; GitHub Memory Repo durable Project memory/control plane; separate GitHub source repos remain source truth.

## S1 Project/Memory Repo — GOVERNED_BASELINE / IMPLEMENTED
Per-user private GitHub Memory Repo configuration + path-bounded Project Memory runtime implemented.

## S2 Work hierarchy — GOVERNED_BASELINE
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
Fresh-chat Context-Isolated Reviewer where topology or mechanically computed floor requires it.

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

## S29 Process references

Theory-development process is supporting material, not runtime architecture.

## S30 Current phase gate

```text
PHASE_1 = GOVERNED_BASELINE
PHASE_2_ENTRY = PASS
PHASE_2_STARTED = YES
```

Phase-2 bootstrap/calibration probes still apply before first use of capability areas not yet OBSERVED.
