# Preliminary Plan — Planner Evidence & GSA Context Efficiency

Status: PRELIMINARY / NOT REVIEWED / NOT APPROVED
Date: 2026-10-21
Working branch: upgrade/planner-evidence-context-efficiency
Base main commit: 13cab1023d4db993c08394977961e85c5f902fce
Criteria proposal: CRITERIA-DRAFT.md (DRAFT, not canonical approved Project Criteria)

## GOAL

Develop and verify a small GSA upgrade that makes the default Planner challenge unsupported user-proposed implementations with evidence and accurate certainty, and reduces **GSA-owned** context payload without weakening execution quality, authorization, safety or role contracts.

This plan is directional. The precise code files/patch scope and numerical optimization target are intentionally not fixed before baseline evidence and Criteria approval.

## Phase 0 — Baseline and design audit (read-only)

### GOAL
Identify the currently effective context-loading paths, the biggest reproducible GSA payload costs, and existing Planner behavior tests before committing to implementation details.

Candidate tasks:
- Capture the current branch/main SHA, deployed production/staging identity and observed get_agent_harness outputs (Planner, Coder, Reviewer, Tester) using a controlled baseline.
- Inventory duplicated semantics among MCP server instructions, shared/role harnesses, suggested/required skills, tool descriptions and selected external_steps outputs.
- Trace actual usage of get_agent_harness, get_skill_catalog, load_skill, and role/task context injection. Distinguish intentional independent role loading from accidental redundancy.
- Check which metrics are accessible server-side or via test client (length, UTF-8 bytes, duration, tool calls, optional tokenizer estimates); explicitly mark host model token usage unavailable unless confirmed.
- Find current deterministic regressions and Test Lab fixtures; define the minimum test matrix and evidence artifacts.

Deliverable: BASELINE/ASSESSMENT with pinned source revision, payload breakdown, candidate savings ranked by risk, capability gaps, and a recommendation to proceed/narrow/stop.
Exit: Measurements reproducible and no invented claim about ChatGPT Web tokens.

## Phase 1 — Planner evidence contract (implementation direction only)

### GOAL
Improve Planner's pre-solution judgement without new Human gates or unwanted verbosity.

Candidate tasks:
- Add scoped three-way classification: CONFIRMED POSSIBLE / CONFIRMED IMPOSSIBLE / UNKNOWN; require proportional verifiable evidence.
- Clarify distinction between possible-in-principle and available-to-the-current-GSA architecture; label inference and untested claims honestly.
- Add explicit challenge to the user's solution when it does not achieve their goal, with a recommendation not to build when appropriate.
- Keep ordinary short answers short, avoid repetitive triage labels, preserve Advisor trigger and existing bootstrap/approval.
- Add positive, negative and ambiguous behavioral cases including ChatGPT Web gsa/clear counterexample.

Expected surfaces after audit: Planner role harness and any minimal shared startup guidance needed for actual Planner entry paths. No automatic editing outside reviewed scope.
Exit: Behavioral test matrix passes with attributable evidence; no Advisor misactivation or plan/approval bypass.

## Phase 2 — GSA payload slimming (implementation direction only)

### GOAL
Reduce verified redundant GSA payload while preserving complete operational contract on each relevant tool/role execution.

Candidate tasks:
- Consolidate genuinely duplicated wording in shared and role harnesses without deleting applicable safety/authority requirements.
- Prefer role-scoped instructions over sending unrelated role-specific detail.
- Verify existing lazy skill loading and required-skill injection behavior; optimize only observed unnecessary loads.
- Inspect large tool descriptions / repetitive external_steps only when baseline shows value; preserve exact action instructions for CAS, readback, verification and resumability.
- Retain interoperable MCP structured/text response behavior unless an explicit client contract and empirical proof justify a change.

Candidate measurement: response size before/after by role, skill and representative tool; approximate tokens with labeled tokenizer assumptions; regression outcomes. Do not present changes in GSA payload as confirmed ChatGPT Web input token savings.
Exit: Demonstrated payload reduction on selected paths and passing contract/behavior tests. No mandatory percentage reduction is precommitted.

