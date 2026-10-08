# E33 — NEXT dispatch admission

Target: Correction P1.

## Required matrix

1. Valid NEXT Task dispatch with exact current Job SHA, current planning revision, matching topology role, and successful prerequisite Run snapshots → ALLOW.
2. Role does not match the Task topology handler → reject with NEXT_DISPATCH_WRONG_ROLE.
3. Declared Task dependency has no successful current-revision COMPLETED NEXT Run snapshot → reject with NEXT_DISPATCH_PREREQUISITE_BLOCKED.
4. Requested planning revision differs from current Job planning revision → reject with NEXT_DISPATCH_STALE_PLANNING_REVISION.
5. Supplied Job snapshot SHA differs from immediate current Job read-back SHA → reject with NEXT_DISPATCH_STALE_JOB_SHA.
6. V2_STABLE Job → P1 NEXT-only dispatch preflight is inert.

## Evidence requirements

- /selftest aggregate pass must include the six P1 checks.
- Staging source must be byte-identical to the reviewed Git revision.
- Reviewer must compare run_begin behavior to the P0 CR-P1 traceability row.
- P1 must merge into upgrade/gsa-next before P2 starts.
