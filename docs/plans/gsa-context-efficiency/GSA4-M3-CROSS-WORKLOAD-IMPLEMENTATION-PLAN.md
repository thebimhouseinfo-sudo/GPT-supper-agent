# GSA4 M3 — Cross-Workload Experiment Implementation Plan
## GOAL
Validate the actual correctness, continuity, handoff and bounded net value of G3/Skill optimization through **two real frozen jobs** and **two crossed candidate re-executions**. Original GSA4 Baseline B performs both WG=M3-G and WS=M3-S. G3 Candidate independently repeats WS; Skill Candidate independently repeats WG. Finish with attributable results, independently evaluated comparisons, authorized integration/retirement, and no unowned experiment branches. Job Pack Instructions are a workflow reliability aid, NOT a context benchmark.

**Status:** PLANNING REVISION — AWAITING ROLE-ISOLATED REVIEW AND HUMAN PRODUCT IMPLEMENTATION APPROVAL; no Candidate code, run, Host benchmark, merge or deploy claimed.
**Project:** `01a0f051-4353-7bff-8edf-46be4b44fd2f`; Memory `thebimhouseinfo-sudo/GSA-Projects@main`.
**Product:** `thebimhouseinfo-sudo/GPT-supper-agent`; configured development `upgrade/gsa-context-efficiency`; release `main`.
**Original B:** `ccbb550da7d87cbcc10143078b14d18a34dfcc52`; development observed at initial planning `82374898dbb664650098d8ad88b46477055b992d` (20 ahead, 0 behind relative to B; re-read before work).
**Authority:** Project Criteria blob `ff45d47435ae6cc9ae4acd5106bf945308fb4f95`; Project Manifest `77854ca49d6532773a68ea3755a3b5054a5bbc63`; M3 Discussion draft `ac97d74d91ed06a2348f3b3ebfc74b5be59f7484`; M1-04 contract `be80b2e71ffcd1d013f4251cc1c9b4a92369952a`; M2-03 reviewed closeout `7989792ebeefb00ff9477fd6336c612ef71ffdf3`.
**Place in authority hierarchy:** bounded M3 experiment extension to `GSA4-DETAIL-PLAN.md` and companion `GSA4-TECHNICAL-PROPOSAL.md`, not their replacement; approved Criteria and earlier GSA4 A-first goals remain unchanged. An M3 Discussion is input, not approval.

## Fixed decisions and non-goals
- G3-G1 NARROW; G3-G2 conditional design/provenance trial only; GH STOP/NO_BUILD.
- Skill C1a NARROW descriptions-only if observed ambiguity; C1b EVIDENCE_INSUFFICIENT/HOLD; C2 STOP/NO_BUILD.
- Accepted G3 reading: authoritative GOAL plus exact full original applicable Criteria/Acceptance, multiple origins, sibling scope only within defensible reviewed carrier; broader reads allowed. No automatic new schema, index or blanket Role restriction.
- Preserve all eight Role contracts, mandatory NEXT Skill injection, Secretary/accepted-decision fidelity, U-D/U-F, Reviewer/CR independence, Human gates, branch policy, source/CAS/cursor, and truth of Host measurements.
- No new permission gates, no auto-candidate deployment, no self-approved main merge or release, no assumed session spawning, no baseline contamination.

## Phase M3-00 — Planning, evidence freeze and instructions
### GOAL
Prepare reviewable official plan, milestones and technical rules plus actual reproducible WG/WS fixture bytes, source authority, Job Pack Instructions and safe branch registry **before any experiment**.
- Planner reconciles criteria and accepted decisions, current B/dev ancestry and currently active Jobs; updates M3 documents, obtains role-isolated planning review and fixes findings.
- Define two real implement-and-verify tasks WG (M3-G) and WS (M3-S), with frozen realistic Task payloads, independent held-out acceptance oracles, exact sources/versions, expected deliverables, tools/model settings, permissions and repo state. Their work must be meaningfully completable, not quiz-only or CI-only. Tester owns held-out oracles; author must not receive answers.
- Select existing official Project Job/Milestone carrier and create **one short `instruction.md` per meaningful pack**: JP-B, JP-G3, JP-S, JP-EVAL, JP-CONVERGE. The instruction is a linked entrypoint, not a second Harness/Skill/Proposal or micro-Task file. It names initial sources and source pins, dependencies, allowed working branch/scope, expected outputs/evidence location, recipient, DONE and closure owner. A provisional downstream instruction must be late-bound to verified predecessor commits/blobs before dispatch.
- For all experimental branches record parent dev branch, base SHA, owning Job, authorized scope, output, handoff recipient, convergence/closure owner, and eventual merge/retire/KEEP conditions. Avoid creating branches before valid authorization.
- Confirm the host can **actually** execute exact Candidate Harness/Skill revision in a distinct Direct Agent session. Admission alone is not proof of candidate loading. If capability absent, state BLOCKED with reproducible probe and smallest permitted resolution, never substitute production Harness.
- **Exit:** reviewed and Git-persisted planning; exact frozen fixture/evaluation SHA; instructions with legitimate Job owners; actual approved implementation authority before source edits.

