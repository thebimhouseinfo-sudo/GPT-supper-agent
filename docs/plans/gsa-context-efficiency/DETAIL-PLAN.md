# GSA — Integrated Bootstrap Functional Upgrade & Context Efficiency Plan

## GOAL

Upgrade GSA with the **missing, GSA-applicable functional rules** from the current Bootstrap v7 plan while using those real implementation Job Packs to estimate whether **GSA-controlled context efficiency** improves. First create a small tool-context meter, then make **one context-reduction group at a time** as candidate GSA1, GSA2, GSA3… from the currently retained GSA source. The candidate runs a substantive Bootstrap Job as a behavior/repair trial; if candidate code must be repaired, discard that Job's measurement; next run a clean Job or repeat the final whole Pack; compare to the current retained baseline and **KEEP/REVERT each optimization group independently**. Preserve complete accepted decisions, role independence, authorization, real-world user behavior, and current deployed GSA while developing on a separate source branch. No exact ChatGPT-Web input-token or productivity claim.

**Status:** DRAFT FOR PLANNER/REVIEWER AND HUMAN — *proposed scope and schedule, no runtime implementation authorized here*.
**Date:** 2026-10-24.
**Source development branch:** `upgrade/gsa-context-efficiency`, begun at `main` SHA `2ae052b57241bb845234235767b3dcb767030c70`.
**GSA runtime currently deployed:** `gsa-mcp` v55; no automatic production deployment or merge from this document.
**GSA source:** `thebimhouseinfo-sudo/GPT-supper-agent`, primarily `supabase/functions/gsa-mcp/index.ts`, `skills/`, `test-lab/`, `evals/`, and `docs/architecture/`.
**Bootstrap source:** `thebimhouseinfo-sudo/bootstrap` `main` @ `ea5f70f8bc051a036496158a4e33a2bfe6f99725`, `docs/refactor/CONTEXT_OPTIMIZATION_REFACTOR_PLAN_DRAFT.md` blob `98c4db371ecb48db02237ae2fbf69ce2e96f8614` (**DRAFT v7.0**, not an approved deployment contract).
**Existing GSA Criteria:** `thebimhouseinfo-sudo/GSA-Projects/projects/01a0f051-4353-7bff-8edf-46be4b44fd2f/CRITERIA.md`, blob `ff45d47435ae6cc9ae4acd5106bf945308fb4f95` (**APPROVED**, narrower A Planner/B research-first context/C bug remediation).

### Current decision, historical continuity and conflicts

1. This is **one integrated upgrade plan**, replacing the sequence previously described in this file (original M1–M4 research/replay-only plan), not adding another competing Project Plan or multiplying Job records. Old revisions remain in Git history. Existing Project Memory Job ownership must be reconciled with the latest reviewed plan only when authorized execution begins; do not duplicate J-94B4 or J-02E2 just to implement this document.
2. **Human's corrected rolling-version workflow (2026-10-24):** CT-00 meter first; original GSA0 runs real Bootstrap Job A and measures. After one isolated context change, candidate GSA1 runs Job B for behavior/shakeout, fixing GSA1 bugs if found and **discarding B's context measurements**. A subsequent clean Job C (or a repeat of the final meaningful Pack) is measured against GSA0/A and gives KEEP/REVERT. **If GSA1 wins, its exact source and eligible clean measurement become the baseline for GSA2**, which is developed from GSA1; otherwise GSA2 starts from retained GSA0. GSA2 runs D for shakeout, E for clean measure, then KEEP/REVERT versus whichever baseline was retained; continue likewise with GSA3+. Never divide functional Job Packs artificially just to obtain measurements. Repeating the last whole Pack safely is allowed. No exact host-token precision, complex benchmark, workload scoring model or unrelated telemetry service.
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

### Execution order — full functional Packs with rolling best-known-good baseline

**GSA versions:** GSA0 = the retained original GSA; GSA1 = GSA0 + CX-01; GSA2 = the **retained winner** after CX-01 + CX-02; GSA3 = the retained winner after CX-02 + CX-03, etc. They are **versioned code/test-runtime states identified by exact revision**, not different automatically deployed plugins or mandatory Git branches. If a candidate loses, undo only its context group while **keeping Bootstrap feature work** already delivered.

