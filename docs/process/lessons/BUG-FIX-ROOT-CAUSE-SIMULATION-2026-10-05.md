# Bug-fix root-cause and simulation lesson — 2026-10-05

Status: CANDIDATE / LLC collection only. This note records workflow debt and does not itself activate a new role, skill, or runtime behavior.

## WL-033 — Bug fixing requires root-cause mapping plus behavioral simulation, not patch + CI closure

Real project work exposed a gap in the current GSA Coder/coding-loop contract: GSA has strong generic implementation and review loops, but no dedicated Bug Fixer / debugging skill that forces an agent to reconstruct the full failure path before changing source and to simulate the real call chain after the patch.

The failure pattern is:

```text
user-visible bug
→ inspect the nearest failing function
→ patch one local defect
→ CI turns green
→ live feature still fails
→ discover the next caller/state/runtime/surface defect
→ patch again
→ repeat
```

This is not sufficient debugging. A green unit/CI suite can prove known local invariants while the actual product path still fails because the broken behavior may live in orchestration, caller assumptions, process boundaries, generated surfaces, persistence, environment resolution, or stale runtime state.

### Required bug-fix workflow

Before source mutation, the responsible agent must establish a root-cause investigation map.

#### 1. Lock the observed symptom

Record:
- exact user-visible failure;
- exact failing operation / acceptance criterion;
- exact target revision/runtime when known;
- reproduction inputs and state;
- whether the failure is deterministic, intermittent, reload-dependent, persistence-dependent, or environment-dependent.

Do not start by assuming the nearest exception or failing function is the root cause.

#### 2. Build the relationship / call graph

For the suspected function or subsystem, inspect and map at least:

```text
entrypoint / user action
→ public tool/API/command
→ direct caller
→ caller-of-caller / dispatcher / router
→ target function
→ downstream callees
→ state/persistence reads and writes
→ config/env/path resolution
→ process/runtime boundary
→ generated/cached/manifest/tool-surface artifacts
→ external host/platform boundary
→ returned state / UI / acceptance result
```

The map must include materially relevant sibling or legacy implementations when duplicate behavior may exist.

The purpose is to answer:

> If this function is correct, what else can still make the same observed feature fail?

#### 3. Produce a failure-surface candidate set

List every plausible failure point on the mapped path, then eliminate or rank candidates with evidence.

Typical candidate classes include:
- wrong caller arguments or stale handles;
- wrong document/object/context selection;
- state stored in a different owner/source than the reader expects;
- path/env/config drift;
- stale process/runtime after source change;
- generated manifest/catalog not refreshed;
- connector/UI surface not exposing a server capability;
- cache/reload/session behavior;
- persistence written only in memory but not at the intended durable boundary;
- duplicated/legacy implementation still serving the live route;
- tests exercising helpers while the real dispatcher/orchestration path differs.

Patch the smallest shared/root cause that explains the evidence. Do not patch candidates one-by-one merely because each can produce a similar symptom.

#### 4. Verify locally and with CI

Run all relevant static checks, unit tests, contract tests, integration tests and CI available for the exact changed revision.

CI is necessary evidence, not closure.

A green suite means:

> the assertions that were executed passed.

It does not by itself mean:

> the real product call chain will execute correctly.

#### 5. Perform behavioral call-chain simulation

After CI passes, simulate the feature from the real entrypoint.

The agent must explicitly walk through:

```text
user invokes feature
→ what public function/tool is called?
→ what does it call next?
→ with what concrete arguments/state?
→ what process/runtime owns that next step?
→ what is read/written?
→ what does the next layer return?
→ how does the caller interpret that result?
→ what final state/output does the user observe?
```

Simulation should use executable mocks/stubs/fixtures where practical, not only prose.

Where the real external host is unavailable, create the closest bounded simulation that proves:
- routing reaches the intended implementation;
- caller/callee contracts line up;
- exact state is propagated across boundaries;
- reload/restart behavior is represented when relevant;
- failure paths fail closed;
- generated/exposed surfaces include the capability that runtime code registered;
- persistence/read-back paths survive the lifecycle being claimed.

For a bug that depends on reload, restart, reopen, session rotation, persistence or process replacement, the simulation must include that lifecycle transition.

#### 6. Run live acceptance when a real host is required

If the bug depends on AutoCAD, browser UI, external service, device, deployment, or another real runtime, simulation is not a substitute for final live acceptance.

Required sequence:

```text
root-cause map
→ patch
→ CI
→ behavioral simulation
→ live acceptance
→ close
```

If live acceptance fails, return to the relationship/failure-surface map and expand/re-rank it. Do not resume symptom-by-symptom patching.

### Why this differs from WL-032

WL-032 defines an escalation rule:

> after a hotfix fails retest, stop whack-a-mole patching and perform a full failure-surface scan.

WL-033 generalizes that lesson into the normal bug-fix contract:

> every non-trivial bug fix should be root-cause-driven from the start, relationship-aware, and behaviorally simulated after CI before being declared fixed.

WL-032 remains the mandatory escalation trigger when an initial bounded hotfix was reasonably attempted and still failed.

### Candidate workflow owner

Preferred future ownership:

1. a dedicated **Bug Fixer / Debugging skill** usable by the Coder role; or
2. a mandatory debugging branch inside the existing `coding-loop` skill.

Do **not** create a new persistent GSA role merely from this lesson. A separate Bug Fixer agent/role should be introduced only if later evidence shows debugging needs materially different context isolation, authority, lifecycle, or handoff semantics from Coder.

The skill should require durable outputs such as:
- symptom/reproduction statement;
- relationship/call graph;
- failure-surface candidate set;
- root-cause conclusion with evidence;
- changed surfaces;
- CI evidence;
- behavioral simulation trace;
- live acceptance requirement/result or explicit limitation.

### Evidence

CadGPT real-work incidents on 2026-10-05:
- Job-owned Lisp loading had multiple gates in the end-to-end path; fixing one sandbox layer did not prove the outer proxy/runtime path would work.
- Drawing Anchor code passed static/CI checks while live reload persistence still exposed exact-document/runtime-lifecycle issues.
- Human Power was implemented and registered server-side, but the ChatGPT connector surface still did not expose the new tools; source presence was not equivalent to callable product behavior.
- repeated pull/restart/retest cycles consumed Human time because the complete call chain and failure surface had not been modeled before the first fixes.

These incidents demonstrate that bug fixing needs both structural root-cause analysis and post-CI behavior simulation.
