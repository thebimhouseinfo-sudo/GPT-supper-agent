# GSA4 — GROUP 1A RESEARCH: Fine-grained Agent Harness, Role, Skills and Agent Guidance

**Status:** PAPER RESEARCH COMPLETE / STATIC SOURCE INSPECTION + THEORETICAL SIMULATION; NOT RUNTIME PASS, independent source-blind `simulate` execution, extracted-file parity PASS, or implementation approval.  
**Date:** 2026-11-04.  
**Mode:** `DIRECT_AGENT — RESEARCH ONLY`, no GSA plugin, no new Bootstrap/Job.  
**Repository/target branch:** `thebimhouseinfo-sudo/GPT-supper-agent` / `upgrade/gsa-context-efficiency`.  
**Source pin for GSA3 behavior and sizes:** `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`.  
**Frozen four User journeys:** `docs/plans/gsa-context-efficiency/GSA4-SIM4-FROZEN-USER-JOURNEYS.md`, blob `b266d3f15e619413b7a3c40d24e7a75664bdbebf`.  
**Scope of write:** only this Group 1A report; no Criteria, common Plan, runtime, other chat's research, merge, or deploy.

## GOAL

Build an auditable **BASE-1A hypothetical physical/section extraction** of GSA3 Agent-operating guidance, preserving all existing text and behavior. Then simulate four frozen real-user entrypoints, compare source navigation, model-facing `get_agent_harness`/`load_skill` text and external Project data in **separate ledgers**, and challenge task/role-specific context optimizations before any architecture choice.

## 1. Inputs, source observations, authority, and limitations

### 1.1 Sources actually inspected

On the development branch: `GSA4-RESEARCH-PLAN.md` (blob `825e7932751ff1ddb642797de97c7a7e3fe1f81d`), `GSA4-R1-R3-SPLIT-OPTIONS-PAPER-SIMULATION-20261104.md` (blob `7ec0b6f84526bb3700b83a91ebe4d28aca2d812e`), `GSA4-A-B-FOLLOWON-FORECAST-20261104.md` (blob `c7cf8616e7f45cb1a07b7c2b5d1761a709249fda`), and `GSA4-SIM4-FROZEN-USER-JOURNEYS.md` (blob above). No other research branch/chat's report was read.

At **pinned GSA3 source SHA**: `supabase/functions/gsa-mcp/harness-catalog.ts` (blob `f8ec1edd68786dc1333edeb4b68d8120b02da53c`), `docs/architecture/AGENT-HARNESSES.md` (blob `b56994bdfca2e603fa3c53490afae6b712c175ce`), `docs/architecture/EXECUTION-AND-REVIEW.md` (blob `9e6a9ffca96d718b9f167add55931b9725e058ad`), `skills/gsa-job-runtime/SKILL.md` (blob `f1f747340007db505e913f75f6229f9f94194c71`). Also inspected the pinned runtime consumers `harness-skill-tools.ts` and `run-execution-tools.ts` to establish delivery and injection boundaries. These *consumer modules* are evidence used for contract understanding, not part of the requested Group 1A source-size totals.

**Sequencing contract:** the approved common Research Plan says **real** post-extraction selective-loader research (R6–R8) follows **actual physical extraction and exact parity**. This authorized Group 1A is expressly a **hypothetical paper forecast**, not entry into R6/R7/R8, no actual selective loading, no CT-00 invocation, no new decision to implement.

### 1.2 Measurement language and explicit no-double-count rule

- **Measured source chars**: JavaScript `string.length` on the file's retrieved, decoded text; **measured source UTF-8 bytes**: sum 1/2/3/4 bytes for each Unicode code point. Exact for observed source text. This is not a tokenizer or real model window count.
- **Exact virtual source attribution**: assign every original source character to one source-slice bucket. Source-snippet size differs from `harness_text` and from `skill_text`. New wrapper/import/index overhead after actual extraction is **unknown**, not silently assumed zero bytes.
- **Delivered payload (`P`)**: `get_agent_harness` returns shared+one role; `get_skill_catalog` sends descriptions; `load_skill` sends one complete chosen Skill body. The selected-body lengths are computed from source literal arrays. Role Harness lengths use the documented deployed-GSA3 observations reproduced in the allowed A/B follow-on forecast (not newly invoked as a live tool in this paper run). Count only one serialization of a tool result, never `structuredContent` plus mirrored `content` twice.
- **Source navigation (`N`)**: actual `get_agent_harness`/`load_skill` **does not open TypeScript source for the model**. Server import ≠ file consumed in prompt. For comparability, one **conditional explicit source-audit proxy** assumes each separately activated Agent reads the virtual facade + Shared + that Role file, plus selected Skill source file(s). No unverified host caching.
- **Agent-guidance document reads (`D`)**: `canonical_refs` and repository SKILL path are references only. Without a demonstrated `fetch_file`/document read their measured model/source contribution is **0**. We separately model D1, the optional **full-doc-on-demand paper case**, and selective section navigation, to show sensitivity. Do not automatically add D1 to `P` or claim it actually occurred.
- **External Project context (`X`)**: individual Project Criteria, Plan, Milestones, Branch, Job/Task/Run, Git source/diff, CI logs, Verification, Memory, AGENTS.md addins, approvals, user artifacts, host prompts and tool envelopes. Explicitly **excluded** from all budgets; Group 3 must study these independently.
- **Evidence level:** `SOURCE_STATIC` sizes/contracts, `DOCUMENTED_PRIOR_OBSERVATION` eight Harness lengths, `PAPER_SIMULATION` paths/call counts, `UNVERIFIED` host activation/independent test, runtime tokens, latency, full mandatory policy retention after optimization. A static scenario mapping is **not** executed `simulate`, Tester PASS or code parity.

### 1.3 Observed GSA3 contract — what loads vs what is merely suggested

Source `harness-catalog.ts` exports `BASE_AGENT_HARNESS`, `ROLE_HARNESSES` (8), `ROLE_SKILLS`, `ROLE_HOST_SKILLS`, `RUNTIME_SKILLS` (11), `renderHarness`. Pinned `harness-skill-tools.ts` registers:
- `get_agent_harness(role,mode=JOB|DIRECT_AGENT)`: one shared+selected Role string (with duplicate progressive-skills prose suppressed), `canonical_refs`, `suggested_skills`, `suggested_host_skills`, `context_policy`. **Suggestions are not automatic Skill loads.**
- `get_skill_catalog`: names/descriptions only, not Skill bodies.
- `load_skill(name)`: one entire GSA Skill body when requested, not one task section.
- `ROLE_HOST_SKILLS.tester=['scenario-tester']` names a **host-managed** ChatGPT skill; it is neither a GSA `load_skill` nor proof that it was installed, read, or executed.
- In NEXT `run_begin`, `required_skill_contexts` may already contain mandatory Task Skill bodies. Count each actually consumed body **once**: either injected context or `load_skill`, never both. `run_begin` durable-Run roles are `planner/designer/coder/reviewer/tester`; the other GSA roles do not automatically become durable Run roles merely because they have a Harness.
- New Human message preserves current receiving Agent; without one, default = Planner. Orchestrator is an on-demand coordination responsibility, **not** an always-on background process. Any Role transitions in the diagrams are candidate role-isolated handoffs that must be authenticated and verified by a real connected Host.

