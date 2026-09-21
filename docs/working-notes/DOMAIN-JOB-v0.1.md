# DOMAIN DETAIL — Job v0.1

## Status

```text
PHASE = THEORY DETAIL
DOMAIN = JOB
STATUS = WORKING_DRAFT
CANONICAL = false
```

This document details the Job domain under the accepted hierarchy:

```text
Project
→ Job
→ Task
→ Run
```

It intentionally does not reuse the superseded model in which Job itself was the top-level Drive folder.

---

## 1. Job definition

A Job is a **finite unit of work inside one Project**.

```text
Job
= bounded objective
+ defined work scope
+ workflow/milestone topology
+ one or more Tasks
+ one or more Runs
+ completion conditions
```

A Job exists to organize a coherent piece of work that can eventually reach a meaningful completion result.

A Job is NOT:

- the Project itself;
- a Google Drive Project root;
- a repository;
- a chat;
- a single agent;
- a single Run;
- a pull request;
- a release milestone.

A Project can contain many Jobs over time.

---

## 2. Job objective

Every Job must have one explicit objective.

The objective answers:

```text
What finite outcome is this Job trying to produce?
```

Examples:

```text
Plan Job
→ produce an approved implementation plan for feature X

Code Job
→ implement feature X according to approved plan

Design Job
→ produce the required design artifacts for flow Y

Review Job
→ independently review artifact/change Z
```

The objective should be narrow enough that completion is meaningful.

A vague objective such as:

```text
"Improve the app"
```

is not sufficient unless further bounded into an actionable scope.

---

## 3. Job types

Current promoted baseline Job types:

```text
plan
code
design
review
```

These are the initial basic types, not a permanently closed enum.

Rules:

- use these four as the baseline taxonomy;
- do not invent additional Job types merely for symmetry;
- add/split/merge types only after real Project evidence shows materially different workflow/lifecycle/evidence needs;
- historical Jobs must remain interpretable if taxonomy evolves.

A Job type selects a workflow contract, but the Job's actual milestone topology may still vary by scope.

---

## 4. Job is not one-agent ownership

A Job may require one agent or multiple agents.

```text
Job
≠ one agent
```

Example:

```text
Code Job J-0042

M1
→ UX Coder

M2
→ UI Coder

M3
→ Reviewer

M4
→ Tester
```

Still:

```text
one Job
many Runs
many participating roles
```

The Job owns the objective and workflow.

Each Run has one active role for attribution.

---

## 5. Job workflow topology

Before substantial execution, a Job must have enough workflow definition to know:

- what stages/milestones exist;
- who handles each stage;
- what artifact/output each stage must produce;
- what dependencies exist;
- which stages may run in parallel;
- which stage receives the work next;
- whether review is required;
- whether a Human Gate is required;
- what completion conditions apply.

Conceptual topology:

```text
Milestone | Stage              | Handler     | Output          | Next       | Review/Human?
M1        | Detailed planning  | Planner     | exec plan       | Coder      | as defined
M2        | Implementation     | Coder       | change/PR       | Reviewer?  | as defined
M3        | Independent review | Reviewer    | findings/result | Coder/User | as defined
M4        | Practical test     | Tester      | test result     | User/close | as defined
```

This topology is Job-specific.

Do not hard-code one universal sequence for every Job.

---

## 6. Job order may differ by product/work type

The order of participating roles depends on the Job.

Examples:

### UI-first web application

```text
requirements/content model
→ UI design / Design Coverage
→ DESIGN_READY
→ UI implementation shell
→ UX behavior mapped onto shell
→ Tester
→ SHELL_READY
```

### Interaction-first product such as CadGPT

```text
interaction / command model
→ UX contract
→ implementation
→ thin/fake CLI presentation later
```

Therefore the Detailed Execution Plan must define the role order before implementation rather than discovering the order during coding.

---

## 7. Job and Tasks

A Job decomposes into Tasks when smaller work packages are useful.

Conceptually:

```text
Job J-0042
├── Task T1
├── Task T2
└── Task T3
```

A Task belongs to exactly one Job.

Task semantics are defined in the Task domain pass.

This Job pass only freezes that:

- Tasks are subordinate work units;
- Task decomposition is optional when the Job is trivially small;
- Task completion contributes to Job completion;
- Task identity must remain traceable to the Job.

