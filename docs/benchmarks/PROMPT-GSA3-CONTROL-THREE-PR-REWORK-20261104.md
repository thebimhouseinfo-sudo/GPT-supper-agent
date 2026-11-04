# PROMPT — GSA3 CONTROL | Direct Coding Agent

**MODE:** `DIRECT_AGENT — IMPLEMENTATION & EXPERIMENT`. **Do NOT call GSA plugin, GSA Bootstrap, create GSA Job, or use GSA4 navigation/selection as Agent instructions.** You are the **GSA3 CONTROL** arm. Complete the implementation and source-bound tests in this turn/work session; do not merge `main`/development or deploy.

## Repository and frozen refs

- Repository: `thebimhouseinfo-sudo/GPT-supper-agent`.
- Work exclusively on `experiment/gsa4-pack-rework-gsa3-control`, created from exact **common GSA4 product source base** `fb5b2427cba5908963a198b154345c775321b635`. Check the branch head before writing.
- **Harness GSA3 pinned:** `main` at `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`. Fetch `supabase/functions/gsa-mcp/harness-catalog.ts` at that SHA and load the real **GSA3 Full Shared + Roles + Skills** for Agent behavior. Do not copy source from GSA3 onto the target GSA4 product branch. Preserve GSA3 policy rules for Human approval, scope, Git, Tester and Reviewer.
- **Read-only source PRs:** #34 at `2f320f6d41e32d2807079230c18673494537eddf`, #38 at `1907e9bc3c697c966b92373a6fc5dacd181080ba`, #40 from `main` `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`.
- **Common frozen protocol:** `docs/benchmarks/GSA3-GSA4-THREE-PR-BENCH-PROTOCOL-20261104.md` on `review/gsa4-a4-unmerged-update-packs`. Read its full acceptance/negative tests; it overrides guesses but grants no new permissions.

## SAME TASK for both arms — rework three legacy packs for current GSA4 physical source

**A. PR #34 / U-B:** Port the *behavior* of **scope-wide Plan supersession** into correct current Job/Plan/Run/Checkpoint modules, not the old monolithic file layout. Cover Phase/Plan multi-Job inventory, reviewed Human boundary, KEEP/REVALIDATE/RETIRE/REPLACE, completed work preservation, pending cursor/Run fence, stale SHA, idempotent successor reservations, zero terminal zombie Tasks/Milestones and no inherited unreviewed PASS. Add exact positive/negative source tests. This is not license to change Project Criteria or approve the Plan yourself.

**B. PR #38 / U-C:** Port accepted on-demand coding-loop engineering/operational artifact guidance from the old `harness-catalog.ts` edit to current `harness/skills/coding-loop.ts`; keep 8 Roles, 11 Skills, auth and existing Skill response shape. Engineering HOW belongs to Coder; consequential unresolved domain/Host choice requires narrowly scoped Human clarification. Distinguish DEV Project source Git/CAS/approval from user-owned operational JOB.md/LISP/Python/DWG/etc while respecting actual Host/folder permissions. No invented UUID/Registry gates or permission bypass. Add tests.

**C. PR #40 / Bootstrap lesson:** Do not merge old `main` or duplicate `WL-034`. Add unique **LLC61** candidate incident for AssetGen `PLAN_CRITERIA_MISMATCH` / `BOOTSTRAP_REQUIRED`, keeping `ROOT_CAUSE_UNVERIFIED` until backed by current code/fixture evidence. Preserve current WL-034/035 and existing four-item brownfield Bootstrap. Only implement a bounded Bootstrap runtime fix if a current source-derived failure is reproduced; otherwise keep as candidate lesson + diagnostic test.

All three packs must be addressed on **this one branch**, not three branches. No unrelated refactor or GSA4 Harness/nav process adoption.

## PREPARE — NOT MEASURED

Before first source edit: read original PR patches, current code/tests, pinned GSA3 Harness, common protocol. Map the three work packs and expected oracles, inspect current SHA/permissions/test commands and set baseline. Output `PREPARE_COMPLETE` with exact source/harness SHAs and a concrete plan. **No experiment timing/cost includes this preparation**, baseline reads, setup, planning or dependency installation. Never inspect competitor's work branch or result.

## EXECUTE — MEASURED from first edit

Log `execution_start_utc` **before the first product/test/lesson edit**, using an actual timestamp if accessible; log `execution_end_utc` only after reviewable final changes and exact-head tests. No timer reset across fixes. Record total source/tool calls, observed bytes/model tokens (only if tool exposes them), first wrong-file choices, edit→test→repair rounds, final failures, CI run IDs, touched files and outstanding Host limits. Ignore PREPARE duration. If clocks/telemetry unavailable, state UNMEASURED — do not invent.

Run all applicable U-B/U-C/LLC61 positive & negative tests, GSA3 golden/58 MCP registry parity, Node/Deno integration, current GSA4 A0–A4 regressions. Treat CI PASS on old PR SHA as historical only. No bypass of denied mutation, false PASS, or silent source artifact ownership change. Fix actual failures before closing.

Write `docs/benchmarks/THREE-PR-REWORK-GSA3-CONTROL-EVIDENCE.md` in your **own** branch including factual metrics, source SHA, known limitations and per-pack acceptance. Open exactly one **DRAFT PR** from this branch to `upgrade/gsa-context-efficiency`, **do not merge**. Finish with exact PR URL, head commit, test/CI evidence, hard gates, unresolved items and measurement limits.

## Isolation and winner selection

Your competitor uses the **same** product base, tool access, and work scope but independently applies GSA4/A4 instructions; you are not permitted to inspect it. An independent evaluator compares the two completed arms after both finish. Faster alone never wins over behavior/negative cases and safety. Do not retire old source PR branches or either experiment branch.
