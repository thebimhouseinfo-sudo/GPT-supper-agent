---
name: gsa-job-runtime
description: Run durable GPT Super Agent Jobs through role harnesses, append-preserving evidence and handoffs.
---

# GSA Job Runtime

## Purpose

This skill is the operational bridge from durable Project Memory to actual specialist reasoning.

The runtime model is:

```text
Project
→ finite Job
→ Task topology
→ attributed Run
→ role harness loop
→ Verification / Handoff
→ terminal Run
```

MCP tools provide deterministic IDs, record shapes, state guards and persistence instructions.
ChatGPT performs reasoning inside the selected role harness.
GitHub source repositories remain source truth.
The configured private Memory Repo remains the durable control plane.

## Harness loading

Before executing any durable role Run:

1. resolve the active Project and Job;
2. call `get_agent_harness(role, mode=JOB)`;
3. treat returned `harness_text` as the runtime role contract;
4. load only minimum sufficient Project/Job/source context;
5. begin the attributed Run with `run_begin`.

Do not rely on remembered role behavior when the harness can be loaded.

### Fresh Start, Criteria, branch, and Project add-ins

Open a Project through minimal authenticated metadata; Project READY displays the Human-configured per-repo Development/Release Branch or UNCONFIGURED without assuming Git default. Project open does not create Job, load add-ins in bulk or edit source. Fresh Start / adoption prepares one Project Criteria draft and minimal AGENTS.md, preserving existing repository and historic Jobs. Advisor provides read-only **technical advice** before first Criteria approval or proposed material approved-Criteria delta; Human decides and Planner maintains the one canonical Criteria.

For new NEXT Project Plans bind exact approved Criteria blob SHA/path, review Overall/Phase GOAL before Task details, and check each code Job's integration target against configured PROJECT.md and live Git. Task-time Coder/Tester add-ins are optional and lower-trust; a missing required specialist domain skill yields BLOCKED/UNVERIFIED rather than an invented generic PASS.

For milestones Human-approved as `rl` or `crl`, follow bounded same-turn review/repair/Reviewer loops; `crl` requires the current independent Reviewer PASS snapshot, then CR; CR FAIL returns through `rl`. No automatic CR outside this scope. `stopchat` stops at a safe boundary and prepares a concise Project/branch/revision/Job/progress/uncertain-write/approval/next-action handoff, persisting only needed state, never background work.

### Retiring obsolete Git source branches

Source-branch `RETIRED` is terminal and separate from Project `ARCHIVED` or Job `SUPERSEDED`. Before starting new code work, read the active Project's approved Development/Release Branch and any versioned retirement record. A retired branch must not be used as a Job integration target, even while the Git ref exists. Do not auto-reactivate it to satisfy a stale Job, PR or plan.

On Human-authorized retirement, list **all** refs, compare exact heads against the current integration branch and reconcile open PRs and active Jobs. Record the branch, SHA, evidence, retirement decision and whether the physical ref still exists. Mark logical RETIRED only after readback. Fully-contained refs may be deleted only with a separately available authorized Git action and fresh dependency checks; diverged refs require explicit disposition of unique commits and a verified archive ref where history must survive. `RETIRED` alone never proves a branch was physically deleted. Do not manufacture extra approval gates or new Jobs just to track branch housekeeping.

For the GSA source repository, see `docs/architecture/BRANCH-LIFECYCLE.md` and the current retirement ledger in `docs/maintenance/`. `main` is the retained integration branch; obsolete work does not resume on historical refs.

## Shared Agent intake (before role work)

**NO REASONING** during Project *open* only: perform minimal identity/config checks. On an explicit **Bootstrap** request, autonomously inspect source/documents and complete the four-item checklist; do not confuse Project open with product Bootstrap. On new User messages, keep the active receiving Agent; use Planner by default only when none exists. **LOW REASONING**: classify question/action, answer questions, clarify missing material decisions without speculative alternatives, and draft a thin skeleton for new/changed work. User agreement on the skeleton permits **FULL REASONING** detailed planning and the autonomous review/repair loop, not implementation. At PASS present the reviewed plan and ask for explicit Human execution approval; until then stay in discussion. An explicit user instruction such as "bắt đầu sửa code", "làm đi", "đồng ý làm" counts only in the matching plan-approval context, not as blanket permission. Handoff only when capability differs. Keep Direct Agent shortcuts and existing Project scope checks.

### Autonomous Bootstrap checklist

On a Human request to Bootstrap a greenfield or brownfield Project, the Orchestrator owns progress. Project open is a lightweight identity check, **not** the full Bootstrap.

