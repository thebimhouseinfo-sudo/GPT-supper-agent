# GSA4 — RESEARCH GROUP 1B: Cohesive Capability/Lifecycle Harness Architecture

**Date:** 2026-11-04  
**Status:** RESEARCH COMPLETE — SOURCE-STATIC + FROZEN-USER-JOURNEY PAPER SIMULATION + TECHNICAL SELF-REVIEW; **NOT IMPLEMENTED/MEASURED**  
**Mode:** `DIRECT_AGENT — RESEARCH ONLY`; no GSA plugin or Job/Bootstrap creation; no runtime code, Criteria, deploy or merge changes.  
**Repository / working branch:** `thebimhouseinfo-sudo/GPT-supper-agent` / `upgrade/gsa-context-efficiency`  
**Pinned GSA3 source commit:** `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`.  
**Independent track:** This study did **not** read Research A's report and does **not** adopt its conclusions. The previously established *common* A/B option paper is an allowed input, not Chat A output.

## GOAL

Evaluate a **cohesive capability/lifecycle six-file Harness Catalog** together with separately indexed Agent documentation and the repository `gsa-job-runtime/SKILL.md`, preserving existing GSA3 meaning, authority, public API and model-delivered text for BASE-1B. Test four previously frozen User journeys as **paper simulations**; compare grouped **whole-file** reads, selected source sections, model-facing Harness/Skill payload and document context **as different measurements**. Identify the lowest-complexity safe experiment, without choosing or carrying out an implementation.

## 0. Evidence, source pins and experimental rules

| Read input | Ref / Git blob SHA | Observed source size |
| --- | --- | ---: |
| `GSA4-RESEARCH-PLAN.md` | development branch, `825e7932751ff1ddb642797de97c7a7e3fe1f81d` | 29,004 chars |
| `GSA4-R1-R3-SPLIT-OPTIONS-PAPER-SIMULATION-20261104.md` | development branch, `7ec0b6f84526bb3700b83a91ebe4d28aca2d812e` | 18,860 |
| `GSA4-A-B-FOLLOWON-FORECAST-20261104.md` | development branch, `c7cf8616e7f45cb1a07b7c2b5d1761a709249fda` | 20,087 |
| `GSA4-SIM4-FROZEN-USER-JOURNEYS.md` | development branch, `b266d3f15e619413b7a3c40d24e7a75664bdbebf` | 5,147 |
| `supabase/functions/gsa-mcp/harness-catalog.ts` | pinned GSA3, `f8ec1edd68786dc1333edeb4b68d8120b02da53c` | **85,330** |
| `docs/architecture/AGENT-HARNESSES.md` | pinned GSA3, `b56994bdfca2e603fa3c53490afae6b712c175ce` | **30,717** |
| `docs/architecture/EXECUTION-AND-REVIEW.md` | pinned GSA3, `9e6a9ffca96d718b9f167add55931b9725e058ad` | **34,695** |
| `skills/gsa-job-runtime/SKILL.md` | pinned GSA3, `f1f747340007db505e913f75f6229f9f94194c71` | **22,336** |
| `supabase/functions/gsa-mcp/harness-skill-tools.ts` (implementation cross-check only) | pinned GSA3, `60e0d4a5ce355c94b9c15691452329eea8b9ac8f` | 5,057 |
| `supabase/functions/gsa-mcp/run-execution-tools.ts` (implementation cross-check only) | pinned GSA3, `29434ca7fe558b5e669eab99daf2091d4936bd7d` | 49,080 |

All sizes are **JavaScript string-length characters** of retrieved source, *not* Host token usage or time. The development-branch Harness Catalog was independently read back and its blob matches the pinned GSA3 catalog source. No Chat A result was read. Source references are exact original-file paths and line ranges; hypothetical extracted-file path names below are labels, not physical repository files.

**Evidence levels:** `SOURCE_STATIC` (actual code/docs and text size), `SCENARIO_SIMULATED` (role activations and file/range read arithmetic), `NOT_OBSERVED` (actual Host use, wall-clock latency, persistent cache, end-to-end acceptance). The SIM4 inputs were frozen in a prior blob, but that same source explicitly disclaims independent source-blind fixture authorship; no original `simulate` skill run or independent Reviewer PASS is claimed.

**Critical boundaries:**

- A TypeScript import is **not** a model source-file read.
- A `canonical_refs` name or a Markdown link is **not** proof that the document was opened.
- `get_agent_harness` already renders Shared + **one selected Role**, regardless of physical file location; its mode argument does not expand to all Roles.
- `get_skill_catalog` enumerates skill names/descriptions, `load_skill(name)` returns **one named body**, and `run_begin.required_skill_contexts` may already inject Task-required Skills. Do not count duplicate `structuredContent` and mirrored `content` JSON, or load a Skill twice merely to count it.
- Repository `skills/gsa-job-runtime/SKILL.md` is **not the same thing** as an `RUNTIME_SKILLS` body; an on-disk skill is not necessarily an installed/loaded Host skill. `scenario-tester` is a Host-suggested name, not proof it was loaded.
- The model-facing **Harness/Runtime-Skill** meter, the *optional* Harness-source-navigation meter and the *optional* architecture Markdown/Skill-document meter remain distinct. If the model actually consumes all three, their recorded text can matter; none can be assumed to be in the Host context by default.
- **BASE-1B physical split is hypothetical**. Its mandatory contract is full GSA3 content, ordering, policy, 8 Role results, 11 Skill bodies, exports, auth/fallback behavior and review/approval gates unchanged. Generated import/export boilerplate is unknown and not claimed as saved.

## 1. BASE-1B file index — six-file Harness Catalog

**Source allocation:** lossless assignment of the exact pinned monolith's 85,330 characters to proposed *cohesive ownership* groups. Each source span listed is the ORIGINAL catalog anchor; one residual terminal-newline character is attributed to facade. This is not a transpile-ready six-file patch.

