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

## 4.6 Shell-readiness gate before content scale-out

User decision / observed failure mode:

KE Math Grade 1 exposed an important anti-pattern: implementation proceeded topic-by-topic while the application shell was still incomplete and insufficiently detailed. As content was added, missing shell decisions kept surfacing, forcing repeated redesign/rework.

The system must prevent this pattern in future projects.

For content-driven applications, large-scale content implementation MUST NOT begin until the reusable application shell reaches an explicit readiness gate.

```text
requirements/content model
→ UI tree / navigation model
→ application shell
→ representative real-content pilot
→ shell-readiness review
→ only then scale out content/topics
```

The shell-readiness review verifies, as applicable:

- global navigation and page hierarchy;
- lesson/topic entry and exit flows;
- start/end states;
- content container / learning canvas behavior;
- progress/report behavior;
- common controls and shared components;
- responsive rules;
- empty/loading/error states;
- asset slots and placeholder contracts;
- audio/media integration points;
- shared data contracts;
- representative long/short content cases;
- representative interactive content cases;
- mobile/tablet/desktop behavior where applicable.

A shell is not considered ready merely because the landing page renders.

### Representative pilot rule

Before mass-producing content, implement enough real representative content to stress the shell.

The pilot should intentionally include materially different cases, for example:

```text
simple lesson
long lesson
interactive lesson
asset-heavy lesson
audio lesson
assessment/report flow
```

The exact pilot set is project-specific and defined in the Detailed Execution Plan.

The purpose is to discover shell deficiencies before dozens of topics inherit them.

### Scale-out gate

```text
SHELL_NOT_READY
→ content scale-out blocked

SHELL_READY
→ reusable content production may begin
```

This is a workflow gate, not a requirement that every visual detail be perfect. Known non-blocking polish may remain, but structural shell behavior and reusable contracts must be stable enough that adding a new content unit is primarily data/content work rather than redesigning the application.

If a later content case reveals a genuine missing shell capability, use Causal Change Review before changing the shared shell, because the change may affect all existing content.

### Post-SHELL_READY UI change rule

After `SHELL_READY`, ordinary content production MUST NOT trigger routine UI redesign.

The intended operating model is:

```text
normal new content
→ fits existing shell
→ no UI redesign
```

UI/shell changes are reopened only when real content exposes a case that was not reasonably covered by the pilot, such as:

- a missing functional capability required by a legitimate content type;
- content that is materially shorter or longer than representative pilot cases and breaks layout/composition;
- responsive behavior failing at a real device/viewport/content combination;
- an interaction/media/asset case not represented by the shell contract;
- a genuine accessibility or usability defect revealed by real usage.

Examples:

```text
normal lesson variation
→ content/data change only

unexpected very short lesson leaves unusable blank composition
→ UI/responsive issue may be reopened

unexpected very long lesson causes overflow/navigation failure
→ UI/responsive issue may be reopened

new legitimate content type requires a control the shell never had
→ missing shell capability may be reopened
```

Even in these cases, the system does not immediately patch the shared UI. It first uses Causal Change Review to determine:

- whether the problem is truly a shared-shell deficiency;
- whether a content-level solution is sufficient;
- the lowest-impact correction;
- which existing content/components need retest.

Therefore `SHELL_READY` means the shell is stable for expected content variation, not that future change is forbidden.


## 4.7 Tester as a distinct role

User decision / product lesson:

A software workflow that relies only on implementation + code review is insufficient for application work. Real applications need a Tester role distinct from Reviewer.

### Reviewer vs Tester

```text
Reviewer
= verifies implementation against plans, contracts, diffs, tests, evidence,
  architecture and acceptance rules.

Tester
= actively exercises the product as a user would,
  with real content, real flows, representative devices/viewports/environments,
  trying to expose cases the plan/pilot/spec did not anticipate.
```

Reviewer asks:

- Did implementation follow the approved plan?
- Is the code/evidence correct?
- Are requirements/contracts satisfied?
- Are there regressions visible from available technical evidence?

Tester asks:

- Does the product actually work in realistic use?
- What happens with unusually short/long content?
- What happens across mobile/tablet/desktop or other target environments?
- What happens when flows are repeated, interrupted, resumed, or combined?
- Are there missing shell capabilities revealed only by real content?
- Does the implementation fail under cases the original spec did not foresee?

### Tester is not merely final manual QA

Tester participates at planned checkpoints.

