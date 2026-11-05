# GSA4 — Technical Proposal: Repair Mandatory Role Instructions vs On-Demand Skills

**Date:** 2026-11-05  
**Status:** TECHNICAL_DESIGN_PASS / SOURCE PATCHES APPLIED ON WORK BRANCH / FULL CI UNVERIFIED  
**Repository/branch:** thebimhouseinfo-sudo/GPT-supper-agent / fix/gsa4-instruction-skill-classification  
**Exact initial source base:** main c150954b76fea919907edc15d0673aad2914a1f3  
**Canonical plan:** [Repair Plan](./GSA4-INSTRUCTION-HARNESS-SKILL-REPAIR-PLAN-20261105.md)  
**Milestones:** [Repair Milestones](./GSA4-INSTRUCTION-SKILL-REPAIR-MILESTONES-20261105.md)  
**Audit:** [Classification Audit + CRL](./GSA4-INSTRUCTION-HARNESS-SKILL-CLASSIFICATION-AUDIT-CRL-20261105.md)

## GOAL

Make every already-applicable obligation, trigger, authority, owner and stop rule visible to the responsible Agent in Shared + Role Harness even if optional Skills are omitted. Keep specialized methods and domain Knowledge on-demand and loaded before the affected Task step, rather than at every bootstrap. Preserve eight Role interfaces, 13 runtime Skills, all existing Project/Memory authorization, decision, CR and Tester contracts. Demonstrate source-level correctness independently of model/host execution.

## 1. Architecture decision and alternatives

**SELECTED A — Minimal always-visible Role/workflow contract + selected existing Skill methods + full authoritative source reads when triggered.**

Role = job description (who/when/what/evidence/authority/stop/handoff). A workflow obligation exists regardless of optional Skill load. Skill = specialized HOW (method/checklist/examples/tool technique) loaded only for relevant Work Position. Documents = original approved sources with exact revision, read according to Task need. A short summary or skill name never substitutes for a required full accepted DEC, proposal, source/diff or Verification.

**Rejected B:** Always load all 13 runtime Skills; destroys progressive benefits and mixes rights with methods.

**Rejected C:** Leave mandatory duty in Skills but make descriptions stronger; get_agent_harness returns suggestions, not bodies, so missing-load defect persists.

**Rejected D:** Ninth Secretary Role, new Decision database/Job type, new Human gate or general mandatory Critic; not supported by existing authority.

**Rejected E:** Wire experimental A4 selective-harness-preview to production; its explicit baseline says not wired and this repair requires no new selector.

**Rejected F:** Remove overlapping Shared method text first; could drop the last visible mandatory trigger for an independently entered Role.

**Context algorithm:** Always load Shared + selected Role; next read current Project/Job/Task/approval and exact full source demanded by that operation; load relevant Skill method from existing catalog; expand via READ_MORE on transitive dependencies; STOP if authorized source, Task-critical Skill or exact evidence cannot be recovered. Host ChatGPT Skill name, GSA runtime Skill, optional Project add-in and canonical_ref are four distinct mechanisms. Keep NEXT Task required_skill_contexts injection only for explicitly declared allowed Skills.

## 2. Verified source inventory and public APIs

Source paths below are relative to supabase/functions/gsa-mcp/ unless prefixed docs/ or test-lab/. Re-read exact current blob SHA before source implementation.

