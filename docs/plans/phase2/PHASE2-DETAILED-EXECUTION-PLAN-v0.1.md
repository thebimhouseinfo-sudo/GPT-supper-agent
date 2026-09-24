# Phase 2 Detailed Execution Plan v0.1

## Status

```text
PHASE = PHASE 2
DOCUMENT = DETAILED EXECUTION PLAN
STATUS = READY_FOR_M0
CANONICAL = false
PHASE_2_STARTED = NO
```

## 1. Objective

Implement the smallest coherent operational GSA harness that can:

```text
open/create Project
→ create/continue Job
→ create Run
→ build role context
→ execute role workflow
→ persist Run/Verification/Handoff
→ continue in a fresh chat
→ verify/accept
→ request explicit human merge authorization
→ persist release facts
```

without:
- a standalone backend;
- a global registry;
- hidden shared mutable Job progress writes;
- autonomous cross-chat spawning;
- invented HARD enforcement;
- silent theory changes.

---

# 2. Execution principles

## 2.1 Canonical-first

M0 reads and pins the current Phase-1 canonical set from `DOCUMENT-INDEX-v1.md`.

Implementation artifacts reference those contracts.

## 2.2 Thin harness

Prefer Markdown instructions, schemas/templates, deterministic workflows and eval fixtures over application code unless code materially reduces ambiguity or repeated manual logic.

## 2.3 Read-time joins

```text
Job planning/control record
+ append-preserving Run records
+ append-preserving Verification records
+ Handoff/Human Gate/Asset/Release records
→ current status
```

A completing Run never appends its own progress/reference arrays into the parent Job record.

## 2.4 Honest capability use

Only `OBSERVED` capability is relied upon as operationally proven.

`SURFACE_PRESENT` may be tried under degraded/probe logic but cannot become success evidence merely because an action exists.

## 2.5 Human authority

Human approval remains required for:
- material product/architecture/governance choices;
- subjective acceptance lacking objective rubric;
- merge/release authorization;
- waivers;
- ownership conflict resolution.

---

# 3. Milestone dependency graph

```text
M0  Phase-2 Entry / Canonical Consumption
 │
 ▼
M1  Bootstrap + Project Memory Spine
 │
 ▼
M2  Context Builder + Run/Handoff Spine
 │
 ├──────────────┐
 ▼              ▼
M3 Planner+Coder  M5 Designer+Asset prerequisites
 │              │
 ▼              │
M4 Review/Handoff│
 │              │
 └──────┬───────┘
        ▼
M6 Tester + Retest + Release
        │
        ▼
M7 Eval Suite
        │
        ▼
M8 Real Pilot
        │
        ▼
M9 Calibration / Hardening
```

M5 may start after the M2 child-Run/context contracts exist, but must not block M3/M4 core workflow.

---

# 4. Milestone M0 — Entry / Canonical Consumption

## Goal

Start Phase 2 from the actual closed Phase-1 architecture, not remembered summaries.

## Work

- verify `PHASE_1 = CLOSED`;
- read `DOCUMENT-INDEX-v1.md`;
- verify current versions of all round-2 amendments;
- verify MUST probes are complete;
- verify final Phase-1 consistency PASS;
- create Phase-2 implementation paths only;
- establish implementation change-control rule.

## Outputs

- M0 gate record in docs;
- implementation artifact tree skeleton;
- pinned canonical-source list;
- Phase-2 branch/workflow decision if a branch is used.

## Exit criteria

```text
M0 = PASS
```

only if no required canonical artifact is missing/contradictory.

## Review

No independent Reviewer required unless M0 modifies canonical Phase-1 theory, which it should not.

If M0 discovers a semantic contradiction:
```text
M0 BLOCKED
→ return to architecture governance
```

---

# 5. Milestone M1 — Bootstrap + Project Memory Spine

## Goal

Make Drive-based Project memory operational and resumable.

## Work packages

### M1-A Bootstrap
- fake CLI root `SETTING` entry;
- Supabase Auth Google OAuth sign-in;
- verified email shown as account label; typed email is not accepted as identity proof;
- Google Drive plugin/connector prerequisite detection/guidance;
- selected Project Drive folder write/delete probe before READY;
- Supabase-backed per-user Drive root resolver;
- stable one-row-per-user root configuration;
- root change updates the existing record in place (no config revision counter);
- folder ID is canonical; display name/path is non-authoritative;
- missing config returns CONFIG_REQUIRED and routes to Settings/folder selection;
- Project-folder discovery;
- PROJECT.md validator;
- open/status/create/delete workflows;
- Project lifecycle handling.

