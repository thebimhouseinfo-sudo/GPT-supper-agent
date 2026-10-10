# GSA Reliability — Real-project readiness and Lessons closure audit
Date: 2026-10-10
Target: `upgrade/gsa-reliability`, PR #18, last tested head `df81108c57008b08a502c69cc363bef54a2f577b`
Review type: **source-to-real-workflow gap analysis**. This is not a persisted Reviewer Verification.

## User acceptance interpretation
These are agent workflow capabilities. Helper/unit assertions are guardrails but do **not** prove behavior on a real Project: source migration may be merged only when the underlying lesson behaviors are implemented; then validate end-to-end through active, scoped GSA Jobs on actual projects (e.g. CadGPT/RevitGPT/GSA itself). Staging-only synthetic happy paths are not substitutes. Do not claim live production validation from CI.

## Findings by lesson

| Lesson | Evidence found on branch | Unresolved issue | Disposition |
|---|---|---|---|
| WL-023/024 (project boundaries) | `authorize_project_scope` runtime and shared harness predate branch | Existing guard should be retained; not changed by this PR | ALREADY_OWNED |
| WL-026/027/029/030 (traceability, cutover, branch) | one integration branch, exact GitHub compare, approved branch policy, release review contract | old release/cutover historical pending evidence should not be accidentally marked completed by this PR | POLICY_IMPLEMENTED, FIELD_VALIDATION_PENDING |
| WL-031 (fresh chat Planner) | shared harness and `AGENT-HARNESSES.md` defaults new Project/chat to Planner | cold-start actual routing and real Job re-grounding not verified in current ChatGPT environment | CONTRACT_IMPLEMENTED, FIELD_VALIDATION_PENDING |
| WL-032 and WL-033 (debug root cause/simulation) | `RUNTIME_SKILLS['debugging']`, `load_skill` enum and conditional `coding-loop` trigger | actual served connector must expose new skill after deployment; evidence from real bugfix Job required | IMPLEMENTED_IN_SOURCE, FIELD_VALIDATION_PENDING |
| 2026-10-08 test validity | 15/15 real GitHub Actions Node tests (including mutants), Deno typecheck, selective Reviewer language in served source | test verification MUST link to actual production call path at real project checkpoint; CI coverage remains helper-limited | IMPLEMENTED_IN_SOURCE, FIELD_VALIDATION_PENDING |
| WL-025 (prepared != persisted) | exact-SHA readback contracts, existing NEXT claims, new read-only source recovery advisory | ordinary post-write lifecycle mutation recovery does not yet have persistent, Job-owned operation intent or durable last-good checkpoint independent of chat | **PARTIAL / BLOCKING** |
| 2026-10-08 interruption/livelock | `sourceMutationRecoveryDecision` and `orchestrationProgressDecision` handle bounded simulated advisory cases; shared harness instructs no blind retry | `operation_id`, prior expected source/blob SHA, retry counter, progress fingerprint and last-good checkpoint live only in caller inputs; they are **not persisted in a Job-owned cursor**; on lost chat context the next invocation cannot reliably recover those inputs or automatically enforce the bounded loop | **PARTIAL / BLOCKING** |

## Specific blocking failure path

1. Coder updates a branch successfully via GitHub, but ChatGPT response is interrupted before its expected commit/blob and operation ID are captured in durable Project Memory.
2. A new ChatGPT session opens Project and reads Job + Run, but **no durable Job cursor exists for that unacknowledged operation**. Existing RUNTIME helper requires `expected_head_sha`, `previous_blob_sha`, `intended_blob_sha`, `operation_id` supplied by caller.
3. Without an authoritative persisted intent, the helper cannot establish that the observed branch changes belong to this Job/operation; it correctly fails closed or can only say target bytes exist. It does not resolve user pain: redone coding, orphan commits, and commit archaeology.
4. The no-progress guard similarly trusts caller-provided `stalled_cycles` and fingerprint; an interrupted session loses counters unless they were stored. MCP does not intercept external Git actions and does not run in the background.

**Acceptance repair (narrow):** choose one canonical per-Job durable source of restart metadata and checkpoint-to-SHA ownership, using existing Job/Run/CONTROL fields if sufficient. If a truly new persisted cursor record is unavoidable, follow the approved plan's **separate Human schema gate** instead of inventing a shadow Job lifecycle. Demonstrate real blocked/restarted Job behavior through a scoped active project. Distinguish completed checkpoints from pending write intent; use exact GitHub CAS/HEAD+blob readback and stop on ambiguous merge ancestry. Do not bury this in a generic helper with arbitrary caller values.

## Review verdict

**CHANGES_REQUIRED (release/merge gate)**. All lessons are **not** closed yet. Despite green GitHub Actions at head `df81108c`, merging would prematurely describe a key known operational failure as solved.

**No main mutation authorized by this audit.** The user specified a *conditional* merge **if issues are resolved**; this condition is not yet met. Continue one integration branch; do not open parallel branches or deploy production. When persistence/resumption is implemented and readback evidence is tied to real Project workflow, repeat this matrix before any merge. Real-project field validation may continue after merging genuinely implemented behavior, but it cannot replace missing implementation itself.

## GitHub CI evidence
Run [38030799863, attempt 2](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/38030799863): hosted `deno-typecheck` PASS; `runtime-helper-check` PASS (15 tests). This establishes executable helper checks, not the live Project resume path.

## Post-audit remediation candidate (2026-10-10)

Human approved a **minimal Job-owned durable checkpoint** provided runtime latency is not materially affected. Implementation is now on `upgrade/gsa-reliability`, not on main:

- `execution_cursor_prepare` returns one deterministic Memory Repo CREATE/UPDATE proposal for meaningful checkpoints and pending consequential Git writes; external GitHub exact-SHA CAS + readback remain mandatory.
- `execution_cursor_resume_evaluate` reconstructs restart from one durable record and freshly read source HEAD/blob, fail-closed for stale namespace/revision, changed branch or unresolved write. No new background worker or Job/Run lifecycle status.
- Lazy create on first mutation avoids one otherwise redundant INIT round trip. Ordinary tool calls do not persist cursor. Reviewer/Tester checkpoint markers and actual pauses may update the same record, not one file per event.

This implements the previously **missing durable state contract** in source, but the earlier CHANGES_REQUIRED verdict is **not automatically overturned**: await source-bound CI, functional GitHub persistence/recovery exercise, Reviewer verification and on-project latency observations. The rule is to **merge only when implementation is verified enough for field use**, then validate behavior through actual GSA Jobs in real projects, not just small fixtures.

