# DOMAIN DETAIL — Run v0.1

## Status

```text
PHASE = THEORY DETAIL
DOMAIN = RUN
STATUS = WORKING_DRAFT
CANONICAL = false
```

This document details the Run domain under the accepted hierarchy:

```text
Project
→ Job
→ Task
→ Run
```

Run is the execution-attribution layer. It is intentionally defined before any final physical storage schema, file layout, or CLI grammar is nominated.

---

## 1. Run definition

A Run is **one bounded execution attempt/session inside a Job context**.

```text
Run
= one execution attempt
+ one active role
+ one owning Project
+ one owning Job
+ optional Task binding
+ explicit input context
+ explicit target
+ produced result/evidence/handoff
```

A Run exists to answer:

```text
Who acted?
On what work?
Against which target/revision?
Using which context?
What did that execution produce?
What should happen next?
```

A Run is NOT:

- a Project;
- a Job;
- a Task;
- an Agent definition;
- a chat by definition;
- a milestone;
- a PR;
- a commit;
- a Retest;
- a review finding;
- a Human Gate.

---

## 2. One active role per Run

Accepted invariant:

```text
one Run
→ one active role
```

Examples:

```text
Run R1
role = Planner

Run R2
role = Coder

Run R3
role = Reviewer
```

This does not mean one Job uses only one role.

Instead:

```text
Job
→ many Runs
→ each Run has one active role
```

The purpose is clear attribution, context discipline, write-boundary enforcement, evidence provenance, and handoff clarity.

---

## 3. Run and chat are not identical

A chat is the interaction surface.

A Run is an execution unit.

Therefore:

```text
chat
≠ Run
```

A single chat may contain:

- one Run;
- several sequential Runs when independence is not required;
- conversational discussion before a Run begins;
- user confirmation between Runs.

A fresh chat may be required for a Run whose independence matters.

Current accepted case:

```text
independent Reviewer Run
→ fresh chat required
```

Do not infer that every role transition requires a new chat.

---

## 4. Run ownership

Every Run belongs to exactly one Project and one Job.

```text
Run
→ Project
→ Job
```

Task binding is optional because:

- a Job may have no explicit Tasks;
- one execution attempt may need to work at Job-level scope;
- one Run may potentially cover multiple related Tasks.

The exact Task cardinality is detailed below as a nominated decision.

---

## 5. Run start conditions

A Run may begin only when enough context exists for that role to execute safely.

At minimum, the Run must know:

- Project identity;
- Job identity;
- active role;
- work objective/scope;
- relevant approved upstream artifacts;
- current target/revision when applicable;
- applicable write/read boundaries;
- blocking dependencies/gates;
- required evidence/output expectations.

The exact context packet is role-specific and will be detailed in Agent/Context Builder domains.

A Run must not invent missing product/architecture decisions merely to start.

---

## 6. Run input snapshot

A Run must be attributable to the input state it used.

Conceptually, Run input may reference:

- plan/version;
- design/version;
- relevant Task(s);
- repository branch/commit/PR;
- contract version;
- previous review findings;
- Retest ID;
- user instruction that triggered the Run;
- relevant capability state.

This does not require copying all inputs into the Run record.

The semantic requirement is:

```text
later reviewer/resumer
→ can identify what input state the Run actually acted on
```

---

## 7. Run target

A Run should identify its execution target when one exists.

Target must be generic enough to support non-code work.

Examples:

```text
target_type = plan
target_ref = PLAN-0004@v3

target_type = github_pr
target_ref = PR#42@abc123

target_type = design
target_ref = DESIGN-0008@v2

target_type = retest
target_ref = RT-0042-01

target_type = job
target_ref = J-...
```

This follows the accepted target-neutral attribution principle:

```text
role + Run + owning work context + exact target/revision
```

Exact field/schema syntax is deferred.

---

## 8. Run result

A Run should end with an explicit outcome.

Possible semantic outcomes include:

- produced requested artifact;
- completed execution successfully;
- produced findings;
- blocked;
- requires human input;
- requires another role;
- changes required;
- no-op because target already satisfied;
- failed due to capability/tool/platform limitation.

Do not collapse all of these into a simple PASS/FAIL enum yet.

Run result semantics must be reviewed together with Agent and Handoff domains.

---

