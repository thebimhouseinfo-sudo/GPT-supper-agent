# 59. LLC — Unnecessary Human delegation during internal test and CI repair loops

**lesson_id:** `LLC-GSA-AUTONOMY-CI-REPAIR-HUMAN-DELEGATION-20261010`  
**date:** 2026-10-10  
**project:** GPT Super Agent (agent workflow); reported during real coding/test work  
**trigger:** `UNNECESSARY_HUMAN_HANDOFF / AUTONOMOUS_TEST_REPAIR_REGRESSION`  
**classification:** `WORKFLOW_GAP`  
**subclassification:** `AGENT_AUTONOMY / CI_LOG_DIAGNOSTICS / TEST_REPAIR_ROUTING / CAPABILITY_FALLBACK`  
**disposition:** `CANDIDATE — UNRESOLVED`  
**tracking:** [Issue #20](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/issues/20)

## 59.1 Human report — preserve original distinction

Human reports that GSA has become **less autonomous**: fewer tasks are automated, and it increasingly asks the user to inspect CI outcomes and paste failure logs before GSA will repair code/tests. In earlier internal test loops GSA could itself inspect red/green CI and continue correction. Human-facing manual steps are now increasing turnaround time.

This is a report of **behavioral regression**; the exact introducing commit, prompt/skill/tool path and quantitative before/after comparison have not been established. Do not attribute this behavior to LLC58 merely because it was recently merged.

## 59.2 Directly inspected evidence

- GSA GitHub Actions run [38054066762](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/38054066762) reported both `runtime-helper-check` and `deno-typecheck` as failed; REST job details show **`runner_id=0` and `steps=[]`**. This is not an executed failing test with a normal failure log.
- Using the connected GitHub tool to fetch each job's logs returned `BlobNotFound (404)`. Therefore asking Human to paste a missing runner log would be unnecessary and ineffective.
- During the LLC58 implementation, the agent itself executed Node test suites and Deno typecheck in a Vercel Sandbox. This demonstrates that a separately observed in-scope test surface can sometimes provide useful equivalent validation while hosted GitHub CI is unavailable. The sandbox results are **not** hosted-CI PASS and not proof of all host-specific practical tests.
- Existing GSA contracts distinguish `PRODUCT_FAILURE`, `TEST_FAILURE`, `ENVIRONMENT_FAILURE`, `NOT_READY` and `INTEGRATION_NOT_READY`. Tester Human Retest is intended only as a capability-backed fallback, not an automatic response to every CI error. See `docs/architecture/AGENT-HARNESSES.md`, `docs/architecture/EXECUTION-AND-REVIEW.md`, `docs/architecture/CAPABILITY-CATALOG.md`, `skills/gsa-job-runtime/SKILL.md`.
- Current root cause of over-delegation remains **unverified**; policy/implementation drift or tool discovery failure are hypotheses, not confirmed causes.

## 59.3 Corrective contract candidate: Autonomous-first, bounded red/green loop

After source changes or CI RED, GSA should, without asking Human to act as log courier:

1. **Self-collect evidence:** read current exact source branch/commit, workflow run, jobs, steps, check metadata and available logs through authorized connectors. Distinguish a failed test from no runner, missing logs, unreachable service, or skipped checks.
2. **Diagnose and act within scope:** classify `PRODUCT_FAILURE / TEST_FAILURE / ENVIRONMENT_FAILURE / NOT_READY / INTEGRATION_NOT_READY`; route a real source/test/config failure to the owning Coder, repair and rerun the relevant eligible tests. Tester stays source-read-only; Reviewer stays independent.
3. **Choose authorized alternatives:** when hosted CI is blocked, use an already accessible, observed internal execution surface and report exactly what it proves. Prefer autonomous testing over a Human handoff when no Human-only step is needed; never silently upgrade `UNVERIFIED` to `PASS`.
4. **Escalate only real Human dependencies:** material approval, credentials that only Human can provide, local host/device interaction with no agent capability, or exhausted/unsafe automation. Ask for the *minimum necessary* Human action and explain the precise blocker.
5. **Bound retry and overhead:** no endless red-green loops, no blind rerun after lost response, no deep test-script re-review at every small change, no duplicate commits. Preserve test validity, negative controls, exact source revision and real-project acceptance.
6. **Keep connected tool discovery active:** do not claim GitHub workflow/log access or sandbox tests are impossible before checking relevant available tools. If tools are actually denied/unavailable, record the exact error rather than assuming Human must inspect manually.

**Human Retest is a last-mile capability fallback, not a replacement for agent-operable CI diagnosis.** This candidate requires a reviewed correction before promotion into executable workflow rules.

## 59.4 Real-Project validation scenarios (not yet performed)

- Hosted CI RED with a real failing command and readable logs → agent fetches logs, diagnoses, fixes and rechecks without Human log-copy step.
- Hosted CI failure **before runner allocation** (`runner_id=0`, `steps=[]`, log 404) → recognize `ENVIRONMENT_FAILURE`/runner blockage, choose an authorized alternative (if available), preserve hosted CI as UNVERIFIED; zero spurious Human handoffs.
- False-green test fixture → negative control turns RED and Reviewer validates changed scripts at a meaningful checkpoint.
- Missing secret/local machine/explicit approval → agent asks for only the necessary Human task, never fabricates access.
- Persistent error/no progress → bounded stop with evidence and next legal action, not endless tool churn.
- Before/after real GSA Job metrics: number of unnecessary Human requests, automatically retrieved CI diagnostics, autonomous correction ratio, retry count, exact revision test outcomes and time-to-resolution; unit-helper CI alone is not closure evidence.

## 59.5 Ownership, impact and disposition

Likely review owners: **Orchestrator routing + Coder coding/debugging loop + Tester capability arbitration**, plus CI/log tool discovery. Reviewer assesses test quality at checkpoints without performing repetitive full test reviews. First reproduce on real Project task and audit whether behavior comes from prompt/harness policy, capability classification, tool availability or runtime gates; fix the minimum surface established by that evidence.

**Disallow:** weakening Human authorization/Project boundaries, bypassing denied writes, treating sandbox checks as CI success, asking for impossible logs, granting Tester source mutation, or interpreting this lesson as authorization for code changes. Original report and observed CI facts are preserved here; issue remains open until reviewed correction and real-job proof.
