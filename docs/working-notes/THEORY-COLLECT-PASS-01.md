# THEORY COLLECT — Pass 01

## Status

```text
LOOP_STAGE = COLLECT
PASS = 01
DETAIL_PASS = COMPLETE_ENOUGH_FOR_REVIEW
CANONICAL = false
```

This document collects discoveries, nominations, persistence needs, CLI needs, lifecycle/state candidates, and known inconsistencies from the first full theory DETAIL pass.

It intentionally does **not** synthesize final storage/schema/CLI/state architecture yet.

Canonical meta-loop:

```text
DETAIL
→ COLLECT
→ REVIEW
→ SYNTHESIZE
→ FIX
→ repeat
```

---

# 1. Domains covered in DETAIL pass

The first pass now covers:

```text
Project
Job
Task
Run

Agents (shared)
Orchestrator
Planner
Designer
Coder
Reviewer
Tester

Handoff
Context Builder
Human Gate / Approval
QA / QC
Evidence / Verification
Capability / Executor
Multi-repo Coordination
Governance / Artifact Lifecycle
Security / Trust
Asset Requirement
Retest
Release / Completion
Failure / Recovery
Command / User UX
Harness Quality Loop
State Model
```

The following are intentionally **not yet synthesized** because the meta-rules require collection/review first:

- final Project Memory tree;
- exact storage/file layout;
- exact schemas;
- final state enums/transitions;
- final deeper CLI hierarchy;
- implementation architecture;
- release-scope matrix.

These are not missing DETAIL items. They are downstream synthesis products.

---

# 2. Already accepted semantic foundations

The following have already been explicitly accepted by the user and should not be reopened casually during REVIEW unless a contradiction is discovered.

## 2.1 Hierarchy

```text
Project
→ Job
→ Task
→ Run
```

Project is the durable top-level context.

Job is finite work inside Project.

Task is optional bounded work package inside Job.

Run is one execution attempt with one active role.

## 2.2 Project

- one direct Drive child folder under configured root;
- `PROJECT.md` is bootstrap identity marker;
- Project may own 0..N repos;
- Project may reference 0..N repos;
- one repo may be owned by only one Project;
- referenced repos are read-only;
- Project Open shows ACTIVE + PAUSED, hides ARCHIVED;
- lifecycle = ACTIVE | PAUSED | ARCHIVED;
- release milestones are separate and Project-specific;
- Project hard delete is allowed and deletes Project Drive control-plane memory, not repos.

## 2.3 Job

- finite objective inside one Project;
- baseline types = plan | code | design | review;
- Job may involve many roles/Runs;
- completed Job stays in Project history;
- no Job-level ARCHIVED state required;
- Job hard delete is allowed;
- Job ID is globally/universally unique;
- review placement is topology-driven;
- merge requires explicit human authorization.

## 2.4 Review / acceptance

Accepted successful results:

```text
PASS
PASS_RETEST_REQUIRED
```

Accepted finding severity:

```text
CRITICAL
IMPORTANT
MINOR
```

Subjective binding judgement routes to human unless an objective approved rubric exists.

## 2.5 Human interaction

```text
Planned Human Gate
≠ Runtime Confirmation
```

Runtime Confirmation is never a durable approval log.

## 2.6 Causal Change Review

No blanket stale invalidation.

```text
change
→ trace causal effect
→ affected/unaffected with reasons
→ options/trade-offs
→ human decides material choice
→ revalidate/stale/supersede exact artifacts
```

## 2.7 QA/QC

```text
QA = process assurance
QC = output quality
```

Canonical check families:

```text
COMPLIANCE
CORRECTNESS
FIT
```

## 2.8 Current platform handoff

```text
pull-based
+ human-dispatched
+ durable state-persistent
```

Automatic handoff remains future extension point.

---

# 3. Nominations requiring REVIEW

To avoid micro-review, nominations are grouped by decision cluster.

## R1. Identity strategy

Current nominations:

```text
Job ID
→ already accepted globally unique

Task ID
→ nominate globally unique

Run ID
→ nominate globally unique

Retest ID
→ nominate globally unique
```

Reason:
detached references stay unambiguous across Project/chat/evidence/handoff contexts.

