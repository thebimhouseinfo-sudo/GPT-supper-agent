# GSA4 — RESEARCH B: Capability/Lifecycle File Splitting

**Date:** 2026-11-04  
**Status:** COMPLETE — PAPER RESEARCH / SELF-REVIEW ONLY; NOT SOURCE-EXECUTED OR HOST-OBSERVED  
**Execution:** DIRECT_AGENT — RESEARCH ONLY, GitHub source inspection, no GSA plugin, no Job/Bootstrap, no runtime change  
**Repository/branch:** `thebimhouseinfo-sudo/GPT-supper-agent` / `upgrade/gsa-context-efficiency`  
**GSA3 source pin:** `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`  
**GSA3 catalog blob:** `f8ec1edd68786dc1333edeb4b68d8120b02da53c` (the development branch was read back and has the *same* catalog blob)  
**Study ownership:** B only; Chat A report intentionally not read.  
**Implementation authorization:** NONE; do not interpret this report as R6–R8, physical extraction approval, parity PASS, merge or deploy.

## GOAL

Compare a **hypothetical, behavior-preserving, six-file BASE-B** with selective access to Role, Task, Skill and shared-policy information under **exactly the same four frozen User journeys** as the parallel Research A. Separate source navigation from the text actually delivered through MCP; propose the simplest safe next experiment, not an implementation decision.

## 1. Evidence, freeze and measurement contract

Read on the development branch:

| Input | Git blob SHA |
| --- | --- |
| `GSA4-RESEARCH-PLAN.md` | `a59b0ee3f91f63a1a1f4e86a2e311278b002c839` |
| `GSA4-R1-R3-SPLIT-OPTIONS-PAPER-SIMULATION-20261104.md` | `7ec0b6f84526bb3700b83a91ebe4d28aca2d812e` |
| `GSA4-A-B-FOLLOWON-FORECAST-20261104.md` | `c7cf8616e7f45cb1a07b7c2b5d1761a709249fda` |
| `GSA4-SIM4-FROZEN-USER-JOURNEYS.md` | `b266d3f15e619413b7a3c40d24e7a75664bdbebf` |

Verified source at pinned GSA3 SHA: `supabase/functions/gsa-mcp/harness-catalog.ts` (608 lines, **85,330 JS string-length characters**), `harness-skill-tools.ts` (5,057 chars), `run-execution-tools.ts` (49,080 chars), and `docs/architecture/AGENT-HARNESSES.md` (30,717 chars). The last three were inspected as context/behavior evidence; **they are not part of the six simulated files or the arithmetic**.

- **SOURCE_STATIC:** catalog content, role/skill keys, tool registrations, exact baseline Harness string lengths, skill-body text lengths and source ranges.
- **SCENARIO_SIMULATED:** presumed role activations, optional Skill loads, hypothetical whole-file or section-range reads, index overhead and optimization percentages.
- **NOT OBSERVED:** Host/model tokens, latency, actual source-navigation frequency, caching across agents, independent Reviewer execution or the original installed `simulate` skill. Four SIM4 fixtures are *frozen in a prior document*, but that document acknowledges its author had already inspected GSA source. Therefore these are **not genuinely source-blind independent Designer/Tracer fixtures**.
- **No-double-counting rule:** `get_agent_harness`/`load_skill` return both `structuredContent` and a JSON `content` mirror. Each logical `harness_text` or `skill_text` is counted **once**, not twice. Tool metadata/JSON envelope, Project Criteria/Plan/code/logs/evidence, network bytes and possible extra Host instructions are out of scope.
- **Counting convention:** “character” = JavaScript UTF-16 string length (source and generated text), **not tokenizer tokens**. Physical BASE-B files do **not exist**; source-size accounting assigns original catalog characters to conceptual groups, with unchanged behavior and no new import boilerplate. Additions from real extraction must be measured later.

**Important sequencing constraint:** The common Research Plan forbids treating later selective loading as a completed R6–R8 phase before actual physical extraction/parity. The Human has explicitly requested this *paper follow-on B research*; all selective figures below remain **counterfactual forecasts**, not evidence of an implemented GSA4 mechanism.

## 2. BASE-B index — six hypothetical source files

Source allocation is a **lossless character attribution** of the pinned monolith; lines are **original GSA3 anchors**, not promised line numbers after extraction. Source spans preserve role/skill ownership. The generated facade/import/re-export overhead is not yet known.

