# GSA4 — Repair Plan CRL: Direct Source-Grounded Review

Date: 2026-11-05
Mode: DIRECT AGENT / DOCUMENT AND STATIC SOURCE REVIEW
Outcome: **PASS FOR DOCUMENT DESIGN ONLY** after CHANGES_REQUIRED → PASS_WITH_FINDINGS → final repaired Plan/Milestone/Technical review; no official production GSA CR Verification
Repository: thebimhouseinfo-sudo/GPT-supper-agent
Branch: fix/gsa4-instruction-skill-classification
Base source: c150954b76fea919907edc15d0673aad2914a1f3
Reviewed plan blob SHA: 29182968bc1475c1d11788c6d272e0a710e6a10e
Plan path: docs/plans/gsa-context-efficiency/GSA4-INSTRUCTION-HARNESS-SKILL-REPAIR-PLAN-20261105.md

IMPORTANT: This is **not** an official GSA critic_review_record run, persisted CRITIC_REVIEW Verification, independent model-host execution or approval for code, merge or deploy. It is a direct source-grounded second-look and documents its evidence and limitations.

## Reviewer: Findings on initial version (CHANGES_REQUIRED)

| ID | Severity before repair | Problem and exact source basis | Plan correction |
|---|---|---|---|
| R-01 | IMPORTANT | U-D subject is not cryptographically/durably identified merely by caller-supplied review_focus. critic-review-tools.ts start_critic_review inputs (lines 94–97), critic_review_record (183–185), validation only if explicitly PRE_CODE_TECHNICAL (227–234). A GENERAL call cannot be globally invalidated. | P0-03 source binding and unknown outcome; P2-04/04A/04B prohibit GENERAL being used as U-D completion evidence but retain unrelated GENERAL CR. Explicit NO_GUARD claim if trusted subject/consumer is absent. |
| R-02 | IMPORTANT | Secretary Skill is optional and Planner-suggested (harness-catalog.ts 37–45; harness/skills/secretary.ts 1–12), while source/Memory rights remain role-scoped. Original plan risked interpreting any receiving Role as authorized writer. | P1-01..03 distinguish identified-Project acceptance, existing-owner routing, immutable DEC readback and truthful NOT_SAVED. Read-only Roles may recognize and hand off but never gain writes. |
| R-03 | IMPORTANT | get_agent_harness returns only Shared+Role and suggested Skill names (harness-skill-tools.ts 26–45); required NEXT Skills are Task-specified, ui-coder-frontend-only at job-prepare schema (job-prepare-tool.ts 66–69). Original plan had no explicit Role × workflow × document/Skill trigger map, risking a repeated progressive-load failure. | P0-06 and matrix for all 8 Roles; P4-03 preserves owner, trigger, independent entry, missing-Skill and exact document-read conditions. |
| R-04 | IMPORTANT | Current U-F source tests exercise retest-history.ts as standalone fixture (test-lab/uf-three-cycle-retest.test.cjs), not a proven real dispatch guard. Describing future dispatch enforcement as automatic would be unsound without authenticated history inputs. | P3-02 explicitly requires evidence of real call sites before mechanical guard; label MECHANICAL_ENFORCEMENT_NOT_VERIFIED if absent. |
| R-05 | IMPORTANT | Source-text/fixture tests (test-lab/ud-precode-cr.test.cjs and ua-decision-fidelity.test.cjs) verify code contracts but do not prove that a model autonomously loads the proper Skill, persists a Decision or reads the right CR target. | P0-05 and P5-02/03 distinguish static, simulated and real-host evidence. P5 PASS limited to source candidate with external behavior UNVERIFIED when not run. |
| R-06 | MINOR | Existing approved U-D requirement could be narrowed incorrectly to only arbitrary tagged Tasks, or expanded to global mandatory CR. | P2-01 references approved Goal and related Task scope; P2-02 preserves Human/milestone-only CR authority and no generalized gate. |
| R-07 | MINOR | Document references in a Role are not automatic reads. Host canonical guides and Skill bodies are distinct loading surfaces. | P0-07 checks architecture guides and host skill; P4-03 forbids assuming role-suggested/host Skill/canonical_refs are loaded. |
| R-08 | MINOR | Plan quality required code-executable test names, Goal anchors and SHA-grounded change evidence. | P5 references real test-lab files; Phase GOAL format and role matrix verified through direct document readback; compare confirms docs-only branch. |

