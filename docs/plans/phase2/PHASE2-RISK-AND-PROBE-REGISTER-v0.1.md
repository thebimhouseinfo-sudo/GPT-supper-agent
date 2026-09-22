# Phase 2 Risk / Probe Register v0.1

## Status

```text
PURPOSE = execution risk control
OWNER = Planner / Orchestrator
UPDATE = during milestones and pilot
```

| ID | Risk / unknown | Current control | Trigger to revisit | Blocking? |
|---|---|---|---|---|
| R-01 | Drive shared mutable overwrite | append-preserving Runs/Verification + read-time join | implementation introduces shared progress writes | Yes if violated |
| R-02 | Cross-chat race | consequential-action recheck + scope claims | real race causes unsafe overwrite/action | Yes if unsafe |
| R-03 | Duplicate OWNED repo claim | proactive shallow root scan + write-time backstop | ambiguous/duplicate claim | Yes |
| R-04 | Review-floor false negative | actual diff + repo-sensitive paths + universal patterns | sensitive change escapes classifier | Yes |
| R-05 | Review-floor over-trigger | topology + concrete matched reasons | routine changes repeatedly require unnecessary review | Calibration |
| R-06 | Shared account attribution confusion | role + Run + work + target signature | agent output mistaken for human approval | Yes |
| R-07 | Branch cleanup unavailable | never assume delete; best-effort/manual/reset | branch accumulation becomes operational issue | No |
| R-08 | Tester runtime unavailable | Human Retest fallback | runtime capability becomes OBSERVED | No |
| R-09 | Generated image persistence unknown | probe before first asset workflow relying on it | M5 requires direct persistence | Conditional |
| R-10 | Protected branch behavior unknown | probe before relying on branch protection as HARD control | first protected-repo pilot | Conditional |
| R-11 | Context packet too large | minimum-sufficient context | repeated omission or context overload | Calibration |
| R-12 | CONTROL stale | durable fallback + rebuild | status disagrees with durable records | No if fallback works |
| R-13 | Schema/harness drift | schema tests + canonical references | template/schema mismatch | Yes if semantic |
| R-14 | Job scope creep | Planner scope-growth rule | new work no longer fits finite objective | Yes until linked Job |
| R-15 | Retest history duplication | one semantic Retest record family + append attempts | inconsistent PASS/FAIL reconstruction | Calibration/possibly blocking |
| R-16 | Pilot too broad | one vertical slice only | pilot starts absorbing full app migration | Yes—re-scope |

---

# Probe register

## P-01 — protected/default branch behavior

```text
Timing = before first workflow that relies on branch protection as HARD enforcement
Current = UNKNOWN
Fallback = treat review/merge governance as SOFT + explicit human authorization
```

## P-02 — generated-image direct persistence

```text
Timing = before M5 first flow that requires generated binary persistence
Current = UNKNOWN
Fallback = Asset Requirement + human/manual placement + Retest
```

## P-03 — practical runtime/browser Tester

```text
Timing = before M6 autonomous Tester claim
Current = UNKNOWN
Fallback = Human Retest
```

## P-04 — GitHub PR diff/review/Actions surfaces

```text
Timing = as M4 first exercises each action
Current = SURFACE_PRESENT
Fallback = source/PR inspection through available read surfaces + UNVERIFIED where evidence unavailable
```

---

# Risk handling

```text
risk materializes
→ capture exact evidence
→ classify:
   implementation defect
   capability limitation
   harness quality issue
   semantic/theory gap
→ route smallest causal fix
```

Do not redesign the entire harness from one isolated operational inconvenience.
