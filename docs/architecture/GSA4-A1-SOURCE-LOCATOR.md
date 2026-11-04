# GSA4 A1 — Source Owner Locator

**Status:** A1 experimental navigation metadata, after GSA4 A0 physical extraction. No GSA MCP behavior, Harness/Skill delivery, tool schemas, authorization or repository write semantics are changed by this index.

**Machine-readable lookup:** [GSA4-A1-SOURCE-LOCATOR.json](./GSA4-A1-SOURCE-LOCATOR.json)

## How a Coding Agent uses the index

1. For a known MCP tool, look up its **exact tool name** in `tool_owners`; navigate to `owner` (the leaf with the real `server.registerTool` call), then inspect `facade` when composition, registration order or request wiring matters. The inventory is the same 58 public names as `test-lab/gsa1-tool-name-inventory.json`.
2. For work on runtime helpers, look up `helper_owners`. For a known error, start at `error_routes.owner`, but also inspect `related` producers/consumers if the failure is cross-module. An error emitter **is not necessarily the root cause**.
3. Read the actual owner source and relevant tests at the **current Git ref/blob SHA**. `basis_a0_merge` is provenance only, **not** an assertion that every symbol or file remains unchanged. On stale/ambiguous data, search current source, expand the dependency closure and record uncertainty.
4. If a task involves authorization, pending mutations, evidence verification, user/Human approval or Reviewer/Tester independence, read the authoritative runtime guard and required source/test context before editing. Missing permission or evidence means ASK/READ_MORE/STOP, never permission by omission.

## Boundaries and evidence

- **A1 is not A2:** This index selects GSA source locations. It does not select personal Project knowledge, construct Job/Task context packets, introduce a context router, filter Role policies, or implement source-code changes.
- **No observed performance claim:** The former 38.4% source-char reduction is a paper forecast dependent on agents unnecessarily opening the old large facade. Track actual index reads, source bytes/ranges, wrong-file opens, total lookup overhead and repair/retest iterations versus A0 without the locator before claiming a benefit.
- **Validation:** `test-lab/gsa4-a1-source-locator.test.cjs` checks all 58 tool owners, helper symbol owners, error routes, path validity and stale-pointer negative cases. Existing `gsa1-module-boundary` and `gsa4-integration-parity` remain the underlying code/registration parity oracles.
- **Maintainability:** Update the locator in the **same PR** whenever owning module, exported helper, error location or associated test path changes. The locator's stored paths are navigation hints, not independent source-of-truth.

**Baseline:** A0 merged into `upgrade/gsa-context-efficiency` at `6fbd5d8e55a0515ac03db9bb383764c10a5b6b86`. No `main` merge or production deployment is authorized by this document.