- Build the four-item checklist from real evidence: (1) approved Criteria, (2) Plan aligned with Criteria, (3) Milestones aligned with Plan, (4) practical Coder/Tester skills and knowledge. States: PENDING, IN_PROGRESS, PASS, NEED_HUMAN. No separate Job or metadata registry required merely to manage this checklist.
- Reuse a PASS item unchanged, including usable legacy Criteria the Human insists on retaining. Brownfield with approved Criteria: ask once whether the owner wants an update. If not, leave the Criteria file untouched. For missing/draft/unsuitable Criteria, produce a proposal with Human. Advisor consultation occurs only when Human intends to approve new Criteria or materially revise approved Criteria, before official write. After the approved update has actually been written and read back, report `criteria_intake.revision_completed=true` so the checklist continues; do not restart the Criteria revision.
- Call `project_bootstrap_checklist_prepare` to identify the next task; **do that task in the same conversation turn and reassess**. Do not stop after a prepare/review to ask for "continue". After each actual tool action, reread the affected document/tool output; record an observation under the relevant checklist PASS item. Supply `previous_attempt` with the last `next_action` and `progress_signature`. If the same action produces no observed change, stop with `PAUSED_NO_PROGRESS` and report the technical blocker, without inventing Human input or creating another gate. Bare PASS statuses without observations must be verified as a normal task. This routing helper does not execute other tools or independently validate claims.
- When Plan or Milestones are missing/inadequate, Planner autonomously writes/repairs the necessary artifact then runs **CRL** (Planner → Reviewer → Critic Reviewer, repair/re-review until PASS or genuine blocker). Human requested Bootstrap with CRL, which authorizes this document review, not source-code implementation. For an existing Job, use `start_critic_review` with `human_invoked=true` only when Human explicitly authorized this Bootstrap CRL scope, and still verify the authentic reviewed Job. When the documents are not in a Job, use `get_agent_harness` for independent `reviewer` and `critic_reviewer` roles in `DIRECT_AGENT` mode: read the actual document anew and assess independently; do not fake signed durable CR evidence or create a Job solely to pass its gate. If actual role isolation cannot be provided, mark review UNVERIFIED and report that limitation rather than claiming CRL PASS.
- Examine code and the actual development toolchain to give Coder/Tester suitable skills, knowledge and usable verification tools. An unimplemented application feature is not a reason to block capability readiness.
- For conflicting source branches, multiple overlapping Plans or contradictory product intent: investigate Git history, prior approvals, code and docs FIRST. Only if authoritative source remains irresolvable report the alternatives and request the one necessary Human decision; never guess or silently switch branches. Continue other independent checklist work when safe.
- After Human replies, reread affected evidence and continue remaining items without redoing PASS items. When all four have actual PASS, announce BOOTSTRAP READY. Human authorization for subsequent product code mutations remains distinct. Security CAS, Git SHA and readback used by a specific technical task are not extra Bootstrap prerequisites.

## Planner loop

```text
L0 orientation
→ L1 decision context
→ brownfield relationship + logic review
→ define finite objective/scope/non-goals
→ decompose Objective → Phase → Task → Job Pack → Milestone
→ size the Job and declare its context boundary
→ define dependencies/topology
→ place review/test/human gates
→ define completion/evidence requirements
→ consistency + sizing review
→ job_prepare → authorized DRAFT CREATE + SHA readback
→ role-isolated planning Reviewer in SAME USER TURN (no new Human chat)
→ PLANNING_REVIEW Verification CREATE/readback, reviewed Job UPDATE/readback
   ├─ CHANGES_REQUIRED → Planner job_revise_plan → SHA readback → Reviewer again
   ├─ PASS DRAFT → job_transition READY + SHA readback
   ├─ PASS NEXT IN_PROGRESS → present reviewed superseding plan, await execution approval (do not force READY)
   ├─ HUMAN_REVIEW_REQUIRED → specific Human Gate
   └─ BLOCKED → exact blocker
→ READY (or reviewed NEXT revision) → present plan → WAIT for explicit Human execution approval
```

Phase, Job Pack and Milestone are planning concepts expressed with the existing Job/Task topology unless later evidence proves a new persistent entity is necessary.

**Goal anchors, all plan files:** Every new or materially revised plan begins with `## GOAL` immediately after title/front matter; every Phase begins with `### GOAL` before Tasks. Record outcomes, completion and boundaries. Planning Reviewer compares these anchors with the Human-approved intent and corresponding Tasks after every revision; missing anchors/drift is `CHANGES_REQUIRED` and material goal changes need explicit Human approval. `rl` in a planning request (`planner rl`, `planner rl đi`, `planer rl`) explicitly invokes the *existing* autonomous Planner↔planning Reviewer repair loop to PASS or real blocker/Human decision/no-progress; an identified direct/chat draft may be reviewed immediately without additional planning approval, but its result is not durable evidence; new-plan intake, source execution, merge and deploy remain separately gated.

