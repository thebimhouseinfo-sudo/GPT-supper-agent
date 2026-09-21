# Peer Review Disposition — v0.1

## Status

```text
SOURCE = Claude Peer Review — GPT Super Agent Phase 1
REVIEWER = GPT-5.6 Sol internal architecture review
STATUS = RECOMMENDED_DISPOSITION
CANONICAL = false
HUMAN_CONFIRMATION_REQUIRED = true
```

This note evaluates PR-01..PR-20 against the current repository theory. It does not amend frozen/canonical theory by itself.

Disposition vocabulary:

```text
ACCEPT
ACCEPT_WITH_MODIFICATION
REJECT_WITH_REASON
DEFER_TO_PHASE_2_CALIBRATION
```

---

## Executive result

```text
ACCEPT                  = 9
ACCEPT_WITH_MODIFICATION = 10
REJECT_WITH_REASON       = 1
DEFER                     = 0
```

No peer finding should be ignored. One finding (PR-03) identifies a real documentation ambiguity but its proposed ontology fork conflicts with an already accepted design decision; the ambiguity should be fixed without changing the ontology.

The highest-priority corrections before Phase 2 are:

1. concurrency/platform realism;
2. mechanical review floor + merge coverage summary;
3. capability catalog + observed capability matrix;
4. attribution under one shared user identity;
5. minimal handoff/dispatch UX;
6. child/sub-Run semantics;
7. Retest-failure completion semantics;
8. Project Memory simplification;
9. concrete schemas + ID generation;
10. unfreeze temporary user-facing naming.

---

# Findings

## PR-01 — concurrency / CONTROL hot file

**Disposition: ACCEPT_WITH_MODIFICATION**

Agree:
- conditional/revision-aware Drive write is unverified;
- read-check-write in two chats is not atomic;
- CONTROL must never be sole source of a durable fact;
- append-only unique records substantially reduce corruption surface;
- Run scope claim is useful.

Modification:
- retain CONTROL only as rebuildable materialized view/cache;
- do not make correctness depend on successful compare-and-swap;
- before consequential writes, re-read lifecycle + relevant scope claim/current target;
- record residual concurrency as SOFT/eventual consistency unless platform probe proves HARD enforcement.

Required Phase-1 fix:
- add scope claim semantics;
- define check-before-consequential-action;
- add Drive concurrency spike to Phase-2 entry probe list;
- redesign Project Memory so normal Runs rarely write one shared hot file.

---

## PR-02 — no global registry vs ownership/global identity

**Disposition: ACCEPT_WITH_MODIFICATION**

Agree:
- no-registry + one-owner repo needs an explicit structured ownership record;
- prose-only ownership is insufficient;
- global ID generation is architecture-relevant because there is no central counter.

Modification:
- do **not** silently use "earliest claim wins" as authority if duplicate ownership claims are detected;
- duplicate OWNED claims become a governance conflict requiring human resolution;
- deterministic timestamp may help diagnose, not grant authority.

Recommended direction:
```text
no global registry
+ structured repo claim inside Project
+ duplicate-claim detection
+ globally collision-resistant ID
+ short human handle
```

ID technology can be synthesized now; random/time-sortable IDs such as UUIDv7/ULID-class semantics are appropriate.

---

## PR-03 — Job semantics drift / overlapping concepts

**Disposition: REJECT_WITH_REASON**

The ambiguity is real; the proposed ontology fork is not accepted.

Already accepted product semantics:
```text
one Job
≠ one role

Job
= finite objective/work unit
→ may contain multiple role Runs/checkpoints
```

Therefore Option 1 (single-role Jobs) conflicts with accepted theory.

Keep container/outcome Job semantics, but clarify:

```text
Job type
= classification of the Job's primary objective
≠ role currently executing
```

Examples:
- code Job may contain Coder → Reviewer → Tester Runs;
- review Job exists when the *objective itself* is a standalone review;
- review checkpoint inside code/design Job is not a review Job.