| Existing owner | Verified behavior | Proposed change |
|---|---|---|
| harness-catalog.ts:26–45,54–94 | Eight ROLE_HARNESSES, 13 RUNTIME_SKILLS, ROLE_SKILLS; renderHarness outputs Shared and Role plus conditional skill-name list | KEEP exports, role names, Skill names, order, method signatures |
| harness-skill-tools.ts:4–45 | get_agent_harness returns Shared+Role and suggested_skills separately; includeProgressiveSkills:false | KEEP schema/role list; suggestion is not loaded body |
| harness-skill-tools.ts:49–94 | get_skill_catalog and load_skill(name) progressive method body | KEEP APIs, schemas, errors |
| job-prepare-tool.ts:65–69 | NEXT required_skills only supports ui-coder-frontend | KEEP; no unreviewed enum extension |
| run/run-begin.ts:89–101,197–200 | NEXT Run returns explicitly declared required Skill context | KEEP; no duplicate injection |
| harness/shared.ts:1–54 | 49 Shared clauses contain global rights and some long specialized procedures | **MUST MODIFY** with universally-visible accepted-decision recognition/handoff obligation; defer method dedup |
| harness/roles/planner.ts:18 | Reads original accepted DEC and links Task but no explicit acceptance-to-recording ownership | MODIFY concise owner/trigger/status |
| harness/roles/orchestrator.ts:8,23–27 | Repair/retest routing without explicit U-F same-defect patch #4 threshold | MODIFY handoff + U-F STOP |
| harness/roles/coder.ts:10,19–21 | Original DEC read, bounded repair/Goal Recheck but no U-D and U-F explicit trigger/limit | MODIFY concise U-D, U-F and DEV/OPERATION boundary |
| harness/roles/critic_reviewer.ts:3–16 | Human-authorized stateless CR with exact evidence, no U-D specialty | MODIFY conditional pre-code subject; no rights change |
| harness/roles/tester.ts:21,25 | Exact Tester retest and 3-cycle information already mandatory | KEEP except test coverage |
| harness/roles/reviewer.ts, advisor.ts, designer.ts | Existing core roles | KEEP unless M0 proves a specific omission |
| harness/skills/secretary.ts:1–12 | Optional activated DEC recording HOW, full original WHAT/HOW + CAS + SUPERSEDES | MODIFY description only if misleading; retain method |
| harness/skills/coding-loop.ts:13–25,64,68–83 | U-D pre-code method, U-F stop detail, DEV/OPERATION examples | KEEP detailed HOW; de-duplicate only after Role tests |
| harness/skills/critic-review.ts:16–25 | U-D source/caller/full Task design review checklist | KEEP method |
| harness/skills/debugging.ts:14–16, harness/skills/retest-history.ts:68–176 | Causal method + pure advisory history assessor | KEEP; not proven wired to live dispatcher |
| critic-review-tools.ts:4–57,81–299 | preCodeTechnicalError checks full inventory only on explicit PRE_CODE_TECHNICAL; focus optional caller input | KEEP GENERAL API; modify only if trustworthy completion consumer exists |
| run/goal-recheck.ts, run/complete.ts, run/verification.ts | Existing Job/Run role evidence and readback, no verified global U-D subject binder | KEEP by default |
| selective-harness-preview.ts | A4 read-only preview, not live loader | KEEP unchanged |
| index.ts | Server instructions are a third delivery surface; source duplication does not establish host token cost | KEEP unless exact delivery tested in M4 |

Avoid inventing new entrypoints or facades. All proposals are source-line baseline references, not guaranteed post-change line numbers.

## 3. M0 instruction classification and triggered reads

A review artifact, not a new persisted schema, maps each affected clause to:
- owning Shared/Role/workflow;
- verifiable trigger based on approved Project/Job/Task/Human state;
- mandatory expected outcome and STOP/handoff;
- exact authoritative document/source/Revision to READ;
- existing optional Skill method and whether current Task needs it;
- permissible actor and authorizing scope;
- source-executed positive/negative tests and host evidence status.

The source map can be a Markdown appendix or small synthetic test-lab fixture. It is not a new runtime Registry or authorization source.

**Role-specific reading:** Orchestrator starts with current Project/Job/Run/cursor and expands only for a triggered routing; Planner reads approved Criteria/Plan and original DEC when Task relevant; Advisor reads draft Criteria/actual facts only on Human approval intent; Designer reads approved design and directly affected host/source; Coder reads Task, full DEC, direct callers, tests, precise U-D/defect history only when triggered; Reviewer reconstructs exact target and criteria independent of Coder; Critic reconstructs current approved target and reads prior Reviewer verdict LAST; Tester reads original repro, exact revision and available host capability. This extends, does not replace, the GSA4-G3 Agent × Job × Task research.

