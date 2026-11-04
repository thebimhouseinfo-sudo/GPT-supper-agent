# GSA4 — RESEARCH GROUP 2B: COHESIVE WORKFLOW/LIFECYCLE RUNTIME MODULES

**Status:** SOURCE_STATIC + SCENARIO_SIMULATED, RESEARCH ONLY (2026-11-04). No product code change, Bootstrap/Job, Criteria change, deploy, CT-00 execution, HOST_OBSERVED measurements or independent Reviewer PASS.  
**Repo / branch:** thebimhouseinfo-sudo/GPT-supper-agent / upgrade/gsa-context-efficiency  
**Source SHA pinned:** 0b5cf875402c7735e1ef573ab95df5858c6ac5e8 (GSA3).  
**Group isolation:** G2-B only. Did not read G2-A report.

## GOAL

Study a behavior-identical hypothetical BASE-2B where large GSA runtime sources are physically organized into **a low number of cohesive workflow/lifecycle modules**, original parents retain entrypoint and exported registration APIs, and Coding Agent source reads can be targeted by ownership, public API, error and task. Count source navigation separately from Criteria, Plan, Harness, Skills, TS imports, model-facing runtime payload and host tokens/latency.

## 1. Provenance and verified current structure

Read research guidance from development branch:
- [GSA4-RESEARCH-PLAN.md](./GSA4-RESEARCH-PLAN.md), blob 825e7932751ff1ddb642797de97c7a7e3fe1f81d;
- [GSA4-R1-R3-SPLIT-OPTIONS-PAPER-SIMULATION-20261104.md](./GSA4-R1-R3-SPLIT-OPTIONS-PAPER-SIMULATION-20261104.md), blob 7ec0b6f84526bb3700b83a91ebe4d28aca2d812e;
- [AGENT-HARNESSES.md](../../architecture/AGENT-HARNESSES.md), source blob b56994bdfca2e603fa3c53490afae6b712c175ce.

Six baseline files are relative to supabase/functions/gsa-mcp/:

| File | Pinned source blob SHA | Chars | Lines |
| --- | --- | ---: | ---: |
| index.ts | 408c81326488f5e8b25e6012d6a172ea9102dfba | 142,374 | 2,395 |
| run-execution-tools.ts | 29434ca7fe558b5e669eab99daf2091d4936bd7d | 49,080 | 837 |
| project-setup-tools.ts | 7d926eefb74eba1ff5a32020c1a3fc7e132b9eb8 | 29,106 | 407 |
| checkpoint-tools.ts | f7fb5b0dd9202ce6725d2c720c9ab0746992c2af | 35,533 | 562 |
| evidence-repository-tools.ts | c75e877d6a48687077df8e664aadea9915ff7eb5 | 31,109 | 569 |
| selftest.ts | e822a1c27da95c1fe86b86b1559a701cc5c47c85 | 48,907 | 943 |
| **TOTAL** | | **336,109** | |

These are exact JavaScript source string lengths (UTF-16 code units), partitioned into line ranges with newline accounting verified to sum to the file totals. Not tokens, UTF-8 bytes or observed host context.

Read actual exported/imported symbols and scoped dependency ownership in bootstrap.ts (projectBootstrapChecklistDecision, projectBootstrapReadinessDecision), execution-guards.ts (checkpointLeaseExpired, requiredCheckpointIds, checkpointBoundaryPrerequisiteIds), planning-guards.ts (validateExecutionTopology, planningLoopContinuationDecision), recovery-decisions.ts (sourceMutationRecoveryDecision, orchestrationProgressDecision), execution-cursor-tools.ts (four cursor tools), evidence-bundle-tool.ts (bundle attestation), project-utils.ts, harness-skill-tools.ts, job-prepare-tool.ts and plan-review-record-tool.ts. **Dependency sizes are excluded** from six-source navigation arithmetic; reading/importing code does not prove Agent co-reading.

