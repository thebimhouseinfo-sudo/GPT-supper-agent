# GSA4 — Instruction / Harness / Skill Classification Repair Milestones

**Date:** 2026-11-05  
**State:** MILESTONES PREPARED / SOURCE NOT IMPLEMENTED  
**Branch:** fix/gsa4-instruction-skill-classification  
**Base:** main @ c150954b76fea919907edc15d0673aad2914a1f3  
**Proposed integration target:** NOT ASSUMED; reconcile active Project Memory branch policy before merge or execution authorization  
**Canonical repair plan:** [GSA4-INSTRUCTION-HARNESS-SKILL-REPAIR-PLAN-20261105.md](./GSA4-INSTRUCTION-HARNESS-SKILL-REPAIR-PLAN-20261105.md)  
**Audit and CRL:** [GSA4-INSTRUCTION-HARNESS-SKILL-CLASSIFICATION-AUDIT-CRL-20261105.md](./GSA4-INSTRUCTION-HARNESS-SKILL-CLASSIFICATION-AUDIT-CRL-20261105.md)  
**Design:** [GSA4-INSTRUCTION-SKILL-REPAIR-TECHNICAL-PROPOSAL-20261105.md](./GSA4-INSTRUCTION-SKILL-REPAIR-TECHNICAL-PROPOSAL-20261105.md)

## GOAL

Fix the misplacement of mandatory Role/Workflow instructions into optional Skills while preserving eight existing GSA Agent responsibilities, acceptance-to-DEC fidelity, conditional U-D pre-code evidence, U-F third-failure stop, and the existing authorization/lifecycle contracts. After correctness is proven, remove only empirically redundant context. A milestone is DONE only with exact current source/diff/test evidence and limitations; a proposed milestone is not a new GSA Job or approval.

## Non-goals and authority boundary

No ninth Secretary Role, new automatic Discussion/Job, new database/schema, new Human/CR gate, refactoring A4 into production, new unconstrained Task Skill enum, blanket always-load of 13 Skills, deployment or main/development merge. Existing read-only Roles remain read-only. Human acceptance, Project/Memory authorization, Git CAS, source scope, Review/Tester and Run/cursor gates remain authoritative. The current user request authorizes **document preparation**, not application source changes or release.

## Dependency order and status

| Milestone | Purpose | Dependencies | Exit evidence | Status |
|---|---|---|---|---|
| **M0 — Classified contract + reproducible baseline** | Freeze real role/skill/host delivery and decide exact ownership/trigger/fallback | Current branch HEAD + GSA4-G3, U-A/U-D/U-F source and approved plan | Clause-to-owner map; eight-Role × Job/Task read matrix; baseline capture, negative fixtures, authorization matrix | PLANNED |
| **M1 — Accepted Decision responsibility (A-01)** | Make genuine Human-accepted decision preservation independent of Secretary Skill | M0 | No-Skill acceptance/handoff, full DEC readback or truthful NOT_SAVED; never unauthorized Role write | PLANNED |
| **M2 — Conditional U-D contract + CR evidence identity (A-02/A-03)** | Preserve pre-code applicability and distinguish pre-code completion from GENERAL CR | M0 + M1 Decision refs where applicable | No-Skill Coder/Critic contract; existing authorization; PRE_CODE_TECHNICAL exact ref/SHA; GENERAL compatibility; no false mechanical-guard claim | PLANNED |
| **M3 — Third-cycle U-F stop + artifact boundary (A-04/A-05)** | Move Coder/Orchestrator stop responsibility into always-visible text, keep causal method on demand | M0 + M2 scope/invariants | Same-defect 3-cycle STOP, UNVERIFIED exclusions, no unauthorized host/user-file/source action | PLANNED |
| **M4 — Evidence-based reverse classification (B-01..B-04)** | Remove method overlap only where safe; preserve required read paths and eight-role independence | M1–M3 source-level tests PASS | Before/after rendered Role/Skill payload; no-Skill invariant coverage; actual host data or marked UNKNOWN; keep/revert decision | PLANNED |
| **M5 — Integration parity, independent review and handoff** | Validate exact branch diff, tests, context data and known gaps before any release recommendation | M0–M4 | Exact SHA, source tests, negative tests, report, Reviewer findings, optional independently authorized CR, explicit release boundary | PLANNED |

