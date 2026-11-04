export const debuggingSkill = {
    description: 'Optional Coder root-cause/call-chain debug for complex bugs or failed retests; not a role.',
    body: [
      '# Debugging — conditional Coder skill',
      'Load only for a reproducible nontrivial defect or failed hotfix retest; do not run for ordinary feature work.',
      '1. Record the actual fault, user-visible symptom, exact ORIGINAL user-trigger reproduction, original failing revision and immutable first failure Verification ref. Treat that tuple as defect identity; Job, Chat and bug title are NOT identity.',
      '1a. Read back existing Project Memory RUN/GOAL_RECHECK/TEST/RETEST/Handoff evidence ACROSS all Jobs and Chats for this defect. Reconstruct the ordered attempts with retest-history.ts; never trust a conversation counter, unpersisted evidence or a new Job name as a reset. History completeness is UNKNOWN until independent source readback is checked.',
      '1b. Only count an authorized Coder patch at an exact revision with Goal Recheck followed by a distinct independent Tester Run, original user trigger + impacted regressions, exact target-bound persisted Verification and observable product FAIL. CI green/Coder selfcheck and Host UNVERIFIED/ENVIRONMENT_FAILURE do not count; Tester PASS alone can close the defect.',
      '2. Map the real path: user action → public tool/entrypoint → caller/router → target → downstream state/config/storage → process/connector/host → observed output.',
      '3. Inspect credible sibling/legacy paths and generated/cached registrations; classify plausible root causes with evidence, not guesses.',
      '4. After the FIRST/SECOND completed PRODUCT_FAILURE repair+Tester cycle, retain the exact history and reconsider cause. After the THIRD failed full cycle: STOP ordinary patch #4; load this debugging skill if genuinely available and move to advanced causal diagnosis. Evidence-backed race/architectural faults may escalate earlier. No automatic fourth patch or new Bug-Fixer Agent.',
      '4a. Trace input → public entrypoint → EVERY relevant child/callback → dispatch/wait/queue/state/resource → tool/client schema → connector/Host/deployment → observable result. Identify the FIRST evidence-backed divergence, not merely the final error emitter; distinguish Product, wrong tool, stale deployment, test oracle/mocks, schema and Host faults.',
      '5. Add a behavior oracle that detects the original fault: known-bad turns RED; intended behavior GREEN. Do not substitute mocks for the critical boundary.',
      '6. Patch within the active Job scope. Run relevant CI, executable call-chain simulation and lifecycle restart simulation where applicable.',
      '7. If a real host/connector is required, live acceptance remains UNVERIFIED until executed; a registered but unexposed tool is not passing behavior.',
      '8. Produce an Advanced Defect Report using retest-history.ts: original reproduction, exactly observed Coder revisions and independent Tester evidence, scenarios, causal timeline/child flows/waits, first evidenced divergence or UNKNOWN, hypotheses with confidence and discriminating experiments, smallest proposed correction, regressions and remaining unknowns.',
      '9. Persist the report only via EXISTING authorized Project Memory Knowledge/Evidence route with CAS/readback and immutable prior Verification refs. A report or helper result never authorizes a fourth patch. Architecture-level correction returns to the existing descriptive proposal/combined Reviewer and explicit Coder scope authority; then separate Tester rerun. U-E scenario execution is required for integration acceptance but NOT imported into this skill.',
    ].join('\n'),
  }
