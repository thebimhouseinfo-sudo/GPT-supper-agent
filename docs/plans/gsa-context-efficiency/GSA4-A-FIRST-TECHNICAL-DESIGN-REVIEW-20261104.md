# GSA4 — Technical Design Review of A-First Detail Plan and Proposal

**Date:** 2026-11-04  
**Status:** **CHANGES_REQUIRED — DESIGN DOCUMENT REVIEW**; selected architecture direction remains **A physical responsibility modules + B logical work-context recipe**.  
**Review method:** Direct Agent, source-aware static technical challenge, evidence-backed inspection; **NOT** a separately activated GSA Reviewer, independent source-blind simulation, TypeScript execution, CI PASS, Host test or production approval.  
**Repository:** `thebimhouseinfo-sudo/GPT-supper-agent`; development branch `upgrade/gsa-context-efficiency`; GSA3 behavior baseline `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`.  
**Reviewed exact document blobs:** [GSA4-DETAIL-PLAN.md](./GSA4-DETAIL-PLAN.md) `52edc5dbe00f35e400856ae5141b3415e3cd1c8b` and [GSA4-TECHNICAL-PROPOSAL.md](./GSA4-TECHNICAL-PROPOSAL.md) `aa900b0797a9fc425f32cd0e9c1c774be5dc0381`.  
**Other comparison:** [G1A](./GSA4-G1-A-RESEARCH.md), [G2A](./GSA4-G2-A-RESEARCH.md), [six-report cross-review](./GSA4-SIX-REPORT-CROSS-REVIEW-20261104.md), [A-first simulated options](./GSA4-A-BASE-DEVELOPMENT-PATH-SIMULATION-20261104.md), [G3 Agent/Job/Task](./GSA4-G3-AGENT-JOB-TASK-CONTEXT-RESEARCH.md), canonical [GSA4 Research Plan](./GSA4-RESEARCH-PLAN.md).

## 1. Executive verdict

**Keep the chosen A-first architecture.** Its physical boundaries could provide smaller source-reading and debugging scopes while B-style context recipes can later select relevant leaves without physically remerging files. The Plan correctly separates **A0 parity-only extraction** from **post-parity A1–A6 optimization**, keeps selftest initially intact, preserves existing Role and Human authority, and uses ASK/READ_MORE/STOP rather than treating a short context as sufficient by definition.

**Do not yet label the two documents READY_FOR_A0.** Four **HIGH** implementation-design issues and three **MEDIUM** comparison/quality issues are outstanding. They are mostly source-owner migration, test harness, runtime closure and CI execution specifics; they do **not** require returning to physical B.

| ID | Severity | Finding | Affected milestone | State |
| --- | --- | --- | --- | --- |
| **TR-01** | **HIGH** | Harness test runners assume monolithic self-contained catalog; re-export-only facade invalidates real tests and VM import execution | G4-P2, A0.1 | OPEN |
| **TR-02** | **HIGH** | Tool-name/order guard expects registerTool bodies in four original parent modules; moving handlers to leaves breaks its registered-tool proof | G4-P2, A0.3 | OPEN |
| **TR-03** | **HIGH** | Proposed symbol/owner DAG lacks a complete variable-capture and injection contract for safe physical movement | G4-P2, A0.2/A0.3 | OPEN |
| **TR-04** | **HIGH** | Existing CI workflow does **not** auto-run on direct pushes to `upgrade/gsa-context-efficiency` | G4-P1, all A0 | OPEN |
| **TR-05** | MEDIUM | Exact A0 golden fixture matrix needs explicit test-adapter/negative-control treatment at **every** atomic extraction commit | G4-P1, A0.1–A0.4 | OPEN |
| **TR-06** | MEDIUM | Repairability objective lacks a measured **pre-split GSA3 vs A0** comparator, and an architecture-neutral bug-fix fixture set | G4-M, A1/A3 | OPEN |
| **TR-07** | MEDIUM | A2 logical context selectors need mapping to **currently existing** Job/Task/Knowledge fields and invalidation triggers before any new schema/loader | G4-O2, G4-G3 | OPEN |

