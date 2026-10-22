# GSA M6 — Advisor receipt / CadGPT Criteria handoff

**Status (2026-10-22): Source FIX PRESENT / REAL-PROJECT RETEST PENDING.**
**Incident:** CadGPT Criteria approval was blocked by `ADVISOR_SCOPE_MISSING`, followed by `ADVISOR_RECEIPT_MISSING_STALE_OR_OUT_OF_SCOPE` despite Human advice/decision and a committed/read-back `CRITERIA.md`. This is a GSA Advisor–Planner receipt contract/integration incident, **not** a change to CadGPT product Criteria, GitHub connectivity, or a reason to ask Human to reapprove an unchanged decision.

## Verified repo/runtime checkpoint
- Source: `thebimhouseinfo-sudo/GPT-supper-agent`; checked both `main` (head `13cab1023d4db993c08394977961e85c5f902fce`) and `upgrade/gsa-refactor` (head `081a18493b45ac662773e0f1f7116e30ba2bd738`).
- Both have identical runtime `supabase/functions/gsa-mcp/index.ts` blob `fc7292477994c1520f66f34f73176ddeeb23ff96`. Production `gsa-mcp` **v50 ACTIVE** equals this source; refactor staging `gsa-mcp-refactor-stage` **v15 ACTIVE** also equals it.
- Fix commits in repository history: `9fe1b9dddc457e` (unify Advisor receipt writer/parser, accept existing Markdown); `1ccffd2d234c70` (Advisor harness and forged-text review assertions). Current source contains `formatAdvisorAdviceReceipt`, `parseAdvisorAdviceReceipts`, `projectCriteriaAdvisoryDecision` and `project_criteria_advice_check`. The parser accepts canonical one-line and the indented `ADVISOR SIGNED: ADVISED — ...` Markdown receipt with three named fields.
- Validator can derive baseline/scope from parsed receipt when caller omits them, returns specific missing/invalid/too-long/mismatch reasons, and never equates a structurally valid receipt with provenance, Human approval or permission to write.

## Retest / next chat
1. **Read actual CadGPT canonical `CRITERIA.md` and Git history**, confirm its one saved receipt, baseline SHA, delta scope, advice reference, prior real Advisor advice and Human decision. Do **not** rewrite or duplicate Criteria merely to satisfy formatting.
2. On connected deployed GSA, invoke `project_criteria_advice_check` for `INITIAL_APPROVAL` or `MATERIAL_CHANGE` as appropriate, using the current exact canonical file and content/SHA; omit optional baseline/scope if the existing receipt is well-formed. Record actual status and any error. A structural PASS should be `SCOPED_ADVICE_REQUIRES_INDEPENDENT_READBACK`, **not** `APPROVED`.
3. Verify Advisor provenance and Human approval independently, then let Planner finish authorized Criteria APPROVED write with GitHub SHA-CAS and readback; ensure subsequent Project Bootstrap proceeds. Negative tests: forged receipt or missing real advice must still DENY; unrelated discussion/draft/Plan does not awaken Advisor.
4. Record outcome against M6 actual-project acceptance; do not claim M6 PASS until the CadGPT path completes. No Criteria product change or new gate engine needed.

**Open finding:** The prior CadGPT reproduction has **not yet been demonstrated PASS with production v50** within this checkpoint. No source fix or deployment was performed by this handoff operation.

**Next-chat prompt:** `Tiếp tục GSA M6 theo docs/refactor/M6-ADVISOR-RECEIPT-HANDOFF.md; kiểm chứng lại phê duyệt CadGPT Criteria trên production v50, không đổi Criteria, báo PASS hoặc lỗi thực tế.`
