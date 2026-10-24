# GSA Context Efficiency — Technical Design Review Loop (RL)

## GOAL

Review the **current** GSA1–GSA4 Technical Detail Proposal **before application coding**, challenge the proposed module cohesion and coupling against the real monolithic source, repair findings through Planner revisions, and re-review until a defensible **design-document PASS** or a genuine blocker. Do not confuse design review with actual runtime/host verification or measured context savings.

**Branch:** `upgrade/gsa-context-efficiency` (no merge/deploy).
**Current reviewed proposal:** `docs/plans/gsa-context-efficiency/TECHNICAL-DETAIL-PROPOSAL.md` blob `be5e6f86fe8881cbcd6634dfc1c6bedf3ae0517c`.
**Implementation source truth:** `supabase/functions/gsa-mcp/index.ts` blob `448355e9a129db45d836c0f86915396fb060514c`.
**Related plan:** `docs/plans/gsa-context-efficiency/DETAIL-PLAN.md`.
**Review authority:** Read-only GSA `start_direct_agent(role=reviewer,mode=DIRECT_AGENT)` was invoked for the review target and re-review. Direct Agent is **ephemeral**: this record is *not* a persisted `plan_review_record` Verification, attributed Job Run, source CI PASS or production acceptance. The following findings are based on explicit source checks and document-level review.

## RL Cycle 1 — CHANGES_REQUIRED

The original proposal preferred cohesive modules over a monolith or context-only PREP. It was **not** yet a defensible complete technical grouping.

| Finding | Source evidence | Required correction | Result |
| --- | --- | --- | --- |
| RL-01 Missing helper ownership | 55 MCP tool names assigned, but monolith has **98** top-level functions in addition to registrations | Map every top-level function to exactly one proposed owner; identify shared ones | **FIXED**: all 98 mapped in B0a |
| RL-02 Unresolved shared contract cycles | `recordNextMemoryNamespace` calls `resolveExecutionContract`, while Execution calls record helpers; `checkpointVerificationApplicable` calls evidence validator, while Evidence validators need execution contract | Make a lower-level, cohesive record/validation module with one-way imports | **FIXED**: proposed `records.ts`; shared contract, path, snapshot, attestation validators |
| RL-03 Hidden registered-handler cycles | `authorize_project_scope → projectBootstrapExecutionError` and `project_setup_prepare → parseProjectManifest`; `evidence_repository_publish_prepare → invalidExecutionContract` and `run_complete → validateTesterEvidence*` | Review actual handler callbacks, not only top-level pure functions; join related Project/Bootstrap and relocate shared validators | **FIXED**: **merge Project+Bootstrap into `project.ts`** (14 tools, 21 functions); use `records.ts` for pure evidence/contract validators |
| RL-04 Constant/schema ownership missing | Source declares **28 uppercase top-level constants/schemas** | Assign each to a proposed owner and preserve initialization/type dependencies | **FIXED**: all 28 mapped, with type/initializer AST check explicitly required in implementation |
| RL-05 Entrypoint still not truly thin | `createServer(req)` contains 55 tool registrations, and `/selftest` callback spans ~932 lines | Keep `index.ts` as composition root, move cohesive registrations and isolate selftest without creating new state | **FIXED in design**: `register…Tools(server,req)` proposals and `diagnostics.ts` with one-way dependencies |
| RL-06 Tool listing/order risk | Group-based registration can change the original interleaved `server.registerTool` order | Capture public tool list/order/schema/auth/annotations as parity evidence; preserve order where necessary | **FIXED in acceptance** |
| RL-07 Wrong acceptance metric | Fewer lines/file does not prove lower AI read time or token usage | Treat GSA1 as required after functional parity, measure real paired Job Pack read/call cost separately from payload | **FIXED** |
| RL-08 Scope/authority | Current Criteria is narrower and research-first; branch-ref delete and separate optimized GSA runtime not yet observed | Keep these explicit conditions rather than silently approving code/deploy or pretending two Git branches execute two different MCP versions | **RECORDED**; execution capability remains **UNVERIFIED**, not a design-PASS claim |

**First verdict:** **CHANGES_REQUIRED**, justified by RL-01 through RL-06. Planner revised the same proposal on the dev branch; no application source files were created/edited.

## RL Cycle 2 — Source-checked re-review

### Actual coverage checks

