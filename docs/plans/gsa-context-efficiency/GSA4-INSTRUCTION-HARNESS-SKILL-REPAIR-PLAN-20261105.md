# GSA4 — Instruction / Harness / Skill Classification Repair Plan

Date: 2026-11-05
Status: PLAN_QUALITY_PASS — direct static source-grounded Reviewer/CRL recheck; READY FOR IMPLEMENTATION-AUTHORIZATION DECISION; product repairs NOT STARTED; no merge/deploy authorization
Review scope: direct static source/plan cross-check, NOT a production GSA CRITIC_REVIEW Verification or runtime agent-behavior PASS
Execution mode: DIRECT AGENT on dedicated Git branch; do not use GSA Bootstrap or create a GSA Job for this documentation step
Repository: thebimhouseinfo-sudo/GPT-supper-agent
Work branch: fix/gsa4-instruction-skill-classification
Exact initial base (main): c150954b76fea919907edc15d0673aad2914a1f3
Related development reference: upgrade/gsa-context-efficiency at 66d990807111edbebe0b39fc529e7a0abcb20442; same Git tree as pinned main
Source audit: GSA4-INSTRUCTION-HARNESS-SKILL-CLASSIFICATION-AUDIT-CRL-20261105.md
Repair milestones: GSA4-INSTRUCTION-SKILL-REPAIR-MILESTONES-20261105.md
Source-level technical design: GSA4-INSTRUCTION-SKILL-REPAIR-TECHNICAL-PROPOSAL-20261105.md
Secretary lesson: GSA-Projects/projects/01a0f051-4353-7bff-8edf-46be4b44fd2f/LESSONS/2026-11-05-secretary-job-description-misclassified-as-optional-skill.md

## GOAL

Correct the boundary between always-applicable GSA instructions and on-demand methods for the existing eight Roles: a Role or already-applicable workflow must never lose required authority, obligation, completion, evidence or stop semantics solely because an optional Skill is omitted. Keep specialized methods conditional and remove demonstrable redundant always-loaded text only after behavioral parity. Preserve original accepted decisions, workflows, human authority, Reviewer/Critic independence, Tester evidence and security invariants.

Completion is proven in stages: (a) source-anchored classification and static/negative tests; (b) separately labeled runtime/host behavior evidence where reachable. All eight Roles retain core duties with Shared + Role-only context; conditional obligations have verifiable triggers, correct Skill loading/blocking, valid Task-required injection, no CR/merge authority escalation and measured context reduction without mandatory-behavior loss. A source-text assertion cannot by itself prove that a host model executed the contract. No new Role, Job type, Human gate, state schema, registry, data store, automatic model authority or implicit merge/deploy.

## 1. Inputs, confirmed state and boundaries

