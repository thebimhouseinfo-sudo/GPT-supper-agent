export const debuggingSkill = {
    description: 'Optional Coder root-cause/call-chain debug for complex bugs or failed retests; not a role.',
    body: [
      '# Debugging — conditional Coder skill',
      'Load only for a reproducible nontrivial defect or failed hotfix retest; do not run for ordinary feature work.',
      '1. Record the exact user-visible failure, reproduction inputs, host/runtime revision, and deterministic versus intermittent behavior.',
      '2. Map the real path: user action → public tool/entrypoint → caller/router → target → downstream state/config/storage → process/connector/host → observed output.',
      '3. Inspect credible sibling/legacy paths and generated/cached registrations; classify plausible root causes with evidence, not guesses.',
      '4. Before editing, identify the smallest shared cause. If a prior hotfix retest still failed, stop incremental patches and expand the full failure-surface map first.',
      '5. Add a behavior oracle that detects the original fault: known-bad turns RED; intended behavior GREEN. Do not substitute mocks for the critical boundary.',
      '6. Patch within the active Job scope. Run relevant CI, executable call-chain simulation and lifecycle restart simulation where applicable.',
      '7. If a real host/connector is required, live acceptance remains UNVERIFIED until executed; a registered but unexposed tool is not passing behavior.',
      '8. Reviewer checks changed test validity at high-risk checkpoints, not every ordinary test run. Preserve exact SHA, limitations and follow-up.',
      'U-F IDENTITY: read back all existing Project Memory Run/Goal Recheck/TEST/RETEST and Handoff refs across Jobs and Chats; defect identity combines original actual error, user-visible symptom, frozen user trigger, original failing revision and first failure evidence. New title/Chat/Job never resets history; use retest-history.ts read-only reconstruction after independent evidence readback.',
      'U-F CYCLES: count only authorized exact-revision Coder patch plus Goal Recheck followed by a separate independent Tester original-trigger and affected-regression rerun with persisted exact-revision evidence-backed PRODUCT_FAILURE. Coder selftest/CI PASS never closes; unavailable Host stays UNVERIFIED. After third full FAIL STOP ordinary patch four, load this skill; evidenced race/architecture findings may escalate sooner.',
      'U-F CAUSAL REPORT: trace input to entrypoint to every child flow to wait/queue/state to tool/client/schema to Host/deployment to observable result. Find FIRST evidenced divergence (otherwise UNKNOWN). Report three exact attempts, scenario seeds, Tester refs, hypotheses/confidence/discriminating experiments, lowest-risk correction proposal, regression plan and unknowns. Persist only with existing authorized Project Memory CAS/readback; do not auto patch a fourth time or invent a Bug-Fixer Agent.',
    ].join('\n'),
  }