**Pack sizing:** BP-01…BP-08 below are functional specification/task groups, **not eight compulsory separate Job records**. Bundle them into substantive work by dependency. Example grouping (rearrange on real Job-size evidence, without breaking dependencies): A = BP-01+BP-02 (Decision/Secretary/Planner); B = BP-03 (scope-wide RETIRED); C = BP-04+BP-05+BP-06 (Coder/Proposal/Reviewer); D = BP-07+BP-08 (Tester simulate/debug). Future approved Bootstrap functionality may supply more whole Packs; if not, **repeat the last complete Pack** under controlled conditions.

| Sequence | GSA version running | Work | Purpose and evidence |
|---|---|---|---|
| 0 | Dev source | CT-00 | Create and verify small per-command context estimate |
| A | **GSA0 original** | Bootstrap **Job A** (for example BP-01+BP-02) | Complete real work and record eligible baseline measurement |
| CX-01 | Create **GSA1 = GSA0 + one context optimization group** | No artificial feature split | Identifiable candidate change, tested via isolated executable dev runtime |
| B | **GSA1 candidate** | Bootstrap **Job B** (for example BP-03) | Behavioral shakeout; if GSA1 requires a fix, **B context measurement INVALID** but feature/test output retained |
| C | **stable GSA1** | Bootstrap **Job C** (for example BP-04+BP-05+BP-06) | Clean full Job estimate; if GSA1 breaks here, fix and invalidate C, then run another full Pack/repeat the last one |
| Verdict 1 | GSA0 vs GSA1 | No feature Job | Compare **eligible** C with GSA0/A using rough actual-work-size adjustment; **KEEP GSA1 or REVERT CX-01**. KEEP promotes both GSA1 source and its clean context result to next **rolling baseline** |
| CX-02 | Create **GSA2 = retained winner + second context group** | No artificial feature split | Candidate begins from GSA1 only when GSA1 was kept, otherwise from GSA0 |
| D | **GSA2 candidate** | Bootstrap **Job D** (for example BP-07+BP-08) | Shakeout and bug repair; candidate faults **invalidate D measurement** |
| E | **stable GSA2** | Next genuine Job, or **repeat final complete Job Pack D** | Clean measurement against the **retained** baseline (GSA1/C if kept, otherwise GSA0/A), then **KEEP/REVERT CX-02** |
| CX-03, CX-04… | Create **GSA3, GSA4… only from the latest retained winner** | Next substantive Job or repeat the final full Pack | Same independent cycle: shakeout → fix/invalidate on fault → clean complete run → measure → KEEP/REVERT |
| Final | **Latest retained GSA** | Integrated regression | Source/feature evidence, accepted/rejected context groups, clean results and uncertainty; no automatic merge/deploy |

**No forced Job splitting:** The requirement sections below remain complete and separate for traceability, but the execution Job may cover related sections. The same **last whole Job Pack may be repeated** as often as useful to validate a candidate and obtain an eligible sample; do not run duplicate irreversible writes against production state. A repeated, completed Pack must begin from a safe recorded fixture/source condition and execute the actual relevant workflow, not merely a synthetic helper call. If it repeats behavior without re-implementing source, label it **FUNCTIONAL_REPLAY** and **do not normalize by fictitious new lines of code**; compare same-workload estimated tool payload/call count instead. If a full development Pack truly is redone from an isolated equivalent input/source snapshot, report actual modified lines and source boundaries honestly.

**Candidate-fault invalidation:** When a candidate GSA causes incorrect role/skill loading, tool routing, lost mandatory instruction, unsupported MCP result, broken Job state or another behavior defect, debug/repair GSA within the ongoing Job but **discard ALL context-comparison readings of that Job**. It still counts as real Bootstrap functionality and test evidence. A separate functional-feature bug must be classified independently instead of attributed automatically to context reduction. Only a subsequently stable whole Pack generates **eligible** measurement. Mixed candidate source revisions are invalid.

