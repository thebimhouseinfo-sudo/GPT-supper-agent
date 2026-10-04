# UI Coder capability scenarios

This folder holds small text/JSON scenario definitions used to empirically test UI Coder/frontend capabilities that cannot be established safely from prompts or tool presence alone.

UI Coder remains a **Coder specialization and the primary frontend implementer**. Test Lab does not introduce a separate design workspace or external design-authoring dependency.

## Stand-alone capability workflow

When a real unknown needs empirical testing:

~~~text
Planner states the capability question
→ Tester authors the concrete Capability Test Plan
→ UI Coder executes the frozen plan against a disposable/runnable target
→ Tester independently verifies the result
→ small result manifest is recorded in test-lab/results/
~~~

Planner does not pre-author detailed test cases.

## Example Planner-level capability questions

Planner may ask Tester to determine whether UI Coder can, against a real runnable frontend:

- implement the required distinct screen structures from an approved design/UX contract;
- create/reuse components and required visual states;
- preserve existing architecture and approved design while refactoring implementation details;
- realize required responsive compositions across representative viewports;
- integrate existing/generated/placeholder assets while preserving stable Designer asset contracts;
- expose all required screen/state coverage with representative content;
- use browser-backed inspection to detect clipping, overflow, broken/missing assets, console/page errors and obvious responsive failures;
- produce a frozen implementation that Tester can independently re-open and verify.

These are questions, not scripted test cases. Tester owns the concrete Capability Test Plan, evidence requirements, PROBE/VERIFY/MEASURE choices and sequence.

Capability status remains evidence-based:

~~~text
DISCOVERED
→ REACHABLE
→ INVOCABLE
→ FUNCTIONAL
→ GOAL_MET
~~~

Do not infer a later state from tool presence alone.

Scenario definitions must not contain credentials/secrets. Large/private binary evidence remains subject to the Test Lab evidence policy.
