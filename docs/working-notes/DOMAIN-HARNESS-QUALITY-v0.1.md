# DOMAIN DETAIL — Harness Quality Loop v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = HARNESS QUALITY LOOP
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Purpose

Improve Phase 2+ harnesses/skills/loops/actions from real Project outcomes.

GSA is not treated as a standalone coded runtime with internal telemetry sufficient to diagnose behavioral quality.

## 2. Evidence

Useful calibration signals:
- repeated user corrections;
- requirement drift;
- scope expansion;
- missed Reviewer defect;
- Tester-discovered issue;
- weak tool use;
- unnecessary ceremony;
- asset contract success/failure;
- rework count/pattern;
- output quality.

## 3. Calibration action

Accepted:
```text
too loose + poor quality → tighten
too strict + friction/no gain → relax
missing capability/action → add
ineffective loop → revise/remove
strong pattern → preserve/strengthen
```

## 4. Defect record

### Nomination

A behavioral harness defect should capture:
- observed output;
- expected output;
- failure class;
- owner module;
- rule gap;
- smallest proposed fix;
- eval case;
- rerun result.

No need for heavyweight telemetry system initially.

Mark: REVIEW_REQUIRED.

## 5. Theory gap vs harness defect

```text
bad execution of existing theory
→ harness/skill/loop fix

genuine missing semantic rule
→ theory revision via governance
```

## 6. COLLECT candidates

- defect/eval identity;
- owner module;
- observed/expected;
- fix;
- enforcement level;
- before/after result.

### Nominated for REVIEW
1. Lightweight behavioral defect/eval record.
2. Optimize from real outcomes, not speculative complexity.
3. Distinguish theory gap from harness implementation gap.
