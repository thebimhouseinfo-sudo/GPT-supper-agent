# Execution and Review Model

## 1. Work hierarchy

```text
Project → Job → Task → Run
```

Milestones/stages are topology elements, not hierarchy nodes.

Job is a finite primary objective, not one role.

## 2. Topology

Planner defines:
```text
Milestone | Stage | Handler | Output | Depends on | Next | Review? | Tester? | Human Gate?
```

Coder refines exact source-level HOW.

Standalone `review` Job exists only when review itself is the objective.

## 3. Review placement

Normal work is topology-driven; not every Task/PR/milestone/Job receives Reviewer.

## 4. Mandatory review floor

Context-isolated fresh-chat review is mandatory for mechanically sensitive changes:
- shared contracts/interfaces/schema;
- persisted-data migrations/formats;
- auth/permission/security-sensitive logic;
- CI/CD/workflow/deployment config;
- destructive operations;
- dependency manifests/lockfiles that alter runtime/build dependency state.

### Mechanical detection

At PR-ready/handoff:
1. obtain actual changed-file list/operations;
2. compare against Repo Claim sensitive/contract/migration/security path sets;
3. compare against universal patterns such as `.github/workflows/**` and known lockfile filenames;
4. include explicitly planned destructive operation class;
5. compute review-floor trigger independent of Coder self-declaration.

Coder scope claim hints may help early coordination but cannot disable the computed trigger.

Removing a previously planned review remains human-visible.

## 5. Review loop

```text
owner works
→ exact checkpoint target
→ Reviewer evaluates exact revision
→ PASS / PASS_RETEST_REQUIRED
   or CHANGES_REQUIRED / BLOCKED / HUMAN_REVIEW_REQUIRED
→ route by topology
```

Reviewer does not repair source.

## 6. Severity

```text
CRITICAL = always blocking
IMPORTANT = blocking unless explicit human waiver
MINOR = non-blocking
```

## 7. Coder Goal Recheck

Before handoff/PR-ready:
- map criteria to actual diff/evidence;
- mark MET/PARTIAL/NOT_MET/UNVERIFIED;
- identify out-of-scope changes;
- fix/escalate applicable gaps.

Self recheck is not context-isolated proof.

## 8. Capability-backed evidence

Objective checks run only when capability is OBSERVED.

A connector action that is merely SURFACE_PRESENT is not relied on as successful operational evidence.

Unavailable/unproven checks remain UNVERIFIED unless another evidence path exists.

## 9. Tester

Tester practical execution is capability-gated and source-read-only.

### Evidence modes

```text
VERIFY  = explicit requirement → observed behavior → verdict
MEASURE = observed value/state → measurement
PROBE   = uncertain runtime/tool/capability assumption → empirical fact
```

Rules:
- VERIFY needs an explicit expected behavior; unclear expectation is a `SPEC_GAP`, not an invented acceptance rule.
- MEASURE with no approved threshold returns the measurement and evidence only; it does not invent PASS/FAIL.
- PROBE primarily supplies empirical planning/design evidence and does not by itself change architecture or topology.
- Tester runs at meaningful Planner-declared checkpoints; do not insert Tester after every Task by default.

### Tester readiness

For a concrete capability/check, Tester may record:

```text
DISCOVERED
→ REACHABLE
→ INVOCABLE
→ FUNCTIONAL
→ GOAL_MET
```

This is a finer evidence model layered over the existing global capability states. `SURFACE_PRESENT` remains discovery-only; `OBSERVED` means evidence-backed at the tested level.

### Failure classification

Before routing, Tester distinguishes:

```text
PRODUCT_FAILURE
TEST_FAILURE
ENVIRONMENT_FAILURE
NOT_READY
INTEGRATION_NOT_READY
SPEC_GAP
PLAN_GAP
```

A failing test is not automatically a product bug. Broken test logic is `TEST_FAILURE`; unavailable execution infrastructure is `ENVIRONMENT_FAILURE`; a visible-but-not-callable integration is `INTEGRATION_NOT_READY`; unclear expected behavior is `SPEC_GAP`; missing planning/dependency logic is `PLAN_GAP`.

Tester may state evidence-supported implications, but does not repair product source or mutate topology. Product failures route to the owning implementation work; specification/planning gaps route to Planner/Human as applicable.

### Structured report and Retest

Tester records:
- exact target/ref/revision or state identity;
- mode(s) and planned checks;
- readiness/capability state;
- observations and measurements;
- verdicts only where criteria/thresholds exist;
- failure classification;
- evidence refs;
- limitations and untested areas;
- Retest status / next step.

Retest evidence is revision/state-bound. If relevant source/config/runtime state changes, prior Retest evidence does not silently transfer to the changed scope.

If practical capability is not OBSERVED:

