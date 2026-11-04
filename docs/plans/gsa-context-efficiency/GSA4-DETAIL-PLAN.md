# GSA4 — Detail Implementation Plan: A-First Fine Modules and Task-Driven Context

**Date:** 2026-11-04  
**Decision:** Human selected **A for the physical BASE**, then **B-like logical context selection across A modules**. This document is the detailed GSA4 plan and does not supersede the parent `DETAIL-PLAN.md` or approved Criteria.  
**Status:** ARCHITECTURE DIRECTION CONFIRMED; IMPLEMENTATION DESIGN/REVIEW PLANNED; **SOURCE CODE NOT CHANGED**. Existing GSA governance and approval apply.  
**Repository:** `thebimhouseinfo-sudo/GPT-supper-agent`  
**Development branch:** `upgrade/gsa-context-efficiency`  
**Pinned GSA3 behavior source:** `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`; re-check current branch HEAD and source blobs before implementation.  
**Companion:** [GSA4-TECHNICAL-PROPOSAL.md](./GSA4-TECHNICAL-PROPOSAL.md). **Actual code extraction map:** [GSA4-A0-SOURCE-TO-MODULE-EXTRACTION-MAP-20261104.md](./GSA4-A0-SOURCE-TO-MODULE-EXTRACTION-MAP-20261104.md), including the original named functions and test ownership.  
**Parent:** [DETAIL-PLAN.md](./DETAIL-PLAN.md), [GSA4-RESEARCH-PLAN.md](./GSA4-RESEARCH-PLAN.md).  
**Evidence:** [six-report A/B cross-review](./GSA4-SIX-REPORT-CROSS-REVIEW-20261104.md), [A-first simulation](./GSA4-A-BASE-DEVELOPMENT-PATH-SIMULATION-20261104.md), [G1A](./GSA4-G1-A-RESEARCH.md), [G2A](./GSA4-G2-A-RESEARCH.md), [G3 Agent × Job × Task](./GSA4-G3-AGENT-JOB-TASK-CONTEXT-RESEARCH.md).

## 1. Goal, scope and non-goals

**GOAL:** improve the real working efficiency, source-debuggability and correctness of the GSA Agent system. First split large GSA sources into coherent **small responsibility-owned physical modules** (A). Preserve current GSA3 behavior **exactly**. Afterwards, allow an Agent to receive or fetch **logical task context bundles** by Role × Project/Job × Task × current Phase, drawing references from those modules without physically regrouping source (B-like selection). Progressive retrieval must supply not merely enough context to act but enough to detect missing facts and ASK/STOP/READ_MORE **before incorrect action**.

This has **three distinct objects**:
- **G1 — Agent Harness/Skills/Agent guidance:** how role and skill instructions are stored and delivered.
- **G2 — GSA runtime TypeScript implementation:** how developers locate, read, change, review and test GSA's own source.
- **G3 — documents of projects managed by GSA:** Criteria, Project Plan, Job, Task, Knowledge, approvals, handoff and evidence; task-driven selection by real work position. **Independent research object**, not a source-code split or a ban on a given Role reading Criteria.

**Do not do the following in parity extraction:** rewrite Role authority, drop shared policies, change Criteria, add a ninth Role, add new permission gates, change tool schemas, silently change Advisor source-reading rights, change NEXT/legacy interpretation, alter Plan approval/CR ordering, make project-context summaries into independent authorities, recreate CT-00, alter GSA3 product behavior, merge to main or deploy.

**Source/layout benefit != model-payload benefit.** Moving files alone leaves existing `get_agent_harness` and `load_skill` payloads unchanged. GSA3 already selects one Role and on-demand Skill. New functionality that changes what is sent to a model is a **separate post-parity optimization**, not A0.

## 2. Selected A-first architecture and evidence baseline

### 2.1 Group 1: Agent instruction source

Research A's accountable physical layout is **21 TS units** from original `harness-catalog.ts` (85,330 attributed JS source chars): one public facade; one Shared/mandatory authority owner; eight existing Role owners (orchestrator, planner, advisor, designer, coder, reviewer, critic_reviewer, tester); eleven existing Runtime Skill owners. These are design buckets, not already-created files. Preserve `ROLE_HARNESSES`, `ROLE_SKILLS`, `ROLE_HOST_SKILLS`, `RUNTIME_SKILLS`, `renderHarness` and the MCP consumer contract.

