# GSA Context Efficiency — Cross-Phase Technical Proposal Review

**Review date:** 2026-10-24.
**Scope:** Documentation/source-grounded technical review only — **NOT** an independent GSA Reviewer Run/Verification, runtime test PASS, Criteria approval, source-write authorization or deployment approval.
**Initial proposal source:** `docs/plans/gsa-context-efficiency/TECHNICAL-DETAIL-PROPOSAL.md` blob `a68f9147c87b718575ba3ddbfb81f5ba8cbc10e1`.
**GSA implementation baseline:** `supabase/functions/gsa-mcp/index.ts` blob `448355e9a129db45d836c0f86915396fb060514c`.
**Verdict on initial version:** **CHANGES_REQUIRED**, with source-bound improvements below. No program source changed.

## Scope-wide design assessment

1. **Sound:** Design addresses each CX-01…CX-04 separately with purpose-specific files, callers, test changes and conditional NO_BUILD decisions. Small, behavior-preserving extraction before context changes is better justified than repeatedly changing a 9,777-line monolith; full extraction of 55 MCP handlers and all Job/Run logic is not justified by context efficiency alone.
2. **Sound:** `get_skill_catalog` already returns descriptors and `load_skill` full bodies; `renderHarness(role)` already selects a Role. The proposal does not falsely count these existing features as new savings.
3. **Sound:** Two auxiliary source branches and GSA runtime candidate revisions are different identities. Code winner and context optimization winner can differ. Keeping only reviewed winning code minimizes future integration drift **provided the losing ref can actually be deleted**.
4. **CAUTION:** Independent tool-entrypoint instructions and duplicated-looking source strings may both be mandatory. Moving strings into modules is not itself a reduction in transmitted ChatGPT context.

## Findings on initial proposal

| ID | Priority / disposition | Technical finding | Required proposal correction |
|---|---|---|---|
| TD-R01 | **HIGH / CHANGES_REQUIRED** | PREP extraction can change code/source layout, so the declared GSA0 baseline must be bound precisely. Comparing deployed monolithic GSA0 with a candidate built after PREP would conflate refactor vs context and could break source-bound tests. | Specify two distinct checkpoints: **ORIGINAL-GSA0** immutable pre-PREP text/behavior fixture, and **PREP-equivalent GSA0** runtime on which both CONTROL and CANDIDATE operate. Confirm byte-identical public/context output and parity before comparing context. In the milestone, common **feature output branch base** and different **GSA runner source SHAs** are recorded separately. |
| TD-R02 | **HIGH / CHANGES_REQUIRED** | `get_agent_harness` currently accepts **role + mode**, not trusted task/phase. Proposed GSA3 `selectRelevantSkillHints(role,taskKind,phase)` lacks a real evidence source/caller and risks fabricated scope, improper authority and new tool-schema churn. | Gate GSA3 design on verified source of authorized task/phase (e.g., durable Job/Run evidence if an existing handler actually has it). Preserve current output when not supplied. Do not add untrusted client labels or a new persistence layer merely to populate selector inputs; if not available, **NO_BUILD GSA3**. |
| TD-R03 | **HIGH / EXECUTION CAPABILITY UNVERIFIED** | Source-only tests do not activate optimized plugin runtime. The 2-branch code-comparison procedure also demands deletion of losing Git branch, but currently inspected GitHub connection exposes no `delete_branch` action. | Define exact source SHA + isolated dev runner identity for candidate acceptance, and require an **observed authorized branch-ref deletion operation + readback** before milestone closeout; never claim a file-delete or PLAN RETIRED record deleted a ref. If unavailable, report capability blocker, do not fabricate cleanup or force a third branch. |
| TD-R04 | MEDIUM / KEEP DESIGN | Existing tests extract AST/functions/constants and MCP tool handlers from `index.ts`; naive module split invalidates tests. | Require migration of source-extraction tests to **actual** new files and pre/post source truth, preserving negative controls and expected 55 public tool schemas. Do not substitute disconnected test fixtures. Presently described correctly; verify in PREP acceptance. |
| TD-R05 | MEDIUM / NO_BUILD OPTION REQUIRED | CX-02/CX-03 overlap in progressive skills; CX-04 has no evidence-bound target yet. | Keep distinction: GSA2 tool **payload formatting** only; GSA3 **context selection** only if role/task/phase is grounded; GSA4 select measured residual or skip. Do not build an extra system to fill a four-version schedule. |
| TD-R06 | MEDIUM / ACCEPTABLE WITH CONDITION | `context/mcp-instructions.ts` extraction might accidentally change MCP `instructions` spacing/join sequence or bootstrap behavior. | Verify exact text/public protocol parity; leave initialization text inline if extraction costs too much, as the proposal already allows. |