| Hypothetical file | Function | Included Roles / Skills | Source chars | Reader / read condition | Dependencies |
| --- | --- | --- | ---: | --- | --- |
| `harness-catalog.ts` parent facade/index | Public mappings, re-exports and `renderHarness` | `ROLE_SKILLS`, `ROLE_HOST_SKILLS`, role lookup | **1,761** | Source maintainer/auditor diagnosing lookup; runtime consumers use exports, **not** model text read | Imports core, governance, planning, delivery, verification; public API/parity owner |
| `harness-core.ts` | Shared authority, bootstrap, lifecycle, safeguards, STOP, review/policy | `BASE_AGENT_HARNESS` | **15,285** | All Role Harnesses get generated shared text; actual **source** read only on authority/context investigation | Every Role render; no Task-based omission in BASE |
| `harness-governance.ts` | Routing, governance, human consultation, delegation | Orchestrator, Advisor; `delegation` | **10,665** | Orchestrator/Advisor/delegation source audit or change; not every Coder/Reviewer read | Core, Project authorization and role transitions |
| `harness-planning.ts` | Requirements/Job topology, readiness, challenge | Planner; `critical-challenge`, `job-planning` | **17,800** | Planner planning/bootstrap or review of associated Skills | Core; planning Reviewer/Human handoff |
| `harness-delivery.ts` | Design/code implementation and diagnostic work | Designer, Coder; `debugging`, `coding-loop`, `ui-coder-frontend` | **15,382** | Design/Coder source navigation; source file includes unrelated Role/Skill text when read whole | Core; scoped Task/Run, self-QA, Reviewer/Tester evidence |
| `harness-verification.ts` | Independent planning/code review, CR, testing, lab | Reviewer, Critic Reviewer, Tester; `critic-review`, `planning-review`, `review-evidence`, `testing-evidence`, `tester-lab` | **24,437** | Reviewer/Tester/CR source navigation, repeatedly in multi-Agent flows; **MCP payload only returns selected Role/Skill** | Core; revision-bound review evidence, host test capability, CR isolation |
| **TOTAL** | **1 facade + 5 data modules** | **8 Roles + 11 Skills** | **85,330** | No actual extraction | No behavioral delta permitted |

Original source span allocation: parent L56 + L260–279 + L579–608; core L1–55; governance L57–92 + L131–146 + L406–422; planning L93–130 + L309–353; delivery L147–188 + L280–294 + L354–405 + L544–578; verification L189–259 + L295–308 + L423–543. A source grouping with noncontiguous original spans may be re-ordered physically; **do not** rely on old line offsets after a future edit.

### 1.1 Roles vs file contents vs real API payload

| Selected Role | BASE-1B full-source proxy (facade + core + owning group) | Actual GSA3 `harness_text` chars | Other Roles present in owning source file |
| --- | ---: | ---: | --- |
| Orchestrator | 27,711 | 22,420 | Advisor |
| Planner | 34,846 | 23,716 | None, but two Skills |
| Advisor | 27,711 | 16,502 | Orchestrator |
| Designer | 32,428 | 16,463 | Coder |
| Coder | 32,428 | 19,085 | Designer |
| Reviewer | 41,483 | 18,619 | Critic Reviewer, Tester |
| Critic Reviewer | 41,483 | 16,972 | Reviewer, Tester |
| Tester | 41,483 | 20,054 | Reviewer, Critic Reviewer |

`renderHarness(role, {includeProgressiveSkills:false})` combines generated Shared text (**14,982 chars**) with *one* Role contract. Skill bodies do **not** automatically join that Harness. Existing runtime skill body lengths: `debugging` 1,331; `critic-review` 1,004; `critical-challenge` 2,184; `job-planning` 5,861; `coding-loop` 4,174; `delegation` 1,006; `planning-review` 2,974; `review-evidence` 1,178; `testing-evidence` 3,929; `tester-lab` 2,170; `ui-coder-frontend` 2,648.

**Cohesiveness verdict for BASE:** Governance and Planning have clear lifecycle ownership; Delivery contains two specialist roles and 3 skills; Verification groups *three independent authorities* plus testing lab. The Verification grouping is the main **source-navigation** hotspot, not evidence of reviewer/Tester Harness contamination.

## 2. Separate guidance-document index (not forced into six TS files)

Three original, independently versioned documents are **not part of** the Harness Catalog's 85,330 characters:

| Original file | Function / content families (source line anchors) | Source chars | Readers & condition | Dependencies / safety |
| --- | --- | ---: | --- | --- |
| `docs/architecture/AGENT-HARNESSES.md` | Role model/shared authority L1–62; Planner/Designer/Coder/Reviewer/Tester/Orchestrator L63–182; Direct/context/handoff/Human L183–257; brownfield/review/CR/CP4/CP5/recovery L258–474 | **30,717** | Role-contract diagnosis, onboarding, Planner brownfield, Reviewer isolation, CR or direct role routing **when explicitly read** | Project scope/identity, role authority, independent review, Human Gate; not automatically read from `canonical_refs` |
| `docs/architecture/EXECUTION-AND-REVIEW.md` | Project/Job/Task/Run and topology L1–47; review and Goal Recheck L48–122; Tester/CI/retest L123–212; completion/handoff/CR L213–347; CP4/CP5/CP6 L348–508; reliability/cursor/plan supersession L509–575 | **34,695** | Planner planning evidence, Coder/Reviewer/Tester/Orchestrator **if they need exact execution/verification design**, not because the TS catalog imports it | Current Job/Run/Task, Claims/Verification CAS and exact revision; CR isolation |
| `skills/gsa-job-runtime/SKILL.md` | Frontmatter/purpose/Harness L1–56; shared intake/bootstrap L57–72; Planner L73–116; Coder L117–142; Reviewer L143–160; Tester L161–186; CI/repair L187–199; persistence/continuation/Human/plan changes L200–244 | **22,336** | Agent executing or auditing *durable Job workflow* **when this repository skill is actually loaded** | Separate from the 11 `RUNTIME_SKILLS` bodies; skill entry/frontmatter must remain discoverable; never infer Host installation |

