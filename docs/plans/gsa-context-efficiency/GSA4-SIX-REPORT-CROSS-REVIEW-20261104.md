# GSA4 — Six-report Cross-Review: normalized A/B scenarios, source budgets and decision risks

**State:** CROSS-REVIEW / independent of the six report authors' conclusions, **same-session analytical review only**; **not** a role-isolated GSA Reviewer or source-blind `simulate` run; no source execution, actual Host reads, CT-00, parity PASS or selected GSA4 implementation.  
**Date:** 2026-11-04.  
**Repository/branch:** `thebimhouseinfo-sudo/GPT-supper-agent` / `upgrade/gsa-context-efficiency`.  
**Pinned GSA3 source:** `0b5cf875402c7735e1ef573ab95df5858c6ac5e8` (Harness Catalog 85,330 source characters).  
**Goal:** Cross-review **all SIX reports**, repair unfair comparisons by using **identical activation/Task traces**, and distinguish separate model-delivered Harness/Skill text from optional Agent navigation of TypeScript and architecture documentation.

## 0. Exact six input artifacts and revisions

| Input report | Git blob SHA | Role in cross-review |
| --- | --- | --- |
| [GSA4-RESEARCH-A-RESULT.md](./GSA4-RESEARCH-A-RESULT.md) | `c21d439803a1236882efd681c3bf35aaef5e85e8` | Earlier standalone Harness A/B |
| [GSA4-RESEARCH-B-RESULT.md](./GSA4-RESEARCH-B-RESULT.md) | `0d04e962eec7b3df33ccce397a1b4828beb98f79` | Earlier standalone Harness A/B |
| [GSA4-G1-A-RESEARCH.md](./GSA4-G1-A-RESEARCH.md) | `297da193cbea6d5a67150ad4b19bbac32658a64b` | Group 1 Harness/Skills/Guidance |
| [GSA4-G1-B-RESEARCH.md](./GSA4-G1-B-RESEARCH.md) | `f0fc51f2e8fd5a65c2809c20685486617b8ef28f` | Group 1 Harness/Skills/Guidance |
| [GSA4-G2-A-RESEARCH.md](./GSA4-G2-A-RESEARCH.md) | `457b50322d150a127ca4c0f7fcbc30486144478b` | Group 2 runtime source |
| [GSA4-G2-B-RESEARCH.md](./GSA4-G2-B-RESEARCH.md) | `87e818eaea66e481d262f7c6fe0fd107712b2c05` | Group 2 runtime source |

User-defined journeys come from [SIM4 frozen design](./GSA4-SIM4-FROZEN-USER-JOURNEYS.md), blob `b266d3f15e619413b7a3c40d24e7a75664bdbebf`. **Caveat:** initial designer had already seen GSA source. These scenarios are frozen for tracing but **not source-blind independent**. The original six reports were paper studies and were not compared on an identical operational fixture.

## 1. Primary cross-review findings

1. **False comparison rejected — Group 1:** standalone A/G1A reports use **23 Agent activations + 20 Skill loads** over four extended workflows; standalone B/G1B use **13 activations + 14 Skill loads** over shorter workflows. Their `533,901` vs `303,501` model-facing character totals reflect **different paths**, not an A-vs-B architecture effect. A's **22.89%** staged reduction and B's **24.8%** conditional Shared-Harness reduction **cannot be ranked as different architectural performance** on those denominators.
2. **False comparison rejected — Group 2:** G2A uses **12** Coder/Reviewer/Tester code-reading sessions; G2B uses **17**, with different internal target features, retest loops and symbols despite four matching *category titles*. G2A's `38.4%` and G2B's `53.8%` are **not** directly comparable. G2B's `KEEP` denominator is different too.
3. **Model payload invariance:** physical A/B splits themselves save **zero** model-facing Harness/Skill text. GSA3 already selects one Role at `get_agent_harness` and one relevant Skill when `load_skill` is actually called; `run_begin.required_skill_contexts` is a separate authorized delivery path, not an extra copy for counting.
4. **Source reads are optional:** an Agent using the GSA MCP can receive Harness/Skill text without opening any `.ts` source. `canonical_refs` or imports are not source reads. Guidance Markdown and Job-specific Criteria/Plan are separate budgets; none of the six reports has host-level file-read or latency observations.
5. **Navigation/index performance can dominate physical file count:** B with range retrieval approaches the original-role/source spans of A, with the same approximate number of reads, but depends on reliable source ranges and extra search/index cost. Both A and B can use source-range retrieval.
6. **Source index size / file wrappers are approximations:** the catalog source partitions are exact attributed characters of original code, not actual post-refactor module byte lengths; imports/glue, CI/test changes and Git read latency remain unknown.

