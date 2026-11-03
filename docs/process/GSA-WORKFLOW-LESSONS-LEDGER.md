# GSA Workflow Lessons Ledger

Status: **CP1 CANONICAL PROCESS LEDGER**

Authority:
- this file is authoritative for **lesson ownership, disposition and checkpoint routing**;
- canonical architecture/harness/schema/eval files remain authoritative for the behavior they own;
- `docs/plans/GSA-V2-IMPROVEMENT-NOTES.md` remains a non-canonical intake/research note.

## 1. Collection contract

Lessons Learned is a continuous workstream. The collector shorthand is **LLC**.

In CP1, LLC is a **collector responsibility**, not a new runtime role, command, schema or autonomous fixer.

LLC records a candidate when real work exposes:
- a workaround because the normal workflow lacks a contract;
- a repeated workflow failure or ambiguity;
- a defect that was unusually hard to detect;
- a Reviewer, Human-invoked CR or Tester finding with reusable workflow value;
- an external mechanism worth migrating into GSA constraints.

LLC does **not** repair the workflow when collecting the lesson. Collection preserves the observation, evidence and candidate owner so a later reviewed checkpoint can decide whether to change canonical behavior.

Typical flow:

```text
candidate
→ dedupe against existing rule
→ classify owner
→ already-owned | delta-required | deferred checkpoint
→ implement when owned by the active checkpoint
→ eval / pilot / review
→ MERGE into canonical owner
→ checkpoint merge into upgrade/gsa-next
```

A workaround or temporary Human-approved bypass is evidence of a possible workflow gap; it must not silently become the new canonical path.

## 2. Dispositions

- `ALREADY_OWNED` — accepted lesson already has a canonical owner and sufficient evidence; do not duplicate it.
- `CP1_DELTA` — CP1 adds the missing canonical wording/process ownership without activating later runtime features.
- `DEFER_CP3` — Tester semantic behavior belongs to CP3.
- `CP4_DELTA` — CP4 adds first-class evidence/checkpoint planning structures without runtime execution.
- `CP5_DELTA` — CP5 activates safe checkpoint execution, applicability, recovery and evidence gates.
- `CORRECTION_ACCEPTED` — Human-selected correction requirement with durable owning Job(s), implementation/evidence obligation and phase gate in the active Correction Program.
- `CANDIDATE` — collected by LLC; observation is durable but no canonical workflow change is implied until a later reviewed checkpoint accepts/owns it.

## 3. Accepted lesson ledger

