# GSA4 — Repair Plan CRL: Direct Source-Grounded Review

Date: 2026-11-05
Mode: DIRECT AGENT / DOCUMENT AND STATIC SOURCE REVIEW
Outcome: PASS_WITH_FINDINGS **FOR PLAN QUALITY ONLY** after one CHANGES_REQUIRED → repair → independent adversarial recheck cycle
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