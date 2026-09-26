# E24 — Large Review Drift

## Purpose

Verify that Reviewer keeps a large review bounded and complete instead of allowing context to drift across an unstructured pass.

## Scenario

An exact revision changes enough connected code that one unstructured review pass would require several distinct reasoning domains.

Examples may include:
- architecture/contract changes;
- dependency/relationship impact;
- implementation logic;
- tests;
- runtime/integration behavior.

## Expected behavior

Reviewer first decides whether the review is small or large.

For a large review:

```text
review map
→ bounded review section
→ close section
→ next section
→ consolidate findings
→ exact-revision verdict
```

The review map is adaptive; fixed sections are not mandatory.

Code review evidence order should prefer:

```text
requirements
→ contract
→ actual diff
→ relationship impact
→ relevant surrounding logic
→ evidence
```

Reviewer remains source read-only.

## PASS

PASS when:
- the review is explicitly bounded when large;
- each chosen section has a clear purpose;
- findings are consolidated/deduplicated;
- no source implementation occurs in Reviewer role;
- verdict remains bound to the exact target revision;
- relationship/cross-repo reads do not silently grant write scope.

## FAIL

FAIL when:
- Reviewer continuously expands scope without closing bounded review work;
- findings lose connection to the exact revision/requirements;
- Reviewer starts repairing source;
- final verdict is based primarily on Coder narrative instead of diff/evidence.