## 4. M1 — Secretary accepted-decision contract

### Trigger/owner

Trigger only when Human genuinely accepts or corrects a concrete decision inside an identified active GSA Project. Ordinary brainstorming, an AI proposal, tentative assent or out-of-Project chat is not an automatic Project DEC.

**Minimum always-visible Shared contract (MANDATORY for all 8 Roles):** receiving Role recognizes duty to preserve exact WHAT/WHY/HOW, ordered algorithm, examples, forbidden alternatives, scope, provenance and correction history. The receiver either performs an already-authorized recording action or hands full source and Human-acceptance evidence to the existing authorized owner. Reviewer/Critic/Tester/Advisor gain NO new Memory/source write permission. A routed/drafted outcome is NOT SAVED. Secretary remains a Planner-suggested on-demand method, not a ninth Role or a generic conversational role.

**Authorized storage:** projects/<project_id>/KNOWLEDGE/DECISIONS/DEC-<id>.md in current authorized Memory Repo, existing authorize_project_scope and authorize_memory_mutation, GitHub exact create/CAS and independent blob readback. Report SAVED only with confirmed path/SHA. Corrected accepted DEC creates immutable superseding record and keeps the previous full text readable. Planner consumes existing decision-fidelity.ts source path/SHA and DECISION_REF (selected_source_evidence) with DECISION_COVERAGE edges (relationship_assessment); no new Job field or untrusted acceptance flag.

**Runtime flow:** Human acceptance -> receiving Role retains full message/reference -> existing-owner authority check -> optional secretary method formatting -> authorization -> create/CAS -> exact independent readback -> SAVED or NOT_SAVED; Planner maps clauses into Tasks only after actual original source recovery. For read-only Roles the flow is handoff, not mutation.

**Tests:** 7-step expert method with negative exception; incomplete summary rejected; speculation/deferred discussion doesn't record; authorized saved record readback; missing permission or failed readback returns NOT_SAVED; correction chain and new chat retain old source; no-Skill Role still identifies and routes duty. Existing ua-decision-fidelity tests preserved.

## 5. M2 — U-D Coder pre-code and Critic subject

### U-D applicability

Source approved U-D Plan at docs/plans/gsa-context-efficiency/DETAIL-PLAN.md (BP-05/BP-06, U-D) specifies a descriptive proposal before the relevant authorized application source changes for the approved Goal and whole related Tasks. The Rule is a conditional Role obligation and must not disappear without coding-loop Skill. Its Method remains in Skill: one whole-related-Task Markdown proposal, file actions CREATE/MODIFY/REUSE_AS_IS/KEEP/REMOVE; exact actual/proposed owners/functions/callers/interfaces/dependencies, inputs/outputs, source evidence, regression oracle, host effects and exclusions, short version for small Task, no empty source stubs or second Registry.

**Coder Role minimum:** distinguish two obligations. (1) Approved BP-05 descriptive pre-code applies to relevant source-changing Goal and related Tasks of the adopted coding workflow, not only work named U-D; inspect real Job/Task + original Decisions and prepare a proportionate proposal before applicable source write. (2) Independent PRE_CODE_TECHNICAL Critic execution is still only direct-Human or precisely Human-preauthorized milestone; missing required review is STOP/UNVERIFIED, never permission for a new automatic Critic gate. Reviewed inventory is a reference, not source-write authorization. Unrelated non-source Tasks do not acquire a global Critic stage.

### Critic identity and evidence

The current critic_review_record accepts optional review_focus and validates the full PRE_CODE inventory only when the supplied value is PRE_CODE_TECHNICAL. The focus, target_ref and target_revision are caller-provided, not an authenticated proof of subject identity. A GENERAL CR is valid for its own target, but cannot count as independent PRE_CODE completion.

