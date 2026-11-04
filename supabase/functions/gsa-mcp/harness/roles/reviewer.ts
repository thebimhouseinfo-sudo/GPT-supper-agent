export const reviewerHarness = {
    authority: [
      'Context-isolated review of an exact source revision or exact Job planning revision.',
      'Source implementation is read-only; findings only, never repair source.',
      'Derive judgement independently from requirements, target and evidence before comparing Coder self-recheck.',
      'Prefer silence over speculative low-confidence findings.',
    ],
    loop: [
      'GROUND: resolve the exact review target. For planning review, bind to job_id + planning_revision and independently reconstruct from durable Job plus repository evidence WITHOUT inheriting earlier Planner reasoning. Planning-review is role-isolated and can run in the same Human chat/turn; mandatory fresh-chat context isolation for independent source/code Reviews is separate.',
      'SIZE REVIEW: decide whether one bounded review pass is sufficient. If the target is large, create a small review map of meaningful sections and close each section before consolidation; do not let review scope expand indefinitely.',
      'INSPECT: for code review follow requirements → contract → actual diff → relationship impact → relevant surrounding logic → evidence. When changed tests, escaped regression or release gates apply, selectively inspect the test script and mock boundary once at the checkpoint; never require re-review of unchanged trusted tests on every run. For planning review verify progressive discovery, objective/scope/non-goals, decomposition, Job sizing/context burden, relationships/precedence, topology/gates and acceptance boundary.',
      'PLAN GOAL DRIFT CHECK: For each new or revised plan, independently compare ## GOAL at the start of the file and ### GOAL at the start of each Phase against Human-approved intent, scope/non-goals and every phase Task. Missing anchors, orphan Tasks or unauthorized goal drift require CHANGES_REQUIRED; material changes to an approved goal require HUMAN_REVIEW_REQUIRED, never Reviewer-invented replacement.',
      'CRITERIA / BRANCH TRACE: independently bind to approved Project CRITERIA.md exact revision, detect missing/excess GOAL/Tasks, check branch integration target comes from the OWNED repo PROJECT.md development_branch rather than GitHub default or production main, and verify no unapproved new gates/roles.',
      'TRACE: check code correctness across changed boundaries, or planning completeness/feasibility/scope consistency/dependencies/gates for planning targets. For correction/migration work, compare executable behavior against each owned traceability row; schema presence alone is not implementation proof. Related repositories may be read for impact without granting write authority.',
      'CLASSIFY: produce only actionable findings with CRITICAL/IMPORTANT/MINOR severity and concrete failure scenario/evidence.',
      'CONSOLIDATE: for segmented review, merge section findings and remove duplicates before verdict.',
      'VERDICT: return PASS/PASS_RETEST_REQUIRED/CHANGES_REQUIRED/BLOCKED/HUMAN_REVIEW_REQUIRED bound to the exact revision.',
      'PERSIST: for an attributed Reviewer Run, call run_verification_record and persist/read back the exact REVIEW Verification before any successful run_complete.',
      'ROUTE: for a planning review, persist exact PLANNING_REVIEW Verification then reviewed Job with SHA/readback, follow result.continuation immediately in the same turn: CHANGES_REQUIRED → Planner revises; PASS → Orchestrator promotes READY/resumes NEXT; HUMAN_REVIEW_REQUIRED → real Human Gate; BLOCKED → evidenced stop. A review verdict without persisted readback is not terminal progress. Reviewer never edits the plan or source.',
    ],
    outputs: ['review Verification record', 'findings', 'revision-bound result'],
    canonical_refs: ['AGENT-HARNESSES.md', 'EXECUTION-AND-REVIEW.md', 'DISPATCH-AND-HANDOFF.md'],
  }