---

## 8. Job and Runs

A Job may have one or many Runs.

```text
Job J-0042
├── Run R1 role=coder
├── Run R2 role=designer
├── Run R3 role=reviewer
└── Run R4 role=tester
```

One Run has one active role.

A Run is not the Job lifecycle itself.

A chat may contain more than one sequential Run when independence is not required.

An independent Reviewer Run must start in a fresh chat.

Current platform limitation means a required fresh/next Run is human-dispatched unless future platform capability allows automatic handoff.

---

## 9. Job parallelism

Multiple Jobs in one Project may be active simultaneously when the milestone/dependency topology allows it.

Example:

```text
Job A
→ Coder implements against stable placeholder contract

Job B
→ Designer produces final asset

Job C
→ Reviewer reviews another completed change
```

Parallelism rule:

```text
parallel if independent
sequential if causally dependent
coordinate/block if conflicting
```

A Job must not assume another active Job is safe merely because it is running in another chat.

Potential conflict dimensions include:

- same branch;
- same files/components;
- same shared contract/schema;
- same migration/data structure;
- shared release-critical artifact;
- one Job changing assumptions consumed by another.

Cross-Job conflicts route through explicit coordination / Causal Change Review.

---

## 10. Job and repositories

Repositories belong to the Project, not to Jobs.

A Job receives a **work scope** over Project-owned repositories.

Example:

```text
Project owns:
- Repo A
- Repo B

Job J-001
→ work scope: Repo A

Job J-002
→ work scope: Repo B

Job J-003
→ work scope: Repo A + Repo B
```

A Job may also read referenced repositories according to Project reference semantics, but may not write them.

The Job's effective write scope must never exceed Project repository ownership and the approved Job plan.

---

## 11. Job creation

A Job is created because the Project has a finite piece of work that deserves its own objective/workflow/completion boundary.

A Job should not be created merely because:

- a new chat starts;
- a new agent participates;
- a new PR exists;
- a new Task exists;
- a new asset is needed;
- a Retest exists.

Examples:

```text
new agent Run inside same objective
→ same Job

small asset requirement supporting current work
→ requirement/Task inside current Job unless it has its own meaningful workflow

Retest after merge
→ verification obligation attached to owning work, not new Job type
```

---

## 12. Job completion result

Accepted successful result vocabulary:

```text
PASS
PASS_RETEST_REQUIRED
```

### PASS

```text
PASS
= required workflow/review/evidence is sufficient
  and no remaining practical verification obligation is required
```

### PASS_RETEST_REQUIRED

```text
PASS_RETEST_REQUIRED
= required workflow/review/evidence is sufficient for acceptance
  but practical real-world verification still remains
```

This is still an accepted result, not a failure tier.

Remaining practical verification must be represented through durable Retest semantics.

Failure/routing conditions may include concepts such as:

```text
CHANGES_REQUIRED
BLOCKED
STALE
HUMAN_REVIEW_REQUIRED
```

Exact Job lifecycle/status vocabulary is not finalized in this section yet.

---

## 13. Job completion is separate from delivery facts

The Job result is separate from downstream delivery facts such as:

```text
accepted
merged
deployed
deployment_verified
```

These facts may legitimately differ.

Example:

```text
Job accepted = true
result = PASS_RETEST_REQUIRED

merged = true
deployed = true
deployment_verified = true

practical Retest = PENDING
```

A Reviewer PASS does not itself merge.

Merge requires explicit human authorization.

---

## 14. Human Gates inside Jobs

A Job topology may include Planned Human Gates.

Examples:

- approve design direction;
- choose among Causal Change Review options;
- approve subjective acceptance;
- approve merge/release;
- approve a waiver where allowed.

A Planned Human Gate is part of Job governance.

Runtime Confirmation is different:

```text
Planned Human Gate
= known workflow decision boundary

Runtime Confirmation
= narrow execution-time confirmation in the current chat/Run
```

Only Planned Human Gate decisions are candidates for durable logging, and only when that durable record is actually needed.

---

## 15. Job review semantics

Review is not automatically required merely because:

- code exists;
- a PR exists;
- the Job is large;
- the Job is of type code.

Review placement comes from the Job's Detailed Execution Plan / milestone topology.