| ID | Lesson | Disposition | Canonical owner / destination | Evidence / eval | Checkpoint |
|---|---|---|---|---|---|
| WL-001 | Job boundary = context boundary | CP1_DELTA | `docs/architecture/PLANNER-SCOPE-AND-UIUX.md` | E21 | CP1 |
| WL-002 | Objective → Phase → Task → Job Pack → Milestone decomposition | CP1_DELTA | `docs/architecture/PLANNER-SCOPE-AND-UIUX.md` | E21 | CP1 |
| WL-003 | Progressive L0/L1/L2/L3 context | CP1_DELTA | `docs/architecture/AGENT-HARNESSES.md` | E19, E21, runtime harness | CP1 |
| WL-004 | Brownfield source is evidence, not automatic authority | CP1_DELTA | `docs/architecture/PLANNER-SCOPE-AND-UIUX.md` | E22 | CP1 |
| WL-005 | Relationship / precedence direction must be explicit and reread upstream truth later | CP1_DELTA | `docs/architecture/PLANNER-SCOPE-AND-UIUX.md` | E22 | CP1 |
| WL-006 | Coder self-review → repair → Goal Recheck | ALREADY_OWNED | `docs/architecture/CODER-GOAL-RECHECK.md`, `EXECUTION-AND-REVIEW.md` | E23 | Existing |
| WL-007 | Reviewer is context-isolated and source read-only | ALREADY_OWNED | `docs/architecture/AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md` | E24 | Existing |
| WL-008 | Critic Reviewer is Human-invoked only and stateless-by-contract | ALREADY_OWNED | `docs/architecture/AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md` | canonical contract | Existing |
| WL-009 | Tool presence != proven capability; UNVERIFIED != PASS | ALREADY_OWNED | `docs/architecture/CAPABILITY-CATALOG.md`, `EXECUTION-AND-REVIEW.md` | capability catalog | Existing |
| WL-010 | Translate local triggers into Trigger → Required action → Evidence → Exit condition | CP1_DELTA | `docs/architecture/EXECUTION-AND-REVIEW.md` | E26 | CP1 |
| WL-011 | Tester supports VERIFY / MEASURE / PROBE | ALREADY_OWNED | `docs/architecture/AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md`, runtime `testing-evidence` | E27 | CP3 |
| WL-012 | Tester runs at meaningful sparse checkpoints, not after every Task | ALREADY_OWNED | `docs/architecture/EXECUTION-AND-REVIEW.md` semantic rule; first-class checkpoint structure still lands in CP4 | E27 + Tester upgrade plan | CP3/CP4 |
| WL-013 | Unknown runtime facts must not be guessed; preserve them as first-class EvidenceNeed / UnknownRuntimeFact | CP4_DELTA | `AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md`, runtime Planner schema | E28 + CP4 roadmap | CP4 |
| WL-014 | Checkpoints may depend on multiple prerequisite nodes / Milestone boundaries | CP4_DELTA | `EXECUTION-AND-REVIEW.md`, runtime typed planning model | E28 + CP4 roadmap | CP4 |
| WL-015 | Staging runtime evidence is valid only when deployed source is bound to the exact reviewed source | ALREADY_OWNED | CP0 contract in E25 + upgrade roadmap | CP0 source/deploy read-back evidence | CP0 |
| WL-016 | Environment/tooling limitation is not a product PASS or product failure; keep unavailable checks explicit | ALREADY_OWNED | `CAPABILITY-CATALOG.md`, `EXECUTION-AND-REVIEW.md` | CP0 Tester PASS_RETEST_REQUIRED | Existing/CP0 |
| WL-017 | Merge checkpoints early into integration; promote to production main only at final release | ALREADY_OWNED | `docs/plans/GSA-UPGRADE-INTEGRATION-ROADMAP.md` | CP0 merge evidence | Upgrade roadmap |
| WL-018 | LLC collects workflow candidates but never resolves them implicitly | CP1_DELTA | this ledger + `docs/architecture/EXECUTION-AND-REVIEW.md` | E26 | CP1 |
| WL-019 | Random attempt IDs are not concurrency control; one deterministic checkpoint claim + exact-SHA lease must serialize a live Tester attempt | CP5_DELTA | `CORE-RECORD-CONTRACTS.md`, `EXECUTION-AND-REVIEW.md`, runtime checkpoint tools | E29 | CP5 |
| WL-020 | `PASS_RETEST_REQUIRED` must never bypass a mandatory EvidenceRequirement/checkpoint gate | CP5_DELTA | `JOB-LIFECYCLE.md`, `EXECUTION-AND-REVIEW.md`, runtime evidence gate | E29 | CP5 |
| WL-021 | PLAN_GAP/SPEC_GAP during NEXT execution requires a reviewed superseding planning revision; old revision evidence becomes non-applicable | CP5_DELTA | `STATE-MACHINE.md`, `EXECUTION-AND-REVIEW.md`, runtime plan supersession guard | E29 | CP5 |

| WL-023 | Cross-chat/session memory must not silently become operational context. GSA is project/repo work, so users may have multiple chat seasons open and may speak in the wrong frame. The active GSA project is also the default discussion frame: GSA must not start or continue discussion about another project merely because memory recognizes it. Another project may be referenced without interruption only when the user intentionally refers to it and the reference is materially relevant to the active project's work (for example dependency, comparison, migration, integration or lesson). If the topic belongs to another unrelated project, GSA must first warn that the user is speaking outside the current project frame and ask whether they still want to discuss it. User confirmation permits discussion only; it does not switch the active project or grant mutation authority. Prior-memory details remain retrieval hints only and must be re-grounded before they influence assumptions, routing or actions. | CORRECTION_ACCEPTED | future context-isolation/admission contract review (`AGENT-HARNESSES.md` / `EXECUTION-AND-REVIEW.md`) | Real incident: a CAD add-in question sent in the Supper Agent chat was answered from CADGPT memory from another chat season instead of first detecting context mismatch and re-grounding | LLC backlog |