## 2. Normalized Group 1: exactly the SAME 4 end-user journeys

**Normalization decisions** — compare architecture, not different workflow branches. Treat the four SIM4 User intentions as the following **minimal affirmative paths**, *not* an asserted live Agent routing trace:

| Journey | Canonical Agent sequence and loaded Skill bodies | Role calls | Skill loads |
| --- | --- | ---: | ---: |
| S1 Brownfield Bootstrap, existing plan adequate | Planner (no Skill body automatically assumed) | 1 | 0 |
| S2 Continue approved code | Coder[`coding-loop`] → Reviewer[`review-evidence`] → Tester[`testing-evidence`] | 3 | 3 |
| S3 Verified product defect | Tester[`testing-evidence`] → Coder[`coding-loop`+`debugging`] → Reviewer[`review-evidence`] → Tester[`testing-evidence`] | 4 | 5 |
| S4 New non-UI feature | Planner[`critical-challenge`+`job-planning`] → Reviewer (plan)[`planning-review`] → **Human explicit approval** → Coder[`coding-loop`] → Reviewer (code)[`review-evidence`] → Tester[`testing-evidence`] | 5 | 6 |
| **TOTAL** | Human approval is an external condition, never fabricated by an Agent | **13** | **14** |

**Scenario dependence:** S1 with a real Plan repair needs additional independent review and potentially an *already authorized* CRL; S2/S3 with an observed Orchestrator adds one or more true activations; S4 stops at review unless a later explicit Human approval occurs. These increments must be credited identically to both architectures when they occur. S3 environment failure exits at Tester and never automatically dispatches Coder. Actual skill calls versus suggested skills must be instrumented; selected calls above are **paper hypotheses**.

### 2.1 Recalculated, common-denominator source vs payload ledger

**Definitions:** A hypothetical entire source-module read per relevant Role activation: A = parent facade 1,763 + entire Shared source 15,285 + one Role leaf + one **source Skill** leaf per selected Skill. B = parent facade 1,761 + entire Shared source 15,285 + one lifecycle source group (which includes matching Roles/Skills). **Independent activations never receive assumed cross-role source-cache credit.** Source reads are an optional explicit source-inspection scenario, not ordinary MCP model delivery.

| Scenario | BASE-A whole-module source chars / opens | BASE-B whole-module source chars / opens | **Same** model Harness+Skill text delivered (both A and B) |
| --- | ---: | ---: | ---: |
| S1 Bootstrap (existing plan valid) | **26,142 / 3** | **34,846 / 3** | **23,716** |
| S2 Approved coding | **75,260 / 12** | **115,394 / 9** | **67,039** |
| S3 Verified product bug | **103,655 / 17** | **156,877 / 12** | **92,353** |
| S4 Feature with later Human approval | **134,289 / 21** | **191,723 / 15** | **120,393** |
| **Four journeys** | **339,346 / 53** | **498,840 / 39** | **303,501** |

**Recomputed from the six report inventories**, not their incompatible top-line totals:

- **A vs B whole source:** A reads **159,494 fewer source characters**, or **32.0% fewer than B** for these 13 activations, in exchange for **14 more source fetches**. B is **1.470×** A's source chars if every owning group is opened whole.
- **Range-selected B:** G1B's OPT4 report reports **339,324 original source-span characters**, **+2,600 assumed navigation index chars** (200 per 13 activations), giving **341,924 / 53**. A full source-leaf read is **339,346 / 53** without equivalent index charge. The **2,578-character** discrepancy is not intrinsic architecture benefit; if both pay the same 2,600 index overhead then A is **341,946 / 53** vs B **341,924 / 53**, a **22-character** gap (<0.01%), attributable to original source-slice allocation/rounding, not real performance. Do NOT claim exact post-extraction equality or verified latency.
- **More calls can dominate:** let `h` be an *unmeasured character-equivalent penalty per extra read*. A's whole-leaf advantage here balances B whole-groups at approximately `11,392` char-equivalent units per extra open. This is a sensitivity threshold, **not** observed token, latency, or cost conversion.
- **No source inspection (default possible):** A source reads = B source reads = **0**. In that branch source-file splitting itself has **0 measured model-context gain**, regardless of 21 vs 6 files.