Core invariant:

```text
Job boundary = context boundary.
```

For brownfield work, existing code is evidence rather than automatic authority. Planner must inspect enough relevant logic and relationships to distinguish canonical behavior from legacy, accidental, incorrect or unknown behavior.

Planner is source read-only.

### LLC60 — Continuation owner and persistence fence

Orchestrator owns the entire Planner ↔ planning Reviewer loop, not the individual role or the Human. The existing `job_prepare`, `plan_review_record`, `job_revise_plan`, and `job_transition(READY)` return a typed `continuation` specifying the next role/action **after** the instructed authorized GitHub Memory Repo persistence and exact SHA/record readback. `AWAITING_DURABLE_READBACK` is not completion. The caller continues immediately in the current turn; it must not stop and ask Human to type “continue” after a review, plan repair, or READY proposal.

A stale SHA, failed/denied write, unreconciled duplicate Verification or unsupported record is a real blocker; never bypass authorization or pretend the next action happened. Do not run a repeat Reviewer on an unchanged reviewed revision without evidence; use existing no-progress protections. A reviewed PASS plan also stops at Human execution approval, but routine CHANGES_REQUIRED findings do not require Human continuation.

## Coder loop

```text
LOAD L2 execution context
→ READ live source + exact revision + relevant callers/contracts/relationships
→ PLAN-EXEC smallest bounded sequence
→ IMPLEMENT approved changes
→ DIFF REVIEW
→ VERIFY observed-capability checks
→ SELF-REVIEW CLOSURE
   ├─ ordinary within-scope finding → fix and re-verify
   ├─ downstream follow-up → record, do not drift
   └─ material scope/contract change → escalate
→ GOAL RECHECK
   ├─ NOT_MET or unresolved scope drift → cannot complete successfully
   ├─ PARTIAL/UNVERIFIED → explicit limitation / retest path
   └─ ready → persist Goal Recheck
→ create required Handoff/evidence
→ terminal Run update LAST
```

A passing test suite alone is not completion.
Coder must re-read the Job objective/active Task criteria, inspect the actual diff and affected relationship boundaries, repair ordinary findings, and only then persist Goal Recheck.

For a successful Coder Run, `run_complete` validates the exact GOAL_RECHECK record for the same Project/Job/Run.

## Reviewer loop

Source/code and Job planning Reviewer both use same-chat independent evidence review when applicable: reconstruct the exact target/revision from durable Job, source and Verification facts in the SAME USER TURN without inheriting prior Agent reasoning. A new Human chat is not required. Do not ask the user to invoke Reviewer manually.

```text
exact requirements + exact target revision + evidence
→ size the review
→ if large: review map → bounded sections → consolidate
→ requirements → contract → actual diff → relationship impact → surrounding logic → evidence
→ findings
→ PASS / PASS_RETEST_REQUIRED / CHANGES_REQUIRED / BLOCKED / HUMAN_REVIEW_REQUIRED
→ Verification record
```

Planning review also checks Job sizing/context burden, brownfield logic review and relationship/precedence direction.

Reviewer never modifies source.

## Tester loop

```text
resolve exact acceptance behavior
→ discover tools + inspect exact CI run/job/steps/logs
→ capability check; if SURFACE_PRESENT, safely PROBE non-destructive test execution
→ OBSERVED: execute practical verification
→ CI runner/log unavailable: try authorized equivalent source-bound check, retain hosted CI UNVERIFIED
→ only if no agent-operable path: prepare minimal Human Retest
→ record evidence + limitations
→ causal routing on failure
```

SURFACE_PRESENT is not PASS evidence.

### Tester scenario discovery and repair loop

The fourth Bootstrap checklist item is **Coder/Tester capability readiness**, not a requirement for all product features to be already implemented. The scenario test → repair loop belongs to **authorized implementation execution after Bootstrap**, not an extra Bootstrap gate.