| WL-024 | **Hard discussion/write-scope isolation with user-directed cross-project reference only.** Once a GSA project is opened, that project is the default discussion and absolute mutation boundary. GSA must not proactively infer that another project/repo is relevant, browse it, compare against it, or copy from it. Cross-project read is allowed only when the user explicitly directs GSA to reference a named external project/repo/file/source (for example: “read this implementation in CADGPT”, “compare with RevitGPT”, or “copy/adapt this file from repo X”). The read scope is limited to what the user asked to reference. GSA may copy/adapt referenced material into the currently active project's allowed repository set only when the user explicitly asks for that reuse as part of the active project work. Read/reference permission never grants mutation authority over the source project. Memory, prior chats, similarly named projects, user discussion, user confirmation, or even an explicit user instruction to write into another project's repo must never authorize a cross-project mutation. If the user appears to have sent a request from the wrong chat/project frame, GSA must stop operational discussion/mutation, warn that the topic belongs to another project and ask whether the user still wants to discuss it. If the user confirms, discussion may continue without changing the active project. If the user asks to edit/write/create/delete/merge/deploy in another project/repo, GSA must refuse that mutation and instruct the user to `gsa/stop`, then explicitly `open` the target project, re-establish its project/repo scope, and only then issue the write request there. **Cross-project writes are absolutely forbidden even when explicitly requested by the user.** The only exception is LLC collection: when recording a workflow lesson about GSA itself, LLC may write that lesson to the canonical `GPT-supper-agent` Lessons Ledger/repo even when the observed incident occurred while operating another project. This exception grants no other source-code or project mutation authority. | CORRECTION_ACCEPTED | future admission/read-scope/write-authorization/context-isolation contract (`AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md`, project-open/mutation guards) | User requirement after cross-chat context incident: cross-project reference must be explicitly user-directed, while all mutation remains locked to the active project | LLC backlog |

| WL-025 | **Prepared lifecycle transition is not durable completion.** A control-plane tool may validate/prepare a Job/Run transition while the authoritative Memory Repo write is later denied or blocked by the host/platform. The prepared record must not be treated as persisted state, and the agent must not route around the denied write through alternate mutation APIs. Preserve the mismatch explicitly, keep durable source truth authoritative, and require a later legitimate persistence/recovery path before final promotion claims the lifecycle is closed. | CANDIDATE | future durable-control-plane persistence/recovery contract review (`JOB-LIFECYCLE.md` / `EXECUTION-AND-REVIEW.md`) | CP6/CP7 real execution: `job_transition` prepared valid completion/READY records while authorized Memory Repo update was blocked by platform safety; source checkpoint merge remained independently verifiable | LLC backlog |
| WL-026 | Approved-plan invariants must be revalidated against executable runtime behavior before merge; implementation divergence is not an acceptable silent detail. | CORRECTION_ACCEPTED | future plan-to-runtime traceability contract | `docs/process/lessons/UPGRADE-IMPLEMENTATION-DRIFT-2026-10-04.md` | LLC backlog |
| WL-027 | Accepted requirements from detail/specialist plans must map explicitly into the master roadmap, owning checkpoint, implementation surface and eval; missing ownership is PLAN_GAP. | CORRECTION_ACCEPTED | future migration requirement-traceability contract | `docs/process/lessons/UPGRADE-IMPLEMENTATION-DRIFT-2026-10-04.md` | LLC backlog |
| WL-028 | Selftests/helper assertions are regression floors, not substitutes for required E2E workflow execution evidence. | CORRECTION_ACCEPTED | future E2E-evidence/test-quality contract | `docs/process/lessons/UPGRADE-IMPLEMENTATION-DRIFT-2026-10-04.md` | LLC backlog |
| WL-029 | Final cutover must explicitly KEEP/REPLACE/REMOVE every staging-only namespace, path, endpoint, flag or compatibility mechanism. | CORRECTION_ACCEPTED | future cutover-retirement checklist | `docs/process/lessons/UPGRADE-IMPLEMENTATION-DRIFT-2026-10-04.md` | LLC backlog |
| WL-030 | One canonical integration line per migration; checkpoint/topic branches are short-lived workspaces and must not remain competing sources of truth after merge. Excess branch/commit sprawl makes code provenance ambiguous and forces expensive ancestry/tree/semantic-diff reconstruction. | CORRECTION_ACCEPTED | future branch/checkpoint lifecycle + release-cleanup contract | `docs/process/lessons/BRANCH-COMMIT-SPRAWL-2026-10-04.md` | LLC backlog |

