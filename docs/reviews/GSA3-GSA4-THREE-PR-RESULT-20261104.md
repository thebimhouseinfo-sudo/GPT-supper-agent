# Independent GSA3 CONTROL vs GSA4 CANDIDATE review — PR #58 vs #57

**Review date:** 2026-11-04. **Mode:** DIRECT_AGENT / independent read-only inspection of both submitted arms, plus new isolated GitHub Actions replay in this reviewer branch.  
**Frozen product base (both arms):** `fb5b2427cba5908963a198b154345c775321b635`.  
**Control:** [PR #58](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/58) final `ade7fcdf71bb0273594edc390424c8d8c605c37c` — GSA3 pinned Harness `main` @ `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`.  
**Candidate:** [PR #57](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/57) final `b9df63862e3a7368b5ea91b7f545520a887844e1` — GSA4 A0–A4 Harness/navigation pinned common base.  
**Independent reviewer CI:** [run #41833105978](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41833105978), SUCCESS; artifact `gsa3-gsa4-independent-cross-arm`. The replay is source-executed with TypeScript transpilation, not a live Host/Memory trial.

## 1. Fairness and exact CI

Both PRs independently branch from the **identical** GSA4 source base (verified merge base). Both submitted draft PRs remain open/unmerged. No source code from the old GSA3 monolith was copied over the target runtime; both edit the same GSA4 module owners:
`plan-change-decisions.ts`, `plan-change-tools.ts`, `job-prepare-tool.ts`, `job-transition-tool.ts`, `run/complete.ts`, `harness/skills/coding-loop.ts` and the lessons ledger. Neither changed `main`, deployed or edited the other arm during its work.

| Measurement | GSA3 CONTROL | GSA4 CANDIDATE | Notes |
| --- | ---: | ---: | --- |
| Initial product base | `fb5b2427…` | `fb5b2427…` | Exact |
| Implementation PR | #58 | #57 | Both draft, unmerged |
| Final HEAD | `ade7fcdf…` | `b9df6386…` | Full hashes above |
| Node tests exact HEAD | **221/221 PASS** | **228/228 PASS** | Different test fixture counts; not a correctness score |
| Deno check | PASS | PASS | Exact head |
| Run parity | PASS | PASS | Exact head |
| A0–A3 navigation | PASS | PASS | Original benchmark suite |
| Current changed files | **15** | **16** | Includes CI/test/evidence |
| Git commits | **31** | **7** | Workflow metric, not safety |
| Final changed lines | +901 / −22 | +1,022 / −22 | Different testing intensity |
| Declared EXECUTE-only elapsed | **20m 36.056s** | **14m 22s** | Both exclude PREPARE |
| Observed RED/retest loops | **3** | **1 repair loop** | Based on own workflow evidence; not independent model review |
| Actual model tokens/tool calls | UNMEASURED | UNMEASURED | Do not estimate |
| Live Memory CAS / Host E2E | UNVERIFIED | UNVERIFIED | Neither reaches production acceptance |

**Time arithmetic:** Candidate's reported time is **6m 14.056s shorter**, ~**30.3% less** than Control's time; ~1.43× Control's throughput if the benchmark task/evidence milestones are comparable. These are *reported* start/end timestamps, not externally metered continuous Agent work. GitHub CI start/finish success verified at both exact heads.

CI evidence: [Control final NEXT](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41831344715) (221 Node PASS), [Control Run parity](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41831344792); [Candidate NEXT](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41830287874) (228 Node PASS), [Candidate Run parity](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41830282450).

## 2. Three-pack delivery review

**U-B / PR #34 — scope-wide Plan supersession.** Both have a real current-source `assessScopeWidePlanChange` classifier, complete caller-supplied inventory and boundary checks, Phase/Plan scope member handling, transitive unfinished cross-Job closure, immutable intent/reused successor allocation, completed evidence preservation, pending Run/Cursor fence, scope successor preparation and source-owned `run/complete.ts` stale-success protection for all successful NEXT Roles. Both explicitly return `mutation_authorized:false` on the read-only classifier. A supplied Human approval ref, reviewed Plan SHA or inventory snapshot is **not independent readback**; live Git/Memory authority and CAS remain outside these source tests.

**U-C / PR #38 — Coder Engineering Context and operational artifacts.** Both put engineering HOW/domain decision and OPERATION vs DEV permission text in current on-demand `harness/skills/coding-loop.ts`, not the old monolith. Both preserve eight Role/eleven Skill and source/Host permission boundaries. The candidate adds explicit BAK/DWL2 distinction and tests its own Skill outputs; the Control separately tests on-demand/no Role pollution. Neither can claim actual user/Host Open/Edit/Save authorization based solely on policy strings.

**LLC61 / PR #40 — AssetGen Bootstrap lesson.** Both preserve WL-034/WL-035 and add one uniquely named LLC61 **ROOT_CAUSE_UNVERIFIED** candidate, with current-source bootstrap fixtures. Neither claims a reproduced real AssetGen Host failure or invents a validator fix. The candidate's fixture explicitly reproduces missing typed PROJECT_PLAN binding; Control also tests genuine typed mismatch and accepted reviewed source Plan. Their different fixture sets are not a numerical correctness ranking.

## 3. Independent cross-arm negative probe: a semantic delta

An isolated CI runner checked out **both exact pinned competitor SHAs** and compiled/executed the real nested `assessScopeWidePlanChange` function against the **same** two-Job, reviewed-Phase-boundary fixture. Job A is in impacted Phase ALPHA and is unfinished; Job B is outside that Phase and depends on unfinished task TASK-A.

| Cross-boundary dependency representation | Control decision for Job B | Candidate decision for Job B |
| --- | --- | --- |
| `dependencies: ['TASK-A']` | RETIRE | RETIRE |
| `dependencies: [{task_id:'TASK-A'}]` | RETIRE | RETIRE |
| `dependencies: [{node_id:'TASK-A'}]` | **RETIRE** | **KEEP** |

The divergence is **real** at the function level. Control's `refs` extracts `item.node_id`, candidate's `referencedIds` does not. This is dangerous **if historical or externally persisted, recognized Job records legitimately store dependency objects with `node_id`**: transitive cross-boundary retirement could be missed and old downstream work survive a scope update.

**Severity must be qualified:** current Job preparation schemas use `dependencies: z.array(z.string())` and `planning_topology[].depends_on: z.array(z.string())`. This means the `{node_id:…}` representation is **not a normal current-schema output**. The cross-arm fixture uses direct classifier input and does **not** establish that such a dependency is accepted by the documented current source-writing flow or exists in real Memory. The actual classifier's Job-shape validation only checks shallow identity, revision and lifecycle, not every dependency item's type. Therefore classify it as a **potential backward-compatibility edge**, not a proven production regression or confirmed critical hard-gate fail.

The script and pinned CI artifact show both standard string and object `task_id` cases agreeing. **Do not inflate this one finding into GSA3 proven product correctness superiority or GSA4 unsafe production behavior without checking legacy Memory record formats.** Equally, do not dismiss this difference solely because Node CI was green: neither original test suite exercised this exact edge.

## 4. Evaluation verdict and next gate

**Provisional performance leader: GSA4 CANDIDATE**, faster reported EXECUTE (−30.3%), fewer commits, fewer RED loops while covering the same three packs and passing exact-head CI. Faster is not automatically safer, and lower commit count is not an agent capability proof. This benchmark's A4 selective short Harness was not broadly activated for Update/Refactor; thus its improvement cannot be causally attributed to shortened Harness alone. A1/A3 navigation and the actual Agent process may be factors; model token and tool-call telemetry are missing.

**Final protocol verdict: `NO_SAFE_WINNER` yet — evaluation incomplete.** Required gate before winner selection: independently establish whether `{node_id:...}` dependency objects are legal/reachable in recognized GSA Job snapshots, including brownfield/old-version records; if permitted, candidate must cover them and be reverified with the new negative test. A post-benchmark corrective patch must be tracked separately (do **not** silently retroactively change the frozen 14m22s result). If the object form is provably outside valid supported inputs, mark the discrepancy out-of-scope with evidence and then prefer GSA4 on observed performance, subject to usual independent Review/Tester Host acceptance before any production merge.

**Unverified for both:** real Git/Memory SHA CAS under concurrent updates, Human approval provenance, source-to-Memory Criteria bindings, Host/AssetGen end-to-end, and independent model-driven Reviewer/Tester sessions.

**Lifecycle:** keep PR #57 and #58 DRAFT and both implementation branches unchanged. Do not merge, deploy or retire either, and do not close #34/#38/#40 until the winner's content is independently accepted. PR #40 references `main`; never delete `main` while retiring historical PRs.
