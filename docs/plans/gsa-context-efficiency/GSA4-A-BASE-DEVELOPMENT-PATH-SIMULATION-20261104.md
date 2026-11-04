# GSA4 — A-first development-path paper simulation

**Date:** 2026-11-04. **GSA3 source baseline:** `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`. **Mode:** Direct Agent, paper/static simulation. No source edits, physical split, actual execution, independent Reviewer PASS, CT-00 timing, merge or deploy.

## Sources and decision

This study extends [Six-report Cross-Review](./GSA4-SIX-REPORT-CROSS-REVIEW-20261104.md), [Group 1A](./GSA4-G1-A-RESEARCH.md), [Group 2A](./GSA4-G2-A-RESEARCH.md), [frozen SIM4 journeys](./GSA4-SIM4-FROZEN-USER-JOURNEYS.md) and the existing [Research Plan](./GSA4-RESEARCH-PLAN.md). The SIM4 author was previously source-aware: this is not independently source-blind. **Human selects A as the research BASE**: physical modules small enough to own one coherent responsibility; B becomes a **logical context recipe over A modules**, never a second physical monolith.

**A0 parity-only physical design:** Group 1 has a catalog facade + Shared + 8 Roles + 11 Skills (21 logical TypeScript files, original 85,330 source chars). Keep exact GSA3 role/Skill outputs. Group 2 proposes 22 child code owners under five existing parent facades and keeps integrated selftest (28 logical files in the six-file hotspot). A-guard may co-locate proven tightly coupled units; do not force one function per file. Extracted I0 still has ~47,444 original chars, so its entrypoint/registration ownership deserves separate attention. Preserve all exports, error semantics, createServer lexical dependencies, tools and tests. **No physical extraction has happened.**

## Alternative development paths AFTER A0

| Candidate | Action over fine physical A | Benefit to test | Risk and evidence |
| --- | --- | --- | --- |
| **A1 Owner locator** | SHA-bound map: tool/error/symbol → owner → dependencies/tests | Less opening irrelevant facade/source | Low-medium maintenance; static cost model only |
| **A2 Logical B over A** | Role × Job × Task × Phase recipe referencing A leaves and task knowledge | Context selected per actual work position | Medium risk of incomplete/wrong task classification; **0 guaranteed** marginal saving |
| **A3 Repair graph** | Repro error → real owner → callers/producers/consumers → regression tests | Easier bug localization, fewer wrong edits as a hypothesis | Medium-high dependency risk; **0 measured repair gain** |
| **A4 Shared policy ownership** | Independently reviewed universal core + Role-owned mandatory rules | Model-facing Harness payload reduction | High authority/security risk; **0 proven safe reduction** |
| **A5 Task/Skill section filter** | Trusted phase-specific Role loop and Skill subsections | Small text reductions | High risk of missing failure/approval instructions |
| **A6 Guide section reads** | Named ranges from Agent guidance docs | Less irrelevant full-document reading | More tool requests, stale index, missed guard |
| **KEEP** | Retain GSA3 loader content, improve source navigation only | Preserve control-plane quality | No model-facing text saving |

### Source-context simulation: same 4 Group-2A Tasks, 12 source-reading Agent sessions

Each Task has Coder/Reviewer/Tester reading their own source, no shared cache. **A0:** each reads the 47,444-char I0 parent plus relevant A leaves. **A1:** precise owner lookup avoids I0 only if entrypoint/registration is not actually affected. The following assumes 2,000 hypothetical locator chars per session, or 6,000 per scenario. Source reads exclude index fetches.

| GSA development Task | A0 source chars/reads | A1 direct owner source chars/reads | A1 incl. index chars | Saved vs A0 |
| --- | ---: | ---: | ---: | ---: |
| Bootstrap readiness | 363,123 / 18 | 220,791 / 15 | 226,791 | 136,332 |
| Run admission continue code | 253,890 / 13 | 111,558 / 10 | 117,558 | 136,332 |
| Checkpoint/evidence bug fix | 419,318 / 16 | 276,986 / 13 | 282,986 | 136,332 |
| Evidence publish feature | 384,932 / 18 | 242,600 / 15 | 248,600 | 136,332 |
| **Total** | **1,421,263 / 65** | **851,935 / 53** | **875,935** | **545,328 (38.4%)** |

