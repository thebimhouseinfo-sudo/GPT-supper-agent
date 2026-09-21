# System Definition Skeleton v1.1

## Purpose

Current map after internal review + external peer review disposition + Phase-1 fix pass.

Status vocabulary:

```text
FROZEN
= foundational semantic invariant accepted

DEFINED
= semantic boundary and required contract exist

SYNTHESIZED
= implementation-relevant record/interface details are specified enough that Phase 2 should not invent product/architecture semantics

PROBE_REQUIRED
= platform behavior must be observed before claiming capability/enforcement

CALIBRATION
= harness operational quality intentionally evolves from real use
```

## S0 Product boundary — FROZEN
Foundation/Architecture.

## S1 Project/Drive model — FROZEN
Project root, PROJECT.md, lifecycle, repo ownership/reference.

## S2 Work hierarchy — FROZEN
```text
Project → Job → Task → Run
```
Job may use multiple role Runs.

## S3 Repository model — DEFINED
Structured OWNED/REFERENCED claims; duplicate OWNED claim is human-governed conflict.

## S4 Project Memory — SYNTHESIZED
Simplified Drive model:
- Job embeds Tasks/topology by default;
- Runs separate append-only;
- verification storage may consolidate semantic kinds;
- CONTROL is rebuildable cache;
- no initial tombstone machinery.

## S5 State model — SYNTHESIZED
Lifecycle/result/validity/facts separated.
Detailed transition enforcement only where valuable.
WAITING/BLOCKED primarily derived.

## S6 Orchestrator — DEFINED
Implicit harness responsibility set; no always-running process.

## S7 Planner — DEFINED
Owns finite-work planning/topology/acceptance/capability requirements and mandatory review-trigger application.

## S8 Designer — DEFINED
Owns visual interpretation/design coverage; may run as non-independent child Run.

## S9 Coder — DEFINED
Owns source implementation HOW, scope claim, Goal Recheck and honest capability-backed checks.

## S10 Reviewer — DEFINED
Fresh-chat independent review when required; mechanical review floor applies to sensitive change classes.

## S11 Tester — DEFINED / PROBE_REQUIRED
Semantic role is defined. Practical execution requires observed runtime/browser/product capability; otherwise human Retest path is used.

## S12 QA/QC — SYNTHESIZED
Coder self QA/QC = capability-backed checks + Goal Recheck.
Reviewer independent evaluation.
Tester practical QC when available.

## S13 Handoff — SYNTHESIZED
Durable transition semantics + minimal dispatch/pickup contract required before Phase 2.

## S14 Context Builder — DEFINED
Minimum sufficient role-specific context; freshness-sensitive evidence refreshed.

## S15 Human Gate/Approval — DEFINED
Human decisions explicit; shared account identity never substitutes for human approval.

## S16 Verification/Evidence — SYNTHESIZED
Provenance/target/revision; causal fail-safe invalidation; UNVERIFIED supported at criterion level.

## S17 Capability/Executor — PROBE_REQUIRED
Semantic catalog/contract exists; observed platform matrix must be filled by probes.

## S18 Multi-repo — DEFINED
Change Set only for genuine coordinated multi-repo work.

## S19 Governance — SYNTHESIZED
Global IDs, attribution, scope claims, append-first concurrency, merge coverage summary, fail-safe causal revalidation.

## S20 Security/Trust — SYNTHESIZED
Shared identity constraint, external-content trust boundary, consequential-action recheck.

## S21 Asset Requirement — SYNTHESIZED
Compact lifecycle; stable contract remains distinct semantic entity.

## S22 Retest — SYNTHESIZED
Pending after PASS_RETEST_REQUIRED; post-completion FAIL creates remediation Job.

## S23 Release/Completion — SYNTHESIZED
Topology-driven completion + review floor + human merge coverage/authorization.

## S24 Command/User UX — SYNTHESIZED
Outer surface remains PROJECT / DIRECT AGENT / HELP.
Minimal dispatch must support list/take handoff, status, pause/stop.
Current command/product names are aliases.

## S25 Failure/Recovery — DEFINED
Smallest causal recovery; append observed partial effects; retry via linked Run.

## S26 Harness Quality — DEFINED / CALIBRATION
Behavioral defect/eval loop improves Phase-2 harness after semantic contracts exist.

## S27 Identity / schemas — SYNTHESIZED
See:
- IDENTITY-AND-HANDLES-v1.md
- CORE-RECORD-CONTRACTS-v1.md
- ATTRIBUTION-AND-SCOPE-CLAIMS-v1.md

## S28 Implementation architecture — BLOCKED
Do not enter Phase 2 until:
- accepted peer fixes are complete;
- capability/platform probes are classified;
- consistency review passes;
- Claude peer review round 2 finds no unresolved material architecture gap (or findings are dispositioned/fixed);

## S29 Theory process
Moved to THEORY-PROCESS-v1.md; it is not product foundation.

## S30 Current Phase-1 gate

```text
PEER_REVIEW_DISPOSITION = COMPLETE
ACCEPTED_FIX_PASS = COMPLETE
MISSING_CONTRACTS = COMPLETE
PLATFORM_PROBES = PARTIALLY_CLASSIFIED / REMAINING PROBES OPEN
CONSISTENCY_REVIEW = PASS_WITH_OPEN_PLATFORM_PROBES
PEER_REVIEW_ROUND_2 = PENDING
PHASE_2_ENTRY = BLOCKED
```
