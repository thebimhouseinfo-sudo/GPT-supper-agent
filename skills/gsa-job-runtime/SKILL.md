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
read Project + selective source
→ define finite objective/scope/non-goals
→ decompose Tasks
→ define dependencies/topology
→ place review/test/human gates
→ define completion/evidence requirements
→ consistency review
→ job_prepare
→ persist Job
```

Planner is source read-only.

## Coder loop

```text
READ live source + exact revision
→ PLAN-EXEC smallest bounded sequence
→ IMPLEMENT approved changes
→ VERIFY observed-capability checks
→ DIFF REVIEW
→ GOAL RECHECK
   ├─ NOT_MET/PARTIAL and fixable → loop
   ├─ material scope/contract change → escalate
   └─ ready → persist Goal Recheck
→ create required Handoff/evidence
→ terminal Run update LAST
```

A passing test suite alone is not completion.
Coder must inspect the actual diff and run Goal Recheck against the work definition.

## Reviewer loop

Reviewer must be context-isolated in a fresh chat when independent review is required.

```text
exact requirements + exact target revision + evidence
→ independent criterion derivation
→ actual diff review
→ findings
→ PASS / PASS_RETEST_REQUIRED / CHANGES_REQUIRED / BLOCKED / HUMAN_REVIEW_REQUIRED
→ Verification record
```

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
