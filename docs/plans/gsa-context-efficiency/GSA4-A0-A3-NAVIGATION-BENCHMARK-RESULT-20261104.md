# GSA4 — Executed source-navigation benchmark: GSA3 vs A0 vs A1 vs A1+A2 vs A1+A2+A3

**Date:** 2026-11-04. **Mode:** DIRECT_AGENT source-code benchmark with actual GitHub Actions execution. **Status:** SOURCE_EXECUTED_NAVIGATION_RESULT; **NOT** an autonomous Agent repair benchmark or Host observation.  
**Development starting SHA:** `37c98d050b34ec77b2cec55cdcf375881c248262`.  
**Benchmark execution:** first PASS at `3cf05dc0e9b80e6f670a8a28d682e14f73e1bddc`; **final re-run PASS at `eb4d1c16376931dc44414d672a163825807d6296`**, including new coverage regression assertions.  
**Pinned original GSA3 source:** `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`.  
**GitHub Actions:** [final verified run #41814015109](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41814015109) and [first run #41813601289](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41813601289), both **SUCCESS** for Navigation Benchmark, Node regression and Deno typecheck. **Final artifact:** `gsa4-navigation-benchmark` (ID `13312664608` as returned by GitHub Actions, downloadable from the final run; 30-day retention).  
**Reproducible runner:** [test-lab/gsa4-navigation-benchmark.cjs](../../../test-lab/gsa4-navigation-benchmark.cjs); [benchmark protocol](../../../docs/architecture/GSA4-NAVIGATION-BENCHMARK.md).

## 1. Exact comparison and scope

Execute the real GSA3 source and physically extracted GSA4 A0 source for **the same four actual existing error / Tool code-path labels**, using local Git for the original source and current repository files for A0 onward. The cases have no injected product defects; therefore **bug-fix success, repair iterations, regression-fix time and Agent cognitive effort are NOT measured**.

Each strategy receives the same `tool_name` and present `error_code`:
- **GSA3:** actual `git grep` in source commit `0b5cf8…`; read full files returned.
- **A0:** identical `git grep` on the physically split source tree; read full files.
- **A1:** use the real A1 owner/error lookup; read owner, facade and indexed dependencies.
- **A1+A2:** execute real A2 Task context compiler using a fixed *synthetic* current Job/Task/Run; include A2 reference packet and owner suggestions.
- **A1+A2+A3:** execute real A3 router and existing 13-edge graph, expand source/test candidates and check physical files.

The benchmark records **actual source characters read**, **full-source file reads**, **selected metadata characters**, and **programmatic lookup operations**. `model_input_proxy_chars` is the sum of source and selected metadata, **not observed tokens**. For each case, count coverage of a manually frozen *diagnostic must-inspect source set* (not proven root cause). Original GSA3 has 8 must-inspect physical files across cases, physically extracted versions have 11 due splitting, so **raw 6/8 vs 11/11 is not a same-size object count**; use scenario-complete counts and within-architecture coverage to compare detection.

## 2. Measured aggregate from the actual CI run

| Strategy | Full source chars | Source files opened | Selected metadata chars | Source+metadata proxy | Lookup operations | Diagnostic sources covered | Scenarios complete / 4 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **GSA3** — source grep | **724,843** | 11 | 957 | 725,800 | 4 | 6 / 8 | 2 / 4 |
| **A0** — identical source grep | **207,943** | 16 | 834 | 208,777 | 4 | 6 / 11 | 0 / 4 |
| **A1** — indexed owners | **126,213** | 15 | 1,061 | 127,274 | 4 | 9 / 11 | 2 / 4 |
| **A1+A2** — Task recipe | **126,213** | 15 | 11,121 | 137,334 | 8 | 9 / 11 | 2 / 4 |
| **A1+A2+A3** — graph traversal | **261,710** | 22 | 20,289 | 281,999 | 12 | **11 / 11** | **4 / 4** |

**Directly supported arithmetic:**
- A0's full-source text is **71.3% smaller** than GSA3's under this *same local grep+full-file* protocol. This supports a real source-navigation advantage of the A physical split under this workload, but **does not prove fewer bugs**.
- A1 is **39.3% lower than A0** in full-source text for the same four signals, but it **fails two complete diagnostic coverage cases**. Therefore simply picking the 126,213-char minimum would be unsafe as a global winner.
- Adding A2 to A1 **did not further reduce source file text** in this fixture (126,213 both); it increased selected reference-packet text by 10,060 chars and programmatic lookups from 4 to 8. Its Task-specific relevance and ASK/STOP behavior were validated in existing tests, **not as a measured source-byte win**.
- A3 is **107.4% more full-source text than A1**, and **25.9% more than A0**, because its graph intentionally follows cross-module dependencies and the large residual root `index.ts`. It still reads **63.9% less source text than GSA3** under these exact signals, with **all four fixed diagnostic dependency sets covered**.
- When including selected metadata/recipe payload, A3 is **35.1% above A0**, not an overall context reduction. These payloads were constructed by Node, **not observed as real model input**.

### Individual code-path cases (actual full source chars)

| Same diagnosis | GSA3 | A0 | A1 / A1+A2 | A1+A2+A3 | Must-inspect coverage for A0 → A1 → A3 |
| --- | ---: | ---: | ---: | ---: | --- |
| D1 — stale Job SHA / Run begin | 325,691 | 93,241 | 33,144 | 72,206 | 2/3 → 3/3 → 3/3 |
| D2 — unknown Cursor mutation | 236,501 | 45,426 | 33,987 | 44,023 | 2/3 → 3/3 → 3/3 |
| D3 — Checkpoint claim rejection | 120,863 | 33,561 | 44,988 | 76,476 | 1/3 → 2/3 → 3/3 |
| D4 — Evidence finalize nested callback | 41,788 | 35,715 | **14,094** | **69,005** | 1/2 → 1/2 → 2/2 |

**The deliberate counterexample is D4:** A1 appears extremely cheap (14,094 chars) but misses the **actual nested `validateRepositoryProbeSnapshot` in `index.ts`**. A3 follows the source-grounded callback, reaches 2/2 dependency coverage, and costs **69,005 chars** (more than the 41,788 GSA3 *incomplete grep read*). This is an **appropriate cost increase when complete verification matters**, not a token optimization. A small leaf is not always the true bug root.

## 3. What was actually executed and what was not

**Executed:** pinned GSA3 source checkout/read via `git show`, local git grep, current split source reads, actual A1 JSON lookup, TypeScript-compiled A2 `buildTaskContextRecipe` and A3 `buildRepairContextRoute`, existing source/edge/ref assertions, Node regression and Deno checks. The experimental A2 Job/Task/Run context **is synthetic**, with `execution_authorized=false`. A3 always reports `root_cause_confirmed=false` and `repair_authorized=false`.

**Not executed:** independently controlled AI Coding Agent sessions on equivalent real injected bugs, the same patch being edited/reviewed/tested against both architectures, actual ChatGPT/Claude/Codex tool calls, model token receipts, Tool networking latency, Host/CAS E2E, actual RED→fix→GREEN repair iterations. `local_read_elapsed_ms` includes incomparable Git subprocess vs OS file reads and must **not** be represented as Agent timing.

The exact final-source Node regression suite is **194 PASS / 0 FAIL / 0 SKIP** on the benchmark PR CI, with Deno typecheck PASS. It is a check of GSA source parity and negative cases, **not evidence that the benchmark's four signals were independent product bugs**.

## 4. Interpretation and recommended post-benchmark direction

1. **KEEP A0 as physical design.** Under this exact whole-file reading strategy, fine responsibility modules reduce text materially versus GSA3. This corroborates the initial maintainability hypothesis only on source-read cost, **not** repair outcome.
2. **KEEP A1 as the initial cheap locator**, but **never assume that the first matching module is the only required source**. D3 and D4 expose incomplete coverage; current source reference pointers are advisory and must be verified.
3. **KEEP A2 as Task-specific references**, not a universal automatic Role/Skill prompt injector. On these four controlled cases it adds selection metadata and overhead, not fewer source reads. A2 has value only where it prevents irrelevant Skill/Knowledge reads or catches task/authority ambiguity; those require separate live Agent traces.
4. **USE A3 progressively for cross-module/high-risk failures and failed retest.** A3 is most valuable as **dependency completeness and safe escalation**, not as a prompt-shortening mechanism. Its graph adds source reads, especially nested callback boundaries; initiate with A1, then expand only where needed, using the current SHA and error/Task evidence. Do **not** claim a per-case expected cost saving until the escalation frequency is actually measured.
5. **Defer A4 Shared policy pruning** until per-clause mandatory rule preservation and real CT-00/Role delivery tests are proven. A context budget is not worth silent authorization or Reviewer/Tester regressions.
6. **Next necessary real experiment:** freeze at least several genuine or deliberately seeded independent bug fixtures before revealing architecture to equivalent Coding Agent arms. Collect source/tool bytes actually delivered to model, time to verified root cause, incorrect first owner, number of edit/review/retest rounds and regressions. The existing CI's deterministic real source cases are a good precursor, but not a substitute.

**Decision:** A physical split + A1 cheap owner lookup + A2 as needed + **A3 progressive dependency expansion** is the **recommended bounded next implementation direction**, with the uncertainty explicitly tracked. Neither “A always easier to fix” nor “A3 reduces tokens” is proven.

## 5. Reproduction, artifact and integrity

1. Full-history checkout at the benchmark HEAD; make sure pinned `0b5cf875402c7735e1ef573ab95df5858c6ac5e8` exists.
2. Node 22 + local `typescript@5.9.3`; run `node test-lab/gsa4-navigation-benchmark.cjs /tmp/gsa4-navigation.json`.
3. Inspect `GSA4_BENCHMARK_SUMMARY` and four `GSA4_BENCHMARK_CASE` lines, plus full JSON trace in CI artifact for the exact run SHA.
4. The benchmark now includes regression assertions for all four A3 diagnostic dependency sets and A0's source-read advantage; rerun these on any change to owner index/graph/runtime.
5. Do not rename a source-only measurement as Host-observed or as an independently executed Agent repair. The report is benchmark evidence, not a production merge/deploy authorization.

No Criteria/Plan change, MCP tool registration change, runtime handler rewrite or automatic repair was performed. The benchmark branch is a development-only experimental PR.
