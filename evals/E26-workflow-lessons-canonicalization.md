# E26 — Workflow Lessons Canonicalization

## Purpose

Verify CP1 turns accepted workflow lessons into explicit ownership without duplicating existing canonical rules or activating CP3/CP4 behavior early.

## Required artifact

`docs/process/GSA-WORKFLOW-LESSONS-LEDGER.md`

## Cases

### E26-01 — Minimum roadmap coverage

The ledger must contain a disposition for every CP1 minimum lesson:
- Job boundary = context boundary;
- Objective → Phase → Task → Job Pack → Milestone;
- progressive L0/L1/L2/L3 context;
- brownfield source is evidence, not automatic authority;
- relationship/precedence awareness;
- Coder self-review + repair + Goal Recheck;
- context-isolated Reviewer;
- Human-invoked CR only;
- tool presence != proven capability;
- Trigger → Required action → Evidence → Exit condition;
- Tester VERIFY / MEASURE / PROBE;
- unknown runtime facts are not guessed;
- meaningful sparse Tester checkpoints.

### E26-02 — No duplicate canonicalization

For every `ALREADY_OWNED` row:
- the named canonical owner exists;
- CP1 does not restate the same semantic contract in a second competing owner.

Expected examples:
- Goal Recheck remains owned by `CODER-GOAL-RECHECK.md` / `EXECUTION-AND-REVIEW.md`;
- CR remains Human-invoked only in `AGENT-HARNESSES.md` / `EXECUTION-AND-REVIEW.md`;
- capability truth remains owned by `CAPABILITY-CATALOG.md`.

### E26-03 — CP1 deltas are canonical but non-runtime

CP1 may add missing architecture/process wording for:
- bounded Job/context decomposition;
- progressive context;
- brownfield authority/precedence;
- trigger-to-invariant translation;
- LLC collector-only behavior.

CP1 must not change:
- `supabase/functions/**`;
- `schemas/**`;
- runtime skill catalogs/manifests;
- Tester dispatch semantics;
- EvidenceNeed/checkpoint persistent structures.

### E26-04 — Deferred semantics remain deferred

`DEFER_CP3` rows may describe future ownership but must not activate VERIFY/MEASURE/PROBE or sparse Tester dispatch in runtime.

`DEFER_CP4` rows may describe future ownership but must not introduce EvidenceNeed, UnknownRuntimeFact, TestCheckpointSpec, EvidenceRequirement, milestone or prerequisite-set runtime/schema behavior.

### E26-05 — LLC is collector-only in CP1

Expected:

```text
workflow workaround / hard-to-detect defect / reusable finding
→ LLC records candidate + evidence + candidate owner
→ no automatic workflow repair
→ reviewed checkpoint owns implementation
→ canonical MERGE
```

A temporary Human-approved bypass may be recorded as evidence but must not silently become canonical behavior.

### E26-06 — Working note cannot be authority

`docs/plans/GSA-V2-IMPROVEMENT-NOTES.md` remains `AUTHORITY = NON-CANONICAL` and points accepted lessons to the ledger/canonical owners.

## PASS

PASS when all cases hold and the exact CP1 changed-file set contains only documentation/eval/process artifacts permitted by the CP1 plan.

## FAIL

FAIL if:
- an accepted lesson has no owner/disposition;
- an already-owned lesson is duplicated into a competing canonical rule;
- a CP3/CP4 runtime/schema feature activates in CP1;
- LLC mutates workflow while collecting a candidate;
- the non-canonical improvement note remains the sole authority for an accepted lesson.