Observed registration ownership:
- index.ts has an already modular GSA1 composition root with 28 internal imports according to R1; L1800–2395 contains createServer, registration, CLI/handoff, HTTP transport/headers; a nested validateRepositoryProbeSnapshot sits at L1937–1996.
- project-setup-tools.ts: project_setup_prepare L4–118; project_criteria_advice_check L119–167; project_role_addins_resolve L168–232; project_bootstrap_checklist_prepare L233–278; project_bootstrap_readiness_prepare L279–324; project_branch_policy_prepare L325–407.
- run-execution-tools.ts: run_begin L4–224, relationship_knowledge_prepare L225–304, goal_recheck_record L305–435, run_verification_record L436–558, run_complete L559–837.
- checkpoint-tools.ts: checkpoint_claim_prepare L4–299, checkpoint_verification_prepare L300–517, checkpoint_gate_evaluate L518–562.
- evidence-repository-tools.ts: evidence_repository_publish_prepare L3–198, evidence_repository_publish_finalize L199–450, evidence_repository_probe_verification_prepare L451–569.
- selftest.ts: one registerSelftest route, shared fixtures L1–771 and aggregated checks L772–943. Splitting fixture names is not proof of separable runtime ownership.

## 2. BASE-2B proposed tree and module index

**Hypothetical physical extraction; unchanged 100% behavior and public APIs.** Keep all six existing parent/registration files. Extract only the mixed, unextracted helper code presently in index.ts into five cohesive internal modules. Leave tool registration modules and the single diagnostic route together initially. IDs are for accounting, not actual existing files.

| File / ID | Capability & main functions/tools | Chars | Dependencies / owner | Relevant Agents/Tasks | Read conditions |
| --- | --- | ---: | --- | --- | --- |
| **I index.ts parent** | Original iL1–207, iL1800–1936, iL1997–2395: env/auth, MCP server, CLI, tool registration, HTTP, meter | **51,833** | Hono/MCP/auth; D/E/P/C/M; existing registration modules | Coder integration, Planner entrypoint, Reviewer API | Routing/registration/auth/transport |
| **D runtime-run-state.ts** | Original iL208–615: namespace, durable paths/snapshots, dispatch, required skill, Goal Recheck, Run Verification and closure validation | **21,819** | records, guards, harness catalog; inspect coupling E | Coder/Reviewer/Tester | Run dispatch/closure/verification |
| **E runtime-evidence-core.ts** | Original iL616–965 and iL1937–1996: attestation, bundle, checkpoint gate/retest, repository probe validation | **22,031** | D snapshot/path, execution-guards, bundle tool | Coder/Reviewer/Tester | Evidence and checkpoint semantics |
| **P runtime-planning-admission.ts** | Original iL966–1271: supersession, bootstrap execution gate, milestone CRL, NEXT model validation, formatting | **18,710** | bootstrap/planning-guards/project-utils | Planner/Reviewer/Coder | Plan/Bootstrap topology and authority |
| **C runtime-cursor-recovery.ts** | Original iL1272–1503: cursor prepare/resume decision | **13,961** | recovery-decisions, execution-cursor-tools | Coder/Orchestrator/Reviewer | Source mutation, restart/uncertain write |
| **M runtime-project-records.ts** | Original iL1504–1799: Project manifest, repository, scope, addins, Memory config | **14,020** | project-utils, auth/management | Planner/Coder/Reviewer | Ownership, scope, branch, manifest |
| **S project-setup-tools.ts parent** | Six intake/Criteria/Advisor/Bootstrap/branch tools | **29,106** | M/P, bootstrap, advisor-receipt | Planner/Advisor/Reviewer/Tester | Project intake, branch/Criteria |
| **R run-execution-tools.ts parent** | Run start, knowledge, Goal Recheck, Verification, complete/handoff | **49,080** | D/E/P, records, evidence | Coder/Reviewer/Tester | Task lifecycle |
| **K checkpoint-tools.ts parent** | Claim/lease → Verification → Gate | **35,533** | E/D, guard/attestation | Tester/Coder/Reviewer | NEXT checkpoint/retest |
| **V evidence-repository-tools.ts parent** | Git repository evidence prepare/finalize/probe | **31,109** | E/M, provenance/immutable refs | Tester/Coder/Reviewer | Evidence publication |
| **T selftest.ts parent** | Shared fixtures and all route assertions | **48,907** | all relevant runtime owners, guards, harness | Tester/Coder/Reviewer | Diagnostics/negative regression |
| **Total** | **11 logical files** (six retained parents, five extracted helpers) | **336,109** | no counted duplication | | |

**Ownership review:** C is strongly cohesive; K and V share transaction identity, publication and verification contracts and should not be split per tool without co-read evidence. M represents consistent Project record/scope ownership. D is only partially cohesive (dispatch vs closure), but one Task workflow commonly needs both; S combines distinct Advisor/Bootstrap/branch concerns tied by scope/authority. T is a single diagnostic closure with shared fixtures. **E is most debatable:** repository probe and checkpoint applicability are grouped due actual evidence dependencies, not simply because of a lifecycle word.