**Decision rule:** Evaluate functionality first, then rough context efficiency with eligible samples and work-volume caveats. If net benefit is credible, **KEEP** candidate and promote its exact GSA source and measured result as next baseline. If no benefit or new serious regression, **REVERT only candidate context change** (and dependent candidate-only repairs), never discard unrelated working Bootstrap functionality. The next candidate starts from **last retained winner**, not from rejected versions. If no good candidate exists, SKIP that group and continue feature development. Git dev branch alone is not a running MCP; candidate use requires an isolated executable runtime/client, while production plugin + Project Memory remain separate.

### BP-01 — Discussion Job and Secretary (Bootstrap M2, §6A/E1/E2)

#### GOAL
Preserve real Human-accepted expert decisions in existing GitHub-backed project scope so Planner/Coder can later read them without losing the original solution.

Tasks:
- **BP01-T1:** Implement optional entry semantics: explicit Human "open Discussion Job" opens directly; generic desire to talk gets at most one optional offer; declining permits normal chat; ordinary questions/brainstorm do NOT auto-open one. Discussion Job is a *documentation workspace*, not a compulsory executable Job, new gate or background agent.
- **BP01-T2:** Use a focused Secretary skill/action (not an always-running role). Record a decision ONLY after actual Human acceptance, distinguishing `ACCEPTED`, `PROPOSED`, `UNRESOLVED`. Preserve exact operational algorithm, reason, examples, exceptions, forbidden alternatives, dependencies and original provenance, not just a title.
- **BP01-T3:** Keep stable Discussion/Decision references and an index using existing authorized project documentation/Memory, with sequential corrections as explicit supersession and full prior text readable. No new database, schema bureaucracy or fake write-confirmation; use GitHub CAS/readback where already applicable.
- **BP01-T4:** Negative tests: no Secretary activation on speculation; no "saved" claim before readback; corrected decision does not erase old source; normal non-discussion work carries on.

**PASS:** One long, multi-step expert procedure survives accepted recording, correction and later retrieval with exceptions intact; no extra mandatory gate.

### CX-01 — First context reduction: proven harness duplication

#### GOAL
Reduce genuine GSA-produced repetition without losing an applicable mandatory instruction on any role/tool entrypoint.

Tasks: use measured command frequencies; identify duplication among `createServer` instructions, `BASE_AGENT_HARNESS`, role loops and `get_agent_harness`. Keep precise Human approval, branch, CAS/readback, stopping and independent-role requirements. Patch only text/structure whose remaining delivery is verified; do not assume earlier chats are cached. Re-run the meter on the same dev source measurement surface before/after patch. Keep independent regression.

**PASS:** Observed GSA payload decrease for at least one relevant measured command and no applicable contract loss; otherwise REVERT/SKIP.

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

### CX-02 — Bounded skill/tool relevance experiment

#### GOAL
Stop sending observed irrelevant GSA instructions during commands without breaking the protocol.

Tasks: inspect actual `get_skill_catalog`→`load_skill` usage and measured duplicate noncritical `external_steps`. If possible on the verified test surface, retain full mandatory active-role/task guidance while suppressing unrelated descriptions/metadata; beware ChatGPT host-injected tool schemas outside GSA's control. Never drop blockers, exact IDs, action instructions, CAS proof, error reason or `structuredContent`/`content` fallback by guess. Use same-source before/after meter and negative tests.

**PASS:** Measured safe reduction, or documented SKIP.

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

### CX-03 — Role/task/phase-specific context experiment

#### GOAL
Reduce measured irrelevant role/phase content without weakening a single active Role's complete contract.

Tasks: review current role harness assembly and suggested skills. Prefer scoped disclosure for active role/phase and on-demand detailed skill text, not a new context manager. Context required for independent Reviewer/Tester cannot rely on Coder's previous chat. Host-managed skill/tool schema limitations stay UNKNOWN. Re-run same dev source meter and chosen isolated role tests before/after.