**Combined physical documentation source:** **87,748 chars**, exactly three original files, before any optional rereads. Their naming, external crosslinks and provenance must remain stable even if later reorganized.

**Document architecture OPT6 candidates (paper only):**

- `DOC-KEEP`: three canonical files, improve navigation headings/anchors without physical extraction. **ZERO new files**, lowest maintenance, may already be enough if selective fetch is supported.
- `DOC-GROUP`: preserve canonical entry docs, attach broad *shared/intake/planning/delivery/verification/recovery* topic chapters according to actual co-read. No imposed six-file total; start only with chapters whose repeated full-file reads are observed. Keep CP5 claim→attempt→verification→closure invariant together where shared semantics require it.
- `DOC-ROLE-LEAVES`: one file per role/skill cluster, potentially faster narrowly targeted whole-file reads, but more links/drift and duplicated cross-role guard text. Prefer only if evidence makes a grouped module unavoidably wasteful.
- `DOC-KEEP+SYMBOL-INDEX`: non-destructive pointers to heading IDs and revision-bound lines/ranges. May achieve most benefits without changing document physical file count, at the expense of multi-range tool calls.

**Dependencies (do not lose):** shared authority ↔ Planner/Orchestrator decisions; Job topology ↔ Run dispatch ↔ checkpoint evidence; Coder Goal Recheck ↔ independent Reviewer/Tester verdict; Human approval/Criteria changes ↔ planning review; CR cannot inherit previous Reviewer verdict; STOPCHAT/cursor recovery ↔ exact Git/Memory snapshots. Splitting chapters across files may force a *mandatory paired read* rather than dropping one side.

## 3. BASE-1B simulation method

**Frozen User source:** SIM4 `b266d3f15e619413b7a3c40d24e7a75664bdbebf`. All four success/STOP or failure expectations remain unchanged.

**Minimum positive-path model:** 13 **specialist Role-Harness activations**, 14 conditional Skill loads and 13 Harness loads. We count every independent Reviewer/Tester run again; we **do not invent a model call** for Orchestrator merely because a durable orchestration tool routes two specialists. `Orchestrator` nevertheless **owns** Bootstrap checklist and normal test-repair/lifecycle coordination where specified by current source. A *literal* end-to-end orchestration invocation adds its own context and is modeled as an explicit sensitivity in `3.6`, not hidden in the baseline. Direct Agent receiving role / path eligibility is a fixture assumption, **not observed Host Agent activation**.

**Conservative whole-source-file stress assumption:** on each counted specialist activation, source auditor opens exactly `parent + core + its lifecycle group` as three **full file** reads, no cache across Agent activations. For ordinary GSA tool-driven work these source-file reads could instead all be **0**; do not claim they are mandatory. For document stress separately assume role-specific **two canonical guidance docs per activation**: Planner reads `AGENT-HARNESSES + gsa-job-runtime`; Coder `EXECUTION-AND-REVIEW + gsa-job-runtime`; Reviewer `AGENT-HARNESSES + EXECUTION-AND-REVIEW`; Tester `EXECUTION-AND-REVIEW + gsa-job-runtime`. These are **deliberately assumed audit reads**, not automatic runtime documents. Source and doc stress tests describe *optional study workflows*; no Host telemetry has been captured.

**Skill scenario bindings:** S1 status/readiness answer loads no new planning Skill body. S2: `coding-loop`, `review-evidence`, `testing-evidence`. S3: `testing-evidence`, `coding-loop + debugging`, `review-evidence`, `testing-evidence`; `debugging` conditional on proven nontrivial product defect. S4: `critical-challenge + job-planning` (assuming an actual new plan is drafted), `planning-review`, `coding-loop`, `review-evidence`, `testing-evidence`. Suggested `delegation` is not counted unless loaded; NEXT-required injected Skills must be **de-duplicated**.

### 3.1 S1 — Brownfield Bootstrap / existing Criteria

`User → Planner readiness inspection → authority/Plan/source/branch evidence → result/status/STOP`

- **Trace:** Planner → `planning` (with facade+core) → `get_agent_harness(planner,DIRECT_AGENT)`, no newly loaded Runtime Skill in this narrow *already-adequate documents/status* path → assess frozen SIM4 goals using live Project/Criteria/Plan evidence **(not measured)** → status/next lawful step.
- **Important governed variant:** current repository `gsa-job-runtime` states **Orchestrator owns a requested four-item Bootstrap checklist**. If full checklist execution is required, **add Orchestrator** with its independent Harness, source and conditional `delegation`, and add Planner/Reviewer/CR only as actual Plan/Milestone deficits require. Existing approved Criteria cannot be silently rewritten; no duplicate Job/Bootstrap records.
- **Failure:** inaccessible authority/Criteria, unresolved Plan contradiction, denied source/tool access → accurate BLOCKED/NEED_HUMAN or readiness gap, no false READY. Material Criteria approval is separate Human/Advisor workflow; CR is not automatically activated merely because a role is available.

### 3.2 S2 — Continue approved coding

`User → Coder (current approved Task/cursor) → Reviewer (independent diff) → Tester → revision-bound evidence / closure`

- Coder: `delivery` → `get_agent_harness(coder) + coding-loop` → exact live task/diff/cursor.
- Reviewer: `verification` → `get_agent_harness(reviewer) + review-evidence` → reads independent authoritative target, **not Coder hidden reasoning**.
- Tester: `verification` → `get_agent_harness(tester) + testing-evidence` → evidence-backed test/CI result.
- **Recovery:** missing/stale Task metadata, plan revision mismatch, unknown Git write response, conflict or denied rights → reconcile authoritative Git/Memory readback and lawful cursor recovery or STOP; do not bypass. No repeated per-Task Human permission if already authorized.

### 3.3 S3 — Test → product bug repair → independent retest