| File | Responsibility | Roles / Skills assigned | Source chars | Agent uses it / condition for source read |
| --- | --- | --- | ---: | --- |
| `harness-catalog.ts` (parent facade) | Public maps, role→skill lookup, exports and `renderHarness`; linking rather than full content | `ROLE_SKILLS`, `ROLE_HOST_SKILLS`; public entrypoints | **1,761** | Any role **only if navigating source** or investigating dispatch/rendering; runtime import is not model read |
| `harness-core.ts` | Entire original shared rules unchanged | `BASE_AGENT_HARNESS` | **15,285** | Every `get_agent_harness` payload indirectly; only a separate source read if examining shared-policy implementation |
| `harness-governance.ts` | Control, human authority, advisory and delegation | Orchestrator; Advisor; `delegation` | **10,665** | Orchestrator/Advisor and delegation work; unnecessary source for ordinary isolated Coder/Reviewer |
| `harness-planning.ts` | Intake, criteria/plan development and related skills | Planner; `critical-challenge`; `job-planning` | **17,800** | Planner and planning activities |
| `harness-delivery.ts` | Design and code delivery | Designer; Coder; `debugging`; `coding-loop`; `ui-coder-frontend` | **15,382** | Designer/Coder and task-specific delivery |
| `harness-verification.ts` | Planning/code review, CR, test and lab verification | Reviewer; Critic Reviewer; Tester; `critic-review`; `planning-review`; `review-evidence`; `testing-evidence`; `tester-lab` | **24,437** | Reviewers/Tester; may reread the same broad file for independent role activations |
| **TOTAL** | **Parent + five modules** | Eight roles, eleven runtime Skills | **85,330** | Exactly one allocation of every character from original catalog |

Attribution method, original catalog ranges (inclusive): parent L56, L260–279, L579–608 (terminal newline adjusted by one character); core L1–55; governance L57–92 + L131–146 + L406–422; planning L93–130 + L309–353; delivery L147–188 + L280–294 + L354–405 + L544–578; verification L189–259 + L295–308 + L423–543. The attribution **does not create syntactically valid files**, solve import ordering or prove TypeScript parity.

### 2.1 An Agent does NOT necessarily read the whole grouped source file

**Three distinct cost channels, not interchangeable:**

1. **Source-file navigation:** model or tool actually fetches catalog source, e.g. a developer/auditor reads `harness-delivery.ts`. The “three full files per activation” below is an **explicit paper stress-test assumption** (facade + core + owning group), not an assertion GSA automatically does this. In a normal tool-driven Agent turn, catalog source-file reads can be **zero**.
2. **`get_agent_harness(role, mode)` payload:** `harness-skill-tools.ts` calls `renderHarness(role, { includeProgressiveSkills: false })`. Existing GSA3 already selects *one* `ROLE_HARNESSES[role]` along with *all* Shared Harness. Other roles sitting in the same TS module **are not delivered**. Mode is `JOB` or `DIRECT_AGENT`, with the same renderer; role isolation is a logical contract independent of file grouping.
3. **`load_skill(name)` payload:** exactly the named `RUNTIME_SKILLS[name].body` is loaded on demand. `get_skill_catalog` lists names/descriptions only; `ROLE_SKILLS` are **suggestions**, not full bodies; `ROLE_HOST_SKILLS.tester = ['scenario-tester']` is a reference to a Host skill and is **not** a GSA `load_skill` body. In a NEXT Run, `run_begin.required_skill_contexts` may separately inject *required Task skills*: do not load/charge the same Skill twice if already supplied.

Documents such as `AGENT-HARNESSES.md`, `JOB-LIFECYCLE.md`, `PROJECT-MEMORY.md`, actual Criteria and product source are **references**, not automatically fetched because listed in `canonical_refs`. Role+Skill source ranges are *not* the same as live Harness+Skill payload length.

### 2.2 Pinned role and skill payload lengths

`get_agent_harness` generated `harness_text` lengths (reconstructed from source, with progressive skill suggestions suppressed):

| Role | Harness chars | BASE-B whole-source navigation proxy per role (parent + core + group) |
| --- | ---: | ---: |
| Orchestrator | 22,420 | 27,711 |
| Planner | 23,716 | 34,846 |
| Advisor | 16,502 | 27,711 |
| Designer | 16,463 | 32,428 |
| Coder | 19,085 | 32,428 |
| Reviewer | 18,619 | 41,483 |
| Critic Reviewer | 16,972 | 41,483 |
| Tester | 20,054 | 41,483 |

