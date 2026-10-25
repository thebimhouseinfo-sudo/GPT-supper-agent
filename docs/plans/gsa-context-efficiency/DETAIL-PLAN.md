# GSA — Integrated Bootstrap Functional Upgrade & Context Efficiency Plan

## GOAL

Upgrade GSA with the **missing, GSA-applicable functional rules** from the current Bootstrap v7 plan while using those real implementation Job Packs to estimate whether **GSA-controlled context efficiency** improves. First build a small context meter. First use a source-grounded **Technical Detail Proposal + whole-proposal design review** to select the best cohesive grouping. **GSA1 is mandatory source modularization** (index.ts becomes a thin entrypoint; no user-visible logic change) and is retained after behavioral parity even if practical read/context cost initially increases. **GSA2** tackles actual harness duplication, **GSA3** excess tool/skill result payload and **GSA4** proven Role/Task/Phase scoping; these later groups are reversible. Each version is exercised against its retained parent on the **same full Bootstrap update Job** in exactly two auxiliary feature-output Git branches from one source commit. Review both produced code outputs and context estimates. If the candidate needs a GSA runtime repair, invalidate that Job's context sample and use a subsequent clean whole Job/repeat. Select/integrate the better output code, **delete the inferior auxiliary branch after comparison**, and independently decide the candidate's context fate: **GSA1 KEEP after parity regardless of efficiency**, but **GSA2–GSA4 KEEP/REVERT** by actual measured quality and context. Each retained version becomes the next rolling baseline. Preserve complete accepted decisions, role independence, authorization, real-world user behavior, and current deployed GSA while developing on a separate source branch. No exact ChatGPT-Web input-token or productivity claim.

**Status:** DRAFT FOR PLANNER/REVIEWER AND HUMAN — *proposed scope and schedule, no runtime implementation authorized here*.
**Technical Proposal RL:** `TECHNICAL-DETAIL-REVIEW.md` now records **CHANGES_REQUIRED → repaired → design-document PASS** for GSA1–GSA4. It verifies source ownership of **55 MCP tools, 98 top-level functions and 28 uppercase constants**, with no reciprocal module edges on the checked function/handler-call surface. **Project+Bootstrap are grouped in project.ts**, and shared durable record/attestation validation in records.ts. This is **not** compiled-code, live MCP, or formal durable Job Reviewer Verification PASS. Overall plan stays DRAFT pending correct Criteria/Human implementation scope.
**Date:** 2026-10-24.
**Source development branch:** `upgrade/gsa-context-efficiency`, begun at `main` SHA `2ae052b57241bb845234235767b3dcb767030c70`.
**GSA runtime currently deployed:** `gsa-mcp` v55; no automatic production deployment or merge from this document.
**GSA source:** `thebimhouseinfo-sudo/GPT-supper-agent`, primarily `supabase/functions/gsa-mcp/index.ts`, `skills/`, `test-lab/`, `evals/`, and `docs/architecture/`.
**Bootstrap source:** `thebimhouseinfo-sudo/bootstrap` `main` @ `ea5f70f8bc051a036496158a4e33a2bfe6f99725`, `docs/refactor/CONTEXT_OPTIMIZATION_REFACTOR_PLAN_DRAFT.md` blob `98c4db371ecb48db02237ae2fbf69ce2e96f8614` (**DRAFT v7.0**, not an approved deployment contract).
**Existing GSA Criteria:** `thebimhouseinfo-sudo/GSA-Projects/projects/01a0f051-4353-7bff-8edf-46be4b44fd2f/CRITERIA.md`, blob `ff45d47435ae6cc9ae4acd5106bf945308fb4f95` (**APPROVED**, narrower A Planner/B research-first context/C bug remediation).

### Current decision, historical continuity and conflicts

1. This is **one integrated upgrade plan**, replacing the sequence previously described in this file (original M1–M4 research/replay-only plan), not adding another competing Project Plan or multiplying Job records. Old revisions remain in Git history. Existing Project Memory Job ownership must be reconciled with the latest reviewed plan only when authorized execution begins; do not duplicate J-94B4 or J-02E2 just to implement this document.
2. **Human's corrected technical sequencing (2026-10-24):** CT-00 meter → GSA1 source modularization proposal, logical whole-module review, exact function/call graph and gradual behavior-parity implementation → GSA2 Harness → GSA3 Tool/Skill response → GSA4 Role/Task/Phase when evidence justifies it. GSA1 is a **mandatory architectural foundation** and KEEP after equivalent behavior even if practical read/context cost is worse; optimization candidates GSA2–GSA4 separately KEEP/REVERT. For each comparison milestone, run the same substantive Bootstrap Job twice from one identical source commit in exactly **TWO auxiliary feature-output branches**; retained and candidate **GSA runners** are independently source-pinned. If candidate GSA bugs require repair, discard that run's context measurement and use the next clean whole-Pack attempt. Independently review two code outputs, integrate the better implementation, then delete the poorer auxiliary branch after verified integration and actual branch-ref delete/readback. Never split Jobs artificially for measurement.
3. **Explicit Criteria alignment needed before runtime work:** existing approved GSA Criteria B1–B3 says read-only research/estimate/value decision **before creating a benchmark tool**. The newly directed meter-first sequence conflicts with that order. Adding Bootstrap functional behavior is also new substantive scope beyond A/B/C. This file records the proposed Human direction but does **not silently revise Criteria** or claim existing approval. Use the *existing* Human/Technical-Advisor Criteria-change procedure only when Human authorizes formal Criteria update; do not create another approval gate or ask for Advisor during ordinary plan drafting. Until aligned, the new code-work scope is PLANNED / NOT AUTHORIZED, not already READY.
4. **Runtime and source branch are different:** GSA Jobs call the already deployed plugin/MCP and the configured Project Memory. They do **not execute GitHub source branches**. The dev branch is the code target; simply editing it does not change GSA production. Never infer that a production tool response is the optimized dev-runtime response. Compare old/new source behavior through source-pinned isolated executable tests, then if supported an isolated staging endpoint/client. No merge to `main` and no production deploy while experimenting. Do not relabel global Project Memory Development Branch solely to run a benchmark or move unrelated Jobs.
5. **Bootstrap v7 is a proposed upstream specification:** treat its exact sections, accepted-decision table, examples and negative cases as references; implementation requires GSA-specific code-fit and the proper approved scope. Only adopt the *GSA-owned* portions. Do not clone Bootstrap installer or introduce a separate lifecycle control plane.
6. **Existing GSA bug intake (Criteria C) continues independently.** This plan neither cancels nor changes other Project Jobs and does not reinstall Planner critical-thinking already in v55. Preserve source and evidence authority.

### Source-truth reference map — preserve semantics, not just headings

| Bootstrap source | GSA-specific feature to assess/implement | Hard boundaries |
|---|---|---|
| v7 §6A, §6E E1–E3 and CD-01–CD-58 | Optional Discussion Job/Secretary + immutable accepted-decision provenance and Planner Decision Fidelity | Never auto-open Discussion Job; never reduce an accepted expert procedure to a topic summary |
| v7 §6G G0–G5, R-01–R-20 | Scope-wide Plan/Phase/Milestone/Job/Task and exclusive-branch RETIRED | Reuse existing GSA Job/Task RETIRED, plan-change intent, dispatch fence and Run/cursor settlement; no shadow engine |
| v7 §6B, §6E E4–E7, §6I I1–I5, F-01–F-20 | Coder scope, focused solution clarification, DEV vs OPERATION artifact lifecycle; descriptive Pre-Code per Task | Coder not Domain Expert; no user-file SHA/GUID by default; no application-source stub in Pre-Code |
| v7 §6C, §6E E8–E10 | Reviewer combined design, duplication/dependency and Small Function → Big Solution → Larger System Impact escalation | Reviewer sees all interacting Task proposals; prefer minimal verified host-native approach; manual user test is legitimate |
| v7 §6H H0–H6, S-01–S-18 | On-demand Tester `simulate` skill with real user-entrypoint causal fan-out and maximum three fix/retest cycles | Not a new Simulation Job/agent; mocks ≠ AutoCAD native PASS; no fourth blind fix |
| v7 §8.3–§8.9 | Functional-first sequencing M1–M7 and integrated end-to-end testing | These milestone numbers belong to **Bootstrap**, not newly invented GSA Job lifecycle states |
| v7 §1–§6, §8.10 B1–B5 | Lead/Worker, local installation, QwenCode hooks, multi-model, worktrees | **DEFERRED**; not part of this GSA context/functional-first sprint |

A Planner/Reviewer/Coder implementing a Pack must open the **complete referenced upstream section**, check accepted vs proposed status, and preserve the concrete rules, examples, exceptions and rejected approaches. Do not mechanically transplant Bootstrap-specific paths or CadGPT product requirements into GSA.

## Phase P0 — Small context meter on dev source

### GOAL
Produce the lightest useful **per-command/per-Job-Pack** estimate of GSA-produced context and validate that both baseline and modified GSA dev code can be measured without changing production.

**P0.1 Determine observation point (bounded source inspection within this meter Task).** Inspect `BASE_AGENT_HARNESS`, `ROLE_HARNESSES`, `renderHarness`, `get_agent_harness`, `get_skill_catalog`, `load_skill`, MCP startup instructions, command descriptions and representative `external_steps` / tool outputs. Identify what can be counted from source, executed test calls or isolated dev staging; mark ChatGPT-host-only material UNKNOWN. No new general observability framework.

**P0.2 Implement one small test-only meter, using existing Test Lab and repository tools.** Preferred minimal code surface: `test-lab/context-efficiency-metrics.test.cjs` (or a single small neighboring script if source inspection proves preferable) and optionally small synthetic fixtures. Reuse existing Node/TypeScript source extraction utilities and available JSON tool-response envelopes rather than adding an MCP wrapper, database, telemetry service or new permanent agent. For each observed GSA command record its label, execution/source SHA, response UTF-8 bytes, character count, an explicitly named approximate-token heuristic or tokenizer (not actual Web tokens), and occurrence count. Record schema/descriptions only if demonstrably available at this test surface. Keep `structuredContent` vs text fallback as protocol-compatible; never assume the host doubles token usage.

**P0.3 Aggregate by actual Job Pack.** In a development/test run, tag the bounded invocation ledger with `pack_id` and source revision; total *observed* tool payload = sum of observed calls. Count follow-up tool calls and retries when visible. Separately state what cannot be observed (host input tokens, thinking, cached history, out-of-band GitHub reads). Tool results without a valid source/environment identifier cannot count as dev-optimized results.

**P0.4 Dev isolation and smoke.** Run the meter on the pinned unoptimized source and on an intentionally small synthetic text change in an **isolated test artifact** only if needed to verify that the meter actually reports a changed payload. Do not mutate the deployed plugin, GSA production Memory or `main`. If the branch code is not instantiated as an endpoint, static/source-executed payload measures are SOURCE-TESTED only; a live model-mediated dev test needs an authorized staging MCP endpoint/client and cannot be claimed just because a Git branch exists. Keep no unnecessary new plugin registration.

**P0 deliverables:** `CONTEXT-METER.md` (scope, formula, unknowns, test command), minimal meter script, one reproducible baseline output and proof that a modified dev source creates a different measured sample. Any new test must be explicitly invoked or included in the CI test list; the current `.github/workflows/gsa-next-logic.yml` enumerates specific Node test files.

