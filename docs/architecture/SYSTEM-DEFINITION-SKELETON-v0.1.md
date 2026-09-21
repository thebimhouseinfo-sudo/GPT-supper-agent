# System Definition Skeleton v1

## Purpose

This file is the current map of GPT Super Agent theory after DETAIL → COLLECT → REVIEW → SYNTHESIZE Pass 01.

Status vocabulary:

```text
FROZEN
= foundationally accepted

DEFINED
= theory sufficiently specified for implementation/harness work

CALIBRATION
= operational harness/skill/loop behavior expected to evolve from real use
```

---

## S0. Product boundary — FROZEN

Defined in:
- FROZEN-FOUNDATION-v0.1.md
- ARCHITECTURE-v0.1.md

---

## S1. Project / Drive model — FROZEN

Defined:
- configured Drive root;
- Project as direct child folder;
- PROJECT.md marker;
- Project lifecycle;
- Drive-first open;
- 0..N owned repos;
- 0..N referenced repos;
- Project delete semantics.

References:
- FROZEN-FOUNDATION-v0.1.md
- PROJECT-MEMORY-v0.1.md
- JOB-LIFECYCLE-v0.1.md

---

## S2. Work hierarchy — DEFINED

```text
Project
→ Job
→ Task
→ Run
```

Run uses one execution scope:
- Job-level; or
- one primary Task;
- plus optional affected Task refs.

References:
- STATE-MACHINE-v1.md
- synthesized core schemas.

---

## S3. Repository model — DEFINED

Defined:
- OWNED vs REFERENCED;
- one owning Project per repo;
- referenced repos read-only;
- copied/forked derived source becomes owned destination;
- Job/Task scope cannot exceed Project ownership.

---

## S4. Project Memory / storage — DEFINED

Canonical model:

```text
<Project>/
├── PROJECT.md
├── CONTROL.json
├── WORK/
├── KNOWLEDGE/
└── ARTIFACTS/
```

Subcollections are derived from persistence/query requirements.

Reference:
- PROJECT-MEMORY-v0.1.md

---

## S5. State model — DEFINED

Separate:
- lifecycle;
- result;
- validity;
- delivery facts;
- verification obligations.

Reference:
- STATE-MACHINE-v1.md

---

## S6. Orchestrator — DEFINED

Owns:
- transition governance;
- current work routing;
- handoff persistence;
- Human Gate routing;
- conflict detection;
- capability coordination;
- status views.

Does not implement source.

---

## S7. Planner — DEFINED

Owns:
- intent/scope;
- architecture/impact;
- Job topology;
- acceptance/verification strategy;
- role ordering;
- specialist readiness;
- Causal Change Review support.

Coder refines exact live-source HOW.

---

## S8. Designer — DEFINED

Owns:
- visual interpretation;
- design coverage;
- concept/design system;
- responsive visual intent;
- Asset Requirement design semantics.

Specialist methodology belongs in Designer skills/harness, not core GSA theory.

---

## S9. Coder — DEFINED

Owns:
- exact source implementation HOW;
- approved owned repo writes;
- continuous self QA/QC;
- smallest causally sufficient change;
- honest verification;
- fix/re-review loop.

UX/UI Coder are specializations.

---

## S10. Reviewer — DEFINED

Owns:
- independent objective evaluation;
- exact target/revision binding;
- findings;
- severity;
- re-review;
- HUMAN_REVIEW_REQUIRED routing.

Reviewer is topology-driven, not universally mandatory.

---

## S11. Tester — DEFINED

Owns:
- scripted practical testing;
- exploratory testing;
- Retest execution where possible;
- discovery of unforeseen realistic failures.

Tester is distinct from Reviewer.

---

## S12. QA / QC — DEFINED

```text
QA = COMPLIANCE/process assurance
QC = CORRECTNESS + FIT/output quality
```

Layered across Coder / Reviewer / Tester.

---

## S13. Handoff — DEFINED

Handoff transfers responsibility between Runs.

