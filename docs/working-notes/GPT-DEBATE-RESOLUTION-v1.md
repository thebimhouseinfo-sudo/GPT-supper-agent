---
id: GPT-DEBATE-RESOLUTION
version: 1
status: READY_FOR_USER_DECISION
canonical: false
source: CLAUDE-DEBATE-RESPONSE-AND-AGREED-DECISIONS
---

# GPT Debate Resolution v1

## 1. Purpose

This working note resolves the PROPOSED items in the Claude debate package without silently changing the Frozen Foundation.

Decision vocabulary:

- ACCEPT — promote after any required Foundation Amendment is approved.
- MODIFY — keep the intent with the changes stated here.
- REJECT — do not promote.
- USER_APPROVAL — architecture editor recommends a result, but Frozen Foundation cannot change without explicit user approval.

## 2. Resolved proposed items

| Item | Decision | Resolution |
| --- | --- | --- |
| P1 One Job = one role owner | MODIFY | A Job is a finite work unit that may be executed by one agent or by multiple cooperating agents. The Job owns the work objective and workflow; agents are participants with explicit responsibilities/runs. Do not force cross-role collaboration into separate Jobs unless the Job workflow requires it. |
| P2 Run separate from Job | ACCEPT | A Job is durable; a Run is one execution attempt/session attached to it. Revisions and re-review create new Runs, not automatically new Jobs. |
| P3 Pull-based orchestration | ACCEPT | Use pull-based orchestration. One Run has exactly one role. A chat may finish one Run and, only after an explicit user dispatch instruction, start another non-independent Run. Any checkpoint requiring independent review MUST start a fresh chat. No scheduler is assumed. |
| P4 Append-only Run records | MODIFY | Each Run gets a unique append-only record. Run records are the concurrency-safe history. A project-level STATE snapshot may exist as a derived/materialized cache and may be rebuilt by reconciliation; it is not the sole source of truth. Never rely on concurrent blind overwrite of one state file. |
| P5 Mechanical checkpoint floor | MODIFY | Do not use LOW/STANDARD/HIGH work classes. Review requirements are selected directly from the Job workflow plus mechanically checkable change triggers. Mandatory review triggers may include shared contract/API/schema changes, migrations/irreversible data changes, auth/secrets handling, CI/workflow changes, destructive source/data actions, material dependency changes, and cross-repo contract impact. Removing a mandatory checkpoint requires explicit user acknowledgement. Merge/deploy remains an explicit human-controlled event. |
| P6 D1/D2 definition depth | ACCEPT | Every skeleton module gets a D1 boundary contract. Only the first real-run path needs D2 before the first end-to-end test. This preserves conceptual completeness without over-specifying unused internals. |
| P7 Job lifecycle core | MODIFY | Center STATE-MACHINE-v1 on Job lifecycle, but separate lifecycle from review/acceptance result. Candidate lifecycle: PLANNED -> READY -> IN_PROGRESS <-> PAUSED -> SUBMITTED -> CLOSED; side states BLOCKED, STALE, CANCELLED. A review result can route SUBMITTED -> IN_PROGRESS for revision or allow closure. Project has lifecycle status (for example active/archived), not a global workflow enum. Artifact status remains separate. |
| P8 Asset requirement workflow | ACCEPT WITH MODIFICATION | Project maintains a persistent `asset-requirements/` backlog for all required non-code assets. Most visual assets are defined during UI Design, while UX/functional work may add assets such as MP3/audio. Coder may implement deterministic placeholders and continue. Each requirement fixes the final filename/path/spec so replacing the placeholder with the delivered asset requires no code rediscovery. Designer/audio generation may be invoked later according to capability and human dispatch. |
| P9 Evidence and quality vocabulary | ACCEPT | Keep QA/QC as the canonical umbrella terms. QA = process assurance, primarily COMPLIANCE + evidence discipline. QC = output control, primarily CORRECTNESS + FIT. Evidence is commit-bound. Objective evidence is primary; model judgement is supplementary and clearly labelled. |
| P10 Change impact and invalidation | MODIFY | An upstream change first triggers a causal change review. The system must identify affected artifacts/work, explain causal links, and propose one or more response options—including lower-impact alternatives when possible. Human chooses the intended response. Only then are the selected affected artifacts marked STALE/revised/revalidated. No blind global invalidation and no silent model-only impact decision. |
| P11 Reviewer GitHub scope | ACCEPT | Reviewer may read GitHub and write signed PR comments/review comments, but MUST NOT write repository contents. Same-identity GitHub approval cannot be treated as independent approval. Fresh-chat independence plus observable evidence provides the review separation; user-controlled merge remains the human gate. |
| P12 Merge/deploy completion | ACCEPT | Accepted, merged, and deployed are separate facts/events. Acceptance never implies merge or deploy. Merge authority belongs to the user. Deployment verification is recorded separately when applicable. |

