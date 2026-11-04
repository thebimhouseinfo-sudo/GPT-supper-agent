# GSA4 — G2-A Research: Fine-grained Runtime Source Modularization

**Status:** RESEARCH ONLY — SOURCE_STATIC + SCENARIO_SIMULATED; **not** implemented, reviewed independently, benchmarked or parity-PASS.  
**Date:** 2026-11-04. **Track:** Group 2A (runtime TypeScript source-navigation only).  
**Repository:** thebimhouseinfo-sudo/GPT-supper-agent. **Working branch:** upgrade/gsa-context-efficiency.  
**Pinned GSA3 SOURCE baseline:** 0b5cf875402c7735e1ef573ab95df5858c6ac5e8 (not the mutable working-branch HEAD).  
**Authority:** GSA4-RESEARCH-PLAN.md, GSA4-R1-R3-SPLIT-OPTIONS-PAPER-SIMULATION-20261104.md, docs/architecture/AGENT-HARNESSES.md, all read from the named development branch. No Chat 2B report was consulted.

## GOAL

Investigate finer, *responsibility-owned* physical modules for the remaining large GSA3 TypeScript runtime source, so development Coder/Reviewer/Tester Agents can find an entrypoint and inspect only the actual call path. Distinguish source navigation from runtime TypeScript imports, model-facing MCP payload, Harness/Skill content and Project documentation. Preserve existing GSA1 extraction, all public MCP registrations, error/authorization semantics and GSA3 behavior. This is a paper proposal and a postulated BASE-2A comparison only; no TS, test, Criteria, Plan, Job, Harness or deployment changes are authorized here.

## 1. Source verification and measurement contract

**Evidence:** GitHub source read at the pinned SHA. The source tree lists 29 TypeScript files under supabase/functions/gsa-mcp. The prior GSA1 extraction is already visible: index.ts imports 28 internal modules; do not extract those existing owners again. The selected hotspot sizes below are JavaScript string-length/source-character counts from retrieved UTF-8 file text, not UTF-8 byte sizes or token counts. The proposed child-module figures are exact line-region *source characters*, rounded only where indicated; a real split would add imports/exports/type glue, so they are NOT predictions of built file sizes.

| Existing source at pinned SHA | Chars | Lines | Observed responsibilities |
| --- | ---: | ---: | --- |
| index.ts | 142,374 | 2,395 | request/auth, shared contracts/validation, source-facing schemas, Project model, execution cursor logic, MCP tool wiring, Hono/HTTP entrypoint |
| run-execution-tools.ts | 49,080 | 837 | five registrations: run_begin, relationship_knowledge_prepare, goal_recheck_record, run_verification_record, run_complete |
| project-setup-tools.ts | 29,106 | 407 | six registrations: setup, Criteria/Advisor, role addins, bootstrap checklist/readiness, branch policy |
| checkpoint-tools.ts | 35,533 | 562 | checkpoint_claim_prepare, checkpoint_verification_prepare, checkpoint_gate_evaluate |
| evidence-repository-tools.ts | 31,109 | 569 | evidence_repository_publish_prepare, publish_finalize, probe_verification_prepare |
| selftest.ts | 48,907 | 943 | single registerSelftest; shared fixtures, diagnostics, assertions, one HTTP self-test contract |
| harness-catalog.ts | 85,330 | 608 | GSA3 Harness/Skill data; **out of Group 2 content-optimization scope** |

Existing independent modules that must NOT be re-extracted: bootstrap.ts (17,740 chars), job-prepare-tool.ts (19,225), job-revise-plan-tool.ts (16,525), job-transition-tool.ts (13,827), plan-review-record-tool.ts (11,448), execution-cursor-tools.ts (8,797), planning-guards.ts (8,508), project-utils.ts (6,487), execution-guards.ts (~2,520), harness-skill-tools.ts (5,057), and others imported in index.ts.

**Observed registration/test anchors:** index.ts imports the registration facades at lines 20–37 and calls registerProjectSetupTools (2156), registerCheckpointTools (2172), registerRunExecutionTools (2174), registerRepositoryEvidenceTools (1993), registerSelftest (2300). The existing test-lab/gsa1-module-boundary.test.cjs asserts the **58-name** pinned tool inventory and strict registration order. Sources are available at: https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/tree/0b5cf875402c7735e1ef573ab95df5858c6ac5e8/supabase/functions/gsa-mcp .

**Not observed:** real Coder file-open logs, actual co-read frequency, host/model tokens, file-open latency, cached context across Agents, runtime parity following a physical extraction. A TypeScript import or registration callback dependency does not itself consume Agent context. The original GSA4 research plan expressly forbids performing R6–R8 selective context-routing work before actual extraction and parity; the OPTs below are **theoretical source-navigation forecasts**, not R6–R8 implementation or runtime payload optimization.

