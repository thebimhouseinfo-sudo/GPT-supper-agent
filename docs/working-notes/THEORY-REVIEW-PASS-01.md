# THEORY REVIEW — Pass 01

## Status

```text
LOOP_STAGE = REVIEW
PASS = 01
RESULT = ACCEPTED_WITH_CORRECTIONS
CANONICAL = false
```

This review evaluates the first full DETAIL + COLLECT pass.

The user accepted the review result and the three material corrections listed below.

---

# 1. Overall result

The first-pass theory is internally coherent enough to proceed to SYNTHESIZE.

Most nominations are accepted as-is or with only editorial reconciliation.

Three material corrections are required before synthesis:

```text
C1. Run ↔ Task attribution model
C2. Universal final Reviewer gate
C3. Capability DEGRADED semantics
```

No other first-pass contradiction requires redesign of the core hierarchy.

---

# 2. Correction C1 — Run ↔ Task attribution

Previous nomination:

```text
Run
→ 0..N Task refs as co-equal task bindings
```

Reviewed correction:

```text
Run
→ one execution scope

execution scope =
  Job-level
  OR
  one primary Task

+ optional affected_task_refs[]
```

Rationale:

- preserves one clear reason the Run exists;
- keeps completion/resume attribution understandable;
- still allows one source edit/review action to affect several related Tasks;
- avoids making several Tasks appear equally owned by one execution attempt when only one is the primary work target.

Example:

```text
Run R-001
primary_task = T-003
affected_task_refs = [T-004, T-005]
```

This correction is ACCEPTED.

---

# 3. Correction C2 — remove universal final Reviewer gate

Previous nomination:

```text
every Job
→ independent final Reviewer acceptance
→ only then accepted/completed
```

Reviewed correction:

```text
Job completion topology
→ defined by the Detailed Execution Plan / milestone topology

Reviewer
→ mandatory only when the topology requires independent review
```

Therefore a Job may complete through different valid paths, for example:

```text
Coder
→ Reviewer
→ PASS

Planner
→ completion conditions
→ PASS

Coder
→ self QA/QC
→ required evidence
→ PASS

Coder
→ Tester
→ Reviewer
→ PASS

Designer
→ Human Gate
→ PASS
```

The topology may require Reviewer, Tester, Human Gate, objective evidence, or a combination.

Intermediate and final review are not universal merely because a Job exists.

This preserves the accepted rule:

```text
review placement
→ topology-driven
```

This correction is ACCEPTED.

---

# 4. Correction C3 — capability DEGRADED semantics

Previous nomination:

```text
Capability state:
AVAILABLE
UNAVAILABLE
UNKNOWN
DEGRADED
```

Reviewed correction:

```text
Capability state:
AVAILABLE
UNAVAILABLE
UNKNOWN
```

`DEGRADED` belongs to the derived execution/verification mode rather than one capability's intrinsic state.

Example:

```text
repo_read = AVAILABLE
CI = AVAILABLE
browser_runtime = UNAVAILABLE

therefore:
verification_mode = DEGRADED
```

This separates:

```text
what can actually be done
from
how the workflow adapts to the available capability set
```

This correction is ACCEPTED.

---

# 5. Accepted nomination groups

The following first-pass nominations are accepted for synthesis:

- globally unique durable identities for Job/Task/Run/Retest and similar durable work entities;
- Job type immutable after creation;
- CANCELLED distinct from SUPERSEDED;
- Task hard-delete allowed only before durable references depend on it;
- executed Runs retained historically;
- new meaningful execution attempt/new context creates a new linked Run;
- pending inter-role transition belongs primarily to Handoff, not completed Run;
- consumed Handoffs remain historical;
- state/result/event are separate semantic dimensions;
- Orchestrator remains implicit system role;
- Tester is not added to Direct Agent outer menu initially;
- causal Planner workflow rather than mandatory P0–P11 ceremony;
- Planner owns workflow topology/constraints; Coder refines exact source-level HOW;
- Planner orchestrates design readiness; Designer/specialist skill owns detailed design methodology;
- concept-first design as default;
- DESIGN_READY does not require every final binary asset;
- inherited design system preferred;
- three-level Coder deviation model;
- smallest causally sufficient change;
- baseline/reproduce-first when feasible, not universal TDD;
- Reviewer result model: PASS / PASS_RETEST_REQUIRED / CHANGES_REQUIRED / BLOCKED / HUMAN_REVIEW_REQUIRED;
- STALE treated primarily as validity condition;
- Tester supports scripted + exploratory testing;
- fresh Tester chat only when independence materially helps;
- QA/QC layered across Coder / Reviewer / Tester;
- no separate QA Agent initially;
- categorical evidence provenance, not universal numeric confidence;
- causal evidence invalidation;
- capability state = AVAILABLE / UNAVAILABLE / UNKNOWN;
- Change Set only when logically required for coordinated multi-repo change;
- optimistic concurrency;
- no inferred permission escalation;
- stable Asset Requirement contract before final asset when practical;
- Retest history append-preserving;
- PASS_RETEST_REQUIRED may coexist with completed/accepted Job;
- relevance-first Context Builder, no fixed theory token cap;
- Direct Agents ephemeral by default unless promoted/persisted;
- lightweight harness behavioral defect/eval records.

---

# 6. Accepted structural direction

The following are now safe inputs to SYNTHESIZE:

```text
Project
→ Job
→ Task
→ Run
```

with:

```text
Run
→ Job-level OR primary Task execution scope
→ optional affected Task refs
```

and:

```text
Run completion
→ optional Handoff
→ next Run
```

The theory also preserves:

```text
Project lifecycle
≠ Job result
≠ Task/Run state
≠ artifact validity
≠ delivery facts
```

---

# 7. Canonical inconsistency result

Existing older architecture documents contain material obsolete assumptions and require a later consistency rewrite.

Do not patch them one-by-one before synthesis completes.

The rewrite must replace at least:

- Job-as-Drive-root model;
- JOB.md top-level identity;
- Project-as-logical-only model;
- old job discovery semantics;
- premature Project Memory tree;
- premature retests/ tree;
- missing Tester;
- Planner-owned specialist UI methodology;
- universal/fixed review sequences;
- mixed state/result/delivery semantics;
- Job archive assumptions;
- pre-owned/reference repo model.

---

# 8. Review conclusion

```text
REVIEW PASS 01
→ ACCEPTED WITH C1/C2/C3 CORRECTIONS

NEXT
→ SYNTHESIZE PASS 01
```
