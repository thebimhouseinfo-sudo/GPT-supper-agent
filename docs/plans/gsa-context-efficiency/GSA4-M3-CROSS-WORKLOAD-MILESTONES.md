# GSA4 M3 — Cross-Workload Milestones and Job Pack Graph
## GOAL
Turn the approved-direction M3 crossed real-work experiment into a finite, evidence-routed Project workflow, with one Integration/Closure Owner and no unowned experiment branches. This subordinate milestone schedule does not replace GSA4 A-first milestones or the canonical approved Criteria.

**Status:** PLANNING — review/approval pending. Source reference: `GSA4-M3-CROSS-WORKLOAD-IMPLEMENTATION-PLAN.md` at the same development branch; source B `ccbb550da7d87cbcc10143078b14d18a34dfcc52`. Parent dev branch `upgrade/gsa-context-efficiency`. M3 Discussion input blob `ac97d74d91ed06a2348f3b3ebfc74b5be59f7484`.

## M3-00 — Reviewed planning, fixtures, Job Instructions, authority
### GOAL
Produce reviewed Plan/Milestones/Proposal, pinned candidate-neutral WG/WS fixtures and correct instructions, before any real baseline/candidate code experiment.
**Owner:** Planner; independent Reviewer for plan and Tester for held-out oracle. **JP owners:** JP-B (Baseline), JP-G3, JP-S, JP-EVAL, JP-CONVERGE.
**Exit:** (a) exact plan/proposal/milestone revisions reviewed and Git-read back, (b) valid Criteria/Manifest and current dev/baseline SHA, (c) frozen real WG and WS Task/input/acceptance plus independent held-out evaluation artifacts and SHA, (d) one `instruction.md` per meaningful pack at verified Job carrier, with upstream/downstream owner and destination, (e) experiment branch inventory and permission gate, (f) Direct Agent Candidate loading capability probed or explicitly BLOCKED. **Human:** existing product implementation approval required before source work.

## M3-01 — JP-B Original Baseline B
### GOAL
Complete meaningful WG and WS under the unchanged original GSA4 Harness and verify attributable outputs.
**Depends:** M3-00 exit and actual source Job approval; BASE-G and BASE-S may run in parallel only with isolated authorized branches/environments.
**Evidence:** separate BASE-G/BASE-S arms, performer Role/session where observable, B Harness/source/task/fixture SHAs, input/output blobs, branch base/final, practical implementation-and-test acceptance, independent readback; Host metrics UNKNOWN if not exposed.
**Recipients:** JP-EVAL and JP-CONVERGE. **No automatic baseline merge.**

## M3-02 — JP-G3 on WS
### GOAL
Produce actual G3 Candidate WS output and a valid pair with BASE-S.
**Depends:** frozen WS and BASE-S complete; M3-00 authorization and source isolation. **Scope:** smallest conditional G1/G2; GH NO_BUILD; Skill unchanged.
**Evidence:** exact Candidate source/Harness SHA *actually loaded* into independent Direct Agent (admission alone insufficient), WS execution from equivalent frozen start, source/Skill safety, result and cost, pair vs BASE-S.
**Recipient:** JP-EVAL, closure by JP-CONVERGE.

## M3-03 — JP-S on WG
### GOAL
Produce actual conditional Skill Candidate WG output and a valid pair with BASE-G.
**Depends:** frozen WG, BASE-G; source authority and actual Candidate Skill loading capability. **Scope:** descriptions-only C1a if baseline demonstrated selection ambiguity; C1b HOLD; C2 NO_BUILD.
**Evidence:** exact source/Skill revision and loaded body/description distinction, equivalent WG real output, D/S/L/N/I, safety, pair vs BASE-G.
**Recipient:** JP-EVAL, closure by JP-CONVERGE.

## M3-04 — JP-EVAL independent comparison
### GOAL
Adjudicate each crossed arm on actual accepted work, complete source/Criteria use and regression before cost.
**Depends:** four independently readable output receipts or explicit documented BLOCKED outcomes.
**Evidence:** independent Reviewer/Tester pair scores (`G3-on-WS:BASE-S`, `S-on-WG:BASE-G`), negative cases, declared confounders/Host unknowns, and instruction functional test for provisional→late bound→handoff→interrupt→closure; JI has **no token benchmark**.
**Disposition:** MERGE_CANDIDATE / NO_BUILD_RETIRE / NEED_MORE_EVIDENCE / BLOCKED.
**Recipient:** JP-CONVERGE.

## M3-05 — JP-CONVERGE integration and lifecycle closure
### GOAL
Hand off verified development result with no experimental branch missing a legal closure owner/disposition.
**Depends:** M3-04 independently verified verdict and branch inventory; any missing recipient/provenance blocks closure.
**Evidence:** each branch owner/base/final SHA/test/review/disposition/merge commit or retained KEEP/retirement receipt; integrated Development HEAD and actual retest, downstream recipient, durable readback.
**Human boundary:** no `main` merge or production deployment without separate authorization.

## Pack routing and ownership
| Pack | Producer | Initial inputs | Receiver / disposition owner |
| --- | --- | --- | --- |
| JP-B | Baseline GSA4 original Harness | Frozen WG, WS, B SHA, authorized branches | JP-EVAL; JP-CONVERGE owns closure |
| JP-G3 | G3 Candidate Direct Agent | WS + BASE-S evidence + verified G3 SHA | JP-EVAL; JP-CONVERGE owns closure |
| JP-S | Skill Candidate Direct Agent | WG + BASE-G evidence + verified S SHA | JP-EVAL; JP-CONVERGE owns closure |
| JP-EVAL | Independent Tester/Reviewer | Four receipts, M1-04 oracle, M1-03 negatives | JP-CONVERGE |
| JP-CONVERGE | Convergence Owner | Independent verdicts, all branches, authority | Development owner, separate main/deploy Human gate |

Planner prepares compact `instruction.md` entrypoints as part of reviewed M3-00. Unknown predecessor SHA fields are explicitly PROVISIONAL and must be updated after verified upstream readback before dispatch. Existing Harness/Skills decide HOW; no new persistent instruction schema or micro-Task files. Dispatch proceeds from actual GSA Job state; if the runtime cannot create/transition independent Agent sessions, report the unsupported capability rather than fabricating an unattended chain.

**Evidence truth:** Planning PASS ≠ Candidate execution PASS. CI PASS ≠ bounded Job DONE. All Project changes must be authorized against exact `PROJECT.md`, Git source/Memory writes must be read back and carry current SHA. STOP on denied permission; no workaround.
