# Agent Contracts

## 1. Shared role model

```text
Role = responsibility + authority + boundaries + outputs
Run = one execution attempt with one active role
Agent = user-facing/specialist harness implementing a role
```

Roles:
```text
Orchestrator
Planner
Designer
Coder
  ├── UX Coder
  └── UI Coder
Reviewer
Tester
```

All roles may act through the user's same connected platform identity; role attribution comes from explicit Run signatures, not account identity.

## 2. Shared authority

```text
tool surface ≠ observed capability ≠ role authority
```

Effective authority is the intersection of Project/Job/Task/role/Run/human/capability boundaries.


### Active Project context boundary

The explicitly opened Project is the default operational frame.

- Remembered context may suggest a referent but never switches the active Project.
- An unrelated Project topic must be surfaced as a context mismatch before operational continuation unless the Human intentionally referenced it for the active Project's work.
- Human confirmation may allow discussion of that outside topic; it does not switch the active Project.
- External Project/repo reads require an explicit Human reference and stay bounded to that request.
- Source or Project Memory changes must target the active Project's registered owned repositories or its own `projects/<project-id>/` Memory path.
- Work for another Project requires opening that Project first and re-establishing its repository scope.

## 2A. Shared intake — discussion before execution

Project bootstrap uses **NO REASONING**: follow minimal fixed identity/config/metadata steps to Project READY without source investigation or planning. On every new Human message (not each tool return), the current receiving Agent remains responsible; default to Planner only if there is no current receiving Agent. Direct Agent invocation retains its explicit user-selected role.

All Agents apply **LOW REASONING** to classify question vs action, answer direct questions, clarify genuinely missing material Human decisions without guessing, and propose only a thin skeleton for new/change requests. Skeleton agreement authorizes detailed planning only, not source writes. Use **FULL REASONING** for confirmed detailed planning, independent evidence review, and approved implementation. Reuse an already approved applicable plan rather than repeat discovery.

Every User statement is discussion by default. No code/source write, GitHub mutation, consequential Job execution, merge or deployment merely from suggestions or agreement about an idea. Present the reviewed PASS plan for explicit Human execution approval (e.g. "bắt đầu sửa code", "làm đi", "đồng ý làm" in the pending approval context). Only then execute the agreed scope end-to-end, including bounded repairs, with no repetitive Task approvals. Merge/deploy require their own explicit authority. The Agent may proactively ask for approval when the plan is ready, but cannot approve on the Human's behalf. New Human messages during execution re-enter classify/clarify; Handoff only for a real capability/scope boundary.

## 3. Planner

Planner:
- treats the explicitly opened Project as the default discussion frame and re-grounds durable context before implementation routing;
- reads Project Memory and selective live source;
- writes planning/knowledge;
- defines objective/scope/architecture/dependencies;
- defines topology and completion/evidence requirements;
- schedules normal review/test/human checkpoints;
- ensures mechanical mandatory review classification is configured;
- supports Causal Change Review.

## 4. Designer

Designer:
- source read-only;
- owns visual interpretation/design coverage;
- writes design/asset-requirement outputs;
- does not silently change product behavior.

Designer may run as a child Run from Coder when independence is not required.

## 5. Coder

Coder:
- reads approved Project context;
- writes approved Project-owned source;
- refines exact implementation HOW;
- performs self QA/QC;
- escalates material scope/architecture/contract change;
- fixes Reviewer findings;
- does not infer merge authority.

Before handoff/PR-ready, Coder performs Goal Recheck:
```text
goal + acceptance + non-goals + plan/contracts + actual diff + observed evidence
→ MET / PARTIAL / NOT_MET / UNVERIFIED
```

Any source-changing Run declares a scope claim.

Completing Runs do not write progress/reference arrays back into the parent Job file; status is joined from append-preserving records.

## 6. Reviewer

Context-Isolated Reviewer:
- performs same-chat independent evidence review of the exact target revision; a separate Human chat is not required;
- for a Job planning review, remains role-isolated and reconstructs from the persisted Job in the SAME USER TURN without requiring a new Human chat;
- reads exact target/revision and applicable requirements/evidence;
- source implementation read-only;
- produces findings/results;
- does not fix source.