The `BASE_AGENT_HARNESS` **generated text** is 14,982 chars; its **source span** is 15,285. Full skill bodies counted once by generated `skill_text`: `debugging` 1,331; `critic-review` 1,004; `critical-challenge` 2,184; `job-planning` 5,861; `coding-loop` 4,174; `delegation` 1,006; `planning-review` 2,974; `review-evidence` 1,178; `testing-evidence` 3,929; `tester-lab` 2,170; `ui-coder-frontend` 2,648.

A Reviewer loading `harness-verification.ts` in a source-inspection workflow sees source for *three* roles and five Skills, although its **MCP Harness payload remains Reviewer-only**. An independent Tester may legitimately fetch that broad module again in its own isolated context. No implicit Host cache can be credited.

## 3. Frozen SIM4 journeys → four role activation diagrams

**Simulation policy:** user intent/acceptance remains `S1–S4` from the frozen SIM4 blob, not rewritten after tracing source. Each diagram is a **minimum eligible Direct Agent trace** with affirmative authorizations assumed as specified; an Orchestrator may coordinate durable NEXT execution, but **its extra model activation is not asserted without observation**. A tool dispatch is not silently counted as an additional model Agent. Source files shown in the graphs are conceptual; no physical B files were fetched.

### S1 — Brownfield Bootstrap, Criteria already exist

`User → Planner (receiving/default Direct Agent) → inspect authoritative current Criteria/Project/Plan and minimal source evidence → classify readiness/gaps → status/handoff/STOP`

- **Harness/source/Skill:** `Planner` → `get_agent_harness(planner,DIRECT_AGENT)`; theoretical reads `parent + core + planning`; **no mandatory `job-planning` body** because this frozen success path does not create a new Job/Plan.
- **Result:** reuse approved Criteria and current identities; do not open a duplicate Job, reapprove Criteria or issue code execution. If facts are missing, report exact blocker. Advisor is **not** auto-triggered by Bootstrap.
- **STOP/recovery:** missing/denied authority or inaccessible Criteria/Plan → stop at accurate status and request only genuinely unavailable evidence; never bypass denial with another transport.

### S2 — Continue Coding on previously approved Task

`User → Coder (current scoped Task/Run and cursor reconciled) → Reviewer (independent diff/evidence) → Tester (verification) → evidence/closure or lawful handoff`

- **Harness/source/Skill by activation:**
  - Coder: `parent + core + delivery`; `coding-loop` (4,174-char body; `run_begin` can supply required Task Skills separately).
  - Reviewer: `parent + core + verification`; `review-evidence` (1,178).
  - Tester: `parent + core + verification`; `testing-evidence` (3,929).
- **Result:** no rebootstrap or renewed per-Task Human approval. Read current Job revision and Git/cursor/verification source of truth, restrict edits to approved scope, obtain revision-bound independent evidence.
- **STOP/recovery:** stale branch/Task, unauthorized Run or uncertain write → read authoritative SHA/blob/cursor, use lawful recovery evaluation, stop on conflict/denial; never retry by guessing, never state PASS from an absent Tester result.

### S3 — Test → Fix Product Bug → Retest

`User → Tester (classify observed failure) → [PRODUCT_FAILURE verified?] → Coder (root-cause repair) → Reviewer (diff evidence) → Tester (independent RETEST) → PASS or bounded repair/retest`

- **Harness/source/Skill:** Tester `verification + testing-evidence` → Coder `delivery + coding-loop + debugging` (conditional) → Reviewer `verification + review-evidence` → Tester `verification + testing-evidence`. Every activation has parent/core in the whole-file source proxy.
- **Result:** only verified product defect reaches Coder; Tester retest is a **new independent activation** and pays its payload again. Orchestrator's scenario test-repair ownership remains binding for governed lifecycle routing, though an additional Orchestrator model call is *not fabricated* in this minimal trace.
- **STOP/recovery:** unavailable test host or no reproducible product evidence → BLOCKED/UNVERIFIED **without** Coder. Repeat product failure → expand root-cause evidence and bounded rerun, not infinite blind fixes.

### S4 — New Feature, Plan → review → Human approval → code/test

`User → Planner (classify/clarify, skeleton, Plan) → Reviewer (independent PLANNING_REVIEW) → [HUMAN approval gate] → Coder (approved source Task) → Reviewer (source review) → Tester (test) → closure`