Task vs stage also remains distinct:
- Task = bounded owned work package;
- milestone/stage = topology/checkpoint ordering construct.

Required fix is documentation precision, not ontology replacement.

---

## PR-04 — Retest failure vs terminal Job

**Disposition: ACCEPT_WITH_MODIFICATION**

Peer finding is correct: reopening a Task under a terminal COMPLETED Job is semantically inconsistent.

Recommended rule:

```text
COMPLETED + PASS_RETEST_REQUIRED
→ Retest pending

later Retest FAIL
→ preserve completed Job
→ create new linked remediation Job
→ optionally link exact originating Task/component
```

Only a Retest executed *before* Job terminal completion may route back into the same active Job/Task.

Also require:
- status surfaces pending Retests next to completed Jobs;
- merge remains allowed after PASS_RETEST_REQUIRED only with explicit human authorization and visible pending-Retest disclosure.

---

## PR-05 — no mechanical independent-review floor

**Disposition: ACCEPT_WITH_MODIFICATION**

Agree with the core risk. Flexible topology needs a non-waivable objective floor for specific change classes.

Recommended mandatory independent review triggers:
- shared contracts/interfaces/schema;
- persisted-data migration/format;
- auth/permission/security-sensitive logic;
- CI/CD/workflow/deployment configuration;
- destructive operations;
- dependency manifest/lockfile changes when they alter runtime/build dependency state.

Do **not** use "any merge to default branch" as a trigger because that collapses flexible topology back into universal review.

Also accept:
- removing a previously planned review checkpoint must be visible;
- merge authorization should display a review-coverage summary:
  - independent review status;
  - CI/check status;
  - Tester/Retest status;
  - unverified areas;
  - self-recheck-only areas.

The rule remains SOFT in the harness unless the external platform enforces it.

---

## PR-06 — capability catalog / Coder self QA-QC

**Disposition: ACCEPT**

This is a material Phase-1 gap.

Add an explicit capability catalog and observed enforcement matrix.

Coder self QA/QC should split into:

### Capability-backed checks
Examples:
- CI;
- build/test/lint if an executor actually provides them;
- remote deployment/preview evidence.

### Goal Recheck
Before handoff/PR-ready:
```text
Task/Job goal
+ acceptance
+ non-goals
+ approved plan/contracts
+ actual diff
+ available evidence
→ criterion-by-criterion recheck
```

Criterion result:
```text
MET
PARTIAL
NOT_MET
UNVERIFIED
```

UNVERIFIED belongs to criterion/evidence status, not Job success result.

Independent Reviewer should evaluate criteria from target + evidence independently rather than simply trusting the Coder's recheck.

---

## PR-07 — pause/conflict assumes push awareness

**Disposition: ACCEPT**

Replace impossible "a running chat immediately stops when another chat pauses Project" semantics with:

```text
before consequential action
→ re-read Project lifecycle
→ re-read relevant scope claim/revision
→ proceed only if still allowed
```

Consequential actions include:
- source write;
- destructive operation;
- handoff consumption;
- merge/deploy action;
- material control-plane mutation.

State explicitly:
- cross-chat consistency is eventual;
- check-before-action is SOFT unless platform adds stronger enforcement.

---

## PR-08 — state model too large / duplicate facts

**Disposition: ACCEPT_WITH_MODIFICATION**

Agree with simplification pressure.

Recommended:
- keep detailed legal transition tables only for Project and Job where governance cost is highest;
- reduce Run lifecycle: a Run need not persist CREATED/READY if Run identity is created when execution begins;
- trim Asset Requirement lifecycle;
- avoid storing duplicate "waiting" facts in Job + Handoff + Run.

Modification:
- keep WAITING/BLOCKED as useful **derived display/work conditions**, but their authoritative cause should be the durable dependency/Handoff/Human Gate/blocker record;
- do not require a standalone runtime Orchestrator process.

