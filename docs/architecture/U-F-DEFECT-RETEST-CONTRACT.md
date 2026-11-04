# U-F — Three-cycle defect/retest contract (source-only track)

Common base: `36e98c16577583432c73e2b93522ef408f60414c`. This work branch does NOT consume unmerged U-E/U-D code.

## Identity and source of truth

A defect is anchored to `(project_id, first failing Verification ref, original failing source revision, actual_error, user-visible symptom, ORIGINAL user-action reproduction, required execution surface)`. Chat ID, Job ID, task title and bug title are not part of identity. A genuinely different first failure / reproduction must be evaluated separately. Changing the wording or title without changing the original evidence does not create a new defect.

All accepted history comes from the **existing** Project Memory records, not from chat:
- First TEST/RETEST failure Verification and frozen reproduction evidence (including what the user actually clicked/did).
- Authorized Coder Run and exact Git patch revision; existing source-write authorization evidence and Goal Recheck target revision.
- Independent Tester Run with TEST/RETEST Verification, actual original-trigger and impacted-regression rerun; exact source revision and persisted/read-back Verification ref/SHA. Existing Handoff references connect Run ownership as needed.
- Source/Host readiness, deployment revision and scenario seed when applicable.

The existing `run_verification_record` and checkpoint Verification paths already persist these records. Follow the normal `authorize_memory_mutation`, GitHub CAS, immutable append/readback and execution-contract requirements. Do not add a Defect database, Job/Run lifecycle, MCP tool, shadow permission gate or automatic patch operation. Optional **Advanced Defect Report** is a regular authorized Project Knowledge/Evidence artifact pointing to the original records; it is not a new authority.

## Read-only reconstruction

`harness/skills/retest-history.ts` exports:
- `defectIdentity(origin)`: canonicalizes original evidence and user-trigger identity; title/Chat/Job changes do not reset it.
- `assessDefectRetests({origin,attempts,history_complete,history_evidence_refs,early_escalation_evidence})`: re-evaluates the full durable history every time. A counted cycle requires a distinct authorized Coder patch + same revision Goal Recheck + **separate** Tester Run and persisted exact-revision evidence, with original trigger and regressions rerun and the required execution surface. One patch revision counts at most once. Independent Tester PASS is the only valid closure; Coder selftest or CI green is not.
- `advancedDefectReport`: generates a descriptive report with original reproduction, exact Coder/Tester revision chain, evidence, scenario seeds, causal timeline, first **evidenced** divergence or UNKNOWN, hypotheses/confidence/discriminating probes, lowest-risk correction proposal, regression plan and unknowns.

The helper is **advisory/read-only** and consumes snapshots supplied after readback. A caller-provided ref/SHA or `history_complete=true` is not itself a GitHub persistence attestation. The Agent must first independently scan/read back matching records across all relevant Jobs in the same Project Memory namespace and verify SHA, role, original/effective target revision, authorization and Tester execution. Missing history returns `READ_HISTORY`. A required Host unavailable or missing complete scenario returns `AWAIT_TESTER` / UNVERIFIED, never Product FAIL. Contradictory independent retest verdicts on the same revision require reconciliation.

After three complete unsuccessful PRODUCT_FAILURE cycles, status is `ROOT_CAUSE_REQUIRED`. **STOP ordinary patch #4**; use on-demand existing `debugging` Skill, expand input→entrypoint→all child flows→queue/state→tool→Host→observable causality, and report the earliest evidenced divergence. Severe observed races/architecture faults can escalate earlier. Future correction is a *new separately scoped/authorized* action after existing design/Reviewer gates, not an automatic fourth attempt.

No unconditional server-side patch prevention is claimed: GSA has no central patch executor and this helper deliberately does not invent one or trust unverified caller-provided history. The Agent role/handoff rules enforce the workflow by requiring readback before any subsequent repair. An automated authoritative fourth-patch gate would need a separately reviewed source-of-truth integration change.

## U-E integration contract — mandatory acceptance after branch integration

Do **not** import `simulate.skill`, `scenario-tester`, U-E worktree modules or mock their existence. U-F currently uses only `test-lab/fixtures/uf-independent-tester-cases.json` with synthetic FAIL / PASS / UNVERIFIED examples.

After integration with U-E, replace the synthetic scenarios with actual frozen U-E Tester Designer/Tracer scenarios. Each real scenario must supply:
1. Original user action and seed, actual observed error/symptom, expected behavior and required Host/simulation level.
2. Every causally relevant child flow and its wait/queue/resource/Host outcome, including interleavings, cancellation and reconnect if applicable.
3. Exact Coder source/Host revision and authorization/Goal Recheck plus a separate Tester Run.
4. Immutable persisted Verification path and SHA readback for each of the up to three attempts; rerun original trigger AND impacted passing regressions.
5. Distinct `PASS`, genuine evidence-backed `PRODUCT_FAILURE`, `UNVERIFIED` and `ENVIRONMENT_FAILURE` classifications.

Then rerun U-F tests on real U-E scenario evidence and host-appropriate execution. Until that integration and readback succeeds, **U-F U-E integration acceptance = PENDING** and no real Host behavioral PASS is asserted.

## Negative controls

1. Cycle #1 FAIL → scope-authorized repair may be considered.
2. Cycle #2 FAIL → first revision/history retained.
3. Cycle #3 FAIL → ROOT_CAUSE_REQUIRED; no ordinary fourth patch.
4. Host unavailable → UNVERIFIED, no product-failure count.
5. New Chat/Job/title → same defect identity, no reset.
6. Different original defect → separate history.
7. Coder self-check PASS + Tester FAIL → defect remains open.
8. Duplicate same patch not double counted; conflicting verdicts require reconciliation.
9. Missing source write authorization/Goal Recheck/independent Tester/readback → incomplete, not counted.
10. Advanced Defect Report does not invent first causal divergence if evidence is missing.

Run `node --test test-lab/uf-three-cycle-retest.test.cjs` with TypeScript 5.9.3 available, the complete GSA4 Node parity suite, and `deno check` on the Edge Function and U-F helper. GitHub PR CI is only CI, not automatic merge/deploy.