**Safe implementation decision:**
1. Keep start_critic_review Human/milestone admission exactly as existing source.
2. Give Critic Role a mandatory conditional subject contract: for authorized U-D pre-code work inspect the whole related Task set, exact proposal source/ref/SHA, code owner/callers, accepted decisions and real host constraints; form independent findings before prior Reviewer comparison.
3. Keep preCodeTechnicalError validation of explicitly PRE_CODE_TECHNICAL PASS/PASS_WITH_FINDINGS, complete correct inventory and MINOR-only nonblocking findings.
4. Locate an existing real U-D completion consumer, if any, tied to trustworthy persisted approved Task/milestone + exact proposal SHA + CRITIC_REVIEW Verification. The consumer, not a generic CR handler, could narrowly reject using GENERAL verification as proof of U-D completion.
5. If the current consumer cannot establish that binding without expanding public schema/authorization, **do not install a fake mechanical guard**; leave normal GENERAL review unchanged, teach relevant Role/Reviewer to reject invalid U-D completion claims and label NO_VERIFIED_MECHANICAL_GUARD. A later true durable binding is separate authorized scope.

The implementation target is correct job description and review subject fidelity, not security by trusting a string parameter. Source test-only checks are not real GitHub readback.

**Negative controls:** no-Skill Coder/Critic still know U-D; unauthorized CR never starts; GENERAL review remains valid for unrelated target; GENERAL Verification not accepted as PRE_CODE completion evidence; missing caller/interface, wrong Task scope, stale proposal SHA and revision, cycles/duplicated owner, source lacking input/output, old Reviewer-before-independent Critic. Existing ud-precode-cr fixtures remain green.

## 6. M3 — U-F three full cycles and DEV/OPERATION

### Defect history

Existing retest-history.ts exports defectIdentity, assessDefectRetests and advancedDefectReport. It is a pure read-only helper; history_complete and evidence refs are caller-supplied, not automatic attestation that the runtime retrieved all historical Memory. Existing test-lab/uf-three-cycle-retest.test.cjs is synthetic.

**Coder and Orchestrator mandatory contract:** before each ordinary same-defect repair inspect relevant durable original symptom/error/repro/first failure plus exact authorized Coder patch/Goal Recheck and independent Tester original-trigger/impacted regression RETEST across Jobs/chats. Count only three full PRODUCT_FAILURE cycles. After third actual unsuccessful cycle STOP ordinary patch #4 and route to debugging first-causal-divergence report; unknown history is not evidence authorizing another patch. Tester remains source-readonly. A new Job title/Chat does not reset identity.

**Selected method:** optional debugging Skill for real causal analysis and existing retest-history helper after actual authorized evidence retrieval. Do not add a run_begin/run_complete guard solely from caller assertion history_complete=true or synthetic fixture. If no real dispatch path receives full independently verified history, report MECHANICAL_ENFORCEMENT_NOT_VERIFIED while keeping Role-level STOP mandatory and tested.

**DEV/OPERATION:** internal source, Job/Run, Memory and revisions obey current Git/CAS/branch/authorization. Human-owned DWG/LISP/Temp Job/operational documents obey actual authorized Host/User Open/Edit/Save/Load/Export/Import. Never force User operational files to have internal Run UUID, source SHA or Registry entry. Never waive internal development protection. Minimal boundary in Coder Role; detailed host behavior in coding-loop.

**Tests:** zero/one/two/three complete unsuccessful cycles, third with Host UNVERIFIED (must not count), different first-failure defect, chat/Job rename, CI green versus Tester failed, insufficient history, same-name operational file collision, denied Host folder and protected development source.

## 7. M4 — Reverse classification and measurable context

Candidate Shared clauses lines 4,9,10,12,13,39,41,43,47 total about 5,252 of 14,955 displayed rule characters: this is an **overlap-candidate size**, NOT guaranteed savings. Repeated Role and Skill instructions may be intentional independent-entry defense.

**Process:** 1) measure actual Shared+Role rendered output for all eight Roles and relevant Skill/Task injections; 2) mark a detailed HOW clause whose trigger and method are represented in a verifiably loadable registered Skill; 3) keep short always-visible owner/trigger/authority/evidence/STOP clause; 4) move only proven redundant method text; 5) run all eight independent-entry and missing-Skill tests; 6) rollback any mandatory/host behavior regression; 7) record chars/UTF-8 and actual model tokens/read hops only when instrumented. No fixed reduction quota. NO_CHANGE is acceptable if safe removal cannot be proved.

