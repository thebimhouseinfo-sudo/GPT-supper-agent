# GSA4 A2 — Read-only Agent × Job × Task Context Recipe

**State:** Experimental, source-executed pure function; **not** a new MCP tool, scheduler, authorization gate, approval record or runtime instruction filter. **A0/A1 source base:** `1476e8c6597ede29a690a730ae5e6886d8485704`.

**Source:** `supabase/functions/gsa-mcp/task-context-recipe.ts`, exported `buildTaskContextRecipe(input)`.

## Existing GSA fields consumed

- **Current Job:** `kind/job_id/project_id/execution_contract/lifecycle/planning_revision/planning_review/tasks/topology/planning_context/repository_context/criteria_binding`. A context packet cannot prove that supplied bytes were fetched from the configured Memory Repo.
- **Task:** exact `task_id`, `objective`, `scope`, `dependencies`, `completion_criteria`, `required_skills`, `lifecycle`; no guessed capability from task title.
- **Run when present:** `project_id/job_id/role/primary_task_id/planning_revision/lifecycle`. Mismatch produces STOP; missing Run requires fresh dispatch/readback before execution.
- **Role:** from the existing 8-Role `ROLE_HARNESSES` catalog; suggestions from current `ROLE_SKILLS`, actual bodies remain in `RUNTIME_SKILLS` and are loaded via current APIs only when relevant.
- **A1 source-owner candidates:** optional `tool_names` matched against the existing A1 58-tool locator. The caller must independently verify exact current locator/source Git ref before using pointers.
- **Project Knowledge:** optional existing `projects/<project_id>/KNOWLEDGE/` record candidates with exact SHA/current validity; these are **READBACK_REQUIRED**, never automatically trusted because a caller supplied them.

## Output

`{ schema, advisory_only:true, execution_authorized:false, decision, identity, work_position, task_context, required_reads, knowledge_candidates, skills, source_candidates, findings, handoff }`.

`decision` is `STOP`, `READ_MORE` or `REVIEW_REFERENCES`. **`REVIEW_REFERENCES` never means READY_TO_WRITE**; current GSA Human approval, M5/Scope, authorization, Git readback and independent Tester/Reviewer checks still apply.

A2 returns canonical references and missing-information triggers instead of a copied Project Criteria or a shortened Shared Harness. Role=Coder with backend Task and Role=Coder with UI Task yield distinct scope/acceptance, suggested skills and relevant source owner candidates while keeping the same underlying Coder authority.

## Proven limitations and guardrails

1. **The Job Task schema currently declares only `ui-coder-frontend` via `required_skills`.** A2 does not generalize this enum; unexpected declared Skill names trigger READ_MORE, and `run_begin.required_skill_contexts` remains the authoritative injection path. A Role suggestion is **not** an authorization.
2. **Project-specific CAD/AutoLISP, UI or domain add-ins are lower-trust paths.** A2 never asserts domain capability based on a flag or path; `project_role_addins_resolve` and independent actual SHA/functional Verification readback are still required.
3. **No product routing change yet:** this pure function is intentionally not registered as MCP Tool #59, injected into `get_agent_harness`, or called automatically from `run_begin`. Those choices require separate bounded API/authorization/latency and compatibility testing. Current 58-tool inventory and output shapes remain unchanged.
4. **Staleness and independence:** stale Job SHA, wrong Task, wrong Run, missing topology, absent Knowledge provenance or stale source locator produce explicit READ_MORE/STOP. Reviewer/Tester reconstruct requirements and oracle themselves.
5. **No token or repair-speed savings claimed.** A2's source-executed unit tests verify selection and fail-closed conditions; they cannot prove model-context savings until actual read traces and CT-00/Host observations.

## Verification

`test-lab/gsa4-a2-task-context.test.cjs` source-executes the new TypeScript helper with the **real A0 Role/Skill catalog** and checks two distinct Coder Tasks, stale Job/Run, unsupported Task Skills, Project domain add-ins, Knowledge provenance, stale A1 tool owner, Critic Human authorization and non-mutating behavior. Included in the existing GSA NEXT Node CI.

Next experiment: independently compare the same real Job Task/review/test scenarios with **A1 owner navigation alone** versus **A1 + A2 recipe**; log additional locator calls, actual text loaded, correct first owner, missing-information flags and repair/retest outcomes. Keep the A2 code behind an explicit experimental caller until the comparison supports integration.