### 2.2 Genuine post-split model-facing optimization versus overlapping claims

- On this **identical 13-activation path**, shared rule-ownership hypothesis from the common GSA4 A/B forecast yields **exactly the same** `303,501 → 228,114` combined Harness+Skill chars for **A AND B** if it proves safe: **75,387 fewer chars (24.84%)**. **Validated safe reduction today = 0.** The 8-Role policy owner matrix, server assembly, Human authority, Reviewer/CR isolation, denied scope, NEXT task skill injection, fallback and negative tests need independent review.
- G1A's `533,901 → 411,712` (22.89%) OPT1→OPT2→OPT3 waterfall includes **more Agent activations and Skills**; it cannot be used as evidence that A is worse or better than B's `303,501 → 228,114` conditional Shared-only scenario. G1B's `OPT2=2.16%` and `OPT3=1.10%` are independently assumed slices, not proven mandatory-safe; G1A's OPT2/OPT3 slices rely on its own longer path and different applicability. No valid identical-role-task, clause-level cross-study test yet proves any extra numeric gain.
- The `AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md` and `gsa-job-runtime/SKILL.md` improvements are **optional explicitly requested document-navigation savings**, not already-delivered Harness savings. G1A D1 simulates **64.7%** documentation-char reduction at **+102** section opens; G1B D1 simulates **58.0%** at **+58** range opens, with **different scenarios/document-read recipes**. Fair comparison requires one frozen actual read list and identical required rule coverage; if D0 (no doc reads), both save zero.
- G1A's **25 instruction-document section buckets** and G1B's **3 parent docs / grouped ranges** are not equivalent physical file counts: index entries are not automatically 25 newly materialized files. A selection must compare exact files and lookup effort, not count headings as file splits.
- **Cross-review finding:** prefer to advance **A vs B physical module simplicity / source-targeting** plus a **separate common post-parity policy-ownership experiment**. The Shared/Role model-facing forecast gives **no reason** to favor A over B because both use `renderHarness(role)`.

## 3. Normalized Group 2: exactly the SAME implementation Task/symbol workload

### 3.1 Why original G2A vs G2B totals do not compare

Original G2A fixed **12** source-reading Coder/Reviewer/Tester sessions on four GSA implementation changes (Bootstrap readiness P1/P3, Run admission R1, checkpoint/evidence verification C2, repository evidence E1–E3). Original G2B counted **17** sessions on *different* changes (Project admission, Run+cursor, checkpoint/evidence, new Run verification), including additional Planner/repair/re-review sessions. Thus `1,421,263/65 → 875,935` (A) cannot be compared to `1,915,394/58 → 901,243` (B). Neither is a live read trace.

### 3.2 Common implementation-subject trace: remap G2A's 12 sessions to B owner modules

**Reconstruction method:** hold G2A's exact **same per-role source target list** from §4 S1–S4 fixed. For A, use its original full role/module/source sizes (including `I0` entrypoint 47,444 every session). For B, map the same relevant source responsibilities into the cohesive B module layout, charge **each B file once per independent Agent session** and keep unchanged external source/test files equal. Cost is full B owning module, not selected symbol/range:

- A `I0` (navigation entrypoint) → B `I` (larger entrypoint); `I2/I3` → B `D`; `I4` (spans two B code regions) → B `D+E`; `I5` (crosses evidence/planning) → B `E+P`; `I6` → B `P`; `I8` project-scope *relevant functions* → B `M`. Adjacent line tails within A I8 are not separately costed as a demanded source fact; this is **task/function mapping**, not a claim that every byte is identically included.
- A `P1/P3` → B `S`; A `R1` → B `R`; A `C2` → B `K`; A `E1/E2/E3` → B `V`; A `T0` → B `T`; original external `bootstrap.ts`, test files and `execution-guards.ts` use unchanged source sizes on both sides.
- **Important limitation:** G2A's `I0` physically includes an internal source span (`index.ts` L1937–1996) that B moves into evidence module E, whereas B's I includes different request/auth lines. These *whole-entrypoint* source reads are comparably labeled **entrypoint orientation** but not identical original byte sets. This is an explicitly labeled conditional full-module navigation comparison, **not** compiler/source semantic parity.
- Map deliberately represents task **owners**, not automatically all imports or transitive call paths. Shared security/cursor/evidence consumers may require broader reads for both architectures.