Orchestrator remains a harness responsibility set whose behavior is validated by evals.

---

## PR-09 — Drive memory over-normalization

**Disposition: ACCEPT_WITH_MODIFICATION**

Agree that the current memory tree is too database-like for Drive.

Recommended simplification direction:
- Tasks embedded inside Job by default unless volume/query needs prove otherwise;
- Runs stay separate append-only unique records;
- Handoff can be a compact transition/pending record rather than a heavyweight entity family;
- Evidence/Review/Retest should share a simpler verification storage model where practical while retaining semantic `kind`;
- Findings remain embedded in Review;
- remove tombstones initially;
- defer elaborate cross-Project weak-reference integrity until demonstrated need.

Do not erase semantic concepts just because storage is consolidated.

This is a storage simplification, not a semantic merger.

---

## PR-10 — causal invalidation unsafe when dependency unknown

**Disposition: ACCEPT**

Strengthen Causal Change Review:

```text
trace recorded dependency refs

known unaffected with evidence
→ may remain current

known affected
→ revalidate/stale/supersede

dependency unknown / trace incomplete
→ conservatively treat as affected
```

"Unknown means affected until revalidated" is the fail-safe direction.

---

## PR-11 — attribution under one shared identity

**Disposition: ACCEPT**

Add an explicit single-identity constraint.

All roles act through the user's connected GitHub/Google identity; therefore GitHub identity cannot prove independent-agent authority.

Important durable/externally visible agent outputs need a product-neutral attribution signature:

```text
role
+ Run ID
+ owning work context
+ exact target/revision
```

Apply to:
- agent-created Drive records;
- GitHub review/comment text where useful;
- commit/PR metadata or trailer when appropriate.

Human approval counts only when explicitly given by the human through the authorized interaction surface; an agent-authored comment must never be mistaken for human approval.

---

## PR-12 — human dispatch UX undefined

**Disposition: ACCEPT**

This must be defined before Phase 2 because fresh-chat handoff is common.

Minimal dispatch capabilities required:
- show pending handoffs;
- take/continue next handoff;
- select handoff by ID/short handle;
- show current Project work status;
- pause/stop where applicable.

Exact fake-CLI names may still be synthesized after UX minimization.

Unmatched/ambiguous command:
```text
ask / show choices
→ never guess destructive/work context
```

---

## PR-13 — DEFINED sections without concrete artifacts

**Disposition: ACCEPT**

Do not claim Phase-1 conceptual completeness while implementation-critical semantics still require invention.

Before Phase 2, produce at minimum:
- ID scheme;
- compact entity schemas/records;
- capability catalog + matrix;
- dispatch contract;
- scope-claim contract;
- attribution/signature contract;
- simplified Project Memory layout.

Prefer completing these artifacts rather than merely downgrading status.

Serialization technology and exact formatting may remain mechanical only after semantic fields/relationships are fixed.

---

## PR-14 — Tester capability unverified

**Disposition: ACCEPT_WITH_MODIFICATION**

Keep Tester as a semantic role, but make it explicitly capability-gated.

Initial operational truth:
```text
runtime capability observed
→ Tester may execute practical tests

runtime capability unavailable/unknown
→ human executes Retest checklist
→ GSA records evidence/result
```

Do not remove Tester from theory; do not assume it can run in Phase 2 until observed capability exists.

---

## PR-15 — Coder calling Designer conflicts with one-role-per-Run

**Disposition: ACCEPT_WITH_MODIFICATION**

Preserve:
```text
one active role per Run
```

Add nested/child Run semantics when independence is not required:

```text
Coder Run
→ temporarily yields
→ child Designer Run (same chat allowed)
→ produces asset/design output
→ return to parent Coder Run
```

Each child Run:
- has its own Run ID;
- has one role;
- has parent_run_id;
- has separate attribution/output.

