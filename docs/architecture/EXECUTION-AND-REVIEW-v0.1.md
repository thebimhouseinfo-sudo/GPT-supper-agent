# Execution and Review Model v1

## 1. Work hierarchy

```text
Project
→ Job
→ Task
→ Run
```

Milestones/stages are topology elements inside Job planning, not required storage hierarchy nodes.

---

## 2. Review/delivery packaging

Work entities and delivery/review packaging are distinct.

```text
Tasks
→ may contribute to Review Unit
→ may be delivered through PR
→ may participate in multi-repo Change Set
```

No one-to-one rule exists between Task and PR/Review Unit.

---

## 3. Detailed Execution Plan / topology

Planner defines enough topology to specify:

```text
Milestone | Stage | Handler | Output | Depends on | Next | Review? | Tester? | Human Gate?
```

Coder refines exact source-level execution detail after live-source inspection.

Topology may be revised through Causal Change Review.

---

## 4. Review placement

Core rule:

> REVIEW IS PLACED WHERE THE WORK TOPOLOGY REQUIRES INDEPENDENT EVALUATION, NOT WHERE THE HIERARCHY HAPPENS TO HAVE A NODE.

Therefore:
- not every Task is reviewed;
- not every PR is reviewed;
- not every milestone is reviewed;
- not every Job requires Reviewer;
- review may occur multiple times when risk/dependency justifies it.

---

## 5. Review loop

When Reviewer is scheduled:

```text
owner works
→ exact checkpoint/target reached
→ Reviewer evaluates exact revision
→ PASS / PASS_RETEST_REQUIRED
   OR CHANGES_REQUIRED / BLOCKED / HUMAN_REVIEW_REQUIRED
→ route to next topology step
```

If changes are required:

```text
finding
→ lowest causally owning scope
→ Coder/Designer/Planner fixes
→ new revision
→ re-review
```

Reviewer does not repair source.

---

## 6. Finding severity

```text
CRITICAL
→ always blocking

IMPORTANT
→ blocking unless explicit human waiver

MINOR
→ non-blocking
```

Subjective findings route to human where no objective rubric exists.

---

## 7. Final Job completion

There is no universal final Reviewer gate.

Job completion is defined by its approved topology.

Examples:

```text
Plan Job
→ Planner completion criteria
→ PASS

Code Job
→ Coder
→ Reviewer
→ PASS

UI shell Job
→ Coder
→ Tester
→ Reviewer
→ PASS_RETEST_REQUIRED

Design Job
→ Designer
→ Human Gate
→ PASS
```

---

## 8. Evidence requirement

No completion claim is valid merely because work was produced.

Required evidence is topology/context dependent.

Possible evidence:
- static inspection;
- tests/build/type/lint;
- CI;
- runtime/preview;
- screenshots;
- integration checks;
- Tester evidence;
- user Retest evidence.

Unavailable capability must be explicit.

---

## 9. PASS_RETEST_REQUIRED

```text
required online evidence sufficient
+ practical verification unavailable
→ PASS_RETEST_REQUIRED
→ create durable Retest
```

Job may become COMPLETED while Retest remains pending.

---

## 10. PR model

PR is a delivery unit, not a lifecycle root.

Draft PR may be opened when useful code/diff exists.

Opening PR does not itself trigger Reviewer.

Merge requires explicit human authorization.

---

## 11. Multi-repo Change Set

Use Change Set when one logical change coordinates multiple repos/PRs.

One repo-level pass does not imply Change Set completion.

Dependency/compatibility/integration evidence determine completion.

---

## 12. Run attribution

Run uses:

```text
one execution scope
= Job-level
  OR one primary Task

+ optional affected_task_refs[]
```

This preserves clear attribution while allowing shared edits to affect multiple Tasks.

---

## 13. Causal failure routing

Examples:

```text
implementation defect
→ owning Task

design defect
→ Designer/design artifact

architecture/contract/scope defect
→ Causal Change Review / Planner

practical Retest failure
→ smallest relevant remediation scope
```

Do not blanket-invalidate unrelated downstream work.

---

## 14. Capability-aware execution

Capability state:

```text
AVAILABLE
UNAVAILABLE
UNKNOWN
```

Derived execution/verification mode:

```text
NORMAL
DEGRADED
BLOCKED
```

Unknown is not assumed available.

---

## 15. Current handoff mode

```text
Run completes
→ durable Handoff if needed
→ user invokes next role
→ next Run starts
```

Future automatic handoff may use same semantics.