| Identical feature/Task and Coder→Reviewer→Tester path | BASE-2A full-module chars / opens | BASE-2B matched owner-group chars / opens |
| --- | ---: | ---: |
| S1 Bootstrap readiness (3 readers) | **363,123 / 18** | **428,266 / 16** |
| S2 Continue run_begin (3 readers) | **253,890 / 13** | **393,351 / 11** |
| S3 Checkpoint/evidence bug (3 readers) | **419,318 / 16** | **636,898 / 19** |
| S4 Evidence-publish feature (3 readers) | **384,932 / 18** | **478,190 / 14** |
| **4 Tasks / 12 source-reading sessions** | **1,421,263 / 65** | **1,936,705 / 60** |

Under this **A-origin workload**, A's narrower modules save **515,442 chars (26.6% of B)** with 5 more full-source reads. This is a **whole-file read proxy**, not a runtime Agent context estimate.

**Normalize the next source-index optimization identically:** if an owner map makes the Agent skip *only an irrelevant full composition entrypoint* in both A and B, without skipping any needed owner source, the two budgets become **A `851,935` chars / 53 source reads** and **B `1,314,709` chars / 48 source reads**, before **equal** assumed index overhead and without caching. A remains 462,774 chars leaner because B still reads whole larger groups. If both pay a speculative 2,000 chars per 12 role sessions, totals become **A `875,935`** and **B `1,338,709`**. This is a **symmetric index assumption**, not observed source selection.

**Do not confuse navigation design with physical extraction:** B can use existing `start_line/end_line` source fetch and SHA-valid symbol matching to read exact code rather than entire R/K/V/S or D/E/P/M files. **A can use precisely the same range-reading feature**, so a fair future comparison must decide whether source reader uses entire files, range reads, or both in **both** candidates. The original G2B `−53.8%` simulated saving (17 different sessions) cannot be credited only to B's physical file grouping. Likewise the entire G2A `−38.4%` comes from skipping assumed 12 full reads of I0; when a coder already knows the symbol owner, the marginal value of that new index could be zero.

### 3.3 Ownership and extraction parity review

- Both candidates maintain existing GSA1-established tool modules; both should initially **KEEP the 48,907-char selftest.ts** cohesive until its fixture coupling is proven separable. Many unit or fixture branches share one selftest endpoint; splitting by number of assertions is not sufficient justification.
- The narrow new extraction should target **still-mixed code in index.ts** first. G2A finer owner candidates improve single-function search; G2B five index groups + existing cohesive R/K/V/S modules reduce physical churn. G2B's `runtime-evidence-core` E and `runtime-run-state` D boundaries are disputed; G2A's large I0 47,444-char facade and 20,488-char checkpoint claim remain hotspots. Neither topology is a proved compiled implementation.
- `index.ts` `createServer`-nested functions can capture lexical variables; moving them without explicit dependency injection changes semantics. Some source-bound tests assert function location/export/topology; golden output-only tests are not enough: validate tool names AND order, schemas, structuredContent+text fallback, authorization/error behavior, branch/Git CAS/readback, retry/Run/Verification/checkpoint and production/legacy paths.
- `GitHub.fetch_file` today supports source line ranges, but future line positions drift: pin exact blob SHA, use stable names/exports and verify matching text before trusting a range. When uncertain, expand source read rather than silently omitting preconditions.
- Source index (owner/tool/error→module→symbol→tests) can likely be **one small reusable locator** shared by fine and cohesive architectures. It must not be a new authority that overrides source-of-truth code or independent Reviewer selection.

## 4. Technical challenge and risk ledger