## 3. Additional proposal embedded in A1

### Project marker file

Decision: ACCEPT AS PART OF FA-1.

If the durable Drive container is renamed from Job to Project, keeping a file named JOB.md as its marker would preserve the old ambiguity.

Recommended structure:

```text
<configured-root>/<project-id>/
├── PROJECT.md        # marker + overview + front matter
├── state/ or STATE.json (schema to define)
├── jobs/
└── ...
```

The current JOB.md and PROJECT.md concepts should collapse into PROJECT.md.

Exact Job/Run storage below the Project root is deferred to PROJECT-MEMORY-SCHEMA-v1.

## 4. Quality vocabulary

User decision: QA/QC model accepted.

User decision: insufficient objective evidence routes to `PASS_RETEST_REQUIRED`, not `PASS`. The missing practical verification must be represented by one or more persistent Retest IDs.


Canonical check families:

```text
COMPLIANCE
= did the work stay inside approved scope, rules, permissions, plan,
  dependency obligations, and evidence process?

CORRECTNESS
= does the result build/test/behave correctly against acceptance criteria?

FIT
= does the result fit the product/system coherently, including UX/UI,
  architecture consistency, and integration expectations?
```

Umbrellas:

```text
QA = process assurance
   = primarily COMPLIANCE + evidence discipline

QC = output control
   = primarily CORRECTNESS + FIT
```

This keeps the user's QA/QC language while removing vocabulary drift between Coder and Reviewer.

## 4.1 Objective vs subjective review

User decision:

A Reviewer may make blocking decisions only from criteria that can be evaluated against observable evidence or an explicitly defined acceptance rule.

If a criterion is inherently subjective or cannot be evaluated objectively with the available evidence, the Reviewer must not convert its own judgement into PASS/FAIL authority.

Instead:

```text
objective / evidence-backed criterion
→ Reviewer may decide PASS / CHANGES_REQUIRED

subjective / judgement-only criterion
→ HUMAN_REVIEW_REQUIRED
→ present the artifact, context, and Reviewer observations
→ user decides
```

Examples that normally require human judgement when no objective rule exists:

- whether a visual direction "feels right";
- whether wording/tone is aesthetically preferable;
- whether a subjective UX choice is acceptable when no agreed acceptance criterion exists;
- whether an architectural trade-off is preferable when multiple options satisfy all objective constraints.

The Reviewer may still provide observations and recommendations, but they are advisory until the user decides.

If the user has previously approved a concrete subjective rubric or reference artifact, that rubric/reference becomes an acceptance rule and the Reviewer may evaluate against it as far as observable evidence supports.

## 4.2 Finding severity

User decision: severity model accepted.

```text
CRITICAL
= must be fixed before the workflow can continue;
  cannot be waived into PASS by the Reviewer.

IMPORTANT
= blocks PASS unless the user explicitly waives it.

MINOR
= non-blocking; should be fixed when reasonable.
```

Every Reviewer finding MUST include:

- severity;
- observable evidence or acceptance rule;
- affected scope;
- required action or recommended action;
- whether human waiver is allowed.

Rules:

```text
CRITICAL
→ always blocking

IMPORTANT
→ blocking unless explicit human waiver is recorded

MINOR
→ non-blocking
```

Subjective findings still follow the separate Human Review rule and do not become blocking merely by assigning a severity label.

## 4.3 Causal change review

User decision:

When an approved upstream requirement, plan, contract, design, or architecture changes, the system must NOT immediately invalidate all descendants and must NOT silently choose the affected scope by itself.

It first performs a causal change review.

```text
change request
→ identify what changed
→ trace causal dependencies
→ identify likely affected Jobs / Tasks / artifacts / repos
→ identify unaffected areas with reasoning
→ propose response options
→ include lower-impact alternatives when possible
→ present impact trade-offs to the human
→ human chooses the response
→ update the affected plan/topology
→ only then mark specific artifacts STALE / REVALIDATE / SUPERSEDE
→ execute the approved change
```

The causal review must answer:

- What exactly changed?
- Why does that change affect each identified downstream item?
- What breaks if nothing is changed?
- What is the minimum necessary fix?
- Is there an alternative approach with lower impact?
- Does the alternative preserve the user's actual intent?
- Which Jobs/Tasks/PRs/retests/evidence become stale under each option?
- What new review/retest obligations would each option create?

Example:

```text
Requested change:
change shared profile contract

Option A
→ update shared contract
→ update 5 consumers
→ higher cross-repo impact

Option B
→ add compatibility adapter in provider
→ update 1 repo
→ lower immediate impact
→ leaves temporary compatibility debt

Human chooses A or B.
```

Only after the human chooses does the system apply lifecycle effects.

Possible artifact outcomes:

```text
UNCHANGED
REVALIDATED
STALE
SUPERSEDED
```

Rules:

- STALE is a consequence of an approved impact decision, not an automatic blanket reaction.
- The model may recommend the smallest-impact option, but it must not optimize away the user's intended behavior.
- A materially different lower-impact workaround requires human approval.
- If one option is objectively required by a hard constraint, the system may say so, but still explains the causal chain.
- Retest obligations affected by the change must also be reviewed: keep, revise, supersede, or add new Retest IDs.

## 4.4 Persistent Asset Requirements

User decision:

Assets are planned and tracked as durable Project requirements, not as ad-hoc chat requests.

Most visual assets SHOULD be identified during UI Design. Additional functional/UX assets may be discovered later, including:

- MP3 / spoken audio;
- sound effects;
- icons;
- illustrations;
- backgrounds;
- animation/video;
- other binary/static resources needed by the implemented experience.

The Project has a persistent asset requirement store:

```text
<Project>/
└── asset-requirements/
    ├── AR-0001.md
    ├── AR-0002.md
    └── ...
```

An Asset Requirement is NOT automatically a Job. It is a durable requirement/backlog item. A Design Job or another future asset-production Job may be created when the work required to satisfy it warrants a separate workflow.

### Requirement identity

Each asset has a stable Asset Requirement ID.

Recommended product-neutral pattern:

```text
AR-<sequence>
```

The requirement fixes the integration contract before the final asset exists.

Minimum common fields:

```text
asset_id
type
purpose
owning Job/Task
status
final_filename
final_repo
final_path
placeholder strategy
acceptance requirements
generation/source instructions
dependencies
```

### Visual asset example

```text
AR-0012
type: image/icon
purpose: Math topic icon
final_filename: topic-fractions.png
final_path: assets/images/topics/topic-fractions.png
dimensions: 200x200 px
format: PNG
transparency: required
style_reference: approved UI concept
prompt: <generation prompt>
status: PLACEHOLDER
```

Coder may temporarily use:

- an existing compatible icon;
- a generated neutral card/block;
- a CSS placeholder;
- another deterministic stand-in.