## 2. BASE-2A physical split hypothesis (A: fine-grained ownership)

Candidate only; names below are **proposed** paths, not existing files. Retain each current public parent register* facade and index.ts entrypoint; keep existing external imports and MCP names/order, tool schemas, return/fallback content and authorization. Transfer original code without semantic rewriting at the later, separately authorized extraction. Small functions may remain grouped with tightly coupled owner operations. Existing GSA1 modules remain in place.

### 2.1 Proposed module index

Columns: Module | Function/ownership | Symbols/tools | Source chars | Dependencies | Coding Agent | When to read. I/P/R/C/E/T IDs below are also the scenario simulation IDs.

| Module (proposed except noted) | Function/ownership | Symbols / Tools | Source chars | Dependencies / reads beside it | Coding Agent | When to read |
| --- | --- | --- | ---: | --- | --- | --- |
| **I0** index.ts facade (retained) | imports, createServer/registration, HTTP serving | createServer; Hono routes; static MCP tools; register* calls | **47,444** (L1–45,1800–2395) | I1–I8, all registration owners | Coder/Reviewer/Tester | New/changed registration, auth transport, route or global dispatch; avoid full open for an owned handler |
| **I1** runtime-contract-auth.ts | execution contract, cutover, request/auth/bridge | resolveExecutionContract, jobExecutionContract, authContext, authError, runtimeSurface, cutoverInventoryError, callBrowserBridge | 7,831 (L46–207) | Supabase/Hono, platform constants | Coder/Reviewer | API auth, request context, cutover/default contract defects |
| **I2** durable-record-io.ts | namespace, canonical paths, snapshot parsing | recordNextMemoryNamespace, recordPath, verificationPath, checkpointClaimPath, parseDurableSnapshots, validateClaimSnapshots | 5,208 (L208–323) | I1 | Coder/Reviewer/Tester | Invalid namespace, path, SHA/snapshot structure |
| **I3** run-dispatch-closure-guards.ts | execution preflight, skill resolution, goal/closure checking | nextDispatchPreflightError, resolveRequiredTaskSkills, goalRecheckCoverageError, validateRunVerificationSnapshot, nextClosureCoverageError | 11,454 (L324–552) | I1, I2, RUNTIME_SKILLS data, execution guards | Coder/Reviewer/Tester | Dispatch/role/scope/goal/closure error; RUN owners refer here |
| **I4** evidence-validation.ts | bundle/attestation/Tester evidence validation | evidenceBundleRefValidationError, validateEvidenceBundleAttestationSnapshot, validateTesterEvidenceVerificationSnapshot, validateTesterEvidenceClaimSnapshot, checkpointVerificationApplicable | 17,495 (L553–858) | I1, I2, crypto/normalizeGithubRepo | Coder/Reviewer/Tester | Evidence rejected, binding/SHA/repo backend inconsistency |
| **I5** checkpoint-evidence-gate-policy.ts | checkpoint gate, outcome, retest, plan supersession | evaluateNextEvidenceGate, checkpointVerificationOutcome, productFailureRetestValidationError, nextPlanSupersessionMatches | 7,827 (L859–1001) | I1, I2, I4 | Coder/Reviewer/Tester | Missing checkpoint, stale claim, retest routing or PLAN_GAP |
| **I6** planning-schemas-and-preflight.ts | NEXT schemas, planning validation, CRL bootstrap preflight | EVIDENCE_NEED_SCHEMA, TEST_CHECKPOINT_SPEC_SCHEMA, DURABLE_RECORD_SNAPSHOT_SCHEMA, validateNextPlanningModel, projectBootstrapExecutionError, milestoneCrlEvidenceError | 17,135 (L1002–1271) | z, planning-guards, I1, I2, **I8** | Coder/Reviewer | Plan schema, bootstrap authority or planning topology |
| **I7** cursor-decisions.ts | prepare/resume cursor decisions (NOT execution-cursor-tools.ts) | executionCursorPath, prepareExecutionCursorDecision, resumeExecutionCursorDecision | 13,302 (L1272–1485) | I1, I2, recovery-decisions | Coder/Reviewer/Tester | PENDING mutation, recovery/cursor source validation |
| **I8** project-manifest-and-scope.ts | Project model, canonical path, scope, integration branch | buildProjectManifest, parseProjectManifest, transitionProjectManifest, projectScopeDecision, readMemoryConfig, validMemoryPath, resolveProjectRoleAddins | 14,679 (L1486–1799) | project-utils, platform-utils; schema types | Coder/Reviewer | Project identity, scope, branch, manifest errors |
| **R0** run-execution-tools.ts facade (retained) | parent export and registration order | registerRunExecutionTools | new small glue (not measured) | R1–R5 | Reviewer/Tester | Registry parity only; not on normal single-operation read |
| **R1** run-begin.ts | Task/Run admission | run_begin | 13,875 (L1–224) | I1–I3, project preflight, skill resolver | Coder/Reviewer/Tester | RUN creation, required skill activation, NEXT preflight |
| **R2** relationship-knowledge.ts | relationship knowledge artifact | relationship_knowledge_prepare | 3,367 (L225–304) | Run identity, knowledgePath | Coder/Reviewer | Knowledge relationship update; co-read R1 if required |
| **R3** goal-recheck.ts | goal/criteria completion evidence | goal_recheck_record | 7,920 (L305–435) | I3, Run, memory paths | Coder/Reviewer/Tester | Goal Recheck or missing criteria |
| **R4** run-verification.ts | Run-bound REVIEW/TEST verification | run_verification_record | 7,365 (L436–558) | I2, I3, evidence validation | Coder/Reviewer/Tester | Reviewer/Tester Verification failures |
| **R5** run-complete.ts | Run closure, coverage, NEXT rules | run_complete | 16,554 (L559–837) | I2, I3, I4, I5 | Coder/Reviewer/Tester | Completion refusal, Test/Review gate, coverage |
| **P0** project-setup-tools.ts facade (retained) | ordered registration export | registerProjectSetupTools | new small glue (not measured) | P1–P4 | Reviewer/Tester | Registry/API parity |
| **P1** project-setup.ts | create/setup Project | project_setup_prepare | 8,897 (L1–118) | I8, project-utils, authorization | Coder/Reviewer | Project initialization, existing Criteria binding |
| **P2** project-advice-addins.ts | Criteria/Advisor + role addins | project_criteria_advice_check, project_role_addins_resolve | 7,869 (L119–232) | I6, I8, advisor-receipt | Coder/Reviewer | Advisor/Criteria, addin validation |
| **P3** project-bootstrap.ts | checklist + readiness | project_bootstrap_checklist_prepare, project_bootstrap_readiness_prepare | 6,460 (L233–324) | existing bootstrap.ts, I6, I8 | Coder/Reviewer/Tester | Bootstrap readiness/admission |
| **P4** project-branch.ts | branch policy | project_branch_policy_prepare | 5,881 (L325–407) | project-utils, I8 | Coder/Reviewer/Tester | Wrong ref/retired branch/branch policy |
| **C0** checkpoint-tools.ts facade (retained) | ordered registration export | registerCheckpointTools | new small glue (not measured) | C1–C2 | Reviewer/Tester | Registry/API parity |
| **C1** checkpoint-claim.ts | claim+lease/attempt construction | checkpoint_claim_prepare | 20,488 (L1–299) | I2, I5, execution-guards | Coder/Reviewer/Tester | Lease/replay/concurrency/claim defect |
| **C2** checkpoint-verification-gate.ts | finalize verification and evaluate gate | checkpoint_verification_prepare, checkpoint_gate_evaluate | 15,046 (L300–562) | I2, I4, I5, evidence bundles | Coder/Reviewer/Tester | Tester completion, claim terminalization, gate evaluation |
| **E0** evidence-repository-tools.ts facade (retained) | ordered registration export | registerRepositoryEvidenceTools | new small glue (not measured) | E1–E3 | Reviewer/Tester | Registry/API parity |
| **E1** evidence-publish-prepare.ts | repository bundle proposal | evidence_repository_publish_prepare | 11,445 (L1–198) | I8, repo scope, probe verification | Coder/Reviewer | Publication path/manifest/size validation |
| **E2** evidence-publish-finalize.ts | readback and attestation | evidence_repository_publish_finalize | 13,328 (L199–450) | I2, I4, E1 contract | Coder/Reviewer/Tester | Publication CAS/readback or attestation defect |
| **E3** evidence-probe-verification.ts | verification on PROBE path | evidence_repository_probe_verification_prepare | 6,337 (L451–569) | I2, I4, E1 contract | Coder/Reviewer/Tester | Unverified binary probe / PROBE vs PUBLISH |
| **T0** selftest.ts (**KEEP in A initially**) | one integrated self-test endpoint | registerSelftest; CP/P fixture families; checks | **48,907** | I2–I8 via injected deps; harness-catalog and GSA1 helpers | Tester/Coder | Runtime selftest failure / integration assertions; see KEEP justification below |

