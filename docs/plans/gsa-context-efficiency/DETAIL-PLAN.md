# GSA Context Efficiency — Detailed Refactor Plan

## GOAL

Reduce unnecessary **GSA-controlled** model-facing context while preserving or improving real Job completion quality, speed and reliability. Measure full-workflow consequences rather than declaring success from shorter text alone. Preserve existing governance, explicit Human authority, safe tool use, role independence and durable recovery. Do not claim control of the ChatGPT Web history/context window.

**Status:** REVISED FOR RL REVIEW — detailed planning only, not approval to modify runtime.
**Date:** 2026-10-24.
**Development branch:** `upgrade/gsa-context-efficiency`.
**Base of branch:** `main` commit `2ae052b57241bb845234235767b3dcb767030c70`.
**Baseline production:** Supabase `gsa-mcp` v55 (source artifact previously independently verified).
**Source truth:** `thebimhouseinfo-sudo/GPT-supper-agent`; do not integrate to or deploy from `main` during research.
**References:**
- **Canonical approved Criteria:** `thebimhouseinfo-sudo/GSA-Projects/projects/01a0f051-4353-7bff-8edf-46be4b44fd2f/CRITERIA.md` @ blob `ff45d47435ae6cc9ae4acd5106bf945308fb4f95` (APPROVED 2026-10-21; in particular research-first B1–B3 and existing bug-intake C).
- `docs/plans/planner-evidence-context-efficiency/CRITERIA-DRAFT.md` (old feature-level source proposal, historical reference ONLY)
- `docs/plans/planner-evidence-context-efficiency/PLAN-PRELIMINARY.md` (older preliminary plan)
- `docs/maintenance/MAIN-PRE-REFACTOR-READINESS-2026-10-23.md` (v55 readiness evidence)
- `docs/architecture/AGENT-HARNESSES.md`, `PROJECT-MEMORY.md`, `test-lab/README.md`

### Scope and authority

- This is the **Context Efficiency B** work package under the already APPROVED bounded Project Criteria (A/B/C), not a replacement of A/C or of the canonical reviewed Project Plan. Planner critical-challenge (A) is **already present** in v55 and is regression coverage, not a feature to rebuild. Existing defect intake/repairs (C) retain their own owners/evidence; any newly reported real GSA bug is triaged via the existing P0/Criteria-C mechanism rather than silently lost or folded into this context experiment. No changes to approved WHAT/WHY.
- Human's acceptance that verification on a real GSA Job may occur later permits this bounded research and planning; it **does not** count as passing that future E2E test or as approval to merge or deploy.
- Human selected source branch `upgrade/gsa-context-efficiency` for this new context refactor. **Project Memory still declares** `upgrade/planner-evidence-context-efficiency` as the global Development Branch (PROJECT.md blob `14c3ea6562c78762f80d6ed16fb313b5474301e3`) and the existing approved Project Plan and Jobs have historical branch references. Do not silently switch other live Jobs by mutating the global branch policy. Before dispatching any context source-write Run, reconcile the existing GSA Project Memory branch binding and owning Job branch/scope against the Human branch decision and live Job state using the existing governance/administrator procedure; exact SHA readback required. Until reconciled, the new branch is a confirmed **Git ref / intended scoped target**, not yet a confirmed GSA dispatcher target. No Super Power or new plugin registration.
- No separate product-development gate, no new persistent context service, no ChatGPT Web `clear` command, no extra Criteria file, no per-test Job proliferation, no automatic CR. Reuse existing Planner→Reviewer and Tester flows, the existing canonical Project Plan **J-94B4** and Context research Job **J-02E2** (READY in `WORK/CURRENT_EXECUTION_ORDER.md`) and current Test Lab. This document is a detailed HOW annex for the same context-efficiency work, **not a duplicate Project Plan/Job**; consult live Job/Run revisions instead of assuming the historical states remain current.
- An existing approved Criteria revision remains the project's authority for WHAT/WHY. The feature-level DRAFT is a planning reference and is **not** retroactively marked approved. If actual implementation demands a **material new WHAT/WHY**, route that decision through the existing Human+Advisor Criteria process; ordinary HOW/benchmark planning must not activate Advisor.
- Source edits, production merge and deploy require their normal explicit Human authorizations. This document alone grants none.

### Phase structure and dependency

`M1 Read-only audit + rough savings estimates + GO/NARROW/STOP` → (only if research supports measurement) `M2 Minimal benchmark + reproducible baseline/replay` → (only if measured net value justifies implementation) `M3 Small, isolated optimizations` → `M4 Independent regression, staging & release packet`. **No benchmark code before M1's value checkpoint** (Criteria B3). If M1 recommends STOP, the B research objective is complete without creating M2/M3 code; no new M0/Bootstrap gate.

## Phase M1 — Read-only context audit and net-value decision