The placeholder MUST preserve the intended layout footprint closely enough that later replacement does not require redesign.

When the final asset is produced, it is saved with the exact required filename/path. Code should already reference that final path or a manifest key, so the placeholder can be swapped without rediscovering integration logic.

### Audio asset example

```text
AR-0031
type: audio
purpose: narration for sentence X
final_filename: <stable-audio-id>.mp3
final_path: assets/audio/<stable-audio-id>.mp3
language: vi-VN
voice/style: <requirement>
source_text: <exact text>
format: MP3
status: PLACEHOLDER | MISSING
```

The same principle applies:

```text
define ID/name/path/spec first
→ code against the stable contract
→ use placeholder/fallback where safe
→ produce asset later
→ place file at exact path
→ application picks it up without structural code change
```

### Status vocabulary

Candidate statuses:

```text
REQUIRED
PLACEHOLDER
READY_TO_GENERATE
GENERATED
DELIVERED
VERIFIED
BLOCKED
SUPERSEDED
```

Exact schema/statuses are finalized later in the Asset Requirement contract.

### Placeholder merge and asset fulfillment retest

The purpose of the placeholder is to make implementation independent from final asset production timing.

The code MUST be structured so that:

```text
stable asset contract exists first
→ code integrates against stable ID/path/manifest key
→ placeholder satisfies the same integration contract
→ feature can be implemented, reviewed, and merged
→ final asset is later produced
→ final asset is copied/generated into the exact recorded destination
→ no structural code rediscovery should be required
→ practical Retest verifies the final asset integration
```

A placeholder is therefore not a temporary hack that requires later code surgery. It is an implementation substitute behind a stable asset contract.

When code is merged before the final asset is available:

```text
code/review/evidence pass
+ placeholder integration works
+ final asset still pending
→ PASS_RETEST_REQUIRED
```

The related Retest MUST reference the Asset Requirement ID.

Example:

```text
AR-0012
final_path: assets/images/topics/topic-fractions.png
placeholder: generic topic icon

RT-0042-03
depends_on_asset: AR-0012
Test after final asset delivery:
1. copy/generate topic-fractions.png into the recorded path
2. open the target screen
3. verify the final icon appears
4. verify dimensions/layout are correct
5. verify no broken path/fallback/console/runtime issue appears
Expected: final asset replaces placeholder without code modification
```

For audio:

```text
AR-0031
final_path: assets/audio/<stable-id>.mp3

RT-0042-04
depends_on_asset: AR-0031
Test after audio delivery:
1. place the MP3 at the recorded path
2. trigger the UX action that plays it
3. verify the correct file is loaded
4. verify playback/content/sequence behavior
Expected: audio works through the already-merged code path without structural code changes
```

Asset Requirement status and Retest status are separate:

```text
Asset:
PLACEHOLDER
→ DELIVERED
→ VERIFIED

Retest:
PENDING
→ PASS | FAIL
```

An Asset Requirement is not considered fully verified merely because the file exists at the expected path. The practical Retest is what verifies that the real asset works correctly in the merged implementation.

If the final asset requires code changes beyond replacing the placeholder through the predeclared contract, this is treated as an integration defect or an incomplete Asset Requirement contract and routes back to the owning Job/Task.

### Asset requirement sources

An Asset Requirement may originate from:

- UI Design;
- UX specification;
- Detailed Execution Plan;
- Coder discovery;
- Reviewer finding;
- practical Retest result;
- explicit user request.

The originating role records the requirement; it does not silently invent material creative/product intent.

### Placeholder rule

Placeholder-first is the default when:

- code/layout/flow can progress safely without the final binary asset; and
- the final integration contract (ID, filename, path, dimensions/format where relevant) is already known.

A missing asset blocks only the work that genuinely depends on the final asset.

### Generation handoff

Because current ChatGPT plugin orchestration is human-dispatched:

