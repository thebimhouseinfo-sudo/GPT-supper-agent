# GSA4 — RESEARCH A RESULT: Role / Skill file splitting and task-specific loading

**Status:** COMPLETED PAPER RESEARCH + STATIC TRACE; **NOT** runtime PASS, implementation approval, verified independent `simulate`, or deployment decision.
**Date:** 2026-11-04.
**Execution:** DIRECT_AGENT — RESEARCH ONLY; no GSA plugin, no new Job/Bootstrap, no Criteria/code/Plan edits, no merge/deploy.
**Development branch inspected:** `upgrade/gsa-context-efficiency`; branch HEAD observed at start `42790eec950d921d627175693baddcde62a593f0`. It may move independently; source accounting remains pinned.
**GSA3 source pin:** `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`.
**Frozen user journeys:** `GSA4-SIM4-FROZEN-USER-JOURNEYS.md`, observed blob `b266d3f15e619413b7a3c40d24e7a75664bdbebf`.
**Deliverable:** this report only. The hypothetical splitting study does not override the broader research plan's rule that real selective-loader implementation/research approval follows physical extraction + parity.

## GOAL

Determine, from pinned GSA3 source and the existing frozen human-derived journeys, the *paper* context cost of **A: 1 facade + 1 Shared + 8 Role + 11 Skill files** without changed behavior (BASE-A); then quantify incremental, non-overlapping candidate opportunities A-OPT1..4, failure branches, file/tool-call tradeoffs, security/independence risks, and what must be verified before deciding to build.

## 1. Evidence, method, and boundary

Read the development branch's `GSA4-RESEARCH-PLAN.md`, `GSA4-R1-R3-SPLIT-OPTIONS-PAPER-SIMULATION-20261104.md`, `GSA4-A-B-FOLLOWON-FORECAST-20261104.md`, and frozen SIM4 file. Inspected `harness-catalog.ts` and its consumers `harness-skill-tools.ts` / `run-execution-tools.ts` at the pinned source SHA. Read `bootstrap/project-template/.agents/skills/simulate/SKILL.md` from the Bootstrap repository solely for methodology. **No Chat B result/report was read.**

Evidence status:
- `SOURCE_STATIC`: exact TypeScript source-slice character counts, symbol/entry lists and static tool contracts. This is **not** measured model context, runtime files read, or executed program behavior.
- `DOCUMENTED_PRIOR_OBSERVATION`: eight `get_agent_harness` lengths and the already published shared-rule role-selection proxy from `GSA4-A-B-FOLLOWON-FORECAST-20261104.md`. These were previously identified as live deployed-GSA3 observations; **not independently re-executed in this study**.
- `PAPER_TRACE`: four SIM4 journeys mapped to role/skill calls, assuming the specified conditions below. Branches are design hypotheses, **not observed automatic Agent transitions**.
- `NOT PERFORMED`: actual original `simulate` skill invocation, source execution, host Agent activation, tokenization, CT-00 capture, real file-open counts/latency, role-selector implementation, safety regression execution. Source availability of the `simulate` skill does not imply the ChatGPT host loaded it.

**Two completely separate budgets** (do not add them):
1. **Source navigation proxy**: if an Agent/researcher *explicitly inspects the hypothetical TypeScript files*, number of whole-file source slices opened and characters read. Imports do not count as model reads. Normal GSA Agent workflows need **zero direct reads of these TypeScript source files**: the server imports them and sends selected text instead. Proxy values are not automatic context cost.
2. **Model-facing text**: `harness_text` returned by `get_agent_harness(role,mode)` plus one chosen `skill_text` per hypothesized `load_skill` invocation. Counts exclude JSON keys, description/catalog metadata, tool envelope, unrelated Project data and the duplicate JSON rendering in MCP `content`. The same data in `structuredContent` and `content` must **not** be counted twice. NEXT `run_begin.required_skill_contexts` must count *instead of* an overlapping `load_skill`, not in addition.

All character counts here use JavaScript string lengths from pinned UTF-8-decoded source, not tokenizer counts; UTF-8 bytes/host tokens/latency were not measured. Lines, whitespace, syntax wrapping, future import/export scaffolding and new file separators can change after real extraction.

### 1.1 Source-grounded runtime contract

