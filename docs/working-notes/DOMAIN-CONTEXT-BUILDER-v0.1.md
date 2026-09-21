# DOMAIN DETAIL — Context Builder v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = CONTEXT BUILDER
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Purpose

Context Builder assembles the minimum sufficient evidence/context for one Run/role.

```text
Project durable context
+ current request/work
+ relevant live evidence
→ role-specific context packet
```

## 2. Drive-first principle

For existing Project:
```text
Project Memory first
→ resolve relevant work/repo/path
→ selective GitHub read
```

Do not broad-scan all repos by default.

## 3. Context packet

May include:
- Project invariants;
- Job/Task objective;
- relevant approved decisions;
- architecture/contracts;
- current target/revision;
- relevant findings/retests;
- role-specific constraints;
- capability state;
- live source evidence;
- handoff.

## 4. Exclusions

Do not include by default:
- entire chat history;
- all Project memory;
- all repo source;
- irrelevant old findings;
- hidden chain-of-thought.

## 5. Freshness

### Nomination

Context Builder should distinguish durable truth from freshness-sensitive evidence.

Examples:
- approved decision may remain valid;
- branch head/CI/PR status may require refresh.

Mark: REVIEW_REQUIRED.

## 6. Role isolation

Reviewer context should avoid implementation persuasion/history that is not needed for objective review.

Tester context may intentionally omit some implementation detail for exploratory independence.

## 7. Maximum context

### Nomination

No fixed token quota in theory. Use relevance-first pruning and expand only when causal dependency requires it.

Alternative:
hard per-role size budget.

Cost:
premature optimization and risk of missing required evidence.

Mark: REVIEW_REQUIRED.

## 8. COLLECT candidates

- context packet identity/version;
- input refs;
- live evidence freshness;
- role;
- target;
- exclusions;
- stale-warning flag.

### Nominated for REVIEW
1. Relevance-first, no fixed theory token cap.
2. Freshness-sensitive sources are refreshed contextually.
3. Reviewer/Tester may receive intentionally isolated context.