Current platform:
```text
human-dispatched
+ durable transition state
```

Future automatic dispatch is an extension point.

---

## S14. Context Builder — DEFINED

```text
Project Memory
+ current work/request
+ relevant live evidence
→ minimum sufficient role-specific packet
```

No fixed theory token quota.

---

## S15. Human Gate / Approval — DEFINED

Planned Human Gate and Runtime Confirmation are distinct.

Runtime Confirmation is never a durable approval record.

Material governance/waiver/release decisions may persist.

---

## S16. Verification / Evidence — DEFINED

Evidence:
- provenance-aware;
- exact target/revision-bound;
- causally revalidated;
- categorical provenance, not numeric confidence.

Unavailable verification may create PASS_RETEST_REQUIRED.

---

## S17. Capability / Executor — DEFINED

Capability state:

```text
AVAILABLE
UNAVAILABLE
UNKNOWN
```

Derived execution mode may be NORMAL / DEGRADED / BLOCKED.

Unknown is treated operationally as unavailable.

---

## S18. Multi-repo coordination — DEFINED

Change Set is used only when one logical change truly spans/coordin­ates repos.

Repo completion does not imply integrated completion.

---

## S19. Governance / artifact lifecycle — DEFINED

Defined:
- stable IDs/revisions;
- causal invalidation;
- optimistic concurrency;
- revision lineage;
- no blanket stale;
- no last-write-wins.

---

## S20. Security / trust — DEFINED

Defined:
- external content is data, not authority;
- no inferred permission escalation;
- destructive confirmations proportional to blast radius;
- secrets not copied unnecessarily;
- OWNED/REFERENCED as trust boundary.

---

## S21. Asset Requirement — DEFINED

Stable integration contract may precede final binary asset.

Placeholder/final/integration/verification are separate concepts.

---

## S22. Retest — DEFINED

Retest is durable practical verification obligation.

Status:
PENDING / BLOCKED / PASS / FAIL / SUPERSEDED.

History is append-preserving.

---

## S23. Release / completion — DEFINED

Project lifecycle is separate from release milestones.

Job completion is topology-driven.

Delivery facts:
accepted / merged / deployed / deployment_verified.

---

## S24. Command / User UX — DEFINED

Outer surface:

```text
PROJECT
DIRECT AGENT
HELP
```

Deep CLI synthesized minimally from recurring needs.

Natural language remains equivalent.

---

## S25. Failure / recovery — DEFINED

Recover at smallest causal scope.

Interrupted meaningful retry creates new linked Run.

Partial effects are observed/reconciled rather than assumed rolled back.

---

## S26. Harness Quality Loop — DEFINED / CALIBRATION

Theory is defined.

Operational skills/harnesses/loops/actions are reference-informed baseline in Phase 2, then calibrated using real Project output evidence.

---

## S27. Schemas — DEFINED

Core semantic schemas synthesized for:
- Project;
- Job;
- Task;
- Run;
- Handoff;
- Human Gate;
- Review/Finding;
- Evidence;
- Retest;
- Asset Requirement;
- Capability;
- Release;
- CONTROL.

Exact machine validation syntax belongs to implementation detail.

---

## S28. Implementation architecture — NEXT AFTER THEORY STABILIZATION

GSA is primarily theory + instructions + harnesses + skills + connected platform capabilities, not a standalone runtime product that requires a large custom engine first.

Phase 2 implementation architecture should therefore focus on:
- plugin/harness packaging;
- skill loading;
- tool/action routing;
- Drive/GitHub connector use;
- schema/template handling where needed;
- user-facing fake CLI/control surface.

Do not prematurely design a heavy runtime.

---

## S29. Theory process — FROZEN META-RULE

```text
DETAIL
→ COLLECT
→ REVIEW
→ SYNTHESIZE
→ FIX
→ repeat
```

After this FIX pass:
```text
COLLECT PASS 02
→ REVIEW PASS 02
```

The goal is to detect contradictions introduced by synthesis/fix before declaring theory complete.