Keep `docs/architecture/AGENT-HARNESSES.md`, `docs/architecture/EXECUTION-AND-REVIEW.md` and `skills/gsa-job-runtime/SKILL.md` canonical at A0. G1A identifies 25 addressable sections inside those three originals. **25 section entries are not an order to create 25 physical document files.** Resolve the smallest cohesive sections that truly have independent ownership/lookup needs during design review.

### 2.2 Group 2: GSA source for Coding Agent maintenance

G2A's candidate map is **I1–I8** (formerly mixed `index.ts` helpers), **R1–R5** (Run tools), **P1–P4** (Project tools), **C1–C2** (checkpoint), **E1–E3** (evidence): **22 prospective child owners**, behind five stable parent registration/entry facades, with `selftest.ts` initially KEEP. This is a starting map, not an absolute required file count. A-guard permits co-locating demonstrably tightly coupled owners (e.g. Run begin/relationship knowledge, Evidence prepare/finalize). Existing GSA1 extracted modules stay intact unless a specific dependency demands a behavior-parity-preserving relocation.

**Important non-small exception:** the proposed parent `index.ts` still attributes roughly 47,444 old source characters to composition/HTTP/tools. Investigate split of remaining clear responsibility owners but **do not** move captured `createServer` closures by literal line slicing. No child may import its own parent facade and create index ↔ child cycles.

### 2.3 Group 3: Job-specific work context

The User's MEP management analogy is a **bottom-up information-needs method**, not new GSA Roles. Same Coder in AutoLISP, backend MCP, frontend UI, or a defect-repair Job needs different Skills, Knowledge, relevant code and verification. Research the exact **Agent Role × Work Position × Job × Task × Phase** need and upward handoff responsibility. **Preserve** real Planner/Orchestrator/Reviewer/Tester/Advisor contracts; Role is permission/authority, Work Position is current delegated responsibility. No unconditional “Coder cannot read Criteria” rule.

## 3. Workstreams, milestones, sequence and acceptance

Only **G4-P** and **G4-A0** define the initial physical design/extraction. **G4-O** context experiments follow **actual extraction + parity PASS**, not merely a paper architecture choice. Track U and active production remain separate.

| ID | Milestone / Deliverables | Dependencies | PASS / exit evidence |
| --- | --- | --- | --- |
| **G4-P1** | Pin GSA3/source/branch, all exports, tool schemas/order, Role+Skill outputs, existing CT-00 fixture/runner; record original golden snapshots and negative safety cases | research done; current branch re-read | Source SHA manifest; reproducible reference corpus; reviewable baseline, no changing product code |
| **G4-P2** | Verify the complete existing function-to-owner, dependency and source-test mapping in the actual extraction map; retain createServer-bound callbacks in index unless verified safe | P1 | Exact original symbol→new path coverage, no missing/duplicate owner or unexplained cycle; independent technical review |
| **G4-P3** | Review two-doc technical design, acceptance/checklist and rollback order; preserve existing Criteria/Plan authorities | P2 | Explicit recorded design verdict/changes; no invented additional Human approval mechanism |
| **G4-A0.1** | Move actual catalog literals (Shared L1–55, 8 Role entries L56–261, 11 Skills L279–583); keep Role/Host Skill maps and renderHarness in facade; migrate monolithic VM/AST test loader and preserve negative controls in same change | P3 and legitimate existing code execution authorization | Golden byte/content equality for 8 Role harness responses + 11 Skill bodies, suggestions, Direct/JOB and NEXT injection; all existing relevant tests |
| **G4-A0.2** | Extract exact named index.ts functions I1–I8 from source map; split I1 contract/auth, move L1486–1503 planning schema to I6 not Cursor; keep createServer L1800–2395 and nested validateRepositoryProbeSnapshot L1937–1990 in composition | A0.1 independently parity-checked; any new change diff bounded | Deno/source checks, existing source-bound test mapping and full negative contract parity |
| **G4-A0.3** | Extract existing Run 5 / Project Setup 6 / Checkpoint 3 / Evidence Repo 3 tool registrations under original register* facades; migrate 58-name ordered test to actual leaf call chain; KEEP selftest | A0.2 parity checked | 58-name/order inventory at pinned ref (verify current exact count), tool schemas/responses, authentication, Run/Job/evidence/claims and CI test coverage unchanged |
| **G4-A0.4** | Verify exact extracted commit SHA: 8 Role/11 Skill output golden, 58 tool names/order/schemas, import graph, source-bound negatives and Deno check; use workflow_dispatch on dev ref or PR since push on this branch does not trigger CI | A0.1–A0.3 | Independent Reviewer/Tester evidence, precise tested commit, no behavioral drift; explicit FAIL/UNVERIFIED on missing host |
| **G4-O1** | Compact SHA-aware source owner/symbol/error→test locator (A1) | **A0.4 PASS** | On identical tasks, measured source reads, owner accuracy, tool overhead; no hidden source authority |
| **G4-O2** | B-like context recipes over actual Job/Task/Run/Knowledge revisions and A owners; GSA3 job_prepare permits only ui-coder-frontend in Task.required_skills while Project addins are verified paths, not a generic Skill loader; ASK/READ_MORE on missing data | O1, A0.4; review existing Task/Skill contract | Same Task targets and negative oracle; source provenance; correct Role skills and broad fallback; no new permission |
| **G4-O3** | Error→owner→producer/consumer→tests debug route (A3); compare ordinary owner lookup | O1/O2 | Count actual wrong-file opens, repair rounds, changed blast radius, retests, independent regression outcomes |
| **G4-O4** | Optional Shared policy ownership audit/assembly (A4), **separate high-risk change** | A0.4, independently verified every Role policy mapping | Human/deny/CAS/Review/Tester/CR/unknown cases retain mandatory instruction coverage; actual model-payload observation, revert on regression |
| **G4-O5** | Optional task/phase Role/Skill section experiments (A5) and guide section reads (A6) | Observed safe selectors, nontrivial savings and O4 overlap audit | Conditional loader state, rehydration when needed, positive/negative proof; de-dup counted once |
| **G4-G3** | Apply Group 3 bottom-up Task-Need Matrix to canonical Project document taxonomy and handoff, independently of source layout | Can analyze now; **runtime selection/implementation after A0.4** | Task correctness, skills/knowledge relevance, missing-information detection, upstream source links; no role-based blanket ban |
| **G4-M** | Compare identical source/bug fixtures GSA3 KEEP vs A0 vs A1 vs A1+A2 vs A1+A2+A3; count root-owner identification, wrong reads, repair/retest cycles, regressions, CT-00 and extra calls | A0.4; each bounded O candidate separately | Real calls/latency where observable, context buckets, quality/regression, cost + uncertainty, decision record |

