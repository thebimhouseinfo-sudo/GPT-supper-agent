# GSA Online — Upgrade Integration & Final Main Promotion Plan

Status: **UNDER REVIEW**
Scope: **GSA Online / GPT-supper-agent**
Production line: **current `main` + current production runtime remain the V2_STABLE-compatible line until final cutover**
Upgrade integration branch: **`upgrade/gsa-next`**

---

## 1. Objective

Upgrade GSA Online without changing the semantics of Jobs that are currently running or already planned on the production line, while also avoiding a long-lived pile of hundreds of unmerged implementation commits.

The upgrade uses one dedicated integration branch:

~~~text
main
  = current production / V2_STABLE-compatible line
  = existing Jobs continue here

upgrade/gsa-next
  = all reviewed upgrade checkpoints accumulate here
  = never becomes production merely because a checkpoint passes

final:
upgrade/gsa-next fully passes
→ reconcile reviewed production drift into upgrade/gsa-next
→ final compatibility + end-to-end validation
→ Human release decision
→ promote upgrade/gsa-next to main
~~~

Do not incrementally merge workflow-changing upgrade checkpoints into production `main`.

---

## 2. Current baseline interpretation

The original verified V2_STABLE source marker is:

~~~text
a00e50d2929244b8a1dafa332b12999db3dd1239
~~~

Current `main` is ahead of that marker because Test Lab, browser/evidence capability work and planning documents were added afterward.

Therefore the compatibility target is **not byte identity with the old marker**.

The invariant is:

> Existing Job behavior remains V2_STABLE-compatible until final cutover.

Current lab/latent capabilities on `main` do not count as production workflow activation unless the normal role/orchestration path uses them.

---

## 3. Branch model

### 3.1 Long-lived integration branch

Create once from the current reviewed `main`:

~~~text
upgrade/gsa-next
~~~

All upgrade work converges into this branch.

### 3.2 Short-lived checkpoint branches

Each checkpoint may use one short-lived child branch:

~~~text
upgrade/cp0-compat
upgrade/cp1-lessons
upgrade/cp2-ui-coder
upgrade/cp3-tester-semantics
upgrade/cp4-evidence-planning
upgrade/cp5-checkpoint-runtime
upgrade/cp6-evidence-handoff
upgrade/cp7-final-integration
~~~

Each child branch starts from the latest `upgrade/gsa-next`, not from production `main`.

After the checkpoint passes:

~~~text
checkpoint branch
→ Reviewer / Tester / eval gate
→ squash or bounded merge into upgrade/gsa-next
→ verify absorption; cleanup may occur later
~~~

This keeps `upgrade/gsa-next` readable as a sequence of meaningful checkpoint merges rather than hundreds of unstructured commits.

### 3.3 Main stays production-stable

During the upgrade:

- normal current GSA Jobs continue against `main` / production runtime;
- upgrade code does not replace production `gsa-mcp`;
- upgrade tests must not mutate active production Job records;
- production hotfixes, if any, may still land on `main`;
- before final promotion, classify current production drift and apply only accepted changes to `upgrade/gsa-next`, then rerun the final gates.

No force-push or destructive history rewrite is part of the normal promotion path.

### 3.4 Drift control against production main

`upgrade/gsa-next` must not drift for many checkpoints from production `main`.

Before starting each new checkpoint:

~~~text
read current main SHA
→ compare with integration baseline SHA
→ if main advanced:
   apply accepted drift in a temporary child branch
   resolve only on integration branch
   rerun the V2_STABLE compatibility smoke gate
→ then branch/start the next checkpoint
~~~

Any production hotfix therefore enters the integration branch incrementally rather than being discovered only at final release.

Final promotion repeats production-drift review and the full compatibility + E2E gates.


---

## 4. Existing-Job compatibility fence

Before workflow-changing capability is activated on the integration branch, establish an explicit compatibility contract.

Conceptually:

~~~text
execution_contract = V2_STABLE | NEXT
~~~

Exact naming may change during implementation review, but behavior must satisfy:

- historical Jobs with no discriminator are interpreted as `V2_STABLE`;
- existing READY / IN_PROGRESS Jobs are never rewritten merely to adopt NEXT;
- legacy Job records remain readable;
- optional NEXT planning fields default to empty/non-activating for legacy Jobs;
- Tester checkpoints, EvidenceNeed routing, new topology semantics and UI Coder specialization do not auto-activate for legacy Jobs;
- old completion/order semantics are preserved unless a Human-reviewed plan explicitly migrates that Job;
- no bulk migration of existing Job JSON is required.

### Cutover default

Before final production promotion:

- production-created Jobs remain V2_STABLE/missing-discriminator;
- staging/NEXT Jobs must opt in explicitly inside the isolated upgrade test namespace.

After successful final promotion:

- **newly created Jobs are stamped `execution_contract=NEXT` by default**;
- existing records with missing discriminator or `V2_STABLE` remain V2_STABLE permanently unless explicitly migrated through a reviewed plan;
- final cutover therefore changes the default for future Jobs, not the semantics of historical/current Jobs.

This fence is required before later checkpoints may change orchestration behavior.

---

## 5. Upgrade checkpoint contract

Every checkpoint is a **merge boundary into `upgrade/gsa-next`**.

A checkpoint is mergeable only when all applicable gates pass:

~~~text
bounded objective complete
→ Coder self-review
→ Goal Recheck
→ exact diff/source identity
→ Reviewer PASS
→ required evals / Tester evidence
→ staging runtime read-back when runtime behavior changed
→ V2_STABLE compatibility checks
→ Lessons Learned merge/update
→ rollback point recorded
→ MERGE checkpoint into upgrade/gsa-next
~~~

A checkpoint merge does **not** mean production activation.

If a checkpoint FAILs:
- repair on the checkpoint branch;
- re-review/retest;
- do not merge partial behavior into `upgrade/gsa-next`.

---

## 6. Lessons Learned → MERGE rule

Lessons Learned is a continuous workstream across all checkpoints.

Sources:

- external benchmark/migration;
- CadGPT / Kid eSchool / other real-project pilots;
- Tester PROBE/MEASURE findings;
- Reviewer findings;
- Human-invoked CR findings;
- runtime failures and recovery observations.

A lesson moves through:

~~~text
candidate
→ dedupe against existing rule
→ classify owner
→ map to checkpoint
→ implement
→ eval / pilot / review
→ MERGE into canonical harness/skill/schema/eval
→ checkpoint merge into upgrade/gsa-next
~~~

A lesson is **not merged** merely because it appears in a note.

The merge record must identify what canonical surface now owns it, for example:

~~~text
Lesson: long Jobs drift
→ Planner sizing rule
→ planning review check
→ eval
→ checkpoint merge

Lesson: runtime fact must not be guessed
→ EvidenceNeed
→ TestCheckpointSpec
→ EvidenceRequirement
→ Tester PROBE/MEASURE
→ eval
→ checkpoint merge
~~~

At final promotion there must be no accepted lesson left only in a working note with no canonical owner.

---

# 7. Checkpoint roadmap

## CP0 — Integration branch + compatibility fence

### Goal

Create the safe upgrade lane before adding behavior.

### Work

- create `upgrade/gsa-next` from current reviewed `main`;
- capture exact production source/runtime baseline;
- inventory active/READY historical Job shapes;
- implement or finalize the V2_STABLE/NEXT compatibility discriminator;
- make missing discriminator mean V2_STABLE;
- add compatibility fixtures/evals for historical Job parsing, planning revision, run begin/complete and handoff paths;
- create an isolated upgrade test namespace/project so staging tests cannot mutate active Job records;
- establish an explicit **non-production runtime target** for pre-cutover deploy/read-back, using either a separate function/endpoint or a separate non-production project;
- bind that runtime to the dedicated Test Lab Project/Memory namespace;
- keep the production connector/runtime endpoint unchanged throughout CP0-CP7.