- CRLed audit: 1 CONFIRMED (A-01 Secretary), 3 HIGH-RISK (A-02 Coder U-D, A-03 Critic U-D focus, A-04 Coder U-F), 5 POTENTIAL (A-05 DEV/OPERATION boundary, B-01 Shared overhead, B-02 Role duplicate methods, B-03 MCP instructions overlap, B-04 job-planning duplicate contract).
- Current runtime uses get_agent_harness to return Shared + selected Role with suggested Skills as names; load_skill fetches a full body on demand. NEXT run_begin directly injects only Task.required_skills; job-prepare schema currently allows only ui-coder-frontend. A Role suggestion is NOT a loaded Skill, an optional Host skill is NOT a GSA load_skill, and a repo guide canonical_ref is NOT an automatic read. These distinctions and current schemas must remain intact.
- Selective Harness A4 is a read-only preview, NOT wired to the production get_agent_harness or Run dispatcher. Do not silently connect A4 during this repair.
- Secretary is a Planner-suggested optional Skill, not a registered ninth Role. For a genuine Human-accepted operational decision within an identified Project, the receiving Agent must preserve its full meaning and route authorized recording even when no Secretary Skill was preloaded; it must never silently claim persistence. Generic brainstorming, tentative assent and out-of-project chat do NOT automatically create a DEC or new Discussion Job.
- Existing U-D authority: Critic Review is only directly Human-invoked or specifically Human-preauthorized for the applicable milestone (with exact current Reviewer PASS when required). Existing code accepts optional caller-provided review_focus; this alone is NOT authoritative proof of review subject. Do not make any ordinary/general Coder Task subject to universal pre-code CR.
- Existing U-F authority: three independent full PRODUCT_FAILURE cycles for one original defect trigger causal escalation; a new chat/Job/title does not reset history. Host UNVERIFIED does not count as a full failed cycle. Current retest-history helper is used by source tests, not proven wired to live Coder dispatch; role-text changes must not be called a mechanical guard.
- Preserve V2_STABLE/NEXT, DIRECT_AGENT, TEST_LAB/PRODUCTION paths, Project/Memory authorization, branch and source-write scoping, SHA-CAS, cursor recovery, current immutable Verification and approval semantics.
- Do not edit GSA-Projects Lesson Learned or rewrite Criteria/approved product requirements as part of this classification repair. The present audit is an input, not a new Human approval gate.

## 2. Source ownership map (proposed targets, verify live owner before coding)

| Target | Smallest intended change | Finding |
|---|---|---|
| harness/shared.ts | **Mandatory** short universal recognized Human-accepted Decision → preserve full content / route to permitted owner / truthful SAVED vs NOT_SAVED; preserve critical security/approval/dispatch rules. Optional M4 method dedup only with parity. | A-01, A-05, B-01 |
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
- P0-02. Create a versioned clause-to-owner matrix (each affected statement: current path/line, SHARED_INSTRUCTION / ROLE_INSTRUCTION / WORKFLOW_CONTRACT / SKILL_METHOD / CONDITIONAL_SKILL / PROJECT_CONTEXT, owner, trigger, minimal text, evidence, negative tests). Add an explicit consumer/callsite for every mandatory method and any proposed removal; a suggested Skill is not a guarantee of loading. Avoid broad rename/rewrite.
- P0-03. Read existing approved U-D Plan/Task/Proposal and persisted Human CR/milestone authority to identify each approved related-Task set, exact proposal artifact/revision and intended PRE_CODE_TECHNICAL subject. The present review_focus and target_ref are caller-supplied and cannot independently establish that identity. If there is no trustworthy existing durable binding, mark the proposed automatic bypass guard NOT_FEASIBLE_AS_SPECIFIED and preserve ordinary GENERAL CR compatibility; do not claim a hard guard, invent approval or infer that all Coder runs require CR.
- P0-04. Capture full get_agent_harness for eight Roles, get_skill_catalog, load_skill, required_skill_contexts, accepted-decision and CR focus baseline. Count UTF-8/characters and tool calls separately from model tokens; retain all current negative cases.
- P0-05. Build read-only fixtures: accepted decision with multi-step algorithm/example/negative exception, unrelated/general CR, valid authorized U-D pre-code, three same-defect Tester failures across Chats/Jobs and a non-failure Host UNVERIFIED. Separate (i) static source fixture, (ii) simulated durable evidence, and (iii) real authenticated host/Project evidence: never promote the first two into real-run PASS.

- P0-06. Produce and persist the Role × workflow × document-read matrix below with exact source references, workflow triggers, minimum always-loaded contract, required evidence before each operation, method/Skill load decision, and fallback. Baseline should enumerate all 8 Role names, their independently-entered harness, the relevant task context and 13 runtime Skills. Only adopt a specific reading route after verifying its real host/tool surface.
- P0-07. Check canonical host guidance (docs/architecture/AGENT-HARNESSES.md, EXECUTION-AND-REVIEW.md and skills/gsa-job-runtime/SKILL.md) for conflicting job descriptions or auto-read claims. These are separate document/read surfaces; catalog canonical_refs and a link alone never put their bytes in get_agent_harness.