**Native suggestions by role** (not all loaded): Orchestrator `delegation`; Planner `critical-challenge, job-planning, delegation`; Advisor none; Designer `delegation`; Coder `coding-loop, delegation`; Reviewer `review-evidence, planning-review`; Critic Reviewer `review-evidence, critic-review`; Tester `testing-evidence`. The extra native Skills are `debugging` (conditional Coder bug), `tester-lab` (optional), `ui-coder-frontend` (frontend Task required). The `delegation` key is **unquoted TypeScript**; excluding it from source inventory would falsely leave ten rather than eleven Skills.

## 2. BASE-1A: exact file/section index, without optimization

### 2.1 Physical-code module *hypothesis*: 21 buckets = 1 facade + 1 Shared + 8 Roles + 11 Skills

These are **proposed logical filenames, not existing split files**. All lengths are **exact attributed original source chars / UTF-8 bytes**, not fabricated new module sizes. Every original character belongs to one bucket; the parent facade receives remaining map envelopes, mappings, comments and renderer. `Parent index` for all is `supabase/functions/gsa-mcp/harness-catalog.ts`, which must preserve public exports, typed lookup, renderer output and error shape during any real extraction.

| File/slice | Responsibility and owner | Original chars / UTF-8 bytes | Condition for MODEL use / for SOURCE read | Dependency and parent index |
| --- | --- | ---: | --- | --- |
| `harness-catalog.ts` (facade) | exports/lookup/render; shared metadata | **1,763 / 1,763** | runtime import always; **model source only if deliberate inspection** | root facade; maps all 20 children |
| `harness/shared.ts` | all 53 lines of `BASE_AGENT_HARNESS`, Human/scope/permission/recovery rules | **15,285 / 15,323** | model: every `get_agent_harness`; source: audit only | all eight Roles; facade |
| `harness/roles/orchestrator.ts` | route, coordination, handoff/recovery | 7,717 / 7,745 | only Orchestrator harness | shared, topology; facade |
| `harness/roles/planner.ts` | Criteria/Plan/brownfield/goal/review loop | 9,094 / 9,104 | only Planner harness | shared, planning refs; facade |
| `harness/roles/advisor.ts` | Criteria WHAT/WHY consultation | 1,681 / 1,681 | Human Criteria checkpoint only | shared + Criteria; facade |
| `harness/roles/designer.ts` | UI/UX/asset contract | 1,621 / 1,623 | UI/UX need only | shared + UX contract; facade |
| `harness/roles/coder.ts` | scoped write, CI, repair, Goal Recheck | 4,333 / 4,335 | authorized coding/repair | shared, branch/scope; facade |
| `harness/roles/reviewer.ts` | independent planning/code review | 3,838 / 3,856 | applicable independent review | shared, exact target/revision; facade |
| `harness/roles/critic_reviewer.ts` | separately authorized independent CR | 2,176 / 2,176 | Human/preapproved CR only | shared, prior result read **last**; facade |
| `harness/roles/tester.ts` | independent test, capability, retest | 5,323 / 5,347 | applicable independent Tester | shared, actual target evidence; facade |
| `harness/skills/debugging.ts` | Coder nontrivial bug root cause | 1,585 / 1,599 | **conditional** `load_skill` | code repair; facade runtime map |
| `harness/skills/critic-review.ts` | CR process and independence | 1,265 / 1,265 | CR only | CR role; facade map |
| `harness/skills/critical-challenge.ts` | proposed-solution challenge | 2,462 / 2,462 | relevant Planner decision | Planner; facade map |
| `harness/skills/job-planning.ts` | progressive planning/brownfield/jobs | 6,244 / 6,266 | durable planning | Planner, reviewed Job; facade map |
| `harness/skills/coding-loop.ts` | observe/act/verify/adapt | 4,739 / 4,749 | Coder Run | Coder/task; facade map |
| `harness/skills/delegation.ts` | bounded role-to-role handoff | 1,267 / 1,267 | only when actual handoff | owning role; facade map |
| `harness/skills/planning-review.ts` | Job/Plan review | 3,295 / 3,303 | Reviewer on Plan | Reviewer; facade map |
| `harness/skills/review-evidence.ts` | evidence-first code review | 1,444 / 1,454 | Reviewer/CR as relevant | exact revision; facade map |
| `harness/skills/testing-evidence.ts` | Tester evidence, classification/retest | 4,439 / 4,451 | Tester Run | Tester; facade map |
| `harness/skills/tester-lab.ts` | optional Tester lab | 2,656 / 2,656 | only proven applicable | Tester; facade map |
| `harness/skills/ui-coder-frontend.ts` | frontend/UI code contract | 3,103 / 3,103 | frontend Task declared/needed | frontend Coder; facade map |

**Exact checksum:** facade 1,763 + Shared 15,285 + 8 Roles 35,783 + 11 Skill sources 32,499 = **85,330 source chars / 85,528 UTF-8 bytes**. API output unchanged by definition: **0 delivered text savings**. After real physical extraction, new import/export syntax and index links introduce unknown extra bytes, to be measured and golden-tested.

**Separate model Skill body sizes** (actual value of TypeScript body string arrays joined with newlines): `debugging` 1,331; `critic-review` 1,004; `critical-challenge` 2,184; `job-planning` 5,861; `coding-loop` 4,174; `delegation` 1,006; `planning-review` 2,974; `review-evidence` 1,178; `testing-evidence` 3,929; `tester-lab` 2,170; `ui-coder-frontend` 2,648. **Do not substitute module source size for returned body size.**

### 2.2 Agent guidance: 25 indexed section-content buckets, 3 stable parent documents

To avoid gratuitous microfiles, BASE-1A treats the following as **individually addressable content sections with stable parent indexes**; a future physical extraction could co-locate several cohesive sections or keep exact line-range anchors. Section content **is not rewritten or deleted**, and no new index bytes are guessed. Physical per-section leaf files are **an option**, not a decision.

- Root `docs/architecture/AGENT-HARNESSES.md` = **30,717 chars / 30,902 bytes**, 12 attributed sections, parent AH index.
- Root `docs/architecture/EXECUTION-AND-REVIEW.md` = **34,695 chars / 34,857 bytes**, 7 attributed sections, parent ER index.
- Root `skills/gsa-job-runtime/SKILL.md` = **22,336 chars / 22,573 bytes**, 6 attributed sections, parent JR index; this repository Markdown guidance is **not** an automatic GSA runtime `load_skill` result.