**PASS:** Reduced GSA-controlled active-pack payload with unchanged capability/authority; otherwise revert.

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

### CX-04 — Final selective context experiment (conditional)

#### GOAL
Confirm whether another **small** safe context reduction is still valuable after Tester/Reviewer skill additions; avoid overengineering when prior reductions already suffice.

Tasks: sample new skill/harness response sizes; avoid preloading out-of-scope Tester scenario references or advanced debugging into every session. If no safe measurable opportunity exists, **SKIP** without architectural changes.

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

After each **COMPLETED, candidate-stable** substantive functional Pack (or a separately labeled complete-Pack `FUNCTIONAL_REPLAY`) record:

- `pack_id`, start/end GSA source commit, exact meter/runner version, execution environment, selected runtime surface (`SOURCE_TEST`, `STAGING`, `PRODUCTION`), observed GSA tool call count and per-command character/UTF-8 byte/token **estimates**.
- `observed_payload_total` = sum of measured model-facing GSA tool response sizes *for calls actually captured*; label missing calls/host-only state UNKNOWN. Estimate tokens with the same chosen heuristic across all Packs, explicitly a proxy, not true ChatGPT token accounting.
- From source Git diff for the Pack's own commits (excluding context-patch commits): `added + deleted` lines of human-authored application source, tracked separately from tests, docs, generated files and formatter-only/moves. Include files/modules touched, errors/rework/follow-up calls and functional PASS/FAIL. **Do not present LOC as objective complexity**.
- For new development with actual authored application-code changes, `estimated_context_per_1000_changed_code_lines` = `estimated_context / changed_code_lines × 1000` when meaningful. For `FUNCTIONAL_REPLAY` with no new source changes, the LOC-normalized measure is **N/A**, not artificially divided by 1. For documentation/skill-heavy Packs, **application-code LOC is not a valid denominator**; compare their appropriate authored instructional/content changes separately and mark the code-normalized metric N/A, not artificially huge savings.
- Post-hoc workload adjustment: if A changes 15k code lines and B 25k, B is approximately 1.67× A by that **one proxy**. A raw context difference must be interpreted alongside this size difference. Reused code, refactoring/moves and domain complexity can invalidate linear estimates. No mandatory "same Job twice" replay, statistical model or exact matching.
- Log `status` and quality: goal achieved, main regression result, wrong tool / lost instruction / retry when visible, meaningful risk or major complexity difference. **Do not turn a small-code task with many critical decisions into a false efficiency win merely by dividing by LOC**.

Minimal journal row schema: `candidate_version, parent_retained_version, source_sha, pack_id, run_kind, measurement_validity, invalidation_reason, total_observed_payload_bytes, estimate_tokens, observed_GSA_calls, code_added, code_deleted, docs_tests_delta, result, verdict, next_retained_baseline, unknowns`. Aggregated per-Pair `before/after` notes are enough. Do not save raw private chats, secrets or full external Job payloads.

### P2.2 Clean-run validity and rolling-baseline comparison

1. **Baseline:** record GSA0 exact source/runtime identity, first completed substantive Job A and eligible measured context. Keep its measurement as baseline until a better candidate passes.
2. **Candidate:** implement one CX group only, producing source-pinned GSA1/GSA2/GSA3… from the currently retained best GSA. Verify correct isolated dev execution before trying real work; a Git commit alone does not run code.
3. **Shakeout:** run the candidate on the next substantial Bootstrap Job. If candidate GSA code misbehaves or must be corrected, keep the repaired Bootstrap feature and bug findings but mark **that Job's context data INVALID**. Do not use contaminated samples to claim gains, even if the final response looked shorter.
4. **Clean run:** run the next full Job Pack without candidate GSA faults. If no more new feature Packs, **run the last full Pack again** on a safe reproducible environment/initial state; repeat as needed until there is a clean sample or reject an unstable candidate. No requirement to subdivide the Pack.
5. **Comparison:** estimate per-command/whole-Job GSA payload and tool calls for each **eligible** sample, using consistent heuristic. For new feature Jobs compare relative scope using actual Git diff and note qualitative differences. For a same-Pack functional replay, compare measured calls/payload for equivalent work; source LOC denominator = **N/A** when no new code was authored. Never claim observed ChatGPT host tokens.
6. **Independent verdict:** KEEP/REVERT based on eligible relative efficiency **and** correct behavior. KEEP makes candidate source revision and eligible clean measurement the **rolling baseline**. REVERT removes only the current CX optimization while preserving previously retained CX improvements and real Bootstrap upgrades. Every next CX builds on the most recent **retained** baseline, not always GSA0.
7. **Report:** list rejected/kept candidates, why each shakeout sample was excluded, clean sample size/workload/type, source SHA and runtime surface, correctness, relative trend and the final retained winner. Do not interpret repeated repair attempts as extra clean measurement runs.

