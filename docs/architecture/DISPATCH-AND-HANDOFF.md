# Dispatch and Handoff

## 1. Current model

```text
Run completes
→ immutable Handoff record is created
→ user dispatches next Run
→ successor Run / HandoffConsumption references handoff_id
```

No automatic separate-chat spawning is assumed.

## 2. Handoff minimum contract

```text
handoff_id
project_id
job_id
source_run_id
next_role
primary_task_id?
target_ref
target_revision
completed
remaining
required_inputs
blocker_or_gate?
expected_next_outcome
```

## 3. Minimal dispatch UX

Support:
```text
show pending handoffs
continue/take next handoff
take handoff <handle/id>
show Project status
pause Project
resume Project
stop/cancel intended work where semantically allowed
```

## 4. Scope of "show pending handoffs"

Default depends on whether a Project is open.

```text
Project already open
→ show pending Handoffs in that Project

No Project open
→ shallow cross-Project discovery under SUPER_AGENT_DRIVE_ROOT
→ list valid Projects
→ read small CONTROL pending_handoff_handles[] when present
→ if CONTROL missing/stale, fall back to that Project's durable Handoff/Job records
→ show compact Project + Handoff choices
```

Do not full-load every Project's knowledge/source to find pending work.

User may explicitly request "all Projects" while one Project is open.

## 5. Selection

If multiple pending Handoffs exist, show compact choices and do not guess.

## 6. Fresh chat

Independent Reviewer Handoff:
```text
user invokes Reviewer in fresh chat
→ Handoff context loads
```

Non-independent child/specialist Run may remain same chat.

## 7. Consume rule

Before dispatching from a Handoff:
- Project ACTIVE;
- target/revision still relevant;
- scope/conflict checked;
- required Human Gate satisfied;
- re-check whether another successor/consumption event already references this handoff_id.

Consumption is append-preserving:

```text
Handoff (immutable)
+ HandoffConsumption or successor Run reference
→ derived state = PENDING | CONSUMED | CONFLICTED
```

Two conflicting consumption events are not silently last-write-wins; they are surfaced as a conflict for reconciliation.

## 8. Unmatched command/input

Ambiguous/unrecognized command:
```text
show interpretation/choices or ask
→ never guess destructive/work target
```
