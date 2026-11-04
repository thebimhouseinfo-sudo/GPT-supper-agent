# GSA4 — Research Plan: Agent Activation, Context Loading and Cohesive File Grouping

**Status:** RESEARCH PLAN — Human requested detailed refinement of the existing approved-criteria implementation plan (2026-11-04). Research authorization is distinct from product code-change authorization.  
**Owner:** GSA Context Efficiency Track R / CX-04.  
**Canonical parent:** [DETAIL-PLAN.md](./DETAIL-PLAN.md). This is its **GSA4 detailed research section**, not a second competing Project Plan or a new Job/approval gate.  
**Baseline:** Source-pinned GSA3 on main (observed GSA3 v58 at commit `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`); re-pin live branch SHAs before every test.  
**Working branch:** `upgrade/gsa-context-efficiency`. Keep production, GSA3 retained behavior, the existing CT-00 meter, and Track U independent.

## GOAL

Discover, compare, review and theoretically simulate **multiple** ways of structuring GSA's Agent/Harness/Skill/Context loading, inspired by sparse activation at the **Agent level** (not neural MoE). First reconstruct the **actual as-is** workflow, then evaluate grouping boundaries and selective loading by observable User-input scenarios. Choose the **simplest evidence-supported** solution that reduces total relevant context/navigation/tool cost without losing Human authority, mandatory rules, independent roles, correctness or maintainability. Only after a selected design passes its research review may a separate implementation phase consider physical file extraction, initially with **exact behavior parity**. Each later optimization stage must again compare options, review, simulate and justify its choice.

### Contract and non-goals

- **Research-first under approved Criteria WHAT-B and acceptance B-01/B-02/B-03**; no new Criteria WHAT/WHY in this plan. Research can conclude KEEP CURRENT / NO_BUILD. "NO_BUILD" for the prior narrow Task/Phase selector **does not decide** the new Agent-level research question.
- The existing **CT-00** meter was built before GSA1: **reuse** it, verify its entrypoint and calibration; do **not** rebuild it or count it as GSA4 savings. No invented ChatGPT host-token telemetry.
- This plan does **not** authorize app/runtime TypeScript edits, new Agent roles, production deploy, merge, Critic Reviewer activation, automatic Human decision or independent code execution.
- No invented host caching, implicit background Agent, hidden conversation-clearing control, new registry/database or free-form `verified=true` scope flag.
- Keep a **single canonical parent plan**; this file is a navigable child research specification. Existing GSA1/2/3 completion/decisions remain untouched.
- For every phase, record OPTIONS → EVIDENCE → REVIEW → SIMULATION (if meaningful) → DECISION → UNKNOWNS. State when something is static reasoning, source-executed, simulated, or observed in a real Host.

## 1. Source of authority and discussion trace

### 1.1 Authoritative links (read back/pin SHA for decisions)

