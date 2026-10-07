# P3 — NEXT cutover / retirement inventory

Status: **INVENTORY COMPLETE; DISPOSITIONS PENDING P3 Task 32**  
Source baseline: `f13bc6e22b5321698e3b4a2986c5e43c658edf57`  
Owning Job: `J-7793`  
Policy source: WL-029 / Correction P3.

## Inventory rules

Every staging-only or compatibility surface that can affect NEXT persistence, endpoint identity, creation defaults, or historical V2_STABLE behavior must appear below with an explicit owner. Missing rows or unknown ownership are promotion blockers. Task 31 inventories current behavior only; Task 32 must replace every `PENDING` disposition with exactly one of `KEEP`, `REPLACE`, or `REMOVE`, plus production target or retirement evidence.

| ID | Surface | Current behavior / evidence | Owner | P3 disposition |
| --- | --- | --- | --- | --- |
| P3-C01 | NEXT memory root | `executionMemoryRoot(..., NEXT)` resolves to `projects/<project-id>/TEST-LAB/NEXT`. | runtime path contract / `gsa-mcp/index.ts` | PENDING |
| P3-C02 | NEXT Job/Run/Handoff/Attempt paths | `recordPath` derives all NEXT `WORK/JOBS`, `WORK/RUNS`, `WORK/HANDOFFS`, `WORK/CHECKPOINT_ATTEMPTS` below the NEXT memory root. | runtime path contract | PENDING |
| P3-C03 | NEXT Verification paths | `verificationPath` derives NEXT Goal Recheck / REVIEW / TEST / RETEST / EvidenceBundle attestations below `TEST-LAB/NEXT/VERIFICATION`. | runtime verification contract | PENDING |
| P3-C04 | NEXT checkpoint claim namespace | `checkpointClaimPath` derives deterministic claims below the NEXT memory root. | checkpoint runtime | PENDING |
| P3-C05 | Staging MCP endpoint | source routes `/gsa-mcp-next` to the same app as a separately deployed staging Edge Function. | Edge Function routing / staging runtime ops | PENDING |
| P3-C06 | Endpoint-aware OAuth/resource base | `edgeFunctionBase` preserves `gsa-mcp-next` when the incoming request is the staging endpoint; otherwise it resolves `gsa-mcp`. | OAuth/resource routing | PENDING |
| P3-C07 | Production MCP endpoint | source also routes `/gsa-mcp`; current production deployment remains the V2_STABLE-compatible line and is not changed by P3. | production runtime ops | PENDING |
| P3-C08 | Missing-discriminator compatibility default | `DEFAULT_EXECUTION_CONTRACT = V2_STABLE`; missing historical discriminator is interpreted as V2_STABLE. | execution-contract compatibility fence | PENDING |
| P3-C09 | New Job creation default | `job_prepare.execution_contract` currently defaults to `V2_STABLE`. | Planner / Job creation contract | PENDING |
| P3-C10 | Runtime status/default reporting | `gsa_status` and `/health` report the current execution-contract default. | runtime observability | PENDING |
| P3-C11 | NEXT staging selftest assertions | selftest explicitly asserts NEXT paths under `TEST-LAB/NEXT`, staging endpoint base, and V2_STABLE missing-discriminator behavior. | regression suite / `/selftest` | PENDING |
| P3-C12 | Repository Test Lab assets | `test-lab/**` fixtures/scenarios/results are non-production test assets used to exercise NEXT behavior. | repository Test Lab | PENDING |
| P3-C13 | Deployed `gsa-mcp-next` function identity | staging is deployed as a distinct Supabase Edge Function; this deployment identity is outside git source but is required for isolation evidence. | Supabase staging runtime ops | PENDING |
| P3-C14 | Durable Memory Repo lab records | existing NEXT correction records live under `projects/<project-id>/TEST-LAB/NEXT/**`; historical lab evidence must remain resolvable after release. | configured Memory Repo / Project control plane | PENDING |
| P3-C15 | Historical V2_STABLE record locations | historical/missing-discriminator records continue under `projects/<project-id>/WORK/**` and `VERIFICATION/**`. | compatibility fence / Memory Repo | PENDING |
| P3-C16 | Alternate-line automatic NEXT default | commit `eb26729...` changed Job creation default to NEXT on an excluded alternate line; it is evidence only and is not canonical P3 source. | correction governance / branch audit | PENDING |

## Completeness boundary

The inventory was derived from the exact post-P2 runtime, its path helpers, Job creation/default contract, endpoint routing, selftests, repository Test Lab assets, the active separate staging deployment, and durable Memory Repo staging layout. Shared browser/evidence endpoints and generic EvidenceBundle storage are not staging-only by identity and therefore are not cutover rows unless P3 implementation changes their routing.

## Blocking rule for Task 32

Promotion readiness is false when any row:
- is missing an owner;
- has `PENDING` / unknown disposition;
- uses `REPLACE` without an explicit production target;
- uses `REMOVE` without retirement/preservation evidence;
- weakens the missing-discriminator V2_STABLE compatibility fence.

Task 32 must turn this inventory into executable/runtime-checked cutover readiness without changing production `main` or the deployed production `gsa-mcp`.
