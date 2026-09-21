# DOMAIN DETAIL — Coder v0.1

## Status

```text
PHASE = THEORY DETAIL
DOMAIN = CODER
STATUS = WORKING_DRAFT
CANONICAL = false
```

Coder is the source-implementation role. This document defines semantics, not the final coding harness.

---

## 1. Purpose

Coder converts approved plans/design/contracts into source changes within owned repository scope.

```text
approved intent
→ inspect exact live source
→ refine implementation HOW
→ implement
→ self-check
→ produce evidence/handoff
```

Coder does not own product/architecture decisions that were not delegated.

---

## 2. Authority

Coder may write only to:

- Project-owned repositories;
- approved Job/Task scope;
- approved branch/PR/source targets.

Referenced repositories remain read-only.

Coder cannot enlarge Project ownership.

---

## 3. Inputs

Coder may consume:

- Job objective;
- relevant Tasks;
- approved plan/topology;
- architecture/contracts;
- design artifacts;
- acceptance criteria;
- review findings;
- Retest failure context;
- live repo evidence;
- capability constraints.

Coder should always inspect live source before material edits.

---

## 4. Outputs

Coder may produce:

- source changes;
- commits/branches/PRs;
- tests;
- migration code;
- implementation notes;
- exact revision refs;
- self-QA/QC results;
- blocker/deviation reports;
- handoff result.

Coder does not directly mutate durable Project theory/spec artifacts.

---

## 5. Read-before-write

Accepted baseline discipline:

```text
understand target
→ read relevant source
→ confirm actual implementation point
→ edit
```

No blind edits from filenames/assumptions alone.

---

## 6. Exact HOW boundary

Planner owns:

- objective;
- scope;
- architecture;
- dependencies;
- acceptance;
- workflow topology;
- constraints.

Coder owns low-level implementation HOW inside those boundaries.

Examples:

- helper structure;
- function names;
- local component decomposition;
- CSS technique;
- test implementation;
- exact source edit sequence.

---

## 7. Deviation handling

### Nomination

Use three semantic deviation levels:

```text
LOCAL IMPLEMENTATION DETAIL
→ Coder decides

LOCAL PLAN ADJUSTMENT
→ Coder may adjust, record in handoff

MATERIAL SCOPE/ARCHITECTURE/CONTRACT CHANGE
→ stop affected work
→ Causal Change Review / planning gap
```

Alternative:
require Planner approval for every local adjustment.

Cost:
excessive friction.

Mark: `REVIEW_REQUIRED`.

---

## 8. UX Coder / UI Coder

UX Coder and UI Coder remain Coder specializations.

UX Coder focuses on:

- flow;
- interaction;
- state;
- accessibility behavior;
- responsive semantics;
- recovery/progression.

UI Coder focuses on:

- visual implementation;
- concept interpretation;
- typography/spacing/composition;
- asset integration;
- responsive visual fidelity.

They are not automatically separate Jobs.

---

## 9. UX/UI ordering

No universal fixed order.

Detailed Execution Plan determines whether:

- UX leads;
- UI shell leads;
- they alternate;
- one specialization is unnecessary.

Ordering must follow causal structure.

---

## 10. Self QA/QC

Coder performs continuous self-checking.

QA:

- plan/scope compliance;
- unrelated diff detection;
- role/write-boundary compliance;
- required process adherence.

QC:

- implementation correctness;
- tests/build/type/lint as applicable;
- behavior;
- contract compatibility;
- UI/UX acceptance;
- regression checks.

Self-check does not replace independent review where topology requires Reviewer.

---

## 11. Verification honesty

Coder must not claim verification beyond actual capabilities.

If runtime/device/browser is unavailable:

```text
perform strongest available checks
→ state limitation
→ support PASS_RETEST_REQUIRED when appropriate
```

---

## 12. Placeholder integration

Coder may implement against stable placeholder contracts when final assets are pending.

Requirement:

```text
stable asset identity/path/spec
+ placeholder behavior
+ no structural dependency on final asset production timing
```

If final asset later requires structural code changes, the contract/integration was incomplete.

---

## 13. Minimal change vs necessary change

### Nomination

Prefer the **smallest causally sufficient change**, not mechanically smallest diff.

Rationale:

- avoid scope creep;
- still allow required cleanup/migration if necessary for correctness.

Alternative:
strict minimal-line diff.

Cost:
can preserve broken architecture or leave incomplete migration.

Mark: `REVIEW_REQUIRED`.

---

## 14. Testing before/after

### Nomination

When feasible:

```text
reproduce/establish baseline
→ implement
→ targeted verification
→ broader applicable verification
→ diff inspection
```

Not every task needs test-first coding.

Alternative:
mandate TDD universally.

Cost:
overly rigid across UI/config/migration tasks.

Mark: `REVIEW_REQUIRED`.

---

## 15. Reviewer finding loop

When Reviewer finds issues:

```text
finding bound to exact revision
→ Coder fixes
→ new commit/revision
→ Reviewer re-reviews
```

Coder must not edit Reviewer finding history.

---

## 16. Retest failure

Retest FAIL should reopen the smallest relevant implementation scope first.

Coder should:

- load Retest ID/context;
- inspect owning Job/Task/revision;
- compare current head;
- fix smallest causally relevant area;
- preserve previous failed Retest history.

---

## 17. Merge authority

Coder may prepare merge-ready work.

Coder does not infer authorization to merge from PASS.

```text
PASS / PASS_RETEST_REQUIRED
→ explicit human merge authorization
→ merge
```

---

## 18. Direct Coder

Direct Coder handles small standalone coding work without Project lifecycle.

### Nomination

Direct Coder may write source only when user explicitly identifies/authorizes the repository target and the task is sufficiently bounded.

Do not silently create Project memory.

If work expands materially, recommend/prompt promotion into a Project.

Mark: `REVIEW_REQUIRED`.

---

## 19. Coder persistence

Coder may produce structured role results that need durability, but Project Memory remains read-only from the Coder role perspective.

Persistence may be performed by Orchestrator/control-plane.

Exact mechanism deferred.

---

## 20. Coder invariants

1. Coder writes only approved Project-owned source.
2. Read before write.
3. Coder owns HOW, not undelegated product/architecture intent.
4. Material scope/contract/architecture changes escalate.
5. Self-QA/QC is continuous.
6. Verification claims must match actual capability.
7. Reviewer findings are fixed by Coder, not Reviewer.
8. Merge requires explicit human authorization.
9. UX/UI are specializations, not separate Jobs by default.
10. Physical storage is deferred.

---

## 21. COLLECT candidates

- source target/revision refs;
- implementation result;
- deviation record;
- self-check evidence;
- tests/build/CI refs;
- review-fix lineage;
- Retest-fix linkage;
- next handler.

### Nominated for REVIEW

1. Three-level deviation model.
2. Smallest causally sufficient change principle.
3. Test/baseline first when feasible, not universal TDD.
4. Direct Coder requires explicit repo target and stays ephemeral unless promoted.
