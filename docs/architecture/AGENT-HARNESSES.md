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

### Progressive context contract

Use progressively deeper context only when the active role/evidence requires it:

```text
L0 = repository orientation / structure
L1 = decision context / canonical contracts / selected entry points
L2 = exact execution context / callers / consumers / tests
L3 = deeper investigation triggered by findings, failures or unresolved dependencies
```

Planner normally owns L0/L1 discovery. Coder, Reviewer and Tester consume L2 for their exact target and expand to L3 only when evidence requires it.

Do not keep broad stale context loaded merely because it was once relevant.

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


## Brownfield Planner discovery floor

For an existing repository, Planner must not rely only on README, TASKS, roadmap or remembered architecture.

Discovery is two-stage:

```text
L0 STRUCTURE SCAN
→ repository tree / top-level folders / filenames
→ configs / tests / docs / assets / CI-deploy surfaces
→ infer candidate implementation areas

L1 SELECTIVE CONTENT READ
→ read only the files needed to validate current objective and assumptions
```

File and folder names are legitimate evidence. A repository with weak or stale documentation is still plannable from its live structure.

A durable brownfield Job must persist enough structure evidence for Reviewer to verify that Planner did not plan from stale descriptions alone.

## Automatic planning review loop

A newly prepared or materially revised Job plan is not READY merely because Planner persisted it.

```text
Planner
→ DRAFT planning revision
→ context-isolated Reviewer
→ PASS
   └→ DRAFT → READY
→ CHANGES_REQUIRED
   └→ Planner revise → new planning_revision → Reviewer again
→ HUMAN_REVIEW_REQUIRED
   └→ Human decision → Planner revise → Reviewer again
→ BLOCKED
   └→ report concrete blocker
```

Planner fixes ordinary review findings without asking the user.
Reviewer never rewrites the plan.
Every revised planning revision invalidates prior planning-review PASS.


## Multi-repo Project planning

A Project is not assumed to equal one repository.

Planner uses the durable Project repository registry:

```text
Project
├─ PRIMARY repo
├─ DEPENDENCY repo(s)
├─ SUPPORT repo(s)
└─ REFERENCED repo(s)
```

During brownfield L0 discovery, links, routes, deploy rewrites, package references, docs, local orchestration or integration contracts may reveal additional repositories.

If likely Project repos are missing:

```text
discover candidate repo relationship
→ HUMAN_REVIEW_REQUIRED
→ Human confirms repo set/roles
→ update Project repository registry
→ re-run planning review
```

For a MULTI Project, every executable Job has exactly one working repository.

Before Job READY, Planner and Reviewer must still assess all registered repos:

```text
working repo = where this Job may write
other registered repos = read for dependency/contract impact as needed
cross_repo_impact = NONE | READ_ONLY_CONTRACT_CHECK | COORDINATED_CHANGE_REQUIRED | UNKNOWN
```

If coordinated changes are required in more than one repo, Planner should normally split them into linked finite Jobs, one working repo each, with explicit dependency ordering.


## Critic Reviewer (CR)

Critic Reviewer is an independent, Human-invoked second-review role.

Command alias:

```text
cr
```

Contract:

- CR is never automatically dispatched by Orchestrator, Planner, Reviewer, Coder or Tester.
- CR is **stateless-by-contract**: conversation history is non-authoritative and must not be used as review evidence.
- CR does not block based on which chat invokes it. **Same-chat invocation is explicitly valid**, even when Planner/Reviewer/Coder reasoning is visible earlier in that conversation. CR must disregard that conversation reasoning and reconstruct the target from durable Project Memory, exact Job/revision, Verification artifacts and live source truth.
- CR reconstructs the target from durable Project Memory, exact Job/revision, Verification artifacts and live source truth only.
- CR forms its own criteria, findings and verdict before reading the prior Reviewer verdict.
- Only after the independent verdict exists may CR compare it with the prior Reviewer and record agreement/disagreement.
- CR is read-only for source and Job state. It writes only a `CRITIC_REVIEW` Verification artifact.
- CR never changes Job lifecycle. Human decides what to do with CR findings.

Verdicts:

```text
PASS
PASS_WITH_FINDINGS
FAIL
BLOCKED
```

CR is a peer-review backstop, not part of the normal automatic planning-review loop.