For every row below, **read trigger** means a documented role/task question makes *explicit retrieval potentially useful*, never `canonical_refs` auto-loading. Roles are proposed owners for navigation, not exclusive authority to access other relevant sections. A Reviewer/Tester may independently read any required cross-role/authority contract.

| Section/index target (hypothetical `parent#section`) | Source line range | Responsibility / target role(s) | Exact chars / bytes | Trigger / dependency |
| --- | ---: | --- | ---: | --- |
| `AH0 shared-authority-intake` | 1–62 | shared scope/intake, all roles | **5,256 / 5,296** | explicit authority review; AH root |
| `AH1 planner-brief` | 63–74 | Planner | 498 / 498 | Planner scope question; AH0 |
| `AH2 designer` | 75–84 | Designer | 260 / 260 | UI/UX design only; AH0 |
| `AH3 coder` | 85–105 | Coder | 644 / 646 | source-write/Goal Recheck; AH0 |
| `AH4 reviewer` | 106–119 | Reviewer | 632 / 632 | independent verdict; AH0 |
| `AH5 tester` | 120–156 | Tester | 4,209 / 4,219 | capability, modes, retest; AH0 |
| `AH6 orchestrator-child` | 157–182 | Orchestrator, child runs | 832 / 838 | routing/child handoff; AH0 |
| `AH7 direct-context-handoff` | 183–257 | all, Direct entry / handoff / Human | 2,241 / 2,241 | Direct Agent or scope boundary; AH0 |
| `AH8 brownfield-planning-review` | 258–357 | Planner + planning Reviewer | 5,825 / 5,910 | Bootstrap, plan review; AH1/AH4 |
| `AH9 critic-reviewer` | 358–390 | Critic Reviewer | 2,119 / 2,121 | CR authority/independence; AH0 |
| `AH10 NEXT` | 391–441 | Planner/Tester/Orchestrator | 3,062 / 3,096 | actual NEXT checkpoint/gate; AH0 |
| `AH11 reliability-plan-change` | 442–474 | Coder/Orchestrator/Planner | 5,139 / 5,145 | pending cursor, source recovery, plan change; AH0 |
| **AH checksum** | | | **30,717 / 30,902** | no overlap, no omission |
| `ER0 topology-authority-review` | 1–103 | shared dispatch/review floor | **4,763 / 4,789** | Run/review authority; ER root |
| `ER1 goal-capability` | 104–122 | Coder/Tester | 643 / 643 | Goal Recheck/capability; ER0 |
| `ER2 tester-ci-retest` | 123–212 | Tester/Coder as appropriate | 5,370 / 5,392 | evidence mode/failure; ER0 |
| `ER3 completion-handoff-merge` | 213–319 | Coder/Reviewer/Orchestrator | 2,777 / 2,807 | closure/independent verification; ER0 |
| `ER4 critic-reviewer` | 320–347 | Critic Reviewer | 1,835 / 1,879 | authorized CR; ER0 |
| `ER5 NEXT-claims-gates` | 348–508 | Planner/Tester/Orchestrator | 9,107 / 9,141 | NEXT empirical gates; ER0 |
| `ER6 recovery-revision` | 509–575 | Coder/Orchestrator/Tester | 10,200 / 10,206 | failure, lost response, plan change; ER0 |
| **ER checksum** | | | **34,695 / 34,857** | no overlap, no omission |
| `JR0 intake-bootstrap` | 1–72 | shared + Planner | **8,645 / 8,675** | role loading, Project/Bootstrap; JR root |
| `JR1 planner` | 73–116 | Planner | 3,417 / 3,502 | Plan/Job/CRL handoff; JR0 |
| `JR2 coder` | 117–142 | Coder | 1,014 / 1,068 | authorized code Run; JR0 |
| `JR3 reviewer` | 143–160 | Reviewer | 856 / 882 | exact target review; JR0 |
| `JR4 tester-ci` | 161–199 | Tester | 4,947 / 4,983 | test/scenario/CI route; JR0 |
| `JR5 persistence-recovery-human` | 200–244 | all under relevant lifecycle | 3,457 / 3,463 | pending write/fresh chat/Human authority; JR0 |
| **JR checksum** | | | **22,336 / 22,573** | no overlap, no omission |

**Aggregate measured source across four requested primary inputs:** TypeScript catalog 85,330 + AH 30,717 + ER 34,695 + JR 22,336 = **173,078 chars / 173,860 UTF-8 bytes**. Content accounting: 21 code buckets + 25 logical documentation sections = **46 attributed content units**; three conceptual parent navigation indexes add **0 original content** and **unknown future new index bytes**. If each document section becomes a separate physical file and the parents become new index files, the resulting structure would approach **49 physical/navigation nodes**, which is a clear microfile-maintenance risk, **not** an endorsed target.

**Important conflict/ownership observations:** AH, ER and JR contain parallel statements about Human approval, review independence, Tester failure classification, source/CAS/recovery and handoffs. They are *different original surfaces*, not automatically identical source text; de-duplication/rewrite is **prohibited in BASE-1A**. AH's Advisor permits selective source reading for technical accuracy; a proposal-only Advisor would be a **separate behavior-contract change**, not a safe textual rearrangement.

## 3. Frozen scenarios and BASE-1A Agent activation diagrams

**Oracle is the frozen user-facing SIM4 text, not code branch coverage.** The SIM4 design explicitly discloses that its original authoring session had previously inspected source, so independent source-blind `simulate` fidelity is **not demonstrated**. We trace its fixed intentions without editing expected outcomes. No actual role execution or external mock was run here.

The **main-path paper assumptions** are deliberate to make comparable multi-Agent work:
- S1: existing approved Criteria, but Plan/Milestone gap legitimately requires plan repair + independently authorized Bootstrap CRL; an already-PASS project follows a much shorter path.
- S2: an approved NEXT Task is ready and verified source changes/review/test are reachable; an already active Orchestrator coordinates.
- S3: Tester establishes a **nontrivial reproducible PRODUCT_FAILURE**, repair authorization exists and Coder therefore loads `debugging`. Runner/environment failure is a separate shorter branch.
- S4: non-UI new feature, sufficient Human choices are clarified and a future *separate* explicit Human plan approval occurs; the post-approval half is **not** run before that checkpoint. Material Criteria change or UI work adds more roles/skills conditionally.

Each arrow means **a distinct selected-role invocation and `get_agent_harness` payload** in the paper projection. An Agent choice is not actual host observation. Source files are inspected in a separate hypothetical code-audit context, **not** physically fetched to the model by the MCP Harness tool.

### S1 — Brownfield Bootstrap (Criteria already approved)

