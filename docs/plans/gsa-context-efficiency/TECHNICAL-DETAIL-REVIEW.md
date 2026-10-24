# GSA1–GSA4 — Technical Design Review (Current)

## Review target and status

**Review target:** `TECHNICAL-DETAIL-PROPOSAL.md` blob `73d88d134104886a5d4c16dae70e7c2535f75f33`, based on actual `gsa-mcp/index.ts` blob `448355e9a129db45d836c0f86915396fb060514c`.

**Verdict: DESIGN DIRECTION PASS; SOURCE-EXTRACTION IMPLEMENTATION NOT YET VERIFIED.** The proposal is coherent enough to serve as the GSA1 implementation design after the remaining exact import/caller verification, and corrects the prior phase definition. This is an **author-side source-grounded review**, not an attributed independent GSA Reviewer Run, not a real runtime/CI PASS, and not approval to write application source. Efficiency metrics will come **only from real paired Job Pack work**.

**Supersession:** This review replaces prior review notes that treated context-only PREP as a separate prerequisite and GSA1 as Harness optimization. Git history retains the older review. Current sequencing is **meter → mandatory GSA1 whole-source modularization → reversible GSA2 harness → GSA3 tool/skill → GSA4 role/task/phase**.

## 1. Code/source-level validation performed

| Review question | Observed evidence | Conclusion |
| --- | --- | --- |
| Is `index.ts` really overburdened? | 9,777 lines; `createServer(req)` at ~3446; **55** interleaved `server.registerTool` entries; `/selftest` alone ~932 lines | **PASS**: thin entrypoint + cohesive domain registration is a justified target, not a cosmetic split |
| Is the proposed file grouping complete? | Proposal B0 lists every one of the 55 observed tool names **exactly once**; groups 8+10+4+11+12+4+4+2=55 | **PASS for tool-name ownership only**. Exact helper/type import graph still needs mechanical source inspection before each move |
| Are proposed module boundaries cohesive? | GSA1 review relocated `authorize_project_scope` to project scope owner, `stopchat_handoff_prepare` to Run/cursor, `relationship_knowledge_prepare` to Project knowledge | **IMPROVED**: less unrelated cross-file navigation; source call graph still authoritative |
| Are tiny modules being manufactured? | Eight domain tool owners; browser only two tools but carries an independent external bridge/credential boundary; optional `contracts.ts` only if a real dependency cycle needs it | **PASS conditional**: small browser file is justified by distinct trust boundary. Avoid splitting every handler/helper into its own file |
| Are unrelated concepts still grouped? | `platform.ts` mixes CLI/help and auth/config; `project.ts` includes a Project knowledge tool; `planning.ts` includes critic review | **WATCH**: do not split by names alone; review co-read/co-change patterns and caller traces. Further split platform only if routine work shows distinct navigation/trust cost; merge tightly coupled subparts where needed |
| Is root still too large after grouping? | `/selftest` ~932 lines remains if only `createServer` tools move | **CORRECTED**: proposal now includes `diagnostics.ts` for selftest, with one-way helper imports; ensure selftest remains fully equivalent |
| Would modularization break source-bound tests? | Existing tests AST-extract declarations and registration callbacks from `index.ts` | **RISK IDENTIFIED**: test must follow real extracted modules without weakening original assertions or claiming green by copying fixtures |
| Would imports/regression be free? | Tool callbacks close over `req` and rely on shared schemas, role/Job helpers, auth and results | **NOT PROVEN**: do not invent a circular `index` import, giant deps bag or new control plane to force an artificial folder plan |
| Does GSA2–GSA4 actually introduce new behavior? | `get_skill_catalog` already metadata-only; `load_skill` already on demand; `renderHarness(role)` already role-specific; `get_agent_harness` lacks task/phase input | **PASS design boundary**: avoid repeating existing features; GSA4 NO_BUILD if trusted task/phase selection isn't feasible |

## 2. Three technical alternatives reviewed

| Alternative | Benefits | Problems | Verdict |
| --- | --- | --- | --- |
| **A. Keep monolith + rely on search** | Lowest short-term migration risk | 9.8k-line shared edit/read surface continues; weak ownership/navigation for forthcoming Bootstrap work | Not preferred for GSA1 foundation |
| **B. Extract context only** | Safest narrow refactor; facilitates Harness CX | 55 tool callbacks, Project/Job/Run and diagnostic logic remain in huge root; misses user's primary source-navigation goal | Insufficient as complete GSA1 |
| **C. Cohesive domain modules, thin entrypoint** | Code/registration/decision logic for a working domain can be understood together; source navigation can be bounded | Largest refactor risk, particularly cross-domain helpers, callback closures and AST-test migration | **Preferred**, subject to exact dependency/call-path verification and incremental behavioral parity |

**Important:** Preferred grouping is **not file-count-maximization**. The real design criterion is *smallest coherent set of files a Coder must read to understand/edit/test one professional function*. Merge functions that form one unit; separate independent trust/ownership boundaries. A module may be large if cohesive; do not fragment it merely to meet a line quota.

## 3. Findings and corrective conditions