- `harness-catalog.ts` exports `BASE_AGENT_HARNESS`, `ROLE_HARNESSES`, `ROLE_SKILLS`, `ROLE_HOST_SKILLS`, `RUNTIME_SKILLS`, `renderHarness`.
- `harness-skill-tools.ts` registers `get_agent_harness` with `role` one of eight and `mode=JOB|DIRECT_AGENT`; it renders BASE + exactly the requested Role with `includeProgressiveSkills:false` and returns only *suggestions* of GSA skills and host skills. It does not call `load_skill` automatically.
- `get_skill_catalog` returns names/descriptions only; `load_skill(name)` returns the *entire* chosen body. Eleven GSA skills are real: `delegation` is an **unquoted TypeScript key** and must not be accidentally omitted by a quote-only source parser.
- `ROLE_SKILLS` suggestions: Orchestrator = delegation; Planner = critical-challenge, job-planning, delegation; Advisor = none; Designer = delegation; Coder = coding-loop, delegation; Reviewer = review-evidence, planning-review; Critic Reviewer = review-evidence, critic-review; Tester = testing-evidence. `debugging` is conditional for nontrivial failure; `tester-lab` is optional; `ui-coder-frontend` may be Task-required. Suggested does **not** mean loaded.
- `ROLE_HOST_SKILLS.tester=['scenario-tester']` is a **ChatGPT-host-managed reference**, not a GSA `load_skill` body. Presence ≠ loaded or successfully executed.
- `run_begin` allows durable Run roles `planner|designer|coder|reviewer|tester`, not all eight roles; NEXT may inject `required_skill_contexts` for Task-declared skills, with scope/approval/task/revision/claim guards. A Coder product-source write still requires independently checked authority and source state.
- Shared instruction on new Human messages preserves current receiving Agent; if none, Planner is the default. An automatic Planner→Coder→Reviewer transition cannot be inferred merely from these exports. Orchestrator dispatch and independent direct-role handoff must be separately established in a real Host trace.
- Technical Advisor is **not** activated for ordinary feature planning or Bootstrap. Criteria finalization or material WHAT/WHY changes require the special Human-triggered route. CR is Human-invoked or explicitly preauthorized (including Bootstrap's authorized CRL path); not a compulsory extra Agent for every Test or Task.

## 2. BASE-A hypothetical file inventory — exact source attribution

**Allocation rule for reproducibility:** partition the **existing** 85,330 characters, without introducing or guessing bytes: (i) source prefix before `export const ROLE_HARNESSES` = Shared; (ii) each top-level `ROLE_HARNESSES` object entry = its own Role file; (iii) each `RUNTIME_SKILLS` object entry = its Skill file; (iv) all remaining declaration envelopes, map declarations, host-skill mappings, comments and `renderHarness` = facade. A role/skill entry's slice ends immediately before the next entry (or enclosing closing brace). This assigns every original source character **exactly once**. These are *virtual content allocations*, not asserted final compiled .ts file sizes; syntactic wrappers/imports will need real parity-checked extraction.

| Hypothetical file (relative to `gsa-mcp`) | Responsibility / source content | Source chars | Agent(s) using it | When opened as *source* / runtime text |
| --- | --- | ---: | --- | --- |
| `harness-catalog.ts` (facade) | Exports, map envelopes, `ROLE_SKILLS`/`ROLE_HOST_SKILLS`, `renderHarness`, source links | **1,763** | all developers/diagnostics | Source only when locating entrypoints; runtime import is **not** model read |
| `harness/shared.ts` | Entire original `BASE_AGENT_HARNESS` including all shared policies | **15,285** | all 8 roles | Source only on deliberate audit; BASE included in every returned `harness_text` |
| `harness/roles/orchestrator.ts` | routing, durable state, planning/CI/test repair orchestration | **7,717** | Orchestrator | Source optional; Role included only for Orchestrator |
| `harness/roles/planner.ts` | intake, brownfield, planning, approval/review/revision | **9,094** | Planner | Source optional; Role included only for Planner |
| `harness/roles/advisor.ts` | Criteria consultation and technical impact | **1,681** | Advisor | only Human-triggered consultation; not S1–S4 normal path |
| `harness/roles/designer.ts` | UI/UX/asset contract, non-implementation | **1,621** | Designer | conditional UI/UX work |
| `harness/roles/coder.ts` | scope-bound source work, self-check, repair, Goal Recheck | **4,333** | Coder | authorized implementation/repair |
| `harness/roles/reviewer.ts` | independent planning or code review, exact revision | **3,838** | Reviewer | applicable independent review |
| `harness/roles/critic_reviewer.ts` | independent CR, own evidence/verdict before prior Reviewer | **2,176** | Critic Reviewer | explicit/preapproved CR/CRL only |
| `harness/roles/tester.ts` | independent checks, capability/CI classification, retest | **5,323** | Tester | authorized verification |
| `harness/skills/debugging.ts` | nontrivial defect and failed-retake cause analysis | **1,585** | Coder | conditional `load_skill('debugging')` |
| `harness/skills/critic-review.ts` | CR provenance, independent evidence workflow | **1,265** | Critic Reviewer | on applicable CR Run |
| `harness/skills/critical-challenge.ts` | challenge assumptions/alternative designs | **2,462** | Planner | relevant feasibility/new feature |
| `harness/skills/job-planning.ts` | brownfield/goal/job/task/approval planning | **6,244** | Planner | durable planning |
| `harness/skills/coding-loop.ts` | scoped code/inspect/check/repair/Goal Recheck | **4,739** | Coder | relevant coding Run |
| `harness/skills/delegation.ts` | minimum handoff information, role authority | **1,267** | Orchestrator, Planner, Designer, Coder | only when delegating |
| `harness/skills/planning-review.ts` | independent reviewed-plan contract | **3,295** | Reviewer | plan revision review |
| `harness/skills/review-evidence.ts` | exact-source code review | **1,444** | Reviewer, Critic Reviewer where relevant | independent source review |
| `harness/skills/testing-evidence.ts` | VERIFY/MEASURE/PROBE, capability, retest, failure routing | **4,439** | Tester | relevant testing Run |
| `harness/skills/tester-lab.ts` | Tester-specific lab methods | **2,656** | Tester on demand | not in standard Tester suggestions; only demonstrated relevant explicit load |
| `harness/skills/ui-coder-frontend.ts` | frontend/UI implementation and browser self-QA | **3,103** | frontend Coder | exact frontend Task classification/required skill |

Totals: facade **1,763** + Shared **15,285** + 8 Roles **35,783** + 11 Skills **32,499** = **85,330 source characters across 21 conceptual files**. All original content remains; no alleged saving from physical split. The original full-file read would have been 85,330 source chars. Source indexes and program text payload have different measurement units and should never be summed.

Source-**body** lengths, measured by parsing each body string array and its `join('\n')` (not .ts syntax): `debugging` 1,331; `critic-review` 1,004; `critical-challenge` 2,184; `job-planning` 5,861; `coding-loop` 4,174; `delegation` 1,006; `planning-review` 2,974; `review-evidence` 1,178; `testing-evidence` 3,929; `tester-lab` 2,170; `ui-coder-frontend` 2,648. Total of all eleven 28,459 chars, **but no Agent should load all eleven by default**.

Previously documented complete `get_agent_harness` `harness_text` lengths, by role: Orchestrator 22,420; Planner 23,716; Advisor 16,502; Designer 16,463; Coder 19,085; Reviewer 18,619; Critic Reviewer 16,972; Tester 20,054. These are model-facing returned texts (BASE + Role), **not the Role .ts slice sizes**.

### 2.1 Source-read counts: strict interpretation

**Operational source-file reads caused by `get_agent_harness` or `load_skill`: zero.** TypeScript runtime imports are not visible source-content reads by the model. The four source-read columns below are an explicitly counterfactual *debugging/source-navigation* task: every activated Agent inspects its facade + Shared + Role whole file, then each relevant skill source once. **No cross-Agent source-read cache** is assumed for the main count; “unique” is a lower bound assuming ideal reuse, NOT a measured host cache. Role switching must not share private Reviewer/Tester conclusions or prior Coder reasoning. Runtime still returns the full BASE+Role and complete loaded Skill under BASE-A, independent of source-layout choice.

## 3. Four frozen user journeys: activation and handoff

All journeys use SIM4's user intent and user-facing oracle; added **trace assumptions** below are conditional states, not retroactive changes to frozen scenarios. Arrows denote *desired/authorized separate role activations in a paper trace*, not a verified host dispatcher automatically performing them. If a receiving Agent is already active, keep it; otherwise Planner is the GSA3 default. Where an active Orchestrator is assumed, an actual runner must establish that from durable state.

### S1 — Brownfield Bootstrap, existing approved Criteria

**Paper branch condition:** the existing Plan or Milestones needs a within-Bootstrap repair; otherwise the short path is **Planner only**, and no Reviewer/CR/implementation is automatically justified.

~~~text
Human: "Bootstrap lại dự án này; Criteria đã có"
  → Planner [get_agent_harness(planner); load job-planning]
    ↳ inspect existing approved Criteria/Plan/Milestones and source readiness
    ↳ bootstrap checklist; only fix missing/inadequate plan material
  → Reviewer [get_agent_harness(reviewer); load planning-review]
    ↳ independent plan revision / exact evidence; CHANGES_REQUIRED→Planner repair→review
  → Critic Reviewer [get_agent_harness(critic_reviewer); load critic-review]
    ↳ only the Bootstrap-authorized CRL branch; independent findings first
  → Planner [get_agent_harness(planner); no mandatory skill reload assumed]
    ↳ reconcile/read back readiness and complete authorized checklist; STOP before product code
Result: READY / NEED_HUMAN / PAUSED_NO_PROGRESS with exact evidence, not new duplicate Job.
~~~

Role invocations **Planner, Reviewer, CR, Planner** = 4; skill loads **job-planning, planning-review, critic-review** = 3. Required across handoffs: correct identity/Criteria, exact SHA/readback, independent review, no code approval. Suggested but not necessarily loaded: `critical-challenge`, `delegation`, `review-evidence`. Advisor and Coder are **inactive** in the main path.

Failure cases: missing Criteria authority, disputed branch or incompatible plan source → reconcile independently, then NEED_HUMAN if unresolved; unauthorized read/write → STOP, never another tool route; repeated unchanged checklist signature → PAUSED_NO_PROGRESS; existing verified plan needs no fake CR cycle.

### S2 — Continue approved Coding Job

**Paper branch condition:** current durable NEXT Job and exact Task are already approved, Run/cursor is reconcilable, active Orchestrator controls topology, basic test succeeds.

~~~text
Human: "Tiếp tục code Task đang dở đến khi hoàn thành và kiểm tra"
  → Orchestrator [harness orchestrator; load delegation]
    ↳ inspect Job, Task, source revision, last Run/cursor, legal next step
  → Coder [harness coder; load coding-loop or reuse exact Task-required injection]
    ↳ run_begin and guards; resume/reconcile uncertain mutation; edit scoped source
    ↳ inspect diff / actual tests / exact Goal Recheck
  → Reviewer [harness reviewer; load review-evidence]
    ↳ independently inspect requirement + exact diff/revision
  → Tester [harness tester; load testing-evidence]
    ↳ independently test source-target revision and classify result
  → Orchestrator [harness orchestrator]
    ↳ read back Verification/closure; report or route next legal action
Result: exact verified completion or a real blocker; never guessed success.
~~~

Five separate role invocations; four skill bodies loaded in the selected paper path. Without an already active Orchestrator, GSA3 defaults to Planner; Planner may route to the owning role, but an extra activation must be measured, not silently assumed absent. A normal first test does not require `debugging`, `tester-lab` or `scenario-tester`. The latter may be recommended for scenario discovery, but host-load success remains unknown.

Failure cases: missing Human execution approval/Development Branch/Task skill → block Coder write; changed Git HEAD or unknown write result → exact reread + cursor/recovery analysis before retry; denied scope → STOP, not tool bypass; reviewed PASS on stale revision → invalid; test RED/CI runner unavailable → classify then route instead of false PASS.

### S3 — Test → fix product bug → independent retest

**Paper branch condition:** verified reproducible **nontrivial** product defect (as opposed to a runner outage) and preauthorized bounded repair. The debug body is therefore intentionally loaded once.

~~~text
Human: "Test bug này; nếu fail do sản phẩm thì sửa và test lại"
  → Orchestrator [harness orchestrator; load delegation]
  → Tester [harness tester; load testing-evidence]
    ↳ independent reproduction / exact target / capability / PRODUCT_FAILURE verdict
  → Coder [harness coder; load coding-loop + conditional debugging]
    ↳ root cause, regression oracle, scoped repair, checks and Goal Recheck
  → Reviewer [harness reviewer; load review-evidence]
    ↳ independent changed diff/regression-oracle review
  → Tester [NEW harness tester; NEW testing-evidence body]
    ↳ retest failed and impacted regression cases on repaired revision
  → Orchestrator [NEW harness orchestrator]
    ↳ close or route further changed-evidence repair
Result: evidence-backed success, PRODUCT_FAILURE again, or BLOCKED/UNVERIFIED.
~~~

Six separate activations; six skill-body loads (Tester skill reloaded on separate invocation, without an invented cache). If the actual failure is **ENVIRONMENT_FAILURE**, stop the product-repair branch: probe authorized alternatives, report UNVERIFIED if needed; do not dispatch Coder for an unproven product bug. If retest fails due to an unchanged root cause, investigate evidence and bounded loop/no-progress limit; never blind patch or manufacture PASS. Tester never mutates product source. Review and retest must be genuinely independent.

### S4 — New feature: planning, Human approval, execution

**Paper branch condition:** an existing project, a feature outside existing approved scope, clarified as **non-UI** for the quantitative example only. If UI/UX is material, add a separate Designer activation and Task-specific `ui-coder-frontend` body; if Criteria WHAT/WHY materially changes, consult Advisor only after Human Criteria-change intent.

~~~text
Human: "Thêm tính năng mới rồi triển khai và test"
  → Planner [harness planner; critical-challenge + job-planning]
    ↳ classify/clarify; skeleton; review assumptions, plan and gates
  → Reviewer [harness reviewer; planning-review]
    ↳ independent planning review; findings → Planner rework as needed
  → Planner [harness planner]
    ↳ present verified PASS Plan
  → STOP: EXPLICIT HUMAN EXECUTION APPROVAL REQUIRED
  [Only after a new Human approval and revalidated Job/branch/revision]
  → Orchestrator [harness orchestrator; delegation]
  → Coder [harness coder; coding-loop]
  → Reviewer [harness reviewer; review-evidence]
  → Tester [harness tester; testing-evidence]
  → Orchestrator [harness orchestrator]
Result: approved implementation verified, or bounded blocker/repair route.
~~~

Eight role activations in **two authorized stages**, seven selected skill bodies. **Before approval only three role activations**; the remaining five may not occur. Plan-review failure can cause more Planner/Reviewer cycles, not an unapproved leap to coding. Criteria change and UI condition add appropriate roles/skills only when the true external conditions hold. No synthetic execution approval.

### 3.1 What is certainly necessary vs only suggested

| Evidence/behavior | Mandatory under relevant triggered branch | Only suggested / optional / unverified |
| --- | --- | --- |
| Role Harness | Selected role's full BASE+Role returned by `get_agent_harness` in GSA3 | Whether a host actually switched Agent as simulated |
| Skill body | NEXT declared Task skill from `run_begin.required_skill_contexts` or an explicitly invoked `load_skill` body | Every name in `suggested_skills`; no default bulk load |
| Planning | Exact current plan, independent review, Human approval for **product implementation** | New Job on discussion/status or duplicate Bootstrap |
| Coding | approved scope, read/authority/CAS, correct branch/cursor, actual diff/test evidence | optional debugging on ordinary feature implementation |
| Testing | independent target/revision and actual observed checks; truthful classification | host-managed scenario-tester loaded/running merely by name |
| CR/Advisor | only their explicit/preauthorized conditions | blanket CR on every task; Advisor on ordinary feature/Bootstrap |
| Source navigation | only files deliberately requested and received by the Agent | runtime imports, links in `canonical_refs`, AGENTS.md references not actually opened |

**Excluded context** (deliberately NOT assigned sizes or included in numeric totals): Project Criteria/Plan/Milestones/Decisions and approvals; actual product sources/diffs/build files/tests; Git/CI logs and Verification/Run/Job/cursor snapshots; Project Memory, Project addins/AGENTS.md and task-required skill contexts if not explicitly loaded in this paper trace; `docs/architecture/AGENT-HARNESSES.md` and all other `canonical_refs` merely cited but not opened; Bootstrap repository docs; ChatGPT hidden system prompts/host context, serialization overhead, tool schemas, chat history and external skill bodies. These can dominate total real context and require a separate instrumented study.

## 4. BASE-A context tables — identical four-scenario accounting

**One activation:** one returned `get_agent_harness` text and explicitly selected `load_skill` bodies (or equivalent *nonduplicated* Task injection). Repeated activations count again; no invented cross-Agent cache. “Source opens/no cache” counts the conditional audit path `facade + Shared + role` per activation, plus one Skill file per selected load. “Unique files” are only a theoretical lower bound when sources can be reused without violating role isolation. They are **not** claims of actual model source reads.

| Journey | Role activations / Skill loads | Returned Harness chars | Loaded Skill chars | BASE-A model-text sum | Source proxy chars (no reuse) | Source opens (no reuse) | Unique source files / chars |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| S1 Bootstrap/CRL repair | 4 / 3 | 83,023 | 9,839 | **92,862** | 103,198 | 15 | 8 / 42,960 |
| S2 Continue coding | 5 / 4 | 102,598 | 10,287 | **112,885** | 126,057 | 19 | 10 / 50,148 |
| S3 Product bug repair/retest | 6 / 6 | 122,652 | 15,547 | **138,199** | 154,452 | 24 | 11 / 51,733 |
| S4 New feature + Human approval | 8 / 7 | 168,649 | 21,306 | **189,955** | 211,228 | 31 | 14 / 71,243 |
| **Four paper traces** | **23 / 20** | **476,922** | **56,979** | **533,901** | **594,935** | **89** | do not sum unique files across scenarios |

Source proxy per activation = `1,763 facade + 15,285 Shared + that Role's sourceChars + each requested Skill sourceChars`. Example S1: 4×(1,763+15,285) + 2×9,094 + 3,838 + 2,176 + 6,244 + 3,295 + 1,265 = **103,198** chars over **15** hypothetical file opens. The ***real*** baseline number of TypeScript source files opened by the model while simply calling harness/skill MCP tools remains **0 unless separately requested**. The table's 533,901 chars are **summed activations**, not peak live context within one model window and not actual token usage.

### 4.1 Failure/branch sensitivity (not hidden inside totals)

- S1 already-ready branch: Planner alone may answer/complete; no mandatory new Job, plan review or CR. If only `get_agent_harness(planner)` is delivered, **23,716** Harness chars, 0 selected Skill body chars, and a hypothetical **26,142 source chars / 3 file opens** for a deliberate source audit. If Planner actually loads `job-planning`, add its 5,861 model chars and 6,244 source-proxy chars/one open.
- S2 missing current authority/revision: may stop before Coder/Reviewer/Tester; the 5-activation path is not inevitable. Unknown write outcome requires readback/cursor reconciliation, potentially more tool calls and context omitted from this analysis.
- S3 infrastructure/host failure: **no justified product-repair Coder** until evidence establishes PRODUCT_FAILURE. Simple bug not requiring debugging would subtract **1,331** model-facing Skill chars and **1,585** source-proxy chars/one open from its main path.
- S4 no Human approval: **STOP at planning**; post-approval Coder/Reviewer/Tester and Orchestrator must not be loaded for actual execution. Rejected planning review adds bounded Planner/Reviewer activations. Material Criteria changes conditionally add Advisor/Human consultation; UI feature conditionally adds Designer and optional frontend Skill. Source and returned payload change accordingly.
- For any scenario: `get_agent_harness` or `load_skill` authentication/permission error, unavailable host capability, missing required task skill, stale revision, missing exact evidence or no-progress guard → FULL ERROR / STOP / BLOCKED / UNVERIFIED, never pretend that a theoretical route actually ran.

## 5. A-OPT1 — Role policy ownership (Shared → verified core + role-selected policy)

**Trigger:** trusted `role` already in `get_agent_harness`. Preserve exact Human/scope/authorization/permission/CR/recovery obligations, but deliver only the common mandatory core plus policy rules valid for that Role. Avoid literal copying of shared policies into every role file; instead maintain one canonical checked policy inventory and keyed assembler. Role selection needs **no new guessed Task/Phase input**.

**Measured/proxy basis:** the development branch's existing A/B forecast provisionally classified shared rules (18 universal core items/3,261 chars and role-specific entries out of 49 substantive rules). Its *not-yet-validated* projected full Harness lengths are: Orchestrator 22,078; Planner 22,422; Advisor 5,932; Designer 7,669; Coder 13,308; Reviewer 12,127; CR 8,738; Tester 12,679. The projected diff from the eight documented full Harness lengths is used **once per activated Role**, not once per source file. A missing/unknown role fact → return full GSA3 Harness.

**Across S1–S4:** savings 17,314 / 20,328 / 27,703 / 29,408 characters respectively; **94,753 model-facing characters (17.75% of BASE-A combined)**; after A-OPT1 **439,148**. Source-file read savings: **none proven**; naïve duplicates may *increase* source sizes, especially multirole workflows. Tool-call overhead: **0** if source assembly remains one `get_agent_harness` call and independent role authentication; otherwise unknown. Complexity: **MEDIUM** for selector assembly, **HIGH** for authoritative policy mapping, conditional CR/Human requirements and regression tests. The currently proposed ownership set is **not** approved or security-validated.

**Mandatory omission risk:** e.g. critical source-write fences may appear irrelevant to Advisor but still constrain delegated actions; Planner may fail to trigger rightful review; Reviewer/Tester might inherit Coder state; a role receiving a forged role string could omit policy. Enforce typed authenticated role and backend permission guards; test each policy entry by adversarial omission scenarios. **Recommendation: candidate for later review, not safe to implement merely because 17.75% is forecast.**

## 6. A-OPT2 — Task-specific sections *within* a Role

**Trigger:** verified, immutable active Job/Task/revision and task class, or an explicit known direct-role activity (e.g. current review of Plan vs source diff); never use arbitrary chat text or caller-supplied unverified `phase` to drop mandatory rules. Keep Role `authority`, `outputs`, baseline policy and all common safety/guard rules; select only demonstrably conditional **Role loop instructions**. On unknown mode/task, source ambiguity, retest/plan-change transition, or stale state → full existing Role loop.

**Non-overlapping worked paper selector applied *after* A-OPT1:** only the following actual Role-loop entries were excluded in these favorable conditions, with exact line-text lengths + rendered numeric-list markers and newlines:
- S1, Planner two activations: `CLASSIFY PRODUCT WORKFLOW` (loop 15) after non-UI established, and `RUNTIME SUPERSESSION` (loop 25) when not resuming a NEXT PLAN_GAP/SPEC_GAP Job. All other Reviewer/CR rules retained. Saving **1,236**.
- S2, active Orchestrator twice: skip planning-only loop 7–10 plus plan-revision loop 20 **only after** the approved current Job is observed unchanged; Reviewer source-code review skips planning-only `PLAN GOAL DRIFT CHECK` (loop 4). Saving **5,180**.
- S3, same Orchestrator exclusions; Reviewer source-code review omits only `PLAN GOAL DRIFT CHECK`. Coder's repair, Tester retest, classification and all recovery guards stay. Saving **5,180**.
- S4, Planner twice omits `RUNTIME SUPERSESSION` for the newly created Plan; post-approval Orchestrator twice omits planning-only loops 7–10/20 once approved state established; Reviewer on the **code review** invocation omits `PLAN GOAL DRIFT CHECK` but Reviewer on the **planning** invocation retains it. Saving **6,014**.

Total **17,610 more model-facing characters (3.30 percentage points of original BASE-A)**; cumulative after A-OPT1 + A-OPT2 **421,538**. No source-navigation reduction established; same number of Role harness calls if assembled server-side. Extra tool calls: **0** with a trustworthy already-available state selector; otherwise additional verification/readback calls (counts unknown) or return full Role. Complexity **HIGH**: section identifiers must remain stable, conditional content must not be dropped on state transition, and independent Reviewer/Tester must not reuse the predecessor's hidden task-classification verdict. Every cut is conditional, not a blanket always-valid deletion. Preferred as a **separate experimental stage after A-OPT1 is safe**, not a forced optimization.

## 7. A-OPT3 — Progressive sections *within* large Skill bodies

**Trigger:** a Skill is actually relevant and loaded (`load_skill` or NEXT required Task context); its verified activity subclass justifies selecting a core plus optional section. GSA3 already progressively loads whole **skills**; that existing laziness is **not credited** as a new win. A finer section API or linked body slices is needed to save additional text. Branch change must load missing section before acting, or fallback to the original full body.

Measured original body text used for the following *non-overlapping* optional parts (string values plus internal newline separators, not .ts source):
- `job-planning` UI-specific lines 8/9/10/10A: **1,375** chars deferred only for confirmed non-UI work; `BOOTSTRAP CAPABILITY REUSE`: **501** chars deferred only if no skill gap exists.
- `coding-loop` “AUTONOMOUS CI RED/GREEN” section: **1,315** chars deferred if exact checks are actually green; it must be fetched immediately when RED, unavailable or classification unclear.
- `delegation` frontend-only handoff clause: **255** chars deferred for verified non-frontend Task.
- `review-evidence` high-risk changed-test branch: **290** chars deferred only after Reviewer independently establishes that it is inapplicable.
- `testing-evidence` “RETEST/ROUTE” tail: **1,300** chars deferred only in a positive initial-test branch; before handling any failing/incomplete test it must be loaded. Do not bias the Tester into PASS by withholding failure routing.

Paper favorable-path additional savings: S1 **1,375**; S2 **3,160** (255+1,315+290+1,300); S3 **255** (non-UI delegation only; CI/error and retest instructions retained); S4 **5,036** (1,375+501+255+1,315+290+1,300). Sum **9,826 model-facing characters (1.84 percentage points of original BASE-A)**; cumulative after A-OPT1+2+3 **411,712**. Source files already only target relevant Skills in BASE-A: no new direct source-file saving can be claimed without a chosen physical section representation.

Extra calls: **0 on a branch whose section was safely omitted** if a single structured `load_skill` call can return the selected text; **+1 or more** per deferred section later required, possibly worse than full load in repeated failure/recovery. The main table counts the favorable decision-dependent branches and **does not** claim a successful future loader. Complexity **MEDIUM** for stable section inventory / serialization, **HIGH** for dynamic load/fallback, correctness testing and Task-required skill injection parity. Debugging (1,331 body chars) and CR skill (1,004) are short or critical; KEEP as whole default. **Recommendation: selective trial only for large evidence-backed sections; never make failure-routing optional without a trustworthy rehydration path.**

## 8. A-OPT4 — Direct Role/Skill source navigation, no broad source reopening

**Trigger:** a *deliberate source-inspection* investigation where role/skill file path is already identified from a deterministic, immutable index/reference. Instead of reopening the facade for every separately activated Agent, pass an exact versioned Role/Skill path and use the narrow leaf directly; independent role must still read its own mandatory authoritative instructions. The baseline was already exact-file navigation for Shared+Role+selected Skill, so do **not** pretend these were previously loaded as one 85,330-char monolith.

Illustrative source-navigation-only reduction using the explicit no-reuse audit proxy: skip **facade** read on subsequent activations in the same journey (not Shared or role text). Facade measured **1,763 chars**, so S1: 3× = **5,289**; S2: 4× = **7,052**; S3: 5× = **8,815**; S4: 7× = **12,341**. Across four journeys **33,497 source characters / 19 file opens** fewer: **594,935 → 561,438 source-proxy chars** (−5.63%) and **89 → 70 source opens**. This is **zero additional `get_agent_harness` or `load_skill` payload saving**. It requires trusted direct path provision, not shared hidden Reviewer/Tester reasoning. If every independent role has to open its own index anyway, savings = **0**; if a path lookup adds a call, the latency tradeoff is unknown.

Implementation complexity **LOW** for stable versioned links if source introspection actually happens; **MEDIUM** for keeping an index fresh / provenance and ensuring no unauthorized path reads. Current real Agent calls do not read these TS files, so there is currently **no evidence of a user-workflow runtime win**. Recommendation: use good source links naturally, but **do not build a new routing subsystem solely to chase this hypothetical 5.63% source-audit metric**.

## 9. Non-overlapping incremental comparison

The three model-facing reductions are attributed to **distinct existing text**: OPT1 Shared policy, OPT2 Role loops, OPT3 Skill-body sections. OPT4 measures **only source navigation** and is not added to model payload savings. All savings are conditional paper upper-case/path arithmetic, **not accepted production outcomes**.

| Journey | BASE-A model text | After OPT1 | After OPT2 | After OPT3 | Total model-text difference / reduction |
| --- | ---: | ---: | ---: | ---: | ---: |
| S1 | 92,862 | 75,548 | 74,312 | 72,937 | −19,925 / **21.46%** |
| S2 | 112,885 | 92,557 | 87,377 | 84,217 | −28,668 / **25.40%** |
| S3 | 138,199 | 110,496 | 105,316 | 105,061 | −33,138 / **23.98%** |
| S4 | 189,955 | 160,547 | 154,533 | 149,497 | −40,458 / **21.30%** |
| **Four journeys** | **533,901** | **439,148** | **421,538** | **411,712** | **−122,189 / 22.89%** |

| Stage | Increment vs preceding | Increment vs original BASE-A | Calls/open count and complexity | Runtime applicability |
| --- | ---: | ---: | --- | --- |
| BASE-A physical extraction only | **0 model chars** | 0% | 21 physical files, exact parity required; **HIGH** migration | Hypothetical, not implemented |
| A-OPT1 policy role ownership | −94,753 model chars | −17.75 percentage points | 23 harness calls remain in fixtures; MEDIUM assembly / **HIGH** safety | Unreviewed shared-rule ownership proxy |
| A-OPT2 selective Role-loop sections | −17,610 model chars | −3.30 percentage points | same baseline calls if trusted selector; **HIGH** state/guard risk | Favorable exact-state branch only |
| A-OPT3 progressive Skill sections | −9,826 model chars | −1.84 percentage points | baseline 20 Skill loads; extra deferred loads on failure; MEDIUM–HIGH | Favorable branch only; no existing section API |
| A-OPT4 exact source navigation | **0 model chars** | **0 model percentage points** | paper source audit: 89→70 opens, 594,935→561,438 chars (−5.63%); LOW–MEDIUM | Normal runtime benefit not established |

No speedup or host-token reduction is claimed. There is no proof the role-policy selector actually preserves every mandatory rule, no evidence of host caching, and no reliable way to convert these summed character counts to real wall-clock cost. Under fallback-to-full text, savings can be 0 for any or all steps. Additional fixed Tool JSON/schema context, Project data and logs may overshadow these text savings.

## 10. Technical review — adversarial failure analysis

| Risk / challenge | Finding / required validation before any build |
| --- | --- |
| 21 fine files and import churn | **HIGH** extraction cost; 20 non-facade modules introduce many source locations, exports, changes to tests and naming. Source-slice sums cannot price real wrappers/imports. Golden text/API parity for all 8 roles and 11 Skills, suggestion mappings, Direct/JOB, `run_begin` injections and error shapes are mandatory. Consider fewer cohesive groups if actual co-read cost dominates. |
| Duplicate shared policy | OPT1 naive role copies can inflate multi-Agent source inspection and create drift. Canonical policy ID registry + checked per-role assembly, not copied prose; a centrally authoritative guard cannot be deleted for context only. Prior forecast specifically warns that multi-Agent source navigation can worsen dramatically with duplication. |
| Missing Human authority/permission | All role subsets must enforce explicit approved Plan before product code; Criteria approval remains Human; branch and source scope, denial, CAS/readback, pending cursor/unknown write, no-progress and STOPCHAT rules remain reachable. Error/unknown => full policy or STOP, never “trimmed” bypass. |
| Wrong Agent activation | Human message alone preserves current receiving role; absent receiver defaults Planner. The trace's Orchestrator assumption is a fixture, not an observed transition. Only invoke Advisor on material Human Criteria intent; CR only direct/preapproved; Designer/UI skill only on relevant UI scope. |
| Reviewer independence | Reviewer must reconstruct requirements/target/diff itself; no Planner/Coder self-verdict substituted. “Code review” task classification must be independently confirmed before stripping planning-only clauses. No hidden prior reasoning reuse. |
| Critic independence | CR reviews independently **before** prior Reviewer verdict and only after authorization; source text reduction must not disable this order or yield a fake CR PASS. |
| Tester independence / false success | Positive-path deferred `RETEST/ROUTE` cannot become a hidden “never route failures” policy. Tester never edits source; environment unavailable means UNVERIFIED. Host `scenario-tester` suggestion is NOT execution. Retests require new exact changed revision and failed+impacted regression scenarios. |
| Too many calls | Smaller file bodies may demand more range reads, source links, Task selector lookups, rehydration after failure and handoff. Measure real elapsed time, number of tool calls, repeated payloads, and peak context before selecting. |
| Source ref ≠ read | `canonical_refs` are pointers; host skill names and TS imports are not consumption evidence. Do not count them as opens or model tokens. |
| Source-blind `simulate` requirement | The frozen SIM4 document candidly says its authoring session had previously seen GSA source, so its source-blind independence is not demonstrated. This report traced those frozen inputs without changing expected user outcomes. No original callable skill, two-party independent Designer/Tracer, external mock execution or runtime verification was performed. |
| Governance plan sequencing | Research plan says physical extraction/parity before actual post-split selective-loader work. This user-authorized hypothetical study is an **illustrative pre-implementation forecast only**. It is **not** R6/R8 completion or authority to change a loader. |

### 10.1 Mini paper negative-case matrix — not runtime test results

| Case | User-level expectation | Safe paper path | Evidence still missing |
| --- | --- | --- | --- |
| S1 Criteria inaccessible | No fabricated Bootstrap READY | stop/reconcile/NEED_HUMAN, no new Criteria approval | actual permission/readback call |
| S1 existing reviewed plan | Reuse, not duplicate Job or CR ceremony | Planner short path | current Plan/Milestones snapshots |
| S2 stale source or cursor PENDING | No blind write retry | reread Git + cursor/recovery, stop on conflict | Git/Memory exact SHAs and observed recovery |
| S2 denied source permission | No workaround | STOP | scope authority output |
| S3 unavailable runner/host | Don't call product a bug | Tester classifies ENVIRONMENT_FAILURE/UNVERIFIED | observed runner logs/host call |
| S3 same-bug failed retest | Find root cause; no fake PASS | Coder debugging + bounded retry; Reviewer and Tester remain distinct | real before/after test oracle and evidence |
| S4 no Human approval | Plan only | Planner→Reviewer→Planner→STOP | actual Human decision |
| S4 materially changed Criteria | Advisor/Human route required | consult Advisor and approve/KEEP before revised plan/code | exact Criteria delta and decision |
| All: missing Task-required skill | No generic substitute marked PASS | BLOCKED/UNVERIFIED or verified fallback | real NEXT Task/required_skill_contexts |
| All: role-state unknown | No unsafe selective omission | full Shared/Role/Skill, or STOP on denied authority | trustworthy state selector and negative regression |

This matrix tests trace plausibility only. The appropriate final status for every unexecuted acceptance item is **UNVERIFIED**, not PASS.

## 11. Technical recommendation and next evidence

1. **BASE-A is now quantified as a legitimate *paper starting point*, not an optimized runtime.** Keeping the full GSA3 policy after a physical split changes delivered Harness/Skill text by **zero**. The 21-file topology improves source targeting at the cost of more modules; compare it against fewer cohesive alternatives with actual navigation evidence before physical extraction.
2. **A-OPT1 merits the first later model-text experiment**, provided independent policy ownership review and exhaustive guard/role-parity tests succeed. Its theoretical saving dominates. Do not simply copy shared bullets into each Role or grant a selector policy authority.
3. **A-OPT2 should be conservative**, using only stable independently observed task categories. If a Role's condition is unclear, select full Role. Never optimize Reviewer/Tester by injecting the implementer's evidence verdict.
4. **A-OPT3 is worth a limited trial for large Skills** such as `job-planning`, `coding-loop` and `testing-evidence`; the conditional fetch cost and failure-path rehydration can erase gains. Keep short critical skills intact and preserve Task-required injection behavior.
5. **A-OPT4 is mainly documentation hygiene** until source-open logs show repeated facade reads. Do not create another runtime subsystem or advertise its source-audit saving as operational context reduction.
6. **Before any selected architecture or implementation**: obtain a genuine source-blind independent scenario design or at minimum an independently reviewed frozen design; conduct physical splitting with golden exact parity; then CT-00 source/host instrumentation (per role/turn, actual get-harness/skill payloads, source opens, tool calls, context window/tokens where observable, real latency and failures) on happy and negative journeys. Include Reviewer/CR independence and permission denial as **hard** acceptance checks. Compare A vs the separately studied architecture on identical fixtures, not by independently chosen optimistic cases.

**Decision: RESEARCH COMPLETE FOR PAPER A; NO IMPLEMENTATION CHOICE, NO CODE, NO RUNTIME PASS.** No authority is inferred to update Criteria, change GSA3 contracts, merge, deploy or declare GSA4 finished.

## 12. Reproduction notes

- Source exact commit `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`, file `supabase/functions/gsa-mcp/harness-catalog.ts`, 608 lines and 85,330 JavaScript source characters; static consumers `harness-skill-tools.ts` and `run-execution-tools.ts` at same commit.
- Split source by literal markers `export const ROLE_HARNESSES:`, `export const ROLE_SKILLS:`, `export const RUNTIME_SKILLS:` and `// GSA2: get_agent_harness`. Detect 8 `^  role: {` entries and 11 `^  ('quoted-key'|delegation): {` entries. Attribute all remainder to facade. Check checksum **85,330**; new source wrappers are out of scope.
- Skill body chars: sum decoded single-quoted body-array literal lengths + a newline for each joined boundary. Renderer Harness lengths from the cited development-branch follow-on forecast, not new MCP execution; count once per explicit role activation.
- File navigation main no-cache proxy per activation: `1763 + 15285 + role source chars + each selected skill source chars`; 3+N skill source-file opens. A-OPT4 only omits repeated facade source inspection, does not omit shared policies. “Unique files” in table indicate unobserved ideal reuse, not host cache.
- OPT1: four case totals from documented role-selected Harness proxies; OPT2: removed known Role *loop* strings only with their actual rendered numbered-list prefixes/newlines; OPT3: removed specific Skill *body* lines by source-prefix/heading match plus newline boundaries; no overlapping Shared, Role and Skill reductions.
- Four journeys and oracle: frozen SIM4 doc at blob `b266d3f15e619413b7a3c40d24e7a75664bdbebf`; conditional trace facts are marked above. An external real Host/CI is needed for any verified activation or runtime PASS.