## 9. Run completion vs Job/Task completion

Run completion means the execution attempt is over.

It does NOT imply:

```text
Task complete
Job complete
review complete
merge authorized
release complete
```

Example:

```text
Coder Run completes
→ code change produced
→ Reviewer Run still required
→ Job not complete
```

A completed Run may therefore hand work to another Run.

---

## 10. Run handoff

Every Run that does not fully close its owning work should identify the next expected transition.

Conceptually:

```text
Run ends
→ result recorded
→ next handler / next action identified
→ durable handoff state preserved when needed
```

Examples:

```text
Coder Run
→ next handler: Reviewer

Reviewer Run
→ findings require Coder

Planner Run
→ Human Gate required

Tester Run
→ Retest FAIL routes to remediation
```

Exact handoff protocol is defined in the Handoff domain.

---

## 11. Human-dispatched current platform

Current platform behavior:

```text
Run A finishes
→ next required handler recorded
→ ChatGPT tells user
→ user invokes/authorizes next Run
→ Run B starts
```

Current orchestration is:

```text
pull-based
+ human-dispatched
+ durable state-persistent
```

This is a platform limitation, not a permanent semantic requirement.

If future platform capability allows safe agent-to-agent dispatch, Run semantics should remain valid.

---

## 12. Run independence

Some Runs require independence from the previous execution context.

Accepted example:

```text
independent Reviewer
→ must begin in fresh chat
```

The purpose is to reduce implementation-context contamination and preserve independent judgment.

Not every Run needs fresh context.

Independence requirements are defined by role/workflow topology.

---

## 13. Run and repository writes

Run write capability is constrained by:

```text
Project ownership
≥ Job scope
≥ Task scope if present
≥ role boundary
≥ Run target
```

Example:

```text
Coder Run
→ may write approved owned repo scope

Reviewer Run
→ source read-only
→ may write review comments/evidence through allowed review channels
```

A Run never gains authority simply because the connector technically exposes a write action.

Role/governance scope remains authoritative.

---

## 14. Run and exact revision binding

When a Run acts on versioned source/artifacts, its output/evidence must bind to the exact revision used.

Examples:

```text
Reviewer Run
→ PR #42 @ abc123

Tester Run
→ deployed build for commit def456

Planner Run
→ architecture v3 + contract v2
```

If the target changes materially after Run completion, prior evidence may become stale.

Causal Change Review / artifact lifecycle determines whether revalidation is required.

---

## 15. Run retry

A failed/blocked execution may be retried.

A retry should generally create a new Run rather than overwrite the previous Run as if it never occurred.

Conceptually:

```text
Run R1
→ BLOCKED

Run R2
→ retry after blocker resolved
```

This preserves execution history and evidence provenance.

Exact retry linkage should be part of the later schema.

---

## 16. Run attempt history

Run history should be append-preserving where useful.

Do not rewrite an old Run result to represent a later attempt.

Examples:

```text
R1
→ tool capability unavailable

R2
→ capability restored
→ execution succeeds
```

This distinction matters for:

- debugging workflow quality;
- audit/provenance;
- evaluating harness effectiveness;
- understanding why work was delayed;
- calibration in later GSA phases.

---

## 17. Run and Task cardinality

A Run may need to bind to more than one Task when one coherent execution action legitimately advances several tightly related Tasks.

### Nomination

```text
Run
→ 0..N Task references
```

Preferred semantics:

- zero Tasks when Job has no explicit Task decomposition or Run is Job-level;
- one Task for normal focused work;
- multiple Tasks only when the execution attempt genuinely spans them as one coherent operation.

Rationale:

- avoids artificial splitting of one execution into fake Runs;
- supports batch review/implementation where Tasks share the same target/revision;
- preserves Task-level attribution by listing all affected Tasks.

Alternative A:

```text
Run
→ exactly 0 or 1 Task
```

Benefit:
- simpler attribution.

Cost:
- may force duplicate Runs for one real execution attempt.

Alternative B:

```text
Run
→ always exactly one Task
```

Cost:
- incompatible with Job-level Runs and Task-less Jobs.

Mark:

```text
REVIEW_REQUIRED
```

---

## 18. Run identity

Run identity must be durable and unambiguous enough for:

- handoff;
- evidence;
- review;
- Task/Job linkage;
- retry lineage;
- later chat resume;
- calibration analysis.