**P0 PASS:** Reproducible per-tool estimates on exact source; bounded Job Pack aggregation; clearly labeled scope/uncertainties; no production cutover. This is a *tool-functionality* PASS, not proof of exact ChatGPT context or whole-Job savings.

## Phase P1 — Alternating Bootstrap functional Job Packs and context optimizations

### GOAL
Implement missing GSA-specific Bootstrap behavior in dependency order, using completed Packs to measure context **before versus after** bounded context optimizations and preserve meaningful work outcomes throughout.

### Execution order — reviewed GSA1 foundation and rolling CX candidates

**The Technical Detail Proposal and design review are the canonical architecture references for implementation planning:**
- `docs/plans/gsa-context-efficiency/TECHNICAL-DETAIL-PROPOSAL.md` — current GSA1–GSA4 module grouping, 55-tool ownership mapping, functions/callers, operations, tests and real-world measurement
- `docs/plans/gsa-context-efficiency/TECHNICAL-DETAIL-REVIEW.md` — source-grounded comparison of monolith / context-only extraction / cohesive domains; remaining exact dependency/import and runtime verification requirements

**First phase after CT-00 is mandatory GSA1**, not a separate PREP and not the first reversible Harness optimization. The current revised technical proposal assigns all 55 tool registrations, all 98 top-level functions and 28 named schemas/constants, resolves Project↔Bootstrap and Records/Execution/Evidence dependency cycles by ownership regrouping, and defines a cohesive diagnostic selftest extraction. Review actual source and proposed function grouping **before source implementation**; index.ts becomes a thin entrypoint/registration map; verify no missing tool/role/route/Job contract after each extracted cohort. The final grouping is judged on functional cohesion, how many files must be read together, dependency direction and real workflow, not on the sheer count of files. The first code change happens only after approved execution scope and reviewed architecture. **GSA1 KEEP once its functionality is equivalent**, even if the early efficiency result is worse, because it supplies the structure for later improvements. A functional regression must be fixed before GSA1 baseline promotion.

**Subsequent phases:** GSA2 = reduce proven delivered Harness repetition; GSA3 = reduce redundant Tool/Skill response payload; GSA4 = select context by trustworthy Role/Task/Phase inputs when feasible. If no real improvement is supported, mark an optional candidate SKIP/REVERT, never invent a feature to fill the version number.

**Exactly two auxiliary branches** per comparison milestone from one common feature-source SHA, one for the retained GSA runner and one for the candidate GSA runner. Names finalized and recorded in the milestone. They contain independently implemented **same full Bootstrap functional Job** outputs. A clean first attempt is measurable immediately; a candidate GSA bug invalidates its context result, then repair and re-run a full safe Pack on equivalent inputs. Review both outputs, integrate best code into dev, then delete inferior auxiliary branch with readback (branch deletion capability currently unverified, not a fake DONE). Choose GSA runtime/context winner independently from code winner. No other auxiliary branch for retries or Tasks.

| Sequence | Runner and goal | Same-Job/two-branch work | Close decision |
| --- | --- | --- | --- |
| CT-00 | Compact context + source-navigation meter | No feature branches yet | Verified estimation method |
| **M-01 / GSA1** | **GSA0 vs mandatory GSA1 modularization** | One substantial Bootstrap Job A done twice on identical feature base via CONTROL/CANDIDATE | Compare code and practical code navigation; **GSA1 KEEP after behavior parity regardless of initial speed/context**, integrate better code, delete inferior auxiliary branch |
| **M-02 / GSA2** | Last retained GSA1 vs candidate Harness deduplication | Next complete Job B, two branches | KEEP GSA2 only if safe net benefit; otherwise REVERT to GSA1 |
| **M-03 / GSA3** | Current retained winner vs tool/skill payload candidate | Job C (or final whole-Pack redo), two branches | KEEP/REVERT GSA3 independently |
| **M-04 / GSA4** | Current retained winner vs phase/task-scoped selection **only when grounded** | Job D (or whole-Pack redo), two branches | KEEP/REVERT or NO_BUILD, never assume task metadata exists |
| Integration | Last retained winner | Actual Bootstrap M7 regression | Record code-quality winner, GSA runtime winner, eligible/invalid metrics; no auto main merge/deploy |

**Practical measurement:** GSA1 compares actual source bytes/text read, number of files opened, searches and cross-file hops, rereads, rework and code quality; GSA2–GSA4 additionally measure GSA-owned MCP payload/calls. A design reviewer can pass or reject a proposed module boundary based on source/call graph, but **cannot PASS real speed/context efficiency without executed paired work**. GSA0's observed figures remain historical reference after GSA1 is kept.

### BP-01 — Discussion Job and Secretary (Bootstrap M2, §6A/E1/E2)

#### GOAL
Preserve real Human-accepted expert decisions in existing GitHub-backed project scope so Planner/Coder can later read them without losing the original solution.

Tasks:
- **BP01-T1:** Implement optional entry semantics: explicit Human "open Discussion Job" opens directly; generic desire to talk gets at most one optional offer; declining permits normal chat; ordinary questions/brainstorm do NOT auto-open one. Discussion Job is a *documentation workspace*, not a compulsory executable Job, new gate or background agent.
- **BP01-T2:** Use a focused Secretary skill/action (not an always-running role). Record a decision ONLY after actual Human acceptance, distinguishing `ACCEPTED`, `PROPOSED`, `UNRESOLVED`. Preserve exact operational algorithm, reason, examples, exceptions, forbidden alternatives, dependencies and original provenance, not just a title.
- **BP01-T3:** Keep stable Discussion/Decision references and an index using existing authorized project documentation/Memory, with sequential corrections as explicit supersession and full prior text readable. No new database, schema bureaucracy or fake write-confirmation; use GitHub CAS/readback where already applicable.
- **BP01-T4:** Negative tests: no Secretary activation on speculation; no "saved" claim before readback; corrected decision does not erase old source; normal non-discussion work carries on.

**PASS:** One long, multi-step expert procedure survives accepted recording, correction and later retrieval with exceptions intact; no extra mandatory gate.

### CX-01 / GSA1 — Mandatory cohesive source modularization

#### GOAL
Make `index.ts` a thin actual MCP/Hono assembly entrypoint and group the source's existing functions, tool registrations and tests by **cohesive read/edit/test responsibility**. No business logic change. Mandatory KEEP after regression-free parity, independent of any initially higher read/context cost.

**Technical Proposal → Reviewer first:** use actual code/dependency map of all 55 MCP registrations, role/skill, Project/Bootstrap/Planning/Execution/Evidence/Browser and the large selftest; review three alternatives, group related code together, reject excessive splitting and giant mixed files. Determine best source file matrix and call hierarchy **before implementing**, not by making arbitrary files then trying to merge them later.

**CREATE/MODIFY/KEEP per-task detail:** the verified candidate file matrix, symbols, callers, function ownership, proposed `register…Tools(server,req)` wiring, `index.ts` import/export boundary, conditional shared contracts and diagnostic tests are documented in `TECHNICAL-DETAIL-PROPOSAL.md`. After source-writing authorization move → link → run parity tests **one coherent group at a time**. Preserve public tool list/schema, role/skill strings, secure GitHub/Run state, HTTP responses and existing negative tests.

**PASS:** functional/source/host equivalence at the demonstrated test surface, coherent navigation and no orphaned route/function/tool; practical source-navigation costs are **MEASURED, NOT GUARANTEED**. Repair regressions rather than REVERT merely because GSA1 measures worse. Maintain GSA1 as GSA2 baseline after parity.

### BP-02 — Planner Decision Fidelity (Bootstrap M2, §6A/E3)

#### GOAL
Prevent plan drift when condensed Plan/Task descriptions replace previously accepted professional decisions.

Tasks:
- **BP02-T1:** Read full applicable current DEC text and supersession status before planning; label source/provenance and accepted state.
- **BP02-T2:** Link Goals/Phases/Milestones/Tasks to stable DEC IDs, keep Plan focused on delivery structure, and check `COVERED / CONFLICT / FEASIBILITY`, with concrete examples and negative controls. Never silently reinterpret accepted HVAC/Job algorithms.
- **BP02-T3:** On Plan revision/handoff read original full decisions and state exactly which remain unchanged; Reviewer independently checks fidelity. Real contradictions go to Human, without triggering Advisor unless actual material Criteria change.
- **BP02-T4:** Exercise a detailed accepted rule with multiple exceptions; one deliberately shortened/wrong Plan must be rejected and repaired without bloating every Plan with duplicated decision prose.

**PASS:** Original complete decided solution remains recoverable and controls implementation despite a short linked Plan. Measure full pack against BP-01 only as a **relative size-normalized trend**, not equivalent tasks.

### BP-03 — Scope-wide RETIRED (Bootstrap M3, §6G/G0–G5, R-01–R-20)

#### GOAL
A reviewed change replacing a Phase or whole Plan retires **all unfinished work inside the changed boundary**, while protecting active effects, completed results and unaffected scope, without per-unfinished-Task KEEP/REVALIDATE arbitration.

Tasks:
- **BP03-T1:** At existing authorized Plan revision, select affected Phase(s)/entire Plan ONCE; discussion alone does nothing. Preserve unchanged Phases; handle crossing dependencies specifically.
- **BP03-T2:** Inspect **COMPLETED** outcomes only for reuse, retain historical PASS and original IDs; for all unfinished DRAFT/READY/IN_PROGRESS/BLOCKED/WAITING Tasks, Jobs and Milestones in changed scope, record logical RETIRED, with no stale closure obligation. Preserve plan/phase revision history.
- **BP03-T3:** For IN_PROGRESS, fence new dispatch/step continuation, reconcile real Run/cursor/host/Git side effects before terminal transition. UNKNOWN/PENDING remains fenced awaiting reconciliation; no fake asynchronous stop, rollback or duplicate write. Runs use existing CANCELLED/actual terminal semantics, **not an invented Run.RETIRED**.
- **BP03-T4:** Create fresh reviewed Phase/Milestone/Job/Task identities and dependencies; no mandatory one-to-one replacement, no inherited old Code Structure Proposal PASS, no zombie old closure. Idempotent repeat must not duplicate IDs or writes.
- **BP03-T5:** Exclusive obsolete work branch may be **logically** retired with exact ref/head and history preserved. Never auto-delete a Git branch or retire shared/default/main/release/integration branch; shared-branch obsolete work claims retire without changing unrelated work. Distinguish deployed plugin runtime from dev/source branch.
- **BP03-T6:** Reuse GSA's existing LLC58 plan-change intent, Job/Task RETIRED, Run/cursor settlement and source-branch retirement. Extend only actual missing scope-wide coordination. Negative tests follow R-01–R-20 including delayed callbacks, mixed completed/active work, restart and client schema gaps.

**PASS:** Changed scope safely fenced/retired and freshly reconstructed; unchanged work continues; no false old PASS, no old READY/IN_PROGRESS zombie; real-host effects clearly verified or UNVERIFIED. Treat this large Pack as a **comparison outlier** if necessary, not a reason to game a context chart.

### CX-02 / GSA2 — Reversible Harness duplication optimization

#### GOAL
Measure and remove actual repeated **delivered** shared-role or MCP initialization guidance without removing mandatory instructions on independently entered tool surfaces.