**Extraction blockers requiring an R5 graph:** index iL1937–1996 is nested in createServer and may capture lexical values; D iL553–615 contains evidenceBundleRefValidationError that might belong to E; P contains general prettyJson. These are provisional source accounting partitions, **not cut-and-paste compilable units**. Any revised boundary needs remeasured module totals. Prevent index↔child and D↔E circular imports using one-way pure common helpers or explicit dependency injection, without duplicating source logic.

**Parity obligations:** unchanged tool names/input schemas/output fields/errors, HTTP paths, authentication, role independence, Human authority, V2_STABLE/NEXT and TEST_LAB/PRODUCTION, exact SHA readback/CAS, Project/Job/Task/Run identities, claim/lease/attempt, verification, cursor/source recovery, testing and handoff. Parent registration/export signatures remain.

## 3. Four development journeys and navigation simulation

**Fixed cases:** B = Bootstrap admission change; C = Continue coding Run/Goal Recheck with repair/re-review; T = Test → fix multi-layer checkpoint/evidence bug → retest; N = New feature extending Run verification. These are GSA *development* scenarios, not an assertion that a normal end-user Bootstrap reads TypeScript source.

**Counting:** Each source-reading Agent activation gets independent context; no assumed cross-agent cache. A full module counts once per activation. Orchestrator routing with no source inspection costs zero source chars. KEEP means original six whole files, BASE-2B means 11 hypothetical whole modules, OPT means selected exact baseline symbol/section ranges. No Criteria, Plan, Harness or Skills added. Each full file/range equals one logical read; reread is a module opened again in a later activation.

| Journey | Agent step / task | BASE module IDs | BASE chars / opens | Targeted OPT chars / range reads |
| --- | --- | --- | ---: | ---: |
| B | Planner trace Project admission | I,M,P,S | 113,669 / 4 | 39,190 / 6 |
| B | Coder intake implementation | I,M,P,S | 113,669 / 4 | 37,098 / 6 |
| B | Reviewer check scope/readiness | M,P,S | 61,836 / 3 | 25,958 / 3 |
| B | Tester negative fixtures | S,P,T | 96,723 / 3 | 19,071 / 5 |
| C | Coder resume Run+cursor | I,D,R,C | 136,693 / 4 | 75,504 / 6 |
| C | Reviewer exact closure | R,D,C | 84,860 / 3 | 66,208 / 4 |
| C | Tester regression | R,D,T | 119,806 / 3 | 51,202 / 5 |
| C | Coder scoped repair | R,D,C | 84,860 / 3 | 42,577 / 3 |
| C | Reviewer changed-scope re-review | R,D | 70,899 / 2 | 28,616 / 2 |
| T | Tester detects checkpoint bug | T,K,E,V | 137,580 / 4 | 70,149 / 5 |
| T | Coder trace/correct multi-layer | K,E,V,R | 137,753 / 4 | 83,600 / 5 |
| T | Reviewer publication/claim contract | K,E,V | 88,673 / 3 | 58,408 / 3 |
| T | Tester revision-bound retest | T,K,E | 106,471 / 3 | 50,485 / 4 |
| N | Planner new Run verification feature | I,P,R | 119,623 / 3 | 43,292 / 5 |
| N | Coder registration/Run/checkpoint | I,R,D,E,K | 180,296 / 5 | 87,248 / 6 |
| N | Reviewer API/callers | R,D,E,K | 128,463 / 4 | 57,020 / 5 |
| N | Tester affected Run/checkpoint tests | R,K,T | 133,520 / 3 | 48,617 / 4 |

Representative **exact original source line ranges** underlying OPT (symbol/section reads, no fabricated post-split line numbers):
- **B:** Planner i1800–1846, i2156–2160, i1504–1687, i1061–1155; s1–118, s233–324. Coder i2156–2160, i2297–2314, i1504–1687, i1061–1155; s1–118,s233–407. Reviewer i1504–1687,i1061–1155,s233–407. Tester s233–324,i1061–1155,t1–35,t466–516,t772–791.
- **C:** Coder i2172–2175,i208–615,i1272–1503,r1–224,r305–435,r559–837. Reviewer r1–224,r559–837,i208–615,i1272–1503. Tester r1–224,r559–837,i208–414,t517–771,t792–817. Repair r559–837,i415–615,i1272–1503. Re-review r559–837,i415–615.
- **T:** Tester t131–465,t892–919,k300–562,i616–965,v199–569. Coder k300–517,i616–965,i1937–1996,v1–450,r436–837. Reviewer k300–562,i616–965,v1–450. Retest t131–465,t892–919,k300–562,i616–965.
- **N:** Planner i1800–1846,i2160–2175,i1156–1271,r1–224,r436–558. Coder i2160–2175,r1–224,r436–837,i208–615,i616–804,k300–562. Reviewer r1–224,r436–558,i415–615,i616–804,k300–562. Tester r436–837,k300–562,t517–771,t809–817.