For content-driven applications:

```text
app shell
→ representative pilot content
→ Tester exploratory pass
→ shell-readiness decision
→ content scale-out
→ periodic regression/exploratory testing
```

The Tester is especially important before `SHELL_READY`, because the purpose of the pilot is to discover unknown UI/UX/shell cases before mass content production.

After `SHELL_READY`, Tester findings should not automatically trigger UI changes. Findings route through the causal change review:

```text
Tester finding
→ reproduce + evidence
→ classify:
   content defect?
   implementation defect?
   missing shell capability?
   responsive edge case?
   new product requirement?
→ Causal Change Review when shared behavior may change
→ human decision where required
→ fix
→ retest
```

### Tester and Retest Queue

Tester is a natural executor of persistent Retest obligations.

```text
PASS_RETEST_REQUIRED
→ Retest ID
→ Tester or human performs practical test
→ PASS / FAIL
```

Human testing remains valid and may be required for subjective acceptance, but the architecture should not assume that all practical testing must be done ad hoc by the user.

### Role independence

Tester may be the same underlying model/runtime in a separate Run, but it is a distinct reasoning role with its own objective:

```text
Coder tries to make it work.
Reviewer tries to prove the implementation satisfies known rules.
Tester tries to make it fail under realistic use.
```

When independent testing matters, the Detailed Execution Plan should require a separate Tester Run/context rather than letting the Coder self-test and declare completion.

## 4.8 Design-readiness gate for UI-first applications

User decision:

For UI-first applications, implementation should begin only after the design is sufficiently complete that downstream coding rarely needs to redesign, add missing structural UI, or invent new interaction surfaces.

The intended sequence is:

```text
requirements/content model
→ UI architecture / screen tree
→ design system + shared components
→ responsive rules
→ state/variant coverage
→ asset slots/contracts
→ representative screen/content coverage
→ DESIGN_READY
→ implementation
```

`DESIGN_READY` is stronger than "a few mockups exist".

Before the gate passes, the design should define, as applicable:

- complete screen/page hierarchy;
- navigation relationships;
- reusable shell and layout regions;
- component families and variants;
- typography and spacing hierarchy;
- responsive behavior across target breakpoints/device classes;
- empty/loading/error/disabled/success states;
- short/normal/long content behavior;
- interaction affordances that affect layout;
- asset positions, dimensions, aspect-ratio rules and placeholder contracts;
- modal/dialog/popup patterns;
- report/result/summary states;
- representative edge cases discovered during pilot design;
- enough real or representative content to validate composition.

The goal is:

```text
after DESIGN_READY:
coding ≈ implementation of an approved system

not:
coding → discover missing screen → invent UI → continue
```

### Allowed post-gate UI changes

UI changes after `DESIGN_READY` should be exceptional, not routine.

They are justified when implementation or real content reveals:

- a legitimate requirement that design could not reasonably have anticipated;
- a missing capability/state;
- responsive failure under real short/long/extreme content;
- accessibility/usability defect;
- platform/browser/device constraint;
- an approved product change.

Such a finding routes through Causal Change Review before changing shared UI.

### Relationship to SHELL_READY

For UI-first applications:

```text
DESIGN_READY
→ code the application shell
→ representative implementation pilot
→ Tester exploratory pass
→ SHELL_READY
→ content/feature scale-out
```

Therefore:

- `DESIGN_READY` means the design specification is mature enough to implement.
- `SHELL_READY` means the implemented reusable shell has survived representative practical testing and is stable enough to scale.

These are separate gates and neither substitutes for the other.

## 4.9 Design Coverage Inventory before UI design

User decision:

For UI-first applications, UI Design must not begin from a few obvious screens and discover the rest during implementation.

Before detailed UI Design, the system creates a **Design Coverage Inventory**: a structured map of all known user flows, screens, states, content forms, interaction states and reusable surfaces that the product will require.

The purpose is to determine **what must be designed before coding starts**.

```text
requirements
+ content model
+ product flows
+ feature list
→ Design Coverage Inventory
→ UI tree / state tree
→ detailed UI design
→ DESIGN_READY review
→ code
```

### Example: learning application

The design scope is not just "home page + lesson page".

The inventory may include:

```text
Hub / subject / grade entry
→ Topic list
→ Topic detail
→ Lesson list
→ Lesson entry
→ Theory / learning canvas
→ Theory navigation
→ Correct-answer feedback
→ Incorrect-answer feedback
→ Exercise entry
→ Exercise question
→ Different exercise-type variants
→ Hint / retry / reveal states where applicable
→ Automatic next-question transition
→ Completion state
→ Score / grading
→ Report / result summary
→ Return / resume / repeat flows
```

Each of these is treated as an expected design surface/state if the product requirements imply it.

### Design coverage dimensions

The inventory must evaluate at least:

1. **Navigation surfaces**
   - entry points;
   - hierarchy;
   - back/next/close behavior;
   - resume/re-entry paths.

2. **Content surfaces**
   - topic;
   - lesson;
   - theory;
   - examples;
   - exercises;
   - reports/results.

3. **Interaction states**
   - idle;
   - selected;
   - correct;
   - incorrect;
   - disabled;
   - completed;
   - retry;
   - loading;
   - error;
   - empty.

4. **Exercise/content variants**
   - each materially different question/exercise type;
   - different media requirements;
   - short/normal/long text;
   - image/audio-heavy cases.

5. **Responsive states**
   - target device classes;
   - content extremes;
   - orientation/viewport cases when relevant.

6. **System states**
   - first use;
   - no data;
   - partial progress;
   - completed progress;
   - offline/network failure where relevant;
   - missing/pending asset fallback.

7. **Reusable components**
   - headers;
   - navigation;
   - cards;
   - learning canvas;
   - controls;
   - feedback;
   - score/report components;
   - modal/dialog patterns.

8. **Asset requirements**
   - icon/artwork/audio/video slots;
   - dimensions/aspect ratios;
   - placeholder behavior;
   - final filename/path contract.

### UI State Matrix

For complex apps, the Design Coverage Inventory should produce a UI State Matrix.

Example:

```text
Surface            | State/Variant             | Must Design?
Topic list         | normal / empty            | YES
Lesson             | intro / theory / end      | YES
Question           | unanswered                | YES
Question           | correct                   | YES
Question           | incorrect                 | YES
Exercise           | type A / B / C            | YES
Report             | complete / partial        | YES
Responsive lesson  | mobile / tablet / desktop | YES
```

The matrix is not limited to literal pages. It includes meaningful states inside the same page/component.

### Coverage gate

`DESIGN_READY` may pass only when the system has reviewed the Design Coverage Inventory and confirmed that all **known, requirement-implied** UI surfaces/states are either:

- fully designed;
- intentionally delegated to a reusable component/pattern already designed;
- explicitly deferred with a recorded reason and no blocking impact.

The goal is:

```text
known requirement
→ known design surface
→ designed before code

not:

known requirement
→ coder encounters it
→ new UI is invented during implementation
```

### Unknown future cases

This does not require predicting every possible future edge case.

After `DESIGN_READY`, UI changes are still allowed when real content/testing exposes a genuinely unanticipated case. Those changes follow the existing Causal Change Review and post-SHELL_READY rules.

Therefore the distinction is:

```text
could have been known from requirements/content model
→ should have been in Design Coverage Inventory

only discovered through real implementation/content/device behavior
→ legitimate later discovery
```

## 4.10 Specialist-skill delegation for UI design

User decision:

The core GPT Super Agent theory must not accumulate an ad-hoc, incomplete UI/UX methodology.

Core architecture defines only the orchestration contract:

- when UI-first planning is required;
- when a Design Coverage Inventory is required;
- the existence of DESIGN_READY and SHELL_READY gates;
- which role owns each stage;
- what artifacts must exist before the next stage;
- when Tester/Human/Causal Change Review is required.

The detailed design methodology must come from a dedicated UI design skill/harness selected or developed for that purpose.

Therefore:

```text
Super Agent core
= orchestration + lifecycle + gates + handoff contracts

UI design skill/harness
= concrete design methodology
  + coverage checklist
  + responsive rules
  + component/state audit
  + visual system guidance
  + design QA
```

The core must reference the specialist contract rather than duplicate its methodology.

Example:

```text
Planner determines:
"This Job is UI-first and requires DESIGN_READY."

→ UI Design agent/skill is invoked
→ specialist skill determines the concrete UI coverage process
→ produces the required design artifacts/evidence
→ Super Agent checks whether the DESIGN_READY contract is satisfied
→ implementation may proceed
```

This keeps the theory coherent and allows the UI methodology to improve independently without rewriting the Project / Job / Task / Run architecture.

