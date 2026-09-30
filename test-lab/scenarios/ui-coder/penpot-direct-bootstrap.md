# Direct Penpot MCP bootstrap capability experiment

Status: PLANNED / UNDER REVIEW
Authority: Test Lab only; no production lifecycle authority.

## Purpose

Empirically establish the minimum Direct Penpot MCP behavior GSA Online needs before the full UI Design workflow depends on it.

This is a stand-alone capability experiment. It does not approve a production UI Design workflow and does not turn Penpot-generated code into production source.

## Required sequence

1. Implement the minimal lab-only Direct Penpot MCP integration in GSA Online.
2. Human performs only the unavoidable Penpot file-open / MCP-connect action.
3. Tester independently authors and freezes the concrete Capability Test Plan from the questions below.
4. UI Coder executes that frozen plan against a disposable/synthetic Penpot target.
5. Tester independently re-opens/read-backs/verifies the resulting artifact and outputs.
6. Persist a small Markdown/JSON result manifest in `test-lab/results/`.

Planner does not pre-author the detailed test cases.


## Role access boundary

- UI Coder may use the bounded mutation operations required by the frozen experiment.
- Tester must independently re-open/inspect/read back the frozen Penpot target through read-only operations; UI Coder self-report is not sufficient verification.
- If that independent read-back surface is unavailable, record `INTEGRATION_NOT_READY`/BLOCKED and stop rather than converting the limitation into PASS.

A direct-MCP transport blocker is evidence, not successful completion. PASS for this bootstrap requires the functional lab path, UI Coder execution, independent Tester verification, and the Test Lab result manifest.

## Capability questions

Tester must design sufficient exercises to establish, as applicable:

- direct MCP REACHABLE / INVOCABLE behavior;
- exact file/page target binding and read-back;
- representative create/edit operations;
- stable file/page/object references;
- representative Penpot-native asset creation;
- asset export/retrieval semantics, including filename/type/usable bytes or stable reference and what is required to hand the asset to a target repository;
- useful design-to-code/code-reference output that UI Coder can review/reuse/adapt later;
- disconnect/reconnect/rebind behavior without replacing the intended target;
- explicit limitations and unavailable operations.

## Code-reference rule

Generated/exported code is draft design material only. The test establishes whether it is useful input for UI Coder review. It must not be treated as reviewed production code.

## Asset rule

The experiment proves asset creation/export/retrieval capability. Disposable binary outputs may stay in scratch/external temporary storage. The durable Test Lab result records stable refs/hashes/paths/observations needed to prove what happened.

## Result

Write one small result manifest under `test-lab/results/`, e.g.

`penpot-direct-bootstrap-<date-or-run>.json`

Record:

- source/runtime revision;
- Penpot capability surface used;
- frozen Tester plan reference;
- observed readiness level per tested operation;
- asset export/retrieval observation;
- code-reference observation;
- stable target/object refs where safe;
- reconnect observation;
- evidence refs;
- limitations / UNKNOWN / PARTIAL results;
- direct Human-review links/paths where available.

Never store Penpot tokens, token-bearing URLs, credentials or other secrets.