**Measurement notes:** Parent-facade new glue and repeated imports are **not** included in child-size sums; these are source-region estimates only. Existing parent register* functions currently use destructured deps: any, not typed public contract interfaces. Proposed module exports/callers must be proven; do not silently change dependency injection or tool-order semantics. R2 is one small but genuine operation, not a forced one-function-per-file rule. P2 and P3 each intentionally co-locate two related tools. C2 groups verification with short gate evaluation; **do not** create a 2,168-char gate microfile.

### 2.2 WHY selftest is KEEP instead of automatic per-test splitting

selftest.ts has one registerSelftest(app,deps) entry, one substantial shared setup/fixture region and a consolidated checks/response region. Indicative original line/character ranges: 1–130 ~6,836; 131–156 ~1,883; CP6 evidence 157–386 ~7,593; CP7 retest 387–465 ~2,570; P0 access 466–516 ~1,939; P1 dispatch 517–558 ~1,890; P2 UI/goal/closure 559–771 ~6,891; **checks and final response 772–943 ~19,306**. Moving only fixture ranges into tiny files leaves the checks depending on all of them. Unless selective self-test execution/independent fixture ownership is proven, splitting could *increase* opens and cross-file tracing; no selftest semantic or selective-execution change is authorized in 2A.

### 2.3 Proposed physical layout and public facade contracts

