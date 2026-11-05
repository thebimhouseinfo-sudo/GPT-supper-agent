# GSA4 — Full Instruction / Harness / Skill Classification Audit

**Date:** 2026-11-05  
**Mode:** DIRECT AGENT / READ-ONLY / STATIC SOURCE AUDIT  
**Repository:** `thebimhouseinfo-sudo/GPT-supper-agent`  
**Pinned main:** `c150954b76fea919907edc15d0673aad2914a1f3`  
**Reference branch:** `upgrade/gsa-context-efficiency` at `66d990807111edbebe0b39fc529e7a0abcb20442`  
**Both commit trees:** `82e7087a2f5e73c0ebc9fd7472842265c540a463` (identical)  
**Status:** AUDIT + DIRECT STATIC REVIEW/CRITIC REVIEW (non-GSA-verification) — no repository source changes, no commits, no merge/deploy.

## Method, evidence levels, and limitations

1. Read the Secretary Lesson Learned from `GSA-Projects/projects/01a0f051-4353-7bff-8edf-46be4b44fd2f/LESSONS/2026-11-05-secretary-job-description-misclassified-as-optional-skill.md` before inspecting GSA source.
2. Used connected GitHub read-only file/directory/branch calls, pinned to exact main SHA. Inspected `harness/shared.ts`, all 8 `harness/roles/*.ts`, all 14 `harness/skills/*.ts` files (13 runtime catalog Skill entries plus one helper module), `harness-catalog.ts`, `harness-skill-tools.ts`, `selective-harness-preview.ts`, `index.ts`, `run/run-begin.ts`, `run-dispatch-closure-guards.ts`, `critic-review-tools.ts`, and selected tests.
3. Executed a **static string-presence comparison** over fetched source: Shared+Role without Skill versus Shared+Role+suggested Skill (and a required frontend skill where applicable). This establishes presence/absence of clauses, **not** successful or failed autonomous Agent behavior.
4. **CONFIRMED:** source plus demonstrated behavior/observed failure; **HIGH-RISK:** direct structural/source evidence but no runtime reproduction; **POTENTIAL:** additional proof required; **CORRECT:** reasonable layer placement. `STATIC_FINDING` means no live Host/Model/production Tool run. The one CONFIRMED failure draws on the explicitly documented observed Secretary incident, not a new production test.
5. No local Git checkout, `npm`/`node` tests, deployed Supabase environment, or model-host replay was available through the permitted read-only GitHub access in this session. The repository's existing tests were inspected, not rerun. No claim of production deployment parity is made.

**Source permalink format:** `https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/<path>#L<line>`.

## Report A — Full Instruction / Skill Inventory

### A1. Shared Harness: all 49 operating-rule clauses