## Repair and re-review evidence

- Initial plan at docs/.../GSA4-INSTRUCTION-HARNESS-SKILL-REPAIR-PLAN-20261105.md, first blob SHA 7217350be362d66caac88351fe404c83712e833c, had 156 lines.
- Repaired plan commit 1bbbf01852a3766cf39f107a2ffb54b46f6858a9, blob SHA 29182968bc1475c1d11788c6d272e0a710e6a10e, 186 lines.
- Programmatic recheck: 12/12 plan-invariant checks PASS (top-level GOAL; 6 Phase goals; 8 Role rows; caller-controlled U-D focus warning; U-F mechanical limitation; Secretary permissions; all 9 audit findings traced; no schema expansion; no code authorization; source-test references).
- GitHub compare from c150954b76fea919907edc15d0673aad2914a1f3 to 1bbbf01852a3766cf39f107a2ffb54b46f6858a9 showed exactly 2 new Markdown files (audit and plan), zero source modifications, branch ahead by 3 commits.

## Adversarial recheck (Critic-style; no independent GSA CR run)

- **Authority separation — PASS:** Plan retains existing Human/milestone CR authority, Project/Memory write scopes, source CAS and branch policies. No new Secretary Role or global pre-code CR.
- **No-Skill completeness — PASS for design contract:** Every Role has a specified always-visible obligation and triggers to original mandatory materials; optional HOW is selected on demand. This is a plan requirement, not an observed model behavior.
- **U-D focus spoof — addressed as a risk, not falsely closed:** Plan refuses to call GENERAL verification a U-D completion and requires evidence for a trusted binding. If no binding exists the implementation guard must remain DEFERRED/UNVERIFIED. This is acceptable *plan honesty* but NOT a security implementation PASS.
- **U-F cross-Job history — addressed as a risk, not falsely closed:** Plan requires actual durable history evidence before enforcing three-cycle stop. Standalone source fixtures alone cannot prove live dispatch.
- **Scope and source parity — PASS for plan:** Six phases with bounded ownership, traceability, negative tests, no activation of unrelated A4 preview, no source writes or merge/deploy, separate behavioral validation.
- **Known remaining implementation uncertainties:** trusted U-D subject/completion consumer, live U-F history retrieval path, real model progressive-loading behavior and exact context-token effects. All are explicit Phase P0/P2/P3/P4/P5 evidence tasks and cannot be represented as resolved before implementation.

## Disposition

PLAN_QUALITY = PASS_WITH_FINDINGS, limited to correctness and implementability of the *reviewed repair plan*, not source fixes or live behavior.
PLAN_READY_FOR_HUMAN_IMPLEMENTATION_DECISION = YES.
PRODUCT_SOURCE_REPAIR = NOT_STARTED.
LIVE_MODEL/HOST_BEHAVIOR = NOT_VERIFIED.
OFFICIAL_GSA_CRITIC_REVIEW_VERIFICATION = NOT_EXECUTED.
MERGE_DEPLOY = NOT_AUTHORIZED.

Any implementation that tries to make all Skills always-loaded, marks GENERAL CR universally invalid, infers Human approval, lets read-only Roles write Decisions, claims a fabricated U-F dispatch guard, or removes original mandatory context without evidence must be rejected as out of plan scope.

## Final review cycle — PASS (Plan + Milestones + Technical Proposal)

**Review target:** all three source-grounded documents on fix/gsa4-instruction-skill-classification at these exact Git blob SHAs:

| Artifact | Exact reviewed blob SHA | Final document status |
|---|---|---|
| GSA4-INSTRUCTION-HARNESS-SKILL-REPAIR-PLAN-20261105.md | f8774df989fd379f740be78782fb10f41eaf8b39 | PLAN_QUALITY_PASS |
| GSA4-INSTRUCTION-SKILL-REPAIR-MILESTONES-20261105.md | bb8f75d9cb5102556a2d6ea74d4152bf12d755a3 | MILESTONE_DESIGN_PASS |
| GSA4-INSTRUCTION-SKILL-REPAIR-TECHNICAL-PROPOSAL-20261105.md | 99d33171e0fd95f2019b97504cabaf7af495bdbd | TECHNICAL_DESIGN_PASS |