## 2. Evidence and correction for each finding

### TR-01 — HIGH: G1 single-file Harness test execution is not A0-ready

**Evidence:**
- `test-lab/gsa2-harness-dedup.test.cjs` L12–24 reads **only** `harness-catalog.ts`, transpiles it to CommonJS and executes the resulting module in a `vm.runInNewContext` **without an import-aware `require`**. After the proposed facade starts importing leaf roles/skills, this runner no longer runs, even if application imports work.
- `test-lab/gsa3-tool-skill-payload.test.cjs` L11–29 uses the same standalone one-file VM mechanism for catalog and Tool assertions.
- `test-lab/llc59-autonomy-harness.test.cjs` L10–30 and `test-lab/llc60-planning-loop.test.cjs` L11–13/L48–61 extract `BASE_AGENT_HARNESS`, `ROLE_HARNESSES`, `RUNTIME_SKILLS` as AST declarations **in the facade file**.
- `test-lab/runtime-logic.test.cjs` L249–283 slices Planner/Advisor contract by adjacent textual entry ordering; L336–347 parses literal `RUNTIME_SKILLS` blocks and verifies `load_skill` enum consistency.

**Why this is a blocker:** the Plan's general “retarget AST/regex lookup” statement (`3 L65) and Package H's “run relevant tests” do not describe the required **module-aware evaluator and source-bound oracle migration**. A refactor that removes these tests or substitutes a hand-written mock for actual loaded source would silently weaken regressions.

**Required design correction:** in G4-P2, inventory all such tests; introduce/reuse a **source-bound module-aware test seam** capable of resolving the catalog's real exported values and keeping exact string, Role/Skill map, unknown-role and negative mutation oracles. Where a test intentionally validates source text/ownership, update it to inspect the actual owning leaf(s), not flatten source into a fake catalog. Keep `gsa2-harness-dedup`, `gsa3-tool-skill-payload`, `llc59`, `llc60`, `runtime-logic` and scope tests in the same atomic Package H patch. The before/after golden values must match the frozen original at the exact target ref.

**Close when:** import-aware test execution and all old positive/negative assertions run against actual A catalog code; a deliberate mutation to a mandatory Role or Skill instruction still turns the appropriate oracle RED.

### TR-02 — HIGH: MCP 58-tool invariant is tied to the old physical parent files

**Evidence:** `test-lab/gsa1-module-boundary.test.cjs` L58–112 reconstructs the 58-name inventory by matching `server.registerTool` text directly from `index.ts` and from **specified parent** `evidence-repository-tools.ts`, `checkpoint-tools.ts`, `run-execution-tools.ts`, `project-setup-tools.ts`, then asserts name, order and the one-time `register...Tools` facade call. It also requires imports from the exact old module paths.

**Why this is a blocker:** if A0.3 extracts registered tool bodies into R/P/C/E leaves as planned, regex extraction from a parent file may return no registrations. A “fix” that just deletes the ownership assertion would make the test pass while losing its invariant. The proposed facade convention itself is sound, but requires an **explicit registration-proof design**.

**Required correction:** preserve parent registration exported entrypoints and insertion order; teach the test to traverse each facade's ordered leaf registration call graph and independently collect the actual `registerTool` names/schema/order. Compare to frozen 58-name inventory (reverify at chosen source ref), run negative tests for duplicate/missing/reordered registrations, and confirm runtime registry observation when callable. Keep schema and `structuredContent`/text fallback coverage.

**Close when:** the test still fails on missing, duplicate or reordered tools *after* the R/P/C/E extraction and an actual source-executed tool inventory equals the frozen reference.

### TR-03 — HIGH: module DAG is a useful sketch, not an import-ready closure contract