### Nomination

```text
Run ID
→ globally unique across GSA
```

Rationale:

- detached references remain unambiguous;
- matches globally unique Job/Task nomination;
- simplifies evidence provenance across Projects/chats.

Alternative:

```text
Run ID unique only within Job
```

Benefit:
- shorter local notation.

Cost:
- detached references require Job context.

Mark:

```text
REVIEW_REQUIRED
```

Exact syntax is mechanical and deferred.

---

## 19. Run status lifecycle

Candidate semantic states:

```text
CREATED
READY
IN_PROGRESS
WAITING_HUMAN
WAITING_HANDOFF
BLOCKED
COMPLETED
FAILED
CANCELLED
SUPERSEDED
```

These are NOT frozen.

Important distinction:

```text
WAITING_HUMAN
= execution paused because human input/approval required

WAITING_HANDOFF
= current Run finished enough to yield control but next required Run has not started
```

Whether WAITING_HANDOFF belongs to Run state or Handoff state is specifically deferred to later COLLECT/REVIEW.

---

## 20. Run cancellation

A Run may be cancelled if execution is intentionally stopped before producing its intended result.

Cancellation should preserve history rather than deleting the attempt.

Examples:

```text
user stops Run
scope invalidated
target replaced
tool path abandoned
```

If cancellation happened because a new Run replaces the old target, SUPERSEDED may be more precise than CANCELLED.

This mirrors the nominated Task distinction and should be reviewed globally later.

---

## 21. Run hard-delete

### Nomination

```text
Run hard-delete
→ normally disallowed once the Run actually began execution
```

Preferred:

- accidental empty/pre-start Run records may be removable;
- executed Runs remain historical;
- cancellation/supersession is used instead of deletion.

Rationale:

- Runs are attribution/evidence units;
- deleting them can break provenance;
- future calibration benefits from real execution history;
- linked findings/retests/handoffs may depend on them.

Alternative A:

```text
hard-delete always allowed
```

Cost:
- breaks provenance and may orphan references.

Alternative B:

```text
hard-delete never allowed, even empty pre-start records
```

Benefit:
- simplest integrity rule.

Cost:
- unnecessary clutter from accidental creation.

Mark:

```text
REVIEW_REQUIRED
```

---

## 22. Run timestamps

A Run may have timestamps such as:

- created;
- started;
- ended;
- resumed/retried through linked Runs.

### Nomination

Store timestamps when available, but do not make wall-clock timing a semantic dependency of the workflow.

Rationale:

- useful for audit/history/calibration;
- platform timing may be unavailable or approximate;
- correctness should not depend on precise timing metadata.

Alternative:

Require exact timestamps for every Run.

Cost:
- creates unnecessary fragility where platform metadata is unavailable.

Mark:

```text
REVIEW_REQUIRED
```

---

## 23. Run and evidence

A Run may produce evidence.

Examples:

- PR review;
- CI result;
- code diff;
- test output;
- screenshot;
- design review;
- user confirmation;
- tool error proving capability limitation.

Evidence should preserve provenance:

```text
evidence
→ produced/observed by Run
→ bound to exact target/revision
```

Evidence is a separate domain and should not be collapsed into Run state.

---

## 24. Run and Reviewer independence

Reviewer independence requires:

```text
fresh chat
+ exact target/revision
+ review-specific context packet
+ no implementation write authority
```

The Reviewer Run may consume approved plans/specs and objective evidence, but should not inherit the Coder's hidden reasoning or conversational persuasion as authority.

This is a semantic independence rule, not merely UI preference.

---

## 25. Run and Tester behavior

Tester Run may differ from Reviewer Run.

Reviewer:

```text
known rules/evidence
→ verify compliance/correctness
```

Tester:

```text
realistic usage
→ actively seek unforeseen failure
```

Tester Run may produce:

- discovered defect;
- passed scenario;
- new Retest;
- new Task/remediation need;
- evidence that shell/design assumptions fail in practice.

Exact Tester contract comes later.

---

## 26. Run and Runtime Confirmation

Runtime Confirmation occurs inside the active Run/chat when execution needs narrow immediate authorization or clarification.

Accepted distinction:

```text
Runtime Confirmation
→ not durable approval log
```