### Gate

- old Job records are readable without rewrite;
- no NEXT feature auto-activates for legacy Jobs;
- existing Job completion/topology behavior remains unchanged;
- staging/test data cannot collide with active production Jobs;
- all pre-cutover runtime deployment/read-back and Tester execution can run against the isolated NEXT runtime without repointing production.

### Merge

~~~text
CP0 PASS
→ merge into upgrade/gsa-next
~~~

---

## CP1 — Workflow Lessons Learned canonicalization

### Goal

Turn already validated workflow lessons into explicit canonical rules before larger runtime changes.

### Work

Reconcile the current V2 implementation notes, Phase-2 plan, pilots and review findings.

At minimum classify and bind canonical ownership for:

- Job boundary = context boundary;
- Objective → Phase → Task → Job Pack → Milestone;
- progressive L0/L1/L2/L3 context;
- brownfield source = evidence, not automatic authority;
- relationship/precedence awareness;
- Coder self-review + repair + Goal Recheck;
- context-isolated Reviewer;
- Human-invoked CR only;
- tool presence != proven capability;
- Trigger → Required action → Evidence → Exit condition;
- Tester as VERIFY / MEASURE / PROBE;
- unknown runtime facts must not be guessed;
- meaningful sparse checkpoints rather than Tester after every Task.

Do not duplicate rules already canonical in V2_STABLE; record them as already-owned rather than rewriting them.

### Gate

For each accepted lesson:

~~~text
lesson
→ canonical owner
→ already present | delta required
→ eval/pilot evidence
→ checkpoint assignment
~~~

No accepted lesson remains orphaned in `GSA-V2-IMPROVEMENT-NOTES.md`.

### Merge

~~~text
CP1 PASS
→ merge canonical lesson deltas + ledger into upgrade/gsa-next
~~~

---

## CP2 — UI Coder frontend specialization

### Goal

Complete the already-reviewed UI Coder rebaseline without affecting default Coder Jobs.

### Work

- remove the single audited obsolete external-design-workspace lab capability;
- add `ui-coder-frontend`;
- make catalog + actual loader agree;
- keep `ROLE_SKILLS.coder` default unchanged;
- deterministic activation:
  - Planner/Orchestrator classifies frontend work;
  - handoff names `ui-coder-frontend`;
  - Coder loads it before frontend implementation;
- direct source implementation;
- browser inspection only for development/self-QA;
- preserve Designer asset/design contract authority;
- keep Tester evidence backend storage-agnostic here.

### Compatibility

Legacy Jobs never auto-load `ui-coder-frontend`.

### Gate

- UI-focused NEXT test Job loads the specialization;
- normal V2_STABLE Coder Job does not;
- Reviewer PASS;
- Tester verifies runtime discovery/load after staging deploy;
- no abandoned external design-workspace dependency remains in active upgrade source.

### Merge

~~~text
CP2 PASS
→ merge into upgrade/gsa-next
~~~

---

## CP3 — Tester semantic foundation

### Goal

Upgrade Tester behavior before introducing checkpoint orchestration.

### Work

Canonicalize:

~~~text
VERIFY
MEASURE
PROBE
~~~

plus:

- capability readiness ladder;
- PRODUCT_FAILURE vs TEST_FAILURE vs ENVIRONMENT_FAILURE vs INTEGRATION_NOT_READY;
- UNVERIFIED != PASS;
- MEASURE without approved threshold produces measurement, not invented verdict;
- structured Tester report;
- revision-bound RETEST semantics;
- Tester remains source-read-only.

Reuse the already proven Test Lab / browser/evidence capabilities rather than rebuilding them.

### Compatibility

Legacy Jobs without Tester checkpoint semantics continue using the old path.

### Gate

