/**
 * U-F: read-only reconstruction of defect repair/retest history.
 *
 * Inputs MUST be assembled from the existing, independently read-back
 * Project Memory Run/GOAL_RECHECK/TEST(RETEST)/Handoff records, across all
 * Jobs/chats. They are not claims of storage authentication merely because
 * these fields are present. No new Job, database, permission gate or MCP tool.
 */
export type DefectOrigin = {
  project_id: string
  original_failure_ref: string
  original_revision: string
  actual_error: string
  user_visible_symptom: string
  original_reproduction: string
  required_surface: 'STATIC' | 'SIMULATED' | 'REAL_HOST'
}
export type DefectAttempt = {
  origin: DefectOrigin
  job_id?: string // informational only; never part of the identity
  chat_id?: string // informational only; never part of the identity
  bug_title?: string // informational only; never part of the identity
  patch: {
    coder_role: string
    coder_run_id: string
    authorization_ref: string
    revision: string
    goal_recheck_ref: string
    goal_recheck_revision: string
  }
  tester: {
    producer: string
    run_id: string
    verification_ref: string
    verification_readback_sha: string
    target_revision: string
    result: string
    failure_class?: string
    original_trigger_replayed: boolean
    affected_regressions_replayed: boolean
    execution_surface: 'STATIC' | 'SIMULATED' | 'REAL_HOST'
    evidence_refs: string[]
    tested_at: string
    scenario_seed_ref?: string
  }
}
export type CausalEvent = {
  step: string
  expected: string
  observed: string
  evidence_refs: string[]
  diverged: boolean
  child_flow?: string
  wait_or_state?: string
}
export type Hypothesis = {
  cause: string
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  supporting_evidence: string[]
  distinguishing_experiment: string
}
const nonempty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const sha = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{40}$/.test(v)
const surfaceRank: Record<DefectOrigin['required_surface'], number> = {
  STATIC: 0, SIMULATED: 1, REAL_HOST: 2,
}
const norm = (s: string) => s.trim().replace(/\s+/g, ' ')
export function defectIdentity(origin: DefectOrigin): string | null {
  if (!origin || !nonempty(origin.project_id) || !nonempty(origin.original_failure_ref) ||
      !sha(origin.original_revision) || !nonempty(origin.actual_error) ||
      !nonempty(origin.user_visible_symptom) || !nonempty(origin.original_reproduction) ||
      !Object.hasOwn(surfaceRank, origin.required_surface)) return null
  return JSON.stringify([
    norm(origin.project_id), norm(origin.original_failure_ref),
    origin.original_revision, norm(origin.actual_error),
    norm(origin.user_visible_symptom), norm(origin.original_reproduction),
  ])
}
function completeRetest(attempt: DefectAttempt, origin: DefectOrigin): string | null {
  const p = attempt.patch, t = attempt.tester
  if (!p || p.coder_role !== 'coder' || !nonempty(p.coder_run_id) ||
      !nonempty(p.authorization_ref) || !sha(p.revision) ||
      !nonempty(p.goal_recheck_ref) || p.goal_recheck_revision !== p.revision) {
    return 'CODER_PATCH_OR_GOAL_RECHECK_NOT_PROVEN'
  }
  if (!t || t.producer !== 'tester' || !nonempty(t.run_id) ||
      t.run_id === p.coder_run_id || !nonempty(t.verification_ref) ||
      !sha(t.verification_readback_sha) || t.target_revision !== p.revision ||
      !Array.isArray(t.evidence_refs) || !t.evidence_refs.some(nonempty) ||
      !t.evidence_refs.includes(origin.original_failure_ref) ||
      !t.original_trigger_replayed || !t.affected_regressions_replayed ||
      !Object.hasOwn(surfaceRank,t.execution_surface) ||
      surfaceRank[t.execution_surface] < surfaceRank[origin.required_surface] ||
      !nonempty(t.tested_at) || !Number.isFinite(Date.parse(t.tested_at))) {
    return 'INDEPENDENT_TESTER_REPLAY_OR_READBACK_NOT_PROVEN'
  }
  if (t.result === 'UNVERIFIED' || t.result === 'BLOCKED' ||
      t.failure_class === 'ENVIRONMENT_FAILURE' || t.failure_class === 'INTEGRATION_NOT_READY' ||
      t.failure_class === 'NOT_READY') return 'UNVERIFIED_NOT_PRODUCT_FAILURE'
  if (t.result === 'FAIL' && t.failure_class !== 'PRODUCT_FAILURE') {
    return 'FAIL_IS_NOT_CLASSIFIED_PRODUCT_FAILURE'
  }
  if (t.result === 'PASS' && t.failure_class) return 'PASS_WITH_FAILURE_CLASS'
  if (t.result !== 'FAIL' && t.result !== 'PASS') return 'NO_TESTER_VERDICT'
  return null
}
export function assessDefectRetests(input: {
  origin: DefectOrigin
  attempts: DefectAttempt[]
  history_complete: boolean
  history_evidence_refs?: string[]
  early_escalation_evidence?: string[]
}) {
  const key = defectIdentity(input?.origin)
  const excluded: Array<{ revision: string | null, reason: string }> = []
  const completed: DefectAttempt[] = []
  const seen = new Map<string, DefectAttempt>()
  let conflicting = false
  if (!key) return {
    schema: 'uf-retest-history/v1' as const, advisory_only: true as const,
    identity: null, status: 'READ_HISTORY', failed_cycles: 0,
    ordinary_fourth_patch_allowed: false as const,
    debugging_skill: null, completed, excluded: [{ revision: null, reason: 'INVALID_ORIGIN' }],
    history_complete: false, advanced_report_required: false,
  }
  // Read-time join, never by Job, chat, title or this function's process memory.
  for (const attempt of Array.isArray(input.attempts) ? input.attempts : []) {
    if (defectIdentity(attempt?.origin) !== key) continue
    const reason = completeRetest(attempt, input.origin)
    if (reason) {
      excluded.push({revision: sha(attempt?.patch?.revision) ? attempt.patch.revision : null,reason})
      continue
    }
    const previous = seen.get(attempt.patch.revision)
    if (previous) {
      if (previous.tester.result !== attempt.tester.result ||
          previous.tester.verification_ref !== attempt.tester.verification_ref) conflicting = true
      continue // Same patch cannot be counted as another repair cycle.
    }
    seen.set(attempt.patch.revision,attempt)
    completed.push(attempt)
  }
  completed.sort((a,b) => Date.parse(a.tester.tested_at)-Date.parse(b.tester.tested_at))
  const failed_cycles = completed.filter(x => x.tester.result === 'FAIL').length
  const host_blocked = excluded.some(x => x.reason === 'UNVERIFIED_NOT_PRODUCT_FAILURE' ||
    x.reason === 'INDEPENDENT_TESTER_REPLAY_OR_READBACK_NOT_PROVEN')
  const early = (input.early_escalation_evidence ?? []).some(nonempty)
  const historical = input.history_complete === true &&
    Array.isArray(input.history_evidence_refs) && input.history_evidence_refs.some(nonempty)
  const status = conflicting ? 'RECONCILE' :
    failed_cycles >= 3 ? 'ROOT_CAUSE_REQUIRED' :
    early ? 'ROOT_CAUSE_REQUIRED' :
    !historical ? 'READ_HISTORY' :
    host_blocked ? 'AWAIT_TESTER' :
    completed.at(-1)?.tester.result === 'PASS' ? 'CLOSED_BY_TESTER' :
    excluded.length ? 'AWAIT_TESTER' : 'CONTINUE_REPAIR'
  return {
    schema: 'uf-retest-history/v1' as const,
    advisory_only: true as const,
    identity: key,
    status,
    failed_cycles,
    ordinary_fourth_patch_allowed: false as const, // NEVER an auto-grant.
    ordinary_repair_may_be_considered: status === 'CONTINUE_REPAIR' && failed_cycles < 3,
    debugging_skill: status === 'ROOT_CAUSE_REQUIRED' ? 'debugging' : null,
    completed,
    excluded,
    history_complete: historical,
    advanced_report_required: status === 'ROOT_CAUSE_REQUIRED',
  }
}
/**
 * Evidence template, not a finding of root cause or authorization to patch.
 * Persist only through the existing authorized Project Memory path, with CAS
 * and readback, preserving prior immutable Verification records.
 */
