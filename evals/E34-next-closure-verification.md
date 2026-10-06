# E34 — NEXT closure, durable verification, UI specialization

Target: P2 correction branch.

## Goal Recheck
1. Exact current Task criteria with task_id for every criterion → ALLOW.
2. Missing approved criterion → REJECT.
3. Extra/duplicate/wrong-task criterion → REJECT.
4. Stale Job planning revision or mismatched target revision → REJECT.
5. V2_STABLE remains on the legacy Goal Recheck path.

## Reviewer / Tester Verification
1. Reviewer PASS requires a persisted exact Run-bound REVIEW Verification.
2. Non-checkpoint Tester PASS requires a persisted exact Run-bound TEST Verification.
3. Bare verification path without exact durable snapshot → REJECT.
4. Wrong run, role, planning revision, target revision, or result → REJECT.
5. Successful Reviewer/Tester Verification requires evidence refs.

## Job closure coverage
1. Every Reviewer/Tester Task in current NEXT topology has one selected successful current-revision Run plus matching REVIEW/TEST Verification → ALLOW.
2. Missing Reviewer or Tester Verification → REJECT.
3. Stale/mismatched Run or Verification → REJECT.
4. Selected Run and Verification paths must be present in completion_evidence_refs.
5. V2_STABLE ignores the P2 closure coverage gate.

## UI Coder specialization
1. Task required_skills=[ui-coder-frontend] + skill not loaded → REJECT dispatch.
2. Same Task + skill loaded → ALLOW when all other P1 guards pass.
3. Generic Coder Task required_skills=[] → unchanged.
4. ui-coder-frontend remains opt-in, never a default Coder skill.
