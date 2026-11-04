# GSA4 — Technical Proposal: Fine-Grained Physical Modules + Logical Task Context

**Date:** 2026-11-04  
**Status:** PROPOSAL FOR DESIGN REVIEW; **HUMAN SELECTED A-FIRST ARCHITECTURAL DIRECTION**, not an assertion that code has been split, benchmarks run or technical parity independently verified.  
**Development source:** `thebimhouseinfo-sudo/GPT-supper-agent` / `upgrade/gsa-context-efficiency`.  
**Golden GSA3 source pin:** `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`.  
**Plan:** [GSA4-DETAIL-PLAN.md](./GSA4-DETAIL-PLAN.md); original [DETAIL-PLAN.md](./DETAIL-PLAN.md), [GSA4-RESEARCH-PLAN.md](./GSA4-RESEARCH-PLAN.md).
**Verified source map:** [GSA4-A0-SOURCE-TO-MODULE-EXTRACTION-MAP-20261104.md](./GSA4-A0-SOURCE-TO-MODULE-EXTRACTION-MAP-20261104.md), grounded in the existing named GSA3 helpers and public registrations. It replaces the hypothetical Group 2 file counts and locates the exact affected tests; no new product implementation is proposed during A0.
  
**Research:** [G1A](./GSA4-G1-A-RESEARCH.md), [G2A](./GSA4-G2-A-RESEARCH.md), [six-report cross-review](./GSA4-SIX-REPORT-CROSS-REVIEW-20261104.md), [A-first paper simulation](./GSA4-A-BASE-DEVELOPMENT-PATH-SIMULATION-20261104.md), [Agent × Job × Task research](./GSA4-G3-AGENT-JOB-TASK-CONTEXT-RESEARCH.md).

## 1. Architecture decision and engineering problem

### Selected direction

- **A: physical ownership**. Source/Role/Skill code is split into **small coherent, independently addressable responsibility modules**, with stable imports and thin parent facades. File count is a maintenance cost, not a target or negative metric by itself; prefer locally understandable modules over monolithic lifecycle files, but preserve strongly coupled atomic units.
- **B: logical work-context assembly**. A logical `Bootstrap`, `Coding`, `DebugRepair`, `PlanningReview` or `Testing` bundle maps to **references to A-owned leaf modules and authoritative Project/Job/Task/Knowledge records**. No physically merged B source file and no copied second policy source. The same Role may use different bundles in different Jobs.
- **Progressive need detection**. Every context includes the applicable red flags for **ASK / READ_MORE / STOP**. If mandatory evidence, authority or cross-domain dependency is uncertain, expand source retrieval or escalate—not a guessed fallback that continues writing.
- **Prioritize repairability**. Measure finding the real owner/root cause, understanding dependency closure and independently verifying a fix, not solely prompt character counts.

### Strict two-phase separation

**Phase PHYSICAL_A0** moves source without changing existing GSA3 exposed behavior or delivered model text. **Phase CONTEXT_OPT (A1..A6)** later improves source navigation and, where proven safe, actual model-facing content. **No CONTEXT_OPT runtime implementation or evaluation before physically extracted A0 has passed relevant source-executed parity.** The paper forecast is not a substitute for that dependency.

## 2. Source-grounded constraints and unchanged GSA3 contracts

The original Harness Catalog is `supabase/functions/gsa-mcp/harness-catalog.ts` with **85,330 original source chars**, eight `ROLE_HARNESSES` and eleven `RUNTIME_SKILLS`, plus `BASE_AGENT_HARNESS`, `ROLE_SKILLS`, `ROLE_HOST_SKILLS`, rendering and exports. Current `get_agent_harness` already returns only the requested Role + shared text and `load_skill` accepts a **name** for one selected Skill. `run_begin.required_skill_contexts` can provide required Task Skills; this must not be counted/injected twice. **Source splitting is not a model payload reduction.**

G2A inventories approximately six large GSA source parents: `index.ts`, `run-execution-tools.ts`, `project-setup-tools.ts`, `checkpoint-tools.ts`, `evidence-repository-tools.ts`, and `selftest.ts`, plus existing GSA1 modules. Across this hotspot, research source slices accounted for original source characters; projected facades/imports may change lengths. It identified **58 MCP tool names/order** in its pinned inventory; before physical migration record the actual live Tool Registry for the exact tested ref and compare **names, order, schemas, text/structured fallback and error paths**.

Invariants retained: all eight existing Role contracts; Human Criteria/Plan/code approval; Direct Agent and durable Job/NEXT; branch/scope authorization and denial; CAS/readback and source cursor recovery; exact Project/Job/Task/Run/Checkpoint identity; independent Reviewer/Critic Reviewer/Tester; real test classification; V2_STABLE/NEXT, PRODUCTION/TEST_LAB and legacy compatibility as currently implemented. No existing mandatory rule may disappear because the first context bundle omits its textual owner.

## 3. Group 1 source design — Harness, Roles, Skills

### 3.1 Proposed G1 physical tree (source design, no files created yet)

~~~text
supabase/functions/gsa-mcp/
  harness-catalog.ts                # existing public facade/lookup/render
  harness/
    shared.ts                       # original Shared instruction literal
    roles/
      orchestrator.ts
      planner.ts
      advisor.ts
      designer.ts
      coder.ts
      reviewer.ts
      critic_reviewer.ts
      tester.ts
    skills/
      debugging.ts
      critic-review.ts
      critical-challenge.ts
      job-planning.ts
      coding-loop.ts
      delegation.ts
      planning-review.ts
      review-evidence.ts
      testing-evidence.ts
      tester-lab.ts
      ui-coder-frontend.ts
~~~