The milestones are **repair units** for findings in the audit; they do not re-open or reimplement the original U-A/U-D/U-F product feature Jobs. Use existing results and tests as baselines and modify only the actual missing contract.

## M0 — Classified contract + reproducible baseline

### GOAL

Establish precisely which instructions are mandatory for which Role at which Task position, which Skill methods are optional or Task-critical, and where the current host actually delivers text. Prove the current failure modes with source-executed tests or label any runtime test unavailable.

| Task | Action | Deliverable / exit |
|---|---|---|
| **M0-T1** | Read exact branch source and 49 Shared clauses, eight roles, 13 registered Skills; include method helper retest-history.ts separately; inspect get_agent_harness, load_skill, NEXT required_skill_contexts, index instructions and GSA4-A4 preview | Revision-pinned inventory and 8 × Role ownership table; no false claim A4 is live |
| **M0-T2** | Classify every affected clause by Owner, trigger, mandatory job description, technique, source document, authoritative evidence, stop condition and safe loading path | Clause-to-owner/trigger map with exact file/line links |
| **M0-T3** | Verify the decision/CR/history/proposal source contracts; review existing Project approval/branch/integration policy for source execution only when authorized | Status of existing legitimate authority; no inferred approved write branch |
| **M0-T4** | Capture source-executed baseline: 8 role outputs with and without Skills, NEXT UI declared required Skill, 13 Skill names/schema/errors, CR GENERAL versus PRE_CODE, U-F fixtures | Baseline test manifest with RED/GREEN/UNKNOWN; exact revision, bytes/chars, actual runtime unavailable labels |
| **M0-T5** | Verify doc-reading route vs GSA4-G3 matrix across direct role entry, Job/Task, Role→Role handoff and resumed chat | Explicit MUST_READ vs MAY_READ, source revision and fallback per Role |
| **M0-T6** | Identify proven real production CR U-D completion consumer and history evidence callsites, if any; otherwise record current limitations and safe non-mechanical solution path | U-D/U-F Feasibility Decision (EXISTS / ABSENT / UNKNOWN), no speculative validator |

**M0 PASS:** all source ownership and safety/activation gaps have explicit resolution paths; no blanket Skill loads, fake readback or invented host measurements. No product code changed.

## M1 — Human-accepted decision responsibility

### GOAL

Ensure an accepted expert solution (including its exact operational algorithm and forbidden alternatives) is not reduced to a summary merely because optional secretary Skill was not loaded. Keep an actual durable write permission separate from recognizing a duty.

| Task | Action | Deliverable / exit |
|---|---|---|
| **M1-T1** | Add minimal accepted-decision recognition/owner/handoff/saved-status contract to Shared or existing receiving Role as proved by M0 | Applicable Role-only text includes Human acceptance trigger, no auto discussion, complete WHAT/WHY/HOW fidelity |
| **M1-T2** | Clarify Orchestrator/Planner existing authorized recording or handoff responsibility; keep Reviewer/Critic/Tester read-only and Advisor within current rights | Authorization and failure routing; no ninth Role |
| **M1-T3** | Keep secretary.ts as optional method for full DEC, CAS, provenance and SUPERSEDES; avoid loading it for speculation | Stable existing DEC path, exact SHA readback, truthful NOT_SAVED where not persisted |
| **M1-T4** | Add long expert-procedure fixture, rejected tentative opinion, correction chain and cross-Chat recovery; compare no-Skill versus loaded Skill | Positive and negative test evidence, exact full source not a topic summary |

**M1 PASS:** original accepted method and exceptions recoverable from an independently read artifact when saved, otherwise correctly reported NOT_SAVED; not a Role permission escalation.

