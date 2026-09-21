# DOMAIN DETAIL — Orchestrator v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = ORCHESTRATOR
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Purpose

Orchestrator coordinates work state, routing, gates, handoffs, and persistence across roles.

```text
user intent / current Project state
→ determine active work context
→ select role/workflow
→ enforce boundaries/gates
→ persist transitions
→ route next action
```

Orchestrator does not implement source code and does not replace specialist roles.

## 2. Responsibilities

Orchestrator owns:
- active Project/Job/Task/Run coordination;
- role dispatch recommendation;
- state transition governance;
- Human Gate routing;
- handoff persistence;
- capability/executor resolution coordination;
- stale/conflict detection;
- cross-chat continuity;
- next-handler visibility;
- durable status views.

## 3. Non-responsibilities

Orchestrator must not:
- invent product/architecture decisions;
- write implementation source;
- perform Reviewer acceptance;
- silently waive blockers;
- merge without explicit authorization;
- treat tool capability as authority.

## 4. Current platform dispatch

Current execution is:
```text
pull-based
+ human-dispatched
+ durable-state persistent
```

Orchestrator records/recommends the next handler. It does not pretend it can spawn a separate agent when platform capability is unavailable.

## 5. State ownership

### Nomination
Orchestrator owns **transition authority**, while domain entities own their semantic state definitions.

Preferred:
```text
domain defines valid states/meaning
Orchestrator validates/applies transitions
```

Alternative:
central state machine defines every domain state itself.

Cost: overly monolithic and duplicates domain semantics.

Mark: REVIEW_REQUIRED.

## 6. Concurrency

Orchestrator must detect likely conflict between parallel Jobs/Tasks/Runs:
- same branch/files;
- shared contract/schema;
- dependent assumptions;
- release-critical shared artifact.

It may allow independent work to continue.

## 7. Recovery

Interrupted work should resume from durable state, not chat memory.

Orchestrator must distinguish:
- retry same semantic work via new Run;
- reopen Task;
- reopen Job;
- route Causal Change Review;
- preserve completed evidence when still valid.

## 8. Direct exposure

Existing nomination:
```text
Orchestrator is implicit/system role
→ not ordinary Direct Agent
```

Mark: REVIEW_REQUIRED.

## 9. COLLECT candidates

- active work pointer;
- pending handoff;
- pending Human Gate;
- conflict state;
- transition history;
- capability blocker;
- next handler;
- current target revision.

### Nominated for REVIEW
1. Domain-owned state semantics + Orchestrator-owned transition enforcement.
2. Orchestrator remains implicit system role.
3. Parallel conflict detection is mandatory before concurrent write work.
