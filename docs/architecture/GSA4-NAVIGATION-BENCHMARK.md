# GSA4 — Controlled source-navigation benchmark protocol (GSA3 → A3)

**Evidence level:** source-executed, deterministic navigation and full-file text proxy. **Not an autonomous Agent bug-fix benchmark.**

**Execution:** `node test-lab/gsa4-navigation-benchmark.cjs <report.json>` with Node 22, TypeScript 5.9.3 on a full Git checkout containing `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`. CI runs the exact feature branch head, stores the full JSON trace in the `gsa4-navigation-benchmark` artifact and records the original Git baseline SHA.

## Fixed, common diagnostic cases

| Case | Real observed source code signal | Actual GSA3 location | After physical A0 source |
| --- | --- | --- | --- |
| D1 | `NEXT_DISPATCH_STALE_JOB_SHA` on `run_begin` | `index.ts` + `run-execution-tools.ts` | dispatch guard + Run begin + durable records |
| D2 | `PENDING_MUTATION_REQUIRES_RECONCILIATION` on `execution_cursor_prepare` | `index.ts` + cursor registration | cursor decisions + recovery decisions + cursor registration |
| D3 | `CHECKPOINT_CLAIM_REJECTED` on `checkpoint_claim_prepare` | `checkpoint-tools.ts` + `index.ts` | claim + checkpoint/evidence gates and validators |
| D4 | `evidence_repository_publish_finalize` and its `validateRepositoryProbeSnapshot` callback | Evidence parent + nested `index.ts` callback | Evidence finalize leaf + still-nested root callback |

The cases are **real existing error/symbol paths**, not newly reproduced product bugs or injected functional regressions. They were selected to cover both isolated ownership (D1), recovery dependencies (D2), cross-module validation (D3) and a deliberately large remaining source owner (D4). The code-path diagnostic **must-inspect source paths are frozen in the benchmark** for equal coverage accounting; these are not asserted to be proven *minimal root-cause sets*.

## Same input, five navigation strategies

The benchmark supplies the same `tool_name` and available `error_code` in every case. The output reports how the same signal is navigated:

- **GSA3:** actual pinned monolithic source queried with local `git grep`; open each matching original TypeScript file completely.
- **A0:** the identical `git grep` over the physical modules; open each matching current file completely.
- **A1:** use actual `tool_owners` and `error_routes` metadata (owner, facade and related files); open referenced source files completely.
- **A1+A2:** additionally execute real `buildTaskContextRecipe` over one fixed **synthetic Job/Task/Run**. Include its exact source candidates and text reference packet.
- **A1+A2+A3:** execute real `buildRepairContextRoute` over the A2 packet and actual 13-edge A3 graph. Open returned source candidates, including cross-module neighbors; include the actual recipe packet sizes.

Each method is scored with **source file reads**, **real source character counts**, **selection metadata characters**, **source+metadata proxy characters**, **lookup operations**, and **fraction of the pinned diagnostic source list covered**. Test candidates are verified to exist and reported, but their text is excluded equally from the source-character totals. Extra local CPU/read timing is recorded separately as diagnostic data; it is **not** network/Host latency or real Agent wall time.

**Important causal limit:** A1/A2/A3 are pure selection helpers that are not wired into runtime. The benchmark compiles and executes their current TypeScript on a GitHub Actions runner, which is stronger than a purely paper simulation, but **does not demonstrate how many source bytes were actually loaded into a Coding Agent model**. Any comparison of "model_input_proxy_chars" is hypothetical, not measured tokens. A strategy with low bytes but missed required dependencies must not be declared superior.

## Quality and non-goals

This benchmark does not conduct four independent Coder debugging sessions or edit the product; its repair/retest iteration metric is **not measured**, and it does not claim higher fix success. Existing CI still runs the complete GSA3→A0 golden/negative source-parity suite, separately from navigation economics. Real Host MCP/connector E2E and CAS race cases are also outside this benchmark.

**Next evidence for a quality winner:** freeze an architecture-neutral defect test before exposing source, run equivalent Coder/Reviewer/Tester loops with separate source refs and no hidden result sharing, count wrong-file opens, actual bytes/tokens returned to each model, true root cause, real source diff, failed repair rounds and independent retest on the changed revision; compare with the numbers from this automated precursor.

**Safety:** no main merge/deploy, no edits to Criteria/Plan, no new Tool, no automatic product repair. A source lookup is not a permission.
