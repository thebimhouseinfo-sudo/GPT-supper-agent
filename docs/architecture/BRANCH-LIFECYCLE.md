# Source Branch Lifecycle

## GOAL

Make source-branch retirement explicit, durable and safe without creating another Project or Job state, or treating removal of a Git ref as proof that work was completed.

## Lifecycle

```text
ACTIVE → RETIRED
```

- **ACTIVE** means an eligible source branch exists and may be selected by the Human-approved Project branch policy. Only configured Development/Release branches are valid default integration targets; an unconfigured branch is not implicitly active for writes.
- **RETIRED** is a terminal, historical status: do not select it for new Jobs, planning integration, source writes, merges or deploys. If the same work must resume, create a new branch from the current approved Development Branch, preserving explicit lineage.
- **RETIRED does not mean DELETED.** The Git ref may continue to exist for historical or safety reasons. Deleting the remote ref is a separate destructive operation. `SUPERSEDED` Job and `ARCHIVED` Project have distinct semantics.

## Durable record

Record retirement in the owning Project's authorized GitHub Memory Repo when that Project is configured, or, for repository-wide maintenance such as the GSA source repository, in a canonical versioned retirement ledger on `main`. Use one record per branch with:

```text
repository | branch | observed_head_sha | main_ancestor_relation
lifecycle = RETIRED
retired_at | human_authorization | reason | refs_or_open_prs
physical_ref = PRESENT | DELETED | UNKNOWN
deletion_disposition = SAFE_AFTER_PR_REVIEW | PRESERVE_DIVERGENT | BLOCKED
```

No new dedicated Job, gate entity, or background daemon is created only to track retirement. In the Project Memory branch registry, an optional `## Retired Branches` section can record `- <repository_url> | branch=<name> | sha=<40-hex> | status=RETIRED`; any branch policy selection for a retired branch must be rejected. Legacy manifests without this section remain valid.

## Retirement procedure

1. Re-read the live repository's default/integration refs and **full** branch inventory; record exact head SHAs. Compare each branch with the current approved integration target. Identify open PRs and referenced active Jobs.
2. Classify each candidate with real evidence. A branch with `ahead_by=0` relative to `main` is already contained in `main`. A diverged branch must not be described as merged even if similar changes were cherry-picked or squashed.
3. Verify explicit Human authorization, ensure neither the configured Development nor Release branch nor the default/protected branch is accidentally retired, and reconcile ongoing Jobs/PRs.
4. Persist `RETIRED` and read it back. Thereafter never route new work to the retired branch, whether the remote ref is still present or not.
5. Delete a fully-contained branch ref only through an authorized Git operation after PR/dependency review. Before deleting a divergent ref, independently resolve its unique commits and preserve them under an independently verified durable Git tag/archive ref when their historical recovery is required. **A SHA mentioned in Markdown alone is not an archive ref.**
6. Re-read the remote ref inventory and update the record's `physical_ref` fact; never claim deletion from a proposed action or a ledger entry.

## Safety rules

- `main`, the Git default branch, and the Project's approved integration branch are protected from accidental retirement.
- Git comparison is a branch-content check, not a complete safety check. An open PR, ongoing Job, active deployment dependency or hidden consumer may still block deletion.
- Retirement is not a bulk source-code merge; do not import the older branch merely because it has unique commits.
- A surviving remote branch that has been retired is historical, not an invitation to re-open it.
- If branch-deletion capability is unavailable, record `physical_ref=PRESENT` and report the unfinished physical cleanup. Do not silently equate logical retirement with remote removal.

## Task-owned Working Branches (design defect repair)

This is a repair of source-branch governance, **not a change to product Criteria**. The
Human-configured Development Branch is the integration anchor, not the only writable
Git branch. The configured Release Branch remains a separate Human-controlled gate.

A Working Branch belongs to one authorized Project/Job/Task and may coexist with
other task/experiment branches. The Project Manifest's optional `## Working Branches`
section contains one JSON object prefixed with `- ` per branch. This extends the
existing Project Memory contract; it is not a separate branch database or Job state.

Each record contains: `repository_url`, `branch`, `project_id`, `owning_job_id`,
`owning_task_id`, `purpose`, `parent_development_branch`, `release_branch`,
`base_sha`, `integration_target`, `dependencies`, `owner`,
`authorization_ref`, `handoff_recipient`, `closure_owner_job_id`,
`closure_owner_task_id`, `deliverables`, `merge_conditions`,
`retire_conditions`, `status`, `disposition`, `final_head_sha`,
`handoff_ref`, `closure_evidence_ref` and `physical_ref`. Merge records
also carry independently checked `review_ref`, `ci_ref`,
`dependencies_verified_ref`, `integration_sha` and
`merge_authorization_ref`. Keeping a remote ref after logical closure
requires `preservation_ref` for a Human KEEP decision.

