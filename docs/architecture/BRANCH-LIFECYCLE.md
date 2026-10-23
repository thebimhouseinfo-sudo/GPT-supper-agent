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
