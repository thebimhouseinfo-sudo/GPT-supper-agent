# CX-02 / GSA2 — Reversible harness duplication candidate (2026-11-03)

## GOAL

Build the **smallest justified source-pinned GSA2 candidate**, preserving the mandatory GSA1 architecture and all full independent role-entry behavior. Do not wait for U-A code-quality comparisons to start GSA2 work. Do **not** decide GSA2 KEEP/REVERT or claim host-model token savings without a valid isolated GSA1/GSA2 runner comparison.

## Source and ownership

- Repo: `thebimhouseinfo-sudo/GPT-supper-agent`.
- **Mandatory GSA1 source foundation (left unchanged):** `upgrade/gsa-context-efficiency` @ `cbf7d6aaa16dc2338061549db3be76c20de15513`.
- **GSA2 candidate work branch:** `feature/gsa-gsa2-harness-optimization`, created at precisely that GSA1 SHA. GSA2 was developed via explicitly Human-selected **Direct Coding**, not by running the GSA2 Harness as an agent.
- Candidate source/test commit before this report: `1f0f3a5a3567324c1bbde946dd22e8f1b589cb2d` (6 commits ahead, 0 behind pinned foundation). Compare this exact code revision; re-read latest branch HEAD before later actions.
- No changes to GSA1 branch, U-A CONTROL/CANDIDATE branches, approved Criteria, `main`, runtime production, or Project Memory branch policy.

## Verified unnecessary duplication in a *single tool result*

`get_agent_harness` returns one structured JSON object (also represented in an MCP text fallback). Before GSA2 it included:
1. `harness_text`: complete base + role rules plus a footer headed `PROGRESSIVE SKILLS` listing each skill with the generic `load only when relevant` reminder.
2. **In the same result**, `suggested_skills`: the identical role-specific skill identifiers, together with `context_policy` and the tool description requiring progressive loading.

These are redundant same-response skill identifiers, unlike the repeated **shared security rules across independently entered role sessions**. The latter remain untouched. The JSON `structuredContent` vs `content` compatibility copy is also untouched (separate GSA3 concern).

## Minimal reversible patch

- `supabase/functions/gsa-mcp/harness-catalog.ts`: `renderHarness(role, { includeProgressiveSkills?: boolean } = {})`. The **default** still returns the complete legacy text, unchanged byte-for-byte in a source-executed invariant. Passing `includeProgressiveSkills:false` omits only the trailing footer.
- `supabase/functions/gsa-mcp/harness-skill-tools.ts`: **only** `get_agent_harness` uses the compact option. The tool still returns `suggested_skills: ROLE_SKILLS[role]`, `suggested_host_skills`, `context_policy`, `harness_text`, canonical refs, and both compatible output forms. Auth and role input schema untouched.
- `test-lab/gsa2-harness-dedup.test.cjs`: exact footer-reconstruction parity for all 8 roles, shared safety/governance and role-heading checks, unknown role negative, independently entered Advisor uses full default, authenticated tool schema/return metadata assertions, reproducible per-role byte/character measurements.
- `test-lab/project-branch-policy.test.cjs`: updated one legacy source-oracle to require the new compact invocation **and** continued `suggested_skills` return, rather than accepting a missing role contract.
- `.github/workflows/gsa-next-logic.yml`: include the focused GSA2 test in existing Node test command; no production deployment logic changed.

## Source-executed payload proxy (eight role calls, one per role)

Environment: isolated Vercel sandbox `gsa2-cx02-dedup-1103`, session `sbx_NaOuTbJDawxrPsjEhvwj7ew8SW2H`, Node 24 (hosted CI currently declares Node 22). The exact source text was independently transferred via the private GitHub connector; 29/29 TypeScript source blobs and 3/3 target fixtures match expected Git blob hashes. Results count **only `harness_text`**, not the full serialized MCP response, tools called in a real U Job or ChatGPT host input tokens.

| Role | GSA1 full characters | GSA2 compact characters | Removed chars |
|---|---:|---:|---:|
| orchestrator | 22,498 | 22,420 | 78 |
| planner | 23,920 | 23,716 | 204 |
| advisor | 16,522 | 16,502 | 20 |
| designer | 16,541 | 16,463 | 78 |
| coder | 19,222 | 19,085 | 137 |
| reviewer | 18,765 | 18,619 | 146 |
| critic_reviewer | 17,116 | 16,972 | 144 |
| tester | 20,138 | 20,054 | 84 |
| **Eight-call total** | **154,722** | **153,831** | **891** |

- UTF-8 payload-text sum: **155,110 → 154,219 bytes**, a **891-byte** source-executed reduction over these eight calls, approximately **0.57%** of `harness_text` bytes.
- No shared role-security policy was shortened, removed or conditionally omitted. Default full render remains identical.
- Because the host's serialization/caching/model-facing selection is unknown, this is **NOT** an observed ChatGPT input-token or real-job latency/usage saving, and not proof that cross-role shared prefix can be safely dropped.

## Executed tests and review-repair record

1. GitHub scope: branch created at pinned SHA; compare verified it remained 6 commits ahead / 0 behind pinned GSA1 before report commit. The foundation branch was still unchanged when last checked.
2. Local isolated Node focused test: **3/3 PASS**; exact same source Git hashes confirmed for the four initial harness/handler/index/test files.
3. Complete `node --test` list in `.github/workflows/gsa-next-logic.yml`: first run **141/142 PASS**, one oracle expected the former exact `renderHarness(role)` source spelling. This was a test-contract change, not a runtime failure. Repaired the oracle to assert the new invocation and the retained skill metadata. Re-run: **142/142 PASS** (exit 0).
4. `node_modules/.bin/deno check supabase/functions/gsa-mcp/index.ts`: **exit 0**. Warning only: peer Zod v3/v4 resolution for `openai`, no TypeScript errors.
5. Isolated HTTP `GET /gsa-mcp/selftest`: **pass:true**, **132/132 checks true**, no failed cases. Deno process launched locally in the sandbox and terminated on command exit; no production deployment.
6. Source-provenance validation: **32/32 Git blob SHA matches** (all 29 TypeScript files under the function plus 3 focused fixtures), against the exact GitHub branch state.
7. Source review: the entire compact difference is mechanically reconstructed as the old footer per role; metadata remains inside the same result; unchanged complete renderer still used by independent/direct admission. The focused regression covers the high-risk contracts. This is a **source-executed self-review**, not an independently attributed GSA Reviewer or live-host role-isolation acceptance.

## Disposition / future measurement

- **Candidate source:** CODED and SOURCE-TESTED; compatible fallback/direct role entry preserved by tests.
- **Independent Reviewer / live authenticated staging MCP response:** NOT YET VERIFIED.
- **GSA1 paired U-Job baseline:** NOT AVAILABLE; this phase does not wait for U-A to develop code, but cannot decide relative field efficiency yet.
- **Actual GSA2 net workflow efficiency:** **INCONCLUSIVE**. The measured reduction is intentionally small, and may not be net useful. Do **not** declare KEEP or REVERT based solely on the source size proxy.
- **GSA1:** architectural KEEP, **not** subject to GSA2-style optional KEEP/REVERT.
- **Rollback (only GSA2):** revert the two bounded Harness/handler changes and associated GSA2-focused test/CI adjustments on this experiment branch; the pinned GSA1 branch remains untouched.
- **No merge to main, no explicit production deploy**, and no automatic integration into the two parallel U-A outputs.
