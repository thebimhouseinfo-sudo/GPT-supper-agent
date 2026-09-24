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

Tester practical execution is capability-gated.

If not OBSERVED:
```text
GSA prepares Retest
→ human executes
→ GSA records result/evidence
```

## 10. Completion

Job completion follows approved topology + computed mandatory review floor.

No universal final Reviewer gate.

PASS_RETEST_REQUIRED may complete Job while Retest remains pending.

Post-completion Retest FAIL creates linked remediation Job.

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
