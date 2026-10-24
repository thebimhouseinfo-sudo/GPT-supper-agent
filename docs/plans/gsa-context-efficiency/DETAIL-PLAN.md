# GSA Context Efficiency — Detailed Refactor Plan

## GOAL

Reduce unnecessary **GSA-controlled** model-facing context while preserving or improving real Job completion quality, speed and reliability. Measure full-workflow consequences rather than declaring success from shorter text alone. Preserve existing governance, explicit Human authority, safe tool use, role independence and durable recovery. Do not claim control of the ChatGPT Web history/context window.

**Status:** DRAFT FOR REVIEW — detailed planning only, not approval to modify runtime.
**Date:** 2026-10-24.
**Development branch:** `upgrade/gsa-context-efficiency`.
**Base of branch:** `main` commit `2ae052b57241bb845234235767b3dcb767030c70`.
**Baseline production:** Supabase `gsa-mcp` v55 (source artifact previously independently verified).
**Source truth:** `thebimhouseinfo-sudo/GPT-supper-agent`; do not integrate to or deploy from `main` during research.
**References:**
- `docs/plans/planner-evidence-context-efficiency/CRITERIA-DRAFT.md` (feature-level DRAFT, not approved canonical Criteria)
- `docs/plans/planner-evidence-context-efficiency/PLAN-PRELIMINARY.md` (older preliminary plan)
- `docs/maintenance/MAIN-PRE-REFACTOR-READINESS-2026-10-23.md` (v55 readiness evidence)
- `docs/architecture/AGENT-HARNESSES.md`, `PROJECT-MEMORY.md`, `test-lab/README.md`

### Scope and authority

- This **context-efficiency-only** plan supersedes the implementation sequence of the older *preliminary* Planner+Context Efficiency plan, but does not alter approved Project Criteria, Human intent, existing production behavior or other Jobs. The Planner critical-challenge behavior is **already present** in v55 and is regression coverage, not a feature to rebuild.
- Human's acceptance that verification on a real GSA Job may occur later permits this bounded research and planning; it **does not** count as passing that future E2E test or as approval to merge or deploy.
- Work only on the designated development branch when subsequent implementation is explicitly approved. No Super Power or new plugin registration.
- No separate product-development gate, no new persistent context service, no ChatGPT Web `clear` command, no extra Criteria file, no per-test Job proliferation, no automatic CR. Reuse existing Planner→Reviewer and Tester flows and current Test Lab.
- An existing approved Criteria revision remains the project's authority for WHAT/WHY. The feature-level DRAFT is a planning reference and is **not** retroactively marked approved. If actual implementation demands a **material new WHAT/WHY**, route that decision through the existing Human+Advisor Criteria process; ordinary HOW/benchmark planning must not activate Advisor.
- Source edits, production merge and deploy require their normal explicit Human authorizations. This document alone grants none.

### Phase structure and dependency

`M1 Baseline & audit` → `M2 Reproducible replay & experiment contract` → `M3 Small, isolated optimizations` → `M4 Independent regression, staging & release packet`. Candidate M3 may be stopped after M1/M2 if savings or testability are not credible. Branch preparation is complete; no new M0/Bootstrap gate.

## Phase M1 — Runtime payload baseline and context-path audit

### GOAL
Establish reproducible evidence for which GSA-owned payloads are delivered, which are redundant, and which savings are *possible* without making unverified host-context claims.

**M1.1 Pin identities and measurement scope (read-only).**
- Record branch HEAD, production build/version, active plugin/client-schema status, runtime SHA and instrumentation/environment identity in a baseline manifest.
- Capture `get_agent_harness` for Planner, Coder, Reviewer and Tester as **separate observations** (independent role requests are not necessarily duplicated inside one Job).
- Capture `get_skill_catalog`, one `load_skill` each for a common and a task-only skill, plus representative tool outputs containing `external_steps`.
- Inventory MCP server instructions, tool descriptions/schema metadata, `BASE_AGENT_HARNESS`, `ROLE_HARNESSES`, `renderHarness`, `ROLE_SKILLS`, `ROLE_HOST_SKILLS`, and the per-tool response envelopes. For claims about what the model actually sees, distinguish source declaration, MCP server response and ChatGPT host-visible context.

