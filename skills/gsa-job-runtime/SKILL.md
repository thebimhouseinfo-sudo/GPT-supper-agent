---
name: gsa-job-runtime
description: Run durable GPT Super Agent Jobs through role harnesses, append-preserving evidence and handoffs.
---

# GSA Job Runtime

## Purpose

This skill is the operational bridge from durable Project Memory to actual specialist reasoning.

The runtime model is:

```text
Project
→ finite Job
→ Task topology
→ attributed Run
→ role harness loop
→ Verification / Handoff
→ terminal Run
```

MCP tools provide deterministic IDs, record shapes, state guards and persistence instructions.
ChatGPT performs reasoning inside the selected role harness.
GitHub source repositories remain source truth.
The configured private Memory Repo remains the durable control plane.

## Harness loading

Before executing any durable role Run:

1. resolve the active Project and Job;
2. call `get_agent_harness(role, mode=JOB)`;
3. treat returned `harness_text` as the runtime role contract;
4. load only minimum sufficient Project/Job/source context;
5. begin the attributed Run with `run_begin`.

Do not rely on remembered role behavior when the harness can be loaded.

## Shared Agent intake (before role work)

**NO REASONING** during Project bootstrap: execute only prescribed minimal steps to READY. On new User messages, keep the active receiving Agent; use Planner by default only when none exists. **LOW REASONING**: classify question/action, answer questions, clarify missing material decisions without speculative alternatives, and draft a thin skeleton for new/changed work. User agreement on the skeleton permits **FULL REASONING** detailed planning and the autonomous review/repair loop, not implementation. At PASS present the reviewed plan and ask for explicit Human execution approval; until then stay in discussion. An explicit user instruction such as "bắt đầu sửa code", "làm đi", "đồng ý làm" counts only in the matching plan-approval context, not as blanket permission. Handoff only when capability differs. Keep Direct Agent shortcuts and existing Project scope checks.

## Planner loop

```text
L0 orientation
→ L1 decision context
→ brownfield relationship + logic review
→ define finite objective/scope/non-goals
→ decompose Objective → Phase → Task → Job Pack → Milestone
→ size the Job and declare its context boundary
→ define dependencies/topology
→ place review/test/human gates
→ define completion/evidence requirements
→ consistency + sizing review
→ job_prepare → authorized DRAFT CREATE + SHA readback
→ role-isolated planning Reviewer in SAME USER TURN (no new Human chat)
→ PLANNING_REVIEW Verification CREATE/readback, reviewed Job UPDATE/readback
   ├─ CHANGES_REQUIRED → Planner job_revise_plan → SHA readback → Reviewer again
   ├─ PASS DRAFT → job_transition READY + SHA readback
   ├─ PASS NEXT IN_PROGRESS → present reviewed superseding plan, await execution approval (do not force READY)
   ├─ HUMAN_REVIEW_REQUIRED → specific Human Gate
   └─ BLOCKED → exact blocker
→ READY (or reviewed NEXT revision) → present plan → WAIT for explicit Human execution approval
```

Phase, Job Pack and Milestone are planning concepts expressed with the existing Job/Task topology unless later evidence proves a new persistent entity is necessary.

Core invariant:

```text
Job boundary = context boundary.
```

For brownfield work, existing code is evidence rather than automatic authority. Planner must inspect enough relevant logic and relationships to distinguish canonical behavior from legacy, accidental, incorrect or unknown behavior.

Planner is source read-only.

### LLC60 — Continuation owner and persistence fence

Orchestrator owns the entire Planner ↔ planning Reviewer loop, not the individual role or the Human. The existing `job_prepare`, `plan_review_record`, `job_revise_plan`, and `job_transition(READY)` return a typed `continuation` specifying the next role/action **after** the instructed authorized GitHub Memory Repo persistence and exact SHA/record readback. `AWAITING_DURABLE_READBACK` is not completion. The caller continues immediately in the current turn; it must not stop and ask Human to type “continue” after a review, plan repair, or READY proposal.

A stale SHA, failed/denied write, unreconciled duplicate Verification or unsupported record is a real blocker; never bypass authorization or pretend the next action happened. Do not run a repeat Reviewer on an unchanged reviewed revision without evidence; use existing no-progress protections. A reviewed PASS plan also stops at Human execution approval, but routine CHANGES_REQUIRED findings do not require Human continuation.

## Coder loop

```text
LOAD L2 execution context
→ READ live source + exact revision + relevant callers/contracts/relationships
→ PLAN-EXEC smallest bounded sequence
→ IMPLEMENT approved changes
→ DIFF REVIEW
→ VERIFY observed-capability checks
→ SELF-REVIEW CLOSURE
   ├─ ordinary within-scope finding → fix and re-verify
   ├─ downstream follow-up → record, do not drift
   └─ material scope/contract change → escalate
→ GOAL RECHECK
   ├─ NOT_MET or unresolved scope drift → cannot complete successfully
   ├─ PARTIAL/UNVERIFIED → explicit limitation / retest path
   └─ ready → persist Goal Recheck
→ create required Handoff/evidence
→ terminal Run update LAST
```

A passing test suite alone is not completion.
Coder must re-read the Job objective/active Task criteria, inspect the actual diff and affected relationship boundaries, repair ordinary findings, and only then persist Goal Recheck.

