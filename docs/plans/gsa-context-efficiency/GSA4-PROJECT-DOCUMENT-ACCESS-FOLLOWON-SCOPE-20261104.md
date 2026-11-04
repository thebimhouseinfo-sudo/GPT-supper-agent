# GSA4 — Follow-on scope: Project document structure and role-based reading

**Status:** RESEARCH BACKLOG ONLY — not a document restructuring decision, no application code changes, no new Context routing implementation, no simulation/measurement PASS.  
**Human direction:** 2026-11-04: **Group 1 and Group 2 first.** Group 3 is project documentation, not runtime source. Later establish a reusable document taxonomy and exactly which role reads which authoritative document; do not let other GSA-managed projects accumulate one enormous Plan/Criteria/knowledge file without deliberate ownership and progressive context.  
**Parent:** [GSA4-RESEARCH-PLAN.md](./GSA4-RESEARCH-PLAN.md).

## 1. Three distinct research objects

| Group | Examples | Reader / desired outcome | Current priority |
| --- | --- | --- | --- |
| **1 — GSA Agent operating guidance** | `harness-catalog.ts` contents, `docs/architecture/AGENT-HARNESSES.md`, `docs/architecture/EXECUTION-AND-REVIEW.md`, `skills/gsa-job-runtime/SKILL.md` | Each GSA role receives/opens only correct governing instruction/Skill subsections. Preserve required authority/guards. | **FIRST** |
| **2 — GSA runtime product source** | `supabase/functions/gsa-mcp/index.ts`, `run-execution-tools.ts`, `project-setup-tools.ts`, `checkpoint-tools.ts`, `selftest.ts` | Coding/testing Agent developing **GSA itself** navigates cohesive modules with fewer irrelevant source reads. Preserve import/API parity. | **SECOND** |
| **3 — Per-Project planning and delivery records** | Criteria, Project Plan, Milestones, Job/Task/Run, Decisions, handoff, evidence, product knowledge, user artifacts, logs and historical research plans | Define **template/taxonomy** and **role/document reading obligations** across *other projects*, avoiding accidental all-doc loads. This is not GSA runtime source and not the first-stage source-split study. | **LATER**, after Groups 1–2 are understood/split and verified |

A GSA repository file can be a **source of operating policy** (Group 1) rather than a per-Project delivery artifact (Group 3). Classify by responsibility/reader, not just extension `.md` vs `.ts`.

## 2. Hypothesis: Goal-first handoff, not full Criteria for every role

**Research hypothesis from Human:** a **Coder implementing an already-approved Task** may not need to reopen the *whole* Criteria or Overall Plan. The Coder should consume the **exact approved Task/Goal**, completion criteria, constraints and relevant implementation references. Planner is responsible for correctly propagating governing requirements into that Task. A Coder must *not* infer permission or omit important requirements because a document was shortened.

Suggested minimal **Task execution packet** (logical shape, not a new schema yet):

```text
Project / repository / target branch identity
Exact Job / Task / planning revision and owning Goal
Relevant approved completion/acceptance criteria
Constraints / invariants / security / non-goals applicable to this Task
Required skills / targeted source paths or search references
Expected evidence, review/test requirements and authoritative refs for escalation
```

If this packet is incomplete, contradictory, stale, or expands scope, the Coder must **stop or escalate to Planner** and read only the relevant missing authoritative section; never blindly ignore Criteria, guess scope or edit a Human-approved governing rule. Direct Agent without an approved packet requires its own bounded scope confirmation.

## 3. Proposed role/document read matrix — TEST CANDIDATE, not runtime policy

Legend: **O** = typically owning/editing and must consult current revision; **D** = default target input; **C** = conditional, read relevant section on trigger; **—** = not normally necessary. All rows retain mandatory access/authorization/evidence checks.

| Document / record | Orchestrator | Planner | Advisor | Designer | Coder | Reviewer | Tester |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project identity/branch/scope | D | D | C | C | D | D | D |
| Approved Criteria (full) | C | O | D for consultation | C | **— if Task packet complete** | C (planning/scope audit) | C (product-level acceptance) |
| Current Overall Plan | C | O | C | C | **— if Task packet complete** | C (plan review) | — |
| Exact approved Job/Task/Goal + acceptance | D | O | C | D | **D** | **D** | **D** |
| Role-specific implementation design/source references | C | C | C on architecture consultation | D | D | D as needed | C |
| Current source revision / changed files / diff | C | C | — by proposed narrower Advisor contract | C | D | **D** | D for tested revision |
| Test cases / evidence / verification records | C | C | — | C | D where relevant | **D** | **D** |
| Historical decisions / lessons / unrelated Jobs | C when resuming | C for impact | C if specifically relevant | C | C on trigger | C on trigger | C on trigger |

This matrix must be checked against the approved **existing** GSA role contracts. In particular, Advisor currently has a selective source-read permission, whereas Human has proposed a proposal-focused boundary. Treat the difference as an explicit design question, **not** a stealth policy change.

**Reviewer independence:** the Reviewer always reconstructs the exact target/revision and evidence independently. It may need more governing source than Coder to verify scope, and planning Reviewer normally needs relevant Criteria/Overall Goal. **Tester** must obtain the oracle relevant to its tested behavior (Task acceptance or product-level Criteria) and must not derive expected behavior from implementation alone.

## 4. Later document-organizing alternatives (do not choose yet)

- **P-A: Parent index + cohesive topic leaves.** One authoritative Criteria/Plan entry document with compact goal/scope/index, linked phase/job/decision details; avoid tiny fragments and duplicate normative sources.
- **P-B: Role-targeted view over canonical records.** No second authoritative copy; generate a narrow Task/Goal packet with exact revision refs that Planner/Reviewer can trace back to the approved source.
- **P-C: Section navigation without physical splitting.** Keep a cohesive existing document, use headings/anchors or line-range retrieval where source access supports it.
- **P-D: KEEP** when full-document reading is legitimately required or splitting increases inconsistency.

Compare on the four fixed User journeys (Bootstrap, Continue Code, Test→Fix→Retest, New Feature), plus scope/Criteria changes, Direct Agent with incomplete scope, conflicting revisions, and independent Reviewer/Tester. Freeze user-derived expected results before checking actual doc links. Report source-navigation chars, file/range reads and hop count separately from Harness payload, with actual project-specific documents **excluded from early Group 1–2 savings accounting**.

## 5. Exit criteria for this later study

1. A canonical document taxonomy/ownership specification (criteria vs planning vs task execution vs evidence vs historical/reference).
2. Reviewed role-to-document matrix showing **required / optional / prohibited/irrelevant** under each Task state.
3. Evidence that Coder can correctly complete the Goal without routinely reading the full Criteria **when the approved Task packet is sufficient**, and safe fallback when it is not.
4. No loss of Criteria traceability, approval scope, security invariants, independent Reviewer/Tester, or accurate bug classification.
5. Measured/explicitly simulated navigation and context costs on equivalent tasks; retain KEEP where simpler.

**Next action now:** Continue Group 1 + Group 2 A/B source-splitting research and parity design. Do **not** perform this Group 3 study yet.
