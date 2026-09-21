---
id: CANONICAL-DEFECT-CHANGE-LIST
version: 1
status: READY_FOR_APPLICATION
canonical: false
---

# Canonical Defect Change List v1

No new theory is introduced here. This file maps the known defects to targeted edits.

## C1 — Architecture fixed-flow diagram is stale

File: `docs/architecture/ARCHITECTURE-v0.1.md`  
Section: §3 Top-level architecture  
Current: diagram hard-codes Designer -> Design Review Gate -> Coder -> Execution Plan Audit.  
Change: replace fixed gates with dynamic Job/dependency/checkpoint flow referencing STATE-MACHINE-v1 and review Jobs.  
Reason: current canonical dynamic Review Topology already says review placement is contextual.  
Dependency: FA-1 + resolved P5/P7.

## C2 — Architecture invariants still imply universal pre-code gates

File: `docs/architecture/ARCHITECTURE-v0.1.md`  
Section: §13 Core invariants  
Current: Reviewer independently audits execution topology before code is written; UI coding may be blocked by fixed Design Review wording.  
Change: state that required review is determined by mechanical minimum triggers + dynamic review topology; independence-required checkpoints use fresh chats.  
Reason: remove fixed-gate contradiction.  
Dependency: STATE-MACHINE-v1.

## C3 — Project readiness section mixes fixed and dynamic gates

File: `docs/architecture/ARCHITECTURE-v0.1.md`  
Section: §12 Project readiness gate  
Change: reduce this section to readiness prerequisites and refer workflow/gate decisions to STATE-MACHINE-v1.  
Reason: one source of truth for transition/gate policy.

## C4 — Planner UI audit wording assumes fixed audit

File: `docs/architecture/PLANNER-SCOPE-AND-UIUX-v0.1.md`  
Section: §18 Reviewer UI audit and Execution Plan Audit references  
Change: make these review modes conditional checkpoints selected by the review topology / mechanical floor.  
Reason: remove fixed-flow contradiction.

## C5 — Universal final Job acceptance conflicts with direct workflow-based acceptance

Files:
- `docs/architecture/AGENT-HARNESSES-v0.1.md`
- `docs/architecture/EXECUTION-AND-REVIEW-v0.1.md`

Current: Final Job Acceptance is universal.  
Change: after FA-1, finite Jobs close according to their Job-type workflow, required review dependencies, and direct mechanical triggers. Do not introduce LOW/STANDARD/HIGH classes. Accepted outcomes use `PASS` or `PASS_RETEST_REQUIRED`; Project itself is never “complete”, only archived by the user.  
Reason: resolved P5/P7/P12 plus user decision removing work tiers.  
Dependency: FA-1 + STATE-MACHINE-v1.

## C6 — QA/QC vocabulary drift

Files:
- `docs/architecture/AGENT-HARNESSES-v0.1.md`
- `docs/architecture/SYSTEM-DEFINITION-SKELETON-v0.1.md`
- `docs/plans/IMPLEMENTATION-PLAN-v0.1.md`

Change: define canonical check families COMPLIANCE / CORRECTNESS / FIT. Keep QA and QC as umbrella terms only.  
Reason: resolved P9.

## C7 — Working notes overlap

Files: overlapping files under `docs/working-notes/`.  
Change: after accepted decisions are promoted, mark superseded notes with a pointer to canonical documents; do not delete historical debate immediately.  
Reason: one source of truth.  
Dependency: promotion pass.

## C8 — Implementation Plan filename/header version mismatch

File: `docs/plans/IMPLEMENTATION-PLAN-v0.1.md`  
Current: filename says v0.1, heading/content says v0.3.  
Change: either rename to `IMPLEMENTATION-PLAN-v0.3.md` and update references, or normalize the document version metadata. Recommended: rename to v0.3 during the post-FA consistency pass.  
Reason: version identity must be unambiguous.

## C9 — Invocation alias incorrectly frozen as product identity

Files:
- `docs/architecture/FROZEN-FOUNDATION-v0.1.md` F14
- `README.md`
- command references in plan/docs

Change: F14 defines a configurable/default alias table, not permanent product identity. Keep internal ids/signatures product-neutral.  
Reason: A5 / FA-3.  
Dependency: FA-3.

## C10 — IMPORTANT review severity undefined

Target: `REVIEWER-CONTRACT-v1.md` and any existing severity references.  
Change: define `IMPORTANT` as blocking unless explicitly waived by the owning user with recorded acknowledgement; Reviewer records the waiver and evidence limits.  
Reason: current vocabulary has no operational meaning.  
Dependency: Reviewer contract.

## C11 — Merge and deploy missing from completion model

Target:
- `DEFINITION-OF-DONE-v1.md`
- STATE-MACHINE-v1 event model
- relevant execution/review docs

Change: record `accepted`, `merged`, `deployed`, and `deployment_verified` as distinct facts/events. Merge requires explicit user instruction.  
Reason: resolved P12.

## C12 — Pre-topology review circularity

Target: STATE-MACHINE-v1 / Reviewer contract.  
Change: define mechanically triggered early review Jobs that can exist before a complete dynamic review topology. Topology may be refined later.  
Reason: mandatory safety checks cannot depend on a topology that does not yet exist.

## C13 — Stage A incorrectly marked COMPLETE

File: `docs/plans/IMPLEMENTATION-PLAN-v0.1.md`  
Section: Stage A  
Change: mark Stage A REOPENED/PENDING until FA consistency, fixed-gate cleanup, quality vocabulary, version mismatch, and completion-event defects are resolved.  
Reason: current repo still contains these stale contradictions.

## C14 — Old Job-as-container terminology will become invalid

Affected broadly:
- README
- Frozen Foundation
- Architecture
- Job Lifecycle
- Project Memory
- Skeleton
- Governance
- Agent Harnesses
- Execution & Review
- Implementation Plan

Change: only after FA-1 approval, replace the old durable Drive “Job” entity with “Project” according to the agreed mapping. Do not blind-search-replace finite Job work-unit references.  
Reason: A1.  
Dependency: FA-1.

## Application order

```text
approve FA-1 / FA-2 / FA-3
→ apply entity/alias foundation amendments
→ fix C1-C5 and C9/C14
→ draft STATE-MACHINE-v1
→ fix C6/C10-C12 against canonical contracts
→ repair version/reference bookkeeping
→ mark Stage A complete only after consistency re-check
```