**MODIFY:** GSA1's actual reviewed Agent/Harness module and startup instruction producer, selected only after runtime evidence; **REUSE_AS_IS:** established role/skill mapping, public request contracts and meter. A mere duplicate sentence in source does not prove redundant host-delivered model context. Preserve Advisor, Human authorization, CAS/readback, correct role independence, error and stopchat behavior. See `TECHNICAL-DETAIL-PROPOSAL.md` Section C.

**PASS:** safe GSA-owned payload/call reduction and equivalent behavior; otherwise **REVERT/SKIP GSA2** while retaining modularized GSA1 baseline.

### BP-04 — Coder knowledge, solution clarification and DEV/OPERATION file semantics (Bootstrap M4, §6B/E4/6I)

#### GOAL
Coder makes normal engineering decisions without inventing professional logic or user-artifact identity/version gates.

Tasks:
- **BP04-T1:** Coder is a Software Engineer, not the Domain Expert. At Goal/Job-Pack level, open actual Tasks, full expert decisions and caller/host source before design. Ask once only for genuinely missing consequential host/domain/operational rules, never for ordinary class/library/variable decisions or previously answered facts.
- **BP04-T2:** Add focused `solution-clarification` plus file-lifecycle knowledge via existing progressive role-skill route rather than always preloading a large universal policy.
- **BP04-T3:** Classify by **phase and purpose**, never extension or author: DEV internal source/control records may use Git SHA/CAS; OPERATION User-produced DOCX/DWG/DWF/DWT and CadGPT Temp/Custom Job `JOB.md`/LISP/Python use User Open/Edit/Save/Export/Import/Load lifecycle; application/host-generated AutoCAD BAK, DWL/DWL2, cache/Run bookkeeping follow verified native design. An internal Run ID does NOT become the user Job's GUID or file content identity.
- **BP04-T4:** Same intended user Job remains usable after edit, move, export, re-import and same-name revised LISP LOAD as allowed by established workflow. Don't force an original SHA/version/promotion/registry; don't blindly overwrite same-name user data when collision rules are unspecified. Ask User only for consequential unresolved file conflicts; do not ask about normal internal backups. BAK may be recoverable and is **not** the same as clean-close DWL/DWL2.
- **BP04-T5:** Keep existing source-write Git CAS, Project Memory auth and legitimate tool security; tests prove DEV safeguards intact while avoiding fabricated OPERATION restrictions. Do not edit CadGPT itself as part of this GSA Pack.

**PASS:** Coder proposes host-native file behavior and asks only necessary questions; neither DEV controls nor User-owned operational lifecycle is corrupted.

### BP-05 — Descriptive Pre-Code Proposal (Bootstrap M4, §6B/E5–E7)

#### GOAL
Before authorized application code changes, Coder describes the actual Task-by-Task technical work once, without writing source stubs or a separate technical plan/registry.

Tasks:
- **BP05-T1:** Using already approved Plan/Tasks and full decision refs, inspect real existing code/callers and draft one Task/Goal-owned Markdown proposal with **per-Task** sections, not multiple permanent architectures.
- **BP05-T2:** Each Task specifies exact intended file path and `CREATE | MODIFY | REUSE_AS_IS | KEEP | REMOVE`; actual vs proposed functions/classes/contracts/gates/interfaces/callers; inputs/outputs, integration/call graph, dependencies, observable test and explicit exclusions. For user-owned file Tasks include current Save/Load/Export/Import/overwrite semantics and sources.
- **BP05-T3:** A tiny independent Task has a compact proposal. Do not produce empty code stubs, .ts/.py/.lsp/.cs modules, test source or a new component Registry merely to draw the proposed structure.
- **BP05-T4:** Correctly separate the *descriptive proposal* from optional actual code skeletons implemented only after review; avoid repeating Human interviews. Document unknown material host rules clearly.

**PASS:** Brownfield proposal names real existing call sites and accurately marks proposed symbols; no application source files created in Pre-Code; coverage complete for each affected Task.

### CX-03 / GSA3 — Reversible tool and skill response optimization

#### GOAL
Reduce observed unnecessary instructions/metadata **inside actual GSA-owned tool output**, not redesign progressive catalog/loading already implemented.

**MODIFY:** chosen high-frequency tool handler(s) in their real GSA1 owning domain modules and/or skill metadata when evidenced. Preserve exact `structuredContent`/`content` compatibility, `external_steps`, validation errors, permissions and follow-up. **CREATE** one reusable formatter only if actual repeated consumer needs justify the extra file. See `TECHNICAL-DETAIL-PROPOSAL.md` Section D.

**PASS:** verified net reduced response payload without lost workflow or extra rereads; otherwise **REVERT/SKIP GSA3**.

### BP-06 — Whole-related-Task Reviewer, disproportional complexity (Bootstrap M5, §6C/E8–E10)

#### GOAL
Review **all related** Task proposals together, eliminate duplicated technical machinery before code, and surface disproportionate system-wide risks instead of blindly approving a technically feasible proposal.

Tasks:
- **BP06-T1:** Reviewer reads whole interacting proposal, complete accepted decisions, exact Plan/Tasks and verified existing source/callers; a single-Task Reviewer cannot claim cross-Task PASS on unseen Tasks.
- **BP06-T2:** Detect duplicate files, services, gates, contracts, unconsumed interfaces, dependency cycles, shared-state/host-binding conflicts; demand reuse of existing capability where sufficient. Do not force a global Registry or Coder-maintained component list.
- **BP06-T3:** Explicitly review **SMALL FUNCTION → BIG SOLUTION → LARGER SYSTEM IMPACT**. If known simpler design exists, CHANGES_REQUIRED; if technically possible but materially disproportionate/high-risk and no safe adequate solution is established, HUMAN_ESCALATION **before code**. Human may accept bounded direct host risk, use supported UNDO, perform a manual Lisp load/test, reduce scope or drop the feature.
- **BP06-T4:** Review AutoCAD example correctly: a second DWG in the *same process* is not crash isolation and can disrupt CadGPT binding/other Jobs; UNDO is not process-crash or external-file rollback. No invented sandbox/testing service for one Lisp. Manual outcome remains PENDING/UNVERIFIED until actual test.
- **BP06-T5:** Derive a reviewed file/function/interface reference/list **AFTER Reviewer PASS** from the corrected proposal; no new technical Registry. Material design changes go through same review; ordinary code details remain Coder choices. Include DEV/OPERATION artifact fidelity.

**PASS:** One combined proposal is simplified before code; unsafe disproportionate case correctly escalates without forcing Human to choose internal implementation details.

### BP-07 — Tester on-demand `simulate` skill (Bootstrap M6, §6H H0–H3/H6)

#### GOAL
Tester verifies the *real user command* and every causal child-flow it triggers, rather than assuming passing internal function tests means the user action works.