`User → Tester (classification) → [verified PRODUCT_FAILURE] → Coder (root cause) → Reviewer → Tester (RETEST) → PASS/RETEST_REQUIRED/BLOCKED`

- Tester-1/Tester-2: `verification + testing-evidence` each time, no implicit reuse of a prior Reviewer/Tester context.
- Coder: `delivery + coding-loop + debugging`, only if product defect is reproducible and authorized.
- Reviewer: `verification + review-evidence`, exact changed revision, role-isolated.
- **Failure branches:** host tool unavailable/CI not started → Tester-only BLOCKED/UNVERIFIED, **no invented Coder patch**. Repeat product defect after retest → additional bounded Coder/Reviewer/Tester activations with fresh evidence; do not loop forever or mislabel environment failure.

### 3.4 S4 — New feature → reviewed Plan → Human approval → code/test

`User → Planner → Reviewer (planning) → [HUMAN approval] → Coder → Reviewer (source) → Tester → result`

- Planner: `planning + critical-challenge + job-planning`; clarification/skeleton and actual plan/goal anchors; no source implementation.
- Reviewer-planning: `verification + planning-review`; independent plan revision.
- **HUMAN gate** is external and counted as **zero Agent calls**; without explicit scoped approval S4 STOPS here.
- Coder: `delivery + coding-loop` after approval, Reviewer-source `verification + review-evidence`, Tester `verification + testing-evidence`. Designer is conditional only for UI/UX contract, not silently added.
- Criteria WHAT/WHY change → proper Human/Advisor discussion and plan review, never automatic Criteria write. Review failure routes Planner/Coder to bounded repair and independent re-review.

### 3.5 Per-Agent BASE trace and context

All numbers below: source = three full hypothetical TS files **per call**; docs = two full canonical documents **per call under `3`'s separate document-audit assumption**. Each row is one independent role activation; file reads = 3 source + 2 docs if those audits occur. Payload is generated GSA3 `harness_text` plus *selected* Skill bodies, **not** a file count or model token estimate.

| Case / invocation | Agent | TS group | Runtime Skill bodies | Source chars | Harness chars | Skill chars | Full-doc chars (conditional) |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| S1/1 | Planner | planning | — | 34,846 | 23,716 | 0 | 53,053 |
| S2/1 | Coder | delivery | coding-loop | 32,428 | 19,085 | 4,174 | 57,031 |
| S2/2 | Reviewer | verification | review-evidence | 41,483 | 18,619 | 1,178 | 65,412 |
| S2/3 | Tester | verification | testing-evidence | 41,483 | 20,054 | 3,929 | 57,031 |
| S3/1 | Tester | verification | testing-evidence | 41,483 | 20,054 | 3,929 | 57,031 |
| S3/2 | Coder | delivery | coding-loop + debugging | 32,428 | 19,085 | 5,505 | 57,031 |
| S3/3 | Reviewer | verification | review-evidence | 41,483 | 18,619 | 1,178 | 65,412 |
| S3/4 | Tester | verification | testing-evidence | 41,483 | 20,054 | 3,929 | 57,031 |
| S4/1 | Planner | planning | critical-challenge + job-planning | 34,846 | 23,716 | 8,045 | 53,053 |
| S4/2 | Reviewer (planning) | verification | planning-review | 41,483 | 18,619 | 2,974 | 65,412 |
| S4/3 | Coder | delivery | coding-loop | 32,428 | 19,085 | 4,174 | 57,031 |
| S4/4 | Reviewer (source) | verification | review-evidence | 41,483 | 18,619 | 1,178 | 65,412 |
| S4/5 | Tester | verification | testing-evidence | 41,483 | 20,054 | 3,929 | 57,031 |

### 3.6 Full-workflow BASE-1B totals and variants

| Journey | Role activations | Source full-file reads / chars | MCP Harness calls / text chars | MCP Skill loads / text chars | MCP Harness+Skill combined | Optional doc full-file reads / chars |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| S1 Bootstrap/status | 1 | 3 / **34,846** | 1 / 23,716 | 0 / 0 | **23,716** | 2 / **53,053** |
| S2 Continue Coding | 3 | 9 / **115,394** | 3 / 57,758 | 3 / 9,281 | **67,039** | 6 / **179,474** |
| S3 Test–Fix–Retest | 4 | 12 / **156,877** | 4 / 77,812 | 5 / 14,541 | **92,353** | 8 / **236,505** |
| S4 New Feature | 5 | 15 / **191,723** | 5 / 100,093 | 6 / 20,300 | **120,393** | 10 / **297,939** |
| **TOTAL** | **13** | **39 / 498,840** | **13 / 259,379** | **14 / 44,122** | **303,501** | **26 / 766,971** |

**Read counts** are per Agent activation, not unique physical paths. S2 verification group is read twice; S3 three times; S4 three times (planning review, code review, test). The union of source paths on these four minimal paths is only **5 of 6** (no governance); their repeated read count is 39. Documentation paths union is 3, with 26 repeated reads.

**Orchestration sensitivity (per explicit extra Orchestrator activation):** +1 Role, +3 source-file reads / **27,711** source chars, +1 `get_agent_harness` / **22,420** Harness chars, optionally +1 `delegation` / **1,006** Skill chars if truly loaded; two-document audit mapping for Orchestrator is **not preselected** (new docs read must be logged when scoped). In a complete four-item Bootstrap where Plan/Milestones are not ready, additional Planner/Reviewer/(Human-authorized CR) calls are **scenario branches**, not assumed current success. A Human denial, missing metadata, or unobserved Tester host ability can shorten a trace rather than increase it.

**Zero-source-read sensitivity:** if runtime Agent uses `get_agent_harness` and `load_skill` without inspecting TS catalog, the **source-file read cost for all four workflows is 0**, regardless of physical split. If architecture docs/Skill document are not explicitly opened, the **optional doc-read cost is 0**. Do not add source+docs+MCP into a single default “token” total.