The entire raw 569,328-char difference is exactly **12 × 47,444 skipped I0 full reads**. A1 needs up to 12 extra index lookups; real call latency is unknown. If the Agent already navigates directly to an owner, the locator may add cost. Under a fixed +24,000 index-char allowance, assuming only 0/25/50/75/100% of I0 reads are avoidable gives approximate net savings **−24,000 / +118,332 / +260,664 / +402,996 / +545,328** chars respectively. These are sensitivity assumptions, not observed probabilities.

**A2/A3 on the same Task:** A2's recipe for run admission is R1+I3+I2+execution-guards; for checkpoint verification is C2+I4+I5+E2+T0; for evidence publish is E1+E2+E3+I4+I2+T0. These are already the A1 source sets: **no invented additional numeric savings**. A3's checkpoint case inherits A1's 282,986-char paper budget (32.5% below A0 for this Task), but this does **not** prove fewer bug-fix cycles. A3 must check claim/revision/attestation producers, consumers, tests and expand to C1/I2/E1 where necessary. An error-emitting function is not necessarily the root cause. Keep selftest whole unless fixture isolation is demonstrated.

### Model-facing simulation: same 13 role activations and 14 selected Skill loads

| User journey | A0–A3 delivered Harness+Skill | A4 hypothetical shared-rule subset |
| --- | ---: | ---: |
| S1 Brownfield valid Plan | 23,716 | 22,422 |
| S2 Continue approved coding | 67,039 | 47,395 |
| S3 Verified bug/retest | 92,353 | 65,334 |
| S4 Feature, with later Human approval | 120,393 | 92,963 |
| **Total** | **303,501** | **228,114** |

**A4 conditional saving: 75,387 chars (24.84%). Validated safe saving: 0.** This Shared-policy optimization would work on either physical architecture; A itself does not shrink the existing Role/Skill payload. Separate favorable A5 paper cases save ~2.16% Role-section text or ~1.10% Skill-section text versus the same BASE; do NOT add them to A4 without proving non-overlap and mandatory instruction delivery. A6's optional guide audit suggests 766,971 full-doc chars/26 opens → 322,154 selected-section chars/84 calls; if the docs were not explicitly opened, saving is 0. Project Criteria/Plan/Knowledge are excluded from these source counts.

## Quality-first simulation and required stop conditions

| Branch | Required behavior; shorter context may never hide it |
| --- | --- |
| Approved Task code | Read exact Task/branch/revision and needed owner code; Coder writes only authorized scope; Reviewer/Tester independently inspect changes |
| Missing/denied scope or Human approval | STOP before source edits, regardless of task recipe |
| Tester host unavailable | ENVIRONMENT_FAILURE/UNVERIFIED, not assumed PRODUCT_FAILURE |
| Reproduced checkpoint defect | Trace C2/I4/I5/E2 plus source/test evidence; read transitive producers/consumers as needed; fresh independent retest |
| Stale source locator or conflicting Job | Revalidate SHA, expand relevant full modules or ASK; do not use stale excerpts to suppress guards |
| PENDING Git cursor/unknown write | Read current Git/Memory and reconcile, no blind retry |
| Frontend Coder Task | Load actual Task-required ui-coder-frontend specialization only when needed; generic Coder remains generic |
| New feature not approved | Planner/Reviewer plan only; no invented implementation permission |

No paper estimate proves that A results in fewer bugs. Future real tests must record: time/calls to identify root owner, wrong files opened, source chars, changed-function blast radius, repair/review/retest count, newly failed tests, missing interface requirements, actual per-role Host tokens/latency and source parity.

## Recommendation and dependency

**Prefer A0 → A1 + A2 → A3**, then investigate A4 with independent per-clause safety proof. Defer A5 until a trustworthy section selector and meaningful observed benefit exist; use A6 only if actual agent-guide reads justify extra calls. This favors the Human's priority: simple responsibility-owned source, flexible B-like logical context and measurable bug-repair quality.

**Strict implementation order remains:** research A physical design → separately authorized physical extraction → byte/behavior/API parity including 8 Roles, 11 Skills, 58 MCP tools, source-bound tests, negative permissions/recovery cases → only then R6–R8 selective loading and CT-00. This document is research-only; it neither changes source nor grants execution authority.