### GOAL
Before writing any new benchmark tool, establish an evidenced, bounded estimate of where GSA-owned payload can be reduced and decide GO / NARROW / STOP under approved Criteria B1–B3.

**M1.1 Pin identities and measurement scope (read-only).**
- Record branch HEAD, production build/version, active plugin/client-schema status, runtime SHA and instrumentation/environment identity in a baseline manifest.
- Capture `get_agent_harness` for Planner, Coder, Reviewer and Tester as **separate observations** (independent role requests are not necessarily duplicated inside one Job).
- Capture `get_skill_catalog`, one `load_skill` each for a common and a task-only skill, plus representative tool outputs containing `external_steps`.
- Inventory MCP server instructions, tool descriptions/schema metadata, `BASE_AGENT_HARNESS`, `ROLE_HARNESSES`, `renderHarness`, `ROLE_SKILLS`, `ROLE_HOST_SKILLS`, and the per-tool response envelopes. For claims about what the model actually sees, distinguish source declaration, MCP server response and ChatGPT host-visible context.

**M1.2 Read-only context-path and authority analysis.**
- Use existing source, tool responses and repository artifacts to build a `source → transport → caller/role → observed downstream need` map, not a new measurement script.
- Classify duplicate text as intentional repetition across independent Roles, same-response duplication, tool-boundary mandatory repetition, or potentially removable duplication.
- Never infer actual host tokens from source or byte counts; check whether `structuredContent` and `content` are both consumed by ChatGPT only if an allowed observation exists. Otherwise mark UNKNOWN and preserve compatibility.
- Map each removable candidate to the surviving reliable delivery point and its role/safety/authority constraints.

**M1.3 Estimate value and cost for every candidate (Criteria B2).**
- Using **already available observations only**, record a rough range for baseline volume, plausibly removable bytes/chars, workload frequency, estimated workflow benefit, uncertainty, implementation/test effort and risks to tool calls, rereads, role isolation and safety.
- Mark unobservable values UNKNOWN; state the exact assumptions and whether a candidate reduces only an infrequently requested payload.
- Rank hypotheses by plausible **NET workflow value**, not just shortening a large block.

**M1.4 Evidence-based value/feasibility checkpoint BEFORE any benchmark code (Criteria B3).**
- Planner and Reviewer document `PROCEED`, `NARROW` or `STOP / NO-BUILD` based on M1.1–M1.3 evidence, with a brief explanation for each candidate. This is an existing research decision within the plan, **not a new Human approval gate**.
- Store a small `M1-READONLY-AUDIT.md` and optional aggregate figures. Do **not** create `test-lab/context-efficiency-metrics.test.cjs`, new fixtures/instrumentation, or runtime code before this decision.
- If STOP, deliver the finding as valid Criteria-B research completion. If PROCEED/NARROW, specify only the smallest benchmark required and which signals remain UNKNOWN.

**Exit / acceptance:** Exact source-pinned read-only audit, per-candidate bounded estimates including frequency, effort and safety, GO/NARROW/STOP decision prior to any new benchmark tool. A justified NO-BUILD is PASS for M1; runtime unmodified.

## Phase M2 — Minimal benchmark and controlled replay (conditional on M1 PROCEED/NARROW)

### GOAL
Only after the research value checkpoint, build the smallest justified reusable measurement/replay capability and freeze full-workflow quality/cost acceptance rules before optimizing runtime.

**M2.1 Implement only the minimum benchmark capability justified by M1 and define scenario corpus (Tester-authored independently of the optimization).**
- **Precondition:** recorded M1 PROCEED/NARROW decision; otherwise this phase is NOT REQUIRED rather than failed.
- If existing Test Lab scripts, source inspection and tool outputs can reproduce metrics, reuse them directly. Only if necessary, add small synthetic fixtures and a test-only read-only metric script under `test-lab/`, with a deterministic test for its behavior.
- Pin exact source revision, environment, metric units, tokenizer estimate (if used) and reproducibility method; do not add a telemetry service or take production Job actions.

**M2.1 scenario corpus:**
Minimum scenario classes, with exact initial state, input, expected next action, expected authority and result evidence:
1. **Short Q&A / project status**: one concise, correct response without full Job/harness loading or invented gate.
2. **Planner critical challenge**: scoped CONFIRMED POSSIBLE / CONFIRMED IMPOSSIBLE / UNKNOWN and the known ineffective `gsa/clear` proposal; do not activate Advisor.
3. **Brownfield Bootstrap**: reuse approved Criteria/Plan/Milestones/skills without duplicating records or triggering Advisor; classify true missing evidence accurately.
4. **Planner → independent Reviewer**: maintain GOAL anchors, revision binding, automatic bounded review/repair within approved planning, and Human execution approval boundary.
5. **NEXT Job / Tester evidence**: dispatch skill selection, test readiness, role separation and exact evidence / CAS / branch protections.
6. **LLC58 plan change**: both REPLACE and RETIRE, exact-SHA fence, no successor for RETIRE, pending cursor/active Run block; no new Run for retired Job/Task.
7. **STOPCHAT / recovery**: minimal durable handoff with exact re-read and no fabrication or automatic background resumption.

