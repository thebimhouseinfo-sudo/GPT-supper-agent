# LLC60 — Planner planning-review loop stops after review/revision

**Date:** 2026-10-11  
**ID:** LLC60 / `LLC-GSA-PLANNING-REVIEW-SAME-TURN-20261011`  
**Issue:** [#22](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/issues/22)  
**Origin:** Human report during real GSA use.  
**State:** `CANDIDATE / IMPLEMENTED_IN_BRANCH / REAL_PROJECT_ACCEPTANCE_PENDING`  
**Work branch:** `fix/llc60-planning-review-continuation-20261011`

## 1. Original user-observed problem

> "planner không tự active review loop mà lazy, review xong dừng, sửa xong dừng. không tự thực hiện loop"

When a plan review finishes, the Planner often reports a status and stops rather than autonomously repairing actionable Reviewer findings. After editing the Plan it stops again rather than automatically calling the Reviewer. Each restart requires another Human “tiếp tục”, increasing turnaround and obscuring readiness.

This is a **same-turn orchestration regression**. Source-level contract weakness is observed; the original bad introducing commit and exact frequency across real Projects are not established.

## 2. Directly verified implementation facts (production v46 baseline)

- `job_prepare` prepares a DRAFT Job record plus an `external_steps` array telling ChatGPT to persist and review it; it cannot itself write the external Memory Repo.
- `plan_review_record` returns `next_role` and prose instructions for PASS / CHANGES_REQUIRED / HUMAN_REVIEW_REQUIRED / BLOCKED. Both Verification CREATE and reviewed Job UPDATE need external GitHub CAS/readback before further progression.
- `job_revise_plan` prepares the next planning_revision; its external instructions say to call Reviewer again, but there is no typed next action.
- `job_transition` prepares the READY write without a planning-loop continuation contract.
- Served `job-planning` and Orchestrator harness already require same-turn planning review. But canonical reviewer text says fresh chat for review, while served `planning-review` skill explicitly says planning review is role-isolated **within the same turn** without a fresh Human chat.
- Therefore remediation should strengthen routing/readback, not add another Job state machine, polling daemon, duplicate Planner role or automatic Human-only CR.

## 3. Reusable candidate requirement

For one active, authorized GSA planning request:
1. `DRAFT created/persisted` → independent role-isolated `PLANNING_REVIEW` without asking Human to invoke Reviewer.
2. `CHANGES_REQUIRED` → persist review and reviewed Job; Planner fixes concrete findings in **same user turn**, increments planning_revision, writes and reads back exact SHA, then invokes Reviewer again.
3. `PASS` → persist Verification + reviewed Job; for DRAFT promote READY and confirm readback, for NEXT IN_PROGRESS resume dispatch without assigning DRAFT/READY semantics.
4. `HUMAN_REVIEW_REQUIRED` → stop for one actual material Human decision; `BLOCKED` → stop with exact blocker. A prepared tool result/review verdict/plan edit is **not** a terminal outcome.
5. Preserve source/code independent Reviewer context isolation. Planning-review is **role-isolated** by reconstructing from persisted Job and source evidence; it is not a reason to demand a fresh Human chat.
6. Respect configured Memory Repo scope and exact SHA CAS/readback; never treat structured `continuation` as mutation authority, never repeat stale/duplicate reviews blindly, and use bounded existing no-progress guards.
7. Do not add routine-tool polling or a background worker. No unconditional Reviewer after every code Task.

## 4. Implemented-in-branch delta and testing

- Added `planningLoopContinuationDecision` pure deterministic policy and additive `continuation` outputs to `job_prepare`, `plan_review_record`, `job_revise_plan`, and `job_transition(READY)`.
- Each continuation has `state=AWAITING_DURABLE_READBACK`, exact intended next action, role, current revision, `mutation_authorized=false`, and explicit Human Gate classification. It never claims the Memory Repo write has occurred.
- Updated the served Orchestrator/Planner/Reviewer harness and `job-planning`/`planning-review` skills, the Job runtime skill, and the architecture docs to remove fresh-chat ambiguity and prohibit unnecessary intermediate stop.
- Source-derived suite exercises routing across **two successive plan revisions** and PASS→READY, NEXT IN_PROGRESS, Human/blocked stop, negative mutation; status checks are **MODEL_ONLY**.
- Sandboxed exact-source Node suite: **66/66 PASS**, 0 skipped/failed; `npx deno@2.5.6 check supabase/functions/gsa-mcp/index.ts`: PASS at source blob `be63374d0d279958d432afa82f7f94327c1f4c2e`. This is not live GSA behavioral proof.

## 5. Closure and safety boundary

Independent code/test review, PR approval, actual production deployment/readback, and a real scoped GSA Job with repeated CHANGES_REQUIRED→Planner→Reviewer→PASS→READY **in one Human turn** remain required. Preserve classification as CANDIDATE until that evidence exists. Never mark the issue resolved from tests that only check a returned continuation contract.
