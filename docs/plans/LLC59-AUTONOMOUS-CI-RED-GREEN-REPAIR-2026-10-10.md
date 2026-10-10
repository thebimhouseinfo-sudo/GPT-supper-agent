# LLC59 — Autonomous CI diagnosis, repair and bounded red/green loop

**Status:** EXECUTION PLAN — implementation in one integration branch only (`fix/llc59-autonomous-ci-20261010`).  
**Owner:** GSA Orchestrator → Coder → Tester → Reviewer, no new agent/job lifecycle.  
**Target:** `thebimhouseinfo-sudo/GPT-supper-agent`.  
**Lesson:** `docs/process/lessons/LLC-059-AUTONOMY-REGRESSION-CI-REPAIR-2026-10-10.md`, issue #20.

## CP0 — Evidence and baseline, DONE for design

- Historical [run #38030799863](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/38030799863) had actual GitHub runner steps, 15/15 Node test PASS, and hosted Deno typecheck PASS; job log retrieval works through the existing GitHub connector on that run.
- [Run #38054066762](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/38054066762) reported two failures **before runner allocation** (`runner_id=0`, `steps=[]`). Fetching logs returned GitHub BlobNotFound/404. Do not label this a source test RED.
- Current `get_agent_harness(orchestrator|coder|tester)` and `load_skill(coding-loop|testing-evidence|delegation|debugging)` are reachable. GSA already has self-repair routing but lacks an explicit **CI failure evidence acquisition → alternative capability discovery → autonomous decision** contract. Tester practical execution gate and Human Retest fallback can be read as stopping at SURFACE_PRESENT rather than first safely probing an available capability.
- Underlying exact introducing commit is unconfirmed. No speculative source rewrite or new CI service.

## CP1 — Restore CI self-evidence acquisition (source/harness)

**Trigger:** source/CI status RED or no conclusive test result, while an authorized coding/repair Job is active.

**Preferred same-turn sequence:**

1. Read exact source branch/commit/PR and CI run/check conclusions through connected GitHub tools; do **not** ask Human to look at a dashboard first.
2. Read failed jobs/steps and attempt available job log retrieval; no `runner_id` or `steps=[]` means classify **RUNNER_NOT_STARTED / ENVIRONMENT_FAILURE**, not failing code.
3. Where CI executed and a failing command/error is observed, identify `PRODUCT_FAILURE`, `TEST_FAILURE`, `CI_CONFIG_FAILURE` (mapped to TEST_FAILURE when the test runner/config itself is wrong), `ENVIRONMENT_FAILURE`, `NOT_READY` or `INTEGRATION_NOT_READY` from evidence.
4. Provide the owning Coder with exact errors and sha, repair only within authorized Project/Job source scope. Rerun or inspect CI and continue red→green within the running turn without new Human log-copy steps.
5. If hosted runner/logs unavailable, first discover a legal observed or **safely probed** alternative (e.g. container/sandbox for a bounded repo test) and run exact-source tests. Tag results `ALTERNATIVE_ENVIRONMENT_VERIFIED`; hosted CI remains `UNVERIFIED`, never PASS.
6. Human Gate only on actual approval, missing secret/physical host that agent cannot access, out-of-scope write, genuinely unsafe/ambiguous action, or bounded retries exhausted. Ask for the minimum action, including why self-service alternatives failed.

**No changing permissions**: GitHub/host scope authorization, source cursor, exact SHA CAS, Reviewer and Tester independent authority remain unchanged.

## CP2 — Coder / Tester self-repair and evidence ownership

- Coder independently obtains CI diagnostics before asking for logs; validates/test scripts and source diffs before repair, reruns a source-bound check and self-review in bounded loop. A nontrivial repeated failure escalates to full debugging/root-cause scan rather than symptom patching.
- Tester remains **source-read-only**, but may execute non-destructive capability probes (DISCOVERED → REACHABLE → INVOCABLE → FUNCTIONAL) without already claiming OBSERVED. **Only evidence-backed OBSERVED** can justify behavior PASS. Missing capability alone does not immediately require Human Retest.
- Orchestrator owns the same-turn continuation from Tester/CI evidence → Coder repair → Goal Recheck → Retest → Reviewer; should not terminate on `required capability unavailable` until authorized alternative discovery fails.
- Human Retest is a last-mile fallback for a genuine inaccessible environment, not a default after GREEN/RED infrastructure confusion.
- No unconditional repeated full test-script Reviewer for unchanged trusted tests, no polling/background work.

## CP3 — Regression guards and acceptance cases

- **Positive historical runner** (#38030799863): proves actual Github workflow checks and log access, does not by itself prove GSA autonomous red-green repair.
- **Runner not started** (#38054066762): `runner_id=0`, `steps=[]`, logs 404 → agent should classify infrastructure and attempt an executable internal alternative (if available) with zero unnecessary Human asks.
- **Executed failing test**: GitHub logs available, failing command found → owning Coder repairs, reruns, reviews actual outcome. Test repair itself requires known-bad negative control when high risk.
- **Broken test scripts**: changed oracle detects a known fault; Tester sends TEST_FAILURE to Coder for test-fix, not Human.
- **True Human-only dependency**: secret/device/release approval → specific minimum request and STOP, no credential guesses.
- **No-progress / repeated failure**: bounded retries + fingerprint stop with exact evidence, not infinite loop.
- **No Runner but equivalently tested**: label hosted status ENVIRONMENT_FAILURE or UNVERIFIED; `ALTERNATIVE_ENVIRONMENT_VERIFIED` limited to executed source-bound tests.

**Test layers:** execute source-derived harness/skill contract tests, negative examples, exact-file TypeScript check, real historical GitHub run/job/log reads, independent Coder/Reviewer assessment of affected diff and tests. Host E2E in actual Project is final field acceptance; helper tests alone cannot close issue.

## CP4 — Release & field activation

Use **one branch**, no concurrent main edits. Build/check/refetch exact head; review source and tests; open PR. Do not claim hosted CI GREEN when jobs never started. After approval/merge and deploying new GSA MCP (if required), verify the served `get_agent_harness` and skill bodies have the new rules, then exercise at least one real scoped Project coding Job with a failing test and another runner-unavailable scenario. Only then mark issue RESOLVED.

**Success measure:** autonomous diagnostic reads and bounded repairs complete in the active turn; unnecessary requests for Human to paste CI logs = 0 for agent-readable logs; automatic tool discovery of available test surfaces; no source scope/security regression; no material normal-path latency increase (checks are failure-triggered).

## Implementation checkpoint — 2026-10-10

**CP0 evidence:** Historical hosted CI run #38030799863 had a real runner, 15/15 tests passing and retrievable logs. Latest PR #21 run #38057960914 again reported CI failures **without runners** (`runner_id=0`, `steps=[]` for both jobs); classified as ENVIRONMENT_FAILURE/hosted CI UNVERIFIED, not source RED, no Human log request.

**CP1/CP2 source changes:** `supabase/functions/gsa-mcp/index.ts` now supplies autonomous-first CI diagnostics, Coder-owned TEST_FAILURE repair and safe Tester capability probing in served base/role harnesses, skills and GSA entry instructions. Canonical AGENT-HARNESSES, EXECUTION-AND-REVIEW, CAPABILITY-CATALOG and Job runtime skill have corresponding contract updates.

**CP3 exact-source verification:** In Vercel Sandbox running Node 22, the workflow's six Node test files returned **56 PASS / 0 FAIL / 0 SKIPPED**, including LLC59 source-derived harness/skill positive and negative-mutation controls and updated LLC58 pre-fence fixture tests. `npx deno@2.5.6 check supabase/functions/gsa-mcp/index.ts` returned exit 0. Runtime source blob SHA: `3c2b807b717d9c993179c1af5dc5179b4220599c`. Hosted GitHub run #38057960914 remained runner-unallocated; alternate executor result is not hosted CI green.

**Self-diff audit:** Exactly 9 paths changed under this one branch (runtime harness/skill, documentation, workflow test list, source-derived LLC59 test, inherited LLC58 test fixtures). No new lifecycle or automatic remote mutation capability, no read-only Tester source write, no reduction in explicit Human merge/release authority. These checks are implementation/self-review, not independent Reviewer or real Project behavioral acceptance.

**CP4 remains:** independent Reviewer gate, Human merge decision, deployed MCP exact-source readback, and at least one real scoped Project Job showing automatically acquired CI evidence and Coder red→green repair. **LLC59 stays open**, no claim that prompts alone prove user-visible autonomy.
