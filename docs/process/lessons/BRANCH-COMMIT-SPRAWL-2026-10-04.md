# Branch and commit sprawl lesson — 2026-10-04

Status: CANDIDATE / LLC collection only. This note records workflow debt and does not itself change branch policy.

## WL-030 — One canonical integration line; temporary branches must not become competing sources of truth

During the GSA upgrade, too many checkpoint branches and intermediate commits remained alive for too long. Although most changes eventually merged, the repository accumulated many historical lines such as CP branches plus the integration branch. This made later audit and cleanup unnecessarily difficult:

- code appeared distributed across multiple branch histories;
- it became unclear whether one branch contained unique logic or merely an earlier/later version of the same file;
- reviewers had to compare ancestry, merge trees and semantic diffs before deciding what source was authoritative;
- hundreds of intermediate commits obscured the small number of final production changes that actually mattered;
- cleanup required reconstructing a clean line from the stable-v2 baseline and final production tree;
- branch/history complexity increased the chance of missing code, duplicating work, or accidentally treating an obsolete branch as current source truth.

### Required workflow principle

For a migration/upgrade with a designated integration branch:

1. Exactly one branch is the canonical active integration line.
2. A checkpoint/topic branch may exist only as a short-lived workspace.
3. While a checkpoint branch is active, the integration line must not independently evolve in a way that creates a competing implementation line for the same migration scope.
4. When the checkpoint passes review/test, merge it promptly into the canonical integration branch.
5. After merge and read-back verification, mark the checkpoint branch disposable and remove it after any required retention window.
6. Do not keep hundreds of implementation commits as the only way to reconstruct the intended final design. Maintain meaningful checkpoint boundaries and a clear release baseline.
7. Before final promotion, compare the integration branch against the stable baseline and ensure the final source tree can be explained by a small set of meaningful upgrade outcomes.
8. If branch history has already become noisy, do not guess which branch/file is correct. Perform ancestry + tree + semantic diff analysis first; only then consolidate.

### Evidence

Observed in the GPT-supper-agent migration:
- multiple upgrade/cp* branches remained after their checkpoint had already merged;
- upgrade/gsa-next remained alongside those branches through later checkpoints;
- post-promotion audit had to determine whether CP6 and gsa-next were competing sources or ancestor/descendant states;
- stable-v2 had to be used as a clean baseline to reconstruct a compact production history from the final source tree.

### Intended future owner

Future branch/checkpoint lifecycle and release-cleanup contract, likely owned by the migration roadmap plus execution/review policy.