**M1.2 Create measurement script/fixture in the existing Test Lab (only after implementation approval).**
- Store representative synthetic inputs and an allowlisted set of tool/role cases under `test-lab/fixtures/context-efficiency/`.
- Produce per-case `codepoints/characters`, `UTF-8 bytes`, tool response size, schema/description size when retrievable, estimated tokens (label tokenizer/model), common-prefix/semantic-overlap candidates and call count.
- Use sampled duration for MCP endpoints only when callable/instrumentable; separately record full-workflow elapsed time in M2. Never represent bytes, characters or estimates as exact ChatGPT input tokens.
- Verify deterministic results with repeated runs against the same pinned fixture/source SHA, stable metric units and an identified measurement environment.

**M1.3 Determine real redundancy and authority boundaries.**
- Build a `source → transport → caller/role → observed downstream need` map. Mark duplicates as: repeated by design across independent Roles; duplicate in one response; redundant but required at tool boundary; or candidate removable duplication.
- Audit whether `structuredContent` and `content` are both transmitted/consumed in ChatGPT Web. If inaccessible, record UNKNOWN; leave compatibility unchanged.
- For each proposed removal, map the *remaining* reliable delivery point and the policy/authority constraint it protects. Do not assume a previous chat turn or client cache will preserve essential instructions.

**M1.4 Freeze evidence and prioritize hypotheses.**
- Save small `BASELINE.md`, `BASELINE.json` and `CONTEXT-PATH-MAP.md` within this plan/test-lab scope; evidence must contain revision, date, units, query/test method and observations.
- Rank candidate changes by **estimated workflow benefit × confidence ÷ implementation/regression risk**, identifying uncertain values instead of pretending precision.
- Explicit go/narrow/stop recommendation for M3. If no meaningful safe opportunity exists, recommend no code optimization.

**Exit / acceptance:** Pinned, reproducible baseline; auditable distinction between actual observations and UNKNOWN host-token behavior; at least one justified candidate or explicit NO-BUILD conclusion; no runtime policy/security changes.

## Phase M2 — Controlled replay and frozen acceptance oracle

### GOAL
Measure end-to-end cost/quality on identical scenarios and freeze acceptance rules *before* testing optimized code, preventing a smaller payload from hiding more calls or worse decisions.

**M2.1 Define scenario corpus (Tester-authored independently of the optimization).**
Minimum scenario classes, with exact initial state, input, expected next action, expected authority and result evidence:
1. **Short Q&A / project status**: one concise, correct response without full Job/harness loading or invented gate.
2. **Planner critical challenge**: scoped CONFIRMED POSSIBLE / CONFIRMED IMPOSSIBLE / UNKNOWN and the known ineffective `gsa/clear` proposal; do not activate Advisor.
3. **Brownfield Bootstrap**: reuse approved Criteria/Plan/Milestones/skills without duplicating records or triggering Advisor; classify true missing evidence accurately.
4. **Planner → independent Reviewer**: maintain GOAL anchors, revision binding, automatic bounded review/repair within approved planning, and Human execution approval boundary.
5. **NEXT Job / Tester evidence**: dispatch skill selection, test readiness, role separation and exact evidence / CAS / branch protections.
6. **LLC58 plan change**: both REPLACE and RETIRE, exact-SHA fence, no successor for RETIRE, pending cursor/active Run block; no new Run for retired Job/Task.
7. **STOPCHAT / recovery**: minimal durable handoff with exact re-read and no fabrication or automatic background resumption.

Use lightweight deterministic fixtures for structural/security checks. Model-mediated checks (e.g. planner reasoning) may use 3 or more runs per case as capability/budget allows. Distinguish deterministic from sample-based outcomes.

**M2.2 Establish baseline replay.**
- Replay same fixtures on pinned unoptimized source/connection surface; record tool order, response bytes, all tool calls (including retries/rereads), elapsed latency and final result.
- Track `wrong-tool` calls against a scenario-owned expected-tool oracle; record whether incorrect tool choice changed work or just added an unnecessary call.
- Track `rework` as failed validation, additional correction loop or repeated step caused by missing/misread context; do not penalize intentional mandatory Reviewer/Tester steps.
- Isolate TEST_LAB vs PRODUCTION memory and use non-destructive tools unless an explicitly authorized isolated Job test exists.