~~~text
Human: Bootstrap lại dự án này; Criteria đã có
  → Planner [BASE + role/planner; body job-planning]
      read current approved Criteria, Plan, Milestones, authority; run checklist
      only repair missing/inadequate plan, no new duplicate Project/Job
  → Reviewer (planning) [BASE + role/reviewer; body planning-review]
      independent exact plan revision and evidence
      CHANGES_REQUIRED → Planner repair → Reviewer again (additional calls)
  → Critic Reviewer [BASE + role/critic_reviewer; body critic-review]
      only the authorized Bootstrap CRL branch; independent verdict first
  → Planner [BASE + role/planner; no assumed Skill re-load]
      reconcile current checklist/readback; STOP at READY/NEED_HUMAN
  ✗ No product Coder Run from Bootstrap permission alone
~~~

Selected **4 Role calls / 3 Skill bodies**. Suggested but not necessarily loaded: Planner `critical-challenge/delegation`, Reviewer `review-evidence`, CR `review-evidence`. No Advisor absent Human intent to change/finalize Criteria. Failed permission or conflicting source → reconcile, then STOP/NEED_HUMAN; unchanged attempts → PAUSED_NO_PROGRESS. Already valid Plan means **no needless Reviewer/CR**; the four-role path is a **conditional long path**.

### S2 — Continue authorized Job/Task Coding

~~~text
Human: Tiếp tục code Task đã duyệt
  → Orchestrator [BASE + role/orchestrator; delegation]
      retrieve exact authorized Job, Task, branch, Run/cursor
  → Coder [BASE + role/coder; coding-loop (or NEXT Task injection)]
      verify current Job SHA/Task/revision/authority; scoped code + diff
      source tests; Goal Recheck; reconcile unknown write before retry
  → Reviewer (code) [BASE + role/reviewer; review-evidence]
      derive criteria independently, inspect exact diff
  → Tester [BASE + role/tester; testing-evidence]
      independent actual checks and failure classification
  → Orchestrator [BASE + role/orchestrator; no assumed Skill re-load]
      readback and close or route next legal action
~~~

Selected **5 Role calls / 4 Skill bodies**. Only one body copy counted for an injected NEXT required skill if present. Debugging, Tester-lab, host scenario-tester and frontend specialization are **not assumed loaded**. If the incoming role is actually Planner, an observed routing activation may be required; the artificial Orchestrator route must not be called the measured default. Missing Human execution approval, current branch, source scope, Task-required Skill, Job/Run authority or exact revision → BLOCKED, never tool-indirection permission bypass. Git CAS conflict/uncertain write → independent readback and safe recovery, no blind retry.

### S3 — Tester detects bug → Coder repair → Reviewer + Tester retest

~~~text
Human: Test bug; nếu lỗi sản phẩm thì sửa rồi retest
  → Orchestrator [BASE + orchestrator; delegation]
  → Tester #1 [BASE + tester; testing-evidence]
      freeze expectation; actual repro; distinguish product vs host/CI
      PRODUCT_FAILURE (verified, not assumed from CI RED alone)
  → Coder [BASE + coder; coding-loop + conditional debugging]
      trace root cause; regression oracle; scoped fix, exact Goal Recheck
  → Reviewer (code) [BASE + reviewer; review-evidence]
      inspect new diff and changed tests independently
  → Tester #2 [NEW BASE + tester; NEW testing-evidence]
      exact changed revision, failed + impacted regressions, new evidence
  → Orchestrator [NEW BASE + orchestrator]
      close only if required gates PASS; else bounded changed-evidence loop
~~~

Selected **6 Role calls / 6 Skill bodies**, including two separately assumed Tester Skill loads and `debugging` once. Tester never edits product source; Coder's green check does not replace independent retest. **ENVIRONMENT_FAILURE/host unavailable** → try authorized evidence/alternative check then UNVERIFIED; do **not** route to product repair without proof. Repeat unchanged failure → root-cause review/no-progress guard rather than infinite patching. `scenario-tester` is only a host Skill *suggestion* until actually loaded and executed.

### S4 — New feature, Plan → Review → Human → Code → Test

~~~text
Human: Thêm tính năng mới rồi triển khai, test
  → Planner #1 [BASE + planner; critical-challenge + job-planning]
      clarify missing real user choices, skeleton, full plan/Task/gates
  → Reviewer (planning) [BASE + reviewer; planning-review]
      independent requirements/goal/branch/task coverage
  → Planner #2 [NEW BASE + planner]
      read back exact PASS Plan, present to Human
  ├── NO HUMAN APPROVAL → STOP, no implementation calls
  └── NEW EXPLICIT HUMAN APPROVAL + fresh scope/branch/revision check
        → Orchestrator [BASE + orchestrator; delegation]
        → Coder [BASE + coder; coding-loop]
        → Reviewer (code) [BASE + reviewer; review-evidence]
        → Tester [BASE + tester; testing-evidence]
        → Orchestrator [NEW BASE + orchestrator]
~~~

Selected **8 Role calls / 7 Skill bodies** *across two separately approved stages*. Before approval, only 3 Role activations and **77,070** model-text chars on the selected planning path; the full 189,955-char projection is **not** authorization to execute the other five activations. Material Criteria WHAT/WHY change → Human/Advisor consultation separately; genuine UI/UX feature → Designer and frontend Task Skill, costs **outside this non-UI BASE**.

### 3.1 Independent obligations vs optional suggestions

| Branch | Mandatory if that action actually occurs | Suggested/unproven |
| --- | --- | --- |
| Any role | exact selected GSA3 shared+Role harness in `get_agent_harness` | opening .ts implementation as model source |
| Bootstrap | approved Criteria, source/readback, four-item checklist; independent review only if plan revised; Human approval before actual coding | automatic CR for already-PASS work; Advisor for ordinary Bootstrap |
| Coding | current authorized Job/Task, correct branch/scope, cursor/CAS, actual diff and evidence | debugging when no nontrivial bug; suggested host Skill |
| Review | independent exact target/requirements/evidence; Reviewer source read-only | reusing Coder verdict/hidden reasoning; implicit Critic Reviewer |
| Testing | independent check, specific target/revision, actual capability, truthful classification | fake PASS from interface/tool presence or unavailable CI |
| New feature | reviewed Plan and distinct **Human execution approval** prior to implementation | Designer/`ui-coder-frontend` without UI conditions |
| Docs | documents explicitly fetched on exact ref/section | merely listed in `canonical_refs`, `SKILL.md` or historical chat |

## 4. BASE-1A context ledgers: exact source vs returned text vs external docs

### 4.1 Delivered Harness/Skill text — `P` (paper sum of calls, not peak context)

The previously documented unchanged full `get_agent_harness` lengths at source baseline are: Orchestrator **22,420**; Planner **23,716**; Advisor **16,502**; Designer **16,463**; Coder **19,085**; Reviewer **18,619**; Critic Reviewer **16,972**; Tester **20,054**. They include the Shared Harness, role contract and renderer formatting; they **do not** include a new arbitrary source-file open.

