# E35 — NEXT cutover readiness and namespace separation

Target: P3 correction branch.

## Cutover inventory

1. Exact P3-C01..P3-C16 inventory, every row owned and KEEP/REPLACE/REMOVE → ALLOW.
2. Missing/duplicate/unexpected row → REJECT.
3. Missing owner → REJECT.
4. PENDING/unknown disposition → REJECT.
5. REPLACE without production target → REJECT.
6. REMOVE without retirement evidence → REJECT.

## Request-surface activation

1. `gsa-mcp-next` request surface → `STAGING_NEXT`.
2. Staging new-Job default remains `V2_STABLE`; explicit NEXT is still supported.
3. Staging explicit NEXT → `memory_namespace=TEST_LAB`.
4. `gsa-mcp` production request surface → new-Job default `NEXT` only when this exact source is later deployed.
5. Production NEXT → `memory_namespace=PRODUCTION`.
6. Missing historical `execution_contract` remains `V2_STABLE`.

## Durable namespace separation

1. TEST_LAB NEXT Job/Run/Handoff/Verification/checkpoint paths remain below `projects/<id>/TEST-LAB/NEXT/**`.
2. PRODUCTION NEXT Job/Run/Handoff/Verification/checkpoint paths resolve below ordinary `projects/<id>/{WORK,VERIFICATION}/**`.
3. Historical NEXT record without `memory_namespace` resolves to TEST_LAB.
4. Child NEXT records must match the owning Job/Run namespace.
5. Cross-namespace completed Run, Verification, checkpoint claim, EvidenceBundle attestation or Handoff evidence → REJECT.
6. V2_STABLE path behavior remains unchanged.

## Staging isolation

1. Deploy the exact P3 candidate only to `gsa-mcp-next`.
2. Staging `/health` reports `runtime_surface=STAGING_NEXT`, `execution_contract_default=V2_STABLE`, `next_memory_namespace=TEST_LAB`, `cutover_ready=true`.
3. Aggregate `/selftest` PASS includes P0/P1/P2 regressions plus all P3 cutover checks.
4. Do not deploy production `gsa-mcp` and do not mutate `main`.

## Promotion boundary

P3 may merge only into `upgrade/gsa-next` after exact-head Tester and Reviewer PASS. Production activation is reserved for the later P5 Human release gate.