~~~text
gsa-mcp/
  index.ts                    # unchanged exported HTTP/Edge entry; MCP composition
  [I1..I8 proposed child owners]
  run-execution-tools.ts      # exports registerRunExecutionTools exactly once
  [R1..R5 proposed owners]
  project-setup-tools.ts      # exports registerProjectSetupTools exactly once
  [P1..P4 proposed owners]
  checkpoint-tools.ts         # exports registerCheckpointTools exactly once
  [C1..C2 proposed owners]
  evidence-repository-tools.ts# exports registerRepositoryEvidenceTools exactly once
  [E1..E3 proposed owners]
  selftest.ts                 # KEEP pending evidence
  [all existing GSA1 modules unchanged]
~~~

No new runtime role, tool name, dispatch behavior, endpoint or automatically loaded skill. A strict A split proposes **22 child owners** (8+5+4+2+3) under five retained facades, plus KEEP selftest. This number is an implementation/maintenance *cost*, not a target. The A-guard alternative co-locates R1+R2 and E1+E2 when evidence shows frequent co-reading, reducing child owners to 20 and potentially reducing hop count; do not pick between them by source size alone.

## 3. Actual dependency/caller map; potential cycles and shared contracts

### 3.1 Verified source-reference edges (static, not measured model co-reading)

~~~text
Existing GSA1 leaf utilities:
  platform-utils <- project-utils <- bootstrap.ts
  planning-guards, execution-guards, record-handles, advisor-receipt,
  recovery-decisions, harness-catalog ... [already separate owners]

Proposed I-layer function-reference edges:
  I2 -> I1
  I3 -> I1 + I2 + execution-guards / RUNTIME_SKILLS data
  I4 -> I1 + I2
  I5 -> I1 + I2 + I4
  I6 -> I1 + I2 + I8 + planning-guards / z
  I7 -> I1 + I2 + recovery-decisions
  I8 -> existing project-utils/platform-utils
  I0 (composition root) -> I1..I8 + retained registration facades

Tool call/dependency injection:
  I0 -> P0 -> P1..P4 -> (I6/I8 and existing bootstrap/advisor utilities)
  I0 -> R0 -> R1..R5 -> (I2/I3/I4/I5 as operation needs)
  I0 -> C0 -> C1/C2 -> (I2/I4/I5 and execution-guards)
  I0 -> E0 -> E1/E2/E3 -> (I2/I4/I8, repository validation)
  I0 -> T0 (selftest) -> combined functions above and GSA1 helpers
~~~

The shown arrows are *source-symbol/callback dependencies*; current R/P/C/E owners are injected a broad deps object from index.ts, not actual ES imports back to index.ts. In the inspected subset there is **no observed direct static ES import cycle** between the five current large registration files and index.ts: the four tool-registration modules have no import declarations; selftest imports harness-catalog, execution-guards, platform-utils, record-handles, planning-guards. This is **not** a full repository-wide circular-import proof. A naïve future child that imports functions from index.ts would create a **new circular edge** through index.ts's import of the child; prohibit that structure. I6 -> I8 is especially easy to miss (planning preflight calls parseProjectManifest/validMemoryPath): retain the one-way order.

**Real shared contracts / co-read candidates:** namespace + execution contract (I1/I2), snapshots and Run preflight (I2/I3), bundle/attestation and checkpoint terminalization (I4/I5/C2/E2), project manifest + planning validation (I8/I6/P3), Run begin + related knowledge (R1/R2), publish prepare + finalize (E1/E2), consolidated selftest fixture + final checks (T0). For these, the source graph predicts possible co-reading **but there is no actual frequency sample**.