When Reviewer is assigned:

```text
Coder implements
→ Reviewer reviews exact target/revision
→ findings
→ Coder fixes if required
→ Reviewer re-reviews
→ repeat until accepted result
```

Reviewer may use normal GitHub review/comment mechanisms for code review.

Reviewer does not fix source code.

Subjective/judgement-only criteria that cannot be objectively evaluated must route to Human Review rather than Reviewer inventing binding authority.

---

## 16. Finding severity inside Job review

Accepted severity semantics:

```text
CRITICAL
→ always blocking

IMPORTANT
→ blocking unless explicitly waived by human

MINOR
→ non-blocking
```

Severity does not override the objective-vs-subjective rule.

A subjective finding does not become binding simply because Reviewer labels it CRITICAL.

---

## 17. Job change handling

If an approved upstream requirement/plan/contract/design changes while a Job is active, the system must perform Causal Change Review before blindly invalidating work.

```text
change
→ identify causal impact
→ identify affected/unaffected work
→ propose response options
→ include lower-impact alternatives when possible
→ Human decides material semantic trade-off
→ then mark selected artifacts/work STALE / REVALIDATED / SUPERSEDED
→ update Job topology if needed
```

A Job must not silently rewrite its own objective or architecture.

---

## 18. Job relation to Assets

An Asset Requirement may be attached to Job/Task scope.

Missing final asset does not necessarily block the Job.

If the integration contract is stable:

```text
define asset ID/name/path/spec
→ code against stable contract
→ use placeholder
→ continue work
→ merge may reach PASS_RETEST_REQUIRED
→ final asset delivered later
→ practical Retest verifies real integration
```

Asset Requirement is not automatically a Job.

A separate Design/Asset Job is justified only when the asset work has a meaningful independent objective/workflow/completion boundary.

---

## 19. Job relation to Tester

Tester is distinct from Reviewer.

```text
Reviewer
= checks implementation against known rules/evidence

Tester
= actively exercises the product to discover realistic failures/unknown cases
```

A Job may include Tester checkpoints when the Detailed Execution Plan requires them.

For UI/content applications, representative testing may be required before shell/content scale-out.

---

## 20. Job does not define physical storage yet

This domain pass does NOT nominate:

- a `jobs/` folder;
- one file per Job;
- a Job index file;
- Job YAML/JSON/Markdown format;
- Task/Run folder nesting;
- Job memo locations.

Those physical decisions depend on later collection of:

- Job access patterns;
- Agent read/write needs;
- Task/Run history needs;
- cross-chat resume behavior;
- indexing/query requirements;
- deletion/archive semantics;
- review/test/retest linkage;
- release/audit needs.

Semantic model first; storage synthesis later.

---

## 21. Job lifecycle — semantic requirements discovered

Even without freezing exact status names yet, the lifecycle model must support at least these semantic conditions:

- newly created but not yet executable;
- ready to execute;
- currently progressing;
- waiting on another stage/agent/dependency;
- waiting on Human Gate;
- blocked by a concrete issue;
- accepted/completed;
- completed but with practical Retest obligation;
- archived/inactive historical Job if Job-level archive remains desired;
- superseded/cancelled/abandoned if such semantics are later approved.

This is a **COLLECT candidate list**, not yet the final Job state enum.

Do not canonize these names until lifecycle requirements from Task/Run/Agent/Test/Review have been collected.

---

## 22. Job history / deletion semantics

Accepted:

```text
completed Job
→ remains in Project history

Job-level ARCHIVED state
→ not needed

hard Job delete
→ allowed
```

A completed Job is historical Project memory and remains visible/recoverable through Project history unless explicitly deleted.

Job archive is unnecessary because Project lifecycle already provides ACTIVE / PAUSED / ARCHIVED at the enclosing level, while Job completion itself provides the normal historical boundary.

Hard deletion is permitted for Jobs that the user considers obsolete or unwanted.

The exact deletion-safety mechanics are intentionally deferred. Later COLLECT/REVIEW must determine how deletion interacts with:

- linked Retests;
- review evidence;
- approvals;
- release history;
- Run attribution;
- Task history;
- cross-Job references;
- audit/provenance needs.

Deletion must not silently orphan required durable obligations.