- **Harness/source/Skill:** Planner `planning + critical-challenge + job-planning`; planning Reviewer `verification + planning-review`; Coder `delivery + coding-loop`; source Reviewer `verification + review-evidence`; Tester `verification + testing-evidence`. Each source navigation includes parent/core.
- **Result:** in this *full-path* positive fixture Human approval is an external event, **not an Agent activation**. Never invent or auto-grant approval. Planning Reviewer and implementation Reviewer are **two separate activations** with separate evidence targets.
- **STOP/recovery:** without explicit Human implementation approval, halt after reviewed Plan; with material Criteria change, route appropriate Human/Advisor consultation rather than silently revising WHAT/WHY; with review/test failure, restore correct isolated repair loop.

**Role/Skill/Source trace shorthand** for each invocation: `User request → receiving role → existing get_agent_harness(role) → suggested or required conditional Skill → theoretical {parent,core,group} source access (only if inspection occurs) → Project/Job/Task/Run and live evidence references (not counted) → output/handoff.`

## 4. BASE-B quantitative results: whole-file source-read paper proxy

**Baseline assumptions frozen here:** every activated role independently opens **exactly three** hypothetical files (parent, core, its owning group), each file **in full** for that activation; no cross-agent cache; optional Skill bodies are loaded exactly as shown in `3`, not all suggestions. No additional Orchestrator, Advisor, Designer or CR activations in the four *minimum positive paths*. These deliberately aggressive source-read assumptions expose grouped-file excess; they **must not** be misrepresented as observed normal GSA behavior.

| Journey | Role activations | Full-source file reads | Full-source chars (paper) | Harness calls / chars | Skill loads / body chars | Model-facing body total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| S1 Bootstrap | 1 | 3 | **34,846** | 1 / 23,716 | 0 / 0 | **23,716** |
| S2 Continue Coding | 3 | 9 | **115,394** | 3 / 57,758 | 3 / 9,281 | **67,039** |
| S3 Test–Bug–Retest | 4 | 12 | **156,877** | 4 / 77,812 | 5 / 14,541 | **92,353** |
| S4 New Feature | 5 | 15 | **191,723** | 5 / 100,093 | 6 / 20,300 | **120,393** |
| **TOTAL** | **13** | **39** | **498,840** | **13 / 259,379** | **14 / 44,122** | **303,501** |

The source and model-facing totals are **different meters**, not automatically a “sum of tokens in ChatGPT.” If the role instead calls only existing MCP Harness and Skill tools and **never opens catalog TS source**, its catalog **source-file reads are 0**, while its applicable `harness_text` and `skill_text` remain as in the model-facing column.

**Repeated reads:** S2 opens verification twice (Reviewer then Tester); S3 three times (Tester, Reviewer, Tester); S4 three times (two Reviewers and Tester). This is a major excess under whole-group source navigation, not proof that current runtime transmits verification source in any of those calls. For the four minimum paths the union of distinct hypothetical file *identities* is only parent/core/planning/delivery/verification = 5; **39** is the count of **per-activation reads**, not unique repository paths.

**Role-activation sensitivity:** an *additional* Orchestrator invocation changes this proxy by **+3 full-file reads / +27,711 source chars / +22,420 Harness chars**, plus optional `delegation` 1,006 chars if actually loaded. Advisor, Designer and CR add their own corresponding row from `2.2`, never a silent zero-cost transition. Loops or repeat defects increase role calls; do not extrapolate a fixed production Job total from these four paths.

### 4.1 Control/failure sensitivity

| Variant | Actual role path to count (no fabricated later work) | Constraint preserved |
| --- | --- | --- |
| S1 missing authority | Planner only → BLOCKED/STATUS | Existing Criteria not edited/reapproved |
| S2 lost Git write response | Coder readback/reconcile → either continue later or STOP | No repeated blind commit; per-activation rereads are only counted when actually modeled |
| S3 unavailable host | Tester only → UNVERIFIED | **No Coder**, no manufactured green retest |
| S3 failed retest | Tester → Coder → Reviewer → Tester, then additional lawful repeat | Additional roles/reads must be added per loop; bound by evidence/no-progress |
| S4 Human has not approved | Planner → planning Reviewer → STOP | **No Coder/Tester**, Human Gate intact |
| S4 Criteria delta | consultation/Plan revision before any source write | Advisor only on relevant Human trigger, independent Reviewer after revised Plan |

These variants are **logic assertions** for review, not source-executed tests or claims of a live PASS.

## 5. BASE-B optimizations: isolated design options, no double counting

### B-OPT1 — Role-keyed selection within large group

