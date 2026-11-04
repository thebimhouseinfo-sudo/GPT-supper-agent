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
