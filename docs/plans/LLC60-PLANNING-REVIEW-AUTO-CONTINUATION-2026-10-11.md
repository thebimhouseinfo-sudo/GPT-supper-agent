# LLC60 — Planner planning-review autonomous continuation (detail plan)

**Date:** 2026-10-11  
**Issue:** #22 — Planner reports stop after review and after plan revision, requiring repeated Human “continue”.  
**Source:** production main `83d11993f2fb6a5df6ee8ae0f7489d27aaa00896`, GSA MCP v46.  
**Scope:** one branch `fix/llc60-planning-review-continuation-20261011`, own repository only; no `main` merge/production deployment without Human authorization.

## Goal and evidence

One Human request for a finite GSA Plan must, when permitted, continue:
`L0/L1 discovery → job_prepare DRAFT → authorized GitHub CREATE/readback → Reviewer PLANNING_REVIEW → Verification CREATE/readback → Job review UPDATE/readback → CHANGES_REQUIRED: Planner revise → Job UPDATE/readback → Reviewer again → PASS: DRAFT→READY UPDATE/readback`.
This is a **same-turn role handoff**, not a background process and not an instruction to execute multiple writes in one unverified transaction.

### Root-cause hypotheses from live source

1. Existing harness and job-planning skill ask for same-turn loop, but `job_prepare`/`job_revise_plan`/`plan_review_record` expose only unstructured `external_steps` instructions (plus `plan_review_record.next_role`). Their return is a **proposal**, not durable progress, and ChatGPT sometimes ends its turn instead of executing prepared instructions.
2. Document and generic Reviewer harness say “fresh chat” for independent review, while planning-review specialist skill explicitly says planning review is **role isolated** and *may occur same chat/turn*. The conflicting language can turn an automatic role switch into needless Human handoff.
3. PASS → READY after `job_transition` has no first-class planning-loop completion handoff; CHANGES_REQUIRED → revised plan has no first-class reviewer routing. Additional loop state is easy to lose between separate calls.
4. No objective evidence yet identifying the first bad commit or quantifying how often the current ChatGPT host stops prematurely. This plan fixes the identified ambiguity without claiming a hosted model can be mechanically forced to issue tool calls.

## CP0 — Root-cause inventory and safety boundary

- Confirm the exact shapes/callers for `job_prepare`, `plan_review_record`, `job_revise_plan`, and `job_transition(READY)`; inspect served Orchestrator/Planner/Reviewer roles, job-planning and planning-review skills, and canonical docs.
- Preserve Reviewer independence: general high-risk source Reviews may require a fresh review context; **planning-review of a Job** uses a separate role reconstruction of the persisted Job, not the Planner's conversation rationale, and may run same chat.
- Do **not** call CR automatically, weaken PASSED review gate, skip GitHub Memory Repo CAS/readback, or fabricate source/Run evidence.

## CP1 — Typed continuation contract in existing MCP tool responses

Implement a small pure `planningLoopContinuationDecision` with deterministic routing, and add its **additive output field** to existing tool responses (no new lifecycle/tool):
- `job_prepare` → after **actual** DRAFT CREATE+readback, `REVIEW_CURRENT_REVISION` / reviewer;
- `job_revise_plan` → after UPDATE+readback, `REVIEW_CURRENT_REVISION` / reviewer;
- `plan_review_record(result=CHANGES_REQUIRED)` → after Verification CREATE + reviewed Job UPDATE/readback, `REVISE_PLAN` / planner;
- `plan_review_record(result=PASS,lifecycle=DRAFT)` → after both authoritative readbacks, `PROMOTE_READY` / orchestrator (then `job_transition`);
- `plan_review_record(result=PASS,lifecycle=IN_PROGRESS,NEXT)` → after readbacks, `RESUME_DISPATCH` / orchestrator (never set READY);
- `plan_review_record(result=HUMAN_REVIEW_REQUIRED)` → after evidence readback `STOP_HUMAN_DECISION` / human with concrete finding;
- `plan_review_record(result=BLOCKED)` → after evidence readback `STOP_BLOCKED` / orchestrator with blocker;
- `job_transition(target_lifecycle=READY)` → after UPDATE/readback `CONTINUE_JOB_TOPOLOGY` / orchestrator.

The contract is **advisory and pending persistence** by design: `state=AWAITING_DURABLE_READBACK`, `next_action_after_readback`, `next_role`, `resume_same_turn`, `requires_readback`, `planning_revision`, `human_action_required`, `mutation_authorized=false`. Tool returns must not be interpreted as persisted. `external_steps` still specify the actual CAS and record checks; no extra reads on routine paths.

## CP2 — Remove conflicting Planner/Reviewer handoff semantics

- Update served base + Orchestrator + Planner + Reviewer harness and `job-planning`/`planning-review` skills to require **complete same-turn traversal** of the typed continuation after authorized external writes; never stop after a prepared tool result; evidence reads must precede follow-up.
- Clarify fresh-chat independence requirement applies to independent source/code reviews where mandated, **not** to role-isolated planning review.
- Ensure no repeat Reviewer cycle on the same unchanged `planning_revision`, no repeated prepare/persist of duplicate `PLANNING_REVIEW` Verification on lost response: read and reconcile first.
- Limit stalled attempts with existing progress fingerprint/retry protections. Different reviewed plan revisions may continue; no unconditional hard cap that converts real progress to Human gate.
- Update canonical `AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md`, and `skills/gsa-job-runtime/SKILL.md`. No new daemon or cross-Project writes.

## CP3 — Test and Reviewer checkpoint

- Add exact served-source tests that load the routing helper from `index.ts`, cover **all** transitions above and rejected unexpected stage. Assert `mutation_authorized=false` and persistence-needed; no phantom READY from PASS without a Job update.
- Include negative mutation control: removing/reversing CHANGES_REQUIRED→REVISE or PASS→PROMOTE causes RED.
- Add served harness and skill checks with a real conflict guard: same-turn planning-review can work without a new chat while independent code review still retains separate-context constraint.
- Run all existing Node tests with new LLC60 suite, `deno check`, and independently review changed tests and source contracts. If hosted runner is unallocated, use authorized source-bound sandbox, never call hosted CI PASS.

## CP4 — Release and real acceptance (separate Human decision)

- PR review and no merge until explicit Human approval. After merge, deploy Supabase `gsa-mcp`, exact-source readback and query served new contract/harness.
- Real GSA Job: produce DRAFT, Reviewer CHANGES_REQUIRED twice, Planner repairs twice, Reviewer PASS, READY readback — **one initial Human prompt**; terminal user response only when READY, genuine Human choice, denied write or concrete blocker.
- Also validate NEXT IN_PROGRESS superseding review remains IN_PROGRESS and Human Review returns precise decision.
- Record number of unnecessary Human “continue” turns (target 0). Static prompt tests alone are **not** proof of ChatGPT same-turn execution.

**Latency:** one small deterministic response object, no extra network roundtrip per tool call. Normal planning roundtrips already mandated by durable persistence. Do not add workflow polling.
