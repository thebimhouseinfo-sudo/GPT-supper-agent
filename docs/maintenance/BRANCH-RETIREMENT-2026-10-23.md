# GSA Branch Retirement Ledger — 2026-10-23

## GOAL

Retire obsolete historical development lines before opening a new GSA Context Optimization branch, while preserving source truth on `main` and not destroying unmatched Git commits.

- Repository: `thebimhouseinfo-sudo/GPT-supper-agent`
- Approved active development and release line for this cleanup: `main`
- Comparison baseline before retirement: `main` `5c8a739b018b0a9bb68602842dd7f4f7c8cee50f`
- Authorization: Human request in GSA discussion, 2026-10-23, to add RETIRED to lifecycle on `main` and retire surplus branches.
- These are **logical RETIRED declarations**, not claims that the remote Git refs were deleted. The remote ref deletion is separately controlled.
- Classification computed with GitHub compare `base=main`, `head=<branch>` at the above baseline. All 25 non-main refs are marked unavailable for new work. A later HEAD change requires a fresh comparison, not blind deletion.
- Source commits on diverged branches are explicitly **not claimed merged**.

## All 25 non-main branches — RETIRED from new work

| Branch | Observed head SHA | Ahead / behind `main` | Lifecycle | Remote ref at inventory | Deletion disposition |
|---|---|---:|---|---|---|
| `cleanup/stable-v2-next` | `eb26729d27e1e341f07726313d73b44bf94b326d` | 0 / 410 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `fix/llc59-autonomous-ci-20261010` | `1ff6031a4a0f662475fd7dc59242f9fd4f973370` | 0 / 160 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `fix/llc60-planning-review-continuation-20261011` | `84871635d68f88fdb500d764ef2a9f12b76dc8ff` | 0 / 137 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `gsa-v2-coding-super-agent` | `9a0cd3cfb57ae5cf14edfda6af68bab583ad79f9` | 0 / 413 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `phase1-probe-binary` | `32c772abe26b848bc7bf1dcc684b6991119cbb4b` | 0 / 661 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `upgrade/cp0-compat` | `9d6be2da47ed81e2e3f274d45cb9cd98a0859fde` | 0 / 360 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `upgrade/cp6-evidence-handoff` | `4da379a472aa27c13323e9fca79b4e71bef4119b` | 0 / 297 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `upgrade/cp7-final-integration` | `e3dc96b68dee4848769243c09af724d97698dc5e` | 0 / 285 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `upgrade/gsa-next` | `997a693f4be907d82764a4358a73f4cd301bcb03` | 0 / 260 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `upgrade/gsa-refactor` | `081a18493b45ac662773e0f1f7116e30ba2bd738` | 0 / 25 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `upgrade/gsa-reliability` | `e8f7828a2b9c4cab9ec8634b6c4120d1b80e20c0` | 0 / 179 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `upgrade/planner-evidence-context-efficiency` | `db1d6f6b14b963562164cc0b234eca3bf80b471c` | 0 / 1 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `verify/c14a-j4922-baseline` | `89e6dab101d0549ce8bb6e811011633b1de9ce2a` | 0 / 52 | RETIRED | PRESENT | Eligible after PR/dependency check |
| `correction/p0-governance` | `acb247f1c78c233924b00b5f5bd95bb9bfa7abb6` | 35 / 282 | RETIRED | PRESENT | HOLD: unmatched commits; preserve/resolve before deletion |
| `correction/p1-dispatch` | `2527ebe93f533d418a21677bc6a62d6b0c74db06` | 8 / 281 | RETIRED | PRESENT | HOLD: unmatched commits; preserve/resolve before deletion |
| `correction/p2-closure` | `471ed6aee3cf04a67011d63e2225af3da8832f0e` | 28 / 279 | RETIRED | PRESENT | HOLD: unmatched commits; preserve/resolve before deletion |
| `correction/p3-cutover` | `b3d28f35498142937c8f5cc8cf2c7c93fb589af5` | 14 / 278 | RETIRED | PRESENT | HOLD: unmatched commits; preserve/resolve before deletion |
| `feat/gsa-plan-goal-rl-20261013` | `9811589b85262df54f04bf7a9cf07f5c27d778ca` | 9 / 136 | RETIRED | PRESENT | HOLD: unmatched commits; preserve/resolve before deletion |
| `fix/p5-oauth-discovery-staging` | `47b8ba966d0051c2bc06c9ca9dfed7af8deee0c0` | 5 / 275 | RETIRED | PRESENT | HOLD: unmatched commits; preserve/resolve before deletion |
| `phase2/bootstrap` | `d7d02c0f4c03827c89689cfbc5e4c6b09cd4dee4` | 86 / 650 | RETIRED | PRESENT | HOLD: unmatched commits; preserve/resolve before deletion |
| `upgrade/cp1-lessons` | `b28b466bf3213052de8424675a3ef4d978163680` | 6 / 359 | RETIRED | PRESENT | HOLD: unmatched commits; preserve/resolve before deletion |
| `upgrade/cp2-ui-coder` | `d3ea857f34eccb4ac42bf88f31c622db66336c94` | 4 / 358 | RETIRED | PRESENT | HOLD: unmatched commits; preserve/resolve before deletion |
| `upgrade/cp3-tester-semantics` | `dcb70826694b04c1fc08b0bde1e81c0f9486728c` | 6 / 357 | RETIRED | PRESENT | HOLD: unmatched commits; preserve/resolve before deletion |
| `upgrade/cp4-evidence-planning` | `be6aeac1f667ee679e021b5831acc2ea940cc7ac` | 11 / 356 | RETIRED | PRESENT | HOLD: unmatched commits; preserve/resolve before deletion |
| `upgrade/cp5-checkpoint-runtime` | `1f22d7808f2433f55186286fbd592e177a29067e` | 40 / 355 | RETIRED | PRESENT | HOLD: unmatched commits; preserve/resolve before deletion |

## PR disposition

- [PR #26](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/26): **CLOSED, NOT MERGED** (verified 2026-10-23). Historical test-only PR; head `upgrade/gsa-refactor`, base `verify/c14a-j4922-baseline`.
- [PR #16](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/16): **CLOSED, NOT MERGED** (verified 2026-10-23). Historical staging OAuth PR; head `fix/p5-oauth-discovery-staging`, base `upgrade/gsa-next`. Its unmatched commits remain at the branch ref, not yet deleted or archived under an independent ref.

## Outstanding cleanup

1. Check for ongoing Jobs/deployments using any retired branch before physical deletion; do not redirect an in-progress source write silently.
2. Close obsolete draft PRs without merging and record the outcomes.
3. Delete the 13 fully-contained remote refs only if a GitHub branch-delete capability is available and fresh comparison remains `ahead=0`, after checking active consumers.
4. For the 12 diverged refs, audit remaining unique commits and create/read back an independent archive Git ref or independently establish that the exact history is intentionally discarded. **Do not delete now.**
5. Recheck the remote inventory, then update `Remote ref` from PRESENT to DELETED only with verification. Until then, branch count does not decrease, despite logical RETIRED status.

## New-work invariant

Only `main` is retained as the active integration line. Any future Context Optimization development branch starts from the latest verified `main`, receives an explicit unique name, and must not resurrect a retired ref or inherit obsolete Job evidence.
