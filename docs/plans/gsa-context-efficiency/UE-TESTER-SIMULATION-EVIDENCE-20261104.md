# U-E — Tester Simulation: source verification, frozen oracles and U-F handoff

**Track:** U-E / U-07 / BP-07. **Scope:** existing Tester role + on-demand skill + Test Lab.  
**Exact independent base:** `36e98c16577583432c73e2b93522ef408f60414c`. **PR:** #63 targeting `main`, draft/CI-only; **DO NOT MERGE**.

## UE-01: actual simulate source and installation boundary

Bootstrap source: `thebimhouseinfo-sudo/bootstrap/project-template/.agents/skills/simulate/SKILL.md`, verified Git blob `5b55a25057d2a33b320e54840f5578d81269c8b0`. Five **original** reference files were read: `app-brief-template.md` (`caa39ae8`), `input-catalog.md` (`028e37c0`), `external-mocks.md` (`bd6dcc5d`), `harness-playwright.md` (`a48eeda9`), and `example-autocad-addin.md` (`293bf013`). The directory also contains a **sixth** file, supplemental `bootstrap-causal-fanout.md` (`4a66ceb1`), which was read for user action → child-flow causality. Source content and hashes are **SOURCE_VERIFIED**; original ChatGPT-installed `scenario-tester` activation and Autodesk Host execution are **UNVERIFIED**.

The GSA `simulate` skill is a concise sourced adaptation, discoverable with `get_skill_catalog` and loadable by `load_skill`. It is not the host-managed `scenario-tester`. Only Tester owns this method and the existing TEST/RETEST evidence path. The method does not introduce Simulation Role/Job or any new CAS/Run state.

## UE-02: the oracle is designed first, before tracing source

Frozen user-facing oracle artifact: `test-lab/scenarios/tester/UE-S1-S4-ORACLES.json`, initial committed revision `05057c4abbdd621759ea9634811af6a9d5f18a97`. Each case records persona, why a real user performs it, entrypoint, criteria-derived observable result and pass/fail boundary profiles. **The design fixture must not be retroactively edited to match code**. Material new expectations require a new oracle revision with an explicit user/Criteria source.

Design and tracing were authored in **one** conversation that had already inspected source; therefore strict *independent, source-blind Designer execution* is **UNVERIFIED**, despite written oracles being drawn from the Human prompt and Detail Plan rather than handler names. Integration must rerun source-blind design independently if that degree of assurance is required.

Tracer must observe: User root ID → public router/tool/handler → each child root/parent/spawn reason → Project/Job/Run ownership → exclusive CAD resource/queue/lease → SYSTEM side-effects → callback and wait-for graph → file/persistence/Host ACK → terminal outward response. `DONE` is invalid while a required child remains `WAITING` or has an unverified save.

## UE-03: S1–S4 expected oracles and negative controls

| ID | Realistic user journey | Positive expected oracle | Negative/failure expected oracle |
| --- | --- | --- | --- |
| **S1** | Normal click to create one CAD change | One authorized CAD child; only actual Host ACK marks DONE | Host failure marks FAIL; duplicate ACK has no new effect; mere dispatch is not success |
| **S2** | Create → Run → Save → Reopen | Ordered completion and confirmed persistence before claiming saved state | Failed save never produces “saved PASS”, even if create and run succeeded |
| **S3** | One click, impatient repeat, two chats modifying one drawing, independent SYSTEM logging | Duplicate request deduplicated; Chat B waits behind Chat A's exclusive CAD resource; SYSTEM may run concurrently; no lost callback | **Double CAD spawn from ONE click is a violation even if both are serialized**; deliberately bypassing CAD exclusivity must be detected; duplicate/reordered callback cannot double-commit |
| **S4** | Invalid input; cancel; close/reconnect; outdated planning revision and late Host ACK | Invalid/stale writes blocked; canceled/closed child not resurrected by late ACK; reconnect supports next valid request without stranded resource | Deliberately accepting a stale ACK or bypassing planning revision must be detected and classified; no falsely completed old Run |

Each case has an explicit pass/fail synthetic external boundary profile and positive/negative controls in `test-lab/ue-tester-simulation.test.cjs`. The test model deliberately injects four defects: `doubleSpawn`, `concurrentCad`, `lateAck`, and `staleBypass`. The oracle should detect those defects. These are **mock-level counterexamples**, not claims that real GSA/AutoCAD currently has those defects.

**Run tests:**

```bash
node --test test-lab/ue-tester-simulation.test.cjs test-lab/scenario-tester-integration.test.cjs test-lab/gsa4-integration-parity.test.cjs
deno check supabase/functions/gsa-mcp/index.ts
```

CI additionally runs the repository's complete pinned GSA4 parity set via `.github/workflows/gsa-next-logic.yml`. Full GSA4 parity intentionally normalizes the **explicit U-E skill/Tester text delta only**; unrelated role, tool, schema, checkpoint, Job, Run, CAS, and evidence behavior must remain unchanged.

## Evidence fidelity: what each passing test does — and does not — prove

- **STATIC:** GitHub source inspection / code contracts, with exact branch and source ref. No execution claim.
- **SIMULATED:** Node-executed synthetic Host/queue/callback model, with intentionally failing behavioral controls. Validates method/fixture sensitivity only.
- **REAL_HOST_UNVERIFIED:** no real AutoCAD/Revit command, geometry, ESC behavior, file save/reopen, runtime session or native crash behavior was exercised.
- **Real Host PASS:** **not issued**. Requires authorized isolated real target, exact build/active drawing and Host log/evidence showing all relevant child flows and external results. A mock PASS cannot satisfy a required native EvidenceRequirement.

## U-F integration handoff

Use frozen IDs `S1` through `S4` as baseline regression-oracle references. For a defect, record **original user root input**, `source revision + Run ID + reproducible interleaving seed`, child-flow causal graph, **first deviation from frozen expected oracle**, failure classification, and exact real-vs-mock fidelity. A later repair must independently rerun the failing scenario **and impacted prior PASS cases** on the repaired exact SHA. Do not call a different defect the same one, do not reset evidence by renaming chat/Job, and do not advance a native Host gate using the synthetic model. The eventual U-F three-retest escalation and advanced debugging remain U-F's own responsibility; this branch neither implements nor changes that policy.

**Current audit limitations:** Source-verification and code wiring are confirmed via GitHub readback. Runtime CI conclusion and real-host evidence must be attached to exact HEAD when available; no silent PASS inferred from an enqueued workflow.
