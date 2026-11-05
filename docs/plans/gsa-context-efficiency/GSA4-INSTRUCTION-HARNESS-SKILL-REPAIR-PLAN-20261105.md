# GSA4 — Instruction / Harness / Skill Classification Repair Plan

Date: 2026-11-05
Status: PROPOSED IMPLEMENTATION PLAN — source repairs NOT STARTED; no merge/deploy authorization
Execution mode: DIRECT AGENT on dedicated Git branch; do not use GSA Bootstrap or create a GSA Job for this documentation step
Repository: thebimhouseinfo-sudo/GPT-supper-agent
Work branch: fix/gsa4-instruction-skill-classification
Exact initial base (main): c150954b76fea919907edc15d0673aad2914a1f3
Related development reference: upgrade/gsa-context-efficiency at 66d990807111edbebe0b39fc529e7a0abcb20442; same Git tree as pinned main
Source audit: GSA4-INSTRUCTION-HARNESS-SKILL-CLASSIFICATION-AUDIT-CRL-20261105.md
Secretary lesson: GSA-Projects/projects/01a0f051-4353-7bff-8edf-46be4b44fd2f/LESSONS/2026-11-05-secretary-job-description-misclassified-as-optional-skill.md

## GOAL

Correct the boundary between always-applicable GSA instructions and on-demand methods for the existing eight Roles: a Role or already-applicable workflow must never lose required authority, obligation, completion, evidence or stop semantics solely because an optional Skill is omitted. Keep specialized methods conditional and remove demonstrable redundant always-loaded text only after behavioral parity. Preserve original accepted decisions, workflows, human authority, Reviewer/Critic independence, Tester evidence and security invariants.

Completion is proven by source-anchored classification and before/after tests: all eight Roles preserve core duties in Shared + Role-only context, mandatory conditional obligations are correctly triggered, required Task Skills remain injected where declared, forbidden CR/merge/authority escalation remains impossible, and measured context reduction does not alter mandatory behavior. No new Role, Job type, Human gate, state schema, registry, data store, automatic model authority or implicit merge/deploy.

## 1. Inputs, confirmed state and boundaries

- CRLed audit: 1 CONFIRMED (A-01 Secretary), 3 HIGH-RISK (A-02 Coder U-D, A-03 Critic U-D focus, A-04 Coder U-F), 5 POTENTIAL (A-05 DEV/OPERATION boundary, B-01 Shared overhead, B-02 Role duplicate methods, B-03 MCP instructions overlap, B-04 job-planning duplicate contract).
- Current runtime uses get_agent_harness to return Shared + selected Role with suggested Skills as names; load_skill fetches a full body on demand. NEXT run_begin directly injects only Task.required_skills, currently limited by job-prepare schema to ui-coder-frontend. These behaviors must remain intact.
- Selective Harness A4 is a read-only preview, NOT wired to the production get_agent_harness or Run dispatcher. Do not silently connect A4 during this repair.
- Secretary is a Planner-suggested optional Skill, not a registered ninth Role. Human-accepted Decision persistence must have an existing-owner obligation regardless of Skill load.
- Existing U-D authority: Critic Review is only Human-invoked or specifically Human-preauthorized at a milestone, with exact current Reviewer PASS where required. A pre-code proposal must not create an automatic universal CR gate.
- Existing U-F authority: three independent full PRODUCT_FAILURE cycles for one original defect trigger causal escalation; a new chat/Job/title does not reset history. Host UNVERIFIED does not count as a full failed cycle.
- Preserve V2_STABLE/NEXT, DIRECT_AGENT, TEST_LAB/PRODUCTION paths, Project/Memory authorization, branch and source-write scoping, SHA-CAS, cursor recovery, current immutable Verification and approval semantics.
- Do not edit GSA-Projects Lesson Learned or rewrite Criteria/approved product requirements as part of this classification repair. The present audit is an input, not a new Human approval gate.

## 2. Source ownership map (proposed targets, verify live owner before coding)

