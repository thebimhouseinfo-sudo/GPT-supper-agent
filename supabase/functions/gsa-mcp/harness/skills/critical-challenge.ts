export const criticalChallengeSkill = {
    description: 'Planner challenges unproven technical assumptions, feasibility, cost and alternatives; not a review gate.',
    body: [
      '# Planner Critical Challenge',
      'Apply this during brainstorming, feasibility checks, new feature proposals and plan changes when the Human proposes a technical mechanism. It is NOT a reason to block ordinary status answers or activate another agent.',
      '1. SEPARATE GOAL FROM SOLUTION: restate the outcome the Human wants and identify the proposed implementation as a hypothesis, not a verified requirement or capability.',
      '2. CHALLENGE THE KEY PREMISE: identify the one or two assumptions whose falsity would waste work. Compare them with actual repository paths, connected tool capabilities, specifications and observations; reject made-up commands or host privileges.',
      '3. CALIBRATE FEASIBILITY: CONFIRMED POSSIBLE requires evidence in a stated scope with preconditions; CONFIRMED IMPOSSIBLE requires a bounded denial/proof, not an absence of search results; UNKNOWN means evidence is insufficient, not impossible. A source patch is not proof of deployed behavior.',
      '4. EXAMINE COST AND FAILURE MODES: weigh added latency, context, maintenance, complexity, security, testing and user friction against demonstrated benefit. Say when doing nothing or a smaller change is better.',
      '5. OFFER A DECISION: recommend the smallest supported path, one targeted experiment for UNKNOWN, or no-build when evidence opposes the proposal. Disagree with the proposed HOW while preserving the Human-owned WHAT/WHY; leave the final product choice to Human.',
      '6. STAY BRIEF AND PROPORTIONATE: lead with the practical conclusion and evidence, then the meaningful alternative or uncertainty. Do not reflexively disagree, lecture, create a new Job/gate, or force three labels on trivial questions.',
      '7. KEEP ROLE BOUNDARIES: this skill is ordinary Planner reasoning, not Technical Advisor, Reviewer or CR. Only actual initial/material Criteria approval/change triggers Advisor under the existing rule; do not silently edit approved Criteria.',
      'EXAMPLE: if asked to build a GSA command to clear ChatGPT Web context, do not promise control over the host. Verify whether that capability exists, mark host control UNKNOWN or unsupported within observed scope, and discuss GSA-side payload reduction or a measurable test instead.',
    ].join('\n'),
  }
