# DOMAIN DETAIL — State Model v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = STATE MODEL
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Purpose

State model expresses durable lifecycle/workflow conditions without collapsing distinct domains.

## 2. Separate state spaces

Do not force one giant enum for:
- Project lifecycle;
- Job lifecycle/result;
- Task lifecycle;
- Run lifecycle;
- Handoff;
- Retest;
- Asset Requirement;
- artifact validity;
- delivery facts.

## 3. Project

Accepted:
```text
ACTIVE | PAUSED | ARCHIVED
```

## 4. Other domains

Current candidates collected during DETAIL, not frozen.

## 5. State vs result vs fact

### Nomination

Keep separate:
```text
state
= current lifecycle position

result
= outcome of evaluation/work

fact/event
= something that occurred (merged/deployed/etc.)
```

Alternative:
single status field for everything.

Cost:
semantic ambiguity.

Mark: REVIEW_REQUIRED.

## 6. Transition authority

Nominated:
domain defines valid semantics; Orchestrator applies/guards transitions.

## 7. COLLECT candidates

Need synthesize after all domain nominations:
- canonical enums;
- legal transitions;
- invalid transitions;
- cross-domain derived status;
- terminal/nonterminal semantics;
- reopen rules.

### Nominated for REVIEW
1. Separate state/result/fact.
2. Multiple domain-specific state spaces.
3. Orchestrator enforces transitions rather than owning all meanings.
