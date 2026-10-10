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
→ job_prepare
→ planning review / repair loop
→ READY
```

Phase, Job Pack and Milestone are planning concepts expressed with the existing Job/Task topology unless later evidence proves a new persistent entity is necessary.

Core invariant:

```text
Job boundary = context boundary.
```

For brownfield work, existing code is evidence rather than automatic authority. Planner must inspect enough relevant logic and relationships to distinguish canonical behavior from legacy, accidental, incorrect or unknown behavior.

Planner is source read-only.

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

Reviewer must be context-isolated in a fresh chat when independent review is required.

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
→ capability check
→ OBSERVED: execute practical verification
→ otherwise: prepare Human Retest
→ record evidence + limitations
→ causal routing on failure
```

SURFACE_PRESENT is not PASS evidence.

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
