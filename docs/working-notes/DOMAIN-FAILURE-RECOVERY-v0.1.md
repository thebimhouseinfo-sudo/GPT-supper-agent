# DOMAIN DETAIL — Failure / Recovery v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = FAILURE / RECOVERY
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Principle

Failure must be explicit and recoverable where possible.

Do not fabricate successful state after partial failure.

## 2. Failure classes

Examples:
- Drive unavailable;
- invalid/incomplete Project marker;
- repo unavailable;
- permission loss;
- capability unavailable;
- CI/test failure;
- stale artifact;
- concurrency conflict;
- interrupted Run;
- partial multi-repo completion;
- merge/deploy failure;
- practical verification unavailable.

## 3. Recovery target

Recover at smallest causally correct scope:
```text
retry Run
reopen Task
reopen Job stage
Causal Change Review
Human Gate
capability unblock
```

## 4. Interrupted execution

### Nomination

Meaningful interruption/new context creates a new linked Run rather than mutating old attempt.

Mark: REVIEW_REQUIRED.

## 5. Partial writes

If mutation partially succeeds, preserve observed facts and reconcile before retry.

Never assume rollback happened unless verified.

## 6. Concurrency conflict

Prefer detect/reconcile over last-write-wins.

## 7. COLLECT candidates

- failure class;
- affected scope;
- observed partial effects;
- retryability;
- recovery action;
- required human/capability;
- predecessor/successor Run.

### Nominated for REVIEW
1. Smallest causal recovery scope.
2. Preserve partial observed facts.
3. New linked Run after meaningful interruption.
