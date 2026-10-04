# Upgrade implementation drift lessons — 2026-10-04

Status: CANDIDATE / LLC collection only. This note does not resolve or activate workflow changes.

## WL-026 — Approved plan vs runtime drift
The final executable control path must be compared invariant-by-invariant with the approved detailed plan before merge. Schema presence or green tests are insufficient. During the NEXT upgrade, the detailed plan made typed topology the ordering/dependency authority, while runtime retained legacy execution topology plus a second planning topology; initial topology remained mostly Coder-owned and Run dispatch did not mechanically enforce handler/dependency ordering. Material divergence from an approved invariant requires explicit architecture review rather than being treated as an implementation detail.

## WL-027 — Detail-plan requirements must survive roadmap condensation
Every accepted requirement from specialist/detail plans needs traceability to an owning checkpoint, implementation surface, eval/evidence, and disposition. Requirements without explicit ownership are PLAN_GAP, not implicit deferral. Review Coverage Summary integration and some dispatch/closure guarantees existed in detailed Tester/V2 plans but were incompletely represented in the CP0-CP7 master roadmap.

## WL-028 — Selftest is not a substitute for required E2E
Helper/selftest assertions are regression floors, not proof of the real workflow. Required integration scenarios must execute the public control path far enough to prove routing, persistence namespace, role ownership, ordering, skill activation, and cutover behavior. CP7/F4 relied too heavily on internal selftests; some intended E2E Job flows were not executed, and two selftest checks were hard-coded true. This allowed real runtime gaps to survive a green release.

## WL-029 — Cutover must retire pre-production isolation assumptions
Every staging-only namespace, endpoint, default, flag, or compatibility guard needs an explicit KEEP / REPLACE / REMOVE decision at promotion. TEST-LAB/NEXT was correctly introduced for pre-cutover isolation, but production NEXT records continued to route there after promotion. Staging success cannot prove cutover correctness when the staging isolation mechanism itself must change.

## Evidence
Post-promotion unified-source audit comparing:
- docs/plans/GSA-UPGRADE-INTEGRATION-ROADMAP.md
- docs/plans/GSA-ONLINE-TESTER-UPGRADE.md
- docs/plans/GSA-V2-IMPLEMENTATION.md
- docs/plans/UI-CODER-FRONTEND-UPGRADE.md
- supabase/functions/gsa-mcp/index.ts

Observed implementation gaps include dual topology authority, missing Run role/dependency enforcement, incomplete plan-to-runtime traceability, helper-level tests standing in for E2E paths, and production NEXT records retaining the pre-cutover TEST-LAB/NEXT namespace.