### Role × workflow × document loading contract (design target; verify in P0)

| Role | Always-visible core | When/what to read (minimum) | On-demand Skill/method | Denial/missing-evidence outcome |
|---|---|---|---|---|
| Orchestrator | Project boundary, authority, durable routing, stop/continuation, authorized recording handoff | Project/Job/Run status and current cursor only for active workflow; full decision record only for an accepted-decision routing need; U-F history when coordinating same-defect repair | delegation; specific debugging routing when triggered, not whole Job corpus | STOP/HANDOFF or NOT_SAVED; no invented Run or background continuation |
| Planner | Criteria vs Plan ownership; accepted-decision fidelity; independent planning-review loop | Current Criteria/Plan/Job; complete accepted DEC and exceptions when applicable; source L0 index then L1 relevant architecture/callers for actual Task | job-planning, critical-challenge, secretary only after accepted discussion, delegation as needed | PLAN_GAP/UNKNOWN, no false Decision/Review completion |
| Advisor | Explicit Human criteria-approval scope; no autonomous ordinary-planning activation | Exact proposed Criteria revision, actual constraints and source for material feasibility only after authorized Human intent | no registered runtime Role Skill | UNKNOWN/advise Human; no hidden approval or criteria rewrite |
| Designer | Only approved design/scope and applicable domain constraints | Approved Goal/Task, related complete DEC refs and existing interface/host evidence, then affected source selectively | delegation when a handoff requires it | UNKNOWN/blocked design claim; no unsupported host behavior |
| Coder | Approved Run/source scope, U-D applicability, U-F stop rule, DEV/OPERATION rights | Approved Task/DEC source and exact current code/callers/tests; pre-code proposal+CR evidence only for applicable U-D subject; full same-defect history before patch retry | coding-loop for implementation HOW, debugging after triggering failure; required ui-coder-frontend only when Task declares it | STOP/UNVERIFIED if critical Skill or required evidence unavailable; no ordinary fourth patch |
| Reviewer | Independent applicable Plan/Task/revision and findings contract | Full current reviewed artifact, requirements, relevant DEC and exact source; only relevant other Roles' method docs | review-evidence, planning-review on relevant review type | CHANGES_REQUIRED/UNKNOWN; never infer PASS from a short summary |
| Critic Reviewer | Human/milestone authority, stateless independent findings, exact reviewed target, source read-only | Persisted Job/approval, proposal/current SHA, complete connected Task set and source. Read prior Reviewer verdict **last** | critic-review for general method and conditional PRE_CODE_TECHNICAL checklist when authorized | BLOCKED/FAIL/NOT_EXECUTED without correct subject/authority; no new CR |
| Tester | Independent original trigger, evidence truth, source read-only, no fake PASS | Exact Run/target, criteria, original repro and impact regression. Host execution capability only when supported; retest history when same defect | testing-evidence, simulate for user flows; host scenario-tester only when actually installed/callable | UNVERIFIED/NOT_READY with reproducible handoff; no guessed host success |

Read cost sequence: first use stable identity/index and relevant section headers → request the *necessary full original* artifact (especially accepted decisions, exact approved proposal, source/diff and Verification) → expand dependency/caller/host context only on evidence. Do not use an abbreviated DEC or stale prior-chat summary when an original source is required. Read operations are not a mandate to fetch every source at boot. Separate **MUST_READ** for a current triggered operation from **MAY_READ** references for future tasks.

**P0 PASS:** exact source baseline; owner/trigger/classification plus eight-role reading/Skill matrix; review of canonical guide surfaces; reproducible pre-change failures, or explicitly labeled UNVERIFIED gaps. No change in product source or authority during analysis.

## 4. Phase P1 — Secretary mandatory job responsibility (A-01)

### GOAL
Make accepted-decision accountability survive omission of the optional Secretary Skill without converting all brainstorming into stored decisions or elevating a read-only Role's write authority.

