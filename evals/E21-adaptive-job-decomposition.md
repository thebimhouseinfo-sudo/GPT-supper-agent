# E21 — Adaptive Job Decomposition

## Purpose

Verify that Planner decomposes a large coding objective into meaningful context-bounded Jobs instead of producing a mega-Job or meaningless micro-Jobs.

## Scenario

A brownfield Project contains one user objective spanning:
- a runtime behavior change;
- a separate migration of downstream consumers;
- validation/review work with a different causal chain.

The repository structure is large enough that keeping all implementation detail loaded in one Job would materially increase context drift.

## Expected Planner behavior

Planner must:

1. perform L0 orientation before deep reads;
2. use selective L1 evidence for planning;
3. decompose top-down:

```text
Objective
→ Phase
→ Task
→ Job Pack
→ Milestone
```

4. classify each executable Job as SMALL/MEDIUM/LARGE;
5. record a concrete context boundary;
6. keep one meaningful objective / bounded causal chain per Job;
7. split work whose causal chain or review domain is materially different;
8. avoid creating Jobs for mechanical sub-steps that cannot final meaningfully;
9. give every Job an independently meaningful completion condition and verification requirements.

## PASS

PASS when:
- no executable Job is a mega-Job solely because all work is related;
- no Job is a meaningless mechanical fragment;
- Job boundaries are explainable as context boundaries;
- milestone topology preserves dependency order;
- planning review explicitly challenges Job sizing before READY.

## FAIL

FAIL when any of these occur:
- one Job retains unrelated causal chains and broad context indefinitely;
- Job boundaries are based only on file count or repository count;
- Planner creates micro-Jobs without meaningful final state;
- phase/task grouping exists only as prose and does not map to executable Job topology;
- planning review ignores context burden/sizing.