**Coverage**: one parent + one Shared + eight Roles + eleven Skills = 21 logical modules. Original checksum from G1A: **1,763 facade + 15,285 Shared + 35,783 Role + 32,499 Skill source chars = 85,330**. This is not the final generated file size. Preserve original array/string formatting, role lookup, names and render order; if moving literals changes whitespace in rendered `harness_text` or `skill_text`, parity **FAILS**.

**Source/export plan:** parent imports private owned literals with exact original structural types and re-exports/assembles current public `BASE_AGENT_HARNESS`, `ROLE_HARNESSES`, `ROLE_SKILLS`, `ROLE_HOST_SKILLS`, `RUNTIME_SKILLS`, `renderHarness` under their current signatures. Do not make a child import `harness-catalog.ts` or duplicate Shared text into eight Role files. Preserve existing `harness-skill-tools.ts` and `run-execution-tools.ts` consumer contracts.

**Do not change in A0:** Advisor rights, Critic Reviewer isolation, role-selected policies, Skill bodies, Host Skill suggestion list, full role rendering; absent or invalid Role/Skill behavior, `get_skill_catalog` metadata, returned MCP serialization and NEXT Skill injection. Changing the actual policy selection belongs to later A4/A5 with separately reviewed rule coverage.

### 3.2 Agent guide material: section index before doc-file explosion

Canonical initial files:
- `docs/architecture/AGENT-HARNESSES.md` — ~30,717 chars
- `docs/architecture/EXECUTION-AND-REVIEW.md` — ~34,695 chars
- `skills/gsa-job-runtime/SKILL.md` — ~22,336 chars

G1A identified **12 + 7 + 6 = 25** logical section ranges. Keep their authoritative full originals and frontmatter; optional small navigation/heading indexes may point to those ranges. A 260-character “Designer” guide section or 498-character “Planner brief” is **not** a justified standalone file. Later physically extract a guide only if it has true independent ownership, stable references and measured co-reading/repair value, without duplicating mandatory content.

A reference to a guide does not inject its text into an Agent. Mark actual requested reads separately; a model invoking `get_agent_harness` does not automatically open repo Markdown.

## 4. Group 2 source design — responsibility modules, not oversized workflow files

### 4.1 Verified **existing** parent and function owners — exact source migration

**Authoritative function-level map:** [GSA4-A0-SOURCE-TO-MODULE-EXTRACTION-MAP-20261104.md](./GSA4-A0-SOURCE-TO-MODULE-EXTRACTION-MAP-20261104.md). The map was built by reading the actual GSA3 source at `0b5cf875` and comparing original Git blob SHAs on this development branch. It gives **current function names/line starts**, direct source calls, proposed destination and tests. This section no longer treats the former 22-child research sketch as the code to implement.

| Real original source / line scope | Actual code to move into A responsibility leaves | Source-preserving exception |
| --- | --- | --- |
| `harness-catalog.ts` L1–607 | Shared L1–55; eight keyed Role objects L56–261; eleven Skill descriptions/bodies L279–583; keep original Role Skill/Host maps L262–278 and `renderHarness` L584–607 as facade | No new Role/Skill semantics or synthesized policy |
| `index.ts` L46–207 (I1) | Contract/default helpers `resolveExecutionContract` etc. in contract leaf; auth/request/bridge helpers in separate request owner | Preserve request-scoped auth/config lifetime; not a single mixed I1 leaf |
| `index.ts` L208–357 (I2) | Namespaces, record paths, snapshots | Imports I1 contract helpers; one authoritative namespace/path implementation |
| `index.ts` L358–552 (I3) | Actual dispatch/closure functions, required Skill resolution and readback steps | `resolveRequiredTaskSkills` uses **existing** `RUNTIME_SKILLS` catalog |
| `index.ts` L553–858 (I4) | Bundle/attestation/Tester evidence validators | Imports I1/I2; exact evidence error strings and SHA |
| `index.ts` L859–1001 (I5) | Evidence gate, checkpoint outcome, failed retest, plan-supersession matching | Uses I4 and I2; no altered gate condition |
| `index.ts` L1002–1271 plus L1486–1503 (I6) | Zod planning/Criteria/evidence schemas + Bootstrap/CRL/Plan validators | `PLANNING_LOOP_CONTINUATION_SCHEMA` **belongs to Planning**, not Cursor |
| `index.ts` L1272–1485 (I7) | Cursor path, prepare/resume decisions | Preserve source-PENDING recovery semantics |
| `index.ts` L1504–1799 (I8) | Manifest parse/build, Project scope, addins/path validations | `readMemoryConfig` initially remains in composition (bound to configured runtime) |
| `index.ts` L1800–2395 (I0) | **Keep composition root**: createServer, tool registration, HTTP/Hono and request-wiring | **Keep nested `validateRepositoryProbeSnapshot` L1937–1990 in createServer** during A0 |
| `run-execution-tools.ts` L4,225,305,436,559 | **Five actual** tool handler blocks under stable existing facade | Keep original sequential registrations |
| `project-setup-tools.ts` L4,119,168,233,279,325 | **Six actual** tools, not four: setup, Criteria advice, Role addins, Bootstrap checklist, Bootstrap readiness, branch policy | Do not combine unrelated advice and addin code to satisfy a file count |
| `checkpoint-tools.ts` L4,300,518 | **Three actual** tools: claim, verification, gate, housed in two cohesive leaves | Gate may co-locate with verification to avoid a tiny file |
| `evidence-repository-tools.ts` L3,199,451 | **Three actual** tools: publication prepare/finalize and probe | Shared `validateRepositoryProbeSnapshot` remains request-bound callback |
| `selftest.ts` | **KEEP** current integrated fixture | No unsupported textual fixture splitting |