- P1-01. Place a concise universal Human-accepted-decision recognition + truthful routing obligation in **harness/shared.ts** so every independently entered Role sees it without the Secretary Skill. When the Human explicitly adopts a concrete multi-step operational decision for the *current identified Project*, the receiving Role must recognize and preserve the handoff obligation. Treat generic 'ok' or tentative feedback contextually; NEVER infer acceptance of unmentioned details. Preserve exact WHAT/WHY/HOW/order/examples/negative exceptions/boundaries/provenance, not a headline.
- P1-02. Every receiving Role, including read-only Reviewer/Tester/Critic, identifies acceptance and hands the exact decision source + Human acceptance reference to the existing authorized Orchestrator/Planner/documentation owner unless the receiver already has an allowed recording action. Reviewer, Critic, Advisor and Tester retain their existing read-only or limited rights; they must NOT write DEC or silently pretend a handoff succeeded. If selected Project, Human authorization, Memory access or handoff execution is missing, state NOT_SAVED/BLOCKED. A non-project discussion may only offer a draft, not create an orphan DEC.
- P1-03. In an authorized Project recording, declare SAVED only after one full DEC artifact at the existing Project Memory path, exact independent GitHub blob readback and path/SHA evidence. Never assert a runtime write from a rendered instruction. Preserve prior immutable DEC source and record SUPERSEDES by a new accepted correction; a prospective note, deferred handoff, or a text draft is NOT_SAVED. Secretary Skill remains a method for fidelity/index/CAS, not the existence of the duty.
- P1-04. Preserve original complete Decision retrieval/Task mapping for Planner/Coder/Reviewer with no new database, mandatory Discussion Job, unsolicited acceptance, or Criteria rewrite.
- P1-05. Add positive/negative and no-Skill tests for **all eight independently entered Roles** detecting accepted-decision handoff without adding Memory writes, plus Planner/Orchestrator authorized path, new-chat retrieval, denial, correction and no false persistence.

**P1 PASS:** Role-only accepted-decision fixture preserves the complete record or an accurate not-saved status; loading the Secretary Skill may improve execution details but never decides whether the duty exists.

## 5. Phase P2 — U-D pre-code contract and Critic subject integrity (A-02/A-03)

### GOAL
Retain the already-applicable pre-code obligations across partial loads while preserving the exact existing Human/milestone Critic Review rights.