## 4. OPT1–OPT6: isolated alternatives against BASE-1B

**Every percentage below compares directly with BASE, not with the previous OPT.** We do not add overlapping gains, and we do not credit GSA3's existing progressive loading as a GSA4 improvement. “Hypothetical” means the assumed removable subset **has NOT passed mandatory-instruction coverage**, not that it is expected achievable.

### OPT1 — Role-keyed access inside grouped module

**Source-grounded mechanism:** `ROLE_HARNESSES[role]` / `renderHarness(role)` already isolate one Role inside an otherwise grouped source file, and `ROLE_SKILLS[role]` are just suggestions. **Incremental model-facing saving = 0**. No change to ordinary `get_agent_harness` behavior or added tool call. A different source navigation pattern requires OPT4; do not double count it.

**Trigger:** every Role load; LOW complexity (existing keying). **Reader:** runtime renderer selects one role; source auditor may still read full TS module. **Fallback:** unknown/invalid Role remains rejected; never fall through to neighboring Role or omit Shared rules. **Overhead:** 0 new calls, no new index if simply keeping existing API.

### OPT2 — Task/phase-specific Role Harness sections

**Proposed only:** Planner *bootstrap vs planning*, Coder *implement vs debug*, Reviewer *plan vs code*, Tester *probe vs retest*. Source Role loop-body text is Planner **7,680**, Coder **3,635**, Reviewer **3,140**, Tester **3,916** chars. A **25% removable text slice** from Planner/Coder loops *only* in S1, S2, S3 Coder and S4 is a sensitivity exercise, not an identified safe set.

| Workflow | BASE MCP Harness+Skill | OPT2 illustrative task-section result | Hypothetical saving |
| --- | ---: | ---: | ---: |
| S1 | 23,716 | ~21,796 | ~1,920 |
| S2 | 67,039 | ~66,130 | ~909 |
| S3 | 92,353 | ~91,444 | ~909 |
| S4 | 120,393 | ~117,564 | ~2,829 |
| **TOTAL** | **303,501** | **~296,935** | **~6,566 (2.16%)** |

**Actual validated saving = 0** pending clause-by-clause ownership and security review. **Trigger source:** Task type must be derived from authenticated current Job/Task/Run and checked source revision, not free-text prompt or unverified `verified=true`. **Extra complexity HIGH:** new task taxonomy, section schema, trusted metadata propagation, review on changing Task/revision, golden contracts and fallback. **Extra calls:** 0 when trusted Task info is already carried; possible ≥1 authoritative readback when not. **Fallback:** current full Role Harness, or STOP if authority/Task itself invalid; not a shortened “default task.” **Assessment:** **DEFER/likely reject for now**—small paper saving against very high correctness cost.

### OPT3 — Progressive Skill core/specialist sections

**Current behavior:** runtime `load_skill(name)` already loads a single chosen body; `run_begin.required_skill_contexts` may inject required Skills. Its 14 Skill loads totaling **44,122 chars** are *already baseline progressive*. Splitting existing `debugging` into an optional specialist segment is not new saving because `debugging` is already loaded conditionally only in S3's verified bug.

**Additional unvalidated illustration:** make the `coding-loop` body **40% shorter** only in ordinary implementation S2 Coder and S4 Coder, with no reduction for S3 debug. This cannot be recommended until the missing 40% is proven irrelevant.

| Workflow | BASE combined | OPT3 illustrative partial-Skill result | Hypothetical saving |
| --- | ---: | ---: | ---: |
| S1 | 23,716 | 23,716 | 0 |
| S2 | 67,039 | ~65,369 | ~1,670 |
| S3 | 92,353 | 92,353 | 0 |
| S4 | 120,393 | ~118,724 | ~1,669 |
| **TOTAL** | **303,501** | **~300,162** | **~3,339 (1.10%)** |

**Validated saving = 0**. **Trigger:** Skill relevance and verified section selection; no extra Skill load if `run_begin` already injected it. **Complexity MEDIUM** for selective body contract, potentially HIGH for required-checkpoint/test skills. **Calls:** 0 if one resolved section is returned in existing `load_skill`; +1 or more if core/leaf require separate loads. **Index maintenance:** body ID and position maps, Skill versioning, coverage tests. **Fallback:** entire named Skill exactly once. **Assessment:** **DEFER** unless a long frequently-read Skill is shown to contain a safe large optional section.

### OPT4 — Symbol/range navigation within six grouped TS files

**Trigger:** only an Agent/source maintainer who actually navigates the TS Harness Catalog. Preserve six physical modules; map Role/Skill symbols to validated ranges, replacing each full owning group with **the specific Role source span plus only invoked Skill source spans**. Count facade and full core source unchanged; add an illustrative **200 source characters per activation** for index/search navigation. This is not a measured index size or a guarantee of a working stable range fetch.

| Workflow | BASE source whole-file chars | Range-selected chars + assumed index | Source saving | Source requests BASE → OPT4 |
| --- | ---: | ---: | ---: | ---: |
| S1 | 34,846 | **26,340** | 8,506 (24.4%) | 3 → 3 |
| S2 | 115,394 | **75,855** | 39,539 (34.3%) | 9 → 12 |
| S3 | 156,877 | **104,449** | 52,428 (33.4%) | 12 → 17 |
| S4 | 191,723 | **135,280** | 56,443 (29.4%) | 15 → 21 |
| **TOTAL** | **498,840** | **341,924** | **156,916 (31.5%)** | **39 → 53 (+14)** |

**Model-facing `get_agent_harness`/`load_skill` saving = 0.** Range selection may approach a Role/Skill-per-file design's source bytes **without physically creating 21 files**, because the selected contents are the same Role/Skill spans. The underlying 53 range fetches also approach a role/skill-per-file read count; the advantage is fewer maintained modules, **not fewer tool calls**. There is no proof that 53 calls are faster than 39.