**Evidence:** `index.ts` L1937–1996 defines `validateRepositoryProbeSnapshot` **inside `createServer`**, referencing snapshot validators, path/namespace/runtime contract and then passed to repository evidence registration. `index.ts` L391–413's `resolveRequiredTaskSkills` reads the imported `RUNTIME_SKILLS` catalog; I6 planning validation depends on I8 Project manifest/scope. The proposed Dag in Proposal `4.2 L104–124 shows logical ownership and flags closure risk, but is not a complete **symbol by symbol free-variable / shared state** table. The file also defines schema constants and runtime surfaces at top level. Tool modules receive wide `deps: any` dependency objects.

**Risk:** converting nested functions or mutating registration order at the same time as moving source may change captured request state, default namespace, auth, data validation or error types despite a passing TypeScript check.

**Required correction:** freeze a complete source-derived table before moving a symbol:
`Symbol | current owner/SHA/line | all free vars & captured closure values | runtime injection source | new owner | direct callers | imported types | test oracle | keep-in-facade condition`.
For `createServer`-captured functions that cannot prove safe identity/injection, **KEEP IN PARENT** during A0 and mark the deferred owner, rather than declaring the I/E leaf extraction complete. Test request-scoped auth and cross-namespace/unknown-write negative cases. Preserve direction facade→leaf; leaf must not import parent.

**Close when:** every moved symbol has a complete dependency/closure witness and no new circular import, stale closure, changed registration default or shadow validator.

### TR-04 — HIGH: CI execution trigger mismatch for the working branch

**Evidence:** `.github/workflows/gsa-next-logic.yml` declares `push.branches: [main]`, `pull_request`, and `workflow_dispatch`. Direct source commits to `upgrade/gsa-context-efficiency` **do not automatically start the workflow via push**. The Plan asks to run relevant Node logic tests and Deno checks but does not specify the exact CI trigger/branch/revision capture.

**Required correction:** G4-P1 defines the executable path: run **explicit workflow_dispatch at exact branch/ref** when permitted, open a matching PR for CI, or execute the exact Node/Deno commands in a reproducible compatible environment. Read back the run's actual ref/commit, status, steps, logs and results before claiming it PASSED. If none is available, label `SOURCE_EXECUTED_UNVERIFIED`, not CI PASS. Do not modify CI trigger behavior merely to manufacture a green run.

**Close when:** the reviewable build/test procedure runs against the **exact A0 candidate SHA**, not default/main or an older run, and real pass/fail/unknown results are recorded.

### TR-05 — MEDIUM: separate actual text parity from behavioral/host parity

**Evidence:** Detail Plan `3/`4 defines eight Role outputs, 11 Skills, 58 MCP tools, Direct/JOB/NEXT and safety negatives. Proposal `4.3 enumerates authorization/transport/cursor/evidence behavior. This is conceptually correct, but no executable golden fixture paths or per-package test ownership are frozen yet, and source-bound test adapters are not explicitly scheduled into Package H and T.

**Correction:** G4-P1 produces a golden manifest with exact file/source SHA, fixture ID, deterministic text inputs/outputs, dynamic field normalization rules *only where justified*, expected error branches, invocation mode and target runner. Every A0 commit includes its updated source-owner test loader, preserved negative assertions, executed results and revert boundary. A0.4 is a **cross-package integration parity** checkpoint, not the first time source tests are run. Test environments unavailable are explicitly UNVERIFIED.

### TR-06 — MEDIUM: bug-repair objective should compare A against the old source as well as A1

**Evidence:** A-first simulation identifies source chars and potential fewer facade reads, but explicitly admits **zero observed repair-iteration reduction**. Detail Plan's G4-M records wrong-file opens/repair iterations, yet focuses A0→A1→A2/A3. Without a comparable **pre-split GSA3/KEEP** path, it cannot demonstrate that physical A helped maintenance.

**Correction:** after A0 parity, run the **same architecture-neutral, behavior-frozen bug and negative fixtures** on immutable GSA3 and A0 source (no destructive code changes to main; bounded synthetic or isolated test branch); then test A1-only vs A1+A2 vs A1+A2+A3 on the same defects. Record time to real root owner, total source+calls, edits required, independently observed retest and regressions. The compare uses comparable environment/tool capability and discloses overhead. KEEP wins a metric when A adds file hopping without better outcomes.

### TR-07 — MEDIUM: logic context recipes have undefined source-field availability

**Evidence:** Group 3 research maps actual Role × Job × Task × Phase, including Coder AutoLISP/backend/frontend/bug contexts. Proposal `5.2 calls its recipe fields **conceptual** rather than an approved persisted schema. That is appropriate in the research stage; implementation cannot simply assume all fields are present or current.