```text
Asset Requirement exists
→ current agent reports pending asset(s)
→ user invokes the suitable generation/design workflow
→ asset is produced
→ saved to the recorded destination
→ requirement status advances
```

Future automatic handoff may automate this without changing the Asset Requirement model.

## 4.5 UX/UI specialization ordering

User decision:

UX Coder and UI Coder are specializations, but their ordering is NOT fixed.

The Detailed Execution Plan must derive the sequence from the nature of the Job and the product's primary interaction model.

Do NOT hard-code:

```text
UX → UI
```

or:

```text
UI → UX
```

as a universal workflow.

Instead:

```text
analyze Job/product
→ identify the primary source of interaction structure
→ choose the correct first specialization
→ define downstream handoff topology
```

### Web/content-driven applications

For many web applications, the content/information architecture determines the visible structure first.

Typical pattern:

```text
content / requirements
→ UI tree / screen hierarchy / component structure
→ UI implementation skeleton
→ UX behavior mapped onto that structure
→ refinement / integration
```

In these Jobs, UI may legitimately precede UX because the interface tree provides the working structure that later interactions attach to.

### Interaction-first systems

For systems whose primary experience is behavior/protocol rather than visual composition, UX may precede UI.

Example: CadGPT.

```text
command model
→ conversation / action flow
→ state / error / confirmation behavior
→ UX contract
→ fake CLI presentation later
```

Because the visible UI is only a thin/fake CLI over a deeper interaction model, designing visual structure first would invert the real dependency.

### Planning rule

The Planner / Detailed Execution Plan must explicitly state, per Job:

- whether UI or UX leads;
- why that ordering is causally appropriate;
- what artifact the first stage produces;
- what the next specialization consumes;
- where iteration back is allowed;
- whether one specialization can be skipped entirely.

Examples:

```text
Web app:
Content → UI Tree → UI Coder → UX Coder → Reviewer

CadGPT:
UX model → UX Coder → fake CLI/UI Coder → Reviewer

Small functional patch:
Generic Coder → Reviewer
```

The system must not "figure it out as it goes". Ordering is part of the approved Detailed Execution Plan before implementation starts, while still remaining revisable through the causal change review if new facts emerge.

## 5. Review floor and acceptance result

Review is NOT required for every PR.

After the Detailed Execution Plan is sufficiently concrete, the system produces a milestone/stage handoff table that states who owns each stage, what output is expected, which agent receives the work next, and whether review is required at that checkpoint.

Conceptual example:

```text
Milestone | Stage              | Owner    | Output        | Next handler | Review?
M1        | Detailed planning  | Planner  | exec plan     | Coder        | NO
M2        | Core implementation| Coder    | branch/PR     | Reviewer     | YES
M3        | Minor follow-up    | Coder    | patch commit  | Merge-ready  | NO
M4        | Final verification | Reviewer | PASS/result   | User         | YES
```

The table is effectively the handoff map for the Job: at each milestone, the system knows who has the work now and who must receive it next.

Therefore:

- PR existence alone does not imply review;
- review placement and role handoff follow the approved Detailed Execution Plan / milestone handoff topology;
- Reviewer is inserted only where the topology requires it or where a later discovered condition causes the topology to be updated;
- a PR marked no-review may proceed according to its workflow once its own required QA/QC/evidence passes;
- if new information makes review necessary, the topology may be revised before merge.

There is no LOW / STANDARD / HIGH work classification.

Review topology is determined directly from:

- Job type and Job-specific workflow;
- actual change scope;
- dependency/contract impact;
- mechanically checkable review triggers;
- evidence availability;
- explicit user requirements.

Mandatory checkpoints may be added whenever needed. Removing a mechanically required checkpoint needs explicit user acknowledgement.

When review/verification has not passed, normal failure/routing states still apply, for example:

```text
CHANGES_REQUIRED
BLOCKED
STALE
UNVERIFIED
```

Once a result has otherwise passed its required review, there are only two accepted-result forms:

```text
PASS
= required review/evidence is sufficient;
  no additional real-world retest is required for acceptance.

PASS_RETEST_REQUIRED
= required review/evidence is sufficient for the implementation to pass;
  but a real practical test must still be performed because the available
  online evidence cannot fully validate the real outcome.
```

`PASS_RETEST_REQUIRED` is not a lower quality tier and not a failure. It is a PASS with a remaining real-world verification obligation.

In the online-only model, practical testing may be impossible before merge. Therefore:

```text
PASS_RETEST_REQUIRED
→ merge is allowed
→ deployment/runtime becomes available
→ practical retest is executed
→ result is reported by Retest ID
→ pass closes the obligation
→ fail reopens the exact owning work context
```

Every remaining practical test MUST be recorded as a uniquely identifiable Retest item before merge.

Minimum Retest record:

```text
retest_id
project_id
job_id
task_id(s) or owning scope
source_commit_sha
merged_commit_sha when known
target environment/device
what to test
exact steps
expected result
why online verification was insufficient
related files/components/contracts when known
status = PENDING | PASS | FAIL | BLOCKED
result/evidence
```

Example:

```text
RT-0042-01
Job: J-0042
Task: J-0042.T3
Test: Open lesson on iPhone Safari and finish question 1.
Expected: answer is graded, feedback appears, next question opens automatically.
Related: LessonPlayer / progression state
Status: PENDING
```

The user may later report only the Retest ID plus observed result, for example:

```text
RT-0042-01 FAIL
After correct answer it stays on the same question.
```

The harness must resolve that ID back to the original Job/Task/commit/context and reopen the smallest relevant fix scope rather than rediscovering the whole problem.

Examples of why retest may remain:

- no accessible runtime/preview before merge;
- real device/user interaction is required;
- external system behavior cannot be reproduced by the available executor;
- visual/physical/environment-dependent behavior needs practical confirmation;
- deployment can be checked technically but the actual use case still needs a real test.

The concrete retest target and expected result must be recorded. A generic note such as “retest later” is invalid.

## 5.1 Retest identity and failure routing

A Retest is not a Job type. It is a verification obligation attached to the work that already passed online review.

Identity format is product-neutral. Recommended pattern:

```text
RT-<job-number>-<sequence>
```

A failed Retest routes by recorded ownership:

```text
Retest FAIL
→ resolve Retest ID
→ load original Project
→ load owning Job/Task
→ inspect source commit + merged/current head
→ compare only the relevant implementation area first
→ create/continue the smallest appropriate fix work
→ review
→ merge
→ issue a new Retest revision or replacement ID if practical verification is still needed
```

Retest history is append-only. Do not overwrite a failed result as if it never happened.

A code change after a failed Retest invalidates the old pending verification target. The follow-up practical test must reference either:

- a new Retest ID; or
- an explicit revision such as `RT-0042-01@r2`.

The exact storage schema is defined later in the Project Memory / Evidence contract.

## 5.2 Persistent Retest Queue

Retest obligations MUST survive chat boundaries and user delay.

A Project therefore has a durable Retest store in Drive:

```text
<Project>/
└── retests/
    ├── RT-0042-01.md
    ├── RT-0042-02.md
    └── ...
```

Each Retest file is the canonical record for one practical verification obligation.

Recommended Markdown + YAML front matter:

```markdown
---
id: RT-0042-01
project_id: kid-eschool
job_id: J-0042
task_ids:
  - J-0042.T3
status: PENDING
source_commit_sha: abc123
merged_commit_sha: def456
environment: iPhone Safari
created_by_run: R-0042.3
---

# RT-0042-01

## What to test
Open lesson 1, answer question 1 correctly.

## Expected result
- answer is graded;
- feedback appears;
- next question opens automatically.

## Why practical retest is required
The online executor cannot validate the real mobile runtime before merge.

## Related implementation
- LessonPlayer
- progression state
- relevant files/components if known

## How to report
Reply with:

RT-0042-01 PASS

or:

RT-0042-01 FAIL
<what actually happened>
```

