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
| P3 Pull-based orchestration | ACCEPT | Use pull-based orchestration. One Run has exactly one role. A chat may finish one Run and start another non-independent Run explicitly. Any checkpoint requiring independent review MUST start a fresh chat. No scheduler is assumed. |
| P4 Append-only Run records | MODIFY | Each Run gets a unique append-only record. Run records are the concurrency-safe history. A project-level STATE snapshot may exist as a derived/materialized cache and may be rebuilt by reconciliation; it is not the sole source of truth. Never rely on concurrent blind overwrite of one state file. |
| P5 Mechanical checkpoint floor | MODIFY | Do not use LOW/STANDARD/HIGH work classes. Review requirements are selected directly from the Job workflow plus mechanically checkable change triggers. Mandatory review triggers may include shared contract/API/schema changes, migrations/irreversible data changes, auth/secrets handling, CI/workflow changes, destructive source/data actions, material dependency changes, and cross-repo contract impact. Removing a mandatory checkpoint requires explicit user acknowledgement. Merge/deploy remains an explicit human-controlled event. |
| P6 D1/D2 definition depth | ACCEPT | Every skeleton module gets a D1 boundary contract. Only the first real-run path needs D2 before the first end-to-end test. This preserves conceptual completeness without over-specifying unused internals. |
| P7 Job lifecycle core | MODIFY | Center STATE-MACHINE-v1 on Job lifecycle, but separate lifecycle from review/acceptance result. Candidate lifecycle: PLANNED -> READY -> IN_PROGRESS <-> PAUSED -> SUBMITTED -> CLOSED; side states BLOCKED, STALE, CANCELLED. A review result can route SUBMITTED -> IN_PROGRESS for revision or allow closure. Project has lifecycle status (for example active/archived), not a global workflow enum. Artifact status remains separate. |
| P8 Designer on-demand asset service | MODIFY | Keep the upstream concept/style-anchor flow and add on-demand asset requests. A material design request creates a design Job. Placeholder-first is allowed only when the final asset is not acceptance-blocking. Asset persistence remains capability-gated and UNKNOWN until tested. |
| P9 Evidence and quality vocabulary | MODIFY | Do not delete QA/QC. Stabilize them using three canonical check families: COMPLIANCE, CORRECTNESS, FIT. QA is the process-assurance umbrella, primarily compliance/evidence integrity. QC is the output-quality umbrella, primarily correctness + fit. Evidence is commit-bound. Objective evidence is primary; model judgement is supplementary and clearly labelled. |
| P10 Conservative invalidation | ACCEPT | Upstream normative change makes dependent artifacts STALE by default. Cheap revalidation may restore them. The model does not silently prove descendants unaffected. |
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

## 5. Review floor and acceptance result

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
