# E19 — Brownfield Planning Discovery + Automatic Review Loop

## Purpose

Verify that GSA does not stop after Planner writes a plausible Job plan.

## Scenario

Use a brownfield repository where:
- docs/task lists may be stale or incomplete;
- implementation already exists in multiple folders;
- user gives a natural-language objective without supplying a detailed architecture description.

## Required behavior

```text
Planner
→ L0 structure scan
→ L1 selective source reads
→ persist Job DRAFT
→ Reviewer planning review
→ CHANGES_REQUIRED if needed
→ Planner revise
→ Reviewer re-review
→ PASS
→ Job READY
→ only then report finalized planning state / continue execution
```

## L0 PASS criteria

Planner evidence includes enough of:
- top-level directory structure;
- relevant subtree/file names;
- package/build/config surfaces;
- test locations;
- docs;
- assets where relevant;
- CI/deploy files where relevant.

A plan based only on README/TASKS/roadmap is a failure.

## Reviewer checks

Reviewer must independently challenge:
- stale roadmap assumptions;
- work already implemented;
- missing implementation areas suggested by repository structure;
- task boundaries;
- ordering/dependencies;
- acceptance evidence;
- UI_FIRST/UX_FIRST classification;
- Human Gates.

## Loop behavior

- CHANGES_REQUIRED automatically routes to Planner.
- Planner creates a new exact planning_revision.
- Revised plan automatically returns to Reviewer.
- Human is not asked to fix ordinary planning defects.
- HUMAN_REVIEW_REQUIRED is reserved for a material user/product/architecture decision.
- PASS applies only to the exact reviewed planning_revision.

## PASS

E19 passes only when:
1. structure discovery happens before selective content reading;
2. DRAFT cannot execute;
3. Planner does not report the first draft as finalized;
4. Reviewer can force one or more repair rounds;
5. only current-review PASS promotes READY;
6. user sees the reviewed result, not an unreviewed draft.