Tasks:
- **BP07-T1:** Load supplied full `simulate.skill` (SKILL.md + five references) if actually accessible; if only a description is available, mark skill-content gap and obtain authorized source before claiming full implementation. Integrate as a **Tester skill on demand**, not a Simulation Job, new role, Contract or state. Use existing Tester report storage.
- **BP07-T2:** Tester first designs expected behavior from User/Criteria/App Brief without reading implementation (skill's Designer phase), freezes expected oracle, then traces actual public UI/command/connector invocation through router, Job/Run, callbacks, state, queues, persistence and host. Designer/Tracer are phases **inside Tester skill**, not separate mandatory agents.
- **BP07-T3:** Trace *all* child flows from one user input: causal parent, why launched, legitimate fan-out vs accidental duplicate, waits/dependencies, exclusive CAD capability vs concurrent SYSTEM work, timeouts/disconnects, leases/locks and accurate outward DONE/FAIL.
- **BP07-T4:** Proportionate scenario ladder: S1 normal user entrypoint; S2 sequential create→run→save/reopen; S3 deterministic repeated/interleaved/two-chat operations; S4 adversarial malformed/duplicate/cancel/close/reconnect or stale Plan. T0–T6 skill levels remain primary; don't invent another mandatory taxonomy. Use actual host when available, otherwise label `STATIC`, `SIMULATED`, `REAL_HOST_UNVERIFIED` accurately. Never fabricate UI interaction or destructive stress-test a production CAD drawing.
- **BP07-T5:** Model one user action spawning two conflicting CAD flows and demonstrate whether unintended flow was started; mock PASS never implies native AutoCAD geometry, save or crash isolation.

**PASS:** Tester evidence starts from actual user entrypoint, covers expected vs actual all child flows, and accurately separates mock vs host verification. Ordinary small tests need not load this skill.

### CX-04 / GSA4 — Reversible context selection by Role/Task/Phase (conditional)

#### GOAL
Reduce irrelevant detailed guidance for a *verified* active Job scope without breaking an Agent's complete mandatory role contract.

**REUSE_AS_IS:** current GSA1 agent module and role-specific `renderHarness(role)`. `get_agent_harness` currently accepts **only `role` and `mode`**; do not invent task/phase inputs or new context stores. **CREATE/MODIFY conditional:** a small pure selector only after a real authorized caller can provide trusted task/phase evidence; otherwise **NO_BUILD**. Test Reviewer isolation, Tester simulate, Direct Agent, missing/stale metadata and role permissions. See `TECHNICAL-DETAIL-PROPOSAL.md` Section E.

**PASS:** safe reduction at actual source-pinned runtime vs retained baseline; otherwise **REVERT/SKIP GSA4**.

### BP-08 — Three full repair/retest cycles and advanced causal debugging (Bootstrap M6, §6H H4–H6)

#### GOAL
Stop endless local patches for one unresolved defect; use independent Tester replay and deeper first-causal-event analysis after at most three complete failed fix/retest cycles.

Tasks:
- **BP08-T1:** Track attempts per **defect + user-visible symptom + reproduction**, not per Job ID/chat/new bug title. A cycle counts only an authorized Coder patch followed by an independent Tester rerun of original user trigger and affected regressions; CI green or Coder self-check isn't Tester PASS.
- **BP08-T2:** After first/second failed full retest, retain facts and adjust cause; after third FAIL, **STOP ordinary fourth patch**. Severe architecture/race evidence may trigger advanced investigation earlier. An unavailable host is UNVERIFIED, not Product FAIL or a counter reset.
- **BP08-T3:** Invoke a genuinely available native systematic-debugging / focused advanced-root-cause skill, not a permanent bug fixer agent. Rebuild full input→entrypoint→all sibling child flows→wait/resource/state/host path; run bounded discriminating experiments; identify first divergent causal event and classify wrong-tool/client-schema/stale deployment/host/mock/product fault.
- **BP08-T4:** Output Advanced Defect Report with 3 attempts, exact revisions, scenario seeds, graph/timeline/wait relationships, hypotheses and evidence/confidence, lowest-risk correction, regression plan and remaining UNKNOWN. Architecture changes require an updated descriptive proposal and combined Reviewer, not immediate unsupervised patch number four.
- **BP08-T5:** Verify continuation/new chat does not erase defect attempt history and that unrelated genuine bugs are tracked separately. No new failure-handling database, Job state or Human approval on routine debugging.

**PASS:** Same defect after third real failed retest cannot blindly receive a fourth patch; precise escalation and eventual authorized remediation route are observable.

## Phase P2 — Relative context comparison and integrated acceptance

### GOAL
Evaluate whether context efficiency *trends better while useful code is shipped*, using lightweight size normalization and honest quality evidence, then provide a safe staging/release recommendation.

### P2.1 Per-Pack measurement and approximate normalization

For each **completed paired milestone with valid candidate run** (or a separately labeled full-Pack `FUNCTIONAL_REPLAY`) record:

- `pack_id`, start/end GSA source commit, exact meter/runner version, execution environment, selected runtime surface (`SOURCE_TEST`, `STAGING`, `PRODUCTION`), observed GSA tool call count and per-command character/UTF-8 byte/token **estimates**.
- `observed_payload_total` = sum of measured model-facing GSA tool response sizes *for calls actually captured*; label missing calls/host-only state UNKNOWN. Estimate tokens with the same chosen heuristic across all Packs, explicitly a proxy, not true ChatGPT token accounting.
- From source Git diff for the Pack's own commits (excluding context-patch commits): `added + deleted` lines of human-authored application source, tracked separately from tests, docs, generated files and formatter-only/moves. Include files/modules touched, errors/rework/follow-up calls and functional PASS/FAIL. **Do not present LOC as objective complexity**.
- For new development with actual authored application-code changes, `estimated_context_per_1000_changed_code_lines` = `estimated_context / changed_code_lines × 1000` when meaningful. For `FUNCTIONAL_REPLAY` with no new source changes, the LOC-normalized measure is **N/A**, not artificially divided by 1. For documentation/skill-heavy Packs, **application-code LOC is not a valid denominator**; compare their appropriate authored instructional/content changes separately and mark the code-normalized metric N/A, not artificially huge savings.
- Post-hoc workload adjustment: if A changes 15k code lines and B 25k, B is approximately 1.67× A by that **one proxy**. A raw context difference must be interpreted alongside this size difference. Reused code, refactoring/moves and domain complexity can invalidate linear estimates. No mandatory "same Job twice" replay, statistical model or exact matching.
- Log `status` and quality: goal achieved, main regression result, wrong tool / lost instruction / retry when visible, meaningful risk or major complexity difference. **Do not turn a small-code task with many critical decisions into a false efficiency win merely by dividing by LOC**.

Minimal journal row schema: `milestone, job_pack, base_sha, control_branch, candidate_branch, retained_runner_sha, candidate_runner_sha, per_branch_result_sha, candidate_sample_validity, invalidation_reason, per_branch_context_estimate, per_branch_calls, per_branch_code_diff, chosen_output_branch, verified_integration_sha, inferior_branch_deleted, context_KEEP_or_REVERT, new_retained_baseline_sha`. Aggregated per-Pair `before/after` notes are enough. Do not save raw private chats, secrets or full external Job payloads.

### P2.2 Same-Job comparison, invalidation, branch disposal and rolling baseline

1. Prepare exactly TWO named auxiliary source branches for the CX milestone, both from one base SHA. Run the same full approved Bootstrap Job with retained GSA on CONTROL and CX candidate on CANDIDATE, using separate isolated executable GSA runner builds.
2. If candidate has **no GSA runtime error**, both context samples are eligible on the **first full Job**; no compulsory additional shakeout. Review both implementations and compare the context proxy, calls, tests and quality.
3. If candidate needs a GSA-context or runtime repair **during that Job**, invalidate its context sample, keep evidence and legitimate feature progress, and repeat the full Job or the next full Pack safely on the **same two branch workspaces** from a verified equivalent starting point. A change of runner source SHA within a measurement invalidates it.
4. Prefer same-workload raw payload/call comparison. For different new Jobs, estimate relative work from real changed-code lines and caveat domain difficulty; for completed-Pack `FUNCTIONAL_REPLAY` with no new code, LOC = N/A. No claims about exact ChatGPT host tokens.
5. Independently compare two code outputs against approved decisions, correctness, acceptance, testing, maintainability and simplicity. Select the better code branch irrespective of context version; integrate the selected source into dev and verify.
6. After comparison and successful integration, **delete the inferior auxiliary branch** and verify deletion, so later merge never needs to consider both competing results. Milestone records the selected output, deleted branch, review/test evidence and integration commit. Do not retain the losing branch solely for later merger comparison or create additional test branches.
7. Separately decide **KEEP candidate CX** if correct and beneficial, or **REVERT current CX only** (not previously retained CX groups or chosen Bootstrap feature code). Update the **rolling** retained GSA revision and eligible measurement. Next milestone creates exactly TWO new auxiliary branches and compares its new candidate against this winner.

**Safety:** no unreviewed source deletion, protected/default branch removal, lost approved user data or uncontrolled duplicate Git/CAD side effects. Compare safe identical input states. A bug-repair run is valuable for functional progress but is **not** a valid context-efficiency observation.

### P2.3 Functional coverage and no-drift checks

- **Full source reference:** Bootstrap draft v7 §§6A–6I + operational specification E1–E12, accepted decision coverage CD-01–CD-58, retirement R-01–R-20, simulation S-01–S-18 and file-lifecycle F-01–F-20. Each requirement is mapped to one BP owner, source revision, behavior oracle and observed outcome. A heading-only mapping is a coverage FAIL.
- Preserve GSA's original Node/Deno test contracts, current Criteria/Advisor trigger, Planner→Reviewer continuation, exact branch/repository ownership, auth, CAS/readback, Run/cursor/fence, role-isolated Reviewer/Tester, stopchat/recovery and tool-schema compatibility. Include negative controls, not just string presence tests.
- Independent Tester must verify actual end-user triggers in scenarios justified by risk. A mock/tool-present outcome is not real-host PASS. Real-project E2E can remain marked PENDING/UNVERIFIED where Human previously deferred it, not an invented blocker or a fabricated successful test.
- Run the exact executable tests in `.github/workflows/gsa-next-logic.yml`, new test files explicitly added to invocation/CI if created, and `deno check`. If hosted CI fails without executed steps, record ENVIRONMENT_UNVERIFIED separately and use an authorized exact-source alternative.
- If the latest Bootstrap draft changes while implementation is ongoing, compare source SHA and accepted decisions; incorporate only reviewed changes, do not allow silent scope expansion or unexpected bootstrap installer work.

### P2.4 Release / rollback

Deliver a compact `BEFORE-AFTER.md` with **two-branch milestone source selection/deletion, rolling GSA runtime winners, excluded bug-repair runs and KEEP/REVERT for each CX group**, per-Pack and per-CX results; source and accepted-decision trace; functionality PASS/FAIL/UNVERIFIED; changed paths; rollback/branch refs; actual isolated staging/client compatibility if exercised; and explicit `RECOMMEND_MERGE` / `NO_GO` / `NEEDS_E2E`.

**Never merge into main or trigger production/Vercel/Supabase deployment merely for these experiments.** GitHub development-branch writes do not change production tools. Release is an explicit later Human decision and requires then-current source, permissions and independent evidence.

## Technical code structure authority — detailed proposal and review

### GOAL
Define a coherent, source-validated implementation architecture **before assigning final milestone files/Tasks**, without producing placeholder application code or assuming splitting itself saves model context.

The detailed design, including **GSA1 candidate cohesive-domain module file paths**, actions `CREATE/MODIFY/KEEP`, all 55 existing MCP tool owners, actual function/handler names, callers and import edges, thin `index.ts` wiring, 932-line selftest extraction, test migration, and GSA2–GSA4 targeted changes, is in `TECHNICAL-DETAIL-PROPOSAL.md`. The alternative comparison, review refinements and remaining execution evidence are in `TECHNICAL-DETAIL-REVIEW.md`.

**Design stage:** Review whether closely coupled files should be grouped into one coherent module; verify actual references, callers, input/output types and circular-import risk. The agreed structure can be adjusted before code based on source evidence, not code-line quotas. Reviewer approves logical architecture; no speculative declaration of saved tokens or time.

**Implementation stage (only after source authorization):** migrate each coherent module, reconnect actual imports/exports to entrypoint, run typecheck/CI/negative oracles and real isolated runtime compatibility; fix lost registrations before the next module. No full source-history control plane or additional Agent/Job registry.

**Measurement:** GSA0→GSA1 source-navigation and tool measurements on **actual paired Bootstrap development work**. GSA1 remains required if correct even when early measurements are worse. Subsequent GSA2–GSA4 are optional and reversible; later co-change evidence may justify local merge/split of GSA1 modules within a reviewed optimization.

## Ownership, sequencing, acceptance and STOP rules

### GOAL
Keep implementation bounded and safe while ensuring all Bootstrap behavior, not merely feature names, is represented.

- **Planner:** pin source revisions, preserve accepted human/professional solutions and scope, assign the existing Jobs/Tasks legally, integrate new work within the reviewed Project plan; cannot approve source writes or Criteria changes on Human's behalf.
- **Coder:** write only approved owned source, prepare Task-level descriptive structure before implementation when this feature becomes active; apply smallest verified solution rather than redesigning project-wide architecture.
- **Reviewer:** independent planning/source/design review, whole-related-Task check, error/authority negative testing, proportionate solution and fidelity; Reviewer does not code. Do not start Critic Reviewer by default unless direct Human `cr/crl` or preauthorized milestone.
- **Tester:** independently construct user-entrypoint oracles and test actual flows; run on-demand `simulate`; separate MOCK / SOURCE / LIVE HOST and RETIRED/ACTIVE evidence. Tester cannot substitute a PASS by repeating Coder assertions.
- **User:** decides material WHAT/WHY/operational scope, chooses a manual verification alternative if appropriate, separately authorizes implementation and later release. Technical Advisor only at its existing approved Criteria-change trigger.
- **Dependencies:** BP-02 depends on BP-01 DEC records; BP-03 on current Plan/Run lifecycle evidence and BP-02 decision links; BP-05 on BP-04 correct engineering/operational boundary; BP-06 on all relevant BP-05 proposals; BP-08 on BP-07 Tester behavior and actual defect attempt history. **GSA1 module design (technical proposal and whole-review) precedes code extraction and GSA2–GSA4; GSA1 is mandatory KEEP after verified parity despite worse initial efficiency.** **Group BP requirements into substantive Jobs** instead of forcing one Job per section. Each CX has its own candidate smoke/repair, **discarded dirty Job result**, then **clean whole-Pack measurement and KEEP/REVERT** before the next CX; repeat the last Pack safely whenever there is no new one. Skipping a CX group does not block functional work.
- **Stop/escalate:** actual security/correctness regression, unowned write path, unsafe old Run/source state, poor measurable benefit, repeatedly more rework/tool calls, wrong version/role, or Small Function → Big Solution → Larger System Impact. Offer reduced/manual user workflow when proportionate; no invented sandbox, new lifecycle gate or background agent to "fix" a minor feature.
- **Deferred:** Bootstrap v7 B1–B5 Lead/Worker installer, native local QwenCode/Continue hooks, model orchestration, multi-worktree provisioning, optional 27B skeleton/small-model workflow. Reassess only after functional stability and explicit separate scope decision.
- **Criteria discrepancy stays visible:** pending explicit formal reconciliation of meter-first and new Bootstrap functional scope against GSA's currently approved research-first-only Criteria. This plan is **not** Criteria approval; do not silently claim Bootstrap's DRAFT implements an authorized GSA feature.

### Minimal completed-pack report

For every Pack, report in human-readable form:
1. Exact Goal, user-observable function and accepted Decision references.
2. Source before/after commits, changed GSA files, code added/deleted separate from test/docs.
3. Per-command/Pack measured GSA payload estimate and observed call count.
4. Test observations, independent Reviewer/Tester result and unverified host limitations.
5. Context candidate before/after (when applicable), directional result, larger-system impact and disposition KEEP/REVERT/SKIP.

**Final acceptance:** GSA1 is retained after functional parity and measured in real source-development workflows; GSA2–GSA4 each have independent evidence-based KEEP/REVERT, and actual paired-work measurements remain separate from paper design review. GSA functional behavior is source/host-evidence-grounded for the approved adopted scope; the compact meter reports reasonable relative trends over more than one real functional Pack; no mandatory authority/role/Job correctness is traded for shorter context; `main` and production unaffected until a separately authorized release.

## CORRECTED EXECUTION AUTHORITY — Two Pre-Code proposals, then coordinated rolling milestones (2026-10-25)

### GOAL / precedence / current state

There are **TWO parallel development plans** with separate outcomes: **U = Bootstrap Functional Update**, to implement actual features missing from GSA relative to Bootstrap; and **R = Context/Source Refactor**, to measure and optimize GSA0 → mandatory GSA1 → optional GSA2/GSA3/GSA4. Run real U Jobs as the workload with which R versions are assessed. **Neither plan is subordinate to the other.** Preserve BP-01…BP-08 substantive functional specification, and the previously reviewed GSA1 source design.

**Pre-code order is mandatory for BOTH tracks:**
1. **U-pre-code:** Read current Bootstrap repo requirements AND live GSA source/behavior; produce a **detailed Functional Update Technical Proposal** describing missing/partially implemented/existing features, per-functional-Job file operations (CREATE/MODIFY/REUSE_AS_IS/KEEP/REMOVE), actual call sites and proposed ownership, data contracts, dependencies, acceptance tests and compatibility. Subject the *whole related set* to Coder nomination → Reviewer challenge → correction loop → review PASS. Do not use the high-level BP plan in place of a file-level proposal or treat a Bootstrap draft as proof of GSA implementation. Keep functional proposals descriptive; do not create application-source stubs.
2. **R-pre-code:** Review source-grounded GSA1–GSA4 detailed Refactor Technical Proposal, covering exact module/function/tool ownership, test adaptations, context changes and observable parity. **Existing** TECHNICAL-DETAIL-PROPOSAL.md (blob be5e6f86fe8881cbcd6634dfc1c6bedf3ae0517c) and TECHNICAL-DETAIL-REVIEW.md (blob cde0a9afff4958fc56daccc82192f18d8979f333) already record **RL PASS FOR DESIGN SCOPE**. **Do not start a fresh review** unless relevant source or proposal materially changes; review only the changed delta then. R-pre-code also defines the meter/measurement contracts below. RL PASS does NOT mean GSA code/runtime/measurements passed.
3. **Coordinated planning only after BOTH detailed proposals have passed their appropriate technical review.** The Planner creates/updates separate U and R implementation milestones/Tasks **and one integrated interleaving schedule**, assigning which eligible U Job becomes the real field workload for each R version. An illustrative A/B/C/D order is not a mandatory fixed mapping. Do not create a separate technical architecture or redundant approval bureaucracy merely for coordination.
4. Verify normal existing Criteria/authority alignment before any code implementation. The approved GSA Criteria has been reported as narrower than some proposed functional upgrades; neither a reviewed proposal nor this plan self-authorizes Criteria changes. Advisor activates **only** at the established Human-authorized Criteria-change procedure. Do not edit Criteria, app source, create comparison branches, merge or deploy as part of this plan-only change.

**This corrected section overrides conflicting older scheduling/measurement instructions elsewhere in this same file**: notably, any prescription that every context candidate must rerun the same U Job solely for metric collection, that comparing different U Jobs requires identical raw context totals, that milestone synchronization precedes the two technical reviews, or that a dirty GSA sample must be repaired by replaying the previous U Job. Older BP acceptance and reviewed R source-ownership details remain valid.

### Independent milestone construction AFTER both Pre-Code reviews

**U milestones and tasks:** each real missing Bootstrap feature cluster becomes a substantial U Job/Pack with goal, approved decisions, actual file changes, dependencies, end-user entrypoint, integration and independent Tester acceptance. Build in logical U order. Do not split U Jobs into microtasks merely to improve benchmarking. U Job quality must stand on its own.

**R milestones and tasks:** CT-00 meter, historical original **GSA0** baseline, mandatory behavior-preserving **GSA1** modularization, and then separately reversible **GSA2** (proven delivered Harness duplication), **GSA3** (proven Tool/Skill response excess) and **GSA4** (Role/Task/Phase only with trusted real inputs; otherwise NO_BUILD). Each R version has source file tasks, parity/security tests, meter protocol and KEEP/REVERT criteria. GSA1 remains the code foundation after parity regardless of whether its measured context is initially worse.

**Coordinated milestone schedule:** selects the **next available, substantive U Job** as an R measurement opportunity, without making U delivery contingent on an arbitrary measurement. If U Jobs run out, record an absence of natural comparable workloads; a replay is optional only if safe and justified, never silently forced. Job-specific development dependencies outrank benchmarking convenience. A single integrated report combines U implementation quality and R efficiency findings, while keeping their decision ledgers distinct.

### U Job code competition: exactly two temporary branches; pick best immediately

For each U Job A, B, C, D…:
1. Pin the same verified **feature code base SHA** and accepted functional task. Create exactly TWO auxiliary feature-output Git branches (CONTROL/CANDIDATE); note actual names and source SHAs. They are **not** GSA runtime versions. Run **two independently authored implementations** of that SAME U Job, one on each branch. Candidate and control runners may be different GSA revisions according to the interleaving schedule; after a failed R sample, U's need for two valid implementations remains a separate concern.
2. Reviewer/Tester compare the two actual feature implementations for functional correctness, decision fidelity, safety, simplicity, integration, maintainability, side-effects and regressions. A candidate generated with fewer tokens does NOT automatically have better code. Failed implementation must be fixed/assessed honestly; a GSA measurement error alone does not automatically invalidate otherwise correct U output.
3. **Immediately after both implementations have been assessed**, select only the better approved feature code; integrate into the SINGLE canonical development line and verify exact integration commit/readback. Delete the losing auxiliary branch using a real Git **branch-ref** deletion action and verify absence. A file-delete action is not branch removal. If capability unavailable, record CLEANUP_UNVERIFIED/BLOCKED, never pretend completion or delete main/shared/protected branch.
4. Next U Job starts from the **already integrated winner**, never from accumulating divergent A1/A2/B1/B2 versions. The two-branch requirement is per U Job, not permission to keep dozens of old candidate branches until release.

### R sequence, sample validity, error recovery and rolling baseline

**After CT-00:** implement a minimal source/test meter (e.g. test-lab/context-efficiency-metrics.test.cjs and CONTEXT-METER.md), with reproducible observed GSA-owned model-facing UTF-8 bytes/characters/approximate token proxy, actual calls/retries, source navigation opens/bytes/search/hops/rereads, and source/version/environment labels. Host-private ChatGPT tokens, hidden thinking and missing event streams are UNKNOWN; no assertion of exact total context. Synthetic meter fixtures verify the meter only; **not** the real baseline.

**GSA0 and Job A:** Run original GSA0 to implement U Job A; collect clean measured sample B0 with exact GSA runner SHA, U Job ID, quality PASS, source code size and complexity rubric. **B0 is the first real baseline**, not a static text constant.

**GSA1 and Job A (second U implementation):** After staged modularization passes functional/security parity, use GSA1 to produce U Job A's independent second implementation; measure same Job where possible. If GSA1 runs cleanly, compare to B0, independently select best A code and promptly clean loser branch. If GSA1 has a **GSA-caused defect** (wrong tools/instructions, crashes, wrong workflow, missing permissions, incorrect response, mixed runner SHA, etc.), repair GSA1 and mark that GSA1 context sample **INVALID**. The next **new real U Job B** can be used for a new valid GSA1 sample; **do not require replaying Job A** to measure. The U Job code decision remains independent.

**GSA1 retention:** Once parity is genuinely verified, GSA1 is **MANDATORY KEEP** even if context worsens. If credible normalized evidence shows GSA1 more efficient, promote its clean reference to the **single active baseline B1** (B0 stays as archived history only). If GSA1 is worse or evidence inconclusive, keep its **code** as mandatory foundation, but do not claim a context improvement. Record historical B0 for honest comparison and designate the current running reference transparently; distinguish "retained architecture" from "proven most efficient." No promotion of an optional version on ambiguous evidence.

**GSA2 onward:** Build GSA2 on **retained GSA1**; run it on the next available real Job (e.g. B). If the GSA2 runtime/workflow is faulty, FIX GSA2 and **INVALIDATE the dirty GSA2 context sample**; use **the next real Job C** for a new full clean sample with pinned repaired GSA2 SHA. Do not splice pre-/post-fix calls or treat a partial failed Job as a valid observation. Compare clean result to the **one currently active retained baseline** via workload size and complexity adjustment. KEEP GSA2 only if function/security intact and improvement credible. Otherwise REVERT **only GSA2 context changes** to retained GSA1, leaving superior U feature code intact. Repeat analogously for GSA3 and conditional GSA4; after a KEEP, new clean sample becomes the next sole rolling baseline, and rejected experiments do not contaminate successors. History remains recorded but no multiple competing active baselines.

**Same-job vs cross-job:** For U Job A original GSA0 vs GSA1, same U Job (two implementations) is especially comparable. For later GSA2 sample on B vs retained GSA1 reference on A or another earlier U Job, **different Jobs ARE allowed**. Never conclude from raw absolute context alone; always normalize and qualify differences, as specified next.

### Exact cross-Job normalization protocol — size × complexity, with uncertainty

**Goal:** estimate relative context efficiency when *different* substantive U Jobs are used, without presenting a subjective score as a precise actual ChatGPT token count. Preserve raw evidence, and prevent after-the-fact weights chosen to make one GSA version win.

**Data for EVERY eligible sample, before arithmetic:**
- Stable job/runner/env identifiers and exact commit SHA; tool-visible context estimate C in a single stated unit and heuristic, observed GSA calls and source-navigation metrics; coverage/missing-host observations; code quality and feature acceptance.
- **L = meaningful hand-authored application-code lines changed** in that U Job, counted consistently from its own feature commits as additions + deletions, excluding test files, docs, generated outputs and pure formatting; pure file moves/renames counted separately, not spuriously as new code. Store added/deleted and test/doc counts too. **L is a rough effort proxy, not a full measure of problem complexity.**
- **K = rubric-scored relative complexity** of the U Job. Lock the rubric and Job complexity assessment **before looking at that Job's measured context C** or candidate outcome; use the same assessor rubric for baseline and candidate. Factors explicitly inspect: (a) changed domain/control-flow/branching and state transitions, (b) inter-module dependency/integration and external host boundaries, (c) concurrency/error/recovery/security/side-effect risk, (d) user-facing acceptance breadth and meaningful verification difficulty. Rate each 0 (ordinary), 1 (moderate), 2 (high) from source-grounded evidence with a short rationale; record the sum D = 0…8 and use **K = 1 + D/8**, bounded 1.0…2.0. This is an INITIAL REVIEWABLE HEURISTIC, **not a scientifically calibrated universal law**. Keep identical weights across comparison; do not tune after seeing the context result. If domain-specialized jobs need a different rubric, review and freeze it *before* a fresh eligible sequence, do not silently recalculate old results.
- Work proxy **W = L × K**, and normalized efficiency **E = (C / W) × 1000** (estimated context units per 1000 weighted code-change lines), **only when L > 0 and comparable meaningful authored code exists**. Lower E means better efficiency conditional on rubric assumptions. For docs-only, proposal-only, skill-content-heavy or read-only replay with no meaningful application-code delta, **E = N/A**, never force L=1 or invent LOC. Use separately comparable output artifact units or return INCONCLUSIVE.
- Across two Jobs A/B, calculate **R = E_candidate / E_baseline**, estimated improvement **I = (1 − R) × 100%**. Also display **raw C and L, K breakdown, W, E** on each side and source-navigation / quality differences. This permits Job B to consume *more total context* yet achieve better workload-adjusted efficiency. **Same unit/heuristic and observation surface required**: do not compare a SOURCE-TEST-ONLY number to a real-client number as if equal.

**Worked illustrative example (not an empirical result):** Job A baseline: C=100,000 proxy units, L=1,000, K=1.0 → W=1,000 → E=100,000. Job B candidate: C=150,000, L=2,000, K=1.2 → W=2,400 → E=62,500. Relative modeled improvement (1 − 62,500/100,000) × 100% = **37.5%**, *conditional on chosen workload proxy*, despite candidate consuming more raw context. Do not call this 37.5% actual ChatGPT token reduction.

**Safeguards and decision:**
1. Recalculate comparison under at least **low/central/high defensible complexity values** for both Jobs, documented *before* deciding KEEP. Record if reasonable K changes reverse the sign or erase the improvement. Do not change C or hide outlier rework.
2. If K-sensitive, line-count-distorted by refactoring/moves, denominator too small, error/coverage mismatch, meaningfully different task kind, or feature code quality regressed, report **INCONCLUSIVE / INVALID** as appropriate. A single favorable central estimate does not override the safeguards.
3. **KEEP optional R version** only if parity/safety PASS AND normalized result shows a reasonably robust improvement with comparable observation and no material regression/rework. **REVERT** if there is credible evidence of worse or no meaningful efficiency after adequate valid comparison. **INCONCLUSIVE** means don't assert winner; defer judgment to next natural U Job without fabricating synthetic work. A version must not be declared faster based on LOC arithmetic alone.
4. GSA1 exception: parity-gated **KEEP regardless of E**, but only advance its **efficiency** reference on supported improvement. Maintain ONE active comparison baseline for the next optional candidate, with explicit confidence and historical trace.
5. If distinct Jobs differ grossly in domain reasoning while changing few lines (or large mechanical refactor inflates LOC), do NOT force a spurious number. Use observed source-navigation, integrations, follow-up calls and task evidence to explain limitations or hold decision.
6. Confirm GSA candidate GSA-caused bug means sample **INVALID**, even if feature output eventually repaired; measure next clean U Job. A sample after a new runner SHA starts a fresh observation, never carries forward earlier partial payload.

**Minimum persisted comparison row:** U job and scope; R version/runner SHA; feature base + two auxiliary branch names; both feature result SHAs/quality choice/integration and loser branch delete/readback; environment/meter SHA/surface/coverage; raw C/calls/navigation metrics; L breakdown; four complexity sub-scores/justification; K and sensitivity interval; W/E/R/I; missing data and sample VALID/INVALID/INCONCLUSIVE reason; retained active baseline reference; R KEEP/REVERT/NO_BUILD decision. Keep concise metrics rather than raw private chat payloads.

### Milestones to instantiate after U and R proposals reviewed

| Planned milestone | Goal | Entry evidence and Tasks | Exit acceptance |
| --- | --- | --- | --- |
| **PC-U** | Complete U source-grounded Technical Proposal + whole-related review | Bootstrap–GSA gap map; accurate file/call/contract/test action for all affected U Jobs; Coder nomination and Reviewer corrections | U proposal **PASS** on design, no code created |
| **PC-R** | Confirm R Technical Proposal + reviewed source grouping | Existing R RL design PASS is reusable unchanged; delta-only review when source/proposal materially changes | R design PASS pinned; not a runtime PASS |
| **COORD** | Plan both tracks after both PCs | Map independent U and R milestones and the next eligible U field workloads; preserve free-running U progress | One integrated interleaving schedule with no invented per-Job mandatory paired rerun |
| **CT-00** | Small context meter readiness | Source observation map; CREATE minimal meter test/docs; CI hook where necessary; explicit unknowns | Deterministic test + reproducible metric schema, **not** baseline B0 |
| **U-A / GSA0** | First real U feature output + initial baseline | Two feature branches from common base; original GSA0 implementation; collect real B0 | Clean B0, U A implementation quality review when both outputs available |
| **R-GSA1 / U-A** | Required modularization and independent A implementation | Reviewed module extraction + incremental tests; other A branch with GSA1 | Parity; choose best A code and integrate; clean sample or INVALID |
| **U-B…U-N** | Continue functional upgrades | Each U Job independently implemented twice, prompt winner integration and losing branch cleanup | Feature functionality quality PASS and single integrated feature code |
| **R-GSA2/3/4** | Candidate context improvement during natural U Jobs | Pre-reviewed R-specific change, pin isolated runner; clean U work sample; normalize across distinct Jobs | Context KEEP/REVERT or NO_BUILD, rolling retained baseline; GSA1 never reverted |
| **INTEGRATED** | Aggregate both tracks without prematurely releasing | Bootstrap feature coverage/tests + validated R comparisons, branch cleanup | Release recommendation only; separate Human approval for main merge/deploy |

**Operational capability checks:** Source Git branches are not executable GSA MCP runner instances. Verify isolated runner routing when implementation begins. Verify actual branch-ref deletion/readback before claiming cleanup. Missing capability is a real execution blocker for that operation, NOT justification to alter the agreed algorithm or invent new permanent gates.

### Pre-code status checkpoint

- **R technical design:** PASS at pinned source/proposal, no redo requested.
- **U technical design:** COMPLETE for design: independent Critic PRE_CODE_TECHNICAL PASS_WITH_FINDINGS, verification `01a17283-ba9c-77bd-ba91-959df6b6a020`, proposal blob `c6cb47deb641efb84e2a3a2bec794b8b96990e69`. This is not implementation authorization.
- **Coordinated implementation milestones:** now concretized in the section below after both pre-code design reviews; milestone design does not imply Criteria/branch-policy/source-write approval.
- **Not performed:** application source edits, execution of U Jobs with two branches, live context measurements, runtime isolation, branch cleanup, main merge, deployment or Criteria change.

## APPROVED-DESIGN MILESTONE COORDINATION — Track U + Track R (2026-10-25)

### GOAL and decision authority

Both Pre-Code designs have their **technical design review completed**:
- **Track U** source proposal: \`BOOTSTRAP-FUNCTIONAL-TECHNICAL-PROPOSAL.md\` blob \`c6cb47deb641efb84e2a3a2bec794b8b96990e69\`, independent **Critic** \`PASS_WITH_FINDINGS\`, verification \`GSA-Projects/projects/01a0f051-4353-7bff-8edf-46be4b44fd2f/VERIFICATION/01a17283-ba9c-77bd-ba91-959df6b6a020.json\`. Minor bounded source verification for original simulate skill and record suitability remains inside implementation Tasks, NOT a new review gate.
- **Track R** source proposal \`TECHNICAL-DETAIL-PROPOSAL.md\` blob \`be5e6f86fe8881cbcd6634dfc1c6bedf3ae0517c\`, review \`TECHNICAL-DETAIL-REVIEW.md\` blob \`cde0a9afff4958fc56daccc82192f18d8979f333\`; **PASS design scope**.
- Both designs are independent: U updates actual missing Bootstrap functions; R improves source architecture/context efficiency. The natural U work is also the real field benchmark for R. Do **not** reduce U to benchmarking Jobs or refactor U by stealth. Avoid revisiting unchanged CR-design PASS.
- **Authorization caveat:** currently approved GSA Criteria blob \`ff45d47435ae4acd5106bf945308fb4f95\` is narrower than proposed U functional features, and Project Memory \`PROJECT.md\` records \`upgrade/planner-evidence-context-efficiency\` while Human directs this document to \`upgrade/gsa-context-efficiency\`. This milestone plan preserves both truths and does **not** self-authorize implementation. Before corresponding source edits, use the established Human/Advisor Criteria procedure when material scope changes, and reconcile existing branch policy. Do not add an extra technical Reviewer or invent a waiver. No application code, auxiliary branch, merge or deploy occurs during this planning step.

**Document precedence:** This section is the **executing milestone/task decomposition** of the corrected two-track decision above. The previous hypothetical milestone table/old same-Pack prescriptions in this document are historical and **SUPERSEDED when contradictory**, but BP-01…BP-08 functional semantics, R reviewed ownership mapping, and workload normalization contract remain authoritative. There is one canonical execution plan, two parallel Tracks, and one coordination schedule, not two unrelated control planes.

### 1. Track U — independent functional milestones, source tasks and test closures

U milestones are cohesive **functional Jobs**. Each has independent business value even if no R comparison can be measured. Order below is dependency-informed, not a forced one-to-one mapping against GSA versions. Source paths are from the reviewed U Technical Proposal: currently \`supabase/functions/gsa-mcp/index.ts\` owns tools/role runtime; after R-GSA1 extraction modify its actual domain module, **not both copies**. Exact current owner readback before every code Task. No invented registry, permanent new agent or forced micro-Job.

| Milestone | Goal / Task grouping (Coder responsibility) | Existing integration boundary | Independent Tester/Reviewer acceptance |
| --- | --- | --- | --- |
| **U-A: Decisions & referenced Planner** (U-01 + U-02; BP-01/BP-02) | UA-01 retain genuine Human-accepted source/rationale/exception in existing authorized Project Memory; optional discussion/Secretary without automatic new Job. UA-02 bind stable decision references into existing Job Plan/Task/Phase records. UA-03 validate revision/coverage and handoff without erasing decisions. | Project Memory; \`job_prepare\`, \`job_revise_plan\`, \`plan_review_record\`, \`milestone_loop_evaluate\`; currently no valid \`type=discussion\`. | Original rationale and negative exceptions recovered exactly after revision/new chat; discussion-only never persists unaccepted decision; missing/contradictory Decision cannot silently PASS; auth/CAS unaffected. |
| **U-B: Scope-wide plan supersession** (U-03; BP-03) | UB-01 identify affected Plan/Phase once at Human-approved plan change. UB-02 inspect completed outcomes, logically RETIRE all unfinished affected Milestones/Jobs/Tasks, make fresh IDs/revisions. UB-03 fence active Run/cursor and reconcile host/branch effects, preserve unaffected work. | \`job_plan_change_assess/prepare/fence_prepare/resume_evaluate\`, \`execution_cursor_*\`, existing Run termination. | Whole Plan + Phase + crossing dependencies; in-progress/delayed/UNKNOWN safely fenced; no \`Run.RETIRED\`, phantom rollback, duplicate IDs, stale PASS or default/shared branch deletion. |
| **U-C: Coder engineering context & user artifacts** (U-04; BP-04) | UC-01 inspect actual current \`coding-loop\` body/host references. UC-02 add focused solution clarification only for missing consequential professional rules. UC-03 distinguish DEV internal source SHA/CAS from OPERATION user-owned files and host-managed artifacts. | \`get_agent_harness\`, \`get_skill_catalog\`, \`load_skill\`, \`ROLE_SKILLS.coder\`, existing skill enum/body. | No unnecessary Human questions, no automatic UUID/SHA/registry for user Temp Job/LISP, valid Git source protection preserved, collision questions only when consequential; no CadGPT code changes. |
| **U-D: Descriptive Pre-Code + final CR** (U-05 + U-06; BP-05/BP-06) | UD-01 produce a single complete per-related-Task file/function/call/source proposal (small tasks proportionate). UD-02 use actual Critic \`PRE_CODE_TECHNICAL\` for whole-related proposal, resolve findings to PASS. UD-03 expose reviewed inventory after PASS; reject duplicative architecture/host risk. | Existing Plan/Job artifacts, \`start_critic_review\`, \`critic_review_record\`, Coder/Critic skills. \`plan_review_record\` remains **Plan review**, not an extra pre-code review. | CR is the independent **last technical** review; all affected callers verified; no empty code stubs, Reviewer-of-Reviewer, new component registry or process-crash safety fiction. |
| **U-E: Tester user-trigger simulation** (U-07; BP-07) | UE-01 resolve actual host-managed \`scenario-tester\` and original full \`simulate.skill\` with five references; mark UNVERIFIED if unavailable. UE-02 adapt on-demand Tester Designer/Tracer oracle and child-flow causality into existing skill route. UE-03 verify simple, sequential, interleaved and adversarial flows. | \`ROLE_HOST_SKILLS.tester\`, \`ROLE_SKILLS.tester\`, current progressive catalog/load plus Tester evidence. | One user action's entire fan-out is traced; CAD capability serialization versus SYSTEM concurrency, reconnect/cancel/save truthfully represented; STATIC vs SIMULATED vs REAL_HOST differentiated, no invented Tester role. |
| **U-F: Three-cycle retest and causal debug** (U-08; BP-08) | UF-01 bind defect identity to symptom+original repro, track Coder patch→independent Tester rerun across handoffs. UF-02 after third full FAIL stop ordinary fourth patch, load current debugging skill and inspect first causal divergence. UF-03 persist advanced defect evidence via existing authorized path, propose lowest-risk correction and replay. | Existing \`RUNTIME_SKILLS.debugging\`, \`run_verification_record\`, Tester/Run/Project evidence; no new defect DB by default. | Exactly three completed unsuccessful patch/retest attempts trigger causal escalation; missing host is UNVERIFIED, different defect separate, no counter reset via chat/Job rename, no blind fourth patch. |

**U close rule:** For **each** substantive U Job, independently generate code on **exactly TWO** auxiliary output branches from the **same** pinned feature-source SHA (not two permanent product lines). Compare entire resulting feature implementation against accepted decisions, tests, maintainability, simplicity and operational behavior. Choose and integrate the better code immediately, verify integration/readback, then delete losing Git **branch ref** and verify absence. The next U Job starts from this **one integrated code line**. Preserve legitimate U output if R candidate's context measurement becomes INVALID. If branch-ref deletion capability is unverified, record cleanup blocker honestly; do not pretend it happened.

**U dependency reasoning:** U-A can expose accepted decisions to U-D but existing decisions can support U-D independently; U-B uses existing Plan/Run state and need not wait for Secretary. U-C should precede U-D Coder-skill behavior. U-E must provide Tester scenario evidence before U-F full-cycle acceptance. No circular U-D technical-review gate for its own design pre-code (current U design CR already PASS).

### 2. Track R — independently deliverable Context/Source milestones

| Milestone | Goal / executable Tasks | Close & disposition |
| --- | --- | --- |
| **R-00: Meter** | R00-1 inventory GSA-owned observable payload/role/tool and source-nav events; R00-2 CREATE minimal Test Lab estimator & \`CONTEXT-METER.md\` with deterministic formula, UTF-8 bytes/chars/token proxy/calls, code file read/search/hops; R00-3 pin meter version and synthetic detection test, CI only where needed. | Reproducible measured proxy/UNKNOWN labels; SOURCE-TEST is **not** GSA0 real Job baseline. |
| **R-01: GSA1 mandatory modularization** | R01-1 capture 55 registrations/schema/order + 98 functions/28 constants and negative test baselines; R01-2 move platform/records coherent low-level primitives; R01-3 move combined project+bootstrap and planning owners; R01-4 move execution/evidence/agent, preserve role text; R01-5 move diagnostics/selftest and browser only if justified; R01-6 thin entrypoint + source-bound tests, imports/typecheck, isolated MCP parity. Use exact reviewed Proposal B0/B0a symbol map. | Preserve external behavior/security, full CI/parity; **KEEP GSA1** even if context initially worse, but no runtime promotion with functional regression. Co-change/navigation data can guide later local grouping improvements. |
| **R-02: GSA2 harness** | R02-1 observe *actually delivered* repeated model instruction portions; R02-2 remove only proven redundant content in actual owning \`agent.ts\` / init producer with independent-entry requirements; R02-3 regression + collect valid next U field Job. | KEEP if safe robust workload-adjusted improvement vs single active baseline; otherwise REVERT only GSA2; INCONCLUSIVE means measure on next natural Job. |
| **R-03: GSA3 Tool/Skill response** | R03-1 rank actual delivered redundant payload, \`structuredContent\` vs fallback distinction; R03-2 adapt real domain tool response while preserving schemas, errors/external_steps and lazy skills; R03-3 regression + next real U Job. | KEEP/REVERT independently versus currently retained winner; no redundant catalog or formatter without actual reuse. |
| **R-04: GSA4 scoped context** | R04-1 verify real authoritative Task/Phase input to \`get_agent_harness\` (currently only role/mode); R04-2 implement limited fallback-safe selector **only if feasible**; R04-3 verify role isolation/negative cases + next U Job. | **NO_BUILD** if no trustworthy caller; otherwise KEEP/REVERT based on real normalized evidence, no fake context source. |
| **R-05: Integrated conclusions** | R05-1 gather eligible/INVALID comparisons, separate functionality vs context outcomes; R05-2 quality/regression and branch cleanup audit; R05-3 recommend release and rollback approach. | Final report, not automatic main merge/deploy. |

**R dependency reasoning:** R-00 before B0; R-01 before R-02; R-03 builds on R-02 KEEP or retained rollback winner; R-04 builds on R-03 KEEP or retained rollback winner. GSA1 always remains the structural starting point after verified parity. U continues to ship its reviewed work even if a candidate R version is reverted.

### 3. Actual rolling execution schedule — independent U delivery + R measurement

This is an **ordered coordination example with conditional movement to the next eligible U Job**, not a precommitted artificial one-Job-per-GSA-version pairing:

| Step | Refactor runner state | Real Functional Job | Output and context consequence |
| --- | --- | --- | --- |
| 0 | GSA0 unchanged | No feature Job yet | R-00 meter verified; capture no fake Job baseline. |
| 1 | **GSA0 baseline** | First implementation of **U-A** | Clean U-A source output and **B0** observed real context sample, source/code complexity pinned. |
| 2 | **GSA1** after source parity | Second independent implementation of **U-A** from **same** base | Compare real paired U-A outputs; select better code, integrate and delete loser. If GSA1 sample clean, compare against B0; if GSA1 is faulty, INVALID sample, repair and use next natural U Job for measurement without forced replay of U-A. |
| 3 | **GSA1 after correction / retained structural version** | **U-B** or next eligible U Job | Acquire a new clean GSA1 sample when needed, normalized against historical B0 if different work. GSA1 KEEP after functional parity regardless of efficiency. |
| 4 | **GSA2 candidate** built from retained GSA1 | Next eligible substantive U Job (e.g. U-B or U-C) | Two independent feature outputs still required. Dirty GSA2 sample INVALID; fix and take next natural U Job (e.g. U-C). Compare clean normalized result with **one active retained** baseline to decide KEEP/REVERT. |
| 5 | **GSA3 candidate** built from current retained winner | Next eligible U Job | Same source/code winner choice and normalized candidate decision; no dirty candidate calls spliced with repaired run. |
| 6 | **GSA4 candidate if feasible** | Next eligible U Job | NO_BUILD when trusted Task/Phase source not available; otherwise same test/KEEP/REVERT. |
| 7 | Final retained runner | Remaining U Jobs, if any, and integration regression | Complete independently required features; no filler Jobs to make R chart prettier. |

**Critical schedule invariant:** A U Job is implemented twice **for code-quality competition**. An R candidate measurement may be invalidated by a real GSA-caused bug; that does not erase legitimate completed U feature development. When a previous Job is complete, repair the GSA runner and use the **next new U Job** rather than mandatory replay solely to produce a clean metric. A runtime source SHA change during a measurement invalidates that measurement. At most TWO auxiliary branches per U Job, all created from identical source base. R endpoints must be genuinely isolated and runner source-pinned; separate Git branches are not two executable MCP instances.

### 4. Measurement and acceptance math — exact usage of relative workload correction

For every valid Job observation record:
- \`C\`: observed GSA-owned context proxy with identical UTF-8/character/estimated-token heuristic and source/event coverage; note unknown ChatGPT internal tokens.
- \`L\`: meaningful hand-authored application source lines **added + deleted**, separated from tests/docs/generated/moves and formatting-only changes. Store all raw counts and selected coding-output source SHA.
- \`D\`: sum of 4 independent complexity factors, each scored **0, 1 or 2** *before observing the candidate context result*: flow/state complexity; dependency/integration; concurrency/security/error/host risk; user-facing acceptance/test breadth. Record evidence per dimension.
- \`K = 1 + D/8\`, provisional bounded factor **1…2**; **W=L×K** and \`E=1000×C/W\` where meaningful L>0. Lower E conditionally represents better efficiency per weighted work unit.
- Comparison \`I = (1-E_candidate/E_baseline)×100%\`, shown along with raw C, L, all D factors, K, W, E and source-navigation/rework/quality. Compare Jobs on same observation surface; not raw totals alone. This is **a model-based relative estimate**, not exact hidden ChatGPT token use.
- Apply low/central/high justified complexity sensitivity; if K adjustment reverses sign, Job mix is non-comparable or LOC is mechanical/tiny, mark **INCONCLUSIVE** and defer to next eligible U Job. Missing calls, mixed runner versions or GSA-caused failures are **INVALID**, never promoted. Code quality regression vetoes context KEEP.
- GSA1 is architecture KEEP after parity even when E worse. Promote GSA1 to the sole **efficiency baseline** only when justified; preserve GSA0 as historical comparison. GSA2–GSA4 optional KEEP only after robust benefit and behavior parity, otherwise REVERT their own delta to last retained runner. Do not keep multiple **active** baselines.
- For docs/skill-only or no source LOC, \`E=N/A\`, use a defensible task-output proxy if truly comparable or mark INCONCLUSIVE rather than dividing by 1.

**Concrete required result fields:** \`u_job_id, u_goal, source_base_sha, output_control_branch, output_candidate_branch, output_shas, chosen_feature_output, integration_readback_sha, inferior_branch_deleted_verified, r_retained_runner_sha, r_candidate_runner_sha, meter_sha, observed_surface, C, calls, source_nav, L_added, L_deleted, L_exclusions, D_flow, D_integration, D_risk, D_testing, K, W, E, sensitivity_low_central_high, sample_validity_reason, normalized_improvement, decision_KEEP_REVERT_INCONCLUSIVE_NO_BUILD, active_baseline_sha\`. Do not persist raw private chat content.

### 5. Milestone dependencies, evidence, handoff and STOP

**Planning complete** means these two milestone ledgers and coordination are documented and source-bound. It does **not** mean any Task is implemented or source-write authorized. Every U milestone demands its own user-visible functional tests; every R milestone demands source/runtime parity and honest measured behavior. The one U feature-code winner after each paired implementation must be integrated before next U source base is selected. Do not declare branch cleanup successful if Git branch-ref delete/readback capability has not been demonstrated.

**Before coding:** resolve actual approved Criteria/authorized feature scope and current Project development-branch policy, along established Human/Advisor rules. Verify isolated runtime and branch-ref deletion before those operations; do not transform tool gaps into unrelated approvals or fictional checks.

**STOP at:** scope mismatch without authorization, live GSA client pointing to wrong runner, security/role/Advisor/CAS breakage, failed or mixed-version context sample, unresolved native-host external effects, or unverified branch removal falsely represented as DONE. Recover via normal reviewed Task plan, preserving completed U code and historical evidence. **No automatic production/main merge or deployment.**

**Result of this document edit:** coordinated milestones and tasks are prepared based on both design-review PASSes; execution is pending appropriate existing authorization. No source application code or runtime is changed.

## P0 BUGFIX MILESTONE — Advisor consultation must unlock Criteria editing (2026-10-25)

### Goal, priority and acceptance authority

**Priority P0 (workflow blocker).** Human has approved a material change after consultation. Planner must be able to reach the canonical Criteria write using the **existing Technical Advisor consultation mechanism**, not stop at \`ADVISOR_SCOPE_MISMATCH\` or demand a repeat Human approval. **Advisor is a consultation gate, not an approval/veto agent.** When the Advisor has truly completed and delivered scope-specific advice, unlock the **edit capability for that advised scope** immediately; apply the Human's last decision, then existing GitHub authorization/CAS/readback. If the Human retains the prior decision, proceed without another Human confirmation; if the Human changes it, edit to the changed decision. This changes the GSA control flow, not the content of this Project's Criteria by implication.

**Observed source evidence:** current \`supabase/functions/gsa-mcp/index.ts\` blob \`448355e9a129db45d836c0f86915396fb060514c\` contains \`project_criteria_advice_check\` and source errors \`ADVISOR_SCOPE_MISSING\`, \`ADVISOR_SCOPE_MISMATCH\`, \`ADVISOR_BASELINE_MISMATCH\`. Its success response is \`SCOPED_ADVICE_REQUIRES_INDEPENDENT_READBACK\` with \`criteria_write_prepared:false\`, while Planner harness text asks for \`ADVISOR SIGNED: ADVISED | BASELINE=... | SCOPE=... | ADVICE_REF=...\` and an external independent readback. The observed user workflow activated the Advisor but subsequently remained blocked by stale receipt scope; explicit source-edit authorization did not follow consultation. A mere \`start_direct_agent(advisor)\` response saying the agent is ready **is not evidence advice was delivered**. The fix must bridge this exact event boundary, not blindly bypass Advisor provenance.

**Separate scope of bugfix:** This is a legitimate Human-reported GSA orchestration defect and belongs to the existing bug-remediation work. It is a **pre-implementation repair milestone**; neither Track U's scope expansion nor the GSA1–GSA4 refactor is automatically authorized by documenting it. Maintain the two-track plan and technical proposals unchanged.

### M-ADV-01 — automatic Advisor activation and one consultation-completion unlock

| Task | Exact planned change | Reviewer/Tester acceptance |
| --- | --- | --- |
| ADV-01 Identify authoritative edges | Inspect existing \`project_criteria_advice_check\`, \`formatAdvisorAdviceReceipt\`, \`parseAdvisorAdviceReceipts\`, Planner role/harness text, \`start_direct_agent(advisor)\`, actual Advisor output, memory write authorization, and relevant tests. Draw real state transitions \`HUMAN_SETTLED_CHANGE → ADVICE_NEEDED → ADVISOR_INVOKED → ADVICE_DELIVERED → EDIT_UNLOCKED → CRITERIA_CAS_READBACK\`. | Evidence-based source owner/caller and exact existing inputs. No invented new role, receipt registry or unrelated gate. |
| ADV-02 Fix dispatch behavior | When Criteria material-change check finds absent/stale/out-of-scope advice, return an actionable dispatch/continuation instructing Planner to **invoke Advisor automatically** on current Criteria baseline plus precise delta. Planner must not answer with an error asking Human to fix receipt. Do not activate Advisor for ordinary discussions, unchanged Criteria or non-material Plan edits. | Human-triggered scope change activates Advisor; wrong-scope receipt never silently authorizes different scope; ordinary chatter does not wake Advisor. |
| ADV-03 Implement consultation→unlock | On **actual delivered consultation** covering scope and baseline, use existing durable scoped evidence (real advice reference, exact baseline/scope, Human settled decision) to unlock Criteria editing. Completion of advice is sufficient; Advisor approval/veto is **not required**, nor is a second independent Reviewer or Human re-approval. Align receipt parser/checker/Planner continuation so it can progress, rather than looping on its own outdated receipt. Keep Git CAS and Project ownership security. | Advice delivered + previously settled Human decision → Criteria edit can begin in the same continuing workflow. Advisor ready/admitted but not delivered → no unlock. Forged/inapplicable/stale advice → no write. |
| ADV-04 Write, readback, continue | Planner writes the **same canonical CRITERIA.md** under existing authorized Project Memory path with exact SHA, verifies persisted content, then advances the already-approved plan. Record actual evidence status. | No phantom Criteria update; interrupted flow resumes without second Human confirmation; reentrant continuation idempotent; mismatch returns concrete dispatch, never a dead-end warning. |
| ADV-05 Regression matrix | Add/update tests in actual existing \`test-lab/*.test.cjs\` and CI path for: initial Criteria approval; material revision; Human KEEP vs revised decision; valid prior scoped receipt; missing/old/wrong scope receipt; baseline drift; forged advice; Advisor only admitted not delivered; duplicate invocation; memory write error and retry; unrelated plan change no Advisor; role isolation. | Both positive continuation and negative security tests PASS without weakening current Advisor/Criteria or source-branch controls. Existing non-material behavior unchanged. |

**Disposition:** This milestone is the **first source-code repair once authorized**, before attempting to update the Project Criteria that is currently blocked by the very defect. Do not use the broken mechanism to assert a successful Criteria write. Do not fabricate an Advisor completion receipt; live consultation delivery is an observable input. The Human already approved the scope in this conversation, so after verifiable advice the system must continue from that decision without requesting it again.

### Dependency and scheduling adjustment

1. **M-ADV-01 first**, since the current Criteria-change flow blocks authorized development; it is a defect fix, not Track U/R feature scope or a third parallel R research project.
2. Resolve the actual advised-scope unlock and perform the separately requested canonical Criteria change via valid advice/write/readback, then apply the coordinated schedule: R-00 meter → GSA0/U-A baseline → mandatory GSA1/U-A second implementation → subsequent real U Jobs with optional GSA2–GSA4 KEEP/REVERT.
3. When working in a temporary auxiliary implementation branch for any U Job, this bugfix must be present in the common feature base if it is a prerequisite; do not count an unrelated one-time guard repair as an extra U Job or compare mismatched sources.
4. Do not merge \`main\` or deploy production as part of the bugfix plan. Record exact regression and runtime evidence separately from technical design review.

**Exit:** Independent functional verification of delivered-advice unlock (positive and negative cases), actual Criteria write/readback using real Advisor evidence when appropriate, and no regression in Advisor scope/CAS/security. **No independent confirmation review after CR**, no Advisor veto, no second Human approval for a decision already settled.

## U-G — Existing Coding Skill Discovery Helper for Bootstrap

### Goal

During existing Bootstrap capability readiness, Planner **reuses compatible, inspected, maintained, established coding skills before authoring custom skills**. Repository popularity (GitHub stars) is a discovery signal only, never an install/quality/security guarantee. The helper is a small curated source-directory with per-repository URLs and selection guidance, not a forked skill store, mandatory marketplace, new agent, or extra Bootstrap gate.

### Reviewed candidate sources (dynamic, verify at use-time)

| Source | Repo | Reason to inspect |
| --- | --- | --- |
| Anthropic official Agent Skills | https://github.com/anthropics/skills | General Agent Skills structure, skill creator, MCP and technical examples; assess licenses per directory |
| Superpowers | https://github.com/obra/superpowers | TDD, systematic debugging, planning, review workflows |
| Vercel Agent Skills | https://github.com/vercel-labs/agent-skills | Frontend, browser and framework-specific workflow guidance |
| Curated discovery directory | https://github.com/nodegenie/awesome-agent-skills | Search pointer; follow upstream repository, not aggregator blindly |
| Security-focused library | https://github.com/trailofbits/skills | Specialized security checks where relevant |
| Official Agent Skills standard | https://github.com/agentskills/agentskills | Format/compatibility reference, not a skill install bundle |

Do not hardcode transient star counts. Fetch GitHub stars/freshness/license upstream if needed. Ignore ranking where the individual skill is incompatible, unsafe, unmaintained or disallowed by its license.

### Milestone U-G — Skill Discovery and Reuse in existing Bootstrap

| Task | Implementation | Acceptance |
| --- | --- | --- |
| UG-01 Catalog helper | Provide concise accessible repo index grouped by coding/testing/security/design/documentation plus source type, compatibility hints and upstream URL; defer actual skill content until needed. Prefer lightweight existing native discovery capability and edit in-repo planner guidance only where appropriate. | Planner can locate appropriate upstream choices without inventing paths, copying whole repositories or loading irrelevant skills. |
| UG-02 Skill selection | Planner maps Project technical stack, platform and known capability gaps to a shortlist of individual skills. Inspect actual SKILL.md/metadata, licenses, latest revisions, instructions and risks, compare against already-installed skills, and prefer existing capabilities. | Every recommendation references an exact original skill and explains fit, compatibility, maintenance, provenance and limitations; stars alone never authorize install. |
| UG-03 Bootstrap capability add-in | Add only accepted, compatible skills to the actual Project Coder/Tester configuration using existing mechanisms and authorized source/host tooling. If native host skills are present, reference/use them rather than duplicate as GSA Markdown. If install unavailable, report accurately rather than asserting completion. | Reused skills become genuinely accessible to the relevant agent; no false statement that external GitHub source is installed. |
| UG-04 Gap fallback and tests | Write a custom skill **only if** available reusable skills are demonstrably insufficient or unsuitable. Test matching, non-suitable high-star cases, malicious instruction and licensing boundaries, unsupported host format, update drift and no-op when already installed. | Capability readiness remains existing Bootstrap acceptance: no new approvals, no bulk installation, no extra job/gate or context pollution. |

**Source relationship:** This supplements Track U's Coder/Tester capability preparation (U-C and U-E). Schedule U-G before declaring those role capabilities ready when a relevant skill gap is identified; do not interrupt R meter, GSA1 parity or active unrelated Jobs. Maintain single common source truth in approved Criteria once scoped Advisor consultation and Human decision are recorded through the existing authorized flow.

**Suggested Criteria wording:** "During Bootstrap, Planner shall first discover, assess and reuse appropriate existing coding/testing skills from credible and maintained repositories, giving popular repositories priority for *discovery*, not blind trust. It must check applicability, compatibility, licensing, security and availability, add only necessary skills through supported mechanisms, and create a custom skill only when an evidenced capability gap remains. This is part of existing Coder/Tester readiness, not a new gate."

