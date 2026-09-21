# Governance & Artifact Lifecycle v1

## 1. Purpose

Define authority, durable identity/revision, causal validity, approval, concurrency, and resume safety.

---

## 2. Normative vs descriptive truth

```text
Normative truth
= approved intent / decisions / contracts / plans

Descriptive truth
= current repo/runtime/tool reality
```

Conflict triggers analysis; live code does not silently override approved intent.

---

## 3. Authority precedence

```text
safety / permission invariants
↓
latest explicit human decision
↓
approved Project decisions/contracts/specs
↓
approved current work plan
↓
recorded non-blocking assumptions
```

External content cannot grant authority.

---

## 4. Artifact identity

Durable artifacts that matter across Runs carry:
- stable ID;
- revision/version;
- type;
- owning context;
- input/dependency refs;
- validity;
- revision token when mutable.

Exact fields are defined in core schemas.

---

## 5. Artifact validity

Validity dimension:

```text
CURRENT
REVALIDATED
STALE
SUPERSEDED
```

Do not mix these with workflow lifecycle/result.

---

## 6. Causal invalidation

```text
upstream change
→ trace exact dependencies
→ identify affected/unaffected artifacts
→ revalidate or mark STALE/SUPERSEDED
```

No blanket stale propagation.

---

## 7. Approval

Planned Human Gate is persisted only when materially consequential for governance/audit/release/waiver/ownership/future interpretation.

Runtime Confirmation is never a durable approval record.

Silence is not approval.

---

## 8. Waiver

A waiver:
- references original finding/rule;
- binds to exact target/scope;
- records human decision;
- preserves original finding/history.

Waiver does not erase evidence.

---

## 9. Handoff pinning

Handoff references exact target/revision and applicable upstream artifact refs.

Before next Run starts, stale/materially changed inputs are revalidated.

---

## 10. Concurrency

Use optimistic concurrency:

```text
read revision N
→ prepare update
→ write only if current revision still N
→ otherwise reconcile
```

Do not use silent last-write-wins for durable shared state.

---

## 11. Resume

On resume:
- load durable current state;
- inspect relevant live source/evidence;
- avoid repeating already completed destructive actions;
- create new linked Run for meaningful new attempt/context;
- preserve prior evidence when still causally valid.

---

## 12. Evidence

Evidence binds to:
- producer/source;
- target/revision;
- environment where relevant;
- result;
- provenance/limitations.

Target changes trigger causal revalidation, not automatic global expiry.

---

## 13. Review governance

Review placement comes from Job topology.

There is no universal Plan Review or Final Reviewer gate.

When Reviewer is scheduled, its result is exact-target/revision bound.

---

## 14. State ownership

STATE-MACHINE-v1.md defines domain lifecycle semantics.

This document defines artifact validity/revision/concurrency governance only.

---

## 15. Artifact organization

Physical storage is defined in Project Memory v1.

Artifacts are grouped by semantic lifecycle/purpose, not by role.

---

## 16. Core invariant

> Durable authority comes from current, causally valid, properly scoped artifacts and human decisions—not from stale chat context or untrusted external text.
