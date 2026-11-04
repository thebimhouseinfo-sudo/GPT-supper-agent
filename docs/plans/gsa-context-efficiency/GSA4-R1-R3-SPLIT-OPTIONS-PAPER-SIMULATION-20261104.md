# GSA4 — Stage 1 Research: Large-file splitting options and paper simulation

**State:** R1 source inspection + **preliminary** R2 candidate comparison + **paper fixture simulation**. **NOT** validated original `simulate` skill execution, independent Reviewer PASS, model context measurement, physical source split, CT-00 benchmark or final grouping selection.  
**Date:** 2026-11-04.  
**Authority:** [Research Plan](./GSA4-RESEARCH-PLAN.md) within [DETAIL-PLAN.md](./DETAIL-PLAN.md). This is **only the physical file-splitting research stage** (R0–R5). R6–R8 context-routing work **must wait until physical extraction and exact parity PASS**.  
**Pinned GSA3 source baseline:** `main` commit `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`. Source paths below are relative to repository root.

## GOAL

Find **cohesive, neither oversized nor microfile** physical boundaries for GSA's larger Agent/Harness/Skill/source and knowledge files, with a parent-facing link/export preserved. Compare multiple hypotheses using exact source structures and the **same realistic user-scenario matrix**. Identify safe options for subsequent independent review and tests; **do not choose a final split on size alone**.

## R1 — Current actual source facts (not a model-read log)

| Source surface | Pinned facts | Interpretation |
| --- | --- | --- |
| [`supabase/functions/gsa-mcp/harness-catalog.ts`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/blob/0b5cf875402c7735e1ef573ab95df5858c6ac5e8/supabase/functions/gsa-mcp/harness-catalog.ts) | 608 lines, 85,330 source characters; `BASE_AGENT_HARNESS` ~15,284 chars, eight `ROLE_HARNESSES` ~35,920, role/host skill mappings ~625, 11 `RUNTIME_SKILLS` ~32,808, `renderHarness` ~688 | Strong **semantic grouping candidates** in a single source file. Currently `renderHarness` returns base+one role; skill bodies are already lazy-loadable. Physical splitting by itself **does not** reduce returned Harness text. |
| `supabase/functions/gsa-mcp/index.ts` | ~142,374 chars, 2,395 lines, 28 internal module imports; source still mixes lifecycle/dispatch helpers, registration and common validation | Another substantial candidate, but must map actual remaining function ownership/import cycles and source-navigation before selecting more extraction. |
| `supabase/functions/gsa-mcp/run-execution-tools.ts` | ~49,080 chars, 837 lines; 5 tool registrations | Candidate for bounded Task/Run vs evidence/closure grouping **only if** callers and co-reading show worthwhile separation. |
| `supabase/functions/gsa-mcp/selftest.ts` | ~48,907 chars, 943 lines | Candidate to separate diagnostic fixture families **only if** tests are run/read selectively; do not assume code import causes model text read. |
| `supabase/functions/gsa-mcp/checkpoint-tools.ts` | ~35,533 chars, 562 lines | Another candidate after exact call/dependency inventory. |
| `supabase/functions/gsa-mcp/project-setup-tools.ts` | ~29,106 chars, 407 lines; Criteria/Advisor/Bootstrap and branch setup tools | Likely multiple responsibilities; test whether they are normally investigated together before physical change. |
| `docs/architecture/AGENT-HARNESSES.md` | ~30.9 kB source; role models and independent-run contracts | Knowledge/document split candidate, if actually referenced/loaded in full by multiple roles. |
| `docs/architecture/EXECUTION-AND-REVIEW.md` | ~34.9 kB source | Document grouping candidate; preserve canonical parent index and links. |
| `skills/gsa-job-runtime/SKILL.md` | ~22.6 kB; has shared intake, Planner, Coder, Reviewer, Tester, persistence, recovery sections | Strong content taxonomy for optional reference extraction, but skill entry/loading contract must remain intact. |
| `docs/plans/gsa-context-efficiency/DETAIL-PLAN.md` | ~113.6 kB, existing canonical parent plan | Must **not** arbitrarily fragment approved plan governance; optional linked topic-detail leaves are preferable if co-reading shows real benefit. |

**Critical distinction:** TypeScript import, runtime module availability, a `canonical_refs` list, suggested skills and an **actual AI read/file-open event** are four different things. This study has verified the first three surfaces to varying degrees; no end-user task-level co-read telemetry has been collected. Therefore there is **no empirical claim yet** that any pair of files is frequently co-read.

