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
    ].join('\n'),
  }
