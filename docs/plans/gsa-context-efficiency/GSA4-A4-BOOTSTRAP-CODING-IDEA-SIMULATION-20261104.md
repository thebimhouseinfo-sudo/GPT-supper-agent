# GSA4 A4 — Multi-step Bootstrap, Coding, Update and Refactor simulation

**Experiment:** four workflow scenarios, **17 sequential events per FULL/A4 arm (34 source-function evaluations)**. Uses the actual `projectBootstrapChecklistDecision`, A2 Task context, A3 repair route and A4 selective Harness preview on evolving synthetic state. Changes to `selective-harness-preview.ts` reject a new Human idea even if a caller accidentally reuses the old `PRODUCT_DEFECT_REPAIR` workflow label; additional stale planning/cursor/source findings force full Harness. A4 remains **read-only and NOT wired** to production MCP runtime.

## Fixed oracles

| Scenario | Events and authority boundary |
| --- | --- |
| Bootstrap | Existing approved Criteria → ask Human once KEEP/UPDATE → Plan CRL → Milestones CRL → next-Task Coder/Tester capabilities → BOOTSTRAP_READY but source-write not authorized |
| Coding | Ordinary source implementation → known-bad defect → CI runner unavailable → independent Reviewer handoff. Only a narrow Coder product-defect repair may get the selective preview |
| New idea — material Update | Coder repairing existing Task → new Human WHAT/WHY idea → Plan change fence and STOP → Planner impact review → changed planning revision still needs independent PASS. Advisor only when actual Criteria finalization/change is intended |
| New idea — Refactor | Coder fixing defect → Human suggests refactor while old repair workflow label remains accidentally cached → A4 must restore full Harness → if outside approved Task, A2 blocks existing Job pending Plan change → Planner classification/review before new source writes |

Each step uses exactly the same Job/Run/Role state and A3 source/test candidate selection for FULL and A4. Cases assert original mandatory policy substrings and byte-identical full fallback on noneligible workflows; do not treat fixture fields as Git readback or Human approval. This is a **runtime-code simulation, not a model A/B trial**, and runs with no product edits or Git CAS writes. Any assert failure invalidates scenario PASS until repaired.

**Potential bug class addressed:** a new Human request can arrive while a Coder's previous repair Task and A3 reference packet remain available. A4 now supports an optional `human_message_kind` classification so `NEW_FEATURE`, `MATERIAL_UPDATE`, `REFACTOR`, `BOOTSTRAP` or `UNKNOWN` forces original Full Harness even when `workflow` still contains a stale repair label. If the caller does not pass a classification, A4 cannot prove intent and retains its prior preview behavior for compatibility; this must be treated as a limitation, not live safety evidence.

**Test runner:** `test-lab/gsa4-a4-workflow-simulation.test.cjs`, executed by existing Node regression, with one machine-readable `GSA4_A4_WORKFLOW_SIMULATION` summary line. Check GitHub Actions at the exact PR commit before interpreting results. Prior STOPCHAT simulation remains separate.

**Caveats:** no independent LLM responds to the user, no source changes occur, no actual External Advisor/Reviewer session, Host operations, checkpoint persistence or Git SHA verification. The A4 selector remains read-only; no new MCP tool or permission pathway is introduced. Model-facing semantic parity and real token savings remain UNVERIFIED.