Alternative:
Task/Run/Retest IDs local to their owning parent.

Review question:
Do we use universal identity consistently for all durable work entities?

---

## R2. Job type mutability

Nomination:

```text
Job type immutable after creation
```

If work materially changes type:
```text
create new linked Job
```

Reason:
preserves workflow/history meaning.

Alternative:
allow type transition in same Job.

---

## R3. Task lifecycle distinction

Nomination:

```text
CANCELLED
≠ SUPERSEDED
```

Reason:
cancelled means stopped; superseded means replacement exists.

Same distinction is nominated for Run where useful.

---

## R4. Task / Run deletion policy

Nomination:

```text
Task:
hard-delete only while no durable references exist

Run:
executed Run normally cannot be hard-deleted;
empty/pre-start accidental record may be removable
```

Reason:
preserve referential integrity/provenance.

Alternative:
always-delete or never-delete.

---

## R5. Run-to-Task cardinality

Nomination:

```text
Run
→ 0..N Task refs
```

Normal case is one Task, but Job-level Run and coherent multi-Task execution are allowed.

Alternative:
0..1 Task per Run.

---

## R6. Run resume semantics

Nomination:

```text
same uninterrupted execution context
→ continue same Run

meaningful interruption/new chat/new attempt
→ create new linked Run
```

Reason:
preserves honest attempt boundaries.

---

## R7. Handoff vs Run state

Nomination:

```text
source Run completes
→ pending transition is represented by Handoff
```

Therefore `WAITING_HANDOFF` should primarily be Handoff state rather than keeping source Run open.

Alternative:
keep Run in WAITING_HANDOFF.

---

## R8. Handoff history

Nomination:

- consumed Handoff remains historical;
- target/revision change may revalidate or supersede pending Handoff.

---

## R9. State architecture

Nomination:

```text
state
≠ result
≠ delivery fact/event
```

Use domain-specific state spaces rather than one giant universal enum.

Orchestrator enforces transitions; domains define semantic meaning.

Alternative:
central single status system.

---

## R10. Orchestrator exposure

Nomination:

```text
Orchestrator
→ implicit system/control-plane role
→ not ordinary Direct Agent
```

Alternative:
expose Direct Orchestrator.

---

## R11. Direct Tester

Nomination:

```text
Tester
→ not in outer Direct Agent menu initially
```

Standalone testing can still be requested naturally.

Alternative:
add Tester to outer menu.

---

## R12. Planner planning model

Nomination:

Use causal planning logic rather than freezing old P0–P11 as mandatory ceremony.

```text
intent
→ context/evidence
→ gaps
→ impact
→ decisions
→ work decomposition
→ topology
→ acceptance/verification
→ consistency check
```

Alternative:
fixed universal P0–P11 pipeline.

---

## R13. Planner vs Coder execution detail

Nomination:

```text
Planner
→ objective/scope/architecture/dependencies
→ workflow topology
→ Task boundaries
→ review/test/human gates
→ acceptance/verification constraints

Coder
→ exact live-source HOW
→ concrete file/symbol/helper implementation detail
```

Alternative:
Coder owns entire Detailed Execution Plan after only broad Planner plan.

---

## R14. Planner vs Designer boundary

Nomination:

```text
Planner
→ design-readiness orchestration
→ required coverage/gates

Designer/specialist design skill
→ detailed design methodology + visual production
```

This replaces older theory that embedded extensive UI methodology directly inside Planner.

---

## R15. Designer defaults

Nominations:

- concept-first default;
- DESIGN_READY does not require every final binary asset;
- inherit/reuse existing Project design system by default;
- Direct Designer ephemeral unless promoted/persisted.

---

## R16. Coder deviation model

Nomination:

```text
local implementation detail
→ Coder decides

local plan adjustment
→ Coder adjusts + reports

material scope/architecture/contract change
→ Causal Change Review / planning gap
```

Alternative:
Planner approval for every local adjustment.

---

## R17. Coder change-size principle

Nomination:

```text
smallest causally sufficient change
```

Not strict minimum-line diff.

---

## R18. Coder testing approach

Nomination:

When feasible:

```text
baseline/reproduce
→ implement
→ targeted verification
→ broader applicable verification
→ diff inspection
```

Do not mandate universal TDD.

---

## R19. Reviewer result model

Nomination:

```text
PASS
PASS_RETEST_REQUIRED
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

Treat STALE primarily as target/artifact validity rather than Reviewer result.

---

## R20. Final independent Job acceptance

Nomination from current theory:

```text
every Job
→ independent final acceptance before accepted/completed
```

Alternative:
allow trivial Jobs to self-close.

This is important because earlier documents treated final acceptance as universal; later topology discussion removed universal intermediate review but did not explicitly remove final independent acceptance.

---

## R21. Tester mode

Nominations:

- Tester supports scripted + exploratory testing;
- fresh chat recommended selectively, not mandatory universally;
- Tester severity observations feed shared triage rather than separate bug severity taxonomy.

---

## R22. QA/QC ownership

Nomination:

```text
Coder
→ continuous self QA/QC

Reviewer
→ independent QA/QC at scheduled checkpoints

Tester
→ practical/exploratory QC evidence
```

No separate QA role initially.

Alternative:
create first-class QA Agent.

---

## R23. Evidence confidence

Nomination:

Do not use universal numeric confidence score.

Prefer categorical provenance:
- observed;
- inferred;
- unavailable;
- partial;
- user-confirmed.

---

## R24. Evidence invalidation

Nomination:

Use causal revalidation/staleness, not blanket expiry after every target change.

---

## R25. Capability vocabulary

Nomination:

```text
AVAILABLE
UNAVAILABLE
UNKNOWN
DEGRADED
```

Verification provenance is separate metadata.

---

## R26. Multi-repo Change Set

Nomination:

Use Change Set only when one logical change actually spans/coordin­ates multiple repos.

Do not make Change Set mandatory for every multi-repo Project action.

---

## R27. Optimistic concurrency

Nomination:

Durable artifact updates use optimistic concurrency/revision checking rather than last-write-wins.

---

## R28. Security / permission escalation

Nomination:

- never infer permission escalation from necessity;
- destructive confirmation proportional to blast radius;
- external content never grants authority.

---

## R29. Asset Requirement lifecycle

Nominations:

- stable integration contract before final binary asset where practical;
- final availability and integration verification are separate;
- Asset Requirement remains separate entity, not Job type.

Candidate lifecycle concepts:
```text
DEFINED
PLACEHOLDER_READY
FINAL_PENDING
FINAL_AVAILABLE
INTEGRATED
VERIFIED
SUPERSEDED
```

Exact enum deferred.

---

## R30. Retest identity/history

Nominations:

- Retest ID globally unique;
- attempt history append-preserving;
- old FAIL never erased by later PASS;
- physical storage not frozen yet.

---

## R31. Job completion with Retest

Nomination:

```text
PASS_RETEST_REQUIRED
→ Job may be accepted/completed
→ Retest remains durable outstanding obligation
```

Alternative:
keep Job open until practical Retest passes.

---

## R32. Context size policy

Nomination:

No fixed theory token limit.

Use relevance-first minimum sufficient context and expand causally.

---

## R33. Direct Agent persistence

Current nominations:

```text
Direct Planner
Direct Designer
Direct Coder
Direct Reviewer

