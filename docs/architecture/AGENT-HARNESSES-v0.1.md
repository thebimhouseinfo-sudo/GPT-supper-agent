# Agent Contracts v1

## 1. Shared role model

```text
Role
= responsibility + authority + boundaries + outputs

Run
= one execution attempt with one active role

Agent
= user-facing/specialist harness implementing a role
```

Current roles:

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

---

## 2. Shared authority rule

```text
tool capability
≠ role authority
```

Effective authority:

```text
Project policy
∩ Job scope
∩ Task scope
∩ role boundary
∩ Run target
∩ human approvals
∩ actual executor capability
```

---

## 3. Planner

Planner:
- reads Project Memory and selective live source;
- writes durable planning/knowledge artifacts;
- does not modify source;
- defines objective/scope/architecture/dependencies;
- defines Job/milestone topology;
- defines acceptance/verification;
- coordinates specialist readiness;
- supports Causal Change Review.

Planner uses causal planning logic, not mandatory P0–P11 ceremony.

---

## 4. Designer

Designer:
- reads product/design context and relevant source evidence;
- writes design artifacts/Asset Requirements;
- does not modify source;
- owns visual interpretation and design coverage;
- uses specialist design skills/harness;
- does not silently change product behavior.

Concept-first is the normal default, not universal law.

---

## 5. Coder

Coder:
- reads approved Project context;
- writes approved Project-owned source;
- refines exact implementation HOW;
- performs continuous self QA/QC;
- may make local implementation/local plan adjustments within boundaries;
- escalates material scope/architecture/contract changes;
- fixes Reviewer findings;
- does not infer merge authority.

UX/UI Coder are Coder specializations, not separate Jobs by default.

---

## 6. Reviewer

Reviewer:
- uses fresh chat when independent review is required;
- reads exact target/revision and applicable evidence;
- source implementation is read-only;
- may use normal PR review/comment surfaces;
- produces findings/results;
- does not fix source.

Reviewer is inserted only where topology requires independent review.

No universal final Reviewer gate exists.

---

## 7. Tester

Tester:
- practically exercises the product;
- runs scripted and exploratory testing;
- seeks unforeseen realistic failures;
- source implementation is read-only;
- may execute Retests when capability allows;
- reports subjective usability observations without converting them into binding objective failure unless an approved rule is violated.

Fresh chat is selective, not universal.

---

## 8. Orchestrator

Orchestrator:
- owns routing/transition governance;
- persists handoffs/control-plane state;
- coordinates Human Gates/capabilities/conflicts;
- does not implement source;
- is an implicit system role, not ordinary Direct Agent.

---

## 9. Direct Agent

Initial outer Direct Agents:

```text
Planner
Designer
Coder
Reviewer
```

Direct Agent work:
- no automatic Project creation;
- ephemeral by default;
- may be promoted/persisted when work grows;
- Direct Coder requires clearly authorized repo target.
- If the target repo is already OWNED by a Project, Direct Coder must route into that owning Project instead of writing standalone.
- If the repo is unowned by GSA, Direct Coder may perform an explicitly authorized bounded one-off change without automatically claiming ownership.

Tester and Orchestrator are not outer entries initially.

---

## 10. Context discipline

Each role receives minimum sufficient context.

Do not indiscriminately load:
- full Project;
- full repo;
- full chat history.

Reviewer/Tester context may be deliberately isolated for independence.

---

## 11. Handoff

Roles cooperate via durable Handoff when work crosses Runs.

Handoff includes enough to identify:
- owning work;
- source Run;
- next role;
- exact target/revision;
- completed/remaining work;
- blocker/gate;
- expected next outcome.

---

## 12. Evidence discipline

Important outputs are attributable to:

```text
role
+ Run
+ owning work context
+ exact target/revision
```

No role may claim unavailable verification.

---

## 13. Human authority

Human owns:
- material product behavior;
- architecture direction;
- governance/authority;
- major trade-offs;
- subjective acceptance;
- merge/release authorization when required.

Roles may analyze/recommend/nominate but do not silently convert recommendation into human decision.

---

## 14. Phase 2 harness maturity

These contracts define semantics.

Exact prompts, skills, loops, actions, tool-use procedures belong to Phase 2 and will be calibrated from real Projects.
