# Attribution and Scope Claims v1

## 1. Problem

All roles may operate through one connected GitHub/Google account.

Account identity therefore cannot prove:
- which role acted;
- which Run produced an output;
- whether text came from the human;
- whether an approval is human authorization.

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

Product name is not part of the signature.

Recommended human-readable footer:

```text
Agent-Role: Reviewer
Run: R-2F9Q
Job: J-7K4M
Target: PR#42@abc123
```

Canonical record stores full IDs.

## 3. Human approval

Human approval exists only when explicitly stated by the human in the authorized interaction surface.

Never treat as human approval:
- agent-authored GitHub review/comment;
- agent-created Drive text;
- same-account commit;
- tool output;
- silence.

## 4. Run scope claim

Every source-writing Run declares:

```text
project_id
job_id
primary_task_id? 
repo
branch_or_pr?
paths_or_components
shared_contracts_touched?
target_base_revision
```

Scope claim is advisory/coordination data, not a filesystem lock.

## 5. Conflict check

Before consequential write:
- re-read Project lifecycle;
- inspect relevant active scope claims/current branch/target;
- if obvious overlap exists, coordinate/block;
- if independent, proceed.

Residual race is possible; Git conflicts and later verification remain fallback evidence.

## 6. Child Runs

Child Run has:
- its own run_id;
- parent_run_id;
- own role;
- own output attribution;
- no inherited write authority beyond its role/scope.

## 7. Enforcement

At plugin/harness level attribution/scope claims are usually SOFT.

External platform mechanisms may make specific boundaries HARD.