| WL-031 | **A completely new GSA chat defaults to Planner, never implicit Coder.** Opening GSA or opening a Project in a fresh chat establishes the planning/discussion frame only; it does not imply implementation intent, source mutation authority, or permission to "fix" an observed technical problem. Before proposing or dispatching implementation, Planner must first reconstruct the active project and durable context, read the relevant plan/contracts/source-of-truth, distinguish reported facts from assumptions, and make the problem/goal/scope clear enough that both Human and Planner share the same understanding. When context is incomplete or the user's message is primarily a report/status handoff, the correct first action is read/re-ground/clarify, not code. The Planner skill is incomplete until this fresh-chat admission/default-role behavior and context-reconstruction gate are explicit and testable. | CANDIDATE | future Planner admission/default-role/context-reconstruction contract (`AGENT-HARNESSES.md`, Planner harness/skill, project-open routing, planning evals) | Real incident 2026-10-04: in a completely new GSA chat opened on CadGPT, the assistant moved toward recording/fixing runtime issues before fully reconstructing what had happened; Human corrected that the fresh-chat default must be Planner and context must be understood before any code action | LLC backlog |

| WL-032 | **A failed hotfix retest must escalate from local patching to full failure-surface scan.** When a bug is first isolated and the evidence points to one concrete defect, a bounded hotfix is acceptable. But if the same user-visible failure, gate failure or acceptance failure still occurs after that hotfix, GSA must stop the pattern of “test until the next error appears, patch that one, repeat.” Before any further source mutation, the responsible agent must perform a systematic scan of all plausible causes across the affected execution path: direct callers/consumers, configuration/env resolution, duplicated/legacy implementations, cached/generated artifacts, runtime/process boundaries, persistence/state sources, platform/tool surfaces, relevant branches/revisions, and tests/contracts that may mask or reproduce the symptom. The scan must produce an explicit candidate-cause set, eliminate or rank candidates with evidence, identify the shared/root cause where possible, and only then plan the next repair. Repeated patch-retest-patch loops without this escalation are a workflow defect because they waste Human time, create restart churn, and can leave multiple interacting causes undiscovered. | CANDIDATE | future Coder/Debugger failure-escalation and root-cause investigation contract (`AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md`, coding-loop/debugging skill) | Real CadGPT incident 2026-10-05: Job-owned Lisp loading and Drawing Anchor persistence were hotfixed repeatedly; subsequent live tests still failed, revealing additional path/runtime/state causes one at a time and forcing repeated pull/restart/reopen cycles. Human requirement: after a hotfix fails retest, stop incremental whack-a-mole debugging and full-scan all credible causes before the next fix. | LLC backlog |
| WL-033 | **Bug fixing requires root-cause mapping plus behavioral call-chain simulation, not patch + CI closure.** For a non-trivial defect, the responsible agent must lock the observed symptom, map the feature relationship/call graph (entrypoint → callers/dispatchers → target → callees → state/config/persistence → process/runtime/generated surface → final user-visible result), enumerate and evidence-rank all plausible failure points, then patch the smallest shared/root cause. Green CI is necessary but not closure: after CI, the agent must simulate the real invocation path with concrete arguments/state and executable mocks/stubs/fixtures where practical, including reload/restart/session/persistence transitions when relevant. If the feature requires a real host, simulation is followed by live acceptance. A failed simulation/live retest returns to the failure-surface map rather than starting another symptom-by-symptom patch loop. Preferred future owner is a Bug Fixer/Debugging skill for Coder (or a mandatory debugging branch in coding-loop); do not create a new role unless later evidence proves separate authority/context/lifecycle is needed. | CANDIDATE | future Coder debugging contract + Bug Fixer/Debugging skill (`AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md`, coding-loop/debugging skill) | `docs/process/lessons/BUG-FIX-ROOT-CAUSE-SIMULATION-2026-10-05.md`; CadGPT 2026-10-05 incidents: Job Lisp multi-gate path, Drawing Anchor live persistence despite green source tests, Human Power registered server-side but absent from connector tool surface | LLC backlog |

