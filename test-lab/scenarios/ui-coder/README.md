# UI Coder capability scenarios

This folder holds small text/JSON scenario definitions used to empirically test UI Coder capabilities.

The later P2 workflow is stand-alone: Planner states the capability questions it needs answered; **Tester authors the concrete Capability Test Plan**; UI Coder receives that frozen plan as its work request.

## Penpot connection policy

For the first Penpot capability experiment, use the **official/direct Penpot MCP path first**. Do not add a custom GSA Penpot bridge merely because Penpot is not yet connected in the current ChatGPT session.

The Penpot connection and any access key/token remain user-controlled secrets. Never write credentials, token values, token-bearing URLs, or secret placeholders into Git, Project Memory, Test Lab result manifests, or logs.

A custom bridge is considered only after the direct MCP experiment produces evidence of a concrete missing requirement. That bridge, if needed, is a separate reviewed Job.

## Planner-level capability questions for P2

Planner may ask Tester to determine whether UI Coder can, with a real Penpot artifact:

- create and edit the required distinct screen structures;
- create/reuse components and relevant visual states;
- read back enough artifact structure to prove edits actually landed;
- represent required responsive compositions/variants when supported by the active Penpot surface;
- create/place/export shell-level UI assets or stable asset references while preserving reviewed asset contracts;
- maintain stable file/page/object references so Tester can independently inspect the frozen output;
- cover the full required screen set with representative content rather than only one mockup.

These are **questions**, not scripted test cases. Tester owns the concrete Capability Test Plan, evidence requirements, PROBE/VERIFY/MEASURE choices, and test sequence during P2.

Capability status must be evidence-based:

```text
DISCOVERED
→ REACHABLE
→ INVOCABLE
→ FUNCTIONAL
→ GOAL_MET
```

Do not infer a later state from tool presence alone.

Scenario definitions may describe required outputs and evidence, but must not contain credentials or Penpot user tokens. Design files, screenshots, exports, and other binary evidence stay external and are referenced by path/link.