**API risk:** today many tool modules use deps: any. A fine split that copies this pattern could hide dependencies, create undefined callbacks or duplicate validation. A typed central interface/contract is a future design choice, not a license to refactor logic in the parity extraction. Avoid a new monolithic shared.ts or a catch-all imports barrel that makes symbols ambiguous.

### 3.2 Existing test coupling that blocks naïve extraction

- test-lab/gsa1-module-boundary.test.cjs uses static regex/AST to enforce unique extracted functions, module owner imports and the exact **58 MCP tool names/order**; it expects an entire named tool registration group in its original module.
- test-lab/runtime-logic.test.cjs reads index.ts and extracts named function declarations by AST, while also opening run-execution-tools.ts. Moved I-functions will cause test discovery failure until the test looks at their new owner.
- test-lab/reliability-cursor.test.cjs and test-lab/project-branch-policy.test.cjs similarly read index.ts and extract top-level helpers by name. project-branch-policy.test.cjs also reads project-setup-tools.ts and slices registration blocks.
- test-lab/llc60-planning-loop.test.cjs and other tests may use literal registration/source text matching. Tests and assertions must be audited on **each moved symbol**.
- .github/workflows/gsa-next-logic.yml includes Node logic tests and deno check on supabase/functions/gsa-mcp/index.ts. A source parse/check PASS alone is not semantic, auth, MCP or durable CAS parity.

Therefore the A extraction would **require test-owner adaptation** without weakening the existing assertions, plus newly explicit owner/graph tests. That is a material maintenance and test-scope cost of splitting, not a product defect today. Keep tests unchanged during this research.

## 4. BASE-2A paper simulation: four GSA-development journeys

**Universe:** an Agent is developing the GSA codebase; these are not attempts to bootstrap a Project/Job in this chat. Planner scopes at tree/ownership-index level (no assumed source open); Direct Coder modifies only a separately authorized future task; independent Reviewer reads exact diff/source; Tester inspects only needed code/tests and executes separately when capable. Source read sequences below are **hypothetical**, not host telemetry. No GSA plugin, runtime test, production deployment or CI was executed.

**Source-navigation accounting:** a file open is modeled as a *whole relevant module body* once **per Agent**, with no cross-Agent cache. Every cross-role repeated read is charged again. BASE-2A assumes the physical A split exists but, in an initially unfamiliar flow, each development role also opens its **I0 47,444-character composition facade** to locate owners. OPT-1 has a verified-by-design ownership map and error-to-symbol routing that allows that Agent to skip I0 **only when no transport/registration change is in scope**. All other module and test reads remain identical (conservative). Existing test source counted: bootstrap-checklist.test.cjs ~8,931 chars (BT); runtime-logic.test.cjs ~22,635 (RT). Existing bootstrap.ts 17,740 (B), execution-guards.ts ~2,520 (EG). T0 is full selftest.ts. No Harness/Skill content, Criteria, Plan, Project docs, MCP payload, test execution output or host token count is included; additional always-required data outside the listed reads would be added equally to both columns. A source index adds an **illustrative budget of 2,000 chars per development-role session** outside source-code chars; no file or measured 2,000-char index exists yet.

### S1 — Develop/fix GSA Bootstrap readiness

Fixture: approved change in project_bootstrap_checklist_prepare/readiness path, checking Project manifestation and NEXT planning preflight. Participants: Planner (tree/requirements, 0 source chars here), Coder, independent Reviewer, Tester. Reading trail: P3 -> existing bootstrap.ts B -> I6/I8 -> P1 for Project setup; Tester also inspects BT and integrated T0 if cross-path selftest is relevant.

| Agent | BASE-2A read IDs | BASE chars / opens | OPT-1 chars / opens |
| --- | --- | ---: | ---: |
| Coder | I0,P1,P3,I6,I8,B,BT | 121,286 / 7 | 73,842 / 6 |
| Reviewer | I0,P1,P3,I6,I8,B | 112,355 / 6 | 64,911 / 5 |
| Tester | I0,T0,P3,B,BT | 129,482 / 5 | 82,038 / 4 |
| **Total** | per-Agent reads charged separately | **363,123 / 18** | **220,791 / 15** |

Extra source on defect: P4 and project-utils if a branch-policy rejection is implicated; project-auth-tools if denied Project scope. Do **not** assume the normal bootstrap path has to open these files. Possible reread: after Tester discovers stale namespace, Coder may reopen I6 or I8; charge it to Coder again, not to a shared cache.

### S2 — Continue an approved code Task touching Run admission

