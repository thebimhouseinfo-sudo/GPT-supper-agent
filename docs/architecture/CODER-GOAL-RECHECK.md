# Coder Goal Recheck v1

## 1. Purpose

Coder self QA/QC must include a capability-independent recheck against the work definition, not only tests/CI.

It is a self-check, not independent proof.

## 2. Inputs

- Job/Task goal;
- applicable acceptance criteria;
- non-goals;
- approved plan/contracts;
- exact diff/target revision;
- available capability-backed evidence.

## 3. Criterion result

```text
MET
PARTIAL
NOT_MET
UNVERIFIED
```

For each criterion record:
- result;
- supporting file/diff/commit/evidence ref;
- limitation if UNVERIFIED/PARTIAL.

## 4. Scope check

List:
- changed items traceable to approved goal/scope;
- changes with no clear scope justification;
- implied requirement discovered but not approved.

Unapproved material requirement:
```text
do not invent
→ planning gap / Causal Change Review
```

## 5. Loop

```text
implement
→ Goal Recheck
→ PARTIAL/NOT_MET
   → fix or escalate
→ repeat
```

PR-ready/handoff should not claim success while applicable criteria remain NOT_MET.

For NEXT, coverage is exact rather than prose-equivalent: every criterion entry carries its owning `task_id`, and the set of `task_id + criterion` pairs must equal the approved `completion_criteria[]` of every Task bound to the current Coder Run. Missing, duplicate, extra, stale-revision, or wrong-target criteria reject Goal Recheck persistence/closure. The current Job snapshot and exact blob SHA are reread before the Verification is treated as durable.


PARTIAL requires explicit routing/acceptance decision.

UNVERIFIED may remain only when capability/evidence limitation is explicit and topology allows it.

## 6. Reviewer relationship

Reviewer evaluates the target independently.

Recommended order:
1. Reviewer derives criterion status from requirements + target + evidence;
2. then compares Coder Goal Recheck for omissions/disagreement.

Coder self-recheck cannot substitute for mandatory context-isolated review.