| WL-034 | **NEXT Task IDs must be consistent end-to-end.** The Job/Run contract allows stable nonempty Task IDs such as `ADVISOR-FIX`, but Goal Recheck and Task add-in tool schemas required UUID. This blocks legitimate closure after source/CI passed. Accept the same nonempty identifier throughout, then enforce exact Job/Run/Task ownership, current planning revision and criterion coverage; never mint fake UUIDs to close work. | FIX_IN_DEVELOPMENT | `run-execution-tools.ts`, `project-setup-tools.ts`, `goalRecheckCoverageError`, source-bound tests | Real Jobs J-2AD6 and J-F0B4; `docs/process/lessons/LLC-034-035-TASK-ID-AND-BROWNFIELD-BOOTSTRAP-2026-11-03.md` | GSA1 scoped repair |
| WL-035 | **Brownfield Bootstrap reuses approved source artifacts.** A project with existing Human-approved Criteria, reviewed aligned Plan, Milestones and Technical Proposal must not be trapped in duplicate `PROJECT_PLAN` Job registration, opaque SHA-binding ritual or capability verification for future product Tasks. Bootstrap has four prerequisites (Criteria, Plan, Milestones, next-Task Coder/Tester ability); Proposal is not an extra gate. Reuse source Plan evidence and check the first executable Task set, but never infer approvals or grant source-write permissions. | FIX_IN_DEVELOPMENT | `bootstrap.ts`, `project_bootstrap_readiness_prepare`, canonical Bootstrap skill and tests | GSA-Localconnector real 2026-10-22 lesson in GSA Project Memory; `docs/process/lessons/LLC-034-035-TASK-ID-AND-BROWNFIELD-BOOTSTRAP-2026-11-03.md` | GSA1 scoped repair |



## 3.1 Candidate hard requirements from cross-chat safety incidents

Until a later reviewed checkpoint assigns and implements these candidates, the intended safety requirements are:

1. **Active project is the default discussion and mutation boundary.** GSA should reason and converse from the explicitly opened project/repo context, not from whichever other project memory happens to match a phrase.
2. **Cross-project discussion requires deliberate relevance.** GSA may discuss another project only when the user intentionally refers to it and the reference is materially relevant to the active project (for example dependency, comparison, migration, integration, reuse or lesson). This permission is contextual only and does not authorize any write to the referenced project.
3. **Memory is neither discussion authority nor write authorization.** Saved memory, prior chat seasons, inferred project identity, or familiar repo names may help locate a possible referent, but must not cause GSA to silently switch project context or continue an unrelated project discussion.
4. **Wrong-frame detection must warn before discussion continues.** If the current request appears to belong to another project/repo/chat frame and there is no clear user-intended relevant reference, GSA must stop operational discussion and mutation and explicitly warn the user that they are talking about a different project from the current one, then ask for confirmation before continuing discussion. Canonical behavior: “You are talking about another project that is not related to [current project]. Are you sure you want to discuss this topic?” If the user confirms, GSA may discuss the topic in the current chat but must not mutate that other project/repo. Operational work or mutation on the other project still requires an explicit project switch/open and repo-scope re-establishment.
5. **No proactive cross-project discovery.** GSA must not infer on its own that another project/repo should be consulted, even when projects look related or share architecture. Memory or similarity is not a trigger to browse another repo.
6. **Cross-project read requires an explicit user reference.** GSA may read another project/repo only when the user specifically asks to reference a named project, repo, file, implementation or source. The read must stay within the requested reference scope.
7. **Copy/adapt requires explicit user intent.** Reading a referenced source does not itself authorize reuse. GSA may copy/adapt material into the active project's registered/working repository set only when the user explicitly asks to reuse/copy/adapt it for the active project.
8. **Read permission never becomes write permission.** Reading or reusing material from another project does not authorize any mutation of that source project/repo.
9. **Active project is the absolute mutation boundary.** GSA may mutate only durable records belonging to the explicitly opened GSA project and repositories registered/selected for that project. User intent or user confirmation cannot widen this boundary.
10. **Explicit user request does not authorize cross-project writes.** If the user asks GSA to write/edit/create/delete/merge/deploy in another project's repo while a different project is active, GSA must refuse the mutation. The required behavior is to tell the user to run `gsa/stop`, then explicitly `open` the target project, re-establish its allowed repo scope, and repeat the requested write from that project context.
11. **Discussion permission is not mutation permission.** Even when cross-project discussion/read is intentionally relevant, GSA must not write to the referenced project until that project becomes the explicitly opened active project.
12. **LLC-only exception.** LLC may record a GSA workflow lesson in the canonical `GPT-supper-agent` Lessons Ledger when the lesson is discovered while operating another project. This exception is limited to lesson collection and does not permit arbitrary source/docs changes in `GPT-supper-agent` or any other repo.