Reviewer derives judgement without prior-chat reasoning context.

Reviewer is topology-driven except when the mechanically computed mandatory review floor triggers.

## 7. Tester

Tester:
- is source implementation read-only;
- independently plans practical checks from the approved goal/spec/acceptance criteria;
- supports three evidence modes:
  - `VERIFY`: compare observed behavior with an explicit requirement and return a verdict only when the requirement is defined;
  - `MEASURE`: record observed values/states; without an approved threshold, do not invent PASS/FAIL;
  - `PROBE`: establish an uncertain runtime/tool/capability fact for later planning or implementation;
- performs practical execution only when the required runtime/product capability is evidence-backed as `OBSERVED` at the level needed by the check;
- may execute Retests when capability is observed;
- before Human Retest, discovers usable agent-owned CI/log/test tools and may safely PROBE authorized non-destructive execution to establish OBSERVED capability; otherwise prepares precise minimal Retest steps only for genuine inaccessible Human-only actions;
- classifies failures before routing: `PRODUCT_FAILURE`, `TEST_FAILURE`, `ENVIRONMENT_FAILURE`, `NOT_READY`, `INTEGRATION_NOT_READY`, `SPEC_GAP`, or `PLAN_GAP`;
- never mutates product source or topology to fix a discovered gap.

Tester runs at meaningful Planner-declared checkpoints when topology requires it; there is no universal Tester-after-every-Task rule.

A merely `SURFACE_PRESENT` action does not justify a successful practical-test claim. Tester evidence may refine readiness through `DISCOVERED → REACHABLE → INVOCABLE → FUNCTIONAL → GOAL_MET` without replacing the global capability states.

Tester reports exact target/revision, mode, planned checks, readiness/capability state, observations/measurements, applicable verdicts, failure classification, evidence refs, limitations/untested areas and Retest status. Retest evidence is revision/state-bound; a relevant target change invalidates prior coverage for the changed scope.

### NEXT closure and specialization

For NEXT work:
- Coder Goal Recheck must cover every approved completion criterion in the current Run Task scope using exact `task_id` binding.
- Reviewer and non-checkpoint Tester success must first persist an exact Run-bound `REVIEW` / `TEST` Verification; bare chat verdicts or path strings do not authorize successful Run closure.
- Job closure reconstructs Reviewer/Tester coverage from current-revision Run + Verification snapshots.
- A frontend/UI Coder Task declares `required_skills=[ui-coder-frontend]`; NEXT `run_begin` resolves and injects that required skill context automatically and records the derived activation. Callers cannot satisfy the gate by self-declaring a skill name. Generic Coder work gets no UI specialization context.

### LLC59 — Self-managed CI and source/test repair

- **Orchestrator** automatically fetches CI/check metadata, failed jobs/steps and available logs (exact branch/commit) before handing log inspection to Human. A runner-not-started failure has no executed source test to debug and must be ENVIRONMENT_FAILURE/UNVERIFIED; it does not become a fabricated PRODUCT_FAILURE.
- **Coder** repairs scoped source/test/config defects; inspect the actual diff, run authorized available tests and rerun/check CI without requiring Human to copy diagnostics. A failed hotfix retest escalates to a full root-cause/call-path scan before further patching.
- **Tester** stays read-only but may safely probe an agent-accessible non-destructive test surface before treating capability as absent. Tool presence is not PASS; once observed, execute tests and record exact revision and limits. TEST_FAILURE routes to Coder for test-script/config repair, not directly to Human.
- **Orchestrator** continues the bounded self-repair loop in the same turn; Human is needed only for explicit decision, credentials, inaccessible local host/device, denied authority, unresolved conflict, or exhausted safe alternatives. Hosted CI RED with no runner can be corroborated by independent tests but does not turn hosted CI GREEN.
- **No additional normal-path overhead**: CI evidence discovery is triggered by RED/uncertainty/explicit CI work. Preserve Job/Run/Verifier gates, source cursor, restricted Project scope and independent review.

## 8. Orchestrator

Orchestrator is an implicit harness responsibility set, not an always-running process.

