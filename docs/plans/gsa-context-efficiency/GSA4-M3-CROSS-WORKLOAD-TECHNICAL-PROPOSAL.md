# GSA4 M3 — Cross-Workload Technical Proposal
## GOAL
Specify the smallest reproducible and governance-safe mechanics needed to test G3 and Skill Candidates on **crossed real work**, preserve exact original source authority, isolate the arms and permit verified end-to-end handoff/closure. Technical architecture is subordinate to the existing `GSA4-TECHNICAL-PROPOSAL.md` and approved Criteria; this document does not change the A-first physical strategy.

**Status:** PROPOSED / planning review pending / no product code or runtime experiment performed.
**Source:** product `thebimhouseinfo-sudo/GPT-supper-agent`; Development `upgrade/gsa-context-efficiency`; baseline B `ccbb550da7d87cbcc10143078b14d18a34dfcc52`.
**Original authority:** Criteria blob `ff45d47435ae6cc9ae4acd5106bf945308fb4f95`; M1-04 `be80b2e71ffcd1d013f4251cc1c9b4a92369952a`; M2-03 `7989792ebeefb00ff9477fd6336c612ef71ffdf3`; M3-G1/G2/G3 `2584fe03351924997f5f9860faf0dab85cf3245c` / `3b676b784ef83c66ad8e008bac89ea9f791ae92e` / `d3aebf56828d0c99cb31b1ccf383243e611efaf5`; M3-S1 `e2bdf9d98e409cbe1fbe8557c287b0bffac185ef`; Job Instruction discussion `ce69242c151dcde104940a5d8e4248917f7066bb`.

## 1. Real workload and evaluator artifact contract
- WG=M3-G and WS=M3-S are **actual bounded implementation/verification work packets** with usable output, starting source/tree/branch base, authorized scope, acceptance, Tool/model configuration, and expected artifact paths. Baseline and candidate per workload must have exactly the same Task payload/semantic acceptance; candidate implementation changes are the controlled intervention.
- Freeze Task payload bytes and independent held-out scoring expectations **before** exposing candidate outputs. Store on authorized Project/evidence path; bind path/blob SHA, fixture version, case IDs from M1-01 G01–G24, S01–S20 and N01–N10 plus relevant M1-03 critical regressions. These are case specifications, not previously executed trials. Correct any frozen fixture by new version and re-run all affected arms.
- Tester holds answer keys out of Candidate author context. Observer records no undisclosed oracle contamination; multiple independent actual sessions when available. A single case supports only bounded feasibility, never general superiority.
- Original Criteria whole applicable section(s), Acceptance, complete accepted HOW and actual GOAL carrier (PROJECT_PLAN Task when authoritative) remain retrievable. A short instruction is a navigation map, not a substituted authority.

## 2. Candidate isolation and branch lineage
- Source compare pin B original `ccbb550...`, current authorized Development parent HEAD, proposed per-arm base, tested final SHA and exact changed files. Current Development is 20 ahead/0 behind vs B at initial M3-00 observation; re-check at each branch creation/mutation.
- Every experiment branch is owned by one Job Pack, with base SHA, scope, no unauthorized Product/Memory crossover, downstream recipient and unique JP-CONVERGE closure owner. Test environment and file destinations must prevent BASE/candidate artifact leakage.
- **Source branch authorization is separate from mere GitHub API permission.** Do not create/use experiment branches for writes if GSA governance denies the target. No alternate API or direct Git push to bypass a denial. If only configured Development Branch is allowed, document the gap and seek existing proper branch-governance authority, or perform only read-only design/fixtures.
- Baseline results cannot be rolled into the Candidate starting state. Authoritative output locations for official Jobs, Runs, Verifications and cursors remain in Project Memory; source changes belong to authorized Product branch.

## 3. Candidate G3 implementation and activation
- G1 is NARROW: compare a minimal adaptive reading guide only if full-work evidence justifies it. Do not add unconditional mega-guidance.
- G2 is conditional provenance mechanism: preserve original full applicable Criteria sections and Acceptance, exact provenance + SHA beside authoritative GOAL, multi-origin/duplicate/fenced headings/revision changes, scoped inverse-sibling lookup and safe UNKNOWN for incomplete coverage. Reuse existing carrier; do not assume a new schema/index/role restriction. GH navigation helper is NO_BUILD.
- Verify actual `get_agent_harness` model-facing payload / candidate source mapping on the execution surface. `start_direct_agent` admission to the production GSA endpoint does **not** prove a separately deployed or locally patched Candidate was loaded. Probe exact candidate code version/harness response and execution control before the G3-on-WS run. Failure = `CANDIDATE_ACTIVATION_UNVERIFIED`/BLOCKED, never relabel production baseline.
- Keep Skill definitions/dispatch constant and execute same WS as BASE-S. Measure all tool calls, retries, extra Criteria reads and work quality, not a single smaller section response.