Short names: i=index.ts, s=project-setup-tools.ts, r=run-execution-tools.ts, k=checkpoint-tools.ts, v=evidence-repository-tools.ts, t=selftest.ts. All ranges include source newline when applicable. These are task-specific **forecast selection recipes**, not proof that this subset suffices for every implementation; escalate to complete source when transitive consumer/test/fixture evidence requires it. One selftest assertion range never proves the whole test route PASS.

### 3.1 Aggregated measured paper counts

| Journey | KEEP six files chars / opens | BASE-2B chars / opens | BASE rereads | OPT chars / range reads | OPT saved vs BASE |
| --- | ---: | ---: | ---: | ---: | ---: |
| Bootstrap | 734,827 / 9 | **385,897 / 14** | 9 | **121,317 / 20** | 264,580 (68.6%) |
| Continue coding | 1,006,177 / 11 | **497,118 / 15** | 10 | **264,107 / 20** | 233,011 (46.9%) |
| Test → fix → retest | 951,849 / 14 | **470,477 / 14** | 9 | **262,642 / 17** | 207,835 (44.2%) |
| New feature | 778,948 / 11 | **561,902 / 15** | 8 | **236,177 / 20** | 325,725 (58.0%) |
| **All 17 reading activations** | **3,471,801 / 45** | **1,915,394 / 58** | **36** | **884,243 / 77** | **1,031,151 (53.8%)** |

BASE unique module counts by journey: 5,5,5,7; cumulative 22 journey-unique module instances; 58 opens minus 22 = 36 later-activation rereads. **BASE-2B vs KEEP**: 44.8% fewer hypothetical whole-read source chars but 13 more opens. **OPT-2B vs KEEP**: 74.5% fewer source chars but 32 additional range reads. The full task journey counts repeated source across independently reading Agents; no stale source assumed retained across them.

Hypothetical one module-index lookup per Agent activation: +17 calls and a separately charged **1,000 non-source chars** per activation (+17,000 metadata chars). Thus OPT source-only is 884,243 / 77; OPT with illustrative map is 901,243 total source+map / **94 calls**, saving 1,014,151 chars (53.0%) against BASE source-only. An arbitrary **250 ms fixed overhead/read** implies +9.0 seconds for 36 extra calls; this is a *sensitivity assumption*, emphatically **not host timing or speedup evidence**. No invented token telemetry. Tool-batching and real cache behavior unknown.

## 4. Context need: full workflow versus local symbol

**Full workflow investigation required** for Bootstrap authorization and Project branch, checkpoint claim→verification→gate, evidence attestation/finalize, Run completion and exact verification, source cursor recover/uncertain write, any revision/namespace/CAS change or multi-file public API change. Read current owners plus producers/consumers and affected source-bound tests.

**Local function first** is sufficient for an isolated error string, exact tool schema or small validation: project_criteria_advice_check S119–167; run_verification_record R436–558; checkpoint_gate_evaluate K518–562; CLI help i2268–2295; one selftest assertion accompanied by its fixture. Start at owner range, then expand only if inputs/side effects/changed invariants demand it. Reviewer/Tester independently select their read scope; they are not forced to trust Coder excerpts.

**Progressive navigation contract:** L0 short index and owning entrypoint; L1 public API/ownership/dependencies; L2 exact symbol, callers, consumers, tests; L3 full transitive workflow on failure, stale index, shared-security contract, or multi-layer risk. This is source-navigation guidance, not permission to skip mandatory Harness/role instructions.

## 5. Error → tool → helper/service → owner trace

