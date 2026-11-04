export const reviewEvidenceSkill = {
    description: 'Review exact diff/revision and evidence: actionable findings, no source edits.',
    body: [
      '# Review Evidence',
      '- Bind review to one exact target revision.',
      '- Decide whether the review is small enough for one bounded pass; for large review, make a compact review map and close meaningful sections before consolidation.',
      '- Read the actual diff/changed-file evidence, not only current file snapshots.',
      '- Derive criteria from the approved requirement/contract before reading the Coder self-assessment.',
      '- Review in the order requirements → contract → actual diff → relationship impact → relevant surrounding logic → evidence.',
      '- Trace cross-file and cross-repo read-only context when a local hunk cannot establish correctness.',
      '- Findings need a concrete claim, evidence/failure scenario, severity and routing.',
      '- Prefer no finding over a speculative low-confidence warning.',
      '- For new/changed high-risk tests, escaped false-green regressions, altered harness/fixtures/CI or release gates, review test assertions, mock boundaries, failure propagation and mutation RED evidence at the checkpoint. Do not re-review unchanged trusted test logic on every routine rerun.',
      '- Never repair source in Reviewer role.',
      '- A new target revision invalidates the old review result for merge coverage.',
    ].join('\n'),
  }
