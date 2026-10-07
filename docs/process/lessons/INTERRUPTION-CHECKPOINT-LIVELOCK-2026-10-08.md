# Interruption, checkpoint and livelock — 2026-10-08

Status: **Lessons Learned candidate**

## Observed failures

1. **Streaming interruption during long mutation chains**
   - A turn can be interrupted while Git/source mutation is only partially complete.
   - The chat may lose the intermediate SHA/result even though part of the mutation may already exist.
   - Blind retry risks duplicate commits, orphan commits, repeated writes, or redoing work that already exists.

2. **Live-forever / livelock**
   - A run may keep calling tools successfully without making meaningful progress.
   - Repeated authorize/fetch/persist/retry/supersede activity can look “alive” while the workflow does not converge.
   - Activity must not be treated as proof of progress.

3. **Weak resume state causes duplicate coding and commit archaeology**
   - After interruption, GSA may not know the exact last durable step.
   - It can code again, then later discover extra commits or stale Tester/Reviewer evidence.
   - One canonical branch alone is not enough; the Job also needs a lightweight durable execution cursor.

## Direction

Use a small per-Job checkpoint state, not a heavy project-management layer.

Minimum useful state:
- job_id / plan_revision
- current phase/task/step
- canonical work branch
- expected head SHA
- last_good_sha
- last_completed_checkpoint
- pending_action
- retry_count
- progress_fingerprint
- last_operation_id

Persist only meaningful resumable checkpoints, for example:
`PLAN_LOCKED -> CODE_COMPLETE -> SELF_TEST_PASS -> TESTER_PASS -> REVIEW_PASS -> MERGED`.

Every checkpoint must bind to the exact source SHA it proves.

## Resume rule

After any interruption, **do not code first**.

Required order:
1. load durable checkpoint state;
2. read canonical branch/head;
3. compare current head with `last_good_sha`;
4. reconcile intervening commits if the branch advanced;
5. invalidate stale exact-SHA evidence if needed;
6. determine one next legal action;
7. resume from that action only.

## Livelock guard

Progress is a durable state transition, not a successful tool call.

Use a compact fingerprint such as:
`checkpoint + branch_sha + staging_sha + run_status + pending_action`.

If the fingerprint does not meaningfully change for a small bounded number of cycles (recommended default: 3):
- stop the loop;
- persist a resumable `PAUSED_NO_PROGRESS`-style state;
- end the turn;
- resume later from the last good checkpoint.

Retries must also be bounded. Consequential mutations should normally get at most 2 retries after authoritative refetch/reconciliation.

## Mutation recovery rule

Consequential mutations need:
- stable operation id;
- read-before-retry;
- expected-head/CAS semantics where possible;
- post-write read-back;
- no reliance on an orphan commit SHA existing only in chat context.

If the response is interrupted, inspect durable truth before recreating commits, moving refs, merging, or repeating persistence.

## Terminal-state rule

`COMPLETED`, `FAILED`, `CANCELLED`, and `SUPERSEDED` must be terminal for normal execution.

A superseded run may perform one bounded final persistence/cleanup step, but must not re-enter a normal retry/update loop.

## Lessons learned

- **Conversation continuity is not execution durability.**
- **Activity is not progress.**
- **Checkpoint value comes from exact revision binding.**
- **Resume begins with reconciliation, not implementation.**
- **Retries must be idempotent and bounded.**
- **Terminal means terminal.**
- **One canonical branch + a lightweight execution cursor is sufficient and preferable to heavy bookkeeping.**
- **Record checkpoint-to-SHA ownership when work completes instead of reconstructing commit history later.**
