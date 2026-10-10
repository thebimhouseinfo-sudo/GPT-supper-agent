# GSA Reliability — resumable integration checkpoint

## Source identity
- Canonical integration branch: `upgrade/gsa-reliability`.
- Base main (production): `203d1019ba5cdbffdf6ceebdce048c66dc9a4a1a`.
- Last inspected integration HEAD before this checkpoint note: `33d65ff2c21ce2fce5123fa72d2aea4db12d84c8`.
- Last source/test mutation fix: `d5aa0963a01358a47b8092691c119265b0a29347` (mutation assertion fixed to mutate both conditional occurrences).
- Draft PR: https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/18 .
- `main` unchanged during this work; **never merge any part of this upgrade until all gates pass and Human authorizes final merge**.

## Implemented on integration branch (not released)
- JP-00: source relationship audit and derived-vs-persisted-state decision; no duplicate Tester lease or new Job lifecycle.
- JP-10 candidate: `execution_recovery_evaluate` authenticated **read-only advisory** for exact external Git HEAD/target blob preflight, fail-closed on inconsistent/inconclusive readback.
- JP-11 candidate: `orchestration_progress_evaluate` authenticated **read-only advisory**, bounded 3 same-turn nonprogress cycles and 2 consequential write retries. `PAUSED_NO_PROGRESS` derived only, Run termination routes to Job topology.
- JP-20 candidate: selective Reviewer test-script review on changed/high-risk tests; recovery runtime test including intentionally broken mutants. During internal check the first source mutation test was **false-green** because `replace()` edited a different branch; repaired to `replaceAll()` and manually observed correct-vs-mutant divergence.
- JP-30 candidate: opt-in `debugging` via `RUNTIME_SKILLS`/catalog/`load_skill`; default Coder role skills unchanged.
- Canonical execution and harness docs updated with the candidate contracts.

## Evidence and active blockers
- The actual source functions (with isolated TypeScript parameter annotations removed only for direct JavaScript invocation) passed **7/7 bounded deterministic helper examples** and two deliberately broken source predicates were observed to diverge from correct behavior after the negative-control fix. These are **HELPER_SIMULATION**, not CI, true Git CAS, durable interruption E2E, or staging validation.
- GitHub Actions run `38023019041` and previous PR #18 runs report failure but both jobs have **empty steps and no runner assigned**; tests did not execute. This is **CI_UNAVAILABLE**, not product FAIL and not PASS.
- **NOT VERIFIED:** full `deno check` at current HEAD; Node test suite at current HEAD; production connector discovery of new tools; staging `gsa-mcp-next` exact-source redeploy/readback; real authorized Git two-writer CAS, interruption/restart, and complete Job E2E; full Reviewer/Tester durable Verification.
- Staging `gsa-mcp-next` is version 24 (read before upgrade). Production `gsa-mcp` remains v44. Do not alter them merely to clear the status without the approved staging/test gate.

## Resume protocol for next turn
1. Read **this file**, PR #18 head, actual current `main` and branch comparison; do not assume the SHA above is still HEAD after this note was added.
2. Confirm branch drift/foreign writes and the exact source/test diff before any new edits.
3. Resolve CI runner availability first or execute an equivalent approved independent build/test in a valid environment. Do not claim PASS from source-level mocked helper only.
4. Review test script implementation and actual running tests; fix failures on **the same integration branch**.
5. Establish authorized stage NEXT/TEST_LAB Job, deploy exact source to staging only after staging approval, read back and run real Git/CAS/recovery/Reviewer/Tester E2E.
6. Close JP checkpoints with exact SHA-evidence. Only when **all** release requirements pass may the Human separately authorize integration→main merge; production deployment is also a separate gate.

## Human approval and status
Human authorized **implementation on one integration branch; merge into main only after everything is complete**. No further branch may become a competing source of truth. No production release approval is implied by creating this checkpoint.

## 2026-10-10 — Independent sandbox CI-equivalent execution

**Why:** GitHub Actions workflow runs for PR #18 show runner_id=0 / runner_name empty / zero steps; both deno-typecheck and runtime-helper-check terminated before execution. This is **RUNNER_NOT_ALLOCATED**; GitHub hosted CI has not been repaired and no root cause (billing/policy/quota) is asserted without platform evidence. Reference failed run: [38023019041](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/38023019041).

**Executed in isolated Vercel Sandbox**, no app deployment, GitHub branch source transferred directly from the private repo through authenticated connectors:

- Environment: Node v24.21.0, Deno **2.5.6**, TypeScript **5.9.3**, Linux sandbox.
- `npm install --no-save --ignore-scripts --no-package-lock --prefix /tmp/gsa-next-test typescript@5.9.3` → exit 0.
- `NODE_PATH=/tmp/gsa-next-test/node_modules node --test test-lab/runtime-logic.test.cjs test-lab/reliability-runtime.test.cjs` → **15 tests passed, 0 failed, 0 skipped, exit 0**.
- `npx --yes deno@2.5.6 check supabase/functions/gsa-mcp/index.ts` → **PASS, exit 0**, module dependencies resolved over network (peer-dependency advisory for openai/zod; not a Deno typecheck failure).
- Source `git hash-object supabase/functions/gsa-mcp/index.ts` = **`4182a36a29812725e3a3f4031d893e66fb4b6ebc`** (matches GitHub source blob at tested head).
- Tests `git hash-object test-lab/reliability-runtime.test.cjs` = **`46de759d5b5babe4171b6adec8cca4d4fc448467`**.
- Existing tests `git hash-object test-lab/runtime-logic.test.cjs` = **`a27185a6969879d6a621160a005aaf3ea088ff65`**.
- Workflow `git hash-object .github/workflows/gsa-next-logic.yml` = **`1123dbbdd0e9778235486693eaaf29513440293a`**.

**Scope:** Equivalent exact-file TypeScript + Node gates PASS using independently executed commands; they are **not GitHub-hosted CI PASS** and **not** real Git CAS, crashed chat recovery, connector E2E, authorized TEST_LAB writes, stage exact-source verification, or Reviewer/Tester durable closure. Keep PR #18 DRAFT.

**Next:** Investigate GitHub Actions runner allocation from repository Actions run UI/account-level Actions usage/billing/settings; only mark hosted CI available when real step logs/run success exist. Continue independent Reviewer/Tester and staging isolated NEXT/TEST_LAB gating with separate evidence. Do not merge to main until full planned upgrade is complete and Human approves.
