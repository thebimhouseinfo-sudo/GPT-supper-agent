# Agent Contracts

## 1. Shared role model

```text
Role = responsibility + authority + boundaries + outputs
Run = one execution attempt with one active role
Agent = user-facing/specialist harness implementing a role
```

Roles:
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

All roles may act through the user's same connected platform identity; role attribution comes from explicit Run signatures, not account identity.

## 2. Shared authority

```text
tool surface ≠ observed capability ≠ role authority
```

Effective authority is the intersection of Project/Job/Task/role/Run/human/capability boundaries.

## 3. Planner

Planner:
- reads Project Memory and selective live source;
- writes planning/knowledge;
- defines objective/scope/architecture/dependencies;
- defines topology and completion/evidence requirements;
- schedules normal review/test/human checkpoints;
- ensures mechanical mandatory review classification is configured;
- supports Causal Change Review.

## 4. Designer

Designer:
- source read-only;
- owns visual interpretation/design coverage;
- writes design/asset-requirement outputs;
- does not silently change product behavior.

Designer may run as a child Run from Coder when independence is not required.

## 5. Coder

Coder:
- reads approved Project context;
- writes approved Project-owned source;
- refines exact implementation HOW;
- performs self QA/QC;
- escalates material scope/architecture/contract change;
- fixes Reviewer findings;
- does not infer merge authority.

Before handoff/PR-ready, Coder performs Goal Recheck:
```text
goal + acceptance + non-goals + plan/contracts + actual diff + observed evidence
→ MET / PARTIAL / NOT_MET / UNVERIFIED
```

Any source-changing Run declares a scope claim.

Completing Runs do not write progress/reference arrays back into the parent Job file; status is joined from append-preserving records.

## 6. Reviewer

Context-Isolated Reviewer:
- uses fresh chat;
- reads exact target/revision and applicable requirements/evidence;
- source implementation read-only;
- produces findings/results;
- does not fix source.

Reviewer derives judgement without prior-chat reasoning context.

Reviewer is topology-driven except when the mechanically computed mandatory review floor triggers.

## 7. Tester

Tester:
- performs practical scripted/exploratory testing only when the required runtime/product capability is `OBSERVED`;
- source implementation read-only;
- may execute Retests when capability is observed;
- otherwise prepares/plans test steps while the human executes practical Retest and GSA records evidence.

A merely `SURFACE_PRESENT` action does not justify a successful practical-test claim.

## 8. Orchestrator

Orchestrator is an implicit harness responsibility set, not an always-running process.

Core duties:
- route current work;
- apply/check transitions when invoked;
- surface pending Handoffs/Human Gates/Retests;
- coordinate capability lookup;
- perform conflict/scope/review-floor checks;
- produce status views using read-time joins.

It does not implement source.

## 9. Child Runs

```text
parent Run yields
→ child Run with another role
→ child output separately attributed
→ parent resumes
```

Context-isolated review remains fresh-chat.

## 10. Direct Agent

Outer Direct Agents:
```text
Planner
Designer
Coder
Reviewer
```

Direct work is ephemeral by default.

Promotion creates new Project/Job from a promotion packet.

Direct Coder cannot bypass an existing owning Project.

## 11. Context discipline and harness loading

Use minimum sufficient role context.

Reviewer/Tester may receive intentionally isolated context.

The repository files are not assumed to appear in ChatGPT context automatically.

Phase 2 must define and prove:
- which plugin/action selects the role harness;
- which canonical policy fragments are loaded for that Run;
- maximum/default context packet budget;
- what is fetched lazily versus included up front;
- how the same behavior resumes in a fresh chat.

Until proven, harness loading is an implementation capability, not an architecture assumption.

## 12. Handoff

Cross-Run transition uses durable Handoff with owning work, source Run, next role, exact target/revision, completed/remaining work, blocker/gate and expected next outcome.

## 13. Attribution

Important durable/external outputs include:
```text
role
Run ID
owning work
exact target/revision
```

Agent-authored content is never human approval.

## 14. Human authority

Human owns material product/architecture/governance/subjective acceptance and merge/release decisions.

## 15. Phase 2

Exact prompts/skills/tool procedures remain Phase-2 implementation after Phase-1 gate closes.
