# GSA4 — A vs B Deep Research: What happens AFTER physical splitting?

**State:** SOURCE-GROUNDED WHAT-IF RESEARCH / PRELIMINARY METHOD REVIEW — **not** actual R6–R8 execution, not `simulate` Skill execution, not a CT-00/host measurement, no source extraction and **no selected winner**.  
**Date:** 2026-11-04.  
**Parent:** [GSA4-RESEARCH-PLAN.md](./GSA4-RESEARCH-PLAN.md).  
**Earlier A–E options and preliminary simulated source reading:** [GSA4-R1-R3-SPLIT-OPTIONS-PAPER-SIMULATION-20261104.md](./GSA4-R1-R3-SPLIT-OPTIONS-PAPER-SIMULATION-20261104.md).  
**Source pin:** GSA3 main `0b5cf875402c7735e1ef573ab95df5858c6ac5e8` (exact `harness-catalog.ts` blob `f8ec1edd68786dc1333edeb4b68d8120b02da53c`, `harness-skill-tools.ts` blob `60e0d4a5ce355c94b9c15691452329eea8b9ac8f`).

## GOAL

Compare two **conditional post-split upgrade trajectories** (A: role/skill micro-modules; B: lifecycle/capability groups), their expected reductions in (1) model-side Harness text and (2) Agent source-navigation text; quantify only where explicit assumptions permit arithmetic; identify added code/interface complexity and review failure modes. This is **forward-looking architecture research for the choice of physical splitting design**, not permission to start actual post-split optimizations. **Mandatory order remains: R0–R5 research → separately authorized actual physical split → full parity PASS → R6–R8 investigate and implement further context reduction.**

## 1. Two different context budgets: NEVER combine them

**Budget X — source-navigation context:** characters from actual code files a developer Agent chooses to open while understanding/repairing GSA. Splitting physical files may reduce X if Agent actually opens complete smaller files. Runtime imports, tool metadata references, and file existence **do not prove** these files were model-read.

**Budget Y — model-delivered role Harness:** text in `get_agent_harness(role)` returned by GSA. Currently `renderHarness(role)` already selects **one** Role; GSA skills are progressively loaded through `load_skill`. Moving source code into A or B files without changing `renderHarness` **does not reduce Y by a single character**. `structuredContent` and mirrored text fallback must not be counted twice. The following Y projections require a **later, behavior-tested semantic rule-ownership change**, which has NOT happened.

Sources: [Harness source](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/0b5cf875402c7735e1ef573ab95df5858c6ac5e8/supabase/functions/gsa-mcp/harness-catalog.ts), [get_agent_harness/load_skill](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/0b5cf875402c7735e1ef573ab95df5858c6ac5e8/supabase/functions/gsa-mcp/harness-skill-tools.ts); existing [Run Task-skills injection](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/0b5cf875402c7735e1ef573ab95df5858c6ac5e8/supabase/functions/gsa-mcp/run-execution-tools.ts).

## 2. Starting point: A vs B, physical split only

Both retain a parent entry/export facade and **byte-equivalent Role/Skill responses** during extraction.

| Metric from same 16 paper scenarios | A — 20 modules + parent | B — 5 modules + parent |
| --- | ---: | ---: |
| Mean source characters if whole relevant file read | **26,578** | **37,410** |
| Mean separate data-file opens | 3.50 | **2.25** |
| Largest data module, modelled | **15,284** chars | 24,432 chars |
| Mean model-facing Harness after physical split alone | **unchanged** | **unchanged** |
| Physical refactor breadth | HIGH: many import/export paths, potential microfiles | MEDIUM: fewer but more multi-owner files |
| Role/source navigation accuracy | Direct Role/Skill file lookup | Group-level lookup; unrelated roles/skills may be read |

**Ratio:** B currently represents `37,410 / 26,578 = 1.408×` A's source-navigation **character proxy**, not 1.408× measured ChatGPT context tokens or elapsed time.

**File-open overhead sensitivity:** Let `h` be an illustrative unmeasured *character-equivalent* penalty for each file open/search hop. `cost_A = 26,578 + 3.50h`; `cost_B = 37,410 + 2.25h`. For the **equally weighted paper scenarios**, the break-even is `h ≈ 8,666 character-equivalent units`. A hypothetical single multi-Agent end-to-end scenario S14 has A `63,716 / 11` versus B `83,774 / 5`, a different break-even `h ≈ 3,343`. These are algebraic break-evens, **NOT observed latency or real token prices**. The outcome depends on workload mix, partial-range fetch capability and file open cost.

## 3. Shared Harness: identical candidate optimization for both A and B