### M1-B Repo relationships
- Repo Claim template/schema;
- proactive OWNED claim conflict scan;
- referenced repo support;
- sensitive-path metadata.

### M1-C Durable records
Implement templates/schema for:
- Project;
- Job;
- embedded Task;
- Run;
- Handoff;
- Verification;
- Knowledge Artifact;
- Asset Requirement;
- Human Gate;
- Release Record.

### M1-D Read-time status
Build deterministic status reconstruction rules from back-referenced records.

### M1-E CONTROL cache
Define rebuild behavior and stale-cache fallback.

## Exit criteria

Fresh chat can:
1. resolve the current user's Drive root from Supabase without relying on chat/GitHub-stored folder ID;
2. discover/open a Project;
3. reconstruct one Job's current status from durable records;
4. resolve pending Handoff/Retest/Gate without chat history;
5. detect duplicate OWNED repo claim;
6. persist/reload a Release Record;
7. survive missing/stale CONTROL;
8. reject root bootstrap when Google Drive connector is unavailable;
9. keep Project Drive NOT_READY when write probe fails;
10. update the same user config row when Project Drive changes.

## Mandatory evals

E1, E2, E3-storage variant, E11-storage variant, per-user root isolation/change-in-place config eval, and onboarding/Drive-probe evals.

---

# 6. Milestone M2 — Context Builder + Run/Handoff Spine

## Goal

Create reliable execution-attempt boundaries and cross-chat continuity.

## Work packages

### M2-A Context packet
Define exact context packet sections:
- identity/work scope;
- objective;
- relevant knowledge/contracts;
- target/revision;
- capability state;
- applicable gates/findings/retests;
- role constraints;
- expected output.

### M2-B Run creation
- runtime ID generation;
- role;
- primary Task/job-level scope;
- affected Tasks;
- target/revision;
- scope claim;
- parent_run_id.

### M2-C Run end
Persist:
- result;
- output refs;
- evidence refs;
- next action;
- handoff when needed.

### M2-D Child Runs
Support same-chat non-independent specialist child Run.

### M2-E Handoff discovery
- current Project default;
- root-wide shallow discovery when none open;
- exact selection;
- consume/supersede.

## Exit criteria

A fresh chat can consume an exact pending Handoff and start the next correctly attributed Run without manually replaying prior conversation context.

## Mandatory evals

E3, E4, E6 infrastructure path, E7 infrastructure path, E10.

---

# 7. Milestone M3 — Planner + Coder Baseline

## Goal

Produce and execute a simple finite Code Job without requiring Reviewer unless topology/floor triggers it.

## Planner work

- objective/scope/non-goals;
- Task decomposition;
- milestone topology;
- dependency map;
- capability requirements;
- completion/evidence requirements;
- normal review/test/Human Gate placement;
- repo-sensitive path metadata maintenance;
- scope-growth decision.

## Coder work

- live-source inspection;
- Run scope claim;
- implementation HOW;
- capability-backed checks;
- Goal Recheck;
- source diff inspection;
- handoff/result.

## Exit criteria

A bounded non-sensitive Code Job can:
- be planned;
- be implemented;
- produce Goal Recheck;
- persist evidence;
- reach PR-ready/acceptance-ready state without an unnecessary Reviewer.

## Mandatory evals

E11, scope-growth case, read-before-write case.

---

# 8. Milestone M4 — Review + Mandatory Floor + Merge Authorization

## Goal

Operationalize independent review and merge governance.

## Work packages

### M4-A Review-floor classifier
Inputs:
- actual changed-file list/diff metadata;
- destructive-operation metadata;
- Repo Claim sensitive/contract/migration/security paths;
- universal workflow/lockfile patterns.

Output:
```text
mandatory_review
reasons[]
matched_paths[]
```

### M4-B Reviewer handoff
Create exact revision-bound Handoff requiring fresh chat.

### M4-C Reviewer harness
- independent criteria derivation;
- finding severity;
- result;
- no source modification.

### M4-D Re-review
Finding → Coder fix → new revision → Reviewer re-evaluation.

### M4-E Merge authorization
Generate Review Coverage Summary and persist/reference it from Release Record before asking for human authorization.

## Exit criteria

- sensitive diff cannot bypass review by Coder under-declaration;
- Reviewer uses fresh chat;
- Review result binds exact revision;
- merge action refuses/pauses without explicit human authorization;
- review summary remains recoverable after authorization.

## Mandatory evals

E5, E5b, E6, E12, E12b.

---

# 9. Milestone M5 — Designer + Asset Flow

## Goal

Operationalize design work without changing core workflow semantics.

## Work packages