## 3.2 CP7 closure audit

CP7 reread confirms:
- accepted rows WL-001 through WL-022 point to existing canonical owners and named eval/runtime evidence;
- `docs/plans/GSA-V2-IMPROVEMENT-NOTES.md` remains explicitly NON-CANONICAL and points accepted ownership to this ledger;
- WL-023, WL-024 and WL-025 remain `CANDIDATE` and are not silently promoted into runtime behavior;
- the CP6 durable lifecycle persistence mismatch is therefore visible as unresolved control-plane evidence, not hidden behind the CP6 source merge.

This audit closes the CP7 **lesson ownership check** only. It does not resolve candidate lessons or authorize production promotion.


## 3.3 Correction requirement traceability

For the active correction program, every accepted requirement must carry:
`requirement_id → durable source → owner Job/Task or gate → implementation surface → required evidence → disposition`.

Missing owner, implementation surface, evidence target, or disposition is `PLAN_GAP`. Schema presence alone is not implementation proof. `VERIFIED` requires evidence bound to the exact current implementation revision. Planner must reread this matrix before downstream correction work; Reviewer must compare the exact target against the rows owned by that phase; P5 audits all accepted rows before release.

| Requirement | Durable source | Owner | Implementation surface | Required evidence | Disposition |
|---|---|---|---|---|---|
| CR-P0-BASELINE | CR 01a106a5 + Correction Program | P0 J-D057 | lessons ledger + lesson notes + roadmap | main-only disposition + exact diff/tree proof | IMPLEMENTED |
| CR-WL-023 | WL-023 | P0 J-D057 | AGENT-HARNESSES + EXECUTION-AND-REVIEW + runtime harness | wrong-frame contract review + admission eval | IMPLEMENTED |
| CR-WL-024 | WL-024 | P0 J-D057 | authorize_project_scope + shared runtime harness | scope selftest + staging runtime evidence | IMPLEMENTED |
| CR-WL-026 | WL-026 + drift lesson | P0/P1/P2 | traceability matrix + Planner/Reviewer rules + owning runtime | invariant-to-runtime Reviewer comparison | IMPLEMENTED_P0_FOUNDATION |
| CR-WL-027 | WL-027 + drift lesson | P0/P1/P2 | this matrix + owning Job plans | complete source/owner/surface/evidence/disposition coverage | IMPLEMENTED_P0_FOUNDATION |
| CR-P1 | Correction Program P1 | P1 J-2EF7 | NEXT dispatch/topology runtime | wrong-role/prerequisite/stale-revision tests | IMPLEMENTED |
| CR-P2 | Correction Program P2 | P2 J-AACD | Goal Recheck + durable REVIEW/TEST Verification + UI specialization dispatch gate | E34 + staging aggregate selftest + exact Tester/Reviewer evidence | IMPLEMENTED_P2 |
| CR-WL-029 | WL-029 | P3 J-7793 + P5 J-4D20 | P3-C01..P3-C16 cutover inventory + memory_namespace/runtime gates | E35 + staging exact-source matrix + final P5 release proof | IMPLEMENTED_P3_PENDING_P5_RELEASE |
| CR-WL-028 | WL-028 | P5 J-4D20 | public GSA control paths | real E2E evidence independent from /selftest | PLANNED |
| CR-WL-030 | WL-030 + branch-sprawl lesson | P0 + P5 | branch policy + branch audit | exact absorption proof + no unique completed side-branch source | IMPLEMENTED_P0_POLICY |
| CR-V2-COMPAT | compatibility fence | P0/P1/P2/P3/P5 | legacy execution-contract paths | P3 staging smoke + final legacy P5 E2E | IMPLEMENTED_P0_P3_SMOKE_PENDING_P5 |

