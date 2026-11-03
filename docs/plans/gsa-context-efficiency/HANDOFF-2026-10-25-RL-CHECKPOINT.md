# GSA Context Efficiency + Bootstrap Upgrade — RL checkpoint / new-chat handoff

## GOAL

Resume the real GSA context-efficiency and Bootstrap-function upgrade without repeating a completed review, losing the architecture decisions, claiming implementation that did not happen, or switching to production. This is a documentation checkpoint only.

**Saved:** 2026-10-25, Asia/Ho_Chi_Minh.
**Repository:** `thebimhouseinfo-sudo/GPT-supper-agent`
**Development branch:** `upgrade/gsa-context-efficiency`
**Last observed development HEAD before saving:** `5d28f2867cd641d22c230fb8e25c2aa3e9895dc4` (checkpoint commit will advance it).
**Main observed HEAD:** `2ae052b57241bb845234235767b3dcb767030c70` — DO NOT MERGE OR DEPLOY without explicit Human approval.

## Canonical live documents (read these first)

1. `docs/plans/gsa-context-efficiency/DETAIL-PLAN.md` — blob `60a3fe41362e47c2fb20fc7b0665b8f978c9a3a3`.
2. `docs/plans/gsa-context-efficiency/TECHNICAL-DETAIL-PROPOSAL.md` — blob `be5e6f86fe8881cbcd6634dfc1c6bedf3ae0517c`.
3. `docs/plans/gsa-context-efficiency/TECHNICAL-DETAIL-REVIEW.md` — blob `cde0a9afff4958fc56daccc82192f18d8979f333`.
4. Actual GSA source `supabase/functions/gsa-mcp/index.ts` — blob `448355e9a129db45d836c0f86915396fb060514c`, still 9,777 lines; source was **not** changed by this document/review work.
5. Bootstrap v7 upstream draft: `thebimhouseinfo-sudo/bootstrap/docs/refactor/CONTEXT_OPTIMIZATION_REFACTOR_PLAN_DRAFT.md`. Draft is a functional source reference, not independent proof of approved GSA implementation.

Always re-fetch current branch and SHA before edits; above are historical checkpoint identities, not permission to ignore later commits.

## ACTUAL STATUS — RL reached document-design PASS

- **Cycle 1:** `CHANGES_REQUIRED` for incomplete helper ownership, shared-contract cycles, registration/callback dependency loops, 28 unassigned constants, oversized entrypoint diagnostics, and schema/registration order risks.
- **Planner correction:** technical proposal now maps **55/55 MCP tool registrations**, **98/98 top-level functions** and **28/28 top-level uppercase constants/schemas** each to exactly one module. It groups Project and Bootstrap together in `project.ts` when reciprocal calls require it; introduces a cohesive lower-level `records.ts` for durable contracts/path/snapshot validators; isolates the approximately 932-line selftest into diagnostics. Proposed module boundaries are source-grounded yet still subject to actual typed import/closure verification.
- **Cycle 2:** `TECHNICAL-DETAIL-REVIEW.md` explicitly records **PASS — Technical Proposal design scope** for that pinned proposal, source coverage and reviewed alternatives; it expressly says this is an **ephemeral Direct Agent/source-grounded document review**, **NOT** a durable `plan_review_record` receipt and **NOT** code/CI/runtime acceptance.
- **Not done:** CT-00 meter implementation, GSA1 modularization, live isolated MCP pair, technical code build/typecheck/CI after module extraction, real-context measurements, comparison feature-branch creation/cleanup, main merge/deploy.
- **Important correction to older chat summaries:** RL is **NOT currently blocked on CHANGES_REQUIRED**; the latest live review reports design-document PASS. Avoid creating an unnecessary repeat of the same design review unless the source/proposal materially changes.

## Stable Human decisions

