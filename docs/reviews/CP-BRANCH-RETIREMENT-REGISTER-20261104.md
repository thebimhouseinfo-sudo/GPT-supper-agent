# CP0–CP7 Branch Retirement Register — GSA4 baseline

**Date:** 2026-11-04. **Disposition:** `RETIRED_FOR_FUTURE_WORK` / `DO_NOT_MERGE`.  
**Reviewed destination:** `upgrade/gsa-context-efficiency` @ `fb5b2427cba5908963a198b154345c775321b635`.  
**Important distinction:** this is a **logical retirement record**, NOT evidence of remote branch deletion. GitHub tools available to this Direct Agent do not expose Git branch-ref deletion. The refs listed below still exist until a user/connected Git client deletes them. Do not report deletion completed.

| CP branch | Pinned head | Unique commits vs development | Disposition |
| --- | --- | ---: | --- |
| `upgrade/cp0-compat` | `9d6be2da47ed81e2e3f274d45cb9cd98a0859fde` | 0 | Historical, behind; retire |
| `upgrade/cp1-lessons` | `b28b466bf3213052de8424675a3ef4d978163680` | 6, diverged | Historical source lessons; audit completed; retire, don't overlay newer docs |
| `upgrade/cp2-ui-coder` | `d3ea857f34eccb4ac42bf88f31c622db66336c94` | 4, diverged | UI Coder document identical in current GSA4; retire old monolithic port |
| `upgrade/cp3-tester-semantics` | `dcb70826694b04c1fc08b0bde1e81c0f9486728c` | 6, diverged | E27 identical/current Tester leaf exists; retire |
| `upgrade/cp4-evidence-planning` | `be6aeac1f667ee679e021b5831acc2ea940cc7ac` | 11, diverged | E28 identical/current planning schema+preflight exist; retire |
| `upgrade/cp5-checkpoint-runtime` | `1f22d7808f2433f55186286fbd592e177a29067e` | 40, diverged | Current checkpoint modules + updated E29; preserve historical evidence SHA; retire |
| `upgrade/cp6-evidence-handoff` | `4da379a472aa27c13323e9fca79b4e71bef4119b` | 0 | Ancestor of current; retire |
| `upgrade/cp7-final-integration` | `e3dc96b68dee4848769243c09af724d97698dc5e` | 0 | Ancestor of current; retire |

**Review backing:** `docs/reviews/GSA4-A4-UNMERGED-UPDATE-PACKS-REVIEW-20261104.md`. CP1–CP5 are **not being represented as exact wholesale merged source**; they have unique historical commits and are superseded by later GSA functionality. Their SHA evidence should remain reachable until a permanent archive/tag or GitHub PR/commit reference is verified.

**When authorized Git branch deletion becomes available**, verify exact expected SHA for each CP ref before deleting. Do not delete a ref whose head changed or which is referenced by active CI/PR/work. Use the repository's GitHub web **Branches** page to delete these eight `upgrade/cp*` refs individually (or an authenticated Git client), then verify they are absent. Never delete development, main, either of the new two arms, PR #34/#38/#40 source branches before winner selection, or the review branch.

**Benchmark separation:** CP retirement is historical housekeeping. The new head-to-head test uses only two feature branches:
`experiment/gsa4-pack-rework-gsa3-control` and `experiment/gsa4-pack-rework-gsa4-candidate`. Old PRs #34/#38/#40 remain **read-only source evidence** until after a verified independent winner selection.