The same principle should apply to other specialist domains when appropriate: the core orchestrator owns lifecycle/governance, while specialist skills own domain methodology.

### Example — UI-first learning app

Example only; this is not the canonical UI methodology.

```text
Project:
Kid learning web app

Known product flow:
grade
→ subject
→ topic
→ lesson
→ theory
→ exercise
→ correct/incorrect feedback
→ score/report
```

Super Agent core does NOT decide the detailed visual rules itself.

Instead:

```text
1. Planner classifies the Job as UI-first.

2. Planner records that implementation requires DESIGN_READY.

3. UI Design specialist skill/harness is invoked.

4. The specialist examines the product/content model and determines
   the concrete design coverage it needs, for example:
   - page/screen tree;
   - lesson states;
   - exercise variants;
   - correct/incorrect states;
   - responsive cases;
   - reusable components;
   - asset requirements.

5. The specialist produces its design artifacts and evidence.

6. Super Agent checks only the orchestration contract:
   - required design artifact exists;
   - known requirement-implied surfaces are covered;
   - unresolved blockers are explicit;
   - DESIGN_READY decision is recorded.

7. UI/UX implementation begins according to the approved Detailed Execution Plan.

8. Representative real content is implemented.

9. Tester exercises the shell.

10. If the shell survives representative cases:
    SHELL_READY
    → content scale-out may begin.
```

The core therefore knows **when design must be complete and what gate must be satisfied**, while the UI specialist owns **how to perform professional UI design and what detailed design checks are required**.


## 4.11 Project lifecycle vs release completion milestones

User decision:

For application projects, Project lifecycle state and product/release completion milestones are separate concepts.

A Project can remain active while having completed one or more meaningful product milestones.

### Project lifecycle state

Recommended lifecycle state:

```text
ACTIVE
PAUSED
ARCHIVED
```

This answers:

```text
Is this Project currently being worked on?
```

### Release / product completion milestones

The Project may additionally record versioned completion milestones such as:

```text
DONE_BETA
DONE_V1
DONE_EXE_V1
DONE_MOBILE_V1
DONE_WEB_V1
DONE_V2
```

These answer:

```text
What product/release milestone has been completed?
```

The exact milestone vocabulary is project-specific and must not be hard-coded as a closed global enum.

Examples:

```text
Project: CadGPT
lifecycle: ACTIVE

release milestones:
- DONE_BETA
- DONE_EXE_V1

current work:
- V1.1 fixes
- plugin/runtime improvements
```

or:

```text
Project: Kid learning web app
lifecycle: ACTIVE

release milestones:
- DONE_BETA
- DONE_WEB_V1

current work:
- content scale-out
- V1.1 UX improvements
```

Therefore:

```text
Project lifecycle
≠ product completion level
```

A completed release does not force the Project into ARCHIVED.

### Milestone records

Each release completion milestone should be recorded with:

```text
milestone_id / label
date
scope/version
source commit or release/tag when applicable
acceptance result
deployment/package target when applicable
known limitations
pending retests / deferred items
human approval reference
```

This lets the Project preserve a durable history of what was actually considered complete at each release boundary.

### Archive behavior

A Project may move to `ARCHIVED` only when the user intentionally stops active development/maintenance.

It may later return to `ACTIVE` without losing prior release milestones.

## 4.12 Parallel Jobs inside one Project

User decision:

A Project may have multiple `READY` / `IN_PROGRESS` Jobs at the same time.

ChatGPT supports multiple conversations, so independent work may proceed in parallel across chats when the approved milestone/dependency topology allows it.

Example:

```text
Chat A
→ Coder continues implementation

Chat B
→ Designer generates pending assets

Chat C
→ Reviewer inspects a different completed milestone
```

Parallelism is allowed only when work does not create an unresolved dependency or write conflict.

The Detailed Execution Plan / milestone topology must determine:

- which Jobs or Tasks may run in parallel;
- which ones must wait;
- which artifacts are shared dependencies;
- which scopes/repositories/files may be written concurrently;
- which handoffs must complete before downstream work starts.

Therefore:

```text
parallel if independent
sequential if causally dependent
blocked if write-conflicting
```

The system must not serialize all Jobs merely because they belong to one Project.

It also must not assume that two active chats are safe simply because they are separate conversations.

### Conflict rules

Before starting or continuing parallel work, the harness should check for material overlap such as:

- same branch;
- same files/components;
- same shared contract/schema;
- same migration/data structure;
- same release-critical artifact;
- one Job changing assumptions consumed by another.