## 4. Candidate Skill implementation and activation
- C1a is conditional, descriptions-only, limited to existing `description` strings after independent baseline selection ambiguity; preserve all 13 names, complete bodies, Role suggestions unless separately authorized, `required_skill_contexts` injection, schema, semantics and G3 baseline.
- C1b discovery hint remains HOLD absent observed missing catalog discovery; C2 bodies split/reduction NO_BUILD. Describe catalog-discovery D separately from post-catalog selection S, optional body load L, correct no load N, mandatory NEXT injection I and Role obligations M.
- Verify actual Candidate Skill catalog/source revision is in the Direct Agent's execution surface; changing a Git file is insufficient proof. If only the production Skill catalog is callable, label Candidate trial BLOCKED.
- Execute same WG as BASE-G, with no copying baseline solutions or evaluator's answers.

## 5. Attestation, metrics, evaluation, negative cases
Each of BASE-G, BASE-S, G3-on-WS, S-on-WG produces a read-back report with arm/Job Pack/Role/Agent-session (if observable), exact B or Candidate Harness and source SHA, starting branch+fixture SHA, final source/output blobs, tests, reviewer receipt, model/effort/environment, observed timestamp and honest PASS/PARTIAL/BLOCKED.
Quality-first oracle uses full real deliverables, authorized GOAL/Criteria/HOW and M1-03 safety regressions. Only then measure source UTF-8 bytes/chars, actual Model/Host tokens when accessible, tool calls, rereads, optional Skills and separately observed connector/network latency. Unknown Host tokens/caching/E2E latency must be UNKNOWN; never double-count structured + text output without proof. CI PASS proves only its exact checks and commit.
Independent Reviewer/Tester compares only G3-on-WS vs BASE-S, S-on-WG vs BASE-G, with both output SHAs and confounders, repeats where possible. Any critical governance or correctness regression vetoes a claimed performance win.

## 6. Job Instructions and continuous dispatch
Planner owns WHO/WHAT/WHERE, input sources, dependencies, output/evidence, recipient, closure and required first reads. Create one concise `instruction.md` per meaningful Job Pack in the verified current Job/Milestone carrier, **not** a new global document type or one per Task. The agreed Human choice of durable per-Pack instructions supersedes earlier discussion's blanket no-file suggestion for this M3 program; it does not authorize a new storage schema.
- Producer/consumer instructions must point to same handoff. Provisional placeholders are explicit, never invented SHAs; Planner patches verified predecessor receipts before dispatch.
- Orchestrator/NEXT consults durable state and existing authority and dispatches only eligible work. A Coder lacking a current instruction routes `WAITING_FOR_INSTRUCTION` to Planner; review/QA remains independent.
- Prove the installed runtime can dispatch sequential Role/Direct Agent sessions and use the intended instruction. If not, report exact capability gap, owner and safe boundary; do not assume an autonomous worker. No Human prompt for ordinary verified transitions unless an actual gate exists.
- Functional tests include correct initial source routing, stale instruction repair, parallel dependency handling, missing precursor SHA, interruption/resume, denial, successful handoff and branch closure. **No token-saving/latency A/B for Job Instruction**.

## 7. Convergence and abort rules
Independent JP-EVAL sets per Candidate disposition MERGE_CANDIDATE, NO_BUILD_RETIRE, NEED_MORE_EVIDENCE or BLOCKED. JP-CONVERGE receives all exact SHAs, branch inventory, tests and receipts; reconciles changes, performs authorized selected integration into development, independent regression and records every branch's final status. Human KEEP refs preserved. No main merge or deploy without separate Human decision.
Stop for real permission denial, absent Candidate activation, frozen-fixture contamination, irrecoverable evidence/provenance mismatch, supported Human gate or unchanged no-progress fingerprint; preserve PAUSED state/owner/SHA, do not fabricate a completed branch lifecycle.

## 8. Technical acceptance
Technical Proposal ready for implementation gate only when independent planning review finds no missing canonical Goal, Task carrier, branch authorization rule, workable fixture/evaluator separation, Candidate activation strategy, independent Reviewer contract or orphaned downstream pack. Source implementation remains separately Human-approved; Product test and performance gains remain NOT_RUN until observed.
