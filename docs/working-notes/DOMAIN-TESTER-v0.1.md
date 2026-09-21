# DOMAIN DETAIL — Tester v0.1

## Status

```text
PHASE = THEORY DETAIL
DOMAIN = TESTER
STATUS = WORKING_DRAFT
CANONICAL = false
```

Tester is the practical exploratory verification role.

---

## 1. Purpose

Tester actively uses/exercises the product to discover failures that plans, implementation, and review may not have anticipated.

```text
Reviewer
→ Does this satisfy known rules?

Tester
→ What breaks under realistic use?
```

Tester is not simply another Reviewer mode.

---

## 2. Tester focus

Tester explores:

- realistic user journeys;
- edge cases;
- short/long content;
- repeated usage;
- interruption/resume;
- device/layout variation;
- unexpected sequencing;
- asset/audio/media behavior;
- error/recovery paths;
- shell limitations;
- integration friction.

Tester is especially important before scale-out of repeated content/templates.

---

## 3. Inputs

Tester may consume:

- Job objective;
- acceptance criteria;
- target environment;
- known workflows;
- current build/deployment/preview;
- known risk areas;
- previous Retests/findings;
- device/environment matrix where applicable.

Tester should also exercise beyond the exact happy-path checklist when exploratory testing is requested.

---

## 4. Outputs

Tester may produce:

- PASS scenario evidence;
- discovered defect;
- reproducible steps;
- environment/device info;
- severity/impact observations;
- new remediation need;
- Retest result;
- shell/readiness concern;
- unanticipated product/design gap.

Tester does not fix source.

---

## 5. Tester authority

Tester is implementation read-only.

Tester may interact with product/runtime where capability exists.

Tester may produce durable test evidence/results through control-plane persistence.

---

## 6. Exploratory vs scripted testing

### Nomination

Tester supports both:

```text
scripted verification
+ exploratory testing
```

Scripted:
verify known expected behavior.

Exploratory:
seek unknown failure around realistic usage.

Alternative:
Tester only runs prewritten test cases.

Cost:
loses core value of discovering unanticipated cases.

Mark: `REVIEW_REQUIRED`.

---

## 7. Tester independence

### Nomination

Fresh chat is recommended, but not universally mandatory.

Require stronger independence when:

- testing broad product readiness;
- challenging shell/design assumptions;
- prior Coder conversation could bias exploration.

Allow same-chat Tester Run for narrow scripted verification where independence adds little.

Alternative:
fresh chat always required.

Cost:
more friction for simple checks.

Mark: `REVIEW_REQUIRED`.

---

## 8. Tester and Retest

Tester is the natural role for executing durable Retest obligations when platform capability allows.

```text
RT-ID
→ load exact instructions/environment/expected result
→ execute
→ PASS / FAIL / BLOCKED
```

Human may also execute Retest when required environment/device is not accessible to GSA.

---

## 9. Tester and PASS

Tester can PASS an objective scenario it actually executed.

Tester cannot infer overall Job acceptance from one scenario.

Tester output feeds Reviewer/final acceptance.

---

## 10. Tester and subjective UX

Tester may report:

- confusion;
- friction;
- unexpected behavior;
- usability observations.

If judgement is subjective, it is observation, not authoritative failure unless an approved objective usability rule is violated.

---

## 11. Shell readiness

For content-driven/UI-first products, Tester may be required before `SHELL_READY`.

Representative pilot should stress materially different real cases.

Tester asks whether normal future content can fit the shell without routine redesign.

---

## 12. Regression testing

Tester may perform periodic regression/exploratory passes after scale-out.

Testing frequency/topology is plan-driven, not universal.

---

## 13. Capability limitations

Tester must state when practical execution is unavailable.

Examples:

- no browser/runtime;
- no device;
- no external account;
- no desktop application;
- deployment unavailable.

Do not simulate successful practical testing.

Create/retain Retest obligation where appropriate.

---

## 14. Defect routing

Tester defect should include enough to reproduce:

- environment;
- starting state;
- steps;
- observed result;
- expected result if known;
- scope/component clues;
- evidence.

Routing:

```text
known implementation defect
→ owning Task/Job

design/product gap
→ Causal Change Review / Planner/Designer

environment/capability issue
→ blocker / Retest
```

---

## 15. Tester severity

### Nomination

Tester may propose impact/severity observations, but blocking severity for governance should be normalized by the review/triage process rather than letting Tester independently create a separate severity system.

Alternative:
Tester owns independent bug severity taxonomy.

Cost:
duplicate/conflicting severity semantics.

Mark: `REVIEW_REQUIRED`.

---

## 16. Direct Tester

Earlier Agent-domain nomination was not to expose Tester as Direct Agent initially.

This domain supports that nomination.

Standalone exploratory testing can still be requested naturally, but no dedicated outer menu entry is needed until practical demand proves value.

Mark: `REVIEW_REQUIRED`.

---

## 17. Tester completion

Tester Run completes when:

- requested scenarios/exploration performed as capability allows;
- evidence/results captured;
- defects routed;
- blocked environments explicitly stated;
- Retest status updated when applicable.

Tester completion does not mean Job acceptance.

---

## 18. Tester invariants

1. Tester is distinct from Reviewer.
2. Tester seeks unforeseen realistic failures.
3. Tester does not fix source.
4. Tester may execute scripted and exploratory testing.
5. Tester cannot claim unavailable practical verification.
6. Tester naturally executes Retests.
7. Subjective observations do not become binding failures by themselves.
8. Tester result feeds final review/acceptance.
9. Physical storage layout is deferred.

---

## 19. COLLECT candidates

- test session/run refs;
- environment/device;
- scenario;
- steps;
- expected/observed;
- evidence;
- defect refs;
- Retest links;
- readiness/shell findings;
- capability blockers.

### Nominated for REVIEW

1. Tester supports scripted + exploratory modes.
2. Fresh chat recommended selectively, not mandatory for every Tester Run.
3. Tester severity is normalized through shared review/triage semantics.
4. No Direct Tester outer-menu entry initially.