**Trigger:** every `get_agent_harness(role)` request, including initial Direct Agent activation and handoffs. **Mechanism:** keep B's six files and perform keyed lookup of one named Role. **Source fact:** current `ROLE_HARNESSES[role]` and `renderHarness()` already do this; `ROLE_SKILLS[role]` returns suggested names, not the whole mixed group. **Incremental model-facing saving: 0 / 303,501 = 0.0%** against GSA3-based BASE-B. File-level source reading still requires a targeted-range mechanism (B-OPT4); do **not** credit it here as well.

**Changes:** no new runtime selector for plain Role filtering; optionally document explicit stable Role IDs/owner map (LOW). **Tools:** no extra MCP call required; independent Agent must still load its own authoritative Harness. **Risks:** assuming role filtering also filters Shared Harness or automatically narrows source reads; conflating TypeScript co-location with payload. **Unknown-role fallback:** reject unknown authenticated role as today; never send an arbitrary neighboring Role, never silently drop mandatory instructions.

### B-OPT2 — Task-specific subsections within the selected Role

**Trigger candidates:** Planner *brownfield-bootstrap* vs *new-Plan*, Coder *implement* vs *debug*, Reviewer *planning* vs *source*, Tester *probe* vs *retest*. **Current fact:** role loops are not formal task-addressable/policy-reviewed sections. Existing `role` is typed; a trusted complete Task/Phase semantic selector is **not demonstrated**. NEXT task metadata is bounded by `run_begin` and revision/guard checks; a raw request label or fabricated `verified=true` must not become authority.

**Eligible text illustration:** original Role loop bodies are Planner **7,680** chars, Coder **3,635**, Reviewer **3,140**, Tester **3,916**. As a *nonvalidated what-if only*, trimming 25% of Planner/Coder role-loop text in their **2 Planner + 3 Coder** activations would reduce approximately **6,566 chars / 303,501 = 2.16%** of the four-journey model-facing meter. **Validated saving: 0**, because no safely removable sections have been independently established; there is no basis to assume that 25% is optional or that other roles yield the same. This forecast must not be stacked onto B-OPT5/shared-ownership reductions without assigning each rule to one bucket first.

**Changes:** explicit task taxonomy, trusted run-source provenance, owner/policy section IDs, signed or otherwise trusted task binding, exact task-fallback tests, mandatory rule inclusion checks, golden Harness snapshots and reviewer isolation tests. **Complexity: HIGH**, chiefly correctness/authorization—not TypeScript slicing. Potential extra task-discovery fetches if metadata not already available. **Fallback:** full GSA3 Role Harness + relevant default Skill when Task ambiguous, stale, absent or a mismatched Job/Phase; never infer a cheaper incomplete Harness from chat text.

### B-OPT3 — Progressive Skills (core + conditional sections)

**Trigger:** an actually relevant Skill. **Current fact:** `get_skill_catalog` is descriptions only; `load_skill(name)` already loads *one* Skill, and NEXT `required_skill_contexts` may inject it. The **14 Skill loads / 44,122 text chars** in the fixture are **already progressive**. Merely renaming, re-splitting or making Skill loading “lazy” gives **0 additional saving**.

**Optional future refinement:** only for demonstrably long Skills with distinct task sections, e.g. `coding-loop` (4,174 chars) plus `debugging` (1,331, already conditional). A deliberately optimistic **40%-smaller standard `coding-loop` in S2 and S4 only** yields ~**3,339 chars / 303,501 = 1.10%** of total fixture model text; S3 must still load its needed debugging instructions and is **not** credited. This is **paper arithmetic, not an identified safe cut**. If split-core plus one section needs more calls, measure those calls and latency before claiming a win.

**Changes:** stable Skill section IDs and preservation tests, required Task-skill injection across `run_begin`, no duplicate `load_skill` when injected, code review of every omitted imperative. **Complexity: MEDIUM** (HIGH if splitting security-critical Skill contracts); optional +0/+1 or more calls per refined Skill; high index/section drift cost if too many microsections. **Fallback:** full unmodified Skill body. Do not treat `scenario-tester` Host skill as installed just because its name is suggested.

### B-OPT4 — Indexed source navigation / range reads within six files

**Trigger:** **only** Agent/developer tasks that actually inspect Harness/Skill **source**, not normal MCP payload-only runs. Keep six files; add symbolic anchors/section map to existing facade and use exact validated line/range reads for one Role and relevant Skill(s) instead of reading a whole co-located group. In the paper model, retain parent and core; replace **full group source** by precise **Role source span + explicitly loaded Skill source spans**. All source ranges are computed from pinned GSA3 text; this is a theoretical **lower bound on selectable content** before real syntactic extraction and index costs.

