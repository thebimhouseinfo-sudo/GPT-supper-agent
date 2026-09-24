# Governance & Artifact Lifecycle v1.1

## 1. Purpose

Define authority, durable identity/revision, causal validity, approval, concurrency and resume safety.

## 2. Normative vs descriptive truth

```text
Normative truth = approved intent / decisions / contracts / plans
Descriptive truth = current repo/runtime/tool reality
```

Conflict triggers analysis; live code does not silently override approved intent.

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

## 4. Identity / revision

Durable records use collision-resistant global IDs and may expose short human handles.

Historically significant revisions/results remain traceable.

Exact scheme is defined in `IDENTITY-AND-HANDLES.md`.

## 5. Causal validity

```text
upstream change
→ trace recorded dependencies
→ known affected/unaffected with evidence
→ unknown/incomplete trace counts as affected
→ revalidate / STALE / SUPERSEDED
```

No blanket invalidation; no unsafe "probably unaffected" shortcut.

## 6. Human approval

Planned Human Gate persists only when materially consequential.

Runtime Confirmation is not approval history.

Silence is not approval.

Waiver preserves the original finding/rule and binds to exact target/scope.

## 7. Attribution / shared identity

All agent roles may act through the same connected user account.

Therefore externally visible/durable agent output requiring attribution includes:
- role;
- Run ID;
- owning work context;
- exact target/revision.

Human approval must be explicitly human-originated and cannot be inferred from an agent-authored GitHub/Drive comment.

## 8. Concurrency

Foundational correctness does not rely on atomic compare-and-swap.

Default:
```text
append unique execution/history records
+ minimize shared mutable files
+ check before consequential action
+ reconcile detected conflicts
```

Conditional/revision-aware write may strengthen enforcement if a platform probe proves it.

## 9. Scope claims

Each source-writing Run declares intended work scope:
- Project/Job/primary Task;
- owned repo;
- branch/PR when known;
- relevant paths/components/contracts.

Before consequential write, check current Project lifecycle and conflicting active claims visible in durable memory/repo state.

Residual races are possible and must be handled honestly.

## 10. Handoff pinning

Handoff binds to exact target/revision and relevant artifact refs.

Changed inputs require revalidation before consumption.

## 11. Resume

On resume:
- load durable current state;
- inspect relevant live source/evidence;
- re-check lifecycle/scope;
- avoid repeating already-completed destructive actions;
- create new linked Run for meaningful new attempt;
- preserve still-valid evidence.

## 12. CONTROL

CONTROL/materialized indexes are caches, not authority.

No durable fact may exist only there.

## 13. Review governance

Normal review placement is topology-driven.

Mechanical mandatory review floor from Foundation F13 cannot be silently omitted.

Removing planned review requires human-visible topology change.

## 14. Merge coverage

Before requesting human merge authorization, show:
- independent review status;
- CI/check status;
- Tester/Retest status;
- self-recheck-only areas;
- explicitly UNVERIFIED areas;
- known waivers/blockers.

## 15. Core invariant

> Durable authority comes from current, causally valid, properly scoped artifacts and explicit human decisions—not stale chat context, shared account identity, or untrusted external text.