**Role-contract source ranges** in `harness-catalog.ts`: Orchestrator L57–92 (7.7k chars), Planner L93–130 (9.1k), Advisor L131–146 (1.7k), Designer L147–163 (1.6k), Coder L164–188 (4.3k), Reviewer L189–211 (3.8k), Critic Reviewer L212–231 (2.2k), Tester L232–261 (5.3k). Skills occupy L279–583. Backend/host interactions do not imply those whole ranges were sent to the model.

## R2 — Five *competing* Harness catalog file-splitting hypotheses

All candidate designs preserve the parent `harness-catalog.ts` as a **public export/render facade**, unless KEEP wins. None alters the exact content or mandatory role/skill contracts during physical extraction.

| Candidate | Cohesive grouping (physical data modules, excluding parent facade) | Expected benefit | Expected downside |
| --- | --- | --- | --- |
| **A — Role/skill fine-grained** | 1 base + **8 individual role** modules + **11 individual skill** modules = 20 data modules | Smallest role-specific source read; Advisor can inspect only its module | Too many files and import/cross-role review hops; microfile risk; maintenance friction |
| **B — Lifecycle combined** | 1 base + governance/orchestration + planning + delivery + verification = **5** modules | Fewer file opens, coherent workflow owners | Cross-role dependencies; some role-specific readers load unrelated skills/contracts |
| **C — Hybrid cohesive** | 1 base + **4 role-family groups** (planning, Advisor, delivery, verification) + **3 skill families** = **8** modules | Better specialization than lifecycle, fewer files than A; Advisor isolated | Family modules may still be too large; role/skill group split can create navigation hops |
| **D — Minimal three-way** | 1 base + 1 all-roles + 1 all-skills = **3** modules | Easiest behavior-preserving extraction and import compatibility | A single Agent reviewing roles still receives whole all-roles file |
| **E — KEEP current** | 1 monolithic source | Zero migration risk and one file open | Very large source-navigation read when only one role/skill is needed |

**Other large files** must receive their **own** alternative trees (e.g. domain-cohesive / tool-per-file / thin-facade+functions / KEEP), not copy the same role-grouping blindly. In all cases keep the file mother as index/facade with links; do not create excessive one-function files. No arbitrary `6 files` decision.

## R3 — Preliminary paper simulation, not original skill execution

**Purpose:** compare theoretical source-navigation costs for the **same User journey** across A–E. The modeled payload is **source file text needed to inspect role+skill logic**, NOT actual GSA runtime model-facing Harness payload. All group assignments are provisional and no Role selection mechanism has been changed.

**Assumptions:** file reader loads whole relevant data modules once per journey, no partial line reads, no caching, all scenarios need the base and relevant role contract; skill content is needed only when scenario calls for it. Does not count parent facade/import scaffolding, tool results, UI host prompt, canonical references or generated workflow evidence. Content source-character totals are based on pinned blocks; they exclude a small residual mapping/facade section, so KEEP simulated total **83,774 chars** differs from real full source **85,330 chars**. Char totals are **not tokens** and do not imply latency. If partial file reads or cached source references are supported, savings may shrink.

**Illustrative source-navigation scenario results** (theoretical, counted by grouping partition; one `A–E` module may be read in multiple steps only once):

| User-driven scenario | A chars/files | B chars/files | C chars/files | D chars/files | E chars/files |
| --- | ---: | ---: | ---: | ---: | ---: |
| S01 Advisor critiques Proposal | 16,964 / 2 | 25,946 / 2 | 16,964 / 2 | 51,063 / 2 | 83,774 / 1 |
| S03 Planner creates a Job | 33,081 / 4 | 33,081 / 2 | 42,063 / 3 | 83,774 / 3 | 83,774 / 1 |
| S04 Planner → independent planning Reviewer | 37,751 / 5 | 57,513 / 3 | 66,495 / 5 | 83,774 / 3 | 83,774 / 1 |
| S05 Coder implements approved Task | 24,354 / 3 | 30,883 / 2 | 30,883 / 3 | 83,774 / 3 | 83,774 / 1 |
| S09 Independent code Reviewer | 20,564 / 3 | 39,716 / 2 | 39,716 / 3 | 83,774 / 3 | 83,774 / 1 |
| S14 Multi-Agent full lifecycle | 63,716 / 11 | 83,774 / 5 | 82,094 / 7 | 83,774 / 3 | 83,774 / 1 |

