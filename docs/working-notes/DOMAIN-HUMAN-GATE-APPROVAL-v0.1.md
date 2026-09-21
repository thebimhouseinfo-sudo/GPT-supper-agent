# DOMAIN DETAIL — Human Gate / Approval v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = HUMAN GATE / APPROVAL
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Two classes

Accepted:
```text
Planned Human Gate
= workflow governance boundary

Runtime Confirmation
= narrow execution-time authorization/clarification
```

## 2. Planned Human Gate

Used for:
- material product/architecture choice;
- subjective acceptance;
- Causal Change Review option;
- merge/release authorization;
- waiver;
- destructive governance action when planned.

It is explicit, scoped, attributable, and bound to a target/context.

## 3. Runtime Confirmation

Used for immediate action/ambiguity in current Run.

Accepted:
```text
Runtime Confirmation
→ never durable approval log
```

## 4. Silence

No approval may be inferred from silence.

## 5. Approval persistence

Accepted:
Planned Human Gate is persisted only when needed for governance/audit/release/waiver/ownership/future decision.

### Nomination

Persist when approval materially changes downstream authority or future interpretation.

Do not persist trivial acknowledgements.

Mark: REVIEW_REQUIRED.

## 6. Waiver

Waiver must bind to:
- exact finding/rule;
- target/revision;
- scope;
- human decision;
- consequences if material.

Waiver is not deletion of finding history.

## 7. COLLECT candidates

- gate ID;
- decision requested;
- options;
- target/revision;
- decision;
- approver;
- scope;
- waiver linkage;
- dependent work;
- persistence necessity.

### Nominated for REVIEW
1. Persist only materially consequential Planned Human Gates.
2. Runtime Confirmation never becomes approval record.
3. Waiver preserves original finding/history.