Status vocabulary:

```text
PENDING
= not tested yet

BLOCKED
= user wants to test but the required environment/device/deployment is not currently available

PASS
= practical verification succeeded

FAIL
= practical verification failed and must route back to the owning work

SUPERSEDED
= replaced by a newer Retest obligation because the target/change materially changed
```

A user being busy, away from the required device, or choosing not to test now does NOT block the Project or force rediscovery. The Retest remains durable as `PENDING` (or `BLOCKED` when there is a concrete environment blocker).

Status surfaces MUST expose outstanding obligations.

Minimum status summary:

```text
Retests:
  pending: 3
  blocked: 1

Next practical tests:
  RT-0042-01  iPhone Safari  Lesson progression
  RT-0048-02  Production     Login redirect
  RT-0051-01  iPad           Responsive layout
```

The user can later ask for pending Retests without remembering prior conversations.

Recommended user-facing operation (exact command grammar to be finalized in COMMAND-SPEC-v1):

```text
gsa/retests
→ list PENDING + BLOCKED Retests for the open Project

gsa/retest RT-0042-01
→ show complete test instructions + expected result + reporting format
```

The Retest file may update its current status, but attempt history is append-only.

Example:

```text
Attempts
1. PENDING — created after merge def456
2. FAIL — user observed no auto-advance
3. PENDING — fix merged ghi789, retest revision requested
4. PASS — user confirmed correct behavior
```

Do not erase a previous FAIL when a later attempt passes.

A Project may be archived with unresolved Retests only after the user is shown the outstanding list and explicitly accepts that they remain unverified.

## 5.3 Merge authority

Merge occurs only after the work has satisfied the completion conditions defined for its current milestone/stage.

Merge requires explicit user instruction/authorization.

```text
stage complete
→ required review/evidence satisfied
→ PASS or PASS_RETEST_REQUIRED
→ user authorizes merge
→ merge
```

A Reviewer PASS does not itself execute merge.

## 5.4 Delivery event facts

Acceptance, merge, deployment, and deployment verification are separate recorded facts/events.

```text
accepted
merged
deployed
deployment_verified
```

They are NOT the main Job lifecycle states.

Definitions:

- `accepted`: the current work has satisfied its required workflow, review, QA/QC and evidence obligations, producing `PASS` or `PASS_RETEST_REQUIRED`.
- `merged`: the approved change has actually been merged into its target branch after explicit user authorization.
- `deployed`: the merged revision has actually been deployed to the target environment, when deployment applies.
- `deployment_verified`: the deployed revision has been checked successfully at the level the available online executor can verify.

These facts may differ legitimately. Example:

```text
accepted = true
merged = true
deployed = true
deployment_verified = true

RT-0042-01 = PENDING
```

A deployment may be technically verified while a practical Retest remains outstanding.

## 5.5 Handoff capability — current platform and future extension

### Current platform capability

In the current plugin-only ChatGPT web model, there is no verified native capability for the harness to spawn/invoke a separate agent execution unit, open a fresh chat automatically, or autonomously dispatch the next independent role.

Therefore current handoff is human-mediated:

```text
current Run finishes
→ result + next recommended handler are recorded
→ ChatGPT tells the user what should happen next
→ user invokes/authorizes the next Run
→ next agent/role begins
```

Example:

```text
Coder:
"I have finished the implementation and the PR is ready.
Next required handler: Reviewer.
Please invoke Reviewer in a fresh chat to inspect PR #42."
```

The user may then say, for example:

```text
review it
call reviewer
let reviewer check PR #42
gsa/review J-0042
```

Only then does the next Run begin.

Independent Review keeps the additional requirement that its Reviewer Run starts in a fresh chat.

Current orchestration is therefore:

```text
pull-based
+ human-dispatched
+ state-persistent
```