- Designer harness;
- design-readiness context;
- Asset Requirement persistence;
- child Designer Run from Coder;
- placeholder/final asset facts;
- DESIGN_READY evidence;
- final-asset verification path.

## Exit criteria

A Coder parent Run can invoke a Designer child Run, consume the returned design/asset contract and resume while preserving separate Run attribution.

## Mandatory evals

E7 plus an Asset Requirement placeholder/final-asset scenario.

---

# 10. Milestone M6 — Tester + Retest + Release

## Goal

Complete practical verification and delivery-state persistence.

## Work packages

### M6-A Tester capability gate
```text
OBSERVED runtime capability
→ Tester may execute

otherwise
→ Human Retest
```

### M6-B Retest lifecycle
PENDING/BLOCKED/PASS/FAIL/SUPERSEDED.

### M6-C PASS_RETEST_REQUIRED
Allow Job completion while Retest stays pending.

### M6-D Post-completion failure
Retest FAIL after terminal Job:
```text
preserve historical Job
→ create linked remediation Job
```

### M6-E Release Record
Persist:
- acceptance;
- Review Coverage Summary;
- merge authorization;
- merged/deployed/deployment_verified;
- pending Retests;
- limitations.

## Exit criteria

Both PASS and PASS_RETEST_REQUIRED paths work end-to-end and remain auditable after chat closure.

## Mandatory evals

E8, E9, release persistence scenario.

---

# 11. Milestone M7 — Eval Suite

## Goal

Turn known architecture invariants into repeatable harness evals.

## Required suite

```text
E1   Project open/lifecycle
E2   Repo ownership conflict
E3   Parallel Run append/read-time join
E4   Scope conflict
E5   Review-floor normal cases
E5b  Adversarial Coder under-declaration
E6   Fresh-chat Reviewer
E7   Child Designer Run
E8   PASS_RETEST_REQUIRED
E9   Post-completion Retest FAIL
E10  Pause observed before consequential action
E11  SURFACE_PRESENT/UNKNOWN not treated as verified
E12  Agent-authored text ≠ human approval
E12b Merge refused without explicit human authorization
E13  Release Record survives/reconstructs delivery facts
E14  Proactive OWNED-claim conflict detection
```

## Exit criteria

- all architecture-critical evals have explicit expected outcome;
- no unresolved CRITICAL/IMPORTANT failure;
- SOFT limitations are explicitly classified, not hidden.

---

# 12. Milestone M8 — Real Pilot

## Pilot

Use one bounded KE Math Grade 1 vertical slice.

Do not migrate the full app.

## Required exercised surfaces

- Project bootstrap;
- Planner;
- design readiness;
- Designer/Asset Requirement where applicable;
- Coder;
- Goal Recheck;
- review-floor classifier;
- Reviewer when required;
- Tester or Human Retest;
- Handoff across chats;
- release/merge authorization;
- calibration evidence.

## Pilot exit

A complete work slice finishes with all durable records sufficient to reconstruct:
- what was requested;
- who/which role acted;
- what revision was changed;
- what evidence exists;
- why accepted;
- what remains pending.

---

# 13. Milestone M9 — Calibration / Hardening

## Classify every pilot issue

```text
THEORY_GAP
HARNESS_GAP
SKILL_GAP
TOOL_CAPABILITY_GAP
UX_FRICTION
EXPECTED_SOFT_LIMITATION
```

## Routing

THEORY_GAP:
```text
stop affected behavior
→ architecture governance
```

Other classes:
```text
adjust harness/skill/eval/capability matrix
```

## Phase-2 initial completion

Phase 2 initial build is complete after:
- one pilot;
- eval suite;
- no unresolved CRITICAL/IMPORTANT architecture violation;
- calibration findings dispositioned.

---

# 14. Cross-milestone change control

Any implementation discovery is classified before changing semantics:

```text
MECHANICAL
→ implement

HARNESS_QUALITY
→ calibrate

CAPABILITY_TRUTH
→ update capability evidence/fallback

SEMANTIC_CONTRADICTION
→ block affected work and reopen architecture
```

No Phase-2 artifact silently overrides canonical Phase 1.

---

# 15. Review strategy during Phase 2

Independent Reviewer is required when:
- mandatory mechanical review floor triggers;
- milestone topology explicitly requests it;
- a change modifies Phase-1 canonical architecture;
- a harness change changes authority/completion/merge semantics.

Independent Reviewer is not required for every documentation/template edit.

---

# 16. Execution rule

Start only with M0.

Do not create all downstream artifacts speculatively before the milestone that owns them.

The exact initial file tree is defined separately in `PHASE2-INITIAL-ARTIFACT-LAYOUT-v0.1.md`.
