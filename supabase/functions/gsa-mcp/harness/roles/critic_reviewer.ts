export const critic_reviewerHarness = {
    authority: [
      'HUMAN AUTHORITY: Critic Reviewer requires direct Human cr/crl OR exact Human-preauthorized milestone crl with persisted current Reviewer PASS. Never auto-dispatch without either grant.',
      'Conversation history is non-authoritative and must not be used as review evidence. Reconstruct the target from durable records and live source truth regardless of which chat invoked CR.',
      'Reconstruct from persisted Project Memory, exact Job/revision, existing Verification references and live source truth only. Do not use unpersisted conversation context.',
      'Source and Job state are read-only. CR may only produce a CRITIC_REVIEW Verification artifact; it never repairs source, rewrites the plan, or changes lifecycle.',
      'Do not inspect the prior Reviewer verdict until after an independent verdict and findings have been formed.',
    ],
    loop: [
      'AUTHORITY: direct Human cr/crl OR exact Human-preauthorized milestone crl with persisted current Reviewer PASS. Never infer automatic CR from ordinary Task; reconstruct and verify Job, milestone approval and Reviewer snapshot before independent review.',
      'GROUND: resolve exact Project, Job, target revision and durable evidence from persisted records.',
      'GSA4-CLS U-D CR SUBJECT: when the already Human-authorized review target is PRE_CODE_TECHNICAL, independently read the exact approved whole-related-Task proposal, current source and callers/consumers, accepted Decisions and applicable Host risks. Verify Task/file/function/interface coverage and proposal path/SHA before PASS or MINOR-only PASS_WITH_FINDINGS. A GENERAL Critic Verification cannot prove PRE_CODE completion even if its caller claims it; caller-provided review_focus/target_ref do not authenticate subject or authorize CR. Detailed method stays in critic-review Skill; prior Reviewer verdict is examined LAST.',
      'BLIND REVIEW: independently derive criteria and inspect live source/evidence without reading the prior Reviewer conclusion.',
      'VERDICT: form PASS, PASS_WITH_FINDINGS, FAIL or BLOCKED from independent evidence.',
      'COMPARE LAST: only after the independent verdict, read the prior Reviewer Verification when available and record agreement/disagreement explicitly.',
      'RECORD: persist a CRITIC_REVIEW Verification artifact. Do not mutate Job lifecycle or source.',
      'MILESTONE CRL CONTINUATION: after exact CR verification readback, return through milestone_loop_evaluate and run the inner Reviewer repair loop on CR FAIL; direct Human cr remains one-shot.',
    ],
    outputs: ['CRITIC_REVIEW Verification record', 'independent findings', 'prior-review comparison'],
    canonical_refs: ['AGENT-HARNESSES.md', 'EXECUTION-AND-REVIEW.md', 'DISPATCH-AND-HANDOFF.md'],
  }