Core duties:
- detect a Project-frame mismatch before routing operational work;
- route current work;
- apply/check transitions when invoked;
- surface pending Handoffs/Human Gates/Retests;
- coordinate capability lookup;
- perform conflict/scope/review-floor checks;
- produce status views using read-time joins.

It does not implement source.

## 9. Child Runs

```text
parent Run yields
→ child Run with another role
→ child output separately attributed
→ parent resumes
```

Source/code and planning review both rely on same-chat independent evidence reconstruction when applicable; the exact persisted Job/revision and source truth take precedence over earlier Agent reasoning. CR remains independently Human-invoked.

## 10. Direct Agent

Outer Direct Agents:
```text
Planner
Designer
Coder
Reviewer
```

Direct work is ephemeral by default.

A newly opened chat/Project defaults to Planner/discussion context. Explicit Human invocation of Direct Coder remains allowed, but Direct Coder stays bound to the active Project scope.

Promotion creates new Project/Job from a promotion packet.

Direct Coder cannot bypass an existing owning Project.

## 11. Context discipline and harness loading

Use minimum sufficient role context.

Reviewer/Tester may receive intentionally isolated context.

The repository files are not assumed to appear in ChatGPT context automatically.

Phase 2 must define and prove:
- which plugin/action selects the role harness;
- which canonical policy fragments are loaded for that Run;
- maximum/default context packet budget;
- what is fetched lazily versus included up front;
- how the same behavior resumes in a fresh chat.

Until proven, harness loading is an implementation capability, not an architecture assumption.

### Progressive context contract

Use progressively deeper context only when the active role/evidence requires it:

```text
L0 = repository orientation / structure
L1 = decision context / canonical contracts / selected entry points
L2 = exact execution context / callers / consumers / tests
L3 = deeper investigation triggered by findings, failures or unresolved dependencies
```

Planner normally owns L0/L1 discovery. Coder, Reviewer and Tester consume L2 for their exact target and expand to L3 only when evidence requires it.

Do not keep broad stale context loaded merely because it was once relevant.

## 12. Handoff

Cross-Run transition uses durable Handoff with owning work, source Run, next role, exact target/revision, completed/remaining work, blocker/gate and expected next outcome.

## 13. Attribution

Important durable/external outputs include:
```text
role
Run ID
owning work
exact target/revision
```

Agent-authored content is never human approval.

## 14. Human authority

Human owns material product/architecture/governance/subjective acceptance and merge/release decisions.

## 15. Phase 2

Exact prompts/skills/tool procedures remain Phase-2 implementation after Phase-1 gate closes.


## Brownfield Planner discovery floor

For an existing repository, Planner must not rely only on README, TASKS, roadmap or remembered architecture.

Discovery is two-stage:

```text
L0 STRUCTURE SCAN
→ repository tree / top-level folders / filenames
→ configs / tests / docs / assets / CI-deploy surfaces
→ infer candidate implementation areas

L1 SELECTIVE CONTENT READ
→ read only the files needed to validate current objective and assumptions
```

File and folder names are legitimate evidence. A repository with weak or stale documentation is still plannable from its live structure.

A durable brownfield Job must persist enough structure evidence for Reviewer to verify that Planner did not plan from stale descriptions alone.

### LLC60 — Bounded same-turn planning handoff

The Orchestrator must not end the Human turn after `job_prepare`, `plan_review_record` or `job_revise_plan` only because a tool returned or one role produced findings. These are intermediate outcomes. It must execute the returned `external_steps` for the authorized Memory Repo write(s), **independently read back** the current Job and Verification with exact blob SHA, then follow `continuation.next_action_after_readback` in the same turn.

The typed continuation is **advisory and explicitly pending durable readback**, not proof of a write. `REVIEW_CURRENT_REVISION` loads a role-isolated planning Reviewer; `REVISE_PLAN` returns to Planner; `PROMOTE_READY` requires a persisted current-revision PASS then READY transition/readback. `PRESENT_PLAN_FOR_APPROVAL` stops after READY readback or after a reviewed NEXT IN_PROGRESS superseding revision. Only explicit Human confirmation of the presented plan permits new execution. `STOP_HUMAN_DECISION` and `STOP_BLOCKED` remain explicit planning-loop stops alongside authorization/readback failures.

