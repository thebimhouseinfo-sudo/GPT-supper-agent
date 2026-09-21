# Agent Contracts v1.1

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

All roles may act through the user's same connected platform identity; role attribution therefore comes from explicit Run signatures, not account identity.

## 2. Shared authority

```text
tool capability ≠ role authority
```

Effective authority is intersection of Project/Job/Task/role/Run/human/capability boundaries.

## 3. Planner

Planner:
- reads Project Memory and selective live source;
- writes planning/knowledge;
- defines objective/scope/architecture/dependencies;
- defines topology and completion/evidence requirements;
- schedules normal review/test/human checkpoints;
- must also apply mandatory review triggers;
- supports Causal Change Review.

## 4. Designer

Designer:
- source read-only;
- owns visual interpretation/design coverage;
- writes design/asset requirement outputs;
- does not silently change product behavior.

Concept-first is normal default.

Designer may be invoked as a child Run from Coder when non-independent specialist asset/design work is needed.

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
goal + acceptance + non-goals + plan/contracts + actual diff + available evidence
→ MET / PARTIAL / NOT_MET / UNVERIFIED per criterion
```

Any source-changing Run declares a scope claim.

## 6. Reviewer

Independent Reviewer:
- uses fresh chat;
- reads exact target/revision and applicable requirements/evidence;
- source implementation read-only;
- may comment/review;
- produces findings/results;
- does not fix source.

Reviewer derives judgement independently from target + requirements + evidence; Coder self-recheck is secondary evidence, not authority.

Reviewer is topology-driven except mechanical mandatory review triggers.

## 7. Tester

Tester:
- performs scripted/exploratory practical testing only when runtime/product capability is observed AVAILABLE;
- source implementation read-only;
- may execute Retests when capability exists;
- otherwise provides/plans test steps while human performs practical Retest and GSA records evidence.

Tester remains a semantic role even if initial Phase-2 execution is human-backed.

## 8. Orchestrator

Orchestrator is an implicit harness responsibility set, not an always-running process.

Core duties:
- route current work;
- apply/check transition rules when invoked;
- surface pending Handoffs/Human Gates/Retests;
- coordinate capability lookup;
- perform conflict/scope checks at dispatch/consequential-action boundaries;
- produce status views.

It does not implement source.

## 9. Child Runs

When independence is not required:
```text
parent Run pauses/yields
→ child Run with another role may execute in same chat
→ child result attributed separately
→ parent Run resumes
```

Independent review remains a fresh-chat Run.

## 10. Direct Agent

Outer Direct Agents:
```text
Planner
Designer
Coder
Reviewer
```

Direct work is ephemeral by default.

Promotion creates a new Project/Job from a promotion packet.

Direct Coder:
- requires explicit repo target;
- cannot bypass an existing owning Project.

Tester/Orchestrator are not outer entries initially.

## 11. Context discipline

Use minimum sufficient role context.

Do not load entire Project/repo/chat indiscriminately.

Reviewer/Tester may receive deliberately isolated context.

## 12. Handoff

Cross-Run transition uses durable handoff with owning work, source Run, next role, exact target/revision, completed/remaining work, blocker/gate and expected next outcome.

## 13. Attribution

Important externally visible/durable role outputs include product-neutral signature:
```text
role
Run ID
owning work context
exact target/revision
```

Unsigned content is not treated as human approval.

## 14. Human authority

Human owns material product/architecture/governance/subjective acceptance and merge/release decisions.

Agent-authored comments under the user's account are still agent outputs.

## 15. Phase 2

This document defines semantics.

Exact prompts/skills/loops/tool procedures are Phase-2 work after Phase-1 entry gate is satisfied.