| Target | Smallest intended change | Finding |
|---|---|---|
| harness/shared.ts | Small universal accepted-decision accountability and NOT_SAVED/BLOCKED boundary if needed; retain critical security/approval/dispatch rules; later split overly specific methods only with parity | A-01, A-05, B-01 |
| harness/roles/orchestrator.ts | Preserve current receiving-Agent coordination and authorized handoff of decision recording; acknowledge normal lifecycle and closure ownership | A-01, A-04 |
| harness/roles/planner.ts | Clarify how Planner owns applicable approved-decision recording without making every brainstorm a Discussion Job | A-01 |
| harness/roles/coder.ts | Preserve short conditional U-D pre-code applicability/CR authorization and U-F three-cycle no-ordinary-fourth-patch invariant; retain Coder Goal Recheck | A-02, A-04, A-05 |
| harness/roles/critic_reviewer.ts | State conditional PRE_CODE_TECHNICAL focus/completeness obligations without expanding CR invocation rights | A-03 |
| harness/roles/tester.ts | Retain third-cycle evidence boundary, scenario trigger and honest STATIC/SIMULATED/REAL_HOST distinctions | A-04 (mostly CORRECT) |
| harness/roles/reviewer.ts, advisor.ts, designer.ts | Prefer no change unless independently proven necessary for context splitting; retain all existing responsibilities | B-02 guard |
| harness/skills/secretary.ts | Leave DEC formatting, full HOW/WHY source capture technique, CAS, index, supersession as method; remove wording that makes a mandatory accepted-decision duty optional | A-01 |
| harness/skills/coding-loop.ts | Preserve detailed U-D proposal construction, root-cause/operational methods; delegate concise applicability/stop policy to Role | A-02, A-04, A-05 |
| harness/skills/critic-review.ts | Preserve professional whole-proposal inspection checklist only for selected pre-code subject | A-03 |
| harness/skills/debugging.ts, retest-history.ts | Reuse existing causal method and read-only history helper; no new defect storage or auto-run claim | A-04 |
| harness/skills/job-planning.ts, planning-review.ts, review-evidence.ts, testing-evidence.ts, delegation.ts | Remove only provably duplicate explanatory method text after core-role tests pass; preserve independently loadable Skill behavior | B-02, B-04 |
| harness-catalog.ts, harness-skill-tools.ts | Preserve Role/Skill names, output schema, catalog metadata, render order and progressive API; adjust only where source ownership truly requires | All parity |
| critic-review-tools.ts | Detect and reject an incorrectly GENERAL-focused PASS for an *identified* pre-code target, without rejecting an unrelated legitimate general CR | A-03 |
| run/run-begin.ts, run-dispatch-closure-guards.ts, index.ts | Inspect actual dispatch/approval/required skill and server-instruction paths; add smallest enforceable negative checks only where an existing verified input suffices | A-02/03/04; B-03 |
| test-lab/*.test.cjs, selftest.ts | Source-executed contract tests + explicit no-Skill and negative controls; no fake host PASS | All |

## 3. Phase P0 — Baseline, applicability and test fixtures

### GOAL
Freeze exact baseline, identify mandatory invariants and characterize conditional U-D applicability from existing approved source before source edits; do not create or presume new Human authority.

- P0-01. Re-read current branch HEAD, exact file blob SHAs, all eight Role Harnesses, 13 runtime Skills, 49 Shared clauses, loader/dispatch, CR validator and U-A/U-D/U-F approved requirements. Reconcile branch drift against audit-pinned main; preserve unrelated changes.
- P0-02. Create a versioned clause-to-owner matrix (each affected statement: current path/line, SHARED_INSTRUCTION / ROLE_INSTRUCTION / WORKFLOW_CONTRACT / SKILL_METHOD / CONDITIONAL_SKILL / PROJECT_CONTEXT, owner, trigger, minimal text, evidence, negative tests). Avoid broad rename/rewrite.
- P0-03. Explicitly resolve from existing U-D Plan/Task and Human CR authority which approved tasks require a descriptive pre-code proposal and which have an authorized PRE_CODE_TECHNICAL review. If evidence remains ambiguous, record UNKNOWN and seek only the material existing-authority clarification; do NOT infer that all Coder runs require a new CR.
- P0-04. Capture full get_agent_harness for eight Roles, get_skill_catalog, load_skill, required_skill_contexts, accepted-decision and CR focus baseline. Count UTF-8/characters and tool calls separately from model tokens; retain all current negative cases.
- P0-05. Build read-only fixtures: accepted decision with multi-step algorithm/example/negative exception, unrelated/general CR, valid authorized U-D pre-code, three same-defect Tester failures across Chats/Jobs and a non-failure Host UNVERIFIED.

**P0 PASS:** exact source baseline and applicability table; reproducible pre-change failures, or explicitly labeled UNVERIFIED gaps. No change in product source or authority during analysis.

## 4. Phase P1 — Secretary mandatory job responsibility (A-01)

### GOAL
Make accepted-decision accountability survive omission of the optional Secretary Skill without converting all brainstorming into stored decisions or elevating a read-only Role's write authority.

- P1-01. Put a concise acceptance-trigger and completion contract in the applicable shared/receiving-Agent responsibility: only genuine Human ACCEPTED/confirmed decisions, never speculative or merely AI-proposed material. Preserve exact WHAT / WHY / HOW / ordered algorithm / examples / negative exceptions / boundaries / provenance and corrections, not a five-line index alone.
- P1-02. Define clear existing-owner routing: the current receiving Role remains accountable for outcome, but actual Project Memory persistence must be performed only through existing authorized owner/actions. A read-only Reviewer/Tester does not gain source/Job write permission. If authorization, selected Project or storage is missing, report NOT_SAVED/BLOCKED, never SAVED.
- P1-03. A completed accepted decision requires the full durable DEC artifact under existing authorized Memory paths and independent exact GitHub readback with path/SHA; only then report SAVED. Reuse old records and append immutable SUPERSEDES on accepted corrections. The optional skill remains a technique for formatting, indexing, CAS and traceable clause mapping.
- P1-04. Preserve original complete Decision retrieval/Task mapping for Planner/Coder/Reviewer with no new database, mandatory Discussion Job, unsolicited acceptance, or Criteria rewrite.
- P1-05. Add positive/negative and no-Skill tests across Planner and at least one non-Planner receiving Role, across new-chat retrieval, denial, correction, and no false persistence.

**P1 PASS:** Role-only accepted-decision fixture preserves the complete record or an accurate not-saved status; loading the Secretary Skill may improve execution details but never decides whether the duty exists.

## 5. Phase P2 — U-D pre-code contract and Critic subject integrity (A-02/A-03)

### GOAL
Retain the already-applicable pre-code obligations across partial loads while preserving the exact existing Human/milestone Critic Review rights.

- P2-01. Split Coder's conditional U-D requirement from specialized proposal-writing HOW: once current approved scope actually requires U-D, Coder knows to produce a compact or whole-related-Task descriptive proposal, source/caller/interface/decision coverage, and cannot claim eligible implementation completion with the required review missing. Non-U-D Tasks do not inherit a pre-code CR requirement.
- P2-02. Make the CR authorization decision explicit: direct Human cr/crl or exact preapproved milestone conditions only. Missing existing authorization is a transparent blocker/decision under that contract, not permission for a new automatic Critic gate. Do not make Planning Reviewer substitute for Critic.
- P2-03. In Critic Role, add minimal conditional subject handling: a PRE_CODE_TECHNICAL target must be reviewed for entire related Task set, actual source owners/callers, consumed interfaces and proposal revision before independent verdict. Move detailed checklist/examples to the conditional critic-review Skill.
- P2-04. Harden only the existing CR evidence validation boundary: when authoritative supplied target/evidence identifies the pre-code subject, GENERAL focus cannot satisfy its PRE_CODE_TECHNICAL completion; reject a claimed equivalent PASS or require reclassification under existing rights. Do not use guesses from a path name and do not change GENERAL CR behavior for unrelated reviews. Keep exact proposal SHA/readback and old PASS/FAIL/BLOCKED semantics.
- P2-05. Add missing/falsified focus, missing-caller, missing-interface, partial-related-Task, stale-proposal-SHA, no-Skill, no-CR-authorization and unrelated-General-CR tests.

**P2 PASS:** role-only U-D workflow retains its conditional contract; existing eligible Critic PASS cannot omit the required inventory; general CR and ordinary Coder Tasks remain unchanged.

## 6. Phase P3 — U-F three-cycle stop and operational boundary (A-04/A-05)

### GOAL
Make the same-defect third full failure a durable Coder/Orchestrator stop condition without manufacturing a fourth patch or weakening normal source/host permissions.

- P3-01. Add a short Coder/Orchestrator conditional contract: before another same-defect repair, independently inspect durable Run/Goal Recheck/TEST/RETEST history; after three completed authorized patches followed by distinct independent Tester PRODUCT_FAILURE reproductions on exact revisions, stop ordinary patch #4 and route to the existing debugging/causal process. Do not treat CI PASS, Coder selftest or a new Job title as defect closure.
- P3-02. Reuse retest-history.ts as a read-only assessment after evidence retrieval. If a mechanical guard is feasible using inputs already verified in dispatch, add a narrow fail-closed guard; otherwise explicitly mark host/dispatch enforcement UNVERIFIED, not "fixed". No new bug database, automatic history fabrication or Run authority.
- P3-03. Keep CAD/DWG/LISP and other operational examples in specialized methods. Preserve a small Coder/Shared authority rule: Human/host-owned operational artifacts obey their established Open/Edit/Save/Load/Export permissions; internal Git/CAS protections still govern development source/Memory. No generic host-specific restrictions or implicit source-write waiver.
- P3-04. Test three genuine cycles across chat boundaries; 2 failures; different original defect; 3rd cycle lacking real Host; stale or conflicting evidence; authorized user artifact save, denied save and protected DEV source.

**P3 PASS:** third complete failure cannot be mistaken for authorization to blindly patch again; generic Coder remains bound to source and host ownership even with coding-loop omitted.

## 7. Phase P4 — Reverse classification and measured context reduction (B-01..B-04)

### GOAL
Reduce only proven redundant Shared/Role procedure text after P1–P3 correctness is stable, preserving a single canonical mandatory rule and short role owner/trigger/stop references.

- P4-01. Profile affected Shared rules (currently lines 4, 9, 10, 12, 13, 39, 41, 43 and 47 account for about 5,252 of 14,955 displayed Shared clause characters). Treat the ratio as **overlap candidates**, not guaranteed savings: mandatory clauses are interleaved with methods.
- P4-02. Maintain one always-visible source for cross-role rights, Human approval, branch, scope/denial, CAS/cursor, evidence and CR authority. Split only specialized HOW into existing Planner/Orchestrator/Coder/Tester methods or small appropriately activated methods; keep clear role owner, trigger, failure and handoff in Role/Shared.
- P4-03. Compare relevant Planner/Reviewer/Tester/Coder Role steps to job-planning, planning-review, testing-evidence, coding-loop and other Skill bodies. Deduplicate only when no obligation disappears in Shared+Role-only rendering; never move a mandatory rule solely into a suggestion.
- P4-04. Inspect index.ts server instructions as a third context surface. Modify only after proving the real host delivery path and equivalence; otherwise retain and mark DEFERRED/UNVERIFIED. Do not assume every repeated source string costs model tokens.
- P4-05. Measure output chars/UTF-8 bytes/calls for all eight Roles, full independent Role entry, optional skill loading and NEXT required Task injection. Evaluate quality independently, avoid character-count-only PASS; verify unchanged schemas and fallback responses.
- P4-06. Do not wire selective-harness-preview A4 into live runtime in this pack; any later runtime selector requires separately reviewed and evaluated integration.

**P4 PASS:** at least one safe, measured net reduction or an explicit NO_CHANGE disposition where evidence cannot support it; **zero** loss of mandatory clauses or behavior. Do not force a savings target that encourages incorrect classification.

## 8. Phase P5 — Independent verification, CRL and handoff

### GOAL
Prove classification correctness and regression safety on exact changed revision before proposing any merge.

- P5-01. Execute current source-executed regression suites where tools are actually available: gsa3-tool-skill-payload, gsa4-a4-selective-harness, gsa4-integration-parity, ua-decision-fidelity, ud-precode-cr, uf-three-cycle-retest, runtime-logic and related authorization/plan/review tests. Discover actual supported runner/TypeScript environment from repository; do not assume a missing top-level package.json.
- P5-02. Add eight Role × no-Skill core-duty fixtures, eight Role + appropriate Skill comparisons, and CRL-N01..N06 negative controls recorded in the audit. Cover V2_STABLE/NEXT and DIRECT_AGENT distinctions; check NEXT required skill injection and catalog errors.
- P5-03. Test Secretary long decision fidelity/supersession/retrieval; CR pre-code focus bypass and unauthorized CR; U-F same-defect stop; recheck Human approval/branch/scope/CAS/cursor/Reviewer/Tester gates. No fake external host PASS from mocks/simulated CI.
- P5-04. Reviewer independently inspects source changes, exact plan/finding coverage and negative tests. Critic Reviewer performs existing-authority review when explicitly Human-invoked/preauthorized, comparing Reviewer only after independent findings; otherwise report CR NOT EXECUTED, not a fictional PASS.
- P5-05. Update audit findings and disposition with exact old/new paths, commit SHA, test evidence, residual UNKNOWN, measured savings. Handoff with explicit PROPOSED / VERIFIED / BLOCKED labels and recommended merge action; no automatic main merge/deploy.

**P5 PASS:** all mandatory behavior checks and applicable source tests are GREEN with real evidence; unavailable host/deployment checks remain UNVERIFIED, never fake PASS. Any failed parity returns to its owning Phase for targeted repair and rerun.

## 9. Task order and stop rules

Sequence: P0 baseline -> P1 Secretary -> P2 U-D Coder/Critic -> P3 U-F and operation authority -> P4 safe deduplication -> P5 verification. Small independent test-fixture work can proceed in parallel, but source writes to shared/harness-catalog/index/CR tools must be integrated serially against current reviewed HEAD.

Stop and report BLOCKED when an existing Human/Project/branch/CR authorization cannot be proved, source truth conflicts, a critical invariant regresses, or no supported test surface can establish a mandatory outcome. Do not introduce new gates or ask Human to re-approve decisions already accepted. A real unresolved design ambiguity may be raised as a single narrow choice; it is not an excuse to infer authority.

## 10. Traceability and acceptance matrix

| Finding | Planned work | Required evidence |
|---|---|---|
| A-01 CONFIRMED | P1-01..05 | No-Skill accepted decision, exact full DEC and readback or truthful NOT_SAVED; correction/new-chat recovery |
| A-02 HIGH-RISK | P0-03; P2-01/02 | Only applicable U-D Task requires existing pre-code contract; no blanket CR gate |
| A-03 HIGH-RISK | P2-03..05 | Identified pre-code target cannot PASS with GENERAL focus; original GENERAL CR unaffected |
| A-04 HIGH-RISK | P3-01/02/04 | 3 full independent same-defect cycles stop ordinary patch #4 across Jobs/chats |
| A-05 POTENTIAL | P3-03/04 | DEV vs operational artifact/host permission parity |
| B-01 POTENTIAL | P4-01/02/05 | Shared invariant-preserving clause map + measured payload |
| B-02 POTENTIAL | P4-03/05 | Role method dedup without losing no-Skill duties |
| B-03 POTENTIAL | P4-04/05 | Host path verified or DEFERRED; no false token claim |
| B-04 POTENTIAL | P4-03/05 | Job planning/review persistence contract survives Skill omission |
| Existing correctness | P5-01..05 | Tool schemas, exact SHA, security, approval, lifecycle, review, Tester and evidence regression |

## 11. Explicit exclusions and execution authority

This document authorizes only the branch-local **documentation preparation performed by the current request**. Product source edits, creation of a new GSA Job, main/development merges, deployment, new Human gates, broad architecture rewrite, activation of A4, or edits to other repositories are **not** performed by this plan. After the plan is reviewed, subsequent execution must follow the applicable Human-approved scope and branch authority. A proposed plan is not its own implementation approval.

## 12. Requested next decision

Human reviews the proposed source-repair sequence and U-D applicability/authority interpretation. No other gate is inserted. Once authorized for implementation, begin P0 on the pinned current branch, then apply the smallest source changes with independent evidence.