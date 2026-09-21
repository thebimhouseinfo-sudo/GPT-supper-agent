# Execution and Review Model v1.1

## 1. Work hierarchy

```text
Project → Job → Task → Run
```

Milestones/stages are topology elements, not hierarchy nodes.

Job = finite primary objective, not one role.

## 2. Topology

Planner defines:
```text
Milestone | Stage | Handler | Output | Depends on | Next | Review? | Tester? | Human Gate?
```

Coder refines exact source-level HOW.

A standalone `review` Job is used only when review itself is the objective; review checkpoints inside another Job do not become separate review Jobs automatically.

## 3. Review placement

Normal work:
> Review is placed where topology requires independent evaluation.

Not every Task/PR/milestone/Job receives Reviewer.

## 4. Mandatory review floor

Independent fresh-chat review is mandatory when mechanically detectable change classes include:
- shared contracts/interfaces/schema;
- persisted-data migrations/formats;
- auth/permissions/security-sensitive logic;
- CI/CD/workflow/deployment config;
- destructive operations;
- dependency manifests/lockfiles when runtime/build dependency state changes.

The Planner cannot silently remove these checkpoints.

If a previously planned non-mandatory review is removed/merged, the topology change is shown to the human.

## 5. Review loop

```text
owner works
→ exact checkpoint target
→ Reviewer evaluates exact revision
→ PASS / PASS_RETEST_REQUIRED
   or CHANGES_REQUIRED / BLOCKED / HUMAN_REVIEW_REQUIRED
→ route according to topology
```

Reviewer does not repair source.

## 6. Finding severity

```text
CRITICAL = always blocking
IMPORTANT = blocking unless explicit human waiver
MINOR = non-blocking
```

## 7. Coder Goal Recheck

Before handoff/PR-ready:
- map each applicable acceptance criterion to actual diff/evidence;
- mark MET / PARTIAL / NOT_MET / UNVERIFIED;
- identify changes not traceable to approved scope;
- identify missing implied requirement without inventing it;
- fix or escalate PARTIAL/NOT_MET.

Goal Recheck is judgement-based self-check evidence, not independent proof of runtime correctness.

## 8. Capability-backed evidence

Objective checks run only when capability exists.

Examples:
- CI;
- build/test/lint;
- deploy/preview;
- runtime/browser;
- screenshot.

Unavailable checks are UNVERIFIED, not PASS.

## 9. Tester

Tester practical execution is capability-gated.

If unavailable:
```text
GSA prepares Retest
→ human executes practical steps
→ GSA records evidence/result
```

## 10. Completion

Job completion follows approved topology plus mandatory review floor.

No universal final Reviewer gate.

PASS_RETEST_REQUIRED may complete a Job while Retest remains pending.

Later Retest FAIL after completion creates a new linked remediation Job.

## 11. Merge authorization coverage

Before requesting merge authorization, show:
```text
Independent review : status / none
CI/checks          : status / unavailable
Tester             : status / unavailable
Retest             : pending / none
Self-recheck only  : scopes
UNVERIFIED         : explicit list
Waivers            : explicit list
```

Then human explicitly authorizes merge.

## 12. PR / Change Set

PR is delivery surface, not lifecycle root.

Change Set exists only when one logical change coordinates multiple repos.

## 13. Run attribution

Run:
```text
one execution scope
= Job-level OR one primary Task
+ affected_task_refs[]
```

Child Run has `parent_run_id`.

Source-writing Run includes scope claim.

## 14. Causal failure routing

```text
implementation defect → owning active Task/work
design defect → Designer/design artifact
architecture/contract/scope defect → Causal Change Review
post-completion Retest FAIL → new linked remediation Job
```

## 15. Current handoff

```text
Run completes
→ pending Handoff if needed
→ user selects/takes Handoff
→ next Run starts
```
