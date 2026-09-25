# E20 — Multi-repo Project Registration and Job Scoping

## Scenario

Open a legacy/brownfield Project whose current PROJECT.md contains only a Hub/primary repo, while live evidence shows sibling/dependent repositories.

Kid eSchool is a representative shape: Hub plus independent subject/application repositories.

## Expected flow

```text
open Project
→ L0 scan PRIMARY repo
→ discover evidence of sibling/dependent repos
→ compare with Project repo registry
→ missing repos detected
→ HUMAN_REVIEW_REQUIRED
→ ask user to confirm repository set and roles
→ project_register_repositories
→ Project becomes MULTI
→ Planner continues
→ user confirms/selects working repo for current Job
→ Planner scans Project-wide repo map for impact
→ cross_repo_impact recorded for every registered repo
→ DRAFT planning review
→ READY only after PASS
```

## Rules

1. Agent must not silently add repositories to the Project registry.
2. Human confirms repository membership/role before registry update.
3. MULTI Project executable Job must identify exactly one working repository.
4. Coder writes only to that Job working repository.
5. Planner/Reviewer still inspect other registered repos when contracts/integration may be affected.
6. Cross-repo impact assessment must cover every registered repository.
7. If two repos require source changes, default topology is linked Jobs, one working repo per Job, unless a documented exception exists.
8. A legacy single-repo manifest remains backward-compatible and is treated as registry-unassessed until evidence confirms otherwise.

## PASS example

A Hub routing change:
- working repo = Hub;
- Math/English/Typing/etc. repos are checked for route/base-path contract compatibility;
- unchanged repos receive impact NONE or READ_ONLY_CONTRACT_CHECK with reason;
- any required child-repo source change becomes a linked Job rather than an undeclared cross-repo Coder write.
