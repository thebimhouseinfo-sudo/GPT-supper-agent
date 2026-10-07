# P3 — NEXT cutover / retirement inventory

Status: **TASK 32 RESOLVED — ZERO UNRESOLVED ITEMS**  
Post-P2 baseline: `f13bc6e22b5321698e3b4a2986c5e43c658edf57`  
P3 runtime candidate: `e9c3af7fe01a3dddee3fa1d585f9c0c5b759758a`  
Owning Job: `J-7793`  
Policy source: WL-029 / Correction P3.

## Cutover rule

Every staging-only or compatibility surface that can affect NEXT persistence, endpoint identity, creation defaults, or historical V2_STABLE behavior has an explicit owner and exactly one disposition: `KEEP`, `REPLACE`, or `REMOVE`.

Runtime `cutoverInventoryError()` carries the same 16 IDs and fails closed when a row is missing/duplicated, has no owner, has an unresolved disposition, uses `REPLACE` without a production target, or uses `REMOVE` without retirement evidence.

| ID | Surface | Owner | Disposition | Production target / retirement evidence |
| --- | --- | --- | --- | --- |
| P3-C01 | NEXT memory root | runtime path contract | REPLACE | NEXT gains `memory_namespace`. `PRODUCTION` resolves to `projects/<project-id>`; `TEST_LAB` resolves to `projects/<project-id>/TEST-LAB/NEXT`. |
| P3-C02 | NEXT Job/Run/Handoff/Attempt paths | runtime path contract | REPLACE | All child paths inherit the owning NEXT Job/Run namespace. |
| P3-C03 | NEXT Verification paths | runtime verification contract | REPLACE | Goal Recheck, REVIEW/TEST/RETEST, planning review, critic review and EvidenceBundle attestations use the owning namespace. |
| P3-C04 | NEXT checkpoint claim namespace | checkpoint runtime | REPLACE | Deterministic claim and attempt paths inherit the owning NEXT Job namespace; cross-namespace snapshots are rejected. |
| P3-C05 | staging MCP endpoint `gsa-mcp-next` | Edge Function staging runtime | KEEP | Staging remains a separate deployed function and remains isolated. |
| P3-C06 | endpoint-aware OAuth/resource base | OAuth/resource routing | KEEP | `edgeFunctionSlug` / `edgeFunctionBase` preserve the request surface. |
| P3-C07 | production MCP endpoint `gsa-mcp` | production runtime | KEEP | P3 does not deploy or mutate production. Final source activates only after the later Human release gate. |
| P3-C08 | missing-discriminator compatibility default | execution-contract compatibility fence | KEEP | `resolveExecutionContract(undefined)` remains `V2_STABLE`. |
| P3-C09 | new Job creation default | Planner / Job creation contract | REPLACE | On production request surface, new Job default is `NEXT`; on staging `gsa-mcp-next`, default remains `V2_STABLE` unless NEXT is explicit. No production behavior changes until this exact source is later deployed. |
| P3-C10 | runtime status/default reporting | runtime observability | REPLACE | Status/health report `runtime_surface`, surface-specific creation default, NEXT namespace and `cutover_ready`. |
| P3-C11 | NEXT staging selftest assertions | regression suite | REPLACE | Selftest covers resolved inventory, unresolved negative gate, production/staging defaults, production path outside Test Lab, namespace separation and V2 compatibility. |
| P3-C12 | repository `test-lab/**` assets | repository Test Lab | KEEP | Non-production fixtures/scenarios/results remain available for verification. |
| P3-C13 | deployed `gsa-mcp-next` identity | Supabase staging runtime ops | KEEP | Staging remains separately deployable/testable; P3 candidate was deployed there as v18. |
| P3-C14 | durable Memory Repo lab records | Memory Repo / Project control plane | KEEP | Existing correction evidence under `TEST-LAB/NEXT/**` remains resolvable. Missing `memory_namespace` on historical NEXT records defaults to `TEST_LAB`. |
| P3-C15 | historical V2_STABLE locations | compatibility fence / Memory Repo | KEEP | Historical/missing-discriminator records remain under ordinary `projects/<project-id>/WORK/**` and `VERIFICATION/**`. |
| P3-C16 | excluded alternate automatic-NEXT commit `eb26729...` | correction governance / branch audit | REMOVE | The alternate commit is not imported. Surface-aware activation replaces its unconditional default-NEXT behavior. |

## Executable separation

The P3 runtime candidate establishes two NEXT namespaces:

```text
gsa-mcp-next request surface
→ default new Job contract: V2_STABLE
→ explicit NEXT Job: memory_namespace=TEST_LAB
→ projects/<project-id>/TEST-LAB/NEXT/**

gsa-mcp request surface (only after later Human-approved release)
→ default new Job contract: NEXT
→ memory_namespace=PRODUCTION
→ projects/<project-id>/{WORK,VERIFICATION}/**
```

Compatibility rules:

- missing `execution_contract` continues to mean `V2_STABLE`;
- historical NEXT records with no `memory_namespace` continue to mean `TEST_LAB`;
- child NEXT records must match the owning Job namespace;
- no P3 step changes production `main` or deploys production `gsa-mcp`.

## Task 32 evidence

Staging `gsa-mcp-next` v18 compiled and served the exact runtime candidate. Public staging `/selftest` observed `pass=true`, including:
- resolved-inventory positive case;
- synthetic unresolved-inventory rejection;
- production-new-Job default NEXT;
- production NEXT Job/Verification paths outside `TEST-LAB/NEXT`;
- staging and production NEXT path separation;
- missing-discriminator V2_STABLE compatibility.

Staging `/health` observed:
`runtime_surface=STAGING_NEXT`,
`execution_contract_default=V2_STABLE`,
`next_memory_namespace=TEST_LAB`,
and `cutover_ready=true`.
