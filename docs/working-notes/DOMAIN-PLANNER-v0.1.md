# DOMAIN DETAIL — Planner v0.1

## Status

```text
PHASE = THEORY DETAIL
DOMAIN = PLANNER
STATUS = WORKING_DRAFT
CANONICAL = false
```

This document defines Planner semantics.

It intentionally separates **Planner theory** from the later Phase 2 Planner harness/skills/loops.

---

## 1. Planner purpose

Planner converts user intent and Project context into an implementation-ready definition of work without modifying source code.

Core purpose:

```text
understand
→ resolve material unknowns
→ reconstruct relevant reality
→ identify causal impact
→ define objective/scope/constraints
→ design executable workflow
→ produce plan + acceptance/evidence strategy
```

Planner should make reasonably knowable product/architecture/workflow information explicit before implementation depends on it.

---

## 2. Planner does not implement

Planner is read-only with respect to source code.

```text
Planner
→ may inspect owned/referenced repositories selectively
→ may write planning/control artifacts to durable Project Memory
→ may not implement source changes
```

Planner may propose changes, branches, files, migrations, contracts, or assets, but does not execute source implementation.

---

## 3. Planner input model

Planner may consume:

- current user request;
- Project identity/lifecycle;
- relevant prior decisions;
- current Jobs/Tasks when planning continuation/change;
- owned/referenced repo relationships;
- relevant architecture/contracts;
- prior review/test/retest findings;
- release/milestone state;
- relevant platform/domain knowledge;
- live GitHub evidence;
- capability/tool information;
- user-provided references/files.

Planner must not automatically read all Project memory or all repo source.

Context selection is request-driven and causal.

---

## 4. Planner output model

Depending on scope, Planner may produce or revise:

- product/change definition;
- scope/non-goals;
- architecture decision candidate;
- dependency/impact analysis;
- affected repo/component map;
- contract/migration requirements;
- implementation plan;
- Detailed Execution Plan / milestone topology;
- Task decomposition;
- verification strategy;
- acceptance criteria;
- Human Gates;
- review checkpoints;
- Tester checkpoints;
- asset requirements;
- design brief/coverage requirements;
- capability/executor requirements;
- risks/blockers;
- Causal Change Review options;
- release/change sequencing.

Not every Job requires every output.

Artifact count should scale with complexity while semantic obligations remain.

---

## 5. Planner causal workflow

### Nomination

Use a causal planning loop rather than a rigid numbered universal pipeline.

Preferred conceptual sequence:

```text
intent
→ Project/work context
→ known facts
→ missing material information
→ relevant source/evidence inspection
→ dependency/impact model
→ product/architecture decisions
→ work decomposition
→ workflow topology
→ acceptance/verification
→ plan consistency check
```

Rationale:

- causal order matters;
- exact number of stages varies by work;
- avoids turning old P0–P11 labels into mandatory ceremony.

Alternative:

Freeze one universal P0–P11 pipeline.

Benefit:
- predictable checklist.

Cost:
- may overfit different work types and become ritualistic.

Mark:

```text
REVIEW_REQUIRED
```

---

## 6. Requirement clarification boundary

Planner should resolve material ambiguity before dependent work begins.

Planner may safely infer only when:

- inference is low-impact;
- evidence strongly supports it;
- it does not change product/architecture intent;
- correction later would not cause material rework.

Otherwise Planner should route to human decision.

During actual runtime planning, unlike theory DETAIL, material product decisions may require user input before the plan can be approved.

---

## 7. Product/architecture authority

Planner may:

- identify options;
- analyze trade-offs;
- recommend a candidate;
- mechanically detail approved rules.

Planner may not silently decide human-owned product/architecture choices.

Accepted authority rule:

```text
semantic/product/architecture decision
→ Human

mechanical/system detailing after semantics fixed
→ GPT
```

A plan must distinguish:

- approved decision;
- nominated recommendation;
- assumption;
- unresolved blocker.

---