| Real source error family | MCP tool | Source route / owning symbol | Escalation |
| --- | --- | --- | --- |
| NEXT_DISPATCH_STALE_JOB_SHA, NEXT_DISPATCH_PREREQUISITE_BLOCKED | run_begin R4–224 | nextDispatchPreflightError i358–390 (D); snapshot/Task scope i208–414 | If evidence requirement failed, follow E/K gate |
| GOAL_RECHECK_COVERAGE_REJECTED | goal_recheck_record R305–435 | goalRecheckCoverageError i415–458 (D) | Compare current Job topology/planning revision P |
| RUN_VERIFICATION_REJECTED / RUN_COMPLETION_BLOCKED | run_verification_record R436–558 / run_complete R559–837 | validateRunVerificationSnapshot i459–511; nextClosureCoverageError i512–546 (D) | E/K plus persisted Verification, Run/Job readback |
| CHECKPOINT_PREREQUISITE_BLOCKED, CHECKPOINT_RETEST_REJECTED | checkpoint_claim_prepare K4–299 | checkpointBoundaryPrerequisiteIds, productFailureRetestValidationError i929–965 (E) | Entire lease/attempt, repaired target and Goal Recheck |
| CHECKPOINT_VERIFICATION_REJECTED | checkpoint_verification_prepare K300–517 | validateEvidenceBundleAttestationSnapshot i622–694, checkpointVerificationOutcome i914–928 (E) | V prepare/finalize, namespace, exact revision/proof |
| EVIDENCE_PROBE_VERIFICATION_REJECTED | evidence_repository_probe_verification_prepare V451–569 | validateRepositoryProbeSnapshot i1937–1996 (E, nested in index createServer) | Publication prepare/finalize + immutable target ref |
| Source mutation lost-response / uncertain cursor | execution_cursor_resume_evaluate | resumeExecutionCursorDecision i1419–1503 (C), recovery-decisions.ts | Source branch HEAD/blob and Memory cursor re-read; no fabricated success |

This is a **source-static owner map**; not observed error incidents. “Error emitted here” ≠ “root cause here”; cross-layer defects require L3.

## 6. OPT forecasts, overhead and risk

| Option | Source chars saved versus BASE | Added reads / overhead assumption | Complexity | Material risks |
| --- | --- | --- | --- | --- |
| O0 KEEP all BASE modules | 0 | 0 (58 opens) | LOW | Wasted source for narrow fixes |
| O1 Module ownership/public API index only | **0 guaranteed**; one avoided wrong open saves that module's full 13,961–51,833 chars if it would otherwise be read | Up to 17 index lookups, 1,000 metadata chars each (assumed) | LOW–MEDIUM | Stale index, wrong owner, undocumented consumers |
| O2 SHA-anchored symbol/section-level reads | **1,031,151** in frozen four-journey paper fixture | 77 ranges vs 58 full opens (+19); with index 94 total (+36) | MEDIUM | Symbol/line drift, missed call path, multiple ranges in same module |
| O3 Summary of dependencies/contracts on demand | Not independently additive; conditional avoided full open of C=13,961, D=21,819, E=22,031, R=49,080 etc, offset by summary size | Assume 700–1,200 summary chars/lookup; use for orientation only | MEDIUM | Stale public API, missing authorize/CAS/revision precondition |
| O4 Error-code ownership locator | No guaranteed aggregate saving; conditional avoidance of one wrong I (51,833) or K (35,533) full read | +1 map read unless embedded in error/index | MEDIUM | Error renames, false confidence on emitter, cross-layer roots |
| O5 Task-specific Reviewer/Tester reads and no full reread | **Already included in O2**, never add savings twice | 1–6 ranges per modeled activation | MEDIUM | Missed transitive changed test/caller; role-isolation violation |
| O6 L3 full transitive scan | May save **0** when genuinely all 11 modules necessary (336,109 chars/activation) | ≥11 file opens, potentially more ranges | HIGH | Costlier but necessary for correctness |

**Freshness control:** metadata must contain module owner, exports/tool names, dependencies, callers, error codes, test selectors, read conditions, source blob SHA and symbol anchors. Index is a locator, **not** an authoritative code substitute. Validate SHA before line-range use and expand to full source when it drifts. Dependency summaries are forbidden as sole proof for Human authorization, security, durable CAS, checkpoint or verification correctness.

**Fewer files with fine-split precision:** exact section reads inside R=49,080 and T=48,907 show that small file count can coexist with narrow source extraction. This is dependent on the source reader supporting stable ranges/search; otherwise fine-grained physical splitting may win. The same range-reading capability can apply to the six existing files; physical extraction alone cannot be credited for all of O2's savings.

## 7. Adversarial review: source-change breadth and lifecycle cohesion