The lifecycle is:

```text
PROPOSED → AUTHORIZED → ACTIVE → READY_FOR_HANDOFF → REVIEW → MERGED → CLOSED
                         ↘ RETIRED ────────────────────────────────↗
```

AUTHORIZED is bound to existing Job/Task authority, **not an additional per-branch
Human approval gate**. Source mutation on a Working Branch requires an active
Project, OWNED repo, current Development/Release mapping, non-retired registration,
matching Job and Task, authorization evidence and an AUTHORIZED/ACTIVE lifecycle.
A branch in READY_FOR_HANDOFF, REVIEW, MERGED, RETIRED or CLOSED is not writable.
Development Branch writes retain existing authority checks; Release/Main source
writes do not become authorized by being part of this lifecycle.

`working_branch_prepare` prepares registration or status transitions for normal
GitHub Memory Repo CAS/readback. It does **not** create or delete a Git ref, merge
a PR, or deploy. A registered branch's base SHA must be reconciled with live Git,
and branch status/evidence are not trusted without independent readback.

### Convergence / integration ownership

For parallel M01/M02 and downstream M03:

- M01 and M02 produce distinct task-owned branches and hand off their final SHA
  and evidence to M03; they do not remove the branch themselves.
- M03 is explicitly the Convergence Task, Integration Owner and Branch Closure
  Owner, and owns all incoming branches declared in its Task record.
- M03 independently verifies dependencies, findings, acceptance, review/CI,
  selects MERGED or RETIRED, integrates only authorized results, records each
  final disposition and actual Git ref state, and performs the downstream handoff.
- A successful `run_complete` for a convergence Task is rejected until all
  incoming branch names exactly match its closure-owned branches, each branch is
  CLOSED with final SHA, disposition, evidence, handoff and verified physical ref,
  and a downstream Handoff is prepared. An orphan branch is never silently
  discarded or relabeled DONE.
- An unsuccessful experiment may be RETIRED without a merge. A Human KEEP
  branch is closed logically while the physical Git ref is retained and
  `preservation_ref` records the exception.

### Task/Job snapshots and baseline reconciliation

The `working_branch_prepare` handler requires exact owning Job JSON and blob SHA.
If the Closure Owner is in a different Job, a second exact Job JSON/SHA is
required. Both Job/Task identities must match the registration; the closure
Task must be declared as Convergence and be reachable through the Task DAG
(or a verified cross-Job dependency). Before the branch becomes AUTHORIZED or
ACTIVE, the current applicable Job revisions must have Reviewer PASS, and
the Convergence Task must explicitly declare that incoming branch.

A registered branch's source write must retain its exact authorized
Development HEAD baseline and, where the base SHA diverges, a documented
reconciliation plan. Missing baseline or required reconciliation fails
closed even when the branch name and owning Task match.

Only one non-CLOSED branch may own the same repository/Project/Job/Task.
The registration freezes Project/Job/Task ownership, branch purpose,
task dependencies, deliverables and merge/retire conditions across every
lifecycle transition; a transition may add evidence but cannot rewrite
the approved Task contract. For cross-Job convergence, the closure Job
must link to the source Job and its Convergence Task must explicitly
depend on the source Task.

A duplicate Task branch is rejected, rather than silently created. Existing
authorized branches should be reused. A new branch for that Task requires
verified closure of the prior branch; simply RETIRED is not enough.

The registration records the exact `base_sha` and the independently
verified `development_head_sha` at authorization. If they differ, a
nonempty `reconciliation_plan` is required, and the Convergence Owner must
reconcile ancestry against live Git. Both Git and Job/Project Memory SHAs
must be fetched and read back externally: a caller-provided snapshot alone
does not prove current authority.

If an owning Task becomes RETIRED or superseded, its existing branch may
still transition to RETIRED/CLOSED under its registered Convergence/Closure
Owner. It may not resume authorized source writes. A retained Git ref
requires an explicit `preservation_ref`, `preservation_owner` and
`preservation_reason`; KEEP does not rewrite MERGED/RETIRED disposition.

For NEXT Run completion, the currently reviewed Job Task's
`convergence_task` and `incoming_branches` must match the Run record.
Stripping the Run flag or omitting an incoming branch cannot bypass M03
closure. The normal Coder Goal Recheck and independent Tester/Reviewer
requirements remain in force after Convergence checks pass.

This contract does not transfer merge or production authority. Source mutation,
integration merge, Main release merge, ref deletion and production deployment
remain separately authorized, independently reviewed and verified against exact
source/target commits. Tests and CI are not production verification.