**Repeat safety:** Re-executing a development workflow must not reuse an unsafe terminal Job or repeat unconfirmed Git/CAD/stateful writes on production. It may use a safe isolated replay/fixture of the last completed substantive Pack. If replay behavior differs from initial implementation in kind, explicitly label the comparison's limitation. A replay is a **real functional test**, not an excuse to fabricate a new source-code workload.

### P2.3 Functional coverage and no-drift checks

- **Full source reference:** Bootstrap draft v7 §§6A–6I + operational specification E1–E12, accepted decision coverage CD-01–CD-58, retirement R-01–R-20, simulation S-01–S-18 and file-lifecycle F-01–F-20. Each requirement is mapped to one BP owner, source revision, behavior oracle and observed outcome. A heading-only mapping is a coverage FAIL.
- Preserve GSA's original Node/Deno test contracts, current Criteria/Advisor trigger, Planner→Reviewer continuation, exact branch/repository ownership, auth, CAS/readback, Run/cursor/fence, role-isolated Reviewer/Tester, stopchat/recovery and tool-schema compatibility. Include negative controls, not just string presence tests.
- Independent Tester must verify actual end-user triggers in scenarios justified by risk. A mock/tool-present outcome is not real-host PASS. Real-project E2E can remain marked PENDING/UNVERIFIED where Human previously deferred it, not an invented blocker or a fabricated successful test.
- Run the exact executable tests in `.github/workflows/gsa-next-logic.yml`, new test files explicitly added to invocation/CI if created, and `deno check`. If hosted CI fails without executed steps, record ENVIRONMENT_UNVERIFIED separately and use an authorized exact-source alternative.
- If the latest Bootstrap draft changes while implementation is ongoing, compare source SHA and accepted decisions; incorporate only reviewed changes, do not allow silent scope expansion or unexpected bootstrap installer work.

### P2.4 Release / rollback

Deliver a compact `BEFORE-AFTER.md` with **rolling GSA version winners, excluded bug-repair runs and KEEP/REVERT for each CX group**, per-Pack and per-CX results; source and accepted-decision trace; functionality PASS/FAIL/UNVERIFIED; changed paths; rollback/branch refs; actual isolated staging/client compatibility if exercised; and explicit `RECOMMEND_MERGE` / `NO_GO` / `NEEDS_E2E`.

**Never merge into main or trigger production/Vercel/Supabase deployment merely for these experiments.** GitHub development-branch writes do not change production tools. Release is an explicit later Human decision and requires then-current source, permissions and independent evidence.

## Code structure proposal — small GSA changes, no second control plane

### GOAL
Provide a source-level responsibility guide *without* presuming every proposed module needs to be created.

