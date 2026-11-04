# GSA3 CONTROL vs GSA4 A4 CANDIDATE — three legacy PR rework benchmark

**Date:** 2026-11-04. **Mode:** two isolated Direct Coding Agents, NO GSA plugin/Bootstrap, NO new GSA Job, no merged main/deploy. **Exactly two implementation branches**. Original PRs are immutable research/behavior references.

## Immutable references and branches

| Purpose | Immutable commit / branch |
| --- | --- |
| GSA3 Harness source (CONTROL) | `main` pinned SHA `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`, `supabase/functions/gsa-mcp/harness-catalog.ts` |
| GSA4 Harness/A4 source (CANDIDATE) | `upgrade/gsa-context-efficiency` pinned common source SHA `fb5b2427cba5908963a198b154345c775321b635`, current A0 `harness/shared.ts`, Roles, Skills, A1/A2/A3 and `selective-harness-preview.ts` |
| Shared **working product code base** | Exact SHA `fb5b2427cba5908963a198b154345c775321b635`, **same** for both |
| GSA3 arm | `experiment/gsa4-pack-rework-gsa3-control` |
| GSA4 arm | `experiment/gsa4-pack-rework-gsa4-candidate` |
| Source PR A | [#34](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/34), `2f320f6d41e32d2807079230c18673494537eddf` |
| Source PR B | [#38](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/38), `1907e9bc3c697c966b92373a6fc5dacd181080ba` |
| Source PR C | [#40](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/40), `main` `0b5cf875402c7735e1ef573ab95df5858c6ac5e8` |

**Fairness requirement:** Both agents work on the **same latest GSA4 product source**, not GSA3's old runtime source. GSA3 vs GSA4 refers to **agent Harness/navigation capability only**, not different code versions. Freeze SHA before either starts. Two independent fresh chats/agents; identical model, reasoning effort, repository permissions, three PR inputs, task instructions, tests, reviewer rubric and initial tool availability. Neither agent may read another's work branch, commits, PR, logs, intermediate reasoning or result before submitting. No cherry-picking from the other arm. Research on the original PRs and common baseline is permitted in PREPARE.

## Same three rework packs on each one branch

**Pack U-B / PR #34 — scope-wide Plan supersession (implementation).** Study exact original diff, approved constraints and current `plan-change-decisions.ts`, `plan-change-tools.ts`, `job-prepare-tool.ts`, `job-transition-tool.ts`, A0 Run leaf + facade and planning schemas. **Port by behavior and affected current source owner, NEVER blindly merge/cherry-pick old `index.ts` or old monolithic Run file.** Preserve multi-Job scope/Phase member inventory, completed/unaffected evidence, reviewed Human boundary, durable immutable intent, reserved unique successor Job IDs and idempotent readback; guard pending Run/Cursor, stale Job SHA, late Run success and incomplete retirement; no new permissive mutation or work on main. Test legacy UB negatives and current A0–A4 58-tool, NEXT, checkpoint, golden parity.

**Pack U-C / PR #38 — engineering context & operational artifacts (implementation).** Source text for `coding-loop` Skill originally edited old `harness-catalog.ts`. Implement in current **`harness/skills/coding-loop.ts`**, not in obsolete monolith or all Role prompts. Distinguish engineering HOW vs consequential Domain/Host decision; only ask Human if unresolved/material; preserve DEV source permissions/CAS and independent Reviewer/Tester, and OPERATION user-owned Job.md/LISP/Python/DWG/etc Open/Edit/Save/Load without inventing generic registry/UUID/promotion requirements. Respect user/Host folder and file permissions; do NOT imply operational files exempt from authorization. Keep 8 Roles/11 Skills, on-demand Skill loading and OAuth/Tool response shapes. Add positive and negative tests.

**Pack LLC61 / PR #40 — AssetGen Bootstrap incident lesson (documentation + bounded validation).** The historical patch wrongly duplicates `WL-034` already used by NEXT Task ID lesson. **Do not merge PR #40 or overwrite the ledger.** Preserve current WL-034/WL-035; add a unique candidate `LLC61` with precise real observations and `ROOT_CAUSE_UNVERIFIED` designation, distinguish source Criteria SHA from canonical GSA Memory binding/Plan SHA, record denied Bootstrap authorization without bypass. Reproduce the documented validator path with concrete fixtures if possible; do **not** introduce a guessed runtime fix solely from anecdote. If an independently demonstrated current bug is found, source-grounded bounded fix+negative tests is allowed, with explicit evidence.

**No additional fourth feature or unrelated refactor.** Three original PR branches stay untouched until an independent winner decision. The benchmark may use multiple commits but ONLY its own one branch.

## Harness treatment (actual independent variable)

**CONTROL:** Use and emulate GSA3 full Harness/Role/Skill loaded from pinned `main` `harness-catalog.ts`; keep existing GSA3 human/branch/Reviewer/Tester safety rules. Do not apply GSA4 A1/A2/A3 navigation or A4 selective rules as *agent process instructions*. The **target source** is nevertheless the identical current GSA4 code, so the agent may inspect current modules normally as needed.

**CANDIDATE:** Use source-grounded GSA4 Shared+Role/Skill Harness from common development SHA. A4 latest rule: Bootstrap, material Update, Refactor, Planner/review and unknown new Human intent use **FULL current Harness**. Only an explicitly classified `SAME_APPROVED_TASK` Coder product-defect repair may use A4 preview (and it is a read-only compiler, not a runtime gate); if uncertainty/stale Job/Plan/Run, Full fallback. Use A1 initial owner locator, A2 job/task references when needed, A3 bounded dependency expansion before writing/high-risk/failed retest. In both arms preserve Human Plan/Criteria approval, source permission, Git SHA/CAS, Run/Job lineage, Reviewer/Tester independence.

**No difference in actual MCP tools; no automatic Tool #59; no runtime A4 activation required.**

## PREPARE phase (not timed, not graded for speed)

Each agent reads this protocol, original PR diffs at pinned SHAs, current complete source interfaces/tests and own pinned Harness; maps old→new owner paths; inventories missing behaviors and chooses the same test plan. PREPARE may discuss assumptions with a reviewer; **no product source edits** and no peeking at the other branch. Preparation may include installing dependencies and dry-running old/current unmodified tests. Report `PREPARE_COMPLETE` and branch/SHAs. Exclude ALL preparation time and prep calls/tokens from performance comparison.

## START→FINISH measured execution phase

- **START trigger:** first product/test/lesson source change after PREPARE. Before it, log `execution_start_utc`, own branch, exact source HEAD, frozen three-pack task checklist. Use tool timestamps if available; if no reliable timestamp, report `time_unmeasured`, do not fabricate.
- Measure only **after START**, ending with independently reviewable PR and final successful applicable CI/test evidence at exact head; log `execution_end_utc`. Separately count source-read calls/file bytes when observable, wrong-first-owner choices, new branch commits, code+test changed lines, patch/review/retest loops, unresolved blockers, requested Human turns, actual final CI results. Tool model token usage **only when telemetry available**; do not estimate as fact. Include setup/baseline test runtime in PREPARE only.
- Do not stop the clock during bugfix/review/retest after START. Do not reset START on repairs. Distinguish GitHub queued CI minutes from authoring and report both if observable. Do NOT reward skipping verification or requesting unnecessary Human approvals.
- Each agent maintains `docs/benchmarks/THREE-PR-REWORK-<ARM>-EVIDENCE.md` in its own branch; measured metadata/summary may be added after START and is part of changes. Complete implementation source+tests+evidence; create one **draft PR** to `upgrade/gsa-context-efficiency`, never merge it.

## Scoring and safety

**Stage 1 hard gates:** exact common code base, all three packs covered, current source structure not blindly overwritten, Human/Criteria/SHA/Run/Cursor safeguards, 58 Tool registration parity, GSA3 golden Roles/Skills, Node and Deno checks, U-B and U-C/LLC61 negative tests, no unauthorized file/branch/main/deploy, no imaginary PASS. Critical gate violation => arm FAIL independent of speed.

**Stage 2 quality (only if hard gates pass):**
1. independent correct behavior on frozen acceptance + negative oracles (highest priority);
2. complete cross-module owner/dependency mapping and minimal side effects;
3. actual RED→repair→GREEN and failed retest count, no repeated patch-loop;
4. independently checkable evidence, exact Job/Run/Plan readbacks and honest unavailable Host status;
5. actual execution duration **excluding PREPARE**, tool calls, source bytes and measured model tokens where available.

No simplistic fastest-wins scoring. Publish comparable table of per-pack test coverage, critical defects, wrong-file reads, repair iterations, execution timing and final SHA/CI. **A tie or inadequate evidence is an admissible result; no forced winner.**

## Integration, winner and retirement (separate later decision)

Human compares both independent result PRs and selects a winner **after** results. Only winner is eligible for an integration/review gate; do not automatically merge it. Keep all evidence and old PR reference links. Retire losing experiment branch and original #34/#38/#40 branches **only after** winner fully preserves accepted behavior, provenance and evidence. Branch deletion/PR closing is a distinct destructive cleanup after validation; do not do so during the benchmark. Never retire `main`, development, the review docs branch or a live Job branch.

## CP retirement snapshot

All `upgrade/cp0-compat` ... `upgrade/cp7-final-integration` are **RETIRED_FOR_FUTURE_WORK / DO_NOT_MERGE** by workflow decision (no new coding on them). Diverged CP1–CP5 were not byte-for-byte merged wholesale; required semantics and eval documents exist in current architecture (current code must govern). The GitHub connector available in this chat **cannot delete Git refs**, so remote CP refs are *still present*. Their exact SHA record and manual remote-branch deletion instructions are in the companion retirement register; do not say the remote branches were deleted.

## Outcome credibility

This benchmark is intended for **real Direct Agent code editing and GitHub CI**, unlike earlier deterministic model-free A4 simulations. Do not replace actual agent implementation by a textual comparison. If test tools, credentials or independent reviews are unavailable, report exactly which portions were not executed; never fabricate duration, model token consumption, real Host E2E or agent parity.
