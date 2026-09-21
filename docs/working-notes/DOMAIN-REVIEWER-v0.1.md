# DOMAIN DETAIL — Reviewer v0.1

## Status

```text
PHASE = THEORY DETAIL
DOMAIN = REVIEWER
STATUS = WORKING_DRAFT
CANONICAL = false
```

Reviewer is the independent evaluation role. Reviewer does not implement fixes.

---

## 1. Purpose

Reviewer determines whether a defined target satisfies applicable known requirements, evidence, contracts, scope, and quality rules.

```text
exact target/revision
+ approved requirements
+ evidence
→ independent evaluation
→ findings/result/routing
```

---

## 2. Independence

Accepted:

```text
independent Reviewer Run
→ fresh chat
```

Reviewer should not inherit Coder's hidden reasoning as authority.

Reviewer may read the implementation artifacts and relevant approved context.

---

## 3. Source authority

Reviewer is source read-only.

Reviewer may use normal GitHub PR review/comment mechanisms.

Reviewer must not patch implementation source.

---

## 4. Review placement

Review is topology-driven.

Not every:

- Task;
- milestone;
- PR;
- commit

requires independent review.

Detailed Execution Plan determines checkpoints based on dependency/risk/value.

---

## 5. Review targets

Reviewer may evaluate:

- plans;
- design artifacts;
- architecture/contracts;
- execution topology;
- code/PR;
- multi-repo change set;
- evidence;
- final Job acceptance.

Review mode should match target type.

---

## 6. Exact revision binding

Reviewer result must bind to exact target/revision.

Example:

```text
PR #42 @ abc123
```

If target changes materially, previous review does not automatically apply.

---

## 7. Findings

Each finding should include:

- severity;
- affected scope;
- evidence;
- violated rule/acceptance expectation;
- required/recommended action;
- confidence/uncertainty where relevant.

Accepted severity:

```text
CRITICAL
→ always blocks

IMPORTANT
→ blocks unless explicit human waiver

MINOR
→ non-blocking
```

---

## 8. Objective vs subjective

Reviewer may make binding evaluations only where criteria are objectively testable/evidence-backed.

Subjective-only judgement routes to:

```text
HUMAN_REVIEW_REQUIRED
```

Reviewer may still provide observations/recommendations.

---

## 9. Review results

### Nomination

Use semantic results:

```text
PASS
PASS_RETEST_REQUIRED
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

Treat `STALE` as artifact/target validity condition rather than Reviewer outcome where possible.

Alternative:
include STALE as Reviewer result.

Mark: `REVIEW_REQUIRED`.

---

## 10. PASS_RETEST_REQUIRED

Reviewer may issue this when:

- known requirements/evidence pass;
- practical real-world verification remains unavailable online.

It is accepted, mergeable after human authorization, but creates durable Retest obligation.

---

## 11. Re-review

After fixes:

```text
new target revision
→ Reviewer re-evaluates affected findings
→ also checks that fix did not invalidate relevant prior evidence
```

Do not simply mark old findings closed without checking the new revision.

---

## 12. Scope discipline

Reviewer should not invent new unrelated requirements during review.

A finding must tie to:

- approved requirement;
- architecture/contract;
- accepted quality rule;
- objective defect/regression;
- evidence gap;
- explicitly applicable standard.

Ideas outside scope may be noted as optional observations, not blocking findings.

---

## 13. Final Job acceptance

### Nomination

Independent final Job acceptance remains required before a Job is considered accepted.

Rationale:

- prevents self-certification by current work owner;
- ensures completion claim matches fresh evidence.

Alternative:
allow trivial Jobs to self-close without Reviewer.

Potential benefit:
less friction.

Cost:
weakens consistent acceptance semantics.

Mark: `REVIEW_REQUIRED`.

---

## 14. Reviewer and Tester

Reviewer checks known requirements.

Tester actively seeks unforeseen realistic failures.

They are complementary, not substitutes.

Reviewer may request test evidence but does not automatically become Tester.

---

## 15. Reviewer and Human waiver

IMPORTANT finding may be waived only by explicit human decision.

Waiver should identify:

- finding;
- target/revision;
- reason/scope;
- downstream consequence if material.

Exact persistence rules collected later.

---

## 16. Direct Reviewer

Direct Reviewer may review a standalone target without Project lifecycle.

### Nomination

Direct Reviewer should require a clearly identified target and review basis; otherwise it should perform advisory critique rather than authoritative PASS.

Mark: `REVIEW_REQUIRED`.

---

## 17. Reviewer invariants

1. Independent Reviewer uses fresh chat.
2. Reviewer does not fix source.
3. Review binds to exact target/revision.
4. Review is topology-driven.
5. Findings must be evidence/rule grounded.
6. Subjective binding judgement routes to human.
7. Severity semantics are fixed as CRITICAL/IMPORTANT/MINOR.
8. PASS_RETEST_REQUIRED is accepted with practical obligation.
9. Re-review targets new revision.
10. Physical storage layout is deferred.

---

## 18. COLLECT candidates

- review target/revision;
- review mode;
- findings;
- evidence refs;
- result;
- waiver refs;
- re-review lineage;
- Retest creation;
- Human Review requirement.

### Nominated for REVIEW

1. Reviewer result set above.
2. STALE belongs primarily to artifact validity, not review result.
3. Final independent acceptance remains universal Job completion gate.
4. Direct Reviewer without clear review basis is advisory, not authoritative PASS.