| Journey | BASE-B full source | Role+Skill-range source (before index) | Index allowance (200 chars / activation) | OPT4 source incl. index | Reduction vs BASE-B | Source fetches BASE → OPT4 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| S1 | 34,846 | 26,140 | 200 | 26,340 | 8,506 (24.4%) | 3 → 3 |
| S2 | 115,394 | 75,255 | 600 | 75,855 | 39,539 (34.3%) | 9 → 12 |
| S3 | 156,877 | 103,649 | 800 | 104,449 | 52,428 (33.4%) | 12 → 17 |
| S4 | 191,723 | 134,280 | 1,000 | 135,280 | 56,443 (29.4%) | 15 → 21 |
| **TOTAL** | **498,840** | **339,324** | **2,600** | **341,924** | **156,916 (31.5%)** | **39 → 53** |

Here 200 chars/activation is an explicit **illustrative index-budget assumption** (not measured). “Fetches” assumes separate source-range operations for facade, core, Role and each required Skill; some tool clients may coalesce adjacent ranges, but no such capability or latency is observed. In particular S4's Planner group already consists only of its Role plus both selected Skill source blocks, so the selector does **not** materially reduce that Planner source read. **Model-facing MCP payload saving from OPT4 alone: 0 / 303,501 = 0.0%.**

**Changes:** generated symbol→file/range map tied to source revision, consistency test on export/role/skill count, index checksum/anchor verification and safe invalidation/recomputation on edits. **Complexity: MEDIUM–HIGH** due to extra calls, source movement, stale offsets and risk of silently selecting the wrong snippet. **Fallback:** entire relevant module plus full current Role/Skill tool payload; if symbolic lookup is ambiguous, no partial critical rules. Before approving, compare **time to read 53 small ranges versus 39 larger reads**, not just character count.

### B-OPT5 — Shared Harness ownership (role/lifecycle policy audit)

**Trigger:** every `get_agent_harness` after a future, independently reviewed **ownership classification of shared rules**. Keep genuinely universal rules always; route nonuniversal shared rules to the appropriate verified Role or lifecycle condition without textual duplication or lost hard guards. Current GSA3 returns **14,982 chars of Shared text for every role**, irrespective of whether all clauses are needed.

The existing A/B follow-on paper already proposed **role-selected Harness projections** (not an implemented/passed policy map): Planner 23,716→22,422; Coder 19,085→13,308; Reviewer 18,619→12,127; Tester 20,054→12,679. Replaying **those same preexisting projections** over the 13 SIM4 activations yields:

| Journey | Current Harness chars | Proposed role-shared subset | Conditional reduction |
| --- | ---: | ---: | ---: |
| S1 | 23,716 | 22,422 | 1,294 |
| S2 | 57,758 | 38,114 | 19,644 |
| S3 | 77,812 | 50,793 | 27,019 |
| S4 | 100,093 | 72,663 | 27,430 |
| **TOTAL** | **259,379** | **183,992** | **75,387 (29.1% of Harness)** |

Keeping Skills unchanged: combined model-facing **303,501 → 228,114**, **−75,387 (−24.8%)**. This is a **conditional paper upper case**, not expected real savings or policy REVIEW PASS. If none of the proposed omissions survives guard review, **saving = 0**. It is *not* a second independent increment on top of the preexisting A/B paper's role-policy projection; it is exactly that projection replayed on SIM4. Equally, it is not a “GSA3 optimization gain” to count again.

**Changes:** one canonical rule-owner ledger with IDs, universal/conditional classification and explicit role membership, source-to-output provenance, no literal cross-role duplicate policies, all eight Role golden contracts, mandatory/denial/CAS/review/approval/STOP tests. **Complexity: HIGH (semantic/safety review)** despite only moderate code change; no new tool call required for a simple trusted Role selector, but review/verification overhead is substantial. **Fallback:** complete old Shared Harness on unknown role/task/phase/policy-map version; never fail open by omitting guard text. Retain separation of Advisor, read-only Reviewer/CR and Tester verdicts.

## 6. Comparative scoreboard and non-additive budgets

The comparison has **two distinct denominator columns**. A real context study must measure them separately, record whether both source and MCP output were actually presented, and never invent Host caching.

