# GSA4 A4 — Four multi-turn execution simulation results

**Date:** 2026-11-04. **Repository:** `thebimhouseinfo-sudo/GPT-supper-agent`.  
**PR:** [#53](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/53), branch `experiment/gsa4-a4-four-scenario-simulation`.  
**Source-executed simulation HEAD:** `da73e8569a6272f8c4773a9a825f835876be0128`.  
**GitHub Actions:** [run #41818293376](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41818293376): **SUCCESS** for Node 202/202, Deno typecheck and navigation benchmark. *Green CI means the replay executed and its known gap was detected; it does not mean all four behavior oracles PASS.*

## What changed from the static A4 character measurement

The previous A4 result compared Harness lengths and source candidates only. This new experiment executes the **existing A2, A3 and A4 TypeScript** repeatedly through changing **synthetic** Job, Task, Run, Host availability and Human-message conditions, comparing identical FULL and SELECTIVE Arms. Each has **4 common scenarios × 3 sequential events = 12 model-free decision steps**, total **24** source-function evaluations, not just four single-step text comparisons.

**Machine evidence:** stdout `GSA4_A4_DYNAMIC_SCENARIO_*` in the CI Node log, and executable runner [gsa4-a4-four-scenario-simulation.cjs](../../../test-lab/gsa4-a4-four-scenario-simulation.cjs) (pass an output file path to save full traces). The code retrieves actual Role/Shared literal text and requires all mandatory boundary phrases and FULL fallback on workflow transitions.

## Results by scenario

| Scenario | Successes in current source-function simulation | Outcome | Finding |
| --- | --- | --- | --- |
| S1 — Coder observed source failure → failed retest → independent Tester handoff | A3 returns READ_MORE, expands causal graph on failed retest; Tester transition receives FULL Harness; same source/test references in both arms | **PASS (within simulator)** | No LLM verified |
| S2 — Human changes accepted scope while Coder has an active Run → Planner owns the revision | A2 detects `PLAN_CHANGE_PENDING` and STOP; A4 falls back to FULL for supersession and Planner | **PASS (within simulator)** | New approval still requires real Human |
| S3 — CI runner unavailable/no executed steps → authorized probe → Tester investigation | A3 returns PROBE, not fabricated source PRODUCT_FAILURE; A4 falls back to FULL on environment workflow and Tester | **PASS (within simulator)** | Host not actually called |
| S4 — Human STOPCHAT mid-Run → asks about a different Project | A4 switches to FULL on STOPCHAT and new Project. New Project mismatch yields STOP, **but STOPCHAT itself still yields READ_MORE in the A2/A3 route** instead of required STOP | **FINDING** | `STOPCHAT_NO_RUNTIME_STOP_SIGNAL` |

**Deterministic boundary oracle: 3/4 complete scenarios PASS; 1/4 has a recorded gap.** Full and A4 Arm source/test candidates are identical in all four. Across this artificial 12-turn sequence A4 preview contains 18,045 fewer Harness characters, but this is **not observed model prompt/token use**.

### Interpretation of S4

The STOPCHAT instruction string is present in both FULL and A4 preview. A2/A3 are *source-context advisor functions*, **not** a Human-message runtime router. Their READ_MORE result on STOPCHAT means the simulation is missing a conversational-stop decision, not proof the actual GSA product or model ignores Human STOPCHAT. It is nevertheless a serious blocker for declaring A4 safe based on **these tests**: the testing harness must observe a model receiving and acting on the original stop instruction, or an independently executed runtime controller must enforce STOP.

**Do not weaken the expected oracle to READ_MORE.** The runner explicitly records the mismatch as a finding while still PASSing its regression assertion that the known gap is detected.

## What is not established

- **No independent LLM sessions:** zero model calls, no full-vs-selective blinded A/B prompts were sent to a provider, no real token receipts or behavioral compliance measurement.
- **No product source repair:** no live Coder edit, Reviewer/Tester role agent independently evaluated code or changed Git SHA, no actual CI runner interruption occurred during a Job.
- **No production authority:** the A4 preview remains unconnected to `get_agent_harness`, and no new MCP tool/permission/Criteria or main deployment was changed.

**Follow-up experiment needed:** With an authorized currently active model endpoint (GitHub Models retired 2026-07-30), run the same four event streams separately under FULL and A4 instructions, record the exact first decision/action, forbidden writes, source/dependency reads, Human STOP/Project isolation and independent Tester evidence. Ensure at least the STOPCHAT case is resolved before proposing A4 runtime activation. Do not call a deterministic trace a model simulation.

## Decision

**Keep A4 a reversible preview only.** The four multi-step simulation found three expected source-function transition sequences and one clear test coverage gap, so neither static byte savings nor a green Node suite is enough to authorize selective model instructions in production. Continue to use the existing full Harness delivery until actual Agent-behavior equivalence is observed.

## Correction — STOPCHAT interpretation and revised S4 oracle (2026-11-04)

**The earlier S4 FINDING `STOPCHAT_NO_RUNTIME_STOP_SIGNAL` is INVALID as a GSA policy verdict.** STOPCHAT is a **chat-length checkpoint and handoff**: at a safe boundary, independently read active Project/Job/Run/cursor and current Git/Memory; reconcile uncertain writes; persist/read back only necessary durable state; call the existing read-only `stopchat_handoff_prepare` and provide a handoff for another chat to resume. The tool cannot save state or verify caller-reported evidence. If there are no pending writes or required durable updates, **do not invent a redundant checkpoint**. New chat rechecks live SHA, authority, Job/cursor and current task before continuing.

A2/A3 returning `READ_MORE` on a STOPCHAT conversational event is expected for source-context helpers; they do not implement the STOPCHAT protocol. The **old test oracle mistakenly expected `STOP`**, as if STOPCHAT meant cancelling the active Job. The corrected simulation uses a separate test-side `PREPARE_SAFE_HANDOFF` protocol action, verifies the actual `stopchat_handoff_prepare` tool declaration and instructions, and simulates a **fresh chat revalidation** (not an unrelated Project). This corrects the prior S4 finding at the test-specification level only. No actual model invoked, Git checkpoint persisted or live handoff executed.

**Historical evidence above is retained for traceability, but is superseded by this section and the new CI result on the correction PR.** Do not describe the earlier 3/4 as an A4 security regression. The original model-level behavioral equivalence still remains UNVERIFIED.