Fixture: maintain run_begin task-skill/dispatch preflight; no new Job or scope approval created by this study. Participants: Planner/Orchestrator for the existing scope (0 source in this estimate), Coder, independent Reviewer, Tester. Source trail: R1 -> I3 -> I2 and EG; RT validates dispatch behavior.

| Agent | BASE-2A read IDs | BASE chars / opens | OPT-1 chars / opens |
| --- | --- | ---: | ---: |
| Coder | I0,R1,I3,I2,EG | 80,501 / 5 | 33,057 / 4 |
| Reviewer | I0,R1,I3,I2 | 77,981 / 4 | 30,537 / 3 |
| Tester | I0,RT,R1,I3 | 95,408 / 4 | 47,964 / 3 |
| **Total** | | **253,890 / 13** | **111,558 / 10** |

Additional source if goal verification/close changes: R3/R4/R5 and I4/I5; if a required skill body/mapping is actually changed, harness-catalog.ts is needed **equally on BASE and OPT** (this Group does not optimize Harness/Skill content). Possible reread: Tester failure in nextDispatchPreflightError returns Coder to I3; both models owe another I3 read if a real reopening occurs.

### S3 — Selftest failure, debug checkpoint/evidence defect, retest

Fixture: a failed checkpoint_verification_prepare for evidence attestation / terminal claim, not a fictional live failure. Participants: Coder, Reviewer, Tester. Entry: failure/test name -> C2 -> I4/I5; E2 needed for publication/attestation readback. T0 cannot safely be treated as independently runnable micro-fixtures today.

| Agent | BASE-2A read IDs | BASE chars / opens | OPT-1 chars / opens |
| --- | --- | ---: | ---: |
| Coder | I0,C2,I4,I5,T0,E2 | 150,047 / 6 | 102,603 / 5 |
| Reviewer | I0,C2,I4,I5,T0 | 136,719 / 5 | 89,275 / 4 |
| Tester | I0,T0,C2,I5,E2 | 132,552 / 5 | 85,108 / 4 |
| **Total** | | **419,318 / 16** | **276,986 / 13** |

Extra reads if root cause crosses boundaries: C1 for lease/claim, E1 for publication proposal, I2 for snapshot mismatch, evidence-bundle-tool.ts for private/backend attestation. Retest failure may require reopening C2 once (+15,046 chars / +1 read **for the affected Agent in either model**); absence of cross-session cache means this is not silently free. The potential to line-read only CP6 fixture + checks in T0 is unverified: those regions total ~26,899 vs full 48,907, but shared assertions can force wider reads.

### S4 — New GSA feature in repository evidence publish/probe path

Fixture: hypothetical additional validated publication/probe metadata field without allowing scope/authority changes. Participants: Planner/Designer for spec, Coder, Reviewer, Tester. Trail: E1 proposal -> E2 finalize -> E3 probe -> I4/I2 attestation and namespace; T0 for regression.

| Agent | BASE-2A read IDs | BASE chars / opens | OPT-1 chars / opens |
| --- | --- | ---: | ---: |
| Coder | I0,E1,E2,E3,I4,I2,T0 | 150,164 / 7 | 102,720 / 6 |
| Reviewer | I0,E1,E2,E3,I4,I2 | 101,257 / 6 | 53,813 / 5 |
| Tester | I0,T0,E2,E3,I4 | 133,511 / 5 | 86,067 / 4 |
| **Total** | | **384,932 / 18** | **242,600 / 15** |

Possible new opens: project-auth-tools for a scope bypass, I8 for repository registry, C2/I5 for downstream gate applicability. Reviewer must check E1/E2 shared contract despite a single-field feature; Tester must distinguish PROBE from PUBLISH. A failed retest may reopen E2 (+13,328 chars / 1 read) and require new readback evidence.

### 4.1 Aggregate and sensitivity (do NOT label this measured improvement)

| Fixed four-scenario, 12 development-role sessions | Source-navigation chars | File reads | Additional non-source navigation budget |
| --- | ---: | ---: | ---: |
| BASE-2A: physical A, whole I0 initially opened per role | **1,421,263** | **65** | 0 modeled |
| OPT-1: exact owner map, skip irrelevant I0 | **851,935** | **53** | 12 x 2,000 = **24,000 hypothetical index chars** |
| OPT-1 combined source + hypothetical index | **875,935** | **53 source opens + up to 12 index lookups** | Model-only |
| Difference BASE vs OPT-1, including index budget | **545,328 chars (38.4%)** | 12 fewer full source opens | Not actual tokens/latency |