**Complexity MEDIUM–HIGH**, unless existing editor/GitHub symbol navigation already performs cheap reliable bounded reads (then incremental index may be LOW). **Index upkeep:** regenerated source-symbol table tied to blob SHA, line/anchor/instruction owner checks, CI integrity tests, fallback to whole current module on stale/ambiguous offsets. **Safety:** never use a stale line map that silently omits a critical guard. **Recommendation:** **conditional lightweight next experiment only when actual source-read frequency warrants it**; avoid building a custom runtime selector solely for source inspection.

### OPT5 — Shared Harness ownership (universal vs selected Role/lifecycle)

**Trigger:** each model-facing `get_agent_harness` *after* a separate reviewed ownership map. Classify current Shared rules into (a) universal mandatory, (b) precisely owned Role/lifecycle and (c) context-sensitive rules requiring trusted state. Do **not** blindly duplicate text inside Role files or omit rules by mere proximity in source.

The common A/B follow-on forecast contains **unimplemented** role-selected text projections; replaying exactly those candidate sizes on these four SIM4 journeys, with **all Skill text unchanged**, gives:

| Workflow | BASE Harness text | OPT5 projected Harness | Harness reduction | Combined Harness+Skill after projection |
| --- | ---: | ---: | ---: | ---: |
| S1 | 23,716 | 22,422 | 1,294 | 22,422 |
| S2 | 57,758 | 38,114 | 19,644 | 47,395 |
| S3 | 77,812 | 50,793 | 27,019 | 65,334 |
| S4 | 100,093 | 72,663 | 27,430 | 92,963 |
| **TOTAL** | **259,379** | **183,992** | **75,387 (29.1% of Harness)** | **228,114 (−24.8% vs 303,501)** |

**Validated saving is 0; conditional paper forecast is ~24.8% of combined model-facing role/skill text.** This is **not** an independent gain beyond the already published shared A/B follow-on forecast and is never added to OPT2's overlapping Role-policy reduction. **Complexity HIGH:** preserve all Human gates, authorization, denied actions, CAS/revision, STOPCHAT, CR/Reviewer/Tester isolation and bootstrap/recovery requirements for every activated role. **Overhead:** Role-based assembly needs no extra MCP call if the identity is already trusted; ownership audit/golden contract validation has substantial maintenance cost. **Fallback:** full original Shared + selected Role. **Assessment:** potentially the only material **model-facing Harness** reduction, but **not authorized without role-by-role guard review and exact equivalence checks**.

### OPT6 — Guidance docs + repository `gsa-job-runtime/SKILL.md`

**Target:** architecture Markdown and Skill **document navigation only**, not the generated `get_agent_harness` or GSA `RUNTIME_SKILLS` text. The `3` document-read fixture gives 2 full docs per activation (26 docs opened, **766,971 source chars**) if the Agent is actually studying architecture/Skill instructions. For OPT6, read selected **noncontiguous Markdown ranges** and include **160 index/navigation chars per opened document** (two docs × 160 per activation). These are illustrative fixed overhead estimates, *not an observed index implementation*.

**Exact source-based tentative range map by specialized Role:**

| Reader | Original docs → selected original-line ranges | Whole-doc chars | Selected range chars + index | Calls if one contiguous range per fetch |
| --- | --- | ---: | ---: | ---: |
| Planner (both S1/S4) | Agent Contracts L1–74, 201–252, 258–318; Job Runtime L1–116, 200–230 | 53,053 | **25,365** | 2 → **5** |
| Coder | Execution L1–47, 83–122, 213–222, 283–319, 509–558; Job Runtime L1–56, 117–142, 187–225 | 57,031 | **18,946** | 2 → **8** |
| Reviewer—planning | Agent Contracts L1–44, 106–119, 183–252, 286–318, 391–405; Execution L1–95, 289–319, 348–377, 378–508 | 65,412 | **22,619** | 2 → **9** |
| Reviewer—source | Agent Contracts L1–44, 106–119, 183–252, 286–318; Execution L1–122, 289–319, 378–508 | 65,412 | **20,789** | 2 → **7** |
| Tester | Execution L1–47, 115–212, 378–558; Job Runtime L1–56, 161–225 | 57,031 | **32,400** | 2 → **5** |

**Source range counts are syntactic selections, NOT independently reviewed instruction-completeness proof.** Some topics are cross-cutting or conditional (e.g. CP5, Plan supersession, CI repair, recovery); a role must expand the selection if the specific case needs them. Every selected section with mandatory scope guard must be either included or justified through a complete parent/shared text. Frontmatter/purpose remain present for the repository Skill document.

| Workflow | BASE optional-doc chars / reads | OPT6 selected-doc chars incl. index / range fetches | Saving | Tool-call delta |
| --- | ---: | ---: | ---: | ---: |
| S1 | 53,053 / 2 | **25,365 / 5** | **27,688 (52.2%)** | +3 |
| S2 | 179,474 / 6 | **72,135 / 20** | **107,339 (59.8%)** | +14 |
| S3 | 236,505 / 8 | **104,535 / 25** | **131,970 (55.8%)** | +17 |
| S4 | 297,939 / 10 | **120,119 / 34** | **177,820 (59.7%)** | +24 |
| **TOTAL** | **766,971 / 26** | **322,154 / 84** | **444,817 (58.0%)** | **+58** |

**Model-facing GSA `harness_text` and `skill_text` reduction from OPT6 alone = 0.** If the model actually reads architecture docs in the specified study, the consumed Markdown can be reduced by the paper figures, but their relevance and complete policy coverage are **unverified**. If not read, **absolute saving = 0**, and an index can become pure overhead. Existing skill loading semantics and metadata are not assumed to shrink because a Markdown file is split.