## M2 — U-D pre-code and Critic subject contract

### GOAL

Keep approved source-changing U-D pre-code applicability and independent Critic focus from disappearing in a partial load, without introducing universal Critic activation or invalidating legitimate GENERAL CR.

| Task | Action | Deliverable / exit |
|---|---|---|
| **M2-T1** | Transfer minimal U-D applicability/required proposed-artifact/failure-route to Coder Role; keep descriptive file/function/caller HOW in coding-loop Skill | Role-only Coder can identify approved U-D requirement and STOP/route if necessary evidence absent |
| **M2-T2** | Transfer minimal PRE_CODE_TECHNICAL review-subject contract into Critic Role; keep completeness checklist and example risk checks inside critic-review Skill | Authorized Critic receives entire Task set and builds independent verdict before prior Reviewer comparison |
| **M2-T3** | Inspect durable current U-D Task and milestone binding before any new validation code. CR record input review_focus is caller-controlled. Detect a real U-D completion consumer or do not assert a mechanical bypass guard. | Proved trusted subject/ref/SHA binding **OR** explicit NOT_FEASIBLE/DEFERRED mechanical enforcement with a truthful source-contract fix |
| **M2-T4** | Preserve preCodeTechnicalError for explicitly PRE_CODE_TECHNICAL claims; never use GENERAL CR to declare U-D completed. If trusted existing completion binding exists, add only the narrow validation at that consumer. | Positive and adversarial CR focus tests, preserved unrelated GENERAL tests |
| **M2-T5** | Test missing/forged authority, incomplete caller/interface/Task coverage, stale proposal SHA, Reviewer-order violation and no-Skill role behavior | Exact-revision source-executed regression and false-bypass negative evidence |

**M2 PASS:** U-D duties survive no-Skill loading and a GENERAL verification never counts as U-D completion; **mechanical enforcement PASS** only if an authenticated source consumer is actually exercised. Absent that binding, record that sub-capability DEFERRED, not PASS, and do not rewrite broad CR schemas.

## M3 — U-F stop and operational source/artifact boundary

### GOAL

Give Coder and Orchestrator a guaranteed Role-level third-PRODUCT_FAILURE escalation rule and accurate DEV versus OPERATION authorization; keep causal tracing and host-specific methods selective.

| Task | Action | Deliverable / exit |
|---|---|---|
| **M3-T1** | Add minimal Coder/Orchestrator U-F contract independent of coding-loop Skill (three fully proved separate Tester cycles tied to first defect, no blind fourth patch) | Role-only text exposes STOP and causal routing |
| **M3-T2** | Use existing debugging and retest-history for source-grounded causal workflow. Verify if any real dispatch can read complete authoritative history before considering a guard. | Accurate enforcement classification: text duty PASS, mechanical guard PASS only with observed real binding; else NOT_VERIFIED |
| **M3-T3** | Keep specialist CAD/host file HOW in coding-loop; retain minimal Role-level permission/DEV vs OPERATION constraint | No User-owned DWG/LISP external Save/Load invented SHA/Registry; no DEV source CAS weakening |
| **M3-T4** | Run synthetic and, if available, authorized real-host negative tests: failures 0/1/2/3, new chat/Job rename, different root defect, Host UNVERIFIED, denied artifact path, stale source revision | Reproducible failure classification, evidence and no fourth ordinary patch |

**M3 PASS:** Role-level STOP and permissions are source-proven; every unproven production guard is explicitly named, never masked as GREEN.

## M4 — Reverse classification/context measurement

### GOAL

Reduce redundant Shared/Role method text only after M1–M3 correctness checks remain intact for each Role and job type.

