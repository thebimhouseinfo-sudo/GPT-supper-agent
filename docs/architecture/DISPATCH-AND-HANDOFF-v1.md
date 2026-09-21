# Dispatch and Handoff v1

## 1. Current model

```text
Run completes
→ Handoff PENDING
→ user dispatches next Run
→ next Run consumes Handoff
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
state
```

## 3. Minimal dispatch UX

The harness must support these user intents:

```text
show pending handoffs
continue/take next handoff
take handoff <handle/id>
show current Project status
pause Project
resume Project
stop/cancel active intended work where semantically allowed
```

Exact fake-CLI aliases are not identity and may change.

## 4. Selection

If more than one pending Handoff exists:
- show compact choices;
- do not guess when ambiguity affects work scope.

## 5. Fresh-chat requirement

Independent Reviewer:
```text
pending Reviewer Handoff
→ user starts/invokes Reviewer in fresh chat
→ Handoff context is loaded
```

Non-independent child/specialist Run may stay in current chat.

## 6. Consume rule

Before consuming:
- Project must be ACTIVE;
- target/revision must still be relevant;
- scope/conflict must be checked;
- required Human Gate must be satisfied.

Consumed Handoff remains historical.

## 7. Unmatched command/input

Unrecognized or ambiguous harness command:
```text
show interpretation/choices or ask
→ never guess destructive action or work target
```
