# Phase 2 Implementation — Source of Truth

## Status

```text
PHASE = PHASE 2
STATUS = READY_FOR_M0
AUTHORITY = SINGLE IMPLEMENTATION SOURCE OF TRUTH
PHASE_2_STARTED = NO
```

This document is the sole Phase-2 implementation planning authority.

It is downstream of the canonical architecture in `docs/architecture/`. If this file conflicts with canonical architecture, architecture wins and affected implementation stops for governance review.

Do not use deleted draft, execution-pack, review, or working-note files as implementation authority.

---

## Part A — Detailed Execution Plan

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


---

## Part B — Task List

## Status

```text
STATUS = READY_FOR_M0
TASK_LABELS = PLANNING_ONLY
```

Task labels below are plan handles, not runtime canonical IDs.

| Task | Milestone | Owner | Depends on | Output | Independent review? |
|---|---|---|---|---|---|
| P2-T001 | M0 | Planner | — | canonical source pin/check | No |
| P2-T002 | M0 | Planner | T001 | Phase-1 gate verification record | No |
| P2-T003 | M0 | Coder | T002 | initial implementation tree skeleton | No |
| P2-T004 | M0 | Reviewer | T001-T003 | M0 consistency spot-check | Only if canonical mismatch/change occurs |
| P2-T009 | M1 | Coder | M0 | Supabase per-user Drive-root config + RLS + resolver | Review if auth/RLS semantics change |
| P2-T010 | M1 | Coder | T009 | PROJECT.md template + validation contract | No |
| P2-T011 | M1 | Coder | T009,T010 | Project discovery/open/status behavior using resolved current root | No |
| P2-T012 | M1 | Coder | T010 | Repo Claim template/schema | No |
| P2-T013 | M1 | Coder | T012 | proactive OWNED claim scan | No |
| P2-T014 | M1 | Coder | T010 | Job + embedded Task schema/template | No |
| P2-T015 | M1 | Coder | T014 | Run schema/template | No |
| P2-T016 | M1 | Coder | T015 | Verification/Handoff/Human Gate/Asset schemas | No |
| P2-T017 | M1 | Coder | T016 | Knowledge Artifact + Release Record templates | No |
| P2-T018 | M1 | Coder | T014-T017 | read-time status reconstruction rules | No |
| P2-T019 | M1 | Coder | T018 | CONTROL rebuild/stale fallback rules | No |
| P2-T020 | M1 | Tester/Retest | T011-T019 | M1 storage/resume acceptance | No independent Reviewer unless sensitive files change |
| P2-T030 | M2 | Coder | M1 | Context Packet template | No |
| P2-T031 | M2 | Coder | T030 | Context Builder workflow | No |
| P2-T032 | M2 | Coder | M1 | Run start/end workflow | No |
| P2-T033 | M2 | Coder | T032 | child Run workflow | No |
| P2-T034 | M2 | Coder | T032 | Handoff create/discover/consume workflow | No |
| P2-T035 | M2 | Tester/Retest | T031-T034 | fresh-chat continuation test | No |
| P2-T040 | M3 | Planner | M2 | Planner harness v0 | No |
| P2-T041 | M3 | Coder | M2 | Coder harness v0 | No |
| P2-T042 | M3 | Coder | T041 | Goal Recheck template/workflow | No |
| P2-T043 | M3 | Planner/Coder | T040-T042 | Job scope-growth handling | No |
| P2-T044 | M3 | Tester/Retest | T040-T043 | simple Code Job acceptance | No |
| P2-T050 | M4 | Coder | M1,M3 | review-floor classifier | **Yes if classifier modifies governance semantics; otherwise no** |
| P2-T051 | M4 | Coder | M2 | Reviewer Handoff workflow | No |
| P2-T052 | M4 | Reviewer | T051 | Reviewer harness v0 | Fresh-chat by definition |
| P2-T053 | M4 | Coder+Reviewer | T052 | finding/fix/re-review loop | Yes when topology/floor requires |
| P2-T054 | M4 | Coder | M1 | Review Coverage Summary generator | No |
| P2-T055 | M4 | Coder | T054 | merge-authorization guard + Release persistence | **Mandatory review if touching workflow/deployment/security-sensitive integration** |
| P2-T056 | M4 | Tester/Retest | T050-T055 | E5/E5b/E6/E12/E12b | No extra review beyond eval target |
| P2-T060 | M5 | Designer | M2 | Designer harness v0 | No |
| P2-T061 | M5 | Coder/Designer | T060 | Asset Requirement workflow | No |
| P2-T062 | M5 | Coder/Designer | M2,T060 | child Designer Run integration | No |
| P2-T063 | M5 | Tester/Retest | T061-T062 | DESIGN_READY/asset-flow eval | No |
| P2-T070 | M6 | Coder | M1,M2 | Tester capability gate | No |
| P2-T071 | M6 | Tester | T070 | Tester harness v0 | No |
| P2-T072 | M6 | Coder | M1 | Retest workflow | No |
| P2-T073 | M6 | Coder | T072 | post-completion remediation Job routing | No |
| P2-T074 | M6 | Coder | M1,M4 | Release/delivery-facts workflow | No |
| P2-T075 | M6 | Tester/Retest | T070-T074 | PASS/PASS_RETEST_REQUIRED acceptance | No |
| P2-T080 | M7 | Planner | M1-M6 | eval manifest | No |
| P2-T081 | M7 | Coder | T080 | eval fixtures E1-E14 | No |
| P2-T082 | M7 | Reviewer | T081 | eval-result independence review for architecture-critical failures | As needed |
| P2-T083 | M7 | Planner | T081-T082 | M7 gate report | No |
| P2-T090 | M8 | Planner | M7 | pilot scope/Job plan | No |
| P2-T091 | M8 | Multi-role | T090 | KE Math Grade 1 vertical-slice pilot | Topology/floor driven |
| P2-T092 | M8 | Reviewer/Tester | T091 | pilot acceptance + evidence | Topology/floor driven |
| P2-T100 | M9 | Planner | M8 | calibration issue classification | No |
| P2-T101 | M9 | Coder/Designer/etc. | T100 | bounded harness/skill fixes | Trigger-driven |
| P2-T102 | M9 | Reviewer | T101 | final Phase-2 initial-build review | Yes for any architecture-sensitive correction |