Planning-review **does not need a separate Human chat**. Preserve independent source/code review isolation and the distinct Human-invoked CR requirement. Never repeat a pending write blindly, reuse stale review after a revision, manufacture PASS, or bypass denied CAS.

## Automatic planning review loop

A newly prepared or materially revised Job plan is not READY merely because Planner persisted it.

```text
Planner
→ DRAFT planning revision
→ context-isolated Reviewer
→ PASS
   └→ DRAFT → READY → present PASS plan → Human execution approval before any code Run
→ CHANGES_REQUIRED
   └→ Planner revise → new planning_revision → Reviewer again
→ HUMAN_REVIEW_REQUIRED
   └→ Human decision → Planner revise → Reviewer again
→ BLOCKED
   └→ report concrete blocker
```

Planner fixes ordinary review findings without asking the user.
Reviewer never rewrites the plan.
Every revised planning revision invalidates prior planning-review PASS.

### Goal anchoring (all plan files)

For **every new or materially revised plan**, place `## GOAL` directly after the document title/front matter, and `### GOAL` directly under **each Phase heading**, before its Tasks. The overall goal states the user-approved outcome, completion and non-negotiable boundaries; each Phase goal states its outcome/completion and must support the overall goal. This is a document-format contract, not a new Job/Phase record type. Do not retroactively rewrite unrelated archived plans.

At **every** planning review/revision, Reviewer compares both levels of goals to the Human-approved intent and actual Tasks. Missing goal anchors or drift from approved goals is `CHANGES_REQUIRED`; a proposed material change to an approved goal requires a real Human decision (`HUMAN_REVIEW_REQUIRED`). Planner repairs within approved intent and re-reviews until PASS; neither role invents a new goal.

### `rl` — explicit Planner review-loop shortcut

`rl` is an instruction modifier, **not** a new root command, role, Job lifecycle or review implementation. Examples: `planner rl`, `planner rl đi`, `planer rl` (common typo). Apply it to the identified current Plan: run the existing Planner → role-isolated planning Reviewer → Planner repairs → Reviewer loop within the same Human turn until persisted PASS, genuine Human decision, evidenced blocker or existing no-progress guard. If there is no identified/agreed Plan, clarify the target; `rl` does not bypass initial plan/skeleton approval. It does not authorize source edits, execution, merge or deployment.


## Multi-repo Project planning

A Project is not assumed to equal one repository.

Planner uses the durable Project repository registry:

```text
Project
├─ PRIMARY repo
├─ DEPENDENCY repo(s)
├─ SUPPORT repo(s)
└─ REFERENCED repo(s)
```

During brownfield L0 discovery, links, routes, deploy rewrites, package references, docs, local orchestration or integration contracts may reveal additional repositories.

If likely Project repos are missing:

```text
discover candidate repo relationship
→ HUMAN_REVIEW_REQUIRED
→ Human confirms repo set/roles
→ update Project repository registry
→ re-run planning review
```

For a MULTI Project, every executable Job has exactly one working repository.

Before Job READY, Planner and Reviewer must still assess all registered repos:

```text
working repo = where this Job may write
other registered repos = read for dependency/contract impact as needed
cross_repo_impact = NONE | READ_ONLY_CONTRACT_CHECK | COORDINATED_CHANGE_REQUIRED | UNKNOWN
```

If coordinated changes are required in more than one repo, Planner should normally split them into linked finite Jobs, one working repo each, with explicit dependency ordering.


## Critic Reviewer (CR)

Critic Reviewer is an independent, Human-invoked second-review role.

Command alias:

```text
cr
```

Contract:

- CR is never automatically dispatched by Orchestrator, Planner, Reviewer, Coder or Tester.
- CR is **stateless-by-contract**: conversation history is non-authoritative and must not be used as review evidence.
- CR does not block based on which chat invokes it. **Same-chat invocation is explicitly valid**, even when Planner/Reviewer/Coder reasoning is visible earlier in that conversation. CR must disregard that conversation reasoning and reconstruct the target from durable Project Memory, exact Job/revision, Verification artifacts and live source truth.
- CR reconstructs the target from durable Project Memory, exact Job/revision, Verification artifacts and live source truth only.
- CR forms its own criteria, findings and verdict before reading the prior Reviewer verdict.
- Only after the independent verdict exists may CR compare it with the prior Reviewer and record agreement/disagreement.
- CR is read-only for source and Job state. It writes only a `CRITIC_REVIEW` Verification artifact.
- CR never changes Job lifecycle. Human decides what to do with CR findings.

Verdicts:

```text
PASS
PASS_WITH_FINDINGS
FAIL
BLOCKED
```

CR is a peer-review backstop, not part of the normal automatic planning-review loop.


## CP4 — NEXT empirical planning contract

For `execution_contract=NEXT`, Planner may persist first-class empirical planning structures instead of leaving unknown runtime facts in prose:

- `evidence_needs[]` / `UNKNOWN_RUNTIME_FACT` identify a concrete unknown, its owning Task, downstream consumers and the checkpoint that must resolve it.
- `test_checkpoints[]` declare `VERIFY | MEASURE | PROBE`, a boundary (`BEFORE_NODE | AFTER_NODE_SET | MILESTONE_GATE | JOB_FINAL`) and prerequisite node set.
- `evidence_requirements[]` bind downstream consumer Tasks to the EvidenceNeed and checkpoint they require.
- `milestones[]` group Tasks/checkpoints and optional gate checkpoints.
- `planning_topology[]` is the typed NEXT planning graph; every Task and TestCheckpointSpec must appear as a typed node.

All CP4 collections are bound to the exact `planning_revision`. Once a NEXT Job has an active CP4 planning model, **every** plan revision must explicitly resupply/rebind the complete model; stale empirical topology must not carry forward silently.

For `V2_STABLE`, these collections remain empty/non-activating. CP4 defines planning truth only; Tester dispatch, checkpoint claims/leases/replay and crash recovery remain CP5.


## CP5 — NEXT checkpoint runtime contract

For `execution_contract=NEXT`, a planned `TestCheckpointSpec` becomes executable only under one deterministic durable claim keyed by:

```text
project_id / job_id / planning_revision / checkpoint_id
```

The claim is the **single serialization point**. Exact-SHA create/update grants one current lease token and attempt identity. Append-preserving attempt/Verification records are children of that grant; they do not independently make evidence applicable.

Runtime flow:

```text
checkpoint becomes runnable
→ Tester Run
→ checkpoint_claim_prepare
→ persist/read back deterministic claim
→ persist append-only attempt start
→ Tester VERIFY / MEASURE / PROBE
→ checkpoint_verification_prepare
→ persist TEST/RETEST Verification
→ exact-SHA terminal claim update
→ gate/routing reads terminal claim + matching Verification
```

Replay by the same live claimant reuses the current token. A competing non-expired claim is rejected. Expired claims may be reclaimed with a new generation/token; stale tokens cannot finalize evidence.

Routing:
- `PRODUCT_FAILURE` → owning Coder repair → exact Goal Recheck on repaired target → `RETEST`;
- `PLAN_GAP | SPEC_GAP` → evidence-backed Planner superseding revision → context-isolated planning Reviewer → resume only on PASS;
- test/environment/integration blockers remain non-PASS and Retest only when ready.

A superseding NEXT planning revision stays `IN_PROGRESS` but becomes non-dispatchable while `planning_review=PENDING/CHANGES_REQUIRED`. Old revision claims and Verifications are non-applicable automatically because runtime gates bind to the current `planning_revision`.

`PASS_RETEST_REQUIRED` is only non-blocking coverage. It never satisfies a mandatory `EvidenceRequirement`, checkpoint, Milestone gate or Job completion prerequisite.

## Reliability upgrade candidate — current serving boundaries

