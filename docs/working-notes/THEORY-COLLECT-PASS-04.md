# THEORY COLLECT — Pass 04

## Status

```text
LOOP_STAGE = COLLECT
PASS = 04
MODE = COMPLETENESS_AUDIT
CANONICAL = false
```

Pass 04 audits the theory after transition-matrix and ownership-boundary fixes.

---

# 1. Fixed since Pass 03

Now defined:

- explicit legal transition matrix;
- transition authority;
- BLOCKED lifecycle vs BLOCKED result;
- Direct Coder cannot bypass a Project-owned repo;
- unowned repo may receive bounded Direct Coder work without automatic ownership;
- Project delete releases repo ownership association;
- cross-Project refs are weak/provenance refs;
- CONTROL contains no unique historical truth.

---

# 2. C4-01 — Task COMPLETED reopen contradiction

State Machine currently says terminal historical states should not normally move backward, while also allowing a completed Task to be explicitly reopened when remediation is semantically the same Task.

But the transition table does not explicitly list:

```text
COMPLETED → READY
or
COMPLETED → IN_PROGRESS
```

This is a real internal contradiction.

Options:

A. Completed Task is strictly terminal; remediation always creates new Task.
B. Completed Task may explicitly reopen under narrow same-objective condition.

Current earlier theory intentionally allowed reopening the smallest relevant Task after Retest FAIL.

Need reconcile.

---

# 3. C4-02 — Project PAUSED execution semantics

Project lifecycle values are defined, but PAUSED behavior needs one explicit rule.

Questions:
- may a new Run start?
- may an already-running Run finish?
- may Handoffs be consumed?
- are background/condition operations relevant? (currently GSA has no autonomous runtime)

Candidate:

```text
Project PAUSED
→ no new Job/Task/Run execution begins
→ no pending Handoff is consumed
→ current in-flight action reaches safe stop / current atomic tool action completes
→ durable state persists
→ resume by lifecycle ACTIVE
```

This is governance semantics, not implementation detail.

---

# 4. C4-03 — Project ARCHIVED execution semantics

ARCHIVED is hidden from Project Open but visible in status.

Need explicit execution rule.

Candidate:

```text
ARCHIVED
→ read/history/status allowed
→ no ordinary work execution
→ must transition to ACTIVE or PAUSED/ACTIVE before work resumes
```

Because PAUSED also blocks execution, practical resume should normally ARCHIVED → ACTIVE.

---

# 5. C4-04 — Job WAITING vs BLOCKED operational distinction

Definitions exist but boundary should be crisp for Orchestrator.

Candidate:

```text
WAITING
= continuation condition is known/expected
  and workflow has a valid next path once it occurs

BLOCKED
= progress cannot continue because a blocker must be resolved,
  capability/decision/conflict is unresolved,
  or no valid next execution path currently exists
```

Examples:

WAITING:
- waiting for user-selected future action already understood;
- waiting for downstream handler dispatch;
- waiting for known external completion.

BLOCKED:
- required permission unavailable;
- architecture decision missing;
- source inaccessible;
- concurrency conflict unresolved.

---

# 6. C4-05 — Result vocabulary scope

The shared evaluation vocabulary is:

```text
PASS
PASS_RETEST_REQUIRED
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

Not every role/domain needs every value.

Need make explicit:
```text
shared vocabulary
≠ mandatory enum for every entity
```

Job's terminal accepted result normally only:
PASS | PASS_RETEST_REQUIRED.

Other values are evaluation/routing outputs, not necessarily persisted as final Job result.

---

# 7. C4-06 — Project lifecycle + active work consistency

If user changes ACTIVE → PAUSED/ARCHIVED while a Run is in progress, system needs a safe boundary.

Candidate:
- lifecycle transition is recorded;
- no new consequential action starts after transition is observed;
- current indivisible external action cannot be retroactively cancelled unless executor supports it;
- Run ends/blocks at earliest safe boundary;
- Handoff remains pending.

This is enough theory; executor-specific cancellation belongs to implementation.

---

# 8. C4-07 — theory completeness vs exact schema validation

Remaining unresolved items are now largely mechanical:

- exact ID syntax;
- JSON/YAML/Markdown serialization;
- filenames per record;
- schema validation library;
- Drive connector implementation;
- exact prompt wording;
- exact skill invocation mechanism;
- exact tool adapters.

These do not require new semantic decisions if implementation preserves defined contracts.

---

# 9. C4-08 — implementation architecture scope

The skeleton says implementation architecture is next after theory stabilization.

Need ensure Phase 2 does not accidentally become a standalone heavy runtime.

Accepted product vision suggests:

```text
Phase 2 implementation
= ChatGPT plugin/harness packaging
+ instructions/prompts
+ specialist skills
+ connected Drive/GitHub actions
+ templates/schema helpers
+ fake CLI UX
+ calibration/evals

NOT
= build a custom autonomous orchestration server first
```

This should be confirmed in final completeness output.

---

# 10. COLLECT PASS 04 result

Material semantic items:

1. Resolve Task COMPLETED reopen contradiction.
2. Define PAUSED semantics.
3. Define ARCHIVED execution semantics.
4. Clarify WAITING vs BLOCKED.
5. Clarify shared evaluation vocabulary vs entity final result.
6. Define safe lifecycle transition behavior during active Run.

Everything else discovered is implementation/mechanical detail rather than Phase 1 theory gap.