## Proposed review resolution route

1. Revise proposal Sections 1–3 to distinguish original GSA0 vs PREP-equivalent GSA0 and add a measured parity ledger.
2. Revise GSA3 section to name **observed** current caller inputs and forbid work on new task/phase selectors before trusted provenance is established.
3. Clarify runtime/deletion capability blockers in the milestone section and **do not pretend branch cleanup is already available**.
4. Re-read revised proposal as a whole and mark whether *design documentation* meets these findings; **formal independent GSA Reviewer and the actual PREP tests remain separate subsequent steps**.

**No request to rewrite the product Criteria, create a new user-facing Job gate, split Bootstrap Jobs into micro-packs, refactor the entire MCP file, or execute code as part of this review.**

## Re-review of revised proposal — 2026-10-24

**Revised technical proposal blob:** `0aa715a9baa6a89a8b7f691ef3795b5844294cd5`. Readback checks confirmed explicit GSA1–GSA4 task sections, source module ownership, baseline lineage, GSA3 actual caller inputs and branch cleanup limitation.

| Finding | Document-level re-review result | Remaining execution evidence |
| --- | --- | --- |
| TD-R01 | **RESOLVED IN PROPOSAL:** ORIGINAL-GSA0 vs PREP-EQUIVALENT-GSA0 are separated; PREP exact-output parity precedes candidate measurement. | Prove parity with live source tests and isolated runner when implementing PREP. |
| TD-R02 | **RESOLVED IN PROPOSAL:** explicitly documents current `get_agent_harness(role,mode)`, no trusted phase/task, defaults unchanged and GSA3 NO_BUILD when inputs unproved. | Determine whether any authorized Job/Run caller actually provides verified context without schema/state churn. |
| TD-R03 | **OPEN CAPABILITY, NOT DESCRIPTIVE DESIGN ERROR:** precise runner-SHA and Git branch-ref deletion/readback requirements now in milestone interface. | Isolated candidate MCP and branch deletion tools remain **UNVERIFIED**; do not create/close real A/B milestones pretending these work. |
| TD-R04 | **ACCEPTED AS TEST REQUIREMENT:** real AST-test migrations, 55 registration/public shapes and pre/post negative controls explicitly specified. | Actual PREP tests and TypeScript Deno build pending source authorization. |
| TD-R05 | **ACCEPTED:** GSA2 cannot claim an already implemented catalog optimization; GSA3 needs actual scoped evidence; GSA4 may SKIP. | Estimate real data once CT-00 exists. |
| TD-R06 | **ACCEPTED:** keep initialization instructions inline if extraction is disproportionate; require byte-exact parity otherwise. | Source-pinned before/after tests pending. |

**Document-level verdict:** **PROPOSAL READY FOR INDEPENDENT REVIEW / MILESTONE REPLANNING**. The initial documentation findings TD-R01 and TD-R02 have been corrected. This is *not* a formal independent GSA Reviewer PASS; author-side evidence review cannot substitute for a separate role-isolated Reviewer. **Do not execute PREP/CX code until existing Human/Criteria scope and real runtime/tool capabilities are confirmed.**

**Suggested milestone structure from this source review:** `CT-00` meter → **PREP-00** focused pure context module extraction with behavior parity (**one preparatory phase**, no context optimization) → `CX-01/GSA1` → `CX-02/GSA2` if material savings evidence → `CX-03/GSA3` only if grounded task/phase inputs → `CX-04/GSA4` conditional. Each CX milestone uses the existing **two auxiliary feature-code branches** from the same source base and separate retained/candidate GSA runner versions; each pair executes the same substantive Bootstrap Job and cleans up the rejected output branch after observed authorized deletion. Do not lock specific BP feature pack boundaries until the independent architecture review and effective Criteria scope are reconciled.