## 8. Repository analysis

Planner uses Drive-first Project context to decide what GitHub evidence is relevant.

```text
Project memory
→ current request
→ relevant owned/reference repo
→ relevant source area
→ selective read
```

Planner should inspect enough live source to ground implementation planning, but should not scan all repos by default.

Referenced repos remain read-only context.

Owned repo relationships define the possible write environment for downstream Coder Jobs.

---

## 9. Zero-repo planning

A Project may have zero owned repositories.

Therefore Planner must support:

```text
new Project
→ product/architecture/design planning
→ no owned repo yet
```

Planning is valid without GitHub when the requested work does not require source-grounded implementation planning yet.

Before a Code Job executes, required owned repo(s) must exist and relevant live source must be inspected.

---

## 10. Job planning

Planner may create/define a Job objective and workflow when work needs a finite execution boundary.

Planner should determine:

- Job objective;
- nominated Job type;
- scope;
- dependencies;
- Tasks if useful;
- milestone/stage topology;
- participating roles;
- allowed parallelism;
- review checkpoints;
- Human Gates;
- completion conditions;
- evidence strategy.

Planner does not force Task decomposition for trivial Jobs.

---

## 11. Detailed Execution Plan ownership

### Nomination

Planner owns the **workflow topology and implementation constraints**, while Coder may refine low-level source-specific execution steps after inspecting exact live code.

Preferred split:

```text
Planner
→ what / why / scope / architecture / dependencies
→ milestone topology
→ Task boundaries
→ acceptance
→ review/test/human gates
→ implementation constraints

Coder
→ exact local implementation HOW
→ concrete file/symbol sequence
→ helper decomposition
→ low-level execution detail
```

If Coder discovers a material architectural/scope mismatch, route back through Causal Change Review / planning gap rather than silently redesign.

Alternative:
Coder owns the entire Detailed Execution Plan after Planner only gives a broad implementation plan.

Benefit:
- closer to live source.

Cost:
- may let workflow/review topology emerge too late during implementation.

Mark:

```text
REVIEW_REQUIRED
```

---

## 12. Planner and role ordering

Planner determines role ordering from the work's causal structure.

There is no fixed universal:

```text
UX → UI
```

or:

```text
UI → UX
```

Examples:

Content/UI-first app:

```text
requirements/content
→ design coverage
→ UI architecture/shell
→ UX behavior integration
```

Interaction-first system:

```text
command/state/error model
→ UX contract
→ implementation
→ presentation layer
```

The plan must state the order before implementation begins.

---

## 13. Planner and specialist methodology

GSA core should define **when specialist work is required and what readiness/output contract is needed**, not absorb all specialist methodology.

Example:

```text
Planner identifies:
- material UI work
- Design Coverage required
- DESIGN_READY gate required
- specialist Designer/UI design skill required

Specialist design harness/skill defines:
- design methodology
- responsive audit
- visual system process
- component/state coverage procedure
```

This prevents GSA theory from accumulating ad-hoc domain-specific methodology.

---

## 14. UI-first planning responsibility

For UI-first work, Planner must ensure the plan includes enough coverage/readiness structure so implementation does not discover known screen/flow/state requirements accidentally.

Examples of planning-level obligations:

- identify known product flows;
- require Design Coverage inventory;
- require DESIGN_READY before dependent code;
- require representative implementation/pilot when useful;
- require Tester before SHELL_READY/scale-out where appropriate.

Planner does not itself have to perform all visual-design methodology.

---

## 15. Design readiness boundary

### Nomination

Planner owns **readiness orchestration**, Designer/specialist skill owns **visual design production**.

```text
Planner
→ identifies required design scope/gates/coverage

Designer
→ produces design artifacts/specification using specialist methodology

Planner/Reviewer
→ ensure required outputs exist before downstream dependency proceeds
```

Alternative:
Planner directly owns detailed UI/UX design package generation.

Benefit:
- one role controls everything.