**M2.3 Freeze candidate rules before experimentation.**
- Record measurement formulas, scenario IDs, baseline SHA, acceptable variance and numeric feasibility target in `REPLAY-CONTRACT.md` **after baseline, before M3 candidates**.
- Mandatory invariants: zero observed authorization/branch/Criteria/Advisor/CAS/role-isolation regressions; no dropped mandatory identifier, error reason, blocker, readback instruction or verification reference; no model response falsely treating UNKNOWN as impossible.
- Success requires a demonstrated reduction of at least one targeted GSA-controlled payload, correct task outcomes, and **no material increase in end-to-end calls/retries/rework/latency** under the frozen comparison rule. The quantitative target and non-inferiority tolerances must be set from M1/M2 evidence, not reverse-engineered after results.
- If host token billing/input counters are unavailable, use byte/estimated-token results only as proxies and label them.

**Exit / acceptance:** Repeatable original-source replay, Tester-owned locked fixture/oracles and frozen threshold/evidence contract. If replay cannot be reliably run, report UNVERIFIED and do not proceed as though quality comparisons are proven.

## Phase M3 — Bounded context optimization experiments

### GOAL
Implement only the most promising safe reductions to GSA-controlled payload, one hypothesis at a time, and retain only candidates that improve measured workflow without sacrificing correctness.

**M3.1 Choose no more than the first 1–2 supported high-value hypotheses** from M1/M2. Do not implement all candidates by default.

**Candidate A — Redundancy within harness.**
- Reduce genuinely repeated wording across startup instructions/shared harness/role loop **only** when the invariant still reaches the responsible role/tool on every necessary path.
- Keep authority and operating requirements exact enough for isolated ChatGPT sessions.

**Candidate B — Role/task-selective loading.**
- Verify current catalog/skill lazy loading and role suggestions first; fix **observed** bulk or unnecessary loading only. Do not strip role-required content just because another role already saw it.

**Candidate C — Repetitive noncritical tool guidance.**
- Shorten/reuse repetitive `external_steps` or large descriptions only when conditional relevance is proven and every required action/error/fence still appears exactly when needed.

**Candidate D — Optional summary + durable reference.**
- Use references for *non-critical* already durable input, while preserving exact SHA, identity, blocker, next action and verification in the actual response. Do not require the client to fetch a summary reference to learn an essential immediate action.

**Explicitly excluded unless separate evidence and approved contract:** removing `structuredContent` / `content` fallback; replacing current MCP protocol; hidden background compaction; changing ChatGPT host context; wholesale role/harness rewriting; changing Job/Task lifecycle, Planner/Advisor gate or Memory architecture.

**M3.2 Candidate execution loop (existing Coder/Tester contract).**
- For each hypothesis: record before sample + behavior oracle → test fails for intended old behavior when meaningful → smallest targeted source patch in the dev branch → deterministic tests + Deno typecheck → identical M2 replay → independent Reviewer/Tester evidence.
- Track per-candidate commit, touched files, exact savings, call count, outcome and reversibility. If failure: restore scope or revert that candidate, not layer patch after patch on a poor premise.
- A candidate with smaller bytes but worse total workflow cost/quality is **REJECTED**, not counted as success. Record negative findings; do not force an optimization.
- Use existing `test-lab/` and minimal test scripts. No new service, database, general context orchestration layer or additional Job type.

**Exit / acceptance:** At least one candidate meets locked M2 rules, or a documented NO-GO identifies why no safe net benefit exists; every accepted candidate has isolated evidence and rollback SHA.

## Phase M4 — Independent regression, staging and Human release handoff

### GOAL
Verify that accepted context changes do not undermine real GSA behavior, and present an exact release/no-release recommendation without silently merging or deploying production.

**M4.1 Deterministic contract regression.**
- Run original Node runtime/reliability/branch/LLC58/LLC59/LLC60 suites and all new context tests against candidate SHA. Deno `check` must pass.
- Enforce negative cases for: unauthorized source write, scope/branch escape, Criteria/Advisor misactivation, missed Human gate, incorrect Reviewer independence, stale CAS, cursor/active Run, RETIRE successor conflict, lost stopchat handoff information.
- If GitHub Actions remains a no-steps environment failure, retrieve run/job/steps/log evidence; use an equivalent source-pinned isolated runner for code PASS and separately record hosted CI **UNVERIFIED**. Do not call failed-to-run GitHub CI a code PASS.

**M4.2 Independent Tester / Reviewer validation.**
- Execute frozen M2 corpus against baseline and candidate; keep exact SHA, sample count, tool calls, bytes, latency, wrong-tool incidents, rework and outcome.
- Reviewer checks plan/Criteria match, actual diff, essential policy and evidence. Do not conflate a self-check with independent Reviewer.
- Use `tester-lab` if it is actually invocable; if host-managed `scenario-tester` is unavailable, state what scenario evidence could not be collected. The user's later real-Job verification remains a separate check.

