# Phase 2 Initial Artifact Layout v0.1

## Status

```text
LAYOUT = INITIAL IMPLEMENTATION LAYOUT
CREATE_LAZILY = true
CANONICAL = false
```

This is the initial exact repository layout for Phase-2 harness implementation.

It is intentionally a thin harness/document-contract tree, not an application runtime.

---

# 1. Repository layout

```text
harness/
├── bootstrap/
│   ├── landing.md
│   └── help.md
├── roles/
│   ├── orchestrator.md
│   ├── planner.md
│   ├── designer.md
│   ├── coder.md
│   ├── reviewer.md
│   └── tester.md
├── workflows/
│   ├── project.md
│   ├── job.md
│   ├── run.md
│   ├── handoff.md
│   ├── retest.md
│   └── release.md
├── policies/
│   ├── context-builder.md
│   ├── capability-resolution.md
│   ├── scope-conflict.md
│   ├── review-floor.md
│   ├── merge-authorization.md
│   └── trust-boundaries.md
└── templates/
    ├── PROJECT.md.tpl
    ├── job.json.tpl
    ├── run.json.tpl
    ├── handoff.json.tpl
    ├── verification.json.tpl
    ├── knowledge.md.tpl
    ├── asset-requirement.json.tpl
    ├── human-gate.json.tpl
    ├── release.json.tpl
    └── control.json.tpl

schemas/
├── project.schema.json
├── repo-claim.schema.json
├── job.schema.json
├── run.schema.json
├── handoff.schema.json
├── verification.schema.json
├── knowledge.schema.json
├── asset-requirement.schema.json
├── human-gate.schema.json
└── release.schema.json

evals/
├── README.md
├── cases/
│   ├── E01-project-open.md
│   ├── E02-ownership-conflict.md
│   ├── E03-parallel-runs.md
│   ├── E04-scope-conflict.md
│   ├── E05-review-floor.md
│   ├── E05b-review-floor-adversarial.md
│   ├── E06-reviewer-independence.md
│   ├── E07-child-designer.md
│   ├── E08-pass-retest-required.md
│   ├── E09-post-completion-retest-fail.md
│   ├── E10-pause-race.md
│   ├── E11-capability-truth.md
│   ├── E12-human-approval-attribution.md
│   ├── E12b-merge-without-authorization.md
│   ├── E13-release-persistence.md
│   └── E14-proactive-owned-claim.md
└── fixtures/
    └── README.md

docs/
└── plans/
    └── phase2/
        ├── PHASE2-EXECUTION-PACK-INDEX-v0.1.md
        ├── PHASE2-DETAILED-EXECUTION-PLAN-v0.1.md
        ├── PHASE2-TASK-LIST-v0.1.md
        ├── PHASE2-ACCEPTANCE-EVAL-MATRIX-v0.1.md
        └── PHASE2-INITIAL-ARTIFACT-LAYOUT-v0.1.md
```

---

# 2. Why these top-level areas

## harness/

Operational instructions/workflows that ChatGPT/connected tools follow.

No standalone service is implied.

## schemas/

Machine-checkable serialization contracts for durable Drive records.

These are implementation artifacts derived from Phase-1 semantic contracts.

## evals/

Repeatable harness cases and fixtures.

This prevents quality rules from existing only as prose.

---

# 3. Creation by milestone

## M0 creates
```text
harness/
schemas/
evals/
```
as empty/skeleton directories only if repository tooling requires explicit placeholders.

Do not populate all files speculatively.

## M1 creates
```text
harness/bootstrap/*
harness/workflows/project.md
harness/workflows/job.md
harness/templates/PROJECT.md.tpl
harness/templates/job.json.tpl
harness/templates/run.json.tpl
harness/templates/verification.json.tpl
harness/templates/knowledge.md.tpl
harness/templates/release.json.tpl
harness/templates/control.json.tpl
schemas/project.schema.json
schemas/repo-claim.schema.json
schemas/job.schema.json
schemas/run.schema.json
schemas/verification.schema.json
schemas/knowledge.schema.json
schemas/release.schema.json
```