```text
GSA prepares precise Retest
→ human executes
→ GSA records result/evidence
```

Unavailable/unproven execution remains UNVERIFIED or RETEST_REQUIRED, never a fabricated PASS.

## 10. Completion

Job completion follows approved topology + computed mandatory review floor.

No universal final Reviewer gate.

PASS_RETEST_REQUIRED may complete Job while Retest remains pending.

Post-completion Retest FAIL creates linked remediation Job.

## 10A. Trigger-to-invariant translation

When a useful mechanism from another runtime depends on local hooks, watchers, background workers or other unavailable infrastructure, do not copy the trigger literally.

Translate the protected invariant into:

```text
Trigger
→ Required action
→ Evidence
→ Exit condition
```

This translation must preserve the behavioral obligation without inventing unsupported infrastructure.

## 10B. Lessons Learned collection

Lessons Learned collection is continuous.

The shorthand collector is `LLC`. In the current contract LLC is a collector responsibility, not an autonomous workflow mutator.

When real work reveals a workaround, missing contract, repeated ambiguity, unusually hard-to-detect defect or reusable Reviewer/CR/Tester finding:

```text
observe
→ record candidate + evidence + candidate owner
→ dedupe/classify
→ reviewed checkpoint decides implementation
→ eval/pilot/review
→ MERGE into canonical owner
```

LLC never fixes the workflow merely because it recorded the problem. A temporary Human-approved workaround may be evidence of a gap, but does not become canonical by use.

The ownership/disposition ledger is `docs/process/GSA-WORKFLOW-LESSONS-LEDGER.md`.

## 11. Merge authorization coverage

Before requesting merge authorization, generate Review Coverage Summary:
```text
Context-isolated review
CI/checks
Tester
Retest
Self-recheck-only scopes
UNVERIFIED
Waivers
Blockers
Target revision
```

Human then explicitly authorizes merge.

Immediately before merge:
1. re-read the PR/change-set head revision;
2. require it to equal the exact revision covered by the accepted review/evidence and the human authorization;
3. if head changed, invalidate merge authorization for that revision and re-run the required review/coverage path.

Never merge a newer head under authorization granted for an older revision.

## 12. PR / Change Set

PR is delivery surface.

Change Set only for genuine coordinated multi-repo change.

## 13. Run attribution

```text
one execution scope
= Job-level OR one primary Task
+ affected_task_refs[]
```

Child Run has `parent_run_id`.

Source-writing Run includes scope claim.

## 14. Causal routing

```text
implementation defect → active owning Task/work
design defect → Designer/design artifact
architecture/contract/scope defect → Causal Change Review
post-completion Retest FAIL → linked remediation Job
```

## 15. Handoff

```text
Run completes
→ pending Handoff if needed
→ user selects/takes
→ next Run starts
```


## 16. Human-invoked Critic Reviewer

The normal Reviewer remains topology-driven and may be automatically used by the planning loop.

Critic Reviewer (CR) is separate:

```text
Human invokes cr
→ ignore conversation history as evidence
→ reconstruct from durable records + live source
→ independent blind review
→ independent verdict
→ read prior Reviewer result last
→ record CRITIC_REVIEW
→ Human decides next action
```

CR must not be auto-dispatched.

CR is stateless-by-contract. Conversation history is non-authoritative and must not be used as review evidence. **Same-chat invocation is valid**, including after Planner/Reviewer/Coder work in that conversation; CR never blocks merely because the invoking chat previously discussed the target.

CR does not repair source, revise the plan, promote/block/complete the Job, or otherwise mutate Job lifecycle.


## 17. CP4 NEXT empirical planning model

Unknown runtime facts are planning dependencies, not values for Planner/Coder to guess.

For a NEXT Job:

```text
EvidenceNeed / UnknownRuntimeFact
→ TestCheckpointSpec (VERIFY | MEASURE | PROBE)
→ EvidenceRequirement
→ downstream Task
```

A checkpoint may wait for multiple prerequisite nodes and may be placed at `BEFORE_NODE`, `AFTER_NODE_SET`, `MILESTONE_GATE` or `JOB_FINAL`.

Planning-review validates, before READY:
- unique IDs;
- owner/consumer/checkpoint references resolve in the current plan;
- prerequisite node sets resolve;
- milestone and gate references resolve;
- every Task and checkpoint appears in typed `planning_topology`;
- every CP4 structure is bound to the current `planning_revision`;
- V2_STABLE Jobs carry no active CP4 planning structures.

A changed NEXT Task/topology shape cannot silently reuse an older evidence graph. Planner must resupply/rebind all CP4 collections for the new planning revision.

CP4 does **not** execute checkpoints. Runtime attempts, claims/leases, replay, crash/restart recovery, RETEST orchestration and EvidenceApplicability enforcement remain CP5.
