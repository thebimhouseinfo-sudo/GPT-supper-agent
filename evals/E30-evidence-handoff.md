# E30 — CP6 Durable Evidence Handoff

## Purpose

Regression contract for CP6 EvidenceBundle publication attestation, TEST/RETEST binding and Human handoff. These cases supplement `/selftest`; they do not replace runtime staging evidence.

## Cases

| Case | Input / mutation | Expected |
|---|---|---|
| E30.1 | PRIVATE_SUPABASE bundle with exact binding but no durable attestation snapshot | rejected as authority; raw bundle cannot authorize PASS |
| E30.2 | private attestation request whose authenticated manifest row is missing or SHA-mismatched | rejected |
| E30.3 | private manifest binding differs by target revision, attempt, Tester Run or repository | rejected |
| E30.4 | private manifest exceeds screenshot/bundle limits or does not exactly match artifact count/size | rejected |
| E30.5 | successful private manifest read-back | append-only `EVIDENCE_BUNDLE/PUBLISHED` attestation prepared |
| E30.6 | REPOSITORY_GIT PUBLISH loses expected-head CAS, moves source ref, is non-append-only, or reports automation side effects | finalize rejected; no attestation |
| E30.7 | repository PUBLISH lacks exact successful `PROBE-GIT-EVIDENCE-01` Verification snapshot/path/SHA | rejected |
| E30.8 | successful repository PUBLISH finalize with exact Tester Run/target | canonical `EVIDENCE_BUNDLE/PUBLISHED` attestation prepared directly |
| E30.9 | attestation snapshot path/SHA/record does not match Project/Job/checkpoint/attempt/Run/repository/target | checkpoint Verification rejected |
| E30.10 | attestation record publication_proof conflicts with bundle manifest/commit/hash/probe identity | rejected |
| E30.11 | successful TEST/RETEST supplies exact durable attestation snapshots | Verification derives bundle refs + attestation refs and records exact source revision |
| E30.12 | applicable Verification has bundle refs but missing/duplicate/malformed attestation refs | EvidenceApplicability remains false |
| E30.13 | Tester Handoff supplies exact successful TEST/RETEST Verification snapshot included in `verification_refs[]` | Handoff derives immutable bundle + attestation refs |
| E30.14 | Handoff supplies raw bundle authority, wrong Run/target Verification, or Verification not listed in `verification_refs[]` | rejected |
| E30.15 | RETEST uses a new attempt id | new bundle + attestation; prior Verification refs remain immutable/resolvable |
| E30.16 | browser evidence persistence receives non-40-hex target revision | rejected before persistence |
| E30.17 | V2_STABLE Job without CP6 attestation fields | legacy execution/gating path remains unchanged |
| E30.18 | PROBE-GIT-EVIDENCE-01 uses one synthetic PNG <=64 KiB before capability is observed | allowed as PROBE only; not usable as product evidence |

## Staging evidence

After exact-source Reviewer PASS:

1. Deploy only the reviewed source to `gsa-mcp-next`.
2. Read back the staging function and require byte/source identity with the reviewed Git revision.
3. Keep production `gsa-mcp` and `main` unchanged.
4. Execute `PROBE-GIT-EVIDENCE-01` only with a non-sensitive bounded fixture and only after static CI/deploy/release isolation is established.
5. Exercise at least one allowed evidence route end-to-end. If browser or binary-Git invocation is unavailable, record the limitation as `INTEGRATION_NOT_READY` / Retest rather than fabricating product failure or PASS.