**Sixteen scenario paper-fixture aggregate**, with equal weight only as a **sensitivity illustration**, NOT observed User frequency:

| Candidate | Data modules (+ facade) | Mean source characters per scenario | Mean files per scenario | Largest data module (source chars) |
| --- | ---: | ---: | ---: | ---: |
| A | 20 + 1 | 26,578 | 3.50 | 15,284 |
| B | 5 + 1 | 37,410 | 2.25 | 24,432 |
| C | 8 + 1 | 37,991 | 3.06 | 16,809 |
| D | 3 + 1 | 73,552 | 2.69 | 35,779 |
| E | 1 | 83,774 | 1.00 | 83,774 |

**Fixture coverage:** S01 Advisor, S02 Planner question, S03 Planner planning, S04 Planner→Reviewer, S05 Coder implementation, S06 Coder debugging, S07 Designer, S08 frontend Coder, S09 independent Reviewer, S10 Critic Reviewer, S11 Tester, S12 tester-lab, S13 Orchestrator dispatch, S14 multidisciplinary, S15 Direct Coder no approved scope (must not code), S16 STOPCHAT. These are **author-proposed journey labels** and have **not** passed a truly isolated, frozen source-blind simulate Designer stage. The original Bootstrap `simulate` skill source is available but not proven installed/callable here.

### Preliminary method review / adversarial critique

- **A appears smallest in this whole-file read model**, but 20+1 files is exactly the microfile risk Human asked to avoid. A low modeled byte count **does not justify choosing A** without actual read-frequency and file-hop cost.
- **B minimizes paper file reads** while mixing separate role and skill responsibilities; negative role-isolation and cross-role dependency tests matter.
- **C is a plausible middle-ground structural shortlist** but its verification and multi-Agent group sizes are not automatically better than B. Do not call it winner without verified co-read data.
- **D is easy to implement**, yet remains very broad for individual Agent file inspections. Treat as parity-first fallback, not an optimization claim.
- **E/KEEP is necessary**: source scanners that extract exact line ranges or use search may see no navigation win from splitting files.
- **Biggest unproven assumption:** every Agent reads a whole source file. In actual GSA, `get_agent_harness(role)` **already selects one role at runtime**, so physical splitting may improve **source navigation by development Agents**, while **runtime model-facing payload remains identical**. Later (R6+) role/context selection research is specifically gated on actual extraction/pass.
- **Skill boundary:** the source `simulate` skill requires source-blind Designer vs code-aware Tracer and frozen fixtures. Those conditions were **not** satisfied by the paper aggregate above, so no skill-based independent scenario PASS is claimed.
- **Approval/safety:** preserving `BASE_AGENT_HARNESS` exactly at extraction is mandatory even though Advisor receives unnecessary general rules today; **semantic changes belong only to post-split research/optimization**.

**Review finding:** source taxonomy and competing-option coverage **sufficient to shortlist A/B/C/D/E for proper simulation**, **insufficient for final choice**. Need actual workload navigation evidence and independent source-blind scenario review before R4 selection. Do not build based on one hypothetical equal-weight aggregate.

## Remaining Stage-1 research before physical split

1. **Finish R1** for index/tools/selftest/knowledge/long documents: construct caller/import/document reference graphs and **specific alternate splitting trees per hotspot**; mark actual co-read/reread UNKNOWN unless observed.
2. **Finish R2** with module ownership and parent facade design for each candidate; avoid circular imports and ambiguous type ownership.
3. **R3 robust simulation:** independent source-blind Designer freezes real-user Journeys from Criteria/requirements, Tracer maps groups and expected file opens. Negative scenarios must include role boundaries, missing Skills, stale Task/Run, denied Git mutation, Reviewer/Tester independence, Advisor no source read, Direct vs JOB fallback.
4. **R4 Reviewer** challenges group cohesion, microfiles, file-read assumptions and safety. Choose a split design with recorded why alternatives lost, or KEEP selected files.
5. **R5 parity design:** exact-byte `renderHarness` output for 8 roles, 11 Skill bodies and metadata, MCP schema, `get_agent_harness/load_skill` fallback, source imports, tests, security and handling when a module fails to load.
6. **Then separate implementation authorization → actual extraction → parity PASS**. Do **not** start R6–R8 context-reduction research until that physical milestone is real.

**Current disposition:** Stage-1 research in progress, no final winning grouping, no code edits, no CT-00 measurement, no original `simulate` skill execution, no independent review PASS.
