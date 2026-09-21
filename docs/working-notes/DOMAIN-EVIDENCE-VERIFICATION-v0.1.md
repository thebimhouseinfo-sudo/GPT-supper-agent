# DOMAIN DETAIL — Evidence / Verification v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = EVIDENCE / VERIFICATION
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Purpose

Evidence supports claims about work, quality, capability, and acceptance.

```text
claim
→ evidence
→ target/revision
→ provenance
→ freshness
```

## 2. Evidence types

May include:
- source/diff inspection;
- CI/build/test;
- runtime/preview;
- screenshot/render;
- external system result;
- Reviewer observation;
- Tester result;
- user practical verification;
- capability/tool error.

## 3. Provenance

Evidence should identify:
- observer/producer role/Run;
- source/tool/user;
- target;
- exact revision/environment;
- time when relevant.

## 4. Freshness

Evidence may expire when target changes.

### Nomination

Use causal invalidation:
```text
target change
→ determine whether evidence remains applicable
→ REVALIDATED / STALE / unaffected
```

Do not invalidate everything mechanically after every commit.

Mark: REVIEW_REQUIRED.

## 5. Confidence

### Nomination

Do not create a universal numeric confidence score.

Prefer categorical explanation:
- observed;
- inferred;
- unavailable;
- partial;
- user-confirmed.

Alternative:
0–100 confidence.

Cost:
false precision.

Mark: REVIEW_REQUIRED.

## 6. Unavailable verification

```text
required practical evidence unavailable
→ strongest available evidence
→ PASS_RETEST_REQUIRED when acceptance otherwise satisfied
```

## 7. User evidence

User-reported practical result is valid evidence when bound to specific Retest/target/context.

## 8. COLLECT candidates

- evidence ID;
- type;
- target/revision;
- producer/Run;
- environment;
- result;
- provenance;
- freshness;
- applicability;
- supersession/revalidation linkage.

### Nominated for REVIEW
1. Causal evidence invalidation, not blanket expiry.
2. No universal numeric confidence.
3. User Retest reports are first-class practical evidence.