**Complexity:** `DOC-KEEP+SYMBOL-INDEX` LOW–MEDIUM if stable heading/line-range retrieval exists; implementing a generated ref map plus version/anchor consistency MEDIUM–HIGH; physically moving documents to topical chapters MEDIUM/HIGH due to links, citations, provenance and required paired-read invariants. **Tool overhead:** +58 hypothetical range calls, possibly more to fetch indexes; measured latency essential. **Fallback:** whole current canonical document/Skill; when requested section/authority unknown, preserve mandatory text instead of guessing a shorter route. **Recommendation:** **test better indexing first; do not proliferate document leaves until observed co-read and measured latency justify them**.

## 5. Option-by-option four-journey scoreboard (BASE-relative, not cumulative)

**“H+S” = GSA model-facing generated Harness + selected Runtime Skill bodies; “source” = only optional TS catalog navigation; “docs” = only optional Markdown/Job Skill document navigation.** No column may be counted as an automatic Host token estimate.

| Option | S1 H+S | S2 H+S | S3 H+S | S4 H+S | Total H+S vs BASE | Catalog source across four | Doc text across four | Source/doc request change | Complexity |
| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- | --- |
| **BASE-1B** | 23,716 | 67,039 | 92,353 | 120,393 | **303,501** | **498,840** | **766,971** | 39 TS + 26 docs | Reference |
| **OPT1** Role keyed | 23,716 | 67,039 | 92,353 | 120,393 | **303,501 / 0%** | 498,840 | 766,971 | 0 extra | LOW; already present |
| **OPT2** Task sections *what-if* | ~21,796 | ~66,130 | ~91,444 | ~117,564 | **~296,935 / −2.16%**, validated 0 | no independent credit | unchanged | unknown, 0 to ≥1 Task readbacks | HIGH; not justified |
| **OPT3** Skill sections *what-if* | 23,716 | ~65,369 | 92,353 | ~118,724 | **~300,162 / −1.10%**, validated 0 | no independent credit | unchanged | 0 to +Skill leaf calls | MEDIUM; defer |
| **OPT4** TS range navigation | 23,716 | 67,039 | 92,353 | 120,393 | **303,501 / 0%** | **341,924 (−31.5%)** | unchanged | **39 → 53** TS calls | MEDIUM–HIGH |
| **OPT5** Shared ownership *what-if* | 22,422 | 47,395 | 65,334 | 92,963 | **228,114 / −24.8% conditional**, validated 0 | no independent credit | unchanged | 0 extra per valid keyed role | HIGH policy-review |
| **OPT6** Docs/Skill navigation | 23,716 | 67,039 | 92,353 | 120,393 | **303,501 / 0%** | unchanged | **322,154 (−58.0%)** | **26 → 84** doc calls | LOW–HIGH depending on index vs physical split |

**No cumulative savings are asserted.** OPT1 and OPT4 concern overlapping role-source selection; OPT2 and OPT5 can remove overlapping Role-policy clauses; OPT3 is already partly provided by GSA3 progressive body loading; OPT6 belongs to *different document reads*. This study **does not attribute previously achieved GSA1–GSA3 reductions to GSA4**.

## 6. Compare grouped B with fine-grained Role/Skill files without reading Research A

The **common** R1/R3 options paper (not Chat A) describes fine Role/Skill alternative A as ~**21 TS files** (parent + core + 8 roles + 11 runtime Skill files), versus B's **6**. Across its separate 16 paper scenarios, full-module A averages **26,578** source chars / **3.50** file opens, B **37,410** chars / **2.25** opens. These are **not** the same 4-journey denominator and must not be numerically merged with the SIM4 table.

On the SIM4 fixed source-span inventory, **B-OPT4** selects exactly the owning Role span and actually-needed Skill spans; before a hypothetical index overhead, it reads **339,324** chars, compared with BASE-B **498,840**. Fine-grained A could expose the same selected source spans as separate physical files, so **B can theoretically approach A's content selection without 21 maintained files**, but neither can avoid repeated Role activation text or independent review semantics. A's physical files may be simpler for whole-file `fetch`, while B requires stable section navigation; B still incurs approximately **53** range/source calls in this narrow model. TypeScript file count, source chars, tool calls and runtime Harness tokens remain separate metrics.

**Practical comparison:** B wins on potentially lower module proliferation/import maintenance; fine A wins on trivial file-addressed role/skill lookup; B's navigation-only win is conditional on accessible symbol/range tooling and not proven faster. If source-file navigation is rare, neither physical split produces an end-user model-context saving.

## 7. Technical review — adversarial challenge checklist

**Review level:** self-review only; no independent role-isolated Reviewer `PASS`.

