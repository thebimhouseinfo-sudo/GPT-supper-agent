# GSA4 A4 — Bootstrap, Coding, Update and Refactor: executed workflow simulation

**Date:** 2026-11-04. **Status:** SOURCE_EXECUTED_DYNAMIC_SIMULATION; **not independent LLM/Host behavior parity**.  
**PR:** [#55](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/55).  
**Validated SHA:** `d2be100a1e2cb836645c6bf645acbc6e0340a209`.  
**GitHub Actions:** [Run 41822553837](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41822553837) — 3/3 jobs **SUCCESS**, **207 Node PASS / 0 FAIL / 0 SKIP**, Deno check PASS, fixed GSA3–A3 benchmark PASS.

## Purpose

Test four common GSA workflow sequences rather than static text length, by executing current `projectBootstrapChecklistDecision`, A2 Job/Run context, A3 repair routing and A4 literal Harness preview under sequentially changing synthetic inputs. The FULL and SELECTIVE arms receive the exact same state transitions; all original mandatory policy clauses, source/test candidates, and FULL fallback triggers are compared. All four were independently asserted by the source-executed Node runner, **not by an AI model**.

**Runner:** `test-lab/gsa4-a4-workflow-simulation.test.cjs`, producing machine-readable `GSA4_A4_WORKFLOW_SIMULATION` in CI logs.

## Executed outcomes

| Scenario | Sequence | Observation |
| --- | --- | --- |
| S1 — Bootstrap | Existing Human-approved Criteria → ask Human KEEP/UPDATE once → Planner CRL → Milestones CRL → Coder/Tester next-Task capabilities → BOOTSTRAP_READY | All **five events Full Harness**. `projectBootstrapChecklistDecision` reaches `BOOTSTRAP_READY` with `source_write_authorized=false`. No redundant Project Plan Job or automatic implementation permission |
| S2 — Coding | Normal implementation → Coder observed product defect repair → CI runner unavailable → independent Reviewer | Normal implementation FULL, narrow product-defect repair SELECTIVE, unavailable CI classified PROBE and FULL, Reviewer FULL. No fabricated CI PASS or Source write authorization |
| S3 — new material Update | Existing Coder repair → Human materially changes WHAT/WHY → Planner impact evaluation → pending review of revised Plan | Initial repair SELECTIVE; then FULL, `PLAN_CHANGE_PENDING` STOP. Changed revision pending review cannot continue old source execution |
| S4 — new Refactor idea | Existing repair → new Human refactor idea while stale repair label still supplied → identify out-of-scope change → Planner reviews affected Job | Initial repair SELECTIVE; **Human REFACTOR** forces Full despite stale previous `workflow`. Out-of-scope Task produces `PLAN_CHANGE_PENDING` STOP; do not opportunistically refactor under old approval |

**Aggregate:** 4/4 scenario oracles PASS, **17 sequential events per arm / 34 comparisons**; original source/test reference sets agree in both arms. Only **three** events received A4's short repair preview; the other 14 restored original Full Harness. That gives **10,827 Harness characters saved** across this synthetic fixture, not actual model tokens or wall-clock speed.

## Actual code correction

The experimental `selective-harness-preview.ts` now accepts optional `human_message_kind`. New Human `NEW_FEATURE`, `MATERIAL_UPDATE`, `REFACTOR`, `BOOTSTRAP`, `QUESTION` or `UNKNOWN` prevents selecting the old Coder repair-only abbreviated Harness. Stale Job/Run/Plan SHA or pending-review conditions likewise force Full. In particular, a Human may introduce a Refactor request while the caller still labels the preceding state `PRODUCT_DEFECT_REPAIR`: **the newly classified Human intent wins**.

**Limit:** The new intent field is optional for backward compatibility with other A4 preview tests; when absent the pure function **cannot independently detect an unclassified new Human message**. A safe future caller must supply an actually classified current message, verify current source and Job context, and never treat A4 output as authority. No changes to the existing runtime's `get_agent_harness`, `run_begin`, existing Shared/Role text, Criteria, Tool inventory or permissions.

## Conclusions and limitations

1. A4 should stay FULL during Bootstrap, normal Coding, new ideas and changed scopes; only a verified-shape narrow Coder product-defect **preview** gets a short Harness. A3 dependency paths are unaffected.
2. Plan/Criteria change must follow current Human approval, technical advice where applicable, Planner/Reviewer and Git/Memory readback. A4 does not invent or bypass these gates.
3. Deterministic code execution on synthetic state **does not prove** the model actually follows the shortened instructions during new user messages; no provider LLM calls, live Git edits, Host MCP calls or real independent Reviewer/Tester agents were performed.
4. The conservative A4 candidate remains **not wired into live MCP**. Observe actual model sessions and tool traces before concluding the optimization saves cost or preserves semantic behavior at deployment.

**Decision:** keep reversible A4 preview + 17-step regression; no production activation, `main` merge or deploy.
