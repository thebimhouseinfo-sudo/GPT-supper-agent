# DOMAIN DETAIL — Release / Completion v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = RELEASE / COMPLETION
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Separate dimensions

Accepted:
```text
Project lifecycle
= ACTIVE | PAUSED | ARCHIVED

Project release milestones
= project-specific DONE_* milestones
```

Job acceptance is separate again.

## 2. Delivery facts

Accepted distinct facts:
```text
accepted
merged
deployed
deployment_verified
```

They do not collapse into one lifecycle state.

## 3. Merge

Explicit human authorization required after accepted result.

## 4. Job completion

### Nomination

Job terminal completion means:
- required work/topology satisfied;
- required independent final acceptance passed;
- result = PASS or PASS_RETEST_REQUIRED.

Outstanding Retest does not reopen Job acceptance automatically.

Alternative:
keep Job "open" until Retests pass.

Cost:
confuses accepted implementation with delayed practical verification.

Mark: REVIEW_REQUIRED.

## 5. Project milestone

Project-specific release milestone should capture:
- milestone/version;
- date;
- scope;
- commit/tag/release if applicable;
- acceptance;
- deployment/package target;
- limitations;
- pending Retests;
- human approval reference when relevant.

## 6. COLLECT candidates

- Job acceptance result;
- delivery facts;
- merge auth;
- release milestone;
- deployed target;
- known limitations;
- pending Retests.

### Nominated for REVIEW
1. PASS_RETEST_REQUIRED Job may be completed/accepted while Retest remains pending.
2. Delivery facts remain independent booleans/events rather than lifecycle states.
3. Release milestones are Project-specific, not global enum.