**M4.3 Isolated staging and compatibility.**
- Use existing `gsa-mcp-refactor-stage` or comparable isolated staging only after exact permissions/config/source identification; no production write.
- Test ChatGPT tool schema exposure in a *fresh session* (old sessions can retain stale schema); verify tool names/enums, actual invocations, payload compatibility and auth boundaries before claiming client readiness.
- Do not depend on changing or registering Supper Power/other plugins. Preserve existing GSA connector identity.

**M4.4 Release packet, rollback and stop rule.**
- Produce `BEFORE-AFTER.md` with methodology, pinned base/candidate SHA, per-scenario outcomes, full-workflow deltas, confidence/UNKNOWN, negative findings, test logs/references and residual risks.
- List touched files, rollback SHA, tested deploy target, known GitHub CI/client-schema limitations, and explicit `RECOMMEND MERGE` / `NO-GO` / `NEEDS E2E`.
- **Separate Human approval** required before merge to main; **separate explicit release/deploy authorization** for production. Do not treat successful staging as authorization.

**Exit / acceptance:** Reviewer-ready signed-off evidence packet for the candidate and an explicit recommendation; any unresolved serious regression blocks promotion. Full real-project E2E remains marked **PENDING_REAL_JOB_VALIDATION**, not fictitiously PASS, consistent with the Human's temporary acceptance.

## Code structure proposal — minimal source changes, no new subsystem

This is a **proposed scope map** to be confirmed by M1 findings, not a pre-approved instruction to create every file. Preserve the existing single Supabase MCP entry point unless a localized extraction materially improves testability. Avoid sweeping 9,000+ line reorganizations, new services or rewritten dispatch rules.

| Path / symbol | Current role | Permitted change if measured | Explicitly out of scope |
|---|---|---|---|
| `supabase/functions/gsa-mcp/index.ts`: `BASE_AGENT_HARNESS`, `ROLE_HARNESSES`, `renderHarness` | Compose role guidance | Targeted deduplication or role-specific load wording with unchanged authority semantics | wholesale role rewrite; changing Human/Advisor/CAS contracts |
| `createServer` instructions, `get_agent_harness`, `get_skill_catalog`, `load_skill` | Host instructions and progressive disclosure | Refine repeated **noncritical** instructions only when context path is verified | removing fallback payloads or invalidating client schema |
| Per-tool `external_steps` and output payload | Guide persistence/readback and next actions | Target only demonstrably redundant/irrelevant prose with adjacent negative tests | dropping SHA, blockers, authority, next steps, evidence refs |
| `test-lab/fixtures/context-efficiency/` | New minimal replay inputs (if absent) | Small synthetic fixtures for each frozen M2 scenario | storing real chat/secret data |
| `test-lab/context-efficiency-metrics.test.cjs` (optional) | New regression/measurement runner | Read-only extraction of pinned fixture measurements; reuse existing TypeScript AST parser/test utilities | launching arbitrary production Jobs or creating a test server |
| `test-lab/results/context-efficiency/` | Compact evidence summaries | Source-SHA-pinned manifests, aggregates and negative results | raw private transcripts or large trace dumps |
| `docs/plans/gsa-context-efficiency/` | Baseline, replay contract, comparison report | `BASELINE.md/json`, `CONTEXT-PATH-MAP.md`, `REPLAY-CONTRACT.md`, `BEFORE-AFTER.md` only as needed | a new Criteria file, a new governance document or a state machine |

**Interface/invariant checklist for every code change:** same MCP tool names/input/output schema unless an explicitly validated additive change; same role rights, admission and Human approval boundary; same actual `NEXT` namespace and SHA/CAS rules; deterministic job/task recovery; exact tool-error reasons and follow-up guidance; isolated Tester and Reviewer; no extra mandatory tool calls. Record before/after for both data shape and model-facing text. A change that passes text-size measurement but alters an interface or prevents normal work is a regression.

**File/change minimization rule:** Prefer one test file plus one source edit for the first candidate. Additional helpers/files only when existing code cannot support reproducible measurement without them. Do not split modules or add a general optimization framework merely for this upgrade.

## Deliverables and Task topology