**Execution batching:** Each A0 code milestone is broken into minimal reversible commits by **dependency-closed owner group**; no big-bang reformat. If tests require adapting AST/regex location assumptions, move their **lookup** to current symbol owner, preserve every assertion including negative security/regression tests. Do not use “source moved” to justify deleting coverage.

## 4. Detailed physical implementation packages

### Package H — Harness extraction (G4-A0.1)

1. Snapshot **all eight** GSA3 `get_agent_harness` outputs for relevant execution modes, error/unknown/denied branches, 11 exact `load_skill` bodies, role-to-skill and host-suggestion catalogs. Record captured MCP `content`/`structuredContent` shapes separately; do not double count mirrored data.
2. Isolate original literal Shared, Roles and Skills into owned modules, with parent aggregator preserving exported lookup names/types, current rendering/ordering/newlines and error paths. TypeScript moving may add import syntax but **must not rewrite string text**.
3. Maintain exact `run_begin.required_skill_contexts` semantics; do not double inject Task Skill merely because a separate `load_skill` is present.
4. Adapt existing gsa2-harness-dedup, gsa3-tool-skill-payload, llc59, llc60, runtime-logic and other source-bound tests to import **actual** new TS leaf modules. Keep tests of mandatory instruction mutations, exact public output and denied/unknown paths; execute with the same extraction commit.

### Package I — Mixed index extraction (G4-A0.2)

1. Freeze original index symbols, call graph, captured lexical variables and handlers; distinguish top-level pure helpers from `createServer` nested functions (notably source span originally near index lines 1937–1996).
2. Extract small responsibility groups: auth/contract, durable records, dispatch/closure guards, evidence validation/gate, planning preflight/schema, cursor decisions, Project manifest/scope. Preserve original public `createServer` and route handlers as facade/registration.
3. Use one-way type/interface dependencies and pure shared utility owners; avoid child→index imports, circular dynamic initialization, broad unreviewed `deps: any` rewrite or duplicated validators.
4. Retarget `runtime-logic.test.cjs`, `project-branch-policy.test.cjs`, `reliability-cursor.test.cjs` source lookup to actual function owners without relaxing assertions.

### Package T — Existing tool modules (G4-A0.3)

