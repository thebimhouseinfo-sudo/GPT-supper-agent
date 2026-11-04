# LLC62 — AssetGen Bootstrap/CRL evidence and admission gaps (2026-11-04)

Status: **CANDIDATE / FIELD-OBSERVED / ROOT_CAUSE_UNVERIFIED / NO_RUNTIME_FIX**  
Incident Project: `AG` / `P-3637` / `01a19cfa-8e34-7a34-9e6f-b06939853637`  
Source: `thebimhouseinfo-sudo/AssetGen`, Human-configured development branch `main`  
GSA Memory: `thebimhouseinfo-sudo/GSA-Projects/projects/01a19cfa-8e34-7a34-9e6f-b06939853637/`

## Observations — keep API results separate from interpretation

1. **Existing approvals really were present.** AssetGen source `docs/CRITERIA.md` and Memory `CRITERIA.md` both had blob SHA `d102ec550d8255720a8a8d4ef64efa9f80cdfa63`. Source `docs/IMPLEMENTATION_PLAN.md` had SHA `7dde166492701040f1090ae181fc0c735d015944` and declared Human approval on 2026-11-02. Source `docs/MILESTONES.md` and `docs/TECHNICAL_PROPOSAL.md` also declared approval. These are observed source assertions and identity checks; they are not automatically GSA Reviewer Verification records.
2. **First readiness call omitted Plan evidence.** `project_bootstrap_readiness_prepare` returned `IMPLEMENTATION_PLAN_MISSING`. This is **not** evidence the approved Plan file was absent: the caller supplied Criteria but no Plan. A subsequent call with a caller-assembled Plan object returned `PLAN_REVIEW_PENDING`, detail `Independent current revision Reviewer PASS required`. The object was not proven to match the actual runtime's evidence contract. The tool is PREPARE ONLY and explicitly returns `bootstrapped:false`, `source_write_authorized:false`.
3. **Write authorization was denied.** `authorize_project_scope(operation=MUTATE_SOURCE, target=AssetGen, development_branch=main)`, called without a verified `bootstrap_evidence` object, returned `allowed:false`, `mutation_allowed:false`, `BOOTSTRAP_REQUIRED: no approved Project Bootstrap evidence supplied`. The denial was honored. It does **not** independently prove a software defect in bootstrap validation: missing caller evidence is a possible sufficient explanation.
4. **Memory target path call was malformed/ambiguous.** `authorize_project_scope(operation=MUTATE_MEMORY, target_memory_path=projects/<id>/)` returned `Memory target is outside the active Project path`. The target was a directory prefix with a trailing slash rather than a concrete document path. This is **not** proof that valid file-level Memory writes would fail.
5. **Direct role admissions were mistaken for reviews.** `start_direct_agent(role=planner)` and `start_direct_agent(role=reviewer)` returned `execution_state:ADMITTED_NOT_EXECUTED`, `next_action:RUN_ROLE_IN_HOST`, `ephemeral:true`. No persisted Planner repair, independent Reviewer verdict, Verification or new Plan SHA resulted. The assistant should have followed the host execution contract or clearly identified the absent execution surface; admission is not execution.
6. **Human requested CR and then CRL but formal CR was never dispatched.** The available `start_critic_review` path requires an existing durable Job ID, Job record text and SHA. No matching Job was retrieved or created. CR harness loading and a prose critique were not official `CRITIC_REVIEW` evidence. For independently reviewed existing *source Plan documents* without a Job, the GSA Planner harness also describes a role-isolated read-only DIRECT_AGENT reviewer/critic path; this distinction was not resolved in the attempted CRL.
7. **TASK-07 remained recorded ACTIVE although implementation evidence existed.** `TASKS.md` and Milestones refer to 26 isolated backend checks, frontend build, Chrome placeholder test, copied data and independent review, but note delivery closeout remains pending. This is not authorization to mark a nonexistent GSA Job complete or to force retirement without authoritative lifecycle reconciliation.
8. **No source or Memory update was made in the AssetGen attempt.** There was no new Plan SHA, persisted review or CR, code write, or Bootstrap READY proof. This is an incomplete workflow, not successful CRL.

## Impact and causal hypotheses

