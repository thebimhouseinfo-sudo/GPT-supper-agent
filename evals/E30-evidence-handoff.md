# E30 — CP6 Durable Evidence Handoff

## Purpose

Regression contract for CP6 EvidenceBundle persistence, TEST/RETEST binding and Human handoff. These cases supplement `/selftest`; they do not replace runtime staging evidence.

## Cases

| Case | Input / mutation | Expected |
|---|---|---|
| E30.1 | PRIVATE_SUPABASE bundle with exact project/job/checkpoint/attempt/Tester Run/target revision binding and verified manifest | accepted as durable bundle evidence |
| E30.2 | same private bundle with stale target revision | rejected |
| E30.3 | same private bundle reused by another attempt/RETEST | rejected; each attempt keeps its own immutable bundle |
| E30.4 | private bundle above 50 MiB | rejected |
| E30.5 | REPOSITORY_GIT PUBLISH bundle with exact binding, immutable commit-pinned link, append-only parent, read-back true, no automation side effects and durable successful probe ref+SHA | accepted |
| E30.6 | repository evidence marked PRIVATE_REQUIRED | rejected; route private |
| E30.7 | mutable/non-read-back repository evidence | rejected |
| E30.8 | evidence publication reports CI/deploy/release side effect | rejected; route private |
| E30.9 | repository PUBLISH lacks exact persisted PROBE-GIT-EVIDENCE-01 Verification snapshot/path/SHA | rejected |
| E30.10 | PROBE-GIT-EVIDENCE-01 before capability is observed, one synthetic PNG <=64 KiB | allowed as PROBE only; not usable as product evidence |
| E30.11 | successful TEST/RETEST supplies valid EvidenceBundle ref | Verification records bundle ref plus exact source revision |
| E30.12 | applicable Verification contains stale/malformed bundle ref | checkpoint evidence gate remains closed |
| E30.13 | Tester Handoff carries valid target-bound bundle ref | accepted and copied into immutable Handoff |
| E30.14 | non-Tester or target-mismatched Handoff attempts to carry bundle ref | rejected |
| E30.15 | V2_STABLE Job without CP6 bundle refs | legacy execution/gating path remains unchanged |
| E30.16 | repository evidence ref loses expected-head CAS or attempts force/non-fast-forward update | publication rejected |
| E30.17 | RETEST creates new attempt id while prior Verification remains commit/bundle pinned | prior evidence remains resolvable and new attempt does not overwrite it |
| E30.18 | browser evidence persistence receives non-40-hex target revision | rejected before persistence |

## Staging evidence

After exact-source Reviewer PASS:

1. Deploy only the reviewed source to `gsa-mcp-next`.
2. Read back the staging function and require byte/source identity with the reviewed Git revision.
3. Keep production `gsa-mcp` and `main` unchanged.
4. Execute `PROBE-GIT-EVIDENCE-01` only with a non-sensitive bounded fixture and only after static CI/deploy/release isolation is established.
5. Exercise at least one allowed evidence route end-to-end. If browser or binary-Git invocation is unavailable, record the limitation as `INTEGRATION_NOT_READY` / Retest rather than fabricating product failure or PASS.