Use lightweight deterministic fixtures for structural/security checks. Model-mediated checks (e.g. planner reasoning) may use 3 or more runs per case as capability/budget allows. Distinguish deterministic from sample-based outcomes.

**M2.2 Establish baseline replay on existing runtime before any optimization.**
- Replay same fixtures on pinned unoptimized source/connection surface; record tool order, response bytes, all tool calls (including retries/rereads), elapsed latency and final result.
- Track `wrong-tool` calls against a scenario-owned expected-tool oracle; record whether incorrect tool choice changed work or just added an unnecessary call.
- Track `rework` as failed validation, additional correction loop or repeated step caused by missing/misread context; do not penalize intentional mandatory Reviewer/Tester steps.
- Isolate TEST_LAB vs PRODUCTION memory and use non-destructive tools unless an explicitly authorized isolated Job test exists.

**M2.3 Freeze candidate rules before experimentation.**
- Record measurement formulas, scenario IDs, baseline SHA, acceptable variance and numeric feasibility target in `REPLAY-CONTRACT.md` **after baseline, before M3 candidates**.
- Mandatory invariants: zero observed authorization/branch/Criteria/Advisor/CAS/role-isolation regressions; no dropped mandatory identifier, error reason, blocker, readback instruction or verification reference; no model response falsely treating UNKNOWN as impossible.
- Success requires a demonstrated reduction of at least one targeted GSA-controlled payload, correct task outcomes, and **no material increase in end-to-end calls/retries/rework/latency** under the frozen comparison rule. The quantitative target and non-inferiority tolerances must be set from M1/M2 evidence, not reverse-engineered after results.
- If host token billing/input counters are unavailable, use byte/estimated-token results only as proxies and label them.

**Exit / acceptance:** When M1 authorized measurement on evidence, a repeatable original-source replay, Tester-owned locked fixture/oracles and frozen threshold/evidence contract. If replay cannot be reliably run, report UNVERIFIED and do not claim workflow-quality PASS; full production Job E2E can remain PENDING as the Human permitted, and is **not** misreported as performed.

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
- The current `.github/workflows/gsa-next-logic.yml` enumerates test files explicitly; a new context test **does not run in CI merely because it exists under `test-lab/`**. Before declaring test coverage, invoke the new test explicitly in the independent runner and update the workflow's file list and PR path filter **only if** a context test actually gets added. Verify test discovery and source SHA, not just workflow existence.
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
| M1.1 | Planner/Tester | branch base | Read-only source and context-surface inventory | paths, SHAs, environment |
| M1.2 | Planner + Reviewer | M1.1 | Read-only context path + authority map | intentional vs removable duplication |
| M1.3–M1.4 | Planner + Reviewer | M1.1–M1.2 | Per-candidate rough ranges and PROCEED/NARROW/STOP | frequency, savings, uncertainty, effort, risk; **NO benchmark code yet** |
| M2.1 | Tester/Coder (test-only if needed) | M1 PROCEED/NARROW | Minimal benchmark + frozen scenario corpus | reproducible measurement and oracle |
| M2.2–M2.3 | Tester + Planner | M2.1 | baseline replay and thresholds | source-pinned results, definitions |
| M3.1–M3.2 | Coder + independent Tester | M2 | one-at-a-time candidate commits | failed/pass oracle, delta, negative findings |
| M4.1 | Coder + Tester | candidate SHA | deterministic regression + typecheck | executed logs and source SHA |
| M4.2 | Reviewer + Tester | M4.1 | independent behavior comparison | exact scenario results |
| M4.3–M4.4 | Planner / Reviewer | M4.2 | staging verification + release/rollback packet | client schema, staging SHA, Human decision pending |

**One existing bounded workstream (J-02E2 research), not a new Job for every fixture.** Reuse existing canonical J-94B4 and approved Jobs/reviewers/tests. A future implementation/optimization step must be reconciled with the reviewed topology rather than inventing duplicate Jobs or assuming existing READY research Job automatically authorizes code changes; no new gate topology. This milestone mapping intentionally uses the latest Human-facing M1–M4 naming; the older PRELIMINARY document used M0–M4 with a Planner-development M1 and does not govern this updated work.

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

- Numeric target and non-inferiority thresholds are intentionally **not guessed**. First M1 must decide if measurement is justified at all, then M2 must freeze baseline/thresholds before M3. No additional Human gate unless user intent or Criteria changes.
- Exact source patch locations and instrumentation approach follow from M1 observations; no unobserved refactor or obligatory telemetry is authorized.
- This is a **reviewable plan draft**, not an independently reviewed PASS or Human approval to implement. Execution starts only after the already-established planning approval workflow and explicit Human authorization.