| Journey | Role calls / explicit Skill loads | Full Harness text | Loaded Skill body text | **BASE-1A delivered `P`** |
| --- | ---: | ---: | ---: | ---: |
| S1 Brownfield with plan repair/CRL | 4 / 3 | 83,023 | 9,839 | **92,862** |
| S2 Continue approved coding | 5 / 4 | 102,598 | 10,287 | **112,885** |
| S3 Product bug/review/retest | 6 / 6 | 122,652 | 15,547 | **138,199** |
| S4 Feature planning + post-Human implementation | 8 / 7 | 168,649 | 21,306 | **189,955** |
| **Four journeys** | **23 / 20** | **476,922** | **56,979** | **533,901** |

No caching assumed. Native Skill body projections are **selected loads**, not guarantees the Host actually asked `load_skill`. `get_skill_catalog`, returned descriptions/JSON wrapper, server tool schemas and external Project files are not counted. **BASE-1A physically rearranged but unmodified still returns exactly the same `P`.**

### 4.2 Explicit TypeScript source-audit proxy — `N` (normally 0 runtime model source reads)

**Counterfactual navigation rule:** for each active role, open **facade 1,763 + Shared 15,285 + only that Role's module**; for each chosen Skill load also open its *TypeScript* source module. This is a deliberately aggressive **no-cross-role-cache source-inspection workload**: 3+N file reads per activation, **not** normal Harness MCP model behavior. Across distinct agent roles, private context cannot be assumed shared. Exact source source-module slices measured in `2.1.

| Journey | `N` source chars, no reuse | Source file opens | Distinct source files / distinct chars if reuse allowed |
| --- | ---: | ---: | ---: |
| S1 | **103,198** | 15 | 8 / 42,960 |
| S2 | **126,057** | 19 | 10 / 50,148 |
| S3 | **154,452** | 24 | 11 / 51,733 |
| S4 | **211,228** | 31 | 14 / 71,243 |
| **Total no-reuse case** | **594,935** | **89** | do not sum per-journey unique across unrelated journeys |

Main repeated common-source overhead in this proxy: 23×15,285 Shared = **351,555** source chars and 23×1,763 facade = **40,549** source chars. This is **not** a runtime claim: a real model calling `get_agent_harness` reads **zero** TS source files unless it separately requests them. This observation is central to judging whether fine-grained files actually help.

### 4.3 Three large guidance documents — `D` separate optional read sensitivity

**D0:** no explicit document retrieval documented → **0 observed doc reads / 0 countable prompt chars**. Just being listed as canonical docs or installed skills does not imply reading. External Project source/Criteria/Plan is `X`, excluded entirely.

**D1 hypothetical full-document-on-demand** (for cost sensitivity only): the paper assumes Orchestrator and Critic Reviewer each explicitly consult whole **AH + ER** (65,412 chars/2 reads), while Planner, Coder, Reviewer and Tester consult whole **AH + ER + JR** (87,748 chars/3 reads). In practice this may grossly overstate reading. These files retain all original text in BASE-1A; simply adding section pointers **does not** change how much a reader requests.

| Journey | D1 full referenced-doc chars | D1 whole-doc opens | If exact task-relevant sections instead: chars / section opens | Difference in docs only |
| --- | ---: | ---: | ---: | ---: |
| S1 | **328,656** | 11 | 111,812 / 28 | −216,844; +17 opens |
| S2 | **394,068** | 13 | 137,118 / 35 | −256,950; +22 opens |
| S3 | **481,816** | 16 | 175,326 / 43 | −306,490; +27 opens |
| S4 | **657,312** | 22 | 232,716 / 58 | −424,596; +36 opens |
| **D1 four journeys** | **1,861,852** | **62** | **656,972 / 164** | **−1,204,880 (−64.7%) but +102 opens** |

**Task-section selector used for the right-hand paper column** (non-exclusive, not a claimed sufficient instruction set):
- Orchestrator: AH `0,6,7`; ER `0,3` = **15,869 chars / 5 sections**.
- Planner: AH `0,1,7,8`; ER `0,3`; JR `0,1` = **33,422 / 8**.
- Reviewer-plan: AH `0,4,8`; ER `0,3`; JR `0,3` = **28,754 / 7**.
- Reviewer-code: AH `0,4,7`; ER `0,3`; JR `0,3` = **25,170 / 7**.
- Coder: AH `0,3,7,11`; ER `0,1,6`; JR `0,2,5` = **42,002 / 10**.
- Tester: AH `0,5,7`; ER `0,2,3`; JR `0,4` = **38,208 / 8**.
- Critic Reviewer: AH `0,7,9`; ER `0,4` = **16,214 / 5**.

Read one indexed section per open and retain no unobserved host cache. This selector reflects *typical relevance*, **not proof that other sections contain no mandatory guard** (e.g. NEXT sections are required as soon as that contract applies; Human permission is never pruned just because one excerpt omits it). Correct fallback is whole original document or additional required section, not a truncated authority view. The full D1 ↔ section-slice comparison is therefore an **optimistic structural forecast**, not a safe runtime payload reduction.

**Combined conditional *source-navigation only* proxy, for illustration:** `N+D1` = 594,935+1,861,852 = **2,456,787 chars and 151 opens** across four journeys. This is *not* actual Agent context; it is source/source-guide navigation under explicitly assumed full-document reads. It must **never** be added to the 533,901 model-facing `P` as if the same words were all delivered by runtime.

### 4.4 Entire-project external context — excluded (`X`)

The four scenarios also require independent reads of approved real Project Criteria/Plan/Task, Branch/Project Memory, Git HEAD/diff/test files, Checkpoint/Verification, logs and approval decisions. These may outweigh Harness and should be separately measured in Group 3, but assigning invented average bytes or loading them in this paper would hide the intended Group 1A effect. References listed in `canonical_refs` alone are not evidence of document reads. **Do not treat role ownership as a permanent ban on consulting upstream authoritative Criteria** when a delegated Task or independent review genuinely needs it.

## 5. Incremental Group 1A optimization experiments (all theoretical, BASE first)

Every step below starts from the prior stage and names a **disjoint text class**. The only source-navigation optimization is OPT4. No claimed savings from GSA3's already-existing lazy GSA Skill selection and duplicate-metadata removal.

### OPT1 — Shared Harness ownership: universal checked core + keyed Role policy

**Trigger:** authenticated existing `role` in `get_agent_harness`; does not require forged/unknown Task labels. **Load:** one verified mandatory universal core plus policy entries owned by exactly the active role, then existing Role-specific content. **Do not** move Human authority/recovery rules by intuition. The allowed A/B follow-on forecast provisionally reports 3,261-char universal candidate out of the larger Shared rules and role-selected *whole Harness proxies*:
Orchestrator `22,078`; Planner `22,422`; Advisor `5,932`; Designer `7,669`; Coder `13,308`; Reviewer `12,127`; CR `8,738`; Tester `12,679`.

