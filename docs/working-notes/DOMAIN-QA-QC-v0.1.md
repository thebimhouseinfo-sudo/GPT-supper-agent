# DOMAIN DETAIL — QA / QC v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = QA / QC
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Accepted boundary

```text
QA
= process assurance
= mainly COMPLIANCE + evidence discipline

QC
= output quality
= mainly CORRECTNESS + FIT
```

Canonical check families:
```text
COMPLIANCE
CORRECTNESS
FIT
```

## 2. QA

QA asks:
- did work follow approved scope/plan?
- were role/write boundaries respected?
- were dependencies/change impacts handled?
- were required checks skipped?
- is evidence sufficient and attributable?
- is diff/change hygiene acceptable?

## 3. QC

QC asks:
- does result actually work?
- does it satisfy acceptance?
- are contracts/data/behavior correct?
- are regressions present?
- does UX/UI fit approved requirements?
- does integration behave correctly?

## 4. Ownership

### Nomination

Use layered ownership:
```text
Coder
→ continuous self QA/QC

Reviewer
→ independent QA/QC evaluation at scheduled checkpoints

Tester
→ practical/exploratory QC evidence
```

Alternative:
central QA role.

Cost:
new role without distinct authority/workflow need.

Mark: REVIEW_REQUIRED.

## 5. Mandatory vs contextual checks

### Nomination

Universal families, contextual concrete checks.

Example:
COMPLIANCE always relevant, but lint is only relevant when stack/workflow has lint.

Mark: REVIEW_REQUIRED.

## 6. Skipped checks

Skipped applicable check must be explicit with reason.

Unavailable capability does not equal pass.

## 7. COLLECT candidates

- check family;
- concrete check;
- applicability;
- executor;
- result;
- evidence;
- skipped reason;
- target/revision.

### Nominated for REVIEW
1. No separate QA agent initially.
2. Coder self-check + Reviewer independent check + Tester practical evidence.
3. Universal families, contextual concrete checks.