1. Retain parent exports `registerRunExecutionTools` / `registerProjectSetupTools` / `registerCheckpointTools` / `registerRepositoryEvidenceTools` and their exact registration order/schema mapping.
2. Isolate Run admission/knowledge/goal recheck/verification/complete; Project setup/Advisor-addins/Bootstrap/branch; checkpoint claim vs verification/gate; evidence prepare vs finalize/probe **only when owner dependencies are closure-safe**.
3. Preserve immutable repository evidence publish/probe distinction, claim lease/attempt, stale SHA, exact Job/Task/Run identity, NEXT/V2_STABLE/production/test-lab paths, Git CAS and readback.
4. Keep `selftest.ts` integrated. In the same extraction, adapt gsa1-module-boundary.test.cjs to expand the ordered parent→leaf registrations and compare the exact existing 58-name inventory, including reorder/duplicate/missing negative controls.

## 5. Common simulation protocol (do not compare different tasks)

**Fixture F1:** Brownfield Bootstrap with already-approved Criteria/Plan; optional missing Plan branch.  
**F2:** Continue approved code Task on exact pinned Job/Run, with lost-write/cursor negative.  
**F3:** Product failure → independent test classification → scoped fix → independent review/retest, with host-unavailable and repeated-failure negatives.  
**F4:** New non-UI feature: Planner → planning review → **new explicit Human approval** → Coder → source review → Tester; a real UI case adds Designer/task-specific skill when relevant.

For **Group 1**, freeze actual Agent-role and selected Skill activations before A/B, and record model-facing Role/Skill chars separately from optional Agent guide reads. The cross-review normalizes a paper 13-Role/14-Skill full-positive path at **303,501** delivered characters. For G1A A0 physical split the same text remains unchanged; a future A4 policy-selection forecast of **228,114** is **unvalidated**.

For **Group 2**, freeze the exact same code symbols, issue and test targeting across alternatives. G2A has a 12-session Coder/Reviewer/Tester source-read paper scenario: **1,421,263 chars/65 source opens** for naive whole-file A versus **851,935/53 source opens** with direct owner lookup before a hypothetical 24,000-char locator budget. This **38.4% favorable paper estimate** is entirely from avoiding initial full-facade reads; if Agents already navigate directly to owner, incremental gain can be zero/negative. None are observed host tokens or repair speed.

**Experiments under A0 must use the same exact task revisions and expectation oracles:** A0 (whole owner), A1 (owner locator), A1+A2 (logical recipe), A1+A2+A3 (repair route), A4 policy (separate), KEEP. Vary index cost 0/one read/multiple reads and known-owner vs unknown-owner vs cross-module; charge every additional lookup. **No independent Reviewer/Tester shares Coder's hidden cache or verdict.** Model-facing Harness, source code navigation, agent guidance, per-Project docs, Knowledge, Tool results and Handoff remain separate accounting buckets.

**Evidence states:** `SOURCE_STATIC` / `SCENARIO_SIMULATED` / `SOURCE_EXECUTED` / `HOST_OBSERVED`; never label paper PASS as executed PASS. The original frozen SIM4 designer saw source, so design a separate source-blind oracle later if that fidelity is claimed.

## 6. Quality metrics and ranking

### Non-negotiable correctness (disqualifier, not weighted score)

- Correct Role/Job/Task authority and Human approval/Criteria boundaries.
- Direct/JOB/Task modes, denied actions, STOPCHAT, Git uncertainty/recovery, source/Run/verification provenance and scope.
- Reviewer/CR and Tester independent sources/oracle; correct environment/product defect classification and truthful UNVERIFIED.
- Exact GSA3 public tool names, order, schemas, responses and relevant ERROR/UNKNOWN behavior during A0.
- No missing mandatory rule that prevents an Agent from detecting it must ASK/STOP/READ_MORE.

### Diagnostic scores after correctness

| Dimension | How to observe | Important counterexample |
| --- | --- | --- |
| Bug localization | correct owner/path identified before edit, wrong files opened, source hops and chars | Error emitter not root cause, shared validator hidden |
| Repair quality | number of edit→review→retest rounds, changed modules/functions, introduced regressions | Tiny fix violates upstream interface |
| Maintenance | cycles, exported interfaces, tests moved, review cost, file proliferation | 22 leaves with undocumented cross-imports |
| Context | actual per-Agent model Harness/Skills and optional source/docs/Knowledge/tool/handoff buckets | Source file bytes are not automatically model tokens |
| Throughput | observed wall-clock per equivalent Task, network/tool-call count/latency, cache assumptions disclosed | More tiny files create excessive fetch overhead |
| Reliability | stale index/Task/permission failures, correct fallbacks and question routing | Short Task packet conceals parent Goal |

