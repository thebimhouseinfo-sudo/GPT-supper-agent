# GSA Context Efficiency — Technical Detail Proposal (Pre-Code)

## GOAL

Provide a **source-grounded, per-task descriptive technical proposal** for the already proposed GSA1–GSA4 context-efficiency experiments. Identify exactly what files would be **CREATE / MODIFY / REUSE_AS_IS / KEEP**, which existing/proposed symbols and public callers are involved, inputs/outputs, dependencies, design constraints and tests **before** any application source edit. Determine whether a common behavior-preserving extraction phase is proportionate, then submit the *combined* proposal for Reviewer assessment before finalizing milestone boundaries.

**Status:** PROPOSAL — UNREVIEWED AT CREATION. No source files, empty modules, tool schemas, plugin endpoints or production configurations are changed by this document.
**Source:** \`thebimhouseinfo-sudo/GPT-supper-agent\` branch \`upgrade/gsa-context-efficiency\` @ \`7f54769e1a8fbc5a06f262bbb87aff198f433b73\` (runtime file blob \`448355e9a129db45d836c0f86915396fb060514c\`); Bootstrap v7 draft @ \`ea5f70f8bc051a036496158a4e33a2bfe6f99725\`.
**Existing integrated planning source:** \`docs/plans/gsa-context-efficiency/DETAIL-PLAN.md\` @ \`8940b1b73aa6f3c8a82741fe37d3230aef28d5f3\`.
**Authority:** Source architecture/proposal only; approved GSA Criteria currently has a narrower research-first scope. A revised code-execution scope requires existing Human/Advisor procedure, **not** an invented technical proposal approval gate. Main/production stay untouched.

## 1. Verified brownfield map and feasibility distinctions

**OBSERVED, from source at pinned revision:**
- \`supabase/functions/gsa-mcp/index.ts\`: 9,777 lines, approximately 615k UTF-8-representable source characters, currently the **sole TypeScript file** in \`supabase/functions/gsa-mcp/\`. Functions \`createServer(req)\` from line ~3446, with **55** \`server.registerTool\` occurrences, plus Hono \`/selftest\`, \`/health\`, \`/mcp\` routes; \`Deno.serve(root.fetch)\` remains the entrypoint.
- Shared and per-role context are already defined: \`BASE_AGENT_HARNESS\` (~2474), \`ROLE_HARNESSES\` (~2529), \`ROLE_SKILLS\` (~2735), \`ROLE_HOST_SKILLS\` (~2748), \`RUNTIME_SKILLS\` (~2752), and \`renderHarness(role)\` (~3054).
- Actual MCP public calls are \`get_agent_harness\` (~6122), \`get_skill_catalog\` (~6166), \`load_skill\` (~6187). \`get_agent_harness\` uses \`renderHarness\` and role lists. \`get_skill_catalog\` **already** returns skill **name + description only**; \`load_skill\` retrieves full body on demand. \`load_skill\` has an explicit Zod enum of accepted skill names; changing only a registry object is insufficient to add an exposed skill.
- MCP initialization \`instructions\` inside \`createServer\` already contain overlapping operational topics with \`BASE_AGENT_HARNESS\`; **overlap does not prove duplicate host-context cost** because initialization visibility and role-harness invocations differ.
- Normal tool results often expose \`structuredContent\` plus a text \`content\` fallback. Source presence **does not prove** ChatGPT counts both as model input. Some \`external_steps\` are instructions needed for permitted external GitHub persistence/readback, not removable decoration.
- \`test-lab/runtime-logic.test.cjs\`, \`planner-critical-challenge.test.cjs\`, \`llc59-autonomy-harness.test.cjs\`, \`stopchat-handoff.test.cjs\`, \`scenario-tester-integration.test.cjs\` and related tests currently parse **exact \`index.ts\` declarations, AST, literal text and even registerTool callback bodies**. Moving code will break tests unless extraction-aware test reading is updated correctly. Green tests after swapping tests for a fake copy are unacceptable.
- \`.github/workflows/gsa-next-logic.yml\` invokes explicit Node test paths and \`deno check supabase/functions/gsa-mcp/index.ts\`. New files/test paths need appropriate CI path filters and executable coverage.
- \`docs/architecture/ARCHITECTURE.md\` defines GSA as an MCP/harness thin runtime using GitHub Project Memory; no new source-history, per-chat memory DB or second agent control plane is allowed.

**UNKNOWN, must be measured or independently proved:**
- ChatGPT Web model input token count, persistent tool schema visibility, host caching, what text/structuredContent is presented/double-counted, and whether a separate native/host-managed skill is loaded. These cannot be asserted from TypeScript source.
- Feasible safe savings for CX-01/CX-02/CX-03; the existing implementation already uses role selection and progressive skill disclosure. Each may correctly conclude \`NO_BUILD/REVERT\`.
- Access to a live **isolated** candidate MCP/runtime (not merely a dev Git branch), and capability to **delete a Git branch ref** after selecting the better code. The currently exposed GitHub connector includes \`delete_file\`, not an identified \`delete_branch\`; **do not equate file deletion to branch deletion**. Milestone cleanup cannot claim DONE until actual branch-ref deletion/readback through an authorized tool is demonstrated.

## 2. Cross-phase file and dependency proposal

These are **future paths**, not files already present. Group modules by responsibility, not by how many lines can be moved. **No wholesale 55-tool registry rewrite in PREP; no forced extraction of unrelated Job/Run helper functions.** Only one shared extraction when it demonstrably eliminates repeated risky edits across GSA1–GSA3.

| Path | Action / phase | Actual or proposed symbols / responsibility | Callers and dependencies |
| --- | --- | --- | --- |
| \`supabase/functions/gsa-mcp/index.ts\` | **MODIFY**, PREP + per-CX only when needed | Remains stable public MCP/Hono adapter; \`createServer(req)\`, 55 tool registrations, \`/selftest\`, \`/health\`, \`/mcp\`, OAuth/auth/entrypoint. Import extracted context constants/helpers. Preserve exact external contracts before CX. | MCP SDK, Hono, GitHub/Supabase auth; new pure modules. Avoid moving stateful callback closures until independently justified. |
| \`supabase/functions/gsa-mcp/context/harness.ts\` | **CREATE**, PREP | Move \`BASE_AGENT_HARNESS\`, \`ROLE_HARNESSES\`, \`ROLE_SKILLS\`, \`ROLE_HOST_SKILLS\`, \`renderHarness(role)\` with unchanged values and output first. Later GSA1 edits harness assembly; GSA3 may use scoped role selection. | \`index.ts\` \`get_agent_harness\` and potentially role/tool suggestions. Should not import \`index.ts\` or the MCP SDK. Exports are ordinary TS functions/constants, no global mutable registry. |
| \`supabase/functions/gsa-mcp/context/skills.ts\` | **CREATE**, PREP | Move \`RUNTIME_SKILLS\` descriptions/bodies **unchanged**. Optionally export \`getRuntimeSkill(name)\` and \`listRuntimeSkillDescriptors()\` only as tiny pure accessors once needed (PROPOSED). Keep host skills separate from GSA runtime skill bodies. | \`index.ts\` get_skill_catalog/load_skill; \`context/harness.ts\` should not import full skills just to render a role. Public \`load_skill\` Zod name enum must stay consistent with registry (source-generated only if an independently tested compatibility benefit exists). |
| \`supabase/functions/gsa-mcp/context/mcp-instructions.ts\` | **CREATE**, PREP (conditional on extraction parity) | Relocate the exact existing MCP \`instructions\` string to \`MCP_INSTRUCTIONS\`; text **byte-equivalent** in PREP. Later GSA1 tests deduplicating explicitly proven repetition versus role harness. | \`index.ts:createServer\` consumes \`MCP_INSTRUCTIONS\`; no import of role/skills or runtime state. |
| \`supabase/functions/gsa-mcp/context/tool-output.ts\` | **CREATE ONLY IF EVIDENCED**, CX-02 | Proposed bounded \`formatToolResult(payload, options)\` / \`removeProvenRedundantHint(...)\` with unchanged default envelope. Avoid global wrapping of all 55 tools. | Only handlers explicitly selected by CX-02; do not import auth/Job state; preserve \`structuredContent\`, \`content\`, \`isError\`, \`external_steps\`. **Omit file if existing local formatting suffices.** |
| \`supabase/functions/gsa-mcp/context/context-policy.ts\` | **CREATE ONLY IF EVIDENCED**, CX-03 | Proposed \`selectRelevantSkillHints(role, taskScope, phase, availableSkills)\` and \`renderScopedRoleContext(...)\` **only if measurements show irrelevance from GSA, not host**. Restrict to hint selection; no new authorization or Project state machine. | \`context/harness.ts\`/get_agent_harness may consume; explicit verified role/task inputs; no hidden client conversation memory. **Omit if current role-scoped delivery already adequate.** |
| \`test-lab/context-meter.test.cjs\` or one small sibling script | **CREATE**, CT-00 | Per observed GSA command sample UTF-8 bytes, chars, stable approximate-token heuristic, occurrence count, pack/milestone/runtime SHA, valid/invalid flag. No ChatGPT host token claim. | Existing Test Lab and actual source-executed/staging tool results; avoid private transcript/raw telemetry. |
| \`test-lab/context-extraction-parity.test.cjs\` | **CREATE**, PREP | Compile/read real extracted TS modules and verify pre/post exact text, roles/skills metadata, names, result envelopes, exposed tools/routes; fail on changed behavior during PREP. | Real \`index.ts\` + extracted \`context/*.ts\`; may use installed TS parser for source-bound tests. Include in CI. |
| Existing \`test-lab/*runtime*.test.cjs\`, \`*harness*.test.cjs\`, \`planner-critical-challenge.test.cjs\`, \`stopchat-handoff.test.cjs\`, \`scenario-tester-integration.test.cjs\` | **MODIFY**, PREP | Update source-declaration discovery to use **actual new module** (not a detached copy of constants); retain existing positive/negative assertions and callback-extraction evidence. | Must still exercise the actual routed runtime, not only strings from a disconnected file. |
| \`.github/workflows/gsa-next-logic.yml\` | **MODIFY**, PREP | Include \`supabase/functions/gsa-mcp/context/**\` in source-change triggers; run any new test explicitly; maintain \`deno check\`, existing runner and negative checks. | No implicit production deploy. |
| \`docs/architecture/AGENT-HARNESSES.md\` and \`ARCHITECTURE.md\` | **MODIFY**, PREP only once behavior parity is verified | Record module ownership and same public result contract; no new authority or role approval policy. | Must reflect actual implemented exports, not future aspirations. |
| \`skills/gsa-job-runtime/SKILL.md\` | **KEEP** unless a particular CX proves actual skill instruction needs changing | Existing durable execution knowledge remains; no mass rewrite as side effect of code extraction. | Optional scoped corrections in the relevant later BP feature Job; not a compulsory context target. |

**Interface edges proposed** (illustrative; signatures final only after Coder verifies imports and Reviewer accepts):
\`\`\`text
index.ts / createServer(req)
  ├── new McpServer({ instructions: MCP_INSTRUCTIONS })
  ├── get_agent_harness handler → renderHarness(role)
  │                             → ROLE_HARNESSES[role], ROLE_SKILLS[role], ROLE_HOST_SKILLS[role]
  ├── get_skill_catalog handler → listRuntimeSkillDescriptors()
  ├── load_skill handler        → getRuntimeSkill(name) + existing Zod schema
  ├── selected tool handlers    → (optional) formatToolResult(...) after proven safe
  └── /selftest, /health, /mcp remain here

context/harness.ts     → no import from index.ts or context/skills.ts
context/mcp-instructions.ts → no runtime dependencies
context/skills.ts      → self-contained skill registry
context/context-policy.ts [ONLY IF NEEDED] → pure input role/task/phase; no GitHub or auth
\`\`\`
**Scope rule:** module extraction = DEV internal source refactor; Git SHA/CAS for this DEV code stays valid. None of this gives GSA authority to assign SHA/GUID to users' operational CadGPT Job/LISP/DWG products.

## 3. PREP — Shared behavior-preserving structural extraction (proposed before GSA1)

### GOAL
Establish stable, independently editable context modules so GSA1, GSA2 and GSA3 can make disjoint changes **without altering any current user-visible GSA behavior**. PREP earns its place only if measured reduction in collision/test risk justifies moving code; code organization by itself is not context optimization.

**PREP-T1 SOURCE INVENTORY — REUSE_AS_IS** \`index.ts\`, current test/CI/architecture sources. Map all uses of harness constants, skill registry, MCP instructions and Zod \`load_skill\` enum; detect closures/top-level dependencies before moving. **Known:** constants, renderer and handlers identified in Section 1. **Unknown:** exact imported symbol collisions / all dependency edges until implementation-phase AST inspection.

**PREP-T2 EXTRACT PURE CONTEXT — CREATE** \`context/harness.ts\`, \`context/skills.ts\`, and **conditionally** \`context/mcp-instructions.ts\`. **MODIFY** \`index.ts\` imports and references. First commit only moves existing values/bodies; it changes **no strings, no role defaults, no tool description, no skill list, no result envelope, no authorization behavior**. Leave \`createServer\`, 55 registration blocks, OAuth/Hono routes and stateful Job/Run helpers in \`index.ts\`; **do not extract all source indiscriminately**. Preserve module import ordering and deterministic build.

**PREP-T3 TEST PARITY — CREATE** \`test-lab/context-extraction-parity.test.cjs\`. **MODIFY** source-bound existing tests and CI paths as in table. Compare source-pinned original versus extracted version on:
- exact MCP initialization instructions and \`renderHarness\` for **each** role;
- \`ROLE_SKILLS\`, \`ROLE_HOST_SKILLS\`, all runtime skill descriptors + loaded body/allowlist;
- 55 tool registrations with exact names, input/output schemas, descriptions, default result shape where reachable;
- \`/health\`, \`/selftest\`, OAuth metadata and authenticated \`/mcp\` response; include negative controls for missing auth/unknown role/unknown skill;
- job_prepare→review→run dispatch safety, Plan-change fences, stopchat and source ownership (existing tests preserved);
- do not claim external ChatGPT tool listing or real GitHub persistence PASS from static source tests; isolated deployment checks are separately labeled.

**PREP-T4 DECISION:** If moving \`MCP_INSTRUCTIONS\` or another definition needs broad architecture surgery, leave that definition in \`index.ts\` and document why. A complete monolith breakup is **not** a prerequisite unless Reviewer finds a real cross-phase dependency that requires it. PREP PASS means **behavioral parity**, not fewer model tokens.

## 4. GSA1 / CX-01 — Harness duplication reduction

### GOAL
Find and remove **proven redundant delivered** instruction text across startup/harness surfaces without degrading role/authority. GSA1 is exactly the PREP baseline plus the CX-01 change group, not simultaneous skill-routing redesign.

**GSA1-T1 MEASURE — REUSE_AS_IS** context meter; \`context/harness.ts\`, \`context/mcp-instructions.ts\`/existing inline startup. Build an exact per-surface inventory of repeated instruction meaning (Human gates, branch/CAS, Reviewer isolation, continuation). Mark \`DELIVERED_TWICE\` vs \`DIFFERENT_ENTRYPOINT\` / \`UNKNOWN_HOST\`. Duplicate wording in source is not proof of redundant model-visible context.

**GSA1-T2 CHANGE — MODIFY, conditional** \`context/harness.ts\` and/or \`context/mcp-instructions.ts\` (or \`index.ts\` if startup stayed inline). Prefer eliminating redundant **within the same delivered role-harness text** or unneeded repeated sentence while **retaining independent entrypoint guidance**. \`renderHarness(role)\` output can change *only* in this experiment and must preserve full active-role authority; a slim reusable core is a possible implementation, not a requirement to invent an ID/pointer/cache.

**GSA1-T3 VERIFY — CREATE/MODIFY** \`test-lab/context-harness-contract.test.cjs\` and \`test-lab/context-meter.test.cjs\`: measure before/after payload by role (shared + authority + loop) and startup; assert Human approval, Advisor triggers, correct branches, exact GitHub CAS/readback, role isolation, error/stopchat/continuation still present at each independently reachable entrypoint. Ensure \`get_agent_harness\` actual handler emits correct \`canonical_refs\`, \`suggested_skills\` and role text. **Do not delete rule because another tool might have been called in an earlier conversation.**

**PASS / REVERT:** reduction observed on actually reached GSA output AND no mandatory semantic/behavior loss. Otherwise reject CX-01 without discarding PREP/refined Bootstrap code. No guaranteed savings pre-implementation.

## 5. GSA2 / CX-02 — Skill/catalog/tool-response efficiency

### GOAL
Remove *observed* irrelevant or repeated model-facing data **within specific tool results**, not redesign the role/phase routing.

**GSA2-T1 DISCOVERY — REUSE_AS_IS** \`context/skills.ts\`, \`index.ts\` handlers: record request/response for \`get_skill_catalog\`, \`load_skill\`, \`get_agent_harness\`, and representative high-frequency tools with \`external_steps\`. **Already exists:** name/description-only catalog and body-on-demand. Do NOT implement these again or assert saving from an already deployed behavior. Quantify where metadata or tool text is actually excessive. Record host-managed tool schema unknowns.

**GSA2-T2 DESIGN TARGET ONLY WHEN PROVEN — MODIFY** \`context/skills.ts\` metadata or selected \`index.ts\` handler output; optional **CREATE** \`context/tool-output.ts\` only if at least two distinct handlers need the identical pure safe formatter. No mandatory new generic \`responseEnvelopeManager\` or external steps manager. Keep input/output schema compatibility, exact IDs/paths/repo/branch, review/approval, required blockers/errors and external mutation/readback steps. The \`load_skill\` enum remains synchronized with actual registry; inspect current schema if new Bootstrap skills are added during feature packs.

**GSA2-T3 VERIFY — CREATE/MODIFY** \`test-lab/context-tool-response-contract.test.cjs\` and meter cases. For chosen tools check JSON property shape, schema, \`isError\`, structuredContent/text fallback and critical \`external_steps\`; check valid continuation and negative stale/missing input, plus observed bytes/estimated tokens/call frequency. Do not count structuredContent and content twice without host observation.

**PASS / NO_BUILD:** net reduction on measurable affected tool calls, same verified workflow/correctness. If existing catalog and selective loading are already sufficient or safe reduction is marginal, do **NO_BUILD/REVERT** and proceed with Bootstrap work; do not force a GSA2 implementation merely because a milestone name exists.

## 6. GSA3 / CX-03 — Context selection by active role, task and phase

### GOAL
Reduce *observed* irrelevant content loaded for an active Run while keeping **complete authoritative context for that active role** and independent Reviewer/Tester. This is a scope-selection experiment, separate from GSA2 output formatting.

**GSA3-T1 SOURCE FIT — REUSE_AS_IS** \`context/harness.ts\` existing \`renderHarness(role)\`, \`ROLE_SKILLS\`, \`ROLE_HOST_SKILLS\`, existing \`get_agent_harness\` \`mode\` (JOB/DIRECT_AGENT) and \`run_begin\` required skill contexts. **Already implemented:** render by role and progressive role suggestions. Find evidence that an *actual role/task/phase* is receiving an irrelevant **full** guidance body or unnecessary skill descriptor that GSA controls. Do not assume host tool schemas or past chats are changeable.

**GSA3-T2 SCOPED PURE SELECTION — CREATE ONLY IF NEEDED** \`context/context-policy.ts\` exporting e.g. \`selectRelevantSkillHints({role,taskKind,phase},catalog)\` (PROPOSED, not existing) and/or \`renderScopedRoleContext(...)\`; **MODIFY** \`context/harness.ts\` or one handler in \`index.ts\` to consume it. Inputs are explicit verified role/task/phase evidence; the selector does **not** grant permissions, bypass role bootstrap, suppress a required role's contract, read freeform ChatGPT history or invent a new persistent task/phase registry. Default must produce current output when phase is unknown, preserving compatibility. Test whether adding tool input/schema is necessary; prefer no schema change.

**GSA3-T3 VERIFY — CREATE/MODIFY** \`test-lab/context-role-scope.test.cjs\` and existing \`planner-critical-challenge.test.cjs\`, \`scenario-tester-integration.test.cjs\`. Cases: Planner vs Coder vs Tester/Reviewer; normal Job vs Direct Agent; no task/phase metadata; Reviewer fresh context; Tester on-demand simulate; wrong/stale metadata; scope/permission rejection. Verify no missing critical advice in the new Bootstrap functional flows and no role attribution/security regressions.

**PASS / NO_BUILD:** observed scoped payload reduction without extra tool calls/rereads or loss of independent role context. If existing \`renderHarness(role)\` already satisfies the goal, leave GSA3 unbuilt/REVERT; code abstraction alone is no benefit.

## 7. GSA4 / CX-04 — Evidence-directed last-mile context experiment (conditional)

### GOAL
After Tester \`simulate\` and advanced root-cause additions, use measurements to choose **one residual context expense** not already addressed by CX-01–CX-03; reject an unsupported optimization.

**GSA4-T1 SELECT — REUSE_AS_IS** prior meter observations and completed substantive Bootstrap Job Packs. Identify one high-frequency residual payload and prove GSA can influence it. Candidate examples **not preapproved changes**: load advanced Tester scenario details only when \`simulate\` is actually invoked; avoid including advanced debugging guidance in normal Coder Run; remove proven nonrequired repeat scaffolding from a particular tool.

**GSA4-T2 FILE TARGET — MODIFY ONLY IF PROVEN** whichever existing file *owns* the measured surface (\`context/skills.ts\`, \`context/harness.ts\`, existing host-native Tester skill routing, or a specific \`index.ts\` handler). **No mandatory new module**. If a genuinely separate shared pure strategy is established, propose its exact file and consumer in a small reviewed amendment **before writing code**, rather than guessing a file now. Do not preload \`simulate\` or advanced-root-cause content just to make its metadata appear.

**GSA4-T3 VERIFY — CREATE one small focused test only if needed** under \`test-lab/\`, use same context meter and relevant real user-flow regression. Count tool calls and rereads; not just response bytes.

**PASS / SKIP:** if no convincing controllable source of savings remains, skip GSA4; this is an expected evidence-grounded outcome, not failure to follow the plan.

## 8. Two-branch comparison interfaces and milestone evidence

**No new measurement database, branch manager, or Git control plane.** Each existing GSA context milestone should record:
- goal and exact optimization group GSA1/GSA2/GSA3/GSA4;
- **two actual auxiliary Git branch refs** created from the identical base source SHA, named CONTROL and CANDIDATE;
- retained GSA runner revision/staging endpoint versus candidate GSA runner revision/staging endpoint — **separate from the output branch refs**;
- identical substantive Bootstrap Job scope and criteria, expected results and actual each-branch source/test evidence;
- context measurement \`VALID\` on first clean same-Pack run; if candidate GSA fault requires repair, \`INVALID\` sample and reason, then next full Pack/replay in equivalent bounded state;
- independent **code-quality winner** (may be different from context winner), reviewed integration SHA, **inferior aux-branch deletion/readback** when actually executable, no third branch; separate \`KEEP/REVERT\` optimization conclusion and new rolling baseline;
- no unsafe forced repeated Git/CAD writes; no claim to have executed optimized GSA merely by having a source branch.

**Branch deletion gap:** Current GitHub connector surface observed for this conversation has a **file** deletion operation and branch create, but no confirmed branch-ref deletion. This does not prove deletion is impossible using every integration; it means cleanup execution is **UNVERIFIED**, to be tested with an authorized supported tool before real milestone closeout. Never claim it was deleted or silently keep a loser contrary to Human's stated workflow.

## 9. Whole-proposal review checklist (to be completed AFTER writing this proposal)

Reviewer must read Sections 1–8 **together**, not approve four independent text snippets. Check:
1. **Reality check:** whether PREP extraction can preserve MCP schema/body/export references and all source-bound tests without spurious passes; any need to move 55 tool registrations is evidence-based, not aesthetics.
2. **Cross-phase reuse and overlap:** GSA1 harness vs GSA3 role scoping; GSA2 catalog vs GSA3 skill selection; GSA4 only if a measured residual exists; avoid duplicate context managers, providers, registries, policy services.
3. **Observed vs speculative benefit:** pre-existing role/skill progressive disclosure and missing ChatGPT-host tokens must be acknowledged; source modularization does not itself save prompt tokens.
4. **Host and tool reality:** isolated staging must actually run the candidate; source branch ≠ live MCP. Git branch deletion requires observed capability; source file removal is not branch removal. Two aux branches only.
5. **Authority and regressions:** approved GSA Criteria, role/Reviewer/Tester independence, technical advisor position, Git CAS, terminal vs pending Run, source branch scope, \`structuredContent\`/text behavior and \`external_steps\` correctness stay intact.
6. **Practicality:** no global monolith rewrite or universal abstraction to save a few strings. If PREP effort is disproportionate, accept narrower pure-module extraction or keep \`index.ts\` and test context changes in place.
7. **Milestones:** confirm source/module PREP (if retained) and CT-00 before experiments; GSA1→GSA4 group boundaries adjusted only after review; keep feature Job Packs meaningful. Distinguish proposed design review from independent runtime/code verification.

**This Pre-Code document contains no application implementation source and does not authorize code changes, Criteria changes, branch creation, deletion, merge or deploy.**
