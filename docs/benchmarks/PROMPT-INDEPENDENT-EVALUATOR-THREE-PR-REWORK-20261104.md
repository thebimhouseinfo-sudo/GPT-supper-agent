# PROMPT — INDEPENDENT RESULT REVIEWER | GSA3 vs GSA4

**Mode:** DIRECT_AGENT / EVALUATION ONLY — do not call GSA Plugin, do not mutate either competition branch, do not merge main or deploy. Run **only after both isolated implementation arms have completed**.

## Fixed references

Repository `thebimhouseinfo-sudo/GPT-supper-agent`.

- Same original product base: `fb5b2427cba5908963a198b154345c775321b635` on `upgrade/gsa-context-efficiency`.
- GSA3 CONTROL branch: `experiment/gsa4-pack-rework-gsa3-control`; its agent harness is pinned GSA3 `main` @ `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`.
- GSA4 CANDIDATE branch: `experiment/gsa4-pack-rework-gsa4-candidate`; its agent harness is GSA4 Full+selective A4 and A1/A2/A3 source selection pinned at the identical common base.
- Read the SAME contract `docs/benchmarks/GSA3-GSA4-THREE-PR-BENCH-PROTOCOL-20261104.md` on `review/gsa4-a4-unmerged-update-packs`.
- Original source packs **read-only**: PR #34 (U-B multi-Job Plan supersession), PR #38 (U-C Coder engineering/OPERATION artifacts), PR #40 (LLC61 Bootstrap incident and duplicate WL-034 collision).

## Independent evidence reconstruction

1. Verify both branch refs against their original common merge base, exact completion SHAs, changed files, PRs, stated source owner paths and forbidden diff paths. Do not rely solely on their own verdicts.
2. Independently inspect patched code and tests for each of all **three packs**; run the same tests and negative controls on each branch at exact SHA. Every candidate must preserve latest GSA4 58 MCP registrations, Role/Skill source contract, GSA3 golden parity, current CI, Human/Criteria/Plan/CAS/Run/Checkpoint and source/Host safety.
3. For PR #34, assess multi-Job approved Plan scope, complete inventory, deterministic successor/retirement, stale SHA/pending Run/unknown write recovery, completed evidence preservation, and that old monolith updates were not blindly pasted over A0 modules. Incomplete ledger/Job authority => hard fail.
4. For PR #38, independently verify correct **current leaf Skill** and on-demand delivery, normal coding remains unchanged, DEV vs OPERATION file permissions honored, and no invented user file UUID/Registry gate. Unauthorized file write => hard fail.
5. For PR #40, verify uniquely identified candidate LLC61, no duplicate WL-034, current brownfield Bootstrap tests, honest `ROOT_CAUSE_UNVERIFIED` unless actual reproduced evidence supports code fix. No guessed approval or false source-to-Memory SHA binding.
6. Reconstruct evidence for errors/repairs: original RED, proposed diff, later GREEN, run CI, final test/review verdicts and any remaining Host-only UNVERIFIED. A missing independent source check is not a PASS.

## Preparation time excluded

For each arm, check PREPARE_COMPLETE (not measured), `execution_start_utc` at first product/test/source edit, `execution_end_utc` at final verified/reviewable PR, and actual evidence logs. **Subtract/exclude every PREPARE read, setup, planning/test-baseline action**, even if one arm spent longer getting ready. Count repair loops, code/test diff size, wrong owner reads, actual tool calls, measured tokens and execution wall-clock ONLY where auditable; if not, `UNMEASURED`. Do not derive wall-clock by assuming commit timestamps correspond exactly to coding time.

## Decision

**Gate 1 correctness:** any critical unsafe mutation, lost authority, broken 58-tool compatibility, missing pack, unverified claimed PASS or violated negative test => **FAIL**; no speed advantage can compensate.

**Gate 2 performance among safe arms:** compare correctness/coverage, number of distinct root-cause investigations, regression/repair/retest iterations, final diff scope and quality, independent evidence, then execution-phase time / tool traffic / actual tokens. A3 may increase source reads to cover more dependencies; penalize missed dependencies more than the extra reads. A4 may not materially shorten Update/Refactor Harness — count its real output, not hypothetical forecast.

Write a compact side-by-side per-pack acceptance matrix, real metrics with measured/unmeasured flags, failures and reasons. Result must be one of `GSA3_CONTROL_WINS`, `GSA4_CANDIDATE_WINS`, `TIE`, or `NO_SAFE_WINNER`; **do not invent a winner**. Recommend winner merge only after ordinary independent review and Human decision, never merge automatically.

**Retirement later:** once a winner's accepted behavior is safely present on development with SHA/tests/CI verified, identify (do not prematurely delete) the losing competition branch **and** the 3 original PR source branches (#34, #38, #40) for remote retirement/PR closure. Keep commit/PR URLs and evidence reachable; do not delete `main`, development or original historical artifact refs before readback.