| Work item | Owner (execution role) | Depends on | Deliverable | Evidence required |
|---|---|---|---|---|
| M1.1 | Planner/Tester | branch base | Source and payload inventory | paths, SHAs, environment |
| M1.2 | Tester/Coder (script only) | M1.1 | Minimal measurement fixtures and report | reproducible output |
| M1.3–M1.4 | Planner + Reviewer | M1.1–M1.2 | Context path map and ranked hypotheses | proof of duplication; keep/remove rationale |
| M2.1 | Tester | M1 | Frozen scenario corpus | original acceptance oracle |
| M2.2–M2.3 | Tester + Planner | M2.1 | baseline replay and thresholds | source-pinned results, definitions |
| M3.1–M3.2 | Coder + independent Tester | M2 | one-at-a-time candidate commits | failed/pass oracle, delta, negative findings |
| M4.1 | Coder + Tester | candidate SHA | deterministic regression + typecheck | executed logs and source SHA |
| M4.2 | Reviewer + Tester | M4.1 | independent behavior comparison | exact scenario results |
| M4.3–M4.4 | Planner / Reviewer | M4.2 | staging verification + release/rollback packet | client schema, staging SHA, Human decision pending |

**One bounded project upgrade, not a new Job for every fixture.** Reuse existing reviewers/Tests; no new gate topology. This milestone mapping intentionally uses the latest Human-facing M1–M4 naming; the older PRELIMINARY document used M0–M4 with a Planner-development M1 and does not govern this updated work.

## Evidence definitions and reporting

For each scenario and source revision record:
`scenario_id`, `source_sha`, `runtime_version`, `environment`, `role`, `MCP action`, `response_character_count`, `response_utf8_bytes`, `schema_utf8_bytes (if visible)`, `estimated_tokens_and_tokenizer`, `tool_calls_total`, `wrong_tool_calls`, `intentional_review_calls`, `retry_calls`, `rework_count`, `MCP_elapsed_ms (if measurable)`, `workflow_elapsed_ms`, `outcome`, `authority_pass`, `evidence_refs`, `limitations`.

**Measurement cautions:**
- Sum payload by actual calls in a complete scenario, not by assuming all independent role harnesses were delivered together.
- Classify `structuredContent` and `content` host usage as UNKNOWN until observed, not double-charged by assumption.
- Use `median` and range/variation for repeated runs; report a missing counter as UNKNOWN, not zero.
- Persist only synthetic input and concise aggregate results; never dump secrets, raw user conversations, private project contents or full host prompts into benchmark artifacts.

## Known starting risks, mitigations and prohibitions

| Risk | Evidence/mitigation | Decision |
|---|---|---|
| ChatGPT old connector tool schema | v55 existing session had stale RETIRE/tester-lab enums; test fresh session separately | no fake client PASS |
| Hosted GitHub runner fails before steps | baseline report documented empty steps and missing logs, but independent Node/Deno PASS | no false source failure/pass |
| Compression loses authority details | exact invariant checklist + negative tests | reject candidate |
| Shrinking payload increases rereads/retries | full-workflow totals, not per-output bytes | reject if net harm |
| Planner model variability | repeat trials; label confidence vs deterministic | unknown if insufficient evidence |
| Main evolves while branch is in progress | compare exact SHA before merges, reconcile approved changes only | no blind force-push |
| Overengineering a small saving | no new service/agent/DB/gate; fixed 1–2 candidate pilot | propose NO-BUILD when appropriate |
| Production Job E2E postponed | sandbox/test-lab tests first; record pending real-Job acceptance | cannot claim full E2E PASS |

## Explicit stop conditions

Stop or narrow the work when (a) no evidence for meaningful safe GSA-owned savings, (b) required invariant would be lost, (c) host measurement is inaccessible and the desired benefit cannot be inferred from an honest proxy, (d) candidate repeatedly increases whole-workflow cost, (e) an architectural rewrite would be required for a small function, or (f) relevant Criteria/scope is materially different from what Human agreed. Escalate only the actual Human decision; offer a simpler/manual approach when appropriate.

## Decisions still open after this detailed plan

- The numeric target and non-inferiority thresholds are intentionally **not guessed**. They must be frozen from actual M1/M2 baseline before M3, without an additional Human gate unless user intent or Criteria changes.
- Exact source patch locations and instrumentation approach follow from M1 observations; no unobserved refactor or obligatory telemetry is authorized.
- This is a **reviewable plan draft**, not an independently reviewed PASS or Human approval to implement. Execution starts only after the already-established planning approval workflow and explicit Human authorization.