| ID | Priority | Finding / decision | Required action **inside the existing GSA1 technical workflow** |
| --- | --- | --- | --- |
| REV-01 | HIGH | Formal source grouping must account for **all helpers/types, not just 55 tool names** | Before moving each module, derive actual input/output/callers/constants/closure captures, identify its owner and noncyclic imports. Adjust module matrix **before writing affected code** if it reveals a better grouping; Reviewer rechecks the revised proposal. Do not use wrappers to hide unexplained dependencies |
| REV-02 | HIGH | Thin entrypoint is inconsistent with an inline ~932-line selftest | Extract entire selftest **only if** equivalent external output and import graph can be maintained without a large cycle; `diagnostics.ts` is allowed to consume other domains **one-way**. Otherwise document a bounded interim exception and a concrete migration within GSA1 rather than falsely claiming root is thin |
| REV-03 | HIGH | Behavioral parity must not be replaced by static source-string assertions | For each move run exact Deno typecheck, relevant Node tests, 55-tool name/schema comparison, authorization/negative path, role/skills, Job/Run/cursor and `/health`/`/selftest`/`/mcp` checks; isolated hosted test is required for actual MCP behavior claims. Do not change business logic in GSA1 |
| REV-04 | MEDIUM | GSA1's KEEP rule differs from optional CX candidates | Mandatory KEEP **after correct functionality** even if observed navigation/context cost is worse; actual measurements remain in report to inform later module consolidation. GSA2–GSA4 individually KEEP/REVERT against latest retained baseline. Rejection of functional regression is not a context REVERT |
| REV-05 | MEDIUM | Repeated file reads could increase after extraction | Add **per real Job** opened-files, bytes/source text read, search count, read-together hops, reread attempts and QA quality to the simple meter. Do not mark theoretical token wins. Review later consolidation only on observed co-change/navigation, not aesthetics |
| REV-06 | MEDIUM | Tool/skill and phase context candidates could duplicate features already implemented | GSA2 restricts to proven repeated harness delivery, GSA3 to excess tool/skill result content, GSA4 to trusted role/task/phase inputs or **NO_BUILD**; do not introduce redundant global context managers |
| REV-07 | EXECUTION CAPABILITY UNVERIFIED | Two auxiliary feature-result branches and candidate runtime are different entities; current toolset does not evidence branch-ref deletion or active source-pinned candidate MCP | Before claiming paired-run/cleanup PASS, verify real isolated GSA runtime, exact source SHA and **branch-ref delete + readback** via supported action. No `delete_file` substitute; not a reason to add a third branch or redefine the code design |

## 4. Final reviewed proposal direction

**GSA1 mandatory, no separate PREP:**
```text
index.ts                         ← entrypoint, imports and service/tool/route assembly only
├── platform.ts                  ← auth/config/CLI/permissions (test cohesion)
├── project.ts                   ← project manifest/scope/knowledge and tools
├── bootstrap.ts                 ← Criteria/Advisor/Bootstrap rules and tools
├── planning.ts                  ← Job/plan change/review and tools
├── execution.ts                 ← Run/cursor/checkpoint/stopchat and tools
├── agent.ts                     ← role harness, runtime skill and agent tools
├── evidence.ts                  ← evidence persistence/attestation tools
├── browser.ts                   ← external browser bridge boundary, if justified
├── diagnostics.ts               ← selftest route/oracles, one-way dependencies
└── contracts.ts                 ← ONLY if proven necessary for noncyclic shared types
```
This tree is **a reviewed candidate**, not a command to create all files or assert their exact interfaces before moving source. `index.ts` keeps the actual Hono routes and MCP initialization; exporting a `registerXTools(server,req)` or equally small join-point from each group is preferable to a complex registry. Move → connect → typecheck/test/parity **one coherent group at a time**.

**GSA2:** remove measured unnecessary repeated harness/startup text while respecting independent entrypoints.

**GSA3:** reduce verified needless tool/skill payload; don't rebuild catalog-on-demand behavior already in GSA.

**GSA4:** scope by verified active role/task/phase only if reliable input and meaningful observed excess exist; otherwise NO_BUILD.

**Measurement:** actual retained vs candidate GSA run the **same** meaningful Bootstrap Job in the **two** prescribed auxiliary branches; clean first run is comparable; candidate bug invalidates its sample; compare **code quality independently** from context efficiency, integrate better code, delete worse aux branch when capability confirmed. GSA1 architectural KEEP is mandatory after parity; GSA2–GSA4 reversible.

## 5. Review conclusion / next evidence

**Source-grounded technical direction:** **PASS for selecting a cohesive-domain GSA1 proposal** over narrow PREP or monolith retention. **Not an executable-code PASS**: full helper import graph, host/runtime parity, branch cleanup and actual practical efficiency measurements remain to be observed during implementation. These are concrete execution/test facts, not a request for another high-level speculative plan.

**Do not claim:** source modularization definitely reduces ChatGPT context; a Git source branch is a running MCP; 55 tool-name mapping equals complete dependency proof; source-only tests equal user-flow PASS; author-side review is an independent GSA Reviewer receipt.

**Release:** no `main` merge, production deployment, product source changes or real branch cleanup performed by writing this review.