## Phase M3-01 — Original GSA4 B real baseline
### GOAL
Produce `BASE-G` and `BASE-S` as attributable full-work outputs, not only source or CI evidence.
- Run WG and WS under original unchanged B in isolated authorized conditions, independently if parallel execution and branch scope permit.
- Record arm/Role/Agent session when exposed, Harness and Product SHA, original Task/instruction blobs, branch base/head and output SHAs, actual tests, review, Host/model/effort, source/tool reads and costs, timestamps when observed, outcome PASS/PARTIAL/BLOCKED.
- Verify exact evidence destinations and independent readback; do not automatically merge baseline variants. **Recipient:** JP-EVAL and JP-CONVERGE.

## Phase M3-02 — G3 Candidate on WS
### GOAL
Test whether separately pinned G3 behavior improves the real WS Skill work without source-provenance, Skill or safety regression.
- Implement only a justified narrow G3 scope (conditional G1/G2) on an authorized isolation branch, keeping Skill variant unchanged.
- Independently verify Candidate Harness/source actually loaded into Direct Agent and run **the same frozen WS** from equivalent initial state; do not leak BASE-S produced result or held-out oracle.
- Compare `G3-on-WS` **only with BASE-S**, accounting for source/task quality and full criteria, Skill D/S/L/N/I behavior, extra reads, complete-context cost and unavailable Host measurements. **Recipient:** JP-EVAL.

## Phase M3-03 — Skill Candidate on WG
### GOAL
Test whether conditional narrow catalog C1a changes help real WG G3/context work without breaking correct Skill discovery, none, NEXT or Role fidelity.
- Conditional source trial only after independent baseline evidence of misselection; descriptions only, preserving 13 names, bodies, Role/NEXT and other G3 behavior.
- Independently load exact Skill Candidate revision in isolated Direct Agent and execute **the same frozen WG**.
- Compare `S-on-WG` **only with BASE-G**, separately scoring catalog discovery vs post-catalog selection, optional load, correct none, NEXT required injection and mandatory Role contracts. **Recipient:** JP-EVAL.

## Phase M3-04 — Independent evaluation
### GOAL
Make source-pinned, real-work verdicts using quality-first comparisons rather than text-size or CI-only claims.
- Independent Tester/Reviewer confirms four actual outputs, equivalent fixture/control, revision identity, original GOAL/Criteria/Acceptance, mandatory safety and no-regression, and independently checks outcomes.
- Score `G3-on-WS : BASE-S` and `S-on-WG : BASE-G`; model/Host token, caching, E2E latency UNKNOWN unless observed; negative cases and contamination invalidate claimed win.
- Separately exercise instructions for normal handoff, absent/stale instruction→Planner repair, predecessor SHA late binding, interruption/resumption and final closure. **No Job Instruction context-savings benchmark.**
- Record `MERGE_CANDIDATE / NO_BUILD_RETIRE / NEED_MORE_EVIDENCE / BLOCKED` per Candidate with explicit evidence and limits. **Recipient:** JP-CONVERGE.

## Phase M3-05 — Convergence and closure
### GOAL
Resolve each experiment branch into an authorized disposition and hand off a verified Development HEAD or documented no-build decision.
- Convergence Owner reads exact incoming branch inventory, SHAs, independent comparisons and review/test receipts, then chooses eligible code or NO_BUILD.
- Only authorized integration into `upgrade/gsa-context-efficiency`; test/review integrated result; record merge/retire/KEEP and closure for every branch with SHA and recipient. Never delete Human KEEP or unsafe ref.
- No completed Job Pack if an incoming branch lacks disposition, owner and closure/handoff; interruptions persist PAUSED state with exact SHA.
- Any `main` merge or production deployment awaits separate existing Human authorization.

## Job graph and continuation
`M3-00 → M3-01[BASE-G || BASE-S] → [M3-02(G3-on-WS) || M3-03(S-on-WG)] → M3-04 → M3-05`.
All actual dependencies require persisted predecessor evidence, not just design/CI PASS. Planner late-binds source refs and repairs provisional instructions; Orchestrator/NEXT dispatches permitted downstream Jobs in the same active workflow. If session spawning or handoff cannot be executed by installed runtime, report a verified capability gap; **do not** claim unattended completion.

## Approval, review and completion
Planning review/repair is permitted now; source-modifying Coder and real execution require a reviewed Plan and the **existing Human implementation approval**, plus Job/branch permissions. Direct Agent is solely experimental executor, never Project authority or release owner. No new Criteria/Advisor checkpoint is invented.
M3 DONE = real four-arm attributed results or explicit evidence-backed failure/no-build outcomes, independent comparisons, Job Instruction continuity, full branch dispositions and verified handoff. All unverifiable metrics remain UNKNOWN. Historical completed research is reused; no retroactive claim of performed experiments.