Source-derived baseline: `BASE_AGENT_HARNESS` **14,982 characters** delivered in every Role Harness. Fifty text entries exist including a section label (49 substantive rule entries). A **researcher-only** ownership hypothesis retains **18 entries, 3,261 text characters** as a universal core; **other entries can only be omitted from individual roles if independent safety/ownership review proves they are enforced elsewhere or delivered at the correct transition**. This is **not** an approved safety-filter map and must never be deployed or treated as a `PASS`.

The proposed core IDs (numbering text entries in source order, section title = #1): `2, 4, 5, 19, 20, 21, 22, 23, 26, 27, 32, 33, 34, 35, 37, 39, 47, 48`. This includes receiving-agent/message rules, classification/clarification, Project/authority, denied-action, evidence and progressive-context safeguards. Universal core may need **more** than these 18 entries after independent review; this is an experimental hypothesis, not an authorization to shorten mandatory rules.

**Reproducible ownership hypothesis — non-core rule entries provisionally assigned by Role** (some rules are deliberately multi-owner):

| Role | Additional non-core BASE entry numbers (provisional) |
| --- | --- |
| Orchestrator | 3, 6–18, 24–25, 28–31, 36, 38, 40–46 |
| Planner | 3, 6–14, 16–18, 24–25, 28, 31, 36, 38, 40–46 |
| Advisor | 13, 17 |
| Designer | 10, 17, 24–25, 36, 38, 41–42, 49–50 |
| Coder | 10, 15–18, 24–25, 28–31, 36, 38, 41–46, 49–50 |
| Reviewer | 8, 10, 14, 17–18, 25, 28, 36, 38, 40–44, 46, 49–50 |
| Critic Reviewer | 8, 10, 17–18, 28, 40–43, 46 |
| Tester | 10, 15, 17–18, 24–25, 28, 36, 38, 41–43, 45–46, 49–50 |

The table states **candidate responsibilities**, not instruction content equality. The realized new role contract must preserve required security/approval delivery, independent Reviewer/CR, Direct Agent and fresh-Job behavior; test mandatory rules, including those omitted in this tentative table. If an unknown runtime condition prevents safe selection, fallback to full existing Role Harness, never silently strip text.

### 3.1 Model-facing `get_agent_harness` projection after verified role-selective rule assembly

**Eight live returned role-Harness lengths**, read-only tool observations from the currently deployed GSA3, and a **source-text-rule classification simulation** (unchanged role-specific contract + 3,261-char core + assigned noncore rules). This projection assumes a future model-facing selector can safely deliver precisely these entries; it does not yet exist.

| Role | Current Harness chars | Role-selected proxy | Nominal reduction |
| --- | ---: | ---: | ---: |
| Orchestrator | 22,420 | 22,078 | 1.5% |
| Planner | 23,716 | 22,422 | 5.5% |
| Advisor | 16,502 | 5,932 | 64.1% |
| Designer | 16,463 | 7,669 | 53.4% |
| Coder | 19,085 | 13,308 | 30.3% |
| Reviewer | 18,619 | 12,127 | 34.9% |
| Critic Reviewer | 16,972 | 8,738 | 48.5% |
| Tester | 20,054 | 12,679 | 36.8% |

**Equal-weight role average:** `19,229 → 13,119` chars (31.8% reduction).  
**Original sixteen source-navigation User-journey labels** contain **21 Role activations** (one multirole journey). Summing each activated Role Harness exactly once per fixture: `423,505 → 319,219` total chars, or **26,469 → 19,951** per journey (**−24.6%**). This is a *Harness-text arithmetic what-if*, **not** actual host token use, and is independent of whether A or B physically stores Role contracts.

**Sensitivity to safety review:** If only **half** of candidate text removal passes mandatory-delivery review, the paper 16-journey reduction is **12.3%**; at three-quarters accepted, **18.5%**; at all proposed entries accepted, **24.6%**. If none passes, **0%**. These are mathematical bounds under a fixed dataset, **not confidence intervals or expected production gains**.

**Advisor conflict:** Human proposed that Advisor should only critique Proposal/Criteria without reading project source. Current `AGENT-HARNESSES.md` allows selective source read for impact. This is a **separate role contract decision**, not something the rule-text simulation silently changes. Above Advisor numbers are hypothetical instruction scope, not evidence of approved new behavior.

## 4. PATH A — Role and Skill modules first: what optimization follows?

### A1 — Physical extraction/parity (mandatory prior step, NOT yet done)
- Parent `harness-catalog.ts` retains public exports and `renderHarness`; 1 base, 8 Role, 11 Skill content modules (21 files counting facade).
- Test eight Role Harnesses, eleven Skill bodies, mappings, Direct/JOB, fallback/JSON structure and external tool schema exact equivalence.
- **Context saving in model-delivered Harness: ZERO** for A1 by definition. Potential source-navigation improvement is the paper `26,578` vs original monolith `~83,774` chars only for whole-file reads. Requires real source read trials to substantiate.
- Complexity: **HIGH for extraction** (many imports/exports, version drift and naming); medium for parity tests; microfile count is the key structural risk.

### A2 — AFTER parity, role-policy ownership on A's physical role modules
- Reduce always-delivered shared text **only after** exact policy ownership mapping, independent review, explicit mandatory-guard validation and missing context fallback.
- Move relevant rule ownership into named role bundles (not blind text copies). Use existing `get_agent_harness(role)`; role is already an authenticated schema input. No unverified Task/Phase field is needed for basic role selection.
- **Model-facing forecast:** same nominal **−24.6%/16 journeys** as B2 below; range **0–24.6%** according to how much text safely moves, not additive to A1's source-navigation savings.
- **Source-navigation what-if with naive literal duplication of multi-role rules into every Role file:** mean A `26,578 → 23,421` chars (−11.9%) across 16 journeys; however multirole S14 inflates `63,716 → 89,018` chars because rules repeat across roles. **Do not implement literal role copies blindly.** Prefer centrally owned policy definitions and lean keyed references or demonstrably compact common rules; test whole-Job multirole cases.
- Complexity after split: **MEDIUM for role selector, HIGH for policy correctness and regression**. Creating 20+ modules up front is substantially higher maintenance than B even if later selector is simple.

### A3 — AFTER A2: selective knowledge and exceptionally long Skill sections
- Many Role/Skill files allow direct routing, but `load_skill` already lazily loads **one Skill body**, so reusing lazy behavior offers **no new counted win**.
- If a role **actually reads** a full 30,000-char architecture document but needs only one ~5,000-char role-relevant excerpt, a stable parent index/role-leaf ref could save ~25,000 source-read characters **for that specific read (83%)**. **Frequency unknown; NOT a per-Job reduction forecast.**
- Option A3a: retain canonical documents with section links/range reads; A3b: create linked role/topic child documents only when actual co-reading supports them; A3c: KEEP. Prefer minimal accurate links over new file micro-fragments. Test discoverability, link integrity, current-document revisions and required-context coverage.
- Complexity **LOW–MEDIUM** for link navigation where documents support range reads; **MEDIUM–HIGH** for further physical migration and revision maintenance. No additional percent promised without observations.

### A4 — only when trusted Run facts reach a real loader
- Optional Task/Phase-specific policy/Skill slices, evidence-dependent; measure routing/handoff, fallback, extra calls, role independence. **No reliable quantitative prediction now**. Complexity potentially HIGH, and prior source-grounded Task/Phase NO_BUILD must be addressed specifically.

## 5. PATH B — Capability/lifecycle modules first: what optimization follows?

### B1 — Physical extraction/parity (mandatory prior step, NOT yet done)
- Parent facade + 5 cohesive data modules: base, governance, planning, delivery, verification. Each may hold several named Role contracts/Skills.
- Golden/parity tests identical to A; avoid category boundary affecting permission or Reviewer isolation.
- **Context saving in model-delivered Harness: ZERO** for B1. Source-navigation proxy `37,410` chars/2.25 data-file opens vs A `26,578`/3.50 opens.
- Complexity: **MEDIUM for extraction**, with fewer imports and lower file proliferation, but some modules contain unrelated Agent contents.

### B2 — AFTER parity: role-keyed assembly WITHIN grouped modules
- Already available `ROLE_HARNESSES[role]` and `ROLE_SKILLS[role]` keys mean one can select an Agent contract **without creating a new runtime Router or splitting B further**. Organize shared rules as checked universal/core and named role-scoped policy entries; do not return all text from a lifecycle group just because it sits in one source file.
- **Model-facing forecast:** exactly the same potential **−24.6%/16 journeys**, with same mandatory-rule risk and 0–24.6% hypothetical sensitivity. Physical file count does not inherently affect returned `harness_text`.
- **Source-navigation risk:** if literal multi-role rules are copied into broad B modules, file reading may remain wasteful or worsen. Illustrative co-located within-file de-duplication yields mean B `37,410 → 35,284` chars (−5.7%) but S14 `83,774 → 105,411` chars (+25.8%). Without within-group de-dup, mean becomes `39,352` (+5.2%). This is a warning **against textual duplication**, not a recommendation.
- Complexity: **MEDIUM for keyed assembly, HIGH for policy security/independent review** (same as A2); LOW–MEDIUM additional module wiring because fewer physical files.

### B3 — AFTER B2: precise source/doc subsection fetch inside larger group files
- To address B's disadvantage in Agent **source** navigation, keep six physical files and index named exports/sections/anchors. Read **only the relevant Role/Skill symbol range** or use a verified source API with `start_line/end_line`; do not assume the whole B file must be loaded.
- **Upper-bound structural opportunity:** under the *original pre-policy* paper file-read assumptions, ideally B's `37,410` approaches A's `26,578` chars (up to `10,832` / **29% reduction in source-read text relative to B**). This lower bound on read size requires accurate range-addressing and **does not include source index overhead**; it is not an observed result. Its file/range fetch count may approach or exceed A's `3.50` vs B's original `2.25`, potentially cancelling the advantage.
- Options B3a: stable symbol/section anchors and range reads; B3b: tiny parent index with direct pointers to groups and carefully bounded chunks; B3c: further splitting **only if actual navigation shows B cannot target content cheaply** (would change original B count); B3d: KEEP.
- Complexity **MEDIUM–HIGH** for symbol index freshness/line-range drift and fallback; **LOW** for simple stable headings where editor already supports symbol search. Must validate runtime exports, source locations, and no extra wrong-context hops.

### B4 — AFTER B3: knowledge and skill context optimizations
- Same conditional document excerpt opportunity as A3 (e.g. 30,000 → 5,000 chars for one proven full-document-read case), but category-style navigation must avoid loading an entire lifecycle's document bundle.
- Task/Phase context routing and duplicate tool-result/handoff reduction require **fresh evidence and separate option reviews**. GSA3 already trims Skill descriptions/duplicated metadata; do not count these existing improvements again. No incremental percentage can be credited without measuring an actual repeated loading source.
- Complexity **MEDIUM** for targeted document references, **potentially HIGH** for trusted Task/Phase and safe handoff semantics.

## 6. A vs B: projected end-to-end tradeoff

| Dimension | A — fine Role/Skill physical modules | B — 5 grouped physical modules |
| --- | --- | --- |
| Physical extraction difficulty | **HIGH**; 20 modules + facade; greater migration/review footprint | **MEDIUM**; 5 modules + facade |
| Initial source-navigation chars (paper) | **26,578** per fixture | 37,410 (1.41× A) |
| Initial data-file opens (paper) | 3.50 | **2.25** |
| NEXT model-facing context improvement after safe role-rule selection | **Same theoretical −24.6%** as B | **Same theoretical −24.6%** as A |
| NEXT source-navigation opportunity | Direct role/skill leaf reads; optimize large source docs later | Range/symbol reads can **theoretically approach** A (up to 29% vs B's file-wide source proxy) |
| Risk of duplicated policy when moving text | Very high in multi-Agent journeys if copied into multiple Role files | Medium–high if copied across or within category files; can de-duplicate by group |
| Next-step engineering | Role-index assembly relatively natural, but managing 20 modules remains costly | Role-index assembly already compatible, but fine-grained navigation needs accurate anchors/index |
| Runtime/human safety | Same hard requirements: Human approval, scope, CAS, independent Reviewer/CR, trusted facts | Exactly same; fewer files do not make incorrect omissions safe |
| Expected latency | **UNKNOWN**; smaller text could be offset by more file/tool hops | **UNKNOWN**; fewer opens could be offset by broad text and subrange navigation |

**What can be decided today:** A leads on the whole-file source-navigation proxy; B leads on number of physical modules/opens and usually lower migration cost. **Both can theoretically reach the same reduced model-facing role Harness**, because current GSA3 already selects Role at runtime. A future validated *hybrid* is permissible but not pre-selected.

**What cannot be decided today:** a winner on **total tokens/latency or robust workflow correctness**; the paper fixtures were constructed after source inspection (not independent source-blind `simulate`), co-read rates and file-open latency are unknown, and the role-rule ownership map is unreviewed.

## 7. Independent-review checklist for next stage (not a claim of PASS)

1. **Source-blind scenarios:** independently freeze User-derived workloads BEFORE Tracer sees code; preserve original 16 cases only as preliminary coverage hints.
2. **Co-read evidence:** compare typical Advisor, Planner, Coder, Reviewer/Tester and multi-Agent tasks; record actual file opens/ranges, hops, rereads and elapsed time if observable, including negative/resume scenarios.
3. **Safety/ownership:** for each of 49 substantive shared rules, document mandatory roles and enforcement (model instruction vs backend), failed omission scenario, fallback and ownership; do not over-trust the 18-rule universal hypothesis.
4. **Whole-journey effects:** compare A/B with repeated role transitions and recovery, not only isolated single-role prompts; identify duplicated policies and index maintenance.
5. **Fairness:** equal test journeys, source revision, policy output, skill content and golden contracts; distinguish static file read proxy from model-facing payload and mirror-serialized tool outputs.
6. **Choose:** after independent review, nominate A, B, a source-evidenced bounded hybrid, or KEEP. Only then design/extract files; **R6–R8 start only after actual extraction and parity PASS.**

**Disposition:** A and B both deserve deeper research. No selected winner, no actual split, no benchmark, no original `simulate` Skill execution and no new runtime routing implementation.