| Task | Action | Deliverable / exit |
|---|---|---|
| **M4-T1** | Inspect overlapping Shared clauses and Planner/Reviewer/Tester/Coder method text against canonical Skills and GSA4-G3 read matrix | Candidate list with source line, mandatory residual, optional method owner, trigger |
| **M4-T2** | Move only detailed HOW from Shared/Role into already registered on-demand Skill or leave unchanged where conditional reading is unproven | Minimal textual changes; all eight independent Role contracts still complete |
| **M4-T3** | Verify no ignored mandatory input from role-entry, NEXT Task skill injection, direct host entry or resumed chat; compare guide/read references | No-Skill vs Skill test matrix, must-read versus may-read controls |
| **M4-T4** | Measure chars/bytes/tool calls/rereads on equivalent fixtures; real model token/quality outcomes only if actually observed | KEEP / REVERT / NO_CHANGE by safety-first evidence, not target-token quota |

**M4 PASS:** correctness unchanged; reduction is real and source-measured or honest NO_CHANGE; no unverified “token saved” estimates reported as measured.

## M5 — Verification and handoff

### GOAL

Produce a complete verified change inventory, source-test and authorization record, and an independent review outcome without confusing test simulations with production Agent behavior.

| Task | Action | Deliverable / exit |
|---|---|---|
| **M5-T1** | Run real supported existing tests in test-lab: gsa4-integration-parity, gsa3-tool-skill-payload, gsa4-a4-selective-harness, ua-decision-fidelity, ud-precode-cr, uf-three-cycle-retest, runtime-logic, related safety tests | Executed commands, logs/status, runner environment, exact HEAD |
| **M5-T2** | Verify new 8-role/trigger/negative and Decision/CR/U-F tests, before/after payload, tool schema and serialization; assess untouched Roles | Results with explicit source-executed versus actual model/host provenance |
| **M5-T3** | Independent Reviewer review of source and scope; existing-authority Critic Review only when genuinely Human-invoked or preapproved; repair and rerun if CHANGES_REQUIRED | Reviewed exact diff, findings disposition and real Verification only if actually persisted |
| **M5-T4** | Update audit dispositions, lessons, residual limitations, context measures, recommended disposition of branch | Handoff with source SHA, known blockers, NO_AUTO_MERGE, no fake deployment PASS |

**M5 PASS:** source-level acceptance and independent evidence complete, with real host/model unknowns clearly marked. Deployment parity and main merge stay separate Human/branch-authorized decisions.

## Traceability and negative acceptance

| Finding | Milestone owner | Primary negative test |
|---|---|---|
| A-01 confirmed Secretary | M1 | Human accepted decision with 7-step HOW but no secretary Skill: no missing exceptions; read-only Role cannot write; NOT_SAVED when no readback |
| A-02 U-D Coder | M2 | Applicable source-changing task not permitted to silently omit required descriptive proposal when coding-loop is absent |
| A-03 U-D Critic | M2 | GENERAL CR still valid generally but cannot be reused as U-D PRE_CODE_TECHNICAL completion |
| A-04 U-F Coder | M3 | Three independent PRODUCT_FAILURE retests across Jobs/chats stop ordinary fourth patch |
| A-05 DEV/OPERATION | M3 | User-owned LISP/DWG filename/host action never inherits internal Git SHA; denied Host action remains denied |
| B-01 Shared overlap | M4 | No Shared mandatory scope/approval/stop rule dropped during move |
| B-02 Role/Skill overlap | M4 | Every Role enters independently and knows obligations without optional HOW |
| B-03 index.ts instructions | M4 | Do not alter until actual model-delivery path verified; NO_CHANGE acceptable |
| B-04 job-planning overlap | M4 | Reviewer/revision/READY rules remain in owner context with Skill absent |

## Milestone halt/restart rule

If any milestone discovers a task requiring new Criteria WHAT/WHY, ungranted Memory/source authority, unverified CR admission, misleading runtime evidence or a regression in the original required behavior, halt that affected task and route through existing owner. Continue non-conflicting source-read or test work. Do not create a compensating gate, auto-enable source writes or claim the milestone complete by lowering its acceptance tests. Never silently reclassify a mandatory rule as optional to improve context size.
