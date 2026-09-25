# E17 — Minimal Durable Job Runtime

## Purpose

Verify the first executable GSA Job vertical slice after Memory Repo setup.

## Preconditions

- authenticated GSA account;
- private Memory Repo configured;
- one ACTIVE Project exists for a separate source repository;
- current GSA MCP exposes:
  - `get_agent_harness`
  - `job_prepare`
  - `run_begin`
  - `goal_recheck_record`
  - `run_complete`

## Scenario

Use a harmless, bounded code Job against a disposable/non-sensitive target or a documentation-only change in the pilot source repository.

Example objective:

```text
Create a small README clarification with one explicit acceptance criterion.
```

## E17-A Planner

1. load Planner harness;
2. inspect Project + relevant source read-only;
3. define one finite Job with one Task;
4. call `job_prepare`;
5. authorize and persist the returned Job record;
6. read it back.

Expected:

- Job path is `projects/<project-id>/WORK/JOBS/<job-id>.json`;
- lifecycle = READY;
- no source mutation occurs during Planner Run.

## E17-B Coder Run start

1. call `run_begin(role=coder)`;
2. persist returned IN_PROGRESS Run record;
3. load Coder harness;
4. verify Project is still ACTIVE and target revision is current before source write.

Expected:

- one unique Run record exists;
- role = coder;
- explicit scope claim exists;
- Run starts before source mutation.

## E17-C Coder loop

Execute:

```text
READ
→ PLAN-EXEC
→ IMPLEMENT
→ VERIFY
→ DIFF REVIEW
→ GOAL RECHECK
```

Expected:

- actual changed-file/diff inspection occurs;
- test success alone is not treated as goal success;
- any NOT_MET criterion loops back to implementation or blocks/escalates.

## E17-D Goal Recheck

Call `goal_recheck_record` with exact target revision and all criteria.

Expected:

- append-preserving Verification path under `VERIFICATION/`;
- NOT_MET prevents success handoff;
- PARTIAL/UNVERIFIED is visible as limitation;
- no self-recheck is called independent Reviewer proof.

## E17-E Run completion

1. persist Goal Recheck/evidence first;
2. if another role is needed, build/persist immutable Handoff;
3. call `run_complete`;
4. update Run with exact current blob SHA LAST;
5. read everything back.

Expected:

- terminal Run references only existing evidence/handoff;
- stale SHA fails rather than overwrites;
- source revision in evidence matches actual target.

## E17-F Fresh-chat recovery

Open a fresh chat.

Expected:

- resolve Memory Repo from account config;
- reopen Project;
- discover Job/Run/Verification/Handoff from durable records;
- no prior chat reasoning is required to identify current state.

## PASS

E17 PASS requires A-F.