Fresh chat remains required only where independence is part of the role contract, especially independent Reviewer.

---

## PR-16 — @gsa / gsa/ frozen too early

**Disposition: ACCEPT**

Treat `@gsa` and `gsa/` as current aliases, not product identity/frozen foundation.

Internal IDs/signatures must not contain the product name.

Naming can be finalized later with minimal architectural impact.

---

## PR-17 — theory-process rules inside product foundation

**Disposition: ACCEPT**

Move construction/process rules (DETAIL→COLLECT→REVIEW..., phase maturity, external peer-review requirement) into a theory/governance process document.

Frozen product foundation should contain product/system invariants.

Keep F-number history traceable during migration and refresh the invariant summary.

---

## PR-18 — small lifecycles overgrown

**Disposition: ACCEPT_WITH_MODIFICATION**

Trim Asset Requirement lifecycle.

Suggested semantic reduction:
```text
DEFINED
AVAILABLE
VERIFIED
SUPERSEDED
```

Represent placeholder/final/integrated details as facts/fields rather than lifecycle states unless later use proves transition value.

Keep Project:
```text
ACTIVE
PAUSED
ARCHIVED
```

PAUSED is a meaningful user lifecycle state and should not be demoted to a flag yet.

---

## PR-19 — Direct Agent promotion undefined

**Disposition: ACCEPT**

Define promotion as creation of a new Project/Job from a compact promotion packet, not as mutation of an ephemeral Direct Agent state.

Promotion packet may contain:
- user objective;
- produced artifact/result;
- assumptions/decisions;
- repo target if relevant;
- remaining work;
- references.

No durable Direct Agent lifecycle is required.

---

## PR-20 — doc/version hygiene

**Disposition: ACCEPT**

Before Phase 2:
- align filename and internal document version/title;
- add one document/version/status index;
- use a status vocabulary that distinguishes semantic boundary coverage from fully synthesized definition.

---

# Consolidated architecture changes recommended before Phase 2

## A. Theory corrections

1. Retest FAIL after completed Job creates new linked remediation Job.
2. Add risk-triggered mandatory independent-review floor.
3. Add child/sub-Run semantics.
4. Add attribution/signature + shared-identity constraint.
5. Strengthen causal invalidation: unknown dependency = affected.
6. Unfreeze product handle/command namespace aliases.

## B. Simplifications

1. Reduce state-machine transition ceremony.
2. Reduce Asset lifecycle.
3. Simplify Drive Project Memory storage.
4. Remove initial tombstone/cross-Project integrity complexity.
5. Treat WAITING/BLOCKED primarily as derived conditions from durable causes.

## C. Missing Phase-1 artifacts

1. ID scheme + short handles.
2. repo ownership claim contract.
3. Run scope-claim contract.
4. capability catalog + observed HARD/SOFT/UNKNOWN matrix.
5. Coder goal-recheck contract.
6. minimal dispatch/handoff pickup contract.
7. compact record/schema definitions.
8. attribution/signature contract.
9. merge review-coverage summary.
10. Project Memory simplified layout.

## D. Platform spikes before/at Phase-2 entry

- Drive raw md/json create/update/list;
- conditional/revision-aware write;
- Drive comments if used;
- GitHub binary commit;
- Actions status/log access;
- protected branch behavior;
- merge/delete branch confirmation behavior;
- image persistence from generation into Drive/GitHub;
- practical browser/runtime capability for Tester.

These spikes determine enforcement/capability truth; they do not redefine theory unless results expose a real semantic gap.

---

# Gate recommendation

```text
Phase 1 semantic model
= coherent

Phase 1 ready for Phase 2
= NOT YET

Required:
peer-review dispositions confirmed by human
→ accepted corrections synthesized
→ Phase-1 missing artifacts completed
→ consistency/fix pass
→ final peer/internal re-review
→ Phase 2
```