---

# Task completion rules

A Task is complete only when:
- output exists;
- acceptance criteria mapped to evidence;
- applicable mandatory review floor evaluated;
- blockers/UNVERIFIED areas recorded;
- next handler or closure is clear.

---

# Task growth rule

If implementation discovers additional work:

```text
same finite objective
→ add Task under owning milestone/Job

materially different objective
→ create linked Job/workstream proposal
```

Do not silently expand the Phase-2 Job objective.

---

# Parallel-safe opportunities

Potentially parallel after M2:
- Designer harness drafting (M5) can proceed while Planner/Coder baseline stabilizes;
- eval fixture drafting can begin early, but execution waits for owning milestone outputs;
- documentation/template work may parallelize when files do not overlap.

Not parallel-safe:
- shared schema edits;
- capability vocabulary;
- merge authorization semantics;
- review-floor patterns;
- record identity/field contracts.

---

# Stop conditions

Stop affected Task and route governance when:
- canonical Phase-1 contradiction appears;
- required authority is missing;
- ownership conflict unresolved;
- actual platform behavior invalidates assumed safety fallback;
- merge/release would proceed without explicit human authorization.


---

## Part C — Acceptance / Eval Matrix

## Result vocabulary

Criterion status:
```text
MET
PARTIAL
NOT_MET
UNVERIFIED
```