Abandoned/superseded/cancelled semantics remain to be synthesized later from the full lifecycle model; do not introduce Job-level ARCHIVED merely to represent them.

---

## 23. Job identity scope

A Job needs durable identity across:

- Projects;
- Runs;
- Tasks;
- reviews;
- Retests;
- handoffs;
- release/evidence references;
- later chat reopen.

Accepted semantic scope:

```text
Job ID
→ globally / universally unique
→ not merely unique inside one Project
```

This allows a Job reference to remain unambiguous even when copied into cross-Project evidence, Retest references, logs, handoff records, or future tooling.

The exact ID syntax remains a mechanical detailing decision and is intentionally deferred.

---

## 24. Job type mutability — nominated candidate for later review

Current baseline types:

```text
plan
code
design
review
```

Nominated candidate:

```text
Job type is immutable after creation.
```

Rationale:

- type selects the Job's workflow contract;
- immutable type preserves historical readability;
- changing type mid-stream can blur what completion/review/evidence rules applied earlier;
- when the work materially changes nature, creating a new Job gives a clearer causal/history boundary.

Candidate behavior:

```text
same finite objective, workflow evolves within same type
→ update milestone topology

work materially changes into a different Job type
→ create a new Job
→ link it causally to the prior Job when useful
```

This is NOT frozen yet.

Mark for later:

```text
COLLECT
→ REVIEW
→ confirm or revise Job-type immutability
```

The later system-wide review must check whether any real workflow requires safe type transition without creating a new Job.

---

## 25. Job invariants — current detail pass

1. Job is a finite work unit inside exactly one Project.
2. Job has one explicit objective.
3. Job is not a Drive Project root.
4. Job may contain zero or more Tasks depending on scope.
5. Job has one or more Runs when executed.
6. One Run has one active role.
7. One Job may involve multiple roles/agents.
8. Job workflow topology is plan-driven, not universally hard-coded.
9. Review is milestone/topology-driven, not PR-driven.
10. Repositories are Project-owned; Job receives scoped access.
11. Job may span multiple Project-owned repos.
12. Multiple Jobs may progress in parallel when dependencies/conflicts allow.
13. Job completion is separate from merge/deploy facts.
14. PASS_RETEST_REQUIRED is an accepted result with outstanding practical verification.
15. Asset Requirement/Retest are not automatically Job types.
16. Material upstream change routes through Causal Change Review.
17. Job physical storage layout is deferred until system-level collection/synthesis.
18. Job must remain traceable across Tasks/Runs/reviews/retests/handoffs.
19. Job does not silently expand Project architecture or source ownership.
20. Exact lifecycle enum remains to be synthesized after related domains are detailed.
21. Completed Jobs remain in Project history unless explicitly hard-deleted.
22. Job-level ARCHIVED state is not required.
23. Job identity is globally/universally unique.
24. Job-type immutability is currently nominated, not frozen.

---

## 26. DETAIL output — candidates for later COLLECT

### Lifecycle candidates

- creation/readiness state;
- execution/in-progress state;
- wait/dependency state;
- Human Gate state;
- blocked state;
- accepted/completed state;
- accepted-with-Retest obligation representation;
- abandoned/superseded semantics;
- Job archive/delete semantics.

### Persistence/access candidates

- durable Job identity;
- Job objective;
- Job type;
- Job workflow/milestone topology;
- Task membership;
- Run linkage;
- active handler/current stage;
- dependency relations;
- review requirements;
- Human Gates;
- result/acceptance;
- linked Retests;
- linked Asset Requirements;
- delivery facts or references;
- history/audit requirements.

### Cross-domain dependencies

Need later detail from:

- Task;
- Run;
- Planner;
- Designer;
- Coder;
- Reviewer;
- Tester;
- Handoff;
- Test/Retest;
- Release;
- storage;
- state machine;
- CLI.

### Resolved / nominated decisions

Resolved:

1. Completed Jobs remain in Project history.
2. Job-level ARCHIVED state is not needed.
3. Hard Job deletion is allowed.
4. Job ID scope is globally/universally unique.

Nominated for later COLLECT/REVIEW:

5. Job type is immutable after creation; materially different workflow creates a new linked Job.

Do not freeze the nominated type-mutability rule until the later system-wide review confirms it.