The shared source is [`harness/shared.ts`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/shared.ts#L1-L55), 49 `- ` clauses (lines 3–20 and 22–53). Classification of clauses, not just files:

| Line | Clause / subject | Classification of substance | Placement assessment |
|---:|---|---|---|
| 3 | current receiving Agent / Human message | SHARED_INSTRUCTION, WORKFLOW_CONTRACT | CORRECT |
| 4 | open/bootstrap fixed steps | WORKFLOW_CONTRACT + SKILL_METHOD | MIXED — coordinator method |
| 5 | low-reasoning classification | SHARED_INSTRUCTION | CORRECT |
| 6 | clarify material choices | SHARED_INSTRUCTION | CORRECT |
| 7 | skeleton/new-feature vs bootstrap scope | SHARED_INSTRUCTION, WORKFLOW_CONTRACT | CORRECT core; verbose |
| 8 | detailed plan and Reviewer PASS | WORKFLOW_CONTRACT | CORRECT core; Planner-specific |
| 9 | GOAL anchors in Plan | WORKFLOW_CONTRACT | CORRECT requirement; relocate exact formatting detail to Planner/Reviewer method |
| 10 | `planner rl` alias / same-turn workflow | WORKFLOW_CONTRACT + SKILL_METHOD | MIXED — parser and repair steps too detailed |
| 11 | Human execution authorization | SHARED_INSTRUCTION, WORKFLOW_CONTRACT | CORRECT — preserve |
| 12 | fresh-start/adopt baseline | WORKFLOW_CONTRACT + SKILL_METHOD | MIXED — Planner/Bootstrap procedure |
| 13 | bootstrap checklist 4 statuses/CRL/next_action | WORKFLOW_CONTRACT + SKILL_METHOD | MIXED — very large coordinator-specific procedure |
| 14 | Advisor Criteria checkpoint | SHARED_INSTRUCTION, WORKFLOW_CONTRACT | CORRECT — preserve |
| 15 | Criteria revision order | WORKFLOW_CONTRACT | CORRECT contract; some detail role-specific |
| 16 | project Task addins precedence | SHARED_INSTRUCTION, WORKFLOW_CONTRACT | CORRECT; activation method specialized |
| 17 | branch authority | SHARED_INSTRUCTION | CORRECT — preserve |
| 18 | STOPCHAT durable reconciliation | SHARED_INSTRUCTION, WORKFLOW_CONTRACT | CORRECT contract; implementation detail conditional |
| 19 | rl/crl authority and bounded loop | WORKFLOW_CONTRACT | CORRECT — preserve |
| 20 | interruption/reassignment | SHARED_INSTRUCTION | CORRECT |
| 22 | source truth / Project Memory | SHARED_INSTRUCTION | CORRECT |
| 23 | active Project context | SHARED_INSTRUCTION | CORRECT |
| 24 | unrelated Project mismatch | SHARED_INSTRUCTION | CORRECT |
| 25 | authorize_project_scope | SHARED_INSTRUCTION | CORRECT — preserve |
| 26 | preserve unrelated changes | SHARED_INSTRUCTION | CORRECT |
| 27 | read before write | SHARED_INSTRUCTION | CORRECT |
| 28 | bounded Job scope | SHARED_INSTRUCTION | CORRECT |
| 29 | never bypass denial | SHARED_INSTRUCTION | CORRECT |
| 30 | reconcile Git/Job/Run before resume | SHARED_INSTRUCTION, WORKFLOW_CONTRACT | CORRECT |
| 31 | NEXT cursor at atomic write | WORKFLOW_CONTRACT | CORRECT critical invariant; concrete tool syntax can move |
| 32 | resume pending cursor / no retry | WORKFLOW_CONTRACT | CORRECT critical invariant |
| 34 | unknown Git outcome recovery | WORKFLOW_CONTRACT | CORRECT |
| 35 | three unchanged no-progress fingerprints | WORKFLOW_CONTRACT | CORRECT shared guard |
| 36 | dedicated tools preference | SKILL_METHOD | POTENTIAL low-value global-method overhead |
| 37 | parallel independent operations | SKILL_METHOD | POTENTIAL low-value global-method overhead |
| 38 | diagnose failed action before retry | SHARED_INSTRUCTION | CORRECT |
| 39 | LLC59 self-fetch CI evidence | WORKFLOW_CONTRACT + SKILL_METHOD | MIXED — role-specific CI technique |
| 40 | minimal Human handoff | SHARED_INSTRUCTION | CORRECT |
| 41 | discover repository test commands | SKILL_METHOD | MIXED — technical method for Coder/Tester |
| 42 | verification truthfulness | SHARED_INSTRUCTION | CORRECT |
| 43 | LLC60 continuation APIs | WORKFLOW_CONTRACT + SKILL_METHOD | MIXED — Planning/Orchestrator-specific detail |
| 44 | goal vs tests | SHARED_INSTRUCTION | CORRECT |
| 45 | Job boundary/context boundary | SHARED_INSTRUCTION | CORRECT |
| 46 | correction traceability | WORKFLOW_CONTRACT | CORRECT |
| 47 | LLC58 Plan change/supersession | WORKFLOW_CONTRACT + SKILL_METHOD | MIXED — Planner/Orchestrator implementation detail |
| 48 | NEXT dispatch evidence guards | WORKFLOW_CONTRACT | CORRECT — preserve |
| 49 | NEXT closure evidence guards | WORKFLOW_CONTRACT | CORRECT — preserve |
| 50 | progressive context policy | SHARED_INSTRUCTION | CORRECT |
| 51 | Human authority/no inferred approval | SHARED_INSTRUCTION | CORRECT |
| 52 | browser QA internal authority | SHARED_INSTRUCTION | CORRECT |
| 53 | browser evidence observed vs present | SHARED_INSTRUCTION | CORRECT |

The six classifications used by this audit also include `ROLE_INSTRUCTION` (below) and `PROJECT_CONTEXT` (must be supplied by exact per-Project Criteria/Plan/Job/Task/DEC references, **not** baked into global Harness). Inline mentions of particular projects, CAD/DWG examples, command paths or host examples in Skill bodies must be read as **conditional examples**, not unconditionally authoritative PROJECT_CONTEXT.

### A2. Eight Role Harness contracts

| Role | Source lines | Core Job Description / authority & expected output (correct layer) | Detailed method overlap / opportunity |
|---|---|---|---|
| Orchestrator | [`roles/orchestrator.ts:2–35`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/orchestrator.ts#L2-L35) | Routing, durable lifecycle, delegated ownership, same-turn continuation, Human Gates, dispatch, evidence/closure, checkpoint and repair routing; `routing decision`, Run, status | L17–31 include lengthy LLC60/LLC59 and NEXT procedures; split technical HOW without losing invariant |
| Planner | [`roles/planner.ts:2–38`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/planner.ts#L2-L38) | Criteria and human scope, plan/GOAL/task decomposition, evidence, Plan revision, independent review-to-READY, Human execution stop | L15–29 discovery L0/L1, feasibility analysis, UI_FIRST/UX_FIRST and sizing steps partially `SKILL_METHOD` / `CONDITIONAL_SKILL` |
| Advisor | [`roles/advisor.ts:2–15`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/advisor.ts#L2-L15) | Human Criteria consultation only; no veto, write or PASS; tradeoff/uncertainty handoff | Short and appropriately placed — CORRECT |
| Designer | [`roles/designer.ts:2–16`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/designer.ts#L2-L16) | Design/asset ownership; read-only source; workflow-specific shell/UX coverage; contract and handoff | Some UI method detail; modest; CORRECT overall |
| Coder | [`roles/coder.ts:2–25`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/coder.ts#L2-L25) | Authorized scope, edit, diff, self-review, targeted testing, repair, criterion-by-criterion Goal Recheck, persist handoff | U-D pre-code condition and U-F third-fail boundary absent; several HOW steps duplicate coding-loop |
| Reviewer | [`roles/reviewer.ts:2–23`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/reviewer.ts#L2-L23) | Independently review exact revision; code/plan findings; revision-bound verdict and persisted Verification, planning loop route; source read-only | L10–15 detailed check method duplicates planning-review/review-evidence — contract intact |
| Critic Reviewer | [`roles/critic_reviewer.ts:2–19`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/critic_reviewer.ts#L2-L19) | Human/milestone-only CR authority, stateless independent verdict, compare prior Reviewer last, persist CR only | Specific `PRE_CODE_TECHNICAL` coverage contract absent; generic CR otherwise CORRECT |
| Tester | [`roles/tester.ts:2–28`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/tester.ts#L2-L28) | Independent VERIFY/MEASURE/PROBE; source read-only; capability and evidence gates; Test/Retest; failure routes; three-cycle U-F | L16–25 contain specialized diagnostic/simulation how-to also in testing-evidence/simulate |

**Secretary is not one of the eight registered Roles**. It is a function currently packaged as Planner-suggested Skill, rather than an independently owned Role contract. Repair should assign its mandatory obligation within existing receiving Agent/Planner/Orchestrator contracts; do **not** create a ninth Role by default.

### A3. Complete runtime Skill catalog

[`harness-catalog.ts:37–68`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness-catalog.ts#L37-L68) registers 13 runtime bodies. Classification below applies to substance; all Skill bodies are **on-demand** unless a NEXT Task declares `required_skills`.

| Runtime skill | Suggested to | Classification | Assessment |
|---|---|---|---|
| `delegation` | Orchestrator, Planner, Designer, Coder | SKILL_METHOD; conditional UI handoff | CORRECT; role authority not replaced |
| `critical-challenge` | Planner | SKILL_METHOD | CORRECT; Planner role already owns critical challenge obligation |
| `job-planning` | Planner | SKILL_METHOD plus duplicate WORKFLOW_CONTRACT | MIXED; plan-review and persistence gate already in role/shared |
| `secretary` | Planner | **ROLE_INSTRUCTION + WORKFLOW_CONTRACT mispackaged**, with SKILL_METHOD | **CONFIRMED defect** |
| `coding-loop` | Coder | SKILL_METHOD, conditional host artifact HOW; **U-D/U-F workflow contracts** | HIGH-RISK mixed |
| `debugging` | none by default; catalog on demand | CONDITIONAL_SKILL; U-F causal technique | CORRECT activation; cross-reference U-F hard stop must remain in Role |
| `review-evidence` | Reviewer, Critic Reviewer | SKILL_METHOD | CORRECT (some harmless duplication) |
| `planning-review` | Reviewer | SKILL_METHOD plus repeated WORKFLOW_CONTRACT | MIXED duplication; core review remains Role |
| `critic-review` | Critic Reviewer | SKILL_METHOD plus **U-D conditional completion/activation contract** | HIGH-RISK mixed |
| `testing-evidence` | Tester | SKILL_METHOD plus repeated evidence contract | Mostly CORRECT; detail/duplication reducible |
| `tester-lab` | none default; catalog on demand | CONDITIONAL_SKILL | CORRECT: special lab only |
| `ui-coder-frontend` | not default; NEXT Task `required_skills` | CONDITIONAL_SKILL, UI specialization authority inside active task | CORRECT, assuming Task tagging and injection |
| `simulate` | Tester suggestion, explicitly load for user journeys | CONDITIONAL_SKILL | CORRECT; Tester Role already defines trigger and evidentiary limits |

**Not a 14th runtime Skill:** [`harness/skills/retest-history.ts`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/skills/retest-history.ts#L1-L249) is a TypeScript read-only helper implementing `defectIdentity`, `assessDefectRetests` and `advancedDefectReport`, not a catalog skill body; no `registerTool` is defined there. It can be used by source tests; its existence does not prove host-facing execution or durable history retrieval.

### A4. Actual loading and dispatch contracts

- [`harness-catalog.ts:73–95`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness-catalog.ts#L73-L95): `renderHarness(role)` = `BASE_AGENT_HARNESS` + one Role's `authority`, `loop`, `outputs`, optionally only a **skill names list**, not Skill bodies.
- [`harness-skill-tools.ts:26–45`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness-skill-tools.ts#L26-L45): `get_agent_harness` explicitly uses `includeProgressiveSkills:false`; returns `harness_text`, `suggested_skills`, `suggested_host_skills`, `canonical_refs`, `context_policy`. `mode` is metadata and does not itself cause auto-loading of skills.
- [`harness-skill-tools.ts:49–94`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness-skill-tools.ts#L49-L94): `get_skill_catalog` returns names/descriptions; `load_skill(name)` returns `skill_text`. Suggestions are not an execution guarantee.
- [`run-dispatch-closure-guards.ts:38–60`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/run-dispatch-closure-guards.ts#L38-L60): `resolveRequiredTaskSkills` resolves **only** explicit current Task `required_skills` to bodies; unknown name blocks NEXT dispatch.
- [`run/run-begin.ts:179–200`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/run/run-begin.ts#L179-L200): NEXT `run_begin` emits `required_skill_contexts` and records `loaded_skills` from resolved required skill names. Legacy/V2/Direct execution does not get this same NEXT injection merely from suggestions. Loaded-skills record is a dispatched-context claim, not independent proof of model comprehension/execution.
- [`job-prepare-tool.ts:66–69`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/job-prepare-tool.ts#L66-L69): current Job preparation schema limits required Task skills to the `ui-coder-frontend` enum; ordinary Coder `coding-loop` remains suggestion-only.
- [`index.ts:133–176`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/index.ts#L133-L176): MCP server-level `instructions` also embed many shared planning/branch/continuation duties; potential third duplicate prompt surface (host delivery/usage not tested). The on-demand `get_instruction` is separate.
- [`index.ts:509–571`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/index.ts#L509-L571): `start_direct_agent` is an **admission**, with `execution_state=ADMITTED_NOT_EXECUTED`, not proof that role/skills were loaded or a Run succeeded.
- [`selective-harness-preview.ts:1–12`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/selective-harness-preview.ts#L1-L12): A4 is explicitly NOT wired into runtime. [`lines 47–56`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/selective-harness-preview.ts#L47-L56) target four exact Shared clauses; [`87–185`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/selective-harness-preview.ts#L87-L185) fail closed unless a specially shaped Coder defect-repair context is supplied. This is an advisory string-selection preview, **not** authorization/runtime PASS.

## Report B — Misclassification Findings

### A-01 — CONFIRMED / CRITICAL — Secretary core job description stored only as optional Skill

**Current:** [`harness/skills/secretary.ts:1–12`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/skills/secretary.ts#L1-L12). Header calls it *Optional accepted-decision recorder*, while body defines activation, accepted-vs-proposed governance, full-fidelity WHAT/HOW/examples/exceptions/provenance, DEC artifact persistence, independent SHA readback, correction/supersession and false-SAVED prohibition. [`harness-catalog.ts:37–46`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness-catalog.ts#L37-L46) only suggests `secretary` to Planner. None of eight Role contracts defines Secretary acceptance-to-DEC completion duty. Planner [`role L18`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/planner.ts#L18) and Coder/Reviewer retrieve accepted **existing** DEC, which is not the creation/persistence obligation.

**Correct:** short SHARED_INSTRUCTION / WORKFLOW_CONTRACT for accepted Human decisions; clear existing-owner `ROLE_INSTRUCTION` in receiving Agent/Planner/Orchestrator (no new Role); leave DEC formatting/CAS/supersession method in `secretary` SKILL_METHOD. **Failure:** Human says “chốt”; without optional Skill, the assistant closes with a shortened answer and no durable readback/NOT SAVED. The linked Lesson Learned records an actual incident of this type. **Repair:** owner + mandatory acceptance trigger + full-lossless artifact completion/failure state; no new Human gate. **Tests:** accepted long technical decision, unaccepted ideas, storage denied, correction SUPERSEDES, new-chat exact HOW recovery, negative no-phantom-SAVED.

### A-02 — HIGH-RISK / HIGH — Coder U-D pre-code obligations solely in suggested Skill

**Current:** [`harness/skills/coding-loop.ts:68–83`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/skills/coding-loop.ts#L68-L83) adds U-D pre-code connected Task proposal, related files/functions/callers, and CR review before code. [`roles/coder.ts:2–25`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/coder.ts#L2-L25) does not mention U-D; `coding-loop` is suggested, not guaranteed. Tool-level [`critic-review-tools.ts:227–233`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/critic-review-tools.ts#L227-L233) validates pre-code inventory on **explicit PRE_CODE_TECHNICAL PASS**, not pre-code invocation for every Coder Run.

**Correct:** applicability/authorization and completion dependency (only if genuinely adopted in existing approved scope) = ROLE_INSTRUCTION + WORKFLOW_CONTRACT; file/function inventory construction = CONDITIONAL_SKILL. **Failure:** Coder with Shared+Role only has normal code loop, skips specialized proposal/review. **Important contract tension:** the Skill's broad “BEFORE application-source changes for a Goal” can be read as a blanket CR gate, while Shared [`L19`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/shared.ts#L19) restricts CR to direct Human or preapproved milestones. **Do not repair by automatically adding a CR gate**. First make exact U-D applicability and existing Human authorization explicit, then preserve it. **Test:** U-D applies/does not apply, CR not authorized, omitted Skill, repeated proposal changes, no generalized CR expansion.

### A-03 — HIGH-RISK / HIGH — Critic U-D completion criterion activated only through optional Skill/focus

**Current:** [`harness/skills/critic-review.ts:16–25`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/skills/critic-review.ts#L16-L25) specifies PRE_CODE_TECHNICAL whole-related Task/fidelity/inventory review. [`roles/critic_reviewer.ts:2–19`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/critic_reviewer.ts#L2-L19) contains independent generic CR but no U-D focus identification. [`critic-review-tools.ts:95–96,183–185,227–233`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/critic-review-tools.ts#L227-L233) makes `review_focus` optional and checks the inventory only when declared PRE_CODE_TECHNICAL.

**Correct:** conditional workflow contract: when current authorized CR target is a pre-code proposal, the required `review_focus` and completeness conditions survive absence of Skill; detailed professional review checklist remains CONDITIONAL_SKILL. **Failure:** generic CR may report PASS without the special inventory validator path if focus is not selected. **Test:** authorized precode target loaded/unloaded Skill, misreported GENERAL focus, partial task inventory, caller/interface omissions, exact proposal SHA; ensure no extra CR authority.

### A-04 — HIGH-RISK / HIGH — Coder U-F three-cycle stop depends on optional coding-loop

**Current:** [`harness/skills/coding-loop.ts:64`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/skills/coding-loop.ts#L64), [`skills/debugging.ts:14–16`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/skills/debugging.ts#L14-L16), and [`skills/testing-evidence.ts:41–42`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/skills/testing-evidence.ts#L41-L42) encode no ordinary fourth patch after three complete independent PRODUCT_FAILURE cycles. Tester Role [`L25`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/tester.ts#L25) knows this; **Coder Role** [`L19–20`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/coder.ts#L19-L20) requires root-cause investigation after failed retest but does not state the third-full-fail stop threshold. Helper `retest-history.ts` does not automatically run at Coder dispatch.

**Correct:** short Coder/Orchestrator WORKFLOW_CONTRACT boundary, triggered by exact independently persisted Tester failure history; detailed causal debug = CONDITIONAL_SKILL. **Failure:** if Coder receives partial Harness without coding-loop, patch #4 is not explicitly prohibited in its own contract, even though Tester is aware. **Test:** three independent same-defect failures across chats/Jobs stop repair; unverified hosts and distinct defects do not count; non-dispatch of ordinary patch four.

### A-05 — POTENTIAL / MEDIUM — DEV versus Human OPERATION artifact semantics only in coding-loop

**Current:** [`skills/coding-loop.ts:18–25`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/skills/coding-loop.ts#L18-L25) distinguishes internal source/Job records from user-owned CAD/DWG/LISP/DOCX operation artifacts and host permissions. This is task-specific expertise, so the *detailed method* may rightly stay conditional, but the underlying **authority boundary** may become ambiguous in a generic Coder Run without Skill. Existing Shared source/project write boundaries still exist, so no confirmed bypass. **Minimal repair:** one Role/shared distinction that host operation authorization remains required and source governance is not automatically applied/waived for unrelated operational deliverables; keep CAD-specific examples conditional. **Test:** authorized operational save vs denied save, DEV source commit, same-name operational artifact, generic Coder without coding-loop.

### B-01 — POTENTIAL / MEDIUM (structural overhead proven; behavioral effect unmeasured) — Shared Harness includes role-specific procedures

**Current:** [`harness/shared.ts:4,9–13,39,41,43,47`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/shared.ts#L4-L13) are examples; long step-by-step Bootstrap/Planner review/LLC60, source-discovery and CI diagnosis are returned even to Advisor, Designer and Reviewer because `renderHarness` always includes Shared. A4 itself targets four such clauses ([`selective-harness-preview.ts:47–56`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/selective-harness-preview.ts#L47-L56)) but is not runtime.

**Correct:** retain short universally relevant approval/security/dispatch invariants as SHARED_INSTRUCTION / WORKFLOW_CONTRACT; put planner/bootstrap step HOW in Planner/Orchestrator conditional methods, CI diagnostic detail in Coder/Tester methods. **Failure:** unnecessary context on unrelated Runs and conflicting repeated formulations as patches accumulate; the model-token cost was not measured. **Test:** byte-level output diff across 8 Roles, no dropped mandatory marker, explicit Planner/Bootstrap/CI workflows with and without conditional method loaded.

### B-02 — POTENTIAL / MEDIUM (structural overlap proven; behavioral effect unmeasured) — Role Harness repeats technical methods already in Skills

**Current:** [`roles/planner.ts:15–30`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/planner.ts#L15-L30) L0/L1/feasibility/UI sizing vs `job-planning`/`critical-challenge`; [`roles/orchestrator.ts:17–31`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/orchestrator.ts#L17-L31) concrete LLC60/NEXT/CI tool sequences also mirrored in Shared; [`roles/tester.ts:16–25`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/roles/tester.ts#L16-L25) testing methods duplicated in `testing-evidence`/`simulate`. Reviewer/Code Role also repeat some how-to, but their workflow obligations must remain visible.

**Correct:** keep role owner, trigger, permissions, invariant, output/evidence obligations and PASS/BLOCKED routes; migrate only detailed methods that are not required on every workflow. **Test:** compare no-Skill and with-Skill outcome/evidence/authority, check reduced harness lengths and no extra tool calls. **Do not simply strip everything after `ROLE LOOP`**: loops define job responsibilities.

### B-03 — POTENTIAL / MEDIUM — Third instruction surface duplicates Shared/Role

[`index.ts:137–176`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/index.ts#L137-L176) sets long MCP `instructions` with bootstrap, branch, Planner, CI, continuation and review duties. This is a separate startup/server surface, not a runtime Skill. It may increase context independently of `get_agent_harness`, depending on host ingestion. **Verify host initialization payload and actual model context** before optimizing; preserve startup/global safety contracts. Do not assume MCP server instructions rescue missing Secretary duty.

### B-04 — POTENTIAL / LOW — Planner's `job-planning` skill repeats completion contract and persistence loop

[`skills/job-planning.ts:14–28`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/supabase/functions/gsa-mcp/harness/skills/job-planning.ts#L14-L28) repeats GOAL anchors, approval/review loop and READY continuation already present in Shared+Planner. It is not a missing mandatory instruction, but is a maintainability/drift risk. Retain a single canonical WORKFLOW_CONTRACT; leave document construction heuristics and scan methods inside Skill. No extra gate.

### Correct placements — do not over-correct

- Advisor and Designer's primary authorities, workflows and outputs are in their Role contracts.
- Reviewer and Critic Reviewer independently reconstruct source/evidence before verdict; read-only constraints and persistence are role-level.
- Orchestrator, Planner, Coder and Tester each contain their generic PASS/review/evidence or Goal Recheck gates in their Role contracts.
- `simulate`, `tester-lab`, `ui-coder-frontend` and `debugging` are genuinely conditional techniques. They should not be transplanted wholesale into Shared.
- `run_begin`'s explicit Task `required_skills` injection is a correct mechanism for specialty requirements, with caveat that it covers only the names and NEXT path actually configured.
- A4 conservative fallback preserves complete original Role instructions in the preview; **do not mistake preview test success for production activation**.

## Report C — Progressive Loading Risk Matrix

| Role / representative workflow | Bare Shared+Role mandatory contract | Skill used when relevant | Bare omission effect | Risk |
|---|---|---|---|---|
| Orchestrator / dispatch → handoff → closure | exact project/job, Human approval, source/verification gates, persist/readback, same-turn continuation | `delegation` | loses only handoff drafting technique | LOW / CORRECT |
| Planner / create/revise plan → Reviewer → READY | Criteria/GOAL/scope/topology, independent planning review, iterative fix, approval stop | `job-planning`, `critical-challenge` | loses planning heuristics, not main review gate | LOW–MEDIUM; B-02 |
| Planner/current receiver / Human accepts long technical discussion | no explicit acceptance-to-full-DEC persist/verify obligation | `secretary` | loses full decision, provenance, supersession, SAVED/NOT SAVED duty | CRITICAL; A-01 |
| Advisor / Criteria approval or material change | trigger, advice, no veto/no write, Human decision handoff | none | core obligation retained | LOW / CORRECT |
| Designer / UI_FIRST or UX_FIRST design contract | design/asset coverage, read-only, handoff | `delegation` | detailed handoff technique omitted | LOW / CORRECT |
| Coder / ordinary source Task, selftest/repair | bounded authorized change, diff/verify, Goal Recheck, handoff | `coding-loop`, optional `debugging` | techniques omitted but generic delivery gate retained | MEDIUM; B-02 |
| Coder / U-D pre-code technical Task | generic implementation contract; no explicit U-D pre-code trigger | `coding-loop` U-D addon | proposal/CR sequence may be skipped | HIGH; A-02 |
| Coder / third same-defect independent Tester FAIL | generic root-cause investigation; no exact three-cycle stop | `coding-loop`, `debugging`, helper history | ordinary fourth patch may be attempted | HIGH; A-04 |
| Reviewer / plan or code | independent exact-revision review, findings/verdict/persistence | `planning-review`, `review-evidence` | specialist checklist omitted, core review persists | LOW–MEDIUM / CORRECT |
| Critic Reviewer / generic CR or CRL | Human/preauthorized milestone, blind verdict, compare last, CR record | `critic-review`, `review-evidence` | generic CR retained | LOW / CORRECT |
| Critic Reviewer / U-D pre-code proposal | generic CR only, no explicit precode focus | `critic-review` U-D addon | whole Task inventory criteria and focus may be omitted | HIGH; A-03 |
| Tester / practical VERIFY and RETEST | revision/readiness, categories, claim/verification, failure route, U-F stop | `testing-evidence` | detailed technique omitted, main evidence gate retained | LOW–MEDIUM / CORRECT |
| Tester / user action causal scenario | Role says when to load simulation and fidelity limits | `simulate`, host-managed `scenario-tester` if exposed | no scenario method, but must not claim host PASS; explicit skill request needed | CONDITIONAL / CORRECT |
| Coder / UI frontend Task | generic Coder and Designer/Human separation | `ui-coder-frontend` via NEXT `required_skills` | no specialized browser self-QA; NEXT Task injection addresses it | LOW if correctly tagged; POTENTIAL for Direct Agent |

**String-presence simulation:** Generic obligations for all eight Roles were present with Shared+Role alone. The Secretary creation duty, Coder U-D pre-code, Critic U-D pre-code focus, Coder U-F stop threshold and operation-artifact detail were absent from the relevant bare Role and present in specialized Skill text. The frontend UI technique was absent from generic Coder text and present in explicit Task-required UI Skill, which is intentional. Presence proves only available instruction text, not that the model obeyed it.

## Report D — Minimal Repair Proposal (no implementation authorized)

**P0 — Lock semantic rules before moving text.** Treat the current Human/Criteria/Plan/approval/branch/source/CAS/cursor/review/evidence invariants as immutable behavioral contracts. Build a unique ID for each obligation (owner, trigger, input, terminal condition, evidence, failure). Keep a source-of-truth mapping in code/tests rather than copying the full clause in multiple places.

**P1 — Repair missing mandatory Role/Workflow contracts first.**

1. **Secretary / existing receiving Agent:** shared 1–2 sentence rule for explicit Human-accepted decisions, with owner and complete save+independent readback or NOT_SAVED/BLOCKED terminal state. Existing Planner/Orchestrator executes routing/persistence; `secretary` becomes a procedural Skill called to help fulfill the mandatory duty. Keep proposed discussion unpersisted as accepted. Do not invent an extra Role, Job or approval.
2. **U-D Coder/CR:** define exact applicability **only to an already-approved U-D/pre-code workflow**, state existing CR authority conditions and required output/focus in short Coder and Critic Role/Workflow contracts; leave Markdown proposal construction and technical Critic checklist in their Skills. Resolve the apparent blanket-CR-vs-Human-only-CR tension before implementation; never auto-trigger a Human-only CR from ordinary code.
3. **U-F third-fail:** put one Coder/Orchestrator durable-history guard in the mandatory workflow; keep `debugging` and `retest-history` method conditional. Validate cross-Job/Chat identity and exact independent Tester evidence before counting cycles.
4. **Conditional operation files:** consider a short generic Host-operation authorization boundary in Coder Role only; keep CAD-specific file classification examples conditional, not global.

**P2 — Separate common rule from detailed HOW.** First remove redundancy in `index.ts` only after measuring host prompt delivery, and in Shared keep minimal universal invariant. Move long Planner/Bootstrap/LLC60 steps into already relevant Planner/Orchestrator procedural material; move CI diagnostics and L0/L1 techniques to existing Coder/Tester/Planner Skills. Maintain existing canonical authority and avoid new entity types or gates. Do not move hard guards (Human approval, cross-project auth, branch, scope, immutable evidence, run closure) out of mandatory source.

**P3 — Migrate through parity tests.** Establish existing full output as golden behavior for eight Roles; compare no-Skill and with-Skill prompts under each workflow, all authorization/closure states, and actual tool outcomes. Gate release on failure-mode parity and measured context improvement, not `harness_text.length` alone.

**Expected workflow effect:** **zero intentional workflow changes.** Corrections restore obligations that the already-accepted behavior requires. U-D's existing authority/applicability must be clarified **before** claiming parity; otherwise an unconditional pre-code gate would be an unauthorized workflow change.

## Report E — Test & Verification Plan

| ID | Test and oracle | Evidence level required |
|---|---|---|
| E-01 | Retrieve each of 8 `get_agent_harness` results with no `load_skill`; assert mandatory Role/output/security/evidence conditions survive | Source-executed / tool payload |
| E-02 | For each workflow, add only relevant `load_skill`; verify specialty methods appear while authority/output do not change | Source-executed |
| E-03 | Secretary: Human accepts multi-step solution with example, forbidden alternative and correction; must persist full DEC + independent SHA readback, or explicit NOT_SAVED/BLOCKED | Live host + real authorized Memory I/O |
| E-04 | Secretary: proposal-only discussion, no accepted decision; no false DEC/ACCEPTED | Live host |
| E-05 | Secretary: later Planner/Coder recover full HOW from original DEC after new chat; correction SUPERSEDES immutable previous record | Live host + Memory readback |
| E-06 | Planner: create/revise Plan with Goal anchors; independent Reviewer CHANGES_REQUIRED→repair→PASS→READY; no unexpected new gate or premature source Run | Live GSA role/tool tests |
| E-07 | Reviewer and Critic: independent exact-revision review and compare-last; CR denied without Human/milestone authorization, no source edits | Real tool auth + role test |
| E-08 | U-D applicable Task: no Skill vs Skill with PRE_CODE target; assert same approved obligation/focus, whole-related Task inventory and valid PASS readback; GENERAL focus cannot substitute | Tool guard + end-to-end |
| E-09 | U-D non-applicable Task/unauthorized CR: no blanket extra pre-code CR gate introduced | Negative end-to-end |
| E-10 | Coder ordinary implementation: exact authorized scope, real diff/checks, self-review, Goal Recheck, evidence and handoff with no Skill | End-to-end |
| E-11 | U-F: three independent exact same-defect PRODUCT_FAILURE cycles across Jobs/chats block ordinary patch #4 and trigger causal diagnosis; missing real host stays UNVERIFIED | Source-executed helper + live role/dispatch |
| E-12 | Tester: VERIFY vs MEASURE vs PROBE; claim lease, independent Test/Retest exact revision and mandatory evidence gate; no false PASS from CI no-runner | Live authorized tools |
| E-13 | UI Task required skill injected in `run_begin`; no unintended default for non-UI Task, unknown skills fail dispatch, Direct Agent policy checked separately | Tool payload + host observation |
| E-14 | Designer: UI_FIRST vs UX_FIRST produces design/asset contract with coverage and no source writes, even without delegation Skill | Role replay |
| E-15 | Advisor: Criteria consultation only at real checkpoint; no veto/approval/write; no additional Advisor gate on ordinary tasks | Role replay |
| E-16 | Orchestrator: routing/closure from durable Job/Task snapshots, same-turn continuation and Human approval stop, no ghost Job/Run or omitted Verification | End-to-end |
| E-17 | B-direction: keep mandatory markers in no-Skill output; measure output chars/token and number of tool calls per role; verify reduction only for irrelevant workflows | Actual MCP model/prompt measurement |
| E-18 | A4: prove current preview unconnected to production; separately test intentional integration later, failing closed for stale/unknown task context and unchanged mandatory gates | Integration/deployment test, if approved later |

**Existing tests inspected:** [`test-lab/gsa3-tool-skill-payload.test.cjs`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/test-lab/gsa3-tool-skill-payload.test.cjs#L39-L82) tests catalog/body delivery and exact full Harness rendering, not skill-omission role behavior; [`gsa4-a4-selective-harness.test.cjs`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/test-lab/gsa4-a4-selective-harness.test.cjs#L73-L103) tests conservative pure preview with `live_runtime_wiring:false` in source measurement; [`ud-precode-cr.test.cjs`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/test-lab/ud-precode-cr.test.cjs#L87-L125) explicitly verifies U-D remains in progressive Skill but does not test role omission; [`uf-three-cycle-retest.test.cjs`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/c150954b76fea919907edc15d0673aad2914a1f3/test-lab/uf-three-cycle-retest.test.cjs#L66-L75) covers pure helper cycle behavior, not cross-chat live enforcement. These are useful tests, not proof that a host Agent will always load a suggested Skill.

## Completion verdict and decision for Human

| Question | Conclusion |
|---|---|
| Confirmed classification defects | **1** — Secretary; includes explicitly observed prior failure |
| Source-grounded HIGH-RISK findings | **3** — U-D Coder, U-D Critic, U-F Coder |
| POTENTIAL findings | **5** — Coder operational artifact boundary, Shared procedures, Role method duplication, MCP server instruction duplication, job-planning workflow duplication |
| Roles affected directly by missing Skill obligations | Planner/current receiver (Secretary), Coder, Critic Reviewer; Tester supplies partially compensating U-F guard |
| Roles with broadly correct mandatory contracts | All 8 have generic role contracts; Advisor/Designer particularly clean; Orchestrator/Reviewer/Tester have explicit core evidence/authority duties |
| Skill-on-demand behavior | Actual on current `get_agent_harness`; suggested Skill is **not** auto-injected |
| Task-required skill behavior | NEXT Task-specific skill injection exists; currently `ui-coder-frontend` in Job preparation schema |
| A4 runtime | **Preview only**, not wired to production `get_agent_harness` |
| Runtime-verifiable model behavior | **Not independently executed** in this audit; `RUNTIME_VERIFIED=false` |
| Source modifications | **None** |

**Recommendation:** Approve a minimal **classification contract repair plan**, not a blanket loader change. Prioritize Secretary lossless decision persistence, clarify U-D applicability/CR authority and harden the Coder U-F stop, then strip redundant detailed HOW from always-loaded Shared/Role text only after regression tests demonstrate unchanged behavior and measured context reduction. STOP; Human chooses repair scope and implementation authorization.


---

## CRL corrective annex — line/section-level classification and independent challenge

**Scope and independence:** This is an offline, read-only Reviewer → report repair → Critic-style review of the audit artifact against a pinned source snapshot. It is **not** a separately admitted GSA Reviewer/Critic Run, nor a persisted `PLANNING_REVIEW`/`CRITIC_REVIEW` Verification, nor a production host/model replay. The same direct-agent session performed both review passes, so model-context independence is **not proven**. No source code was modified.

### CRL Reviewer pass — findings and disposition

| Finding | Severity | Challenge to first report | Disposition in this revision |
|---|---|---|---|
| RV-01 | IMPORTANT | A2/A3 inventory was grouped by Role/file, not sufficiently anchored to individual instruction sections. | Expanded with A5/A6 per-section mapping, retaining A1's all-49-clause inventory; no claim of AST-verified individual sentence classification. |
| RV-02 | IMPORTANT | B-01/B-02 were rated HIGH-RISK without an observed model failure or measured token cost. | Downgraded both to POTENTIAL behavioral/context impacts while explicitly preserving source-confirmed overlap; totals now 1 CONFIRMED, 3 HIGH-RISK, 5 POTENTIAL. |
| RV-03 | IMPORTANT | U-D source phrases could be construed as universal pre-code CR, in conflict with Human-only CR admission. | Marked U-D applicability as an unresolved contract ambiguity, not authority to create a new gate. Kept negative tests blocking unauthorized generalization. |
| RV-04 | IMPORTANT | Static instruction presence cannot prove a role actually loads/obeys Skill or a tool enforces the policy. | Kept STATIC_FINDING, explicit `RUNTIME_VERIFIED=false`, negative omission and real-host tests; source-read-only CRL does not claim execution PASS. |
| RV-05 | MINOR | No quantitative estimate of role-irrelevant Shared procedural payload. | Counted nine selected mixed clauses at 5,252 of 14,955 Shared rule-text characters (~35.1%). Do not equate this to tokens or realizable savings. |

### A5. Role instruction location map — section-level refinement

All locations are on pinned `main` SHA above, under `supabase/functions/gsa-mcp/harness/roles/`. Multiple classifications in one row mean the original clause mixes policy and method. `PROPOSE SPLIT` means **only the optional technical detail**, not the named role duty, is eligible to migrate.

| Role | Source instruction location | Classification | Boundary / recommendation |
|---|---|---|---|
| Orchestrator | `orchestrator.ts:3–9` | ROLE_INSTRUCTION, WORKFLOW_CONTRACT | Authority, durable routing/continuation and scenario repair owner: mandatory |
| Orchestrator | `orchestrator.ts:11–16` | WORKFLOW_CONTRACT | Identity→role selection→dispatch→persistence, mandatory |
| Orchestrator | `orchestrator.ts:17–20` | WORKFLOW_CONTRACT + SKILL_METHOD | Plan review/LLC60 continuation mandatory; detailed tool recipe split only after parity |
| Orchestrator | `orchestrator.ts:21–26` | WORKFLOW_CONTRACT + CONDITIONAL_SKILL | NEXT checkpoint, CI, scenario-specific routing; preserve gate, narrow diagnosis HOW |
| Orchestrator | `orchestrator.ts:27–31` | WORKFLOW_CONTRACT | Stop criteria, exact cursor/multi-Job/retry invariant, mandatory |
| Orchestrator | `orchestrator.ts:34–35` | ROLE_INSTRUCTION | Outputs and canonical refs, mandatory pointers |
| Planner | `planner.ts:3–6` | ROLE_INSTRUCTION | Own scope, topology, sized Jobs and repo boundaries |
| Planner | `planner.ts:9–14` | ROLE_INSTRUCTION + WORKFLOW_CONTRACT | New-message classifier, Criteria/Advisor/Goal/branch decisions |
| Planner | `planner.ts:15–24` | ROLE_INSTRUCTION + SKILL_METHOD | L0/L1/impact, decision discovery, critical challenge and UI mode; preserve expected coverage, optionally split detailed HOW |
| Planner | `planner.ts:25–30` | WORKFLOW_CONTRACT + SKILL_METHOD | Plan artifacts, GOAL anchors, decomposition, gates, coverage |
| Planner | `planner.ts:31–35` | WORKFLOW_CONTRACT | Exact persistence, role-isolated review, rework/READY and Human execution stop |
| Planner | `planner.ts:37–38` | ROLE_INSTRUCTION | Required outputs and reference pointers |
| Advisor | `advisor.ts:3–5` | ROLE_INSTRUCTION | Consultation authority, no review/veto/write |
| Advisor | `advisor.ts:8–12` | WORKFLOW_CONTRACT + SKILL_METHOD | Trigger/grounding/advice/choice/Human handoff; reasonable compact placement |
| Advisor | `advisor.ts:14–15` | ROLE_INSTRUCTION | Expected outputs / reference pointers |
| Designer | `designer.ts:3–6` | ROLE_INSTRUCTION, WORKFLOW_CONTRACT | UX design owner, read-only, UI_FIRST/UX_FIRST applicability |
| Designer | `designer.ts:9–13` | WORKFLOW_CONTRACT + SKILL_METHOD | Observe/model/specify/coverage/handoff, modest conditional HOW |
| Designer | `designer.ts:15–16` | ROLE_INSTRUCTION | Required design and asset evidence |
| Coder | `coder.ts:3–6` | ROLE_INSTRUCTION | Source scope, HOW ownership, no merge/release authority |
| Coder | `coder.ts:9–13` | WORKFLOW_CONTRACT + SKILL_METHOD | Source, DEC, per-Task addin, branch and preparation requirements |
| Coder | `coder.ts:14–19` | WORKFLOW_CONTRACT + SKILL_METHOD | Edit→diff→verify→self-review→bounded repair; primary duty mandatory |
| Coder | `coder.ts:20–22` | WORKFLOW_CONTRACT | Scenario repair, Goal Recheck, persisted handoff; missing conditional U-D/U-F trigger noted |
| Coder | `coder.ts:24–25` | ROLE_INSTRUCTION | Source/Goal Recheck/evidence outputs |
| Reviewer | `reviewer.ts:3–6` | ROLE_INSTRUCTION | Independent revision-bound read-only reviewer |
| Reviewer | `reviewer.ts:9–15` | WORKFLOW_CONTRACT + SKILL_METHOD | Independent plan/code/DEC review and drift/trace; avoid losing mandatory outcomes |
| Reviewer | `reviewer.ts:16–20` | WORKFLOW_CONTRACT | Findings/verdict/persistence/repair routing |
| Reviewer | `reviewer.ts:22–23` | ROLE_INSTRUCTION | Review record, findings and canonical references |
| Critic Reviewer | `critic_reviewer.ts:3–7` | ROLE_INSTRUCTION | Human/milestone authority, statelessness, blind verdict, no edits |
| Critic Reviewer | `critic_reviewer.ts:10–16` | WORKFLOW_CONTRACT | Ground→blind review→verdict→compare-last→persist; special U-D focus absent |
| Critic Reviewer | `critic_reviewer.ts:18–19` | ROLE_INSTRUCTION | CR record and findings output |
| Tester | `tester.ts:3–10` | ROLE_INSTRUCTION, WORKFLOW_CONTRACT | Read-only, mode/readiness/lease bounds, no false PASS |
| Tester | `tester.ts:12–17` | WORKFLOW_CONTRACT + SKILL_METHOD | Ground→addin→claim→plan→capability→execute, mandatory lease/permissions |
| Tester | `tester.ts:18–24` | WORKFLOW_CONTRACT + SKILL_METHOD | Verdict classification, Retest, simulation trigger, routing and evidence gate |
| Tester | `tester.ts:25` | WORKFLOW_CONTRACT | U-F third full independent PRODUCT_FAILURE stop (Tester-owned) |
| Tester | `tester.ts:27–28` | ROLE_INSTRUCTION | Test/Retest outputs and references |

### A6. Runtime Skill instruction location map — method versus core policy

All paths below are under `supabase/functions/gsa-mcp/harness/skills/`. A `WORKFLOW_CONTRACT` in a Skill is **not automatically wrong**: it is a misclassification only if the obligation must survive omission for the already-applicable Role/workflow. Skill-scoped safety requirements remain mandatory while that Skill is active.

| Skill | Source instruction location | Content classification | Disposition |
|---|---|---|---|
| `delegation` | `delegation.ts:4–16` | SKILL_METHOD; includes existing authority precedence | CORRECT; never grant new role authority |
| `critical-challenge` | `critical-challenge.ts:4–13` | SKILL_METHOD; preserve Human WHAT/WHY as policy already in Planner | CORRECT; optional challenge technique |
| `job-planning` | `job-planning.ts:5–14,17–18,20–26` | SKILL_METHOD + specialized UI workflow technique | CORRECT method, some duplicates |
| `job-planning` | `job-planning.ts:15–16,19,27` | WORKFLOW_CONTRACT (GOAL, required UI Skill, review/READY) | MIXED: keep canonical obligation in Role/Shared and detail in Skill |
| `secretary` | `secretary.ts:5–9,11–12` | ROLE_INSTRUCTION + WORKFLOW_CONTRACT (activation, full-fidelity DEC, readback/SUPERSEDES, governance) | CONFIRMED misplaced mandatory duty; repair existing-owner Role/shared contract |
| `secretary` | `secretary.ts:8–10` | SKILL_METHOD (exact DEC path, CAS, indexing, Plan mapping) intertwined with duty | SPLIT; detailed method can remain on-demand |
| `coding-loop` | `coding-loop.ts:4–12,26–63` | SKILL_METHOD + repeated ordinary Coder completion contract | CORRECT technique; remove duplication only after behavior parity |
| `coding-loop` | `coding-loop.ts:13–25` | CONDITIONAL_SKILL + host operation authority reminders | POTENTIAL mixed; preserve authorization invariant |
| `coding-loop` | `coding-loop.ts:64` | WORKFLOW_CONTRACT (U-F three-cycle stop) | HIGH-RISK when Coder Skill omitted |
| `coding-loop` | `coding-loop.ts:70–82` | WORKFLOW_CONTRACT + CONDITIONAL_SKILL (U-D proposal, Critic focus/coverage, construction method) | HIGH-RISK: first define exact U-D applicability and retain existing Human authority |
| `debugging` | `debugging.ts:4–13,16` | CONDITIONAL_SKILL causal analysis and evidence method | CORRECT conditional |
| `debugging` | `debugging.ts:14–15` | WORKFLOW_CONTRACT reminder (durable U-F identity/stop) | DUPLICATE of policy; cannot be sole hard boundary |
| `review-evidence` | `review-evidence.ts:4–15` | SKILL_METHOD; partial duplicate of Reviewer Role | CORRECT with possible deduplication |
| `planning-review` | `planning-review.ts:5–21` | SKILL_METHOD + WORKFLOW_CONTRACT (exact revision, evidence, reviewer routing) | MIXED duplicate; Role retains terminal duty |
| `critic-review` | `critic-review.ts:5–12` | WORKFLOW_CONTRACT duplicated from Critic Role, with skill method | CORRECT authority duplication but minimize text |
| `critic-review` | `critic-review.ts:19–24` | CONDITIONAL_SKILL + U-D WORKFLOW_CONTRACT | HIGH-RISK if pre-code review focus not known without Skill |
| `testing-evidence` | `testing-evidence.ts:6–20,29–33` | SKILL_METHOD (modes/readiness/report) | CORRECT |
| `testing-evidence` | `testing-evidence.ts:21–27,34–42` | WORKFLOW_CONTRACT + SKILL_METHOD (lease, source read-only, Retest, U-F stop) | Core contract exists in Tester Role; duplication acceptable only with parity |
| `tester-lab` | `tester-lab.ts:4–37` | CONDITIONAL_SKILL (standalone Lab and evidence) | CORRECT: not default/production lifecycle |
| `ui-coder-frontend` | `ui-coder-frontend.ts:5–12` | CONDITIONAL_SKILL + scoped Coder/Designer/Human rights | CORRECT for applicable UI Task, not a new Role |
| `ui-coder-frontend` | `ui-coder-frontend.ts:14–33` | CONDITIONAL_SKILL frontend implementation, browser QA, assets/handoff | CORRECT; NEXT injection required if Task declares it |
| `simulate` | `simulate.ts:15–18,40–45` | CONDITIONAL_SKILL + applicability/evidence restrictions | CORRECT; cannot be host PASS substitute |
| `simulate` | `simulate.ts:20–38` | CONDITIONAL_SKILL frozen oracle/causal tracer, S1–S4 method | CORRECT on-demand |
| `retest-history.ts` | `retest-history.ts:1–249` | Read-only TypeScript helper, not registered runtime Skill | NOT A SKILL; cannot count as a loaded host method |

### CRL Critic-style pass — adversarial checks

1. **Secretary ownership:** Planner alone cannot cover a User message already received by Coder/Reviewer/Orchestrator. Adding an unconditional shared accepted-decision obligation requires an exact existing-owner routing/completion definition. Status: **OPEN DESIGN QUESTION**, not permission to invent a ninth Role or independent Job.
2. **U-D authorization contradiction:** a proposed `PRE_CODE_TECHNICAL` completion contract must not imply globally automatic CR. Existing direct Human or explicitly preauthorized milestone conditions remain unchanged. If source lacks an unambiguous applicability flag, stop and request a narrow Human design choice **during repair planning**, not a new product gate. Status: **HIGH-RISK CONFIRMED FROM SOURCE, SEMANTIC SCOPE UNRESOLVED**.
3. **U-D focus bypass:** `critic-review-tools.ts` accepts optional `review_focus`; complete pre-code inventory validation runs only on explicit `PRE_CODE_TECHNICAL` + PASS-family outcome. A GENERAL PASS cannot be treated as equivalent to a pre-code PASS. Status: **HIGH-RISK STATIC_FINDING**; propose cross-focus negative tests.
4. **U-F live enforcement:** Tester Role knows the third-cycle stop; Coder Role alone does not. The helper is not a dispatch hook, and a helper test is not proof that a new Coder chat reads history. Status: **HIGH-RISK STATIC_FINDING**.
5. **Reverse misclassification:** Role-irrelevant always-loaded HOW is measurable by characters but not, by itself, an execution/security failure. Lines selected for possible splitting include mandatory content; remove only with exact invariant ownership and regression tests. Status: **POTENTIAL**.
6. **No false live claims:** 0 ChatGPT host-level independent CR Runs, 0 production model replays, 0 newly executed local repository test suites and 0 GitHub workflow runs demonstrated for this pinned SHA by the CRL. All live/model behavior conclusions remain **UNVERIFIED**.

### CRL verification scenarios added (negative controls)

| Test | Required outcome |
|---|---|
| CRL-N01: a genuinely accepted decision received by non-Planner Role | Existing receiver must route/fulfill the lossless persist/readback duty, or say NOT_SAVED/BLOCKED; no new Job/Role |
| CRL-N02: non-U-D code Task without CR authorization | Neither Skill omission nor report repair may introduce a pre-code CR gate |
| CRL-N03: an authorized U-D pre-code target passed as GENERAL review focus | General CR PASS must not satisfy U-D whole-proposal verification requirement; exact target/focus must be reconciled |
| CRL-N04: three same-defect failures from past Jobs/chats | Coder cannot run ordinary patch #4 until durable history and causal diagnosis are handled under existing authorization |
| CRL-N05: remove a role-specific Shared detail clause | Role-specific workflow retains owner, trigger, gate, evidence, failure/stop route; output reduction is measured separately |
| CRL-N06: no loaded Skills for each of 8 Roles | Generic core responsibilities remain visible; specialist capability is explicitly on-demand or blocked if Task-required |

### CRL disposition and limits

- **Reviewer pass:** CHANGES_REQUIRED initially; report corrections are incorporated in this document. The codebase remains unchanged.
- **Critic-style assessment of corrected document:** **PASS_WITH_FINDINGS (STATIC REPORT QUALITY ONLY)**: report now distinguishes mandatory-contract loss from redundant context, has source-anchored Role and Skill section mapping, and does not infer runtime execution from text presence. This is an analytical verdict, not an official independent GSA Critic Verification.
- **Official GSA CRL:** **NOT EXECUTED / NOT PERSISTED** because the request retains Direct Agent, no GSA plugin and source-read-only constraints; no invented CR/CRL record, fresh-chat isolation or Human authorization bypass is claimed.
- **Classification counts after correction:** **1 CONFIRMED** (Secretary observed), **3 HIGH-RISK** (U-D Coder, U-D Critic, U-F Coder), **5 POTENTIAL** (Coder operation boundary, Shared overlap, Role overlap, server instructions, job-planning duplicate).
- **Behavioral/runtime PASS:** **NOT VERIFIED**; proposals are not authorizations to implement.
- **Repository write/commit/merge/deploy:** NONE.