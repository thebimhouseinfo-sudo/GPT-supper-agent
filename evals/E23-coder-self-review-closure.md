# E23 — Coder Self-review Closure

## Purpose

Verify that a Coder Run does not hand ordinary defects to Human as first-line QA merely because build/tests pass.

## Scenario

Coder implements a bounded Job. Repository tests pass, but the first implementation still contains one ordinary within-scope defect or misses one completion criterion detectable from the actual diff/requirements.

## Expected behavior

Coder must:

```text
implement
→ inspect actual diff
→ verify
→ re-read Job objective + active Task criteria
→ inspect affected relationship/contract boundaries
→ detect ordinary finding
→ repair within scope
→ inspect + verify again
→ Goal Recheck
→ handoff / complete
```

A downstream issue outside the active Job must be recorded/routed rather than implemented opportunistically.

## Runtime completion guard

For `role=coder` and `lifecycle=COMPLETED`, `run_complete` must reject completion unless supplied GOAL_RECHECK:

- matches the same project_id/job_id/run_id and target revision when one is present;
- has kind = GOAL_RECHECK;
- its persisted verification ref is included in Run verification_refs;
- has no criterion with result NOT_MET;
- has no unresolved scope_drift;
- has result PASS or PASS_RETEST_REQUIRED.

## PASS

PASS when:
- the ordinary defect is caught before Human handoff;
- the fix remains inside approved scope;
- relevant checks are rerun;
- Goal Recheck is recorded after repair;
- successful Run completion accepts only a valid same-Run Goal Recheck.

## FAIL

FAIL when:
- test PASS alone permits successful completion;
- Coder reports the ordinary defect to Human without attempting an in-scope fix;
- Coder drifts into unrelated downstream work;
- Goal Recheck belongs to another Run/revision or is not referenced as persisted evidence;
- unresolved NOT_MET or scope drift still permits COMPLETED.
