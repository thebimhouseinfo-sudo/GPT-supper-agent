# Attribution and Scope Claims v1.1

## 1. Problem

All roles may operate through one connected GitHub/Google account.

Account identity cannot prove role, Run ownership, or human approval.

## 2. Agent attribution signature

Important durable/externally visible agent outputs carry:

```text
role
run_id
job_id
task_id? / job-level scope
target_ref
target_revision
```

Canonical records store full IDs.

## 3. Human approval

Human approval exists only when explicitly stated by the human in the authorized interaction surface.

Never infer human approval from agent-authored comments, commits, Drive records, tool output or silence.

## 4. Run scope claim

Every source-writing Run declares:

```text
project_id
job_id
primary_task_id?
repo
branch_or_pr?
paths_or_components
shared_contracts_touched?   # coordination hint only
target_base_revision
```

The scope claim is advisory coordination data, not a lock.

`shared_contracts_touched?` is **not** the determinant of the mandatory independent review floor.

## 5. Mechanical review-floor classification

At PR-ready/handoff time the harness independently classifies the actual proposed change.

Inputs:
- actual changed-file list/diff metadata;
- Project/Repo Claim declared path sets:
  - sensitive_paths[];
  - contract_paths[];
  - migration_paths[];
  - security_sensitive_paths[];
- universal patterns;
- explicitly planned destructive operation class.

Universal baseline patterns include at least:
```text
.github/workflows/**
common dependency lockfiles by exact filename
```

Repo-specific migration/auth/shared-contract conventions belong in structured Repo Claim metadata.

Classification is computed from actual change evidence, not Coder omission/self-report.

If classification triggers a mandatory class, independent fresh-chat review is required.

## 6. Conflict check

Before consequential write:
- re-read Project lifecycle;
- inspect relevant active claims/current branch/target;
- coordinate/block obvious overlap;
- proceed only when scope remains valid.

Residual race is possible; Git conflicts/verification remain fallback evidence.

## 7. Child Runs

Child Run has its own:
- run_id;
- parent_run_id;
- role;
- attribution;
- role-constrained authority.

## 8. Enforcement

At harness level attribution, scope claims and review-floor classification are normally SOFT unless an external platform mechanism makes them HARD.