The newer fresh-chat Planner-default candidate that arrived with ID WL-026 is renumbered to WL-031, and the pre-existing failed-hotfix/full-scan candidate that arrived with ID WL-027 is renumbered to WL-032. Both remain CANDIDATE; Correction WL-026/WL-027 keep their program IDs.

Concurrent canonical drift note: upgrade/gsa-next added the hotfix-retest candidate using WL-027 while correction P0 already owns WL-027. P0 preserves both by renumbering the newer candidate to WL-032; this is ID reconciliation only.

## 4. CP1 closure rule

CP1 is complete only when:
- every minimum lesson in the master roadmap appears in this ledger;
- every `ALREADY_OWNED` row points to a real canonical owner;
- every `CP1_DELTA` row has matching canonical source and evidence;
- CP3 semantic rows and CP4 planning rows remain non-executing until their owning checkpoint/runtime activation is complete;
- the improvement note points here instead of acting as authority;
- E26 passes review.

At CP7, this ledger is reread to prove no accepted lesson remains only in a working note.


| WL-022 | Evidence JSON is not durable evidence: NEXT gates require deterministic path + exact blob-SHA snapshots and immediate read-back before consequential persistence | CP5_DELTA | `CORE-RECORD-CONTRACTS.md`, `EXECUTION-AND-REVIEW.md`, runtime gate/claim contracts | CP5 Reviewer finding + E29-19/20/21 | CP5 |

## LLC58 — GSA Local legacy Job admission and Human Plan Change (2026-10-10)

**Source:** [LLC58 original](lessons/LLC-058-EXECUTION-CURSOR-LEGACY-JOB-2026-10-10.md). Original evidence and original unresolved classification are preserved. **Status: CANDIDATE / IMPLEMENTATION_REVIEW_PENDING.** This section adds the later Human clarification; it does not retroactively change the incident facts.

| Lesson | Human clarification / reusable requirement | Candidate owner | Evidence / acceptance |
|---|---|---|---|
| LLC-058-A | A historical IN_PROGRESS Job must not be rejected under an opaque NEXT cursor error merely because newer production defaults differ from its durable contract; distinguish identity, lifecycle, contract, revision, namespace and cursor conflict, and route legitimate legacy Jobs to their own contract or explicit reviewed migration. | runtime cursor admission + Job lifecycle | J-9067 incident; non-destructive legacy admission matrix |
| LLC-058-B | Human may interrupt to change the approved Plan. Before re-dispatch, compare READY/IN_PROGRESS/COMPLETED Jobs to the new reviewed intent; retain unaffected Jobs, reconcile impacted active Runs/cursors, supersede obsolete Jobs and create *new unique IDs/names* for replacement Jobs. Never reactivate terminal Jobs or transfer PASS evidence implicitly. | Planner / Job lifecycle / reconciliation gate | exact-SHA multi-Job impact matrix + interrupted replacement acceptance |
| LLC-058-C | Reconciliation across several Jobs must be resumable/idempotent, with explicit dependency rebinding and source/Verification preservation. Pending writes remain blocked until reconciled. | durable control-plane + dispatch gate | failure injection after each consequential write; no duplicate Job creation |
| LLC-058-D | Collector intake must not silently become source write permission, nor lose the lesson when the ordinary execution cursor is blocked. Preserve a permitted append-only LLC intake path under the active Project boundary. | LLC governance / authorization | record original LLC58, authorization negative controls |

**Important distinctions:** a Plan revision *within one Job* is not necessarily a Project-level plan replacement affecting multiple Jobs; replacing a Job is not the same as revising its in-Job `planning_revision`; superseding a Run is not superseding its Job. Do not infer that LLC58's cursor denial was caused by Plan drift without the original Job JSON and served-runtime validation.

**Completion:** retain CANDIDATE until exact-source implementation, negative controls, independent Reviewer and real GSA Local J-9067 acceptance establish the contract and migration/replacement behavior. No blanket legacy-to-NEXT conversion, no fake PASS and no raw Git bypass after a GSA admission denial.

