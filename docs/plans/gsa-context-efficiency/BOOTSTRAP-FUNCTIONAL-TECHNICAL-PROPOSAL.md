# GSA — Bootstrap Functional Update — Technical Detail Proposal (Pre-Code)

## GOAL, STATUS AND SOURCE AUTHORITY

Implement **only the still-missing or behaviorally incomplete functional Bootstrap v7 requirements** inside GSA, preserving its current native Project/Criteria/Plan/Job/Run architecture. This is **Track U**, independently developed from Track R (GSA1–GSA4 Context Efficiency). No Track U application code is authored before a whole-related Technical Review PASS. Only **after both Track U and Track R proposals PASS** may Planner finalize the coordinated implementation milestones.

**Status: PRE-CODE PROPOSAL — Coder nomination, pending whole-related Reviewer verdict; not application implementation or feature acceptance.**

Source pins:
- GSA repo: thebimhouseinfo-sudo/GPT-supper-agent, development branch upgrade/gsa-context-efficiency; live source supabase/functions/gsa-mcp/index.ts blob 448355e9a129db45d836c0f86915396fb060514c (9,777 lines, 55 MCP tool registrations).
- Bootstrap reference: thebimhouseinfo-sudo/bootstrap, main, docs/refactor/CONTEXT_OPTIMIZATION_REFACTOR_PLAN_DRAFT.md blob 98c4db371ecb48db02237ae2fbf69ce2e96f8614; **DRAFT v7**, functional M1–M7; installer/workers deferred.
- Existing U functional requirements and accepted semantics: docs/plans/gsa-context-efficiency/DETAIL-PLAN.md BP-01…BP-08, and its corrected two-track precedence/rolling measurement section.
- Track R proposal/review already PASS **design-only** and must not be gratuitously reviewed again: TECHNICAL-DETAIL-PROPOSAL.md / TECHNICAL-DETAIL-REVIEW.md (pinned in DETAIL-PLAN).
- The current approved Criteria remains authoritative. Proposed product scope exceeding it requires normal Human/Advisor Criteria procedure **before implementation**, not a fabricated technical design gate.

**Scope boundary:** This proposal is a detailed technical design, not a claim all call paths/tests have been dynamically executed. Exact source ownership is grounded in identified current tools/helpers. Where deeper callback-specific imports or current tests are not conclusively verified, they are listed as bounded implementation-verification requirements, never declared proven.

## 1. Existing implementation inventory — preserve rather than recreate

Current MCP tools (selected exact registrations from source):
- Project authority/Bootstrap: project_setup_prepare, project_criteria_advice_check, project_role_addins_resolve, project_bootstrap_checklist_prepare, project_bootstrap_readiness_prepare, project_branch_policy_prepare, project_open, project_status, authorize_project_scope, authorize_memory_mutation.
- Planning/Review: job_prepare, job_transition, job_revise_plan, plan_review_record, start_critic_review, critic_review_record, milestone_loop_evaluate.
- Plan revision/retirement: job_plan_change_assess, job_plan_change_prepare, job_plan_change_fence_prepare, job_plan_change_resume_evaluate.
- Execution/Run: run_begin, run_verification_record, run_complete, execution_cursor_prepare, execution_cursor_resume_evaluate, execution_recovery_evaluate, orchestration_progress_evaluate, stopchat_handoff_prepare, checkpoint_claim_prepare.
- Role/skills: get_agent_harness, get_skill_catalog, load_skill, start_direct_agent, get_instruction, get_command_help.
- Diagnostics and Evidence: /selftest, evidence_repository_* and evidence_bundle_attestation_prepare.

**Observed absences in 55 registered tool names** (not proof that every conceptual behavior is absent in prompts): no named Secretary/Discussion Job tool; no Tester-owned simulate tool; no named advanced-defect/three-cycle tool; no named pre-code proposal tool. Directly inspecting names does NOT suffice to conclude the existing Job/Role functions cannot be reused. Each design below therefore first extends existing functions/skills and creates a separate tool ONLY if a real consumer/interface contract requires it.

