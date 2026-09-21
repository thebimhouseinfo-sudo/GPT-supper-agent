# DOMAIN DETAIL — Agents v0.1

## Status

```text
PHASE = THEORY DETAIL
DOMAIN = AGENTS
STATUS = WORKING_DRAFT
CANONICAL = false
```

This document defines shared semantics for GPT Super Agent roles before individual role contracts are detailed.

It does not yet define final harness prompts, specialist skills, tool procedures, physical storage, or CLI syntax.

---

## 1. Agent vs role vs Run

For GSA theory, the important execution concept is **role**.

```text
Role
= responsibility + authority + boundaries + expected outputs

Run
= one execution attempt using exactly one active role

Agent
= a user-facing/specialized harness that instantiates a role
```

A Job may use many roles.

One Run has one active role.

A role is not equivalent to one permanent autonomous software process.

---

## 2. Current role set

Current system-level roles:

```text
Orchestrator
Planner
Designer
Coder
  ├── UX Coder
  └── UI Coder
Reviewer
Tester
```

UX Coder and UI Coder are specializations of Coder, not automatically separate Jobs.

Tester is distinct from Reviewer.

The exact future set is extensible, but new roles should not be invented merely for symmetry.

---

## 3. Shared role contract

Every role must eventually define:

- purpose;
- responsibilities;
- non-responsibilities;
- required inputs;
- optional inputs;
- allowed reads;
- allowed writes/actions;
- clarification/escalation rules;
- expected outputs;
- completion conditions;
- evidence obligations;
- handoff behavior;
- failure/blocker behavior;
- independence requirements;
- specialist skill dependencies;
- applicable tool-use rules.

These are semantic obligations.

The exact prompt/harness wording belongs to Phase 2.

---

## 4. Authority is role-scoped, not tool-scoped

A connector exposing an action does not imply every role may use it.

```text
tool capability
≠ role authority
```

Effective authority is constrained by:

```text
Project policy
∩ Job scope
∩ Task scope
∩ role boundary
∩ Run target
∩ human approvals
∩ actual connector/platform capability
```

A role must not perform an action merely because a tool technically permits it.

---

## 5. Read/write boundary model

Accepted target intent:

```text
Planner
→ durable Project Memory write
→ GitHub source read-only/selective

Designer
→ design workspace / durable Project Memory write
→ GitHub source read-only

Coder
→ approved owned GitHub source write
→ Project Memory definitions/plans read-only

Reviewer
→ GitHub source read-only
→ normal review/comment surfaces allowed
→ durable review result may be persisted

Tester
→ product/runtime exercise
→ source implementation read-only
→ test result/evidence may be persisted

Orchestrator
→ workflow/control-plane state
→ no source implementation
```

These are policy boundaries.

At plugin-only level, enforcement may be SOFT unless a platform/tool mechanism can make it HARD.

The later capability/enforcement pass must classify each important boundary.

---

## 6. Durable write vs role result

A role does not necessarily need direct write access to every durable store in order to produce durable information.

Semantic separation:

```text
Role produces structured result
→ Orchestrator/control-plane persistence may store it
```

This is especially important for Coder, whose Project Memory role is read-only but whose execution may produce facts that must survive:

- blocker;
- deviation;
- exact target/revision;
- completion result;
- verification evidence;
- next handler.

Final transport/persistence mechanism is deferred to Handoff + Storage synthesis.

---

## 7. Clarification rule

All roles share a causal clarification discipline:

```text
known facts
→ missing information
→ causal impact
→ infer if safe
→ ask/escalate if material
→ proceed
```

A role must not:

- ask for information already available in current context;
- invent material product/architecture intent;
- treat unverified capability as available;
- silently expand scope.

However, during **theory DETAIL**, GSA architecture questions follow the meta-rule:

```text
nominate
→ record alternatives/trade-offs
→ REVIEW later
```

This should not be confused with runtime execution clarification.

---

## 8. Role context isolation

Each role should receive the context relevant to its responsibility rather than the entire Project/chat history.

Principle:

```text
minimum sufficient role context
> indiscriminate context dumping
```

Reasons:

- reduce distraction;
- improve independence;
- reduce stale/conflicting instruction leakage;
- preserve role boundaries;
- reduce context cost;
- make outputs easier to attribute.

Exact context-packet construction belongs to Context Builder domain.

---

## 9. Role independence

Independence is not universal.

Current accepted rule:

```text
independent Reviewer Run
→ fresh chat
```

Other role transitions may happen in the same chat when independence is not required.

Tester may also require independent/fresh context for certain exploratory evaluations, but this is nominated for later review rather than frozen here.

---

## 10. Handoff principle

Roles cooperate through explicit work state rather than implicit conversational memory.

```text
Role A Run
→ output/result
→ durable handoff when needed
→ Role B Run
```

A handoff should preserve enough information for Role B to know:

- what work it received;
- exact target/revision;
- applicable approved inputs;
- what Role A completed;
- what remains;
- blockers;
- expected next outcome.

Exact handoff schema is deferred.

---

## 11. Human relationship

Roles do not replace human authority.

Human-owned decisions include:

- material product behavior;
- architecture direction;
- governance/authority;
- major trade-offs;
- subjective acceptance where no objective rubric exists;
- merge/release authorization when required.

Roles may recommend, analyze, or nominate options.

They do not silently convert recommendation into human decision.

---

## 12. Role-specific objective evaluation

When a criterion is objective and evidence-backed, the responsible verification role may evaluate it.

When a criterion is inherently subjective:

```text
→ observations/recommendations
→ HUMAN_REVIEW_REQUIRED
```