- P2-01. Separate **pre-code applicability** from **Critic authorization**. The approved BP-05 descriptive-pre-code policy is for relevant application-source-changing Goals/related Tasks under the adopted GSA coding workflow, not only tasks named U-D. Verify actual approved Job scope; descriptive proposal required before applicable source writes, proportionate for tiny tasks. The independent PRE_CODE_TECHNICAL Critic stage is invoked ONLY with existing direct-Human or exact preauthorized-milestone authority; do not silently narrow descriptive pre-code or extend a Critic gate to unrelated tasks. Coder Role carries this trigger; Skill retains HOW. Evidence of the approved Goal/Task and proposal revision is required before marking U-D complete.
- P2-02. Make the CR authorization decision explicit: direct Human cr/crl or exact preapproved milestone conditions only. Missing existing authorization is a transparent blocker/decision under that contract, not permission for a new automatic Critic gate. Do not make Planning Reviewer substitute for Critic.
- P2-03. In Critic Role, add minimal conditional subject handling: a PRE_CODE_TECHNICAL target must be reviewed for entire related Task set, actual source owners/callers, consumed interfaces and proposal revision before independent verdict. Move detailed checklist/examples to the conditional critic-review Skill.
- P2-04. Verify **two separate claims**, not a caller's review_focus flag: (a) CR admission has existing direct Human cr/crl or exact authorized milestone/current Reviewer PASS; (b) an explicitly U-D pre-code completion is tied to a durable approved proposal/related-Task set and a CRITIC_REVIEW Verification whose persisted review_focus is PRE_CODE_TECHNICAL, exact proposal_ref/revision and whole-related-Task inventory. Existing start_critic_review and critic_review_record currently take optional **caller-provided** review_focus/target_ref; their values are not a trusted subject classifier. No acceptance of a GENERAL Verification as proof of U-D completion.
- P2-04A. First locate the existing U-D completion consumer and its authoritative durable binding (approved Task/milestone artifact and verified proposal SHA) **before** selecting a mechanical guard insertion point. If those authenticated inputs are absent, do not add speculative GENERAL rejection to critic_review_record, do not create a new global CR gate, and mark automatic U-D subject enforcement DEFERRED / NOT_VERIFIED. A safe narrowly scoped check may reject *only a U-D completion claim* backed by a GENERAL verification; existing unrelated GENERAL reviews retain their behavior. Do not weaken existing preCodeTechnicalError validation, which already checks the explicit PRE_CODE_TECHNICAL inventory.
- P2-04B. If exact immutable proposal source/readback or complete Task binding cannot be independently proved from current records, fail that U-D completion evidence/claim as UNVERIFIED; report gap without fabricating a proposal-to-Job schema field, trying to infer from filenames, or treating a caller-controlled focus string as authorization.
- P2-05. Add tests for missing/falsified focus, caller-controlled GENERAL focus in a claimed U-D PASS, missing-caller/interface, partial related Tasks, stale proposal SHA, no Skill, no Human CR authority, forged Reviewer snapshot and unrelated valid GENERAL CR. Test start/record separately from the U-D completion consumer; if there is no trusted consumer, tests must call that risk NOT_VERIFIED rather than pretending the inputSchema blocks it.

**P2 PASS:** role-only U-D workflow retains its conditional contract; existing eligible Critic PASS cannot omit the required inventory; general CR and ordinary Coder Tasks remain unchanged.

## 6. Phase P3 — U-F three-cycle stop and operational boundary (A-04/A-05)

### GOAL
Make the same-defect third full failure a durable Coder/Orchestrator stop condition without manufacturing a fourth patch or weakening normal source/host permissions.

- P3-01. Add a short Coder/Orchestrator conditional contract: before another same-defect repair, independently inspect durable Run/Goal Recheck/TEST/RETEST history; after three completed authorized patches followed by distinct independent Tester PRODUCT_FAILURE reproductions on exact revisions, stop ordinary patch #4 and route to the existing debugging/causal process. Do not treat CI PASS, Coder selftest or a new Job title as defect closure.
- P3-02. First locate who (if anyone) invokes retest-history.ts in the real Run/dispatch path; current demonstrated usage is a source-executed fixture. Reuse its pure read-only assessment only after retrieving trusted whole-history evidence. Add an actual narrow dispatch fail-closed guard **only if** the current tool already receives independently verified same-defect history and can enforce without new workflow/schema/authority. Otherwise keep a mandatory Coder/Orchestrator STOP-and-debug instruction and explicitly label MECHANICAL_ENFORCEMENT_NOT_VERIFIED. No new defect DB, no automatic history fabrication or Run authority.
- P3-03. Keep CAD/DWG/LISP and other operational examples in specialized methods. Preserve a small Coder/Shared authority rule: Human/host-owned operational artifacts obey their established Open/Edit/Save/Load/Export permissions; internal Git/CAS protections still govern development source/Memory. No generic host-specific restrictions or implicit source-write waiver.
- P3-04. Test three genuine cycles across chat boundaries; 2 failures; different original defect; 3rd cycle lacking real Host; stale or conflicting evidence; authorized user artifact save, denied save and protected DEV source.

**P3 PASS:** third complete failure cannot be mistaken for authorization to blindly patch again; generic Coder remains bound to source and host ownership even with coding-loop omitted.

## 7. Phase P4 — Reverse classification and measured context reduction (B-01..B-04)