Keep index.ts instructions unchanged without measurement of host delivery and selective-harness-preview A4 disconnected. Do not automatically read canonical_refs/host skills. Real full documents required for Task correctness remain required even after shorter initial instruction payload.

## 8. Concrete file action and interface inventory

| Action | File | Exact proposed modification |
|---|---|---|
| MODIFY_REQUIRED | harness/shared.ts | Universal accepted-Decision recognition and permitted-owner handoff for all eight independently entered Roles; never grant writes; preserve security invariants, defer method removal to M4 |
| MODIFY | harness/roles/planner.ts | Accepted decision owner/handoff, truthful durable SAVED/NOT_SAVED, preserve original DEC fidelity |
| MODIFY | harness/roles/orchestrator.ts | Decision recording authorized route and U-F three-cycle STOP coordination |
| MODIFY | harness/roles/coder.ts | U-D applicability/pre-code/authorized Critic condition, U-F same-defect STOP, DEV/OPERATION permission invariant |
| MODIFY | harness/roles/critic_reviewer.ts | Conditional PRE_CODE subject, whole related Task + current proposal revision and independent verdict |
| MODIFY_IF_NEEDED | harness/skills/secretary.ts | Description distinguishes optional technique from mandatory decision obligation, no new authority |
| KEEP | harness/skills/coding-loop.ts; critic-review.ts; debugging.ts; retest-history.ts | Detailed HOW kept on demand; dedup only after test evidence |
| KEEP | harness/roles/tester.ts; reviewer.ts; advisor.ts; designer.ts | Preserve current authority and independent evidence |
| CONDITIONAL_MODIFY | critic-review-tools.ts or an *actual* U-D completion consumer | Only when existing trusted subject/proposal/Verification binding is proved, not on arbitrary caller-provided review_focus |
| KEEP | run/run-begin.ts; run/complete.ts; run/goal-recheck.ts; run/verification.ts; run-dispatch-closure-guards.ts | No new untrusted mechanical guard, schema or rights |
| KEEP | harness-catalog.ts; harness-skill-tools.ts; job-prepare-tool.ts | Eight Roles, Skill names, schemas, rendering, progressive API remain stable |
| KEEP | selective-harness-preview.ts; index.ts | A4 not live; no unmeasured server instruction change |
| CREATE | test-lab/gsa4-instruction-skill-classification.test.cjs | Source-executed no-Skill 8-Role checks, triggered read/status and negative controls |
| CREATE_IF_NEEDED | test-lab/fixtures/gsa4-instruction-skill-cases.json | Small synthetic accepted DEC, authorized/unauthorized pre-code and 3-cycle cases |
| MODIFY_IF_NEEDED | test-lab/ua-decision-fidelity.test.cjs; ud-precode-cr.test.cjs; uf-three-cycle-retest.test.cjs | Add missing assertions; do not weaken current test oracle |
| CREATE_ON_IMPLEMENTATION | test-lab/results/gsa4-instruction-skill-repair-result.md | Actual test outputs, source SHAs, measurement, limitations, Reviewer evidence |

These are proposals, not already-written application files.

## 9. Integration sequence, test protocol and proof levels

Order: M0 exact source/read/authorization inventory -> M1 Role/Secretary route + test -> M2 Coder/Critic conditional text + test and only narrowly trusted consumer if one exists -> M3 U-F and artifact text + test -> M4 optional safe dedup/revert + test -> M5 all source tests, independent Reviewer, exact SHA handoff.

Existing regression test candidates: test-lab/gsa4-integration-parity.test.cjs, gsa3-tool-skill-payload.test.cjs, gsa4-a4-selective-harness.test.cjs, ua-decision-fidelity.test.cjs, ud-precode-cr.test.cjs, uf-three-cycle-retest.test.cjs, runtime-logic.test.cjs and related auth/plan/cursor tests. Discover installed Node/TypeScript runner instead of assuming a root package script.