Non-browser Tester scenarios prove VERIFY/MEASURE/PROBE semantics without requiring orchestration changes.

### Merge

~~~text
CP3 PASS
→ merge into upgrade/gsa-next
~~~

---

## CP4 — Planner EvidenceNeed + checkpoint planning model

### Goal

Make empirical dependencies first-class without yet changing runtime execution.

### Work

Add NEXT-only planning structures for:

- EvidenceNeed / UnknownRuntimeFact;
- TestCheckpointSpec;
- EvidenceRequirement;
- prerequisite node sets;
- BEFORE_NODE / AFTER_NODE_SET / MILESTONE_GATE / JOB_FINAL boundaries;
- milestones[];
- typed topology;
- plan revision binding;
- planning-review validation.

### Compatibility

For V2_STABLE Jobs:

~~~text
evidence_needs = []
test_checkpoints = []
evidence_requirements = []
milestones = []
legacy topology remains authoritative
~~~

No historical Job rewrite.

### Gate

Planner can express, for example:

~~~text
T2 + T3 + T4
→ CP1 PROBE
→ T5 consumes measured evidence
~~~

while a V2_STABLE fixture still plans/executes under unchanged legacy rules.

### Merge

~~~text
CP4 PASS
→ merge into upgrade/gsa-next
~~~

---

## CP5 — Tester Verification + checkpoint runtime

### Goal

Activate NEXT checkpoint execution safely and resumably.

### Work

- Tester Verification persistence;
- EvidenceApplicability;
- checkpoint attempt identity;
- CAS claim/lease;
- replay safety;
- crash/restart recovery;
- FAIL → repair → Goal Recheck → RETEST;
- BLOCKED semantics;
- PLAN_GAP / SPEC_GAP → Planner revision;
- superseding topology;
- downstream EvidenceRequirement blocking;
- Milestone/Job completion guards.

### Compatibility

The dispatcher branches first on execution contract:

~~~text
V2_STABLE
→ existing orchestration

NEXT
→ checkpoint-aware orchestration
~~~

No old Job is silently converted.

### Gate

- no duplicate live Tester attempt;
- missing empirical evidence blocks NEXT consumers;
- old Job fixtures preserve ordering/completion behavior;
- crash/restart simulation passes;
- Reviewer PASS on exact source.

### Merge

~~~text
CP5 PASS
→ merge into upgrade/gsa-next
~~~

---

## CP6 — Evidence handoff + browser/runtime integration

### Goal

Connect Tester runtime evidence to Human review without coupling UI Coder to one storage backend.

### Work

Use the separately reviewed Tester evidence decision that is active at this point.

Possible responsibilities after that separate review:

- representative screenshots/states/viewports;
- durable evidence manifest;
- direct Human-openable links/paths;
- hashes/revision binding;
- evidence applicability;
- privacy/retention rules;
- target-repository evidence persistence if and only if that architecture has been approved.

Do not let this checkpoint reopen UI Coder architecture.

### Gate

Human can open one review-ready evidence surface without hunting for artifacts.

### Merge

~~~text
CP6 PASS
→ merge into upgrade/gsa-next
~~~

---

## CP7 — End-to-end NEXT workflow + lessons merge closure

### Goal

Validate the upgraded system as a whole before touching production main.

### Work

Run representative integration scenarios:

1. brownfield coding Job with no Tester checkpoint;
2. Job with VERIFY checkpoint;
3. Job with MEASURE/PROBE feeding a later Task;
4. frontend Job using `ui-coder-frontend`;
5. product FAIL → Coder repair → RETEST;
6. PLAN_GAP → Planner revision → superseded topology;
7. crash/resume around a checkpoint;
8. multi-prerequisite checkpoint;
9. legacy V2_STABLE Job read/resume/complete under the upgraded runtime;
10. lessons-learned ledger closure.

### Gate