1. **Cohesion and lifecycle dependencies:** grouping Orchestrator+Advisor and Planner+planning Skills is reasonable. Verification is cohesive in evidence lifecycle but *not authority*: Reviewer, CR and Tester are independent identities with distinct permission/observability rules. Physical co-location must not authorize cross-role verdict reuse.
2. **Repeated opens and tool overhead:** source-only OPT4 saves 31.5% characters at **+14** fetches; documentation OPT6 saves 58.0% of a *conditional* doc-read fixture at **+58** fetches. Without timing and actual co-read frequency, either could be slower. Prefer a coalesced/symbol lookup where available; never assume it.
3. **Stale index:** hardcoded L anchors become stale on edit/extraction. Use canonical symbol/heading IDs, blob SHA, generated mapping validation and fail-closed full-file fallback. Index maintenance and sync failures are operational cost, not free.
4. **Runtime mechanics:** `get_agent_harness` and `load_skill` already select Role and Skill individually; grouping alone does not force a new Task selector, registry, Agent router or client negotiation. No new runtime function should be introduced merely to optimize editor navigation.
5. **Mandatory Shared rules:** a Role/Task selector must preserve global Project authorization, accepted Human Criteria/Plan authority, exact Job/Task/Run scope, denied action boundaries, source CAS/readback, Role isolation, CI/test failure classification, no fabricated evidence, STOPCHAT and no-progress recovery. Omission is a **hard fail**, not a “good compression” result.
6. **User/STOP/negative coverage:** S1 missing approved authority or stale Project → stop; S2 stale Task/unknown write → reconcile or stop; S3 test Host unavailable → Tester UNVERIFIED with no guessed product bug; S4 Human approval missing → stop after planning Reviewer with zero Coder calls; Criteria material delta → Human/Advisor consultation and new reviewed Plan path, not implicit code permission.
7. **Reviewer and CR isolation:** same-group source texts can be visible in a source audit, but current authoritative role must be separately rendered and verified. CR only when Human invokes or preapproves qualifying milestone; reconstruct independent evidence before consulting prior Reviewer verdict. A role co-located in TS does not change permission.
8. **NEXT required Skill handling:** `run_begin.required_skill_contexts` may already include Task-required Skill text. Never add a second `load_skill` and call the duplicate a benefit. Missing/unknown required Skill should yield BLOCKED/UNVERIFIED; no made-up Skill body or Host `scenario-tester` availability.
9. **Doc completeness:** OPT6's selected ranges are **navigation samples**, not an approved rearranged complete authority set. Mandatory CP4/CP5/CP6 and LL59/LL60/LL58 links can cross chapters; keep paired references and full-doc fallback, especially if source/target revision changed.
10. **Advisor source contradiction:** pinned Advisor role explicitly allows *selective* source inspection when needed to advise Human; earlier proposed restriction to Criteria/Proposal only is not a current automatic contract. This research does not silently change it for a size win.
11. **False source-reading premise:** imports, metadata references, and Host tool availability do not prove any TS/docs were opened by user-facing Agent. In a payload-only run both OPT4 and OPT6 have **0** savings; only policy-reviewed OPT5 could actually shorten existing model-facing Harness.
12. **Parity and publication:** original golden `renderHarness` for 8 roles, all 11 Skill bodies, metadata, modes, auth errors, schema and current Direct/JOB dispatch must be byte/behavior equal after any later extraction. No such extraction, test or approval happened here.

### 7.1 Risk and complexity rejection

| Candidate | Expected payoff / proof state | Cost and residual risk | Self-review disposition |
| --- | --- | --- | --- |
| OPT1 | Already present, no new savings | Very low | **KEEP CURRENT**, no feature to build |
| OPT2 | Unreviewed 2.16% Role-slice what-if | HIGH trusted Task classifier + policy omission | **REJECT FOR NOW / NO BUILD** unless future evidence changes economics |
| OPT3 | Unreviewed 1.10% Skill what-if | MEDIUM extra sections/calls, required-skill compatibility | **DEFER**, avoid microsections |
| OPT4 | 31.5% paper TS source bytes, not MCP | +14 calls; stale symbol/line map; actual read frequency unknown | **CONDITIONAL experiment** after source navigation measured |
| OPT5 | 24.8% conditional model-facing projection; 0 validated | HIGH hard-guard semantics and golden parity tests | **RESEARCH policy ownership separately** after extraction/parity authorization |
| OPT6 | 58.0% optional doc bytes if docs are whole-read | +58 range calls; many cross-links; brittle anchors | **FIRST test headings/links without physical split**; no leaf proliferation yet |

**Potential minimal approach:** keep 6 TS units as a **candidate cohesive physical target**, leverage existing keyed Role/Skill APIs, prefer stable symbol/heading navigation rather than creating 15 extra files, and avoid semantic policy/Skill reductions until measured evidence and safety review. This is **not** a chosen implementation design or R6–R8 approval.

## 8. Falsifiable next experiments and STOP criteria

After the common research stage independently selects an architecture **and** a separately authorized physical extraction passes parity, run bounded experiments:

1. **Golden parity:** all eight generated Role Harness outputs, 11 exact Skill bodies, mapping/exports, auth failures, Direct Agent/JOB mode, NEXT Skill injections; negative stale/unknown role/Task and independent Reviewer/Tester/CR cases.
2. **Co-read instrumentation:** representative real Bootstrap/continued coding/bug/retest/new feature; log whether each model Agent actually read TS source or docs, exact file/ranges, context characters and number of Git/tool calls; do **not** credit caching without observation.
3. **Navigation A/B:** within grouped B, whole-file vs symbol/heading-range fetch on identical pinned SHA, measure tool-call latency, failures, stale-index repair and actual context used. Allow **KEEP** as winner.
4. **Doc and Skill completeness:** compare mandatory controls reached, total document reads and cost; only then consider cohesive thematic leaves with canonical stable parent links.
5. **Policy ownership review:** classify each Shared rule with universal/role/task owner, capture provenance and mandatory inclusion oracle. Re-run every positive/negative path; any guard/authorization/role-isolation omission → **FAIL and full-Harness fallback**.
6. **Cost threshold:** if added index/call maintenance does not improve observed total relevant context/time or risks stale policy, **NO BUILD**; do not select on file count alone.

**Stop on:** unknown role/task metadata, denied source access, missing explicit Human execution approval, lost write without reconciled SHA/cursor, untestable Host, invalid source index, or reviewer-isolation violation. Normal approved role review/repair may continue in one turn; never reinterpret a STOP as permission to bypass authorization.

## 9. Conclusion

**Research Group 1B is complete as a paper study.** Six cohesive Catalog files are a defensible low-proliferation **hypothesis**, not a currently implemented design. GSA3 already filters Role and Skill API outputs; a physical split **by itself yields 0 model-facing Harness saving**. In conditional whole-file navigation, careful source ranges offer **31.5% fewer TS source characters** but more calls, and selective document ranges **58.0% fewer optional Markdown characters** but many more calls. The main material role-Harness opportunity remains **Shared ownership (OPT5)**, with a **24.8% four-journey conditional what-if** and **0 validated policy-safe savings**.

**Decision: NO IMPLEMENTATION SELECTION.** Do not split physically, mutate Criteria or runtime, rewrite repository Skills or claim any latency/Host token improvement on this evidence. Preserve independent review, Human authority, evidence and recovery contracts. This report is the **only** repository write intended by Research Group 1B.
