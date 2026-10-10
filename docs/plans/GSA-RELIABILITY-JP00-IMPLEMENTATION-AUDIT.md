# JP-00 — Runtime ownership, overlap and test-floor lock

Implementation branch: `upgrade/gsa-reliability`. Baseline: `main` at `203d1019ba5cdbffdf6ceebdce048c66dc9a4a1a`; production runtime `gsa-mcp` v44. All code/CI changes stay on this branch.

## Re-grounded boundaries (current source inspected)

- `supabase/functions/gsa-mcp/index.ts`: `executionMemoryRoot`, `recordPath`, `parseDurableSnapshots`, `checkpointClaimPath`, `checkpointLeaseExpired`, `validateCompletedTaskRunSnapshots`, and `checkpointVerificationApplicable` already bind NEXT Tester claim/evidence to deterministic paths and revisions. **Do not create a second checkpoint lease or Job lifecycle.**
- GitHub source writes are performed by the **ChatGPT orchestration / GitHub connector**, not through an always-on Supabase worker. MCP can prepare/validate records and return fail-closed results but cannot intercept an external GitHub connector write or recover while the chat is closed.
- `STATE-MACHINE.md` and `JOB-LIFECYCLE.md`: Job terminal = COMPLETED/CANCELLED/SUPERSEDED; Run terminal = COMPLETED/FAILED/CANCELLED/SUPERSEDED. `PAUSED_NO_PROGRESS` is a **derived orchestration disposition**, never a stored lifecycle enum.
- `RUNTIME_SKILLS` + `get_skill_catalog` + `load_skill` are live skill surfaces. `ROLE_SKILLS.coder` retains `coding-loop` and `delegation`; debugging is opt-in only.
- Public function `gsa-mcp-next` defaults to V2_STABLE + TEST_LAB. Any staging NEXT Job must explicitly select `execution_contract=NEXT` and `memory_namespace=TEST_LAB`; stage deploy and byte readback are required before claims of stage E2E.

## Decision: derive before persist

The existing Job/Run/Verification records identify durable role progress, but **GitHub external write intent is not automatically persisted by MCP**. We cannot infer if an unacknowledged source mutation happened solely from chat history. Instead of adding a second mutable Job state record now, expose a narrowly scoped **read-only recovery preflight** that consumes a caller-obtained current Git head/blob and immutable intent evidence:

```text
current authoritative source readback + expected source/operation fingerprints
→ classify APPLIED | NOT_APPLIED | UNKNOWN_CONFLICT
→ allow one next action only when unambiguous
```

- APPLIED requires exact independently reread expected tree/blob, not just an advanced branch.
- NOT_APPLIED requires a known prior head + proof target was unchanged relative to expected; other ambiguous head/path state must STOP/UNKNOWN.
- UNKNOWN_CONFLICT = no retry / do not recode / Human or Planner reconciliation.
- No promise of automatic resume after chat interruption. Re-run the preflight when a new invocation begins.
- A failed/denied Memory Repo lifecycle write is independently reread; prepare response is never persistence proof.

**New persisted cursor schema: deferred.** JP-10 may only add one if a reproducible missing-state counterexample remains after derived recovery checks and an explicit review/Human schema decision. No durable state changes required for this first implementation.

## Ownership and test gate

| Contract | Owner | Early oracle |
|---|---|---|
| Git lost-response readback | Orchestrator → GitHub connector; pure MCP recovery preflight | expected unchanged / applied / divergent head/blob cases, including negative controls |
| Progress/livelock | Orchestrator loop, with pure MCP progress evaluator | fingerprint repeats 3 times → derived pause; changed durable SHA resets |
| Test validity | Coder writes behavior assertions; Reviewer checks changed/high-risk tests at CPs | known-bad recovery function must turn assertion RED; mock-only CAS explicitly marked MODEL_ONLY |
| Debugging | Conditional Coder skill selected via catalog/load_skill | callable new skill; ordinary Coder still loads only default skills |
| Stage validation | Tester with authorized Test Lab Job | exact `gsa-mcp-next` deployed source + explicit NEXT/TEST_LAB; no production reads/writes for staging checks |

**JP-00 gate:** capability/readback evidence classified accurately; no new schema; Reviewer may proceed to code only with negative-control tests that exercise the pure preflight decision and fail for known bad behavior.

## Release rules

1. Each meaningful JP checkpoint: source diff → executable tests → Reviewer → merge to the **same integration branch** (never directly to main).
2. Compare main ancestry at each checkpoint; reconcile production hotfixes explicitly.
3. No production deploy or merge to main until the complete reviewed upgrade passes, plus separate Human release approval.