### EXTENSION POINT — automatic agent handoff

This is a platform limitation, not a permanent architecture rule.

If a future ChatGPT/plugin/runtime capability exposes safe agent invocation or agent-to-agent handoff, the orchestration layer may evolve to:

```text
Run A finishes
→ durable handoff record
→ platform invokes next required agent/Run
→ independent context created when required
→ Run B starts
```

The Project / Job / Task / Run model must not depend on human dispatch. Human-mediated and automatic dispatch are two executor modes over the same durable state model.

Future automatic handoff MUST preserve:

- role attribution;
- independent-review context requirements;
- exact Job/Task/Run linkage;
- durable handoff state;
- approval/merge boundaries;
- evidence provenance;
- user visibility into what was dispatched and why.

Until such capability is verified, automatic agent dispatch is `UNAVAILABLE` / `UNKNOWN` and the implementation uses human-mediated handoff.

## 6. Run and independence model

```text
Project
└── Job J-0042 (type=code)
    ├── participants: [coder, reviewer?, designer?]
    ├── Task J-0042.T1
    ├── Task J-0042.T2
    └── Runs
        ├── R-0042.1 role=coder
        ├── R-0042.2 role=designer
        └── R-0042.3 role=reviewer
```

A Job may be single-agent or multi-agent. Each Run still has one active role so attribution, context, permissions, and evidence remain clear.

A Run records:

- run id
- project id
- job id
- role
- started/ended timestamps when available
- input artifact versions
- target repo/commit/PR when applicable
- result/status
- evidence refs
- next transition/request

A review requiring independence starts in a fresh chat. This is now an agreed baseline rule, not merely a proposed default.

## 6.1 Job type baseline and evolution

Current promoted baseline Job types:

```text
plan
code
design
review
```

These four types are a starting taxonomy, not a permanently closed enum.

Rules:

- promote these four as the initial basic Job types;
- study real projects and real Job traces before adding, removing, splitting, or merging types;
- each Job type must eventually have an explicit workflow contract;
- new Job types are added only when repeated real work demonstrates materially different lifecycle, participants, evidence, or completion semantics;
- Job-type evolution must preserve historical readability of existing Project memory;
- do not invent speculative Job types merely for symmetry.

This replaces the earlier assumption that cross-role work must always become a separate Job.

## 7. Capability spike — surface inspection only

The current connected tool surface exposes the following operations:

### GitHub surface present

- create branch / commit / PR
- PR comments and review comments
- merge PR action
- create blob with UTF-8 or base64 content
- workflow-run lookup
- workflow jobs/steps/logs
- workflow artifacts

This establishes only TOOL SURFACE PRESENT. It does not prove repository permission, protected-main behavior, confirmation behavior, or independent identity.

### Google Drive surface present

- list folder
- create folder
- upload raw file
- update raw file bytes
- fetch raw/readable file
- fetch file revision
- read/write comments

This establishes only TOOL SURFACE PRESENT. It does not yet prove the exact behavior in the configured Project root, conditional writes, or safe concurrent mutation semantics.

Still UNKNOWN until an explicit non-destructive spike or controlled test:

- protected-main direct push behavior
- merge confirmation behavior
- binary image commit end-to-end
- raw .md/.json create-update roundtrip in the configured Drive root
- Drive revision/conditional-write usefulness
- generated-image persistence into Drive/GitHub without manual movement

## 8. Promotion rule

Nothing in this file changes FROZEN-FOUNDATION-v0.1.md.

FA-1, FA-2, and FA-3 must be explicitly approved before the affected canonical definitions are rewritten.

After approval:

1. apply Foundation Amendments in one consistency pass;
2. rename old Job-as-container references to Project;
3. draft STATE-MACHINE-v1 using the resolved P3/P4/P5/P7/P9/P12 model;
4. define the first-run D2 contracts;
5. keep all other skeleton modules at least D1.
