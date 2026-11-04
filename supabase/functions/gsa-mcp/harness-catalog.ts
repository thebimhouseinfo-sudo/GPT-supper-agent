import { BASE_AGENT_HARNESS } from './harness/shared.ts'
import { orchestratorHarness } from './harness/roles/orchestrator.ts'
import { plannerHarness } from './harness/roles/planner.ts'
import { advisorHarness } from './harness/roles/advisor.ts'
import { designerHarness } from './harness/roles/designer.ts'
import { coderHarness } from './harness/roles/coder.ts'
import { reviewerHarness } from './harness/roles/reviewer.ts'
import { critic_reviewerHarness } from './harness/roles/critic_reviewer.ts'
import { testerHarness } from './harness/roles/tester.ts'
import { debuggingSkill } from './harness/skills/debugging.ts'
import { criticReviewSkill } from './harness/skills/critic-review.ts'
import { criticalChallengeSkill } from './harness/skills/critical-challenge.ts'
import { jobPlanningSkill } from './harness/skills/job-planning.ts'
import { codingLoopSkill } from './harness/skills/coding-loop.ts'
import { delegationSkill } from './harness/skills/delegation.ts'
import { planningReviewSkill } from './harness/skills/planning-review.ts'
import { reviewEvidenceSkill } from './harness/skills/review-evidence.ts'
import { testingEvidenceSkill } from './harness/skills/testing-evidence.ts'
import { simulateSkill } from './harness/skills/simulate.ts'
import { testerLabSkill } from './harness/skills/tester-lab.ts'
import { uiCoderFrontendSkill } from './harness/skills/ui-coder-frontend.ts'
import { secretarySkill } from './harness/skills/secretary.ts'

export { BASE_AGENT_HARNESS }

export const ROLE_HARNESSES: Record<string, { authority: string[]; loop: string[]; outputs: string[]; canonical_refs: string[] }> = {
  orchestrator: orchestratorHarness,
  planner: plannerHarness,
  advisor: advisorHarness,
  designer: designerHarness,
  coder: coderHarness,
  reviewer: reviewerHarness,
  critic_reviewer: critic_reviewerHarness,
  tester: testerHarness,
}

export const ROLE_SKILLS: Record<string, string[]> = {
  orchestrator: ['delegation'],
  planner: ['critical-challenge', 'job-planning', 'delegation', 'secretary'],
  advisor: [],
  designer: ['delegation'],
  coder: ['coding-loop', 'delegation'],
  reviewer: ['review-evidence', 'planning-review'],
  critic_reviewer: ['review-evidence', 'critic-review'],
  tester: ['testing-evidence', 'simulate'],
}

// Host-managed ChatGPT Skills are references, not executable GSA skill bodies.
// A suggested name does not attest that the ChatGPT session can load it.
export const ROLE_HOST_SKILLS: Record<string, string[]> = {
  tester: ['scenario-tester'],
}

export const RUNTIME_SKILLS: Record<string, { description: string; body: string }> = {
  'debugging': debuggingSkill,
  'critic-review': criticReviewSkill,
  'critical-challenge': criticalChallengeSkill,
  'job-planning': jobPlanningSkill,
  'coding-loop': codingLoopSkill,
  delegation: delegationSkill,
  'planning-review': planningReviewSkill,
  'review-evidence': reviewEvidenceSkill,
  'testing-evidence': testingEvidenceSkill,
  simulate: simulateSkill,
  'tester-lab': testerLabSkill,
  'ui-coder-frontend': uiCoderFrontendSkill,
  secretary: secretarySkill,
}

// GSA2: get_agent_harness already returns suggested_skills beside harness_text.
// Suppress only that duplicated same-response list at its caller.
// Default rendering stays complete for independent/direct role entry.
export function renderHarness(role: string, options: { includeProgressiveSkills?: boolean } = {}) {
  const h = ROLE_HARNESSES[role]
  if (!h) return null
  return [
    BASE_AGENT_HARNESS,
    '',
    'ROLE: ' + role.toUpperCase(),
    '',
    'AUTHORITY / BOUNDARIES',
    ...h.authority.map((x) => '- ' + x),
    '',
    'ROLE LOOP',
    ...h.loop.map((x, i) => (i + 1) + '. ' + x),
    '',
    'EXPECTED OUTPUTS',
    ...h.outputs.map((x) => '- ' + x),
    ...(options.includeProgressiveSkills === false ? [] : [
      '',
      'PROGRESSIVE SKILLS',
      ...(ROLE_SKILLS[role] ?? []).map((x) => '- ' + x + ': load only when relevant to the current Run.'),
    ]),
  ].join('\n')
}