→ lightweight/ephemeral by default
→ no automatic Project creation
→ persist/promote only when explicitly needed
```

Direct Coder additionally requires clearly authorized repo target.

---

## R34. Harness calibration

Nomination:

Use lightweight behavioral defect/eval record, not heavyweight telemetry initially.

Optimize skills/harnesses/loops/actions from real outcomes.

---

# 4. Persistence requirements collected

These are **requirements**, not folder/file nominations.

## 4.1 Project-level persistence needs

- Project identity;
- lifecycle;
- owned repos;
- referenced repos;
- Project purpose;
- release milestones;
- durable decisions;
- architecture/contracts;
- Project-wide obligations;
- cross-Job coordination;
- deletion/history semantics.

## 4.2 Job-level

- globally unique identity;
- objective;
- type;
- workflow/milestone topology;
- scope;
- dependencies;
- Task membership;
- participating roles;
- Human Gates;
- review/test requirements;
- result;
- linked Retests/assets;
- history;
- delete semantics.

## 4.3 Task-level

- identity;
- owning Job;
- objective;
- scope;
- dependencies;
- source/artifact constraints;
- completion criteria;
- Run links;
- findings;
- Retests/assets;
- cancellation/supersession reason;
- resumable next-action/blocker.

## 4.4 Run-level

- identity;
- owning Project/Job;
- Task refs;
- active role;
- input refs;
- target/revision;
- result;
- evidence refs;
- next transition;
- blocker;
- retry/predecessor;
- timestamps where available.

## 4.5 Handoff

- source Run;
- target role;
- Task refs;
- target/revision;
- completed/remaining work;
- blocker/gate;
- pending/consumed/superseded;
- successor Run.

## 4.6 Human Gate

- decision;
- target;
- options;
- selected result;
- scope;
- waiver linkage;
- dependency effect;
- persistence necessity.

## 4.7 Review

- mode;
- exact target/revision;
- findings;
- severity;
- evidence;
- result;
- waiver;
- re-review lineage.

## 4.8 Test / Retest

- scenario;
- environment;
- expected/observed;
- steps;
- evidence;
- owning work;
- revision;
- attempt history;
- status.

## 4.9 Asset Requirement

- stable identity;
- type;
- owner;
- filename/path contract;
- spec;
- prompt/source text;
- placeholder;
- final asset ref;
- integration/verification state.

## 4.10 Evidence

- identity;
- type;
- producer/source;
- target/revision;
- environment;
- result;
- freshness;
- applicability;
- revalidation/supersession.

## 4.11 Governance

- artifact identity/revision;
- dependency refs;
- validity state;
- approval/review refs;
- concurrency revision token;
- causal invalidation lineage.

---

# 5. Access/query patterns collected

Storage synthesis must support these operations efficiently enough:

- discover Projects from configured Drive root;
- Open = all non-ARCHIVED Projects;
- Status = all Projects;
- reopen Project without chat history;
- find active/pending Jobs;
- resolve universal Job/Task/Run/Retest ID;
- show current handler/next action;
- list pending Human Gates;
- list pending/block Retests;
- retrieve exact review/evidence for target revision;
- trace Run → Task → Job → Project;
- trace Retest → owning work/revision;
- trace finding → fix → re-review;
- trace asset requirement → integration target;
- inspect release/milestone history;
- support concurrent chats without silent overwrite;
- load minimum relevant context rather than entire memory.

These query patterns will drive physical storage design.

---

# 6. CLI needs collected

## 6.1 Accepted outer surface

```text
PROJECT
- new
- open
- status
- delete

DIRECT AGENT
- Planner
- Designer
- Coder
- Reviewer