export function advancedDefectReport(input: {
  origin: DefectOrigin
  assessment: ReturnType<typeof assessDefectRetests>
  causal_events?: CausalEvent[]
  hypotheses?: Hypothesis[]
  proposed_correction?: string
  regression_plan?: string[]
  unknowns?: string[]
}) {
  const {origin, assessment} = input
  const first = (input.causal_events ?? []).find(e => e.diverged === true &&
    Array.isArray(e.evidence_refs) && e.evidence_refs.some(nonempty))
  const line = (value: unknown) => nonempty(value) ? value : 'UNKNOWN — requires evidence'
  const out = [
    '# Advanced Defect Report — U-F',
    'Status: ' + assessment.status + ' (read-only assessment; not a product PASS or patch authorization)',
    'Identity: ' + line(assessment.identity),
    'Original error: ' + line(origin.actual_error),
    'User-visible symptom: ' + line(origin.user_visible_symptom),
    'Original reproduction: ' + line(origin.original_reproduction),
    'Original failing revision: ' + line(origin.original_revision),
    'Original failure evidence: ' + line(origin.original_failure_ref),
    'Required execution surface: ' + origin.required_surface,
    'History complete/read-back: ' + (assessment.history_complete ? 'asserted — independently verify supplied refs' : 'NO / UNKNOWN'),
    'Failed full patch + independent Tester cycles: ' + assessment.failed_cycles,
    '',
    '## Attempts — exact revisions and independent evidence',
    ...(assessment.completed.length ? assessment.completed.map((a,i) =>
      (i+1) + '. Patch=' + a.patch.revision + ' CoderRun=' + a.patch.coder_run_id +
      ' authorization=' + a.patch.authorization_ref + ' GoalRecheck=' + a.patch.goal_recheck_ref +
      ' TesterRun=' + a.tester.run_id + ' result=' + a.tester.result +
      ' verification=' + a.tester.verification_ref + ' readbackSHA=' + a.tester.verification_readback_sha +
      ' surface=' + a.tester.execution_surface + ' seed=' + (a.tester.scenario_seed_ref ?? 'UNKNOWN') +
      ' evidence=' + a.tester.evidence_refs.join(', ')
    ) : ['No complete independent cycles proven.']),
    ...(assessment.excluded.length ? ['Excluded or UNVERIFIED observations: ' +
      assessment.excluded.map(x => (x.revision ?? 'UNKNOWN') + ':' + x.reason).join(' | ')] : []),
    '',
    '## Causal timeline — input → entrypoint → child flows → queue/state → tool → Host → observable',
    ...((input.causal_events ?? []).length ? (input.causal_events ?? []).map((e,i) =>
      (i+1) + '. ' + e.step + ' / child=' + (e.child_flow ?? 'UNKNOWN') +
      ' / wait-state=' + (e.wait_or_state ?? 'UNKNOWN') + ' / expected=' + e.expected +
      ' / observed=' + e.observed + ' / evidence=' + e.evidence_refs.join(', ')) :
      ['UNKNOWN — causal trace not yet verified']),
    'First evidenced divergent event: ' + (first ? first.step + ' (' + first.evidence_refs.join(', ') + ')' :
      'UNKNOWN — do not infer the emitting tool is root cause'),
    '',
    '## Hypotheses, confidence, distinguishing experiments',
    ...((input.hypotheses ?? []).length ? (input.hypotheses ?? []).map(h =>
      '- ' + h.cause + ' | ' + h.confidence + ' | evidence: ' +
      h.supporting_evidence.join(', ') + ' | distinguish: ' + h.distinguishing_experiment) :
      ['- UNKNOWN — classify product/tool/schema/deployment/host/mock/race causes with discriminating probes']),
    '',
    '## Lowest-risk proposed correction (proposal only, no automatic patch)',
    line(input.proposed_correction),
    '',
    '## Regression plan',
    ...((input.regression_plan ?? []).length ? (input.regression_plan ?? []).map(x=>'- '+x) :
      ['- Original user trigger; every affected child flow; impacted prior PASS scenarios on exact new revision']),
    '',
    '## Remaining unknowns',
    ...((input.unknowns ?? []).length ? (input.unknowns ?? []).map(x=>'- '+x) :
      ['- Host readiness, source/Runtime revision readback, first causal divergence if not independently observed']),
    '',
    'Next: stop blind ordinary patch #4; use existing debugging skill, scope authority and Reviewer',
    'for a new causal proposal, then separately authorized Coder correction and independent Tester rerun.',
  ]
  return out.join('\n')
}