- NEXT workflow passes representative E2E;
- V2_STABLE compatibility suite passes;
- no accepted lesson remains only in a working note;
- no unresolved CRITICAL/IMPORTANT Reviewer finding;
- integration branch is internally deployable.

### Merge

~~~text
CP7 PASS
→ merge final integration checkpoint into upgrade/gsa-next
~~~

---

# 8. Final promotion checkpoint — replace production line

This is the only checkpoint that changes production `main`.

## Step F1 — review production drift

Before release:

~~~text
latest main
→ reconcile accepted production changes into upgrade/gsa-next
→ resolve only on upgrade/gsa-next
→ rerun CP7 compatibility + E2E gates
~~~

If production hotfixes landed during the upgrade, they must be preserved.

## Step F2 — release candidate freeze

Record:

- exact `upgrade/gsa-next` SHA;
- exact current `main` SHA;
- current production runtime version/hash;
- rollback target;
- compatibility test evidence;
- Tester/Reviewer results;
- Human-invoked CR if requested for final release.

No new feature work enters after freeze.

## Step F3 — Human release decision

Human owns the promotion.

Preferred Git operation:

- fast-forward `main` if ancestry permits;
- otherwise merge `upgrade/gsa-next` into `main` after final drift review.

Do not force-reset or rewrite production history by default.

## Step F4 — production deploy + read-back

At promotion, switch the production Job-creation default so newly created Jobs receive `execution_contract=NEXT`. Existing missing/`V2_STABLE` records retain legacy semantics.

Deploy the exact promoted `main` revision.

Read back:

- runtime version/hash;
- auth health;
- Memory Repo access;
- tool/skill catalog;
- old Job compatibility smoke checks;
- NEXT Job smoke checks.

## Step F5 — rollback rule

If production regression affects current Jobs:

~~~text
stop new NEXT dispatch
→ restore previous production runtime / main release point
→ preserve evidence
→ repair on upgrade branch
→ repeat final promotion gate
~~~

---

## 9. Commit-volume control

The goal is not zero implementation commits.

The goal is that unreviewed/unmerged work never grows without bound.

Rules:

- checkpoint branch may contain working commits;
- squash/finalize before merging into `upgrade/gsa-next`;
- `upgrade/gsa-next` should contain approximately one bounded merge unit per checkpoint plus explicit repair merges when evidence requires them;
- do not carry hundreds of loose checkpoint commits waiting for one final mega-review;
- final review operates on the integrated checkpoint history, not on a single giant unreviewed diff.

---

## 10. What stays untouched until final promotion

Until F3/F4:

- production `main` runtime semantics;
- current READY/IN_PROGRESS Job records;
- historical Job JSON;
- production Job ordering/completion rules;
- default Coder skill activation;
- production Tester routing.

Planning/docs may evolve on `main`, but workflow-changing source is developed and accumulated on `upgrade/gsa-next`.

---

## 11. Overall flow

~~~text
CURRENT MAIN / V2_STABLE-COMPATIBLE
        │
        ├──────── existing Jobs continue normally
        │
        └─ create upgrade/gsa-next
                │
                ├─ CP0 compatibility fence ──MERGE──┐
                ├─ CP1 lessons canonicalization ─MERGE
                ├─ CP2 UI Coder ────────────────MERGE
                ├─ CP3 Tester semantics ─────────MERGE
                ├─ CP4 EvidenceNeed/planning ─────MERGE
                ├─ CP5 checkpoint runtime ─────────MERGE
                ├─ CP6 evidence handoff ───────────MERGE
                └─ CP7 full integration ───────────MERGE
                                                   │
                                 upgrade/gsa-next complete
                                                   │
                           assess production drift before final gates
                                                   │
                                final compatibility + E2E
                                                   │
                                     Human release decision
                                                   │
                                     PROMOTE TO MAIN
                                                   │
                                  production deploy/readback
~~~

Core rule:

> **Merge early into the integration branch; promote late into production main.**