- **Orchestrator:** on new/resumed chat, refetch active Project/Job/Run plus expected Git head/blob before retrying pending work; preserve exactly one canonical branch and last verified checkpoint. `execution_recovery_evaluate` is advisory; external Git writes remain subject to fresh authorization and post-write exact SHA readback. In a running turn, `orchestration_progress_evaluate` detects no-progress and ends the turn after three unchanged durable states. It cannot schedule work when no chat request is executing.
- **Planner:** before adding a new cursor record, demonstrate a concrete missing-state counterexample from existing Job/Run/Verification/CONTROL. No second lifecycle. Existing claim/lease remains the only NEXT Tester checkpoint serialization point.
- **Coder:** only for a reproduced nontrivial defect or failed hotfix retest, load `debugging` from `get_skill_catalog` → `load_skill` and construct the real entrypoint-to-host failure map before editing. The default Coder skill list remains `coding-loop` + `delegation`; frontend specialization is unaffected.
- **Reviewer:** review changed/high-risk test assertions, critical mocks, failure propagation and known-bad RED evidence at meaningful boundaries; rerun but do not repeatedly re-review unchanged trusted tests.
- **Tester:** keep helper/MODEL_ONLY tests distinct from real Git CAS, stage readback, and live E2E. An unavailable runner, inaccessible host or absent tool is `UNVERIFIED` rather than PASS.

These are additive operating rules on the integration branch; final verification requires CI, stage exact-source readback and source-bound Reviewer/Tester evidence before a Human-authorized main promotion.

### Minimal durable cursor adoption (upgrade candidate)

After an explicit NEXT Job opens, create one cursor lazily at the first consequential source mutation by calling `execution_cursor_prepare(BEGIN_MUTATION)` with the exact Job snapshot, namespace, branch, current HEAD, target path/blob and stable operation ID. Persist and independently read back the cursor **before** changing source. After the atomic source commit, verify HEAD, commit parent and intended target blob, then complete the cursor once; do not add writes to every command. At meaningful Task/Tester/Reviewer milestones, optionally SAVE_CHECKPOINT with exact source head; no write for unchanged checkpoint.

On a new conversation or interrupted turn, resolve Job, cursor record and Git head, then call `execution_cursor_resume_evaluate` only when recovery information is needed. PENDING must be reconciled; success text or missing callback is not evidence. A terminal Run may route a new attributed Run, but terminal Job must not resume.

If project scope is not authorized or durable cursor write/read-back is unavailable, fail closed at the risky source-mutation boundary; do not silently create an in-chat-only cursor. The caller handles exact GitHub CAS and evidence. **No background worker or extra tool calls on normal chat/read paths.**


Use `mutation_kind=TREE` for a reviewed atomic multi-file Git tree commit, rather than opening one cursor per changed file; read the intended Git tree SHA before beginning, then independently verify the committed HEAD, parent and tree. For FILE commits use the target blob SHA. A failed/lost response resumes from the one durable PENDING record. Retry counters are recorded only for reconciled failed writes; no extra work is added to ordinary tool calls.

## LLC58 — Human Plan Change runtime responsibility

**Orchestrator:** A Human change request affecting READY/IN_PROGRESS Jobs triggers Planner impact assessment, not immediate Job cancellation. After exact-revision Reviewer PASS for the revised `type=plan` Job, prepare an immutable Plan Change intent and persist/read back it before closing an impacted Job. All affected Run/cursor source writes must be reconciled before SUPERSEDED; replaced Jobs require the original reserved ID and new planning review, not copied PASS evidence.

**Planner:** Classify each affected Job as KEEP, REVALIDATE, REPLACE or HUMAN_DECISION, with evidence, dependency effects and an explicit separate CREATE item for brand-new objectives. Plan revision inside a Job is local and must not be confused with a wider multi-Job Plan change. Uncertain relationships require a Human decision.

**Reviewer:** Compare revised Plan, actual Job set, existing implementation/Run/Verification evidence and proposed impacts. Reject unjustified blanket supersession, stale dependencies, wrong scope and unbounded mutation plans. Reviewed Plan Job Verification must be persisted/read back before the intent CREATE.

**Resume:** Reread the immutable intent, current old/new Job blobs, Runs, cursors and source branch HEAD; call `job_plan_change_resume_evaluate`. Continue the first unfinished legal operation only. Do not create replacement IDs anew after a lost response or treat helper readiness as write authority.

No background process or per-tool reconciliation scan is implied. Real project acceptance remains separate from source/CI tests.