The Run may record that execution was blocked/resumed by user confirmation if useful for continuity, but must not promote the confirmation into a durable governance approval unless it was actually a Planned Human Gate.

---

## 27. Run resume semantics

A previously incomplete Run may tempt the system to "resume" the same Run.

### Nomination

```text
same active chat/session + same uninterrupted execution context
→ may continue same Run

later independent attempt / new chat after meaningful interruption
→ create new Run linked to prior Run
```

Rationale:

- preserves honest attempt boundaries;
- avoids pretending a later context is the exact same execution session;
- improves provenance.

Alternative:

Allow reopening the same Run indefinitely across chats.

Benefit:
- fewer Run records.

Cost:
- weakens meaning of "execution attempt/session".

Mark:

```text
REVIEW_REQUIRED
```

---

## 28. Run output requirements

At Run end, durable output should be sufficient to support the next transition.

Possible output fields/semantics include:

- result summary;
- produced artifact refs;
- exact target/revision;
- evidence refs;
- blocker if any;
- findings if role produces them;
- affected Tasks;
- next handler;
- next action;
- Human Gate needed;
- retry/retest need.

Do not require every field for every role.

Role-specific Run contracts will define required subsets.

---

## 29. Run does not define storage layout yet

This pass does NOT nominate:

- `runs/` folder;
- one file per Run;
- embedded Run arrays inside Job records;
- append-only global Run log;
- per-role Run files;
- JSON vs Markdown.

Those choices depend on:

- query/access patterns;
- expected Run volume;
- cross-Project lookup;
- evidence linkage;
- resume needs;
- retention needs;
- calibration needs;
- connector performance.

These must be COLLECTED before storage synthesis.

---

## 30. Run invariants — current detail pass

1. Run is one bounded execution attempt/session.
2. Run belongs to exactly one Project and one Job.
3. One Run has one active role.
4. Chat and Run are distinct concepts.
5. A chat may contain multiple sequential Runs when independence is not required.
6. Independent Reviewer Run requires fresh chat.
7. Run input must be attributable to the state used.
8. Versioned targets must bind to exact revision.
9. Run completion does not imply Task/Job completion.
10. Run handoff identifies next transition when work remains.
11. Current platform handoff is human-dispatched but semantics allow future automation.
12. Run authority is constrained by Project/Job/Task/role scope.
13. Retries should preserve prior attempts.
14. Evidence remains separate from Run state.
15. Physical Run storage is deferred.
16. Multiple Task binding is nominated, not frozen.
17. Global Run ID is nominated, not frozen.
18. Hard-delete of executed Runs is nominated against.
19. Resume-across-new-context should normally create a new linked Run.
20. Exact Run lifecycle enum remains deferred to COLLECT/REVIEW.

---

## 31. DETAIL output — candidates for later COLLECT

### Lifecycle candidates

- CREATED;
- READY;
- IN_PROGRESS;
- WAITING_HUMAN;
- WAITING_HANDOFF;
- BLOCKED;
- COMPLETED;
- FAILED;
- CANCELLED;
- SUPERSEDED.

Need later review on which belong to Run vs Handoff/Job state.

### Persistence/access candidates

- Run identity;
- Project/Job references;
- 0..N Task refs;
- active role;
- created/started/ended timestamps;
- input artifact/version refs;
- target type/ref/revision;
- result;
- evidence refs;
- next handler/action;
- blocker;
- Human Gate reference;
- retry/previous-Run link;
- capability limitation encountered;
- output artifact refs.

### Cross-domain dependencies

Need later detail from:

- Agent contracts;
- Context Builder;
- Handoff;
- Evidence;
- Reviewer;
- Tester;
- Human Gate;
- Capability/Executor;
- state machine;
- storage model.

### Nominated for later COLLECT/REVIEW

1. Run may reference 0..N Tasks.
2. Run ID should be globally unique.
3. Executed Runs should not normally be hard-deleted.
4. Exact timestamps are useful but not mandatory semantic prerequisites.
5. Meaningful resume in a new chat/context creates a new linked Run.
6. CANCELLED and SUPERSEDED should remain distinct.
7. WAITING_HANDOFF may belong outside Run lifecycle and requires cross-domain review.

No immediate human interruption is required; these nominations proceed to later COLLECT/REVIEW.
