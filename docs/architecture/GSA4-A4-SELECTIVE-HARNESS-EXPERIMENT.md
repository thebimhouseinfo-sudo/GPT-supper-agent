# GSA4 A4 — Conservative selective Harness experiment combined with A3

**Date:** 2026-11-04. **Status:** EXPERIMENTAL, NOT LIVE MCP.  
**Base:** `977d11f3e702b9054171c82224ead5d9746f6408` on `upgrade/gsa-context-efficiency`.  
**Inputs:** actual A0 `harness/shared.ts` (49 Shared bullet policies), eight role leaf files, A2 `buildTaskContextRecipe`, A3 `buildRepairContextRoute`, A1 existing owner index.  
**Implementation:** `supabase/functions/gsa-mcp/selective-harness-preview.ts` — exports `previewSelectiveHarness`, **not registered** as MCP, and **not called by** `get_agent_harness`, `renderHarness`, `run_begin` or production code.

## Research question and previous observations

User hypothesis: combining A4 instruction selection with A3 broader dependency checking could reduce total Agent context while retaining complete repair coverage; A1's savings may be relatively small once real Task, Skill and source/Host context are included.

**The verified preceding A0–A3 experiment** ([results](../plans/gsa-context-efficiency/GSA4-A0-A3-NAVIGATION-BENCHMARK-RESULT-20261104.md); [GitHub CI](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41814143457)) **must remain intact**:

| Strategy | Actual full-source chars | Fixed diagnostic cases complete |
| --- | ---: | ---: |
| GSA3 | 724,843 | 2/4 |
| A0 | 207,943 | 0/4 |
| A1 | 126,213 | 2/4 |
| A1+A2 | 126,213 | 2/4 |
| A1+A2+A3 | 261,710 | **4/4** |

This is not a controlled real-Coder defect-fix benchmark. A1's **39.3% source-text reduction relative to A0** (under this fixed whole-file reading model) is genuine in that benchmark. Whether it reduces **total** delivered Agent context, network latency, edit/retest iterations or overall cost is unmeasured. A3's improved four-case coverage was obtained by reading **more** source than A1, not by assuming missing code safe.

## A4 design: reuse real policy text, no policy rewriting

Current `BASE_AGENT_HARNESS` is one original source-controlled string. The preview simply selects original complete bullet lines, keeping line order and text **byte-identical**. Existing `ROLE_HARNESSES[role]` authority/loop/outputs are untouched.

For the **narrow, explicitly labeled** PRODUCT_DEFECT_REPAIR workflow of a current Coder with coherent A2 Task and A3 source candidates, the candidate omits only four detailed **Planner/Bootstrap procedures**, not authority or the fact that plans/approvals/reviews are mandatory:

- `PLAN GOAL ANCHORS` — detailed Markdown placement for new/revised plans.
- `PLANNER RL SHORTCUT` — exact Planner shortcut orchestration.
- `BOOTSTRAP CHECKLIST COORDINATOR` — detailed four-item Bootstrap loop.
- `LLC60 PLANNING CONTINUATION` — detailed Planner/Orchestrator persistence sequence.

All other original Shared clauses **remain**, including HUMAN EXECUTION APPROVAL; BRANCH AUTHORITY; TECH ADVISOR CHECKPOINTS; CRITERIA CHANGE ORDER; PROJECT ADDINS; STOPCHAT; REVIEW LOOP; current Project scope; denied-action boundary; Job/Run limits; Cursor/CAS and unknown-write recovery; LLC58 Plan Change; LLC59 source/CI classification; NEXT dispatch and closure; human-only permissions; Reviewer/Tester independence and source/readback obligations.

**The full original Harness is returned** on unknown Role, Planner/Reviewer/Tester/Advisor/etc, unknown/nonrepair workflow, missing or mismatched A2/A3 source context, blocked Task or malformed/outdated policy line inventory. This full fallback is essential: independent entrypoints and new Human messages cannot assume the original task context remains current. No source or model-visible runtime behavior changes in this PR.

**Limitations:** A2/A3 and commit SHAs are caller-provided; a pure preview cannot independently prove Git freshness, Human Plan approval or Host authority. Its result has `advisory_only=true` and `execution_authorized=false`. Do **not** wire this preview into the live `get_agent_harness` response until independent Role isolation/authority and event-level Human-message routing proof exists.

## Benchmark and acceptance conditions

`test-lab/gsa4-a4-selective-harness.test.cjs` source-executes **actual A2 and A3 functions and actual existing Harness**, covering the SAME four error/tool classes as the preceding A0–A3 benchmark:

1. Assert all 49 original policy bullet lines exist and exactly four explicit planner/Bootstrap detail clauses are candidates.
2. For each of four Coder repair cases, preserve all nonexcluded bullets **verbatim**, all Role authority/loop/outputs, and the mandatory-rule marker inventory. Report full vs selective Harness text and source candidates returned by A3.
3. For the other seven Roles, unknown Role, unknown workflow, mismatched Git ref, blocked Task, old/stale A3 graph, return the full original text and never mark authorization.
4. Mutate fake test-only policy source by adding an unaudited clause or removing HUMAN EXECUTION APPROVAL; the optimized preview **must fail closed**, not silently drop content.
5. Keep all existing GSA3/A0 8 Role and 11 Skill golden parity tests; Deno-check the actual new TypeScript module.

The A4 metric is **model-facing Harness string characters** (measured at source return from the pure preview) and its additive scenario **A3 source file characters**. Neither equals measured ChatGPT token consumption. Do not add duplicated text fallback/structuredContent as two independently delivered model payloads, or double-count A3 source bytes if files are opened once. A4 must not claim the previous paper forecast of 24.8% is achieved until benchmark results quantify actual clauses selected.

## Decision rule

Select A4 for future **design evaluation** only if negative safety and full fallback assertions PASS and the amount saved is material after also including A3 source and other Task/Skill/Knowledge/tool result context. Keep A3 dependency completeness independent of Harness pruning. If A4 merely saves a few percent overall, **KEEP original runtime Harness** rather than introduce a new stateful selection surface for insignificant benefit.

Real Host/Agent behavioral parity, source-blind bug-fix rounds, actual model prompt receipts, permission/source-readback enforcement and latency remain UNVERIFIED until separate experimental sessions exist. This PR is experimental evidence, not production deployment or main merge approval.