| Question / hazard | Review outcome | Mandatory next proof |
| --- | --- | --- |
| Did any report genuinely execute user-level Agent simulation? | **No.** All are static/paper; no source-blind separate actor and no real Host trace. | Independent fixture review or truly source-blind design followed by source-bound trace. |
| Are A/G1A and B/G1B equally scoped? | **No**, 23/20 vs 13/14 activations/skills. Recomputed **13/14** fair comparison above. | Keep exact matched route/Skill sequence for further tests. |
| Are G2A and G2B using same Task & Agent readers? | **No**, 12 vs 17 and different source targets. Recomputed **12-session A-origin** remap above. | Repeat with an independent, architecture-neutral new fixture set and/or G2B-origin workload to test bias. |
| Is Role-keyed loading a novel GSA4 saving? | **No**, GSA3 already performs it. | No incremental credit. |
| Can Shared Harness be shortened safely? | **Unverified** 18-entry universal-core model; Human/approval/recovery policies may be necessary outside candidate classification. | Clause→owner→backend enforcement matrix + negative role transition tests. |
| Is model Host input/latency reduced by smaller files? | **Unverified**, source file read and MCP payload are distinct. | CT-00 plus real per-Role source/tool/Skill read logs, exact latency. |
| Is source-index overhead known? | **No**; assumed 200, 1,000, or 2,000 chars per activation across different reports. | One common literal index and observed fetch/tool costs. |
| Are Markdown guide reads automatically part of Harness? | **No**, only if actually opened. | Separate explicit source-doc read logs and obligation coverage. |
| Is newer source parity automatic after moving TS functions? | **No**, createServer closure dependencies and import cycles need review. | Golden 8 Role/11 Skill, full tool/HTTP/source-bound tests, denied/negative/recovery cases. |
| Does a compact child Role/doc brief replace necessary upstream authority? | **No**; role independence and mandatory guard content cannot depend on missing metadata. | Safe full-Harness/source fallback on uncertain relevance or STOP on denied authority. |

## 5. Cross-review decision and recommended next research/implementation specification

**G1 — Harness/Skills/Agent guides:**

- **Shortlist both physical A and B**, but **B's 6-file grouping plus safe exact section navigation is a reasonable complexity-first candidate**, because same 13/14 path produces nearly identical selected source chars/read count to A while maintaining fewer files. This is **not a final winner** until source navigation/reliability and golden parity are observed.
- Treat Shared rule ownership as **one common post-parity optimization independent of the file layout**: identical 13/14 fixture predicts `303,501→228,114` chars; policy-correctness evidence is missing. Keep Task-sliced Role/Skill contracts experimental, with full fallback and correct NEXT required Skill handling.

**G2 — Runtime implementation source:**

- **Shortlist hybrid B-first**: extract only demonstrably mixed independent `index.ts` helpers into cohesive groups, retain current GSA1 Run/Checkpoint/Evidence registration modules and `selftest` initially; add **thin searchable owner/symbol/error→test index** for the source-navigating developer Agent, and test exact-range reads. This favors parity and maintenance rather than declaring B a performance winner.
- **Preserve A as a competitor** for hotspots whose real development tasks routinely touch one small, independent operation: modularize those only when traced co-reading and review show lower total context/tool effort. No blanket per-tool split yet.
- A/B source-read forecasts above do **not** establish the optimal physically split boundary for all users; the A-origin fixture favors A's own source sections and cannot be a final independent ranking.

**Next reproducible decision gate:**

1. Independently freeze a *new architecture-neutral* four-journey fixture set with User or operator-level expected outcome **before** Tracer inspects code; for Group 2 specify the **exact same source feature/bug/symbol test targets** to A and B.
2. Choose one common router/source-read cost model: per-activation whole-file + per-activation indexed-range, with the **same** index size, tool-call accounting and no hidden cross-role cache.
3. Verify the real source file layouts/exports/import closure for both, including uncertain D/E/P boundaries and I0/createServer nesting; price wrapper/test rewrite cost.
4. Review role/Skill mandatory safety and negative STOP/ASK branches independently; do **not** use paper percentages as permission to strip rules.
5. Decide physical split design and implement it separately under valid scope; require exact behavior/API parity. Only **after** actual physical extraction+PASS research runtime selective loading, CT-00 and Project-doc Group 3 context allocation.

**Final verdict:** **SIX-REPORT CROSS-REVIEW COMPLETE AS A SOURCE-STATIC/PAPER NORMALIZATION.** Direct numerical A/B comparisons have been repaired where the original reports had different role/task denominators, but neither physical architecture nor post-split context optimizer is validated for production. **No source code, Criteria, parent Plan or original six reports modified.**