- **GSA0** is initial unmodified context/read-behavior baseline.
- **GSA1** is **mandatory architectural modularization**: make `index.ts` a thin entrypoint / tool+route composition map; group modules by functions read/called/edited/tested together, neither too fine nor too coarse. Move one cohesive group at a time, link imports/exports from real entrypoints, verify no tool/function lost and no externally observable behavior/security difference. **KEEP GSA1 after functional parity, even if observed time/context gets worse**; continue to improve module grouping from measured workloads.
- **GSA2** is a reversible experiment to remove only actually redundant model-delivered Harness/startup instructions.
- **GSA3** is a reversible experiment to reduce proven GSA Tool/Skill response excess; `get_skill_catalog` already offers descriptors and `load_skill` already full-body-on-demand, so do not reinvent that.
- **GSA4** is a reversible experiment to scope guidance by Role/Task/Phase only when there is a **trusted real caller/input**; existing `get_agent_harness` has only role/mode. If no opportunity, NO_BUILD; do not create another context authority or fake data layer.
- First implement a **small context and source-navigation measurement tool** (bytes/token proxy/tool calls plus source opened/read/search/hops); true ChatGPT token usage cannot be observed exactly. Real-world measured impact matters, not aesthetic file structure.
- Bootstrap-derived functional upgrade Jobs must be substantive; do **not** split into micro-jobs for the meter. Each context version is evaluated by doing the **same full Bootstrap Job Pack** through retained and candidate GSA independently.
- Each comparison milestone creates **exactly TWO auxiliary feature-output Git branches** from the same feature source SHA (CONTROL and CANDIDATE), and records actual branch names and GSA runner source SHAs in milestone. After comparing implementations choose/integrate **better code** independently of context winner, then **delete inferior auxiliary branch** after verified integration/readback. Correctness first; dirty candidate-bug runs get INVALID context measurements. If no new Pack remains, repeat last full Pack safely. No third auxiliary branch for tests.
- GSA2+ candidate KEEP/REVERT against last retained winner, rolling baseline. A rejected candidate's context changes do not contaminate the next, and unrelated successful Bootstrap feature code stays.
- Never conflate Git source branches with runnable MCP client versions. Isolated source-pinned candidate endpoint and true Git branch-ref deletion capability remain **UNVERIFIED** until demonstrated. A file deletion action is not Git branch deletion.
- Preserve approved Criteria authority. Existing approved Criteria has a narrower research-first scope; a proposed meter-first/new-feature implementation needs normal Human/Advisor Criteria alignment if substantive WHAT/WHY changes are required. No arbitrary new gates and no self-authorized Criteria edit.
- **User only requested RL and now checkpoint/handoff**; do not treat this as authorization for application code edits, merge or deployment.

## NEXT RESPONSIBLE ACTIONS (new chat)

1. Read the three live documents, check branch/head and note the latest `RL Final Verdict — PASS (Technical Proposal design scope)`. Report review completion honestly (independent durable Reviewer receipt not claimed).
2. Planner can turn the reviewed architecture into executable **GSA1 source-migration tasks and milestones** and preserve the single integrated source plan (not parallel new plan), identifying real module import dependencies and the exact per-group rollback/parity tests. Do not re-review a passed unchanged document merely due to chat handoff.
3. Confirm outstanding actual tool/runtime capabilities **when needed for execution**, not as a paper-only blocker: isolated GSA0/GSA1 runtimes and branch-ref deletion/readback. Build/source test and real timing/context measurement will follow separate authorized code work.
4. Keep user informed of conflicts with approved Criteria BEFORE implementing. Do not activate Technical Advisor for ordinary technical-design review; use approved Criteria-change sequence only when material scope update has been requested/authorized.
5. Stop at explicit Human execution approval. No source changes or main merge/deploy from this checkpoint.

## Suggested user prompt for fresh ChatGPT session

> Tiếp tục GSA trên branch `upgrade/gsa-context-efficiency`. Đọc checkpoint `docs/plans/gsa-context-efficiency/HANDOFF-2026-10-25-RL-CHECKPOINT.md`, `TECHNICAL-DETAIL-PROPOSAL.md`, `TECHNICAL-DETAIL-REVIEW.md` và `DETAIL-PLAN.md`. RL technical proposal đã PASS ở phạm vi design tài liệu (không phải runtime PASS); đừng review lại từ đầu. GSA1 là modularization bắt buộc, GSA2–GSA4 là các gói giảm context KEEP/REVERT. Tiếp tục Planner chuẩn hóa milestone/Task triển khai theo proposal đã review, giữ chính xác phương pháp 2 branch phụ so sánh cùng Job Pack và rolling baseline. Kiểm tra trạng thái GitHub mới nhất; không tự sửa code ứng dụng, thay Criteria, merge hay deploy nếu tôi chưa yêu cầu.