| Case | B2 risk | Required response |
| --- | --- | --- |
| Multi-module code change (R+D+E; K/V consumers) | Reviewer reads emitting module only and misses schema/proof impact | Read changed API, all consumers, tests, exact diff and target revision; broaden L3 |
| Deep 3-layer bug | Wrong root owner from error map | Error→MCP entry→guard→state record→producer→consumer→selftest |
| Checkpoint verification | Claim token, lease, planning_revision, attestation mismatch | Read K+E and relevant V/R; verify current durable claim and TEST/RETEST refs, fail closed |
| Source recovery | Cursor PENDING and newer HEAD | Read C+execution-cursor-tools+recovery-decisions; independently reconcile Git/Memory SHA before mutation |
| createServer closure | Moving nested i1937–1996 changes captured lexical state | Explicit dependency injection, compile/type and contract parity tests |
| Circular imports | index imports D/E while children import index; D↔E on shared snapshot helpers | One-way pure helper owners or injected dep contracts; reject circular runtime imports |
| Symbol drift / stale index | Wrong line ranges or phantom savings | SHA check, symbol search, source readback; conservative fallback |
| Reviewer/Tester isolation | Reusing Coder's hand-picked snippets conceals omissions | Independent target/diff/requirement reconstruction and negative tests |
| Large selftest split | Test fixtures/aggregated assertions share closure and hidden state | Keep T as one route; only split with proven isolated fixtures and parity |
| V2_STABLE/NEXT, TEST_LAB/PRODUCTION | Wrong default path or cross-namespace acceptance | Regression before/after on exact baseline, errors, responses and path/namespace |
| Tool overhead | +36 hypothetical calls with index erases wall-time benefit | Measure actual fixed-call/byte/token costs after parity, no present speed claim |

**Cohesion challenge:** K claim/lease, verification and gate really share one checkpoint transaction; V publish prepare/finalize/probe share immutable evidence provenance. C prepare/resume shares cursor reconciliation. E's repo probe + attestation + gate is less obviously one edit unit and D's evidenceBundleRefValidationError sits across a likely boundary; must test alternative ownership. Naming everything "lifecycle" is not a cohesion proof. Repeated import graph edges also do **not** prove Agent co-reading.

**Hard disqualifiers:** any change in tools/schemas, role authority, Human approval, Project/Job/Task scope, source cursor/CAS/readback, independent review, checkpoint evidence applicability, retry/failure classification, production/legacy namespace or error/unknown propagation. No source-byte improvement can outweigh parity failure.

## 8. Review verdict, R5 prerequisites and decision

**Paper verdict:** **B2 is a credible conditional shortlist, not a winner.** It reduces whole-module read context in the fixed model and preserves low file count, while the larger extra gain comes from indexed section reads. KEEP remains a mandatory comparator; cross-group A vs B selection must use identical fixtures and real navigation/tool economics. No final physical split, independent Reviewer PASS or timing result was established.

Before any separately authorized extraction:
1. Build exact symbol/call/import closure and public API graph for index L208–1799 and L1937–1996, including captured values, circular references and pure shared helpers. Decide D/E/P disputed helper ownership.
2. Freeze current GSA3 outputs/tool schema/HTTP routes/security, V2_STABLE and NEXT/TEST_LAB and PRODUCTION paths, exact Git/Memory CAS, error strings, run/verification and checkpoint lease invariants.
3. Retain index.ts composition/registration facade and all five other parents' public registration entrypoints; never duplicate source logic in two modules.
4. Design negative test fixtures for stale SHA/revision, unauthorized scope, incomplete Bootstrap, checkpoint lease/retest, stale attestation/probe, role success without Verification, cursor lost response, legacy path.
5. In a separate implementation phase, require build + source-bound selftest/integration + role-isolated review and exact-output parity. Only after extraction and **parity PASS** may actual GSA4 R6–R8 Agent/Task context optimization and existing CT-00 comparison begin.

**Provisional recommendation:** extract *only demonstrably mixed index helpers first* while keeping K/V/T cohesive, put a short source-index with owner/public API/error maps before code navigation, and use SHA-valid section reads + escalation to full workflows as necessary. This recommendation is **R0–R5 research evidence**, not an implementation authorization. No claim about installed simulate skill, actual host tokens, latency, real source co-read rates, caching, true module sizes after refactor, or complete behavior parity. Do not read/modify G2-A; do not revise Criteria or parent Plans for this report.
