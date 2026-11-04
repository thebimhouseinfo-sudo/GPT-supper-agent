# GSA4 — A4 Full Harness review of outstanding Update packs

**Review date:** 2026-11-04. **Mode:** DIRECT_AGENT, **REVIEW ONLY**; do not trigger A4 Coder repair-only abbreviation.  
**Current development:** `upgrade/gsa-context-efficiency` @ `fb5b2427cba5908963a198b154345c775321b635`.  
**Current A4:** `supabase/functions/gsa-mcp/selective-harness-preview.ts`, as merged in PR #55; a `MATERIAL_UPDATE` or `REFACTOR` message selects the **complete original Harness**, not the small `SELECTIVE_REPAIR_PREVIEW`. A4 is not wired into runtime: this review applies the actual source-visible full policy but does **not** claim an independent LLM/Reviewer execution.

## Scope and discovery

- Enumerated **all open pull requests** from the GitHub API on review date: [#34](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/34), [#38](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/38) and [#40](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/pull/40). #34/#38 are **DRAFT benchmark candidates**; #40 is a legacy `main`→development sync request. None is presently mergeable.
- Compared `upgrade/cp0-compat` through `upgrade/cp7-final-integration`, and the older `upgrade/gsa-next`, `upgrade/gsa-refactor`, `upgrade/gsa-reliability` and `upgrade/planner-evidence-context-efficiency` against development. These are old parallel/update branches; branch existence **does not** imply an unmerged code delta.
- Source-level inspection used the current A0 leaf modules and original branch files; past CI runs and eval documents were consulted as evidence **of their dated snapshot only**, not proof of current integration or production parity.
- Review is **not** an approval to change Criteria, create/replace a Job, rebase, merge, deploy or apply source updates. No production change is proposed automatically.

## 1. Pack disposition

| Pack | Git comparison vs development HEAD | Source-based status | Recommendation |
| --- | --- | --- | --- |
| **CP0** `upgrade/cp0-compat` | BEHIND: 0 ahead / 823 behind | No unique branch commits to port | **ARCHIVE/KEEP HISTORY**; no merge |
| **CP1** `upgrade/cp1-lessons` | DIVERGED: 6 ahead / 822 behind | Old lesson ownership/docs. Current `GSA-WORKFLOW-LESSONS-LEDGER.md` exists and is much newer; no evidence that old docs must replace current policy | **RECONCILE LESSONS ONLY**, line-by-line if an unresolved item remains; do not overwrite newer Harness/architecture |
| **CP2** `upgrade/cp2-ui-coder` | DIVERGED: 4 ahead / 821 behind | `docs/architecture/CODER-UIUX-HARNESS.md` at CP2 is **blob-identical to development**; UI skill `ui-coder-frontend` exists in A0 module catalog. Old runtime edits were made in pre-A0 monolithic `index.ts` | **ALREADY COVERED FOR DOCUMENT/SPECIALIZATION**; only verify any specific runtime behavior claim with current module tests |
| **CP3** `upgrade/cp3-tester-semantics` | DIVERGED: 6 ahead / 820 behind | `evals/E27-tester-semantics.md` is **blob-identical**. Current `harness/roles/tester.ts` explicitly classifies PRODUCT/TEST/ENVIRONMENT/NOT_READY/INTEGRATION/SPEC/PLAN failures, with CHECKPOINT claim and RETEST semantics | **SEMANTICS PRESENT**, do not merge the old `index.ts` implementation; independently check uncovered Host Tester scenarios |
| **CP4** `upgrade/cp4-evidence-planning` | DIVERGED: 11 ahead / 819 behind | `evals/E28-planner-evidence-checkpoints.md` is **blob-identical**. Current `planning-schemas.ts` and `planning-preflight.ts` define/validate EvidenceNeed, checkpoint and evidence requirement relationships | **SEMANTICS PRESENT**, use current planning regression tests; no old monolithic runtime merge |
| **CP5** `upgrade/cp5-checkpoint-runtime` | DIVERGED: 40 ahead / 818 behind | Current `checkpoint/claim.ts` and `checkpoint/verification-gate.ts` register claim/verification gate tools and apply lease/token/target checks. Current E29 is not byte-identical to its older CP5 version (later amendments exist) | **PRESENT WITH LATER CHANGES**; compare any claimed missing E29 case by current tool/test semantics before surgical port |
| **CP6** `upgrade/cp6-evidence-handoff` | BEHIND: 0 ahead / 760 behind | No unique branch commits | **NO REPLAY** |
| **CP7** `upgrade/cp7-final-integration` | BEHIND: 0 ahead / 748 behind | No unique branch commits | **NO REPLAY** |

Other historical upgrade branches `gsa-next`, `gsa-refactor`, `gsa-reliability`, `planner-evidence-context-efficiency` all compare **BEHIND** with zero unique commits; they are **not pending patches**. Earlier A0/A1/A2/A3/A4 feature/experiment branches may remain listed after PR merges; branch enumeration alone must not be treated as unmerged work.

## 2. Open PR findings and required action

### PR #34 — M-02 U-B scope-wide Plan supersession (candidate)

**Status: HOLD — substantive unmerged feature, separate review/port required.**

- Source delta is real and absent from development: candidate adds `scope_change_context` to `job_prepare`, introduces a reviewed multi-Job `scope_change` contract in `plan-change-decisions.ts`/`plan-change-tools.ts`, changes RETIRED task/milestone treatment in `job-transition-tool.ts`, and fences delayed Run closure in old `run-execution-tools.ts`. Current `job-prepare-tool.ts` and `plan-change-decisions.ts` do **not** contain `scope_change_context` / `scope_supersession_id`.
- Historical PR CI run [41649350488](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41649350488) was SUCCESS **for that old PR SHA**. It is not a fresh pass on development A4/A0 modules. Current PR API reports `mergeable=false`.
- **Risk:** scope-wide supersession touches reviewed Human intent, complete Project/Plan Job inventory, active Run/cursor reconciliation, deterministic successor IDs, historical PASS/evidence inheritance and exact Git/Memory readback. Candidate guards include caller-supplied retired Job snapshots and paths; do not treat them as independently read-back authority.
- **Required before implementation:** Human-reviewed change scope and Plan approval if this is to become product functionality, explicit merge target, current source-owner readback, source-port map to actual A0 modules, exact-SHA inventory/partial-failure recovery negative tests, checker for surviving unaffected completed work, independently observed Tester/Reviewer behavior. Re-run all current 58-tool parity and NEXT regression on the rebased work. No blind cherry-pick of monolithic `run-execution-tools.ts`.

### PR #38 — M-03 U-C engineering context and user-owned operational artifacts (candidate)

**Status: PROMISING, BUT HOLD — Skill-source port and domain ownership clarification needed.**

- Adds instructions for engineering HOW vs unresolved domain/host operational decisions, and DEV-source vs Human-owned operational deliverables such as `JOB.md`, LISP/Python, DWG/DOCX/etc. The candidate inserts these into the old large `harness-catalog.ts` `coding-loop` Skill and adds three tool-payload tests.
- Current code has physically extracted `harness/skills/coding-loop.ts`; the exact **`ENGINEERING CONTEXT / SOLUTION CLARIFICATION`** and **`OPERATION Human-owned`** sections are not present there. **This is meaningful missing content**, not a redundant pack.
- **Important boundary:** an operational artifact does not automatically become exempt from user/Host folder permissions or approved source-write scope. Do not let a DEV-vs-OPERATION description bypass GSA Project/Job/CAS guards for truly durable project-owned files. Verify ownership and actual target runtime: user-owned local DWG/LISP workflow is different from modifying GSA source or Project Memory.
- **Required:** copy/port literal approved candidate wording to current **leaf Skill** only after checking exact operational meaning; preserve default Role payload, auth, skill registration, 11-Skill inventory, existing A4 fallback; add tests for both “no spurious internal identity requirements” and “no bypass of Project scope”. Past PR CI [41678556295](https://github.com/thebimhouseinfo-sudo/GPT-supper-agent/actions/runs/41678556295) passed on old PR SHA, not on new module topology. No auto-merge.

### PR #40 — stale main→development sync

**Status: DO NOT MERGE whole PR.**

- It targets development from old `main`; current API reports not mergeable. Its visible patch modifies only `docs/process/GSA-WORKFLOW-LESSONS-LEDGER.md`.
- Noteworthy **missing candidate**: AssetGen brownfield Bootstrap incident (`PLAN_CRITERIA_MISMATCH`, `BOOTSTRAP_REQUIRED`, source-to-Memory Criteria binding), proposed as **LLC61**. Current development ledger has WL-034 (Task ID) and WL-035 (brownfield Bootstrap), but **no AssetGen incident / LLC61**. This is a process-evidence candidate, **not a proven root cause**.
- **Concrete conflict:** PR #40 introduces an additional **`WL-034`** number while current development already has a different WL-034. Do not duplicate the ID or replace current facts. Import the incident as a newly numbered, non-authoritative *candidate* after verifying the original real evidence and actual bootstrap code, preserving the current ledger and any later canonical Bootstrap behavior.
- No source write or permission bypass is justified merely because an older incident once returned a Bootstrap error.

## 3. Review gates under latest A4 Full Harness

For **UPDATE / REFACTOR** work the current A4 selector must return original **FULL** Harness; do not reuse Coder's narrow `PRODUCT_DEFECT_REPAIR` preview. Treat a stale/absent Human-message classification as reason for FULL fallback. This review checked the current A4 source; it did not make a live model selector invocation.

All candidate updates must satisfy:

1. **Scope & Human:** distinguish a question, a lesson, an improvement proposal and approved implementation; confirmed Human execution approval is needed before new product source changes. Do not assume old PR existence is approval.
2. **Source:** locate current exact leaf owner via A1, verify branch/Blob SHA, read upstream callers with A3 for cross-module concerns; no overwrite of current `index.ts` or `harness-catalog.ts` based on pre-A0 paths.
3. **Planning:** a new material idea triggers current LLC58 impact analysis and reviewed Plan-change process; maintain affected/unaffected Job/Task provenance, do not reset completed evidence or invent a replacement Job.
4. **Safety:** deny/unknown write is a boundary. Keep Reviewer/Tester independence, Project scope, SHA-CAS and no false Host PASS.
5. **Evidence:** no current-HEAD CI was run against any unmerged candidate in this review. Old PR green statuses are historical evidence only. Do not claim deterministic or live Agent parity for any proposed port.

## 4. Prioritized next actions (not performed in this review)

1. **PR #38:** create a narrowly scoped Skill-text port on a new branch from latest development for Human approval; preserve operational artifact permission distinctions; run exact source-bound Role/Skill and policy negative tests.
2. **PR #34:** do a source-grounded technical proposal for multi-Job scope-change and an A0 owner/execution contract matrix, then independently approve the updated product Plan before porting. Highest risk, do not merge draft.
3. **PR #40:** harvest only the AssetGen Bootstrap incident as a uniquely numbered candidate lesson; verify original readback/evidence and reproduce with current Bootstrap validator. Keep PR #40 unmerged/close only after intentional human review.
4. **CP1–CP5:** mark legacy packs as historical/superseded *for merge planning*, do not delete their branches. Open a new small issue/PR **only for a demonstrated missing, current-source requirement**, rather than cherry-pick old `index.ts`.
5. **Optional:** stage a clean updated integration plan with precise PR ownership and independent 58-Tool + Node/Deno/Host testing. No main merge/deploy.

**Disposition:** `REVIEW_COMPLETED / NO_SOURCE_MUTATION / NO_AUTOMATIC_MERGE`. This document is a review record, not a new Runtime/Criteria/Job authorization.
