# GSA V2 Improvement Notes

## Status

```text
PURPOSE = Phase-2 improvement working note
SCOPE = Coding-agent quality / Super-Agent evolution
AUTHORITY = NON-CANONICAL
DESTINATION = feeds reviewed updates into PHASE2-IMPLEMENTATION.md and role/skill harnesses
```

This note captures lessons learned from real GSA pilots and from external coding-agent research. It does not replace the current Phase-2 implementation source of truth.

Accepted lesson ownership and checkpoint disposition are tracked in `docs/process/GSA-WORKFLOW-LESSONS-LEDGER.md`. Once a lesson is classified there, this note remains supporting intake/research evidence only; it is not the canonical owner of the resulting workflow rule.

## Current MVP direction

The practical MVP target is a strong sequential coding-agent system running through ChatGPT Web/plugin infrastructure.

The current phase is not a feature race. GSA should improve:
- planning quality;
- context selection;
- Job sizing;
- execution discipline;
- self-review;
- review quality;
- verification;
- durable relationship awareness.

Parallel agents, IDE plugins, multi-provider infrastructure and local background workers are out of scope unless the GSA operating model changes.

## Two parallel improvement tracks

### A. External benchmark and migration

Study strong coding agents to identify mechanisms that improve the same model through better:
- context selection;
- planning/decomposition;
- edit-test-repair loops;
- review;
- recovery;
- evidence;
- tool/interface design.

For each mechanism classify:

```text
DIRECT_MIGRATION
PARTIAL_EMULATION
INFRA_LIMITATION
OUT_OF_SCOPE
```

Local-runtime triggers are not copied literally. Their intent should be translated into explicit GSA lifecycle obligations where feasible.

### B. Real-world pilot and GSA-specific discovery

Continue using real projects such as CadGPT, Kid eSchool and cleanup/refactor work.

Pilot findings serve two purposes:
- validate migrated mechanisms;
- discover gaps not already covered by external-agent patterns.

Do not invent a GSA-specific mechanism when an already-selected migration covers the same problem adequately.

## Progressive context principle

```text
Minimum sufficient context, progressively expanded by evidence.
```

For brownfield repositories:

```text
L0: tree, filenames, repo organization, config/build/test/CI surfaces,
    README/architecture/spec/plan/ADR and other orientation documents

L1: selective architecture/contracts and important implementation entry points

L2: exact files/callers/tests required for the current Task/Job

L3: deeper investigation only when findings, failures or dependencies require it
```

Do not read the whole repository up front.

Brownfield source is evidence, not automatically authority. Before extending existing behavior, establish whether that behavior is canonical, legacy, accidental or incorrect.

## Brownfield working sequence

```text
structure mapping
→ relationship mapping
→ relevant logic review
→ authority / precedence decision
→ planning
→ implementation
→ self-review
→ verification
→ checkpoint / handoff
```

The depth of inspection changes by stage. Planning needs broad orientation; implementation and review need deeper reads only where evidence points.

## Relative relationship awareness

When repo/subsystem A relates to B:
- read B enough to understand impact;
- determine which side owns the canonical contract or has higher precedence;
- do not force the more authoritative side to preserve obsolete downstream behavior;
- record the relationship durably;
- when downstream work starts later, re-read the current upstream source before adapting downstream.

Relationship memory exists to avoid rediscovery and wrong-direction migration.

## Job decomposition principle

Planner should decompose top-down:

```text
Objective
→ Phase
→ Task
→ Job Pack
→ Milestone
```

Definitions:

```text
Phase      = strategic boundary
Task       = required work
Job Pack   = executable context boundary
Milestone  = validated progress boundary
```

A Job Pack may contain one or several closely related Tasks.

A good Job Pack has:
- one meaningful objective;
- one bounded causal chain;
- manageable context;
- clear dependency scope;
- clear self-review boundary;
- clear verification/evidence;
- an independently meaningful completion state.

Core invariant:

```text
Job boundary = context boundary.
```

The Job must be large enough to final meaningfully, but small enough that context quality does not decay before completion.

### Signals that a Job Pack is too large

- multiple unrelated outcomes;
- too many subsystems with different causal chains;
- review requires unrelated perspectives;
- large cross-repo context must remain continuously loaded;
- the completion condition cannot be stated clearly;
- execution/review begins to drift from the original objective.

### Signals that a Job Pack is too small

- it is only a mechanical sub-step with no meaningful outcome;
- it cannot be finalized without another Job;
- splitting adds ceremony without reducing context, risk or ambiguity.

Planner should finish one meaningful bounded Job Pack, persist the durable result/relationships, then let later Job Packs reload only what they need.

## Review and execution closure

Coding and review both need bounded closure.

Coder completion should mean:

```text
implement
→ re-read goal
→ inspect actual work/diff
→ identify ordinary findings
→ repair findings
→ verify behavior
→ handoff
```

Test PASS alone is not goal completion.

Large reviews should also be decomposed into meaningful review scopes/checkpoints rather than allowed to run indefinitely and drift.

## Local-trigger translation

Local coding agents may use filesystem watchers, hooks or background processes. GSA cannot depend on the same infrastructure.

Migration rule:

```text
Do not migrate the local trigger.
Migrate the invariant protected by the trigger.
```

Translate suitable triggers into explicit lifecycle obligations in harness/skills using:

```text
Trigger
→ Required action
→ Evidence
→ Exit condition
```

Keep high-level invariants in harness/system instructions. Put task-specific detail in skills to avoid prompt growth and drift.

## CR boundary

Critic Reviewer remains:
- independent;
- human-triggered only;
- not an automatic execution gate.

GSA may suggest CR after a meaningful checkpoint or final handoff, but must never invoke CR automatically.

## Validation principle

The phase evolves through repeated real work.

```text
external benchmark + migration
                  \
                   → real-project validation → refine harness/skills/context
                  /
pilot gap discovery
```

Promote durable rules only when they are supported by either:
- a strong external mechanism that fits GSA infrastructure and survives validation; or
- repeated GSA-specific evidence not already covered by migrated mechanisms.
