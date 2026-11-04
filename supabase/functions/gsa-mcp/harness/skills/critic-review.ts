export const criticReviewSkill = {
    description: 'Human-invoked/preapproved Critic Review: independently inspect durable evidence before prior Reviewer.',
    body: [
      '# Critic Review',
      'CR is an independent peer-review path only when Human invokes it OR a milestone explicitly Human-approved for crl is reached with current Reviewer PASS.',
      '',
      '1. Require direct Human invocation via cr/crl OR Human-approved current Job milestone marked crl with exact Reviewer PASS Verification; verify durable Job/snapshot readback before CR. No global auto CR.',
      '2. Ignore conversation history as evidence. Reconstruct the review target from durable Project Memory, exact Job/revision, Verification artifacts and live source truth.',
      '3. Do not read or rely on the prior Reviewer verdict until independent criteria, findings and verdict are already formed.',
      '4. Then compare against the prior Reviewer and record agreement/disagreement with evidence.',
      '5. CR is read-only for source and Job state. Persist only CRITIC_REVIEW evidence.',
      '6. CR result never mutates Job lifecycle itself. After CR PASS, Orchestrator may continue an approved AUTO milestone; HUMAN milestones still require a Human decision.',
    ].join('\n'),
  }

// U-D: special subject for the existing independent Critic, without new CR authority.
criticReviewSkill.body += [
  '',
  'PRE_CODE_TECHNICAL (U-D): review the complete connected descriptive Markdown design, never a planning-review substitute or a Reviewer-of-Reviewer.',
  '- Require the SAME Human cr/crl or Human-approved milestone authority. Reconstruct exact proposal revision, complete related Task IDs, accepted decisions, existing owner/call graph and host/source evidence independently before any prior Reviewer opinion.',
  '- Check whole-related Task coverage, precise CREATE/MODIFY/REUSE_AS_IS/KEEP/REMOVE paths, existing vs proposed functions, callers, actually consumed interfaces, missing input/output and source evidence; missing material source is UNKNOWN, not PASS.',
  '- Detect duplicate cross-Task services, unused interfaces, cycles, unneeded gates/Registry and disproportionate SMALL FUNCTION -> BIG SOLUTION -> LARGER SYSTEM IMPACT. A second DWG in the same AutoCAD process is not crash isolation; UNDO is not rollback of external files or process crashes. Prefer simple native/manual solutions when adequate.',
  '- Fixable design defects are CHANGES_REQUIRED via the existing CR FAIL with file/function-specific findings. Review the repaired SAME whole proposal again. Material unresolved host risk is HUMAN_ESCALATION via BLOCKED. Do not introduce another CR status enum or gate.',
  '- Only after independent PASS/PASS_WITH_FINDINGS with MINOR-only findings and immutable exact Verification readback, provide the corrected reviewed file/function/interface/caller inventory to Coder as an implementation reference, not an automatically created technical Registry or permission to edit source.',
].join('\n')