If overlap is harmless, work may continue.

If overlap may change behavior or invalidate assumptions:

```text
parallel work
→ conflict detected
→ pause affected branch of work
→ Causal Change Review or explicit coordination
→ human decides when needed
```

### Asset-production example

A Code Job may continue using a stable placeholder contract while a Design/Asset-producing Job proceeds in parallel:

```text
Code Job
→ implements against AR-0012 contract
→ placeholder works

Design/Asset Job
→ produces final AR-0012 asset

both may run in parallel
→ final asset delivery
→ practical Retest
```

This is a primary intended use of Project-level parallelism.

### No autonomous scheduler requirement

Parallel Jobs do not imply that the plugin is an autonomous scheduler.

Under the current platform model, the user may open/invoke multiple chats manually. Each Run persists its own role attribution and Job/Task linkage while sharing the same durable Project state.

Future automatic dispatch may coordinate the same model without changing the Project / Job / Task / Run architecture.

## 4.13 Repository ownership and read-only references

User decision:

A GitHub repository is a source-code ownership unit and may be **owned by only one GPT Super Agent Project**.

```text
1 repo
→ exactly 1 owning Project
```

A Project may own one or many repositories:

```text
Project A
├── owns repo-1
├── owns repo-2
└── owns repo-3
```

An owned repository is writable by that Project's approved code workflow.

### Read-only repository references

A different Project may still **reference** the repository, but reference has a strict meaning:

```text
reference
= read-only access for context, contracts, examples, dependency understanding,
  compatibility analysis, or reuse planning
```

A referenced repository is NOT writable by the referencing Project.

Example:

```text
Project A
owns:
- app-a

references:
- shared-library-b   # read-only
```

The referencing Project may inspect source, interfaces, schemas, behavior, or implementation patterns, but MUST NOT modify the referenced repository in place.

### Copy / fork / derived-code rule

If the referencing Project needs to modify or adapt code from a referenced repository:

```text
referenced repo (read-only)
→ copy / fork / clone selected code into a destination owned by this Project
→ record origin/provenance
→ modify only the owned destination
```

The destination may be:

- an owned repository;
- a new repository assigned to the Project;
- an owned workspace/path that will later become Project-owned source.

The original referenced repository remains unchanged.

This permits legitimate reuse/adaptation without creating competing write authority over the same source-of-truth repository.

### Cross-project dependency

If Project A needs the original repository itself to change, and that repository is owned by Project B:

```text
Project A identifies dependency/change need
→ request/route change to Project B
→ Project B performs the source change
→ Project A consumes the resulting contract/release/integration outcome
```

If Project A instead wants its own divergent implementation:

```text
Project A reads Project B's repo
→ copies/forks the needed source into Project A ownership
→ Project A modifies its owned copy
```

### Project repository registry

Project Memory should distinguish explicitly:

```text
owned_repositories
referenced_repositories
```

Rules:

- owned repositories are writable according to Job/Run permissions;
- referenced repositories are always read-only;
- one repository may be referenced by many Projects;
- one repository may be owned by only one Project;
- changing ownership requires explicit human approval;
- creating an owned derivative from referenced source must preserve provenance.


## 4.14 Minimal Project skeleton

User decision:

Every Project should start from a **minimal standard skeleton**, but the exact file/folder schema must be defined later as a dedicated design task.

The core theory only freezes the following:

```text
Project initialization
→ creates a small canonical structure
→ enough to identify the Project, hold durable control-plane state,
  and provide stable homes for known persistent requirement queues
→ avoids generating a large tree of speculative empty artifacts
```

Known persistent areas already justified by the architecture include at least:

- Project marker / identity and ownership metadata;
- Job / Task / Run state storage;
- Asset Requirements;
- test / practical verification requirements and Retest records;
- release/completion milestone records;
- durable decisions / handoff information as required.

The exact naming, file boundaries, front matter, indexes, IDs, and folder hierarchy are **NOT frozen yet**.

For example, concepts currently known to need durable homes include:

```text
asset-requirements/
test-requirements/ or equivalent
retests/ or equivalent
jobs/ or equivalent
releases/ or equivalent
```

The final schema may combine or rename some of these if a cleaner design preserves all required semantics.

Rule:

```text
freeze the need for a minimal skeleton now
→ design the exact Project Memory schema later
→ avoid premature folder-by-folder canonization
```

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
