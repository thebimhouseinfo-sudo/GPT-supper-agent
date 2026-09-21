# DOMAIN DETAIL — Governance / Artifact Lifecycle v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = GOVERNANCE / ARTIFACT LIFECYCLE
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Purpose

Preserve authority, revision lineage, dependency validity, and concurrent-work safety for durable artifacts.

## 2. Artifact identity

Durable artifacts that matter across Runs should have stable identity and revision/version lineage.

## 3. Change impact

Accepted Causal Change Review:
```text
change
→ trace dependencies
→ affected/unaffected with reasons
→ options
→ human decides material trade-off
→ mark REVALIDATED / STALE / SUPERSEDED as appropriate
```

## 4. No blanket stale

Artifact invalidation is causal.

## 5. Concurrency

### Nomination

Use optimistic concurrency for durable artifact updates:
```text
read revision
→ prepare update
→ verify still current
→ update or reconcile conflict
```

Alternative:
last-write-wins.

Cost:
can silently destroy concurrent decisions.

Mark: REVIEW_REQUIRED.

## 6. Revision preservation

Historically significant approved/reviewed artifacts should preserve prior revisions or lineage.

## 7. Archive

Artifact archival is distinct from Project archival.

Do not invent per-artifact archive folders yet.

## 8. COLLECT candidates

- artifact ID/type;
- revision;
- status;
- input refs;
- owner;
- dependencies;
- approved/reviewed state;
- stale/superseded reason;
- concurrency token/revision.

### Nominated for REVIEW
1. Optimistic concurrency.
2. Causal invalidation only.
3. Significant prior revisions remain recoverable/traceable.