Correctness first; do not invent a numeric score or threshold solely to declare a winner. Use observed difference and reproducible counterexamples. Roll back a harmful optimization even if its prompt is shorter; **A0 physical modularization is the chosen baseline direction**, but a failed extraction must be repaired/verified before proceeding.

## 7. Decision, rollback and ownership

- **Human decision already captured:** A physical architecture + B logical context; Role-specific Skill/Knowledge contextualization, debugging/maintainability as primary design goals.
- **No new special Human gate:** only existing scope/Plan/Criteria and code-execution approvals apply. This plan does **not** automatically authorize source modifications, merge or deploy.
- **Coder/Implementer:** only approved source branches/paths, exact test evidence, bounded reversible commits; must flag missing authority/requirements before writes.
- **Reviewer/Tester:** independently validate exact changed revision and negative cases; planning review is not a substitute for implementation verification.
- **Planner/Orchestrator:** own exact Goal/Task/branch identity, handoff, current provenance, dependencies, and stop/ask routing.
- **Rollback:** preserve pre-extraction GSA3 immutable source SHA and A0 known-good commit for each package; use Git revert/controlled rollback after failing parity and rerun all affected tests; do not hide failure or deploy an unverified build.
- **Commit/readback record:** every completed package logs source SHA, files changed, tests actually run, reviewer findings, variance, remaining UNKNOWN and next legal step.

## 8. Immediate next action and definition of plan completion

1. Finalize [GSA4-TECHNICAL-PROPOSAL.md](./GSA4-TECHNICAL-PROPOSAL.md) and exact symbol/import/test owner map against latest development HEAD. The G1A/G2A file counts remain **design candidates**, adjusted only with explicit dependency evidence.
2. Perform source-aware technical design review of parent/leaf API and error invariants, plus architecture-neutral negative fixtures and honest cost accounting; record findings (not fabricated independent PASS).
3. Under the existing valid implementation authorization, execute **G4-A0.1** then sequential A0 packages, verify real parity before a later context loader. If authorization is not present, stop at reviewed design and specify the missing existing permission rather than inventing a new approval procedure.
4. Only after all A0 parity succeeds, advance the separate reversible A1/A2/A3/A4 experiments using CT-00 already in the repository.

**Plan exit today:** detail milestones, criteria and technical proposal recorded with selected A-first direction. **No runtime/parity/CT-00 claim.**

## 9. Finding closure — source-specific design, not executed product proof

All seven findings from [GSA4-A-FIRST-TECHNICAL-DESIGN-REVIEW-20261104.md](./GSA4-A-FIRST-TECHNICAL-DESIGN-REVIEW-20261104.md) are now mapped to the **existing** source functions and tests in [A0 extraction map](./GSA4-A0-SOURCE-TO-MODULE-EXTRACTION-MAP-20261104.md).

- **TR-01:** actual catalog L1–607; existing GSA2/GSA3/LLC59/LLC60/runtime-logic test owners and import-aware loader.
- **TR-02:** real five Run, six Project Setup, three Checkpoint and three Evidence Repo registerTool blocks; source-executed ordered 58-tool check.
- **TR-03:** exact I1–I8 original index functions, cross-owner calls, misplaced L1486 planning schema correction and request-bound probe validator KEEP in createServer.
- **TR-04:** current workflow push only main; development SHA must be verified by workflow_dispatch, PR or recorded exact Node/Deno execution.
- **TR-05:** golden source fixture before extraction, preserve all current Role/Skill/tool/denial tests per bounded commit; no fabricated PASS.
- **TR-06:** same root-cause bug/test fixture across immutable GSA3 KEEP, A0, A1, A2 and A3, tracking repair/retest cycles and regressions; source-read saving alone is insufficient.
- **TR-07:** current `job-prepare-tool.ts` required_skills enum allows only `ui-coder-frontend`; actual `project_role_addins_resolve` and persisted Task/Run/Knowledge paths are different sources; A2 never presumes generic Skill injection.

**Finding disposition:** design omissions addressed by named source/test migration. No A0 code split, CI run, successful golden parity or repair benefit is asserted here; those are implementation acceptance evidence, not a second speculative research stage.
