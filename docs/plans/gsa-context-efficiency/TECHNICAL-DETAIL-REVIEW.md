# GSA Context Efficiency — Cross-Phase Technical Proposal Review

**Review date:** 2026-10-24.
**Scope:** Documentation/source-grounded technical review only — **NOT** an independent GSA Reviewer Run/Verification, runtime test PASS, Criteria approval, source-write authorization or deployment approval.
**Initial proposal source:** \`docs/plans/gsa-context-efficiency/TECHNICAL-DETAIL-PROPOSAL.md\` blob \`a68f9147c87b718575ba3ddbfb81f5ba8cbc10e1\`.
**GSA implementation baseline:** \`supabase/functions/gsa-mcp/index.ts\` blob \`448355e9a129db45d836c0f86915396fb060514c\`.
**Verdict on initial version:** **CHANGES_REQUIRED**, with source-bound improvements below. No program source changed.

## Scope-wide design assessment

1. **Sound:** Design addresses each CX-01…CX-04 separately with purpose-specific files, callers, test changes and conditional NO_BUILD decisions. Small, behavior-preserving extraction before context changes is better justified than repeatedly changing a 9,777-line monolith; full extraction of 55 MCP handlers and all Job/Run logic is not justified by context efficiency alone.
2. **Sound:** \`get_skill_catalog\` already returns descriptors and \`load_skill\` full bodies; \`renderHarness(role)\` already selects a Role. The proposal does not falsely count these existing features as new savings.
3. **Sound:** Two auxiliary source branches and GSA runtime candidate revisions are different identities. Code winner and context optimization winner can differ. Keeping only reviewed winning code minimizes future integration drift **provided the losing ref can actually be deleted**.
4. **CAUTION:** Independent tool-entrypoint instructions and duplicated-looking source strings may both be mandatory. Moving strings into modules is not itself a reduction in transmitted ChatGPT context.

## Findings on initial proposal

| ID | Priority / disposition | Technical finding | Required proposal correction |
|---|---|---|---|
| TD-R01 | **HIGH / CHANGES_REQUIRED** | PREP extraction can change code/source layout, so the declared GSA0 baseline must be bound precisely. Comparing deployed monolithic GSA0 with a candidate built after PREP would conflate refactor vs context and could break source-bound tests. | Specify two distinct checkpoints: **ORIGINAL-GSA0** immutable pre-PREP text/behavior fixture, and **PREP-equivalent GSA0** runtime on which both CONTROL and CANDIDATE operate. Confirm byte-identical public/context output and parity before comparing context. In the milestone, common **feature output branch base** and different **GSA runner source SHAs** are recorded separately. |
| TD-R02 | **HIGH / CHANGES_REQUIRED** | \`get_agent_harness\` currently accepts **role + mode**, not trusted task/phase. Proposed GSA3 \`selectRelevantSkillHints(role,taskKind,phase)\` lacks a real evidence source/caller and risks fabricated scope, improper authority and new tool-schema churn. | Gate GSA3 design on verified source of authorized task/phase (e.g., durable Job/Run evidence if an existing handler actually has it). Preserve current output when not supplied. Do not add untrusted client labels or a new persistence layer merely to populate selector inputs; if not available, **NO_BUILD GSA3**. |
| TD-R03 | **HIGH / EXECUTION CAPABILITY UNVERIFIED** | Source-only tests do not activate optimized plugin runtime. The 2-branch code-comparison procedure also demands deletion of losing Git branch, but currently inspected GitHub connection exposes no \`delete_branch\` action. | Define exact source SHA + isolated dev runner identity for candidate acceptance, and require an **observed authorized branch-ref deletion operation + readback** before milestone closeout; never claim a file-delete or PLAN RETIRED record deleted a ref. If unavailable, report capability blocker, do not fabricate cleanup or force a third branch. |
| TD-R04 | MEDIUM / KEEP DESIGN | Existing tests extract AST/functions/constants and MCP tool handlers from \`index.ts\`; naive module split invalidates tests. | Require migration of source-extraction tests to **actual** new files and pre/post source truth, preserving negative controls and expected 55 public tool schemas. Do not substitute disconnected test fixtures. Presently described correctly; verify in PREP acceptance. |
| TD-R05 | MEDIUM / NO_BUILD OPTION REQUIRED | CX-02/CX-03 overlap in progressive skills; CX-04 has no evidence-bound target yet. | Keep distinction: GSA2 tool **payload formatting** only; GSA3 **context selection** only if role/task/phase is grounded; GSA4 select measured residual or skip. Do not build an extra system to fill a four-version schedule. |
| TD-R06 | MEDIUM / ACCEPTABLE WITH CONDITION | \`context/mcp-instructions.ts\` extraction might accidentally change MCP \`instructions\` spacing/join sequence or bootstrap behavior. | Verify exact text/public protocol parity; leave initialization text inline if extraction costs too much, as the proposal already allows. |

## Proposed review resolution route

1. Revise proposal Sections 1–3 to distinguish original GSA0 vs PREP-equivalent GSA0 and add a measured parity ledger.
2. Revise GSA3 section to name **observed** current caller inputs and forbid work on new task/phase selectors before trusted provenance is established.
3. Clarify runtime/deletion capability blockers in the milestone section and **do not pretend branch cleanup is already available**.
4. Re-read revised proposal as a whole and mark whether *design documentation* meets these findings; **formal independent GSA Reviewer and the actual PREP tests remain separate subsequent steps**.

**No request to rewrite the product Criteria, create a new user-facing Job gate, split Bootstrap Jobs into micro-packs, refactor the entire MCP file, or execute code as part of this review.**