The original source `index.ts` and each of the R/P/C/E parents remain the public registration facades. Each extracted tool handler is the original body wired to the same `deps` values, with **no product-feature rewrite**. The exact 58-tool registration order remains a hard invariant.

### 4.2 Verified direct dependency edges and import strategy

The actual current source has a one-way extraction order:

~~~text
original index.ts / createServer / request-scoped values
   ├── runtime-contract leaf (original execution-contract constants/defaults)
   ├── request-auth leaf (original auth/bridge helpers, only if lifetime preserved)
   ├── I2 durable-record-io → runtime-contract
   ├── I3 run-dispatch-closure → runtime-contract + I2 + harness-catalog
   ├── I4 evidence-validation → runtime-contract + I2
   ├── I5 checkpoint-evidence-gate → runtime-contract + I2 + I4
   ├── I8 pure project-manifest-scope → existing project-utils
   ├── I6 planning schema/preflight → I8 + existing planning guards
   └── I7 cursor decisions → I2 + existing recovery decisions

original Run facade → real run_begin/relationship/goal/verification/complete leaf registration bodies
original Project Setup facade → six actual ordered leaf registrations
original Checkpoint facade → claim, then verification + gate
original Repository Evidence facade → publish prepare, finalize, probe
original selftest.ts → KEEP real imported facade
~~~

**Source facts driving the edges:**
- `index.ts` L324–388 `validateCompletedTaskRunSnapshots` / `nextDispatchPreflightError` share the current Job+Run revision gate; I3 calls I2 and I1.
- L391–413 `resolveRequiredTaskSkills` directly reads `RUNTIME_SKILLS[name]`. **Do not** replace it with a new universal Project Skill selector during physical extraction.
- L622–858 validators call namespace and durable snapshot helpers; L859–1001 checkpoint/evidence gate calls I4 validator.
- L1060–1156 Bootstrap/Plan helpers use `parseProjectManifest` and `validMemoryPath` in I8.
- L1937–1990 `validateRepositoryProbeSnapshot` is **inside** createServer and is passed to repository evidence tools at L1993. Its callback and current source location remain unchanged at A0.
- Original `registerRunExecutionTools` receives 31 existing `deps` fields, and its `run_begin` uses 23 of them; other R/P/C/E blocks use their current per-request fields. **Reuse the existing deps object** when moving handler bodies; do not invent a new authorization/cache subsystem.

**Binding verification at extraction:** for each moved original function, read actual imports/types and check TypeScript free identifiers with the compiler, then move it with explicit one-way imports or same-value dependencies. If any closure cannot retain its value lifetime, **KEEP** that function in the original facade and state that specific exception. This check is necessary to make a concrete code move correct; it does not invalidate the already-recorded actual ownership/caller map.