The existing 9,777-line root will be modularized by Track R GSA1 according to its approved design. **Track U must not separately introduce a conflicting file split.** When Track U is implemented before GSA1, the currently real owner is index.ts; when after, its reviewed corresponding owners are project.ts/planning.ts/execution.ts/agent.ts/records.ts. Source ownership must be pinned against the real current branch at Task start.

## 2. Proposed technical file-level operations

| Actual/proposed path | Action | Intended owner, purpose and integration | Explicit exclusion |
| --- | --- | --- | --- |
| supabase/functions/gsa-mcp/index.ts | MODIFY conditionally until GSA1 move; otherwise REUSE_AS_IS root composition | Wire necessary existing registrations/role help to changed domain implementations; preserve all published tool names/schemas/route/auth | No second mega feature implementation or Track R optimization mixed into U |
| supabase/functions/gsa-mcp/planning.ts | MODIFY **after GSA1 CREATE**; otherwise functions in index.ts | Job revision/retirement, decision reference and reviewed technical proposal state/validation through existing Job/Plan contract | No fresh Plan registry or second independent planner |
| supabase/functions/gsa-mcp/project.ts | MODIFY only if required by reviewed U decisions | Integrate accepted Decision references with Project/Criteria authority; preserve Advisor and bootstrap readiness semantics | No new Criteria gate, no self-approval |
| supabase/functions/gsa-mcp/execution.ts | MODIFY after GSA1 CREATE; otherwise existing index.ts owners | Dispatch fence/recovery and Run lifecycle continuity after Plan changes; limited advanced-defect attempt evidence where Job/Run legitimately owns it | No new Run.RETIRED, no guessed rollback or background worker |
| supabase/functions/gsa-mcp/agent.ts | MODIFY after GSA1 CREATE; otherwise existing role Harness/Skill records in index.ts | Progressive Planner/Coder/Reviewer/Tester guidance plus Secretary/solution-clarification/Tester simulation/deep-debug skill references | No unconditional giant harness injection; no new universal roles |
| supabase/functions/gsa-mcp/records.ts | MODIFY only for genuinely multi-owner shared pure validators after GSA1 | Existing durable contract validation and shared reference resolution; do not reimplement validation in each domain | No catch-all helper or new permanent decision database |
| skills/gsa-* existing role skill folders | MODIFY appropriate existing skill files after actual path inspection | Precise on-demand role instructions for decision fidelity, pre-code proposal, cross-Task reviewer, simulation, defect escalation and artifact semantics | Do not assume invented path names; no duplicated ChatGPT-native skill logic |
| Relevant existing test-lab/*.test.cjs | MODIFY / CREATE focused tests | Existing critical-path assertions maintained, source-bound discovery updated to current true module | Never weaken assertions to make GSA1 pass |
| docs/plans/gsa-context-efficiency/BOOTSTRAP-FUNCTIONAL-TECHNICAL-PROPOSAL.md | CREATE — this file | One integrated U technical design and reviewed component reference following PASS | Not a replacement Criteria or duplicate execution Plan |
| docs/plans/gsa-context-efficiency/BOOTSTRAP-FUNCTIONAL-TECHNICAL-REVIEW.md | CREATE only when actual Reviewer verdict is recorded | Coder→Reviewer loop, actual findings, fix evidence, final PASS/CHANGES_REQUIRED | Never label self-review as independent GSA runtime receipt |

Paths named project.ts/planning.ts/execution.ts/agent.ts/records.ts are **proposed GSA1 outputs**, not claimed to exist now. Future implementation MUST choose the actual owner and avoid introducing placeholder files prematurely.

## 3. Functional Job U-01: Decision capture, optional Discussion Job and Secretary (Bootstrap §6A/E1/E2)

### GOAL
Accepted Human/expert decisions survive discussion, plan revision, source review and new-chat handoff without adding a decision approval gate or promoting Secretary to project authority.

**Existing:** Job/Plan/Project/Memory tools and handoff support already exist; no Secretary registered tool is observed.

**Proposal:**
- MODIFY existing Project/Planning decision-link representation only where readback proves insufficient. Provide a structured Decision entry with stable human-readable reference, status DRAFT vs ACCEPTED vs SUPERSEDED, original human rationale, exception, source, affected goal and allowed edit authority. Preserve full original content via reference rather than replacing it with a one-line summary.
- Use an **optional** Discussion Job/workspace mode only if current Job contract can support it safely without forcing every conversation to create a Job. Secretary is a *focused decision-recording behavior* invoked for a genuine discussion, not a mandatory new agent, tool, approval or lifecycle.
- Existing Job creation and Memory writes remain within authorized Project scope, SHA/CAS and readback. No auto-authorized Criteria edit from Secretary.
- Return decision IDs/paths and retrieval guidance to Planner; preserve historical superseded decisions as reference.

**Call path:** Human discussion → accepted explicit decision → authorized Project/Planning storage → Planner references original decision → Coder/Reviewer read same source. No autonomous escalation to Advisor unless Criteria change is actually requested.

**Acceptance:** No write from mere discussion; explicit accepted decision survives Plan revision and handoff; exception/rationale preserved; no new Job gate for ordinary chat; duplicate invocation does not duplicate decision; wrong-project writes rejected.

**Unresolved source check:** Determine if current Job schema can legally represent discussion-only records. If not, choose a small separate record under existing Project Memory using existing auth—not a fabricated Job state.

## 4. Functional Job U-02: Planner referenced decision fidelity (Bootstrap §6A/E3)

### GOAL
Generate precise implementation plans referencing every relevant accepted decision, not only retained headings.

**Existing:** job_prepare, job_revise_plan, plan_review_record, milestone_loop_evaluate, validateNextPlanningModel and review loop machinery.

**Proposal:** MODIFY planning owner and Planner skills to require Goal at Project Plan and Phase boundary, decision-reference coverage per Task, status COVERED / MISSING / CONTRADICTED and explicit unchanged decision retention on revision. Existing Reviewer record continues independent check; if a decision was not retrieved, mark MISSING and stop invented domain logic. Keep normal source SHA/readback and current Job authorization. No second plan or new Planner state machine.

**Call path:** accepted Decision refs → Job/Plan prepare/revise → plan review → revised Milestones/Tasks → original full decision retrieval by Coder/Tester.

**Acceptance:** Multiple accepted details/negative exceptions survive two revisions and handoff; contradictory request flagged not silently reworded; existing technical method choices remain Coder responsibility. Strong negative test for heading-preserved-but-rule-lost decision fidelity.

## 5. Functional Job U-03: Scope-wide retirement when accepted plan changes (Bootstrap §6G/G0–G5)

### GOAL
When Human actually approves Plan/Phase changes, retire **unfinished affected** work as a set; retain unaffected work and examine completed results; make fresh identities for newly required tasks rather than reconciling every incomplete Job individually.

**Existing:** assessHumanPlanChangeJobs, prepareHumanPlanChangeIntent, resumeHumanPlanChangeIntent and registered job_plan_change_assess/prepare/fence_prepare/resume_evaluate, plus Job RETIRED/cursor recovery and branch behavior.

**Proposal:** MODIFY current Planning and Execution handlers **only where actual scope coordination is missing**. At revised scope boundary: select affected whole Plan or Phase once; fence in-flight Job/Run dispatch; reconcile real host/external Git side effects; retain appropriate completed outputs; logically RETIRE all unfinished affected Milestones/Tasks/Jobs, then create fresh reviewed topology with new IDs. Reuse current terminal Run semantics (CANCELLED/appropriate terminal); do not invent Run.RETIRED. Shared default/integration branches never auto-delete; exclusive obsolete source branches may be logically retired with ref/head evidence. Delayed completion cannot resurrect the stale plan.

**Call path:** Human-approved plan edit → change assessment → fence → actual Run/host settlement → scope-wide retirement → revised topology → readback. Authorization remains existing Project Memory/Git branch scope.

**Acceptance:** Whole Plan, single Phase and cross-Phase dependencies; completed + IN_PROGRESS + WAITING mixed, delayed callbacks, duplicate requests, crash/restart, unknown host state remains fenced; no phantom terminal or unauthorized Git branch deletion. Reuse Bootstrap R-01…R-20 negative coverage and current LLC58 logic. An old done result must not become a false PASS of new work.

## 6. Functional Job U-04: Coder solution clarification and artifact lifecycle knowledge (Bootstrap §6B/E4 and §6I)

### GOAL
Coder handles normal software design autonomously but consults Human on truly missing consequential domain/host decisions; DEV internal artifacts must not be confused with OPERATION user-owned outputs.

**Existing:** get_agent_harness, get_skill_catalog, load_skill and role-specific context mapping exist.

**Proposal:** MODIFY progressive Coder skill source(s) and relevant Agent role reference. REUSE existing skill catalog + load-on-demand. Add concise solution-clarification guidance with trigger: exact missing operational/domain outcome that cannot be inferred from Criteria/approved decisions/source; no questions for variable names, library choice, ordinary engineering tactics, or answered inputs. Add explicit lifecycle decision tree:
- DEV application internals: legitimate Git SHA/CAS/auth/revision.
- OPERATION user-created CadGPT Temp/Custom Jobs, JOB.md, LISP/Python, DWG/DOCX etc.: user Open/Edit/Save/Load/Export/Import identity; no forced SHA/UUID/registry/permanent promotion without user decision.
- Host-managed BAK/DWL/cache/Run artifacts: actual native semantics, not universal lifecycle assumptions.

**Acceptance:** User's edited/moved/imported same Job still works as authorized; same-name LISP reload not blocked by invented source version; source-code CAS security still holds; ambiguous collision is asked once only if consequential; native AutoCAD BAK not equated to DWL/DWL2. **Do not change CadGPT code in this GSA Job.**

## 7. Functional Job U-05: Detailed pre-code proposal contract (Bootstrap §6B/E5–E7)

### GOAL
Coder produces a real file/function/call/dependency-level descriptive proposal **before** application code changes, scaled to Task size.

**Existing:** job_prepare/revise_plan, plan_review_record and review role; current root source contains very few "proposal" occurrences; no uniquely registered descriptive-proposal tool.

**Proposal:** MODIFY Coder on-demand instructions and existing Plan/Job artifact linking. A proposal per related Goal/Task set must show exact paths/actions CREATE/MODIFY/REUSE_AS_IS/KEEP/REMOVE; existing vs proposed symbols/callers, input/output, integration, contract, external side effects, tests, unknowns and exclusions. Greenfield names proposed files; Brownfield points to verified current function/caller. Store this as ordinary approved Markdown artifact under current project ownership; **not** a separate governance system, empty source skeleton, class/file registry or new application code. Small independent Tasks get compact sections.

**Call path:** reviewed Plan → Coder source inspection → single descriptive proposal → whole-related Reviewer → corrected reviewed proposal → authorized application coding.

**Acceptance:** All affected Task files/callers identified; missing reference marked unknown rather than invented; no .ts/.lsp source created during pre-code; one complete interacting proposal rather than a disconnected per-Task approval gate; same initial criteria not reapproved unnecessarily.

## 8. Functional Job U-06: Reviewer whole-related proposal and disproportionate complexity (Bootstrap §6B/E8–E10 and §6C)

### GOAL
Challenge related Task designs together; prevent duplicate machinery, conflicting interfaces, unnecessary services and risky disproportionate system changes.

**Existing:** plan_review_record, start_critic_review and critic_review_record, Reviewer role skills.

**Proposal:** MODIFY Reviewer/Planner skill contracts and existing Review record only where evidence/coverage fields truly missing. Reviewer input is the complete connected proposal, exact accepted decisions, source call graph and whole affected Task set; Reviewer outputs PASS, CHANGES_REQUIRED or HUMAN_ESCALATION with file/function-specific evidence. Derive final implementation reference **after PASS** only. Check "SMALL FUNCTION → BIG SOLUTION → LARGER SYSTEM IMPACT" and challenge overengineering; if no safe adequate simple option, inform Human about real risk/available narrow/manual solution. Do not impose a new registry. Note a second DWG in the same AutoCAD process is **not** crash isolation; UNDO is not full filesystem/host rollback.

**Acceptance:** Reviewer catches duplicated cross-Task services, missing caller/contract, false safety assumptions and source/type cycles. Material technical changes return to bounded review; ordinary Coder choices don't escalate. No Reviewer PASS without reading all related Tasks.

## 9. Functional Job U-07: Tester progressive real-user SIMULATE skill (Bootstrap §6H/H0–H3/H6)

### GOAL
Test the actual public user entrypoint and every causally triggered child flow, including realistic interleavings and adverse conditions. Simulation is a **Tester skill loaded on demand**, not a new agent, Job or mandatory startup gate.

**Existing:** Tester role guidance, ordinary test-lab runtime/host paths, existing progressive skill loading. Source contains minimal "simulate" text and no simulation-named registered tool; this does not prove no ordinary tests exist.

**Proposal:** REUSE get_skill_catalog/load_skill, MODIFY existing Tester skill references and ADD specific skill content only after obtaining the **actual** full simulate.skill/SKILL.md + five references. If unavailable, record CONTENT_UNVERIFIED; do not fabricate the missing skill's full contract from a filename. Within one Tester skill: Designer phase freezes expected oracle from User/Criteria **before** inspecting implementation; Tracer phase follows real UI/command/plugin → routing → Job/Run → callbacks/fan-out → locks/leases/queues → persistence/host → user-observed result. Scenario ladder S1 nominal, S2 sequence/save/reopen, S3 deterministic concurrency/interleaving, S4 adversarial malformed/reconnect/duplicate/cancel; existing T0–T6 remains primary, no new mandatory taxonomy. Record STATIC/SIMULATED/REAL_HOST_UNVERIFIED distinctly.

**Acceptance:** One user trigger creating two competing CAD flows is detected; unrelated SYSTEM work remains concurrent when correct; final outward DONE is not claimed before native host outcome; fake host tests never claim AutoCAD geometry/save PASS. Do not stress-test production drawings destructively.

## 10. Functional Job U-08: Three repair/retest cycles + advanced causal root-cause escalation (Bootstrap §6H/H4–H6)

### GOAL
Avoid endless fourth guess-patches on the same defect; after three genuinely completed Coder-fix + independent Tester reruns, switch to deeper causal investigation.

**Existing:** Job/Run and verification/evidence records plus Tester guidance; no named dedicated advanced bug tool in current 55 registrations. Existing source of actual defect attempt history must be inspected before storing another type.

**Proposal:** MODIFY Tester/Coder progressive skill and minimal existing Task/verification record usage. Track count by defect identity + user-visible symptom + original reproduction (not arbitrary Job ID/new chat title). Count a cycle only with authorized Coder patch AND independent Tester replay of the same original public trigger plus regressions. After third FAIL, stop ordinary patching; use available systematic-debugging skill to trace first divergent event across sibling flows/state/locks/host and run bounded hypothesis tests. Earlier escalation allowed for high-risk race/architecture evidence. Persist a compact advanced defect report with attempts, source SHAs, causal graph, uncertainty, remedy and regression test. Architecture-level remedy returns to combined technical proposal review; never automatically patch a fourth time.

**Acceptance:** Three real failures across handoff cannot reset to zero; CI green does not equal independent Tester PASS; missing host is UNVERIFIED, not FAIL; distinct genuine bugs do not share counts.

## 11. Cross-Job integration constraints and call graph

**Authority direction:** Human-approved Criteria/decisions → Project/Plan/Job contract → progressive role skills → proposed source changes → Reviewer/Tester evidence → existing Git/Memory readback. No subordinate role can grant itself Project/Criteria authority.

**Primary dependencies:**
- U-02 consumes accepted decisions from U-01 (but existing accepted records may already meet demand).
- U-03 consumes plan-change and Run/cursor state, independent of a new Secretary implementation.
- U-04 enables U-05 clarification and artifact semantics.
- U-05 provides reviewed design input to U-06; U-06 reviews the **whole related set** rather than accepting micro-reviews.
- U-07 defines Tester end-user causal replay; U-08 adds bounded repair escalation using Tester evidence.
- Track R GSA1 relocates owners only; it cannot change the semantics of any of these U Jobs as an undocumented side effect.

**Important integration risk:** U-01 may not need a new stored Discussion Job; inspect existing Memory/Job contracts first. U-07 cannot claim full simulated workflow until original skill source is accessible. U-03 must not conflate Git-branch logical retirement with branch-ref deletion of U code-comparison losers. U-05/06 review contract must not cause recursive "review the review" gates during its own source implementation.

## 12. Review checklist and verification requirements

Reviewer must check *source-specific* behavior rather than headings:
1. Every U Job maps to actual preexisting entrypoints and identifies missing behavior; separate confirmed absence from unverified.
2. Code actions and dependencies respect current monolith versus reviewed Track R modularization; no second competing architecture.
3. Project auth, Human Criteria advisor trigger, source branch binding, Git CAS/readback, negative permission, job/run/cursor states preserved.
4. Whole proposal is simple enough for the user requirement; reject duplicate Decision database, registry, workflow engine, role or new approval gate without genuine necessity.
5. Historical feature semantics BP-01…BP-08 / Bootstrap §§6A–6I retained including negative cases; no special CadGPT application edits slipped in.
6. Technical Reviewer PASS means source-grounded **design** quality; implementation build/typecheck/test/MCP runtime remain NOT EXECUTED.
7. Comparison with Track R remains **coordinated only after both technical proposals PASS**. Real U feature Jobs are independently implemented twice on exactly two temporary output branches with immediate better-code integration/deletion; candidate GSA runtime context results are separately VALID/INVALID and normalized across different Jobs by the locked L×K method in DETAIL-PLAN. No third branch nor forced replay of old failed Job for metrics.
8. No main merge/deploy, application code or Criteria mutation from this proposal.

## 13. Open checks, review decision and boundaries

**Code-level questions requiring inspection at task implementation, not license for invented behavior:**
- Whether current Job schemas safely support a discussion-only workspace or whether optional accepted decisions should live in an existing Project Memory record.
- Whether current Reviewer durable record has adequate coverage fields for whole-related technical proposal without schema change.
- Whether original external simulate.skill body + five references are accessible.
- Whether existing Tester/verification records can store three-attempt continuity without changing job/run lifecycle.
- Which source-location-based test assertions will need update as GSA1 moves owner functions.
These bounded checks must be resolved before corresponding source commits; they do **not** require re-review of unchanged Track R proposal.

**Coder nomination:** Reuse the native 55-tool control plane and progressive role skills; make minimum justified code changes, no new core control plane. U-01…U-08 form the functional design. **Reviewer verdict pending**; no independent review receipt claimed.

**NEXT:** A whole-related Reviewer examines this proposal alongside the pinned Bootstrap draft and real current GSA source, returns concrete findings; Coder revises until design PASS. Only then Planner constructs U and R independent implementation milestones and their interleaving schedule. No source implementation, main merge or deploy authorized here.