Using those **unvalidated** per-role figures over the frozen 23 activations: save S1 **17,314**, S2 **20,328**, S3 **27,703**, S4 **29,408** = **94,753 `P` chars (17.75% of original BASE-1A)**, yielding **439,148**. **File reads/tool calls:** can keep the same 23 Harness calls by assembling on the server; **0 proved source-read saving**. **Complexity:** selector MEDIUM; shared-policy audit, backend mandatory-guard equivalence and multi-role regression **HIGH**. Key risks: authority dropped for a role that needs to stop or escalate, Advisor boundary silently changed, Reviewer/Tester loses evidence independence, Human approval looked optional. Use **full GSA3 Shared on unknown role/condition**. Rule IDs should have one canonical owner, not text copies into eight Role sources. **Decision:** strong forecast but *no safe policy deletion validated*.

### OPT2 — Task-specific Role loops, without cutting Role authority

**Trigger:** observed exact Project/Job/Task identity + current revision, immutable activity class (plan review vs code review, initial coding vs TEST_REPAIR, new Plan vs runtime supersession), and no pending state ambiguity. **Load:** entire immutable Role `authority` / outputs and all security rules, but one task-specific subset of **Role loop entries**. This is a separate cut from OPT1's Shared entries. On ambiguous class, stale revision, plan-change transition or newly failing check, **full Role fallback**.

Testable paper cuts **after OPT1**:
- S1 Planner twice: omit only non-UI `CLASSIFY PRODUCT WORKFLOW` and unrelated NEXT plan-supersession loop, 1,236 chars.
- S2 Orchestrator twice: defer planning-only loops 7–10, 20 once approved-current-Job state is independently established; code Reviewer omits planning-only loop 4. 5,180 chars.
- S3 analogous Orchestrator and code Reviewer cuts, **keep** Coder repair, Tester classification/RETEST and CR/approval protections. 5,180 chars.
- S4 Planner twice: omit unrelated runtime supersession; after explicit Human approval Orchestrator omits already-completed planning loops; code Reviewer omits planning-only loop, while planning Reviewer retains it. 6,014 chars.

Extra saving **17,610 `P` chars (3.30 percentage points of original BASE)**; after OPT1+OPT2 = **421,538**. Calls: no new call **only** if exact selector state is already available; otherwise state verification may require extra calls (unknown). **Complexity HIGH**, especially Reviewer/Tester independently deciding whether a section is applicable, and suppression of needed code/plan reevaluation after a failure. Safety fallback: return full Role rather than guess. Do not pretend `run_begin` accepts new arbitrary task-section parameters today.

### OPT3 — Progressive body sections inside selected Skill, not “load fewer Skills” again

**Trigger:** selected Skill is truly needed; trustworthy mode establishes an optional section's irrelevance at present. **Load:** full mandatory Skill core and deferred section only when conditions occur. Existing `load_skill` currently takes **name only** and returns full body; a section selector is not implemented. NEXT `required_skill_contexts` injection would need equivalent policy and parity.

Actual `skill_text` line-prefix anchors and measured favorable-path text:
- `job-planning` UI_FIRST/UX_FIRST/frontend clauses: **1,375 body chars** deferred only for confirmed non-UI Task; `BOOTSTRAP CAPABILITY REUSE`: **501** deferred if no skill gap.
- `coding-loop` conditional LLC59 CI RED/GREEN investigation: **1,315** deferred only after credible green/available checks; must load immediately on RED, missing runner or unclear result.
- `delegation` frontend-only clause: **255** deferred for non-UI handoff.
- `review-evidence` high-risk modified-test specific inspection clause: **290** deferred only after independent Reviewer observes it inapplicable.
- `testing-evidence` `RETEST/ROUTE` tail: **1,300** deferred for favorable initial check, **must re-load before failure handling** and cannot deprive Tester of its duty to classify failures.

**OPT3 extra savings applied after OPT2** (non-overlapping with Shared or Role cuts): S1 **1,375**; S2 **3,160**; S3 **255** (keep failure, CI, Retest sections); S4 **5,036**. Sum **9,826 more `P` chars (1.84 percentage points of BASE)**; after OPT1+2+3 = **411,712**. **Complexity MEDIUM–HIGH**: needs stable section IDs, exact rehydration, guards against missing failure routing and changes to loader/injection contract. Calls are unchanged only if selected text arrives in the existing response; when a deferred section becomes applicable, **+1 or more tool calls** may outweigh earlier payload reduction. **Keep** short sensitive `critic-review`/`debugging` whole by default. If no safe subsection proof: **full current `load_skill` body**.

### OPT4 — Versioned navigation to exact Role/Skill *and* Agent-guide sections

**Trigger:** a real task explicitly opens GSA TypeScript or Agent guide source; a stable parent index can point to exact pinned leaf/section. **Load:** exact paths/source ranges, not unrelated Role/Skill or full cross-role guidance; retain independently sufficient authority and allow additional sections on demand.