| Current/possible surface | Owner | Planned changes only when verified necessary | Prohibitions |
|---|---|---|---|
| `supabase/functions/gsa-mcp/index.ts`: `BASE_AGENT_HARNESS`, `ROLE_HARNESSES`, `ROLE_SKILLS`, `RUNTIME_SKILLS`, `renderHarness`, `get_agent_harness`, `load_skill` | GSA MCP | Selective new feature skill hints/bodies, tool output slimming, existing request flow | No general context DB/proxy/global loader; do not strip mandatory rules |
| Existing project-backed Decision/Job Plan tooling + GSA Project Memory | Existing durable ownership | Small focused discussion decision refs / Plan links / reviewed retirement coordination using verified current write routes | No duplicate Criteria DB, Secretary daemon, parallel GSA Job lifecycle or mutation of unrelated Jobs |
| Existing GSA Plan-change/job dispatch/branch retirement | GSA lifecycle | Minimal scope-wide RETIRED integration when existing intent/fence insufficient | No unsafe Run kill, no invented Run.RETIRED, no physical branch delete, no blanket dev-branch migration |
| Existing Coder and Reviewer role harness + existing skills mechanism | GSA role contracts | Focused solution-clarification, full decision on demand, descriptive proposal + whole-related design review | No separate Technical Plan, global component Registry or requirement for Human to choose internals |
| Existing Tester + debugging skill, related tools | GSA Tester | Scoped simulate references, 3-cycle counter/evidence and optional deep diagnosis on escalation | No Simulator Job, source writes by Tester, or native-host PASS on mocks |
| `test-lab/` and existing `evals/` | Test/evidence | Meter script, small synthetic fixtures, behavior oracles, aggregate results | No live private transcript telemetry, no heavyweight benchmark service |
| `.github/workflows/gsa-next-logic.yml` | CI | Register new test file invocation only when tests are actually added | No assumed auto-discovery; no auto production deployment |
| `docs/plans/gsa-context-efficiency/` | Planning/evidence | This single integrated plan, minimal meter note, comparison report; keep upstream source links | No alternate competing canonical Project Plan/Criteria |

**Each assigned Coder Task** later follows Bootstrap §E5 Pre-Code Proposal: exact `CREATE/MODIFY/REUSE/KEEP/REMOVE` paths, functions, callers, inputs/outputs, tests and exclusions, based on actual source inspection. That is **per-Task implementation design after authorization**, not a requirement to create all listed files or code now.

## Ownership, sequencing, acceptance and STOP rules

### GOAL
Keep implementation bounded and safe while ensuring all Bootstrap behavior, not merely feature names, is represented.

- **Planner:** pin source revisions, preserve accepted human/professional solutions and scope, assign the existing Jobs/Tasks legally, integrate new work within the reviewed Project plan; cannot approve source writes or Criteria changes on Human's behalf.
- **Coder:** write only approved owned source, prepare Task-level descriptive structure before implementation when this feature becomes active; apply smallest verified solution rather than redesigning project-wide architecture.
- **Reviewer:** independent planning/source/design review, whole-related-Task check, error/authority negative testing, proportionate solution and fidelity; Reviewer does not code. Do not start Critic Reviewer by default unless direct Human `cr/crl` or preauthorized milestone.
- **Tester:** independently construct user-entrypoint oracles and test actual flows; run on-demand `simulate`; separate MOCK / SOURCE / LIVE HOST and RETIRED/ACTIVE evidence. Tester cannot substitute a PASS by repeating Coder assertions.
- **User:** decides material WHAT/WHY/operational scope, chooses a manual verification alternative if appropriate, separately authorizes implementation and later release. Technical Advisor only at its existing approved Criteria-change trigger.
- **Dependencies:** BP-02 depends on BP-01 DEC records; BP-03 on current Plan/Run lifecycle evidence and BP-02 decision links; BP-05 on BP-04 correct engineering/operational boundary; BP-06 on all relevant BP-05 proposals; BP-08 on BP-07 Tester behavior and actual defect attempt history. **Group BP requirements into substantive Jobs** instead of forcing one Job per section. Each CX has its own candidate smoke/repair, **discarded dirty Job result**, then **clean whole-Pack measurement and KEEP/REVERT** before the next CX; repeat the last Pack safely whenever there is no new one. Skipping a CX group does not block functional work.
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

**Final acceptance:** GSA functional behavior is source/host-evidence-grounded for the approved adopted scope; the compact meter reports reasonable relative trends over more than one real functional Pack; no mandatory authority/role/Job correctness is traded for shorter context; `main` and production unaffected until a separately authorized release.
