# DOMAIN DETAIL — Handoff v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = HANDOFF
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Purpose

Handoff transfers executable responsibility from one Run/role to the next without depending on chat memory.

```text
Run A ends
→ handoff state
→ Run B can start with sufficient context
```

## 2. Minimum semantics

A handoff should identify:
- owning Project/Job;
- relevant Task(s);
- source Run;
- next handler/role;
- exact target/revision;
- completed work;
- remaining work;
- blocker/gate if any;
- required input/evidence;
- expected next outcome.

## 3. Handoff vs next Run

Handoff is not itself a Run.

It is a durable transition contract between execution attempts.

## 4. Human-dispatched mode

Current:
```text
handoff persisted
→ user invokes next role
→ next Run consumes handoff
```

Future automatic dispatch may consume the same handoff semantics.

## 5. Pending handoff state

### Nomination

Prefer representing "waiting for next role" primarily as **Handoff state**, not as a long-lived WAITING_HANDOFF Run state.

Rationale:
- source Run has already ended;
- waiting belongs to transition, not execution attempt.

Alternative:
keep source Run open as WAITING_HANDOFF.

Cost:
blurs Run completion.

Mark: REVIEW_REQUIRED.

## 6. Handoff consumption

### Nomination

A handoff is consumed by a new Run but remains historical.

Do not delete it after consumption.

Mark: REVIEW_REQUIRED.

## 7. Handoff invalidation

If upstream target/revision changes before next Run starts:
```text
handoff
→ revalidate
→ update/supersede if target changed materially
```

## 8. COLLECT candidates

- handoff ID;
- source Run;
- target role;
- task refs;
- target/revision;
- pending/consumed/superseded state;
- blocker/Human Gate;
- created/consumed timestamps;
- successor Run.

### Nominated for REVIEW
1. WAITING_HANDOFF belongs primarily to Handoff domain.
2. Handoffs remain historical after consumption.
3. Material target change supersedes/revalidates pending handoff.
