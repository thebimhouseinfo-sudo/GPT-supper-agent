# Architecture Document Index

## Purpose

This file is the single navigation index for current architecture.

File names are stable semantic names. Git history is the version authority; no version suffix is encoded in the path.

## Canonical architecture

| Path | Role |
|---|---|
| FOUNDATION.md | governed product/system invariants |
| ARCHITECTURE.md | synthesized system model |
| SYSTEM-DEFINITION.md | concise current system map |
| PROJECT-MEMORY.md | durable GitHub Memory Repo model |
| CORE-RECORD-CONTRACTS.md | semantic record contracts |
| JOB-LIFECYCLE.md | Job semantics/lifecycle |
| BRANCH-LIFECYCLE.md | source-branch ACTIVE/RETIRED lifecycle, history preservation and separate remote-ref deletion |
| STATE-MACHINE.md | lifecycle/result/condition model |
| GOVERNANCE-AND-ARTIFACT-LIFECYCLE.md | governance and artifact validity |
| SECURITY-AND-TRUST-BOUNDARIES.md | trust, authority and sensitive paths |
| USER-CONFIGURATION-AND-MEMORY-REPO.md | Supabase identity and per-user GitHub Memory Repo config |
| AGENT-HARNESSES.md | role contracts and harness-loading boundary |
| EXECUTION-AND-REVIEW.md | execution, review floor and merge guard |
| DISPATCH-AND-HANDOFF.md | dispatch and immutable Handoff consumption |
| ATTRIBUTION-AND-SCOPE-CLAIMS.md | signatures, scope claims and conflict checks |
| CAPABILITY-CATALOG.md | observed/surface/unavailable/unknown capability truth |
| IDENTITY-AND-HANDLES.md | durable IDs and human handles |
| CODER-GOAL-RECHECK.md | Coder self-recheck contract |
| CLARIFICATION-AND-CAUSAL-READINESS.md | clarification and causal readiness |
| PLANNER-SCOPE-AND-UIUX.md | Planner scope/UIUX contract |
| DESIGNER-HARNESS.md | Designer role contract |
| CODER-UIUX-HARNESS.md | UI/UX Coder specialist contract |
| UI-SPEC-MODEL.md | UI specification model |

## Supporting, not core runtime architecture

- `docs/plans/GSA-ONLINE-TESTER-UPGRADE.md` — proposed Online Tester upgrade: checkpoint planning, VERIFY/MEASURE/PROBE evidence, orchestration impacts, and optional browser-provider strategy.
- `docs/process/THEORY-PROCESS.md` — theory-development governance.
- `docs/specialist/CONCEPT-MEASUREMENT-NORMALIZATION.md` — optional UI Coder specialist methodology.

## Authority rule

When two files appear to overlap, the narrower semantic contract governs its domain, while `FOUNDATION.md` governs system invariants.

Phase-2 implementation authority is separate and singular:

`docs/plans/PHASE2-IMPLEMENTATION.md`