## M2 creates
```text
harness/policies/context-builder.md
harness/workflows/run.md
harness/workflows/handoff.md
harness/templates/handoff.json.tpl
schemas/handoff.schema.json
```

## M3 creates
```text
harness/roles/planner.md
harness/roles/coder.md
```

## M4 creates
```text
harness/roles/reviewer.md
harness/policies/review-floor.md
harness/policies/merge-authorization.md
```

## M5 creates
```text
harness/roles/designer.md
harness/templates/asset-requirement.json.tpl
schemas/asset-requirement.schema.json
```

## M6 creates
```text
harness/roles/tester.md
harness/workflows/retest.md
harness/workflows/release.md
harness/templates/human-gate.json.tpl
schemas/human-gate.schema.json
```

## Cross-cutting policies created when first needed
```text
harness/roles/orchestrator.md
harness/policies/capability-resolution.md
harness/policies/scope-conflict.md
harness/policies/trust-boundaries.md
```

## M7 creates
```text
evals/README.md
evals/cases/*
evals/fixtures/*
```

---

# 4. File ownership / mutation rules

## Phase-1 canonical docs
```text
docs/architecture/*
```
are read-only for normal Phase-2 implementation.

A material semantic contradiction triggers architecture governance before modifying them.

## harness/
May evolve during Phase-2 calibration.

Changes affecting authority/completion/review/merge semantics require governance-sensitive review.

## schemas/
Derived from Phase-1 contracts.

Schema change that alters semantic meaning requires architecture check.

Pure validation/serialization corrections are implementation detail.

## evals/
Append/update freely to capture discovered behavior.

An eval may reveal a theory gap but does not itself change theory.

---

# 5. Serialization defaults

Initial default:
- JSON for structured mutable/append records;
- Markdown + structured front matter for Knowledge artifacts;
- Markdown for harness instructions/workflows/eval cases.

Exact JSON Schema draft/version is implementation detail.

Do not introduce YAML unless it materially improves an actual workflow.

---

# 6. Drive Project layout produced by harness

The repository implementation above writes/reads Project memory using:

```text
<Project>/
├── PROJECT.md
├── CONTROL.json
├── WORK/
│   ├── jobs/
│   └── runs/
├── KNOWLEDGE/
└── VERIFICATION/
```

Recommended initial record placement:

```text
WORK/jobs/<job-handle-or-id>.json
WORK/runs/<run-id>.json

VERIFICATION/<verification-id>.json

KNOWLEDGE/<knowledge-id>-<slug>.md
```

Handoffs, Asset Requirements, Human Gates and Release Records may initially live as distinct JSON records under the most relevant shared durable family rather than forcing extra Drive folders.

Preferred initial mapping:

```text
VERIFICATION/
  verification/test/retest/goal-recheck records

WORK/
  Job / Run / Handoff / Human Gate records

KNOWLEDGE/
  Decision / Contract / Plan / Design / Asset Requirement metadata+body

Release Record
  WORK or VERIFICATION implementation choice,
  but must remain uniquely addressable and queryable by project_id/job_id.
```

Before implementation, M1 should choose one deterministic Release/Handoff/Gate placement and document it in the workflow/templates without adding new semantic entities.

---

# 7. Avoided structures

Do not create:
- database service;
- registry service;
- server daemon;
- per-role duplicate Project Memory trees;
- one folder for every semantic concept;
- Job progress indexes that each Run mutates;
- hidden local state required for resume.

---

# 8. Layout change rule

If a different physical layout materially improves implementation without changing semantic relationships, Coder may propose the change as local implementation detail.

If the change alters:
- ownership;
- durability;
- authority;
- lifecycle;
- read-time-join semantics;
- review/merge governance;

route to architecture governance.