**Critical sensitivity:** all 569,328 chars of modeled *source* savings are precisely 12 omitted reads of the 47,444-char I0 facade. If BASE already goes directly to an owner (search/symbol location/line-range read), **source saving is zero**, and the extra index may *increase* cost. If the 39,001-char registration function were itself physically isolated and every BASE role opened only an ~8,443-char entry file, BASE would instead be ~953,251 source chars; the same OPT with a 24,000-char index would save ~77,316 chars (~8.1%). Actual test and co-read traces, not these endpoints, must choose the forecast. BASE's whole-file reader assumption is an intentionally challenging worst-case, not typical host behavior.

**Reread accounting:** tables assume no reopen within each Agent; all Agent handoffs pay their own source reads. On a proven retest loop, append the relevant repeated module's chars and +1 open for that Agent on BASE and OPT. Handoff of an exact symbol/patch/revision *reference* can prevent a second **discovery** read but cannot stand in for Reviewer/Tester independent source verification. There is no host cross-Agent cache assumption.

## 5. Proposed post-BASE source-navigation OPTs (paper options only)

| OPT | BASE-2A -> hypothetical change | Quantitative bounded forecast | Complexity / risk |
| --- | --- | --- | --- |
| **O1. Exact source index** | Map tool/operation -> owning module/export -> direct helpers -> tests, with pinned SHA; no new runtime routing | In S1–S4 when I0 would otherwise be fully read: **1,421,263/65 -> 851,935/53 source**, plus hypothetical 24,000 index chars; if owner is already known: **no source saving** | **LOW/MEDIUM** upkeep; stale ownership map/false owner is MEDIUM |
| **O2. Task-first dependency traversal** | Open owner first; follow **actual** call references only when validation/error crosses owner | S1–S4 same conservative O1 totals; further reduction not quantified without individual file-read traces. Avoid opening C1 on C2-only defect or R5 on R1-only Task | **MEDIUM**; false omission of auth/guards is HIGH consequence |
| **O3. Symbol/API summary before implementation** | Inspect names, input/output/dep summary and exact registration contracts; expand to source only if decision needs implementation | Initial summary budget proposed <=2k chars per Agent, already included for O1 sensitivity. Saved implementation reads **UNKNOWN**; summary cannot substitute for actual code review | **MEDIUM** maintenance; stale or lossy summary MEDIUM/HIGH |
| **O4. Failure -> owner map** | Map exact tool name, error code/assertion, test failure to owning R/P/C/E/I symbol and nearby tests | In S3 could avoid I0 (the 47,444-char modeled benefit per role); no evidence of further savings. Automatic classification without exact failed assertion is unverified | **MEDIUM**; misleading error mapping HIGH consequence |
| **O5. Handoff source references, not hidden cache** | Share path, pinned SHA, changed symbols, line ranges, test names, error evidence; independently re-open true source | Removes only re-discovery overhead; **0 guaranteed source-char saving** in the conservative four-scenario table. Never count Reviewer/Tester source read as free | **LOW/MEDIUM**; stale diff/attribution or false independent verification HIGH |
| **O6. Targeted line ranges/search** | With source tools supporting exact ranges, inspect only code needed; expand when dependent closures require it | Possible but **not computable honestly** from current whole-file fixture. Example T0 CP6 fixture + complete checks ~26,899 vs 48,907 = 22,008 less **per qualifying read**; no proof those ranges suffice | **MEDIUM/HIGH**; omitted surrounding guards and shared fixtures |

This document **does not perform** R6–R8 selective Agent/Harness loading. O1–O6 concern navigation of development source only and must be evaluated after source extraction if adopted. Forecasts overlap; **do not sum savings from O1–O6**. No conversion to ChatGPT host tokens is justified.

## 6. Maintenance complexity, alternatives and adversarial review

| Candidate / aspect | Likely benefit | Maintenance / validation cost | Risk |
| --- | --- | --- | --- |
| **A strict fine-grained, 22 owners** | Precise operation ownership and focused source reads | 22 new child modules, five preserved facades, many extra import/export edges; 58-registration inventory and AST-based tests need adaptation | **HIGH** for parity/test discovery; MEDIUM for navigation hops |
| **A-guard: co-locate R1+R2, E1+E2** | Two fewer files and strong lifecycle coupling | Read somewhat larger module for focused operations; lower cross-file publish/run tracing | **MEDIUM**; reasonable candidate, not proven winner |
| **KEEP selftest.ts** | Preserves atomic fixtures/response and existing selftest route | Large read for defect investigation | **LOW** mutation risk; potentially HIGH navigation cost if fixture truly separable |
| **KEEP current source** | No cycles, test churn, or registration changes | Large modules, source-navigation may be expensive when whole-file opens occur | **LOW** parity risk; cost UNKNOWN |
| **Extract only high-confidence I4/I5 or P3 owner closure** | Smaller first proof of value and test adjustment | Benefits less than wholesale A; manageable blast radius | **MEDIUM**, dependent on affected tests |
| Shared typed contracts instead of deps:any | Clearer dependencies, static checking | Cross-cutting semantic refactor beyond pure extraction; not safe to mix into first parity step | **HIGH** combined with physical extraction |

