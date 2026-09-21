# Identity and Handles v1

## 1. Requirement

Durable entities referenced outside their immediate parent context require globally collision-resistant identity without relying on a central counter.

Applies at least to:
- Project;
- Job;
- Run;
- Handoff;
- Verification record;
- Retest;
- Asset Requirement;
- Human Gate;
- Release;
- separately addressable Task when needed.

## 2. Canonical identity

### Decision

Use UUIDv7-class semantics for canonical IDs:
- globally collision-resistant;
- time-sortable;
- no central registry/counter;
- suitable for parallel chat creation.

Exact library/serialization is implementation detail.

Canonical IDs are product-name-neutral.

Example semantic shape:
```text
0195...-....
```

## 3. Human handles

Each user-facing durable entity may also expose a short non-authoritative handle.

Examples:
```text
J-7K4M
R-2F9Q
RT-4C2P
AR-81XZ
```

Rules:
- handle is convenience, not canonical identity;
- uniqueness is required only within the lookup surface shown to the user;
- ambiguous handle lookup must ask/show choices;
- detached durable references store canonical ID.

## 4. Project identity

Project folder name is not canonical Project ID.

PROJECT.md carries the structured Project ID.

## 5. Task identity

Tasks embedded in Job still receive a stable task_id if they can be referenced by Runs/findings/retests.

Task canonical ID may use same UUIDv7-class scheme.

## 6. No central counter

Do not use:
```text
JOB-000123
```
as canonical identity if allocation requires shared mutable global state.

Sequential numbers may appear as display order only.

## 7. Creation collision

A detected collision is treated as invalid record creation and regenerated; it is not resolved by overwriting an existing entity.
