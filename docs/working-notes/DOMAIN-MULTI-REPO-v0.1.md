# DOMAIN DETAIL — Multi-repo Coordination v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = MULTI-REPO
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Purpose

Coordinate one Project objective across multiple owned repositories and read-only references.

## 2. Project-level ownership

Project owns repository relationships.

Jobs receive scoped access.

## 3. Shared contracts

Provider/consumer relationships must be explicit when changes can propagate.

```text
provider change
→ identify consumers
→ impact analysis
→ coordinated work
```

## 4. Change Set

### Nomination

Use a Change Set concept when one logical change spans multiple repos/PRs.

```text
Change Set
→ repo work A
→ repo work B
→ integration evidence
```

Not every multi-repo Project action requires a Change Set.

Mark: REVIEW_REQUIRED.

## 5. Partial completion

One repo passing does not imply Change Set/Job completion.

Partial completion may be recorded, but acceptance depends on required integrated scope.

## 6. Dependency order

Provider/contract migrations should define compatibility and rollout order.

Avoid updating consumers blindly.

## 7. Rollback

Rollback must consider cross-repo compatibility, not only one PR revert.

## 8. Reference repos

Referenced repos remain read-only. Change request to original routes to owning Project.

## 9. COLLECT candidates

- repo role;
- provider/consumer edges;
- contract version;
- Change Set;
- repo work/PR refs;
- dependency order;
- compatibility window;
- integration evidence;
- rollback plan.

### Nominated for REVIEW
1. Change Set only when logical multi-repo coordination is needed.
2. Partial repo completion is recordable but not equivalent to integrated acceptance.
3. Cross-repo rollback is compatibility-aware.
