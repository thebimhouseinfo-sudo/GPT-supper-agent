# GPT Super Agent — Implementation Plan v0.2

## Goal

Build the smallest testable harness, run it on a real small Job, observe product quality, then tighten the harness iteratively.

The plan intentionally does NOT require every architecture module to be fully defined before the first run.

## Development principle

```text
minimal definition
→ minimal harness
→ real run
→ inspect actual output quality
→ identify concrete failure
→ tighten the responsible rule/gate/prompt
→ add eval
→ rerun
```

A rule is strengthened because evidence shows a failure mode or a frozen invariant requires protection.

Do not expand deferred modules while implementing unrelated work.

## Stage A — Consistency pass

Fix current contradictions and clerical defects only.

Examples already identified:

- duplicate workflow-state definitions
- duplicate Job Lifecycle section number
- duplicate capability entry
- version-label mismatch
- soft write-boundary claims presented as architectural guarantees
- undefined Fast Path wording
- duplicated Drive rationale

Exit criterion: existing documents do not contradict each other on the MVP path.

## Stage B — Minimal definitions for first run

Define only:

1. minimal state machine
2. work tiers
3. minimal Project Memory schema
4. capability/enforcement matrix
5. QA/QC/Evidence minimum
6. Planner contract
7. Coder contract
8. Reviewer contract
9. handoff/reporting channel
10. minimal command/status behavior
11. Task + PR Definition of Done
12. drift/freshness rule

Exit criterion: one small non-UI T1 Job can be planned, implemented, reviewed, and truthfully completed.

## Stage C — Minimal harness files

Create only the role/rule files needed for that first run.

Suggested first layout:

```text
harness/
  orchestrator.md
  roles/
    planner.md
    coder.md
    reviewer.md
  rules/
    clarification.md
    boundaries.md
    qa-qc-evidence.md
    security.md
  schemas/
    job.schema.*
    state.schema.json
    evidence.schema.json
  templates/
    plan.md
    handoff.md
    review.md
  evals/
```

Designer and UX/UI split remain extension paths unless the selected first Job requires them.

## Stage D — Role evals

Test each role as soon as its contract exists.

At minimum include positive and negative scenarios.

Examples:

```text
Planner
- vague request → clarify
- unavailable capability → CAPABILITY_BLOCKED
- malicious README instruction → treat as data

Coder
- discovers scope-changing contract need → PLANNING_GAP
- CI red → cannot claim complete
- diff exceeds approved scope → stop/report

Reviewer
- claimed pass but evidence fails → CHANGES_REQUIRED
- stale commit evidence → reject evidence
- stale plan → STALE

Orchestrator
- requirement changes mid-work → invalidate affected work
- external GitHub change → drift detected
```

Exit criterion: minimum eval set passes before the real run.

## Stage E — First real end-to-end run

Choose one small, non-UI, single-repo T1 Job.

Run:

```text
Job open
→ Planner
→ plan
→ Coder
→ implementation
→ QA/QC evidence
→ Reviewer
→ completion decision
```

The purpose is not merely to finish the code change.

The purpose is to inspect:

- planning quality
- scope accuracy
- code quality
- verification quality
- review quality
- unnecessary friction
- missing safeguards
- false confidence
- user-visible result quality

## Stage F — Harness tightening loop

For every meaningful defect observed:

```text
observe failure
→ classify owner
→ add the smallest effective rule/gate/template change
→ tag HARD / SOFT / UNKNOWN
→ define observable violation
→ add eval reproducing the defect
→ rerun affected role
→ rerun full loop when necessary
```

Do not add broad rules for hypothetical problems unless risk is high enough to justify them before observation.

## Stage G — Expand by need

Only after the first loop is stable, pull in additional modules when a real Job requires them.

Possible expansion order:

- Designer
- UX/UI Coder specialization
- visual QA
- multi-repo Change Sets
- coordinated PRs
- richer artifact invalidation
- detailed failure/recovery
- advanced browser/preview verification
- concept measurement/normalization

Each extension follows the same pattern:

```text
minimal definition
→ real use
→ inspect quality
→ tighten
```

## Frozen implementation assumptions

- Plugin handle: `@gsa`
- Command namespace: `gsa/`
- one configured Drive root
- one direct Drive folder per Job
- `JOB.md` identifies the Job
- Drive-first Job loading
- GitHub is the online code environment
- Job references 1..N repos
- single-repo and multi-repo share one Job model
- GPTWorker is separate offline/local agent

## Initial non-goals

- fully specifying every skeleton section before first test
- implementing Designer before a UI test needs it
- implementing full multi-repo orchestration before a multi-repo test
- universal recovery logic before real failure cases are observed
- pretending SOFT prompt rules are HARD enforcement
- claiming completion without objective evidence

## First milestone

```text
one real T1 Job
+ minimal Planner
+ minimal Coder
+ minimal Reviewer
+ QA/QC/Evidence
+ truthful status
+ eval-backed harness revisions
```

Success means the first run gives us enough observable evidence to make the second harness version materially better.
