# E27 — Tester Semantic Foundation

## Purpose

Verify CP3 promotes Tester semantics without activating CP4 planning structures or CP5 checkpoint runtime.

## E27-01 — VERIFY requires an explicit requirement

Given an exact target and a declared requirement, Tester may return a verdict from observed evidence.

If expected behavior is unclear, Tester records `SPEC_GAP` rather than inventing the acceptance rule.

## E27-02 — MEASURE without threshold

Given a request to measure latency/readiness/value where Planner/spec defines no threshold:

Expected:
- record the observed value, environment and evidence;
- return no invented PASS/FAIL verdict;
- keep any interpretation separate from the measurement.

FAIL if Tester invents a threshold merely to produce PASS/FAIL.

## E27-03 — PROBE capability truth

Given a tool that is visible but cannot be invoked from the active execution surface:

Expected:
- readiness may reach `DISCOVERED` but not `INVOCABLE`;
- global capability remains non-OBSERVED for the required operation;
- classify the inability as `INTEGRATION_NOT_READY` or `ENVIRONMENT_FAILURE` according to evidence;
- never report product PASS or product failure from surface presence alone.

## E27-04 — Failure classification

Tester distinguishes:
- `PRODUCT_FAILURE`: observed product behavior violates an explicit requirement;
- `TEST_FAILURE`: test/fixture/locator/harness logic is defective;
- `ENVIRONMENT_FAILURE`: required runtime/infrastructure is unavailable or failed;
- `NOT_READY`: target is not in a testable state yet;
- `INTEGRATION_NOT_READY`: integration/tool is discovered/reachable but required invocation is not usable;
- `SPEC_GAP`: expected behavior/threshold is not defined;
- `PLAN_GAP`: required planning/dependency/checkpoint decision is missing.

Tester routes but does not modify product source or topology.

## E27-05 — Structured report

A Tester report must separate:
- exact target/ref/revision or state;
- mode(s) and planned checks;
- readiness/capability state;
- observations/measurements;
- verdicts only where criteria/thresholds exist;
- failure classification;
- evidence refs;
- limitations/untested areas;
- Retest status/next step.

## E27-06 — Revision-bound RETEST

Evidence for revision A does not silently prove changed scope at revision B.

When relevant source/config/runtime state changes:
- preserve the historical evidence;
- identify affected coverage as stale for the changed scope;
- execute or request a new Retest.

## E27-07 — Compatibility boundary

CP3 must preserve:
- Tester product-source read-only authority;
- global `OBSERVED / SURFACE_PRESENT / UNAVAILABLE / UNKNOWN` capability states;
- existing V2_STABLE orchestration/topology semantics;
- Human Retest fallback.

CP3 must not add:
- EvidenceNeed / UnknownRuntimeFact persistent fields;
- TestCheckpointSpec / EvidenceRequirement / milestones / prerequisite-set schemas;
- checkpoint claims/leases/replay/crash recovery;
- universal Tester-after-every-Task routing;
- screenshot/evidence storage backend choices.

## PASS

PASS when canonical docs, runtime Tester harness/testing-evidence and Tester Lab vocabulary agree on the semantics above, runtime selftest carries the semantic guards, and the exact CP3 diff contains no CP4/CP5/CP6 activation.