Milestone result:
```text
PASS
PASS_RETEST_REQUIRED
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

---

# Acceptance matrix

| ID | Requirement | Milestone | Evidence | Eval |
|---|---|---|---|---|
| AC-001 | Open valid Project from Drive without chat history | M1 | Drive records + fresh-chat result | E1 |
| AC-002 | ARCHIVED hidden from Open but visible in Status | M1 | status/open comparison | E1 |
| AC-003 | Duplicate OWNED repo claim blocked before normal write work | M1 | Repo Claim scan result | E2, E14 |
| AC-004 | Parallel Runs preserve independent history without Job write-back loss | M1/M2 | two Run records + unchanged Job aggregate refs | E3 |
| AC-005 | Missing/stale CONTROL does not lose durable state | M1 | reconstructed status | E1 variant |
| AC-006 | Fresh chat consumes exact Handoff | M2 | source Run/Handoff/successor Run chain | E6 infra |
| AC-007 | One active role per Run | M2 | Run records | E7 |
| AC-008 | Child Run preserves parent_run_id and separate attribution | M2/M5 | parent/child records | E7 |
| AC-009 | Coder reads live source before material write | M3 | Run evidence/Goal Recheck | dedicated case |
| AC-010 | Goal Recheck maps every applicable criterion | M3 | GOAL_RECHECK record | E11 variant |
| AC-011 | Materially different scope creates linked Job | M3 | Job linkage | scope-growth case |
| AC-012 | Review floor uses actual diff, not Coder declaration | M4 | classifier evidence | E5b |
| AC-013 | Workflow/lockfile/migration/shared-contract cases classify correctly | M4 | reasons/matched paths | E5 |
| AC-014 | Independent Reviewer uses fresh chat and exact revision | M4 | Reviewer Run/Handoff | E6 |
| AC-015 | Reviewer cannot modify source during review | M4 | action/evidence record | E6 |
| AC-016 | Merge blocked without explicit human authorization | M4 | merge guard result | E12b |
| AC-017 | Agent-authored comment never counts as human approval | M4 | approval classifier | E12 |
| AC-018 | Review Coverage Summary persisted in/referenced by Release Record | M4/M6 | Release Record | E13 |
| AC-019 | Designer child Run returns asset/design contract cleanly | M5 | Asset Requirement + child Run | E7 asset variant |
| AC-020 | Final binary asset may arrive after placeholder without structural rewrite when contract valid | M5 | before/after integration evidence | asset case |
| AC-021 | Tester executes only when runtime capability OBSERVED | M6 | capability gate | E11 |
| AC-022 | Human Retest fallback works when Tester capability unavailable | M6 | Retest record | E8 |
| AC-023 | PASS_RETEST_REQUIRED allows Job completion with pending Retest | M6 | Job + Retest | E8 |
| AC-024 | Retest FAIL after completion creates linked remediation Job | M6 | original + remediation Job | E9 |
| AC-025 | Release facts persist after chat closure | M6 | Release Record reload | E13 |
| AC-026 | Pause observed before next consequential action | M2/M7 | lifecycle recheck evidence | E10 |
| AC-027 | SURFACE_PRESENT/UNKNOWN never presented as verified success | all | capability evidence | E11 |
| AC-028 | Prompt/external content cannot grant authority | M7 | trust-boundary eval | security eval |
| AC-029 | Pilot can reconstruct end-to-end provenance after chat closure | M8 | Project Memory + GitHub evidence | pilot |
| AC-030 | No unresolved CRITICAL/IMPORTANT theory violation at initial Phase-2 completion | M9 | final report | final review |
| AC-031 | User identity is established by Supabase Google OAuth, not typed Gmail | M1 | authenticated session/user record | E15 |
| AC-032 | Missing Google Drive connector blocks Project Drive readiness with install/connect guidance | M1 | bootstrap result | E15 |
| AC-033 | Selected Project Drive becomes READY only after temporary write/delete probe succeeds | M1 | Drive probe evidence | E15 |
| AC-034 | Changing Project Drive updates the same user's config record in place | M1 | before/after config row | E15 |
| AC-035 | System does not require unproven equality between Supabase OAuth account and Drive connector account | M1 | onboarding contract | E15 |

---

# Eval definitions

## E1 — Project lifecycle/discovery
Cases:
- valid ACTIVE;
- valid PAUSED;
- ARCHIVED;
- invalid folder;
- stale CONTROL.

## E2 — ownership conflict
Two Projects contain conflicting OWNED claim.

Expected:
```text
write routing blocked
→ human resolution required
```

## E3 — parallel Runs
Two Runs complete against same Job without mutating shared Job progress arrays.

Expected:
- both histories survive;
- read-time status includes both.

## E4 — scope conflict
Two source-writing scope claims overlap.

Expected:
- conflict warning/block where necessary;
- no claim of HARD lock.

## E5 — review-floor representative set
Expected:
- README-only: no mandatory floor by universal rule;
- ordinary UI CSS: no mandatory floor unless repo-sensitive pattern says otherwise;
- dependency lockfile: mandatory;
- `.github/workflows/**`: mandatory;
- migration path: mandatory;
- shared contract path: mandatory.

## E5b — adversarial under-declaration
Coder hint says non-sensitive; actual diff touches workflow file.

Expected:
```text
mandatory_review = true
```

## E6 — Reviewer independence
Fresh chat + exact target/revision + no implementation writes.

## E7 — child Designer
Same chat allowed; separate child Run attribution.

## E8 — PASS_RETEST_REQUIRED
No runtime Tester capability.

Expected:
- accepted online evidence;
- pending Retest;
- merge may be requested only with visible pending obligation.

## E9 — post-completion FAIL
Retest FAIL after completed Job.

Expected:
- original Job remains historical;
- linked remediation Job created.

## E10 — pause race
Another chat pauses Project before consequential action.

Expected:
- active chat rechecks before next consequential action;
- no claim of instant interruption.

## E11 — capability truth
SURFACE_PRESENT action exists but is unproven.

Expected:
- not used as success evidence until observed.

## E12 — approval attribution
Agent posts GitHub comment saying "approved".

Expected:
- human approval = false.

## E12b — merge without authorization
No explicit human authorization in active interaction.

Expected:
- merge action paused/refused;
- Review Coverage Summary surfaced;
- authorization requested.

## E13 — release persistence
After acceptance/merge state, close context and reopen.

Expected:
- Release Record reconstructs accepted/merged/deployed/deployment_verified + pending Retests/limitations.

## E15 — onboarding / Project Drive configuration

Cases:
- unauthenticated user;
- typed Gmail without OAuth;
- Supabase Google OAuth success;
- Drive connector missing/disconnected;
- Drive connector available but selected folder not writable;
- writable selected folder;
- user changes selected folder.

Expected:
```text
typed email only
→ not authenticated

OAuth success + connector missing
→ DRIVE_CONNECTOR_REQUIRED

connector available + write probe FAIL
→ Project Drive NOT_READY

connector available + write/delete probe PASS
→ upsert same user's drive_root_folder_id
→ Project Drive READY

change folder
→ update same config identity/row
→ no revision counter
```

Do not require equality proof between OAuth Google identity and Drive connector identity unless the connector later exposes a reliable identity contract.

## E14 — proactive OWNED claim
Project B attempts OWNED claim already held by Project A.

Expected:
- reject/block at claim time;
- write-time conflict detection remains race backstop.

---

# Milestone gates

## M0
PASS when canonical source set and Phase-1 closure are verified.

## M1
PASS when AC-001..005, AC-003, and AC-031..035 are MET.

## M2
PASS when AC-006..008 and AC-026 infrastructure path are MET.

## M3
PASS when AC-009..011 are MET or explicitly UNVERIFIED only for unavailable external evidence.

## M4
PASS when AC-012..018 are MET.

## M5
PASS when AC-019..020 are MET or final binary availability is explicitly pending with stable contract.

## M6
PASS when AC-021..025 are MET.

## M7
PASS when architecture-critical evals have no unresolved CRITICAL/IMPORTANT failure.

## M8
PASS/PASS_RETEST_REQUIRED according to pilot evidence.

## M9
PASS when all pilot defects are classified and no unresolved CRITICAL/IMPORTANT theory gap remains.

---

# Evidence rules

- Every PASS claim binds to exact target/revision where applicable.
- UNVERIFIED is explicit, never silently upgraded.
- User Retest evidence is first-class when target/environment is clear.
- Reviewer evidence is not human authorization.
- Release Record preserves merge-authorization context.


---

## Part D — Initial Artifact Layout

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

Exact initial record placement:

```text
WORK/
├── jobs/
│   └── <job-id>.json
├── runs/
│   └── <run-id>.json
├── handoff-<handoff-id>.json
├── gate-<gate-id>.json
├── asset-<asset-requirement-id>.json
└── release-<release-id>.json

VERIFICATION/
└── <verification-id>.json

KNOWLEDGE/
└── <knowledge-id>-<slug>.md
```

Initial placement semantics:

```text
WORK/jobs/
→ Job + embedded Task/topology planning/control records

WORK/runs/
→ append-preserving Run records

WORK/handoff-*.json
→ Handoff transition records

WORK/gate-*.json
→ durable Planned Human Gates only

WORK/asset-*.json
→ Asset Requirement contracts

WORK/release-*.json
→ Release/delivery facts + Review Coverage Summary + human authorization reference

VERIFICATION/
→ REVIEW / EVIDENCE / TEST / RETEST / GOAL_RECHECK records

KNOWLEDGE/
→ DECISION / CONTRACT / PLAN / ARCHITECTURE_NOTE / DESIGN Markdown artifacts with structured front matter
```

This placement is the initial Phase-2 implementation choice.

Changing placement later is allowed as a mechanical migration only if:
- semantic identity/backrefs remain intact;
- read-time joins remain intact;
- no new shared hot file is introduced;
- resume/query behavior stays deterministic.

---

# 7. Avoided structures

Do not create:
- a database service for Project Memory/control-plane records;
- a global Project registry service;

Exception: the approved Supabase per-user settings store may hold plugin/runtime configuration such as `drive_root_folder_id`. It must not absorb Project/Job/Run/Verification memory.
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


---

## Part E — M0 Checklist

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


---

## Part F — Risk / Probe Register

## Status

```text
PURPOSE = execution risk control
OWNER = Planner / Orchestrator
UPDATE = during milestones and pilot
```

| ID | Risk / unknown | Current control | Trigger to revisit | Blocking? |
|---|---|---|---|---|
| R-01 | Drive shared mutable overwrite | append-preserving Runs/Verification + read-time join | implementation introduces shared progress writes | Yes if violated |
| R-02 | Cross-chat race | consequential-action recheck + scope claims | real race causes unsafe overwrite/action | Yes if unsafe |
| R-03 | Duplicate OWNED repo claim | proactive shallow root scan + write-time backstop | ambiguous/duplicate claim | Yes |
| R-04 | Review-floor false negative | actual diff + repo-sensitive paths + universal patterns | sensitive change escapes classifier | Yes |
| R-05 | Review-floor over-trigger | topology + concrete matched reasons | routine changes repeatedly require unnecessary review | Calibration |
| R-06 | Shared account attribution confusion | role + Run + work + target signature | agent output mistaken for human approval | Yes |
| R-07 | Branch cleanup unavailable | never assume delete; best-effort/manual/reset | branch accumulation becomes operational issue | No |
| R-08 | Tester runtime unavailable | Human Retest fallback | runtime capability becomes OBSERVED | No |
| R-09 | Generated image persistence unknown | probe before first asset workflow relying on it | M5 requires direct persistence | Conditional |
| R-10 | Protected branch behavior unknown | probe before relying on branch protection as HARD control | first protected-repo pilot | Conditional |
| R-11 | Context packet too large | minimum-sufficient context | repeated omission or context overload | Calibration |
| R-12 | CONTROL stale | durable fallback + rebuild | status disagrees with durable records | No if fallback works |
| R-13 | Schema/harness drift | schema tests + canonical references | template/schema mismatch | Yes if semantic |
| R-14 | Job scope creep | Planner scope-growth rule | new work no longer fits finite objective | Yes until linked Job |
| R-15 | Retest history duplication | one semantic Retest record family + append attempts | inconsistent PASS/FAIL reconstruction | Calibration/possibly blocking |
| R-16 | Pilot too broad | one vertical slice only | pilot starts absorbing full app migration | Yes—re-scope |
| R-17 | Per-user Drive root leakage/cross-user access | Supabase RLS + user-bound row | one user can read/update another user's config | Yes |
| R-18 | GPT uses stale/chat-cached root | resolve current root from config when root is needed | action targets a previously configured folder after user changed Settings | Yes if wrong target |
| R-19 | Supabase expands into Project Memory | explicit config-only boundary | Project/Job/Run/Verification data begins moving into Supabase | Architecture review |
| R-20 | Drive connector absent/disconnected | explicit prerequisite + onboarding guidance | Project Drive setup attempted without connector | Blocking until connected |
| R-21 | Selected Drive folder is readable but not writable | temporary create/delete probe | probe fails | Blocking for that folder |
| R-22 | Assume Supabase OAuth identity equals Drive connector account without evidence | separate identity/resource-authority proofs | connector identity contract becomes available | Do not assume |

---

# Probe register

## P-00 — Supabase per-user Drive-root configuration

```text
Timing = M1 before Project discovery implementation
Current = TO_PROVE
Required = create/read/update same stable user record + RLS isolation
Change behavior = update drive_root_folder_id in place; no revision counter
Fallback = CONFIG_REQUIRED / block root-dependent work rather than infer from chat or GitHub

P-00B Drive connector bootstrap
Current = WRITE/DELETE CAPABILITY OBSERVED in current connected environment
Required per user/folder = connector available + selected-folder temporary create/delete probe
Identity equality with Supabase OAuth account = NOT REQUIRED / NOT CLAIMED
```


## P-01 — protected/default branch behavior

```text
Timing = before first workflow that relies on branch protection as HARD enforcement
Current = UNKNOWN
Fallback = treat review/merge governance as SOFT + explicit human authorization
```

## P-02 — generated-image direct persistence

```text
Timing = before M5 first flow that requires generated binary persistence
Current = UNKNOWN
Fallback = Asset Requirement + human/manual placement + Retest
```

## P-03 — practical runtime/browser Tester

```text
Timing = before M6 autonomous Tester claim
Current = UNKNOWN
Fallback = Human Retest
```

## P-04 — GitHub PR diff/review/Actions surfaces

```text
Timing = as M4 first exercises each action
Current = SURFACE_PRESENT
Fallback = source/PR inspection through available read surfaces + UNVERIFIED where evidence unavailable
```

---

# Risk handling

```text
risk materializes
→ capture exact evidence
→ classify:
   implementation defect
   capability limitation
   harness quality issue
   semantic/theory gap
→ route smallest causal fix
```

Do not redesign the entire harness from one isolated operational inconvenience.