**Review challenges and findings (single-session technical critique; NOT independent Reviewer PASS):**

1. **Too many modules?** YES, potentially. Even a 3,367-char R2 carries a real tool, yet a typical Run admission + relationship workflow may always require R1+R2. E1+E2 share publication contract. A strict 22-module design is a candidate, not a recommendation to code all 22 at once.
2. **More opens?** YES. For a fully traced lifecycle, fine-grained owners plus facades can increase opens compared with one cohesive registration module. Source size alone cannot outweigh tool latency, rediscovery, tests or cross-ownership edits.
3. **Cross-module bugs?** In a C1/C2/I4/I5/E1/E2 failure, one owner per operation gives fewer bytes on isolated paths but more hops to reconstruct the whole transaction. Model both partial and whole-lifecycle cases.
4. **Circular imports?** No direct cycle identified in inspected GSA3 registration imports. Extracted modules importing index.ts would introduce new cycles; ban that design. Preserve direction leaf -> shared contract/utility; facade -> leaf. I6's I8 dependency must be explicit.
5. **Behavior/API/tool order?** High risk from tests assuming exact file ownership, from broad deps:any, and from changed registration sequencing. The static inventory requires 58 exact names and order; a syntactically correct extracted runtime does not prove MCP schema, default/error/fallback or authorization parity.
6. **Independent role requirements?** Reviewer must independently examine changed source/diff, Tester must exercise actual tests/evidence, CR only when separately Human-invoked. A symbol summary/handoff cannot silently certify code quality or test PASS.
7. **Alternative root cause:** poor initial symbol search rather than poor physical partitioning may explain the cost; if direct file/line lookup is already used, O1 can cost more than it saves. Collect actual navigation traces first.

**Disposition:** **A fine-grained is CONDITIONALLY FEASIBLE as a split research option, NOT selected for implementation**. Prioritize the I-layer ownership DAG and bounded Run/Project/Checkpoint candidates; retain GSA1 modules and KEEP selftest pending evidence. A-guard and KEEP are live comparators. No conclusion about a competing Chat B option is made.

## 7. Reproducibility, parity plan and unknowns

**Reproduce static inspection:** fetch source at the exact SHA listed above; inspect index.ts top-level function starts and register* calls; inspect each server.registerTool name in R/P/C/E modules; compare test-lab/gsa1-tool-name-inventory.json and the source tests named in §3.2. Chars derive from whole source and line slices; prospective facade/glue chars and project-plan/Harness payload remain excluded. This is paper analysis, not execution of code or CT-00.

**Future, separately authorized extraction parity checklist:**

- Snapshot 58 tool names, **order**, input/output zod schemas, auth/denied/unknown cases, structuredContent+text fallback and all register* exports/calls.
- Snapshot exact required Run/Job/Project, NEXT/V2_STABLE namespace and evidence behaviors, Git CAS/readback, checkpoint claim and terminal applicability, no cross-project scope escape.
- Update source-location-dependent tests to new owner using exact symbols **without deleting negative tests**; retain gsa1-module-boundary, runtime-logic, project-branch-policy, reliability-cursor, bootstrap-checklist and GSA3 tool/skill payload coverage.
- Validate parse/types (deno check index entry), Node test suite in .github/workflows/gsa-next-logic.yml, all relevant selftest fixture families and tool registration parity; ensure no new import cycles and no runtime handler duplication.
- Distinguish MODEL_ONLY test, source-executed test, live MCP/auth/host readback and parity observations. No test PASS is claimed here.
- Track navigation for at least S1–S4 using exact opened paths, ranges, reopens, role/session boundaries, extra tool calls and wall-clock separately, then compare A/A-guard/KEEP with the same fixtures. Determine whether index lookup pays back its cost.

**OPEN / UNVERIFIED:** real file-read patterns and latency; role-local search vs whole-file reads; future module source sizes including imports; test-safe extraction mechanics for AST/regex-based suites; whether T0 fixtures can ever be independently read/run; true import graph after refactor; system-level 58-tool dispatch parity; effect on host tokens; accuracy of any generated symbol summaries. No claim of independent reviewer approval, build success, new Job, runtime write or deploy.

**Next authorized research step only:** run an independent source-aware challenge of A's ownership graph and a symmetric A-vs-other-design/KEEP paper comparison without reading the other chat's report here. Any physical extraction or R6+ research requires its separate existing-governance authorization and parity checkpoint.