### GOAL
Reduce only proven redundant Shared/Role procedure text after P1–P3 correctness is stable, preserving a single canonical mandatory rule and short role owner/trigger/stop references.

- P4-01. Profile affected Shared rules (currently lines 4, 9, 10, 12, 13, 39, 41, 43 and 47 account for about 5,252 of 14,955 displayed Shared clause characters). Treat the ratio as **overlap candidates**, not guaranteed savings: mandatory clauses are interleaved with methods.
- P4-02. Maintain one always-visible source for cross-role rights, Human approval, branch, scope/denial, CAS/cursor, evidence and CR authority. Split only specialized HOW into existing Planner/Orchestrator/Coder/Tester methods or small appropriately activated methods; keep clear role owner, trigger, failure and handoff in Role/Shared.
- P4-03. Compare all eight Roles (not only Planner/Reviewer/Tester/Coder) to job-planning, planning-review, testing-evidence, coding-loop and other Skill bodies. For every extracted HOW clause, preserve its owner/trigger in Shared/Role and document the actual current workflow selection/load call; when a conditional Skill is Task-critical and unavailable, STOP/UNVERIFIED instead of silent omission. Do not assume ROLE_SKILLS names or canonical_refs load bodies; do not expand the job_prepare.required_skills enum beyond ui-coder-frontend in this pack.
- P4-04. Inspect index.ts server instructions as a third context surface. Modify only after proving the real host delivery path and equivalence; otherwise retain and mark DEFERRED/UNVERIFIED. Do not assume every repeated source string costs model tokens.
- P4-05. Measure output chars/UTF-8 bytes/calls for all eight Roles, full independent Role entry, optional Skill loading and NEXT required Task injection. Include role×workflow full-required-read cost when original Decisions/code/CR evidence is needed; compare static payload separately from actual host text/rereads when instrumented. Evaluate quality independently; a smaller source string alone is not PASS. Verify unchanged schemas, errors, fallback responses and missing-Skill outcomes.
- P4-06. Do not wire selective-harness-preview A4 into live runtime in this pack; any later runtime selector requires separately reviewed and evaluated integration.

**P4 PASS:** at least one safe, measured net reduction or an explicit NO_CHANGE disposition where evidence cannot support it; **zero** loss of mandatory clauses or behavior. Do not force a savings target that encourages incorrect classification.

## 8. Phase P5 — Independent verification, CRL and handoff

### GOAL
Prove classification correctness and regression safety on exact changed revision before proposing any merge.

- P5-01. Execute current source-executed regression suites where tools are actually available: gsa3-tool-skill-payload, gsa4-a4-selective-harness, gsa4-integration-parity, ua-decision-fidelity, ud-precode-cr, uf-three-cycle-retest, runtime-logic and related authorization/plan/review tests. Discover actual supported runner/TypeScript environment from repository; do not assume a missing top-level package.json.
- P5-02. Add eight Role × no-Skill core-duty fixtures, triggered Role + appropriate Skill comparisons and CRL-N01..N06 negative controls in the audit. Explicitly verify role×workflow document/Skill routing: must-read original DEC, current approved Plan, current source/callers, original Tester repro, exact review revision and deferred specialized methods. Cover V2_STABLE/NEXT and DIRECT_AGENT distinctions; check NEXT required skill injection and catalog errors.
- P5-03. Test Secretary long decision fidelity/supersession/retrieval and read-only receiving Role handoff; U-D focus bypass **at actual U-D completion claim** rather than assuming the GENERAL review endpoint knows the subject; unauthorized CR; U-F same-defect STOP vs mechanical guard distinction; recheck Human approval/branch/scope/CAS/cursor/Reviewer/Tester gates. Treat isolated TS fixture PASS as source-level only, not production model/host behavior; no fake external host PASS from mocks/simulated CI.
- P5-04. Reviewer independently inspects source changes, exact plan/finding coverage and negative tests. Critic Reviewer performs existing-authority review when explicitly Human-invoked/preauthorized, comparing Reviewer only after independent findings; otherwise report CR NOT EXECUTED, not a fictional PASS.
- P5-05. Update audit findings and disposition with exact old/new paths, commit SHA, test evidence, residual UNKNOWN, measured savings. Handoff with explicit PROPOSED / VERIFIED / BLOCKED labels and recommended merge action; no automatic main merge/deploy.

