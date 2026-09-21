# DOMAIN DETAIL — Retest v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = RETEST
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Purpose

Retest is a durable practical verification obligation attached to already accepted online work.

It is not a Job type.

## 2. Trigger

```text
online evidence sufficient for acceptance
+ practical verification unavailable
→ PASS_RETEST_REQUIRED
→ create Retest
```

## 3. Required semantics

- Retest ID;
- Project/Job/Task ownership;
- source/merged revision;
- environment/device;
- exact test;
- expected result;
- why online verification insufficient;
- related implementation;
- status/result/evidence.

## 4. Status

Accepted:
```text
PENDING
BLOCKED
PASS
FAIL
SUPERSEDED
```

History append-preserving.

## 5. FAIL routing

```text
FAIL
→ resolve owning context
→ reopen smallest relevant scope
→ fix
→ review
→ new Retest revision/ID if still required
```

## 6. Identity

### Nomination

Retest ID globally unique, matching Job/Task/Run direction.

Alternative:
unique within Job.

Mark: REVIEW_REQUIRED.

## 7. Storage

Durability required; physical folder/file representation still deferred despite older notes nominating retests/.

## 8. COLLECT candidates

- ID;
- ownership;
- revision;
- environment;
- steps;
- expected;
- reason;
- attempt history;
- result/evidence;
- replacement/revision link.

### Nominated for REVIEW
1. Global Retest identity.
2. Preserve all attempt history.
3. Physical storage deferred.