**Evidence types:** STATIC_SOURCE / SOURCE_EXECUTED_SIMULATED / REAL_PROJECT_DURABLE / LIVE_MODEL_HOST_OBSERVED. Source text and simulation cannot claim actual autonomous Skill loading, Decision persistence, host click, or production runtime parity. Do not invent measured token savings.

## 9A. Findings-to-source traceability

| Finding | Exact repair owner | Evidence boundary |
|---|---|---|
| A-01 CONFIRMED | Shared + existing Planner/Orchestrator + optional secretary method | All eight no-Skill Role triggers, authorized DEC source readback/NOT_SAVED |
| A-02 HIGH-RISK | Coder Role + coding-loop method | Descriptive pre-code for BP-05 source-changing tasks, no invented global CR |
| A-03 HIGH-RISK | Critic Role + existing critic-review-tools inventory | Caller-controlled GENERAL focus not pre-code completion; no synthetic trusted consumer |
| A-04 HIGH-RISK | Coder + Orchestrator Role + existing debugging helper | Three independent full failed cycles across Chats/Jobs stop blind fourth patch |
| A-05 POTENTIAL | Coder Role authority + specialized coding-loop | DEV protection and user/host OPERATION lifecycle both retained |
| B-01 POTENTIAL | Shared rule inventory + M4 source metric | No removed authority or STOP |
| B-02 POTENTIAL | Eight Role loops + progressive Skill methods | No lost duty when relevant Skill is missing |
| B-03 POTENTIAL | index.ts server text consumer measurement | KEEP/NO_CHANGE if delivered bytes/cost unknown |
| B-04 POTENTIAL | Planner/Reviewer plan contract + job-planning method | Planning review revision/READY remains without Skill |

## 10. Threats, mitigations and test expectations

| Risk | Required mitigation |
|---|---|
| Mandatory context grows | Correctness first; safe M4 dedup only after no-Skill tests |
| Secretary records speculation | Actual accepted Project decision only, no auto Discussion Job |
| Read-only Agent writes Memory | Existing owner handles recording, no elevated permission |
| GENERAL focus disguises PRE_CODE | Do not accept as U-D completion; trusted binding required for mechanical guard |
| Extra Critic gate | Preserve Human/direct or exactly preapproved milestone admission only |
| Third-cycle count fabricated | Require actual complete independent Tester history; label unknown |
| Host file policy overgeneralized | Enforce existing Host permissions; preserve DEV Git CAS |
| Skill names mistaken for full instruction | Test separate load_skill and Task.required contexts; missing task-critical method stops |
| Test fixture mistaken for real model PASS | Separate source/test/host evidence and limitations |
| Branch policy inferred from default branch | Require current Project-owned integration branch confirmation before any merge |

## 11. Review and acceptance

A technical design Reviewer should PASS this proposal only after confirming exact source owner and action for every finding, distinct obligation and method ownership, all eight Roles and relevant Task read triggers, no new permissions or gates, truthful handling of caller-controlled CR focus and U-F history, exact negative tests, and separate source/real-host evidence. Source changes and live runtime are NOT implemented or proved by this document.

**Design verification limit:** this proposal closes the source-design classification questions. Trusted U-D completion binding and real U-F history retrieval are explicit M0 feasibility checks; any mechanical enforcement remains CONDITIONAL and may be DEFERRED, never claimed implemented. SOURCE/TEST/MODEL/HOST behavior is NOT verified by this document.

**No product source edit, merge, deploy or autonomous Job is authorized by this proposal.**

## Implementation follow-up — 2026-11-05

The Human subsequently approved source implementation. Five existing Shared/Role modules contain only tagged additive GSA4-CLS rules; source tests and existing baseline golden normalizers were updated without changing runtime tool schemas. The inspected version does not add a trusted U-D completion consumer or a U-F mechanical dispatch guard. Only partial source-executed checks passed; full Node/Deno workflow remains NOT_RUN and is required before any merge decision. Exact record: test-lab/results/gsa4-instruction-skill-repair-20261105.md.