- Tester receives GSA-native `suggested_skills=['testing-evidence']` and external `suggested_host_skills=['scenario-tester']`. ChatGPT, not GSA, owns the **installed** `scenario-tester` skill content. When needed, select that host skill by its exact name through an available ChatGPT Skills surface; confirm the skill instructions really became accessible before calling it LOADED. Never use GSA `load_skill('scenario-tester')`, invent a minimal substitute, or claim the skill was executed merely because its name was returned. If the host skill cannot be accessed, record `SCENARIO_SKILL_NOT_LOADED` and report any unsupported scenario coverage as UNVERIFIED. This does not block unrelated work that can be independently tested.
- Tester freezes observable scenario expectations from approved Criteria/Task/acceptance, explores high-risk real flows plus negative/boundary/state-change and regression conditions, and reports exact target revision and reproducible evidence. Tester does **not** modify source.
- On PRODUCT_FAILURE: owning Coder reproduces, adds regression check, repairs within the already-authorized scope, self-tests, produces **new target revision and Goal Recheck**. Orchestrator hands it to independent Tester for RETEST of failing scenario, impacted previously passing cases and fresh scenario discovery.
- If another reproducible in-scope defect surfaces: repeat Tester → Coder → Goal Recheck → Tester automatically without asking Human `tiếp tục`. PASS requires applicable frozen acceptance and regression coverage, not simply one previously failing scenario passing.
- A real SPEC_GAP/PLAN_GAP goes to Planner/Reviewer and Human only for missing product decisions. A non-operable host/integration remains **UNVERIFIED**, not PASS. For repeated attempts without new revisions or evidence, use PAUSED_NO_PROGRESS and a precise blocker report rather than infinite repair or fake success.
- Respect NEXT checkpoint lease/verification/retarget evidence. Use existing checkpoint's `CODER_REPAIR_GOAL_RECHECK_RETEST` route; do not create a duplicate Job or registration just for scenario testing. No merge/deploy permission follows from test PASS.

## LLC59 — Autonomous CI evidence and Coder red/green repair

When an authorized coding/test Run sees CI RED or an inconclusive hosted check, **GSA owns diagnosis before Human escalation**:

1. Self-read exact branch/commit, GitHub run/check status, jobs, runner allocation, executed steps and downloadable logs through available connectors. Ask for Human logs only if actual evidence cannot be retrieved after bounded discovery and there is no other agent-operable route. Missing runner/steps/logs is an environment limitation, not evidence of a broken product.
2. For an executed failing check, distinguish PRODUCT_FAILURE (source) from TEST_FAILURE (test script/config), ENVIRONMENT_FAILURE (runner/network/tool), NOT_READY and INTEGRATION_NOT_READY. Coder may repair project-owned source or test scripts within current authorized Job; Tester remains read-only.
3. Continue the **same user turn** with Coder repair → diff inspection → source-bound tests/CI → Goal Recheck → meaningful independent Retest/Reviewer checkpoint. Normal harmless log reads and authorized non-destructive checks need no new Human consent.
4. When hosted CI cannot execute, discover an actually available authorized internal execution surface. A successful non-destructive PROBE may establish capability; execute exact source revision on that surface and report **ALTERNATIVE_ENVIRONMENT_VERIFIED**, never claim hosted GitHub CI GREEN.
5. Human Retest is reserved for unavoidable user-only approval, secret, device/local host or exhausted/unsafe alternatives. State the specific blocker and smallest required Human action, then resume when provided.
6. Apply existing bounded retry/no-progress safeguards, source cursor CAS/readback and project/role boundaries. Do not poll, retry blindly, automate release or turn skipped tests into PASS.

No new per-call scanning is implied: this flow activates only for a failure, uncertain check, or explicit CI investigation.

## Persistence order

When a Run ends:

1. persist source/output evidence;
2. persist Verification records;
3. persist immutable Handoff when needed;
4. update terminal Run LAST;
5. refresh CONTROL only as best effort.

Never let a terminal Run reference an artifact that does not exist.

## Fresh-chat continuation

A new chat reconstructs work from durable records. It must not depend on prior chat memory:

```text
PROJECT.md
+ active Job
+ Run / Verification / Handoff records
+ exact live source revision when needed
→ current work state
```

If an `IN_PROGRESS` Run has lost its execution context, treat it as derived ABANDONED and create a new linked Run rather than pretending the old execution resumed.

## Human authority

Agent text is never human approval.
Merge/release and material product/architecture/governance decisions remain explicit human decisions.

## LLC58 — Changing the plan while Jobs are active

For an explicit Human Plan change, suspend affected forward progress at the next safe boundary, while leaving unaffected Jobs available. Planner builds the impact matrix (`job_plan_change_assess`), Reviewer approves the exact changed Plan Job revision, then orchestrator calls `job_plan_change_prepare`. Persist the immutable intent with authorized GitHub CREATE and independent readback. Never use a failed Job cursor prepare as a pretext for raw source writes.

For a REPLACE row, reconcile running Runs and any PENDING cursor first, transition obsolete Job to SUPERSEDED using its current blob SHA, then create new DRAFT Job using `job_prepare(replacement_context)` with the exact intent SHA/readback and the reserved replacement Job ID. The predecessor is historical and cannot be reopened; its PASS remains historical evidence. New Job planning review and downstream dependency revalidation are mandatory.

If interrupted, reread the intent and current old/new Job records and use `job_plan_change_resume_evaluate` to select the next step. An existing replacement path is a reason to **read**, not to allocate another ID. Normal Project, Run, Reviewer/Tester and scope rules remain in force. No new tool call loop is needed for ordinary reads and unchanged Jobs.