For a successful Coder Run, `run_complete` validates the exact GOAL_RECHECK record for the same Project/Job/Run.

## Reviewer loop

Source/code and Job planning Reviewer both use same-chat independent evidence review when applicable: reconstruct the exact target/revision from durable Job, source and Verification facts in the SAME USER TURN without inheriting prior Agent reasoning. A new Human chat is not required. Do not ask the user to invoke Reviewer manually.

```text
exact requirements + exact target revision + evidence
→ size the review
→ if large: review map → bounded sections → consolidate
→ requirements → contract → actual diff → relationship impact → surrounding logic → evidence
→ findings
→ PASS / PASS_RETEST_REQUIRED / CHANGES_REQUIRED / BLOCKED / HUMAN_REVIEW_REQUIRED
→ Verification record
```

Planning review also checks Job sizing/context burden, brownfield logic review and relationship/precedence direction.

Reviewer never modifies source.

## Tester loop

```text
resolve exact acceptance behavior
→ discover tools + inspect exact CI run/job/steps/logs
→ capability check; if SURFACE_PRESENT, safely PROBE non-destructive test execution
→ OBSERVED: execute practical verification
→ CI runner/log unavailable: try authorized equivalent source-bound check, retain hosted CI UNVERIFIED
→ only if no agent-operable path: prepare minimal Human Retest
→ record evidence + limitations
→ causal routing on failure
```

SURFACE_PRESENT is not PASS evidence.

## LLC59 — Autonomous CI evidence and Coder red/green repair

When an authorized coding/test Run sees CI RED or an inconclusive hosted check, **GSA owns diagnosis before Human escalation**:

1. Self-read exact branch/commit, GitHub run/check status, jobs, runner allocation, executed steps and downloadable logs through available connectors. Ask for Human logs only if actual evidence cannot be retrieved after bounded discovery and there is no other agent-operable route. Missing runner/steps/logs is an environment limitation, not evidence of a broken product.
2. For an executed failing check, distinguish PRODUCT_FAILURE (source) from TEST_FAILURE (test script/config), ENVIRONMENT_FAILURE (runner/network/tool), NOT_READY and INTEGRATION_NOT_READY. Coder may repair project-owned source or test scripts within current authorized Job; Tester remains read-only.
3. Continue the **same user turn** with Coder repair → diff inspection → source-bound tests/CI → Goal Recheck → meaningful independent Retest/Reviewer checkpoint. Normal harmless log reads and authorized non-destructive checks need no new Human consent.
4. When hosted CI cannot execute, discover an actually available authorized internal execution surface. A successful non-destructive PROBE may establish capability; execute exact source revision on that surface and report **ALTERNATIVE_ENVIRONMENT_VERIFIED**, never claim hosted GitHub CI GREEN.
5. Human Retest is reserved for unavoidable user-only approval, secret, device/local host or exhausted/unsafe alternatives. State the specific blocker and smallest required Human action, then resume when provided.
6. Apply existing bounded retry/no-progress safeguards, source cursor CAS/readback and project/role boundaries. Do not poll, retry blindly, automate release or turn skipped tests into PASS.

No new per-call scanning is implied: this flow activates only for a failure, uncertain check, or explicit CI investigation.

## Persistence order

When a Run ends:

1. persist source/output evidence;
2. persist Verification records;
3. persist immutable Handoff when needed;
4. update terminal Run LAST;
5. refresh CONTROL only as best effort.

Never let a terminal Run reference an artifact that does not exist.

## Fresh-chat continuation

A new chat reconstructs work from durable records. It must not depend on prior chat memory:

```text
PROJECT.md
+ active Job
+ Run / Verification / Handoff records
+ exact live source revision when needed
→ current work state
```

If an `IN_PROGRESS` Run has lost its execution context, treat it as derived ABANDONED and create a new linked Run rather than pretending the old execution resumed.

## Human authority

Agent text is never human approval.
Merge/release and material product/architecture/governance decisions remain explicit human decisions.

## LLC58 — Changing the plan while Jobs are active

For an explicit Human Plan change, suspend affected forward progress at the next safe boundary, while leaving unaffected Jobs available. Planner builds the impact matrix (`job_plan_change_assess`), Reviewer approves the exact changed Plan Job revision, then orchestrator calls `job_plan_change_prepare`. Persist the immutable intent with authorized GitHub CREATE and independent readback. Never use a failed Job cursor prepare as a pretext for raw source writes.

For a REPLACE row, reconcile running Runs and any PENDING cursor first, transition obsolete Job to SUPERSEDED using its current blob SHA, then create new DRAFT Job using `job_prepare(replacement_context)` with the exact intent SHA/readback and the reserved replacement Job ID. The predecessor is historical and cannot be reopened; its PASS remains historical evidence. New Job planning review and downstream dependency revalidation are mandatory.

If interrupted, reread the intent and current old/new Job records and use `job_plan_change_resume_evaluate` to select the next step. An existing replacement path is a reason to **read**, not to allocate another ID. Normal Project, Run, Reviewer/Tester and scope rules remain in force. No new tool call loop is needed for ordinary reads and unchanged Jobs.