| Scope | Source count | Proposal ownership | Review result |
| --- | ---: | ---: | --- |
| `server.registerTool` names | **55** | **55 unique**, no omissions/duplicates | **PASS** |
| Top-level `function`/`async function` declarations | **98** | **98 unique**, no omissions/duplicates | **PASS** |
| Named top-level uppercase constants/schemas | **28** | **28 unique**, no omissions/duplicates | **PASS** |
| Direct cross-owner function calls and 55 registered-handler references | Source-text pattern scan on pinned `index.ts` | **No reciprocal module dependency pair** after re-grouping Project+Bootstrap and Records validators | **PASS for this checked surface only**, not TS import execution or typed closure graph |
| HTTP entrypoints, diagnostic and public tool contracts | `createServer` + Hono `/selftest`, `/health`, OAuth, `/mcp` | Entrypoint, diagnostics, registration/negative-route acceptance documented | **PASS as design coverage; execution unverified** |

### Architecture alternatives and selected design

- **A: Retain the monolith:** lowest short-term implementation risk, but poor development read/change boundary for new Bootstrap work.
- **B: Extract only Harness/Skills:** least risky extraction but leaves most of the 9,777-line root and registration callbacks unchanged, therefore not sufficient for the user's actual navigation goal.
- **C: Review-and-extract cohesive domains:** **selected**. One root entrypoint, domain-owned registrations, a genuinely shared `records.ts` for durable path/contract/attestation primitives, combined `project.ts` for Project+Bootstrap, and isolated diagnostics. This is not a mandatory one-function-per-file layout.

**Why one combined Project+Bootstrap module:** the actual source **contains reciprocal calls** between these two proposed groups. Combining them improves functional cohesion and removes a proposed import cycle instead of erecting another abstract interface to keep a folder division that looked good on paper.

**Why `records.ts`:** durable namespace, path, snapshot and execution-contract checks are called from Planning, Execution, Evidence and browser tools. A shared lower-level module of 28 related functions removes cycles and limits repeated searching; it must not become a catch-all utility module.

**Bounded remaining implementation checks:** typed value/type imports, initialization order, Zod reference dependencies, callback captures of `req`/`server`, exact sequence and public schema of 55 registrations, selftest output parity, OAuth/authorization/negative controls, imported module typechecking, source-bound AST test repairs without weakened assertions, isolated MCP staging behavior, and Git branch-ref delete/readback tool availability. These require implementation/runtime evidence; pretending to have passed them now would be incorrect.

### GSA1–GSA4 feasibility

- **GSA1:** Mandatory source modularization; after **functional parity** it remains the architecture foundation even if source-navigation/context measurements are temporarily worse. A functional/security regression is fixed before promoting the baseline, not accepted under mandatory KEEP.
- **GSA2:** Only proven *delivered* Harness duplication is a candidate; startup and role entrypoints can require their own independent policy text.
- **GSA3:** Selectively reduce proven redundant GSA-owned Tool/Skill payload; `get_skill_catalog` already provides summary descriptions and `load_skill` loads skill bodies.
- **GSA4:** Only try scoped Role/Task/Phase selection with a verified caller/input. `get_agent_harness` currently takes only `role` and `mode`; no new fake task/phase state.
- Later local merges/splits are permissible based on actual read/co-change evidence. **Real efficiency is measured during safe, matched Bootstrap Job runs, not awarded by the Reviewer based on modular-looking source.**

## RL Final Verdict — PASS (Technical Proposal design scope)

**PASS** for the **technical design/plan proposal and source-covered ownership** at the pinned revision. The previous review defects are addressed without introducing a new control plane, additional governance gate, fabricated context savings, or a separate PREP milestone.

**NOT PASSED / not attempted:** GSA1 implementation, exact TypeScript import graph after moving files, hosted CI, production/staging MCP execution, runtime behavioral parity, real context measurements, creating/deleting the two auxiliary comparison branches, and release.

**Scope boundary:** Current approved Criteria's research-first language and newly requested broader functional upgrade still require the normal Human/Criteria alignment before *implementation*, not a fictitious re-review of this proposal. This document is an **ephemeral Direct Agent + source-grounded document review** and does not forge a durable GSA Job Review receipt.

**Next recommended handoff:** Planner can derive the GSA1 module-migration Tasks/Milestone from the reviewed file/function matrix and acceptance, then implementation remains pending explicit authority. The tool meter precedes live A/B. `main` and deployed GSA remain unaffected.
