# 58. LLC — Execution cursor rejects an active legacy Job despite matching identity

**lesson_id:** `LLC-GSA-CURSOR-LEGACY-JOB-IDENTITY-MISMATCH-20261010`  
**date:** 2026-10-10  
**project:** Gsa-local / J-9067 / UAR-3R  
**trigger:** `WORKAROUND_PRESSURE / CANONICAL_WORKFLOW_BLOCKED`  
**classification:** `WORKFLOW_GAP`  
**subclassification:** `JOB_CONTRACT_COMPATIBILITY / EXECUTION_CURSOR_ADMISSION / DIAGNOSTIC_OPACITY`  
**disposition:** `COLLECTED — UNRESOLVED`  

## 58.1 Observed facts

- Canonical source is `thebimhouseinfo-sudo/Gsa-local`, `main@16bd3975c485a51c273473b607a81fc2434ea6f0`; CI was successful at that revision. UAR-3 persistence checkpoint 1 previously passed CI on code commit `d769244bd9572da4d3fc033600fc64aa0c30ebb3`.
- Durable GSA Memory Job `J-9067` (`01a10511-f84d-7b01-ba1b-6b0cd0109067`) belongs to Project `01a0ec02-34fd-7c90-844d-79a102df57e1`, carries `planning_revision=2`, `lifecycle=IN_PROGRESS`, `type=plan`.
- GSA runtime reported `PRODUCTION`, `execution_contract_default=NEXT`, and `next_memory_namespace=PRODUCTION`; Project source mutation authorization was allowed.
- `execution_cursor_prepare` with the exact current Project/Job IDs, current Job record, branch `main`, real Git HEAD and real parent tree repeatedly returned `allowed=false`, `reason=JOB_IDENTITY_OR_LIFECYCLE_MISMATCH`, `operation=NONE`. Replacing an earlier placeholder tree SHA with the actual Git tree did not alter the rejection.
- No execution cursor exists under the expected Job-owned path `WORK/EXECUTION_CURSORS/01a10511-f84d-7b01-ba1b-6b0cd0109067.json` in GSA Memory. Therefore **there is no duplicate cursor to overwrite or supersede**.
- Uncommitted Coder Run `R-2CE9` was formally `SUPERSEDED` using the canonical Run lifecycle operation, preserving previous PASS evidence and not changing source. J-9067 remains in progress.
- An attempt to record this very lesson as a new source-document mutation also encountered the same cursor denial. The lesson's draft is **not yet committed** to the source repo.

## 58.2 Impact and failure pattern

A legitimate, already-running historical Job cannot pass the newer NEXT execution-cursor admission; the code-writing workflow is blocked **before mutation**, even though the project and source are accessible and unrelated checkpoints have passed. This induces pressure to bypass the canonical gate using raw GitHub writes, fake `PASS`, replacing existing Job records, or re-labeling work. Those workarounds risk source/evidence traceability and were not used for this case.

The observed failure is a **control-plane admission/compatibility issue**, **not an observed source-code failure in Gsa-local**. The validator's internal predicate and exact root cause have not been inspected; `type=plan` versus NEXT contract is a hypothesis, not a confirmed defect.

## 58.3 Missing or unsuitable workflow contract (for later review)

- Define how an already-valid `IN_PROGRESS` legacy Job is recognized and safely admitted, or deterministically routed to an explicit migration/rebaseline procedure, when the control plane defaults to NEXT.
- Report distinct diagnostic causes (identity, lifecycle, revision, contract/schema compatibility, namespace, or cursor/HEAD conflict) instead of collapsing them into a single opaque rejection.
- Distinguish **superseding an uncommitted Run** from **superseding an entire active Job** and from **overwriting a cursor**; do not erase completed historical evidence.
- If migration is authorized, require proof of exact Project/Job identity, allowed lifecycle, planning revision, canonical memory provenance, source HEAD/tree and cursor atomicity. Never implicitly weaken gates.
- LLC collection itself should have a documented, append-only safe route when source mutation is blocked by the very workflow defect being documented. This is a *contract-review question*, not authority to bypass the denied gate.

## 58.4 Suggested future validation matrix (not performed)

1. Positive: legacy active J-9067 fixture with authentic project/job/revision and a missing cursor is admitted or receives a specific documented migration decision.
2. Negative: mismatched Project ID or Job ID is rejected.
3. Negative: invalid lifecycle (`CANCELLED`, `SUPERSEDED`, `COMPLETED`) is rejected.
4. Negative: mismatched planning revision or altered Job record is rejected.
5. Negative: wrong Git HEAD/tree or conflicting cursor operation is rejected.
6. Positive: repeated startup after successful cursor persistence resumes idempotently without duplicate mutation.
7. Negative: a previously completed PASS checkpoint never gets rebound to a different target SHA.
8. LLC can be safely recorded without weakening source write authorization.

## 58.5 Scope and disposition

**LLC records the workflow deficiency only; do not implement a fix as part of this record.** Keep Job `J-9067` and its historical PASS Runs/Verifications intact. Do not substitute a fake cursor, overwrite unrelated Job history, force `PASS`, or route through a lower-level Git operation after cursor denial. The GSA control-plane implementation and its tests must be inspected before choosing a repair.