| Stage / option | Model-facing Harness+Skill text, 4 journeys | Change vs BASE-B model | Full/readable catalog source proxy, 4 journeys | Source fetch count | Complexity / interpretation |
| --- | ---: | --- | ---: | ---: | --- |
| **BASE-B** six-file paper split | **303,501** | baseline | **498,840** | **39** | Structural assumption, no real extraction |
| **B-OPT1** Role-keyed | **303,501** | **0 (0%)** | **498,840** | **39** | LOW; plain Role filtering **already present in GSA3** |
| **B-OPT2** Task sections | **303,501** verified / **296,935** illustrative | 0 validated / −6,566 (−2.16%) hypothetical | Not independently credited | Unknown | HIGH; must prove correct task classification/mandatory policy |
| **B-OPT3** Progressive Skill sections | **303,501** verified / **300,162** illustrative | 0 validated / −3,339 (−1.10%) hypothetical | Not independently credited | Unknown | MEDIUM; existing one-Skill lazy load is already baseline |
| **B-OPT4** Source symbol index | **303,501** | **0 (0%)** | **341,924** (−156,916, **−31.5%**) | **53** | MEDIUM–HIGH; source-only; includes 200-char/role index assumption |
| **B-OPT5** Shared-policy ownership | **303,501** current / **228,114** role-policy paper case | 0 validated / −75,387 (−24.8%) conditional | Not independently credited | Unchanged by itself | HIGH for security/contract parity |

**Do not sum the “savings” column:** OPT1 and OPT4 select overlapping role source; OPT2 and OPT5 can remove overlapping policy statements; OPT3 is unrelated to source OPT4 but has no independent proven eligible Skill slices. The table therefore does **not** claim a combined “OPT1+2+3+4+5 total.” The B-OPT5 role-Harness candidate has been analyzed previously against 16 journeys; **24.8% here is only its projection on the four frozen SIM4 journeys**, not a fresh GSA4 measured improvement.

### 6.1 Source-navigation context vs tool-call tradeoff

- A paper character saving **does not imply faster execution**: B-OPT4 adds **14 source-range fetches** in the four minimal paths and requires index freshness. For small file reads, call latency may dominate.
- BASE-B grouping has **only six files** (simpler extraction than many Role/Skill leaves), but its largest module holds **24,437 chars** and mixes Reviewer/CR/Tester contracts. That is a meaningful **whole-source-read** cost, not a role-payload cost.
- Under role-independent activations the same verification module is repeatedly opened; cross-Agent caching would alter the arithmetic but is **not assumed**.
- For normal runs in which Agents receive only `get_agent_harness`/`load_skill` and do not inspect `harness-*.ts`, the **entire B-OPT4 benefit disappears**. A source-navigation frequency baseline is essential before investing.
- `get_skill_catalog` overhead, Task/Project addins, tool JSON envelope, full user-project docs, source code diffs and verification artifacts were intentionally excluded; later measured work must log them as **separate fields**.

### 6.2 Complexity and fallback matrix

| Option | Extra behavior/function | Calls / maintenance | Primary failure mode | Safe fallback |
| --- | --- | --- | --- | --- |
| OPT1 | None for existing Role lookup | 0; role keys already defined | Confuse TypeScript group with actual payload | Existing full Role Harness |
| OPT2 | Authenticated Task selector + policy sections | Possibly task readback; high ownership-test maintenance | Missing approval/guard under wrong Task | Full Role Harness, stop if scope invalid |
| OPT3 | Optional Skill core/leaf registry | Extra loads/section map; Task-skill contract compatibility | Silent omission or double-injection | Full named Skill once |
| OPT4 | Rev-bound symbol map + range reader | **+14** paper range calls; CI index updates and stale-range checks | Wrong/stale source offsets or index false hit | Full affected group with full Role/Skill tool contract |
| OPT5 | Reviewed single-owner shared policy map | No new runtime call required for Role-only map, substantial golden tests | Missing universal authority, review isolation or deny handling | Full Shared + current Role Harness |

## 7. Technical self-review / adversarial scenarios

**Review type:** internal technical challenge based on pinned source, **not independent Reviewer PASS**.

