# DOMAIN DETAIL — Capability / Executor v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = CAPABILITY / EXECUTOR
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Core rule

Accepted:
```text
unknown capability
→ treat as unavailable until verified
```

No fake execution.

## 2. Capability

Capability means an executor can actually perform an action in current context.

Examples:
- repo_read;
- repo_write;
- PR review;
- CI inspection;
- deployment access;
- browser/runtime;
- screenshot capture;
- image generation;
- Drive read/write.

## 3. Executor

Executor is the concrete available mechanism performing a step:
- GitHub connector;
- Drive connector;
- browser/runtime service;
- image generator;
- human;
- future plugin/tool.

## 4. Matching

```text
work step requirements
→ required capabilities
→ available executors
→ match
→ execute or block/degrade
```

## 5. Capability states

### Nomination

Use semantic states:
```text
AVAILABLE
UNAVAILABLE
UNKNOWN
DEGRADED
```

Observed/verified provenance should accompany state rather than create many extra states.

Mark: REVIEW_REQUIRED.

## 6. Refresh

Freshness-sensitive capabilities should be rechecked before consequential action when permission/runtime may have changed.

## 7. Degraded mode

Degraded mode is valid only if acceptance/evidence semantics remain honest.

Example:
no browser → code inspection + CI possible, visual practical check deferred.

## 8. Enforcement level

Important governance boundaries should classify:
```text
HARD
SOFT
UNKNOWN
```

UNKNOWN operationally behaves as SOFT until verified.

## 9. COLLECT candidates

- capability;
- executor;
- state;
- verified_at;
- scope/target;
- enforcement level;
- limitation;
- degraded alternative.

### Nominated for REVIEW
1. AVAILABLE/UNAVAILABLE/UNKNOWN/DEGRADED vocabulary.
2. Verification provenance separate from capability state.
3. Freshness-sensitive capabilities refresh before consequential use.
