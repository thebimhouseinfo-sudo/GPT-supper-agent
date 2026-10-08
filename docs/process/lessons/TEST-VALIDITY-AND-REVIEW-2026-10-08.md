# Test validity and checkpoint review — 2026-10-08

Status: **Lessons Learned candidate**

## Observed problem

Across direct work on GSA Local, RevitGPT and related projects, multiple defects were discovered even though CI/selftests were green.

The issue is not only missing coverage. In some cases the **test script or test harness itself is not trustworthy enough** to prove the behavior it claims to validate.

A green CI result can therefore be false evidence when:
- the test does not execute the real code path used in production/live work;
- assertions are too weak or only prove “no exception”;
- mocks/stubs replace the very boundary that must be tested;
- fixtures already encode the expected result;
- wrappers swallow failures or return success incorrectly;
- skipped/unavailable checks are counted as PASS;
- the test runs against the wrong revision/runtime/artifact;
- implementation and test share the same incorrect assumption;
- an integration/runtime defect exists outside the unit path covered by CI.

## Lesson 1 — raise the standard for writing tests

Tests that are used as completion evidence must be written to prove the intended behavior, not merely to exercise code.

For important behavior, test quality should include:
- a meaningful behavioral assertion;
- failure propagation that really turns the test red;
- minimal mocking across the boundary being validated;
- exact-revision/runtime binding where relevant;
- negative-control evidence when practical.

For a bug that previously existed while CI was green, the repaired test should prove that it can detect the old failure state. If the old broken behavior still passes the new test, the test is not yet valid evidence.

## Lesson 2 — test code is part of the review surface

Reviewer must sometimes review the **test script itself**, not only production code and final PASS output.

However, this must be selective. Reviewing test code on every small change would slow GSA too much.

Deep test-script review should be triggered at meaningful checkpoints, especially when:
- a new test is introduced;
- an existing test is materially changed;
- a real bug previously escaped while CI was green;
- test harness, wrapper, mock, fixture, CI command or runtime setup changes;
- the change crosses a high-risk boundary such as lifecycle, persistence, process/thread bridge, deployment or runtime integration;
- a milestone/release gate depends heavily on the test;
- Reviewer sees suspiciously weak assertions or a PASS that does not clearly prove the required behavior.

If a test suite has already been reviewed and proven trustworthy, and neither the test nor its harness changed, later Jobs may reuse that trust and only rerun it on the exact target revision.

## Lesson 3 — Reviewer owns test validity at meaningful checkpoints

The intended rule is:

> **Reviewer owns test validity at meaningful checkpoints, not at every test run.**

Reviewer should verify that:
- the test proves the requirement it claims to cover;
- the oracle/assertion is strong enough;
- failure is not swallowed;
- mocks do not bypass the critical path;
- the executed test is bound to the exact source/runtime revision under review.

This review is checkpoint-triggered, not continuous.

## Lesson 4 — green CI is evidence only when the test mechanism is trustworthy

A green test result is not automatically proof.

For high-value checks, confidence should come from:
1. **negative control / red check** — the test can actually fail for the defect class;
2. **positive control / green check** — correct behavior passes;
3. **call-path proof** — the relevant real path is exercised;
4. **exact-revision proof** — the result belongs to the revision being reviewed.

Not every test needs all four every time. The stronger validation is required when the risk or evidence value justifies it.

## Direction

Future GSA workflow changes should therefore focus on two improvements only:

1. **Raise test-writing requirements** for tests used as completion/merge evidence.
2. **Add selective Reviewer test-script review at appropriate checkpoints**.

Do not add a mandatory full test-code review after every test run or minor code change.

## Acceptance direction for future implementation

A future workflow update should prove that:
- a previously false-green test can be made red against the known broken behavior;
- Reviewer can detect weak/misleading test logic at a checkpoint;
- unchanged trusted tests are not repeatedly re-reviewed without a trigger;
- milestone/release evidence records which tests were newly/changed/revalidated;
- CI PASS cannot silently treat skipped/unavailable checks as full behavioral PASS;
- test evidence remains bound to the exact target revision.

## Summary

**Raise test quality when tests are written; review test validity at meaningful checkpoints.**

The goal is to reduce false-green CI without turning test review into a constant workflow tax.