**Existing test migration:** see [actual source map `4](./GSA4-A0-SOURCE-TO-MODULE-EXTRACTION-MAP-20261104.md) for each existing GSA2/GSA3/LLC/Module-boundary test that assumes source in old physical files. The source-executed test adaptation is included in **the same** A0 extraction packages, with every original negative oracle retained. Do not claim passing runtime parity from typecheck alone.

### 4.3 Public contract parity fixture

For every extracted owner, capture the exact GSA3 state before editing:

| Boundary | Golden / negative observations | A0 acceptance |
| --- | --- | --- |
| Registration | All current tool names/order, input/output schemas, export names | Byte/structure-equivalent registration as applicable |
| Transport | MCP result `content`/`structuredContent`/JSON fallback; HTTP paths | Existing payload and error semantics unchanged |
| Authorization | wrong Project/Job/Task/branch, denied scope, missing plan approval | Same denial/STOP before mutation |
| State/durability | Git SHA/CAS/readback, lost-response cursor, NEXT vs V2 paths | Same authoritative readback/recovery and no blind replay |
| Evidence | bundle/attestation, immutable repo ref, claim lease, checkpoint gate, test/retest | Same applicability, error and evidence shape |
| Roles | eight Harness renders, 11 Skill bodies/mappings/injection | Exact text/ordering/error outcomes |
| Review/test | independent Reviewer, Critic Reviewer, Tester; host-not-run classification | Cannot manufacture PASS; no changed isolation |

Use the repository's existing Deno check and Node/test-lab workflow, plus relevant real MCP/Host tests when available. Record commands/results and test revision; do not pretend an unexecuted host test passed.

## 5. Logical B-over-A context selection — later post-parity design

### 5.1 Core principle

**Files are owned by responsibility, bundles are assembled by actual work.** The bundle is a *versioned set of canonical references* to A leaves, Skills, Knowledge and requirement sections. It is not a duplicated `bootstrap.md`/`coder.md` copy with drifting rules. Avoid a new dynamic router or registry unless real current interfaces cannot provide the needed selection.

Conceptual flow:

~~~text
User request + current authoritative Project/Job/Task/Run
   → existing GSA role/permission/dispatch checks
   → current Agent Role + effective Work Position
   → Task-Need analysis (must know / must detect / must ask)
   → logical context recipe:
       mandatory Role Core + relevant approved Goal/acceptance
       + applicable Skills + relevant Knowledge + source owner references
       + verification/handoff conditions
   → L0 summary/index → L1 exact owner/API → L2 relevant code/knowledge
   → when triggered: L3 full transitive contract/source + ASK/READ_MORE/STOP
   → exact evidence + independent review/test
~~~

**Do not conflate**:
1. `instruction_text` actually delivered in a role/Skill MCP response,
2. `source_ref` that the Agent can open if relevant,
3. `authorization` established by existing runtime and Human gates.

The recipe may select 1 and 2; it **cannot manufacture 3**. Every current required instruction remains present during A0 and during early source-navigation experiments.

### 5.2 Proposed conceptual recipe fields — NOT an approved persisted schema

| Field | Meaning / origin | Selection safety |
| --- | --- | --- |
| `role` | One of eight actual GSA roles | Existing role authority fixed; never derive extra rights from job type |
| `project_ref` / `job_ref` / `task_ref` | Exact authoritative identity + revision | Re-read current scope/branch/Job where consequential |
| `work_position` / `phase` | Delegated responsibility and observed state; e.g., Coder working on bug repair | Not self-asserted “trusted=true”; no free-text permission |
| `goal_ref` / `acceptance_refs` | Approved Task and relevant parent goal/constraints | If incomplete or conflicting, ASK/READ_MORE before edit |
| `mandatory_policy_ids` | Every policy required for role + state, after audited ownership only | Fail closed to full existing Shared/Role on uncertainty |
| `skill_names` | Existing Runtime Skills or verified Project add-ins | Current `load_skill` takes name; don't invent unknown Skill |
| `knowledge_refs` | Valid canonical architecture/domain and Project records | Revision-bound; cannot replace mandatory policy |
| `source_refs` / `tests` | Owner symbols, direct producer/consumer dependency, test fixture | Current blob/source truth; widen to transitive closure on risk |
| `unknown_triggers` | Preconditions and cross-team interface gaps that require a question | Must be visible before starting, not only after failure |
| `handoff_and_evidence` | Exact changed SHA, scope, outcome, limitations and expected review/test | Independent Reviewer/Tester may read beyond initial Coder view |

**No requirement to store this whole table as one new durable database record.** First map to existing Job/Task/Run/Knowledge metadata, identifying only verified gaps. Ensure a Task packet's content is a **delegated summary with references**, never a second contradictory approval record.

### Actual GSA3 context inputs (TR-07; not inferred fields)

| Existing source declaration | What is available right now | Consequence for A2 |
| --- | --- | --- |
| `job-prepare-tool.ts` L10–21, L62–70 | project_id, criteria_binding, phase, Task records and `required_skills: z.array(z.enum(['ui-coder-frontend']))` | **Only** UI frontend Task-skill declaration is accepted in this input schema today; do not claim all 11 runtime Skills are valid here |
| `index.ts` L391–413 `resolveRequiredTaskSkills` | Collects Job Task `required_skills` and looks up known names in `RUNTIME_SKILLS` | Preserve current runtime validation; future additions need separate schema/contract tests |
| `run-execution-tools.ts` L10–20 and L48–115 | Run begins with current project_id, job_id, role, planning_revision, primary_task_id and exact current Job record | Determine effective work position from verified Job Task/topology and current Run, not from a caller's claimed role title |
| `project-setup-tools.ts` L168–232 `project_role_addins_resolve` | Verified Project `AGENTS.md` role-specific harness/skill **paths** with optional Task evidence | Path metadata is not an already loaded Skill body or permission; verify source path/SHA before use |
| `project-utils.ts` L57–78 `projectTaskCapabilityAssessment` | Matches Project/Role/Task/path and evidence SHA | Fail closed on missing required addins; never auto-grant CAD/backend capabilities |
| `run-execution-tools.ts` L225–304 `relationship_knowledge_prepare` | Existing KNOWLEDGE/architecture relationship records with source refs | Use canonical Project Knowledge provenance, not a fresh duplicate system |

**Minimum safe A2 packet:** current authorized Role, exact approved Job Task/revision, Task outcome and acceptance, current Run/phase as independently read back, verified source/Skill/Knowledge refs, pre-start unknown detector (READ_MORE/ASK/STOP) and expected evidence. `work_position` and `mandatory_policy_ids` in §5.2 remain **derived selectors**, not new persisted fields or independent permissions. Reviewers and Testers must independently reconstruct the oracle.
### 5.3 Same Role, different work: required real-GSA behavior

| Work position | Logical context selected | Out-of-scope initial content | Mandatory unresolved question |
| --- | --- | --- | --- |
| Coder, GSA MCP backend Tool | Coder core + actual Task + TypeScript/MCP source owner, auth/API negative tests | CAD/Revit-specific Knowledge | What is trusted caller, source revision and exact API contract? |
| Coder, AutoCAD/AutoLISP Job | Coder core + approved drawing/test fixture, verified project CAD Knowledge and affected AutoLISP | Unrelated backend schema | Is target drawing authorized, block/ATT spec known, rollback/test possible? |
| Coder, frontend UI | Coder core + current Design flow, UI state, `ui-coder-frontend` where genuinely required | Unrelated CAD/Backend specialist docs | Is actual UI behavior approved and test surface available? |
| Coder, product defect | Coder core + actual failing evidence, source owner+callers, `debugging` when nontrivial repro | Implementation assumptions from unrelated new features | Is failure product vs host, and what exact revision reproduces it? |
| Reviewer, planning | Independent Reviewer core + exact current approved Goal/Plan, `planning-review` | Coder's hidden reasoning | Is scope/criteria/evidence complete and revision exact? |
| Reviewer, code | Independent Reviewer core + diff, source/consumer graph, `review-evidence` | Prior Coder PASS as trusted oracle | Could changed contract affect another module? |
| Tester, host probe vs retest | Tester core + acceptance, exact target, capability, failure classification | Unrelated Skill bodies | Did test actually execute? Was retest on changed revision? |

**Other real GSA Roles:** Orchestrator owns state/next-action routing; Planner handles scope/Job decomposition; Advisor only applies under its **current** Human Criteria/technical advisory contract (a proposal to prohibit code reads is a separate policy change); Designer only for UI/UX needs; Critic Reviewer only when authorized and independently verifies before considering another Review. Work Position does **not** create a ninth role, a manager agent, or a gate.

## 6. A1/A2/A3 technical candidate mechanics, compared to KEEP

### A1 source locator (low semantic risk)

Minimal owner index records `MCP tool/error code → owning path + export/symbol → producer/consumer links → test selectors + source revision hash`. It may be static derived data, generated from verified exports, or a short curated index; decide by actual maintenance cost. Prefer existing source search/range facilities rather than writing a custom retrieval server.

- **Success path:** a failing `checkpoint_verification_prepare` maps to C2 plus I4/I5 and evidence producer E2; Agent reads owners and actual tests without beginning at full `index.ts`.
- **Failure path:** wrong/stale map, changed SHA, unknown error or cross-module interface → source search and L3 full relevant workflow; do not assume one error maps to one cause.
- **Observed cost to test:** index bytes + read calls + wrong-owner rate; compare with current search, which could already locate a symbol cheaply.

### A2 work-context recipe (medium)

Build logical selection *after* trusted current role/scope/Task identity; output canonical references to relevant A modules/Skills/Knowledge. Select by actual task needs/known interfaces. This may at first be solely navigation metadata, leaving `get_agent_harness/load_skill` unchanged. Do not introduce a new scheduler, permission system or context database by default.

The **same Coder** in a GSA checkpoint bug and a frontend/UI Job receives different specialist references/skills; runtime Skill existence and authorization must be checked rather than hallucinated. The selected initial packet MUST include any missing-information triggers that tell the assignee when **to ask before acting**. Only after independent Task-specific evidence should actual model-text shortening be proposed.

### A3 bug/root-cause graph (medium, quality first)

~~~text
Observed failure + exact source/host revision
  → classify PRODUCT_FAILURE / ENVIRONMENT / SPEC_GAP / UNKNOWN
  → source error emitter (locator) → real producer/consumer graph
  → authoritative expected behavior + test oracle
  → scoped Coder fix + new exact source SHA
  → independent Reviewer diff and transitive impact
  → independent Tester original repro + affected regressions
  → PASS / bounded changed-evidence repair / STOP & causal escalation
~~~

Do **not** replace existing BP-08 defect/retest rules or invent a new global retry runner. If native host is unavailable, mark UNVERIFIED; never call a text-only scenario a verified CAD/host result. Source ownership alone does not prove repair correctness: test the dangerous checkpoint example where a local C2 edit breaks E2 attestation or I5 gate.

## 7. A4/A5/A6 context-text experiments: distinct, reversible, high scrutiny

**A4 Shared mandatory instruction ownership:** create an audited unique policy-ID matrix for universal rules vs genuinely selected Role rules. **Do not cut policies based only on shorter text.** Need 8-Role + 11-Skill golden and negative evidence, exact actual backend guard enforcement where claimed, unknown Task fallback to full GSA3 authority, and no role-isolation erosion. The A-first paper experiment projects **303,501 → 228,114** total generated Harness+Skill characters on one 13-role/14-skill path (−24.84%) if safe; **validated safe saving = 0**. This effect is independent of physical A split.

**A5 conditional Role/Skill subsections:** current Skill selector already loads one body; only optional *sections within a selected body* are new. An exact trusted Task/Phase state and mandatory clause coverage would be needed; later RED/RETEST, branch conflict or denied action must hydrate appropriate full instructions immediately. Paper 2.16% Role-only or 1.10% Skill-only cases are **not additive** to A4 until non-overlap is audited.

**A6 guide section navigation:** use versioned headings/line ranges with optional range batching instead of moving dozens of microfiles. Source-independent paper analysis forecast **58% fewer optional guide characters** with **+58** extra fetches on a 13-Role audit fixture; if no guide docs are explicitly read, net saving = 0. Require actual tool latency and instruction completeness before selecting physical doc splits.

## 8. Reproducible comparison and expected results

### Equal-fixture accounting

The six-report cross-review corrected incompatible denominators (Group 1 A 23 Role calls vs B 13; Group 2 A 12 source readers vs B 17). The comparison must freeze both paths and Task symbols **identically**; count source file reads, Role+Skill delivery, docs/Knowledge and tool responses **separately**.

**Group 2 A baseline paper on four GSA source Tasks (12 independent reading sessions):** naive whole-A modules = **1,421,263 source chars / 65 file opens**. If exact owner locator omits an irrelevant `index.ts` read in each of 12 sessions, it becomes **851,935 source chars / 53 source opens**, plus assumed 24,000 locator chars and up to 12 additional index reads → **875,935 chars** (favorable modeled −38.4%). This is wholly due to twelve avoided original 47,444-char facade reads. If code Agent already searches owners, saving can be zero or negative. This is **paper source-navigation**, never host token/latency proof.

**Group 1 identical 13 Role + 14 Skill fixture:** A0 still delivers **303,501 model-text chars**. No source split changes that. A4 conditional forecast 228,114 is not accepted unless mandatory rules remain complete and actually observed at relevant model boundaries.

**Quality metrics:** wrong-file opens; time/steps to first correct ownership; exact root cause; source lines/chars opened; tool calls including index; repair iterations and changed symbols; test-known-bad RED→new SHA GREEN when really executed; independent review and regression; missed ASK/STOP preconditions; source/host latency; UI/host limitations. If A reduces prompt but increases regressions or leaves approvals ambiguous, reject that optimization.

### Source-grounded repair fixtures (TR-06)

The comparison is **GSA3 original source vs extracted A0 vs A1 vs A1+A2 vs A1+A2+A3** on the identical issue and acceptance, never an A-only source navigation score:

- **F-BUG-1:** `nextDispatchPreflightError` in original `index.ts` L358–389 rejects `NEXT_DISPATCH_STALE_JOB_SHA` and wrong Task Role. Correct root owner in A is the dispatch helper plus I1/I2 contracts. Independent test source: `runtime-logic.test.cjs`.
- **F-BUG-2:** `prepareExecutionCursorDecision` / `resumeExecutionCursorDecision` in original `index.ts` L1279–1485 handle PENDING unknown mutations. Correct root owner is I7 plus I2 and `recovery-decisions.ts`. Independent test: `reliability-cursor.test.cjs`.
- **F-BUG-3:** `validateRepositoryProbeSnapshot` inside `createServer` L1937–1990 is consumed by `evidence-repository-tools.ts` L3/199; a probe/attestation regression may be emitted in E but originate in the root nested validator. This intentionally tests A's dependency-hopping cost rather than assuming one file/one root cause.
- **F-BUG-4:** `job-prepare-tool.ts` accepts only Task `ui-coder-frontend` skill; compare detection of unsupported new Task Skill against current `resolveRequiredTaskSkills` and Role addins rather than assuming missing capability is authorized.

Each case captures initial source SHA, known-bad reproduction when possible, expected oracle, module reads, erroneous reads, actual root, diff/changed files, Reviewer independence, Tester execution and repair/retest rounds. Do not mutate production/main: use isolated fixture branches or code-only test runners, and record missing host capability as UNVERIFIED. A fix is not successful merely because the bug is now located in a smaller file.
### Test and proof ladder

1. **SOURCE_STATIC:** pinned symbol graph, line ranges, catalog content, expected role/tool inventory.
2. **SCENARIO_SIMULATED:** same User oracle and Task/Role cases; negative branches; no claimed Host behavior.
3. **SOURCE_EXECUTED:** code/type/test/registration golden comparison on actual A0 commit including test-lab static owner retarget and negative authorization.
4. **HOST_OBSERVED:** when available, actual MCP role/Skill calls, source-read traces, timing, real host testing; use existing CT-00, not a new token meter.

The original SIM4 paper was drafted by an author who had already seen source; a genuine source-blind design/trace comparison still needs independent evidence if claiming that level. Any non-executable fixture remains UNVERIFIED; no fabricated PASS.

## 9. Hard disqualifiers, rollback and technical review questions

| Risk | Prevention | Failure response |
| --- | --- | --- |
| Changed Human approval or Role authority | Exact policy/role snapshots before changes | Revert candidate/restore complete original policy |
| Missing Tool/schema/order or result field | 58-name/order inventory and current ref snapshots | Abort parity claim; correct in small source change |
| Child import cycle or closure capture drift | DAG audit, typecheck, injection only where behavior identical | Keep function at old owner or revert extraction |
| Tests silently weakened after file move | Retarget AST lookup, preserve assertions, independent review | FAIL and restore negative test |
| Misrouted Agent/Task/Skill/Knowledge | Check exact current metadata, source provenance, Task question triggers | Full safe context or ASK/STOP, never unsafe default |
| Reviewer/CR/Tester trusts Coder snippet | Independent requirement, source revision and evidence reconstruction | Incomplete verification → finding/UNVERIFIED |
| Broken Host/CI classification | Real callable test and environment probes | ENVIRONMENT_FAILURE/UNVERIFIED, no false product fix |
| Stale index or wrong root owner | Hash checks, symbol search, transitive callers/consumers | READ_MORE to full affected workflow |
| Apparent savings from extra calls or double counting | CT-00 and per-bucket accounting, equal Task fixtures | KEEP cheaper reliable method |
| Criteria/Plan documentation drift | Canonical record pointers; no copied approved authority | Reconcile owner before execution |

**Questions to resolve in source-aware review prior to first source write:**
- What is the **exact current** GSA3 tool/Skill/Role golden corpus on the intended implementation source branch?
- Which of the 22 G2A owners truly form closed import/dependency units and where is A-guard co-location warranted?
- Can `index.ts` be reduced further without moving dynamic `createServer` closures or changing static registration order?
- Which static AST/test-lab source-owner assumptions need location retarget and how is no loss of negative coverage verified?
- Can the existing source-search/range path provide A1/A2 without a maintained new runtime selector?
- Which policies, if any, are truly Role-specific rather than universal or evidence-dependent, and how is backend enforcement **proved**, not assumed?
- Which Project/Job/Task metadata is genuinely available to select applicable Skills and Knowledge; where does a missing prerequisite force ASK?
- Are A2/A3's potential repair improvements actually measurable as fewer edits/retests, not merely fewer file bytes?

**Technical proposal disposition:** A fine physical design + B-style logical work context is **the selected implementation direction to review and then build under existing authorization**. A0 source movement must prove exact parity. The subsequent options may be kept or reverted independently on correctness and measured value; do not silently optimize Harness text during extraction. No Criteria, GSA runtime, Tool registry, production branch or deployment changed by preparing this proposal.

## 10. Review corrections — concrete A0 execution and test design (TR-01..TR-04)

**Source review:** [GSA4 A-first Technical Design Review](./GSA4-A-FIRST-TECHNICAL-DESIGN-REVIEW-20261104.md). The corrections below resolve missing *design instructions*, **not** the still-future source-executed A0 parity proof. The original Source/Criteria, GSA3 control-plane behavior, and approval gates remain unchanged.

### 10.1 TR-01 — Import-aware Harness test migration (G4-P1/P2 + Package H)

**Evidence at pinned source:** `test-lab/gsa2-harness-dedup.test.cjs` and `gsa3-tool-skill-payload.test.cjs` transpile and run the original `harness-catalog.ts` as a **self-contained** CommonJS module under `vm`; `llc59-autonomy-harness.test.cjs`, `llc60-planning-loop.test.cjs` and `runtime-logic.test.cjs` search for literal `BASE_AGENT_HARNESS`, `ROLE_HARNESSES` or `RUNTIME_SKILLS` AST nodes/text **inside that same original file**. A pure import/re-export facade breaks these tests regardless of operational parity.

**Selected test migration design:**
1. **Before** touching the catalog, run and capture old catalog outputs from the actual baseline code, not from manually copied policy strings. Golden corpus: all eight roles; `renderHarness(role)`, `renderHarness(role,{includeProgressiveSkills:false})`, `renderHarness(role,{includeProgressiveSkills:true})` and invalid-role return; `BASE_AGENT_HARNESS`; canonical refs and `ROLE_SKILLS`/`ROLE_HOST_SKILLS` ordered mappings; all eleven descriptions/body strings, names/order, `get_skill_catalog` and `load_skill` success/auth/error/fallback; NEXT `run_begin.required_skill_contexts`. Preserve exact LF/newline/space and UTF-8 bytes. Capture GSA3 input/schema and expected output including both `structuredContent` and mirrored text, counting mirrored data only once for measurements.
2. Introduce a **test-only import-aware source loader** for the real TS catalog module graph. Prefer actual `Deno import` in the existing Deno-compatible check path; for Node 22 test-lab, use a bounded TypeScript CJS loader that resolves **only relative TS imports under the source tree**, preserving original exports and memoizing modules; it must not evaluate a fabricated flattened code copy or grant arbitrary filesystem/network permissions. Pin TypeScript 5.9.3 in the existing test environment. The loader itself is one tested change, not a new production dependency.
3. Replace monolith-specific AST owner searches with **exact new source-owned symbols** for Shared, Role and Skill leaves; test the public catalog's *actual aggregated exports* independently. In `runtime-logic`, Planner and Advisor negative controls must mutate the **actual owning leaf** or an isolated copy and show the contract test turns RED; source content changes may not be mocked via unrelated hand-written strings.
4. Explicit affected-suite ownership: `gsa2-harness-dedup` and `gsa3-tool-skill-payload` require import-aware evaluation; `llc59-autonomy-harness`, `llc60-planning-loop` and `runtime-logic` require source-owner AST navigation while retaining security and Planner/Advisor mutation checks; `reliability-cursor` and `project-branch-policy` must retain Role/Skill contract checks; `gsa1-module-boundary` must keep import/export/parity assertions.
5. **Do not defer test adaptation to A0.4**: Package H's same reversible commit (or an immediately preceding test-adapter-only commit that runs against old source) must have executable relevant tests; do not delete failed suites or loosen negative controls to claim green.

**Exit oracle:** compare actual pre/post catalog values byte-for-byte and **mutation-test** at least (a) missing common Human approval rule, (b) lost Planner-only feasibility guard, (c) polluted Advisor instruction, (d) missing Critic Reviewer independence clause, (e) removed Skill name/body; test must fail at the intended assertion. A Deno check alone does **not** cover these oracles.

### 10.2 TR-02 — Ordered 58-tool proof after R/P/C/E extraction (Package T)

**Source evidence:** `test-lab/gsa1-module-boundary.test.cjs` L58–112 reads the **original parent tool files** and uses `server.registerTool` regex order plus facade call positions; the pinned comparison is `test-lab/gsa1-tool-name-inventory.json` (58 tools). After physical child extraction this assertion must follow the **real expanded registration graph** rather than count zero handlers in parents.

**Selected proof strategy:**
1. Freeze **exact 58 registered tool names and ordering** from source at intended ref and the immutable existing inventory, including root inline registrations and transition tools. Also freeze each registration's input/output schema and result content/error behavior using real definition capture where executable.
2. Retain the original exported `registerRunExecutionTools`, `registerProjectSetupTools`, `registerCheckpointTools`, `registerRepositoryEvidenceTools` and their exact root call sites. Each parent invokes leaf registration functions **in the original sequential order**. A child must not register on import or in background; no duplicate registration and no conditional reordering.
3. Replace the module-boundary regex check with a source-grounded AST walker: root ordered `register*`/inline tool calls → parent sequential child calls → actual leaf `server.registerTool` definitions, preserving left-to-right order. Where AST analysis cannot prove a dynamic path, use an executable mocked `server.registerTool(name, definition, handler)` capture with the **actual** parent/leaf modules and supplied existing dependencies. A stubbed Zod chain is **not** schema proof; complement with actual schema/transport checks under real environment.
4. Negative mutations must detect removal, duplicate, swap of two calls or wrong name. Compare resulting list strictly to the pinned 58-name JSON and source-executed registration order. Preserve `gsa1-module-boundary` coverage; neither hard-coded “expected” names newly generated from changed source nor a code-comment order counts as proof.
5. At Package T extraction, preserve `structuredContent`, text fallback, schema, authentication and exception semantics in representative parent/child cases; no A0 Tool API changes.

**Exit oracle:** the same original 58-name/order inventory is produced from the **real source** after extraction, together with intact negative controls; every registration is owned exactly once. Runtime/Host behavior remains UNVERIFIED unless actually executed.

### 10.3 TR-03 — Symbol-capture ledger and safe seam policy (G4-P2; Package I/T)

**Risk:** `index.ts` contains top-level types/schemas, pure helpers, runtime default constants and request-`createServer`-bound helpers. Merely placing I1–I8 into files is not a dependency design. Specifically, `validateRepositoryProbeSnapshot` is **nested inside `createServer`** (original L1937–1990) and passed to the evidence Tool registration; `resolveRequiredTaskSkills` accesses imported `RUNTIME_SKILLS` (L391–413), and `nextDispatchPreflightError` depends on current Job/revision/Run and path helpers (L358–389). The source also relies on NEXT/`V2_STABLE` defaults and `TEST_LAB`/`PRODUCTION` memory namespaces.

**Required **pre-move** symbol ledger format**, populated from the exact live TypeScript AST/compiler and reviewed before *each* child extraction:
`symbol | source path/blob SHA/start-end | owner I/R/P/C/E | free identifiers, captured vars & imports | current callable scope (global/createServer/request) | value/dependency lifetime | callers/consumers | changed signatures (should be none) | proposed one-way import/injection | test IDs, security negatives | KEEP-in-parent fallback`.
Tool/argument names and all symbol owners must reconcile to a unique symbol→owner index. **An I/R/P/C/E name in this design is not a declaration of complete dependency closure.**

**Known owner decisions and proof obligation:**

| Candidate owner | Original source example / closure concern | Safe A0 approach |
| --- | --- | --- |
| **I1 contract/auth** | `resolveExecutionContract`, `jobExecutionContract`, `runtimeSurface`, `authContext`, bridge; defaults from source globals/request | Move pure values/logic only after fixed default/auth/request-shape analysis; keep request-specific factories in composition scope if unproved |
| **I2 durable IO** | `recordPath`, `verificationPath`, `checkpointClaimPath`, `parseDurableSnapshots`; namespace/contract defaults | One canonical path implementation; ensure callers compare identical namespaces/record SHAs |
| **I3 dispatch** | `nextDispatchPreflightError`, `resolveRequiredTaskSkills`, `goalRecheckCoverageError`, `nextClosureCoverageError`; catalog/body and completed Task dependencies | Reference original G1 facade exports (acyclic) and owner helpers; no Task-specific Skill reinterpretation in A0 |
| **I4/I5 evidence/checkpoint** | `evidenceBundleRefValidationError`, `validateEvidenceBundleAttestationSnapshot`, `evaluateNextEvidenceGate`; binding/attestation and SHA | Retain all old checks and backend-specific error strings; verify producer/consumer tests across C/E |
| **I6 planning** | `validateNextPlanningModel`, CRL/preflight schemas; Project manifest dependency | Do not silently lift `z` schema roots without defining import/order; preserve Plan revision and approval |
| **I7 cursor** | `prepareExecutionCursorDecision` and `resumeExecutionCursorDecision`; unknown-write and recovery | Keep exact PENDING/unknown-response/CAS readback; preserve source mutation reconciliation |
| **I8 Project identity** | `buildProjectManifest`, `parseProjectManifest`, `projectScopeDecision`; path and registered-repo state | Preserve exact Project frame/permissions; avoid child→index cycles |
| **createServer nested probe** | `validateRepositoryProbeSnapshot` L1937–1990 captures namespace/record/Verification helpers under live closure | **KEEP IN `createServer` at A0 by default**. Move only after a separately proven identical explicit dependency seam. Original E1–E3 children may use the injected callback while keeping owner in parent. |
| **R/P/C/E handlers** | `register...Tools(deps: any)` and inline `server.registerTool` callbacks; registration-time and call-time values | Keep original parent facade signature, deterministic leaf call order and closure/dep identity; co-locate a strongly coupled handler pair if separation adds hidden state |

**Implementation procedure:** first compute AST name-binding/free-variable ledger for **every** moved symbol; verify unique ownership, imports and no cycles; only then write a dependency-closed patch. Preserve capture lifetime (per request vs module singleton). Do not “fix” wide `deps:any` typing, security checks or orchestration semantics while merely moving code. The original selftest remains KEEP. A helper that cannot be proved safe stays where it is, without being marked extracted.

**Exit oracle:** complete **actual** ledger artifact for the chosen symbols, no missing owner or cycles, Deno typecheck and unchanged source-executed negative results. The above table resolves the *approach* but is **not falsely described as a full already-verified free-variable inventory**.

### 10.4 TR-04 — CI procedure for feature-branch exact-SHA evidence (G4-P1)

The observed `.github/workflows/gsa-next-logic.yml` triggers `push` on **`main` only**, `pull_request`, or `workflow_dispatch`. A plain push to `upgrade/gsa-context-efficiency` is **not** auto-tested by this workflow. No new workflow is required for the plan correction.

**Execution and verification plan:**
1. For each relevant A0 commit, record **commit SHA** and source tree hash. Execute available `node --test` suites and `deno check supabase/functions/gsa-mcp/index.ts` in a reproducible Node 22 / TypeScript 5.9.3 / Deno 2.x environment, using the **exact workflow-listed command list**, not a green from unrelated CI.
2. For GitHub runner evidence, use an authorized **workflow_dispatch** targeting the development **ref** or a PR whose head contains the exact A0 commit; the workflow must exist and dispatch be enabled. On completion, read back actual `head_sha`, event, ref, conclusion, jobs and logs. If a PR or manual run is unavailable, **do not** pretend main's latest successful run covered the candidate.
3. Preserve existing job steps `runtime-helper-check` and `deno-typecheck`. In the existing workflow, runtime-helper-check installs `typescript@5.9.3` and Hono into `/tmp/gsa-next-test`; it sets `NODE_PATH` for Node helper tests. The exact 11 `node --test test-lab/...` files in the workflow must be run, including GSA1/GSA2/GSA3/LLC58–60 and cursor/reliability suites. New import-aware owner adapters join that same test suite.
4. Label missing runner or unfinished run `CI_UNVERIFIED`; unit/source-only PASS never implies connected MCP/Host PASS. Record actual tool versions and environment restrictions; do not expand CI branch triggers just to manufacture a green check.

**Exit oracle:** CI/test evidence is tied to the **same candidate commit SHA** and independently fetched run conclusion. Changing application code is not needed to resolve this review planning omission.

