# GSA4 / CX-04 — Source-grounded feasibility decision (NO_BUILD)
Date: 2026-11-04. Target: `thebimhouseinfo-sudo/GPT-supper-agent`, canonical development branch `upgrade/gsa-context-efficiency`.

## GOAL
Determine whether a trustworthy Role/Task/Phase scoped context selector can safely reduce **model-delivered** GSA guidance without removing any mandatory authority rule, creating a new scope registry, or trusting fake metadata. If not, preserve GSA3 and document the minimum verified prerequisite for a future GSA4 candidate.

## Pinned evidence
- Baseline GSA3 source: `3cd9dabeba509263af6a60647c0c5a0b55196143`. GSA3 main release PR #37: merge commit `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`, production `gsa-mcp` v58 ACTIVE, 29 source files.
- Design contract: `DETAIL-PLAN.md` CX-04 and R04-1/2/3; `TECHNICAL-DETAIL-PROPOSAL.md` Section E. They **explicitly require NO_BUILD** unless real trusted Task/Phase facts reach an actual consumer. Role-only or self-declared metadata is not enough.
- `supabase/functions/gsa-mcp/harness-skill-tools.ts`, `get_agent_harness`: input is **only** `role` and `mode`; `renderHarness(role,{includeProgressiveSkills:false})` is already role-scoped. There is no `task_id`, `phase`, current Run snapshot, Job reference or verified lifecycle in this tool handler or its supplied deps. `get_skill_catalog` returns names/descriptions only and `load_skill` loads a named body on demand. All are already progressive.
- `supabase/functions/gsa-mcp/run-execution-tools.ts`, `run_begin`: accepts `primary_task_id`, `affected_task_refs`, `job_record_text`, `job_record_sha`, `planning_revision`, and validates tasks against the provided owning Job; `resolveRequiredTaskSkills` then injects `required_skill_contexts` for those Task IDs. `run_begin` returns `run_record_text` and external Git/Memory exact-SHA readback steps. **It does not automatically feed those checked scope facts to `get_agent_harness`.** A prepared Run is not a persisted/authenticated Run until caller follows CREATE/readback.
- Phase information is in Job planning context, not an independently verified `get_agent_harness` input. The current role/mode call cannot distinguish a verified active Task or stale/untrusted source revision.
- A new free-form `task_kind`/`phase` parameter with `verified=true` or a caller-supplied SHA string would be *self-asserted*, not authoritative; suppressing guidance on that basis could compromise Coder, Reviewer independence, Tester simulated/host boundary or the Human Gate.
- The only currently evidenced selection at dispatch is `run_begin`'s **existing** required Task skill injection; treating that existing capability as GSA4 optimization would fabricate new savings and possibly add redundant calls.

## Decision
**CX-04 = NO_BUILD (current source)**. No production/domain TypeScript, skill or MCP schema edits are justified. In particular:
- Do not change `get_agent_harness` to accept self-declared Task/Phase data.
- Do not remove mandatory shared/role authority instructions, omit Reviewer/Tester rules, or assume Direct Agent and JOB share trusted runtime context.
- Do not add another registry, persistent context DB, new agent role, second approval step or speculative selector file.
- Do not count current role-scoped `renderHarness` or existing Task skill resolution as new GSA4 gains.
- **No GSA4 runner revision exists**, so a GSA3-vs-GSA4 timed Direct Agent comparison would measure two identical effective harnesses and is **INVALID**. Do not create premature two-branch M-04 code competition or claim efficiency gain. Source-only read/CI proof is not actual ChatGPT host token telemetry.

## What would unlock an eligible GSA4 experiment
R04-1 must establish, without trusting caller flags:
1. An actually exercised **single source of truth** for persisted active Run + owning Job, including project, `job_id`, `run_id`, role, planning revision, Task IDs and Phase, verified by independent GitHub Memory readback/exact SHA and allowed scope.
2. A real consumer/transport that safely joins those verified facts to `get_agent_harness` on the **same** request/Run; reject stale/mismatched/non-persisted snapshots and fail open to the **complete** current role harness when scope is missing.
3. An observed, recurring model-facing payload redundancy to remove, after accounting for verification tool calls, redirects/extra reads and text fallback `content` vs `structuredContent`.
4. Reviewer-isolation/Tester simulate, Planner/Coder/Direct Agent, stale metadata/auth negative tests, exact fallback/schema compatibility, CI and matched workload evidence. Prefer a minimal pure selector only when these are met; run M-04 paired job on two same-base branches after a real GSA4 candidate source SHA exists.

## Functional workload sequencing
Next substantive feature Job is **U-D — Descriptive Pre-Code + final CR** (UD-01/02/03, BP-05/BP-06), after Coder engineering context U-C is integrated. The selected U-C GSA3 source on `experiment/gsa3-m03-uc-candidate` (`1907e9bc3c697c966b92373a6fc5dacd181080ba`, draft PR #38) remains **UNMERGED** under Human's explicit winner-only-retention rule. It must not be silently merged or cherry-picked to make U-D tests appear ready. The independent U-B code winner (`experiment/gsa2-m02-ub-candidate`, PR #34) likewise remains unmerged.

## Evidence and limitations
Source-grounded capability decision only, **not** a runtime benchmark. GSA3 v58 release is separately verified. GSA4 Task/Phase selector and practical host benefit: NOT IMPLEMENTED / NO_BUILD; no claim of improved model tokens, workload speed or production equivalence. Reassess only after an actual trusted Run→Harness path is implemented/observed or requirements explicitly change.