**Correction:** before A2 implementation, map each recipe field to an *existing* canonical source (`Job Task, Run, approved Criteria, Project Skill/Knowledge addin`) and a precise lookup or absence condition; identify only actual metadata gaps. Verify Task position, phase and approval from current durable state, not caller declarations. Define missing-info detector and ASK/READ_MORE/STOP owner. Never convert a source-reference packet into execution authority or let Reviewer/Tester trust a Coder's private snippet as an independent oracle.

## 3. Safety, architecture and performance review

**What is supported by source/static evidence:**

- Eight Role and eleven Skill catalog and current keyed loading are real; splitting their physical file does **not** reduce delivered runtime Harness+Skill bytes.
- Existing GSA1-separated modules and direct public parent registration APIs can remain stable in an A-first extraction *if* tests and import wiring are correctly migrated.
- Group 2's `selftest.ts` is tightly coupled and appropriately **KEEP** in the first parity pass; a tiny textual fixture is not automatically an independent test module.
- A-first option is consistent with user's responsibility-localized repair goal, but correctness is not guaranteed by file size.

**What remains unproven:**

- Reduced time to root cause or fewer repair/retest rounds for A vs GSA3 (not measured).
- Actual Host token cost, network calls and end-to-end latency for A1/A2/A3 (not measured).
- Safe Shared mandatory rule filtering (A4's reported 24.84% conditional payload forecast is paper only, **0 proven safe**).
- Whether the original frozen SIM4 set is truly source-blind (it is not established).

**Explicit non-issues / already handled correctly:** no new Agent Roles; no automatic Human gate on ordinary review; A0 is parity-only; A4/A5/A6 wait until parity; Knowledge/Criteria remain task-relevant rather than forbidden by Role title; user approval remains outside model tasks; source owner map is not a permission authority.

## 4. Required document revision checklist before A0 implementation design is marked READY

- [ ] Add Package H-specific import-aware test migration and negative-mutation obligations for GSA2/GSA3/LLC59/LLC60/Runtime Logic suites; preserve all old oracles.
- [ ] Add Package T-specific **ordered cross-leaf registration test** and 58-tool actual registry comparison; do not delete previous coverage.
- [ ] Freeze a symbol-level captured dependency/injection ledger, including `createServer` nested function keep/move decision and exact test owners.
- [ ] State how Node/Deno CI runs on this branch and how the exact tested commit/ref is verified.
- [ ] Pin golden fixture files/expected outputs and make tests run with **each** reversible A0 package, not only final A0.4.
- [ ] Compare real bug localization/repair quality against GSA3/KEEP after parity, not only A0/A1 source chars.
- [ ] In A2, resolve context recipe fields to actual canonical Project/Job/Task/Knowledge records and missing-info ASK/STOP cases.

**Approval disposition:** **DIRECTION APPROVED BY HUMAN; TECHNICAL DESIGN CHANGES REQUIRED; A0 CODE NOT REVIEW-READY AS WRITTEN.** This is a **source-static technical review**, not an independently executed GSA Reviewer outcome. No Criteria/parent Plan, six A/B reports, GSA code, source/test suite, deployment or original reviewed plans were modified by this report. Existing development-authority rules apply; no additional invented Human approval layer.