A prior human-approved concrete rubric/reference may turn some otherwise subjective space into objectively reviewable criteria.

---

## 13. Shared evidence discipline

Important role outputs should be attributable to:

```text
role
+ Run
+ owning work context
+ exact target/revision
```

Evidence should distinguish:

- observed fact;
- inference;
- user-provided fact;
- external/tool evidence;
- unavailable/unverified condition.

No role may claim verification it could not actually perform.

---

## 14. Failure and blocker discipline

A role that cannot proceed safely should produce an explicit blocker rather than fabricate success.

Typical blocker causes:

- missing required decision;
- unavailable capability;
- inaccessible target;
- conflicting approved artifacts;
- stale dependency;
- write permission unavailable;
- required Human Gate pending.

Exact blocker taxonomy is deferred to Failure/Recovery + State synthesis.

---

## 15. Role specialization vs new role

A specialization should be preferred when responsibility is a narrower mode of an existing role.

Example:

```text
Coder
├── UX Coder
└── UI Coder
```

A new first-class role is justified only when there is materially distinct:

- responsibility;
- authority boundary;
- evidence model;
- independence requirement;
- workflow position;
- completion semantics.

This prevents unnecessary role proliferation.

---

## 16. Direct Agent mode

Current outer control surface includes Direct Agent for:

- Planner;
- Designer;
- Coder;
- Reviewer.

Direct Agent means:

```text
invoke specialist harness directly
→ small standalone task
→ no automatic Project creation
```

### Nomination: Tester in Direct Agent

Preferred:

```text
do NOT add Tester to Direct Agent outer menu initially
```

Rationale:

- meaningful Tester work usually needs a product/runtime target and expected behavior context;
- Tester is most useful inside Project/Job workflow;
- avoid expanding the outer landing page before empirical need is proven.

Alternative:

Add Tester as a fifth Direct Agent immediately.

Benefit:
- user can request standalone exploratory testing.

Cost:
- expands the top-level UX and may produce context-poor tests.

Mark:

```text
REVIEW_REQUIRED
```

---

## 17. Orchestrator status

Orchestrator is a system role, not necessarily a user-selectable Direct Agent.

### Nomination

```text
Orchestrator
→ implicit harness/control-plane role
→ not exposed as ordinary Direct Agent
```

Rationale:

- user normally invokes GSA/Project/Agent operations rather than asking for "Orchestrator" work;
- its job is routing/state/governance, not specialist deliverables.

Alternative:

Expose Orchestrator directly for workflow repair/status management.

Potential value exists, but should be proven before adding surface complexity.

Mark:

```text
REVIEW_REQUIRED
```

---

## 18. Role result immutability / revision

Role outputs may evolve through later Runs.

### Nomination

Do not overwrite historically significant accepted/reviewed results as though earlier versions never existed.

Prefer:

```text
new Run
→ new/revised result
→ preserve lineage to prior result
```

Alternative:
mutate latest result in place.

Benefit:
- simpler storage.

Cost:
- weakens review/evidence provenance.

Mark:

```text
REVIEW_REQUIRED
```

---

## 19. Role harness lifecycle

Theory and operational harness have different maturity expectations.

```text
Phase 1
→ role semantics/contracts must become complete

Phase 2
→ initial harness/skills/loops/actions only need coherent usable baseline

Phase 3+
→ calibrate from real Project evidence
```

Therefore individual Agent domain documents should define **what the role means**, not attempt to perfect prompts or tool loops now.

---

## 20. Existing-document inconsistency candidates

Older architecture/harness documents currently contain assumptions that may conflict with later accepted theory, including examples such as:

- Job as top-level Drive root;
- missing Tester in the shared role model;
- fixed or overly universal review sequences;
- broad Planner ownership of UI methodology rather than specialist-skill delegation;
- suggested physical design folders/files nominated before full storage collection.

Do not patch these piecemeal during DETAIL.

Collect them for system-wide REVIEW/FIX.

---

## 21. Agent invariants — current detail pass

1. One Run has one active role.
2. A Job may use many roles.
3. Tool availability does not imply role authority.
4. Role authority is constrained by Project/Job/Task/Run/human governance.
5. Roles receive minimum sufficient context, not indiscriminate full context.
6. Reviewer independence requires fresh chat.
7. Durable handoff must not depend on chat history.
8. Subjective binding judgments belong to humans unless concrete objective rubric exists.
9. Important outputs require role/Run/target attribution.
10. No role may claim unavailable verification.
11. Coder source write is limited to approved owned source scope.
12. Reviewer does not fix implementation source.
13. Tester is distinct from Reviewer.
14. Orchestrator owns workflow/control-plane logic, not source implementation.
15. Harness implementation detail is Phase 2, not Phase 1 theory.
16. Physical storage for role outputs is deferred.

---

## 22. DETAIL output — candidates for later COLLECT

### Shared contract candidates

- role identity;
- role purpose;
- read/write authority;
- required inputs;
- outputs;
- evidence obligations;
- handoff obligations;
- independence requirement;
- failure/blocker behavior;
- specialist skill dependencies;
- tool-use boundary.

### Storage candidates

- role-result persistence;
- role/run attribution;
- handoff records;
- findings/results;
- context packet references;
- revision lineage.

### CLI candidates

Already accepted Direct Agent roles:
- Planner;
- Designer;
- Coder;
- Reviewer.

Do not add more commands now.

### Nominated for REVIEW

1. Tester not exposed as Direct Agent initially.
2. Orchestrator remains implicit/system role.
3. Historically significant role results preserve revision lineage rather than overwrite.

