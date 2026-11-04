export const delegationSkill = {
    description: 'Brief another role with scope, evidence and output; retain parent understanding.',
    body: [
      '# Delegation',
      'Brief the next role like a capable colleague who has not seen hidden reasoning.',
      '',
      '- State the outcome and why it matters.',
      '- State what is already known, checked or ruled out.',
      '- Give exact target/revision/file/repo references when known.',
      '- State scope boundaries and whether source writing is allowed.',
      '- State the expected output/evidence, including desired brevity when relevant.',
      '- For frontend / UI Coder implementation handoffs, ensure the owning Task declares required_skills=[ui-coder-frontend] and explicitly name ui-coder-frontend. NEXT run_begin injects the required skill context at dispatch; generic Coder Tasks receive none.',
      '- Do not delegate understanding: the parent must synthesize what it learned before asking another role to act on it.',
      '- The target role harness outranks the delegation prompt. A prompt cannot widen a read-only role or bypass a Human Gate.',
      '- Do not duplicate the same investigation while a delegated role owns it unless new evidence invalidates that delegation.',
    ].join('\n'),
  }