- **Observed user impact:** approved brownfield scope could not advance to a verified plan repair/CRL or code readiness; repeated prompts/reviews and misleading conclusions consumed time.
- **Caller/orchestration errors directly supported:** omitted Plan on first prepare; improvised Plan shape without verified contract; missing `bootstrap_evidence` on authorization; directory-prefix Memory target; stopping at `ADMITTED_NOT_EXECUTED`; conflating prose critique with formal CR; treating a PREPARE-only tool's `bootstrapped:false` as conclusive persistent Bootstrap failure.
- **Possible runtime/docs mismatch, not proven:** strict Reviewer PASS requirement versus brownfield approved/reviewed source Plan, executable direct reviewer/critic for source documents lacking a Job, and how to produce/attach durable Bootstrap evidence. Inspect deployed MCP handlers and canonical review/Bootstrap contracts before changing source.
- **Deduplication:** LLC61 records an earlier AssetGen `PLAN_CRITERIA_MISMATCH` incident; LLC35 covers brownfield Bootstrap design. LLC62 is the *follow-on orchestration and CRL field incident*, not a claim that the prior root cause is fixed or a second identical bug.

## Lesson and required behavioral correction

1. **Evidence map before any readiness conclusion.** Resolve approved Criteria, source Plan/Milestones, exact SHAs, existing Jobs/reviews, current GSA contract and actual capability. Missing call arguments are a caller error, not proof a file is missing.
2. **Do not turn PREPARE into a lifecycle status.** Persist/read back required evidence through an authorized path; distinguish `PREPARED`, `ADMITTED_NOT_EXECUTED`, `VERIFIED`, `PERSISTED`, and `READY`. Never invent Reviewer/CR PASS.
3. **CRL route for brownfield Plan.** Decide whether there is a real matching Job. If yes, use exact Job revision and durable Reviewer→CR verification. If no, use the documented role-isolated source-document review path when available, or report an exact execution-surface blocker. Do not create a fake Job solely to satisfy CR input.
4. **Authorize the exact operation.** Check concrete destination file, active Project mapping, development branch, and the correct validated `bootstrap_evidence`. A denial is binding; no alternate GitHub/source mutation bypass.
5. **Close historic tasks by evidence and actual owner.** TASK-04/05 frame/mask are superseded by new Criteria; TASK-07 needs authoritative closeout; G05-A/B/C/D are proposals until reviewed, persisted and approved. Preserve historical evidence and untouched approved product Criteria.
6. **Avoid avoidable Human loops.** After a Human-directed Planner repair/CRL, autonomously continue documented same-turn steps until an actual permission/host/Human blocker; do not claim a review occurred when only an admission tool was invoked.

## Candidate owners and regression acceptance

Owners: GSA Orchestrator/Planner dispatch; Bootstrap evidence and authorization diagnostics; source-document Reviewer/CR admission; Memory file-path validation/documentation. **LLC only collects; no unapproved runtime changes.**

Acceptance scenarios:
- Brownfield Project with approved Criteria, Plan and Milestones and no artificial `PROJECT_PLAN` Job: perform actual role-isolated review and give a truthful readiness outcome; never require duplicate approvals.
- Negative: omit Plan argument, omit Bootstrap evidence, or supply directory-only Memory target; return precise *caller-input* diagnostics, not misleading claims about missing source documents.
- `start_direct_agent` with `ADMITTED_NOT_EXECUTED`: ensure agent executes role in host or accurately reports that no review artifact exists.
- Human-invoked CRL on approved source Plan with/without durable Job: resolve correct path, produce evidence of actual Reviewer/CR or explicit BLOCKED; never fabricate durable verification.
- AssetGen integration replay: retained Criteria SHA and accepted Plan, TASK-07 closeout reconciliation, bounded G-05 task, no unauthorized source edits, verified authorization before Coding Run.

Evidence links: [AssetGen Plan](https://github.com/thebimhouseinfo-sudo/AssetGen/blob/main/docs/IMPLEMENTATION_PLAN.md), [AssetGen Tasks](https://github.com/thebimhouseinfo-sudo/AssetGen/blob/main/TASKS.md), [GSA workflow ledger](../GSA-WORKFLOW-LESSONS-LEDGER.md). No hosted MCP E2E or deployed-runtime root cause verification has been performed in this report.