- [APPROVED GSA Criteria](https://github.com/thebimhouseinfo-sudo/GSA-Projects/blob/main/projects/01a0f051-4353-7bff-8edf-46be4b44fd2f/CRITERIA.md) (observed blob `ff45d47435ae6cc9ae4acd5106bf945308fb4f95`) — B: research, bounded estimate, feasibility, measurement, safety.
- [Existing overall plan](./DETAIL-PLAN.md) — CX-04 and R-04 prior outline; this file elaborates R-04.
- [Historical technical proposal](./TECHNICAL-DETAIL-PROPOSAL.md) — narrow Role/Task/Phase selector was a *candidate*, not a frozen GSA4 architecture.
- [Prior narrow-selector NO_BUILD finding](./GSA4-CX04-FEASIBILITY-NO-BUILD-20261104.md) — retained as valid **bounded evidence for that proposed selector only**, not a veto on research.
- [Agent Contracts](../../architecture/AGENT-HARNESSES.md) — compare expected ownership and source-read permissions to discussion.
- [Runtime Harness Catalog](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/main/supabase/functions/gsa-mcp/harness-catalog.ts) — source for shared/role Harness, skills and `renderHarness()`.
- [Harness Skill MCP](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/main/supabase/functions/gsa-mcp/harness-skill-tools.ts); [Run dispatch](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/main/supabase/functions/gsa-mcp/run-execution-tools.ts).

### 1.2 Human discussion decisions (trace IDs)

A shareable URL to individual ChatGPT turns was not available. These IDs/quoted excerpts are **conversation references**, not fabricated permalinks; preserve for future verification against the original discussion.

| ID | Human direction / design implication |
| --- | --- |
| D01 | "gsa4 là 1 bản nâng cấp mạnh. còn gsa 1 2 3 thực ra chỉ là tối ưu gsa" — GSA4 is an architecture-level investigation. |
| D02 | "chỉ active các expert liên quan ... khác ở đây là agent" — investigate sparse Agent activation; not an assertion of speedup. |
| D03 | "trước hết phải vẽ được sơ đồ hoạt động của các agent" — map input → role → Harness → Skills → context → execution/handoff before optimization. |
| D04 | Shared Harness is sent to every role; investigate whether rules are role/task-specific rather than universally model-facing. |
| D05 | Technical Advisor proposed boundary: **critique Proposal/Criteria without opening project code**, brief instruction + critique skill. **Current Agent Contracts allow selective source reads**; record as a proposed contract delta needing alignment, not a silently established Criteria fact. |
| D06 | Apply responsibility/context classification to **all eight roles**, not Advisor only. |
| D07 | "tương tự index" — physical extraction into cohesive files while preserving import/export through a parent facade; separate behavior-preserving modularization from semantic reorganization. |
| D08 | "chưa vội ... vài phương án phân chia khác nhau có review và test giả định" — the earlier six-file idea is only **Option**, not a decision. |
| D09 | Prefer an actually available `simulate` skill to replay types of User requests; fallback to plainly labeled theoretical fixture-based simulation if unavailable. |
| D10 | Find other large files **actually co-read** in practice; evaluate grouping with the same procedure, not size alone. |
| D11 | "mỗi bước nên có options và chứng minh tại sao chọn" — record why each candidate wins or loses and delay research until the plan exists. |
| D12 | CT-00 was already built before GSA1; do not rebuild. |
| D13 | "có criteria rồi, có plan sơ bộ rồi, chỉ là sửa lại plan" — this is a **plan detail revision** under existing Criteria, not permission to mutate runtime source. |

## 2. Research method and falsifiable evidence

**Unit of observation:** one representative User input → receiving Agent / route → role contract → skill catalog/body → Project/Job/Task/Run/knowledge/source references → actual or hypothetical tool operations → output/evidence/handoff. Evaluate **both Direct Agent and durable Job** entry paths, including independent review/test and missing/stale metadata.

**Evidence levels:** 
1. `SOURCE_STATIC`: source signatures/arrays/imports and path + SHA; does not establish host reading or runtime activation.
2. `SCENARIO_SIMULATED`: predeclared fixtures and deterministic route/selection assumptions; does not prove model or host outcomes.
3. `SOURCE_EXECUTED`: actual tested local/source-bound function/call output with exact SHA and commands.
4. `HOST_OBSERVED`: actual connected Host/model workflow; tool calls, elapsed time and files opened only if observable.

Log **expected vs observed** separately. Record policy violations and missing mandatory context as **hard failures**, not a tradeoff against byte reductions. A safe mechanism can remain unproven (UNVERIFIED) without being called impossible.

**Metrics:** model-facing payload characters and UTF-8 bytes; tokenizer estimates clearly marked; files opened/total bytes/read hops/rereads; role/skill load count; tool calls; latency only where instrumented; extra verification work; quality/role correctness and false-positive/false-negative activation. Avoid double counting mirrored `content` and `structuredContent`. Keep CT-00 dataset and methodology comparable across options.

## Phase R0 — Scope, source pins and simulation harness discovery

### GOAL
Lock the research question, baseline, candidate-neutral scenario matrix and review method **before choosing a grouping**.

**Tasks:** read approved Criteria and live plans; verify development branch/production baseline; reuse the verified CT-00 entrypoints `test-lab/context-meter.cjs`, `test-lab/context-run-report.cjs`, `test-lab/mcp-context-capture.cjs` and `CONTEXT-METER.md`; validate existing test status rather than rebuilding the meter. The original `simulate` source is in `thebimhouseinfo-sudo/bootstrap/project-template/.agents/skills/simulate/SKILL.md` (found at blob `5b55a25057d2a33b320e54840f5578d81269c8b0`), but that source file does **not** prove the skill is installed/usable in this ChatGPT session. Distinguish source availability from installed and actually loaded capability; similarly for host `scenario-tester`. Define independent Reviewer checklist and a bounded way to record reproducible outcomes.

**Options:** (a) scope only Harness, (b) Harness + Skills, (c) complete end-to-end role/context loading. Compare investigation effort vs risk of optimizing the wrong source; propose (c) as audit scope while narrowing first experiments to high-value path. Also decide real `simulate` vs explicit theoretical substitute based on evidence, not name.

**Deliverables:** R0 charter, pinned source inventory, fixed representative scenarios, review findings, skill/meter capability states. **R0 gate:** review the research coverage/method, not a product-code approval.

## Phase R1 — As-is Agent activation and co-read/file inventory

### GOAL
Produce an evidence-tagged map of what GSA3 **does**, what the Harness **asks** the Agent to do, and what remains **unknown** about actual host consumption.

**Tasks:**
- Trace all eight roles (Orchestrator, Planner, Technical Advisor, Designer, Coder, Reviewer, Critic Reviewer, Tester).
- For every role: entry trigger, dispatcher owner, `get_agent_harness(role,mode)` producer, common/role text, suggested skills, optional actual `load_skill`, `run_begin` Task-skill injection, Project addins, canonical refs and live Git/Memory reads.
- Annotate: *always loaded*, *recommended*, *loaded on demand*, *not actually observed*. Trace one User request through first output/handoff and its continuation.
- Audit file hotspots: `harness-catalog.ts`, `index.ts`, `run-execution-tools.ts`, `selftest.ts` and other demonstrably substantial/repeated navigation surfaces.
- Distinguish **runtime import** (TypeScript loads module), **tool-produced text** (reaches the model), **model requested file read** (consumes navigation context). An import edge alone is not proof of co-reading.
- Identify shared instructions by ID and propose which role/phase owns each; do not remove any yet.

**Options:** source/import call graph alone, source + tool payload, or source + source-navigation records. Review completeness and traceability before accepting co-read conclusions.

**Deliverables:** as-is activation diagram; 8-row role matrix; file graph; instruction ownership table; evidence/unknown ledger. **No design selection at this phase.**

## Phase R2 — Candidate grouping options (paper only)

### GOAL
Select **candidate boundaries for evaluation**, without implementing them.

At minimum compare:
- **A — By Agent:** eight role modules, shared core, skills grouped separately; easy role discovery, risk of duplicated cross-role text.
- **B — By capability/lifecycle:** shared authority, intake, planning, execution, verification, testing, skills; cohesion by workflow but more cross-role dependencies.
- **C — Hybrid cohesive groups:** minimal common, several related role families + capability-specific skills, parent facade; minimize multi-file navigation without microfiles.
- **D — Minimal extraction:** preserve current one-file semantic grouping or move only base/roles/skills; strongest parity/ease, possibly limited context gain.
- **E — KEEP current layout:** zero change; mandatory comparator against unnecessary refactor.
- **F — Alternative proposed by independent Reviewer:** only if concrete source observations warrant another candidate.

For every candidate document: proposed tree, parent facade, exported APIs, import directions, typical file-open sequence per scenario, largest/smallest module size range, role ownership, duplication, merge/maintenance cost, behavior-parity surface and probable risk. Avoid arbitrary fixed file-count/line-count targets.

**Gate:** each option receives independent review. No "6 files" preselection.

## Phase R3 — Simulation of User entrypoints and context activation

### GOAL
Prove or falsify each grouping's proposed activation with **identical** User scenarios before coding.

**Fixture matrix** (expand with negative cases): **source-blind Designer** derives personas, User inputs and expected outcomes from Human decisions/Criteria **before** tracing code. Freeze design fixtures (ID/hash/version), then a separate Tracer maps actual paths. This conversation already inspected GSA source before research planning; thus this initial fixture list is only a **coverage sketch**, not proof of source-blind independent simulate design. Obtain an appropriately isolated source-blind pass before claiming full `simulate`-method fidelity.
1. Ordinary status/question in discussion (no new Job).
2. New feature / unclear requirement / clarification.
3. New or material Criteria change invoking Technical Advisor.
4. Advisor critiques Proposal only; no source read; does not mutate or return Reviewer PASS.
5. Brownfield Bootstrap with existing approved Criteria.
6. Planner creates/revises Plan; independent planning Reviewer, same-turn continuation.
7. Explicit Direct Coder with approved scope and no durable Job.
8. Durable Coder Task; required task-specific skill present.
9. Complex bug, debug skill only when applicable.
10. UI/UX Task: Designer vs frontend Coder specialization.
11. Code change with Git CAS/cursor/recovery.
12. Source Reviewer assesses exact diff without Planner/Coder hidden reasoning.
13. Human-invoked or preauthorized CR; ignores prior verdict until independent findings.
14. Tester verify/measure/probe and host tool unavailable.
15. Retest/CI failed, test failure vs environment failure.
16. STOPCHAT/restart with uncertain write.
17. Handoff to next role; newly selected context only.
18. Missing/stale Task/Phase and untrusted/forged caller metadata.

For each scenario, log expected and simulated:
`user_input → router/role → base/role/phase rules → suggested/loaded skill → Project/Job/Run/context files → extra calls → output/gate`; assess omissions, unnecessary loads and number of files opened. **Use original simulate skill only if genuinely available as a callable/loaded skill**; otherwise follow a documented, source-cited simulation-method proposal without claiming the host skill ran. The Bootstrap skill source requires Designer/Tracer isolation, frozen scenarios, and two-sided pass/fail external-boundary mock continuation. Simulated quality is NOT source-executed or host-observed PASS.

**Gate:** Reviewer checks negative cases, false activations, completeness, comparison fairness and no host claims.

## Phase R4 — Compare, challenge and choose grouping

### GOAL
Choose the simplest safe grouping based on recorded outcomes, not intuition.

**Disqualifiers:** loss of Human authority, Project/Job/Task scope, deny/CAS/readback, role independence, source provenance, error/unknown propagation, Direct Agent fallback or independent entrypoint. All other scores are diagnostic, not an invented Criteria threshold.

**Comparisons:** scenario coverage, excess/necessary context, expected co-read/navigation cost, role boundaries, code cohesion, added files/import edges, change propagation, operational tool-call overhead and uncertainty. Compare each option to E/KEEP. Reviewer lists failure cases, alternatives and reasons for acceptance/rejection. If unclear, mark INCONCLUSIVE and propose the smallest targeted experiment.

**Decision:** select candidate **for design** or KEEP/no build with evidence; do not implement yet. Pin decision and reviewed source revision.

## Phase R5 — Modularization design and parity-test plan

### GOAL
Turn selected grouping into a **behavior-preserving extraction specification**, with no semantic reallocation yet.

**Options:** same parent facade with named exports; small cohesive imports; alternative discovered via dependency graph. Design golden text snapshots (all eight role Harnesses, 11 current skill bodies and mappings), `get_agent_harness/load_skill` schemas, metadata/JSON fallback, registration parity, negative auth/errors, Direct/JOB parity. State exactly what must remain byte/behavior identical and source files affected; review/approve prior to implementation.

**Separate later implementation checkpoint:** write only after valid implementation authorization. Physical file extraction ≠ reduced model-facing context; never claim a win until later measurement.

## Phase R6 — Context organization after grouping (new multi-option study)

### GOAL
Investigate selective loading **after** cohesive grouping is understood.

**At least these options:** (1) shorter universal core + role-local instruction; (2) existing lazy role/skill loading with better ownership and conditional skills; (3) verified Task/Phase selection with fallback where trustworthy runtime facts exist; (4) tool-enforced authority with minimum model instruction (prove each rule's actual backend enforcement); (5) KEEP. All options preserve required instruction delivery to the responsible role.

Examine Advisor's Human-requested proposal-only boundary as a **contract delta** against existing Agent Contracts; do not silently rewrite already approved canonical behavior. Evaluate all eight roles. Re-run R3 scenarios and independent review for every meaningful option.

## Phase R7 — Large/co-read file hotspots (same experimental method)

### GOAL
Examine other oversized source/knowledge files **only when actual same-task co-read/reread evidence** supports costly navigation.

For each candidate hotspot, record real file size, responsibility clusters, callers/consumers, observed co-read sequence, candidate grouping alternatives A/B/C/KEEP, import cycle risk and required parity tests. Options → independent review → scenario simulation → documented choice. Do not split unrelated files solely to chase smaller numbers or claim savings from tree structure alone.

## Phase R8 — CT-00 evaluation, technical choice and next authorization

### GOAL
Evaluate expected end-to-end benefit, risk and implementation cost before proposing GSA4 code.

Reuse CT-00's existing executable/fixtures. Verify it is operational. Measure source-pinned baseline and comparable candidates where source-executed tests are authorized and available; theory stays separately labeled. Record chars/bytes, token estimate, call counts/rereads/navigation, instrumented latency and scenario quality. Distinguish agent orchestration cost from model-input text size. Preserve the earlier narrow selector NO_BUILD as one evaluated option.

**Deliverables:** design rationale with options ruled out, revised Technical Proposal, source/contract impact, Reviewer findings, measurement evidence, PROCEED/NARROW/STOP decision and the **separate** later implementation/benchmark plan if applicable. No automatic GSA4 code, merge or deploy.

## 3. Gate / reporting format

For **each R phase**, store:

| Field | Requirement |
| --- | --- |
| BASELINE | repo/ref/commit, exact files/sha, observed host/meter state |
| OPTIONS | candidate mechanism and KEEP alternative; what problem it addresses |
| HYPOTHESIS | expected loading/navigation/context savings and tradeoffs |
| REVIEW | independent findings, role/safety constraints, revisions |
| SIMULATE | fixture IDs; STATIC vs SIMULATED vs SOURCE_EXECUTED vs HOST_OBSERVED; negative cases |
| COST | bytes/chars/estimated tokens, calls, navigation and risk; actual vs estimated |
| DECISION | selected/rejected and why; unmet evidence/unknowns; reversible next step |

**Research exit:** R0–R8 evidence supports an independently reviewable technical choice; implementation follows the existing Plan/Criteria authority and separate Human execution approval, not an extra research-only gate.