## LLC59 — GSA autonomy regression during CI/internal test repair (2026-10-10)

**Source:** [LLC59 original](lessons/LLC-059-AUTONOMY-REGRESSION-CI-REPAIR-2026-10-10.md); [GitHub issue #20](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/issues/20). **Status: CANDIDATE / ROOT_CAUSE_UNVERIFIED / FIELD_ACCEPTANCE_PENDING.** Human reports that GSA now requests manual CI/log collection and other work it previously automated; this is a user-observed behavioral regression, not a proven source-level regression from any particular recent commit.

| Lesson | Required future behavior | Candidate owner | Evidence/acceptance |
|---|---|---|---|
| LLC-059-A | **Autonomous-first CI diagnostics:** On RED inspect exact workflow run, failed jobs, steps and available logs through connected tools; never request the Human to copy diagnostics already agent-accessible. | Orchestrator + GitHub tool discovery | Incident run 38054066762 had runner_id=0/steps=[] and unavailable logs; agent should identify it without Human labor. |
| LLC-059-B | **Bounded self-repair loop:** classify failing build/test/CI config; Coder repairs and reruns, Tester/Reviewer stay independent; no blind retry or fake green. | Coder coding/debugging loop + Tester routing | Real Project Job with actual RED→diagnosis→repair→GREEN or explicit blocker, source-bound evidence. |
| LLC-059-C | **Observed capability fallback:** If hosted runner/log unavailable, attempt an authorized equivalent internal test surface when already observed; record that hosted CI is still UNVERIFIED. | Capability catalog + Orchestrator | Direct runtime evidence from sandbox alternative and truthful test-surface distinction. |
| LLC-059-D | **Minimal necessary Human request:** Escalate only authentic Human-only permissions, secrets, external host/device, decisions or exhausted/unsafe automation, explaining attempted alternatives. | Planner/Orchestrator Human Gate | Before/after metrics: avoidable Human handoffs, CI evidence self-retrieval, retries, latency and real Project acceptance. |

**No automatic promotion:** The LLC entry is not an implementation, not an authority to bypass scope/denied writes, and not grounds to remove genuine Human Gates. Review the exact incident path (harness/prompt/tool capability/routing) before choosing the minimal implementation.

## LLC60 — Planning-review loop stops after review or plan repair (2026-10-11)

**Source:** [LLC60 original report](lessons/LLC-060-PLANNER-REVIEW-LOOP-STOPS-2026-10-11.md); [issue #22](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/issues/22). **Status: CANDIDATE / SOURCE_FIX_IN_BRANCH / FIELD_ACCEPTANCE_PENDING.** Human reports that Planner/Reviewer finish each individual stage, then require another Human “continue” to repair or review again.

| Lesson | Proposed requirement | Candidate owner | Required acceptance |
|---|---|---|---|
| LLC-060-A | A prepared planning tool response, review verdict, or revised plan must not end the user turn. After authorized durable GitHub Memory Repo write + independent SHA readback, Orchestrator follows the typed `continuation.next_action_after_readback`: DRAFT→Reviewer; CHANGES_REQUIRED→Planner revise→Reviewer; PASS DRAFT→READY; PASS NEXT IN_PROGRESS→resume dispatch. | Orchestrator + existing Job planning/review MCP outputs | One real scoped Job completes at least two fixable review cycles without Human “continue”; source-derived negative controls. |
| LLC-060-B | Planning-review is independently **role isolated** from prior Planner reasoning but may run in the SAME USER TURN/chat, unlike mandatory fresh-context independent source/code reviews. Human-invoked CR remains Human-only. | Planner/Reviewer harness + planning-review skill | No false fresh-chat gate or automatic CR dispatch. |
| LLC-060-C | The follow-up route is not mutation authority or durable progress. Preserve exact persisted Job/Verification SHA/readback, rerun only on new reviewable revision and stop only for material Human decision, evidenced blocker, denied writes or no-progress. | GSA Memory Repo CAS/Reviewer/Job lifecycle | Negative controls for stale-state, Human Gate, PASS→READY, NEXT supersession; live project evidence. |

Neither documentation nor helper tests alone establish live ChatGPT same-turn continuation. Do not promote LLC60 to RESOLVED until operational evidence on a real scoped Project Job exists.
