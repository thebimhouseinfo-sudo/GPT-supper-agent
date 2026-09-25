# E18 — Real Job Pilot

## Purpose

Verify that GSA can run a meaningful real Project Job using the current Planner/role/skill runtime rather than a synthetic README-only task.

The pilot should use a bounded real change in an existing Project repository.

## Preconditions

- Memory Repo configured and writable.
- Existing Project resolves successfully.
- GSA MCP schema exposes:
  - `get_agent_harness`
  - `get_skill_catalog`
  - `load_skill`
  - `job_prepare`
  - `job_transition`
  - `run_begin`
  - `goal_recheck_record`
  - `run_complete`
- Source repository is reachable.
- The requested change is small enough to complete safely in one Job.
- Human remains merge/release authority.

## Pilot shape

Prefer a real brownfield Job with one observable objective and a narrow source scope.

Good examples:
- one command/help-flow correction;
- one UX behavior correction;
- one small UI/UX behavior adjustment;
- one bounded bug with existing verification path.

Avoid as first pilot:
- migrations;
- authentication/security redesign;
- broad refactors;
- dependency upgrades;
- deployment changes;
- destructive operations.

## Stage A — Planner nomination

A new durable objective MUST enter through Planner.

Planner must:
1. load Planner harness;
2. load `job-planning`;
3. inspect existing Project Memory and selective live source;
4. classify repository maturity as BROWNFIELD;
5. classify product workflow as UI_FIRST or UX_FIRST when relevant;
6. review existing implementation/contracts before proposing changes;
7. define objective, scope, non-goals, Tasks, completion criteria and gates.

PASS:
- Planner reuses the existing system where appropriate;
- the plan does not redesign unrelated areas;
- material user-facing decisions are surfaced to Human.

## Stage B — UX_FIRST temporary UI Human Gate

Only when the Job is UX_FIRST and needs temporary UI:

Planner records:
- `temporary_ui[]`;
- provisional boundaries;
- collected durable UI requirements;
- UI Update Pack trigger;
- `temporary_ui_human_approval`.

Expected behavior:

```text
temporary UI contains user-visible interaction choices
→ default REQUIRED_PENDING
→ run_begin(role=coder) MUST refuse
→ Human reviews/adjusts proposal
→ approved planning revision is persisted
→ Coder may start
```

Examples include fake CLI command names/groups/order/aliases, navigation order, visible actions and workflow step order.

PASS:
- Coder cannot start while approval is pending.
- “Temporary” is never treated as permission for agent-authored product decisions.

## Stage C — Job activation and Coder Run

Before the first execution Run, the durable Job transitions:

```text
READY
→ job_transition with exact current blob SHA
→ IN_PROGRESS
```

Then the Coder Run starts.



Coder:
1. receives the current Job snapshot;
2. `run_begin` validates Job identity/lifecycle/gates;
3. loads Coder harness;
4. loads `coding-loop`;
5. reads live target before writing;
6. implements only approved scope;
7. inspects actual diff;
8. discovers and runs repository-specific verification where available;
9. adapts on diagnosed failure rather than blind retry.

PASS:
- unrelated changes are preserved;
- denied actions are not routed around;
- actual diff is inspected before success.

## Stage D — Goal Recheck

Coder creates append-preserving Goal Recheck evidence.

Every completion criterion is:
- MET;
- PARTIAL;
- NOT_MET;
- UNVERIFIED.

Expected:
- NOT_MET blocks success;
- unresolved scope drift blocks success;
- PARTIAL/UNVERIFIED remain explicit.

PASS:
- tests alone are not used as proof that the Job objective is complete.

## Stage E — Reviewer / Tester when required

If topology/risk requires Reviewer:
- review is exact-revision bound;
- Reviewer is source read-only;
- actual diff/evidence is reviewed;
- Reviewer does not repair source.

If practical behavior verification is required:
- Tester executes only with OBSERVED capability;
- otherwise Human Retest instructions are created.

## Stage F — Durable completion

After required Run/Verification/Handoff work is satisfied, the Job itself transitions:

```text
IN_PROGRESS
→ verify durable completion evidence
→ job_transition
→ COMPLETED + PASS | PASS_RETEST_REQUIRED
```

A Job must not remain READY after real execution begins, and a terminal Run alone is not the Job terminal state.



Persistence order:

```text
source/output evidence
→ Verification
→ Handoff if needed
→ terminal Run LAST
```

Fresh chat must be able to reconstruct enough state to continue without replaying hidden prior reasoning.

## PASS criteria

E18 passes only when:
1. a real existing Project is used;
2. Planner is nominated for the new objective;
3. brownfield review happens before upgrade planning;
4. UI_FIRST/UX_FIRST policy is applied when relevant;
5. pending UX_FIRST temporary UI Human Gate blocks Coder;
6. Coder performs evidence-driven implementation loop;
7. Goal Recheck is persisted;
8. required Reviewer/Tester path is honored;
9. Job lifecycle reaches IN_PROGRESS and then COMPLETED only through exact-SHA serialized transitions;
10. durable state supports fresh-chat continuation;
11. no merge/deploy occurs without explicit Human authorization.

## Recommended first pilot prompt

After opening an existing Project, give GSA one real, bounded change in natural language.

Do not manually invoke Coder. The acceptance target is that GSA performs:

```text
new objective
→ Planner
→ plan / Human Gate if needed
→ Job
→ Coder
→ Goal Recheck
→ Reviewer/Tester if required
→ durable completion
```