1. **Does co-location force extra model context? NO.** `renderHarness(role)` uses one role key; `load_skill(name)` is on demand. Source grouping by lifecycle affects navigation only if somebody reads those source files.
2. **Does section reading save work? SOMETIMES.** In the constructed whole-file source-navigation benchmark yes (31.5% fewer source characters), but with 53 versus 39 fetches and unknown latency. If no source navigation occurs, benefit = zero; if index discovery needs multiple retries, overhead can erase benefit.
3. **Does physical splitting itself reduce current Harness payload? NO.** The original 85,330 source chars and original GSA3 rendered strings are preserved. No prior GSA1–GSA3 savings are claimed again.
4. **Does the index remain valid? NOT YET PROVEN.** Hardcoded line numbers drift when code is edited. Prefer export/symbol-name lookup + revision-bound generated map; fail closed to full content when anchors/identity disagree. Measure index/CI maintenance cost.
5. **Can one grouped verification module leak Reviewer/CR/Tester instructions?** Full-source reading would expose all three as source content. This must not be mistaken for the authoritative assigned role contract; never allow cross-role authority escalation. Independent Reviewer and CR still require separate target evidence and isolation; a co-located file cannot justify relying on prior verdicts.
6. **What if Task routing is wrong?** Reject stale/missing/forged metadata, restore full safe contract; human Plan approval, Criteria decisions, Git readback/CAS, bootstrap authorization and rollback/STOP remain hard boundaries. Task-specific shortening is **HIGH-risk, not yet approved**.
7. **Does Advisor need project code?** Current Advisor contract allows selective source inspection for accurate technical impact, while a Human proposal earlier suggested no project-code read. That is an **unresolved proposed contract change**, not a saving to take unilaterally. Advisor triggers only for Human material Criteria consultation.
8. **Recovery/isolation:** `run_begin` validates current Job/Task and review evidence for NEXT; `required_skill_contexts` can supply Task Skills. A future selector must handle uncertain Git write, expired checkpoint, blocked tests, duplicated Skill injection, independent review and STOPCHAT without stripping their guards. No source rewrite performed.
9. **Scope/oracle:** frozen SIM4 originated from an already source-aware session, so these traces cannot claim source-blind independent design. Need fresh isolated fixture author/Tracer and both positive/negative mock external-boundary continuations before any actual `simulate` PASS.
10. **Boundary review:** a six-file B with parent + core + lifecycle modules is feasible as *candidate*; preserving public exports, generated Harness text, eleven Skill texts, all mappings and dual MCP result serialization requires golden tests. **No actual extraction or golden-parity result was produced**.

**Risk ledger:** HIGH: mandatory policy omission and Human/Reviewer boundary regression in OPT2/OPT5. MEDIUM–HIGH: stale indexing, more tool calls and cross-role source exposure in OPT4. MEDIUM: unnecessary Skill micro-splitting/duplicate NEXT injections. LOW: documenting already-keyed Role dispatch. Missing real Host data: actual source reads, tool-call latency, Host tokenization, co-read frequency and ability to reuse source ranges.

## 8. Research conclusion and next test (NO IMPLEMENTATION SELECTION)

**BASE-B is a plausible low-file-count, behavior-preserving extraction hypothesis**, with a genuine source-navigation drawback: verification groups multiple independent roles. It is **not** inferior in delivered Role text merely because those roles share a file.

**Simplest safe short-term architecture:** preserve current GSA3 keyed `get_agent_harness` and lazy `load_skill` (B-OPT1 has 0 incremental payload reduction), and *only if real source-navigation logs show repeated whole-group reads*, consider **symbol/range navigation within six files (B-OPT4)** before creating many smaller files. Its calculated **−31.5% source chars / +14 calls** is an instrumentable hypothesis, not a speed win. Prioritize a safety-owned shared-rule audit (B-OPT5) only as a separately reviewed potential model-facing optimization; **do not activate Task slicing (B-OPT2) or Skill micro-splitting (B-OPT3) merely to hit a percentage**.

**Smallest evidence-producing next experiment, after permitted physical extraction/parity checkpoint:** (a) golden byte-for-byte role/Skill results, export and auth parity for all eight roles/eleven Skills; (b) measure real catalog source reads/ranges and co-read paths across independent Direct/JOB role calls, including blocked and retest paths; (c) compare **whole-group** vs **symbol-range** reads with actual file/tool latency and index drift tests; (d) separately review Shared-rule ownership against all hard guards and only then measure any model-facing delta. Use the existing CT-00 meter, do not rebuild it. A real source-blind fixture/Reviewer pass remains required before labeling a result validated.

**Disposition:** **RESEARCH B COMPLETE; PAPER-ONLY; INCONCLUSIVE ON IMPLEMENTATION WINNER / TOTAL SPEEDUP.** No selected split, no code changes, no Criteria/Research Plan changes, no merge/deploy, no independent review or Host performance PASS. This report is the only intended repository artifact from Chat B.