Cost:
- blurs Planner vs Designer and embeds specialist design methodology in core.

Mark:

```text
REVIEW_REQUIRED
```

This nomination intentionally differs from older documents that said "Planner owns design readiness" in a broader, methodology-heavy sense. Later REVIEW should reconcile wording carefully.

---

## 16. Acceptance criteria

Planner defines observable acceptance criteria for the Job/Tasks where reasonably knowable.

Good criteria are:

- tied to user/product intent;
- observable;
- specific enough to verify;
- not implementation-prescriptive unless architecture requires it;
- mapped to evidence/test path.

Avoid:

```text
"make it good"
"works correctly"
"looks nice"
```

Prefer concrete behavior/state/result.

Subjective criteria should identify Human Review rather than masquerading as objective acceptance.

---

## 17. Verification strategy

Planner should define how acceptance can be verified.

Possible sources:

- static inspection;
- CI/build/test;
- preview/runtime;
- screenshot/rendered evidence;
- integration checks;
- Tester scenarios;
- user practical Retest;
- external system confirmation.

If verification capability is unavailable:

```text
do not fake PASS
→ design best available online evidence
→ use PASS_RETEST_REQUIRED when appropriate
```

---

## 18. Capability/executor planning

Every executable plan step should have a plausible executor/capability path.

Planner distinguishes:

- documented/available;
- observed;
- unknown;
- unavailable.

Unknown capability is not treated as available.

If an essential execution step has no executor, Planner must surface the blocker or redesign the plan.

---

## 19. Risk model

Planner should record material risks that can affect:

- architecture;
- data;
- migration;
- compatibility;
- multi-repo coordination;
- verification;
- destructive operations;
- dependency timing;
- external platform assumptions;
- UI shell/readiness;
- asset availability.

Risk tracking should remain proportional.

Do not create ritual risk registers for trivial work unless they add value.

---

## 20. Planner and Asset Requirements

Planner may identify that assets are required and define functional integration needs.

Designer or later specialist process may refine visual assets.

For non-visual assets such as audio, Planner may define stable integration contract where appropriate:

- purpose;
- source text/content;
- expected filename/path contract;
- format constraints;
- placeholder/fallback need;
- acceptance requirement.

Exact Asset Requirement entity semantics are defined separately.

---

## 21. Planner and parallelism

Planner should identify independent work that can proceed in parallel.

It must also identify:

- write conflicts;
- causal dependencies;
- shared contract dependencies;
- one Job changing assumptions of another.

Parallelism must be explicit enough to prevent separate chats from assuming independence incorrectly.

---

## 22. Planner and Causal Change Review

When an approved upstream decision changes, Planner may perform/assist Causal Change Review:

```text
identify exact change
→ trace dependencies
→ classify affected/unaffected work with reasons
→ propose minimum repair
→ propose lower-impact options
→ identify trade-offs
→ route material choice to Human
→ update plan/topology after decision
```

Do not blanket-mark all downstream artifacts stale.

---

## 23. Planner completion

Planner Run/Job is complete when applicable planning obligations are sufficient for the next stage.

Completion does not mean every possible future detail is known.

It means downstream work does not need to invent material product/architecture/workflow rules that were reasonably knowable beforehand.

Potential completion checks:

- objective clear;
- scope/non-goals clear;
- material dependencies identified;
- architecture/contract impacts handled;
- unresolved human decisions surfaced;
- workflow topology defined;
- acceptance criteria defined;
- verification strategy defined;
- capability blockers identified;
- specialist readiness gates defined;
- next handler clear.

Exact checklist becomes Phase 2 harness material after theory review.

---

## 24. Planning gaps discovered later

If downstream execution discovers information that invalidates the plan:

```text
new fact
→ assess causal impact
→ local implementation detail? Coder handles
→ material plan/architecture/scope change? planning gap / Causal Change Review
```

Planner is not expected to predict unknowable future source/runtime facts.

The rule is:

```text
reasonably knowable before implementation
→ Planner responsibility

only discoverable during execution
→ downstream role may discover and escalate appropriately
```

---

## 25. Planner evidence/provenance

Important planning claims should distinguish:

- user requirement;
- repository evidence;
- existing Project decision;
- platform/documentation evidence;
- inference;
- nomination/recommendation.

The plan should be reviewable without relying on hidden chain-of-thought.

Causal explanation should be concise and externally inspectable.

---

## 26. Planner hard boundaries

Planner must not:

- modify source code;
- merge/deploy;
- impersonate Reviewer acceptance;
- claim runtime verification it did not perform;
- convert subjective preference into binding objective truth;
- silently expand Project repository ownership;
- silently rewrite approved architecture;
- make Coder the first discoverer of clearly knowable required product behavior;
- nominate physical storage merely because a semantic entity exists.

---

## 27. Planner direct mode

Planner may be invoked through Direct Agent for small standalone planning tasks without creating a Project.

### Nomination

Direct Planner may operate ephemerally unless the user explicitly promotes/saves the work into a Project.

Rationale:
- preserves lightweight Direct Agent purpose;
- avoids automatic Project creation.

Alternative:
Always persist Direct Planner outputs in a global area.

Cost:
- introduces storage/registry complexity without clear need.

Mark:

```text
REVIEW_REQUIRED
```

---

## 28. Planner does not define physical storage yet

This pass does NOT nominate:

- plans/ folder;
- PLAN.md naming;
- architecture folder;
- risk files;
- design brief file names;
- Task files;
- indexes.

Later COLLECT must compare all role/output persistence needs before storage synthesis.

---

## 29. Existing-document reconciliation candidates

Older Planner documents contain useful ideas but also likely need reconciliation with current theory:

- fixed P0–P11 pipeline may be too rigid;
- broad Planner-owned UI methodology should move toward specialist-skill delegation;
- pre-nominated UI/UX file trees violate current storage meta-rule;
- Job-as-top-level model is obsolete;
- Tester/readiness roles were not fully represented;
- review placement must follow topology, not universal gate sequence.

Preserve useful semantics while fixing obsolete structure later.

---

## 30. Planner invariants — current detail pass

1. Planner does not implement source.
2. Planner prepares reasonably knowable material before downstream execution.
3. Planner is Drive-first and selectively source-grounded.
4. Planner may operate before any repo exists.
5. Planner distinguishes human-owned decisions from mechanical detailing.
6. Planner defines objective/scope/dependencies/workflow/acceptance/verification.
7. Planner determines role ordering from causal structure.
8. Planner coordinates specialist readiness rather than absorbing all specialist methodology.
9. Planner identifies capability/executor feasibility.
10. Planner may define parallel-safe work and conflicts.
11. Planner supports Causal Change Review.
12. Planner does not fake unavailable evidence.
13. Planner output should be externally reviewable without hidden reasoning.
14. Physical artifact layout is deferred.
15. Planner direct mode does not automatically require Project creation.

---

## 31. DETAIL output — candidates for later COLLECT

### Contract candidates

- Planner required input packet;
- planning output obligations by Job type;
- planning completion/readiness checklist;
- capability resolution requirement;
- acceptance/evidence mapping;
- Causal Change Review responsibilities;
- role-order/topology output;
- specialist routing/readiness contract.

### Storage candidates

- plan/version lineage;
- architecture/decision references;
- acceptance criteria;
- verification strategy;
- dependency/workflow topology;
- nominated decisions/assumptions;
- risk/blocker state.

### Nominated for REVIEW

1. Use causal planning loop, not frozen universal P0–P11 ceremony.
2. Planner owns workflow topology/constraints; Coder refines exact source-level HOW.
3. Planner owns design-readiness orchestration; Designer/specialist skills own detailed design methodology.
4. Direct Planner is ephemeral unless user promotes/persists it.
5. Preserve planning output revision lineage rather than overwrite historically significant versions.

