# GSA4 — A4 selective Harness × A3 dependency context: executed experimental results

**Date:** 2026-11-04. **Status:** SOURCE_EXECUTED A4 EXPERIMENT; **NOT live model/prompt/Host/repair quality evidence**.  
**Repository:** `thebimhouseinfo-sudo/GPT-supper-agent`; PR [#52](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/52), experimental branch `experiment/gsa4-a4-selective-harness`; initial development base `977d11f3e702b9054171c82224ead5d9746f6408`.  
**Validated code SHA:** `e387824aa060f121fad3dd7fed82cf91be007859`. **GitHub Actions:** [Run #41816763280](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41816763280), 3/3 jobs SUCCESS: Node regression **201 PASS / 0 FAIL / 0 SKIP**; Deno typecheck PASS; pinned A0→A3 navigation benchmark PASS. This document was added after that exact code/test SHA and needs PR-head check before merge.

## 1. Source-derived implementation

Read actual `harness/shared.ts` (49 Shared bullet clauses), eight Role leaves, `harness-catalog.ts`, and actual existing `get_agent_harness` / `load_skill` registration contract. Current GSA delivers full Shared text with the selected Role and already excludes redundant skill names through GSA2's `includeProgressiveSkills:false`. A0 split did **not** reduce actual runtime model-delivered Harness text.

Implemented **a new pure, non-wired A4 experimental compiler** at `supabase/functions/gsa-mcp/selective-harness-preview.ts`. It consumes source-executed A2 Task and A3 failure/source candidate packets and reuses original Shared/Role literal strings. Only the narrow Coder `PRODUCT_DEFECT_REPAIR` preview, with intact Task/source references, suppresses these four original detailed Planner/Bootstrap clauses:

1. `PLAN GOAL ANCHORS`
2. `PLANNER RL SHORTCUT`
3. `BOOTSTRAP CHECKLIST COORDINATOR`
4. `LLC60 PLANNING CONTINUATION`

**All 45 other Shared bullet clauses and the entire Coder Role authority/loop/output text remain byte-for-byte**, including Human approval, denied-action boundaries, Criteria/Plan change, Branch/Scope, Git SHA/CAS, Cursor/recovery, Reviewer/Tester independence, CI failure and Host evidence honesty. Unknown Role, different Role/workflow, blocked/stale Task, missing sources, source SHA mismatch, unexpected policy line inventory, or removed mandatory rule → **full original Harness**.

A4 does **not** replace `get_agent_harness`, change existing `renderHarness`, change Tool registry count, or write any GSA Job/Run/Project data. Every A4 preview is `advisory_only=true`, `execution_authorized=false`; passing synthetic input cannot prove Human approval. Real Host instructions remain untouched.

## 2. Directly measured Node source outputs (four matched A3 cases)

The four scenarios are Run stale Job SHA, Cursor unknown pending mutation, Checkpoint claim rejection and Evidence finalize's nested root callback. The same A2/A3 function bodies and original catalog are source-executed; no new product defect is injected, and no real Coder writes a fix. A3's **source candidates**, not a manually minimized fake set, are used in additive text accounting.

| Metric | Existing full Harness + A3 | A4 preview Harness + A3 | Difference |
| --- | ---: | ---: | ---: |
| 4 Coder Harness response strings | **76,340** chars | **61,904** chars | **−14,436 (−18.91%)** |
| A3 full-file source text, four scenarios | 261,710 chars | 261,710 chars | 0 |
| **Harness + A3 source** | **338,050** chars | **323,614** chars | **−14,436 (−4.27%)** |
| A2/A3 selected metadata reference text (from pinned navigation run) | 20,289 chars | 20,289 chars | 0 |
| **Harness + A3 source + metadata** | **358,339** chars | **343,903** chars | **−14,436 (−4.03%)** |
| Predefined diagnostic dependency sets covered by A3 | **4/4** | **4/4** | No regression in source-navigation coverage |

The extra metadata is **not** guaranteed to be delivered in every future model call. These are source-produced payload character calculations, **not measured ChatGPT tokens**, actual ChatGPT context cache or network usage. They also exclude Skills, Knowledge and test body text, so their observed total may dilute the percentage further.

**Conservative interpretation:** A4 does reduce the *eligible Harness* portion materially (18.91%), but in source-heavy defect repair combined with A3 the measured additive reduction is only **4.03–4.27%**, not “around 25% of total context”. The earlier **24.84%** result was a paper forecast for a different 13-Role/14-Skill fixture and is not confirmed by this source-executed conservative A4.

## 3. A1 vs A4 vs A3: avoid mixing denominators

The controlled historical GSA3→A3 navigation run measured **GSA3 724,843**, **A0 207,943**, **A1 126,213**, **A1+A2 126,213**, **A1+A2+A3 261,710** source chars, with A3 covering 4/4 predefined diagnostic sets while A1 covered 2/4 complete cases.

- A1 did reduce **source text 39.3% versus A0** within that fixed whole-file reading protocol; it is not evidence for a comparable % of *total* model context.
- A2 on those cases did not reduce source-read bytes; it supplied Task-specific references and additional metadata.
- A3 increased source-read cost but achieved full fixed dependency coverage, including an actual `index.ts` callback that A1 missed.
- A4 can shorten literal Harness while preserving A3's source candidate completeness, but this experiment removes only four planner procedure clauses for Coder's repair workflow.
- An earlier A0 source-grep comparator used the current worktree; after introducing A4's new file this changed the A0 measurement. The benchmark was corrected to **pin historical A0 source commit `37c98d050b34ec77b2cec55cdcf375881c248262`** separately from the active experiment HEAD, restoring full source measure 207,943. Its Git-grep metadata count may differ due to the commit-qualified path prefix; these metadata bytes are bookkeeping, not observed network calls.

The correct engineering direction remains **A1 cheap entrypoint → A2 as needed → A3 risk-triggered dependency expansion**, while A4 selectively reduces the relevant instructions. A4 cannot substitute for the cross-module A3 graph.

## 4. Safety and rollback evidence

The seven new Node tests cover: exact 49-clause source inventory; all 4 A3 cases combined with real A2 source; all eight current Roles/unknown role; unknown workflow/stale source; blocked Task/source graph; test-only missing mandatory Human execution rule and extra unaudited Shared clause (both force FULL fallback); no Skill/Role API changes. Existing GSA3/A0 eight-role/eleven-skill golden parity and previous A1/A2/A3 negative suites continue to PASS.

**Important safety limit:** these checks establish deterministic literal preservation on the frozen source and fallback behavior in a pure helper. They **do not prove** that an actual Agent which receives only the abbreviated Harness will correctly respond to a new Human message mid-Run, review a newly introduced Plan scope change, or maintain the same semantic behavior under adversarial inputs. A4 is NOT wired into any live response for exactly this reason.

**Do not merge to `main`, deploy, replace original Shared Harness, rewrite Role/Skill bodies or activate A4 model-text filtering based on this report.** Keep the preview as a reversible development experiment. Further live/independent, bounded Role-Task-Human-message tests and actual token/delivery traces are required before deciding whether runtime A4 is worth a permanent extra selector.

## 5. Decision

**A4 conservatively works as a source-executed selective-preview experiment; 4/4 A3 dependency completeness retained; 201 tests green.** It does **not** yet demonstrate a “large” total prompt/context saving or safer bug fixes. For current source-heavy Coder repair, the 4% modeled combined benefit alone is probably insufficient to justify immediately changing live Harness delivery without independent semantic parity and task/phase transition tests.

Recommended next: record A4 as an **optional experimental candidate** on development (without runtime wiring) and independently test real Coder/Reviewer/Tester sessions before accepting any future selective model-facing payload change. Preserve A3's complete source traversal on risk.
