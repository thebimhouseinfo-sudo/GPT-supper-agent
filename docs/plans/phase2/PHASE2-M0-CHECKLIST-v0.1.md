# Phase 2 M0 Checklist v0.1

## Purpose

M0 is the only allowed entry point into Phase 2.

It confirms Phase-2 implementation consumes the closed Phase-1 architecture rather than silently redefining it.

## Checklist

### A. Phase-1 closure

- [ ] `SYSTEM-DEFINITION-SKELETON-v0.1.md` shows `PHASE_1 = CLOSED`.
- [ ] `FINAL-PHASE1-CONSISTENCY-REVIEW-PASS-03.md` result = PASS.
- [ ] Claude Round-2 dispositions R2-01..R2-07 are recorded resolved.
- [ ] MUST platform probes are complete/classified.

### B. Canonical version pin

Read `DOCUMENT-INDEX-v1.md` and record the versions used for Phase-2 bootstrap.

At minimum pin:
- Foundation;
- Architecture;
- Project Memory;
- Job Lifecycle;
- State Model;
- Governance;
- Security/Trust;
- Agent Contracts;
- Execution/Review;
- Core Record Contracts;
- Attribution/Scope Claims;
- Capability Catalog;
- Dispatch/Handoff;
- Goal Recheck.

### C. Round-2 amendment check

Confirm:
- [ ] read-time join/no Run→Job write-back;
- [ ] mechanical review-floor classification from actual diff;
- [ ] OBSERVED/SURFACE_PRESENT/UNAVAILABLE/UNKNOWN;
- [ ] Knowledge Artifact schema;
- [ ] scoped Handoff discovery;
- [ ] Job scope-growth boundary;
- [ ] Run WAITING_HUMAN/BLOCKED derived conditions.

### D. Implementation tree

Create/confirm the initial repository implementation roots:

```text
harness/
schemas/
evals/
```

Do not populate downstream milestone files merely to make the tree look complete.

### E. Capability baseline

Record current known capability truth from `CAPABILITY-CATALOG-v1.md`.

Phase-2 bootstrap probes before first affected use:
- protected/default branch behavior;
- generated-image direct persistence;
- practical runtime/browser Tester capability.

### F. Change-control rule

Confirm implementation team/agent uses:

```text
mechanical detail
→ implement

harness quality
→ calibrate

capability truth
→ update matrix/fallback

semantic contradiction
→ STOP affected work
→ architecture governance
```

### G. M0 result

```text
PASS
BLOCKED
HUMAN_REVIEW_REQUIRED
```

M0 PASS record should include:
- timestamp if available;
- canonical version pin;
- current capability snapshot;
- unresolved non-blocking limitations;
- next Task = P2-T010.

## M0 prohibition

M0 must not modify Phase-1 theory merely to make implementation convenient.