## Phase 3 — Controlled validation and correction

### GOAL
Prove smaller payload did not silently weaken decision quality or GSA workflow.

Candidate tasks:
- Execute pinned baseline and candidate scenarios on the same fixtures, with relevant repeated model-mediated trials.
- Exercise Planner→Reviewer and Coder/Tester role isolation, Criteria/Advisor approval triggers, branch/scope authorization, durable CAS/readback and recovery paths.
- Record PASS / FAIL / BLOCKED / UNKNOWN / UNVERIFIED accurately, plus source SHA, environment, limitations and evidence refs.
- If regression or uncertainty is found, either repair within approved scope or revert/narrow the optimization.

Exit: A reviewable BEFORE/AFTER report distinguishes measured server/tool payload savings from unavailable host-model metrics, plus an explicit residual-risk ledger.

## Phase 4 — Staging readiness and separate release decision

### GOAL
Provide a verified, reviewable candidate without accidental production cutover.

Candidate tasks:
- Apply approved changes only to the new development branch.
- Run applicable automated tests and required independent Reviewer review.
- If explicitly authorized and supported, test on isolated GSA staging against the exact commit; do not confuse staging evidence with production PASS.
- Prepare release evidence, rollback reference and exact proposed merge/deploy target for Human approval.

Exit: Human-visible review packet. A separate Human authorization remains required for merge into main and for production deployment.

## Milestone sketch (tentative; not locked)

| ID | Milestone | Dependencies | Evidence / preliminary acceptance |
|---|---|---|---|
| M0 | Baseline and Context Audit | Criteria draft reviewed/approved by established process before implementation | Pinned baseline + scoped risks + test matrix |
| M1 | Planner contract | M0 + approved detailed plan | Three-state evidence classification and challenge cases pass |
| M2 | Context payload optimization | M0 + approved detailed plan | Measured GSA payload decrease, no critical contract loss |
| M3 | Behavioral and regression validation | M1/M2 | Reproducible before/after data; no known governance regression |
| M4 | Staging candidate / release decision | M3 + appropriate authorizations | Staging evidence and explicit Human merge/deploy decision |

M1 and M2 may be developed independently after M0; merge/order and exact tasks are determined by baseline. This is not a reviewed GSA Job topology, execution approval, or evidence-gate satisfaction.

## Minimal benchmark concept (reuse Test Lab)

One compact test set, no new service or telemetry database. Input: role/scenario/branch SHA. Output: fixture name, GSA tool action, characters and bytes, tokenizer estimate if configured, tool-call count, MCP server duration if instrumented, user-facing expected behavior, actual behavioral judgement, evidence refs, version/limitations.

Compare:
- Baseline code/release identity versus candidate SHA.
- Planner answers for confirmed feasibility, bounded impossibility, honest unknown and bad feature suggestion.
- get_agent_harness across Planner/Coder/Reviewer/Tester, requested skills and one or two high-value tool responses.
- Behavior and approval/regression controls against optimization.

Never persist raw private user chats, secrets or full private project source just for benchmarking; use synthetic fixtures and stable evidence references.

## Risks and stop conditions

- Overcompression causes missing branch/authorization/verification constraints: fail test, revert or restore required text.
- Incorrect label “IMPOSSIBLE” for unverified client capability: fail Planner test.
- Context shrinking induces more rereads/calls/retries: record full-workflow cost, not just single response size.
- Tool compatibility assumption about structuredContent and content not verified: do not change the response envelope.
- Host ChatGPT token usage inaccessible: report unknown, do not claim estimated numbers are observed.
- Other approved project work on main evolves: rebase/reconcile deliberately; no automatic overwrite.
- Advisor/Human Criteria gate not satisfied: no implementation authorization.

## Source and change boundaries

Likely implementation entry: supabase/functions/gsa-mcp/index.ts.
Likely documentation entry: docs/architecture/AGENT-HARNESSES.md.
Existing experiment area: test-lab/.
Exact affected files, test locations and whether runtime instrumentation is necessary remain to be established by M0.

No runtime edit, workflow mutation, merge, or deployment is authorized by this preliminary plan.