**P5 PASS (source release candidate only):** all applicable source-executed mandatory contract and negative tests GREEN, exact SHA/readback and independent review evidence; unavailable live host/model follow-through remains UNVERIFIED and blocks any claim of behavioral deployment parity. Any failed parity returns to its owning Phase for targeted repair and rerun. Deployment/merge decisions require their own existing Human/branch gates.

## 9. Task order and stop rules

Sequence: P0 baseline + exact owner/trigger/read matrix -> P1 Secretary -> P2 U-D Coder/Critic -> P3 U-F and operation authority -> P4 measured deduplication -> P5 source verification and separately labeled runtime evidence. Small independent test-fixture work can proceed in parallel, but source writes to shared/harness-catalog/index/CR tools must be integrated serially against current reviewed HEAD.

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

## 10A. Plan review (direct static CRL) and known evidence boundaries

- Reviewer result: initial plan CHANGES_REQUIRED on U-D subject spoofability, Secretary receiving-owner write boundary, missing Role × workflow document-read matrix, U-F dispatch-enforcement overclaim and behavioral test conflation. Corrected within this document; independent production Critic Reviewer Verification has **not** been invoked or persisted.
- Critical technical fact: critic_review_record currently only requires pre_code_review on explicit PRE_CODE_TECHNICAL result; GENERAL remains valid and review_focus is caller-provided. A true U-D bypass fix must be demonstrated at an authenticated U-D completion boundary using existing evidence. Absent an authoritative subject-to-proposal binding, P2 cannot PASS as a mechanical enforcement fix; it can PASS only the narrower role-instruction/record-check part with that gap called out as UNVERIFIED.
- Critical technical fact: current U-F retest-history helper is a pure source-level helper tested with fixtures, not evidence that any production dispatch has collected all historical Tester records.
- Secretary/Project Memory: human acceptance plus durable SHA readback must be separately verified; a role text string cannot write a DEC or confer permissions. Handoff to existing authorized owner is a valid routing response but never a false SAVED status.
- Test provenance: test-lab/ud-precode-cr.test.cjs expressly expects U-D's detailed proposal HOW to remain progressive; test-lab/uf-three-cycle-retest.test.cjs uses synthetic cases; test-lab/ua-decision-fidelity.test.cjs validates existing Job DEC refs. Preserve these contracts and add missing no-Skill, real-binding and replay checks instead of rewriting test semantics.
- Final plan quality after second source-grounded CRL: PASS (document design and cross-document consistency; 15/15 traceability/structural checks). The first review CHANGES_REQUIRED and intermediate PASS_WITH_FINDINGS remain recorded in CRL history. This does not prove production fixes, create product approval or count as official GSA CRITIC_REVIEW Verification.

## 11. Explicit exclusions and execution authority

This document covers only the branch-local **documentation and source-grounded plan-review preparation performed by the current request**. Product source edits, creation of a new GSA Job, main/development merges, deployment, new Human gates, broad architecture rewrite, activation of A4, or edits to other repositories are **not** performed by this plan. After the plan is reviewed, subsequent execution must follow the applicable Human-approved scope and branch authority. A proposed plan is not its own implementation approval.

## 12. Requested next decision

The corrected plan, six repair milestones and source-level technical proposal have passed direct static design review. U-D subject matching remains conditional on proven durable evidence; it must not be represented as solved mechanically by a caller-controlled review_focus. Source implementation, exact Project authorization and actual model/host verification remain future work. No new Human gate is created by these documents.