HELP / INSTRUCTION
```

## 6.2 Candidate operational needs discovered

Potential user operations exist for:

- inspect/select Job;
- continue current work/handoff;
- inspect Task;
- invoke review on exact target;
- answer Planned Human Gate;
- list/show Retests;
- report Retest PASS/FAIL;
- inspect blockers;
- inspect Project current status;
- possibly Job delete;
- possibly Task delete where allowed.

These are **needs**, not commands.

During SYNTHESIZE:
```text
collect needs
→ merge overlaps
→ decide natural language vs command
→ minimize hierarchy
→ freeze final CLI
```

No second-level command tree is nominated here.

---

# 7. Lifecycle/state candidates collected

## 7.1 Project — accepted

```text
ACTIVE
PAUSED
ARCHIVED
```

## 7.2 Job — semantic conditions

Needs to represent:
- created/not executable;
- ready;
- in progress;
- waiting dependency/handler/human;
- blocked;
- accepted/completed;
- cancelled/superseded if retained;
- deletion.

Accepted result is separate:
```text
PASS
PASS_RETEST_REQUIRED
```

## 7.3 Task candidates

```text
PLANNED
READY
IN_PROGRESS
WAITING
BLOCKED
COMPLETED
CHANGES_REQUIRED
CANCELLED
SUPERSEDED
```

Not final.

## 7.4 Run candidates

```text
CREATED
READY
IN_PROGRESS
WAITING_HUMAN
BLOCKED
COMPLETED
FAILED
CANCELLED
SUPERSEDED
```

WAITING_HANDOFF likely moves to Handoff.

## 7.5 Handoff candidates

```text
PENDING
CONSUMED
BLOCKED
SUPERSEDED
```

## 7.6 Retest — accepted

```text
PENDING
BLOCKED
PASS
FAIL
SUPERSEDED
```

## 7.7 Artifact validity

Candidates:
```text
CURRENT
REVALIDATED
STALE
SUPERSEDED
```

Exact vocabulary not yet frozen.

## 7.8 Delivery facts — accepted separate dimension

```text
accepted
merged
deployed
deployment_verified
```

---

# 8. Cross-domain relationships requiring synthesis

The following require explicit contracts in SYNTHESIZE after REVIEW:

1. Planner topology → Job/Task/Handoff records.
2. Coder Run → source revision → self-QA/QC evidence.
3. Reviewer finding → Task/Job owner → fix Run → re-review.
4. Tester defect → remediation or Causal Change Review.
5. PASS_RETEST_REQUIRED → Retest creation → Job completion.
6. Asset Requirement → placeholder → code integration → final asset → Retest.
7. Handoff → next Run/context packet.
8. Human Gate → blocked work → resume transition.
9. Artifact revision change → evidence revalidation.
10. Parallel Jobs/Tasks → optimistic concurrency/conflict detection.
11. Multi-repo Change Set → repo PRs → integration evidence → acceptance.
12. Direct Agent ephemeral work → optional promotion into Project.

---

# 9. Known obsolete/canonical inconsistencies to FIX later

Existing canonical/older architecture documents still contain superseded assumptions, including:

- Job as direct Drive child root;
- `JOB.md` as top-level marker;
- Project as merely logical context;
- Job registry/discovery semantics based on JOB.md;
- pre-nominated full Project Memory folder tree;
- pre-nominated retests/ folder;
- old Job CLI commands as canonical candidates;
- missing Tester in role set;
- Planner owning too much specialist UI methodology;
- fixed/overly universal role/review pipelines;
- final states that mix lifecycle/result/delivery facts;
- Job archive assumptions conflicting with new "completed history, no Job ARCHIVED";
- one Job/repo relationship models that predate owned/reference semantics.

These should be repaired in one consistency pass after REVIEW rather than piecemeal.

---

# 10. Physical structure explicitly NOT nominated yet

The following remain intentionally open until REVIEW + SYNTHESIZE:

```text
<Project>/
  PROJECT.md
  ????
```

Questions to answer only after REVIEW:

- jobs/ folder or shared work ledger?
- one file per Job vs grouped records?
- Task embedded vs separate?
- Run append log vs per-Run record?
- evidence store shape?
- handoff store?
- Retest store?
- asset requirement store?
- approvals?
- releases?
- indexes/cache?
- Markdown vs JSON per artifact?
- what belongs in root?
- what can be lazy-created?
- what should never be persisted?

The only bootstrap physical artifact currently justified is `PROJECT.md`.

---

# 11. Review organization proposal

To avoid reviewing dozens of tiny decisions individually, REVIEW should proceed in these blocks:

```text
A. Identity + lifecycle + deletion
B. Run + Handoff + state semantics
C. Agent authority + Direct Agent behavior
D. Planner/Designer/Coder responsibility boundaries
E. Reviewer/Tester/QA-QC acceptance model
F. Evidence/Retest/Asset verification model
G. Capability/Security/Governance/concurrency
H. Multi-repo/release/completion
I. CLI user UX needs
J. Existing-document contradiction audit
```

After each block:
- ACCEPT nominations;
- MODIFY specific items;
- REJECT specific items;
- surface any newly discovered semantic gap.

Only after all blocks are reviewed should SYNTHESIZE begin.

---

# 12. COLLECT result

```text
DETAIL PASS 01
→ COMPLETE ENOUGH FOR REVIEW

COLLECT PASS 01
→ COMPLETE

NEXT LOOP STAGE
→ REVIEW PASS 01
```

No storage tree, exact schema, final state machine, or deep CLI should be frozen before Review Pass 01 completes.