Two *separate* paper effects (both **`N+D` only, not `P`**):
1. `N`: under the deliberate source-audit proxy, once a correct versioned child path is given, do not re-open **facade** for the 2nd–Nth activation in the same journey. Savings (1,763 per repeated activation) S1 **5,289**; S2 **7,052**; S3 **8,815**; S4 **12,341** = **33,497 source chars / 19 file opens**. `N` becomes **561,438 chars / 70 opens**. If an independent Role cannot trust that path or must inspect facade itself, saving **0**.
2. `D1`: route full AH/ER/JR reads to the already indexed task-relevant sections in `4.3: S1 **−216,844**, S2 **−256,950**, S3 **−306,490**, S4 **−424,596**, total **−1,204,880 documentation chars (−64.7% of D1)**, but section opens **62→164 (+102)**. If **D0** no doc reads, documentation saving **0**; if selected section set omits required content, must fetch more/full and the optimistic saving falls.

In the **assumed D1 source-only world** combined `N+D` changes **2,456,787 / 151 opens → 1,218,410 / 234 opens**: **−1,238,377 chars (−50.4%) but +83 opens overall**. This number is a navigation sensitivity comparison, **not** a real GSA Agent prompt saving, and should not be added to 22.89% model-text forecast. Each additional doc fetch is an observable tool call in a future experiment; latency can exceed the value of smaller text. At 1,204,880 chars saved for +102 document-section opens, the illustrative break-even is **about 11,813 avoided characters per extra open** if one artificially prices an open solely in equivalent character-processing cost (not a measured equivalence).

**Complexity LOW–MEDIUM** for exact existing line ranges/links, **MEDIUM–HIGH** for stable section identity across revisions, dependency graphs, index freshness, many calls, Review/Tester independent access. **Fallback:** use original full document if stale/unknown section IDs or necessary scope uncertain; never suppress referenced mandatory rules. **Recommendation:** prefer coarse cohesive groups and stable named ranges before 25 physical guide microfiles; instrument real co-reading first.

### OPT5 — Avoid repeated cross-Agent policies without “one Agent's memory replaces another's authority”

**Trigger:** same canonical policy appears in Shared + a Role + architecture docs or repeated role activations. **Proposed ownership, not a text deletion:** one role-agnostic canonical policy ID owner, one audited role→required-policy matrix; assemble minimum mandatory text *independently* for each role; in documentation use canonical anchors/references, but don't rely on a link instead of an instruction that must be delivered to that role. Preserve Reviewer/CR/Tester isolation. Same-turn handoff passes only exact requirements/revision/evidence, not previous Agent's hidden reasoning.

**Quantified bounds:** guaranteed extra `P` saving **0** beyond OPT1–OPT3; no additional percentage credited. The selected paper paths contain **153,365 chars of duplicate same-role Harness invocations** (S1 23,716; S2 22,420; S3 42,474; S4 64,755), but dropping them would require **proven** role-context persistence/caching and correct review isolation. The host cache is unknown, so `0–153,365` is at best a **hypothetical upper range for repeated same-role Harness delivery**, NOT an additive tested reduction and not applicable to different independent Roles without re-validation. Literal role-policy duplication risks *growing* multirole source-navigation text and policy drift. **Complexity HIGH** for canonical policy migration and regression, MEDIUM for index/reference documentation. KEEP current full instruction when in doubt. **Do not credit speculative cache** or replace mandatory text with opaque IDs.

### 5.1 Recomputed four-scenario, non-overlapping `P` waterfall

Only OPT1/2/3 affect delivered Harness/Skill payload. OPT4 source reads and OPT5 uncertain duplicate-policy redesign **must not be added**.

| Journey | BASE-1A `P` | After OPT1 (Shared) | After OPT2 (+Role loop) | After OPT3 (+Skill section) | Total favorable-path reduction |
| --- | ---: | ---: | ---: | ---: | ---: |
| S1 | 92,862 | 75,548 | 74,312 | **72,937** | −19,925 / **21.46%** |
| S2 | 112,885 | 92,557 | 87,377 | **84,217** | −28,668 / **25.40%** |
| S3 | 138,199 | 110,496 | 105,316 | **105,061** | −33,138 / **23.98%** |
| S4 | 189,955 | 160,547 | 154,533 | **149,497** | −40,458 / **21.30%** |
| **Total** | **533,901** | **439,148** | **421,538** | **411,712** | **−122,189 / 22.89%** |

| Stage | Additional `P` saved vs previous | Cumulative `P` saved vs original | Expected sources/calls | Complexity, validity |
| --- | ---: | ---: | --- | --- |
| BASE-1A separation only | 0 | **0%** | 21 code modules, 25 doc sections by index; original API | extraction HIGH, parity not done |
| OPT1 role-policy | −94,753 | **17.75%** | same 23 harness calls if server assembler | MEDIUM machinery / **HIGH** guard audit; unverified |
| OPT2 task Role loops | −17,610 | **21.05%** | same if trusted state exists, otherwise extra verification | **HIGH** conditional omission risk; unverified |
| OPT3 Skill sections | −9,826 | **22.89%** | 20 selected bodies nominal, optional future section calls | MEDIUM–HIGH; favorable branch only |
| OPT4 exact index/guide navigation | **0** | **22.89%** | D0: `N` opens 89→70; D1: `N+D` 151→234 | MEDIUM–HIGH doc drift/call overhead |
| OPT5 canonical policy/no guessed caching | **0 proven** | **22.89%** | unknown exact real context/call effect | **HIGH**, no safe extra credit |

**Sensitivity:** If only fraction `q` of the proposed shared-policy pruning passes safety review (and conditional OPT2/OPT3 remain valid), total model savings becomes `q·94,753 + 17,610 + 9,826`, on the fixed 533,901-char base. At `q=0`: **27,436 (5.14%)**; `q=0.5`: **74,812.5 (14.01%)**; `q=1`: **122,189 (22.89%)**. These are arithmetic scenarios, not confidence intervals. If no conditional pruning is proven safe, **0%** overall. OPT4 doc side independently ranges **0 to 1,204,880** saved D1-paper chars, plus possible extra source facade savings; its actual host hit rate is unknown. Do **not** infer real speedups, tokens or safety from these percentages.

## 6. Technical Review — separate threats and disqualifiers

| Concern | Group 1A finding | Required evidence / fallback |
| --- | --- | --- |
| **Too many files** | 21 code modules + 25 doc sections + 3 hypothetical indexes = as many as 49 navigation targets; 260-char Designer section and 498-char Planner intro are **not** compelling standalone files. | Cohesive grouping option and KEEP must remain comparators; keep tiny pieces as named ranges or co-locate with parent. |
| **More file/tool reads** | D1 targeted sections reduce bytes but +102 document opens. Combined proxy still +83 opens after facade shortcut. This can worsen latency. | Observe real read spans, tool calls/hops, batching support, runtime elapsed time; coalesce small sections if warranted. |
| **Delivered text vs moved files** | `get_agent_harness` already selects one Role and `load_skill` selects one Skill; physical split alone saves **zero** delivered text. | Golden compare exact 8 Role texts, 11 Skill bodies, suggestions, Direct/JOB schemas; measure real model payload separately. |
| **Policy ownership ambiguity** | Human approval, branch/scope fence, denied action, CAS, unknown write, cursor, Review/CR independence, STOPCHAT and no-progress appear in several surfaces. | Per-policy canonical ID, mandatory role coverage, backend proof, negative omission tests, full fallback. No assumed backend enforcement from doc wording. |
| **Reviewer independence** | A task section selector trained on Planner/Coder's own result could hide plan-drift or high-risk test obligations. | Reviewer derives target/scope/risk independently from exact requirements and diff; no hidden reasoning or self-verdict reuse. |
| **Critic Reviewer independence** | CR is not always active; when activated it must form its verdict **before** reading ordinary Review conclusion. | Authorized Human/CRL state, prior Review exact revision, source-blind-to-verdict independent CR run. |
| **Tester independence / false greens** | Optional retest section removal is safe only on an actually green initial path. Host-not-executed ≠ source bug or PASS. | Exact observed capability/runner logs; environment failure stays UNVERIFIED; reload routing instructions at first RED; Tester source read-only. |
| **Advisor contract conflict** | Current Advisor Role and AH allow selective source inspection. Human idea of “Proposal/Criteria-only” is a possible future behavior change, **not BASE parity**. | Explicit contract decision before ever deleting Advisor's source-reading authority. |
| **Human approval** | A reviewed planning skeleton, Plan PASS or Bootstrap READY never equals product-source execution approval. | S4 stops before code without explicit Human plan approval; S1 stops before implementation; independent readback required. |
| **Scope and permission** | Typed Role alone is insufficient to infer Git/Project write authority. | Retain authorization, branch, current Job/Task/revision, CAS/readback; denied request is STOP not alternative-tool puzzle. |
| **Source-doc duplication** | Role → AH/ER/JR guide → policy reuse may create contradictory editions after selective refactor. | Canonical policy owner and link integrity; no unvalidated delete, no repeated policy copies with drift. |
| **Stop/fail/retry** | Exact failed tool/error or missing host cannot be paper-PASS. Retry without changed evidence is unsafe. | source/cursor reread, bounded repair/retet, no-progress guard, appropriate BLOCKED/UNVERIFIED. |
| **Independently source-blind `simulate`** | Frozen SIM4 was designed in a session with prior source exposure, and this report uses static tracing; cannot call the four cases independent, executed or host-verified. | Real independent Designer freeze before code access; tracer; both pass/fail external mocks; real host/source tool observations. |
| **No actual extraction** | Actual post-extraction stage requires files to exist and parity PASS. The current Group 1A user authorized only paper study. | Treat everything here as projection; no R6–R8 milestone claim or implementation decision. |

### 6.1 Negative branches replayed on paper, not actual tests

| Input / failure | Correct result | Critical rule that selective loading must not hide |
| --- | --- | --- |
| Brownfield Criteria/Plan missing or conflicting | Reconcile source, then NEED_HUMAN if authoritative decision unavailable; no fabricated READY | Project scope and Human authority |
| Brownfield already valid | Reuse, no duplicate new Job/CR | Bootstrap same-turn minimal checklist |
| Approved Coder Task but stale Job SHA or cursor pending | Reread and reconcile; stop on UNKNOWN_CONFLICT | Git/Memory exact readback and cursor |
| Explicit denial / missing write grant | STOP, no shell/similar-tool bypass | authorization fence |
| Tester host/CI not runnable | ENVIRONMENT_FAILURE/NOT_READY/UNVERIFIED after bounded probing, not PRODUCT_FAILURE or PASS | capability truth vs evidence |
| Retest on same stale revision | Invalidate; require changed source + exact Goal Recheck | independent retest provenance |
| Repeated identical product fail | Revisit full causal boundary; bounded no-progress STOP if no new evidence | debug and recovery |
| New feature without Human execution approval | Reviewed Plan then STOP; zero Coder source edits | Human decision gate |
| Requirement materially changes Criteria | Advisor+Human consultation, exact Criteria change/readback then replan | special Advisor checkpoint |
| UI/UX feature | Actual Designer Task and `ui-coder-frontend` if classified/required | task-skill specialization |
| Reviewer/CR hears Coder summary | Reconstruct independently from current requirements, diff, durable evidence | role isolation |
| Section index stale or missing | Full source/Role/Skill/doc fallback or BLOCKED if mandatory evidence cannot be retrieved | no unsafe omission |

**Review disposition:** complete *paper technical review* with explicit blockers and constraints. **NOT** an independent second-Agent Review PASS. No actual user-surface simulation or source-executed verification was done.

## 7. Group 1A recommendation, without choosing final GSA4 architecture

**1. Keep BASE before optimization.** The base's measured 85,330 TS source characters and 87,748 guidance document characters are exactly accounted for, and the hypothetical split must preserve runtime outputs. Do not claim source navigation is normal automatic model consumption.

**2. Prefer cohesive doc anchors/index + selected contiguous sections initially, not 25 more tiny physical doc files.** A mixed approach (8 own Role source objects, 11 Skill objects, a checked Shared owner, three canonical full original guides with stable section anchors, and only proven high-co-read guide leaves) better preserves original authority without doubling maintenance. This is a **candidate**, not the final architecture.

**3. If real extraction/parity later passes, investigate OPT1 first.** It has the largest *model-facing* favorable-path potential, but requires an auditable policy-ownership matrix per Role and negative-scenario enforcement proof. For task filtering, conservatively keep Human/permission/error/review/retest rules always reachable. OPT2 and OPT3 follow only after real task facts can be trusted.

**4. Treat document section navigation as a separate latency tradeoff.** The D1 −64.7% document text reduction requires +102 opens in the paper fixture and may be a net loss; get measured co-read traces, actual API capability for multiple ranges, elapsed time, and reviewer discovery behavior first. If no real doc reads occurred, the claimed document savings is **0**.

**5. Do not mistake repeated Agent policy delivery for removable redundancy.** Review, Tester and CR must possess independently sufficient instructions and evidence. Reuse canonical definitions in code/documentation where safe, but keep role model-facing mandatory delivery until verified caching or equivalent contract semantics exists.

**6. Next authorized evidence (NOT performed here):** independent source-blind user scenario design, full 8-Role/11-Skill golden parity on physical extracted code including Direct/JOB and Task injection, tool-result capture of actual role/skill loads, exact source/document read ranges, denied/unknown-write/Review/Tester negative tests, CT-00 model-facing measurement and observed host latency. Compare this Group 1A against other Group 1 and Group 2 candidates on identical User fixtures and safety hard stops; do not preselect a winner from an optimistic paper waterfall.

**Conclusion: GROUP 1A PAPER RESEARCH & REVIEW COMPLETE. No implementation, no approved GSA4 choice, no runtime PASS and no merge/deploy.**

## Appendix A — Reproduction arithmetic and call-accounting recipe

1. Pin `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`; source `harness-catalog.ts` contains 85,330 JS characters. Slice prefix before `export const ROLE_HARNESSES` as Shared; each of eight `^  role: {` entries until next entry or closing brace as Role; each of eleven `^  ('quoted-name'|delegation): {` Skill entries as Skill; residual as facade. Assert checksum **85,330 / 85,528 bytes**. A quote-only parser *will miss delegation*.
2. For docs, split into exact counted line ranges in `2.2`, including delimiters/newlines once; assert every source character assigned one and only one section. Terminal line count may exceed nonempty line count due final newline; source-length checksum is authoritative.
3. Reproduce `P` using full role Harness sizes documented in the common follow-on forecast and Skill body strings from the pinned `RUNTIME_SKILLS` literal arrays joined by `\n`, once per selected Skill occurrence. `run_begin.required_skill_contexts` is an alternative delivery mode and must not be counted again if it provides the same body.
4. Reproduce `N` per activation using source chars `1,763 facade + 15,285 Shared + Role source size` and Skill source module size once per selected Skill. Opens = `3 + selected Skill count`. All of this is hypothetical explicit source audit, not runtime importer overhead.
5. Reproduce `D1` using AH+ER for Orchestrator/CR and AH+ER+JR for Planner/Coder/Reviewer/Tester, per activation, without caching; apply per-role section selector exactly as in `4.3`. D0 = no evidenced retrieval. Count sections as separate reads; new index costs and batching remain unknown.
6. OPT1 uses the common follow-on document's published **conditional role-selected full Harness projections**; OPT2 drops only particular Role loop entries from existing numbered render; OPT3 drops only specifically enumerated Skill body strings/sections. OPT4 changes `N/D` only; OPT5 credits 0 without runtime evidence. Never add `P` + `N` + `D` as if they were one measured model context.
7. For each User journey, add only actual future observed activations and evidence. STOP branches shorten the trace; failure/retry branches extend it. Source-independent, Human-derived oracle must be frozen and separately compared to host behavior before a PASS label.