**Second-round Reviewer findings and repair closure:**

| Finding | Corrective action | Review result |
|---|---|---|
| R-09 IMPORTANT — Secretary accepted decision recognition might exist only in Planner/Orchestrator and be invisible to other Roles | Made harness/shared.ts mandatory as universally visible Human-accepted DEC recognition / full-content handoff; all eight Role-only scenarios included; no source permission expansion | CLOSED IN DESIGN |
| R-10 IMPORTANT — Pre-code descriptive applicability wrongly restricted to Tasks named U-D, or globally forced Critic | Explicitly separated relevant BP-05 source-changing Task descriptive proposal (Coder Role obligation) from existing Human/milestone-only independent Critic authorization; Skill retains HOW | CLOSED IN DESIGN |
| R-11 MINOR — Milestone Task Skill schema could be mistakenly widened | M0-T4 pins existing job_prepare.required_skills enum to ui-coder-frontend only, no new required_skill string or auto Skill injection | CLOSED IN DESIGN |
| R-01–R-08 (prior cycle) | Retained earlier corrections for caller-controlled review_focus, no verified U-D completion consumer, U-F helper versus runtime guard, Secretary authorization, 8 Role × Job × Task docs, source/model test provenance, CR authority | CLOSED IN DOCUMENT DESIGN; IMPLEMENTATION NOT VERIFIED |

**Adversarial negative-scenario review:**
1. Human brainstorm or tentative acknowledgement: no DEC, no automatic Discussion Job; unrelated chat doesn't trigger Project writes.
2. Accepted concrete Project decision enters any of the eight Roles with secretary Skill absent: core Shared must still recognize, preserve original detail and route to an authorized owner; read-only Role never writes.
3. Secretary fails GitHub Memory write/readback: NOT_SAVED, never SAVED; corrected decision preserves old immutable DEC source.
4. BP-05 applicable source-changing Task with coding-loop absent: Coder Role must identify descriptive proposal requirement; Critic may not be auto-invoked without actual direct Human or preapproved milestone authority.
5. Existing GENERAL CR: remains valid; a caller-supplied GENERAL focus must not be accepted as U-D PRE_CODE completion evidence. Do not claim mechanical bypass guard without an authenticated consumer.
6. Three full same-defect Tester PRODUCT_FAILURE cycles across Job/chat boundaries: Role STOP for patch #4; missing complete history or Host UNVERIFIED cannot count as three and cannot prove an ordinary patch safe. The standalone assessor is NOT a production dispatch guard.
7. Shared method dedup: reject any savings that strips mandatory owner, trigger, authorization or STOP from an independent Role entry; Skill names and canonical_refs do not auto-load text.
8. NEXT UI Task required_skill_contexts remains explicit ui-coder-frontend; no widening public Job schema or claiming all suggested Skills injected.

**Structural/traceability check:** 15/15 explicit cross-document checks PASS: all 9 findings appear in all three documents; six ordered Phase GOALs and six ordered Milestone GOALs; eight-role read matrix; universal Shared decision owner; descriptive precode vs CR authorization; review_focus trust boundary; U-F history limitation; current access, branch and schema; executable Task IDs; exact technical source action map; NO_CODE_WRITTEN status. This is a *document-structure check*, not a source-executed functional test.

**Decision: PLAN + MILESTONE + TECHNICAL DESIGN = PASS** under the documented current scope. This verdict means the source changes are planned with credible owners, acceptance and negative tests, and remaining external-source discovery steps are explicitly bounded by existing authority. It does NOT mean source fixes are implemented, live Agent behavior is validated, external Host is tested, a GSA Project planning Verification exists, or a real independently invoked Critic Reviewer has produced a stored CRITIC_REVIEW artifact.

**Disposition:**
- PLAN: PASS (direct static review)
- MILESTONES: PASS (direct static review)
- TECHNICAL PROPOSAL: PASS (direct static review)
- SOURCE IMPLEMENTATION: NOT_STARTED
- LIVE ROLE/SKILL RETRIEVAL TEST: NOT_VERIFIED
- TRUSTED U-D BINDING / U-F MECHANICAL GUARDS: CONDITIONAL / NOT_PROVEN
- AUTHORIZED IMPLEMENTATION, MERGE, DEPLOY: NOT EXECUTED

No product source code, external Project Memory or runtime enforcement was changed during this document review.