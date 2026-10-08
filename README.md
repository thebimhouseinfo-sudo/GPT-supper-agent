# GPT Super Agent (GSA Online)

ChatGPT-native orchestration for durable, reviewable project work. A chat is the interface; **GitHub source repositories** and the configured private **GitHub Memory Repo** are the authoritative state. A successful tool response or chat message alone is not a persisted completion.

## Current release (2026-10-08)

| Component | State |
|---|---|
| Canonical source | [`main`](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/tree/main) at release merge `0b079583cb55b11a8cceb535dc15a483bbafe870` |
| Supabase production MCP | `gsa-mcp` **v44 ACTIVE** |
| Source verification | deployed `index.ts` read back and byte-equal to release source |
| Authenticated smoke | PASS: authenticated, Memory Repo configured, NEXT production cutover reported ready |
| MCP checkpoint public-path probes | three tools callable; negative/fail-closed cases observed |
| CI on promoted source | Deno typecheck and bounded helper regression PASS |
| Full CP7 / 14 scenario durable E2E | **NOT EXECUTED / NOT VERIFIED**; Human accepted release without requiring this gate first |
| Rollback reference | production `gsa-mcp` v43 source (capture a verified prior source before any rollback) |

**Evidence status matters:** release approval is a Human decision; it does not turn unexecuted E2E, concurrency, crash recovery, or host/platform checks into PASS. Source build ID `P3-J-7793-R2` is a build marker, **not** an exact Git SHA.

## Execution model

```text
Project → Job → Task → Run → durable Verification / Handoff
```

- New Jobs created on production default to `execution_contract=NEXT`, with `memory_namespace=PRODUCTION`.
- Historical Jobs with absent `execution_contract` remain **V2_STABLE**. Do not bulk-migrate or implicitly rewrite them.
- Staging surface `gsa-mcp-next` is separate and defaults to V2_STABLE unless NEXT is explicitly selected; NEXT test memory is isolated in `TEST_LAB`.
- Planner captures first-class evidence needs, checkpoints, milestones, dependencies and planning revision.
- Tester supports `VERIFY`, `MEASURE`, `PROBE`. Required NEXT evidence/checkpoint gates fail closed; `PASS_RETEST_REQUIRED` is not a gate bypass.
- Checkpoint claim/lease uses deterministic paths and exact GitHub blob SHA compare-and-swap; Verification is applicable only when the terminal claim references matching attempt/token/revision and verification.
- Failed checkpoints route to Coder repair + Goal Recheck + RETEST, or a reviewed Planner supersession for PLAN_GAP/SPEC_GAP.
- Reviewer assesses relevant code and evidence at checkpoints. **Critic Reviewer (CR)** is optional and Human-invoked only, and must reconstruct independent evidence.

## Architecture and authority

```text
Conversation / ChatGPT plugin = UI and tool orchestration
Supabase Auth              = authenticated GSA identity
Supabase                   = per-user Memory Repo configuration and authorized evidence support
GitHub Memory Repo         = durable project/control-plane records
GitHub source repositories = source-code truth
Harness + Skills + Loops   = agent operational contracts
```

One configured private GitHub Memory Repo holds records below `projects/<project-id>/` (`PROJECT.md`, `WORK/`, `VERIFICATION/`, `KNOWLEDGE/`, optional rebuildable `CONTROL.json`). External GitHub source repositories stay separate. Mutations require active Project/repository scope, authorization, exact current SHA, and post-write read-back. Cross-project source writes are prohibited.

## Workflow and quality rules

1. **Re-ground** the active Project, canonical source, Job planning revision and last durable checkpoint before execution. Fresh chat starts in planning/discussion mode, not implicit coding.
2. **Bound the work** by meaningful Task/Job context and one canonical integration line; use checkpoint-based review and merge promptly.
3. **Do not infer PASS** from a prepared record, green CI, tool presence, or simulated helpers alone. Distinguish `PASS`, `FAIL`, `BLOCKED`, `UNAVAILABLE`, `UNVERIFIED`.
4. **Test the assertion itself** on high-risk gates: verify negative control, exact source revision and real call path. Reviewer inspects test scripts selectively when tests/harnesses change or a release depends on them.
5. **Debug end-to-end** when a bug is non-trivial: observed symptom → entrypoint/call-chain + root-cause map → minimal patch → CI → behavioral simulation → live host acceptance when required.
6. **Resume from durable truth** after interruption; never blind retry an unknown write. Avoid livelock through bounded retries and no-progress detection.
7. Production deploy and final merge require separate Human authorization. Keep rollback points and report untested acceptance scenarios honestly.

These are workflow directions, not a claim that all new lessons have already been implemented in runtime. See the improvement plan below.

## Runtime and verification

Primary implementation: `supabase/functions/gsa-mcp/index.ts`.

- Production `gsa-mcp`: deployed v44.
- Staging `gsa-mcp-next`: isolated surface; **do not assume** its version matches production.
- Auth and status: `get_runtime_status` confirms surface, identity, cutover default and Memory Repo binding.
- Checkpoint public tools: `checkpoint_claim_prepare`, `checkpoint_verification_prepare`, `checkpoint_gate_evaluate`.
- CI: `.github/workflows/gsa-next-logic.yml` invokes `deno check supabase/functions/gsa-mcp/index.ts` and `node --test test-lab/runtime-logic.test.cjs` (isolated TypeScript parser install).
- CI helper tests use some stubs and a model-only CAS collision; they do **not** constitute live concurrent GitHub writes or crash/resume proof.

Do not execute real checkpoint mutations against existing Projects merely to demonstrate readiness. Use a dedicated authorized test Job and exact persisted SHA for any future full durable E2E.

## Canonical documents

- [Architecture index](docs/architecture/DOCUMENT-INDEX.md)
- [Execution and review](docs/architecture/EXECUTION-AND-REVIEW.md)
- [Workflow lessons ledger](docs/process/GSA-WORKFLOW-LESSONS-LEDGER.md)
- [Post-release lessons remediation plan](docs/plans/POST-RELEASE-LESSONS-REMEDIATION-2026-10-08.md)
- [Upgrade integration roadmap](docs/plans/GSA-UPGRADE-INTEGRATION-ROADMAP.md) — historical CP0–CP7 upgrade/release plan, not the current runtime status
- [Test Lab](test-lab/README.md)

Release evidence: [PR #17](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/17), including CI, v44 deploy read-back, authenticated smoke and checkpoint-tool fail-closed probes.
